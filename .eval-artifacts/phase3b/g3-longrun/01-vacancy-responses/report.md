# G3 Group01 — audited vacancy responses / structure drift

- Completed: 2026-10-28T16:44:48.514239+01:00 (Vienna CET, UTC+1).
- Work branch: `codex/feat-phase3b-tabelog-observed-availability`; base main `ba466eb3`.
- Frozen red commit: `c96c74361bb71b02c407279085dd28de64bf068c`.
- Implemented/tested commit: `da0546fbbb612a8386d56ced44357e0bdfd71650`; input freeze 685 paths (`input-freeze.json`), outer Python scripts included.
- Status: group COMPLETE, long batch CONTINUES. No main merge. No claim of completed G3/G3c or current Live capability.

## Change and evidence boundary

One Tabelog response validator checks the latest audited find_vacancy response, exact outlet/date/party/time, response field types and booking-link binding. Required shape drift returns `UNKNOWN / SOURCE_STRUCTURE_CHANGED` in the real Adapter result and emits an Executor diagnostic containing field/type names and observation time only. Wrong binding cannot rescue an older response. Empty and unsupported-clock collections remain UNKNOWN. Guard, identity rules, budgets, Prompt, State and TaskDefinition are unchanged.

The real local Chromium control captures the fixture's JSON, retains HIGH native identity, accepts the valid 19:00 offer and rejects the changed selection field with the explicit alert. Local interception is not a claim that this fixture verifies the isolated Guard; existing Guard/browser gates remain required and passed.

Current page-query selection checks and non-English DOM slot fallback remain for the later observation/controls group. This group does not claim OBS18 entirely removed. The approved date-only decision is recorded in ADR0048: private classes are hints only, no corresponding data evidence means UNKNOWN; A owns the fixed G2 date baseline.

## Red / green and gates

Old-code reds (`red/targeted.json`): native Adapter 7/7 assertions failed and real Chromium 1/1 failed at the target behaviour, including EXTRACTION_FAILED instead of SOURCE_STRUCTURE_CHANGED and accepting a URL/body merchant contradiction. No startup/type/environment error is counted as red. Same inputs on candidate: native 7/7 and Chromium 1/1 PASS (`green/`).

| Check | Result | Seconds |
|---|---|---:|
| typecheck | PASS | 0.516 |
| arch-check | PASS | 0.182 |
| npm-test | PASS (1210/1210) | 28.536 |
| build | PASS | 0.499 |
| browser-fixture | PASS (176/176) | 107.281 |
| dom-change | PASS (4/4) | 21.228 |

All checks recorded empty `git status --porcelain` before and after; no restoration, exclusions or E1 exception. Frozen sources verified before/after. Ordinary G2 is a regression gate, not strict G3 acceptance. Strict G2 still has the previously frozen list/calendar work outstanding.

## Preservation, tests and limits

- `preservation.json`: C identity/ranking/fragment source and four protected tests are byte-identical; no A eval/fixed fixture edits. Existing tests were not deleted/relaxed in this group; the new native and Chromium tests cover the previous missing shape/URL binding failure mechanism.
- Complete old HARD result: 44,197 bytes, SHA-256 `9a3298bc5e004b99e41d80713e8913b68c336cfa594f6eb60599e310ee3fb633`, byte-identical using the existing fixture-model compatibility runner.
- Physical production TS lines (reference only): two site directories 3,911 → 3,969; `source-packs.ts` 478 → 478. No site code relocated to Pack/common to claim a reduction.
- Ledger retains all 441 main entries, 444 current unique entries. Increment: real model/Google/site/Live/environment reruns/public GET all 0; no `.env` or private QA answers read.
- macOS offline validation only in this group; independent Linux rerun not performed here. Website compatibility and model quality remain for an authorized future Live/model round.

## Next

Continue public list text/link/addresses and semantic busy regions, observed party/date/time controls, response-based day state, then G3c. A's approved baseline merge is integrated when available. Protected C tests remain untouched; if a later removed private slot assumption requires changing a protected input, report that exact dependency first.
