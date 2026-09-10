# Architecture Decision Records

- Status: Accepted
- Document revision: 0.8
- Last updated: 2026-09-10
- Source of truth for: 已接受架构决策及其替代关系
- Related ADRs: 本目录
- Related documents: [Architecture Overview](../architecture/OVERVIEW.md)

## 当前决策

| ADR | Status | Decision |
|---|---|---|
| [0001](0001-general-task-runtime.md) | Accepted | 通用Task Runtime + Domain Packages |
| [0002](0002-deepseek-model-runtime.md) | Accepted | DeepSeek为首个模型后端，模型无副作用权 |
| [0003](0003-single-agent-orchestration.md) | Accepted; next-action detail superseded in part by ADR-0010 | 保留单一logical Agent；不再以确定性代码选择Restaurant下一动作 |
| [0004](0004-single-candidate-authorization.md) | Accepted; recovery-selection detail superseded in part by ADR-0010/0013 | 一个Authorization仍只绑定一个具体Proposal；definitive failure后由Agent恢复候选/Proposal，用户重新授权 |
| [0005](0005-modular-monolith.md) | Accepted | Pilot采用模块化单体 |
| [0006](0006-web-first-agent-workspace.md) | Accepted | Web-first Agent Workspace、Durable Case与Action Control Plane分层 |
| [0007](0007-semantic-proposal-compiler-and-decision-kernel.md) | Superseded by ADR-0010 | v15 Semantic Proposal、Restaurant Compiler与确定性Decision Kernel |
| [0008](0008-open-restaurant-criteria-contract.md) | Superseded by ADR-0009 | v16开放Restaurant Criterion Contract；强度语义已替换 |
| [0009](0009-semantic-strength-and-clean-holdout-baseline.md) | Accepted | v17语义强度、相对语义与可审计的一次性Clean Holdout Baseline |
| [0010](0010-restaurant-agent-loop-action-validation.md) | Superseded in part by ADR-0011 | 单一Restaurant Agent Loop、动作校验与独立Availability |
| [0011](0011-restaurant-agent-loop-control-refinement.md) | Accepted | Agent Action绑定、失败归因、Loop终止与Trajectory因果引用 |
| [0012](0012-migration-and-agent-loop-hardening.md) | Accepted | Migration不可变性、开发State重置、Agent Context与Loop审计收口 |
| [0013](0013-agent-loop-final-hardening.md) | Accepted | 失败后Agent恢复、route taxonomy、Decision Context trajectory与Hybrid E2E门槛 |
| [0014](0014-search-only-results-completion.md) | Accepted; provider identity scope superseded by ADR-0015 | 只读搜索以证据受限的`PRESENT_RESULTS`结束，不改变预约完成规则 |
| [0015](0015-supported-source-search-evidence.md) | Accepted | 受支持来源的HIGH门店身份与请求对应空位证据，不降低只读结果门槛 |
| [0016](0016-local-eval-browser-profile-lifecycle.md) | Accepted | 本地eval持久profile窄例外，产品隔离与销毁规则保持 |
| [0017](0017-controlled-browser-read-executor.md) | Draft / authorized local-eval implementation | 两来源共享受控浏览器只读执行；模型只提议已观察元素动作 |
| [0018](0018-availability-display-freshness-and-recheck.md) | Accepted | 展示新鲜度与预订前核查分离；以理由受限的只读重查替代永久已检查 |
| [0019](0019-fact-grounded-read-only-recommendations.md) | Accepted | 无预约需求时以门店/地点/类型/营业事实完成只读推荐，空位仍为独立证据 |

## 规则

ADR一经Accepted不得静默重写Decision。改变决策时新增ADR，并将旧ADR标记`Superseded by ADR-XXXX`。格式固定为Status、Context、Decision、Consequences、Alternatives considered、Related documents。
