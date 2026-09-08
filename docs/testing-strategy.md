# Testing strategy

## Principles

Tests follow risk and ownership boundaries. Deterministic business rules receive fast unit tests; database permissions receive integration tests against realistic Supabase/PostgreSQL behavior; critical shared-teacher workflows receive browser tests. Tests use synthetic data only.

## Layers

- **Unit (Vitest, proposed):** grading, evolution, bands, homework thresholds, delay/summary calculations, validators, and mapping helpers.
- **Component (React Testing Library, proposed):** translated states, forms, errors, keyboard behavior, semantics, and accessible names.
- **Database/integration:** constraints, transactions, audit creation, tenant isolation, RLS role/assignment matrix, and concurrent alert idempotency.
- **End-to-end (Playwright, proposed):** administrator setup; Teacher A creates shared data; Teacher B observes/modifies it; unauthorized/cross-school attempts fail.
- **Import/export contract:** fixture-driven workbook validation and round-trip expectations after formats are decided.

## High-priority scenarios

- Complete C1-C8 calculations, oral suggestion/final separation, threshold boundaries, and later missing-grade policy
- `QUICK_TOTAL` never presents detailed outcome analysis
- Detailed scoring respects the eventual multi-outcome allocation rule
- Homework alerts recur every three new unsubmitted items after the last contact baseline without duplicates
- Contact history and audit records survive later edits/deactivation
- Inactive or unassigned teachers lose access; same identifiers in another school reveal nothing
- Localization resources cover user-facing copy and formatting
- Responsive/accessibility checks for core workflows

## Localization scenarios

- `/fr` and `/tr` render from their complete catalogs.
- Exactly `fr` and `tr` are accepted, an unknown locale is rejected, and the default remains `fr`.
- The supported-locale tuple remains immutable and is the source of the `Locale` type.
- The application-owned root redirect target is `/fr`.
- Unsupported locale segments reach a 404 without falling back to French.
- Metadata and visible placeholder copy use catalog keys rather than duplicated component strings.
- Catalog key structures and ICU placeholders are identical and values are non-empty.
- The global switcher preserves nested pathnames, drops sensitive/arbitrary query data, exposes a label/focusable links, and marks the current locale without relying only on color.
- Authentication redirects, role authorization, semester labels, and date presentation work identically in both locales while stored values remain unchanged.

Tests target application-owned decisions instead of mocking fragile Next.js redirect or not-found internals. Production builds validate the framework integration.

## Supabase configuration scenarios

- Valid public project URL and publishable key produce a typed immutable configuration.
- Missing or malformed values fail with developer-facing field errors that never include supplied credentials.
- Parsing does not mutate caller-owned input.
- Environment reads remain centralized and lazy, so localized pages and builds that do not request a Supabase client need no `.env.local` file.
- Tests make no live request and do not exercise third-party SDK internals.
- Later database/auth integration tests must use fictional data and verify server authorization and RLS separately from client creation.

## Local database foundation scenarios

- A clean local reset applies every tracked migration and the empty seed without error.
- Catalog inspection confirms the four expected application tables, `ADMIN`/`TEACHER` enum values, RLS on every table, zero policies, and zero `anon`/`authenticated` table grants.
- Schema lint reports no warnings, generated TypeScript types reflect the running local schema, and a second clean reset proves replayability.
- Date order, semester range, uniqueness, same-school term/year linkage, and deliberate `RESTRICT` deletion behavior are database constraints rather than UI assumptions.
- `calendar_integrity.test.sql` adds 53 transactional pgTAP assertions for strict ranges, parent containment, fixed numeric semester storage, uniqueness, chronology/non-overlap in either insertion order, safe term/year updates, same-school linkage, trigger hardening and the existing ADMIN/TEACHER/anonymous RLS boundary. Together with the 85 authorization assertions, the local database suite contains 138 assertions and rolls fictional fixtures back.
- TASK 08A is accepted only after two independent clean local resets, both followed by the full pgTAP suite and schema lint. Parent-row locking is documented and structurally reviewed; multi-session race testing can be added to a later integration harness because pgTAP files execute one session at a time.
- TASK 08B used a migration-only dry-run, applied the reviewed migration exactly once, and verified the remote catalog without fixtures. The final dry-run is up to date; strict constraint, functions, triggers, eight policies, four RLS-enabled tables, least-privilege grants and zero year/term rows match the locally tested contract.
- TASK 08C adds pure calendar-rule tests, Server Action authorization/scope/error tests, request-scoped query tests, route-state tests, and accessible component rendering tests. Real ADMIN browser review covers the empty remote-backed page, navigation, form labels, and a 390 px no-overflow layout without submitting data.
- TASK 08D exercised the real authenticated ADMIN UI and Server Actions against the confirmed development project. It created exactly one MEB 2026–2027 year and its two fixed semesters, verified each intermediate count, refreshed to confirm persistence, re-read the exact ISO values through edit forms, and reconfirmed 390 px no-overflow behavior. Final remote table statistics are one school, one active ADMIN profile, one school year, and two terms; RLS, eight policies, protected calendar functions/triggers, grants, Auth settings, schema, and migration history remained intact.
- TASK 09A adds 63 transactional teacher-provisioning assertions. They cover the column constraint, function signatures/ownership/volatility/search paths/ACLs, unchanged policies and direct grants, ADMIN provisioning, trusted school and fixed role derivation, normalization, invalid/missing/duplicate/self targets, caller states, same-school rename/deactivate/reactivate, cross-school and ADMIN-target denial, and failure atomicity. Together with the existing 138 assertions, all 201 pass after two independent clean resets. Local generated types are byte-identical across repeated generation and both resets.
- TASK 09B used a migration-only dry-run, applied only `20260908113000_teacher_provisioning_foundation.sql` once, and verified the remote schema without invoking provisioning RPCs. The final dry-run is up to date; remote-generated and tracked local public types are semantically equivalent, with differences limited to PostgREST metadata and generator formatting. All 201 local database assertions and 85 application tests continue to pass.
- Future authorization work adds explicit RLS matrix tests before any policy is considered functional.

## Authentication foundation scenarios

- Zod accepts normalized valid credentials and rejects malformed email, missing password, and unsupported locale input.
- Provider failures collapse to generic localized messages and never expose raw Supabase errors or account existence.
- Signed-out protected access and authenticated sign-in redirects retain `fr` or `tr`.
- Sign-out uses a server mutation with local-session scope and returns to the selected locale's sign-in route.
- Return paths accept only the active locale's `/app` subtree and reject external, protocol-relative, cross-locale, malformed, and adjacent-prefix attempts.
- Component tests assert French labels, password/email semantics, autocomplete values, and an accessible submit control.

## Authorization foundation scenarios

`supabase/tests/authorization_rls.test.sql` uses transactional, fictional local fixtures and rolls everything back. Its 85 pgTAP assertions cover anonymous, missing-profile, inactive-profile, School A administrator, School A teacher, and School B identities. It executes same-school reads, admin writes, teacher denials, cross-school filtering, forged-school `WITH CHECK` failures, role/school escalation, helper execution ACLs, empty helper `search_path`, non-recursive profile access, deferred deletion, unchanged-row checks after denied operations, and existing date/semester/unique/composite-FK constraints.

Task 06A validation runs the matrix after two independent clean resets. Generated types are produced after each reset and compared byte-for-byte. Fixtures exist only inside a rolled-back test transaction and never enter the seed or remote database.

Task 06B remotely verified the structural contract without fabricating users. Task 06C then used the sole controlled administrator session to verify own school/profile reads, helper results, foreign-school hiding, school/profile mutation denial, profile-creation denial, anonymous denial, same-school year/term insert-read-update, forged-school rejection, and privileged cleanup. Login, logout and signed-out protected-route redirects also passed. Final remote counts are one Auth user, one school, one active ADMIN profile, zero school years and zero terms.

Task 07 tests the application-context boundary with typed gateways: active ADMIN success, unauthenticated short-circuit/redirect, missing and inactive profiles, missing school, query/throw failures and unsupported roles. UI tests cover the ADMIN and TEACHER navigation contracts, absence of ADMIN links for TEACHER, manual ADMIN-route rejection, active-link `aria-current`, localized safe-state sign-out, mobile menu naming, and non-rendering of email/UUID values. These tests use fixtures only and require no remote account or mutation.

## Future observation scenarios

- Multiple same-day observations for one student persist as distinct audited records; an empty row persists nothing.
- Bulk entry creates records only for roster students with entered values and remains usable for at least 35–40 students.
- Unassigned/cross-school teachers cannot read, create, classify, override, summarize or export observations.
- Deterministic classification and teacher override remain separate; recalculation never overwrites override history.
- Criterion evolution, alert creation/resolution and rule-based summaries are deterministic, version-aware and fixture-tested.
- Student archival preserves authorized history. Period/criterion filters, active/resolved alerts, class KPIs and PDF/Excel reports cannot leak other schools or unassigned ClassCourses.

## Mandatory-study scenarios

- Relevant average 54.99 creates `MANDATORY_STUDY_REQUIRED`.
- Relevant average exactly 55 creates no requirement.
- Relevant average above 55 creates no requirement.
- A completed requirement remains in history with its trigger context.
- An unauthorized teacher cannot view or modify the requirement.
- Re-evaluating the same unresolved condition does not create unlimited duplicates.
- Status/session mutations produce appropriate audit evidence.

These cases become executable only after the relevant-average, precision, resolution, and authorization decisions are confirmed.

## Academic-event and reminder scenarios

- Default in-app reminders project at 7, 3, and 1 day before the event.
- A past event leaves the primary upcoming list but remains in history.
- A personal reminder is visible only to its owner.
- A shared event is visible only to its intended school-scoped audience.
- Reprojection is idempotent and does not create duplicate reminders.

## Action-center scenarios

- Incomplete quiz grading creates a linked automatic action; completing every required grade removes it.
- An active mandatory-study requirement creates a linked action; resolving its underlying condition removes the active action according to the eventual resolution rule.
- Delayed progression and unresolved homework alerts appear only while their source conditions remain active.
- A completed personal task leaves the active list while its record remains available as history.
- A teacher sees no actions from an unassigned class or another teacher's private reminder/task.
- Priority ordering across `URGENT`, `TODAY`, `THIS_WEEK`, and `UPCOMING`, and ordering within a group, is deterministic after rules are defined.

## TASK 09C teacher-management tests

Task 09C uses mocked Auth Admin and request-scoped Supabase gateways: no test sends email or mutates the remote project. Coverage includes lazy secret/origin validation, privileged-client options/import isolation, same-school teacher queries, action reauthorization and strict fields, invitation compensation, confirmation redirect safety, password validation/update, French empty/error states, hidden identifiers, accessible controls, and explicit deactivation confirmation. Database reset and the existing pgTAP suite remain unchanged because no migration or seed is added.

Task 09D-PRE repeated the full 136-test application suite, coverage, production build, zero-vulnerability dependency audit, clean local database reset, all 201 pgTAP assertions, database lint, and whitespace checks before push. Production smoke tests cover the French root redirect/page, sign-in, unauthenticated protected and activation redirects, safe invalid-confirm redirect, unsupported-locale 404, HTTPS/assets, 390 px no-overflow layout, and browser-output secret absence.

## Quality gates

Repository bootstrap should define commands for formatting/checks, linting, strict type checking, unit/component tests, build, and E2E. CI should run the proportional subset on changes and the full security/shared-class scenario suite before pilot release. Exact commands are intentionally not invented before `package.json` exists.

Do not overuse snapshots for domain behavior; assert meaningful outcomes and denial conditions. Every production bug in core logic or authorization should gain a regression test.

## ClassCourse foundation tests

The dedicated pgTAP suite checks schema shape, keys, composite tenancy relationships, triggers, RLS/grants, name/code normalization and scoped uniqueness, weekly-period boundaries, restricted parent deletion, the complete initial actor matrix, and rollback-safe failed mutations. Generated local types must be byte-identical across two generations, and two clean reset/test/lint cycles are required before a reviewed remote application.
