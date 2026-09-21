# Live Read P0 independent diagnosis and review - 2026-09-21

- Status: draft / not integrated; offline implementation accepted; bounded Live not yet run
- Document revision: 0.2
- Scope: geographic candidate grounding, scoped browser failures and bounded investigation, named-location identity
- Evidence class: exposed development diagnostics; historical Live runs are DIRTY snapshots, not Clean Baselines

## Slice and ownership

User-visible goal: reject geographically ineligible candidates before execution; continue past bounded candidate/provider failures while enforcing real task limits; resolve unambiguous source-supported location names. Terra implements and verifies, Astra independently reviews the actual composition and saved outputs. No semantic/food prompt, strength contract or Gold changes; no higher global ceilings or case/venue/country-specific patches.

Starting integrated branch: `codex/feat-live-restaurant-read-path`, local and remote HEAD both `06e4160ca68a7a10f9a8a6d91afb458d8ff1b399`, clean before this slice. The five latest historical Live artifacts were run from worktree 1135 at recorded HEAD `9c3ca7385344175ad95bdbc9a55691f04c193fc9`, DIRTY. Their code provenance must not be relabelled as clean HEAD 06e4160. [Prior Live hashes and budgets](../../.eval-artifacts/live-read-p0-review-2026-09-21/prior-live-manifest.json).

## Confirmed findings before implementation

| P0 | Confirmed root cause and consequence | Likely affected paths |
| --- | --- | --- |
| P0-1 | Text Search sends soft locationBias; grounding records areaMatch=false but still accepts the candidate. Frozen production-function controls accept outside-radius, Los Angeles and missing-coordinate candidates. H003's real SEARCH_COMPLETED event includes seven outlets in Los Angeles, San Diego, Sunnyvale and Honolulu. | Google client/contracts/search, discovery grounding, continuation and exported diagnostics |
| P0-2 | Router infers task-terminal failure from a same-failure batch. Historical H001 reached EXECUTION_FAILURE after 40 discovered / 12 checked / 444 runtime operations / 273029 ms, with more candidates remaining. Existing per-outlet operation/model ceilings do not impose separate candidate/provider elapsed limits; merely removing terminal=true would leave excessive cost. | Execution Router, availability source composition, BrowserTaskExecutor, source adapters, failure/diagnostic contracts |
| P0-3 | sameNamedLocation accepts only normalized exact names. Actual H002 source returned a coordinate-bearing Higashi-ginza Sta. with subway_station/transit_station types; discovery remained zero and GOOGLE_LOCATION_UNRESOLVED was emitted. | Google source-supported location resolution and regression controls |

An additional directly related P0-1 defect is confirmed: named-place discovery continuation skips the initial lookup but fails to carry the original geographic context into page 3. The frozen real-adapter control observes locationBias on initial pages and none on continuation. This must be fixed with the same query/area continuation contract, not a new paid lookup on every page.

[Independent frozen-code controls](../../.eval-artifacts/live-read-p0-review-2026-09-21/baseline-reproductions.json): two normal controls pass (inside-radius admission and Tokyo-to-Tokyo-Station rejection); five target assertions fail (outside-radius, US, missing coordinates, Higashi-Ginza station suffix, continuation geography). These are external-fetch controls of actual production functions, not Live or complete task evidence. Full composition checks remain required.

## Provider contract decision and unresolved environment hypothesis

Google [Text Search REST](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places/searchText) supports a strict rectangular locationRestriction and pagination; paginated requests must preserve the original parameters. [Nearby Search REST](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places/searchNearby) limits maxResultCount to 20 and has no response page token. Use Text Search with a bounding rectangle plus deterministic exact-radius admission to preserve text retrieval and continuation. The rectangle alone is not the user's circle; missing coordinates remain unverified.

The user supplied 142.202.113.30 as a suspected US proxy. Both a default request and explicit existing local Xray SOCKS request independently observed 144.202.113.30. Binding one check to the physical en0 interface timed out after 15 seconds. No routes, proxy settings or profiles were changed. These are not distinct A/B paths; the VPS ranking hypothesis remains unverified and does not block the deterministic fixes. No additional Google requests were spent on a false A/B. [Read-only network checks](../../.eval-artifacts/live-read-p0-review-2026-09-21/network-path-check.json).

## Acceptance matrix

| Failure mechanism | Required independent evidence | Current state |
| --- | --- | --- |
| Off-radius / unknown coordinates pollute executable pool | Source response through discovery, Runtime and Agent context; near positive, outside and missing negatives; rejected observations retained | PASS: adapter/grounding controls and actual Hybrid pool assertions |
| Continuation changes geography | Same source request restriction and original center/radius across pages, no repeated resolver call | PASS: adapter/grounding controls and actual Hybrid pool assertions |
| Local failure kills unrelated viable work | Actual composition with failed A/B/C and uninvestigated D; D remains reachable; genuine global abort remains terminal | Actual Hybrid composition reaches D after failed A/B/C; shared budget and runtime launch outage remain TASK failures |
| Bad source consumes whole task budget | Bounded candidate/provider elapsed time, no-progress and challenge attempts; asynchronous progress positive control | PASS: bounded executor, source-adapter recovery and identity controls |
| Identity or takeover recovery widens authority | Source-supported alternate only once, no second human-intervention loop; correct phone identity preserved, wrong outlet rejected | PASS: bounded executor, source-adapter recovery and identity controls |
| Place suffix creates false landmark identity | Higashi-Ginza suffix accepted using source evidence, Tokyo area versus Station and arbitrary business suffix rejected; multiple plausible matches ambiguous | PASS: adapter/grounding controls and actual Hybrid pool assertions |

Deterministic gates first: relevant domain/adapter/router/agent-loop tests, real local-browser fixture where affected, typecheck, architecture check, full default suite and build. Review actual evidence and counterexamples before final commit; the user requires actual HEAD plus a CLEAN worktree for subsequent Live.

## Bounded Live plan after deterministic acceptance

Run H001, H002 and H003 only, once each; do not run H004/H005 or silently retry. Preserve historical ceilings or lower them: 300000 ms automatic task bound, 30 Agent steps, 50 model calls across the shared gateway (all purposes), 100 Google requests, 120 total browser-model calls, 20 browser-model calls and 80 operations per candidate; new narrower candidate/provider limits must not raise these. Use the existing same-source read-only composition and explicit evaluation location only for NEAR_USER. Default Live must not depend on human takeover.

H001 acceptance is correct local-failure continuation and bounded cost, not guaranteed inventory. H002 must resolve the source-supported named place and reach discovery while preserving inferred party=2 and negative HARD conditions. H003 must have geographically eligible executable candidates and bounded investigation. Genuine deadline/budget stops remain such; never relabel them NO_VERIFIED_RESULT to pass. New runs must retain candidate/provider abandonment reasons, failure scope, geography and final stop evidence. No booking, payment, cancellation or other external write.

Remaining P1: H005 right-now lifecycle, broad real-source compatibility, and generalized model/long-term success rates. The network A/B remains inconclusive until two usable independent paths exist.


### Additional frozen Router reproduction

[Saved-port Router replay](../../.eval-artifacts/live-read-p0-review-2026-09-21/baseline-router-reproductions.json) runs the real Router from frozen HEAD with the actual last H001 availability response and separately a candidate-batch timeout exception. Both incorrectly return terminal=true while the saved state still has 28 uninvestigated candidates. This proves both the aggregation branch and catch branch require scope correction. It is a narrow replay, not a new complete task or Live run.


### Repeated-navigation control

The frozen actual BrowserTaskExecutor alternates between two observed same-source pages while identity completion remains false. It consumes all 20 controlled browser-model decisions and 20 navigations before BUDGET_EXCEEDED. Page state changes are therefore not sufficient evidence of useful progress; repeated navigation cycles need bounded abandonment. The 200-operation allowance exists only in this synthetic diagnostic to isolate the model-loop stop reason, not production or Live. [Successful reproduction](../../.eval-artifacts/live-read-p0-review-2026-09-21/baseline-browser-reproductions.json). An initial local setup failure omitted frozen web-skills and invoked zero model decisions; it is retained separately and does not count as defect reproduction.

### Interim independent implementation review

Not final acceptance: real Google adapter/grounding controls now reject outside-radius, US and missing-coordinate candidates, retain the inside positive control, preserve original query and geography on continuation, and resolve a typed station suffix with independent administrative context. The named-location fixture was refined to include source address components; the original baseline artifact is retained and this is not an identical-input claim for that one control. Two-page browser cycling now stops after four model decisions with NO_SAFE_ACTION instead of exhausting twenty. [Interim controls](../../.eval-artifacts/live-read-p0-review-2026-09-21/interim-independent-controls.json).

Independent review also reproduced a new session-lifecycle regression in the interim candidate deadline implementation: the runtime's permanent abort listener closes a shared session when the previous candidate's acquisition timer expires, and the executor returns that closed session to the next candidate. A 100 ms candidate limit, candidate switch at 70 ms, and acquisition 45 ms later reproduces the target failure. This is a review finding, not accepted behavior; the implementation must clear acquisition timers and preserve valid cancellation/cleanup semantics before complete verification or Live.

The acquisition-timer review counterexample now passes after clearing its temporary timer and separating it from the runtime lifetime signal. Additional independent named-location controls reject type mismatch, missing independent context, Shibuya Stream substitution, GINZA SIX substitution, and two plausible stations (AMBIGUOUS), while accepting the unique station positive control. These remain interim offline controls; full composition and Live are pending.

### First Terra handoff: changes requested

Terra reports typecheck, architecture check, build, default tests (488/488), focused tests (166/166) and diff check passing; these are executor-reported gates, not independent final acceptance. No new Live or paid model/Google calls, commits or pushes were made for this handoff.

Review remains **NOT ACCEPTED** against the original Playbook:

- A candidate timeout is checked before/after operations, but does not bound an in-flight operation. Independent real-executor control with a 20 ms candidate cap and 200 ms snapshot returns only after approximately 200 ms, BROWSER_TIMEOUT, with the session still open at return. [Counterexample](../../.eval-artifacts/live-read-p0-review-2026-09-21/first-handoff-operation-deadline.json). Provider-specific elapsed limits are absent.
- Router removed inferred batch-terminal escalation but still has no explicit failure-scope contract or independently demonstrated task-global outage/budget handling. A final END_READ test does not prove candidate D remains reachable after failed A/B/C.
- Tabelog/TableCheck/source resolver have no corresponding challenge recovery changes. Optional intervention is called independently at multiple stages, without a candidate/provider one-intervention limit. Source-supported alternate-once and identity-preserving failure/continuation controls remain required.
- Geographically rejected observations lack required per-candidate coordinate/distance and rejection diagnostics; provider/candidate elapsed/abandonment and failure-scope artifacts remain incomplete.
- Cancellation artifact code was added but actual failure-artifact regression and applicable browser fixture verification remain outstanding. Capability Matrix and affected current contracts require synchronization.

These are unfulfilled requirements of the existing authorized slice, not a new optional follow-up. Terra was explicitly resumed to complete them; Live remains gated until the missing behavior and integration evidence are closed.

### Second progress review (not an acceptance handoff)

The independent slow-operation control now returns at about 20 ms for a 20 ms candidate deadline; the synchronous-close fake is closed at return. This closes the original in-flight timeout counterexample but does not prove asynchronous cleanup, cleanup-rejection handling or parent-abort latency. The current timeout path starts `close()` without awaiting or catching its rejection, which remains under review.

A separate real `ModelBrowserReadActionDecision` control confirms the runner's `MODEL_CALL_BUDGET_EXHAUSTED` is currently converted into `BrowserReadDecisionError / MODEL_FAILURE / NETWORK`. The new browser-only global-budget code does not by itself preserve this shared all-purpose limit (50 Live calls versus 120 browser sublimit). Terra was asked to preserve the actual task-budget cause through all affected boundaries and demonstrate terminal behavior in the real composition. [Budget propagation counterexample](../../.eval-artifacts/live-read-p0-review-2026-09-21/second-review-global-budget-propagation.json). Provider-specific elapsed limits, observed alternate-once recovery, actual continuation/global-fatal composition, diagnostics and applicable fixture verification remain open.

### Shared-budget cross-path follow-up

The original real browser-decision budget control now preserves MODEL_CALL_BUDGET_EXHAUSTED and passes. A separate actual ModelRestaurantFactJudgment control with eligible cited source evidence initially returned empty evidence after the same gateway budget exception, rather than propagating task termination. Terra corrected this concurrently; the follow-up capture now preserves MODEL_CALL_BUDGET_EXHAUSTED and passes. The initial failure is in the review tool transcript; the saved third-review fact artifact is the post-fix result. Website-fact catch and fact Router catch also require review. This is the same shared run-budget invariant across already-used investigation paths; no prompt or semantic-rule changes are requested. Evidence is retained as third-review-browser-budget.json and third-review-fact-budget.json in the review artifact directory. Full acceptance remains pending.

### Provider clock progress review

Provider 30 s and candidate 60 s ceilings are now wired into Live runner and Web availability composition. Independent real-executor fake-clock controls pass for provider expiration, fallback within the remaining candidate window, unchanged cumulative candidate deadline, and a fresh next-candidate window. This is local clock evidence, not the missing actual source/Runtime/Agent continuation composition. Timeout diagnostics must report the limit that actually expired: current bounded/acquisition messages say candidate even when the shorter provider limit caused the stop. [Clock controls](../../.eval-artifacts/live-read-p0-review-2026-09-21/provider-clock-controls.json).

### Identity retention counterexample

A real TabelogBrowserAvailability control with external browser snapshots establishes HIGH identity through EXACT_PHONE, then throws a provider timeout during the first availability control selection. The identity diagnostic records HIGH_EXACT_PHONE, but the returned read contains no HIGH ENTITY_MATCH evidence. This independently reproduces the required identity-retention defect, rather than assuming an identity resolver unit test proves source failure preservation. [Pre-fix control](../../.eval-artifacts/live-read-p0-review-2026-09-21/identity-retention-before.json). The challenge/identity implementation slice remains assigned to Terra.

The same identity-retention control now passes: HIGH_EXACT_PHONE remains identity-only evidence following a BROWSER_TIMEOUT; the availability outcome stays unknown. [Post-fix control](../../.eval-artifacts/live-read-p0-review-2026-09-21/identity-retention-after.json). This does not close observed-alternate recovery, wrong-outlet controls or full task continuation.


### Integrated composition and artifact review

The real `createHybridReadComposition` now connects Google grounding, Interpreter/Compiler, Runtime, Agent, Router, `LiveBrowserAvailability`, both provider adapters and source resolution in a single regression. Only model/network/browser I/O is substituted. Three failing candidate reads leave a fourth source-supported candidate reachable and presentable; geographically outside and missing-coordinate observations never enter Agent candidate pools. The independent evaluator processes the resulting artifact. Restoring the removed batch-terminal escalation in an isolated mutation makes the target assertion fail; setup errors are not accepted as mutation evidence.

Actual model gateway budget exhaustion (browser and Agent paths) and Chromium launch outage remain typed TASK failures. Cancellation uses the CLI's shared immutable `captureHybridLiveProgress` plus the real diagnostic journal; it preserves state, Google counters, started/failed/in-flight browser operations, remaining candidates and termination, and is unchanged after late cleanup. Candidate/provider scope is recorded in trajectories and browser lifecycle events rather than relabelled as a successful task.

Independent review found and closed the in-flight deadline, acquisition timer, shared budget masking, and Tabelog HIGH identity-loss counterexamples. The real Chromium public-filter fixture exposed another regression: text-only cycle detection ignored checkbox/range/select changes. The cycle key now includes observed control state, excludes opaque references, and retains the two-page-cycle negative. Full local browser fixture passed **23/23**; this is local real-browser evidence, not website Live.

| Failure type | Behavioral evidence / detection | Boundary |
| --- | --- | --- |
| Geographic false acceptance and continuation drift | `google-places-restaurant-search.test.ts`, `read-grounding.test.ts`; frozen old-code failures and real Hybrid candidate-pool assertions | Google responses substituted; VPS hypothesis unverified |
| Station false rejection / landmark false acceptance / ambiguity | Actual adapter typed/contextual station controls, Tokyo-vs-station and multiple-plausible negative controls | Source fixtures; new Live pending |
| Local source batch kills viable task | `hybrid-read-composition.test.ts`: A/B/C fail, D reaches PRESENT_RESULTS; isolated wrong-aggregation mutation detected | Scripted external model, no real-model policy claim |
| Global budget/outage incorrectly swallowed | Actual Hybrid gateway throws shared budget or runtime launch outage; FAILED state and typed termination asserted | Synthetic fault injection |
| Deadline/no-progress/async cleanup | `browser-task-executor.test.ts`; independent deadline/cycle/acquisition controls; real-browser public filter positive | Local browser/runtime fixtures |
| Lost evidence on cancellation | Shared CLI capture and actual diagnostic write/read; immutable artifact after late cleanup | Bounded synthetic cancellation |
| Identity and alternate challenge recovery | Tabelog/TableCheck adapter controls and source-resolver composition; controls pass after review fixes | No real challenge success claimed |

The earlier synthetic `offline-multi-available` control coordinate was corrected from latitude 35.6690 to 35.6660 so it lies inside its declared Shibuya 1 km radius. Frozen H001–H005 inputs, Gold and source sets are unchanged. No semantic prompt, strength rule or global budget was increased.


### Final offline acceptance checkpoint

Final review also closed TableCheck stale controls after alternate recovery (fresh skill observation replaces old page status/controls), TableCheck identity retention after timeout, and provider-clock resets inside same-provider alternate recovery. Alternate URLs do not receive a new provider window. Website facts now emit operations and lifecycle into the same Live diagnostic sink, with provider 30 s / candidate 45 s limits and unchanged 4 model / 24 operation caps. Cancellation during in-flight Google discovery now snapshots the real adapter counter, including sent requests before trajectory completion; no source coordinates or geo observations are invented when the response never returned.

Final default suite **509/509 PASS**, typecheck, architecture check, build and diff check PASS. Full real Chromium local fixture **23/23 PASS** after source-recovery changes. Offline acceptance does not establish real-site challenge recovery or real-model investigation quality. The next authorized gate is one H001/H002/H003 run each at the same clean committed code snapshot, 300000 ms / 50 model calls, no human takeover and no retry. H004/H005 are not rerun.
