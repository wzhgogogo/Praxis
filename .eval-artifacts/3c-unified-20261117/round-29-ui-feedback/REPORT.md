# Round 29 定向 UI 与预约反馈离线验收

工作树为 `codex/feat-web-photos-unified`。起点 `5b43041e7`，冻结 `f800ae00d9109a66831acf75297ed88cb46f09be`，源码树 `44461a9b688c052417fc6920c46c0df2403709af`。

## 行为

- About 的 Refresh 对同一 URL、同一归一化引文集合与同一组条款保留最新读取。不同价格或条款的两次读取各有出处。普通条件和价格直接显示出处行。取消政策、包间等 `SOURCE_TEXT` 原文在归一化后与摘要不同且至少 40 字符时可展开。
- 午餐和晚餐价位按已有结构化预算证据显示。保留显式套餐价格、取消和未到店条款。旧双快照的套餐金额使用已被预算条件引用的结构化价格证据。旧录制菜单里存在一笔限定七月早到的 ¥3,800，回归确认它没有变成通用套餐价。原始菜单仍保存在 `currentFactEvidence`。主卡片的跨源分类、Q&A 和 Handoff 的 Source 各通过原有对照。
- 两次明确 Continue 后返回，同一计划可分别领取两次反馈。上一条未答也能显示新的提示。两次离开均发生在返回前时，持久化领取仅处理最新记录。并发领取、重载、重启与异账号入口都经过真实本地 HTTP 和 PGlite 验证。反馈为 `USER_REPORTED`，保持按离开记录归属。[ADR-0054](../../../docs/decisions/0054-per-departure-booking-feedback-prompt.md)
- Stop 清除上一次失败留下的提示并保留草稿。Handoff 因条件变更退出时，选时确认由可见卡片显示。无卡片时不挂旧提示。两种视口都核对了 `#messages` 与提示条左右边界、8px 间距及样式。提示条样式截图使用真实停止状态旁的受控 alert。

## 冻结门禁

| 门禁 | 结果 | 耗时 |
| --- | --- | ---: |
| typecheck | 通过 | 0.692 秒 |
| arch-check | 通过，0 个违规依赖 | 0.209 秒 |
| build | 通过 | 0.606 秒 |
| test | 1,995/1,995 | 88.076 秒 |
| browser-fixture | G2 5/5、Chromium 609/609、G6 assembly 159/159 | 509.231 秒 |
| c1-built | 4/4 | 15.916 秒 |
| build-assets | 19 个 JS 资产及 HTML/CSS 一致 | 0.204 秒 |
| browser-graph | 18 个严格 TypeScript 模块，0 环 | 0.046 秒 |
| protection | 本轮保护比对通过 | 2.871 秒 |

[冻结记录](freeze.json) · [门禁清单](gates/manifest.json) · [截图与目检记录](visual-inspection.json) · [产物哈希](artifact-sha256.json)

390×844 与 1440×900 共 16 张截图通过目检。此前查看过的部分截图与最终产物逐字节相同。[手机 About](states/round29-390-about-refresh.png) · [桌面双快照](states/round29-1440-about-changed.png) · [第二次返回反馈](states/round29-390-second-feedback.png) · [Stop 后](states/round29-390-stop-cleared.png)

## 反例与保护

修复前两种视口均复现了 Refresh 重复来源、第二次返回无反馈和 Stop 残留提示。无卡片时的旧交接提示也已复现。[原始反例](preflight/red-browser.log)

首个冻结 `4cbc0a5f2` 因限定套餐价格的复核中止浏览器门禁。第二个冻结 `1a1ced69f` 完成了浏览器测试，七条旧断言仍依赖移除的分类正文或重复提示。更新了这些断言和滚动夹具，定向对照 10/10。一次预检的 Node/V8 原生崩溃已保留，相关用例复跑通过。[首个冻结](failures/4cbc0a5f2-price-qualification/gates/manifest.json) · [旧断言失败](failures/1a1ced69f-stale-ui-expectations/gates/browser-fixture.log) · [定向复跑](preflight/stale-ui-green.log) · [原生崩溃](preflight/qualified-price.log)

保护比对覆盖 15,210 个历史路径，11,686 份现存文件匹配原哈希。主目录、主 .env、closeout、稀疏规则、语义模型和日期编译器通过比对。已知缺件为 652 项受跟踪及 2,872 + 137 份未跟踪原件，历史完整性仍为 `BLOCKED_BY_MISSING_HISTORICAL_ORIGINALS`。[保护比对](protection-verification.json)

本轮为本地 Chromium 与内嵌 PGlite 验收。真实 PostgreSQL、Live 和真机行为未评。仅本地提交。
