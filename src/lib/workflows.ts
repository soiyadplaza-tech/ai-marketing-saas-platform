// Catalog of the requested workflows. Each is honestly tagged:
//  - "active": works today on internal data (no external provider needed)
//  - "required": needs an external integration to be connected first
export interface WorkflowItem {
  name: string;
  status: "active" | "required";
  needs?: string;
  href?: string;
}
export interface WorkflowGroup {
  group: string;
  icon: string;
  items: WorkflowItem[];
}

export const WORKFLOWS: WorkflowGroup[] = [
  {
    group: "Reports & Documents",
    icon: "📄",
    items: [
      { name: "Generate audit summary reports from analysis data", status: "active", href: "/reports" },
      { name: "Format lead audit findings into professional reports", status: "active", href: "/reports" },
      { name: "Compile weekly team performance meeting notes", status: "active", href: "/reports" },
      { name: "Generate monthly lead audit status reports", status: "active", href: "/reports" },
      { name: "Export analytics dashboard to team slide deck", status: "required", needs: "Google Slides" },
      { name: "Auto-update presentation with current KPI data", status: "required", needs: "Google Slides" },
    ],
  },
  {
    group: "Outreach & Email",
    icon: "✉️",
    items: [
      { name: "Create client outreach email drafts automatically", status: "active", href: "/outreach" },
      { name: "Generate outreach email drafts using AI models", status: "active", href: "/outreach" },
      { name: "Send outreach emails to leads (Resend connected)", status: "active", href: "/outreach" },
      { name: "Trigger batch email sequences from spreadsheet rows", status: "active", href: "/campaigns" },
      { name: "Notify team via mail when audit tasks complete", status: "required", needs: "Email provider (verified domain)" },
      { name: "Sync new email replies to the data dashboard", status: "required", needs: "Email inbox (IMAP/API)" },
    ],
  },
  {
    group: "Data Import & Sync",
    icon: "🗂️",
    items: [
      { name: "Import company leads from the master spreadsheet", status: "active", href: "/import" },
      { name: "Refresh operational data from the centralized dashboard", status: "active", href: "/import" },
      { name: "Sync spreadsheet records to shared company profiles", status: "active", href: "/leads" },
      { name: "Update lead stages from spreadsheet data analysis", status: "active", href: "/pipeline" },
      { name: "Sync team leads to shared workspace workbook", status: "required", needs: "Google Sheets" },
      { name: "Export qualified leads to shared team address book", status: "required", needs: "Google Contacts" },
    ],
  },
  {
    group: "Audit & Intelligence",
    icon: "🔍",
    items: [
      { name: "Analyze lead website data (real audits)", status: "active", href: "/audit" },
      { name: "Classify & score leads with AI reasoning", status: "active", href: "/leads" },
      { name: "Summarize lead intelligence from spreadsheet data", status: "active", href: "/command" },
      { name: "Highlight top prospects for conversion (AI agent)", status: "active", href: "/command" },
      { name: "Analyze top search queries across managed sites", status: "required", needs: "Google Search Console" },
      { name: "Monitor indexing & sitemap health for domains", status: "required", needs: "Google Search Console" },
    ],
  },
  {
    group: "Tasks & Calendar",
    icon: "📆",
    items: [
      { name: "Create team audit tasks for new leads", status: "active", href: "/leads" },
      { name: "Assign spreadsheet analysis tasks to team members", status: "active", href: "/team" },
      { name: "Schedule automated lead data review reminders", status: "active", href: "/leads" },
      { name: "Schedule team audit review sessions", status: "required", needs: "Google Calendar" },
      { name: "Create meeting links for lead discussions", status: "required", needs: "Google Calendar / Meet" },
    ],
  },
  {
    group: "Marketing & Ads",
    icon: "📣",
    items: [
      { name: "Recommend the right service per detected problem", status: "active", href: "/leads" },
      { name: "Sync leads into main marketing list", status: "required", needs: "Mailchimp" },
      { name: "Display real-time ROAS metrics for campaigns", status: "required", needs: "Google Ads / Meta" },
      { name: "Automate budget adjustments based on KPI goals", status: "required", needs: "Google Ads" },
      { name: "Track video performance & follower growth", status: "required", needs: "YouTube Analytics" },
    ],
  },
  {
    group: "Publishing & Social",
    icon: "🌐",
    items: [
      { name: "Publish lead outreach report summaries to followers", status: "required", needs: "LinkedIn" },
      { name: "Broadcast spreadsheet KPI highlights to the network", status: "required", needs: "LinkedIn" },
      { name: "Monitor company profile comments in dashboard", status: "required", needs: "LinkedIn" },
    ],
  },
  {
    group: "Payments & Ops",
    icon: "💳",
    items: [
      { name: "Create monthly subscription for premium features", status: "required", needs: "Stripe" },
      { name: "Checkout session for one-time analytics reports", status: "required", needs: "Stripe" },
      { name: "Customer portal to manage integration plans", status: "required", needs: "Stripe" },
      { name: "Alert team for critical audit failures", status: "required", needs: "Slack" },
      { name: "Track repos, PRs & issues on the dashboard", status: "required", needs: "GitHub" },
      { name: "Aggregate KPIs & run complex dataset queries", status: "required", needs: "BigQuery" },
    ],
  },
];
