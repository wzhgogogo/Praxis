# Unified Round 11 离线交付

2026-11-19。工作树 `/private/tmp/praxis-3c-unified`，分支 `codex/feat-web-photos-unified`，基线 `f06af76bc5433857a7528d244c7f82d78d986d6c`。

唯一冻结验收 SHA **`3e2d54a4d069fa1c82be55d83a50a53a321c2de6`**。原始日志、截图和保护快照的证据提交 **`26771012856880400f8824489baee3c8c6d0090a`**。门禁及视觉均从同一净树源码执行，报告和账本随后单独提交。

## 五项边界

| 场景 | 离线实测 |
|---|---|
| 时段失效 | 卡片和 Handoff 两入口都验证 19:30 消失后，19:00 仍显示可用且未选中，预约按钮保持禁用。选中 19:00 才能继续，链接绑定该时段。首次默认选择和刷新成功保留原时段均通过。若一次刷新未取得任何新鲜时段，仍可按原明确时段重试。390×844 提示自动进入可读区域。 |
| 409 冲突 | 响应保留原文案并携带 `actualVersion`。完成 SSE 已追上版本时零额外 Case GET。只收到中间版并关闭 EventSource 时，恰好一次 Case GET。两条均恢复到 1 of 3、保留草稿并使错误提示进入可读区域。503 对照未新增 GET。 |
| 批次差异 | 原三家对新人数仍有合格库存时，`revisionDiff.removed` 为空，卡片没有失配计数，Find more 正常交付这三家。真实失配原因的既有回归通过。 |
| 迟到提交 | 成功响应清理原计划中仍与已发送文字相同的草稿。返回原计划后输入的新草稿保持，原文字在持久化会话中只有一条。 |
| 来源标签页 | 回环 201 已落库后切换到计划 B，来源页仍导航到已返回的 URL。Chromium context 截获该导航并提供离线 HTML。PGlite 确认仅一条计划 A 的 19:30 外跳记录，A 的 `:return` 及反馈链路成功，B 保持活动状态。 |

冻结前组合预检的中间版本用例在代理 EventSource 的测试注入阶段超时。改用关闭浏览器实际已建立的 EventSource 后，两条定向 409 都通过。 [组合预检](preflight/preflight.log) · [409 定向复核](preflight/targeted.log)

## 五道离线门禁

| 门禁 | 结果 | 耗时 |
|---|---|---:|
| Typecheck | PASS | 0.571 秒 |
| 架构检查 | PASS，0 个违规依赖 | 0.250 秒 |
| 默认回归 | 1772/1772 | 70.052 秒 |
| Browser Fixture | G2 5/5、Chromium 437/437、G6 assembly 159/159 | 411.211 秒 |
| Build | PASS | 0.578 秒 |

五门禁退出码均为 0。浏览器入口的 G2 和 Chromium 合计 442/442，G6 单列。环境采用白名单。非浏览器门禁和视觉通过 OS 阻止非本机出站，Browser Fixture 使用本地及录制输入，Replay 子进程自行断外网。 [原始门禁清单](gates/manifest.json) · [机器验收记录](acceptance.json)

## 视觉验收和目检

- 正式 Chromium HTTP/SSE/PGlite Fixture **16/16**，33.19 秒，41 张截图。390×844 和 1440×900 各七项，960×900 两项。 [正式清单](formal/manifest.json)
- Style 1 **6/6**，8.24 秒。六组间距均为 12 px，六组非预期 console/network 错误为 0。 [Style 1 日志](style1-driver.log)
- 状态 **22/22**，23.19 秒，15 张截图。 [390×844 卡片重选](states/round11-card-reselect.png) · [390×844 交接页返回](states/round10-handoff-reselect.png) · [1440×900 冲突恢复](states/round11-conflict-intermediate.png) · [仍合格的上一批](states/round11-revision-no-removals.png) · [状态日志](states-driver.log)

已逐张核对正式、Style 1 和状态截图。390×844 的两种重选态均显示未选中的 19:00、禁用的预约按钮及输入栏上方完整提示。1440×900 的两种冲突恢复态均可同时读到 1 of 3、错误提示及草稿，无需手动滚动。无错误提示时桌面侧栏截图里的翻页控件仍有既有遮挡，该图与 Round 10 对应原件 SHA-256 相同。 [侧栏回归图](states/sidebar-order-and-status.png)

## 保护与未测

主工作区与 closeout 的 HEAD、Git 状态、索引及差异，主 `.env`、Prompt 15、搜索指纹和 `missingBlockingFields()` 均通过前后比对。Round 6 至 Round 10 证据、走查日志及 Round 9/10 复核目录逐文件哈希一致。101 份本轮产物逐项校验，报告和索引单列校验。 [保护记录](protection-check.log) · [证据哈希](artifact-sha256.json) · [报告校验](REPORT.sha256)

本地 Chromium、回环服务和 PGlite 已退出。未运行 Live、连接真实 PostgreSQL、使用 4312、执行新整单 Replay 或真机浏览器验收。Domain、Agent Loop、Reducer 及评估标准保持原样。提交留在本地分支，未推送或合入 `main`。停在离线验收完成处，等待确认。
