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
