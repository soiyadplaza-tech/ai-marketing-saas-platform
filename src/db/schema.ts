import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  jsonb,
  boolean,
  real,
  index,
} from "drizzle-orm/pg-core";

// ----------------------------------------------------------------------------
// Organizations & Users (org-level isolation model)
// ----------------------------------------------------------------------------
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().default(1),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("member"), // owner, admin, member
  active: boolean("active").notNull().default(true),
  passwordHash: text("password_hash"), // secure hash — NEVER plaintext; admin never sees it
  phone: text("phone"),
  country: text("country"),
  language: text("language").default("bn-BD"),
  company: text("company"),
  jobTitle: text("job_title"),
  bio: text("bio"),
  profilePhoto: text("profile_photo"),
  facebook: text("facebook"),
  linkedin: text("linkedin"),
  fiverrProfile: text("fiverr_profile"),
  upworkProfile: text("upwork_profile"),
  portfolio: text("portfolio"),
  website: text("website"),
  lastLoginAt: timestamp("last_login_at"),
  passwordChangedAt: timestamp("password_changed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sessions (for force-logout / session revocation)
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  token: text("token"),
  ip: text("ip"),
  device: text("device"),
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at"),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// API request log (near-real-time API monitoring)
export const apiRequests = pgTable("api_requests", {
  id: serial("id").primaryKey(),
  method: text("method").notNull(),
  path: text("path").notNull(),
  status: integer("status"),
  durationMs: integer("duration_ms"),
  userId: integer("user_id"),
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Security events (immutable-style audit trail for security-relevant actions)
export const securityEvents = pgTable("security_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  actorName: text("actor_name"),
  eventType: text("event_type").notNull(), // login, logout, failed_login, password_reset, role_change, session_revoked, account_disabled, api_error
  resource: text("resource"),
  ip: text("ip"),
  detail: text("detail"),
  status: text("status").default("ok"), // ok, warning, blocked
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// System errors / incidents (Error Center)
export const systemErrors = pgTable("system_errors", {
  id: serial("id").primaryKey(),
  service: text("service").notNull(),
  message: text("message"),
  severity: text("severity").default("warning"), // info, warning, error, critical
  impact: text("impact"),
  resolved: boolean("resolved").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Usage & cost tracking (AI / translation / voice / storage)
export const usage = pgTable("usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  service: text("service").notNull(), // ai, translation, stt, tts, meeting, storage, search
  amount: integer("amount").default(1),
  units: text("units").default("request"), // request, minute, mb
  estCost: real("est_cost").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Meetings (Google Meet + NOVA meetings)
export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id"),
  title: text("title").notNull(),
  meetingLink: text("meeting_link"),
  provider: text("provider").default("nova"), // nova, google_meet
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  participants: text("participants"),
  myLang: text("my_lang").default("bn-BD"),
  theirLang: text("their_lang").default("en-US"),
  status: text("status").default("scheduled"), // scheduled, live, completed
  summary: text("summary"),
  transcript: text("transcript"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Documents (Document Center)
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id"),
  fileName: text("file_name").notNull(),
  fileType: text("file_type"),
  size: integer("size").default(0),
  category: text("category").default("general"), // business, contract, quotation, proposal, report, sales, meeting, knowledge
  processing: text("processing").default("completed"), // uploaded, processing, completed, failed
  classification: text("classification").default("internal"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Feature flags (owner controls which features are available)
export const featureFlags = pgTable("feature_flags", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// AI provider / integration config (secrets masked, never exposed)
export const providerConfig = pgTable("provider_config", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // ai, stt, tts, translation, meet, search
  provider: text("provider").notNull(),
  model: text("model"),
  enabled: boolean("enabled").notNull().default(true),
  priority: integer("priority").default(1),
  maskedKey: text("masked_key"),
  status: text("status").default("not_connected"), // not_connected, connected, error, expired
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Subscriptions / plans
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  plan: text("plan").notNull().default("free"), // free, pro, business
  status: text("status").default("active"),
  renewsAt: timestamp("renews_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ----------------------------------------------------------------------------
// Leads (central entity)
// ----------------------------------------------------------------------------
export const leads = pgTable(
  "leads",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id").notNull().default(1),
    company: text("company").notNull(),
    contactName: text("contact_name"),
    title: text("title"),
    email: text("email"),
    phone: text("phone"),
    whatsapp: text("whatsapp"),
    website: text("website"),
    industry: text("industry"),
    location: text("location"),
    socialProfiles: jsonb("social_profiles").$type<Record<string, string>>().default({}),
    // Full per-person data captured from the source (keywords, seniority,
    // employees, departments, company address, and any extra columns).
    enrichment: jsonb("enrichment").$type<Record<string, string>>().default({}),
    source: text("source").default("manual"),
    // scores
    leadScore: integer("lead_score").default(0),
    scoreCategory: text("score_category").default("cold"), // cold, warm, hot, priority
    scoreReasons: jsonb("score_reasons").$type<string[]>().default([]),
    websiteScore: integer("website_score"),
    seoScore: integer("seo_score"),
    localSeoScore: integer("local_seo_score"),
    socialScore: integer("social_score"),
    // recommendations
    recommendedServices: jsonb("recommended_services").$type<string[]>().default([]),
    // pipeline
    status: text("status").notNull().default("new_lead"),
    stage: text("stage").notNull().default("new_lead"),
    dealValue: integer("deal_value").default(0),
    expectedCloseDate: timestamp("expected_close_date"),
    assignedUserId: integer("assigned_user_id"),
    tags: jsonb("tags").$type<string[]>().default([]),
    lastContactedAt: timestamp("last_contacted_at"),
    nextFollowUpAt: timestamp("next_follow_up_at"),
    auditedAt: timestamp("audited_at"),
    enriched: boolean("enriched").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index("leads_org_idx").on(t.orgId),
    stageIdx: index("leads_stage_idx").on(t.stage),
    scoreIdx: index("leads_score_idx").on(t.leadScore),
    emailIdx: index("leads_email_idx").on(t.email),
    websiteIdx: index("leads_website_idx").on(t.website),
    stageScoreIdx: index("leads_stage_score_idx").on(t.stage, t.leadScore),
    auditedIdx: index("leads_audited_idx").on(t.auditedAt),
    categoryIdx: index("leads_category_idx").on(t.scoreCategory),
  })
);

// ----------------------------------------------------------------------------
// Website Audits + Findings
// ----------------------------------------------------------------------------
export const audits = pgTable("audits", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().default(1),
  leadId: integer("lead_id"),
  url: text("url").notNull(),
  status: text("status").notNull().default("completed"), // queued, processing, completed, failed
  overallScore: integer("overall_score"),
  technicalScore: integer("technical_score"),
  onpageScore: integer("onpage_score"),
  performanceScore: integer("performance_score"),
  conversionScore: integer("conversion_score"),
  localScore: integer("local_score"),
  socialScore: integer("social_score"),
  data: jsonb("data").$type<Record<string, unknown>>().default({}),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditFindings = pgTable("audit_findings", {
  id: serial("id").primaryKey(),
  auditId: integer("audit_id").notNull(),
  leadId: integer("lead_id"),
  category: text("category").notNull(), // technical, onpage, performance, conversion, local, social, tracking
  title: text("title").notNull(),
  detail: text("detail"),
  severity: text("severity").notNull().default("info"), // good, info, warning, critical
  passed: boolean("passed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ----------------------------------------------------------------------------
// Opportunities (AI opportunity engine output)
// ----------------------------------------------------------------------------
export const opportunities = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().default(1),
  leadId: integer("lead_id").notNull(),
  problem: text("problem").notNull(),
  evidence: text("evidence"),
  severity: text("severity").notNull().default("medium"), // low, medium, high
  businessImpact: text("business_impact"),
  recommendedService: text("recommended_service").notNull(),
  recommendedAction: text("recommended_action"),
  confidence: integer("confidence").default(70),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ----------------------------------------------------------------------------
// Campaigns & Steps (outreach sequences)
// ----------------------------------------------------------------------------
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().default(1),
  name: text("name").notNull(),
  channel: text("channel").notNull().default("email"), // email, whatsapp
  status: text("status").notNull().default("draft"), // draft, active, paused, completed
  dailyLimit: integer("daily_limit").default(400),
  targetFilter: jsonb("target_filter").$type<Record<string, unknown>>().default({}),
  leadCount: integer("lead_count").default(0),
  sentCount: integer("sent_count").default(0),
  repliedCount: integer("replied_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const campaignSteps = pgTable("campaign_steps", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  dayOffset: integer("day_offset").notNull().default(0),
  channel: text("channel").notNull().default("email"),
  subject: text("subject"),
  body: text("body"),
  orderIndex: integer("order_index").notNull().default(0),
});

// ----------------------------------------------------------------------------
// Messages (email + whatsapp outreach, with approval workflow)
// ----------------------------------------------------------------------------
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().default(1),
  leadId: integer("lead_id"),
  campaignId: integer("campaign_id"),
  channel: text("channel").notNull().default("email"), // email, whatsapp
  direction: text("direction").notNull().default("outbound"),
  subject: text("subject"),
  body: text("body").notNull(),
  status: text("status").notNull().default("draft"), // draft, approved, scheduled, sent, delivered, bounced, replied
  approved: boolean("approved").notNull().default(false),
  aiGenerated: boolean("ai_generated").notNull().default(false),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ----------------------------------------------------------------------------
// Tasks, Notes, Activities (timeline)
// ----------------------------------------------------------------------------
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().default(1),
  leadId: integer("lead_id"),
  title: text("title").notNull(),
  description: text("description"),
  dueAt: timestamp("due_at"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("open"), // open, done
  assignedUserId: integer("assigned_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  body: text("body").notNull(),
  author: text("author").default("You"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().default(1),
  leadId: integer("lead_id"),
  type: text("type").notNull(), // created, imported, audited, scored, outreach, stage_change, note, task, reply
  message: text("message").notNull(),
  meta: jsonb("meta").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ----------------------------------------------------------------------------
// Notifications
// ----------------------------------------------------------------------------
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().default(1),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  leadId: integer("lead_id"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ----------------------------------------------------------------------------
// Files (import / AI processing library)
// ----------------------------------------------------------------------------
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().default(1),
  name: text("name").notNull(),
  fileType: text("file_type").notNull(),
  size: integer("size").default(0),
  uploadedBy: text("uploaded_by").default("You"),
  relatedLeadId: integer("related_lead_id"),
  status: text("status").notNull().default("uploaded"), // uploaded, processing, completed, failed
  aiStatus: text("ai_status").default("pending"),
  extracted: jsonb("extracted").$type<Record<string, unknown>>().default({}),
  recordsFound: integer("records_found").default(0),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ----------------------------------------------------------------------------
// AI Actions / Processing jobs
// ----------------------------------------------------------------------------
export const aiJobs = pgTable("ai_jobs", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().default(1),
  type: text("type").notNull(), // website_audit, pdf_analysis, enrichment, scoring, email_gen, report
  label: text("label").notNull(),
  leadId: integer("lead_id"),
  status: text("status").notNull().default("completed"), // queued, processing, completed, failed
  durationMs: integer("duration_ms").default(0),
  result: jsonb("result").$type<Record<string, unknown>>().default({}),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ----------------------------------------------------------------------------
// Integrations
// ----------------------------------------------------------------------------
export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().default(1),
  provider: text("provider").notNull(), // google_sheets, email, whatsapp, ga, gsc, gbp, google_ads, meta, crawler, webhook
  status: text("status").notNull().default("disconnected"), // connected, disconnected, error
  config: jsonb("config").$type<Record<string, unknown>>().default({}),
  lastTestedAt: timestamp("last_tested_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ----------------------------------------------------------------------------
// Automation workflows
// ----------------------------------------------------------------------------
export const automations = pgTable("automations", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().default(1),
  name: text("name").notNull(),
  trigger: text("trigger").notNull(),
  enabled: boolean("enabled").notNull().default(false),
  steps: jsonb("steps").$type<Array<Record<string, unknown>>>().default([]),
  runCount: integer("run_count").default(0),
  config: jsonb("config").$type<Record<string, unknown>>().default({}),
  lastRunAt: timestamp("last_run_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Password reset tokens (expired tokens are ignored; single-use).
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().default(1),
  email: text("email").notNull(),
  token: text("token").notNull(),
  used: boolean("used").notNull().default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ----------------------------------------------------------------------------
// Gmail integration (real OAuth 2.0 + Gmail API)
// ----------------------------------------------------------------------------
export const gmailAccounts = pgTable("gmail_accounts", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().default(1),
  userEmail: text("user_email").notNull(), // the connected Gmail address
  scopes: text("scopes"),
  accessTokenEnc: text("access_token_enc").notNull(), // AES-256-GCM encrypted
  refreshTokenEnc: text("refresh_token_enc").notNull(), // AES-256-GCM encrypted
  connectedAt: timestamp("connected_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at"),
  disconnected: boolean("disconnected").notNull().default(false),
});

export const emailActivity = pgTable("email_activity", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().default(1),
  gmailEmail: text("gmail_email"),
  leadId: integer("lead_id"),
  recipient: text("recipient"),
  subject: text("subject"),
  action: text("action").notNull(), // view | read | ai | draft | sent | reply | error
  gmailMessageId: text("gmail_message_id"),
  gmailThreadId: text("gmail_thread_id"),
  aiGenerated: boolean("ai_generated").notNull().default(false),
  status: text("status").default("ok"), // ok | failed
  detail: text("detail"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Deals derived from leads via pipeline stage; keep suppression list for compliance.
export const suppressions = pgTable("suppressions", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().default(1),
  email: text("email"),
  reason: text("reason").default("unsubscribe"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Audit = typeof audits.$inferSelect;
export type Opportunity = typeof opportunities.$inferSelect;
export type Message = typeof messages.$inferSelect;
