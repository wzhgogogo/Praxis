# Task Runtime

- Status: Accepted
- Document revision: 1.3
- Last updated: 2026-08-20
- Source of truth for: 通用任务生命周期、状态推进、触发和父子依赖
- Related ADRs: [ADR-0001](../decisions/0001-general-task-runtime.md), [ADR-0006](../decisions/0006-web-first-agent-workspace.md), [ADR-0012](../decisions/0012-migration-and-agent-loop-hardening.md), [ADR-0013](../decisions/0013-agent-loop-final-hardening.md)
- Related documents: [Agent Gateway and Workspace](AGENT-GATEWAY-AND-WORKSPACE.md), [Overview](OVERVIEW.md), [Interfaces](INTERFACES-AND-SCHEMAS.md)

## Implementation Status

Stage 1已实现两种Runtime：[`InMemoryTaskRuntime`](../../src/core/task-runtime/in-memory-task-runtime.ts)用于快速Mock Harness；[`PostgresTaskRuntime`](../../src/infrastructure/postgres/postgres-task-runtime.ts)使用同一`TaskDefinition`，在单一事务内写入Task State、Event和Command Outbox。两者均支持乐观版本、重复Event去重和`runId / attemptId / correlationId / causationId / actor / schemaVersion`因果Trace。

已实现Source包括SQL迁移、`pg`事务Adapter、Outbox租约、确定性Command结果Event、`DurableCommandWorker`、Recovery Coordinator、持久化Goal/Task Graph和Trigger/Scheduler。PGlite集成测试已验证SQL事务回滚、去重、租约过期、Runtime实例重建、Restaurant External Write不明确时自动进入`OUTCOME_UNKNOWN`、trajectory Decision Context追加迁移、两个关键子任务完成后Goal聚合为`ACHIEVED`、定时Trigger到期/重领/失效/有界失败，以及Recurring Shopping/Long-running Case合成Harness的等待语义；`npm run test:postgres:live`已在隔离本机PostgreSQL 17上通过。该Smoke不替代生产权限、网络、备份或并发负载验证。

以下仍为`proposed`且不阻塞Stage 2：跨Domain的`CREATE_CHILD_TASK` Command/Task Definition Registry、依赖满足后的自动激活、生产Domain的Trigger Event Factory、生产Scheduler进程、Schema Migration Runner的并发部署门禁、Coordination合成Domain状态机和生产Queue进程。只有真实Restaurant闭环或第二个真实Domain产生需求后才实现。Recurring Shopping的Harness Trigger Factory与Long-running Case的Harness状态机已实现，仅用于验证Runtime，不构成产品能力。

## 与用户可见Case的边界

Task Runtime只管理需要跨会话、跨时间保存并确定性推进的状态。它不管理Conversation全文、前台Interaction Session、模型Working Plan、UI组件状态或用户可见Activity文案。

Stage 2B中Restaurant Case是Root Task的用户可见投影：Case读取Task Snapshot、Pending User Action、Authorization、Attempt和Outcome形成摘要，不复制或反向写入第二套Domain State。Conversation可以引用Case，模型输出必须转换为校验后的Event或Proposal才能影响Task。未来一个Case包含多个Task时，由真实User Flow触发设计；当前不扩展Goal Graph代替Case产品模型。

## 运行模型

Runtime 使用 `State + Event → New State + Commands`。Reducer 必须是确定性的；Command Worker 执行外部工作并产生新 Event。

```text
Event Store / API
      ↓
load Task + version
      ↓
TaskDefinition.transition(state, event)
      ↓
new state + commands
      ↓ atomic transaction + outbox
Command Worker
      ↓
new Event
```

模型输出、工具返回、Scheduler和用户输入都先转换为 Event，不能直接修改状态。

## 通用对象

```ts
type GoalStatus = "ACTIVE" | "ACHIEVED" | "FAILED" | "CANCELLED";

type TaskLifecycleState =
  | "CREATED"
  | "READY"
  | "RUNNING"
  | "WAITING_USER"
  | "WAITING_TIME"
  | "WAITING_EXTERNAL"
  | "NEEDS_ATTENTION"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED";

interface TaskDefinition<State, Event, Command, Outcome> {
  type: string;
  version: string;
  create(input: unknown, context: TaskContext): State;
  transition(state: State, event: Event, context: TaskContext): {
    state: State;
    commands: Command[];
  };
  evaluateOutcome(state: State): Outcome | null;
}
```

当前Trace Contract：

```ts
type TraceMetadata = {
  schemaVersion: "1";
  runId: string;
  attemptId?: string;
  correlationId: string;
  causationId?: string;
  actor: "USER" | "RUNTIME" | "MODEL" | "POLICY" | "ADAPTER" | "SYSTEM";
};
```

`TaskSnapshot`携带`runId`。Runtime记录完整Event Trace；每个Command的`causationId`必须是产生它的Event ID。生产API接入后，Event Actor必须由可信服务端边界确定，不能信任客户端自报。

Lifecycle用于通用调度；`domainState`保存具体状态，如 `SEARCHING` 或 `VERIFYING`。Runtime不解释Domain State。

## 父子任务

Status: `implemented: persistent graph subset`。

依赖条件：

- `UPSTREAM_SUCCEEDED`
- `UPSTREAM_TERMINAL`
- `ANY_UPSTREAM_SUCCEEDED`
- `ALL_UPSTREAM_SUCCEEDED`

当前已实现：`goals`、成员关系、父子指针、关键任务标记、同Goal依赖、环检测、依赖就绪计算和Goal状态聚合。`UPSTREAM_SUCCEEDED`与`ALL_UPSTREAM_SUCCEEDED`当前都要求全部上游成功；复杂的混合依赖必须由中间Task表达。

规则：

1. 当前Graph API只连接已经创建的Task；跨Domain的`CREATE_CHILD_TASK` Command与Registry仍为proposed。
2. Graph把下游计算为`READY`、`WAITING`或`BLOCKED`；自动投递Domain的启动Event仍为proposed。
3. 每个Task只有一个状态写入者。
4. Root Task根据被标记为关键的子任务Outcome聚合结果。
5. 模型可以提出Task Plan，Runtime必须校验Task Type和依赖后才能创建。

## Trigger

Status: `implemented: persistent scheduler subset`。

```ts
type Trigger =
  | { type: "USER_EVENT" }
  | { type: "SCHEDULED"; triggerAt: string }
  | { type: "EXTERNAL_EVENT"; source: string }
  | { type: "SYSTEM_RETRY"; attempt: number };
```

Scheduler只投递Event，不保持常驻模型Loop。外部邮件、Webhook或平台状态变化经签名验证、去重和标准化后投递。

当前`task_triggers`保存到期时间、期望Task版本、Trace、租约和投递状态。`TriggerScheduler`使用`FOR UPDATE SKIP LOCKED` Claim到期Trigger，并先写入确定性`event:trigger:{triggerId}`再标记`DISPATCHED`。租约过期可重领；期望版本陈旧转为`OBSOLETE`；Factory或Dispatch持续失败在有界次数后转为`FAILED`。Scheduler不直接解释Domain Event，需由Domain Trigger Event Factory映射。

## Command 分类

| 类别 | 示例 | 默认重试 |
|---|---|---|
| 无副作用 | `CALL_MODEL`, `RUN_READ_TOOL` | 有界重试 |
| 可恢复准备 | `PREPARE_ACTION` | 从Checkpoint恢复 |
| 外部写入 | `COMMIT_ACTION` | 不自动重试 |
| 结果检查 | `VERIFY_OUTCOME` | 可重复读取 |
| 等待 | `WAIT_UNTIL` | 到期投递一次Event |

每个Command必须携带稳定`idempotencyKey`。重复Event通过事件ID和Task版本去重。

## 并发与一致性

- Task更新使用乐观锁`version`。
- 状态、Command Outbox和Audit Event在同一数据库事务写入。
- 同一Action只能有一个活动Execution Attempt。
- 陈旧候选、授权或页面Checkpoint必须被拒绝。
- Worker崩溃后可以重放未完成的无副作用Command；`COMMITTING`只能转验证。

## PostgreSQL与Outbox实现

Status: `implemented source + embedded-postgres integration verified`。

当前Schema实现：

```text
tasks
task_events
task_commands        同时作为Transactional Outbox
goals
goal_task_memberships
task_dependencies
task_triggers
praxis_schema_migrations
```

Outbox状态：

```text
PENDING
→ LEASED
→ SUCCEEDED

EXTERNAL_WRITE lease失效且无结果Event
→ RECOVERY_REQUIRED
→ RECOVERY_DISPATCHED
```

恢复规则：

- `READ / PREPARE / POLICY / VERIFY / WAIT`租约过期后回到`PENDING`；
- `EXTERNAL_WRITE`租约过期且已存在`event:command:{commandId}`结果Event，直接Reconcile为`SUCCEEDED`；
- `EXTERNAL_WRITE`租约过期且没有结果Event，进入`RECOVERY_REQUIRED`，永不自动重新Lease；
- Worker结果Event ID固定为`event:command:{commandId}`，崩溃后重复Dispatch由Event去重吸收；
- Recovery Coordinator只Claim `RECOVERY_REQUIRED`，把Command交给Domain Recovery Event Factory；Restaurant映射为`COMMIT_UNCERTAIN`，状态进入`OUTCOME_UNKNOWN`并产生`VERIFY_BOOKING`，不会再次产生Commit；
- Recovery Event ID固定为`event:recovery:{commandId}`；Event持久化后Command转为`RECOVERY_DISPATCHED`，完成标记不明确时重复Dispatch由Event去重吸收；
- 生产ID Factory必须使用全局唯一ID，不能使用进程内递增序列。

## Unknown和等待

`unknown`是正式状态，不通过模型猜测填补。Task可等待：

- 用户补充；
- 指定时间；
- 外部平台确认；
- 人工接管；
- 无法确定的Outcome调查。

等待必须记录原因、下一次唤醒条件和超时后的处理方式。

## Schema 版本

- Goal、Task、Event和Domain State均有Schema版本。
- Trace Metadata当前为Schema `1`；所有Event输入都必须携带Trace并匹配Task Run，Runtime不再为旧Fixture补默认值。
- 当前尚未进入生产Pilot，也没有需要保留的真实Task数据。Schema变化默认同步修改代码和Fixture并删除旧路径，不增加仅用于本地原型的兼容层。
- 已应用的PostgreSQL Migration仍不可改写；未发布的结构变化也必须以新Migration追加。当前Restaurant的`restaurant-state@7 → @8`没有State transform：不兼容的本机开发Task通过显式、双重开关的reset命令删除，绝不在Runtime中自动重解释或清除。
- 一旦存在生产数据、进行中的现实任务或外部消费者，才启用版本迁移链和恢复测试；无法迁移时进入明确错误状态，不静默丢弃或重解释旧状态。
