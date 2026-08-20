# Praxis 当前状态

- Status: Accepted
- Document revision: 2.2
- Last updated: 2026-08-20
- Source of truth for: 已实现能力、已验证范围、明确未验证项与下一道门槛
- Related ADRs: [ADR Index](decisions/README.md)
- Related documents: [Documentation Index](INDEX.md), [Roadmap](roadmap.md), [Verification History](history/TEST-LOG.md)

## 一句话状态

ADR-0013冻结的Restaurant Agent Loop已完成可运行的 **Fixture/Mock纵向切片**：Semantic Interpreter继续经Compiler/Reducer写入权威State；单一Restaurant Agent只接收最小Decision Context，Action Validator守护不变量，Router绑定且限时执行权威只读请求，definitive booking failure在旧Authorization被清除后可恢复到新的Proposal/Authorization checkpoint。首份私有Clean Holdout仍为`RESULT_EXPOSED`；尚无真实餐厅平台接入。

## 当前标识

| 对象 | 当前标识 |
|---|---|
| 产品Release | 尚未发布；package为`0.1.0` |
| 当前架构决策 | `ADR-0013` Agent Loop Final Hardening |
| Restaurant State | `restaurant-state@8` |
| Semantic Proposal / Draft / Eval Schema | `restaurant-semantic-proposal@3` |
| Semantic Prompt | `restaurant-semantic-prompt@7`；Artifact字段仍记录`promptVersion: "v7"` |
| Agent Context / Decision Prompt / Action / Trajectory / Harness Artifact | `restaurant-agent-context@1` / `restaurant-agent-decision-prompt@2` / `restaurant-agent-action@2` / `restaurant-agent-trajectory@4` / `restaurant-harness-artifact@5` |
| Regression / Holdout / Scorer | `restaurant-semantic-regression@3` / `restaurant-semantic-holdout@2` / `restaurant-semantic-scorer@3` |

## 已实现

| 能力 | 当前范围 | 权威说明 |
|---|---|---|
| Web / Workspace | 本地 Fixture、持久 Conversation / Case、HTTP/SSE 恢复与Agent选择的Candidate/Offer投影；停在授权前 | [MVP PRD](product/MVP-PRD.md)、[Workspace](architecture/AGENT-GATEWAY-AND-WORKSPACE.md) |
| 语义主链 | `Semantic Interpreter → Proposal Contract → Compiler → Runtime/Reducer`；稳定槽位加开放`criteria`，完整Domain JSON Schema经strict transport发送，随后仍本地校验；模型不能直接改 State 或调用 Tool | [ADR-0009](decisions/0009-semantic-strength-and-clean-holdout-baseline.md)、[ADR-0010](decisions/0010-restaurant-agent-loop-action-validation.md)、[ADR-0011](decisions/0011-restaurant-agent-loop-control-refinement.md)、[Orchestration](architecture/AGENT-ORCHESTRATION.md) |
| Agent、搜索与轨迹 | 单一Agent的最小`Agent Context → Action Proposal → Action Validator → Execution Router`有界循环；Router绑定权威Search/Availability参数并中止超时read，Discovery Candidate与Availability Offer分离，三类Loop终止、BOOK proposal ID和Event/Command/Attempt/Evidence causal refs已持久化 | [Restaurant Domain](domains/RESTAURANT-BOOKING.md)、[Search Service](architecture/SEARCH-SERVICE.md) |
| 执行安全基础 | Runtime、Policy、Authorization、Verifier 与 `OUTCOME_UNKNOWN` 的 Mock / Embedded-postgres 闭环已存在 | [Policy & Verification](architecture/POLICY-EXECUTION-VERIFICATION.md)、[Task Runtime](architecture/TASK-RUNTIME.md) |

## 已验证的证据

| 模式 | 结论 | 不代表什么 |
|---|---|---|
| 当前产品 Unit / Fixture / Mock / Embedded-postgres | ADR-0013 Agent Loop完整基线`100/100`、冻结探针`8/8`、typecheck、arch:check与build均通过 | 真实PostgreSQL、真实Provider、Clean Holdout质量或浏览器视觉 |
| `REAL_MODEL_MOCK_WORLD` | 已暴露`restaurant-semantic-prompt@7` Regression为`15/15`：15 calls全成功、0 retry、28,817 ms、44,466 reported tokens；它只证明当前公开样本的transport与语义回归 | Clean Holdout、泛化质量、真实餐厅事实、预约质量或模型 Baseline |
| `HOLDOUT_BASELINE` | 首份私有Baseline严格Preflight为15 session / 25 turn / 0 issue后只运行一次：15次模型调用全成功、0 pass、15个`SEMANTIC_RESULT`失败、10个上游阻断；artifact标记为`EXPOSED / RESULT_EXPOSED` | 不能以已暴露结果继续调优后宣称其仍是Clean，也不证明真实餐厅事实、预约质量或浏览器视觉 |
| `EXPOSED_HOLDOUT_REGRESSION` | `restaurant-semantic-prompt@5`对同一已暴露数据只运行一次诊断：16 calls全成功、3 / 25 exact pass、9个上游阻断；`restaurant-semantic-prompt@4`可比15 turn为0 → 2 exact pass。版本化字段分析记录保留原始结果且不重跑模型 | Clean Holdout、Prompt `@5`泛化质量、真实餐厅事实、预约质量或模型 Baseline |
| `EXPOSED_GOLD_ACCEPTANCE_DIAGNOSTIC` | 当前canonical Gold上的`restaurant-semantic-prompt@6/@7`诊断均为16 calls全成功、4 / 25 exact pass、9个上游阻断；Prompt `@7`仅以24个`COMMON_UNCHANGED_TURNS`比较Prompt `@6`，exact pass为3 → 3，H007因没有Prompt `@6`快照继续排除 | Clean Holdout、与Prompt `@4`整集直接对比、Prompt `@7`泛化质量、真实餐厅事实、预约质量或模型 Baseline |
| 冻结架构探针 | 独立`test:probes`为`8/8` | Restaurant当前产品质量或Stage完成度 |
| `REAL_MODEL_MOCK_WORLD` | 历史Semantic Proposal Contract的Regression Smoke为`7/7`：7 calls全成功、0 retry、15,493 ms、18,955 tokens；因Prompt/Schema已替换，它现在只保留为历史transport证据 | 当前`restaurant-semantic-proposal@3` transport、泛化质量、真实餐厅事实、预约质量或模型 Baseline |
| 隔离本机 PostgreSQL Smoke | 曾验证 Runtime、迁移、Goal/Task Graph 与 Scheduler | 生产数据库部署或持续运行可靠性 |

真实模型 Regression 样本及结果已暴露，统一标记为 `DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。完整命令、失败口径和历史结果只在 [Test Log](history/TEST-LOG.md) 维护。

## ADR-0013 Agent Loop口径

- 当前产品主链为 `Semantic Interpreter → Proposal Contract → Compiler → Runtime/Reducer → Agent Decision → Action Validator → Execution Router`。Agent只产生不可信Action；Validator不选择下一步；Runtime仍是唯一State writer。
- 没有任何确定性代码决定“无Candidate则再搜”或“A不可用则查B”；Harness以Scripted Agent分别证明第二次搜索策略和A→B availability trajectory。
- `SEARCH_RESTAURANTS`不重复Intent，`CHECK_AVAILABILITY`不重复日期、时段和人数；Execution Router从权威State绑定这些参数。Provider read失败、Router执行失败与模型决策失败使用不同Event和trajectory outcome。
- Agent只得到`restaurant-agent-context@1`，没有Authorization、Proposal terms、Execution Result、Evidence Artifact或Reservation；Provider read收到可中止的8秒deadline。`DomainSearchStrategy.hasEnough`只表示Discovery检索预算已满足，不表示Availability、Loop终止或Booking授权。
- `BOOK_RESERVATION`只创建确定性Action Proposal并等待Authorization；Commit后的Verify与`OUTCOME_UNKNOWN`保护仍由确定性Runtime负责。`COMMIT_FAILED`或`BOOKING_ABSENT`完成其mandatory chain后，Orchestrator只在`SELECTION_REQUIRED`重新进入Agent Loop；旧proposal/authorization/attempt已清除，新proposal必须配新Authorization，Reducer拒绝proposalId不匹配的旧Authorization。
- `SELECTION_REQUIRED`投影为`RUNNING`，供Agent恢复；它不再残留`SELECT_CANDIDATE` pending-user action。timeout、step limit和rejection limit都写入明确终止状态和trajectory。
- 每个Agent decision step保存state版本/hash、capability、模型实际收到的脱敏`restaurant-agent-context@1`与`contextSchemaVersion`、action、verdict、route、observation、after-state链接、BOOK `proposalId`及Event/Command/Attempt/Evidence causal refs；不保存raw prompt或Chain-of-Thought。完整链为`Context → Action → Validation → Execution → Observation → State/Outcome`。
- 长期Execution Route仅为`STRUCTURED_ADAPTER`、未来`GENERIC_BROWSER`或未来`HUMAN_TAKEOVER`；Fixture/Mock/Live是运行模式或Provider metadata，Runtime/Policy checkpoint不是外部execution route。
- Migration `0006`保持原始evidence refs形态，`0007`追加因果引用与Proposal ID，`0008`再追加Decision Context字段；不会再改写Migration。`restaurant-state@7`开发Task不能被当前Runtime解释，必须先备份后用双重开关的本机重置命令删除，绝不自动迁移或用于真实数据。
- 当前标识固定为`restaurant-semantic-prompt@7`、`restaurant-semantic-proposal@3`与`restaurant-state@8`。`CRITERION{text, polarity, strength}`是唯一开放集合，strength固定为`HARD` / `SOFT` / `UNSPECIFIED`。Agent Context为`@1`、Decision Prompt为`@2`、Action为`@2`、Trajectory为`@4`；不建taxonomy、Provider mapping或动态Tool Registry。
- ADR-0007的`DECIDE_RESTAURANT_NEXT` / `RESTAURANT_DECISION_MADE`以及耦合Offer的`ExecutableCandidate`可执行路径已删除；历史next-step标注只保留为语义评测审计输入，不再代表产品Runtime。
- `restaurant-semantic-prompt@4` Baseline的结果不得用于改动后重跑；Prompt `@7`的任何质量结论均需要另一份未见Holdout。当前Gold更新后的诊断只能标记为`EXPOSED_GOLD_ACCEPTANCE_DIAGNOSTIC`，Prompt `@7`与`@6`只比较`COMMON_UNCHANGED_TURNS`。
- 旧分类Criteria Contract下未运行的私有标注不兼容`restaurant-semantic-proposal@3`，不能迁入或报告为当前Holdout。当前空模板、私有入口、结构适配Preflight、确定性Scorer和一次性真实Runner已实现；runner在首个模型请求前写入Git忽略的`EXPOSED` artifact，并记录Dataset SHA、git SHA、scorer与prompt/schema hash。

## 明确未验证 / 未实现

- `restaurant-semantic-prompt@7`已完成本地、已暴露Fixture和当前canonical Gold诊断；需要另建未见 `CLEAN_HOLDOUT` 才能形成新的质量评价；
- 任一真实 Discovery / Availability 来源的 Live Read-only；
- 真实 Authorization、Booking、取消、支付或 Controlled Live-write；
- 真实浏览器兼容性、真实移动设备、生产身份与生产 PostgreSQL 部署；
- `NEED_REINTERPRETATION` 的自动重解释。当前只记录冲突并询问用户或安全降级。
- semantic conflict gating remains intentionally unchanged pending real Agent/E2E observation.

## 下一道门槛

```text
Agent Loop architecture freeze
↓
Hybrid E2E preparation
  - Real model Agent Decision
  - Live read-only Discovery
  - Live read-only Availability
  - Mock Booking / Verification
↓
h001–h005 E2E
```

`restaurant-semantic-prompt@7`的新`CLEAN_HOLDOUT`保留为独立的parser/semantic质量工作，不能以已暴露数据冒充Baseline；它不再是启动Hybrid E2E preparation的blocking dependency。Hybrid E2E仍不触及真实Booking，Fixture、已暴露Regression和已暴露Holdout都不能被报告为Live能力。

## 按问题阅读

| 要回答的问题 | 先读 |
|---|---|
| 现在真正有什么、还缺什么？ | 本页 |
| 产品承诺与用户流程是什么？ | [MVP PRD](product/MVP-PRD.md)、[User Flows](product/USER-FLOWS.md) |
| 状态、模型、执行如何分层？ | [Architecture Overview](architecture/OVERVIEW.md)、[ADR Index](decisions/README.md) |
| Restaurant 的语义、状态与决策细节？ | [Restaurant Domain](domains/RESTAURANT-BOOKING.md)、[Interfaces](architecture/INTERFACES-AND-SCHEMAS.md) |
| 如何测试或跑 Eval？ | [Test Skill](skills/test/SKILL.md)、[Eval Skill](skills/eval/SKILL.md)、[Harness Design](harness/HARNESS-DESIGN.md) |
| 外部能力是否真实可用？ | [Capability Matrix](integrations/CAPABILITY-MATRIX.md) |
| 历史上为什么这么改、跑过什么？ | [Dev Log](history/DEVLOG.md)、[Test Log](history/TEST-LOG.md) |
