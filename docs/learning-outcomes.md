# Learning outcomes

## Confirmed purpose

Suivora must identify student strengths, outcomes needing reinforcement, and class-level outcome performance. A total quiz grade alone is insufficient evidence for that analysis.

## Assessment modes

### `QUICK_TOTAL`

The teacher enters only the total out of 100. General quiz, semester, and annual averages are available. Detailed learning-outcome analysis is explicitly unavailable; the UI and exports must communicate that absence without fabricating results.

### `OUTCOME_DETAILED`

A quiz contains ordered questions or scored assessment elements. Each has a maximum score and can link to one or more learning outcomes. Student element scores provide evidence from which outcome analysis can be calculated once allocation and aggregation rules are decided.

## Proposed data flow

```text
Quiz → assessment elements → outcome links
                       ↘ student element scores → outcome aggregation
```

The recorded total and detailed scores require a reconciliation rule (for example whether the total is derived or independently entered); this is open.

## Guardrails

- Never distribute a quick total across outcomes.
- Never silently split an element's points among multiple outcomes.
- Keep outcome identity stable and descriptions localizable/presentable.
- Preserve the assessment structure used for historical analysis if outcomes later change.
- Define minimum evidence, aggregation, weighting, strength/reinforcement thresholds, and class rollups before implementing analysis.

## Open product decision

When one assessment element links to multiple outcomes, points might count fully for each, split equally, or use explicit weights. No choice is confirmed. The eventual model must make allocation visible and deterministic; see `open-decisions.md`.
