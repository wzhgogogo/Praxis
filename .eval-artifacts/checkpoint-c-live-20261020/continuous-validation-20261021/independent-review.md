# 快速验证 0/3：独立复核与根因

复核对象：`codex/chore-checkpoint-c-prep` @ `e95de8c`。复核时间：2026-10-21 16:20 北京（Vienna 10:20）。

## 结论：翻月修复在 Live 中生效；剩下的失败来自 Tabelog 改版后，我们的"选中确认"规则失效

### 1. 翻月已经解决

c-01 Matsumoto（见证店）的决策记录：第 20 次点 "Next month"（Calendar 组）→ 页面显示 Nov 2026 → 第 21 次选 11 月 3 日 → 第 22 次观察中日期 2026-11-03 和人数 2 都标为 selected → 模型 COMPLETE。Agent 的操作完全正确。

### 2. 但完成判定拒绝了（COMPLETE_PREDICATE_UNSATISFIED → REQUEST_SELECTION_UNCONFIRMED）

`src/integrations/tabelog/tabelog-query-controls.ts` 中的 `hasTabelogSelectedQuery` 要求：
- `<p class="js-calendar-day-target … is-current" data-year data-month data-day>`；
- `<button class="js-people-button … is-active">N</button>`；
- `<input class="js-people-hidden-value" value="N">`。

`tabelogCapturedSlots`（绑定 find_vacancy 响应）也先要求这个函数为真。

复核者检查了各时期录制的 Tabelog 门店页 HTML：

| 录制 | 旧标记（js-calendar-day-target） | 新标记（p-booking-calendar__day） |
| --- | --- | --- |
| P1-F 准备 10-11 | 9 页 | 9 页（新旧同时存在） |
| P2-1 基线 约 10-16/17 | 1 页 | 1 页 |
| 检查点 A 修正 10-19 | **0** | 8 |
| 检查点 B 修正 10-19/20 | **0** | 29 |
| 检查点 C 10-20 | **0** | 111 |
| 快速验证 10-21 | **0** | 165 |

现在的标记是：
- 日期：`<button class="p-booking-calendar__day is-selectable|is-selected" data-year data-month data-day>`；
- 人数：`<button class="p-booking-calendar__people-button is-active" data-value="2">2</button>`；
- 没有 `js-people-hidden-value` 隐藏字段。

**Tabelog 在 10-17 到 10-19 之间改了预约日历的 HTML。** 此后旧规则在任何门店页上都不可能为真，所以检查点 C 以来所有 Tabelog 查位都是 REQUEST_SELECTION_UNCONFIRMED，即使 Agent 已经选对。第一阶段 H001、H002、H005 能交付，是因为当时页面还是旧标记。这也解释了为什么只修翻月不够。

## 建议的修复（离线）

1. **选中确认不再依赖站点的 js- 钩子**：
   - 日期：带 data-year/month/day 且有选中状态（is-selected、is-current，或通用选中状态）的元素，等于请求日期；
   - 人数：人数组中选中的按钮（data-value 或文字）等于请求人数；隐藏字段有就核对，没有不作为必需条件。
   - 优先复用 8e47ddf 的通用选中状态读取，站点包只保留必要的最小语法。
2. **以 find_vacancy 响应为主要绑定**：响应中 `base_date` 等于请求日期、`members` 等于请求人数，且页面上日期和人数的选中状态与之一致，才接受；不一致或缺失仍为 UNKNOWN。
3. **离线验证**：
   - 用快速验证 3 次中 19 个 REQUEST_SELECTION_UNCONFIRMED 的已保存快照和响应，逐个重算新规则：报告有多少变为已确认，解析出的时段与运行后独立复查（四参数 GET）是否一致；
   - 找错 0：日期、人数或门店不一致时必须拒绝，补反例；
   - 新旧两种标记都要有 Fixture（旧标记保留为回归）。
   - 五门禁、69 点翻月、5/5 选店、22/22 校准不退步。
4. **长期**：这是"来源改版"的典型案例。第三阶段的监控哨兵应当每天检查这类关键标记是否还存在。
