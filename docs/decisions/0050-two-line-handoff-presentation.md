# ADR-0050: Two-line B1 handoff presentation

## Status

Accepted — Document revision 0.1, 2026-10-29 (Asia/Shanghai).

The user approved this presentation change while signing off frontend step 0. It supersedes only ADR-0049's one-line departure-hint limit and the location of the cancellation-conflict confirmation. Implementation is not established by this document.

## Context

A single line mixes the items the user needs to pick with the conditions they need to verify. The user requested at most two departure-hint lines and moved the cancellation-conflict confirmation beside the relevant terms. No source permission or booking behavior changes.

## Decision

1. A departure button still names only fields carried by the server-checked link, using `filled in`. It does not assert source-side selection or booking.
2. Below it, show at most two applicable hint lines: one selection line, such as `Pick Omakase Nigiri ¥9,800 and Counter`, and one verification line, such as `Check date and guests`. Omit missing or unsupported content and empty lines.
3. Show `Confirm cancellation terms on the website` next to the recommendation card's cancellation terms and bilingual conflict notice. It does not occupy a departure-hint line. Keep both original quotations, their own English paraphrases and citations; do not rank strictness.
4. ADR-0049 continues to own current outlet/slot/source identity, freshness, both server URL checks, source-cache provenance, allowed URLs and parameters, workflow-page restrictions, card/fee evidence, explicit departure and durable once-only USER_REPORTED feedback.
5. The Web copy omits `e.g.` from the home placeholder. Availability has its own first line, and evidence metadata reads `TableCheck, checked 14:32` on the second line only when backed by current evidence. Values remain examples and must come from the actual projection or declared fixture.

## Consequences

- The UI separates picking from verification and places a cancellation warning beside the terms it concerns.
- Existing G1 evidence and B1 link generation are reused. This decision grants no additional reads, model calls, form fill, submission, authorization, State or Schema change.
- Presentation may be restructured in the Web projection during frontend slice 1; no parallel legacy execution path is introduced.

## Alternatives considered

- Keep all hints on one line: rejected by the user because picking and checking compete for attention.
- Hide the conflict warning to shorten the departure area: rejected; it remains visible beside cancellation terms.
- Rewrite ADR-0049's original Decision: rejected; its historical rule is retained with an explicit supersession reference.

## Related documents

- [ADR-0049](0049-source-bound-b1-booking-handoff.md)
- [Visual Direction](../product/VISUAL-DIRECTION.md)
- [MVP PRD](../product/MVP-PRD.md)
- [User Flows](../product/USER-FLOWS.md)
