# FOYSAL IT — FULL PROJECT OVERVIEW

## 1. PRODUCT
**FOYSAL IT** — AI-Powered Lead Intelligence, Digital Audit, Marketing Opportunity,
Outreach Automation & Sales Management Platform.

**Tagline:** Turn Every Lead Into An Opportunity.

## 2. COMPANY INFO
- Call: +880175401123
- WhatsApp: +8801732088210 (wa.me/8801732088210)
- Email: foysalahmed.dm23@gmail.com
- Website: https://sites.google.com/view/foysal-it/
- Portfolio: https://sites.google.com/view/foysal-it/portfolio
- Domain: foysalit.com (Hostinger, active till 17 Apr 2027)
- Existing Base44 app: https://foysalit.base44.app (DataSheet Hub)

## 3. TECH STACK
- Next.js 16 (App Router) + React 19 + Tailwind CSS
- PostgreSQL + Drizzle ORM (18 tables, auto-schema self-heal on boot)
- Node 22, nodemailer (SMTP), Web Speech API (voice)
- No fake data anywhere — every integration result is real

## 4. DATA
- Master source: Google Sheet (gid=1267128335) — auto-imported when DB is empty
- ~45,600+ per-person lead profiles (contact, title, email, phone, website,
  industry, location, socials, keywords, full enrichment of every column)
- One profile per person, duplicate-protected (email + website)

## 5. MODULES (all live)
### Intelligence
- **AI Website Auditor** — real fetch + parse: HTTPS, meta, H1, alt text, schema,
  viewport, robots, sitemap, tracking pixels (GA/GTM/Meta/Google Ads), scores
  (technical/onpage/performance/conversion/local/social), findings with evidence
- **AI Opportunity Engine** — problem → evidence → severity → impact → service → action → confidence
- **AI Lead Scoring** — 0–100, Cold/Warm/Hot/Priority, with visible reasoning
- **A→Z Service Audit Matrix** — status of all 15 services per audited lead
- **AI Command Center** — plain-language queries (voice mic included)
- **AI Copilot** — floating on every page: live stats, 30-year marketing playbooks,
  service explainers, lead finder, voice input + voice output
- **Reports Center** — lead / audit / weekly notes / monthly status, CSV export
- **Lead profile** — 360° tabs, score breakdown, service matrix, notes, tasks, timeline
- **Leads** — search/filter/sort/paginate, full CSV export (all 26 columns)
- **Pipeline** — 12-stage kanban, drag & drop, deal values

### Outreach & Automation
- **Personalized outreach** — email + follow-up + WhatsApp drafts from real audit
  findings, 30-year insight lines + real portfolio proof lines
- **Small-batch approval** — approve 5/10/25 at a time (never bulk-blind)
- **Daily AI Auto-Outreach (Pilot)** — audit → score → draft → auto-approve small
  batch → send; 400/day minimum target, 1500 hard cap; once-per-day guard
- **Email Robot** — Gmail SMTP primary, Resend backup, SendGrid fallback;
  sender FOYSAL IT <foysalahmed.dm23@gmail.com>; credentials editable in-app
  (Domain → Email Robot) with live real test send
- **Cron autopilot** — /api/cron/autopilot for cron-job.org (rate-limited, token-optional)
- **Campaigns** — 5-step sequences (Day 1/3/6/10/15), daily limits, pause/resume
- **Responsible automation** — suppression list, unsubscribe, no fake sends

### Public (marketing)
- Landing (brand theme from FT logo), **/services** (15 categories + detail pages),
  **/portfolio** (10 real case studies + Drive/Sheet/Doc proof links),
  **/clients** (what clients need/get, 4-step process, FAQ), **/contact**

### Account & Admin
- Login / Register / Forgot+Reset password (token link + in-app fallback)
- **Stable session IDs** — login survives app restarts (proven by test)
- Team (roles/permissions), Domain setup, Integrations (Base44/Resend/SMTP/etc.),
  System Check, Processing Center (AI jobs + files), Social media manager pages,
  Google Apps Script sheet publisher guide, Fiverr/Upwork profile links

## 6. SERVICES (15)
SEO · Social Media Marketing · Social Media Management · Meta Ads · Google Ads ·
Technical SEO · YouTube SEO · Local SEO & Google Maps Ranking · GTM & GA4 Setup ·
Backlink Services · Keyword Research · Backlink Index · Full Digital Marketing ·
Web Development · Meta Pixel

## 7. PORTFOLIO (real, linked in app)
- Desert Light Studio (Dubai) — 1-Month SEO Plan + SWOT + 30+ US competitor analysis (Google Doc)
- Health Website Traffic Growth Case Study (PDF, Drive "My Portfolio")
- Complete WooCommerce Project (PDF)
- Dar al Imdad Home Furnishing — site audit
- FEMECart — audit sheet
- Blue Reserve — Google Ads keyword + ad copy + campaign setup + GTM/GA4 proofs
- agriculturalgov.br.com — 440 profile backlinks
- Shan Haoundies — keyword research
- High-Quality Mix Backlink portfolio (live Google Sheet)
- Nishu4shaku — weekly reporting
Drive proofs: 1Ybasgs8GP3tzCZNGEsf_uOLwMlE9n5f8 / 17LXE5pG6i18GYc8TGn14aNz0QotMZ0Yg

## 8. CREDENTIALS & LOGIN
- App login: admin@foysalit.com / foysal@2026 (or one-click demo button)
- Gmail: foysalahmed.dm23@gmail.com + 16-char app password
  (myaccount.google.com/apppasswords) — set in app: Domain → Email Robot → Save → Send test
- Resend API key: configured (backup mail)
- Base44: app id + api key: configured (DataSheet Hub import)
- All secrets server-side only; never exposed to browser

## 9. CURRENT URLS
- Live dev preview: (latest from build_and_start — changes on sandbox restart)
- Permanent (after Vercel deploy, Option B in DEPLOY-VERCEL.md):
  https://foysalit.com  +  cron: https://foysalit.com/api/cron/autopilot

## 10. PENDING USER STEPS (checklist)
1. [ ] Gmail 16-char app password → Domain → Email Robot → Save → Send test (mail robot ON)
2. [ ] Choose domain option: A) Base44 app on domain, or B) full AI platform on
    foysalit.com via Vercel (recommended — DEPLOY-VERCEL.md, 5 min)
3. [ ] Re-enable Hostinger Registrar Lock (EPP code = domain password)
4. [ ] (Optional) Verify foysalit.com DNS in Resend for extra mail backup
5. [ ] (Optional) cron-job.org → https://foysalit.com/api/cron/autopilot → daily 09:00

## 11. VALIDATION STATUS
- next typegen ✅ · tsc --noEmit ✅ · npm run build ✅ · build_and_start ✅
- Login/session stable across DB reset (tested) ✅
- Copilot / command / export / audit / outreach endpoints (tested live) ✅
- Mail chain honest end-to-end (Gmail 535 + Resend backup error surfaced, no fakes) ✅
