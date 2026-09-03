# Lesson progression planning

## Confirmed capability

Progression is organized by school week and a teacher/class assignment context. The reference workbook covers an academic year of 37 weeks. Each weekly entry supports:

- week number and date range;
- unit, grammar, vocabulary;
- Édito textbook pages/resources;
- weekend homework;
- `NOT_STARTED`, `IN_PROGRESS`, or `COMPLETED`;
- teacher remarks;
- a special week type such as exam or holiday;
- semester grouping.

The application must support importing the existing Excel format, editing imported data, current/next-week views, progress by teacher/class and unit, delayed-unit alerts, exam weeks, holiday weeks, and Excel interchange.

## Source of truth

Excel is an initial import/export format. After a successful import, the database is authoritative. Runtime behavior must not depend on the original workbook.

## Proposed import stages

1. Upload and parse without mutating authoritative data.
2. Validate workbook structure, dates, week numbers, enums, and target ownership.
3. Present actionable errors and an import preview.
4. Confirm and apply atomically or with explicit row-level results.
5. Store import provenance and audit subsequent edits.

Exact workbook mapping, duplicate/re-import handling, and export fidelity remain open.

## Open ownership decisions

- Does one teacher worksheet represent exactly one class?
- For shared teachers, is there one shared progression plan or a separate teacher-specific plan?

These answers determine uniqueness, permissions, progress rollups, and import matching. Do not encode either assumption before resolution.

## Other rules requiring definition

“Current week,” delayed-unit criteria, progress percentages, semester/week mapping, holiday behavior, and how special weeks affect expected progress are not yet specified.
