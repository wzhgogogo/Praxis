# P1-F B 部分报告

Evidence status: execution pending；不是 Live 或签收证据。


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


## 外层输入路径已获批准并修正

用户明确批准修正输入路径并重新冻结；execute仅把A sourcePath根从主树改为冻结工作树，其他行为不变。rev2原样复制到冻结工作树忽略目录，两端SHA `1879c3189f90134f2ddb4cc78b12fcc31a0cd68e7b806a2baec43270e6f9f753`；冻结Runner真实caseSourceFromArgs函数离线校验PASS，A/B空跑PASS。共享execute最终SHA `ff567ad81e3ca59fc6ab4449a997a12c167751f305edd601c4158b56cf9d9c61`；入口continue-a.mjs、run-b.mjs及其他依赖SHA不变。详情 `prep-20261012/input-path-resolution.json`，新旧脚本/manifest保留。此前路径阻塞是历史记录，现已解除；h003第2次preflight/运行已发起，距上次超过15分钟。生产仍73bfca5/CLEAN，不改产品、Prompt、Schema、配置、原文或见证。


## 2026-10-12 B h001–h004提前运行记录（事实记录，待独立复核）

生产冻结 `73bfca5`／干净宿主机工作树；原文与semantic使用批准rev2（B用正式Gold@7），500秒／50模型／40Google，record-browser、record-decisions、no-proxy，原生发现。复核原文949b86f、加载526fab6、外层准备947b8e3、批准时窗bde135a、批准输入路径8180082；已记录四门禁849/849及空跑。最终共享execute SHA `ff567ad81e3ca59fc6ab4449a997a12c167751f305edd601c4158b56cf9d9c61`，入口及其余依赖见prep-20261012/scripts/freeze.json。已知Guard多跳重定向缺口保留，不声称完整只读边界已验证。

### Preflight尝试

| 用例 | 尝试 | 东京时间 | 状态 | TableCheck HTTP | 路径 |
| --- | --- | --- | --- | --- | --- |
| h001 | 1 | 2026-10-12T05:51:36.009000+09:00 | SUCCEEDED | 206 | /Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-f-20261011/part-b/h001/attempt-1 |
| h002 | 1 | 2026-10-12T05:58:04.860000+09:00 | SUCCEEDED | 206 | /Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-f-20261011/part-b/h002/attempt-1 |
| h003 | 1 | 2026-10-12T06:01:25.308000+09:00 | SUCCEEDED | 206 | /Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-f-20261011/part-b/h003/attempt-1 |
| h004 | 1 | 2026-10-12T06:03:41.134000+09:00 | SUCCEEDED | 206 | /Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-f-20261011/part-b/h004/attempt-1 |

### 运行逐行表

| 用例 | 执行／阶段 | 交付家数 | evaluator@27 | 秒 | 模型 | Google | 等待ms／占比 | 浏览器超时 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| h001 | FAILED / FAILED | 0 | UNKNOWN / NOT_EVALUATED / NOT_EVALUATED | 365.091 | 28 | 3 | 49927 / 13.68% | True |
| h002 | SUCCEEDED / PRESENT_RESULTS | 1 | UNKNOWN / PRESENTATION_RECORDED / NOT_EVALUATED | 185.704 | 21 | 1 | 21276 / 11.46% | False |
| h003 | FAILED / FAILED | 0 | UNKNOWN / NOT_EVALUATED / NOT_EVALUATED | 60.324 | 4 | 1 | 12486 / 20.7% | False |
| h004 | FAILED / UNDERSTANDING | 0 | UNKNOWN / NOT_EVALUATED / NOT_EVALUATED | 0.747 | 1 | 0 | 0 / 0% | False |

### h001

- 未交付。
- 地点解析／圆心：{"latitude": 35.6619707, "longitude": 139.70379499999999, "radiusMeters": 1000, "label": "Shibuya", "areaMatchBasis": "NAMED_PLACE_RADIUS", "addressComponents": [{"longText": "Shibuya", "shortText": "Shibuya", "types": ["locality", "political"]}, {"longText": "Tokyo", "shortText": "Tokyo", "types": ["administrative_area_level_1", "political"]}, {"longText": "Japan", "shortText": "JP", "types": ["country", "political"]}]}。原始Googleplace types未被冻结Runner保留时不补造，addressComponents.types原样在summary。
- result：/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T20-51-39-041Z-2e7d16f6-1c88-438f-ab51-f988c058492c.result.json
- decisions：/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T20-51-39-041Z-2e7d16f6-1c88-438f-ab51-f988c058492c.decisions.jsonl；28条，等于模型调用：True。
- recording：/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/recordings/hybrid-1791751898968
- evaluator：/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T20-51-39-041Z-2e7d16f6-1c88-438f-ab51-f988c058492c.result.evaluation.27-1791752264658.json
- 本例summary：/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-f-20261011/part-b/h001/attempt-1/summary.json
- stop：null。

### h002

- Ginza Sushi Sendou；来源 TABELOG, MODEL_JUDGMENT；距圆心 390 m。
- 地点解析／圆心：{"latitude": 35.669700299999995, "longitude": 139.7671399, "radiusMeters": 1000, "label": "Higashi-ginza Sta.", "areaMatchBasis": "NAMED_PLACE_RADIUS", "addressComponents": [{"longText": "１０先", "shortText": "１０先", "types": ["premise"]}, {"longText": "10", "shortText": "10", "types": ["sublocality_level_4", "sublocality", "political"]}, {"longText": "4-chōme", "shortText": "4-chōme", "types": ["sublocality_level_3", "sublocality", "political"]}, {"longText": "Ginza", "shortText": "Ginza", "types": ["sublocality_level_2", "sublocality", "political"]}, {"longText": "Chuo City", "shortText": "Chuo City", "types": ["locality", "political"]}, {"longText": "Tokyo", "shortText": "Tokyo", "types": ["administrative_area_level_1", "political"]}, {"longText": "Japan", "shortText": "JP", "types": ["country", "political"]}, {"longText": "104-0061", "shortText": "104-0061", "types": ["postal_code"]}]}。原始Googleplace types未被冻结Runner保留时不补造，addressComponents.types原样在summary。
- result：/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T20-58-07-664Z-adafcfae-1cf2-4f1a-82d7-bda866227f9a.result.json
- decisions：/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T20-58-07-664Z-adafcfae-1cf2-4f1a-82d7-bda866227f9a.decisions.jsonl；21条，等于模型调用：True。
- recording：/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/recordings/hybrid-1791752287587
- evaluator：/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T20-58-07-664Z-adafcfae-1cf2-4f1a-82d7-bda866227f9a.result.evaluation.27-1791752474437.json
- 本例summary：/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-f-20261011/part-b/h002/attempt-1/summary.json
- 交付后Tabelog四参数GET：2026-10-11T21:01:13.809Z，HTTP200；/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-f-20261011/part-b/h002/attempt-1/post-delivery-raw/13295658.body.txt；selection核对状态 DISPLAYED_TIMES_PRESENT，不归因。
- stop：null。

### h003

- 未交付。
- 地点解析／圆心：{"latitude": 35.6697, "longitude": 139.767, "radiusMeters": 1000, "label": "nearby", "areaMatchBasis": "TASK_LOCATION_RADIUS", "addressComponents": [{"longText": "１２", "shortText": "１２", "types": ["political", "sublocality", "sublocality_level_4"]}, {"longText": "５丁目", "shortText": "５丁目", "types": ["political", "sublocality", "sublocality_level_3"]}, {"longText": "銀座", "shortText": "銀座", "types": ["political", "sublocality", "sublocality_level_2"]}, {"longText": "中央区", "shortText": "中央区", "types": ["locality", "political"]}, {"longText": "東京都", "shortText": "東京都", "types": ["administrative_area_level_1", "political"]}, {"longText": "日本", "shortText": "JP", "types": ["country", "political"]}, {"longText": "104-0061", "shortText": "104-0061", "types": ["postal_code"]}], "addressObservation": {"source": "GOOGLE_GEOCODING", "observedAt": "2026-10-11T21:01:33.920Z", "status": "OBSERVED"}}。原始Googleplace types未被冻结Runner保留时不补造，addressComponents.types原样在summary。
- result：/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T21-01-28-861Z-d803c7d7-1f1f-4eaf-b04b-147ebe968cd6.result.json
- decisions：/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T21-01-28-861Z-d803c7d7-1f1f-4eaf-b04b-147ebe968cd6.decisions.jsonl；4条，等于模型调用：True。
- recording：/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/recordings/hybrid-1791752488786
- evaluator：/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T21-01-28-861Z-d803c7d7-1f1f-4eaf-b04b-147ebe968cd6.result.evaluation.27-1791752549259.json
- 本例summary：/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-f-20261011/part-b/h003/attempt-1/summary.json
- stop：null。

### h004

- 未交付。
- 地点解析／圆心：null。原始Googleplace types未被冻结Runner保留时不补造，addressComponents.types原样在summary。
- result：/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T21-03-44-141Z-e0a19b72-6adf-4a8d-bd09-c3f7826b67c9.result.json
- decisions：/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T21-03-44-141Z-e0a19b72-6adf-4a8d-bd09-c3f7826b67c9.decisions.jsonl；1条，等于模型调用：True。
- recording：/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/recordings/hybrid-1791752624063
- evaluator：/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T21-03-44-141Z-e0a19b72-6adf-4a8d-bd09-c3f7826b67c9.result.evaluation.27-1791752624852.json
- 本例summary：/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-f-20261011/part-b/h004/attempt-1/summary.json
- stop：null。

本次累计账本：模型752/1500（本轮基线602，新增150）；Google已确认15（基线7，新增8），历史两次中断缺计数，完整累计UNKNOWN；整单Live31/33（基线24，新增7）；环境预留2（基线2）。preflight未正式启动不计Live或环境重跑；启动后只有证据明确的环境失败可重跑一次。UNKNOWN/NO不自行改签收分类，留给独立复核按Playbook§10逐条判定。

完整逐例和逐尝试证据：/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-f-20261011/part-b/2026-10-12 B h001–h004提前运行记录.summary.json。后续未运行例不冒充完成。


## B h001–h004 段末补充：余额阻塞与外层记录限制

本段4例均已正式启动并按evaluator@27评价。h001终止为AGENT_LOOP_REJECTION_LIMIT；h002已展示Ginza Sushi Sendou、390米，公开四参数GET返回selection含18:30，原响应保留。h003最后一次Agent调用、h004语义调用均收到DeepSeek HTTP402、PROVIDER_REJECTED、Insufficient Balance。h004启动时尚未完成h003的402诊断，结果原样保留。两例不符合批准的环境重跑定义，没有重跑，环境预留仍2。API原始错误及调用证据见prep-20261012/provider-balance-block.json；不据此做产品能力归因。

h004外层日志匹配误把正式result当preflight，末尾打印又抛TypeError；finish、正式result、decision和evaluator已保存。原错误记录不改，另存preflight.recovered.json（runtimeContext指向的真实preflight，TableCheck206），报告引用恢复证据，正式Live与1次失败模型调用均计入账本。仅报告汇总读取恢复文件；冻结execute及其他脚本SHA不变，不修运行代码。

原版h005尚未启动：preflight0、模型0、Live0；仍限定东京2026-10-12 11:30–14:00。心跳保留，但执行前须有人类确认DeepSeek余额恢复；未恢复或超过窗口则记录未跑，不自动充值、付款、换Provider或补跑h003/h004。账本externalBlocker与stop分列，未出现已定义安全停止信号；Guard多跳重定向仍为已知边界缺口。

段末冻结文件SHA全部一致、生产73bfca5/CLEAN；4例决策条数28/21/4/1均等于模型调用数。仅事实报告切片，复用评测准备四门禁（849/849），未新增代码变更或网络验证。验证证据prep-20261012/b-h001-h004-verification.json。段末累计752/1500模型、31/33整单Live、Google已确认15（历史完整累计UNKNOWN），环境预留2。待独立复核签收。
