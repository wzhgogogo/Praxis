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


## 续跑：第一段（2026-10-11 UTC／10-12 东京）

用户批准剩余五例分两段补跑。本段只跑三个新地点，按 Kagurazaka → Nakameguro → Kichijoji，前两例各正式一次；Kichijoji preflight 失败未启动。冻结 `73bfca588ad5007a4a9326c8c13a958718898f1c`，同一宿主机干净工作树、同一原生发现与只读配置，500 秒／50 模型／40 Google，record-browser、record-decisions、no-proxy。未改产品、Prompt、Schema、配置、变体、见证或旧录制。

外层监测按最新指令：G1 入口 GET 和已审核日历 POST 正常；不因 reserve 入口 URL 误停。生产 Runtime／Guard 仍承担控件及请求许可校验，外层只镜像已有脱敏录制、检查非只读请求，不增加业务访问。运行中问题只记录，不修复。

### Preflight 尝试

| 用例 | 尝试 | UTC | 东京时间 | TableCheck HTTP | preflight | 原始路径 |
| --- | --- | --- | --- | --- | --- | --- |
| p1f-novel-kagurazaka-kaiseki-20261022 | 1 | 2026-10-11T15:40:06.659Z | 2026-10-12 00:40:06 | 206 | SUCCEEDED | /Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/live-preflight/2026-10-11T15-40-06-659Z-aff38b1b-8bf6-49fc-82f6-401b03d275c3.result.json |
| p1f-novel-nakameguro-yakiniku-20261023 | 1 | 2026-10-11T15:46:48.845Z | 2026-10-12 00:46:48 | 206 | SUCCEEDED | /Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/live-preflight/2026-10-11T15-46-48-845Z-14080614-511f-4483-b32c-789306034101.result.json |
| p1f-novel-kichijoji-tempura-20261020 | 1 | 2026-10-11T15:51:13.378Z | 2026-10-12 00:51:13 | 503 | FAILED | /Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/live-preflight/2026-10-11T15-51-13-378Z-12a5049d-2b10-440d-a2f9-bd6a43d5f59d.result.json |

三例 preflight 均只尝试一次；前两例通过，Kichijoji 在 TableCheck HTTP503 失败、未启动正式运行，留到第二段（本例已用1/3次，尚可2次，间隔至少15分钟）。无 preflight 重试。此前 h005 的 preflight 记录保留；本段不新增 h005 尝试。新的“preflight 最多3次、间隔至少15分钟、未启动不扣环境预留或整单Live”规则用于后续调度；本段未触发间隔要求。

### 运行逐行表

| 用例 | 执行终态／阶段 | 交付家数 | evaluator@27：合格结果／完成／行为 | 用时s | 模型 | Google | 等待ms／占比 | 浏览器超时 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| p1f-novel-kagurazaka-kaiseki-20261022 | SUCCEEDED / NO_VERIFIED_RESULT | 0 | NO / NO_VERIFIED_RESULT / NOT_EVALUATED | 378.677 | 47 | 3 | 58385 / 15.42% | 有 |
| p1f-novel-nakameguro-yakiniku-20261023 | SUCCEEDED / PRESENT_RESULTS | 1 | YES / PRESENTATION_RECORDED / SUPPORTED_BY_EVIDENCE | 247.159 | 34 | 1 | 35038 / 14.18% | 无 |
| p1f-novel-kichijoji-tempura-20261020 | PREFLIGHT_FAILURE_DEFERRED / NOT_STARTED | NOT_STARTED | NOT_APPLICABLE / NOT_STARTED / NOT_EVALUATED | 3.096 | 0 | 0 | 0 / N/A | 无 |

执行 SUCCEEDED 只代表运行正常收尾；不代表存在合格交付。自动评价只列事实，不归因。

### p1f-novel-kagurazaka-kaiseki-20261022

地点解析：Kagurazaka (35.701459799999995, 139.7402946)，半径 1000 m，NAMED_PLACE_RADIUS。Google 解析结果的原始 place types 未被冻结 Runner 保留；已有地址组成部分及 types 原样在本例 summary.json。不得据此补造类型。

- 交付：0 家。
- result：/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T15-40-10-206Z-90f04039-e029-4acc-a8f0-2fd9b7590fba.result.json
- decisions：/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T15-40-10-206Z-90f04039-e029-4acc-a8f0-2fd9b7590fba.decisions.jsonl（47 条；等于模型调用：true）
- recording：/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/recordings/hybrid-1791733210131；Replay NOT_REPLAYABLE / UNSAFE_DOCUMENT
- evaluator@27：/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T15-40-10-206Z-90f04039-e029-4acc-a8f0-2fd9b7590fba.result.evaluation.27-1791733601061.json
- 本例证据汇总：/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-f-20261011/continuation-20261011-part1/p1f-novel-kagurazaka-kaiseki-20261022/summary.json
- 零交付见证：仅四参数公开 GET，未打开预约表单／点时段，未判读。
  - rst_id=13218101；2026-10-11T15:46:29.735Z；HTTP 200；/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-f-20261011/continuation-20261011-part1/p1f-novel-kagurazaka-kaiseki-20261022/witness-raw/attempt-1-13218101.body.txt；结束后 0.428s。
  - rst_id=13048623；2026-10-11T15:46:30.254Z；HTTP 200；/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-f-20261011/continuation-20261011-part1/p1f-novel-kagurazaka-kaiseki-20261022/witness-raw/attempt-1-13048623.body.txt；结束后 0.947s。
  - rst_id=13011403；2026-10-11T15:46:30.622Z；HTTP 200；/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-f-20261011/continuation-20261011-part1/p1f-novel-kagurazaka-kaiseki-20261022/witness-raw/attempt-1-13011403.body.txt；结束后 1.315s。

### p1f-novel-nakameguro-yakiniku-20261023

地点解析：Nakameguro (35.638716099999996, 139.7026251)，半径 1000 m，NAMED_PLACE_RADIUS。Google 解析结果的原始 place types 未被冻结 Runner 保留；已有地址组成部分及 types 原样在本例 summary.json。不得据此补造类型。

- 交付：Daikanyama Yakiniku Kintan；来源 TABLECHECK, MODEL_JUDGMENT；距圆心 919 m；sourceIds {"tablecheck":"kintan-daikanyama-yakiniku","tablecheckNativeGuideUri":"https://www.tablecheck.com/en/kintan-daikanyama-yakiniku","discoverySourceId":"tablecheck","discoveryDetailUri":"https://www.tablecheck.com/en/kintan-daikanyama-yakiniku"}。
- result：/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T15-46-51-997Z-0626c034-d867-47bd-bf82-b6cda149cce8.result.json
- decisions：/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T15-46-51-997Z-0626c034-d867-47bd-bf82-b6cda149cce8.decisions.jsonl（34 条；等于模型调用：true）
- recording：/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/recordings/hybrid-1791733611921；Replay NOT_REPLAYABLE / UNSAFE_DOCUMENT
- evaluator@27：/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T15-46-51-997Z-0626c034-d867-47bd-bf82-b6cda149cce8.result.evaluation.27-1791733864867.json
- 本例证据汇总：/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-f-20261011/continuation-20261011-part1/p1f-novel-nakameguro-yakiniku-20261023/summary.json

### p1f-novel-kichijoji-tempura-20261020

地点解析：未启动，未执行 Google 地点解析。3.096 秒为 preflight 用时，浏览器未启动，等待和浏览器超时指标不适用。

- 未启动正式运行；无交付产物、decisions、recording 或餐厅 evaluator 结果。网络 preflight evaluator NOT_APPLICABLE。
- 本例证据汇总：/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-f-20261011/continuation-20261011-part1/p1f-novel-kichijoji-tempura-20261020/summary.json

### 用量与段末验证

新增模型 **81**，累计 **602/1500**；本段 Google **4**。此前完整三例仅可确认 Google 3 次、两次中断缺计数，因此 P1-F 原 A 和本段可确认 7 次，完整累计仍 UNKNOWN，不伪造完整数字。新增整单 Live **2**，累计 **24/33**。本段环境重跑 **0**，启动后的环境预留仍 **2**。见证原始 GET 与网络 preflight 单列，不计 Google业务或模型调用。

冻结工作树段末 CLEAN、SHA相同；变体与见证两端SHA-256一致。复用冻结提交此前四门禁（npm test 846/846），本段无产品代码改动，不为执行证据重复代码测试。两份正式结果分别再执行现有 evaluator@27；decision条数与模型调用数逐例核对。具体原始路径、超时引用、Google分项和保护哈希在 continuation-20261011-part1/summary.json。

第一段到此停止，等待用户；第二段 h003→h005，加上延期 Kichijoji 未开始，B 未开始，不推送。


## 2026-10-12 第二段与 B 准备（尚未运行）

状态：评测侧准备完成；指定 reviews/P1-F-EVAL-TEST-P0-REVIEW-20261012.md 当前本地及已连接 Pages 未找到，已请求可读路径；尚未通读，真实运行必须先完成该前置阅读。Playbook 实读仍为 1.3，未见复核者更新文件，不代写复核原文。用户本条指令的签收归类口径有效，UNKNOWN/NO 的人工逐条复核由独立复核者完成，本报告不自行改签收分类。

生产冻结：73bfca588ad5007a4a9326c8c13a958718898f1c，同一干净宿主机工作树；评测载入修复不进入冻结生产代码。原样 rev2 提交 0791304，载入修复提交 526fab6。拒绝 null、未知键、旧 flow 变体；rev2 八例完整原文及 semantic 与独立字面量 oracle 一致。四门禁全部 PASS，npm test 849/849；有效红灯和最终绿灯日志在 prep-20261012/loading/。

### 五例离线重评

0 模型、0 Google、0 网络。只在新评价输入副本中替换 materializedCase，保留原运行 reference time 与全部运行证据；原始结果和旧评价未覆盖。

| 用例 | 旧合格结果 | rev2 合格结果 | 旧条件判定 | rev2 条件判定 | 新评价路径 |
| --- | --- | --- | --- | --- | --- |
| p1f-kf-h001-20261020 | YES | YES | SATISFIED | SATISFIED | /Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-f-20261011/prep-20261012/reevaluation/p1f-kf-h001-20261020.rev2-evaluation-input.evaluation.27-1791748593148.json |
| p1f-kf-h002-20261024 | UNKNOWN | UNKNOWN | NOT_EVALUATED | NOT_EVALUATED | /Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-f-20261011/prep-20261012/reevaluation/p1f-kf-h002-20261024.rev2-evaluation-input.evaluation.27-1791748593438.json |
| p1f-kf-h004-20261019 | NO | NO | NOT_SATISFIED | NOT_SATISFIED | /Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-f-20261011/prep-20261012/reevaluation/p1f-kf-h004-20261019.rev2-evaluation-input.evaluation.27-1791748593753.json |
| p1f-novel-kagurazaka-kaiseki-20261022 | NO | NO | NOT_EVALUATED | NOT_EVALUATED | /Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-f-20261011/prep-20261012/reevaluation/p1f-novel-kagurazaka-kaiseki-20261022.rev2-evaluation-input.evaluation.27-1791748594144.json |
| p1f-novel-nakameguro-yakiniku-20261023 | YES | YES | SATISFIED | SATISFIED | /Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-f-20261011/prep-20261012/reevaluation/p1f-novel-nakameguro-yakiniku-20261023.rev2-evaluation-input.evaluation.27-1791748594369.json |

完整新旧路径、输入 SHA、required_claims、比较：prep-20261012/reevaluation/comparison.json。所有五例自动总体结论不变，h002 的预算截断差异消除后仍存在其他措辞差异；不据此推断人工签收。

### 外层冻结与空跑

A 使用批准 rev2；B 使用冻结 Runner 默认 Gold@7（h001–h004 原文与 @6 相同，h005 用 @7），不要求见证、无交付不抓见证。每例配置 500 秒、50 模型、40 Google，record-decisions、record-browser、no-proxy，原生发现。附近圆心 (35.6697, 139.7670)，1000 m；指名地点由冻结 Runtime 解析。

交付后 Tabelog 四参数 GET 绑定已展示日期、人数、时段，原始响应保存；selection 不含展示时段即停止整批，事实交独立复核。TableCheck 交付仅保留原始 trace 核对。G1 公共入口 GET 与已审核日历 POST 正常；禁止预约/确认/支付点击、表单提交、个人信息输入与非预期 Guard 放行。

已知边界缺口：Guard 多跳重定向，按用户批准保持冻结版本不修；P1-F 后首先修复，必须在任何预约相关工作之前完成。

两个入口各无网络空跑一次 PASS，交付绑定和 selection 正反例通过；模型/Google/网络均 0。共享脚本与依赖一并冻结，完整 SHA 在 prep-20261012/scripts/freeze.json：

| 文件 | SHA-256 |
| --- | --- |
| continue-a.mjs | 9b106d2965b672f5c2d779adbe596b44f90d79423cbcc1327dce76949a2d7f5a |
| run-b.mjs | 1b2666220eef04c3f647143dd40f3ed577996100a4f1b1e048af484bd19d4c78 |
| execute.mjs | b1f60cf7c779e0f6f25b86887721e05f387fe295b0478a313e6c80a2793b417d |
| post-delivery.mjs | 94a3c2600408777242a358f89fa1343f831878b916cd123f2df21ba49a130c0e |
| observe.mjs | e8be3f68fba10eb47f5f9e71dc861b4f78b57adae30db5f648dd76c76bc25a38 |
| reviewed-reads.json | ea386ace126bfc2fdaff2aeb99f9c328cef7ce5d50ee9e418ee90f2956ffcfae |
| live-case-materializer.ts | 22c051c679511e27f579ca2b21d14004ef318b4678556ccd119e513a14fc230b |
| variants.rev2.yaml | 1879c3189f90134f2ddb4cc78b12fcc31a0cd68e7b806a2baec43270e6f9f753 |
| witnesses.p1f-20261011.json | 1900217333acc30cef9026abe9da1199bbd62188d48773cb9f97b6c7f5856377 |

空跑证据：prep-20261012/scripts/dry-a.json、dry-b.json。运行账本：prep-20261012/ledger.json；初始模型 602/1500、整单 Live 24/33、启动后环境重跑预留 2。Google 已确认 7，历史两次中断计数缺失，完整累计 UNKNOWN；后续新增逐例记录。Kichijoji 已用 preflight 1/3；本续跑的 h003/h005 各最多 3 次，失败间隔至少 15 分钟；正式环境失败最多每例重跑一次、扣剩余预留，能力失败不重跑。

时窗：第二段东京 10/12 08:30 起，10:45 前完成 h003→h005→Kichijoji；B 东京 11:00 起，12:30 前全部启动 h001→h005。当前尚无第二段/B preflight 或正式运行，不新增用量。

已建立本线程一次性心跳：第二段北京时间07:30（东京08:30，p1-f-08-30）；B北京时间10:00（东京11:00，p1-f-b-11-00）。复核文档通读是运行前置，未读到则不启动；不假定已完成未来运行。计划证据 prep-20261012/schedule.json。


## 2026-10-12 阅读前置已完成

用户提供的独立复核仓库副本已通读，Playbook 1.6 已通读；两份文件原样独立提交 `949b86f`（independent review artifacts），字节与提交一致。此前“指定复核文档未找到／未读”仅是历史准备状态，现已解除。真实阅读路径、SHA-256 和时间见 `prep-20261012/review-read.json`。准备提交为 `947b8e3`；脚本及输入冻结 SHA 全部重新校验一致，未修改脚本。

按批准继续既定计划：东京10/12 08:30第二段、11:00 B，生产仍 `73bfca5`／干净工作树；当前尚未进入时窗，未发起新的preflight或Live。签收UNKNOWN/NO由独立复核逐条判定；多跳重定向为已知边界缺口，不声明完整只读边界已验证。


## 用户批准提前运行（2026-10-12）

取消原东京08:30/11:00心跳。用户明确允许仅更新外层时窗校验并重新冻结SHA；execute.mjs只替换open/close时窗表达式，其余字节不变，两个入口脚本SHA保持原值。共享execute新SHA `0cd3aacc1267c8e101b5040b809146af48bb1cdb05de95f5ce97b14f0929f949`，旧manifest和旧脚本保留在prep-20261012/。两个入口再次无网络空跑PASS，h005提前调用仍被OUTSIDE_AUTHORIZED_START_WINDOW拒绝，0新网络/模型。原版h005仅东京11:30–14:00，已设置东京11:30单独心跳p1-f-h005-11-30。生产仍73bfca5/CLEAN。现在执行第二段h003→h005→Kichijoji，完成后接B h001→h004；结果按段追加，不修改旧报告。
