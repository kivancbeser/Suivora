# Learning outcomes

## Confirmed purpose

Suivora must identify student strengths, outcomes needing reinforcement, and class-level outcome performance. A total quiz grade alone is insufficient evidence for that analysis.

## Assessment modes

### `QUICK_TOTAL`

The teacher enters only the total out of 100. General quiz, semester, and annual averages are available. Detailed learning-outcome analysis is explicitly unavailable; the UI and exports must communicate that absence without fabricating results.

### `OUTCOME_DETAILED`

A quiz contains ordered questions or scored assessment elements. Each has a maximum score and can link to one or more learning outcomes using explicit percentage weights. Student element scores provide the evidence for a dynamic outcome calculation.

## Proposed data flow

```text
Quiz → assessment elements → outcome links
                       ↘ student element scores → outcome aggregation
```

The element maxima must total exactly 100 and each element's active outcome weights must total exactly 100%. For a student, every element must be scored and the sum must equal the independently recorded final quiz score. Incomplete or inconsistent detailed evidence produces no outcome result. Numeric zero remains evidence; a missing score does not.

Outcome identity belongs to a Course. Each published description is an immutable revision, and a ClassCourse opts into an exact revision so historical assessments never change retroactively. ADMIN manages the catalog and revisions; an assigned TEACHER may configure detailed evidence only in an active assigned ClassCourse.

The outcome percentage is `sum(student element score × allocation weight) / sum(element maximum × allocation weight) × 100`. One eligible finalized quiz may show a percentage with an insufficient-data label but no band. Two or more eligible quizzes use the existing unrounded performance thresholds. Aggregates are derived, not stored.

## Guardrails

- Never distribute a quick total across outcomes.
- Never silently split an element's points among multiple outcomes.
- Keep outcome identity stable and descriptions localizable/presentable.
- Preserve the assessment structure used for historical analysis if outcomes later change.
- Only active, finalized `OUTCOME_DETAILED` quizzes can contribute new evidence.
- Inactive outcomes accept no new links but remain readable in authorized historical calculations.
- QUICK_TOTAL results are never converted or inferred.
- Lesson progression planning and Excel interchange remain a separate future module.
