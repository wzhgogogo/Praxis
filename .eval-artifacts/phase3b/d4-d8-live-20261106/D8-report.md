# D8 single Live after D4

Status: draft / not integrated. 2026-11-06T10:42:47.928662+01:00 CET UTC+1.

Frozen branch SHA `9482ef61530db6a1c1e6fa6c2ab836d95f9c3e81`; input pack unchanged from the previously certified D8. User explicitly requested D8 after completed D4 and approved one further GET (global455). D4 original NOT_EVALUATED/INCOMPLETE_PAGE remains unchanged. No D4 rerun, no repeated certification/connectivity, no main merge.

## Result and first divergence

D8 ended ASK_USER/NEEDS_INPUT after 224.363 seconds. Google returned five nearby-brand candidates; Agent investigated the first three. All three source identity checks stayed NAMED_OUTLET_IDENTITY_UNCONFIRMED. No outlet displayed, no availability check result, no selected outlet, no B1 or cancellation/card terms. BOOK_THIS_OUTLET followup was not triggered. This is a capability miss against the independently still-available witness, not proof of no availability.

First observed search divergence: TableCheck decisions4–6 use the Destination (area/station) control for the outlet name and then request human help because no area/station matches. This run reached the TableCheck search page; it was not a blanket connectivity failure. First candidate's provider expires at45002ms (diagnostics69/71). Tabelog decisions7–9 submit Nakamata, then choose Nakamata Shuzo Mosuke13149972 instead of W2. COMPLETE is refused three times (diagnostics137/151/165); the wrong outlet is not delivered. Later investigations continue from its unrelated area list. The records prove these actions and failures; they do not by themselves identify a complete general fix.

## Independent assessment

Original G6 verdict: `{"status": "NOT_EVALUATED", "qualified": null, "outcome": null, "s0": 0, "s0Status": "PASS", "stopBatch": false}`. S0 checks PASS for this run; GET/provenance audit `ABSENT`; actual outer request method/body/preflight checks 220/220 PASS. Automated overall outcome stays NOT_EVALUATED: BOUNDED_NO_RESULT and NO_DELIVERY_WITNESS capability checks FAIL. Do not relabel it as a successful D8 or rewrite D4's missing qualification binding. Posterior raw detail and vacancy responses show the certified W2 slot still exists.

Dual-channel link list is empty, status NOT_REACHED (`D8-runtime/runs/D8/D8/dual-channel-link-list.json`). No booking URL was manufactured or opened.

## Provider timing

These are measured provider scopes, not additive full-turn elapsed times. Candidate identity was never established; identity+availability normal sample is unavailable.

| Candidate | Source | elapsed ms | browser model calls | scope result |
|---|---|---:|---:|---|
| Nakamata | TABLECHECK | 45002 | 3 | ABANDONED / DEADLINE_EXCEEDED |
| Nakamata | TABELOG | 39377 | 6 | FINISHED / ADAPTER_RETURNED |
| Nodoguro, Ginza Nakamata Hanare | TABLECHECK | 45001 | 3 | ABANDONED / DEADLINE_EXCEEDED |
| Nodoguro, Ginza Nakamata Hanare | TABELOG | 14335 | 2 | FINISHED / ADAPTER_RETURNED |
| Nodoguro Nakamata | TABLECHECK | 21756 | 3 | FINISHED / ADAPTER_RETURNED |
| Nodoguro Nakamata | TABELOG | 45003 | 5 | ABANDONED / DEADLINE_EXCEEDED |

## Recording, budget and checks

Three recording channels enabled. 14/33 pages replay-qualified; PARTIALLY_REPLAYABLE. Unsafe/missing dependencies remain explicitly unqualified, not synthesized. All26 decision rows saved. Per-purpose counts and model latency totals are in D8-summary.json.

This run: Live1, real models26, Google1, posterior evaluationGET2; no retry. Cumulative: `{"fullLive": 23, "realModelCalls": 638, "environmentReruns": 0, "evaluationPublicGET": 347, "googleRequests": 95, "restaurantWebsiteRequests": 11220}`. GlobalGET455 minus used347 minus held-out108 leaves0. Live23 used, globalcap41, reserved18 unchanged. Models638/1600; each turn retained its50-call maximum.

Product and executable Runner unchanged from the already green snapshot-fix candidate (typecheck/arch/build;1428 default,228 Chromium,75 G6,strictG2 5tests/12pairs). This change only freezes D8 inputs and records actual execution; no additional full gate repetition or hardcoded product change. No merge: D8 did not reach identity+availability, while D4 still lacks independent qualification and a successful G1 answer. Follow-up diagnosis can use this recording offline; no further Live started.
