# G6 continued after TableCheck repair — cancellation-to-B1 composition red

- Status: draft / not integrated; exposed local development inputs, no holdout.
- Date: 2026-11-01, Vienna CET (UTC+1).
- Branch: `codex/chore-phase3b-g6-offline-preflight`; no main merge.
- Reviewed main74dd2faf integrated as2923c4e1. Both documentation histories and all507 shared ledger entries preserved.

**Batch1 remains incomplete.** C's reviewed TableCheck repair closes the prior source→link gap: the original test and all six development controls pass7/7. The next requested whole-composition test finds a different missing edge: G1 actually reads and admits a same-outlet, same-page cancellation answer, but the ordinary B1 card still has `terms: []`. Per the user's explicit “new whole-composition failure → preserve red and stop” instruction, no A product patch, prepared-terms injection, paid replay or further Runner implementation follows.

## 1. Reviewed repair verified in A

On clean2923c4e1, the same unmodified test/helper/input files as02d01196 were used. Command: Node with the filesystem guard and tsx `--test` on `g6-booking-composition.test.ts` and `g6-development-preflight.test.ts`. Raw output: `post-tablecheck-seven-controls.log.gz`.

- Original TableCheck source→handoff assertion: PASS, 3.696seconds.
- P1 variants0/1/2, P2, P3, P4: all PASS; 7/7 combined, 4.577seconds.
- No approved A assertion weakened, no C product edit. C's five-gate/strictG2 publication is historical supporting evidence, not a substitute for this A run or the next new test.

## 2. New whole-composition normal control

Test: `G6 B1 ordinary composition carries its admitted G1 cancellation quote onto the same-channel handoff`, `src/eval/restaurant/agent-loop/g6-booking-terms-composition.test.ts`.

Actual start/end: the same production `createLiveReadAssembly` and persistent application create a Case, discover the fixture outlet, establish identity/current availability, display its actual Tabelog B1 link, accept an explicit same-outlet page question, acquire the page through the ordinary G1 reader, invoke the question model, admit the literal quote and project the current handoff using the ordinary cache and both server checks. Interpreter, Compiler, Runtime/Reducer, Router, grounding, SQL migrations and projection remain production code. PGlite/fixed clock are declared local environment; only model and source I/O are replaced.

The helper accepts an optional `G6QuestionFixture` containing **only user question, merchant prose and fixture model answer**. It changes the source HTML/text and scripted transport output; it never sets State, evidence, source.terms, prepared links, identity or inventory. Original default wording/source/model outputs remain unchanged. The original three input files and original TableCheck test are unchanged from the reviewed C/main input. This extension supplies no new production API or version.

Input: `cases/g6-development/cancellation-question.json`, explicitly **LOCAL_CONSTRUCTION_NOT_WEBSITE_REPLAY**:

- User: `What is this restaurant's same-day cancellation policy?`
- Public merchant sentence: `Cancellations on the reservation date are charged at 100% of the course price.`
- Fixture-model English answer: `Same-day cancellations cost 100% of the course price.`

The public sentence replaces only the former private-room paragraph in the constructed source. It is neither a fact about a real merchant nor QA expected-answer material. No live/source/holdout text was obtained.

Frozen commit **ff17d370**, with input SHA in `cancellation-freeze.json`, clean status before and after execution:

```sh
PRAXIS_G6_COMPOSITION_CAPTURE=1 node --import ./scripts/test-filesystem-guard.mjs --import tsx --test src/eval/restaurant/agent-loop/g6-booking-terms-composition.test.ts
```

Result **exit1**, 818.399ms for the test /1.243seconds for the command. It reaches the intended new assertion after every prerequisite passes. `cancellation-preflight.json.gz` deliberately retains the base helper's PASS result: P4/G1/link behavior passed. The independent new terms check fails separately; it does not overwrite that execution status. Raw stdout/stderr: `cancellation-product-red.log.gz`; separate extraction: `independent-evaluation.json`.

## 3. First deviation and attribution

Actual output:

- Same candidate: `praxis:restaurant:bd287442c716ac7439273cc9`; current AVAILABLE for2026-11-11,19:00,2 people; still actually presented.
- G1 `ANSWERED`, one question-model call, exact English answer and merchant quotation above.
- Citation URL `https://tabelog.com/en/tokyo/A1301/A130101/13123456/`, readAt `2026-11-01T06:00:00.000Z`, identity evidence `evidence:restaurant:website-entity:39e4b0a83f2e6260053c3543`.
- Tabelog handoff exists with original source URL and filled-in copy, same candidate/date/time/guests, `sourceSelection: UNKNOWN`.
- Its `terms` is **[]**. The English answer and original quote are absent from the card.

First failed assertion: test line28, **B1 must carry the already admitted same-outlet same-channel G1 cancellation answer and source quote**. The prior normal G1 acquisition/citation assertions all pass, so this is not missing website evidence, an identity exception, answer language, sentence numbering, a quote mutation, or fixture schema failure.

The independent expected behavior comes from Accepted ADR0049 section5: show short English cancellation copy and original verbatim G1 quotations with URL/read time/same-outlet binding. “Missing evidence means omitted” is not the positive here: this test actually acquires and admits that evidence. No strictness choice, user guarantee or new call is requested by the test.

Static attribution, **not repaired by A**: the only production `prepareBookingHandoff` callers are `tabelog-booking-handoff-reader.ts:85` and `tablecheck-booking-handoff-reader.ts:113`; both build sources without `terms`. The presentation guard correctly reads only checked `source.terms` (`booking-handoff.ts:172–212`). Domain tests supply terms, but there is no ordinary source producer connecting the current G1 answer/page to that contract. This locates the missing bridge; reviewer assignment must also preserve current source/page/run identity, freshness and both checks. A does not infer or implement the exact repair.

## 4. Coverage inventory / four-layer result

Updated itemized [composition-coverage.md](composition-coverage.md) identifies each actual entry, replacement and limitation. B1 Tabelog+TableCheck source-link wiring now qualifies. Cancellation-to-card is **PRODUCT_RED**; card/plan/conflicting-terms and feedback composition, renamed-source delivery, control-fallback delivery, wrong-scope price/HARD and combined Guard/F6 remain **无 / NOT_RUN** after this first new failure. They are not waived. The inventory is provisional and batch1 incomplete.

1. End-to-end: the prior TableCheck link gap is closed in A's actual composition. New cancellation question is answered correctly; B1 terms capability fails. Overall G6 preparation STOPPED.
2. Chain: request→discovery→identity→availability→presentation→G1 page acquisition→question model→literal quote admission→current link projection all pass; current G1-to-B1 terms transfer is the first absent output edge.
3. Severity: omitted information, not an invented cancellation policy. No wrong statement or external submission observed in these local inputs. This is not Live S0=0 or production Guard certification. The source/model transports are fixed in-process; no real external booking/write port is installed.
4. Attribution: output plus ordinary cache call sites support a missing production bridge. A causal repair/green remains NOT_RUN; do not classify this as model quality or falsely repair the evaluator's expected output.

The emitted platformFee still comes from the existing reviewed source-bound fixed configuration; this test does not freshly certify that policy or claim complete fee/feedback coverage.

## 5. Scope, budget, checks and remaining work

Relative to integration2923c4e1, A changes only the preflight helper's external-question/source/model fixture option, one new constructed input and one new eval test, plus this evidence and required records. Product, B/C/site/source-packs/Prompt/Schema/State and existing business assertions remain unchanged. Prior stop artifacts/manifests are preserved.

Shared ledger: all507 prior entries retain exactly the same values; append one zero-call A stop row →508. Limits remain26Live/1600models/290GET/4environment; cumulative remains Live0,model171,GET255,environment0. New real-model/Google/restaurant-website/publicGET/Live/environment calls are all **0**; no .env read or load; no private holdout or QA answer access. Fake Google POST/GET labels denote local fixed transports, not requests to those services. See `budget-preservation.json`.

Five gates and strictG2 on the new terms candidate: **NOT_RUN, explicit product-stop rule**. The new test remains an active failing normal assertion; no green npm-test claim, skip or inversion. New-diff whitespace, scope, freeze and preservation checks are in `verification.json`. Main not merged or pushed by A; the work branch is pushed with remote SHA verification.

Real-model decision replay remains0/80. Remaining full-assembly tests, multi-turn G6 Live Runner/witness/immediate-evaluation/S0-stop orchestration, complete independent B1/G1/named/date/price/SOFT evaluator, Guard/F6 statistics/capture checklist and approximately8-slot development Live plan remain NOT_RUN/NOT_IMPLEMENTED after the stop. This report requests reviewer assignment of the new product edge, not extra budget or relaxed acceptance.
