# Documentation changelog

Significant product, domain, architecture, security, and delivery-document changes belong here. This is not a substitute for decision records or version control.

## 2026-09-10 — Task 14B/14C remote homework foundation and bilingual UI

- Applied the reviewed homework migration exactly once to the linked Suivora development project and verified synchronized migration history, generated types, schema objects, RLS policies, grants, and unchanged pre-existing record counts.
- Added localized ADMIN/assigned-TEACHER homework routes for authorized class-course selection, assignment creation and correction, due-date roster tracking, explicit bulk status recording, safe empty states, and the derived three-item attention signal.
- Added strict form-contract and presentation tests covering same-day dates, invalid ranges, injection resistance, all explicit states, unrecorded behavior, localized routing, accessible controls, and safe alert rendering.
- Kept production smoke checks read-only: no real homework assignment, student status, alert, contact, or unrelated data was created.

## 2026-09-10 — Task 14 Phase 0 homework contract review

- Reconciled the requested homework foundation against the existing homework, product, domain, authorization, schema, security, localization and testing contracts before writing SQL.
- Identified a blocking conflict between the documented cumulative resolved-contact baseline alert and the requested consecutive non-submission streak/reset model.
- Recorded the still-missing ordering, due-state participation, enrollment-date eligibility, historical-correction reconciliation, pre-contact-module resolution and same-day date-boundary decisions in the canonical open-decision list.
- Created no migration, application code, remote change, homework record, commit or deployment while the integrity contract remains unresolved.

## 2026-09-10 — Task 14A local homework foundation

- Confirmed the derived consecutive-streak contract, conservative unrecorded-state break, due-date enrollment boundary, deterministic ordering, correction recalculation and same-day assignment rule.
- Added a forward-only local migration for shared homework assignments, explicit per-student states, audited protected mutation RPCs and an authorization-filtered derived attention projection.
- Kept “not recorded” as row absence, retained submission dates without inventing unresolved working-day delay totals, and added no persisted alert/contact model.
- Added transactional pgTAP coverage for schema, integrity, date/enrollment validation, correction, threshold/reset behavior, least privilege, ADMIN/assigned-TEACHER access and unassigned/cross-school denial.
- Two independent clean resets, full 619-assertion database coverage, schema lint and byte-identical generated types pass. No remote database was accessed or changed.

## 2026-09-10 — Controlled quiz and grade runtime verification

- Created one synthetic demo student with one active enrollment through the production ADMIN workflow; no direct SQL mutation was used.
- Verified that the assigned pilot TEACHER could see only the shared pilot ClassCourse roster, then created four synthetic Semester 1 quizzes and entered four synthetic scores through the protected application and RPC workflows.
- Confirmed that incomplete quiz data produced no premature suggestion, while the completed score set produced an exact average and dynamic oral suggestion of 75. A controlled score update recalculated to 76.25 and persisted after refresh before the final score was restored and the suggestion returned to 75.
- Verified matching FR/TR records and formatting, detail-route preservation, ADMIN-route denial for the TEACHER, no page-level horizontal overflow at 1280 px or 390 px, and a clean browser console.
- Automated fixtures cover zero-versus-missing scores, decimal/range validation, duplicate and invalid semester slots, unknown fields, inactive access, unassigned identifiers, cross-class/cross-school isolation, and anonymous denial without mutating real profiles or assignments.
- The separate historical TEACHER profile remained untouched and unassigned. No unrelated project was accessed or modified.

## 2026-09-10 — Task 13B/13C quiz release

- Applied only the reviewed quiz/score migration to the confirmed Suivora development project after explicit approval; migration histories are synchronized and both new tables remain empty.
- Verified the remote enum, tables, constraints, indexes, RLS policies, hardened functions and minimal grants. Existing anonymized structural row counts remained unchanged.
- Added shared ADMIN/TEACHER FR/TR quiz routes, metadata forms, enrollment-scoped score entry, semester summaries, dynamic oral suggestions, localized safe feedback, and an honest no-student state.
- Added the assessment module to both role-aware navigation menus and kept every mutation behind request-scoped authentication plus protected database RPCs.

## 2026-09-10 — Task 13A local quiz and grade foundation

- Confirmed the missing-score, two-decimal precision, unrounded-comparison, and dynamic oral-suggestion contract.
- Added the local C1–C8 quiz and audited score-entry migration with tenant-safe relationships, term/date/enrollment integrity, assignment-scoped reads, and protected quiz/score RPCs.
- Added deterministic pure grading calculations and focused unit/pgTAP coverage. Remote application was separately approval-gated and completed in Task 13B.

## 2026-09-10 — Controlled pilot teacher assignment and shared-class verification

- Verified through the production ADMIN workflow that the target profile was an active same-school TEACHER and that the active ClassCourse had exactly 20 weekly periods with no existing assignment.
- Created exactly one active 20-period assignment through the protected ADMIN Server Action and RPC; no direct SQL mutation was used and the real profile/assignment remained active throughout verification.
- Verified with the real TEACHER session that only the assigned class/course appears, the 20-period load is displayed, and the assigned roster opens with the localized empty state because no student exists.
- Confirmed that ADMIN routes return the localized not-found boundary for the TEACHER, while automated fixtures continue to cover ADMIN mutation denial, inactive access, unassigned ClassCourses, and cross-school isolation.
- Confirmed FR/TR route preservation, localized roster content, no horizontal overflow at 1280 px or 390 px, no browser console errors, and no sensitive identifier, credential, token, email, privileged secret, or raw provider error in the verified UI.
- Final development counts are anonymized: 3 Auth identities, 2 active TEACHER profiles, and 1 active assignment. The additional historical TEACHER profile was not modified.
- Lint, strict type-check, 227 application tests, coverage, production build, dependency audit with zero findings, clean local reset, 528 pgTAP assertions, local/linked database lint, and diff validation pass.

## 2026-09-10 — Temporary single-school teacher self-signup

- Added localized FR/TR signup screens and a signup link from both login screens.
- Added a development-only server flow that creates a confirmed, marked Auth identity, signs it in, and provisions it as an active TEACHER in the sole existing school.
- Added `claim_test_teacher_profile(text)`, which accepts no tenant, role, or user identifier and rejects unmarked identities or databases with zero/multiple schools.
- Added exact-user compensation for failed sign-in/profile provisioning and kept privileged credentials limited to Auth administration.
- Clean local reset, schema lint, all 528 database tests, strict type-check, lint, all 227 application tests, and the production build pass.
- After explicit approval, applied only `20260910190000_test_teacher_self_signup.sql` to Suivora development. Local and remote migration histories synchronize and the final remote dry-run is empty.
- This temporary self-signup must be removed before multi-school onboarding or pilot access.

## 2026-09-10 — Temporary ADMIN test-teacher creation

- Replaced the unusable email-invite form in the development ADMIN teacher page with a clearly labeled bilingual test-account form accepting display name, email, and a confirmed temporary password.
- Added server-side exact-field/password validation, active-ADMIN reauthorization, confirmed Auth creation through the isolated privileged client, existing same-school TEACHER provisioning RPC use, duplicate protection, and exact-new-user compensation on profile failure.
- Kept passwords transient and out of application storage, responses, logs, documentation, and database RPC arguments. Added focused provisioning, action, accessibility, and localization coverage.
- This development shortcut is explicitly temporary and must be removed in favor of custom SMTP plus the reviewed token-hash invitation/activation flow before pilot use.
- Changed `/`, `/fr`, and `/tr` public entry behavior to lead directly to the appropriate localized sign-in screen instead of the obsolete foundation placeholder.

## 2026-09-10 — Shared teacher assignment foundation and bilingual interfaces

- Added the local `teacher_assignments` migration with same-school composite relationships, unique teacher/ClassCourse membership, soft lifecycle, and weekly-period bounds.
- Serialized assignment and ClassCourse capacity changes on the parent row; active allocations cannot exceed the ClassCourse total, and incompatible period reductions/deactivation are rejected atomically.
- Added hardened assignment authorization and two ADMIN mutation RPCs. Active teachers receive SELECT-only access to their own assigned ClassCourses, related structure, and class rosters; all mutations and unrelated/cross-school data remain denied.
- Added 89 transactional assertions for 513 total. Two clean resets, schema lint, and two byte-identical generated-type runs pass.
- After explicit approval, applied only the reviewed migration once to Suivora development. Eight migration histories synchronize, the final dry-run is empty, and remote assignment, teacher, and student counts remain zero.
- Added bilingual ADMIN assignment controls to ClassCourse detail with capacity feedback, lifecycle confirmation, accessible pending/error states, and independently authorizing Server Actions.
- Added bilingual TEACHER “Mes classes” list/detail routes with assignment-scoped, read-only current rosters. Application tests cover exact-field parsing, localized routing, empty states, identifier non-rendering, and absence of mutation controls.
- No teacher invitation, Auth user, teacher profile, assignment, student, seed, production database, or Numeon change was created.

## 2026-09-10 — Atomic student workflows and bilingual ADMIN UI

- Added one forward-only migration with four hardened ADMIN RPCs for atomic create-with-enrollment, identity update, same-year class transfer, and current-enrollment closure.
- Derived school/year authority server-side, normalized minimal identity data, serialized lifecycle operations with deterministic student/enrollment/class/year locks, and preserved full rollback on dependent-write failures.
- Kept the 23-policy RLS matrix and narrow table grants unchanged; PUBLIC/anon cannot execute the functions and TEACHER/cross-school/inactive/profileless callers fail safely.
- Added 72 transactional pgTAP assertions (424 total), regenerated the four typed RPC contracts twice deterministically, and created no seed or real student data.
- After explicit approval, applied the single reviewed migration exactly once to Suivora development. Seven migration histories synchronize, the final dry-run is empty, the four function ACLs match the reviewed design, all 23 policies remain unchanged, and both remote tables remain empty.
- Added localized ADMIN student list/detail routes with search, class/status filters, initial enrollment creation, identity editing, full enrollment history, same-year transfer, and enrollment closure. Server Actions reauthorize independently and call only the transactional RPC boundary.
- Added strict workflow/action/component tests in both locale contexts, accessible confirmations and pending/error states, and responsive layouts without exposing internal identifiers or destructive controls.

## 2026-09-09 — Student and historical enrollment foundation

- Added one forward-only local migration for minimal school-owned student identities and immutable historical class enrollments, with no seed or real student data.
- Enforced trimmed bounded/control-free names and optional codes, case-insensitive school-scoped code uniqueness, composite tenant/year relationships, inclusive school-year-contained dates, and concurrency-safe prevention of overlapping enrollment ranges.
- Added ADMIN-only SELECT/INSERT/limited-UPDATE RLS and column grants; TEACHER, anonymous, cross-school, enrollment-identity updates, and all hard deletion remain denied.
- Added 82 dedicated transactional pgTAP assertions (352 total) and regenerated deterministic strict database types.
- After a clean preflight and explicit approval, applied only the reviewed migration once to Suivora development. Six migrations now synchronize, the final dry-run is empty, remote/local types are semantically equivalent, both new tables remain empty, and Numeon/production were untouched.

## 2026-09-09 — First classroom runtime verification

- Verified the Ready production deployment and synchronized development target before any write, then obtained explicit approval for the exact classroom values.
- Created exactly one course, one class, and one ClassCourse through the French production ADMIN forms and normal authenticated Server Actions; no direct SQL or privileged creation path was used.
- Confirmed localized success, refresh persistence, single-row rendering, active state, weekly-period display, eligible-course removal, absence of internal identifiers/destructive controls, and matching Turkish list/detail behavior.
- Final development counts are one class, one course, one ClassCourse, and zero TEACHER profiles. No invitation, Auth change, migration, seed, dependency, Numeon, or production Supabase change occurred.

## 2026-09-09 — Bilingual class and course management

- Replaced ADMIN class/course placeholders with FR/TR list, create, edit, class-detail, ClassCourse connection, and weekly-period editing experiences.
- Added strict reusable validation, request-scoped reads, independently authorizing Server Actions, server-derived tenancy/year fields, safe error mapping, accessible pending/error/success states, and responsive layouts.
- Kept UUIDs and raw errors out of visible output, omitted delete/deactivation controls, retained inactive history visibility, and left TEACHER access denied.
- Added mocked/fictional tests without remote writes, migrations, seed changes, Auth changes, or invitations.

## 2026-09-09 — ClassCourse database foundation

- Added one forward-only migration for school-year classes, school-owned courses, and the central ClassCourse aggregate without seed or business data.
- Enforced trimmed bounded names/codes, case-insensitive scoped uniqueness, composite school/year integrity, weekly lesson periods from 1–40, restricted parent deletion, and timestamp triggers.
- Enabled immediate RLS with active same-school ADMIN-only SELECT/INSERT/UPDATE policies, narrow grants, and no DELETE access; teacher access remains deferred to assignments.
- Added a dedicated pgTAP package covering schema, constraints, tenancy, lifecycle protection, authorization roles, and failed-write atomicity, and regenerated strict database types.
- Passed two independent clean resets with 270/270 pgTAP assertions, database lint, the 144-test application suite, coverage, strict typecheck, build, audit, and whitespace checks.
- Applied the single reviewed migration once to the verified Suivora development project; histories are synchronized, all new tables are empty, and remote catalog/RLS/grant checks passed.

## 2026-09-09 — Task 09C2 French/Turkish localization completed locally

- Activated exactly `fr` and `tr` while preserving French as the deterministic `/` default and keeping English unsupported.
- Added a complete Turkish catalog with structural/ICU parity, localized metadata, authentication states, ADMIN/TEACHER navigation, teacher management, activation, errors, semesters, and locale-aware dates.
- Added one global accessible `FR | TR` switcher that preserves safe nested paths, retains sessions, and discards every query parameter to prevent sensitive Auth data forwarding.
- Extended session refresh and authentication/sign-out/password redirects to both locales without duplicating authorization or database access.
- Added focused catalog, route, switcher, authentication, and date-format tests. No migration, remote data, invitation, Supabase/Vercel configuration, commit, or push was performed.

## 2026-09-09 — Task 09D-PRE dedicated deployment completed

- Reviewed and committed 95 Suivora files after full application/database validation and credential, identity, token, private-key, project-reference, generated-output, and Numeon separation scans.
- Pushed the authenticated application foundation only to `kivancbeser/Suivora` `main`; GitHub triggered the dedicated Vercel `suivora` project automatically.
- Added the four required Production environment-variable names to Vercel, stored the privileged key as sensitive, set the deployment-only application origin to `https://suivora.vercel.app`, and successfully redeployed the same reviewed commit.
- Verified HTTPS, French routes, safe redirects/404, assets, 390 px layout, and absence of the privileged secret from inspected browser output.
- After explicit approval, configured the Suivora development Auth Site URL for the stable Vercel alias and allowed only that deployment wildcard plus localhost development. Verified public signup stayed disabled and email authentication stayed enabled. No invitation was sent and SMTP was untouched.

## 2026-09-08 — Task 09C local teacher management completed

- Added the French ADMIN teacher list, invitation form, display-name and active-state management UI.
- Added lazy server-only secret/origin validation, an isolated Auth Admin client, safe invitation/profile compensation, invite confirmation, and TEACHER password activation.
- Added mocked security, validation, UI, route, and compensation tests plus invitation setup/reconciliation runbooks.
- Added no migration or seed and made no remote Auth, email, user, or application-data change.

## 2026-09-08 — Task 09B reviewed remote teacher provisioning foundation completed

- Positively matched the ignored public URL, CLI link, and single healthy Suivora development project; confirmed synchronized history through calendar integrity, expected counts, enabled email/password, disabled signup, and no pre-existing teacher column/functions.
- The dry-run contained only `20260908113000_teacher_provisioning_foundation.sql`, with empty seed and role lists. Applied it exactly once through migration history without invoking either RPC or creating Auth/application data.
- Remote schema verification confirmed nullable `display_name`, the teacher-required normalized 1–120 constraint, two postgres-owned `void` functions with the approved signatures/bodies and hardened security, intended authenticated execution, no anon/PUBLIC execution, and no unexpected overload.
- Preserved four RLS-enabled tables, exactly eight policies, no anonymous table access, no direct profile INSERT/UPDATE/DELETE grant, and no DELETE policy. Final counts remain one Auth user, one school, one active ADMIN, zero teachers, one school year, and two terms.
- Local/remote migration histories now match through four migrations and final dry-run is up to date. Remote/local public types are semantically equivalent; only PostgREST metadata and generator formatting differ, so the tracked file was not overwritten.
- All 85 application tests and 201 pgTAP assertions pass with clean build, lint, typecheck, coverage, database lint and audit. No invitation, teacher, secret, Auth setting, Numeon/production change, commit, or push was created.

## 2026-09-08 — Task 09A local teacher provisioning foundation completed

- Added forward-only local migration `20260908113000_teacher_provisioning_foundation.sql` with a nullable legacy-ADMIN/mandatory normalized-TEACHER display-name contract.
- Added postgres-owned, explicitly volatile, empty-search-path `SECURITY DEFINER` provisioning and update functions. They derive the active ADMIN's school, fix new profiles to active TEACHER, constrain updates to same-school teacher name/active state, and expose stable safe failures.
- Preserved all eight policies and zero direct profile INSERT/UPDATE/DELETE grants; `PUBLIC` and `anon` cannot execute the new functions, while `authenticated` receives only their intended execute access.
- Added 63 transactional pgTAP assertions. Two independent clean resets each passed all 201 database assertions and schema lint; generated local types were byte-identical across repeated generations and include the column and RPC signatures.
- Documented the invitation-only lifecycle, Auth-owned email/password boundary, future isolated privileged Auth client, partial-failure recovery questions, and assignment-gated future class access. No UI, secret, privileged client, remote migration/data/Auth change, real teacher, commit, or push was created.

## 2026-09-08 — Task 08D controlled remote school year verified

- Reconfirmed the single healthy Suivora development target, matching public URL/CLI link, synchronized three-migration history, enabled email/password provider, and disabled public signup before writing.
- Used only the authenticated ADMIN UI and Server Actions to create `2026–2027` (2026-09-14 to 2027-06-25), Semester 1 (2026-09-14 to 2027-01-22), and Semester 2 (2027-02-08 to 2027-06-25), following the supplied official MEB calendar values.
- Verified `0/2` → `1/2` → `2/2`, French date rendering, exact persisted ISO values, refresh persistence, ADMIN edit controls, no delete action, and a 390 px layout without horizontal overflow.
- Final safe counts are one Auth user, one school, one active ADMIN profile, one school year, and two terms. Four RLS-enabled tables, eight policies, no anonymous/DELETE grant or policy, protected calendar functions and both triggers remain intact; no term label column exists.
- No sensitive identifier was recorded. No migration, schema, Auth setting, code, dependency, unrelated business data, Numeon/production resource, commit, or push was changed.

## 2026-09-08 — Task 08C ADMIN calendar UI completed

- Added the localized ADMIN school-year and semester page with real request-scoped reads and create/edit Server Actions.
- Added strict parsing, safe errors, trusted tenant scoping, accessible feedback, responsive calendar cards, and fixed Semester 1/2 labels.
- Added domain, data, action, route, and component tests plus real-browser empty-state and 390 px verification. No migration, seed, dependency, remote mutation, commit, or push was performed.

## 2026-09-07 — Task 08B reviewed remote calendar integrity completed

- Positively matched `.env.local`, the CLI link and the authenticated account's single healthy Suivora project in the documented European development region; the target is not Numeon or production.
- Preflight confirmed exactly the two earlier remote migrations, only `20260907190000_calendar_integrity.sql` pending, the expected schema/helpers, four RLS-enabled tables, eight policies, least-privilege grants, disabled public signup, enabled email/password authentication, and expected safe data counts.
- The dry-run contained exactly the reviewed calendar migration with empty seed and role lists. Applied it exactly once through migration history without direct SQL, fixtures, data writes, Auth changes or reset.
- Remote catalog verification confirmed strict `terms_date_order`, the two postgres-owned `VOLATILE SECURITY DEFINER` empty-search-path functions, the two enabled table triggers, no term label column, unchanged policies/RLS/grants and no direct application-role function execution.
- Final counts remain one Auth user, one school, one active ADMIN profile, zero school years and zero terms. Local and remote histories now match through all three migrations, and final dry-run reports the database up to date.
- Remote-generated public types are semantically equivalent to the tracked local contract; only PostgREST metadata and generator formatting differ, so the tracked file was not overwritten. Numeon and production were untouched; no commit or push was performed.

## 2026-09-07 — Task 08A local calendar integrity completed

- Resolved semester naming as fixed localized presentation labels derived from `semester_number`; no editable translated term field was added.
- Added one forward migration with fail-fast data preflight, strict term date order, parent-year containment, Semester 1/2 chronology and non-overlap, and protection against school-year boundary updates that would invalidate terms.
- Serialized concurrent term and school-year writes through narrowly scoped parent-row locks; term moves lock both affected parents in stable UUID order. Trigger functions use empty search paths and expose no direct application-role execution.
- Added 53 transactional calendar pgTAP assertions. Two independent clean local resets each passed all 138 database assertions and schema lint; regenerated public types are unchanged.
- Preserved same-school foreign keys, RLS, grants, helpers and the empty seed. Added no UI, Server Action, fixture, remote mutation, commit or push. Remote review is TASK 08B.

## 2026-09-07 — Task 08 preflight blocked on calendar integrity

- Inspected the applied calendar migration and generated types before implementing the ADMIN module.
- Confirmed that the database does not enforce strict term date order, parent-year containment, semester non-overlap/chronology, or protection against school-year edits invalidating existing terms.
- Confirmed that `terms` has no editable name field, requiring a product decision between fixed localized labels and stored administrator-defined names.
- Stopped before UI, Server Actions, migrations, seed data or remote mutations as required by Task 08. Proposed a separately reviewed Task 08A calendar-integrity migration.

## 2026-09-07 — Task 07 authenticated application shell completed

- Added a server-only, request-cached application-context resolver using `auth.getUser()` and existing RLS-protected profile/school queries; no browser/JWT metadata, service role or raw provider error is trusted.
- Replaced the generic protected page with a restrained responsive French ADMIN/TEACHER shell, safe school/role context, semantic desktop/mobile navigation, keyboard focus, active-link semantics and local sign-out.
- Added a centralized typed role navigation matrix plus one shared localized `/fr/app/[module]` unavailable-module boundary. Recognized role-inappropriate manual paths fail with 404; link visibility is explicitly not an authorization boundary.
- Added fail-closed French access handling for missing/inactive profiles, inaccessible schools, unsupported roles and infrastructure failures without revealing whether other tenant data exists.
- Added fixture-only context, role navigation, route-authorization, accessibility, localization and identifier non-rendering tests. No migration, seed, remote database/Auth/configuration mutation, teacher account or business data was introduced.
- Pinned the production validation script to Next.js 16's supported webpack compiler after repeatable Turbopack CSS-worker port failures in the managed environment; the webpack production build passes without adding a dependency.

## 2026-09-07 — Task 06C completed and observation specification synced

- Reconfirmed the healthy linked `Suivora` development target, synchronized migrations, eight policies, three helpers, four RLS-enabled empty application tables, zero Auth users, enabled email/password provider and still-enabled public signup without remote mutation.
- Recorded confirmed future ClassCourse-scoped observation behavior, normalized-criteria proposal, hybrid deterministic/teacher-override classification, audit/history requirements, deterministic MVP summaries and deferred AI summaries.
- Added the post–Shared Classroom Core observation roadmap without adding schema, enums, migrations, UI, runtime code or business records.
- Added a parameterized first-admin bootstrap runbook covering manual signup disabling/Auth creation, atomic guarded school/profile creation, safe verification and recovery. No real email, UUID, password or populated SQL is tracked.
- Disabled public signup while retaining email/password sign-in, manually created the sole confirmed Auth user, and atomically created one school plus one active ADMIN profile through the untracked Dashboard workflow.
- Verified real application login, `/fr/app`, logout and signed-out redirects. The authenticated RLS matrix passed own school/profile reads, helper results, foreign-school hiding, forbidden school/profile mutations and deletion, forbidden profile creation, anonymous denial, same-school temporary year/term insert-read-update, and forged-school rejection.
- Removed the temporary year and term through the guarded privileged cleanup. Final counts are one Auth user, one school, one active ADMIN profile, zero school years and zero terms. No real email, UUID, password, recovery token or populated bootstrap SQL is tracked.

## 2026-09-05 — Task 06B reviewed remote authorization foundation

- Positively matched the CLI link and ignored public environment URL to the authenticated account's single healthy `Suivora` project in the documented European region. The previously approved task context classifies it as development; the project name is unrelated to Numeon and Supabase exposes no reliable environment label.
- Preflight confirmed exactly the four expected empty application tables, zero policies, no conflicting `anon`/`authenticated` object grants, no application or Auth data statements, the foundation migration exactly once, and only the authorization migration pending.
- Re-reviewed the migration with no destructive statements, broad table grants, anonymous access, DELETE/profile mutation, seed, service-role-specific behavior, or unrelated changes. The dry-run listed only `20260905090000_authorization_rls_foundation.sql`, with no seed or role file.
- Applied that migration exactly once to the confirmed Suivora development project. Local and remote histories now match with both foundation migrations present once.
- Remote schema verification confirmed three `postgres`-owned, schema-qualified, empty-search-path `SECURITY DEFINER` helpers; protected execution resolves only to `authenticated` (plus standard owner/service-role privileges), with no `PUBLIC`/`anon` execution.
- Confirmed exactly eight reviewed authenticated RLS policies, RLS enabled on all four tables, no DELETE policy/grant, no school/profile mutation grant, no `anon` object grant, and column-limited authenticated year/term mutations. PostgreSQL dump renders function `ALL` as its sole executable privilege; it is semantically EXECUTE only and grants no data access.
- Public and Auth data dumps remain empty. No Auth user, school, profile, year, term, seed row, first administrator, or Auth configuration was created or changed.
- Remote-generated and tracked local `public` schema type contracts are semantically equivalent. Differences are limited to remote PostgREST 14.5 metadata, generator parentheses, and trailing formatting; the tracked file was not overwritten.
- Lint, strict type-check, all 32 tests, coverage, production build, production dependency audit, documentation-link validation, credential/private-key and raw-error/console scans, and diff checks pass.
- Public signup remains enabled and must be disabled before the pilot. First-administrator provisioning and functional authenticated remote RLS testing remain deferred to Task 06C.
- No production or Numeon resource was modified, and no commit or push was performed.

## 2026-09-05 — Task 06A local authorization and RLS foundation

- Added local-only migration `20260905090000_authorization_rls_foundation.sql` without rewriting the remotely applied foundation migration.
- Added empty-search-path security-definer helpers for the active caller's school, application role, and own-school administrator check; execution is revoked from `PUBLIC`/`anon` and granted only to `authenticated` to avoid recursive profile RLS safely.
- Added eight explicit policies for own-school reads, self/admin profile reads, and admin-only school-year/term inserts and updates with matching `WITH CHECK`; all deletes, school mutations, and profile provisioning/mutations remain denied.
- Added minimum grants: no `anon` table privileges, authenticated SELECT on four foundation tables, and column-limited INSERT/UPDATE grants only for school years and terms.
- Added 85 transactional pgTAP assertions using fictional local identities. They cover missing/inactive profiles, anonymous denial, cross-school isolation, teacher/admin boundaries, forged school IDs, privilege escalation, helper ACL/security, non-recursion, constraint preservation, and no partial mutations.
- Two final clean resets and two final 85-test matrices pass; schema lint reports no errors and locally generated database types are byte-identical across resets.
- Lint, strict type-check, all 32 application tests, coverage, production build, production dependency audit, documentation links, credential/private-key and raw-error/console scans, seed cleanliness, and diff checks pass. The final local database has eight policies, zero fixture rows, zero `anon` table grants, and zero `anon` helper grants.
- The migration remains local-only. No remote migration, Auth setting, user, school, profile, data row, production resource, or Numeon resource was changed. No commit or push was performed.

## 2026-09-03 — Task 05 authentication foundation

- Added localized `/fr/connexion` email/password sign-in and `/fr/app` authenticated placeholder routes, with server-side redirects for signed-in and signed-out states.
- Added Zod credential validation and normalization, `signInWithPassword`, local-scope server-side sign-out, duplicate-submission pending states, accessible form semantics, and generic localized failures that never expose provider details or account existence.
- Added the Next.js 16 `proxy.ts` session-refresh boundary for only the French Auth/application routes, preserving refreshed request/response cookies and verifying identity through `getUser()` rather than trusting `getSession()`.
- Restricted optional return paths to the active locale's `/app` subtree and added coverage for external, protocol-relative, cross-locale, malformed, and adjacent-prefix attempts.
- Kept authentication separate from authorization: no profile, role, school, assignment, or application-table lookup was added, and the existing deny-by-default RLS/grant state is unchanged.
- Read-only public Auth inspection confirmed email/password availability and public signup enabled. Public endpoint output did not expose site URL or redirect allow-list values, and the dashboard required a separate login, so those values remain a manual authenticated-dashboard check. Public signup must be disabled before pilot use.
- Lint, strict type-check, all 32 tests, coverage, production dependency audit, documentation-link validation, credential/private-key and raw-error/console scans, diff checks, and the production build pass. Runtime checks confirm `/` → `/fr`, signed-out `/fr/connexion` rendering, signed-out `/fr/app` protection, unsupported-locale 404, and a generic French failed-sign-in message.
- No remote Auth user, school, profile, database row, Auth setting, migration, production resource, or Numeon resource was created or modified. No commit or push was performed.

## 2026-09-03 — Task 04B reviewed remote database foundation

- Positively matched the configured and linked target to the authenticated account's healthy Suivora project in the documented European region; the task context identifies it as development, and the target name is not associated with Numeon.
- Confirmed an empty remote migration history and public application schema, then completed a successful dry-run containing only `20260903070959_initial_school_foundation.sql`.
- Applied that migration exactly once with no seed, role file, Auth setting, Storage, Realtime, Edge Function, user, or application-data change.
- Remotely verified the enum, trigger function, four empty tables, primary/foreign keys, date/semester/uniqueness constraints, indexes, four update triggers, and RLS on every table.
- Confirmed zero RLS policies, zero `anon`/`authenticated` table grants, zero rows, and synchronized local/remote migration histories.
- Remote-generated and local-generated schema types are semantically identical. Byte-only output differences come from PostgREST version metadata and generator formatting, so the tracked local type file was not overwritten.
- Lint, strict type-check, all 11 tests, dependency audit, documentation links, credential scan, temporary-output scan, and diff checks pass. The standard build remains blocked only by the managed host's known Turbopack worker port restriction (`Operation not permitted (os error 1)`).
- No production or Numeon project was modified; no authentication flow, functional policy, business feature, commit, or push was created.

## 2026-09-03 — Task 04A local database foundation

- Added project-pinned Supabase CLI 2.116.0, standard local configuration, an intentionally empty seed boundary, and npm scripts for local start, stop, reset, and generated types.
- Added the reviewable `20260903070959_initial_school_foundation.sql` migration with `app_role` (`ADMIN`, `TEACHER`), `set_updated_at`, `schools`, `user_profiles`, `school_years`, and `terms`.
- Added UUID keys, `timestamptz` conventions, nonblank/date/semester/uniqueness constraints, deliberate `RESTRICT` deletion, and a composite foreign key preventing cross-school term/year linkage.
- Enabled RLS on all four application tables with zero policies, disabled automatic new-table exposure, and revoked table access from `anon` and `authenticated`.
- Completed local startup, two clean migration resets, schema lint with no errors, catalog verification, and TypeScript generation from the local schema; both Supabase factories now use the generated `Database` type.
- Lint, strict type-check, all 11 tests, dependency audit, documentation-link validation, credential scan, and diff checks pass. The standard build remains blocked only by the managed host's known Turbopack worker port restriction (`Operation not permitted (os error 1)`).
- Added no extension, identity, personal/seed data, authentication flow, repository, query, business table, or application feature.
- No Supabase project link, remote migration, remote mutation, commit, or push was performed.

## 2026-09-03 — Task 03B Supabase connection verification

- Confirmed that the ignored local environment file exists, both required public variables pass the centralized validator, and neither value appears in tracked files.
- Verified the configured project host and publishable key with a read-only Supabase Auth settings request that returned HTTP 200. An earlier REST root request returned HTTP 401 and was not treated as authoritative after the dedicated public Auth endpoint accepted the key.
- Performed no remote mutation and persisted no response or credential. The remote project name is not exposed by this public endpoint and remains manually verified in the dashboard.
- Lint, strict type-check, all 11 tests, dependency audit, and diff checks pass; runtime routes remain `/` → `/fr` (307), `/fr` (200), and unsupported locale (404).
- The standard build remains blocked by the managed host's known Turbopack worker port restriction (`Operation not permitted (os error 1)`), independently of Supabase connectivity.
- Task 03B is complete; no remote data or configuration, commit, or push was created.

## 2026-09-03 — Task 03 Supabase project configuration

- Added `@supabase/supabase-js` 2.114.0, `@supabase/ssr` 0.12.5, and Zod 4.5.4; no deprecated auth-helper or unrelated package was added.
- Defined the lazy `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` environment contract with typed immutable validation and non-sensitive errors.
- Added a cached browser client factory and a server-only, request-scoped factory using the Next.js 16 async cookie API and current `getAll`/`setAll` adapter.
- Added focused tests for valid, missing, malformed, immutable, non-leaking, and lazy configuration behavior while preserving localization coverage.
- Documented manual European-region project setup, RLS/authorization boundaries, fictional development data, and pre-pilot privacy/GDPR review.
- Authentication, session-refresh proxy, remote connectivity, tables, SQL, migrations, generated database types, RLS, repositories, queries, seeds, and business features remain deferred.
- Lint, strict type-check, all 11 tests, route checks, documentation links, dependency audit, ignore rules, and credential/import-boundary scans pass without Supabase variables.
- The standard production build reaches Next.js 16.3.4 compilation but this managed host again blocks Turbopack's CSS worker from binding to a local port (`Operation not permitted (os error 1)`); neither the build command nor configuration was changed.
- No remote data, commit, or push was created.

## 2026-09-02 — Task 02 localization foundation

- Added next-intl 4.14.2 using its current Next.js 16.3 App Router integration with `next/root-params`.
- Established the typed immutable French locale contract, safe locale validation, server request loader, typed navigation helpers, and complete initial `fr.json` catalog.
- Moved the placeholder to `/fr`, made `/` redirect deterministically to `/fr`, and made unsupported locale segments return a localized 404 without fallback.
- Localized placeholder content and page metadata while keeping the application primarily server-rendered.
- Added locale-contract, root-redirect-decision, and catalog-backed rendering tests.
- Kept language switching, Turkish/English catalogs, browser detection, locale cookies, and preference persistence deferred.
- Lint, strict type-check, and all four focused tests pass; runtime checks confirm `/` → `/fr` (307), `/fr` (200), and unsupported locale handling (404 with catalog-backed French copy).
- The standard production build reaches Next.js 16.3.4 compilation but this managed host blocks Turbopack's CSS worker from binding to a local port (`Operation not permitted (os error 1)`); the command and configuration were not changed or weakened.
- No Supabase, database, migration, authentication, business feature, commit, or push was created.

## 2026-09-02 — Task 01A product specification sync

- Added the confirmed initial mandatory-study trigger below 55% and documented persistent requirements, sessions, workflow states, history, audit, and duplicate-prevention expectations.
- Added academic events, audience-scoped shared events, owner-private reminders/tasks, and default in-app reminders at 7, 3, and 1 day.
- Added the personalized “À faire aujourd’hui” action-center specification, including authoritative source projections, persistent personal tasks, navigation, authorization, and deterministic-priority expectations.
- Added proposed schema entities, authorization boundaries, roadmap tasks, and future deterministic test scenarios without creating runtime code or migrations.
- Preserved Milestone A scope and recorded new unresolved product questions, including how a coordinator maps to the current role model.
- Confirmed Task 01 complete after successful local production-build artifacts and static-generation diagnostics became available in the repository.
- No application code, dependency, migration, commit, or push was created for Task 01A.

## 2026-09-02 — Task 01 repository bootstrap completed

- Initialized the minimal App Router application with Next.js 16.3.4, React 19.2.8, and strict TypeScript 5.9.3.
- Added Tailwind CSS 4.3.3 and ESLint 9.39.5 configuration.
- Added Vitest 4.1.11, React Testing Library 16.3.3, jest-dom, user-event, jsdom 27.4.0, and V8 coverage support with a page smoke test.
- Added npm development, lint, type-check, test, coverage, build, and start commands plus the npm lockfile and environment contract.
- Added a responsive, accessible French foundation placeholder; its static copy is temporary pending Task 02 localization.
- Lint, strict type-check, unit test, coverage, and local production-build validation pass. Earlier managed-host attempts were delayed by Turbopack's internal process/port behavior, but the completed build emitted a `BUILD_ID`, route/build manifests, and static-generation diagnostics with Next.js 16.3.4.
- No business features, Supabase configuration, database work, migration, authentication, commit, or push was performed.

## 2026-09-02 — Task 00 foundation

- Established product identity, MVP boundaries, shared `ClassCourse` concept, and Milestone A.
- Recorded the proposed single-repository Next.js/Supabase/PostgreSQL architecture.
- Defined logical domain/schema direction, tenant and assignment authorization, RLS expectations, and audit/security principles.
- Documented grading formulas, outcome modes, recurring homework alert behavior, progression planning, localization, testing, and build order.
- Centralized unresolved business and technical questions.
- No application code, dependency installation, migration, test, commit, or push was created.
