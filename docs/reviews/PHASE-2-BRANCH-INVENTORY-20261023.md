# 第二阶段远端分支归档与删除确认清单

- Status: Draft
- Document revision: 1.0
- Last updated: 2026-10-23
- Evidence status: current branch inventory；删除仅为提案，尚未授权
- Source: 全部32个远端分支及主线合并图；[机器清单](../../.eval-artifacts/phase2-signoff-20261023/remote-branches.inventory.json)

本次收尾将主线及main快进到含原始签收文件的最终提交，并推送5个annotated tag；实际远端SHA在交付消息和推送后核对记录中确认。本表“已合并”按Git祖先关系判断，不按代码相似度；tag列只列直接指向该分支tip的历史tag。其余已合并历史亦可从phase2-signoff追溯。

26个tip已合并主线，6个尚有独有提交；v14–v17是命名规范明确退役的4个历史指针。**所有分支均未删除。请按完整分支名逐项确认，未确认的一律保留。**

| 远端分支 | 推送前tip | 已合并主线 | 本次归档tag | 状态／删除提案 |
| --- | --- | --- | --- | --- |
| `codex/adr-0010-restaurant-agent-loop` | `455efc1a` | 是 | `—` | 已合并；待逐项确认 |
| `codex/adr-0011-restaurant-agent-loop-controls` | `1b28ed5e` | 是 | `—` | 已合并；待逐项确认 |
| `codex/adr-0012-migration-and-loop-hardening` | `2a9714fc` | 是 | `—` | 已合并；待逐项确认 |
| `codex/adr-0013-agent-loop-final-hardening` | `36a61e3b` | 是 | `—` | 已合并；待逐项确认 |
| `codex/chore-checkpoint-c-prep` | `40ea0c05` | 否 | `phase2-checkpoint-c` | 未合并1个提交；有归档tag；待逐项确认 |
| `codex/chore-group-window-diagnosis` | `b180f30d` | 否 | `—` | 未合并2个提交；未直接打tag；待逐项确认 |
| `codex/chore-hard-criterion-support-analysis` | `c1744b3d` | 否 | `—` | 未合并2个提交；未直接打tag；待逐项确认 |
| `codex/chore-location-resolution-diagnosis` | `af5aeacc` | 否 | `—` | 未合并1个提交；未直接打tag；待逐项确认 |
| `codex/chore-phase2b-exit-pipeline` | `47afd2d7` | 是 | `—` | 已合并；待逐项确认 |
| `codex/docs-phase2-signoff` | `e9de81d6` | 是 | `—` | 已合并；待逐项确认 |
| `codex/feat-live-restaurant-read-path` | `本次最终提交（phase2-signoff）` | 是 | `phase2-signoff` | 保留正式主线 |
| `codex/feat-p2-2-selection` | `7dfeb692` | 是 | `—` | 已合并；待逐项确认 |
| `codex/feat-p2-3-conditions` | `89e0dfb2` | 是 | `—` | 已合并；待逐项确认 |
| `codex/fix-budget-condition` | `200e13cf` | 是 | `—` | 已合并；待逐项确认 |
| `codex/fix-calendar-next-month` | `a6fa26cb` | 是 | `—` | 已合并；待逐项确认 |
| `codex/fix-condition-display-evidence` | `4fcf7702` | 是 | `—` | 已合并；待逐项确认 |
| `codex/fix-criterion-presentation-evidence` | `27b3884a` | 是 | `—` | 已合并；待逐项确认 |
| `codex/fix-evaluator-hard-course-evidence` | `6d758f70` | 是 | `—` | 已合并；待逐项确认 |
| `codex/fix-group-window` | `98cc7994` | 是 | `—` | 已合并；待逐项确认 |
| `codex/fix-near-and-condition-display` | `9de09404` | 是 | `—` | 已合并；待逐项确认 |
| `codex/fix-p2-1c-region-entrance` | `ddfdedd5` | 是 | `—` | 已合并；待逐项确认 |
| `codex/fix-phase2c-location-semantic` | `ae2235b6` | 是 | `—` | 已合并；待逐项确认 |
| `codex/fix-tablecheck-guard-preflight` | `30494fba` | 是 | `—` | 已合并；待逐项确认 |
| `codex/holdout-phase2-exit` | `b1ed9979` | 是 | `phase2-holdout-1` | 已合并；待逐项确认 |
| `codex/holdout-phase2b-exit` | `da8ff090` | 否 | `phase2b-holdout` | 未合并1个提交；有归档tag；待逐项确认 |
| `codex/holdout-phase2c-exit` | `3ec38584` | 否 | `phase2c-holdout` | 未合并48个提交；有归档tag；待逐项确认 |
| `codex/integration-checkpoint-c` | `a6fa26cb` | 是 | `—` | 已合并；待逐项确认 |
| `codex/restaurant-decision-v14` | `b692ee58` | 是 | `—` | 历史指针已退役；待逐项确认 |
| `codex/restaurant-decision-v15` | `9e2c48a2` | 是 | `—` | 历史指针已退役；待逐项确认 |
| `codex/restaurant-decision-v16` | `2cd45f04` | 是 | `—` | 历史指针已退役；待逐项确认 |
| `codex/restaurant-decision-v17` | `b8455876` | 是 | `—` | 历史指针已退役；待逐项确认 |
| `main` | `本次最终提交（phase2-signoff）` | 是 | `phase2-signoff` | 保留正式主线 |

四个历史tag严格采用用户确认的分支最终提交：checkpoint-c-prep40ea0c05、第一留出集b1ed9979、第二阶段b da8ff090、第二阶段c 3ec38584。前两个holdout同名分支只发布用例；注释分别链接准备分支中的实际运行、最终评价和复核，不把输入发布提交说成能力达标。

该表不授权清理本地工作树，也不改变各批原始运行、评价或Gold。
