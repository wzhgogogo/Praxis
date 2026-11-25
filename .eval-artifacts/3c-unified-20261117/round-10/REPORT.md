# Unified Round 10 离线交付

2026-11-19。工作树 `/private/tmp/praxis-3c-unified`，分支 `codex/feat-web-photos-unified`，起始提交 `3059ba7509e036adcef20f341568c5de6f3d58f7`。

唯一验收源码 SHA **`9933ad36eece414f2d37e85710ad825f52dfa16a`**。原始日志、截图和保护快照的证据提交 **`6abd90a793888fd2539a78cd5cf29b6c54a7b468`**。五道门禁与三组视觉都在同一净树源码提交执行。报告和账本随后单独提交。

## 九项修复

| 用户路径 | 实测 |
|---|---|
| 交接刷新 | 已选 19:30 消失时回到卡片并提示重选，回卡片时未生成 19:00 链接，测试重新点选后再进入 Handoff。有可用的 19:30 时继续留在 Handoff，链接绑定重新核实的库存。卡片刷新失败时保留此前明确选过的时段供重试；缺少所选交接时其余可用时段仍可手选。 |
| 迟到的 Case 响应 | 延迟计划 A 的收藏成功响应，切到首页后照常建立计划 B。B 的草稿和服务端用户消息都留在 B。A 的消息历史不含 B 的内容。导航保护同时用于其他 Case 级异步操作。 |
| 普通 HTTP 请求 ID | Chromium 模拟缺少 `crypto.randomUUID`、保留 `getRandomValues`，实际提交标准 RFC 4122 v4 UUID，HTTP 201 后展示结果，无页面异常。 |
| Nearby 定位 | 在无坐标的 nearby 要求下展示入口。允许时真实本地请求带原 Case 版本，PGlite 保存 `DEVICE` 坐标。拒绝时可改填 Higashi-Ginza，继续得到结果并隐藏入口。 |
| 草稿隔离 | A、B 双向切换独立恢复，提交 B 后清除 B，A 草稿保留。 |
| Saved 判定 | 修改人数后，收藏仍有新人数空位但排在首批以外，Saved 保留名称且无失配提示。Find more 可交付该店。真正失配的旧测试及新增投影对照均通过。 |
| 后台状态 | 离开搜索中的 A 后，首页侧栏通过本地列表接口从 In progress 更新为 Ready。推进浏览器时钟 10 秒，无新增列表请求。 |
| 迟到的问店 | 离开计划 A 后发送按钮立即恢复可点击、`aria-busy=false`。放行真实问店 HTTP 200 不打开旧答案，仍可点击发送创建 B。 |
| 409 恢复 | 在途修改期间通过持久化应用执行另一次收藏推进版本，旧修改收到 409。已收到完成 SSE 时零额外 Case GET；屏蔽页面 SSE 回调时恰好一个 Case GET。两条均恢复 1 of 3，保留草稿并提示冲突。对照 503 未增加 Case GET。 |

冻结前定向预检 45/45，随后双入口重新检查 6/6。保留最初的夹具时序诊断和组合回归。Round 4 的两条 About 引用测试现在等待修改人数后真实的两家批次，并核对人数为 3，原引用及证据断言全部保留。修复前对照确认迟到收藏、跨计划草稿和 Saved 误标均能被新断言捕获。 [定向预检](preflight/preflight.log) · [时段回归](preflight/handoff-final.log) · [修复前对照](preflight/red.log)

## 五道离线门禁

| 门禁 | 结果 | 耗时 |
|---|---|---:|
| Typecheck | PASS | 0.603 秒 |
| 架构检查 | PASS，0 个违规依赖 | 0.195 秒 |
| 默认回归 | 1771/1771 | 63.316 秒 |
| Browser Fixture | G2 5/5、Chromium 432/432、G6 assembly 159/159 | 401.833 秒 |
| Build | PASS | 0.537 秒 |

全部退出码为 0，G2 和 Chromium 的合并摘要为 437/437。五道门禁与三组视觉前后均检查了净树和记录 SHA。进程使用环境白名单。非浏览器门禁和视觉由 OS 阻止非本机出站，浏览器总门禁使用离线 Fixture 和录制输入，Replay 子进程自行启用 OS 断外网。 [原始门禁清单](gates/manifest.json) · [机器验收记录](acceptance.json)

## 浏览器视觉

- 正式 HTTP/SSE/PGlite Chromium Fixture **16/16**，32.30 秒，41 张截图。390×844 七项、1440×900 七项、960×900 两项。 [正式清单](formal/manifest.json) · [移动卡片](formal/mobile-google-short-credit-address.png) · [桌面 About](formal/desktop-google-about.png) · [过渡宽度相册](formal/breakpoint-google-long-cover-viewer.png)
- Style 1 **6/6**，7.80 秒。逐图检查，六组间距均为 12 px，非预期 console/network 错误均为 0。 [Style 1 日志](style1-driver.log) · [宽屏有空位](style1/style1-1440x900-available.png) · [手机未查空位](style1/style1-390x844-not-checked.png)
- 状态回归 **17/17**，15.84 秒，12 张截图逐图检查，包含 Round 8/9 的五张既有状态。 [停止后卡片](states/stopped-ready-card.png) · [首条澄清](states/clarification-first.png) · [继续澄清](states/clarification-reply.png) · [有卡检索](states/has-card-searching.png) · [侧栏排序](states/sidebar-order-and-status.png)
- Round 10 关键状态。 [Nearby 定位入口](states/round10-nearby-location.png) · [拒绝定位](states/round10-nearby-denied.png) · [时段保留](states/round10-handoff-renewed.png) · [回卡片重选](states/round10-handoff-reselect.png) · [仍合格的收藏](states/round10-saved-upcoming.png) · [后台 Ready](states/round10-background-ready.png) · [冲突恢复](states/round10-conflict-recovered.png)

两条错误提示在恢复后的首屏不可读。390×844 的时段失效提示被固定输入栏遮住，1440×900 的版本冲突提示位于视口下方。两条路径都恢复到正确卡片，提示可向下滚动查看。补验 2/2，几何断言确认滚动后两条提示在固定输入栏上方完整可读。1440×900 桌面侧栏场景的原有翻页遮挡仍可见，侧栏截图与 Round 9 对应原件 SHA-256 一致。 [时段提示滚动后](states/alerts/round10-handoff-reselect.png) · [冲突提示滚动后](states/alerts/round10-conflict-recovered.png) · [可见性日志](alert-visibility.log)

## 保护与未测

前后比对了主工作区与 closeout 的 HEAD、Git 状态、索引和已跟踪差异，以及主 `.env`、Prompt 15、搜索指纹和 `missingBlockingFields()` 所在文件。Round 6/7/8/9、走查记录和两个未跟踪的复核目录通过逐文件哈希核对。验收产物 104 份逐项核对，报告及索引有单列校验。 [保护记录](protection-check.log) · [逐文件哈希](artifact-sha256.json) · [报告校验](REPORT.sha256)

Chromium、回环服务和 PGlite 已退出，未访问 4312。真实 Live、真实 PostgreSQL、单独整单 Replay 和真实移动设备未运行。Domain、Agent Loop、Reducer、评估输入和评分口径均保持原样。所有提交留在该本地分支，未推送或合入 `main`。交付后等待确认。
