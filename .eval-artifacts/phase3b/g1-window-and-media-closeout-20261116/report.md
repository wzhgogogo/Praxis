# G1 本轮文字窗口、媒体忙态与包间引用收口

**完成离线收口，停止待复核；不推送、不合 main、不启动 D8 Live。**

本地分支：`codex/fix-g1-body-and-query-selection`。最终净树复核提交：`dbc2d9c55bb9dd759a17551cbe9c11af6b1073b0`；源码/测试提交：`a5c4597b0031881e8e765888451a22785a32fb98`。基线 `6adbeeb287d7731183fd2c5ba48538a56d24e49d`。

## 红→绿与本次结果

| 项目 | 未修版独立红灯 | 最终结果 |
|---|---|---|
| 旧 visibleTextChanging=true 恢复 | LOCAL / Cloudflare 前置 wait 超时且正文确实变化，静止后仍被旧标志误拒 | 两种会话静止 500ms 后 ANSWERED；当前快照 changing=false、G1 SETTLED。继续变化（含先超时）仍 PENDING / INCOMPLETE_PAGE、0 问答调用；静态显式当前变化也拒答 |
| 导航后 previous URL | reobserve 收到 about:blank | 导航后重新获取源页快照；只有同 sourceUrl 复用；既有刷新 waits/snapshots 契约保留 |
| 带图条款忙态 | 图片/背景表面 + 标题 + 未压字加载器，ARIA busy / progressbar / skeleton 共 6 个反例漏拦 | 6 项均保留 contentBusySelectors，INCOMPLETE_PAGE、0 问答调用 |
| 真实包间原文 | 新正例扩大原店名引用链路的验证范围 | 完整 sourceDocuments 中定位原句，逐字 citation → ANSWERED；原不透明地图与 8 个淡出图片骨架仍不阻断，通用 busySelectors 9/12 不变 |

真实引用：**和モダンな店内には個室も備え、接待や会食、記念日など幅広いシーンでご利用いただけます。**

产品仅改 5 文件：LOCAL、Cloudflare 的 snapshot 文字端点刷新；executor 的 G1 窗口判定；native-source-facts 的同 URL previous；playwright-browser-controls 的 ARIA 保护与独立预览结构/几何判定。没有用私有类名、testid 或固定英文文案。500ms G1 窗口、Guard 3 秒规则、生产时限、S0/评价器、Prompt/Skill/Wire、原生 value 与选项回读边界不变。

## 同一 SHA 净树五门禁

| 命令 | 结果 |
|---|---|
| npm run typecheck | PASS |
| npm run arch:check | PASS，0 禁止依赖 |
| npm test | PASS，1658/1658，0 fail / 0 skip |
| npm run build | PASS |
| npm run test:browser:fixture | PASS，G2/Chromium 325/325 + G6 159/159，0 fail / 0 skip |

本次 G1 Chromium 22 项全绿，定向单元/刷新 25 项通过。原始门禁见 `gate-1.log`～`gate-5.log`、`gates.json`。有效未修失败见 `red-baseline.json`、`chromium-baseline-red.log`、`chromium-background-baseline-red.log`、`unit-baseline-previous-url-red.log`。中间构造回答用日文回答英文问题，曾被既有语言校验正确拒绝；只修正了构造回答语言，原日文引用及产品语言校验均未改，记录保留在 `chromium-green.log`。

## 证据边界与保护

沿用真实 Nakamata snapshot-0005 + 原 CSS，新增文字变化、带图条款卡片与问答模型为明确的 LOCAL_CONSTRUCTION；不是完整网站 Replay，不作线上库存、真实模型语义或 D8 Live 交付结论。

`protection-comparison.json`：主工作区 HEAD/索引/草稿/状态/131 个未跟踪文件、22 份历史账本、分流配置哈希完全一致。上一批次 53 份证据（含原“未合入、0 Live”报告）逐字节未变；旧 source review 也未改。本轮源码分支新增 `.eval-artifacts/` 文件 **0**。文档最新条目已明确“待以本次复核提交整合 main；已完成离线与本地 Chromium 验证，D8 线上 Live 待冻结主线 SHA 后验证”，更早历史标签原样保留。

**本轮实际消耗：0 Live / 0 网站 GET / 0 真实模型调用。** 新证据均在当前独立目录，本地保存后停止。
