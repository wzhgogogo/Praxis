# H001 Tomorrow Variant Native Live — 2026-09-30

- Status: Recorded
- Document revision: 1.0
- Last updated: 2026-09-30
- Source of truth for: the one user-authorized real-source, read-only H001 tomorrow-date diagnostic variant
- Related ADRs: [ADR-0032](../decisions/0032-source-native-restaurant-discovery.md), [ADR-0033](../decisions/0033-native-source-batch-delivery.md)
- Related documents: [Current Status](../STATUS.md), [native downstream Playbook](../H001-NATIVE-DOWNSTREAM-PLAYBOOK.md)

## Scope

This is not canonical H001 and does not change its Gold, semantic contract, or frozen
`restaurant-read-development@6` dataset. The user authorized one diagnostic variant of
the English request: “Looking for an omakase spot near Shibuya for 2 people tomorrow at
7 PM.” Its separate case source is `restaurant-read-development-variant@1`, with parent
hash `00b69476e6d07eec5dcd9a657555c4e3766629fce5f8e630512710252886ffb6`.

The run materialized `tomorrow` in Asia/Tokyo as **2026-10-01**, 19:00, party size 2.
It used the formal hybrid Runner with `--native-discovery`, `LOCAL_CHROMIUM`, the default
browser network, a temporary profile, and did not execute a booking, payment, cancellation,
or other external write path. Independent external side-effect counting is not connected. It
retained the existing fixed sequence, the implementation’s current 1km named-place radius,
and source detail batch cap of five.
It did not expand pages, radius, candidate cap, or retry.

## Preconditions

After the minimal variant-loader change, the full local gate passed in an environment that
permits loopback fixtures: `npm test` **568/568**, `npm run arch:check`, `npm run build`,
and `git diff --check`. The case-source loader validates that a custom source is under
`.eval-artifacts`, is a YAML file, declares the explicit variant dataset, and carries the
current frozen parent dataset hash. The original default source validation remains in place.
No prior result existed for `h001-tomorrow-1900` before this run.

## One real-source run

- Artifact: [execution](../../.eval-artifacts/restaurant-hybrid-live-read/2026-09-30T10-38-50-611Z-5c4f702c-c474-4050-bcf7-d267b3f62b51.result.json), [independent evaluation](../../.eval-artifacts/restaurant-hybrid-live-read/2026-09-30T10-38-50-611Z-5c4f702c-c474-4050-bcf7-d267b3f62b51.result.evaluation.22-1790764773999.json)
- Result: process `SUCCEEDED`, terminal domain phase `NO_VERIFIED_RESULT`; no
  `PRESENT_RESULTS`, Offer, booking action, or retry.
- Resources: 43,414ms from semantic/materialization through stop, 7 total model calls,
  1 Google named-place resolution, `browserRuntimeCalls=4`, candidate-controlled operations=4,
  and 0 browser-model actions. These are recorded Adapter runtime counters, not a count of all
  discovery-page navigation or observation operations. This is within the 300,000ms/50-call user ceiling.

### Funnel and evidence

| Source | Raw | Parsed | Inspected | Accepted | Rejected | Deferred | Result |
|---|---:|---:|---:|---:|---|---|---|
| Tabelog | 2 | 2 | 2 | 1 | 1 outside the implementation’s current exact 1km gate | 0 | Sushi Teppen, 749m from Shibuya |
| TableCheck | 21 | 19 | 5 | 0 | 5 outside the implementation’s current exact 1km gate | 14 at the existing detail-batch cap | no candidate reached availability |

Tabelog’s Sushi Teppen kept its own source ID and detail entrance through the common
availability tail. Same-source identity was `HIGH / NATIVE_SOURCE_ID_AND_DETAIL`; the
source facts and model fact judgment supported the HARD `omakase` criterion. Its
availability result was **`UNKNOWN / TABELOG_VISIBLE_QUERY_CONTROLS_RESTRICTED`**:
the live page did not yield a request-bound selectable 2026-10-01/19:00/2 control state,
so the system did not infer either availability or unavailability.

The agent then performed TableCheck native discovery. The TableCheck funnel records a
bounded first batch, `batchLimitReached: true`, and `sourceExhausted: UNKNOWN`; it is not
a claim that TableCheck, or the wider web, has no suitable restaurant. Since that source
produced no accepted candidate and Sushi Teppen lacked fresh request-bound inventory, the
agent legally ended the bounded read without presentation.

## Independent assessment

Evaluator `restaurant-hybrid-read-diagnostic-evaluator@22` with rubric@21 reports:

- authoritative conditions: `SATISFIED`;
- investigation behavior: `SATISFIED`;
- resource accounting: `SATISFIED`;
- qualified user result: `NO`;
- required evidence, final claim, and global completion: `NOT_EVALUATED` because no
  source-bound slot was presented and the bounded funnel cannot establish exhaustiveness.

The direct cause of the failed user outcome is missing request-bound inventory, not a
cross-source matcher failure or a malformed materialized request. The candidate-count
observation is now attributable: Tabelog had only one outlet admitted by the current
implementation gate in its observed page set, while the TableCheck request carried
`geo_distance=5km` and `sort_by=relevance`; this run does not prove that the source actually
applied that geographic parameter. Its inspected five failed the current 1km gate and the
other fourteen were deliberately not inspected. Whether the 1km implementation default is the
correct product-location meaning remains unresolved; historical Google-first runs found more
candidates under the same default, so the present one-candidate result also reflects source
ordering and first-five detail inspection.

## Remaining boundary

This one run does not validate a wider source sweep, larger radius, pagination, another
Live run, or current inventory beyond the observations above. Those are separate scope and
budget decisions. Original H001 remains unchanged and has no new successful availability
claim from this diagnostic variant.
