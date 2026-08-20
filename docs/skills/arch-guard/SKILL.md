---
name: praxis-arch-guard
description: Praxis编码前架构守卫；只保护长期依赖、状态权威、执行权限和Outcome边界。
---

# Praxis Arch Guard

任何业务代码改动前必须读取本文件。版本职责、Prompt和具体Eval流程分别以Accepted ADR、Eval Skill和Test Skill为准，不在这里重复。

## 长期权威边界

- Runtime拥有权威Task State；所有变化经过`Event → Reducer → State + Commands`。
- LLM只产生不可信Proposal或解释，不直接写State、Event、Authorization、Outcome，也不直接执行Tool。
- Domain拥有业务语义；Core不得依赖Concrete Domain，Domain之间不得直接依赖。
- Semantic Compiler是Domain-owned纯确定性代码，不依赖模型、Live Data、Policy、Tool或Adapter。
- Restaurant Action Validator只读取Authoritative State与Trusted Evidence，只产生`ALLOWED` / `REJECTED` / `REQUIRES_AUTHORIZATION` verdict，不选择下一步、不写State或调用Tool。Agent Action仍是不可信Proposal。
- Policy拥有副作用许可；Tool Call、模型建议和UI操作都不是Authorization。
- Verifier拥有现实Outcome解释权；提交后结果不明进入`OUTCOME_UNKNOWN`，不得盲目重试。
- Web/client不得持有Provider Secret、权威业务状态或直接依赖Provider实现。
- Conversation、Session、Activity与Artifact是交互或Projection，不得成为第二套Task State。

## 依赖方向

```text
web → server/application contracts
application → core/domain ports
domains/* → core contracts
infrastructure/integrations → core/domain ports

core ─X→ domains/* / infrastructure/*
domain A ─X→ domain B
web ─X→ provider/adapter implementations
semantic compiler ─X→ model gateway / tool / adapter
action validator ─X→ model gateway / tool / adapter
LLM ─X→ authoritative state / execution
```

## 执行与安全

- 外部写入必须经过最新PolicyDecision与有效Authorization，并具备幂等和Outcome验证。
- 登录、验证码、支付、3DS、CAPTCHA和新增高风险条款进入Human Takeover。
- Secret只存在服务端环境或Secret Manager；日志与Artifact不得保存Secret或无关PII。
- Mock、Replay、Live Read-only与Controlled Live-write必须分开运行和汇报。
- Pilot前无生产数据或外部消费者时，直接替换旧路径并删除旧代码，不建立兼容层。

## 自动与人工检查

运行：

```bash
npm run arch:check
```

自动检查只覆盖可可靠判断的import依赖：Core逆向依赖、跨Domain依赖、Web到Provider实现、Restaurant Compiler/Action Validator到模型或Adapter。以下仍需人工审阅：

1. 是否改变Accepted ADR或权威职责；
2. 模型输出是否被误当作语义正确、用户确认或可信Evidence；
3. Decision是否绕过Runtime/Policy成为直接Tool Call；
4. 是否新增副作用、授权、Outcome或数据保留风险；
5. 是否引入没有当前使用者的抽象、fallback、重试或网络往返。

违反边界时停止编码并说明冲突；确需改变架构时先新增ADR。
