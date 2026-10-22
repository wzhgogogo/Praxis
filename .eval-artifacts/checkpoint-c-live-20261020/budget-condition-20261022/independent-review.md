# 预算条件修复：独立复核

对象：`02acbf6c`（代码 `46d471ff`）。复核时间：2026-10-22 22:30 北京。

**通过。** 改动小而集中：`assessRestaurantConditions` 把 `intent.budgetPerPerson` 生成为带 criterionRef 的条件行；`read-assessment.ts` 的 HARD 核对改为遍历同一条件列表，因此预算与其他 HARD 价格条件走同一规则（必须 MET 才能交付；超出预算或价格未知都不交付，沿用既有 HARD 价格规则）。三次例 02 回放的 5 条预算行与 @33 一致；五门禁全绿，22/22 保持。

注意：价格未知即不交付是保守选择，可能降低有 HARD 预算请求的交付率。这是正确的安全方向，在留出集中观察其影响。h-11 "ideally under" 被解释为 "around … or less" 的语义偏差已记录，留到第三阶段随语义回归一起修，不在本阶段改语义 Prompt。

合入时机：与团体与时间窗修复一起合入运行分支，再做 3 次 Live 检查。
