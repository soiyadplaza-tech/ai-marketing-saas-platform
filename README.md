# Foysal IT — AI Marketing SaaS

A production-oriented, multi-user AI marketing platform for content, SEO, analytics, social workflows, messaging and subscription-based SaaS operations.

## Product direction

- AI-assisted marketing workspace
- Multi-user accounts with role-based administration
- Google/Meta OAuth-ready authentication architecture
- Connected social accounts and provider integrations
- Subscription plans, entitlements and usage controls
- Admin-managed feature flags and integration configuration
- OpenAI-powered assistants and future agent workflows
- Sent-powered messaging where the account/channel is approved
- PostgreSQL + Drizzle data layer
- Netlify production deployment

## Engineering standard

The repository is organized for a real software product rather than a demo. CI runs TypeScript, lint and production build checks. Production secrets belong in Netlify/AppDeploy/GitHub environment stores, never in source control.

See:
- [ARCHITECTURE.md](ARCHITECTURE.md) — system design and scalability principles
- [SECURITY.md](SECURITY.md) — security policy and secret handling
- [CONTRIBUTING.md](CONTRIBUTING.md) — development and PR standards
- [.env.example](.env.example) — environment variable contract

## Local development

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run typecheck
npm run lint
npm run build
```

## Production deployment

Netlify supports modern Next.js App Router, SSR, route handlers, caching and image optimization through its OpenNext adapter. The repository uses `npm run build` and `.next` as the production settings.

Connect this repository to Netlify and configure only the required environment variables from `.env.example`. A production deploy should be triggered from the production branch and verified with a live smoke test.

## AI agents

Agent features should use controlled server-side tools, explicit permissions, validation, tracing and approval for high-impact operations. OpenAI's Agents SDK supports tool-using, long-running agent workflows with controlled execution and tracing.

## Repository security

Enable Dependabot, secret scanning/push protection and code scanning where available. Keep GitHub Actions permissions minimal and pin third-party actions to reviewed commit SHAs for higher supply-chain security.

## Important production rule

A feature is not considered production-ready until its required credentials, database migrations, provider approvals, automated checks and live smoke tests pass. This prevents configuration-only changes from being mistaken for a working integration.
