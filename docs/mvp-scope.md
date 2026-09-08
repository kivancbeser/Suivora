# MVP scope

## In scope

- ADMIN and TEACHER authentication and role-aware access
- School-year and semester configuration
- Teachers, classes, courses, students, enrollments, `ClassCourse`, and multi-teacher assignments
- Shared class/student views
- Fixed C1-C8 quizzes, grades out of 100, averages, suggestions, final oral grades, and evolution/bands
- `QUICK_TOTAL` and `OUTCOME_DETAILED` assessment entry
- Learning outcomes and detailed outcome analysis where evidence exists
- 37-week-capable progression planning, Excel import/export, editing, alerts, and progress summaries
- Homework assignment and per-student submission state
- Recurring three-unsubmitted threshold alerts and append-only contact history
- Persistent mandatory-study requirements when the relevant quiz-success level is strictly below the confirmed initial 55% threshold
- Mandatory-study scheduling, completion, audit trail, and retained history
- Shared academic events and private teacher reminders
- Default in-app reminder projections at 7, 3, and 1 day before events
- Persistent personal teacher tasks
- Personalized “À faire aujourd’hui” actions derived from authorized source modules
- ClassCourse-scoped student observations, flash/bulk and detailed entry, history, deterministic evolution/alerts/summaries, class indicators, and PDF/Excel reporting
- Teacher and administrator dashboards
- Requested PDF/Excel exports
- Responsive, accessible web UI; complete French and Turkish locales through one localization layer
- Auditability and school/assignment-scoped authorization

## Out of scope for the MVP

- Native iOS/Android apps
- Student and parent logins
- Billing, subscriptions, automated school onboarding, and cross-school administration
- Microservices
- Email, SMS, browser push, and mobile push notifications
- Generative-AI observation summaries before the deterministic rule-based MVP is validated

## Out of scope for Task 00

All application code, UI, dependency installation, framework initialization, Supabase connection, migrations, authentication, imports/exports, tests, commits, and pushes.

## Scope control

An item being described here does not mean it is implemented. New business rules require an explicit decision, documentation update, and appropriately scoped task.

## Implemented structural foundation

The database foundation for school-year classes, school-owned courses, and their `ClassCourse` join is implemented without seed or business rows. ADMIN management UI, students, enrollments, and teacher assignments remain separate tasks.
