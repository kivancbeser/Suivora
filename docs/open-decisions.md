# Open decisions

- **Temporary teacher onboarding exit:** Development currently permits ADMIN-created confirmed test accounts with transient temporary passwords because custom SMTP is unavailable. Before pilot use, configure SMTP, validate the token-hash invitation template, remove the test-account form, and require teacher-owned password establishment.

This is the canonical unresolved-question list. No item below authorizes an implementation assumption. When resolved, record the decision (and rationale where material), update affected documents, and note it in the changelog.

## Grading

1. How are absent, exempt, withdrawn, or otherwise missing C1-C8 grades represented, and when are semester/annual averages available?
2. Are scores and final oral grades decimals? What precision is stored, displayed, and used for evolution/band comparisons?
3. Do performance bands use raw or rounded averages, and do stated integer ranges mean 84.999 is `GOOD` or `EXCELLENT`?
4. When quiz grades change, is the calculated oral suggestion versioned/recomputed, and how is the original suggestion at teacher decision time preserved?

## Learning outcomes

5. When one element links to multiple outcomes, are points duplicated, split equally, or explicitly weighted?
6. Is a detailed quiz total derived from elements or independently entered, and how are discrepancies handled?
7. What aggregation, minimum-evidence, weighting, strength, reinforcement, and class-rollup rules apply?
8. How are outcome revisions/versioning handled for historical assessments?

## Homework and contacts

9. What thresholds map homework summaries to `UP_TO_DATE`, `TO_MONITOR`, and `VIGILANCE`?
10. Is the first alert baseline formally zero, and can only one active alert exist per student/class course?
11. How do corrections, deletions, enrollment changes, or assignment withdrawal affect cumulative unsubmitted counts and resolved baselines?
12. How is delay in days calculated across due times, weekends, holidays, and timezone boundaries?
13. What contact types are allowed, who may view notes, and how are mistakes amended without overwriting history?

## Progression and Excel

14. Does one worksheet represent exactly one class?
15. Do shared teachers use one shared progression plan or separate teacher-specific plans?
16. What is the authoritative workbook template/mapping, and how do re-imports, duplicates, partial errors, and exports behave?
17. How are current week, semester grouping, expected progress, unit completion, delayed units, exam weeks, and holiday weeks calculated?

## Roles, records, and lifecycle

18. May administrators directly edit all academic records, or only configure/manage access and view reports?
19. Can a teacher add an entirely new student identity or only enroll an existing student in an authorized class, and what duplicate matching applies?
20. What are later archival/deletion policies for classes, class courses, quizzes, and assignments? Initial teacher assignments and student identities use `is_active`; assignments, students, and enrollments are not hard-deleted.
21. What audit representation, immutability, retention, access, redaction, and correction policies are required?
22. When an assignment or user is deactivated, how quickly must existing sessions lose access?
23. Beyond Task 09C's bounded exact-new-user compensation and manual runbook, should a later persistent reconciliation queue support operator-approved profile retry?
24. How are already-existing Auth emails, expired invitations, resend limits, and email-address changes handled without leaking account existence or duplicating profiles?

## Exports and operations

25. Which PDF/Excel reports and exact fields/layouts are required, who may export them, and are watermarks/audit events needed?
26. What upload retention and malware/content validation apply to Excel files?
27. What backup, recovery, data residency, retention, and pilot support requirements apply?
## Mandatory study

28. Does the confirmed initial 55% threshold use the latest quiz, the current semester average, or the annual C1-C8 average?
29. Does completing a study session close the requirement immediately?
30. Must the student also later achieve a score of at least 55% before the requirement is fully resolved?
31. Who may mark a study session completed: any assigned teacher, the responsible teacher, or an administrator?
32. May an administrator configure the initially confirmed 55% threshold later, or is it permanently fixed?
33. Which class-course/student/time boundary defines one unresolved condition for duplicate prevention, and how do later grade corrections affect it?

## Academic events and action center

34. Does “coordinator” become a distinct role, an administrator capability, or a scoped permission for creating shared events?
35. What exact audience types and explicit-sharing lifecycle apply to shared events, and may teachers ever create them?
36. Which timezone, all-day behavior, recurrence rules, and event edits govern the 7/3/1-day reminder projection?
37. Are reminder rows materialized or derived, and what read/dismissal behavior is required for in-app reminders?
38. What statuses and postponement/rescheduling history apply to personal tasks?
39. What deterministic criteria and tie-breakers assign `URGENT`, `TODAY`, `THIS_WEEK`, and `UPCOMING` to every automatic and personal action?
40. For each automatic source, what exact condition makes an item appear or disappear, especially declining performance and incomplete grade entry when grades may be missing?

## Student observations

41. What are the exact ordered meanings and stable identifiers for each proposed five-level criterion?
42. Which normalized criterion combinations determine positive, neutral or negative classification, and how are rule versions preserved historically?
43. Which teacher-override values and reasons are allowed, and may an override later be amended without overwriting its audit history?
44. What deterministic thresholds, periods, minimum evidence and resolution rules create observation alerts and per-criterion evolution?
45. Which editable summary templates, editing history and approval semantics apply to student and class summaries?
46. What exact fields, layouts, periods and authorization/audit rules apply to observation PDF and Excel reports?
47. How do student enrollment changes, archival and ClassCourse closure affect future access to historical observations?

## ClassCourse lifecycle

48. May an inactive class or course coexist with active ClassCourses, and should deactivation cascade logically or be blocked?
49. What future effective-date model and historical-read rules should extend the initial active/inactive teacher assignment lifecycle?

Task 10C intentionally leaves both lifecycle questions unresolved; its UI neither mutates active state nor claims a cascade/blocking rule.

The initial assignment rule is closed for current access: active teacher profile + active assignment + active ClassCourse/class/course is required, and a ClassCourse cannot be deactivated while active assignments exist. Effective-dated historical access and durable audit representation remain open.

## Closed student-enrollment decision

Can a student change class? **Yes. A class change closes the existing enrollment and creates a new non-overlapping historical enrollment.** Dates are inclusive, and history is preserved.

Student deactivation while an enrollment remains open is currently rejected rather than cascaded. Enrollment closure leaves the student active. A future change to this lifecycle requires an explicit product decision.
