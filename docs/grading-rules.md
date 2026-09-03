# Grading rules

## Confirmed quiz structure

Semester 1 contains exactly C1, C2, C3, and C4. Semester 2 contains exactly C5, C6, C7, and C8. Each quiz is graded out of 100.

For complete inputs:

```text
semester1Average = (C1 + C2 + C3 + C4) / 4
semester2Average = (C5 + C6 + C7 + C8) / 4
annualQuizAverage = (C1 + C2 + C3 + C4 + C5 + C6 + C7 + C8) / 8
```

Example: C1-C4 = 60, 70, 80, 90 gives a Semester 1 average and suggested oral grade of 75. C5-C8 = 70, 80, 90, 100 gives Semester 2 = 85 and annual quiz average = 80.

## Oral grades

The calculated semester average is the suggested oral grade. A teacher may enter a different final oral grade. Store at least:

- the calculated suggestion and calculation context/version;
- the final teacher-entered value, separately;
- the deciding teacher and timestamp.

Never overwrite or reinterpret the calculated suggestion as the final decision. Recalculation/versioning behavior after quiz edits is open.

## Evolution

Let `difference = semester2Average - semester1Average`.

- `difference > 3` → `PROGRESSION`
- `difference < -3` → `DECLINE`
- otherwise → `STABLE`

Thus +3 and -3 are `STABLE`; +3.01 is `PROGRESSION`; -3.01 is `DECLINE`, subject to the unresolved precision policy.

## Performance bands

- 85 through 100 → `EXCELLENT`
- 70 through 84 → `GOOD`
- 50 through 69 → `AVERAGE`
- below 50 → `NEEDS_REINFORCEMENT`

These labels are domain enums; their French display labels belong in locale resources. The specification uses integer-looking ranges but grades/averages may be decimal, so exact decimal boundaries and whether banding uses rounded or raw values are open.

## Implementation constraints

All calculations must be deterministic pure functions with unit tests. Validate scores, preserve precision internally, and centralize rounding/formatting only after the product decision. Do not silently alter formulas or calculate outcome detail from a total.

## Mandatory-study threshold

The confirmed initial threshold is 55%. When the relevant quiz-success level is strictly below 55, the system creates a persistent `MANDATORY_STUDY_REQUIRED` requirement and includes the student in the mandatory-study list. Exactly 55 and values above 55 do not trigger it.

The relevant input is not yet defined: it may be the latest quiz, current semester average, or annual C1-C8 average. Do not select one implicitly. When implemented, the calculation must use the same unresolved precision policy consistently, store both the triggering value and threshold, avoid duplicate unresolved requirements for the same condition, and retain completed requirements in history.

## Required tests for a later task

- Each average with representative complete values
- Evolution at, immediately above, and immediately below ±3
- Every performance boundary, including decimal cases after policy resolution
- Input range rejection
- Separation of suggestion and final grade
- Missing/withdrawn/absent grade behavior after decision
- Mandatory study at 54.99, exactly 55, and above 55 after the relevant-average and precision decisions
- Duplicate prevention and preservation of the triggering calculation
