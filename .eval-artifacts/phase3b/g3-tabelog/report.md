# G3 Tabelog：按受保护文件顺序停止

2026-10-28，Vienna CET（UTC+1）。状态：**STOPPED_PROTECTED_FILE_ORDER**。只读诊断/已暴露固定页基线，不是G3实现完成或真实任务验收。

## 已完成的G1发布

用户接受的G1 dd87cfbb与A时序修复main54b3dd2b已整合；受测2ccaab58，五门禁默认1196/1196、Chromium175/175（106.836秒）及普通G2 4/4全绿，每项前后净树、restore0。main及G1分支已原子推送并用ls-remote核对为 **eb1518f1ad3f4fa8da4469c993b02d1b9f15ccf8**；main工作树干净。完整证据见 [整合报告](../g1-quality-main/report.md) 和 [远端回执](../g1-quality-main/delivery.json)。旧HARD44,197字节同SHA，新增真实调用0。

本G3分支 **codex/feat-phase3b-tabelog-observed-availability** 从此最新main建立，A可独立进行六题重跑；本对话不运行模型，不等A评测。

## 用户最新验收决定

用户2026-10-28明确：适配器行数不再是验收条件，只记录参考；验收以 `PRAXIS_G2_REQUIRE_PASS=1` 和真实任务行为为准，目标是Agent观察页面并行动。

按仓库Accepted ADR的变更规则，新增 **ADR-0047 Accepted** 记录用户直接决定，0046只增加部分替代元数据，原Decision和历史报告保留。当前Tabelog目标是Agent观察日历→引用日期/时段/人数/状态→代码核对；find_vacancy保留数据证据、结构漂移有SOURCE_STRUCTURE_CHANGED。两站3,878/Pack478只是参考；本批没有行数增减或压缩任务。TableCheck仍等首次Live阳性日历。

## 必须先安排的文件顺序

用户第3条明确：G3若需要改C正在修改的两个文件，先停下报告，由复核者安排顺序。只读调用链核查发现，完整日历任务切片需要编辑 **src/integrations/tabelog/tabelog-browser-availability.ts**，最小职责范围如下：

| 当前位置 | 为什么与G3直接相连 | 后续所需接线 |
|---|---|---|
| tabelogAvailabilityCompletion，43–48行 | 完成判定目前只调用同步私有解析/选中核对 | 接纳同次页面观察的已核对日历语义依据，保留来源就绪与请求绑定 |
| selectedDateField/selectedPartyField，127–135行；readMatchedOutlet，587–597行 | 检测字段后直接选择固定日期/人数，失败即结束，操作分支在受保护文件里 | 调整为Agent根据当前观察行动，已有selector加速失配后继续读页面 |
| readMatchedOutlet，613–624行 | runSkill目标、completion回调及最终选中核对均在此；当前BrowserGenericReadResult只返回snapshot/controls | 将Agent原文提议与本次观察、日期/人数/时段/状态核对接入现有预算和取消链 |
| readMatchedOutlet，635–655行 | 当前解析结果直接形成AVAILABLE/NO_MATCHING_SLOT并ground；此处决定错误/缺证如何对外可见 | 将核对后的依据与结构漂移告警接入最终结果；缺证如实未知，保留HARD/价格/餐期等核验 |

共享Browser当前 COMPLETE 只有reason字段（browser-action-decision.ts），completion是同步回调，返回结果没有日历逐字引用契约。仅替换page-parser/query-controls的选择器，无法把新增Agent原文证据接入上述实际任务链路；把解析器静态G2跑绿也不足以证明这一纵向任务已完成。当前不实现绕过文件归属的全局状态、隐藏侧通道或把站点代码搬到共享层的方案。

**本次需要安排的是browser-availability文件。tabelog-entity-resolver.ts当前无需修改，保持原字节。** 两个保护文件的SHA在诊断前后相同，见 [verification.json](verification.json)。复核者可安排C排序改动先合入main，再让B从最新main继续该文件的日历接线；也可明确划定顺序，本分支不自行抢占。

## 严格G2基线红灯

受测提交 **8cc386a67809e54a8951798a45debe2159c5495b**，674份源码/固定输入/脚本先冻结后执行：

`PRAXIS_G2_REQUIRE_PASS=1 npm run test:dom-change`

21.470秒，4项检查中3通过、1失败；目标断言为 **tabelog-list-nerima: G3 requires PASS; current baseline only admits the same honest loss**。这是当前基线已有缺口在严格验收下的有效红灯，尚未实施修复。该测试在首个严格断言失败后没有继续判定其余页的严格验收；不宣称Tabelog全部已测通过。[原日志](strict-baseline/strict-g2.log) / [结构化记录](strict-baseline/strict-g2.json)。前后git status为空，输入SHA不变，无skip/cancel，真实调用0。

## 测试与实现变更清单

本G3分支相对发布main的 **src/scripts/web-skills/package/tsconfig可执行差异为空**，未删私有逻辑，未删除/改写任何测试；因此没有“每删一项私有依赖”的实施绿灯。A已接受的时序修复和其余测试保持不动。只新增决定/计划/阻点/基线日志及审计文档。

生产树不变，复用本轮刚在相同代码上通过的G1整合五门禁及普通G2；没有为纯文档再次跑五门禁。G3严格G2保持红灯、真实任务行为未实施/未验收；两者都不是通过状态。后续解除文件顺序阻点后，每项私有依赖的替换仍须有效红绿及完整链路验证。

## 预算与交付

本批G3新增真实模型、Google、餐厅网站、Live、环境重跑、评测公开GET均0。未读取.env、未读取或哈希answers*.json。预算原409条全部保留，追加本诊断0调用，共410唯一id。相关状态/DEVLOG/TEST-LOG/月度索引同步。

只推本G3工作分支供复核，不合main。**按用户第3条停下，等待复核者安排C与B的文件修改顺序。** 实际分支推送回执附delivery.json；未核对前不宣称已推送。

## 已核对的工作分支交付

2026-10-28T15:06:02.078237+01:00：报告提交16af555ab227a55b189d0a268b7cae326f6bd650已成功推送，ls-remote匹配；main仍为G1发布eb1518f1，G3未合main。674输入SHA、受保护文件和可执行树不变，追加回执前两工作树均干净。[delivery.json](delivery.json) / [refs](push-verified.refs)。回执只改审计产物，也推同一工作分支。
