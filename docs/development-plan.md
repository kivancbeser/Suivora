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
10. Class, course, and ClassCourse management
11. Teacher assignments
12. Student management
13. Student enrollment
14. ClassCourse
15. Teacher assignments
16. Teacher “Mes classes”
17. Shared class detail
18. Quiz model
19. Bulk grade entry
20. Grading calculation engine
21. Suggested and final oral grades
22. Student progress foundation
23. Learning outcomes
24. Detailed outcome scoring
25. Outcome analysis
26. Lesson progression planning
27. Excel progression import
28. Homework assignments
29. Homework student statuses
30. Homework alert engine
31. Parent/administration contact history
32. Mandatory study domain rules
33. Mandatory study scheduling and history
34. Academic events
35. In-app reminder projection
36. Personal teacher tasks
37. Teacher action-center aggregation
38. “À faire aujourd’hui” UI
39. Teacher dashboard
40. Administrator dashboard
41. PDF and Excel exports
42. Responsive and accessibility polish
43. E2E shared-classroom scenarios
44. Action-center authorization and E2E tests
45. Security review
46. Pilot preparation
47. Observation domain and schema
48. Observation RLS and audit rules
49. Flash class-entry screen
50. Detailed observation panel
51. Student observation history
52. Evolution calculation engine
53. Deterministic observation alerts
54. Rule-based observation summaries
55. Class observation dashboard indicators
56. PDF/Excel observation reporting
57. Optional AI observation summaries — only after MVP validation

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

**TASK 10D — Controlled Remote Class, Course and ClassCourse Runtime Verification** is next. It may exercise controlled development records only under its own explicit authorization and cleanup plan. Teacher access remains deferred until assignments exist.
