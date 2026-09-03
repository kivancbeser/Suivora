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

## Localization foundation scenarios

- `/fr` renders the product name and French tagline from `fr.json`.
- `fr` is accepted, an unknown locale is rejected, and the default is `fr`.
- The supported-locale tuple remains immutable and is the source of the `Locale` type.
- The application-owned root redirect target is `/fr`.
- Unsupported locale segments reach a 404 without falling back to French.
- Metadata and visible placeholder copy use catalog keys rather than duplicated component strings.
- New locale activation requires a complete catalog and representative routing/render tests.

Tests target application-owned decisions instead of mocking fragile Next.js redirect or not-found internals. Production builds validate the framework integration.

## Supabase configuration scenarios

- Valid public project URL and publishable key produce a typed immutable configuration.
- Missing or malformed values fail with developer-facing field errors that never include supplied credentials.
- Parsing does not mutate caller-owned input.
- Environment reads remain centralized and lazy, so localized pages and builds that do not request a Supabase client need no `.env.local` file.
- Tests make no live request and do not exercise third-party SDK internals.
- Later database/auth integration tests must use fictional data and verify server authorization and RLS separately from client creation.

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

## Quality gates

Repository bootstrap should define commands for formatting/checks, linting, strict type checking, unit/component tests, build, and E2E. CI should run the proportional subset on changes and the full security/shared-class scenario suite before pilot release. Exact commands are intentionally not invented before `package.json` exists.

Do not overuse snapshots for domain behavior; assert meaningful outcomes and denial conditions. Every production bug in core logic or authorization should gain a regression test.
