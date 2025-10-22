# TEDxGJU Ticket System

Production-ready ticket issuance and validation system for TEDxGJU events. Features QR code tickets with one-scan validation, admin dashboard, and Google Forms integration.

## Features

- **Google Forms Integration**: Automatic intake from Google Sheets
- **Admin Dashboard**: Review, approve/reject requests, manage tickets
- **PDF Ticket Generation**: QR codes with event details
- **Email Delivery**: Automated ticket distribution via Gmail/transactional providers
- **One-Scan Validation**: Atomic redemption with scanner page
- **Real-time Monitoring**: Scan monitor and reports dashboard

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Database**: Supabase (PostgreSQL)
- **PDF Generation**: Puppeteer
- **QR Codes**: qrcode
- **Email**: Gmail OAuth / Resend / SendGrid

## Project Structure

```
├── apps/
│   ├── web/              # React frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── lib/
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── api/              # Express backend
│       ├── src/
│       │   ├── routes/
│       │   ├── services/
│       │   ├── lib/
│       │   └── server.ts
│       ├── package.json
│       └── tsconfig.json
├── shared/
│   └── types.ts
├── docs/
│   ├── test-cases.md
│   └── schema.sql
├── .env.example
└── README.md
```

## Setup

### 1. Supabase Database

1. Create a new Supabase project
2. Run the schema SQL from `docs/schema.sql`
3. Enable Row Level Security (RLS) on all tables
4. Get your `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_ANON_KEY`

### 2. Google Sheets

1. Create a Google Service Account in Google Cloud Console
2. Enable Google Sheets API
3. Download the service account JSON key
4. Share your Google Form's response sheet with the service account email (read access)
5. Get the spreadsheet ID from the URL

### 3. Email Provider Setup

#### Option A: Gmail OAuth

1. Create OAuth credentials in Google Cloud Console
2. Add authorized redirect URI: `http://localhost:3001/auth/google/callback`
3. Use the included script to get refresh token:
   ```bash
   cd apps/api
   npm run get-gmail-token
   ```

#### Option B: Resend/SendGrid

Get API key from your provider dashboard.

### 4. Environment Variables

Copy `.env.example` to `.env` in the root and fill in your values:

```bash
cp .env.example .env
```

### 5. Install Dependencies

```bash
# API
cd apps/api
npm install

# Web
cd ../web
npm install
```

### 6. Run Locally

```bash
# Terminal 1 - API
cd apps/api
npm run dev

# Terminal 2 - Web
cd apps/web
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001
- Scanner: http://localhost:5173/scan

## Deployment

### Backend (Render / Cloud Run / Railway)

1. Build command: `cd apps/api && npm install && npm run build`
2. Start command: `cd apps/api && npm start`
3. Set all environment variables
4. Note the deployed API URL for `PUBLIC_TICKET_BASE_URL`

### Frontend (Vercel / Netlify)

1. Build command: `cd apps/web && npm install && npm run build`
2. Output directory: `apps/web/dist`
3. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`

## Usage

### Admin Workflow

1. **Login**: Staff login with magic link via Supabase Auth
2. **Sync**: Click "Sync Google Sheets" to import new form responses
3. **Review**: View pending requests in the Queue
4. **Approve/Reject**: 
   - Approve generates tickets and emails them automatically
   - Reject sends rejection email
5. **Manage**: View all tickets, resend or cancel as needed
6. **Monitor**: Watch real-time scan redemptions
7. **Reports**: View stats and redemption rates

### Scanner Usage

1. Navigate to `/scan` (public page)
2. Click "Start Scanner" to use camera
3. Or enter token manually
4. Green "ADMIT" or Red "DENIED" feedback
5. Shows reason if denied (already redeemed, cancelled, etc.)

## API Endpoints

### Protected (Staff only)

- `POST /api/admin/sync-google` - Import new Google Sheets rows
- `GET /api/admin/requests` - List purchase requests
- `GET /api/admin/requests/:id` - Get request details
- `POST /api/admin/requests/:id/approve` - Approve and issue tickets
- `POST /api/admin/requests/:id/reject` - Reject request
- `GET /api/admin/stats` - Get statistics
- `GET /api/tickets` - Search tickets
- `POST /api/tickets/:id/resend` - Resend ticket email
- `POST /api/tickets/:id/cancel` - Cancel ticket

### Public

- `POST /api/redeem` - Validate and redeem ticket (one-scan)
- `GET /api/tickets/:id/pdf` - Download ticket PDF
- `GET /r/:token` - Redirect to scanner with token

## Security

- HTTPS only (via deployment platform)
- Opaque UUIDs for tokens (no PII in QR)
- Rate limiting on redemption endpoint
- RLS enabled in Supabase
- Service role key only in backend
- Audit logging for all actions

## Support

For issues or questions, contact: ${process.env.EMAIL_SENDER_ADDRESS || 'support@tedxgju.com'}

## License

MIT
