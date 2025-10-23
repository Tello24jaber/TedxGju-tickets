# URGENT: Fix CORS Blocking Issue

## Problem
Your frontend at `https://tedxgju.netlify.app` is being blocked by CORS when calling the backend at `https://tickets-api.netlify.app` with this error:

```
Access to fetch at 'https://tickets-api.netlify.app/api/...' from origin 'https://tedxgju.netlify.app' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Solution: Set Environment Variables in Netlify

### Step 1: Go to Backend Site Settings
1. Open https://app.netlify.com
2. Select your backend site: `tickets-api` (or whatever you named it)
3. Go to **Site settings** → **Environment variables**

### Step 2: Add/Update These Variables

**Required:**
- **Variable name:** `APP_URLS`
- **Value:** `https://tedxgju.netlify.app`
- **Scopes:** All (Production, Deploy Previews, Branch deploys)

**Recommended (to allow any Netlify preview):**
- **Variable name:** `ALLOW_NETLIFY_SUBDOMAINS`
- **Value:** `true`
- **Scopes:** All

**Also set:**
- **Variable name:** `PUBLIC_TICKET_BASE_URL`
- **Value:** `https://tickets-api.netlify.app`

**Plus the required Supabase vars:**
- `SUPABASE_URL` = your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` = your service role key

### Step 3: Redeploy
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Clear cache and deploy site**
3. Wait for deployment to complete

### Step 4: Test
Open your browser console at `https://tedxgju.netlify.app` and check:
- Network tab should show OPTIONS requests returning with `Access-Control-Allow-Origin: https://tedxgju.netlify.app`
- GET/POST requests should succeed with 200 status

## Why This Happens

The Express CORS middleware in `apps/api/src/app.ts` checks the `APP_URLS` environment variable to decide which origins to allow. If it's not set or doesn't include your frontend URL, the preflight OPTIONS request fails and the browser blocks the actual request.

## Quick Test

Once variables are set and deployed, test with curl:

```bash
curl -I -X OPTIONS https://tickets-api.netlify.app/api/health \
  -H "Origin: https://tedxgju.netlify.app" \
  -H "Access-Control-Request-Method: GET"
```

You should see:
```
Access-Control-Allow-Origin: https://tedxgju.netlify.app
```

If you don't see this header, the environment variables aren't applied yet. Redeploy and check again.
