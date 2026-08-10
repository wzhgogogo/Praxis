# ADR-0002: DeepSeek as the First Model Runtime

## Status

Accepted — 2026-08-05

## Context

MVP需要自然语言理解、查询扩展、候选解释和未知页面辅助判断。模型供应商已确定为DeepSeek；模型输出具有概率性，不能直接控制现实副作用。

## Decision

第一版通过服务端Model Gateway接入DeepSeek。模型调用按任务和Prompt版本化。DeepSeek负责语义与受控规划；Task Runtime、Policy、Adapter和Verifier负责状态、权限、执行与完成判断。

模型只获得只读和提议类Tool，不获得Commit、Cancel、Payment或Mark Verified能力。API Key仅存在服务端。

## Consequences

- 模型可升级或替换而不改变业务控制面。
- 必须建设Schema Validator、Fallback、调用日志和Eval数据集。
- DeepSeek故障时新自然语言任务降级为结构化表单。

## Alternatives considered

- 前端直接调用DeepSeek：泄露Secret且缺乏统一控制。
- 让模型拥有写Tool：副作用和重试风险不可接受。
- 同时支持多模型供应商：MVP复杂度不必要。

## Related documents

- [Agent Orchestration](../architecture/AGENT-ORCHESTRATION.md)
- [Data and Security](../architecture/DATA-CONTEXT-SECURITY.md)

