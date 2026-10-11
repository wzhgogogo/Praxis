# P1-F Part A 运行报告

- 状态：**STOPPED；未完成 8 次签收**。5 次已启动、3 次有正式 result、2 次中断、3 次未启动。独立归因待复核；非 Clean Baseline。
- 冻结提交：`73bfca588ad5007a4a9326c8c13a958718898f1c`。B 部分须使用此提交；本轮未运行 B。
- 宿主机干净工作树：`/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing`，开始及停批后均为 CLEAN。工作树保留。
- 提交 `2f10a27` 原样保存 5 份复核/输入文件；提交 `73bfca5` 仅增加 eval 侧无父用例 novel cohort 载入支持。实验分支与 ADR-0041 未动。
- 变体 8/8 离线解析、原文与 semantic 一致；0 模型 / 0 Google。四门禁通过，npm test 846/846；见 [loading/gates.json](loading/gates.json)、[loading/parsed-cases.json](loading/parsed-cases.json) 和对应红/绿日志。
- 每次正式读配置：500000 ms、模型最多 50、Google 最多 40，record-browser / record-decisions / no-proxy；LOCAL_CHROMIUM、headless、无人工介入，原生发现。nearby 圆心 35.6697,139.7670；指名地点由 Google 解析；均默认 1000 m。
- 见证有效期：东京 2026-10-12 17:20。未修改 Gold、变体、见证、种子或已有录制；没有产品代码、Prompt、Schema 或配置改动，没有推送。

## 逐次结果

| 顺序 / 用例 | 执行与 evaluator@27 | 交付记录 | 用时 | 模型 / Google | 等待 | 浏览器超时 |
| --- | --- | --- | --- | --- | --- | --- |
| 1. `p1f-kf-h001-20261020` | SUCCEEDED / PRESENTATION_RECORDED；合格 YES，行为 SUPPORTED_BY_EVIDENCE | 3 家：Shibuya Sushi Sen（TABELOG，260 m）；Shibuya Sushi Matsumoto（TABELOG，633 m）；Sushi Tokyo Ten、 Shibuya ten（TABELOG，549 m） | 128.058 s | 19 / 1 | 20.818 s，16.26% | 否 |
| 2. `p1f-kf-h002-20261024` | SUCCEEDED / PRESENTATION_RECORDED；合格 UNKNOWN，行为 NOT_EVALUATED | 1 家：Ginza Sushi Sendou（TABELOG，390 m） | 148.971 s | 23 / 1 | 25.047 s，16.81% | 否 |
| 3. `p1f-kf-h003-20261023` | 中断：外层记录脚本误停：已审核日历 read POST；STARTED-only 评价 UNKNOWN / NOT_EVALUATED | 无正式交付记录 | 33.587 s（含 preflight、终止宽限） | 2 / 未留存 | trace 已观察 5.443 s，wall 占比 16.21% | 无完整结果；见 trace |
| 4. `p1f-kf-h004-20261019` | SUCCEEDED / PRESENTATION_RECORDED；合格 NO，行为 NOT_SUPPORTED | 1 家：Noa Cafe Ginza（TABELOG，188 m） | 304.229 s | 47 / 1 | 32.614 s，10.72% | 否 |
| 5. `p1f-kf-h005-20261022` | 中断：预约入口 URL 触发本轮保守停止边界；STARTED-only 评价 UNKNOWN / NOT_EVALUATED | 无正式交付记录 | 98.706 s（含 preflight、终止宽限） | 14 / 未留存 | trace 已观察 30.994 s，wall 占比 31.40% | 无完整结果；见 trace |
| 6. `p1f-novel-kagurazaka-kaiseki-20261022` | NOT_RUN：停批 | — | — | 0 / 0 | — | — |
| 7. `p1f-novel-nakameguro-yakiniku-20261023` | NOT_RUN：停批 | — | — | 0 / 0 | — | — |
| 8. `p1f-novel-kichijoji-tempura-20261020` | NOT_RUN：停批 | — | — | 0 / 0 | — | — |

完整运行用时/等待来自原始 resourceUsage；中断例只有外层 wall 与已写出 trace，二者分母不同，不能伪装成完整 Runner 计数。evaluator 的 NO/UNKNOWN 保留原值，不据此作根因或库存结论。

## 停批事实与执行偏差

1. 第 3 例于 `2026-10-11T08:20:06.616Z` 记录到 `POST https://production.tablecheck.com/v2/hub/availability_calendar_v2`。该形态是 ADR-0036 和 `tablecheck-public-query.ts` 已审核的只读日历查询，不是非预期 Guard 放行，也没有写操作证据。外层观察把所有非 GET/HEAD 当成写操作，造成误停；这是执行者记录脚本错误，不是产品能力失败或 ENV_FAILURE。只纠正了外层观察，未改冻结 Runtime/Guard。补跑例外已向用户提出，未获回复、未执行；随后整批已停止。
2. 第 5 例于 `2026-10-11T08:29:34.276Z` 的 trace 序号 488（SNAPSHOT） 观察到 `https://www.tablecheck.com/en/shops/the-peninsula-tokyo-the-lobby/reserve`。冻结 Guard 的 G1 规则本来允许该公共预约入口 GET 文档。本轮用户要求进入预约步骤即停，外层监测采用保守的预约入口 URL 边界，故在观察到此 URL 时停止整批。**没有据此认定已经预约、支付、填写个人信息或出现非预期 Guard 放行**；实际停点和该边界解释交独立复核。没有启动三个新地点、没有能力重跑。
3. 两次停止均立即发 SIGTERM，3 秒内未退出后发 SIGKILL。第 5 例在这 3 秒中出现后续只读 session 准备，但没有新增模型决定；中断时 9 个 browser MODEL_DECISION_STARTED 与 9 条已捕获 browser 决策一致。停止后检查无本批 Runner 或 Chromium 遗留。未补造正式 result、最终 Task State 或 recording.json。
4. 第 1 例外层脚本读取了不存在的 finalState 字段，误记交付数为 0（真实 finalSnapshot 显示 3 家），因此额外发送 2 份已批准参数的公开见证 GET。两份原始响应保留，不下库存结论。下一例前已修正记录脚本；原始 result 不改，纠正记录见该目录 attempt-1.correction.json。
5. 用户指令列 Playbook 1.4，但工作树文件页头实际为 1.3，已原样提交并在运行前告知。没有自行改版本或改输入；安排和范围遵守本条最新用户指令。

## 地点解析

| 用例 | 当次记录圆心 / 绑定类型 | Google 地点类型观察边界 |
| --- | --- | --- |
| `p1f-kf-h001-20261020` | Shibuya：35.6619707, 139.70379499999999；NAMED_PLACE_RADIUS；1000 m | 地址组件 types：administrative_area_level_1, country, locality, political。冻结 Runner 未保留原始 Google place.types，不猜测、不额外调用补查 |
| `p1f-kf-h002-20261024` | Higashi-ginza Sta.：35.669700299999995, 139.7671399；NAMED_PLACE_RADIUS；1000 m | 地址组件 types：administrative_area_level_1, country, locality, political, postal_code, premise, sublocality, sublocality_level_2, sublocality_level_3, sublocality_level_4。冻结 Runner 未保留原始 Google place.types，不猜测、不额外调用补查 |
| `p1f-kf-h003-20261023` | 按输入配置 nearby 东银座 35.6697,139.7670；正式绑定状态未因中断保存 | 无正式状态，不声称完整解析结果 |
| `p1f-kf-h004-20261019` | nearby：35.6697, 139.767；TASK_LOCATION_RADIUS；1000 m | 地址组件 types：administrative_area_level_1, country, locality, political, postal_code, sublocality, sublocality_level_2, sublocality_level_3, sublocality_level_4。冻结 Runner 未保留原始 Google place.types，不猜测、不额外调用补查 |
| `p1f-kf-h005-20261022` | 按输入配置 nearby 东银座 35.6697,139.7670；正式绑定状态未因中断保存 | 无正式状态，不声称完整解析结果 |
| `p1f-novel-kagurazaka-kaiseki-20261022` | 未运行 | — |
| `p1f-novel-nakameguro-yakiniku-20261023` | 未运行 | — |
| `p1f-novel-kichijoji-tempura-20261020` | 未运行 | — |

指名地点的坐标来自当次 discovery evidence / searchContinuation，不使用见证文件估计圆心。完整分辨率和证据 ID 见 [part-a/summary.json](part-a/summary.json)。

## 原始产物

### `p1f-kf-h001-20261020`

- result：`/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T08-14-12-197Z-5bd68be2-d5fc-4a84-b460-e3fe2dcb40c2.result.json`
- decisions：`/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T08-14-12-197Z-5bd68be2-d5fc-4a84-b460-e3fe2dcb40c2.decisions.jsonl`（19 条 = 19 次；浏览器观察/DOM 序号由原始捕获保存）
- recording：`/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/recordings/hybrid-1791706452130/recording.json`；Replay 状态 `NOT_REPLAYABLE` / `UNSAFE_DOCUMENT`
- post-run evaluator@27：`/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T08-14-12-197Z-5bd68be2-d5fc-4a84-b460-e3fe2dcb40c2.result.evaluation.27-1791706617507.json`
- 外层 start / finish / log：`part-a/p1f-kf-h001-20261020/`

### `p1f-kf-h002-20261024`

- result：`/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T08-16-48-821Z-eb814076-2a10-4ec7-864e-3ce3e09cb125.result.json`
- decisions：`/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T08-16-48-821Z-eb814076-2a10-4ec7-864e-3ce3e09cb125.decisions.jsonl`（23 条 = 23 次；浏览器观察/DOM 序号由原始捕获保存）
- recording：`/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/recordings/hybrid-1791706608749/recording.json`；Replay 状态 `NOT_REPLAYABLE` / `UNSAFE_DOCUMENT`
- post-run evaluator@27：`/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T08-16-48-821Z-eb814076-2a10-4ec7-864e-3ce3e09cb125.result.evaluation.27-1791706774279.json`
- 外层 start / finish / log：`part-a/p1f-kf-h002-20261024/`

### `p1f-kf-h003-20261023`

- started：`/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T08-19-41-152Z-b67a33b0-ad5a-4863-bee4-21504989084e.started.json`
- decisions：`/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T08-19-41-152Z-b67a33b0-ad5a-4863-bee4-21504989084e.decisions.jsonl`（已落盘 2 条）
- 正式 result / recording.json：未生成；中断原始 trace：`part-a/p1f-kf-h003-20261023/attempt-1.trace.jsonl`
- 仅对原样 STARTED 日志执行 evaluator@27：`/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T08-19-41-152Z-b67a33b0-ad5a-4863-bee4-21504989084e.started.evaluation.27-1791706947925.json`；不能替代正式结果评价
- 外层 start / finish / log：`part-a/p1f-kf-h003-20261023/`

### `p1f-kf-h004-20261019`

- result：`/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T08-22-34-575Z-97767eac-8aa0-463b-aec0-1a69c25cdc7a.result.json`
- decisions：`/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T08-22-34-575Z-97767eac-8aa0-463b-aec0-1a69c25cdc7a.decisions.jsonl`（47 条 = 47 次；浏览器观察/DOM 序号由原始捕获保存）
- recording：`/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/recordings/hybrid-1791706954502/recording.json`；Replay 状态 `NOT_REPLAYABLE` / `UNSAFE_DOCUMENT`
- post-run evaluator@27：`/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T08-22-34-575Z-97767eac-8aa0-463b-aec0-1a69c25cdc7a.result.evaluation.27-1791707276483.json`
- 外层 start / finish / log：`part-a/p1f-kf-h004-20261019/`

### `p1f-kf-h005-20261022`

- started：`/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T08-28-04-269Z-73ee8f6e-55c6-4c1d-989e-300a40cacdd0.started.json`
- decisions：`/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T08-28-04-269Z-73ee8f6e-55c6-4c1d-989e-300a40cacdd0.decisions.jsonl`（已落盘 14 条）
- 正式 result / recording.json：未生成；中断原始 trace：`part-a/p1f-kf-h005-20261022/attempt-1.trace.jsonl`
- 仅对原样 STARTED 日志执行 evaluator@27：`/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T08-28-04-269Z-73ee8f6e-55c6-4c1d-989e-300a40cacdd0.started.evaluation.27-1791707463345.json`；不能替代正式结果评价
- 外层 start / finish / log：`part-a/p1f-kf-h005-20261022/`

### `p1f-novel-kagurazaka-kaiseki-20261022`

未启动，无产物。

### `p1f-novel-nakameguro-yakiniku-20261023`

未启动，无产物。

### `p1f-novel-kichijoji-tempura-20261020`

未启动，无产物。

## 见证原始 GET

| 用例 | 响应 | 时间要求 |
| --- | --- | --- |
| h001 | 13261619、13275802，HTTP 200；这是交付字段误读导致的额外采集 | 原始时间戳保留 |
| h003（中断） | 13266155、13281962、13318227，HTTP 200；20261023 / 10人 / 1730（见证窗口起点） | 结束后约 2 分钟 |
| h005（中断） | 13305528、13255508，HTTP 200；20261022 / 4人 / 1800 | 结束后约 38 秒 |
| h004 | 推荐类，未抓取 | 按指令豁免 |

均只发 GET，四个查询键严格为 rst_id、svd、svps、svt；每份 body.txt 与 metadata.json 保存在各运行目录 witness-raw/。HTTP 状态只作传输记录，**未解析库存、未判读见证是否仍有效**。

## 用量与剩余

- 环境失败 / 环境重跑：0 / 0；预留仍剩 3 次。两次中断均不记 ENV_FAILURE；没有擅自补跑。
- 本批已捕获模型调用 **105**；累计 **521/1500**（起点 416）。包括 h003 2 次与 h005 14 次中断例调用；没有回放或额外模型调用。
- Google：完整结果确认本批 **3** 次（h001/h002/h004 各 1）；h003/h005 的完整 Google 计数未在 SIGKILL 前保存，因此本批总量不完整，不能声称总数为 3。preflight 与见证 GET 不冒充 Google 调用；历史 Google 累计起点未提供，不虚构。
- 整单 Live：**22/33**（起点 17 + 本批 5 次已启动，含两次中断）；其中本批 3 次有正式结果。额外补跑尚未获批、未消耗。
- 尚未运行：kagurazaka、nakameguro、kichijoji。B 部分未开始。

## 验证与交付边界

- 离线载入门禁已在冻结前通过；后续只写运行/评价/报告证据，没有产品改动，复用冻结门禁，不把中断 Live 当成通过。
- 完整 3 例均显式执行现有 evaluator@27，评价源 SHA-256 与 result 一致；Runner 自动评价另行保留。中断 2 例仅有 STARTED-only 诊断，不报自动合格。
- 冻结工作树持续 CLEAN；用户的三个未跟踪演示文稿未动；没有合并检索词实验，没有推送。
- 原文/semantic/见证保护哈希核对见 part-a/protected-final-check.json。报告到此停止，等待独立复核和后续运行指令。

## 用户授权 h005 重试补充（2026-10-11）

两次 CLI 都在 TableCheck preflight HTTP503 阶段失败，中间恢复检查HTTP206；唯一环境重试已使用，未进入正式Live。新增模型/Google业务/整单Live均为0；累计仍521/1500、22/33，环境重跑预留剩2。详细事实与原始网络证据见 [重试记录](rerun-20261011/report.md)。原始A记录保持不变；没有补跑其他用例或B。
