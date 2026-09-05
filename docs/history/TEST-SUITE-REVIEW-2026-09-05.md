# 2026-09-05 全量自动化测试审查

- Status: Accepted
- Document revision: 0.1
- Review started: 2026-09-05
- Completed: 2026-09-06
- Source of truth for: 本次静态审查范围、处置理由与覆盖去向的历史快照
- 材料状态：`superseded retrospective`（一次性审查记录，不作为未来测试数量或能力基线）
- Related documents: [Test Skill](../skills/test/SKILL.md)、[Test Log](TEST-LOG.md)

## 范围与结论

逐文件读取本轮开始时全部35个`.test.ts`的5808行正文，合计173个测试声明：默认162、冻结探针8、真实浏览器Fixture3；核对package scripts并另全文审查`postgres-live-smoke.ts`。相关实现按断言疑点核对，不声称本次已审计全部生产源码。前轮的H02/H03/H04去重已经包含在本轮起点中。

本轮删除/合并3个独立测试，最终默认159；没有新增独立测试文件或隐藏默认用例。保留必要跨层验证，修正断言不足、错误命名与脆弱实现绑定。测试数量下降不等于质量提升，也不代表剩余测试永久不可删。

以下按审查起点原名称逐项列出，文件说明明确共同保留理由及局部调整。它是审计快照，无需每次开发同步全表；日常只审查改动影响的测试并遵守Test Skill。人工Golden、私有Holdout、既有artifact内容不纳入整理。

## 单独Live测试入口

`src/infrastructure/postgres/postgres-live-smoke.ts`保留：验证真实pg驱动、Migration、Runtime、Goal与Trigger组合，PGlite不能替代。发现原脚本在清理前打印pass且吞掉清理失败，已改为所有自建行及连接清理都尝试、聚合错误、全部成功后才打印pass。实际写入三条Task和一条Goal，配置示例已校正。

本轮未连接真实数据库。对真实脚本转译后置于隔离VM，注入假DB/Runtime/Graph等，验证成功、清理失败、断言与清理同时失败；三种均验证5个清理调用及通过输出/错误结果。此临时故障注入不新增长期测试或平台框架，不冒充真实SQL验证。

## 逐文件与逐测试

### [core/execution/side-effect-ledger](../../src/core/execution/side-effect-ledger.test.ts)

并发去重保护实际写次数；Harness的顺序重放不能替代并发同key执行。保留。

- SideEffectLedger coalesces concurrent writes with one idempotency key — 默认；保留；保护上述模块边界中的该行为。

### [core/policy/policy-engine](../../src/core/policy/policy-engine.test.ts)

成功、缺失授权、过期、非法时间、OUTCOME_UNKNOWN优先级各有不同拒绝机制；保留规则级覆盖，Harness仅证明接入。

- allows a healthy one-time authorized action — 默认；保留；保护上述模块边界中的该行为。
- rejects a missing authorization — 默认；保留；保护上述模块边界中的该行为。
- rejects an expired authorization — 默认；保留；保护上述模块边界中的该行为。
- rejects malformed authorization timestamps — 默认；保留；保护上述模块边界中的该行为。
- OUTCOME_UNKNOWN takes precedence over a new authorization — 默认；保留；保护上述模块边界中的该行为。

### [core/task-runtime/in-memory-task-runtime](../../src/core/task-runtime/in-memory-task-runtime.test.ts)

事件去重、版本拒绝、因果传播、run隔离分别保留。内存与SQL Runtime不是同一实现，不能因名称相同删除其中一组。

- deduplicates an event before applying the transition again — 默认；保留；保护上述模块边界中的该行为。
- rejects a new event carrying a stale task version — 默认；保留；保护上述模块边界中的该行为。
- records causal metadata and propagates it to emitted commands — 默认；保留；保护上述模块边界中的该行为。
- rejects an event whose trace belongs to another run — 默认；保留；保护上述模块边界中的该行为。

### [domains/restaurant/action-validator](../../src/domains/restaurant/action-validator.test.ts)

保留全部5项；在现有Booking用例内添加正确请求对照及日期、人数、过早、过晚的独立拒绝断言。PRESENT_RESULTS从全缺/全有改为同时逐项移除证据，防止第一道检查掩盖其他检查缺失。Reducer积累用例虽放在本文件，保护直接Patch调用的缺失字段与大小写删除，不与Compiler编译链完全等价；本次不为归类拆文件。

- Reducer derives missing fields and accumulates a criterion correction deterministically — 默认；保留；所在文件有局部调整，见本文件说明。
- Action validator binds search to complete authoritative intent — 默认；保留；所在文件有局部调整，见本文件说明。
- Action validator blocks unknown candidates, stale offers, and booking schedule mismatches — 默认；保留；所在文件有局部调整，见本文件说明。
- Action validator rejects availability reads that would repeat a candidate already checked for the current search — 默认；保留；所在文件有局部调整，见本文件说明。
- PRESENT_RESULTS fails closed until area, HARD criterion, identity, and availability are evidenced — 默认；保留；所在文件有局部调整，见本文件说明。

### [domains/restaurant/agent-action](../../src/domains/restaurant/agent-action.test.ts)

移除只检查schema常量required/additionalProperties的独立测试；agent-decision真实组装到mock HTTP请求时已有完全相同字段断言。保留Wire归一化和多余有效字段拒绝。

- strict Agent wire schema requires every provider-facing object property — 默认；删除；agent-decision在实际HTTP请求上的required/additionalProperties断言承接。
- strict Agent wire output normalizes back into canonical restaurant_agent_action@3 — 默认；保留；所在文件有局部调整，见本文件说明。
- strict Agent wire output rejects meaningful fields outside its selected action — 默认；保留；所在文件有局部调整，见本文件说明。

### [domains/restaurant/agent-context](../../src/domains/restaurant/agent-context.test.ts)

保留最小Context投影与权限/Provider字段剔除；Harness和Postgres分别验证使用及存储位置。当前并非完整PII审计。

- Restaurant Agent context is minimal and excludes execution authority and provider artifacts — 默认；保留；保护上述模块边界中的该行为。

### [domains/restaurant/agent-decision](../../src/domains/restaurant/agent-decision.test.ts)

保留严格Wire schema从Agent到Gateway的实际组装与响应归一化/调用审计。接收agent-action删除项的主覆盖职责。

- Restaurant Agent sends a DeepSeek-strict compatible wire schema and restores the canonical action — 默认；保留；保护上述模块边界中的该行为。

### [domains/restaurant/booking-verifier](../../src/domains/restaurant/booking-verifier.test.ts)

四类Evidence判定保留：正确、弱证据、错误Attempt、业务字段冲突。Harness另测这些结论驱动权威终态，不复制整个输入组合。

- confirms strong evidence only when every completion field matches — 默认；保留；保护上述模块边界中的该行为。
- keeps weak evidence inconclusive even when its claims match — 默认；保留；保护上述模块边界中的该行为。
- rejects evidence produced for a different execution attempt — 默认；保留；保护上述模块边界中的该行为。
- reports mismatched restaurant, time and party size as conflicts — 默认；保留；保护上述模块边界中的该行为。

### [domains/restaurant/read-grounding](../../src/domains/restaurant/read-grounding.test.ts)

保留Discovery与Availability证据生成边界；结构接收、地址分量、关键词误匹配、HIGH/时段、未知分类、启动失败与确认无slot为不同事实/失败机制。

- Google discovery accepts structurally valid restaurant places without claiming retrieval criteria as facts — 默认；保留；保护上述模块边界中的该行为。
- Google discovery grounds near Shibuya through an explicit address component, not text query relevance — 默认；保留；保护上述模块边界中的该行为。
- Google discovery does not turn a formatted-address keyword into area evidence when the component is absent — 默认；保留；保护上述模块边界中的该行为。
- availability grounding accepts only high-confidence matching outlet, schedule and visible slot — 默认；保留；保护上述模块边界中的该行为。
- ambiguous, stale, wrong request, browser failure and unsupported observations never become unavailable — 默认；保留；保护上述模块边界中的该行为。
- browser startup failures are preserved rather than misclassified as uncertain entity matches — 默认；保留；保护上述模块边界中的该行为。
- a completed slot extraction with no qualifying slot becomes UNAVAILABLE — 默认；保留；保护上述模块边界中的该行为。

### [domains/restaurant/semantic-compiler](../../src/domains/restaurant/semantic-compiler.test.ts)

保留编译和Patch组合语义；singleton矛盾不依赖顺序、criterion替换/删除与同轮矛盾独立。最后一项改名符合实际：没有传入state就不宣称验证不变性。

- Restaurant Semantic Compiler translates independent corrections and criterion negations — 默认；保留；所在文件有局部调整，见本文件说明。
- Restaurant Semantic Compiler rejects singleton clear-and-set combinations independent of fact order — 默认；保留；所在文件有局部调整，见本文件说明。
- criterion ASSERT adds, CORRECT replaces, and NEGATE removes deterministically — 默认；保留；所在文件有局部调整，见本文件说明。
- Restaurant Semantic Compiler records one-turn contradictions without mutating state — 默认；保留；所在文件有局部调整，见本文件说明。

### [domains/restaurant/semantic-interpreter](../../src/domains/restaurant/semantic-interpreter.test.ts)

删除8条Prompt原文匹配，保留schema、版本、单次调用、用户输入序列化、拒绝State Patch及两次schema预算；原成功用例改验system/user角色、参考时间、当前上下文和用户文本隔离。文案出现不能证明模型理解或安全。

- Semantic Interpreter requests a closed proposal and never asks for state or tool protocol — 默认；保留；所在文件有局部调整，见本文件说明。
- Semantic Interpreter rejects a structurally valid-looking state patch — 默认；保留；所在文件有局部调整，见本文件说明。

### [domains/restaurant/semantic-proposal](../../src/domains/restaurant/semantic-proposal.test.ts)

保留开放criteria、非法operation/value、集合CONFIRM、远端schema限制与本地空白拒绝；是输入边界而非Prompt质量。

- Semantic Proposal Contract accepts stable slots and open criteria without a taxonomy — 默认；保留；保护上述模块边界中的该行为。
- Semantic Proposal Contract rejects internal protocols and invalid operation/value combinations — 默认；保留；保护上述模块边界中的该行为。
- Semantic Proposal Contract rejects collection CONFIRM because it has no deterministic effect — 默认；保留；保护上述模块边界中的该行为。
- DeepSeek transport schema uses only supported string constraints while local validation rejects blanks — 默认；保留；保护上述模块边界中的该行为。

### [eval/restaurant/agent-loop/browser-read-probe](../../src/eval/restaurant/agent-loop/browser-read-probe.test.ts)

保留来源URL限制、挑战优先/跨来源拒绝、晚到session关闭。晚到启动与真实浏览器ready超时是两个故障窗口。

- source probe refuses credentials, lookalike hosts and unsupported schemes before navigation — 默认；保留；保护上述模块边界中的该行为。
- challenge precedes content and a cross-source redirect cannot yield identity or slots — 默认；保留；保护上述模块边界中的该行为。
- deadline includes session creation and late browser sessions are closed without navigation — 默认；保留；保护上述模块边界中的该行为。

### [eval/restaurant/agent-loop/live-case-materializer](../../src/eval/restaurant/agent-loop/live-case-materializer.test.ts)

保留日期及依赖参数同步、输入不变、Friday/afternoon规则。合成输入，不读取真实H001标注。

- live materialization resolves tonight and updates every dependent date without mutating source — 默认；保留；保护上述模块边界中的该行为。
- live materialization handles this Friday and this afternoon in Asia/Tokyo — 默认；保留；保护上述模块边界中的该行为。

### [eval/restaurant/search-fixture/eval](../../src/eval/restaurant/search-fixture/eval.test.ts)

保留一个完整Fixture Eval入口Smoke；其三条路径覆盖入口组织，不拆成每字段重复测试。

- local fixture Search Eval covers full intent, clarification, and selection — 默认；保留；保护上述模块边界中的该行为。

### [eval/restaurant/semantic/exposed-regression](../../src/eval/restaurant/semantic/exposed-regression.test.ts)

四项分别保护计数去重、文本错误归因、可比子集/blocked继续、Gold变更排除。历史分析工具仍可执行，因此保留合成报告测试；不读取或改变真实结果。

- field diagnostics count criteria and singleton mismatches once per turn — 默认；保留；保护上述模块边界中的该行为。
- a criterion text mismatch is not also misclassified as polarity or strength — 默认；保留；保护上述模块边界中的该行为。
- baseline comparison keeps the prompt @4 subset separate and reports newly continued turns — 默认；保留；保护上述模块边界中的该行为。
- common-unchanged comparison excludes a changed Gold turn instead of comparing it — 默认；保留；保护上述模块边界中的该行为。

### [eval/restaurant/semantic/holdout](../../src/eval/restaurant/semantic/holdout.test.ts)

保留格式、Preflight、manifest、stream与产品语义评分。最后一项虽然归在Holdout测试中，使用没有stage oracle的评分分支（SEMANTIC_RESULT），不同于scorer的REDUCER分支；不因相似标题删掉。模板测试只读取公开空模板，不读取私有Holdout。

- semantic Holdout template contains no exposed sample and complete preflight rejects it — 默认；保留；保护上述模块边界中的该行为。
- semantic Holdout preflight accepts a complete labelled dataset with the frozen manifest — 默认；保留；保护上述模块边界中的该行为。
- semantic Holdout preflight rejects duplicates, manifest drift, and inconsistent Gold — 默认；保留；保护上述模块边界中的该行为。
- semantic Holdout adapts the simplified private annotation shape without changing its meaning — 默认；保留；保护上述模块边界中的该行为。
- semantic Holdout gives a standalone simplified case its own structural session id — 默认；保留；保护上述模块边界中的该行为。
- semantic Holdout manifest audit identifies scorer, schema, and prompt configuration — 默认；保留；保护上述模块边界中的该行为。
- semantic Holdout parser accepts a stream of structural annotation documents — 默认；保留；保护上述模块边界中的该行为。
- semantic scorer fails on Draft mismatch and ignores deprecated Decision metadata — 默认；保留；保护上述模块边界中的该行为。

### [eval/restaurant/semantic/regression](../../src/eval/restaurant/semantic/regression.test.ts)

删除“stops at the semantic reducer boundary”：实际只取完整成功Regression的一条已覆盖子集并断言PASS，没有Reducer故障注入。保留全链路、Compiler故障、上游阻断及乱序Proposal归一化；真实REDUCER归因由scorer测试保护，不宣称Runner已独立注入Reducer异常。

- semantic regression runs Proposal, Compiler, and Runtime/Reducer in order — 默认；保留；所在文件有局部调整，见本文件说明。
- development attribution stops at Compiler before Reducer — 默认；保留；所在文件有局部调整，见本文件说明。
- development attribution stops at the semantic reducer boundary — 默认；删除；本文件首项已运行该成功子集；名称声称的失败原本未测试。
- invalid model JSON is attributed to Proposal Contract and blocks downstream turns — 默认；保留；所在文件有局部调整，见本文件说明。
- development attribution accepts a semantically equivalent Proposal with reordered facts — 默认；保留；所在文件有局部调整，见本文件说明。

### [eval/restaurant/semantic/scorer](../../src/eval/restaurant/semantic/scorer.test.ts)

保留Interpreter/Compiler/Reducer首次错误归因、忽略旧Decision元信息、集合规范化。可选stage oracle和产品语义分支区别明确。

- stage scorer assigns valid but wrong meaning to Semantic Interpreter — 默认；保留；保护上述模块边界中的该行为。
- stage scorer assigns a wrong deterministic translation to Compiler — 默认；保留；保护上述模块边界中的该行为。
- stage scorer assigns wrong accumulated state after correct compilation to Reducer — 默认；保留；保护上述模块边界中的该行为。
- semantic scorer ignores the retired ADR-0007 next-step annotation — 默认；保留；保护上述模块边界中的该行为。
- stage scorer treats unordered criteria and facts with case/whitespace-only text changes as equal — 默认；保留；保护上述模块边界中的该行为。

### [eval/shared/diagnostic-run](../../src/eval/shared/diagnostic-run.test.ts)

保留独立开始/结果、防覆盖与敏感URL/错误码处理；操作自建临时目录，不碰既有artifact。

- diagnostic start survives early failure and results cannot overwrite prior evidence — 默认；保留；保护上述模块边界中的该行为。
- diagnostics remove URL credentials, query and fragments and never return raw errors — 默认；保留；保护上述模块边界中的该行为。

### [eval/shared/real-model](../../src/eval/shared/real-model.test.ts)

保留付费门控/价格成对配置，以及调用、重试、usage/估价汇总。Mock记录不是付费模型结果。

- real model Eval requires an explicit paid-network gate and validates optional price inputs — 默认；保留；保护上述模块边界中的该行为。
- real model Eval metrics retain provider metadata, retries, usage and explicitly estimated cost — 默认；保留；保护上述模块边界中的该行为。

### [harness/browser/browser-read-fixture](../../src/harness/browser/browser-read-fixture.test.ts)

3项均保留；真实Chromium动态等待、同页手动Fixture恢复后的身份重验、缺少标记超时。第二项改名去掉“challenge不重试”承诺，因为它直接调用人工Fixture click与观察器；Adapter不自动重试由Tabelog Mock负责。动态250ms场景依赖真实调度，不是所有页面等待竞态的证明。

- real browser waits for the requested page update instead of reporting stale slots — 浏览器Fixture；保留；所在文件有局部调整，见本文件说明。
- challenge is not retried; explicit fixture takeover resumes the same page and rechecks identity — 浏览器Fixture；保留；所在文件有局部调整，见本文件说明。
- a requested ready marker that never appears fails within the probe deadline — 浏览器Fixture；保留；所在文件有局部调整，见本文件说明。

### [harness/restaurant-execution-router](../../src/harness/restaurant-execution-router.test.ts)

五项保留：合作Abort与不合作Promise、权威参数绑定、直接浏览器失败、多来源耗尽归因。相同错误码不意味着相同输入传播路径。

- Execution Router aborts and bounds a Provider search read that exceeds its deadline — 默认；保留；保护上述模块边界中的该行为。
- Execution Router returns at its deadline even when a Provider ignores abort — 默认；保留；保护上述模块边界中的该行为。
- Execution Router passes only bound availability arguments and its deadline signal to the adapter — 默认；保留；保护上述模块边界中的该行为。
- Execution Router marks a shared browser startup failure terminal after all requested candidates fail — 默认；保留；保护上述模块边界中的该行为。
- Execution Router preserves an all-provider browser failure as terminal after source fallback is exhausted — 默认；保留；保护上述模块边界中的该行为。

### [harness/restaurant-harness](../../src/harness/restaurant-harness.test.ts)

保留当前18项（此前H02/H03/H04已合并）。成功、授权checkpoint、明确失败恢复、ABSENT、UNKNOWN、重放、Evidence冲突、审计因果、搜索/候选继续、去重、参数、Provider归因与Loop预算分别保护组合行为；第二次搜索用例改名，不再声称Fixture真的给过无帮助结果。

- H01 completes a verified booking through the authorized happy path — 默认；保留；所在文件有局部调整，见本文件说明。
- H02/H03/H04 cap executable candidates and stop the proposed booking before authorization — 默认；保留；所在文件有局部调整，见本文件说明。
- H05 resumes the Agent after a definitive commit failure and requires a new authorization — 默认；保留；所在文件有局部调整，见本文件说明。
- Agent resumes after BOOKING_ABSENT with a new candidate proposal awaiting authorization — 默认；保留；所在文件有局部调整，见本文件说明。
- H06 weak evidence after submit becomes OUTCOME_UNKNOWN — 默认；保留；所在文件有局部调整，见本文件说明。
- H07 OUTCOME_UNKNOWN blocks selecting and committing another candidate — 默认；保留；所在文件有局部调整，见本文件说明。
- H08 replaying a commit command does not repeat the side effect — 默认；保留；所在文件有局部调整，见本文件说明。
- H09 mismatched booking details cannot produce BOOKED_VERIFIED — 默认；保留；所在文件有局部调整，见本文件说明。
- H10 evidence from another attempt cannot produce BOOKED_VERIFIED — 默认；保留；所在文件有局部调整，见本文件说明。
- H11 run artifact preserves the causal chain, proof and side-effect ledger — 默认；保留；所在文件有局部调整，见本文件说明。
- Agent chooses a second search strategy after an unhelpful first discovery — 默认；保留；所在文件有局部调整，见本文件说明。
- Agent checks an unavailable candidate then independently checks and selects another — 默认；保留；所在文件有局部调整，见本文件说明。
- Agent cannot execute a duplicate availability read after the candidate already has a check — 默认；保留；所在文件有局部调整，见本文件说明。
- Harness binds search and availability requests from authoritative task state — 默认；保留；所在文件有局部调整，见本文件说明。
- Provider failure is durable execution evidence, not a model failure — 默认；保留；所在文件有局部调整，见本文件说明。
- GENERIC_BROWSER availability observations retain the external adapter trace actor — 默认；保留；所在文件有局部调整，见本文件说明。
- a terminal browser read failure stops internally without asking the user to resolve it — 默认；保留；所在文件有局部调整，见本文件说明。
- Timeout, step limit, and rejection limit terminate with durable state and trajectory — 默认；保留；所在文件有局部调整，见本文件说明。

### [infrastructure/browser/browser-runtime-factory](../../src/infrastructure/browser/browser-runtime-factory.test.ts)

保留LOCAL不构造Cloudflare、远端选型；该组合入口是隔离边界，不能只靠Runtime自身测试。

- LOCAL_CHROMIUM selects the local runtime without requiring or constructing Cloudflare configuration — 默认；保留；保护上述模块边界中的该行为。
- AUTO, KITESURF, and CHROMIUM preserve Cloudflare runtime selection — 默认；保留；保护上述模块边界中的该行为。

### [infrastructure/browser/cloudflare-browser-run](../../src/infrastructure/browser/cloudflare-browser-run.test.ts)

保留Kitesurf成功、一次fallback、双失败、Abort清理；均mock CDP连接，不证明远端可访问。

- Browser Run keeps Kitesurf on successful AUTO session creation — 默认；保留；保护上述模块边界中的该行为。
- Browser Run falls back once from Kitesurf to Chromium and does not loop — 默认；保留；保护上述模块边界中的该行为。
- Browser Run returns a stable failure after both engines fail — 默认；保留；保护上述模块边界中的该行为。
- Browser Run closes a remote session after AbortSignal — 默认；保留；保护上述模块边界中的该行为。

### [infrastructure/browser/local-playwright-chromium](../../src/infrastructure/browser/local-playwright-chromium.test.ts)

保留绑定/Session/幂等关闭及稳定启动错误。替换原手工构造持久config测试，在同一项中通过fromEnvironment测试四种开关组合，实际观察mock launch模式与清理，不读取私有config。原测试没有覆盖开关逻辑。

- Local Playwright Chromium preserves the BrowserType method binding, exposes the BrowserSession contract, and closes page, context, and browser — 默认；保留；所在文件有局部调整，见本文件说明。
- interactive local Chromium uses a headed persistent eval profile and closes its owned context without deleting profile data — 默认；保留；所在文件有局部调整，见本文件说明。
- Local Playwright Chromium maps launch failures into the fail-closed BrowserRuntime error — 默认；保留；所在文件有局部调整，见本文件说明。

### [infrastructure/deepseek/deepseek-model-gateway](../../src/infrastructure/deepseek/deepseek-model-gateway.test.ts)

五项保留：完整HTTP schema与脱敏记录、配置失败、429归因/脱敏、Abort超时、畸形响应。假fetch不会访问模型；Agent端另保护实际schema选择。

- DeepSeek gateway sends the complete schema through strict structured output and records redacted metadata — 默认；保留；保护上述模块边界中的该行为。
- DeepSeek gateway fails closed when server configuration is incomplete — 默认；保留；保护上述模块边界中的该行为。
- DeepSeek gateway classifies provider rejection without exposing response body — 默认；保留；保护上述模块边界中的该行为。
- DeepSeek gateway turns an aborted bounded request into a timeout — 默认；保留；保护上述模块边界中的该行为。
- DeepSeek gateway rejects a malformed provider completion before it reaches a Domain parser — 默认；保留；保护上述模块边界中的该行为。

### [infrastructure/postgres/postgres-runtime](../../src/infrastructure/postgres/postgres-runtime.test.ts)

15项当前集成与8项冻结探针全部读完并保留：迁移两种真实旧结构、Context往返、事务/去重/版本/回滚、租约读写差异、Worker结果/重试/恢复、Restaurant重启/Unknown恢复；冻结项为Goal依赖、循环拒绝、调度去重、周期确认、外部材料、租约恢复、陈旧版本、有限映射失败。强化Worker完成前查询已落库事件；“bounded retry”改为准确的retry time，“sanitized”改为supplied Context往返，存储本身不证明脱敏。重复PGlite包装是小型测试支架，保留每次隔离数据库；未为去重引入共享数据库或新测试框架。

- upgrades immutable trajectory migration 0006 with causal refs and proposal joins — 默认；保留；所在文件有局部调整，见本文件说明。
- keeps the short-lived causal-ref development form of already-applied migration 0006 — 默认；保留；所在文件有局部调整，见本文件说明。
- persists the sanitized Agent decision context with its schema version — 默认；保留；所在文件有局部调整，见本文件说明。
- atomically stores task state, event and outbox command — 默认；保留；所在文件有局部调整，见本文件说明。
- deduplicates a persisted event without emitting another command — 默认；保留；所在文件有局部调整，见本文件说明。
- rejects a stale expected version — 默认；保留；所在文件有局部调整，见本文件说明。
- rolls back state and event when outbox insertion fails — 默认；保留；所在文件有局部调整，见本文件说明。
- releases an expired read lease for another worker — 默认；保留；所在文件有局部调整，见本文件说明。
- never re-leases an expired external write without a result event — 默认；保留；所在文件有局部调整，见本文件说明。
- reconciles an expired external write when its result event was persisted — 默认；保留；所在文件有局部调整，见本文件说明。
- worker persists a deterministic result event before completing the command — 默认；保留；所在文件有局部调整，见本文件说明。
- worker schedules a failed read command for bounded retry — 默认；保留；所在文件有局部调整，见本文件说明。
- worker never retries a failed external-write handler blindly — 默认；保留；所在文件有局部调整，见本文件说明。
- restores a Restaurant task through a new runtime instance — 默认；保留；所在文件有局部调整，见本文件说明。
- routes an uncertain Restaurant external write into verification without retrying commit — 默认；保留；所在文件有局部调整，见本文件说明。
- G03 completes a Goal only after both critical child tasks succeed — 冻结探针；保留；所在文件有局部调整，见本文件说明。
- blocks an unsatisfiable dependency and rejects cycles — 冻结探针；保留；所在文件有局部调整，见本文件说明。
- dispatches a due trigger once and preserves its causal event ID — 冻结探针；保留；所在文件有局部调整，见本文件说明。
- G01 recurring shopping waits for every user confirmation across persisted trigger cycles — 冻结探针；保留；所在文件有局部调整，见本文件说明。
- G02 long-running case waits for external events and material before resubmitting — 冻结探针；保留；所在文件有局部调整，见本文件说明。
- recovers an expired trigger lease and lets another scheduler deliver it — 冻结探针；保留；所在文件有局部调整，见本文件说明。
- marks a trigger obsolete when its expected Task version is stale — 冻结探针；保留；所在文件有局部调整，见本文件说明。
- bounds a trigger mapping failure instead of retrying forever — 冻结探针；保留；所在文件有局部调整，见本文件说明。

### [integrations/google/google-places-client](../../src/integrations/google/google-places-client.test.ts)

保留fetch挂起与body挂起两个deadline窗口。移除机器调度敏感的250ms墙钟断言，用2秒测试总上限限制挂死；仍要求5ms配置返回GOOGLE_TIMEOUT，未提高产品deadline。

- Google Places hard deadline rejects even when fetch ignores AbortSignal — 默认；保留；所在文件有局部调整，见本文件说明。
- Google Places deadline also bounds a response body that never resolves — 默认；保留；所在文件有局部调整，见本文件说明。

### [integrations/google/google-places-restaurant-search](../../src/integrations/google/google-places-restaurant-search.test.ts)

保留查询、field mask与ID、near-user坐标、预算、错误脱敏。在既有ID测试中重复输入验证ID稳定；删除错误分类用例中与client完全相同的挂起fetch超时段，保留错误码并补异常消息不泄露断言。

- Google query preserves the authoritative intent and only adds a retrieval hint — 默认；保留；所在文件有局部调整，见本文件说明。
- Google Places text search uses the explicit small field mask and stable candidate IDs — 默认；保留；所在文件有局部调整，见本文件说明。
- Google Places sends only explicit evaluation coordinates as NEAR_USER location bias — 默认；保留；所在文件有局部调整，见本文件说明。
- Google Places search budget is mechanical and bounded per adapter instance — 默认；保留；所在文件有局部调整，见本文件说明。
- Google Places classifies provider failure and timeout without exposing a response body — 默认；保留；所在文件有局部调整，见本文件说明。

### [integrations/restaurant-availability/availability-source-resolver](../../src/integrations/restaurant-availability/availability-source-resolver.test.ts)

保留首来源终止、fallback、全部耗尽三种组合路径；各Adapter只负责单来源结果，无法替代这些次序测试。

- source resolver always prefers TableCheck and does not call Tabelog after a conclusive read — 默认；保留；保护上述模块边界中的该行为。
- source resolver falls back from a TableCheck provider failure to Tabelog — 默认；保留；保护上述模块边界中的该行为。
- Tabelog bot challenge remains provider-scoped and all providers exhausted fail closed — 默认；保留；保护上述模块边界中的该行为。

### [integrations/tabelog/tabelog-browser-availability](../../src/integrations/tabelog/tabelog-browser-availability.test.ts)

将已知phone冲突的两套相同setup合并到inspection用例，保留resolve包装结果一致性；Adapter级identity失败另保留以验证下游行为。其余解析/slot/预算/启动/挑战/人工恢复与诊断各有独立入口。成功读的Mock现计数click/fill并断言零，补上“never submits”的实际受限接口验证；JSON-LD测试改名只承诺字段来源。

- Tabelog entity resolver is outlet-safe and rejects ambiguous branch matches — 默认；保留；所在文件有局部调整，见本文件说明。
- Tabelog entity resolver fails closed when an otherwise similar outlet has a conflicting known phone — 默认；合并；本文件inspection用例保留LOW、CONFLICT及resolve结果一致性。
- Tabelog entity inspection retains the normalized comparison and explicit non-HIGH reason — 默认；保留；所在文件有局部调整，见本文件说明。
- Tabelog relative search links are enriched with page identity before an exact phone creates a HIGH outlet match — 默认；保留；所在文件有局部调整，见本文件说明。
- Tabelog identity parser marks JSON-LD identity fields without retaining raw HTML — 默认；保留；所在文件有局部调整，见本文件说明。
- Tabelog slot parser ignores prose times and trusts only explicit available controls — 默认；保留；所在文件有局部调整，见本文件说明。
- Tabelog executor grounds a deterministic browser observation and never submits — 默认；保留；所在文件有局部调整，见本文件说明。
- Tabelog bot challenge and external booking redirect remain non-available results — 默认；保留；所在文件有局部调整，见本文件说明。
- Tabelog pauses a challenged local session for explicit human intervention, then resumes the same page/session without an automated retry — 默认；保留；所在文件有局部调整，见本文件说明。
- Tabelog fails closed when the challenge remains after an explicit resume signal — 默认；保留；所在文件有局部调整，见本文件说明。
- Tabelog browser session budget returns UNKNOWN rather than reusing or over-opening a session — 默认；保留；所在文件有局部调整，见本文件说明。
- Tabelog browser startup failure remains observable and is not reported as an entity mismatch — 默认；保留；所在文件有局部调整，见本文件说明。
- Tabelog entity failure sends a sanitized search, detail, and comparison diagnostic to the eval sink — 默认；保留；所在文件有局部调整，见本文件说明。
- Tabelog search challenge records its cause while removing transient challenge tokens — 默认；保留；所在文件有局部调整，见本文件说明。

### [integrations/tablecheck/tablecheck-browser-availability](../../src/integrations/tablecheck/tablecheck-browser-availability.test.ts)

六项保留：入口hint、身份、slot、读链路、冲突、403。身份用例内补无phone但name+address一致的HIGH分支，避免原标题大于断言；其他平台解析器不同，不能跨平台删除这类边界。

- TableCheck deterministic guide attempts and reservation URL are read-only hints — 默认；保留；所在文件有局部调整，见本文件说明。
- TableCheck identity uses exact phone or name and full address, never name alone — 默认；保留；所在文件有局部调整，见本文件说明。
- TableCheck slot parser ignores prose and accepts only explicitly bookable time controls — 默认；保留；所在文件有局部调整，见本文件说明。
- TableCheck executor grounds same-outlet identity, requested schedule and explicit slots without booking actions — 默认；保留；所在文件有局部调整，见本文件说明。
- TableCheck rejects a same-name page with a conflicting known phone before reading availability — 默认；保留；所在文件有局部调整，见本文件说明。
- TableCheck public 403 documents are provider-page failures, not outlet identity failures — 默认；保留；所在文件有局部调整，见本文件说明。

### [server/local-web-server](../../src/server/local-web-server.test.ts)

七项保留：入口与401、服务重启、同用户新session、跨用户404/SSE、SSE幂等、非权威文案、409/补全。W02从硬编码version=5改为与创建结果一致及内容/Task恢复；W04删除无状态变化的第三次相同SSE读取，保留首次/重连比较与无重复活动断言。页面Fixture标记是产品模式提示，保留；前轮已删CSS源码匹配。

- Stage 2B serves the fixture workspace and rejects unauthenticated case access — 默认；保留；所在文件有局部调整，见本文件说明。
- W01 restores a conversation, case and task after server restart — 默认；保留；所在文件有局部调整，见本文件说明。
- W02 resumes the same case from a second mobile-web session — 默认；保留；所在文件有局部调整，见本文件说明。
- W03 denies cross-user case and event-stream access — 默认；保留；所在文件有局部调整，见本文件说明。
- W04 SSE reconnect sends an idempotent Agent-loop snapshot — 默认；保留；所在文件有局部调整，见本文件说明。
- W05 conversation claims cannot change authoritative task state or outcome — 默认；保留；所在文件有局部调整，见本文件说明。
- Stage 2B continues an incomplete request and enforces optimistic concurrency — 默认；保留；所在文件有局部调整，见本文件说明。

## 覆盖限制与后续维护

- 本次检查冗余、断言质量、执行入口与维护成本，不等于分支穷举、模型质量或全部安全不变量的形式证明。
- Browser Mock的select回传与空wait不能证明真实页面刷新；本地Chromium只证明合成页面。真实来源就绪/错误请求/接管恢复仍由授权Live切片验证，不扩大当前能力声明。
- 各模块未来增长时先扩展现有主覆盖，替代旧路径同步退役测试；独立失效机制才新增测试，不按模块数量扩张套件。无需每次重新生成本审查快照。
- 冻结Probe仍是明确保留的架构探针，不算产品Stage完成证据；不随每个普通改动运行。

验证结果见2026-09-06 TEST-LOG的“全量测试正文审查”条目。
