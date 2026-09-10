# Homework rules

## Assignment and student state

Each homework assignment belongs to a `ClassCourse`. Every participating student has exactly one current state:

- `SUBMITTED_ON_TIME`
- `SUBMITTED_LATE`
- `NOT_SUBMITTED`

Track the assignment and due date, state, submission date when available, delay in days, modifying teacher, and modification timestamp. Changes are auditable.

TASK 14 confirms the initial tracking contract as follows:

- “Not recorded” is the absence of a student-state row, not a fourth enum value. An existing explicit state is corrected in place with audit actor/time; it is not hard-deleted back to “not recorded.”
- Homework may be assigned and due on the same date (`assigned_on <= due_on`). Both dates must be inside the selected term.
- Enrollment eligibility is evaluated on the due date for the homework's class and school year.
- Only active homework whose due date is today or earlier participates in the current attention calculation.
- Ordering is deterministic by due date, assigned date, then immutable homework identifier. An unrecorded item conservatively interrupts the current streak because there is not enough evidence to classify it as submitted or not submitted.
- `SUBMITTED_ON_TIME` and `SUBMITTED_LATE` reset the current streak. Historical corrections recalculate the projection immediately from authoritative status rows.
- The initial alert is a derived current projection at a streak of three or more. It is not persisted and has no independent resolution control until contact history and the resolved-contact baseline workflow are implemented.
- Submission dates are stored when applicable. Calendar/working-day delay totals remain deferred until the open weekend, holiday and timezone policy is resolved; TASK 14 does not persist an ambiguous derived delay count.

Student summaries include homework assigned, submitted, not submitted, submission percentage, total delay days, and a status represented by `UP_TO_DATE`, `TO_MONITOR`, or `VIGILANCE`. The numeric thresholds for these summary statuses are open and must remain separate from translated labels.

## Later recurring contact-baseline rule

After contact history is implemented, the product additionally proposes recurring alert episodes relative to the last resolved-contact baseline:

```text
newUnsubmittedSinceBaseline = totalUnsubmitted - unsubmittedCountAtLastResolvedContact
create alert when newUnsubmittedSinceBaseline >= 3
```

This later formula does not govern TASK 14's derived consecutive-streak projection. Before any resolved contact, the baseline is proposed to be zero and remains an open lifecycle decision.

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
