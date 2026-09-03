# Authorization model

## Confirmed rules

Authentication answers who the user is; authorization answers which school records and actions they may access. Client-side hiding is never authorization.

The current Supabase connection foundation implements neither authentication nor authorization. A valid project URL and publishable key identify the application only; no session validation, profile/role check, assignment check, or RLS policy exists yet.

- Every school-owned record is constrained to the authenticated profile's `schoolId`.
- Cross-school reads and writes must fail.
- `ADMIN` may manage school structures, teachers, and assignments within their school.
- `TEACHER` access is derived from an active assignment to the target `ClassCourse`.
- Assigned teachers share authorized course records and may perform the teacher actions defined by product rules.
- Sensitive mutations are re-authorized on the server; RLS provides database-level defense.
- Student/parent roles have no active permissions in the MVP.
- Assigned teachers may view study requirements only for students/class courses covered by their active assignments. Who may complete them remains open.
- Shared academic events are limited to their intended school-scoped audiences. Administrators/coordinators may create shared events; teachers may create owner-private personal events/reminders.
- Personal reminders and tasks are visible only to their owner unless a later explicit sharing rule is adopted.
- Action-center projections apply all source-module permissions and must never reveal another teacher's private reminder, an unassigned class/student, or another school's information.

## Proposed enforcement path

1. Supabase Auth establishes identity in a future authentication task.
2. Server code loads the active school profile and role.
3. Validated commands resolve their target entity and `schoolId`.
4. Role and, for teachers, active `ClassCourse` assignment are checked.
5. RLS independently restricts the database operation.
6. Sensitive successful mutations write audit metadata/event data.

Never accept a client-provided `schoolId`, role, or teacher identity as authority. Derive them from the session and database relationships.

## Capability summary

| Capability | ADMIN | Assigned TEACHER | Unassigned TEACHER |
|---|---:|---:|---:|
| Manage school structures/teachers | Yes | No | No |
| Assign teachers | Yes | No | No |
| Add a student to authorized class | Yes | Yes | No |
| Read shared academic course data | Yes | Yes | No |
| Create/update quizzes and grades | Product-authorized | Yes | No |
| Manage homework/contact data | Product-authorized | Yes | No |
| Manage progression | Product-authorized | Yes, ownership decision pending | No |
| View assigned mandatory-study records | Product-authorized | Yes | No |
| Change mandatory-study status | Product-authorized, rule pending | Rule pending | No |
| Create shared academic event | Yes (administrator/coordinator) | No unless later authorized | No |
| Create/read personal reminder or task | Own records only if applicable | Own records only | Own records only |
| View “À faire aujourd’hui” | If a future admin projection exists | Own authorized projection | Own projection without course data |

The administrator's direct academic-edit permissions are not fully specified; implementation must resolve this rather than infer it.

## RLS policy design requirements

- Explicit select/insert/update/delete policies per table; no broad authenticated-user policy.
- Tenant predicate on every policy and assignment predicate for teacher access.
- `WITH CHECK` protects inserts and updates, not only row visibility.
- Join tables cannot be used to manufacture access; assignment management is admin-only.
- Service-role credentials remain server-only and bypasses are narrowly contained.
- Tests cover same-school authorized access, same-school unauthorized access, cross-school denial, inactive assignments, and crafted identifiers.
- Audience joins for shared events cannot expand beyond the event's school, and owner predicates protect personal reminders/tasks.
- Each action-center source query independently enforces its underlying assignment, audience, and owner rules; aggregation never grants access.

## Revocation and history

Deactivating an assignment removes future teacher access without erasing audit attribution. Historical data keeps immutable actor identifiers even if a profile is later deactivated. Exact session invalidation timing is an open security decision.
