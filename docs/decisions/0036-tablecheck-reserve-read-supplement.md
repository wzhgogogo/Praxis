# ADR-0036 补充：预约入口的有限公共读取

- Status: Accepted
- Document revision: 1.0
- Last updated: 2026-10-09
- Source of truth for: G1 公共预约入口的有限只读文档许可；用户 2026-10-09 批准
- Related ADRs: [ADR-0036](0036-generic-public-read-network-policy.md)
- Related documents: [Capability Matrix](../integrations/CAPABILITY-MATRIX.md)

## 背景与已批准决策

现有 Adapter 可从同一门店已观察的入口解析 `/en/shops/<slug>/reserve`，此前 Guard 拒绝敏感 reserve 路径，离线组合中的模拟浏览器未实施同一 Guard。用户于 2026-10-09 批准合入独立分支实现，并要求离线组合与 Live Guard 一致。ADR-0036 原正文保留；本补充为该受限文档许可的权威依据。

只允许 `https://www.tablecheck.com/en/shops/<slug>/reserve?start_date=<date>&pax=<party>` 的 GET document。路径整段锚定，slug 仅小写字母、数字和连字符且不含敏感独立段；参数必须各出现一次、不得有其他字段。这与 `tableCheckRequestedReservationUrl` 对无额外字段 LINKED_PAGE 的现有输出一致；原链接携带额外参数时仍拒绝，不删除参数以绕过 Guard。嵌入式 guide 参数不受本提案影响。

读取停止于日期、人数、时段列表及现有允许的查询控件。不得点击下一步、提交、确认、登录、支付或预约；POST、HEAD、fetch、额外参数、重复字段、reserve 后继路径和敏感路径仍拒绝。GET 文档许可不构成副作用 Authorization，也不构成库存或门店身份证据；资格、日期/人数对应、新鲜度、HARD 和证据接纳规则不变。重定向逐跳检查，不能进入确认页。

共享 Guard 仅增加 source-owned 锚定路径语法执行，不包含域名、站点类名或餐厅知识。prepared GET 不得被 HEAD/POST 借用。已有公共日历 read POST 独立规则不受此补充扩大。

## 验证与停止点

Guard 形态对照验证 GET document 放行；POST/HEAD/fetch、额外/重复/缺失参数、子路径、登录/确认段、其他来源、prepared 方法借用及确认重定向仍拒绝。两个 reserve-menu 组合场景用生产 PlaywrightReadNetworkGuard 和 composition 提供的 source-owned policy 检查每次模拟文档请求，再落到离线固定页面；分别验证事实先行/查位先行时固定查询可交付、裸入口在事实追读中拒绝且没有合格交付。网络传输与页面内容为 Fixture，不能证明真实页面库存或 JavaScript 请求兼容性。

用户另行批准的 P1-E 两例只读 Live 用于核对当前来源效果，错误展示立即停批。运行报告和独立复核承担来源结论；Accepted 权限决定不等于已获得 Live 能力证明。
