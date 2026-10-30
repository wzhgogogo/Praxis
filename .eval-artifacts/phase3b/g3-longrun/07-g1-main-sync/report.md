# G3 synchronization after the approved G1 repair

2026-10-29T03:45:39.474513+01:00, Vienna CET (UTC+1). Work branch `codex/feat-phase3b-tabelog-observed-availability`. Synchronization complete; overall G3 remains **STOPPED_G2_SELECTED_QUERY_PUBLIC_EVIDENCE** pending a review decision on Sen. No G3 merge to main.

## G1 delivered separately

User-approved G1 repair is merged and pushed to main **`b2a3cbd30e6f0c78486cf8b8671e7820a227d550`**, checked with `ls-remote`. Work branch `codex/fix-phase3b-g1-single-sentence-ids` is published at `0dd7186124293d98eb3f8cbbafa241c4002392fe`. [Publication receipt](g1-publication.json), [full G1 report](../../g1-single-sentence-ids/report.md).

Only genuinely split lines receive sentence suffixes; unsplit lines retain the parent ID. Valid old-code fixture red → 45/45 G1 tests green; partial quotes and split-paragraph parent IDs remain rejected. Its own five gates pass (default 1201/1201; Chromium 174/174, 108.999624 seconds) plus ordinary G2 4/4, with every before/after clean. HARD output is byte-identical. Prompt/Schema 3 and Agent/State/TaskDefinition unchanged. No paid QA rerun or self-scoring.

## Main synchronization and protected inputs

Preserve published G3 `c0483509`; merge approved main `b2a3cbd3`. A's G1 review/signoff and approved test consolidation remain intact. The P21c test was moved by A into `browser-read-regions.test.ts`; B's previously verified semantic navigation/result projection follows that same corresponding test to its new file. Its complete test body equals the prior G3 body. The old discovery file exactly matches main; no retired tests were restored and no assertions changed. [Transferred input diff](moved-test-input.diff).

C's protected five files remain unchanged. All four protected tests retain their assertions and C's ranking/fragment/identity logic; the sole authorized response input is still the exact approved patch. [Preservation proof](preservation.json), [authorized C diff](../05-response-only-slots-days/authorized-c-fixture.diff).

Ledger union retains every row from G3 (471) and approved main (466), with exact equality for shared ids: 474 unique prior rows, plus one zero-call synchronization row = 475. Cumulative spend unchanged. [Union proof](ledger-union.json). Private QA answer files arrived only through the approved main merge; B did not read or edit their contents.

## Verification

Frozen merge candidate **`0073ec8df89c0d33ac24e1b3a6c94cec5c0744c6`**, 691 paths, SHA-256 `7ea38f180b4fc48a05c8d284c2adc8c66b20d23804a08c43eae801c55d6346e7`. This is integration of approved changes, with no new G3 product mechanism; existing effective G3 reds and the new G1 red remain the mechanism evidence.

| Gate | Result | Seconds |
|---|---|---:|
| typecheck | PASS | 0.445 |
| arch-check | PASS | 0.185 |
| npm-test | PASS (1213/1213) | 28.476 |
| build | PASS | 0.502 |
| browser-fixture | PASS (178/178) | 114.236 |
| dom-change | PASS (4/4) | 21.368 |

All commands start/end clean, frozen inputs unchanged, restorations 0 and failed gate repairs 0. [Gate receipt](verification/gates.json). macOS local fixtures only; no new Linux/Live result claimed. Old HARD result remains 44,197 bytes, SHA-256 `9a3298bc5e004b99e41d80713e8913b68c336cfa594f6eb60599e310ee3fb633`.

Ordinary G2 still exposes Sen's honest query-confirmation loss. It is not a strict G3 PASS. The baseline and original saved input remain unchanged. Site TypeScript lines 3,950 / source-packs.ts 478 are reference only. New real model/Google/site/Live/GET/environment calls: 0. No .env or private answers read.

## Recommendation requested by the user

[Proposed reference decision](sen-reference-review-proposal.md) is **not applied or approved**: A should record Sen query confirmation as not independently verified when the same-read public evidence is absent, preserve the original file and scoring/mutation rules, and retain separate public-evidence positive and wrong-date/wrong-party controls. Do not turn lack of evidence into a contradictory query or fabricate selection evidence. [Existing counterfactual](../06-sen-query-observability/report.md).

This acceptance premise remains a user-defined stop condition. The recommendation is not permission for B to edit A's baseline. Shared public-control/query-state work, Sen strict acceptance and G3c remain unfinished. G3 will continue after the reference decision; neither the corrected reference alone nor ordinary G2 proves production completion.

Publish the G3 work branch for review and stop here. Main contains only the separately approved G1 repair, not G3.
