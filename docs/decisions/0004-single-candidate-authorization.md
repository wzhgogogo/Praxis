# ADR-0004: Single Candidate Authorization

## Status

Accepted — 2026-08-05

The one-authorization-to-one-concrete-proposal invariant remains Accepted. The requirement to wait for a user to select again after a definitive failure is superseded by [ADR-0010](0010-restaurant-agent-loop-action-validation.md) and [ADR-0013](0013-agent-loop-final-hardening.md): the bounded Agent may recover candidates, but every resulting proposal requires a new one-time authorization.

## Context

MVP没有跨任务Memory和Personalization。自动按顺序替用户尝试多家餐厅会降低控制感，并扩大条款变化和错误预约风险。

## Decision

Search返回最多3家可执行候选。用户通过`Book this`只选择并授权一家。该候选明确失败或空位消失后，Praxis刷新候选并等待用户重新选择，不自动提交第二家。

结果不明确时禁止返回选择或创建新预约，直到确认原Attempt结果。

## Consequences

- 授权范围清晰，重复预约风险降低。
- 失败后增加一次用户交互。
- Candidate卡必须在授权前完整展示关键条款。
- 后续有Memory和Standing Preference时可通过新ADR评估候选集合授权。

## Alternatives considered

- 有序候选列表授权：自动化更强，但当前控制和风险边界不足。
- 完全不代预约：无法验证Praxis核心价值。

## Related documents

- [MVP PRD](../product/MVP-PRD.md)
- [User Flows](../product/USER-FLOWS.md)
- [Restaurant Domain](../domains/RESTAURANT-BOOKING.md)
