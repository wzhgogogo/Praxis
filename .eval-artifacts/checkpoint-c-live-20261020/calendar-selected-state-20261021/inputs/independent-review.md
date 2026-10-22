# 日历 V3 生产修复：独立复核

复核对象：`codex/fix-calendar-next-month` @ `54c5016`。复核时间：2026-10-21 13:00 北京（Vienna 07:00）。

## 结论：不通过，但原因已查明——观察中缺少"当前选中的人数"

复核者逐个查看了 15 个未命中点的模型输入（`prepared/*.json`）和输出（`decision-matrix.json`）：

- 15 个都选择了点人数（CLICK_AUTHORITATIVE PARTY_SIZE），理由都是"Select guests=N"。
- 这些点的观察中，翻月链接已经正确出现（"Next month"，组 Calendar），当前月份也给出了（Oct 2026）。**但是人数组的按钮 1–6 都没有"已选中"状态**：没有 selected、pressed 或 current 字段。历史中有"点过人数"，结果却是 `NO_CHANGE` 或 `PAGE_CHANGED`，模型无法确认人数是否已经设好，于是重新选人数。c-01-d008、c-02-d010 的理由还写着"previous attempt was on a stale reference"。
- 这正是原始失败的后半段：c-01 Matsumoto 是"点人数 → 点错 Next → 又点人数 → 循环判停"。V3 解决了"看不见翻月按钮"，但"看不见人数已选中"的问题还在。在 Live 中，这仍会导致循环。
- 实现者的 URL 参数核查显示，Tabelog 用 class（如 is-current、active）标记当前日期和选中的人数，而不是 aria 属性。现在的观察不读取这类状态。
- 静态重建与第 0 步的输入不同（目标数、可见文本、观察编号从 1 开始而历史引用旧编号），实现者已如实报告。这会影响"stale reference"一类判断，但不改变上面的主要原因。

其余部分通过：翻月后月份核对（Fixture）、TableCheck `/reserve` 禁止（含重定向和编码路径）、选店 5/5、校准 22/22、五门禁全绿。

## 要求的下一步（离线）

1. **观察中加入控件的选中状态（通用）**：读取 aria-pressed、aria-selected、aria-checked、aria-current，以及常见的状态 class（active、selected、current、checked，含 is- 前缀），作为 `selected: true` 给出；每个控件组给出当前选中值（例如 Guests: 2）。来源不明时不标注，不编造。
2. **人数点击后由执行器核对**：组内选中值等于请求人数，才算人数已确认；已确认后，人数的 CLICK_AUTHORITATIVE 不再作为可选动作提供（避免重复点击）。
3. **重放**：同样 69 个点，用修正后的生产重建，门槛不变（≥68/69）；同时修正重建中历史引用与观察编号不一致的问题，或在报告中逐点标明。选店 5/5、校准 22/22、五门禁。
4. **URL 参数路径**：保持只报告，不实现。如果第 1–3 步仍不通过，由复核者和用户决定是否改用它。
