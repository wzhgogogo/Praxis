# D8 frozen-main retry: single diagnostic

Source/main: `dbc2d9c55bb9dd759a17551cbe9c11af6b1073b0`. Frozen orchestration: `68e0c238053609203705489e34e82eae86889108`. Finished 2026-11-16 11:34:31 CET. Venue date/time below is JST. No booking was submitted.

## Result

One Nakamata outlet delivered for **2026-11-18 20:30 / 2 guests** with a TableCheck B1. BOOK_THIS_OUTLET retained that B1. The private-room question returned **ANSWERED** with the literal Japanese source sentence. This is one diagnostic, not a stability or generalization result.

| Turn | Seconds | Model calls |
|---|---:|---:|
| Initial delivery | 233.074 | 35 |
| BOOK_THIS_OUTLET | 20.104 | 3 |
| Private-room question | 2.300 | 1 |

All 39 model calls succeeded; total product time 256.212 seconds. Automatic evaluation remains **NOT_EVALUATED**, qualified=null, s0=0 but s0Status=NOT_EVALUATED. It is not reported as fully qualified or fully safety-certified.

## Source trajectory

Decision #6 clicks the unique full main-outlet suggestion; #7 completes on the main shop page. #31 checks availability, #32 chooses the requested date, #33 presents the sole outlet. #36 handles the booking follow-up; #37-38 truthfully return NOT_STATED for terms. #39 answers the private-room question. Recorded shop snapshots 49/50 independently contain the selected 11-18 / 2-person widget and available 20:30; snapshot 60 contains the exact cited private-room sentence. B1 parameter and source-entrance checks are in `offline-source-check.json`. The sanitized diagnostic DOM removes query-bearing anchors; this is explicitly not presented as retention of the entire literal B1 href.

Tabelog search was exercised, but no Tabelog availability offer was delivered. Other branches were not presented as the requested outlet. The successful delivered path is TableCheck.

## Independent checks and first unresolved point

Request boundary **329/329 PASS**; original B1_COPY/B1_SOURCE_URL/B1_LINK checks PASS. No confirmed S0 incident. Formal evaluation stops on six unbound qualification excerpts from list/other pages, plus G1 exact read-time matching and answer-meaning annotation. The last raw shop snapshot is 10:34:21.845Z, while the citation is timestamped 10:34:21.915Z (70 ms later). The quotation itself is present verbatim, and says private rooms are provided. Original evaluation/input remain unchanged; no unrelated branch/list was force-bound and no evaluator was changed.

Full browser/decision/Google recording enabled: 60 page observations, 53 diagnostic DOM saved, 7 omitted, 9 qualified for full replay. Diagnostic DOM availability is not full replay eligibility. The source quote is included in the saved DOM.

## Resources and protection

This attempt: **1 Live / 5 evaluation GET / 39 models / 0 reruns**. Remaining: **0 / 3 / 11 / 0**. Google requests 2; browser website requests 334 (separate from evaluation GET). Four health probes passed. No additional website/model calls were made for offline review.

Protected primary HEAD, index/diff/status, 131 untracked files, routing, 24 historical budgets and frozen source are unchanged. Frozen inputs/scripts and env hash match. See protection-comparison.json and privacy-after-live.json. The earlier health stop and failed DeepSeek attempt remain separate, immutable records. No further Live was started; source/Prompt/Skill/Guard/evaluator/config were not modified during this run.

Formal independent annotations still require reviewer resolution. B1 stock was observed at 11:33:51 CET and display validity ended 11:43:51 CET; this report does not assert current availability.
