# 选中状态修复：独立复核

复核对象：`codex/fix-calendar-next-month` @ `2dd97e6`（代码 `8e47ddf`）。复核时间：2026-10-21 14:50 北京（Vienna 08:50）。

**通过。** 翻月重放 69/69（原 15 个未命中点全部选对）、选店 5/5、校准 22/22、五门禁全绿。

复核者阅读了代码 diff：
- 选中状态来自 aria-pressed、aria-selected、aria-checked、aria-current，以及通用状态 class（active、selected、current、checked 及 is- 前缀）。`inactive`、`not-selected`、`current-price` 和 aria-checked="mixed" 不算选中，有反例测试。代码中没有站点、日期或地名常量。
- 每个控件组给出 `selectedValues`。空列表表示"没有观察到选中"，不是默认值。同名的不同组用 `controlGroupRef` 区分。
- 执行器核对：人数确认后，不再提供人数点击；只有无关内容变化时，返回 `PARTY_SIZE_NOT_CONFIRMED` 或 `CALENDAR_MONTH_UNCHANGED`，不计为进展。已选中的日期保留为证据，不再提供重复点击。

可以按用户预先批准的步骤继续：合并冻结 → 3 次快速完整 Live → 重新认证见证 → 检查点 C 重跑。
