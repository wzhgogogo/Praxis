# TableCheck Guard / Live source-health candidate — 2026-10-23

Status: current candidate, exposed regression evidence; pending independent review. Branch `codex/fix-tablecheck-guard-preflight`; not merged into main.

## Commits and freeze

- Main baseline: `8487a844e2f6041f92d8ce575d3d2e1c4a7627ba`.
- Authorized h-14 diagnosis inputs frozen before implementation: `f5797d3e`.
- Implementation and five-gate evidence: `b6ac60c5`.
- Offline regression inputs/code committed before execution: `abcf5ad9`; [4,198-file replay freeze](replay-freeze.json), [815-file calibration freeze](regressions/calibration-freeze.json).
- Final documentation/evidence commit is the commit containing this report; normal push of this branch only is authorized. Main and the primary worktree are unchanged.

## Cause and change

The saved h-14 diagnosis already had the approved V4 host/path. Its facet GET supplied seven query keys (`cuisine`, `lat`, `lng`, `party_size`, `queryProfile`, `radius_km`, `scope`), without `hits`. Requiring `hits` also rejected the browser-generated OPTIONS bound to that GET, preventing the facet request. Saved red text says “Search is unavailable right now. Please try again.”; diagnostic counterfactual text says “Showing 1–20 of 654”. [Original report](h14-inputs/report.md); [immutable provenance / SHA-256](input-manifest.json).

V4 `hits` is now optional; `queryProfile` remains required and unknown query keys remain prohibited. Existing reviewed TableCheck GET reads declare their browser CORS binding, including GET/HEAD defaults and the existing static fetch path. The Guard checks the corresponding GET's complete origin, path, query and resource grammar; only browser preflight for GET, correct page origin, approved requested header names and an empty body is admitted. It does not issue OPTIONS or inject API keys. Manual OPTIONS, other methods/paths/hosts and unmatched GET rules remain rejected. Permanent `/reserve` and all descendants override matching read rules.

[Policy scope comparison](policy-scope.json) proves no new origin, path, method or non-TableCheck source exception; prohibited rules are unchanged. ADR-0036 has an append-only explanation. Recorder code is unchanged: its existing CORS observation records the newly admitted facts without header values. Such captures remain NOT_REPLAYABLE when the handshake response is not recorded. A new independently declared [reviewed-reads input](reviewed-reads.json) recognizes the same boundary; historical frozen declarations are unchanged. Evaluator algorithm/version @33 and rubric @29, State @20, semantic Prompt v23 and all delivery qualifications are unchanged.

## Eval Runner source health

Only the Hybrid Live eval Runner now checks Tabelog and TableCheck known-region search pages concurrently through production Runtime and Guard. Each attempt observes approximately ten seconds, including time after the first result so a late failed facet cannot hide behind early visible cards. Busy/challenge pages, HTTP 403 and other observed HTTP failures are unhealthy. A result listing or explicit empty listing must be observed with a successful document response. An inconclusive/timeout check is also unhealthy.

Unhealthy checks wait exactly 300,000 ms, with at most three total attempts. Attempt JSON and a final READY/ENV_FAILURE record are saved before the formal task, model, Google and formal timing/budget begin. The actual Runner failure-path test proves zero provider/network calls and no formal Live artifact when all three checks fail. This Runner's separate source-homepage Range GET checks are replaced; provider checks and the existing source-data nonempty checks remain. The ten-second figure applies to the new concurrent health attempt, not all subsequent preflight stages together.

Frozen external orchestration and Live ledgers were not changed. Future outer execution must allow the two five-minute waits plus checks before the formal 500-second run, and treat `formalRunStarted:false` / ENV_FAILURE as preflight, not a charged Live. That full outer integration has not been exercised in this offline batch.

## Red / green and verification

| Proof | Result / evidence |
| --- | --- |
| Old-policy actual Chromium contract red | [guard-red.log](guard-red.log): facet-no-hits receiver not reached, expected true / actual false |
| New-policy actual Chromium green | [guard-green.log](guard-green.log): both selected tests pass; browser GET/xhr/catalog/no-hits/default/static positives, POST/header/path/missing-GET/manual-OPTIONS/reserve negatives |
| Source health local Chromium | [health-browser.log](health-browser.log): healthy, late busy after visible result, 403 and challenge behavior pass |
| Retry + actual Runner offline path | [health-runner-green.log](health-runner-green.log): three tests pass; 0/1/2 failures, maximum three attempts, 300000-ms requested waits; actual entry failure before providers/formal task |
| Independent network-rule regression | [independent-rule-green.log](independent-rule-green.log): admitted GET/preflight and rejection counterexamples pass |
| Five gates | [results](gates/results.json): typecheck, arch:check, npm test **1026/1026**, build, test:browser:fixture **138/138**, all exit 0 |
| Calendar / selection cached real responses | [regression-results](regressions/regression-results.json): **69/69**, **5/5**, unchanged model content/schema, zero new model calls |
| Independent calibration | [comparison](regressions/calibration/comparison.json): result types **22/22**, normal S0 declarations **20/20**; two interrupted declarations remain NOT_EVALUATED |

The Chromium h-14 fixture reuses the saved request shape and public facet body with local origins rebound for real CORS. It proves the Guard defect and repair; it is not a complete reconstruction of TableCheck's frontend or a current website check. Source-health fixture uses a shortened local timeout and records injected five-minute sleeps; it does not actually wait five minutes or prove current network reachability.

An initial full gate run failed one retained CLI test that assumed provider preflight preceded loading the frozen case. The Runner now validates its case first; a temporary cwd with no case file correctly returns ENOENT before any preflight. The test was updated to assert that behavior and no preflight/task artifact, while existing proxy transport tests remain. [Original failure](gates-initial/default-tests.log), [targeted final green](preflight-sequence-green.log). Intermediate TypeScript setup errors and an outer-rule test serialization gap are retained separately and are not counted as the behavioral red or final green. The gate-generated historical region-composition artifact was restored byte-for-byte: [verification](gates/side-effect-verification.json).

## Evidence scope and remaining limits

- L0/L1: source policy, actual guarded Chromium transport, actual eval entry and saved request/response contracts pass. These are local component/composition tests.
- Offline replay/calibration: exposed historical inputs only, not a clean holdout or fresh model quality result. Automatic evaluator outputs were saved before label comparison. Missing boundary evidence remains unknown.
- Error claims: independent rule tests and the 22 calibration runs support only their stated cases; this is not an overall S0 certification. Historical h-14 and other Live results are not relabeled.
- Attribution: saved seven-key request plus old/new actual Chromium reproduces the false rejection. Present network health and full Live delivery remain untested.
- New usage in this batch: **model 0; Google 0; real restaurant websites 0; complete Live 0**. Local Chromium HTTP fixtures and cached-response replay are reported separately.

[Final integrity record](final-integrity.json) covers saved-input provenance, frozen files, source immutability after the implementation commit, gate/regression outputs, historical artifact restoration and documentation links. Stop after the authorized branch push; await review; do not merge main.
