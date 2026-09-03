# Database schema proposal

The Supabase client and environment foundation exists, but no remote project connection, table, SQL, migration, or generated database type exists yet. Everything below remains a logical proposal for future migrations. Exact column types, constraints, deletion policy, and audit representation must be finalized in database tasks.

## Tenant and identity

| Table | Essential fields / constraints |
|---|---|
| `schools` | `id`, name, timestamps |
| `user_profiles` | `id` (auth identity), `school_id`, role, active, timestamps |
| `teacher_profiles` | `id`, `school_id`, `user_profile_id`, display fields, active |
| `school_years` | `id`, `school_id`, label, start/end dates, active |
| `terms` | `id`, `school_id`, `school_year_id`, semester number, dates; unique year + semester |

## Academic structure

| Table | Essential fields / constraints |
|---|---|
| `classes` | `id`, `school_id`, name, active |
| `subjects` | `id`, `school_id`, name/code, active |
| `students` | `id`, `school_id`, school identifier/display fields, active |
| `class_courses` | `id`, `school_id`, `school_year_id`, `class_id`, `subject_id`; unique combination |
| `teacher_assignments` | `id`, `school_id`, `class_course_id`, `teacher_id`, active/from/to; prevent duplicate active assignment |
| `student_enrollments` | `id`, `school_id`, `class_course_id`, `student_id`, active/from/to; uniqueness rules to finalize |

Every foreign-key path must remain within one `school_id`, enforced through composite constraints, triggers, or an equally reliable design in addition to application validation.

## Assessment

| Table | Essential fields / constraints |
|---|---|
| `quizzes` | `id`, `school_id`, `class_course_id`, slot C1-C8, mode, max score fixed at 100, metadata; unique course + slot |
| `grades` | `id`, `school_id`, `quiz_id`, `student_id`, total score, audit timestamps/actor; unique quiz + student |
| `oral_grades` | `id`, `school_id`, course/student/term, calculated suggestion, final teacher grade, calculation version/time, decision actor/time |
| `learning_outcomes` | `id`, `school_id`, optional subject/year scope, stable code, description |
| `assessment_elements` | `id`, `school_id`, `quiz_id`, order/title, maximum points |
| `element_outcomes` | element/outcome link plus future allocation metadata after decision |
| `student_element_scores` | `id`, `school_id`, element/student, score, audit metadata |

## Homework and contact

| Table | Essential fields / constraints |
|---|---|
| `homework_assignments` | `id`, `school_id`, `class_course_id`, title/details, assigned/due dates, creator |
| `homework_student_states` | assignment/student, state, submission date, delay days, modified by/at |
| `homework_alerts` | `id`, `school_id`, course/student, threshold baseline/current count, created/resolved metadata, status |
| `contact_records` | `id`, `school_id`, course/student/alert, contact date/type, optional note, recorder, `unsubmitted_count_at_contact`, created timestamp |

Contact records are append-only. Resolution and contact creation should be atomic.

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
