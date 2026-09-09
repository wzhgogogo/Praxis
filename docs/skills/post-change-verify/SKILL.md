---
name: praxis-post-change-verify
description: 按Praxis Test矩阵完成改动验证、文档同步与交付，保留真实证据和未验证边界。
---

# Praxis Post-change Verify

验证要求只由[Test](../test/SKILL.md)维护。本文件负责适用检查、事实同步与交付，不复制测试矩阵。

1. 确认本次diff与已有用户改动的边界，复核实际影响的ADR和安全规则；已读且未变化的材料可复用。
2. 按Test矩阵运行必要检查，修复本次引入的问题；既有失败和环境阻塞单独报告，不声称未运行的模式通过。
3. 核对状态权威、外部写入授权、结果不明确、PII和敏感数据；Mock通过不能替代实际审阅。
4. 只更新内容确实变化的权威文档；当前能力/证据/下一门槛变化时更新STATUS，非trivial实现与验证分别追加DEVLOG、TEST-LOG。涉及Hybrid Live时，确认原始execution artifact与独立evaluation报告分别保存，且evaluation失败不能覆盖执行结果。
5. 涉及测试时按Test维护规则检查重复覆盖与旧测试退役，交付注明覆盖去向。检查diff和命名，概述行为、验证和限制。提交/推送遵守[Conventions](../../REPOSITORY-CONVENTIONS.md)，只暂存本次范围；未获授权不推送，区分本地commit与远端结果。

## 文档归属

| 实际变化 | 对应文档 |
|---|---|
| 产品承诺、交互或确认点 | PRD / User Flows |
| 职责、权限、依赖、数据政策 | 对应Architecture；改变Accepted Decision时新增ADR；长期不变量才同步Arch Guard |
| Domain语义或DTO | Domain / Interfaces |
| 平台能力和证明范围 | Capability Matrix / Harness |
| 测试、评分或运行协议 | Test / Eval / 对应Harness协议 |
| 入口、变量和命令 | README / .env.example；命名规则只归Conventions |

不因目录改动机械更新全部文档。历史ADR、日志、标注和artifact不按当前命名重写，用户排除的数据保持原样。

## 交付报告

说明范围、行为、实际检查、失败/未运行及原因、模式与副作用、文档同步。涉及语义链时按Interpreter、Contract、Compiler、Reducer、Agent、Validator、Router分别归因；端到端结果不能掩盖上游错误。报告长度与改动相称。
