# Agent Orchestration

- Status: Accepted
- Version: 1.6
- Last updated: 2026-08-10
- Source of truth for: Agent Workspace中的模型职责、有界Loop、前后台运行与Multi-Agent边界
- Related ADRs: [ADR-0002](../decisions/0002-deepseek-model-runtime.md), [ADR-0003](../decisions/0003-single-agent-orchestration.md), [ADR-0006](../decisions/0006-web-first-agent-workspace.md)
- Related documents: [Agent Gateway and Workspace](AGENT-GATEWAY-AND-WORKSPACE.md), [Task Runtime](TASK-RUNTIME.md), [Policy & Execution](POLICY-EXECUTION-VERIFICATION.md)

## 原则

Praxis采用单一用户级Agent。Agent Gateway负责路由用户交互，Agent Workspace负责对话、Context和非权威Working Plan，Task Runtime拥有Durable Case State。模型不是权威状态或副作用总指挥，Task Runtime也不存储全部Conversation或探索过程。

```text
用户消息
→ Agent Gateway定位Conversation与Case
→ Agent Workspace装配最小Context
→ DeepSeek解析Intent或提出Proposal
→ Runtime决定进入SEARCHING
→ Search Service确定性执行
→ DeepSeek解释候选
→ 用户授权
→ Runtime + Policy + Adapter执行
→ Verifier判定结果
→ DeepSeek解释Outcome
```

## 前台与后台运行

前台Conversation可以保留有限近期消息，用于自然连续的交互。浏览器断开不会取消Durable Case，新的前台Interaction Session从服务端Case State恢复。

后台Trigger、外部Event或Follow-up必须使用新的有界Run，从Task Snapshot、Attempt/Authorization引用和最小Domain Context重建；不得依靠完整聊天转录“记住”任务进度。后台Run的模型失败只产生明确失败Event或不改变状态，不能覆盖前台Session、自动扩大授权或把Case标为完成。

## DeepSeek职责

- 自然语言Intent解析和约束更新；
- 生成最小澄清问题；
- 日英查询词扩展；
- 基于事实字段解释候选；
- 未知页面的标签、阶段和错误辅助理解；
- 失败原因解释和受控恢复建议。

不负责：状态跳转、Task Graph写入、权限、外部提交、重试决策、成功判定。

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

当前已实现Restaurant Intent Draft Schema Validator、Fixture/Replay Eval Harness、服务端`ModelGateway`、DeepSeek HTTP Provider Contract和`RestaurantIntentParser`。Stage 2A/2B产品路径仍由Local-only Fixture ModelGateway驱动同一Parser和`UNDERSTANDING / NEEDS_INPUT`状态路径，不发送真实模型请求。Gateway固定使用非流式Chat Completion、受请求级超时约束；Parser要求JSON、限定500个输出Token、关闭Thinking、拒绝非`STOP`完成，并仅对JSON/Schema无效输出重试一次。2026-08-08已完成1条受控真实DeepSeek Intent Connectivity Smoke，只证明Key、Gateway、Parser和Schema链路可用，不代表单轮或渐进决策质量Baseline。Tool Call Contract仍未实现；真实模型配置只存在Git忽略的服务端本地环境，未接入Web产品路径。

Restaurant低确定性需求、多轮偏好形成和推荐收敛的新评测规则现定义在Draft [Progressive Decision Eval v2](../harness/RESTAURANT-DECISION-EVAL-V2.md)。Dataset/Fixture/Annotation Contract、7个Golden Seed Episode和S0 Dataset Preflight已实现，17个Turn已完成人工Gold并通过Strict Preflight；Eval-only Reducer、S1–S8 Scorer、首错/Blocked归因、Fixture Oracle和18个S0–S8单点Mutation已可运行。S6–S8把固定池Eligible检索、检索后选择/多样性以及State/Candidate Fact/禁止声明分开评分；严重过敏候选卡还必须输出“仍需餐厅确认”的结构化披露，但不会创建生产Consent、Authorization或外部请求。Eval-only Model Contract现通过现有服务端Gateway提供版本化Prompt、严格Proposal Schema、最多一次无效输出重试和`FAIL_CLOSED`失败；它禁止模型自称完成候选检索，完整Episode Runner仍待实现。该路径保持Harness-only；即使后续通过也不能直接改变Task State，或被报告为产品能力。

## Loop类型

### 对话补充Loop

Intent不完整时追问，直到阻塞字段完整、用户取消或达到上限。

### 搜索扩展Loop

普通代码分批检查候选，达到3家、Deadline或候选耗尽即停止。

### 有界Model Tool Loop

用于只读、可恢复的开放步骤：模型提出Tool Call，Runtime校验Schema和Policy后执行，再返回结果。必须有最大步数、Token和时间预算。

### Browser Interpretation Loop

未知官网可以“观察→模型建议一个动作→Browser Policy校验→执行→再观察”。只能走到提交前Checkpoint；最终提交不在Loop内。

## Tool暴露

模型可以使用粗粒度只读/提议工具：

```text
find_executable_candidates
inspect_candidate
compute_route
propose_booking
request_clarification
request_human_takeover
```

禁止暴露：

```text
commit_booking
cancel_reservation
submit_payment
mark_outcome_verified
```

模型返回Tool Call只是建议，不是Authorization。

## Multi-Agent

MVP不使用Multi-Agent。Desktop与Mobile Web是同一个用户级Agent的不同Surface；Intent Parser、Search、Verifier和Browser Worker是模块/工具，不是拥有独立权限和状态的Agent。并行Connector是普通并发。

未来Specialist Agent只可作为受控工具处理独立、开放式子任务；Task状态和副作用仍归统一Runtime。

## 故障降级

- DeepSeek不可用时，已结构化且已授权的确定性流程可以继续。
- 新自然语言输入降级为结构化表单。
- JSON/Schema校验失败重试一次，再进入表单或固定错误流程；Provider失败不在Parser内盲重试。
- 模型超时不得包裹外部提交事务。
- 模型故障不得改变现实预约状态。

## Prompt Injection

网页、邮件和Tool输出均视为不可信数据。模型不能依据页面文字改变系统规则、扩大域名范围或获取Secret。Browser动作必须经过结构化Action和Policy校验。
