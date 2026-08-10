# ADR-0006: Web-first Agent Workspace and Durable Case Boundary

## Status

Accepted — 2026-08-08

## Context

Praxis的产品承诺不是一次性完成一段确定性流程，而是让用户把生活事务交给一个能够跨会话、跨时间继续推进的Personal Agent。现有Task Runtime、Policy、Execution和Verifier已经覆盖了持久状态、授权、副作用和现实Outcome，但当前架构把Task Runtime描述为所有对话、搜索和推理的顶层总指挥，没有明确用户级Conversation、前台Session、后台Run、用户可见Case和Domain Workspace之间的边界。

Tokyo Restaurant MVP同时需要英文Desktop Web和Mobile Web：用户可以在一个设备开始，在浏览器关闭后或另一个设备继续，看到当前进度，在需要时完成选择、授权或Human Takeover。把Conversation直接等同于Task，会让聊天历史变成权威状态；把所有探索过程都建模成严格Task Event，则会扩大Runtime复杂度并拖慢产品验证。

## Decision

Pilot在现有TypeScript模块化单体中增加一个Web-first Agent Gateway与Agent Workspace产品层，不引入新的微服务、本地Agent Runtime或通用App Platform。

职责分为三层：

1. **Agent Workspace**负责Conversation、前台交互Session、Context装配、Domain Artifact、用户可见Activity和跨设备恢复。对话历史、模型Working Plan和解释文本不是权威现实状态。
2. **Durable Case Runtime**负责需要跨会话、跨时间保存和推进的目标、约束、等待项、Trigger和Domain State。MVP中一个Restaurant Case映射到一个Root Task；`Case`先作为用户可见投影，不要求立即重命名或迁移现有Task Schema。
3. **Action Control Plane**继续由Policy、Authorization、Execution Attempt、Evidence和Verifier组成，独占外部写许可与Outcome判定。Agent Workspace不能绕过该路径执行预约、取消或其他副作用。

同一个用户级Praxis Agent服务Desktop Web和Mobile Web。Surface只影响展示和交互Session，不产生第二套Task状态。前台对话可以保留近期上下文；后台Trigger或Follow-up必须从结构化Case State和最小必要Context重建，不依赖完整聊天记录继续运行。

Restaurant可以提供候选卡、授权请求、执行进度和Outcome等Domain Artifact，但Artifact中的事实字段来自Domain/Application状态，模型只负责解释或提出建议。出现第二个真实Domain并证明稳定共性前，不建设可安装App系统或通用Artifact DSL。

## Consequences

- Task Runtime不再承担Conversation存储、Session生命周期或所有探索性Working Plan；它仍是Durable Case State的权威写入者。
- Web需要用户级Case列表、Case详情、Activity Timeline和`Needs You`入口，而不只是单个聊天页面。
- API需要明确`conversationId`、`caseId/taskId`、`authorizationId`和`attemptId`，并支持服务端事件流和跨设备恢复。
- 后台运行的Context更小、更可重复，降低无关PII、Prompt Injection和长对话累积风险。
- 当前Stage 2先用Fixture完成Persistent Agent Shell，再接Live Discovery与Availability；不继续扩展冻结的Goal Graph、Scheduler或合成Domain能力。
- ADR-0001的通用Task Runtime、ADR-0003的单Agent边界和ADR-0005的模块化单体继续有效；本ADR限定它们在完整产品架构中的职责。

## Alternatives considered

- **Conversation与Task使用同一对象**：实现入口少，但聊天、探索和现实状态的权威性混杂，难以安全恢复后台任务。
- **Task Runtime统领每一次模型与UI交互**：一致性强，但把非权威探索过程过度状态机化，延迟Web产品验证。
- **直接采用本地Agent Workspace或Coding Agent Runtime**：可快速获得Session、Cron和工具体验，但其本地信任、Shell工具和通用审批模型不能承载多用户Web与现实事务授权。
- **先建设完整App Platform**：未来扩展清晰，但Restaurant是唯一真实Domain，尚无第二个使用者证明通用安装、生命周期和权限模型的必要性。

## Related documents

- [Agent Gateway and Workspace](../architecture/AGENT-GATEWAY-AND-WORKSPACE.md)
- [Architecture Overview](../architecture/OVERVIEW.md)
- [Agent Orchestration](../architecture/AGENT-ORCHESTRATION.md)
- [Task Runtime](../architecture/TASK-RUNTIME.md)
- [MVP User Flows](../product/USER-FLOWS.md)

