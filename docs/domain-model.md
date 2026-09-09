# Domain model

## Confirmed boundaries

`School` is the tenant root. School-owned entities carry `schoolId`. `UserProfile` associates an authenticated identity with a school and the active `ADMIN` or `TEACHER` role. Future student/parent roles are reserved only conceptually.

```mermaid
erDiagram
  SCHOOL ||--o{ SCHOOL_YEAR : owns
  SCHOOL ||--o{ USER_PROFILE : has
  SCHOOL ||--o{ CLASS : owns
  SCHOOL ||--o{ SUBJECT : owns
  SCHOOL ||--o{ STUDENT : owns
  SCHOOL_YEAR ||--o{ TERM : contains
  SCHOOL_YEAR ||--o{ CLASS_COURSE : scopes
  CLASS ||--o{ CLASS_COURSE : participates
  SUBJECT ||--o{ CLASS_COURSE : participates
  CLASS_COURSE ||--o{ TEACHER_ASSIGNMENT : grants
  CLASS_COURSE ||--o{ STUDENT_ENROLLMENT : includes
  CLASS_COURSE ||--o{ QUIZ : shares
  QUIZ ||--o{ GRADE : receives
  CLASS_COURSE ||--o{ HOMEWORK_ASSIGNMENT : assigns
  CLASS_COURSE ||--o{ PROGRESSION_PLAN : plans
  CLASS_COURSE ||--o{ STUDY_REQUIREMENT : requires
  STUDY_REQUIREMENT ||--o{ STUDY_SESSION : schedules
  SCHOOL ||--o{ ACADEMIC_EVENT : owns
  ACADEMIC_EVENT ||--o{ EVENT_AUDIENCE : targets
  ACADEMIC_EVENT ||--o{ EVENT_REMINDER : projects
  USER_PROFILE ||--o{ PERSONAL_TASK : owns
  CLASS_COURSE ||--o{ STUDENT_OBSERVATION : records
  STUDENT ||--o{ STUDENT_OBSERVATION : receives
  USER_PROFILE ||--o{ STUDENT_OBSERVATION : authors
```

## Core aggregates

- **Structure:** school, school year, term, class, subject, student, and user profile.
- **Shared classroom:** `ClassCourse` uniquely represents a class + subject + school year; teacher assignments grant scoped collaboration; enrollment determines participating students.
- **Assessment:** fixed quiz slot, assessment mode, grade, oral-grade record, learning outcome, assessment element, element-outcome link, and student element score.
- **Homework:** assignment, per-student homework state, alert, and contact record.
- **Progression:** plan and weekly entries, with week metadata, content fields, status, and special-week type.
- **Mandatory study:** persistent study requirement, optional responsible teacher, scheduled study sessions, completion evidence, and status history.
- **Calendar:** academic event, explicit event audience, and in-app reminder projections. Shared events and private personal reminders have different authorization semantics.
- **Teacher planning:** persistent owner-private personal tasks and a derived `TeacherActionCenter` projection.
- **Student follow-up:** ClassCourse-scoped observations with normalized criteria/tags, optional comments, deterministic classification, separately stored teacher override, author/time context, evolution and alert projections.
- **Audit:** actor, time, action, entity identity, and sufficient change context.

## Invariants

- A term has a strict non-empty date range wholly contained in its parent school year. Each year has at most one Semester 1 and one Semester 2; when both exist, Semester 1 ends on or before Semester 2 starts.
- Semester identity is the language-independent number 1 or 2. French UI labels are fixed catalog values derived from that number and are not administrator-editable domain data.

- `ClassCourse` membership and teacher authorization are scoped to the same school.
- A `Class` belongs to exactly one school and school year. A `Course` belongs to one school and its stored name/code are not translated.
- A `ClassCourse` joins one class and course, must match the class's school and year, and is unique for that class/course/year. `weekly_periods` is an integer lesson-period count from 1 through 40.
- Classes, courses, and ClassCourses are deactivated rather than hard-deleted in the initial lifecycle.
- The ADMIN UI may display inactive structural history but creates relationships only from active school years, classes, and courses. It does not define the unresolved inactive-parent lifecycle invariant.
- A teacher must have an active assignment to access a class course.
- Quiz slots are C1-C8, tied to their fixed semester, with exactly one quiz slot per class course.
- Grades are in the inclusive 0-100 range.
- Calculated oral suggestions and final teacher grades are different facts.
- Outcome analysis requires detailed element scoring; quick totals provide only general averages.
- A student has one state per homework assignment; history/audit preserves changes.
- Contacts do not overwrite prior contacts and capture the unsubmitted baseline.
- A relevant quiz-success level strictly below the confirmed initial threshold of 55 creates `MANDATORY_STUDY_REQUIRED`; exactly 55 does not. The relevant-average definition remains open.
- Study requirements are persistent records, not booleans. Completed requirements and their sessions/status changes remain in history and are auditable.
- Shared events are visible only to their intended school-scoped audience; personal reminders and tasks are private to their owner.
- Default in-app event reminders are projected at 7, 3, and 1 day before the event. Past events leave the upcoming projection but remain historical records.
- Automatic action-center items are derived from authoritative source records and disappear when their source condition resolves; personal tasks persist and support completion, postponement, and rescheduling.
- `TeacherActionCenter` is a read/application projection, never an authoritative aggregate for its inputs.
- Multiple observations may exist for one student on one day; optional daily entry is never represented by empty records. Observation history is auditable and student archival preserves it.

## Language-independent enums

`ADMIN`, `TEACHER`; `QUICK_TOTAL`, `OUTCOME_DETAILED`; `C1`…`C8`; `PROGRESSION`, `DECLINE`, `STABLE`; `EXCELLENT`, `GOOD`, `AVERAGE`, `NEEDS_REINFORCEMENT`; `SUBMITTED_ON_TIME`, `SUBMITTED_LATE`, `NOT_SUBMITTED`; `UP_TO_DATE`, `TO_MONITOR`, `VIGILANCE`; `MANDATORY_STUDY_REQUIRED`; `TO_SCHEDULE`, `SCHEDULED`, `COMPLETED`, `CANCELLED`; `EXAM`, `QUIZ`, `MEETING`, `HOMEWORK`, `PROJECT`, `SCHOOL_EVENT`, `PERSONAL_REMINDER`; `URGENT`, `TODAY`, `THIS_WEEK`, `UPCOMING`; `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`.

French labels are presentation data, not stored domain meaning.

## Implemented calendar operations

Task 08C exposes create and edit workflows for school years and their Semester 1/2 children. It does not define deletion, archival, or automatic activation behavior; those remain outside this task.

## Teacher identity lifecycle

Teacher accounts are invitation-only. Supabase Auth owns the email address and future password-establishment flow; `user_profiles` does not duplicate email. Every TEACHER profile belongs to exactly one school, has the immutable `TEACHER` role within the administrative provisioning boundary, and requires a normalized display name of 1–120 characters.

An administrator may rename, deactivate, or reactivate a same-school teacher. Deactivation preserves the profile and future historical academic references; hard deletion is unavailable. The pre-existing ADMIN may retain a null display name because it predates this contract. A TEACHER role alone never grants class access: a later active `ClassCourse` assignment remains mandatory.

Task 09C keeps Auth and profile responsibility separate: Auth owns invitation, email, session, and password; `user_profiles` owns display name, school, fixed TEACHER role, and active application access. An inactive profile may retain a valid Auth session but cannot resolve application context.
