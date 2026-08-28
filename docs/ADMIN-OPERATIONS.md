# Admin Operations Standard

## Roles
- Owner: full organization control and billing ownership
- Admin: operational administration within assigned organization
- Manager: users, campaigns and approved workflows
- Member: normal product operations
- Viewer: read-only access

## Security rules
1. Every privileged API route must enforce server-side authorization.
2. Never expose provider secrets, OAuth client secrets, database URLs or payment secrets to the browser.
3. Store secrets in Netlify/AppDeploy secret storage or an equivalent encrypted secret manager.
4. Log privileged changes without storing passwords, access tokens or full payment credentials.
5. Require explicit confirmation/approval for destructive actions and high-volume messaging.
6. Verify OAuth state/PKCE and webhook signatures.
7. Make billing/payment callbacks idempotent.

## Provider controls
Admins may configure enabled providers through a protected settings workflow. The UI should store references/metadata while secret values remain server-side. Provider-specific credentials must be validated before activation.

## Subscription controls
Plans should support name, description, price, currency, billing interval, usage quotas, enabled features, trial period and active/inactive status. Existing subscribers should retain a stable plan/version reference so changing a future plan does not silently alter historical invoices.

## User lifecycle
Use soft-disable/suspension for normal administrative actions. Permanent deletion should require explicit confirmation and follow the product's retention/privacy policy.

## Payment controls
Payment methods should use a provider abstraction so bKash, Nagad and Rocket can be added without coupling business logic to one gateway. Never store PINs, OTPs or full sensitive payment credentials. Verify provider callbacks and use idempotency keys.
