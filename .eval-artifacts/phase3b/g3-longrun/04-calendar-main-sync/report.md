# B G3 — approved A calendar main synchronized

2026-10-28T17:34:28.558006+01:00, Vienna CET (UTC+1). Offline integration only; no additional G3 implementation claim.

- Work branch `codex/feat-phase3b-tabelog-observed-availability`.
- Approved A main `8454fffa8c1de62910a27e161ec4cb19aa6cd455`; previous B publication `1d7026038382baa93cedbbabc651c96b588ffe4f`.
- Frozen merge candidate `6c339ba70e60cfa17ba67e8e0b4ae04a3e1f29ee` has both commits as parents. Existing published red/green SHAs retained.
- A's run.ts / dom-change.test.ts / fixed baseline are exact approved-main bytes. Only those three source files differ from previous B; no new B product/C fixture/Prompt/State/TaskDefinition/Guard changes. History conflicts retain both sides.
- Input freeze:687 paths, SHA-256 `556f994522330e529fd90ffe77029582662989a2c8658515e78e7e1c9d557671` including outer scripts; verified before/after.

## Validation

Reuse A's approved d477d691→a6853be8 red/green and B's three completed groups; integration does not create a new behaviour or weaken any assertion.

| Check | Result | Seconds |
|---|---|---:|
| typecheck | PASS | 0.405 |
| arch-check | PASS | 0.194 |
| npm-test | PASS (1213/1213) | 27.568 |
| build | PASS | 0.411 |
| browser-fixture | PASS (178/178) | 111.821 |
| dom-change | PASS (4/4) | 21.067 |

Every gate starts/ends clean, no restore/skip/exception. One macOS full suite, not a claimed three-sample median or Linux validation.

Ordinary G2 now has11 PASS /1 DEGRADED_HONEST /0 FAIL (`g2-observations.json`). Teppen has three explicit null/UNKNOWN dates on original and mutated views and is PASS. Sen has two null/UNKNOWN dates and still loses ONLY the independently retained requestConfirmed fact. Both Tabelog lists and details PASS; all six TableCheck pages PASS. The actual strict REQUIRE_PASS command exits1 (3/4 test groups), first failure now Sen. This is unfinished G3 acceptance, not a new false claim or permission to delete that reference.

Full prior HARD result remains byte-identical:44,197 bytes/SHA `9a3298bc5e004b99e41d80713e8913b68c336cfa594f6eb60599e310ee3fb633`. Product source unchanged from B's previously tested three groups; line references remain sites4,028/Pack478. Protected C source/four tests and unapplied patch verified (`preservation.json`).

## Budget and scope

`budget-union.json`: B446 + approved main463 →468 unique existing ids, every row preserved unchanged; append this sync's zero row→469 ids. Identical same-id rows deduplicated, differing same-id rows0. Canonical union totals match approved main:171 prior real model calls /242 evaluation GET /11 Google /0 Live /0 environment reruns. A's19 previously spent calls retained once; this synchronization's new calls all0. SourceSnapshots metadata union preserved. No .env/QA-answer reads.

Initial utility preparation stopped on metadata equality because approved main legitimately has19 additional spent calls; ledger rows had no conflict. The cumulative total was then recomputed from the preserved row union. This preparation assertion is not a red/green or gate result.

## Remaining stop

Approved calendar baseline is now integrated. The current stop remains pending HUMAN authorization for the exact C protected fragment-positive input response addition (`../pending-c-fixture/fragment-response.patch`). A's notification does not approve that separate patch or authorize a reply to other tasks. No such input edit is applied. Remaining date/shared selected-state/private slot retirement and G3c still need work; strict Sen request confirmation is retained for that work. No G3 merge to main; publish this synchronized work branch, then remain at the existing ownership stop.
