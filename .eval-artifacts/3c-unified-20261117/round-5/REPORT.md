# Round-5 — AFTER_WORK enum and failed-submit recovery

Status: PASS, offline-only; draft / not integrated. No new Live or Clean Baseline claim.

- Worktree: `/private/tmp/praxis-3c-unified`
- Branch: `codex/feat-web-photos-unified`
- Starting SHA: `5ab10f462680637577950a3d40f4c6c68210e4fe`
- Unique frozen source/test/orchestration SHA: `08dbec05e95793d9f94440afb083d4dfc71c0522`

## Minimal implementation

Exactly three product lines changed: the production and independent diagnostic regexes accept both `DAYPART:AFTER_WORK_BROAD_WINDOW` and `DAYPART:AFTER_WORK`; the existing-Case failure path shares busy reset, render and empty-draft restoration with the new-Case path before reporting the error. `restaurantSearchIntentFingerprint` and its entire contracts.ts blob remain unchanged; no old-state fingerprint compatibility was added.

Both unit regressions call the real `materializeRestaurantTemporalFacts` AFTER_WORK path, assert its17:30-22:00 window and actual broad-window basis, then compare against Friday11:00 AM-8:00 PM. Production returns matches=true with17:30-20:00 support; the independent diagnostic returns OPEN. Existing explicit-clock strictness and short-enum coverage remain.

The dual-size failed-submit regression uses real local Fixture HTTP/PGlite startup plus a controlled read projection retaining a qualified card beside a current clarification, and a deliberately constructed503 response. It asserts disabled booking/slot controls and hidden clarification while pending, then restored controls, the exact current clarification, a restored emptied draft and cleared send busy state. The request never reaches a real external service. No existing assertion was removed or relaxed.

## Frozen acceptance

All five gates ran sequentially on the same clean frozen SHA, without loading `.env`; every exit code is0. Browser fixtures have no outer sandbox so Replay children retain their own OS outbound denial; other gates and the visual run deny nonlocal outbound at OS level.

| Gate | Exit | Seconds | Raw summary counts |
|---|---:|---:|---|
| npm run typecheck | 0 | 0.549 | PASS |
| npm run arch:check | 0 | 0.199 | PASS |
| npm test | 0 | 60.877 | 1706/1706 |
| npm run test:browser:fixture | 0 | 390.566 | 5/5; 406/406; 411/411; 159/159 |
| npm run build | 0 | 0.541 | PASS |

Browser summaries are G2 exclusive5/5, remaining Chromium406/406, combined411/411, followed by G6 assembly159/159. Combined411 is only an aggregate; do not add it again. Default1706/1706. Final failures/skips/cancellations are0.

Formal actual HTTP/SSE/Chromium visual matrix:16/16,390x844(7),1440x900(7),960x900(2), in32.667 seconds, with41 screenshots. It retains original photo success/failure, actual SSE, inline edit/draft, G1, second-slot/B1 reload and local departure SQL assertions. Every external navigation is blocked context-wide, including new tabs; SQL writes use ephemeral PGlite, never praxis_smoke. All16 JSON records have no page error or unexpected application-console/HTTP error; expected initial401, constructed partial-image410 and blocked external navigation remain separately recorded. The new503 above is an expected development/browser regression input, not a real platform failure.

New regressions:2 materialization/diagnostic tests and2 failed-submit browser cases (390x844,1280x900), all passing in the full gates. Development2+2 logs are retained separately and are not added to the frozen gate denominators.

## Evidence and preservation

- `freeze.json`: exact source/config SHA and clean start.
- `gates/manifest.json`, `gates/*.log`: raw five-gate output, counts, exit codes and durations.
- `visual-run.json`, `visual-run.log`, `visual/manifest.json`, `visual/*.json`, `visual/*.png`: formal16-scenario evidence.
- `development-screenshots/round5-390-failed-submit-restored.png` and1280 counterpart: targeted failure-recovery rendering, captured before freezing with identical product source.
- `protected-before.json`, `protected-after.json`: previous root gates/failures, round-2/3/4 and user Live archive file sets/bytes unchanged; main/closeout HEAD/status/diff and main.env SHA unchanged; fingerprint contracts blob unchanged.

The sparse worktree check passed. No historical sample restoration, new Live/model/Google/real-website call, PostgreSQL connection/query, main merge or remote push. Test browser/server/PGlite teardown was awaited. Only a subsequent local report/artifact commit follows; tested product, tests and orchestration stay at the frozen SHA.

## Unverified

Current real-source data, actual model/provider connectivity, PostgreSQL deployment, physical Safari/Android Chrome and independent Live quality/S0 were not tested. This offline follow-up does not upgrade any prior Live capability claim.

Targeted development screenshot note: the regression intentionally closes/stubs the Case SSE stream so an unrelated update cannot mask a missing catch-path render. Its reconnecting banner is an expected isolation artifact. The formal16-scenario visual run uses real local SSE and separately verifies no unexpected application/HTTP errors.
