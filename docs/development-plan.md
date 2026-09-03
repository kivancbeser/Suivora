# Development plan

## Dependency-aware build order

1. Product and technical foundation — completed in Task 00
2. Repository bootstrap — completed in Task 01
3. Localization foundation — completed in Task 02
4. Supabase project configuration — completed in Task 03
5. Database foundation
6. Authentication
7. Authorization and RLS
8. School year and semester structure
9. Teacher management
10. Class management
11. Subject management
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

Order changes require documenting dependencies and security consequences. Cross-cutting testing, accessibility, localization, auditability, and documentation are continuous rather than postponed to their named hardening steps.

The dependency chain for the new capabilities is explicit:

1. Complete authentication, authorization, and teacher assignments.
2. Complete classes, students, quizzes, and grades.
3. Establish homework and progression source data.
4. Add the mandatory-study rule and its persistent workflow.
5. Add academic events and in-app reminders.
6. Build “À faire aujourd’hui” only after its source modules exist.

The action center must never be populated with fake dashboard data. Milestone A is unchanged and is not delayed by these later capabilities.

## Milestone A — Shared Classroom Core

Deliver through the shared grade workflow: an administrator creates two teachers, one class, one subject, students, and a shared class course; Teacher A creates a quiz and enters grades; Teacher B sees and may modify those grades; calculations update and audit metadata is preserved.

Milestone A excludes outcomes, progression, homework alerts, mandatory study, academic events/reminders, personal tasks, the action center, and exports.

## Task completion expectations

Each implementation task should state scope, decisions used, data/security effects, migration impact, localization work, tests, validation commands/results, and documentation changes. It must leave unrelated changes untouched and must not commit or push unless requested.

## Next task

**TASK 04 — Database Foundation** should introduce the first reviewable PostgreSQL migrations, generated types, and tested tenant/RLS foundations without implementing authentication UI or business features prematurely.
