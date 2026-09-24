---
name: praxis-post-change-verify
description: 按Praxis Test和Eval规程完成改动验证、事实同步与交付，保留真实证据和未验证边界。
---

# Praxis Post-change Verify

- Document revision: 1.0
- Last updated: 2026-09-24

本文件负责适用检查、事实同步与交付；验证矩阵、覆盖/检错和故障关闭只由[Test](../test/SKILL.md)维护，质量oracle、评分和门槛只由[Eval](../eval/SKILL.md)维护。

1. 确认本次diff与已有用户改动的边界，复核实际影响的ADR和[Arch Guard](../arch-guard/SKILL.md)边界。
2. 按[Test](../test/SKILL.md)运行适用检查，修复本次引入的问题；对执行链切片逐项交付实际入口、检错证据、未覆盖边界及Eval影响。既有失败和环境阻塞单独报告，不声称未运行的模式通过。
3. 按[Eval](../eval/SKILL.md)核对评价对象、证据状态、分母、门槛和独立evaluation；执行artifact与evaluation分开保存，评价失败不得覆盖执行结果。
4. 只更新确实变化的权威文档；当前能力/证据/下一门槛变化时更新STATUS，非trivial实现与验证分别追加DEVLOG、TEST-LOG。产品、架构、Domain、平台、入口和命名的归属以[INDEX](../../INDEX.md)和[Conventions](../../REPOSITORY-CONVENTIONS.md)为准。
5. 检查diff和命名，说明覆盖的合并/退役去向、行为、实际检查、失败/未运行及原因、模式、副作用和限制。提交/推送遵守Conventions；未获授权不推送。

交付先对照[Planning的切片承诺](../planning/SKILL.md#切片收敛与偏离提醒)说明改善是否兑现、证据及首个剩余阻断。区分探针、离线组合、真实只读和受控写入；发生范围或口径偏离时按Planning说明并收敛，不自动扩展下一轮。
