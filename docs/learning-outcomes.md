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

## Application workflow (TASK 15C2)

The existing protected RPC contract is exposed through request-scoped Server Actions. The quiz list can create either `QUICK_TOTAL` or `OUTCOME_DETAILED` records, filters slots to the selected semester, and excludes occupied slots. Detailed quizzes use `/{locale}/app/quiz-et-notes/{classCourseId}/{quizId}` for structure, links, scores, validation, and finalization. Progression and outcome lifecycle controls remain under `/{locale}/app/progression` and its ClassCourse detail route.

| Protected operation | Role and scope | Application surface | Lifecycle/error behavior |
| --- | --- | --- | --- |
| `create_learning_outcome` / `publish_learning_outcome_revision` / `set_learning_outcome_active` | Same-school active ADMIN | Outcome catalog | Immutable historical revisions; no deletion; localized safe errors |
| `assign_outcome_revision` | Same-school active ADMIN | Course-compatible ClassCourse assignment | Database rejects cross-course, cross-school, inactive, or invalid revision use |
| `create_quiz` + `configure_detailed_quiz` | ADMIN or actively assigned TEACHER, as granted by the migration | Quiz creation | Only term-valid, available C1–C8 slots; existing quick quizzes are not converted in the UI |
| `upsert_assessment_element` | ADMIN or actively assigned TEACHER | Detailed quiz editor | Draft quizzes only; stable explicit position and 0.01-point precision |
| `set_element_outcome_link` | ADMIN or actively assigned TEACHER | Element allocation editor | Draft quizzes only; positive weights up to 100; duplicate selection is excluded by the UI and protected upsert semantics remain authoritative |
| `save_student_element_scores` / `save_quiz_scores` | ADMIN or actively assigned TEACHER | Per-student detailed score form | Enrolled students only; zero is evidence; blank input leaves existing data unchanged |
| `configure_detailed_quiz(..., true)` | ADMIN or actively assigned TEACHER | Explicit confirmed finalization | Requires valid 100-point structure, 100% links, complete element scores, and matching final totals; finalized records render read-only |
| `learning_outcome_progression` | Authorized ADMIN or assigned TEACHER | Progression detail | Database-derived only; no client-side authoritative calculation |

Authorization is independently revalidated for every page and action. The browser never supplies school, role, ownership, or assignment scope. Teachers receive access only through an active assignment; hiding a control is never treated as authorization.

Current contract limitations are explicit: there is no score-clear RPC, element-delete RPC, unfinalize operation, or post-finalization correction/versioning workflow. Blank score fields therefore do not delete existing evidence, and the UI offers no unsupported destructive controls. These remain future contract decisions.

The controlled TASK 15D runtime plan must use Semester 2 slots C5 and C6 because C1–C4 are occupied. One eligible finalized detailed quiz yields a percentage with `INSUFFICIENT_DATA` and no band; two eligible finalized detailed quizzes can yield a performance band with contributing quiz and element counts.
