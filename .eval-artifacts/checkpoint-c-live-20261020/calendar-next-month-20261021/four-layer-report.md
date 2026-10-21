# 日历 V3 生产修复离线报告

Evidence status: **draft / not integrated；已暴露开发回放，非 Clean Baseline**。

**结论：未通过本轮验收。** 翻月选择54/69（78.26%），低于≥68/69；选店5/5、校准22/22和五门禁通过。保留完整74次单次输出，不改标签、不补跑、不启动Live。代码与结果推独立修复分支后停止，等待复核。

- 分支：`codex/fix-calendar-next-month`，基于远端集成`a3f6b84519d1bfdff271b5f87d88fa34450d40d1`。
- 采用V3依据：第0步独立复核`6d92882`，原文保存在`inputs/independent-review.md`；V1/V2未采用。
- 运行冻结提交：`b7f56b660c9a1fc017b792a01eb405ff83349383`；625项冻结文件全部复验一致。
- 冻结包SHA-256：`d065beef6675bdb0bc403a32326a956b83422e4632b93089ade434ba37b9709d`。
- Browser Prompt17→18；原Browser上下文未版本化，本次首次显式标`browser_read_context@1`。动作wire@11、Restaurant Context@15/Prompt@27、通用web-skills、thinking disabled、生产超时和输出上限不变。

## 1. 端到端结果

NOT_EVALUATED。本轮只有本地Fixture、保存页面重建、模型单步决策和历史产物校准；没有完整现实任务、当前库存、见证漏斗或QUALIFIED_DELIVERY结论。新完整Live/Google/网站访问均0。原检查点C五次Live、H003的S0及第0步实验结果均未改写。

## 2. 逐环节判定

| 评价对象 | 分母与结果 | 判断 |
| --- | --- | --- |
| V3生产观察预检 | 69/69真实Next month节点经Registry→Executor进入模型输入，公开替代文本/Calendar组/Oct2026/CLICK齐全 | PASS，仅覆盖这69点 |
| 翻月选择 | 54/69；15次选择PARTY_SIZE；69次API均成功 | **FAIL，要求≥68/69** |
| 翻月后执行核对 | Matsumoto受控Fixture到11月并选择日期；月份未变只改无关内容时NO_CHANGE/CALENDAR_MONTH_UNCHANGED | PASS，真实本地Chromium，0模型 |
| 控件归属与替代文本 | aria/title/img alt/svg title读取；多日历无法唯一绑定仍Unlabelled group | PASS，真实DOM Fixture |
| TableCheck H003边界 | 旧实现红灯接收器收到预约页；新Guard直接/显式allow/重定向均零到达；reserve子路径及编码段拒绝 | PASS，本地独立接收器 |
| P2-2五个选店种子 | 5/5 ACCEPTABLE；直接门店页13/13 | PASS，独立原标签不变 |
| 原22份校准 | 结果类型22/22、正常S0声明20/20、两中断声明未知2/2、交付子类型8/8、误判合格0 | PASS，评测器@30 / rubric@26，0模型 |
| 五门禁 | typecheck、arch:check、npm test977/977、build、真实Chromium126/126 | 全PASS |
| P2-1发现、P2-3价格及最终交付 | 本轮没有完整运行 | NOT_EVALUATED，不借选店或单步观察推导 |

69点仍是原19/17/16/1/16个决策点，不去重，不更改原答案；评分按保存DOM中的真正Next month锚点与新引用的元素同一性绑定，绝不按位置或泛称Next评分。答案未传给模型。每点原始响应、动作、耗时及usage见`model-results/`；完整逐点表见`decision-matrix.json`。

| 原运行 | 翻月正确/总点数 |
| --- | --- |
| c-01 | 15/19 |
| c-02 | 15/17 |
| c-03 | 12/16 |
| c-04 | 1/1 |
| c-05 | 11/16 |

**与第0步比较的限制：** 本次从保存HTML/CSS走实际生产Registry/Executor重建，69/69目标集合、64/69可见文本与第0步原观察不同；progress/history/skills保持一致。它是生产静态链路回放，**不是第0步的严格单变量复验**。不能将原V3的68/69与本次54/69直接解释为模型随机波动或V3生产退步；本轮严格门槛仍判失败，不放宽。差异明细见`reconstruction-comparison.json`。

历史HTML脱敏删除了日历锚点href尾部#；仅从原始captured observation恢复两锚点的精确href，记录原始HTML SHA、实际渲染SHA与restoredHrefs。控件标签/组/月标题均由生产代码读取，不手工注入实验V3观察。保存CSS由本地履行，缺失/非批准资源全部abort，页面脚本不运行；不执行任何真实按钮、时段或表单动作。

### Tabelog URL参数核查（只报告）

保存的2026-10-10零模型导航样本支持：`https://tabelog.com/en/tokyo/A1301/A130101/13280412/?svd=20261021&svps=4&svt=1800`加载后，DOM的is-current日期为2026-10-21，Guests active按钮和隐藏原生值均为4。证据是原始DOM，未调用生产parser；来源URL、最终URL、摘录与SHA见`url-parameter-audit/audit.json`及同目录原始材料。

因此该历史门店/日期/人数样本可由svd、svps初始化。不能推广至所有门店、11月或当前服务；该样本本身没有成功交付，svt时段不在本次认证范围。**未实现URL参数快捷路径，未访问网站验证。**

## 3. 严重程度与边界

- 15个严格翻月决策未命中不等于已发生S0或完整任务失败：模型选择的是目标人数，后续是否仍能翻月未执行。不得把它们改计为翻月正确。
- H003本地Guard反例证明禁止页面在修后零到达，包含同源重定向和更宽显式allow挑战；其他已审核公开读取不因这项撤销被整体取消。旧两条reserve菜单交付测试退役为两种动作顺序都无交付/UNKNOWN合同。
- 原22校准的S0越界证据为9份可评价无越界、13份证据缺口；不能报告全部S0=0。历史H003 S0 PRESENT保留，本次离线修复不抵消它。
- 本轮没有真实业务动作或库存复查，新的端到端S0–S4为NOT_EVALUATED；本地安全不变量与真实来源能力分开报告。

## 4. 归因与停止

最早的可见偏离是15点模型优先选人数而非独立绑定的翻月按钮；这些点均已有真实翻月文字、Calendar组与当前月份。观察字段缺失已补齐，但不足以证明当前单步优先级符合严格口径。15项分别只记一次决策偏离，不推导下游损失。

具体成因仍为HYPOTHESIS：静态重建与第0步输入存在上述差异，且没有完整任务反事实确认。后续应先离线对齐保存观察与生产重建的差异，再由复核者决定进一步验证；本轮不擅自加入V1/V2、不改评分、不追加付费调用，也不跑Live。

## 资源、冻结与复现

| 批次 | 模型调用 | 正确 | 平均请求墙钟 | 输入token | 输出token | reasoning token |
| --- | --- | --- | --- | --- | --- | --- |
| 翻月 | 69 | 54/69 | 1.890s | 889,477 | 8,605 | 0 |
| 选店 | 5 | 5/5 | 2.132s | 95,435 | 1,370 | 0 |

共74次API、0失败/重试；984,912输入+9,975输出token。批次墙钟141.30s；请求耗时不是完整用户等待时间。未查询价格或账单，不虚构货币费用。阶段模型账本1995→2069/4000，剩1931；完整Live仍7/100，环境重跑仍0/10，详情见`phase2-ledger-after.json`。

执行顺序：五门禁与0模型观察准备→冻结并提交b7f56b6→run-calibration.mjs保存自动输出SHA→原独立compare-calibration.mjs→run-model-replays.mjs（69+5，一点一次）。`freeze.json`记录625项SHA；运行后原样复验及生产/受保护输入无改动见`post-verification.json`。web-skills文本同时嵌入冻结payload，源文件与基线及运行提交一致。

已有默认测试978→977是两条过期reserve菜单成功测试合并为一条两顺序拒绝合同；Chromium122→126补真实失效点。中间失败、sandbox启动失败和最终通过日志分别保存，没有把启动问题当有效红灯。五门禁之后仅新增结果/报告，未修改冻结生产代码、输入或外层脚本。

机器汇总：`result.json`；原始模型输出：`model-results/*.json`；统计：`model-summary.json`；原始请求/输入：`prepared/*.json`；调用账本：`model-ledger.json`。本轮最终状态NOT_ACCEPTED，等待独立复核。
