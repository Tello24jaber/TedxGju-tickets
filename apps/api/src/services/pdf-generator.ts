import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { supabase } from '../lib/supabase.js';
import QRCode from 'qrcode';
import type { Ticket } from '../types';

export class PDFGenerator {
  async generateTicketPDF(ticket: Ticket): Promise<Buffer> {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
  // Force headless to true for compatibility with Netlify's runtime
  headless: true,
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
      // Try to resolve purchaser phone from the linked purchase request
      let phone: string | undefined;
      if (ticket.purchase_request_id) {
        try {
          const { data } = await supabase
            .from('purchase_requests')
            .select('phone')
            .eq('id', ticket.purchase_request_id)
            .single();
          phone = data?.phone ?? undefined;
        } catch {}
      }

      const html = this.generateHTML(ticket, qrDataUrl, qrUrl, phone);
      
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Enforce a single-page A4 PDF using CSS page size and zero margins
      const pdf = await page.pdf({
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' }
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private generateHTML(ticket: Ticket, qrDataUrl: string, qrUrl: string, phone?: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      width: 210mm; height: 297mm;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background: linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%);
      display: flex; align-items: center; justify-content: center;
      position: relative;
      overflow: hidden;
    }
    
    /* Background geometric pattern */
    body::before {
      content: '';
      position: absolute;
      top: -50mm; right: -50mm;
      width: 150mm; height: 150mm;
      background: linear-gradient(135deg, #e62b1e15 0%, #ff000015 100%);
      border-radius: 50%;
      z-index: 0;
    }
    body::after {
      content: '';
      position: absolute;
      bottom: -40mm; left: -40mm;
      width: 120mm; height: 120mm;
      background: linear-gradient(135deg, #00000008 0%, #e62b1e08 100%);
      border-radius: 50%;
      z-index: 0;
    }
    
    .card {
      width: 180mm;
      background: #ffffff;
      border-radius: 4mm;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      position: relative;
      z-index: 1;
      overflow: hidden;
    }
    
    /* Top red accent bar */
    .accent-bar {
      height: 8mm;
      background: linear-gradient(90deg, #e62b1e 0%, #ff2e1f 100%);
      position: relative;
    }
    
    /* Header section */
    .header {
      text-align: center;
      padding: 10mm 12mm 8mm;
      background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
      border-bottom: 1px solid #e0e0e0;
    }
    
    .logo {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -1px;
      color: #000000;
      margin-bottom: 3mm;
    }
    .logo .tedx { color: #000000; }
    .logo .gju { color: #e62b1e; }
    
    .university {
      font-size: 11px;
      color: #666;
      font-weight: 500;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 4mm;
    }
    
    .event-name {
      font-size: 20px;
      font-weight: 600;
      color: #1a1a1a;
      padding: 3mm 0;
      border-top: 1px solid #e62b1e;
      border-bottom: 1px solid #e62b1e;
      display: inline-block;
    }
    
    /* Content section */
    .content {
      padding: 10mm 12mm;
      display: flex;
      gap: 10mm;
      align-items: center;
    }
    
    /* QR Code section */
    .qr-section {
      flex: 0 0 auto;
      text-align: center;
    }
    .qr-wrapper {
      background: #ffffff;
      padding: 4mm;
      border-radius: 2mm;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      border: 2px solid #e62b1e;
    }
    .qr-wrapper img {
      width: 50mm;
      height: 50mm;
      display: block;
    }
    .qr-label {
      margin-top: 3mm;
      font-size: 10px;
      color: #666;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    /* Info section */
    .info-section {
      flex: 1;
    }
    
    .info-row {
      margin-bottom: 5mm;
      padding-bottom: 4mm;
      border-bottom: 1px solid #f0f0f0;
    }
    .info-row:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    
    .info-label {
      font-size: 10px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
      margin-bottom: 2mm;
      display: block;
    }
    
    .info-value {
      font-size: 16px;
      color: #1a1a1a;
      font-weight: 500;
      word-wrap: break-word;
    }
    
    .ticket-code {
      font-family: 'Courier New', monospace;
      background: #f8f8f8;
      padding: 2mm 3mm;
      border-radius: 1mm;
      display: inline-block;
      border-left: 3px solid #e62b1e;
      font-size: 14px;
      letter-spacing: 1px;
    }
    
    /* Footer */
    .footer {
      padding: 6mm 12mm;
      background: #fafafa;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9px;
      color: #666;
    }
    
    .footer-left {
      display: flex;
      align-items: center;
      gap: 4mm;
    }
    
    .flag-icon {
      width: 5mm;
      height: 3.5mm;
      display: inline-block;
      border-radius: 0.5mm;
      vertical-align: middle;
    }
    
    .flag-jordan {
      background: linear-gradient(180deg, #000 33.33%, #fff 33.33%, #fff 66.66%, #00ff00 66.66%);
      position: relative;
    }
    .flag-jordan::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 0;
      height: 0;
      border-top: 1.75mm solid #e62b1e;
      border-bottom: 1.75mm solid #e62b1e;
      border-right: 2.5mm solid transparent;
    }
    
    .flag-germany {
      background: linear-gradient(180deg, #000 33.33%, #ff0000 33.33%, #ff0000 66.66%, #ffce00 66.66%);
    }
    
    .footer-right {
      font-family: monospace;
      font-size: 8px;
      color: #999;
    }
    
    .valid-badge {
      display: inline-block;
      background: #00a651;
      color: white;
      padding: 1mm 2mm;
      border-radius: 1mm;
      font-weight: 600;
      font-size: 9px;
      margin-left: 3mm;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="accent-bar"></div>
    
    <div class="header">
      <div class="logo">
        <span class="tedx">TEDx</span><span class="gju">GJU</span>
      </div>
      <div class="university">German Jordanian University · Jordan</div>
      <div class="event-name">${this.escapeHtml(ticket.event_name)}</div>
    </div>
    
    <div class="content">
      <div class="qr-section">
        <div class="qr-wrapper">
          <img src="${qrDataUrl}" alt="Ticket QR Code">
        </div>
        <div class="qr-label">Scan to Verify</div>
      </div>
      
      <div class="info-section">
        <div class="info-row">
          <span class="info-label">Attendee Name</span>
          <div class="info-value">${this.escapeHtml(ticket.purchaser_name)}</div>
        </div>
        
        ${phone ? `
        <div class="info-row">
          <span class="info-label">Phone Number</span>
          <div class="info-value">${this.escapeHtml(phone)}</div>
        </div>
        ` : ''}
        
        <div class="info-row">
          <span class="info-label">Ticket Code</span>
          <div class="ticket-code">${this.escapeHtml(ticket.token.substring(0, 8).toUpperCase())}</div>
        </div>
        
        ${ticket.seat_tier ? `
        <div class="info-row">
          <span class="info-label">Seat Category</span>
          <div class="info-value">${this.escapeHtml(ticket.seat_tier)}</div>
        </div>
        ` : ''}
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-left">
        <span class="flag-icon flag-jordan"></span>
        <span class="flag-icon flag-germany"></span>
        <span>This ticket is valid for entry</span>
        <span class="valid-badge">Valid</span>
      </div>
      <div class="footer-right">
        ID: ${this.escapeHtml(ticket.id.substring(0, 8))}
      </div>
    </div>
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