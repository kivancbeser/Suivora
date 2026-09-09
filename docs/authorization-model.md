# Authorization model

## Confirmed rules

Authentication answers who the user is; authorization answers which school records and actions they may access. Client-side hiding is never authorization.

The application authenticates email/password sessions and serves a role-aware shell at `/fr/app`. Its server-only resolver validates identity with `getUser()`, selects only the caller's active profile through RLS, validates the runtime role, then selects that profile's school through RLS. It never uses browser state, `getSession()`, JWT metadata or a service-role client as an authorization boundary. Missing/inactive profiles and missing/inaccessible schools receive the same safe access-unavailable surface and no application data.

The typed shell navigation matrix is:

- `ADMIN`: Accueil, Années scolaires, Enseignants, Classes, Élèves, Matières, Paramètres.
- `TEACHER`: Aujourd’hui, Mes classes, Élèves, Quiz et notes, Devoirs, Progression, Suivi des élèves, Rapports.

The shared `/fr/app/[module]` placeholder validates that its slug exists and that the server-resolved role owns that navigation destination. A TEACHER manually entering an ADMIN-only placeholder receives a 404. Future real modules must add their own server authorization and, for teachers, active `ClassCourse` assignment checks; this shell grants none of those permissions.

Three `SECURITY DEFINER` helpers avoid recursive `user_profiles` RLS evaluation: `current_school_id()` returns only the active caller's school, `current_app_role()` returns only the active caller's application role, and `is_school_admin(uuid)` answers whether the active caller is an administrator for exactly the supplied school. They use an empty `search_path`, schema-qualified objects, and execution grants only for `authenticated`; `PUBLIC` and `anon` cannot execute them. JWT metadata is not consulted.

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
- Observation access derives from an active assignment to the observation's `ClassCourse`; school membership alone is insufficient for teachers. Bulk roster/entry, history, alerts, summaries and exports must apply the same source-level assignment boundary. Author attribution and override audit metadata cannot be caller-forged.

## Proposed enforcement path

1. Supabase Auth establishes identity through the implemented server-side sign-in and session boundary.
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

## Implemented policy matrix

Task 08A added only database-integrity triggers, and Task 08B verified the same boundary remotely after applying the migration once. Their `VOLATILE SECURITY DEFINER` functions use an empty `search_path`, have no `PUBLIC`, `anon`, or `authenticated` execution privilege, and are reachable only as triggers on already RLS-protected writes. They add no policy, grant, role capability, or authorization bypass; the remote project retains exactly the original eight policies.

Task 08C restricts the calendar route, reads, and every mutation to active `ADMIN` profiles. Each Server Action resolves fresh request context, ignores client-supplied tenant identity, and scopes identifiers to the trusted school. Missing and foreign-school records share the same safe not-found response so tenant existence is not disclosed; RLS remains independently active.

Task 09A adds no profile mutation policy or table grant. `admin_provision_teacher_profile(uuid,text)` and `admin_update_teacher_profile(uuid,text,boolean)` are the only administrative profile-mutation boundary: both independently resolve `auth.uid()`, require an active ADMIN, derive the caller's school, and never accept school or role. Provisioning always creates an active `TEACHER`; updates match only a same-school `TEACHER` and can change only display name and active state. Missing, duplicate, ADMIN-target, and cross-school cases return stable non-sensitive database failures.

Task 09B verified this boundary remotely without invoking either function. `authenticated` has the two intended EXECUTE grants; `PUBLIC` and `anon` have none. Supabase's standard owner/platform service-role privileges remain platform administration capabilities and are not application grants. The application still has no service-role client.

Task 09C adds a privileged client only for invitation and exact newly-created-user compensation. It never performs profile/database writes. Teacher listing and both profile RPC calls use the authenticated request-scoped client; every action rechecks active ADMIN context. `/fr/activation` requires an authenticated active TEACHER and rejects ADMIN use.

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `schools` | Active users: own school | Denied | Denied | Denied |
| `user_profiles` | Own active profile; own-school admins: school profiles | Denied | Denied | Denied |
| `school_years` | Active users: own school | Own-school admin | Own-school admin, with matching `WITH CHECK` | Denied |
| `terms` | Active users: own school | Own-school admin | Own-school admin, with matching `WITH CHECK` | Denied |
| `classes` | Own-school active ADMIN | Own-school active ADMIN | Own-school active ADMIN, with matching `WITH CHECK` | Denied |
| `courses` | Own-school active ADMIN | Own-school active ADMIN | Own-school active ADMIN, with matching `WITH CHECK` | Denied |
| `class_courses` | Own-school active ADMIN | Own-school active ADMIN | Own-school active ADMIN, with matching `WITH CHECK` | Denied |

PostgreSQL grants permit an operation to reach RLS; policies then decide which rows are visible or writable. `anon` has no application-table privileges. `authenticated` has required SELECT grants plus narrowly column-scoped structural mutations and no DELETE, school mutation, or direct profile mutation privilege. RLS remains mandatory even where a grant exists.

For the three classroom-structure tables, active TEACHER, inactive/missing profile, anonymous, and other-school actors receive no rows or writes. Teacher access is deliberately deferred until active `ClassCourse` assignments can be checked at the database boundary.

The Task 10C routes recheck ADMIN access server-side even though the application shell hides ADMIN navigation from teachers. IDs are opaque form references only; tenant, role, year ownership, and initial active state are never accepted from the client.

## Revocation and history

Deactivating an assignment removes future teacher access without erasing audit attribution. Historical data keeps immutable actor identifiers even if a profile is later deactivated. Exact session invalidation timing is an open security decision.
