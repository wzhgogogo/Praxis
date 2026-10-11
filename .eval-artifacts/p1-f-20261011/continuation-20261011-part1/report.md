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
