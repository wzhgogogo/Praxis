# Restaurant semantic-contract @6 implementation — 2026-09-18

- Status: implementation evidence; independent pre-review pending
- Source of truth for: @6 migration boundary, evaluator@18 change and offline verification
- Baseline: `a66ef8a8e62c68339adb83c0b8c7aef8086b4923`
- Scope: ADR-0029 implementation only. The only Gold change is the authorized
  @6 strength migration of H002 first-date and H004 meeting-a-friend from
  `SOFT` to `UNSPECIFIED`; historical artifacts/Gold snapshots are not
  rewritten. No model, Google, website, browser, booking, private Holdout,
  commit, or push occurred in the implementation stage.

## Executable migration

`restaurant-read-development@6` is the only executable H001–H005 manifest.
It preserves every user `content` string and changes only these accepted exposed
development expectations:

| Case | @5 expectation | @6 expectation | Reason |
| --- | --- | --- | --- |
| H002 | `good for a first date` POSITIVE/SOFT | POSITIVE/UNSPECIFIED | An expressed occasion preference without mandatory or trade-off wording is nonblocking under ADR-0029. |
| H004 | `good for meeting a friend` POSITIVE/SOFT | POSITIVE/UNSPECIFIED | Same general rule; no H004-specific model exception. |

The @5 source SHA-256 was
`ef57893638be2cbc295cb14295d24b6d2d7bdc2918da83de68c48ae839ca7699`.
It remains the identity of prior exposed artifacts and evaluations. They are not
rewritten, relabelled, or compared as if produced from @6. H003's existing @5
UNSPECIFIED migration remains unchanged. The YAML path, materializer constant,
current fixed composition and current contract documentation now name @6; there
is no second executable manifest or runner path.

## Prompt and evaluator contract

Semantic Prompt@v21 replaces the ambiguous instruction that flexibility should
produce no condition. A bare absence of a preference still produces no criterion;
an expressed preference with permission to compromise remains a `SOFT`
criterion. This is general wording and does not mention H002, H004, first date,
or a fixed venue category.

Evaluator/rubric@18 separates two questions:

1. Materialized @6 expectation → final authoritative `intentDraft` is semantic
   fidelity. Exact text/polarity/HARD-strength conflicts fail. Text that differs
   without a deterministic equivalence rule is `NOT_EVALUATED` and keeps an
   independent review requirement; it is not an automatic equivalence.
2. Final authoritative `intentDraft` → executed observations/evidence is
   grounding. HARD evidence and request applicability use the actual final
   criterion text, polarity and strength. This avoids fabricating a H002-like
   evidence/lineage failure from an older abbreviated Gold label.

The second question never rescues the first: a semantic conflict blocks final
acceptance, and unresolved wording blocks automatic semantic acceptance. The
only runtime representation gap retained for grounding is `NEAR_USER`: Runtime
persists its bound area query but not the relation token, so the materialized
evaluation-location relation remains attached while all executable fields and
criteria come from final state.

## Behavior controls and detection evidence

| Failure type | Actual entry | Normal control | Negative control caught | Not proven |
| --- | --- | --- | --- | --- |
| Criterion identity is collapsed by wording | `diagnostic-evaluator.test.ts` evaluator entry | An identical collection containing both `quiet/POSITIVE/UNSPECIFIED` and `quiet/NEGATIVE/HARD` is `SATISFIED` | Replacing the positive member with a second negative member is `NOT_SATISFIED` for polarity | Semantic equivalence of non-identical wording. |
| Historical label wording fabricates missing evidence | `diagnostic-evaluator.test.ts` H002-shaped artifact | Actual final negative HARD label and cited source fact: `REQUIRED_EVIDENCE=SATISFIED`, while semantic fidelity is `NOT_EVALUATED` | Same text with a changed polarity is `AUTHORITATIVE_CONDITIONS=NOT_SATISFIED` | That the different H002 words are semantically equal; only independent review can decide it. |
| Later condition strengthening reuses an old read | `current-development-offline.test.ts` actual Hybrid composition | First `UNSPECIFIED` presentation, then a second user semantic turn, actual `SEMANTIC_PROPOSAL_COMPILED` Runtime reset, current fact read and normal `PRESENT_RESULTS`; evaluator reports final HARD grounding `SATISFIED` | The same second turn without a new fact read has `PRESENT_RESULTS` rejected as `PRESENTATION_EVIDENCE_MISSING`; the bounded loop stops without a card and evaluator cannot qualify it | Real-model choice of actions or real-source quality. |
| Flexibility deletes a stated preference | `semantic-interpreter.test.ts` production request construction | Prompt@v21 includes the SOFT retention rule | Removing that wording fails the prompt-contract assertions | Real-model instruction following; no paid call was made. |

The scorer-level Proposal → Compiler → Reducer control remains a narrow lineage
test. It does **not** substitute for the actual two-turn test above. That
integration test enters through `createHybridReadComposition`, produces both
semantic proposals via the Interpreter boundary, dispatches the actual
`SEMANTIC_PROPOSAL_COMPILED` event, uses the Runtime reset, Agent/Validator and
Router, then evaluates the produced snapshot/trajectory artifact. Only the
external model and source transports are synthetic.

## Verification and stop

The initial focused offline command passed **71/71**. After pre-review exposed
the identity and Runtime gaps, the targeted recheck below passed **59/59**:

```text
npm run typecheck && node --import tsx --test \
  src/eval/restaurant/agent-loop/diagnostic-evaluator.test.ts \
  src/eval/restaurant/agent-loop/current-development-offline.test.ts
```

`npm run typecheck`, `npm run arch:check`, `npm run build`, and `git diff
--check` passed. The default `npm test` first encountered only sandbox loopback
binding denials (`EPERM` on `127.0.0.1`, 430 pass / 21 environment failures);
the unchanged suite then passed with its permitted local loopback transport:
**451/451 PASS**, 0 fail/cancel/skip/todo, in 18,481ms. After the second
pre-review correction, the current complete suite passed again:
**455/455 PASS**, 0 fail/cancel/skip/todo, in 18,758ms. No external transport
was enabled.

An immutable evaluator@18 sidecar was also generated for the existing H002
@5 result only: [source result](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-18T09-59-54-581Z-06987806-0b5b-4ef5-a272-8652f579b911.result.json)
SHA-256 `e9a1ed498cc6c484bb12c29655fb2622b147fba1a44653e7431ec624cf368aaf`;
[new sidecar](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-18T09-59-54-581Z-06987806-0b5b-4ef5-a272-8652f579b911.result.evaluation.18-1789729003819.json).
It retains the old materialized @5 expectation, reports
`systemBehavior=NOT_EVALUATED` because the historical criterion text lacks a
deterministic equivalence mapping, and separately reports
`evidenceSufficiency=SUFFICIENT_FOR_PRESENTED_RESULT`. It neither overwrites
the result nor upgrades the historical case to a pass.

## Authorized fixed-source real-model runs

After original-researcher pre-review, exactly one fixed-source real-model diagnostic ran for H002, H003 and H004, in that order. Each used `deepseek-flash`, Semantic Prompt@v21, frozen synthetic source transport, and ceilings of 300,000ms, 50 steps and 50 model calls. No real Google, website, browser or booking operation was called.

| Case | Execution | Automatic evaluation | Acceptance | Resources | Immutable records |
| --- | --- | --- | --- | --- | --- |
| H002 | `SUCCEEDED` / `TERMINAL` / `PRESENT_RESULTS` | evidence `SATISFIED`; semantic/final/completion `NOT_EVALUATED` | `FAIL` | 8,814ms; 9 calls; 28,922 tokens; 5 fixed Google-composition calls | [result](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-18T11-59-04-173Z-9612148e-9089-4621-9c8b-8dd63c61a289.result.json), [evaluation](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-18T11-59-04-173Z-9612148e-9089-4621-9c8b-8dd63c61a289.result.evaluation.18-1789732753001.json) |
| H003 | `SUCCEEDED` / `TERMINAL` / `PRESENT_RESULTS` | evidence `SATISFIED`; semantic/final/completion `NOT_EVALUATED` | `FAIL` | 6,727ms; 4 calls; 19,518 tokens; 1 fixed Google-composition call | [result](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-18T11-59-27-149Z-81033f3b-4e3c-4091-93ba-f37d8baddae6.result.json), [evaluation](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-18T11-59-27-149Z-81033f3b-4e3c-4091-93ba-f37d8baddae6.result.evaluation.18-1789732773890.json) |
| H004 | `SUCCEEDED` / `TERMINAL` / `PRESENT_RESULTS` | evidence `SATISFIED`; semantic/final/completion `NOT_EVALUATED` | `FAIL` | 6,461ms; 7 calls; 21,405 tokens; 4 fixed Google-composition calls | [result](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-18T11-59-45-412Z-955dbf88-1243-4afd-8489-4700a4bdbe06.result.json), [evaluation](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-18T11-59-45-412Z-955dbf88-1243-4afd-8489-4700a4bdbe06.result.evaluation.18-1789732791885.json) |

Total: 20 model calls, 65,311 input + 4,534 output = 69,845 tokens, 22,002ms, 10 agent decisions, 10 fixed Google-composition calls and zero browser-model calls. The automatic reviewer made no fuzzy equivalence decision: H002 has three non-identical labels, H003 has `team dinner` versus `suitable for a team dinner`, and H004 has `good for meeting a friend` versus `suitable for meeting up with a friend`. These results require original-researcher semantic review; this record does not claim a pass or apply a repair/rerun.

Run snapshot before H002 (SHA-256): dataset `75bf64732a9148720bb3d448c3fd53326195e8d7517d8689f80cec63e34df12b`; Interpreter `40c9cefd526c8c8da55571cf3621e5bcf80e3006ded0f97501031ef624321214`; proposal version `3a6aa38f4becd2b05f6f33b6748659126ac3610234fcc5ee3d9c425a188497c2`; evaluator `52149dc3ddb7c64148ef05ecd60bc1f54dab4c3fd6da740d2d08cf99f40bee78`; fixed-source scenario `924e42201160651eb86003fe01e34449f47dae9ecf90b72d41a0f2c60308c6f9`.

Retention limitation: immutable results retain structured proposals, parsed Agent actions, cited evidence and provider/model/request/token metadata. The existing `ModelInvocationRecord` persists `outputText: null`, and materialized user content is represented by its SHA-256 plus frozen @6 dataset. Complete provider response text/messages were therefore not retained and cannot be reconstructed after the one-run budget was consumed. This is an evidence gap, not a reconstructed historical output.

## Post-run review-note synchronization

Before modifying the current YAML, the exact file used by all three runs was
copied unchanged to
`.eval-artifacts/semantic-contract-migration-independent-review-2026-09-18/restaurant-read-development@6-pre-review-fixed-source-75bf64732a9148720bb3d448c3fd53326195e8d7517d8689f80cec63e34df12b.yaml`.
Both the saved snapshot and run-time dataset hash are
`75bf64732a9148720bb3d448c3fd53326195e8d7517d8689f80cec63e34df12b`.

The current YAML hash is now
`00b69476e6d07eec5dcd9a657555c4e3766629fce5f8e630512710252886ffb6`.
Only two `acceptance.review` sentences changed after the runs: H002 now says
first-date is `UNSPECIFIED` while the JPY preference is `SOFT`; H004 now says
meeting-a-friend is `UNSPECIFIED`. User content, all `semantic` fields, the
dataset identity, production code, source scenario, original result artifacts
and evaluator sidecars are unchanged. No rerun or rescoring was performed.

The next stop-gated action is original-researcher semantic review of these three results. H001/H005, Live websites, Google, browser observations, booking, commit and push remain out of scope.
