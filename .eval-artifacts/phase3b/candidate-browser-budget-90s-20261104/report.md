# Candidate browser budget 60 → 90 seconds

2026-11-04T09:09:13+01:00, Vienna CET (UTC+1). User-approved single configuration change; offline verification only. Current evidence is exposed development material, not clean holdout or new Live. Publication SHA is supplied in the delivery receipt.

## Scope and production change

- Work branch: `codex/fix-phase3b-candidate-browser-budget`, from origin/main `be84674e`, retaining the reviewed D6 diagnosis `1aeaf7a3` unchanged.
- Formal red input: `44b9c9f8`; green/full-gate candidate: `2db49629f0f25e85daf9670919bf2b5a0b025d69`.
- **Only production numeric change: `LIVE_READ_DEBUG_INVESTIGATION_BUDGET.maxCandidateBrowserMs` 60000 → 90000.** One adjacent comment referencing the old60s candidate was corrected to describe the unchanged independent provider window.
- `live-read-assembly.ts` already binds this field to `LiveBrowserAvailability` → `BrowserTaskExecutor.maxElapsedMsPerCandidate`. The Web and Runner use that same constant; the frozen hybrid Runner's existing explicit CLI override still derives its default from it. No second candidate60s literal/window exists in this path and no compatible-old-default path was added.
- All other numeric configuration fields are byte/number equal (see config-proof.json and production-config.diff). Whole-read500000ms, provider45000ms, fact45000/30000ms, navigation20000ms cap, navigation floor3000ms, conclusion reserve20000ms, model50, Google100, sessions/matches/operation budgets unchanged. G1's independent60s question unit is a different budget and was not changed.
- No runtime/Guard/identity/ranking/adapter/parser, existing test/assertion, A/C source, Prompt/Schema/State25/TaskDefinition23 changes. The only new executable source is the budget-boundary test, plus a minimum timing JSON fixture.

## D6 fixture and red → green

`src/infrastructure/browser/fixtures/d6-candidate-budget-timing.json` cites the raw diagnostic path, A commit92bc1032, SHA-256 and capture date2026-11-04 CET. It contains timestamps only; no whole historical run/page copy. It is repository-local and portable.

The injected-clock test uses the production executor and production configuration to reconstruct the budget-relevant boundaries: same candidate across providers, switch to Tabelog at22.903s, final navigation47.053→59.262s, post-navigation wait→59.982s. Earlier work is charged as elapsed time, not asserted as a replay of source behavior. A26ms local snapshot is deliberately synthetic. The saved D6 has no completed final snapshot or availability tail; the test does not create restaurant identity/inventory facts.

| Input/config | Observation |
|---|---|
| Baseline60s, formal red on production-default case | At snapshot entry18ms remain. At simulated60.008s result is FAILED where COMPLETED is required; exit1. Snapshot-red log retained. |
| Approved90s, identical fixture/test bytes | The same local snapshot completes at60.008s. All five boundary tests pass. |
| Explicit legacy60 negative control retained | Still returns BROWSER_TIMEOUT / CANDIDATE during the snapshot. |
| Provider45 deadline control | At22.903+45=67.903s, new acquisition is rejected with scopePROVIDER. |
| Candidate90 deadline control | Provider switching cannot reset candidate wall time; at90s acquisition is rejected with scopeCANDIDATE. |
| Whole-read500 deadline control | A fresh late candidate cannot reset total elapsed; at500s acquisition is rejected with scopeRUN. |

The default case also verifies the configured single navigation cap stays20s (old effective allowance12.947s, approved effective allowance20s). Existing navigation-floor3000ms, budget/cancel/late-result controls and actual-assembly20s reserve boundary tests remain untouched and pass in the full matrix. In particular `restaurant-booking-terms-reserve.test.ts`20,001/20,000ms controls do not start optional page/model reads in the reserve; `action-validator` reserve completion and Router produced-result preservation remain.

The first fixture-development run failed at the navigation allowance assertion before reaching the snapshot assertion; it is preserved as initial-fixture-red, **not the formal snapshot red**. The formal red moved the equality check after the snapshot outcome, froze44b9c9f8, and fails precisely on FAILED versus COMPLETED. There was no production repair between those two red runs. Fixture and assertions are byte-identical from formal red to green (proof.json); only the approved production configuration/comment changes. No assertion was deleted or weakened to produce green.

## Provider45 remains a separate earlier limit

The current production availability provider window is45s. On the saved D6 provider-switch timing:

| Deadline or checkpoint | Candidate elapsed |
|---|---:|
| Tabelog provider starts |22.903s|
| Synthetic snapshot completes |60.008s|
| Tabelog provider deadline |**67.903s**|
| New candidate deadline |90.000s|

At local snapshot completion Tabelog has **7.895s** remaining, while candidate time remaining is29.992s; the smaller provider allowance still controls. A same-provider continuation reaching67.903s will therefore be cut off before90s. **The provider45s value is unchanged, as instructed, and is submitted for review.** There is no saved duration/evidence for the unexecuted identity+availability tail, so whether real D6 would finish within those7.895s is unknown. No real completion, current inventory, replay success or Live speedup is claimed.

Correction to the preserved prior diagnosis: its report §1 called the unexhausted provider budget90s, conflating the discovery source ceiling with the availability provider45s. The raw37.105s Tabelog duration and CANDIDATE failure were correct and remain so; both37.105<45 and37.105<90 hold. This report records the correction without editing the reviewed historical artifact.

## Frozen full verification

| Command | Result | Elapsed |
|---|---|---:|
| `npm run typecheck` | PASS | 0.485s |
| `npm run arch:check` | PASS | 0.196s |
| `npm test` | 1422/1422 | 52.021s |
| `npm run build` | PASS | 0.536s |
| `npm run test:browser:fixture` | Chromium189/189 + main G6 18/18 | 171.942s |
| `env PRAXIS_G2_REQUIRE_PASS=1 npm run test:dom-change` | 5/5 tests;12/12 pages PASS | 24.297s |


Each command ran on the same committed candidate with `git status --porcelain` empty before and after. No retry/skip/cancel, cleanup restoration or assertion edits. The browser entry includes current main's G6 group18/18; A's separate expanded66-test eval/runner branch is not imported or claimed to have been rerun here. Strict G2 is5/5 tests and12/12 pages PASS. These are offline/local Chromium results, not Live qualification.

Input/test/fixture/outer-script SHA are in red-inputs.json and candidate-inputs.json, frozen before their corresponding runs. Original gate log SHA-256 are in gates.json, gzip logs retain exact original bytes. Config diff and numeric equality proof are separate. Final publication changes after the tested candidate only archive evidence/status documents; executable input hashes are rechecked before push.

## Main sync, accounting, delivery

After all gates passed, a fresh fetch confirmed origin/main remains `be84674e27fdaec22de1f41af9c39ffc230dcfe4`. `git merge --ff-only origin/main` returned Already up to date; gate candidate `2db49629f0f25e85daf9670919bf2b5a0b025d69` and all frozen executable input hashes remain unchanged (main-sync.json). No new source/config integration required repeating the already-green gates. Publication is a normal fast-forward of main from that approved base; local historical main refs/worktrees are not reset. The final commit archives this report/logs and the synchronized STATUS/DEVLOG/TEST-LOG/monthly entries; it changes no tested executable input.

Shared budget ledger remains byte-identical to approved main; no historical row, total or quota was replaced. **New real model0 / Google0 / website0 / Live0 / environment rerun0.** No `.env`, `answers*.json`, private holdout or personal browser profile read. The final branch is published and fast-forwarded into main only after all requested gates pass; no force push. Remote main SHA is verified by ls-remote; A and C are notified in English after publication.
