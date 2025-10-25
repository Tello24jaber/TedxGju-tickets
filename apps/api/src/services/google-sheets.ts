import { google } from 'googleapis';
import type { SheetRow } from '../types';

export class GoogleSheetsService {
  private sheets;
  private spreadsheetId: string;

  constructor() {
    if (!process.env.GOOGLE_SPREADSHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      console.error('Missing Google Sheets env vars');
      console.error('GOOGLE_SPREADSHEET_ID:', process.env.GOOGLE_SPREADSHEET_ID ? 'present' : 'MISSING');
      console.error('GOOGLE_SERVICE_ACCOUNT_JSON:', process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? 'present' : 'MISSING');
      throw new Error('Missing Google Sheets configuration');
    }

    try {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    } catch (error) {
      console.error('Failed to initialize Google Sheets:', error);
      throw error;
    }
  }

  async getNewRows(lastRowIndex: number = 0): Promise<SheetRow[]> {
    try {
      console.log('Fetching from spreadsheet:', this.spreadsheetId);
      console.log('Range: Event!A:Z');
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Event!A:Z', // Sheet name followed by column range
      });

      const rows = response.data.values || [];
      console.log('Total rows fetched:', rows.length);
      
      if (rows.length <= 1) {
        console.log('Only header or empty sheet');
        return []; // Only header or empty
      }

      const headers = rows[0].map(h => h.toLowerCase().trim());
      console.log('Headers found:', headers.join(', '));
      
      const results: SheetRow[] = [];

      // Start from lastRowIndex + 1 (skip header at index 0)
      for (let i = Math.max(1, lastRowIndex + 1); i < rows.length; i++) {
        const row = rows[i];
        
        const getCell = (name: string) => {
          const idx = headers.findIndex(h => h.includes(name));
          return idx >= 0 ? row[idx]?.trim() : undefined;
        };

        const timestamp = getCell('timestamp') || '';
        const fullName = getCell('name') || '';
        const email = getCell('email') || '';
        const phone = getCell('phone');
        const eventName = getCell('event') || 'TEDxGJU';
        const quantityStr = getCell('quantity') || '1';
        const quantity = parseInt(quantityStr) || 1;
        const seatTier = getCell('seat') || getCell('tier');
        const paymentType = getCell('payment type') || getCell('payment');
        const proofUrl = getCell('proof') || getCell('url');
        const notes = getCell('notes');

        if (!email || !fullName) continue; // Skip invalid rows

        results.push({
          rowIndex: i,
          timestamp,
          fullName,
          email,
          phone,
          eventName,
          quantity,
          seatTier,
          paymentType,
          proofUrl,
          notes
        });
      }

      return results;
    } catch (error: any) {
      console.error('Error fetching Google Sheets:', error);
      
      if (error.message?.includes('Unable to parse range')) {
        throw new Error('Sheet "Event" not found in spreadsheet. Check if the sheet name is correct.');
      }
      
      if (error.code === 403) {
        throw new Error('Permission denied. Make sure the service account email has access to the spreadsheet.');
      }
      
      if (error.code === 404) {
        throw new Error('Spreadsheet not found. Check if GOOGLE_SPREADSHEET_ID is correct.');
      }
      
      throw new Error(`Failed to fetch Google Sheets data: ${error.message}`);
    }
  }
}