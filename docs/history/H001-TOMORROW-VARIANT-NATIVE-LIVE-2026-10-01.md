# H001 Tomorrow Variant Native Live — 2026-10-01

- Status: Recorded
- Document revision: 1.0
- Last updated: 2026-10-01
- Source of truth for: the one user-authorized real-source H001 tomorrow-date diagnostic after the 2026-10-01 changes
- Related ADRs: [ADR-0032](../decisions/0032-source-native-restaurant-discovery.md), [ADR-0033](../decisions/0033-native-source-batch-delivery.md)
- Related documents: [Current Status](../STATUS.md), [previous tomorrow variant](H001-TOMORROW-VARIANT-NATIVE-LIVE-2026-09-30.md)

## Scope

This is a new, user-authorized **read-only** diagnostic variant. It keeps the exposed
H001 request, the Hard `omakase` condition, the Shibuya named-place check, and two
people; only its relative date was materialized at run time. It is not canonical H001,
does not alter Gold or the frozen development input, and did not submit a reservation,
payment, cancellation, or other external write.

The runner used `LOCAL_CHROMIUM`, temporary browser profiles, native discovery, real
DeepSeek decisions, and the configured Google named-place proxy. Its ceilings were
300,000ms total, 50 model calls, 30 Agent steps, 30 browser operations for each
availability candidate, 60,000ms per availability candidate, and 30,000ms per provider.
No retry followed this run.

## Input and result

- Artifact: [execution](../../.eval-artifacts/restaurant-hybrid-live-read/2026-10-01T10-41-49-402Z-f74018f9-c00f-476c-8ed0-8b85fe6e1ee6.result.json), [independent evaluation](../../.eval-artifacts/restaurant-hybrid-live-read/2026-10-01T10-41-49-402Z-f74018f9-c00f-476c-8ed0-8b85fe6e1ee6.result.evaluation.22-1790851453168.json)
- Materialized request: Tokyo **2026-10-02**, 19:00, two people, near Shibuya, `omakase` HARD.
- Terminal result: process `SUCCEEDED`; domain `NO_VERIFIED_RESULT`; six Agent steps; no `PRESENT_RESULTS`, Offer, booking action, or retry.
- Resources: 143,778ms; 13 model calls, including five browser-model decisions; one Google named-place resolution and no Google restaurant discovery/detail call; 48 browser-runtime operations. The independent evaluator records conditions, investigation lineage, and readable resource fields as satisfied, but reports `taskProducedQualifiedResult=UNKNOWN` because no request-bound inventory was presented.

## Fixed source sequence and observations

### Tabelog first

Tabelog read two raw and two parsed entries, inspected both, rejected one at the existing
1km Shibuya gate, and admitted Sushi Teppen. Its source-native same-outlet continuity was
`HIGH / NATIVE_SOURCE_ID_AND_DETAIL`; the native fact path supported the Hard omakase
criterion.

The live detail page did not expose an exact, visible, non-disabled control for
2026-10-02. The observed selectable dates began at 2026-10-03. One model proposal naming
the wrong closest date was rejected by the executor; the next decision correctly requested
human help. The Adapter returned `UNKNOWN / REQUEST_SELECTION_UNCONFIRMED`. This is not
a claim that the requested time is unavailable.

### TableCheck second

Because Tabelog did not satisfy delivery, the formal runtime switched to TableCheck. Its
first observed page produced 21 raw links, 19 parsed outlets, and five inspected details.
All five failed the unchanged 1km gate; 14 later observed entries were retained as pending
detail-batch work. This batch therefore did not claim provider or web exhaustion.

The next bounded TableCheck source read reached the public search page but waited for a
source result anchor that did not become visible. After one model action to open the
observed availability-search control, the control read timed out. The source is recorded
as `BROWSER_TIMEOUT`; it is not interpreted as an empty list or lack of inventory.

## Newly exposed limit

The run records 31 browser-runtime operations under `native-discovery:TABLECHECK` while
the command supplied `--max-browser-operations 30`. The runner applies that CLI ceiling
to `LiveBrowserAvailability`, but not to `composeNativeRestaurantRead` discovery. This is
an accounting/scope-wiring gap, not a reason to retroactively call the run compliant with
one global 30-operation cap. No automatic rerun is authorized.

## Conclusion

The repaired native path did perform the required order: Tabelog first, then TableCheck
after non-delivery. It preserved the exact materialized request, same-source identity, the
availability distinction between `UNKNOWN` and no-slot, TableCheck's deferred entries, and
the source timeout. It did **not** produce a current request-bound inventory result, so it
does not demonstrate an H001 user-success outcome. The next implementation target is to
wire the native-discovery operation ceiling into the shared run budget and to diagnose the
TableCheck result-anchor wait without changing source scope, location policy, or inventory
acceptance rules.
