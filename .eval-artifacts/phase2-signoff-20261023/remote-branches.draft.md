# 第二阶段收尾：远端分支确认清单

- Status: Draft
- Evidence status: superseded retrospective；31分支的原始提案，已由32分支当前清单替代
- Baseline: codex/feat-live-restaurant-read-path @ c32fe31c
- 只读来源：git fetch origin；git ls-remote --heads --tags origin；git merge-base --is-ancestor
- 当前31个远端分支；25个tip已在主线，6个尚未全部合并；尚无远端tag。
- 删除授权：未授予。本任务未删除任何分支；每一项均须用户单独确认。

“已合并”仅表示tip是主线祖先，不表示可以自动删除。“未合并”只表示存在独有提交，不能按源码相同抹掉复核或运行记录。“历史退役”只用于命名规范明确列出的v14–v17历史指针。

| 远端分支 | 当前提交 | 已合并主线 | 已打tag | 退役标记／处理建议 |
| --- | --- | --- | --- | --- |
| `codex/adr-0010-restaurant-agent-loop` | `455efc1a` | 是 | 无 | 已合并；待逐项确认 |
| `codex/adr-0011-restaurant-agent-loop-controls` | `1b28ed5e` | 是 | 无 | 已合并；待逐项确认 |
| `codex/adr-0012-migration-and-loop-hardening` | `2a9714fc` | 是 | 无 | 已合并；待逐项确认 |
| `codex/adr-0013-agent-loop-final-hardening` | `36a61e3b` | 是 | 无 | 已合并；待逐项确认 |
| `codex/chore-checkpoint-c-prep` | `40ea0c05` | 否 | 无 | 未合并1个提交；先保留记录，待逐项确认 |
| `codex/chore-group-window-diagnosis` | `b180f30d` | 否 | 无 | 未合并2个提交；先保留记录，待逐项确认 |
| `codex/chore-hard-criterion-support-analysis` | `c1744b3d` | 否 | 无 | 未合并2个提交；先保留记录，待逐项确认 |
| `codex/chore-location-resolution-diagnosis` | `af5aeacc` | 否 | 无 | 未合并1个提交；先保留记录，待逐项确认 |
| `codex/chore-phase2b-exit-pipeline` | `47afd2d7` | 是 | 无 | 已合并；待逐项确认 |
| `codex/feat-live-restaurant-read-path` | `c32fe31c` | 是 | 无 | 保留主线 |
| `codex/feat-p2-2-selection` | `7dfeb692` | 是 | 无 | 已合并；待逐项确认 |
| `codex/feat-p2-3-conditions` | `89e0dfb2` | 是 | 无 | 已合并；待逐项确认 |
| `codex/fix-budget-condition` | `200e13cf` | 是 | 无 | 已合并；待逐项确认 |
| `codex/fix-calendar-next-month` | `a6fa26cb` | 是 | 无 | 已合并；待逐项确认 |
| `codex/fix-condition-display-evidence` | `4fcf7702` | 是 | 无 | 已合并；待逐项确认 |
| `codex/fix-criterion-presentation-evidence` | `27b3884a` | 是 | 无 | 已合并；待逐项确认 |
| `codex/fix-evaluator-hard-course-evidence` | `6d758f70` | 是 | 无 | 已合并；待逐项确认 |
| `codex/fix-group-window` | `98cc7994` | 是 | 无 | 已合并；待逐项确认 |
| `codex/fix-near-and-condition-display` | `9de09404` | 是 | 无 | 已合并；待逐项确认 |
| `codex/fix-p2-1c-region-entrance` | `ddfdedd5` | 是 | 无 | 已合并；待逐项确认 |
| `codex/fix-phase2c-location-semantic` | `ae2235b6` | 是 | 无 | 已合并；待逐项确认 |
| `codex/fix-tablecheck-guard-preflight` | `30494fba` | 是 | 无 | 已合并；待逐项确认 |
| `codex/holdout-phase2-exit` | `b1ed9979` | 是 | 无 | 已合并；待逐项确认 |
| `codex/holdout-phase2b-exit` | `da8ff090` | 否 | 无 | 未合并1个提交；先保留记录，待逐项确认 |
| `codex/holdout-phase2c-exit` | `3ec38584` | 否 | 无 | 未合并48个提交；先保留记录，待逐项确认 |
| `codex/integration-checkpoint-c` | `a6fa26cb` | 是 | 无 | 已合并；待逐项确认 |
| `codex/restaurant-decision-v14` | `b692ee58` | 是 | 无 | 历史指针已退役；待逐项确认 |
| `codex/restaurant-decision-v15` | `9e2c48a2` | 是 | 无 | 历史指针已退役；待逐项确认 |
| `codex/restaurant-decision-v16` | `2cd45f04` | 是 | 无 | 历史指针已退役；待逐项确认 |
| `codex/restaurant-decision-v17` | `b8455876` | 是 | 无 | 历史指针已退役；待逐项确认 |
| `main` | `9c3ca738` | 是 | 无 | 保留主线 |

tag目标尚待确认；实际创建并核对远端后更新清单，不把拟打tag写成已打tag。
