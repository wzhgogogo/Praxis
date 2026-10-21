# 条件展示证据修复：独立复核

复核对象：`0fab7339`（代码 `f097ab15`）。复核时间：2026-10-21 22:30 北京（Vienna 16:30）。

**通过，有 1 项小修改。**

- 行为正确：店名和顾客评论单独不能支撑 HARD 的 MET（Kaga → NOT_CHECKED，并展示 NAME 和 CUSTOMER_REVIEW 原句及原因）；展示真实字段原文；午餐限定保留，不承诺请求时段的套餐。模型请求内容不变（字段角色不发给模型）。986/131 全绿；3 次回放结果符合预期。
- **需修改：** 新增的 `parseTabelogSourceFieldQuotes` 用整串 class 精确匹配 `class="rstdtl-course-list js-rstdtl-course-list"`，正是本周导致失败的脆弱写法。请改为按 class 词元匹配（包含 `rstdtl-course-list` 即可），课程标题、描述、评论标题、display-name 的匹配同样按词元，不依赖 js- 钩子；补一个"class 顺序变化或多一个 class"的 Fixture。
- 版本：Restaurant State 19、TaskDefinition 17、condition-states@3。合入时与运行分支的版本统一递增。
- **合入时机：** 检查点 C 结束后合入；用 C18 的产物做 Router → Reducer 展示回放，并用 @32 核对展示一致性；留出集在合入后的代码上运行。
