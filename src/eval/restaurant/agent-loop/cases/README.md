# Restaurant read development cases

- Status: current executable development diagnostic; not a Clean Baseline
- Document revision: 1.4
- Dataset: `restaurant-read-development@6`
- Acceptance contract: `restaurant-read-acceptance@2`
- Updated: 2026-09-18
- Contamination: `PROMPT_AND_RESULT_EXPOSED`; `baselineEligible: false`
- Product authority: [Restaurant Domain](../../../../../docs/domains/RESTAURANT-BOOKING.md), [ADR-0020](../../../../../docs/decisions/0020-goal-driven-restaurant-read-path.md), [ADR-0024](../../../../../docs/decisions/0024-deterministic-time-and-diagnostic-read-completion.md), [ADR-0025](../../../../../docs/decisions/0025-model-directed-read-investigation.md)

## Scope and actual wiring

This is the single current H001–H005 input for `run-hybrid-live-read.ts`. `content` is the user message; `semantic` is the independent evaluation expectation. The model receives the message and trusted time/location context, never Gold or acceptance notes. Runtime does not branch on a case ID. The materializer resolves dates and `right now` in Asia/Tokyo without changing user text. Runner artifacts record dataset version, file SHA, cohort and contamination, including failures.

`acceptance` contains human-readable review requirements; it is not a tool-routing DSL and is not consumed as a runtime instruction. The existing diagnostic evaluator consumes `materializedCase.semantic` and execution evidence. It does **not** automatically score every acceptance note or all recommendation quality. `FULL_RUBRIC_NOT_INTEGRATED` remains accurate. No new Judge or automatic pass threshold is introduced.

The offline test now instantiates the real Google client/search, Google→website fact composition and LiveBrowserAvailability/resolver, replacing only model transport, HTTP and page observations. Each actual result is independently evaluated against this YAML. H001/H003/H004 produce qualified synthetic results; H002/H005 stop without a qualified result and retain NOT_EVALUATED investigation sufficiency. Fixed responses do not measure model quality or live inventory.

## Current user promises

| Case | Delivery goal | Conditions retained | Availability requirement |
|---|---|---|---|
| H001 | AVAILABILITY | Near Shibuya, omakase HARD, tonight 19:00, explicit 2 people | Mandatory matching current slot |
| H002 | AVAILABILITY | Near Higashi-Ginza, Saturday 18:30; a closed first-date party is inferred as two and its basis is recorded; exclude hot-pot restaurants and Sichuan/Hunan cuisine as specified; first-date suitability is UNSPECIFIED and approximately JPY 10000/person SOFT | Mandatory matching current slot; the inference does not alter user text |
| H003 | AVAILABILITY | Nearby, Friday, after work, explicit 10 people; team dinner and good for drinks are expressed UNSPECIFIED preferences; approximate budget/private room SOFT | Mandatory matching current slot for the preserved broad after-work window, never a silently restored 18:00–20:00 range |
| H004 | RECOMMENDATION | Nearby cafe HARD, this afternoon 12:00–17:00; meeting-a-friend UNSPECIFIED | Optional extra, never a prerequisite for core cafe recommendations |
| H005 | AVAILABILITY | Nearby, right now in Tokyo, explicit 4 people, local food HARD, no fast food HARD | Mandatory matching source-confirmed slot; open business hours alone are insufficient |

Goal follows requested delivery, not an isolated verb or party-size field. A concrete dining visit with a known or confidently inferred party and temporal intent requires availability even when phrased as “recommend”, “looking for”, or “need”; open-ended exploration remains recommendation. None of these read-only cases authorizes a reservation, payment, or personal-data submission.

H002's exclusion names the restaurant/main cuisine, not every dish containing spice. No case-specific exclusion mapping is injected into the model or Google. H002 first-date suitability, H003 team-dinner/drinks, and H004 meeting-a-friend suitability are expressed `UNSPECIFIED` conditions; H002/H003 approximate budgets and H003 private-room remain `SOFT`. None is a source-evidence gate. After work is time-only, not an additional criterion. Dataset @5 changed H003's four strength annotations from @4; @6 changes only H002 first-date and H004 meeting-a-friend from historical `SOFT` expectations to `UNSPECIFIED` under ADR-0029. Prior @4/@5 artifacts remain exposed historical evidence without relabeling. Its `after work` expression is retained verbatim and code materializes the documented broad 17:30–22:00 query window with an explicit basis; this is neither a user-quoted exact time nor the retired 18:00–20:00 interval. Semantic suitability and the reasonableness of broad-time interpretation require independent review; current deterministic evaluation cannot certify them fully.

## Common result and investigation contract

- Inspect the actual user request and applicable source observations. Do not require a particular provider, number of candidates, batch size or action sequence.
- Recommendation with a specified visit window needs applicable opening facts and support for the user's HARD requirements. It does not assert seating availability. Additional availability investigation is optional when useful and parameters exist.
- Availability needs a source-confirmed matching current slot. Reception support (reservation, explicit walk-in, both, or unknown) and inventory are separate facts; walk-in never substitutes for a requested reservable slot.
- A current explicit negative slot result excludes that candidate under those conditions. UNKNOWN, unsupported sources, access failure or unapplied controls are not negative inventory and do not establish walk-in availability. Missing optional slot evidence does not by itself reject otherwise supported recommendations.
- Preserve all explicit date/party/location/HARD conditions. Approximate budgets and optional preferences remain soft; source-cited model judgments may be reviewed for their meaning, without treating a citation or a model label as proof by itself. This dataset update does not implement the proposed broader model-judgment runtime.
- NEAR_USER uses the explicit Higashi-Ginza evaluation location in Hybrid; ordinary Web uses actual consented device location or user-provided location. Evaluation coordinates are not product defaults. Geocoding/source failures are internal/source limitations, not automatically missing user information.
- `afternoon` is 12:00–17:00. Relative date and `right now` use the recorded reference instant and Asia/Tokyo. An elapsed requested window is not moved to another date or time to obtain inventory.
- Only actual missing user information, required authorization or necessary human takeover justifies interrupting the user. Source failure does not authorize asking the user to debug the system.

## Completion and evaluation are separate

| Observed outcome | System-behavior evaluation | User-goal completion |
|---|---|---|
| PRESENT_RESULTS | Requires independently supported, request-correct claims | Yes only when the requested result is actually supported |
| NO_VERIFIED_RESULT | May be correct within the recorded investigated scope; not proof of exhaustive search | No, or unresolved; never counted as successful recommendation/availability delivery |
| NEEDS_INPUT | Correct only for genuinely missing user information | Pending, not complete |
| External obstruction, cancellation or budget stop | Evaluate accurate attribution and bounded handling separately | Not complete; do not manufacture normal success |
| Lost constraints, wrong goal, state loss, false grounding, repeated invalid loops | Internal failure | Not complete; cannot pass by relabelling as no-result |

`NEEDS_USER_INPUT` is a diagnostic completion category; the current Domain phase is `NEEDS_INPUT`. Acceptance wording must not create a new lifecycle enum.

Keep qualified-result rate, system-handling correctness, unsupported completion claims and user interruptions separate. No requirement that all five runs find inventory; no claim that five safe failures mean 100% completion. Investigation sufficiency, subjective ranking and unverified semantics remain manual review / NOT_EVALUATED rather than automatic pass. The evaluator’s terminal `END_READ` lineage, negative-slot provenance, partial-observation retention, and Context contract are covered by this development slice; this still does not certify Live.

## Historical comparison and change control

The [pre-alignment source and rubric](../../../../../docs/superseded/eval/restaurant-read-pre-alignment-2026-09-15/README.md) are retained unchanged. The prior unversioned snapshot is named `restaurant-read-development@1` retrospectively **for this comparison only**; historical artifacts are not relabelled. Current input is @3. All five `content` strings remain unchanged. Changes are goal/annotation corrections, not a new run or stronger model result.

H001–H003 recommendation-era results are not directly comparable to the current availability contract. H002 now records the constrained two-person inference and keeps its corrected exclusion scope. H003 @4 and H002/H004 @5 remain historical exposed evidence; @6 changes the two accepted semantic expectations without rewriting any original artifact or evaluation. H004 keeps its exploratory goal/window. H005 keeps its explicit availability goal; the illustrative source clock now correctly reads 17:00 Tokyo for its original 16:00 +08:00 reference, and each Live run still materializes its own time. Do not rerun or overwrite old artifacts to make historical results match this contract.

Future user-promise or Gold changes must update this contract, current YAML and its dataset version together after human review; keep previous evidence and migration notes. Reuse the real-loader/materializer/evaluator regression for the affected behavior. Do not maintain duplicate dates, party sizes or mandatory tool lists in downstream case sections. API/model/Live runs retain their existing authorization and accounting boundaries.
