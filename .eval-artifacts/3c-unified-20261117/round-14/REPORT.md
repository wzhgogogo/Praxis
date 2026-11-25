# Unified Round 14 离线验收

2026-11-20。工作树 `/private/tmp/praxis-3c-unified`，分支 `codex/feat-web-photos-unified`。

- 基线 `3c8dd0f5072f6f7f993789d316bcc50b7721f4be`
- 唯一验收 SHA `ca2e0cd1ee3028982e149a3361635c7788df1268`
- 证据提交 `b08f12d9d3e3120f4fcbc7acf78560de1aaa5735`

## Round 14 修正

- 卡片、About、Handoff 和同计划另一标签的库存更新共用时段选择状态。当前餐厅和需求版本相同时，日期时间及人数匹配的库存可重绑到新 offer ID。时段消失且库存仍有选项时，卡片要求显式重选；回退途中和页面重载均保留这一要求。
- Stop 发送投影里的来源读取 ID 与任务版本。刷新和换批可能沿用来源读取 ID，因此服务端同时核对发起事件版本。读轮已结束时返回最新投影；另一轮正在运行时返回 409 和 `actualVersion`，且该轮继续完成。
- 已接受的 About 问题只清理原计划的同文草稿。改写的新草稿、Plan B 输入及失败提问均保留。B1 已领取反馈在当前页面中切回计划时可继续作答，作答并重载仍只领取一次。Handoff 引文时间显示为 JST。
- 换批耗尽后隐藏历史新增数，仍保留真实修订移除理由。验收覆盖修订后出现 `3 new`，继续交付下一批，再耗尽并重载。
- 主循环的 Validator、Router、Reducer 使用同一次交付时间采样。终止回退受整单截止封顶，截止过后有无先前窗口都不再开短批。只剩已交付店和跨来源别名时，四次模型调用预留阻止嵌套调用，Reducer 接受 `MODEL_CALL` 收尾窗口。

冻结前以 Round 13 原实现对照 15 条新回归，14 条复现失败，保留改写草稿的控制用例通过。旧私有测试入口仅调整了调用形参以运行基线，所有 Round 14 文件随后按字节恢复。最终定向复跑 18/18，扩大回归 176/176。初次预检日志保留了测试拦截顺序和反馈字段期望值的诊断。 [基线对照](preflight/red.log) · [初次预检](preflight/focused.log) · [扩大回归](preflight/green.log) · [最终预检](preflight/final-preflight.log)

## 五道离线门禁

| 门禁 | 结果 | 秒 |
|---|---|---:|
| Typecheck | 通过 | 0.562 |
| Arch Guard | 通过，0 个违规依赖 | 0.197 |
| 默认回归 | 1780/1780 | 65.847 |
| Browser Fixture | G2 5/5、Chromium 453/453、G6 assembly 159/159 | 412.495 |
| Build | 通过 | 0.554 |

五项门禁使用同一净树冻结提交，退出码均为 0。Browser Fixture 的 G2 与 Chromium 合并摘要是 458/458，新增 Round 14 Chromium 回归 10/10、引擎回归 5/5。非浏览器门禁和独立视觉运行通过 OS 沙箱禁止非回环出站，浏览器总门禁走回环 Fixture，Replay 子进程自行启用 OS 断网。各入口使用环境白名单。 [门禁清单及耗时](gates/manifest.json) · [验收记录](acceptance.json)

## 视觉验收与逐张检查

- 正式视觉 **16/16**，390×844 为 7/7，1440×900 为 7/7，960×900 为 2/2，41 张截图，32.096 秒。 [正式清单](formal/manifest.json)
- Style 1 **6/6**，6 张，7.674 秒。逐尺寸断言状态紧随名称，按钮间距 12 px，各尺寸未发现非预期 console 或 HTTP 异常。 [Style 1 日志](style1-driver.log)
- 状态回归 **38/38**，25 张，43.401 秒。 [状态日志](states-driver.log)

| 截图 | 目检 |
|---|---|
| [About 刷新后重选](states/round14-about-slot-reselect.png) | 390×844，旧 19:30 已消失，替代时间未高亮，订位按钮禁用 |
| [换批耗尽并重载](states/round14-exhausted-revision.png) | 空态没有上一批的新增数，保留调整入口 |
| [切回后继续反馈](states/round14-feedback-after-return.png) | 已领取反馈回到原计划时可见，Yes、Not yet 和关闭图标可用 |

## 保护与停点

保护面比对通过。覆盖主工作区和 closeout 的 HEAD、状态、索引与跟踪内容，主 `.env` 摘要，以及 Prompt 15、搜索指纹和必填项判断的源文件。所有 1792 份启动前的 Unified 材料和 70 份走查材料通过 SHA-256 核对。期间出现的独立复核输出单列记录，未纳入本轮提交。历史 Mikkeller 快照说明、ADR-0038/0045/0049、来源提取和评分路径均与基线一致。引擎只变更时间采样、截止封顶及当批预留，Reducer 只变更 `MODEL_CALL` 窗口保护。112 份本轮产物已核对哈希。 [保护记录](protection-check.log) · [产物哈希](artifact-sha256.json) · [报告哈希](REPORT.sha256)

本轮为本地 Chromium Fixture 验收。浏览器、回环 HTTP/SSE 和 PGlite 已退出。没有运行 Live、连接真实 PostgreSQL、使用 4312 或进行真机验收；全部提交留在当前分支本地。
