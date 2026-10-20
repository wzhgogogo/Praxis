# P2-1 corrected checkpoint B — discovery only

Status **PARTIAL**: 1/10 recorded; stop={'code': 'PREFLIGHT_EVIDENCE_GAP', 'index': 1, 'checkpointPreflightFailures': 4, 'sourceIds': []}. Exposed development inputs; no availability investigation, delivery or full Live.

## Changes, gates and freeze

- Review4592a1e read before work; approved scope is the three corrections and checkpoint-local outer recovery only. [B 第一版 exclusion](superseded-b-first.json) preserves its3 runs/17 calls and all historical bytes; none enter this comparison. Its h001 repeat2 was QUERY_NOT_REPRESENTABLE, correcting the old report sentence.
- Production freeze `a37e152b4283d8f407c9650d19200708314e3362`; comparison A `ba20b8a7e0ae5d00d93838f7f19b0ae01364e2be`. Prior HARD correction `884c56b`, original P2-1b `4975f9f` retained. Prompt restaurant-discovery-retrieval-prompt@5; Schema restaurant_discovery_retrieval@2. [Five gates/red-green](fixes/verification.json). [Offline TableCheck diagnosis](fixes/tablecheck-diagnosis.json) used0 network/models.
- Homepage filters use the already observed same-region list root; no guessed or foreign root. Sparse (<5) with categories and rewrites remaining excludes KEEP in Schema, Domain and executor. No categories or two rewrites exhausted still permit it. Invalid proposals retain the bounded general-list fallback, without additional model retries.
- TableCheck original3 filter pages displayed Search is unavailable right now, not a normal empty list. Filter OPTIONS contained unreviewed open_from/open_until; selected labels omit the year as a secondary gap. Search filtering is now SKIPPED/FILTER_TRANSPORT_NOT_REVIEWED; ordinary discovery remains. No network permission expansion.
- Original [code/input freeze](freeze.json) binds329 files. Original reviewed-reads SHA `86c2203cba578ec604d5b87745325ad0b4e4d2b65ea08e7d53e8cb746d275f62` and historical witness bytes remain unchanged. [Original freeze receipt](freeze-commit.json), [17 original outer controls](offline-controls.json), [six plan parses](plan-only.json).
- First formal launch freeze commit `8f39756993d6fd5dd78e7f56ea4bd5d590459c38`; [390-file manifest](start-b-20261020/freeze.json), [receipt](start-b-20261020/freeze-commit.json), outer SHA `d73547dc3bb7d77bbfc145734f05dd0574698381a33ce1d33de48a028a53fe27`. New witness registry SHA `a43cfe1ba6626a4d4a692612879191f65aafe8d0302ad7633edaf6a4a6a9cf44`, earliest expiry `2026-10-21T02:47:04.643Z`. [24 launch controls](start-b-20261020/offline-controls.json) passed before execution. The frozen manifest's top-level outer/witness/expiry fields were inherited from the original freeze; use its file-SHA map, frozen launch plan and receipt for the actual active values. This metadata inconsistency is recorded, with no post-run change to frozen files.
- Current ten-minute retry freeze commit `03944f447073b222ca45f3d3de3ea04e6e7728dc`; [400-file manifest](user-retry-10m-20261020/freeze.json), [receipt](user-retry-10m-20261020/freeze-commit.json), outer SHA `df8f94aee5a0feb7ade3bf9076cac337fe99b1f873c298f01f0041458a601e97`. Same production, semantic inputs, reviewed rules and renewed witness registry. [24 offline controls](user-retry-10m-20261020/offline-controls.json), [pre-launch SHA verification](user-retry-10m-20261020/pre-launch-verification.json). This manifest's top-level active metadata and file map agree.
- Original checkpoint counter origin is0. The latest user-authorized launch retains all4 historical failures and1 prior source-preflight Google attempt; it does not reset them. Earlier authorized recoveries remain in ledger history. One unchanged production/outer/input/witness freeze was used for the formal B run. No product, Prompt, Schema, policy or input repair during execution.
- Source-owned production delta from4592a1e: source-packs +10/-32, net-22 lines. No unrelated deletions to offset shared changes. Full source/net-zero phase exit is not certified.

## Evaluation and comparison scope

- End-to-end: only the promised discovery first-batch slice is measured. Full user delivery/slot inventory NOT_EVALUATED. Listing filters never produce an Offer or availability evidence.
- Stages: source-specific witness listing/first-batch IDs; Google requires exact website-derived source ID. Similar names separate. Radius counts are parsed coordinate candidates, not qualified/deduplicated restaurants; listing hits may come from region navigation.
- Severity: independent frozen network rules audit recorded requests, separately from production Guard. ABSENT in these traces does not prove all public GETs safe; ADR-0036 residual limitations remain.
- Attribution: H002 is the approved HARD-keyword correction group; the other nine rows are P2-1b including these approved homepage/sparse-KEEP/TableCheck corrections. Source/model/live-result fluctuation prevents a statistical or single-factor causal claim. L0/L1 local evidence and real-model discovery probes are separate; no paid offline replay added.

## Aggregate (complete/common rows separated)

| Metric | A all10 | A comparable rows | B recorded rows |
| --- | --- | --- | --- |
| runs | 10 | 1 | 1 |
| models | 49 | 4 | 4 |
| elapsedMs | 942173 | 79187 | 84990 |
| planningCalls | 22 | 3 | 3 |
| planningMs | 56097 | 6958 | 6516 |
| planningTimeouts | 0 | 0 | 0 |
| listing | {'tabelog': 8, 'tablecheck': 0, 'google-places': 5} | {'tabelog': 1, 'tablecheck': 0, 'google-places': 1} | {'tabelog': 1, 'tablecheck': 0, 'google-places': 1} |
| firstBatch | {'tabelog': 5, 'tablecheck': 0} | {'tabelog': 1, 'tablecheck': 0} | {'tabelog': 1, 'tablecheck': 0} |
| failures | {'READ_BUDGET_EXCEEDED': 2} | {} | {} |

## Source and radius comparison

| Case / repeat | Variable group | Tabelog list,first A→B | TableCheck list,first A→B | Google exact A→B | Radius A→B |
| --- | --- | --- | --- | --- | --- |
| p2-kf-h001-20261027 / 1 | P2_1B_SEARCH_AVAILABILITY_HINTS | 1,1 → 1,1 | 0,0 → 0,0 | 1 → 1 | 40 → 43 |
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

Elapsed excludes external preflight. Shared text planning is counted once. No denominator treats unrun rows as successful or zero-cost runs.

| Case / repeat | Models | Elapsed ms | Pages | Planning calls/ms | Planning timeouts | B Google formal |
| --- | --- | --- | --- | --- | --- | --- |
| p2-kf-h001-20261027 / 1 | 4 → 4 | 79187 → 84990 | 7 → 8 | 3/6958 → 3/6516 | 0 → 0 | 2 |
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

### p2-kf-h001-20261027 / 1

Boundary **ABSENT**; failures `[]`; termination `ALL_PLANNED_FIRST_BATCHES_ATTEMPTED`.

- tabelog: `{"status": "APPLIED", "reason": "OBSERVED_QUERY_MATCH", "sourceUrl": "https://tabelog.com/en/tokyo/A1303/rstLst/sushi/?vac_net=1&svd=20261027&svt=1900&svps=2", "unfilteredUrl": "https://tabelog.com/en/tokyo/A1303/rstLst/sushi/", "request": {"date": "2026-10-27", "partySize": 2, "time": "19:00"}, "observed": {"date": "2026-10-27", "partySize": 2, "time": "19:00"}, "parsedCount": 11}`
- tablecheck: `{"status": "SKIPPED", "reason": "FILTER_TRANSPORT_NOT_REVIEWED", "sourceUrl": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase", "unfilteredUrl": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase"}`
- google-places: no hint reached/applicable.

Source timing/planning: `{"tabelog": {"callCount": 2, "latencyMs": 3959, "timeouts": 0, "sourceBudgetMs": 90000, "sourceElapsedMs": 55072, "retrieval": {"rewrites": 1, "regionPages": 2, "retrievalPages": 2, "history": [{"selection": {"accepted": true, "reason": "Search directly for the hard criterion \"omakase\" in the Shibuya area.", "keyword": "omakase", "criterionRef": "criterion:0"}, "elapsedMs": 23143, "parsedCount": 3}, {"selection": {"accepted": true, "reason": "Only 3 results shown; expanding to the supplied Sushi category, the most relevant observed category for omakase.", "categoryUrl": "https://tabelog.com/en/tokyo/A1303/rstLst/sushi/?sw=omakase"}, "elapsedMs": 24817, "parsedCount": 3}], "selection": {"accepted": true, "reason": "Only 3 results shown; expanding to the supplied Sushi category, the most relevant observed category for omakase.", "categoryUrl": "https://tabelog.com/en/tokyo/A1303/rstLst/sushi/?sw=omakase"}}, "failureCode": null}, "tablecheck": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": 90000, "sourceElapsedMs": 27862, "retrieval": {"selection": {"accepted": true, "reason": "Retrieve restaurants matching the hard criterion \"omakase\" in Shibuya.", "keyword": "omakase", "criterionRef": "criterion:0"}, "rewrites": 0, "regionPages": 0, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Retrieve restaurants matching the hard criterion \"omakase\" in Shibuya.", "keyword": "omakase", "criterionRef": "criterion:0"}, "elapsedMs": 13257, "parsedCount": 20}]}, "failureCode": null}, "google-places": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": null, "sourceElapsedMs": null, "retrieval": null, "failureCode": null}}`

Google recorded request context: `[{"sequence": 256, "sourceId": "google-places", "sourceRequestContext": {"textQuery": "omakase Shibuya"}, "candidates": 34}]`

- [summary](runs/p2-kf-h001-20261027/attempt-1-start-b-20261020/probe-summary.json) — SHA-256 `9919e2fd7e3cf2629558fb184bd41c863e7a7fa2906f4278cd691ab228d3c54a`
- [decisions](runs/p2-kf-h001-20261027/attempt-1-start-b-20261020/probe.decisions.jsonl) — SHA-256 `77f156b1d410c5c1fa1d6eea8281c15f7e5068eea8cc10858e828190f6007760`
- [recording](runs/p2-kf-h001-20261027/attempt-1-start-b-20261020/recording/p2-kf-h001-20261027/recording.json) — SHA-256 `df155dd348b3ad491e64abc971093a914ce7664abeee659ecfc7074751928f3c`
- [trace](runs/p2-kf-h001-20261027/attempt-1-start-b-20261020/trace.jsonl) — SHA-256 `25d2f530bbb30e1486330b174411e9717280eb7b70753b727cd71798e4920375`

Retrieval attempts (original order; repeated observations retained):

| Source | Type | Keyword/category | Parsed/displayed | URL | Decision/reason |
| --- | --- | --- | --- | --- | --- |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/139465 | https://tabelog.com/en/tokyo/ | PLANNER_AND_OBSERVED_REGION_AGENT: PRE_DETAIL_RETRIEVAL_REWRITE |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/5613 | https://tabelog.com/en/tokyo/A1303/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: PRE_DETAIL_RETRIEVAL_REWRITE |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/5613 | https://tabelog.com/en/tokyo/A1303/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: PRE_DETAIL_RETRIEVAL_REWRITE |
| tabelog | KEYWORD | omakase | 3/3 | https://tabelog.com/en/tokyo/A1303/?sw=omakase | BROWSER_AGENT_OR_SOURCE_PAGINATION: PRE_DETAIL_RETRIEVAL_REWRITE |
| tabelog | CATEGORY_OR_GENERAL_LIST | English | 20/197 | https://tabelog.com/en/tokyo/A1303/rstLst/sushi/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: PRE_DETAIL_RETRIEVAL_REWRITE |
| tabelog | SEARCH_AVAILABILITY_HINT | None | 11/90 | https://tabelog.com/en/tokyo/A1303/rstLst/sushi/?vac_net=1&svd=20261027&svt=1900&svps=2 | EXECUTOR_AUTHORITATIVE_REQUEST: OBSERVED_QUERY_MATCH |
| tabelog | SEARCH_AVAILABILITY_HINT | None | 11/90 | https://tabelog.com/en/tokyo/A1303/rstLst/sushi/?vac_net=1&svd=20261027&svt=1900&svps=2 | EXECUTOR_AUTHORITATIVE_REQUEST: OBSERVED_QUERY_MATCH |
| tablecheck | KEYWORD | omakase | 20/None | https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |
| google-places | CATEGORY_OR_GENERAL_LIST | None | None/None | google-places:nearby-search | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |

## Preflight, integrity and cumulative usage

| Index / repeat | Outer start UTC | Outcome | Models | Observation |
| --- | --- | --- | --- | --- |
| 0 / 1 | 2026-10-19T12:33:35.461341+00:00 | NO_PROBE_SUMMARY | 0 | Setup deployment failure; preflight NOT_ENTERED |
| 0 / 1 | 2026-10-19T12:49:03.411645+00:00 | ENV_FAILURE | 0 | TableCheck homepage HTTP503; source-data NOT_REACHED |
| 0 / 1 | 2026-10-19T12:59:43.645412+00:00 | ENV_FAILURE | 0 | TableCheck homepage HTTP503; source-data NOT_REACHED |
| 0 / 1 | 2026-10-19T14:40:31.516305+00:00 | ENV_FAILURE | 0 | TableCheck homepage HTTP503; source-data NOT_REACHED |
| 0 / 1 | 2026-10-19T14:54:30.243968+00:00 | ENV_FAILURE | 0 | TableCheck homepage HTTP503; source-data NOT_REACHED |
| 0 / 1 | 2026-10-20T02:07:09.618912+00:00 | ENV_FAILURE | 0 | Source-data failure: TableCheck/Google response unobserved; Tabelog20/200 |
| 0 / 1 | 2026-10-20T02:48:13.749379+00:00 | PROBE_RECORDED | 4 | Network passed; source-data READY: Tabelog20/200, TableCheck122/200, Google1 |
| 1 / 2 | 2026-10-20T02:50:30.050921+00:00 | ENV_FAILURE | 0 | TableCheck homepage Range GET HTTP403; source-data NOT_REACHED; frozen outer evidence gap |
| 1 / 2, approved retry | 2026-10-20T03:07:10.201608+00:00 | ENV_FAILURE | 0 | TableCheck homepage Range GET HTTP403 again; source-data NOT_REACHED |

The ledger retains4 historical countable failures. The frozen network classifier recognizes TableCheck503, but not this403: it returns `PREFLIGHT_EVIDENCE_GAP`, leaves the counter4 and stops. This is an outer diagnostic gap. The raw response is definite HTTP403 evidence; neither the counter nor frozen classifier has been changed to create a retry.

Cumulative **282/450 models**, **45/55 formal discovery probes**, **121 Google search attempts**, **0 full Live**. Current launch adds1 formal probe,4 model calls,2 formal Google plus1 source-preflight Google. Across all corrected-B attempts the Google split is2 formal +2 preflight (one preflight attempt predates this launch). Registered-witness renewal used32 public GETs,0 models and0 Google.

Decision capture4 rows =4 model calls, all SUCCEEDED; summary/decisions/recording/trace hashes independently checked. Original329 frozen hashes and2893 historical hashes remain unchanged; source262 and prior gate logs are verified for reuse: typecheck/arch/build PASS, default951/951, Chromium fixture119/119. No new L3 replay. The one recorded network audit is ABSENT within its trace scope, not a global public-read boundary certificate. The remaining9 have no formal trajectory or delivery result to evaluate. Full-task diagnostic evaluator is not applicable to this discovery-only slice.

Artifact compressed estimate 45762284 bytes /60000000; no completed formal probe rerun. H002/HARD correction was NOT_REACHED; other-nine P2-1b group has one comparable row only. No improvement or causal claim from a one-row partial run.

## October20 user-requested B launch and stop

The user requested "启动b". Before first formal B, the registered witness sets were renewed via the existing bounded certification flow:16 registered identities,32 GETs,0 model/Google calls; independently verified date/party/slot/merchant bindings. All6 active supported ID sets are identical to the previous certificate; earliest validity is 2026-10-21T02:47:04.643Z. No new witness search. [Certification freeze commit](start-b-20261020/certification-freeze.json) `0e4eed2`; [registry](start-b-20261020/witnesses.certified.json), [verification](start-b-20261020/witness-certification/verification.json), [unchanged ID sets](start-b-20261020/witness-comparison.json). Renewal was completed and frozen before the formal run, not changed mid-run.

| Plan index | Case / repeat | Outcome | Formal ms | Models | Google formal / preflight |
| --- | --- | --- | --- | --- | --- |
| 0 | h001 / 1 | PROBE_RECORDED; ALL_PLANNED_FIRST_BATCHES_ATTEMPTED | 84990 | 4 | 2 / 1 |
| 1 | h001 / 2 | ENV_FAILURE in NETWORK_READINESS, TableCheck HTTP403 | NOT_STARTED | 0 | 0 / 0 |
| 2–9 | remaining planned cases | NOT_REACHED | NOT_STARTED | NOT_STARTED | NOT_STARTED |

The second outer attempt ran UTC2026-10-20T02:50:30.050921+00:00 to2026-10-20T02:50:36.500055+00:00. Its network preflight lasted5967ms. `GET https://www.tablecheck.com/en/` with `Range: bytes=0-0` returned403 in2564ms, TLS established. DeepSeek200, public Google root404 (reachability only), Tabelog200. No source-data check, browser search or model call was started for this attempt. [Raw result](runs/p2-kf-h001-20261027/attempt-2/2026-10-20T02-50-30-493Z-ae128868-8b80-4db9-9409-5cc416468c51.result.json) SHA `da94db44eff055265925ac2ff566a1e292832aebf19fa476bb8066b85997cc6e`. This differs from the immediately preceding formal run, where TableCheck returned a20-card listing. It does not establish a persistent searchAPI outage, VPN cause or rate-limiting cause.

Denominators:10 planned,1 formally started,1 completed/scorable,0 formally interrupted,9 NOT_REACHED. Preserve index0 and all old attempts; do not rerun the completed probe. No automatic retry or further probe is scheduled. [Launch summary](start-b-20261020/launch-summary.json), [ledger-prefix synchronization proof](start-b-20261020/ledger-sync-proof.json), [previous report retained](start-b-20261020/report-before-b.md), [post-change verification](start-b-20261020/post-change-verification.json).

No production/Prompt/Schema/config/input change, no full Live or per-candidate availability investigation, and no P2-2 replay. Stop for independent review.

## User-authorized ten-minute retry: completed with homepage403

The requested retry started UTC2026-10-20T03:07:10.201608+00:00 (Beijing11:07:10), after the approved not-before UTC03:05:44; ended UTC2026-10-20T03:07:17.334641+00:00. The network preflight itself took6339ms. TableCheck homepage `GET https://www.tablecheck.com/en/`, `Range: bytes=0-0`, returned **403** in1850ms with TLS established. DeepSeek200, Tabelog200, public Google root404 (reachability only). [Raw network result](runs/p2-kf-h001-20261027/attempt-2-user-retry10m-20261020/2026-10-20T03-07-10-964Z-73adcf56-9f98-4495-8bf1-21851a86ee93.result.json) SHA `43be1d978e69d12d645dd9c43e57c07970126722fbff62d2b85c1802538c1e9d`.

No source-data search, model call, formal discovery, decision capture, browser recording or full-task evaluation was entered/created for this retry. New models/Google search attempts/formal probes all0. Current totals stay282/450 models,45/55 formal discovery probes,121Google,0fullLive; corrected B1/10 and9 formal runs NOT_REACHED. Completed index0 is unchanged and was not rerun. The frozen classifier still reports PREFLIGHT_EVIDENCE_GAP with the historical counter4; it has not been repaired or overridden to create another retry.

[Approval](user-retry-10m-20261020/approval.json), [actual execution summary](user-retry-10m-20261020/attempt-summary.json), [ledger prefix proof](user-retry-10m-20261020/ledger-sync-proof.json), [post-change verification](user-retry-10m-20261020/post-change-verification.json). The old attempts, stop history and recovery history remain. The heartbeat is paused; no further automatic retry or remaining B probe is scheduled. Source five gates reused951/951 and119/119 with unchanged262 source hashes and gate-log SHA; final checks concern evidence/docs only. Full-task or P2-1b improvement is not certified. Stop for independent review.

User subsequently instructed no further retries and a normal push of completed work. The nine unstarted formal probes remain NOT_REACHED; no new run is authorized by this report.


## New user authorization after host routing repair (pending execution)

The user requested B again after the scoped physical route was added and restaurant domain routing enabled. This supersedes the previous no-retry instruction only for pending B indices1-9. Retain completed index0 and all historical failures/calls. Production a37e152, all original inputs/witness IDs/metrics/limits unchanged; witness valid until October21. Current new capsule binds408 files with28 offline controls; no automatic extra retry. Every original network/source nonempty preflight must pass before formal discovery. [Approval](network-fixed-resume-20261020/approval.json), [freeze](network-fixed-resume-20261020/freeze.json), [offline controls](network-fixed-resume-20261020/offline-controls.json), [pre-launch verification](network-fixed-resume-20261020/pre-launch-verification.json). Preparation adds0 models/probes/Google; cumulative282/450 models,45/55 probes,121Google. Results follow separately; prior stop and report retained.
