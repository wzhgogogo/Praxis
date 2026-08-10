# ADR-0005: Modular Monolith for the Pilot

## Status

Accepted — 2026-08-05

## Context

项目尚未进入编码，首要目标是验证真实闭环而非大规模部署。Task Runtime、Search、Policy和Domain需要清晰边界，但微服务会增加部署、追踪和一致性成本。

## Decision

Pilot采用TypeScript模块化单体、PostgreSQL和队列Worker。Web/API、普通Worker和隔离Browser Worker可以是不同进程，但共享代码库和契约。先通过目录与依赖规则保持模块边界，不拆微服务。

## Consequences

- 事务、调试和本地开发更简单。
- Browser负载可以独立扩展。
- 必须通过Arch Guard防止模块边界退化。
- 只有明确的容量、隔离或团队边界出现后才评估服务拆分。

## Alternatives considered

- 从第一天拆微服务：运维和一致性成本过高。
- 单文件快速原型：无法承载状态、授权和Harness。

## Related documents

- [Architecture Overview](../architecture/OVERVIEW.md)
- [Data and Security](../architecture/DATA-CONTEXT-SECURITY.md)

