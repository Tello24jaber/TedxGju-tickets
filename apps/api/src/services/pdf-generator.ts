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
      width: 210mm; 
      height: 297mm;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
      position: relative;
      overflow: hidden;
    }
    
    /* Decorative circles */
    .circle {
      position: absolute;
      border-radius: 50%;
      opacity: 0.1;
    }
    .circle-1 {
      width: 300px; height: 300px;
      background: #e62b1e;
      top: -100px; right: -100px;
    }
    .circle-2 {
      width: 200px; height: 200px;
      background: #ff4444;
      bottom: 50px; left: -50px;
    }
    .circle-3 {
      width: 150px; height: 150px;
      background: #e62b1e;
      top: 50%; left: 10%;
      opacity: 0.05;
    }
    .circle-4 {
      width: 100px; height: 100px;
      background: #ff6666;
      top: 20%; right: 15%;
      opacity: 0.08;
    }
    
    /* Main container */
    .ticket {
      position: relative;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 15mm;
      z-index: 1;
    }
    
    /* Header */
    .header {
      text-align: center;
      margin-bottom: 15mm;
    }
    
    .logo {
      font-size: 48px;
      font-weight: 700;
      letter-spacing: -2px;
      margin-bottom: 8mm;
    }
    .logo .tedx {
      color: #ffffff;
    }
    .logo .gju {
      color: #e62b1e;
    }
    
    .event-name {
      font-size: 24px;
      color: #ffffff;
      font-weight: 300;
      margin-bottom: 3mm;
      letter-spacing: 1px;
    }
    
    .venue {
      font-size: 14px;
      color: #999999;
      font-weight: 400;
      line-height: 1.6;
    }
    .venue-line {
      display: block;
    }
    
    /* Divider */
    .divider {
      width: 80mm;
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, #e62b1e 50%, transparent 100%);
      margin: 10mm 0;
    }
    
    /* QR Code section */
    .qr-section {
      margin: 8mm 0;
    }
    
    .qr-wrapper {
      background: #ffffff;
      padding: 8mm;
      border-radius: 4mm;
      box-shadow: 0 8px 32px rgba(230, 43, 30, 0.3);
      display: inline-block;
    }
    
    .qr-wrapper img {
      width: 60mm;
      height: 60mm;
      display: block;
    }
    
    /* Info section */
    .info-section {
      text-align: center;
      margin-top: 10mm;
      width: 100%;
      max-width: 150mm;
    }
    
    .info-item {
      margin-bottom: 6mm;
      padding: 4mm 6mm;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 2mm;
      border-left: 3px solid #e62b1e;
    }
    
    .info-label {
      font-size: 10px;
      color: #999999;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: 600;
      margin-bottom: 2mm;
      display: block;
    }
    
    .info-value {
      font-size: 18px;
      color: #ffffff;
      font-weight: 500;
    }
    
    .ticket-code {
      font-family: 'Courier New', monospace;
      font-size: 20px;
      letter-spacing: 3px;
      color: #e62b1e;
      font-weight: 700;
    }
    
    /* Bottom accent */
    .bottom-accent {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3mm;
      background: linear-gradient(90deg, #e62b1e 0%, #ff2e1f 50%, #e62b1e 100%);
    }
  </style>
</head>
<body>
  <!-- Decorative circles -->
  <div class="circle circle-1"></div>
  <div class="circle circle-2"></div>
  <div class="circle circle-3"></div>
  <div class="circle circle-4"></div>
  
  <div class="ticket">
    <div class="header">
      <div class="logo">
        <span class="tedx">TEDx</span><span class="gju">GJU</span>
      </div>
      <div class="event-name">${this.escapeHtml(ticket.event_name)}</div>
      <div class="venue">
        <span class="venue-line">German Jordanian University</span>
        <span class="venue-line">Main Campus · Auditorium G</span>
      </div>
    </div>
    
    <div class="divider"></div>
    
    <div class="qr-section">
      <div class="qr-wrapper">
        <img src="${qrDataUrl}" alt="QR Code">
      </div>
    </div>
    
    <div class="info-section">
      <div class="info-item">
        <span class="info-label">Attendee</span>
        <div class="info-value">${this.escapeHtml(ticket.purchaser_name)}</div>
      </div>
      
      ${phone ? `
      <div class="info-item">
        <span class="info-label">Phone</span>
        <div class="info-value">${this.escapeHtml(phone)}</div>
      </div>
      ` : ''}
      
      <div class="info-item">
        <span class="info-label">Ticket Code</span>
        <div class="ticket-code">${this.escapeHtml(ticket.token.substring(0, 8).toUpperCase())}</div>
      </div>
    </div>
  </div>
  
  <div class="bottom-accent"></div>
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