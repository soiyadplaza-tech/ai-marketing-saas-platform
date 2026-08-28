import { db } from "@/db";
import { sql } from "drizzle-orm";

let ensured = false;
let inFlight: Promise<void> | null = null;

// Runtime safety net: creates/repairs the database schema if the preview DB was
// reset and `drizzle-kit push` has not been run yet. This prevents app pages
// from crashing with "relation leads does not exist".
export async function ensureSchema(): Promise<void> {
  if (ensured) return;
  if (inFlight) return inFlight;
  inFlight = doEnsure().then(() => {
    ensured = true;
    inFlight = null;
  }).catch((e) => {
    inFlight = null;
    throw e;
  });
  return inFlight;
}

async function doEnsure() {
  await db.execute(sql.raw(`
CREATE TABLE IF NOT EXISTS organizations (
  id serial PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  org_id integer NOT NULL DEFAULT 1,
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'sales',
  active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id serial PRIMARY KEY,
  org_id integer NOT NULL DEFAULT 1,
  company text NOT NULL,
  contact_name text,
  title text,
  email text,
  phone text,
  whatsapp text,
  website text,
  industry text,
  location text,
  social_profiles jsonb DEFAULT '{}'::jsonb,
  enrichment jsonb DEFAULT '{}'::jsonb,
  source text DEFAULT 'manual',
  lead_score integer DEFAULT 0,
  score_category text DEFAULT 'cold',
  score_reasons jsonb DEFAULT '[]'::jsonb,
  website_score integer,
  seo_score integer,
  local_seo_score integer,
  social_score integer,
  recommended_services jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'new_lead',
  stage text NOT NULL DEFAULT 'new_lead',
  deal_value integer DEFAULT 0,
  expected_close_date timestamp,
  assigned_user_id integer,
  tags jsonb DEFAULT '[]'::jsonb,
  last_contacted_at timestamp,
  next_follow_up_at timestamp,
  audited_at timestamp,
  enriched boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

ALTER TABLE leads ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS enrichment jsonb DEFAULT '{}'::jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS social_profiles jsonb DEFAULT '{}'::jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score_reasons jsonb DEFAULT '[]'::jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS recommended_services jsonb DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS audits (
  id serial PRIMARY KEY,
  org_id integer NOT NULL DEFAULT 1,
  lead_id integer,
  url text NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  overall_score integer,
  technical_score integer,
  onpage_score integer,
  performance_score integer,
  conversion_score integer,
  local_score integer,
  social_score integer,
  data jsonb DEFAULT '{}'::jsonb,
  error text,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_findings (
  id serial PRIMARY KEY,
  audit_id integer NOT NULL,
  lead_id integer,
  category text NOT NULL,
  title text NOT NULL,
  detail text,
  severity text NOT NULL DEFAULT 'info',
  passed boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opportunities (
  id serial PRIMARY KEY,
  org_id integer NOT NULL DEFAULT 1,
  lead_id integer NOT NULL,
  problem text NOT NULL,
  evidence text,
  severity text NOT NULL DEFAULT 'medium',
  business_impact text,
  recommended_service text NOT NULL,
  recommended_action text,
  confidence integer DEFAULT 70,
  status text NOT NULL DEFAULT 'open',
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id serial PRIMARY KEY,
  org_id integer NOT NULL DEFAULT 1,
  name text NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  status text NOT NULL DEFAULT 'draft',
  daily_limit integer DEFAULT 400,
  target_filter jsonb DEFAULT '{}'::jsonb,
  lead_count integer DEFAULT 0,
  sent_count integer DEFAULT 0,
  replied_count integer DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campaign_steps (
  id serial PRIMARY KEY,
  campaign_id integer NOT NULL,
  day_offset integer NOT NULL DEFAULT 0,
  channel text NOT NULL DEFAULT 'email',
  subject text,
  body text,
  order_index integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS messages (
  id serial PRIMARY KEY,
  org_id integer NOT NULL DEFAULT 1,
  lead_id integer,
  campaign_id integer,
  channel text NOT NULL DEFAULT 'email',
  direction text NOT NULL DEFAULT 'outbound',
  subject text,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  approved boolean NOT NULL DEFAULT false,
  ai_generated boolean NOT NULL DEFAULT false,
  scheduled_at timestamp,
  sent_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id serial PRIMARY KEY,
  org_id integer NOT NULL DEFAULT 1,
  lead_id integer,
  title text NOT NULL,
  description text,
  due_at timestamp,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  assigned_user_id integer,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notes (
  id serial PRIMARY KEY,
  lead_id integer NOT NULL,
  body text NOT NULL,
  author text DEFAULT 'You',
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activities (
  id serial PRIMARY KEY,
  org_id integer NOT NULL DEFAULT 1,
  lead_id integer,
  type text NOT NULL,
  message text NOT NULL,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id serial PRIMARY KEY,
  org_id integer NOT NULL DEFAULT 1,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  lead_id integer,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS files (
  id serial PRIMARY KEY,
  org_id integer NOT NULL DEFAULT 1,
  name text NOT NULL,
  file_type text NOT NULL,
  size integer DEFAULT 0,
  uploaded_by text DEFAULT 'You',
  related_lead_id integer,
  status text NOT NULL DEFAULT 'uploaded',
  ai_status text DEFAULT 'pending',
  extracted jsonb DEFAULT '{}'::jsonb,
  records_found integer DEFAULT 0,
  error text,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_jobs (
  id serial PRIMARY KEY,
  org_id integer NOT NULL DEFAULT 1,
  type text NOT NULL,
  label text NOT NULL,
  lead_id integer,
  status text NOT NULL DEFAULT 'completed',
  duration_ms integer DEFAULT 0,
  result jsonb DEFAULT '{}'::jsonb,
  error text,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS integrations (
  id serial PRIMARY KEY,
  org_id integer NOT NULL DEFAULT 1,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'disconnected',
  config jsonb DEFAULT '{}'::jsonb,
  last_tested_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS automations (
  id serial PRIMARY KEY,
  org_id integer NOT NULL DEFAULT 1,
  name text NOT NULL,
  trigger text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  steps jsonb DEFAULT '[]'::jsonb,
  run_count integer DEFAULT 0,
  config jsonb DEFAULT '{}'::jsonb,
  last_run_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

ALTER TABLE automations ADD COLUMN IF NOT EXISTS config jsonb DEFAULT '{}'::jsonb;
ALTER TABLE automations ADD COLUMN IF NOT EXISTS last_run_at timestamp;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS fiverr_profile text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS upwork_profile text;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id serial PRIMARY KEY,
  org_id integer NOT NULL DEFAULT 1,
  email text NOT NULL,
  token text NOT NULL,
  used boolean NOT NULL DEFAULT false,
  expires_at timestamp NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gmail_accounts (
  id serial PRIMARY KEY,
  org_id integer NOT NULL DEFAULT 1,
  user_email text NOT NULL,
  scopes text,
  access_token_enc text NOT NULL,
  refresh_token_enc text NOT NULL,
  connected_at timestamp NOT NULL DEFAULT now(),
  last_used_at timestamp,
  disconnected boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS email_activity (
  id serial PRIMARY KEY,
  org_id integer NOT NULL DEFAULT 1,
  gmail_email text,
  lead_id integer,
  recipient text,
  subject text,
  action text NOT NULL,
  gmail_message_id text,
  gmail_thread_id text,
  ai_generated boolean NOT NULL DEFAULT false,
  status text DEFAULT 'ok',
  detail text,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS suppressions (
  id serial PRIMARY KEY,
  org_id integer NOT NULL DEFAULT 1,
  email text,
  reason text DEFAULT 'unsubscribe',
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_org_idx ON leads(org_id);
CREATE INDEX IF NOT EXISTS leads_stage_idx ON leads(stage);
CREATE INDEX IF NOT EXISTS leads_score_idx ON leads(lead_score);

-- Performance indexes for large datasets (45k+ leads).
CREATE INDEX IF NOT EXISTS leads_email_idx ON leads(email);
CREATE INDEX IF NOT EXISTS leads_website_idx ON leads(website);
CREATE INDEX IF NOT EXISTS leads_stage_score_idx ON leads(stage, lead_score DESC);
CREATE INDEX IF NOT EXISTS leads_audited_idx ON leads(audited_at);
CREATE INDEX IF NOT EXISTS leads_category_idx ON leads(score_category);
CREATE INDEX IF NOT EXISTS messages_status_idx ON messages(status);
CREATE INDEX IF NOT EXISTS messages_created_idx ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS email_activity_recipient_idx ON email_activity(recipient, created_at DESC);
CREATE INDEX IF NOT EXISTS email_activity_action_idx ON email_activity(action, created_at DESC);
CREATE INDEX IF NOT EXISTS activities_org_created_idx ON activities(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_org_read_idx ON notifications(org_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS opportunities_lead_idx ON opportunities(lead_id);
CREATE INDEX IF NOT EXISTS audit_findings_lead_idx ON audit_findings(lead_id);

-- Extend users with profile fields (add if missing)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS language text DEFAULT 'bn-BD';
ALTER TABLE users ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS facebook text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS portfolio text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at timestamp;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at timestamp;

CREATE TABLE IF NOT EXISTS sessions (
  id serial PRIMARY KEY,
  user_id integer NOT NULL,
  token text,
  ip text,
  device text,
  user_agent text,
  expires_at timestamp,
  revoked_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS api_requests (
  id serial PRIMARY KEY,
  method text NOT NULL,
  path text NOT NULL,
  status integer,
  duration_ms integer,
  user_id integer,
  ip text,
  user_agent text,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS security_events (
  id serial PRIMARY KEY,
  user_id integer,
  actor_name text,
  event_type text NOT NULL,
  resource text,
  ip text,
  detail text,
  status text DEFAULT 'ok',
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS system_errors (
  id serial PRIMARY KEY,
  service text NOT NULL,
  message text,
  severity text DEFAULT 'warning',
  impact text,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS usage (
  id serial PRIMARY KEY,
  user_id integer,
  service text NOT NULL,
  amount integer DEFAULT 1,
  units text DEFAULT 'request',
  est_cost real DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS meetings (
  id serial PRIMARY KEY,
  owner_id integer,
  title text NOT NULL,
  meeting_link text,
  provider text DEFAULT 'nova',
  starts_at timestamp,
  ends_at timestamp,
  participants text,
  my_lang text DEFAULT 'bn-BD',
  their_lang text DEFAULT 'en-US',
  status text DEFAULT 'scheduled',
  summary text,
  transcript text,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS documents (
  id serial PRIMARY KEY,
  owner_id integer,
  file_name text NOT NULL,
  file_type text,
  size integer DEFAULT 0,
  category text DEFAULT 'general',
  processing text DEFAULT 'completed',
  classification text DEFAULT 'internal',
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS feature_flags (
  id serial PRIMARY KEY,
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  description text,
  updated_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS provider_config (
  id serial PRIMARY KEY,
  key text NOT NULL UNIQUE,
  provider text NOT NULL,
  model text,
  enabled boolean NOT NULL DEFAULT true,
  priority integer DEFAULT 1,
  masked_key text,
  status text DEFAULT 'not_connected',
  updated_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS subscriptions (
  id serial PRIMARY KEY,
  user_id integer NOT NULL,
  plan text NOT NULL DEFAULT 'free',
  status text DEFAULT 'active',
  renews_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);
  `));
}
