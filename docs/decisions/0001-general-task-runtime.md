# ADR-0001: General Task Runtime and Domain Packages

## Status

Accepted — 2026-08-05

## Context

Restaurant Booking是首个Domain，但未来可能扩展Recurring Shopping、Travel、Subscription、Long-running Case和Coordination。直接写死餐厅会造成迁移；提前构建万能平台又会拖慢MVP。

## Decision

建立通用Task Runtime，统一Goal、Task、Event、Command、Trigger、Authorization、Execution Attempt、Outcome和父子依赖。每个Domain拥有自己的Intent、State、Search Strategy、Policy扩展和Verifier。Runtime不得依赖具体Domain。

Runtime接口与Harness覆盖四类任务骨架，产品层只实现Restaurant Booking。

## Consequences

- 餐厅可以作为第一个Domain纵向实现。
- Scheduler、外部等待和父子依赖从一开始有明确位置。
- Domain业务模型不会被强行统一。
- 需要额外的Runtime Contract Harness。

## Alternatives considered

- 餐厅专用架构：短期快，后续扩展代价高。
- 万能Workflow/Entity DSL：抽象过早且难验证。

## Related documents

- [Architecture Overview](../architecture/OVERVIEW.md)
- [Task Runtime](../architecture/TASK-RUNTIME.md)
- [Future Domains](../domains/FUTURE-DOMAINS.md)

