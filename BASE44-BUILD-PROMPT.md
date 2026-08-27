# PASTE THIS INTO BASE44 — Full FOYSAL IT build spec

Copy everything below the line and paste it into Base44's AI builder (base44.com → New Project / or your existing "DataSheet Hub" app's AI editor). Base44 will build the whole app and host it permanently.

---

Build a complete, production-ready web application called **FOYSAL IT** — an **AI-Powered Lead Intelligence, Digital Audit, Marketing Opportunity, Outreach Automation and Sales Management Platform**. Tagline: "Turn Every Lead Into An Opportunity."

## COMPANY
- Name: FOYSAL IT
- Call: +880175401123
- WhatsApp: +8801732088210
- Email: foysalahmed.dm23@gmail.com
- Website: https://foysalit.com
- Owner/admin account email: foysalimran890098@gmail.com

## DESIGN
- Professional SaaS, dark-purple brand (#180420 background, purple→gold gradient accents, "FT" logo).
- Clean, modern, mobile-first. Left sidebar navigation. Responsive (desktop/tablet/mobile).
- Use a real logo (purple/gold "FT" diamond mark) on a dark background.

## DATA MODEL (create these tables/collections)
1. **leads**: company, contactName, title, email, phone, whatsapp, website, industry, location, socialProfiles(json), enrichment(json), source, leadScore(0-100), scoreCategory(cold/warm/hot/priority), scoreReasons(json), websiteScore, seoScore, localSeoScore, socialScore, recommendedServices(json array), stage, dealValue, tags(json), lastContactedAt, nextFollowUpAt, auditedAt, createdAt.
2. **audits**: leadId, url, status, overallScore, technicalScore, onpageScore, performanceScore, conversionScore, localScore, socialScore, data(json), createdAt.
3. **audit_findings**: auditId, leadId, category, title, detail, severity(good/info/warning/critical), passed.
4. **opportunities**: leadId, company, category, problem, severity(low/medium/high/critical), evidence, business_impact, recommended_service, suggested_action, status(open/acknowledged/acted/dismissed).
5. **messages**: leadId, channel(email/whatsapp), subject, body, status(draft/approved/sent/replied), approved(bool), aiGenerated(bool), sentAt.
6. **campaigns**: name, channel, status(draft/active/paused), dailyLimit, leadCount, sentCount.
7. **users**: name, email, role(super_admin/member/admin/sales), createdAt. The email foysalimran890098@gmail.com is always super_admin (owner). Every other registration is a "member" with their own private workspace (row-level security per user/org).
8. **notifications**, **tasks**, **notes**, **ai_jobs**, **integrations**.

## CORE FEATURES (build ALL of these)

### 1. Lead Import
- Import from **Google Sheet** (URL) and **CSV/upload**.
- **One profile per person** (each row = one person/lead).
- Auto column mapping (First Name, Last Name → contactName; Company; Email; Phone; Website; Industry; City/State/Country → location; LinkedIn/Facebook/Twitter → socialProfiles).
- Preview + duplicate detection before import.
- Master Google Sheet URL: https://docs.google.com/spreadsheets/d/1I14GPL_LLCvSUyHT8aU2xDSJAXLxIDuUFweSDUrqWLA (tab gid=1267128335)

### 2. 360° Lead Profile
- Tabs: Overview, Website Audit, Opportunities, Outreach, Tasks & Notes, Timeline.
- Show all fields + social links + a "What should I do with this lead?" AI panel.
- AI lead score (0-100) with visible reasoning.

### 3. Website Auditor (real crawl via Edge Function / server function)
- Input a website URL → server-side function fetches the live HTML and analyzes:
  - Technical: HTTPS, robots.txt, sitemap.xml, canonical, schema/structured data.
  - On-page: title tag (length), meta description (length), H1 count, word count, image alt text, Open Graph.
  - Performance: mobile viewport, HTML size.
  - Conversion: contact form, phone, email presence.
  - Tracking: detect Google Analytics, GTM, Meta Pixel, Google Ads, TikTok Pixel in the HTML.
  - Local: LocalBusiness schema, map embed.
- Produce scores (0-100) for Technical, On-page, Performance, Conversion, Local, Social + an overall score.
- Store an audit + individual findings.

### 4. AI Opportunity Engine
- From the audit, generate opportunities, each with: problem, evidence, severity, business impact, recommended service, suggested action, confidence.

### 5. AI Service Matching (these 15 exact services)
- SEO (Search Engine Optimization)
- Social Media Marketing
- Social Media Management
- Meta Ads
- Google Ads
- Technical SEO
- YouTube SEO
- Local SEO & Google Maps Ranking
- GTM & GA4 Setup
- Backlink Services
- Keyword Research
- Backlink Index
- Full Digital Marketing
- Web Development
- Meta Pixel
- Map each detected problem to the right service(s) and store recommendedServices on the lead.

### 6. AI Lead Scoring
- 0-100 based on contactability, business relevance, detected service-fit, and website-audit gap.
- Categories: 0-39 cold, 40-59 warm, 60-79 hot, 80-100 priority. Show reasoning.

### 7. AI Outreach (personalized)
- Generate personalized Email (subject + body), Follow-up, and WhatsApp message from the lead's REAL detected opportunities (never generic).
- Include one real proof line and a link to https://foysalit.com.
- Workflow: AI generates → user reviews/edits → approves → sends.

### 8. Email Sending (real, via Gmail SMTP in an Edge/Server Function)
- Send through Gmail using the GMAIL_USER + GMAIL_APP_PASSWORD env vars (SMTP smtp.gmail.com:587), with Resend (RESEND_API_KEY) as backup.
- Enforce: human approval required, daily limit (min target 400, hard max 1500), suppression/unsubscribe list, duplicate prevention.
- Only show "Sent" after the email provider actually confirms. Never fake a send.

### 9. Sales Pipeline (kanban)
- Stages: New Lead, Researching, Audited, Qualified, Contacted, Replied, Interested, Meeting Booked, Proposal Sent, Negotiation, Won, Lost.
- Drag & drop, deal value, optimistic UI updates.

### 10. Dashboard
- KPI cards (total leads, priority leads, audited, sent emails, opportunities, revenue), priority leads list, top opportunities, pipeline snapshot, recent activity.

### 11. Reports
- Lead report, website audit report (professional, printable), weekly team notes, monthly status. Export CSV / print to PDF.

### 12. AI Copilot (floating, on every page)
- Conversational assistant that can query leads, explain scores, summarize, and give next-step advice. Voice input (speech-to-text) and voice output (speech-synthesis).

### 13. Voice / ASR page
- Real-time speech-to-text (browser SpeechRecognition), multi-language (Bangla, English, Japanese, Chinese, etc.), transcript + AI summary.

### 14. Multi-user / Members
- Public signup: anyone can create a free **member** account (own private workspace, row-level security).
- The email **foysalimran890098@gmail.com** is the **owner/super_admin** (sees everything + all members).
- Members page (admin-only) lists all registered members.

### 15. Integrations page
- Show status (connected/disconnected) for: Google Sheet, Gmail, Resend, WhatsApp, Google Analytics, Google Search Console, Google Business Profile, Google Ads, Meta.
- Explain required env vars; never expose secrets to the client.

### 16. A-Z Config page
- Show every environment setting as set/missing (database, mail, AI providers, integrations) — presence only, never secret values.

### 17. Database health page
- Show DB engine, table row counts, sizes, indexes.

## ENVIRONMENT VARIABLES (configure in Base44 settings, server-side only)
- Database: Base44/Supabase default (or my Neon)
- GMAIL_USER = foysalahmed.dm23@gmail.com
- GMAIL_APP_PASSWORD = (16-char Gmail app password)
- RESEND_API_KEY = (Resend key)
- SHEET_IMPORT_URL = https://docs.google.com/spreadsheets/d/1I14GPL_LLCvSUyHT8aU2xDSJAXLxIDuUFweSDUrqWLA
- GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (for Google Sheet/Gmail OAuth)

## RULES
- No fake data, no fake API results. If an integration isn't connected, show "Integration Required", never a fake success.
- No secrets in client-side code.
- Everything must be functional, not a static mock.
- Make it installable as a PWA (web app manifest, add-to-home-screen).

## HOSTING
- Host this app permanently on Base44.
- Connect the custom domain **foysalit.com** so the permanent live URL is https://foysalit.com.

Build the complete application now.
