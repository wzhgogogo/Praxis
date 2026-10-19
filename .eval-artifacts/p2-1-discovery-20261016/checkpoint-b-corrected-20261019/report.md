# P2-1 corrected checkpoint B — discovery only

Status **STOPPED / ENV_FAILURE**: 0/10 formal probes started; stop={'code': 'TABLECHECK_503_PERSISTED_AFTER_RETRY', 'index': 0, 'checkpointPreflightFailures': 2, 'sourceIds': []}. Exposed development inputs; no availability investigation, delivery or full Live.

## Changes, gates and freeze

- Review4592a1e read before work; approved scope is the three corrections and checkpoint-local outer recovery only. [B 第一版 exclusion](superseded-b-first.json) preserves its3 runs/17 calls and all historical bytes; none enter this comparison. Its h001 repeat2 was QUERY_NOT_REPRESENTABLE, correcting the old report sentence.
- Production freeze `a37e152b4283d8f407c9650d19200708314e3362`; comparison A `ba20b8a7e0ae5d00d93838f7f19b0ae01364e2be`. Prior HARD correction `884c56b`, original P2-1b `4975f9f` retained. Prompt restaurant-discovery-retrieval-prompt@5; Schema restaurant_discovery_retrieval@2. [Five gates/red-green](fixes/verification.json). [Offline TableCheck diagnosis](fixes/tablecheck-diagnosis.json) used0 network/models.
- Homepage filters use the already observed same-region list root; no guessed or foreign root. Sparse (<5) with categories and rewrites remaining excludes KEEP in Schema, Domain and executor. No categories or two rewrites exhausted still permit it. Invalid proposals retain the bounded general-list fallback, without additional model retries.
- TableCheck original3 filter pages displayed Search is unavailable right now, not a normal empty list. Filter OPTIONS contained unreviewed open_from/open_until; selected labels omit the year as a secondary gap. Search filtering is now SKIPPED/FILTER_TRANSPORT_NOT_REVIEWED; ordinary discovery remains. No network permission expansion.
- [Freeze](freeze.json) binds329 files; outer SHA-256 `649f752e8b90f343d3f8b8a7f6a67fc8355c286f0cb597985336bf5c5345eacd`; reviewed reads `86c2203cba578ec604d5b87745325ad0b4e4d2b65ea08e7d53e8cb746d275f62`; witness `9f44b01a38bf4abc7fce90ee8b07f6b73f72a02fdf75f2d1dd63c5483b2a5f4f` valid until `2026-10-20T03:12:46.141Z`. Clean host worktree. Freeze commit is recorded in [freeze-commit.json](freeze-commit.json). [17 offline outer controls](offline-controls.json); [six plan-only parses](plan-only.json). Initial freeze3c4d241 was followed by the user-approved zero-call setup restoration, re-frozen in ae9288ef064cae5bfb7a0ca179bde19c411bbb5f. Its exact patch and both freezes are preserved in recovery/. No subsequent configuration edits.
- Preflight failure count resets to0 for this checkpoint. TableCheck503 waits at least10 minutes before the one preflight-only retry. If it remains503 the batch stops, with no second retry; a recovery window beyond30 minutes also stops. Other S0/budget/size stops unchanged.
- Source-owned production delta from4592a1e: source-packs +10/-32, net-22 lines. No unrelated deletions to offset shared changes. Full source/net-zero phase exit is not certified.

## Evaluation and comparison scope

- End-to-end: all ten formal discovery probes NOT_REACHED. Full user delivery and inventory NOT_EVALUATED. Only preflight environment observations were obtained; no outcome or effectiveness rate can be claimed.
- Stages: discovery, selection, source hints, model planning, details and witness metrics are all NOT_REACHED in corrected B. The complete A rows remain preserved in comparison.json. H002 is a separate attribution group in comparison-groups.json.
- Severity: no formal trace, decisions or browser session exists for corrected B. Formal S0 is NOT_EVALUATED, not a fabricated zero/pass; local safety Fixture evidence is separately L0/L1. Readiness GET observations are preserved without claims about unobserved network behavior.
- Attribution: H002 is the approved HARD-keyword correction group; the other nine rows are P2-1b including these approved homepage/sparse-KEEP/TableCheck corrections. Source/model/live-result fluctuation prevents a statistical or single-factor causal claim. L0/L1 local evidence and real-model discovery probes are separate; no paid offline replay added.

## Aggregate (complete/common rows separated)

| Metric | A all10 | A comparable rows | B recorded rows |
| --- | --- | --- | --- |
| runs | 10 | 0 | 0 |
| models | 49 | 0 | 0 |
| elapsedMs | 942173 | 0 | 0 |
| planningCalls | 22 | 0 | 0 |
| planningMs | 56097 | 0 | 0 |
| planningTimeouts | 0 | 0 | 0 |
| listing | {'tabelog': 8, 'tablecheck': 0, 'google-places': 5} | {'tabelog': 0, 'tablecheck': 0, 'google-places': 0} | {'tabelog': 0, 'tablecheck': 0, 'google-places': 0} |
| firstBatch | {'tabelog': 5, 'tablecheck': 0} | {'tabelog': 0, 'tablecheck': 0} | {'tabelog': 0, 'tablecheck': 0} |
| failures | {'READ_BUDGET_EXCEEDED': 2} | {} | {} |

## Source and radius comparison

| Case / repeat | Variable group | Tabelog list,first A→B | TableCheck list,first A→B | Google exact A→B | Radius A→B |
| --- | --- | --- | --- | --- | --- |
| p2-kf-h001-20261027 / 1 | P2_1B_SEARCH_AVAILABILITY_HINTS | 1,1 → NOT_REACHED | 0,0 → NOT_REACHED | 1 → NOT_REACHED | 40 → NOT_REACHED |
| p2-kf-h001-20261027 / 2 | P2_1B_SEARCH_AVAILABILITY_HINTS | 1,1 → NOT_REACHED | 0,0 → NOT_REACHED | 1 → NOT_REACHED | 44 → NOT_REACHED |
| p2-kagurazaka-kaiseki-20261029 / 1 | P2_1B_SEARCH_AVAILABILITY_HINTS | 0,0 → NOT_REACHED | 0,0 → NOT_REACHED | 0 → NOT_REACHED | 44 → NOT_REACHED |
| p2-kagurazaka-kaiseki-20261029 / 2 | P2_1B_SEARCH_AVAILABILITY_HINTS | 0,0 → NOT_REACHED | 0,0 → NOT_REACHED | 0 → NOT_REACHED | 44 → NOT_REACHED |
| p2-kf-h005-20261029 / 1 | P2_1B_SEARCH_AVAILABILITY_HINTS | 1,0 → NOT_REACHED | 0,0 → NOT_REACHED | 0 → NOT_REACHED | 49 → NOT_REACHED |
| p2-kf-h005-20261029 / 2 | P2_1B_SEARCH_AVAILABILITY_HINTS | 1,0 → NOT_REACHED | 0,0 → NOT_REACHED | 0 → NOT_REACHED | 49 → NOT_REACHED |
| p2-kichijoji-tempura-20261027 / 1 | P2_1B_SEARCH_AVAILABILITY_HINTS | 1,1 → NOT_REACHED | 0,0 → NOT_REACHED | 1 → NOT_REACHED | 50 → NOT_REACHED |
| p2-kichijoji-tempura-20261027 / 2 | P2_1B_SEARCH_AVAILABILITY_HINTS | 1,1 → NOT_REACHED | 0,0 → NOT_REACHED | 1 → NOT_REACHED | 50 → NOT_REACHED |
| p2-kf-h002-20261031 / 1 | HARD_KEYWORD_CORRECTION | 1,0 → NOT_REACHED | 0,0 → NOT_REACHED | 0 → NOT_REACHED | 10 → NOT_REACHED |
| p2-nakameguro-yakiniku-20261030 / 1 | P2_1B_SEARCH_AVAILABILITY_HINTS | 1,1 → NOT_REACHED | 0,0 → NOT_REACHED | 1 → NOT_REACHED | 43 → NOT_REACHED |

## Resources A → B

Elapsed is formal probe wall time, excluding external preflight. Shared text planning is counted once.

| Case / repeat | Models | Elapsed ms | Pages | Planning calls/ms | Planning timeouts | B Google formal |
| --- | --- | --- | --- | --- | --- | --- |
| p2-kf-h001-20261027 / 1 | 4 → NOT_REACHED | 79187 → NOT_REACHED | 7 → NOT_REACHED | 3/6958 → NOT_REACHED | 0 → NOT_REACHED | NOT_REACHED |
| p2-kf-h001-20261027 / 2 | 4 → NOT_REACHED | 100591 → NOT_REACHED | 7 → NOT_REACHED | 3/9659 → NOT_REACHED | 0 → NOT_REACHED | NOT_REACHED |
| p2-kagurazaka-kaiseki-20261029 / 1 | 9 → NOT_REACHED | 126650 → NOT_REACHED | 8 → NOT_REACHED | 1/2135 → NOT_REACHED | 0 → NOT_REACHED | NOT_REACHED |
| p2-kagurazaka-kaiseki-20261029 / 2 | 9 → NOT_REACHED | 96753 → NOT_REACHED | 8 → NOT_REACHED | 1/2306 → NOT_REACHED | 0 → NOT_REACHED | NOT_REACHED |
| p2-kf-h005-20261029 / 1 | 3 → NOT_REACHED | 82361 → NOT_REACHED | 6 → NOT_REACHED | 2/4615 → NOT_REACHED | 0 → NOT_REACHED | NOT_REACHED |
| p2-kf-h005-20261029 / 2 | 3 → NOT_REACHED | 86541 → NOT_REACHED | 6 → NOT_REACHED | 2/5436 → NOT_REACHED | 0 → NOT_REACHED | NOT_REACHED |
| p2-kichijoji-tempura-20261027 / 1 | 3 → NOT_REACHED | 100222 → NOT_REACHED | 6 → NOT_REACHED | 2/5980 → NOT_REACHED | 0 → NOT_REACHED | NOT_REACHED |
| p2-kichijoji-tempura-20261027 / 2 | 3 → NOT_REACHED | 84654 → NOT_REACHED | 6 → NOT_REACHED | 2/5844 → NOT_REACHED | 0 → NOT_REACHED | NOT_REACHED |
| p2-kf-h002-20261031 / 1 | 7 → NOT_REACHED | 101016 → NOT_REACHED | 9 → NOT_REACHED | 4/8535 → NOT_REACHED | 0 → NOT_REACHED | NOT_REACHED |
| p2-nakameguro-yakiniku-20261030 / 1 | 4 → NOT_REACHED | 84198 → NOT_REACHED | 7 → NOT_REACHED | 2/4629 → NOT_REACHED | 0 → NOT_REACHED | NOT_REACHED |

## Search-filter observations and raw paths

APPLIED is an executor diagnostic, not an independent availability verdict. Inspect the linked recording for source-selected values. Empty or unconfirmed hints do not imply no tables.

## Preflight, integrity and cumulative usage

| Index | Status | Formal started | Models | Preflight evidence |
| --- | --- | --- | --- | --- |
| 0 | NO_PROBE_SUMMARY / approved setup restoration | False | 0 | Preflight NOT_ENTERED; missing frozen-file deployment (recovery/setup-proof.json), not SOURCE_DATA_NONEMPTY |
| 0 | ENV_FAILURE | False | 0 | [{'reason': 'NO_RESPONSE', 'responseStatus': 503, 'sourceId': 'tablecheck', 'outcome': 'FAILED', 'countsTowardStop': True, 'phase': 'NETWORK_READINESS'}] |
| 0 | ENV_FAILURE | False | 0 | [{'reason': 'NO_RESPONSE', 'responseStatus': 503, 'sourceId': 'tablecheck', 'outcome': 'FAILED', 'countsTowardStop': True, 'phase': 'NETWORK_READINESS'}] |

New formal probes **0**, models **0**, Google formal/preflight **0/0**. Cumulative **44/55 probes**, **278/450 models**, **117 Google**. Full Live added **0**.
New countable preflight failures 2; checkpoint origin0; stop={'code': 'TABLECHECK_503_PERSISTED_AFTER_RETRY', 'index': 0, 'checkpointPreflightFailures': 2, 'sourceIds': []}. No completed formal probe rerun. Decision outcomes `{}`; no formal decisions or recordings were created, so capture integrity has no formal-run denominator. 329 frozen hashes and 2893 historical hashes verified; worktree clean. Compressed artifact estimate 44724575 bytes, limit60000000.

H002 before/after actual request contexts and observed counts are separate from P2-1b effects on the other nine rows. All product/source limitations, including disabled TableCheck filtering and region-navigation budget failures, remain in the raw record. No product changes after a37e152, full Live or witness refresh; only the explicitly approved setup recovery described below. Stop for independent review.


## Final environment stop and approved recovery

The initial setup failure occurred before preflight: the frozen reviewed-reads.json had not been deployed into the host worktree. It consumed0 network/model/Google discovery calls and0 formal probes. The same-byte file was deployed, the user explicitly approved the exact recovery patch, and17 original outer controls plus10 setup admission controls passed. The source remained a37e152. See [approval](recovery/approval.json), [original failed startup](recovery/setup-failure.outer.log), [original ledger](recovery/ledger-before.json), [applied controls](recovery/setup-controls.applied.json), [old freeze](recovery/freeze-before-setup-restoration.json) and [old freeze receipt](recovery/freeze-commit-before-setup-restoration.json).

Two subsequent NETWORK_READINESS preflights received HTTP503 from GET https://www.tablecheck.com/en/ after TLS establishment. The other target observations were DeepSeek200, public Google reachability404, Tabelog200; the Google404 is the frozen reachability check, not a Places discovery call. No source-data preflight or formal browser/model stage started. A503 is not an empty search result. The evidence does not identify VPN, rate limiting or server outage as the root cause.

| Preflight | Started (Beijing UTC+8) | Finished (Beijing UTC+8) | TableCheck | Raw response metadata |
| --- | --- | --- | --- | --- |
| 1 | 2026-10-19T20:49:03.411645+08:00 | 2026-10-19T20:49:16.116776+08:00 | HTTP503 / NO_RESPONSE | [raw](runs/p2-kf-h001-20261027/attempt-1-setup-2/2026-10-19T12-49-03-820Z-d09544f5-69e6-4401-a365-2e08e2d8b201.result.json), SHA256 `b644e2000a167599972a9a58436d31926a2dc4f22d16ea31dd5fd2a889da759e` |
| 2 | 2026-10-19T20:59:43.645412+08:00 | 2026-10-19T20:59:52.985238+08:00 | HTTP503 / NO_RESPONSE | [raw](runs/p2-kf-h001-20261027/attempt-1-preflight-2/2026-10-19T12-59-44-084Z-b4982e00-3f56-4a01-acd5-f351d7876a27.result.json), SHA256 `91abeabbbbc503b6b0f2e026cb3f730e8767886f564698f0cb90fa28ff80d872` |

Retry began **627.529 seconds** after the first preflight finished (minimum600, maximum1800). The sole retry remained503, so the frozen outer stopped with TABLECHECK_503_PERSISTED_AFTER_RETRY. No further case or retry was started. Failure counters were checkpoint-local (2, origin0); the old A/B failures were not carried over.

[Timeline](preflight-timeline.json), [final ledger](ledger.json), [evaluation statuses](evaluation-status.json), [complete A versus NOT_REACHED B rows](comparison.json), [H002 separate attribution group](comparison-groups.json). No probe-summary.json, formal decisions or recording is fabricated for these unstarted runs; the two result.json files above are network preflight artifacts only, so a restaurant/Agent diagnostic evaluator is not applicable.

The aggregate.json zeros are sums over an empty set, **not** witness hit rates, zero latency claims or effectiveness scores. Code/frozen input verification is complete; corrected B website effects remain unmeasured, including H002. Existing source-owned delta is net-22 lines for this correction; no phase-wide net-zero certification is claimed. Final model/probe/Google usage remains278/450,44/55,117; full Live added0. All ten formal runs remain for a separately arranged environment recovery. No booking form, slot, payment or personal-data action was performed in this batch.

Final delivery: source correction a37e152; initial freeze3c4d241; preserved startup failure fc671b5; user-approved restoration freeze ae9288e; remote documentation-only merge4f57841 (independent selection labels and approved later Live-set, not used by this run). Final evidence commit/push is reported by the Git receipt. Source gates remain951/951 default and119/119 local Chromium, typecheck/arch/build PASS.


## 用户追加20分钟后网络复查

原两次503与`TABLECHECK_503_PERSISTED_AFTER_RETRY`停止记录保留。按用户“你等20分钟再测一下”，不早于2026-10-19 UTC13:29:14（北京时间21:29:14）单独补一次NETWORK_READINESS预检；不调用模型、不开始正式探测、不改原账本，不冒充原恢复窗口内的自动重试。计划和SHA见[独立预检目录](environment-recheck-20m/plan.json)，实际结果待追加。
