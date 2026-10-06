# ADR-0034: Qualified read scope and bounded investigation budget

- Status: Accepted
- Document revision: 1.0
- Last updated: 2026-10-06
- Source of truth for: H001 qualified read delivery's category-query scope, source-fact continuation and shared run ceiling
- Related documents: [H001 Qualified Delivery Playbook](../H001-QUALIFIED-DELIVERY-PLAYBOOK.md), [Restaurant Booking Domain](../domains/RESTAURANT-BOOKING.md), [Capability Matrix](../integrations/CAPABILITY-MATRIX.md), [ADR-0025](0025-model-directed-read-investigation.md), [ADR-0032](0032-source-native-restaurant-discovery.md)

## Context

Some public reservation pages expose a read-only category choice before their inventory. A selected category is query state, not proof that a visible slot belongs to it. Separately, a candidate fact read previously stopped after one source page or after finding any broad type fact, leaving a missing HARD criterion uninvestigated. The fixed H001 entry points also need one actual, per-run ceiling instead of unrelated outer defaults.

## Decision

The shared read-only executor may select a source-observed radio only when the adapter supplies a narrow public-query permit. The current TableCheck permit recognizes the observed public reservation page shape and `reservation[service_category]` field; it permits no submit, booking, consent, account or checkout action. POST is not treated as a write signal because the observed public query form uses it.

Inventory and facts received while that radio is selected carry the source field, opaque group, value and label. A scoped slot is accepted only when every presented time has a visible, enabled, same-outlet live reservation control carrying the exact date, party, time and selected scope. A scoped no-slot result remains `UNKNOWN` for the outlet. A restaurant-level negative HARD conflict remains an outlet conflict across categories.

When a native or Google-listed source has not resolved the current HARD criteria, its existing controlled executor may continue through observed, criterion-relevant menu, course, or official-information links while the same candidate/provider budget remains. A related external official page is allowed only when its link was observed on the confirmed source detail and the destination independently proves the current outlet through its own visible name/address or structured data. Broad type material and a model `COMPLETE` request do not by themselves finish the fact inquiry. An explicit cited HARD conflict ends further value-free reading; otherwise the cited judgment determines whether another relevant page is needed.

The authorized H001 qualified-read variant uses a 500 second whole-read ceiling beginning before semantic interpretation, and 50 cumulative actual model calls across semantic interpretation, party supplementation, Agent decisions, browser decisions, and fact judgments. Google request accounting remains its existing independent 100-request source quota. Existing 60 second candidate and 45 second provider ceilings remain, preserving time for a legal alternate. The browser budget object is reset by the existing Router read-run lifecycle, so local Web runs do not consume another run's allowance; it is only a sublimit and does not replace the 50-call whole-run cap.

## Consequences

- Category availability without an independently observable result binding is retained as `UNKNOWN`; it does not produce an offer or a global no-slot claim.
- A source may continue through observed criterion-relevant menu, course, or official-information pages for missing HARD facts while the existing shared budget remains, without a new crawler, fallback provider or booking action.
- Artifacts retain only the minimum public category field/value/checked structure and request-bound reservation fields needed for independent scope reconstruction.
- A future source shape requires its own observed contract and harness evidence before receiving control permission.

## Alternatives considered

- Treat a checked radio or changed page text as category inventory evidence: rejected because old slots can remain after a category change.
- Permit generic radios or all similarly named fields: rejected because account, consent and checkout forms can use the same vocabulary.
- Mark a scoped no-slot result unavailable for the entire restaurant: rejected because another compatible category may remain unexamined.
- Add a new crawler or a second fact-execution loop: rejected because the existing controlled executor and candidate budget already cover this bounded continuation.
