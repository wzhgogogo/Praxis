# Agent Gateway and Workspace

- Status: Accepted
- Version: 0.1
- Last updated: 2026-08-08
- Source of truth for: Web/Mobile Web入口、Conversation/Session/Case边界、用户可见Activity与Domain Workspace
- Related ADRs: [ADR-0006](../decisions/0006-web-first-agent-workspace.md)
- Related documents: [Architecture Overview](OVERVIEW.md), [Task Runtime](TASK-RUNTIME.md), [Data, Context and Security](DATA-CONTEXT-SECURITY.md)

## 产品目标

Praxis第一阶段是一个Responsive English Web Agent。Desktop Web与Mobile Web连接同一个服务端Agent Gateway；用户可以开始一项Restaurant事务、关闭页面、稍后或换设备继续，并从Case页面看到当前状态、下一步和已发生的关键活动。

Agent Gateway是模块化单体中的产品组合边界，不是新的部署服务。它统一处理用户身份、Conversation、Case导航、事件流和用户Action，再调用Application、Domain和Core Runtime。

## 核心对象

| 对象 | 负责 | 不负责 |
|---|---|---|
| `Conversation` | 持久消息历史、当前Case引用、用户与Agent交流 | 权威Domain State、授权和Outcome |
| `InteractionSession` | 一次前台连接、流式Turn、取消与短期上下文 | 跨天事实和后台恢复依据 |
| `Case` | 用户可见的生活事务容器、状态摘要、下一步和Root Task引用 | 自己执行状态转换；MVP由Root Task提供权威状态 |
| `ActivityItem` | 把Event、Command、Attempt和Outcome投影为用户可理解的时间线 | 作为第二套状态机或审计真相源 |
| `AgentArtifact` | 候选卡、授权请求、执行进度、Outcome等结构化UI数据 | 由模型自由声明事实或改变Task |
| `PendingUserAction` | `Needs You`中的选择、补充信息、授权和接管入口 | 替代Domain Authorization或扩大其范围 |

MVP中`Case : Root Task = 1 : 1`。该映射让产品先获得稳定的Case体验，同时保留未来一个Case包含多个Task的方向；当前没有真实调用者要求新建通用Case Graph或迁移现有Task表。

## 交互路径

```text
Responsive Web / Mobile Web
        ↓
Agent Gateway
        ├── Conversation & Interaction Session
        ├── Case List / Case Detail
        ├── Activity & Artifact Projection
        └── Pending User Action Router
        ↓
Application / Domain
        ↓
Task Runtime → Policy → Execution → Verifier
```

用户消息先经过Agent Gateway确定可信`userId`、`conversationId`和`caseId`。自然语言解析结果只能形成经过Schema校验的Event或Proposal；Task Runtime决定Durable Case State是否改变。Gateway从最新Task Snapshot和相关执行记录生成Case、Activity和Artifact视图。

## 前台与后台生命周期

前台Conversation可以使用：

- 当前用户消息与有限近期历史；
- 当前Case摘要和Pending User Action；
- 当前Domain所需的最小Public/Private Context；
- 已验证的Artifact事实字段。

后台Trigger、外部Event和Follow-up不恢复完整聊天Session。它们从以下输入重建：

```text
Trigger / External Event
+ latest Case/Task Snapshot
+ required Authorization or Attempt reference
+ minimum Domain Context
→ deterministic Event / bounded model purpose
```

前台Session断开不能取消Durable Case；后台运行失败也不能伪造前台回复或Outcome。浏览器刷新、SSE重连和跨设备打开都从服务端状态恢复。

## Web与Mobile Web

第一阶段使用同一Responsive Web代码库，不建设原生App。最低体验包括：

- `Active / Needs You / Waiting / Completed` Case列表；
- Case详情中的Conversation、结构化Artifact和Activity Timeline；
- 可重连的服务端事件流；
- 绑定用户和目标Action的短期Deep Link；
- 在Mobile Web完成选择、补充信息、授权和Human Takeover恢复。

Web只提交用户意图和版本化Action，不持有Provider Secret，不推断权威状态。任何授权入口都展示Domain要求的完整对象、时间、价格和条款，并在执行前重新验证。

## Domain Workspace

Restaurant在当前纵向切片内直接拥有自己的Artifact类型和Web组件。候选、条款、空位、Attempt和Outcome字段来自Domain/Application DTO；模型可以生成解释文本，但不能构造已验证事实。

当前不实现：

- 可安装App或第三方Plugin生命周期；
- 跨Domain通用Artifact DSL；
- 多Surface消息渠道；
- 跨任务自动Memory和自学习规则；
- 本地文件、Shell或OS Agent Runtime。

当第二个真实Domain需要同类Workspace能力时，再从两个真实调用者中提取最小共享Contract。

## 安全与数据

- 所有Case、Conversation、Activity和User Action查询必须按可信`userId`隔离。
- 客户端不能自报Event Actor、Authorization范围、Task版本或Outcome。
- Conversation和Activity是PII数据，遵守删除、脱敏和最小保留策略。
- Background Context不得因为实现方便而加载完整Conversation、完整邮箱或无关用户历史。
- Deep Link单次、短期、绑定用户、Case与Action；打开链接不等于完成业务授权。

## Implementation Status

Status: `implemented: Stage 2B Fixture subset`。当前模块化单体已经实现Pilot Session、PostgreSQL Conversation、`Conversation → Case → Root Task`映射、Case列表/详情、Domain Artifact、Event Activity和可重连SSE；Desktop/Mobile Web共享同一后端状态。Case仍是一对一Root Task投影，未新增通用Case Graph。

当前未实现生产身份提供方、后台主动通知、跨任务Memory、真实Provider、Authorization UI、Takeover或执行进度。SSE重连采用“先发送最新完整Snapshot”的简单协议，不是持久消息队列；Activity由持久化Event ID确定性生成，从而允许客户端替换和去重。
