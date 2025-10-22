# Deployment Guide

## Prerequisites
- GitHub account
- Render account (render.com)
- Netlify account (netlify.com)
- Supabase project with schema deployed

---

## Part 1: Deploy Backend to Render

### 1. Push to GitHub
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Create Render Web Service
1. Go to https://render.com/
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `tedxgju-api`
   - **Region**: Choose nearest to your users
   - **Root Directory**: `apps/api`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 3. Add Environment Variables in Render
Go to **Environment** tab and add:

```
NODE_ENV=production
PORT=3001

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Google Sheets
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account"...} (paste full JSON on one line)

# Email
EMAIL_PROVIDER=gmail
EMAIL_SENDER_ADDRESS=your-email@gmail.com
GMAIL_APP_PASSWORD=your_app_password_here

# URLs (update after deployment)
PUBLIC_TICKET_BASE_URL=https://tedxgju-api.onrender.com
APP_URL=https://your-app.netlify.app
```

### 4. Deploy
- Click **Create Web Service**
- Wait for build to complete (~5 minutes)
- Note your API URL: `https://tedxgju-api.onrender.com`

### 5. Test API
Visit: `https://tedxgju-api.onrender.com/health`
Should return: `{"status":"ok","timestamp":"..."}`

---

## Part 2: Deploy Frontend to Netlify

### 1. Update Frontend Environment
Create `apps/web/.env.production`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_URL=https://tedxgju-api.onrender.com
```

Commit this file:
```bash
git add apps/web/.env.production
git commit -m "Add production environment"
git push
```

### 2. Create Netlify Site
1. Go to https://netlify.com/
2. Click **Add new site** → **Import an existing project**
3. Connect to GitHub and select your repository
4. Configure:
   - **Base directory**: `apps/web`
   - **Build command**: `npm run build`
   - **Publish directory**: `apps/web/dist`
   - **Node version**: `18`

### 3. Add Environment Variables in Netlify
Go to **Site settings** → **Environment variables** and add:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_URL=https://tedxgju-api.onrender.com
```

### 4. Deploy
- Click **Deploy site**
- Wait for build (~2 minutes)
- Note your site URL: `https://your-app.netlify.app`

### 5. Update Backend URLs
Go back to Render and update the `APP_URL` env var to your Netlify URL:
```
APP_URL=https://your-app.netlify.app
```
This triggers a redeploy automatically.

---

## Part 3: Configure Supabase Authentication

### 1. Add Site URL
In Supabase dashboard:
1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `https://your-app.netlify.app`
3. Add to **Redirect URLs**: `https://your-app.netlify.app/**`

---

## Part 4: Test Everything

### 1. Test Frontend
- Visit: `https://your-app.netlify.app`
- Should load the dashboard

### 2. Test Authentication
- Go to Login page
- Enter email for magic link
- Check email and click link
- Should redirect to Queue page

### 3. Test Google Sheets Sync
- Login to dashboard
- Click "Sync Google"
- Should fetch rows from your sheet

### 4. Test Ticket Approval
- Click on a pending request
- Click "Approve"
- Should create tickets and send email

### 5. Test QR Scanner
- Go to `/scan`
- Scan a ticket QR code
- Should show green "ADMIT" screen
- Scan again → red "already redeemed"

---

## Troubleshooting

### API doesn't start on Render
- Check build logs: Look for TypeScript errors
- Verify `dist/server.js` exists after build
- Check env vars are set correctly

### Frontend shows CORS errors
- Verify API `APP_URL` env var matches Netlify URL
- Check Render logs for CORS errors
- Ensure both HTTP and HTTPS match

### Emails not sending
- Verify `GMAIL_APP_PASSWORD` is correct
- Check Render logs for email errors
- Test with a different email provider (Resend/SendGrid)

### Puppeteer crashes on Render
Render Free tier has limited memory. If PDFs fail:
1. Upgrade to Render Standard plan ($7/month)
2. Or use a lighter PDF library
3. Or generate PDFs client-side

### Supabase connection fails
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Check Supabase dashboard for connection issues
- Ensure RLS policies are correct

---

## Optional: Custom Domain

### For Netlify (Frontend)
1. Go to **Domain settings**
2. Click **Add custom domain**
3. Follow DNS configuration steps

### For Render (Backend)
1. Upgrade to paid plan ($7/month)
2. Go to **Settings** → **Custom Domain**
3. Add your domain and configure DNS

---

## Monitoring

### Render
- View logs in real-time
- Set up alerts for errors
- Monitor CPU/memory usage

### Netlify
- Check build logs
- Monitor bandwidth usage
- View analytics

### Supabase
- Monitor database size
- Check API usage
- View auth logs

---

## Free Tier Limitations

**Render Free**:
- Spins down after 15 min inactivity
- Cold start takes ~30 seconds
- 750 hours/month limit

**Netlify Free**:
- 100 GB bandwidth/month
- 300 build minutes/month
- Unlimited sites

**Supabase Free**:
- 500 MB database
- 2 GB bandwidth/month
- 50,000 monthly active users

---

## Upgrade Recommendations

For production with real traffic:
1. **Render Standard** ($7/month): Always-on, no cold starts
2. **Supabase Pro** ($25/month): 8 GB database, daily backups
3. Consider **Cloudflare** for caching and CDN

---

## Security Checklist

- ✅ All secrets in environment variables (not in code)
- ✅ HTTPS enabled on both frontend and backend
- ✅ CORS configured correctly
- ✅ Supabase RLS policies enabled
- ✅ Rate limiting on API endpoints
- ✅ Helmet security headers on API
- ✅ Service account has minimal permissions

---

## Next Steps After Deployment

1. **Test with real users**: Send test tickets
2. **Monitor logs**: Watch for errors
3. **Set up alerts**: Get notified of issues
4. **Document for team**: Share URLs and access
5. **Plan for scale**: Consider upgrades if needed
