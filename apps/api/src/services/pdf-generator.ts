import puppeteer from 'puppeteer';
import QRCode from 'qrcode';
import type { Ticket } from '../types';

export class PDFGenerator {
  async generateTicketPDF(ticket: Ticket): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // Generate QR code as data URL
      const qrUrl = `${process.env.PUBLIC_TICKET_BASE_URL}/r/${ticket.token}`;
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 300
      });

      const html = this.generateHTML(ticket, qrDataUrl, qrUrl);
      
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private generateHTML(ticket: Ticket, qrDataUrl: string, qrUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      color: #000;
      background: #fff;
      padding: 20mm;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #e62b1e;
      padding-bottom: 20px;
    }
    .logo {
      font-size: 32px;
      font-weight: 600;
      color: #000;
      margin-bottom: 10px;
    }
    .logo span {
      color: #e62b1e;
    }
    .event-name {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .event-details {
      font-size: 14px;
      color: #666;
    }
    .ticket-body {
      margin: 40px 0;
      border: 2px solid #000;
      padding: 30px;
      background: #fff;
    }
    .ticket-id {
      font-size: 12px;
      color: #666;
      margin-bottom: 20px;
      font-family: monospace;
    }
    .attendee-info {
      margin-bottom: 30px;
    }
    .info-row {
      margin-bottom: 12px;
      font-size: 16px;
    }
    .info-label {
      font-weight: 600;
      display: inline-block;
      width: 120px;
    }
    .qr-section {
      text-align: center;
      margin: 40px 0;
      padding: 30px;
      background: #f9f9f9;
      border: 2px dashed #ccc;
    }
    .qr-code {
      margin: 20px auto;
    }
    .qr-url {
      font-size: 10px;
      color: #666;
      font-family: monospace;
      word-break: break-all;
      margin-top: 10px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
    .warning {
      color: #e62b1e;
      font-weight: 600;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">TEDx<span>GJU</span></div>
    <div class="event-name">${this.escapeHtml(ticket.event_name)}</div>
    <div class="event-details">German Jordanian University</div>
  </div>

  <div class="ticket-body">
    <div class="ticket-id">Ticket ID: ${this.escapeHtml(ticket.id)}</div>
    
    <div class="attendee-info">
      <div class="info-row">
        <span class="info-label">Name:</span>
        <span>${this.escapeHtml(ticket.purchaser_name)}</span>
      </div>
      ${ticket.seat_tier ? `
      <div class="info-row">
        <span class="info-label">Seat:</span>
        <span>${this.escapeHtml(ticket.seat_tier)}</span>
      </div>
      ` : ''}
      <div class="info-row">
        <span class="info-label">Status:</span>
        <span style="color: #e62b1e;">VALID</span>
      </div>
    </div>

    <div class="qr-section">
      <div style="font-weight: 600; margin-bottom: 10px;">SCAN AT ENTRANCE</div>
      <img src="${qrDataUrl}" alt="QR Code" class="qr-code" width="250" height="250">
      <div class="qr-url">${this.escapeHtml(qrUrl)}</div>
    </div>
  </div>

  <div class="footer">
    <div class="warning">⚠ Present this ticket at entrance. Single entry only.</div>
    <div>For support, contact: ${process.env.EMAIL_SENDER_ADDRESS}</div>
    <div style="margin-top: 10px;">Issued: ${new Date(ticket.issued_at).toLocaleString()}</div>
  </div>
</body>
</html>
    `;
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}