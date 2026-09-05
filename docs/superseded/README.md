# Superseded Archive

- Status: Accepted
- Document revision: 1.0
- Last updated: 2026-08-20
- Source of truth for: 已退出当前主链但仍有Retro、Review或审计价值的材料索引
- Related documents: [Documentation Index](../INDEX.md), [Current Status](../STATUS.md), [Dev Log](../history/DEVLOG.md)

本目录内容统一属于`superseded retrospective`：保留历史Plan、Golden、Annotation Guide与设计口径，但不进入当前阅读主链、默认命令、产品能力或Clean Baseline。历史正文不按当前命名机械改写；当前结论只从链接的Source of Truth判断。

- [Roadmap before repository review](ROADMAP-BEFORE-REPOSITORY-REVIEW.md)：2026-09-05整改前路线正文，superseded retrospective，不作为当前阶段门槛。

## Restaurant Harness与Eval

- [Progressive Decision Eval](harness/RESTAURANT-PROGRESSIVE-DECISION-EVAL.md)：已删除可执行实现的历史Eval Plan、Scorer设计与结果记录。
- [Progressive Decision Golden Seed](harness/RESTAURANT-PROGRESSIVE-DECISION-GOLDEN-SEED.md)：首批7个Episode / 17个Turn的历史Annotation Guide与Golden口径。
- [Categorized Semantic Holdout](harness/RESTAURANT-CATEGORIZED-SEMANTIC-HOLDOUT.md)：开放`criteria`之前、已被替代且未作为当前Baseline运行的Holdout格式。
- [Clean Semantic Holdout Baseline Plan](harness/RESTAURANT-SEMANTIC-CLEAN-HOLDOUT-BASELINE-PLAN.md)：已完成的旧Clean Holdout执行计划；仅保留其决策与审计背景，当前协议以[Restaurant Semantic Holdout](../harness/RESTAURANT-SEMANTIC-HOLDOUT.md)为准。

旧可执行代码、Runner、兼容路径或重复测试不复制进本目录；需要查看或恢复时使用对应Git历史。
