# Praxis Build Roadmap

- Status: Accepted
- Version: 2.8
- Last updated: 2026-08-10
- Source of truth for: 从开发前文档到Tokyo Pilot的阶段计划和退出条件
- Related ADRs: [ADR Index](decisions/README.md)
- Related documents: [MVP PRD](product/MVP-PRD.md), [Agent Gateway and Workspace](architecture/AGENT-GATEWAY-AND-WORKSPACE.md), [Architecture Overview](architecture/OVERVIEW.md)

## Stage 0 — Foundation Documents

Status: `completed` — 2026-08-05。

目标：建立产品、架构、Domain、Harness、ADR和Agent工作规则。

完成标准：

- `docs/`成为Source of Truth；
- 关键决策有Accepted ADR；
- 40个Golden Scenarios有明确状态和禁止副作用；
- AGENTS和skills定义coding前后流程；
- 所有拟议接口标记为proposed。

## 交付原则

每个Stage都必须在前一个可运行产品上增加一层真实能力。先完成一条端到端路径，再扩大来源、Adapter或通用性；不把未来基础设施的完整度作为当前产品切片的退出条件。

```text
Mock端到端可运行
→ 跨会话Web Agent可恢复
→ 一个真实只读来源
→ 一个真实可写路径
→ 扩平台与预约后能力
```

## 扩展性与当前交付的平衡

Praxis需要为Shopping、Travel和长期Case保留演进能力，但“可扩展”不等于提前实现所有未来机制。后续工作按三类处理：

| 类型 | 现在做什么 | 判断标准 |
|---|---|---|
| 必须提前实现的地基 | 实现、测试并进入主架构 | 当前闭环需要，或后补会危及授权、幂等、现实副作用、状态一致性和数据归属 |
| 应提前预留的边界 | 写清职责、依赖方向和接口位置，不创建完整Runtime能力 | 未来大概率需要，但当前没有真实调用方，且以后可在模块边界内增加 |
| 由真实需求拉动的扩展 | 进入对应纵向Stage后实现 | 已有第二个真实使用者、当前路径被阻塞、外部平台能力已核实，或测量证明存在性能/可靠性问题 |

提前实现一项横向能力，至少满足以下之一：

1. 当前纵向切片必须使用；
2. 属于授权、幂等、Outcome、PII或不可逆副作用等安全不变量，后补会要求重写持久化状态或现实执行路径；
3. 已有两个真实使用者证明共性；
4. 是范围很小、边界明确的架构探针，并有Harness验证和明确停止点。

否则只在Design中预留位置。每个Stage默认只允许当前纵向切片需要的Core变化；横向能力不得单独延长Stage退出时间。

重新启动已冻结扩展的触发条件：

| 能力 | 当前状态 | 重新启动条件 |
|---|---|---|
| Goal Graph / Scheduler | 已实现最小探针，冻结 | Route/Reminder成为真实子Task，或Recurring Shopping进入产品开发 |
| Child Task Registry / 自动激活 | 仅设计 | 出现第二种真实Task Definition并需要Runtime创建和推进 |
| 生产Trigger Factory / Scheduler进程 | 仅设计 | 当前产品出现跨时间唤醒需求 |
| Coordination状态机 | 仅Graph验证 | 出现真实多人或多渠道协调User Flow |
| 通用Search Runtime抽象 | 仅设计 | 两个真实Source Connector暴露稳定共性；首个来源优先使用Restaurant内清晰实现 |
| Restaurant Entity Observation与Interaction Event | Stage 2C实现最小Domain闭环 | 接入首个真实Discovery Source前保存Provenance/Freshness和不可追回的结构化交互轨迹；只采集，不自动改变在线排序 |
| 通用Knowledge / Memory / Feature Platform | 仅设计职责 | 第二个真实Domain证明稳定共性，或真实Pilot数据量与查询需求证明需要独立平台 |
| 群体Trending与个性化排序 | 不在MVP启用 | 足量真实曝光、反馈和Verified Outcome通过隐私、偏差与离线Eval审查 |
| Multi-Agent / 多模型路由 | 不采用 | 单Agent或单模型出现经过Eval证明、无法由简单模块解决的问题 |
| 通用App Platform / Artifact DSL | 仅设计职责 | 第二个真实Domain出现，并与Restaurant形成稳定共享需求 |

## Stage 1 — Minimal Control Plane and Harness

Status: `completed` — 2026-08-07。

目标：建立足以安全驱动第一个Restaurant纵向切片的最小控制面，不接真实预约平台。

已完成：

- 内存与PostgreSQL Task Runtime、事务Outbox、Worker和恢复保护；
- Restaurant State、Policy、一次性Authorization、Execution Attempt、Evidence与Verifier；
- Mock Restaurant Harness、Side Effect Ledger和Run Artifact；
- DeepSeek Model Gateway、Restaurant Intent Parser、Fixture Eval与受控Real Eval入口；
- PGlite快速集成测试与隔离本机PostgreSQL Smoke；
- 已实现但暂不继续扩展的Goal Graph、Trigger/Scheduler、Recurring Shopping和Long-running Case合成Harness。

完成依据：重复Event和Worker恢复不产生重复副作用；未授权Commit、重复提交和False Success为0；Mock、Embedded PostgreSQL和Real PostgreSQL结果分开记录。

以下不是Stage 1阻塞项，等真实产品切片产生需求后再做：跨Domain Child Task Registry、依赖自动激活、生产Domain Trigger Factory、独立Coordination状态机、生产Scheduler/Queue进程。真实DeepSeek Eval属于Stage 2接通模型时的质量门，不是Runtime实现缺口。

复盘结论：Stage 1的Runtime安全与测试深度合理。Goal Graph、Scheduler和两个未来Domain合成状态机属于有界架构探针，确实为后续扩展提供了证据，但它们早于Search/Web闭环，已达到本阶段允许的扩展预算。现有实现保留并冻结；价值在于验证边界，而不是要求继续补齐所有未来Runtime能力。

测试结论：Stage 1结束时的61个自动化测试证明Reducer、Policy、Verifier、Outbox、恢复、持久化和Eval Contract，不证明Web体验、DeepSeek质量、搜索质量或真实平台连通。Stage 2A已将新增测试投入同一条Web/API/Search路径，并删除了`schema 1 → 2` Fixture迁移和缺失Trace兼容。后续测试继续优先覆盖用户可操作的纵向路径，不再单独扩充未来Runtime场景。

## Stage 2 — Search Product

Status: `in progress`。

目标：先形成可跨会话恢复的Web/Mobile Web Agent Shell，再从英文自然语言逐层达到最多3家真实可订、可执行候选，并让用户选择一家。

### Stage 2A — Local Mock End-to-end

Status: `completed` — 2026-08-07。

- 已删除没有真实数据消费者的Restaurant旧State迁移和缺失Trace兼容路径；
- 英文Web输入、Backend API、同一`RestaurantIntentParser`、Fixture ModelGateway、Fixture Search和候选选择界面已连通；
- 已补齐`UNDERSTANDING / NEEDS_INPUT / SEARCHING / AWAITING_SELECTION`主路径，并在选择后停在`AWAITING_AUTHORIZATION`；
- 新增本地HTTP端到端测试和3项Fixture Search Eval；本阶段不创建Authorization或`EXTERNAL_WRITE` Command。

完成依据：开发者可运行`npm run dev`，从一句英文Fixture请求走到最多3张候选卡并选择一家；自动化测试覆盖同一条HTTP API与状态路径。所有页面、API和Eval输出明确为`FIXTURE`，不宣称真实餐厅、空位或模型质量。

### Stage 2B — Persistent Agent Shell

Status: `completed` — 2026-08-08。

- 已增加Pilot Access Token到HttpOnly Session的服务端用户边界，并在PostgreSQL持久化Conversation与消息；Web纵向路径改用现有`PostgresTaskRuntime`和Durable Command Worker，不再依赖进程内Task恢复；
- 已建立`Conversation → Restaurant Case → Root Task`一对一映射，Case、Activity和Artifact均从权威Task/Event投影，不复制或反向写入Domain State；
- Responsive Web支持Desktop与Mobile浏览器，提供`Active / Needs You / Waiting / Completed` Case列表与详情；
- SSE在建立和重连时发送最新Case Snapshot，浏览器关闭、服务重启或换设备后从服务端状态恢复；
- Golden `W01–W05`已实现并通过，覆盖服务重启、第二设备Session、跨用户拒绝、SSE幂等重连和Conversation非权威性；
- 本阶段继续使用Fixture Model/Search，没有接真实Provider、通知渠道、Authorization入口或外部写操作。

完成依据：68个自动化测试全部通过，其中7个Stage 2B HTTP/SSE场景；In-app Browser在1280px Desktop与390px Mobile完成登录、Case创建、候选选择和响应式布局QA。PGlite证明Embedded-postgres Integration，但未替代真实PostgreSQL、跨浏览器、真实移动设备或真实Provider验证。下一纵向阶段进入Stage 2C。

### Stage 2C — One Live Discovery Source

Progress（2026-08-10）：Eval v2 Dataset/Fixture/Annotation Contract、7个Golden Seed Episode和S0 Dataset Preflight已实现；17个Turn均已完成人工Gold，Draft与Strict Preflight均已通过。Eval-only Reducer、S1–S8阶段Scorer、首错/Blocked归因、Fixture Oracle和18个S0–S8 Mutation已实现；S6/S7/S8分别评分固定Eligible检索、检索后选择/多样性和State/Candidate Grounding。版本化Harness-only Model Contract现经服务端Gateway严格验证Proposal、只重试一次无效Schema，并禁止模型伪造候选检索；完整Episode Runner尚未实现。严重过敏候选卡已在Golden v0.7中要求引用`attributes` Fact并明确“仍需餐厅确认”；这仍不是产品Consent或预约路径。下一步为完整Episode Model Runner；Progressive Decision Real Model Baseline和Live Discovery仍未实现。

- 在不修改产品运行路径的前提下，先实现[Restaurant Progressive Decision Eval v2](harness/RESTAURANT-DECISION-EVAL-V2.md)：E1/E2/E3多轮Episode、S0–S10阶段评分、首错归因、路由正负例、候选检索/选择解耦和Scorer验证；现有8条只保留为Single-turn Extraction Contract；
- 以E1/E2/E3各1个Episode完成受控DeepSeek Smoke，再经明确付费授权建立完整Progressive Decision Baseline；Harness-only结果不得声称Web已支持该行为；
- Baseline完成后、接真实Discovery前，定义Restaurant Domain内部的最小Entity Observation和Interaction Event Contract：前者保存Source、Source Entity ID、`observedAt`、Freshness和使用限制；后者记录结构化需求、动作、检索、曝光、反馈、选择和Verified Outcome引用；
- 只接一个经过能力核验的真实Discovery来源，首选Google Places；
- 使用Freshness-aware查询复用仍有效的Observation，过期或高风险字段按用途刷新；Source查询、实体合并和硬过滤不依赖模型重复阅读完整结果；
- 保存来源、ObservedAt和能力限制，建立Live Read-only检查；Stage 2C数据只用于Trace、回放和离线分析，不自动修改生产排序、Prompt或Policy。

完成标准：Eval v2的Dataset、Evaluator、Reducer、Fixture和Model Contract按计划冻结；Evaluator Mutation归因通过并生成包含首错阶段、Blocked下游、Raw/Controllable/Appropriate Intermediate结果的Real Model Baseline；真实英文查询能返回带来源和Freshness的餐厅实体；最小Interaction Event能串联需求、展示、反馈与Outcome引用；Fixture Oracle、Real Model Mock World和Live Read-only结果分别记录。此时仍不宣称Web已支持渐进决策，也不宣称餐厅“可订”。Baseline完成后再单独决定是否以及如何修改生产对话状态与User Flow。

### Stage 2D — One Live Availability Path

- 选择一个经只读验证可获得库存/预约入口的平台路径；
- 完成Outlet实体合并、硬过滤、预排序、Availability TTL和最多3家候选；
- 只有第一条路径端到端稳定后，才按覆盖收益增加第二来源。

完成标准：Search Golden Scenarios通过；Live Read-only透明报告来源、空位时间、可执行方式和限制，并在30秒预算内返回已有结果。

## Stage 3 — Single-path Booking Execution

目标：在用户只授权一家后，通过一条受支持路径完成真实预约和验证。

### Stage 3A — Mock Booking End-to-end

- Web展示关键条款并取得一次性Authorization；
- Revalidation、Policy、单次Commit、Verifier和最终Outcome通过Backend完整连通；
- UI覆盖明确失败返回选择与`OUTCOME_UNKNOWN`禁止换候选。
- `Needs You`中的授权、条款变化和Human Takeover入口可以在Mobile Web打开，并绑定用户、Case、Task版本和目标Action。

### Stage 3B — One Controlled Live-write Adapter

- 在API或已验证Browser路径中只选择一种；
- 建立Controlled Live-write门禁、Kill Switch、Evidence和测试后清理；
- 只有该路径真实需要时才增加Cloud Browser或Human Takeover，不提前建设通用浏览器平台。

完成标准：至少一个支持路径达到Pilot门槛；未经授权、重复提交和False Success均为0。其他平台Adapter不是Stage退出条件。

## Stage 4 — Proactive Follow-through and Pilot

目标：在已成功的搜索预约闭环上增加预约后价值并启动小规模Pilot。

按以下顺序逐层增加：

1. Google Routes、出发时间和预约详情保存；
2. 一个真实Trigger驱动等待确认、临近出发或预约变化，并通过Notification Outbox产生可恢复Deep Link；
3. 一个支持路径的取消与验证；
4. “新订后取消旧单”变更Saga和双重预约风险处理；
5. Pilot所需观测、失败回放、Adapter健康、Bad-case Eval和运营告警。

第一条通知渠道按Pilot可达性选择Web Push或Email之一，并提供同一个Case Deep Link；不同时建设多消息渠道。邮件/外部确认Event、更多取消平台和更复杂运营工具只在已选支持路径需要时实现。

完成标准：达到PRD Pilot指标，重大安全错误为0，失败可解释、可恢复、可回放。

## Future

Restaurant闭环验证后，优先用Recurring Shopping验证Scheduler、Private User Memory和Standing Authorization；不在餐厅开发期间同时建设真实Shopping业务。真实Pilot积累足量Restaurant曝光、反馈、选择和Verified Outcome后，再分别评审群体Aggregate Insight、Trending和个性化排序；三者不得因为已有Interaction Event就默认启用。
