# Agent Gateway and Workspace

- Status: Accepted
- Document revision: 0.10
- Last updated: 2026-11-02
- Source of truth for: Web/Mobile Web入口、Conversation/Session/Case边界、用户可见Activity与Domain Workspace
- Related ADRs: [ADR-0006](../decisions/0006-web-first-agent-workspace.md), [ADR-0049](../decisions/0049-source-bound-b1-booking-handoff.md), [ADR-0050](../decisions/0050-two-line-handoff-presentation.md)
- Related documents: [Architecture Overview](OVERVIEW.md), [Task Runtime](TASK-RUNTIME.md), [Data, Context and Security](DATA-CONTEXT-SECURITY.md)

## 产品目标

Praxis第一阶段是一个Responsive English Web Agent。Desktop Web与Mobile Web连接同一个服务端Agent Gateway；用户可以开始一项Restaurant事务、关闭页面、稍后或换设备继续，并从Case页面看到当前状态、下一步和已发生的关键活动。

Agent Gateway是模块化单体中的产品组合边界，不是新的部署服务。它统一处理用户身份、Conversation、Case导航、事件流和用户Action，再调用Application、Domain和Core Runtime。

## 核心对象

| 对象 | 负责 | 不负责 |
|---|---|---|
| `Conversation` | 持久消息历史、当前Case引用、用户与Agent交流 | 权威Domain State、授权和Outcome |
| `InteractionSession` | 一次前台连接、流式Turn、取消与短期上下文 | 跨天事实和后台恢复依据 |
| `Case` | 用户可见的生活事务容器、状态摘要、下一步和Root Task引用 | 自己执行状态转换；MVP由Root Task提供权威状态 |
| `ActivityItem` | 把Event、Command、Attempt和Outcome投影为用户可理解的时间线 | 作为第二套状态机或审计真相源 |
| `AgentArtifact` | 候选卡、授权请求、执行进度、Outcome等结构化UI数据 | 由模型自由声明事实或改变Task |
| `PendingUserAction` | `Needs You`中的选择、补充信息、授权和接管入口 | 替代Domain Authorization或扩大其范围 |

MVP中`Case : Root Task = 1 : 1`。该映射让产品先获得稳定的Case体验，同时保留未来一个Case包含多个Task的方向；当前没有真实调用者要求新建通用Case Graph或迁移现有Task表。

## 交互路径

```text
Responsive Web / Mobile Web
        ↓
Agent Gateway
        ├── Conversation & Interaction Session
        ├── Case List / Case Detail
        ├── Activity & Artifact Projection
        └── Pending User Action Router
        ↓
Application / Domain
        ↓
Task Runtime → Policy → Execution → Verifier
```

用户消息先经过Agent Gateway确定可信`userId`、`conversationId`和`caseId`。自然语言解析结果只能形成经过Schema校验的Event或Proposal；Task Runtime决定Durable Case State是否改变。Gateway从最新Task Snapshot和相关执行记录生成Case、Activity和Artifact视图。

<a id="当前查看上下文设计已定未实现"></a>

### 当前查看上下文（前端第一段离线实现）

工作区发送的消息请求须同时携带当前视图、正在看的候选ID及正在比较的候选ID集合，供`this one`、`these two`等指代使用。它们是客户端提出的交互上下文，不是可信业务状态或新的通用Context框架；HTTP消息请求中的`viewContext`是必填对象：`view`为HOME、CONVERSATION、CANDIDATES、DETAILS、SAVED或HANDOFF；可选`candidateId`仅用于实际显示单一候选的CANDIDATES/DETAILS/HANDOFF；`comparedCandidateIds`为最多3个不重复ID，第一段前端始终发空数组。HOME不接受候选/比较引用；无当前卡片时不默填首家。

Gateway先以认证身份核对Conversation与Case归属，再核对候选确实属于该Case、视图与候选引用一致，且语义动作仍适用于最新请求版本；不接纳跨用户、跨Case、未知或失效的引用。无有效指代对象时澄清，不默选第一家、不复用其他安排的对象。

经校验的查看上下文只用于指代解析，仍须经过现有语义及动作校验路径。查看、加入备选、比较和恢复视图均不写明确选定状态；只有独立的用户选店动作可以选择，选店也不构成ADR-0049之外的写入Authorization。客户端不能通过候选ID、上下文或自带URL绕过来源证据与交接校验。

前端第一段不实现比较页，未实际比较时不提供虚构比较对象。刷新、切换视图或SSE更新保留的当前卡片是交互定位；它与服务端权威选定、Task State和预约Outcome分离。

### 查找与备选并发规则（用户2026-10-30签收）

只适用于Agent loop已经完成、准备持久化的`SEARCH_COMPLETED`、`AVAILABILITY_CHECKED`、`CANDIDATE_FACTS_CHECKED`和`RESULTS_PRESENTED`事件。首次按原任务版本提交发生`StaleTaskVersionError`时，Application读取当前Snapshot与中间事件；仅在当前runId与原事件trace.runId相同、中间事件数恰等于版本差且非空、并且所有中间事件均为`SHORTLIST_UPDATED`时，允许把同一个已完成事件按当前任务版本重新提交一次。仍经过Runtime版本校验与原Reducer，不重跑模型或来源读取；第二次冲突照常失败，不循环。

需求修改、停止、其他Event插入、换run、无法完整核对事件记录、普通执行失败均不适用。选定、授权、提交、支付、取消现实预约、Verifier或Outcome事件不在允许事件集合内；来源新鲜度/证据/归属规则保持原校验，不因重交而放宽。该规则只解决界面保存备选与只读完成并发，不提供通用副作用重试许可。

## 前台与后台生命周期

前台Conversation可以使用：

- 当前用户消息与有限近期历史；
- 当前Case摘要和Pending User Action；
- 当前Domain所需的最小Public/Private Context；
- 已验证的Artifact事实字段。

后台Trigger、外部Event和Follow-up不恢复完整聊天Session。它们从以下输入重建：

```text
Trigger / External Event
+ latest Case/Task Snapshot
+ required Authorization or Attempt reference
+ minimum Domain Context
→ deterministic Event / bounded model purpose
```

前台Session断开不能取消Durable Case；后台运行失败也不能伪造前台回复或Outcome。浏览器刷新、SSE重连和跨设备打开都从服务端状态恢复。

## Web与Mobile Web

第一阶段使用同一Responsive Web代码库，不建设原生App。最低体验包括：

- 首页、`My plans`与安排工作区；移动端为左侧抽屉，桌面为常驻侧栏，复用现有Conversation/Case持久化；
- 工作区内切换Conversation、候选、详情、备选、比较和预约准备，Activity仍来自权威事件投影；比较不属于前端第一段；
- 可重连的服务端事件流；
- 绑定用户和目标Action的短期Deep Link；
- 在Mobile Web查看、补充、留作备选、明确选店及主动出发到来源网站；返回自报非阻断且最多一次；
- 新工作区按ID增量接纳SSE投影，更新后保留输入、当前卡片与展开状态；刷新恢复原视图和当前候选，停止或需求更新后不接纳旧轮迟到结果。

Web只提交用户意图和版本化Action，不持有Provider Secret，不推断权威状态。第一版按ADR-0049只做决策、准备和用户自主来源交接，不提供代提交或远程接管；未来任何授权入口仍须展示Domain要求的完整对象、时间、价格和条款，并在执行前重新验证。

查找进度只能投影实际事件及已知计数，三至四个阶段即可；不得模拟百分比。`Stop`必须调用现有后端取消能力，停止后结束进度并拒绝迟到卡片。若取消或进度生产端不存在，实施切片停止报告，不由前端模拟补齐。本轮仅写设计，不声称这些新交互已经实现。

## Domain Workspace

Restaurant在当前纵向切片内直接拥有自己的Artifact类型和Web组件。候选、条款、空位、Attempt和Outcome字段来自Domain/Application DTO；模型可以生成解释文本，但不能构造已验证事实。

当前不实现：

- 可安装App或第三方Plugin生命周期；
- 跨Domain通用Artifact DSL；
- 多Surface消息渠道；
- 跨任务自动Memory和自学习规则；
- 本地文件、Shell或OS Agent Runtime。

当第二个真实Domain需要同类Workspace能力时，再从两个真实调用者中提取最小共享Contract。

## 安全与数据

- 所有Case、Conversation、Activity和User Action查询必须按可信`userId`隔离。
- 客户端不能自报Event Actor、Authorization范围、Task版本或Outcome。
- Conversation和Activity是PII数据，遵守删除、脱敏和最小保留策略。
- Background Context不得因为实现方便而加载完整Conversation、完整邮箱或无关用户历史。
- Deep Link单次、短期、绑定用户、Case与Action；打开链接不等于完成业务授权。

## Implementation Status

Status: `implemented: Stage 2B Fixture subset + local Live Read-only composition`。当前模块化单体已经实现Pilot Session、PostgreSQL Conversation、`Conversation → Case → Root Task`映射、Case列表/详情、Domain Artifact、Event Activity和可重连SSE；Desktop/Mobile Web共享同一后端状态。`PRAXIS_RESTAURANT_PROVIDER_MODE`默认`FIXTURE`；显式`LIVE_READ`时服务端注入与H001相同的DeepSeek、Google和受控浏览器availability组合，缺任一gate/服务端配置会拒绝启动，绝不回落Fixture。Case仍是一对一Root Task投影，未新增通用Case Graph。

当前未实现生产身份提供方、后台主动通知、跨任务Memory、Authorization UI、远程Takeover或生产执行进度。Live Read-only页面只展示已grounded的结果、来源链接和稳定失败原因；它没有预约、付款、取消、登录、PII提交、远程验证码控制或公网部署承诺。SSE重连采用“先发送最新完整Snapshot”的简单协议，不是持久消息队列；Activity由持久化Event ID确定性生成，从而允许客户端替换和去重。

ADR-0049的B1交接、来源二次校验和独立持久化`USER_REPORTED`反馈已在main `00519783`整合；普通启动的来源链接读者/G3接线仍未启用，不据此宣称真实来源已验收。这里的取消不支持现实预约取消。当前SSE完整Snapshot协议可继续作为服务端投影输入；新前端须按ID合并，不能把它当作整页重建理由。新工作区外壳、查看上下文、逐家显示与恢复交互已在前端第一段工作分支完成本地Fixture浏览器链路，独立视觉复核及门禁状态见[计划](../superseded/plans/WEB-WORKSPACE-SLICE1-PLAN.md)。进度从当前轮持久事件与活动生命周期投影，首家复用生产证据资格；SSE完整Snapshot按候选ID保留交互位置。查找中SHORTLIST_UPDATED与完成的只读事件发生版本冲突时，Application仅在证明同run且所有中间事件均为备选编辑后，将该只读事件按最新版本重交一次；需求/停止/其他状态变化均不适用，不重跑来源读取。

## G1 displayed-restaurant follow-up (offline implementation)

After results are displayed, ask through the question field on one restaurant card. The authenticated server binds the displayed outlet, original user question, allowed source reader and current read run; code selects the sole legal `ANSWER_PAGE_QUESTION` without an Agent model call, still through Validator, Router and Reducer. The normal conversation composer continues to edit the restaurant request.

The answer panel shows one short answer, verbatim source quotations in their original language, source URLs and read times. `NOT_STATED` shows “Not stated on the page” and the pages actually checked. Sensitive categories add “Please confirm with the restaurant”; unverified answers are discarded. This does not establish HARD satisfaction, reception policy or availability.

Current-run identity-bound pages are reused first. Each question now has an independent 60-second deadline from submission, at most three model calls and two new document visits across sessions, configured in page-question-limits.ts. A cache miss uses the same bound-outlet reader, Guard and supplied source pacing; a process restart may reread the bound outlet without a completed search budget. Twenty distinct accepted questions per conversation are counted from persistent events, including cancelled/unverified work; duplicate delivery does not count twice, and the next question asks the user to start a new search. Search results and search accounting remain unchanged. Cancellation, expiry or a newer question discards late output. State24/TaskDefinition22 are unchanged; old State23 tasks are not silently migrated or reset.

This slice has offline fixture and local Chromium evidence only. Real-model answer faithfulness, sensitivity classification and “not stated” accuracy await the independently scored G1 evaluation; no Live quality claim is made. See [ADR-0046](../decisions/0046-observed-actions-and-source-quoted-answers.md).

## Explicit booking message records user choice (2026-11-02 CET; approved main integration)

Per ADR0049, an accepted SPECIFIC_OUTLET / BOOKING_WORDING message can record a uniquely matched outlet through the existing CANDIDATE_SELECTED event, without an Agent selection action. Code checks full-name uniqueness and a prior displayed candidate binding or existing HIGH entity evidence; ambiguity/partial references remain unselected. The accepted message event retains only a pending choice marker, never raw goalBasis or a new State field, so a party-only reply can resume that original choice after the normal candidate reset. New non-booking targets, semantic failure/conflict and mismatched current candidates cannot reuse it. USER event causation and a USER_MESSAGE trajectory distinguish this from Agent selection. Repeated same candidate/offer selection is a no-op. This grants no booking/authorization, changes no goal or source identity rule, and skips no availability. The existing same-turn B1 terms acquisition, budget/cancellation/reuse and 20-second reserve are unchanged. G1 questions, open recommendations and departures do not create choices. The user reported independent review passed and approved main integration. Evidence remains saved-response/local-source composition; Live assessment is separate.


## slice2 原始补充（frozen regression；2026-10-30历史，非本次验证）

以下保留slice2新增内容；旧State/TaskDefinition及“当前/待合入”表述是当时记录，不能覆盖上方main权威定义或本轮状态。新同步与验收见 `docs/superseded/plans/WEB-WORKSPACE-SLICE2-SYNC-PLAN.md`。

After results are displayed, the main composer in DETAILS calls the existing question interface for the outlet currently in view; cards have no second question input. The authenticated server binds the displayed outlet, original user question, allowed source reader and current read run; code selects the sole legal `ANSWER_PAGE_QUESTION` without an Agent model call, still through Validator, Router and Reducer. In CANDIDATES/CONVERSATION, the composer continues to edit the restaurant request. The UI view determines routing; a model does not choose it.
Current-run identity-bound pages are reused first. Each question now has an independent 60-second deadline from submission, at most three model calls and two new document visits across sessions, configured in page-question-limits.ts. A cache miss uses the same bound-outlet reader, Guard and supplied source pacing; a process restart may reread the bound outlet without a completed search budget. Twenty distinct accepted questions per conversation are counted from persistent events, including cancelled/unverified work; duplicate delivery does not count twice, and the next question asks the user to start a new search. Search results and search accounting remain unchanged. Cancellation, expiry or a newer question discards late output. At G1 integration, State24/TaskDefinition22 were unchanged; old State23 tasks are not silently migrated or reset.

## 第2段只读工作区投影（工作分支）

Case project复用已读取的同一用户/Case事件，不新增表、State字段、模型/来源调用或数据库往返。searchRevision表达搜索页/批次数，替代原误名requestRevision；requirementRevision比较应用patch后的完整意图草稿是否实际改变，而非只看SEMANTIC_PROPOSAL_COMPILED是否含字段；沿用Reducer的完整值/来源元数据相等规则，重放已接纳的地点绑定以恢复真实比较上下文，与another-batch分开。等价patch不切空分组，复用保留的展示集合及最近一次真实版本差异，不要求重发RESULTS_PRESENTED。revisionDiff只在批次结束后发布，比较最近两个条件版本内经Runtime接纳的展示ID集合；removed/added不由浏览器计算。savedCandidates从同Case历史恢复已保存对象的店名，仅当前合格对象标current，旧证据不成为当前可用性。

移除原因枚举为OVER_BUDGET、NEW_TIME_MISMATCH、NO_LONGER_MATCHES。预算/时段须有当前结构化判定，其他只能通用原因，不解析助手或Activity文本。questionHistory由PAGE_QUESTION_REQUESTED/COMPLETED按requestId、readRunId、candidateId绑定恢复，完成事件逆序；原引文/敏感标记、G1执行入口和20问限制不改。

readStatus区分已有结果、无合格结果、明确的全部来源失败、语义MODEL_FAILURE及其他故障。全部失败须逐店有非空的显式失败尝试且无成功检查；UNKNOWN、正常无位、未查或缺少attempt细节不冒充来源失败。按用户2026-10-30批准，TaskDefinition22→23，State24形状不变：NO_VERIFIED_RESULT可经NEXT_BATCH_REPLENISHMENT_REQUESTED回到SEARCHING，但服务端canContinue必须证明必要条件齐全、池内有未调查对象或已有匹配条件的观察游标/发现计划仍有未查工作。保留旧检查和游标，不重置来源计划；已有失败/不合格对象在Context及Validator中排除，模型不能改写这个边界。前端只消费canContinue，不自行推断。

全部来源失败不走another-batch；服务端canRetry允许原refresh通过AVAILABILITY_REFRESH_REQUESTED显式重查全部已确认失败的候选，保留原有展示结果刷新，不运行语义。两个入口均先核对归属，requestId重交不再读取，其他请求仍核对版本；沿用原有界读取、Stop、迟到丢弃和预算。只清除上一轮收尾窗口，不清空检查/备选或新增条件修改事件。实现与验证见[第2段计划](../superseded/plans/WEB-WORKSPACE-SLICE2-PLAN.md)。


### Round-4 workspace projection (2026-11-18, draft / not integrated)

The server supplies the exact current openable candidate IDs: presented IDs in PRESENT_RESULTS, otherwise currently qualified ready IDs. Saved links use that set; expired displayed availability remains browsable and booking still requires the existing fresh check. Removal/reason inference runs only for completed qualification (PRESENT_RESULTS or non-source-failed NO_VERIFIED_RESULT), never a stopped/cancelled/failed read. Revised Case titles after requirementRevision1 derive from authoritative criteria, area/date/time/party, never the old retrieval query; all server projections and list reloads share the result. NEEDS_INPUT exposes its current structured clarification separately from conversation history. Main messages are state-driven and isolated to CANDIDATES; restaurant Q&A stays in Details.


## 2026-11-18 — Round 6 read ownership and projections

Draft / not integrated. One persistent Case read owns an AsyncLocalStorage scope through discovery/retrieval, facts, availability and post-loop B1 terms. The shared production assembly resolves a separate browser budget and availability executor/entry ledger/named queries for each run; nested same-run work joins it, concurrent Cases cannot reset or close each other. Explicit G1 retains its independent budget. The legacy begin/end lifecycle remains available for existing callers.

Refresh, next-batch and location validate idempotency, pending G1, expected version and business prerequisites before cancelling only their Case. Preparation covers cancellation, fresh snapshot/rechecks, event persistence and asynchronous read registration; concurrent projection cannot classify that gap as an interrupted process. Preparing UNDERSTANDING/SEARCHING/SELECTION_REQUIRED counts as active. Details/Handoff and open galleries remain during active work, then return to candidates if the terminal projection has no current presented candidate.

The shared previous-revision selector is unchanged. revisionDiff additionally requires an actual earlier delivered batch; initial delivery after a clarification has no diff. A completed empty revision remains the immediately preceding baseline for a later diff and Saved validation.

### 2026-11-19 — Round 7 read mutation preflight

A durable request ID returns the current projection before the version check. Cancellation targets the ActiveRead instance seen by preflight. After it ends, the application rechecks the request ID, intervening user events, the requested target and read ownership before dispatching at the current snapshot version. An ordinary background completion on the same target can advance the version. Runtime duplicate delivery stops before appending another message or launching another read.

While the displayed batch has a pending fact refresh, the context and Validator allow fact investigation of its original targets and withhold discovery, availability and presentation. An availability refresh also withholds presentation until its pending targets are observed.

### 2026-11-19 — Round 8 delivery and workspace state

Saving a restaurant during the first read records a shortlist entry without consuming the short-delivery window. On bounded termination, the coordinator uses the same qualified, distinct candidate pool as the Agent context. A pending next batch excludes delivered outlets and caps automatic presentation at its target. The Validator, Router and Reducer still authorize presentation.

A Case summary carries the last task activity time and indicates an explicitly stopped failed read. The workspace orders cases newest first and ties by Case ID. The selected card follows the current qualifying set after the read ends. A stopped read may retain a ready outlet for About, with shortlist actions gated by the same phases as the reducer.

### 2026-11-19 — Round 9 delivery boundaries

Search, read completion, Validator and cached delivery apply the same exclusion for previously delivered outlets across source records while a user seeks another batch. Existing displayed results keep their refresh path. A delivery window uses the time at opening, and the closing action uses one timestamp across validation, routing and persistence.

Displayed expired cards offer refresh when permitted by the current Case. An expired stopped handoff can still show its safe source link.


### 2026-11-19 — Round 10 Case response ordering

Case responses are bound to the navigation and Case that started them. An older plan can update its sidebar summary after navigation. The currently open Case uses its SSE projection, buffering the newest snapshot while a mutation is pending. A version conflict uses that snapshot or reads the current Case once, preserving the unsent text. Sidebar status polling runs only while another Case is active.

A Case version conflict includes the server's current version. The workspace uses a buffered event only if its version has caught up, otherwise it reads the latest Case once. A successful response clears only the matching sent draft in its own plan. A prior-batch outlet still verified for the current request does not count as a removal.
