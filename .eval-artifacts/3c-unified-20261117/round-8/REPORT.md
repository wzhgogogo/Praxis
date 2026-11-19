# Round 8 离线交付

2026-11-19。工作树 `/private/tmp/praxis-3c-unified`，分支 `codex/feat-web-photos-unified`。初始 HEAD `49f7ef6e9d57bc6e2579f424d3459da7c8f387ea`。

唯一验收源码 SHA 为 **`1e191c0bca458887bba653208341976681685f44`**。原始门禁、截图及保护核对的证据提交为 **`3467aeb840121da4d0d1d2a46528014957b95e45`**。报告和历史索引另行提交，以便在此记录真实证据提交 SHA。正式门禁和截图均来自净树上的冻结 SHA。

## 九项行为

| 项目 | 实测结果 |
|---|---|
| 首轮短批次 | 从同一状态真实派发收藏，再让协调器在模型预算为零时收尾。1 家与 2 家均经首轮短批次窗口进入 `PRESENT_RESULTS`。已交付过候选的对照不会开启这个窗口。 |
| 预算收尾上限 | 5 家首轮合格候选交付前 3 家。已有 3 家交付且另有 5 家合格时，只交付 3 家未展示的候选。收尾沿用 Validator、Router 与 Reducer，模型边界设置为出现调用即失败。 |
| 卡片与 Stop | 真实回环 SSE 保留 Stop 后仍合格的卡片。About 可打开并返回，收藏处于禁用态，直接触发点击也没有 POST。连续投影使闲置卡从 A 切 B，并清空前一家的时段选择。无结果或失败投影中旧记录仍在服务器候选池时，旧卡隐藏，只显示空状态。 |
| Google 主类型 | 拒绝酒店、商场、百货、艺术馆、宴会场地和零售主类，即使同时带次级餐饮标签。放行明确的餐饮、酒吧、brewpub 和面包店主类。无主类时保留旧类型兜底。 |
| 侧栏 | 实际 HTTP 核对初始与更新后排序，实际本地 SSE 将更新的 Case 移到首位且保留原 DOM 节点及焦点。受控初始列表验证相同时间按 Case ID 升序和六类状态文案。真实 Stop 同时验证服务端 stopped 投影。 |
| 澄清回复 | 从浏览器发送第二条用户消息，受控响应保持 NEEDS_INPUT。回复以独立节点显示，当前提问仍独占 `#messages`。历史 ASSISTANT 文本不显示，忙碌、结果和 Saved 视图隐藏回显。 |
| 条件展示 | 三尺寸、两种空位状态均验证软且未查条件在正面隐藏、在 About 保留。另验证硬且未查条件仍在正面显示，已确认与不匹配行保持可见。 |
| 进度及部分失败 | 真实中途读取显示 `Looking for more options · 1 checked` 和紧邻的 `Stop searching`。没有卡片时继续显示 `Stop`。部分来源失败提示只在走到批次末尾出现。 |
| 弹窗拦截 | 模拟 `window.open` 返回 null。提示可见，预约外跳 POST 为 0，PGlite 外跳记录为 0，`:return` 未写入。 |

已展示但空位过期的卡片仍分类为可浏览结果，可走现有刷新路径。为满足终态旧卡清理要求，语义失败时保留重试提示及输入文字，隐藏旧卡。普通读取失败的提示使用空状态面板，澄清区继续只显示当前提问。Round 4 相关浏览器回归通过。

## 五门禁

| 门禁 | 结果 | 耗时 |
|---|---|---:|
| Typecheck | PASS | 0.535s |
| 架构检查 | PASS，0 个禁止依赖 | 0.199s |
| 默认回归 | 1765/1765 PASS | 63.975s |
| Browser Fixture | G2 5/5，Chromium 420/420，G6 assembly 159/159 | 392.012s |
| Build | PASS | 0.542s |

退出码均为 0。Chromium 与 G2 的合计摘要为 425/425，G6 单列。每个门禁均比对前后净树。默认与其他非浏览器门禁在 OS 断外网环境执行。浏览器门禁保留 Replay 子进程自身的隔离，Fixture 使用本地或录制输入。所有正式步骤使用环境白名单。 [门禁清单](gates/manifest.json)

冻结前，浏览器相关回归 91/91，定向 Domain/Coordinator 回归 67/67。并行开发预检有一次 Node 24.4.1/V8 Wasm 原生崩溃，首个原始日志和受影响文件独立重跑 9/9 的日志均保留。随后顺序运行的正式默认回归完整通过。 [原始开发预检](development-npm-test.log) · [原生崩溃复查](v8-crash-recheck.log)

## 视觉与目检

正式本地 Chromium HTTP/SSE/PGlite Fixture **16/16**，31.81s，生成 41 张截图。390×844 七项、1440×900 七项、960×900 两项。保留 G1、第二时段 B1、预约外跳的本地持久化及非本机导航拦截证据。 [正式视觉清单](formal/manifest.json)

另在三个尺寸各抽查一张正式截图，分别核对卡片、About 和大图查看器。 [手机版卡片](formal/mobile-google-short-credit-address.png) · [桌面 About](formal/desktop-google-about.png) · [960px 查看器](formal/breakpoint-google-long-cover-viewer.png)

风格 1 **6/6**，7.68s。均实测 12px，六张已逐张目检。JSON 记录正面和 About 文案、硬条件保留及 0 个非预期 console/network 错误。首次无会话 401 和浏览器取消导航请求属于既有预期行为。 [风格 1 日志](style1-driver.log)

| 尺寸 | 有空位 | 未查空位 |
|---|---|---|
| 390×844 | [截图](style1/style1-390x844-available.png) | [截图](style1/style1-390x844-not-checked.png) |
| 768×1024 | [截图](style1/style1-768x1024-available.png) | [截图](style1/style1-768x1024-not-checked.png) |
| 1440×900 | [截图](style1/style1-1440x900-available.png) | [截图](style1/style1-1440x900-not-checked.png) |

新增态的五条浏览器用例通过，四张截图已逐张目检。澄清回复与当前提问各自可读，进度计数与停止按钮同组，侧栏按活动倒序且所有状态均可见。 [澄清回复](states/clarification-reply.png) · [边看边搜](states/has-card-searching.png) · [停止后卡片](states/stopped-ready-card.png) · [侧栏](states/sidebar-order-and-status.png)

目检另见一处布局限制。390×844 的停止态截图中，底部 `Search stopped.` 文案部分位于固定输入栏后方。卡片、About 和禁用的收藏按钮都可见。 [停止态截图](states/stopped-ready-card.png)

## 保护与未测

比较主工作区及 closeout 的 HEAD、状态、已跟踪差异与索引哈希，主 `.env` 比对文件字节哈希。887 个既有证据文件和 30 个走查文件哈希一致，含 Round 6 的 124 个和 Round 7 的 91 个文件。Prompt 15 源码整文件及搜索指纹所在生产文件均一致，Google wire 实现无差异。 [保护核对](protection-check.log) · [证据文件哈希](artifact-sha256.json)

本轮用例绑定临时回环端口，未访问或操作 4312，资源已关闭。真实 PostgreSQL、Live、独立 Live S0、真机浏览器及整单 Replay 未运行。连续多日和非餐厅封锁后续按 3E 处理。两次本地证据提交均在同一分支，未推送或合并主线。交付后等待确认。
