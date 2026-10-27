# Bound-page G1 evaluation Runner

Draft / not integrated. The integration branch pins B's `0a466bcd`; B's product tree is unchanged. This is an offline composition, not an Agent/Web entry or current-website test.

Execution has no reference-answer argument and no fresh reader. It verifies saved-page storage/body SHA, renders static HTML with JavaScript/service workers/transport disabled, supplies explicitly local-constructed identity/run binding to the real G1 core, and retains raw core results, normalized outputs, read identifiers, URL/readAt and model-invocation metadata. It does not truncate page text to fit the pinned core. `readClock` is synthetic offline binding time, never a claim of a new website read.

The only B imports and old fixture-wire assumptions are in `core-adapter.ts`. The projected contract is status, answer, citations with URL/readAt, sensitiveCategory, and UNVERIFIED reason. The old core's category is unsupported: temporary NONE is labelled unsupported, never inferred from the question label. Scorer@3 compares category independently and leaves general confirmation wording to the future presentation-layer test. Q26's explicitly reviewed bilingual-conflict answer still requires both quotations, the inconsistency and restaurant confirmation. Raw old-core extractive prose is retained; no real quality claim is based on fixture responses.

```sh
node --import ./scripts/test-filesystem-guard.mjs --import tsx src/eval/restaurant/fact-qa/run-bound-questions.ts --questions .eval-artifacts/phase3b/g1-qa/questions.json --out <new-output-directory> --code-ref <frozen-40-character-SHA> --fixture not-stated
```

The CLI only enables a FIXTURE transport. Future approved real-model use injects `ModelGateway` into `runBoundQuestions`; no provider or credentials are loaded here. `fixtureQuestionModel` uses source text in the core's request, never the answer file. Its fixed NOT_STATED response intentionally cannot measure model quality.

Run scoring as a separate process AFTER execution, using `run.ts` with `--references`, `--responses`, `--reads` and a fresh `--out`. Only that scorer reads the reviewer answers. The frozen `g1-runner/run-fixture.py` enforces this ordering, runs execution under a reference-read-denial canary, and distinguishes evaluator errors, fixture diagnostic failures and real-model NOT_EVALUATED. Unknown paraphrases remain ungraded, not assumed wrong or error-free. Existing execution files are never overwritten by grading.

References and answer-bearing reports remain unavailable to Conversation B during implementation. The public input remains `g1-qa/questions.json` plus its saved pages. Local three-question fixtures are constructed; historical source pages are saved-DOM inputs, not a current website replay. First 3b Live/new replay/TableCheck positive calendar remain separate work.

After B batch2 delivery, rebase to that approved commit and update only `core-adapter.ts`, rerun the fixture. Do not merge this Runner before the B ADR/core approval and main integration.
