# G6 batch 1 — stopped at the P4 G1 page-capture gap

- Evidence status: draft / not integrated; exposed development inputs only.
- Date: 2026-11-01, Europe/Vienna CET (UTC+1).
- Base: main `6db445ea9afdbe5debdc60efc1107f768434c555`.
- Branch: `codex/chore-phase3b-g6-offline-preflight`; **not merged into main**.

The requested preparation is **incomplete**. A real product integration gap was found in the fourth scripted path. Per the user's stop rule, no product fix, real-model replay, Live or public GET follows it. Full default-suite greens, if recorded below, validate only these A-owned changes; they do not close this product red.

## 1. Private holdout commitment

`../../phase3b-holdout/commitment.json` records exactly the supplied whole-file and six per-case hashes, normalization rule, user approval, reviewer author and 2026-11-01 CET freeze date. No private text was located, read or inferred; no answers were read. `src/eval/restaurant/agent-loop/holdout-commitment.ts` verifies whole original bytes first, then ordered document hashes, without parsing YAML business fields or printing/copying text. Any mismatch exits nonzero; successful verification itself grants no execution authorization.

Future authorized exit preflight: `node --import tsx src/eval/restaurant/agent-loop/holdout-commitment.ts --file <user-provided-private-YAML>`. It was **not run on the private file**. Two default tests use independent literal commitment hashes and unrelated local alpha/beta documents: byte tamper, document order, count, missing final LF and invalid duplicate commitments are rejected; correct local bytes pass. Raw output: `commitment-controls.log` (2/2).

## 2. Scripted development paths and first deviation

All inputs are explicitly LOCAL_CONSTRUCTION_NOT_WEBSITE_REPLAY. The prior reviewed B1 ordinary-composition test is a structural reference, not live source truth. Each tested chain uses the existing persistent application, Interpreter, Compiler, Runtime/Reducer, Validator, Router and production read assembly; only model/source transports are replaced. Capture files preserve every model request/output, authoritative projection, exported event/decision artifact and simulated source call. They are compressed without changing the original bytes; hashes/commits are in `scripted/manifest.json`.

| Path | Actual result | Limits of evidence |
|---|---|---|
| P1 displayed available outlet → booking request | SCRIPTED_PASS at `0a6c7863`: same outlet selected, B1 keeps original form_course URL and filled-in copy; no workflow navigation | First wording only; two other frozen wordings, controlled wrong-output red and true-model decisions NOT_RUN. Later harness extension did not re-run P1 before the P4 stop. |
| P2 recommendation without slot → booking, missing guests → reply | SCRIPTED_PASS at `b25d88fb`: recommendation has zero availability/B1; NEEDS_INPUT before guests; after Two people, real availability, selection and B1 | Wrong-output red and true-model decisions NOT_RUN. |
| P3 named outlet/time with no concrete date → date clarification | SCRIPTED_PASS at `b25d88fb`: NEEDS_INPUT, no State date and zero source calls; explicit date then normal availability/B1 | Scripted interpretation omits the unbound vague period instead of inventing a date; real semantic choices still NOT_RUN. Wrong-output red NOT_RUN. |
| P4 delivered first outlet → explicit bound G1 question | **PRODUCT_RED / STOP** at `b25d88fb`: core not reached, UNVERIFIED/NO_BOUND_PAGE | The source literally contains the answer. No causal green or true-model decision; not an answer-quality failure. |

First deviation: the question reader asks the fact chain to capture pages, but GoogleThenWebsiteFactRead reads the website only for missing original search facts. With no HARD gap it ends after Google Details, emits no page and prevents G1 from running. Exact source paths, lines, SHA, preserved raw trace and requested B handoff: [fixture-handoff.md](fixture-handoff.md). No production file changed and no extra HARD field, cache injection or alternative reader was used to obtain a false green.

Two earlier authoring failures are retained separately: `c06e9bec` omitted Availability from the constructed snapshot's visible text; `2f5da674` wrongly selected an automatically executable offer instead of only the B1 outlet. Neither is claimed as a product red. Correcting those local authoring choices led to P1's real normal-control green; existing read-only offers correctly require a recheck on the legacy proposal path.

## 3. Requested Runner, evaluator and development Live plan

**NOT_RUN / NOT_IMPLEMENTED beyond the partial development preflight.** The product stop happened before these deliverables. Multi-turn G6 Live orchestration, witness GET integration, independent B1/G1/named-store/date/price/SOFT/S0 checks, Guard/F6 metrics, new calendar/replay capture and the approximately eight-slot Live proposal still require the continuation after review. The preflight is not relabeled a completed Live Runner. The four-path red/green obligation is not met and no G6 exit result is claimed.

## 4. Four-layer record

1. End-to-end: P1–P3 scripted transitions succeed within this constructed environment; P4's user question remains unanswered despite a readable local merchant sentence. Overall preflight BLOCKED.
2. Links: P4 initial discovery/identity/availability/B1 passed; follow-up authorization/identity binding accepted; page acquisition failed before question-model invocation. No later answer or quotation step is inferred.
3. Severity: no fabricated answer or booking submission is observed in these local controls. This is not a Live S0=0 certification, and Guard/F6 in real traffic are NOT_EVALUATED. No booking execution port was installed in the persistent read-only application; fixed browser transport admits only the public detail URL and rejects click/fill/workflow access. The old BOOK_RESERVATION was not used to simulate B1.
4. Attribution: code branch plus actual trace locate the first deviation in the B-owned Google→website fact composition. The repair's causal counterfactual remains NOT_RUN; no model-quality claim is made.

## 5. Budget, scope and validation

New real model **0/80**, full Live **0**, public GET **0**, Google **0**, environment reruns **0**; no .env read, load, copy or staging. The Google POST/GET labels in raw local logs are fixed in-process transport calls, not real requests. Shared ledger retains every original 500 record unchanged, adds one zero-call stop entry, and applies user-authorized G6 caps Live26/model1600/GET290/reruns4. Actual cumulative usage stays Live0/model171/GET255/reruns0. `budget-preservation.json` binds the original ledger SHA and preservation.

Only A eval files, required evidence/budget and status/history are changed; all product, B/C, Prompt/Schema/State and existing fixtures remain byte-identical to base. The partial preflight's P4 command intentionally exits1 and is preserved as an explicit integration red, not weakened/skipped/reversed to pass. The default checksum tests do not claim to cover that product behavior.

Five-gate packaging verification: **PENDING**. Every gate will run from one frozen clean commit with clean status before/after and input SHA checks. Raw logs and results will be archived below; no G6 business work resumes during packaging.

## Next review decision

Assign the page-capture repair to B using the preserved first failing composition. After that reviewed product change, A can sync, obtain P4's actual green and finish controlled reds for all four paths before spending the authorized model replay budget and completing Runner/evaluator/Live-plan preparation. No permission or extra budget is requested in this report.
