# Data, Context and Security

- Status: Accepted
- Document revision: 1.0
- Last updated: 2026-08-10
- Source of truth for: 数据归属、Context分层、隐私、安全和保留策略
- Related ADRs: [ADR-0002](../decisions/0002-deepseek-model-runtime.md), [ADR-0005](../decisions/0005-modular-monolith.md), [ADR-0006](../decisions/0006-web-first-agent-workspace.md)
- Related documents: [Restaurant Booking](../domains/RESTAURANT-BOOKING.md), [Capability Matrix](../integrations/CAPABILITY-MATRIX.md)

## 数据实体

当前已实现：

```text
tasks
task_events
task_commands
goals
goal_task_memberships
task_dependencies
task_triggers
workspace_users
workspace_sessions
conversations
conversation_messages
praxis_schema_migrations
```

`domain_state`、Event、Command、Trace和Outcome使用版本化JSONB；Task、Version、Lifecycle、Command Category、Status、Lease与时间保留独立列。数据库写入使用参数化SQL，Task State、Event与Outbox Command在同一事务提交。Stage 2B的原始Pilot Access Token只存在服务端配置，Session只持久化SHA-256 Hash；Conversation通过`root_task_id`引用Task，不复制Domain State。

后续计划保存：

```text
action_proposals
authorizations
execution_attempts
outcomes
outcome_evidence
triggers
capabilities
adapter_versions
booking_profiles
source_entity_mappings
```

Case、Activity和Artifact当前从Task与Event生成；后续加入Authorization、Attempt和Outcome后继续从这些权威Source投影。Stage 2B没有保存独立Projection Cache；若以后为查询性能增加，该Cache必须可删除重建，不能成为新的权威数据表。

Domain数据使用明确表或版本化JSONB，不能把所有业务事实塞入一个无Schema Blob。

生产Adapter为`pg`连接池，事务始终使用同一Checked-out Client。当前PGlite只用于本地嵌入式SQL集成测试，不保存真实用户数据，也不替代真实PostgreSQL smoke、备份、恢复和权限验证。

## Context层次

```text
Public Knowledge  任务规则、平台能力、流程、异常和验证方式
Private Knowledge 用户资料、历史、账户、偏好和文件
Task State        当前目标、约束、进度、等待项和授权
Conversation      当前交互历史；非权威现实状态
Live Data         实时空位、价格、库存、页面和交通
Unknown           无法从公开或用户数据确定的事实
```

第一版没有跨任务Memory和个性化排序。只使用当前任务内用户明确提供的信息；`privateMemoryRefs`接口预留但为空。

## 长期知识与Memory分层

Praxis不把Conversation、Task State、Provider缓存和用户Memory合并成一个无边界的“知识库”。长期数据按所有权、真实性和用途分为四类：

| 层 | 内容 | 权威与新鲜度 | 当前阶段 |
|---|---|---|---|
| Domain Entity Observation | Brand、Outlet、Source ID、地址、菜系等外部实体断言 | 保存Source、`observedAt`、Freshness和使用限制；缓存不自动等于当前事实 | Stage 2C接首个真实Discovery Source前实现Restaurant最小闭环 |
| Domain Interaction Event | 结构化需求、Agent动作、检索、曝光位置、反馈、选择和Verified Outcome | 来自产生该行为的产品路径；不复制完整Conversation作为Learning事实 | Stage 2C先定义并采集，不参与在线排序 |
| Aggregate Insight | 去标识后的群体选择率、成功率、失败模式和趋势 | 必须有曝光分母、时间窗口、最小群体门槛和偏差说明 | 真实Pilot积累足量数据并完成隐私评审后实现 |
| Private User Memory | 用户长期偏好、资料、历史和个人规则 | 绑定可信`userId`；区分明确表达与推断，支持来源、范围、置信度、过期、查看、修正和删除 | MVP后单独设计；当前仍不跨Task读取 |

Conversation回答“用户说过什么”，Task State回答“当前任务已经确认什么”，两者都不能代替长期Memory。单次任务中的“今天不想吃辣”不得自动提升为长期个人偏好；群体选择也不得反向写入某个用户的Private Memory。

群体Domain Knowledge的核心闭环是：

```text
真实用户表达
→ 脱敏后的结构化需求
→ 追问与决策路径
→ 使用的Source和解决方法
→ 检索与展示集合
→ 用户反馈和选择
→ Verified Outcome
```

原始Query仍按Conversation保留策略管理。Learning层优先保存可版本化的结构化语义和引用，不默认复制长期原文；用于Eval、产品改进、群体统计和个性化的用途必须可区分。采集数据不等于允许在线学习：在聚合规则、偏差评估、隐私门槛和离线Eval完成前，Aggregate Insight不得自动改变生产排序、Prompt或Policy。

## 外部实体事实与Grounding

外部实体采用“带证据的Observation”，不保存无来源的永久真值。最小Observation需要能够表达：

```text
Praxis Domain Entity ID
Source + Source Entity ID
Observed Fields
observedAt
expiresAt或Freshness Policy
Provenance / Usage Restriction
```

不同事实使用不同Freshness：稳定Source ID可以长期引用并周期校验；Brand与Outlet关系、地址和营业状态使用来源允许的中短期缓存；营业时间在具体日期使用前刷新；Availability、价格和条款使用短TTL，并在选择、授权或执行前重新验证。过期Observation可以帮助构造刷新查询，但不能支持“当前营业”“当前有位”或“保证可订”等声明。

Entity Observation的长期资产是Praxis自己的实体映射、来源选择、解决路径、执行轨迹和验证规则；Provider受限内容仍按对应条款缓存、展示和删除，不因进入Observation Store而变成Praxis自有数据。

## Context Resolver

Context Resolver按任务需要选择最小上下文，保留来源、版本和时间。不得把全部历史、完整DOM或无关PII发送给模型。

前台Interaction Session可以读取有限近期Conversation与当前Case摘要。后台Trigger和Follow-up不得恢复完整Conversation；它们从最新Task Snapshot、必要Attempt/Authorization引用和最小Domain Context重建。Conversation中的模型解释、Working Plan和“已经完成”文本不能覆盖Task State或Outcome。

发送给DeepSeek：用户需求、结构化约束、脱敏候选、必要页面标签和错误。默认不发送银行卡、密码、Cookie、验证码、完整联系方式或与任务无关的历史。

## Secret与PII

- DeepSeek、Google和平台Key只在服务端Secret Manager或受部署环境管理的服务端变量；Web不读取这些变量。
- 当前`DeepSeekModelGateway.fromEnvironment`只读取`DEEPSEEK_API_KEY`与`DEEPSEEK_MODEL`。两者缺失时fail-closed；本地`dev`、真实模型Eval和真实PostgreSQL smoke可由Node原生`--env-file-if-exists=.env`读取Git忽略的`.env`，但`npm test`、构建和Fixture Eval不读取它。部署环境仍使用受管理的服务端变量；不存在前端注入或日志输出Key的实现。
- 真实模型Eval额外要求`PRAXIS_ALLOW_LIVE_MODEL_EVAL=1`；可选的价格变量只用于本地估算Token成本，不含凭证。没有这个开关时，命令在构造Gateway前退出。
- `ModelInvocationRecord`不保存Prompt或Completion正文；真实Eval的控制台报告不输出输入消息，只输出聚合指标与每条样例ID。
- Web不接触生产Secret，不直接调用供应商API。
- 所有Conversation、Case、Activity、Authorization和Attempt读取均按可信服务端`userId`隔离；客户端Case ID或Deep Link不能替代鉴权。
- 生产姓名、电话、邮箱和地址采用字段级加密，密钥与数据库分离。Stage 2B只允许本地Fixture身份和非真实显示名；生产身份与PII加密尚未实现，不能存放真实用户资料。
- 用户声明的过敏及其补充说明属于敏感健康信息。首个Restaurant实现只在当前Case内使用；原始披露文本默认不进入模型日志、长期开关、群体学习数据或Private Memory。只有用户在Consent Card中确认后，Adapter才可将本次最小必要内容发送给选定餐厅；持久化、保留期和加密细节在真实Booking Stage与隐私评审中确定。
- 日志默认脱敏；禁止记录密码、OTP、银行卡、Cookie和接管按键。
- Booking Profile由Adapter直接使用，不经模型。

## Browser隔离

- 每Task/Attempt隔离Profile和容器。
- Egress限制在Capability允许的域名及必要子域。
- Takeover URL单次、短期、绑定用户与Attempt。
- 终态后销毁Profile；证据截图先脱敏。
- 网页内容一律作为不可信数据处理。

## Google Places

- Google Place ID可作为跨API地点引用保存，并按官方建议定期刷新。
- Places内容缓存、展示和署名按Google政策执行；不得把受限内容当成Praxis自有长期知识资产。
- 长期资产是平台能力、执行轨迹、失败恢复、验证规则和用户授权记录。

## 保留策略

Pilot默认目标：

- 临时浏览器Profile：终态后立即销毁。
- Availability与实时页面数据：按来源政策和短TTL。
- 脱敏执行证据：30天。
- 审计元数据：90天。
- 用户删除账户时删除可归属的Profile、Task内容和证据；依法必须保留的审计记录单独处理。

保留期上线前需经过正式隐私与合规评审，当前为proposed。

## 安全事件

以下情况必须记录并可触发Kill Switch：未经授权Action、重复提交、错误宣称成功、跨用户访问、Adapter越域、Prompt Injection绕过尝试、Secret或PII泄漏。
