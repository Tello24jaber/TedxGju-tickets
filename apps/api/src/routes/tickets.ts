import express from 'express';
import { supabase, logAudit } from '../lib/supabase.js';
import { PDFGenerator } from '../services/pdf-generator.js';
import { EmailService } from '../services/email.js';

const router = express.Router();

// Auth middleware
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

// Search tickets
router.get('/', requireAuth, async (req, res) => {
  try {
    const { search, status, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('tickets')
      .select('*', { count: 'exact' })
      .order('issued_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`purchaser_name.ilike.%${search}%,purchaser_email.ilike.%${search}%,id.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({ data, count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get ticket PDF (public for email links)
router.get('/:id/pdf', async (req, res) => {
  try {
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const pdfGenerator = new PDFGenerator();
    const pdf = await pdfGenerator.generateTicketPDF(ticket);

    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="tedxgju-ticket-${ticket.id.substring(0, 8)}.pdf"`);
    res.send(pdf);
  } catch (error: any) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Resend ticket
router.post('/:id/resend', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const pdfGenerator = new PDFGenerator();
    const pdf = await pdfGenerator.generateTicketPDF(ticket);

    // Try to send email, but don't fail if it doesn't work
    try {
      const emailService = new EmailService();
      await emailService.sendTickets([ticket], [pdf]);
      console.log('Ticket resent successfully via email');
    } catch (emailError: any) {
      console.error('Failed to resend ticket via email:', emailError.message);
      // Return error to user since this is an explicit resend request
      return res.status(500).json({ 
        error: 'Email service unavailable', 
        details: 'Please configure email settings in .env file. Check API logs for details.' 
      });
    }

    await logAudit('resend_ticket', 'tickets', ticket.id, {}, userId);

    res.json({ message: 'Ticket resent' });
  } catch (error: any) {
    console.error('Resend error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel ticket
router.post('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const { data: ticket, error: fetchError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    if (ticket.status === 'cancelled') {
      return res.status(400).json({ error: 'Ticket already cancelled' });
    }

    const { error: updateError } = await supabase
      .from('tickets')
      .update({ status: 'cancelled' })
      .eq('id', req.params.id);

    if (updateError) throw updateError;

    await logAudit('cancel_ticket', 'tickets', ticket.id, {}, userId);

    res.json({ message: 'Ticket cancelled' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
