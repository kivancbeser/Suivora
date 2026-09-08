# Suivora

> Le suivi pédagogique, simplement.

Suivora is a French-first shared classroom management web application for clear, actionable academic tracking. It is designed for schools where multiple teachers share responsibility for a class and subject and therefore need one consistent academic record.

## Current status

Task 09D-PRE deployment preparation is active. The reviewed application is pushed to the dedicated `kivancbeser/Suivora` GitHub repository and deployed from `main` to the dedicated Vercel `suivora` project at `https://suivora.vercel.app`. Production environment-variable names are configured in Vercel without storing values in Git. Supabase Auth URL changes and the first real invitation remain pending separate approval.

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
- ClassCourse-scoped student observations, follow-up history, deterministic alerts/summaries, and reporting after Shared Classroom Core
- Teacher and administrator dashboards
- Requested PDF and Excel exports

## Technical stack

The installed foundation uses Next.js 16.3.4, React 19.2.8, TypeScript 5.9.3 in strict mode, the App Router, Tailwind CSS 4.3.3, ESLint 9.39.5, Vitest 4.1.11, React Testing Library 16.3.3, jsdom 27.4.0, next-intl 4.14.2, Supabase JS 2.114.0, Supabase SSR 0.12.5, Supabase CLI 2.116.0, and Zod 4.5.4.

The production build script uses Next.js 16's supported webpack compiler because Turbopack's CSS worker cannot bind its internal helper port in the managed validation environment. Development remains on `next dev`; this compiler choice adds no runtime dependency.

The PostgreSQL foundation, migrations, Supabase Auth session boundary, and deny-by-default RLS baseline are implemented. Functional authorization policies, shadcn/ui, Lucide, React Hook Form, Playwright, and Vercel remain proposed for later tasks. PostgreSQL is preferred because the domain is relational and reporting-heavy; microservices are not planned for the MVP.

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

The development server is available at `http://localhost:3000` by default. The stable development deployment is `https://suivora.vercel.app`. Validate changes with:

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
SUPABASE_SECRET_KEY=
APP_URL=
```

Configuration is validated only when a Supabase client is requested, so the current localized placeholder and normal validation do not require credentials. The publishable key is intentionally browser-visible and does not authorize data access; every future school table still requires grants, RLS, and server-side authorization. Never put a secret or legacy service-role key in a `NEXT_PUBLIC_*` variable.

Manual setup remains deliberately separate from this task:

1. Create a dedicated Suivora project in the Supabase dashboard and select an appropriate European region for the initial school in France.
2. Copy its project URL and current publishable public key into `.env.local`.
3. Keep `SUPABASE_SECRET_KEY` server-only and set `APP_URL` to an origin only; see the teacher invitation setup runbook before enabling either.
4. Read-only public connectivity is verified; perform database connectivity checks only after Task 04A creates an approved local foundation.
5. Separate local/development and production projects before any pilot data is used.

Use only fictional people during development. Production access, retention, and GDPR/privacy requirements must be reviewed before real school data is stored; logs must never contain student grades or contact notes.

## Local database workflow

Docker Desktop or another Docker-compatible runtime must be running. The CLI is a pinned project dev dependency; do not install it globally.

```bash
npm run db:start
npm run db:reset
npm run db:lint
npm run db:test
npm run db:types
npm run db:stop
```

Create future migrations with `npx supabase migration new <descriptive_name>`, edit the new SQL file, then run a clean `npm run db:reset`, `npx supabase db lint --local --level warning`, regenerate types, and reset once more. Generated database types are stored at `src/types/database.generated.ts` and must not be edited manually.

The local seed file is intentionally empty. The repository is linked only through ignored CLI metadata to the verified Suivora development project, and the reviewed foundation migration has been applied there without seed data. Every later remote migration still requires a separate dry-run, review, and explicit authorization.

Before implementation, read `AGENTS.md` and the relevant feature documents. Work in the dependency order in the development plan, keep business rules pure and tested, add schema changes through documented migrations, and update the source-of-truth documents when a decision changes.

The application always starts in explicit French:

- Visit `http://localhost:3000/fr` for the canonical route.
- Visiting `/` redirects to `/fr`.
- Locale detection, locale cookies, language preference persistence, and a language switcher are intentionally absent.

Add or change user-facing copy in `src/i18n/messages/fr.json`, use semantic namespaces, and access it with next-intl's server APIs by default. To add a future locale, create and test a complete equivalent catalog before adding its code to the immutable locale tuple in `src/i18n/routing.ts`.

Authentication routes are `/fr/connexion` and `/fr/app`. Public registration is intentionally absent and public signup is disabled in the development project. `/fr/app/[module]` provides one shared localized unavailable-module placeholder for recognized role-appropriate navigation destinations. Role-aware link visibility is presentation only: the dynamic module route independently checks the server-resolved role and rejects manually entered role-inappropriate paths.

The next recommended task is **TASK 09D — Controlled Remote Teacher Invitation and Activation Verification**. It must review remote Auth URLs/templates/SMTP boundaries and exercise one controlled invitation only after explicit approval.

## Important open decisions

Decisions are tracked centrally in [docs/open-decisions.md](docs/open-decisions.md). The most consequential concern missing grades and rounding, the mandatory-study input/resolution/authority rules, event coordinator/audience semantics, deterministic action priorities, detailed outcome point allocation, homework status thresholds, progression-plan ownership and workbook mapping, audit retention, and export content/permissions.
