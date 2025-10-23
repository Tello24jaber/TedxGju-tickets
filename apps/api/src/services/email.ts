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

  async sendTickets(tickets: Ticket[], pdfBuffers: Buffer[], notes?: string) {
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 0;
    }
    .header { 
      background: #000; 
      color: #fff; 
      padding: 24px 20px; 
      text-align: center; 
    }
    .logo { 
      font-size: 28px; 
      font-weight: 600; 
      letter-spacing: -0.5px;
    }
    .logo span { 
      color: #e62b1e; 
    }
    .content { 
      padding: 30px 20px; 
      background: #f9f9f9; 
    }
    .content h2 {
      margin-top: 0;
      font-size: 22px;
      color: #000;
    }
    .content p {
      margin: 12px 0;
      font-size: 15px;
    }
    .content ul {
      padding-left: 20px;
      margin: 16px 0;
    }
    .content ul li {
      margin: 8px 0;
      font-size: 15px;
    }
    .button { 
      display: inline-block; 
      background: #e62b1e; 
      color: #fff; 
      padding: 14px 32px; 
      text-decoration: none; 
      border-radius: 6px; 
      margin: 20px 0;
      font-weight: 600;
      font-size: 15px;
    }
    .footer { 
      padding: 24px 20px; 
      text-align: center; 
      font-size: 13px; 
      color: #666;
      background: #fff;
    }
    .footer p {
      margin: 8px 0;
    }
    .warning { 
      background: #fff3cd; 
      border-left: 4px solid #e62b1e; 
      padding: 16px; 
      margin: 20px 0;
      border-radius: 4px;
      font-size: 14px;
    }
    .warning strong {
      display: block;
      margin-bottom: 6px;
      color: #000;
    }
    
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
      }
      .header {
        padding: 20px 16px;
      }
      .logo {
        font-size: 24px;
      }
      .content {
        padding: 24px 16px;
      }
      .content h2 {
        font-size: 20px;
      }
      .content p, .content ul li {
        font-size: 14px;
      }
      .warning {
        padding: 12px;
        font-size: 13px;
      }
      .button {
        padding: 12px 24px;
        font-size: 14px;
        display: block;
        text-align: center;
      }
      .footer {
        padding: 20px 16px;
        font-size: 12px;
      }
    }
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

      ${notes ? `
      <div class="warning">
        <strong>Note from TEDxGJU Team:</strong> ${notes}
      </div>
      ` : ''}

      <p><strong>Event Details:</strong></p>
      <ul>
        <li>Event: ${tickets[0].event_name}</li>
        <li>Venue: German Jordanian University</li>
        ${tickets[0].seat_tier ? `<li>Seat: ${tickets[0].seat_tier}</li>` : ''}
      </ul>

     
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
    
    await this.initPromise;
    
    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
      line-height: 1.6; 
      color: #333;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 0;
    }
    .header { 
      background: #000; 
      color: #fff; 
      padding: 24px 20px; 
      text-align: center; 
    }
    .logo { 
      font-size: 28px; 
      font-weight: 600;
      letter-spacing: -0.5px;
    }
    .logo span { 
      color: #e62b1e; 
    }
    .content { 
      padding: 30px 20px; 
      background: #f9f9f9; 
    }
    .content h2 {
      margin-top: 0;
      font-size: 22px;
      color: #000;
    }
    .content p {
      margin: 12px 0;
      font-size: 15px;
    }
    .footer { 
      padding: 24px 20px; 
      text-align: center; 
      font-size: 13px; 
      color: #666;
      background: #fff;
    }
    .footer p {
      margin: 8px 0;
    }
    .warning { 
      background: #fff3cd; 
      border-left: 4px solid #e62b1e; 
      padding: 16px; 
      margin: 20px 0;
      border-radius: 4px;
      font-size: 14px;
    }
    .warning strong {
      display: block;
      margin-bottom: 6px;
      color: #000;
    }
    
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
      }
      .header {
        padding: 20px 16px;
      }
      .logo {
        font-size: 24px;
      }
      .content {
        padding: 24px 16px;
      }
      .content h2 {
        font-size: 20px;
      }
      .content p {
        font-size: 14px;
      }
      .warning {
        padding: 12px;
        font-size: 13px;
      }
      .footer {
        padding: 20px 16px;
        font-size: 12px;
      }
    }
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
      ${reason ? `
      <div class="warning">
        <strong>Reason:</strong> ${reason}
      </div>
      ` : ''}
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