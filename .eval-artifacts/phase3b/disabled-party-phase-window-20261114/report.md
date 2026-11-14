# D02-V 补评与人数早停／阶段窗口修复

2026-11-14 CET · 工作分支候选（not integrated）。本轮 0 Live / 0 网站 GET / 0 真实模型调用；不合 main、不跑 Held-out。

**原诊断补评已经完成。** 独立资格注释与原录制经未改动的评测器得到 `EVALUATED / qualified=true / QUALIFIED_DELIVERY / s0=0 / s0Status=PASS`，382/382 检查通过；证据分支 `codex/chore-category-guidance-live-evidence` 的 `0065675a5be24231251d013d3b382a3cfbb9cc67` 已推送。原383项中缺注释时才出现的条件性 `QUALIFICATION_QUOTE` 不再生成，未补造第383项或改写原评价。原241份运行文件与原 development-receipt 保留。

**修复范围为三个产品文件。** 通用推进循环观察到目标人数禁用后，以既有公开选态或来源完成谓词的 DATE 确认限定同一日期，立即返回 `PARTY_SIZE_NOT_SELECTABLE`；适配器保留原因，库存仍为 UNKNOWN。Domain 仅对同一请求指纹的 AVAILABILITY 排除无益 FACTS 补读，推荐与条件改变仍可核对。非直达核名搜索完成后结算该范围，再开启45秒查位范围；候选总90秒、累计模型和操作预算不重置，直达与 identityOnly 不变。Prompt、Skill、Guard、G1、评价器与时限数值未改。

**真实录制组件红→绿。** 630a 的 DOM26→28→29…44 与 HAR45 保留校验哈希；原代码17次推进/80操作耗尽，修后2次推进/20操作在DOM29早停。未有来源日期确认的反例仍不声明人数不可选，按原80操作预算停止。真实Chromium原生点击后切换下一份已捕获DOM，以补足清洗录制中缺失的站点监听器；这属于明确标注的组件级 LOCAL_CONSTRUCTION，不是完整网站Replay或修后Live成绩。单位测试验证15秒搜索+44秒查位可用、46秒查位仍超时、总89秒可用/91秒仍超时及跨阶段调用和操作累计；并验证原因保留与请求指纹隔离。

**产品门禁全部通过。** 初轮默认1650/1652暴露重复调用完成谓词与旧阶段生命周期断言；原失败保留。前者保留终端完成谓词只评估一次，只有推进循环在缺少公开日期选态时才额外使用已有来源DATE确认；后者改为明确三个阶段并保留累计预算断言，定向4/4通过；最终源码冻结 `4b4b56d2541a3039cecdce468d11e2072cf08429`，同SHA净树 typecheck/arch/build、默认1652/1652、Chromium289/289、G6 159/159全部PASS且0跳过。后两者由既有 `test:browser:fixture` 串行执行，无须重复消耗。另一次默认测试因沙箱禁止本地127.0.0.1监听失败，原日志保留；授权本地夹具权限后原命令全绿。

**保护与边界。** 主工作区HEAD/diff/status（含NUL格式）与9份历史账本哈希一致；原运行文件和收据一致。相对ead28945、32b97ed8和27bdb97a的新增产品写死扫描均0。现有旧全量工作树的管理check仍报需保全审计，已保留日志，按本机规则不擅自收起、重配或另建树；这不是通过的工作树检查。原审批草案和失败日志作为 superseded retrospective 留存，当前实现以冻结源码为准。

门禁原始记录：[gates-authorized/results.json](gates-authorized/results.json)；[保护结果](protection-result.json)；[最终扫描](scan-final-summary.json)。全量门禁结束后只同步本批次报告/文档/日志，产品与测试blob不变。
