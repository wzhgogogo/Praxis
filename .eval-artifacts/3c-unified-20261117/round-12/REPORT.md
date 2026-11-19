# Unified Round 12 离线交付

2026-11-19。工作树 `/private/tmp/praxis-3c-unified`，分支 `codex/feat-web-photos-unified`，基线 `9cb56dede15e5c6cd1aefb64181416485e523d19`。

唯一冻结验收 SHA **`0d354f1e85cb95992dc63cbe05241960b78ea2b5`**。证据提交 **`6f4546dc7aab2c33dec784ae7a85ac4cc16cd12e`**。五道门禁与三组视觉使用同一净树提交，报告及账本随后提交。最终归档提交修正了预检日志拷贝路径，补齐三份 Round 12 日志并更新哈希索引。

## 换批就绪与全案资格

- 持久化应用先交付 3 家，再交付 3 家。第三次换批时所有来源已穷尽，剩余合格记录只是已交付门店的跨来源别名。真实事件进入 `READ_ENDED_NO_VERIFIED_RESULT`，Case 为 `NO_VERIFIED_RESULT`，界面状态为 `NO_QUALIFIED_RESULTS`。就绪列表为空，上一批展示 ID 和条件状态不出现在终态。
- 检索中及中途 Stop 的真实投影只保留两家尚未交付的新店，排除已交付餐厅和其别名。
- 从 HTTP 读取终态及刷新后的 Case，两个投影的 `bookingHandoffs` 都为空。Chromium 确认结果卡与预约按钮隐藏，刷新后仍为空态。已收藏的旧店保留为只读条目且无失配标签。
- 全案合格集合继续用于 Saved 和批次差异，保留原有人数调整、后续批次及真实失配的回归。旧单测的“部分来源失败但有结果”正例现在使用 `PRESENT_RESULTS`，原来对状态和提示的断言保留。

四条新回归在基线投影上都复现失败，修复后定向回归 50/50。 [基线对照](preflight/red.log) · [首次预检](preflight/preflight-first.log) · [定向回归](preflight/targeted.log)

## 五道离线门禁

| 门禁 | 结果 | 耗时 |
|---|---|---:|
| Typecheck | PASS | 0.613 秒 |
| 架构检查 | PASS，0 个违规依赖 | 0.202 秒 |
| 默认回归 | 1775/1775 | 65.251 秒 |
| Browser Fixture | G2 5/5、Chromium 438/438、G6 assembly 159/159 | 399.049 秒 |
| Build | PASS | 0.534 秒 |

全量复跑的退出码均为 0。第一次默认门禁在 Node 24.4.1 的 V8 Wasm 代码回收处原生崩溃，保留原日志。受影响文件在同一 SHA 单独复跑 8/8，随后用相同命令全量复跑。 [首次门禁](gates-first-attempt/manifest.json) · [原生崩溃日志](gates-first-attempt/test.log) · [独立复查](v8-recheck.log)

G2 与 Chromium 合并摘要为 443/443，G6 单列。子进程使用环境白名单。非浏览器门禁与视觉在 OS 层禁止非本机出站，浏览器总门禁使用回环 Fixture 和录制输入，Replay 子进程自行断外网。 [原始日志清单](gates/manifest.json) · [机器验收记录](acceptance.json)

## 视觉与保护

- 正式三尺寸 Chromium Fixture **16/16**，31.64 秒，41 张截图。 [正式清单](formal/manifest.json)
- Style 1 **6/6**，7.76 秒。六组间距均为 12 px，非预期 console/network 错误均为 0。 [Style 1 日志](style1-driver.log)
- 状态回归 **23/23**，23.28 秒，16 张截图。 [刷新后耗尽空态](states/round12-exhausted-batch-reload.png) · [状态日志](states-driver.log)

已目检三组截图。新增 390×844 截图取自第三批耗尽后实际刷新，空态和 Adjust 可见，Saved 1 保留，餐厅卡片、翻页和预约按钮均不显示。桌面侧栏回归图与 Round 11 对应原件哈希一致。 [侧栏回归图](states/sidebar-order-and-status.png)

主工作区、主 `.env`、closeout、Prompt 15、搜索指纹和 `missingBlockingFields()` 通过前后比对。Round 6 至 Round 11 冻结证据、走查和复核目录逐文件哈希一致。本轮 107 份原始产物哈希及报告校验均通过。Domain、Agent Loop、Reducer 和前端源码保持原样。 [保护记录](protection-check.log) · [证据哈希](artifact-sha256.json) · [报告校验](REPORT.sha256)

浏览器、回环服务和 PGlite 已退出。未运行 Live、连接真实 PostgreSQL、使用 4312、运行独立整单 Replay 或真机浏览器验收。所有提交留在本地分支，未推送或合入 `main`。停在离线验收完成处，等待确认。
