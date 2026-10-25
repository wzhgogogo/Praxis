# Stop 1 approval and batch 2 boundary

- Status: current executable authorization; not an evaluation result.
- Recorded: 2026-10-25T10:11:36+01:00, Vienna CET UTC+01:00.
- Reviewed branch commit: cca576ece21ace1184c95d34f8d0308534926282.

用户原文：

> 停止点 1 复核：通过。用户批准 ADR-0044（改为 Accepted），并批准本工作真实模型调用上限 144 次，单列于 .eval-artifacts/phase3a-boundary/budget.json，同时在 3a′ 共享账本记一笔，不占用 3a′ 的 400 次。
> 三项细化全部同意：goalBasis 只存在于语义提议和静态评测结果，不进入持久 State，不升 State/TaskDefinition 版本；没有新 TARGET 的修正轮次沿用原目标（CONTEXT_CARRY），新目标的引用必须来自当前消息；“in about 30 minutes” 一类相对时间按灰区标注。
> 批次 3 的回归范围：开发语义回归 15 轮；14 个灰区各额外 3 次；两份已暴露留出集的 12 例（使用已物化日期的冻结输入，不运行含 {DATE} 的模板）；新增开发候选原话 “Good cafes nearby to meet up with a friend on the afternoon of Wednesday”，灰区，跑 3 次（作为新的开发输入，不作为 Gold）。私有 Holdout 仍不读取。
> SR03-T02（规则 B，旧 Gold 为 RECOMMENDATION）列入停止点 3 的待确认清单，本批不改。
> 进入批次 2：实现与离线验证，按指令第 3 节执行。完成后推送本分支，停在停止点 2，等复核。不合并 main。维也纳时间（CET，UTC+1）。

本批真实模型/Google/餐厅网站/Live 调用均为 0；144 是整个边界工作的独立硬上限，不授权越过停止点 2。后续已批准范围为 15 + 14×3 + 12 + 3 = 72 次逻辑解释；现有最多两次输出尝试的网关调用上界 144。输出失败也计数，不增加尝试。
