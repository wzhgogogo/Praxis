# P2-1c → Checkpoint C：离线集成验收

- Evidence status: exposed development / current integration；不是 Clean Baseline，不是新 Live。
- 目标：`codex/integration-checkpoint-c`。先 pull `8ecfcfc`，合入已复核 `ddfdedd`；源码与本轮配置冻结提交 **`d6d989bb8d0ec9c9372e62c7d088989274649d48`**，两者均为该合并提交的父节点。在独立临时 worktree 完成，不改其他会话检出或来源分支，不 force-push。
- 五处日志／状态文档冲突保留两边正文，源码自动合并；原日志段落、两边命名测试及旧批次 76 份已跟踪证据均核对保留。旧报告中的原版本和结果继续保留为历史记录。

## 1. 版本和产品合同

Restaurant State **18**、TaskDefinition **16**、Browser Prompt **17**；Context15、Agent Prompt27、Browser action schema11、Evaluator30/rubric26 保持。保留 P2-3 的 `priceFacts`、`presentedResults.conditionStates`、价格 commercialNotes，以及 P2-1c 的 `discoveryPlan.regionReferenceRead`、一次消费和跨 run／请求隔离。未添加兼容层、数据库迁移或 reset。

历史失效依据是两分支均叫 State17 但字段不同。先用既有持久化恢复测试固定18预期，修前得到 `17 != 18`；修后同一测试同时验证价格与提前读取批次恢复。首次误选测试没有覆盖该断言，单独保留为 `schema-targeting-miss.log`，不计红灯。新 Fixture 最初的 provider 类型拼写错误也保留在 initial log，修正后通过，不算原故障复现。所有当前 TS State Fixture／调用方同步18，未改独立 Gold、评分阈值或预算。

## 2. 五门禁

| 门禁 | 结果 |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run arch:check` | PASS，0 forbidden dependencies |
| `npm test` | 978/978，0失败／跳过 |
| `npm run build` | PASS |
| `npm run test:browser:fixture` | 122/122，0失败／跳过 |

复用实际 factory + Guard + 本地 Chromium 的六个受控地区组合，以及原价格、条件逐条展示、身份、请求绑定和拒绝控制；未新增测试平台。地区产物写入本目录 `region-composition-results.json`，原产物不覆盖。原独立字面／几何检查器仅调整输入输出路径，仍读取原 `inputs.json`，六例地区、有效候选、观察引用和原预算均通过。这里只证明受控组合，脚本模型不代表真实模型选地区能力。

## 3. 22份历史产物重新校准

复用 `8ecfcfc` 同一 Manifest、原始压缩产物、见证、Gold／labels、Evaluator30、rubric26 和独立 Comparator。运行前冻结 358 项 SHA；仅14个已列明源码路径因地区合入、State Fixture、原持久化测试补强或测试输出位置变化而不同，评价代码与评分输入不变。模型0，网站0；自动输出保存并固定 SHA 后，再由原 Comparator 读取标签。

- **结果类型22/22；S0-声明20/20；交付子类8/8；错误合格声明0。** 与8ecfcfc复核一致。
- 原2条中断记录S0声明保持NOT_EVALUATED，不加入20条分母。网络边界9条ABSENT、13条历史证据缺口仍分列，不声称22条均完成安全证明。
- [独立比较](calibration/comparison/comparison.md)；[执行／门禁原始记录](verification.json)。

## 4. 对照本轮 acceptance 与限制

- **端到端：** 未运行真实整单，不评价新完整任务交付。22条是旧产物的Evaluator校准，不是22次新执行成功。
- **阶段：** 合同版本／字段合并、五门禁和原22条校准均通过；受控地区链既检查错误入口被阻止，也检查可行任务在原操作／模型／90秒来源预算内取得候选。
- **Severity：** 当前校准S0声明满足原门槛；历史边界证据缺口保留，真实新站点行为未评。
- **归因：** 本轮修复集成版本冲突并保留双方机制；浏览器／源站实际改善只能由后续探测判断。未扩大范围、总纲、Gold或预算。

## 下一步：等待用户通知

本轮真实网站／Google API／模型／探测／Live均0。[账本](call-ledger.json)。完成本轮普通推送后停下。

后续获准预算55→60，但本轮不启动；用户另行通知后才按 神乐坂#1 → 中目黑#1 → h001 → 神乐坂#2 → 中目黑#2 执行。TableCheck只用来源数据预检，间隔≥5分钟；403/503/429或繁忙页暂停15分钟仅重试1次，仍失败停。见证最早2026-10-21 10:47北京过期，届时未跑完停下报告，不自行续期。验收仍是A1309/A1317、无READ_BUDGET_EXCEEDED及h001不退步；本轮不声称这些真实探测已通过。
