# 逐请求与导航时间线

2026-11-03 CET；评测侧新增观察，不是性能修复或Live成功证据。来自 B `257a907e` 的缺口见该提交 handoff.md；没有推断旧录制里无法还原的时序。无真实模型、Google、网站、Live、公开GET或环境重跑；不读取.env。

## 接线与边界

共享 `traceBrowserRuntime` 在评测进程的异步作用域内装饰 Chromium launch/context。实际 launch 参数、Guard处理器、路由结果、页面等待事件、超时、响应内容不改；并发作用域独立。生产 infrastructure、站点、source-packs、评分器均不改。Recorder@5和现有脱敏、准入规则不变，只增加追踪事件/字段。

当前 main 的 hybrid Live、discovery/source-stage/browser-slice探针及 fixed-source Runner 接入剩余读取预算回调。G6 Runner目前只在A工作分支，发布共享入口后再同步该分支、补同一回调和canonical字段保留，分别报告提交与门禁，不将旧G6整包合main。

## JSON结构

- `NETWORK_REQUEST_START`：本次捕获内唯一 requestId、原CDP请求标识、pageId/navigationId、loaderId/frameId、navigationAssociation、method、resourceType、去query/账号/fragment的URL、完整原始URL的SHA256、观察开始时间/monotonic时间、真实CDP browserStartedAt/browserTimestamp、redirectedFromRequestId。
- `NETWORK_RESPONSE_HEADERS`：同一requestId、状态、CDP时间及转换后的browserHeadersAt、观察时间。观察点明确为浏览器CDP，不冒称源站线上首字节时刻。
- `NETWORK_REQUEST_END`：同一标识、开始/结束/耗时、状态、blocked/blockReason、FINISHED/REDIRECT/FAILED/CANCELLED、结束原因。正常CDP终态保存browserEndedAt/browserElapsedMs；生命周期取消只记观察到取消的时间，物理完成时间为null，标记 `LIFECYCLE_CANCELLATION_NOT_WIRE_FINISH`，不伪造线上的结束。无响应状态为null。
- `NAVIGATION_START`：navigationId/pageId、完整URL哈希、发起时remainingReadBudgetMs、navigationAllowanceMs、实际配置超时及来源、waitUntil、发起时间。显式goto可记录load/domcontentloaded；浏览器隐式文档导航没有显式等待/阈值，明确 `NOT_REQUESTED`/null，不猜配置。
- `NAVIGATION_END`：标识、开始/结束时间与实际耗时、COMPLETED/TIMEOUT/CANCELLED/PAGE_CLOSED/FAILED。隐式导航标明仅观察文档网络，并不把它说成页面已加载完成。
- `GUARD_TRANSPORT_START/END/LATE_END`：Guard原route.fetch的独立传输阶段，transportId、方法/资源类型、URL哈希、开始/结束、状态和结果；取消终态同样区分观察与线上完成。响应可用时刻是APIResponse可用，不虚构源站响应头时刻。`GUARD_ROUTE_BLOCK`保留原abort原因。

浏览器请求按真实CDP ID/loader关联，重定向每跳都有独立记录与前跳引用；不按URL或事件先后猜配。Guard传输是独立Playwright请求对象，不能与CDP记录按URL硬合并，也不能将两个观察层的条目相加当作源站唯一请求数。后台资源仅有最近页面归属时标为 `LAST_PAGE_NAVIGATION_UNVERIFIED`，不伪称确定loader关联。

blocked原因使用实际CDP blockedReason/errorText或route.abort代码；并非可凭这些值还原Guard内部每一条策略分类。原Guard diagnostics照旧保留，策略分类没有被新时间线替代。若源站传输结束晚于录制关闭，物理终态仍未知，不能从取消观察推算其真正到达时间。

## 离线检错

`src/harness/browser/request-timeline.test.ts` 从实际Live追踪入口、真实LocalPlaywrightChromium及原Guard开始，只将来源改为本机loopback服务器，无模型。原代码在 `existing trace lacks per-request chronology` 断言有效失败，见red.log；测试环境准备中被原Guard正确拒绝的token/cancel业务路径已改为普通本地文档，不修改Guard。

绿灯逐字段核对：延迟脚本的开始/响应头/结束和导航关联；load与domcontentloaded及超时阈值/预算；相同URL哈希相等、同路径不同query不等；302重定向；真实导航超时；按服务器已接到请求的事件触发取消；每个开始有终态且ID唯一；POST到达0；输出没有query值、body或凭据。实际Recorder文件也核对这些字段；与无文档对照的准入结果相同。并发两个浏览器会话验证不同预算和请求不串录。

局部fixture观察12请求、5导航、3拦截；后续完整门禁结果另记。测试不证明当前餐厅网站连接质量、旧Live故障根因、源站限流或性能收益。没有新网站认证或比较读取。

## 账本与交付

main原746条与A已发生的813条按ID并集，补一条本次零调用记录，原值不改；保留用户11-03已批准的总Live29/GET400、开发11/35和模型1600/400，避免合入旧main时倒退到290。新真实调用0。ledger-union.json有并集证明。

五门禁和严格G2须在冻结净树候选全绿才按用户授权发布main；输出与最终SHA见后续记录。B/C通知另走已授权消息。G6工作分支同步后将有同样字段，尚未发起任何Live。

## main发布候选验证

2026-11-03T15:53:49.137411+01:00：d61b9dde87d0276b267904688003443b5eba4115 净树五门禁全部PASS：默认1404/1404、Chromium189/189、严格G2 5/5（12页）。每项前后status为空，原日志见gates/；最终提交只归档文档，不改已测源码。待正常快进推送main并核对，G6分支随后同步。
