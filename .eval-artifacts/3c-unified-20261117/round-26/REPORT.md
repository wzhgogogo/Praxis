# Round 26 离线修复与五门禁验收报告

- **工作区**：`/private/tmp/praxis-3c-unified`（`HEAD` 源码冻结于 `6a5f782979054c3d04e01655b73e10cb1ef1c694`，分支 `codex/feat-web-photos-unified`）
- **基线提交**：`720d1b8a1`（Round 25 + Authorized 14-path Recovery）
- **源码树 SHA (`src/`)**：`34b625c0810d5b0bb780bd8902da8d3c6ff889bb`
- **环境隔离**：未加载 `.env`（`envLoaded: false`）；未改动主仓库 `/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing`、`main` 分支及主 `.env`；未启动 `4312` 端口；未推送远端。

## 1. 修复内容（对应 Round 25 独立评审 5 项 P2）

| 编号 | 问题摘要 | 修复位置与核心改动 | 新增/更新回归用例 |
|---|---|---|---|
| **V3** | 隐藏旧表导致问答引文与事实错配 | 在 [`observe-page-images.ts`](../../../src/infrastructure/browser/observe-page-images.ts) 导出共用非克隆序列化 `observeVisibleHtml`（过滤 `script,style,template,noscript,[hidden],[aria-hidden="true"]`、`display:none`、`visibility:hidden`）；[`local-playwright-chromium.ts`](../../../src/infrastructure/browser/local-playwright-chromium.ts) 与 [`cloudflare-browser-session.ts`](../../../src/infrastructure/browser/cloudflare-browser-session.ts) 统一采集 `snapshot.visibleHtml`；[`model-page-question.ts`](../../../src/integrations/restaurant-facts/model-page-question.ts) 在 `sourceRowProof()` 中取消原始 `html` 回退，缺失 `visibleHtml` 时 fail-closed 返回 `undefined`，并要求 `header` 与 `value` 在 `snapshot.text` 中连续视觉行相邻。 | `Round26 V3 sourceRowProof fails closed when visibleHtml is absent or visible text is non-adjacent`；`Round26 V3 CloudflareBrowserSession snapshot drops CSS-hidden duplicate table rows` |
| **R1** | 已取消旧问答工作器收尾存储异常误杀已提交新搜索 | [`persistent-restaurant-agent.ts`](../../../src/application/persistent-restaurant-agent.ts) 将 `handle` 传入 `recordUnexpectedRunFailure(record, handle, error)`：前置校验 `handle.controller.signal.aborted`、读取前后 `currentRead(record.rootTaskId, true)` 与 `restaurantInvestigationReadRunId !== handle.readRunId`；带 `handle.questionRequestId` 时仅以 `PAGE_QUESTION_COMPLETED(UNVERIFIED / SOURCE_READ_FAILED)` 结算未结束的对应问答（绝不写 `AGENT_LOOP_TERMINATED`），并吞吐 `StaleTaskVersionError`。 | `Round26 R1 cancelled question worker storage fault cannot fail committed successor read` |
| **M2** | SSE 重连先于迟到 `HEAD 503` 返回时漏掉相册恢复 | [`transport.ts`](../../../src/web/browser/transport.ts) 在 `openStream` 跟踪 `opened` 与 `reconnecting`，首次建连不触发恢复，真实重连及建连后的 `'open'` 触发 `resumePhotos()`；[`photos.ts`](../../../src/web/browser/photos.ts) 新增 `PhotoEntry.resumeAfterCheck`，在 `entry.loading` 或 `entry.checking.size` 进行中收到恢复信号时登记并在 `fail()` `finally` / `renderPhotos()` 列表 `.finally()` 触发有界重试。 | `Round26 M2 390 reconnect before late HEAD 503 recovers photo 2 without leaving About` |
| **R3** | `target.query` 句末标点导致已删 `serves beer` 继续外发 Google 搜索 | [`open-ended-target.ts`](../../../src/domains/restaurant/open-ended-target.ts) 为 `served` 先行断言及逗号/句末标点清理补充 `[;.!?。！？:]` / `[.!?。！？]` 边界。 | `google-places-filter-regression.test.ts` 中 `serves beer` 句末 `.` / `!` / `?` 出站回归 |
| **R4** | `/` 分隔否定子句改变筛选结果 | [`read-grounding.ts`](../../../src/domains/restaurant/read-grounding.ts) 移除 `usableRestaurant()` 中否定子句分隔正则里的 `\/`。 | `google-places-filter-regression.test.ts` 中 `/` 与 `and`、`want` 与 `I want` 筛选回归 |

## 2. 冻结提交 `6a5f782979054c3d04e01655b73e10cb1ef1c694` 验证结果

| 门禁 / 检查项 | 命令 | 结果与观测数值 | 证据日志 |
|---|---|---|---|
| **Typecheck** | `npm run typecheck` | PASS（`exitCode: 0`） | [typecheck.log](gates/typecheck.log) |
| **Arch Check** | `npm run arch:check` | PASS（`exitCode: 0`，`0` forbidden source dependencies） | [arch-check.log](gates/arch-check.log) |
| **Build** | `npm run build` | PASS（`exitCode: 0`） | [build.log](gates/build.log) |
| **默认测试集** | `npm test` | PASS，`1941 / 1941`（`fail 0`, `78611.576ms`，`BypassSandbox: true`） | [test.log](gates/test.log) |
| **浏览器 Fixture 门禁** | `npm run test:browser:fixture` | PASS（`exitCode: 0`，`BypassSandbox: true`）：G2 `5 / 5` (`24988.660542ms`)、Chromium `578 / 578` (`423184.548417ms`)（合计 `583 / 583`）、G6 assembly `159 / 159` (`40212.092083ms`) | [browser-fixture.log](gates/browser-fixture.log) |
| **C1 编译态 CDP 隔离** | `PRAXIS_CDP_DIST=1 node --import tsx --test src/harness/browser/cloudflare-cdp-isolation.test.ts` | PASS，`4 / 4`（`13522.6105ms`，`BypassSandbox: true`） | [c1-built.log](c1-built.log) |
| **前端构建产物一致性** | `round26_verify.mts` 比对源与构建输出 | PASS，`19 / 19` JS 资源 SHA256 一致，`htmlMatches: true` | [build-assets.json](build-assets.json) |
| **汇总清单** | — | — | [manifest.json](gates/manifest.json) |

## 3. 历史证据与工作区保护核查

见 [protection-verification.json](protection-verification.json)：

- 历史基线（沿用 `round-25/protection-verification.json` 范围 `12,638` 项）：`12,501 / 12,638` 项 SHA256 一致；`0` 个现存文件被修改（`historicalExistingChanged: 0`）；`0` 个新增缺失（`unexpectedMissing: []`）；缺失项仍精确为凌晨 `/private/tmp` 清理损失的早期 `round-9/10/11` 未跟踪原件 `137` 项（详见 [remaining-missing.json](../round-25/recovery-14-20261124/remaining-missing.json)）。
- Round 25 归档（`698 / 698`）与 Round 25 14 路径恢复归档（`44 / 44`）哈希全部未变（`0` 变更）。
- `mainWorkspaceUnchanged: true`、`mainEnvUnchanged: true`、`sparseUnchanged: true`。

## 4. `NOT_EVALUATED` 声明与未覆盖边界

以下范围在本轮均**未执行**（`NOT_EVALUATED`），不得由上述 Mock/Fixture 结果外推替代：

1. Live 外部依赖（Google Maps、DeepSeek、真实预约网站写入或只读）及真实 PostgreSQL；
2. 远端 Cloudflare Browser Rendering CDP 服务；
3. 真机 iOS / Android 物理键盘弹出视口自适应及真机单指/双指缩放拖拽交互；
4. 独立 `round-25` 视觉复核脚本与独立评审目录（[`round-25-independent-review-PcoqWu`](../round-25-independent-review-PcoqWu/REPORT.md)）中的外部探索脚本；
5. 本地服务端口 `4312` 人工/桌面/真机端到端走查。
