# 2026-09-26 授权后真实模型与只读验证

- Status: current executable diagnostic / exposed development evidence
- Document revision: 1.0
- Code snapshot: HEAD `f4bf46a` plus previously reviewed working-tree changes; no production changes in this test run
- Versions: dataset `restaurant-read-development@6`, acceptance@3, evaluator/rubric@21, fact Prompt@10, Agent Prompt@18
- Contamination: exposed development / synthetic controls; baselineEligible: false
- Authorization: user explicitly authorized the pending DeepSeek payload/destination and necessary tests; later requested execution by the lead directly. The implementation task was stopped before any delegated external call.

## Budget and results

D1: six calls maximum, 8 seconds per call, 60 seconds overall, stop on first failure. E2: one real delivery decision, 10-second request ceiling (within the previously proposed 20-call/120-second cap). Fixed-source: one run for each H001–H005, 20 calls/120 seconds/16 steps per case, no retries. Live: one H001 attempt, 300 seconds/50 model starts; existing source limits unchanged. No booking, private Holdout, database write, commit or push.

**D1: 6/6 passed in one attempt per control.** Raw outcomes/citations and converted claims reviewed: Cantonese-only UNKNOWN; explicit excluded cuisine/focus CONFLICT; explicit denial SUPPORTED; broad Chinese UNKNOWN; source-grounded HIGH McDonald's CONFLICT; same ungrounded name UNKNOWN and ineligible. This supports Prompt@10 on these six exposed controls, not long-term reliability.

D1 artifact: [execution](../../.eval-artifacts/restaurant-fact-targeted/2026-09-26T01-25-18-118Z-3a7ab8d5-86c9-4513-ba04-47e4916ef277.result.json).

**E2: controlled mixed-model delivery passed.** The reviewed production-composition regression generated source-backed evidence from synthetic observations, then interrupted a slow subsequent read at the reserve. One real DeepSeek decision proposed PRESENT_RESULTS and production Runtime persisted one result with default target three, met:false. Wall elapsed 2.341 seconds; the reserve boundary uses a controlled business clock. Identity/slot observation is a fixed adapter-boundary input, not a real parsed restaurant page. The real-model context contained the durable delivery-window projection; the returned candidate matched the only supported current slot, 2026-09-17 19:00/two people. The prelude is scripted; this is not a full real-model H001 run. The temporary runner is preserved beside the artifact.

E2 artifact: [execution](../../.eval-artifacts/restaurant-e2-delivery/2026-09-26T01-38-53-427Z-2cc6f6f0-a78b-4f58-973b-9041a1a9b5b1.result.json).

| Fixed-source case | Elapsed | Recorded model calls | Presented | Automatic acceptance |
|---|---:|---:|---:|---|
| h001 | 5.197s | 4 | 3 | PASS |
| h002 | 8.869s | 9 | 3 | FAIL — semantic review required |
| h003 | 5.231s | 4 | 3 | FAIL — semantic review required |
| h004 | 5.912s | 7 | 3 | FAIL — semantic review required |
| h005 | 7.822s | 8 | 1 | PASS |

All five reached PRESENT_RESULTS. The 32 recorded provider calls succeeded; none was retried. Synthetic source observations replace HTTP/pages; these are not current real inventory.

## Issues retained without changing Gold or scorer

1. **H002–H004 automatic acceptance stays FAIL.** AUTHORITATIVE_CONDITIONS is NOT_EVALUATED because criterion wording differs; FINAL_CLAIM and COMPLETION_OUTCOME inherit the uncertainty. Independent review against original user text finds the returned variants preserve the requested meaning and strengths. Separate `.semantic-review.json` sidecars record that conclusion; they do not overwrite automatic evaluation or turn these runs into automatic passes. H002 preserves the original spicy-main-focus qualifier, H003 uses “suitable for a team dinner”, and H004 uses “suitable for meeting up with a friend”. All five automatic REQUIRED_EVIDENCE dimensions pass.
2. **Fixed-source resource schema mismatch.** The start manifest's runCeilings contains maxModelCalls/maxSteps/timeoutMs, while evaluator@21 interprets it as the Hybrid schema and requests maxAutomaticBrowserMs/maxAgentSteps/maxBrowserModelCallsTotal and modelCallsStarted. Therefore RESOURCES is NOT_EVALUATED for all five, including H001/H005's narrower acceptance PASS. Recorded counts (4/9/4/7/8) and elapsed times are below declared ceilings; this manual observation is not a replacement automatic score. Follow-up should align mode-specific runner/evaluator accounting, retaining original artifacts.
3. **D3 actual prioritization not isolated by the full fixed-source successes.** Prompt@18 executed, but those runs do not necessarily encounter a fresh-stock/missing-fact branch. Do not close the dedicated real-model D3 behavior from these results alone.

## Artifacts

- h001: [execution](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-26T01-38-06-944Z-6c23361d-cdc9-4241-92c4-3973090860e2.result.json), [evaluation](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-26T01-38-06-944Z-6c23361d-cdc9-4241-92c4-3973090860e2.result.evaluation.21-1790386692150.json).
- h002: [execution](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-26T01-38-47-057Z-b271cf50-ad45-4a8d-940b-412b0b4e009b.result.json), [evaluation](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-26T01-38-47-057Z-b271cf50-ad45-4a8d-940b-412b0b4e009b.result.evaluation.21-1790386735934.json).
- h003: [execution](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-26T01-38-56-067Z-d9fdcdc1-f693-4007-9489-434993ffc573.result.json), [evaluation](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-26T01-38-56-067Z-d9fdcdc1-f693-4007-9489-434993ffc573.result.evaluation.21-1790386741308.json).
- h004: [execution](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-26T01-39-01-464Z-836d6cff-f9a7-4d5e-8390-e2a7c4d2f734.result.json), [evaluation](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-26T01-39-01-464Z-836d6cff-f9a7-4d5e-8390-e2a7c4d2f734.result.evaluation.21-1790386747388.json).
- h005: [execution](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-26T01-39-07-544Z-bf5475c9-2b8d-4e31-b5d5-f232fef27877.result.json), [evaluation](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-26T01-39-07-544Z-bf5475c9-2b8d-4e31-b5d5-f232fef27877.result.evaluation.21-1790386755380.json).

## Live H001

**User goal not completed.** The single run ended CANCELLED at 300,040 ms in SEARCHING with zero Offers and no PRESENT_RESULTS. It discovered 38 candidates and completed 12 availability checks: nine UNKNOWN and three source-reported UNAVAILABLE/NO_MATCHING_SLOT. Sixteen total model calls started (nine recorded browser model calls), three Google requests and 161 browser runtime calls were retained. A further candidate had partial browser activity at the deadline; do not count it as a completed availability check.

Observed UNKNOWN causes include browser runtime failures, uncertain outlet identity, request-selection confirmation failure and a source timeout. Three explicit no-slot observations are distinct from those failures; they do not establish that the full candidate population lacks availability. There was never a qualifying available result in the captured State, so the default delivery reserve's one-or-two-result precondition was not reached. This Live failure cannot establish a regression of the independently exercised E2 delivery behavior.

Evaluator@21: AUTHORITATIVE_CONDITIONS, INVESTIGATION_BEHAVIOR and correct cancellation classification pass; result support/final claim remain NOT_EVALUATED; RESOURCES fails because measured elapsed 300040 exceeds the declared 300000 ms by 40 ms. Keep that strict resource verdict rather than rounding it to a pass.

[Live execution](../../.eval-artifacts/restaurant-hybrid-live-read/2026-09-26T01-39-42-241Z-60f00108-7ebf-441d-9913-7d997a223399.result.json); [Live evaluation](../../.eval-artifacts/restaurant-hybrid-live-read/2026-09-26T01-39-42-241Z-60f00108-7ebf-441d-9913-7d997a223399.result.evaluation.21-1790387082276.json). No automatic retry or additional full Live case was launched. Remaining A/B/C source limitations and dedicated D3 real-model prioritization remain open; next useful work is targeted diagnosis of recorded source/identity/control failures, not rerunning the whole suite to seek a green result. Current paid-call accounting across D1, E2, five fixed-source cases and Live is 55 calls/starts (6 + 1 + 32 + 16); token/cost records are per invocation, no monetary cost estimate is asserted.

## H001 follow-up causal review

The four completed availability actions consumed 64.952 + 95.660 + 49.641 + 64.612 = 274.865 seconds (about 92% of the 300-second budget). Nine UNKNOWN candidates split by observed path: three early navigation/runtime failures (Matsumoto, Sushi Gonpachi, Matsue); three source-discovery/identity failures (Yamashita, Sublime, Gonpachi); three candidates with a matched source but incomplete request/inventory work or failed alternate source (Hanaoka, Tokyo Ten, Kazumasa). These are path-level groups, not the final reasonCode alone: a later provider failure can obscure the more useful earlier failure.

The first batch includes navigation timeouts followed by “interrupted by another navigation” failures. This is evidence to investigate session reuse and unfinished navigation cleanup after timeouts; it does not establish a confirmed concurrency bug. Identity failures include unrelated TableCheck discovery results, Tabelog NO_OUTLETS_PARSED and conflicting branch phone numbers; a generic relaxation of identity matching is not justified. Request-stage failures include REQUEST_SELECTION_UNCONFIRMED and BROWSER_TIMEOUT after source identity was obtained.

The three no-slot observations were recorded for Jinnan, Sushi Labo and Hichou. No available Offer existed to rescue at the delivery reserve. The principal failure is the low yield and time cost of real-source investigation; the strict 40ms resource overrun is a separate accounting result, not the cause of zero output. A corrected UNKNOWN path might reveal either availability or genuine no-slot inventory; this run cannot prove a restaurant had an available matching seat.

## Navigation cleanup versus control failures

Code inspection plus a zero-network executor control confirms a cleanup coverage gap: LocalPlaywrightChromium wraps its own `page.goto` timeout as BROWSER_RUNTIME_FAILED; BrowserTaskExecutor.bounded closes the shared session only when its own deadline wins or the parent aborts. A runtime navigation failure before that deadline therefore leaves the session cached. The control produced sessionReusedAfterRuntimeNavigationFailure=true, opens=1, closesBeforeExplicitCleanup=0. Existing hanging-snapshot coverage exercises the executor-owned deadline, not this runtime-error path. This confirms reuse without cleanup; it does not by itself prove a real browser's late navigation caused every subsequent error.

The first Live batch reused one session through the initial timeouts and later interrupted-navigation errors. In contrast, Tokyo Ten started in a freshly opened session and then failed request confirmation: an incorrectly formed combobox action was rejected, another click was structurally write-capable, and the provider deadline expired. Hanaoka repeatedly proposed a structurally write-capable click; Kazumasa exposed only September 29/30 date controls rather than the authoritative September 26. These observed control failures are not explained by first-batch navigation contamination. Do not relax write guards or interpret a missing requested-date control as proven no availability without source evidence.

## Web Skill/action-contract follow-up

Web Skills were wired and active: the browser decision receives repository generic + source Skill text, and this run records nine SKILL_STARTED entries. The control evidence narrows the earlier generic safety-rejection description: Hanaoka and Tokyo Ten expose a native `kind=SELECT`, `role=combobox` time control. Tokyo Ten's options include an observed 7:00 PM label with an opaque timestamp value. The current SELECT_AUTHORITATIVE action accepts DATE/PARTY_SIZE only; TIME exists for CLICK_AUTHORITATIVE. The TableCheck Skill directs time combobox handling toward CLICK then CLICK_AUTHORITATIVE, which fits custom button/option controls but not the observed native SELECT. safeGenericClick rejects non-BUTTON targets using a broad write-capable error. Thus the logged rejection alone does not prove these native time selectors submit a reservation; it also covers wrong control/action kind. This is an observation/action/Skill contract gap, not merely model disobedience or absence of Skills.

A general correction should cover native selects and custom comboboxes separately, bind choices to observed options and authoritative constraints, re-observe selected values/results, and expose accurate legal-action feedback. It must retain fail-closed external submission boundaries. Hanaoka's observed time options are 17:30 and 20:00 only; this does not authorize changing the requested 19:00 or independently prove no inventory. The shared runtime cleanup gap and this shared control-action gap are separate repair slices, validated with real Chromium controlled pages and bounded current-source reads.
