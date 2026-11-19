# Unified Round 9 离线交付

2026-11-19。工作树 `/private/tmp/praxis-3c-unified`，分支 `codex/feat-web-photos-unified`，起始 HEAD `a3c475f8f9881726f71fd128ac7f83bd76e62edc`。

唯一验收源码 SHA **`1929ff88c5bb1849e4f9ac2a29e59c49de9fc318`**。原始日志、视觉记录和保护快照的证据提交 **`1ef669f15a2e46e6a2767a9f55b2bc33557aa399`**。五道门禁及三组 Chromium 视觉均在这一源码提交的净树上运行。报告及账本随后单独提交。

## 六项修复

| 边界 | 离线结果 |
|---|---|
| 短批次截止时间 | `readEndWindow` 过期 1 ms 且仍有未查工作时，真实 Reducer 进入 `NO_VERIFIED_RESULT`。同一时刻来源已穷尽且无待查事实或空位时，合法进入 `PRESENT_RESULTS`。在截止瞬间校验并路由，随后时钟前进 1 ms，Reducer 仍按同一交付时刻接受事件。 |
| 下一批跨来源同店 | 同名同址的 TableCheck 记录与已交付 Tabelog 门店判重。它不能填入待交付列表，同 ID 也继续被拒绝。还有来源时可继续搜索，耗尽时可经 Router 和 Reducer 正常结束。新店 B 可真实交付。PGlite 缓存测试交付三家新店，来源调用数为零，前一批常规刷新仍读取原三家。 |
| 解析失败后的 Saved | 两尺寸实际 HTTP/PGlite 分别验证先收藏再触发 `MODEL_FAILURE`。保留收藏名称，行禁用，既无箭头，也无 `No longer matches`。重新表述可恢复正常搜索。 |
| Stop 过期后的 Handoff | 有效期内可打开 Handoff。推进 Fixture 和浏览器时钟后，显示可用的安全来源链接，隐藏失效刷新入口。返回卡片时显示 `Availability expired`，预约按钮禁用。对两个控件主动派发点击，实际 `/refresh` 请求数为 0。 |
| 首次澄清回显 | 首次进入澄清时显示原始用户需求，后续只显示最新回复。`#messages` 始终只含当前提问，历史助手消息不显示。检索、结果和 Saved 状态隐藏回显。 |
| 390×844 停止提示 | 在滚动位置 0 验证 `#messages.bottom <= #workspace-composer.top`；重截并目检，完整文案可见。 |

修复前对照保留了截止、重复交付、Saved、澄清与遮挡的行为失败。过期刷新单独保留新 CSS，再以旧客户端复现可见的刷新入口，避免手机遮挡先触发而掩盖后续断言。开发定向回归 71/71（领域、协调器和持久化）及 7/7（Chromium）。 [修复前领域对照](preflight/red-domain.log) · [修复前界面对照](preflight/red-browser.log) · [过期刷新对照](preflight/red-stop-expiry-assertion.log)

## 离线门禁

| 门禁 | 实测结果 | 耗时 |
|---|---|---:|
| `npm run typecheck` | PASS | 0.552 s |
| `npm run arch:check` | PASS，0 个违规依赖 | 0.199 s |
| `npm test` | 1770/1770 PASS | 68.462 s |
| `npm run test:browser:fixture` | G2 5/5，Chromium 420/420，G6 assembly 159/159 | 395.737 s |
| `npm run build` | PASS | 0.548 s |

退出码均为 0。G2 与 Chromium 的合计摘要为 425/425，Round 4 浏览器文件已通过。非浏览器门禁和视觉进程由操作系统拒绝非本机出站；浏览器总门禁使用离线 Fixture 和录制输入，Replay 子进程自身启用 OS 断外网。所有运行均使用环境白名单。 [五门禁原始日志与清单](gates/manifest.json) · [机器验收记录](acceptance.json)

## 视觉验收

- 正式 Chromium HTTP/SSE/PGlite Fixture **16/16**，32.03 秒，390×844 七项、1440×900 七项、960×900 两项，共 41 张截图。逐张检查截图并放大关键场景。 [正式清单](formal/manifest.json) · [移动卡片](formal/mobile-google-short-credit-address.png) · [桌面 About](formal/desktop-google-about.png) · [过渡宽度看图器](formal/breakpoint-google-long-cover-viewer.png)
- Style 1 **6/6**，7.74 秒。六张逐一目检，六组间距均为 12 px。卡片隐藏软条件 `Unverified`，About 保留完整证据，卡片继续显示未核实的硬条件。六组非预期 console/network 错误均为 0。 [Style 1 日志](style1-driver.log) · [390×844 有空位](style1/style1-390x844-available.png) · [390×844 未查空位](style1/style1-390x844-not-checked.png) · [768×1024 有空位](style1/style1-768x1024-available.png) · [768×1024 未查空位](style1/style1-768x1024-not-checked.png) · [1440×900 有空位](style1/style1-1440x900-available.png) · [1440×900 未查空位](style1/style1-1440x900-not-checked.png)
- 新增态回归 **5/5**，6.01 秒，五张逐一目检。 [停止后卡片](states/stopped-ready-card.png) · [首次澄清](states/clarification-first.png) · [继续澄清](states/clarification-reply.png) · [有卡检索](states/has-card-searching.png) · [侧栏](states/sidebar-order-and-status.png) · [三组视觉执行清单](visual-driver.json)

目检侧栏截图时，1440×900 画面底部的卡片翻页控件部分位于固定输入栏后方。该图与 Round 8 的对应原件 SHA-256 一致。此处记录既有桌面布局现象，本轮修复点为移动端停止提示。 [侧栏截图](states/sidebar-order-and-status.png)

## 保护与未测

通过前后哈希比对核实主工作区和 closeout 的 HEAD、Git 状态、已跟踪差异及索引内容，核实主 `.env`、Prompt 15 所在文件和搜索指纹所在文件。既有批次文件与走查日志均一致，Round 6、7、8 单列在保护核对中。当前报告和校验索引另有校验条目。 [保护基线](protection-baseline.json) · [保护核对](protection-check.log) · [证据哈希](artifact-sha256.json) · [报告及索引校验](REPORT.sha256)

浏览器和服务仅使用临时回环端口，资源已关闭。未触碰 4312。Live、真实 PostgreSQL、独立 Live S0、整单 Replay 和真机浏览器未运行。测试覆盖本地 Fixture 合同，未改变评分器。所有提交留在本地分支，未推送或合入 `main`。交付后等待确认。
