# Netlify Deployment (Backend API)

This app deploys as a serverless API to Netlify Functions using `serverless-http` to wrap the Express app.

## Netlify site settings

- Base directory: `apps/api`
- Build command: `npm run build`
- Publish directory: leave empty (functions-only) or `apps/api` if required by UI; no static assets are needed
- Node version: 20 (set via `apps/api/netlify.toml`)
- Functions directory: picked up from `apps/api/netlify/functions` automatically

## Redirects

- `/api/*` → `/.netlify/functions/api/:splat` (already in `apps/api/netlify.toml`)
- `/r/*` → `/.netlify/functions/api/r/:splat` (already in `apps/api/netlify.toml`)

## Environment variables

Required:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

CORS and public URLs:
- `APP_URLS` (comma-separated list of allowed origins, e.g. `https://tedxgju.netlify.app`)
- `ALLOW_NETLIFY_SUBDOMAINS` = `true` (optional: allows any `*.netlify.app` origin; useful for previews)
- `PUBLIC_TICKET_BASE_URL` (public URL of this backend site; used in ticket links/QR, e.g. `https://tickets-api.netlify.app`)

Email (choose one provider):
- `EMAIL_PROVIDER` = `gmail` | `resend` | `sendgrid`
- `EMAIL_SENDER_ADDRESS`

If `EMAIL_PROVIDER=gmail`:
- App Password flow: `GMAIL_APP_PASSWORD`
- OR OAuth2: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`

If `EMAIL_PROVIDER=resend`:
- `RESEND_API_KEY`

If `EMAIL_PROVIDER=sendgrid`:
- `SENDGRID_API_KEY`

Google Sheets sync:
- `GOOGLE_SPREADSHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_JSON` (entire JSON string)

## Notes

- Type packages (`@types/express`, `@types/cors`, `@types/nodemailer`, `@types/qrcode`) are regular `dependencies` to avoid CI environments skipping them.
- PDF generation uses `puppeteer-core` + `@sparticuz/chromium` to run on Netlify Functions. The PDF is constrained to a single A4 page.
- Health checks: `/api/health` and `/api/healthz`.

## CRITICAL: Fix CORS for frontend

In Netlify dashboard for `https://tickets-api.netlify.app`:
1. Go to Site settings → Environment variables
2. Add/update these variables:
   - `APP_URLS` = `https://tedxgju.netlify.app`
   - `ALLOW_NETLIFY_SUBDOMAINS` = `true` (optional but recommended)
   - `PUBLIC_TICKET_BASE_URL` = `https://tickets-api.netlify.app`
3. Redeploy the site for changes to take effect

Without these, CORS will block all frontend requests with "No 'Access-Control-Allow-Origin' header" error.

## Smoke tests

- `GET https://tickets-api.netlify.app/api/health` → `{ status: "ok", ... }`
- `GET https://tickets-api.netlify.app/r/<token>` should redirect to your scanner UI
- `GET https://tickets-api.netlify.app/api/tickets/<id>/pdf` should return a one-page PDF
- From browser at `https://tedxgju.netlify.app`, check Network tab for CORS headers on API calls
