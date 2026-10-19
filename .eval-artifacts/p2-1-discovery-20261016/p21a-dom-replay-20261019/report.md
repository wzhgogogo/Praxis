# P2-1a DOM categories and bounded retrieval correction

Status: development evidence; implementation gates passed, model replay not yet started. This is not a clean holdout, delivery acceptance, or P2-1b.

The user instruction after review ee7978c authorizes same-region Pack-valid DOM categories without a CSS-visibility gate, duplicate-expression rejection, 14 offline model decisions, and a conditional new A10. Starting totals: 198/450 model calls, 31/42 discovery probes, 79 Google requests, 0 full Live in P2-1. Historical inputs, recordings, witnesses and seeds remain unchanged.

| Item | Evidence | Result |
| --- | --- | --- |
| DOM category extraction | categories/production-inventory.json; categories/red-css.log; categories/green-css.log | Actual unique Pack-valid DOM counts: h001 5, Kichijoji 9, Nakameguro 9, KF-H005 0. Extra coded links remain legal under the unchanged Pack grammar; the review's 7/5 excludes them. No filtering to force expected numbers. |
| Google shared keyword | google/original-ten-google-evidence.json; google/current-production-green.log | All 10 original A traces use GOOGLE_TEXT_SEARCH with the shared keyword. The hypothesized production regression was not reproduced. Actual three-source request regression added. |
| Google test sensitivity | google/controlled-disconnection-red.log | Removing the already-existing shared-keyword restoration makes the new assertion fail. This is a controlled disconnection, not an old-code defect/red. The production line was restored before gates. |
| Empty-result planning / duplicate expressions | retrieval/red.log; retrieval/green-final.log | Prompt@3 supplies actual attempted expressions. The executor rejects a repeated expression within the original bounded rewrite budget, without a model retry; GENERAL is not retried if already used. |
| Five gates | gates/results.json and individual logs | typecheck, arch:check, build PASS; npm test 943/943; local Chromium 117/117. |

Raw DOM inventory reads the 10 saved recordings offline and calls the production category extractor. The old captured category context is empty in all 14 page-planning requests. Some planning snapshots were not persisted: 6 have exact DOM; 7 can inject categories from a later same-region recorded DOM as a counterfactual; 1 has no same-region DOM and retains an empty list. The replay must disclose this provenance and does not reconstruct an entire browser session.

The replay gate is fixed before calls: an accepted CATEGORY or COMBINED choice selecting the supplied sushi/tempura/yakiniku category for at least two distinct cases among h001, Kichijoji and Nakameguro. Repeats of one case count once. A gate pass permits A10 only; it does not prove improved discovery or qualification. If the gate fails, stop without website probes.

Proof scope so far: L0 validation and L1 production assembly/local Chromium. L3 model replay and conditional read-only website probes are pending. End-to-end delivery, identity/HARD/availability and S0 claims are not evaluated by this offline slice. No P2-1b, booking form, payment or personal-information operation is included.

## Correction commit and replay freeze

Items 1-3 committed as `ba20b8a7e0ae5d00d93838f7f19b0ae01364e2be`. No Google production patch was needed; the existing keyword path is covered by the new three-source request assertion.

The 14 requests, original input provenance, exact endpoint and fixed gate are frozen in prepared-requests.json, payload-audit.json and replay-freeze.json. Freeze SHA-256: `874320b9cc7151495a7f495e1a6410f23b52abb315799abe366fdde63dfed62f`. Offline empty run passed with 0 network/model calls (replay-dry-run.log). Source files still match the five-gate hashes. Only the repository configured DeepSeek beta structured-output endpoint is permitted by this one-shot replay executor.

## Offline real-model single-decision replay

Replay preparation commit: `4017981`. 14/14 calls succeeded; 14 charged model calls, 0 website/Google calls. Cumulative models 212/450, probes31/42, Google79. Gate PASS: h001, Kichijoji and Nakameguro all selected their supplied relevant category (3 distinct cases, required2). Only this narrow decision feasibility was evaluated. The 7 later-DOM inputs remain explicitly counterfactual; H002 has a missing-DOM evidence gap.

| Run index / decision | Original choice | New choice / expression | Category provenance | Model reason |
| --- | --- | --- | --- | --- |
| 0 / #2 | KEYWORD | KEYWORD omakase | LATER_SAME_REGION_DOM_COUNTERFACTUAL | Retrieve Shibuya restaurants matching the hard criterion "omakase" via keyword search. |
| 0 / #3 | KEEP | CATEGORY https://tabelog.com/en/tokyo/A1303/rstLst/sushi/?sw=omakase | EXACT_RECORDED_PLANNING_DOM | Only 3 results shown; expanding to the supplied Sushi category, the most relevant category for omakase, to surface more candidates. |
| 1 / #2 | KEYWORD | KEYWORD omakase | LATER_SAME_REGION_DOM_COUNTERFACTUAL | Retrieve Shibuya restaurants matching the hard criterion "omakase" via keyword search. |
| 1 / #3 | KEEP | CATEGORY https://tabelog.com/en/tokyo/A1303/rstLst/sushi/?sw=omakase | EXACT_RECORDED_PLANNING_DOM | Only 3 results shown; expanding to the supplied Sushi category, the most relevant category for omakase, to surface more candidates. |
| 4 / #2 | KEYWORD | KEYWORD local cuisine | LATER_SAME_REGION_DOM_COUNTERFACTUAL | Search for restaurants emphasizing local food, the hard positive criterion. |
| 4 / #3 | KEYWORD | KEYWORD regional cuisine | EXACT_RECORDED_PLANNING_DOM | The exact phrase "local food" returned zero results; retry the hard criterion with a different phrasing ("regional cuisine") rather than a synonym of the same failed term. |
| 4 / #4 | KEYWORD | KEYWORD regional dishes | EXACT_RECORDED_PLANNING_DOM | Both prior keyword attempts returned explicit empty states; try a materially different keyword for the same hard criterion rather than a synonym of the failed terms. |
| 5 / #2 | KEYWORD | KEYWORD local cuisine | LATER_SAME_REGION_DOM_COUNTERFACTUAL | Search for restaurants emphasizing local food/cuisine near Ginza. |
| 5 / #3 | KEYWORD | KEYWORD regional cuisine | EXACT_RECORDED_PLANNING_DOM | The exact phrase "local food" returned an explicit empty result. Trying a materially different keyword for the same hard criterion (local/regional cuisine) rather than a synonym of the failed term. |
| 5 / #4 | KEYWORD | KEYWORD regional dishes | EXACT_RECORDED_PLANNING_DOM | Both "local food" and "local cuisine" returned zero results; try a materially different keyword for the same hard criterion rather than another synonym of the same phrase. |
| 6 / #2 | KEYWORD | CATEGORY https://tabelog.com/en/tokyo/A1320/rstLst/tempura/?sw=tempura | LATER_SAME_REGION_DOM_COUNTERFACTUAL | Supplied category "Tempura" directly matches the hard criterion; narrows the broad area listing to tempura restaurants. |
| 7 / #2 | KEYWORD | CATEGORY https://tabelog.com/en/tokyo/A1320/rstLst/tempura/?sw=tempura | LATER_SAME_REGION_DOM_COUNTERFACTUAL | Use the supplied Tempura category to retrieve tempura restaurants in the Kichijoji area. |
| 8 / #4 | KEYWORD | KEYWORD date night | EVIDENCE_GAP_NO_SAME_REGION_DOM | Retrieve restaurants suited to a first date near Higashi-ginza; current list is generic and lacks date-oriented framing. |
| 9 / #3 | KEYWORD | CATEGORY https://tabelog.com/en/tokyo/A1317/A131701/rstLst/yakiniku/?sw=yakiniku | LATER_SAME_REGION_DOM_COUNTERFACTUAL | Use the supplied Yakiniku (Japanese BBQ) category to retrieve restaurants matching the hard yakiniku criterion in Nakameguro. |

Raw outputs and usage: replay/summary.json and replay/<run>-<sequence>.json. Runtime proposals were never executed. KF-H005 choices are recorded without a quality score or causal improvement claim. New A10 is authorized by the fixed gate; the next comparison still uses baseline acfaaffa and the same input bytes.
