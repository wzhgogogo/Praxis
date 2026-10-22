# 站点私有 class 离线审计

2026-10-21 已保存页面；原始来源提交 e95de8cd。未访问网站。基线 54383f8f，保留逐行表达式及证据 SHA，见 private-class-audit.json。

| 来源 | 基线位置 | 依赖 | 状态 | 命中页面 | 处置 |
|---|---|---|---|---:|---|
| TABELOG | src/integrations/restaurant-search/source-packs.ts:320 | `js-list-sidebar-cal-date` | 仍存在 | 6/191 | REPORT_ONLY |
| TABELOG | src/integrations/tabelog/tabelog-page-parser.ts:249 | `js-rstdtl-course-list` | 仍存在 | 159/191 | REPORT_ONLY |
| TABELOG | src/integrations/tabelog/tabelog-page-parser.ts:249 | `rstdtl-course-list js-rstdtl-course-list` | 仍存在 | 159/191 | REPORT_ONLY |
| TABELOG | src/integrations/tabelog/tabelog-page-parser.ts:250 | `rstdtl-course-list__course-title-text` | 仍存在 | 159/191 | REPORT_ONLY |
| TABELOG | src/integrations/tabelog/tabelog-page-parser.ts:251 | `rstdtl-course-list__desc` | 仍存在 | 142/191 | REPORT_ONLY |
| TABELOG | src/integrations/tabelog/tabelog-page-parser.ts:252 | `rstdtl-course-list__price-num` | 仍存在 | 159/191 | REPORT_ONLY |
| TABELOG | src/integrations/tabelog/tabelog-page-parser.ts:253 | `rstdtl-course-list__course-rule` | 仍存在 | 140/191 | REPORT_ONLY |
| TABELOG | src/integrations/tabelog/tabelog-page-parser.ts:274 | `js-rstdtl-course-list` | 仍存在 | 159/191 | REPORT_ONLY |
| TABELOG | src/integrations/tabelog/tabelog-page-parser.ts:274 | `rstdtl-course-list js-rstdtl-course-list` | 仍存在 | 159/191 | REPORT_ONLY |
| TABELOG | src/integrations/tabelog/tabelog-page-parser.ts:276 | `rstdtl-course-list__price-num` | 仍存在 | 159/191 | REPORT_ONLY |
| TABELOG | src/integrations/tabelog/tabelog-page-parser.ts:279 | `rstdtl-course-list__course-title-text` | 仍存在 | 159/191 | REPORT_ONLY |
| TABELOG | src/integrations/tabelog/tabelog-query-controls.ts:16 | `js-calendar-day-target` | 已消失 | 0/191 | FIXED |
| TABELOG | src/integrations/tabelog/tabelog-query-controls.ts:17 | `js-people-button` | 已消失 | 0/191 | FIXED |
| TABELOG | src/integrations/tabelog/tabelog-query-controls.ts:18 | `js-time-button` | 已消失 | 0/191 | FIXED |
| TABELOG | src/integrations/tabelog/tabelog-query-controls.ts:73 | `js-calendar-day-target` | 已消失 | 0/191 | FIXED |
| TABELOG | src/integrations/tabelog/tabelog-query-controls.ts:89 | `js-calendar-day-target` | 已消失 | 0/191 | FIXED |
| TABELOG | src/integrations/tabelog/tabelog-query-controls.ts:94 | `js-people-button` | 已消失 | 0/191 | FIXED |
| TABELOG | src/integrations/tabelog/tabelog-query-controls.ts:97 | `js-people-hidden-value` | 已消失 | 0/191 | FIXED |

TableCheck 生产来源代码没有 js- 钩子或整串 class 精确匹配。额外审计其单 token / 通用 loading 状态：
- `menu-item`：未覆盖（0 页）。未出现的旧预约菜单结构列为未覆盖，不能据公开 guide 页面宣称已消失。
- `CalendarSkeleton`：未覆盖（0 页）。未出现的旧预约菜单结构列为未覆盖，不能据公开 guide 页面宣称已消失。
- `skeleton`：仍存在（39 页）。未出现的旧预约菜单结构列为未覆盖，不能据公开 guide 页面宣称已消失。

本次关键路径额外发现：运行时 GET 为 `/en/booking/calendar/find_vacancy`，旧监听只接受带末尾 `/` 的路径。19 个终末快照的捕获响应均为 0；现同时监听两种明确路径，不新增 Guard 权限。旧 Live 录制不回填。

课程列表和列表日期的剩余私有钩子仅报告；今天有实存证据，本次不扩展修改。静态审计不覆盖没有保存的页面、未来改版、网络可用性或实时库存。
