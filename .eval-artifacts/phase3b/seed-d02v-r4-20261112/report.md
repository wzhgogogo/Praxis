# D02-V r4：编排中断，未启动 Live

2026-11-12 CET；已暴露开发用例。main 冻结 `105a8b0a825f4dd729674ffb26847d4b13f60771`；运行配置提交 `d3a67cbede3a26402293ec51eb906dc91d5a695f`。main 只整合 src/docs，新增 .eval-artifacts 为 0。typecheck、arch、build、默认 1598、Chromium 281、G6 159 及 D4/D8 回归全通过；ead28945/ca4deca1 双基线新增产品写死均为 0。

| 运行 | 最终状态 | Live 用时 / 模型调用 | GET | S0 / 边界 |
| --- | --- | --- | --- | --- |
| D02V-r1 | ORCHESTRATION_INTERRUPTED_BEFORE_LIVE，未交付 | 未启动 / 0 | 5 | 未评测；没有 Live 请求 |
| D02V-r2 | NOT_SENT（前序异常停批） | 未启动 / 0 | 0 | 未评测 |

**首个原因是执行助手引入的外层路径接线错误。** 脚本从 main 临时工作树启动，却将结果写至证据 worktree。`createHybridDecisionCapture` 要求结果位于当前 cwd 的 `.eval-artifacts/` 之下，相对路径以 `..` 开头就拒绝；该调用位于 runG6Batch 的 try、Live 扣费及模型调用之前。已有 case-input 哈希，但没有 decisions/result/evaluation；账本 Live 和模型均为 0。具体异常消息未由冻结外层保存，根因依据静态代码和目录相对路径定位，见 outer-root-cause.json。不是网络或产品发现失败。按停止边界未修改脚本、未重跑，r2 未启动。

见证 `2026-12-10 20:30 JST / 8 人` 为 exists=true。体检 4/4 通过：TableCheck 两轮 3.884/2.326 秒，Tabelog 两轮 3.958/5.269 秒。没有产品会话或模型决策，因此 LOCATION label、行政区目录 URL 与回退、sourceListingCompletion、Sumika 前五/直达或盲搜、8 人/日期/时段确认均为 **NOT_REACHED，没有 decisions.jsonl sequence**。没有 45 秒供应方超时；离线组件 44.508 秒不作为本轮 Live 结论。

四层评价：端到端为编排中断，非 CAPABILITY_MISS；产品逐环节未到达；独立 S0 与 Live 边界未评测，不将缺失评价写成 S0=0；归因为外层路径接线。Mock/Replay 本轮未新增运行，先前回归仅列门禁。

按用户给定已复核切片口径，03 为 **2/2**、07 为 **2/2**；D02-V 本轮未启动 Live，验收未完成，不重算历史不同阶段分母。

本轮消耗 **Live 0 / GET 5 / 模型 0 / 环境重跑 0**；新账本剩余 **2 / 15 / 120 / 0**。新账本初末 SHA 见 budget-hashes.json；三份旧账本及主工作区 HEAD/草稿/状态哈希前后完全一致。运行源码、Prompt、Skill、Gold、配置和编排均未修改。证据推送后停止待复核，不自行修复或追加运行。
