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
      width: 210mm; height: 297mm; /* A4 portrait */
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      color: #000; background: #fff;
      display: flex; align-items: center; justify-content: center;
    }
    .card {
      width: 170mm; /* keep generous margins to ensure single page */
      border: 2px solid #000; padding: 12mm; background: #fff;
    }
    .header { text-align: center; margin-bottom: 8mm; }
    .logo { font-size: 24px; font-weight: 700; }
    .logo span { color: #e62b1e; }
    .event-name { font-size: 18px; font-weight: 600; margin-top: 2mm; }
  .ticket-id { font-size: 11px; color: #666; margin: 4mm 0; font-family: monospace; }
    .row { display: flex; gap: 8mm; margin: 6mm 0; align-items: center; }
    .qr { flex: 0 0 auto; }
    .qr img { width: 55mm; height: 55mm; }
    .info { flex: 1 1 auto; font-size: 14px; }
    .label { font-weight: 600; width: 28mm; display: inline-block; }
    .small { font-size: 11px; color: #666; margin-top: 2mm; word-break: break-all; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">TEDx<span>GJU</span></div>
      <div class="event-name">${this.escapeHtml(ticket.event_name)}</div>
    </div>
    <!-- Keep an internal ID small; not primary visible number as per requirements -->
    <div class="ticket-id">Ref: ${this.escapeHtml(ticket.id.substring(0, 8))}</div>
    <div class="row">
      <div class="qr"><img src="${qrDataUrl}" alt="QR Code"></div>
      <div class="info">
        <div><span class="label">Name:</span> ${this.escapeHtml(ticket.purchaser_name)}</div>
        ${phone ? `<div><span class=\"label\">Phone:</span> ${this.escapeHtml(phone)}</div>` : ''}
        <div><span class="label">Code:</span> ${this.escapeHtml(ticket.token.substring(0, 8))}</div>
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