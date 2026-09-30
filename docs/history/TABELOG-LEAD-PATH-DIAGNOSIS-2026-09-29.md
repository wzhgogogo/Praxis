# Tabelog 主页至单店：主任务独立诊断

- Status: Draft
- Document revision: 0.1
- Last updated: 2026-09-29
- Evidence status: current diagnostic sample / exposed development evidence; not Clean Baseline
- Scope: 用户要求主任务亲自检查主页 → Tokyo 列表 → 单店；真实来源只读，生产 LocalPlaywrightChromium 与控件 observer；无模型、无 H001 整轮、无预约提交。

## 结果

主页、Tokyo 列表、Sushi Dokoro Isseki Sanchou（13294162）详情均可访问。列表 Guests 原生 select 被观察到；详情初始观察无日期/人数，约 2.35 秒后的观察出现日期、人数与时间。实际 calendar initial_vacancy 返回 200。不能把初始快照无控件等同于网站无控件。

通过生产 session.click 和 observeControls 返回的 opaque ID，实际将该店日期从 2026-09-29 改到 2026-09-30，再将人数从 2 改为 3。每步选中状态回读正确；find_vacancy_member_by_date / find_vacancy 返回 200，时间选项随之变化。这是诊断变体，不改变 H001 日期/人数，也不是模型自主执行或 H001 通过。

Teppen 新采样呈现不同来源状态：9 月 29 日日期节点是 day-num--tel，30 日是 day-num--closed；当前可见人数按钮全部 disabled。页面有“No available seats for 2 guests / Please adjust your search conditions”。隐藏未来月份仍有 selectable 日期。现行 TABELOG_QUERY_READY_SELECTOR 在该状态下立即通过，但结构化观察没有当前可操作 Date。不能据此声称 19:00/2 人已完成精确库存核验，也不能把电话预约状态等同于餐厅确实无座。

## 可定位的缺口

1. **准备完成判断与可见查询面不一致**：`.p-booking-calendar:has(p.js-calendar-day-target.is-selectable):has(button.js-people-button:not(.is-hidden))` 可由隐藏未来日期和禁用人数满足。加载完成、查询可操作、目标日期不支持在线查询需要区分。
2. **日期状态未完整表达**：当前日期 hints 只收 selectable 节点，电话/关闭等非可操作日期没有结构化原因。模型收到的“没有 Date 动作”不足以区分未加载与网站限制。
3. **失败归因太粗**：调用方未确认请求时合为 REQUEST_SELECTION_UNCONFIRMED。需要保留已观察到的来源限制及请求绑定缺口，不能靠继续点击或增大超时解决真实的不可选择状态。

最小修复应围绕可见查询区域的加载/状态观察与明确终止原因，复用现有日期人数点击、库存读回；不硬编码店名、日期，不改上游 semantic，不添加通用重试层。本轮未改生产代码。

## 原始证据与限制

- 完整路径：[follow-popup artifacts](../../.eval-artifacts/tabelog-lead-path-follow-popup-20260929/)，各阶段 JSON（完整生产 controls/文本/网络状态）、脱敏 DOM、PNG。
- Teppen：[new sample](../../.eval-artifacts/tabelog-lead-teppen-20260929/)。新采样不能冒充此前 Live 的历史 DOM；旧 run 没有保存完整 DOM/controls，因此旧失败的确切页面时刻仍不能复原。
- 实际操作：[control actions](../../.eval-artifacts/tabelog-lead-control-actions-20260929/)，01-ready → 02-date-changed → 03-people-changed。库存是采样时刻数据；时间选项曾保留 selected 但 disabled 的旧项，selected 本身不证明可用。
- 第一次目录 `tabelog-lead-path-20260929` 的 04/05-shop 命名不可信：click 打开新标签，session 仍在列表而诊断 raw Page 指向 popup；这些混合记录不作为单店证据。后续使用生产 openLink 跟随 popup，完整重走并另存，未覆盖旧材料。
- control-actions 三阶段文件已落盘且操作成功；最后附加局部截图因 `.p-booking-calendar.first()` 选到隐藏容器而超时，脚本 exit 1。不能把脚本整体报为通过；该截图失败不抹去已保存的实际动作与完整截图证据。
- CUA Chrome 初始化因 request-header policy 加载错误失败，随后使用生产 Chromium；这是不同工具的失败，不能归因于 Tabelog 网络。诊断中预约库存接口正常；Google analytics 的 ERR_ABORTED 不等于 Google Maps 或库存接口失败。

本轮证明：访问和生产控件操作在该正常店铺可工作；Teppen 的可见页面状态与当前 ready/结构化观察契约存在真实差距。未证明模型自动完成、精确 H001 库存成功、TableCheck 后段或整个 Playbook 完成。
