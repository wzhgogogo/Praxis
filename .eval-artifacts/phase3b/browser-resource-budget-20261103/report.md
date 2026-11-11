# Shared resource policy + navigation floor (review candidate)

2026-11-03 CET (Europe/Vienna, UTC+01:00). Draft / not integrated; no main merge.

User-approved implementation: all sources suppress admitted image/media/font; document, stylesheet, scripts and data retain existing Guard admission. Source Packs may declare retainedResources rules, which only remove suppression. No actual site exception is configured. Both Playwright routes and native CDP redirects enforce suppression. Network entries retain BLOCKED plus resourceTypeDetails.policyBlock=NONESSENTIAL_RESOURCE and diagnostics RESOURCE_POLICY_BLOCKED. Existing recorder@5 preserves the marker and only checks ADMITTED dependencies; recorder code/schema unchanged.

Navigation floor is 3000ms of remaining run/candidate/provider browser window, based on saved clipped 41/1447/1494/1730ms navigations. It is checked before prepare and again before dispatch, including observed full-page links and public query navigation. Requested operation timeout is still capped normally: a short explicit timeout does not mean the browser budget is exhausted. Cancellation wins. No budget/time limit is increased. BROWSER_BUDGET_EXHAUSTED propagates through typed failure classification and grounding, including before identity; it never asserts inventory. State25/TaskDefinition23/Agent and question Prompt/Schema unchanged.

## Red/green and local evidence

- red.log: both independent assertions fail on the original Guard/Executor (optional resources dispatched; 2500ms window dispatches navigation).
- unit-green.log: 79/79; retention cannot admit unreviewed origin/prohibited path, required script/CSS/data retained, low/expired budget sends no prepare/navigation, cancellation and short explicit operation timeout preserved.
- Initial default preflight 1407/1408: the existing busy-deadline fixture started with only250ms, so the new floor prevents its intended first navigation. Updated this B-owned test to begin with10000ms and injected Date.now consumption leaving250ms after first navigation; original UNKNOWN/BROWSER_TIMEOUT/one-navigation assertions remain. Domain grounding additionally preserves the new reason before identity (otherwise it became ENTITY_MATCH_UNCERTAIN). propagation-green.log 6/6. No A/C file edited.
- local-proof.ts/local-proof.json: real Chromium, synthetic component fixtures labelled Tabelog/TableCheck/merchant; 20 delayed images, one font, one media. A declaration retaining optional assets versus default suppression uses identical original admission. Receiver26→4, policy markers0→22. Required text/CSS/script/data remain; all6 recordings REPLAYABLE, blocked dependencies do not become uncaptured. These are local mechanisms, not real website task validation. Tabelog local DCL35→19ms; TableCheck16→32ms; merchant23→13ms (single samples). Full load757/739/741→36/69/32ms with deliberately700ms optional responses. Do not extrapolate this to Live.
- Earlier exploratory local recording attempts rejected a free-form string containing a date under the existing sensitive-number scanner. The frozen fixture uses a typed ISO date field; neither sanitizer nor recorder was changed. Exploratory failed attempts are not claimed as acceptance.

## Six authorized public reads: negative result

Frozen live-probe.ts, three before and three after, only W1 public detail, fresh ephemeral browser each time, ≥5500ms between completed reads, unchanged20s DOMContentLoaded navigation timeout plus500ms observation window; no clicks/forms/retries. Inputs and dependency hashes in freeze files. Before candidate fe7400b1; after0c17095b. Later Executor-only dispatch recheck does not affect the probe (which imports Guard directly); Guard bytes match the measured revision.

| Mode | DOMContentLoaded ms | Guard admitted requests | Result |
|---|---|---|---|
| Before |10751,13058,10688 (median10751)|56,56,56|3/3 HTTP200; body6285 chars; no busy text|
| After |not observed; all censored at20000|17,17,17|0/3 completed; all page.goto timeout|

Admitted request reduction39/56=69.6%; these counts are Guard admissions within the frozen observation window, not server waterfall totals. Before image38/CSS9/script7/document1/fetch1; after image0/CSS9/script7/document1, no observed data completion. New policy blocks33/33/38. Neither response chronology nor partial body was captured after goto timeout, so root cause of the three timeouts is unknown; no claim that suppression improved or caused them. There were no READ_TIMEOUT diagnostics by cutoff. No extra GET to investigate: all6 spent. External performance/required-content validation remains unresolved and must be reviewed; this branch must not be described as having solved Tabelog Live timeout.

Ledger: preserve existing entries by id; six rows added, evaluationPublicGET284→290 (cap290 unchanged), website admitted requests+219; real models0, Google0, full Live0, environment reruns0. No .env or answers*.json read. Synthetic receiver requests are offline, not charged as website reads.

## Gates / delivery

**STOPPED: A-owned Chromium fixture contract updates required. Not complete; not five-gate green.** No main merge. Product/gate candidate `4d3d844e`; archived `gates/gates.json` records exact full SHA and clean status before/after each step. Final report-only commits do not change source or inputs.

| Gate | Result |
|---|---|
| typecheck |PASS (0.515s)|
| arch:check |PASS (0.227s)|
| npm test |1410/1410 PASS (47.987s)|
| build |PASS (0.521s)|
| test:browser:fixture |185/188; **3 FAIL** (130.743s wall)|
| PRAXIS_G2_REQUIRE_PASS=1 test:dom-change |5/5; all12 pages PASS (24.185s)|

G2 also passed as the first Chromium phase. No skip/todo/cancel/retry; every pre/post git status empty. Full raw logs archived, including the failures.

The three failures are introduced by this approved default policy, **not unrelated existing failures**. Their old fixtures require an image to be admitted before testing another boundary:

1. `src/harness/browser/browser-read-stability.test.ts:115`, C3b outstanding image: expected pendingByType.image=1, actualundefined because image suppressed.
2. `src/harness/browser/read-network-redirect.test.ts:289`, image redirect: receiver sees onlyA/page, image is policy-blocked before its redirect.
3. `src/harness/browser/runner-replay.test.ts:81`, missing optional image: expected MISSING_RESPONSE(image), actual[] because the request never enters replay HAR lookup.

These are A-owned files and byte-identical to main. They were not edited. Proposed owner synchronization: declare the exact image as retainedResources in these fixtures only, retaining all existing assertions about settling, redirect denial and missing-response recording. No production site exception is justified or added. This requires A coordination; B stops rather than changing A files or weakening assertions. The proposed synchronization has not been applied or tested.

Normal offline availability/facts/G1 paths passed in default and the other Chromium files, and local synthetic three-source content controls passed. The specific saved D4 merchant DOM was **not** additionally executed through a guarded component fixture; current official-site/whole-task success is not proven by the synthetic merchant case. No qualified Replay is fabricated from diagnostic DOM. External W1 performance remains unresolved. A/C notification and remote receipt follow the stopped-branch archive. Remaining original diagnosis gaps (true request waterfall, busy/load causality and TableCheck first branch) stay open; this approved generic policy does not silently close them.


## Measurement limitation and disposition

The after measurement was scheduled while the default preflight was finishing: log birthtime/mtime show ~4.1s overlap at the beginning of sample1 (15:40:04–15:40:08 CET), no overlap for samples2/3. That is a measurement-control error; comparison cannot establish causality. `measurement-overlap.json` preserves the approximate intervals. Even the two non-overlapping after samples timed out. No retry or additional budget was used. The current data supports reduced admitted requests and an unresolved negative loading result, not a demonstrated speed improvement.

Review disposition: mechanisms implemented and valid local red/green, strictG2 green; acceptance incomplete because Chromium has three A-owned fixture conflicts and all three real after reads did not reach DCL. Do not merge this branch or run a holdout assuming the Tabelog timeout is solved. Minimum next step: A handles the three retained-image fixture declarations; reviewer decides how to investigate the W1 timeout with the exhausted six-read allowance. No extra approval is assumed. Original diagnostic scope remains unchanged.
