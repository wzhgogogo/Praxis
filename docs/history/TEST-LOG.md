# Test and Verification Log

- Status: Accepted
- Document revision: 4.78
- Last updated: 2026-09-18
- Source of truth for: 每次验证结果、模式、未覆盖项和外部副作用
- Related ADRs: [ADR Index](../decisions/README.md)
- Related documents: [Current Status](../STATUS.md), [Test Skill](../skills/test/SKILL.md), [Harness Design](../harness/HARNESS-DESIGN.md)

> Historical record only. The current evidence summary and known gaps are maintained in [Current Status](../STATUS.md).

## TEST-2026-09-18-PARTY-SIZE-SUPPLEMENT — bounded real-model transport gate

- Scope: a disposable supplementary resolver candidate only; its primary semantic boundary was controlled as an already-compiled AVAILABILITY draft with date/time/area and no party. The pre-frozen plan has four existing and four blind controls; the model receives only raw message plus the necessary goal context, never sample IDs, Gold or case names. It has one strict schema call per attempt, 30,000 ms timeout, temperature 0, disabled thinking, and no retry.
- Preflight: `npm run typecheck` and `PRAXIS_PARTY_SIZE_SUPPLEMENT_DIAGNOSTIC_MODE=preflight node --env-file-if-exists=.env --import tsx scripts/run-party-size-supplement-diagnostic.ts` passed before the run. Candidate-focused Interpreter→Compiler→merge tests passed before the paid gate; they prove only code-path guards/no-overwrite/fail-closed behavior.
- Accounting/result: the single process reserved and dispatched all 24 calls (8×3); all 24 received `MODEL_FAILURE / PROVIDER_REJECTED` before a structured completion. There were 0 retries, 0 completed outputs, and 0 Google/website/browser/booking/external-write calls. The run artifact's provider-detail diagnostic is missing, so a strict-schema incompatibility is a supported but unconfirmed cause. It is not evidence of a wrong party inference.
- Decision: H002 acceptance fails (all cases 0/3 due transport rejection). The resolver and E+resolver wiring were removed; no production Prompt@20 or resolver path is claimed. H004 closure and H003 human review are recorded separately; no H005 model, fixed-source, or Live run was invoked. Evidence: [closure report](H002-H003-H004-SEMANTIC-CLOSURE-2026-09-18.md) and `.eval-artifacts/party-size-supplement-diagnostic-2026-09-18/party-size-supplement-2026-09-18T07-51-26-983Z-1ff94503-3910-49e0-b724-e78cdb722c23/`.
- Post-withdrawal checks: `npm run typecheck`, `npm run arch:check`, `npm run build`, and `git diff --check` passed; local `npm test` passed 438/438. A sandbox attempt saw 19 `listen EPERM` localhost failures, then the identical suite passed outside the sandbox. Scope deviation: default `npm test` includes existing static H005 unit/fixture cases. No H005 fact-judge, fixed-source runner, external source, or Live run was invoked, and no H005 artifact/fixture/evaluator changed.

## TEST-2026-09-18-SEMANTIC-RULE-EXPRESSION — bounded real-model A/D and A/E diagnostics

- Scope: reference `01e073f`; no production code or Prompt revision. Both variants retain the complete Semantic parser/schema/transport/context/Compiler/Draft path. D differs from A only in the generic PARTY SIZE block; E differs only in the local optionality-scope paragraph. Each prompt diff checks exactly one original/replacement block and byte-identical prefix/suffix. H004 was not run and has a manual-equivalence closing note; H005/fact judgment/fixed-source/E2E were not run.
- Accounting: two independent artifacts and ledgers each record 24 `RESERVED` and 24 `COMPLETED` calls, no failures/retries/timeouts, all `DEEPSEEK/deepseek-flash`, `TOOL_CALLS`, Proposal-valid and `COMPILED`. H002 A/D used 152,368 tokens / 37,425 ms; H003 A/E used 155,051 tokens / 39,668 ms. No Google, website, browser, booking or external write occurred.
- Result / proof boundary: D has H002 A=0/3 and D=0/3, with all controls 3/3, so it is rejected and no new D wording follows. E has H003 A=0/3 and E=3/3, preserves explicitly flexible room/budget SOFT and does not add a comparative control failure; its work-celebration/drinks control remains a known A/E 0/3 failure, and its `suitable for a team dinner` wording is unreviewed semantic fidelity. E is only a limited candidate for human review, not an applied production change or proof of general strength correctness.
- Offline verification before the run: `PRAXIS_RULE_EXPRESSION_DIAGNOSTIC_MODE=preflight node --env-file-if-exists=.env --import tsx scripts/run-semantic-rule-expression-diagnostic.ts`, `npm run typecheck`, `npm run arch:check`, `git diff --check` passed. Evidence: `.eval-artifacts/semantic-rule-expression-diagnostic-2026-09-18/H002-H003-RULE-EXPRESSION-REPORT.md`, two plans/results/ledgers and 48 per-call records. No commit/push.

## TEST-2026-09-18-SEMANTIC-PARTY-POSITION — bounded real-model A/C diagnostic

- Scope: frozen `01e073f`; four already-exposed party samples; complete A Prompt@19 versus complete C with only the PARTY SIZE section moved. Preflight saved actual prompt text and passed exact-move checks: A/C contain one identical PARTY SIZE block, all remaining text is byte-identical after block removal, and the PARTY_SIZE output shape remains in place. Model transport/schema/reference time/timezone/temperature/thinking/output cap/timeout/context were identical; C's diagnostic metadata does not claim a production prompt version.
- Accounting: `node --env-file-if-exists=.env --import tsx scripts/run-semantic-party-position-diagnostic.ts` recorded 24 reserved and 24 completed calls, 0 failure/retry/timeout, all `DEEPSEEK/deepseek-flash` with `TOOL_CALLS`, valid Proposal and `COMPILED` patch/Draft. Recorded usage is 144,462 input / 7,651 output / 152,113 total tokens and 35,221 ms summed latency. No Google, website, browser, booking or external-write action occurred.
- Result / proof boundary: H002 A=0/3 and C=2/3, so C fails the explicit stability acceptance criterion and is not a candidate. All three party controls are A=3/3 and C=3/3. All complete outputs are retained and no C-only confirmed key regression was found in this four-sample review; absent independent expectations remain unscored, including a friends criterion added in both variants for open attendees. This is an exposed current-model diagnostic, not evidence of general parser improvement or causal attribution.
- Offline verification after the diagnostic runner addition: `PRAXIS_PARTY_POSITION_DIAGNOSTIC_MODE=preflight node --env-file-if-exists=.env --import tsx scripts/run-semantic-party-position-diagnostic.ts`, `npm run typecheck`, `npm run arch:check`, and `git diff --check` passed. Evidence: `.eval-artifacts/semantic-party-position-diagnostic-2026-09-18/PARTY-POSITION-DIAGNOSTIC-REPORT.md`, plan, 24 immutable call records, result and ledger. No commit or push.

## TEST-2026-09-18-SEMANTIC-FIELD-SCOPE-DIAGNOSTIC — bounded real-model diagnostic

- Scope: code snapshot `01e073f`; eight already-exposed targeted-repair samples, each in fixed `A1/B1/A2/B2` order. A used the actual Prompt@19 request builder; B retained the relevant original rules and the same `restaurant-semantic-proposal@3` schema/transport, reference time, timezone, 30,000 ms timeout, 5,000 output cap, temperature 0 and disabled thinking. B is an incomplete diagnostic task, not a production parser or proposed production path.
- Accounting: an initial start record is `FAILED_BEFORE_DISPATCH` because its Node command did not load the existing `.env`; it has 0 reservations and 0 calls. The completed run has 32 pre-dispatch `RESERVED` ledger records and 32 corresponding `COMPLETED` records, 0 failure/retry/timeout, all `DEEPSEEK/deepseek-flash`, `TOOL_CALLS` and locally schema-valid. It used 160,168 input / 8,283 output / 168,451 total recorded tokens and 43,139 ms summed provider latency. It made 0 Google, website, browser, booking or other external-write calls.
- Result / proof boundary: H002 A=0/2 vs B=2/2 while all three party controls remain correct. Strength is mixed: H003 B=1/2 full passes, defining-activity/drinks B=0/2, flexible-improvements B=2/2, and local optionality B=2/2. The source expectation format lacks criterion polarity, so actual polarity is recorded but not retrospectively scored; criteria order and non-exact wording are not automatic failures. This proves only this exposed sample/model comparison, not an internal causal mechanism or a production-quality improvement.
- Offline checks after diagnostic-script changes: `PRAXIS_FIELD_SCOPE_DIAGNOSTIC_MODE=preflight node --import tsx scripts/run-semantic-field-scope-diagnostic.ts`, `npm run typecheck`, `npm run arch:check`, `git diff --check` all passed. Evidence: `.eval-artifacts/semantic-field-scope-diagnostic-2026-09-18/FIELD-SCOPE-DIAGNOSTIC-REPORT.md` and the linked plan/result/ledger; no commit or push.

## TEST-2026-09-18-SEMANTIC-REPAIR-FAILURE-REVIEW — read-only artifact audit

- Scope: review `01e073f` with a clean starting worktree; no production behavior, dataset, evaluator, model or source transport changed. `node --import tsx scripts/extract-semantic-targeted-repair.ts` read the complete 48-call artifact and asserted 48 captured semantic calls plus structural equality between each decoded raw response and stored Proposal. It emits full user payload, saved context, request configuration, raw response, Proposal and original assessment; it explicitly marks final Draft as not captured because the runner did not compile/reduce.
- Audit result: all 48 were `DEEPSEEK/deepseek-flash`, JSON schema, 30s / 5000-output / temperature 0 / thinking disabled, `TOOL_CALLS`. The old scorer uses normalized phrase containment plus strength only; it does not score expected polarity, order or extras. H002 has no A/B PARTY SIZE instruction difference, H003 has a retained-word SOFT failure, and H005's v2 fact raw messages are absent. No new model, Google, website, browser, booking or external-write action was run. No test result is claimed for Prompt@3 model behavior.
- Accounting: completed artifact proves 48 successful semantic calls / 304,482 recorded tokens and zero fact calls; the second `STARTED` artifact has no result or call log, therefore its call count remains unknown and is not reported as zero. The local artifacts do not preserve authorization provenance sufficient to reconcile the prior 66-call playbook wording with the earlier 50-call constraint.
- Evidence: `.eval-artifacts/semantic-repair-failure-review-2026-09-18/REPORT.md`, `CALL-DETAILS.md`, and the read-only extractor. No commit/push was performed by this review.

## TEST-2026-09-18-TARGETED-SEMANTIC-REPAIR — one candidate, bounded semantic diagnostic

- Evidence / scope: frozen failure snapshot `9cfbd4f` (Semantic@17) versus current uncommitted candidate (Semantic@19, Fact Judgment@3). H002 actual Proposal/Draft omit PARTY_SIZE; H003 actual Proposal/Draft contain `suitable for a team dinner` at SOFT; H005 original fixed source is `Tokyo regional cuisine` rather than an explicit local-food fact. Original executions, evaluator sidecars, Gold and source artifacts are unchanged. H004 has a separate append-only supplemental condition review: user-accepted `SEMANTICALLY_EQUIVALENT`, while original automatic `NOT_EVALUATED` and all overall findings remain unchanged.
- Real semantic diagnostic: exactly **48 successful** DeepSeek semantic calls, eight fixed exposed development samples × v17/v19 × three. All were structurally PROPOSED. H002 inferred-party expectation: 0/3 → 0/3. H003 all-four-strength expectation: 0/3 → 1/3. Closed singular counterpart, open-attendee, and explicit-total controls: 3/3 in both; defining-activity/drinks and flexible-improvement controls: 0/3 in both; locality optionality: 3/3 in both. This is not a strict historical causal A/B and is not a Holdout or reliability estimate. One duplicate temporary process was terminated and left a separate STARTED artifact without a result; its provider-call count is indeterminate, so no further calls were made under the prior 50-call authorization.
- H005: Prompt@3 requires direct textual entailment and treats geographical/regional-cuisine association alone as UNKNOWN. Original a/c show over-confirmation risk, b shows insufficient evidence. The frozen fixture and scripted production composition now preserve that distinction: three facts plus three availability reads reach `NO_VERIFIED_RESULT`, no results are presented, and the registered fixed-source acceptance deliberately returns FAIL. This is fail-closed code-contract evidence, not a real Fact Judgment@3 model result. The planned v2/v3 three-candidate × three-repeat comparison (18 calls) was not run and needs fresh explicit quota.
- Offline verification: focused `node --import tsx --test src/eval/restaurant/agent-loop/current-development-offline.test.ts src/domains/restaurant/semantic-interpreter.test.ts src/integrations/restaurant-facts/model-fact-judgment.test.ts src/eval/restaurant/agent-loop/current-development-fixed-sources.test.ts` passed **29/29**. `npm run typecheck`, `npm run arch:check` (0 forbidden dependencies), `npm run build` and `git diff --check` passed. The authorized local-loopback `npm test` passed **438/438**, 0 fail/cancel/skip/todo, **17,536.623ms**; the only prior sandbox result was listener `EPERM`, recorded as environment-only and not a product failure. No real Google, website, browser, booking or external write was run.
- Decision: H004 supplemental record complete at one condition only; H002 unresolved; H003 partial and not accepted; H005 source/transport boundary corrected but real fact-judge behavior unverified. No Prompt@20, additional real-model retry, commit or push is permitted by this test record. Evidence: `.eval-artifacts/restaurant-semantic-targeted-repair/`.

## TEST-2026-09-18-H001-H005-FIXED-SOURCE-REAL-MODEL — one run per frozen development case

- Scope/budget: frozen commit `9cfbd4f`; one DeepSeek fixed-source execution each for H001–H005, with per-case ceilings 300,000ms/50 steps/50 model calls. All external source pages and Google responses were `SYNTHETIC_CONTROL` fixed transport; no real Google, website, browser, login, booking or external write occurred. Total: **25 model calls**, **95,297 tokens**, **30,990ms**, 11 controlled source-composition Google calls.
- H001: PASS — `PRESENT_RESULTS`, three distinct candidates and `{candidateCount:3, met:true}`; evaluator@16 `qualified=YES`; 5,847ms/4 model calls. Artifacts: [result](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-18T04-25-07-895Z-dd1e1427-402b-4165-a38c-7ea391805ecf.result.json) and [evaluation](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-18T04-25-07-895Z-dd1e1427-402b-4165-a38c-7ea391805ecf.result.evaluation.16-1789705513752.json).
- H002: FAIL — semantic Proposal omitted `PARTY_SIZE`; Agent correctly stopped at `NEEDS_INPUT` before source reads (3,621ms/2 calls). H003: FAIL — three results were presented, but semantic output changed required `team dinner` to `suitable for a team dinner`; evaluator rejected authoritative conditions/evidence (6,586ms/4 calls). H004: FAIL/unknown — evidence was sufficient but a SOFT paraphrase made independent semantic equivalence `NOT_EVALUATED` (6,495ms/7 calls). H005: FAIL — evaluator found the two presented candidates supported, but acceptance rejected `2/3` and `met:false` (8,441ms/8 calls). Their execution/evaluation pairs remain in the same artifact directory; no rerun was made.
- The post-run Prompt@18 / explicit-`local food` candidate is historical only. It is superseded by `TEST-2026-09-18-TARGETED-SEMANTIC-REPAIR`, which removes the case-specific sentences and restores the original H005 source. Its earlier local-pass count cannot be used as evidence for the current candidate or for the original source facts.
- Next gate: original-researcher review of both the immutable run artifacts and the local repair. A further real-model run would require a new bounded authorization and a separately recorded snapshot.

## TEST-2026-09-18-OPEN-ENDED-AVAILABILITY-RESULT-TARGET — offline production composition and acceptance

- Scope: `OPEN_ENDED` AVAILABILITY now reaches the same runtime result target as open-ended recommendation. H001–H005 each use three source-distinct candidates and retain the real Interpreter → Compiler → Runtime/Reducer → Agent/Validator → Router → fixed source → artifact evaluator route; only the model/source transports are controlled.
- Independent acceptance: registered frozen cases require exactly three distinct `presentedResults.candidateIds` and persisted `{ candidateCount: 3, met: true }`. A dedicated failure control supplies one presented candidate with an unmet target and gets `FAIL`; it cannot pass merely because the evaluator calls the single result qualified.
- Focused command: `node --import tsx --test src/eval/restaurant/agent-loop/fixed-source-acceptance.test.ts src/eval/restaurant/agent-loop/current-development-offline.test.ts` — **14/14 PASS**, 0 fail/cancel/skip/todo (520ms). This run produced no paid-model, Google, browser, replay or external-write action.
- Required final gates: `npm run typecheck`, `npm run arch:check`, `npm run build`, and `git diff --check` PASS; loopback-authorized `npm test` **436/436 PASS**, 0 fail/cancel/skip/todo (18168ms).
- Limits: scripted model decisions prove runtime/acceptance wiring and the source fixtures prove three-candidate evidence production. They do not prove real-model selection, current website behavior, real Google results or availability; original-researcher review remains pending.

## TEST-2026-09-18-OPEN-ENDED-TARGET-AND-PARTY-BOUNDARY — offline contract and Web composition

- Scope and production composition: preserved `Semantic Interpreter → Proposal Contract → Compiler → Runtime/Reducer → Agent Context/Decision → Action Validator → Router → PersistentRestaurantAgentApplication → PGlite → HTTP Web`. The Web scenario uses a controlled ModelGateway and controlled source transport only at external boundaries; it does not hand-write qualified State, access a real model/Google/browser, or perform an external write.
- Result-target evidence: semantic `TARGET.selectionScope=OPEN_ENDED` produces a first `resultBatchTarget` of three; the production Web composition presents a/b/c and projects `{ candidateCount: 3, met: true }`. Its shortfall fixture withholds b–f facts, so a is the only initially qualified result; the controlled Agent must select b/c/d for `INVESTIGATE_CANDIDATE_FACTS`, after which Router/Reducer/PGlite/HTTP present a/b/c. It asserts exactly one discovery, one fact read, four model-boundary calls and no availability read, proving the real entry does not prematurely present or blindly restart discovery while a legal fact read remains. The Domain validator rejects a one-result presentation while another cursor/fact read is legal, permits it only after both discovery and candidate reads are exhausted, and the actual Reducer records `{ candidateCount: 3, met: false }`. Schema/compiler tests accept an open user count, reject the same field for a named outlet, and preserve legacy targets without invented classification. Existing target scope/count is included in a later Semantic Interpreter model context.
- Party-boundary evidence: controlled Interpreter responses cover closed pair (2), enumerated three, explicit correction to four, open group, unspecified extra attendees, and generic dated romantic recommendation. `PARTY_SIZE.source` accepts only `EXPLICIT` or `INFERRED_CLOSED_PARTY`; Compiler/Reducer retain it only with the count and clear it with the count. The ordinary persistent Web artifact scenario proves an explicit count exports `party_size_source=EXPLICIT` and its semantic Event references the same stored user-message request ID. No code path adds 2 from a date or generic recommendation, and source never changes Router/Policy/provider inputs. This is a transport/state boundary test, not an independent real-model quality evaluation or a claim that the fixtures establish semantic inference quality.
- Commands: focused party-source Contract/Compiler/Interpreter/Web-artifact tests **4/4 PASS**; focused local Web shortfall composition test **1/1 PASS** after the first sandboxed attempt was blocked only by local `127.0.0.1` `EPERM`; focused Domain semantic/validator suite **50/50 PASS**. First unrestricted `npm test` attempt had **18** loopback `EPERM` failures solely because the sandbox denied `127.0.0.1` listeners; its remaining Domain tests passed. The final repository test command with loopback permission passed **435/435**, 0 fail/cancel/skip/todo; `npm run typecheck`, `npm run arch:check`, `npm run build`, and `git diff --check` PASS on the final worktree. No new Live/Replay/paid-model artifact was created.
- Limits: this advances offline B8/B9-like selection and B10-like condition persistence evidence only. It does not replace B1–B7 or B11–B14 historical evidence, does not prove source relevance, dynamic page controls, availability or real-model semantic quality, and is not an original-researcher review.

## TEST-2026-09-18-CONTINUOUS-SELECTION-OFFLINE — controlled Web/PGlite composition

- Scope and boundaries: actual `PersistentRestaurantAgentApplication` → Runtime/Reducer → Agent Decision → Router → PGlite persistence → HTTP Web entry was retained. The controlled test replaces only ModelGateway and restaurant-source transport; it does not hand-construct a qualified Task state and does not call real Google, a browser, a paid model, or an external write.
- Behaviour evidence: initial a/b/c are presented; browse, shortlist and `too expensive` feedback each persist through the Web entry without extra model/search/fact/availability calls. A separate scenario begins with only a/b/c and a durable cursor, records `NEXT_BATCH_REPLENISHMENT_REQUESTED`, resumes the same application loop, requests the cursor page, and presents unseen d/e/f. It asserts two searches, five model boundary calls, no fact/availability read, and no repeated delivered ID.
- Independent failure mechanisms: Google adapter contracts reject token reuse and preserve page one after page-two failure; Router tests omit a stale-intent cursor; Action/assessment tests reject exhausted reworded discovery. The prior terminal-outcome assertion was deliberately updated because a presented batch is now `WAITING_USER`, not a completed Task.
- Commands: `npm run typecheck` PASS; focused domain/Google/Web tests PASS; final `npm test` **427/427 PASS** (0 fail/cancel/skip/todo, 17239ms); final `npm run arch:check`, `npm run build`, and `git diff --check` PASS.
- Limits: scripted boundary choices prove the composition and safety constraints, not real-model judgment. No Replay or Live evidence was created; B1–B7, B10–B14 retain their previously recorded scope and this slice adds only offline B8/B9-adjacent continuation evidence. It is not an independent review or Live acceptance.

## TEST-2026-09-17-H001-30S-SEMANTIC-RETRY — Live Read-only

- Code contract: `RestaurantSemanticInterpreter` now sends `timeoutMs=30000`; its focused request-contract test **2/2 PASS** plus `npm run typecheck`、`npm run arch:check`、`npm run build` all PASS. The subsequently started full `npm test` was interrupted by the user after 3.9 seconds and has no final result; it is not reported as passing. The existing runner wrapper still bounds the request by remaining five-minute budget.
- Scope/budget: one explicit H001 retry only, isolated current source snapshot, `LOCAL_CHROMIUM` temporary profile, tomorrow→Tokyo 2026-09-19 at exact 19:00／2 people／omakase HARD; 300 seconds, max 30 model calls, 10 Google, 50 browser operations per candidate. Actual **103378ms**, 4 agent steps, 13 model calls (semantic1/agent4/browser8), Google **5/10**, three availability checks and browser operations 28/12/16 per checked candidate. No login, manual challenge, reservation submission or external write.
- Entry and identity: Sushi Inase first attempted its Google-listed `https://www.tablecheck.com/ja/sushiinase/reserve/landing`, then verified the corresponding English TableCheck outlet; `地下1階` versus `B1F` was HIGH (name/address/phone all MATCH). Sushisho Isseki Sancho was HIGH on the separately discovered TableCheck merchant page. Jinnan rejected all unrelated TableCheck discovered outlets before Tabelog identified the same branch HIGH; it remained request-control UNKNOWN rather than borrowing inventory from another branch.
- Exact request/result: TableCheck evidence for **Sushisho Isseki Sancho** claims date 2026-09-19, partySize 2 and visibleSlots `["19:00"]`, thus AVAILABLE and presented. **Sushi Inase** claims the identical date/party with an empty slots list, thus `UNAVAILABLE/NO_MATCHING_SLOT`. **Shibuya Sushi Jinnan** is `UNKNOWN/REQUEST_SELECTION_UNCONFIRMED`; seven other discovered candidates were not checked after a grounded result became available, so this does not claim complete search or global availability.
- Independent evaluator@16: `taskProducedQualifiedResult=YES`, `systemBehavior=SUPPORTED_BY_EVIDENCE`, `externalConditions=OBSERVED`, `evidenceSufficiency=SUFFICIENT_FOR_PRESENTED_RESULT`, and all six recorded dimensions SATISFIED. It does not score provider reliability, long-term inventory freshness, exhaustive discovery, subjective ranking or model quality. Artifacts: [started](../../.eval-artifacts/h001-live-tomorrow-30s-2026-09-17/workspace/.eval-artifacts/restaurant-hybrid-live-read/2026-09-17T15-08-25-556Z-fb613f8b-c6c5-4241-a98a-a056063b0af5.started.json)、[result](../../.eval-artifacts/h001-live-tomorrow-30s-2026-09-17/workspace/.eval-artifacts/restaurant-hybrid-live-read/2026-09-17T15-08-25-556Z-fb613f8b-c6c5-4241-a98a-a056063b0af5.result.json)、[evaluation](../../.eval-artifacts/h001-live-tomorrow-30s-2026-09-17/workspace/.eval-artifacts/restaurant-hybrid-live-read/2026-09-17T15-08-25-556Z-fb613f8b-c6c5-4241-a98a-a056063b0af5.result.evaluation.16-1789657808914.json)。

## TEST-2026-09-17-H001-CURRENT-REPAIR-SINGLE-LIVE — stopped before source investigation

- Scope: 用户授权的唯一 H001 Live Read-only，隔离当前修复快照；只把执行输入改为 `h001-tomorrow`，保持涩谷／omakase HARD／2 人／19:00。不是 H001–H005 批跑，不改 Gold、产品源码、Prompt、权限或浏览器规则；`LOCAL_CHROMIUM` 临时会话，没有人工 challenge、登录、预约或外部写。
- Budget evidence: started artifact 记录 30 模型调用、10 Google、每候选 50 浏览器操作和 `maxAutomaticBrowserMs=300000`；实际在 10039ms 结束。Tokyo 时区的真实启动时间为 2026-09-18 00:00:39，故 `tomorrow` 正确物化为 2026-09-19／19:00／2 人，而非把运行时条件偷偷改为日期常量。
- Execution: 首次 `restaurant_semantic_interpret` 调用使用当前 Interpreter 的固定 `timeoutMs=10000`，DeepSeek invocation 在 10003ms 记录 `outcome=FAILED,errorCode=TIMEOUT`，runner result 为 `FAILED / SEMANTIC / MODEL_FAILURE`。没有 events、trajectories、Google 请求、浏览器诊断、候选、TableCheck／Tabelog 身份诊断或空位检查；因此绝不能报告无位、入口未用、同店／分店判断、日期／人数未应用或来源读取失败。
- Independent evaluation: runner 写出独立 evaluator@16 sidecar，`taskProducedQualifiedResult=UNKNOWN`；`AUTHORITATIVE_CONDITIONS`、`REQUIRED_EVIDENCE`、`FINAL_CLAIM`、`COMPLETION_OUTCOME`、`RESOURCES`均为 `NOT_EVALUATED`，只有零次观察的谱系／重复读取记账为 `SATISFIED`。执行失败 artifact 和该无结论 sidecar 分开保留，不用 evaluator 文件存在冒充验收。原件：[started](../../.eval-artifacts/h001-live-tomorrow-2026-09-17/workspace/.eval-artifacts/restaurant-hybrid-live-read/2026-09-17T15-00-39-422Z-1d711993-99fb-48a9-b02d-5f13c5613829.started.json)、[result](../../.eval-artifacts/h001-live-tomorrow-2026-09-17/workspace/.eval-artifacts/restaurant-hybrid-live-read/2026-09-17T15-00-39-422Z-1d711993-99fb-48a9-b02d-5f13c5613829.result.json)、[sidecar](../../.eval-artifacts/h001-live-tomorrow-2026-09-17/workspace/.eval-artifacts/restaurant-hybrid-live-read/2026-09-17T15-00-39-422Z-1d711993-99fb-48a9-b02d-5f13c5613829.result.evaluation.16-1789657249430.json)。单次授权已耗尽，未自动重试；首个下一步是离线修复／验证该 semantic 单请求 timeout 与 runner deadline 的传递，再另行申请一次绝对日期、明确时区的 Live。

## TEST-2026-09-17-INDEPENDENT-IDENTITY-MATRIX

- Current executable / exposed development regression: 新增 `outlet-identity.test.ts` 的三组规则矩阵；扩展现有 TableCheck 七家历史正常对照并禁止电话捷径，Tabelog 保留共享规则接入检查；两平台同电话仍拒绝明确楼层/分店冲突。默认 npm test 自动发现，无额外运行器。
- 有效性验证：同一新增矩阵在 HEAD 565b08f 的旧规则失败；在按旧规则追加 lowercase 所重建的中间修复版也失败（明确标记重建，不宣称保存了原快照）；当前实现通过。均为目标 `ERR_ASSERTION`，不是依赖或环境故障。来源、hash、结果见 `.eval-artifacts/identity-matrix-review-2026-09-17/{red-green.json,head-before-repair.log,reconstructed-case-only-repair.log,current.log}`。
- 历史提取字段复核：Inase、涩谷 Hajime、Teppen、Sushi Labo、一石三鸟、Matsue 涩谷、Ajuuta 七家均 MATCH/HIGH；已有原安全反例仍拒绝，Maps+website 原入口反例通过。此为已保存字段的离线回归，不是当前来源或库存读取。
- 最终默认全量 **417/417 PASS**，0 fail/cancel/skip/todo，15617ms；typecheck、arch:check、build、diff check 通过。首次默认测试 402/417，15 个失败全部是沙箱禁止 `127.0.0.1` 监听的 EPERM；授权回环后通过。初次 typecheck 发现测试数据删减后的可选 phone 类型问题，去掉不必要的电话依赖后通过。最终日志分别保存，不覆盖最初失败。
- 新增三组共享规则主覆盖，已有 Adapter 用例原位扩展，不复制整个矩阵；未修改生产实现、Gold/Holdout、模型 Prompt/Evaluator 或 Live 口径。无模型/Google/外站/预约/commit/push。完整证据见[独立矩阵报告](../../.eval-artifacts/identity-matrix-review-2026-09-17/REPORT.md)。

## TEST-2026-09-17-AFTERNOON-H001-IDENTITY-ENTRANCE-REPAIR

- Before-fix evidence is retained in `.eval-artifacts/afternoon-review-2026-09-17/{REPORT.md,reproduce.mjs,results.json}`. Re-running `node --import tsx .eval-artifacts/afternoon-review-2026-09-17/reproduce.mjs` before the repair produced `CONFLICT/MEDIUM` for the historical Inase and Shibuya Hajime `地下1階`/`B1F` identities, and sent the Maps-plus-website case to TableCheck search instead of the saved outlet URL.
- After repair, the same script produces `MATCH/HIGH` for both identities and starts both the no-Maps and normal-Maps variants at `https://www.tablecheck.com/en/sushihajime-shibuya`. Existing TableCheck/Tabelog assertions retain distinct-floor, shared-phone distinct-branch, and insufficient-address refusal; new Adapter tests cover both historic identity field pairs, omitted-floor non-conflict, Maps-plus-website and invalid-lead-plus-website first navigation. Fixed-source composition retains the cross-candidate entrance re-identification test under real Google field semantics.
- Focused command over TableCheck, Tabelog, `LiveBrowserAvailability`, and fixed-source composition: **66/66 PASS**. `npm run typecheck`, `npm run arch:check`, `npm run build`, and `git diff --check`: PASS. Authorized loopback `npm test`: **414/414 PASS**, 0 fail/cancel/skip/todo, 15083ms.
- Classification: offline production-Adapter/production-composition regression plus synthetic transport. No model, Google, Live source page, Replay, booking, payment, cancellation, login, Gold/Holdout access, commit or push. This does not alter prior Live artifacts or claim current source availability.
- Follow-up regression from `floor-repair-delta.json`: Teppen `2階`/`2F` and Sushi Labo `1階`/`1F` had regressed to `CONFLICT` after the first case-normalization repair. The shared unit pattern now removes and extracts Japanese/Latin floors with identical Unicode-aware boundaries. Four historical pairs (Inase, Hajime, Teppen, Sushi Labo) re-evaluate as `MATCH`; B1F/1F and basement/ground remain `CONFLICT`. The same focused **66/66**, typecheck, arch, build and authorized **414/414** suite were rerun PASS; no Live/model/source action occurred.


## TEST-2026-09-17-H001-DATE-VARIANTS — Live Read-only

- 用户授权只改 H001 日期为 tomorrow / this Saturday；冻结当前源码到隔离 eval 工作区，预登记9月18/19日、涩谷、2人、精确19:00、omakase HARD；canonical Gold/生产源码/Prompt未改。每轮一次、5分钟、10候选、50模型调用、50 Google、每候选50浏览器操作上限。
- 明天：PRESENT_RESULTS，鮨匠一石三鳥及Matsue涩谷店，186898ms、14模型调用、108152 tokens、2 Google。周六：PRESENT_RESULTS，Matsue涩谷店，179551ms、21模型调用、107568 tokens、5 Google。两轮各发现10家/检查6家；独立diagnostic evaluator@15均qualified YES、systemBehavior SUPPORTED_BY_EVIDENCE，六项findings SATISFIED；原始执行与sidecar分别保存。
- 原9月17日基线四个UNKNOWN是发现或身份核验失败，不是库存为零。Matsue在9月17日UNAVAILABLE而18/19日AVAILABLE，支持日期库存差异；完整原页面未留存、候选与模型路径变化、早上基线与本轮源码存在已记录事实判断修复，不能声称严格因果A/B或全城无位。新变体Jinnan仍REQUEST_SELECTION_UNCONFIRMED，其他候选仍有身份UNKNOWN。
- 本轮仅运行和审查，没有新增Mock/Replay或Controlled Live-write，不重复已有本地门禁；未预约、外部写入、commit或push。共35模型调用/215720 tokens/7 Google。完整[报告和原件索引](../../.eval-artifacts/h001-date-variants-2026-09-17/REPORT.md)。

## TEST-2026-09-17-H001-H005-BASELINE-AND-ONE-FACT-JUDGMENT-REPAIR

- **Live Read-only baseline, original requests:** Tokyo execution started 2026-09-17 10:58 CST; each H001–H005 ran once with `LOCAL_CHROMIUM`, candidate limit 10, max 5 minutes, 50 model calls, 50 Google calls and 50 browser operations per candidate. H001 `TERMINAL/NO_VERIFIED_RESULT` (218288ms; 7 Agent decisions; Google 5; browser-model 11); H002 `WAITING_USER` (4265ms; asks party size before a source read); H003 `CANCELLED` (300009ms; 10 Google; browser-model 38); H004 `TERMINAL/RESULTS_PRESENTED` (7403ms; 7 fact recommendation candidates; Google 1); H005 `CANCELLED` (300018ms; Google 7; browser-model 33). H003/H005 were budget limits, not evidence of no availability; H002 is neither source nor browser failure. No shared `INFRA_BLOCKER` was established.
- **First-root evidence and local repair:** original H003 trajectory recorded HIGH-identity Google/website `bar`/`lounge bar` facts yet no `restaurant_fact_judgment` because production judgment filtered to NEGATIVE HARD criteria. H005 demonstrated the same missing positive path for `local food`; it does not imply that local food should be accepted. `model-fact-judgment.test.ts` now proves cited `lounge bar` can produce positive `verifiedHardCriteria`, while invented citations, positive conflict labels and broad types cannot. Targeted command `node --import tsx --test src/integrations/restaurant-facts/model-fact-judgment.test.ts src/eval/restaurant/agent-loop/hybrid-read-composition.test.ts src/eval/restaurant/agent-loop/current-development-offline.test.ts`: 40/40 pass. `npm run typecheck`, `npm run arch:check`, `npm run build` pass. Full `npm test` under local-loopback authorization: 371/371 pass in 14983ms; the initial restricted-sandbox 356/371 result had exactly 15 `127.0.0.1` listen `EPERM` environment failures, then the unchanged command passed with loopback permission.
- **Affected-case Live post-check:** one H003 rerun after the patch at the same caps saved a separate artifact (`2026-09-17T03-16-42-439Z-69f0962c-f2f2-4657-8da6-f3ee1f8cbfe4.result.json`) plus evaluator sidecar. It terminated `EXECUTION_FAILURE` in 205854ms after only discovery plus one availability batch: this fresh Semantic proposal made every condition SOFT, so it never invoked facts/judgment. The first reached runtime blocker was TableCheck `REQUEST_SELECTION_UNCONFIRMED` plus Tabelog `BROWSER_TIMEOUT`, not proof the positive judgment changed a Live outcome. The entry gate for full H001–H005 post-fix regression is therefore unmet; no further Live or root-cause repair was run.
- All artifacts remain append-only under `.eval-artifacts/restaurant-hybrid-live-read/`; no booking, external write, Gold/Holdout action, commit or push occurred. Evaluator@15 remains `DRAFT_DIAGNOSTIC_ONLY`/`FULL_RUBRIC_NOT_INTEGRATED`, so it is independent diagnostic evidence, not a claim of final user-task success.

## TEST-2026-09-16-BROWSER-READ-FINAL

- 最终代码门禁：`npm run typecheck`、`npm run arch:check`、`npm test`（369/369）、`npm run build`、`npm run test:browser:fixture`（23/23）全通过。日志 `.eval-artifacts/browser-final-2026-09-16/delivery-*`；最后的 Web 过期场景使用浏览器模拟时钟验证自动更新，无实等 10 分钟或额外请求。
- Mock/真实 Chromium 本地 Fixture：实际共享 Executor、两 Session、Adapter、来源 Grounding、Web 与持久化链；回归先保存跨分店、ARIA、范围外时段、禁用窗口、导出遗漏、New case 竞态、展示范围与过期标签的失败。Cloudflare Session 本地测试不等于线上 Cloudflare 服务通过。
- Replay：保存的真实 TableCheck DOM 复核允许窗口无位。真实 Web 事件离线通过生产 exporter 重新导出，events/trajectories/finalSnapshot 不变，原件和 SHA 保留；evaluator@15 两轮业务维度通过，资源字段不足仍 NOT_EVALUATED。
- 真实模型固定上下文：Agent Decision@14 最终两例通过，前轮非法重查失败保留；Semantic@14 调查说明/真正硬要求定向对照已验证。既有 static semantic regression@3 仍 1/15 PASS、11 evaluated、10 mismatch、4 blocked；不改 Gold、不将其报为通过，未用私有 Holdout。
- Live Read-only：Tabelog 八芳 9/20、4 人 5 时段；TableCheck 一石三鳥 9/18、2 人 3 时段；八芳 9/19、4 人在 18:30–19:30 明确无位。新商户两批逐例保留失败，首份 Maru 跨分店结果作废。实际 Web 两店比较与人数/日期修订均 PRESENT_RESULTS，并核对来源、替代标签、旧结果失效和刷新恢复；最终重载仅两店、库存已过期则要求刷新。详见[完整结果和边界](BROWSER-AGENT-FINAL-REVIEW-2026-09-16.md)。
- 无 Controlled Live-write，未预约、支付、登录外部账户或代勾条款。专属 Web 3033 / PostgreSQL 55439 已停止，数据和证据保留；`cleanup.json` 两端口无监听。未 commit/push。源码差异与已有改动共存，不把整体脏工作树都算为本轮新增。

## TEST-2026-09-16-WORKFLOW-CONVERGENCE

纯文档验证：检查本轮AGENTS/Planning/Test/Post-change新增链接与章节锚点、diff及职责一致性；不复制验证矩阵，不放宽已有授权、离线门禁或证据边界。未运行业务测试、模型、Replay或Live，无外部写入。工作区其他既有改动不属于本轮。

## TEST-2026-09-16-H004-EVALUATOR

2026-09-16 H004评分器误判已局部修复：diagnostic-evaluator/rubric@14将SOFT措辞语义复核与实际来源观察适用性分开，适用于展示和无结果调查记录；不放宽门店、日期、时间、人数、HARD或证据新鲜度检查。原始H004 artifact离线重评：REQUIRED_EVIDENCE从NOT_SATISFIED变为SATISFIED，AUTHORITATIVE_CONDITIONS仍NOT_EVALUATED，FINAL_CLAIM和整体结果由失败变为待复核（qualified UNKNOWN），不宣称自动2/5成功；原始执行和@13评价未覆盖，SHA核对一致。评分器42/42定向测试及arch通过；首次全仓检查受并发agent-decision.ts语法错误阻断，该错误随后消失；最终typecheck/build通过，npm test为354/356，剩余2项为并发Agent Context版本升至7但Harness/PGlite断言仍期望6，本轮未修改这些文件。未调用模型或来源Live。

Offline historical-artifact re-evaluation；42/42定向测试包含缺硬条件、错门店、错时间和bounded no-result反例；未新建测试文件。原始artifact哈希2ba39d62a63a7aa9817a731c275711164dadb495d385cf63dc9af1a7dd3e1d89。

[报告](../../.eval-artifacts/h004-evaluator-fix-2026-09-16/REPORT.md)。

## TEST-2026-09-16-TIME-SEMANTICS-20

模式：Offline + REAL_MODEL_SEMANTIC_ONLY。2026-09-16 时间语义局部修订完成：prompt@12增加EVENING，evening/night由代码temporal-policy@3按同日18:00–23:00物化；after work保持17:30–22:00且不再自动生成criterion。预算、人数和HARD/SOFT规则不变。当前开发dataset@4仅移除H003重复after work条件。离线352/352、固定semantic fixture15/15及typecheck/arch/build通过。原20条真实模型复测20/20结构合法、20调用、24694ms、107909 tokens；Q03/05/06晚间、Q02/15/16时间-only验收通过，Q01/17/18原时间行为保持。范围外仍有波动：Q06本次first date补出2人，Q02team dinner仍SOFT，Q10新增target；不声称全语义正确或长期稳定。旧快照与本轮之间还有预先存在的备选时间prompt/schema变化，故非严格隔离A/B。没有餐厅来源Live或预约写操作。

新增一项EVENING参数化校验→Compiler→Reducer行为回归，先确认旧实现校验拒绝，再修复通过；更新版本断言和H003旧预期。初次全量：336/352，15项本机端口EPERM，1项旧prompt版本断言；修正断言并解除本机监听限制后352/352。输入/context相同，温度0、thinking关闭、cap5000，无重试/截断。输入103928/输出3981 tokens；费用未计算。未执行浏览器或站点Live。证据：[REPORT](../../.eval-artifacts/time-semantics-20-2026-09-16/REPORT.md)。

## TEST-2026-09-16-USER-20-SEMANTIC — unchanged current prompt, user-provided queries

- 用户指定20条原文，Q19/20另给人数/区域/包间偏好上下文；其余无上下文，逐条独立。不优化Prompt，不切换自由表达方案，不改Gold/源码。冻结当前prompt@11/schema@3/5000输出/temperature0/thinking disabled/10秒timeout，参考时刻2026-09-16T07:13:00.237Z（Tokyo16:13）全批相同。
- 本轮仅离线输入/上下文预检：20条，19/20的给定上下文通过生产Compiler→Runtime事件建立，精确核对仅有partySize/area/criteria，无虚构目标或时间。随后复用生产Hybrid interpretAndDispatch，给模型传真实初始Draft；模型结果经真实Compiler/Reducer保存。未执行Agent loop，外部ports若触达立即报错。没有源码改动，未重复完整Mock/build。
- 真实模型run27042c66：20调用（预设上限40，实际每条1次），无重试/截断，24564ms；input94648/output3916/total98564 tokens，无usage缺失，单条输出86–423，费用未知。20条结构PROPOSED且状态更新完成，不表示20条语义全部正确。输出、初始/最终Draft和原始Proposal逐条独立保存，人工review另存，无LLM Judge。
- 明确问题：Q06以AFTER_WORK表达tomorrow night，编译器按既有17:30–22:00策略执行，首错Proposal；Q14同时text=no spicy food与NEGATIVE，违反文本不带否定的现有约定，未运行下游所以不声称结果实际反转；Q04在target.query额外加入dinner（原句going out）。
- 未直接判错的待讨论项：Q02饮酒SOFT/Q16饮酒HARD可能与句子主目的不同有关，不证明随机波动；Q03/Q05的night仅在query，无TIME_WINDOW，但未完全丢原意或编造钟点；近似预算Q07/Q09保留金额/可略超文本，没有数值容差执行政策；部分片段无TARGET，目标分类及独立after-work适配条件待明确。first-date隐含人数与场景强度不套旧有争议Gold计算总分。
- 明确边界正确：Q19仅人数CORRECT=4且Shibuya/包间偏好保留；Q20移除原POSITIVE SOFT包间criterion，4人/Shibuya保留，没有把取消偏好误成禁止包间。显式must/nice/only、可数人数和开放群体等结果详见逐例表。
- USER_SUPPLIED_20_QUERY_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false；每例仅一次，非稳定性或一般成功率估计。无Google、Browser、Replay、Controlled Live-write，外部副作用计数NOT_MEASURED；未提交/推送。证据：[报告](../../.eval-artifacts/user-20-semantic-2026-09-16/REPORT.md)、[完整20条输出](../../.eval-artifacts/user-20-semantic-2026-09-16/RESULTS.md)。

## TEST-2026-09-16-BROWSER-AGENT-P0-P4 — offline shared executor verification

- 模式：本地 Unit/Contract、真实 Chromium + 拦截合成 HTML、Mock Application/Router/Domain/Evidence/Web composition；不是 Replay、真实模型、Live Read-only或Controlled Live-write。未读私有 Holdout，未改Gold。
- `node --import tsx --test src/infrastructure/browser/browser-action-decision.test.ts src/infrastructure/browser/browser-task-executor.test.ts`：15/15通过。覆盖`browser_read_action@2` strict decoder、当前观察引用、checkbox明确状态、range单步、region scroll，以及既有预算/取消/stale target边界。
- `npm run test:browser:fixture`：9/9通过。真实 Chromium 的 local fixture 验证 modal 阻挡背景日历、selected/value 与 options 分离、checkbox/range/scroll 后置状态；另保留 Local/Cloudflare session 的`dom:`引用解析。所有页面由本地拦截提供，不访问外网或提交预约。
- `npm test`：344/344通过，0 fail/skip/todo；当前 H001–H005 使用真实内部 Router/Reducer/Context/Grounding/来源组合和独立 evaluator，外部模型/HTTP/页面为替身。`npm run typecheck`、`npm run arch:check`（0 forbidden dependencies）、`npm run build`、`git diff --check`均通过；`npm run eval:restaurant:semantic:fixture`为15/15，但分类仍是`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。
- 未运行 P3：没有本轮模型调用、Google请求、真实商户、真实网页、Live artifact、预约/付款/取消写操作或独立 Review。B2、B6–B10、B13–B14 的未覆盖范围和逐项状态见 [P0–P4交付记录](BROWSER-AGENT-RESTAURANT-P0-P4-DELIVERY-2026-09-16.md)。

## TEST-2026-09-16-SEMANTIC-PROMPT-11 — offline gates and real-model semantic-only batch

- Prompt@11 / schema@3 / output5000 / temperature0 / thinking disabled / timeout10sec；生产语义链保持Interpreter→Compiler→Runtime/Reducer。原始H001–H005、原H001复杂变体与Gold未改；4条新合成对照及其期望在模型运行前保存。引用固定参考时刻2026-09-16T02:18:29.638Z，不是当前餐厅库存Live。
- 离线typecheck、arch:check、完整Mock343/343、build及semantic fixture15/15通过。只迁移既有prompt版本断言，未新增镜像prompt措辞测试、未修改语义评分门槛或浏览器。当前版本@11不代表语义质量通过。
- 真实模型批次34ed3864：10条输入，预设最多20调用（沿用schema尝试上限），实际10调用、无重试、17327ms；10条均PROPOSED，独立人工对预登记字段/条件语义审查5满足/5不满足。input47525/output3907/total51432 tokens，无usage缺失，费用未知；全部来源ports不可执行且未被调用，无Google/Browser/Agent决策。
- 满足：H001/H002/H004/H005及开放群体对照。H002推断2人、近似10000 SOFT、first-date SOFT、排除项HARD；开放群体不虚构人数/时间。H003饮酒和团餐适配均SOFT代替HARD，缺单独after-work适用性（时间/原词/10人仍正确）；复杂H001饮酒仍SOFT。两个新对照near Ueno/Akasaka关系词丢失；家庭对照虽正确数4人/vegan HARD，却多提取budget is flexible正向SOFT条件。
- 评分为独立人工语义审查，原始执行与evaluation.json分开；未调用LLM Judge，也未把@13网站证据评分器套用到语义-only。H003的after-work重复语义要求是原有契约，非新增标注；同义表达人工核对不改Gold。新的对照无@10基准，不能称@11引入回归；H002/H003旧500预算结果与当前同时改变prompt/预算，因果混淆；复杂H001旧5000预算对照下饮酒强度仍未改善。
- 分类EXPOSED_DEVELOPMENT_SEMANTIC_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false，5/10不外推一般成功率。未读/运行私有Holdout、无Replay/浏览器Live/Controlled Live-write；外部副作用计数NOT_MEASURED，未提交/推送。证据：[完整报告与prompt](../../.eval-artifacts/semantic-prompt-11-2026-09-16/REPORT.md)。

## TEST-2026-09-16-SEMANTIC-OUTPUT-BUDGET — offline gates and single Live treatment

- 用户授权5000单次输出上限；既有Interpreter请求测试新增5000预算断言，旧实现500!==5000红色证据已保存。实际请求及当前Eval manifest共用导出常量。Prompt文本@10、schema@3、模型、temperature0、thinking disabled、10秒timeout与重试保持不变；不读取/运行私有Holdout，不改历史artifact或原五例Gold。
- 本次离线typecheck、arch:check、npm test343/343（0fail/skip/todo）、build、semantic fixture15/15通过；复用未受影响的此前Chromium7/7，不冒充本次重跑。没有新增测试套件，预算断言归入原Interpreter请求契约测试。
- 与500-token变体完全同输入/预登记期望，以独立快照运行一次Live，ede11126；UTC02:18:29开始，336966ms，10步，10候选，END_READ/NO_VERIFIED_RESULT。语义调用2179ms，input4459/output520/total4979 tokens，TOOL_CALLS正常返回；输出大于此前500上限，直接支持预算缺口已在本例解除，但不证明所有复杂输入均足够。
- 原始Proposal正确保留2人推断、今晚19点/涩谷、omakase HARD、近似15000/date night/private room SOFT；good for drinks仍为SOFT，违反预登记HARD，独立@13 qualified=NO，不能视为语义全通过。Compiler/Reducer未改写该强度。H002/H003未复跑，不把本例结果外推到它们。
- 空位1UNAVAILABLE+9UNKNOWN；来源仍有身份不确定、选择未确认、外部Provider限制；当前终态指出omakase缺少证据，非确认全局无位。评价器因权威请求冲突而排除适用观察，不能解释成实际未搜索。新增条件改变搜索候选，端到端无结果不能归因于输出预算增加。
- Google12（named1/discovery1/details10）；24模型调用（semantic1/Agent10/browser13）共143618 tokens，均有usage，费用未知。只读执行，无Replay/Controlled Live-write、未提交/推送；外部副作用计数NOT_MEASURED。原始执行、独立@13评价、版本/输入hash、红绿和门禁日志：[报告](../../.eval-artifacts/semantic-output-budget-5000-2026-09-16/REPORT.md)。

## TEST-2026-09-16-H001-COMPLEX-VARIANT — single Live Read-only diagnostic

- 用户授权一个H001复杂表达变体；预先固定文本及独立期望，保留涩谷/当日19:00/omakase/实际2人，显式人数改为me and my partner，增加date-night、近似15000日元、饮酒和理想包间。多个因素共同变化，不是单因素因果实验。原五例及Gold保持不变；只在独立冻结实验副本追加h001-complex-variant，明确synthetic exposed development / baselineEligible:false，runner的@3数据标签仅为入口兼容，不把该变体当canonical H001。
- 输入预检PASS：YAML六条、原文物化不变、2人、19:00、5条件；无模型或网络。执行源码与上午成功H001逐文件hash相同（仅副本case YAML不同），prompt@10/schema@3/500-output-token上限/temperature0/thinking disabled均不变；沿用既有离线门槛，本次未重复完整Mock/build。
- 运行2aaf6d09，UTC02:00:45开始，2331ms，单次DeepSeek语义调用延迟2299ms；MALFORMED_RESPONSE/STRUCTURED_OUTPUT_SHAPE，finish_reason=length; tool_calls=1。MODEL_FAILURE，无完整Proposal、无状态事件/Agent轨迹，GOOGLE_BROWSER_AGENT_NOT_REACHED；runner退出码1，无补跑。usage未保存，tokens及费用未知，不能记0或声称实测正好500。
- 与原H001的318输出tokens成功及H003同类length错误对照，确认截断在更复杂H001也会出现。本次未判断H002式人数/近似预算/条件强度错误，未证明一般因果或成功率；未提高预算验证反事实。原始执行及独立@13评价分别保存，评价不能把未到达阶段当验收通过。
- 无新增Replay、Controlled Live-write、产品代码或Prompt修改、提交、推送；未到浏览器/Google/写链路，外部副作用计数NOT_MEASURED。证据：[REPORT](../../.eval-artifacts/h001-complex-variant-2026-09-16/REPORT.md)，同目录计划、变体Gold、provenance、预检、原始执行/独立评价及核验。

## TEST-2026-09-16-H001-H005-LIVE-RERUN — Live Read-only and offline diagnostics

- 用户明确授权复跑H001–H005，五条原文各执行一次，没有自动补跑。a093764+已有修复的src/web-skills冻结快照与昨晚最后H003执行源码一致；运行后根目录及快照源码hash未变。LOCAL_CHROMIUM临时会话，10候选/30步/Google100次/20分钟既有预算。Tokyo 10:18–10:23执行，H001当日19:00及H004当日12–17点均未过期；H005“现在”仍物化为执行起点10:19，后续精确分钟过期风险未排除。
- Mock预检：当前development内部composition 6/6通过（五例+父套件）；昨晚完整Mock343/343、Chromium7/7、typecheck/arch/build因相同源码复用，本次没有重跑这些完整门槛。无新增Replay。
- H001 `6f04cb04`：45465ms/3步，10发现/3空位检查，Google2，6模型调用/31172 tokens；TableCheck观察到鮨匠一石三鳥当日19:00/2人slot，PRESENT_RESULTS，独立@13 qualified=YES。实际日期操作成功，人数默认2，不证明自定义人数控件修复；slot为运行时观察，有效期已在原始证据中保存。
- H002 `d29da2ba`：3112ms/1步，Google0，2模型调用/7489 tokens，NEEDS_INPUT；原始Semantic Proposal漏人数推断、近似预算变硬上限、first-date SOFT变HARD，qualified=NO。尚未触及浏览器。
- H003 `4f497632`：1790ms，1次语义调用FAILED，finish_reason=length/tool_calls=1，MALFORMED_RESPONSE后MODEL_FAILURE。当前语义maxOutputTokens=500；无Google/浏览器，无usage（不能计0）。本次未重新验证昨晚good for drinks条件或下拉框问题。日志成功记录response model、失败记录configured model，名称差异不构成换模型证据。
- H004 `c5888de9`：5565ms/2步，Google1，3模型调用/14189 tokens；2家推荐有Google咖啡馆、距离及当日下午营业事实支撑，原始自动qualified=NO。审查发现SOFT同义措辞导致applicableRequest=false，实际证据观察被误排除。单独OFFLINE_SYNTHETIC_COUNTERFACTUAL只在复制artifact中归一SOFT文本即全项SATISFIED，删除HARD证据负向对照不通过；原始artifact哈希不变，Gold/源码/原始评价均未改。此实验不是Live验收替代，不计自动2/5成功，也不证明主观聚会氛围。
- H005 `6136466d`：221649ms/8步，9候选各一次事实和空位检查，Google10（1 discovery/9 details），25模型调用/103551 tokens，NO_VERIFIED_RESULT，qualified=NO。TableCheck9身份不确定；Tabelog7身份不确定/2外部Provider限制；所有空位UNKNOWN。候选含food court等聚合实体；官网7次尝试中3读取失败、4结构化身份未核实，2候选无URL。正向local food事实缺失、官网共享2次模型预算及逐页诊断不足仍在。本次无重复读取、无实际下拉框失败、无步数耗尽；不证明调查充分或确实无位。
- 原始自动评价仅H001合格。历史对照受代码、目标契约、时刻和候选差异影响，仅描述性比较；不能把更快失败/更少调查等同成功率提升。数据restaurant-read-development@3 / acceptance@2 / evaluator-rubric@13 / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false，非Clean Baseline。
- 共37模型调用（36成功/1失败），已记录至少156401 tokens（input150029/output6372），Google13；执行耗时合计277581ms，串行墙钟约279555ms。费用未知，H003usage缺失。全部runner退出且自有进程组无残留；未进入受控预约/支付写链路，实际外部副作用计数仍NOT_MEASURED。无Controlled Live-write、产品代码修改、提交或推送。
- 证据及完整归因：[REPORT](../../.eval-artifacts/h001-h005-live-2026-09-16/REPORT.md)，同目录含计划、源码provenance、五例日志、comparison、离线反例及post-run verification；原始started/result和@13 sidecar保存在restaurant-hybrid-live-read目录。

## TEST-2026-09-15-H003-LIVE-AND-CONTROL-REPAIR — Live Read-only and offline regression

- 用户授权Mock后运行Live。选择未过期的H003原文，当前Tokyo参考时刻物化2026-09-18/17:30–22:00/10人，显式东银座评估点；候选上限10、Agent30步、Google100次、自动调查20分钟，LOCAL_CHROMIUM临时headless会话，不开启人工验证。两次运行都保存不可覆盖的started/result及独立@13 evaluation。当前数据restaurant-read-development@3 / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false；不是Clean Baseline。
- 首轮`f7e969d3`：TERMINAL/NO_VERIFIED_RESULT，284490ms，10步、10候选事实+空位检查、Google11（1 discovery/10 details）、22次DeepSeek（1 semantic/10 agent/11 browser）、146326 tokens。三次真实SELECT_AUTHORITATIVE将dom引用送给CSS解析器；TableCheck本地接线故障不能解释为站点不可访问。网站9次身份不确定/1次读取失败；所有空位UNKNOWN。
- 原有Chromium Harness补同一参数化场景（Local与Cloudflare session，远程连接替换为本地Chromium），保留真实Executor/DOM，仅替换模型传输和网络。修复前原5条通过、新2条失败；修复两种session的fill/select引用查找后7/7。完整npm test343/343、0 fail/skip/todo；typecheck、arch:check（0 forbidden dependencies）、build通过。真实Cloudflare远程服务未调用；HTML为Synthetic，不是Replay。
- 修复后唯一追加轮`e60abc02`：TERMINAL/NO_VERIFIED_RESULT，316186ms，仍10步/10候选/Google11/22次DeepSeek，154606 tokens。dom CSS错误已消失，但5个人数控件实际是自定义combobox，被错误当原生select而失败。该控件类型缺口仍未修复；本地原生select Fixture通过不证明自定义控件已支持。网站10次身份不确定；所有空位UNKNOWN。每轮Tabelog均8次外部预约Provider限制/2次身份不确定。
- 两轮独立诊断均qualified=NO、systemBehavior=NOT_SUPPORTED；AUTHORITATIVE_CONDITIONS和COMPLETION_OUTCOME为NOT_SATISFIED，调查重复核验及资源记录SATISFIED，一般调查充分性NOT_EVALUATED。真实原始Semantic Proposal已将good for drinks从HARD降为SOFT，并缺after work适用性criterion；Compiler/Reducer保留该Proposal，时间原词/宽窗仍存在，不能误报为日期/人数丢失。诊断中的“无适用请求的discovery”源自条件不一致，不代表没有实际Google搜索。
- 对照9月14日H003（285464ms、30步、Google50、33模型调用/215478 tokens、STEP_LIMIT/FAILED、0空位检查），当前到达了10个空位检查并正常有界结束，但未提升合格结果数、未变快；原文哈希相同，历史Prompt/目标/时段、候选及外部状态不同，仅为描述性对比。历史执行不覆盖，另存@13补评。
- 两轮共44次DeepSeek、300932 tokens，显式费用输入缺失，cost=NOT_MEASURED；未执行预约、支付或其他受控外部写链路，实际副作用计数仍NOT_MEASURED。没有第三次Live、私有Holdout、Cloudflare服务Live或新增Replay。证据目录`.eval-artifacts/terra-live-review-2026-09-15/`包含计划、运行前后patch/hash、对照JSON、红绿/Mock/build日志及报告。修改未提交、未推送。

## TEST-2026-09-15-TERRA-REVIEW-REPAIR — Mock source composition and independent diagnostics

- 基线a093764；已保存旧源码下的红色证据：官网刷新失败仍PRESENT_RESULTS、Evaluator将其判为SUPPORTED_BY_EVIDENCE、关门后Context仍openingHoursMatch=true。三处均在预期业务断言失败，正常首次展示作对照。扩展Google在复合读取起点失败的反例后，又关闭了Evaluator遗漏EXECUTION_FAILURE来源观察的问题。
- 原H001–H005自定义search/facts/availability ports已退役；测试现在使用真实GooglePlacesClient/GooglePlacesRestaurantSearch、Google→官网→判断组合、LiveBrowserAvailability/TableCheck/AvailabilitySourceResolver，保留Interpreter/Compiler/Runtime/Context/Validator/Router/Grounding。只替换模型传输、HTTP与Browser页面，未计划调用仍失败；无手工State或合格Evidence注入。旧CONCRETE-VISIT条目中关于五例已具完整来源组合和独立诊断的表述，由本条纠正；旧结果仅证明当时内部链。
- 五例从未修改的YAML原文进入；补齐替身原先遗漏的SOFT条件后，五例AUTHORITATIVE_CONDITIONS均SATISFIED。H001/H003实际slot、H004官网营业事实推荐的qualified=YES；H002实际UNAVAILABLE、H005缺负向HARD证据的qualified=NO且NO_VERIFIED_RESULT。两者COMPLETION_OUTCOME仍NOT_EVALUATED：当前诊断器不自动证明非空候选调查充分性。不能报告“5/5用户目标完成”。
- 完整`npm test`为343/343、0 fail/skip/todo，约14.9秒；typecheck、arch:check（0 forbidden dependencies）、build通过。语义fixture15/15、搜索fixture3/3、本地Chromium fixture5/5。真实浏览器fixture只证明本地页面/控件契约。
- 完整Mock首次自动权限审核超时未执行；获准重试后运行成功。该超时不是产品或安全失败。测试未加载.env、未运行付费模型/真实来源/Live、真实PostgreSQL或任何外部写入。
- 证据保存在本地忽略目录`.eval-artifacts/terra-repair-2026-09-15/`：red/green日志、五例分离的`.mock.result.json`/`.mock.evaluation.json`及修复报告。对审查时旧错误artifact另存@13补评，不改写原始执行或@12结果。这些均为exposed synthetic development diagnostics，不是Clean Baseline或Replay。


## TEST-2026-09-15-CONCRETE-VISIT-READ-CLOSURE — offline execution and diagnostic verification

- 红色证明先于修复：`Availability keeps its delivery goal while candidate discovery waits only for discovery inputs` 在旧 Validator 上被错误拒绝；将 `END_READ` 的 Router `TERMINAL` observation 送入旧诊断器得到 `NOT_EVALUATED`。两项均有正常对照，失败归因于待修的产品/评分契约而非替身或类型错误。
- 当前实际 composition 的定向套件为 99/99：从 H001–H005 YAML 原文进入 Hybrid 初始化，保留 Interpreter、Compiler、Runtime/Reducer、Context、Validator、Router、Grounding 与独立诊断；固定模型和来源计划只按原文匹配，未计划调用立即失败。H001/H003 得到当前 slot，H004 得到事实推荐，H002/H005 分别得到有依据的无结果与未核实结果，不注入中间 State 或合格 Evidence。
- 默认离线套件在获准本机 loopback fixture listener 环境为 `npm test` 339/339，0 failed/skip/todo。首轮受限沙箱的 listener `EPERM` 与产品失败分开记录；其中唯一产品回归是 Harness 仍断言 Context `@5`，已更新为当前 `@6` 合约后重跑通过。
- `npm run typecheck`、`npm run arch:check`（0 forbidden source dependencies）、`npm run build`均通过；`npm run eval:restaurant:semantic:fixture` 为 15/15，明确分类为 `DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`，不作为模型质量 Baseline。
- `npm run test:browser:fixture` 在受限沙箱被 Chromium Mach-port 权限阻断，获准本机受控权限后为 5/5；只访问本地 fixture，覆盖通用模型驱动的无站点专用适配读取，不访问外部网络或执行提交。新增/更新的覆盖归入既有 action-validator、grounding、Context、diagnostic 和 Harness 测试；当前 H001–H005 离线组合为唯一新增实际入口覆盖，未保留重复执行器。
- 未运行付费模型、真实网站/来源、Hybrid 或 Web Live、真实 PostgreSQL、预约、支付、取消、登录或任何外部写入。离线结果不证明自由文本模型选路、当前 DOM 兼容性、实时库存、搜索穷尽或一般调查充分性。

## TEST-2026-09-15-READ-ACCEPTANCE-ALIGNMENT — current development contract (superseded in part by the concrete-visit closure above)

- 范围：实际当前YAML loader → relative-time materializer → 独立diagnostic evaluator的AUTHORITATIVE_CONDITIONS维度；固定2026-09-16T03:00Z，五例分别采用独立编写的请求预期，完整错误goal反例不得通过。没有把Gold复制成模型响应，也未执行模型/来源或声明结果证据合格。
- 数据保护：旧YAML SHA-256固定核验，五例content与归档逐条相等；当前文件只有一份semantic参数预期。额外反例证明日期/时钟物化不修改原始用户消息里的相同字面值。合成空位Evaluator fixture改用独立名称，不再冒充当前H001。
- 定向materializer + evaluator：47/47。完整默认`npm test`初次因沙箱不允许127.0.0.1监听失败；获准同命令在本机listener环境重跑后328/328、0 failed/skip/todo。typecheck、arch:check、build、diff检查通过；7份相关文档链接核验无缺失。
- 未覆盖：真实模型理解和自由文本等价、来源调查、完整推荐质量与Live；原有END_READ/负向证据诊断缺口不在本轮修复。完整错误goal反例补足空位参数以隔离goal冲突；当前Evaluator对另有缺记录的混合错误可能返回NOT_EVALUATED，不声称可精确定位全部语义首错。
- 无Live、付费模型、真实网站、外部写入、提交或推送；未重跑历史artifact或更改历史评分。浏览器执行未改，因此未另跑Chromium fixture。

## TEST-2026-09-15-SHARED-READ-EXECUTION-REPAIR — offline regression closure

- 用户审查后的防线定向命令`node --import tsx --test src/eval/restaurant/agent-loop/hybrid-read-composition.test.ts src/eval/restaurant/agent-loop/diagnostic-evaluator.test.ts`先以56通过、9失败确认残余均为业务红色。修复候选 oracle、观察 lineage 和变异辨别力后，再修共享执行；最终该定向命令为65/65。
- 最终定向：Hybrid + Evaluator为65/65；`read-grounding.test.ts`为13/13。覆盖请求更新不被去重、跨批/顺序累计、Google耗尽后的browser可达性、候选间来源范围、UNKNOWN slot保留独立事实，及独立候选截断、轨迹候选/日期篡改、search-only事实推荐等反例。
- `npm run typecheck`、`npm run arch:check`、`npm run build`和`git diff --check`通过。获准本机loopback监听环境，最终默认`npm test`为325/325，0 failed、0 skip/todo。未运行付费模型、真实Google/网站、浏览器Live、数据库部署、预约或其他外部写操作。

## TEST-2026-09-15-FIVE-CONTRACT-COMBINATORIAL-DEFENSE — initial offline integration and evaluator (superseded by the repair entry above)

- 基线（业务未改前）`hybrid-read-composition.test.ts` + `diagnostic-evaluator.test.ts`为31通过、7失败；7项均为既有Hybrid业务回归。扩展后定向运行`npm run typecheck && node --import tsx --test src/eval/restaurant/agent-loop/diagnostic-evaluator.test.ts src/eval/restaurant/agent-loop/hybrid-read-composition.test.ts`为51通过、9失败、0 skip/todo：新增两项红色入口分别为重复semantic event id导致请求更新失效，以及固定种子发现并最小化的跨批累计缺陷。随后独立审查发现候选oracle、observation lineage与部分变异的命名/实际破坏不充分；这些初始结果不作为验收，已由上方修复条目替代。
- `node --import tsx --test src/eval/restaurant/agent-loop/diagnostic-evaluator.test.ts`为37/37。成对正反artifact控制验证条件保真、候选/来源/请求/时效归属、UNKNOWN不伪装为无位、真实执行记录与提前结束；M01–M08均被相应断言拦住。M01–M02在`/tmp`隔离源码副本执行，正常对照先通过；M03–M08仅变异`structuredClone`公开样本，未覆盖历史artifact。
- `npm run arch:check`、`npm run build`和`git diff --check`通过。获准本机loopback监听环境，最终默认`npm test`为320项：310通过、10失败、0 skip/todo；失败项为8个既有执行回归、请求更新event-id错误及同一状态累计根因的随机独立复现。首次受限沙箱的监听`EPERM`单独归为环境限制，不作为产品失败。
- 未运行付费模型、真实Google/网站、浏览器Live、数据库部署、预约或其他外部写操作；测试替身不证明自由文本理解、真实页面兼容性、实时库存、搜索穷尽或一般调查充分性。

## TEST-2026-09-12-WEB-READ-INTEGRATION-CLOSURE — offline integration

- 先运行冻结复现脚本（真实内部Router/Application/Reducer/Grounding，外部来源与模型为离线边界）：基线四项均失败，分别为浏览器取消与deadline的`unhandledRejection`、后台版本变化没有Case通知导致编辑stale、刷新后展示仍引用旧事实、无日期事实推荐被Eval错误要求availability。保留其同时确认的既有正确行为：事实推荐可展示，刷新后的关门或`UNKNOWN`不会复用历史成功。
- 修复后复现均通过：取消/deadline两个分支`unhandled=[]`；后台由版本1推进到2时通知1次，按版本1编辑被接纳；成功→新成功只引用当前事实；无日期推荐在`PRESENT_RESULTS`后独立诊断为`taskProducedQualifiedResult=YES`/`REQUIRED_EVIDENCE=SATISFIED`。这些是离线集成结果，不是来源Live。
- 新增现有`src/server/local-web-server.test.ts`中的两类HTTP/SSE回归：W08从真实Web取消流程写出不可变`WEB_READ` result并由同一Evaluator写出sidecar；W09先接收`SEARCHING` SSE推进，再以创建时用户版本编辑需求，验证旧读取取消、更新被接受且新partySize成为权威状态。它们覆盖此前测试没有覆盖的后台进度/version竞争和普通Web artifact接线；没有保留临时复现脚本为第二测试体系。
- 最终离线门禁：`npm run typecheck`、`npm run arch:check`（0 forbidden dependency）、`npm run build`、`git diff --check`均通过；获准本机loopback环境`npm test`为`259/259`；真实本地Chromium动态Fixture为`5/5`。受限沙箱首次不能绑定`127.0.0.1`（`EPERM`）；获准本机loopback环境重跑后通过，未访问外部网络。Live/付费模型/外部来源、真实PostgreSQL、预约/付款/登录/取消及push均未运行。

## 2026-09-05 — Draft repository improvement plan: documentation-only verification

- 范围：新增[Repository Improvement Plan](../REPOSITORY-IMPROVEMENT-PLAN.md)、INDEX入口和本次DEVLOG/TEST-LOG记录；整改项仍为`draft / not integrated`。
- 前序静态Review：43份当前文档/入口无失效相对链接；现有测试文件均被npm test路径规则匹配。这不代表测试已运行或功能通过。
- 本次交付检查：核对新清单链接、14个工作项及其索引；检查本次diff空白与原有未提交改动保留情况。
- Mock/Unit、Replay、build、Live Read-only、Controlled Live-write及付费模型Eval均未运行：本次仅整理文档，没有代码或测试行为变更。未修改人工标注、Golden Set、私有数据或已有artifact。

## 2026-09-04 — Eval-only Tabelog explicit human challenge resume experiment

### Scope

仅开发/eval的LOCAL_CHROMIUM headed persistent profile和Tabelog manual challenge pause。没有产品Desktop/Mobile surface、stealth、CAPTCHA自动化、预约或写路径变更。

### Checks

- Focused Browser Runtime、factory、Tabelog adapter、source resolver和Router tests：通过`27/27`。覆盖headed persistent context/profile关闭、缺失browser binary的稳定失败、`USER_INTERVENTION_REQUIRED`、浏览器在pause期间保持打开、同一session/page恢复、无自动search retry、challenge仍在时fail closed、challenge清除后继续既有identity/availability读取。
- `npm test`：在允许本机HTTP/SSE fixture listener的环境中通过`159/159`，0 failed。首次沙箱运行仅7个本地server测试因`listen EPERM 127.0.0.1`失败；其余152项及本次focused均通过，随后同一命令在受控本机listener环境完整通过。
- `npm run typecheck`、`npm run arch:check`、`npm run build`和`git diff --check`：通过；Architecture check为0 forbidden dependency。

### Live Read-only

在离线门禁后仅运行一次：`PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM PRAXIS_LOCAL_CHROMIUM_INTERACTIVE=1 PRAXIS_EVAL_ALLOW_TABELOG_MANUAL_INTERVENTION=1 npm run eval:restaurant:agent-loop:hybrid-live-read -- --case h001`。Semantic Interpreter在第一步返回`MODEL_FAILURE`，runner在Google discovery、Browser launch、Tabelog或人工暂停之前退出，因而无新的artifact。没有外部写、Authorization、Booking、payment、cancellation或PII submission；此结果不证明真实challenge能被恢复。

## 2026-09-04 — H001 TableCheck→Tabelog source-chain verification

### Scope

Restaurant-only deterministic TableCheck-first/Tabelog-fallback read chain、TableCheck HIGH outlet identity and explicit slot grounding、provider failure isolation and 403 attribution。没有改变Agent action、HARD evidence、预约或其他写路径。

### Checks

- Focused source resolver、TableCheck adapter、Tabelog adapter、Grounding与Router tests：通过`33/33`。覆盖确定性优先级、TableCheck failure→Tabelog fallback、Tabelog `BOT_CHALLENGE`仍为provider-level、所有来源耗尽fail closed、exact phone/name+address、name-only拒绝、显式slot、无click/fill/submit、TableCheck 403不伪报identity以及所有来源相同browser failure的内部terminal处理。
- `npm test`：通过`156/156`，0 failed（获准localhost fixture listener环境）。
- `npm run typecheck`、`npm run arch:check`（0 forbidden source dependencies）、`npm run build`和`git diff --check`：通过。

### Modes and external effects

仅在完整离线门禁后运行一次`PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM npm run eval:restaurant:agent-loop:hybrid-live-read -- --case h001`。artifact为`2026-09-04T08-32-54-786Z-h001.json`：Google Discovery为10个候选，Agent在同一个`CHECK_AVAILABILITY`中检查前三个；每个候选先收到TableCheck `403 Forbidden`，后收到Tabelog `Just a moment...`，最终`NEEDS_INPUT / WAITING_USER`和`AVAILABILITY_SOURCES_EXHAUSTED`。未获得同Outlet HIGH identity、availability或`PRESENT_RESULTS`。之后只做离线403归因修正，未重跑H001。没有Authorization、预约、付款、取消、个人信息提交或其他外部写操作；artifact的`sideEffects`全为0。

## 2026-09-04 — H001 identity diagnostics and Tabelog challenge attribution

### Scope

Eval-only Google→Tabelog identity diagnostic retention and correct fail-closed attribution of browser-visible Tabelog anti-bot challenges. No change to HIGH identity policy, availability semantics, H001 HARD evidence or any write path.

### Checks

- Focused Tabelog adapter and read-grounding tests: passed `19/19`. Covers search/detail/canonical diagnostics, JSON-LD/DOM/tel provenance, normalized phone conflict reporting, challenge-query sanitization, `Just a moment...` recognition and `BOT_CHALLENGE` grounding precedence.
- `npm test`: passed `146/146`, 0 failed (in the approved localhost-listener environment).
- `npm run typecheck`, `npm run arch:check` (0 forbidden source dependencies), `npm run build` and `git diff --check`: passed.

### Modes and external effects

One and only one `PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM npm run eval:restaurant:agent-loop:hybrid-live-read -- --case h001` run occurred. Artifact `2026-09-04T08-00-55-386Z-h001.json` showed successful Google discovery and a local browser reaching Tabelog, but all three search pages were the Cloudflare `Just a moment...` challenge before any result or detail page could be parsed. The run ended `NEEDS_INPUT / WAITING_USER`; it did not prove HIGH identity, availability evidence or `PRESENT_RESULTS`. No Authorization, booking, payment, cancellation, PII submission or other external write occurred.

## 2026-09-04 — Local Playwright Chromium runtime verification

### Scope

新增仅开发/eval的`PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM` BrowserRuntime；保持Cloudflare AUTO/Kitesurf/Chromium选择、Tabelog逻辑、HARD evidence和所有写路径不变。

### Checks

- Focused Browser Runtime/Tabelog checks：通过`16/16`。覆盖LOCAL选择不要求或构造Cloudflare、AUTO/KITESURF/CHROMIUM继续为Cloudflare、local session的snapshot与page/context/browser cleanup，以及launch失败到`BROWSER_RUNTIME_FAILED`的映射。
- `npm test`：通过`142/142`，0 failed（获准本机listener环境）。
- `npm run typecheck`、`npm run arch:check`（0 forbidden source dependencies）与`npm run build`：通过。

### Modes and external effects

首次isolated local probe因缺少Playwright Chromium binary明确失败；安装binary后发现并修复裸`chromium.launch`丢失BrowserType绑定的问题，focused tests仍为`16/16`、完整基线仍为`142/142`。修复后的`example.com` probe成功启动、导航、读取`Example Domain`并关闭。本轮随后只运行一次`PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM npm run eval:restaurant:agent-loop:hybrid-live-read -- --case h001`，artifact为`2026-09-04T07-35-19-762Z-h001.json`：Google Discovery成功，三次Tabelog read带`LOCAL_PLAYWRIGHT_CHROMIUM` metadata、总耗时约6.3秒，均为真实`ENTITY_MATCH_UNCERTAIN`；没有HIGH identity、availability evidence或`PRESENT_RESULTS`。没有Cloudflare访问、Authorization、预约、付款、取消、个人信息提交或其他外部写操作。

## 2026-09-04 — H001 browser attribution and fail-closed terminal handling

### Scope

只修复Cloudflare Browser Run会话建立失败被误分类为`ENTITY_MATCH_UNCERTAIN`，以及所有候选同一浏览器基础设施失败后Agent向用户提问的路径；不放宽Google→Tabelog HIGH identity、HARD evidence或任何预约/写路径。

### Checks

- Focused grounding、Tabelog adapter、Router与Harness tests：通过`39/39`；覆盖browser startup reason保留、metadata可观察性、共享browser failure的terminal Router标记及无`ASK_USER`的`FAILED`结束。
- `npm test`：通过`138/138`，0 failed（首次沙箱运行仅因127.0.0.1 listener受限，使用获准本机权限重跑通过）。
- `npm run typecheck`、`npm run arch:check`（0 forbidden source dependencies）、`npm run build`与`git diff --check`：通过。

### Modes and external effects

仅运行一次`npm run eval:restaurant:agent-loop:hybrid-live-read -- --case h001`，artifact为`2026-09-04T01-35-21-558Z-h001.json`。Semantic与Agent决策成功；两次Google Discovery在8秒deadline超时，第三次为Google搜索预算耗尽，最终`NEEDS_INPUT / WAITING_USER`。没有候选、Browser session、Tabelog搜索/详情页、availability evidence或`PRESENT_RESULTS`，因此不能把identity修复报告为真实页面成功。没有Authorization、预约、付款、取消、个人信息提交或其他外部写操作；`sideEffects`为0。

## 2026-09-03 — H001 identity, area and no-progress offline verification

### Scope

Google structure-backed `near Shibuya` grounding、Tabelog relative/canonical page identity enrichment和重复availability read拒绝；不改变HARD evidence门槛、预约或其他写路径。

### Checks

- Focused tests：通过`43/43`。覆盖relative Tabelog result URL、门店页电话/地址提取和exact-phone HIGH identity；结构化Google address component area evidence与格式化地址关键词拒绝；重复candidate availability action在Router之前被拒绝。
- `npm test`：通过`134/134`，0 failed（允许localhost fixture listener）。
- `npm run typecheck`、`npm run arch:check`（0 forbidden source dependencies）与`npm run build`：通过。

### Modes and external effects

以上离线验证覆盖Unit、Contract、Fixture、Mock Harness、Embedded PGlite和local HTTP/SSE。随后仅运行一次`npm run eval:restaurant:agent-loop:hybrid-live-read -- --case h001`：Semantic与4次Agent decision均HTTP 200；两次Google Discovery在Router的8秒deadline失败，第三次为`GOOGLE_SEARCH_BUDGET_EXCEEDED`，Agent安全地`ASK_USER`并以`WAITING_USER`退出。没有候选、Tabelog读取、Availability Check或`PRESENT_RESULTS`，所以本次不能把离线身份/area修复报告成真实Provider成功。没有Authorization、预约、付款、取消、个人信息提交或其他外部写操作；`sideEffects`为0。

## 2026-09-03 — H001 DeepSeek strict Agent transport verification

### Scope

`restaurant_agent_decide` 的DeepSeek Beta strict function wire compatibility、非2xx安全诊断和canonical `restaurant_agent_action@3`恢复；不改变外部Provider读路径或任何写操作。

### Checks

- Focused tests：通过`10/10`，覆盖全字段required/`additionalProperties:false`的strict wire schema、wire到canonical恢复、无关有效字段fail-closed、Beta endpoint/function strict shape，以及provider非2xx的status/request ID/code/type/脱敏message诊断。
- `npm test`：通过`129/129`，0 failed（在允许localhost fixture listener的环境中）。
- `npm run typecheck`：通过。
- `npm run arch:check`：通过，0 forbidden source dependencies。
- `npm run build`：通过。
- `npm run eval:restaurant:agent-loop:hybrid-live-read -- --case h001`：仅执行一次真实Live Read-only。Semantic与6次`restaurant_agent_decide`均为HTTP 200；模型问题已越过。Google Discovery完成10个候选；首次Tabelog availability对前3个候选均fail closed为`ENTITY_MATCH_UNCERTAIN`，后续重复检查触发`READ_BUDGET_EXCEEDED`，最终为`STEP_LIMIT / NEEDS_INPUT`，未进入`PRESENT_RESULTS`。

### Modes and external effects

Unit、Contract、Fixture、Mock Harness、Embedded PGlite和local HTTP/SSE均通过；另有一次真实模型、Google Places与Tabelog/Browser read-only运行。该运行没有Authorization、预约提交、付款、取消、个人信息提交或其他外部写操作；`sideEffects`为0。H001仍未完成，其下一项阻塞是可证明的Google→Tabelog门店身份匹配，而非DeepSeek模型调用。

## 2026-09-03 — H001 read-only completion hardening verification

### Scope

`restaurant-state@10` search-only completion, Google hard deadline, Tabelog slot-level availability and identity grounding, HARD evidence gates, and the opt-in H001 Hybrid runner. No booking action is in scope.

### Checks

- Targeted Domain/Google/Tabelog checks: passed `12/12`, including non-cooperative fetch and non-resolving response-body deadlines, prose-time rejection, HIGH-only branch resolution/conflicting-phone rejection, and `PRESENT_RESULTS` reducer/outcome behavior.
- `npm run typecheck`: passed.
- `npm run arch:check`: passed with 0 forbidden source dependencies.
- `npm test`: passed `125/125`, 0 failed, using the permitted localhost-only fixture listener. This includes PGlite persistence, Router/Harness, Browser fixture and HTTP/SSE suites.
- `npm run build`: passed.
- `git diff --check`: passed.
- `npm run eval:restaurant:agent-loop:hybrid-live-read -- --case h001`: deliberately fail-closed before any model or provider request because `PRAXIS_ALLOW_LIVE_RESTAURANT_READ` is not `1`.

### Modes and external effects

Unit, Contract, Fixture, Mock Harness, Embedded PGlite and local HTTP/SSE checks passed. The attempted Live Read-only H001 did not start a provider/browser/model request. Current configuration has no active live-read/browser gates and no Google Places or Cloudflare credentials, so a real H001 evidence artifact and `PRESENT_RESULTS` trajectory cannot yet be claimed. No external write occurred.

## 2026-08-20 — Live / Hybrid Restaurant read path verification

### Scope

`restaurant-state@9` read evidence and availability status, Google Places Text Search adapter, Cloudflare Browser Run Runtime, bounded Tabelog read-only executor, Grounding, temporal case materialization, opt-in probe/Hybrid runners and trajectory metadata. No external side effect is in scope.

### Checks

- `npm run typecheck`: passed.
- `npm run arch:check`: passed with 0 forbidden source dependencies.
- `npm test`: passed `121/121`, 0 failed, in a permitted local-listener environment. This includes Google request/FieldMask/location-bias/search-budget/provider-failure/timeout Contract tests, Browser Runtime fallback/abort tests, Tabelog entity/grounding/no-submit/session-budget tests, materializer tests, Router/Harness safety tests, local HTTP/SSE and embedded PGlite migration persistence.
- `npm run test:probes`: passed `8/8`; this is the separate frozen Goal/Scheduler probe suite, not Browser compatibility evidence.
- `npm run build`: passed.
- `git diff --check`: passed.

### Modes and external effects

Only Unit, Contract, Fixture, Mock Harness, local HTTP/SSE and embedded PGlite verification ran. The environment inspection found `PRAXIS_ALLOW_LIVE_RESTAURANT_READ=0`, `PRAXIS_ALLOW_BROWSER_RUN=0`, no Google key, no Cloudflare account/token and no Tabelog probe URLs; therefore no Browser probe, Google Discovery smoke or Hybrid h001 run was attempted. `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1` alone is insufficient and did not make a model request. No real PostgreSQL smoke, model call, Provider call, Browser session, Authorization, booking, payment, cancellation or PII submission occurred. Embedded PGlite does not replace real PostgreSQL verification.

## 2026-08-20 — ADR-0013 Agent Loop final hardening verification

### Scope

Post-authorization Agent resume after `COMMIT_FAILED` / `BOOKING_ABSENT`, fresh proposal and Authorization enforcement, long-lived execution-route naming, sanitized Decision Context trajectory persistence, immutable `0008` migration and Hybrid E2E gate documentation. Semantic conflict gating intentionally remains unchanged. No real platform or external write is in scope.

### Checks

- `npm run typecheck`: passed.
- `npm run arch:check`: passed with 0 forbidden source dependencies.
- `npm test`: passed `100/100`, 0 failed, in a permitted local-listener environment. This includes 17 Restaurant Mock Agent Loop Harness scenarios, 3 Provider Router parameter/deadline scenarios, 15 embedded-PGlite Runtime/Recovery/Migration scenarios and Fixture Web/API/SSE.
- `npm run test:probes`: passed `8/8`; frozen Goal/Scheduler probes remain separate from the current product gate.
- `npm run build`: passed.
- `git diff --check`: passed.
- New Harness coverage proves `COMMIT_FAILED` and `BOOKING_ABSENT` both return through the mandatory chain to an Agent recovery decision, create a different proposal, require a new Authorization and reject an old `proposalId` before Policy/Commit. PostgreSQL coverage proves migration `0008` persists exactly the sanitized `restaurant-agent-context@1`, its schema version and `STRUCTURED_ADAPTER` route. Trajectory assertions exclude Authorization, proposal terms, execution result, evidence and reservation data from the decision context.

### Modes and external effects

Only Unit, Contract, Fixture, Mock Harness, local HTTP/SSE and embedded-PGlite verification ran. The first sandboxed `npm test` run passed 93 non-listener tests and could not bind the seven HTTP/SSE fixtures to `127.0.0.1` (`EPERM`); the permitted-local-listener rerun passed the complete `100/100`. No real PostgreSQL smoke, model call, Replay, Live Read-only, Controlled Live-write, real Provider, Browser Agent, Human Takeover, Authorization, booking, payment or cancellation occurred. Embedded PGlite does not replace real PostgreSQL verification.

## 2026-08-20 — ADR-0012 migration integrity and Agent Loop hardening verification

### Scope

Immutable migration recovery, explicit local-only `restaurant-state@7` reset policy, minimal Agent Context projection, bounded Provider reads, BOOK-to-Outcome proposal join and Discovery-only `hasEnough` semantics. No real database reset, external provider or browser automation is in scope.

### Checks

- `npm run typecheck`: passed.
- `npm run arch:check`: passed with 0 forbidden source dependencies.
- `npm test`: passed `98/98`, 0 failed, in a permitted local-listener environment. This includes 16 Restaurant Mock Agent Loop Harness scenarios, 3 Provider Router parameter/deadline scenarios, 14 embedded-PGlite Runtime/Recovery/Migration scenarios and Fixture Web/API/SSE.
- `npm run test:probes`: passed `8/8`; frozen Goal/Scheduler probes remain separate from the current product gate. The new migration tests are current-product tests and therefore do not alter that frozen baseline.
- `npm run build`: passed.
- `git diff --check`: passed.
- PGlite migration coverage proves both the original `0006` `evidence_refs` form upgrades through `0007` and the short-lived already-causal local development form remains readable before `proposal_id` is added. Agent-context coverage proves authorization, proposal, execution, evidence and reservation data do not reach the decision input. Router coverage proves authority-bound availability arguments, cooperative abort and an abort-ignoring Provider deadline.

### Modes and external effects

Only Unit, Contract, Fixture, Mock Harness, local HTTP/SSE and embedded-PGlite verification ran. No reset command was run and no durable development data was deleted. Real PostgreSQL smoke was not run because no explicit writable test-database authorization or configuration was provided; embedded-PGlite does not replace it. No real model call, Replay, Live Read-only, Controlled Live-write, real Provider, Browser Agent, Human Takeover, Authorization, booking, payment or cancellation occurred.

## 2026-08-20 — ADR-0011 Restaurant Agent Loop control refinement verification

### Scope

Restaurant Agent Action Contract、权威Search/Availability参数绑定、Provider/Router/模型失败归因、Loop终止、`SELECTION_REQUIRED` lifecycle、trajectory causal refs、Mock Adapter故障注入、PGlite持久化恢复和对应文档。没有真实平台或浏览器自动化。

### Checks

- `npm run typecheck`: passed.
- `npm run arch:check`: passed with 0 forbidden source dependencies.
- `npm test`: passed `92/92`, 0 failed, in a permitted local-listener environment. This includes 16 Restaurant Mock Agent Loop Harness scenarios, 12 embedded-PGlite Runtime/Recovery scenarios and Fixture Web/API/SSE.
- `npm run test:probes`: passed `8/8`; frozen Goal/Scheduler probes remain separate from the current product gate.
- `npm run build`: passed.
- `git diff --check`: passed.
- New Harness assertions cover Router binding of authoritative read parameters, Provider failure as `SEARCH_FAILED` rather than model failure, `SELECTION_REQUIRED → RUNNING` with no pending user question, and durable timeout / step-limit / rejection-limit state plus trajectory outcomes and causal refs.

### Modes and external effects

Only Unit, Contract, Fixture, Mock Harness, local HTTP/SSE and embedded-PGlite verification ran. No real model call, Clean Holdout, Replay, Live Read-only, Controlled Live-write, real PostgreSQL smoke, Authorization, booking, payment or cancellation occurred. Real PostgreSQL smoke was not run because no explicit writable test-database authorization or configuration was provided; embedded-PGlite does not replace it.

## 2026-08-20 — Repository naming normalization verification

### Scope

Naming/version governance, evidence lifecycle classification, local branch identity, source and Eval path moves, npm Eval entry points, Brainstorming/Superseded archive indexes and Markdown references. No product behavior, Eval content or external integration was intentionally changed.

### Checks

- `npm run typecheck`: passed.
- `npm run arch:check`: passed with 0 forbidden source dependencies.
- `npm run build`: passed.
- `npm run test:probes`: frozen Goal/Scheduler probes passed `8/8`, 0 failed; they remain separate from the current product gate.
- `npm test`: the sandboxed run passed 82 tests and the 7 local HTTP/SSE cases could not bind `127.0.0.1` (`EPERM`); the same command rerun with local-listen permission passed `89/89`, 0 failed.
- `npm run eval:restaurant:semantic:fixture`: passed `15/15`, reported only `DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`.
- `npm run eval:restaurant:search:fixture`: passed `3/3` Fixture cases.
- `npm run eval:restaurant:semantic:holdout:preflight`: Draft Preflight passed with 15 sessions / 25 turns / 0 issues; it did not run a model or restore Clean eligibility.
- Eval JSON/YAML parsing, Markdown local-link validation across 56 files, `git diff --check`, filename/extension scans and stale-name searches passed.
- Strict TypeScript unused-symbol check (`--noUnusedLocals --noUnusedParameters`) passed after removing three unused type imports; no zero-value historical evidence was treated as executable code.

### Modes and external effects

Only static checks, Unit/Contract tests, Fixture/Mock Harness, local HTTP/SSE, embedded PGlite and Draft Preflight ran. No real model call, Complete/Baseline Holdout run, Replay, Live Read-only, Controlled Live-write, real PostgreSQL deployment, Authorization, booking, payment or cancellation occurred.

## 2026-08-19 — Restaurant v18 Agent Loop verification

### Scope

Single-Agent Restaurant action loop, candidate/offer separation, deterministic action validation, trajectory persistence, Fixture Workspace integration, and existing Mock Booking safety controls. Browser automation, Live Providers and E2E scoring are out of scope.

### Checks

- `npm run typecheck`: passed.
- `npm run arch:check`: passed with 0 forbidden source dependencies.
- `npm run build`: passed.
- `npm run test:probes`: `8/8` passed; frozen probes are reported separately from the product baseline.
- `npm test`: `89/89` passed, 0 failed, including 13 Restaurant Mock Harness scenarios, 12 embedded-PGlite Runtime/Recovery scenarios, Fixture Web/API/SSE, semantic boundary tests and Fixture Search.
- `git diff --check`: passed after all code and documentation updates.

### Modes and external effects

Only Unit, Contract, Fixture, Mock Harness, local HTTP/SSE and embedded-PGlite verification ran. No real model call, Clean Holdout, Replay, Live Read-only, Controlled Live-write, real Authorization, booking, payment or cancellation occurred. Embedded PGlite is not evidence of a real PostgreSQL deployment.

## 2026-08-18 — Prompt v7 canonical-Gold exposed regression verification

### Scope

一次受用户授权的Prompt v7真实诊断，使用已暴露的current canonical Gold；不改Gold、Contract、Schema、Scorer或Decision Kernel。它不是Clean Holdout，仅报告与Prompt v6的`COMMON_UNCHANGED_TURNS`比较。

### Checks

- 当前Dataset SHA与v6 artifact均为`9f067e2826e248971c206d379107505e72e3cdff42574eb9730219e71fa6976c`；v6为`COMPLETED` / Prompt `v6`，并含24个可比快照。若SHA不同，Runner会在模型调用前拒绝。
- `npm run typecheck`、`npm run eval:semantic:holdout:preflight:complete`（`READY_FOR_BASELINE`，15 session / 25 turn / 0 issue）、`npm run eval:semantic:fixture`（15/15）、`npm run arch:check`与`npm run build`：通过。
- `npm test`：86/86通过，0 failed；HTTP/SSE使用允许本地监听的环境验证。
- `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_CONFIRM_EXPOSED_HOLDOUT_REGRESSION=1 PRAXIS_CONFIRM_CURRENT_EXPOSED_GOLD_VERSION=1 PRAXIS_PREVIOUS_EXPOSED_REGRESSION_ARTIFACT=<v6-artifact> PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=25 DEEPSEEK_MODEL=deepseek-v4-flash npm run eval:semantic:holdout:exposed-regression`：16 successful calls、0 retry、32,892 ms、56,436 reported tokens、cost `NOT_CONFIGURED`。全25 turn为4 pass、12个`SEMANTIC_RESULT`、9个`BLOCKED_BY_UPSTREAM`；归类为`EXPOSED_GOLD_ACCEPTANCE_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。
- `COMMON_UNCHANGED_TURNS`为24个；H007缺少v6可比快照而排除。v6 → v7字段mismatch为criteria text `6 → 8`、polarity `0 → 0`、strength `2 → 2`、date `4 → 4`、timeWindow `1 → 2`、partySize `5 → 2`、area `7 → 8`、decision `7 → 6`。这只是已暴露数据的受限诊断，不是泛化、Baseline或Parser close的质量结论。

### Modes and external effects

Unit、Fixture、Mock Harness和embedded PGlite验证均通过；另有16次付费DeepSeek调用，仅针对已暴露canonical Gold，使用内存Runtime和Fixture Search。没有新的Clean Holdout、真实Discovery、Availability、Authorization、预约、Replay、Live Read-only或Controlled Live-write。

## 2026-08-18 — Prompt v6 canonical-Gold acceptance diagnostic verification

### Scope

一次受用户授权的Prompt v6真实诊断，使用明确保留为canonical的已暴露私有Gold。它不是Clean Holdout，也不与v4 Clean Baseline或v5 Regression作整集比较；仅报告`COMMON_UNCHANGED_TURNS`。

### Checks

- `npm run typecheck`：通过。
- Exposed Regression focused tests：`4/4`通过；Prompt Contract tests：`2/2`通过。
- `npm run eval:semantic:holdout:preflight:complete`：`READY_FOR_BASELINE`，15 session / 25 turn / 0 issue；这是结构门禁，不恢复任何Clean资格。
- `npm run eval:semantic:fixture`：`15/15`通过，`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。
- `npm run arch:check`、`npm run build`和`git diff --check`：通过。
- `npm test`：`86/86`通过，0 failed；HTTP/SSE使用允许本地监听的环境验证。
- `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_CONFIRM_EXPOSED_HOLDOUT_REGRESSION=1 PRAXIS_CONFIRM_CURRENT_EXPOSED_GOLD_VERSION=1 PRAXIS_PREVIOUS_EXPOSED_REGRESSION_ARTIFACT=<v5-artifact> PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=25 DEEPSEEK_MODEL=deepseek-v4-flash npm run eval:semantic:holdout:exposed-regression`：完成，16 successful calls、0 retry、35,296 ms、56,986 reported tokens、cost `NOT_CONFIGURED`。全25 turn为4 pass、12个`SEMANTIC_RESULT`、9个`BLOCKED_BY_UPSTREAM`；归类固定为`EXPOSED_GOLD_ACCEPTANCE_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。
- `COMMON_UNCHANGED_TURNS`共有24 turn；1个annotation-changed turn排除。两次均实际评估15个公共turn，exact pass均为3。v5 → v6的mismatch为criteria text `8 → 6`、polarity `0 → 0`、strength `2 → 2`、date `4 → 4`、timeWindow `2 → 1`、partySize `3 → 5`、area `4 → 7`、decision `6 → 7`。这只是已暴露数据的受限诊断，不是泛化或Baseline结论。

### Modes and external effects

Unit、Fixture、Mock Harness和embedded PGlite验证均通过；另有16次付费DeepSeek调用，仅针对当前已暴露canonical Gold，使用内存Runtime和Fixture Search。没有新的Clean Holdout、真实Discovery、Availability、Authorization、预约、Replay、Live Read-only或Controlled Live-write。

## 2026-08-18 — Prompt v5 exposed-Holdout regression verification

### Scope

一次受用户授权的Prompt v5真实回归，仅使用已经`EXPOSED / RESULT_EXPOSED`的私有v4 Holdout。原始Clean Baseline artifact、Gold、Prompt文本、Contract、Scorer与readiness policy不在修改范围。

### Checks

- `npm run eval:semantic:holdout:preflight:complete`：`READY_FOR_BASELINE`，15 session / 25 turn / 0 issue；这只是结构与Gold一致性检查，不使数据恢复Clean资格。
- `npm run typecheck`：通过。
- `npm run eval:semantic:fixture`：15 / 15通过，`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。
- `npm run arch:check`：通过，0 forbidden source dependencies。
- `npm test`：85 / 85通过，0 failed；HTTP/SSE用允许本地监听的环境验证。
- `npm run build`与`git diff --check`：通过。
- `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_CONFIRM_EXPOSED_HOLDOUT_REGRESSION=1 PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=25 DEEPSEEK_MODEL=deepseek-v4-flash npm run eval:semantic:holdout:exposed-regression`：完成，16 successful calls、0 retry、37,102 ms、56,122 reported tokens、cost `NOT_CONFIGURED`。全25 turn为3 pass、13个`SEMANTIC_RESULT`、9个`BLOCKED_BY_UPSTREAM`；归类固定为`EXPOSED_HOLDOUT_REGRESSION / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。
- 初版字段诊断重复计数criteria文本不匹配为polarity/strength不匹配。修复分析器后，新增该边界的单测；`npm run eval:semantic:holdout:exposed-regression:analyze <artifact>`在不调用模型的情况下写入`field-analysis-v2` sidecar，保留原始运行记录。v4同口径15 turn的字段差异为criteria text `-1`、strength `-5`、timeWindow `-1`、area `-1`，date `+3`、partySize `+1`、decision `+1`（负号表示v5减少mismatch）。

### Modes and external effects

Unit、Fixture、Mock Harness和embedded PGlite验证均通过；另有16次付费DeepSeek调用，仅针对已暴露私有Holdout，使用内存Runtime和Fixture Search。没有真实Discovery、Availability、Authorization、预约、Replay、Live Read-only或Controlled Live-write。

## 2026-08-17 — v16 open Restaurant Criterion Contract verification

### Scope

Restaurant semantic Contract migration from classified cuisine / hard-constraint / soft-preference arrays to open criteria, plus the dependent Compiler, Reducer, Fixture Regression, Holdout preflight, deterministic scorer and documents. No real model or private Holdout content is in scope.

### Checks

- `npm run typecheck`: passed.
- Focused Restaurant Domain, v16 Eval, Harness, PGlite Runtime and Fixture Search tests: `54/54` passed, 0 skipped and 0 failed.
- `npm run eval:semantic:fixture`: `7/7` exposed v16 Regression Turns passed with `DEVELOPMENT_STAGE_ORACLES`, Regression Dataset `2` and Evaluator `2`; `baselineEligible:false`.
- `npm run eval:search:fixture`: `3/3` passed.
- `npm run arch:check`: passed with 0 forbidden source dependencies.
- `npm run build`: passed.
- `npm test`: `78/78` passed, 0 skipped and 0 failed in a permitted local-listener environment, including HTTP/SSE.
- `npm run test:probes`: `8/8` passed.
- `git diff --check`: passed after all code and documentation updates.

### Modes and external effects

Only Unit, Contract, Fixture, Mock Harness and embedded PGlite verification ran. No DeepSeek or other real model, Clean Holdout, Replay, Live Read-only, Controlled Live-write, Discovery, Availability, authorization or reservation ran. User-owned untracked annotation files were not read or modified.

## 2026-08-17 — v15 strict transport and semantic-equivalence hardening verification

### Scope

Provider-compatible strict Schema constraints, Eval collection/fact semantic equality, deterministic singleton clear-and-set conflict handling, and Clean Holdout boundary wording. No Prompt, Proposal field, Holdout Gold, real Provider or external platform behavior is in scope.

### Checks

- `npm run typecheck`: passed.
- Focused Proposal / Compiler / DeepSeek Gateway / Scorer / Regression / Holdout tests: 27/27 passed.
- `npm run eval:semantic:fixture`: 7/7 exposed Regression Turns passed with `DEVELOPMENT_STAGE_ORACLES` and `baselineEligible:false`.
- `npm run arch:check`: passed with 0 forbidden source dependencies.
- `npm test`: 78/78 passed, 0 skipped and 0 failed in a permitted local-listener environment.
- `npm run test:probes`: 8/8 frozen probes passed.
- `npm run eval:search:fixture`: 3/3 passed.
- `npm run build`: passed.
- `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=7 npm run eval:semantic:deepseek`: passed with the repaired strict Schema: 7/7 exposed Turns, 7 successful calls, 0 retry, 0 failed, 15,493 ms and 18,955 reported tokens. Classification remains `DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`.

### Modes and external effects

Unit, Contract, Fixture, Mock Harness and embedded PGlite verification ran, plus one paid real DeepSeek request sequence against the 7 already-exposed Regression Turns. No Clean Holdout baseline, Replay, Live Read-only, Controlled Live-write, Discovery, Availability, authorization or reservation ran. The private Holdout was not read or modified.

## 2026-08-17 — v15 architecture cleanup and hardening verification

### Scope

Provider structured-output transport, Eval first-failure attribution, derived readiness removal, semantic operation semantics, Restaurant application dependency injection, lightweight architecture checking, and repository/document cleanup. No new Semantic Proposal field, Decision Kernel responsibility, Holdout case behavior or external side effect is in scope.

### Checks

- `npm run arch:check`: passed with 0 forbidden source dependencies.
- `npm run typecheck`: passed.
- Focused Domain/DeepSeek/Eval/Search tests: 32/32 passed before the full baseline.
- `npm test`: 74/74 passed, 0 skipped and 0 failed in a permitted local-listener environment.
- `npm run test:probes`: 8/8 frozen probes passed.
- `npm run eval:semantic:fixture`: 7/7 exposed Turns passed with `DEVELOPMENT_STAGE_ORACLES` and `baselineEligible:false`.
- `npm run eval:search:fixture`: 3/3 passed.
- `npm run build`: passed.
- Final reference scan, ignored Holdout confirmation and `git diff --check`: passed.

### Modes and external effects

Only Unit, Contract, Fixture, Mock Harness and embedded PGlite verification ran. No real DeepSeek request, Clean Holdout baseline, Replay, Live Read-only, Controlled Live-write, Discovery, Availability, authorization or reservation ran. The private Holdout was not modified or semantically inspected.

## 2026-08-16 — Obsolete Eval and probe cleanup verification

### Scope

Removal of the executable v14 Decision Harness and legacy Intent Parser/eval, plus separation of frozen Goal/Scheduler/Synthetic architecture probes from the current default product suite. The v15 product semantic boundary and Holdout content are out of scope.

### Checks

- `npm run typecheck`: passed after the deleted imports and entrypoints were removed.
- `npm test`: `65/65` current product tests passed with 0 skipped and 0 failures in a permitted local-listener environment.
- `npm run test:probes`: `8/8` frozen architecture probes passed with 0 skipped and 0 failures.
- `npm run build`: passed.
- `npm run eval:semantic:fixture`: 7/7 exposed Regression Turns passed; classification remains `DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`.
- `npm run eval:semantic:holdout:preflight`: returned `READY_FOR_ANNOTATION`, 0 Sessions / 0 Turns / 0 issues; no model call was made.
- `npm run eval:search:fixture`: 3/3 cases passed.
- Deleted-path/reference scan, ignored-private-file confirmation and final `git diff --check`: passed.

### Modes and external effects

Only Unit, Contract, Fixture, Mock Harness and embedded PGlite verification ran. No DeepSeek or other real model, Replay, Live Read-only, Controlled Live-write, real Discovery, Availability, reservation, authorization or external network request ran. The private Holdout content was not inspected or changed.

## 2026-08-14 — v15 Clean Holdout harness preparation verification

### Scope

Eval-only Holdout infrastructure: private empty data file, committed empty template, frozen manifest, runtime Preflight, deterministic Draft/Decision scorer, exposed-Regression Fixture pipeline and guarded one-time real-model runner. No Holdout content, product Contract field, Prompt content, Domain State or Provider Adapter changed.

### Checks

- `npm run typecheck`: passed.
- `npm run build`: passed.
- v15 targeted tests: `5/5` passed. Four Holdout tests prove the empty-template boundary, complete valid Dataset acceptance, manifest/duplicate/Gold rejection and Draft-before-Decision first-failure attribution; the existing runner test now drives all 7 exposed Regression Turns through Proposal, Compiler, Runtime/Reducer and Kernel.
- `npm run eval:semantic:fixture`: 7/7 exposed Regression Turns passed with `DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`.
- `npm run eval:semantic:holdout:preflight`: returned `READY_FOR_ANNOTATION`, 0 Sessions / 0 Turns / 0 structural issues for the private empty scaffold.
- Strict Preflight and the real Holdout entry both rejected the empty scaffold with `EMPTY_HOLDOUT` before model configuration, artifact locking or network access. This is the expected pre-annotation state, not a failed Baseline.
- Full `npm test`: `151/151` passed with 0 failures in a permitted local-listener environment, including HTTP/SSE and embedded-PGlite scenarios.
- Final `git diff --check`, ignored-private-file confirmation and product Prompt/Contract diff review are required after this log update.

### Modes and external effects

Only Unit, Fixture, Mock Harness and embedded PGlite verification ran. No DeepSeek or other real model, Replay, Live Read-only, Controlled Live-write, real Discovery, Availability, reservation, authorization or external network request ran. The private Holdout remains empty and no one-time baseline artifact exists.

## 2026-08-14 — Stage 2C freeze verification

### Scope

Documentation and Eval lifecycle governance only: freeze the v15 responsibility boundary, Prompt `v2` and Proposal Schema `1`; retire v14 as `FROZEN / HARNESS_ONLY / REGRESSION`; and make a future independent v15 `CLEAN_HOLDOUT` the next baseline gate. No product TypeScript, Contract field, Prompt content, dataset, evaluator or Provider configuration changed in this freeze.

### Checks

- Production dependency review: no reference to `decision-v14` or its former `restaurant-decision-eval` path exists outside Eval documentation/entrypoints; product application, core, Domain, infrastructure, server and Harness directories do not import Eval modules.
- Documentation contradiction scan: no remaining active claim says v14 has not run a real model, requires a new v14 Holdout, or remains the current Progressive Decision baseline.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm run eval:decision:preflight:complete`: `READY_FOR_EVALUATOR`, 7 Episodes / 17 labeled Turns / 0 pending.
- `npm run eval:decision:fixture` and `npm run eval:decision:model:fixture`: passed as local frozen-history replay; the model Fixture used 17 calls, 0 schema retries and reported no P0.
- v15 targeted Regression test: `1/1` passed. It proves the current exposed Regression runner executes Proposal, Compiler, Runtime/Reducer and Kernel in order; it is not a Clean Holdout baseline.
- `npm run eval:search:fixture`: 3/3 cases passed.
- Full `npm test`: the restricted sandbox first produced 140/147 because seven HTTP/SSE tests could not bind `127.0.0.1` (`listen EPERM`); the identical command in a permitted local-listener environment passed `147/147` with 0 failures.
- `git diff --check`: passed before the verification record was added and is required again at final review.

### Modes and external effects

Only Unit, Fixture, Mock Harness and embedded PGlite verification ran. No DeepSeek or other real model, Replay, Live Read-only, Controlled Live-write, real Discovery, Availability, reservation, authorization or external network request ran.

## 2026-08-14 — Eval directory organization verification

### Scope

Repository organization only. The flat `src/eval/` files are grouped as `decision-v14/`, `semantic-v15/`, `intent-legacy/`, `search-fixture/`, and `shared/`; imports and public npm command paths now point to those locations. Dataset content, prompts, evaluator behavior, model configuration, and product runtime behavior were not changed.

### Checks

- `npm run typecheck`: passed after all moved-module imports were updated.
- Eval-only test selection: `78/78` passed. This was a compatibility check for moved TypeScript modules, not a new regression result or model-quality claim.
- `npm run build`: passed.
- `git diff --check`: passed. Markdown links and active source-path references were reviewed.
- Full `npm test` was not re-run after the user clarified this was an organization-only change. Its prior verified baseline remains `147/147`; an initial sandbox attempt was blocked only because the HTTP/SSE tests cannot bind `127.0.0.1` there.

### Modes and external effects

No real model, Replay, Live Read-only, Controlled Live-write, Discovery, Availability, reservation, authorization, or external network request ran. The compatibility test used only existing local fixtures.

## 2026-08-13 — Documentation navigation and history consolidation verification

### Scope

Documentation information-architecture change only: added a current-state entry point, moved the two append-only logs into `docs/history/`, and updated navigation and references. No executable product behavior, test fixture, model request, Provider, Adapter or external side effect changed.

### Checks

- Markdown path review and `git diff --check` are required for this change.
- The current baseline remains `147/147` from the v15 product slice verification; it was not re-run because this change has no executable code.

### Modes and external effects

No Unit, Fixture, Mock Harness, Replay, Real Model, Live Read-only or Controlled Live-write run. Moving versioned Markdown files only changes repository paths; all historical entries are retained.

## 2026-08-13 — Version branch delivery convention verification

### Scope

Git 与文档治理变更：为 v15 从已验证提交建立独立版本分支，并将版本分支选择与交付检查写入`AGENTS.md`和Post-change Verify。没有运行时、状态、模型、Provider、Adapter或产品行为改动。

### Checks

- 创建前工作区干净，当前 v15 实现 HEAD 为`714adcb`。
- 已从该提交创建`codex/restaurant-decision-v15`；`codex/restaurant-decision-v14`保留，未被重写。
- `git diff --check`：通过。未运行TypeScript、Fixture、Replay或真实模型测试，因为没有可执行产品改动。

### Modes and external effects

没有Unit、Fixture、Mock Harness、Replay、Real Model、Live Read-only或Controlled Live-write。Git分支创建只改变本地仓库引用；远端 push 单独报告，且必须取得用户明确授权。

## 2026-08-13 — v15 DeepSeek Semantic Proposal regression verification

### Scope

新增独立于Harness-only v14 `statePatch` Eval的v15真实模型回归。DeepSeek只产生Semantic Proposal；Proposal Contract、Compiler、In-memory Runtime/Reducer、Decision Kernel和Fixture Search依次执行。Dataset为7个静态、已暴露的Regression Turn；没有产品持久化State、真实Discovery、Availability、Authorization或外部写操作。

### Checks

- `npm run typecheck`、`npm run build`与v15 Runner Fixture Test：通过。
- `npm test`：`147/147`通过，包括新增v15 Runner Fixture Test及完整Runtime、Harness、PGlite、HTTP/SSE基线。
- 初次预调试：发现Prompt未明确每个`value.kind`的完整封闭JSON形状，DeepSeek出现AREA、PARTY_SIZE和BUDGET_PER_PERSON Contract失败；该轮不纳入矩阵。
- 补齐Prompt形状后，受控真实DeepSeek运行10次：每次7/7通过，合计`70/70`通过；0个`SEMANTIC_PROPOSAL_CONTRACT`、`COMPILER`、`SEMANTIC_RESULT`、`DECISION_KERNEL`或`RUNTIME`首错；0次结构重试、0次Provider失败或P0。
- 模型：`DEEPSEEK:deepseek-v4-flash`；累计输入39,290 Token、输出6,990 Token、总模型延迟125,360ms（均值12,536ms/运行）；价格环境未配置，成本状态为`NOT_CONFIGURED`。
- Prompt内容在正式十次前已修正，但请求遥测仍标`v1`；随后代码将其正确升为`v2`。因此十次结果证明该最终内容的行为，不构成按`v2`标识可复现的Baseline。

### Modes and external effects

`REAL_MODEL_MOCK_WORLD`与Fixture Search运行，结果单独报告。没有Replay、Live Read-only或Controlled Live-write。每次运行将静态Proposal诊断写入Git忽略的`.eval-artifacts/restaurant-semantic/`；无生产用户文本、Prompt正文或Key被持久化。

## 2026-08-13 — v15 Restaurant semantic/search product slice verification

### Scope

Fixture-only implementation of `Semantic Interpreter → Proposal Contract → Compiler → Reducer → Decision Kernel → Runtime Command → Fixture Search`. It changes Restaurant state/event/command schema to `4`, migrates the product Fixture applications and Harness, and leaves real DeepSeek, external Tool/Adapter execution and automatic re-interpretation disabled.

### Checks

- `npm run typecheck`: passed.
- Semantic Contract / Interpreter / Compiler / Reducer / Kernel unit tests: passed. They separately prove closed schema rejection, no internal state/tool protocol, deterministic correction/negation compilation, authoritative missing-field derivation and `NEED_REINTERPRETATION` safe reserve behavior.
- Fixture product / Mock Harness / PGlite Runtime regression: `48/48` passed, including local full-input, clarification and selection flow, booking safety invariants, Restaurant Event replay and durable-command recovery.
- `npm test`: `146/146` passed after running the HTTP/SSE cases in a permitted local-listener environment. The multi-session version assertion was migrated from `2` to `4`, reflecting the newly durable Proposal, Decision, Search observation and candidate-presentation Decision events.
- `npm run build`: passed.
- `git diff --check`: passed.

### Modes and external effects

Unit, Fixture product, Mock Harness and PGlite persistence were run and reported separately. Replay, Real Model, Live Read-only and Controlled Live-write were not run. No DeepSeek, Discovery, Availability, reservation, authorization or external write request was made.

## 2026-08-13 — v15 semantic-to-execution architecture governance verification

### Scope

Documentation-only architecture governance change. ADR-0007 fixes the Restaurant v15 target chain: Semantic Interpreter, Semantic Proposal Contract, Restaurant Semantic Compiler, Runtime/Reducer, Decision Kernel, execution control and Verifier. No TypeScript, Runtime, Parser, Web, Harness behavior, Provider configuration or external integration changed.

### Checks

- Documentation consistency review: ADR, Architecture Overview, Agent Orchestration, Restaurant Domain, Interfaces, Arch Guard, Planning, Eval, Harness and Post-change Verify all identify the Semantic Interpreter output as an untrusted Proposal rather than a State Patch/Event/Tool Call.
- Documentation consistency review: each source preserves the required Runtime/Policy/Authorization/Execution Router/Verifier control path and prohibits `LLM → Tool`, `LLM → State`, and `Verifier → LLM → Tool`.
- Documentation consistency review: `NEED_REINTERPRETATION` is a v15 reserved Decision Kernel result, records conflict and asks the user or safely degrades; no automatic state overwrite or model retry loop is authorized.
- `git diff --check`: passed after final documentation review.

### Modes and external effects

No Unit, Fixture, Replay, Real Model Mock World, Live Read-only or Controlled Live-write run because this change has no executable code. No DeepSeek, database, Discovery, Availability, reservation or other external request was made.

## 2026-08-13 — Prompt v14 / typed Patch Contract verification

### Scope

Harness-only Restaurant Progressive Decision Eval：typed Preference/Hard Constraint、JSON Schema、共享Validator、Reducer语义集合、Golden v0.10 / Schema 3与Prompt v14。未改产品Restaurant State、Task Runtime、Web、Provider Adapter或外部执行路径。

### Checks

- `npm run typecheck`：通过。
- Contract、Model Contract、Preflight、Mutation、Reducer/Scorer、Decision Kernel与Runner定向测试：65/65通过。
- `npm run eval:decision:preflight:complete`：`READY_FOR_EVALUATOR`，7个Episode / 17个Labeled Turn / 29个Candidate / 417个Fact，dataset v0.10。
- `npm run eval:decision:model:fixture`：Runner v4 / Prompt v14 / Proposal Schema 4，17次Fixture调用、0次Schema retry；S1–S4与S8均17/17通过，S5 5个适用Turn通过，S6 11个适用Turn通过，S7 10个适用Turn通过，P0为空。
- `npm test`：受限沙箱首次运行时131个非HTTP用例通过，7个Local Web/SSE场景仅因`listen EPERM 127.0.0.1`失败；允许本机监听后原命令重跑为138/138通过、0失败。
- `npm run build`：通过。
- `git diff --check`：通过。

### Modes and external effects

只运行Unit/Contract、Preflight和Golden Fixture Model；没有调用DeepSeek、真实Discovery、Availability、地图或预约平台，没有数据库或其他外部写入。当前Golden和Prompt相关结果已暴露，不能作为Baseline或Holdout。

## 2026-08-12 — Prompt v13 State Patch Contract verification

只修改Harness-only Prompt及其Contract断言；Schema、Kernel、Gold、Reducer、Scorer和canonicalization未变。`node --import tsx --test src/eval/restaurant-decision-eval-model-contract.test.ts`为8/8通过，`npm run typecheck`与`git diff --check`通过。静态Prompt测试明确拒绝当前四条Regression原句和既有Fixture实体。未运行DeepSeek、完整Golden Regression、真实Discovery、Availability或任何外部写入。

## 2026-08-12 — Eval-only Decision Kernel probe / Prompt v12 verification

### Scope

只修改Progressive Decision Eval的Harness：Proposal Schema 3只接受语义`statePatch`和可选Candidate排序，Eval-only Decision Kernel从累计State、可信Fixture/Search结果和Candidate Fact生成Readiness、下一步动作、候选展示上限与Grounding。没有改Restaurant产品Domain、Task Runtime、Web、真实Discovery、地图、Availability、预约或外部写入。

### Checks

- `npm run typecheck`：通过。
- `node --import tsx --test src/eval/restaurant-decision-eval-decision-kernel.test.ts src/eval/restaurant-decision-eval-model-contract.test.ts src/eval/restaurant-decision-eval-runner.test.ts`：15/15通过；覆盖命名目标/严格零结果路由、有限候选Grounding、Schema拒绝旧Policy字段及Runner不向模型发送`retrievalSummary`。
- `npm run eval:decision:preflight:complete`：通过，7个Episode / 17个Labeled Turn，`READY_FOR_EVALUATOR`。
- `npm run eval:decision:fixture`与`npm run eval:decision:model:fixture`：通过；Fixture Runner v4 / Prompt v12 / Schema 3，17次Fixture调用、0次Schema retry，S1–S8全部通过。
- `npm run build`与`git diff --check`：通过。
- 完整`npm test`：受限沙箱首跑中7个Local Web/SSE用例因`listen EPERM 127.0.0.1`失败，其余126个通过；以本机监听权限重跑后133/133通过，0 failed。该差异是沙箱网络权限，不是本次代码断言失败。

### Modes and external effects

已运行Unit/Contract、Fixture Oracle与Fixture Episode Runner；没有发起DeepSeek调用，未访问真实站点、Discovery、Availability或预约平台。当前Golden与结果已暴露，后续任何真实模型重跑仍只能报告为`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。

## 2026-08-12 — Prompt v11 action routing verification

### Scope

只修改Progressive Decision Eval的Harness-only Prompt动作路由边界：`BRAND`、`RESTAURANT`、`OPEN/CATEGORY`和`CHECK_AVAILABILITY`的触发条件显式分开。Gold、Reducer、Scorer、输出Schema、真实Discovery、地图、Availability、预约平台和产品Runtime均未修改。

### Checks

- `npm run typecheck`：通过。
- `node --import tsx --test src/eval/restaurant-decision-eval-model-contract.test.ts`：8/8通过；Prompt Contract断言覆盖Routing Matrix、`BRAND`不得走`CHECK_TARGET_RESTAURANT`、`RESTAURANT`不得走`RESOLVE_BRAND_OUTLET`或`SHOW_RECOMMENDATIONS`，以及`APPROXIMATE/DAYPART`不等于Exact Availability。
- `npm run eval:decision:model:fixture`：Runner v3、Fixture Model、17次调用、0次Schema retry；Model Contract使用`promptVersion: v11`与输出Schema `2`，S1–S8全部通过。
- `npm run eval:decision:fixture`：Golden v0.9 Fixture Oracle 17个Turn的S1–S8全部通过，P0为0。
- `npm run build`：通过。
- `git diff --check`：通过。

### Real Model Mock World

- 首次`PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_DECISION_EVAL_SCOPE=FULL_REGRESSION PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=7 npm run eval:decision:deepseek:smoke`在sandbox内完成Preflight但7个Episode均为`MODEL_FAILURE / NETWORK`，`modelCalls: 0`，没有产生语义评分；诊断文件为`.eval-artifacts/restaurant-decision/2026-08-12T08-21-31-195Z-full_regression.md`。
- 用户随后明确批准调用DeepSeek并接受当前Regression评测数据发送给DeepSeek后，使用同一命令以外部网络权限重跑成功：7个Episode、17个Turn全部到达DeepSeek并完成评分，17次调用、0次Schema retry、0次Provider failure、P0为0，`totalLatencyMs: 35293`，Token为45,262 input / 2,125 output / 47,387 total，成本仍为`NOT_CONFIGURED`。
- 诊断文件：`.eval-artifacts/restaurant-decision/2026-08-12T08-37-35-090Z-full_regression.md`。
- 分类保持`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`，因为当前Golden Seed与结果已参与Prompt迭代。
- 12/17个Turn无首错；剩余5个首错为`S3_READINESS: 2`、`S1_STATE_EXTRACTION: 2`、`S7_SELECTION_DIVERSITY: 1`。`S4_ACTION_ROUTING`直接失败为0；v8中DGS02-T01、DGS03-T01和DGS03-T02的3个S4路由首错均不再作为首错出现。
- 代表性剩余问题：
  - DGS03-T02：状态正确、动作已为`CHECK_TARGET_RESTAURANT`，但readiness输出`NOT_READY`，Gold为`RECOMMENDATION_READY`。
  - DGS04-T03：`no smoking`仍被写成`negativePreferences: ["smoking"]`，Gold要求`hardConstraints: ["fully non-smoking"]`。
  - DGS06-T03：推荐2个候选，Gold要求3个候选，首错`RECOMMENDATION_CANDIDATE_COUNT`。
  - DGS06-T04：`nothing too formal`被写为`negativePreferences: ["too formal"]`，Gold要求`["formal"]`。
  - DGS07-T01：状态正确，但严格结果为空时readiness输出`NOT_READY`，Gold为`AVAILABILITY_READY`并要求`PROPOSE_CONSTRAINT_RELAXATION`。
- 用户同意后对相同v11 Prompt、Golden v0.9和`FULL_REGRESSION`范围继续重复运行，最终形成10次真实模型Mock World诊断；10次均保持`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`，不能作为质量Baseline或趋势证据。
- 追加9次诊断Artifact与调用数：
  - `.eval-artifacts/restaurant-decision/2026-08-12T08-54-41-045Z-full_regression.md`：18次调用、1次Schema retry。
  - `.eval-artifacts/restaurant-decision/2026-08-12T08-55-29-151Z-full_regression.md`：18次调用、1次Schema retry；DGS05-T04出现`INVALID_MODEL_OUTPUT`，原因是模型输出了不受Schema支持的顶层`explainsInsufficientCandidates`。
  - `.eval-artifacts/restaurant-decision/2026-08-12T08-56-06-749Z-full_regression.md`：17次调用、0次Schema retry。
  - `.eval-artifacts/restaurant-decision/2026-08-12T10-09-14-283Z-full_regression.md`：17次调用、0次Schema retry。
  - `.eval-artifacts/restaurant-decision/2026-08-12T10-10-03-944Z-full_regression.md`：19次调用、2次Schema retry。
  - `.eval-artifacts/restaurant-decision/2026-08-12T10-10-53-066Z-full_regression.md`：17次调用、0次Schema retry。
  - `.eval-artifacts/restaurant-decision/2026-08-12T10-11-30-967Z-full_regression.md`：17次调用、0次Schema retry。
  - `.eval-artifacts/restaurant-decision/2026-08-12T10-12-12-973Z-full_regression.md`：17次调用、0次Schema retry。
  - `.eval-artifacts/restaurant-decision/2026-08-12T10-13-30-090Z-full_regression.md`：17次调用、0次Schema retry。
- 10次矩阵显示：DGS03-T02为10/10 `S3_READINESS`；DGS04-T03为10/10 `S1_STATE_EXTRACTION`；DGS06-T03为10/10 `S7_SELECTION_DIVERSITY`；DGS06-T04为10/10不通过，但首错阶段不稳定（2次`S1`、7次`S7`、1次`S4`）；DGS07-T01为10/10不通过，其中9次`S3_READINESS`、1次`S1_STATE_EXTRACTION`。DGS05-T04只有1次Schema越界；DGS06-T02只有1次臆造`FLEXIBLE.anchorQuery: "current location"`；DGS07-T02只有1次`S2_STATE_ACCUMULATION`，且确认是同次DGS07-T01把`at 7pm`写成`APPROXIMATE`导致的累计污染，不是T02本身的新错误。
- 首跑的“直接S4失败为0”不能当作稳定结论；10次中出现过1次DGS06-T04反馈路由`S4_ACTION_ROUTING`，但v8中DGS02-T01、DGS03-T01和DGS03-T02的3个固定路由首错没有复现为直接S4。后续不得基于单次真实模型运行继续调Prompt；应优先处理10/10稳定不通过的问题，并把一次性Schema越界、臆造anchor和上游累计污染单独归类。

### Modes

- Unit/Contract、Fixture Oracle、Fixture Episode Runner：通过。
- Real Model Mock World：经用户明确授权后通过DeepSeek完成；结果仅为已暴露Regression开发诊断。
- Replay、Live Read-only和Controlled Live-write：本轮未运行；没有访问真实网站或预约平台。

### External side effects

无生产外部副作用；未访问live sites、真实Discovery、地图、Availability或预约平台。外部副作用仅限经用户明确授权后的DeepSeek模型调用；本v11记录中的10次成功/诊断运行合计174次DeepSeek API请求，其中包含4次Schema retry请求。

## 2026-08-12 — Prompt v10 extraction boundary verification

### Scope

只修改Progressive Decision Eval的Harness-only Prompt边界：社交语境不得推出人数，软偏好不得把`target: OPEN`提升为`CATEGORY`。Gold、Reducer、Scorer、输出Schema、真实Discovery、地图、Availability、预约平台和产品Runtime均未修改。

### Checks

- `npm run typecheck`：通过。
- `node --import tsx --test src/eval/restaurant-decision-eval-model-contract.test.ts`：8/8通过；Prompt Contract断言覆盖“不从社交语境推断party”和“软偏好保留为preferences”。
- `npm run eval:decision:model:fixture`：Runner v3、Fixture Model、17次调用、0次Schema retry；Model Contract使用`promptVersion: v10`与输出Schema `2`，S1–S8全部通过。
- `npm run eval:decision:fixture`：Golden v0.9 Fixture Oracle 17个Turn的S1–S8全部通过，P0为0。
- `npm run build`：通过。
- `git diff --check`：通过。

### Modes

- Unit/Contract、Fixture Oracle、Fixture Episode Runner：通过。
- 完整`npm test`：本轮未运行；改动只限Prompt文本、Prompt Contract测试和文档，没有修改Runtime、Web、Reducer或Scorer。当前完整基线仍为2026-08-12的131 tests / 5 suites。
- Real Model Mock World、Replay、Live Read-only和Controlled Live-write：本轮未运行；没有新的DeepSeek请求。

### External side effects

无生产外部副作用；没有网络模型调用。

## 2026-08-12 — Prompt v9 / Golden v0.9 location strategy verification

### Scope

只修改Progressive Decision Eval的Harness-only地点语义表示与比较：`FLEXIBLE`可带`anchorQuery`表达“从某地出发且愿意移动”，S1/S2对同一query的`AREA`/`NEAR_PLACE`做受控等价，并忽略泛化“willing to travel”类scope。未接真实地图、Discovery、Availability、预约平台或产品Runtime写入。

### Checks

- `npm run typecheck`：通过。
- `npm run eval:decision:preflight:complete`：Golden v0.9，7个Episode、17个Labeled Turn，`READY_FOR_EVALUATOR`。
- `npm run eval:decision:fixture`：17个Turn的S1–S8全部通过，P0为0。
- `npm run eval:decision:model:fixture`：Runner v3、Fixture Model、17次调用、0次Schema retry；Model Contract使用`promptVersion: v9`与输出Schema `2`。
- `node --import tsx --test src/eval/restaurant-decision-eval-scorer.test.ts src/eval/restaurant-decision-eval-model-contract.test.ts src/eval/restaurant-decision-eval-preflight.test.ts`：35/35通过。
- `npm test`：首次在sandbox内7个Local HTTP/SSE用例因`listen EPERM 127.0.0.1`失败，其余124个已通过；使用批准的`npm test`本机监听权限重跑后131 tests / 5 suites / 0 failed。
- `npm run build`：通过。

### Modes

- Unit/Contract、Fixture Oracle、Fixture Episode Runner：通过。
- Real Model Mock World、Replay、Live Read-only和Controlled Live-write：本轮未运行；没有新的DeepSeek请求。

### External side effects

无生产外部副作用。完整测试只临时监听本机`127.0.0.1`。

## 2026-08-11 — Prompt v8 Full Regression real-model diagnostic

### Scope

用户明确授权后，以`REAL_MODEL_MOCK_WORLD`运行全部7个已暴露的Regression Episode、17个Turn。候选仍为Golden Fixture；不访问真实Discovery/Availability，不执行预约、购买、取消、支付或任何产品Runtime写入。本次结果按`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`记录，不能作为模型质量或泛化证据。

### Checks

- `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_DECISION_EVAL_SCOPE=FULL_REGRESSION PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=7 npm run eval:decision:deepseek:smoke`：17/17真实DeepSeek调用完成，Schema retry为0。
- 7个Turn没有首错；其余10个首错为7个`S1_STATE_EXTRACTION`和3个`S4_ACTION_ROUTING`。没有由相对时间归一导致的首错。
- 本机Git忽略诊断Artifact：[2026-08-11T09-53-25-270Z-full_regression.md](../../.eval-artifacts/restaurant-decision/2026-08-11T09-53-25-270Z-full_regression.md)；它包含可信相对时间、原始/有效Patch及阶段差异，不包含原始Prompt、自然语言Completion、API Key或生产用户数据。

### Modes

- Real Model Mock World：已运行。
- Unit/Contract、Fixture Oracle、Fixture Episode Runner：见同日v8验证记录；Replay、Live Read-only和Controlled Live-write：未运行。

### External side effects

17次明确授权的付费DeepSeek只读模型调用，以及一个本地Git忽略诊断文件；没有生产外部写入。

## 2026-08-11 — Prompt v8 trusted relative-time normalization verification

### Scope

新增仅限Progressive Decision Eval的确定性相对时间解析与Runner v3：在固定`referenceTime`、`Asia/Tokyo`下，将`today`、`tomorrow`、`tonight`、`now`和`right now`并入可信State和有效Patch；诊断输出原始模型Patch、解析结果和有效Patch。不改生产Restaurant State、Task Runtime、真实时钟、Discovery、数据库、预约或外部写入。

### Checks

- `node --import tsx --test src/eval/restaurant-decision-eval-relative-time.test.ts src/eval/restaurant-decision-eval-runner.test.ts src/eval/restaurant-decision-eval-model-contract.test.ts`：18/18通过。覆盖Tokyo时区、五个相对表达、冲突不解析、跨回合Daypart保留、date-less模型`DAYPART`补齐，以及诊断中原始/有效Patch分离。
- `npm run typecheck`、`npm run eval:decision:preflight:complete`、`npm run eval:decision:model:fixture`、`npm run build`：通过；Fixture Runner为v3，17个Turn的S1–S8通过，P0为0，Model Contract使用`promptVersion: v8`。
- `npm test`：首次在PGlite WebAssembly的Node/V8清理阶段原生中止，尚未到断言级失败；同一命令立即重跑后为130 tests / 5 suites / 0 failed。

### Modes

- Unit/Contract、Fixture Oracle、Fixture Episode Runner：通过。
- Real Model Mock World、Replay、Live Read-only和Controlled Live-write：本轮未运行；没有新的DeepSeek请求。

### External side effects

无；完整测试仅临时监听本机`127.0.0.1`。

## 2026-08-11 — Prompt v7 occasion mapping verification

### Scope

只修改Progressive Decision Eval的Harness-only Model Contract：移除缺字段示例的`occasion: DATE`默认值，明确`FAMILY`、`FRIENDS`、`TEAM`与浪漫`DATE`的显式场景映射，并将`ASK_CORE_FIELD.DATE`与`occasion.DATE`的含义分开。不改生产Restaurant State、Task Runtime、Discovery、数据库、预约或任何外部写路径。

### Checks

- `node --import tsx --test src/eval/restaurant-decision-eval-model-contract.test.ts`：8/8通过。新断言确认Prompt包含抽象`FAMILY`、`FRIENDS`、`TEAM`、浪漫`DATE`规则，不含`"occasion":"DATE"`缺字段示例，且无Golden实体或样例事实。
- `npm run eval:decision:preflight:complete`：Golden v0.8，7个Episode、17个Labeled Turn，`READY_FOR_EVALUATOR`。
- `npm run eval:decision:model:fixture`：17个Turn完成评分，S1–S8通过，P0为0；所有Fixture调用携带`promptVersion: v7`。
- `npm run typecheck`、`npm run build`：通过。
- `npm test`：124 tests / 5 suites / 0 failed。初次沙箱运行的7个本机Web/SSE监听用例因`listen EPERM`无法启动；使用仅允许`127.0.0.1`临时监听的同一命令重跑后全部通过。

### Modes

- Unit/Contract、Fixture Oracle、Fixture Episode Runner：通过。
- Real Model Mock World、Replay、Live Read-only和Controlled Live-write：本轮未运行；没有新的DeepSeek请求。

### External side effects

无。

## 2026-08-11 — Eval-only restaurant category canonicalization verification

### Scope

只修改Progressive Decision Eval的S1/S2语义比较：受控类别别名和大小写视为等价。未改生产Restaurant State、Task Runtime、模型输入、Discovery、数据库或外部平台。

### Checks

- `npm run typecheck`、`npm run build`：通过。
- `npm run eval:decision:preflight:complete`：Golden v0.8，7个Episode、17个Labeled Turn，`READY_FOR_EVALUATOR`。
- `npm run eval:decision:model:fixture`：17个Turn完成评分，S1–S8通过，P0为0。
- `npm test`：124 tests / 5 suites / 0 failed。新增回归验证`WESTERN`、`IZAKAYA`、`JAPANESE`通过S1/S2，而非批准类别`Italian`仍为S1失败。

### Modes

- Unit/Contract、Fixture Oracle、Fixture Episode Runner：通过。
- Real Model Mock World、Replay、Live Read-only和Controlled Live-write：本轮未运行；没有新的DeepSeek请求。

### External side effects

无。

## 2026-08-11 — v6 full Regression diagnostic artifact run

## 2026-08-11 — v6 full Regression diagnostic artifact run

### Scope

用户明确授权后，以Prompt v6运行全部7个静态Regression Episode、17个Turn，并读取本机逐TurnMarkdown Artifact。该调用只访问DeepSeek，Candidate World保持虚构Golden Fixture。

### Checks

- `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_DECISION_EVAL_SCOPE=FULL_REGRESSION PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=7 npm run eval:decision:deepseek:smoke`：完成17次模型调用；Artifact记录0次Schema重试、4个完整通过Turn和13个首错（S1=10、S2=2、S7=1），未发现`P0_`错误。
- Artifact：`.eval-artifacts/restaurant-decision/2026-08-11T03-59-28-429Z-full_regression.md`。它逐条验证S1 Patch效果与S2累计状态确实可区分：DGS03-T02、DGS04-T02是上游偏差的S2后果；DGS02是独立的`RECOMMENDATION_MISSING`；其他10个首错为可见的S1字段差异。

### Modes

- Real Model Mock World：完成，固定标记`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。
- Unit/Contract、Fixture、Replay、Live Read-only和Controlled Live-write：本轮未运行。

### External side effects

17次受控、只读DeepSeek API调用，可能产生供应商费用；本机写入一个Git忽略的诊断Markdown；无数据库、Discovery、餐厅平台、预约、支付或其他外部写操作。

## 2026-08-11 — Progressive Decision diagnostic artifact verification

## 2026-08-11 — Progressive Decision diagnostic artifact verification

### Scope

新增当前静态Golden Regression的逐Turn诊断Artifact和真实Eval重试指标修正。范围仅限`src/eval/`与本机Git忽略的`.eval-artifacts/`输出；不改变生产状态、Task Runtime、Model Gateway遥测、数据库、Discovery或外部写入。

### Checks

- `npm run typecheck`：通过。
- `node --import tsx --test src/eval/restaurant-decision-eval-runner.test.ts src/eval/real-model-eval.test.ts`：7/7通过。回归场景故意令DGS01的`target`变为`OPEN`，确认诊断Markdown显示`state.target.kind`的期望/实际差异与`S1_STATE_EXTRACTION / STATE_PATCH_MISMATCH`。
- 指标回归验证：两条独立Turn主调用、两条Invocation Record时`retryCalls`为0；同一Case的两条调用仍正确计为一次重试。

### Modes

- Unit/Contract、Fixture Episode Runner：通过。
- Real Model Mock World：随后在同日的v6 full Regression diagnostic artifact run中运行，见上方独立记录。
- Replay、Live Read-only和Controlled Live-write：未运行；没有新的DeepSeek请求。

### External side effects

无。真实CLI的Artifact写入尚未在本轮实际触发；下次显式付费Regression Eval仅在本机`.eval-artifacts/`创建文件，不写数据库或普通遥测。

## 2026-08-11 — v6 full Regression diagnostic verification

## 2026-08-11 — v6 full Regression diagnostic verification

### Scope

在Golden v0.8 / Prompt v6的Fixture边界验证后，按用户明确授权运行全部7个已暴露`REGRESSION` Episode、17个Turn。此命令只向DeepSeek发送静态虚构Fixture和允许的当前Turn上下文；没有真实Discovery、Availability、Task、数据库或平台写入。

### Checks

- `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_DECISION_EVAL_SCOPE=FULL_REGRESSION PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=7 npm run eval:decision:deepseek:smoke`：`COMPLETED`，7/7 Episode为`SCORED`，17/17模型调用成功，0次Provider失败，Runner记录0次Schema重试，总延迟28,543ms；输入34,750、输出2,199、合计36,949 Token；成本`NOT_CONFIGURED`；P0为空。
- S1为6 Pass / 11 Fail；S2为4 Pass / 2 Fail / 11 Blocked。首错仅为11次`S1_STATE_EXTRACTION`和2次`S2_STATE_ACCUMULATION`；命名目标、Grounding和候选充分性不再是首错。
- 外层`modelMetrics.retryCalls`显示10，是通用汇总以7个Episode而不是17个有模型调用的Turn计算的已知报告缺陷；不得当作真实重试。逐TurnRunner的`schemaRetryCalls: 0`才是本次Schema重试结果。

### Modes

- Real Model Mock World：完成，`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`；结果不可作为Baseline、版本趋势或发布证据。
- Unit/Contract、Fixture Oracle和Fixture Episode Runner：采用本次v6边界验证结果；本次真实运行后未改代码，未重复执行。
- Replay、Live Read-only和Controlled Live-write：未运行。

### External side effects

17次受控、只读DeepSeek API调用，可能产生供应商费用；无数据库、Discovery、餐厅平台、预约、支付或其他外部写操作。

## 2026-08-11 — v6 Fixture Tool boundary verification

### Scope

Golden v0.8 / Prompt v6把命名目标解析、候选充分性和证据装配收回到Harness可信侧。改动限于Eval Contract、Preflight、Runner、Scorer、Golden Fixture和对应测试；未修改生产Restaurant State、Task Runtime、Adapter、Web、数据库或外部平台。

### Checks

- 定向Eval Contract / Preflight / Runner / Scorer / Mutation：54/54通过；包括缺少`FIXTURE_DISCOVERY`解析时Strict Preflight失败、品牌解析传入模型、有限结果的`retrievalSummary`传入模型、可信Grounding装配和语义no-op Patch。
- `npm run typecheck`、`npm run build`：通过。
- `npm run eval:decision:preflight:complete`：Golden v0.8，`READY_FOR_EVALUATOR`，7个Episode、17个Labeled Turn。
- `npm run eval:decision:model:fixture`：`FIXTURE_MODEL`下17个Turn均完成评分；S1–S8均通过，P0为0。
- `npm test`：122 tests / 5 suites / 0 failed。

### Modes

- Unit/Contract、Fixture Oracle、Fixture Episode Runner：通过。
- Real Model Mock World：随后在同日的v6 full Regression diagnostic中运行，见上方独立记录。
- Replay、Live Read-only和Controlled Live-write：未运行。

### External side effects

无。

## 2026-08-11 — v5 full Regression diagnostic verification

### Scope

在不修改生产路径的前提下，显式运行当前全部7个`REGRESSION` Episode。新增的Scope选择只影响Harness-only CLI的Episode集；默认三条Smoke仍保持不变。

### Checks

- `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_DECISION_EVAL_SCOPE=FULL_REGRESSION PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=7 PRAXIS_EVAL_SHOW_COMPLETIONS=1 npm run eval:decision:deepseek:smoke`：Prompt v5完成7个Episode、17个Turn，所有Episode均为`SCORED`。本次诊断在终端显示每个Completion与结构结果；原始正文按设计没有写入数据库、普通遥测或文件。
- `npm run typecheck`：通过。
- `npm test`：120 tests / 5 suites / 0 failed。
- `git diff --check`：通过。

### Modes

- Real Model Mock World：完成，结果标记为`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`；不能作为Baseline、趋势或发布证据。
- Unit/Contract、Fixture Runner：本轮未重跑定向命令；全量`npm test`覆盖它们。
- Replay、Live Read-only和Controlled Live-write：未运行。

### External side effects

17次受控、只读DeepSeek模型调用；无数据库、餐厅平台、预约、支付或其他外部写操作。

## 2026-08-11 — Prompt v5 decontamination and controlled smoke verification

### Scope

Prompt v5只删除静态System Prompt中来自Golden Regression的worked examples：店名、地点、菜系、候选、日期/人数与反馈措辞均替换为抽象规则；新增防泄漏Contract断言，并按用户明确授权重跑固定E1/E2/E3 DeepSeek Smoke。没有改变Task Runtime、生产Parser、状态、Schema、Authorization、Adapter、Web、数据库或外部写路径。

### Checks

- `node --import tsx --test src/eval/restaurant-decision-eval-model-contract.test.ts src/eval/restaurant-decision-eval-runner.test.ts`：11/11通过；覆盖v5不含`Sora Dining`、Ginza、西餐类别、原反馈措辞与候选占位符，且保留抽象命名店铺/偏好规则。
- `npm run typecheck`、`npm run build`：通过。
- `npm run eval:decision:preflight:complete`：通过，7个Episode、17个Labeled Turn为`READY_FOR_EVALUATOR`；`npm run eval:decision:model:fixture`：通过，17个Fixture Turn完成评分，P0为0。
- `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=3 PRAXIS_EVAL_SHOW_COMPLETIONS=1 npm run eval:decision:deepseek:smoke`：Prompt v5共7次成功调用、0次Provider失败、0次Schema Retry、15,548ms、14,704输入Token、918输出Token、15,622总Token，成本`NOT_CONFIGURED`，P0为0。7个Turn均结构合规并进入评分；S1为5 Pass / 2 Fail，S2为4 Pass / 1 Fail / 2 Blocked，S8为0 Pass / 3个`GROUNDING_MISSING` / 4 Blocked。首错另包括一次State Accumulation和一次不足候选解释。
- 全量`npm test`：120 tests / 5 suites / 0 failed（在允许临时`127.0.0.1`监听后）；`git diff --check`：通过。

### Modes

- Unit/Contract、Strict Complete、Fixture Episode Runner：通过。
- Real Model Mock World：Prompt v5完成；结果为`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`，不报告为质量Baseline或趋势。
- Replay、Live Read-only和Controlled Live-write：未运行。

### Safety

- v5静态Prompt不再含当前Golden Regression事实；模型仍仅可接收当前Turn的用户消息与允许的只读Fixture Candidate Context，不能伪造Retrieval、写Task、Authorization、Attempt或Outcome。
- Completion诊断只输出至本次终端，未写入普通Gateway遥测、数据库或文件。所有真实调用只读DeepSeek；没有数据库、餐厅平台、预约、支付或其他外部写操作。

### External side effects

7次受控、只读DeepSeek模型调用；无其他外部副作用。

## 2026-08-11 — Progressive Decision anti-leakage governance verification

### Scope

固定DeepSeek Smoke的报告分类和评测防泄漏协议：把已经用于Prompt v1–v5调优的`DGS01/DGS03/DGS05`明确降级为开发诊断，禁止将既有六次Smoke作为独立质量Baseline、趋势或发布证据。没有运行模型、Web、数据库或外部平台。

### Checks

- `npm run typecheck`、`npm run build`：通过。
- `npm test`：119 tests / 5 suites / 0 failed；最初Sandbox阻止本机`127.0.0.1`监听，按同一命令允许临时本机监听后全部通过。
- `npm run eval:decision:preflight:complete`：通过，Dataset为`READY_FOR_EVALUATOR`（7个Episode、17个Labeled Turn）；`npm run eval:decision:model:fixture`：通过，17个Fixture Turn均已评分、P0为0。
- `git diff --check`：通过。`evaluationClassification`随受控Smoke JSON输出编译进入CLI；为避免付费网络调用，本轮不实际执行该CLI。

### Modes

- Governance documentation / static CLI metadata：通过TypeScript编译、Fixture回归与差异检查验证；真实Smoke未运行。
- Fixture Oracle、Real Model Mock World、Replay、Live Read-only和Controlled Live-write：本轮未运行。

### Safety

- 该分类字段只随CLI报告输出，不保存Prompt/Completion，不影响Fail-closed、Task State、Authorization、Attempt或Outcome。
- 当前所有7个Golden Seed均为Regression；固定Smoke的三样本和结果已暴露给调优过程，报告为`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。

### External side effects

无。没有发起模型调用，也没有数据库、餐厅平台、预约、支付或其他外部写操作。

## 2026-08-11 — Episode Runner, controlled Progressive Decision smoke and completion diagnostic verification

### Scope

Harness-only Episode Runner：Strict Preflight、Golden Fixture候选上下文、版本化Model Contract、确定性S6、S1–S8评分、Schema/Provider失败隔离、静态Fixture专用Completion诊断，以及五次受控DeepSeek E1/E2/E3 Smoke。没有改动Web、Task Runtime、数据库、Authorization、Adapter或外部写路径。

### Checks

- `npm run eval:decision:preflight:complete`、`npm run eval:decision:fixture`和`npm run eval:decision:model:fixture`：通过。Fixture Model完整运行7个Episode、17个Turn；S1–S4/S8各17个Pass，S5为5个Pass，S6为11个Pass，S7为10个Pass，其余为设计上的`NOT_APPLICABLE`；P0为0。
- `node --import tsx --test src/eval/restaurant-decision-eval-model-contract.test.ts src/eval/restaurant-decision-eval-runner.test.ts`：10/10通过，覆盖Prompt v2嵌套Schema约束、显式进程内Completion诊断、完整Fixture路径、Provider失败停止Episode和Preflight阻断调用。
- `npm run typecheck`、`npm run build`：通过。
- `npm test`：119 tests / 5 suites / 0 failed；Web/SSE Fixture用例在允许本机`127.0.0.1`监听后通过。
- `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=3 npm run eval:decision:deepseek:smoke`：Prompt v1真实Provider连接成功，7次调用全部到达DeepSeek，0次Provider失败，3次Schema Retry，24,083ms总延迟，7,863输入Token、1,616输出Token、9,479总Token；三个Episode均以`INVALID_MODEL_OUTPUT`停止，未产生S1–S8语义分数。
- 相同范围的Prompt v2 Smoke：8次调用全部到达DeepSeek，0次Provider失败，3次Schema Retry，20,731ms总延迟，11,337输入Token、1,800输出Token、13,137总Token；E2-T01和E3-T01通过结构校验，E1-T01、E2-T02和E3-T02仍以`INVALID_MODEL_OUTPUT`停止，故没有完整Episode进入S1–S8语义评分。价格未配置，成本为`NOT_CONFIGURED`。
- 静态Fixture Completion诊断的第二次Prompt v2 Smoke：8次调用全部到达DeepSeek，0次Provider失败，3次Schema Retry，20,225ms总延迟，11,337输入Token、1,585输出Token、12,922总Token。E1两次均输出不受支持的`DAY`/`EVENING`、`location.type`和`RECOMMEND`；E2-T02用`DATE`或缺失的时间精度；E3-T02用`NIGHT`和布尔`preferred`。这些是Schema词表/字段组合错误，不是Provider或语义评分错误。
- 静态Fixture Completion诊断的Prompt v3 Smoke：7次调用全部到达DeepSeek，0次Provider失败、0次Schema Retry，12,573ms总延迟，13,389输入Token、812输出Token、14,201总Token。全部7个Turn结构合规并进入评分，但S1均为`STATE_PATCH_MISMATCH`；v3强制空`add`/`remove`而Gold no-op Patch省略它们，另有明确Restaurant当作Brand、DATE的occasion/target遗漏和反馈负偏好遗漏。结果不能作为语义质量Baseline；P0为0，成本仍为`NOT_CONFIGURED`。
- 静态Fixture Completion诊断的Prompt v4 Smoke：7次调用全部到达DeepSeek，0次Provider失败、0次Schema Retry，13,226ms总延迟，15,372输入Token、886输出Token、16,258总Token。全部7个Turn结构合规；S1为6 Pass/1 Fail、S2为6 Pass/1 Blocked、S3为5 Pass/1 Fail/1 Blocked、S4为5 Pass/2 Blocked，S6/S7各3 Pass/2 Blocked/2 NA，S8为5个`GROUNDING_MISSING`和2个Blocked。`Sora Dining`正确分类为`RESTAURANT`，反馈正确加入正/负偏好；P0为0，成本仍为`NOT_CONFIGURED`。

### Modes

- Dataset Annotation、Strict Complete、Fixture Oracle、Fixture Episode Runner、Core/Contract、PGlite Integration和本机HTTP/SSE：通过。
- Real Model Mock World：Prompt v1/v2均完成连接与Telemetry验证但Schema不稳定；Prompt v3已稳定结构输出却出现Gold State Patch和语义差异；Prompt v4进一步推进至Grounding、Readiness和单个State Patch 首错，仍不能报告为语义质量Baseline。静态Fixture Completion诊断已完成。
- Replay、Live Read-only和Controlled Live-write：未运行。

### Safety

- 真实Smoke仅使用虚构Golden候选，模型没有Task、Authorization、Attempt、Outcome、Discovery或写Tool；失败按`INVALID_MODEL_OUTPUT`停止，未以Golden数据替代模型结果。
- 普通Gateway遥测、Runner报告和文件均不输出或保存Prompt/Completion和Secret；仅在显式`PRAXIS_EVAL_SHOW_COMPLETIONS=1`下，静态虚构Golden Fixture的Completion与逐次校验结果会交给本次终端，不写入持久化日志。价格未配置时成本保持`NOT_CONFIGURED`。

### External side effects

五次Smoke共37次受控、只读DeepSeek模型调用；没有数据库、餐厅平台、预约、支付或其他外部写操作。

## 2026-08-10 — Progressive Decision Model Contract verification

### Scope

Harness-only Progressive Decision Model Proposal Contract：版本化服务端Gateway请求、严格JSON/嵌套Schema、一次无效输出重试、禁止模型伪造Candidate Retrieval、Provider失败和输入边界。没有发起真实Provider请求。

### Checks

- `node --import tsx --test src/eval/restaurant-decision-eval-model-contract.test.ts`：6/6通过。请求为`JSON_OBJECT`、10秒、900 Token、`temperature: 0`、Thinking关闭、`FAIL_CLOSED`；无效输出只重试一次，Provider失败不重试，`retrievedCandidateIds`被Schema拒绝。
- `npm run typecheck`、`npm run build`、`npm run eval:decision:fixture`：通过。
- `npm test`：115 tests / 5 suites / 0 failed；本机`127.0.0.1`监听的Web/SSE回归在允许本机监听后通过。

### Modes

- Eval Model Contract / Fixture Gateway：通过。
- Progressive Decision Real Model、Replay、Live Read-only和Controlled Live-write：未运行。

### Safety

- Proposal不会写Task State、Authorization、Attempt或Outcome；Candidate Retrieval只能由独立只读Fixture/Search阶段产生。
- 未加载或输出任何DeepSeek Key、Prompt正文或真实用户数据。

### External side effects

0。只执行本地Fixture Gateway与类型检查。

## 2026-08-10 — Progressive Decision Evaluator Verification Set

### Scope

18个S0–S8单点Mutation和S7 Fixture多样性可满足性检查。没有调用DeepSeek、真实Discovery/Availability、Authorization、Adapter或外部写入。

### Checks

- `node --import tsx --test src/eval/restaurant-decision-eval-mutation.test.ts`：18/18通过。M01–M02在Preflight拒绝无效Dataset/过敏证据；M03–M18分别命中预期S1–S8首错阶段与错误码，包括`P0_HARD_CONSTRAINT_VIOLATION`和`FIXTURE_COVERAGE_GAP`。
- `npm run eval:decision:fixture`：通过，Strict Preflight为`READY_FOR_EVALUATOR`，7个Fixture Journey全部Pass。
- `npm run typecheck`、`npm run build`：通过。
- `npm test`：109 tests / 5 suites / 0 failed；本机`127.0.0.1`监听的Web/SSE回归在允许本机监听后通过。

### Modes

- Dataset Annotation、Strict Complete、Fixture Oracle、Evaluator Verification、Core/Contract、PGlite Integration和本机HTTP/SSE：通过。
- Progressive Decision Real Model、Replay、Live Read-only和Controlled Live-write：未运行。

### Safety

- 当Fixture本身不能提供Gold要求的多样性时，Scorer给出`FIXTURE_COVERAGE_GAP`，不把该问题计为模型选择失败。
- 真实模型、Web、Task Runtime、Authorization、Adapter和外部写路径未被调用或修改。

### External side effects

0。只执行本地Fixture、类型检查、构建、PGlite和本机HTTP/SSE测试。

## 2026-08-10 — Progressive Decision S6–S8 Fixture Oracle verification

### Scope

Golden Seed v0.7、S6 Candidate Retrieval、S7 Selection/Diversity、S8 Response Grounding和过敏候选卡“仍需餐厅确认”披露。全部为Harness-only：没有调用DeepSeek、真实Discovery、Availability、Authorization、Adapter或外部写入。

### Checks

- `npm run eval:decision:preflight:complete`：通过，`READY_FOR_EVALUATOR`；7个Pool、29个Candidate、417个Fact、7个Episode、17个Turn、17个Labeled、0个Pending、0个Issue。
- `npm run eval:decision:fixture`：通过。7个Journey均Pass；S1–S4各17个Pass，S5为5个Pass/12个`NOT_APPLICABLE`，S6为11个Pass/6个`NOT_APPLICABLE`，S7为10个Pass/7个`NOT_APPLICABLE`，S8为17个Pass。
- 定向Eval测试：23/23通过。覆盖Preflight的过敏披露Fact边界、Perfect Oracle，以及S1/S3/S5/S6/S7/S8的单点Mutation和首错归因。
- `npm run typecheck`、`npm run build`：通过。
- `npm test`：91 tests / 5 suites / 0 failed；本机`127.0.0.1`监听的Web/SSE回归在允许本机监听后通过。

### Modes

- Dataset Annotation、Strict Complete、Fixture Oracle、Core/Contract、PGlite Integration和本机HTTP/SSE：通过。
- Progressive Decision Real Model、Replay、Live Read-only和Controlled Live-write：未运行。

### Safety

- 明确不支持严重花生过敏的Fixture Candidate进入检索或选择时得到`P0_HARD_CONSTRAINT_VIOLATION`；不得用多样性掩盖。
- DGS06每个可展示候选均必须携带引用`attributes` Fact的确认披露；遗漏时在S8得到`RESULT_GROUNDING_REQUIRED_DISCLOSURE_MISSING`。
- Fixture Oracle通过只证明Dataset、Scorer与归因自洽，不代表DeepSeek或产品已经具备渐进决策能力。

### External side effects

0。只执行本地Fixture、类型检查、构建、PGlite和本机HTTP/SSE测试。

## 2026-08-10 — Eval-only Reducer and S1–S5 Fixture Oracle verification

### Scope

Eval-only State Reducer、S1–S5确定性Scorer、首错/Blocked归因、Fixture Oracle CLI和首批Mutation。新增结构化Prediction只在评测进程使用；不连接DeepSeek，不修改生产Task State、Authorization、Command、Web、Adapter或外部执行。

### Checks

- `npm run eval:decision:fixture`：通过。Strict Preflight为`READY_FOR_EVALUATOR`；Fixture Oracle对7个Episode全部Pass，S1–S4各17个Pass，S5为5个Pass、12个`NOT_APPLICABLE`。
- 定向Eval测试：19/19通过；包括Reducer修正/清除/不变性、Perfect Oracle、S1/S3/S5单点Mutation首错归因和缺失Prediction fail closed。
- `npm run typecheck`、`npm run build`：通过。
- `npm test`：87 tests / 5 suites / 0 failed；本机`127.0.0.1`监听的Web/SSE用例在允许本机监听后通过。
- Markdown相对链接检查：通过。

### Modes

- Dataset Annotation、Strict Complete、Fixture Oracle、Core/Contract、PGlite Integration和本机HTTP/SSE：通过。
- Progressive Decision Real Model、Replay、Live Read-only和Controlled Live-write：未运行。

### Safety

- 任何缺失Prediction被fail closed；评分器仅计算报告，不能写Task State、Authorization、Attempt或Outcome。
- `BLOCKED_BY_UPSTREAM`不被重复计为下游根因；Fixture Oracle通过不报告为真实模型分数。

### External side effects

0。只执行本地Fixture、类型检查、构建、PGlite和本机HTTP/SSE测试。

## 2026-08-10 — DGS06 completion and strict Golden Seed verification

### Scope

Golden Seed v0.6及DGS06四个Turn：无日期宽泛Dinner保留、无地理锚点Flexible追问、人数范围修正、严重花生过敏候选呈现与敏感信息披露Consent边界。Preflight Contract调整为允许无日期`DAYPART`，其他已知时间精度仍要求日期。没有修改生产Parser、Web、Runtime、Adapter或外部写路径。

### Checks

- 定向`restaurant-decision-eval-preflight.test.ts`：15/15通过；新增覆盖无日期`DAYPART`保留与Exact仍需日期、无锚点Flexible追问、过敏请求备选、明确不支持排除及敏感披露未同意前不得提交。
- `npm run eval:decision:preflight`与`npm run eval:decision:preflight:complete`：均通过，`READY_FOR_EVALUATOR`；7个Pool、29个Candidate、417个Fact、7个Episode、17个Turn、17个Labeled、0个Pending、0个Issue。
- `npm run typecheck`与`npm run build`：通过。
- `npm test`：83 tests / 5 suites / 0 failed；本机`127.0.0.1`监听的7个Web/SSE用例在权限允许后通过。未授权沙箱首次运行的7项`EPERM`仅为监听限制，不是代码失败。
- Markdown相对链接检查：通过。

### Modes

- Dataset Annotation Draft、Strict Complete / Fixture Preflight、Core/Contract、PGlite Integration和本机HTTP/SSE：通过。
- Progressive Decision Real Model、Replay、Live Read-only和Controlled Live-write：未运行。

### Safety

- Fixture中“可接受过敏请求”不被表述为可安全接待；来源有处理流程也仍须餐厅确认；明确不支持严重花生过敏的候选被排除。
- Consent Card目前只作为Golden/Eval和设计门禁：未获用户对外披露过敏信息的确认，不得提交预约或过敏请求。

### External side effects

0。只执行本地类型检查、构建、Fixture Preflight、PGlite和本机HTTP/SSE测试。

## 2026-08-10 — DGS05 core-ready recommendation verification

### Scope

Golden Seed v0.5及DGS05四个Turn的Gold：开放约会需求、最小澄清、核心字段闭合即推荐、不得虚构口味排除、宽泛Dinner下的候选/Slot陈述，以及反馈后收敛为非套餐的亲密用餐选项。没有修改Contract、Schema、Preflight、Reducer、Scorer或生产代码。

### Checks

- 定向`restaurant-decision-eval-preflight.test.ts`：13/13通过；新增覆盖不从约会推断人数、只补地点、无“不吃辣”反馈时辣味候选仍合格、以及后续非套餐反馈的收敛结果。
- `npm run eval:decision:preflight`：通过，`READY_FOR_ANNOTATION`；7个Pool、29个Candidate、417个Fact、7个Episode、17个Turn、13个Labeled、4个Pending，0个Issue。
- Markdown相对链接检查：通过。
- `npm test`与`eval:decision:preflight:complete`：按Golden Seed分级验证规则未运行；本轮没有触发全量回归条件，且4个Pending为已知状态。

### Modes

- Dataset Annotation Draft / Fixture Preflight：通过。
- Strict Complete、Real Model、Replay、Live Read-only和Controlled Live-write：未运行。

### Safety

- 未表达的“不吃辣”不进入State或候选排除条件；Fixture Slot不被描述为用户确切时间匹配、真实有位或已可订。
- 候选、偏好、容量、属性和Slot均来自虚构Fixture，没有模型调用或外部执行。

### External side effects

0。只执行本地定向测试、Fixture Preflight和Markdown检查。

## 2026-08-10 — DGS04 Gold targeted verification

### Scope

Golden Seed v0.4及DGS04三个Turn的Gold：最小核心追问、8人容量过滤、宽泛Dinner推荐、安静排序偏好、全面禁烟硬约束和反馈后候选收敛。没有修改Contract、Schema、Preflight、Reducer、Scorer或生产代码。

### Checks

- 定向`restaurant-decision-eval-preflight.test.ts`：12/12通过；新增覆盖T01不提前检索、T02排除容量不足候选、T03排除吸烟区并禁止把Hachi声称为已证实安静。
- `npm run eval:decision:preflight`：通过，`READY_FOR_ANNOTATION`；7个Pool、29个Candidate、417个Fact、7个Episode、17个Turn、9个Labeled、8个Pending，0个Issue。
- Markdown相对链接检查：通过。
- `npm test`与`eval:decision:preflight:complete`：按Golden Seed分级验证规则未运行；本轮没有触发全量回归条件，且8个Pending为已知状态。

### Modes

- Dataset Annotation Draft / Fixture Preflight：通过。
- Strict Complete、Real Model、Replay、Live Read-only和Controlled Live-write：未运行。

### Safety

- 候选、容量、氛围、禁烟属性和Slot均来自虚构Fixture；没有模型调用、真实Availability或外部执行。
- 不把软偏好伪装成候选硬事实，也不为推荐数量放宽用户明确的禁烟约束。

### External side effects

0。只执行本地定向测试、Fixture Preflight和Markdown检查。

## 2026-08-10 — DGS03 outlet discovery and approximate-time verification

### Scope

Golden Seed v0.3、DGS03两Turn Gold、Outlet Discovery Oracle、Approximate Time、Outlet Name Fact、Sora干扰候选和Golden Seed分级验证流程。没有修改生产Parser、Prompt、Web、Task Runtime、Restaurant State、数据库Schema或Provider Adapter。

### Checks

- `npm run typecheck`：通过。
- `npm run build`：通过。
- 定向`restaurant-decision-eval-preflight.test.ts`：11/11通过；新增覆盖检索后才可见的Outlet集合、Discovery/Eligibility分离、Approximate 19:30、禁止发明Window和非目标餐厅过滤。
- `npm test`：79 tests / 5 suites / 0 failed；既有HTTP/SSE测试使用本机`127.0.0.1`临时监听，其余为本地Fixture/PGlite路径。
- `npm run eval:decision:preflight`：通过，`READY_FOR_ANNOTATION`；7个Pool、29个Candidate、417个Fact、7个Episode、17个Turn、6个Labeled、11个Pending，0个Issue。
- `npm run eval:decision:preflight:complete`：本轮不重复运行；根据新分级规则，只在全部Gold完成或进入Evaluator/Baseline门禁时运行。

### Modes

- Dataset Annotation Draft / Fixture Preflight：通过。
- Strict Complete Preflight：未运行，原因是11个Pending为已知状态。
- Fixture Oracle、Real Model Mock World、Replay、Live Read-only、Controlled Live-write：未运行。

### Safety

- Approximate Time不会被Schema静默转换为Exact或有界Window；检索前Candidate事实不进入允许Grounding集合。
- 所有Outlet和Slot均为虚构Fixture，没有模型调用、真实Availability、Authorization或外部执行。

### External side effects

0。只执行TypeScript编译、Fixture Preflight、PGlite和本地HTTP/SSE测试。

## 2026-08-10 — Domain Knowledge and Memory staging documentation verification

### Scope

Data/Context、Search和Roadmap文档中的Domain Entity Observation、Interaction Event、Aggregate Insight、Private User Memory与Freshness-aware复用边界。本轮没有修改代码、数据库Schema、Prompt、配置、Provider Adapter或产品行为。

### Checks

- 文档分层检查：Conversation、Task State、外部实体Observation、群体Aggregate和个人Memory职责互不替代。
- Stage检查：2C只新增Restaurant Domain-owned的最小Observation/Event Contract，并明确只采集、不参与在线排序；通用Knowledge Platform、Trending和个性化仍有真实数据与评审门槛。
- Grounding检查：缓存事实保留Source、`observedAt`和Freshness；Availability、价格、条款及现实执行前仍要求按用途刷新或重新验证。
- Markdown相对链接检查：通过；README、AGENTS和`docs/`内Markdown链接无缺失目标。

### Modes

- Design / documentation verification：通过。
- Mock、Replay、Real Model、Live Read-only和Controlled Live-write：未运行；本轮没有可执行实现。

### Safety

- 未引入跨用户Memory读取、自动在线学习、群体数据回写个人偏好或过期缓存支持现实声明的路径。
- Provider内容继续受来源缓存、展示、署名和删除政策约束。

### External side effects

0。只修改和读取本地Markdown文档。

## 2026-08-10 — DGS02 and constraint-relaxation pair verification

### Scope

Golden Seed v0.2、DGS02/DGS07 Gold、单约束Fallback Oracle、Preflight同意门禁、干扰Candidate以及Episode批量标注流程。没有修改生产Parser、Prompt、Web、Task Runtime、Restaurant State、数据库Schema或Provider Adapter。

### Checks

- `npm run typecheck`：通过。
- `npm run build`：通过。
- 定向`restaurant-decision-eval-preflight.test.ts`：9/9通过；覆盖DGS01、DGS02严格品牌结果、DGS07零结果双Fallback、用户选择后的单字段更新、缺失同意、严格结果非空时禁止Fallback、悬空引用和运行时结构防护。
- `npm test`：77 tests / 5 suites / 0 failed；既有HTTP/SSE测试使用本机`127.0.0.1`临时监听，其余为本地Fixture/PGlite路径。
- `npm run eval:decision:preflight`：通过，`READY_FOR_ANNOTATION`；7个Pool、28个Candidate、374个Fact、7个Episode、17个Turn、4个Labeled、13个Pending，0个Issue。
- `npm run eval:decision:preflight:complete`：按设计非零退出，`BLOCKED_PENDING_HUMAN_LABELS`并准确列出剩余13个Pending Turn。

### Modes

- Dataset Annotation Draft / Fixture Preflight：通过。
- Strict Complete Preflight：仅因剩余人工Gold按设计阻断。
- Fixture Oracle、Real Model Mock World、Replay、Live Read-only、Controlled Live-write：未运行；Reducer、阶段Scorer和Model Contract尚未实现。

### Safety

- Mutation验证`requiresUserChoice: false`和严格Eligible非空时触发Fallback均被Preflight拒绝。
- Fallback只使用虚构Fixture；没有真实Availability、模型调用、状态写入、Authorization或外部执行。

### External side effects

0。只执行TypeScript编译、Fixture Preflight、PGlite和本地HTTP/SSE测试。

## 2026-08-10 — DGS01 Gold verification

### Scope

DGS01人工Gold、宽泛Daypart下的Slot Grounding语义、Golden Seed统计和相关Eval/Roadmap文档。没有修改生产Parser、Prompt、Web、Task Runtime、Restaurant State、数据库Schema或Provider Adapter。

### Checks

- `npm run typecheck`：通过。
- `npm run build`：通过。
- 定向`restaurant-decision-eval-preflight.test.ts`：6/6通过；新增断言验证东京日期、`DAYPART/DINNER`、Ginza `AREA`、直接推荐、价格/子类型多样性，以及允许展示Slot但禁止声称精确时间匹配。
- `npm test`：74 tests / 5 suites / 0 failed；既有HTTP/SSE测试使用本机`127.0.0.1`临时监听，其余全部为本地Fixture/PGlite路径。
- `npm run eval:decision:preflight`：通过，`READY_FOR_ANNOTATION`；6个Candidate Pool、22个Candidate、291个Fact、6个Episode、1个Labeled Turn、14个Pending Turn，0个Issue。
- `npm run eval:decision:preflight:complete`：按设计非零退出，`BLOCKED_PENDING_HUMAN_LABELS`并准确列出剩余14个待人工标注Turn。

### Modes

- Dataset Annotation Draft / Fixture Preflight：通过。
- Strict Complete Preflight：仅因剩余Pending Gold按设计阻断。
- Fixture Oracle、Real Model Mock World、Replay、Live Read-only、Controlled Live-write：未运行；Reducer、阶段Scorer和Model Contract尚未实现。

### Safety

- Slot只作为虚构Fixture Fact接受Grounding，不表示符合用户的确切时间、真实Availability或可订承诺。
- 命令不加载`.env`、不读取DeepSeek Key、不产生模型请求、Task Event、数据库写入、Authorization或外部副作用。

### External side effects

0。只执行TypeScript编译、Fixture Preflight、PGlite和本地HTTP/SSE测试。

## 2026-08-09 — Progressive Decision Golden Seed and S0 Preflight verification

### Scope

Eval v2 Dataset/Fixture/Annotation Contract、6个Golden Seed Episode、Candidate Fixture、S0 Dataset Preflight、CLI和5个Contract测试。没有修改生产Parser、Prompt、Web、Task Runtime、Restaurant State、数据库Schema或Provider Adapter。

### Checks

- `npm run typecheck`：通过。
- `npm run build`：通过。
- 定向`restaurant-decision-eval-preflight.test.ts`：5/5通过，覆盖Draft可标注状态、Pending严格阻断、悬空Candidate引用、重复Fact ID、完整Gold样例和不可信运行时结构。
- `npm test`：73 tests / 5 suites / 0 failed。首次沙箱运行66/73通过，7个既有Stage 2B HTTP/SSE场景因`listen EPERM 127.0.0.1`失败；允许本机回环监听后同一命令完整通过，不是产品或本次Eval代码失败。
- `npm run eval:decision:preflight`：通过，`READY_FOR_ANNOTATION`；6个Candidate Pool、21个Candidate、278个Fact、6个Episode、15个Pending Turn，0个Issue。
- `npm run eval:decision:preflight:complete`：按设计非零退出，`BLOCKED_PENDING_HUMAN_LABELS`并准确列出15个待人工标注Turn；证明未完成Gold不能进入Evaluator阶段。

### Modes

- Dataset Annotation Draft / Fixture Preflight：通过。
- Strict Complete Preflight：按设计阻断Pending Gold。
- Fixture Oracle、Real Model Mock World、Replay、Live Read-only、Controlled Live-write：未运行；Reducer、阶段Scorer和Model Contract尚未实现。

### Safety

- 所有Candidate、Availability和Fact均为虚构Fixture；输出不代表真实餐厅或空位。
- 命令不加载`.env`、不读取DeepSeek Key、不产生模型请求、Task Event、数据库写入、Authorization或外部副作用。
- Gold保持人工所有权，当前代码未自动填充语义Label。

### External side effects

0。只运行TypeScript编译、Fixture Preflight、PGlite/本地既有测试；没有真实模型、餐厅平台、外部数据库或预约写入。

## 2026-08-09 — Restaurant Progressive Decision Eval v2 plan verification

### Scope

Eval v2计划、数据覆盖、评分规则、错误等级、候选门槛和Roadmap/架构/工程文档同步。本轮没有修改TypeScript、Prompt、数据集、Evaluator、Web、Task Runtime、Restaurant State或Provider Adapter。

### Checks

- Markdown相对链接：通过，检查README、AGENTS和`docs/`共41个Markdown文件，0个缺失目标。
- 状态扫描：通过；当前Source of Truth不再把真实DeepSeek标记为“尚未运行”，并明确2026-08-08的1条结果只是Connectivity Smoke，不是质量Baseline。
- 范围扫描：通过；Eval v2统一标记为`Draft / HARNESS_ONLY`，Roadmap和Harness文档均未声称产品已支持渐进决策。
- `npm run typecheck`、`npm test`、`npm run build`：未运行；本轮没有修改代码、配置、Schema或构建输入。

### Modes

文档静态验证：通过。Fixture Eval、Real Model Eval、Replay、Live Read-only和Controlled Live-write：本轮均未运行。

### Safety

计划保留模型无Task/Authorization/Attempt/Outcome写权限、真实模型显式付费门禁、Prompt/Response脱敏以及Mock/Real/Live结果分离。

### External side effects

0。没有模型、数据库、餐厅平台或其他外部网络调用。

## 2026-08-08 — Local configuration and Eval command boundary verification

### Scope

Git忽略的本地`.env`、可提交模板，以及`dev`、真实模型Eval和真实PostgreSQL smoke的原生配置加载。没有提供或读取真实Key、数据库凭据、Provider网络、预约平台或外部数据库。

### Checks

- Node.js 24.4.1支持`--env-file-if-exists`；命令在`.env`不存在时不因加载器失败。
- `npm test`、`npm run build`、`npm run eval:intent:fixture`和`npm run eval:search:fixture`脚本不含`.env`加载；它们不能隐式读取本地DeepSeek或数据库凭据。
- `npm run eval:intent:deepseek`继续保留`PRAXIS_ALLOW_LIVE_MODEL_EVAL=1`的既有fail-closed门禁；本轮未设置开关或Key，未发起网络请求。
- `npm run typecheck`、`npm run build`：通过。
- `npm run eval:intent:fixture`：8/8 Fixture样例通过，`p0Errors: 0`。
- `npm run eval:search:fixture`：3/3断言通过。
- `npm test`：通过，68 tests / 5 suites / 0 failed。沙箱内首次运行的7个本地HTTP/SSE用例因禁止监听`127.0.0.1`报`EPERM`；允许本机回环监听后同一命令完整通过，不是产品失败。

### Modes

配置/命令静态验证：通过。真实Model Eval、真实PostgreSQL smoke、Replay、Live Read-only和Controlled Live-write：未运行。

### Safety

`.env`和`.env.*`被Git忽略，只有`.env.example`可提交；Web不读取任何本地配置变量。真实模型与真实PostgreSQL命令仍需各自既有的显式门禁。

### External side effects

0。没有读取真实凭据、没有网络调用、数据库连接或外部写入。

## 2026-08-08 — First controlled DeepSeek Intent Eval

### Scope

使用本地服务端配置和显式付费门禁运行`restaurant-intent-eval-v1`的1条真实模型样本`I01-complete-tonight-yakiniku`。只验证Intent Parser与固定数据集，不创建Task、不写数据库、不调用餐厅平台。

### Checks

- `npm run eval:intent:deepseek`：通过，`mode: REAL_MODEL`。
- 样本：1/1有效输出，1/1精确匹配；所有字段准确率均为1；阻塞字段漏检率为0；不必要追问率为0；`p0Errors: 0`。
- Provider：DeepSeek；模型：`deepseek-v4-flash`。
- 模型调用：1次成功、0次失败、0次重试；总延迟约3950ms。
- Token：输入325、输出96、合计421；成本状态为`NOT_CONFIGURED`，因为本次未配置价格变量，未猜测费用。

### Modes

Real Model Eval：通过（仅1条样本）。Fixture、Mock、Replay、Live Read-only和Controlled Live-write：本条未运行。

### Safety

真实模型输出仍只经过Parser和Domain Schema Validator；本次Eval没有进入Task Runtime或任何外部副作用路径。运行完成后`PRAXIS_ALLOW_LIVE_MODEL_EVAL`已恢复为`0`。

### External side effects

1次DeepSeek API请求，可能产生供应商费用；没有数据库、餐厅平台或预约写入。

## 2026-08-08 — Stage 2B Persistent Agent Shell验证

### Scope

PostgreSQL Workspace Migration、Pilot Session、持久Conversation、Case/Activity/Artifact Projection、Persistent Restaurant Agent、Responsive Web、HTTP API与SSE重连。仍使用Fixture Model/Search；没有生产身份、通知、真实Provider、Authorization、外部写入或预约。

### Checks

- `npm run typecheck`：通过。
- Stage 2B定向HTTP/SSE测试：7/7通过；覆盖Responsive页面Contract、W01–W05、缺失信息续聊和陈旧版本409。
- `npm test`：通过，68 tests / 5 suites / 0 failed。沙箱内首次定向HTTP测试因禁止监听`127.0.0.1`报`EPERM`，允许本机回环监听后通过；不是产品失败。
- `npm run build`：通过。
- `npm run eval:intent:fixture`：8/8 Fixture样例通过，`p0Errors: 0`。
- `npm run eval:search:fixture`：3/3 Fixture断言通过。
- In-app Browser QA：通过；1280×800 Desktop与390×844 Mobile完成登录、创建Case、候选选择和Activity检查。Mobile切为单列、Case列表横向滚动、Composer按钮占满容器且无页面横向溢出；页面Console无Error/Warning。QA中发现并修复Desktop `Sign out`按钮窄屏换行。

### Modes

- Unit/Contract、Mock Harness、Embedded-postgres Integration、Local Fixture HTTP/SSE：通过。
- Local Browser视觉/交互：手动通过；Real PostgreSQL、Real Model Eval、Browser Adapter Fixture、Replay、Live Read-only、Controlled Live-write：未运行。

### Safety

- 跨用户Case和SSE均返回404；业务API只使用服务端Session解析的`userId`。
- W05证明Conversation中的“预约成功”文本不会改变Task Version、Phase、Event Activity或Outcome Artifact。
- Candidate Selection只到`AWAITING_AUTHORIZATION`；测试路径中Authorization、Attempt和`EXTERNAL_WRITE`均不存在。

### External side effects

0。测试只使用本机进程、PGlite和Fixture Model/Search；没有真实模型、平台、预约或外部数据库调用。

### Limitations

- PGlite只证明Embedded-postgres Integration，不能替代真实PostgreSQL测试；本轮未获得专用测试数据库写入配置，因此没有运行`npm run test:postgres:live`。
- 已完成单一In-app Browser的两个Viewport QA，但尚未覆盖Chrome/Safari差异、真实移动设备触控、可访问性审计或自动化视觉回归。

## 2026-08-08 — Web-first Agent Workspace文档验证

### Scope

ADR-0006、Agent Gateway/Workspace架构、MVP/User Flow、Stage 2B–2D Roadmap、Interfaces、Data/Context/Security、Arch Guard、Harness和工程记录同步。没有修改代码、数据库Schema、模型、Provider、Adapter或现实副作用行为。

### Checks

- Markdown相对链接：通过，检查README和`docs/`共38个Markdown文件，0个缺失目标。
- 阶段与术语扫描：通过；当前Source of Truth中没有残留“Stage 2B直接接Live Discovery”“Stage 2C为Availability”或“Task Runtime是所有交互顶层总指挥”的旧描述。Dev Log中的旧文字保留为历史记录，并由2026-08-08条目明确改变。
- `npm test`：首次沙箱运行61/63通过，2个Local Web/API测试因禁止监听`127.0.0.1`报`EPERM`；允许本机测试监听后重跑，63 tests / 5 suites / 0 failed。
- `npm run typecheck`、`npm run build`：未运行；本轮没有TypeScript或构建输入改动。

### Modes

- Unit/Contract、Mock Harness、Embedded-postgres Integration、Local Fixture HTTP：完整稳定基线通过。
- Real PostgreSQL、Real Model Eval、Replay、Live Read-only、Controlled Live-write：未运行；本轮没有对应实现或平台改动。

### Safety

- Conversation、Activity和Artifact被定义为非权威Projection，不能改变Task、Authorization、Attempt或Outcome。
- Stage 2B继续使用Fixture Model/Search，不新增外部网络、通知渠道或写操作。
- 用户隔离、跨设备恢复和Conversation非权威性新增为Golden `W01–W05`场景规格，尚未实现，不能报告为产品能力。

### External side effects

0。测试只使用本机进程、PGlite和Local Fixture HTTP，没有真实模型、平台、预约或外部数据库调用。

## 2026-08-07 — Stage 2A Local Fixture Search Web验证

### Scope

Restaurant `UNDERSTANDING / NEEDS_INPUT / SEARCHING / AWAITING_SELECTION`状态、必填Trace、Local-only Fixture ModelGateway/Search、HTTP/HTML本地入口、候选选择和Fixture Search Eval。没有真实DeepSeek、真实Provider、Authorization、预约、外部写入或真实PostgreSQL Smoke。

### Checks

- `npm run typecheck`：通过。
- `npm test`：通过，63 tests / 5 suites / 0 failed；包括2个Local Web/API HTTP端到端场景和1个Fixture Search Eval Contract。
- `npm run eval:search:fixture`：通过，`mode: FIXTURE`、3/3断言通过：完整请求返回3候选、缺字段只请求日期/时间/人数、选择停在授权前。
- `npm run build`：通过。
- `npm run eval:intent:fixture`：通过，8条Fixture Intent样例全部通过；仅证明Fixture Oracle、Schema与计分器，不能作为DeepSeek质量分数。

### Modes

- Fixture Model / Fixture Search / Local HTTP API：通过。
- Mock Restaurant Booking Harness、Embedded-postgres Integration：完整基线维持通过。
- Real PostgreSQL：本轮未重跑。
- Real Model Eval、Replay、Live Read-only、Controlled Live-write：未运行。

### Safety

- Model输出经既有Parser和Schema Validator后才成为`INTENT_PARSED` Event；不直接写Task State。
- 所有Event必须携带Trace并匹配Task Run；不再为旧Fixture补默认值。
- 选择候选只到`AWAITING_AUTHORIZATION`；本阶段没有Authorization、Policy Commit或`EXTERNAL_WRITE`。

### External side effects

0。Fixture Model/Search和HTTP测试均在本机进程内；没有网络Provider、真实餐厅或预约调用。

### Limitations

- 本轮未完成浏览器视觉手测；本地HTTP端到端测试已经覆盖页面入口和JSON路径。开发者可通过`npm run dev`在`127.0.0.1:3000`手动检查Fixture页面。
- Fixture Search只覆盖三条演示路径；不验证真实Discovery、实体合并、Availability、30秒预算或模型质量。

## 2026-08-07 — Roadmap and Stage 1 review verification

### Scope

Roadmap阶段重划、扩展投资门槛、Agent实现原则、测试投入原则和文档状态修正。业务代码、Schema、Provider Adapter和外部执行均未修改；本次重新运行Stage 1基线以核实完成状态。

### Checks

- `npm run typecheck`：通过。
- `npm test`：通过，61 tests / 5 suites / 0 failed；其中20个PGlite集成场景。
- `npm run build`：通过。
- Markdown相对链接：通过，共检查64个Markdown文件。
- Secret模式扫描：通过，排除`node_modules/`、`dist/`与`.git/`后未发现API Key、数据库凭据或私钥。

### Modes

- Unit/Contract、Mock Harness、Embedded-postgres Integration：通过。
- Real PostgreSQL：本次未重跑；此前隔离本机Smoke结果仍单独记录。
- Real Model Eval、Replay、Live Read-only、Controlled Live-write：未运行。

### Review conclusion

- Stage 1测试足以支持Runtime、Policy、Verifier、Outbox、恢复和Provider Contract完成结论。
- 这些结果不证明Web可用、DeepSeek质量、Search质量、真实Availability或预约成功率。
- Stage 2测试应优先覆盖同一条Web/API/Search纵向路径；不再用未来Runtime测试数量延后产品闭环。
- Goal Graph、Scheduler和合成Domain属于已验证架构探针；只有Roadmap中的真实触发条件出现后才恢复扩建。

### External side effects

0。没有真实模型、平台、预约或外部数据库调用。

## 2026-08-07 — Stage 1I Synthetic Runtime Domains验证

### Scope

Harness-only Recurring Shopping、Long-running Case及其与持久化Task Runtime/Trigger的集成；不含真实Shopping、支付、外部Case系统、模型、Browser或数据库外部副作用。

### Checks

- `npm run typecheck`：通过。
- `src/infrastructure/postgres/postgres-runtime.test.ts`：通过，20 tests / 1 suite / 0 failed。
- `npm test`：通过，61 tests / 5 suites / 0 failed。
- `npm run eval:intent:fixture`：通过，8个Fixture样本全部通过；`mode: FIXTURE`、`exactMatchRate: 1`、`p0Errors: 0`，不作为模型分数。
- `npm run build`：通过。
- Markdown相对链接：通过，共检查README、AGENTS和`docs/`内37个文件。
- Secret模式扫描：通过，排除`node_modules/`与`dist/`后未发现API Key、数据库凭据或私钥。
- `G01-recurring-shopping`：持久化Trigger/Fake Clock在到期后只进入`WAITING_USER`；确认后仅有`PREPARE`命令；下一周期再次等待确认，`EXTERNAL_WRITE`为0。
- `G02-long-running-case`：外部材料请求进入`WAITING_USER`，材料补齐后才再次准备，外部解决进入`SUCCEEDED`；`EXTERNAL_WRITE`为0。

### Modes

- Harness/Embedded-postgres Integration：通过，PGlite与Fake Clock。
- Mock Restaurant Harness、Fixture Eval：维持通过，未在本条重复运行。
- Real PostgreSQL、Real Model Eval、Live Read-only、Controlled Live-write：未运行。

### Safety

- 合成Shopping不存在自动购买或外部写命令；每周期必须由`CONFIRM_PURCHASE` Event重新开启。
- 合成Case的外部事件只能经Event状态机推进，不直接写Task State；无材料时不产生再准备命令。

### External side effects

0。仅PGlite内存数据库写入；没有网络、真实购买、真实Case提交或真实预约。

### Limitations

- 这两个Harness Domain不代表产品功能、第二个真实Domain或生产Scheduler桥接。
- Coordination仍只有Goal Graph聚合场景，独立状态机未实现；跨Domain Child Task/自动激活继续保持proposed。

## 2026-08-07 — Stage 1H Restaurant Intent Parser and Controlled Real Model Eval验证

### Scope

Restaurant Prompt/Parser、强化Intent Schema Validator、真实模型Eval Adapter、Token/成本计分与付费网络门禁；没有真实Key、Provider网络、Task State、数据库或预约平台。

### Checks

- `npm run typecheck`：通过。
- Restaurant Domain、Eval与DeepSeek Connector定向测试：通过，20 tests / 1 suite / 0 failed。
- `npm test`：通过，59 tests / 5 suites / 0 failed。
- `npm run eval:intent:fixture`：通过，8个Fixture样本全部通过；`mode: FIXTURE`、`exactMatchRate: 1`、`p0Errors: 0`，不作为模型分数。
- `npm run build`：通过。
- Markdown相对链接：通过，共检查README、AGENTS和`docs/`内37个文件。
- Secret模式扫描：通过，排除`node_modules/`与`dist/`后未发现API Key、数据库凭据或私钥。
- Parser Contract：验证版本化JSON Prompt、用户文本以JSON字符串传递、一次无效输出重试、两次无效后结构化表单降级、Provider失败不改变Task State。
- Real Model Eval Contract：验证付费开关、样本数和价格配置门禁、Golden数据集复用、Provider/模型/Token/成本聚合和Retry计数。
- `npm run eval:intent:deepseek`（未设置开关）：按预期退出，提示需要`PRAXIS_ALLOW_LIVE_MODEL_EVAL=1`；执行在构造Gateway前停止，0次网络调用。

### Modes

- Parser/Real Eval Connector Contract：通过，Fake ModelGateway/Fake Fetch；没有网络。
- Fixture Eval：维持通过，但仍是Fixture Oracle。
- Real Model Eval、Replay、Live Read-only、Controlled Live-write：未运行或未实现。

### Safety

- 未通过JSON、`finish_reason`和Domain Schema三层校验的模型结果不会以`PARSED`返回。
- JSON/Schema错误最多触发一次只读模型重试；Provider失败不重试，直接降级。
- 真实Eval必须同时具备服务端Key、模型名和显式付费网络开关；Token价格缺失时不生成虚构成本。

### External side effects

0。没有模型网络调用、Provider调用、数据库写入或真实预约副作用。

### Limitations

- 本轮证明Parser/评测的Contract和门禁，不证明DeepSeek的实际意图理解、JSON可靠性、速度、配额或成本。
- 当前Golden数据集只有8条；首次真实结果必须单独归档，之后再扩充错例集。

## 2026-08-07 — Stage 1G DeepSeek Model Gateway Provider Contract验证

### Scope

Core `ModelGateway` Contract、DeepSeek非流式Chat Completion HTTP Adapter、配置门禁、超时、错误归类和无内容Telemetry；不包含Restaurant Intent Parser、真实Key、真实网络或任何Task状态变更。

### Checks

- `npm run typecheck`：通过。
- `npm test`：通过，52 tests / 5 suites / 0 failed。
- DeepSeek Connector Contract：5个场景通过。验证固定Endpoint、Bearer Header、`JSON_OBJECT`请求格式、内部Task ID不出站、Prompt/Completion不进入Telemetry、未配置模型fail-closed、429归类、请求超时和畸形响应拒绝。
- `npm run build`：通过。
- Markdown相对链接：通过，共检查README、AGENTS和`docs/`内37个文件。
- Secret模式扫描：通过，排除`node_modules/`与`dist/`后未发现API Key、数据库凭据或私钥。

### Modes

- Connector Contract：通过，Fake Fetch；不含网络。
- Fixture Eval：维持通过，但仍是Fixture Oracle。
- Replay、Real Model Eval、Live Read-only、Controlled Live-write：未实现或未运行。

### Safety

- Adapter没有Tool Call、Task Runtime、Policy或平台Adapter依赖，不能产生Task State或现实副作用。
- 真实Key及Provider正文未读取、未打印、未写入测试工件；Telemetry只保存脱敏调用元数据。

### External side effects

0。没有模型网络调用、Provider调用、数据库写入或真实预约副作用。

### Limitations

- 尚未验证真实DeepSeek凭证、账号权限、配额、模型可用性、延迟或价格。
- 后续真实Intent Eval必须显式启用并单独报告，不得与本条Connector Contract混报。

## 2026-08-07 — Stage 1F Intent Eval Harness验证

### Scope

Restaurant Intent Draft Schema Validator、8条固定Intent数据集、Fixture Eval Runner和字段级指标；没有DeepSeek API、网络、Browser、Provider或真实预约。

### Checks

- `npm run typecheck`：通过。
- `npm run eval:intent:fixture`：通过，8个Fixture样本全部通过Schema与Golden比对；报告`mode: FIXTURE`、`exactMatchRate: 1`、`p0Errors: 0`。
- `npm test`：通过，47 tests / 5 suites / 0 failed。
- Eval Contract：Fixture基线、阻塞字段漏检为P0、畸形模型输出被Schema Validator拒绝。
- `npm run build`：通过；编译产物Smoke可加载Intent Evaluator和Schema Validator。
- 相对链接：通过，共检查README、AGENTS和`docs/`内37个Markdown文件。
- Secret模式扫描：通过，排除`node_modules/`与`dist/`后未发现API Key、数据库凭据或私钥。

### Modes

- Fixture Eval：通过，8个样本。
- Replay Eval：框架支持、当前未运行真实Replay。
- Real Model Eval：未实现，未运行；DeepSeek Gateway和Key尚未接入。
- Live Read-only、Controlled Live-write：未实现或未运行。

### Safety

- Eval的模型输出只进入Schema Validator，不能直接写Task State或触发搜索/预约。
- Fixture Oracle分数不作为模型质量或发布依据。

### External side effects

0。没有模型网络调用、Provider调用、数据库写入或真实预约。

### Limitations

- 当前样本数为8，仅用于建立评测契约，不足以代表真实用户分布。
- 真实模型、Prompt版本、token/成本/延迟与重试统计将在DeepSeek Gateway接入后记录。

## 2026-08-07 — Stage 1E Trigger/Scheduler验证

### Scope

持久化定时Trigger、到期Claim、租约恢复、确定性Event、陈旧版本淘汰和有界失败；没有模型、Browser、Provider或真实预约。

### Checks

- `npm run typecheck`：通过。
- `npm test`：通过，44 tests / 5 suites / 0 failed。
- Embedded-postgres Integration：18个PGlite场景通过；新增Trigger未到期不投递、到期单次投递、租约过期重领、期望版本陈旧转`OBSOLETE`及失败上限转`FAILED`。
- `npm run build`：通过。
- 编译产物导入Smoke：通过，`TriggerScheduler`与`PostgresTriggerStore`可从`dist/`加载。
- Real PostgreSQL smoke：通过。真实PostgreSQL 17中由Scheduler把Booking子Task推进为`SUCCEEDED`，随后验证Route就绪和Goal聚合。
- 后置只读清理检查：`praxis_schema_migrations=4`；`goals`、`tasks`、`task_events`、`task_commands`、`goal_task_memberships`、`task_dependencies`和`task_triggers`均为0行。
- 相对链接：通过，共检查README、AGENTS和`docs/`内37个Markdown文件。
- Secret模式扫描：通过，排除`node_modules/`与`dist/`后未发现API Key、数据库凭据或私钥。

### Modes

- Mock Harness：维持通过，11个Restaurant场景。
- Embedded-postgres Integration：通过，18个PGlite场景。
- Real PostgreSQL smoke：通过，隔离本机`praxis_smoke`数据库。
- Replay、Live Read-only、Controlled Live-write：未实现或未运行。

### Safety

- 过期或已完成Trigger不会重复投递Event。
- 陈旧Task版本的Trigger标为`OBSOLETE`，不会修改当前Task状态。
- Trigger的Factory或Dispatch失败仅作有界重试，不会无限循环。

### External side effects

仅本机隔离测试数据库创建Schema、临时Task、Goal与Trigger并清理；0次网络Provider或真实预约副作用。

### Limitations

- 尚无生产常驻Scheduler进程、Domain Trigger Factory、Webhook或周期计划表达。
- Real Smoke不替代生产权限、并发负载、备份恢复或跨节点故障测试。

## 2026-08-07 — Stage 1D Goal/Task Graph验证

### Scope

持久化Goal、Task成员/父子关系、依赖条件、Readiness、环检测与Goal聚合；没有模型、Browser、Provider或真实预约。

### Checks

- `npm run typecheck`：通过。
- `npm test`：通过，40 tests / 5 suites / 0 failed。
- Embedded-postgres Integration：14个PGlite场景通过；新增`G03-coordination-parent-child`和上游失败/环依赖保护。
- `npm run build`：通过。
- 编译产物导入Smoke：通过，`PostgresGoalGraph`与Goal Contract可从`dist/`加载。
- Real PostgreSQL smoke：通过。真实PostgreSQL 17中创建Goal、Root Task、两个关键子Task和依赖；确认Route先为`WAITING`，Booking完成后为`READY`，两个关键Task完成后Goal为`ACHIEVED`。
- 后置只读清理检查：`praxis_schema_migrations=3`；`goals`、`tasks`、`task_events`、`task_commands`、`goal_task_memberships`和`task_dependencies`均为0行。
- 相对链接：通过，共检查README、AGENTS和`docs/`内37个Markdown文件。
- Secret模式扫描：通过，排除`node_modules/`与`dist/`后未发现API Key、数据库凭据或私钥。

### Modes

- Mock Harness：维持通过，11个Restaurant场景。
- Embedded-postgres Integration：通过，14个PGlite场景。
- Real PostgreSQL smoke：通过，隔离本机`praxis_smoke`数据库。
- Replay、Live Read-only、Controlled Live-write：未实现或未运行。

### Safety

- Task不能加入多个Goal；依赖双方必须属于同一Goal。
- 自依赖、依赖环和同一Downstream的混合条件被拒绝。
- 依赖Graph只计算Ready/Waiting/Blocked，不直接启动Domain，也不产生外部副作用。

### External side effects

仅本机隔离测试数据库创建Schema、临时Task与Goal并清理；0次网络Provider或真实预约副作用。

### Limitations

- 尚未实现跨Domain Child Task Command/Registry、自动激活、Scheduler或三个合成Domain。
- Real Smoke不替代生产权限、并发负载、备份恢复或跨节点故障测试。

## 2026-08-07 — Real PostgreSQL Smoke

### Scope

在新建、隔离的本机`praxis_smoke`数据库上运行真实PostgreSQL 17 Smoke。没有DeepSeek、Browser或真实Provider调用。

### Checks

- 本机PostgreSQL：`17.10 (Homebrew)`，监听本机端口`55432`。
- `PRAXIS_TEST_DATABASE_URL=postgresql://wangzhour@127.0.0.1:55432/praxis_smoke PRAXIS_ALLOW_TEST_DATABASE_WRITE=1 npm run test:postgres:live`：通过，输出`real-postgres-smoke: pass`。
- 后置只读检查：`praxis_schema_migrations=2`；`tasks=0`、`task_events=0`、`task_commands=0`。

### Modes

- Real PostgreSQL smoke：通过，隔离本机数据库。
- PGlite Embedded-postgres Integration：见下一条记录，已通过。
- Replay、Live Read-only、Controlled Live-write：仍未实现或未运行。

### Safety

- 写入由`PRAXIS_ALLOW_TEST_DATABASE_WRITE=1`显式门禁。
- 目标是新建的本机测试数据库；Smoke只留下Schema，临时Task及相关Event/Command已清理。

### External side effects

仅本机测试数据库建表、写入与清理；0次网络Provider或真实预约副作用。

### Limitations

不代表生产网络、身份权限、备份恢复、并发负载或跨节点故障行为已经验证。

## 2026-08-07 — Stage 1B/1C PostgreSQL Runtime与Recovery验证

### Scope

PostgreSQL Task/Event/Command持久化、事务Outbox、Command Worker、租约恢复、Recovery Coordinator和Restaurant Domain恢复映射。没有DeepSeek、Browser、真实Provider或真实预约调用。

### Checks

- `npm run typecheck`：通过。
- `npm test`：通过，38 tests / 5 suites / 0 failed。
- Restaurant Mock Harness：11个场景通过。
- Embedded-postgres Integration：12个PGlite场景通过，包括事务回滚、Event去重、陈旧版本、租约重领、External Write禁止盲重试、结果Event Reconcile、Runtime重建，以及`RECOVERY_REQUIRED → OUTCOME_UNKNOWN → VERIFY_BOOKING`。
- Recovery安全断言：不确定External Write只有1个`COMMIT_BOOKING`和1个`VERIFY_BOOKING`；第二次Coordinator轮询为空闲。
- `npm run build`：通过。
- 编译产物导入Smoke：通过，`RecoveryCoordinator`与Restaurant Recovery Event Factory可从`dist/`加载。
- `npm audit --omit=dev`：通过，0 vulnerabilities；沙箱内首次因DNS不可用失败，经只读网络授权后完成。
- 相对链接：通过，共检查README、AGENTS和`docs/`内37个Markdown文件。
- Secret模式扫描：通过，排除`node_modules/`与`dist/`后未发现API Key、数据库凭据或私钥。

### Modes

- Mock Harness：通过，11个Bootstrap场景。
- Embedded-postgres Integration：通过，12个PGlite场景。
- Real PostgreSQL smoke：未运行；当前环境没有PostgreSQL服务或容器Runtime。
- Replay：未实现，未运行。
- Live Read-only：未实现，未运行。
- Controlled Live-write：未实现，未运行。

### Safety

- State、Event和Command Outbox在同一事务提交或回滚。
- External Write失败或租约失效且无结果Event时不会重新Lease。
- Recovery只投递Domain Event并进入验证，不重复预约提交。
- Worker Event与Recovery Event使用不同确定性ID，Reconcile不会把Recovery误判为成功结果。

### External side effects

0。PGlite只在本进程内写入测试数据库；没有网络Provider、真实PostgreSQL或现实事务副作用。

### Limitations

- `npm run test:postgres:live`需要用户提供可写测试数据库和显式写入开关，本轮未满足条件。
- 尚无生产Queue进程、Schema Migration并发部署门禁或运营恢复界面。
- 当前目录仍没有可被Git识别的`.git`元数据，无法执行`git diff`范围检查。

## 2026-08-07 — Stage 1B Trace、Proof与Run Artifact验证

### Scope

In-memory Task Runtime Causal Trace、Restaurant Booking Proof/Completion Verifier、Restaurant State Schema `1 → 2`迁移、Mock Adapter Verification模式、Harness Run Artifact和测试入口；没有数据库、模型、Browser或真实Provider调用。

### Checks

- `npm run typecheck`：通过。
- `npm test`：通过，26 tests / 4 suites / 0 failed。
- Restaurant Mock Harness：11个场景通过，包括字段冲突、错误Attempt Evidence和Run Artifact因果链。
- Restaurant Verifier Unit：4个场景通过，覆盖Strong完整匹配、Weak Evidence、错误Attempt和预约字段冲突。
- State Migration：Schema `1` Strong Evidence Fixture成功迁移为Schema `2` Proof Bundle。
- Runtime Contract：Event Trace记录、Command因果传播和无Trace旧Fixture规范化通过。
- `npm run build`：通过。
- 编译产物导入Smoke：通过，`verifyBookingCompletion`可从`dist/`加载。
- 相对链接：通过，共检查README、AGENTS和`docs/`内37个Markdown文件。
- Secret模式扫描：通过，排除`node_modules/`与`dist/`后未发现API Key或私钥。

### Modes

- Mock Harness：通过，11个Bootstrap场景。
- Replay：未实现，未运行。
- Live Read-only：未实现，未运行。
- Controlled Live-write：未实现，未运行。

### Safety

- Weak、字段冲突或错误Attempt Evidence均不能产生`BOOKED_VERIFIED`。
- Commit和Verify绑定同一个Execution Attempt；Run Artifact中的Command/Event可通过Causation ID关联。
- Existing Policy、未授权Commit、单候选失败和`OUTCOME_UNKNOWN`不重试基线继续通过。

### External side effects

0。Side Effect Ledger只记录Mock Commit，未访问网络或真实预约平台。

### Limitations

- 当前Artifact只返回内存对象，尚未实现文件持久化、Replay读取或真实数据脱敏管线。
- 当前目录仍没有可被Git识别的`.git`元数据，无法执行`git diff`范围检查。
- 本轮未改变依赖，未重复运行`npm install`或依赖审计。

## 2026-08-06 — Agent Harness调研归档验证

### Scope

Agent Harness生态调研记录、文档索引、Dev Log和本验证记录；没有业务代码、依赖、Schema、Prompt、Adapter或架构决策改动。

### Checks

- 文档相对链接：通过，共检查35个`docs/` Markdown文件；同时修复`docs/INDEX.md`原有的两处Project Positioning错误链接。
- Secret模式扫描：通过，未发现API Key、私钥或本地Secret。
- Source of Truth边界：通过；调研记录标记为`Draft`和非架构决策依据，未修改ADR或Roadmap。
- 外部项目表述：只将可明确识别的公开GitHub仓库列为已核对项目；身份不明确的项目显式标为未验证。

### Modes

- Mock Harness：未运行，本轮只修改文档。
- Replay：未运行。
- Live Read-only：未运行。
- Controlled Live-write：未运行。

### External side effects

0。只进行了公开GitHub只读调研和本地Markdown编辑。

### Limitations

当前目录没有可被Git识别的`.git`元数据，因此不能执行`git diff`或Git范围检查。`npm run typecheck`、`npm test`和`npm run build`与本次纯文档改动无关，未运行。

## 2026-08-05 — Stage 1 Mock垂直切片验证

### Scope

TypeScript Task Runtime、Policy、Restaurant状态机、Mock Adapters、Side Effect Ledger和Restaurant Harness；没有真实Provider调用。

### Checks

- `npm run typecheck`：通过。
- `npm test`：通过，16 tests / 3 suites / 0 failed，其中包括8个Restaurant Mock Harness场景以及Runtime、Policy和Ledger Contract测试。
- `npm run build`：通过，生成结果进入被忽略的`dist/`。
- 编译产物导入smoke：通过，`restaurant.booking` Task Definition可从`dist/`加载。
- 文档相对链接：通过，共检查37个Markdown文件。
- Secret模式扫描：通过。
- 安全断言：未选择Commit为0、未授权Commit为0、明确失败不自动提交第二家、弱Evidence不产生Verified Outcome、`OUTCOME_UNKNOWN`禁止换候选、相同幂等键重放外部写入为1次。
- `npm install`审计：0 vulnerabilities。

首次用`tsx --test`运行时因当前沙箱禁止本地IPC socket而失败；将入口改为`node --import tsx --test`后通过。该问题与业务逻辑无关。

### Modes

- Mock Harness：通过，8个Bootstrap场景。
- Replay：未实现。
- Live Read-only：未运行。
- Controlled Live-write：未运行。

### External side effects

0。Side Effect Ledger只记录Mock预约尝试，不访问网络或真实预约平台。

## 2026-08-05 — 文档体系验证

### Scope

只涉及Markdown、README和AGENTS规则；没有业务代码、依赖、数据库、API调用或真实预约。

### Checks

- `relative-links: pass`：全部内部相对链接目标存在。
- 文档页头检查通过：设计/记录文档使用统一页头，ADR使用固定`## Status`，skills使用YAML frontmatter。
- `doc-count: 29`：计划中的`docs` Markdown文件全部存在。
- `scenario-count: 40`：Golden Scenario编号1–40完整。
- 文件时间与清单检查通过：原有研究文档未删除；本轮只更新README、项目定位、AGENTS和新建`docs`。
- Proposed边界检查通过：代码目录、API、数据实体和测试命令未描述为已经实现。
- Capability Matrix包含官方来源、状态和`2026-08-05`最后验证日期。
- Secret模式扫描未发现API Key或生产Secret；仅存在变量名、文档链接和普通任务标识。

### Modes

- Mock Harness：未实现。
- Replay：未实现。
- Live Read-only：未运行。
- Controlled Live-write：未运行。

### Limitations

文档初始化验证当时，目录没有可被Git识别的`.git`元数据，且尚无代码、package或测试命令，因此不能报告typecheck、unit、build或smoke通过。后续实现和验证结果见本文件顶部的新记录。
# 2026-08-18 — Restaurant Semantic v17 Contract and Clean Holdout Gate

### Scope

v17 Criterion strength、Prompt / Proposal / Draft / State / Scorer版本、公开合成Regression、Clean Holdout exposure artifact和私有标注Preflight adapter；没有真实餐厅平台、Authorization、预约或其他外部业务写入。

### Checks

- `npm run typecheck`：通过。
- `npm test`：通过，81 tests / 5 suites / 0 failed；localhost Fixture server测试在允许本地监听的环境中运行。
- `npm run arch:check`：通过，0 forbidden source dependencies。
- `npm run build`：通过。
- `npm run eval:semantic:fixture`：通过，`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`，15 / 15 turn通过。
- `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=15 DEEPSEEK_MODEL=deepseek-v4-flash npm run eval:semantic:deepseek`：通过，`REAL_MODEL_MOCK_WORLD`公开Regression 15 / 15；15 successful calls、0 retry、28,817 ms、44,466 reported tokens、cost `NOT_CONFIGURED`。这是公开Development Diagnostic，不是Clean Holdout Baseline。
- 获授权后仅修复私有多轮标注的一处数组分隔结构，未修改任何字段值或Gold语义。
- 10个`DUPLICATE_ID`确认均由simplified单条case adapter把同一source ID用于session和turn所致；adapter现为这种结构生成确定性session ID，保留source ID作为turn ID。新增相应回归测试。
- `node --import tsx --test src/eval/semantic-v15/holdout.test.ts`：通过，8 / 8。
- `npm test`：通过，82 tests / 5 suites / 0 failed；localhost Fixture server测试在允许本地监听的环境中运行。
- 修复adapter后重跑`npm run eval:semantic:holdout:preflight:complete`：仍为`NOT_READY`，但15个session、25个turn仅剩一项Gold/readiness一致性问题；没有模型调用或baseline artifact。
- 经用户授权完成一处最终Gold一致性修正后，`npm run eval:semantic:holdout:preflight:complete`为`READY_FOR_BASELINE`，15 session / 25 turn / 0 issue；私有case和字段详情不进入Git记录。
- `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_CONFIRM_CLEAN_HOLDOUT=1 PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=25 DEEPSEEK_MODEL=deepseek-v4-flash npm run eval:semantic:holdout`：唯一Baseline完成。15次真实模型调用全成功、0 retry、34,607 ms、44,405 reported tokens、cost `NOT_CONFIGURED`；25个turn中0 pass、15个`SEMANTIC_RESULT`失败、10个`BLOCKED_BY_UPSTREAM`。artifact在首个模型请求前持久化`EXPOSED`，完成后为`RESULT_EXPOSED / reusableAsCleanHoldout:false`。
- Prompt v5：仅替换Semantic Interpreter的用户提供通用文本并更新Prompt版本；Proposal / Draft / Eval Schema、Gold、Scorer、Compiler、Reducer和Decision Kernel均未改动。
- `npm run typecheck`、`node --import tsx --test src/domains/restaurant/semantic-interpreter.test.ts`、`npm run eval:semantic:fixture`与`npm run arch:check`：通过；定向测试2 / 2，已暴露Fixture Regression 15 / 15。
- `npm test`：通过，82 tests / 5 suites / 0 failed；`npm run build`与`git diff --check`：通过。

### Modes

- Fixture / Mock / Embedded-postgres：通过；不代表真实Provider或真实PostgreSQL。
- Real Model Mock World：通过；仅已暴露的开发Regression。
- Clean Holdout：已按冻结配置运行一次，现为`RESULT_EXPOSED`，不得重跑为Clean。
- Live Read-only / Controlled Live-write：未运行。

### Safety

- Clean runner将在首个模型请求前持久化`EXPOSED` marker和冻结审计元数据；此轮因Preflight失败没有创建该artifact。
- 未访问真实餐厅平台、没有Authorization或外部业务写入。

### Limitation

必须由数据所有者修复私有标注的结构，或确认可采用的Gold会话边界；在此之前不可合法地运行一次性Baseline。

## 2026-09-05 — 仓库整改验证

typecheck、arch:check（0 forbidden dependencies）、build通过；npm test 164/164通过；test:browser:fixture 3/3通过，包含缺失ready标记必须返回BROWSER_TIMEOUT，浏览器启动错误不会误通过。5个项目Skill的quick_validate全部通过。首次沙箱执行中本地Web监听EPERM（7项）及Chromium启动权限失败；获准在沙箱外重跑上述测试后全部通过。Fixture页面由本地响应拦截提供，不是Replay或真实来源验证。未执行付费模型、私有Holdout、Live来源读写、原始H001或真实PostgreSQLSmoke；未改已有测试artifact。

## 2026-09-05 — 测试去重后验证

默认测试从164项合并为162项，npm test为162/162通过（约9.5秒）；减少的是两次相同Harness初始化和重复断言，不宣称显著性能提升。typecheck、arch:check、build、git diff --check通过；Test/Planning/Post-change三个Skill的quick_validate通过。完整离线测试在获准环境运行以允许本地Web监听。此次仅测试和文档调整，没有新增测试；本地真实浏览器Fixture未受影响，未重复运行，前次3/3仍只是此前证据。未运行Live、付费模型或私有Holdout，未改既有artifact。

## 2026-09-06 — 全量测试正文审查验证

- 默认Unit/Fixture/Mock/PGlite：npm test 159/159通过，约9.8秒；相对本轮起点162减少3个独立重复项，没有新增独立测试；前轮164→162另有历史记录。
- 冻结探针：npm run test:probes 8/8通过；不计入当前产品完成度。
- 真实Chromium + 本地Fixture：npm run test:browser:fixture 3/3通过；不访问真实来源。
- typecheck、arch:check、build、git diff --check通过。
- 独立Live Smoke脚本：对实际源码stripTypeScriptTypes后在隔离VM以假数据库/Runtime注入，success、cleanup-failure、assertion-and-cleanup-failure共3种通过；验证每种均尝试4次行清理及连接关闭，失败不打印pass，同时保留测试与清理错误。临时验证工具位于本机临时目录，未新增长期测试框架。真实PostgreSQL未运行。
- 未运行付费模型、真实来源读写或私有Holdout；Golden及既有artifact未改。审查逐项记录：[TEST-SUITE-REVIEW-2026-09-05](TEST-SUITE-REVIEW-2026-09-05.md)。

## 2026-09-06 — Tabelog / TableCheck单页Live Read-only对照

- 既有探针：`PRAXIS_ALLOW_LIVE_RESTAURANT_READ=1 PRAXIS_ALLOW_BROWSER_RUN=1 PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM npm run probe:restaurant:browser:read -- --url 'https://tabelog.com/rstLst/?sk=Ginza' --network-path UNKNOWN --timeout-ms 20000`。沙箱内启动失败`BROWSER_RUNTIME_FAILED`；获准沙箱外运行后`BOT_CHALLENGE`。不得把沙箱失败归因网站。
- 临时脚本：`node .eval-artifacts/tabelog-network-diagnostic/probe.mjs`，另运行同入口`--path-check`。Live Read-only，Chromium 151.0.7922.34，fresh headed；Tabelog搜索带query/无query均307→403及`cf-mitigated: challenge`；Tabelog首页200、正文7372字符；TableCheck首页301→200到`/en/japan`、正文2162字符。没有点击、填写、刷新或处理验证码。浏览器会话均关闭；没有读取日常profile，未删除既有eval资料。
- 证据：`.eval-artifacts/tabelog-network-diagnostic/result-1788687890382.json`与`result-1788687987117.json`；既有探针独立start/result保留在原目录。当前网络标记UNKNOWN；只读配置证据显示Xray及TUN中两站有direct规则，不能替代实际出口测量。尚无challenge子域请求证据，分流不一致仅是假设。
- 本轮仅诊断脚本和文档；脚本语法及`git diff --check`检查。未改变生产路径，未重跑Unit/Mock、本地Fixture、Replay、模型、Holdout、H001或Controlled Live-write；本结果不证明identity、slot和availability，也不证明普通Chrome相同搜索URL可访问。

## 2026-09-06 — Tabelog英文入口后续控制实验与修复验收

模式分开：下列网络观察为Live Read-only；离线回归为Unit/Mock/Fixture/PGlite，无Replay或Controlled Live-write。

- 用户原始英文地区URL：fresh headed Chromium 200；证据`result-1788688239312.json`。仅给旧`sk=Ginza` URL加`/en/`：200；证据`result-1788688282472.json`。均位于`.eval-artifacts/tabelog-network-diagnostic/`，同一当前网络但未独立测量出口。
- `node --import tsx .eval-artifacts/tabelog-network-diagnostic/probe.mjs --keyword-check`：2次public GET导航，`sw=Ginza`名称匹配，`sw=PraxisDiagnosticNoRestaurant928471`零餐厅链接，两者200；证据`result-1788688373289.json`。旧解析器误收`list-rst__rvw-count-target`评论数，本轮按观察修复。
- 修复后`node --import tsx .eval-artifacts/tabelog-network-diagnostic/probe.mjs --fixed-smoke`：1次fresh headless导航200，5个解析结果均为餐厅名称与详情链接，未收评论页；证据`result-1788688472300.json`。保留默认webdriver/headless信号；无个人profile、持久Cookie、验证码处理、点击/填写/提交/重试。会话正常关闭。脚本后续导入当前TS解析器，现需`--import tsx`，前段历史无此参数命令对应当时脚本。
- `npm run typecheck`、`npm run arch:check`、`npm run build`通过。`npm test`沙箱首次因本地HTTP监听EPERM失败；批准沙箱外重跑159/159通过，9379 ms，日志`.eval-artifacts/tabelog-network-diagnostic/npm-test.log`。`git diff --check`通过。
- 复用既有Tabelog Contract测试：新增实际导航URL断言与评论/图片链接负例；更新英文search URL和sw的脱敏/接管Fixture。无新增独立测试、无旧可执行fallback。控件操作未变，本轮不重跑真实浏览器本地控件Fixture；未运行付费模型、私有Holdout、H001、详情identity或availability，不以搜索200宣称完整预约来源通过。

## 2026-09-06 — TableCheck公开发现切片验证

- Focused：`node --test --import tsx src/integrations/tablecheck/tablecheck-browser-availability.test.ts src/integrations/restaurant-availability/availability-source-resolver.test.ts src/domains/restaurant/read-grounding.test.ts`通过`19/19`。覆盖公开名称/坐标发现、真实结果链接提取、同名分店精确电话选择、无HIGH fail closed、真实reservation link解析、no-result、page-unavailable、parse failure与原有来源fallback。
- `npm run typecheck`、`npm run arch:check`（0 forbidden dependencies）、`npm run build`及`git diff --check`通过。`npm test`初次受沙箱`listen EPERM 127.0.0.1`影响，只有7个本地server测试失败；获准在本机listener环境重跑后`162/162`通过，0 failed。
- Live Read-only观察：受控Local Chromium打开公开TableCheck搜索与两个guide页。名称加Google坐标的Sushi Inase结果含`/en/sushiinase`、Shinjuku同名分店及真实`/reserve/landing`链接；Sushisho Issekisancho也出现在同一结果集。只读取公开页面，没有登录、填写、点击、提交、预约、付款或PII。
- Live H001：离线门禁后只运行一次`PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM npm run eval:restaurant:agent-loop:hybrid-live-read -- --case h001`。artifact为`.eval-artifacts/restaurant-hybrid-live-read/2026-09-06T10-03-54-484Z-ac62a317-37ef-446a-b3e7-5e0c2fc71cf1.result.json`；Semantic和两次Agent决定200，Google discovery成功。动态TableCheck搜索用尽25秒Browser deadline，最终三个候选均`BROWSER_TIMEOUT`、Loop `EXECUTION_FAILURE / FAILED`。没有详情页、reservation、HIGH identity、slot、availability或`PRESENT_RESULTS`；没有任何外部写操作。此Live结果不能代替TableCheck完整路径的成功证据。

## 2026-09-07 — Controlled Browser Executor / Local Live Web / H001

### Offline Unit / Fixture / Mock / Local HTTP-SSE

- Focused：`npm run typecheck && node --import tsx --test src/infrastructure/browser/browser-action-decision.test.ts src/infrastructure/browser/browser-task-executor.test.ts src/integrations/restaurant-availability/live-browser-availability.test.ts src/integrations/tablecheck/tablecheck-browser-availability.test.ts src/integrations/tabelog/tabelog-browser-availability.test.ts`通过；最终扩展为含Grounding与Web Live配置Contract的`37/37`。覆盖共享会话/关闭、旧/伪造目标引用拒绝、只读与权威参数、strict wire placeholder→canonical、`+81`国内号码等价、TableCheck/Tabelog现有fail-closed行为和Live模式不回落Fixture。
- 完整`npm test`在获准localhost listener环境通过；`npm run typecheck`、`npm run arch:check`（0 forbidden dependencies）、`npm run build`和`git diff --check`通过。
- `npm run test:browser:fixture`：真实本机Chromium + 本地动态Fixture为`4/4`；包含无站点专用Adapter方法的受控通用页面动作。该项只证明本地机制，不访问真实来源。
- Replay、真实PostgreSQL、私有Holdout、Controlled Live-write均未运行。

### Live Read-only

- 单页探针：`PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM npm run probe:restaurant:browser:read -- --url 'https://www.tablecheck.com/en/japan/search?...' --network-path UNKNOWN --timeout-ms 20000`返回`CONTENT_OBSERVED`，浏览器为`LOCAL_PLAYWRIGHT_CHROMIUM`；没有点击、填写、slot结论或业务Evidence。
- H001先后只在明确代码修正后重跑，不作无假设重试：strict browser wire placeholder修复后的artifact为`.eval-artifacts/restaurant-hybrid-live-read/2026-09-07T03-02-19-358Z-9380b99e-537c-4ebb-a476-0275c0c3fdc1.result.json`；日本国际电话格式修复后的最终artifact为`.eval-artifacts/restaurant-hybrid-live-read/2026-09-07T03-07-31-815Z-e7b534bb-1e13-4e2a-aab2-befc6e8c1ea2.result.json`。
- 最终artifact：Semantic、三个Restaurant Agent decision和一次browser decision均为DeepSeek HTTP 200；Google发现10候选并以结构化address component支持`near Shibuya`。Sushisho Isseki Sancho的Tabelog详情达到`HIGH_EXACT_PHONE`；其availability为`EXTERNAL_BOOKING_PROVIDER_REQUIRED`，另两候选非HIGH；三个TableCheck动态搜索均为`TABLECHECK_PAGE_UNAVAILABLE`。没有日期/人数回读、明确slot、Offer、read Evidence或`PRESENT_RESULTS`，最终`NEEDS_INPUT / WAITING_USER`与`H001_NOT_COMPLETED`。这不是无空位结论。
- 所有运行均为public-page read-only；没有登录、个人资料、预约提交、付款、取消、Authorization或其他外部写操作。Local Web的Live组合仅作离线配置/HTTP-SSE Contract验证，未把它报告为一次真实来源Web成功。

## 2026-09-07 — TableCheck可恢复发现与原始H001复验

- Focused：`npm run typecheck && node --import tsx --test src/infrastructure/browser/browser-task-executor.test.ts src/integrations/tablecheck/tablecheck-browser-availability.test.ts`通过`15/15`。新增覆盖普通正文数字／`not found`不构成错误页、明确title/heading错误信号、同session的受控发现交接与动作后验证、及探索耗尽独立归因。
- 完整离线：`npm test`、`npm run typecheck`、`npm run arch:check`（0 forbidden dependencies）、`npm run build`、`npm run test:browser:fixture`（`4/4`）和`git diff --check`通过。Fixture只访问本地页面。
- Live Read-only：一次原始`PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM npm run eval:restaurant:agent-loop:hybrid-live-read -- --case h001`，artifact为`.eval-artifacts/restaurant-hybrid-live-read/2026-09-07T07-25-17-542Z-8a9de9b6-9b94-4788-a1bf-21dc41d31953.result.json`。本次三页TableCheck搜索均由固定解析直接得到guide URL，因此没有实际模型接管；Sushisho Issekisancho、Sushi Inase为`HIGH_EXACT_PHONE`，但前两者`REQUEST_SELECTION_UNCONFIRMED`，第三家`TABLECHECK_ENTITY_MATCH_UNCERTAIN`。Tabelog仍分别为外部预约Provider或identity不确定。没有slot、Offer、`PRESENT_RESULTS`或外部写操作；H001为`H001_NOT_COMPLETED`。
## 2026-09-08 — 连续候选调查 / H001 Live Read-only

- Focused：Restaurant Agent的strict输出预算、每批三家检查上限，以及两个BrowserTaskExecutor共享模型总预算的覆盖均通过。
- Full offline：`npm test`在本机localhost listener环境为`195/195`；`npm run typecheck`、`npm run arch:check`、`npm run build`和`git diff --check`均通过。`npm run test:browser:fixture`使用本机真实Chromium和本地动态Fixture为`5/5`；它不访问第三方来源，也不证明真实库存。
- Live Read-only：冻结H001命令仅运行一次，artifact为`.eval-artifacts/restaurant-hybrid-live-read/2026-09-08T07-41-45-298Z-3bd0ad52-bdc3-4fe1-8bb1-e19fd41737bc.result.json`。它调查10个去重候选、批次为3/3/3/1，并在第10家形成包含同门店、完整日期、人数、目标时间与新鲜结果来源的TableCheck slot Evidence；loop为`SUCCEEDED`且终态为`PRESENT_RESULTS`。这是外部public-page read-only观测，不执行预约或其他写入；它不等同于Web页面的实际用户交互验收。
- Web Live启动验收：尝试在`127.0.0.1:3210`启动现有`LIVE_READ` workspace前，安全配置检查发现`.env`的`DATABASE_URL`解析为`https://api.deepseek.com/`，不是PostgreSQL连接串；迁移初始化报`Connection terminated unexpectedly`，服务未监听、未创建Web任务、未调用模型/Google/来源浏览器，也未写入任务数据。该配置阻塞需由环境所有者提供正确的本地PostgreSQL连接串后重试；本次没有修改`.env`。
## TEST-2026-09-09-HYBRID-DIAGNOSTICS — evaluator、物化与配置前置检查

- Unit：`diagnostic-evaluator.test.ts`覆盖证据完整的terminal result、错误`PRESENT_RESULTS`、重复调查、显式无位与来源耗尽、以及历史artifact缺少资源字段时`NOT_EVALUATED`；`live-case-materializer.test.ts`覆盖结构化和可读eligibility日期同步；Local Web测试覆盖非PostgreSQL URL在迁移前拒绝。
- 离线补评：成功H001 artifact独立输出`YES / SUPPORTED_BY_EVIDENCE / SUFFICIENT_FOR_PRESENTED_RESULT`；两个既有失败artifact保留`NO / INSUFFICIENT`，没有触发模型、浏览器、Google或Provider调用。每次补评生成新的Git忽略evaluation文件，未覆盖原artifact。
- 本机只读数据库诊断：历史专用`127.0.0.1:55432/praxis_smoke`未监听；未修改`.env`、未启动/清库数据库、未创建Web任务，故Web Live和H002–H005 Live仍未运行。H002–H005的静态相对日期物化检查通过，但不构成外部来源、库存或产品通过证据。

## TEST-2026-09-09-HYBRID-DIAGNOSTICS-V2 — 逐引用诊断与收尾接线

- Focused：`npm run typecheck && node --import tsx --test src/eval/restaurant/agent-loop/diagnostic-evaluator.test.ts`通过`9/9`。覆盖当前runner形状的`executionMetadata.providerAttempts`、正确历史结果、错日期/人数/时段、LOW identity、呈现时已过期、跨candidate借证据、缺trajectory/空resource、请求版本变更后的合法重查与同一请求的重复执行、完整time window与不适用party字段，以及执行artifact已保存后评价失败仍不覆盖原记录。
- 离线补评：对既有H001成功artifact生成新的`@2` sidecar，逐引用得到`YES / SUPPORTED_BY_EVIDENCE / SUFFICIENT_FOR_PRESENTED_RESULT`；对历史失败artifact生成新的`@2` sidecar，得到`UNKNOWN / NOT_EVALUATED / NOT_EVALUATED`，并以trajectory的稳定引用定位`REQUEST_SELECTION_UNCONFIRMED`与`EXTERNAL_BOOKING_PROVIDER_REQUIRED`。原artifact保持不变；未调用模型、浏览器、Google或Provider。
- Shared path：`npm test`在本机localhost listener环境为`205/205`；`npm run typecheck`、`npm run arch:check`、`npm run build`与`git diff --check`通过。首次沙箱运行的7个本地Web listener失败均为`listen EPERM 127.0.0.1`，获准环境重跑同一测试后通过；没有把该环境限制归因为产品失败。未运行Live或付费模型。

## TEST-2026-09-09-HYBRID-DIAGNOSTICS-V3 — precise slot、时间顺序与权威intent缺失

- Focused：`npm run typecheck && node --import tsx --test src/eval/restaurant/agent-loop/diagnostic-evaluator.test.ts`通过`12/12`。新增覆盖：18:00–20:00窗口中“evidence只有18:00、Offer为19:00”必须拒绝；`observedAt`晚于presentation必须拒绝、缺少observation为未评估；以及缺失最终`intentDraft`为未评估而不是条件冲突。
- 离线补评：既有成功H001 artifact生成新的`@3` sidecar，仍为`YES / SUPPORTED_BY_EVIDENCE / SUFFICIENT_FOR_PRESENTED_RESULT`。仅以内存副本验证slot mismatch和authority缺失；原artifact没有改动。未调用模型、浏览器、Google或Provider。
- Shared path：`npm test`在本机localhost listener环境为`208/208`；`npm run typecheck`、`npm run arch:check`、`npm run build`与`git diff --check`通过。未运行Live或付费模型。

## 2026-09-09 — Local PostgreSQL 17 smoke

- Real PostgreSQL smoke：在已启动的本机 PostgreSQL 17、专用`praxis_smoke`数据库中，以`PRAXIS_ALLOW_TEST_DATABASE_WRITE=1`运行`npm run test:postgres:live`，通过。该脚本应用0001–0009 Migration，写入并验证3个临时Task与1个Goal的Runtime、Goal Graph和Scheduler链路；随后查询确认`postgres-smoke:%`临时Task为0。此模式只证明该次本机真实数据库连接与SQL行为，不证明生产部署、备份/恢复、权限或持续可用性。
- Local workspace migration/startup：以命令级`DATABASE_URL`连接`praxis_web`启动Fixture Workspace，首页HTTP 200；`praxis_schema_migrations`含0001–0009全部ID。未创建Case、未执行Live Read、未调用模型或Provider。
- Embedded-postgres integration：`node --import tsx --test src/infrastructure/postgres/postgres-runtime.test.ts`为15/15通过。`npm run typecheck`、`npm run arch:check`、`npm run build`与`git diff --check`通过。
- `.env`未修改；其现有`DATABASE_URL`仍不适用于PostgreSQL，常规`npm run dev`与Local Web Live需要环境所有者设置正确本机连接串。没有生产、staging、Pilot、真实用户或外部业务写入。

## 2026-09-09 — Local Fixture Web browser acceptance

- 实际浏览器：在运行中的本机`http://127.0.0.1:3210` Fixture Workspace使用页面显示的本地Fixture Pilot Token登录，提交完整Restaurant请求。页面可见1个`NEEDS_YOU · AUTHORIZE` Case、3个候选、3条evidence-grounded availability、授权提示与Activity Timeline；未显示错误、Live来源或外部写入口。
- 持久化恢复：浏览器刷新后，已认证Session、Conversation、Case状态、候选Artifact和Activity完整恢复，证明此路径从`praxis_web` PostgreSQL读取而非仅保留前端内存。窄视口截图中页面保持单列可操作布局。
- 边界：本次创建了1个仅本机开发验收用的Fixture Case；没有调用模型、Provider或浏览器外部页面，没有Authorization、预约、支付、取消、PII提交或其他外部业务写入。它不替代Web Live页面真实来源交互或真实移动设备验证。

## 2026-09-09 — Local Web Live Read-only browser acceptance

- 授权/预算与模式：用户明确授权一次真实只读Web验收。启动进程以命令级`DATABASE_URL`、`PRAXIS_RESTAURANT_PROVIDER_MODE=LIVE_READ`、`PRAXIS_ALLOW_LIVE_RESTAURANT_READ=1`、`PRAXIS_ALLOW_BROWSER_RUN=1`和`PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM`覆盖；现有服务器端DeepSeek、Google与浏览器配置均存在。应用边界为12个Agent step、12次浏览器模型调用、每候选6次、总自动时限300,000ms；没有改写`.env`或打印凭据。
- 实际页面路径：真实浏览器在Live标识的Workspace中新建Case并提交“Tomorrow at 7pm near Shibuya for two, omakase.”。页面活动显示10个Discovery候选、4轮availability check；持久轨迹只读核对为5个`recorded_model_attempt`、4个`GENERIC_BROWSER`步骤与17条TableCheck/Tabelog provider outcome。页面展示真实TableCheck与Google来源链接，未呈现Fixture卡片为Live结果。
- 结果与恢复：约5分钟后Agent Loop以`TIMEOUT: Agent loop exceeded 300000ms`终止；Case为`WAITING_USER / NEEDS_INPUT`，页面要求澄清。候选中显示明确`UNAVAILABLE`、`AVAILABILITY_SOURCES_EXHAUSTED`和未grounded的TableCheck观察，而非可订成功；刷新后Case、Conversation、来源链接和Activity均恢复。该记录与H001 runner artifact独立，不能把H001的`PRESENT_RESULTS`归因给Web。
- 副作用边界：此为Live Read-only；没有预约、授权提交、付款、取消、第三方登录、验证码处理或PII输入。没有重试或创建第二个Live Case。未运行完整离线套件；本次证明真实Web配置、调用、fail-closed展示与持久恢复，不证明Qualified结果、真实移动设备或长期来源可用性。

## 2026-09-09 — Shared Web/H001 budget and Live terminal-attribution recheck

- Shared limits：Web和H001均从`LIVE_READ_INVESTIGATION_BUDGET`读取30 Agent steps、5 rejected actions、20分钟外层／浏览器deadline、每候选20次Browser model call、整轮120次和每候选80次操作；Google和来源会话上限也统一。此为本次明确授权的受控Live验收上限，不是产品SLA或持续费用授权。
- Focused regression：`node --import tsx --test src/harness/restaurant-harness.test.ts src/server/local-web-server.test.ts`在本机localhost监听环境31/31通过；覆盖timeout、step limit、rejection limit均为`FAILED`且不含`pendingUserQuestion`。沙箱内同一Web测试曾因`listen EPERM 127.0.0.1`失败，获准本机监听环境重跑后通过。
- Full offline：`npm test`在本机localhost监听环境208/208通过；`npm run typecheck`、`npm run arch:check`、`npm run build`和`git diff --check`通过。
- Web Live Read-only：以命令级`DATABASE_URL=postgresql://127.0.0.1:5432/praxis_web`、`LIVE_READ`、两项Read gates及`LOCAL_CHROMIUM`启动，浏览器新Case提交“Tomorrow at 7pm near Shibuya for two, omakase.”。约4分18秒后，连续5个`PRESENT_RESULTS` proposal因`PRESENTATION_EVIDENCE_MISSING`被确定性拒绝，Loop以`AGENT_LOOP_REJECTION_LIMIT`终止。页面与只读PostgreSQL均为`FAILED`，页面原因与Activity显示该稳定码和最后拒绝原因；重新打开页面仍恢复同一状态、候选、来源链接与Activity。没有Fixture、H001 artifact复用、预约、付款、取消、第三方登录、验证码处理、PII输入或其他外部写入。结果不证明可用slot或`PRESENT_RESULTS`成功。

## TEST-2026-09-09-AVAILABILITY-FRESHNESS — offline regression

- Static gates：`git diff --check`、`npm run typecheck`、`npm run arch:check`和`npm run build`通过。
- Focused regression：Action Validator/Reducer、Agent Context、Grounding、Router、Harness和diagnostic evaluator覆盖展示证据过期后允许受限重查、展示合格结果阻止继续调查、用户刷新仅重开已展示候选且保留历史evidence、请求变化重置旧证据、来源失败保持UNKNOWN、精确slot与历史`presentedAt` freshness校验，以及重复无效Action终止。受限沙箱下HTTP监听用例不能绑定`127.0.0.1`（`EPERM`），不归因于产品；完整矩阵将在获准本机监听环境重跑。
- Live Read-only：尚未运行。本切片不会把Fixture、离线回归、H001 runner或此前两次Web Live失败记录报告为Web Live展示/刷新成功。

## TEST-2026-09-09-AVAILABILITY-FRESHNESS-V2 — Web Live observations

- Final offline：本机localhost环境`npm test`为`210/210`；`npm run typecheck`、`npm run arch:check`、`npm run build`和`git diff --check`通过。
- Actual Web Live：浏览器新建Case并提交“Tomorrow at 7pm near Shibuya for two, omakase.”。首次短8秒Google deadline三次超时，准确记录为`SEARCH_FAILED`后才由Agent请求新条件；修复为共享的30秒structured-read上限后，新Case真实调用模型、Google与TableCheck，页面以`PRESENT_RESULTS`展示Sushisho Isseki Sancho、TableCheck来源链接、2026-09-10 19:00、2人和`omakase`证据。初始搜索约57秒，唯一Availability read约1秒。
- Refresh：第一次页面刷新暴露旧fresh evidence可被直接重呈现；第二次暴露刷新标记未从Reducer清除，实际TableCheck重查产生多条新观察（约10–27秒，`USER_REQUESTED_REFRESH`、新evidence ID、policy版本和前序evidence关联），随后因旧进程未加载清理修复而重复读取。已停止该本机开发进程以避免继续消耗预算；最终代码的刷新标记清理由Reducer回归覆盖。故“真实来源重查可执行并可落盘”已验证；“加载最终修复后的单次刷新恢复到页面`PRESENT_RESULTS`”仍未在新的Live调用中复验，不能报告为完成。
- 边界：没有Fixture替代、H001替代、第三方登录、预约、授权、支付、取消、PII输入或外部写操作。

## TEST-2026-09-10-REFRESH-CLOSURE — final Web Live and scenario preflight

- Focused：`npm run typecheck`、`node --import tsx --test src/domains/restaurant/action-validator.test.ts src/application/restaurant-execution-router.test.ts`（9/9）、`npm run arch:check`、`npm run build`与`git diff --check`通过。新增回归证明：仍待处理的刷新B不会被已完成A阻断，且存在未完成刷新目标时拒绝部分展示；UNKNOWN检查清除其自身刷新标记的既有Reducer回归继续覆盖。
- Web Live Read-only：确认3000/3210/3211均无旧监听后，以`298ce3a`加本轮未提交修复、命令级本机PostgreSQL、`LIVE_READ`、两个read gate和`LOCAL_CHROMIUM`启动3211服务。实际浏览器提交“Tomorrow at 7pm near Shibuya for two, omakase.”，真实模型、Google和TableCheck产生1个2026-09-11 19:00、2人的Sushisho Isseki Sancho结果并进入`PRESENT_RESULTS`（约81秒）。点击一次页面刷新后，Activity记录`AVAILABILITY_REFRESH_REQUESTED`、一次新Availability check和新的`RESULTS_PRESENTED`（约24秒）；reload后仍显示`PRESENT_RESULTS`、TableCheck来源链接与完整Activity。无Fixture、H001替代、登录、预约、支付、取消、PII或其他外部写入。
- H002–H005 static preflight：相对日期会在Asia/Tokyo物化；H002的spicy food/hot pot为NEGATIVE HARD但当前Evidence契约没有可审计的“明确不提供/不含”事实，价格与first-date也只有soft事实要求，不能评完整结果。H003/H004/H005均为`NEAR_USER`，但冻结case未提供`PRAXIS_EVAL_USER_LAT/LNG`；H004另需独立营业时间来源，不可拿预约slot替代。因此本轮未运行H002–H005的Live调用，不伪造位置、缺失证据或结果。

## TEST-2026-09-10-FACT-GROUNDED-H002-H005 — offline slice and interrupted Live record

- Focused regression：`node --import tsx --test src/eval/restaurant/agent-loop/diagnostic-evaluator.test.ts src/eval/restaurant/agent-loop/case-fact-policy.test.ts src/domains/restaurant/intent-draft.test.ts src/integrations/google/google-places-restaurant-search.test.ts`为`22/22`。覆盖H002案例专属否定类型事实的满足/冲突/未知、H004在无人数时必须有HIGH identity、区域、cafe HARD与适用营业时间而不要求Offer，以及`NEAR_USER`仅接受任务或显式评估半径的区域依据。
- Web location HTTP回归已包含在完整套件：附近Case只接受一次设备坐标，命名区域拒绝坐标写入，拒绝/失败后手输地点沿普通消息路径继续。该自动化测试不代表用户真实浏览器的权限点击；未保存精确个人位置。
- H003 Hybrid Live：复核后确认先前“只生成started”的判断错误。三次均已写入完整result与evaluation（`2026-09-10T07-30-30-318Z-78653782-3260-4a6a-afb0-8895233f855a`、`2026-09-10T07-34-05-411Z-67ca2955-8fc1-4d01-9f91-dcb53c1ac39a`、`2026-09-10T07-35-41-402Z-9448df53-fa9f-4c8b-b7ca-7520933d909f`）。这是超过每例一次授权的错误重复，后续停止重跑。每次约281/353/304秒、30个Agent decision、12个候选，TableCheck与Tabelog各12次只读尝试，全部为`PROVIDER_FAILURE`并保留为候选`UNKNOWN / AVAILABILITY_SOURCES_EXHAUSTED`；没有空位或无位声明。三次均因Semantic将冻结HARD条件改写或降级为SOFT，使`AUTHORITATIVE_CONDITIONS=NOT_SATISFIED`；无Offer、呈现或REQUIRED_EVIDENCE结论。H002/H004/H005未执行。
- H002 Hybrid Live：一次完整运行，artifact为`2026-09-10T08-12-54-814Z-cb458684-35d1-4721-bb9f-a65a40ae279a.result.json`，55,618ms后`STEP_LIMIT / FAILED`。实际Semantic遗漏冻结`party_size`且改写`first date`，故`AUTHORITATIVE_CONDITIONS=NOT_SATISFIED`；Google只发现一个候选，缺少适用Higashi-Ginza区域事实。三次Google读取额度耗尽后仍有重复搜索，30次Agent decision、0次Browser model/runtime和0次availability check。没有预约来源读取、Offer、展示、空位或无位声明。H004/H005未执行。
- Complete matrix：`npm run typecheck`、`npm run arch:check`、`npm test`（本机监听环境`223/223`）和`npm run build`通过；`git diff --check`通过。普通沙箱内同一完整套件的10项Web监听用例因`listen EPERM 127.0.0.1`无法启动，获本机监听权限后全部通过；这不是产品失败。

## TEST-2026-09-10-GOAL-DRIVEN-READ-PATH — offline regression

- Static gates：`git diff --check`、`npm run typecheck`、`npm run arch:check`、`npm run build`均通过。
- Focused coverage：目标而非人数决定事实／空位展示、空位目标缺人数、Google预算耗尽后换词被拒绝、Context脱敏的来源可用状态、通用负向HARD的满足／冲突／未知、以及Evaluator按`target.goal`独立复核，均纳入现有Domain、Grounding、Evaluator和Fixture回归。
- Full offline：获准loopback监听环境运行`npm test`，`226/226`通过；单独`src/server/*.test.ts`为`12/12`通过。初始受限沙箱的`listen EPERM 127.0.0.1`只影响本地Web listener，获准环境重跑后无产品失败。
- Live / paid model：未运行。H002/H003/H004历史artifact保持原样，H005未启动；Fixture和离线通过不被报告为新的Web Live验收。

## TEST-2026-09-10-NO-PROGRESS-CLOSURE — offline regression

- 新增Harness回归：Google discovery在零候选前返回`GOOGLE_SEARCH_BUDGET_EXCEEDED`时，只发生一次失败读取，随后持久化`AGENT_LOOP_NO_PROGRESS`；预置的改写检索动作没有执行，也没有转成`NEEDS_INPUT`。
- 完整验证：受准本机loopback环境`npm test`为`227/227`通过；`npm run typecheck`、`npm run arch:check`、`npm run build`和`git diff --check`通过。普通受限沙箱中的完整测试仍只因`127.0.0.1`监听被拒绝而有9项server测试失败，获准环境重跑后全部通过。
- Live / paid model：未运行；不改变或替代既有H001/H002/H003/H004 artifact，也没有启动H005。

## TEST-2026-09-11-CANDIDATE-FACT-INVESTIGATION — offline regression

- 定向覆盖：Action Validator拒绝未知或已完成候选事实调查；Router只把已知candidate与权威推荐Intent交给事实Port；Google事实读取以返回的相同Place ID生成candidate关联的`RESTAURANT_FACT`，并与Discovery共享调用上限。事实读取不产生Availability、Offer或写操作。
- 完整验证：受准本机loopback环境`npm test`为`230/230`通过；`npm run typecheck`、`npm run arch:check`、`npm run build`和`git diff --check`通过。普通受限沙箱中的9个Web listener测试仍仅因`listen EPERM 127.0.0.1`无法绑定，获准环境重跑后无产品失败。
- Live / paid model：未运行；该代码切片不消耗或重置H001/H002/H003/H004既有只读额度，H005仍未启动。

- 补充共享额度回归：事实读取在Discovery已经耗尽额度时不发出第二个Google调用，持久化candidate `UNKNOWN`与稳定耗尽码；正常事实重读仍产生同候选来源事实。该行为与既有“换检索词不得绕过额度”覆盖互补。

- Composition回归：Fixture Eval、Mock Harness和Local Web server在同一事实动作目录下均有事实Port；Fixture/Mock只返回`UNKNOWN`且不提供来源事实。受准loopback环境相关测试`35/35`通过；未运行Live或付费模型。

## TEST-2026-09-11-STABLE-SOURCE-FACTS — offline regression

- Focused coverage: Google `primaryType` no longer proves `not hot pot`/`not Sichuan`; explicit conflicts remain observable. Google fact reads use `GET /v1/places/{PLACE_ID}` with Details field mask, and per-run counter isolation rejects a second call in one run while allowing an independent run. Browser website facts require matching JSON-LD name/address and do not retain visible prose; a mismatch is `UNKNOWN`.
- Full offline: `npm run typecheck`、`npm run arch:check`、`npm run build`、`git diff --check`均通过；经授权本机loopback环境`npm test`为`234/234`通过。受限沙箱的首次完整测试仅有九项localhost listener `EPERM`，不是产品失败。Live/paid model未运行，仍待按既有H002/H004授权和实际预算记录另行核对。

- Web Live Read-only authorization audit: H002 and H004 had only older Hybrid artifacts, so their explicitly authorized one Web run each remained available. Started final-code `LIVE_READ` Workspace on local PostgreSQL 17 with command-scoped localhost URL, existing server-only model/Google keys, and `LOCAL_CHROMIUM`; `.env` was not edited. H004 (`restaurant:410b63606df1935b29f99169`, ~19s) ran from browser input “今天下午在东银座附近找一家适合和朋友见面的咖啡馆，不需要预约。” and H002 (`restaurant:cb503a22ef3e74100627eeb3`, ~12s) ran from browser input “明天晚上在东银座站附近找餐厅，两个人。不想要火锅店，也不要四川或湖南等以辣味为主的菜系。请给有来源依据的推荐，不需要预约。” Each trace has 3 real model decisions, 1 Google Discovery and 2 Place Details calls; a third candidate Details read was locally rejected with `GOOGLE_SEARCH_BUDGET_EXCEEDED`. Both then correctly became `NEEDS_INPUT`: returned candidates had `Ginza` area facts but no evidence for `Higashi-Ginza`. No qualifying Browser website fact, availability read, Offer, availability/no-availability claim, login, booking, payment, cancellation or external write occurred. Each case has consumed its one authorized Web run; this is an execution/evidence gap, not a successful Web acceptance.

## TEST-2026-09-11-CITED-SOURCE-FACT-INVESTIGATION — offline regression

- Focused: `node --test --import tsx src/domains/restaurant/action-validator.test.ts src/domains/restaurant/read-grounding.test.ts src/eval/restaurant/agent-loop/diagnostic-evaluator.test.ts src/integrations/google/google-places-restaurant-search.test.ts src/integrations/restaurant-facts/google-listed-website-facts.test.ts src/integrations/restaurant-facts/model-fact-judgment.test.ts` passed `56/56`. It covers named-place coordinate/radius evidence, source-level ambiguity, near/far candidates, goal-driven recommendation readiness, time boundaries, visible website facts without JSON-LD, formatting-tolerant address identity, same-name conflict, cited/uncited/broad negative-type judgments, and legal refresh rechecks.
- Complete matrix: privileged local-loopback `npm test` passed `248/248`; `npm run typecheck`, `npm run arch:check`, `npm run build`, and `git diff --check` passed. This validates code and local Web lifecycle tests only.
- Live / paid model: not run. No new H002/H004 Web run was started, no H001/H003/H005 runner was started, and no Fixture/Replay result is reported as Live. Earlier Web authorization/budget consumption remains unchanged. No external write, credentials or personal location were stored.

- Follow-up recommendation-refresh regression: focused `action-validator`, `agent-context` and local Web tests passed `31/31`. It verifies a presented fact recommendation dispatches only `CANDIDATE_FACTS_REFRESH_REQUESTED`, permits one bounded new fact read for its displayed target, rejects availability routing and blocks presentation until the target produces a new observation. Live remains unrun.

## TEST-2026-09-12-READ-PATH-REVIEW — development diagnostic / frozen e504a3f

- 定向命令：`node --import tsx --test src/domains/restaurant/action-validator.test.ts src/domains/restaurant/read-grounding.test.ts src/integrations/restaurant-facts/google-listed-website-facts.test.ts src/integrations/restaurant-facts/model-fact-judgment.test.ts src/eval/restaurant/agent-loop/diagnostic-evaluator.test.ts`；53/53通过。
- 另在临时脚本调用当前生产函数/类，合成来源与模型传输，取得[审查报告](READ-PATH-REVIEW-2026-09-12.md)所列10项反例观察。它们证明现有覆盖遗漏，不是新Golden、真实模型或Live来源结果；未将故障脚本加入默认测试，也未修改原始artifact。
- 文档验证：4个修改的SKILL frontmatter/结构校验、修改文档的本地链接与新增锚点核对、规程职责一致性及`git diff --check`；无产品代码变化。未重跑全量测试/typecheck/build/真实浏览器Fixture/Live，未调用付费模型或访问私有Holdout。当前实现仍存在报告所列缺口。

## TEST-2026-09-12-CURRENT-FACT-LIFECYCLE — offline regression

- Focused: `npm run typecheck` plus `node --import tsx --test` over Action Validator, Google discovery, website facts, model judgments and the diagnostic evaluator passed `57/57`. The integration-shaped regressions prove a fresh fact `UNKNOWN` cannot reuse an old qualifying fact; zero exact named-place matches cannot use the search first item; same-name/same-number cross-city website text is UNKNOWN; identity-only JSON-LD can continue to same-page visible facts; and a cited derived fact is accepted only through candidate-bound raw source evidence.
- Browser goal contract now permits fact-only work to omit unprovided reservation parameters. Recommendation `nearby` without a device coordinate is intentionally incomplete, so the Web path collects a one-shot device location or ordinary manually entered place before discovery. A later semantic update can reopen a previously `FAILED` read-only case; it does not retry a provider or alter a completed historical outcome.
- No Live, paid model, real browser source, login, booking, payment, cancellation, credential change, personal location storage, or external write occurred. H002/H004 prior Web authorization consumption and all existing budget records remain unchanged.

- Complete matrix: privileged loopback `npm test` passed `254/254`; `npm run typecheck`, `npm run arch:check`, `npm run build`, and `git diff --check` passed. The real local Chromium dynamic-fixture suite initially could not launch inside the restricted sandbox (`MachPortRendezvous` permission denied), then passed `5/5` under the approved local-browser execution context. Those fixtures validate browser mechanics only, not an external source or Web Live result.

## TEST-2026-09-12-LIVE-RUN-LIFECYCLE — offline / local Web regression

- Final matrix: privileged loopback `npm test` passed `257/257`; `npm run typecheck`, `npm run arch:check`, `npm run build`, and `git diff --check` passed. The real local Chromium dynamic-fixture suite passed `5/5`. Evaluator @7 rejects duplicate `INVESTIGATE_CANDIDATE_FACTS` for the same request unless the persisted metadata contains the enumerated refresh reason; availability behavior remains covered by the same rule.
- Local Web: privileged loopback tests verify that a `LIVE_READ` POST returns an `ACTIVE` Case before a deliberately blocked source read completes; `DELETE /api/cases/:id/run` aborts that source signal, records `AGENT_LOOP_CANCELLED`, and appends a cancellation summary without results. A separate restart-shaped test verifies that an in-flight Live Case with no application owner is persisted as an explicit interrupted failure rather than silently resumed.
- Live / paid model: not run. This instruction granted no new Live budget; H001–H005 historical allowances and artifacts are unchanged. Fixture/local Web verification does not claim a real provider, model, browser source, or `PRESENT_RESULTS` success. No credential, precise location, booking, payment, cancellation, login, or external write occurred.

## TEST-2026-09-14-H001-H005-WEB-LIVE — actual read-only Web observations and post-run regression

- Offline integration first: before this Live sequence, the current Application/Router/Grounding/Reducer/Evaluator composition was exercised with only model/API/page boundaries substituted; it was not a hand-constructed State. After the Live observations, `npm test` under approved localhost binding passed `260/260`, `npm run typecheck` passed, and focused real HTTP/SSE/PGlite Web tests passed `17/17`. Restricted sandbox runs cannot bind `127.0.0.1` (`EPERM`); the privileged loopback reruns are the authoritative Web test result.
- H001 (`restaurant:dbd5ecf6da6d2e15ce72894b`, artifact run `5ad70538-a795-4ce9-9b19-066e10616c33`): future Shibuya omakase availability request ran about 287.9s, made 18 Agent decisions, discovered candidates and performed real TableCheck/Tabelog read attempts. It ended `WAITING_USER / NEEDS_INPUT`: no candidate had both verified omakase evidence and a confirmed matching slot. No card claimed a slot or no-vacancy; cost and browser-model-call count remain `UNKNOWN` in the artifact.
- H002 (`restaurant:b118b8b8fbaefc229620a873`): the future first-date, no-hot-pot/no-Sichuan-Hunan fact recommendation stopped at the real Semantic Interpreter with `MODEL_FAILURE`; no Google or browser source call followed. The pre-fix server left this historical Case `CREATED / UNDERSTANDING` and did not write an artifact. It is the independent failure that motivated W10; it is not a source/evidence result and was not rerun.
- H003 (`restaurant:4e7db7502809e2d672af646a`): the 10-person availability request, using a manually entered named Higashi-Ginza place rather than the operator's device location, likewise stopped at real Semantic Interpreter `MODEL_FAILURE`, before any source call. It was not rerun.
- H004 (`restaurant:0f23b9474aef7fe952ce55a0`, artifact run `9e77c8ea-89ab-449e-beeb-1e1bd064f055`): future afternoon cafe fact recommendation ran about 4.4s / one Agent decision. Real Google could not resolve the named location to coordinates, so the normal path ended `FAILED / NO_PROGRESS`; no result claimed nearby compliance. The card's displayed `partySize` missing field is a separate UI projection defect for fact-only goals, not a reason to ask for reservation parameters.
- H005 (`restaurant:b91d832cb57541eb6521f175`, artifact run `7d733c20-2812-489a-88ee-5da53c403895`): future 19:00 party-of-four local-food availability request ran about 282.6s / eight Agent decisions. It made three Google discovery reads (then recorded the per-run search budget exhaustion) and three real `GENERIC_BROWSER` availability reads. TableCheck/Tabelog entity/provider failures remained candidate-scoped `UNKNOWN / AVAILABILITY_SOURCES_EXHAUSTED`; it entered `WAITING_USER / NEEDS_INPUT` without saying there was no vacancy. The evaluator sidecar preserves provider attempt references and classifies the execution as `FAILED / NOT_EVALUATED`, not a qualified result.
- All three existing Web artifacts and independent evaluator sidecars are under ignored `.eval-artifacts/restaurant-web-read/`; source URLs are stored only in their existing redacted fields. No fixture/replay stood in for Live, no case was run twice, no real device location permission was accepted, and no booking/payment/cancellation/login/PII/external write occurred. No `PRESENT_RESULTS` claim is made for this sequence.

## TEST-2026-09-14-LIVE-DEBUG-GOOGLE-BUDGET — offline integration regression

- Static: `npm run typecheck` passed. The full Provider/Router/Web accounting change uses one explicit `LIVE_READ_DEBUG_INVESTIGATION_BUDGET.maxGoogleRequests=100` in both Web and Hybrid runner; the obsolete Details limit was removed.
- Cross-module fixture integration: the focused Provider/Router/Web run passed `39/39`, then the final approved localhost `npm test` matrix passed `264/264`. It verifies total/category accounting across named-place resolution, discovery and Details; failed sent calls count; same-run cumulative isolation; local exhaustion is not relabeled as service rate/permission/network failure; Router preserves failure usage; and ordinary Web artifact retains limit plus category totals. No real model, Google, browser source, account change, booking or external write was invoked.


## 2026-09-14 H001–H005 Hybrid Live 单次诊断（当前dirty工作区）

- 用户授权每例一次真实只读Runner；实际H001–H005各运行一次，没有重跑、Fixture或Web Live。
- 当前HEAD fd0dfb0，含Terra未提交修复；运行前后diff哈希一致。16次模型调用、48,903记录tokens、约61秒，费用UNKNOWN。
- H001：目标解释为RECOMMENDATION，与冻结AVAILABILITY冲突；10家发现、9家事实调查、旧本地每run Google请求上限耗尽，NEEDS_INPUT，无slot调查。
- H002：GOOGLE_LOCATION_UNRESOLVED→NO_PROGRESS/FAILED；H003：Proposal漏AREA→补问；H004：漏日期且评估坐标仅传Adapter、未到State→补问位置；H005：漏DATE、使用UTC钟面02:52而非Tokyo11:52→补问日期。
- 五例均PROPOSED，未复现MODEL_FAILURE；均未PRESENT_RESULTS，不能称验收通过或来源无位。每例原始execution及独立evaluation已保存。
- 详细首错、证据边界、资源及artifact索引：[批次报告](../../.eval-artifacts/hybrid-batch-2026-09-14/1789354306/REPORT.md)。报告为忽略目录本地证据，未提交。

## TEST-2026-09-14-HYBRID-REAL-COMPOSITION — offline integration

- 复现：原Runner只将东银座评估坐标传给Google Adapter，权威`intentDraft`仍无坐标，Agent Context正确判定`nearby`缺位置并在来源调用前补问；上下层各自通过不能证明此接线。
- 修复：Runner与`hybrid-read-composition.test.ts`共同调用实际初始化组合。冻结评估位置在语义编译后以`EVALUATION_LOCATION_BOUND`进入权威State，保留`source: EVALUATION`；无位置分支不注入默认坐标且Google HTTP调用为0。普通Web仍由真实PGlite/HTTP位置与手动地点回归覆盖，未把Runner成功当作Web验收。
- 完整组合：外部替换仅为显式合成的合法Semantic/Agent模型传输、Google HTTP响应及未触发的Browser Runtime。真实内部链穿过Interpreter、Compiler、Reducer、Agent Context、Validator、Router、Google Grounding和三个Place Details，在第4个Google请求后展示；artifact从实际snapshot/trajectory补评为`taskProducedQualifiedResult=YES`。这不证明真实模型、Google或浏览器网站。
- 预算：Provider回归实际发送100个同run discovery请求后，第101个请求在本地边界被拒绝且未发网络；新run再次可用。它与组合中的1 Discovery + 3 Details共同证明旧3次限制已不再截断正常调查。
- 最终验证：获准本机loopback `npm test`通过`268/268`；相关真实持久Web HTTP/SSE、组合与Google回归通过`33/33`，另有三项真实Hybrid组合回归（含旧的Adapter-only位置注入反例）。真实Chromium本地动态Fixture通过`5/5`，只访问本地页面。受限沙箱本身不能绑定`127.0.0.1`（`EPERM`），所以loopback结果在获准环境重跑；这是环境限制而非测试行为失败。
- 模式/副作用：本条只运行离线模型、HTTP和Browser替身；没有读取`.env`、运行真实来源、付费模型、Web Live、外部写入、提交或推送。

## TEST-2026-09-14-DETERMINISTIC-TIME-AND-COMPLETION — offline integration

- 时间链：实际Hybrid组合从Semantic Interpreter → Compiler → Reducer → Agent Context → Validator → Router → Google Grounding → 展示 → artifact → 独立Eval运行；外部仅替换模型传输、Google HTTP与未触发的Browser Runtime。`TOMORROW`与`AFTERNOON`由固定东京参考时刻物化为下一日及12:00–17:00，并在权威Draft保留原表达、参考时刻、时区、依据和结果；另有跨东京日界的相对分钟回归。
- 证据链：来源Grounding的无匹配slot先产生`UNAVAILABLE`，Reducer再绑定日期/时段/人数请求指纹；Validator拒绝用旧营业事实展示同一候选。未知、失败或不同请求条件不被当作无位。
- 完成诊断：实际artifact的独立Evaluator分别验证`QUALIFIED_RESULT`、`NO_CONFIRMABLE_RESULT`与`INTERNAL_EXECUTION_FAILURE`；后者不再获得正常无结果的支持性结论。该测试不证明真实模型选择、实时来源可用或主观推荐质量。
- 模式/副作用：仅离线模型/API/浏览器替身；无Live、付费模型、外部写入、提交或推送。完整门禁和本地Chromium Fixture结果在本轮结束后补记。
- 最终门禁：获准本机loopback环境下`npm test`通过`272/272`，`npm run typecheck`、`npm run arch:check`、`npm run build`和`git diff --check`均通过；真实Chromium本地动态Fixture为`5/5`。受限沙箱直接绑定`127.0.0.1`会报`EPERM`，已在同一离线测试命令的获准loopback环境重跑通过；这不改变测试替身边界。


## TEST-2026-09-14-TEMPORAL-LIVE-RECHECK — shared strict schema failure

在最新未提交确定性时间改动上，先运行相关离线12/12，再按新授权跑H001–H005各一次真实Hybrid。五例均HTTP400/PROVIDER_REJECTED：DATE/TIME_WINDOW显式值Schema包含raw但required漏列raw；本地实际Schema递归检查复现两个路径。无模型生成、Google或Browser来源调用，没有业务写入，未重跑。五份execution与独立evaluation均已保存，费用/token未返回，标UNKNOWN。源码哈希在批次期间一致。详见[批次报告](../../.eval-artifacts/hybrid-recheck-2026-09-14/1789372826/REPORT.md)。

## TEST-2026-09-14-DEEPSEEK-STRICT-SEMANTIC-SCHEMA-REPAIR — offline

- 修复：显式`DATE`和`TIME_WINDOW`值的`raw`现在在strict Schema、本地Validator、Prompt示例及Fixture/公开Regression输入中一致为必填非空字段；未关闭strict、未加重试或fallback。
- Gateway边界：实际DeepSeek HTTP body中的`tools[0].function.parameters`经过递归检查，所有含`properties`的对象均有同键集合的`required`；它直接覆盖此前Provider拒绝的两个路径，而不是只验证伪造completion。
- 验证：语义Contract、Interpreter、Fixture、公开Semantic Eval和DeepSeek Gateway相关测试`35/35`通过；`npm run typecheck`、`npm run arch:check`、`npm run build`与`git diff --check`通过。
- 模式/副作用：仅离线模型传输替身；未运行Live、付费模型、Google、Browser来源或外部写入，未提交或推送。


## TEST-2026-09-14-STRICT-SCHEMA-FIXED-HYBRID — Live Read-only

- 当前HEAD fd0dfb0加Terra未提交修复；src/web-skills源码哈希运行前后相同。先实际Gateway/Interpreter请求侧预检9/9，再按授权H001–H005各一次真实Hybrid，不重跑、不替代Web Live。
- 五例Semantic均PROPOSED，无旧HTTP400。H001 555.42秒STEP_LIMIT：真实TableCheck正向证据被旧factChecks白名单过滤；H002 6.55秒NO_PROGRESS：地点解析失败；H003 9.30秒PRESENT_RESULTS但周五被覆盖为今天；H004 6.94秒PRESENT_RESULTS但漏日期/无营业时间依据；H005 634.02秒STEP_LIMIT：26家空位UNKNOWN，非明确无位。
- 离线定位：原H001 artifact仅在内存副本增加一个已存在的新事实引用，真实readiness由false变true；实际时间物化函数复现DATE Friday→9/18后被TIME relative0覆盖为9/14。未改真实artifact或将探针视为Live成功。
- Eval未通过；且分类字段存在误导风险、H005动态“现在”仍对比冻结16:00、重复搜索未被investigation检查覆盖。原始execution/evaluation均保留，不修改Gold洗绿。
- 合计约1212秒、120次模型调用、557432记录tokens、65次Google请求、544次Browser Runtime调用、31次Browser模型调用；费用UNKNOWN。无登录、预约、支付、PII提交或业务外部写入。未重跑全量离线矩阵，业务源码未改。
- [完整报告与各case artifact](../../.eval-artifacts/hybrid-schema-fixed-2026-09-14/1789373476/REPORT.md)。报告/source hashes/因果探针在本地忽略目录，不提交。记录更新后git diff --check通过。

## TEST-2026-09-14-LIVE-DERIVED-CHAIN-REPAIR — offline and bounded Hybrid Live

- 离线：完整内部链保留真实Interpreter、Compiler、Reducer、Agent Context、Validator、Router、Grounding与Evaluator，仅替换模型/HTTP/浏览器边界。新增回归覆盖当前availability来源事实补充当前fact read、显式日期优先、`this afternoon`日期、命名地点变体/非首项拒绝、连续稳定拒绝、两次零新增发现，以及Live `right now`东京物化。最终`npm test` **281/281**、`typecheck`、`arch:check`、`build`、`git diff --check`及本地真实Chromium Fixture **5/5**通过。
- Live：H001–H005各一次Hybrid Read-only，无重跑、Fixture替代、登录、预约、支付或其他写操作；Google/Agent/Browser预算均独立按run累计，费用未配置故为`UNKNOWN`。H001：50.8s、Google12、Agent7，模型按原文产生RECOMMENDATION并在事实重复拒绝后`REJECTION_LIMIT`。H002：328.8s、Google63、Agent30，事实推荐候选扩张后`STEP_LIMIT`。H003：285.5s、Google50、Agent30，同类扩张且模型检索提示漂移，权威位置仍为EVALUATION。H004：32.3s、Google5、Agent4，`PRESENT_RESULTS`且独立来源证据充分；但原SOFT表达被改写，Eval正确标为需语义审查，不将其称为qualified自动通过。H005：758.4s、Google12、Agent30、37候选availability读取、541 browser runtime calls、28 browser model calls，真实来源均未给出合格slot，最终`STEP_LIMIT`，不称无位或成功。
- 这些Live是在零新增发现与availability路径一致性最终修复前后分批执行；授权限制禁止自动重跑，故只报告真实轨迹，不能称五例均在最终源码上验收。原始artifact与独立evaluation sidecar保存在git忽略`.eval-artifacts/restaurant-hybrid-live-read/`；历史artifact未改。


## TEST-2026-09-14-READ-EXECUTION-DESIGN — documentation only

- 交付：只读调查执行契约设计及ADR-0025 Draft，更新INDEX/ADR索引/STATUS和DEVLOG；Accepted ADR正文及业务源码未改。
- 验证：两份新文档相对链接目标、设计涉及的现有Domain文件、Draft标识和`git diff --check`通过。
- 设计包含真实组合回归、真实模型+固定来源诊断与后续有界Live的拟验证顺序，不表示本次已经运行这些验证。
- 本次未运行代码测试、模型调用、Live或数据库操作，未提交或推送；纯文档按Test Skill不运行完整代码门禁。


## TEST-2026-09-14-READ-DESIGN-TEST-MAPPING — documentation only

- 补齐设计中的现有测试文件映射、需退役断言、集成起终点、模型混合诊断边界和独立Eval反例；Test/Eval Skill为通用维护规则，设计为当前切片落点。
- 验证：设计相对链接、章节顺序、引用Skill目标和`git diff --check`通过；未修改或运行测试代码，未把待实施的混合诊断入口报告为已可执行。
- 无模型/来源调用、数据库操作、提交或推送。

## TEST-2026-09-14-ADR-0025-READ-COMPLETION — offline integration

- 真实内部组合保持Runtime/Reducer/Context/Validator/Router/PGlite/Web artifact与现有Evaluator；外部边界仍为既有离线替身。新增回归证明availability目标可以先补事实、`END_READ`只能在有实际调查且无可展示结果时形成持久`NO_VERIFIED_RESULT`、重复零新增发现由模型受控结束而不解析日志文案、同一来源的当前UNKNOWN不复用旧成功、独立来源事实不被错误遮蔽、地点后缀/地址/排名不成为地标确认。
- Evaluator/Rubric升至`@9`：`PRESENT_RESULTS`只是已记录展示，是否qualified仍由独立证据核验决定；正常无结果只能来自`NO_VERIFIED_RESULT`及范围记录，`STEP_LIMIT`/取消/内部失败不再转写成正常无结果。
- 验证：获准本机loopback环境下`npm run typecheck`与`npm test`通过**282/282**；真实Chromium本地动态Fixture `npm run test:browser:fixture`通过**5/5**。未运行付费模型、Google、预约来源或任何外部写入；本条不构成新的Live验收。

## TEST-2026-09-14-ADR-0025-INDEPENDENT-REVIEW — offline + one Live read

- 复跑 typecheck、arch:check、build、diff检查通过；npm test **282/282**，Chromium本地Fixture **5/5**。首次沙箱内Web监听EPERM，获准本机监听环境重跑通过，保留两份日志。
- 额外真实Hybrid初始化组合（只替换模型传输/Google HTTP）复现跨批factChecks被覆盖：4候选3+1批次反复读取直到STEP_LIMIT；Domain反例还证明A的新UNKNOWN会因读取B而丢失，重新使用A旧正向事实。另一组合复现Google耗尽时外层提前停止，尽管CHECK_AVAILABILITY仍合法。无生产代码修改。
- Evaluator反例：零来源轨迹、空noVerifiedResult对象仍获SUPPORTED_BY_EVIDENCE；地名固定响应反例：Higashi-Ginza与Higashi-ginza Sta.仍无法对应。它们不属于Live。
- 本次用户测试请求下运行原始H001一次：2026-09-14T13:48:53Z开始，540.236秒后STEP_LIMIT / FAILED；10候选、23次事实批次、69次Place Details（同店最多11次），Google共71/100，6家预约读取均UNKNOWN，未展示。38次模型调用、300276总tokens；金额未记录。开始时东京22:48，今晚19点已过；不据此评价未来库存，但重复调查与离线复现一致。无H002–H005/Web Live追加，无预约/支付命令；副作用计数未独立测量。
- Eval检出重复调查与公开Gold/产品target.goal口径冲突；STEP_LIMIT完成类别仍NOT_EVALUATED，不能称本轮验收通过。
- 可复现脚本、完整结果与限制：[review report](../../.eval-artifacts/adr0025-review-2026-09-14/REPORT.md)；[Live artifact](../../.eval-artifacts/restaurant-hybrid-live-read/2026-09-14T13-48-53-579Z-e08b2e88-0ede-4319-85fe-67f9b9ecb0f6.result.json)。资料位于本地忽略目录，exposed development diagnostic，不是Clean Baseline。未提交、未推送。

### TEST-2026-09-14-READ-ARCHITECTURE-REVIEW

- 模式：离线内部组合/Domain 契约诊断，合成外部事实响应；非完整 Runner E2E、非 Live。
- `node --import tsx .eval-artifacts/adr0025-review-2026-09-14/source-scope-probe.mjs`：断言复现 Google→官网批级来源污染；A 当前 UNKNOWN 因 B 官网观察重新 eligible，Google-only 对照不合格。实际调用组合器、Reducer、展示判断；外部请求 0。
- `node --import tsx .eval-artifacts/adr0025-review-2026-09-14/partial-observation-probe.mjs`：同一合成身份/事实在 slot UNKNOWN 时零 evidence、AVAILABLE 时保留三种 evidence；证明当前 grounding 的接纳耦合，不证明真实网页内容。
- 与前次 source-hashes.json 对比：170 个 src/web-skills 文件无变化，无新增源码。复用既有 282/282、Chromium 5/5 及失败 Live 证据，本轮未重跑默认矩阵、模型或真实来源。
- 两个探针成功复现缺陷/限制，不是修复通过。完整结论见 `.eval-artifacts/adr0025-review-2026-09-14/ARCHITECTURE-REVIEW.md`；仅新增诊断产物及更新记录。

### TEST-2026-09-15-TEST-CONTRACT-REPAIR

- 验证切片：先让正式测试捕获现有执行故障，再修Eval判定；产品红色回归留作下一阶段修复门槛。
- `node --import tsx --test src/eval/restaurant/agent-loop/diagnostic-evaluator.test.ts`：旧Evaluator加新预期会失败；最终27/27通过。无结果反例包括合格候选被忽略、空记录、仅提议、旧请求、范围矛盾和未完成执行；正常限定空搜索为对照。
- 实际Hybrid初始化组合测试只替换外部模型/HTTP/网页；跨批三种顺序、Google额度耗尽、混合来源均在产品契约断言失败；额度充足控制实际到达浏览器，避免以错误替身证明故障。部分事实接纳是另一个Domain测试，不计完整E2E。
- 最终`npm test`：298项，290通过、8失败（6失败叶项及2父项），0 skip/todo。仅剩上述4类执行缺陷。先前沙箱listen EPERM已与实际产品失败分开，在授权本机listener环境完整运行；中间Web版本字面量失败已同步当前Evaluator常量，最终不再失败。
- typecheck、arch:check、build、`git diff --check`通过。未改浏览器操作代码，不重跑Chromium本地Fixture。未运行付费模型、真实来源、Live或Web Live。
- 两份历史H001 artifact只读补评并与修改前@9对照，execution分类不变。09-08旧artifact缺target.goal，整体未评估但展示证据充分；09-14重复调查失败仍NOT_SUPPORTED。原artifact不改。
- 本地完整证据：`.eval-artifacts/test-contract-repair-2026-09-15/`，最终日志`npm-test-final-complete.log`。正式记录与未覆盖范围：[验证修复记录](TEST-VALIDATION-REPAIR-2026-09-15.md)。业务未修复，不报告总体通过。


## TEST-2026-09-16-BROWSER-LOOP-FEASIBILITY — Live component diagnostic

- 用户授权两站验证；每站一次、最多 8 次模型决策/60 次底层操作/180 秒。现有 DeepSeek Gateway、BrowserTaskExecutor、LocalPlaywrightChromium 未修改。绕过 Discovery/Semantic/Restaurant Runtime 的组件诊断，不是完整产品验收。
- Mock：`node --import tsx --test src/infrastructure/browser/browser-task-executor.test.ts src/infrastructure/browser/browser-action-decision.test.ts`，14/14。`npm run test:browser:fixture` 首次因沙箱 MachPort Permission denied 无法启动；经沙箱外许可运行 7/7，无源码改动。
- Live：141 2 次模型调用/11,703 tokens/19.2秒，日期选择与19:00入口可见，未验证完整套餐；八芳 8次/72,362 tokens/81.9秒，全部因 authoritativeField 解码错误被拒，BUDGET_EXCEEDED。无重跑、无Google、无预约提交，实际网络副作用计数 NOT_MEASURED。费用未知。
- 两份执行和独立助手复核分开存于 `.eval-artifacts/browser-loop-feasibility-2026-09-16/`；完整[报告](../brainstorming/2026-09-16-browser-loop-feasibility-validation.md)。未运行全量代码门禁（无生产改动）、Replay、Cloudflare Live、Controlled Live-write或框架对照；链接/diff通过。当前源码中的观察与反馈限制仍未修复。


## TEST-2026-09-16-STAGEHAND-SMALL-PROBE -- isolated component diagnostic

- User-authorized small test; npm Stagehand 4.1.0 pinned in ignored experiment directory. No production dependency or code change.
- Real Chromium synthetic fixture passed independent DOM date/party/result assertions; real DeepSeek fixture proposed the correct calendar cell and passed target inspection and post-action snapshot review.
- One timing sample: Stagehand snapshot 34ms / 14,730 characters / 395 mapped nodes; current Registry 10,368ms / 184 controls, missing calendar td. Different outputs and one sample; not a performance baseline.
- Live TableCheck and Tabelog each observed once. Picker-opener/unlabelled-button proposals stopped at the probe's exact-date guard; no live click, Offer or complete workflow acceptance. Total 3 model calls / 23,001 tokens; monetary cost unknown.
- Cap 6 model calls across probes, 180 seconds per run. Cache/selfHeal disabled; telemetry explicitly sent to localhost. No login, terms acceptance, contact information or reservation submission; external network side-effect count NOT_MEASURED.
- Initial sandbox npm DNS failure resolved with approved execution; initial local script ESM configuration corrected before browser/model access. Execution and independent assistant-review sidecars stored in `.eval-artifacts/stagehand-probe-2026-09-16/`. Browser process cleanup checked.
- No Replay, Cloudflare Live, complete Restaurant Runtime or Controlled Live-write. Documentation links and diff checked; full code gates not repeated because production code is unchanged. [Report](../brainstorming/2026-09-16-stagehand-small-probe.md).


## TEST-2026-09-16-STAGEHAND-WORKFLOW — isolated development diagnostic

- Synthetic real-browser: initial XPath prefix failure preserved; corrected same-page and asynchronous/new-tab fixtures passed. Not Replay.
- Live read-only component: two batches, 7 + 10 model calls, 186,337 tokens; TableCheck 141 / Happo / Sendou did not complete the model-driven workflow. Separate zero-model sequential Stagehand/Playwright navigation control read the public TableCheck form; not autonomous success or inventory proof.
- Original execution artifacts plus separate assistant review sidecars: `.eval-artifacts/stagehand-workflow-2026-09-16/`. Recording SUCCEEDED is not business success. Browser cleanup reported CLOSED. External side-effect count not independently measured.
- No production code/dependency change; no product full gates, Replay, Runtime integration or Controlled Live-write. Documentation links and diff checked separately. [Detailed evidence](../brainstorming/2026-09-16-stagehand-workflow-validation.md).


## TEST-2026-09-16-BROWSER-OBSERVATION-ACTION-MEMORY

- Synthetic real Chromium fixture: checkbox roundtrip, range keyboard value, search result and modal scroll assertions passed; first sandbox listener EPERM had no model call. Not Replay.
- Scripted Live read-only: TableCheck query, complete Filters roundtrip/apply/reset and budget value changes verified; Happo alternative Sep 20 19:15 party 4 verified from options-page body with two details expanded. Map marker click timed out; geographic bounds unverified. Earlier wrong-popup/endpoint-only probe failures preserved.
- Model Live: 15 observe calls, 141 public form reached, Tabelog model workflows incomplete; multiple observe candidates and repeated-date proposals are not evaluated as a complete agent API.
- Real model + captured Live source: 5 calls for extraction, notes-only comparison/revision and new-source update. Quote/reference containment passed in listed scope, but semantic review found inverse inference, incomplete quote scope and treating options as selected state; no overall memory pass. Not a clean holdout or product E2E.
- Total 20 calls / 228,988 tokens. Raw execution plus separate review under `.eval-artifacts/browser-capability-suite-2026-09-16/`; all completed browsers reported closed. No booking, consent or PII actions requested; external side-effect count not independently measured.
- Product full gates not run: no production code/dependency change in this slice. Documentation links and diff checked; no Replay or Controlled Live-write. [Report](../brainstorming/2026-09-16-browser-observation-action-memory-validation.md).


## TEST-2026-09-16-BROWSER-PLAN-HANDOFF — documentation only

Checked the plan against current browser/runtime/decision/executor interfaces, existing Skills/Evidence and current H001–H005 acceptance. Verified local Markdown links and git diff whitespace. No code tests, browser runs or paid model calls were run for this documentation-only turn. Implementation and Live gates remain future work in the [plan](../BROWSER-AGENT-RESTAURANT-IMPLEMENTATION-PLAN.md).


## TEST-2026-09-16-BROWSER-TERRA-INDEPENDENT-REVIEW

Typecheck and 15 existing decision/executor tests passed independently. Four local real-Chromium synthetic checks reproduced consent checkbox acceptance, native slider stale value (observed 15 vs actual 14), missing aria slider values, and fixed dialog missing background block. Artifacts: `.eval-artifacts/browser-terra-review-2026-09-16/`; no production code changes, model calls or Live sources. No independent full suite rerun. [Review](BROWSER-AGENT-TERRA-REVIEW-2026-09-16.md).


## 2026-09-16 Browser review repair — current development evidence

- Slice: R1–R4 in [independent review](BROWSER-AGENT-TERRA-REVIEW-2026-09-16.md), not complete P0–P4 acceptance.
- Before fix: strengthened existing Fixture and new state/consent regressions reproduced failures (`.eval-artifacts/browser-terra-review-2026-09-16/before-fix.log`).
- After fix: `npm run typecheck`, `npm run arch:check` (0 forbidden dependencies), `npm run build` PASS. `npm test` 344/344 PASS after authorized rerun; initial sandbox run could not listen on localhost.
- Final `npm run test:browser:fixture`: **12/12 PASS** (`final-browser.log`). This includes authorized-query check/uncheck/check, native/ARIA slider property roundtrip, strict-wire unsafe consent refusal, fixed native modal, and nested/hidden dialogs with background restoration. The additional checkbox cycle initially exceeded the existing fixture budget; only that fixture was raised to 36 operations, production default remains 24.
- Classification: Mock/unit plus Synthetic real-Chromium only. The Cloudflare-session-named fixture exercises the session wrapper with local Chromium, not remote Cloudflare deployment. No new Replay, Live Read-only, Controlled Live-write or paid model call. No real-site filter/booking success inferred.
- Production source query permission remains unset; default refusal is deliberate pending explicit source contract integration.

## 2026-09-16 Browser P1/P2 completion — offline only

- `npm run typecheck` PASS after each affected slice.
- `npm run test:browser:fixture` PASS **13/13** in authorized local Chromium. It uses only intercepted synthetic pages and production `BrowserTaskExecutor`: source-permitted GET filter check/uncheck/check, slider, bounded region scroll, Update/reopen/Reset, modal state, stale references and observed public new-tab switch. The eight-transition filter case has a fixture-only 52-operation cap; production remains 24.
- `node --import tsx --test src/integrations/restaurant-availability/public-query-control-policy.test.ts src/integrations/tablecheck/tablecheck-browser-availability.test.ts src/integrations/tabelog/tabelog-browser-availability.test.ts` PASS **33/33**. It proves each source policy permits only its own public GET search range/checkbox controls and rejects sensitive or mismatched paths.
- `node --import tsx --test src/eval/restaurant/agent-loop/hybrid-read-composition.test.ts` PASS **29/29**. The new alternative-time case starts at real Semantic/Compiler/Router/Reducer composition, substitutes only external model/HTTP/page edges, and confirms original 19:00, bounded 18:30–19:30 query, unchanged date/party and alternative label.
- `node --import tsx --test src/integrations/restaurant-facts/google-listed-website-facts.test.ts src/server/local-web-server.test.ts` PASS **29/29** in authorized loopback execution. Website facts exercise an observed terms disclosure and two candidate pages; price/tax, private-room minimum, cancellation and no-show remain separate and candidate-scoped. The first sandbox attempt failed because localhost binding is prohibited there; it was rerun unchanged outside the sandbox.
- Classification: unit/adapter mocks, synthetic HTTP/model boundaries, real local Chromium Fixture and localhost Web test. No Replay, real model, Live Read-only, Controlled Live-write, Gold/Holdout access or external write. These commands do not establish current source-page compatibility or inventory.
- Final shared gates: `npm run arch:check` PASS (0 forbidden dependencies), authorized `npm test` PASS **352/352**, `npm run build` PASS, authorized `npm run test:browser:fixture` PASS **13/13**, and `git diff --check` PASS. The initial full-suite sandbox run had 15 localhost listener failures plus a transient stale prompt-version assertion; the unchanged authorized rerun passed every test. No Live or paid invocation occurred.


## TEST-2026-09-16-BROWSER-AGENT-P1-P2-CURRENT-OFFLINE

- Scope: current P1/P2 offline increment after R5–R8 repair. No Gold/Holdout, paid model, real source, Replay, Controlled Live-write, booking, payment, cancellation, commit or push.
- `npm run typecheck`: PASS.
- `node --import tsx --test src/domains/restaurant/agent-context.test.ts src/domains/restaurant/agent-decision.test.ts src/domains/restaurant/action-validator.test.ts`: PASS **28/28**. Covers sourced current commercial notes at the actual Agent transport boundary and same-source fact refresh supersession.
- Authorized `npm run test:browser:fixture`: PASS **13/13**. Local synthetic Chromium only. The production Executor observes `aria-valuetext` for a two-ended JPY slider, changes only the fixture-permitted lower endpoint, re-observes the upper endpoint unchanged, scrolls the intended dialog and confirms the page's applied filter text. It does not grant production source controls or invoke external pages.
- `npm run arch:check`: PASS (0 forbidden dependencies). `npm run build`: PASS.
- First authorized `npm test`: 354/356; two stale v6 Context schema assertions in the mock harness/PGlite persistence tests failed after the deliberate Context v7 change. Both expectations were migrated. Second authorized `npm test`: PASS **356/356**, 0 fail/skip/todo. Loopback fixtures only.
- Classification: local unit/contract, synthetic real Chromium and loopback integration. This supports only the specified offline controls. Positive source query-control contracts, real complex-page behavior, P3 Live model/source execution, B13 and B14 remain outside the run; review handoff is pending in the [delivery record](BROWSER-AGENT-RESTAURANT-P0-P4-DELIVERY-2026-09-16.md).

## 2026-09-16 Browser second review counterexamples

Local production Compiler/Intent, public query policy and website reader/Grounding exercised with Synthetic boundary inputs; four failures reproduced (R5–R8 in browser Terra review). Existing policy/website-facts/compiler tests 24/24 and typecheck PASS. Evidence: `.eval-artifacts/browser-terra-review-followup-2026-09-16/{repro.ts,results.log,existing-tests.log}`. No Chromium, paid model, Replay, Live or external writes in this review; no claim of full-suite rerun or repair.


## 2026-09-16 Second review repair: R5-R8

Current development evidence. Time-window replacement now clears old alternative permission at Intent patch application; explicitly supplied new permission is applied afterwards. The unverified public GET search policy and adapter grants were removed: production checkbox/range actions default to deny pending positive source control contracts. The synthetic fixture alone grants its known query controls; Japanese consent is refused through the real Chromium strict-wire path.

Commercial scalar prices now require an unambiguous complete labelled line; deposits mixed with prices and multiple courses remain unknown. Supported commercial requests (course price, room minimum, cancellation, no-show) are included in the reader objective and completion check. Existing type/hours no longer cause early completion when requested terms are missing. Missing requested facts return UNKNOWN / WEBSITE_REQUESTED_FACTS_UNCONFIRMED while retaining observed evidence. This is narrow explicit-keyword support, not general multi-course or natural-language understanding.

Verification: typecheck, arch:check (0 forbidden), build, full npm test 353/353 and synthetic real-Chromium 13/13 PASS. Before-fix regressions saved. An initial Compiler-level null patch failed one old shape assertion; invalidation was moved to Intent patch application and the full suite rerun successfully. Logs: `.eval-artifacts/browser-terra-review-followup-2026-09-16/before-fix.log`, `final-tests.log`, `browser.log`. Old repro.ts records the pre-fix policy and is not a current runner after its deletion.

The unsafe policy test was retired with the implementation; existing semantic/website and Chromium tests were strengthened, with ambiguity and missing-fact regressions added. No paid model, Replay, Live, external writes, commit or push. R6 is safely closed but positive real-site filter wiring remains incomplete; full P1/P2/P3 acceptance is not claimed.


## 2026-09-16 Third browser review

Independently ran Context/Decision/Validator tests 28/28, test:browser:fixture 13/13, typecheck PASS. R9 reproducer evaluates the exact commercial-evidence selection expression extracted from local-workspace-page.ts against retained old/new facts: selected old 7500/no-show despite current 8000/cancellation and supersededEvidenceIds. This is a local expression-level counterexample, not an end-to-end Web test. No full-suite rerun, Live or paid calls.

## 2026-09-16 Browser 直接修复最终验证

- `npm run typecheck`、`npm run arch:check`、`npm run build`、`git diff --check` PASS。
- `npm test` 首次受 sandbox localhost listen EPERM 影响；允许本地监听后重跑 **358/358 PASS**，最终 log：`.eval-artifacts/browser-completion-2026-09-16/verified-final-tests-unrestricted.log`。
- `npm run test:browser:fixture` **15/15 PASS**（真实本地 Chromium，synthetic 页面/HTTP，非外站）：同目录 `verified-final-browser.log`。新增覆盖条款刷新/独立引用、来源 Budget 契约/拒绝 consent、模型停止与代码 completion 区分；不以测试数量证明产品完成。
- Live Read-only：TC 查询模型3 calls成功；H001 9 calls/5 Google并有独立 evaluation通过；Tabelog5 calls目标日期/人数未确认，**未通过**。合计17 calls/149093 tokens，未估算费用。原始 artifact 未覆盖；Tabelog独立判断见 `tabelog-independent-evaluation.json`。
- 无新增 Replay；无 Controlled Live-write；无生产 Web Live、两店修订/比较、新商户验收。未执行预约提交。达到本批40分钟上限后停止新增 Live。[明细](BROWSER-AGENT-VALIDATION-2026-09-16.md)。

## 2026-09-16 Tabelog / TableCheck follow-up verification

Final typecheck, arch:check, build and diff check PASS. npm test **361/361 PASS**; test:browser:fixture **18/18 PASS**. Logs: `.eval-artifacts/browser-tabelog-repair-2026-09-16/tests-complete.log` and `browser-complete.log`. Intermediate delayed fixture caught a multiple-match readiness selector; container selection fixed it before Live rerun.

Live Read-only: Tabelog early observation failed (1 call), readiness repair confirmed date/guests (2 calls) but not inventory. TableCheck disabled-control repair returned UNKNOWN (2 calls); scoped empty-result repair returned NO_MATCHING_SLOT in 8967ms without model calls. Total 5 calls / 39116 tokens / zero Google, below 12-call / 20-minute cap. Code hashes, executions and independent evaluation kept separately. No Replay, Controlled Live-write or booking submission. [Report](BROWSER-AGENT-VALIDATION-2026-09-16.md).

## TEST-2026-09-17-H001-H003-H005-TARGETED-OFFLINE

- Scope: pre-Live H001 store association, H003 current-source positive-HARD diagnostic, and H005 immediate-time contract. No Gold/private Holdout access, booking or external write.
- Targeted test command: semantic/compiler, Router, Model Fact Judgment, TableCheck, Tabelog and Hybrid composition **98/98 PASS**. It includes phone conflict plus same complete address, branch address conflict, direct Google-listed merchant identity read, cross-candidate entry reuse with independently scoped evidence, stale/unrepresentable immediate request with zero provider call, and positive-HARD cited judgment.
- Gates: `npm run typecheck`, `npm run arch:check` (0 forbidden dependencies), `npm run build`, `git diff --check` PASS. First sandbox `npm test` had 15 loopback `EPERM` failures; unchanged authorized rerun passed **376/376** in 14210ms.
- H003 fixed-input production-model diagnostic: final current-source record `.eval-artifacts/restaurant-hybrid-live-read/h003-hard-fact-diagnostic-current-2026-09-17T04-47-16Z.json`, one `restaurant_fact_judgment@2` invocation, 764 input + 82 output = 846 tokens, cited current Google fact and emitted `verifiedHardCriteria:[good for drinks]`. State replay retained the cited source/identity chain and changed the first missing reason from HARD-fact absence to missing availability-source identity; it is not an availability result. A failed artifact-save invocation and a superseded-source diagnostic are retained as failed attempts.
- Classification: local unit/contract plus one real model fixed-source diagnostic; no Replay, Live source read, Controlled Live-write, or booking. This is not a claim that H001/H003/H005 Live acceptance passed.

## TEST-2026-09-17-H001-H003-H005-BOUNDED-LIVE-READ

- Authorization/budgets: each original case once, `LOCAL_CHROMIUM`, `maxAutomaticBrowserMs=300000`, `maxModelCalls=50`, `maxGoogleRequests=50`, `maxBrowserOperationsPerCandidate=50`; runner's independent agent-step cap remained 30. Read-only code path; no booking/write action.
- H001: [result](../../.eval-artifacts/restaurant-hybrid-live-read/2026-09-17T04-49-22-764Z-72cbe0fd-5b21-4373-8aa2-44d10ef53538.result.json) and evaluator sidecar saved. `NO_VERIFIED_RESULT`, TERMINAL/7 steps, 181499ms, 10 candidates, Google 5, browser model 12, runtime calls 137 (per-candidate 7–24). Five request-bound `NO_MATCHING_SLOT`; five identity/extraction UNKNOWN. evaluator@15: qualified NO, scoped completion only.
- H003: [started record](../../.eval-artifacts/restaurant-hybrid-live-read/2026-09-17T04-52-35-417Z-5336c9d4-8f09-48aa-b372-c05d912a2b55.started.json) only. The single process did not finalize after the 5-minute cap and was interrupted at the user-bound limit; no result/evaluator exists, no retry was run. This is a failed/unfinished Live observation, not a no-result or acceptance result.
- H005: [result](../../.eval-artifacts/restaurant-hybrid-live-read/2026-09-17T04-57-51-585Z-81816d10-566e-4e98-b979-052ee0c40d4c.result.json) and evaluator sidecar saved. `NO_VERIFIED_RESULT`, TERMINAL/7 steps, 138627ms, 10 candidates, Google 4, browser runtime 0, browser model 10. Materialized 13:57 Tokyo; after elapsed fact work, every availability check is `UNKNOWN/IMMEDIATE_REQUEST_EXPIRED`. No later slot query or presentation occurred; this validates only the expiry fail-closed behavior, not source availability.
- Classification: Live Read-only development diagnostics, not clean baseline/Replay/Controlled Live-write. Independent evaluator remains a separate sidecar and does not establish H001/H003/H005 acceptance. Review handoff required.

## TEST-2026-09-17-H001-ADDRESS-REPRESENTATION-AND-DEADLINE-REPAIR

- Scope: post-Live offline repair only. The shared outlet identity helper is exercised through both production resolvers: a Japanese/Latin complete address pair with matching postal code and `1-1 2F` reaches HIGH; `3F` and incomplete address counterexamples do not. Existing direct Google merchant-entry, phone-conflict, branch-conflict and per-candidate availability-evidence isolation cases remain in the same adapter suites.
- Targeted command: TableCheck, Tabelog and Hybrid time composition suites **51/51 PASS**. `npm run typecheck`, `npm run arch:check` (0 forbidden dependencies), `npm run build` and `git diff --check` PASS. Authorized loopback `npm test`: **378/378 PASS**, 0 fail/cancel/skip/todo, 14160ms.
- Runner deadline settlement is typechecked and compiled by `npm run build`; no synthetic timeout was represented as a Live completion. The prior H003 `.started` artifact remains the only artifact for that attempt.
- Classification: local contract/unit/integration regression. No Gold/private Holdout, Replay, new real-model call, Live source read, Controlled Live-write, booking, payment, cancellation, commit or push. The tests do not establish the post-fix H001 Live behavior, H003 complete Live completion, or actual platform availability for a valid immediate H005 request.

## TEST-2026-09-17-H001-ADDRESS-SUFFICIENCY-FOLLOW-UP

- A new resolver counterexample proves identical abbreviated `1-1 Shinjuku` strings remain MEDIUM rather than becoming a same-outlet proof. A complete English reordered address, the postal-code cross-script pair and the distinct-floor case retain their respective HIGH/HIGH/MEDIUM outcomes.
- `node --import tsx --test src/integrations/tablecheck/tablecheck-browser-availability.test.ts src/integrations/tabelog/tabelog-browser-availability.test.ts src/eval/restaurant/agent-loop/hybrid-read-composition.test.ts`: **75/75 PASS**. `npm run typecheck`, `npm run arch:check`, `npm run build` PASS. Authorized loopback `npm test`: **379/379 PASS**, 0 fail/cancel/skip/todo, 14255ms.
- Classification: offline identity regression only. No new Live, model, Google, browser-source, write, Gold/Holdout, commit or push action; it does not upgrade the H001 Live result or any H003/H005 residual state.

## TEST-2026-09-17-H005-EXACT-SOURCE-SLOT-CONTRACT

- Replaced temporal materialization@4's fixed 15-minute queryability assumption with @5 `sourceSlotPolicy: EXACT_ONLY`. Fixed-clock Compiler tests retain the exact Tokyo minute and one-minute expiry; Router tests prove an unexpired exact request is forwarded unchanged and an expired request remains fail-closed.
- TableCheck and Tabelog adapter regressions each use a request for 12:08 with observed source cards at 12:00 and 12:30. Both return `UNKNOWN/IMMEDIATE_SLOT_NOT_OFFERED`, return no offer, and do not silently promote 12:30 or report `NO_MATCHING_SLOT`.
- Commands: H005/H001 relevant targeted suite **100/100 PASS**, final TableCheck adapter suite **28/28 PASS**, `npm run typecheck`, `npm run arch:check`, `npm run build`, `git diff --check` PASS. Authorized loopback `npm test`: **384/384 PASS**, 0 fail/cancel/skip/todo, 15711ms.
- Classification: fixed-time local contract plus synthetic source-page adapter evidence. No new Live, model, Google or external source request, Replay, Controlled Live-write, booking, Gold/Holdout, commit or push. This strengthens H005 before a future separately authorized Live; it does not alter the existing expired H005 run.

## TEST-2026-09-17-H005-PRESENTATION-EXPIRY

- State-to-presentation regression: a fully grounded immediate offer is allowed while its immediate valid-until timestamp is current, then `PRESENT_RESULTS` is rejected one second after expiry even though ordinary offer/evidence display TTL remains valid.
- H005/H001 relevant fixed-time, Router, Validator and adapter set **95/95 PASS**; authorized loopback `npm test`: **385/385 PASS**, 0 fail/cancel/skip/todo, 14386ms. Typecheck and architecture check passed in the same slice; prior build and diff check remain clean.
- Classification: offline authoritative State/Validator evidence only. It does not add a real source or model invocation and does not upgrade the historical H005 expired Live result.

The final cross-case classification and raw artifact links are in [H001/H003/H005 targeted repair report](H001-H003-H005-TARGETED-REPAIR-2026-09-17.md). The report is a development evidence handoff, not an independent-review approval or a clean-baseline claim.

## TEST-2026-09-17-H003-DEADLINE-SETTLEMENT

- `live-run-deadline.test.ts`: **2/2 PASS**. A never-settling child rejects `CANCELLED` when the outer signal aborts; a completed child result survives a later abort.
- `npm run typecheck`, `npm run arch:check`, `npm run build`, `git diff --check` PASS. Authorized loopback `npm test`: **387/387 PASS**, 0 fail/cancel/skip/todo, 14368ms.
- Classification: local runner lifecycle regression. It does not fabricate the historical H003 result/evaluator, invoke a model/source/Live run, or authorize retry.

## TEST-2026-09-17-TARGETED-REPAIR-INDEPENDENT-REVIEW

仅审查与离线诊断，无产品代码修改。独立运行deadline/TableCheck/Tabelog/model-fact-judgment现有测试56/56通过；额外调用生产地址比较与两个entity resolver，B1F vs 1F、同电话不同地点均HIGH（预期不得HIGH），仅邮编加楼层也被判为完整匹配。既有H001 Live复核确认Teppen时发现的涩谷Hajime入口未在随后Hajime调查使用；H003只存在started；H005全IMMEDIATE_REQUEST_EXPIRED。未重跑387项全量或typecheck/arch/build，未调用真实模型/网络/新Live或外部写入。反例脚本、结果、定向日志和限制见[审查报告](../../.eval-artifacts/targeted-repair-independent-review-2026-09-17/REPORT.md)。

## TEST-2026-09-17-H001-IDENTITY-ENTRANCE-FOLLOW-UP

- 修复前再次执行 [identity reproduction](../../.eval-artifacts/targeted-repair-independent-review-2026-09-17/identity-reproduction.mjs)：B1F/1F 与同电话异址均为 HIGH，`〒150-0002 1F` 为 true。修复后同一脚本输出前两项 `MEDIUM`、短地址 false。
- 定向命令 `node --import tsx --test src/integrations/tablecheck/tablecheck-browser-availability.test.ts src/integrations/tabelog/tabelog-browser-availability.test.ts src/integrations/restaurant-availability/live-browser-availability.test.ts`: **55/55 PASS**。覆盖两个 Adapter 的 floor/phone 冲突、短地址、direct merchant 先于 search、无关 ledger entry 不跳过 discovery，以及真实 `LiveBrowserAvailability` 跨 Agent batch 的 Teppen → Hajime entrance reuse/re-identification、及新 run 的 ledger reset。
- `npm run typecheck`、`npm run arch:check`、`npm run build`、`git diff --check`: PASS。授权 localhost `npm test`: **392/392 PASS**，0 fail/cancel/skip/todo，16427ms。
- 固定快照后各一次 Live Read-only probe：Teppen [artifact](../../.eval-artifacts/restaurant-browser-probe/2026-09-17T07-11-37-378Z-68d40f29-c653-4a3c-aa52-f7fe319a6c8d.result.json)、Hajime [artifact](../../.eval-artifacts/restaurant-browser-probe/2026-09-17T07-11-50-032Z-266e8d74-a116-422d-96f0-8b8c9500322a.result.json)、Nasu [artifact](../../.eval-artifacts/restaurant-browser-probe/2026-09-17T07-12-01-600Z-266438a6-6b8e-4769-b94b-8cb5f34aca50.result.json) 均为 `PAGE_OBSERVATION / BROWSER_RUNTIME_FAILED`，无 snapshot。第一条 300 秒参数在 Runner 的 60 秒上限校验前失败，未创建 artifact 或访问页面；三条实际 probe 各采用 60 秒上限且只允许 NAVIGATE/SNAPSHOT/WAIT_FOR。
- 分类：离线修复 + 已尝试但 browser-runtime 阻塞的 Live read-only，不等同于来源、身份、库存或产品验收。无模型调用、Google 请求、预订/支付/取消/登录、Gold/Holdout 读取、commit 或 push。详见 [后续记录](H001-IDENTITY-ENTRANCE-FOLLOWUP-2026-09-17.md)。

- 后续无网络 runtime 定位：`PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM` 仅启动并关闭本机 headless session，结果 `OPENED`。没有导航、snapshot 或来源访问。这将首个阻断限定为默认 Cloudflare Browser Run 的 session 创建；按单次 Live 边界未以本地引擎重跑。
- 现有 Hybrid diagnostic evaluator 对上述三份 probe 仅做不落盘内存兼容性检查：每份都是 `DRAFT_DIAGNOSTIC_ONLY`、0 candidates、`completion/evidence=NOT_EVALUATED`。它只适用于完整生产组合 artifact，故没有创建不适用的 evaluator sidecar，也没有独立评价通过的声明。
- 修复后授权 localhost 的 `npm run test:browser:fixture`: **17/17 PASS**。这是真实本地 Chromium 加合成页面的离线门禁，覆盖 dialog、日期/人数、公开新页、filters、slider/scroll 和 Tabelog 控件；不访问真实来源，也不改变本轮 Live 结论。

## TEST-2026-09-17-REGRESSION-DEFENSE-GENERALIZATION

- 五案 code-contract（真实 Hybrid composition + 独立 `SYNTHETIC_CONTROL` 来源）**6/6 PASS**；聚焦 composition/evaluator **78/78 PASS**。其中包含独立候选集合截断变异、前批事实丢失、请求更新/时钟/取消、来源额度耗尽、固定种子缩减，以及候选/请求/证据/展示链路的配对反例。
- `npm run typecheck`、`npm run build`、`npm run arch:check`、`git diff --check` PASS。沙箱 `npm test` 为 377 pass / 15 loopback `EPERM` 环境失败；授权 localhost 重跑为 **392/392 PASS**。沙箱浏览器 fixture 被 Mach-port 权限拦截；授权本机 Chromium 运行了真实 DOM 路径，但输出捕获截断，未将其报告为完整计数。
- 每案一次 fixed-source real-model（30-call cap）：H001 Runner 坐标绑定失败且未重试；H002 `NEEDS_INPUT`，H003 `NO_VERIFIED_RESULT`，H004 `FAILED`，H005 `PRESENT_RESULTS`。各 artifact 与独立 evaluator sidecar 位于 `.eval-artifacts/restaurant-fixed-source-model/`，均为 synthetic-source，不是 Live 证明。
- 每案一次 Live Read-only：H001/H003/H005（candidate≤5、model≤30、Google≤10、browser-operation≤30，30s；H001 first attempt 60s）均 `CANCELLED`，分别 4/5/3 model calls；artifact 标记 `DIRTY`，不作为 clean baseline 或来源结果。无预订、支付、取消或其他外部写。
- 分类与未覆盖范围见 [coverage report](REGRESSION-TEST-DEFENSE-REPORT-2026-09-17.md)：真实模型理解、自由文本质量、网站事实/兼容性、反爬与搜索完备性仍未由离线测试证明。

### Controlled migration sample follow-up

- `new-vegetarian-lunch` 以新来源记录和不同的菜系/排除条件/午餐时段/人数/命名区域，复用相同 fixed-source factory 与 Hybrid composition；定向 **7/7 PASS**，默认授权 localhost `npm test` **393/393 PASS**。它是已暴露受控迁移样本，不是私有 Holdout、真实模型或 Live 结果。

- `evaluation-location-selection.test.ts`：命名 `NEAR` 区域不绑定固定评估坐标，只有 `NEAR_USER` 绑定；避免 H001 fixed-source Runner 的已记录配置失败再次发生。与 H001–H005/新样本定向合计 **8/8 PASS**，`typecheck` 与 `git diff --check` PASS。

### H001 authorized corrective fixed-source model run

- 用户明确授权一次修正后 H001 重跑（最多 30 model calls；离线固定 HTTP/页面；无 Live/写操作）。artifact 为 [H001 result](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-17T09-02-23-359Z-4ce73364-d91e-4f20-b103-91c299dbde44.result.json) 与独立 evaluator sidecar。`SUCCEEDED` / `TERMINAL` / `PRESENT_RESULTS`，5 model calls、Google fixed-source 3、10722ms；evaluator@15 六个维度均 `SATISFIED`，qualified YES。首个错误尝试仍保留，不被覆盖。
- 最终授权 localhost 默认 `npm test`: **394/394 PASS**，0 fail/cancel/skip/todo，15317ms；包含 H001 坐标选择回归与新迁移样本。

## TEST-2026-09-17-FIXED-SOURCE-TEST-MECHANISM-REMEDIATION

- A: `fixed-source-acceptance.test.ts` PASS **4/4**. It rejects positive terminal no-result, missing evidence and evaluator failure; permits a declared no-result without reporting the user goal complete; only a fully supported positive has exit code 0.
- B: `fixed-source-case-execution.test.ts` plus `live-run-deadline.test.ts` PASS **4/4**. A frozen injected business clock cannot freeze the independent real deadline; ignored cancellation settles, late output does not rewrite the returned terminal record, and a normal result remains terminal. Existing immediate-expiry state/validator tests remain in the default suite.
- C/D: fixed-source candidate scoping, wrong retrieval, wrong party coverage-gap, all five raw H cases, and registered `new-vegetarian-lunch` control/evaluator/acceptance path pass in the focused set. Missing source evidence fails the unified acceptance path; unregistered/missing bindings are explicit errors.
- Focused command (`fixed-source-acceptance`, `fixed-source-case-execution`, `current-development-fixed-sources`, `current-development-offline`, `diagnostic-evaluator`, `live-run-deadline`): **62/62 PASS**. `npm run typecheck`, `npm run arch:check`, `npm run build`, `git diff --check`: PASS.
- Sandboxed `npm test`: 389 pass and 15 `127.0.0.1` listen `EPERM` environment failures only. Unchanged authorized local rerun: **404/404 PASS**, 0 fail/cancel/skip/todo, 16423ms. `npm run test:browser:fixture`: **17/17 PASS** using local Chromium and synthetic pages only.
- Classification: offline code-contract, local HTTP and synthetic local Chromium evidence. No paid model, Live/Replay, external site access, booking or other external write. It does not prove real-model free-text quality, current website compatibility/inventory, anti-bot behavior, factual freshness or search exhaustiveness. The historical model/Live diagnostic red results remain unchanged.

## TEST-2026-09-17-FIXED-SOURCE-CLOSURE

- Baseline 987c77e; focused fixed-source source/clock/acceptance command: **23/23 PASS**. It covers independent Google/TableCheck address/phone identity, a same-phone distinct branch, A-to-B entrance reuse with B re-identification, cited non-verbatim positive HARD judgment, structured Google/TableCheck/browser coverage gaps, configured Google 404, selector-specific waitFor, and separate t1/t2/t3 source observation timestamps.
- npm run typecheck, npm run arch:check, and npm run build: PASS. Sandboxed npm test produced 395 pass plus 15 local 127.0.0.1 listen EPERM environment failures; unchanged authorized local rerun: **410/410 PASS**, no test failure/skip/todo.
- Sandboxed local Chromium failed before page setup because macOS denied the browser Mach port. Authorized local Chromium fixture streamed 18 passing synthetic local-page controls, including requested-update and missing-marker wait controls; the host wrapper did not emit its aggregate line. No external website/navigation was used. This runtime distinction is retained rather than classifying it as a source/product failure.
- Classification: offline transport/adapter/composition/acceptance regression. No model, Live, Replay, Google, Cloudflare, restaurant website, booking, Gold or Prompt run/change. [Detailed matrix and limits](FIXED-SOURCE-CLOSURE-2026-09-17.md).

## TEST-2026-09-17-CONTROLLED-STOP-ARTIFACT-ACCEPTANCE

- Concrete counterexample before the change: an actual model-call budget was collapsed by the coordinator to `MODEL_FAILURE / FIXED_SOURCE_CASE_NOT_COMPLETED`; the persisted artifact no longer carried `MODEL_CALL_BUDGET_EXHAUSTED`, and evaluator/acceptance could not distinguish it from a generic failure.
- Actual repair: the fixed execution boundary preserves the original controlled transport failure code and call count; evaluator/rubric@16 reads the immutable execution record for `CANCELLED` and `MODEL_CALL_BUDGET_EXHAUSTED`; acceptance requires the declared matching completion kind, not merely a non-qualified result.
- Focused offline command: `npm run typecheck && node --import tsx --test src/eval/restaurant/agent-loop/fixed-source-case-execution.test.ts src/eval/restaurant/agent-loop/fixed-source-acceptance.test.ts src/eval/restaurant/agent-loop/diagnostic-evaluator.test.ts` — **50/50 PASS**. The new test uses real controlled abort and one-call-budget executions, writes temporary result artifacts plus evaluator sidecars, verifies each matching acceptance is `PASS / NOT_COMPLETE`, and verifies the budget artifact fails a cancellation expectation. No evaluator result is hand-filled in that chain.
- Full offline gates: `npm run typecheck`, `npm run arch:check`, authorized loopback `npm test` (**411/411 PASS**), and `npm run build` passed. The sandboxed default suite was **396 pass / 15 fail** only because its existing local HTTP tests cannot bind `127.0.0.1` (`EPERM`); the authorized rerun resolves that environment limitation without changing the test set.
- Classification and limits: no paid model, Live, Google, Cloudflare, restaurant site, Replay, booking or external write. The controlled model ceiling proves offline stop accounting, not real-model pricing/cost, model understanding, source behavior, website compatibility or inventory.

## TEST-2026-09-17-AFTERNOON-INDEPENDENT-REVIEW

审查基线565b08f。独立重跑TableCheck、Tabelog、LiveBrowserAvailability、fixed-source acceptance/execution、diagnostic evaluator共105/105通过；未重跑全量411项或其他门禁。旧三个identity反例关闭。直接回放早上已保存的真实身份字段，Inase/涩谷Hajime的地下1階与B1F错误CONFLICT，电话相同仍MEDIUM；离线真实Adapter首导航探针确认正常googleMapsUri遮蔽合法googleWebsiteUri。生产源码未改，无模型/网络/新Live。脚本、结果、日志及历史运行限制见[报告](../../.eval-artifacts/afternoon-review-2026-09-17/REPORT.md)。

## TEST-2026-09-18-H002-PARTY-SIZE-SUPPLEMENT-DIAGNOSTIC

- Focused offline gate: `npm run typecheck`, `node --test --import tsx src/domains/restaurant/party-size-supplement-resolver.test.ts`, and diagnostic preflight all passed. The test proves object-root/non-empty strict parameters, canonical UNKNOWN normalization, and extra-field fail-closed behavior; it does not prove a provider accepts the schema or model inference quality.
- Authorized real-model sequence preserved four immutable 8×3 artifacts. The first three batches each dispatched 24 calls and were rejected before completion (detailed causes retained for batches two/three: root must be object; empty object forbidden). The fourth batch dispatched and completed 24/24 with no retries, Google, browser, or booking calls. Its semantic gate is REJECTED: H002 1/3; seven controls 3/3. Raw outputs and ledger are linked from [the closure report](H002-H003-H004-SEMANTIC-CLOSURE-2026-09-18.md#h002-subsequent-provider-schema-repair-and-authorized-reruns).
- Classification: real-model diagnostic evidence, not production or Live read evidence. No production integration, Gold/Holdout/H005 change, commit, push, or independent Review occurred.

## TEST-2026-09-18-H002-SEMANTIC-ARITY-V2

- Candidate contract: focused resolver tests **3/3** prove strict non-empty object-root transport, UNKNOWN sentinel normalization, fail-closed extra output, AVAILABILITY-plus-missing-party guard, Recommendation/H004 and primary-party no-call, and one-attempt behavior. `typecheck`, `arch:check`, `build`, and `git diff --check` pass.
- Real-model diagnostic: a pre-dispatch frozen/hash-recorded 14-sample × 3 plan ran **42/42** completions, **32,958** reported tokens, zero retry/Google/browser/booking. H002 and all newly added semantic-arity/modifier controls were 3/3. Existing relational-three and blind enumerated-three were 0/3 due to `EXPLICIT` provenance for a correctly inferred count. The declared all-controls gate is therefore **REJECTED**. Artifact: [result.json](../../.eval-artifacts/party-size-supplement-diagnostic-2026-09-18/party-size-semantic-arity-v2-2026-09-18T08-44-12-699Z-78917c4c-bd3c-41e1-a84b-fecf0e7a179a/result.json).
- Final retained-tree offline suite in authorized loopback mode: `npm test` **441/441 PASS**; sandboxed preliminary run had 19 `127.0.0.1` `EPERM` environment-only failures. H002/H004 fixed-source, H003, H005, Live, Browser, and external writes were not run. The rejected candidate is not production-integrated.

## TEST-2026-09-18-H002-H003-SEMANTIC-CONTRACT-CLOSURE

- H002 real-model wire gate: **ACCEPTED**, 4 frozen samples ×2 = **8/8** completions, no retry/Google/browser/booking; actual response model `deepseek-flash`, 5,494 total tokens, 6,286ms aggregate latency. The preflight configured `deepseek-v4-flash`; that effective-model discrepancy is retained in the artifact.
- H003 real-model strength gate: **REJECTED**, 6 frozen categories ×3 = **18/18** completions, no retry/Google/browser/booking; actual response model `deepseek-flash`, 112,960 total tokens, 27,709ms aggregate latency. HARD exclusion/type, explicit SOFT, and both ambiguous UNSPECIFIED controls are 3/3. The H003 four-criterion primary sample is 1/3 because two outputs add `suitable for a team dinner`; no retry or Prompt change followed.
- Offline implementation evidence: focused **74/74 PASS**; `npm run typecheck`, `npm run arch:check`, `npm run build`, and `git diff --check` PASS; authorized loopback full suite **443/443 PASS**. The ordinary sandbox full suite had local `127.0.0.1` EPERM failures only; no changed test was skipped.
- Stop boundary: H003 failure prevents H002/H003/H004 fixed-source real-model runs. H005 model/fixed-source/Live, all browser/Google/web source work, booking, Gold/Holdout, commit, and push were not invoked. Artifacts and review handoff are in [semantic contract closure](H002-H003-SEMANTIC-CONTRACT-CLOSURE-2026-09-18.md).
- Review follow-up: default suite now includes `src/application/*.test.ts`; evaluator/rubric is @17 and adds paired UNSPECIFIED nonblocking/review/HARD-mismatch coverage; same identity conflicting strengths are explicit compiler conflicts. Authorized loopback rerun: **446/446 PASS**. No model or source call followed. Persistent Postgres concurrent-request/refresh resolver coverage remains an explicitly open independent-review item.
## TEST-2026-09-18-H002-H003-SEMANTIC-CONTRACT-REVIEW-FOLLOW-UP

### Fixed-source real-model closeout

- After the original researcher's independent mutation check accepted the
  persistent single-flight regression, exactly one real-model fixed-source read
  ran for H002/H003/H004. Every run used `SYNTHETIC_CONTROL`, offline fixed
  transport/pages, `300000ms/50 steps/50 calls`, no external write, and the
  exposed YAML SHA `ef57893638be2cbc295cb14295d24b6d2d7bdc2918da83de68c48ae839ca7699`.
  Requested config was `deepseek-v4-flash`; returned invocation labels were
  `deepseek-flash`, recorded without asserting a backend switch.
- H002: 9 calls / 29,020 tokens / 13,350ms, three displayed request-bound
  slots. The primary parser omitted party size but one supplement call supplied
  `2/INFERRED_CLOSED_PARTY`. Strict evaluator/acceptance are `NO/FAIL`; the
  researcher accepted only the party sub-goal, not the full case.
- H003: 4 calls / 19,411 tokens / 8,095ms, three displayed request-bound slots;
  strict evaluator/acceptance are `UNKNOWN/FAIL`, while independent review
  accepts this bounded case. H004: 7 calls / 21,375 tokens / 8,711ms, three
  cafe recommendations; strict evaluator/acceptance are `UNKNOWN/FAIL`, and
  independent review rejects its SOFT→UNSPECIFIED non-regression.
- Raw started/result/evaluator paths and the exact non-retry boundary are in
  [semantic contract closure](H002-H003-SEMANTIC-CONTRACT-CLOSURE-2026-09-18.md).
  H001/H005/Live were not run; no Prompt, Gold or fixture was changed after
  these results.

- The H002 persistent path now has an authorized loopback PGlite/HTTP regression:
  primary explicit and inferred counts persist, UNKNOWN/transport failure remain
  `NEEDS_INPUT`, existing Draft counts are not overwritten, and recommendations
  do not call the supplement. A gated duplicate `submitMessage` delivery joins
  the in-flight `(taskId, requestId)` work before stale-version validation;
  completed replay and a legal presented-result refresh make no second
  supplement call. `src/server/local-web-server.test.ts`: **24/24 PASS**.
- The first version of that regression exposed a real ordering defect: the
  in-flight guard sat after optimistic-version validation, so a duplicated
  delivery could receive `StaleTaskVersionError` while the first resolver call
  was still active. A second review found a check-then-set window in that first
  repair. The final form synchronously sets one complete `submitMessageOnce`
  Promise immediately after authenticated conversation lookup; its regression
  dispatches both messages in the same tick, observes that the second actually
  awaits the in-flight Promise, and separately fails if a second resolver call
  occurs. This is offline PGlite/local-loopback evidence only.
- The H003 compiler regression now covers `ASSERT` strength transitions
  UNSPECIFIED→HARD, UNSPECIFIED→SOFT, HARD→SOFT through Proposal→Compiler→
  Reducer while retaining an unrelated criterion and opposite polarity. It does
  not claim `CORRECT` is incremental: existing `CORRECT` remains collection
  replacement. The evaluator is `restaurant-hybrid-read-diagnostic-evaluator@17`.
- No real model, Google, browser, restaurant site, source fixture, H005,
  Gold/Holdout, booking, commit, or push was run in this follow-up. H003's
  historical automatic gate remains rejected; the supplemental semantic review
  remains pending original-researcher signoff.

## TEST-2026-09-18-SEMANTIC-CONTRACT-V6-OFFLINE

- Baseline: `a66ef8a8e62c68339adb83c0b8c7aef8086b4923`; the historical
  `restaurant-read-development@5` YAML SHA is
  `ef57893638be2cbc295cb14295d24b6d2d7bdc2918da83de68c48ae839ca7699`.
  Current executable data is @6; old artifacts and evaluations were not edited.
- `npm run typecheck`: PASS. Focused command covering semantic Prompt contract,
  current YAML materializer, actual fixed Hybrid composition, diagnostic
  evaluator, fixed-source acceptance and the Proposal→Compiler→Reducer
  multi-turn strength control: **71/71 PASS**, 0 fail/cancel/skip/todo.
- Detection controls: a H002-shaped final-label/source-fact record is
  `REQUIRED_EVIDENCE=SATISFIED` but `AUTHORITATIVE_CONDITIONS=NOT_EVALUATED`;
  reversing polarity on the exact text is `NOT_SATISFIED`. A later HARD upgrade
  accepts a new HARD-context observation and rejects the otherwise identical old
  UNSPECIFIED-context observation at required-evidence/final-claim assertions.
- Classification: offline code-contract and synthetic fixed-source evidence.
  No real model, Google, website, browser, Live, Replay, booking, payment,
  cancellation, Gold/private Holdout access, commit or push. Full offline
  gates passed: `npm run arch:check`, `npm run build`, `git diff --check`, and
  the authorized local-loopback `npm test` (**451/451 PASS**, 0 failures).
  The initial sandbox-only test invocation had **430 pass / 21 fail** solely
  because existing local HTTP cases could not bind `127.0.0.1` (`EPERM`); the
  rerun did not change the test set or enable external transport.
- H002 historical-result supplement: evaluator@18 wrote a new sidecar beside,
  and did not alter, the @5 source result SHA-256
  `e9a1ed498cc6c484bb12c29655fb2622b147fba1a44653e7431ec624cf368aaf`.
  It records `systemBehavior=NOT_EVALUATED` for text without deterministic
  equivalence and `evidenceSufficiency=SUFFICIENT_FOR_PRESENTED_RESULT` for
  the final executed observation context. This verifies the split in one real
  saved artifact; it is not a semantic acceptance, Gold rewrite, or model run.
  Original-researcher pre-review remains required before any paid run.
- Second pre-review correction: the original evaluator used a text-keyed `Map`,
  which collapsed distinct `text + polarity` criteria. The regression now
  passes an identical two-polarity `quiet` collection and rejects a true
  exact-text polarity replacement. The initial scorer-only strength control is
  retained as a local lineage check but no longer claimed as the complete
  behavior. A new actual-Hybrid two-turn control starts from the real
  Interpreter/Runtime composition: it first presents an `UNSPECIFIED`
  vegetarian result, submits a second user turn making it HARD, verifies that
  `SEMANTIC_PROPOSAL_COMPILED` clears card/evidence and increments the request
  revision, then proves an old-card presentation is Validator-rejected without
  a current fact read. The paired normal control produces current cited HARD
  evidence through Router/Reducer and passes evaluator grounding. Targeted
  `typecheck` plus evaluator/Hybrid suites: **59/59 PASS**, no external call.
- Full recheck after that correction: `npm run typecheck`, `npm run
  arch:check`, `npm run build`, `git diff --check`, and authorized local
  loopback `npm test`: **455/455 PASS**, 0 fail/cancel/skip/todo, 18,758ms.
  The loopback allowance is only for existing PGlite/local HTTP tests; it does
  not enable model, Google, site, browser, or Live transport.
- Authorized fixed-source real-model post-review batch: H002 → H003 → H004 exactly once each, `deepseek-flash` / Semantic Prompt@v21, each capped at 300,000ms/50 steps/50 model calls and using fixed synthetic source transport only. All three executions were `SUCCEEDED/TERMINAL/PRESENT_RESULTS` and independently had `REQUIRED_EVIDENCE=SATISFIED`; all three automatic evaluations were `NOT_EVALUATED` on non-identical criterion wording and registered acceptance was `FAIL`. H002: 9 calls/28,922 tokens/8,814ms; H003: 4/19,518/6,727ms; H004: 7/21,405/6,461ms. Aggregate: 20 calls, 69,845 tokens, 22,002ms, 10 fixed Google-composition calls, zero browser calls. H005/Live/booking/commit/push were not run. Results await original-researcher semantic review; no automatic repair or rerun followed.
- Post-run annotation-only sync: the exact run-time @6 YAML was copied as an immutable audit snapshot with SHA-256 `75bf64732a9148720bb3d448c3fd53326195e8d7517d8689f80cec63e34df12b` before correcting only H002/H004 `acceptance.review` prose. The current YAML SHA is `00b69476e6d07eec5dcd9a657555c4e3766629fce5f8e630512710252886ffb6`; content, semantic expectations, source scenarios, code, original artifacts and existing scores were not changed, and no model/evaluator rerun occurred.


## 2026-09-18 — Independent semantic-contract @6 checks

Independent evaluator/current-development tests 59/59. Isolated old text-Map comparison fails the intended identical-polarity-set assertion; retaining Runtime old readEvidence fails real two-turn reset assertions. Original no-match identity probe excluded. Saved three-run input hashes/structured Proposals/State/citations/batch targets and original @18 findings independently checked; bounded manual acceptance 3/3, original AUTO remains FAIL 3/3. No extra model/source calls. Evidence .eval-artifacts/semantic-contract-migration-independent-review-2026-09-18/. Full 455/455 and typecheck/arch/build are Terra-run gates, not claimed as repeated independent runs.


## 2026-09-20 H005 locality matrix independent stop review

2026-09-20 **H005 locality Prompt@4 matrix 独立复核未通过，按停止条件结束**：L1–L8×3共24次真实模型、零重试、20,548 tokens；24份原始请求/响应及逐次落盘记录已核对。L3（Tokyo + Japanese restaurant）3/3错误SUPPORTED并进入verifiedHardCriteria；L5为CONFLICT/UNKNOWN/UNKNOWN，未误接纳，但Italian样本带地域信息，不能干净隔离location-only，预审遗漏已承认。L1/L2/L8正例9/9、L4/L7不足证据6/6、L6地区不匹配3/3均符合各自预期，仍不足以接纳Prompt@4。当前@4仅未提交候选，H005 fixed-source、Live、Prompt@5均未运行；禁止自动重跑。详见[独立矩阵复核](../../.eval-artifacts/h005-locality-independent-review-2026-09-20/MATRIX-REVIEW.md)。

独立复核未新增模型调用；前置定向检查14/14、typecheck及diff check通过，只证明预审代码边界。原始矩阵及Gold不改写。


## 2026-09-20 Local Food Semantics v2 independent stop review

2026-09-20 **Local Food Semantics v2：Prompt@5 / matrix@2 独立复核仍未通过**。用户已将普通local food定义为目的地本土料理，旧matrix@1失败记录保持原口径不回写。新12样本×3共36次、零重试、32,301 tokens；10个普通local-food样本30/30正确，窄地域冲突N2为3/3 CONFLICT；唯一失败N1（Tokyo regional food + Japanese restaurant）3/3错误SUPPORTED并生成verifiedHardCriteria。独立核对全部36份请求/原始输出及72个逐次记录，确认不是criterion漏传或评分误判。按预定gate停止，不运行H005 fixed-source/Live，不自动Prompt@6。[独立逐项结果](../../.eval-artifacts/h005-locality-independent-review-2026-09-20/matrix-v2-independent-review.json)。

## TEST-2026-09-20-H005-LOCALITY-PROMPT-6-MATRIX

- Focused local contract command covering Fact Judgment Prompt@6, dispatch/settled journal immutability, matrix request shape and scorer controls: **18/18 PASS**. `npm run typecheck` and `git diff --check` passed before the authorized matrix; no fixture, Gold, source fact or fixed-source acceptance path was changed.
- Final repository gates: `npm run arch:check`, `npm run build`, `npm run typecheck`, and `git diff --check` all passed. `npm test` first reported 444 pass / 21 fail only because the restricted sandbox denied the existing localhost listener (`listen EPERM 127.0.0.1`); the identical offline suite with localhost permission then passed **465/465**. Neither invocation enabled provider, Google, browser or Live transport.
- Authorized model evaluation only: matrix@2, 12 samples × 3 repetitions, 36 exact provider attempts, zero retries, `deepseek-flash`; all calls returned valid structured results. The runner recorded 36 dispatch and 36 settled immutable attempt journals, plus started/result records. Total provider usage: **34,383 tokens**, summed model latency **28,604ms**; Google/browser/booking use was zero.
- Result: **FAIL / stopped**. N1 (`Tokyo regional food` + Japanese restaurant) was `UNKNOWN` 3/3 and N2 (`Tokyo regional food` + Kyoto regional cuisine) was `CONFLICT` 3/3, but V2-L5 (Tokyo + Kyoto regional cuisine + unqualified `local food`) was `UNKNOWN` 3/3 where the frozen expectation is `SUPPORTED`. The raw responses and accepted citations are valid, so this does not establish a wire/scorer defect. No Prompt@7, H005 fixed-source run, Live run, Gold rewrite or retry followed. Evidence: [matrix result](../../.eval-artifacts/restaurant-locality-fact-judgment-matrix-v3/2026-09-20T04-32-59-815Z-2c991cb2-fd3c-44d0-8bf1-438f077fb673.result.json) and [independent V3 status](../../.eval-artifacts/h005-locality-independent-review-2026-09-20/TERRA-V3-PHASE-STATUS.md).

## TEST-2026-09-20-H005-LOCALITY-EXPLICIT-SCOPE-AND-FIXED-SOURCE

- The one-line Prompt@6 wording revision passed `node --import tsx --test src/integrations/restaurant-facts/model-fact-judgment.test.ts`: **8/8 PASS** and `git diff --check` passed. The matrix uses the unchanged frozen matrix@2 shape, source facts and scorer.
- Authorized real-model matrix: 12 samples × 3 repetitions, **36/36 provider attempts**, zero retries, 36 valid structured responses, no Google/browser/booking calls. `matrixPassed: true`; V2-L5 `SUPPORTED` 3/3, N1 `UNKNOWN` 3/3, N2 `CONFLICT` 3/3 (zero `SUPPORTED`), and no other case run failed. Recorded total: **36,006 tokens**, summed model latency **33,971ms**. Evidence: [matrix result](../../.eval-artifacts/restaurant-locality-fact-judgment-matrix-v3/2026-09-20T05-30-02-765Z-21112f4f-4c99-4808-942b-69718a8c55b2.result.json).
- Conditional first H005 fixed-source execution: one `SYNTHETIC_CONTROL` case, 50 model calls/50 steps/300,000ms ceilings. It used 8 model calls (1 semantic, 4 agent, 3 fact judgment), 28,522 tokens and 10,877ms; fixed source calls were discovery 1, details 3, website facts 3 and TableCheck availability 3. All three candidates had local-food verification and current availability; b lacked only verified-negative `fast food` evidence, so the system presented 2 instead of the registered 3-result batch (`met:false`). Execution was `SUCCEEDED/TERMINAL/PRESENT_RESULTS`; fixed-source acceptance was **FAIL** for the incomplete batch, not for local-food scope, a provider/source failure or no availability. No Live/retry/follow-up mutation occurred. Evidence: [result](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-20T05-31-02-832Z-b5b0f649-c053-47df-bb5c-61dbf40a049d.result.json).

## TEST-2026-09-20-H005-PHASE-1-FIXED-SOURCE-BATCH-CONTRACT

- Targeted offline contract suite: `node --import tsx --test src/eval/restaurant/agent-loop/fixed-source-acceptance.test.ts src/domains/restaurant/action-validator.test.ts src/eval/restaurant/agent-loop/current-development-offline.test.ts` — **46/46 PASS**. It proves default `3/3/true` passes and reports the target; legal source-limited default `3/2/false` also passes and reports it; user-explicit `3/2/false` fails; user-explicit `2/2/true` passes; and a `QUALIFIED_RESULT` with zero candidates fails. It additionally proves that State `requestedResultCount=3` plus a missing/mismatched `USER_EXPLICIT` registry expectation fails closed rather than being labelled a default batch. A registered control carries an explicit two-result request through Interpreter/Compiler/authoritative State into acceptance and passes only at `2/2/true`. The existing Action Validator regression now uses two qualified candidates, independently preserving rejection of an early `2/3` partial batch while additional read remains legal, and records the shortfall only once source reads are exhausted. The H005 offline composition supplies the real `NO_VERIFIED_RESULT`/no-presentation control rather than treating a hand-built empty array as success.
- Static safeguards for this Phase 1 code slice: `npm run typecheck`, `npm run arch:check`, and `git diff --check` all passed. The Phase 4 whole-suite/build gate remains intentionally unrun because the authorized work stops before Phase 2/3; this is not a full H005 or Live acceptance.
- The first targeted run exposed one real test-composition omission: a shared fixed-source execution/evaluator test supplied no final presentation record to the strengthened acceptance function. The test now projects candidate IDs, Runtime batch target and authoritative `intentDraft.target.requestedResultCount` from the same final State that the real runner uses. This is a test-path repair, not a relaxed acceptance rule.
- Independent before/after evidence is retained separately. The pre-fix assessment records that the same qualified default `3/2/false` result failed solely for batch count; the read-only reassessment of the immutable historical H005 artifact now returns **PASS/COMPLETE** with `defaultBatchTarget: { target: 3, actual: 2, met: false }`. A post-review negative control preserves the distinct State-count/registration-omission false PASS and its new failure result. Evidence: [pre-fix failure](../../.eval-artifacts/h005-2026-09-20-phase1-terra/pre-fix-default-short-batch-acceptance.json), [offline reassessment](../../.eval-artifacts/h005-2026-09-20-phase1-terra/h005-fixed-source-offline-reassessment.json), and [omission rejection](../../.eval-artifacts/h005-2026-09-20-phase1-terra/post-review-explicit-count-registration-omission.json). No provider, browser, Google, website, booking or Live execution occurred.
## TEST-2026-09-20-H005-PHASE-2-CATEGORY-NEGATIVE-OFFLINE

- Focused production/evaluator composition: `node --import tsx --test src/eval/restaurant/agent-loop/category-negative-fact-judgment-matrix.test.ts src/integrations/restaurant-facts/model-fact-judgment.test.ts src/domains/restaurant/action-validator.test.ts src/eval/restaurant/agent-loop/diagnostic-evaluator.test.ts src/eval/restaurant/agent-loop/current-development-offline.test.ts` — **100/100 PASS**. Covers frozen F1–F8/16-attempt matrix shape, cited category `UNKNOWN` eligibility without verified-negative promotion, conflict priority, non-category fail-closed behavior, generic raw type routing, name-only rejection, independent evaluator citation/identity/currentness reconstruction, H001–H005 offline composition and the existing user-turn strength reset path.
- No paid model, Google, website, browser, fixed-source real-model run, Live run, booking, Gold/private Holdout access, commit or push. Matrix design is not execution evidence.


## 2026-09-20 H005 final review — Mock gates pass; real-model matrix rejected

Targeted preflight 110/110; Hybrid composition 33/33. Full Mock npm test 483/483 after rerunning with permitted localhost listening (initial sandbox result 462 pass / 21 EPERM). typecheck, arch:check, build and diff check passed. Real-model synthetic matrix: 16 attempts, zero retries, 20,618 tokens; F1–F7 14/14, F8 0/2 (UNKNOWN instead of CONFLICT). H005 Phase 3 and Live NOT RUN. No model calls after matrix failure. See [independent review](H005-CATEGORY-NEGATIVE-REVIEW-2026-09-20.md) for immutable artifacts, actual behavior coverage, failure attribution and limits.


## 2026-09-20 H005 F8 UNKNOWN attribution follow-up

Six offline saved-response/counterfactual controls reconstructed both original F8 requests exactly and isolated model output from production claim acceptance. Original UNKNOWN is retained; counterfactual CONFLICT becomes violation with grounded identity and is rejected without identity. Valid 86-token original outputs exclude truncation/fallback as the source of UNKNOWN. Zero new provider calls; no production edits or full-suite rerun. [Findings and evidence](H005-CATEGORY-NEGATIVE-REVIEW-2026-09-20.md#follow-up-why-grounded-mcdonalds-returned-unknown).


## 2026-09-20 Worktree H001–H005 rerun independent comparison

Read-only reevaluation of five saved worktree-1135 artifacts: H001/H005 all dimensions SATISFIED; H002–H004 grounding/investigation/resources SATISFIED and wording NOT_EVALUATED. All three complete criteria arrays, request fields and raw-user hashes match their 2026-09-18 manually accepted counterparts. Bounded manual semantic acceptance retained; original AUTO_FAIL untouched. Zero new model/source calls, no production edits. [Comparison](FIXED-SOURCE-SEMANTIC-COMPARISON-2026-09-20.md).


## 2026-09-20 Prompt@8 integration and pre-commit verification

- Scope: integrate the final accepted worktree implementation, preserve historical runs and separate automatic/manual fixed-source acceptance.
- Read-only raw artifact checks: Prompt@8 F1-F8 x2 **16/16 PASS**; F8 remains generic restaurant type plus HIGH source-grounded entity; exact prompt equals integrated production text. Original 12:32 network failure and Prompt@7 14/16 failure remain unchanged. Successful matrix SHA256: `e7ac796136faf6d98d1efc02a3ac766fe635f8706ad5eaa76e6c7178f11c5400`.
- Production comparison: 138 tracked non-test src files byte-identical to worktree 1135. Local-food paragraph SHA256 unchanged: `49c15a0186b7917a56d096ee1cc03c53f25018164f0779b8f2309b352db63193`. No Gold/source fixture changes.
- Integrated code gates: `npm run typecheck`, `npm run arch:check`, `npm run build`, `npm test` **483/483 PASS**, no skips/todo, `git diff --check` PASS. Full tests use authorized loopback permission; no .env or paid provider access.
- Existing real-model evidence reused: one H005 AUTO PASS, then H001-H005 all three-candidate presentations; H001/H005 automatic PASS, H002-H004 bounded independent manual semantic acceptance with original automatic FAIL retained. No fresh paid-model, real Google/browser source, private Holdout or booking calls.
- Logs and file/hash manifest: `.eval-artifacts/h005-commit-verification-2026-09-20/`. Persistent run hashes and review: [five-case comparison](FIXED-SOURCE-SEMANTIC-COMPARISON-2026-09-20.md), [category review](H005-CATEGORY-NEGATIVE-REVIEW-2026-09-20.md#prompt8-follow-up-and-commit-integration). Artifacts remain Git-ignored; this exposed fixed-source evidence is not Live or a Clean Baseline.
