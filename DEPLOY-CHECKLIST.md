# 🚀 Quick Deployment Checklist

## Before You Start
- [ ] Commit all changes to Git
- [ ] Push to GitHub
- [ ] Have Supabase schema deployed (run `docs/schema.sql`)
- [ ] Have Google Sheets service account email shared to your sheet
- [ ] Have Gmail App Password ready

---

## 1️⃣ Deploy Backend (Render)

### Create Service
- [ ] Go to https://render.com/
- [ ] New → Web Service → Connect GitHub repo
- [ ] Root Directory: `apps/api`
- [ ] Build: `npm install && npm run build`
- [ ] Start: `npm start`

### Add Environment Variables
Copy these from your local `.env` and add in Render dashboard:
```
NODE_ENV=production
PORT=3001
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_SPREADSHEET_ID=
GOOGLE_SERVICE_ACCOUNT_JSON=
EMAIL_PROVIDER=gmail
EMAIL_SENDER_ADDRESS=
GMAIL_APP_PASSWORD=
PUBLIC_TICKET_BASE_URL=https://YOUR-API-NAME.onrender.com
APP_URL=https://YOUR-APP-NAME.netlify.app
```

- [ ] Click "Create Web Service"
- [ ] Wait for deploy (~5 min)
- [ ] Note your API URL: `https://______.onrender.com`
- [ ] Test: Visit `https://______.onrender.com/health`

---

## 2️⃣ Deploy Frontend (Netlify)

### Create Site
- [ ] Go to https://netlify.com/
- [ ] Import from GitHub → Select repo
- [ ] Base directory: `apps/web`
- [ ] Build: `npm run build`
- [ ] Publish: `apps/web/dist`

### Add Environment Variables
Add in Netlify → Site Settings → Environment Variables:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=https://your-api.onrender.com
```

- [ ] Deploy
- [ ] Note your URL: `https://______.netlify.app`

---

## 3️⃣ Update URLs

### Update Render
- [ ] Go back to Render → Environment
- [ ] Update `APP_URL` to your Netlify URL
- [ ] Update `PUBLIC_TICKET_BASE_URL` to your Render URL
- [ ] Save (auto-redeploys)

### Update Supabase
- [ ] Supabase Dashboard → Authentication → URL Configuration
- [ ] Site URL: Your Netlify URL
- [ ] Redirect URLs: `https://your-app.netlify.app/**`

---

## 4️⃣ Test Everything

- [ ] Visit your Netlify URL
- [ ] Login with magic link
- [ ] Sync Google Sheets
- [ ] Approve a request
- [ ] Check email received
- [ ] Download PDF ticket
- [ ] Scan QR code on `/scan` page
- [ ] Verify redemption in scan monitor

---

## ✅ Done!

Your app is live at:
- **Frontend**: https://______.netlify.app
- **API**: https://______.onrender.com

---

## 🐛 Common Issues

**"Can't reach API"**
→ Check CORS: `APP_URL` in Render must match Netlify URL exactly

**"Emails not sending"**
→ Check Gmail App Password is correct in Render env vars

**"Puppeteer crashes"**
→ Render Free tier has limited memory, may need paid plan for PDFs

**"Cold start slow"**
→ Render Free spins down after 15 min. First request takes ~30s

---

See DEPLOYMENT.md for full details and troubleshooting.
