# Letters MVP

## MVP letter types

The initial letter-generation MVP is intentionally narrow. It should cover the first workflows that are easiest to validate from existing checks and document inputs.

Included in MVP:

- `belege_request`
- `nebenkosten_objection`
- `repair_request`
- `deposit_return_request`
- `rent_increase_objection`

## Selection criteria

- Prefer letter types that can reuse existing `case`, `document`, and `check` data.
- Prefer flows with predictable variables and a bounded output shape.
- Prioritize document-check-driven letters before open-ended drafting.

## Product rationale

`belege_request`, `nebenkosten_objection`, `deposit_return_request`, and `rent_increase_objection` map cleanly to the current analysis pipeline and can reuse extracted findings as input context.

`repair_request` is the only guided-form letter in MVP. It is operationally simple and does not require the full document-analysis pipeline to be useful.

## Deferred until post-MVP

- `termination`
- `custom`

Reasons:

- `termination` is useful, but it is not required to validate the first check-to-letter workflow.
- `custom` is too open-ended for MVP and weakens quality control, variable collection, and reviewability.
