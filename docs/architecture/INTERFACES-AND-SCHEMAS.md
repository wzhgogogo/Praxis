# Interfaces and Schemas

- Status: Accepted
- Document revision: 2.9
- Last updated: 2026-09-04
- Source of truth for: 公共接口、DTO、内部Tool、实现状态和版本规则
- Related ADRs: [ADR Index](../decisions/README.md), [ADR-0010](../decisions/0010-restaurant-agent-loop-action-validation.md), [ADR-0011](../decisions/0011-restaurant-agent-loop-control-refinement.md), [ADR-0012](../decisions/0012-migration-and-agent-loop-hardening.md), [ADR-0013](../decisions/0013-agent-loop-final-hardening.md)
- Related documents: [Task Runtime](TASK-RUNTIME.md), [Restaurant Domain](../domains/RESTAURANT-BOOKING.md)

接口必须逐项标记状态，不得用局部原型暗示完整API或平台能力已经存在。

## Implementation Status

| Contract | Status | Current implementation |
|---|---|---|
| `TaskDefinition`、`TaskSnapshot`、Event/Command Envelope | `implemented: in-memory prototype` | [`src/core/task-runtime`](../../src/core/task-runtime/contracts.ts) |
| Event/Command Causal Trace | `implemented: in-memory prototype` | [`InMemoryTaskRuntime`](../../src/core/task-runtime/in-memory-task-runtime.ts) |
| 乐观版本检查、Event去重、Command记录 | `implemented: in-memory prototype` | [`InMemoryTaskRuntime`](../../src/core/task-runtime/in-memory-task-runtime.ts) |
| `ActionProposal`、`Authorization`、`PolicyDecision` | `implemented: MVP subset` | [`src/core/policy`](../../src/core/policy/contracts.ts) |
| Restaurant Intent、Discovery Candidate、Availability、Availability Check、Read Evidence、Event与Command | `implemented: Fixture + Live Read contracts` | [`Restaurant contracts`](../../src/domains/restaurant/contracts.ts) |
| Restaurant Semantic Interpreter / Proposal Contract | `implemented: Fixture product path` | ADR-0007职责链与ADR-0009的开放`criteria` / `HARD` / `SOFT`强度已替换产品的Fixture Intent Parser路径；真实模型仍只在评测中使用 |
| Restaurant Semantic Compiler | `implemented: Restaurant product path` | 纯确定性Proposal → `RestaurantIntentPatch` → Domain Event翻译；不建立Core通用Compiler |
| Restaurant Agent Context / Action / Capability / Decision | `implemented: Fixture product and Live Read slice` | `restaurant-agent-context@2`只投影可决策字段及Availability的业务状态，不含Provider/Browser详情；单一Agent提出五种业务动作，Search只可带retrieval hint、Availability只可带candidate IDs，Router绑定权威请求参数 |
| Restaurant Action Validator | `implemented: ADR-0011` | 仅允许、拒绝或要求Authorization；不选择下一步，不调用Tool |
| Restaurant Agent Trajectory | `implemented: Restaurant-specific PostgreSQL + Mock artifact` | `restaurant-agent-trajectory@5`保存模型实际收到的脱敏`restaurant-agent-context@2`和`contextSchemaVersion`，并关联state/action/verdict/route/执行元数据/observation、Proposal ID及Event/Command/Attempt/Evidence causal refs；不保存raw prompt或Chain-of-Thought |
| `NEED_REINTERPRETATION` | `implemented: reserved safe decision` | 记录语义冲突并询问用户；不自动重解释或改State |
| Restaurant `BookingProofBundle`与Completion Verifier | `implemented: Mock vertical slice` | [`booking-verifier.ts`](../../src/domains/restaurant/booking-verifier.ts) |
| Restaurant Harness Run Artifact | `implemented: mock only` | [`restaurant-harness.ts`](../../src/harness/restaurant-harness.ts) |
| PostgreSQL迁移与`pg`事务Adapter | `implemented; local real smoke verified` | Migration ID不可改写；`0007`从`0006`的legacy evidence refs追加causal refs / proposal ID，`0008`再追加trajectory Decision Context字段，详见[`migrations.ts`](../../src/infrastructure/postgres/migrations.ts) |
| PostgreSQL Task/Event/Command Outbox | `implemented; PGlite integration verified` | [`PostgresTaskRuntime`](../../src/infrastructure/postgres/postgres-task-runtime.ts) |
| Command租约与Durable Worker | `implemented; PGlite integration verified` | [`DurableCommandWorker`](../../src/core/task-runtime/durable-command-worker.ts) |
| Recovery Coordinator与Restaurant Recovery Mapping | `implemented; PGlite integration verified` | [`RecoveryCoordinator`](../../src/core/task-runtime/recovery-coordinator.ts) |
| Goal、成员关系、依赖与聚合 | `implemented: persistent graph subset` | [`PostgresGoalGraph`](../../src/infrastructure/postgres/postgres-goal-graph.ts) |
| 持久化Trigger、租约与Scheduler | `implemented: persistent scheduler subset` | [`TriggerScheduler`](../../src/core/task-runtime/trigger-scheduler.ts) |
| Pilot Session与服务端用户边界 | `implemented: local Fixture subset` | [`PilotSessionService`](../../src/application/persistent-restaurant-agent.ts) |
| Conversation、Case、Activity与Artifact API | `implemented: Stage 2B Fixture subset` | [`local-web-server.ts`](../../src/server/local-web-server.ts) |
| SSE可重连Case Snapshot | `implemented: Stage 2B Fixture subset` | [`local-web-server.ts`](../../src/server/local-web-server.ts) |
| `ModelGateway`与DeepSeek HTTP Provider Contract | `implemented: connector contract only` | [`src/core/model`](../../src/core/model/contracts.ts)、[`DeepSeekModelGateway`](../../src/infrastructure/deepseek/deepseek-model-gateway.ts) |
| Model Tool Contract | `proposed` | 尚未暴露任何Tool给模型 |
| Google Places Discovery / Cloudflare Browser Runtime / Local Playwright Chromium Runtime / TableCheck→Tabelog Availability | `implemented: source + offline contract tests; live unverified` | `RestaurantAvailabilityProvider`仅有TableCheck与Tabelog两个真实实现；固定resolver把provider failure保留在execution metadata，并只在所有来源耗尽后产生候选级稳定失败。本地Runtime仅由显式`LOCAL_CHROMIUM`选择，不能接触Cloudflare；在两条eval-only interactive gate下，Tabelog可发出脱敏`USER_INTERVENTION_REQUIRED` pause metadata并保持同一local persistent session/page到终端人手恢复，challenge未清除仍fail closed；所有路径仅限Live read开关，无Booking或其他外部写路径 |

## Stage 2B Local Agent Workspace API

Status: `implemented: local Fixture subset`。它使用Pilot Access Token换取HttpOnly Session Cookie，所有Workspace读取按服务端解析的`userId`隔离，数据保存在PostgreSQL。它不是生产身份系统，也没有真实Provider、通知、授权或外部写能力。

```text
GET  /
POST /api/session
GET  /api/session
DELETE /api/session
GET  /api/cases
POST /api/cases
GET  /api/cases/{caseId}
GET  /api/cases/{caseId}/events          SSE
POST /api/conversations/{conversationId}/messages
```

所有业务写请求携带客户端生成的`requestId`；`POST /messages`还必须携带`taskVersion`，陈旧版本返回409。SSE建立连接或重连时先发送可替换的最新完整Case Snapshot，Activity ID从持久化Event ID确定性生成。候选和Offer选择只由受Validator约束的Restaurant Agent Loop作出；本地API不提供绕过该Loop的选择写入口。

下方生产路由、Authorization、Takeover和Reservation API仍为`proposed`：

```text
POST /v1/cases/{caseId}/authorizations

POST /v1/attempts/{attemptId}/takeover
POST /v1/attempts/{attemptId}/resume

POST /v1/reservations/{reservationId}/change
POST /v1/reservations/{reservationId}/cancel
```

所有写请求携带客户端生成的`requestId`；会影响Case/Task、Authorization或Attempt的请求还必须携带`taskVersion`。陈旧版本返回最新Task Snapshot，不执行副作用。

Conversation API负责交互历史，不把消息直接解释为Task写入。Case API是Root Task和相关Authorization/Attempt/Outcome的用户可见投影；它不建立第二套可独立修改的状态。

## Agent Workspace DTO

Status: `implemented: Stage 2B Fixture subset`。`EXECUTION_PROGRESS`尚未出现，因为本阶段没有执行路径。

```ts
type CaseSummary = {
  caseId: string;
  rootTaskId: string;
  conversationId: string;
  status: "ACTIVE" | "NEEDS_YOU" | "WAITING" | "COMPLETED";
  title: string;
  taskVersion: number;
  pendingUserAction?: PendingUserAction;
  updatedAt: string;
};

type ActivityItem = {
  activityId: string;
  caseId: string;
  sourceRef: { kind: "EVENT" | "COMMAND" | "ATTEMPT" | "OUTCOME"; id: string };
  type: string;
  display: { title: string; detail?: string };
  occurredAt: string;
};

type AgentArtifact = {
  artifactId: string;
  caseId: string;
  domain: "restaurant";
  type: "CANDIDATES" | "AUTHORIZATION_REQUEST" | "EXECUTION_PROGRESS" | "OUTCOME";
  sourceVersion: number;
  data: unknown;
};
```

`ActivityItem`和`AgentArtifact`是Projection，必须能从权威Source重新生成。`data`暂时保持Domain-owned；出现第二个真实Domain前不创建跨DomainArtifact Schema DSL。

## 核心DTO

Status: `partially implemented`。当前Task Snapshot不内嵌`goalId`和`pendingUserAction`；Goal关系由独立持久化Graph保存。持久化Event Store已实现。

```ts
type TaskSnapshot = {
  id: string;
  runId: string;
  goalId: string;
  taskType: string;
  lifecycleState: string;
  domainState: unknown;
  version: number;
  pendingUserAction?: unknown;
  updatedAt: string;
};

type ServerEvent = {
  eventId: string;
  taskId: string;
  type: string;
  payload: unknown;
  taskVersion: number;
  occurredAt: string;
};
```

## Goal Graph

Status: `implemented: persistent graph subset`。Task与Goal关系通过`goal_task_memberships`保存，不让Domain State承担跨Domain关系。

```ts
type DependencyCondition =
  | "UPSTREAM_SUCCEEDED"
  | "UPSTREAM_TERMINAL"
  | "ANY_UPSTREAM_SUCCEEDED"
  | "ALL_UPSTREAM_SUCCEEDED";

type DependencyReadiness = "READY" | "WAITING" | "BLOCKED";
```

当前`PostgresGoalGraph`提供Goal创建、Task成员/父子关系、同Goal依赖、环检测、Readiness查询和关键Task的Goal聚合；它不创建具体Domain Task，也不自动启动已经Ready的Task。

## Trigger Scheduler

Status: `implemented: persistent scheduler subset`。

```ts
type TriggerStatus =
  | "PENDING"
  | "LEASED"
  | "DISPATCHED"
  | "OBSOLETE"
  | "FAILED";
```

`PostgresTriggerStore`保存Trigger；`TriggerScheduler`到期后通过Domain `TriggerEventFactory`投递确定性Event。它不持有常驻模型Loop，也不决定具体Domain何时创建Trigger。

## Causal Trace

Status: `implemented: in-memory prototype`。

所有Event输入都必须携带完整Trace，且`runId`必须与Task匹配；Runtime拒绝不匹配Trace，不再为Fixture或持久化Event推断默认值。

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

Command的`actor`固定为`RUNTIME`，`causationId`为来源Event ID；Adapter或Policy返回Event时以Command ID作为`causationId`。`attemptId`在Policy通过后、外部Commit前创建。

## Durable Command Contract

Status: `implemented: Stage 1 subset`。

```ts
type OutboxCommandStatus =
  | "PENDING"
  | "LEASED"
  | "SUCCEEDED"
  | "RECOVERY_REQUIRED"
  | "RECOVERY_DISPATCHED";

type LeasedCommand<Command> = CommandEnvelope<Command> & {
  leaseOwner: string;
  leaseExpiresAt: string;
  deliveryAttempt: number;
};
```

`DurableCommandWorker`先Lease、再执行、持久化确定性结果Event，最后完成Command。结果Event已经持久化但Command完成标记失败时，由Causation Reconcile收口。External Write没有结果Event时不重试。

`RecoveryCoordinator` Claim `RECOVERY_REQUIRED` Command，通过Domain提供的`RecoveryEventFactory`产生Event。Coordinator本身不解释Domain State；Restaurant将其映射为`COMMIT_UNCERTAIN`，只允许进入Verify路径。Recovery Event和完成标记之间仍以确定性Event ID去重。

## Model Gateway

Status: `implemented: connector contract + local Fixture use`。DeepSeek Provider连接只经过Fake Fetch Contract验证；Stage 2A的Local-only Fixture ModelGateway仅用于驱动真实Parser和Web状态路径，不代表真实模型调用或质量。

当前Contract中的`fallback`表达调用失败后的单一产品行为，不表示备用模型、旧接口兼容或多级恢复链。新增模型用途应先确认User Flow确实需要降级，否则使用`FAIL_CLOSED`。

```ts
interface ModelGateway {
  complete(request: ModelRequest): Promise<ModelResponse>;
}

type ModelRequest = {
  taskId: string;
  purpose: string;
  promptVersion: string;
  messages: ModelMessage[];
  responseFormat: "TEXT" | "JSON_OBJECT" | "JSON_SCHEMA";
  outputSchema: {
    name: string;
    version: string;
    jsonSchema?: Record<string, unknown>;
  };
  timeoutMs: number;
  fallback: "STRUCTURED_FORM" | "FAIL_CLOSED";
};
```

普通Text/JSON Object走标准`POST /chat/completions`；`JSON_SCHEMA`走DeepSeek Beta strict function transport，强制一个只承载结构化输出、从不执行的function envelope。Domain提供canonical JSON Schema，并可为严格传输提供兼容wire schema；例如DeepSeek要求每个object的所有properties都在`required`且`additionalProperties:false`，因此wire空字符串/空数组会在Domain内恢复为canonical可选字段。non-blank仍由本地Domain Validator而非不支持的`minLength`保证。Infrastructure不导入Restaurant类型；Gateway提取arguments后，本地Domain Validator仍为权威门禁且语义正确性另行评分。内部`taskId`、Schema正文、Prompt和Completion都不进入普通Telemetry。非2xx、429、超时、网络错误和畸形响应转为稳定`ModelGatewayError`，并只记录安全的HTTP status、provider request ID、error code/type及截断脱敏消息，不静默降级成自由文本。

## Restaurant semantic and ADR-0010/0011 action boundary

Status: `implemented: Fixture product path`. This is the only current Restaurant language-to-state path. The old Intent Parser and Progressive Decision Harness typed `statePatch` path have been removed from executable code.

```text
Semantic Interpreter [LLM]
→ RestaurantSemanticProposal
→ RestaurantSemanticProposalContract
→ RestaurantSemanticCompiler
→ Domain Event / State Patch
→ Task Runtime / Reducer
→ Restaurant Agent Decision
→ Restaurant Agent Action → Restaurant Action Validator → Execution Router
```

`RestaurantSemanticProposal` represents only the user's current-turn expression: stable slots plus open `CRITERION{text, polarity, strength}`, correction, negation and confirmation. `strength` is semantic `HARD` / `SOFT` / `UNSPECIFIED`; it does not classify criteria into cuisine, constraint or preference and deliberately does not contain `StatePatch`, Event, missing-field calculation, readiness, action routing, Tool input, Authorization, Evidence, or Outcome.

The Proposal Contract is versioned and closed. It validates structure, typed values, allowed semantic roles, and allowed corrections/negations/confirmations. Its successful result means `STRUCTURALLY_VALID`, never `SEMANTICALLY_TRUE`, `USER_CONFIRMED`, or `TRUSTED_EVIDENCE`.

`RestaurantSemanticCompiler` has a versioned deterministic input/output contract. It receives only a valid Proposal and returns a `RestaurantIntentPatch`, wrapped as `SEMANTIC_PROPOSAL_COMPILED`; a contradiction becomes `SEMANTIC_CONFLICT_RECORDED`. It cannot call a model, query live data, evaluate Policy, or invoke a Tool.

`RestaurantAgentDecision` receives a Restaurant-owned `restaurant-agent-context@2`, compact execution history and a static business Capability Catalog. The context excludes Authorization, Proposal terms, raw Provider output, execution result, Evidence artifact, Reservation and provider/browser/URL implementation details. Its constrained JSON output is an untrusted `RestaurantAgentAction`; it cannot contain State patches, Provider details, Authorization, terms hashes, Adapter calls or Outcome claims. `SEARCH_RESTAURANTS` contains only an optional retrieval hint, `CHECK_AVAILABILITY` only candidate IDs, and `PRESENT_RESULTS` only candidate IDs; the Execution Router binds complete authoritative requests and supplies an abortable, route-specific read deadline. A `CHECK_AVAILABILITY` naming any candidate that already has a Check from the same authoritative search/schedule is rejected before Router execution, so repeated model proposals cannot consume another Provider read. The Validator derives area, HARD-criterion, HIGH outlet-identity and fresh availability proof from State before allowing `PRESENT_RESULTS`; the Runtime then writes its terminal Event. BrowserRuntime metadata distinguishes Cloudflare and the local Playwright Chromium backend; `LOCAL_CHROMIUM` is selected only in the infrastructure factory and cannot expose provider choice to Domain or Agent code. A returned Browser availability read whose every requested candidate has the same `BROWSER_RUNTIME_FAILED` or `BROWSER_TIMEOUT` reason is a terminal Provider failure: the Router exposes only its stable code and the coordinator emits `AGENT_LOOP_TERMINATED(EXECUTION_FAILURE)` to `FAILED`, rather than sending Provider internals to the Agent. `RestaurantActionValidator` checks action-specific invariants and returns `ALLOWED`, `REJECTED`, or `REQUIRES_AUTHORIZATION`; it never selects a next action. The bounded coordinator stores a structured trajectory step, including a `proposalId` for BOOK, execution metadata and causal refs to emitted Events, Commands, Attempts and Evidence, before continuing, waiting, or terminating.

`Semantic Proposal` is intentionally distinct from the Core `ActionProposal`: the former describes language-level meaning, while the latter represents a potentially side-effecting execution action subject to Policy and Authorization.

## Adapter

Status: `proposed`。Mock实现只用于Harness，不代表真实平台Contract已经验证。

```ts
interface ActionAdapter<Offer, Prepared, Reservation> {
  checkAvailability(input: unknown): Promise<Offer[]>;
  prepare(offer: Offer, profile: unknown): Promise<Prepared>;
  commit(prepared: Prepared, authorization: Authorization): Promise<ExecutionResult>;
  verify(result: ExecutionResult): Promise<VerificationResult>;
  cancel(reservation: Reservation, authorization: Authorization): Promise<ExecutionResult>;
}
```

## Tool Contract

Status: `proposed`。本轮Gateway不发送或执行Tool Call。

只读和提议Tool均有JSON Schema、版本、超时、sideEffect分类和可观测字段。模型参数必须二次校验。

```ts
type ToolDefinition = {
  name: string;
  version: string;
  description: string;
  inputSchema: unknown;
  sideEffect: "NONE" | "PROPOSAL_ONLY";
  timeoutMs: number;
};
```

## 错误分类

```text
VALIDATION_ERROR
STALE_TASK_VERSION
AUTHORIZATION_REQUIRED
AUTHORIZATION_STALE
CAPABILITY_UNAVAILABLE
PROVIDER_RATE_LIMITED
TAKEOVER_REQUIRED
SIDE_EFFECT_UNCERTAIN
OUTCOME_UNKNOWN
INTERNAL_ERROR
```

对用户返回稳定短码和可执行下一步；原始Provider Payload只进入脱敏Debug记录。

## 版本规则

- API路径按Major版本。
- Event、Command、Domain State、Prompt和Adapter分别版本化。
- 当前尚未进入生产Pilot，也没有必须保留的真实Task数据。未发布接口或Schema发生变化时同步更新所有调用方与Fixture，并删除旧路径，不建立兼容层。
- 出现生产数据、进行中的现实任务或外部消费者后，改变语义或删除字段才必须升级版本并提供迁移；Task Snapshot和Event必须可Replay，禁止用当前代码默默重解释旧Event。

## 单页浏览器诊断

[Browser Read Diagnostics](../harness/BROWSER-READ-DIAGNOSTICS.md)维护独立入口、证据字段与测试映射。LOCAL_CHROMIUM单独interactive使用临时profile；interactive与manual-intervention同时开启才使用ADR-0016专用持久eval profile。真实Chromium本地Fixture不等于真实来源验证；单页观察不写Task State、不产出Offer。
