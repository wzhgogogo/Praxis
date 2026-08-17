# Architecture Overview

- Status: Accepted
- Version: 0.7
- Last updated: 2026-08-13
- Source of truth for: 总体架构、层次、依赖方向和扩展边界
- Related ADRs: [ADR-0001](../decisions/0001-general-task-runtime.md), [ADR-0003](../decisions/0003-single-agent-orchestration.md), [ADR-0005](../decisions/0005-modular-monolith.md), [ADR-0006](../decisions/0006-web-first-agent-workspace.md), [ADR-0007](../decisions/0007-semantic-proposal-compiler-and-decision-kernel.md)
- Related documents: [Agent Gateway and Workspace](AGENT-GATEWAY-AND-WORKSPACE.md), [Task Runtime](TASK-RUNTIME.md), [Agent Orchestration](AGENT-ORCHESTRATION.md)

## 核心结构

Praxis采用“Web-first Agent Workspace + Durable Case Runtime + Action Control Plane + Domain Packages”。Agent Workspace负责持续协作体验；通用Runtime管理需要跨会话、跨时间保存的状态和触发；Action Control Plane管理授权、副作用和结果；具体Domain管理Intent、搜索、业务状态、Artifact和完成证据。

```text
Responsive Web / Mobile Web
        │
        ├── Agent Gateway / Workspace
        │     ├── Conversation / Interaction Session
        │     ├── Case List / Case Detail
        │     ├── Activity / Domain Artifact
        │     └── Pending User Action
        ├── Model Gateway
        ├── Durable Case Runtime
        │     ├── Goal / Task Store
        │     ├── Event / Command Dispatcher
        │     ├── Parent-child Dependencies
        │     └── Trigger / Scheduler
        ├── Search Runtime
        ├── Action Control Plane
        │     ├── Policy / Authorization
        │     ├── Execution Router
        │     └── Outcome Verifier
        ├── Context Resolver
        └── Harness / Replay

Domain Packages
        ├── restaurant
        │     ├── Semantic Interpreter / Proposal Contract
        │     ├── Semantic Compiler / Reducer
        │     └── Decision Kernel
        ├── shopping (future)
        ├── travel (future)
        └── case-management (future)
```

## v16 Restaurant semantic-to-execution path

Restaurant v16 retains v15's language-to-state and decision boundaries while replacing unstable criteria classification with open `CRITERION{text, polarity, strength}`. The Semantic Interpreter is the only LLM step that reads the user's new natural-language message. It returns an untrusted Restaurant Semantic Proposal, not an internal State Patch or action.

```text
User Message
→ Workspace / Application Orchestrator
→ Semantic Interpreter [LLM]
→ Semantic Proposal Contract
→ Restaurant Semantic Compiler
→ Task Runtime → Reducer → Authoritative State
→ Restaurant Decision Kernel (State + Trusted Evidence)
→ Runtime Command / Execution Action Proposal
→ Policy / Authorization when required
→ Execution Router → Tool / Adapter
→ Observation / Evidence → Verifier → Outcome Event
→ Task Runtime → Reducer → Decision Kernel
```

`NEED_REINTERPRETATION` is a Decision Kernel result, not a model instruction or a State mutation. In v16 it records a conflict and asks the user or takes a safe fallback; it never automatically reinterprets a message or overwrites State. LLM response text can explain an outcome or propose an adjustment, but a suggested adjustment only becomes input after an explicit new user message traverses the same semantic chain.

## 四类任务骨架

1. 即时搜索并执行：餐厅、购物、旅行预订。
2. 定期监控：日用品复购、价格、订阅续费。
3. 长期 Case：维修、退换货、申请、理赔。
4. 跨渠道协调：聚会、多人确认、邮件、日历、路线。

Runtime在接口和Harness层覆盖四类骨架，第一阶段只实现Restaurant Booking Domain。MVP中用户可见的Restaurant Case映射到一个Root Task；Conversation、Interaction Session和Activity Projection不进入Task State，也不新建通用Case Graph。

当前Runtime已实现持久化Goal/Task Graph子集：Goal成员关系、父子指针、依赖Readiness、环检测和关键Task聚合。它尚不创建跨Domain子Task，也不自动启动Ready Task；这些由后续Command Registry与Scheduler承担。

## 父子任务

```text
Goal: 完成今晚聚餐安排
  └── Root Task
        ├── Restaurant Booking
        ├── Calendar Event        depends on Booking success
        ├── Route Preparation     depends on Booking success
        └── Departure Reminder    depends on Route completion
```

DeepSeek 可以提出子任务拆解，只有 Runtime 可以创建、激活和改变依赖关系。

## 责任边界

| 模块 | 负责 | 不负责 |
|---|---|---|
| Agent Gateway / Workspace | 用户身份边界、Conversation、Case导航、Activity、Artifact、前台Session和跨设备恢复 | 权威Domain State、授权、外部提交和Outcome |
| Semantic Interpreter [LLM] | 解释本轮用户表达的目标、时间、人数、地点、偏好、约束、修正、否定和确认 | `StatePatch`、Event、Readiness、Action、授权、Tool Call和Outcome |
| Semantic Proposal Contract | 校验Proposal结构、封闭词表和允许表达 | 断言模型语义正确或改变状态 |
| Restaurant Semantic Compiler | 确定性地将合法Proposal翻译为Restaurant Event/State Patch | 模型调用、实时查询、Policy或执行 |
| Task Runtime / Reducer | Durable Case的Graph、状态、事件、命令、等待、恢复与权威State归约 | Conversation、前台Session、UI Projection、自然语言判断和平台点击细节 |
| Restaurant Decision Kernel | 根据Authoritative State和Trusted Evidence决定下一步 | 解释自由文本、改State、直接调用Tool或判定现实结果 |
| Search Runtime | 并发、预算、批次、缓存、Trace | 餐厅或商品的业务模型 |
| Policy Engine / Authorization | 动作许可、授权范围与副作用门禁 | 自然语言判断 |
| Adapter | API/Browser 实际交互 | 决定用户是否授权 |
| Verifier | 根据 Evidence 判定现实结果 | 生成推荐或修改政策 |

## 代码分层

以下目录同时包含已实现和proposed部分，具体状态以对应设计文档为准：

```text
apps/web/                  未来独立Responsive Web包；当前页面内嵌于Local Server
src/server/                Stage 2B Fixture Agent Gateway、HTTP/SSE与Responsive HTML入口
src/application/           Agent Workspace与Restaurant纵向应用编排，不包含Provider Secret或写入权限
src/core/task-runtime/     通用 Goal/Task/Event/Command
src/core/policy/           Action、Authorization、硬规则
src/core/execution/        Execution Router、Attempt、Verifier
src/core/search/           通用 Search Runtime
src/core/model/            Model Gateway与任务版本；不含Restaurant语义
src/domains/restaurant/    Semantic Interpreter Contract、Compiler、Reducer、Decision Kernel、Search Strategy、状态机
src/integrations/          外部 API 与 Browser Adapter
src/infrastructure/postgres/ PostgreSQL迁移、Workspace Store、Task Store、Goal Graph和Outbox
src/infrastructure/deepseek/ DeepSeek HTTP Provider Adapter（不含业务Parser）
src/harness/               Scenario Runner、Fixture、Oracle
```

依赖方向：

```text
Web → Agent Gateway API
Agent Gateway → Application / Domain / Core contracts
Application → Restaurant semantic boundary / Runtime / Policy / Model Gateway
Restaurant Semantic Interpreter → Model Gateway contract
Restaurant Semantic Compiler / Decision Kernel → Restaurant state and Core contracts
Domain → Core contracts
Integrations → Domain/Core ports
Core Runtime ─X→ concrete Domain
Domain A ─X→ Domain B
LLM ─X→ Task State / Tool / Adapter
```

## 部署边界

Pilot采用模块化单体：Agent Gateway、Application、Runtime和Domain共享同一代码库与PostgreSQL；普通Worker和隔离Browser Worker可以是不同进程。暂不拆微服务，不建立万能Workflow DSL、通用App Platform或Multi-Agent协调层。
