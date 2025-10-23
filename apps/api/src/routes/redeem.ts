import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { supabase, logAudit } from '../lib/supabase.js';
import type { RedeemRequest, RedeemResponse } from '../types';

const router = express.Router();

// Rate limiter for redeem endpoint
const redeemLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  message: 'Too many redemption attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Redeem ticket (atomic one-scan validation)
router.post('/redeem', redeemLimiter, async (req, res) => {
  try {
    const { token }: RedeemRequest = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    // First, try to find the ticket by full token OR by token prefix (first 8 chars from PDF code)
    let ticketToken = token;
    
    // If token is short (8 chars or less), search by prefix
    if (token.length <= 8) {
      const { data: tickets } = await supabase
        .from('tickets')
        .select('token')
        .ilike('token', `${token}%`)
        .limit(2); // Check if multiple matches

      if (!tickets || tickets.length === 0) {
        await logAudit('redeem_failed', 'tickets', undefined, { token, reason: 'invalid' });
        return res.json({
          success: false,
          message: 'Invalid ticket code'
        } as RedeemResponse);
      }

      if (tickets.length > 1) {
        await logAudit('redeem_failed', 'tickets', undefined, { token, reason: 'ambiguous' });
        return res.json({
          success: false,
          message: 'Ticket code is ambiguous, please scan QR code'
        } as RedeemResponse);
      }

      ticketToken = tickets[0].token;
    }

    // Atomic update: only succeeds if status is 'valid'
    const { data: ticket, error } = await supabase
      .from('tickets')
      .update({
        status: 'redeemed',
        redeemed_at: new Date().toISOString(),
        redeemed_by: req.ip || 'unknown'
      })
      .eq('token', ticketToken)
      .eq('status', 'valid')
      .select()
      .single();

    if (error || !ticket) {
      // Ticket not found or already redeemed/cancelled
      const { data: existingTicket } = await supabase
        .from('tickets')
        .select('*')
        .eq('token', ticketToken)
        .single();

      if (!existingTicket) {
        await logAudit('redeem_failed', 'tickets', undefined, { token, reason: 'invalid' });
        
        return res.json({
          success: false,
          message: 'Invalid ticket'
        } as RedeemResponse);
      }

      // Ticket exists but not valid
      const reason = existingTicket.status;
      await logAudit('redeem_failed', 'tickets', existingTicket.id, { token, reason });

      if (reason === 'redeemed') {
        return res.json({
          success: false,
          message: 'Ticket already redeemed',
          redeemed_at: existingTicket.redeemed_at
        } as RedeemResponse);
      }

      if (reason === 'cancelled') {
        return res.json({
          success: false,
          message: 'Ticket has been cancelled'
        } as RedeemResponse);
      }

      if (reason === 'expired') {
        return res.json({
          success: false,
          message: 'Ticket has expired'
        } as RedeemResponse);
      }

      return res.json({
        success: false,
        message: `Ticket status: ${reason}`
      } as RedeemResponse);
    }

    // Success!
    await logAudit('redeem_success', 'tickets', ticket.id, { token, ip: req.ip });

    res.json({
      success: true,
      message: 'Ticket redeemed successfully',
      ticket: {
        id: ticket.id,
        event_name: ticket.event_name,
        purchaser_name: ticket.purchaser_name,
        seat_tier: ticket.seat_tier
      },
      redeemed_at: ticket.redeemed_at
    } as RedeemResponse);
  } catch (error: any) {
    console.error('Redeem error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during redemption'
    } as RedeemResponse);
  }
});

// Get recent redemptions (for scan monitor)
router.get('/redemptions', async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const { data, error } = await supabase
      .from('tickets')
      .select('id, event_name, purchaser_name, seat_tier, redeemed_at, status, token')
      .eq('status', 'redeemed')
      .order('redeemed_at', { ascending: false })
      .limit(Number(limit));

    if (error) throw error;

    // Mask tokens for security
    const masked = data?.map(t => ({
      ...t,
      token: t.token.substring(0, 8) + '...'
    }));

    res.json(masked || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;