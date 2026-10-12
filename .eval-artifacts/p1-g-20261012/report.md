# P1-G 收尾小批报告

Evidence status: exposed development evidence; L0/L1 offline verification complete, Live pending. P1-F暂不签收；本报告不代替独立复核。

截至2026-10-12东京15:45，尚未到批准的10/13运行时窗。

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
