# Database schema proposal

## TASK 14A homework tracking foundation

The local forward-only homework migration adds `homework_assignments` and `homework_student_statuses` plus the three-value `homework_state` enum. Assignments are bound by composite constraints and validation triggers to one school, school year, term and ClassCourse. Explicit student states are unique per assignment/student, require due-date enrollment eligibility, preserve audit actors/timestamps and cannot be hard-deleted through application roles. Absence of a status row means “not recorded.”

`create_homework_assignment`, `update_homework_assignment` and `save_homework_statuses` are the only mutation boundaries. They derive tenant and actor identity from the authenticated session and authorize either a same-school active ADMIN or an actively assigned TEACHER. `list_homework_attention(date)` exposes an authorized, derived projection for current streaks of at least three; it stores no duplicate alert state. Submission dates are retained, while ambiguous working-day delay totals remain deferred.

The reviewed local and Suivora development foundations currently end at `20260910140000_teacher_assignment_foundation.sql`, with eight synchronized migrations. Later sections remain logical proposals until their own migrations are implemented.

## Implemented local foundation

- `app_role` contains only active MVP account roles: `ADMIN` and `TEACHER`.
- `schools` is the tenant root with a nonblank name and UUID/timestamp conventions.
- `user_profiles.id` references `auth.users.id`; each profile belongs to one school, has one role and active state, and both auth-user and school deletion are restricted.
- Task 09A adds nullable `display_name`; null remains valid only for legacy ADMIN profiles, while stored names are trimmed and 1–120 characters and every TEACHER must have one.
- `school_years` belongs to a school, requires a nonblank label and `start_date < end_date`, and is unique by school and label.
- `terms` carries `school_id`, references a same-school `school_year` through a composite foreign key, allows semester 1 or 2 only, requires ordered dates, and is unique by school year and semester.
- School, profile, year, and term updates receive `updated_at` from one trigger function. All timestamps use `timestamptz`.
- The local and development schemas have ten RLS-enabled application tables and thirty-two explicit authenticated policies. The assignment migration adds four assignment policies plus assignment-scoped SELECT policies for classes, courses, ClassCourses, students, and enrollments. No DELETE policy exists.
- `anon` retains zero table/helper access. `authenticated` receives table SELECT plus column-limited year/term INSERT and UPDATE grants; grants do not bypass RLS.
- Task 06C provisioned the remote development tenant through an untracked atomic transaction. Its stable post-bootstrap state is one school, one active ADMIN profile linked to the sole Auth user, zero school years and zero terms; temporary RLS verification records were removed.

### Task 08A/08B calendar integrity

`20260907190000_calendar_integrity.sql` is the forward-only local migration for the reviewed calendar contract. It first rejects, rather than repairs, incompatible existing rows; tightens `terms_date_order` to `start_date < end_date`; and adds trigger enforcement for term containment, Semester 1-before-2 chronology, non-overlap, and school-year edits that would exclude a child term.

Every term insert or relevant update locks its parent school-year row. Moving a term locks the old and new parents in UUID order. A school-year update already owns the same row lock, so direct and concurrent writes serialize at one narrow aggregate boundary before the cross-row checks. Existing same-school foreign keys, semester-number/uniqueness constraints, RLS policies and grants remain unchanged.

Semester display names are fixed localized UI labels derived from the language-independent values 1 and 2. `terms` intentionally has no editable `name`, `title`, or `label` column. The migration passed two clean local resets and pgTAP validation, then TASK 08B applied it exactly once to the confirmed development project. Remote catalog inspection confirms the strict constraint, both functions and triggers, unchanged eight-policy/RLS/grant boundary, synchronized migration history, and unchanged data counts.
- `current_school_id`, `current_app_role`, and `is_school_admin` read only active caller authorization facts through non-recursive, empty-search-path security-definer functions.
- Task 08B remote verification confirms one school, one active ADMIN profile linked to the sole Auth user, zero school years and zero terms. No seed data was applied.
- No extension was added: PostgreSQL 17 supplies `gen_random_uuid()` without a project-specific extension requirement.

The generated local schema contract is `src/types/database.generated.ts` and must be regenerated, never hand-edited, after migration changes.

## Tenant and identity

| Table | Essential fields / constraints |
|---|---|
| `schools` | `id`, name, timestamps |
| `user_profiles` | `id` (Auth identity), `school_id`, role, active, nullable legacy-ADMIN/required-TEACHER `display_name`, timestamps |
| `school_years` | `id`, `school_id`, label, start/end dates, active |
| `terms` | `id`, `school_id`, `school_year_id`, semester number, dates; unique year + semester |

## Academic structure

| Table | Essential fields / constraints |
|---|---|
| `classes` | `id`, `school_id`, `school_year_id`, trimmed name, `is_active`, timestamps; same-school-year FK and case-insensitive year-scoped name uniqueness |
| `courses` | `id`, `school_id`, trimmed name/optional code, `is_active`, timestamps; case-insensitive school-scoped name/code uniqueness |
| `students` | `id`, `school_id`, trimmed first/last names, optional case-insensitively unique school code, `is_active`, timestamps |
| `class_courses` | `id`, `school_id`, `school_year_id`, `class_id`, `course_id`, `weekly_periods`, `is_active`, timestamps; composite tenancy FKs and unique class/course/year |
| `teacher_assignments` | `id`, `school_id`, `class_course_id`, `teacher_id`, `weekly_periods` 1–40, `is_active`, timestamps; same-school composite FKs and unique teacher/ClassCourse |
| `enrollments` | `id`, `school_id`, `school_year_id`, `student_id`, `class_id`, inclusive `starts_on`/optional `ends_on`, timestamps; same-school/year FKs and no overlapping student/year ranges |

Every foreign-key path must remain within one `school_id`, enforced through composite constraints, triggers, or an equally reliable design in addition to application validation.

`20260909013000_class_course_foundation.sql` implements these three tables. Composite parent keys make same-school and same-school-year relationships declarative; case-insensitive unique indexes provide concurrency-safe business uniqueness. `weekly_periods` is a 1–40 lesson-period count, not clock-hour duration. RLS is enabled at creation, only active same-school ADMIN policies exist, mutation grants are column-limited, and DELETE is neither granted nor covered by policy. All three tables start empty.

`20260909180000_student_enrollment_foundation.sql` implements minimal student identity and historical class membership locally and on the Suivora development project. Composite foreign keys bind students/classes/years to one school, a hardened trigger validates inclusive dates against a locked school year, and an `extensions.btree_gist` exclusion constraint prevents overlapping ranges while treating null `ends_on` as open-ended. ADMIN may update student identity/active fields and only close an enrollment via `ends_on`; enrollment identity is immutable through grants. Six ADMIN-only policies exist, TEACHER/anonymous access and all hard deletion remain denied, and both remote tables remain empty.

`20260910090000_atomic_student_workflows.sql` is applied locally and on Suivora development. It adds four authenticated ADMIN RPCs: `admin_create_student_with_enrollment`, `admin_update_student`, `admin_transfer_student`, and `admin_close_current_enrollment`. The functions expose no school/year/role authority, use empty-search-path volatile security-definer execution, normalize identity input, lock lifecycle rows, and return stable failures. Direct table grants and the 23-policy RLS matrix are unchanged; the remote student and enrollment tables remained empty after application.

`20260910140000_teacher_assignment_foundation.sql` adds the assignment table, two protected ADMIN RPCs and `is_teacher_assigned(uuid)`. Validation triggers lock the parent ClassCourse and enforce teacher eligibility, relationship immutability, active-capacity totals, parent period reduction, and parent deactivation rules. Teachers receive SELECT-only access to their own active assignment, assigned structure, and enrolled class roster; no classroom/student mutation or hard deletion is granted. Remote application is approval-gated.

## Assessment

| Table | Essential fields / constraints |
|---|---|
| `quizzes` | `id`, `school_id`, `school_year_id`, `term_id`, `class_course_id`, slot C1-C8, title/date, max score fixed at 100, active lifecycle, creation/update actors and timestamps; unique ClassCourse + slot |
| `quiz_scores` | `id`, `school_id`, `quiz_id`, `student_id`, decimal score 0–100 (maximum two decimals), creation/update actors and timestamps; unique quiz + student, while no row means not entered |
| `oral_grades` | `id`, `school_id`, course/student/term, calculated suggestion, final teacher grade, calculation version/time, decision actor/time |
| `learning_outcomes` | `id`, `school_id`, optional subject/year scope, stable code, description |
| `assessment_elements` | `id`, `school_id`, `quiz_id`, order/title, maximum points |
| `element_outcomes` | element/outcome link plus future allocation metadata after decision |
| `student_element_scores` | `id`, `school_id`, element/student, score, audit metadata |

`20260911100000_quiz_grade_foundation.sql` implements the first two assessment tables locally and on Suivora development. Composite foreign keys and hardened triggers enforce one-school ownership, ClassCourse/year/term consistency, C1–C4 versus C5–C8 semester placement, quiz dates inside the term, and active enrollment on the quiz date. Direct mutations and hard deletion are unavailable to application roles. Assigned teachers and same-school administrators read through RLS and mutate only through audited protected RPCs; bulk score saving validates the complete request before committing. Remote application created no quiz or score rows.

## Homework and contact

| Table | Essential fields / constraints |
|---|---|
| `homework_assignments` | `id`, `school_id`, `class_course_id`, title/details, assigned/due dates, creator |
| `homework_student_states` | assignment/student, state, submission date, delay days, modified by/at |
| `homework_alerts` | `id`, `school_id`, course/student, threshold baseline/current count, created/resolved metadata, status |
| `contact_records` | `id`, `school_id`, course/student/alert, contact date/type, optional note, recorder, `unsubmitted_count_at_contact`, created timestamp |

Contact records are append-only. Resolution and contact creation should be atomic.

## Proposed student-observation schema

No observation table or enum exists yet. A later reviewed migration should model `student_observations` with `school_id`, `class_course_id`, `student_id`, author teacher/profile, observation timestamp, entry mode, optional comment, normalized criterion values and audit metadata. Multi-select material/behavior tags may use constrained child rows or arrays only after the criteria contract is finalized. Bulk submission must omit empty rows atomically.

Deterministic classification and an explicit teacher override are distinct facts; store the calculated result/version separately from override value, actor, timestamp and reason/context. Alert state needs persistent active/resolved history, while evolution and summary projections must remain reproducible from authoritative observations and versioned deterministic rules. Student soft-deactivation must preserve observations. PDF/Excel reporting permissions follow the same school and active `ClassCourse` assignment boundary. These are proposals only; TASK 06C adds no observation schema, migration or enum.

## Mandatory study

| Table | Essential fields / constraints |
|---|---|
| `study_requirements` | `id`, `school_id`, class course/student, trigger type, relevant average at creation, threshold at creation (initially 55), reason, status, responsible teacher when available, created/completed/cancelled timestamps, completion notes |
| `study_sessions` | `id`, `school_id`, requirement, planned/actual dates, responsible teacher, status, completion notes, created/modified actor and timestamps |
| `study_requirement_status_history` | `id`, `school_id`, requirement, from/to status, actor, timestamp, optional reason |

Requirements must not be represented only by a mutable `requires_study` flag. Completion preserves the requirement and sessions in history. Requirement/session and status changes are auditable. Store the threshold and relevant average used at creation so a later configuration or grade change cannot rewrite why the historical requirement existed. Duplicate-prevention constraints depend on the open lifecycle rules.

## Academic events, reminders, and personal tasks

| Table | Essential fields / constraints |
|---|---|
| `academic_events` | `id`, `school_id`, creator, type, title/details, start/end or due time, shared/personal ownership, related entity reference when applicable, lifecycle timestamps |
| `event_audiences` | `id`, `school_id`, event, audience kind and school-scoped teacher/class/class-course reference |
| `event_reminders` | `id`, `school_id`, event, recipient/owner, scheduled reminder time, default offset (7/3/1 days), delivered/read/dismissed metadata for in-app use |
| `personal_tasks` | `id`, `school_id`, owner teacher, title/details, due/scheduled time, status, completed/postponed/rescheduled timestamps |

Shared-event changes are auditable. Personal reminders and tasks are owner-private; school scoping alone is insufficient authorization. Reminder rows may be materialized or projected later, but the behavior must be deterministic and idempotent. Email, SMS, browser push, and mobile push delivery are not part of the MVP.

`TeacherActionCenter` is not proposed as an authoritative table. Automatic items should be queried/projected from grades, study requirements, homework alerts, progression, and events. Only personal tasks need their own persistent task rows.

## Progression and audit

| Table | Essential fields / constraints |
|---|---|
| `progression_plans` | `id`, `school_id`, course and/or teacher assignment according to open ownership decision, year, import metadata |
| `progression_weeks` | plan, week number, date range, unit, grammar, vocabulary, resources/pages, weekend homework, status, remarks, special-week type, semester |
| `audit_events` | `id`, `school_id`, actor, action, entity type/id, timestamp, safe before/after or structured delta, request context; covers grades, homework, contacts, progression, study workflows, and shared events |

Progression supports an academic year of 37 weeks but calendar/configuration behavior remains explicit rather than hardcoded beyond confirmed requirements.

## Operational rules

- Use database constraints for ranges, enum values, uniqueness, and referential integrity where possible.
- Index `school_id` plus common course, student, date, and status filters.
- Apply RLS to all exposed school-owned tables and test it.
- Prefer soft deactivation for referenced structural records; final deletion/retention policy is open.
- Never store secrets in rows intended for client access.

## Task 09A teacher provisioning foundation

`20260908113000_teacher_provisioning_foundation.sql` is the forward-only teacher-provisioning migration, created and validated locally in Task 09A. It adds the display-name constraint and two `void` RPC functions:

- `admin_provision_teacher_profile(uuid, text)` derives the active ADMIN caller's school, verifies the target Auth identity, rejects self/duplicate provisioning, normalizes the name, and inserts exactly one active TEACHER profile.
- `admin_update_teacher_profile(uuid, text, boolean)` updates only a same-school TEACHER's normalized name and active state while preserving ID, school, and role.

Both functions are postgres-owned, explicitly volatile `SECURITY DEFINER` functions with empty search paths and schema-qualified access. Only `authenticated` receives execute; `PUBLIC` and `anon` do not. No direct `user_profiles` INSERT, UPDATE, or DELETE privilege or new policy is added. The primary key is the final concurrency boundary for duplicate provisioning.

Task 09B applied this migration exactly once to the confirmed Suivora development project on 2026-09-08. Remote inspection confirmed the nullable text column, constraint, approved function bodies/signatures, standard postgres ownership, hardened configuration, two intended authenticated EXECUTE grants, unchanged eight policies and no direct profile mutation grant. The later ClassCourse migration left these functions unchanged.
