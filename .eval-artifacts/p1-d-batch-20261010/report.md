# P1-D batch 2026-10-10 — implementation and execution facts

- Status: Exposed development evidence; pending independent review; not Clean Baseline
- Document revision: 0.1
- Last updated: 2026-10-10
- No push. Main branch codex/feat-live-restaurant-read-path. Experiment stays on codex/exp-retrieval-terms, not merged.
- 278 protected Gold/variant/witness/seed/recording files: final SHA256 check has zero differences (`protected-final-check.json`). Three pre-existing presentations untouched.

## Commits and gates

| Item | Local commit | Four gates | npm test | Effective red / final green |
|---|---|---|---|---|
| 0 reviewer artifacts | `32fd4eb` | all 0 | 811 passed | docs-only: behavioral red N/A; original SHA256 + review-artifacts/gates.json |
| 1 explicit C3b completion | `920bad9` | all 0 | 828 passed | C3b-completion/red-contract.log, red-changing-results.log, red-sen-hidden-times.log → gates.json / browser-fixture-final.log |
| 2 frozen kf-h005 retest | `c0bccf1` | all 0, frozen runtime | 828 passed | kf-h005-retest/attempt-1.log (preflight 503), recovery-check-1.json (206) → attempt-2.log + gates.json |
| 3 replay matcher | `e1e0cfe` | all 0 | 832 passed | replay-matching/red-matcher.log → green-matcher.log, green-replay-tests.log, gates.json |
| 4 P1-D | `87aeffe` | all 0 | 837 passed | P1-D/red-hardcoded-route.log; initial Asakusa 3/10 → final confirmation 6/10, gates.json, green-chromium-location.log |
| 5 isolated retrieval experiment | `76213a413d5dd5d76e7a85a3c0020fe0b9380a9d` | all 0 | 844 passed | retrieval-terms/red-baseline-action.log, first-full-gate-red.log → gates.json, composition-and-fixture-green.log, wire-green.log |

All items have DEVLOG / TEST-LOG / monthly-index / STATUS entries on their own branches. Item 5 ADR-0041 is Proposed and draft / not integrated, preserved only on the experiment branch.

## 0 raw reviewer files

Unmodified Playbook 0.9, p1-c3b independent review, seeds.v6 were committed. Also raw previously untracked/ignored reviewer evidence discovered and committed:

- .eval-artifacts/known-feasible-baseline-20261008/witnesses.postrun-recheck-20261009.json
- .eval-artifacts/known-feasible-baseline-20261008/witnesses.prequalified-20261008.json
- .eval-artifacts/known-feasible-baseline-20261008/witnesses.prerun-recheck-20261009-kf-h003-h005.json
- .eval-artifacts/known-feasible-baseline-20261008/witnesses.prerun-recheck-20261009-night-kf-h001-h003.json
- .eval-artifacts/phase1-replay/seeds.v1.json
- .eval-artifacts/phase1-replay/seeds.v2.json
- .eval-artifacts/phase1-replay/seeds.v3.json

## 1 C3b — offline and navigation-only

Complete=true now requires resultKey + resultBusy by type. No whole-page busy fallback; source predicates bind list/results or requested slot region. Type negative, unrelated loader, bound skeleton and changing keys are covered. Recorded Sen selected-date/no-visible-slot fixture remains UNKNOWN / EXTRACTION_FAILED; hidden templates are excluded.

40 navigations in two rounds, zero model calls; final 20-URL median wait 1228.5 ms. All 3/3 displayed name-search pages complete. The three Tabelog name searches were visibly zero results, still incomplete under item 1 (empty handling belongs to item 5). Original 12 URLs did not regress. TableCheck geo_distance=3km displayed 16 results and completes. Witness detail GET pages settled, but their date/party controls were not selected by navigation alone; no click was used and no availability completion is claimed.

Every full resultKey and timeout diagnostic (pending resource counts, ages, busy selectors, changing text, actual URL), per URL, is retained in `C3b-completion/round2/probe-results.json` and `C3b-completion/probe-summary.json`; raw snapshots/recordings are local evidence.

| URL | kind | settlement / completion | wait ms | busy | parser count | visible results | full key / timeout evidence |
|---|---|---|---|---|---|---|---|
| https://tabelog.com/en/tokyo/A1303/A130301/13203305/ | tabelog-detail | SETTLED / True | 1227 | False | None | None | probe-results.json record 1 |
| https://tabelog.com/en/tokyo/A1303/A130301/13308491/ | tabelog-detail | SETTLED / True | 1230 | False | None | None | probe-results.json record 2 |
| https://tabelog.com/en/tokyo/A1303/A130301/13275802/ | tabelog-detail | SETTLED / True | 1233 | False | None | None | probe-results.json record 3 |
| https://tabelog.com/en/tokyo/A1303/A130301/rstLst/ | tabelog-list | SETTLED / True | 1224 | False | 20 | True | probe-results.json record 4 |
| https://tabelog.com/en/tokyo/A1303/A130301/rstLst/sushi/ | tabelog-list | SETTLED / True | 1226 | False | 20 | True | probe-results.json record 5 |
| https://www.tablecheck.com/en/heichan | tablecheck-outlet | SETTLED / True | 1320 | False | None | None | probe-results.json record 6 |
| https://www.tablecheck.com/en/manten-sushi-nihonbashi | tablecheck-outlet | SETTLED / True | 1316 | False | None | None | probe-results.json record 7 |
| https://www.tablecheck.com/en/seamon-nihonbashi | tablecheck-outlet | SETTLED / True | 1339 | False | None | None | probe-results.json record 8 |
| https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6697&geo_longitude=139.767&geo_distance=3km&auto_geolocate=false&search_text=local+food | tablecheck-search | SETTLED / True | 5215 | False | 16 | True | probe-results.json record 9 |
| https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6697&geo_longitude=139.767&search_text=local+food | tablecheck-search | SETTLED / True | 5218 | False | 16 | True | probe-results.json record 10 |
| https://www.tablecheck.com/en/shops/portopia-saku/reserve?start_date=2026-10-21&pax=4 | tablecheck-reserve | SETTLED / False | 724 | False | None | None | probe-results.json record 11 |
| https://www.tablecheck.com/en/shops/omotenashi/reserve?start_date=2026-10-21&pax=4 | tablecheck-reserve | SETTLED / False | 396 | False | None | None | probe-results.json record 12 |
| https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&search_text=Sushi+Teppen%28Shibuya%29&geo_latitude=35.662966399999995&geo_longitude=139.69562399999998&geo_distance=5km&auto_geolocate=false | tablecheck-name-search | SETTLED / True | 5231 | False | 50 | True | probe-results.json record 13 |
| https://tabelog.com/en/tokyo/rstLst/?sw=Sushi%20Teppen(Shibuya) | tabelog-name-search | SETTLED / False | 319 | False | 0 | False | probe-results.json record 14 |
| https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&search_text=Sushi+Suga&geo_latitude=35.656977000000005&geo_longitude=139.7039981&geo_distance=5km&auto_geolocate=false | tablecheck-name-search | SETTLED / True | 5212 | False | 19 | True | probe-results.json record 15 |
| https://tabelog.com/en/tokyo/rstLst/?sw=Buco%20di%20Muro%20NTV%20Plaza | tabelog-name-search | SETTLED / False | 318 | False | 0 | False | probe-results.json record 16 |
| https://tabelog.com/en/tokyo/rstLst/?sw=Tsukishima%20Monja%20Moheji%20Ningyocho | tabelog-name-search | SETTLED / False | 316 | False | 0 | False | probe-results.json record 17 |
| https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&search_text=Denny%27s+Hamamatsuch%C5%8D&geo_latitude=35.656813299999996&geo_longitude=139.75706409999998&geo_distance=5km&auto_geolocate=false | tablecheck-name-search | SETTLED / True | 5216 | False | 35 | True | probe-results.json record 18 |
| https://tabelog.com/en/tokyo/A1301/A130101/13305528/?svd=20261021&svps=4&svt=1800 | tabelog-witness-availability | SETTLED / False | 1040 | False | None | None | probe-results.json record 19 |
| https://tabelog.com/en/tokyo/A1301/A130101/13280412/?svd=20261021&svps=4&svt=1800 | tabelog-witness-availability | SETTLED / False | 1045 | False | None | None | probe-results.json record 20 |

Null count/visibility fields are N/A for identity/availability detail probes, never a claim of zero results. Relevant stylesheet capture totals by domain: `{"tblg.k-img.com": 80, "cdn0.tablecheck.com": 8, "www.tablecheck.com": 8, "cdn2.tablecheck.com": 2}`. Three admitted public calendar JSON POST reads matched Accepted ADR-0035 (known read-only), zero unexpected admitted non-GET; no write or next step.

## 2 kf-h005 — one formal Live, facts only

Frozen `920bad9` on clean host worktree. Start UTC 2026-10-10T14:17:08.629Z (Tokyo 23:17 Oct 10), finish UTC 2026-10-10T14:22:14.281Z, safely before the latest-start/witness deadlines. One preflight 503 before first decision, zero calls; one authorized environment recovery/retry. Only one formal task run.

Result SUCCEEDED; failureCode None; 305451 ms; models 47; Google 0. Presented candidate Sushi Ito Akasaka (`tablecheck:sushi-ito-akasaka`). evaluator@27: all six dimensions SATISFIED; qualified result YES / PRESENTATION_RECORDED. These are automatic results, no independent attribution.

- result: `/Users/wangzhour/.codex/worktrees/p1-d-kf-h005-retest/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-10T14-17-08-629Z-f91b4338-346a-414e-b566-4153016a1259.result.json`
- decisions: `/Users/wangzhour/.codex/worktrees/p1-d-kf-h005-retest/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-10T14-17-08-629Z-f91b4338-346a-414e-b566-4153016a1259.decisions.jsonl`
- recording: `/Users/wangzhour/.codex/worktrees/p1-d-kf-h005-retest/Praxis-Zhixing/.eval-artifacts/recordings/hybrid-1791641828562/recording.json`
- evaluation: `/Users/wangzhour/.codex/worktrees/p1-d-kf-h005-retest/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-10T14-17-08-629Z-f91b4338-346a-414e-b566-4153016a1259.result.evaluation.27-1791642134463.json`

| Domain | PENDING events | PAGE_SETTLED | BOUND_RESULT_STABLE | page waits ms | paired verification ms | total ms / run |
|---|---|---|---|---|---|---|
| tabelog.com | 0 | 4 | 0 | 2056 | 0 | 2056 / 0.67% |
| www.tablecheck.com | 42 | 10 | 4 | 85817 | 2007 | 87824 / 28.75% |

Total measured waits 89,880 ms / 305,451 ms = 29.43%. This includes bounded ASYNC_WAIT waitMs plus paired VERIFY_RESULT_STABILITY elapsed; excludes navigation/snapshots. Counts are events, not unique pages. Stable events (PAGE_SETTLED + BOUND_RESULT_STABLE): Tabelog 4, TableCheck 14.

Busy completion rejections (exact raw diagnostics, two):

- diagnostic #541: tablecheck:editionhotels-tokyo-lobbybar, https://www.tablecheck.com/en/editionhotels-tokyo-lobbybar, COMPLETION_RESULT_BUSY, 7008 ms.
- diagnostic #753: tablecheck:sta-azabudai, https://www.tablecheck.com/en/sta-azabudai, COMPLETION_RESULT_BUSY, 7152 ms.

Agent selection order and categories exactly from each decision-time context (`agent-selection-names.json`; supplements nullable display names in original summary, does not alter capture):

- model #10 CHECK_AVAILABILITY: Platinum Fish OMOTENASHI Kakure (tablecheck:omotenashi), sourceCategories=[{"source": "TABLECHECK", "values": ["Seafood, Izakaya (Japanese Tavern), Japanese"]}]; The Lobby (tablecheck:the-peninsula-tokyo-the-lobby), sourceCategories=[{"source": "TABLECHECK", "values": ["Yoshoku (Japanese-style Western), Japanese Cafe, Lounge"]}]; Lobby Bar (tablecheck:editionhotels-tokyo-lobbybar), sourceCategories=[{"source": "TABLECHECK", "values": ["Bar, Lounge"]}]
- model #19 INVESTIGATE_CANDIDATE_FACTS: Lobby Bar (tablecheck:editionhotels-tokyo-lobbybar), sourceCategories=[{"source": "TABLECHECK", "values": ["Bar, Lounge"]}]; Platinum Fish OMOTENASHI Kakure (tablecheck:omotenashi), sourceCategories=[{"source": "TABLECHECK", "values": ["Seafood, Izakaya (Japanese Tavern), Japanese"]}]; The Lobby (tablecheck:the-peninsula-tokyo-the-lobby), sourceCategories=[{"source": "TABLECHECK", "values": ["Yoshoku (Japanese-style Western), Japanese Cafe, Lounge"]}]
- model #26 CHECK_AVAILABILITY: Sta.Azabudai (tablecheck:sta-azabudai), sourceCategories=[{"source": "TABLECHECK", "values": ["Dining Bar &amp; Gastro Pub, Café &amp; Coffeehouse"]}]
- model #27 INVESTIGATE_CANDIDATE_FACTS: Sta.Azabudai (tablecheck:sta-azabudai), sourceCategories=[{"source": "TABLECHECK", "values": ["Dining Bar &amp; Gastro Pub, Café &amp; Coffeehouse"]}]
- model #32 INVESTIGATE_CANDIDATE_FACTS: Lobby Bar (tablecheck:editionhotels-tokyo-lobbybar), sourceCategories=[{"source": "TABLECHECK", "values": ["Bar, Lounge"]}]; Sta.Azabudai (tablecheck:sta-azabudai), sourceCategories=[{"source": "TABLECHECK", "values": ["Dining Bar &amp; Gastro Pub, Café &amp; Coffeehouse"]}]
- model #33 CHECK_AVAILABILITY: Platinum Fish OMOTENASHI Kakure (tablecheck:omotenashi), sourceCategories=[{"source": "TABLECHECK", "values": ["Seafood, Izakaya (Japanese Tavern), Japanese"]}]; The Lobby (tablecheck:the-peninsula-tokyo-the-lobby), sourceCategories=[{"source": "TABLECHECK", "values": ["Yoshoku (Japanese-style Western), Japanese Cafe, Lounge"]}]
- model #35 CHECK_AVAILABILITY: Tempura Mochiku (tablecheck:mochiku-tempura), sourceCategories=[{"source": "TABLECHECK", "values": ["Tempura, Japanese"]}]; Akasaka Sushi Ito (tablecheck:sushi-ito-akasaka), sourceCategories=[{"source": "TABLECHECK", "values": ["Sushi, Japanese"]}]; Sushi Suitenippeki (tablecheck:suiten-ippeki), sourceCategories=[{"source": "TABLECHECK", "values": ["Sushi, Japanese, Sake &amp; Shochu Bar"]}]
- model #45 INVESTIGATE_CANDIDATE_FACTS: Akasaka Sushi Ito (tablecheck:sushi-ito-akasaka), sourceCategories=[{"source": "TABLECHECK", "values": ["Sushi, Japanese"]}]; Tempura Mochiku (tablecheck:mochiku-tempura), sourceCategories=[{"source": "TABLECHECK", "values": ["Tempura, Japanese"]}]; Sushi Suitenippeki (tablecheck:suiten-ippeki), sourceCategories=[{"source": "TABLECHECK", "values": ["Sushi, Japanese, Sake &amp; Shochu Bar"]}]

Immediately after CLI exit (within two seconds, hence within ten minutes), raw public GET find_vacancy responses for 13305528 / 13280412 / 13255508 were saved under `kf-h005-retest/witness-raw/`, each HTTP 200, with timestamp metadata. Exact four parameters rst_id, svd=20261021, svps=4, svt=1800; no other parameters or form navigation. Bodies uninterpreted, independent reviewer to judge.

## 3 replay matcher — zero new model calls

excludeCandidateIds disjointness and candidateIdsExact unordered set equality have positive/negative controls; unknown fields hard-fail before calls. All 132 original actions were processed: 18 pass, 86 fail, 28 originally invalid/unscorable outputs remain null. First 128 scores have zero differences against v4/v5 (including nulls); this is scorer consistency, not 132 behavior passes. Live originals 0129/0130 fail, 0131/0132 pass. Twelve saved original/categories-mode C8 outputs all pass, no missing-field recapture and zero paid calls. Full action/score records: replay-matching/summary.json and captured-v6.scores.json.

## 4 P1-D — discovery only

ADR-0040 Accepted with user approval 2026-10-10; ADR-0037 original Decision 4 preserved, partial supersession appended. tabelogRegions/tabelogRegion deleted, no old-map fallback. Observed links or authoritative LOCATION select region; coordinate radius is still independently checked. Only exactly first five and at least four observed outside permit one entry replacement, unknown coordinates do not count outside; budgets not reset. Offline controls plus one real Chromium test (two subcases) pass.

Eight approved discovery-only probes, total ten model calls, each at most six models / 90 seconds. Initial broad Asakusa entry failed 3/10; completion now requires the observed specific named entrance, and a final probe reached its child. Original-location Shibuya was rechecked.

| Place / final evidence | within fixed first-ten denominator | inspected / unread | elapsed ms | models | outcome |
|---|---|---|---|---|---|
| Ebisu | 0/10 | 5 / 5 | 35438 | 1 | FAIL |
| Roppongi | 9/10 | 10 / 0 | 60351 | 1 | PASS |
| Nihonbashi | 9/10 | 10 / 0 | 50515 | 1 | PASS |
| Ikebukuro | 8/10 | 10 / 0 | 49573 | 1 | PASS |
| Asakusa | 6/10 | 8 / 2 | 69589 | 3 | PASS |
| Shibuya | 6/10 | 10 / 0 | 58938 | 1 | PASS |

Five new places reach 4/5; Ebisu failed: same-request Google resolution returned Jupiter, Florida (US), so no Tokyo success was claimed or substituted. Final Asakusa/Shibuya probes explicitly use the corrected completion rule; the other three passing initial entries already named the requested area. Raw probe snapshots, decisions, location and first-ten coordinates retained locally under P1-D/probes and probes-final. No inventory/HARD/qualified delivery is claimed from discovery. No unexpected admission or next step observed.

## 5 retrieval experiment — not merged

Branch codex/exp-retrieval-terms, parent 87aeffe, commit `76213a413d5dd5d76e7a85a3c0020fe0b9380a9d`. Worktree `/Users/wangzhour/.codex/worktrees/exp-retrieval-terms/Praxis-Zhixing`. ADR `/Users/wangzhour/.codex/worktrees/exp-retrieval-terms/Praxis-Zhixing/docs/decisions/0041-observed-retrieval-terms-experiment.md`, Proposed. Browser schema12/prompt17; Agent schema5/prompt25; experimental State15/TaskDefinition14; no existing persistent state read or changed. Main remains State14/TaskDefinition13.

Implements observed-name search terms, once-only 0–1 result adjustment or existing observed-category route, and exact visible quote + zero parser result + current query + stable/busy checks for completed-empty search. Public source GETs use source grammar and Guard, Executor has no site branch. New empty reads remain UNKNOWN for unverified inventory; no HARD/identity/location/date/pax/freshness qualification is relaxed.

8 targeted tests pass across wire, Executor, Adapter and Router/Chromium; 11 original model-visible Teppen/local-food observations preserved with provenance SHA256 and CSS-visibility limitations. Invalid name words, repeated adjustment, absent quote, nonzero parser and busy region fail closed. Guard-bound Chromium HAR verifies one GET and visible empty quotation (two subcases). Existing normal end-to-end control also passes with the same 1000-ms deadline after its model substitute responds to the new confirmation. No new model replay or live site test: zero calls out of optional budget 20, effects not established. Safe recorder action projection still omits arbitrary free text; raw decisions are required for future new-action replay.

## Calls, boundaries and stopping point

| Scope | models |
|---|---|
| Prior completed batch | 332 |
| C3b navigation-only | 0 |
| Formal kf-h005 retest | 47 |
| Matcher / saved C8 rescore | 0 |
| P1-D discovery probes (separate) | 10 |
| Retrieval offline fixtures | 0 |
| Cumulative | 389 / 1500 |

Non-P1-D subtotal 379/1500; P1-D discovery 10 separately. Batch increments 57. No push, no merge of experiment, no booking/payment/PII step, no new full Live beyond approved retest. Raw evidence and proposed experiment await independent review; implementation stops here.
