# Security

## Mandatory principles

- Client-side authorization is never sufficient.
- Teacher access derives from active assignments.
- Every school-owned entity is scoped by `schoolId`; cross-school access is impossible by design and test.
- Sensitive mutations are authorized on the server.
- Grade, homework, contact, and progression changes are auditable.
- Parent/administration contact history receives heightened protection.
- Secrets, credentials, private URLs, and real sensitive examples do not belong in documentation or committed files.
- Supabase service-role credentials never reach the browser.
- RLS policies are explicit, reviewed, and tested.
- A publishable Supabase key identifies a public application component; it is not user authentication or data authorization.
- Supabase server clients are request-scoped and never shared globally across requests.

## Threat-focused controls

- Treat identifiers and role/school fields from the client as untrusted.
- Validate and normalize all inputs at server boundaries; constrain values again in PostgreSQL.
- Prevent insecure direct-object references with tenant and assignment predicates on every access path.
- Limit privileged database clients to narrow server-only modules and never use them to bypass ordinary authorization casually.
- Use safe output handling and framework protections against injection and cross-site scripting.
- Avoid sensitive contact notes in URLs, logs, analytics, or user-visible error details.
- Apply least privilege to database roles, deployment credentials, and operational access.
- Define rate limits for authentication and abuse-prone mutations during implementation.
- Keep real public connection values in ignored `.env.local` files, never log environment values, and never place secret/service-role credentials in `NEXT_PUBLIC_*` variables or browser bundles.
- Future server code must still authenticate and authorize each operation even when it uses the centralized Supabase client.

## Audit requirements

Audits identify school, actor, time, action, entity, and a safe representation of the change. They must support authorized investigation without leaking data across schools. Audit and application writes should be atomic where feasible. Define retention, access, redaction, correction, and export policies before production.

Audit logs must not become a secret/PII dumping ground. Contact notes need careful before/after handling.

## Verification before pilot

- Automated RLS matrix for roles, assignments, inactive access, and cross-school attacks
- Server authorization tests independent of UI behavior
- Secret scanning and dependency/security review
- Browser checks that privileged credentials are absent
- Backup/restore and incident-response readiness
- Review of contact-history exposure, audit access, export authorization, and uploaded Excel handling
- Production configuration review for cookies, headers, origins, logging, and environment separation
- GDPR/privacy review before real student data is stored; early development and seeds use fictional identities only, and logs exclude grades and contact notes

## Open security decisions

Audit retention/immutability, contact-note retention and visibility, session revocation timing, export authorization/watermarking, uploaded-file retention, and backup objectives remain unresolved.
