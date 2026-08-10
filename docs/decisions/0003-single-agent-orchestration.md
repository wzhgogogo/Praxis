# ADR-0003: Single Agent with Deterministic Orchestration

## Status

Accepted — 2026-08-05

## Context

搜索、Browser操作和验证可被描述为多个专业角色，但Multi-Agent会引入状态冲突、额外模型成本和更复杂的授权边界。Restaurant流程的主路径是已知的。

## Decision

MVP只有一个用户级Praxis Agent。主任务使用确定性Task Graph；DeepSeek只在Intent、解释、查询扩展和未知页面等模糊节点运行有界Loop。Search Connector、Browser Worker和Verifier是模块，不是Agent。

## Consequences

- 状态、授权和Outcome只有一个权威写入路径。
- 更容易Replay、Harness和故障恢复。
- 未知网站的自主性被限制在提交前。
- Specialist Agent后续只能作为受控Tool引入。

## Alternatives considered

- Planner/Executor/Critic Multi-Agent：对当前任务成本大于收益。
- 纯ReAct Loop：无法可靠约束预约副作用。

## Related documents

- [Agent Orchestration](../architecture/AGENT-ORCHESTRATION.md)
- [Harness Design](../harness/HARNESS-DESIGN.md)

