# Praxis 当前状态

- Status: Accepted
- Version: 1.9
- Last updated: 2026-08-19
- Source of truth for: 已实现能力、已验证范围、明确未验证项与下一道门槛
- Related ADRs: [ADR Index](decisions/README.md)
- Related documents: [Documentation Index](INDEX.md), [Roadmap](roadmap.md), [Verification History](history/TEST-LOG.md)

## 一句话状态

Restaurant v18 已完成可运行的 **Fixture/Mock Agent Loop**：Semantic Interpreter继续经Compiler/Reducer写入权威State；单一Restaurant Agent经ModelGateway选择下一业务动作，Action Validator守护不变量，Fixture Discovery与Availability分离，Policy/Authorization/Verifier边界仍保持权威。Restaurant State为`7`，Agent Action/Trajectory Schema为`1`。首份私有Clean Holdout仍为`RESULT_EXPOSED`；尚无真实餐厅平台接入。

## 已实现

| 能力 | 当前范围 | 权威说明 |
|---|---|---|
| Web / Workspace | 本地 Fixture、持久 Conversation / Case、HTTP/SSE 恢复与Agent选择的Candidate/Offer投影；停在授权前 | [MVP PRD](product/MVP-PRD.md)、[Workspace](architecture/AGENT-GATEWAY-AND-WORKSPACE.md) |
| 语义主链 | `Semantic Interpreter → Proposal Contract → Compiler → Runtime/Reducer`；稳定槽位加开放`criteria`，完整Domain JSON Schema经strict transport发送，随后仍本地校验；模型不能直接改 State 或调用 Tool | [ADR-0009](decisions/0009-semantic-strength-and-clean-holdout-baseline.md)、[ADR-0010](decisions/0010-restaurant-agent-loop-action-validation.md)、[Orchestration](architecture/AGENT-ORCHESTRATION.md) |
| Agent、搜索与轨迹 | 单一Agent的`Action Proposal → Action Validator → Execution Router`有界循环；Discovery Candidate与Availability Offer分离；Fixture / Mock route和结构化PostgreSQL trajectory已实现 | [Restaurant Domain](domains/RESTAURANT-BOOKING.md)、[Search Service](architecture/SEARCH-SERVICE.md) |
| 执行安全基础 | Runtime、Policy、Authorization、Verifier 与 `OUTCOME_UNKNOWN` 的 Mock / Embedded-postgres 闭环已存在 | [Policy & Verification](architecture/POLICY-EXECUTION-VERIFICATION.md)、[Task Runtime](architecture/TASK-RUNTIME.md) |

## 已验证的证据

| 模式 | 结论 | 不代表什么 |
|---|---|---|
| 当前产品 Unit / Fixture / Mock / Embedded-postgres | v18 Agent Loop完整基线`89/89`、冻结探针`8/8`、typecheck、arch:check与build均通过 | 真实PostgreSQL、真实Provider、Clean Holdout质量或浏览器视觉 |
| `REAL_MODEL_MOCK_WORLD` | 已暴露v17 DeepSeek Regression为`15/15`：15 calls全成功、0 retry、28,817 ms、44,466 reported tokens；它只证明当前公开样本的transport与语义回归 | Clean Holdout、泛化质量、真实餐厅事实、预约质量或模型 Baseline |
| `HOLDOUT_BASELINE` | 首份私有Baseline严格Preflight为15 session / 25 turn / 0 issue后只运行一次：15次模型调用全成功、0 pass、15个`SEMANTIC_RESULT`失败、10个上游阻断；artifact标记为`EXPOSED / RESULT_EXPOSED` | 不能以已暴露结果继续调优后宣称其仍是Clean，也不证明真实餐厅事实、预约质量或浏览器视觉 |
| `EXPOSED_HOLDOUT_REGRESSION` | Prompt v5对同一已暴露数据只运行一次诊断：16 calls全成功、3 / 25 exact pass、9个上游阻断；v4可比15 turn为0 → 2 exact pass。版本化字段分析记录保留原始结果且不重跑模型 | Clean Holdout、v5泛化质量、真实餐厅事实、预约质量或模型 Baseline |
| `EXPOSED_GOLD_ACCEPTANCE_DIAGNOSTIC` | 当前canonical Gold上的Prompt v6与v7诊断均为16 calls全成功、4 / 25 exact pass、9个上游阻断；v7仅以24个`COMMON_UNCHANGED_TURNS`比较v6，exact pass为3 → 3，H007因没有v6快照继续排除 | Clean Holdout、与v4整集直接对比、v7泛化质量、真实餐厅事实、预约质量或模型 Baseline |
| 冻结架构探针 | 独立`test:probes`为`8/8` | Restaurant当前产品质量或Stage完成度 |
| `REAL_MODEL_MOCK_WORLD` | v15已暴露Regression Smoke为`7/7`：7 calls全成功、0 retry、15,493 ms、18,955 tokens；因Prompt/Schema已升至v17，它现在只保留为历史transport证据 | v17 transport、泛化质量、真实餐厅事实、预约质量或模型 Baseline |
| 隔离本机 PostgreSQL Smoke | 曾验证 Runtime、迁移、Goal/Task Graph 与 Scheduler | 生产数据库部署或持续运行可靠性 |

真实模型 Regression 样本及结果已暴露，统一标记为 `DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。完整命令、失败口径和历史结果只在 [Test Log](history/TEST-LOG.md) 维护。

## v18 Agent Loop口径

- v18产品主链为 `Semantic Interpreter → Proposal Contract → Compiler → Runtime/Reducer → Agent Decision → Action Validator → Execution Router`。Agent只产生不可信Action；Validator不选择下一步；Runtime仍是唯一State writer。
- 没有任何确定性代码决定“无Candidate则再搜”或“A不可用则查B”；Harness以Scripted Agent分别证明第二次搜索策略和A→B availability trajectory。
- `BOOK_RESERVATION`只创建确定性Action Proposal并等待Authorization；Commit后的Verify与`OUTCOME_UNKNOWN`保护仍由确定性Runtime负责。
- 每个Agent step保存state版本/hash、capability、model metadata、action、verdict、route、observation和after-state链接；不保存Chain-of-Thought。
- 当前Semantic Prompt为`v7`，Proposal / Draft / Eval Schema固定为`3`，Restaurant State固定为`7`。`CRITERION{text, polarity, strength}`是唯一开放集合，strength固定为`HARD` / `SOFT` / `UNSPECIFIED`。Restaurant Agent Decision Prompt为v1、Action Schema为1；不建taxonomy、Provider mapping或动态Tool Registry。
- v17的`DECIDE_RESTAURANT_NEXT` / `RESTAURANT_DECISION_MADE`以及耦合Offer的`ExecutableCandidate`可执行路径已删除；v17的next-step标注只保留为历史语义评测输入，不再代表产品Runtime。
- v4 Baseline的结果不得用于改动后重跑；v7的任何质量结论均需要另一份未见Holdout。当前Gold更新后的诊断只能标记为`EXPOSED_GOLD_ACCEPTANCE_DIAGNOSTIC`，v7与v6只比较`COMMON_UNCHANGED_TURNS`。
- v15未运行的私有标注不兼容v17 Contract，不能迁入或报告为当前Holdout。v17空模板、私有入口、结构适配Preflight、确定性Scorer和一次性真实Runner已实现；runner在首个模型请求前写入Git忽略的`EXPOSED` artifact，并记录Dataset SHA、git SHA、scorer与prompt/schema hash。

## 明确未验证 / 未实现

- 当前Prompt v7已完成本地、已暴露Fixture和当前canonical Gold诊断；需要另建未见 `CLEAN_HOLDOUT` 才能形成新的质量评价；
- 任一真实 Discovery / Availability 来源的 Live Read-only；
- 真实 Authorization、Booking、取消、支付或 Controlled Live-write；
- 真实浏览器兼容性、真实移动设备、生产身份与生产 PostgreSQL 部署；
- `NEED_REINTERPRETATION` 的自动重解释。当前只记录冲突并询问用户或安全降级。

## 下一道门槛

1. 为Prompt v7建立新的未见Holdout；不得基于v4结果或当前已暴露canonical Gold修改后宣称新的Clean结果；
2. 在产品质量方向明确后，核验一个真实只读 Discovery 来源；
3. 再进入 Availability 与预约执行阶段。不得以当前 Fixture、已暴露 Regression 或已暴露 Holdout 代替新的质量门槛。

v18已完成Fixture Availability与Mock Booking/Verification；下一阶段是Hybrid E2E中的真实只读Discovery/Availability（不触及真实Booking）。

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
