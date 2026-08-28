# Security Policy

## Reporting a vulnerability

Please do not publish credentials, API keys, OAuth secrets, payment credentials, database URLs, or exploitable details in a public issue.

Report security issues privately to the repository owner through GitHub's private vulnerability reporting when enabled.

## Secret handling

- Never commit `.env`, `.env.local`, API keys, OAuth client secrets, payment credentials, or database passwords.
- Keep server-side secrets out of `NEXT_PUBLIC_*` variables.
- Rotate any credential that is accidentally exposed.
- Verify webhook signatures for messaging and payment integrations.
- Enforce server-side authorization for every admin operation.

## Production security baseline

- HTTPS only
- Secure, HttpOnly, SameSite cookies where applicable
- Rate limiting for login, AI, messaging and payment endpoints
- Input validation on every external request
- Audit logs for privileged actions
- Idempotency for payment/webhook operations
- Least-privilege CI permissions
- Dependency and secret scanning enabled in GitHub
