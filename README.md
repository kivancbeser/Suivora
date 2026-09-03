# Suivora

> Le suivi pédagogique, simplement.

Suivora is a French-first shared classroom management web application for clear, actionable academic tracking. It is designed for schools where multiple teachers share responsibility for a class and subject and therefore need one consistent academic record.

## Current status

Task 03 Supabase project configuration is complete. The repository now has lazy, typed public-environment validation and separate browser/request-scoped server Supabase client factories. French routing and localization remain unchanged. No remote project is connected, and no table, migration, authentication, authorization, repository, query, or business feature exists yet.

## Users and central concept

The pilot targets one school, roughly four teachers and fifty students. Administrators configure school structures and assignments. Teachers work only within assigned classes and subjects. Student and parent accounts are not part of the MVP.

The central aggregate is `ClassCourse`: one class, one subject, and one school year with one or more teacher assignments. Assigned teachers work on the same quizzes, grades, outcomes, homework, contact history, and shared academic information. Server authorization and database policies—not UI visibility—protect access.

## MVP modules

- Administration: school years, terms, teachers, classes, subjects, students, enrollments, and assignments
- Shared classroom and student progress
- Fixed C1-C8 quizzes, grade entry, averages, and oral-grade suggestions
- Quick-total and detailed learning-outcome assessment
- Weekly lesson progression planning and Excel interchange
- Homework tracking, recurring threshold alerts, and contact history
- Persistent mandatory-study requirements for relevant quiz success below 55%, with scheduling and history
- Shared academic events, private teacher reminders, and default in-app reminders
- A personalized “À faire aujourd’hui” action center derived from authorized source data
- Teacher and administrator dashboards
- Requested PDF and Excel exports

## Technical stack

The installed foundation uses Next.js 16.3.4, React 19.2.8, TypeScript 5.9.3 in strict mode, the App Router, Tailwind CSS 4.3.3, ESLint 9.39.5, Vitest 4.1.11, React Testing Library 16.3.3, jsdom 27.4.0, next-intl 4.14.2, Supabase JS 2.114.0, Supabase SSR 0.12.5, and Zod 4.5.4.

Supabase PostgreSQL tables, migrations, Auth/RLS, shadcn/ui, Lucide, React Hook Form, Playwright, and Vercel remain proposed for later tasks. PostgreSQL is preferred because the domain is relational and reporting-heavy; microservices are not planned for the MVP.

## Documentation

- [Product specification](docs/product-spec.md) and [MVP scope](docs/mvp-scope.md)
- [Architecture](docs/architecture.md), [domain model](docs/domain-model.md), and [database schema](docs/database-schema.md)
- [Authorization](docs/authorization-model.md) and [security](docs/security.md)
- [Grading](docs/grading-rules.md), [learning outcomes](docs/learning-outcomes.md), [homework](docs/homework-rules.md), and [progression planning](docs/progression-planning.md)
- [Localization](docs/localization.md), [testing](docs/testing-strategy.md), and [development plan](docs/development-plan.md)
- [Open decisions](docs/open-decisions.md), [decision records](docs/decisions/README.md), and [changelog](docs/changelog.md)

## Development workflow

Prerequisites: Node.js 20.9 or newer and npm. The repository currently records npm 10.9.2 as its package manager.

```bash
npm install
npm run dev
```

The development server is available at `http://localhost:3000` by default. Validate changes with:

```bash
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
```

## Supabase environment

Copy `.env.example` to `.env.local`, then add these values from the future Supabase project's Connect panel:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Configuration is validated only when a Supabase client is requested, so the current localized placeholder and normal validation do not require credentials. The publishable key is intentionally browser-visible and does not authorize data access; every future school table still requires grants, RLS, and server-side authorization. Never put a secret or legacy service-role key in a `NEXT_PUBLIC_*` variable.

Manual setup remains deliberately separate from this task:

1. Create a dedicated Suivora project in the Supabase dashboard and select an appropriate European region for the initial school in France.
2. Copy its project URL and current publishable public key into `.env.local`.
3. Never copy the database password, a secret key, or a legacy service-role key into client variables.
4. Verify read-only connectivity during the database-foundation task.
5. Separate local/development and production projects before any pilot data is used.

Use only fictional people during development. Production access, retention, and GDPR/privacy requirements must be reviewed before real school data is stored; logs must never contain student grades or contact notes.

Before implementation, read `AGENTS.md` and the relevant feature documents. Work in the dependency order in the development plan, keep business rules pure and tested, add schema changes through documented migrations, and update the source-of-truth documents when a decision changes.

The application always starts in explicit French:

- Visit `http://localhost:3000/fr` for the canonical route.
- Visiting `/` redirects to `/fr`.
- Locale detection, locale cookies, language preference persistence, and a language switcher are intentionally absent.

Add or change user-facing copy in `src/i18n/messages/fr.json`, use semantic namespaces, and access it with next-intl's server APIs by default. To add a future locale, create and test a complete equivalent catalog before adding its code to the immutable locale tuple in `src/i18n/routing.ts`.

The next recommended task is **TASK 04 — Database Foundation**.

## Important open decisions

Decisions are tracked centrally in [docs/open-decisions.md](docs/open-decisions.md). The most consequential concern missing grades and rounding, the mandatory-study input/resolution/authority rules, event coordinator/audience semantics, deterministic action priorities, detailed outcome point allocation, homework status thresholds, progression-plan ownership and workbook mapping, audit retention, and export content/permissions.
