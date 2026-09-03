# Documentation changelog

Significant product, domain, architecture, security, and delivery-document changes belong here. This is not a substitute for decision records or version control.

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
