# ADR-0036 补充草稿：预约入口的有限公共读取

- Status: Proposed
- Document revision: 0.1
- Last updated: 2026-10-09
- Source of truth for: G1 隔离分支草稿；draft / not integrated
- Related ADRs: [ADR-0036](0036-generic-public-read-network-policy.md)
- Related documents: [Capability Matrix](../integrations/CAPABILITY-MATRIX.md)

## 背景与决策提案

现有 Adapter 可从同一门店已观察的入口解析 `/en/shops/<slug>/reserve`，但当前 Guard 拒绝敏感 reserve 路径，离线组合中的模拟浏览器未实施同一 Guard。Accepted ADR-0036 正文不变。本提案仅在 `codex/g1-tablecheck-reserve-read-draft` 实现，不合入当前产品分支，须经用户决定。

只允许 `https://www.tablecheck.com/en/shops/<slug>/reserve?start_date=<date>&pax=<party>` 的 GET document。路径整段锚定，slug 仅小写字母、数字和连字符且不含敏感独立段；参数必须各出现一次、不得有其他字段。这与 `tableCheckRequestedReservationUrl` 对无额外字段 LINKED_PAGE 的现有输出一致；原链接携带额外参数时仍拒绝，不删除参数以绕过 Guard。嵌入式 guide 参数不受本提案影响。

读取停止于日期、人数、时段列表及现有允许的查询控件。不得点击下一步、提交、确认、登录、支付或预约；POST、HEAD、fetch、额外参数、重复字段、reserve 后继路径和敏感路径仍拒绝。GET 文档许可不构成副作用 Authorization，也不构成库存或门店身份证据；资格、日期/人数对应、新鲜度、HARD 和证据接纳规则不变。重定向逐跳检查，不能进入确认页。

共享 Guard 仅增加 source-owned 锚定路径语法执行，不包含域名、站点类名或餐厅知识。prepared GET 不得被 HEAD/POST 借用。已有公共日历 read POST 独立规则不受此补充扩大。

## 验证与停止点

只跑本地 fake Route Guard 正反例和现有四门禁，没有打开真实预订页面或表单，也没有新增实际网络/模型调用。Harness 场景为 `playwright-read-network-guard.test.ts` 的 G1 draft 生成器→prepare→Route 形态对照：放行 GET document；拒绝 POST/HEAD/fetch、额外/重复/缺失参数、子路径、登录/确认段、其他来源、prepared 方法借用及确认重定向。

没有 Live 验证，真实页面能否在当前 guard 下仅依靠已有读请求呈现时段仍未确定。若不接受本提案，两个 TableCheck reserve-menu 组合场景应接入真实 Guard 或显式提供拒绝响应并断言 UNKNOWN/无合格交付；现有纯模拟成功仅证明下游语义，不能用作该路径的 Live 能力依据。独立复核后决定合入或放弃，不自动合入。
