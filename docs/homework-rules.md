# Homework rules

## Assignment and student state

Each homework assignment belongs to a `ClassCourse`. Every participating student has exactly one current state:

- `SUBMITTED_ON_TIME`
- `SUBMITTED_LATE`
- `NOT_SUBMITTED`

Track the assignment and due date, state, submission date when available, delay in days, modifying teacher, and modification timestamp. Changes are auditable.

Student summaries include homework assigned, submitted, not submitted, submission percentage, total delay days, and a status represented by `UP_TO_DATE`, `TO_MONITOR`, or `VIGILANCE`. The numeric thresholds for these summary statuses are open and must remain separate from translated labels.

## Alert rule

An alert is created when a student accumulates three unsubmitted assignments relative to the last resolved-contact baseline:

```text
newUnsubmittedSinceBaseline = totalUnsubmitted - unsubmittedCountAtLastResolvedContact
create alert when newUnsubmittedSinceBaseline >= 3
```

Before any resolved contact, the baseline is proposed to be zero; this should be confirmed with the alert lifecycle details.

Only one active alert should represent a threshold episode (proposed; duplication/idempotency must be finalized). Recording a parent or administration contact resolves the active alert and appends a contact record containing contact date, contact type, optional note, recorder, and total unsubmitted count at that moment. Prior contacts are never overwritten.

## Examples

1. No prior contact, total unsubmitted reaches 3: `3 - 0 = 3`; create an alert.
2. Teacher records contact at total 3: resolve it and store baseline 3.
3. Total reaches 5: `5 - 3 = 2`; no new alert.
4. Total reaches 6: `6 - 3 = 3`; create a new alert.
5. Contact is recorded at total 7: store baseline 7. A later total of 10 creates the next alert.

The formula uses cumulative `totalUnsubmitted`. What happens if a past `NOT_SUBMITTED` record is later corrected—and the count decreases—is open.

## Contact and audit protection

Assigned teachers share homework and contact records for their class course. Contact history is sensitive and append-only; corrections should create a traceable amendment rather than destructive replacement. Alert resolution and contact creation should be atomic. Record actor/time for state, alert, and contact changes.

## Action-center projection

An unresolved homework alert is eligible for the assigned teacher's “À faire aujourd’hui” projection. It is an automatic linked item, not a duplicated personal-task record, and disappears from the active action list when the underlying alert is resolved. The homework alert remains authoritative and its history remains available.

## Later test scenarios

- Counts 0, 1, 2 do not alert; 3 does
- Existing active alert is not duplicated at 4 or 5
- Contact at 3, then new alert exactly at 6
- Contact at 4, then new alert exactly at 7
- Multiple resolution cycles preserve every contact
- Different students and class courses maintain independent baselines
- Concurrent updates create at most one threshold alert
- Corrections/deletions follow the future count policy
