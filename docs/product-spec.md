# Product specification

## Status vocabulary

- **Confirmed**: required product behavior.
- **Proposed**: a technical or UX direction requiring adoption during implementation.
- **Open**: unresolved; implementation must not guess.
- **Deferred**: outside the MVP or the current milestone.

## Product identity

Suivora is a French-first responsive web application for shared, clear, and actionable academic tracking. Working positioning: “Shared, clear and actionable academic tracking.” French tagline: “Le suivi pédagogique, simplement.”

The first pilot is approximately one school, four teachers, fifty students, multiple classes and courses, with administrator and teacher roles.

## Confirmed product model

`ClassCourse` binds a class and course for a school year. One or more teachers may be assigned. All assigned teachers work on the same authorized academic records: enrolled students, quizzes and grades, learning outcomes, homework, alert/contact history, and shared progression data according to the eventual ownership decision. Relevant changes are auditable. Authorization is enforced beyond the client.

Administrators manage teachers, years/terms, classes, courses, students, and teacher assignments. Teachers see assigned class courses, may add students to an authorized class, and manage its academic workflow.

Student detail eventually combines C1-C8 grades, semester and annual averages, suggested and final oral grades, evolution, outcome analysis, homework history, alerts, contact history, and mandatory-study history.

## Modules

The MVP comprises structural administration, student enrollment, shared classes, fixed quizzes and grading, student progress, learning outcomes, progression planning, homework and alerts, contact history, mandatory-study workflows, academic events, in-app reminders, personal teacher tasks, the personalized action center, dashboards, and requested PDF/Excel exports. Detailed rules live in the feature documents.

## Mandatory study

A student whose relevant quiz-success level is strictly below 55% receives `MANDATORY_STUDY_REQUIRED` and automatically appears in a mandatory-study list. The 55% value is the confirmed initial threshold; which average is relevant and whether the threshold later becomes configurable are open decisions.

The list eventually shows the student, class, subject, current relevant average, reason, creation date, study status, responsible teacher when available, and planned study date when available. Every entry links to student progress and may also surface on the teacher dashboard, student profile, and “À faire aujourd’hui.”

This is a persistent workflow, not a transient warning. Proposed statuses are `TO_SCHEDULE`, `SCHEDULED`, `COMPLETED`, and `CANCELLED`. Preserve the reason, triggering average, creation and scheduled/completion dates, responsible teacher, status history, and completion notes. Completion never deletes the requirement from history. `StudyRequirement`, `StudySession`, and `StudyRequirementStatus` are proposed domain concepts; resolution semantics and completion authority remain open.

## Important dates and in-app reminders

The initial academic event types are `EXAM`, `QUIZ`, `MEETING`, `HOMEWORK`, `PROJECT`, `SCHOOL_EVENT`, and `PERSONAL_REMINDER`. Administrators/coordinators can create shared events; teachers can create personal events. Shared events are visible only to their intended teachers/classes. Personal reminders are private to their owner unless an explicit future sharing capability is adopted.

Default in-app reminders are projected 7, 3, and 1 day before an event. The model supports future configurability, but configurable schedules are not required initially. Upcoming events appear on the teacher dashboard and link to their source or event detail. Past events leave the primary upcoming list but remain in history. Email, SMS, browser push, and mobile push are deferred.

Proposed concepts are `AcademicEvent`, `EventAudience`, `EventReminder`, and `PersonalTask`.

## “À faire aujourd’hui”

On login, teachers should receive a personalized action center titled “À faire aujourd’hui.” It aggregates authorized actions from upcoming academic events, incomplete assessment grade entry, declining student performance, mandatory-study requirements, delayed progression, upcoming exams/quizzes, unresolved homework alerts, and personal teacher tasks.

User-facing priority groups are `URGENT`, `TODAY`, `THIS_WEEK`, and `UPCOMING`; French labels belong in the localization layer. Every item is clickable and routes to the relevant filtered list, grade-entry screen, progression plan, study list, event, alert, or task.

Automatic action items are deterministic projections and disappear when the underlying condition is resolved. They must not be duplicated into stale task rows when the source can be derived reliably. Personal tasks are persistent and can be completed, postponed, or rescheduled. A proposed `TeacherActionCenter` application service may aggregate these sources but never becomes authoritative for them. Priority and disappearance rules must be defined as deterministic, testable domain/application logic rather than dashboard-component behavior.

## Student observations and follow-up

The future observation module is scoped to `ClassCourse`, its authorized student roster, and the observing teacher. Observations are recorded when needed rather than daily; multiple observations for one student on the same day are allowed. Flash and detailed entry modes, bulk class submission, student history, period/criterion filters, criterion evolution, deterministic alerts with active/resolved history, class KPIs, student/class reports, PDF-first export and additional Excel export are required capabilities. Bulk save creates records only for students with entered values; empty rows never create records.

Observations are historical and auditable and must not be silently deleted. Students are archived or soft-deactivated rather than physically deleted. Positive/negative classification is hybrid: normalized criteria produce a deterministic classification, while an explicit teacher override is stored separately with actor, time and audit context. Initial summaries use deterministic rules and editable templates. Generative-AI summaries are deferred until the rule-based MVP has been validated.

The proposed normalized criteria contract, to be finalized in its own implementation task, covers material (`complete`, `partial`, `missing`); five levels each for participation, attitude, classroom work and organization; homework (`completed`, `partially completed`, `not completed`, `forgotten`, `submitted late`); punctuality (`on time`, `slightly late`, `late`, `frequently late`); attendance (`present`, `absent`, `justified absence`, `unjustified absence`); and multi-select missing-material and behavior tags. These are language-independent concepts, not implemented database enums.

## Experience direction

Teacher dashboards should surface “À faire aujourd’hui,” active classes, followed students, grade-entry state, reinforcement needs, mandatory study, upcoming events, current/next progression, delayed units, homework alerts, and a fast grade-entry action. Administrator dashboards should surface class and semester averages, evolution, students below 50, progression by teacher/class and unit, and unresolved alerts.

## Deferred

Native mobile apps, student/parent accounts, full multi-school SaaS onboarding, billing/subscriptions, cross-school administration, and external email/SMS/browser/mobile-push notification delivery are deferred. Their possible future existence must not weaken present tenant isolation.

## Milestone A — Shared Classroom Core

An administrator creates two teachers, one class, one subject, students, and assigns both teachers to one class course. Teacher A logs in, creates a quiz, and enters grades. Teacher B sees the same quiz and grades and modifies an authorized grade. Both see updated shared data; averages are calculated and audit metadata preserved.

Learning outcomes, planning, homework alerts, mandatory study, events/reminders, the action center, and exports are explicitly excluded from Milestone A.

## Implemented ADMIN calendar workflow

Task 08C lets administrators list, create, and edit real school years and their two fixed semester periods. School identity is derived from the authenticated application context, semester labels are localized presentation values, and deletion remains deferred.

## Implemented shared classroom structure

`ClassCourse` is the central teaching aggregate: one class plus one school-owned course in the class's school year. Classes are unique by case-insensitive name within a year; courses are unique by case-insensitive name and optional code within a school. `weekly_periods` records lesson periods per week (1–40), not clock hours. All three structures use active/inactive lifecycle state and no hard-delete access. Initially only active same-school administrators can access them; teacher access requires the later assignment model.

## Confirmed teacher account lifecycle

Teacher accounts are invitation-only and public signup stays disabled. Administrators provide an email address and mandatory display name but never choose or store a teacher password. Supabase Auth remains authoritative for email and password establishment; the application profile stores only school, fixed TEACHER role, active state, and display name.

Each initial teacher belongs to exactly one school. Own-school administrators may rename, deactivate, or reactivate teachers without deleting their profiles or historical academic relationships. Classroom access will later require an active `ClassCourse` assignment in addition to an active TEACHER profile.
