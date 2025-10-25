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
      background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    
    /* Background decorative elements */
    .bg-circle {
      position: absolute;
      border-radius: 50%;
      opacity: 0.08;
    }
    .bg-circle-1 {
      width: 400px; height: 400px;
      background: radial-gradient(circle, #e62b1e 0%, transparent 70%);
      top: -200px; right: -150px;
    }
    .bg-circle-2 {
      width: 300px; height: 300px;
      background: radial-gradient(circle, #ff4444 0%, transparent 70%);
      bottom: -100px; left: -100px;
    }
    
    /* Ticket container - looks like an actual ticket */
    .ticket-card {
      position: relative;
      width: 180mm;
      background: #ffffff;
      border-radius: 6mm;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      z-index: 1;
    }
    
    /* Top red strip */
    .top-strip {
      height: 12mm;
      background: linear-gradient(90deg, #e62b1e 0%, #c41f17 100%);
      position: relative;
    }
    
    /* Decorative notches on sides to look like a tear-off ticket */
    .ticket-card::before,
    .ticket-card::after {
      content: '';
      position: absolute;
      width: 8mm;
      height: 8mm;
      background: #1a1a1a;
      border-radius: 50%;
      top: 50%;
      transform: translateY(-50%);
      z-index: 2;
    }
    .ticket-card::before {
      left: -4mm;
    }
    .ticket-card::after {
      right: -4mm;
    }
    
    /* Header */
    .header {
      text-align: center;
      padding: 12mm 15mm 10mm;
      background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
    }
    
    .logo {
      font-size: 42px;
      font-weight: 700;
      letter-spacing: -2px;
      margin-bottom: 5mm;
    }
    .logo .tedx {
      color: #000000;
    }
    .logo .gju {
      color: #e62b1e;
    }
    
    .event-name {
      font-size: 22px;
      color: #1a1a1a;
      font-weight: 600;
      margin-bottom: 4mm;
      padding-bottom: 4mm;
      border-bottom: 2px solid #e62b1e;
      display: inline-block;
    }
    
    .venue {
      font-size: 13px;
      color: #666666;
      font-weight: 500;
      line-height: 1.6;
      margin-top: 4mm;
    }
    .venue-line {
      display: block;
    }
    
    /* Dashed separator line */
    .separator {
      margin: 0 15mm;
      border-top: 2px dashed #e0e0e0;
    }
    
    /* Main content area */
    .content {
      padding: 10mm 15mm;
      display: flex;
      gap: 12mm;
      align-items: center;
      justify-content: center;
    }
    
    /* QR Code section */
    .qr-section {
      flex: 0 0 auto;
    }
    
    .qr-wrapper {
      background: #ffffff;
      padding: 5mm;
      border-radius: 3mm;
      box-shadow: 0 4px 20px rgba(230, 43, 30, 0.15);
      border: 3px solid #e62b1e;
    }
    
    .qr-wrapper img {
      width: 55mm;
      height: 55mm;
      display: block;
    }
    
    /* Info section */
    .info-section {
      flex: 1;
      text-align: left;
    }
    
    .info-item {
      margin-bottom: 6mm;
      padding-bottom: 6mm;
      border-bottom: 1px solid #f0f0f0;
    }
    .info-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    
    .info-label {
      font-size: 10px;
      color: #999999;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 700;
      margin-bottom: 2mm;
      display: block;
    }
    
    .info-value {
      font-size: 16px;
      color: #1a1a1a;
      font-weight: 600;
    }
    
    .ticket-code {
      font-family: 'Courier New', monospace;
      font-size: 18px;
      letter-spacing: 3px;
      color: #e62b1e;
      font-weight: 700;
      background: #f8f8f8;
      padding: 3mm 4mm;
      border-radius: 2mm;
      display: inline-block;
      border: 2px dashed #e62b1e;
    }
    
    /* Bottom strip */
    .bottom-strip {
      height: 8mm;
      background: linear-gradient(90deg, #000000 0%, #1a1a1a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .bottom-strip-text {
      font-size: 10px;
      color: #ffffff;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: 600;
    }
    
    .bottom-strip-text .red {
      color: #e62b1e;
    }
  </style>
</head>
<body>
  <!-- Background decorations -->
  <div class="bg-circle bg-circle-1"></div>
  <div class="bg-circle bg-circle-2"></div>
  
  <div class="ticket-card">
    <!-- Top red strip -->
    <div class="top-strip"></div>
    
    <!-- Header -->
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
    
    <!-- Dashed separator -->
    <div class="separator"></div>
    
    <!-- Main content -->
    <div class="content">
      <!-- QR Code -->
      <div class="qr-section">
        <div class="qr-wrapper">
          <img src="${qrDataUrl}" alt="QR Code">
        </div>
      </div>
      
      <!-- Info -->
      <div class="info-section">
        <div class="info-item">
          <span class="info-label">Attendee Name</span>
          <div class="info-value">${this.escapeHtml(ticket.purchaser_name)}</div>
        </div>
        
        ${phone ? `
        <div class="info-item">
          <span class="info-label">Phone Number</span>
          <div class="info-value">${this.escapeHtml(phone)}</div>
        </div>
        ` : ''}
        
        <div class="info-item">
          <span class="info-label">Ticket Code</span>
          <div class="ticket-code">${this.escapeHtml(ticket.token.substring(0, 8).toUpperCase())}</div>
        </div>
      </div>
    </div>
    
    <!-- Bottom strip -->
    <div class="bottom-strip">
      <div class="bottom-strip-text">
        <span class="red">TEDx</span>GJU · Admit One
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