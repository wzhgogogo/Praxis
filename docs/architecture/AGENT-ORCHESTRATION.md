# Agent Orchestration

- Status: Accepted
- Document revision: 3.15
- Last updated: 2026-09-07
- Source of truth for: Agent Workspace中的模型职责、有界Loop、前后台运行与Multi-Agent边界
- Related ADRs: [ADR-0002](../decisions/0002-deepseek-model-runtime.md), [ADR-0003](../decisions/0003-single-agent-orchestration.md), [ADR-0006](../decisions/0006-web-first-agent-workspace.md), [ADR-0010](../decisions/0010-restaurant-agent-loop-action-validation.md), [ADR-0011](../decisions/0011-restaurant-agent-loop-control-refinement.md), [ADR-0012](../decisions/0012-migration-and-agent-loop-hardening.md), [ADR-0013](../decisions/0013-agent-loop-final-hardening.md)
- Related documents: [Agent Gateway and Workspace](AGENT-GATEWAY-AND-WORKSPACE.md), [Task Runtime](TASK-RUNTIME.md), [Policy & Execution](POLICY-EXECUTION-VERIFICATION.md)

## 原则

Praxis采用单一用户级Agent。Agent Gateway路由用户交互，Agent Workspace拥有Conversation、Context和非权威Working Plan，Task Runtime拥有Durable Case State。模型不拥有权威状态、副作用许可或Outcome判定。

```text
User Message
→ Agent Gateway / Workspace
→ Semantic Interpreter [DeepSeek]
→ Semantic Proposal Contract
→ Restaurant Semantic Compiler
→ Task Runtime / Reducer
→ Restaurant Agent Decision [LLM]
→ Action Proposal → Restaurant Action Validator → Execution Router
→ Policy / Authorization → Execution Router → Tool / Adapter
→ Observation / Evidence → Verifier → Outcome Event
→ Runtime / Reducer → Restaurant Agent Decision
```

## ADR-0013语义、Agent与动作边界

Semantic Interpreter只回答“用户本轮表达了什么”：稳定槽位、开放`CRITERION{text, polarity, strength}`、修正、否定和确认。它不对Criterion建立cuisine / constraint / preference taxonomy，也不能产生内部State Patch/Event、缺失字段、Readiness、动作路由、Authorization、Tool Call或Outcome。

Contract只证明Proposal结构与词表合法，不证明理解正确。Restaurant Compiler确定性地把合法Proposal翻译为Domain Patch/Event；Runtime与Reducer写权威状态。Restaurant Agent只提出一个不可信业务动作：`ASK_USER`、`SEARCH_RESTAURANTS`、`CHECK_AVAILABILITY`、`SELECT_CANDIDATE`或`BOOK_RESERVATION`。Verifier确认的终态直接停止Loop，不存在`COMPLETE` Agent动作。

`SEARCH_RESTAURANTS`只可包含可选`retrievalHint`，`CHECK_AVAILABILITY`只可包含`candidateIds`。Validator验证这些不可信字段的结构和State相容性；Execution Router在调用只读Adapter前从权威State绑定完整Intent、日期、时段和人数。它们绝不由Agent重复提交。是否再次搜索、开放式检索策略、检查哪家空位和如何利用失败Observation均由这个单一Restaurant Agent选择。

Restaurant Agent不再接收完整Task State，而是只接收Domain-owned `restaurant-agent-context@2`：Intent Draft、派生缺失字段、展示安全的Candidate/Offer、当前选择、phase、稳定failure code和Availability Check的业务状态。`UNKNOWN`与`SOURCE_UNSUPPORTED`绝不代表`UNAVAILABLE`。Authorization、Proposal terms、Provider/Browser细节、原始Provider结果、Execution Result、Evidence Artifact和Reservation不会进入模型上下文。每次决策将模型实际看到的脱敏Context与`contextSchemaVersion`保存到trajectory，不保存raw prompt或Chain-of-Thought。Restaurant Action Validator仍只读取完整Authoritative State与Trusted Evidence，返回`ALLOWED`、`REJECTED`或`REQUIRES_AUTHORIZATION`，绝不选择下一步。它保护完整Intent、Hard Constraint、Candidate/Offer归属、时间人数、Offer新鲜度、活动Attempt和`OUTCOME_UNKNOWN`。`SELECTION_REQUIRED`仍是Agent可恢复的`RUNNING`状态，不是等待用户；只有明确提问、Authorization checkpoint或语义输入缺失才投影为`WAITING_USER`。

LLM Response / Adjustment可以解释事实、生成澄清问题或提出非权威调整建议；只有用户的新消息可以重新进入Semantic Interpreter。禁止`LLM → Tool`、`LLM → State`和`Verifier → LLM → Tool`。每一步保存结构化trajectory；不保存Chain-of-Thought，也不把Summary作为权威事实。

历史v14 `statePatch` Harness和旧单轮`RestaurantIntentParser`已经退出产品主链，可执行代码已删除。历史Prompt、Dataset和诊断只在Git与历史日志中追溯，不是当前架构的并行路径。

## 前台与后台运行

前台Conversation可保留有限近期消息。浏览器断开不取消Durable Case；新的Interaction Session从服务端Case State恢复。

后台Trigger、外部Event或Follow-up使用新的有界Run，从Task Snapshot、Attempt/Authorization引用和最小Domain Context重建。模型失败只能产生明确失败结果或不改变状态，不能扩大授权或把Case标为完成。

## Model Gateway

所有模型调用经服务端`ModelGateway`；首个Provider为DeepSeek。每次请求必须声明`taskId`、purpose、promptVersion、outputSchema、timeout和失败行为。Gateway只记录Provider、模型、Prompt/Schema版本、延迟、Token、Provider request ID、状态码和错误码；不记录Prompt或Completion正文。Key只存在服务端Secret。

当前Restaurant Semantic Interpreter固定为非流式、500输出Token、温度0、Thinking关闭。Domain把完整机器可读Proposal Schema放入通用Model Request；该Schema只使用当前strict transport支持的JSON Schema子集，无法由传输层表达的non-blank规则仍由本地Domain Validator校验。DeepSeek Gateway用Beta strict function作为仅传输结构的强制信封，不注册或执行Runtime Tool。Gateway必须得到唯一匹配的`tool_calls` arguments，本地Proposal Validator仍再次校验；结构合法不代表语义正确。Contract无效时最多再尝试一次，Provider失败不盲重试或降级为自由文本。当前标识为`restaurant-semantic-prompt@7`与`restaurant-semantic-proposal@3`；Criterion strength按用户意图为`HARD` / `SOFT` / `UNSPECIFIED`，未来Provider Search Criteria Compiler必须是独立确定性边界，当前未实现。

Restaurant Agent Decision使用同一服务端Gateway和受限JSON Schema，purpose为`restaurant_agent_decide`、Prompt标识为`restaurant-agent-decision-prompt@7`；输入为`restaurant-agent-context@3`，输出仅为一个业务动作和可选短`decisionSummary`。Context提供代码计算的当前时间、展示资格、缺失证据和可重查理由；模型选择下一步，不能自行推断或刷新时效。`CHECK_AVAILABILITY`只可选择未检查候选，或由Context标出的展示证据过期/用户刷新候选；Router记录重查理由并绑定权威请求。若已有合格结果，Validator要求及时`PRESENT_RESULTS`。同一被拒绝动作不得连续重试。`PRESENT_RESULTS`只适用于有当前area、HARD criterion、HIGH outlet identity和matching availability evidence的只读结果；结构合法不代表动作获准，必须继续经过Action Validator。

## 有界Loop

- 对话补充：核心字段不完整时询问用户，直到完整、取消或达到上限。
- Restaurant Agent Loop：在最大步数、超时、重复非法动作上限内，一次提出并验证一个动作；终态、User等待点和Authorization checkpoint立即停止。每次Discovery/Availability read由Router以可中止deadline包裹；Structured与Browser可分别配置有界超时。超时、步数上限与连续拒绝各写入`AGENT_LOOP_TERMINATED`及终止原因，并形成对应trajectory step。模型失败写`AGENT_DECISION_FAILED`；Discovery失败与Availability的`UNKNOWN`/`SOURCE_UNSUPPORTED`观察不会被归为模型失败，更不能改写为`UNAVAILABLE`。若本次所有请求候选都在建立Browser Run会话前发生同一`BROWSER_RUNTIME_FAILED`或`BROWSER_TIMEOUT`，Router标记为终端内部read failure，Loop写`AGENT_LOOP_TERMINATED(EXECUTION_FAILURE)`并进入`FAILED`，不得让Agent以`ASK_USER`把基础设施故障交给用户解决。唯一例外是显式的eval-only local Tabelog challenge pause：同一BrowserSession/Page保持打开、终端等待人手完成站点验证，随后只读取该页面一次；它不是模型`ASK_USER`、不自动重试，并且challenge仍存在时仍返回`BOT_CHALLENGE`。此模式才可将该次Browser deadline设为无自动超时，且只由Hybrid eval runner在两个本地interactive门禁同时开启时使用。完成一条mandatory Policy/Commit/Verify chain后，Orchestrator只在`SELECTION_REQUIRED`调用bounded resume；`COMMIT_FAILED`或`BOOKING_ABSENT`已清除旧proposal/authorization/attempt，新的`BOOK_RESERVATION`必须先产生新proposal并等待新Authorization，`OUTCOME_UNKNOWN`绝不自动恢复。
- Model-assisted Observation：ADR-0017授权的local/eval实现现已启用，但不是Restaurant Agent Tool。它使用独立`browser_read_action@1` strict wire contract；模型只看脱敏的可见文本与代码生成的当前元素引用，不能接收selector、自由URL、凭据、Cookie或State。执行器只接受来源allowlist、当前观察版本、明确只读控制和Router绑定的日期/人数；所有完成声明仍回到确定性来源解析和Grounding，不能直接产生Evidence、Offer或状态变化。
- Browser Interpretation：只能在允许域名内观察并走到提交前Checkpoint；最终提交不在模型Loop内。Hybrid Live Read可通过`PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM`显式选择只用于开发/eval的本地Playwright backend；该选择不访问Cloudflare、不改变AUTO的Kitesurf→Chromium顺序。仅当`PRAXIS_LOCAL_CHROMIUM_INTERACTIVE=1`与`PRAXIS_EVAL_ALLOW_TABELOG_MANUAL_INTERVENTION=1`同时开启时，它会启动headed Chromium和gitignored持久profile，允许人手验证后在同一Session恢复；不属于Desktop/Mobile产品Surface或通用challenge bypass。

## Browser操作边界

无API来源的浏览与受控操作是产品建设方向；当前两个Restaurant Adapter的确定性方法和受限模型提议均经一个共享Browser Executor，不能据此声称已有任意页面Browser Agent。网页不作为指令或授权；旧观察引用、POST/预约/支付/取消/PII控件、非来源URL、非权威日期/人数和父级取消后的动作均被拒绝。正常页面就绪等待、同页重新观察、失败重试和业务重复提交分别设限；Router取消会等待关闭收束，人工接管后继续前重验门店、请求与Evidence。

只读结果的来源范围由[ADR-0015](../decisions/0015-supported-source-search-evidence.md)定义；local interactive单开关只启动headed临时会话，双开关持久恢复的生命周期由[ADR-0016](../decisions/0016-local-eval-browser-profile-lifecycle.md)定义。

## Tool与Multi-Agent

Semantic Interpreter和Restaurant Agent不持有直接Tool Call。已验证动作才进入Execution Router；只读动作经受控Router执行，副作用仍必须先确定性生成Action Proposal、经过Policy和有效Authorization，再由Execution Router提交。

MVP不使用Multi-Agent。Desktop与Mobile Web是同一用户级Agent的不同Surface；Interpreter、Search、Verifier和Browser Worker是模块或工具，不是独立权限主体。未来Specialist Agent仍不得拥有Task State或副作用权限。

## 故障降级

- DeepSeek不可用时，已经结构化并授权的确定性流程可以继续；新的自然语言输入回到结构化表单。
- JSON/Schema失败最多再尝试一次；Provider失败采用一个明确失败结果。
- Semantic conflict进入`NEED_REINTERPRETATION`，不自动重解释。
- 模型超时不得包裹外部提交事务，也不得改变现实预约状态。

## Prompt Injection

网页、邮件和Tool输出均为不可信数据。模型不能依据页面文字改变系统规则、扩大域名范围或获取Secret。Browser动作必须经过结构化Action与Policy校验。
