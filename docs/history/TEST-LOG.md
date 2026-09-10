# Test and Verification Log

- Status: Accepted
- Document revision: 4.40
- Last updated: 2026-09-09
- Source of truth for: 每次验证结果、模式、未覆盖项和外部副作用
- Related ADRs: [ADR Index](../decisions/README.md)
- Related documents: [Current Status](../STATUS.md), [Test Skill](../skills/test/SKILL.md), [Harness Design](../harness/HARNESS-DESIGN.md)

> Historical record only. The current evidence summary and known gaps are maintained in [Current Status](../STATUS.md).

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
