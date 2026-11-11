# HARD evidence scope — approved main integration

Status: implemented, user-approved main publication; fresh offline verification complete. Time: 2026-11-03T10:59:35.753049+01:00, Vienna CET UTC+01:00.

## Source and merge

Fetched main `db1f44a2238b44fa92cff58dae4e17e8903875a5` is an ancestor of the reviewed `codex/fix-phase3b-positive-hard-source-roles` @ `d58d377a2c7e31ac41262edcd0ceff16e0ff54e0`. Integration merge `172c20afd322ccb5ca7faf966bbf0eb8063bcc8a` has the identical tree to reviewed work, with no conflicts and no implementation changes. Candidate `1ee97d949e5e78b44375669739d288dfbaea1d63` adds only the integration plan, history and one zero-call ledger row. Source, fixtures, scripts, package files and TS config hashes equal the approved work exactly (`source-and-ledger.json`). State25/TaskDefinition23 and all Prompt/Schema versions remain unchanged.

The user reported independent Linux2-core/Node24 review: default1397, Chromium188 and ordinary/strict G2 all green, every pre/post tree clean. That review is recorded as user-supplied input; this report separately records the fresh macOS run below. Existing red/green, D4/menu and c05/name evidence and exact44,197-byte recovery proof remain unchanged in `../hard-evidence-scope-20261103/`.

## Fresh same-candidate gates

| Gate | Result | Seconds |
| --- | --- | ---: |
| typecheck | PASS | 0.604 |
| arch:check | PASS | 0.270 |
| npm test | 1397/1397 | 45.215 |
| build | PASS | 0.540 |
| test:browser:fixture | 188/188 | 130.342 |
| PRAXIS_G2_REQUIRE_PASS=1 test:dom-change | 5/5; all12 pages PASS | 24.445 |

Every gate ran at `1ee97d949e5e78b44375669739d288dfbaea1d63`, returned exit0 and recorded empty `git status --porcelain` before and after. No failures, skipped/todo/cancelled tests, outer timeout or retry. Raw logs and their SHA-256 receipts are in `gates/`; the unchanged outer runner SHA is frozen in `source.json`. Ordinary G2 is also the isolated first phase of the Chromium suite.

## Ledger and mode

743 prior reviewed ledger entries are preserved exactly; one offline main-integration entry gives744. Limits and cumulative counters remain unchanged. All new real model, Google, website, Live, evaluation public GET and environment-rerun calls are0. No `.env`, `answers*.json` or private holdout read. These are offline/default/local Chromium and saved-response regressions, not a new Live denominator, quality estimate or inventory claim. No A/C source or test modification was made during integration.

## Delivery

Publish only after the green checks above and a final remote-main check. Normal fast-forward publication targets `refs/heads/main`; final report commits add only this evidence/history and do not change source, fixtures, scripts or dependencies. Confirm its actual SHA with `ls-remote`, and notify C and A with that SHA. The final publication commit contains this report, so its SHA is carried in the delivery message and notifications rather than a self-reference. No follow-on implementation or Live is part of this batch.
