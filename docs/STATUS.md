# Praxis 当前状态

- Status: Accepted
- Version: 1.3
- Last updated: 2026-08-16
- Source of truth for: 已实现能力、已验证范围、明确未验证项与下一道门槛
- Related ADRs: [ADR Index](decisions/README.md)
- Related documents: [Documentation Index](INDEX.md), [Roadmap](roadmap.md), [Verification History](history/TEST-LOG.md)

## 一句话状态

Restaurant v15 已完成可运行的 **Fixture 语义到搜索**纵向链路，并已冻结职责边界、Prompt `v2`、Proposal Schema `1`及Holdout Evaluator；私有Clean Holdout仍待人工标注，尚无真实模型Baseline或真实餐厅平台接入。

## 已实现

| 能力 | 当前范围 | 权威说明 |
|---|---|---|
| Web / Workspace | 本地 Fixture、持久 Conversation / Case、HTTP/SSE 恢复与候选选择；停在授权前 | [MVP PRD](product/MVP-PRD.md)、[Workspace](architecture/AGENT-GATEWAY-AND-WORKSPACE.md) |
| 语义主链 | `Semantic Interpreter → Proposal Contract → Compiler → Runtime/Reducer → Decision Kernel`；模型不能直接改 State 或调用 Tool | [ADR-0007](decisions/0007-semantic-proposal-compiler-and-decision-kernel.md)、[Orchestration](architecture/AGENT-ORCHESTRATION.md) |
| 决策与搜索 | `ASK_USER`、`SEARCH`、`PRESENT_CANDIDATES`、调整与安全冲突降级；Fixture Search 最多三家候选 | [Restaurant Domain](domains/RESTAURANT-BOOKING.md) |
| 执行安全基础 | Runtime、Policy、Authorization、Verifier 与 `OUTCOME_UNKNOWN` 的 Mock / Embedded-postgres 闭环已存在 | [Policy & Verification](architecture/POLICY-EXECUTION-VERIFICATION.md)、[Task Runtime](architecture/TASK-RUNTIME.md) |

## 已验证的证据

| 模式 | 结论 | 不代表什么 |
|---|---|---|
| 当前产品 Unit / Fixture / Mock / Embedded-postgres | 默认基线`65/65`通过，且typecheck与build通过 | 冻结探针、真实PostgreSQL、真实Provider、Clean Holdout质量或浏览器视觉 |
| 冻结架构探针 | 独立`test:probes`为`8/8` | Restaurant当前产品质量或Stage完成度 |
| `REAL_MODEL_MOCK_WORLD` | v15 `eval:semantic:deepseek` 连续 10 次均为 `7/7`，合计 `70/70`；链路止于 Fixture Search | 泛化质量、真实餐厅事实、预约质量或模型 Baseline |
| 隔离本机 PostgreSQL Smoke | 曾验证 Runtime、迁移、Goal/Task Graph 与 Scheduler | 生产数据库部署或持续运行可靠性 |

真实模型 Regression 样本及结果已暴露，统一标记为 `DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。完整命令、失败口径和历史结果只在 [Test Log](history/TEST-LOG.md) 维护。

## Stage 2C 冻结口径

- v15 产品主链固定为 `Semantic Interpreter → Proposal Contract → Compiler → Runtime/Reducer → Decision Kernel`；Stage 2C 不重新分配这些职责。
- 当前产品 Prompt 固定为 `v2`，Proposal Schema 固定为 `1`。同一版本内可修复不改变 Contract 的缺陷；新增字段或不兼容语义必须先重新评审版本与 ADR，不能由单个 Eval Case 静默推动。
- v14 Decision Harness与旧单轮Intent Parser的可执行代码、命令和测试已删除；7 Episode / 17 Turn及旧连通性结果只保留在Git与历史文档，不再进入当前基线。
- 下一份独立Baseline只评估当前v15产品语义链；历史结果与Fixture Search不能替代它。
- v15 Holdout的空模板、私有数据入口、Preflight、确定性Scorer、固定运行清单和一次性真实Runner已实现；实际数据仍为空，不得把工程就绪报告成Baseline完成。

## 明确未验证 / 未实现

- 完成人工标注并首次运行的 `CLEAN_HOLDOUT` 真实模型 Baseline；
- 任一真实 Discovery / Availability 来源的 Live Read-only；
- 真实 Authorization、Booking、取消、支付或 Controlled Live-write；
- 真实浏览器兼容性、真实移动设备、生产身份与生产 PostgreSQL 部署；
- `NEED_REINTERPRETATION` 的自动重解释。当前只记录冲突并询问用户或安全降级。

## 下一道门槛

1. 在Git忽略的私有文件中人工标注新的v15 `CLEAN_HOLDOUT`，通过严格Preflight后按已冻结清单仅运行一次；
2. 只在该 Baseline 已单独报告后，核验一个真实只读 Discovery 来源；
3. 再进入 Availability 与预约执行阶段。不得以当前 Fixture 或已暴露 Regression 代替上述门槛。

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
