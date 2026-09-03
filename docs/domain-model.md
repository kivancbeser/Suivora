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
- **Audit:** actor, time, action, entity identity, and sufficient change context.

## Invariants

- `ClassCourse` membership and teacher authorization are scoped to the same school.
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

## Language-independent enums

`ADMIN`, `TEACHER`; `QUICK_TOTAL`, `OUTCOME_DETAILED`; `C1`…`C8`; `PROGRESSION`, `DECLINE`, `STABLE`; `EXCELLENT`, `GOOD`, `AVERAGE`, `NEEDS_REINFORCEMENT`; `SUBMITTED_ON_TIME`, `SUBMITTED_LATE`, `NOT_SUBMITTED`; `UP_TO_DATE`, `TO_MONITOR`, `VIGILANCE`; `MANDATORY_STUDY_REQUIRED`; `TO_SCHEDULE`, `SCHEDULED`, `COMPLETED`, `CANCELLED`; `EXAM`, `QUIZ`, `MEETING`, `HOMEWORK`, `PROJECT`, `SCHOOL_EVENT`, `PERSONAL_REMINDER`; `URGENT`, `TODAY`, `THIS_WEEK`, `UPCOMING`; `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`.

French labels are presentation data, not stored domain meaning.
