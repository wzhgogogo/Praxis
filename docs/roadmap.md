# Praxis Build Roadmap

- Status: Accepted
- Document revision: 4.4
- Last updated: 2026-08-20
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

## 当前 Stage 2 状态

Stage 2A / 2B 的Fixture产品路径已迁移到ADR-0013冻结的`Semantic Interpreter → Proposal Contract → Compiler → Runtime/Reducer → Agent Decision → Action Validator → Execution Router`。Stage 2C冻结`restaurant-semantic-proposal@3`与开放`criteria` / `HARD` / `SOFT`强度；当前Prompt标识为`restaurant-semantic-prompt@7`。Prompt `@4`的首份Clean Holdout已运行并暴露，不能代替或验证Prompt `@7`。当前canonical Gold上的Prompt `@6/@7`运行是已暴露Acceptance Diagnostic，不能代替Clean Holdout。历史Decision Harness可执行代码已删除，仅在Git与历史记录中保留，不再是产品Baseline门槛。下一门槛是Hybrid E2E preparation：真实模型Agent Decision、Live read-only Discovery、Live read-only Availability和Mock Booking/Verification，随后运行h001–h005 E2E；详细已实现与未验证项只在[当前状态](STATUS.md)维护。

`restaurant-semantic-holdout@2`的空模板、私有数据入口、Preflight、确定性Scorer、冻结运行清单和一次性Runner已经实现；Prompt `@4` Baseline已完成并标记为`RESULT_EXPOSED`。Prompt `@7`的新未见Dataset仍是独立parser/semantic质量工作，不能复用既有私有标注或当前canonical Gold；它不阻塞Hybrid E2E preparation。

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
- 英文Web输入、Backend API、当前Semantic Interpreter、Fixture ModelGateway、Fixture Discovery/Availability与Agent驱动的候选选择已连通；
- 已补齐`UNDERSTANDING / NEEDS_INPUT / SEARCHING / AWAITING_AUTHORIZATION`主路径，并由Agent选定Candidate/Offer后停在授权前；
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

Freeze decision（2026-08-19更新）：当前产品语义主链固定为`Semantic Interpreter → Proposal Contract → Compiler → Runtime/Reducer`、`restaurant-semantic-prompt@7`、`restaurant-semantic-proposal@3`、`restaurant-semantic-scorer@3`和开放`criteria` / `HARD` / `SOFT`强度；业务推进固定为单一Restaurant Agent经Action Validator的受限Loop。历史Progressive Decision Harness的7个Episode / 17个Turn已完成架构探针与开发诊断使命，可执行Harness、命令和测试已经删除；历史只从Git与日志追溯。新的独立Baseline只评估当前语义链；单个未支持表达不会自动触发taxonomy、Provider mapping或架构改版。

Progress（截至冻结）：历史Progressive Decision Dataset、17个人工Gold Turn、Preflight、Fixture Oracle、Reducer/Scorer、Mutation和真实模型开发诊断均已完成并记录在历史日志；它们不再是活跃Stage门槛。当前Fixture产品链和`restaurant-semantic-regression@3`的15个已暴露Turn已完成；`restaurant-semantic-prompt@4`的Clean Holdout Baseline已完成并暴露，`restaurant-semantic-prompt@7`在当前canonical Gold上只完成了Acceptance Diagnostic，仍未有独立Baseline。Google Live Discovery、Browser Runtime和Tabelog只读代码路径已实现，但尚未用真实Provider完成实测。

- v5的`FULL_REGRESSION`真实模型诊断已覆盖全部7个Episode、17个Turn并完成评分；全部Gold和结果均已暴露，故仍只是`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。本轮定位到State/Accumulation、品牌与单店目标区分、Grounding和不足候选解释，尚不修改生产路径；
- 历史`progressive-decision-golden@0.8` / `progressive-decision-prompt@6`已把命名目标解析、检索充分性和证据装配收回Harness的可信侧：`FIXTURE_DISCOVERY`、`retrievalSummary`和确定性Grounding只定义未来只读Tool输入，不接入真实Discovery或产品Task。真实回归现在会产生只含结构化Patch/状态差异的本机诊断Artifact，且`retryCalls`已改按Turn计数；之后建立隔离Holdout，再核验一个真实Discovery来源；
- `restaurant-semantic-prompt@7`已将`occasion`收紧为用户明确的社会用餐情境，删除缺字段示例的`occasion: DATE`默认值，并加入`FAMILY`与`TEAM`的抽象映射；日历日期Topic与浪漫约会枚举明确分离。未加入Gold实体或样例答案，也尚未运行真实模型；相对时间解析仍是独立问题；
- 历史`progressive-decision-prompt@8` / `progressive-decision-runner@3`已在Harness内闭合最小相对时间解析：固定`referenceTime`和`Asia/Tokyo`下的`today`、`tomorrow`、`tonight`、`now`和`right now`成为可信State/Patch输入，冲突表达不猜测；日志同时显示原始模型Patch和有效Patch。它不使用真实时钟、不接产品Runtime，也未运行真实模型；更广泛的日期/时间自然语言解析仍须有真实需求后再扩展；
- 历史`progressive-decision-prompt@9` / `progressive-decision-golden@0.9`已在Harness内闭合地点策略表示：`FLEXIBLE.anchorQuery`表达出发锚点加移动弹性；无锚点`FLEXIBLE`仍需追问；同query的`AREA`/`NEAR_PLACE`在S1/S2等价，`ADDRESS_OR_STREET`、不同query和漏地点更新仍严格失败。它不使用真实地图、不接Discovery或产品Runtime；
- 历史`progressive-decision-prompt@10`已在Harness-only Model Contract中收紧状态抽取：社交语境不推出`party`，软偏好不提升`target`；这不改变Golden、Schema、Scorer或真实产品Runtime；
- 历史`progressive-decision-prompt@11`已在Harness-only Model Contract中收紧动作路由：品牌分店解析、目标餐厅检查、通用推荐和Exact Availability各自分离；这不改变Golden、Schema、Scorer或真实产品Runtime；
- 历史[Restaurant Progressive Decision Eval](superseded/harness/RESTAURANT-PROGRESSIVE-DECISION-EVAL.md)已完成Harness探针并冻结；其E1/E2/E3、S1–S8、Candidate Fixture和Grounding结果只保留为已暴露Regression，不再驱动产品Contract或Stage退出；
- 当前语义Regression只保留为开发诊断；当前canonical Gold上的Prompt `@7`运行固定为`EXPOSED_GOLD_ACCEPTANCE_DIAGNOSTIC`，只允许与Prompt `@6`的`COMMON_UNCHANGED_TURNS`比较，不可与Prompt `@4/@5/@6`整集或Baseline混报。为Prompt `@7`建立只接受当前`message → expectedDraft`边界的隔离评测入口；历史`expectedDecision`不参与当前评分。再由不参与Prompt编写的人或隔离流程创建、标注并保密小型Holdout。冻结模型、Prompt、`restaurant-semantic-proposal@3`、Evaluator和Case顺序后一次性运行；任何样本或结果泄露到调优过程即降级为Regression并另建Holdout；
- Hybrid E2E preparation期间，定义Restaurant Domain内部的最小Entity Observation和Interaction Event Contract：前者保存Source、Source Entity ID、`observedAt`、Freshness和使用限制；后者记录结构化需求、动作、检索、曝光、反馈、选择和Verified Outcome引用；
- 只接一个经过能力核验的真实Discovery来源，首选Google Places；
- 使用Freshness-aware查询复用仍有效的Observation，过期或高风险字段按用途刷新；Source查询、实体合并和硬过滤不依赖模型重复阅读完整结果；
- 保存来源、ObservedAt和能力限制，建立Live Read-only检查；Stage 2C数据只用于Trace、回放和离线分析，不自动修改生产排序、Prompt或Policy。

Live Read H001 implementation（2026-09-03）：已升级为`restaurant-state@10`，包含Availability Check/Read Evidence和只读`PRESENT_RESULTS`。Google Places API (New) Text Search使用不依赖合作Abort的hard deadline；Tabelog Executor只读取明确标为available的slot控件，逐页补全门店身份并以HIGH-only resolution fail closed；area、每个positive HARD criterion、门店identity和指定日期/时段/人数availability都需要Evidence才能结束。所有外部执行仍需显式环境开关；尚未运行真实Provider、Browser或模型调用，故它们仍只是source + offline contract evidence。H002–H005和Scorer仍不在本阶段范围。

完成标准：Agent Loop architecture freeze后完成真实模型Agent Decision、真实英文查询的Live read-only Discovery与Availability、以及Mock Booking/Verification的Hybrid E2E preparation，并运行h001–h005 E2E；最小Interaction Event能串联需求、展示、反馈、Agent选择和Verified Outcome引用；Fixture、Real Model Mock World和Live Read-only结果分别记录。新的未泄露`CLEAN_HOLDOUT`继续作为独立parser/semantic质量工作。此时仍不宣称真实Booking、完整Browser自动化或历史Progressive Decision Harness描述的完整渐进决策。

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
