# P1-G 收尾小批报告

## 最终运行汇总（2026-10-12）

四次正式 Live 已全部结束。h001 仍 FAILED / REJECTION_LIMIT，没有兑现诚实结束目标；L1 组合绿灯不能替代这一实际链路缺口的关闭。仅记录，不现场修复、不归因或签收。

| 用例 | 执行 / 完成 | 交付（来源 / 距离） | evaluator@27 | 秒 | 模型 / Google | 等待毫秒 / 占比 | 浏览器超时 |
|---|---|---|---|---:|---|---|---|
| 吉祥寺 | SUCCEEDED / NO_VERIFIED_RESULT | 0 | NO / NO_VERIFIED_RESULT | 320.806 | 47 / 1 | 34100 / 10.63% | 有 |
| h001 | FAILED / FAILED | 0 | UNKNOWN / NOT_EVALUATED | 297.997 | 30 / 3 | 55089 / 18.49% | 有 |
| h003 | SUCCEEDED / PRESENT_RESULTS | Aloft by Marriott Tokyo Ginza / TABLECHECK / 150m | UNKNOWN / PRESENTATION_RECORDED | 319.326 | 47 / 1 | 120239 / 37.65% | 有 |
| h004 | SUCCEEDED / NO_VERIFIED_RESULT | 0 | NO / NO_VERIFIED_RESULT | 266.993 | 47 / 1 | 32280 / 12.09% | 无 |

生产冻结 `9b342871c514f963be5386e889c1542b1e6ce020`，外层 execute SHA `01fa1610ef8382ecd9e3d812f1672c38fed72a7943caa6b4896a17bcfd8d492d`。L0/L1 四门禁复用修复提交 B 的 853/853 最终绿灯；本次运行未修改生产代码。L3 额外回放未做（0调用）。

本批正式 Live 新增4，整单36（正式授权上限）；模型新增171，累计970/1500；Google新增6，已确认累计22，历史完整累计UNKNOWN。preflight7次：4通过、3 TableCheck503；全部余额GET可用，503均未启动运行，不计Live/模型/环境重跑。启动后环境重跑0，预留2未使用。

见证认证UTC06:49:40.862至次日06:49:40.862，三家18:00支持，原始响应在 witness-certification-raw/。吉祥寺零交付后UTC07:10:45.132至07:10:46.250保存三家四参数GET，均HTTP200、10分钟内；raw在 live/p1f-novel-kichijoji-tempura-20261020/attempt-2/witness-raw/。本批唯一交付来自TableCheck，核验记录 TABLECHECK_RAW_TRACE_REVIEW（live/h003/attempt-2/post-delivery.json、trace.jsonl），没有Tabelog展示时段，因此没有交付后TabelogGET。B零交付不抓见证。

四次决策捕获分别47/30/47/47，与对应模型调用完全相等；四份录制目录都存在，但均NOT_REPLAYABLE/UNSAFE_DOCUMENT，不能宣称真实页面Replay通过。账本安全stop为空；Guard多跳重定向仍为已知边界缺口，不宣称只读边界已全部验证。

| preflight | 开始UTC | 结束UTC | TableCheck | 正式启动 |
|---|---|---|---|---|
| p1f-novel-kichijoji-tempura-20261020 #1 | 2026-10-12T06:50:00.278Z | 2026-10-12T06:50:04.510Z | 503 | False |
| p1f-novel-kichijoji-tempura-20261020 #2 | 2026-10-12T07:05:19.733Z | 2026-10-12T07:05:23.779Z | 206 | True |
| h001 #1 | 2026-10-12T07:11:48.874Z | 2026-10-12T07:11:53.246Z | 206 | True |
| h003 #1 | 2026-10-12T07:17:45.883Z | 2026-10-12T07:17:50.171Z | 503 | False |
| h003 #2 | 2026-10-12T07:38:37.687Z | 2026-10-12T07:38:41.296Z | 206 | True |
| h004 #1 | 2026-10-12T07:44:41.007Z | 2026-10-12T07:44:44.952Z | 503 | False |
| h004 #2 | 2026-10-12T08:02:10.716Z | 2026-10-12T08:02:15.982Z | 206 | True |

### 地点和产物

顶层 Google place types 未被冻结 Runner 保留；以下类型为 locationContext.addressComponents 中的实际观察，不能当作完整原始响应。nearby沿用已批准圆心，Google仅逆地址观察。

- p1f-novel-kichijoji-tempura-20261020：圆心 35.704096/139.58020539999998，半径1000m，NAMED_PLACE_RADIUS；首地址组件类型 `colloquial_area,political`。
  - result：`/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-12T07-05-23-849Z-02944629-b6dd-4ed8-83ae-2cc47e4416ac.result.json`
  - evaluator：`/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-12T07-05-23-849Z-02944629-b6dd-4ed8-83ae-2cc47e4416ac.result.evaluation.27-1791789046374.json`
  - decisions：`/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-12T07-05-23-849Z-02944629-b6dd-4ed8-83ae-2cc47e4416ac.decisions.jsonl`
  - recording：`/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing/.eval-artifacts/recordings/hybrid-1791788723801`
  - 汇总和SHA核验：`/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-g-20261012/live/p1f-novel-kichijoji-tempura-20261020/attempt-2/summary.json`、`/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-g-20261012/live/p1f-novel-kichijoji-tempura-20261020/attempt-2/verification.json`
- h001：圆心 35.6619707/139.70379499999999，半径1000m，NAMED_PLACE_RADIUS；首地址组件类型 `locality,political`。
  - result：`/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-12T07-11-53-308Z-c8e5fbf5-e7be-4f5a-a439-fc2dd79512ff.result.json`
  - evaluator：`/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-12T07-11-53-308Z-c8e5fbf5-e7be-4f5a-a439-fc2dd79512ff.result.evaluation.27-1791789411577.json`
  - decisions：`/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-12T07-11-53-308Z-c8e5fbf5-e7be-4f5a-a439-fc2dd79512ff.decisions.jsonl`
  - recording：`/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing/.eval-artifacts/recordings/hybrid-1791789113264`
  - 汇总和SHA核验：`/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-g-20261012/live/h001/attempt-1/summary.json`、`/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-g-20261012/live/h001/attempt-1/verification.json`
- h003：圆心 35.6697/139.767，半径1000m，TASK_LOCATION_RADIUS；首地址组件类型 `establishment,point_of_interest,subway_station,transit_station`。
  - result：`/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-12T07-38-41-365Z-93be1159-74d2-40d6-b370-2c45bebda194.result.json`
  - evaluator：`/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-12T07-38-41-365Z-93be1159-74d2-40d6-b370-2c45bebda194.result.evaluation.27-1791791041023.json`
  - decisions：`/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-12T07-38-41-365Z-93be1159-74d2-40d6-b370-2c45bebda194.decisions.jsonl`
  - recording：`/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing/.eval-artifacts/recordings/hybrid-1791790721315`
  - 汇总和SHA核验：`/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-g-20261012/live/h003/attempt-2/summary.json`、`/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-g-20261012/live/h003/attempt-2/verification.json`
- h004：圆心 35.6697/139.767，半径1000m，TASK_LOCATION_RADIUS；首地址组件类型 `establishment,point_of_interest,subway_station,transit_station`。
  - result：`/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-12T08-02-16-054Z-4bfe0518-32c8-4fe1-8e97-9cc17e42b259.result.json`
  - evaluator：`/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-12T08-02-16-054Z-4bfe0518-32c8-4fe1-8e97-9cc17e42b259.result.evaluation.27-1791792403308.json`
  - decisions：`/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-12T08-02-16-054Z-4bfe0518-32c8-4fe1-8e97-9cc17e42b259.decisions.jsonl`
  - recording：`/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing/.eval-artifacts/recordings/hybrid-1791792136002`
  - 汇总和SHA核验：`/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-g-20261012/live/h004/attempt-2/summary.json`、`/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-g-20261012/live/h004/attempt-2/verification.json`

机器汇总：live/summary.json。原始结果、决策和录制保留在冻结工作树，不覆盖已有录制。停止自动续跑，等待独立复核；不推送。

## 准备与执行历史（保留原记录，NOT_RUN/原时窗已被以上最终汇总替代）

Evidence status: exposed development evidence; L0/L1 complete, four Live completed; independent signoff pending. P1-F暂不签收；本报告不代替独立复核。



| 项目 | 状态 / 本地提交 | 证据 |
|---|---|---|
| 0 复核原稿 | PASS，`e2dc143`，independent review artifacts | Playbook1.7和签收复核副本原样提交 |
| A 地点解析 | L0 PASS，`b627511` | `A-location/red.log`、`green.log`及四门禁日志 |
| B 非系统停止诚实结束 | L1 PASS，`9b34287` | `B-honest-end/red.log`、`red-artifacts/`；`combination-green.log`、`final-artifacts/`及四门禁日志 |
| 冻结和外层 | PASS，`d4f74e7` | `prep/scripts/freeze.json`、`dry-run.json`、`dry-run-b.json`、`balance-offline.json` |
| 吉祥寺重新认证 | NOT_RUN，安排10/13运行前 | 将保存 `witness-certification-raw/`、`witnesses.p1g.json`；未创建虚假证书 |
| 四次Live | NOT_RUN，安排东京10/13 09:00–12:00 | 本线程心跳 `p1-g-10-13-live`；执行前须重查账本和真实时间 |

原稿核验：Playbook55599字节，SHA-256 `2f82d2e2831a4fae9dd1e2cf44adae0e3fa49b4301ac3206b9e8398baf845b4b`；签收复核11144字节，SHA-256 `12a9934de939b9339477f3bae0e42da84c14687e2c6e096df800af0de2791968`。本批实现未修改这两份原稿。

A：旧实现对真实 `Kichijōji` 返回 `GOOGLE_LOCATION_UNRESOLVED`，新实现解析到35.704096/139.580205。两个带变音符号正例、商户/多处同名/远地反例通过，locationBias及100km规则保持。Shibuya、Higashi-Ginza、Nakameguro、Kagurazaka坐标与保存结果完全一致；该四项是保存位置与地址组件投影的离线回归，顶层地理类型重建，不称原始Google响应Replay。相关27/27，typecheck、arch:check、npm test、build全部PASS，850/850。

B：三个组合使用Live同一 `createHybridReadComposition`，安装生产 `PlaywrightReadNetworkGuard` 和来源网络策略；只替换模型传输与公开页面。未注入合格State或Evidence。发现计划剩余入口可以包含部分已读的来源，不能把该入口列表解释为整个来源从未访问。

| 固定传输组合 | 修复前 | 修复后 | evaluator@27完成判定 |
|---|---|---|---|
| 已查位动作重复拒绝、无合格候选 | FAILED / REJECTION_LIMIT | NO_VERIFIED_RESULT，原因含REJECTION_LIMIT和AVAILABILITY_ALREADY_CHECKED；记录实际读取与缺口，0交付 | NOT_EVALUATED：文字剩余缺口不能独立证明来源穷尽 |
| 同上、已有合格候选 | FAILED / REJECTION_LIMIT | 现有默认交付窗口展示1家，资格和证据规则不放宽 | SATISFIED / PRESENTATION_RECORDED |
| 地点未解析、NO_PROGRESS | FAILED / NO_PROGRESS | NO_VERIFIED_RESULT，原因保留GOOGLE_LOCATION_UNRESOLVED，实际已查门店为空 | NOT_EVALUATED：没有成功发现观察 |

详见 `B-honest-end/combination-results.json`。三个先红后绿3/3，相关157/157；四门禁全部PASS，全套853/853。Google网络故障、模型拒绝/异常、超时及既有HARD、身份、新鲜度和授权反例保持。`UNDERSTANDING` 下尚未读取但请求完整的非系统停止也诚实标为未查，未假造发现。未修改Prompt、Schema或Evaluator。

可选提示实验未做：B h001第28次请求已有5家 `availabilityChecks` 和33家 `checkableCandidateIds`，证据 `B-honest-end/rejection-context-inspection.json`。真实L3回放0次，不宣称模型重复动作比例改善。本批证明范围是L0/L1；当前外部连接/库存和独立签收留给批准的Live与复核。

生产冻结：`9b342871c514f963be5386e889c1542b1e6ce020`。新工作树 `/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing`，HEAD一致且CLEAN。P1-F工作树仍 `73bfca588ad5007a4a9326c8c13a958718898f1c` / CLEAN，未改动。主树三个演示文稿未触碰。

外层 `execute.mjs` SHA-256 `aa3379b565b3c16a19d45d14519393ef29051ead11f5470cbea6b120c8f850bf`；`run-p1g.mjs` SHA-256 `8055e7919adfeaf7e1e4171f4a37627067d401e94f23928bbd62990501848da1`。其余文件与输入SHA见 `prep/scripts/freeze.json`，12文件核验PASS。外层未修改生产；零交付归零和preflight/正式结果分开识别仅用于本批核验和计数。沿用原交付后GET、监测和已审核规则，多跳重定向仍为已知边界缺口。

| 待运行用例 | 交付家数 / 门店距离 | evaluator | 耗时 / 模型 / Google / 等待 / 超时 | 产物与核验 |
|---|---|---|---|---|
| p1f-novel-kichijoji-tempura-20261020 | NOT_RUN | NOT_RUN | NOT_RUN | 认证前不得启动 |
| h001 Gold@7 | NOT_RUN | NOT_RUN | NOT_RUN | 将记录result、decisions、recording与交付后raw |
| h003 Gold@7 | NOT_RUN | NOT_RUN | NOT_RUN | 同上 |
| h004 Gold@7 | NOT_RUN | NOT_RUN | NOT_RUN | 同上 |

用量截至准备结束：真实模型新增0，累计799/1500；Google新增0，已确认累计16、历史完整UNKNOWN；正式Live新增0，起点32，批准本批4次后为36，另最多2次启动后环境重跑。preflight尝试0、环境预留2。固定传输组合中的脚本模型/Google次数单列在组合产物中，不计真实用量。

启动前和每次结束后按 `prep/README.md` 与用户原指令核对。不提前访问真实页面，不充值、不换Provider、不加回放，不推送。四次完成或触发停止条件后更新本报告和日志，仅本地提交，然后停下等待独立复核与签收。


## Immediate-start authorization (2026-10-12)

User: "批准你现在直接重跑，不等定时任务". Scheduled heartbeat p1-g-10-13-live PAUSED before execution. Only outer certification/start time validation changed to actual UTC2026-10-12T06:47:45Z-09:47:45Z (Tokyo15:47:45-18:47:45), retaining the original three-hour bound. Production9b34287, source inputs, budgets, post-delivery verification and stop rules unchanged. New execute SHA01fa1610ef8382ecd9e3d812f1672c38fed72a7943caa6b4896a17bcfd8d492d; certification SHA9031af83138a6269035e775d6f1ffc7af4d93db37c619604e66a43c08fb7bfe3. Offline dry-run early logs PASS, real network0. Authorization/old-new hashes in prep/early-start-authorization.json.


## Immediate execution facts

Outer time amendment committed af4dfd7. Witness certification at UTC2026-10-12T06:49:40.862Z (Tokyo15:49:40), valid until UTC2026-10-13T06:49:40.862Z. All three IDs13282321/13303321/13192886 returned HTTP200 and selection contains18:00; certificate classification KNOWN_FEASIBLE_SUPPORTED per approved stock criterion. Raw metadata/body in witness-certification-raw/, certificate witnesses.p1g.json; real model/Google0.

| Case / attempt | Preflight finish UTC | State | Formal Live / model / Google added | Evidence |
|---|---|---|---|---|
| Kichijoji #1 | 2026-10-12T06:50:04.510Z | Balance available, TableCheck503; no formal run | 0 / 0 / 0 | live/p1f-novel-kichijoji-tempura-20261020/attempt-1/{finish,preflight,balance.metadata,summary}.json |

The required 15-minute interval gives earliest second preflight UTC07:05:04.510Z (Tokyo16:05:04.510). No immediate retry or additional recovery probe. Cumulative still799/1500 models,32 Live,Google confirmed16,environment reserve2.

### Kichijoji formal result

Second preflight passed (TableCheck206). Formal SUCCEEDED / NO_VERIFIED_RESULT, evaluator@27 qualified result NO, system/evidence NOT_EVALUATED. 0 deliveries; 320806ms,47 model calls,1 Google,34100ms waiting/10.63%,browser timeout observed. No environment retry: this completed task is not treated as a startup environment failure. Location Kichijōji35.704096/139.58020539999998,radius1000m; address component colloquial_area/political retained, top-level Google types not retained by frozen Runner. Decisions47=47 calls. No attribution or signoff conclusion.

- resultPath: `"/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-12T07-05-23-849Z-02944629-b6dd-4ed8-83ae-2cc47e4416ac.result.json"`
- evaluationPath: `"/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-12T07-05-23-849Z-02944629-b6dd-4ed8-83ae-2cc47e4416ac.result.evaluation.27-1791789046374.json"`
- decisionCapture: `{"path": "/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-12T07-05-23-849Z-02944629-b6dd-4ed8-83ae-2cc47e4416ac.decisions.jsonl", "sha256": "14fd7a4c94482c96b237d6a3ae18f52a3aebbb58151d49d05de2d2618016d67f", "callsStarted": 47, "rowsWritten": 47, "errors": []}`
- recording: `{"path": "/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing/.eval-artifacts/recordings/hybrid-1791788723801", "screenshot": "LAYOUT_ONLY_CONTENT_MASKED", "replay": {"status": "NOT_REPLAYABLE", "reason": "UNSAFE_DOCUMENT"}}`

Postrun witness-only GETs at UTC07:10:45.132Z–07:10:46.250Z, all HTTP200, within10min; raw `live/p1f-novel-kichijoji-tempura-20261020/attempt-2/witness-raw/`. No delivery GET because0 deliveries. Cumulative846/1500 models,33 Live,Google confirmed17/full history UNKNOWN,environment reserve2.

### h001 formal result — target not demonstrated

SUCCEEDED preflight/TableCheck206; formal FAILED/LIVE_CASE_NOT_COMPLETED, loop REJECTION_LIMIT, phase FAILED,0 deliveries. evaluator@27 qualified result UNKNOWN, completion NOT_EVALUATED. 297997ms,30 model calls,3 Google,55089ms waiting/18.49%,browser timeout observed. Decisions30=30 calls. No environment retry. The L1 combination green does not close the actual Live REJECTION_LIMIT defect: this run still fails without a user-facing result. Record only under scope freeze; no code repair or attribution in this batch.

- resultPath: `"/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-12T07-11-53-308Z-c8e5fbf5-e7be-4f5a-a439-fc2dd79512ff.result.json"`
- evaluationPath: `"/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-12T07-11-53-308Z-c8e5fbf5-e7be-4f5a-a439-fc2dd79512ff.result.evaluation.27-1791789411577.json"`
- decisionCapture: `{"path": "/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-12T07-11-53-308Z-c8e5fbf5-e7be-4f5a-a439-fc2dd79512ff.decisions.jsonl", "sha256": "ee4058213bd2144dd8d076049d68a276a798c5f2944a6c1efa03b8aec95ecd54", "callsStarted": 30, "rowsWritten": 30, "errors": []}`
- recording: `{"path": "/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing/.eval-artifacts/recordings/hybrid-1791789113264", "screenshot": "LAYOUT_ONLY_CONTENT_MASKED", "replay": {"status": "NOT_REPLAYABLE", "reason": "UNSAFE_DOCUMENT"}}`

No delivery verification GET, no B witness GET. Cumulative876/1500 models,34 Live,Google confirmed20/full history UNKNOWN,environment reserve2.

### h003 preflight attempt1

UTC2026-10-12T07:17:50.171Z: balance available,TableCheck503; no formal run,0 model/Google/Live/environment retry added. Evidence live/h003/attempt-1/{finish,preflight,balance.metadata,summary}.json. Earliest attempt2 UTC07:32:50.171Z (Tokyo16:32:50.171); sequence h003 then h004 retained.

User requested a ten-minute retry at UTC07:27:56; h003 second attempt now scheduled not before UTC07:38:00, which also satisfies the original15-minute interval. Existing heartbeat updated, no one-hour delay. Main active turn continues; ledger/process checks prevent duplicate execution.

### h003 formal result

Second preflight passed (TableCheck206), user-requested ten-minute retry executed after original15-minute minimum; one formal run. SUCCEEDED/PRESENTATION_RECORDED,1 delivery: Aloft by Marriott Tokyo Ginza,TableCheck,150m,35.6688816/139.7656834. evaluator@27 qualified result UNKNOWN, evidence SUFFICIENT_FOR_PRESENTED_RESULT. 319326ms,47 model calls,1 Google,120239ms waiting/37.65%,browser timeout observed. Decisions47=47 calls. TableCheck post-delivery status TABLECHECK_RAW_TRACE_REVIEW; raw trace in live/h003/attempt-2/trace.jsonl, no Tabelog delivery so no find_vacancy GET. No attribution/signoff, no B witness GET, no environment retry.

- resultPath: `"/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-12T07-38-41-365Z-93be1159-74d2-40d6-b370-2c45bebda194.result.json"`
- evaluationPath: `"/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-12T07-38-41-365Z-93be1159-74d2-40d6-b370-2c45bebda194.result.evaluation.27-1791791041023.json"`
- decisionCapture: `{"path": "/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-12T07-38-41-365Z-93be1159-74d2-40d6-b370-2c45bebda194.decisions.jsonl", "sha256": "fe5f2f9f6b73b0c42050875c9d4dc3e22a547887a1aeaa9f05935853adb2d78d", "callsStarted": 47, "rowsWritten": 47, "errors": []}`
- recording: `{"path": "/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing/.eval-artifacts/recordings/hybrid-1791790721315", "screenshot": "LAYOUT_ONLY_CONTENT_MASKED", "replay": {"status": "NOT_REPLAYABLE", "reason": "UNSAFE_DOCUMENT"}}`

Cumulative923/1500 models,35Live,Google confirmed21/full history UNKNOWN,environment reserve2.

### h004 preflight attempt1

UTC2026-10-12T07:44:44.952Z: balance available,TableCheck503; no formal run,0 added model/Google/Live/environment retry. Evidence live/h004/attempt-1/{finish,preflight,balance.metadata,summary}.json. Earliest second attempt UTC07:59:44.952Z (Tokyo16:59:44.952), preserving approved15-minute spacing.

Final remaining h004 second preflight scheduled for UTC07:59:45 (Tokyo16:59:45 / Beijing15:59:45), not a one-hour delay. Existing thread heartbeat reconfigured; completion must update report/logs and local commit. No new calls at scheduling.

## 交付核对

63项离线产物／文档核对PASS，证据prep/final-verification.json：冻结12SHA、复核原稿SHA、预算、决策／调用计数、原始产物存在、六份见证GET原始SHA、运行后10分钟、preflight至少15分钟及新增日志／索引一致性。git diff --check PASS；P1-G和P1-F生产工作树CLEAN，暂无运行进程。仅运行和文档切片，复用B提交四门禁853/853；核对新增模型／网络均0。心跳已暂停，停止等待独立复核，不推送。


## P1-G2（2026-10-15）

Evidence status: exposed development evidence, real-state offline reproduction + L1; Live NOT_RUN as of this preparation record. Scope: only user-facing termination of the bounded read loop; no Prompt, Schema, Evaluator, qualification, source Guard, Gold, variants or old recording changes. User reports the P1-G independent review accepts Kichijoji/h003/h004 and leaves h001 INTERNAL_FAILURE; original reviews/P1-G-REVIEW-20261012 was not found locally or via accessible Page search, a path/link was requested. No claim is made that the original was read; the user-provided conclusions and explicit P1-G2 instruction define this batch.

### 真实状态先红后绿

Raw inputs remain in their original P1-F/P1-G frozen worktrees. Event-prefix reconstruction reaches exactly stateVersionBefore12 (P1-F) and11 (P1-G); both reconstructed SHA-256 values equal the original last trajectory stateHashBefore. Full raw page bodies were not copied into the fixture. New src/application/fixtures/p1-g2-h001-terminal-states.json stores scrubbed structure/codes with aliased strings/IDs and zeroed coordinates; source paths, hashes and extraction basis are recorded. State phase, failure code, eligible count, checkable count and END_READ rejection code are checked equal before/after scrubbing.

Both preterminal states have SEARCHING, failure=null, zero eligible results and33 checkable candidates. Thus the phase and failure checks were not the actual blocker. END_READ is rejected with PRESENTATION_EVIDENCE_MISSING / a bounded discovery-plan source remains unread. The coordinator samples now before dispatching READ_END_WINDOW_OPENED; runtime openedAt is later, so the captured now cannot see that window as active. The G recording has the actual window timestamp; the F state is tested with a monotonically advancing clock because that older run predates fixB. Direct Router probing can produce READ_ENDED_NO_VERIFIED_RESULT, but the old coordinator never reaches it after rejection. This qualifies the user's initial hypotheses with actual evidence, without attributing a page-local failure that was absent from these two states.

- Effective pre-fix red: P1-G2/red.log,2/2 desired-outcome assertions fail with actual FAILED; no model/network.
- Exact reconstruction and four-condition diagnostic: P1-G2/state-reconstruction.log.
- Both real-state terminal tests green; P1-G2/budget-stop-green.log and final npm-test.log. The same tests retain the expected NO_VERIFIED_RESULT assertion.

### 最小修复与证明范围

The system-owned AGENT_LOOP_TERMINATED event now derives NO_VERIFIED_RESULT directly in task-definition for a business stop; it does not propose or validate Agent END_READ. It clears the historical failure flag only on business completion and retains its code/message in remaining gaps, with actual checked candidates/providers, NOT_CHECKED candidates and unread discovery entries. It never claims all outlets have no seats. No new event/Schema or side-effect phase transition was added. The read-only phase transitions to NO_VERIFIED_RESULT are the minimal domain change.

Qualified presentation still uses the existing assessment, default short-batch window, Action Validator, Router and RESULTS_PRESENTED reducer checks. Its clock is sampled again after the window event is persisted. No evidence or eligibility requirement changed. Existing Agent-chosen END_READ validation remains intact. The two actual consumers (ordinary END_READ Router and terminal reducer) share the existing record-summary projection instead of duplicating it.

System failures are explicit: provider refusal/configuration/rate/network/timeout/malformed errors, uncaught execution/decision failures, unavailable browser runtime, authorization failures and uncertain side effects. Explicit execution-loss, cancellation and timeout termination categories retain their prior failure/cancellation handling; candidate BROWSER_RUNTIME_FAILED/BROWSER_TIMEOUT, AVAILABILITY_FAILED, unresolved location, individual search failure and shared model/step budget exhaustion are business gaps. Actual provider-rejected and thrown-Router-exception negative controls remain FAILED; authorization/uncertain-side-effect negatives cannot become business success. Restart/orphaned execution remains FAILED (W07 regression). No provider change/retry or new model call was introduced.

P1-G2/L1-artifacts retains the three actual production composition executions with installed Guard/network policies and an advancing clock (only external model transport/pages fixed): repeated rejection without eligible result → NO_VERIFIED_RESULT; repeated rejection with eligible result → existing window presents1; unresolved location/NO_PROGRESS → NO_VERIFIED_RESULT. evaluator@27: presentation completion SATISFIED; both no-result completions NOT_EVALUATED, not proof of source exhaustion. REJECTION_LIMIT/NO_PROGRESS/STEP_LIMIT and non-empty local failure are covered. Proof scope is real-state terminal-boundary regression + L1, not a claim that current external pages work.

### 门禁与未完成项

Final typecheck, arch:check, npm test and build PASS;862/862 default tests. Logs P1-G2/{typecheck,arch-check,npm-test,build}.log. Initial sandbox npm-test-sandbox.log hit localhost listen EPERM, then ran offline on host; npm-test-initial.log retained the two discovered regressions before final correction. The frozen legacy FAILED-budget acceptance expectation/Evaluator was not changed; its controlled test now honestly observes NO_VERIFIED_RESULT and rejection by the legacy expectation. Supporting summary P1-G2/offline-proof.json, related-green.log, L1-green.log.

Production fix commit `b55e91c9157c1b5fcae20cf25efb56155147863b`; frozen CLEAN host worktree `/Users/wangzhour/.codex/worktrees/p1-g2-live/Praxis-Zhixing` with existing local dependencies, source/Gold SHA checked against main. Evidence `P1-G2/production-freeze.json`. Live h001: NOT_RUN. Outer blocker: old execute.mjs hardcodes expired10/12 times/completed ledger/output paths, so changing only HEAD cannot execute the newly authorized batch; minimal batch metadata update was asked separately, no window bypass. No real model/Google/Live added; cumulative970/1500 models,36Live,Google confirmed22/full history UNKNOWN. Only1 formal h001 and at most1 startup-environment retry are authorized, total ceiling38; prior completed cases must not rerun. No push. Existing public-repository raw artifacts/HAR cleanup is outside this batch as requested.

P1-G2提交前核对：源码／文档／JSON的git diff --check通过；原始工具日志包含Node断言输出尾空格和npm结尾空行，原样保存，不为清空whitespace提示改写红绿证据。未跟踪的三份演示文件未触碰。

P1-G2离线修复已提交并冻结。复核原文在本机Desktop范围、可访问Pages及GitHub默认分支检索均未找到匹配；运行前待原文路径／链接，以及外层过期时窗、已完成账本／输出目录和新用量计数的最小同步答复。未修改或执行旧脚本，未调用余额GET／preflight／Live。依赖沿用既有本机目录内链接，不安装、不联网。

说明：未找到复核原文不改变用户本条已明确的批准／范围和转述结论；不声称已读原文。原文路径已询问，离线修复并不以此为审批前置。当前Live的实际约束是“外层只改冻结提交号”与已过期硬编码时窗／已完成账本的冲突，元数据同步答复尚未到达，不能自行绕过。冻结树真实状态回归9/9通过，日志P1-G2/frozen-state-green.log，0真实调用。

### P1-G2 h001补跑执行记录（用户直接指令后）

用户最新“跑一次h001”后，仅同步本次外层时窗、账本／输出路径、冻结号和用量基数，具体diff为P1-G2/outer-metadata.diff；balance/post-delivery/observe/reviewed-reads四份代码逐字不变。生产仍b55e91c/CLEAN，新execute SHA1b8851c17eb5488d11fd800c32ae8cce67dae94d0ca919e3f98e2a0355cb849a，9个冻结文件SHA一致。离线空跑P1-G2/dry-run.json PASS，0模型／网络；只允许h001 Gold@7。新账本起点970/1500模型、36Live，正式至37、启动后环境重跑最多1次、总上限38。

第1次preflight UTC2026-10-15T05:51:25.698Z启动，05:51:36.741Z结束：balance可用，DeepSeek200可达，Google公共入口10秒TLS／网络就绪超时（PREFLIGHT_TIMEOUT），尚未检查到Tabelog／TableCheck。正式运行未启动，0新增模型／Google业务／Live／环境重跑，evaluator不适用。证据P1-G2/live/h001/attempt-1/{finish,preflight,balance.metadata,summary}.json及run.log。最早第2次UTC06:06:36.741Z／东京15:06:36.741，保持15分钟间隔，不额外探测或改配置。


### 网络切换后的即时重试（第2次 preflight）

用户“你直接重跑一次，我切了tun和全局”明确要求即时重试。只为h001第2次preflight增加一次间隔例外，真实时间与账本保留；其余尝试仍至少15分钟。生产b55e91c/CLEAN、no-proxy、预算、Guard和交付后核验保持。重新冻结execute SHA `2fe4ab99c69bc11a7c181aec3973aab91be5e3b60c8ca77c0a764e8f70369a35`；9文件SHA和离线空跑通过，证据network-change-authorization.json、scripts/freeze.json、dry-run-after-network-change.json。此前1b8851c为第1次准备版本，已被本SHA替代。

| 尝试 | preflight UTC / 东京 | 结果 | 新增模型 / Google业务 / Live / 环境重跑 |
|---|---|---|---|
| h001 #1 | 05:51:25.698–05:51:36.741 / 14:51 | Google公共入口TLS超时，未到TableCheck | 0 / 0 / 0 / 0 |
| h001 #2 | 06:00:35.715–06:00:42.058 / 15:00 | DeepSeek200、Google404（可达）、Tabelog200；TableCheck403，PREFLIGHT_PUBLIC_ENDPOINT_REJECTED | 0 / 0 / 0 / 0 |

第2次外层总耗时8,764ms，preflight6,342ms；余额GET可用。正式h001尚未启动，没有result/decisions/recording或evaluator评价；evaluator为NOT_APPLICABLE（仅网络预检）。没有交付，故无交付后GET或见证GET。原始证据 `P1-G2/live/h001/attempt-2/{start,finish,preflight,balance.metadata,balance.body,summary}.json`、run.log、trace.jsonl；外层stdout为P1-G2/h001-outer-attempt-2.log。

累计仍970/1500模型、36正式Live、Google已确认22／历史完整UNKNOWN；本批启动后环境重跑0/1。共2次preflight均未正式启动，不计Live或环境预留。用户要求的这一次即时重试已完成，未安排自动第3次；若继续，仍余1次preflight，最早UTC06:15:42.058／东京15:15:42.058（现有时窗和500秒剩余约束仍适用）。只报告环境事实，不能以离线绿灯宣布Live故障关闭。生产未改，本次仅外层授权元数据和运行证据／文档；复用四门禁862/862，离线检查与真实网络预检分列。本地提交，不推送。

用户随后要求“等十分钟再试吧”；已复用本线程心跳安排UTC2026-10-15T06:18:00／北京时间14:18／东京15:18继续第3次preflight。该时刻也满足距第2次结束至少15分钟，无需再次改外层SHA或增加间隔例外。调度阶段0新增网络／模型／Live；执行前仍须检查最新消息、账本、冻结SHA和无重复进程。


### 十分钟后第3次 preflight：ENV_FAILURE，停止

按用户要求于北京时间14:18触发，实际外层UTC2026-10-15T06:18:55.173Z启动（东京15:18:55），06:19:04.966Z结束。启动前核对9文件SHA、b55e91c/CLEAN和无已有h001进程；execute仍2fe4ab99，未使用第2次的间隔例外。距第2次preflight结束18分15秒，满足原15分钟规则。

| 尝试 | preflight UTC | 状态 | 外层耗时 / preflight耗时 | 模型 / Google业务 / Live / 环境重跑新增 |
|---|---|---|---|---|
| h001 #3 | 06:18:57.192–06:19:04.931 | balance可用；DeepSeek200、Google404可达、Tabelog200、TableCheck403；PREFLIGHT_PUBLIC_ENDPOINT_REJECTED | 9,793ms / 7,738ms | 0 / 0 / 0 / 0 |

三次preflight用尽，本例归为ENV_FAILURE；不做第4次。h001正式Live仍未启动，交付家数／距离、地点解析、等待占比、浏览器超时均NOT_APPLICABLE；没有模型调用、业务Google请求或浏览器会话，亦无正式result/decisions/recording、evaluator@27评价、交付后GET／B见证GET。仅网络预检的evaluator适用性为NOT_APPLICABLE，不把预检文件冒充正式结果。证据：`P1-G2/live/h001/attempt-3/{start,finish,preflight,balance.metadata,balance.body,summary}.json`、run.log、trace.jsonl；外层日志`P1-G2/h001-outer-attempt-3.log`。每个文件SHA及冻结核对见`P1-G2/final-preflight-verification.json`。

本批累计0正式Live、0模型、0Google业务、0启动后环境重跑；整单仍970/1500模型、36正式Live、Google已确认22／完整历史UNKNOWN、P1-G2环境预留1未扣。三次网络预检和余额GET确实发生，不称零网络。生产修复仅完成真实状态离线复现＋L1，四门禁862/862保持；本次未证明修复在Live生效。无产品、Prompt、Schema、Evaluator、配置、Gold或变体更改，P1-F/P1-G旧树未动，Guard多跳重定向已知边界保持。按纯文档矩阵核对diff、链接、账本和证据，复用既有生产门禁；心跳p1-g-10-13-live已PAUSED。本地提交，不推送，停止等待独立复核。
