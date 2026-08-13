# Architecture Decision Records

- Status: Accepted
- Version: 0.3
- Last updated: 2026-08-13
- Source of truth for: 已接受架构决策及其替代关系
- Related ADRs: 本目录
- Related documents: [Architecture Overview](../architecture/OVERVIEW.md)

## 当前决策

| ADR | Status | Decision |
|---|---|---|
| [0001](0001-general-task-runtime.md) | Accepted | 通用Task Runtime + Domain Packages |
| [0002](0002-deepseek-model-runtime.md) | Accepted | DeepSeek为首个模型后端，模型无副作用权 |
| [0003](0003-single-agent-orchestration.md) | Accepted | 单Agent + 确定性主Graph，不使用Multi-Agent |
| [0004](0004-single-candidate-authorization.md) | Accepted | 用户只授权一家，失败后重新选择 |
| [0005](0005-modular-monolith.md) | Accepted | Pilot采用模块化单体 |
| [0006](0006-web-first-agent-workspace.md) | Accepted | Web-first Agent Workspace、Durable Case与Action Control Plane分层 |
| [0007](0007-semantic-proposal-compiler-and-decision-kernel.md) | Accepted | v15 Semantic Proposal、Restaurant Compiler与确定性Decision Kernel |

## 规则

ADR一经Accepted不得静默重写Decision。改变决策时新增ADR，并将旧ADR标记`Superseded by ADR-XXXX`。格式固定为Status、Context、Decision、Consequences、Alternatives considered、Related documents。
