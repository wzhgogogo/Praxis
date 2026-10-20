# P2-2 recorded region diagnosis

Evidence: exposed historical traces; 0 model/network calls, no product/ADR/native-restaurant-search change. Thirty formal discovery probes: ten network-restored baseline and ten each from corrected A and DOM A. Defective old A1 and preflight-only failures are not treated as these formal probes.

| Cohort / case / attempt | Tabelog result | Actual last source page |
|---|---|---|
| P21_BASELINE / p2-kagurazaka-kaiseki-20261029 / 1 | EXTRACTION_FAILED | https://tabelog.com/en/tokyo/C13104/rstLst/ |
| P21_BASELINE / p2-kagurazaka-kaiseki-20261029 / 2-preflight-2 | EXTRACTION_FAILED | https://tabelog.com/en/tokyo/C13104/rstLst/ |
| P21_BASELINE / p2-kf-h001-20261027 / 1 | Source batch returned | https://tabelog.com/en/tokyo/A1303/A130302/13244783/ |
| P21_BASELINE / p2-kf-h001-20261027 / 2 | Source batch returned | https://tabelog.com/en/tokyo/A1303/A130302/13244783/ |
| P21_BASELINE / p2-kf-h002-20261031 / 1 | Source batch returned | https://tabelog.com/en/tokyo/A1301/A130101/13283245/ |
| P21_BASELINE / p2-kf-h005-20261029 / 1 | DISCOVERY_SOURCE_LOCATION_UNGROUNDED | https://tabelog.com/en/tokyo/rstLst/ |
| P21_BASELINE / p2-kf-h005-20261029 / 2 | DISCOVERY_SOURCE_LOCATION_UNGROUNDED | https://tabelog.com/en/tokyo/rstLst/ |
| P21_BASELINE / p2-kichijoji-tempura-20261027 / 1 | Source batch returned | https://tabelog.com/en/tokyo/A1320/A132001/13285292/ |
| P21_BASELINE / p2-kichijoji-tempura-20261027 / 2 | Source batch returned | https://tabelog.com/en/tokyo/A1320/A132001/13285292/ |
| P21_BASELINE / p2-nakameguro-yakiniku-20261030 / 1 | AGENT_EXECUTION_FAILED | https://tabelog.com/en/tokyo/A1316/A131601/ |
| P21_A_CORRECTED / p2-kagurazaka-kaiseki-20261029 / 1 | READ_BUDGET_EXCEEDED | https://tabelog.com/en/rstLst/ |
| P21_A_CORRECTED / p2-kagurazaka-kaiseki-20261029 / 2 | READ_BUDGET_EXCEEDED | https://tabelog.com/en/tokyo/A1304/A130401/ |
| P21_A_CORRECTED / p2-kf-h001-20261027 / 1 | Source batch returned | https://tabelog.com/en/tokyo/A1303/A130302/13244783/ |
| P21_A_CORRECTED / p2-kf-h001-20261027 / 2 | Source batch returned | https://tabelog.com/en/tokyo/A1303/A130302/13244783/ |
| P21_A_CORRECTED / p2-kf-h002-20261031 / 1 | Source batch returned | https://tabelog.com/en/tokyo/A1301/A130101/13326101/ |
| P21_A_CORRECTED / p2-kf-h005-20261029 / 1 | Source batch returned | https://tabelog.com/en/tokyo/A1301/ |
| P21_A_CORRECTED / p2-kf-h005-20261029 / 2 | Source batch returned | https://tabelog.com/en/tokyo/A1301/ |
| P21_A_CORRECTED / p2-kichijoji-tempura-20261027 / 1 | Source batch returned | https://tabelog.com/en/tokyo/A1320/A132001/13325149/ |
| P21_A_CORRECTED / p2-kichijoji-tempura-20261027 / 2 | Source batch returned | https://tabelog.com/en/tokyo/A1320/A132001/13325149/ |
| P21_A_CORRECTED / p2-nakameguro-yakiniku-20261030 / 1 | Source batch returned | https://tabelog.com/en/tokyo/A1317/A131701/13278133/ |
| P21_A_DOM / p2-kagurazaka-kaiseki-20261029 / 1 | READ_BUDGET_EXCEEDED | https://tabelog.com/en/tokyo/A1304/A130401/ |
| P21_A_DOM / p2-kagurazaka-kaiseki-20261029 / 2 | READ_BUDGET_EXCEEDED | https://tabelog.com/en/tokyo/A1304/A130401/ |
| P21_A_DOM / p2-kf-h001-20261027 / 1 | Source batch returned | https://tabelog.com/en/tokyo/A1303/A130302/13293501/ |
| P21_A_DOM / p2-kf-h001-20261027 / 2 | Source batch returned | https://tabelog.com/en/tokyo/A1303/A130302/13293501/ |
| P21_A_DOM / p2-kf-h002-20261031 / 1 | Source batch returned | https://tabelog.com/en/tokyo/A1301/A130101/13283245/ |
| P21_A_DOM / p2-kf-h005-20261029 / 1 | Source batch returned | https://tabelog.com/en/tokyo/A1301/A130101/13291436/ |
| P21_A_DOM / p2-kf-h005-20261029 / 2-preflight-2 | Source batch returned | https://tabelog.com/en/tokyo/A1301/A130101/13291436/ |
| P21_A_DOM / p2-kichijoji-tempura-20261027 / 1 | Source batch returned | https://tabelog.com/en/tokyo/A1320/A132001/13245086/ |
| P21_A_DOM / p2-kichijoji-tempura-20261027 / 2 | Source batch returned | https://tabelog.com/en/tokyo/A1320/A132001/13245086/ |
| P21_A_DOM / p2-nakameguro-yakiniku-20261030 / 1 | Source batch returned | https://tabelog.com/en/tokyo/A1317/A131701/13234362/ |

## Supported findings

- Baseline:5/10 Tabelog failures (Kagurazaka2 extraction, KF-H0052 location ungrounded, Nakameguro1 Agent execution). Corrected A and DOM A each retain2/10 Kagurazaka page-budget failures. This is retrospective classification, not a measured effect of the new availabilityPath hint.
- Kagurazaka baseline: observed choice moves through Search by address to Shinjuku City /C13104/rstLst. Subsequent captures repeatedly click the same city/menu after feedback that the click made no visible change. No more-specific Kagurazaka entrance was confirmed.
- Four Kagurazaka A failures: observed sequence enters A1304 (label Shinjuku & Yoyogi & Okubo), then A130401 (Shinjuku), returns to a parent or regional list and enters the child again before the region-page ceiling stops it. The model justification says municipal Shinjuku implies this source region; this justification is not source evidence that the hierarchy is correct for Kagurazaka.
- Raw source homepage HTML separately offers Iidabashi /A1309. Historical candidate pointers for nearby outlets use A1309/A130905. These are diagnosis leads, not a hardcoded map or proof that any A1309 page meets the requested area. No recorded accepted Kagurazaka subregion path is available here, so the correct shortest route remains NOT_COVERED.
- KF-H005 baseline: repeated Tokyo-menu clicks receive explicit no-visible-change feedback; model reasons mention Ginza but the source region never grounds. The failure is a recorded lack of source-location confirmation, not evidence that no nearby restaurant exists.
- Nakameguro baseline: progression moves via Meguro broad and station pages, then back to the parent; the recorded terminal code is AGENT_EXECUTION_FAILED. The unmodified action/feedback sequence is in JSON; that code alone is insufficient to attribute the deeper contract failure.

## Scoped next step

The evidence supports investigating use of an observed public location search and rejecting already-visited parent transitions. A1304 cannot be accepted solely from a municipal-area inference. Any actual region-selector/completion change stays outside this work package; no ADR-0040 change, new place map, extra budget or source probe was made. Per-decision targets, progress, source URLs, recording SHA and cautious attributions are in `region-diagnosis.json`.
