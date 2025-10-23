// apps/api/src/routes/admin.ts
import express from 'express';
import { supabase, logAudit } from '../lib/supabase.js';
import { GoogleSheetsService } from '../services/google-sheets.js';
import { PDFGenerator } from '../services/pdf-generator.js';
import { EmailService } from '../services/email.js';
import { z } from 'zod';
import crypto from 'crypto';

const router = express.Router();

// Simple auth middleware (check for valid Supabase session)
const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    (req as any).user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Sync Google Sheets
router.post('/sync-google', requireAuth, async (req, res) => {
  try {
    console.log('Starting Google Sheets sync...');
    
    // Check environment variables
    if (!process.env.GOOGLE_SPREADSHEET_ID) {
      return res.status(500).json({ 
        error: 'GOOGLE_SPREADSHEET_ID environment variable is not set' 
      });
    }
    
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      return res.status(500).json({ 
        error: 'GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not set' 
      });
    }

    console.log('Spreadsheet ID:', process.env.GOOGLE_SPREADSHEET_ID);
    
    let sheetsService;
    try {
      sheetsService = new GoogleSheetsService();
    } catch (error: any) {
      console.error('Failed to initialize Google Sheets service:', error);
      return res.status(500).json({ 
        error: 'Failed to initialize Google Sheets service',
        details: error.message 
      });
    }
    
    // Get last synced row
    const { data: state } = await supabase
      .from('system_state')
      .select('value')
      .eq('key', 'last_synced_row')
      .single();

    const lastRow = state?.value?.row_index || 0;
    console.log('Last synced row:', lastRow);
    
    // Fetch new rows
    let newRows;
    try {
      newRows = await sheetsService.getNewRows(lastRow);
      console.log('Fetched rows:', newRows.length);
    } catch (error: any) {
      console.error('Failed to fetch rows from Google Sheets:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch data from Google Sheets',
        details: error.message,
        hint: 'Check if the service account has access to the spreadsheet and the sheet name is "Event"'
      });
    }
    
    if (newRows.length === 0) {
      return res.json({ message: 'No new rows to sync', count: 0 });
    }

    // Insert into purchase_requests
    const requests = newRows.map(row => ({
      sheet_row_id: row.rowIndex,
      name: row.fullName,
      email: row.email,
      phone: row.phone,
      event_name: row.eventName,
      qty: row.quantity,
      seat_tier: row.seatTier,
      proof_url: row.proofUrl,
      notes: row.notes,
      status: 'pending_review'
    }));

    const { error: insertError } = await supabase
      .from('purchase_requests')
      .upsert(requests, { onConflict: 'sheet_row_id', ignoreDuplicates: false });

    if (insertError) throw insertError;

    // Update last synced row
    const maxRow = Math.max(...newRows.map(r => r.rowIndex));
    await supabase
      .from('system_state')
      .upsert({
        key: 'last_synced_row',
        value: { row_index: maxRow },
        updated_at: new Date().toISOString()
      });

    await logAudit('sync_google_sheets', 'purchase_requests', undefined, { count: newRows.length }, (req as any).user.id);

    res.json({ message: 'Sync completed', count: newRows.length });
  } catch (error: any) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get requests
router.get('/requests', requireAuth, async (req, res) => {
  try {
    const { status, search, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('purchase_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({ data, count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single request
router.get('/requests/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('purchase_requests')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Not found' });

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Approve request
router.post('/requests/:id/approve', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    // Get request
    const { data: request, error: fetchError } = await supabase
      .from('purchase_requests')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;
    if (!request) return res.status(404).json({ error: 'Not found' });
    if (request.status !== 'pending_review') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    // Generate tickets
    const tickets = [];
    const pdfGenerator = new PDFGenerator();
    const pdfBuffers = [];

    for (let i = 0; i < request.qty; i++) {
      const token = crypto.randomUUID();
      
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          event_name: request.event_name,
          purchaser_name: request.name,
          purchaser_email: request.email,
          seat_tier: request.seat_tier,
          token,
          status: 'valid',
          purchase_request_id: request.id
        })
        .select()
        .single();

      if (ticketError) throw ticketError;
      
      tickets.push(ticket);
      const pdf = await pdfGenerator.generateTicketPDF(ticket);
      pdfBuffers.push(pdf);
    }

    // Send emails
    const emailService = new EmailService();
    await emailService.sendTickets(tickets, pdfBuffers);

    // Update request
    const { error: updateError } = await supabase
      .from('purchase_requests')
      .update({
        status: 'approved',
        reviewer_id: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', request.id);

    if (updateError) throw updateError;

    await logAudit('approve_request', 'purchase_requests', request.id, { ticket_count: tickets.length }, userId);

    res.json({ message: 'Request approved', tickets });
  } catch (error: any) {
    console.error('Approve error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reject request
router.post('/requests/:id/reject', requireAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = (req as any).user.id;

    const { data: request, error: fetchError } = await supabase
      .from('purchase_requests')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;
    if (!request) return res.status(404).json({ error: 'Not found' });

    // Update request
    const { error: updateError } = await supabase
      .from('purchase_requests')
      .update({
        status: 'rejected',
        reviewer_id: userId,
        notes: reason || request.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', request.id);

    if (updateError) throw updateError;

    // Send rejection email
    const emailService = new EmailService();
    await emailService.sendRejectionEmail(request.email, request.name, reason);

    await logAudit('reject_request', 'purchase_requests', request.id, { reason }, userId);

    res.json({ message: 'Request rejected' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Stats
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const [requests, tickets] = await Promise.all([
      supabase.from('purchase_requests').select('status', { count: 'exact', head: true }),
      supabase.from('tickets').select('status', { count: 'exact', head: true })
    ]);

    const requestsByStatus = await Promise.all([
      supabase.from('purchase_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
      supabase.from('purchase_requests').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('purchase_requests').select('*', { count: 'exact', head: true }).eq('status', 'rejected')
    ]);

    const ticketsByStatus = await Promise.all([
      supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'valid'),
      supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'redeemed'),
      supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'cancelled')
    ]);

    res.json({
      total_requests: requests.count || 0,
      pending_requests: requestsByStatus[0].count || 0,
      approved_requests: requestsByStatus[1].count || 0,
      rejected_requests: requestsByStatus[2].count || 0,
      total_tickets: tickets.count || 0,
      valid_tickets: ticketsByStatus[0].count || 0,
      redeemed_tickets: ticketsByStatus[1].count || 0,
      cancelled_tickets: ticketsByStatus[2].count || 0
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;