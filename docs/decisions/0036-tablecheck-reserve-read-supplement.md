# ADR-0036 补充：预约入口的有限公共读取

- Status: Accepted
- Document revision: 1.1
- Last updated: 2026-10-10
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

## G1b 公共预约页静态资源（用户 2026-10-10 批准）

独立复核在 kf-h003 #28 与 kf-h001 Sushi Teppen 录制中确认预约文档已放行，但 CDN 静态资源被拦导致空白。追加 source-owned 静态规则：仅 `https://cdn0.tablecheck.com` 至 `https://cdn3.tablecheck.com` 下 `/assets/table_check/` 的 script、stylesheet、font、image，方法 GET/HEAD。其他路径不因本规则获得许可，POST、fetch、document、cdn4 与第三方 googletagmanager/sentry 仍拒绝。旧 /common/ 独立规则不扩大。不得因此推进任何预约下一步。

Guard 正反例验证所有四个 CDN 与四种资源类型及拒绝形态；来源响应为固定传输，只证明网络准入，不证明预约页完整渲染或库存。真实效果留待重新认证后的独立 Live。


## TableCheck 新搜索接口的 GET 预检例外（用户 2026-10-19 批准）

TableCheck 改用 `https://search-v4.production.ap-northeast-1.aws.tablecheck.net/search/` 公共搜索接口；页面自己的 GET 带 `x-api-key` 头，浏览器先生成 CORS 预检。用户于 2026-10-19 批准追加最窄例外：只允许依附于同一 origin、同一路径和同一查询字段语法的已审核 GET 规则的 OPTIONS。当前路径精确为 `/search/`，不扩大到 catalog、其他子路径、其他域名或普通 OPTIONS。

在 Chromium Fetch 请求暂停边界核对浏览器保留的 `Origin`、`Access-Control-Request-*` 和 `Sec-Fetch-Mode: cors`（页面 JavaScript 不能伪造这些头）；不依赖可能缺失或迟到的 Network initiator 标记。页面 Origin `https://www.tablecheck.com`、`Access-Control-Request-Method: GET`、空请求体，以及 `Access-Control-Request-Headers` 中每个头名均属于实际观察到的 `x-api-key`。POST 预检、额外头、无对应 GET 规则、重定向或不完整观察均拒绝。代码不发起 OPTIONS，也不注入或保存 API key 的值；网站自己的请求继续使用浏览器本身提供的头。

Pack、冻结的外层 reviewed-reads、Recorder 与独立 S0 网络审核同步保留该规则及无值协议事实。Playwright 的既有 route 拦截会本地应答真实浏览器预检：本地 Chromium 验证以 CDP 预检记录和后续 GET 的独立接收端为证据，不把本地应答称为网站 OPTIONS 响应。当前 sanitized HAR 未保存可忠实回放的握手，含此预检的录制如实为 NOT_REPLAYABLE；此限制不影响保留 trace。无交付资格、HARD、身份、半径、日期或库存规则变更。
