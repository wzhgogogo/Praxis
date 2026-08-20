# Harness Design

- Status: Accepted
- Document revision: 3.8
- Last updated: 2026-08-20
- Source of truth for: Agent Workspace、Task、Search和Browser的模拟、回放、断言与故障注入
- Related ADRs: [ADR-0001](../decisions/0001-general-task-runtime.md), [ADR-0006](../decisions/0006-web-first-agent-workspace.md), [ADR-0010](../decisions/0010-restaurant-agent-loop-action-validation.md), [ADR-0011](../decisions/0011-restaurant-agent-loop-control-refinement.md), [ADR-0012](../decisions/0012-migration-and-agent-loop-hardening.md), [ADR-0013](../decisions/0013-agent-loop-final-hardening.md)
- Related documents: [Golden Scenarios](GOLDEN-SCENARIOS.md), [Superseded Progressive Decision Eval](../superseded/harness/RESTAURANT-PROGRESSIVE-DECISION-EVAL.md), [Test Skill](../skills/test/SKILL.md)

## Implementation Status

Evaluation code is organized by evaluation boundary in [src/eval/README.md](../../src/eval/README.md).

`mock`模式的Restaurant Task Harness已实现：Fake Clock、Scripted Restaurant Agent Decision、Mock Discovery/Availability/Execution/Verification、Action Validator、Command自动派发、Side Effect Ledger、Causal Trace、Booking Proof、Run Artifact和Agent Trajectory。入口为 [`RestaurantHarness`](../../src/harness/restaurant-harness.ts)。

ADR-0013本地Fixture路径由Semantic Interpreter和Restaurant Agent Decision共同经Fixture ModelGateway驱动：Agent依次提出Discovery、Availability、选择和Booking Proposal，Action Validator逐步检查，最终停在Authorization checkpoint。Harness证明Router绑定权威Search/Availability参数、Provider失败不归因为模型、`COMMIT_FAILED`和`BOOKING_ABSENT`完成mandatory chain后从`SELECTION_REQUIRED`恢复Agent、且新的proposal不能复用旧Authorization；timeout/step/rejection limit留下状态和trajectory，并验证Agent Context过滤、真实deadline、migration append及BOOK `proposalId`到Outcome的审计join。trajectory保存模型收到的脱敏Decision Context和schema version，route为`STRUCTURED_ADAPTER`。Browser Fixture、Fault Injector、Replay、Live Read-only和Controlled Live-write仍为`proposed`。Fixture通过不代表任何真实平台能力已验证。

Stage 2B的Agent Workspace Harness已实现为7个Local HTTP/SSE + PGlite场景：它驱动Pilot用户、Conversation、PostgreSQL Root Task、服务重启、第二个浏览器Session、SSE断线重连和Responsive页面Contract，并断言Projection不成为第二套权威状态。它没有执行真实浏览器视觉或交互测试，因此只证明HTTP/SSE行为和Mobile响应式标记，不证明跨浏览器视觉质量。

历史Restaurant Progressive Decision Eval的7个Episode / 17个Turn、Fixture Oracle、Mutation和真实模型诊断已经完成其架构探针使命；可执行代码已删除，设计与结果只在历史文档和Git中保留。当前语义评测只走`restaurant-semantic-regression@3`与`restaurant-semantic-holdout@2`，不再维护两套Evaluator。

默认产品基线包含15个PGlite数据库集成场景，验证Postgres SQL、事务Outbox、租约、Runtime重建、Restaurant Recovery Coordinator与trajectory Decision Context持久化。Goal/Task Graph、Trigger/Scheduler及两个合成Domain的8个冻结探针由`npm run test:probes`单独运行。两者都不是下方外部平台模式，也不能报告为真实PostgreSQL或Live Provider验证。

## 定义

Harness不是运行时硬规则。硬规则在Policy和Task Runtime；Harness构造场景、替换外部依赖、观察状态与副作用，并用Oracle判断行为是否正确。

```text
Scenario
→ Runtime + Domain真实代码
→ Model / Source / Browser / Clock Fixtures
→ Event、Command、State、Evidence、Side Effect Ledger
→ Assertions / Metrics
```

## 组成

- Scenario Runner：驱动用户、时间和外部Event。
- Model Fixture：固定DeepSeek文本、JSON、Tool Call、错误和超时。
- Source Fixture：Google/Hot Pepper等标准化响应。
- Browser Fixture：可控HTML流程、DOM变化、接管和断网。
- Fake Clock：时间快进、重复Scheduler和Deadline。
- Fault Injector：限流、网络故障、提交前后崩溃。
- Side Effect Ledger：记录可能改变外部世界的动作。
- Outcome Oracle：根据场景真值判断最终状态。
- Eval Preflight与Stage Scorer：验证版本、Fixture和配置，并记录首错阶段、Blocked下游和稳定错误码。
- Run Artifact：保存Fixture、Event、Command、Policy、Authorization、Evidence、Side Effect、最终Snapshot与Oracle Assertion。

## 四种模式

1. `mock`：全部模拟，CI默认。
2. `replay`：脱敏的真实API、DOM和轨迹快照；验证回归。
3. `live-readonly`：真实Discovery/Availability，不提交。
4. `controlled-live-write`：人工触发、明确授权、可取消的真实预约；禁止CI运行。

四种结果必须分开记录，不能把Mock通过称为真实平台验证。

## Harness类型

### Search Harness

断言Intent字段、实体合并、硬过滤、Top 3可执行性、来源部分失败和Time to Candidate。

Stage 2A/2B覆盖完整/缺失Intent、最多3个Fixture候选，以及由Agent选择候选/Offer后停在授权前；Stage 2B已增加Conversation/Case恢复、Activity和SSE行为；实体合并、硬过滤、来源失败、性能预算和真实可执行性留给Stage 2C/2D。

### Task Harness

断言最终State、必需/禁止Event与Command、用户等待点、父子依赖和幂等。

### Agent Workspace Harness

断言用户隔离、Conversation/Case/Root Task映射、服务重启恢复、SSE幂等重连、Responsive Web继续操作，以及聊天文本不能直接改变Task或Outcome。该Harness使用Fixture Model/Search，不证明真实模型或Provider能力。

### Browser Harness

断言页面阶段、单步动作、Checkpoint、接管、提交次数和Evidence。未知页面不得越过最终提交Guard。

### Progressive Decision Eval Harness

当前语义Regression用开发Oracle按`INPUT / MODEL_GATEWAY → SEMANTIC_PROPOSAL_CONTRACT → SEMANTIC_INTERPRETER → COMPILER → REDUCER → RUNTIME`首错归因；上游失败阻断下游。Proposal facts、Patch集合和Draft的开放`criteria`按去重排序后的集合语义比较；Criterion文本只按trim/case等价，polarity/strength与singleton保持精确比较，避免无关数组顺序制造假失败。Clean Holdout只报告`PRODUCT_SEMANTIC_ONLY`层级的最终语义Draft；历史`expectedDecision`字段只为旧标注兼容保留且不参与当前评分。Fixture Regression只验证Evaluator管线；私有Holdout才可产生独立Baseline。Live Read-only仍单独证明真实来源连接与数据质量。

### Runtime Compatibility Harness

用合成Shopping、Case和Coordination Domain验证Scheduler、外部等待、父子依赖和Outcome聚合，没有真实集成。

## Scenario格式

```ts
type Scenario = {
  id: string;
  taskDefinition: string;
  initialGoal: unknown;
  userEvents: unknown[];
  modelFixtures: unknown[];
  toolFixtures: unknown[];
  externalEvents: unknown[];
  clockEvents: unknown[];
  expected: {
    finalTaskStates: Record<string, string>;
    requiredEvents: string[];
    requiredCommands: string[];
    forbiddenCommands: string[];
    expectedOutcomes?: string[];
  };
};
```

不锁死模型话术和无关Tool顺序；断言事实、状态、不变量和副作用。

## 安全不变量

- 未授权不得出现Commit Ledger记录。
- 单候选失败后，未产生新proposal并获得新的Authorization前不得提交第二候选。
- 提交结果不明时同一Action最多一次写Attempt。
- `BOOKED_VERIFIED`必须有Strong Evidence。
- 跨用户Task、Takeover URL和Profile隔离。
- Runtime重放不得重复副作用。

## Run Artifact

Status: `implemented: Restaurant mock only`。

`RestaurantHarness.createRunArtifact()`当前返回内存对象，不写入磁盘。Artifact Schema `restaurant-harness-artifact@5`包含：

```text
Scenario / Mock Fixture摘要
Run / Task / 时间
Recorded Events + Causal Trace
Commands + Causal Trace
Policy Decisions / Authorizations
Agent Trajectory（模型实际收到的脱敏Context + contextSchemaVersion、state/action/verdict/`STRUCTURED_ADAPTER` route/observation、BOOK proposalId，以及Event/Command/Attempt/Evidence causal refs；不含raw prompt或Chain-of-Thought）
Booking Proof Bundles
Side Effect Ledger
Final Snapshot / Outcome
Oracle Assertions
```

Artifact只包含Mock数据。未来保存Replay或Live Artifact前必须执行PII、Cookie、Token和页面内容脱敏，并定义保留期限。

## 真实数据

Record/Replay前删除PII、Cookie、Token、银行卡、验证码和可识别用户内容。真实预约测试必须记录清理或取消结果。
