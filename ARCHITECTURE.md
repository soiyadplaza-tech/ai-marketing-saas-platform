# Foysal IT — Production Architecture

## Core layers

1. **Web/UI** — Next.js App Router and React.
2. **Server/API** — server-side route handlers and business logic.
3. **Data** — PostgreSQL with Drizzle ORM and explicit migrations.
4. **AI** — OpenAI server-side integration; keys never exposed to browsers.
5. **Messaging** — Sent integration for approved SMS/WhatsApp/RCS use cases.
6. **Identity** — email/password plus OAuth providers such as Google and Meta when configured.
7. **Billing** — subscription catalog, entitlements, payment intents, webhook verification and admin controls.
8. **Operations** — Netlify/AppDeploy deployment, GitHub CI, logs, health checks and backups.

## SaaS control model

- Users own their profile and connected integrations.
- Admins manage plans, feature flags, quotas, integrations and user status.
- Sensitive configuration is stored in deployment secrets, never in source control.
- Every privileged mutation should be authorized server-side and recorded in an audit log.

## AI-agent layer

Future agent features should use a controlled tool boundary: explicit tools, input/output validation, permissions, rate limits, tracing and human approval for high-impact actions such as payments, account deletion, credential changes or bulk messaging.

## Performance principles

- Keep heavy work out of request/response paths.
- Cache safe read-heavy data.
- Use background jobs for long-running AI, analytics and messaging tasks.
- Paginate large admin/user datasets.
- Reuse database connections and add indexes for real query patterns.
- Avoid leaking secrets into client bundles or logs.
