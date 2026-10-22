# C18 离线验收停止报告

状态：**STOPPED_OFFLINE_MECHANICAL_GATE_FAILED**。依据复核fbb200ec和用户连续步骤授权，保留所有失败，停止于离线阶段。c-17未补跑，留出集未读取。

四条天妇罗均变为CONSISTENT，S1_UNSUPPORTED为0，Kaga两条已单列PRODUCT_UNKNOWN_EXTERNAL_SUPPORT；但单向包含引入Utou三条MISSED_KNOWN_CONDITION，C18“无MISSED”门槛不满足。已将同一真实来源回归纳入默认npm test，保留预期MET的红灯，不以原局部测试全绿替代实际链路。

## 第一层：端到端结果

本轮新增Live0、真实模型0、网站0、Google0。原C18的18份实际运行及其原31/32评价不改；已复核@32实际结果仍为12QD、4未评、1能力漏失、1诚实无结果，不能把展示反事实当新Live。

保存材料中的13份有展示产物重建私有来源元数据，经生产ModelRestaurantFactJudgment（脚本化原选择，共33次）、真实Router→Reducer重做展示，再由独立@33评价；另外5份无展示明确N/A。13份新评价均已保存，Gate断言失败使原脚本退出1；[停止记录](display-evaluation-stopped.json)保留全部输出和输入SHA。

## 第二层：逐环节 / P2-1、P2-2、P2-3

P2-1/P2-2本轮未重跑：旧C18首批登记见证21/48（含未认证Komuro，非认证召回率）、选中直接门店页路径91项（非成功读取数）仅作历史定位。

P2-3本轮：27家交付记录、40条条件，35 CONSISTENT、3 MISSED_KNOWN_CONDITION、2 PRODUCT_UNKNOWN_EXTERNAL_SUPPORT、0 S1_UNSUPPORTED。H002三条价格仍显示MET且独立一致。完整每条状态、字段、原文、来源引用和前后变化见[condition-changes.json](condition-changes.json)、[result.json](result.json)及display-evaluations-33/。

| 已修项目 | @32旧展示回放 | 本轮@33 |
| --- | --- | --- |
| c-06 / 13320287 tempura | MISSED_KNOWN_CONDITION | CONSISTENT（MET） |
| c-10 / 13320287 tempura | MISSED_KNOWN_CONDITION | CONSISTENT（MET） |
| c-10 / 13282321 tempura | MISSED_KNOWN_CONDITION | CONSISTENT（MET） |
| c-14 / 13192886 tempura | MISSED_KNOWN_CONDITION | CONSISTENT（MET） |
| c-05 / 13048623 Kaga | MISSED_KNOWN_CONDITION | PRODUCT_UNKNOWN_EXTERNAL_SUPPORT（独立MET，产品NOT_CHECKED） |
| c-09 / 13048623 Kaga | MISSED_KNOWN_CONDITION | PRODUCT_UNKNOWN_EXTERNAL_SUPPORT（独立MET，产品NOT_CHECKED） |

@33将独立真值与产品可知性分开：当前商家字段/原始价格有适用支持才可计MISSED；仅外部标注、见证或人工解释支持时单列外部支持。若产品原始商家字段也有支持，其产品可知性优先，不因另有见证而豁免。MET对独立NOT_MET仍为S0，MET无独立支持仍为unsupported；不放宽S0规则。校准22/22，正常S0声明20/20，原13条历史越界证据缺口仍未评。

## 第三层：严重程度与停止门槛

| 门槛 | 实际判断 |
| --- | --- |
| 天妇罗四条CONSISTENT | PASS 4/4 |
| 不新增S1_UNSUPPORTED | PASS，本轮0 |
| 五门禁全绿 | FAIL：新增默认Utou回归测试失败；最终门禁细节见gates.json |
| C18回放无MISSED（外部支持除外） | FAIL：Utou c05/c09/c13各1条，不属于外部支持 |
| H005 c17补跑 / 四TARGET每例≥2QD | NOT_STARTED；不消耗唯一环境重跑 |
| 留出集准备、认证、18次、措辞抽取 | NOT_REACHED，未打开留出分支内容 |

@33这13份展示回放：S0声明12 ABSENT／1 NOT_EVALUATED，越界13 ABSENT；旧c17后验GET缺正文仍未评。已复核原C18越界18/18 ABSENT不被改写；未把未知报告为全阶段S0=0。

| 新的展示回归 | @32旧回放 | @33独立支持 | 本轮产品展示 | 诊断 |
| --- | --- | --- | --- | --- |
| c-05 / 13300814 / criterion:0 kaiseki | CONSISTENT / MET | MET / PRODUCT_OBSERVED | NOT_CHECKED | MISSED_KNOWN_CONDITION |
| c-09 / 13300814 / criterion:0 kaiseki | CONSISTENT / MET | MET / PRODUCT_OBSERVED | NOT_CHECKED | MISSED_KNOWN_CONDITION |
| c-13 / 13300814 / criterion:0 kaiseki | CONSISTENT / MET | MET / PRODUCT_OBSERVED | NOT_CHECKED | MISSED_KNOWN_CONDITION |

## 第四层：归因、证据、版本和资源

Utou原始模型所选语句为：Seasonal Omakase Course "Katsura" ◆ Kaiseki with Exquisite Ingredients of the Day8 items。商家COURSE_TITLE字段到“Day”结束，“8 items”属于相邻计数字段。严格的字段⊇整条所选语句无法接纳该标题，导致角色消失；独立@33仍能在产品已观察的本店课程字段中证明kaiseki。因此三条是真实展示漏显，不能按外部支持豁免。

[Utou红灯](utou-regression-red.log)通过实际判断适配器→Router→Reducer复现三条NOT_CHECKED，预期仍为MET。该回归现在进入默认套件；最终默认失败日志见[default-test-final.log](default-test-final.log)。[原天妇罗红灯](tempura-red.log)、[评测器红灯](evaluator33-red.log)、[相关198项绿灯](focused-final-green.log)及完整独立评价保留；局部绿灯没有覆盖这个跨字段标题场景，整批回放揭示了缺口。

版本：Evaluator32→33、rubric28→29。State19/TaskDefinition17/condition-states3、FactPrompt14/Schema4、BrowserPrompt19/Context2的线格式未变。名称/评论不证明HARD；同店、HIGH身份、同来源、邻店/隐藏排除和餐段限制继续保留。

没有为通过门槛再添加双向包含路径或改写历史摘录。后续需复核明确：在增加字段⊇语句路径的同时，如何保留已完整选中的商家字段（只引用完整包含的较短原文，不做部分重叠或扩大到未选文字）。本轮不自行改变这项匹配口径。

累计账本保持模型2827/4000、完整Live31/100、正式环境重跑0/10；c17那一次尚未使用，仍需遵守2026-10-22 20:23北京时间截止。未执行任何网站请求、认证、源站探针或真实模型调用。浏览器只跑本地Fixture。

输入冻结：回放 ac69232d1ae11e11e0df167c82c4cdb19eed1337fb50db1d19d3a08d4fd6c838；@33评价 15fa3b17cd14d3d4289973b96abe2cdc22ed63bd9e484ccbdec6357f98372b1d；校准 db2cf924bf0e24ab53a5d6133dcad45b4dc8920338f695b4c1ea036e9f0a4527。评价前后2738项已核SHA，原始材料/原评价和账本的最终核对见integrity-verification.json。最终停止交付冻结见delivery-freeze.json。

源代码/输入/脚本在对应评价段运行中未改；Gate失败后只补默认回归、停止报告与证据，没有继续跑Live。推送codex/chore-checkpoint-c-prep后停下等复核，不向集成分支推送。
