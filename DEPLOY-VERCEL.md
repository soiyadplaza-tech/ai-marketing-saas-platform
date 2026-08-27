# FOYSAL IT — Permanent Link Setup (foysalit.com)

## ⚠️ Important: Base44 can NOT run this app
Base44 is a no-code builder — it only serves apps built inside Base44
(your DataSheet Hub app). This AI platform (Next.js + Postgres) is custom code,
so it must be hosted on a real app host (Vercel/Render/VPS). Two options:

### Option A — Base44 app on your domain (fast, shows the OLD app)
1. **Vercel dashboard** → your account → **Domains** → Add `foysalit.com`
   (your nameservers are already on Vercel, so DNS is managed in Vercel, not Hostinger).
2. In Vercel DNS add:
   - `www` → CNAME → `base44.onrender.com`
   - apex (`@`) → ALIAS/ANAME → `base44.onrender.com`
3. **Base44** → your app → **Dashboard → Domains → Connect existing domain** → `foysalit.com`
4. Wait for green check → `foysalit.com` now opens your Base44 app.
   (SSL is automatic. Hostinger: re-enable Registrar Lock after this.)

### Option B — this full AI platform on your domain (recommended)
Follow the Vercel steps below. The domain opens the new platform with
45k+ leads, AI Pilot, Copilot, autopilot email robot, portfolio, etc.

---
## Option B — Deploy to Vercel (5 minutes)

Your domain **foysalit.com** is already:
- Registered on Hostinger (active until Apr 17, 2027) ✅
- Nameservers set to **Vercel**: `echo.balancedserver.com` + `pulse.balancedserver.com` ✅

So the fastest permanent path is: **deploy this app to Vercel** → add the domain → done.

## Step 1 — Push this project to GitHub
```
git init
git add .
git commit -m "FOYSAL IT platform"
# create a repo on github.com (e.g. foysal-it-app), then:
git remote add origin https://github.com/YOUR_USER/foysal-it-app.git
git push -u origin main
```

## Step 2 — Import into Vercel
1. Go to **vercel.com/new** (log in with the account that owns the domain).
2. Pick the GitHub repo → **Deploy**.
3. Framework preset: **Next.js** (auto-detected).

## Step 3 — Add a database (one-time, free tier)
The app needs PostgreSQL. Easiest free options: **Neon** (neon.tech) or **Vercel Postgres**.
1. Create a database → copy the connection string, e.g. `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`
2. In Vercel project → Settings → Environment Variables, add **all** of these:

| Variable | Value |
|---|---|
| `DATABASE_URL` | your Neon/Supabase connection string |
| `GMAIL_USER` | `foysalahmed.dm23@gmail.com` |
| `GMAIL_APP_PASSWORD` | your 16-character Gmail app password |
| `RESEND_API_KEY` | your Resend key (backup mail service) |
| `BASE44_APP_ID` | your Base44 app id |
| `BASE44_API_KEY` | your Base44 api key |
| `SHEET_IMPORT_URL` | your master Google Sheet URL |
| `APP_BASE_URL` | `https://foysalit.com` |

## Step 4 — Add the domain
1. Vercel project → **Settings → Domains** → Add `foysalit.com` (and `www.foysalit.com`).
2. Because the nameservers are ALREADY on Vercel, it verifies **instantly** (no DNS changes needed).
3. Vercel issues a free SSL certificate automatically.

## Step 5 — First visit (automatic)
Open **https://foysalit.com** once. The app will:
- create its database tables automatically,
- auto-import the 45k+ leads from your Google Sheet,
- create the demo admin (`admin@foysalit.com` / `foysal@2026`).

Done. **This URL never changes** — that's your permanent link.

## Permanent daily robot (cron)
Your cron URL becomes permanent too:
```
https://foysalit.com/api/cron/autopilot
```
Point cron-job.org (or any scheduler) at it, every day 09:00. The AI audits,
writes human-like emails, auto-approves a small batch and sends via Gmail
(backup: Resend). 400–1500/day cap.

## Notes & safety
- **Re-enable the Hostinger registrar lock** now (Actions → Registrar Lock) — the
  EPP/auth code is like a password for the domain; keep it private.
- On the free Vercel plan, long requests cap at 10s — the app auto-reduces its
  daily audit batch when it detects Vercel (`process.env.VERCEL`), so the cron
  stays fast. If you want bigger batches, upgrade to Pro.
- Gmail sending needs the 16-char app password (myaccount.google.com/apppasswords).
  Test it from the app: Domain page → Email Robot → Send test.
