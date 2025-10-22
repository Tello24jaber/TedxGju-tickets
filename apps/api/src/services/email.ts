// apps/api/src/services/email.ts
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import type { Ticket } from '../types';

export class EmailService {
  private transporter: any;
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      const provider = process.env.EMAIL_PROVIDER || 'gmail';

      if (provider === 'gmail') {
        // Check if using OAuth or App Password
        const useOAuth = process.env.GMAIL_REFRESH_TOKEN && 
                        process.env.GMAIL_CLIENT_ID && 
                        process.env.GMAIL_CLIENT_SECRET;

        if (useOAuth) {
          // Gmail OAuth
          const oauth2Client = new google.auth.OAuth2(
            process.env.GMAIL_CLIENT_ID,
            process.env.GMAIL_CLIENT_SECRET,
            'http://localhost:3001/auth/google/callback'
          );

          oauth2Client.setCredentials({
            refresh_token: process.env.GMAIL_REFRESH_TOKEN
          });

          const accessToken = await oauth2Client.getAccessToken();

          this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              type: 'OAuth2',
              user: process.env.EMAIL_SENDER_ADDRESS,
              clientId: process.env.GMAIL_CLIENT_ID,
              clientSecret: process.env.GMAIL_CLIENT_SECRET,
              refreshToken: process.env.GMAIL_REFRESH_TOKEN,
              accessToken: accessToken.token || undefined
            }
          });
        } else {
          // Gmail with App Password (simpler)
          this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_SENDER_ADDRESS,
              pass: process.env.GMAIL_APP_PASSWORD
            }
          });
        }
      } else if (provider === 'resend') {
        // Resend
        this.transporter = nodemailer.createTransport({
          host: 'smtp.resend.com',
          port: 465,
          secure: true,
          auth: {
            user: 'resend',
            pass: process.env.RESEND_API_KEY
          }
        });
      } else if (provider === 'sendgrid') {
        // SendGrid
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
          }
        });
      } else {
        throw new Error(`Unsupported email provider: ${provider}`);
      }
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
      throw new Error('Email service initialization failed. Please check your email configuration.');
    }
  }

  async sendTickets(tickets: Ticket[], pdfBuffers: Buffer[]) {
    // Wait for transporter to initialize
    await this.initPromise;
    
    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }

    const recipient = tickets[0].purchaser_email;
    const name = tickets[0].purchaser_name;

    const attachments = tickets.map((ticket, idx) => ({
      filename: `tedxgju-ticket-${ticket.id.substring(0, 8)}.pdf`,
      content: pdfBuffers[idx],
      contentType: 'application/pdf'
    }));

    const ticketWord = tickets.length === 1 ? 'Ticket' : 'Tickets';
    const subject = `Your TEDxGJU ${ticketWord}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: #fff; padding: 20px; text-align: center; }
    .logo { font-size: 24px; font-weight: 600; }
    .logo span { color: #e62b1e; }
    .content { padding: 30px 20px; background: #f9f9f9; }
    .button { display: inline-block; background: #e62b1e; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .warning { background: #fff3cd; border-left: 4px solid #e62b1e; padding: 12px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">TEDx<span>GJU</span></div>
    </div>
    <div class="content">
      <h2>Hello ${name},</h2>
      <p>Your TEDxGJU ${ticketWord.toLowerCase()} ${tickets.length === 1 ? 'is' : 'are'} ready!</p>
      <p>You'll find ${tickets.length === 1 ? 'your ticket' : `${tickets.length} tickets`} attached to this email as PDF ${tickets.length === 1 ? 'file' : 'files'}.</p>
      
      <div class="warning">
        <strong>Important:</strong> Each ticket can only be scanned once at the entrance. Please keep your ${ticketWord.toLowerCase()} safe and present ${tickets.length === 1 ? 'it' : 'them'} on the event day.
      </div>

      <p><strong>Event Details:</strong></p>
      <ul>
        <li>Event: ${tickets[0].event_name}</li>
        <li>Venue: German Jordanian University</li>
        ${tickets[0].seat_tier ? `<li>Seat: ${tickets[0].seat_tier}</li>` : ''}
      </ul>

      <p>You can also view your ${ticketWord.toLowerCase()} online:</p>
      ${tickets.map(t => `
        <a href="${process.env.PUBLIC_TICKET_BASE_URL}/api/tickets/${t.id}/pdf" class="button">View Ticket ${tickets.length > 1 ? tickets.indexOf(t) + 1 : ''}</a>
      `).join('')}

      <p>See you at the event!</p>
    </div>
    <div class="footer">
      <p>Questions? Contact us at ${process.env.EMAIL_SENDER_ADDRESS}</p>
      <p>&copy; ${new Date().getFullYear()} TEDxGJU. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    await this.transporter.sendMail({
      from: `TEDxGJU <${process.env.EMAIL_SENDER_ADDRESS}>`,
      to: recipient,
      subject,
      html,
      attachments
    });
  }

  async sendRejectionEmail(email: string, name: string, reason?: string) {
    // Wait for transporter to initialize
    await this.initPromise;
    
    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: #fff; padding: 20px; text-align: center; }
    .logo { font-size: 24px; font-weight: 600; }
    .logo span { color: #e62b1e; }
    .content { padding: 30px 20px; background: #f9f9f9; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">TEDx<span>GJU</span></div>
    </div>
    <div class="content">
      <h2>Hello ${name},</h2>
      <p>Thank you for your interest in TEDxGJU.</p>
      <p>Unfortunately, we are unable to approve your ticket request at this time.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>If you have any questions, please don't hesitate to reach out.</p>
    </div>
    <div class="footer">
      <p>Contact us at ${process.env.EMAIL_SENDER_ADDRESS}</p>
      <p>&copy; ${new Date().getFullYear()} TEDxGJU. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    await this.transporter.sendMail({
      from: `TEDxGJU <${process.env.EMAIL_SENDER_ADDRESS}>`,
      to: email,
      subject: 'TEDxGJU Ticket Request Update',
      html
    });
  }
}