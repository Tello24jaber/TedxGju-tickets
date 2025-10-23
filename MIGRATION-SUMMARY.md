# Complete Migration Summary: Render → Netlify Backend

## Overview
We migrated a TEDxGJU ticket management system from a traditional Node.js/Express server (Render) to a serverless architecture on Netlify Functions.

---

## Original Architecture

### Backend (Before)
- **Platform**: Render.com
- **Type**: Traditional Express server running continuously
- **URL**: `https://tedxgju-tickets.onrender.com`
- **PDF Generation**: Standard Puppeteer (bundled Chromium)
- **Deployment**: Direct Node.js process with `npm start`

### Frontend
- **Platform**: Netlify
- **URL**: `https://tedxgju.netlify.app`
- **Framework**: React + Vite
- **API Calls**: Direct cross-origin requests to Render backend

---

## What We Changed & Why

### 1. Serverless Function Handler
**Problem**: Express servers don't run on Netlify Functions (serverless environment).

**Solution**: Created `apps/api/netlify/functions/api.ts`
```typescript
import serverless from 'serverless-http';
import app from '../../src/app.ts';

export const handler = serverless(app, {
  basePath: '/.netlify/functions/api',
});
```
- Wraps the entire Express app with `serverless-http`
- Makes it compatible with AWS Lambda (which powers Netlify Functions)
- Preserves all existing routes and middleware

---

### 2. PDF Generation (Puppeteer → Lambda-compatible)
**Problem**: Standard Puppeteer bundles a full Chromium binary (~300MB) which doesn't work in Lambda's limited environment.

**Solution**: Switched to `puppeteer-core` + `@sparticuz/chromium`

**File**: `apps/api/src/services/pdf-generator.ts`
```typescript
// Before
import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: true });

// After
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  args: chromium.args,
  defaultViewport: chromium.defaultViewport,
  executablePath: await chromium.executablePath(),
  headless: true,
});
```

**Why**: `@sparticuz/chromium` provides a stripped-down, Lambda-optimized Chromium binary that downloads on-demand in serverless functions.

---

### 3. PDF Layout (Single Page)
**Problem**: Original PDF was 2 pages, user wanted 1 page with specific fields.

**Solution**: Redesigned HTML/CSS template
- Used CSS `@page { size: A4; margin: 0; }` + `preferCSSPageSize: true`
- Compact flexbox layout with QR code + info side-by-side
- Shows: Name, Phone (from purchase_request), Short Code (first 8 chars of token), QR

**Fields displayed**:
- Name: `ticket.purchaser_name`
- Phone: Looked up from `purchase_requests` table via `ticket.purchase_request_id`
- Code: `ticket.token.substring(0, 8)` (shortened token)
- QR: Full URL for scanning

---

### 4. TypeScript Type Packages
**Problem**: Netlify build failed with "Cannot find declaration file for module 'express'" errors.

**Solution**: Moved `@types/*` packages from `devDependencies` to `dependencies`

**File**: `apps/api/package.json`
```json
{
  "dependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/nodemailer": "^6.4.14",
    "@types/qrcode": "^1.5.5",
    // ... other deps
  }
}
```

**Why**: Some CI environments (including Netlify) skip `devDependencies` in production builds. Moving type packages to regular dependencies ensures they're always installed.

---

### 5. Netlify Configuration
**Created**: `apps/api/netlify.toml`

```toml
[build]
  command = ""

[build.environment]
  NODE_VERSION = "20"

[functions]
  node_bundler = "esbuild"
  external_node_modules = ["@sparticuz/chromium", "puppeteer-core"]

[functions."api"]
  timeout = 26
  memory = 1536

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/api/:splat"
  status = 200

[[redirects]]
  from = "/r/*"
  to = "/.netlify/functions/api/r/:splat"
  status = 200
```

**Key points**:
- Node 20 for compatibility
- esbuild for fast bundling
- External modules prevent bundling binary dependencies
- Increased timeout (26s) and memory (1536MB) for PDF generation
- Redirects map friendly URLs to the function

---

### 6. CORS Configuration Enhancement
**Problem**: Frontend at `https://tedxgju.netlify.app` was blocked by CORS from backend at `https://tickets-api.netlify.app`.

**Solution**: Enhanced CORS middleware in `apps/api/src/app.ts`

```typescript
const rawAllowed = process.env.APP_URLS || process.env.APP_URL || '';
const allowedOrigins = rawAllowed.split(',').map(s => s.trim()).filter(Boolean);
const allowNetlifyWildcard = process.env.ALLOW_NETLIFY_SUBDOMAINS === 'true';

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
    const isExplicit = allowedOrigins.includes(origin);
    const isNetlify = allowNetlifyWildcard && /^https:\/\/[^.]+\.netlify\.app$/.test(origin);
    
    if (isLocalhost || isExplicit || isNetlify) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Features**:
- Checks `APP_URLS` (comma-separated list)
- Falls back to `APP_URL` for single origin
- Optional wildcard for `*.netlify.app` via `ALLOW_NETLIFY_SUBDOMAINS=true`
- Always allows localhost for development

---

## Required Environment Variables (Backend on Netlify)

### Critical (App won't start without these):
```bash
SUPABASE_URL=https://bplmtyxcgkogsddubckz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

### CORS (Required to fix frontend access):
```bash
APP_URLS=https://tedxgju.netlify.app
ALLOW_NETLIFY_SUBDOMAINS=true
```

### Backend URL (Used in QR codes and email links):
```bash
PUBLIC_TICKET_BASE_URL=https://tickets-api.netlify.app
```

### Email (Choose one provider):
```bash
EMAIL_PROVIDER=gmail
EMAIL_SENDER_ADDRESS=tedxgjutickets@gmail.com
GMAIL_APP_PASSWORD=jcfdqpenibuhdeop
```

### Google Sheets (For syncing ticket requests):
```bash
GOOGLE_SPREADSHEET_ID=1nMy-1NDDxDEYFjOUSerJXW2JpnDYdHzNo5V57wth_Nw
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

### Node:
```bash
NODE_ENV=production
NODE_VERSION=20
```

---

## Current Issues

### 🔴 CRITICAL: CORS Still Failing
**Error**: 
```
Access to fetch at 'https://tickets-api.netlify.app/api/...' from origin 'https://tedxgju.netlify.app' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

**Root Cause**: User's current env vars have:
- ❌ `APP_URL=https://tedxgju.netlify.app` (should be `APP_URLS` plural)
- ❌ `PUBLIC_TICKET_BASE_URL=https://tedxgju-tickets.onrender.com` (points to old Render backend!)

**Fix Required**:
1. In Netlify dashboard for backend site:
   - Change `APP_URL` → `APP_URLS`
   - Add `ALLOW_NETLIFY_SUBDOMAINS=true`
   - Change `PUBLIC_TICKET_BASE_URL` to `https://tickets-api.netlify.app`
2. Redeploy backend site

---

## Why There's No Middleware Folder

**Answer**: The `apps/api/src/middleware/` folder exists but is **empty** because:

1. **Auth middleware is defined inline** in each route file (`admin.ts`, `tickets.ts`, etc.):
   ```typescript
   const requireAuth = async (req, res, next) => {
     const token = req.headers.authorization?.replace('Bearer ', '');
     // ... validation logic
   };
   ```

2. **Security middleware** (helmet, cors, rate limiting) is configured directly in `apps/api/src/app.ts`

3. **Design choice**: The original codebase didn't extract middleware into separate files. All middleware is either:
   - Global (in `app.ts`)
   - Route-specific (defined at top of route files)

**Not a problem**, just an architectural choice. For a larger app, you might want to move `requireAuth` to `middleware/auth.ts` for reusability, but it works fine as-is.

---

## File Structure Changes

### New Files Created:
```
apps/api/
├── netlify/
│   └── functions/
│       └── api.ts                    # NEW: Serverless handler
├── netlify.toml                      # NEW: Netlify config
├── DEPLOYMENT-NETLIFY.md             # NEW: Deployment guide
└── CORS-FIX-INSTRUCTIONS.md          # NEW: CORS troubleshooting
```

### Modified Files:
```
apps/api/
├── package.json                      # Type packages moved to dependencies
└── src/
    ├── app.ts                        # Enhanced CORS logic
    └── services/
        └── pdf-generator.ts          # Lambda-compatible Chromium
```

---

## How Serverless Changes the Architecture

### Before (Traditional Server):
```
Request → Render VM → Express App → Route Handler → Response
         (Always running, consumes resources 24/7)
```

### After (Serverless):
```
Request → Netlify Edge → AWS Lambda (cold/warm start) → 
         Serverless-http wrapper → Express App → Route Handler → Response
         (Only runs when invoked, auto-scales)
```

**Cold starts**: First request after ~15min idle takes 2-5 seconds to spin up.  
**Warm starts**: Subsequent requests are fast (~100-500ms).

---

## Testing Checklist

### Backend Health:
- [ ] `GET https://tickets-api.netlify.app/api/health` returns `{"status":"ok"}`
- [ ] `GET https://tickets-api.netlify.app/api/healthz` returns `{"status":"ok"}`

### CORS (from browser at https://tedxgju.netlify.app):
- [ ] OPTIONS requests return `Access-Control-Allow-Origin: https://tedxgju.netlify.app`
- [ ] GET/POST requests succeed without CORS errors

### PDF Generation:
- [ ] `GET https://tickets-api.netlify.app/api/tickets/:id/pdf` returns single-page PDF
- [ ] PDF shows: Name, Phone, Code, QR

### QR Redirect:
- [ ] `GET https://tickets-api.netlify.app/r/:token` redirects to scanner page

---

## Deployment Steps (For Next AI/Developer)

1. **Fix environment variables** in Netlify backend site:
   - `APP_URLS=https://tedxgju.netlify.app` (note the S!)
   - `PUBLIC_TICKET_BASE_URL=https://tickets-api.netlify.app`
   - `ALLOW_NETLIFY_SUBDOMAINS=true`

2. **Redeploy backend** in Netlify dashboard

3. **Verify CORS** using browser DevTools Network tab

4. **Test PDF** generation with a real ticket ID

5. **Monitor function logs** in Netlify for any Lambda timeout/memory issues

---

## Technologies Used

- **Express 4.21**: Web framework
- **Serverless-http 3.2**: AWS Lambda adapter for Express
- **Puppeteer-core 23.11**: Headless browser control
- **@sparticuz/chromium 119**: Lambda-optimized Chromium binary
- **Supabase**: PostgreSQL database + auth
- **QRCode**: QR generation for tickets
- **Nodemailer**: Email delivery
- **Google APIs**: Sheets sync

---

## Key Code Patterns

### 1. Supabase Auth Middleware
```typescript
const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });
  
  (req as any).user = user;
  next();
};
```

### 2. Atomic Ticket Redemption
```typescript
// Prevents double-scans with database-level atomic update
const { data: ticket, error } = await supabase
  .from('tickets')
  .update({ status: 'redeemed', redeemed_at: new Date().toISOString() })
  .eq('token', token)
  .eq('status', 'valid')  // Only succeeds if currently valid
  .select()
  .single();
```

### 3. Phone Lookup for PDF
```typescript
let phone: string | undefined;
if (ticket.purchase_request_id) {
  const { data } = await supabase
    .from('purchase_requests')
    .select('phone')
    .eq('id', ticket.purchase_request_id)
    .single();
  phone = data?.phone ?? undefined;
}
```

---

## Performance Considerations

### Lambda Limits:
- **Max execution time**: 26 seconds (configured)
- **Memory**: 1536 MB (configured)
- **Package size**: ~50MB after esbuild bundling (Chromium is external, downloaded at runtime)

### PDF Generation Time:
- Cold start: 3-5 seconds (Lambda spin-up + Chromium download)
- Warm: 1-2 seconds (Lambda already warm, Chromium cached)

### Cost Estimate:
- Netlify Functions: 125k requests free/month
- Beyond that: $25/million requests
- For a ticket system with ~1000 tickets/event: essentially free

---

## Security Notes

1. **Service Role Key**: Exposed in env vars but scoped to backend only. Never send to frontend.
2. **CORS**: Properly restricts origins. Don't use `*` wildcard in production.
3. **Auth tokens**: Supabase JWT tokens in Authorization header, validated on every protected route.
4. **Rate limiting**: 10 requests/min on `/api/redeem` to prevent brute-force scans.

---

## Common Errors & Fixes

### "Cannot find module 'express'"
- **Cause**: Type packages in devDependencies, Netlify skipped them
- **Fix**: Moved to dependencies ✅

### "CORS: Origin not allowed"
- **Cause**: APP_URLS not set or wrong value
- **Fix**: Set APP_URLS=https://tedxgju.netlify.app in Netlify dashboard

### "Failed to launch Chrome"
- **Cause**: Using standard puppeteer instead of puppeteer-core
- **Fix**: Switch to puppeteer-core + @sparticuz/chromium ✅

### PDF is 2 pages
- **Cause**: Original HTML too large
- **Fix**: Compact layout with CSS page constraints ✅

### QR links point to old Render URL
- **Cause**: PUBLIC_TICKET_BASE_URL still set to Render
- **Fix**: Update to Netlify backend URL (not done yet! ⚠️)

---

## Next Steps for Other AI/Developer

1. **Immediately**: Fix the 3 environment variables mentioned above
2. **Test**: Verify CORS works after redeploy
3. **Optional**: Move `requireAuth` middleware to `apps/api/src/middleware/auth.ts` for DRY
4. **Optional**: Add frontend proxy in `apps/web/netlify.toml` to avoid CORS entirely:
   ```toml
   [[redirects]]
     from = "/api/*"
     to = "https://tickets-api.netlify.app/api/:splat"
     status = 200
   ```
5. **Monitor**: Check Netlify function logs for any cold start issues or timeouts

---

## Summary

We successfully migrated a full-stack ticketing system from a traditional server to serverless architecture. The main challenges were:
1. Making Express work in Lambda (serverless-http)
2. Making Puppeteer work in Lambda (@sparticuz/chromium)
3. Ensuring TypeScript types install in CI (move to dependencies)
4. Configuring CORS for cross-origin requests (enhanced middleware)
5. Adjusting PDF layout to single page

**Current blocker**: Environment variables not correctly set in Netlify backend. Once fixed, system should work end-to-end.

---

Generated: October 23, 2025
Repository: https://github.com/Tello24jaber/TedxGju-tickets
Backend: https://tickets-api.netlify.app
Frontend: https://tedxgju.netlify.app
