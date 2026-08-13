# Agent Orchestration

- Status: Accepted
- Version: 3.1
- Last updated: 2026-08-13
- Source of truth for: Agent Workspace中的模型职责、有界Loop、前后台运行与Multi-Agent边界
- Related ADRs: [ADR-0002](../decisions/0002-deepseek-model-runtime.md), [ADR-0003](../decisions/0003-single-agent-orchestration.md), [ADR-0006](../decisions/0006-web-first-agent-workspace.md), [ADR-0007](../decisions/0007-semantic-proposal-compiler-and-decision-kernel.md)
- Related documents: [Agent Gateway and Workspace](AGENT-GATEWAY-AND-WORKSPACE.md), [Task Runtime](TASK-RUNTIME.md), [Policy & Execution](POLICY-EXECUTION-VERIFICATION.md)

## 原则

Praxis采用单一用户级Agent。Agent Gateway负责路由用户交互，Agent Workspace负责对话、Context和非权威Working Plan，Task Runtime拥有Durable Case State。模型不是权威状态或副作用总指挥，Task Runtime也不存储全部Conversation或探索过程。v15将“理解用户语义”与“把语义写成系统协议”分开：LLM只产生不可信Semantic Proposal，Restaurant Compiler、Reducer和Decision Kernel分别承担确定性编译、状态与决策。

```text
用户消息
→ Agent Gateway定位Conversation与Case
→ Agent Workspace装配最小Conversation / State / Context
→ Semantic Interpreter [DeepSeek] 提出本轮语义
→ Semantic Proposal Contract校验结构
→ Restaurant Semantic Compiler编译Domain Event / State Patch
→ Runtime + Reducer写入Authoritative State
→ Restaurant Decision Kernel基于State + Trusted Evidence决定下一步
→ Runtime Command / Execution Action Proposal
→ Policy / Authorization（副作用时）→ Execution Router → Tool / Adapter
→ Observation / Evidence → Verifier → Outcome Event
→ Runtime + Reducer + Decision Kernel
```

## v15 Semantic Interpreter and deterministic decision path

The Semantic Interpreter answers only “the user expressed what in this turn?” It can propose target, time, party, location, preference, constraint, correction, negation, confirmation, and bounded soft semantic context. It cannot produce an internal State Patch/Event, missing-field decision, readiness, routing decision, Authorization, Tool Call, or Outcome.

```text
Semantic Proposal
→ Semantic Proposal Contract: is this permitted structure and vocabulary?
→ Restaurant Semantic Compiler: deterministically translate it to Domain Event / State Patch
→ Task Runtime + Reducer: what is the authoritative state now?
→ Restaurant Decision Kernel: based on State + Trusted Evidence, what happens next?
```

Contract validity is not a semantic-correctness assertion. Semantic extraction, compilation, reduction, and kernel decisions must each have a separately attributable Harness result. The Compiler and Kernel are Restaurant-owned Domain code, not a Core abstraction or a second Agent.

The Decision Kernel may return `ASK_USER`, `SEARCH`, `PRESENT_CANDIDATES`, `PROPOSE_RESERVATION`, `COMPLETE`, `NEED_ADJUSTMENT`, or `NEED_REINTERPRETATION`. In v15, `NEED_REINTERPRETATION` records a structured conflict and produces an ask-user or safe fallback path; it does not invoke the model again or overwrite authoritative State. Any future one-time automatic re-interpretation must be separately accepted and re-enter the complete Semantic Proposal → Contract → Compiler → Runtime → Reducer path.

The separate LLM Response / Adjustment Proposal path can explain verified facts, formulate a clarification question, or suggest a condition adjustment. It cannot turn its own suggestion into user intent: only a new explicit user message returns to the Semantic Interpreter. There is no `LLM → Tool`, `LLM → State`, or `Verifier → LLM → Tool` path.

## 前台与后台运行

前台Conversation可以保留有限近期消息，用于自然连续的交互。浏览器断开不会取消Durable Case，新的前台Interaction Session从服务端Case State恢复。

后台Trigger、外部Event或Follow-up必须使用新的有界Run，从Task Snapshot、Attempt/Authorization引用和最小Domain Context重建；不得依靠完整聊天转录“记住”任务进度。后台Run的模型失败只产生明确失败Event或不改变状态，不能覆盖前台Session、自动扩大授权或把Case标为完成。

## DeepSeek职责

- 作为Semantic Interpreter理解本轮用户表达，产生Restaurant Semantic Proposal；
- 在LLM Response路径中基于State、Evidence和Outcome解释事实、生成澄清问题或提出非权威调整建议；
- 日英查询词扩展、未知页面的标签/阶段/错误辅助理解，仅可在各自受控的Proposal Contract中使用。

不负责：`StatePatch`或Event编译、状态跳转、Task Graph写入、Readiness、动作路由、权限、外部提交、重试决策、成功判定或直接Tool Call。

## Model Gateway

所有模型调用经服务端`ModelGateway`，首个实现为DeepSeek。每类调用必须有任务名和版本，例如：

```text
restaurant_intent_parse_v1
restaurant_query_expand_v1
candidate_explain_v1
browser_page_interpret_v1
failure_explain_v1
```

每次请求必须声明`taskId`、purpose、promptVersion、`outputSchema`、timeout和明确失败行为。Gateway只记录provider、model、prompt/schema版本、latency、token、Provider request ID、状态码和错误码；不记录Prompt或Completion正文。Key只存在服务端Secret。Restaurant当前的结构化表单是已定义User Flow，不是备用Provider或兼容层；其他调用不自动继承该降级方案。

当前已实现Restaurant Intent Draft Schema Validator、Fixture/Replay Eval Harness、服务端`ModelGateway`、DeepSeek HTTP Provider Contract和`RestaurantIntentParser`。`RestaurantIntentParser`仅保留在Fixture/Replay与真实连通性评测；2026-08-08的受控DeepSeek Smoke只证明Key、Gateway、Parser和旧Draft Schema链路可用，不代表单轮或渐进决策质量Baseline。

Stage 2A/2B产品路径已改由Local-only Fixture ModelGateway驱动`RestaurantSemanticInterpreter → Proposal Contract → Restaurant Semantic Compiler → Runtime/Reducer → Restaurant Decision Kernel`。Interpreter固定使用非流式JSON、500输出Token、关闭Thinking、拒绝非`STOP`完成并仅对JSON/Contract无效输出重试一次。当前Prompt为v2，明确列出每个`field`对应的`value.kind`和封闭JSON形状。Compiler只生成`SEMANTIC_PROPOSAL_COMPILED`或`SEMANTIC_CONFLICT_RECORDED`；Reducer推导缺失阻塞字段，Kernel再生成`DECIDE_RESTAURANT_NEXT`命令和已记录的Decision Event。当前可运行Decision范围是`ASK_USER`、`SEARCH`、`PRESENT_CANDIDATES`、`NEED_ADJUSTMENT`与保留的`NEED_REINTERPRETATION`；后两类预约阶段的`PROPOSE_RESERVATION`和`COMPLETE`仍维持既有确定性状态机，尚未迁移到产品Kernel命令。没有真实模型请求、Tool Call、自动重解释、Authorization或外部写入。

Restaurant低确定性需求、多轮偏好形成和推荐收敛的新评测规则现定义在Draft [Progressive Decision Eval v2](../harness/RESTAURANT-DECISION-EVAL-V2.md)。Dataset/Fixture/Annotation Contract、7个Golden Seed Episode和S0 Dataset Preflight已实现，17个Turn已完成人工Gold并通过Strict Preflight；Eval-only Reducer、S1–S8 Scorer、首错/Blocked归因、Fixture Oracle和18个S0–S8单点Mutation已可运行。S6–S8把固定池Eligible检索、检索后选择/多样性以及State/Candidate Fact/禁止声明分开评分；严重过敏候选卡还必须输出“仍需餐厅确认”的结构化披露，但不会创建生产Consent、Authorization或外部请求。Eval-only Model Contract现通过现有服务端Gateway提供版本化Prompt v11、严格Proposal Schema 2、最多一次无效输出重试和`FAIL_CLOSED`失败；静态Prompt只保留抽象Schema/规则，不含Golden实体、地点、菜系、候选或反馈措辞。Episode Runner已用明确的Golden Fixture上下文逐Turn组装Proposal、S6和S1–S8评分，并将Schema/Provider失败从语义结果中分离。`ModelGateway`普通遥测永不保留正文；真实Eval CLI只会为当前静态、已暴露的Regression Fixture在本机Git忽略目录记录结构化逐Turn诊断（状态Patch与评分差异），并明确排除原始Prompt/Completion。任何含Holdout的Dataset均拒绝持久化这类Artifact。显式开关仍可仅在进程内向本次终端交付Completion诊断，不能用于真实用户输入或持久化。全部Golden已暴露，CLI将其输出标为`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`；它们不能代表独立模型质量。该路径保持Harness-only；即使后续通过也不能直接改变Task State，或被报告为产品能力。

2026-08-11的v5 `FULL_REGRESSION`诊断显式覆盖全部7个Episode、17个Turn，均完成Harness评分。已观察到的失败类别是State/Accumulation、将品牌误当作单店目标、Grounding和不足候选解释。此后v6在相同范围的17次调用均成功且Schema重试为0；首错只剩11次State与2次Accumulation，P0为0。它是Harness/Prompt候选的开发诊断，不能改变上述生产边界或被称为独立模型质量。

Prompt v8保留v6/v7的Harness-only输入边界：未解析的命名目标由只读`FIXTURE_DISCOVERY`上下文解析，而非模型常识；检索完整性由`retrievalSummary`声明；候选Fact与过敏确认披露由可信Runner在模型选择后装配。`occasion`仍只来自用户显式社会用餐情境。新的Eval专用可信相对时间解析器只使用每个Episode固定的`referenceTime`与`Asia/Tokyo`，处理`today`、`tomorrow`、`tonight`、`now`和`right now`；它在模型调用前进入累计状态，并在有效Patch中保留由此得到的日期。相互冲突的相对表达不猜测。模型可见该可信状态，但不能靠省略日期将其抹掉；诊断同时区分原始模型Patch与有效Patch。该切片不接真实时钟、DeepSeek Tool Call、真实Discovery或任何Runtime写入。

Prompt v9只扩展Harness-only地点状态表达：`FLEXIBLE.anchorQuery`用于“从某地出发且愿意移动”，无锚点`FLEXIBLE`仍需追问；S1/S2仅对同query的`AREA`/`NEAR_PLACE`做受控等价。模型不能据此调用地图、改写真实Task State或跳过未来Discovery grounding；`ADDRESS_OR_STREET`、不同query、`AREA`与`FLEXIBLE anchorQuery`仍严格区分。

Prompt v10不改变Schema，只收紧Proposal层的抽取边界：社交语境不能推出人数，软偏好不能提升为`target`。`occasion`、`party`、`target`和`positivePreferences/negativePreferences`仍是Eval-only Proposal；模型输出不得直接写入Task State。

Prompt v11不改变Schema，只收紧Proposal层的动作路由矩阵：`BRAND`、`RESTAURANT`、`OPEN/CATEGORY`和`CHECK_AVAILABILITY`的触发条件必须分开；模型不能把品牌当目标餐厅检查，也不能把指定餐厅流程退化为通用推荐列表。

Prompt v12 / Schema 3把这类稳定的决策职责从Proposal层收回Eval-only Decision Kernel probe：模型仅输出语义`statePatch`及可选的已提供Candidate ID排序；Kernel从累计State、可信Fixture/Search结果和Candidate Fact确定Readiness、动作、核心澄清Topic、候选展示上限和Grounding。该探针没有工具调用、状态写入、Domain依赖或Workflow DSL，不能视作Task Runtime实现；它的目的仅是让已暴露Regression不再通过继续堆叠Prompt来模拟确定性Policy。

Prompt v13保持Schema 3和Kernel边界不变，只收紧模型仍负责的State Patch语义Contract：先按语义角色区分可协商偏好、专用状态字段和不可妥协硬约束；出行距离与移动弹性只属于Location Strategy；用户接受会话中提出的地点时必须更新Location，不能因确认式措辞而写入Preference。Prompt不包含已暴露Regression的实体或原句。

Prompt v14 / Proposal Schema 4进一步把结构规则从Prompt移入Restaurant-owned Contract模块：模型仍直接输出不可信typed `statePatch`，Validator通过后Reducer才合并；Preference使用`facet + value + polarity`，禁烟和严重过敏使用判别式Hard Constraint。Kernel仍只负责确定性决策。它仍是Harness-only历史评测路径。ADR-0007现已接受Restaurant-owned Semantic Proposal与Compiler作为v15产品目标；该决定不改变v14 Harness的实现状态，也不引入通用Ontology、跨Domain编译器、Subagent编排或Workflow DSL。

## Loop类型

### 对话补充Loop

Intent不完整时追问，直到阻塞字段完整、用户取消或达到上限。

### 搜索扩展Loop

普通代码分批检查候选，达到3家、Deadline或候选耗尽即停止。

### 有界Model-assisted observation loop

v15 Semantic Interpreter和LLM Response路径不直接调用Tool。未来若开放未知页面辅助理解，模型只能提出独立、只读的Observation Proposal；它仍须经专用Contract、Runtime Command和Policy执行，并受最大步数、Token和时间预算约束。它不得复用Semantic Proposal来调用Tool，也不得绕过Execution Router。

### Browser Interpretation Loop

未知官网可以“观察→模型提出独立Observation Proposal→专用Contract / Runtime Command / Browser Policy校验→执行只读观察→再观察”。只能走到提交前Checkpoint；最终提交不在Loop内。该Proposal不是Semantic Proposal，也不允许模型直接操作Browser。

## Tool暴露

v15不向Semantic Interpreter或LLM Response暴露直接Tool Call。Decision Kernel将确定性Decision转为Runtime Command或Execution Action Proposal；只读命令经Policy后由Tool执行，副作用命令还必须经有效Authorization和Execution Router。未来的Model-assisted Observation Proposal是独立Contract，不能成为`LLM → Tool`旁路。

## Multi-Agent

MVP不使用Multi-Agent。Desktop与Mobile Web是同一个用户级Agent的不同Surface；Intent Parser、Search、Verifier和Browser Worker是模块/工具，不是拥有独立权限和状态的Agent。并行Connector是普通并发。

未来Specialist Agent只可作为受控工具处理独立、开放式子任务；Task状态和副作用仍归统一Runtime。

## 故障降级

- DeepSeek不可用时，已结构化且已授权的确定性流程可以继续。
- 新自然语言输入降级为结构化表单。
- JSON/Schema校验失败重试一次，再进入表单或固定错误流程；Provider失败不在Parser内盲重试。
- Semantic Proposal冲突导致`NEED_REINTERPRETATION`时，记录冲突并询问用户或安全降级；v15不自动重解释或修改State。
- 模型超时不得包裹外部提交事务。
- 模型故障不得改变现实预约状态。

## Prompt Injection

网页、邮件和Tool输出均视为不可信数据。模型不能依据页面文字改变系统规则、扩大域名范围或获取Secret。Browser动作必须经过结构化Action和Policy校验。
