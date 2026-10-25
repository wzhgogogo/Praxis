# Stop 3 continuation authorization

- Status: current executable authorization / supersedes only the earlier semantic-drift stop rule.
- Times: CET UTC+1. Prior result1/144 remains immutable and is reused, not rerun.

用户原文：

> 停止点 3 复核：提前停批源于复核指令措辞，现修正停止规则（用户同意）：
> 1. 非目标语义差异（如 SR01-T01 yakiniku UNSPECIFIED→HARD）只记录，不停批；跑完计划的 72 轮。停批只限：凭据或网络等基础设施失败、额度用尽、出现 S0 类问题。
> 2. 72 轮完成后，对出现非目标差异的开发轮次，用旧 Prompt v23（同一模型 deepseek-v4-flash、同一输入与参考时间）各跑一次对照，最多 15 次，用于区分新 Prompt 影响与模型波动。对照结果单列，不计入新规则的通过率。
> 3. 总计划 ≤87 次，硬上限仍为 144（已用 1）。凭据授权沿用本批范围。
> 4. 不修改 Prompt 或 Gold。全部差异（含 SR01-T01）列入停止点 3 的逐条确认清单。
> 完成后推送本分支，停在停止点 3。维也纳时间（CET，UTC+1）。
