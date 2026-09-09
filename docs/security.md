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
- Every application table enables RLS at creation and receives no broad policy or public-role grant by default.
- Protected rendering and authentication-page redirects call Supabase `getUser()` on the server; unverified `getSession()` data is never an authorization source.
- Authentication failures are mapped to generic localized codes. Credentials, tokens, account existence, and raw provider errors are neither logged nor returned.
- Return paths are restricted to the active locale's internal `/app` subtree; absolute, protocol-relative, cross-locale, backslash, and newline inputs fall back safely.
- Locale switching accepts only the typed `fr`/`tr` contract, replaces only the leading locale segment, and discards all query parameters. It never forwards Auth tokens, email/password values, arbitrary `next` destinations, or provider errors; `/auth/confirm` remains outside the localized route tree.

## Threat-focused controls

- Calendar cross-row checks serialize through a lock on the affected parent school-year row; a term move locks both parents in stable UUID order. This prevents concurrent direct writes from passing stale containment or semester-chronology checks while keeping the lock scope to the affected aggregate.
- Calendar trigger functions are schema-qualified, `SECURITY DEFINER`, empty-search-path functions with direct execution revoked from application roles. RLS and column grants still decide whether the underlying write may occur.

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
- Keep public Auth signup disabled. The application exposes no registration path, and TASK 08B reconfirmed that the development project's email/password provider remains enabled while public signup remains disabled.
- Local RLS authorization trusts only `auth.uid()` joined to an active `user_profiles` row. It never trusts caller-supplied school/role values or editable Auth metadata.
- Security-definer authorization helpers exist only to prevent recursive profile-policy evaluation. Their objects are schema-qualified, their `search_path` is empty, and only `authenticated` may execute them.
- PostgreSQL grants and RLS are independent gates: grants are operation-level and narrowly column-scoped for mutations; RLS applies tenant/admin predicates and `WITH CHECK` to writable rows.

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
- Student identity is data-minimized to names, optional school code, and active state. No student/parent login, contact, demographic, medical, national-identity, address, photo, or family data is part of the foundation; historical enrollments are retained and never hard-deleted through application roles.
- Clean local migration reset, schema lint, zero-policy/grant verification, and generated-type review before any separately authorized remote migration
- Remote migration dry-run, target-identity verification, zero-row check, and deny-by-default schema verification completed for the initial development foundation; each future remote change repeats this gate
- The authorization migration passed the same remote gate, and Task 06C completed controlled first-admin provisioning. Public signup is disabled; real authenticated, anonymous, same-school, cross-school, helper, mutation-denial, temporary calendar-write, cleanup, login, logout and protected-route behavior passed without weakening RLS.
- Task 07 resolves application context only on the server with `getUser()` plus existing profile/school RLS. It fails closed on missing, inactive, unsupported or inaccessible context, returns no raw provider error, renders no email/UUID, introduces no privileged client, and independently rejects role-inappropriate placeholder routes. Navigation hiding is not treated as authorization.
- Task 08B applied only the reviewed calendar migration to the confirmed development target. Post-application catalog inspection confirmed the strict date constraint, two hardened trigger functions, two enabled triggers, unchanged RLS/policies/grants and unchanged application/Auth counts; no remote fixtures were created.
- Task 08C accepts only strict allow-listed calendar fields, validates bound UUID identifiers and ISO dates, derives tenant scope server-side, and returns catalog-backed safe error codes rather than provider/database text. It introduces no service-role use and relies on the reviewed database constraints as the final concurrency-safe integrity boundary.
- Task 09A keeps direct profile INSERT/UPDATE/DELETE unavailable and exposes only two hardened authenticated RPCs. They verify `auth.uid()`, require an active ADMIN, derive school server-side, fix the provisioned role to TEACHER, constrain update columns, use stable safe failures, and rely on the profile primary key for duplicate concurrency safety.
- A future invitation secret belongs only in a server-only privileged Auth module and never in `NEXT_PUBLIC_`, client imports, ordinary academic queries, logs, or documentation. Invitation/profile partial failure requires explicit reconciliation; deleting an existing Auth user is forbidden compensation.
- Task 09B applied only the reviewed provisioning migration after positive target, count, Auth-setting, schema, history, and dry-run gates. Remote verification found no RLS/policy/grant weakening, overload, profile data mutation, invitation, Auth change, teacher creation, or new application secret.
- Task 09C isolates `SUPABASE_SECRET_KEY` from client code, validates `APP_URL` as an origin, disables privileged-client session persistence, constrains invitation redirects, maps Auth failures to safe codes, and performs bounded exact-ID compensation. The implementation was validated without a real invitation or remote mutation.
- Task 09D-PRE pushed only the reviewed Suivora repository to its dedicated Vercel project. Production variables are project-scoped, the secret is marked sensitive, and the stable HTTPS deployment exposes no secret value/name in inspected HTML, JavaScript, source-map references, or route responses. The development Auth Site URL and exact production/localhost redirect allow-list were configured after explicit approval; public signup remained disabled, email authentication remained enabled, and no invitation was sent.
- The ClassCourse foundation uses composite foreign keys for tenant/year integrity, case-insensitive unique indexes for concurrent writes, immediate RLS, ADMIN-only policies, column-limited authenticated grants, and no DELETE surface. Teacher reads remain denied until assignments exist.
- Task 10C performs classroom-structure reads through the request-scoped client and maps provider failures to stable localized codes. Its actions independently authorize ADMIN, scope every query to the resolved school, derive relationship tenancy from protected parents, reject extra fields, and never import the privileged Auth client.

## Open security decisions

Audit retention/immutability, contact-note retention and visibility, session revocation timing, export authorization/watermarking, uploaded-file retention, and backup objectives remain unresolved.
