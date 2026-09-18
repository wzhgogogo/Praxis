# H002/H003/H004 Semantic Closure — 2026-09-18

- Status: H004 closed; H003 bounded review accepted; H002 transport repaired but semantic gate remains open
- Document revision: 1.2
- Last updated: 2026-09-18
- Source of truth for: this bounded H002/H003/H004 closure evidence and stopping point
- Reference branch / HEAD: `codex/feat-live-restaurant-read-path` / `01e073f6dbde651c14661d6b2a093a78ce0bf47b`
- Related documents: [Current Status](../STATUS.md), [Test Log](TEST-LOG.md), [H002/H003 rule-expression report](../../.eval-artifacts/semantic-rule-expression-diagnostic-2026-09-18/H002-H003-RULE-EXPRESSION-REPORT.md)

## Scope and fixed state

The pre-existing working-tree changes in `docs/STATUS.md`, `docs/history/DEVLOG.md`, `docs/history/TEST-LOG.md`, and four earlier diagnostic scripts were preserved. This closure did not modify Gold, private Holdout, H005 Fact Judgment/fixture/evaluator, browser, Google, availability, booking, or source facts. It made no commit or push. The final default offline suite did automatically execute pre-existing static H005 unit/fixture coverage; that is recorded below as a scope deviation, not treated as an H005 fact-judgment/fixed-source/Live run. The later H002 transport-only continuation is recorded separately below.

## H004 — CLOSED

**H004 specified SOFT criterion semantic fidelity has been manually reviewed and accepted. The original deterministic evaluator remains NOT_EVALUATED and is not rewritten.**

The preserved supplemental record is [H004-CLOSING-NOTE.md](../../.eval-artifacts/semantic-rule-expression-diagnostic-2026-09-18/H004-CLOSING-NOTE.md). Its conclusion is `SEMANTICALLY_EQUIVALENT` for `good for meeting a friend` versus `suitable for meeting up with a friend`, both POSITIVE/SOFT. No H004 model call, parser change, synonym whitelist, Gold rewrite, or automatic full-chain PASS was made.

## H003 — E fidelity review accepted; broader strength remains OPEN

The manual review is [H003-E-SEMANTIC-FIDELITY-REVIEW.md](../../.eval-artifacts/semantic-closure-2026-09-18/H003-E-SEMANTIC-FIDELITY-REVIEW.md). E's three preserved raw outputs (`call-02`, `call-03`, `call-06`) each have:

| criterion | output / polarity / strength |
| --- | --- |
| team dinner | `suitable for a team dinner` / POSITIVE / HARD |
| good for drinks | `good for drinks` / POSITIVE / HARD |
| approximate budget | `around 3,000 yen per person` / POSITIVE / SOFT |
| private room | `private room` / POSITIVE / SOFT |

The review concludes `SEMANTICALLY_EQUIVALENT`: both team-dinner forms require a venue that can support the requested team dinner; they require the same type of venue-suitability source evidence; the HARD activity is not weakened into atmosphere; and a source that proves a venue suitable for team dining can support either wording. No added condition, polarity error, or observed key-field regression appears in the three records.

E is accepted as a finite candidate for this exposed H003 case. **E resolves H003 under the current exposed development case, but does not resolve all defining-activity / drinks strength regressions.** The work-celebration/drinks control remains `0/3`; broader strength generalization is `OPEN`. E was not applied to the production Prompt because the combined-candidate gate below failed.

## H002 — supplementary resolver rejected before semantic quality could be measured

The frozen [resolver plan](../../.eval-artifacts/semantic-closure-2026-09-18/PARTY-SIZE-SUPPLEMENT-PLAN.md) declares four existing and four blind messages before execution. It has two closed blind controls (singular counterpart; enumerated group) and two open blind controls (occasion with possible additional attendees; named group with possible additions). It does not expose H002 IDs, Gold, first-date mappings, or social-occasion defaults to a production prompt.

The intended supplement was bounded to an already compiled AVAILABILITY draft with missing `partySize`; it would emit only `RESOLVED` plus number/source or `UNKNOWN`, and it would only merge a party patch. Offline composition tests established the intended guard, no-overwrite, one-call, fail-closed and missing-field behavior. It was never retained in the production composition because the real-model acceptance gate failed.

### Real-model result

Run artifact: [result.json](../../.eval-artifacts/party-size-supplement-diagnostic-2026-09-18/party-size-supplement-2026-09-18T07-51-26-983Z-1ff94503-3910-49e0-b724-e78cdb722c23/result.json), with a pre-dispatch [ledger](../../.eval-artifacts/party-size-supplement-diagnostic-2026-09-18/party-size-supplement-2026-09-18T07-51-26-983Z-1ff94503-3910-49e0-b724-e78cdb722c23/ledger.json).

| dimension | actual evidence |
| --- | --- |
| planned / dispatched calls | 24 / 24 (8 samples × 3), single process |
| retries | 0 |
| response completions | 0 |
| model outcome | all 24 `MODEL_FAILURE / PROVIDER_REJECTED` before a resolver JSON output |
| Google / website / browser / booking | 0 / 0 / 0 / 0 |
| H002 / existing / blind acceptance | not met: each has `0/3` because no provider completion was produced |

This is a strict-transport rejection, not evidence that the model made a wrong party inference. The run record did not retain the provider's detailed rejection diagnostic, so the specific incompatibility (for example, a schema construct) is an evidence-supported hypothesis rather than a confirmed root cause. The original 24-call authorization was exhausted. No retry, Prompt iteration, Gold change, or hidden downstream default followed at that checkpoint.

**Decision at the original checkpoint: H002 remained OPEN and the supplementary resolver was rejected as a production candidate.** The candidate code and production wiring were removed at that checkpoint; the later diagnostic-only transport candidate below remains unwired and is not a production acceptance.

## Combined candidate and H005

The Playbook permits a combined production candidate only if both E fidelity and H002 resolver acceptance succeed. Although E passed its bounded fidelity review, H002 did not; therefore Prompt E was not deployed and no resolver/wiring/Test-Production change remains.

`H005 DEFERRED — pending dedicated evidence-semantics pass after H002/H003 closure.`

## Verification and stopping point

Before the bounded run, `npm run typecheck` and the resolver preflight passed. The candidate implementation's focused offline composition tests passed before the real-model gate, but are not proof of real-model behavior. After rejection, the implementation was removed. Final retained-tree checks: `npm run typecheck`, `npm run arch:check`, local `npm test` 438/438, `npm run build`, and `git diff --check` all passed. The first sandbox `npm test` had 19 localhost-only `listen EPERM` failures; the same suite passed outside that sandbox. The mandatory default suite incidentally includes pre-existing static H005 tests, despite the no-H005-eval scope; no H005 model/fixed-source/Live command was invoked.

The next minimum action requires fresh, explicit model-call authorization and a provider-strict schema compatibility diagnosis that preserves the frozen blind expectations. Stop here: no H005, new H002 Prompt, model switch, Live, commit, or push follows from this closure.

## H002 subsequent provider-schema repair and authorized reruns

This continuation kept the same frozen 8 samples × 3 repetitions, model (`deepseek-flash`), temperature (0), disabled thinking, 30-second call timeout, no retry, and no Google/browser/booking calls. It changed only the diagnostic-only function-call wire schema and local normalization. It did not wire the resolver into the restaurant handler, persistent state, or production prompt path.

| run | calls | provider result | confirmed cause / outcome |
| --- | ---: | --- | --- |
| [original](../../.eval-artifacts/party-size-supplement-diagnostic-2026-09-18/party-size-supplement-2026-09-18T07-51-26-983Z-1ff94503-3910-49e0-b724-e78cdb722c23/result.json) | 24 | `PROVIDER_REJECTED` | detailed provider diagnostic was not retained |
| [rerun 1](../../.eval-artifacts/party-size-supplement-diagnostic-2026-09-18/party-size-supplement-rerun-2026-09-18T08-03-14-214Z-3585327c-b9d6-4b22-8f9e-a94ecbb5190b/result.json) | 24 | HTTP 400 | top-level `anyOf` rejected: “The top level of the function parameters schema must be an object.” |
| [rerun 2](../../.eval-artifacts/party-size-supplement-diagnostic-2026-09-18/party-size-supplement-rerun-2026-09-18T08-05-59-945Z-6788ae7b-8f03-443c-ab8c-11ff771d3c75/result.json) | 24 | HTTP 400 | object-root schema with an empty UNKNOWN object rejected: “An object with no properties is not allowed.” |
| [rerun 3](../../.eval-artifacts/party-size-supplement-diagnostic-2026-09-18/party-size-supplement-rerun-2026-09-18T08-07-51-558Z-2e209fc2-9d81-4fab-aee1-7b4669a72da8/result.json) | 24 | 24 completions | non-empty object-root wire contract accepted; semantic gate below remains red |

The accepted transport contract has `status`, `partySize`, and `source` at an object root. `UNKNOWN` is encoded on the provider wire as `partySize: 0` and `source: NOT_APPLICABLE`; the local strict parser accepts that pair only for `UNKNOWN` and returns the canonical public `{ status: "UNKNOWN" }`. Thus neither sentinel can become a state patch, evidence claim, or downstream default. This is an implementation compatibility measure, not a new inference rule.

### Rerun 3 semantic evidence

All 24 calls completed (`854 ms` mean latency; `2,289 ms` maximum). Seven controls met their three-of-three gates: explicit total, relationship-defined closed party, singular-counterpart blind control, enumerated-closed blind control, and all three open-party controls. H002 was **1/3**:

| H002 repeat | raw provider tool output | canonical result | assertion |
| --- | --- | --- | --- |
| 1 | `{ "status": "RESOLVED", "partySize": 2, "source": "INFERRED_CLOSED_PARTY" }` | `RESOLVED / 2 / INFERRED_CLOSED_PARTY` | pass |
| 2 | `{ "status": "UNKNOWN", "partySize": 0, "source": "NOT_APPLICABLE" }` | `UNKNOWN` | fail: expected closed pair of two |
| 3 | `{ "status": "UNKNOWN", "partySize": 0, "source": "NOT_APPLICABLE" }` | `UNKNOWN` | fail: expected closed pair of two |

The same request/prompt/configuration was saved for all three records in [records.json](../../.eval-artifacts/party-size-supplement-diagnostic-2026-09-18/party-size-supplement-rerun-2026-09-18T08-07-51-558Z-2e209fc2-9d81-4fab-aee1-7b4669a72da8/records.json). The difference originates in raw model proposals, not in wire normalization, proposal validation, compiler, reducer, or a downstream default.

**Current decision: H002 is still OPEN.** The run proves the transport repair and that the bounded rule can often recognize a closed pair; it does not meet the predeclared all-three-repetitions gate and therefore is not accepted or integrated. The next change must be justified by this 1/3 behavior and separately authorized; no additional call was started after rerun 3. Independent review remains required.

## H002 semantic-arity resolver v2 — stopped at the semantic gate

The v2 candidate changes only its closed-party instruction: a lexical relational/event structure may define a fixed participant cardinality; a modifier may change that structure; customary or social averages remain forbidden. It does not name H002, `first date`, Gold, case IDs, a category-to-count table, a new source, or a new output contract. Prompt@v2, schema `restaurant-party-size-supplement@1`, model `deepseek-v4-flash`, temperature 0, disabled thinking, 30-second request timeout, and the non-empty object-root transport remain fixed.

Before dispatch, [plan-reference.json](../../.eval-artifacts/party-size-supplement-diagnostic-2026-09-18/party-size-semantic-arity-v2-2026-09-18T08-44-12-699Z-78917c4c-bd3c-41e1-a84b-fecf0e7a179a/plan-reference.json) froze 14 samples × 3, including the original eight and two semantic-arity positives plus four modifier/open negatives (hash `e1edb03b6c79808a89f8a03a25bf456b66b75a0396700b7269db0a28d0c617ac`). The single process dispatched and completed 42/42 calls, with no retry, Google, website, browser, booking, or external write; reported output totals are 32,958 tokens.

| sample group | result |
| --- | --- |
| H002 bare date | 3/3 `RESOLVED / 2 / INFERRED_CLOSED_PARTY` |
| explicit total, singular counterpart, ordinary-date and one-on-one controls | each 3/3 expected result |
| double-date (4), group-date (UNKNOWN), celebration (UNKNOWN), expanded-date (4) | each 3/3 expected result |
| existing relational three and blind enumerated three | 0/3: correct count 3, but raw source was `EXPLICIT`, not required `INFERRED_CLOSED_PARTY` |

The two failing controls are genuine provenance errors rather than output formatting or scoring issues. All six raw outputs are preserved in [records.json](../../.eval-artifacts/party-size-supplement-diagnostic-2026-09-18/party-size-semantic-arity-v2-2026-09-18T08-44-12-699Z-78917c4c-bd3c-41e1-a84b-fecf0e7a179a/records.json): “my parents and me” and “Maya, Ken, and me” were returned as count 3 / `EXPLICIT`, despite not stating a numeric total. Gold was not changed to match them.

**Decision: reject v2 for production integration.** The candidate and runner remain unwired diagnostic material. The H002/H004 fixed-source real-model regression was not run because its explicit prerequisite was not met; therefore H004 resolver invocation count, Proposal/Draft regression, and fixed-source outcome are `NOT_RUN`, not pass. H003/H005, Live websites, Browser, model switching, a v3 Prompt, commit, and push were not attempted. The review question is narrow: whether a deterministic, message-grounded provenance validator can distinguish directly stated numeric totals from enumerated/relational inference without becoming an occasion-to-count map; no such change was made here.
