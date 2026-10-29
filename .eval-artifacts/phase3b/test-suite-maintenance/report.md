# Approved test-suite maintenance — 2026-10-29 CET

Status: verified offline result, ready for user-authorized main publication. Current baseline: main8d565812 (G1 signoff merged/pushed, remote SHA verified); this branch contains no new real calls. The original reviewed inventory/proposals remain at b74aa584; approved-proposals.json preserves that historical proposal without pretending it was already implemented. approval.json records the user's five-item approval.

## Approved items and surviving checks

| Item | Change | Continued coverage / controlled-fault evidence |
| --- | --- | --- |
| A-D01 | Remove six English Prompt regexes and their unused import. | Existing checkbox/range/scroll wire, WAIT envelope and Executor WAIT/Escape/guarded-submit positive/negative controls retained. In an isolated copy, forced unchecked decoding makes the surviving wire assertion fail while the six prose regexes still pass. Real Chromium unguarded filter rejection is untouched. This proves behavior, not real-model Prompt adherence. |
| A-D02 | Merge the stable-ID URL/run assertion into the more complete search→facts case, then remove its duplicate. | Same run-a; first POST searchText, second GET /v1/places/place-1; two calls, COMPLETED, matching hours, discovery/details counts and third-request budget rejection retained. Controlled Details→searchText fault fails the surviving exact transport assertion. Different-run isolation is untouched. |
| A-D03 | Transfer provider-payload redaction into the real Search failure/budget case, remove the direct Client duplicate. | Fixture throws the same upstream diagnostic payload; public error must be GOOGLE_NETWORK_FAILED without payload; sent-failure usage and second-request budget rejection retained. Appending the raw provider error makes this surviving predicate fail. No new transport logging. |
| A-C01 | Remove the manual static recordSnapshot positive after strengthening the real Guard→Recorder→HAR→Adapter control. | Source and replay both bind 2026-10-08, two guests,19:00. REPLAYABLE, JS/CSS bytes, admitted /slots and zero extra receiver traffic remain. Dropping the captured /slots response makes the stronger control reject REPLAYABLE. Static same-outlet guide control remains in browser-read-tablecheck.test.ts. HAR-miss/denied/replay-reference/S0 negatives untouched. |
| A-T01 | Keep the Guard test; replace its fake transport's6s/100ms wall waits with TestContext Date/setTimeout. | Bounded microtask condition ensures fetch started before ticking. Same6s>5s,8s allowance,100ms timeout, fetch args, fulfill/abort, READ_TIMEOUT. Reintroducing5s cap fails with fetch:0:5000/abort. Timer injection is test-scoped, no production API change. |

coverage-proofs/summary.json binds each normal PASS and assertion-failing controlled fault to the source ref, overlaid successor test hashes and patch/log hashes. All faults run in a disposable source archive, never the shared product worktree. Two archive setup errors (old Python tar API, missing committed web-skills) were corrected before normal controls; they do not count as valid reds. Local construction only, not website replay. Legacy candidates were removed only after all five successor challenges passed.

## Slow fixtures, individual decisions

| Fixture | Before full-suite case duration | Decision and reason |
| --- | ---: | --- |
| P21b production search-filter fallback |38.819s| Keep all13 source/mode combinations and their fallback/identity/no-availability assertions. Cost is repeated real navigation and settlement, not an artificial38s sleep. No shortened production waits. It remains in discovery.test.ts; category/region tests are separated so it no longer serializes those independent mechanisms. |
| TableCheck45s provider observation |32.339s| Keep this single31s real observation under45s. It detects the historical30s provider cutoff using real cancellation/timers plus a Chromium snapshot. Mocking Date alone would not exercise timer cancellation. One real-scale example of provider observation, no second legacy30s path. Source/site tests are unchanged. |
| P21 category/general-list links |24.814s| Move the exact test body to browser-read-category.test.ts, using the existing4-worker command. All8 modes,120ms dynamic page, foreign/forged/cross-source rejection, explicit model choice and partial-cancel result retained byte-for-byte. No fake page readiness. |
| P21c recorded region links |20.155s| Move exact body to browser-read-regions.test.ts. All6 recorded route inputs, independently expected regions, page/model limits and known feasible candidate remain byte-for-byte. Projected links plus constructed detail are still labelled controlled input, not a full website replay. |
| G2 full saved pages |19.035s| Keep12 pages and before/after DOM, id-reference integrity and frozen fact classification. No long fake wait; reducing pages or replacing the browser would weaken G2. Existing test-lifetime cancellation remains; no scorer, mutation or baseline changes. |

F1b's two deliberate long controls are still necessary: the31s snapshot above covers provider observation; OPEN_LINK's6.5s document load covers Executor→real browser DOMContentLoaded beyond the5s action cap, plus remaining-budget failure. The preflight's6.5s script/data response is a third **different transport mechanism** (CDP dynamic data admission and response counting), not a second OPEN_LINK or provider-snapshot example; it remains one real scale control for that mechanism. Fake-route delay is now fully virtual. Do not infer faster Live reads from faster fixture scheduling.

A process-sharing optimization was tried locally and withdrawn: the added immediate context-count assertion raced asynchronous cancellation close. Two precheck logs are retained, none counted as a product red or gate pass. No process reuse or private context-count assertion remains. Final optimization follows F1b's existing file-level parallelism; discovery-split.json proves unchanged test-body SHA. No original business assertion was relaxed.

### B-owned suggestions only (no edits)

Tabelog busy fixture tests (three saved busy pages ~3.008s; feasible busy recovery ~2.010s in this baseline) deliberately wait through the source retry. B can evaluate clock-controlled retry at its own busy-group boundary, retaining busy→UNKNOWN and recovered identity controls; A does not alter those files or the product retry interval. If B later exposes an observation clock during G3, any scaled settlement fixture still needs a genuine Chromium condition control. No new clock/product contract is introduced here.

## Timing/count comparison and checks

Full baseline commands ran serially, f05b61d8, same Apple M4/10 logical CPUs, Node24.4.1, existing4-worker Chromium entry point: **default1203/1203,28.223s; Chromium175/175,106.809s**. Main8d565812 executable tests are identical. Logs/SHAs and environment.json retained. After results are below; compare entire commands, not summed per-case timings. A single pair of offline samples is not a latency guarantee.

Observed count changes: default−3, Chromium−1; no new tests or hidden skips. Test names and body preservation checked separately. All non-test product/site/Pack/Prompt/Schema/State bytes must remain identical to main8d565812. Protected negative/auth/idempotency/S0 tests retained. Five gates and ordinaryG2 all PASS from0cfe3064 clean frozen inputs; no restored files after gates. Source/model/Google/Live calls0, .env not read. Shared budget appends one zero-consumption id and retains all prior entries. User authorizes branch/main publication after greens; stop after delivery.

## Completed verification (2026-10-29T02:36:29+01:00 CET)

| Full command | Before count / seconds | After count / seconds | Result |
| --- | ---: | ---: | --- |
| npm test |1203 /28.223|1200 /27.364|PASS,−3 tests,0.859s observed decrease (3.044%)|
| test:browser:fixture |175 /106.809|174 /105.395|PASS,−1 test,1.414s observed decrease (1.324%)|
| typecheck / arch:check / build |n/a|0.432 /0.204 /0.422s|PASS|
| fixed test:dom-change |unchanged G2 input|4/4 /20.857s|PASS, ordinary mode; no G3 claim|

All6 commands before/after clean,679 source/config/fixture/Skill hashes unchanged; no restore, skipped/cancelled/todo/fail0. Runtime-name multiset loses exactly the three approved default names and one approved Chromium name; all others retained. Source test bodies in the two new files and all remaining discovery test content match their original bytes. All non-test product bytes unchanged. The observed whole-suite improvement is small and may include run variability; no median, CI speed guarantee or faster product behavior is claimed.

Per-case after values: P21b38.700s, TableCheck32.340s, categories24.880s, regions18.876s, G2 saved pages17.493s. File separation does not inherently reduce each case's wall time; diagnosis and all durations retained in verification/slow-case-timing.json. T01 fake transport dropped6.107s→0.0043s per case; full default wall time dropped only0.859s because other concurrent work dominates. No timings are excluded. No real calls or B-owned test edits.

G1 signoff is already main8d565812; Q27 quality gap remains B fixture-only, no paid rerun. This maintenance's source and both input/output evidence are frozen; five gates complete. Next action only: publish working branch and merge/push main as authorized, then stop.

Proof inputs are exactly reconstructible from fixed Git8d565812 plus coverage-proofs/successor-input.patch (all four test-file SHAs equal the executed controls). Individual mutant patches are applied only after that overlay; input-reconstruction.json verifies the reconstruction. No obsolete executable test is retained in the default suite. Historical proof logs are not rewritten.
