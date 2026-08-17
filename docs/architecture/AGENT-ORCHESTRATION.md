# Agent Orchestration

- Status: Accepted
- Version: 3.3
- Last updated: 2026-08-17
- Source of truth for: Agent Workspace中的模型职责、有界Loop、前后台运行与Multi-Agent边界
- Related ADRs: [ADR-0002](../decisions/0002-deepseek-model-runtime.md), [ADR-0003](../decisions/0003-single-agent-orchestration.md), [ADR-0006](../decisions/0006-web-first-agent-workspace.md), [ADR-0007](../decisions/0007-semantic-proposal-compiler-and-decision-kernel.md)
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
→ Restaurant Decision Kernel
→ Runtime Command / Execution Action Proposal
→ Policy / Authorization → Execution Router → Tool / Adapter
→ Observation / Evidence → Verifier → Outcome Event
→ Runtime / Reducer / Decision Kernel
```

## v15语义与决策边界

Semantic Interpreter只回答“用户本轮表达了什么”，可以提出目标、时间、人数、地点、偏好、约束、修正、否定和确认。它不能产生内部State Patch/Event、缺失字段、Readiness、动作路由、Authorization、Tool Call或Outcome。

Contract只证明Proposal结构与词表合法，不证明理解正确。Restaurant Compiler确定性地把合法Proposal翻译为Domain Patch/Event；Runtime与Reducer写权威状态；Decision Kernel只基于Authoritative State与Trusted Evidence决定下一步。

Kernel可返回`ASK_USER`、`SEARCH`、`PRESENT_CANDIDATES`、`PROPOSE_RESERVATION`、`COMPLETE`、`NEED_ADJUSTMENT`或`NEED_REINTERPRETATION`。v15的`NEED_REINTERPRETATION`只记录冲突并询问用户或安全降级，不重新调用模型或覆盖State。

LLM Response / Adjustment可以解释事实、生成澄清问题或提出非权威调整建议；只有用户的新消息可以重新进入Semantic Interpreter。禁止`LLM → Tool`、`LLM → State`和`Verifier → LLM → Tool`。

历史v14 `statePatch` Harness和旧单轮`RestaurantIntentParser`已经退出产品主链，可执行代码已删除。历史Prompt、Dataset和诊断只在Git与历史日志中追溯，不是当前架构的并行路径。

## 前台与后台运行

前台Conversation可保留有限近期消息。浏览器断开不取消Durable Case；新的Interaction Session从服务端Case State恢复。

后台Trigger、外部Event或Follow-up使用新的有界Run，从Task Snapshot、Attempt/Authorization引用和最小Domain Context重建。模型失败只能产生明确失败结果或不改变状态，不能扩大授权或把Case标为完成。

## Model Gateway

所有模型调用经服务端`ModelGateway`；首个Provider为DeepSeek。每次请求必须声明`taskId`、purpose、promptVersion、outputSchema、timeout和失败行为。Gateway只记录Provider、模型、Prompt/Schema版本、延迟、Token、Provider request ID、状态码和错误码；不记录Prompt或Completion正文。Key只存在服务端Secret。

当前Restaurant Semantic Interpreter固定为非流式、500输出Token、温度0、Thinking关闭。Domain把完整机器可读Proposal Schema放入通用Model Request；DeepSeek Gateway用Beta strict function作为仅传输结构的强制信封，不注册或执行Runtime Tool。Gateway必须得到唯一匹配的`tool_calls` arguments，本地Proposal Validator仍再次校验；结构合法不代表语义正确。Contract无效时最多再尝试一次，Provider失败不盲重试或降级为自由文本。Prompt仍为`v2`，Proposal Schema仍为`1`。

## 有界Loop

- 对话补充：核心字段不完整时询问用户，直到完整、取消或达到上限。
- 搜索扩展：普通代码分批检查候选，达到3家、Deadline或耗尽即停止。
- Model-assisted Observation：当前未启用。未来若启用，必须使用独立只读Proposal Contract、Runtime Command与Policy，不能复用Semantic Proposal直接调用Tool。
- Browser Interpretation：只能在允许域名内观察并走到提交前Checkpoint；最终提交不在模型Loop内。

## Tool与Multi-Agent

Semantic Interpreter和LLM Response不持有直接Tool Call。Decision Kernel的Decision先成为Runtime Command或Execution Action Proposal；只读命令经Policy执行，副作用还必须有有效Authorization并经Execution Router。

MVP不使用Multi-Agent。Desktop与Mobile Web是同一用户级Agent的不同Surface；Interpreter、Search、Verifier和Browser Worker是模块或工具，不是独立权限主体。未来Specialist Agent仍不得拥有Task State或副作用权限。

## 故障降级

- DeepSeek不可用时，已经结构化并授权的确定性流程可以继续；新的自然语言输入回到结构化表单。
- JSON/Schema失败最多再尝试一次；Provider失败采用一个明确失败结果。
- Semantic conflict进入`NEED_REINTERPRETATION`，不自动重解释。
- 模型超时不得包裹外部提交事务，也不得改变现实预约状态。

## Prompt Injection

网页、邮件和Tool输出均为不可信数据。模型不能依据页面文字改变系统规则、扩大域名范围或获取Secret。Browser动作必须经过结构化Action与Policy校验。
