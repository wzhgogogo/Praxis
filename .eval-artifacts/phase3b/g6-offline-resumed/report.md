# G6 batch1 continuation — stopped at TableCheck B1 composition

- Evidence status: draft / not integrated; exposed, locally constructed development inputs.
- Date: 2026-11-01, Vienna CET (UTC+1).
- Branch: `codex/chore-phase3b-g6-offline-preflight`; no main merge.
- Integrated B fix `a7860924` and A scheduling repair `5683dcfb` into approved A stop `27cf175c`, merge `524dd8a9`. Both documentation histories and every ledger entry retained.

**Batch1 remains incomplete.** The original P4 is now green; all four paths have controlled wrong-output checks, and P1 has all three wordings. The new whole-composition check then found a production gap: TableCheck establishes AVAILABLE and presents the outlet, but the ordinary assembly provides no B1 link. The user's explicit stop rule applies. No product patch, prepared-link injection, paid replay, or further Live preparation follows this red.

## 1. Original P4 causal green

The five original A inputs were byte-identical to `27cf175c` when run on `524dd8a9`. `original-p4/preflight.json.gz` retains the persistent application projection, events, model requests/responses and source observations. The unchanged development question reaches the real question reader and invokes `restaurant_page_question` once. It returns ANSWERED with the literal merchant quotation:

> A private room is available for groups of four or more.

Citation URL: `https://tabelog.com/en/tokyo/A1301/A130101/13123456/`; readAt `2026-11-01T06:00:00.000Z`; candidate `praxis:restaurant:bd287442c716ac7439273cc9`. Identity is accepted by the production reader, not added to State by the test. This is a fixed-source scripted-model composition green, not a true-model answer-quality or current-website result. Original P4 failure remains in the prior report.

## 2. Four paths and controlled reds

Frozen at `e4518efa`; `controlled-freeze.json` binds those exact historical inputs, not later TableCheck extensions. `controlled-checks.log.gz`: **6/6**, 3.477 seconds. Permanent tests: `src/eval/restaurant/agent-loop/g6-development-preflight.test.ts`.

| Path | Normal production-composition control | Independent bad-output control |
|---|---|---|
| P1 variants0/1/2 | Same displayed outlet is selected; retained original Tabelog B1 URL, exact fields and filled-in copy | A copied output selecting another outlet is rejected as WRONG_SELECTION |
| P2 | Recommendation has no slot/B1; ask guests; after explicit reply, check availability and prepare B1 | Copied output providing handoff before guests is rejected as PREMATURE_HANDOFF |
| P3 | Ask for a concrete date before source reads; explicit reply then normal availability/B1 | Copied initial output inventing a date is rejected as INVENTED_DATE |
| P4 | Actual source acquisition and question-model call; admitted same-outlet/page literal quotation | Copied answer inventing a quotation is rejected as UNSUPPORTED_G1_CITATION |

The independent checks operate on copies of actual execution output. They prove that the development evaluator detects these failures; they do not claim that production received/rejected bad model proposals. Source observations, State, evidence and the normal path are not mutated to manufacture a green.

P1 additional messages actually sent:

- `I'd like to reserve this restaurant.`
- `Let's go with G6 Development Sushi. Help me book it.`

First message retained: `Please book G6 Development Sushi for me.` Source-call records now include turn; artifact followup records the actual selected wording. No product or shared version change.

## 3. Whole-assembly inventory and first product deviation

See [composition-coverage.md](composition-coverage.md) for each requested capability's actual test/file, production entry, replacement boundary, proof and limitations. Bound-page QA, Adapter-only checks, business-port stubs and injected prepared handoffs are explicitly partial. Uncovered capabilities remain **无 / NOT_RUN** after this stop; the inventory is provisional and batch1 is not certified complete.

New test: `G6 B1 TableCheck whole read composition emits a same-shop filled-in handoff after real availability`, `src/eval/restaurant/agent-loop/g6-booking-composition.test.ts`. It uses `createLiveReadAssembly` → real persistent application/SQL migrations/Interpreter/Compiler/Reducer/Router/grounding → `withBookingHandoffs` and the ordinary assembly's `readPrepared`. Only model and source I/O are replaced; PGlite and a fixed clock are the declared local environment. For TableCheck, real local Chromium observes the named form controls and public same-shop slot link, with all network responses intercepted locally. No candidate, offer, accepted evidence, selection confirmation or prepared handoff is injected. The constructed page does not claim to be a website replay or a G3b private-marker-removal test.

Frozen committed input **`1e754b90`**; `booking-composition-freeze.json` hashes match that commit. Clean worktree before execution. Raw command (with local browser launch permission, no credentials):

```sh
PRAXIS_G6_COMPOSITION_CAPTURE=1 node --import ./scripts/test-filesystem-guard.mjs --import tsx --test src/eval/restaurant/agent-loop/g6-booking-composition.test.ts
```

Result: **exit1**, 1.945 seconds. The test reaches all prior normal assertions:

- phase `PRESENT_RESULTS`, candidate `praxis:restaurant:bd287442c716ac7439273cc9` actually presented;
- provider TABLECHECK, identity accepted through EXACT_PHONE;
- check AVAILABLE, date `2026-11-11`, party2, covered exact slot `19:00`;
- current source HTML contains the same-shop reservation link with `start_date=2026-11-11`, `start_time=19:00`, `num_people=2`;
- ordinary prepared handoffs **[]**.

First failing assertion: `g6-development-preflight.ts:189`, **Initial ordinary source cache must produce B1**. The booking follow-up is not reached: ADR-0049 section1 requires the channel handoff as soon as qualified slot/link evidence is available. This red does not depend on inventing a booking-selection event.

Code attribution, without modifying it: `live-read-assembly.ts:46` installs only `TabelogBookingHandoffReader`. Its `capture` at `tabelog-booking-handoff-reader.ts:54` admits only TABELOG evidence; `readPrepared` at line85 prepares only TABELOG. Domain-level TableCheck URL support and injected cache tests therefore do not prove production source→handoff wiring. Assign the production correction through the reviewer, then re-run this same positive assertion; do not inject the missing link in the fixture.

Raw execution and independent extraction: `tablecheck-product-red/test.log.gz`, `preflight.json.gz`, `independent-observation.json`. The new test remains failing; it was not skipped, inverted or weakened.

Two initial fixture errors are preserved separately and excluded from product evidence: `f0d04a74` wrongly restricted public read queries to handoff query keys; `0633fa46` omitted native live form-control observations. A further unfrozen sandbox invocation was an orchestration mistake after `git add` rejected ignored evidence; Chromium did not launch and no source read occurred. It is explicitly excluded. Inputs were then committed and the unchanged asserted behavior run successfully through real source observation to the valid product red. No authoring/environment failure is counted as a B1 result.

## 4. Four-layer evaluation

1. End-to-end: P4 repair and all four scripted Tabelog paths work under the stated local inputs. Whole TableCheck B1 fails; overall preparation STOPPED.
2. Chain: Google discovery → TableCheck same-outlet identity → request-bound native controls/slot → AVAILABLE → actual presentation pass. Source/link preparation is the first missing edge. Booking follow-up and terms/fee/feedback beyond this edge are not inferred.
3. Severity: no fabricated availability, quotation, booking or submitted request is observed in these constructed executions. This is **not** a Live S0=0 or full Guard certification. No real booking execution port or real external I/O is installed. The local Chromium fixture intercepts every request; this does not certify production network admission.
4. Attribution: actual output plus the production composition/cache filter identify a code-wiring gap, not model quality or unavailable website evidence. Repair and causal green remain NOT_RUN.

## 5. Remaining batch1 work

Real-model decision replay **NOT_RUN, 0/80**. No .env was read or loaded. G6 serial multi-turn Live Runner, witness orchestration, complete independent B1/G1/named/date/price/SOFT/S0 evaluator, Guard/F6 statistics/capture checklist, and the approximately eight-slot development Live plan remain **NOT_IMPLEMENTED / NOT_RUN** after the product stop. Remaining whole-composition tests for renamed sources, control-fallback delivery, price applicability, terms/fee/feedback and Guard/F6 are listed individually in the inventory. No remaining gap is waived.

Holdout commitment and verifier are unchanged. No private plaintext, QA answer files or holdout identity hints were accessed. Any future witness URL remains `https://tabelog.com/en/...`; no witness request was sent in this continuation.

## 6. Scope, budget and verification

All product, B/C source, site directories, source-packs, Prompt/Schema/State and original HARD behavior are unchanged from integration `524dd8a9`. Only A eval/local input files, evidence, shared ledger and required status/history are changed. B's already approved fix and A scheduling repair are inherited through the integration, not reimplemented here.

Shared budget: all **504** prior entries retained by id/value, append one zero-call stop entry → **505**. Cumulative usage unchanged: Live0/26, real model171/1600, public GET255/290, environment0/4. New real model, Google, website GET, Live and environment reruns are all **0**. Local fake Google POST labels and intercepted Chromium URLs are not real service requests. `budget-preservation.json` records old SHA and exact preservation.

Five gates and strict G2 on this continuation: **NOT_RUN due explicit product-stop rule**. Earlier B/A repair gate greens are historical and do not certify this candidate. The active new TableCheck test intentionally exposes the unresolved product failure, so no green default-suite claim is made. New A diff whitespace and scope/SHA checks are reported in `verification.json`; inherited B raw logs remain original evidence. Main is unchanged; work branch will be pushed and verified with ls-remote.
