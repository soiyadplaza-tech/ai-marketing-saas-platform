# Foysal IT — AI Marketing SaaS Platform

Production-oriented AI marketing workspace for automation, analytics, content, SEO, social workflows, messaging, and subscription-based SaaS operations.

## Product goals
- Fast, secure, maintainable SaaS architecture
- AI-assisted marketing workflows
- Multi-user authentication and role-based administration
- Subscription and usage controls
- Extensible integrations for OpenAI, messaging, social platforms, and payments

## Recommended production stack
- Next.js + React
- PostgreSQL + Drizzle ORM
- Netlify for web delivery/serverless workloads
- GitHub for source control and CI
- OpenAI for AI capabilities
- Sent for approved messaging channels

## Engineering standards
- Keep secrets out of Git. Use deployment environment variables.
- Validate all external input server-side.
- Enforce authorization on every privileged API route.
- Use least-privilege roles and auditable admin actions.
- Add rate limiting to authentication, AI, messaging, and payment endpoints.
- Use database migrations and backups for production data.
- Pin dependency versions and keep a lockfile committed.
- Run lint, typecheck, tests, and production build in CI before deployment.

## Environment variables
Create a local `.env.local` from `.env.example`. Never commit real credentials.

Typical production integrations may require:
- `DATABASE_URL`
- `OPENAI_API_KEY`
- OAuth client IDs/secrets for enabled providers
- Sent API credentials for enabled messaging channels
- Payment provider credentials for enabled gateways
- Application URL / auth configuration

Only configure variables required by features actually enabled in the application.

## Local development
```bash
npm ci
npm run dev
```

## Production verification
```bash
npm ci
npm run typecheck
npm run lint
npm run build
```

If the repository defines additional test scripts, run them in CI as well.

## Deployment
Use the repository's Netlify configuration and production environment variables. Do not place API keys, OAuth secrets, payment credentials, or database passwords in source control.

## Security baseline
- Secure cookies and HTTPS in production
- CSRF protection where applicable
- Strong password hashing if password authentication is enabled
- OAuth state/PKCE validation where applicable
- Server-side authorization checks
- Webhook signature verification
- Payment idempotency
- Structured audit logs for admin actions
- Safe error messages that do not leak secrets or internal stack traces

## Status
This repository is intended for production preparation. A deployment is considered production-ready only after CI/build checks and live smoke tests pass with the required environment variables configured.
