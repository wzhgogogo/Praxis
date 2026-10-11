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
