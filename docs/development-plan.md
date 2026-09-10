# Development plan

## Dependency-aware build order

1. Product and technical foundation — completed in Task 00
2. Repository bootstrap — completed in Task 01
3. Localization foundation — completed in Task 02
4. Supabase project configuration — completed in Task 03
   - Read-only connection verification — completed in Task 03B
5. Database foundation
   - Local migration foundation — completed in Task 04A
   - Reviewed remote application — completed in Task 04B
6. Authentication — completed in Task 05
7. Authorization and RLS
   - Local authorization foundation — completed in Task 06A
   - Reviewed remote authorization foundation — completed in Task 06B
   - Controlled first-administrator provisioning and functional remote RLS verification — completed in Task 06C
   - Authenticated role-aware application shell — completed in Task 07
8. School year and semester structure — local and remote calendar foundation completed
   - Calendar integrity and fixed localized semester-label decision — completed locally in Task 08A
   - Reviewed remote calendar migration — completed in Task 08B
   - ADMIN school-year/semester module — completed in Task 08C
   - Controlled remote school-year runtime verification — completed in Task 08D
9. Teacher management
   - Local provisioning and lifecycle foundation — completed in Task 09A
   - Reviewed remote provisioning migration — completed in Task 09B
   - Server-only invitation infrastructure and ADMIN UI — completed locally in Task 09C
   - Complete Turkish localization and global FR/TR switcher — completed locally in Task 09C2
   - Dedicated GitHub/Vercel development deployment and Auth URL configuration — completed in Task 09D-PRE
   - Controlled remote invitation and activation verification — deferred until separately requested; no invitation was sent during the ClassCourse foundation
   - Temporary ADMIN-only confirmed test-account creation — implemented for development; removal and SMTP-backed invitation restoration required before pilot use
   - Temporary public single-school TEACHER self-signup — implemented and synchronized with Suivora development; removal is required before multi-school or pilot use
10. Class, course, and ClassCourse management
11. Teacher assignments — completed locally and remotely
12. Student management
13. Student identity and historical enrollment database foundation — implemented, remotely verified, and empty
14. Transactional ADMIN student workflows and bilingual management UI — completed locally and remotely; remote tables remain empty
15. ClassCourse — foundation and ADMIN management completed
16. Teacher assignments — database/RLS/RPC foundation, reviewed remote application, and bilingual ADMIN UI complete; remote table remains empty
17. Teacher “Mes classes” — bilingual read-only assignment list and roster detail complete
18. Shared class detail
19. Quiz model
20. Bulk grade entry
21. Grading calculation engine
22. Suggested and final oral grades
23. Student progress foundation
24. Learning outcomes
25. Detailed outcome scoring
26. Outcome analysis
27. Lesson progression planning
28. Excel progression import
29. Homework assignments
30. Homework student statuses
31. Homework alert engine
32. Parent/administration contact history
33. Mandatory study domain rules
34. Mandatory study scheduling and history
35. Academic events
36. In-app reminder projection
37. Personal teacher tasks
38. Teacher action-center aggregation
39. “À faire aujourd’hui” UI
40. Teacher dashboard
41. Administrator dashboard
42. PDF and Excel exports
43. Responsive and accessibility polish
44. E2E shared-classroom scenarios
45. Action-center authorization and E2E tests
46. Security review
47. Pilot preparation
48. Observation domain and schema
49. Observation RLS and audit rules
50. Flash class-entry screen
51. Detailed observation panel
52. Student observation history
53. Evolution calculation engine
54. Deterministic observation alerts
55. Rule-based observation summaries
56. Class observation dashboard indicators
57. PDF/Excel observation reporting
58. Optional AI observation summaries — only after MVP validation

Order changes require documenting dependencies and security consequences. Cross-cutting testing, accessibility, localization, auditability, and documentation are continuous rather than postponed to their named hardening steps.

The dependency chain for the new capabilities is explicit:

1. Complete authentication, authorization, and teacher assignments.
2. Complete classes, students, quizzes, and grades.
3. Establish homework and progression source data.
4. Add the mandatory-study rule and its persistent workflow.
5. Add academic events and in-app reminders.
6. Build “À faire aujourd’hui” only after its source modules exist.

The action center must never be populated with fake dashboard data. Milestone A is unchanged and is not delayed by these later capabilities.

The observation sequence starts only after authentication/authorization, school structure, teachers, classes/courses, students/enrollment, `ClassCourse`, teacher assignments, and Shared Classroom Core. Its domain/schema, RLS/audit, entry, history, calculations, alerts, summaries, indicators and reporting are separate tasks. Optional AI summaries follow validation of deterministic summaries and do not delay Shared Classroom Core.

## Milestone A — Shared Classroom Core

Deliver through the shared grade workflow: an administrator creates two teachers, one class, one subject, students, and a shared class course; Teacher A creates a quiz and enters grades; Teacher B sees and may modify those grades; calculations update and audit metadata is preserved.

Milestone A excludes outcomes, progression, homework alerts, mandatory study, academic events/reminders, personal tasks, the action center, and exports.

## Task completion expectations

Each implementation task should state scope, decisions used, data/security effects, migration impact, localization work, tests, validation commands/results, and documentation changes. It must leave unrelated changes untouched and must not commit or push unless requested.

## Next task

The assignment migration is synchronized locally and on Suivora development, and the bilingual ADMIN assignment and TEACHER “Mes classes” interfaces are complete without creating any teacher, assignment, or student. The next step is Shared Class Detail, then the quiz model.
