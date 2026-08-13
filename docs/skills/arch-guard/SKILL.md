---
name: praxis-arch-guard
description: Praxis编码前架构守卫；检查Task Runtime、Domain、模型、Policy、执行、数据和Harness边界。
---

# Praxis Arch Guard

任何业务代码改动前必须读取本文件。当前仓库已建立模块化代码目录，但尚无自动`arch:check`脚本；本文规则仍为强制人工边界，脚本实现前不得把人工检查描述为自动门禁。

## 原则

- Runtime拥有状态，模型不拥有状态。
- Semantic Interpreter只拥有不可信的本轮语义Proposal；Compiler、Reducer和Decision Kernel拥有各自的确定性职责。
- Agent Workspace拥有Conversation与交互Projection，但不拥有Durable Case State、Authorization或Outcome。
- Policy拥有副作用许可，模型和Adapter不拥有许可。
- Verifier拥有Outcome判定，模型不拥有判定权。
- Domain拥有业务语义，Core不依赖Concrete Domain。
- UI只表达状态与意图，不持有生产Secret或权威业务状态。
- 通用业务抽象需要至少两个真实使用者；Harness合成Domain不算。授权、幂等、Outcome、PII等难以后补的控制边界，可由Accepted ADR支持首个真实使用者的最小实现。
- 未来能力优先预留职责和依赖方向，不实现完整机制。架构探针必须范围小、有Harness和停止点，且不得延迟当前纵向Stage。
- 当前未发布能力默认直接替换并删除旧路径，不创建兼容层；真实生产数据、进行中现实任务或外部消费者存在时除外。
- 安全关键的fail-closed不是可选fallback；普通失败只保留一个当前产品确实需要的处理路径。

## Planned依赖边界

```text
apps/web → server/agent-gateway contract
server/agent-gateway → application/workspace
application/workspace → runtime/domain/core contracts
application/workspace → restaurant semantic boundary → runtime/domain/core contracts
domains/* → core contracts
integrations/* → domain/core ports
core ─X→ domains/*
domain A ─X→ domain B
web ─X→ DeepSeek/Google/booking providers
LLM ─X→ Task State / Runtime Event / Tool / Adapter
Verifier ─X→ LLM → Tool
```

## Task与状态

- 所有状态变化通过`Event → transition → State + Commands`。
- Conversation、Interaction Session、Activity和Artifact不得成为第二套Task State；Case Projection必须可从权威Task/Authorization/Attempt/Outcome重建。
- 前台Session断开不取消Durable Case；后台Run必须从结构化Case State和最小Context恢复，不依赖完整聊天历史。
- 模型、工具和外部Webhook不能直接写Task。
- Pilot前且无须保留真实数据时，State/Schema修改应同步更新调用方与Fixture并删除旧版路径，不新增兼容迁移。
- 需要保留生产数据、进行中现实任务或外部消费者时，State/Schema必须版本化并提供经过验证的迁移；不得默默重解释旧状态。
- 重复Event、Worker重启和并发请求不能重复副作用。
- `OUTCOME_UNKNOWN`是正式状态，不用模型猜测填补。
- `NEED_REINTERPRETATION`在v15只记录冲突并要求用户输入或安全降级；不得自动重新解释、覆盖State或形成模型重试循环。

## 模型

- 所有DeepSeek调用通过服务端Model Gateway。
- 每类调用必须有purpose、promptVersion、Schema、timeout、明确失败行为和日志。默认fail closed；只有当前User Flow需要时才提供降级体验，不接备用模型链或多级重试。
- Semantic Interpreter只能输出Restaurant Semantic Proposal：目标、时间、人数、地点、偏好、约束、修正、否定、确认与受控soft context。它不得输出内部`StatePatch`、Event、Readiness、Action、Authorization、Tool Call或Outcome。
- Semantic Proposal Contract通过只代表结构合法；不得把它当成语义正确、用户确认或可信Evidence。
- Restaurant Semantic Compiler必须是纯确定性Domain代码：合法Proposal到Domain Event/State Patch；不得调用模型、读取Live Data、决定Policy或执行动作。
- Decision Kernel只能读取Authoritative State和Trusted Evidence；它只能输出下一步Decision，不能直接写State或调用Tool。
- LLM Response只能解释事实、生成澄清问题或提出调整建议；建议必须经用户新的明确消息重新进入Semantic Interpreter，不能直接编译成状态改变。
- Tool参数必须二次校验；Tool Call不是Authorization。
- 页面、邮件和搜索结果均是不可信输入。
- Prompt不得包含生产Secret、银行卡、OTP、Cookie或无关PII。

## Policy与执行

- `COMMIT_ACTION`前必须有有效Authorization和最新PolicyDecision。
- 目标、价格、时间、条款或资料版本变化使授权失效。
- 提交后超时不能重试，只能Verify。
- Browser Agent只能在允许域名和能力范围内执行。
- 登录、验证码、支付、3DS、CAPTCHA和新增高风险条款进入Human Takeover。

## Search与Domain

- Search Runtime只提供并发、预算、批次、缓存和Trace。
- Entity、过滤、排序、Enrichment和“足够候选”由Domain定义。
- Restaurant和Product不得共享伪通用业务Entity。
- 新Adapter必须更新Capability Matrix和Golden Scenario。

## 数据与安全

- Secret只在服务端环境或Secret Manager。
- PII字段级加密，日志脱敏。
- Google及其他Provider数据按政策存储和署名。
- Browser Profile按Task/Attempt隔离并在终态销毁。
- Mock/测试开关在生产环境必须被禁止或启动失败。

## 修改前检查

1. 改动属于Core、Domain、Integration、Web还是Harness？
2. 是否改变Accepted ADR？
3. 是否引入逆向或跨Domain依赖？
4. 是否产生新的副作用或授权范围？
5. 是否改变Outcome或Evidence语义？
6. 是否需要Schema迁移和Replay Fixture？
7. 是否需要更新Capability Matrix、Harness和文档？
8. 是否引入了当前验收条件不需要的兼容、fallback、配置、抽象或网络往返？
9. 若为提前扩展，它是安全地基、Design预留还是有停止点的架构探针？重新启动条件是什么？
10. 这是Conversation/Session体验状态，还是必须进入Durable Case Runtime的现实承诺？
11. 这是用户本轮语义、内部状态操作、Kernel Decision、Runtime Command还是外部Execution Action？是否被放进了错误层？
12. Semantic Proposal Contract通过是否仅代表结构合法？语义正确性、用户确认和Evidence是否被错误混同？
13. Compiler是否是可重放的Restaurant确定性代码，且没有模型、Live Data、Policy或Tool依赖？
14. Decision Kernel是否只基于Authoritative State和Trusted Evidence，且没有`LLM → Tool`或`Verifier → LLM → Tool`旁路？
15. `NEED_REINTERPRETATION`是否仅记录冲突并走用户确认/安全降级，而没有自动写State？
16. 新的Artifact或Workspace抽象是否已有第二个真实Domain使用者；若没有，能否留在Restaurant纵向切片？

违反规则时停止编码，说明冲突并给出合规方案；确需改变架构时先新增ADR。
