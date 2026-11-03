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

Final same-candidate five gates +strict G2 pending. No main merge. A/C notification and remote receipt follow final gates. Remaining original diagnosis gaps (true request waterfall, busy/load causality and TableCheck first branch) stay open; this approved generic policy does not silently close them.
