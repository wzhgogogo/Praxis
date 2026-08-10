# Agent Harness 生态项目调研与 Praxis 启示

- Status: Draft
- Version: 0.2
- Last updated: 2026-08-08
- Source of truth for: 2026-08-06 外部 Agent Harness 项目调研记录；不是 Praxis 架构决策依据
- Related ADRs: [ADR-0001](../decisions/0001-general-task-runtime.md), [ADR-0003](../decisions/0003-single-agent-orchestration.md)
- Related documents: [Task Runtime](../architecture/TASK-RUNTIME.md), [Agent Orchestration](../architecture/AGENT-ORCHESTRATION.md), [Policy, Execution and Verification](../architecture/POLICY-EXECUTION-VERIFICATION.md), [Harness Design](../harness/HARNESS-DESIGN.md)

## 1. 背景与范围

本记录整理一次围绕 Agent Harness 生态项目的讨论。输入来自用户提供的 X 帖正文摘录，并于 2026-08-06 对其中一部分可明确识别的公开 GitHub 仓库进行了只读核对。

原帖将项目大致分为：

1. Coding Agent 工作台；
2. Multi-Agent 协作与任务编排；
3. Harness Runtime 与基础设施；
4. 安全、权限与沙箱；
5. 评测、验收与可观测性；
6. 垂直场景 Agent；
7. 渠道和平台接入。

这些项目大多面向 Coding Agent，不能直接等同于 Restaurant Booking Agent。本次调研的目标不是选择一个框架替代 Praxis Runtime，而是识别其中可以迁移到现实事务执行场景的工程机制。

## 2. 总体判断

这批项目验证了 Praxis 当前架构方向，没有形成需要推翻现有 Accepted ADR 的证据：

```text
确定性 Task Runtime
+ 有界模型推理
+ Policy / Authorization
+ 隔离执行
+ Evidence-based Verification
+ Harness / Replay
```

最值得吸收的不是 Multi-Agent 或桌面工作台，而是以下能力：

- 明确定义任务完成条件；
- 把执行、证据收集和 Outcome 判定分离；
- 保存可恢复、可追踪的因果事件链；
- 对外部写操作采用 fail-closed 权限控制；
- 把真实失败转换成 Replay Fixture 和 Golden Scenario。

这与 Praxis 已接受的边界一致：Runtime 拥有状态，Policy 拥有副作用许可，Verifier 拥有 Outcome 判定，DeepSeek 不直接执行写操作或宣布任务成功。

## 3. 重点项目与可迁移机制

| 项目 | 核对到的定位或机制 | 对 Praxis 的参考价值 | 采用判断 |
|---|---|---|---|
| [RxyCode](https://github.com/xin-yi33/RxyCode) | Plan/Execute、Tool Orchestration、Evidence、独立 Validator、安全与审计 | 将执行结果、Evidence 和完成判断拆开 | 借鉴分层，不引入其 Multi-Agent 复杂度 |
| [Orca Agent](https://github.com/echoVic/orca-agent) | DeepSeek-native、持久目标、Verifier、Resume/Fork、结构化事件流和权限模式 | 参考长期任务恢复、Checkpoint、Verifier 和机器可读运行轨迹 | 借鉴 Runtime Contract，不直接复用 Coding Agent Runtime |
| [goal-conditions](https://github.com/CSZHK/goal-conditions) | 用 End State、Proof、Invariant、Bound 约束完成声明 | 将“预约完成”变成可执行的领域完成条件 | 最适合近期纳入 Restaurant Harness 设计 |
| [evidence-harness](https://github.com/kinpoe-ray/evidence-harness) | Evidence-first、bounded、policy-gated、verifiable 的 TypeScript Kernel | 说明 Evidence 应是一等运行数据，而非最终状态旁的文本说明 | 项目较新，研究模式，不作为依赖 |
| [bash-guard](https://github.com/lloydzhou/bash-guard) | Default deny、显式授权、fail-closed 和脱敏审计 | Policy 或审计不可用时拒绝外部写操作；按 Capability 授权 | 将 Shell 权限思想转换为业务 Action Capability |
| [boxsh](https://github.com/xicilion/boxsh) | 进程、文件系统、网络隔离，超时和 Worker 恢复 | 参考 Browser Worker 的隔离与回收 | Browser Agent 阶段参考；MVP 不引入通用 Shell Runtime |
| [OpenPrd](https://github.com/mileson/openprd) | 需求澄清、确认门禁、稳定评审工件、结构化任务与验证记录 | 区分用户确认事实、项目事实和 Agent 推断；不要把关键状态留在聊天记录 | 当前 `docs/`、ADR、devlog 和 test-log 已覆盖主要原则 |
| [pi-workbench](https://github.com/ZY-LI-F/pi-workbench) | 本地工作台、模型路由、Agent Teams、Kanban/DAG | 主要是开发者工作台体验 | 不进入 Praxis 产品 Runtime |
| [Setsuna Desktop](https://github.com/Setsuna-Agent/setsuna-desktop) | 跨平台桌面 Coding Agent | 证明 Agent 入口在扩展 | 当前 Web-first MVP 不需要参考其 Surface |
| [ntkit](https://github.com/NakliTechie/ntkit) | AI-assisted development 的严谨性工具层 | 可参考开发过程中的验证纪律 | 不属于 Restaurant Agent 生产 Runtime |
| [KiroCrew](https://github.com/kirodotdev/KiroCrew) | 常驻Gateway统一Web/Desktop/CLI/消息Surface，并提供Session、Memory、Cron、TaskRunner、Apps、Approval和Activity | 暴露Praxis在可靠执行内核之上仍需要Web-first Agent Workspace、跨会话Case和用户可见Activity | 借鉴产品层原语；不采用其KiroACP绑定、Coding TaskRunner、本地信任模型或Multi-Agent作为生产基座 |

备注：原帖中的 `Kun`、`Lambda Agent`、`Taus`、`ATTEST-100`、`Pulse` 等名称存在同名或仓库身份不明确的问题。本次没有把它们的二手描述当成已验证事实，也不据此做架构决策。

## 4. 对 Praxis Harness 的再定义

这次调研进一步说明，“Harness”不是单一组件，也不是硬规则本身。Praxis 可以把它理解为四个相邻层次：

```text
Task Harness
  驱动Event、Clock、Checkpoint、失败和恢复

Action Harness
  观察Policy、Authorization、Adapter和Side Effect

Evidence Harness
  保存完成证据并由Outcome Oracle独立判定

Evaluation Harness
  运行Golden、Replay、Live Read-only和Controlled Live-write
```

硬规则仍然属于 Task Runtime、Policy Engine 和 Domain Verifier；Harness 负责构造世界、观察行为、保存证据和判断实现是否违反规则。

## 5. 建议保留的近期设计候选

以下内容是调研形成的设计候选，尚未成为 Accepted Architecture 或 Roadmap 承诺。进入实现前需要按照 Planning Skill 检查当前代码并决定是否更新正式设计。

### 5.1 Restaurant Completion Conditions

先在 Restaurant Domain 内定义，不提前建立万能抽象：

```text
End State
  BOOKED_VERIFIED

Proof
  预约编号、分店、时间、人数与本次Action匹配

Invariants
  只提交用户授权候选
  最多一次Commit Attempt
  Weak Evidence不能产生成功Outcome
  Authorization必须仍有效
  提交结果不明确不得重试

Bound
  Search Deadline、Availability TTL、Tool Step、验证截止时间
```

### 5.2 Booking Proof Bundle

Evidence 可考虑包含：

- `evidenceId`；
- 来源和采集时间；
- `strong / weak`等级；
- 脱敏Artifact引用或哈希；
- 从回执提取的Claims；
- 与Action Proposal匹配、缺失和冲突的字段；
- 产生Evidence的Execution Attempt。

DeepSeek可以提取未知页面中的字段，但必须由确定性Verifier根据Domain规则决定Outcome。

### 5.3 Causal Run Journal

在生产持久化Schema固定前，评估为Event、Command和Execution Attempt补充：

- `runId`；
- `attemptId`；
- `correlationId`；
- `causationId`；
- `actor`；
- `schemaVersion`；
- Model、Prompt、Tool和Adapter版本。

目标是支持恢复、拒绝陈旧Event、定位授权来源、把执行失败转成Replay，而不是为了建设通用Observability平台。

### 5.4 Fail-closed Capability Manifest

每个Adapter Action可显式声明：

- `read / external_write`；
- 是否需要Authorization；
- 是否允许重试；
- 是否需要Idempotency Key；
- 可接受的验证方式；
- 需要脱敏的字段；
- 允许的目标域名和外部系统。

如果Policy、Authorization校验或副作用审计无法完成，预约、取消和购买等写操作必须停止；只读搜索可以按明确的降级策略继续。

### 5.5 Harness Run Artifact

每次Harness运行可保存一个可回放工件：

```text
Scenario / Fixture Version
→ Input / Clock
→ Events / Commands
→ Policy Decisions / Authorizations
→ Adapter Responses
→ Evidence
→ Side Effect Ledger
→ Outcome / Oracle Assertions
```

这会形成后续最重要的质量循环：

```text
线上失败
→ 脱敏轨迹
→ Replay Fixture
→ Golden Scenario
→ 修复Runtime / Adapter / Prompt
→ 全量回放
```

## 6. 当前明确不引入

### Multi-Agent

MVP继续遵守 [ADR-0003](../decisions/0003-single-agent-orchestration.md)。Intent Parser、Search、Verifier和Browser Worker是模块或受控工具，不是拥有状态和权限的自治Agent。Multi-Agent会扩大状态冲突、成本、授权和恢复复杂度，目前没有对应收益。

### 通用Agent工作台

Kanban、Agent Teams、IDE、Terminal和多模型路由可能改善开发者体验，但不是Praxis Restaurant Booking的产品能力，不进入Task Runtime。

### 自进化Harness或通用Memory

先建立稳定Golden、Replay、Evidence和人工审查口径，再讨论自动从轨迹提炼规则。未经固定数据集验证的“自动进化”可能把偶然行为固化成错误规则。

### 通用Shell Sandbox

Praxis当前执行面是Partner API和Browser，不向模型提供任意Shell。首个Browser实现应优先满足Profile隔离、域名白名单、Secret临时注入、超时、进程回收和终态销毁；只有出现真实Shell执行需求时才评估通用Sandbox。

## 7. 对开发顺序的潜在影响

本调研不直接修改 [Roadmap](../roadmap.md)，但在Stage 1后续规划时应显式检查以下顺序：

1. 生产持久化前确认Event/Command因果元数据；
2. 补充Restaurant Completion Conditions和Proof Bundle；
3. 让Mock Harness产生可保存的Run Artifact；
4. 首个真实Adapter前完成Capability Manifest和fail-closed测试；
5. DeepSeek Tool Loop接入时加入步数、时间、Token上限和无进展终止条件；
6. 真实失败进入脱敏Replay和Golden Scenario。

如果这些候选改变正式接口、状态或Roadmap，需要先更新对应Architecture文档；如果改变Accepted决策，则新增ADR，不静默修改历史。

## 8. 结论

这批项目最有价值的共同信号是：Agent产品的差异越来越不在“模型能不能提出下一步”，而在系统能否回答以下问题：

- 为什么允许它执行这一步？
- 这一步是否真的发生？
- 有什么证据证明目标完成？
- 结果不明确时是否避免了重复副作用？
- 服务重启或人工接管后能否恢复？
- 一次真实失败能否转化成可重复的回归场景？

对Praxis而言，这进一步强化了产品内核：不是让DeepSeek获得更多自主权，而是让Runtime、Policy、Evidence、Verifier和Harness共同把现实事务可靠地办完。

## 9. 2026-08-08 KiroCrew后续评审

从Praxis的长期用户需求归零评审后，KiroCrew提供了一个此前调研没有充分覆盖的维度：Agent Harness之外，还存在连接用户Surface、持久Conversation、后台Run、Memory、Activity和Domain App的Agent Workspace产品层。

这一发现不否定Praxis现有Task Runtime与Action Control Plane，但改变了它们在总体架构中的位置。Task Runtime不再被描述为所有对话和探索行为的顶层总指挥，而是Durable Case State的权威；Web-first Agent Gateway与Workspace负责持续协作体验。正式决策见[ADR-0006](../decisions/0006-web-first-agent-workspace.md)，实现顺序见[Roadmap Stage 2B](../roadmap.md#stage-2b--persistent-agent-shell)。

KiroCrew当前仍以本地或自管Host、KiroACP和Coding Agent工具为主要假设；其通用Tool Approval、自动Lessons和App信任边界不能直接表达Praxis的业务授权、PII事实、Evidence和`OUTCOME_UNKNOWN`。因此它是架构与产品模式来源，不是已选依赖。
