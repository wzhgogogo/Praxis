# Fixture scheduling — explicit lifecycle synchronization

- Status: draft / not integrated; offline local-process evidence only.
- Date: 2026-11-01, Europe/Vienna CET (UTC+1).
- Base: B `a7860924b8630a34318811b477af54e0f007d0b6`.
- Branch: `codex/fix-phase3b-fixture-scheduling-events`, based on the complete B repair; no main merge and no A G6 eval files imported.

## Failure and reproduction

B's original full default run was 1287/1288: unchanged `browser-fixture-scheduling.test.ts:109` failed because the a-held unfinished row did not yet list `a-held lifecycle step`. Its original raw log remains unchanged in the B ancestry and is SHA-bound by `red-freeze.json`. B's five isolated main and five isolated B runs did not reproduce it; they did not close the issue.

A preplanned one-shot unmodified full default run also passed 1288/1288 (30.7445 seconds), preserved in `red/natural-full.log.gz`. No claim is made to have naturally reproduced the complete-suite/Linux environment or the old 600-second browser hang.

The **controlled race is reproduced** using actual Node children and real lifecycle messages. In an isolated minimal copy, the worker delays only the genuine a-held TEST_START write until the driver has observed the three old prerequisites: a-held stdout, b-finished FILE_END, c-held FILE_START. A filesystem event then releases that original message. No fake lifecycle event, new timeout, altered assertion, G1 product import or checkout worker edit is involved. The old driver advances its clock before processing the deferred message, so the original lastObservedTests assertion fails (probe line110 equals original line109; the extra probe import shifts one line). All preceding output/file/clock assertions pass.

`paired-red/receipt.json` is EXPECTED_RED_REPRODUCED; `green/receipt.json` is PASS. Both use the **identical** delayed-worker bytes, SHA `483b9af4acbdb969e27ae766dfdce1ca05141d63bb7aa6aa46784f42fa1b0f2d`. The raw test process exits1 for the original assertion and exits0 for the fixed two-test file. This is a controlled event-order cause/green, not a relabeling of a natural pass as a reproduction.

The first probe already failed the matching target assertion, but its outer verifier incorrectly expected Node spec to print assertion source text. Node printed only the stack/false-vs-true result. That verifier error and first receipt are retained in `red/`; `red/classification.json` maps the preserved stack line to the unchanged source assertion independently. The verifier was corrected to use that mapping, then the exact paired red/green was obtained. No product/gate failure is hidden.

## Fix and controls

Only `src/harness/browser-fixture-scheduling.test.ts` changes. Its generated driver observes the real child's dedicated lifecycle pipe, waits for the a-held TEST_START as well as the old three prerequisites, and checks in a microtask after the parent's listener consumes the same data chunk. The narrow spawn observer exists only inside this one generated driver and is restored after the run. No sleep, polling, extra elapsed allowance or production hook is introduced.

All **20 original assertion-containing lines are byte-identical**; the entire first test and the second test's parent assertion/cleanup suffix are byte-identical. The 60,000 ms subprocess limit, 600,000 ms phase guard, G2 180-second assertion and 1/4 phase concurrency stay unchanged. Worker/outer scripts, B's G1 product repair and all other source/test files are byte-identical to B. `preservation.json` supplies hashes and checks.

The same controlled delay passes after the fix, followed by three independent ordinary complete-file runs (both original cases each run), all 2/2:

| Fixed run | Result | Seconds |
|---|---|---:|
| Controlled delayed lifecycle | 2/2 | 2.880 |
| Ordinary 1 | 2/2 | 2.847 |
| Ordinary 2 | 2/2 | 2.843 |
| Ordinary 3 | 2/2 | 2.888 |

These support this test synchronization repair. They do not identify or close the original sporadic 600-second browser hang, whose diagnostic scripts remain unchanged.

## Whole B candidate verification

**PENDING:** Freeze and commit the combined B+A candidate; run unfiltered typecheck, arch:check, npm test, build, test:browser:fixture, then strict G2. Expected default1288, Chromium187 and strictG2 tests5/pages12 come from B's existing unchanged baseline. Every gate must start/end clean with frozen SHA checks. A green here does not rerun or accept G6; B's existing P4 causal green is preserved without spending model calls.

## Scope, budget and delivery

Product, Prompt/Schema/State, production scripts, all B/C files and existing source fixtures unchanged. Only the A-owned scheduling test, evidence, shared ledger and required status/history change. Preserve all 503 B ledger entries. A's prior zero-call G6 stop row is already present by identical id/value, so union adds no duplicate; append only this zero-call row (504 total). Current authorized G6 caps are26/1600/290/4; cumulative usage is unchanged (model171, publicGET255, Live0, environment reruns0).

No real model, Google, restaurant website, public GET, Live, environment rerun, .env, private holdout or QA answer access. Real Chromium gates use existing local fixtures only. Work branch will be pushed and remotely verified for review; main remains untouched. This change repairs a test-precondition race, not G1 behavior or model quality.
