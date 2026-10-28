# Development Log

2026-10-28 CET：G4续跑收尾，旧29 ENVIRONMENT_FAILURE 7；CORRECT_ACCEPTED 13；NOT_ACCEPTED 9；新8 CORRECT_ACCEPTED 6；ENVIRONMENT_FAILURE 1；NOT_ACCEPTED 1；前四家独立复跑 CORRECT_ACCEPTED 4。新增GET73/112、模型5，基准累计GET188/模型19/40，Google/Live0；共享GET218/257。生产b250bb17与原证据未改，完整性PASS；结果交复核，不调整规则。 报告 `.eval-artifacts/phase3b/g4-e2e-continuation/report.md`。

2026-10-28 CET：用户批准G4续跑新增GET≤112、共享上限257；补齐12家后单独复跑前四家，原结果保留。生产固定b250bb17，模型累计≤40（已14），Google/Live0；预先冻结后执行，当前新增调用0。报告 `.eval-artifacts/phase3b/g4-e2e-continuation/report.md`。

2026-10-28 CET：G4因GET115额度停止。旧29正确10/错认0/未接纳8/环境失败7/中断1/未运行3；新8全部未运行，完整37家尚未验收。模型14/40、Google/Live0，共享GET145/150。前四家复跑已登记，尚未执行；剩余12项加复跑4项最多需112 GET，待明确新增额度。main已合b250bb17，B可继续G3。报告 `.eval-artifacts/phase3b/g4-e2e/report.md`。

2026-10-28 CET：C已合main并推送b250bb17（ls-remote核对），B可开始G3。G4获批37家身份端到端前缀评测另开证据分支，GET115/模型40/Google0/Live0，3b GET总额150，实际开始前30。静态HTTP运行边界及失败/停批口径见 `.eval-artifacts/phase3b/g4-e2e/report.md`；生产规则不改。

2026-10-28 CET：C按批准同步已合入的B G1（main6fa60cda含dc486430），ccf7aa5d六项门禁全绿，逐项前后净树。共享108条账本按id并集，模型40/GET30/Google11/Live0，未加载凭据。现在按用户授权合main，随后G4新37家基准独立执行，旧12/29不冒充端到端结果。 [报告](../../.eval-artifacts/phase3b/c-integration/report.md)。

- Status: Accepted
- Document revision: 4.333


- Last updated: 2026-10-28
- Source of truth for: 非trivial开发与文档变更的时间记录
- Related ADRs: [ADR Index](../decisions/README.md)
- Related documents: [Current Status](../STATUS.md), [Roadmap](../roadmap.md), [Test Log](TEST-LOG.md)

> Historical record only. Current capabilities and next gate are maintained in [Current Status](../STATUS.md).

## DEV-2026-10-28-G1-QUALITY-MAIN-VERIFIED

2026-10-28 CET: Reviewed G1 dd87cfbb synchronized with main54b3dd2b accepted A clock repairs. Frozen2ccaab58/681 inputs: five gates1196/175 PASS (106.836s), ordinary G2 4/4, each before/after clean and restore0. Reviewed G1 source/HARD44197 bytes unchanged; ledger409 ids preserves both sides, new real calls0. User authorizes main publication; then new G3 Tabelog branch, protected C files untouched pending file-order review. [Report](../../.eval-artifacts/phase3b/g1-quality-main/report.md).


## DEV-2026-10-28-G1-QUALITY-MAIN-PREPARATION

2026-10-28 CET: User approves reviewed G1 dd87cfbb main merge. Integrated main54b3dd2b accepted A clock repairs; G1 source byte-identical, only history/ledger conflicts resolved,409 budget ids preserved. Freeze then five gates plus ordinary G2, each before/after clean; publish main on success, then new G3 Tabelog branch with protected C files untouched. New real calls0. [Plan](../../.eval-artifacts/phase3b/g1-quality-main/plan.md).


## DEV-2026-10-28-G1-ANSWER-QUALITY-VERIFIED

2026-10-28 CET: G1 quality repairs complete on review branch codex/fix-phase3b-g1-answer-quality, based on main fae69b48 containing C b250bb17. Question Prompt/Schema3 only; five old-code mechanism reds→green, saved six-page Chromium fixture controls8/8, original HARD44,197 bytes identical. Frozen cb226701/682 inputs: five gates1196/175 PASS (114.600s), ordinary G2 4/4; each before/after clean, restore0. Source conflict derives existing confirmationRequired; Agent29/Action5/Context17/State24/TaskDefinition22 unchanged. A fixture field/version sync explicitly authorized; no other A files. Real calls0; current inherited sites3878/Pack478 unchanged. Push work branch and stop for review before merge; A six-question rerun and G3 are not completed by offline evidence. [Report](../../.eval-artifacts/phase3b/g1-answer-quality/report.md).


## DEV-2026-10-28-G1-ANSWER-QUALITY-PREPARATION

2026-10-28 CET: G1 quality repair is frozen for offline verification on latest-main fae69b48 (includes C b250bb17). Question Prompt/Schema2→3 only: question-language ratio rejection, whole-sentence citations, review-only absence/dietary preference instructions and source-conflict confirmation. Five old-code mechanism reds recorded; core-adapter fixture field/version sync explicitly user-authorized. Agent29/Action5/Context17/State24/TaskDefinition22 and HARD/site/Guard remain unchanged. Real calls0; independent six-question rerun remains A-owned after review/merge. [Plan](../../.eval-artifacts/phase3b/g1-answer-quality/plan.md).


## DEV-2026-10-28-PHASE3B-C-BATCH3

最终：CET 03:37。29原保存页12正确/0错认，nr004/016/024恢复、nr002接纳、nr020/029拒绝；用户确认去重12而非16，以及每店每来源最多两次检索，已写入报告供复核者核对。双站原名→一种逐字Google片段，独立named-query Prompt/Schema2，原身份与详情总额保持，Google增量0。d9b0d771冻结877项，五门禁全绿（默认1172/1172、Chromium173/173）、额外G2命令4/4（固定12页8 PASS/4诚实退化）、语义Fixture15/15/Search3/3；9项前后净树、输入SHA一致。旧样本新增GET12全部200，独立首屏11 HIT/1 MISS；nr003旧超时不重试、nr026未选，不报告15例提升率。模型/Google/Live/环境重跑0，共享累计40模型/30GET/11Google，102条id唯一，原88条保留。首轮默认1170/1171是旧空格门牌回归，保持A原fixture/断言，一次修复后重跑29页与检索。失败和前序回放各自保留，推分支停复核，不合main。

CET。9181eee9整合main90b464d8，历史及88条预算并集保留，C自己准备/完成同ID生命周期差异保留main快照依据。预列比较器函数行范围后修结构门牌/楼层/可比地域字段，建筑数字不进门牌、缺失不判冲突；普通邮编矛盾仍拒绝。用户确认旧12包含修复三家，29页期望去重12而非16，需复核者知晓；每店每来源两次检索也经用户确认。新named-source-query Prompt/Schema2只提议原文片段，代码定位，run内跨两站复用，共享模型预算；保留原身份字段和详情总额，退役旧官网标题替代路径。生产不增加Google调用/费用，B Agent/State与G3日历读取不改。获准只改两G2原页地址并附Claude独立复核2026-10-28。29页12正确/0错认，原12除指定nr020−1及nr002+1无其他变化；Kazen旧错误数字断言退役原因单列。17保存检索/4缺详情控制/12片段已离线评价，必需门禁和可选GET收尾中，不合main。[报告](../../.eval-artifacts/phase3b/c-batch3/report.md)。

## DEV-2026-10-27-PHASE3B-C-BATCH2-STOP

2026-10-27T16:59:39+01:00。8主Gold隔离并冻结，39真实语义轮完成，具名24全过；片段1次、Google11次，GET18因20s超时停且未重试。新8首屏原名3→替代7命中；旧15未完成。两站详情按标签/标题取完整地址及同店预约/店铺号，局部证据不入State；resolver门槛、共享contracts/地址比较器、Browser/Guard/Prompt不改。nr002由原050漏采转正确，旧29当前9正确/0错认，4个完整地址冲突不隐藏，停等复核。新增共享helper两站实际使用，物理增量单列，不冒充G3减行。真实预算逐次追加并保留原9条，CARRY外层漏映射用sidecar离线补评，原记录不写回。 最终3ec77f67四项门禁绿/默认1117，Chromium167/168红于G2原页地址reference变化；保持A基线与测试不改，具体两字段提案随包，按文件归属规则停止等复核。[报告](../../.eval-artifacts/phase3b/c-batch2/report.md)。

## DEV-2026-10-27-PHASE3B-C-BATCH2-START

2026-10-27T16:00:28+01:00。复核者确认全部8家在Tabelog，用户将3备升主、全正样本，Gold只用于事后比对。整合最新main/daba2ef0（5208d401），源码无冲突，文档和账本按并集保留；Scope不扩大到G3。39语义逻辑轮与31公开检索计划、原Google输入/策略/Gold分离和受控Runner提交SHA后执行；凭据仅Node --env-file加载，未独立读取文件。此时全部真实调用0；完成后只推C分支不合main。[计划](../../.eval-artifacts/phase3b/c-batch2/plan.md)。

## DEV-2026-10-27-PHASE3B-C-CERTIFICATION-PREP

2026-10-27T03:12:00+01:00。用户批准复核§9额度与详情字段交接，并要求样本备好先停。C从已复核分支整合main5f621be3，保留双方历史和按id并集账本；落地批准Gold5/sidecar3，历史Gold3/4不回写，退重复ADR0047而不复制B未提交的0046。来源SHA先冻结后从保存Google候选选5主3备，名单不填来源Gold，Dengana为暴露锚点。公开GET加速已存在，Google语言参数尚未接入；本切片只写范围与计划，不修改解析器/身份规则，不开始真实验证或收益对照。全部新增服务调用0，未加载/读取.env；7f3d8770五门禁1102/166全绿、逐项净树，只推分支停等Gold认证。[报告](../../.eval-artifacts/phase3b/c-batch2-preparation/report.md)。

<a id="dev-2026-10-28-g1-followup-main-verified"></a>

## 2026-10-28 CET: Reviewed B integration verified for main

User authorizes reviewed Bdc486430 merge/push first; current main90b464d8 already included, no product merge conflict or source edit. Frozen a5a3c57a five gates1168/175 and ordinary G2 4/4 PASS, full executable tree identical to approved B. Follow authorized fast-forward and non-force publication, then stop before C/G3. Preserve all budget entries, append B0 integration id. A evaluation and C identity integration remain their owners. [Report](../../.eval-artifacts/phase3b/g1-followup-main/report.md).

<a id="dev-2026-10-28-g1-followup-main-preparation"></a>

## 2026-10-28 CET: Reviewed B main integration preparation

User approves Bdc486430 after independent Linux five gates/G2, followed by C053e2e2e synchronization/integration. Current main90b464d8 is an ancestor of B; no product merge conflict or implementation change. Prepare frozen clean-tree gate rerun and ordinary G2, then fast-forward/push main without force and stop before C/G3. Ledger appends one zero-call id, previous rows unchanged. [Plan](../../.eval-artifacts/phase3b/g1-followup-main/plan.md).

<a id="dev-2026-10-28-g1-question-budget-final"></a>

## 2026-10-28 CET: Independent question budget delivered for review

51c14400 commits the approved independent work unit: submitted60s deadline, three failed/success model attempts, two new document visits across sessions, and20 accepted questions counted from persistent events. Retired original-run window/resume/browser snapshots; same original outlet/run binding and cache-first source reader preserved. Explicit sole action is code-selected through unchanged validation/execution/reducer authority, honest no-model trajectory. ADR0046 revision0.3 Accepted; State24/TaskDefinition22 and existing Prompts/Schemas unchanged. Six effective reds and final five gates1168/175 PASS; old HARD bytes and protected source paths identical. Work branch push only, real calls0, stop for review. [Report](../../.eval-artifacts/phase3b/g1-question-budget/report.md).

<a id="dev-2026-10-28-g1-question-budget"></a>

## 2026-10-28 CET: Independent G1 question work units

User corrects the inherited-search-budget contract; ADR0046 revision0.3 stays Accepted. Replace search readWindows/resume/browser-budget snapshots with per-question60s/3 calls/2 document visits and persisted-event20-question limit. The code-selected sole action retains Validator/Router/Reducer and an honest no-model trajectory. No State or TaskDefinition change; source identity/run/citation rules remain. HTTP9/9 development controls pass, final frozen gates pending. Real calls0. [Plan](../../.eval-artifacts/phase3b/g1-question-budget/plan.md).

<a id="dev-2026-10-27-phase3b-g1-followup-stop1"></a>

## 2026-10-27 CET：G1接入停止点1交付

按用户批准实施Prompt29/动作5/Context17/State24/TaskDefinition22，ADR只修Approval行、正文不动。已展示门店卡片追问贯通持久事件/Agent无参动作/Validator/Router/同run缓存及原事实reader/核心/Reducer/英文Web；预算resume、浏览器子预算继承和取消/迟到保护闭合。并行main/90b464d8带入A Runner，不改其实现或读答案；生产冲突0，共享历史双方保留、账本按id并集21行。7de83a29最终五门禁1162/174通过；仅推工作分支，不合本次接入到main。G1真实模型质量留A独立评分，G3未开始，新增真实调用0。[报告](../../.eval-artifacts/phase3b/g1-followup/implementation/report.md)。

<a id="dev-2026-10-27-phase3b-g1-followup-implementation"></a>

## 2026-10-27 CET：G1 Agent/Web纵向接入实现

用户批准五个共享版本后，从最新main/c98438f8核对无冲突，继续预告分支；新增PAGE_QUESTION_REQUESTED/COMPLETED、无参Agent动作、Validator/Router、同run页面缓存、原预算resume和英文卡片入口。已有Native/官网reader产出身份后页面，缺缓存复用同链，独立问答Prompt/Schema2不变；不改语义、身份解析、Guard、站点/Pack。两个评测调用方只同步State23→24字面量，其评测逻辑/数据不改。持久HTTP主链红404→绿；缓存/预算/引用/敏感/取消/迟到控制和真实Chromium展示通过，旧HARD44,197字节不变。ADR只改Approval行，正文不动；正式五门禁待冻结执行。真实调用0，不读.env/答案。

<a id="dev-2026-10-27-phase3b-g1-push-approved"></a>

## 2026-10-27 CET：用户补足main推送授权后交付

2026-10-27T16:34:10.971590+01:00：用户“yes, approve it.”明确授权本次推送c98438f8。查明系统本地代理已启用而Git未继承，仅命令使用现有代理、严格TLS不变；非强推原子push成功。main/整合分支SHA均c98438f8，预告分支22f7fe41已推，后续收尾只推预告分支。原审批拒绝和网络失败原文保留，当前已解除；不改产品版本，不进入接入/真实评测/G3。[报告](../../.eval-artifacts/phase3b/g1-followup/report.md)。

<a id="dev-2026-10-27-phase3b-g1-version-preflight"></a>

## 2026-10-27 CET：G1接入版本预告停止

核心本地main已合c98438f8；Agent/Web接入必然新增合法动作、Context和持久追问事件，拟Prompt28→29/动作4→5/Context16→17/State23→24/TaskDefinition21→22。C在五份共享版本文件无改动，独立问答2不变；按用户第1节先停报再改，本次无产品修改。远端main推送自动审批因“本批未明确授权push main”拒绝、操作未启动；工作分支push遇GitHub空回复和443连接超时，未报已推。真实调用0。[报告](../../.eval-artifacts/phase3b/g1-followup/report.md)。

<a id="dev-2026-10-27-phase3b-A-dual-review"></a>

## 2026-10-27 CET: Reviewed sensitive dual outcomes

2026-10-27T17:17:32.536721+01:00. User resolves prior Q28/Q30 quote incompatibility in evaluator references, keeping ADR/core. Implement outcome-specific quotation/limitation and actual confirmation flag, RELIGIOUS_DIET enum; no aliases/duplicate refs. Rebase main/c98438f8 preserves both histories/ledger. Effective red/green, actual-core4-outcome composition PASS. f5995ba6 formal five gates1154/173 PASS, per-gate clean;26 input SHAs, original candidate and32 unchanged references verified. Ledger id-dedup preserves all records. User-authorized main integration follows, real calls0. [Report](../../.eval-artifacts/phase3b/g1-runner/report.md).

<a id="dev-2026-10-27-phase3b-g1-core-integrated"></a>

## 2026-10-27 CET：G1核心整合验收完成

2026-10-27T15:59:14.915329+01:00。7be3b33a五门禁1152/168全绿后保留并行main/319cb9a5全部记录，metadata合并a27047b2，654冻结输入保持，旧HARD完整44,197字节一致。核心7源码与复核e4829a58原字节相同，账本14id并集、真实调用0。按用户授权合main，实际SHA以Git回执核对；下一项按明示要求先停报版本，不提前接Agent/Web。[报告](../../.eval-artifacts/phase3b/g1-integration/report.md)。

<a id="dev-2026-10-27-phase3b-g1-core-integration"></a>

## 2026-10-27 CET：G1核心重放与ADR文本批准

用户批次3按SHA96b0f371批准ADR0046 revision0.2；严格只改Status行并记批准日期，其余字节不动。独立整合分支保留原e4829a58，13提交重放main/daba2ef0，只发生文档及账本冲突，双方原记录及账本id并集保留。7份G1事实源码与复核提交相同，其他生产/Runner/fixture不改，A答案未读。冻结后五门禁；接入前报告共享版本。真实调用0。[计划](../../.eval-artifacts/phase3b/g1-integration/plan.md)。

<a id="dev-2026-10-27-phase3b-qa-final"></a>

## 2026-10-27 CET: G1 final review confirmation

2026-10-27T15:44:58.545553+01:00: user confirms all 34 after Q24/Q25 no-reader correction. Historical evidence preserved. G3/Live sequencing updated; independent Runner follows after main integration. c10fdeed five gates1110/168 PASS, per-gate clean tree. Zero real calls. [Report](../../.eval-artifacts/phase3b/g1-qa/report.md).

<a id="dev-2026-10-27-phase3b-A-batch2-calendar-stop"></a>

## 2026-10-27 CET：缺少真实TableCheck阳性保存日历

03:31 CET，固定main/daba2ef0，d8e8626e先冻结3408输入与脚本，再查3388保存页/20归档968页。171时间动作候选为4个SHA；3个Date Field仅查询条件，168次重复来自run-interruption.ts本地构造。没有可加入G2的真实已绑定时段页，按用户第3节停止；未改固定集，Runner未启动，单适配集成批准保留。三项已合main推送记录及0调用第7条保留，本分支只证据/文档、不合main。[报告](../../.eval-artifacts/phase3b/tablecheck-calendar-evidence/report.md)。

<a id="dev-2026-10-27-phase3b-A-batch2-qa"></a>

## 2026-10-27 CET：G1人工复核结果与自然问题

2026-10-27T03:20:36.530048+01:00。按25/5澄清确认Q01–20/Q26–30，5改写和4新增待审，34英文题保留中文。原候选文件与8源页保持；评分器@2有效红绿，B答案隔离；重放main/f465ada0双方记录及账本并集保留。0d26174d五门禁1110/168全绿、逐项净树，22输入SHA及8页/56摘录通过；全34正式评分NOT_READY、错误数null，真实调用0。[报告](../../.eval-artifacts/phase3b/g1-qa/report.md)。

<a id="dev-2026-10-27-phase3b-A-batch2-replay"></a>

## 2026-10-27 CET：回放分支重放G2主线

时间2026-10-27T02:52:22.595544+01:00。G2/main 5f621be3已推送；回放分支重放其上，预算4条并集＋本批0调用条目、双方STATUS/DEVLOG/TEST-LOG/月度记录都保留。重复ADR去重，源码四文件与b7e8af14相同。6995ebcd重跑五门禁1104/167全绿、逐项前后净树；79条输入SHA一致。用户已结束旧F5整包，首次3b Live以当前代码新录制验收(c)，本批只更新状态，真实调用0。[报告](../../.eval-artifacts/phase3b/batch2-A/report.md)。

<a id="dev-2026-10-27-phase3b-A-batch2-g2"></a>

## 2026-10-27 CET：3b A批次2 G2去重与合入准备

时间2026-10-27T02:31:15.166850+01:00。用户独立Linux复核G2/G1/Replay门禁均过，批准G2、Replay依次合main；A的0046删除，统一由B Proposed草案承接Validation待批。仅文档去重与零调用记账，产品/站点/共享版本不改；重放最新main后重新五门禁及固定G2，ee0c391d五门禁1101/166及固定G2 4/4全绿，各项前后净树。旧F5完整回放按用户决定结束，首次3b Live用当前版本新录制。[报告](../../.eval-artifacts/phase3b/batch2-A/report.md)。

<a id="dev-2026-10-26-phase3b-g2"></a>

## 2026-10-26 CET：3b A批次1 G2 DOM变异切片

时间2026-10-26T23:11:24.545847+01:00（CET）。从main cc127320独立工作分支，引用 ADR（对话 B 起草，待批准）的用户两原则与共享3b零调用账本。规则2全id映射及引用目标逐项自检；12保存页8 PASS/4 DEGRADED_HONEST/0 FAIL，TC未知边界保留；无产品代码改动。固定G2命令与G3严格模式已建立；0027ed84五门禁1101/166及额外G2 4/4全绿，逐项净树。报告：[G2](../../.eval-artifacts/phase3b/g2-dom-change/report.md)。

## DEV-2026-10-26-PHASE3B-C-STOP1

3b对话C四项离线交付完成：保存页复算12/29/错认0，Dengana8份六适用两其他请求，失败阶段与未决项分开；检索片段、同店电话对应、完整地址/坐标只写方案。SR03模型层先丢名，预先报告后仅Semantic Prompt26；合法fixture和wire通过，真实模型效果未评。ADR0047记录用户两原则及未实现边界。15项Gold建议待逐条确认，不改Gold/身份/State/Schema、不编辑A/B代码。共享账本保留三方条目、全部新增真实调用0。按授权只推C分支，停停止点1不合main。 [报告](../../.eval-artifacts/phase3b/c-batch1/report.md)。

## DEV-2026-10-26-PHASE3B-C-BATCH1-CANDIDATE

从main/cc127320准备四项。0895a3b7冻结745输入后，29保存页当前纯parser/resolver复算12正确/17未接纳/0错认；14明确空、2正确详情未过身份、1宽召回无Gold。Dengana八原件全查，六适用两其他请求，导航/模型/提交/检索漂移/父超时逐步计时；@2只修WEBSITE辅助活动的误删失观察，旧输出保留。方案不实施/不放宽，15项Gold候选只列清单。SR03先在模型提议丢名，下游忠实复制；预先报告后7521c94d只改Semantic Prompt26和C同文件测试。ADR0047记录用户两原则，不声明G1/G2/G3已实现。 [报告](../../.eval-artifacts/phase3b/c-batch1/report.md)。

## DEV-2026-10-26-PHASE3B-C-BATCH1-PREP

按用户自包含3b对话C批次1准备。来源为签收main/cc127320、tag指向相同提交；新工作分支已建，不合main。共享预算上限18Live/1000模型/4环境重跑/40评测GET，C独立id零调用条目与已有条目并集保存。范围及停止规则见计划；不需要Claude项目复核文件。 [切片](../../.eval-artifacts/phase3b/c-batch1/plan.md)。

<a id="dev-2026-10-26-phase3b-replay"></a>

## 2026-10-26 CET：3b A回放引用与静态方案

时间2026-10-26T23:54:36.400389+01:00。从main cc127320独立分支；历史F5第4行wire先被stale拒绝，导致第5请求类型分歧。A层按公开语义唯一绑定当前ref，原动作/权威值不变，生产stale限制不改；实际Executor窄窗口红转绿，SOURCE/FLOW歧义等拒绝。当前原整包首语义合同23/3对25/4不匹配，严格停止、0/94，未完成完整回放。旧24脚本清单中10在重跑HAR已有字节，75缺CSS/71缺动态，六DOM只证可读性；Recorder/Guard无修改。f3fdfd9c五门禁1103/163全绿、逐项前后净树，真实调用0，不合main。[报告](../../.eval-artifacts/phase3b/replay-completion/report.md)。

<a id="dev-2026-10-26-phase3b-g1"></a>

## 2026-10-26 CET：3b A G1候选问答

时间2026-10-26T23:29:45.366380+01:00。main cc127320独立切片，用户澄清后30题全部CANDIDATE，8页/49处原文，问题与答案隔离；实际无到期证据不冒称过期。ADR（对话 B 起草，待批准）统一维护用户原则，评分器不读产品解析器；无Gold先NOT_READY，未知同义人工复核。fc5146b9五门禁1104/163全绿、各项前后净树；候选正式评分NOT_READY，真实调用0，不合main。[报告](../../.eval-artifacts/phase3b/g1-qa/report.md)。

<a id="dev-2026-10-27-phase3b-A-runner-delivery"></a>

## 2026-10-27 CET: Native Runner delivery and contract review item

2026-10-27T16:40:01.173311+01:00. Adapter-only native implementation migration, unchanged B product.8cb02dbc gates1148/167 PASS/per-gate clean.34 canned transport complete; grade5/19/10 not model quality. Actual-core local proof confirms Q28/Q30 sensitive NOT_STATED quotation incompatibility; preserve Gold/core and stop contract changes pending review. Parallel main/c98438f8 already contains QA and B core; its latest ledger union is retained. Zero real calls. [Report](../../.eval-artifacts/phase3b/g1-runner/report.md).

<a id="dev-2026-10-27-phase3b-A-runner-native"></a>

## 2026-10-27 CET: A Runner rebase to delivered B batch2

2026-10-27T16:26:12.182132+01:00. Followed approved integration sequence: legacy verified checkpoint tagged; rebase e4829a58, both histories/budget union preserved; only adapter source updated. Unchanged four composition controls pass. Native fixture/gates pending, no real calls. [Report](../../.eval-artifacts/phase3b/g1-runner/report.md).

<a id="dev-2026-10-27-phase3b-g1-revision"></a>

## 2026-10-27 CET：3b B批次2 G1修订与ADR统一

Evidence status：draft / not integrated，按用户决定继续codex/feat-phase3b-g1-core，不合main。统一ADR0046 Proposed，原则已由用户2026-10-27批准、文本待批准；删除B0047，A/C自撤重复稿。合并G2种子/逐页判定与G1题答分离、复核者逐题确认、独立评分及错误声明目标0的Validation；未读QA答案。

G1 Prompt/Schema2允许提问语言简短答案+1–3逐字引文，模型标敏感类别，基本yes/no形式核对，代码仍绑定原文/同店/run/URL/读取时间并冻结快照；结构化NOT_STATED null及confirmationRequired，不拼展示文案。共用分段/选择参数化，G1每页60k/1200/单句6k；HARD默认行为不变，固定时钟完整事实/模型请求44,197字节SHA一致。可见标题的明确评论区段标USER_REVIEW拒引，不读class/testid；未标记/歧义评论风险留ADR和独立题集。

旧代码红灯与最终保存页绿灯使用同一冻结脚本和输入：后7,515字符原文、整页未说明、评论误接纳；简短答案/敏感格式及三个反事实有效。最终bb967901五门禁1142/162全绿、每项前后净树。没有Agent合法动作/Web/State/TaskDefinition/Guard/共享Prompt或A/C源码变更；真实调用0，不读.env，账本仅追加B0增量，站点3847/Pack473不变。完成后停止等文本批准，下一批接线/真实模型评测/G3均未做。[报告及ADR全文](../../.eval-artifacts/phase3b/g1-revision/report.md)。

<a id="dev-2026-10-27-phase3b-A-g1-runner"></a>

## 2026-10-27 CET: A G1 Runner integration

2026-10-27T16:09:08.100528+01:00. User-approved B/0a466bcd integration base. Only A eval/harness and audit files change. Actual-core previous-run red/green, separate execution/scoring, source SHA and reference-read isolation. Scorer@3 follows new category contract; presentation advice remains unevaluated. ee5c835c fixture transport34/34 with29 FIXTURE invocations; canned grading5/27/2, not real-model quality. Product bytes pinned; five gates pending. [Report](../../.eval-artifacts/phase3b/g1-runner/report.md).

<a id="dev-2026-10-26-phase3b-g1-stop1"></a>

## 2026-10-26 CET：3b B批次1停止点1（未接入口G1）

Evidence status：draft / not integrated，分支codex/feat-phase3b-g1-core，从签收main cc127320开始；ADR0047为Proposed，等待用户批准，不改变已接受决策。观察原则和G1合同同稿，F3原38映射扩52组；G2正式规格归A，G4身份归C。复用Native/官网reader可选绑定页面hook、原样分段及完整statement核对；G1问题独立于criteria，抽取式原文、来源URL与读取时间由代码绑定。无自由模型结论，敏感只引文+确认，未说明必须限定查过的完整页面。

旧HARD-only信用卡问题有效红灯保留；缓存异步更新导致原文与URL错配在未接入口核心中取得红灯，以调用前复制关闭；三种移除核对控制有效。没有Agent合法动作/Prompt/Web、State/TaskDefinition或Guard变化，没有第二套抓取/身份/预算；旧事实结果保留。最终d4be4a7a五门禁1130/162全绿、每项前后净树。新增真实模型/Google/餐厅网站/Live/公开GET/环境重跑均0，未读.env；预算保留A/C条目仅追加B零增量。站点3847/Pack473不变，G3待批准。按授权推工作分支供复核，不合main。见[报告](../../.eval-artifacts/phase3b/g1-core/report.md)与[ADR草案](https://github.com/wzhgogogo/Praxis/blob/0a466bcded02700b11bfe86e99bf4924e0d22d32/docs/decisions/0047-observation-driven-sites-and-cited-questions.md)。


<a id="dev-2026-10-26-phase3a-prime-signoff"></a>

## 2026-10-26 CET：3a′带缺口签收与3a完成

Evidence status：用户签收决定／阶段收尾历史；依据本次自包含用户消息。该签收保留已知缺口，不把历史失败改记通过。

用户决定3a′带缺口签收，以下四项移交保留：

- F5例01未达成，转3b店名解析G4与F6 Live验证。
- 网站适配器3,847行，未达≤3,591；L1/L4/L5转3b查位改造G3。
- 测试集变快但未变小。
- 真实录制尚不能完整回放，转3b对话A。

用户决定3a完成：①推荐与查位边界已合入，版本为ADR-0044 revision1.1、语义Prompt@25、Gold@4。②使用条款：用户已咨询日本律师，提供的结论为“当前做法没有问题”，据此3a②结束。运行规范照旧：节奏控制、不进入robots禁止的预约流程路径、遇到限流或繁忙页面就退避。

| 额度终值 | 已用／上限 |
| --- | ---: |
| 3a′ Live | 8/8 |
| 3a′真实模型 | 334/400 |
| 3a′环境重跑 | 3/4 |
| 3a边界真实模型（单列） | 93/144 |

本次在最新main `cd34aa0034c24fadd0da1224b7c063a26a06f0e8`上仅更新STATUS、DEVLOG与月度摘要/索引。产品、Runner、测试、Prompt、Gold、录制与预算账本均不改；新增真实模型／Google／网站／Live调用0。验证限文档内容、链接、`git diff --check`和文档以外零差异；代码五门禁本批NOT_RUN。该文档提交使用不可移动的annotated tag `phase3a-prime-signoff`，推送main与tag后以ls-remote核对tag对象及其指向的提交。不删除任何分支或已有tag；完成后停止，不启动移交工作。

<a id="dev-2026-10-26-f6-implemented"></a>

## 2026-10-26 CET：F6固定收尾预留获准实施

批准ADR0045修订后实施F6共享层。先冻结Native/Google完整子结果丢失的有效红灯，再修原SEARCH_COMPLETED交接；槽3剩26.596秒读取红转绿，中位数100秒正常控制及完整A/未知B、原资格和迟到控制补齐。Web检查另得语义时间未继承红灯、PGlite重复trajectory主键失败；均按同一切片修复。实际对象State23/TaskDefinition21、Context16/Prompt28，活动fixture更新，无兼容路径；来源/Pack/预算不改。五门禁在重放新main/50b70fa6并保留双方历史后，于干净bcdd5cf1通过（1100默认/162Chromium及type/arch/build，逐项前后净树）；按授权合main并推送后停止。真实调用0，Live不运行。 证据见[报告](../../.eval-artifacts/phase3a-prime/f6/report.md)。

## DEV-2026-10-26-PHASE3A-BOUNDARY-CORRECTION-COMPLETE

停止点3用户完整消息批准规则修正，Claude项目文件无需本地取得。ADR1.1/Prompt25/sidecar2：订位措辞无时间仍AVAILABILITY，SR02补时间CARRY；Gold4仅SR03-T02目标，Gold3 SHA原样保留。main/7e2425b7先整合，双方记录/3a′累计保留；goalBasis不入State、State22/TaskDefinition20不升版。冻结aa64c0b3后九轮真实完成，非目标问题、query丢名与CONFIRM拒绝仅列3b，灰区保持灰区。新9调用累计93/144余51、prime400扣0，无新网站/Google/Live。提交证据后依授权推分支并快进main，远端最终SHA以实际Git回执为准。 [报告](../../.eval-artifacts/phase3a-boundary/review-correction/report.md)。

## DEV-2026-10-26-PHASE3A-BOUNDARY-CORRECTION-PREP

用户完整复核消息批准无时间订位规则修正、Gold升版与合main。先整合main/7e2425b7，源码无冲突，双方文档历史与共享账本独立额度保留；主线State22/TaskDefinition20不因goalBasis升版。ADR1.1/Prompt25/sidecar2，SR02-T01 A、T02 CARRY；Gold4仅SR03-T02目标AVAILABILITY，旧fixtures.ts SHA保持。私有Holdout未读，三个延期项单列3b。九逻辑轮及18最多原schema尝试，累计84/144余60。 [切片](../../.eval-artifacts/phase3a-boundary/review-correction/plan.md)。

<a id="dev-2026-10-26-f3-script-read"></a>

## 2026-10-26复核：F3脚本读取与预检（执行CET10-25）

开发按批准的ADR-0036第1–7条实施；共享脚本类型、真实预检投影、实际完整POST分离。旧生产两个有效红灯已存，修后真实本地Chromium绿；独立接收端/body审计与Recorder留证，相关154项离线回归通过。五门禁在28963ca8干净提交执行，默认1054／Chromium161全绿、每项前后status为空；完整收据见[报告](../../.eval-artifacts/phase3a-prime/f3-guard/report.md)。保护文件、预算零差异，站点行数不增加；无.env、无新增真实调用。route留3f、F6未实施，未知POST/CORS回放不伪报已覆盖。

<a id="dev-2026-10-26-adr0045-median"></a>

## 2026-10-26复核：ADR0045中位数与部分结果修订（CET10-25）

只修改Draft，F6未实施。固定Git下62样本中位数与20s门槛核算完成；核对现有逐店checkpoint、事件和Reducer，明确搜索父取消仍丢内部完成结果的接线缺口及代价，新增100s查位正常准入和取消保留A/未知B控制。F6红绿灯NOT_RUN，现有五门禁按用户要求另跑，不能代替F6产品验收。源码/预算不变、真实调用0。[报告](../../.eval-artifacts/phase3a-prime/f6-draft-revision/report.md)。

<a id="dev-2026-10-26-f3-034"></a>

## 2026-10-26 CET：F3-034显式观察通用列表

未修生产组合非法关键词/稀疏KEEP/重复表达式三项有效导航红灯，修后同断言通过；真实本地Chromium明确选择观察ref后5家候选，集合外/跨来源/href冒充/无观察均拒绝。当前共享文本Native和Google-only同片有界失败，原合法改写与候选保留交付控制保持。Schema@3／Prompt@6、State@22／TaskDefinition@20及全部活动fixture同步，不留旧回退。63项相关与五门禁全绿（e85e2a81，默认1060／Chromium161、每项前后净树），完整收据已归档。两个来源目录、Pack、budget零差异，真实调用0，F6/route不实施。[报告](../../.eval-artifacts/phase3a-prime/f3-034/report.md)。

> 按需阅读入口：[月度摘要与索引](README.md)。本文件保留原始逐条详情，不作为日常全量阅读材料。

## DEV-2026-10-26-F3-AUDIT-STOP4

F5已按用户批准带已知限制合入并推送main/e096ba35：ADR-0043 机制已在 Live 验证；例 01 能力未达成，转 3b 店名解析与 F6。F3从该main只做审计：38项（11严格保护、27其他），固定Linux类型差异及本地6对照证明CDP类型缓存回退可误拒；历史Linux事件先后未录，Tabelog同源GET有通用后备，不能全归此因。OPTIONS41/95是重复诊断且独立GET-only预检缺口；4保存页class改名，2Tabelog观察/绑定变、2TC控制不变。Ebisu旧0响应根因未知、Omotesando route合同拒绝、首10秒无完成快照缺证均分别记录。站点现3864/Pack473，预计净删306至3558仅计划未实现；Guard补充与ADR0045固定20秒收尾仅草案。8份原Live计时只读，所有新增真实调用0，budget原字节不变。不改产品/测试/Runner/Prompt/Schema/Guard，不实施F3/F6。停止点4待复核，当前审计分支仅本地提交，不合main、不推送。 执行时间2026-10-25T21:18:52.344054+01:00 CET（26为复核编号）。F5合入前五门禁34c8b4f2默认1053/Chromium155及type/arch/build全绿、逐项净树；本审计源码未变，五门禁复跑NOT_RUN，仅核对引用/冻结/差异和本地观察。新Replay/Live/Controlled-write均NOT_RUN，不重判历史S0。[报告](../../.eval-artifacts/phase3a-prime/f3/report.md)。

## DEV-2026-10-26-F5-REVIEWED-CLOSEOUT

用户停止点3b复核确认：F5按完成标准FAIL（例01 0/3），结束F5；**ADR-0043机制已在Live验证；例01能力未达成，转3b店名解析与F6**。这是带已知限制合入，不把纠正3/3执行写成找店能力通过。按批准重放最新main 0a254f05，双方历史记录与预算并集保留，23条账本／累计8Live、334模型、45Google、3环境重跑、7评测GET均不变；原始F5产物逐字节不变。旧e169e606留annotated checkpoint。五门禁将在本次干净候选提交运行，全绿且净树后才快进main并推送；新增真实调用0，不加载.env。时间2026-10-25T20:49:53.718394+01:00，CET。 [报告](../../.eval-artifacts/phase3a-prime/f5-closeout-20261026/report.md)。

完成验证：34c8b4f2重放后的五门禁全部PASS（默认1053／Chromium155），每项前后status均为空。后续仅归档与文档，源码不变；合入前最终净树复核通过，按用户授权快进main并推送，远端结果另以实际Git收据核对。新增真实调用0。

## DEV-2026-10-25-F5-RERUN-STOP3B

2026-10-25 CET。F5c分支重放main b5db5700，旧HEAD留tag，双方记录与18条账本保留。b195c176五门禁type/arch/默认1053/build/Chromium155全绿，每项前后净树；之后源码零新增差异。375项最终冻结先提交，Dengana11-04 19:00两人公开GET2次复查WITNESS_EXISTS；3个授权凭据加载仅用于本轮。例01串行3槽全部约500.6秒超时、0/3合格，首次Tabelog调用中纠正3/3均执行，替代仍约4km南；原生Dengana均无，Google见证三次FOUND。独立S0两项全ABSENT，S2 PRESENT；三份原样OS禁网回放均首文档资格处INCOMPLETE，Google HAR各3响应。新增116模型/15Google/1环境重跑/2评测GET，累计8Live/334模型/45Google/3环境重跑/7GET。槽后评价延迟39.245/100.636/284.545秒，未满足立即要求；均无交付、postGET为空、下一槽仍过安全门后才启动。报告以机器实算秒数为准。停止点3b等复核，业务验收FAIL，不合main。[报告](../../.eval-artifacts/phase3a-prime/f5-live-rerun/report.md) · [汇总](../../.eval-artifacts/phase3a-prime/f5-live-rerun/aggregate.json)。

## DEV-2026-10-25-F5-RERUN-PREPARE

2026-10-25 CET。按复核批准重放本分支到main b5db5700，31提交源码无冲突，双方文档记录保留；索引聚合条数标题不作为记录丢失，原记录锚点逐一核验。预算主线7/本分支18条并集18条，旧累计5Live/218模型/30Google/2环境重跑/5评测GET保持，新增授权2环境重跑使总上限4。旧HEAD留annotated checkpoint。五门禁将在干净提交运行。本轮3个受控Runner凭据加载另获直接窄授权，不展示/复制/暂存；尚未加载。无新增模型/网站/Live调用，不合main。[计划](../../.eval-artifacts/phase3a-prime/f5-live-rerun/plan.md)。

## DEV-2026-10-25-F5C-OFFLINE

2026-10-25 CET，基线a691f7dd。按停止点3复核只修共享来源循环：不再把两有效越界样本的纠正留给后续SEARCH，在原Executor/deadline/详情/地区预算内立即给方位反馈、选观察引用、导航与继续详情；一次替换及错误收尾不变。已接纳候选在本次纠正失败时也保留。真实Interpreter→Agent合法动作→Router→Reducer本地控制，TC2与Google26已排队且search=false，旧代码目标断言失败，修后通过；G1/G3、N1–N4、F1–F4等复用fixture改为单次调用，不保留延期旧路径。

完整公开地址“東京都北区赤羽1-15-1 新仲ビル1F”冻结于新F5c目录。仅地址无法解决两来源名称/地址表记不同，因此把公开电话、完整门牌楼层、1.251m坐标核对支持的精确来源身份对一并冻结；当前WitnessOutlet统一identities、Evaluator35/rubric30、所有当前TS调用方同步，Browser Prompt/Schema不变。旧冻结内联分析脚本仅基线绑定retrospective，不作为新入口。原Live评价/证书/变体不改。槽5只用固定blob分析：三次Tabelog检索明确为空、没有回读通用列表，F5临时分支未执行；第37行根决策的下一批查位在截止时仍运行，不能把最后持久化facts动作当作中断位置。213目标/1 Chromium通过；a9d8aeba干净提交五门禁1048/154及类型/架构/构建全绿，每项前后净树，收据/无损日志已留档。新增模型/Google/GET/Live/环境重跑0，不读.env，预算及站点保护字节不变。随后仅同步文档证据，停止等复核与后续新Live额度，不合main。[报告](../../.eval-artifacts/phase3a-prime/f5c/report.md)。

## DEV-2026-10-25-F5-LIVE-STOP3-INCOMPLETE

2026-10-25固定CET。用户窄授权6个受控Runner加载既有.env，未展示/复制/暂存运行凭据。六次进程调用、五次正式Live，最后一次预检HTTP200/CHECK_TIMEOUT且环境重跑余额0，未启动正式任务；严格停止，无第7次调用。例01为0/3合格交付（500.338秒外层超时、500.333秒轨迹AGENT_LOOP_TIMEOUT、399.728秒有界未交付）；例03为439.498秒有界无结果、500.496秒超时、最后NOT_RUN。自动Evaluator34/rubric30产物及历史分母保留；例03首轮另按实际冻结请求/未知范围做独立输出复核，不冒充自动绿灯。

确认例01两坐标样本均越界后，纠正仍排在Google之后，真实legalActions.search=false/NATIVE_FIRST_BATCH_PENDING阻断返回；没有regionCorrection提示或SELECT动作，不能归因为模型拒绝方位反馈。源页面实际观察到Akabane Sta链接在查位阶段未用，精确决策/DOM另存，未据此暗改LOCATION范围。五份HAR均在写前扫描拒绝后缺Google结构化响应，F2④b禁网原样回放全部INCOMPLETE。用户另批单次公开直连GET，3.658948秒HTTP200；零网络本地计时控制证明末次快照竞争可造成CHECK_TIMEOUT，但缺现场snapshot计时，根因仍HYPOTHESIS。未改生产/Runner/Prompt/Schema/Guard/站点或预算，不进入F3/3b修复。原9账本条目并集、348冻结项、原始压缩证据完整保留。实际5Live/218模型/30Google/2环境重跑；停止点3未完成，停止等复核，不合main。[完整报告](../../.eval-artifacts/phase3a-prime/f5-live/report.md)。

## DEV-2026-10-25-F5-LIVE-RUNNING

固定CET，01:50进度。直接用户授权解除仅6次受控Runner的.env加载阻断，完整答复单列存证；无独立密钥检查、展示、复制或暂存。正式slot1截止超时，2个有效越界样本进入deferred来源，Google有同名同址Dengana，查位BROWSER_TIMEOUT；没有交付。自动见证匹配缺完整地址，原NOT_FOUND保留并另记人工对照，不回写冻结oracle。ORIGINAL回放在Google结构化响应缺失处停止；记录器KEY_PATTERN_BEFORE_WRITE，0模型／网络回退。slot2两次Tabelog预检CHECK_TIMEOUT，保留两次5分钟等待，未正式启动，环境重跑已实际用2。保持冻结输入、生产代码和原2/3／不超时标准，后续结果另记。[报告](../../.eval-artifacts/phase3a-prime/f5-live/report.md)。

## DEV-2026-10-25-F5-LIVE-PREPARED

固定CET UTC+01:00。F5重放到main4d927958，旧763a2262保留tag；源码0冲突，双方文档记录及共享账本A7＋B2全部保留。355a5547五门禁1046/154及type/arch/build全绿，5次前后净树；包8b39bd76固定348项SHA，严格Loader、子进程、分析器离线导入通过。日期正文原字节不改，10-25运行窗口+10/+13天。先提交后2GET复查Dengana，类别/201.545m/11-04 19:00两人WITNESS_EXISTS，响应及SHA无损归档，账本新增2、共享GET4。CET下元数据与UTC证据并存。

自动审批拒绝主工作树.env加载（即使仅布尔检查），因旧禁止读取限制；未执行，没有密钥读取/展示/复制/暂存。六slot执行包、独立S0 gate、逐店GET与F2原样回放入口已准备，凭据方式待用户明确许可；不绕过拒绝，六slot NOT_RUN，新增模型/Google/Live0，尚未停止点3。[报告](../../.eval-artifacts/phase3a-prime/f5-live/report.md)。

## DEV-2026-10-24-PHASE3A-PRIME-F5-IMPLEMENTATION

最终收尾（CEST）：d771aa51完成全部实现，五门禁PASS（1038／138），每门禁前后均干净。明确stopReason不被未空队列复活；JSON-LD null／空串不转为0有效坐标。实际Runner严格加载器预检通过；仅移除不兼容的信封元字段，用户正文／日期／GET输入未改，执行时旧freeze单独保留。最终仅归档及文档提交，源码不再变化，停2等复核。

交付收敛（CEST）：补齐集合与readRunId绑定，同intent跨Task/run也在导航／模型调用前拒绝。N1–N4改用各自历史圆心及吉祥寺实际观察入口，并用固定旧Native模块实际比较页面／详情数，无旧执行文件残留。采集冻结778f37ff、执行fd7c3c70；公开GET2次均200，Dengana当前身份／201.545m／Kushi-age及11月4日19:00两人库存认证通过。原始响应无损归档、逐次账本；例03可选GET0、Live0。最终输入冻结后五门禁见gates-final，停在2等复核，不合并main。

- 时间：2026-10-24 Europe/Vienna（CEST，UTC+2）。基线f42715c2；仅codex/fix-phase3a-prime-f5-provisional-entrance，draft / not integrated，已暴露开发控制。
- 共享层合同、生产者及全部活动调用方同步更新；无旧firstFive／旧wire兼容路径，两个站点目录与source-packs.ts零改动。
- R1先红后绿；本地构造输入明确标注，真实组合经Interpreter→Router→Reducer产出artifact并由独立evaluator判断，正常控制与真实Chromium G3通过。适用五门禁在提交干净后运行，结果随后追加；未将定向通过当作最终门禁。
- 例01最多10 GET（本次冻结1候选、至多2 GET），串行≥5秒、无Cookie／登录／预约表单／模型；先冻结采集脚本和SHA再执行。例03无用户观察到的≥1000m筛选URL，跳过可选GET，保留人工800m／环带未核对。全部模型／Google／Live新增0，STOP2后等复核。[报告](../../.eval-artifacts/phase3a-prime/f5-implementation/report.md)。

## DEV-2026-10-24-PHASE3A-PRIME-F5-REBASE

按用户授权重放分析分支三提交到f42715c2；STATUS/DEVLOG/TEST-LOG/月度导航保留F1/F1b与F5全部记录。Accepted ADR与分析产物逐字节保留；annotated tag checkpoint/phase3a-prime-f5-stop1c保存原60d02686祖先及固定输入。新实现分支下一步从新main建立，分析本身不改产品、不运行Live。 维也纳时间2026-10-24T04:00:45+02:00；新模型/Google/网站/Live0。[核验](../../.eval-artifacts/phase3a-prime/f5-analysis/rebase-20261024.json)。

## DEV-2026-10-24-PHASE3A-PRIME-F5-STOP1C

维也纳时间2026-10-24 CEST。用户提供自包含1b复核并明确批准新ADR；本批完成1c设计修订，仍不实现。只做A，撤回LOCATION/车站控件修复及其无有效红灯的清单，保留不得拼造站码/类别码/URL。替代从本来源流程已观察、Pack确认的入口集合选取，模型只选集合引用，代码复核归属后直接导航，不恢复菜单。D1第5行东京菜单31地区链接保留原revision/ref/trace/snapshot；第三页取样后替代为第四页。当前Executor只接受当前DOM目标，报告列明SELECT_REGION_ENTRANCE拟议合同、输入/结果/动作/Prompt/来源进度版本接线，未绕开旧ref校验；直接NAVIGATE需显式记原页额。新增G3、集合外/跨来源或流程/拼造href反例，N1–N4优先复用既有fixture/runScenario构造。ADR-0043 revision1.1 Accepted／尚未实施，旧0040/0042正文不改。新预算57.512秒余32.488；D2慢代理87.501秒余2.499，列表能否解析未证。旧预算/验证保留为superseded retrospective。48项固定输入SHA，新增调用0，无产品/测试/站点/账本变更。仅提交推送当前F5分支后停1c；F1合main后再重放，保留双方记录。[报告](../../.eval-artifacts/phase3a-prime/f5-analysis/report.md#10-停止点-1c-修订与-adr-批准)。

## DEV-2026-10-24-PHASE3A-PRIME-F5-STOP1B

维也纳时间2026-10-24 CEST。按用户停止点1复核裁定选A拒绝B，继续原F5分支，只补设计不实现。固定3ec38584核对D1/D2地区决策15行、CONTROLS18份、head-only/缺失HTML及遮蔽截图；错误区八站已有OPEN_LINK，类别All实际被D1点击，不能归因于Schema禁止或Executor拒绝；请求匹配LOCATION/站距控件仍缺证，范围按证据不足交复核。A细化临时入口、两有效坐标、代码距离方位、与4/5共用一次纠正、四类失败有界UNKNOWN和候选/预算保留；新增ADR-0043提议草稿，不改0040/0042正文。较早交接条件算术55.549秒余34.451，深层交接后恢复需5地区页而上限4，不以增加预算实现。例03未来冻结Kudanshita，人工800m类别0家、1000m环带未核对，用时只记录；C03-2/C09有界诚实无结果与零交付分开，原评分不改。43项输入SHA，0新模型/Google/餐厅网站/Live/环境重跑；不读.env，不动账本/产品/测试/站点。同步本分支记录，提交推送本分支后停1b，F1b先合main，之后重放时保留双方记录；不合并或推main。[当前报告](../../.eval-artifacts/phase3a-prime/f5-analysis/report.md#9-停止点-1b-补充) · [ADR草稿](../decisions/0043-provisional-directory-entrance-coordinate-check.md)。

## DEV-2026-10-24-PHASE3A-PRIME-F5-ANALYSIS

按已批准批次1B从main/2ada8a69建立codex/chore-phase3a-prime-f5-analysis，独立工作区保留主工作树9份用户改动。只读取3ec38584的两次例01诊断、例03两份完整结果及首个中断尝试；输出六问分析、逐来源/逐页/逐模型明细、原始输入SHA与最多两个通用层方案。Tabelog地区未完成且零详情，否定“只有两家所以首五家规则没触发”的实际归因；两家和同义词来自TableCheck。例03已执行备用地点Kudanshita，五家均在范围内，约148–150秒事实追查；新输入比较口径待冻结前明确。OPTIONS只分类不修，新增窄ADR的需要在方案中明确。报告与本批同步文档可能与并行F1同文件，待复核安排合入顺序；不改产品/测试/Runner/输入/权限，不合并main、不推送，停止点1。新真实模型、Google、网站和Live均0。[报告](../../.eval-artifacts/phase3a-prime/f5-analysis/report.md)。

## DEV-2026-10-25-PHASE3A-BOUNDARY-CONTINUATION-COMPLETE

- 用户将非目标差异改为只记录，基础设施/额度/S0才停；允许72主轮后最多15个开发差异v23单次控制，累计144不变、已用001复用。09bf7214先冻结新外层、输入/控制选择、原v23+Schema3参考和618项SHA；原提前停批结果未改。
- 外层将Gold比较与执行分开，合法当前提议经原Compiler可信冻结时间与Runtime/Reducer推进实际上下文；无效输出走原失败事件保留Draft，不用Gold代填上下文。主Prompt@24/Schema4、Scorer4、State20/TaskDefinition18、Gold均未改。v23旧契约仅隔离评测参考，不是生产兼容路径。
- CET23:38:56.599–23:43:07.827完成72＋11，累计84/144（旧1＋新83，含1Schema重试），余60、不占3a′400。目标/依据69/72，灰区额外45样本全推荐、每组3/3，2个carry组不作独立判定。全部值/raw/诊断/未标字段及未评问题逐行保留，Gold不自动修改。
- 10有效控制都仍偏离旧Gold，9份非目标值与v24相同；SR03泛化query不同但共同丢具名目标；SR08旧控制同样集合CONFIRM无效。定向单配对/继承上下文/Schema包差别不足因果识别，不将控制计入新规则。请求名deepseek-v4-flash，84响应均deepseek-flash，原样双列。
- 凭据仅受控Node按沿用窄授权加载，未独立读取文件，不输出密钥。来源/Google/Live0、私有Holdout未读。差异逐条确认清单含SR01及SR03-T02，停STOP_3，按授权推本分支，不合main。 [报告](../../.eval-artifacts/phase3a-boundary/report.md)。

## DEV-2026-10-25-PHASE3A-BOUNDARY-STOP3

- CET UTC+1；draft / not integrated into main，已暴露开发诊断。用户直接窄授权仅受控Node通过--env-file加载主检出凭据，显式deepseek-v4-flash；授权记录先提交，未独立读取文件，不输出密钥。薄外层逐原会话复用现有开发回归，预先冻结602项与全72轮选择，逐请求先记账再派发。
- f0cc436a自检/五门禁全绿后真实1次即SR01-T01停止。目标B→AVAILABILITY与两引用成立；yakiniku强度UNSPECIFIED→HARD，独立原Gold/原输出复核确认。日期/时间raw和人数来源表示另记，不当作最终日期错误；Compiler/Reducer未达。71轮无请求，其中1上游阻断、70未到达；不改Prompt/Gold，不补跑。
- 预算1/144独立、3a′400扣0，来源/Google/Live0。原State@20/TaskDefinition@18与生产源码保持原样。SR03-T02、14灰区及13未标target候选列后继Gold待确认清单，不回写历史。新Wednesday非Gold。停STOP_3，推本分支不合main。 [报告](../../.eval-artifacts/phase3a-boundary/report.md)。

## DEV-2026-10-25-PHASE3A-BOUNDARY-BATCH3-PREFLIGHT

- CET UTC+1；draft / not integrated，真实执行NOT_RUN。保存停止点2批准原文、72轮输入选择与停批计划。未改生产源码、Prompt、Schema、Scorer、Gold。595旧冻结文件匹配，灰区双轮不重复前缀，公开12例不重物化，Wednesday不作Gold。
- 任务进程与launchd均无DeepSeek凭据/模型配置。原指令禁读.env，未回退读取；已请求安全环境注入/已有启动入口。独立额度0/144，3a′400不扣；尚未完成/冻结真实调用外层，不把准备报告为停止点3或模型失败。 [报告](../../.eval-artifacts/phase3a-boundary/report.md)。

## DEV-2026-10-25-PHASE3A-BOUNDARY-BATCH2

- Evidence: current executable candidate / exposed development；本分支，尚未合main。时间使用CET UTC+1。
- 用户停止点1批准ADR-0044及144次独立真实模型上限；本批仅离线。Prompt@24/Proposal@4要求新TARGET的goalBasis，结构与当前消息每条引用核验失败沿既有两次输出尝试失败路径拒绝。无旧Proposal兼容；不加关键词/人数/店型判定。Compiler的TARGET冲突键保留goal，避免同query的两个目标被去重；依据不进入持久State。
- scorer/report@4消费SHA绑定的独立类别标注；A/B、无时间、灰区与CONTEXT_CARRY分开评价。旧Gold及旧evaluation不覆盖；非目标Proposal/Patch/Draft严格比较，保留逐阶段oracle。原Compiler回归调用方式保持不变；相对时间或诊断的差异仍须报告，不能以灰区豁免。
- 实际语义handler/Reducer、Agent严格动作Schema、生产读取组合推荐展示和可选slot回归已扩展；无语义后改目标写路径，保留既有权限与证据规则。State@20/TaskDefinition@18不升版，Guard、来源、站点目录、source-packs.ts及预约实现不改。
- 未来72逻辑turn输入选择冻结：15开发＋14灰区各3次＋公开已物化12例＋Wednesday新开发输入3次；私有Holdout和.env不读。本批真实调用0，停止点2复核前不执行批次3；SR03-T02列停止点3清单不改Gold。
- 实现冻结c9fe3039：离线15/15与五门禁1051/154全绿，原文/State/TaskDefinition/Gold字节不变；首轮额外时间诊断失败证据保留，收敛修复未放宽评分。结果见[报告](../../.eval-artifacts/phase3a-boundary/report.md)，完成后按授权推本分支并停下。

## DEV-2026-10-23-MAIN-ONLY-WORKFLOW

用户决定保留全部远端分支，不删除任何分支，第二阶段删除提案关闭。从第三阶段起main为唯一主线：新工作分支从同步后的最新main创建，验证及复核通过后合并回main。codex/feat-live-restaurant-read-path保留在第二阶段phase2-signoff历史指针，不再提交、合入新工作或作为新分支起点。当前签收缺口和历史tag不变；本次仅文档整理，不修改产品或运行Live。 在最新origin/main 3ecc26c3上创建codex/docs-main-only-workflow，仅向main推送；不更新第二阶段历史分支。[约定](../REPOSITORY-CONVENTIONS.md#git分支与tag)。

## DEV-2026-10-23-PHASE2-SIGNOFF-CLOSEOUT

用户于2026-10-23 19:51北京带缺口签收第二阶段；原始签收文件e9de81d6逐字合入，SHA457521eb…，不改历史判定。严格退出条件2未满足、3未完整评价、6未满足，条件4仅离线修复未经Live复验；H005两种口径并列保留。near/展示修复已在c32fe31c合并验证，源码335份逐字节未变，复用五门禁1029默认/138本机Chromium及69/5/22回归。按用户确认的分支tip创建4个历史annotated tag，最终主线另打phase2-signoff；main仅允许快进，授权原子推送后核对远端。32个远端分支清单已列，未删除任何分支，删除须逐项确认。新增模型/Google/网站/Live0；签收用量4395/5000模型、91/100 Live、5/10环境重跑，余额不转第三阶段。 [签收原文](../reviews/PHASE-2-SIGNOFF-20261023.md) · [收尾核对](../../.eval-artifacts/phase2-signoff-20261023/report.md).

## DEV-2026-10-23-NEAR-DISPLAY-REVIEWED-MERGE

例01诊断已结束并停下后，将复核9de09404合入主线4d953731，合并09b5d353；5份历史文档冲突保留双方，335份源码/Runner/配置逐字节匹配两条已复核分支，生产额外改动0。新五门禁1029默认/138本机Chromium/typecheck/arch/build全绿；先提交00ff1fa5冻结后，翻月69/69、选店5/5、校准22/22（正常声明20/20）通过。原主线TableCheck修复不变；主工作区9份文件/HEAD/状态、历史生成指标恢复核对通过。新增模型/Google/餐厅网站/Live/重跑0。最终证据提交后按用户授权推送主线，核对远端SHA后停下；原Live结果不改。 [报告](../../.eval-artifacts/near-and-condition-display-merge-20261023/report.md).

## DEV-2026-10-23-TABLECHECK-GUARD-REVIEWED-MERGE

Reviewed30494fba merged into8487a844 at46bd8ef9, conflicts0, product/eval source byte differences0. Fresh five gates1026/138 PASS; frozene925c8a0 calendar69/selection5/calibration22 with normal declarations20 PASS. Primary9 user files and HEAD preserved, historical generated metrics restored. Merge-slice model/Google/restaurant website/Live0. Authorized main push follows final evidence commit. Separately authorized case01 diagnostic remains excluded from original18; all qualification waits independent wording review. [Report](../../.eval-artifacts/tablecheck-guard-merge-20261023/report.md).

## DEV-2026-10-23-TABLECHECK-GUARD-HEALTH-COMPLETE

TableCheck Guard/source-health candidate complete on branch codex/fix-tablecheck-guard-preflight, main8487a844 unchanged. Implementation b6ac60c5; regression freeze abcf5ad9. Five gates PASS1026/138; frozen cached calendar69/69, selection5/5 and evaluator33 calibration22/22 with normal declarations20/20 PASS. h14 old-policy Chromium red and GET-bound CORS green retained; permanent reserve deny and unchanged host/path/method audit pass. Eval-only health attempts about10s concurrent, up to3 separated300000ms, before formal task/providers; actual entry failure test has0 external calls/Live. Frozen outer timing/ledger integration remains untested and needs preflight wait allowance. No new model/Google/real restaurant websites/Live. Authorized branch push follows final evidence commit, no main merge; await independent review. [Report](../../.eval-artifacts/tablecheck-guard-preflight-20261023/report.md).

## DEV-2026-10-23-TABLECHECK-GUARD-HEALTH-CANDIDATE

User-authorized candidate on8487a844, no main merge. h14 seven-key facet GET lacks hits; valid Chromium old-policy red retained, new GET-bound CORS green includes catalog/default GET/static fetch and rejects reserve/children, POST/manual OPTIONS, extra headers/path and absent GET. Scope audit proves unchanged origins/paths/methods/prohibited rules; only hits optional and existing TableCheck GET CORS metadata. Recorder facts and independent frozen reviewed-reads synchronized, no evaluator/Prompt/Schema/qualification change. Eval-only Hybrid health opens both known-region searches via production Guard, observes about10s, retries300000ms at most3 before formal timing/model/Google; actual Runner offline failure test confirms0 external calls/Live. Source homepage Range checks replaced only in this Runner; existing source-data checks remain. Prior CLI test assumed provider preflight before loading input; retained with new missing-input/no-preflight assertion, existing proxy unit regressions unchanged. Initial failure retained. Final five gates1026/138 PASS; source health real Chromium and unit/Runner tests pass. New models/Google/websites/Live0; freeze then69/5/22 pending. [Plan](../../.eval-artifacts/tablecheck-guard-preflight-20261023/plan.md).

## DEV-2026-10-23-NEAR-CONDITION-DISPLAY-ACCEPTANCE

两项生产修复分别提交44724106（具名AREA不依赖near词）与53ac158c（通用food描述与真实商家类型字段相接）。有效红灯保留，h-06保存输入向观测圆心/发现交接通过；Router→Reducer回放11份，4条菜系NOT_CHECKED→MET，与冻结@33独立真值一致，其他9份展示及价格/全局引用不变，33条对照均CONSISTENT。正式回放先提交274569c9冻结4271项，SHA0cea339a…；新五门禁1025默认/137本机Chromium/typecheck/arch/build全绿，同69点/5选店缓存真实响应回归69/69、5/5，独立校准22/22与正常声明20/20。0新真实模型/网站/Google/Live/重跑；State/Schema、Prompt、评测器、站点Guard不变，历史结果不改分。原始日志/输入SHA、四层报告和测试指标字节恢复均保留。仅推私有修复分支，不合并主线，等待复核。 [四层报告](../../.eval-artifacts/near-and-condition-display-20261023/report.md).

## DEV-2026-10-23-CONDITION-DISPLAY-REPAIR

第二项独立修复：当前来源与引用链未丢失，generic literal cuisine key没有去除food描述词，使已接纳的Korean food判断不能与商家Korean字段相接。沿用现有restaurant/cuisine描述处理，仅补通用food描述，保留所有菜系限定、同店同来源、当前字段、否定与餐段约束，不依赖模型标签直接判满足。有效单元与真实Router→Reducer红灯保留，修复后12/12通过：h-02三家/h-08一家MET与原@33真值一致，其他9份保存产物展示及两份价格/全局引用均不变。无Prompt/Schema/评测器变更、0新模型/网站/Live；五门禁和69/5/22正式回归待完成。 [计划](../../.eval-artifacts/near-and-condition-display-20261023/plan.md).

## DEV-2026-10-23-NEAR-NAMED-LOCATION-REPAIR

具名AREA（除nearby）按现有地名解析，不再要求文本含near；不加地点/关系词表，观测坐标、半径、类型、歧义、预算规则不变。保存h-06原Kitasenju输入和X/near X两条目标红灯有效；修复后Google/原生发现27/27通过。旧分页/预算Fixture补充显式观测圆心，不给生产绕过；Google-only pack回放仅证明定位向发现交接，不证明当前库存/完整Live。第一项独立提交，展示修复与全套五门禁、69/5/22仍待完成；本轮0新模型/网站/Live。 [计划](../../.eval-artifacts/near-and-condition-display-20261023/plan.md).

## DEV-2026-10-23-PHASE2C-REVIEWED-MERGE

Reviewed ae2235b6 merged onto remote-main baseline8ba0c54a in03f585a2, no conflicts.337 source/test/skill/script/build files byte-identical to16e91940, exceptions0; no product/Prompt/Schema/evaluator changes. Fresh post-merge five gates PASS:1022 default,137 Chromium, typecheck/arch/build. Frozen9ba840d7 rerun calendar69/69, selection5/5 and independent evaluator33 calibration22/22 with normal declarations20/20, all PASS; interrupted and incomplete evidence remain unknown. Main worktree HEAD/status/all9 user file hashes preserved. New model/Google/source websites/Live0, new holdout commitments/questions not searched or opened. Historical limits and exit6 unchanged. Final evidence commit and authorized normal push to codex/feat-live-restaurant-read-path follow, then stop. [Report](../../.eval-artifacts/phase2c-merge-20261023/report.md).

## DEV-2026-10-23-PHASE2C-FINAL-OFFLINE-COMPLETE

Final Phase2c repair branch complete, pending independent review, no main merge. Promptv23 final54 replay passes exposed constraints; chain162/220, no more tuning. Goya3 saved-page replays and installed-Guard Chromium composition pass without widening query/identity/qualification rules. Five gates1022/137 PASS; frozen8ad2d118 replay69/69 calendar,5/5 selection and independent22/22 calibration/normal declarations20/20 PASS,0 new calls. Same06287b6f source count narrow3863/expanded6359 physical, this-chain delta0, shared constant candidates0; historical+272/+721 and exit6 NOT_SATISFIED retained. Google29/30 unchanged: Omotesando returned route, rejected; old Ebisu cause and40 missing ranked-response projections remain gaps. New continuation model54, Google0, websites/Live0. Initial5b2ea9bf remote verified; final authorized branch push follows evidence commit. [Report](../../.eval-artifacts/phase2c-location-semantic-20261023/report.md).

## DEV-2026-10-23-PHASE2C-BOUND-CLOCK-COLLECTION

Goya parser repaired by retaining independently bound supported clock alternatives; no extended-hour conversion or new source branch/permission. Three saved full-HTML/projection replays complete with41 supported slots including19:00 each; missing supported-time, mismatched binding, newer contradiction, all-unsupported and PENDING negatives remain UNKNOWN. Actual createLiveReadAssembly with Guard INSTALLED returns AVAILABLE/19:00 on local HAR,0 model/Google; valid before-fix composition UNKNOWN red preserved. Initial fixture setup failures explicitly excluded. Five gates all PASS:1022 default,137 Chromium, typecheck/arch/build. Production source physical delta0; formal same-scope audit and69/5/22 offline regression pending. Raw response time was not captured, so saved projection plus independent Chromium proves the mechanism, not current stock or full-task delivery. [Scope](../../.eval-artifacts/phase2c-location-semantic-20261023/goya-followup/scope.md).

## DEV-2026-10-23-PHASE2C-SEMANTIC-FOLLOWUP-PASS

Final one-shot promptv23 replay completed54/54 with54 new calls, no retries; chain162/220. Sit-down retained and invented with-tables removed3/3; NEGATIVE standing-counter preserved. Numeric-direction rows12/12: flexible under remains SOFT6/6, firm under/at-most existing max representation6/6. No more than/below absent from frozen18 messages, not separately sampled. Implementer read all54 paired condition lists and observed no other criterion regression; independent review pending. All30 changed full patches and original/v21/v22/v23 criteria retained, no historical inputs rewritten. No more prompt changes. [Comparison](../../.eval-artifacts/phase2c-location-semantic-20261023/semantic-followup-220/comparison.md).

## DEV-2026-10-23-PHASE2C-SEMANTIC-FOLLOWUP-FREEZE

User raised the chain ceiling to220 (prior108 calls) and authorized one final generic prompt revision. Promptv23 requires each modifier to correspond to user words; explicit sit-down remains allowed.54 after trials reuse the frozen54 before controls with identical captured clocks/schema/model. Valid prompt-wire red and31 semantic green retained; prepare0 network. No further prompt tuning after this batch, pass or fail. Initial5b2ea9bf repair branch pushed and remote verified. Full gates and quality replay pending. [Plan](../../.eval-artifacts/phase2c-location-semantic-20261023/semantic-followup-220/approval.json).

## DEV-2026-10-23-PHASE2C-SEMANTIC-STOP

Stopped Phase2c after real semantic replay failed:108/108 trials executed with108 calls, no retries; v22 still adds HARD sit-down restaurant with tables in3/3 after samples. Relevant soft-upper-bound after6/6 correct but v21 controls also correct, so no sampled improvement claim. Full next after sweep needs54 calls, projected162>150; remaining42 is insufficient, no quota extension or extra sampling. Google29/30 on30 calls; Omotesando route type left unsupported. Six saved rejected-location observations now resolve,3 recorded empty lists remain unresolved,40 old selected projections lack ranked response/types and remain NOT_EVALUATED. Goya saved query/date/party and19:00 response confirmed, collection parser rejects non-clock tail; diagnosis only, no provider-specific patch. Zero-call offline five gates1021/136, cached69/69+5/5 and independent22/22 calibration/normal declarations20/20 PASS do not override semantic failure. Site-specific lines net0 this batch; historical increase retained. Mainline integrated/pushed8ba0c54a; repair branch local only, pending user decision. New source websites/completeLive0; chain model count3634+108=3742/5000, local cap150 unchanged. [Report](../../.eval-artifacts/phase2c-location-semantic-20261023/progress-report.md).

## DEV-2026-10-23-PHASE2C-SEMANTIC

Phase2c semantic candidate: promptv21 to v22, schema3 and compiler unchanged. Generic entailment/polarity rule rejects invented positive prerequisites/amenities; numeric relation/direction/strictness is independent of condition strength, so a flexible ceiling remains a SOFT ceiling. Valid prompt-wire red retained,31 semantic tests pass; actual saved affected-family proposals preserved as quality red evidence. Prepared18 exposed families x3 repetitions xbefore/after=108 trials, existing schema retry envelopes frozen, real-model hard cap150. Same captured clocks on both sides;54 before system messages byte-identical to original captures. Original materialized-clock inputs retained, no historical request/Gold rewrite. Real semantic replay pending; current new Google30, source websites/Live0. [Plan](../../.eval-artifacts/phase2c-location-semantic-20261023/continuation-plan.md).

## DEV-2026-10-23-PHASE2C-LOCATION

Phase2c location candidate: delete spelling/suffix admission and use ranked valid geographic observations; preserve100km context and leading-three separation bound, merchant-only unresolved. Same adopted center/name exposed in Web reply and artifact; original AREA retained. Valid saved Ningyocho red and actual Web-composition display red retained; google24/24, Web production-composition1/1, typecheck/arch/default1021/build pass. Five obsolete spelling-only tests retired in favor of ranked/type/distance behavior, not skipped. Existing successful-coordinate fixture still passes. Thirty Google names were committed at e04e9700 (SHA206c368b15133eea1204ca82af026c043336ae66911e83bec9f78a34605b435d). Google/saved-response checks pending frozen execution;0 new model/Google/site/Live so far. Ebisu upstream empty-list cause remains unknown due missing raw HTTP. No invented request fallback. [Plan](../../.eval-artifacts/phase2c-location-semantic-20261023/continuation-plan.md).

## DEV-2026-10-23-PHASE2C-MAINLINE-INTEGRATION

Integrated exact prep06287b6f into main06703ba1 in merge6cbf43c8, preserving both histories, main allowance5000 and Phase2b decision. No manual conflicts;331 source/test/skill/script/config files match1a715325 byte-for-byte with0 exceptions. State20/Evaluator33/rubric29. Fresh five gates1024/136 PASS, cached calendar69/69 and selection5/5, independent22/22 calibration and normal S0 declaration20/20. No new models/Google/source websites/completeLive; local user worktree unchanged. Phase2c implementation pending on the integrated base. [Report](../../.eval-artifacts/phase2c-mainline-integration-20261023/report.md).

## DEV-2026-10-23-CHECKPOINT-C-PHASE2B-OFFLINE-EVALUATION

仅离线评价保存的18次第二阶段b运行；对应及结构预算先登记SHA并提交冻结，固定Evaluator33/rubric29无后改。7QD/7MISS/2未合格/2未评，例01与04各3/3，仅2例达单例门槛；例02按运行前无见证批准排除。39条对照33一致、6条已审不等价价格展示未对应。S0 PRESENT为0，声明4次/越界6次未完整评价；退出2/4/6未满足、3未完整评价，5仅指标。站点窄口径3591→3863（+272），共享层新增常量候选0。0新模型/网站/Live/重跑，累计3634/5000模型、72/100 Live、3/10环境重跑。原始材料、Gold、评测器、rubric与登记不改；仅私有准备分支推送后停下等签收。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/evaluation-20261023/four-layer-report.md).

## DEV-2026-10-23-CHECKPOINT-C-PHASE2B-WORDINGS-PENDING

第二阶段b原顺序18槽位已全部保存原始产物与SHA；本批294模型、18完整Live、0环境重跑，累计3634/5000模型、72/100 Live、3/10重跑。Live冻结69209a016be68d6df97417fa7679d70b0e321212ab0c6d6400f361ba507f8448的884项未变；完成于2026-10-22T22:23:37.641Z，早于见证截止。仅抽14份产物的20条候选措辞配对；无能力评价/退出结论，等待独立措辞判定。第02例既定业务无见证排除记录保留，未修改产品/Prompt。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/exit-live/pending-wordings.md).

## DEV-2026-10-23-CHECKPOINT-C-PHASE2B-WITNESS-RESUMED

已批准恢复的评测侧见证认证完成：五例有见证，一例主地点及承诺fallback业务无见证，按用户预先批准排除能力分母并保留全部18槽位。80来源请求、0模型/Live/环境重跑；新增外层19项控制全绿，生产与Prompt字节未改，复用已验收五门禁及回放基线。累计3340/5000模型、54/100 Live、3/10重跑；最早见证截止2026-10-23T17:14:00.086Z。下一步提交最终冻结后连续执行18次，能力评价延后，仅提措辞等待复核。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/plan.md).

## DEV-2026-10-23-CHECKPOINT-C-PHASE2B-STEP3-HTTP400-STOP

已批准连续任务：步骤1验收与步骤2三次暴露Live检查通过；步骤3只读认证在四参数接口HTTP400处按冻结采集器停止，原始响应与部分登记已保存，未将来源失败/未到达冒充业务无见证。新留出Live 0/18、未作能力评价；本阶段认证0模型，累计3340/5000模型、54/100完整Live、3/10环境重跑。详见停止四层报告、部分登记、源节奏审计和冻结；等待复核。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/plan.md).

## DEV-2026-10-22-CHECKPOINT-C-PHASE2B-WITNESS-INPUTS

在前两步全部通过后才打开复核者提供的da8ff090新留出：承诺eb5458b2与71d9961c及提供分支逐字一致，原文358beff8、6份用例SHA独立匹配，字符串严格校验通过。按东京10月23日物化6例日期，与复核exit-dates一致，只填日期无其他更改。原文只用于本次退出认证/执行，不复制到开发Fixture、语义Prompt或开发日志；生产代码保持三次合格检查的版本。准备冻结后0模型、30秒来源节奏查找认证。现累计3340/54/3、上限5000，剩1660/46/7；尚无新留出模型请求或Live，能力评价延后。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/plan.md).

## DEV-2026-10-22-CHECKPOINT-C-PHASE2B-STEP2-LIVE-PASS

三次旧暴露完整Live检查全通过：例03两次及例01对照均Evaluator33/rubric29 QD，各交付3家，三次实际先到Tabelog。例03见证1/2进候选，两次返回18:00至20:00窗口内九时刻并集；例01见证3/3入候选，19:00。声明/越界均ABSENT；无重跑，间隔/500秒/50模型/40Google/旧见证有效期均满足。新增60模型/3Live/0重跑，累计3340/54/3，按5000剩1660/46/7；不计任何退出分母。冻结8afad494/4175项前后通过，原始/独立评价/四层报告已保存。第三步新原文仍未打开，接下来核对承诺及分支后准备新见证，最终18次只提措辞不评价。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/four-layer-report.md).

## DEV-2026-10-22-CHECKPOINT-C-PHASE2B-STEP1-COMPLETE

第一步合并验收全部满足：预算/团体/流水线已按序进入准备分支，模型累计上限5000。实际五门禁1024/136、缓存真实响应69/69与选店5/5、独立校准22/22及旧例02五条预算均CONSISTENT。69与5请求经当前生产重建后逐项内容相同；无新模型/网站/Live。冻结f648d2df/4173项前后核对，当前3280/51/3、剩1720/49/7；旧原始/评价/Gold保持。新留出未打开，进入已批准三次旧暴露Live检查，必须在旧见证北京时间10月23日14:41:36前完成；不过门槛即停，不续期。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/four-layer-report.md).

## DEV-2026-10-22-CHECKPOINT-C-PHASE2B-MERGED-INPUTS

已按顺序合入预算200e13cf、团体98cc7994、退出流水线47afd2d7，逐项保留各方行为、测试与历史正文，统一State20/Task18和文档修订；只摘取06703ba1预算批准。累计模型上限5000，当前3280剩1720；Live100与重跑10不变。实际五门禁1024/136全绿；69+5请求经当前生产重建，与批准内容完全相同（仅既有30秒传输超时差异），准备提交冻结后复用真实响应验收、独立22校准及旧例02五预算行回放。三次检查入口复用同一外层，仅三槽计划/单独授权，16项控制通过；原18槽行为保留。新留出未打开，模型/外站/Live增量0。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/plan.md).

## DEV-2026-10-22-PHASE2B-EXIT-PIPELINE-COMPLETE

Phase2b退出流水线已完成零网站/零模型离线验收：最终d662a23b冻结3112项，旧暴露18槽位完整通过；6例见证3/3/2/3/1/2，9条目12措辞对不附结果，3份结构预算对应，缺判词评价0次、复用旧独立判词后18份评价。五门禁全绿（1005默认/131本地浏览器）。新留出仅71d9961c承诺未开原文，产品/ADR/Gold/预算及例03不改；旧500076/500080ms超限保留。此为流水线准备验收，非新留出或阶段退出；基线剩720模型不足900最低预留，未扩容。推送后停下等复核。 [报告](../../.eval-artifacts/phase2b-exit-pipeline-20261022/four-layer-report.md).

## DEV-2026-10-22-PHASE2B-EXIT-PIPELINE-PREP

在17415d1c独立分支准备Phase2b退出流水线；仅引入71d9961c承诺，未读新留出原文。增加SHA先于解析、非字符串条件拒绝、日期/后备记录、800米见证、18槽位及措辞复核门禁，复用旧Runner/独立Evaluator33。旧例05类型门禁红绿通过，后续提交冻结后演练旧已暴露18产物；模型/网站/Live均0，预算修复和例03不改。 [计划](../../.eval-artifacts/phase2b-exit-pipeline-20261022/plan.md).

## DEV-2026-10-22-CHECKPOINT-C-BUDGET-CONDITION-COMPLETE

结构预算漏核对和漏展示已修复：生成稳定criterionRef的HARD行，资格与展示共用来源价格结果，超预算/无价拒绝；SOFT比较含义和既有价格政策保留。h-02/h-08/h-14原事件经当前Router→Reducer，5条预算及全部10条条件与Evaluator33/rubric29独立评价CONSISTENT，原产物/旧评价不覆盖。4个红灯、42项相关测试、实际五门禁（1001/1001、131/131）与校准22/22全通过。代码46d471ff；回放冻结5ff44333（2898项）、校准0452645d（808项）运行前后均一致。h11的around已在原模型Proposal，3495ms成功而非超时，仅报告比较方向修正建议，未改语义Prompt。0新模型/网站/Live，累计3280/51/3不变；仅本修复分支，未集成，推送后停下等复核。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/budget-condition-20261022/four-layer-report.md).

## DEV-2026-10-22-CHECKPOINT-C-BUDGET-CONDITION-INPUTS

在请求分支修复结构预算遗漏：同一条件结果供HARD核对和展示，保留现有SOFT政策及来源约束。已复现4个红灯并通过42项相关回归；完整单测1001/1001、本地浏览器131/131通过，W11测试替身补齐来源报价事实。准备提交当前代码、三份已保存例02输入和离线脚本后冻结，再跑五家Router→Reducer的独立33展示复核与22项校准；h11只报告语义Proposal已改写比较方向，不修改Prompt。无新增模型/网站/Live，不改旧运行和评价，未集成。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/budget-condition-20261022/plan.md).

## DEV-2026-10-22-CHECKPOINT-C-HOLDOUT-CASE05-REASSESSMENT

按19941c4e批准的可逆格式恢复补评例05三次，使用原Evaluator33/rubric29和原证据。h-05/h-17由原NE变QD，h-11格式错误消除后仍因已判不等价的SOFT措辞保留NE；旧三份NE、原始运行、Gold和承诺SHA不覆盖。全18参考结果10QD/7MISS/1NE，例05达2/3，共4/6例达标；仅数值子门槛通过，例03第一卡点仍属P2-1，完整退出2仍不满足。退出4/6不满足、3未完整评价、5仍仅指标；S0声明17ABSENT/1未评、越界15ABSENT/3未评，无新阳性，历史H003和H005两种口径保留。冻结d6315af5前后2975项、旧779/2891项、326生产/评测及483校准输入SHA均通过，复用五门禁和22/22校准。其他15评价不重跑，增量模型/网站/Live/重跑0，累计3280/51/3不变；推送后停下等签收。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/evaluation-20261022/case05-reassessment-20261022/four-layer-report.md).

## DEV-2026-10-22-CHECKPOINT-C-HOLDOUT-CASE05-FORMAT-RECOVERY

按19941c4e和用户批准，只对例05三份原SHA绑定的required_claims[1]单键对象逐字恢复为字符串；三份输入往返还原与唯一字段差异核对已通过。使用Evaluator33/rubric29现有批准更正接口，原始Gold/承诺/运行/旧NE不变，其他15份评价不重跑。准备提交冻结后0网络0模型补评三份，按原阈值与第一卡点条款更新退出，推送后停下。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/evaluation-20261022/case05-reassessment-20261022/plan.md).

## DEV-2026-10-22-CHECKPOINT-C-HOLDOUT-EVALUATION-COMPLETE

已按dfdb175b完成18份保存产物的Evaluator33/rubric29离线评价；原始对应后5QD/3未合格/7MISS/3未评，结构预算对应的3份表示视图后为8QD/7MISS/3未评，原始和派生SHA并列。例02预算8000JPY保留，5条预算展示缺失；h-11 SOFT不等价未登记，另3条无等价展示。仅3/6例达2/3，退出2/4/6不满足、3未完整评价；52条件44一致、8未对应，0unsupported/missed。例05三份冻结required_claims字段object导致未评，未改Gold或排除本例。站点目录3591→3809行（+218），含混合文件5638→6279（+641）；共享层新增站点等常量候选0。有展示11次中位193.250秒/最大286.209秒仅指标；历史H005两口径和H003 S0保留。779 Live/2891评价冻结项、18原始SHA、326生产/评测文件及483校准输入均核对，复用五门禁998/131和22/22。新增模型/网站/Live0，累计3280/51/3不变；推送报告后停下等签收，不报告阶段通过。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/evaluation-20261022/four-layer-report.md).

## DEV-2026-10-22-CHECKPOINT-C-HOLDOUT-EVALUATION-INPUTS

离线评价前已同步dfdb175b：9原产物9等价对应，6对拒绝（含1个SOFT偏差、5交叉配对）。例02三次的语义事实与最终意图均保留结构预算8000JPY；单独登记原SHA与字段路径，未补造价格核对或展示。为不改Evaluator33建立3个仅预算表示投影的评价视图，原始字节与原始33评价保留。阶段起点025940c5审计站点目录3591→3809行、含混合文件5638→6279行，退出6不满足；共享生产层新增常量候选0。准备提交冻结后用网络阻断器评价全部18份，不改产品、不跑模型或Live。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/evaluation-20261022/plan.md).

## DEV-2026-10-22-CHECKPOINT-C-HOLDOUT-AWAITING-WORDINGS

六例见证3/3/2/3/1/2；按冻结d97eeab7完成18槽位、19次尝试（1次合规预检环境重跑），北京时间19:14:03结束，在最早见证24小时窗内。仅离线提取9原产物/15待对应措辞，逐条SHA和零基编号已核，不生成能力/条件/展示/退出评价。记录耗时最大500080ms超500000上限80ms，单列协议偏差待复核，未放宽阈值；原始与779冻结项保持。累计3280模型/51完整Live/3环境重跑，原始秘密扫描0匹配。本留出已暴露，非后续Clean基线；推送原始、账本及措辞后停下等独立判定。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/plan.md).

## DEV-2026-10-22-CHECKPOINT-C-HOLDOUT-LIVE-READY

六例见证全部有效（3/3/2/3/1/2），截止不重置为最早观察后24小时。0网络0模型完整演练已走通外层、完整Runner、独立S0安全检查、延后执行清单和措辞提取，未生成能力评价文件；13项新增/核心控制全绿，其他既有控制另留日志。326生产/Prompt/评测文件未变，五门禁按SHA复用。即将冻结18次完整留出运行，不带run-ids；完成后仅提交待复核措辞和原始记录，不报告评分。C签收H005严格原规则与用户特批30秒两口径并列。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/plan.md).

## DEV-2026-10-22-CHECKPOINT-C-HOLDOUT-LIVE-INPUTS

第05例按复核许可的商家地域/业态字段及四参数原始库存补证，六例3/3/2/3/1/2家均认证；其余完整来源不重采。仅Runner机械投影落实已批准备用地点。外层新增冻结留出计划与延后评分：Runner不自动评价、仅保留独立S0及环境重跑白名单；12项离线控制通过，326生产配置文件与通过基线SHA相同。准备0网络0模型接线演练再冻结18次，尚未运行留出Live。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/plan.md).

## DEV-2026-10-22-CHECKPOINT-C-HOLDOUT-CONTINUATION

依据044f7de7及用户续行批准，补充第05例非川菜细分类别见证；无见证仍完整运行18次且排除该例能力分母。沿用其余有效登记，30秒决策不变，准备冻结延后评价编排；运行后仅提交未对应措辞，不生成评分。当前仅离线准备，原停止材料保持。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/plan.md).

## DEV-2026-10-22-CHECKPOINT-C-HOLDOUT-WITNESS-STOP

C17用户特批30秒重跑已QUALIFIED_DELIVERY（3家、29/29模型成功），C机械门槛PASS；随后按批准步骤解封并核对原文件/6例SHA，0模型认证登记为3/3/2/3/0/2家，两个唯一备用地点均留证。第05例备用地点仍缺负向HARD明文，见证门槛5/6而停；留出18次和措辞对提取均NOT_REACHED，不生成产品评分或最终Live启动冻结。生产/Prompt/评测器与C17通过时逐字节相同，复用五门禁998+131和校准22/22；累计Live33、模型2885、完整Live环境重跑2，认证传输重试单列。等待复核，不继续来源请求或Live。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/four-layer-report.md).

## DEV-2026-10-22-CHECKPOINT-C-HOLDOUT-INPUTS

前两步通过后才解封指定留出提交b1ed9979；原5418字节与承诺SHA、6例文档SHA全部一致，commitment与父提交逐字节相同。原文不改，Runner只按exit-dates物化日期并添加运行信封，其他条件/验收一致。当前只准备0模型地点解析/见证发现，不开发或调试生产代码/Prompt；正式18次后按用户要求仅抽未对应措辞、不附结果。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/plan.md).

## DEV-2026-10-22-CHECKPOINT-C-C17-TIMEOUT-PASS

用户特批30秒决策补跑通过：c17 attempt3在214.037秒以29模型交付3家，@33 QD，S0声明/越界ABSENT，6条展示均CONSISTENT，3家事后GET200；一次浏览器模型响应15.692秒成功（旧限10秒）。29/29模型成功，旧CAPABILITY_MISS和全部原始未覆盖。H0052/3QD，其余TARGET各3/3；当前用户C门槛PASS。默认998/浏览器131及五门禁全绿，@33校准22/22只复用经SHA验证的不变评价输入。累计2885/4000模型、33/100Live、2/10正式重跑（用户特批额外1次保守计入），随后按原连续授权进入留出准备，当前尚未打开。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/c17-timeout-retry-20261022/four-layer-report.md).

## DEV-2026-10-22-CHECKPOINT-C-C17-TIMEOUT-INPUTS

用户额外批准H005一次补跑：Agent及Browser决策超时10→30秒，500秒/50模型/40Google总限额不改；不增加自动重试，不改模型/消息/Prompt/Schema/@33评价。旧29调用含2次TIMEOUT和CAPABILITY_MISS保留。先红绿及五门禁，提交新freeze后只跑c17 attempt3；本次额外正式补跑保守记第2/10环境重跑。留出集仍未打开。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/c17-timeout-retry-20261022/plan.md).

## DEV-2026-10-22-CHECKPOINT-C-C17-STOPPED

第一步双向引文修复已通过（38一致+2外部支持，0 unsupported/missed，校准22/22，五门禁全绿）。c17唯一补跑258.141秒/29模型/0交付：最后Agent调用10.004秒TIMEOUT，@33独立判CAPABILITY_MISS；本次声明/越界S0均ABSENT。H005仍1/3QD，其余TARGET各3/3，C门槛FAIL，按用户机械停止规则未打开留出集。新增1Live/1环境重跑，累计2856/4000模型、32/100Live、1/10环境重跑。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/c17-environment-retry-20261022/four-layer-report.md).

## DEV-2026-10-22-CHECKPOINT-C-C17-RETRY-INPUTS

离线补修通过后按用户连续授权准备c17唯一环境重跑：resume@3验证原18份、TypeError独立复查失败、复核SHA和第一步五门禁/七条展示门槛。外层绑定@33/rubric29并按1次预留50模型，原18顺序/预算/停止规则不变；HARD仅绑定运行自身原始快照与当前已复核见证。留出集仍未打开。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/c17-environment-retry-20261022/plan.md).

## DEV-2026-10-22-CHECKPOINT-C-BIDIRECTIONAL-PASS

第一步双向字段引文补修通过：同一C18的40条展示对照38 CONSISTENT、2 PRODUCT_UNKNOWN_EXTERNAL_SUPPORT，天妇罗4/4、Utou3/3均一致，0 unsupported/missed；校准22/22，五门禁998+131全绿。网站、模型、Live均0；旧原始及评价SHA保持。连续授权下一步为c17唯一环境补跑，留出集尚未打开。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/c18-bidirectional-acceptance-20261022/four-layer-report.md).

## DEV-2026-10-22-CHECKPOINT-C-BIDIRECTIONAL-INPUTS

按复核者决定修复双向字段引文：完整字段被所选段落包含时仅展示字段原文；分行文字被字段包含时展示所选文字。Utou原三条红灯已复现，修后与天妇罗四条及跨角色评论边界均通过。当前仅离线；待C18回放@33、校准和五门禁后才解锁c17补跑，留出集未读取。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/c18-bidirectional-acceptance-20261022/plan.md).

## DEV-2026-10-22-CHECKPOINT-C-C18-ACCEPTANCE-STOPPED

STOPPED于离线验收：字段⊇语句修复使天妇罗4/4 CONSISTENT，Evaluator33/rubric29使Kaga2条单列PRODUCT_UNKNOWN_EXTERNAL_SUPPORT，unsupported0；但Utou标题含相邻8 items计数时丢失角色，c05/c09/c13新生3条MISSED，C18无MISSED门槛失败。未继续改口径、未消耗c17环境补跑、未读取留出集。已将同一实际判断适配器->Router->Reducer反例纳入默认：最终996/997（1失败），不是五门禁全绿；其余type/arch/build及本地Chromium131/131通过，校准22/22/声明20/20。13份展示回放/@33评价保留，5份N/A，原2299材料/18结果/18旧评价未变。新增模型/网站/Live0，累计2827模型/31Live/0正式环境重跑不变；推送准备分支后停下等复核。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/c18-acceptance-20261022/four-layer-report.md).

## DEV-2026-10-22-CHECKPOINT-C-C18-FIELD-ROLE-EVALUATOR33-PREP

依据复核fbb200ec开始用户批准连续步骤，当前仅离线第一步：字段⊇所选完整语句继承角色并保留所选原句；不扩成未选整字段。Evaluator33/rubric29分离产品已观察支持与外部支持，Kaga未知不再误记missed，S0和unsupported不放宽。两条有效红灯保留，初步相关159/159，准备提交冻结、重做C18展示回放/校准/五门禁。留出分支未打开；H005补跑尚未开始，必须先过第一步并在20:23前完成。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/c18-acceptance-20261022/plan.md).

## DEV-2026-10-22-CHECKPOINT-C-C18-OFFLINE-COMPLETE

本离线切片完成，非阶段签收：只在准备分支合入复核6d758f70的Evaluator32/rubric28及4fcf7702的展示修复，登记仅9个原SHA/12对应（旧13不变），当前认证见证原句限定清单已提交冻结。18份保存产物按原31、31+对应、32+对应+HARD并列：4QD/12NE/1MISS/1HONEST -> 12QD/4NE/1MISS/1HONEST；原始评价不覆盖。真实Router->Reducer回放13份、5份N/A，32展示unsupported4->0，H002价格遗漏3->0；仍6条MISSED（人工见证2、字段/摘录粒度4），逐条留证。退出1/3未评、4未满足、5中位224.642秒/最长341.062秒仅指标；不报告阶段通过。五门禁994/131全绿、校准22/22、正常S0声明20/20；2299原始文件、18原产物与18旧评价SHA不变。新增模型/网站/Live0，累计2827/31/0不变。提交并推送准备分支后停下等复核，不跑Live。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/c18-offline-reassessment-20261022/four-layer-report.md).

## DEV-2026-10-22-CHECKPOINT-C-C18-DISPLAY-REPLAY-RESULTS

离线Router->Reducer展示回放13/13，另5份无展示明确N/A；2738输入与2757评价输入运行后核SHA通过。32评价S1_UNSUPPORTED 4->0，H002漏价格3->0；同时保留6条MISSED（Kaga人工见证2、tempura选中摘录与字段范围4），不扩大规则强行通过。默认994项首轮仅登记旧数量断言13/20失败，已按复核精确更新为22产物/32对，其中新增9/12；失败日志保留，继续最终门禁。原C18/评价不改，0新增模型/网站/Live。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/c18-offline-reassessment-20261022/plan.md).

## DEV-2026-10-22-CHECKPOINT-C-C18-DISPLAY-PRICE-REPAIR

已合入复核展示分支4fcf7702，五文档冲突保留双方历史。H002价格缺失根因为后续事实读取未保留同页结构化价格；现由原生产解析器随当前来源文档传递，模型消息不增加元数据，旧证据不复活。消费者原反例与生产者隔离红灯均为有效断言，当前相关28/28；三条C12/C16价格经Router->Reducer为MET。State19/TaskDefinition17/condition-states3，FactPrompt14/Schema4、Browser19/Context2和Evaluator32/rubric28分别统一，未变的轴不虚增。下一步提交冻结后回放13份已有展示，5份无展示不补造；0模型/网站/Live，账本2827/31/0不变，非Clean。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/c18-offline-reassessment-20261022/plan.md).

## DEV-2026-10-22-CHECKPOINT-C-C18-REASSESSMENT-RESULTS

C18两套离线补评18+18完成，2678冻结项运行后未变、外部调用0。原31为4QD/12NE/1MISS/1HONEST；31+对应和32+对应+当前HARD均12QD/4NE/1MISS/1HONEST，三者新文件并列，原评价不改。展示对照S1_UNSUPPORTED：原11→31对应16→32为4；MISSED_KNOWN_CONDITION仍3。剩余未知保留c02/c04/c08/c17，不补抓网络或重跑模型；下一步合入4fcf7702进行展示反事实回放。累计模型2827/正式Live31/正式环境重跑0不变，非Clean Baseline。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/c18-offline-reassessment-20261022/plan.md).

## DEV-2026-10-22-CHECKPOINT-C-C18-REASSESSMENT-FROZEN

C18离线双评输入已准备：Evaluator32/rubric28，归档31代码3aeb708b；9产物/12对应、80保存快照、17当前认证见证引用。Fukumimi旧原句本次未找到，未加入人工HARD输入。重评冻结f14117b790c18531691996af5de9a39e8fa8fccaa5678ece39ba3abeb9d3f18b，共2678项依赖与原始文件已核SHA；提交后仅本地运行两套18份评价，原评价不覆盖。0新增模型/网站/Live，账本2827/31/0保持；展示修复尚未合并，非Clean。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/c18-offline-reassessment-20261022/plan.md).

## DEV-2026-10-22-CHECKPOINT-C-C18-EVALUATOR32-MERGED

C18离线重评已合入Evaluator32/rubric28及其独立复核6d758f70；五份并行文档冲突保留双方历史，Eval Skill同步到当前32契约。登记仍仅9个C18原始SHA/12配对，旧13条不变。下一步准备当前认证见证与保存HTML清单、提交冻结后进行31/32并列重评。尚未运行新评价或展示回放，0模型/网站/Live，账本2827/31/0不变；draft / not integrated，非Clean。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/c18-offline-reassessment-20261022/plan.md).

## DEV-2026-10-22-CHECKPOINT-C-C18-CORRESPONDENCE

C18离线重评准备：按独立复核5b470eaa登记9份原始SHA/12个条件配对，原13条登记不变，独立字面审计与加载器控制通过，H002交叉配对0。原18个result及旧评价保留；当前仍为Evaluator31，后续合入32并冻结本次见证/保存HTML输入。0新增模型、网站、Google、Live或环境重跑，累计账本2827模型/31正式Live/0正式环境重跑不变。draft / not integrated，非Clean Baseline。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/c18-offline-reassessment-20261022/plan.md).

## DEV-2026-10-22-CHECKPOINT-C-CONTINUATION-RESULTS

当前C18正式18次完成（原8次保留，续跑c-09至c-18共10次）；冻结评测器@31/rubric@27：4 QUALIFIED_DELIVERY、1 CAPABILITY_MISS、1 HONEST_NO_RESULT、12 NOT_EVALUATED。退出条件1/3为NOT_EVALUATED，4为NOT_SATISFIED，5仅测量（交付中位224.642秒、最大341.062秒）；正式S0声明9 ABSENT/9未评价，越界18 ABSENT。续跑新增231模型调用/10正式Live；累计2827/4000模型、31/100正式Live、0/10正式环境重跑；原8次/178调用不重复计账。续跑冻结a6843af52023b2febdcb6fc5e5b576262c649fb82f1d686a7d59706b2c701e1e；558冻结输入、1044旧原始文件与2299总原始文件SHA核对通过。汇总审计0网络/模型，非Clean Baseline；已结束执行，提交推送后停下等独立复核。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/four-layer-report.md).

## DEV-2026-10-21-CHECKPOINT-C-CONTINUATION-READY

用户要求继续剩余Live；只从c-09预检失败处额外进入1次，再原序c-10至c-18，不带--run-ids。旧8次正式样本/10条attempt原评价不动，神乐坂自动额度仍耗尽，S0继续立即停。仅替换过期c03恢复入口为当前c09证据绑定；31项离线控制通过，生产/外层主脚本/计划/评测器@31/rubric@27均未改，旧门禁与69/5/22结果复用。账本2596模型/21Live/0正式环境重跑，所有47来源SHA核对；截止仍10月22日20:23:38.769北京。先提交冻结后启动，未知条件与展示问题继续如实记录。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/plan.md).

## DEV-2026-10-21-CHECKPOINT-C-LIVE-STOPPED

Live冻结598585fd（507文件）保持不变，评测器@31/rubric@27。见证重新认证6/6通过（15/16家有匹配库存）。C18于c-09预检失败后按同一用例重试已耗尽停批；8次完整Live：QD2、CAPABILITY_MISS1、NOT_EVALUATED5，另2次来源预检失败；c-10至c-18 NOT_REACHED。声明6 ABSENT/2未评、越界8 ABSENT（正式运行），不作零S0签收。模型178含8次TIMEOUT、Google28；累计2596/4000模型、21/100完整Live、0/10正式环境重跑，来源重试1单列。退出1/3/4未验收；四层报告与原始result/decisions保留，停止等待复核。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/plan.md).

## DEV-2026-10-21-CHECKPOINT-C-RECERTIFIED

Six-case recertification PASS,15/16 witnesses: H0012,H0023,H0033,H0052,Kagurazaka2,Kichijoji3.33GET all200,min gap30s,0model/Google/Live/retries. Komuro no matching19:30 retained; dates unchanged. Earliest2026-10-21T12:23:38.769Z,Live deadline2026-10-22T12:23:38.769Z. Original raw/capture freeze unchanged; completed-capture offline audit corrected whole-object equality for optional dow, preserving old failure/script and new497-file auditfreeze. Final Live freeze598585fd34b9b5877ba644cdfb5b6a20d4cf83a796de1219ae4f70a53dedeb7d (507files),evaluator31/rubric27. Budget2418models/13Live/0env; source and all18 order/rules unchanged. User preapproved original18 without --run-ids; launch next, no third quick run. [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/plan.md).

## DEV-2026-10-21-CHECKPOINT-C-MERGE-FREEZE

Reviewed fix27b3884a fast-forwarded into prep; evaluator31/rubric27 bound with original18 order/budgets unchanged. Certification freeze a71b2e56d39ea24d939cf9b06cf21e9a5074e614da70c6ecae07034e1d5feeee (425 files), code b6d4abd3. Complete scripted outer rehearsal1/1,0network/0models; outer and certification controls green. Accepted source hashes unchanged; gates982/131,calendar69/69,selection5/5,calibration22/22 reused. Runtime ledger2418models/13Live/0env,remaining1582/87/10; reserves24 attempts/1200calls. User authorizes recertification then full18, no third quick run; old results and H003 S0 retained. [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/plan.md).

## DEV-2026-10-21-EVALUATOR32-HARD-COURSE-EVIDENCE

- Evaluator32/rubric28 independently consumes artifact-bound recorded merchant course/category HTML and reviewer-bound witness HARD quotes. Source roles, current citations, recording ordinal/runtime hash and meal limits are checked without production parser imports. Kaga manual witness remains outlet/request/certification/result-SHA bound; product name/review alone is not accepted. No product/Prompt/input/original-result changes; separate branch only.
- [Report](../../.eval-artifacts/evaluator-hard-course-evidence-20261021/report.md); frozen evidence and limitations remain separate from Live signoff.
## DEV-2026-10-21-CONDITION-DISPLAY-CLASS-TOKENS

- Class-token review followup PASS on isolated display branch; reviewed base5110f6aa, full tokens for course cards/title/description/review/name, no JS dependency. Fixture covers reorder/extra/no-JS/prefix exclusion; related39/39, default987/987, local Chromium131/131, type/arch/build PASS. Prompt/Schema/State and qualification unchanged. Zero models/sites/Live; both accepted fixes await checkpoint-C completion before integration.
- [Report](../../.eval-artifacts/condition-display-evidence-20261021/class-token-followup/report.md). Raw red/green and five-gate logs retained; existing quick3/calibration not rerun.

## DEV-2026-10-21-CONDITION-DISPLAY-EVIDENCE

- Parser-owned field quotations now reach condition-states3 and the Web with their real source words and meal scope. Names/customer reviews alone cannot display HARD MET; no condition text is fabricated as a quote. Two actual producers retain the metadata: Tabelog availability and native fact reads. Private source roles are omitted from model requests, keeping Prompt14/Schema4 unchanged. State19/TaskDefinition17 updates current callers directly; no compatibility, migration or reset. Eligibility/Guard/freshness unchanged. Codef097ab15; committed freeze740cdc8a (1352 hashes), offline source-field Router->Reducer replay3/3 complete: four merchant-supported HARD MET states retain real quotes, Kaga becomes NOT_CHECKED. Existing qualification and candidate sets unchanged; not a Live or model rerun.
- [Report](../../.eval-artifacts/condition-display-evidence-20261021/report.md); frozen evidence and limitations remain separate from Live signoff.

## DEV-2026-10-21-CRITERION-PRESENTATION-REPAIR

- Scope: user review66269d74; offline only; codex/fix-criterion-presentation-evidence, draft / not integrated. Stop for review after push; no third quick validation.
- Evaluator@31/rubric@27 replaces executable wording pairs with criterionRef/semantic IDs, generic normalization, and exact-artifact-SHA-scoped reviewed index bindings (13 artifacts/20 pairs; no labels/source-truth claims). All eight display records resolve. Original Gold/variants/holdout and evaluations unchanged. Historical wording YAML remains immutable review evidence; obsolete loader removed.
- Product: earlier factChecks omitted Kaga's later availability-read fact. Current fact view retains later check-referenced facts while later same-source reads, supersession, candidate identity and raw model-support checks still apply. Router citations are complete; Reducer rejects omissions; condition-states@2 adds local criterionRef. Prompt texts/versions unchanged, proven by exact request equality.
- Evidence: code1bb92bca, freeze commit ebe8162f, SHA`003c8b69db188ae4d5091d88e8729905fd3d845eb664d22d7423f01ea706aca8`; [four layers](../../.eval-artifacts/checkpoint-c-live-20261020/criterion-presentation-20261021/four-layer-report.md), [product event replay](../../.eval-artifacts/checkpoint-c-live-20261020/criterion-presentation-20261021/product-replay.json). No integration branch mutation.

## DEV-2026-10-21-CHECKPOINT-C-QUICK-GATE-STOP

- Evidence status: exposed development / Live read-only; not Clean Baseline. Network-restored quick3 completed before old witness deadline: c01 QUALIFIED_DELIVERY(3 outlets,167.421s,18 calls); c02 NOT_EVALUATED(2,177.643s,16; hot pot versus hot-pot wording unresolved); c05 DELIVERED_UNQUALIFIED(2,259.302s,31; Kaga required HARD check evidence omitted from presentation citations). Gate1/3<2/3; declaration ABSENT1/NE2,boundary ABSENT3, no zero-S0 certification. Stop before recertification/fresh18.12 outlets:10 selected/captured,7 displayed inventories exactly match independent GET,5 uncovered.65 calls/12Google/3Live added; totals2418 models/13Live/0formal env reruns.587 frozen files unchanged; historical H003 S0 and old failures retained. Post-batch report supplement handles serialized URI root slash; original helper/evaluator/results unchanged. [Report](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-retry-20261021/four-layer-report.md).

## DEV-2026-10-21-CHECKPOINT-C-NETWORK-RESTORED-RESUME

- User reports network repaired and explicitly resumes c01. Prior two source failures and consumed retry remain; one additional c01 entry is granted, then original c02/c05 and conditional recertification/C18. Code and inputs match a6fa26c;690 accepted hashes and32 ledger sources verified. Existing gates979/131,calendar69/69,selection5/5,calibration22/22 reused;0 new models/network at preparation. Cumulative2353 models/10 fullLive/0 formal env reruns. See continuous-retry-20261021/plan.md.

## DEV-2026-10-21-CHECKPOINT-C-QUICK-PREFLIGHT-STOP

- Evidence status: exposed development / source-only preflight; not Clean Baseline。快速验证在来源预检停止：c01两次TableCheck搜索GET无HTTP响应，唯一来源重试后18:41:01北京RETRY_EXHAUSTED；0正式Live/0模型，c02/c05及重新认证、新C18全部未到达。@30两次ENV_FAILURE/EXCLUDED，S0两项均未评（不写0 S0），旧H003 PRESENT保留。Google含预检4，间隔306.567秒；累计2353模型/10完整Live/0正式环境重跑，来源级重试1另列。运行前后576冻结SHA一致（9513895b…）；合并后五门禁979+131与20控制全绿，离线3例演练另报。用户要求的只读诊断确认固定CIDR漏当前DNS 52.68.109.188：TUN路径TLS失败，另一个当前DNS54.178.173.154走en0同URL返回200，应用浏览器显示653条；失败IP的en0作用域缺路由，同IP直连控制未派发，不夸大因果。生产/网络配置未改，结果、8个计划见证未到达表、四层报告和账本推送后停。
- [报告](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-resume-20261021/four-layer-report.md)、[结果](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-resume-20261021/result.json)。

## DEV-2026-10-21-CHECKPOINT-C-REVIEWED-RESUME

- Evidence status: current executable / exposed development。用户批准a6fa26c及连续步骤，修复合入集成和准备分支，五份文档冲突保留双方历史。生产/skills/依赖与复核版一致，原690冻结SHA不变；合并后五门禁979+131通过，外层20控制绿。账本30来源SHA一致，累计2353模型/10Live/0环境重跑，余额1647/90/10。新增逐家离线诊断脚本只读保存DOM/JSON，旧25店17确认/0捕获与复核一致；不回填历史库存。提交冻结后快速c01/c02/c05，0S0且≥2合格才继续认证和新18次，原S0与失败记录保留。

## DEV-2026-10-21-TABELOG-QUERY-BINDING

- Evidence status: draft / not integrated；用户指定3d14788复核后的离线来源改版修复，不重写快速验证0/3或H003历史S0，不恢复Live。
- Tabelog日期/人数/时段控件撤去已消失的js-钩子；通用Browser与来源确认共用明确ARIA/精确状态class函数。日期读取data-year/month/day，人数组按data-value/文字确认；隐藏人数字段存在则必须一致，缺失不拒绝。
- 库存主要绑定最新find_vacancy的日期、人数和时段链接门店，页面选择也必须一致。冲突/缺响应保持UNKNOWN，不以时间模板兜底。补监听今天实际出现的无尾斜杠路径；Guard权限、TableCheck reserve禁令、URL参数捷径、外层、计划与评测器@30/rubric@26不改。
- 保存19个失败候选查位阶段末次原始快照及SHA，独立HTMLParser/JSON核查17个页面选择可确认。历史录制响应全空，库存仍19个UNKNOWN。18处私有class逐项审计，11处仍存在仅报告，7处消失位于本轮关键路径并修复；未覆盖TableCheck旧菜单结构不宣称消失。
- Browser Prompt19/Context2与wire11、Restaurant Context15/Prompt27未改文本或schema；本次改变来源提取和控件提示。69点必须对新输入回放；完全相同的5个选店请求复用原始真实模型输出重新评分，避免新增等价调用。验证见[本轮Test](TEST-LOG.md#test-2026-10-21-tabelog-query-binding)。
- 冻结后完成：真实模型69/69、选店缓存重评5/5、校准22/22、五门禁979/131全绿；690项运行后无变，新增69模型、累计2353/4000、0网站/Live。修复仅在独立分支，提交报告/账本并推送后停止等复核。

## DEV-2026-10-21-CHECKPOINT-C-CALENDAR-REPLAY

- Evidence status: exposed development / decision replay；不是Clean Baseline，未集成任何变体。用户补充第0步、0网站，原200调用上限提高至300；153个browser决策宽筛104点，按原输出明确选Next取69点（19/17/16/1/16），其余35点保留清单，重复不去重。独立HTMLParser核对原DOM和CONTROLS发现原位置规则错指59个时间／10个人数Next，真实日历导航已有原targetRef但label为空；用户批准V3补齐语义并按真实控件评分，原复核文件及五次Live结果不改。
- 冻结ee9ac1a／967d63e2…434文件后首3 API中V0/V1完成，V2因thinking不支持强制tool_choice返回400，按冻结停批。用户明确批准仅V2改auto，补充冻结15e7716／c784a31e…459文件，保留已完成项和原400，新274请求后共277／300；V2兼容属于额外变量，不宣称仅thinking的因果对照。生产Gateway与严格工具schema复用，全部实验代码在指定artifact目录，生产／web-skills与a3f6b84字节不变。
- 276试次全部尝试：V0/V1/V2均0/69，V3为68/69；平均1.7935／1.8342／7.8864／1.8860秒。V3唯一未中点选择人数2，按冻结翻月标准计未中，不据此认定该动作本身不合理；本步没有执行点击，不能证明实际月份变化或完整交付。V2有3个200无工具调用，原400无usage；合计已报告输入3964257／输出119291（推理84566包含在输出内），缓存命中98.7/19.6/16.0/26.9%，不编造货币成本或同缓存比较。
- 0来源／浏览器动作／Google／Live／外写；原434与补充459冻结独立核对不变。阶段累计1995/4000模型、7/100完整Live、0/10正式环境重跑，原H003 S0和Live阻断保留。7原控制＋3兼容控制通过，完整Gateway脚本化传输→评分→报告0网络／模型；五门禁沿用未改生产978默认／122 Chromium及type／arch／build。仅提交、推准备分支并停止待复核者／用户决定方案，不继续后续1–5步。[四层报告](../../.eval-artifacts/checkpoint-c-live-20261020/step0-calendar-replay-20261021/comparison/four-layer-report.md)。

## DEV-2026-10-21-CHECKPOINT-C-FIVE-RUN-USER-STOP

- Evidence status: exposed development / USER_STOPPED_PENDING_REVIEW；不是Clean Baseline。用户在已知H003 S0后要求剩余测试继续，同时保留“不改代码”和“不打开预约表单”。原样启动被自动审批拒绝，0新增运行；阻断记录9fa7836保留。随后采用更严格的现有运行时策略数据，启动前删除TableCheck预约文档GET的唯一例外，外层／子进程继承，不修改任何源码、Runner、Guard、外层或评测器代码文件；配置770d96f、启动元数据dadca01先提交，冻结08e18fc5…1447文件。
- 仅新c-05神乐坂正式完成：299.901秒／47模型／5 Google含预检、0交付、CAPABILITY_MISS。10:49:40.822北京用户要求停止，SIGTERM本批专用进程组后确认消失，停止位于间隔内，无c-06，不将c-05改标编排中断。C合计5正式、0合格、13 NOT_REACHED，另2次旧来源预检排除项；3 CAPABILITY_MISS和2 HONEST_NO_RESULT均未完成用户目标。
- 五份原始result、决策JSONL、录制、@30评价和运行后原始复查集中按路径／SHA索引，旧产物不覆盖。五次均47模型，235次技术状态成功，其中153次浏览器决策；46条查位记录43 UNKNOWN，含18请求条件未确认、5超时。共同47来自剩余≤4次时开启收尾窗口，并不证明调用上限本身是bug；后续应离线调查浏览器操作／请求绑定／响应解析，未宣称唯一根因或修复。
- 新c-05保存83份HTML未检出预约表单，23控件操作可绑定，未记录客户字段、时钟标签点击或预约创建请求。运行时策略收紧产生敏感文档拒绝，与前四次冻结分别报告；不能作为永久产品修复或改动因果签收。原H003独立S0仍PRESENT、退出3不满足。1447冻结文件停止后先核对一致，再恢复完整18次计划并更新治理文档；Gold／变体／见证／留出集和生产a3f6b84不变。
- 第二阶段累计7/100正式Live、1718/4000模型（含既往回放与结转）、正式环境重跑0/10；C235模型／22 Google。五门禁代码未变复用978/978、Chromium122/122、type／arch／build PASS；不新增模型、网站诊断或修复，只推准备分支结果后停止。[四层报告](../../.eval-artifacts/checkpoint-c-live-20261020/guarded-continuation-20261021/report.md)、[五份原始结果](../../.eval-artifacts/checkpoint-c-live-20261020/guarded-continuation-20261021/results-index.md)。

## DEV-2026-10-21-CHECKPOINT-C-RETRY-S0-STOP

- Evidence status: exposed development / S0_STOPPED_PENDING_INDEPENDENT_REVIEW；不是Clean Baseline。用户在解释原重试耗尽后明确要求“重试”，只加1次H005显式尝试，不重跑H001/H002、不清历史计数；最小可选resume入口在8d8b378提交，元数据8105921提交后启动，恢复冻结10202ba3…942文件。
- 新H005正式完成、CAPABILITY_MISS，273.976秒／47模型／0店；H003完成424.090秒／47模型／0店，原业务HONEST_NO_RESULT。H003独立原HTML／文档URL确认5张预约表单，自动请求评价未叠加本次用户禁止打开表单限制；原@30越界NOT_EVALUATED保留，补充S0_BOUNDARY PRESENT，09:51:48北京SIGTERM本批专用进程组，c-05未启动。
- 没有修改生产、Guard、读取许可、Runner、Gold、批准变体、见证或@30/rubric@26来修复；只保留缺陷反例和独立证据，不放宽禁令。未记录客户字段填写、时段点击或预约创建请求；未提交不撤销页面打开越界。
- 新增2正式Live／94模型／6 Google，C累计4正式／188模型／17 Google，14正式NOT_REACHED；历史2个ENV预检失败、自动预检重试1与用户显式额外尝试1单列。阶段累计正式6/100、模型1671/4000、正式环境重跑0/10，账本明确S0阻断，余额不代表运行许可。
- 停止后先核对942冻结文件均未变，再同步治理文档和导航；旧报告／原自动评价不覆盖，有效四层汇总另附独立边界review。只推准备分支后停止等复核，不继续网站诊断、模型、见证续期或产品修复。[四层报告](../../.eval-artifacts/checkpoint-c-live-20261020/resume-20261021/report.md)。

## DEV-2026-10-21-CHECKPOINT-C-LIVE-ENV-STOP

- Evidence status: exposed development / pending independent review；不是Clean Baseline。用户与复核者批准冻结7caa315a…，fetch后快进0794040；授权、启动命令及只处理硬截止的进程外控制在9cace9d提交后启动，不改冻结外层／Runner／输入／评价器。
- 正式Live2/18完成：H001 CAPABILITY_MISS、H002 HONEST_NO_RESULT，均0家／47模型；H005两次TableCheck `/en/japan/search`文档GET无HTTP状态，ENV_FAILURE，等待303.812秒后唯一重试仍失败，00:26:04北京停批。正式NOT_REACHED16，另有15个位置完全未尝试；原脚本liveCompleted=3含预检排除项，补充报告按正式运行2校正口径，不改原始产物。
- 新增94模型、11 Google含预检；外层重试1（预检）、正式环境重跑0，H005单例额度已耗尽。阶段累计正式4/100、模型563＋更早保守结转1014＝1577/4000。
- 停批后先核对523冻结文件全部未变，再仅同步结果与状态／历史导航；不重冻、不自动恢复。源代码与a3f6b84无差异，批准变体／Gold／Holdout与集成分支未改。
- 四层报告逐计划、逐条件和P2-1/P2-2/P2-3分开保存；无交付使价格／披露评价无分母，S0未知与历史安全缺证单列。停止后不扩展网络诊断或产品修复，只推准备分支等待复核。[报告](../../.eval-artifacts/checkpoint-c-live-20261020/execution-20261020/report.md)。


## DEV-2026-10-08-PLAYBOOK-PHASE3-RENEWAL

- Evidence status: exposed development evidence，基线f640152；生产Source Pack／Browser组合修复与真实阶段验收分开，原始记录不覆盖，不是Clean Baseline。
- 来源自有地区／当前查询绑定、公共查询grammar与类别入口修正；Google支持结构化行政区名称，保留原半径；Core无门店／日期分支。
- 共享操作／模型预算保留失败计数，矩阵剩余额度传入实际Availability构造器；真实空INPUT值、form owner默认GET及组合框代理值回读一起核验。
- 录制保留公开脚本／资源字节、JSON-LD坐标与逐跳跳转；Replay校验Pack／请求／位置／HAR／trace及目标语义指纹，同生产decoder，缺资源拒绝、不联网补齐；旧执行兼容路径退役。
- stage@5复用生产Discovery／Availability／官网Facts入口、冻结样本与原子结果；Google-only Facts误接线及混合Replay模式已返修，原失败保留。
- 既有Teppen与同五家已知可行库存复现日期已选／人数加载；补所属Adapter有条件等待及实际Chromium反例，严格同店／日期／人数／slot接纳不变。真实复验与未达标项见[本轮Test](TEST-LOG.md#test-2026-10-08-playbook-phase3-renewal)。
- 未扩展Phase4–6、总纲或平台；诊断样本4调用是预先声明的新诊断预算，整单500s／50不变；[独立验收](../../.eval-artifacts/h001-h005-playbook-20261008/root.renewal.review.json)。

## DEV-2026-10-07-PLAYBOOK-PHASE3

- Evidence status: exposed development evidence. 复用生产NativeRestaurantSearch新增冻结Discovery诊断入口；Runtime、位置输入、轮次和预算独立落盘，不接入新评分平台。
- 真源第二轮发现共享budget被忽略和公开301误拦；补强现有Executor／Guard回归。当前执行取共享与局部上限较小值，跳转目的地逐跳按现有文档规则重新准入，无站点分支或自动Runtime回退。
- Google失败诊断保留有限公开地点字段；不修改位置匹配标准。单页探针实际传递`--no-proxy`，仅改有效环境副本。
- root返修模式误入Live、超预算证据丢失、地点label漂移及“任意列表即成功”；退役未使用的直接Pack测试路径，仅保留生产发现组合。
- 三轮矩阵完整分母均FAIL；原始记录不覆盖。末轮名义7列表中，全国漂移误报被拒；6份列表有原半径候选，未证明库存或整单交付。真实日历HAR回放仍NO_COVERAGE。
- 按本轮三次矩阵上限停止，未跑其余矩阵或Phase4–6；[独立验收](../../.eval-artifacts/h001-h005-playbook-20261007/root.phase3.acceptance.json)与[验证记录](TEST-LOG.md#test-2026-10-07-playbook-phase3)分别记录代码修复与阶段FAIL。

## DEV-2026-10-07-PLAYBOOK-PHASE2

- [ADR-0037](../decisions/0037-request-driven-discovery-source-packs.md)实现请求驱动Planner／三Pack；旧二选一开关、固定nativeStage与旧观察type alias退役，State@12／Context@8同步全部调用方。
- Pack持有发现URL／解析／入口、Skill与查位factory／affinity／URL／ground；Google保留命名位置和发现，已解析位置复用，无关键词走Nearby circle。当前源标签／诊断保留，不宣称第三站接入已验证。
- root两轮返修闭合真实五案映射、Tokyo同日、重复地点解析、URL字段泄漏、Shibuya named入口、遗漏Skill与H002半径；原错误artifact保留。
- 原始@6／Semantic／Gold／HARD／身份／半径与500s／50调用不变；旧开发State按显式重置协议处理，本轮未执行数据库删除。
- [离线签收](../../.eval-artifacts/h001-h005-playbook-20261007/root.phase2.acceptance.json)通过；真实源／库存和完整H001未签收，下一门槛Phase3；验证见[Test](TEST-LOG.md#test-2026-10-07-playbook-phase2)。

## DEV-2026-10-07-PLAYBOOK-PHASE1

- Evidence status: exposed development evidence. Shared Guard implements ADR-0036 for source and official-website sessions; installed sessions use generic UI actions and page Escape. Action schema7/prompt12 normalizes inert fields while preserving goal and authority checks; source UI permission functions were removed.
- Optional Record keeps per-observation sanitized DOM, masked layout screenshots, complete targets, request shapes and a sanitized wire projection. Local HAR Replay retains status, safe scripts/CSS and form semantics through the same Guard; missing entries abort. Policy drafts are never installed automatically.
- Root returned prepared-navigation leaks, unguarded Escape, hidden-token persistence and Replay status/visibility defects. The calendar slice's third repair passed local mutation controls and the true-source Generic probe; all original failures remain intact.
- Phase1 accepted with default697/697, Chromium73/73 and independent receiver/normal-task evidence. The 9,537ms source probe proves initial-query admission only; real failure-corpus coverage and full restaurant delivery remain later gates. [Acceptance](../../.eval-artifacts/h001-h005-playbook-20261007/root.phase1.acceptance.json).

## DEV-2026-10-07-PLAYBOOK-PHASE0

- Evidence status: exposed development evidence. Dependency-specific preflight now precedes gateway/task/browser startup in five actual runners; CLI `--no-proxy` and provider factories share a copied effective environment. No model generation is used for health checks.
- Root review returned incorrect transport classification, TCP/TLS claims, response cleanup and HTTP rejection handling; existing phase tests now retain red/green evidence. Source/public-entry reachability is distinct from browser and restaurant acceptance.
- STATUS history moved to [monthly baseline snapshot](monthly/2026-10-status-baseline.md); reverse link normalization restores the e90dc94 original exactly. Current STATUS is 15 lines; original logs remain intact.
- User selected permissive same-origin GET after the alternatives were explained; [ADR-0036](../decisions/0036-generic-public-read-network-policy.md) accepts the policy with residual risk, implementation pending. Phase1 follows only after Phase0 root acceptance.

## DEV-2026-10-07-BROWSER-READ-RELIABILITY

- Evidence status: exposed development evidence, not Clean Baseline. Terra implemented; root independently reviewed and returned contract, Runner-capability, observation-value, source-grammar, inventory-loading and fixture-isolation defects before acceptance. [Concise independent review](BROWSER-READ-RELIABILITY-REVIEW-2026-10-07.md).
- Shared Browser: canonical page WAIT, strict redacted wire diagnostics, bounded interactive calls, one obstruction-triggered Escape/blur with fresh observation, and per-element batched attributes. Presentation classes no longer invalidate a target, but actual owner/value/selection changes do. Prompt@11 and action-schema@6 replace the old contract; no compatibility path.
- Source-owned request rules now precede wider ordinary query-button operation in isolated local/Cloudflare contexts. Unknown endpoints/fields, business writes, sockets, Service Workers and redirects fail closed; public query POST requires its reviewed flat field schema. TableCheck deterministic exact-query parameters and existing budget fields are preserved; no restaurant-name exceptions. Runner and Web wiring preserve the installed capability. Cloudflare default CDP method receiver is fixed; remote guarded context remains Live-unverified.
- Live exposed new public cuisines[] omission and unsupported Offer from a loading widget's outside reservation links; existing Adapter and production-composition tests now cover loading, duplicate-widget, wrong-region and settled positive controls. Subsequent Live exposed omitted Tabelog initial calendar; historical actual control records plus current official client fixed all four public calendar query shapes. Network reads retain the caller's read window rather than inheriting the 5s interactive cap.
- Final source repair is accepted with local gates and an independent actual Chromium receiver, not post-fix current inventory evidence. All three original Live results remain FAIL and intact. No Semantic/Gold/HARD/identity/radius/global-budget changes, new test platform, provider fallback, booking write, or fourth Live. See Test Log for the exact mode-separated evidence.

## DEV-2026-10-07-MONTHLY-HISTORY-NAVIGATION

Added monthly summaries and complete entry indexes for August, September and October through October7. Original log entries, ordering, duplicate records and evidence links remain intact. INDEX now directs historical investigation through the relevant month's summary and entry index; summary maintenance records direction/evidence changes rather than duplicating every run. Product code, browser permissions, evaluation thresholds and H001 acceptance did not change.

## DEV-2026-10-07-BOUNDED-NATIVE-DISCOVERY

Current executable discovery slice, authorized separately from full H001 delivery. The real Tabelog Shibuya `sw=omakase` page exposed two outlets while the source's Sushi category exposed 107; the previous fixed keyword and region-only navigation did not provide adequate candidate discovery. The existing native search now permits one model-selected, observed category adjustment for a sparse list, keeps the same source area, removes the keyword through an observed source link, and retains observed next-result URLs in its existing continuation. Pending outlet details remain first; visited pages, source time, detail and page ceilings remain cumulative. Category membership never creates HARD or availability evidence. No restaurant-name branch, cuisine dictionary, new provider or search framework was added. This is within ADR-0033's bounded same-source continuation.

The shared Browser Executor now supports `CHOOSE_OPTION:RETRIEVAL` for an owner-bound option matching the current query exactly, followed by query-value and closed-listbox readback. The registry reads a combobox's unique nested text/search input and excludes background controls actually covered by its expanded listbox. This closes the observed TableCheck search-suggestion interaction without forced clicks or arbitrary query submission. Browser action schema is 6 and prompt revision is 9 after the follow-up below. Existing radio/category and other dirty-worktree changes were preserved.

Independent review caught two pre-Live issues: category pagination was still binding the initial HARD keyword, and a diagnostic snapshot wrapper could recurse through the trace Proxy. The category→pagination regression failed before the query-context correction and passed afterwards; diagnostic capture now wraps the original session before tracing, with a zero-network smoke. Execution and verification evidence are recorded separately in TEST-LOG; this slice does not claim facts, inventory, or full H001 completion.

The single discovery-only Live then proved the TableCheck suggestion path but failed Tabelog's category adjustment. This was an uncovered action-contract case: the source's `a href="#"` expands UI, while the existing fixture only asked OPEN_LINK and the real model asked CLICK. The same existing Chromium fixture now exercises CLICK, with a saved pre-fix failure. Shared action semantics distinguish observed same-document fragments from navigation links, and the source skill explains the visible All category entrance without selecting a cuisine or restaurant in code. A further narrow review found that query-completed lists did not refresh their next-page cursor; the existing pagination composition now reveals the next link only after a query action, fails before the one-line cursor refresh and passes after it. These follow-ups have no new Live result; the earlier failure remains immutable.

## DEV-2026-10-01-H001-NATIVE-CURRENT-BATCH-DELIVERY

- Added a reducer-persisted `nativeCurrentBatch` continuation record containing the source and candidate IDs admitted by the most recently completed bounded native read chunk. It is deliberately separate from `nativeSourceProgress.pendingSourceEntries` and source terminal state.
- Replaced the open-ended native short-delivery gate's implicit `TABELOG_DONE` / `TABLECHECK_DONE` dependency with a current-batch investigation gate. It requires every admitted current-batch candidate to have completed applicable fact and availability investigation and at least one independently eligible, undelivered candidate. It does not set source `DONE`, discard a retained entrance, loosen explicit-count behavior, or accept unsupported inventory.
- Projected this ready state into the normal Agent context as a no-further-search delivery state, leaving the Agent to select `PRESENT_RESULTS` through the existing validator and Runtime path.
- Added formal source fixtures for: a nonempty pre-refinement Tabelog list with an observed source area link; an open Tabelog source with a sixth retained entry; and an open TableCheck source with a sixth retained entry. These are controlled source pages, not Live evidence.
- Reviewed all retained LAVAROCK artifacts before changing inventory extraction. They prove request control readback but not a current request-bound result. Kept the existing fail-closed parser and recorded `PENDING_SOURCE_EVIDENCE` rather than adding a speculative parser.
- Prepared the fixed-source real-model Runner for the new controlled A/B scenarios without running it: its bounded scenario allowlist now includes the nonempty-list recovery and both current-batch delivery paths; every result persists a scenario expectation, actual terminal/source behavior, evaluator qualified result, pass/fail comparison, and the sanitized browser diagnostics array. This changes diagnostic reporting only and does not authorize a model call.

## 2026-10-01 — H001 discovery/execution closure work packages A/B/C

Implemented only the first three work packages of the H001 closure playbook. Native discovery keeps five details as a work chunk while persisting inspected and pending native entrances through a ten-detail, 90-second per-source ceiling and an explicit six-page Tabelog/two-page TableCheck listing ceiling; each chunk may consume at most three and one listing pages respectively. A pending Tabelog entrance continues Tabelog before the fixed TableCheck transition. The continuation and funnel make this scheduling boundary explicit and do not claim site-wide exhaustion. Native list, region and detail reads now run through the shared BrowserTaskExecutor `DISCOVERY` lifecycle.

Browser `COMPLETE` is now a completion request: when the source predicate is still unmet, the executor returns the concrete missing condition to the same model/session/request/budget loop. A repeated identical request terminates as no progress. TableCheck final parsing now requires an executor-completed read, and its sanitized `Venue Availability` query regions are retained for audit. The work includes composition and browser regression coverage for later same-source candidate investigation, early completion followed by an observed safe action, and TableCheck result-region capture. No model, source, booking write, commit or push was run; per the playbook instruction this work stops after A/B/C for user review.

## 2026-09-30 — Two bounded real-source browser-control diagnostics

Ran the already implemented production TableCheck BrowserTaskExecutor/Adapter path against two public, same-origin entries under a combined two-run cap. No production source code changed. The 0711 run proved only a model-driven calendar-month transition before the chosen October 3 target was observed disabled. The LAVAROCK run used the source-owned guide-to-reservation path, preserved HIGH same-source continuity, read the existing date/adult fields, and executed one real time-select operation with post-action readback. Neither run captured a request-bound provider inventory result; neither was interpreted as a no-availability finding or a full browser/Case acceptance. Exact artifacts and accounting are in [TEST-LOG](TEST-LOG.md#test-2026-09-30-two-real-source-browser-control-diagnostics).

## 2026-09-30 — H001 tomorrow variant runner boundary and one native real-source read

Added the smallest Runner input boundary needed for a user-authorized diagnostic date variant:
`--case-source` accepts only an artifact-local YAML source which explicitly declares a
variant dataset and the current frozen dataset parent hash. The standard source and its
frozen validation path were retained. The separate H001 tomorrow source keeps the same
semantics and records the parent rather than editing the original case.

The single authorized real-source run used it to materialize 2026-10-01 19:00/2 in Tokyo.
It retained the native Tabelog-first/TableCheck-second pipeline and produced a normal
scoped `NO_VERIFIED_RESULT`, not a presentation. See
[the execution record](H001-TOMORROW-VARIANT-NATIVE-LIVE-2026-09-30.md) for the exact
funnel and independent evaluation.

## 2026-09-30 — H001 dynamic fixed-source Stage 3 corrected model recheck

After the evidence-refresh correction, the three original failure artifacts
were re-evaluated with `restaurant-hybrid-read-diagnostic-evaluator@22` and
remained qualified `NO`; they were not overwritten. Three new authorized,
sequential DeepSeek runs then used the same wholly intercepted dynamic Tabelog
detail composition. All three performed observed date and party actions,
received a request-bound same-outlet 19:00 response, reached `PRESENT_RESULTS`,
and evaluated qualified `YES`. They used 29 model calls and 39,151ms in total.
The rubric remains `restaurant-hybrid-read-diagnostic-rubric@21`; only the
Evaluator version changed because the previous required-reference calculation
was wrong for an actually superseded same-source fact.

This closes the controlled dynamic-model gate, not H001 Live. The pages and
availability response remained fixed and intercepted, so no current provider
inventory, real source latency, booking write, commit or push was exercised.

## 2026-09-30 — Native dynamic Tabelog detail fixture

Added one wholly intercepted local Chromium native-detail fixture beside the existing static fixed-source pages. Its initial calendar and guest controls deliberately disagree with H001; a real observed date click and guest click are required before the page fetches a same-outlet, date/party/time-bound vacancy response. The existing Tabelog Adapter accepts the resulting 19:00 offer only after that response and the page-owned selection state agree. This is a controlled Adapter path using a scripted browser-decision port, not a real model or a complete H001 Runtime/Agent run; it makes the remaining dynamic-model closure explicit rather than pre-answering controls in the static source fixture.

The existing native fixed-source real-model Runner now has an explicit `DYNAMIC_TABELOG_DELIVERS` mode. It preserves the same Interpreter/Compiler/Router/Runtime/Agent/facts/Browser/acceptance/presentation composition and the same 50-call/30-step/300-second ceiling, while recording `LOCAL_CHROMIUM_DYNAMIC_FIXED_PAGE` instead of static pages. The runner remains gated by `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1` and has not been invoked.

The dynamic Runner wraps each local browser session with the existing sanitized evidence trace and sends BrowserTaskExecutor diagnostics into its artifact. It therefore keeps ordered navigation and action records, observed controls, booking-region state and narrowed passive vacancy responses on both success and failure. A browser-fixture formal composition now drives the entire H001 chain from semantic input to `PRESENT_RESULTS` through that dynamic page with a scripted model port; it does not substitute for the registered real-model run.

The intercepted source permits the normal Tabelog list URL by pathname plus frozen `sw=omakase`, without relying on query ordering, and supplies a public TableCheck `0 venues found` page if the formal Router legally reaches its second source. An unconfigured origin or path is still aborted, so a test environment omission cannot be misclassified as a provider result.

The same dynamic page now has an explicit unavailable branch. It keeps the final request-bound date and party in its passive response while exposing an unavailable slot, so the formal composition proves a real Tabelog control sequence can continue to TableCheck's own native empty batch and end `NO_VERIFIED_RESULT`. The fixture does not turn a missing selection array into stock evidence; the provider page's explicit unavailable control is required for that branch.

## 2026-09-30 — H001 native/browser convergence Stage 1/2 offline closure

Removed the parser-owned five-result truncation from both native sources. The shared bounded detail cap now records inspected outlets and every observed detail entrance deferred by that cap, keeping deferral separate from rejection and source exhaustion. The shared browser wait projection now includes visible control values, selection, disabled and checked state while ignoring hidden form mutations; the executor still requires a fresh observation and source Adapter request binding after any wake-up.

The local Chromium TableCheck Adapter fixture now uses existing scrollable options instead of injecting a result-dependent option. It completes both legal sequences—party then date, and date then party—by selecting exact ten rather than `10+`, and asserts page-owned selected date, party and request URL before accepting the source result. These fixed/local paths and static production composition remain separate evidence: neither proves a real model can operate a dynamic provider page. No model, Live, booking write, commit or push occurred. [Plan and remaining gate](BROWSER-CONVERGENCE-H001-PLAN-2026-09-30.md).

## 2026-09-30 — H001 Teppen requested-date restriction after authorized page read

The new one-page read preserved the currently displayed September calendar: Sep 30 is a plain closed day cell without a selected/date-target marker, Guests 2 is selected but disabled, and no passive vacancy response was captured. The existing generic restricted reason lost this source-specific target-date state. A focused Tabelog query-controls parser now binds a requested day to the same booking calendar table's month/year and excludes markup-hidden future tables; the Adapter maps closed/full/telephone-only to distinct UNKNOWN reasons only after its existing restricted-state gate. The request-bound availability and identity rules remain unchanged. Saved-DOM real Chromium red/green and [full limits](H001-TEPPEN-TARGET-DATE-2026-09-30.md) are separate from the one-page Live observation; no post-change source rerun or booking write occurred.

## 2026-09-30 — H001 Teppen diagnostic capture path repair

The first saved-DOM diagnosis correctly retained UNKNOWN but left the recurring source-observation defect unresolved: the case-slice Runner discarded current query markup. The Runner now records a sanitized booking subtree and all observed controls with profile fields redacted; passive Tabelog response data is narrowed to request-binding fields. The existing one-page read probe reuses that recorder with initial and post-wait snapshots, a 30-second default-network ceiling and no model or booking action. No identity, requested date, stock-acceptance rule or Gold changed. The old artifact remains immutable and still lacks those fields. [Implementation, offline test and prepared one-page command](H001-TEPPEN-QUERY-CAPTURE-2026-09-30.md).

## 2026-09-30 — H001 Teppen saved-query-state diagnosis

Checked the Sep 30 sanitized browser trace against the separately saved complete Sep 29 Teppen DOM and current Tabelog query-control code. The proposed selected-but-nonselectable date omission is a possible generic hint gap, but the saved Teppen DOM has no selected date node at all; its September 29/30 cells have telephone/closed states without dated target attributes. The later trace lacks a current-date marker and captured vacancy response. Existing restricted-state and normal-query Chromium coverage already exercise the applicable behavior, so this diagnosis made no speculative production or test change. The precise evidence limit and future same-snapshot data needed are in [the H001 diagnosis](H001-TEPPEN-QUERY-STATE-OFFLINE-2026-09-30.md).

## 2026-09-30 — One H003 real-source check after the local repair

At the user's request, invoked the bounded H003 TableCheck browser-only Runner once against the same historical source entrance and request. Navigation timed out before any snapshot or model action, so the new action-observation code was not exercised on the real page. This is a source-access stop, with no identity or inventory judgment and no automatic retry. No code, budget, Google route, source choice or booking behavior changed. [Execution artifact and interpretation](BROWSER-CASE-SLICE-LIVE-2026-09-30.md#follow-up-after-the-2026-09-30-offline-h003-repair).

## 2026-09-30 — Shared browser action observation after H003 real-source budget stop

The 2026-09-30 H003 trace showed both date and party at entry, but opening the scrollable guest list exposed only 1–8 as actionable options. Five legitimate browser actions, including revisiting the guest list after selecting the date, exhausted the unchanged 24-operation limit because the Executor unconditionally waited after every click. It now observes the post-click snapshot/control state first and waits only if no change or no selected-option confirmation is visible. The model continues to choose actions; stale references, disabled controls, booking writes and source result grounding remain guarded. The same trace exposed `10+ guests` as an unsafe exact-ten hint; exact party matching now rejects that label. Browser-read Skill guidance now directs a partial combobox list toward its observed scrollable region and a fresh observation, without imposing a fixed field order. H001's unbound no-seat prose remains UNKNOWN with no grounding change. The full failure-driven local Chromium result, independent raw DOM check and no-new-Live boundary are in [the repair record](BROWSER-CASE-SLICE-REPAIR-2026-09-30.md).

## 2026-09-30 — Real-source browser read after offline repair

Ran one bounded H003 TableCheck and one H001 Tabelog browser-only Live read at their historical native outlet entrances. H003 retained HIGH same-source identity but the model's early party-open action consumed enough of the fixed 24 operations that the final ten-person click could not be followed by a request-value readback; it returned UNKNOWN with no Offer. H001's corrected diagnostic Runner ID passed the unchanged native continuity check, then current visible query controls were restricted; it also returned UNKNOWN with no Offer. No implementation, prompt, Gold, budget, source, Google route or reservation behavior changed in this follow-up. Both source outcomes and the missing end-to-end timing/qualification boundary are recorded in [the Live report](BROWSER-CASE-SLICE-LIVE-2026-09-30.md).

## 2026-09-29 — Four bounded Live browser slices and offline operation repair

Executed H005, H002, H003 and the explicitly authorized Sep 30 H001 diagnostic variant once each under the browser-only plan: 77,048ms, 9 DeepSeek calls and 44 browser operations total. Each stopped without a request-bound Offer. H003's four model actions reached the 24-operation ceiling after selecting ten guests; H002 lost its date target during asynchronous page replacement; H001's new diagnostic Runner used a bare numeric Tabelog ID inconsistent with the historical production path ID. See [per-run evidence](BROWSER-CASE-SLICE-LIVE-2026-09-29.md); these are Live read-only probes, not full Case or independent Eval results.

Follow-up stayed offline. The shared Executor now exposes visible disabled controls as read-only model observations while rejecting all actions on them, reuses a fresh confirmed post-action observation when the page changed, and emits an explicit operation-budget diagnostic. The H001 Runner uses the historical path ID, validates it against the detail URL before external work and records the existing Adapter's identity diagnostic; production identity acceptance was not changed. A real Chromium TableCheck Adapter four-action fixture now confirms the final query and source result within the unchanged 24-operation budget. In an isolated copy with old duplicate observation, that same test fails at the operation ceiling. No new Live, model, Google, booking write, commit or push followed the four runs.

## 2026-09-29 — Shared Browser Read source-control repair

The TableCheck search wrapper is projected as a non-fillable combobox while its real nested input retains a source-observed placeholder label and native fill path. A public result link whose center is covered may navigate once to its exact current observed href after origin and sensitive-path checks, followed by a fresh observation; normal same-page/popup clicks remain intact. Tabelog's calendar wait now settles on either visible actionable date/guest controls or a visible source restriction, then takes a new snapshot and classifies the current controls. This closes the loading-to-restriction gap without treating hidden future dates, disabled guests or source prose as request-bound inventory. Skills and Capability Matrix were updated. The Browser wire, Domain state, H001 semantic request, source identity, radius and fact rules were unchanged. This increment used saved public DOM and offline Chromium only; no Live or model invocation. [Verification](TEST-LOG.md#test-2026-09-29-shared-browser-controls-offline).

Independent review then exposed two shared edge failures. The covered-link hit test was performed before Playwright scrolled a below-viewport result into view, so the eventual click was still intercepted; the helper now scrolls once before checking the exact observed href and pointer hit. A general `name` label fallback also masked visible button text; placeholder/name now fill only missing native input labels, retaining `20:00` and the Reserve safety label. No action schema or source permission was expanded. Offline counterexamples and the ordinary popup path pass. The reviewer's original red output was overwritten by a later rerun of the same temporary script; the red observation remains in the main-chat review record and tool output, while the separate independent green result is `/private/tmp/praxis-browser-shared-review/probe-results-independent-green.json`.

The next authorized scope is four Case browser execution slices, not complete Live. A plan-only CLI now reads the current exposed YAML and materializer, then binds one historical native source entrance to the existing Tabelog or TableCheck availability Adapter without invoking semantic, Google, facts or Runtime. It has an explicitly gated `--execute` mode for later main-chat review. H002/H005 use the historically observed H003 TableCheck outlet as a widget probe only, and H001's present “tonight 19:00” is already elapsed. [Review plan](BROWSER-CASE-SLICE-PLAN-2026-09-29.md). No new external read or model call was made while preparing it.

## 2026-09-29 — Teppen one-page control observation after H001

After separate user authorization, one default-network local Chromium read of the actual Teppen outlet page saved the 111 controls returned by production observation, limited DOM opening-tag markers and a viewport screenshot. The observer emitted no Date/Guests target. Full-HTML string counts found zero date-target markers and one people-button class occurrence, but the saved markers lack the latter element's tag/visibility/parent structure; the screenshot omits the lower calendar. A narrow button-opener filter found no match and clicked nothing; this does not rule out other page entrances. This new observation does not reconstruct the prior H001 Live page or prove inventory. No source-control fix, model, Google or booking call followed. [Probe result](H001-NATIVE-GOOGLE10808-LIVE-2026-09-29.md#separately-authorized-one-page-control-probe).

## 2026-09-29 — H001 post-Live offline control diagnosis

Read the immutable 10808 Live artifact against the Browser Executor and Tabelog adapter. Saved diagnostic targets are capped at 40 and visible text at 1,000 characters, while the model sees the full eligible target list; raw HTML/full model observation were not retained. The model stopped without an action, but the evidence cannot distinguish absent, unopened or unobserved date/party controls. No source control change or new Live was made. Corrected a separate first-missing-reason bug in read assessment: missing request-bound availability now precedes availability-source identity, so the already HIGH-identified outlet is not misreported as lacking identity. [Offline attribution](H001-NATIVE-GOOGLE10808-LIVE-2026-09-29.md#post-run-offline-control-diagnosis).

## 2026-09-29 — Google-only 10808 transport and authorized H001 full Live rerun

Added a scoped Undici ProxyAgent to Google Places, wired both server-side Live entry points, and set the ignored local `.env` Google proxy to 10808. DeepSeek and browser source paths remain default. A local CONNECT contract and one real Google API read established the path. The previous pre-candidate Google network error's repeated Agent search is now an offline-proven one-failure stop preserving `GOOGLE_NETWORK_FAILED`. After 558/558 offline tests and code gates, the newly authorized H001 full Live completed in 69,930ms: Google location succeeded, Tabelog admitted one in-radius outlet with cited omakase HARD evidence, but availability stayed UNKNOWN; TableCheck inspected five outside-radius outlets from 21 raw links and had no admitted candidate. Independent Eval qualified NO, no Offer or presentation, no booking write or further retry. [Result and limits](H001-NATIVE-GOOGLE10808-LIVE-2026-09-29.md).

## 2026-09-29 — H001 native downstream offline closure for independent review

Replaced legacy cross-source rematching on native fact/availability reads with same-source outlet continuity and negative controls. A full bounded batch now investigates later candidates after a candidate failure, records source discovery funnel and proceeds to TableCheck only when the Tabelog batch cannot deliver. Default native short-batch delivery is explicit in ADR-0033; the full H001 fixed-page composition reaches supported presentation or scoped stop. Saved 11 execution/Eval pairs for independent review. The newly authorized Live remains unrun pending that review; no commit or push. [Detailed handoff](H001-NATIVE-DOWNSTREAM-2026-09-29.md).

## 2026-09-29 — H001 downstream independent-review corrections

The reviewer reproduced premature END_READ after second-source discovery and a same-URL challenge accepted by native facts. One shared per-source pending-investigation gate now blocks early stop/short delivery; continuity rejects source challenges and explicit error documents before HIGH identity. Tabelog continuity preserves the full outlet path across language variants. Corrected the scripted H001 semantic proposal to retain `OPEN_ENDED`, regenerated 12 execution/Eval pairs and prepared one `TABLECHECK_CONTINUES` fixed-source real-model command for review. No model or Live call has run after this correction. [Counterexamples and limits](H001-NATIVE-DOWNSTREAM-2026-09-29.md#independent-review-correction).

## 2026-09-29 — H001 downstream one fixed-source model decision run

After independent release, ran only `TABLECHECK_CONTINUES` with real DeepSeek and fixed source pages. It followed Tabelog A unavailable/B unknown into TableCheck A unavailable/B available, then delivered B with the default three-result target recorded unmet. 13 model calls, 7 Agent steps, 16,461 ms; independent Eval qualified YES. No actual provider pages or Live read; Live release remains with main review. [Execution and evaluation](H001-NATIVE-DOWNSTREAM-2026-09-29.md#one-released-fixed-source-real-model-run).

## 2026-09-29 — H001 downstream one Live stopped at Google location network failure

The unique reviewed H001 Live preserved the frozen request but 25 completed Agent searches all failed in Google Shibuya named-place resolution before native source access. The 300-second deadline cancelled the run with 26 Google location requests and no candidates or inventory reads. The no-progress loop and exact evidence are recorded; no automatic Live retry or source/radius expansion. [Live diagnostic](H001-NATIVE-DOWNSTREAM-LIVE-2026-09-29.md).

## 2026-09-29 — Native fixed-source model transport blocked before Semantic

Ran the independently released first fixed-source H001 scenario once. It failed before a model response or source read because the ordinary sandbox could not resolve DeepSeek; a no-key unsandboxed HTTP check reached the host. Preserved the execution/evaluation artifacts, did not invoke the second scenario and did not retry paid model work. [Evidence](H001-NATIVE-FIXED-SOURCE-MODEL-2026-09-29.md).

## 2026-09-29 — H001 second review: bounded end and session isolation

Closed a premature `END_READ` after empty Tabelog discovery by making the still-unread second native batch part of the Domain read-completion gate. Replaced a failed detail navigation session before the next observed candidate, while retaining already grounded outlets and recording candidate-scoped failure metadata; no failed outlet retry. The poisoned-session Fixture and early-end Agent scenario both reproduce the old defect and pass after repair. Six offline artifacts and independent evaluations have been regenerated; real model and Live remain frozen for review. [Evidence](H001-NATIVE-STAGE2-PREFLIGHT-2026-09-29.md#second-independent-review-correction-2026-09-29).

## 2026-09-29 — H001 independent review corrections

Closed the reviewer-observed single-detail batch loss and premature second-source search with explicit red/green counterexamples. Native ID mismatch now stops at the direct source detail instead of falling back to site-wide name search. Tabelog and TableCheck adapters now each route cross-source and native HIGH identity into one extracted availability tail. A conservative presentation guard prevents unresolved cross-source native same-outlet records from filling two result positions without merging their evidence or inventory. Five fixed-page artifacts and independent Eval were regenerated; paid model and Live remain unrun pending renewed review. [Evidence and limits](H001-NATIVE-STAGE2-PREFLIGHT-2026-09-29.md#independent-review-correction-2026-09-29).

## 2026-09-29 — H001 bounded source-native composition, offline checkpoint

Added Tabelog then TableCheck one-batch native discovery through the existing Router/Runtime/Agent chain, exact named-location radius admission, source-bound fact and availability reads, and an explicit bounded-scope no-result reason. Corrected presentation evidence to cite the availability check's own HIGH identity alongside its slot. ADR-0032 records the narrow change from ADR-0015; the capability matrix links the four source-page Harness scenarios. Existing Google candidate execution remains separate. Offline execution and independent Eval pass for both actual presentation paths and reject empty/outside-radius cases. A dedicated native fixed-source real-model Runner is prepared for the review gate; paid model and current-source Live are still unrun; no commit or push. [Stage 2 record](H001-NATIVE-STAGE2-PREFLIGHT-2026-09-29.md).

## 2026-09-28 — Two-source native mini-live on new VPN/default path

Removed the explicit browser proxy override per latest user direction. Both source searches now yielded native candidates; Tabelog reached one geographically eligible venue with citedomakase support but no actionable requested date, while TableCheck's firstfive Best match sample lay outside the fixed radius. Recorded these as distinct source-state and experimental-selection limits, not access failures or accepted inventory. No production source changes. [Results](NATIVE-TWO-SOURCE-VPN-2026-09-28.md).

## 2026-09-28 — Default versus proxy network diagnosis

Compared both observed site URLs with bounded NetLog probes. Distinguished Tabelog's now-successful default navigation from TableCheck's API403/default and main-document403/proxy. Read-only routing evidence shows main/API traffic differs; no causal claim about egress rejection rules or all past TLS failures. No production/network changes. [Evidence](BROWSER-NETWORK-PATHS-2026-09-28.md).

## 2026-09-28 — Proxy timeout narrowed to TLS phase

Recorded a focused Chromium NetLog and explicit-proxy curl comparison for the failed regional URL. Chromium connected to localhost and receivedCONNECT200, then waited afterClientHello until cancellation; curl completed TLS/HTTP through the same proxy. Preserved deeper-cause uncertainty and did not change browser security, network settings or production code. [Evidence](TABELOG-NATIVE-MINI-PROXY-2026-09-28.md#follow-up-why10808-can-still-time-out).

## 2026-09-28 — Native mini-live and persistent local proxy preference

Applied the user's10808 preference to local browser configuration and ran one bounded Tabelog native discovery experiment. Keyword-only Tokyo search returned candidate links, but the observed Shibuya regional navigation timed out through the same proxy before any detail/model/availability read. Recorded partial native-discovery evidence separately from untested production replacement; deferred default-network diagnosis as requested. No production code changes. [Outcome](TABELOG-NATIVE-MINI-PROXY-2026-09-28.md).

## 2026-09-28 — Explicit local Chromium proxy configuration

User-proposed localhost10808 proxy made the previously failing Tabelog document readable. Added one optional environment/constructor setting, passed through to both Playwright launch modes; no retries, fallback or system-network changes. Existing launch coverage and536 default tests pass, with a successful production-factory single-page Live observation. Search content remains empty for the combined keyword; inventory and TableCheck are unvalidated. [Evidence](TABELOG-NATIVE-2026-09-28.md#follow-up-explicit-localhost10808-proxy).

## 2026-09-28 — Tabelog alternative-source diagnostic

Reused existing runtime, parsers and planned shared browser execution in an ignored bounded native diagnostic. Initial search navigation failed before model invocation; one same-URL HTTPS comparison returned200. Preserved browser failure separately from HTTP reachability and recorded all downstream stages as not reached. No production change or further full-run retry. [Evidence](TABELOG-NATIVE-2026-09-28.md).

## 2026-09-28 — User Chrome comparison recorded

Inspected the supplied search URL in the user's existing Chrome tab without reload. Its empty-state page and same-query preflight CORS errors reproduce the search-access symptom outside the diagnostic browser. Recorded the observation separately from the earlier HTTP403 capture; no fresh request status or origin/egress root cause is asserted. No production change or new model run. [Evidence](NATIVE-SOURCE-ACCESS-2026-09-28.md#actual-user-chrome-comparison).

## 2026-09-28 — Native search failure diagnosis

Added only ignored, bounded diagnostic scripts and preserved source snapshots/network events. The user-selected next-day request reached TableCheck search DOM, but HTTP403 preflight responses prevented search-data reads while the UI rendered an empty state. No production code change or model call. Tabelog UI entry was reachable, with requested-date and availability still unconfirmed. [Independent findings and limits](NATIVE-SOURCE-ACCESS-2026-09-28.md).

## 2026-09-28 — H003 TableCheck Loop 2 bounded retry

Reused the already present shared browser option-selection correction and changed only an ignored diagnostic to materialize current H003 input instead of the elapsed historical date. Targeted unit and real local Chromium Fixture checks passed. One continuous TableCheck native-search-to-check Live read stopped at initial search navigation timeout before any candidate, so the corrected controls and inventory were not Live exercised. No production adapter edit or external write. This H003 invocation incorrectly resumed an old request after the assigned H001 run; it was an additional, out-of-scope Live attempt and is not H001 acceptance. [Stage outcome](H003-TABLECHECK-NATIVE-LOOP2-RETRY-2026-09-28.md).

## 2026-09-28 — H001 TableCheck-native single read-only run

Prepared a gitignored bounded diagnostic from current H001, using Google only for Shibuya locality resolution, then a TableCheck native query and planned same-source geography, omakase and availability checks. One temporary direct-guide pointer was added to the existing TableCheck adapter, but the sole Live run timed out while navigating the initial native search, before any candidate used that pointer; it was removed. The artifact records 37,106ms, zero model calls and no source DOM, candidate, inventory or external write. No production search or evidence contract changed. [Outcome and stop boundary](H001-TABLECHECK-NATIVE-2026-09-28.md).


## 2026-09-28 — Fixed-source model validation exposed citation namespace ambiguity

With explicit user authorization, one six-call fixed-source run demonstrated a single-step browser handoff and a lawful availability decision in the historical H001 post-fact context. It did not pass the complete fact contract: the model correctly interpreted a recorded omakase sentence but cited its paragraph number instead of the source document; other UNKNOWN outputs omitted citations, and one selection exceeded the existing three-statement bound. Network requests succeeded.

Applied a small offline correction, fact Prompt12/schema4: strict citation enums come from this read's supplied source IDs; instructions distinguish selected paragraphs from cited documents and require assessed-source references for UNKNOWN. Kept the original evidence and selection validation, with no guessed repair, retry or website condition. Existing citation/production tests and all default gates pass. No model invocation after this correction and no full H001; the real-model acceptance and remaining identity cases stay open. [Results and limitations](TEST-LOG.md#test-2026-09-28-source-fact-model-validation).

## 2026-09-28 — Shared source-text handoff and investigation guidance (offline candidate)

Extended the existing Google-listed website → fact judgment → Runtime composition used by both Web and Hybrid. An identity-bound page supplies transient bounded statement IDs; the existing judgment call selects exact source lines and returns cited conclusions. Code materializes only observed selections with their same-source identity, keeping quotations separate from derived judgments and inventory. Public telephone links use the existing exact-phone identity path. Browser COMPLETE now explicitly hands relevant prose to interpretation; Agent@19 describes lawful availability progress after fruitless fact reads. Fact judgment@11/schema3 retains prior criterion semantics; no upstream semantic, retry framework, site patch or additional per-page judgment invocation.

Production-composition positive and pre-change negative controls plus the existing independent evaluator pass; all default gates pass. Replay corrected an implementation assumption: Sushiki's original Google phone differs from its site, so this patch does not solve that identity case. Shared-menu scope also remains open. A bounded model check was prepared but automatic approval review rejected this data transfer pending explicit user authorization; it did not run. [Validation, boundaries and evidence](TEST-LOG.md#test-2026-09-28-source-fact-handoff-offline).

## 2026-09-28 — H001 reached facts, exhausted model budget before availability

A newly authorized single run completed 50 model invocations without provider failure and discovered 38 candidates through Google. It stopped at 189,355ms on the unchanged 50-call ceiling after consecutive fact-investigation batches, with no availability read or delivery. Preserved access obstructions, identity/claim acceptance limits and browser page cycles separately; no code change, extra budget or retry was introduced. [Evidence and next diagnostic slice](TEST-LOG.md#test-2026-09-28-h001-network-recovered-fact-budget).

## 2026-09-28 — DeepSeek transport diagnostics, connection still blocked

Preserved allowlisted transport cause codes in the existing gateway observer record and separated response-body I/O from JSON parsing. A real keyless reset now survives the production Semantic→Gateway→observer path as NETWORK / TRANSPORT / ECONNRESET. No schema, semantic, retry, provider, dependency or proxy setting changed. Local verification passed; current network failure remains open rather than being relabelled as fixed. [Evidence](TEST-LOG.md#test-2026-09-28-deepseek-transport-diagnostics).

## 2026-09-28 — User-authorized TUN follow-up Live

Repeated H001 once after the user reported the missing TUN setup. Google named-place requests still failed before candidate discovery; a single keyless Node host check independently returned UND_ERR_CONNECT_TIMEOUT. Preserved both runs and the repeated-failure control finding, without changing code or network settings. Next verification must establish the actual Node transport path before another full run. [Evidence](TEST-LOG.md#test-2026-09-28-h001-tun-rerun).

## 2026-09-28 — Bounded H001 Live blocked before browser

The user-authorized 300-second/50-call run reached no candidate: repeated Google named-place transport failures left SEARCH_RESTAURANTS legal and END_READ unavailable until cancellation. Independent review distinguishes the unrecorded low-level network cause from the confirmed repeated-failure control gap. No implementation, semantic, prompt, retry policy or budget changed; no second run was launched. [Evidence and minimal next slice](TEST-LOG.md#test-2026-09-28-h001-after-readback-live).

## 2026-09-28 — Current-source selected-value readback verified

One newly authorized read-only probe verified a real Tokyo time transition from 19:00 to 19:30 with the independently reviewed candidate unchanged. Raw value-container DOM, trusted option click and production completion agree despite the empty input and collapsed menu. Two model calls completed in 14,579ms; no production changes, repeated suites, H001, commit or push. [Evidence and remaining scope](TEST-LOG.md#test-2026-09-28-tokyo-readback-live-pass).

## 2026-09-28 — Browser proxy selected-value offline candidate

The September 28 Tokyo Live recorded one trusted click on the 19:00 option, but the readonly Time input kept an empty value and Executor could not confirm selection. Earlier saved TableCheck HTML in `browser-final-2026-09-16/registry-combobox-probe.json` and `browser-tabelog-repair-2026-09-16/tablecheck-region.json` shows an explicit `Value Container` containing one `singleValue` display and the focus input. The September 28 artifact records only their local text relationship, so source compatibility remains unverified.

The shared Registry now exposes that narrowly bound display as the current combobox value and carries the actual combobox node identity through its existing `stableKey`. Executor compares the post-action value on that same node; a collapsed menu need not retain `aria-controls`, while option ownership before action still requires the explicit expanded combobox/listbox relation. No site name, React Select numeric ID, prompt, semantic, fact, identity, Gold, inventory rule, retry, or budget changed. The existing browser regression and TableCheck Adapter fixture were strengthened in place; this is an offline candidate, not a closed Live result. [Verification](TEST-LOG.md#test-2026-09-28-browser-proxy-selected-value-offline).

Root independent review accepted the final hashed offline candidate after a separate 5/5 targeted real local Chromium run and a network-blocked replay of the historical raw value-container fragment. Distinct values were correctly bound to their empty inputs, and the actual Adapter paths consumed the selected values. Historical source support, synthetic transitions and current Live remain separate claims; no additional external run or commit/push occurred. [Independent evidence](../../.eval-artifacts/browser-readback-review-2026-09-28/REVIEW.md).

## 2026-09-28 — One authorized final-binding Live probe

Reused the bounded public-control probe with an actual option-click trace to address the previous evidence gap. The final production candidate clicked the observed 19:00 option, but selected-value confirmation still failed for the empty focus input with adjacent display text. The page already displayed 19:00 initially, so this is target-click evidence, not a changed-value transition or proof of the historical cause. No production patch or new testing framework was introduced. One run consumed the authorized six-call allocation; H001 remains gated on reliable readback. [Run, attribution and limitations](TEST-LOG.md#test-2026-09-28-tokyo-final-binding-live).

## 2026-09-26 — Minimal frontloaded Test/Eval verification

User clarified that avoiding excessive defensive testing and Eval is a permanent constraint. Test now owns minimum sufficient investment and stopping rules: challenge only consequential current assumptions before implementation, reuse existing coverage, choose the earliest adequate verification layer, and stop when evidence is sufficient. Controlled mutations are targeted tools when assertion effectiveness is in doubt, not a per-test obligation. Eval reuses existing oracles/artifacts and separates actual effect, safe handling and completion without a new score or reporting framework; Planning/Post-change reference those rules.

Three existing browser behaviors were strengthened in place, with no added test cases or production changes: native selection records expose an earlier wrong choice even if the final value is correct; dynamic custom selection checks actual page effects independently of Registry values; asynchronous confirmation uses an explicit fixture release instead of a timer, and inventory readiness no longer supplies selected-value confirmation on the executor's behalf. One isolated executor fault proves the previous async test missed this omission and the strengthened test detects it. Existing evaluator controls are reused. See [verification record](TEST-LOG.md#test-2026-09-26-minimal-frontloaded-verification).

## 2026-09-26 — Promote normal stale-target recovery into the existing regression

The coverage audit found legal DOM replacement recovery had only an independent temporary probe, while committed-path fixtures stopped at rejection/human help. Extended the existing changed-option parameter group with the successful replacement continuation, preserving the illegal-role and submit replacement controls and a three-call ceiling. An isolated stale-branch mutation causes the new completion assertion to fail; the normal candidate passes all three controls. No production or Skill contract change. The audit records why the existing Test requirements were not fully translated into browser timing scenarios and maps formal coverage versus unresolved Live gaps in the [independent report](BROWSER-GENERIC-INDEPENDENT-REVIEW-2026-09-26.md#总纲落实与正式回归核对).

## 2026-09-26 — Browser independent review and bounded real validation

Independent review returned and verified persistent selection confirmation, cross-field pending overwrite, duplicate button-combobox ownership and DOM-property readback defects. Bounded real-model controls passed, but current-source probes did not. Tokyo's new trace distinguishes a correct model 19:00 proposal from a page announcing 17:30; an independent real local Chromium control then proved mutable ordinal locators can change actual target during model latency. This shared target-identity defect is returned to the same implementation task. Do not attribute Tokyo to property-only extraction or claim Live success. Upstream semantic/identity/Gold remain frozen, all external probe allotments are consumed and H001 is not started without its mechanism prerequisite. [Independent report](BROWSER-GENERIC-INDEPENDENT-REVIEW-2026-09-26.md).

The dynamic-target correction now pins observed ElementHandles and checks action-relevant semantics/permission fields before acting; style-only changes are not rejected. Native select reuses the existing stableKey for actual-node identity across observations, without a second public identity field or compatibility fallback. A stale node triggers a fresh observation in the existing bounded model loop. Independent local insertion, permission-change, selected-value confirmation and replacement-recovery controls pass, as do final code gates (532 default / 41 Chromium). No further external model or Live was run after this final correction; source proxy-value binding and real delivery remain open.

## 2026-09-26 — Browser A/B offline implementation candidate

A: Historical H001 navigation interruption and the executor's earlier session reuse were traced to runtime `page.goto` failure arriving before the executor deadline. The shared executor now detaches the failed session synchronously, closes it independently, removes its old abort listener and opens a fresh session for later legal work. Delayed cleanup cannot block cancellation, reset budgets or finish a newer candidate's lifecycle. Both Local and Cloudflare session implementations use the same executor rule.

B: Native time select exposed a visible 7:00 PM label with an opaque timestamp value, while the old action wire supported time only as a custom option click. `browser_read_action@4` and Browser Prompt@5 replace native `SELECT_AUTHORITATIVE` and custom option `CLICK_AUTHORITATIVE` with `CHOOSE_OPTION` on a current observed option. The registry binds custom options only through an explicit expanded combobox/listbox relationship; the executor validates label against the Router request, preserves selected value confirmation across later observations and rejects another option while the previous selection is unconfirmed. The generic Skill owns selection instructions; TableCheck Skill retains source facts. No upstream semantic, business Agent, identity or Grounding rule changed. This is an offline implementation candidate pending independent review and bounded model/Live validation.

Independent review added a standard native button combobox variant. The control was duplicated in BUTTON and INPUT groups, so the option correctly failed owner binding but a normal query could not advance. The INPUT selector now excludes native buttons; the explicit parent relation remains mandatory. A new existing Hybrid composition case drives the new action through the real `LiveBrowserAvailability` and TableCheck Adapter to grounded availability evidence and a presented result, without injecting State or source evidence. The obsolete generic option-click TIME branch and outdated combobox guidance were removed.

The bounded real-source probe then exposed a separate custom-input readback gap: an already-supported readonly INPUT combobox is classified as BUTTON for safe opening, but its current DOM `value` property was omitted from BUTTON observations when `aria-label` stayed fixed. Registry now reads that current property only for observed BUTTON-group combobox inputs. The existing custom-control production Adapter fixture uses property-only updates for party and time and verifies both selected values after operation; it failed before this change and passes afterward. No site branch, business request change or extra model call was added.

## 2026-09-26 — 通用浏览器操作与会话可靠性实施计划

基于授权H001 Live及后续代码/零网络控制，确认底层导航异常与Executor deadline的会话处理不一致，以及native SELECT观察、时间动作和Skill指导不一致。用户要求通用Browser Agent解法、冻结上游semantic，并指定原6-sol-medium任务实施。新增[Playbook](../BROWSER-AGENT-GENERIC-OPERATIONS-PLAYBOOK.md)，按A会话隔离、B统一选项选择两个可运行切片推进；复用既有控件/执行/验证机制，不增加跨业务DSL、兼容层或多级重试。计划与派工不代表实现通过。主任务保留独立验收职责，实际结果后续追加。

## 2026-09-24 D1–D3 offline continuation

D1 reviewed the H002 Choryumon Prompt@8 false CONFLICT and the rolled-back Prompt@9 false SUPPORTED. Prompt@10 is an unaccepted working-tree candidate: negative category conflict requires positive source identification with the criterion's qualifiers; support requires explicit source denial; a different primary cuisine remains UNKNOWN. The existing HIGH same-source grounded-entity exception stays intact. Six fixed exposed controls and a bounded model-only runner retain raw outcome, scope, citations, converted claims and final eligibility separately; no model call has been made. D2 strengthened the existing Hybrid composition with the actual plural HARD wording and non-primary Google hot-pot type; no new matcher or search path was added. D3 changed only Agent guidance (Prompt@18) and added a production-composition path in which fresh request-bound stock is followed by missing facts and three presented results. The scripted model proves this legal route, not model-choice quality. Semantic, Gold, global run budgets, and source adapters were not changed; complete Live acceptance remains open.

## 2026-09-24 Independent Playbook review corrections

Returned four concrete counterexamples to the original implementation task and reviewed the fixes: bound ongoing reads at the delivery reserve and revalidate after decisions; recognize Japanese reservation forms; require current same-outlet request-bound stock instead of combining fresh controls with old inventory; record/check total model starts in Evaluator@21. A proposed synthetic result-attribute production path was rejected and removed. A local asynchronous Chromium control uses the existing bounded WAIT. No new Live, paid model, booking, commit or push. The separate H003 work remains intact. [Independent review and remaining gates](LIVE-PLAYBOOK-INDEPENDENT-REVIEW-2026-09-24.md).

## 2026-09-24 TableCheck source-owned shops entrance

The C1f Adapter attempt stopped at the guide-to-booking entrance. A current LAVAROCK public guide GET showed one Restaurant JSON-LD entity whose `@id` matches the guide and whose `acceptsReservations` and ReserveAction target point to the distinct `/en/shops/cytokyo-lavarock/reserve` page. The resolver now uses that explicit same-entity TableCheck target ahead of the guide's embedded widget. The existing Adapter main fixture reaches the distinct page and accepts a fully selected synthetic request and slot, while unrelated JSON-LD entity and external-link controls remain blocked. No live inventory or whole H003 result was claimed. [Stage record](LAVAROCK-CONTROL-2026-09-24.md#a-entrance-follow-up-source-owned-guide-to-shops-reservation).

## 2026-09-24 current Runner resource-limit evaluator correction

The H001 Playbook audit found that the diagnostic evaluator read only legacy `limits`, while current Hybrid Live artifacts write `runCeilings`. Its resource dimension could therefore report satisfaction with no recognized ceiling. Evaluator/rubric@20 maps current elapsed, Agent-decision and browser-model usage to the corresponding run ceilings; missing required limits remain unassessed and overages fail. Legacy `limits` remains a retrospective input. The original H001 result and @19 sidecar are immutable; a new @20 sidecar reports the observed 34 ms deadline overage. This changes evaluation, not source execution or the accepted result contract.

## 2026-09-24 H003 native TableCheck contiguous retry

Read-only connectivity checks showed the earlier local search connection error was not stable; no production browser code change was justified. The gitignored diagnostic's source sublimits were corrected to the existing 60-second candidate and 30-second provider caps. One contiguous search-to-check retry then carried two geographically admitted, source-identified TableCheck candidates into the existing provider adapter. Both independently reopened their source guide and reached HIGH exact-phone continuity, but date/10-person/time controls did not yield a complete request-bound result before source timeout. Total 76,797 ms and ten browser-model calls produced zero offers. This is an adapter-level diagnostic, not full Router/Runtime delivery or a validated architecture benefit. [Full sequence and limits](H003-TABLECHECK-NATIVE-LOOPS-2026-09-24.md#follow-up-one-contiguous-retry-after-browser-connectivity-check).

## 2026-09-24 E1 default first-batch delivery reserve

The H001 exposed read had two eligible restaurants but no presentation before its deadline. ADR-0031 narrows ADR-0028 only for the default first batch: with 45 seconds left in a long read run, a code-recorded window makes the current supported short batch presentable and stops new reads. State, Domain Validator, Agent Context, Decision Prompt@17 and the Live Runner's absolute deadline are wired to the same condition. The controlled availability test executes presentation through Coordinator, Router and Reducer with `met:false`, preserving explicit-count and stale-evidence rejection. The one-call fixed-source real-model probe was blocked by automatic approval before any request, so model choice and H001 final delivery remain unverified. [E1 record](H001-DELIVERY-WINDOW-2026-09-24.md).

## 2026-09-24 H003 TableCheck native discovery and availability experiment

Kept the H003 evaluation coordinate, exact 3 km gate and original 10-person Friday after-work request. A TableCheck-only region search without a known restaurant name exposed five traceable guide pages; two guide-owned coordinates passed 3 km. No Google restaurant matching was used. The contiguous search-to-availability composition could not reach source navigation because the local browser path returned `ERR_CONNECTION_CLOSED` twice and the existing remote path failed session creation. No production adapter, search strategy, Gold or evaluation contract was changed; the [stage record](H003-TABLECHECK-NATIVE-LOOPS-2026-09-24.md) preserves the limited positive discovery result and the unmeasured Loop 2 gate.

## 2026-09-24 LAVAROCK C1 live-control request binding

Current TableCheck LAVAROCK read-only evidence showed both selected date and adults on one reservation form. The first HTML-only parser addition was rejected after a 10→9 control change left the markup and URL at 10. The final TableCheck parser requires the live values and selected adult option from the same Browser observation, with the source form establishing the field pair. Browser Executor now passes that observation to its completion check. A bounded repeat accepted 10 before the change, rejected stale 10 and accepted 9 after it; no completed inventory or booking was inferred. A separate Adapter fixture attempt could not reach the `/shops/.../reserve` form from the guide entrance; that selected-outlet binding remains work package A. Two pre-existing Tabelog local route maps were aligned to B1's Tokyo-scoped search so the browser Fixture could exercise its actual production entrance. [Detailed evidence](LAVAROCK-CONTROL-2026-09-24.md).

## 2026-09-24 Choryumon D1 fixed-source diagnosis

The H002 saved Google-listed website states Cantonese as the main cuisine, yet its derived model fact marked the venue as conflicting with the Sichuan/Hunan spicy-focus exclusion. Since the historic raw judgment was not saved, one new fixed-source Prompt@8 call captured exact request and raw `CONFLICT`, locating the initial error in the model judgment. A local Prompt@9 wording candidate was exercised on the saved fact, an explicit synthetic prohibited-type fact and a broad Chinese fact. It changed the target to `SUPPORTED`, creating an insufficiently supported verified-negative claim under the overlap-aware category contract. The candidate was reverted; production Prompt@8 and all existing semantic baselines remain unchanged. See [D1 evidence and stop verdict](CHORYUMON-FACT-JUDGMENT-2026-09-24.md).

## 2026-09-24 C1 and E1 bounded diagnosis

Read the saved H003 LAVAROCK action trace and one current, read-only reservation page. Adult selection reported 10, but no independent selected-date observation was preserved and the current combined-request parser returned false. This did not justify relaxing the request or inventory gate; [C1 remains uncovered](LAVAROCK-CONTROL-2026-09-24.md). Separately, H001 already had two independently eligible results with about 45 seconds left, but the [accepted three-result contract](../decisions/0028-open-ended-result-targets-for-availability.md) and matching Validator/prompt explicitly require continued legal reads. Recorded [E1 as a contract gap](H001-DELIVERY-WINDOW-2026-09-24.md), with a predeclared 45-second controlled reserve proposal. No production change or claim of completed presentation in either diagnostic.

## 2026-09-24 MARUNOUCHI BASE B1 source-discovery slice

The H003 saved Tabelog search went to Aichi despite a Tokyo candidate. An independently located Tokyo Tabelog page and a bounded real search established that `/en/tokyo/rstLst/?sw=MARUNOUCHI%20BASE` exposes the correct outlet to the current parser. Added Tokyo/東京都 address scoping only to the Tabelog search URL, including an observed alias search and diagnostic URL handling. Reused the Adapter's identity/inventory guards and added one field-derived example in its existing main test file; non-Tokyo remains unscoped. No retries, identity threshold, evaluator, other provider or budget changed. See [bounded evidence and limits](MARUNOUCHI-SOURCE-DISCOVERY-2026-09-24.md).

## 2026-09-24 TWO ROOMS A2/A3 extension and targeted read

Existing missing-address, wrong-street/floor and same-name/shared-phone branch controls cover the postal rule boundary. Kazumasa and Komachi still conflict for distinct mechanisms and were not folded into the postal edit. A new field-derived local composition passes TWO ROOMS from source extraction through shared identity, Router and Task Runtime, and navigates to its reservation page without inventing inventory. One bounded zero-model TableCheck read failed earlier at discovery: it found five different merchants, never `trnihombashi`. The current external identity path is untested, not an invalidation of the local postal comparison. This discovery failure belongs to B1. [Stage evidence](TWO-ROOMS-IDENTITY-2026-09-24.md).

## 2026-09-24 TWO ROOMS identity postal comparison experiment

The H003 Google candidate and TableCheck page had an exact phone, matching Nihombashi street number and seventh floor, but town postcode `103-0027` versus building-floor postcode `103-6107` caused a false address conflict. The restaurant's own access page and Japan Post fixed the same-outlet expectation before the edit. The shared comparator now treats the narrowly corroborated postcode variation as insufficient address evidence rather than a conflict; it does not create an address match. Four source-frozen controls support the mechanism without running H003 again. This does not establish current inventory or final delivery. [Experiment and scope](TWO-ROOMS-IDENTITY-2026-09-24.md).

## 2026-09-24 bounded H003 Live and A–D acceptance

H003 ran once on clean `605dc82` after the D wording correction and offline checks. It produced one source-grounded available offer near the 300 s deadline, but no user-facing presentation; the task was cancelled at the original limit. Browser operations fell 435 to 281 against old H003 while browser-model calls rose 26 to 30. The automatic evaluation and manual acceptance agree there is no qualified result. Across H001–H003, the A–D product promise remains unaccepted; the next code slice must address normal-result completion within the same budget. [Evidence](EXECUTION-CORRECTNESS-2026-09-24.md).

## 2026-09-24 bounded H001/H002 Live review and D wording correction

Clean `fb1b48a` H001/H002 remain cancelled at their original 300 s ceiling; automatic evaluations retain no qualified user result. H001 has two eligible candidates in State but never presents them. H002 reduces browser operations but still has no eligible result. The live source showed Hyoki's `hot_pot_restaurant` in Google `types`; the existing D regression's singular `restaurant` missed the actual plural/hyphen HARD wording. The Domain test now uses that observed wording and the matcher accepts both singular and plural scoped type terms. Original runs remain unchanged; no H002 paid retry. [Evidence](EXECUTION-CORRECTNESS-2026-09-24.md).

## 2026-09-24 A–D execution correctness offline slice

Starting at clean `0220d2a`, the code differs from the `325880d` Live implementation only by Test/Eval documentation changes. TableCheck now keeps run-scoped parsed identity observations, rechecks the selected page before inventory, binds linked reservation pages to their observed URL, and rejects stale search queries. Agent strict-wire failures name only rejected field paths and permit one budgeted regeneration; persistent invalid output stops. Browser Executor stops identical rejected proposals on an unchanged observation. Google negative HARD type conflicts use full observed `types` plus `primaryType` and remove explicitly conflicting candidates from further website/model fact and availability work. Semantic, Gold, global ceilings and external-write boundaries were unchanged. C's two identity samples do not justify changing HIGH matching; cross-action website/availability reuse is not claimed. [Package-specific evidence and limitations](EXECUTION-CORRECTNESS-2026-09-24.md).

## 2026-09-21 Live P0 single-pass review after implementation commit

Implementation commit `325880d` is local and not pushed. All three authorized Live executions record the identical actual HEAD and CLEAN tree. H001 fails on an Agent action contract violation; H002/H003 terminate at the real global deadline. Geographic admission and H002 station resolution are supported by actual source artifacts, while P0-2 completion remains open. Source-read failure continuation works across completed batches; this is insufficient to claim overall acceptance. No automatic retries, code edits between runs, Semantic prompt changes, increased limits or H004/H005 Live. See [per-P0 final review](LIVE-READ-P0-REVIEW-2026-09-21.md).


## 2026-09-21 Live Read P0 execution closure implementation

Strict Google geographic admission and stable continuation, contextual named-location resolution, scoped candidate/provider failures, bounded browser acquisition/operations and diagnostics are integrated in the working tree. The CLI shares immutable success/failure/cancellation capture with real-composition tests. Root-cause codes survive Agent/Router/Reducer. Independent review caught timer lifetime, shared-budget masking, identity-loss and false no-progress defects and required corrections before Live. No semantic prompts, HARD/SOFT rules, frozen H001–H005 fixtures or global ceilings changed. Actual Hybrid composition and isolated mutation controls replace reliance on local adapter success alone. Final recovery review passed; single-pass clean-HEAD H001–H003 Live remains pending; [audit report](LIVE-READ-P0-REVIEW-2026-09-21.md) retains the original failed reviews.


## 2026-09-18 H002/H003/H004 semantic closure (no production candidate)

H004 is formally closed: the preserved specified SOFT pair is manually accepted as `SEMANTICALLY_EQUIVALENT`; the original deterministic result remains `NOT_EVALUATED` and no evaluator, parser, synonym list or E2E result was changed. H003 candidate E's saved three outputs were manually reviewed. `suitable for a team dinner` is semantically equivalent to the original requested filtering condition in this case and keeps the same source-evidence burden, so E is accepted only for the exposed H003 case. The unrelated work-celebration/drinks strength regression remains open.

A deliberately narrow party-size supplement was implemented only as a disposable candidate: it required an already compiled AVAILABILITY draft with missing party, a potentially countable message, and no prior invocation; it could only return a number/source or UNKNOWN and could only add the party field. Its planned old+blind matrix was frozen before running. All 24 user-authorized real DeepSeek calls were provider-rejected before any model response, without retry. This is a strict-transport failure, not an inference-quality result. The combined E+resolver production gate therefore failed; all candidate production code/wiring was removed rather than leaving an unaccepted path in the application. H005 was not touched. See [closure report](H002-H003-H004-SEMANTIC-CLOSURE-2026-09-18.md).

## 2026-09-18 H002/H003 generic-rule expression diagnostics (diagnostic-only)

Playbook v2 formally closed H004 without rerunning it: the preserved `good for meeting a friend` / `suitable for meeting up with a friend` POSITIVE/SOFT pair is manually accepted as semantic fidelity, while the deterministic evaluator remains `NOT_EVALUATED`. H005 was intentionally not read, run, or changed.

Two independent 24-call full-parser experiments were then run under one exclusive process, with distinct run IDs and ledgers. D changed only the generic PARTY SIZE rule block to distinguish semantically closed relationship-described participant sets from open social occasions and customary guesses. It left H002 at 0/3 exactly like contemporaneous A, while all three existing party controls stayed 3/3; D is rejected and no further party wording was tried. E changed only the strength section's local optionality scope wording. It changed H003 from A's 0/3 to E's 3/3 expected strength pattern and kept the flexible room/budget terms SOFT; it also corrected the casual-dinner control. It did not correct the pre-existing work-celebration/drinks control (A/E both 0/3), and E produces `suitable for a team dinner`, whose text fidelity remains for human review. E is evidence for a limited candidate only, not an automatic production edit or a general strength conclusion. No production code/prompt, Gold, fixture, fact judgment, H005, commit or push changed. See `.eval-artifacts/semantic-rule-expression-diagnostic-2026-09-18/H002-H003-RULE-EXPRESSION-REPORT.md`.

## 2026-09-18 PARTY SIZE section-position diagnostic (diagnostic-only)

With `01e073f` confirmed as HEAD, this run preserved all current production Semantic Prompt@19 text for A and built C by moving the existing PARTY SIZE section exactly once from before AREA to after OPERATIONS. The preflight saved both full prompts and validates byte-identical moved text, no second occurrence, no other textual difference after removal, and unchanged output-shape position. It reused the previous diagnostic's four persisted party samples and did not add examples, answers, schema fields, or case rules.

The new runner uses direct single gateway calls with pre-dispatch ledger records, immediate per-call response persistence, Proposal validation, the production Compiler with trusted reference time, and the production reducer-owned `applyRestaurantIntentPatch` Draft projection. A 24-call A/C×3 run completed without provider failure or external source/browser action. C improved H002 from 0/3 to 2/3 but not the required stable 3/3; all closed/open/explicit party controls stayed 3/3. C therefore is explicitly rejected as a production revision candidate. The complete parser output remains recorded: it has no confirmed C-only key regression in these four cases, though both variants add an unscored friends criterion in the open-attendees case. No production behavior, Prompt revision, Gold, source, H004/H005, commit or push was changed. See `.eval-artifacts/semantic-party-position-diagnostic-2026-09-18/PARTY-POSITION-DIAGNOSTIC-REPORT.md`.

## 2026-09-18 Field-scoped semantic diagnostic (diagnostic-only)

Against frozen implementation `01e073f`, an isolated runner rebuilt A requests through the real Semantic Prompt@19 builder and Schema@3, then created B-party/B-criteria prompts only by retaining verbatim relevant production sections plus one scope sentence. It loaded the eight pre-existing exposed samples/expectations from the prior targeted-repair artifact rather than recreating them, fixed each sample's original reference time and interleaved A1/B1/A2/B2. The runner uses one provider call per pre-reserved ledger entry and does not use `RestaurantSemanticInterpreter`, whose ordinary schema-retry loop would violate this diagnostic's no-retry contract. The runner also persists future individual call records immediately after completion.

The first process was finalized as `FAILED_BEFORE_DISPATCH`: Node had not loaded the existing `.env`, so the server-side key was unavailable before Provider construction. Its ledger has zero reservations and zero calls. The completed run then used the repository's normal `--env-file-if-exists=.env` form and recorded all 32 calls. It did not access Google, sites or a browser. H002 is the only stable party change (A omitted first-date's inferred pair in both repeats; B emitted `2/INFERRED_CLOSED_PARTY` in both); strength observations were mixed and do not support a production rule change. See `.eval-artifacts/semantic-field-scope-diagnostic-2026-09-18/FIELD-SCOPE-DIAGNOSTIC-REPORT.md` and its immutable plan/result/ledger. No production Prompt, Schema, Compiler, Runtime, Gold, fixture, source fact, H004/H005 path, commit or push was changed.

## 2026-09-18 Semantic repair failure review (read-only, no new candidate)

Review commit was `01e073f`; the worktree started clean. The review added a read-only 48-call extractor and local ignored report/detail index, but made no production Prompt, Schema, Gold, fixed source, fact-rule or evaluator change. The extractor verifies that each saved raw output decodes to the stored Interpreter Proposal and records that the semantic-only runner never created a Compiler/Reducer final Draft.

The raw records show v19 did not contain a PARTY SIZE change relative to v17: H002's 0/3 → 0/3 did not test a new generic party intervention. The model handles an explicit closed “partner and me” pair and an explicit total, but not the un-named first-date occasion; whether that convention should be allowed is a policy question, not a basis for a hidden default. H003's preserved `team dinner` still becomes SOFT in one v19 repeat, so paraphrase is not a sufficient root cause; work-celebration/drinks and casual also repeatedly soften, while explicit flexible room/budget terms remain present. The source facts in H005 support neither a uniform “over-confirmation” nor uniform UNKNOWN conclusion without defining local food's intended referent; the original fact messages are absent and @3 has a documented over-tightening/dimension-mixing risk. No new provider call, external source/browser interaction, commit or push occurred in this review. See `.eval-artifacts/semantic-repair-failure-review-2026-09-18/REPORT.md`.

## 2026-09-18 Targeted H002–H005 semantic repair (candidate later committed as `01e073f`)

按照定向 Playbook 固定`9cfbd4f`失败artifact和当前`cb35984`工作树后，先分层定位而没有按测试名推断：H002的真实 Proposal 本身没有`PARTY_SIZE`，H003在 Proposal 已将`team dinner`降为SOFT，二者均非 Compiler／Reducer 丢失；H005保存的原来源为`Tokyo regional cuisine`等，a/c 旧判断过度支持`local food`，b 未支持，不能借空位或事后添加的`local food`字样回写原问题。H004只新增附加等价记录，原artifact、sidecar和`NOT_EVALUATED`不变。

候选把Semantic Prompt从@18收窄至@19：删除first-date和team-dinner案例句，保留封闭参与者和“忠实改写不得反向改变定义性条件强度”的通用约束；Fact Judgment从@2升到@3，仅要求直接文本蕴含，地理／regional cuisine主题关联不足时返回UNKNOWN。H005来源fixture恢复冻结文本；同一生产组合的脚本边界也返回UNKNOWN，使三次事实和三次查位之后正常停在`NO_VERIFIED_RESULT`、注册验收FAIL。无下游人数默认、case ID分支、同义白名单、ontology、Gold或私有Holdout修改。

一轮唯一候选的v17/v19真实模型语义A/B完成48个成功调用（八个开发诊断样本、每版本各三次）；H002为0/3→0/3、H003四项强度为0/3→1/3，其余控制及失败均保存，故停止而不再改Prompt。H005 v2/v3的18个事实判断没有运行：语义批次已用48，重复启动的临时进程虽终止却只留下STARTED且调用数不确定，未获新额度不继续。无Google、网页、浏览器、预约或外部写；无commit/push。详见`.eval-artifacts/restaurant-semantic-targeted-repair/REPORT.md`及本轮TEST记录。

## 2026-09-18 Fixed-source real-model findings and semantic fidelity follow-up

The frozen `9cfbd4f` composition ran H001–H005 once each against `SYNTHETIC_CONTROL` sources with the real DeepSeek model and the registered 5-minute/50-step/50-call ceilings. H001 alone passed the independent three-result acceptance. H002 omitted the already accepted closed first-date party inference and correctly asked for party size; H003 paraphrased a HARD activity into a different condition; H004 retained an independently unreviewable SOFT paraphrase; H005 returned two independently supported results but correctly recorded the three-result target as unmet. Execution and evaluation artifacts are retained; no failed case was retried.

The post-run Prompt@18 / explicit-`local food` local candidate recorded here is historical only. The current targeted candidate above supersedes its case-specific sentences and restores the frozen H005 source wording; this record does not establish current model quality or original-source support. The required next review remains with the original researcher.

## 2026-09-18 Open-ended availability target and fixed-source acceptance closure

ADR-0028 supersedes the narrow first-batch clause in ADR-0027: an explicitly classified `OPEN_ENDED` Restaurant target now carries the same default three-result target whether its goal is `RECOMMENDATION` or `AVAILABILITY`; an explicit user count still overrides it, while `SPECIFIC_OUTLET` and legacy unclassified targets do not expand. Availability retains its stricter per-candidate current slot evidence. The semantic target schema, interpreter contract and Agent decision instruction were updated together, so a valid availability count is neither rejected upstream nor silently dropped before the runtime/Validator target.

The registered H001–H005 fixed-source environment now supplies three independently identified candidates per frozen development request. Its production-composition test preserves Interpreter, Compiler, Reducer, Router, source grounding, artifact evaluator and acceptance path while replacing only model and external transports. Fixed-source acceptance now records the final presentation and refuses a qualified-result claim unless a registered three-result target has exactly three distinct presented candidates and a met persisted target; the general control remains unconstrained. The real-model fixed-source Runner accepts explicit ceilings up to the user-authorized 5 minutes, 50 steps and 50 model calls, but no paid call was made in this change.

No Gold/Holdout, browser page, Google request, booking, external write, commit or push occurred before final verification. This is an offline composition/acceptance closure, not evidence that a real model will select the correct three candidates or that a live source has inventory.

## 2026-09-18 Open-ended result target and party-boundary completion

The continuous selection slice now distinguishes semantic target scope rather than treating every recommendation as a three-card UI cap. `OPEN_ENDED` recommendations carry a default result target of three qualified distinct restaurants, an explicitly requested count replaces it, and `SPECIFIC_OUTLET` or legacy unclassified targets retain their original behavior. The Reducer carries this target into the existing Agent Context; the Validator rejects a short batch while an ordinary cursor, fact, or availability read remains legal, and only records an unmet smaller batch after all such reads are unavailable. The target survives local browse, shortlist and feedback events, but a semantic condition revision clears it with the rest of request-bound investigation state.

The Semantic Interpreter now retains existing target scope/count in its bounded context, so a later user revision cannot silently erase that classification. Its party transport contract has additional controlled cases for enumerated participants, explicit count correction, open groups, unknown extra attendees and a generic dated romantic recommendation; these tests prove the Proposal → Compiler → Draft path preserves a declared count and never adds one downstream. They do not claim that an external model will infer natural language correctly. The user-visible feedback recognizer accepts the bounded same-meaning phrase “These are too expensive” and Chinese/Japanese counterparts without converting it into a numeric budget.

`restaurant-semantic-prompt@16` now asks each emitted party count to label `EXPLICIT` or `INFERRED_CLOSED_PARTY`. The closed enum survives Proposal → Compiler → Draft and the existing semantic Event links it to the corresponding persisted user-message request ID. It is diagnostic-only: the Router continues to bind only the numeric `partySize`, and no Policy, source Evidence, availability action, or provider request consumes the origin. Legacy proposal records remain readable without fabricated provenance; clearing a count clears the diagnostic. The Web execution artifact exports the source without exposing raw user text or model reasoning.

The persistent Web composition also now has the exact shortfall path that was previously only covered by the Domain validator: discovery returns a–f but supplies grounded facts only for a; the controlled Agent selects the legal b/c/d fact read, then the existing Router, Reducer and HTTP projection present a/b/c. It asserts one discovery, one fact read, four model-boundary calls, no availability access, the met target, and no premature second discovery. This is a regression of composition behavior, not a new selection algorithm or a model-quality claim.

No Gold/Holdout, paid model, external source, booking or push occurred in this incremental offline change. The current loopback-enabled full suite is 436/436. Real-model scope classification, current Google results and Live continuation behavior remain separately authorized evidence gaps; original-researcher review remains pending.

## 2026-09-18 Continuous Restaurant selection session and Google pagination

Google Text Search is now a real query-bound pagination path: an initial discovery obtains at most two 20-item pages, deduplicates stable outlet IDs and retains the next cursor; page-two failure preserves accepted page-one candidates and its retry cursor. Details requests keep `nextPageToken` out of their field mask. A cursor mismatching the authoritative intent, repeating a token, or reaching exhaustion cannot be reused by a retrieval hint.

`PRESENT_RESULTS` is no longer a terminal Task lifecycle state. The durable selection session records delivery, viewing, shortlist and qualitative feedback independently of `checked`. A same-condition next batch first reuses three unshown grounded candidates without a model/source/browser read. If that queue is inadequate it enters the existing single Agent loop with a three-candidate, unshown-only target and its Router-bound cursor; no local ranker, second loop, fallback provider or direct booking path was added. “Too expensive” is recorded as feedback and never converted into a budget. Explicit semantic revisions still clear request-bound candidates and evidence while preserving shortlist IDs only as recheckable memory.

ADR-0027 supersedes ADR-0014’s terminal-result interpretation, and the Domain/Interface/Capability documentation now reflects the paused-session semantics. This is an offline implementation slice only: no Gold/Holdout changes, paid model, external source, booking, commit or push occurred. The next required evidence is a separately authorized bounded real source/model continuation run and original-researcher review.

## 2026-09-17 H001 semantic request ceiling 30 seconds and one Live retry

按用户明确要求把 `RestaurantSemanticInterpreter` 的单次请求从固定 10 秒改为导出的 30 秒契约常量；Live runner 仍以 `min(30 秒, 总截止剩余时间)`调用 Provider，未扩大五分钟总预算、模型／Google／浏览器额度、站点许可或副作用能力。现有语义 request-contract 断言覆盖该值，防止再次悄然落回 10 秒。

用户随后明确授权 H001 直接重跑一次。冻结新隔离副本后，`LOCAL_CHROMIUM` 实际走完整语义→发现→同候选身份→日期／人数控件→库存→呈现路径：一石三鸟得到 TableCheck 19:00／2人的新鲜可用证据，Inase 同条件为请求绑定无位，Jinnan 保留为控件未确认。没有把未查的其余七个候选或 Jinnan 的 UNKNOWN 说成无位，也未提交任何预约。独立 evaluator@16 对被呈现的一石三鸟给出 qualified YES；这只验证该次资料，未扩大为全站、全候选或长期库存承诺。

## 2026-09-17 H001 current-repair single Live attempt

按用户指令冻结当前脏工作树的最小 `src`／`web-skills`／运行配置副本；只在副本的 development case 将 H001 文案和语义日期表达改为 `tomorrow`，以 `h001-tomorrow` 单独运行。没有改变产品源码、Gold、Prompt、规则、权限或预约路径，也没有运行 H002–H005。运行器的当前外层 deadline 路径和既有 `LOCAL_CHROMIUM` 组合被实际调用，明确限制为 300 秒、30 模型、10 Google、每候选 50 次浏览器操作。

该次执行在 semantic 阶段停止：Interpreter 把首个 `restaurant_semantic_interpret` 请求固定为 10 秒，DeepSeek 记录 `TIMEOUT`，故尚未到达 Google、候选身份、TableCheck/Tabelog 入口、日期／人数控件或库存证据。启动时 Tokyo 已进入 9 月 18 日，正常的 `tomorrow` materialization 产生 9 月 19 日 19:00；这不是库存或用户条件被改写。原始 started/result/evaluator sidecar 均保留，未补跑；独立评价将 qualified 标为 UNKNOWN，除零次观察的谱系记账外无可评价执行结论。此记录只发现总预算与单请求 timeout 不一致的运行阻断，不能作为地址／入口修复已经在真实页面改善的声明。

## 2026-09-17 Independent identity rule regression matrix

按用户要求补强确定性匹配测试，没有继续修改 Terra 的生产规则。新增共享地址比较的三组参数化规则测试：同楼层语言/大小写/全半角/分隔符变化，楼层缺失与地址不足，明确楼层/门牌/邮编冲突；正反方向均检查，避免电话捷径掩盖地址比较结果。扩展既有 TableCheck 历史正常对照至七家，并省略来源电话、要求 `HIGH_NAME_AND_ADDRESS`；Tabelog 复用一条地址接入对照，两个平台的楼层冲突改为同电话反例。规则变体只在共享层维护，没有把矩阵复制到两个 Adapter 或新建评测框架。

使用隔离临时目录将新增矩阵分别运行在修复前 HEAD、按历史差异重建的仅大小写修复版本、当前实现：前两者均出现目标断言失败，当前通过。原始与当前结果分开保留；历史提取字段离线复核不冒充完整页面 Replay 或 Live。测试进入默认 npm test，无私有 Holdout、付费调用、外站访问、提交或推送。

## 2026-09-17 Afternoon H001 identity/entrance follow-up

Repaired the two independently reproduced H001 regressions without changing H002/H003/H005 or provider fallback strategy. Shared address comparison now removes unit text after the same case normalization used for unit extraction, so the source-observed Japanese `地下1階` and Latin `B1F` spellings do not leave a false street number. Explicit distinct floors remain a conflict and an omitted floor remains non-conflicting. Both TableCheck and Tabelog exercise the same helper through their production resolvers.

TableCheck now validates each available Google link field independently before choosing a public same-origin merchant entry. A real Maps URI or an invalid custom lead can no longer preempt a valid Google website URI pointing to TableCheck. The fixed-source transport was corrected to model Google Maps and website fields separately, rather than putting a TableCheck URL in `googleMapsUri`. No provider, global cache, retry loop, permission, model, Live source call or external write was added.

Independent follow-up caught that the initial case-only fix still left Japanese `1階`/`2階` in the street-number comparison because an ASCII word boundary after `階` did not hold. The shared unit pattern now drives both token extraction and removal, with a Unicode delimiter/end constraint for the Japanese suffix. The same historical batch confirms Inase, Hajime, Teppen and Sushi Labo as complete matches while basement-versus-ground and B1F-versus-1F remain conflicts.

## DEV-2026-09-17-H001-H005-SINGLE-ROOT-FACT-JUDGMENT

按用户明确授权，先冻结当前代码和H001–H005原始请求后，逐例各执行一次5分钟/50模型/50 Google/每候选50浏览器动作上限的Hybrid Live Read-only；原始artifact与evaluator@15 sidecar均新建而未覆盖历史。H001为`NO_VERIFIED_RESULT`，H002因缺party size补问，H003/H005到时限取消，H004展示事实型推荐。没有预约、登录、外部写、Gold/Holdout改动或第二浏览器循环。

以实际轨迹选择且只修一项根因：`ModelRestaurantFactJudgment`此前仅为NEGATIVE HARD调用，导致已有同候选、HIGH identity的具体`bar`/`lounge bar`来源类型无法成为正向`good for drinks`的可审计判断，复杂正向条件只能未证实。Fact Judgment Prompt@1→@2；同一受限模型现在可为POSITIVE HARD生成`verifiedHardCriteria`，但必须引用同候选具体来源类型事实。无引文、正向`CONFLICT`和宽泛类型一律不接纳；它不是主观排名、官网替身或状态写入，也没有改变人数推断、预算表示或HARD/SOFT策略。

局部固定资料红绿回归、相关Hybrid组合、typecheck、arch和完整本机371/371通过。单次H003后测未到达新增路径：本次语义把`good for drinks`和team dinner都判SOFT，Agent直接空位读取，TableCheck的`REQUEST_SELECTION_UNCONFIRMED`与Tabelog`BROWSER_TIMEOUT`导致`EXECUTION_FAILURE`。故不以本地测试替代真实链路、不触发五例修复后回归，也不修第二个根因；详细模式、额度、artifact和限制记于TEST-LOG。

## DEV-2026-09-16-BROWSER-READ-FINAL

按用户继续完成 P0–P4 的授权，完成 Tabelog 来源库存/分店绑定、TableCheck 非标准下拉与范围内 TIME、当前请求禁用时段核验、跨页商业事实与来源笔记、两店比较/修订和新商户验证。未新增生产框架或第二浏览器循环。真实轨迹推动修复限定商户调查扩展、Web 新任务竞态、搜索候选误入结果卡及库存过期展示；过期定时重绘不追加网络请求。导出保留由事件编译出的替代许可，独立 evaluator/rubric@15 修复地区前缀与许可窗口误判，新增未授权/扩大许可及错误地区反例；旧 execution/evaluation 保留。最终真实两轮结果、所有失败、源码快照、限制与清理见[最终复核](BROWSER-AGENT-FINAL-REVIEW-2026-09-16.md)。无 commit/push 或预约提交，未改用户原有工作区成果。

## DEV-2026-09-16-WORKFLOW-CONVERGENCE

按用户对H001–H005长期反复的复盘，将切片承诺、最小来源探针、早期审查、冻结验收和偏离主动提醒写入Planning；AGENTS只增加入口，Test维护故障定位与复验范围，Post-change要求按原承诺交付。提醒不新增例行审批，不要求正式前端提前开发，不改变产品目标或Live授权。仅工作规程变化，无业务代码、能力声明或STATUS变更。

## DEV-2026-09-16-BROWSER-AGENT-P1-P2-CURRENT-OFFLINE

- Continued the existing P1/P2 chain after the latest review repair without restoring the revoked broad GET permission. Browser controls now retain accessibility-facing slider display text separately from numeric positions; the existing production Executor fixture validates a two-ended JPY range, lower-bound-only explicit fixture permission, target modal scrolling and page-applied result feedback.
- Context moved `restaurant_agent_context@6`→`@7` and Agent prompt@12→`@13`. Current candidate commercial notes carry a fact field, display value and evidence provider only; raw URL/evidence/source-entity internals and superseded same-source facts stay outside the model. A real Agent transport regression confirms the model boundary receives only that compact projection.
- A reducer regression begins from `CANDIDATE_FACTS_REFRESH_REQUESTED` and proves a new website fact bundle supersedes only the stale same-source record: cancellation and course price update, while the old no-show and any omitted facts remain unknown. Updated trajectory persistence/harness schema assertions with the intentional Context version change.
- Commands: typecheck; affected 28/28; authorized local Chromium 13/13; arch check; build; full authorized loopback `npm test` 356/356. The first complete run identified two stale v6 test expectations, then the rerun passed. No paid model, real source, Gold/Holdout, booking/write, commit or push. P1/P2 still lack positive real-site control contracts and original-researcher independent review; P3/B13/B14 remain pending. Exact status and minimum observation scope are in the [delivery addendum](BROWSER-AGENT-RESTAURANT-P0-P4-DELIVERY-2026-09-16.md).

## DEV-2026-09-16-H004-EVALUATOR

2026-09-16 H004评分器误判已局部修复：diagnostic-evaluator/rubric@14将SOFT措辞语义复核与实际来源观察适用性分开，适用于展示和无结果调查记录；不放宽门店、日期、时间、人数、HARD或证据新鲜度检查。原始H004 artifact离线重评：REQUIRED_EVIDENCE从NOT_SATISFIED变为SATISFIED，AUTHORITATIVE_CONDITIONS仍NOT_EVALUATED，FINAL_CLAIM和整体结果由失败变为待复核（qualified UNKNOWN），不宣称自动2/5成功；原始执行和@13评价未覆盖，SHA核对一致。评分器42/42定向测试及arch通过；首次全仓检查受并发agent-decision.ts语法错误阻断，该错误随后消失；最终typecheck/build通过，npm test为354/356，剩余2项为并发Agent Context版本升至7但Harness/PGlite断言仍期望6，本轮未修改这些文件。未调用模型或来源Live。

执行观察与无结果调查不再以SOFT文本不同作为无效条件；语义待复核仍进入最终结论，不自动同义判定。复用已有测试，新增断言先复现失败再修复。

[报告](../../.eval-artifacts/h004-evaluator-fix-2026-09-16/REPORT.md)。

## DEV-2026-09-16-TIME-SEMANTICS

用户授权仅修两个时间点并重跑20条。EVENING新增为可校验daypart，显式映射取代非AFTER_WORK默认为下午；窗口由代码唯一物化、保留原文和basis。Proposal envelope/预算/人数/强弱设计不变，prompt@12、temporal-policy@3。H003时间-only预期同步dataset@4，旧Gold与历史证据保留。复用既有回归文件，保留其他工作区浏览器改动。2026-09-16 时间语义局部修订完成：prompt@12增加EVENING，evening/night由代码temporal-policy@3按同日18:00–23:00物化；after work保持17:30–22:00且不再自动生成criterion。预算、人数和HARD/SOFT规则不变。当前开发dataset@4仅移除H003重复after work条件。离线352/352、固定semantic fixture15/15及typecheck/arch/build通过。原20条真实模型复测20/20结构合法、20调用、24694ms、107909 tokens；Q03/05/06晚间、Q02/15/16时间-only验收通过，Q01/17/18原时间行为保持。范围外仍有波动：Q06本次first date补出2人，Q02team dinner仍SOFT，Q10新增target；不声称全语义正确或长期稳定。旧快照与本轮之间还有预先存在的备选时间prompt/schema变化，故非严格隔离A/B。没有餐厅来源Live或预约写操作。

## DEV-2026-09-16-BROWSER-AGENT-P0-P4 — shared observation/action offline slice

- 按 Browser Agent P0–P4 计划先保留已有脏工作树，不 reset/stash/commit/push；Stagehand 4.1.0 的小探针结论为不采用。其观察候选需要独立环境/会话，不能作为现有 Executor 的规划器或平行执行循环，未新增依赖。
- 共享 `BrowserTaskExecutor` / `ModelGateway` strict wire 升为 `browser_read_action@2`。在已有 opaque control registry、单 session、来源 allowlist、权威日期/人数、取消及预算边界内，增加 checkbox 明确设值、range 单键步进、observed region 有界滚动及 modal 背景 target 排除；动作后重新读 control state，避免 URL/文本不变时错误等待。没有给模型 selector、URL、脚本、State、证据写入或提交能力。
- Local 与 Cloudflare runtime 复用同一 registry 引用解析，Playwright observation 补 `selected` options、checked/range/scroll state。真实 Chromium fixture 覆盖语言 modal、selected≠options、checkbox/range/scroll；站点 Skill 同步为只读控制提示。P2 使用当前已存在的 Router/Domain/Evidence/Web/Harness 离线组合回归，未创建独立 demo 或旁路。
- P3 未获新的真实模型/Live授权，未运行私有Holdout、新商户或真实来源；P4 只完成交付材料，原研究者独立 Review 未执行。完整 B1–B14 状态和未覆盖范围见 [交付记录](BROWSER-AGENT-RESTAURANT-P0-P4-DELIVERY-2026-09-16.md)。

## DEV-2026-09-16-SEMANTIC-PROMPT-11 — clarity revision, quality gate incomplete

- 用户要求先看/改prompt再测；依据ADR0009/0026保留开放criteria及既有语义职责。prompt@10→@11，schema@3/5000预算不变；合并TARGET、明确封闭人数推断例外、解释必要活动能力与体验偏好、约束可选修饰范围、近似预算不得变硬上限，以及singletonNEGATE无value的现有Contract。
- 不写入已暴露案例原文、Gold或固定“特征→强度”答案；不改Compiler/Reducer、Prompt外业务规则、Adapter或Evaluator。已有请求契约测试迁移prompt版本，未新增prompt文案镜像测试。更新当前Eval文档标识，历史artifact不动。
- 实际10条语义模型诊断仍有drinks/team dinner强度、after-work独立criterion、near关系及无约束误提取偏差；当前版本是开发实现，不宣称完整语义验收。离线和逐例真实模型证据见同日TEST-LOG/STATUS及semantic-prompt-11报告。未提交/推送。

## DEV-2026-09-16-SEMANTIC-OUTPUT-BUDGET — per-call cap5000

- 按用户明确要求，将Semantic Interpreter单次maxOutputTokens由500提升到5000，解决H003与H001复杂变体已观察到的length截断。它是输出上限，不是输入或会话累计限制；不改变prompt@10、schema@3、模型、temperature、thinking、timeout或重试。
- 导出一个预算常量供实际模型请求和现有semantic Eval manifest共用，避免manifest仍记录500。复用既有Interpreter请求契约测试新增5000断言；原实现红色500!==5000，修改后完整Mock通过。未新增测试套件、兼容路径、模型调用策略或业务抽象。
- 原始H001、复杂变体输入/Gold及500-token原始结果保持不变；独立冻结副本进行单次同输入Live复验，结果与未验证范围见本日TEST-LOG及STATUS。未读取/运行私有Holdout，未提交/推送。

## DEV-2026-09-15-LIVE-OBSERVED-CONTROL-REPAIR — browser input wiring

- 用户在Mock通过后授权Live read验证。首轮原始H003已调查10候选并正常END_READ，但3个TableCheck候选的真实模型人数选择都把`dom:`引用传给CSS解析器，导致`REQUEST_SELECTION_UNCONFIRMED`。另有独立语义条件降级及官网身份支持缺口，不能把全部失败归因网站访问。
- 当前局部切片只修Local与Cloudflare session的fill/select，复用click已使用的Playwright控件注册表。真实BrowserTaskExecutor仍持有权威参数、只读动作验证及动作后观察；没有改Prompt、Gold、来源顺序、预算或外部写权限。
- 既有Chromium Harness扩展同一参数化场景覆盖两种session：模型传输和网络固定，实际DOM必须显示正确日期及人数。修复前5通过/2失败，修复后7/7；完整Mock343/343及typecheck、arch:check、build通过。Cloudflare只验证session代码在本地Chromium的行为，未调用Cloudflare服务。
- 保留首轮Live、运行前后patch/hash和独立Evaluator @13产物；同请求同预算仅追加一次修复后Live。结果与剩余限制见同日TEST-LOG。没有提交或推送。

## DEV-2026-09-15-TERRA-REVIEW-REPAIR — current offline implementation

- 用户要求修复a093764审查问题并先验证Mock。当前纵向切片为“原始请求→真实内部/来源组合→刷新或完成→独立诊断”，沿用ADR-0022/0025/0026，不新增模型、网络调用、重试、平台或执行权限。
- 复合Google→官网fact check保留各来源尝试（包括UNKNOWN）；Reducer在同请求内累计`supersededEvidenceIds`，显式刷新也废弃前次复合check中本次未重新证实的原始事实。原始readEvidence不改写。展示与Context复用`restaurantCurrentFactEvidence`，派生判断的全部原始支持引用都必须仍有效且关联HIGH身份。
- Evaluator/rubric升至@13：只从真实有序来源轨迹核验旧事实是否被后续同来源读取或显式刷新替代；已执行但来源失败的fact read可失效旧支持，不能产出正向证据。未调用生产资格函数，也未改变一般无结果调查充分性未评估的边界。
- H001–H005原文与Gold未改；替换旧测试自定义Adapter ports为实际Google客户端/搜索、官网组合和LiveBrowserAvailability/Resolver，仅Mock传输和页面。补上先前模型替身遗漏的SOFT条件，逐例调用独立Evaluator；这里是替身完整性修正，不是模型质量提升。实际来源组合揭露的空位展示缺Google fact identity引用已一并修复。
- 外部读取组合接入可注入clock以固定离线观察时刻；生产默认时钟不变。两条既有Hybrid主测试新增/参数化为官网失败、Google先失败、关门刷新反例；原H001–H005测试原地替换，未新建第二套产品执行器。
- Mock与验证结果见同日TEST-LOG。未提交、推送、Live或外部写入。


## 2026-09-15 — DEV-2026-09-15-CONCRETE-VISIT-READ-CLOSURE

- 当前切片：以 [ADR-0026](../decisions/0026-concrete-visit-goal-and-reception-semantics.md) 收敛具体到访的用户承诺、行动参数边界、库存/接待方式证据和只读调查闭环。验收是当前 H001–H005 原文经实际 Hybrid composition 走完整内部路径并接受独立诊断；模型传输、HTTP 与浏览器页面固定为离线替身，未给生产代码增加 case-ID 分支或成功回退。
- H001/H002/H003/H005 现在交付 `AVAILABILITY`，H004 为 `RECOMMENDATION`。H002记录封闭 first-date 情境的两人推断依据；H003保留 “after work” 原文并仅以代码物化 17:30–22:00 的宽查询窗。候选发现仅要求地点；缺人数的空位请求在重读取前补问，行动 Validator 不再把交付目标误当作每个 discovery 动作的必需参数。
- 接待方式与库存独立建模：仅明确来源页面证据可授予 walk-in/both；没有预约入口不能推导 walk-in；同候选、同日期、同人数的当前明确无 slot 才能形成 `UNAVAILABLE`。刷新已展示 slot 会重新读取 slot，失败不会恢复旧成功。
- Context 升至 `restaurant-agent-context@6`，为模型提供有界候选事实/缺口、来源尝试、库存/接待摘要与代码派生合法动作；Resolver、Reducer 和 Assessment 保留局部观察。通用 Browser Agent 的模型驱动回退继续是既有路径，未新增站点专用完成捷径、Provider、重试或写路径。
- 诊断器升至 `restaurant-hybrid-read-diagnostic-evaluator@12`：接受 Router 的 `TERMINAL` 已执行观察，并独立核验 END_READ lineage 与空 slot 的候选/日期/人数/负库存证据；产物评价没有复用生产端成功判断。完整离线验证、环境限制和未覆盖范围见同日的新 TEST-LOG 条目。

## 2026-09-15 — DEV-2026-09-15-READ-ACCEPTANCE-ALIGNMENT (superseded in part by the concrete-visit closure above)

- 当前切片：统一已接受ADR-0020/0024的用户承诺与H001–H005当前标注，不替换浏览器、不调整产品Prompt、不修其他harness行为。验收为原文保留、当前Runner只读新口径、真实loader/materializer/evaluator字段对照及反例通过。
- 原始五条content逐条保留；旧YAML/Rubric按字节归档。新`restaurant-read-development@2`仅保留semantic参数预期与人工验收说明，删除重复必用工具、人数/时间和空位要求；归档Rubric未伪称接入评分。H001/H003改正为推荐，H002去掉强制推定人数并收窄到原文排除，H003保留after work而不编造钟点，H005修正示例东京时间。
- Runner迁移当前cases路径并记录版本/哈希/暴露状态；materializer只更新预期，不重写用户消息里的日期/时间。产品、Domain与Eval入口同步；未把Gold、验收说明或案例排除词表注入模型。
- 旧成功Artifact不重写、不按新目标重命名为通过。END_READ评分、负向证据、resolver部分事实与Context/行动收敛仍待修复；无Live、付费调用、提交或推送。

## 2026-09-15 — Shared read-execution repair after combinatorial defense

- 用户审查指出组合oracle、Evaluator lineage和变异名称三处盲点后，先修测试：候选守恒由独立来源样本/显式Google ID判定；Evaluator `@11`只接受同候选、适用请求的`EXECUTED` observation所产出的引用证据，但允许search直接产生足够的事实推荐证据；M02恢复为真正的跨批prior-check丢失变异，M03–M05按实际破坏重新命名/构造。
- 随后只修防线捕获的共享执行缺陷：语义事件按State版本获得唯一id；Reducer累计不同事实批次；Google耗尽时停止判断同时检查合法facts和availability动作；Google→官网混合批次保留每个候选的来源范围；slot UNKNOWN保留已观察的HIGH identity/restaurant fact，仍不生成availability evidence或Offer。
- 未增加来源fallback、模型调用、重试、外部写路径、Prompt或H001–H005输入。所有红色默认回归在既有入口转绿；真实模型/网站/Live范围继续未验收。

## 2026-09-15 — Five-contract combinatorial regression defense

- 仅扩展既有Hybrid真实组合入口与diagnostic evaluator：保留Interpreter、Compiler、Runtime、Context、Validator、Router及Grounding，只替换离线模型传输、HTTP与浏览器页面。未修改业务执行、Prompt、H001–H005输入或生产来源Adapter。
- 为需求保真、状态累计、证据归属、行动可达、完成/停止分别接入独立期望：确定性边界覆盖零/一/整批/跨批、正反序、成功/冲突/UNKNOWN/失败、刷新、取消、请求更新和来源额度耗尽；固定种子`0x5eedc0de`生成八个有界场景，并把首个失败缩到两候选、逐个读取。
- 在`/tmp/praxis-contract-mutant-*`隔离副本运行源码变异，且先验证原始对照通过；Evaluator对公开合成artifact的M03–M08从`structuredClone`产生，不改写历史artifact。初始防线发现了取消后语义更新被固定event id去重及多项共享执行缺陷；其修复与最终门禁记录在本条上方的同日后续切片。

## 2026-09-12 — Web read execution completion and independent artifact wiring

- 以`fd0dfb0`冻结复现为先，修正`GENERIC_BROWSER`读取在取消/deadline时创建却未参与await的reject promise：现在浏览器分支只等待Provider收束，Router仍传递AbortSignal、清理deadline和父级listener，并保留`BROWSER_RUNTIME_FAILED`/`BROWSER_TIMEOUT`归因；没有全局吞错、重试或无限等待。
- Agent loop在每次已持久化State transition后通知拥有该读取的Application，Web SSE因此获得后台调查进度。用户编辑保留版本保护：落后于当前版本但其间只有Agent/Adapter推进时，取消旧读取后按最新权威版本应用；存在中间`USER`事件或客户端未来版本仍返回`StaleTaskVersionError`。旧读取需完成取消才会应用新语义，晚到结果不能覆盖新条件。
- 事实推荐的展示引用改为当前`factChecks`所列事实和每一来源事实匹配的HIGH identity；派生判断必须经其候选绑定的原始支持事实取identity。历史`RESTAURANT_FACT`没有删除，只不再作为当前展示依据。诊断器同步以目标而非人数判定：未指定日期/时间的推荐不要求营业或availability，指定访问时段的推荐仍需要适用营业事实，availability目标仍需要日期、人数和slot。
- 普通Web复用现有diagnostic run/evaluator格式，而非另建评分平台：读取结束后保存不含原始消息/DOM的`WEB_READ` artifact（最终snapshot、trajectory、来源尝试、展示引用、停止及可得资源）；以单独sidecar补评。缺少成本或browser-model计数标为`UNKNOWN`，Eval写入失败不会影响读取结果。没有改Provider、增加网站fallback、读取Secret、运行Live或外部写路径。

## 2026-09-05 — Repository review findings consolidated into a draft improvement plan

- 按用户要求，将AGENTS、项目Skills、文档、配置、浏览器诊断和局部源码职责的Review合并为[Repository Improvement Plan](../REPOSITORY-IMPROVEMENT-PLAN.md)，标记为`draft / not integrated`。
- 清单包含14项工作，按先修正文档与规则、随下一浏览器切片落实、按实际需要重构排序，并列出文件范围、验收和停止条件。
- 排除人工标注数据、Golden Set、私有Holdout与已有测试artifact；前轮涉及移动标注输入的建议明确留待专项范围，不在本次实施。
- 本次只整理清单、添加INDEX入口和本条记录，不实施清单中的整改，不改变Accepted ADR、代码、当前能力或现有未提交实现。

## 2026-09-04 — Eval-only Tabelog explicit human challenge resume experiment

### Why

H001的LOCAL_CHROMIUM可建立浏览器，但Tabelog在读取搜索页前显示`Just a moment...`。需要先验证“用户主动完成网站要求后，Praxis能否保持同一Browser Session/Page并继续只读Grounding”，而不是加入stealth、CAPTCHA自动化或产品接管UI。

### Changes

- `PRAXIS_LOCAL_CHROMIUM_INTERACTIVE=1`使显式`LOCAL_CHROMIUM`使用headed Playwright `launchPersistentContext`和gitignored `.eval-artifacts/local-chromium-profile`；正常结束只关闭page/context，不自动删除profile，也从不读取用户既有Chrome profile。
- `PRAXIS_EVAL_ALLOW_TABELOG_MANUAL_INTERVENTION=1`才启用Tabelog的脱敏`USER_INTERVENTION_REQUIRED` pause。它保留candidate、请求日期/时段/人数、provider、session metadata和当前安全URL/title；终端只等待用户回车，adapter随后只对同一page做一次snapshot。它不导航、不自动重试、不接收cookie/token/HTML，也不提供CAPTCHA操作能力。
- challenge仍在时保持`BOT_CHALLENGE`；challenge解除后仍走既有search/detail identity、高置信度同Outlet和slot-level availability路径。Hybrid runner仅在这两个eval门禁同时开启时移除本次Browser read deadline，并将协调器时间留给明确的人工暂停；默认Local/Cloudflare行为不变。

### Result

一次且仅一次headed persistent H001启动命令在Semantic Interpreter返回`MODEL_FAILURE`后、任何Google/Browser/Tabelog请求前退出。没有生成新live artifact，也没有进入`USER_INTERVENTION_REQUIRED`；因此真实同会话恢复尚未证明。没有Authorization、Booking、付款、取消、PII提交或其他外部写操作。

## 2026-09-04 — H001 TableCheck→Tabelog read-only availability source chain

### Why

Tabelog的反爬挑战不能成为H001唯一Availability来源；同一`CHECK_AVAILABILITY`需要在不扩大Agent权限或放宽同门店证明的前提下，确定性尝试另一个真实预约来源。

### Changes

- 新增Restaurant-only `RestaurantAvailabilityProvider`和固定`AvailabilitySourceResolver`，只接受两个当前真实使用者：TableCheck先行、Tabelog后备。Agent action、Decision Context和HARD Validator均不包含provider名称；resolver把来源尝试仅保存在execution metadata。
- 新增只读TableCheck Browser Adapter：由候选名生成受限的公开guide URL hint，以JSON-LD/DOM/tel link同Google exact phone或name+full address建立HIGH Outlet，之后仅访问带`start_date`和`pax`的公开reservation GET页，读取明确bookable slot。没有登录、个人信息、支付、确认或预约提交。
- 所有来源共用原有Grounding不变量。一个provider的challenge、403/页面不可用、runtime或解析失败会继续后备来源；所有来源均不能得出安全结论时，候选为`AVAILABILITY_SOURCES_EXHAUSTED`。新增TableCheck 403归因，避免把公共错误页解析为餐厅或`ENTITY_MATCH_UNCERTAIN`。

### Live observation

只运行一次LOCAL_CHROMIUM H001（`2026-09-04T08-32-54-786Z-h001.json`）：Google Discovery成功，三个候选的TableCheck guide URL均返回`403 Forbidden`，Tabelog三个搜索页均为`Just a moment...` challenge。resolver每个候选都先记录TableCheck provider failure、再记录Tabelog `BOT_CHALLENGE`，最终安全`AVAILABILITY_SOURCES_EXHAUSTED`；未获得HIGH identity、slot、availability或`PRESENT_RESULTS`。

### Boundary

没有新增动态registry、LLM provider选择、挑战绕过、Google Discovery变化、booking、Authorization、支付、个人信息输入或任何外部写入。

## 2026-09-04 — H001 Tabelog identity diagnostics and challenge attribution

### Why

LOCAL_CHROMIUM H001 reported `ENTITY_MATCH_UNCERTAIN`, but its artifact retained neither the selected search result/detail identity chain nor the field-by-field comparison needed to distinguish parser, normalization, wrong-branch and source-access failures.

### Changes

- Added an eval-only identity diagnostic sink around the existing Tabelog read adapter. It records sanitized search title/URL, selected result and requested/final/canonical detail URLs, extracted name/address/phone and their JSON-LD/DOM/tel-link provenance, normalized values, field comparisons and the resolver's HIGH/non-HIGH reason. It does not enter Restaurant Domain evidence or Agent decision context.
- Parser extraction retains field provenance and canonical URL without retaining raw HTML. Diagnostic URLs strip untrusted query parameters other than the search term, so transient challenge tokens are not written to subsequent artifacts.
- Recognize Tabelog's `Just a moment...` challenge at search/detail acquisition and return fail-closed `BOT_CHALLENGE` before the identity gate. Grounding now preserves that stable failure reason instead of misattributing a browser-visible challenge as `ENTITY_MATCH_UNCERTAIN`.

### Live observation

Exactly one `LOCAL_CHROMIUM` H001 run produced `2026-09-04T08-00-55-386Z-h001.json`. Google discovery returned three candidates and their national phone numbers, but every Tabelog search page was `Just a moment...`; parsed result count, inspected result count and detail-page count were all zero. Therefore no Tabelog phone, address, JSON-LD, canonical detail page, branch choice or Google↔Tabelog field comparison was available. The blocker is source anti-bot access before identity acquisition, not a reason to relax HIGH matching or expand Google fields.

### Boundary

No identity threshold, Google FieldMask, availability parsing, H001 HARD constraint, browser-provider behavior or write path was weakened or broadened. The run made only read-only Google/Tabelog requests and performed no Authorization, booking, payment, cancellation or PII submission.

## 2026-09-04 — Local Playwright Chromium H001 eval backend

### Why

Cloudflare Quick Action和独立CDP probe可用，但Hybrid H001的多次Browser Session可能遭遇瞬时429/容量失败；需要在不移除远端Runtime、也不改变Tabelog业务边界的前提下，隔离本地浏览器与页面解析问题。

### Changes

- 增加`LocalPlaywrightChromium`，以headless local Playwright Chromium实现既有`BrowserRuntime` / `BrowserSession`的navigate、snapshot、click、fill、select、wait和screenshot接口，并在close时关闭page、context和browser。它不持有或读取Cloudflare凭证。
- `browserRuntimeFromEnvironment`仅在`PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM`时选择本地Runtime；`AUTO`、`KITESURF`和`CHROMIUM`继续直接使用现有Cloudflare Runtime和AUTO fallback语义。Hybrid runner保持已有live-read gates；本地模式不再要求Cloudflare账号或token。
- 本地browser binary缺失、launch和页面操作均映射到既有fail-closed `BROWSER_RUNTIME_FAILED`；不静默回退Cloudflare。无Tabelog identity/availability、HARD constraint、步数预算或写路径变动。

### Local probe

首次probe发现browser binary缺失，安装项目现有`playwright-core`对应Chromium后暴露Local Runtime把`chromium.launch`作为裸函数调用而丢失`BrowserType`绑定的问题。修复为通过BrowserType对象调用后，isolated `example.com` probe成功。随后仅运行一次`LOCAL_CHROMIUM` H001：Google Discovery成功，本地浏览器实际读取Tabelog约6.3秒，三家候选仍真实`ENTITY_MATCH_UNCERTAIN`，未进入`PRESENT_RESULTS`。没有Cloudflare访问或任何外部写操作。

## 2026-09-04 — H001 browser failure attribution and terminal read handling

### Why

历史H001 Artifact把三个`ENTITY_MATCH_UNCERTAIN`当作Google→Tabelog身份问题；但Artifact没有任何Tabelog search/detail/JSON-LD/browser metadata，availability read约1ms完成。独立只读复现确认Cloudflare Browser Run在建立会话前失败，低置信度占位identity被Grounding优先映射，掩盖了真正的浏览器基础设施故障。

### Changes

- Grounding优先保留`EXTRACTION_FAILED + BROWSER_RUNTIME_FAILED/BROWSER_TIMEOUT`的稳定原因码；真正未能核实的门店仍保持`ENTITY_MATCH_UNCERTAIN`，没有降低HIGH门槛或接受name-only。
- Tabelog adapter在所有本次候选共享同一失败码时写入安全的read metadata；Router仅对“所有请求候选均同一浏览器启动失败”标记terminal Provider failure。Loop持久化`AGENT_LOOP_TERMINATED(EXECUTION_FAILURE)`并进入`FAILED`，不再把内部Provider故障交由Agent `ASK_USER`。
- 不修改Google FieldMask：三家原候选均已返回`nationalPhoneNumber`，阻塞在Tabelog页前，扩展字段无助于此失败。

### Live observation

按一次限制重跑H001后，Semantic和Agent决策继续成功，但Google Discovery两次在8秒deadline超时，第三次被搜索预算拒绝；没有Candidate、Browser session或Tabelog页面读取，Agent随后以`ASK_USER / WAITING_USER`停止。故本轮浏览器归因修复没有获得真实Tabelog identity/availability成功证明；当前单一阻塞是Google Discovery端到端超时。

## 2026-09-03 — H001 live-read identity, area and no-progress repair

### Why

首次真实H001已经排除DeepSeek Provider拒绝，但Google地址中的Shibuya未成为area evidence，Tabelog搜索页的相对门店链接没有被解析到可核验门店页，且Agent可重复执行同一availability read直至预算耗尽。

### Changes

- Google Text Search FieldMask增加结构化`addressComponents`；`near <area>`只在一个locality/sublocality/administrative address component精确匹配时成为`areaMatch:true`，Evidence同时保存匹配组件、类型和`GOOGLE_ADDRESS_COMPONENT`依据。格式化地址的词面命中不再作为地点证明。
- Tabelog搜索解析只接受可识别的restaurant-result anchor，并把相对链接正规化为Tabelog canonical URL；门店页从JSON-LD及地址/电话/tel/canonical markup补全identity。Resolver仍只接受exact phone或normalized name+address，电话号码冲突和歧义继续fail closed。
- `CHECK_AVAILABILITY`若包含当前权威search/schedule已有Check的候选，会在Action Validator中以`AVAILABILITY_ALREADY_CHECKED`拒绝；Prompt `restaurant-agent-decision-prompt@6`同时要求Agent仅检查未读候选或改用另一安全策略。没有提升步数或read预算，也未改变写路径。

### Live observation

本轮唯一一次H001 Live Read-only在进入候选Discovery前，两次Google Places read均被Router的8秒硬deadline终止；第三次被既有Google search预算拒绝，Agent随后`ASK_USER`并以`WAITING_USER`退出。没有获得Google候选或Tabelog页面观测，因此本轮不能声称身份、area或availability已在真实页面上成功；新的单一阻塞是Google Discovery的端到端超时。

## 2026-09-03 — H001 DeepSeek strict Agent transport repair

### Why

真实H001的Semantic调用成功，但首次`restaurant_agent_decide`被DeepSeek拒绝，且原有Artifact只保留稳定失败分类，无法诊断Provider非2xx细节。

### Changes

- 保持`restaurant_agent_action@3` canonical Schema和本地Action Validator不变；新增仅供DeepSeek Beta strict function transport使用的wire schema。其顶层关闭additional properties，且每个字段均写入`required`；不用的canonical可选字段以空字符串或空数组编码，并在Domain内严格恢复为canonical动作。
- Decision Prompt升为`restaurant-agent-decision-prompt@5`，明确wire占位字段不得承载其他动作的有效值。恢复后仍通过原有parser和Validator；字段错位或非空的无关字段继续fail closed。
- DeepSeek Gateway对非2xx安全保存HTTP status、provider request ID、error code/type与截断脱敏message；不保存API key、Authorization、原始Prompt、Completion或Response body。Hybrid artifact增加对应的安全`modelInvocations`记录。

### Evidence and boundary

DeepSeek官方Beta strict function规则要求每个object property都在`required`中且`additionalProperties:false`，并不支持string `minLength` / `maxLength`等约束；原canonical Action Schema仅`type`必填，因而最可能被Provider拒绝。Beta endpoint原已正确使用。此改动不触及Google、Cloudflare、Tabelog、HARD Grounding或`PRESENT_RESULTS`业务逻辑，也不添加任何写操作。

一次真实H001随后完成Semantic和6次`restaurant_agent_decide`（均HTTP 200），确认已越过原MODEL_FAILURE；之后Tabelog对三个Google候选均记录`ENTITY_MATCH_UNCERTAIN`，Agent重复同一availability action，最终`STEP_LIMIT / NEEDS_INPUT`。没有抵达`PRESENT_RESULTS`，也没有重跑。

## 2026-09-03 — H001 live read evidence completion

### Why

H001 needs one actual read-only terminal result, not a heuristic time extraction or a loop that merely stops after reading availability. Task-critical area, HARD criterion, exact outlet and requested availability facts must be independently grounded and fail closed.

### Changes

- Added ADR-0014 and advanced to `restaurant-state@10`, `restaurant-agent-action@3` and `restaurant-agent-decision-prompt@4`. `PRESENT_RESULTS` is a non-booking terminal action/state: the Agent may propose candidate IDs only; the Validator derives the required proof and the Runtime writes `RESULTS_PRESENTED`.
- Made Google Places Text Search use a Promise-race hard deadline across both fetch and response body parsing, including non-cooperative fetch implementations.
- Replaced broad Tabelog time scraping with explicit slot-control parsing after confirmed date and party selection. Ordinary opening-hours/prose time strings cannot create availability; bot challenges, uncertain selection, redirect, unsupported flow and extraction failures remain non-available.
- Enriched each candidate Tabelog page before resolution. A result is HIGH only for exact phone or normalized outlet name plus address; ambiguous branches fail closed. Availability grounding now records separate `ENTITY_MATCH`, `RESTAURANT_FACT` and `AVAILABILITY` evidence and only source-labelled hard-criterion text may add a candidate fact.
- Updated the H001 runner to validate Live configuration before a paid model call, persist an artifact on any executed run, and exit successfully only at terminal `PRESENT_RESULTS`.

### Boundary

No real provider, model or browser session was reached: the attempted H001 runner stopped at the required `PRAXIS_ALLOW_LIVE_RESTAURANT_READ=1` gate, and the current environment also lacks Google Places and Cloudflare credentials. No booking, payment, cancellation, PII submission or other external write path was added or run.

## 2026-08-20 — Live / Hybrid Restaurant read path implementation

### Why

The ADR-0013 Agent Loop needed its first real-read vertical slice without weakening the invariant that the Agent proposes business actions only, Grounding establishes facts, Runtime is the sole State writer, and no booking-related external write may occur.

### Changes

- Advanced the persistent Restaurant State to `restaurant-state@9`, appending immutable migration `0009-restaurant-live-read-trajectory`. The state records per-candidate availability status (`AVAILABLE` / `UNAVAILABLE` / `UNKNOWN` / `SOURCE_UNSUPPORTED`) and compact, normalized Read Evidence; an availability error can no longer be represented as unavailable.
- Advanced the Decision Context to `restaurant-agent-context@2`, Decision Prompt to `restaurant-agent-decision-prompt@3`, trajectory to `restaurant-agent-trajectory@5` and Harness artifact to `restaurant-harness-artifact@6`. Only stable business availability status/reason reaches the Agent; Provider, Browser, URL and raw source observations remain outside it. Generic-browser trajectory entries are traced as external Adapter work.
- Added a minimal Google Places API (New) Text Search client with an explicit FieldMask, authoritative-intent query construction, optional runner-supplied `NEAR_USER` location bias, bounded result count and structural Grounding. The implementation never promotes retrieval relevance into cuisine, price or availability facts.
- Added the first Browser Runtime boundary using Cloudflare Browser Run CDP with Kitesurf first and one Chromium fallback; it supports bounded navigate/snapshot/select operations, closes sessions on AbortSignal and stores only execution metadata. Added the bounded, read-only Tabelog executor with deterministic outlet resolution, no submit action, and fail-closed handling for bot challenges, uncertain entities, redirects, unsupported online flow and extraction failures.
- Added frozen-case materialization for relative Tokyo dates, an opt-in Browser compatibility probe, and an opt-in Hybrid runner. Every runner requires explicit environment gates, emits only Git-ignored local artifacts, records resolved location context when provided, has no Authorization, booking, payment, cancellation or personal-information submission path. The Hybrid runner imposes each-case limits of two Google searches, zero Place Details enrichments, three Browser/availability reads, five Tabelog matches and one runtime fallback. The repository E2E rubric remains `draft / not integrated`, so the runner explicitly records the absence of an executable agreed scorer.
- Preserved the user-added h004/h005 cases and made the source a valid multi-document YAML stream by adding document separators only. Updated current architecture, Domain, security, capability, roadmap and configuration documentation.

### Boundary

No real Provider, browser session, model call, reservation, payment, cancellation, PII submission, reset command, real PostgreSQL write or controlled external write was run. Real credentials and the two Live-read gates were absent; only source, Contract, Fixture, Mock and Embedded-postgres evidence exists.

## 2026-08-20 — ADR-0013 Agent Loop final hardening

### Why

Definitive `COMMIT_FAILED` and `BOOKING_ABSENT` already reached `SELECTION_REQUIRED`, but the completed mandatory command chain did not return control to the bounded Agent Loop. The previous Authorization also needed to be unusable for a recovery candidate. Trajectory lacked the exact sanitized context seen by the Agent, and `FIXTURE_STRUCTURED` incorrectly made execution mode part of a long-lived route taxonomy.

### Changes

- Added Accepted ADR-0013. ADR-0003 retains the single-logical-Agent boundary while its deterministic Restaurant next-action detail remains superseded by ADR-0010. ADR-0004 retains one Authorization per concrete proposal; its manual-reselection recovery detail is superseded by the Agent Loop recovery path. PRD source requirements were not rewritten.
- Added `resumeAfterMandatoryCommandChain` to the Restaurant application loop and invoked it from the current Fixture/Mock orchestrator after Policy/Commit/Verify finishes. It resumes only from `SELECTION_REQUIRED`; `OUTCOME_UNKNOWN`, terminal states and authorization checkpoints never auto-resume.
- Made each recovery `BOOK_RESERVATION` generate a fresh proposal ID and made the reducer reject an Authorization whose `proposalId` does not equal the current proposal. `COMMIT_FAILED` and `BOOKING_ABSENT` clear the prior proposal, Authorization and active attempt before recovery. The Harness proves both failure routes and old-Authorization rejection before Policy/Commit.
- Replaced `FIXTURE_STRUCTURED` with the long-lived `STRUCTURED_ADAPTER` route. Fixture/Mock/Live remain execution mode or provider metadata; `GENERIC_BROWSER` and `HUMAN_TAKEOVER` remain explicit future route boundaries only.
- Advanced trajectory to `restaurant-agent-trajectory@4` and Harness artifact to `restaurant-harness-artifact@5`. Appended immutable migration `0008-restaurant-agent-trajectory-decision-context` to store `context_schema_version` and sanitized `decision_context`; no previously published migration was changed. Each decision now records `Context → Action → Validation → Execution → Observation → State/Outcome` without raw prompt or chain-of-thought.
- Synchronized Status, Roadmap, architecture, Domain, security, interface, Harness and test sources of truth. Hybrid E2E preparation is now the next gate; a new semantic Clean Holdout remains independent parser/semantic quality work. `semantic conflict gating remains intentionally unchanged pending real Agent/E2E observation.`

### Boundary

No real provider, browser route, Human Takeover, real model call, Live Read-only, real Authorization, booking, payment, cancellation, reset command or controlled external write was run. `GENERIC_BROWSER` and `HUMAN_TAKEOVER` were documented as future taxonomy values only.

## 2026-08-20 — ADR-0012 migration integrity and Agent Loop hardening

### Why

ADR-0011曾原地改写已发布的`0006`迁移，使已有数据库的迁移历史不可复现；本机还可能残留无法由`restaurant-state@8`安全解释的`restaurant-state@7`开发Task。Agent仍收到过宽的完整State，Provider只读调用缺少强制deadline，BOOK step也不能稳定连接到后续Outcome。`hasEnough`的Discovery含义需要与Availability和Loop结束解耦。

### Changes

- 新增Accepted ADR-0012，并将工作线切换为`codex/adr-0012-migration-and-loop-hardening`。恢复`0006-restaurant-agent-trajectory`的原始`evidence_refs`定义，新增不可变的`0007-restaurant-agent-trajectory-causal-refs`：升级旧evidence引用、补充`causal_refs`与`proposal_id`，且兼容短暂存在的已因果化本机开发形态。
- 明确`restaurant-state@7`只属于开发期不兼容数据：绝不自动转换或启动时删除；仅在本机`DATABASE_URL`且显式设置`PRAXIS_ALLOW_DEV_RESTAURANT_STATE_RESET=1`时，才可用`npm run reset:dev:restaurant-state`删除对应Restaurant Task及其级联依赖。未执行任何重置；Pilot、staging和production禁止该命令。
- 新增`restaurant-agent-context@1`的Domain-owned投影，Decision Prompt升级为`restaurant-agent-decision-prompt@2`。模型只接收意图、缺失字段、显示安全的候选/Offer、选择和稳定失败码；Authorization、Proposal terms、原始Provider输出、Execution Result、Evidence与Reservation不进入模型输入。
- Execution Router为每次Provider read传递`AbortSignal`并强制8秒deadline；即使Adapter忽略中止，deadline race仍以可归因的Provider failure返回。`restaurant-agent-trajectory@3`的BOOK step持久化`proposalId`，Harness artifact升为`restaurant-harness-artifact@4`，可以显式连接Proposal、Authorization、Command、Attempt、Evidence与Outcome。
- 将`DomainSearchStrategy.hasEnough`限定为Discovery阶段的确定性检索预算阈值；它不代表Availability、Booking授权、Loop终止，也不阻止Agent在观察结果后提出下一次检索。

### Boundary

没有实现或执行真实Provider、Browser Agent、Human Takeover、真实PostgreSQL写入、真实Authorization、Booking、取消、支付、Replay、Live Read-only或Controlled Live-write。

## 2026-08-20 — ADR-0011 Restaurant Agent Loop control refinement

### Why

ADR-0010的首个Loop让不可信Agent输出重复权威Intent和预约时段字段，暴露了不可达的`COMPLETE`动作，并把Provider/Router问题混同为模型失败。其终止、`SELECTION_REQUIRED` lifecycle和trajectory的因果审计也不足以说明一次Agent step实际产生了什么。

### Changes

- 新增Accepted ADR-0011，并将当前工作线切换为`codex/adr-0011-restaurant-agent-loop-controls`。Action Contract升级为`restaurant-agent-action@2`：删除`COMPLETE`，Search只接收可选retrieval hint，Availability只接收candidate IDs；Router在执行前绑定权威Intent、日期、时段与人数。
- Restaurant State升级为`restaurant-state@8`，Agent trajectory升级为`restaurant-agent-trajectory@2`。每步保存Event、Command、Attempt和Evidence causal refs；Provider read、Router执行和模型决策失败分别记录为不同事件和trajectory outcome。
- timeout、step limit和rejection limit统一写入`AGENT_LOOP_TERMINATED`，形成明确`NEEDS_INPUT`状态及终止trajectory。`SELECTION_REQUIRED`改投影为`RUNNING`，并移除旧`SELECT_CANDIDATE` pending-user residue。
- 扩展Mock Harness：验证权威请求绑定、Provider失败不会被归因为模型、三类Loop终止、Agent恢复lifecycle与因果引用。Mock Adapter只增加受控读失败注入，不新增真实Provider或Browser路径。
- 同步Search架构中“开放式检索策略归Agent”、Execution架构中Structured Adapter / Generic Browser Agent / Human Takeover三条路线，并明确后二者仍未实现。同步README、状态、接口、Harness、命名约定和测试基线，删除README中的裸当前版本称谓。

### Boundary

没有实现Browser自动化、Live Provider、Replay、真实模型调用、Live Read-only、Authorization、Booking、支付、取消或Controlled Live-write。Generic Browser Agent和Human Takeover只更新为后续架构路线，当前实现仍是Fixture/Mock Structured Adapter。

## 2026-08-20 — Repository naming and version normalization

### Why

Branch names, architecture generations, State/Schema/Prompt versions and Eval datasets had accumulated on one global `Restaurant vN` axis. The same version number was being used as a branch archive, architecture label, directory name and file suffix, making it unclear what had actually changed and forcing ordinary work toward `v18` without a product release.

### Changes

- Added `docs/REPOSITORY-CONVENTIONS.md` as the sole naming/version Source of Truth. `AGENTS.md` now contains only the mandatory summary and reading step; Arch Guard remains limited to architecture, state authority, execution and safety boundaries.
- Renamed the local working branch from `codex/restaurant-decision-v18` to `codex/adr-0010-restaurant-agent-loop` and removed its stale upstream association. The existing remote branch was not changed or deleted.
- Reorganized Eval under `src/eval/restaurant/{semantic,agent-loop,search-fixture}` and `src/eval/shared`; moved semantic entry points into `semantic/runners`; replaced versioned directories, files with spaces and extensionless draft names; normalized npm Eval scripts to `eval:restaurant:<object>:<mode>`.
- Replaced current global version labels with object-owned identifiers such as `ADR-0010`, `restaurant-state@7`, `restaurant-semantic-proposal@3`, `restaurant-semantic-prompt@7`, `restaurant-semantic-holdout@2` and `restaurant-semantic-scorer@3`. Document headers now use `Document revision`.
- Renamed source responsibilities from Decision Kernel / orchestration terminology to Action Validator, Message Handler and Execution Router. Moved frozen Progressive Decision and categorized-Holdout documents into `docs/superseded/harness/` under responsibility-based filenames, while preserving ADRs, history and artifact identities.
- Clarified the mandatory repository lifecycle boundary in `AGENTS.md`: historical thinking, Eval plans, annotation guides, Golden/Regression sets, manifests, scoring contracts and run evidence are retained or archived with lifecycle/contamination labels; replaced executable code and duplicate paths are removed after callers and verification are updated, with Git history used for recovery.
- Added Brainstorming and Superseded archive indexes, and classified Eval paths as `current executable`, `current baseline input template`, `draft / not integrated`, `private / git-ignored` or `superseded retrospective`. Unintegrated Agent Loop and Semantic materials moved under explicit `drafts/` directories without changing their content.
- Removed three unused type imports and five ignored `.DS_Store` files. No historical Plan, Golden/Regression material, log, private Holdout source or executable Eval path was deleted.

### Boundary

This normalization does not change product behavior, Prompt text, Dataset content, provider integration or external side effects. Historical ADRs, logs, Git commits and artifact identifiers retain their original names for auditability.

## 2026-08-19 — Restaurant v18 Agent Loop

### Why

v17's deterministic next-step kernel coupled Discovery candidates to Availability offers and encoded retry/selection workflow in Runtime code. The next vertical slice needs one bounded Restaurant Agent to choose business actions while retaining deterministic State, authorization, side-effect and Outcome controls.

### Changes

- Added ADR-0010 and the `codex/restaurant-decision-v18` branch. Replaced deterministic next-step commands with a static six-action Restaurant capability catalog, ModelGateway-backed Agent Decision, deterministic Action Validator and bounded coordinator.
- Split `RestaurantCandidate` from `AvailabilityOffer`; Discovery and Availability are independent read-only routes. Agent selection of a candidate/offer creates only a deterministic booking proposal, after which the existing Policy, one-time Authorization, Commit, Verifier and `OUTCOME_UNKNOWN` protections remain authoritative.
- Added structured Agent trajectory storage (including state hashes, action, verdict, route and observation) for PostgreSQL and Mock artifacts. Removed the user candidate-selection endpoint and obsolete `AWAITING_SELECTION` path.
- Reworked Fixture/Mock Harness and local Workspace paths. New Harness scenarios prove second-search and unavailable-A-to-B availability strategy originate from Scripted Agent actions rather than deterministic fallback.

### Boundary

No Browser automation, Live Provider, Replay, real model request, Live Read-only, Authorization, booking, payment, cancellation or Controlled Live-write occurred. User-owned untracked evaluation directories were not read or modified.

## 2026-08-18 — Prompt v7 v5-slot / v6-criteria diagnostic

### Why

用户将当前Prompt定名为v7：时间、区域和人数指引保留v5文本，criteria边界保留v6文本。需要在不改变Gold、Contract、Schema、Scorer或Decision Kernel的前提下，对同一canonical exposed Gold进行一次可审计诊断。

### Changes

- 仅将当前组合Prompt版本从`v6`推进到`v7`，并将Prompt Contract断言与运行清单同步到当前正文；没有改写用户已经提供的Prompt段落。
- 已暴露Runner的前序artifact门禁改为只接受当前Prompt的直接前一版本；若其Dataset SHA不同，在任何模型请求前拒绝混合cohort。v7读取v6的`COMMON_UNCHANGED_TURNS`快照，因此继续排除没有可比快照的H007。

### Boundary

没有修改Gold、Proposal / Draft Schema、Contract、Compiler、Runtime/Reducer、Scorer、Decision Kernel或readiness policy；运行保持`EXPOSED_GOLD_ACCEPTANCE_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`，不是新的Clean Baseline。

## 2026-08-18 — Prompt v6 canonical-Gold acceptance diagnostic

### Why

用户明确将已暴露私有数据的当前Gold保留为canonical版本，并要求以Prompt v6运行一次接受诊断；此前的v4 Clean Baseline与v5 Regression使用不同的Gold版本，不能再做整集直接比较或被重新包装为Clean结果。

### Changes

- 将Restaurant Semantic Prompt更新为用户提供的v6文本；Proposal / Draft / Eval Schema `3`、Compiler、Runtime/Reducer、Decision Kernel、Scorer与readiness policy保持不变。
- 扩展已暴露Runner的最小版本谱系检查：current Gold与v4 SHA不同时，需要显式canonical确认及前一份已暴露Regression artifact；运行分类固定为`EXPOSED_GOLD_ACCEPTANCE_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。
- 比较器只保留`COMMON_UNCHANGED_TURNS`：以当前Gold和前一artifact Gold均相同的turn为集合，排除annotation-changed或无前序快照的turn；不生成v4/v5整集比较，也不覆盖任何既有artifact。

### Boundary

当前canonical Gold未被恢复或改写；没有创建或声称新的Clean Baseline。该次真实模型运行仅访问已暴露私有数据与DeepSeek结构化输出，不访问真实餐厅平台，也不产生Authorization、预约或其他业务外部写入。

## 2026-08-18 — Prompt v5 exposed-Holdout regression record

### Why

Prompt v4的唯一Clean Holdout结果已经暴露；用户要求在相同数据上做一次真实Prompt v5诊断，比较字段级变化和多轮能否越过原先首错，同时不得把该运行重新包装成Baseline。

### Changes

- 新增受控`eval:semantic:holdout:exposed-regression`：严格Preflight、核对Dataset SHA与不可变v4 artifact、固定完整25-turn调用上限，并以独立`EXPOSED_HOLDOUT_REGRESSION / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false` artifact持久化运行前代码快照、原始逐turn结果和模型指标。
- 比较器将v4的15个实际模型调用作为唯一同口径子集，另行报告v5全25 turn的覆盖，避免把上游阻断减少造成的样本变化误计为质量提升。
- 首次分析发现criteria文本不匹配会被重复计入polarity/strength的纯诊断错误；修复后新增回归测试，并由无模型调用的`field-analysis-v2` sidecar重新计算。原始模型结果和Baseline artifact均未改写。

### Boundary

未修改Gold、Prompt v5文本、Proposal / Draft Contract、Scorer、Compiler、Reducer、Decision Kernel或readiness policy。此运行只访问已暴露私有数据和DeepSeek结构化输出，不访问真实餐厅平台，也不产生Authorization、预约或其它业务外部写入。

## 2026-08-18 — Restaurant Semantic Prompt v5

### Why

The completed v4 Clean Holdout is `RESULT_EXPOSED` and cannot be rerun. The user supplied a revised general semantic-interpreter prompt that clarifies open criteria, semantic strength, time precision, closed-party inference, relative location preservation, and named-target handling without adding a Domain field or changing authority boundaries.

### Changes

- Replaced the Restaurant Semantic Interpreter system prompt with the user-supplied v5 text and advanced only the Prompt version from `v4` to `v5`.
- Kept Proposal / Draft / Eval Schema `3`, Restaurant State `6`, Scorer `3`, Compiler, Runtime/Reducer, Decision Kernel, Model transport, temperature, retries, and Provider behavior unchanged.
- Added focused prompt-contract assertions and synchronized current Status, Orchestration, Eval guidance, Holdout protocol, Eval README, and Roadmap: the v4 artifact remains historical and any v5 baseline requires a new unseen dataset.

### Boundary

No Gold, Prompt example drawn from private data, Scorer, Contract, public fixture content, real-model call, Holdout invocation, Discovery, Availability, authorization, or external write occurred.

## 2026-08-17 — v16 open Restaurant Criterion Contract

### Why

The v15 language boundary made the model classify a user expression as cuisine, hard constraint or soft preference before it could preserve it. That unstable ontology created avoidable ambiguity in Gold, prompt behavior and state accumulation, so annotation must not continue against that Contract.

### Changes

- Created ADR-0008 and the incompatible `codex/restaurant-decision-v16` line while retaining ADR-0007's Interpreter → Contract → Compiler → Runtime/Reducer → Kernel responsibility chain.
- Replaced the three classified arrays in Proposal, Patch, Draft and complete Intent with `criteria: RestaurantCriterion[]`, including explicit `text`, `polarity` and `strength`; bumped Proposal/Draft/Eval Schema to `2`, Restaurant State to `5`, Prompt to `v3` and Regression evaluator to `2`.
- Kept the Compiler deterministic: criteria add, replace or remove as a collection; state identity uses trim/case-insensitive text and exact polarity/strength. No search taxonomy, provider mapping, policy change or extra model call was introduced.
- Migrated the exposed seven-turn Regression and Fixture model double, Holdout preflight/template, deterministic scorer and annotation guide. The former v15 Holdout guide is historical; a new private v16 dataset is required.

### Boundary

No real DeepSeek, Clean Holdout, Discovery, Availability or external write ran. User-owned untracked annotation files were neither read nor changed. The earlier v15 real-model Smoke remains historical transport evidence only and cannot establish v16 quality or transport compatibility.

## 2026-08-17 — v15 strict transport and semantic-equivalence hardening

### Why

The first Clean Holdout must not be consumed by an unverified strict transport Schema. The current Proposal Schema contained unsupported string `minLength` constraints, while Eval treated unordered semantic collections and facts as ordered arrays. The Compiler also allowed a singleton clear and set in one turn to depend on model fact order.

### Changes

- Removed unsupported `minLength` constraints from the strict transport Schema. The existing local Domain validator remains the authority for non-blank strings.
- Made Eval compare Proposal facts, collection Patch values and Draft collections as deduplicated sorted semantic sets; singleton values and Decisions remain exact. Regression and Scorer share that comparison.
- Made a singleton `NEGATE` plus `ASSERT` or `CORRECT` in one Proposal a deterministic `CONTRADICTORY_PROPOSAL`, independent of facts array order.
- Removed the stale `nearby` Holdout exclusion and documented the required exposed Regression Smoke before a Clean Holdout when strict transport configuration changes.

### Boundary

No Proposal field, Prompt content/version, responsibility boundary, Kernel behavior, Holdout Gold or private annotation file changed. An explicitly authorized exposed Regression Smoke subsequently verified the repaired transport; no Clean Holdout, Discovery, Availability or external write ran.

## 2026-08-17 — v15 architecture cleanup and hardening

### Why

The frozen v15 responsibility chain was sound, but the implementation still sent only a Schema name/version to the model Provider, collapsed some Eval failure stages, persisted derivable readiness, allowed ambiguous collection operations, duplicated Fixture orchestration and mixed durable architecture rules with version-specific procedures.

### Changes

- Added a generic machine-readable Schema payload to `ModelRequest`. Restaurant owns the complete Proposal JSON Schema; DeepSeek translates it to a forced Beta strict-function transport envelope and never executes that envelope as a Tool. Local Domain validation remains mandatory and no free-text fallback was added.
- Added explicit Eval attribution levels. Exposed Regression uses Proposal/Patch development oracles to distinguish Interpreter, Compiler, Reducer and Kernel; Clean Holdout remains product-semantic and reports only final Draft/Decision precision.
- Removed stored `missingRequiredFields` from Restaurant Draft and complete Intent, fixed the regular Draft Validator to accept and validate `target`, and made Kernel/projections compute blocking fields from authoritative values.
- Defined collection operations deterministically: ASSERT adds, CORRECT replaces, NEGATE removes; collection CONFIRM is rejected. Singleton CONFIRM remains a no-state confirmation.
- Extracted Restaurant-specific message/read-command orchestration, injected Interpreter/Search/Clock into the persistent application, moved the lightweight local search driver under Eval, removed the unreachable legacy Fixture parser branch, and extracted inline Web markup from the HTTP server.
- Added `npm run arch:check` and reduced Arch Guard to durable authority and dependency boundaries.

### Boundary

ADR-0007 responsibilities, Decision Kernel authority, Semantic Proposal fields/schema version, Prompt version, Restaurant Harness and frozen Goal/Scheduler probes were retained. The private 30-query Holdout was not inspected, used for optimization, or run against DeepSeek. No live Provider, Discovery, Availability or external write was invoked.

## 2026-08-16 — Remove obsolete v14 and legacy Eval paths

### Why

The default `npm test` mixed current product guarantees with 70 historical v14 Harness tests, an obsolete single-turn Intent Parser path and eight architecture probes. The resulting 151-test count obscured which checks still protected the frozen v15 product boundary and made removed architecture look current.

### Changes

- Deleted the executable `src/eval/decision-v14/` Harness, its Golden data, evaluator, tests and `eval:decision:*` commands. Its design and past results remain available through Git and explicitly historical documents.
- Deleted `RestaurantIntentParser`, `src/eval/intent-legacy/`, the legacy real-model adapter and all `eval:intent:*` commands.
- Split eight Goal/Scheduler/Synthetic architecture probes from the default product suite behind the explicit `npm run test:probes` command; the 12 current Postgres Runtime/Recovery checks remain in `npm test`.
- Reduced the default stable product baseline from the mixed 151-test inventory to 65 current tests, and synchronized the Eval/Test guidance, architecture, interfaces, Harness, capability, roadmap and status documents.

### Boundary

The frozen v15 responsibility chain, Prompt `v2`, Proposal Schema `1`, Semantic Proposal Contract, Compiler, Reducer, Decision Kernel, Fixture Regression and private Holdout content were not changed. No real model, network integration or external write was invoked.

## 2026-08-14 — v15 Clean Holdout evaluation harness preparation

### Why

The v15 responsibility boundary, Prompt and Proposal Schema were frozen, but creating Holdout content before fixing the Dataset Contract, evaluator, preflight and run protocol would allow scoring rules or runtime variables to drift after results were seen. Annotation also needed a private location that could not be mistaken for another checked-in Regression set.

### Changes

- Added an Eval-only v15 Holdout Dataset Contract with a frozen dataset identity, Tokyo reference time and allowed Gold shape. It validates full accumulated `expectedDraft` plus `ASK_USER` or `SEARCH` without adding fields to the product Semantic Proposal Contract.
- Added Draft and strict Preflight modes. They reject manifest drift, unsupported fields, invalid or duplicate IDs, empty completed datasets, invalid Drafts and Draft/Decision inconsistencies before any model configuration or network call is read.
- Extracted the deterministic semantic scorer: the compiled authoritative Draft is scored before the Kernel Decision, so an upstream semantic error is not counted again downstream.
- Added a complete seven-Turn Fixture interpreter for the already exposed v15 Regression, a local pipeline command, a private Git-ignored annotation file and a committed empty template.
- Added a guarded real Holdout runner. It fixes DeepSeek `deepseek-v4-flash`, Prompt `v2`, Proposal Schema `1`, temperature, Thinking, retry policy, reference time and dataset order; requires both paid-network and Clean-Holdout confirmation; hashes the dataset and creates a non-overwritable run record before the first model request.
- Added the v15 annotation guide and synchronized the documentation index, Eval/Test skills, Eval README, Status and Roadmap.

### Boundary

No Holdout sample or Gold was created. Product code, Semantic Proposal fields, Prompt content/version, Compiler, Reducer, Kernel and search behavior did not change. The new Dataset metadata is Eval-only. No real model, Discovery, Availability or external write was invoked.

## 2026-08-14 — Stage 2C v15 semantic freeze and v14 Eval retirement

### Why

Stage 2C had accumulated several names and partially overlapping evaluation roles. The historical v14 Golden Harness, exposed v15 Regression, future clean Holdout and product semantic contract needed one explicit lifecycle boundary before any further annotation or model run.

### Changes

- Froze the active v15 responsibility chain as `Semantic Interpreter → Proposal Contract → Compiler → Runtime/Reducer → Decision Kernel`, with product Prompt `v2` and Proposal Schema `1` unchanged.
- Marked `src/eval/decision-v14/` as `FROZEN / HARNESS_ONLY / REGRESSION`: it remains available for local historical regression, but no longer receives Golden, Prompt, Schema, Scorer, paid-model or Holdout work.
- Reframed the next Stage 2C gate as a separate v15 `CLEAN_HOLDOUT` baseline, followed by one real Live Read-only Discovery check. Existing Fixture, v14 Golden and exposed v15 Regression results cannot substitute for that baseline.
- Synchronized the current Status, Roadmap, documentation Index, Eval Skill, Eval README and the two historical v14 annotation documents.

### Boundary

This freeze changed documentation and Eval lifecycle governance only. It did not change product code, responsibility ownership, Prompt content/version, Proposal Contract fields/schema, datasets, evaluator logic, model configuration or provider behavior. No real model or external integration was invoked.

## 2026-08-14 — Eval module organization by evaluation boundary

### Why

The flat `src/eval/` directory mixed four distinct concerns: the current v15 semantic Regression, the historical v14 multi-turn Golden Harness, the old single-turn Intent Parser checks and the Fixture Search smoke. Their separate files are useful for first-failure attribution, but the flat layout hid why they coexist.

### Changes

- Grouped existing files without changing datasets, contracts, Prompt content, scoring or command names: `semantic-v15/`, `decision-v14/`, `intent-legacy/`, `search-fixture/` and `shared/`.
- Shortened filenames within their owning directory; kept Contract, Reducer, Scorer, Runner and tests separate rather than merging unrelated responsibilities.
- Moved the existing real-model evaluation configuration, pricing and invocation summary to `shared/`, justified by its use from the v14 Decision, v15 Semantic and legacy Intent runners.
- Added `src/eval/README.md` and synchronized package entrypoints and active code references.

### Boundary

No Eval dataset, Golden/Regression contamination status, expected result, Prompt, model call, Runtime behavior or external effect changed. `decision-v14/` remains Harness-only and `semantic-v15/` remains the current product semantic boundary.

## 2026-08-13 — Documentation navigation and history consolidation

### Why

Current implementation facts, roadmap, verification evidence and chronological notes were distributed across the root README, Index and two long root-level logs. The logs are necessary for traceability but should not compete with current Source of Truth documents.

### Changes

- Added `docs/STATUS.md` as the single current-state summary: implemented scope, evidence, explicit gaps and next gate.
- Moved the append-only Dev Log and Test Log into `docs/history/` without removing their historical entries; added a history landing page and repaired references.
- Updated the Index and README to route readers by question, and corrected the Test Skill's stale automated baseline reference.

### Boundary

No Accepted ADR, product requirement, Runtime, model, Provider, Adapter or test result was changed. `brainstorming/` and `decisions/` were not moved or rewritten.

## 2026-08-13 — Version branch delivery convention

### Why

v15 的完整实现最初位于名称仍代表 v14 的工作分支上。即使提交内容正确，若继续按旧分支名交付，会混淆版本范围、评估结果和可回退历史；每次交付前也不应依赖用户重复口述分支选择。

### Changes

- 在`AGENTS.md`固定版本分支命名：新的已接受架构、主链路或不兼容 State / Schema / Eval 版本从已验证 HEAD 创建`codex/<scope>-v<major>`分支；前一版本分支保留为历史指针。
- 同一已命名版本内的修复和验收补充继续使用原版本分支，避免为普通小改动制造无意义分支。
- 在Post-change Verify增加交付检查：确认分支版本一致、暂存范围、`git diff --check`、本地提交和远端 push 的实际结果；远端推送仍需用户明确授权。
- 从已验证的`714adcb`创建本地`codex/restaurant-decision-v15`，保留`codex/restaurant-decision-v14`不变。

### Boundary

这是一项Git与文档治理变更；没有改变Runtime、Restaurant状态、模型调用、外部工具或产品行为。

## 2026-08-13 — v15 DeepSeek Semantic Proposal regression runner

### Why

产品语义路径已经改为v15，但原有真实DeepSeek回归仍调用Harness-only v14 `statePatch` Contract，无法验证新Semantic Interpreter、Proposal Contract、Compiler、Reducer和Decision Kernel的修复效果。

### Changes

- 新增`restaurant-semantic-regression-v1`：7个静态、人工标注回合覆盖完整输入、增量补全、人数/地点修正、菜系否定和命名餐厅目标。
- 新增受控`npm run eval:semantic:deepseek`。它调用真实`RestaurantSemanticInterpreter`，随后仅在内存中运行Compiler、Task Runtime/Reducer、Decision Kernel和Fixture Search；不创建产品Task、不执行真实Tool或外部写操作。
- 新Runner按`SEMANTIC_PROPOSAL_CONTRACT`、`COMPILER`、`SEMANTIC_RESULT`、`DECISION_KERNEL`和`RUNTIME`记录首错。语义比较以编译后的权威Draft及Decision为准，而非v14内部Patch。
- 第一次预调试发现Prompt缺少各`value.kind`精确形状，导致AREA、PARTY_SIZE和BUDGET_PER_PERSON Contract失败；补全通用形状说明和命名目标规则。Prompt内容升为v2。

### Boundary

10次真实运行仅使用已暴露的静态Regression文本，均标记为`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。它验证当前7回合的结构化输出、确定性编译、累积和决策稳定性，不证明开放需求、未见表达、真实餐厅事实或产品预约质量。

## 2026-08-13 — v15 Restaurant semantic/search product slice

### Why

ADR-0007 fixed the language-to-state boundary, so the existing Fixture product route could no longer let a model produce a complete internal Intent Draft or derive its own missing fields. The first vertical slice must make Proposal validation, compilation, reduction and next-step decision independently observable without enabling real DeepSeek, Tool access or automatic reinterpretation.

### Changes

- Replaced the local and persistent Stage 2A/2B product path with `RestaurantSemanticInterpreter → Semantic Proposal Contract → Restaurant Semantic Compiler → Task Runtime/Reducer → Restaurant Decision Kernel`.
- Added closed Proposal schema `1` for user-turn facts and `ASSERT` / `CORRECT` / `NEGATE` / `CONFIRM` operations. It rejects `statePatch`, Event, decision, command, tool and other non-semantic fields.
- Added a pure Restaurant Compiler that emits versioned `RestaurantIntentPatch` data. A same-turn contradiction emits `SEMANTIC_CONFLICT_RECORDED`; it cannot alter prior facts, call a model or reach a Tool.
- Reducer now derives missing blocking fields from authoritative values, accumulates corrections/negations, and writes `SEMANTIC_PROPOSAL_COMPILED` rather than model-generated `INTENT_PARSED`. Restaurant State and Task Definition advance to schema/version `4` because no Pilot data exists.
- Added `DECIDE_RESTAURANT_NEXT` and recorded `RESTAURANT_DECISION_MADE` for the implemented semantic/search decisions: `ASK_USER`、`SEARCH`、`PRESENT_CANDIDATES`、`NEED_ADJUSTMENT`、`NEED_REINTERPRETATION`。
- `NEED_REINTERPRETATION` records a structured conflict and asks the user. It has no automatic second model call and does not overwrite State. `PROPOSE_RESERVATION` and `COMPLETE` remain reserved Kernel types; existing booking execution transitions stay deterministic and are not migrated in this slice.
- Migrated Fixture ModelGateway, Harness and PGlite Runtime scenarios to the new Event/Command chain. The old `RestaurantIntentParser` remains Eval/real-connectivity-only and is no longer called from product applications.

### Boundary

No DeepSeek request, real Discovery/Availability call, Authorization, external write, replay, Live Read-only or Controlled Live-write was run. Fixture mode remains explicitly local-only. This slice does not implement LLM response/adjustment generation, Tool Call Contract, automatic re-interpretation or a generic cross-Domain compiler.

## 2026-08-13 — Accepted v15 semantic-to-execution architecture

### Why

真实DeepSeek诊断已将两种失败分开暴露：Provider Completion可能不满足结构Contract；结构合法的输出仍可能错误表达用户新增、修正、否定、确认或目标粒度。现有Harness-only v14让模型直接输出内部`statePatch`，把语义理解与系统状态协议混在一起，无法作为稳定产品主链。

### Changes

- 新增Accepted ADR-0007，固定`Semantic Interpreter → Semantic Proposal Contract → Restaurant Semantic Compiler → Runtime/Reducer → Decision Kernel → Execution → Verifier`主链。
- 明确Semantic Interpreter只输出本轮用户语义，不输出`StatePatch`、Event、Readiness、Tool Call、Authorization或Outcome；Contract通过只代表结构合法。
- Compiler与Decision Kernel固定为Restaurant-owned确定性代码；不创建通用Ontology、跨Domain Compiler或Workflow DSL。
- 固定`NEED_REINTERPRETATION`为v15预留Kernel Decision：只记录conflict并询问用户或安全降级，不自动重新解释或改变State。
- LLM Response/Adjustment只能解释或建议；建议需经用户的新消息确认后才重回正式语义链。禁止`LLM → Tool`、`LLM → State`和`Verifier → LLM → Tool`旁路。
- 同步Overview、Agent Orchestration、Restaurant Domain、Interfaces、Arch Guard、Planning、Eval、Harness和Post-change Verify，使后续实现按相同边界规划和验证。

### Boundary

本轮只固化架构Source of Truth和工程规则；未实现Semantic Interpreter、Semantic Proposal Contract、Restaurant Compiler、产品Decision Kernel或`NEED_REINTERPRETATION`。现有Fixture Intent Parser与Harness-only v14 `statePatch`路径保持其真实实现状态，不被报告为v15产品能力。没有DeepSeek、数据库、Discovery、Availability或外部写入。

## 2026-08-13 — Prompt v14 and typed Restaurant Decision Patch Contract

### Why

Prompt v13仍要求模型在自由字符串数组中同时表达语义类别、正负极性和canonical词形，导致禁烟软硬分类、`too formal`/`FORMAL`以及移动意愿误入Preference等问题互相缠绕。继续追加自然语言规则会让Prompt承担Schema、Normalizer和Policy三种职责。

### Changes

- 新增Restaurant-owned机器可读JSON Schema与共享运行时Validator；Model Contract和Golden Preflight使用同一校验边界，错误保留可观测的细分Rule Code。
- `DecisionState`迁移为Typed Preference（`facet / value / polarity`）与Typed Hard Constraint；Reducer按语义Key执行集合式add/remove，S1/S2比较不再受数组顺序、菜系批准别名或过敏原大小写影响。
- Golden迁移到dataset v0.10 / Schema 3，Proposal Output Schema升为4；旧`positivePreferences / negativePreferences`字符串结构直接删除，不增加兼容层。
- Prompt v14压缩为2917字符，只保留模型职责、互斥语义角色、关键字段语义和一个最小JSON示例；Readiness、路由、候选数量与Grounding继续由Decision Kernel负责。
- 明确停止点：未新增Semantic Proposal编译器、通用Ontology、Workflow DSL、Subagent编排、DeepSeek Beta Strict Function Calling或生产Runtime路径。只有后续证据显示“语义理解稳定正确、Patch操作表达持续失败”时，才重新评估编译层。

### Boundary

本轮只修改Harness-only Eval Contract、Golden、Prompt和相关文档。没有调用DeepSeek、真实Discovery、地图、Availability、数据库、Task Runtime或外部写操作。现有17个Regression Turn仍全部暴露，后续真实调用不能被称为Baseline或泛化验证。

## 2026-08-12 — Prompt v13 State Patch semantic roles

Prompt升为v13，Schema 3、Kernel、Gold、Reducer、Scorer和canonicalization均不变。新增通用语义角色规则：可协商餐厅属性才是Preference；地点、移动弹性等写入专用字段；明确不可妥协的饮食、过敏、无障碍、环境或安全要求写入Hard Constraint；确认式地点接受必须更新Location。Prompt不含当前Regression实体或原句。Model Contract测试8/8、typecheck和`git diff --check`通过；未调用DeepSeek。

## 2026-08-12 — Eval-only Decision Kernel probe / Prompt v12

### Why

同一已暴露Regression上持续把Readiness、路由、候选数和Grounding规则写进Prompt，会把确定性Policy与语义理解混在一起，并放大对Golden的邻近过拟合风险。10次v11诊断也表明S3、S4、S7/S8不应继续作为模型自由生成的字段。

### Changes

- 新增`src/eval/restaurant-decision-eval-decision-kernel.ts`：只在Eval中，以累计State、可信Fixture/Search结果和Candidate Fact确定Readiness、动作、核心澄清Topic、候选展示上限与Grounding。
- Prompt升为v12，Output Schema升为3；Proposal只允许语义`statePatch`和可选已知Candidate ID排序，删除模型输入中的`retrievalSummary`。
- Runner v4保存模型原始Patch/排序意图，再由Kernel生成实际的S3/S4/S7/S8预测；可信命名目标解析与相对时间仍明确记录为Harness贡献。
- 这不是产品Runtime、Workflow DSL、Tool Loop或外部调用：不改Restaurant Domain、Task State、Web、Discovery、Availability或Authorization。

### Anti-overfitting boundary

- Kernel规则只来自已有Readiness/动作/Fixture证据Contract，不含Golden实体、用户措辞、允许动作标签或评分提示。
- Fixture/Search结果只进入Kernel；模型仅看到允许的Candidate Fact与ID，不能看到检索充分性或Gold Oracle。
- 当前17个Turn已全部暴露，任何后续真实模型结果仍仅是`DEVELOPMENT_DIAGNOSTIC`；Kernel通过也不构成泛化或产品能力证据。

### Verification

`npm run typecheck`、Kernel / Model Contract / Runner定向测试15/15、Strict Preflight、Fixture Oracle、Fixture Episode Runner、完整`npm test` 133/133、`npm run build`和`git diff --check`均通过。首次受限沙箱下完整测试的7个Local Web/SSE用例均因`listen EPERM 127.0.0.1`失败，其余126个通过；以本机监听权限重跑后133/133通过，未归因为代码断言失败。本条不包含DeepSeek调用。

## 2026-08-12 — Prompt v11 action routing matrix

### Why

v8真实模型诊断中有3个独立S4首错，且S1/S2/S3均通过：模型把`BRAND`错误路由到`CHECK_TARGET_RESTAURANT`，把`RESTAURANT`错误路由到`RESOLVE_BRAND_OUTLET`，并在指定餐厅后续补充人数/时间时退化为通用`SHOW_RECOMMENDATIONS`。

### Changes

- `RESTAURANT_DECISION_EVAL_PROMPT_VERSION`升为`v11`；输出Schema保持`2`，因为没有新增结构字段。
- Prompt新增抽象Routing Matrix：`BRAND`走`RESOLVE_BRAND_OUTLET`，或在Exact/Window时间、Exact人数和具体Outlet候选已齐时走`CHECK_AVAILABILITY`；不得走`CHECK_TARGET_RESTAURANT`。
- `RESTAURANT`走`CHECK_TARGET_RESTAURANT`，即使候选上下文里有多个同名Outlet或用户刚补充人数/时间；不得走`RESOLVE_BRAND_OUTLET`或`SHOW_RECOMMENDATIONS`。
- `OPEN/CATEGORY`达到推荐条件后走`SHOW_RECOMMENDATIONS`；可见选项反馈后走`NARROW_FROM_FEEDBACK`；`APPROXIMATE`或宽泛`DAYPART`不等于Exact Availability。
- Model Contract测试新增路由矩阵断言，且继续检查静态Prompt不含已暴露Golden实体。

### Boundary

仍是Harness-only Prompt修正。没有改Gold、Reducer、Scorer、Runtime、Discovery、地图、Availability或外部写入；错误动作仍归因S4，不通过Harness改写为正确动作。

### Verification

`npm run typecheck`、Model Contract定向测试8/8、`npm run eval:decision:model:fixture`、`npm run eval:decision:fixture`、`npm run build`和`git diff --check`均通过。真实模型Mock World首次在sandbox内全部为`NETWORK`且没有语义分数；用户明确批准调用DeepSeek并接受当前Regression评测数据出境后，FULL_REGRESSION重跑成功：17个Turn全部完成、0次Schema retry、P0为0，12/17个Turn无首错。v8中3个S4路由首错均不再直接失败。随后用户要求同一v11累计运行10次用于稳定性观察：总计174次DeepSeek API请求、4次Schema retry、0次Provider failure、P0为空；DGS03-T02为10/10 `S3_READINESS`，DGS04-T03为10/10 `S1_STATE_EXTRACTION`，DGS06-T03为10/10 `S7_SELECTION_DIVERSITY`，DGS06-T04为10/10不通过但首错阶段不稳定，DGS07-T01为10/10不通过且一次从S3波动到S1。结论改为按10次矩阵的稳定失败优先处理，不能基于单次结果继续调Prompt。

## 2026-08-12 — Prompt v10 state extraction boundary tightening

### Why

v8真实模型诊断中DGS06仍有两类状态抽取错误：把“with friends”等社交语境臆测为具体人数，以及把“would be good”类软偏好提升为`target: CATEGORY`。用户确认这两类Gold口径正确，不能通过放宽Scorer或canonicalization解决。

### Changes

- `RESTAURANT_DECISION_EVAL_PROMPT_VERSION`升为`v10`；输出Schema保持`2`，因为没有新增结构字段。
- Prompt明确规定`friends/family/team/department/date/partner`等词只能支持`occasion`，除非用户给出明确数字或有界范围，否则不得设置`party`。
- Prompt明确规定`would be good/maybe/preferably/I like/nice to have/not too`等软偏好进入`positivePreferences`或`negativePreferences`，不得把`target: OPEN`提升为`CATEGORY`。
- Model Contract测试新增这些Prompt边界断言；Gold、Reducer、Scorer和地点canonicalization均不变。

### Boundary

仍是Harness-only Prompt修正。没有真实模型调用、Discovery、地图、Availability或Runtime写入；这两类错误仍归因到S1 State Extraction，不作为可接受等价。

### Verification

`npm run typecheck`、Model Contract定向测试8/8、`npm run eval:decision:model:fixture`、`npm run eval:decision:fixture`、`npm run build`和`git diff --check`均通过。完整`npm test`本轮未运行，因为没有改Runtime、Web、Reducer或Scorer；当前完整基线仍为2026-08-12的131 tests / 5 suites。

## 2026-08-12 — Prompt v9 / Golden v0.9 location strategy semantics

### Why

v8全量诊断里多个首错并不是缺真实餐厅数据，而是地点语义表示过窄：`AREA`与`NEAR_PLACE`在没有地图grounding时会对同一地名产生合理粒度差异；“从Ueno出发且愿意跑远”也不应被迫压成普通`AREA Ueno`或自由文本`FLEXIBLE.scope`。

### Changes

- Golden Seed升级为v0.9，DGS06将“从Ueno出发且愿意移动”表示为`{ kind: "FLEXIBLE", anchorQuery: "Ueno" }`；无锚点的`FLEXIBLE`仍然不是可执行Location Strategy，仍需追问。
- `DecisionLocation`允许`FLEXIBLE.anchorQuery`；Model Contract升为Prompt v9、输出Schema `2`，要求模型用`FLEXIBLE + anchorQuery`保留“出发锚点 + 出行弹性”，不要降级为`AREA`。
- S1/S2 canonicalization新增受控地点规则：同query的`AREA`/`NEAR_PLACE`等价，query只做大小写与空白归一；`ADDRESS_OR_STREET`不参与该等价；泛化travel scope被视为`FLEXIBLE`本身，`scope: "from/around X..."`可兼容为anchor。
- 诊断日志的canonical equivalent说明改为通用Eval比较规则，避免继续只写“菜系别名”。

### Boundary

仍是Harness-only。没有接真实地图或Discovery；没有让harness猜地点事实；没有放过漏地点更新。`Kameido is fine`若模型不写location仍是S1失败，`AREA Ueno`也不会等价于`FLEXIBLE anchorQuery Ueno`，因为前者丢失了愿意移动的策略。

### Verification

Typecheck、Strict Preflight、Fixture Oracle、Fixture Episode Runner、定向35个node:test、完整`npm test` 131/131和build均通过。未发起新的DeepSeek调用。

## 2026-08-11 — Prompt v8 Full Regression real-model diagnostic

### Why

相对时间的可信Harness闭环后，用户明确授权重新运行全部已暴露Regression，以确认真实模型交互、逐Turn诊断和原始/有效Patch分离在同一条受控路径上工作。该集合已参与开发，运行目的仅为定位后续问题，不是建立质量Baseline。

### Result

- 7个Episode、17个Turn全部完成，17次DeepSeek调用、0次Schema retry；7个Turn完全通过。
- 余下10个首错为7个S1状态解释与3个S4路由。S4集中在`BRAND`与`RESTAURANT`的后续检查动作混淆；S1包括把全面禁烟降为偏好、臆测朋友人数，以及`FLEXIBLE from Ueno`与`AREA Ueno`的语义分歧。
- `today/tomorrow/tonight`相关Turn的Artifact已显示可信解析与原始/有效Patch；它们不是本次首错来源。

### Boundary

本次仅调用真实模型，候选世界仍为Golden Fixture，不访问真实Discovery/Availability，也不修改产品State、Task Runtime或任何外部世界。Artifact落在Git忽略的`.eval-artifacts/restaurant-decision/`，不保存原始Prompt、Completion或密钥。

## 2026-08-11 — Prompt v8 trusted relative-time normalization

### Why

`referenceTime`此前只作为模型上下文传入，没有确定性地转换`tonight`等表达；同时`DAYPART`允许无日期，导致模型的结构合法输出仍会漏掉可由参考时钟确定的日期。用户要求将该类解析收回Harness，而非继续堆叠Prompt。

### Changes

- 新增Restaurant Decision Eval专用纯函数，只使用传入的`referenceTime`和`Asia/Tokyo`，不读取机器时钟或网络。当前最小词表为`today`、`tomorrow`、`tonight`、`now`和`right now`；`now/right now`得到参考时刻的`APPROXIMATE`时间。
- 互斥日期锚点、`tomorrow`与即时表达冲突、或多个不相容Daypart时返回未知，不使用启发式猜测。后续用户补充相对日期时保留已有Daypart，并用新的日期完成它。
- Runner v3在模型调用前把可信时间写入累计State，并在评分前将它与模型原始Patch合成为有效Patch。`RESTAURANT_DECISION_EVAL_PROMPT_VERSION`升为`v8`，只要求模型保留这类可信状态。
- 逐Turn诊断现在同时保留可信相对时间解析、原始模型Patch和有效Patch，避免将Harness贡献误报为模型输出。

### Boundary

仅限Eval Harness；不改生产Restaurant State、Task Runtime、真实时钟、Discovery、数据库、预约或外部写入。它不是通用日期库，也不覆盖任意自然语言、绝对日期或模糊日期；新增语义必须有真实需求和独立测试后才扩展。

### Verification

- 5个纯函数场景覆盖Tokyo日期、`today/tomorrow/tonight/now/right now`、时区转换、冲突拒绝、已有Daypart合并和模型漏日期修补；Runner回归确认DGS04的date-less模型Patch被可信解析补齐且日志保留两种Patch。
- Typecheck、Strict Preflight、17-turn Fixture Runner和build均通过。完整测试首轮在PGlite WebAssembly清理时发生Node/V8原生崩溃；同一命令立即重跑为130/130通过，因此未归因为代码断言失败。
- 没有发起新的DeepSeek调用；v8仍需用户明确授权的污染Regression运行才可观察真实模型交互，且不能作为Baseline。

## 2026-08-11 — Prompt v7 explicit restaurant occasion mapping

### Why

逐TurnRegression Artifact显示模型把`friends`和`department dinner`都错误写成`occasion: DATE`，并会在未提及同伴时补猜`DATE`。原因不是缺乏真实餐厅数据，而是Prompt同时把`DATE`用作日历日期Topic和浪漫约会枚举，且缺字段抽象示例错误地把`occasion: DATE`作为默认Patch。

### Changes

- `RESTAURANT_DECISION_EVAL_PROMPT_VERSION`升为`v7`。删除抽象缺字段示例里的`occasion: DATE`；`ASK_CORE_FIELD.DATE`明确仅为日历日期。
- 增加实体无关的Occasion规则：只有用户明确表达时才设置；`SOLO`对应独自、`DATE`仅对应浪漫约会/伴侣、`FRIENDS`对应朋友、`FAMILY`对应家人/亲属、`TEAM`对应工作同事/团队/部门。晚餐、日历日期、时段或缺失社会情境一律不推断`DATE`。
- 新增Prompt Contract断言，确认规则与`FAMILY`映射存在、缺字段示例不含`"occasion":"DATE"`，并继续禁止静态Prompt含Golden实体、地点、菜系、候选或反馈措辞。

### Boundary

只改Harness-only Model Contract、文档和测试；不改生产Restaurant State、Task Runtime、真实Discovery、数据库、预约路径或Model Gateway遥测。此举消除已暴露数据揭示的通用词义冲突，但不能证明模型泛化；相对时间解析仍保持独立待处理。

### Verification

- Model Contract定向测试：8/8通过，验证`FAMILY`/`FRIENDS`/`TEAM`/浪漫`DATE`的抽象规则存在，且缺字段示例不再包含`occasion: DATE`。
- Strict Preflight、17-turn Fixture Episode Runner、TypeScript typecheck与build均通过；完整自动化基线为124/124通过。
- 未发起新的DeepSeek调用；真实Regression仍须由用户明确授权，且只能报告为已污染Dataset的开发诊断。

## 2026-08-11 — Eval-only restaurant category canonicalization

### Why

逐TurnArtifact确认`Western food`/`Western`、`Japanese food`/`Japanese`和`Izakaya`的大小写不是语义差异。用户要求先消除这些评分误报，将Occasion与相对日期留作独立问题处理。

### Changes

- 新增显式、Eval-only类别别名表。它只归一`CATEGORY.target.query`与正向菜系偏好中的批准值：`western food/western`、`japanese food/japanese`和`izakaya`任意大小写。
- S1 Patch-effect和S2累计状态比较使用该规范视图；Gold、模型结构化Proposal、诊断中的原始文本、生产Restaurant State和模型输入不被改写。
- 任意未列别名、品牌/店名、地点、`FLEXIBLE.scope`、负偏好和Hard Constraint仍严格比较。避免以模糊匹配掩盖“无烟”或过敏等安全语义。

### Result

- `WESTERN`、`IZAKAYA`和`JAPANESE`分别通过对应Golden Turn的S1/S2；`Italian`替换`Western food`仍稳定首错S1。
- 没有发起新的DeepSeek请求。此前真实Artifact的原始差异保留为历史证据；下一次模型运行才使用新评分口径。

### Verification

- `npm run typecheck`、`npm run build`：通过。
- `npm run eval:decision:preflight:complete`：Golden v0.8仍为`READY_FOR_EVALUATOR`。
- `npm run eval:decision:model:fixture`：17个Turn均完成评分，S1–S8通过，P0为0。
- `npm test`：124 tests / 5 suites / 0 failed。

## 2026-08-11 — v6 full Regression with per-turn diagnostic artifact

## 2026-08-11 — v6 full Regression with per-turn diagnostic artifact

### Why

用户要求不再只报告S1/S2阶段计数，而是直接运行v6并检查每个模型Patch与Gold状态的具体差异。

### Result

- 在用户明确授权下，`FULL_REGRESSION`再次运行7个Episode、17个Turn；17次调用均完成，Runner记录0次Schema重试。日志落在本机Git忽略路径`.eval-artifacts/restaurant-decision/2026-08-11T03-59-28-429Z-full_regression.md`；没有数据库、Discovery、预约或其他外部写操作。
- 4个Turn（DGS05全部四回合）完整通过；13个Turn首错为10次`S1_STATE_EXTRACTION`、2次`S2_STATE_ACCUMULATION`和1次`S7_SELECTION_DIVERSITY / RECOMMENDATION_MISSING`，未出现P0。
- 可复查的根因不是单一“状态提取差”：模型把`friends`和`department dinner`错误枚举为`DATE`、漏掉Sora Dining的“tomorrow night”、没有把`tonight`落到日期；把“no smoking”当作普通负偏好而非Hard Constraint；把“from Ueno, can travel”误作`NEAR_PLACE`而非`FLEXIBLE`；DGS07第二回合漏写Kameido；DGS02虽已得到确定性检索结果却没有填`recommendation`。这些是下一轮Prompt/Contract待审查的问题。
- 同时，若干S1差异仅是当前Gold/State Canonicalization未定义的文字归一：`Western food`/`Western`、`Izakaya`/`izakaya`、`Japanese food`/`Japanese`，以及Gold没有保留的`FLEXIBLE.scope`。不能把它们直接当作模型语义失败；应先决定Domain canonicalization规则，再动Prompt。DGS03-T02和DGS04-T02的S2是前一轮错误的累计后果，并非这轮本身的Patch错误。

### Boundary

本次仍为`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。Artifact暴露的是已污染静态Regression的Gold与结构化Proposal，不能用于Holdout、质量趋势或生产数据。

## 2026-08-11 — Progressive Decision per-turn diagnostic artifact

## 2026-08-11 — Progressive Decision per-turn diagnostic artifact

### Why

阶段汇总只能报告“11个Turn首错S1、2个首错S2”，不能让操作者看到模型实际写了什么Patch，因而不能区分当前Turn提取错误与此前累计偏差。用户要求每次Eval都留下可审阅证据。

### Changes

- Episode Runner新增仅Eval使用的逐Turn结构化Witness：Fixture用户文本、候选上下文ID、模型输入状态、Gold前序状态、期望Patch/状态、模型Patch的同前序状态效果、模型累计状态和S1–S8评分。观察器异常被隔离，不能改变Eval的fail-closed语义结果。
- 真实DeepSeek CLI将Witness渲染为`.eval-artifacts/restaurant-decision/<timestamp>-<scope>.md`并在JSON摘要中打印路径；目录被Git忽略。Artifact刻意不含System Prompt、自然语言Completion、API Key、普通Gateway遥测或生产用户数据。
- CLI只允许当前静态`REGRESSION` Seed写出该Artifact；一旦Dataset含非Regression（例如未来Holdout）即拒绝写入，防止诊断日志本身造成测试泄漏。
- 修复通用真实Eval指标的调用分母：Progressive Decision按预期主调用Turn数而不是Episode数计算`retryCalls`。历史v6输出的10次“重试”是统计错误，实际逐TurnSchema重试始终为0。

### Result

- 新的Runner回归用一个故意错误的`target` Patch验证Artifact会显示`state.target.kind`差异并定位`S1_STATE_EXTRACTION / STATE_PATCH_MISMATCH`。
- 随后的用户授权v6 full Regression已生成真实模型Artifact；逐Turn结果与具体差异记录在上方独立条目。

### Verification

- `npm run typecheck`：通过。
- `node --import tsx --test src/eval/restaurant-decision-eval-runner.test.ts src/eval/real-model-eval.test.ts`：7/7通过。

## 2026-08-11 — v6 Fixture Tool boundary iteration

## 2026-08-11 — v6 Fixture Tool boundary iteration

### Why

v5全量Regression说明`BRAND`/`RESTAURANT`、候选不足和Grounding不应继续靠Prompt猜测。用户确认其中前三类主要是Harness/工程输入问题，第四类只有在检索系统给出“结果集是否充分”的事实后才是模型表达问题。

### Changes

- Golden Seed升级为v0.8。`BRAND`和`RESTAURANT` Episode必须带有时间戳的`FIXTURE_DISCOVERY`命名目标解析；Strict Preflight拒绝缺少、类型不匹配或无来源的解析结果。Prompt v6只复制该只读结果，不再以名称、参数知识或候选数量猜测实体类型。
- Runner把可展示候选的充分性作为`retrievalSummary`交给模型。只有其`LIMITED`时，模型才应声明不足；这仍是Fixture Retriever的输入，不是对真实东京候选耗尽的声称。
- 候选Fact引用和“仍需餐厅确认”的过敏披露改由可信Runner在模型选择候选后确定性装配。模型不再被鼓励填可选的Grounding数组；S8继续验证引用与披露，但不再把证据绑定这一工程任务误判为模型知识缺失。
- S1改为比较Patch对已有状态的语义效果，允许不改变结果的冗余写入，同时继续拒绝任何改变最终状态的错误Patch。

### Result

- Prompt v6、Runner v2和Golden v0.8先在Fixture Model中验证；7个Episode、17个Turn的S1–S8全部通过，P0为0。新增两个回归测试：命名目标解析缺失必须被Preflight拒绝；无害no-op Patch不再造成S1误报。
- 随后在用户明确授权下，以`FULL_REGRESSION`运行全部7个Episode、17个Turn：17次DeepSeek调用均成功、0次Schema重试、28,543ms、34,750输入Token、2,199输出Token、36,949总Token、成本`NOT_CONFIGURED`，P0为0。S1为6 Pass / 11 Fail，S2为4 Pass / 2 Fail / 11 Blocked；11个首错为State、2个为State Accumulation。命名目标、Grounding和候选不足不再成为首错，但这只定位当前已见样本上的问题，不构成质量提升或泛化证据。
- 此次没有接入真实Discovery、Availability、Task Runtime或外部写路径；DeepSeek只接收静态虚构Golden Fixture的当前Turn与允许Candidate Context。外层通用指标把7个Episode误作17个Turn的分母，因而输出了`modelMetrics.retryCalls: 10`；Runner的逐Turn统计确认实际Schema重试为0。该汇总字段是报告缺陷，必须在下次运行前修正，不能解读为真实重试。

### Verification

- `npm run typecheck`、`npm run build`：通过。
- `npm run eval:decision:preflight:complete`：`READY_FOR_EVALUATOR`，Golden v0.8共7个Episode、17个Labeled Turn。
- `npm run eval:decision:model:fixture`：17个Turn完成评分，S1–S8均通过，P0为0。
- `npm test`：122 tests / 5 suites / 0 failed。
- `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_DECISION_EVAL_SCOPE=FULL_REGRESSION PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=7 npm run eval:decision:deepseek:smoke`：完成上述受控、只读的v6开发诊断；原始Prompt/Completion未输出或持久化。

## 2026-08-11 — v5 full Regression diagnostic

### Why

用户要求不再只看固定的E1/E2/E3三条Smoke，而是把已人工标注的全部Golden Regression Episode完整运行，再依据问题决定下一轮Prompt调整。

### Changes

- `eval:decision:deepseek:smoke`新增`PRAXIS_DECISION_EVAL_SCOPE`：默认`SMOKE`维持3个Episode，显式`FULL_REGRESSION`从Dataset选择全部当前`REGRESSION` Episode，并要求与选择数相等的`PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT`。本数据集当前为7个Episode、17个Turn。
- 输出的`evaluationClassification`现在同时记录所选范围和数量。两种范围均固定为`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`；没有把全量回归伪装成Holdout。
- README、Eval Skill、Eval Plan、Annotation Guide、Roadmap和架构说明同步了完整诊断入口和报告边界。

### Result

- 在用户明确授权下，Prompt v5以`FULL_REGRESSION`运行全部7个Episode、17个Turn；每个Episode状态均为`SCORED`。DeepSeek只接收静态虚构Golden Fixture的当前Turn与允许Candidate Context；没有Task、Authorization、数据库、Discovery、餐厅平台或其他写操作。
- 回归诊断确认了下一轮应解决的真实问题：State与多轮累积仍会偏离Gold；“用户想去的单店”规则被泛化过度，令品牌请求可能被标成`RESTAURANT`；推荐结果经常不附Fact Grounding；候选数不足时也会漏掉解释。这些是Prompt/Contract诊断，不是模型质量统计结论。
- 没有在本轮后继续改Prompt；先保留问题清单，等待下一轮明确的v6范围，避免根据同一已见集合反复拟合。

### Verification

- `npm run typecheck`：通过。
- `npm test`：120 tests / 5 suites / 0 failed。
- `git diff --check`：通过。

## 2026-08-11 — Prompt v5 static-example decontamination smoke

### Why

Prompt v4把固定Regression的店名、地点、菜系和反馈措辞写成worked examples，因而无法区分通用规则收益与对已见题目的提示。用户要求删去这类具体实体后重新运行相同受控Smoke，验证结构能力与固定样本成绩对具体例子的敏感性。

### Changes

- `RESTAURANT_DECISION_EVAL_PROMPT_VERSION`升为`v5`。保留Schema词表、命名店铺为`RESTAURANT`、多分店不推断`BRAND`以及正/负偏好同步记录等抽象规则；删除静态Prompt中的Gold店名、地区、菜系、候选、日期/人数和反馈措辞。
- 新增Model Contract断言：静态System Prompt必须不含`Sora Dining`、Ginza、西餐类别、原反馈句或候选占位符，同时仍含抽象Restaurant与偏好规则。运行时用户消息和只读Candidate Context仍会按当前Turn交付；这不是泄漏，而是模型作答所需输入。
- Smoke分类理由更新为Prompt v1–v5均已使用固定`DGS01/DGS03/DGS05`及其结果；本次报告继续为`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。

### Result

- v5真实Smoke：7次成功DeepSeek调用、0次Provider失败、0次Schema Retry、15,548ms、14,704输入Token、918输出Token、15,622总Token，成本`NOT_CONFIGURED`，P0为0。7个Turn均完成结构校验和评分。
- S1为5 Pass / 2 Fail；S2为4 Pass / 1 Fail / 2 Blocked；S3/S4各4 Pass / 3 Blocked；S7为1 Pass / 1 Fail / 3 Blocked / 2 NA；S8为0 Pass / 3个`GROUNDING_MISSING` / 4 Blocked。首错为两处State Patch、一次State Accumulation、三次Grounding和一次不足候选解释。
- 命名店铺仍被正确分类为`RESTAURANT`，证明该抽象规则仍可用；但完整类别短语被截短，以及额外场景字段导致State差异。与v4的单次结果相比，不能推出统计质量下降，但可确定v4的固定样本分数受其worked examples影响，不能作为泛化证据。

### Decisions and boundaries

- 本轮仅去除泄漏并观察，不根据这三条固定样本继续做v6调整。下一个Prompt候选应先通过抽象规则审查，再在新的隔离Holdout上评测。
- 真实调用只访问DeepSeek，候选世界仍是虚构Golden Fixture；没有Task、Authorization、数据库、Discovery、餐厅平台、预约或其他外部写入。

### Verification

- 定向Model Contract + Runner：11/11通过；`npm run typecheck`、`npm run build`、`npm run eval:decision:preflight:complete`和`npm run eval:decision:model:fixture`：通过。
- 全量`npm test`：120 tests / 5 suites / 0 failed（在允许临时`127.0.0.1`监听后）；`git diff --check`：通过。本次真实Smoke按用户明确授权执行。

## 2026-08-11 — Progressive Decision Eval anti-leakage and baseline governance

### Why

固定的E1/E2/E3 Smoke在v1–v5期间已被反复查看，并把样本事实、Gold差异和Validator/评分结果直接转化为Prompt规则。继续把这些样本上的改善称为模型质量提升，会把“对已知题目答得更像答案”误当成泛化能力。需要在下一轮Prompt或真实模型运行前固化防测试集泄露、答题作弊和过拟合边界。

### Changes

- `eval:decision:deepseek:smoke`的JSON输出新增`evaluationClassification`：固定`DGS01/DGS03/DGS05`为`DEVELOPMENT_DIAGNOSTIC`、`PROMPT_AND_RESULT_EXPOSED`和`baselineEligible:false`。该命令仍是付费、只读、无持久化原文的诊断入口；新增字段不改变模型调用、评分或产品状态。
- Eval v2协议新增§16.1：定义Development Diagnostic、Clean Holdout和污染降级；禁止把样本文本、实体、Candidate/Fact、Gold、Validator错误、Completion或评分结果转写进Prompt后仍将其当作Holdout；任何泄露不可通过重跑恢复独立性。
- 规定Prompt示例只能使用抽象Schema/规则，运行时Candidate Context只限允许的只读输入且不得携带Gold、允许选择或评分提示；真实模型报告必须写明`cohort`、`contaminationStatus`和`baselineEligible`。
- 当前7个Golden Seed均明确为Regression，五次已发生的固定Smoke全部重新定性为开发诊断，不再允许作为Baseline、质量趋势或发布证据。路线图、评测Skill、Annotation Guide、架构说明和README同步为“先建立隔离的新Holdout并冻结候选版本，再运行独立评测”。

### Decisions and boundaries

- 开发诊断仍可用来发现Schema或语义问题，但其分数只回答“这个已见问题是否被修复”，不回答“模型是否泛化”。
- `CLEAN_HOLDOUT`应由不参与Prompt编写的人或隔离流程完成标注，在Prompt/模型/Schema/Evaluator/Case顺序冻结前不向调参者暴露内容；查看结果后若继续改动，必须使用另一批未见Holdout。
- 本轮不再调用DeepSeek，也不修改Web、Task Runtime、生产Restaurant State、Authorization、Adapter、数据库或外部写路径。

### Verification

- `npm run typecheck`、`npm run build`：通过。
- `npm test`：119 tests / 5 suites / 0 failed；本机HTTP/SSE测试在允许临时`127.0.0.1`监听后通过。
- `npm run eval:decision:preflight:complete`：通过，7个Episode、17个Labeled Turn均为`READY_FOR_EVALUATOR`；`npm run eval:decision:model:fixture`：通过，17个Fixture Turn全部评分、P0为0。
- `git diff --check`：通过。未运行真实Smoke，故没有DeepSeek请求或新的模型结果。

### Next

先确定隔离Holdout的作者/保管方式并新建样本，在候选Prompt冻结前不查看其内容；当前v5的专用Smoke不再继续作为调优或独立质量依据。

## 2026-08-11 — Harness-only Episode Model Runner, Prompt v2 smoke and completion diagnostics

### Why

需要在真实模型质量评估前把完整多轮Episode组装成一个可观察、可停止且不触碰产品Runtime的Harness路径。首次受控Provider运行还证明：模型连接成功并不代表输出已满足严格嵌套Schema；这种错误必须与语义失败分开，并在花费更多调用前先修正Contract。

### Changes

- 新增`runRestaurantDecisionEvalEpisodes`：它先执行Strict Preflight，再按Episode/Turn将累计Eval State、当前消息和明确允许的Golden Fixture候选上下文送入现有`RestaurantDecisionEvalModelContract`。模型输出仍不能伪造`retrievedCandidateIds`；S6由确定性Fixture结果填充后才运行既有S1–S8 Scorer。
- 新增本地`GoldenDecisionEvalFixtureGateway`和`npm run eval:decision:model:fixture`，用17个Golden Turn验证Preflight、候选上下文、Contract、一次Schema Retry、失败分离和评分组装；新增3个Runner测试，覆盖完整Fixture路径、Provider失败停止Episode和Preflight阻断调用。
- 新增`npm run eval:decision:deepseek:smoke`，固定运行E1/E2/E3各一个完整Episode，必须有`PRAXIS_ALLOW_LIVE_MODEL_EVAL=1`和`PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=3`；候选世界始终为Golden Fixture，不访问真实Discovery、Availability或任何写路径。
- 首次Prompt v1 Smoke已实际运行：Provider成功返回7次（其中3次为无效Schema后的允许重试），但三个Episode都以`INVALID_MODEL_OUTPUT`停止，未进入S1–S8语义评分。根据稳定Validator错误，Prompt升级为`v2`，补充嵌套State、Action和可选Recommendation的精确字段规则。
- Prompt v2 Smoke已在相同E1/E2/E3范围实际运行：8次成功Provider调用、3次Schema Retry；E2-T01和E3-T01通过结构校验，但E1-T01、E2-T02和E3-T02仍因时间、地点或动作枚举/组合无效而停止，因此没有Episode进入S1–S8语义评分。
- 新增静态Golden Fixture专用的`PRAXIS_EVAL_SHOW_COMPLETIONS=1`诊断开关：它仅把每次模型Completion、回合和逐次Validator结果交给本次Smoke终端输出，不进入ModelGateway普通遥测、数据库或文件；未开启时不观察或保留Completion。新增Contract测试覆盖无效及成功重试的诊断关联。
- 已用该开关再次运行Prompt v2：8次成功Provider调用、3次Schema Retry、20,225ms、12,922 Token。原始Completion确认E1稳定输出`DAY`/`EVENING`、`location.type`和`RECOMMEND`，而Contract要求不同的时间、`location.kind`及动作枚举；E2把时间精度写成`DATE`或省略；E3写出`NIGHT`和布尔`preferred`。当前重试只提示“无效”，没有交付这些字段错误，所以没有纠正输出。
- Prompt v3将精确词表、合法Time/Location/Action对象示例及Validator错误反馈纳入一次重试。受控重测以7次成功调用、0次Schema Retry使全部7个Turn通过结构校验并进入S1–S8，但均在S1首错：v3要求输出空`add`/`remove`，而Gold no-op Patch要求省略；其余Completion还显示Restaurant被当成Brand、DATE场景的occasion/target未提取、反馈中的负偏好未正确加入。Prompt版本不可重写，后续修正必须为v4。
- Prompt v4省略no-op Patch、明确指定餐厅即使有分店仍为`RESTAURANT`、补充DATE场景与否定偏好示例。受控重测保持7次成功调用、0次Schema Retry，并将S1从0/7提升为6/7、S3为5/7、S4/S6/S7各5/7或3/7 Pass。`Sora Dining`和反馈Patch均已正确；剩余首错为5个缺失的Grounding、E3首回合遗漏`target: OPEN`、以及Sora补齐人数/时间后错误追问地点。后续修正必须为v5。

### Decisions and boundaries

- Runner报告只保留结构化Proposal处理结果、候选ID、评分、Provider/模型、延迟、Token和稳定错误码；不保存或输出原始Prompt/Completion。静态Fixture Smoke的显式终端诊断是唯一例外，且不持久化。
- `REAL_MODEL_MOCK_WORLD`只评估真实模型对固定虚构候选世界的决策能力，不是Live Discovery、真实Availability、Web功能或产品能力证明。
- Provider/Schema失败会停止当前Episode而不是用Golden输出补齐；首次Smoke的无效输出不是P0，也不计为模型语义零分。
- 本轮没有修改Web、Task Runtime、Restaurant生产State、Authorization、Adapter、数据库Schema或外部写路径。

### Verification

- `npm run eval:decision:preflight:complete`、`npm run eval:decision:fixture`和`npm run eval:decision:model:fixture`：通过；Fixture Runner完整运行7个Episode、17个Turn，P0为0。
- 定向Model Contract + Runner：10/10通过；`npm run typecheck`、`npm run build`：通过。
- `npm test`：119 tests / 5 suites / 0 failed（在允许本机`127.0.0.1`监听后）。
- 三次受控DeepSeek Smoke均无Provider失败且没有Task/数据库/平台写入。v1为7个成功调用、3次Schema Retry、24,083ms、9,479 Token；首次v2为8个成功调用、3次Schema Retry、20,731ms、13,137 Token；诊断v2为8个成功调用、3次Schema Retry、20,225ms、12,922 Token。价格未配置，成本均为`NOT_CONFIGURED`。

### Next

先以Completion诊断人工审阅v2失败输出并决定最小Contract调整；只有结果结构稳定且人工审阅通过后，才扩充并冻结Dataset，再经明确付费授权运行完整Progressive Decision Baseline。

## 2026-08-10 — Harness-only Progressive Decision Model Contract

### Why

在首次付费Baseline前，模型需要一个与生产Runtime隔离、可版本化且会拒绝不可信输出的Proposal Contract。没有它，模型可能把检索结果伪装成自身事实，或在JSON无效、Provider失败时让评测器把基础设施错误当成语义失败。

### Changes

- 新增`RestaurantDecisionEvalModelContract`：经现有服务端`ModelGateway`发送`restaurant_progressive_decision_eval/v1`的非流式JSON请求，固定10秒超时、900输出Token、`temperature: 0`、关闭Thinking与`FAIL_CLOSED`回退。
- 输入为脱敏的累计Decision State、当前用户消息和调用方明确交付的只读Candidate Context。输出只接受State Patch、Readiness、Next Action、Candidate ID选择和Grounding；未知字段与嵌套字段一律拒绝。
- Candidate Retrieval继续是单独的Fixture/Search阶段；Contract明确禁止模型输出`retrievedCandidateIds`，避免模型把未执行的只读检索伪装成结果。
- 无效JSON、非`STOP`完成或Schema无效最多重试一次；Provider失败不重试并与`INVALID_MODEL_OUTPUT`分开报告。新增6个Connector/Schema测试。

### Decisions and boundaries

- 这是Eval Proposal，不是Task Event、Task State、Authorization、Tool Command或生产Web API。它不会调用DeepSeek，除非未来完整Episode Runner经过现有付费门禁显式创建真实Gateway。
- 当前只完成Contract本身；还没有完整Episode Model Runner，因而没有运行新的Progressive Decision真实模型Smoke或Baseline。

### Verification

- 定向Model Contract测试：6/6通过，覆盖受限请求、一次Schema重试、禁止伪造检索、嵌套未知字段、Provider失败和调用前输入校验。
- `npm run typecheck`、`npm run build`、`npm run eval:decision:fixture`：通过。
- `npm test`：115 tests / 5 suites / 0 failed。

### Next

实现完整Episode Model Runner：只读Fixture候选交付、模型Proposal与S1–S8 Scorer组装、Provider/Schema失败分离和受控3-Episode Smoke输出；之后才请求/使用真实DeepSeek付费运行。

## 2026-08-10 — Progressive Decision Evaluator Verification Set

### Why

Perfect Oracle只证明评分器与Gold自洽，不能证明它会把故意错误归到正确环节。真实模型Baseline前需要一组独立、单点的反例，特别是让Fixture自身无法提供Gold所要求差异时，不能反过来怪罪模型选择。

### Changes

- 新增18个`M01–M18`单点Mutation，覆盖S0–S8：无效Fixture/过敏证据、State提取、Gold Reducer不一致、Readiness、Action、重复澄清、漏检/多检候选、严重过敏P0、候选数量、越过检索集合选择、Fixture多样性缺口、Process/Result Grounding、禁止Availability声明和候选卡确认披露缺失。
- S7新增小规模固定组合的Oracle可满足性检查：若Candidate Pool本身无法让任意允许集合满足Gold规定的数量与多样性，报告`FIXTURE_COVERAGE_GAP`，而非把Perfect Prediction记为模型选择失败。

### Decisions and boundaries

- 组合检查只在每Turn最多4个左右的Golden Fixture候选上执行，不引入通用检索/排序框架或运行时开销。
- Verification Set只验证Preflight和Harness Scorer；不增加模型调用、生产数据、Task状态写入、Authorization或外部副作用。

### Verification

- `node --import tsx --test src/eval/restaurant-decision-eval-mutation.test.ts`：18/18通过，每个Mutation命中预期首错阶段与稳定错误码。
- `npm run eval:decision:fixture`：Strict Preflight和全部7个Fixture Journey通过。
- `npm run typecheck`、`npm run build`、`npm test`：通过；全量为109 tests / 5 suites / 0 failed。

### Next

实现Harness-only Model Contract：版本化Prompt/Schema、Fixture Context交付、输出校验、一次Schema重试和Provider失败分离；随后先跑3个Episode的受控DeepSeek Smoke。

## 2026-08-10 — Progressive Decision S6–S8 scoring and allergy-card grounding

### Why

在接入真实模型前，Evaluator不仅要知道“是否理解并追问正确”，还必须能定位“检索了错误候选”“候选正确但选择不当”以及“候选卡无事实依据”。严重花生过敏尤其不能因候选数量或表达方便而绕过Hard Constraint，或把“餐厅仍需确认”遗漏为安全保证。

### Changes

- Golden Seed升级到v0.7。DGS06 T03/T04把三张可展示候选卡的`ALLERGY_CONFIRMATION_REQUIRED`写为结构化Gold：每项绑定Candidate ID和同一候选的`attributes` Fact；它要求显示“仍需餐厅确认”，不实现生产Consent或外部披露。
- 扩展Eval-only Prediction Contract：模型评测输出可表达`retrievedCandidateIds`、推荐Candidate ID与不足说明、State/Candidate Fact Ref、禁止声明标签和必要的候选卡披露；它仍不是Runtime Event、Task State、Authorization、Command或生产API。
- Preflight验证上述披露的Candidate、Fact、去重、可用Grounding及`attributes`证据边界。
- Fixture Scorer扩至S1–S8：S6比较固定Eligible集合并对明确Hard Constraint漏过滤给出`P0_HARD_CONSTRAINT_VIOLATION`；S7要求只从已检索集合选取、满足数量与所需多样性；S8分别检查Process/Result Grounding、禁止声明和必需披露。上游失败继续明确标记下游`BLOCKED_BY_UPSTREAM`。
- 扩展Mutation：错误Readiness、重复澄清、编造状态、过敏Hard Constraint漏过滤、越过检索集合选择及过敏确认披露缺失均稳定落到预期首错阶段。

### Decisions and boundaries

- `ALLERGY_CONFIRMATION_REQUIRED`只表达当前候选卡应告知用户“仍需餐厅确认”；它不等同于安全、预约、餐厅接受或用户同意对外披露。
- 当前S6严格比较固定Fixture Eligible集合，S7从同一轮模型声明的检索集合取候选；没有提前新增独立Search Runtime或Ranker抽象。
- S6–S8仍是`HARNESS_ONLY`。未改动Web、Task Runtime、Restaurant生产State、Parser、Model Gateway调用、Authorization、Adapter或外部写路径。

### Verification

- Strict Complete Preflight：Golden v0.7为`READY_FOR_EVALUATOR`，7个Episode、17个Labeled Turn、29个Candidate、417个Fact、0个Issue。
- `npm run eval:decision:fixture`：全7个Journey通过；S1–S4各17个Pass，S5为5个Pass/12个Not Applicable，S6为11个Pass/6个Not Applicable，S7为10个Pass/7个Not Applicable，S8为17个Pass。
- `npm run typecheck`、`npm run build`：通过；定向Eval测试23/23通过。
- `npm test`：91 tests / 5 suites / 0 failed。

### Next

补齐Evaluator Verification Set（Fixture覆盖缺口、同质选择、无依据声明等）和Harness-only Model Contract；两者完成后才运行受控DeepSeek Progressive Decision Baseline。

## 2026-08-10 — Eval-only Reducer and S1–S5 scoring slice

### Why

Golden Set通过Strict Preflight后，下一步不是立即调用DeepSeek，而是先证明评测器会正确合并多轮状态、定位首错并拒绝不完整输入。否则真实模型失败无法区分是模型、数据还是评分器问题。

### Changes

- 新增Harness-only `applyDecisionStatePatch`：应用Set、修正、清除、正/负偏好与Hard Constraint增删，且不修改输入对象；它不依赖Task Runtime或Restaurant生产State。
- 新增Eval-only Prediction Contract与S1–S5 Scorer：比较当前Patch、累计State、Readiness、动作类型和澄清Topic；上游失败后将下游明确标为`BLOCKED_BY_UPSTREAM`，每Turn输出首错阶段和稳定错误码。
- 新增Fixture Oracle命令`npm run eval:decision:fixture`。它先运行Strict Preflight，再用Golden结构化输出驱动全7个Episode；当前S1–S4各17个Pass，S5为5个Pass和12个Not Applicable，7个Journey全部Pass。
- 新增4个测试：Reducer修正/清除/保留、Perfect Oracle、三类单点Mutation的首错归因，以及缺失Prediction fail closed。

### Decisions and boundaries

- Prediction Contract仅是Eval输入，不是模型可直接写入的Task Event、Authorization、Command或生产API。
- 当前S1采用精确Patch比较，先保证确定性归因；字段级F1、S6–S8候选/选择/Grounding、完整Mutation Set和Model Contract仍在后续切片实现。
- Fixture Oracle的100%只证明评分管线与Golden自洽，不是DeepSeek或产品多轮能力得分。

### Verification

- `npm run eval:decision:fixture`：Strict Preflight通过，Fixture Oracle全7个Episode通过。
- `npm run typecheck`、`npm run build`：通过。
- `npm test`：87 tests / 5 suites / 0 failed。

### Next

实现S6–S8 Candidate Retrieval、Selection/Diversity与Grounding Scorer，并扩展Mutation Set；仍不连接真实模型或外部平台。

## 2026-08-10 — DGS06 completion and date-less Daypart Contract

### Why

最后一个Golden Episode确认了两个现有Contract未完整表达的需求：仅“晚饭”仍是应保留的时间事实，即使日期未知；“愿意远一点”只说明出行意向，不能替代出发点或地区。严重花生过敏也不能被“可提交请求”简单排除或承诺安全，而应以真实卡片提示保留为待确认备选，并在预约前获得敏感信息披露同意。

### Changes

- Golden Seed提升至v0.6，DGS06四个Turn写入Gold；首批7个Episode、17个Turn现已全部标注。
- DGS06先追问日期与人数，再对没有地理锚点的`FLEXIBLE`意向只追问Location Strategy；以Ueno为出发点后进入推荐。
- 6–8人范围被5人修正覆盖。明确不支持严重花生过敏的Yakitori Matsu被排除；Kappo Haru、Garden Room和可提交请求的Sakana Table可展示，但分别按Fixture事实提示餐厅确认，禁止安全保证。
- 在后续日料/不正式偏好下保留三种真实取舍，不伪造完美候选，也不向用户暴露内部证据分级。
- Preflight允许无日期的`DAYPART`保存已知用餐时段；`DAY`、`APPROXIMATE`、`WINDOW`和`EXACT`仍强制日期。新增正反向Contract测试。
- Golden Grounding标记：选择含严重过敏要求的候选后，预约前必须出现包含餐厅、日期、时间、人数、待披露过敏信息与“仍待餐厅确认”说明的Consent Card；本轮仅记录门禁，不实现产品交互或外部请求。

### Decisions and boundaries

- `FLEXIBLE`无`scope`不满足Recommendation Readiness；它保留“愿意出行”的用户事实，但必须补地理锚点。
- “可接受过敏请求”可作为明确标注待确认的备选，不能等同于安全可用；“来源说明有流程”也不构成安全保证。明确不支持才直接排除。
- 本轮的日期语义改动触及Preflight Contract，因此按验证规则运行Typecheck、Build和全量稳定回归。
- 仍为Harness-only：没有生产State、Web、Adapter、Authorization或外部写路径变更；真实模型Baseline尚未开始。

### Verification

- Draft与Strict Complete Preflight均返回`READY_FOR_EVALUATOR`：7个Episode、17个Labeled、0个Pending、29个Candidate、417个Fact、0个Issue。
- `npm run typecheck`、`npm run build`通过；定向Preflight测试15/15通过；`npm test`为83 tests / 5 suites / 0 failed。

### Next

实现Eval-only Decision State Reducer、S1–S9 Scorer和Mutation Set；完成后再执行受控DeepSeek Progressive Decision Baseline，仍不接真实Discovery或Booking。

## 2026-08-10 — Restaurant allergen information and disclosure-consent boundary

### Why

过敏不应成为所有餐厅搜索的默认问卷项，但一经用户明确提出就会同时影响候选真实性、对外披露和预约安全。日本外食的过敏信息并非统一强制标示，且厨房混入与菜单变动使“可接受请求”不能等同于餐厅可安全接待。因此需要在DGS06之外建立可复用的Restaurant产品规则。

### Decisions

- [Restaurant Booking Domain](../domains/RESTAURANT-BOOKING.md#过敏与特殊要求)成为候选卡过敏信息、特殊要求与预约前披露Consent Card的详细Source of Truth。
- 特殊要求是条件触发的安全字段：初步推荐不默认阻塞；用户声明严重过敏后成为Hard Constraint，明确不支持的候选直接排除。
- 候选卡按来源事实明确展示“未提供信息 / 可接受请求 / 来源说明有处理流程 / 明确不支持”，并附来源、查询时间和“仍需餐厅确认”的含义；不向用户暴露内部证据分级，也不承诺安全。
- 选择带已声明过敏限制的候选后，`Book this`必须先显示Consent Card，确认最小对外披露内容、可选补充说明、餐厅/时间/人数和本次预约或请求；用户拒绝披露时不得隐去Hard Constraint继续提交。
- 只有餐厅明确接受时，特殊要求才能标记满足；预约或备注提交本身仍只是`已提交请求`。

### Scope and boundaries

- 本轮只更新Domain、PRD、User Flow、Data/Security与Eval设计；不修改生产State、Schema、Web、Adapter、Authorization实现或外部写路径。
- 过敏原原始说明按敏感健康信息处理：仅当前Case使用，默认不进入模型日志、长期Memory或群体学习；真实实现前需完成隐私评审。
- 该决定细化现有单候选授权与特殊要求未确认规则，未改变Accepted ADR；不新增ADR。

### Verification

- Markdown相对链接检查通过；Restaurant Domain、PRD、User Flow、Data/Security和Eval均指向同一详细规则。
- 未运行代码测试：本轮没有改动代码、Schema、Prompt、Provider、构建输入或外部执行路径。

## 2026-08-10 — DGS05 core-ready recommendation without preconditioned taste feedback

### Why

人工审阅确认：当日期、时段、人数、地点和场景已足以开始搜索时，Agent不应等待用户先给出“不吃辣”“想安静”等额外偏好。推荐本身是帮助用户形成偏好的交互；未表达的口味不能被伪造成过滤条件。Availability也不应阻塞宽泛时段下的探索性推荐，只有确切时间或有界Window才进入匹配查询。

### Changes

- Golden Seed提升到v0.5，DGS05四个Turn一次性写入Gold；当前共13个Labeled Turn、4个Pending Turn。
- T01只保存DATE场景，最小追问日期与人数；T02保存`2026-08-11 / DINNER / Party 2`后只追问地点；T03保存Ebisu区域即进入`RECOMMENDATION_READY`。
- T03的四个Ebisu Fixture全部Eligible，包括辣味川菜；初次展示3–4家，以菜系、氛围和价格形成差异，并显式禁止声称用户已要求非辣。
- T04把`intimate`作为正向偏好、`tasting menu`作为明确排除项，收敛为Lantern Room；Atelier因仅套餐排除，另两家不满足新增亲密氛围偏好，并解释结果只有一家。

### Decisions and boundaries

- `RECOMMENDATION_READY`只需要可用的搜索上下文，不要求所有偏好已知，也不等于已验证Availability。
- 宽泛`DINNER`下可以展示来源实际返回的候选/Slot信息，但不能声称与确切时间匹配、真实有位或可订；Exact或有界Window才应驱动Availability过滤。
- 本轮复用现有Contract，只修改Harness Golden数据、定向测试和文档；未修改生产Parser、Prompt、Web、Runtime或Provider。
- 按分级验证规则，本轮不运行全量回归和Strict Complete；最近一次全量基线仍为DGS03后的79 tests / 5 suites。

### Verification

- 见[Test Log](TEST-LOG.md)同日DGS05条目；定向Progressive Decision测试、Draft Preflight和Markdown链接检查通过。

### Next

继续批量预标注DGS06。其4个Turn完成后，首批17个Turn全部有Gold，可运行Strict Complete并进入Reducer/Scorer开发。

## 2026-08-10 — DGS04 minimum clarification and feedback-convergence Gold

### Why

DGS04人工审阅确认：部分明确的聚餐需求不应立即推荐。Agent先保留已知的今晚、部门聚餐和居酒屋，只补人数与地点；核心字段齐备后再给容量合格且有差异的候选。后续“安静一点”和“不要吸烟”也不能被压成同一种偏好：前者用于排序，后者排除存在吸烟区的候选。

### Changes

- Golden Seed提升到v0.4，DGS04三个Turn一次性写入Gold；当前共9个Labeled Turn、8个Pending Turn。
- T01为`NOT_READY`，只允许追问Party和Location Strategy，不提前检索候选；T02保存8人及Shimbashi区域后进入`RECOMMENDATION_READY`。
- T02按容量保留Kado、Nagi和Hachi，排除最多6人的Roji；三家需体现价格、子类型、氛围、连锁属性及相对位置差异。
- T03把`quiet`写入正向排序偏好，把`fully non-smoking`写入硬约束；结果收敛为Nagi和Hachi，并要求解释严格条件下不足3家。
- Grounding明确区分候选事实：Nagi可称为安静；Hachi只能根据`relaxed / semi-private`和半包间事实描述私密性，不能声称已证实安静。

### Decisions and boundaries

- 宽泛Dinner仍只达到Recommendation Readiness；Fixture Slot可展示，但不等于确切时间匹配或真实可订。
- 严格条件后只有两家时不为凑3–5家重新加入容量不足或违反禁烟要求的候选。
- 本轮复用现有Contract，只改Harness Golden数据、定向测试和文档；未修改生产Parser、Prompt、Web、Runtime或Provider。
- 按分级验证规则，本轮不运行全量回归和Strict Complete；最近一次全量基线仍为DGS03后的79 tests / 5 suites。

### Verification

- 见[Test Log](TEST-LOG.md)同日DGS04条目；定向Progressive Decision测试、Draft Preflight和Markdown链接检查通过。

### Next

继续按Episode批量预标注DGS05，再处理DGS06；全部17个Turn完成后运行Strict Complete并进入Reducer/Scorer开发。

## 2026-08-10 — DGS03 outlet discovery and approximate-time Gold

### Why

DGS03人工审阅确认：用户明确给出Brand或Restaurant后，Agent可以先搜索分店位置，再基于实际发现询问人数和时间；不能要求用户预先知道分店，也不能在工具检索前泄漏Candidate Pool事实。同时“around 7:30pm”不是Exact，也没有人工给出的Window边界。

### Changes

- Golden Seed提升到v0.3，DGS03两个Turn一次性写入Gold。T01先执行Sora Dining Outlet Discovery，搜索后才展示Ginza/Shinjuku并询问Party与Time；T02保留Restaurant和日期，新增Exact Party 3及`APPROXIMATE / preferred 19:30`。
- 新增Harness-only `outletDiscovery` Oracle，把目标分店发现与Availability Eligibility分开；Preflight要求它绑定`RESOLVE_BRAND_OUTLET`或`CHECK_TARGET_RESTAURANT`动作。
- Decision Time新增`APPROXIMATE`和`preferred`。Preflight拒绝把Approximate静默编译成Exact或发明`earliest/latest` Window。
- Candidate Fact增加`outlet-name`，使分店名称展示也有明确Fact Ref；Sora Pool增加相似名称但非目标餐厅的干扰候选。
- DGS03 T02为`RECOMMENDATION_READY`：两个Sora Outlet均可展示Fixture Slot，但`CHECK_AVAILABILITY`仍保留给Exact或有界Window，禁止声称Slot匹配用户的确切时间。
- 当前Seed为7个Episode、17个Turn、29个Candidate、417个Fact Ref；6个Turn已标注、11个Pending。
- 标注验证改为分级：纯Gold数据/文案只跑定向Eval Contract与Draft Preflight；Contract、Schema、Preflight、Reducer或Scorer变化才跑Typecheck、Build和全量基线；Strict Complete只在全部Gold完成或进入Evaluator/Baseline前运行。

### Decisions and boundaries

- Candidate Pool是Oracle世界，不是模型在工具调用前可见的Context；提前引用分店属于Process Grounding错误。
- Outlet Discovery不证明人数、时间或Availability合格，两个阶段的失败必须独立归因。
- 已解析的有限Outlet集合可以替代用户预先给出Location；这只适用于明确Brand/Restaurant目标，不放宽OPEN/CATEGORY的Location要求。
- 本轮仍为Harness-only，没有修改生产Parser、Prompt、Web、Runtime、Restaurant Domain或Provider Adapter，不新增ADR。

### Verification

- `npm run typecheck`、`npm run build`：通过。
- 定向Progressive Decision Preflight测试：11/11通过。
- `npm test`：79 tests / 5 suites / 0 failed。
- Draft Preflight：`READY_FOR_ANNOTATION`，7个Episode、17个Turn、6个Labeled、11个Pending、29个Candidate、417个Fact、0个Issue。

### Next

按批量流程预标注DGS04。若现有Contract足够，DGS04确认后只运行快速定向检查和Draft Preflight，不重复全量回归或Strict Complete。

## 2026-08-10 — Domain Knowledge, Entity Freshness and Memory staging

### Why

Restaurant Progressive Decision Eval讨论暴露了一个MVP后补会丢失历史的问题：Praxis未来的差异化不只来自公共餐厅目录，而来自“真实问法、结构化需求、解决方法、候选曝光、用户反馈与Verified Outcome”的完整Domain闭环。与此同时，品牌分店、营业状态和Availability等外部事实会变化；每次完全重搜浪费请求、延迟和模型Context，长期缓存又不能自动作为Ground Truth。

### Decisions

- 将长期数据分为Domain Entity Observation、Domain Interaction Event、Aggregate Insight和Private User Memory四层；Conversation与Task State不充当跨任务Memory。
- 外部实体保存带Source、Source Entity ID、`observedAt`、Freshness和使用限制的Observation，而不是无来源的永久真值；稳定标识、品牌分店、营业信息、Availability和条款按风险使用不同TTL。
- Stage 2C在Golden Set、Evaluator、Mutation验证和DeepSeek Baseline之后、真实Discovery之前，增加Restaurant内部的最小Entity Observation与Interaction Event Contract。
- Interaction Event覆盖结构化需求、Agent动作、检索、曝光位置、反馈、选择和Verified Outcome引用；Learning层不默认复制完整Conversation原文。
- Stage 2C只采集并用于Trace、回放和离线分析。没有足量真实数据、曝光分母、隐私评审、偏差分析和离线Eval前，不启用群体Trending、个性化排序或自动在线学习。

### Boundaries

- 本轮只更新架构与Roadmap，不实现数据库表、事件生产代码、缓存、推荐排序、用户Memory或Provider Adapter。
- 首个实现保持Restaurant Domain-owned；不创建跨Domain Knowledge Graph、通用Memory Runtime、Feature Store或向量数据库。第二个真实Domain或测量结果出现前不抽象。
- Provider缓存、展示、署名和删除继续服从Source条款；缓存Observation不能支持过期的“当前营业”“当前有位”“保证可订”等声明。
- 该调整细化现有数据归属和Stage顺序，没有改变Accepted ADR、Outcome权威、授权边界或外部副作用路径，因此不新增ADR。

### Follow-up plan

1. 完成Golden Seed人工标注、严格Preflight、Reducer、阶段Scorer和Mutation验证。
2. 运行受控DeepSeek Progressive Decision Baseline，先根据证据决定生产对话逻辑是否需要修改。
3. 在真实Discovery接入前设计最小Restaurant Entity Observation和Interaction Event Schema、保留策略及Harness断言。
4. 接一个真实Discovery Source，以Freshness-aware复用和按用途刷新完成Live Read-only验证。
5. Pilot期间只积累经治理的数据；达到样本、隐私和偏差门槛后，再分别立项Aggregate Insight、Trending和Private User Memory。

### Verification

- 文档边界检查：Stage 2C仍只增加首个Restaurant纵向切片需要、且后补会丢失Provenance和交互轨迹的最小数据基础。
- 未运行代码测试：本轮没有修改代码、Schema、Prompt、配置、Provider或构建输入。

## 2026-08-10 — DGS02 batch Gold and strict-zero-result fallback pair

### Why

逐Turn把人工产品判断转换成Contract并立即跑检查，会让标注者等待机械工作，也会割裂多轮累计状态。标注流程因此改为完整Episode预标注、人工只审语义、确认后一次性编译。DGS02同时暴露了一个关键零结果分支：严格品牌、地点、时间和人数没有共同匹配时，Agent不能静默放宽要求，也不能只返回死路。

### Changes

- Golden Seed提升到v0.2。DGS02写入人工Gold：`2026-08-11 19:00`、6人、Kinshicho `AREA`、Mori Burger `BRAND`和`AVAILABILITY_READY`；两个满足品牌、Exact Time和容量的门店为Eligible，容量不足和其他品牌候选为Forbidden。
- 增加DGS07两Turn配对Episode及独立Candidate Pool：T01固定严格Eligible为空，提供“扩大地点但保留品牌”和“保留地点但改为Burger类别”两条单约束Fallback；T02由用户明确选择保留品牌并接受Kameido，只更新Location后重新检索。
- 增加Harness-only `PROPOSE_CONSTRAINT_RELAXATION`动作和`constraintRelaxation` Oracle；Preflight要求严格Eligible为空、1–2种不重复的单约束选项、候选不重叠且`requiresUserChoice`必须为`true`。
- 增加其他汉堡品牌、容量不足、时间不匹配和非Burger干扰候选，使品牌、地点、时间、人数和类别过滤都可实际评分。
- Seed现为7个Episode、17个Turn、7个Pool、28个Candidate和374个Fact Ref；4个Turn已标注，13个Pending。
- Annotation Guide改为Episode批量预标注流程：人工只审核需求、Readiness、动作、候选和推荐差异；代码结构、禁止动作、Fact Ref、ID映射和Preflight由实现者机械完成。36个以上Episode时才触发本地标注页面建设。

### Decisions and boundaries

- 严格Eligible非空时不得触发Fallback；零结果时每个Fallback只放宽地点或品牌之一，时间和人数保持不变。
- Fallback候选在用户选择前不进入严格Eligible集合，也不修改Decision State；用户选择后只更新其明确同意放宽的字段。
- `AVAILABILITY_READY`表示信息足以查询，不代表Fixture Slot是真实空位、保证可订或已完成预约。
- 本轮只改变Harness Dataset、Preflight和评测文档；没有修改生产Prompt、Web、Task Runtime、Restaurant Domain、Provider Adapter或外部执行，因此不新增ADR。

### Verification

- `npm run typecheck`、`npm run build`：通过。
- 定向Progressive Decision Preflight测试：9/9通过，包括DGS02、DGS07、缺失同意和严格结果非空时的fail-closed Mutation。
- `npm test`：77 tests / 5 suites / 0 failed。
- Draft Preflight：`READY_FOR_ANNOTATION`，7个Episode、17个Turn、4个Labeled、13个Pending、0个Issue；严格Preflight按设计只因13个Pending Gold返回`BLOCKED_PENDING_HUMAN_LABELS`。

### Next

按新的批量流程一次性预标注DGS03的两个Turn，等待整Episode人工确认后再写回。剩余Gold未完成前不实现真实模型Baseline。

## 2026-08-10 — DGS01 Gold and broad-daypart Slot semantics

### Why

DGS01的人工标注明确了一个容易混淆的产品边界：“明天晚上”足以进入推荐，但仍不是精确用餐时间。Agent可以在推荐卡展示候选来源已经提供的Slot，帮助用户下一步选择；如果把这一步标成精确Availability检查，Evaluator会错误奖励Agent声称Slot与用户尚未给出的确切时间匹配。

### Changes

- 将`DGS01-T01`从Pending改为人工`LABELED` Gold：东京日期`2026-08-11`、`DAYPART/DINNER`、Exact Party 4、Ginza `AREA`、Western food `CATEGORY`，Readiness为`RECOMMENDATION_READY`。
- 将Ginza、Yurakucho near Ginza和Marunouchi的4个Western Fixture列为Eligible；Gold要求展示3–4个候选，并优先形成`PRICE_BAND`和`CUISINE`子类型差异。
- 增加1个同区域、同日期且有晚餐Slot的非Western干扰候选，并列入`forbiddenCandidateIds`；避免类别过滤因Candidate Pool没有负例而无法评分。Seed总量更新为22个Candidate和291个Fact Ref。
- 将本轮唯一允许动作定义为`SHOW_RECOMMENDATIONS`；重复追问核心字段和`CHECK_AVAILABILITY`等动作列入禁止项。
- Slot窗口保留为允许引用的Fixture Fact，同时增加禁止声明：不得声称Slot符合用户的确切用餐时间、已验证真实世界Availability、保证可订或已经完成预约。
- 同步Eval Plan v0.4、Annotation Guide、Harness Design、Eval Skill和Roadmap；Golden Seed进度变为1个Labeled Turn、14个Pending Turn。
- 增加DGS01语义回归测试，固定Daypart、Area、动作路由、多样性轴和Slot Grounding边界。

### Decisions and boundaries

- `DAYPART`下展示已有Slot仍属于推荐表达，不等于执行精确Availability查询；只有Exact或有界Window满足`AVAILABILITY_READY`后，主动检查对应时段才使用`CHECK_AVAILABILITY`。
- 4个Eligible候选和1个非Western干扰候选均来自虚构Fixture；“展示Slot”不代表Live Read-only查询，更不代表真实空位或预约能力。
- 本轮只修改Harness-only Gold、测试和规划文档；没有修改生产Parser、Prompt、Web、Task Runtime、Domain State、Provider Adapter或外部写路径，因此不新增ADR。

### Verification

- `npm run typecheck`、`npm run build`：通过。
- 定向Progressive Decision Preflight测试：6/6通过。
- `npm test`：74 tests / 5 suites / 0 failed。
- Draft Preflight返回`READY_FOR_ANNOTATION`、22个Candidate、291个Fact、1个Labeled Turn、14个Pending Turn和0个Issue；严格Preflight按设计只因剩余14个Pending Gold返回`BLOCKED_PENDING_HUMAN_LABELS`。

### Next

继续由人工标注DGS02。剩余14个Turn全部完成并通过严格Preflight后，再实现Eval-only Reducer和阶段Scorer；当前不运行真实模型Baseline。

## 2026-08-09 — Stage 2C Golden Seed Contract and S0 Preflight

### Why

Eval v2已经确定分阶段因果链，但在真实模型运行前仍缺少机器可验证的数据Contract、人工标注入口和Seed Candidate事实。直接编写36个完整Case会让未稳定的字段和Scorer造成大规模返工；先建立6个Seed，才能让人工Gold、Reducer和Evaluator围绕同一结构迭代。

### Changes

- 新增Harness-only `DecisionEvalDataset` Contract，覆盖Decision State/Patch、Readiness、Action、Clarification、Candidate Pool、Recommendation Oracle、Grounding Fact Ref，以及Pending/Labeled两阶段标注状态。
- 新增Golden Seed v0.1：6个Episode、15个Turn，E1/E2/E3各2个，并覆盖`OPEN / CATEGORY / BRAND / RESTAURANT`；所有Gold保留为`PENDING_HUMAN_LABEL`。
- 新增6个Candidate Pool、21个虚构Restaurant/Outlet和278个结构化Fact Ref，用于后续S6–S8评分；没有真实餐厅、地图、Availability或Provider数据。
- 新增S0 Dataset Preflight，校验版本、ID唯一性、Tokyo时间、Decision State、Candidate/Fact引用、Pending门禁、Action冲突、Retrieval/Selection边界和Grounding引用。
- 新增`npm run eval:decision:preflight`供标注阶段运行；新增`npm run eval:decision:preflight:complete`作为进入Reducer/Scorer前的严格门禁。
- 新增Golden Seed Annotation Guide，明确人工决定语义和允许动作，代码只负责结构检查；同步Eval Plan v0.3、Harness Design、Eval/Test Skill、README和文档索引。

### Decisions and boundaries

- 标注者拥有Gold语义判断；实现代码不根据模型输出生成或修改Gold。当前`annotationFocus`只提示覆盖点，不是答案。
- Seed全部进入`REGRESSION`；Holdout在Evaluator稳定并扩充36个Episode时再独立创建，避免Seed开发过程污染Holdout。
- Preflight只做确定性静态校验，不调用DeepSeek、不读取`.env`、不写Task/数据库，也不接真实Discovery或预约平台。
- Candidate均为明确的Fixture世界事实；即使包含Availability字段，也不能报告成真实空位。

### Verification

- `npm run typecheck`、`npm run build`：通过。
- 定向Progressive Decision Preflight：5/5通过。
- `npm test`：73 tests / 5 suites / 0 failed；首次沙箱运行仅7个既有HTTP/SSE测试因禁止监听`127.0.0.1`失败，允许本机回环监听后完整通过。
- Draft Preflight返回`READY_FOR_ANNOTATION`且0个结构Issue；严格Preflight按设计返回`BLOCKED_PENDING_HUMAN_LABELS`和15个待标注Turn。

### Next

由人工按Episode标注15个Turn；每完成一个Episode运行Draft Preflight。全部Gold通过严格Preflight后，实现Eval-only Decision State Reducer、S1–S5 Scorer和首批单点Mutation，不提前调用真实模型。

## 2026-08-09 — Progressive Decision Eval v2 causal-stage iteration

### Why

Eval v2最初已经从单轮Slot Extraction升级为E1/E2/E3多轮决策，但四张Scorecard仍然是横向结果汇总。一次Journey失败时，无法稳定判断首因究竟是当前消息提取、历史状态合并、Readiness、动作路由、候选检索、选择排序、Grounding，还是Dataset、Provider和Harness本身。

对Connector、Browser和Memory Eval方法的复盘表明，端到端质量必须拆成可独立验证的生命周期：Connector区分是否触发、结果使用和Grounding；Browser区分正确接管、环境阻塞、工具失败与Agent失败；Memory区分读取、检索内容、应用、写入和增量收益。Praxis采用这一故障定位原则，但不照搬以LLM Judge为主的评分方式。

### Changes

- `Restaurant Progressive Decision Eval v2`提升到v0.2，建立`S0 PREFLIGHT`及`S1–S10`因果链，覆盖State Extraction、State Accumulation、Readiness、Action Routing、Clarification、Candidate Retrieval、Selection/Diversity、Response Grounding、Journey和Operations。
- 四张State、Dialogue Policy、Recommendation、Journey Scorecard改为阶段指标的汇总视图；每张分数必须并列显示有效样本、Preflight排除和`BLOCKED_BY_UPSTREAM`数量。
- 每Turn增加首错阶段、根因码、Blocked下游和`DOWNSTREAM_OBSERVATION`；允许失败样本用Gold状态或Gold候选池做诊断重跑，但诊断结果不得覆盖Baseline。
- 动作路由增加应触发/不应触发覆盖及Precision、Recall、F1；正确澄清被定义为`APPROPRIATE_INTERMEDIATE_SUCCESS`，不再按“没有完成推荐”计失败。
- 推荐链路拆为固定池检索、合格性过滤、集合选择/多样性和Grounding；上游检索失败不重复归因给Selection。
- 增加至少18个单点Mutation的Evaluator Verification Set、Context消融集和Scorer可信度规则；自然语言主观质量首版只做人审抽检，LLM Judge未经人工标签校准不得成为发布门禁。
- 同步Harness Design、Eval Skill和Roadmap Stage 2C的实现与完成标准。

### Decisions and boundaries

- Eval Plan继续是评测规范的Source of Truth；Dev Log记录关键迭代的时间、原因和取舍。两者职责不同且足以还原决策，不新增第三份Eval日志，避免重复维护和口径漂移。
- 本次仍是Harness-only设计，不修改Web、生产Parser、Restaurant State、Task Runtime、真实Discovery或预约路径，不需要新增ADR。
- Fixture Oracle、Real Model Mock World与Live Read-only分别报告；Provider、配置、Dataset或Harness问题不能伪装成模型质量零分。
- 确定性字段、状态、路由、候选和Fact Ref使用确定性Scorer。未来引入LLM Judge时必须先验证Scorer本身，而不是用另一个模型总分替代根因分析。

### Next

按新顺序实现Dataset/Preflight、Eval-only State Reducer、阶段Scorer和Mutation归因，再实现Fixture Retriever、Model Contract与6个代表性Episode。确定Fixture Oracle能识别单点故障后，才扩充36个Episode并发起受控真实DeepSeek Smoke。

## 2026-08-09 — Restaurant Progressive Decision Eval v2 initial plan (v0.1)

### Why

真实餐厅需求通常从“今晚吃饭”“明天和朋友聚餐”等低确定性表达开始。用户先明确时间、人数或场景，再通过少量追问和有差异的推荐形成菜系、地点、预算、氛围与排除项。当前8条单轮Intent数据和Exact Match评分主要验证Slot Extraction，不能评估这一渐进决策过程。

### Changes

- 新增Draft `Restaurant Progressive Decision Eval v2`，定义E1核心已明确、E2部分明确、E3高度开放三种初始确定性，以及`OPEN / CATEGORY / BRAND / RESTAURANT`目标粒度。
- 定义Recommendation、Availability和Booking三层Readiness，明确“明天晚上”“6–8人”和`FLEXIBLE`地点策略的标注语义。
- 定义36个Episode/至少100个Turn的首版覆盖矩阵、Regression/Holdout、稳定性重复运行、推荐Fixture和人工标注规则。
- 建立State、Dialogue Policy、Recommendation和Journey四张Scorecard、P0/P1/P2错误等级、分组报告和产品集成候选门槛。
- 现有8条数据降级为Single-turn Extraction Contract；2026-08-08的1条真实DeepSeek结果只作为Connectivity Smoke。
- Roadmap Stage 2C改为先实现Harness-only Eval v2并建立真实模型Baseline，再接一个Live Discovery来源；Baseline之后才单独决定生产对话状态是否修改。

### Boundaries

- 本次只修改Eval/Harness计划和工程文档，不修改Web、Task Runtime、Restaurant State、Parser、Prompt、数据集或Evaluator代码。
- Eval v2通过不能报告为产品已支持多轮偏好形成；所有Model输出仍不得创建Task Event、Authorization、Attempt或外部副作用。

### Next

评审并接受Eval v2规则后，从6个代表性Episode、静态Validator和Deterministic Scorer开始实现；Fixture管线通过后再扩充到完整数据集，真实模型调用继续使用显式付费门禁。

## 2026-08-08 — Persistent local configuration for repeated Eval

### Why

真实DeepSeek Eval会持续运行；仅依赖每次终端临时注入变量既容易遗漏，也不利于稳定复现。配置必须同时保持服务端边界和付费网络门禁，不能因此让普通测试隐式读取Key或连接真实数据库。

### Changes

- 新增可提交的`.env.example`，列出开发数据库、可选Pilot身份覆盖、DeepSeek Eval、成本估算及真实PostgreSQL smoke所需变量；新增的本地`.env`及其他`.env.*`一律Git忽略。
- `npm run dev`、`npm run eval:intent:deepseek`和`npm run test:postgres:live`使用Node原生`--env-file-if-exists=.env`加载本地配置；没有`.env`时命令仍可启动并在各自既有的必填配置/付费门禁处fail-closed。
- `npm test`、`npm run build`和Fixture Eval没有加载`.env`，以避免本地Secret改变普通测试或引入意外付费网络。
- README、Data/Security、Eval与Test Skill同步配置位置、边界和付费开关的恢复要求。

### Next

用户在本机复制模板并填写真实DeepSeek凭据后，先将样本限制为1条运行首个受控真实Intent Eval；结果应单独写入Test Log，不能与Fixture分数混报。

## 2026-08-08 — Stage 2B Persistent Agent Shell

### Why

Stage 2A只能在单进程内完成一次Fixture搜索，浏览器刷新、服务重启或换设备都会失去Task，也没有用户级Case、Conversation和Activity体验。Stage 2B需要先证明Personal Agent能够安全地“记住并继续”，再投入真实模型和Discovery Provider。

### Changes

- 新增`0005-agent-workspace` Migration，持久化Pilot用户、Session Token Hash、Conversation和Conversation Message；原始Access Token和Session Token不写数据库。
- 新增`PersistentRestaurantAgentApplication`与`PostgresAgentWorkspaceStore`，将`Conversation → Restaurant Case → Root Task`映射到现有`PostgresTaskRuntime`；Fixture Search/Revalidation Command经Durable Outbox Worker执行。
- Local Web/API替换为Pilot Session、Case列表/详情、Conversation Message、Candidate Selection和SSE Snapshot路由；删除未发布的Stage 2A进程内Task API，不保留兼容分支。
- 新增响应式Desktop/Mobile Web Workspace，展示Conversation、Restaurant Artifact、Case Status、Pending User Action和权威Event Activity。
- 实现Stage 2B Golden `W01–W05`，并增加页面Contract、缺失信息续聊和乐观并发场景。

### Decisions and boundaries

- Case、Activity和Artifact均为可重建Projection；Conversation中的Agent文本即使声称“已预约”也不能生成Task Event、Authorization、Attempt或Outcome。
- SSE采用建立连接时发送最新完整Case Snapshot的最小协议；Event Activity ID从持久化Event ID确定生成，不引入消息总线或独立Projection数据库。
- 当前身份仅是本地Pilot Access Registry，不是生产SSO；所有业务查询仍从HttpOnly Session解析可信`userId`，客户端不能自报用户。
- 仍为Fixture Model/Search，没有通知、真实Provider、Authorization入口、`EXTERNAL_WRITE`或预约副作用。

### Next

进入Stage 2C：先以固定数据集运行受控DeepSeek Intent Eval，再接一个经能力核验的Live Read-only Discovery来源；不在此之前扩展通用Workspace DSL或多Agent结构。

## 2026-08-08 — Web-first Personal Agent architecture reset

### Why

从Praxis的长期产品需求重新评审后，现有Task Runtime、Policy和Verifier被确认是现实事务的必要安全内核，但不足以构成完整Personal Agent产品架构。Desktop/Mobile Web第一阶段还需要跨会话恢复、用户可见Case、Activity、结构化Domain Workspace和前后台Context边界；继续直接进入Live Provider会验证搜索连接，却不能验证“Agent会记住并持续推进”的核心价值。

### Changes

- 新增ADR-0006，建立Agent Workspace、Durable Case Runtime和Action Control Plane三层边界；ADR-0001、0003和0005继续有效。
- 新增Agent Gateway and Workspace架构文档，区分Conversation、Interaction Session、Case、Activity、Artifact和Pending User Action。
- 明确MVP中Restaurant Case映射一个Root Task，Case是可重建Projection，不新增第二套Domain State或提前扩展通用Case Graph。
- MVP PRD和User Flows增加Responsive Desktop/Mobile Web、跨会话恢复、`Needs You`和Activity体验。
- Roadmap插入Stage 2B Persistent Agent Shell；原Live Discovery和Live Availability顺延为Stage 2C/2D。
- Interfaces、Data/Context/Security、Agent Orchestration、Task Runtime、Arch Guard、Harness和README同步新边界与阶段编号。

### Decisions and boundaries

- 本次只修改文档，不修改代码、Schema、Provider、模型调用或现实副作用行为。
- Agent Gateway仍位于TypeScript模块化单体中，不拆微服务，不采用KiroCrew、本地Agent Runtime或通用App Platform作为生产基座。
- Stage 2B继续使用Fixture Model/Search，先证明用户隔离、持久恢复、SSE和权威状态投影；真实DeepSeek和Provider从Stage 2C开始。
- Conversation、模型解释和Working Plan不是Task或Outcome权威；后台Run从结构化Case/Task State和最小Context重建。
- 通知渠道、第三方消息Surface、通用Artifact DSL和跨任务Memory不进入Stage 2B。

### Next

按Stage 2B单独编写实现计划，明确用户身份、Conversation持久化、Case Projection、Activity映射、SSE重连、Responsive Web和Harness验收；在该纵向切片完成前不继续扩展冻结的Runtime能力。

## 2026-08-07 — Stage 2A Local Fixture Search Web

### Why

Stage 1已能验证Runtime安全，但没有用户可操作的产品入口。Stage 2A需要用最小Web纵向切片证明“英文请求 → Intent → 候选 → 选择”能够穿过服务端、Domain和Runtime，同时不能假装已接入DeepSeek或真实本地平台。

### Changes

- 删除Restaurant `schema 1 → 2` State迁移、测试与缺失Trace默认补全；Restaurant State升级为Schema `3`，所有Event Trace现在必填且必须匹配Task Run。
- Restaurant状态机以`UNDERSTANDING`创建；`INTENT_PARSED` Event只在Parser验证后进入，缺阻塞字段进入`NEEDS_INPUT`，完整Intent进入`SEARCHING`。
- 新增Local-only Fixture ModelGateway和Fixture Restaurant Search，驱动现有`RestaurantIntentParser`与Task Runtime；没有Secret、网络调用、Authorization或`EXTERNAL_WRITE`。
- 新增`LocalRestaurantSearchApplication`、本地HTTP/HTML Server与`npm run dev`，支持创建Task、补充消息、查询Task和选择候选；选择后只到`AWAITING_AUTHORIZATION`。
- 新增`npm run eval:search:fixture`与本地HTTP API测试，覆盖完整输入、最小澄清和选择停在授权前。

### Decisions and boundaries

- Fixture ModelGateway是本地测试替身，明确返回`provider: FIXTURE`；不替代或模拟真实DeepSeek质量。
- Fixture Search候选的来源、价格、空位和条款全部标记为演示数据，不能用于预约或对外展示。
- Stage 2A直接使用Restaurant内的Fixture Search实现，不提取通用Search Runtime；实体合并、来源并发、预算、缓存和真实Availability等由Stage 2B/2C真实需求驱动。
- 删除旧路径遵循Pilot前无真实数据时不保留兼容层的项目规则；PostgreSQL建表迁移仍保留，因其服务于本地数据库初始化而非旧业务State兼容。

### Next

Stage 2B先以固定Intent Eval接通DeepSeek，再核验并接入一个真实只读Discovery来源。

## 2026-08-07 — Roadmap, implementation simplicity and expansion balance review

### Why

Stage 1已经建立了安全Runtime和较深的基础设施测试，Goal Graph、Scheduler与未来Domain Harness也为后续扩展提供了实证。问题不是提前考虑扩展本身，而是缺少投入上限和重新启动条件；继续按横向基础设施清单开发会增加不可见的代码和验证成本。需要同时保留扩展地基与最小端到端交付，并明确Pilot前不保留无消费者兼容路径。

### Changes

- 将Stage 1收口为已完成的Minimal Control Plane and Harness；跨Domain Registry、自动激活、生产Trigger Factory与Coordination状态机不再作为退出条件。
- 将Stage 2拆成Local Mock E2E、单一Live Discovery来源和单一Live Availability路径；Stage 3先连通Mock Booking，再只接一个Controlled Live-write Adapter；Stage 4按路线、取消、变更与Pilot逐层增加。
- 在`AGENTS.md`、Arch Guard、Planning和Test Skill中增加简洁实现、删除旧路径、纵向交付、避免推测抽象与适度测试规则。
- 区分普通fallback与安全不变量：不建立备用Provider、多级重试或兼容链；Authorization、幂等、`OUTCOME_UNKNOWN`和False Success保护继续保留。
- 明确Pilot前Schema默认直接更新代码与Fixture；只有存在生产数据、进行中现实任务或外部消费者时才建立迁移。
- 修正文档中PGlite场景数量与两个已实现合成Domain的状态。
- 增加三类扩展处理方式：难以后补的安全地基现在实现，未来能力现在只预留Design边界，第二个真实使用者或当前路径阻塞后再扩建。
- 为Goal Graph/Scheduler、Child Task Registry、生产Trigger、Coordination、Search Runtime与Multi-Agent记录明确的冻结状态和重新启动条件。

### Review findings

- 当前61个测试对Runtime、Policy、Verifier、PostgreSQL事务与Provider Contract的覆盖是合理的，但不能证明Web、DeepSeek质量、Search质量或真实Provider能力。
- Goal Graph、Scheduler和G01/G02被认定为已完成且有价值的有界架构探针；进一步扩展现在冻结，后续测试预算优先用于Web/API/Search同一纵向路径。
- Restaurant旧State迁移和缺失Trace兼容没有真实数据消费者，列入Stage 2A开始时的直接删除项；本次治理审查不修改业务代码。

### Next

开始Stage 2A：先删除两条Pilot前兼容路径，再建立英文Web到Fixture候选选择的最小本地端到端产品。

## 2026-08-07 — Stage 1I Synthetic Runtime Domains: Recurring Shopping and Long-running Case

### Why

Task Runtime的价值不只在Restaurant单次预约，还在跨时间等待、外部事件与用户再次介入。需要用合成Domain检验已有Task Definition、Trigger、Trace、Outbox和Lifecycle是否可复用，但不能把合成测试误称为第二个真实产品Domain，也不能据此继续抽象业务模型。

### Changes

- 新增Harness-only Recurring Shopping状态机：`MONITORING → AWAITING_CONFIRMATION → PREPARING_ORDER → MONITORING`。
- 新增该Domain的Trigger Event Factory，将持久化`RECURRENCE_DUE`映射为`CYCLE_DUE`；每个周期均回到`WAITING_USER`。
- Shopping确认只产生`PREPARE_SIMULATED_PURCHASE`，模拟完成后产生`SCHEDULE_NEXT_CYCLE`等待命令；没有`EXTERNAL_WRITE`或真实购买。
- 新增Harness-only Long-running Case状态机：准备、等待外部、请求材料、材料补齐、再次准备、解决。
- 通过PGlite持久化Runtime测试G01/G02，包括Trigger、版本、Trace、状态转换、Outbox Command及禁止外部写入断言。

### Decisions and boundaries

- 两个状态机位于`src/harness/synthetic/`，不属于产品Domain、不接真实API、没有Web/API入口，也不计为第二个真实使用者。
- 不以合成Domain为理由实现跨Domain Registry、万能实体或Workflow DSL；`CREATE_CHILD_TASK`和自动激活仍保留为proposed。
- Scheduler只投递Domain Event；当前Harness手动将`SCHEDULE_NEXT_CYCLE`映射为持久化Trigger，生产WAIT Command到Trigger桥接仍未实现。

### Next

在有第二个真实Domain前不扩大通用Runtime抽象；可先运行首轮受控DeepSeek Eval，或开始Stage 2的Search Runtime与只读Discovery纵向切片。

## 2026-08-07 — Stage 1H Restaurant Intent Parser and Controlled Real Model Eval

### Why

Gateway只证明请求可被受控发出，不能证明模型结果可被安全使用或被统一评测。需要让Restaurant Domain拥有Prompt和不可信输出校验，并让真实模型Eval复用Fixture数据集，而不是用手工演示替代质量基线。

### Changes

- 新增`RestaurantIntentParser`：输入包含Task ID、用户文本、Tokyo参考时间；输出仅为已验证Draft或结构化表单降级，不写Task State。
- 固定`restaurant_intent_parse` purpose、`v1` Prompt、`restaurant-intent-draft@1` Schema引用、10秒请求预算、500输出Token、`temperature: 0`和关闭Thinking。
- Prompt明确JSON格式、样例、Tokyo相对时间、阻塞字段、无事实不臆测，以及将用户文本视为不可信数据。
- JSON解析、`finish_reason=STOP`和Domain Validator三层校验；JSON/Schema不合格最多重试一次，Provider失败不盲重试。
- 收紧`RestaurantIntentDraft` Validator：拒绝未知根/嵌套字段、无效日历日期、空数组项、非整数JPY预算及“字段已填却声明缺失”的矛盾结果。
- 新增`npm run eval:intent:deepseek`。它复用8条Golden样例，强制`PRAXIS_ALLOW_LIVE_MODEL_EVAL=1`，可限制样本数，并记录模型调用、重试、延迟、Token和透明成本状态。

### Decisions and boundaries

- Parser是Domain语义，不提升为通用Workflow或Core抽象；它经注入的`ModelGateway`调用模型，保持Domain → Core的依赖方向。
- 模型输出即使通过JSON模式仍不可信；只有Domain Schema通过才能返回`PARSED`。后续应用层仍须决定是否创建Task和进入Search。
- 真实Eval是付费网络请求，默认拒绝执行；没有显式开关时在读取Key或构造Gateway前退出。价格未配置时报告`NOT_CONFIGURED`，不硬编码或猜测当前价格。
- 本轮未读取真实Key、未运行DeepSeek、未产生数据库、平台或预约副作用。

### Next

在用户显式配置后，先以1条样例运行真实DeepSeek Eval并归档独立结果；同时继续Stage 1的跨Domain Child Task、自动激活、Domain Trigger Factory和合成Domain验证。

## 2026-08-07 — Stage 1G DeepSeek Model Gateway Provider Contract

### Why

Intent Eval已经有数据集、Validator和计分器，但仍缺少一个不让模型跨越Runtime/Policy边界的服务端入口。先实现Provider Contract，才能在下一步把同一数据集接到真实DeepSeek，而不把Key、Prompt、重试或Provider错误散落进Domain或Web。

### Changes

- 新增Core `ModelGateway` Port：强制`taskId`、purpose、promptVersion、输出Schema引用、timeout、fallback和响应格式。
- 新增DeepSeek非流式Chat Completion Adapter；固定Provider URL，不向Provider发送Praxis内部Task ID。
- Key与模型名仅从服务端`DEEPSEEK_API_KEY`、`DEEPSEEK_MODEL`读取；缺失时fail-closed，不提供默认模型或前端配置通道。
- 将429、非2xx、网络失败、超时和畸形响应映射为稳定`ModelGatewayError`；不记录Provider响应正文。
- 新增不含Prompt/Completion正文的`ModelInvocationRecord`，记录Provider、模型、版本、Schema引用、延迟、Token、状态码和错误码。
- 增加Fake Fetch Connector Contract测试，覆盖请求序列化、配置缺失、限流、超时、畸形响应和脱敏Telemetry。

### Decisions and boundaries

- Gateway只负责传输、超时、错误分类和最小Telemetry；它不解析Restaurant Intent，不写Task State，不执行Tool或外部业务动作。
- `JSON_OBJECT`只约束Provider输出格式，仍是不可信输入；后续Restaurant Parser必须用现有Domain Validator重新校验。
- 本轮没有读取真实Key、没有网络DeepSeek调用，也没有宣称Provider连通或模型质量已验证。

### Next

实现Restaurant Intent Parser：构造版本化Prompt、调用Gateway、解析JSON、交给`RestaurantIntentDraft` Validator，再以受控开关运行真实模型Eval。

## 2026-08-07 — Stage 1F Restaurant Intent Eval Harness

### Why

自然语言理解是Restaurant Agent的入口质量门，但功能测试无法衡量模型是否漏掉日期、人数、区域或错误追问。应在接入DeepSeek前先固定数据集、Schema和计分器，避免模型接入后才临时定义“好”的标准。

### Changes

- 定义`RestaurantIntentDraft`：允许缺少阻塞字段，但限制时区、字段形状和缺失字段枚举。
- 实现不可信模型输出的Schema Validator；未通过时不能进入Runtime。
- 新增8条英文/中英混合Intent样本，覆盖Tokyo相对时间、预算、约束和四类阻塞字段缺失。
- 新增字段准确率、阻塞字段漏检、不必要追问、无效输出和P0错误计分器。
- 增加`npm run eval:intent:fixture`及三条Eval Contract测试。

### Decisions and boundaries

- `FIXTURE`结果只证明Eval管线和Golden数据集正确，不代表DeepSeek效果。
- 真实模型Eval必须经服务端Gateway、显式Key、固定Prompt版本和同一数据集运行；不在本轮伪造真实分数。
- Eval不产生Task State、搜索或任何外部副作用。

### Next

实现DeepSeek Model Gateway与显式受控的真实Intent Eval；没有Key时继续保留Fixture/Replay路径。

## 2026-08-07 — Stage 1E Persistent Trigger/Scheduler

### Why

长期事务和日常用品复购需要在未来时间被安全唤醒。不能由常驻模型Loop记忆时间；Trigger必须持久化、可重领、可去重，并能阻止陈旧状态被错误唤醒。

### Changes

- 增加通用Scheduled Trigger、Lease、Event Factory和Scheduler Contract。
- 增加Migration `0004-task-triggers`和PostgreSQL Trigger Store。
- Scheduler使用到期Claim、确定性`event:trigger:{triggerId}`、Trace传播、租约恢复和有界失败。
- 期望Task版本陈旧时Trigger进入`OBSOLETE`，不向已变化的Domain状态投递Event。
- 扩展真实PostgreSQL Smoke，使Booking子Task由Scheduler完成，再推进Goal聚合。

### Decisions and boundaries

- Scheduler只投递Domain Event；Domain决定Trigger何时创建、到期时表达哪种业务语义。
- Scheduler失败不会创造外部写入；真实定时进程、Webhook、周期计算和Shopping业务不在本轮范围。
- Accepted ADR不变，未引入模型Loop或跨Domain业务依赖。

### Next

实现三个合成Domain中的Recurring Shopping最小状态机，复用Scheduler验证周期唤醒和用户确认边界。

## 2026-08-07 — Stage 1D Goal/Task Graph

### Why

Recurring Shopping、Travel和协调类事务需要多个Task在同一用户目标下独立推进。Restaurant不能因此依赖未来Domain；Runtime需要先持久化关系、依赖和聚合规则。

### Changes

- 增加通用Goal、成员关系、依赖条件和Readiness Contract。
- 增加Migration `0003-goal-task-graph`，创建`goals`、`goal_task_memberships`和`task_dependencies`。
- 实现`PostgresGoalGraph`：Task只能属于一个Goal；支持父子指针、关键Task、同Goal依赖、环检测、Readiness和Goal聚合。
- 实现`G03-coordination-parent-child`：两个关键子任务均成功后Goal才达成；失败上游使依赖Task进入`BLOCKED`。
- 扩展真实PostgreSQL Smoke，实际创建Task Tree、依赖和Goal，再验证清理。

### Decisions and boundaries

- Goal关系存于独立Graph，不写入Restaurant Domain State，Runtime不依赖具体Domain。
- 当前只连接已创建的Task；`CREATE_CHILD_TASK` Command、Definition Registry和依赖满足后的自动启动仍未实现。
- 该切片不新增模型、用户授权或外部副作用。

### Next

实现Trigger/Scheduler的最小持久化与Fake Clock恢复路径，再用Recurring Shopping和Long-running Case合成Domain验证通用性。

## 2026-08-07 — Real PostgreSQL Smoke环境建立与验证

### Why

PGlite可以验证嵌入式SQL与事务语义，但不能替代真实PostgreSQL进程、`pg`连接池和本机网络连接验证。

### Changes

- 安装PostgreSQL 17并仅启动本机临时实例，监听`55432`端口；未注册开机自启服务。
- 创建隔离的`praxis_smoke`数据库，使用显式写入开关运行`npm run test:postgres:live`。
- Smoke通过后只读确认两项迁移已应用，`tasks`、`task_events`和`task_commands`均为0行，临时Task已清理。

### Decisions and boundaries

- 本机`praxis_smoke`是开发验证数据库，不含生产数据、真实用户信息或Provider凭据。
- 本次只证明本机真实PostgreSQL连通和Smoke路径；不代表生产高可用、权限模型、备份或负载测试完成。

### Next

继续实现Stage 1剩余的Goal/父子任务与Trigger/Scheduler，不把数据库环境建设扩展成生产部署工作。

## 2026-08-07 — Stage 1C Recovery Coordinator

### Why

`RECOVERY_REQUIRED`只能阻止External Write盲重试，但如果它不进入Domain状态机，Restaurant Task会永久停在`EXECUTING`。恢复层必须保守地把“可能已经提交”的情况转入验证，同时保持Runtime与具体Domain解耦。

### Changes

- 实现通用`RecoveryCoordinator`和Recovery Queue Contract，使用租约Claim待恢复Command。
- Recovery Event固定使用`event:recovery:{commandId}`，先持久化Event，再把Command标为`RECOVERY_DISPATCHED`。
- 增加Restaurant Recovery Event Factory，把不确定的`COMMIT_BOOKING`映射为`COMMIT_UNCERTAIN`。
- Restaurant Task随后进入`OUTCOME_UNKNOWN`并生成一个`VERIFY_BOOKING`；不会生成第二个`COMMIT_BOOKING`。
- Outbox Reconcile改为匹配确定性的`event:command:{commandId}`，避免把System Recovery Event误认为Adapter结果Event。
- 增加Schema Migration `0002-recovery-coordinator`和PGlite端到端恢复场景。

### Decisions and boundaries

- Core Coordinator只负责Claim、Dispatch、去重和完成标记；Domain决定恢复Event含义。
- Recovery失败只重试Event投递，不重试外部预约写入。
- 真实PostgreSQL、生产Queue进程和运营侧人工调查仍未验证或实现。

### Next

继续Stage 1的Goal/父子任务与Trigger/Scheduler最小实现，再用合成Domain验证Runtime通用性。

## 2026-08-07 — Stage 1B PostgreSQL、Outbox与Worker恢复保护

### Why

内存Runtime无法证明服务重启、重复投递和Worker崩溃时不会丢状态或重复预约。需要把Task State、Event和Command放进同一PostgreSQL事务，并为External Write建立比普通重试更保守的恢复路径。

### Changes

- 增加参数化SQL数据库Port与基于`pg`连接池的生产Adapter；事务使用同一Checked-out Client。
- 增加版本化PostgreSQL迁移，创建`tasks`、`task_events`、`task_commands`和迁移记录表。
- 实现通用`PostgresTaskRuntime`，原子写入State、Event和Outbox Commands，支持乐观锁、重复Event和Definition版本检查。
- 实现Outbox Lease、完成、失败、租约过期恢复和Causation Reconcile。
- 实现`DurableCommandWorker`：确定性结果Event先持久化，再完成Command。
- 无副作用Command失败或租约过期后可有界重试；External Write没有结果Event时进入`RECOVERY_REQUIRED`，禁止重新Lease。
- 增加PGlite数据库集成套件，覆盖事务回滚、Outbox插入失败、重复Event、陈旧版本、读Command重领、External Write恢复保护、Worker失败和Restaurant Runtime实例重建。
- 增加默认关闭的`npm run test:postgres:live`，要求显式测试数据库URL和写入确认，并清理临时Task。

### Decisions and boundaries

- PGlite只验证同一套Postgres SQL和事务行为，不作为真实PostgreSQL、备份、权限或网络故障验证。
- 当前环境没有PostgreSQL服务或容器Runtime，因此真实PostgreSQL smoke未运行。
- `RECOVERY_REQUIRED`现在是持久化Command状态；自动驱动Restaurant进入Verify仍需Recovery Coordinator。
- 本轮没有模型、Browser、真实预约平台或现实事务副作用；Accepted ADR不变。

### Next

实现Recovery Coordinator，将External Write的`RECOVERY_REQUIRED`安全映射为Domain恢复Event和Verify Command；随后补Goal/父子任务、Scheduler与合成Domain，完成Stage 1剩余退出条件。

## 2026-08-07 — Stage 1B Trace、Proof与Run Artifact

### Why

在PostgreSQL Event Store和Outbox落地前，先固定一次运行、Execution Attempt、Evidence和Outcome之间的因果关系，避免把无法追溯或无法迁移的数据结构写入生产持久化。预约成功必须由确定性Domain Verifier证明，不能信任Adapter或模型自行宣布。

### Changes

- 为Task Snapshot、Event和Command增加Schema `1` Causal Trace，覆盖`runId`、`attemptId`、`correlationId`、`causationId`和`actor`。
- Runtime为旧Mock Event补充稳定Trace默认值，并把Event的Correlation/Causation传播到Command。
- Policy通过后、Commit前创建Execution Attempt；Commit和Verify Command绑定同一Attempt。
- 将Booking Evidence语义从Core移回Restaurant Domain，实现`BookingProofBundle`和确定性Completion Verifier。
- Restaurant State升级为Schema `2`，增加Schema `1 → 2` Evidence Fixture迁移。
- Mock Verification增加字段冲突和错误Attempt模式；两者均只能进入`OUTCOME_UNKNOWN`。
- Restaurant Harness可导出包含Fixture、Trace、Policy、Authorization、Evidence、Side Effect和Outcome的Run Artifact。
- 扩展测试入口以收集Domain测试；当前基线为26 tests / 4 suites，其中11个为Restaurant Mock Harness场景。

### Decisions and boundaries

- Causal Trace属于通用Runtime Contract；Restaurant完成字段和Proof语义留在Domain，不建立万能Evidence模型。
- Event Trace为兼容旧Fixture暂时允许缺失；生产持久化Event必须完整保存。
- Run Artifact当前只返回Mock内存对象，不写文件、不包含真实PII，也不代表Replay或Live能力已实现。
- 本轮没有DeepSeek、数据库、Browser、网络请求或真实外部写操作；Accepted ADR不变。

### Next

设计并实现PostgreSQL Event Store、事务Outbox和Command Worker，使当前Trace、Attempt、Proof与Side Effect边界可以在进程崩溃后恢复。

## 2026-08-06 — Agent Harness生态调研归档

### Why

外部Agent项目开始集中建设Runtime、权限、沙箱、Evidence、Verifier和长任务恢复。需要记录其中对Praxis有价值的工程机制，同时避免把Coding Agent的Multi-Agent和工作台复杂度未经验证地带入Restaurant Booking MVP。

### Changes

- 新增Agent Harness生态项目调研记录，整理可明确识别的公开GitHub项目和对Praxis的映射。
- 记录Completion Conditions、Booking Proof Bundle、Causal Run Journal、fail-closed Capability和Harness Run Artifact等设计候选。
- 明确Multi-Agent、通用工作台、自进化Harness和任意Shell Sandbox当前不进入MVP。
- 在文档索引增加Research与讨论记录入口。

### Decisions and boundaries

- 本次只归档研究结论，不修改Accepted ADR、Roadmap或生产接口。
- 外部项目作为模式参考，不作为已选依赖或经过生产验证的能力。
- 后续采用任何设计候选前，仍需更新对应Architecture文档并按Planning Skill定义验收。

### Next

在Stage 1生产持久化设计时评估Event/Command因果元数据、Restaurant完成条件和可回放Harness Run Artifact。

## 2026-08-05 — Stage 1首个Mock垂直切片

### Why

先用Restaurant这一真实Domain验证通用Runtime、授权、执行与Outcome边界，避免在DeepSeek、真实平台和数据库接入前形成不可回放的Agent Loop或过早的万能抽象。

### Changes

- 建立Node.js 24 + TypeScript模块化单体脚手架和可重复的typecheck/test/build命令。
- 实现通用`TaskDefinition`、内存Task Runtime、Lifecycle、Event去重、乐观版本与Command Log。
- 实现MVP一次性Authorization Policy、Side Effect Ledger与并发/重放幂等保护。
- 实现Restaurant结构化Intent之后的选择、Revalidation、授权、Commit、Verify和Unknown状态机。
- 实现Mock Search、Availability、Booking Executor、Verifier、Fake Clock和Restaurant Harness。
- 自动化8个Bootstrap场景；没有真实API、Browser或外部写操作。

### Decisions and boundaries

- 本切片采用内存存储，只验证行为，不替代PostgreSQL、事务Outbox和Queue。
- UI的一次`Book this`后续可以组合选择与授权；Runtime仍把选择、Revalidation、Authorization和Policy保留为独立Event/Command边界。
- 明确失败会清除活动Attempt并返回选择；不明确结果保留Attempt并禁止换候选。

### Next

设计并实现生产持久化、事务Outbox与Worker恢复边界；之后进入DeepSeek Intent Parser和Search纵向闭环。

## 2026-08-05 — 开发前文档体系初始化

### Why

Praxis 已从方向讨论进入产品定义和原型实施前阶段，需要在coding前固定MVP范围、通用Task Runtime、Search、模型边界、授权、执行、验证和Harness依据，避免后续Agent根据零散对话自由发挥。

### Changes

- 建立`docs/INDEX.md`和产品、架构、Domain、Integration、Harness文档。
- 建立5个Accepted ADR。
- 建立`AGENTS.md`以及arch-guard、planning、test、eval、post-change-verify skills。
- 建立Roadmap、Dev Log和Test Log。
- README增加开发文档入口。
- 保留全部根目录日期讨论文档。

### Decisions captured

- Tokyo英文Web餐厅预约为MVP。
- 30秒目标内返回最多3家真实可订候选。
- 用户只选择并授权一家，不自动换店。
- DeepSeek为首个模型后端，但无状态和副作用权。
- 通用Task Runtime + Domain Packages；单Agent；模块化单体。

### Next

按Roadmap进入Stage 1：先建立Runtime和Harness，再接真实搜索与预约平台。
# 2026-08-18 — Restaurant Semantic v17 Strength Contract and Holdout Audit

### Why

v16的开放`criteria`仍以词面`REQUIRED` / `PREFERRED`表达强度，无法表达“违反即实质错误”与“可权衡偏好”的产品语义。首份私有Clean Holdout还需要明确、不可逆的曝光状态和可审计配置，而不引入新的服务或状态系统。

### Changes

- 新增ADR-0009并以其取代ADR-0008的强度决策：Criterion strength改为`HARD` / `SOFT` / `UNSPECIFIED`，并把相对时间、相对地点、闭合参与者集合和近似预算的通用解释固定在v17 Prompt policy中。
- Proposal / Draft / Eval Schema升为`3`，Restaurant State升为`6`，Prompt升为`v4`，Scorer升为`3`；旧未发布路径直接替换，不保留兼容分支。
- 扩展已暴露的合成Regression至15个turn，覆盖HARD、SOFT、否定、相对时间、人数推断、修正、条件删除与地点覆盖。
- 在既有exclusive baseline artifact上增加`datasetStatus: EXPOSED` / `exposedAt`，并记录Dataset SHA-256、git commit SHA、scorer版本和prompt/schema hash；已有artifact时runner拒绝再次作为`CLEAN_HOLDOUT`运行。
- 增加只做字段和形状变换的私有标注adapter，以及不读取Gold语义的JSON document-stream结构解析。

### Decisions and boundaries

- 新版本使用`codex/restaurant-decision-v17`，保留v16分支作为可比较历史。
- Semantic Interpreter仍只输出不可信Proposal；Compiler、Runtime/Reducer、Decision Kernel、Policy、Authorization和Provider能力边界不变。
- 私有数据、artifact和错误详情均保持Git忽略；结构Preflight不会用于Prompt或实现的case-specific调优。

### Next

已修复私有多轮标注的数组结构；严格Preflight现可解析15个session、25个turn。随后确认10个重复ID来自simplified单条case adapter把同一source ID同时作为session和turn ID，已改为生成结构性session ID，未改动Gold。经用户授权完成一处最终Gold一致性修正后，strict Preflight为15 session / 25 turn / 0 issue；私有case和字段详情不进入Git记录。

唯一Clean Holdout Baseline已按冻结配置运行。runner在首次模型调用前写入`EXPOSED` marker；25个turn中15个实际模型调用全部成功，但0个turn通过、15个首错为`SEMANTIC_RESULT`、10个为上游阻断。结果现为`RESULT_EXPOSED`，不得重跑或用于同一数据集调优。

## 2026-09-05 — 仓库整改与浏览器诊断最小切片

落实整改清单A类，新增ADR-0015来源证据范围与ADR-0016本地eval持久profile例外；精简Skills阅读/验证职责，校正README、配置及Roadmap，保留历史路线归档。单页探针替代旧多URL入口，复用Runtime，增加开始/结果记录；Hybrid早期失败按阶段留痕。修正interactive单开关的临时profile行为，增加真实Chromium动态Fixture。保留原有未提交修改；未改Golden、Holdout、既有artifact或模型Prompt。C类重构及真实页面适配待后续切片。

## 2026-09-05 — 自动化测试去重与维护规则

盘点35个测试文件的入口与场景声明，重点核对Harness授权、Policy/Verifier跨层覆盖、Scorer/Runner、Provider/Router与Web断言；本次不是全部测试逐行冗余证明。确认H03/H04步骤和断言完全相同，H02同一路径仅增加候选数量断言，合并为H02/H03/H04一个测试，保留全部独立断言和场景标识。移除Web固定760px CSS源码断言并修正测试名称，保留页面返回/Fixture标识/未登录401；响应式表现仍需真实浏览器视觉验证。

保留的相似覆盖各有不同故障入口：Policy规则与Harness接入；Verifier证据冲突与Runtime OUTCOME_UNKNOWN；Parser门店识别与Adapter在识别失败时阻止空位输出；Router直接失败与Resolver耗尽后的失败归因；Scorer纯评分与Runner阶段停止。数据库迁移测试保护仍支持的真实旧Schema，不按“旧版本”字样删掉。冻结探针与真实浏览器Fixture继续使用既有独立入口，不通过隐藏测试缩小默认数量。

Test Skill新增维护/退役规则：先查已有覆盖、说明独立失败依据、避免按模块机械新增、替换路径同步删旧、跨层按故障机制保留、交付说明覆盖去向。AGENTS、Planning与Post-change引用该职责，不加数量配额或新治理工具。Golden、Holdout、既有artifact未改，生产实现未改。

## 2026-09-06 — 全量测试正文审查

补齐前轮范围不足：35个测试文件、5808行正文、173个测试声明逐项审查，另读独立PostgreSQL Live Smoke。完整处置与保留理由见[审查快照](TEST-SUITE-REVIEW-2026-09-05.md)，该历史记录不要求后续每次开发维护全表。

删除重复schema常量测试、伪称Reducer故障的成功子集、合并Tabelog同phone冲突setup；删除重复Google挂起fetch和第三次相同SSE读取。既有测试补Booking schedule、逐项Evidence缺失、持久profile四种开关、结果落库先于outbox完成、身份无phone与稳定ID等断言；去除Prompt原文匹配与固定Task事件版本依赖，修正名称过度承诺。Smoke清理全部尝试并聚合失败，只在测试与清理成功后报告pass。Golden、私有Holdout、已有artifact和产品实现不变；测试入口脚本的失败汇报行为已修正。未提交或推送。

## 2026-09-06 — Tabelog搜索路径有界诊断

用户授权排查v2rayN routing调整后Tabelog仍挑战的问题。复用单页探针，并在Git忽略的`.eval-artifacts/tabelog-network-diagnostic/probe.mjs`编写一次性只读脚本；固定当前网络、fresh Chromium profile，记录document状态、Cloudflare challenge响应标记和少量浏览器信号，不保存HTML、Cookie、token、节点配置或个人profile。默认三次导航，`--path-check`另一次无query对照，每次导航20秒、启动10秒及启动后25秒关闭上限；遇challenge停止该次访问。未修改生产Adapter、用户routing或持久profile。已定位搜索路径403 challenge与首页200的差异；网络/IP和自动化信号的单独贡献仍未建立。

## 2026-09-06 — Tabelog英文搜索入口与候选链接修复

后续用户提供TUN下Chrome成功搜索tokyo的准确英文URL。同一fresh headed Chromium成功打开该URL；只给旧query添加`/en/`也从403变200，随后`sw=Ginza`及无匹配测试词分别返回名称匹配餐厅与零链接，确认英文关键词参数。直接替换Adapter旧`/rstLst/?sk=`为`/en/rstLst/?sw=`，不添加旧路径fallback；同步脱敏规则仅保留英文关键词。

真实页面还暴露`list-rst`通配将评论数链接识别为餐厅，占据最多5个候选的预算；收紧到名称标记，保留已支持的明确identity data属性。既有测试加入评论/图片负例、实际导航URL断言并同步challenge脱敏Fixture，无新测试文件、无数量增长。修复后fresh headless单页200并解析5个餐厅详情URL。未改浏览器指纹、profile、网络分流、State、授权或slot规则；无需ADR。此次切片验收为英文搜索可读和餐厅链接抽取，完整H001/身份/空位仍待独立验证。

## 2026-09-06 — TableCheck公开发现与真实reservation surface

旧TableCheck Adapter把候选英文名称拼成两个guide slug，并继续拼接reservation路径；历史H001证明该策略既不是发现，也不能可靠到达同一门店。本切片改为TableCheck公开`/en/japan/search`，携带候选名称及已有Google坐标，只从渲染结果卡收集guide URL；名称相关性仅限制只读详情页数量，不构成实体证据。

每个发现页面仍由详情JSON-LD/DOM/tel link与Google exact phone或normalized name+full address建立HIGH。详情页只可使用实际`reserve`链接，或明确的嵌入Availability结构；不再派生任何guide/reservation slug。诊断加入搜索页、发现结果URL、实际/规范详情URL、字段来源和规范化比较、reservation target与四类来源失败码。Grounding只对`TABLECHECK_*`保留这些provider失败码，原有Tabelog generic entity行为不变。

本机只读观察验证带坐标的Sushi Inase搜索可返回正确Shibuya与Shinjuku同名分店、Sushisho Issekisancho也出现在结果中；两家已读guide页公开电话与Google一致。完整H001只运行一次：Semantic、Agent和Google成功，但第一个动态TableCheck搜索耗尽既有25秒Browser deadline。未进入详情/预约页，故未形成HIGH、slot、availability或`PRESENT_RESULTS`。本切片未修改Tabelog代码、Browser预算、HARD规则、Authorization或任何写路径。

## 2026-09-07 — 受控浏览器执行与本地 Live Read-only 组合

按`BROWSER-EXECUTION-AND-LIVE-SEARCH-PLAN`的A/C切片实现两来源共用`BrowserTaskExecutor`与最小`browser_read_action@1`。执行器只向模型暴露脱敏文本和观察版本绑定的目标引用；代码继续控制来源、导航、只读点击、权威日期/人数、预算、取消和关闭。站点方法与通用路径复用同一会话，Router取消改为等待来源收束，避免timer race后后台动作。ADR-0017记录为`Draft / authorized local-eval implementation`，没有改变Accepted预约或授权设计。

为DeepSeek strict wire 的全字段要求增加了canonical适配：`COMPLETE`/`REQUEST_HUMAN_HELP`可携带当前观察引用作为传输占位，但只在引用真实且没有权威字段时剥离；伪造引用仍拒绝。真实H001随后揭示Google国内`03-...`与Tabelog JSON-LD`+81-3-...`被错误判冲突，故在两个来源的既有phone normalizer中只转换显式日本国际前缀；仍只有exact phone或name+full address可达HIGH。

本地Web增设显式`FIXTURE`/`LIVE_READ`服务端组合：Live缺gate或必需服务端配置立即失败，默认Fixture保持不变；Web与H001使用同一Google/Browser availability组合，显示grounded结果或稳定失败，不提供预约、登录、PII、支付、远程接管或部署。没有新增通用Browser框架、Provider、写路径、模型供应商或Domain。

最终H001 Live Read-only真实读取Google、TableCheck/Tabelog与现有DeepSeek。Google区域证据正常，Sushisho Isseki Sancho在Tabelog详情以规范化exact phone达到HIGH；TableCheck动态搜索页仍不可用，Tabelog availability转至当前不支持的外部Provider。没有slot、Offer或`PRESENT_RESULTS`，不能报告H001成功。未提交、推送或创建远端分支。

## 2026-09-07 — TableCheck可恢复搜索页交接与错误页归因

收紧TableCheck `PAGE_UNAVAILABLE`：只接受title或primary heading的明确HTTP错误文档，不再扫描整页正文，因此结果数字或普通`not found`文案不会误终止。搜索页可读但固定提取没有guide链接时，provider保留同一`BrowserTaskExecutor` session交给已有受控模型路径；诊断记录交接原因、脱敏观察、模型动作和动作后重观察。若仍无可验证门店，使用`TABLECHECK_DISCOVERY_INCOMPLETE`，与真正页面不可用、无结果、模型失败和预算耗尽分开。没有新增Provider、执行框架、写路径或降低identity/HARD/slot规则。

本次原始H001实际不需要TableCheck接管：三个搜索页直接提供guide链接。两个候选以Google exact phone达到TableCheck HIGH，流程继续到嵌入Availability页面；日期/人数后置确认仍失败，故没有slot或Offer。该结果证明固定发现已恢复，不证明模型接管或H001成功。未提交、推送或创建远端分支。
## 2026-09-08 — H001 连续候选调查与可信展示

本切片保留既有Google、TableCheck、Tabelog与受控浏览器边界，将业务Agent的可用性检查限制为每批最多三家，候选池仍保留全部去重发现结果；前三批未形成合格结果后，Agent在同一冻结条件、同一总预算内继续调查第四批，而不是清空既有检查记录、重复前三家或要求用户改变条件。餐厅Agent strict 结构化回复的上限从300调整为512 token，以容纳10个候选的不可截断工具参数；本地Action Validator仍是权威边界。Browser任务共享整轮模型调用计数，Router在每个读循环开始/结束显式初始化该计数，因此换批或换来源不能刷新总额。

原始H001仅在完成这些诊断修正后运行一次：artifact为`.eval-artifacts/restaurant-hybrid-live-read/2026-09-08T07-41-45-298Z-3bd0ad52-bdc3-4fe1-8bb1-e19fd41737bc.result.json`。Google发现10个去重候选；Agent依次检查3、3、3、1家，最终对KINKA Sushi Bar Izakaya 渋谷以Google place ID `ChIJz9NsIKmMGGAR6LA78zkpeGY` 的结构化Shibuya地址和TableCheck exact phone建立HIGH，同一公开来源回读2026-09-08、2人和19:00 slot，形成read Evidence与Offer，随后`PRESENT_RESULTS`。全程232,348ms、6次Restaurant Agent决策、9次Browser Model决策；没有登录、PII、预约提交、付款、取消或其他外部写入。该时点库存结果不证明通用Web UI已做真实交互验收，也不代表其他日期/餐厅可用。
## DEV-2026-09-09-HYBRID-DIAGNOSTICS — 可复现执行诊断与本地持久化前置检查

触发证据是H001已有真实`PRESENT_RESULTS`但没有独立rubric归因、Web Live启动将错误的`DATABASE_URL`交给迁移。新增`restaurant-hybrid-read-diagnostic-evaluator@1`：它只读取已保存Hybrid artifact，独立检查权威条件、证据、重复候选调查、最终声明与资源记录；每项输出阶段、观察、原因、根因假设、确定程度、证据引用和影响。执行与评估分别写文件，补评不改原artifact，评估故障也不改变执行结果；完整rubric、主观排名和价格未知仍明确未评估。

Hybrid runner现在记录非敏感git SHA/dirty状态、浏览器环境、Skill哈希、预算、模型调用和请求摘要哈希，不再保存原始用户输入。Local workspace在迁移前验证`DATABASE_URL`必须是带主机和数据库名的PostgreSQL URL，避免把API URL误交给`pg`。相对日期物化也改为同步替换冻结场景中所有依赖日期的文本断言，修复H002/H003的结构化日期与eligibility描述分离。未新增Provider、模型、浏览器框架、外部写路径或H001专用规则。

## DEV-2026-09-09-HYBRID-DIAGNOSTICS-V2 — artifact事实关联与异常收尾

Review证明`@1`只检查证据类别存在，错误日期、人数、时段、LOW identity和过期evidence仍可通过；它还误读了不存在的`diagnostics.providerAttempts`，并把缺失轨迹或空resource object当作正常。`restaurant-hybrid-read-diagnostic-evaluator@2`改为只检查presentation实际引用的candidate-scoped records：同一candidate、HIGH identity、provider/sourceEntity关联、area、正向HARD、完整日期/适用人数/完整time window、offer source和以`presentedAt`判断的freshness。明确冲突为`NOT_SATISFIED`，缺记录/无已接受契约为`NOT_EVALUATED`；不再从产品终态反推正确性。

Provider attempts现在从当前runner实际写出的`trajectories[].executionMetadata.providerAttempts`读取，并输出稳定路径引用，局部失败即使在最终成功时也保留。runner的成功与catch收尾都先保存execution artifact、再调用同一个after-finish evaluator；评价故障只生成独立失败sidecar。完整rubric、主观质量、价格和否定HARD来源证据没有扩建，保持未评估。未运行Live、付费模型、浏览器或任何外部写路径。

## DEV-2026-09-09-HYBRID-DIAGNOSTICS-V3 — slot、观察时间与权威记录边界

Review继续证明`@2`会把“证据窗口内有任意slot”与“实际Offer的slot已被证据支持”混为一谈，也只检查expiry而不验证observation时间。`@3`要求每个Offer的时间存在于同一provider/sourceEntity availability evidence的`visibleSlots`，并以`observedAt ≤ presentedAt < expiresAt`校验evidence，Offer则以`checkedAt`进行相同顺序校验。缺字段不伪造冲突，明确未来观察、无效排序或过期才拒绝。

同时最终条件比较只认`finalSnapshot.domainState.intentDraft`（Restaurant Runtime当前权威intent字段）；它缺失时标记`NOT_EVALUATED`，不从trajectory的历史context或`PRESENT_RESULTS`反推“条件传错”。这改变诊断语义，故Evaluator与rubric均升为`@3`；旧evaluation不被覆盖。未改产品Evidence/Verifier/Provider标准，未运行Live或付费模型。

## 2026-09-09 — 本机 PostgreSQL 开发与 Smoke 接线

本机已有的 PostgreSQL 17 数据目录已启动；创建仅供本地持久Workspace使用的`praxis_web`数据库，并复用既有专用`praxis_smoke`数据库。`praxis_web`已应用不可变的0001–0009 Migration，Fixture Workspace首页可由命令级本机连接串启动；真实Smoke验证Runtime、迁移、Goal/Task Graph与Scheduler，并在结束后删除全部临时Task。本轮没有修改源码、Migration、`.env`或任何Secret，也没有执行Live来源、模型、预约、支付、取消或其他外部业务写入。`praxis_smoke`不是生产、staging或Pilot数据库；本机服务可用不等于生产部署、备份/恢复、权限或持续运行验证。

## 2026-09-09 — Local Web Live Read-only actual acceptance

在命令级显式`LIVE_READ`、两项Live gate和`LOCAL_CHROMIUM`下，停止已有Fixture server并以同一`praxis_web`启动Local Workspace；不改写`.env`、不落盘凭据。真实浏览器新建Case并提交未来Shibuya omakase需求。该流程的持久轨迹保存5个模型决策、Google Discovery产生的10个候选，及4轮`GENERIC_BROWSER`受控来源读取中的17条TableCheck/Tabelog outcome；Provider的`AVAILABLE`、`UNAVAILABLE`和failure均继续由Domain Grounding判断，Web未将其中任一条未完整grounded的观察渲染成可预订结果。总5分钟预算到期后Loop记录`TIMEOUT`、Task进入`WAITING_USER / NEEDS_INPUT`；浏览器刷新从PostgreSQL恢复该终态、候选、来源链接与Activity。没有预约提交、第三方登录、付款、取消、PII输入或其他外部写入；此结果不等同于H001的成功artifact，也不宣称Web Live qualified result成功。

## 2026-09-09 — Shared Web/H001 Live budget and correct terminal attribution

此前Web组合硬编码12步、12次Browser model call、每候选6次和300秒，而H001独立runner使用30步、120次、每候选20次与20分钟；同一语义请求因此没有相同调查机会。新建`LIVE_READ_INVESTIGATION_BUDGET`作为两个实际调用方的唯一预算来源，包含Google、来源会话、浏览器模型／操作和Agent loop上限；没有扩建Provider、写路径、重试或兼容分支。

Review还确认Reducer把`TIMEOUT`、`STEP_LIMIT`和`REJECTION_LIMIT`错误映射为`NEEDS_INPUT`并生成澄清文案，且模型／执行失败也错误要求用户解决系统问题。现在这些系统终止都转为`FAILED`、删除`pendingUserQuestion`、持久保存稳定failure code及真实reason；`NEEDS_INPUT`只保留给缺失或冲突的需求以及明确`ASK_USER`。`PRESENT_RESULTS` Validator没有放宽。

## 2026-09-09 — Availability display freshness and read-only recheck

ADR-0018把原先混用的`expiresAt`语义拆开：`restaurant-availability-display-freshness@1`以每条实际观察为起点提供10分钟展示窗口，来源期限只能缩短；展示、Offer构造和持久State重读不能续期。未来预订仍必须重新核查门店、日期、人数、时段、套餐、价格及重要条款，未建设提交能力。

Runtime保留旧观察，重查证据通过前序evidence引用关联；展示过期、明确无位与来源失败不再互相覆盖。只允许展示证据过期或用户显式刷新已展示候选时进行受限只读重查，沿用现有浏览器/预算/取消/无进展链路，不新增定时刷新或站点fallback。Agent Context升为`@3`，由代码给出当前时间、展示资格、缺口和重查理由；合格结果优先展示，同一被拒绝动作立即停止而不循环耗尽预算。Local Web加入只在`PRESENT_RESULTS`显示的刷新按钮和受版本保护的API；无预约、支付、换店提交或PII路径。

真实Web验收还发现并修复两个执行链问题：Google Client与Router遗留的8秒独立deadline改为共享30秒structured-read上限；刷新pending状态优先覆盖旧展示资格，且一次`AVAILABILITY_CHECKED`后从State清除，避免旧证据重呈现或同一刷新循环。实际来源trace证明新观察、`USER_REQUESTED_REFRESH`、策略版本与前序证据关联均已写入；最后的清理修复只完成离线回归，尚未再消耗Live预算复验单次页面恢复。

## 2026-09-10 — Refresh closure and H002–H005 static diagnostic

刷新目标现在是一个明确的完整集合：存在未完成用户刷新目标时，Validator允许只检查剩余目标而不被另一个新鲜结果阻断，同时拒绝部分`PRESENT_RESULTS`，每个候选收到新的AVAILABLE、UNAVAILABLE或UNKNOWN检查后只清除自身标记。Router把同候选的历史availability evidence全部带入重查关联，避免中间UNKNOWN覆盖最新check后丢失审计链。未新增Provider、fallback、后台任务框架或任何写路径。

最终代码在新的3211本机Live Workspace完成浏览器验收：未来Shibuya omakase请求以真实模型、Google与TableCheck进入`PRESENT_RESULTS`；一次页面“Refresh availability”触发新的TableCheck读取并再次进入`PRESENT_RESULTS`，浏览器reload从PostgreSQL恢复结果、来源链接与Activity。H002的负向HARD（无辣、无火锅）尚无可审计的排除事实契约；H003–H005要求`NEAR_USER`但冻结案例没有经授权坐标，故只完成静态预检，未冒充运行或假定位置。

## 2026-09-10 — Fact-grounded read-only H002–H005 slice

本轮以ADR-0019把不要求预约的餐厅推荐与空位搜索分为同一执行链上的两种证据profile：前者不再要求人数、空位检查或Offer，而由Validator和诊断器要求HIGH identity、区域、每项HARD事实与目标时段适用的来源营业时间；后者的slot、Offer和展示时效要求不变。Google Places的最小读取字段新增常规营业时间，Grounding同时生成HIGH Google identity、显式主营类型和可解析时段的营业事实；“现在营业”、未解析时间或无slot都不产生空位结论。

H002新增版本化、案例专属的类型排除口径（hot pot / shabu shabu / sukiyaki；Sichuan / Hunan），只根据来源的明确主营类型/菜系判断；匹配禁止类型为冲突、没有适用事实为未知，绝不使用店名或网页缺关键词推断。东银座公共坐标仅传入H003–H005 eval runner，并在artifact标注`EVALUATION_LOCATION_RADIUS`；产品Web新增一次设备定位输入、精度/采集时刻绑定Case，位置拒绝或失败由普通手输地点继续，Activity不记录精确坐标。没有新增Provider、站点专属fallback、预约/付款/登录、后台调度或浏览器框架。

复核artifact后纠正了先前“只写started”的错误判断：三个H003运行都写入了完整`.result.json`和evaluation sidecar，因错误重复运行而违反每例一次授权，现停止继续运行。三次均为30步、12个候选、12次TableCheck和12次Tabelog只读尝试后`STEP_LIMIT / FAILED`；每个候选是`UNKNOWN / AVAILABILITY_SOURCES_EXHAUSTED`，不是无位。它们还一致暴露Semantic把冻结HARD的`team dinner`/`good for drinks`改写或降为SOFT，独立诊断的权威条件为`NOT_SATISFIED`，最终展示和所需证据均为`NOT_EVALUATED`。H002/H004/H005尚未启动。离线切片完成后未改写历史Live artifact、Fixture、凭据或个人位置。

H002在最终代码上执行一次完整只读诊断（55,618ms）：Semantic漏掉冻结`party_size`并把`first date`改写为`suitable for a first date`，使条件诊断为`NOT_SATISFIED`。Google只发现一条没有适用Higashi-Ginza事实的候选；三次Google读取额度耗尽后，Agent仍重复同请求搜索至30步，未触发预约来源读取。终态为`FAILED / STEP_LIMIT`，没有候选展示、Offer、空位或无位结论。H004/H005未启动。

## 2026-09-10 — Goal-driven Restaurant read path

ADR-0020将`partySize`从交付标准中移除：Semantic Proposal的`TARGET`明确保存`RECOMMENDATION`或`AVAILABILITY`；前者可在人数存在时仍按地点、HIGH identity、HARD来源事实和适用营业时间展示，后者缺人数则要求补充而不会降级。删除Hybrid runner的`applyCaseScopedCriteriaPolicy`及H002 Eval case-fact policy；Frozen H002澄清改为普通用户条件，执行和评价不再按案例编号写业务分支。

Google检索继续只使用正向发现词，负向HARD条件只在候选后的来源事实层处理。具体`primaryType`对显式类型／菜系范围可记录同源`verifiedNegativeCriteria`或`violatedNegativeCriteria`及判断依据；宽泛类型和缺关键词保持未知。Agent Context加入稳定的Google discovery可用状态；`GOOGLE_SEARCH_BUDGET_EXCEEDED`写入任务失败信息且Validator阻止换词继续调用。没有新增Provider、浏览器框架、预约、支付、登录、定时任务或外部写入。本轮不重跑已消耗授权的Live。

## 2026-09-10 — Exhausted discovery no-progress closure

补齐此前只依赖Agent Prompt和Validator的最后一层停止保护：若Google发现预算耗尽且本次运行尚未产生任何候选，Coordinator不再请求下一次模型决策，而是记录`AGENT_LOOP_NO_PROGRESS`并进入`FAILED`。该错误说明没有合法的剩余只读路径，不是用户条件不清楚；它不重置预算、不追加Provider调用，也不改变已经产生候选的正常后续调查路径。Mock Adapter仅新增可注入稳定失败码，以验证真实Router错误归因，不参与产品执行。

## 2026-09-11 — Bounded candidate fact investigation

新增通用`INVESTIGATE_CANDIDATE_FACTS`只读动作，供事实型推荐在候选缺主营类型或适用营业时间证据时使用。Agent只能从代码投影的未调查候选中选择；Validator限制已知、去重候选和每批三家，Reducer将实际观察、UNKNOWN和证据引用保留在同一Task State。Router绑定权威Search Intent和候选，当前Google实现只接受返回的同一Place ID并回填其结构化类型/营业事实；未返回同一ID、缺ID、来源失败或额度耗尽均为candidate-scoped UNKNOWN。每次读取与Discovery共享`maxGoogleSearches`累计额度，故不会借事实调查重置调用配额。没有新增Provider、站点fallback、浏览器框架、slot/Offer、预约、支付、登录或外部写入。官网等非Google来源的Browser事实读取仍是明确未完成能力。

若共享Google额度在事实读取前已经耗尽，Adapter不再发出第二个请求；它为该候选记录`GOOGLE_SEARCH_BUDGET_EXCEEDED / UNKNOWN`，Reducer同步稳定的任务失败码，使Agent Context立即关闭新的Discovery入口。已有合格展示证据不被此状态改写，仍可按Validator完成展示。

所有当前composition（Fixture、Mock Harness、Local Web、Hybrid Live）现都注入candidate fact Port：Fixture/Mock没有真实来源页时返回明确的candidate-scoped `UNKNOWN`，而不是把模型允许的动作变成`AGENT_EXECUTION_FAILED`。Live仍使用Google同源事实读取；这不把Fixture声明为来源事实，也不触发任何Live调用。

## 2026-09-11 — Stable source facts and task-scoped Google budgets

Google candidate fact reads now use Place Details by the saved Place ID, not a second name/address Text Search. `websiteUri` is retained only as a Google-listed pointer. A bounded `GoogleThenWebsiteFactRead` then reuses the existing BrowserTaskExecutor for that URL and accepts JSON-LD facts only after exact candidate name/address binding; Google Maps URLs, visible prose and model output cannot produce a restaurant fact. This adds no write, login, reservation or site-specific fallback path.

The negative-HARD grounding error is removed: a non-overlapping `primaryType` no longer verifies a negative cuisine/type condition. Google state is task-run scoped (`sourceReadState`) instead of inferred from whichever last failure happened to be stored, and a process-wide local-web Google adapter can no longer exhaust a second task's counter.

Two final-code Web Live runs then exposed an independent prior gap: the product's named-area path has no place-resolution evidence. Google returned `Ginza` address components for both `Higashi-Ginza` requests; fail-closed equality correctly prevented presentation, but also prevented the candidate-fact/website stage. This is not addressed by widening the type/website TTL or by asking the user to repeat the same location. It needs a small, evidence-bound place-resolution slice; no rerun is authorized automatically.

## 2026-09-11 — Cited named-place and public-source fact investigation

ADR-0021 replaces the previous address-label substitute for a named nearby place. The Google adapter resolves the named place under the existing per-run Google budget, records its observed coordinate/radius/source ID, and grounds candidate distance from that coordinate. It requests user disambiguation only for multiple exact source-name results with coordinates; no East-Ginza alias or hidden evaluation coordinate enters product logic.

`GoogleThenWebsiteFactRead` now uses an already observed Google `websiteUri` only when a current recommendation fact is missing, including after the shared Google budget is exhausted. JSON-LD remains a fast path, while bounded visible type and weekday-hours observations can produce the same candidate-bound fact record after name-plus-address evidence succeeds. Address matching tolerates punctuation/order formatting through exact containment or ordered number components but rejects name-only and conflicting outlets. The source URL, observed time and DOM fingerprint remain evidence metadata; raw page text is not retained as normal artifact content.

For explicit negative restaurant-type criteria, the model can issue only a cited judgment over concrete observed type facts. It cannot write State; the composite returns normal evidence and bounded model usage to the Router trajectory. Broad labels and uncited output remain unknown. The diagnostic evaluator now recognizes recorded user/timeliness rechecks as authorized rather than duplicate availability reads, and fact-only cards/failed summaries no longer use availability wording. No Live run, browser source access, booking, login, payment, cancellation, credential change or push occurred in this development slice.

The same Web refresh endpoint now dispatches a goal-specific event. A fact-only recommendation reopens only the displayed candidates for `INVESTIGATE_CANDIDATE_FACTS`; an availability request retains the existing slot refresh. The corresponding pending target set blocks `PRESENT_RESULTS` until every target has one new fact/slot observation, including `UNKNOWN`; a recommendation refresh cannot accidentally call availability. This uses the same Router, state and Agent loop rather than a case-specific executor.

## 2026-09-12 — Current citation, evaluator coverage, and Live Web run lifecycle

Corrected the last current-fact citation hole: after a recommendation fact refresh, presentation now cites only the current fact-check evidence rather than all historical candidate facts. Fact refresh requests carry the same explicit `USER_REQUESTED_REFRESH` reason into Router metadata, and evaluator @7 checks duplicate fact investigations as well as availability reads. This retains historical evidence without letting it act as current proof.

ADR-0023 adds the minimum Live Web lifecycle without a queue: accepted Live input returns its persisted active Case immediately; the existing SSE channel receives the final update; a user stop aborts the parent read signal through Router/provider calls and records `AGENT_LOOP_CANCELLED`; an unowned in-flight Case found after restart ends with an explicit interruption. A subsequent user message first stops the old read, then uses the ordinary Semantic → Compiler → Reducer path. Fixture mode stays synchronous. No booking, login, payment, cancellation at a provider, or external write was added.

## 2026-09-14 — Semantic failure is a durable Web read outcome

真实Web H002/H003观察到Semantic Interpreter的`MODEL_FAILURE`会在创建Conversation后抛出，导致Task保留`UNDERSTANDING`、UI只收到HTTP错误且没有artifact。该路径把系统模型限制错误归因成了未完成的用户Case，也绕过了普通Web的“执行结果与独立Eval分开保存”契约。

现在`restaurantEventForMessage`把非`PROPOSED`解释结果转换为最小、准确的`SEMANTIC_INTERPRETATION_FAILED`事件；Reducer将它持久化为`FAILED`，包含稳定状态码但不保存Provider错误正文。Application在不启动Agent/Provider循环的前提下追加失败摘要、通知SSE/Case观察者，并经已有artifact入口保存结果和独立Evaluator sidecar。没有引入重试、案例分支、Provider fallback或新的评分系统。`W10`使用真实PGlite Application、Semantic→Reducer、HTTP Web和artifact/evaluator接线，仅替换模型传输为稳定失败，证明该失败闭环。

## 2026-09-14 — Shared Live-debug Google request budget and accounting

`LIVE_READ_DEBUG_INVESTIGATION_BUDGET`取代原先名称和语义不一致的`maxGoogleSearches=3` / 未使用`maxGooglePlaceDetails=0`配置。Web与Hybrid runner从同一个显式调试配置读取`maxGoogleRequests=100`；它只适用于明确授权的Live调试，不成为产品默认配额或账户额度声明。地点解析、Discovery和Place Details以task `readRunId`共享一个累计计数器，失败的已发送请求在调用前计数，换候选、检索提示、阶段或Provider不会重置；新run才隔离。

Google Adapter在每个成功read metadata中导出三类计数和总数，Router在Provider失败时也把最新计数写进trajectory，Web和Hybrid artifact分别导出上限与实际用量。稳定码明确区分本地`GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED`、429 `GOOGLE_RATE_LIMITED`、403 `GOOGLE_SERVICE_QUOTA_OR_PERMISSION`和`GOOGLE_NETWORK_FAILED`；未知费用保持`UNKNOWN`。未改20分钟、30步、120浏览器模型调用、取消、无进展、重复动作或只读边界，也未运行新的Live调用。

## DEV-2026-09-12-READ-PATH-REVIEW — 横向审查与验证规程

在`e504a3f`干净工作区基线审查两次最新提交，并用当前生产函数/类离线复现跨层问题；[冻结审查](READ-PATH-REVIEW-2026-09-12.md)记录8组发现、已改善部分及具体关闭条件。本轮未修产品代码。将“跨模块集成 → 独立结果/诊断核验 → 本地与有界Live验证”写入现有Test skill，Eval skill维护引用链、条件保真、合法重查和评分反例要求；Planning与Post-change仅关联检查点，不在AGENTS或新框架中复制规则。STATUS明确区分开发规程已落地与产品缺口尚未修复。未新增测试文件、未改Golden/私有Holdout/历史artifact，未运行Live、付费模型、数据库写入或Git提交/推送。

## 2026-09-12 — Current fact lifecycle and shared source-fact composition

ADR-0022替代ADR-0021中“同序门牌数字可单独绑定”的接受规则。当前推荐展示只使用候选最新事实Check列出的证据；历史事实仍保留，但新UNKNOWN、冲突或不满足不会被旧正向事实覆盖。Router从同一Validator派生展示引用，避免把同候选的所有历史事实重新塞进新卡片。

命名地点解析不再把Google首个相关结果当成地标；只有精确、带坐标的名称匹配可形成位置证据。网页门店绑定要求名称加地址包含，或门牌序列加可用地域词对应，因此同名同门牌的不同城市页面保持UNKNOWN。JSON-LD身份快捷路径与可见事实合并，身份本身不会提前停止缺口调查；事实型目标不再伪造日期、人数或时间窗口。

派生类型判断以`MODEL_JUDGMENT`记录，而不是复制第一条来源的provider或entity ID；它必须引用同候选、已身份绑定的原始事实。Hybrid与Web共同构造Google Details → 同源网站 → cited judgment组合，且与availability共用一轮的浏览器模型计数。Evaluator/Rubric升为@6，检验派生链、用户明确字段丢失和枚举的重查理由。未运行Live、付费模型或写操作；F8异步执行/取消/中断恢复仍未实现。


## 2026-09-14 Hybrid Live 诊断：目标口径、位置上下文及时间字段

H001–H005各一次真实只读Runner已执行；仅记录诊断，未修改业务实现。确认当前目标Prompt与H001/H003冻结期望不一致，Runner评估位置仅配置在Google下层而未接入Task权威上下文，以及真实Proposal漏AREA/DATE、H005 UTC/Tokyo时间错误。未复现上一轮MODEL_FAILURE，无qualified展示。细节与资源见同日TEST-LOG的批次报告；不将安全停止报告为通过，也不据此否定历史H001成功。

## 2026-09-14 — Hybrid composition binds evaluation location before Agent execution

将Hybrid CLI顶层的`Interpreter → Compiler → InMemory Runtime → Agent → Router`初始化提取为共享`createHybridReadComposition`，CLI与离线集成测试共同调用；Provider、浏览器与模型仍由调用方注入，未增加测试专用业务执行器。Runner对冻结`NEAR_USER`评估在语义事件后发出`EVALUATION_LOCATION_BOUND`：Reducer仅接受`nearby`且没有既有坐标的权威Draft，把固定公开坐标记录为`source: EVALUATION`，随后才让Agent决策。它不改变Web设备位置、手动地点输入或产品默认位置。

新的真实组合回归使用独立HTTP来源样本和明确标记的模型传输替身，穿过实际Google Discovery、三个Place Details、Grounding、事实读取、展示引用和既有Evaluator；没有手工塞入Evidence。无位置分支证实来源HTTP未被调用。另有100请求累计/隔离回归，直接覆盖被替换的3次上限。H001原始文本与冻结目标口径冲突仍只记录，未通过改Prompt、Gold或case分支掩盖。

## 2026-09-14 — Deterministic Tokyo time and diagnosable read completion

ADR-0024记录本轮共同契约：Semantic Interpreter只输出受限时间语义，Compiler以受信任参考时刻和`Asia/Tokyo`生成实际日期/时段并保存解析依据；`AFTERNOON`统一为12:00–17:00。Agent不再因已有推荐候选被提前禁止作合法、有价值的只读调查；完整参数的推荐可选查空位，但Reducer将明确无slot绑定到实际日期、时段、人数指纹，禁止同一请求用历史营业事实重新展示，来源未知仍保持未知。

诊断器/Rubric升为`@8`：原始执行结果先保存，再分别表达合格展示、可确认无结果、用户补问和内部执行失败；内部错误不再伪装成用户侧正常无结果。没有添加站点fallback、LLM Judge、外部调用、付费模型、写操作、提交或推送。


## 2026-09-14 确定性时间Live复验首错

本轮只诊断未改实现：新时间传输Schema的raw可选属性不满足当前DeepSeek strict要求，导致五个真实Hybrid请求在生成前统一HTTP400。失败已落档并用实际导出Schema离线复现；需要修复传输契约及Gateway边界回归，不能归因用户语义或来源无位。

## 2026-09-14 — DeepSeek strict semantic-schema repair

修复`DATE`和`TIME_WINDOW`显式值分支的同一契约不一致：`raw`既已列在strict transport的`properties`，就必须同时列在`required`。显式日期/时间的TypeScript contract和本地Proposal Validator现也要求非空`raw`；既有Prompt本来已要求该用户原表达，补上了对应断言和Fixture/公开Regression输入。未关闭`strict`、未增加重试或Provider绕过。

DeepSeek Gateway测试现在捕获真实发送的完整Restaurant Schema并递归验证每个对象的`required`与`properties`完全一致，能在网络调用前捕获同类错误；它不是伪造模型响应的局部解析测试。该修复只恢复模型请求可被Provider接受的传输契约，不构成新的Live模型、来源或业务能力验收。


## 2026-09-14 — Schema修复后的真实跨案例诊断

本轮仅运行与诊断，保留Terra全部未提交业务修改。HTTP400已经修复，Live实际证实位置接线及扩大Google额度可用。新首要回归是H001较旧factChecks引用集合过滤新TableCheck HARD事实，虽已有同店/omakase/slot证据仍不能展示，并继续无新增候选搜索。H003时间组合代码覆盖显式日期；H004漏日期绕过营业时间门槛；H002命名地点解析仍未闭合；H005来源均UNKNOWN且重复事实动作消耗步骤，需受限调查正确收尾。Eval动态时间基准和终态标签不一致另记，不把安全停止或运行时PRESENT_RESULTS当作合格交付。

建议以本次真实观察做“外部替身、内部真实组合”的证据更新/时间组合/重复发现回归，先修这些共性契约再有界Live；不新增站点fallback、不继续扩大预算掩盖循环。资源与精确证据见同日TEST-LOG及批次报告，未提交或推送。

## 2026-09-14 — Live-derived evidence, time, location and stopping repairs

当前展示证据不再把一次`factChecks`集合误当成候选全部有效事实：当前事实读取与同一当前availability观察产生的来源事实共同组成展示引用；新的UNKNOWN、冲突、关门或无slot仍会遮蔽历史正向证据。Availability目标不再允许独立事实读取冒充请求绑定slot调查，令Agent Context、Validator与Router的可行动边界一致；事实推荐继续按缺口读取事实。

时间物化保留显式日历日期优先于相对时钟，并使`this afternoon`携带东京当天；Live Eval的`right now`期望从同一运行参考时刻独立物化。命名地点解析从三项严格名称匹配改成一次有界十项来源观察和保守的名称/地址变体匹配；首项仍不能被当作地标，歧义和未解析均保留公开的筛选观察。

Router现在把发现返回数与实际新入权威候选池数同时写入trajectory；两次连续零新增发现以`NO_PROGRESS`结束。不同JSON却同一稳定Validator拒绝也会在无执行、无请求变化、无新来源观察时停止。Evaluator对推荐中的高置信封闭人数推断不再误判为用户字段冲突；非同文SOFT条件改写明确`NOT_EVALUATED / semantic review`，不使用LLM Judge洗成自动通过。没有新增网站fallback、Provider、预订或外部写操作；本轮未提交或推送。

## 2026-09-14 — 只读调查执行契约收敛设计（Draft）

按用户要求完成[设计](../RESTAURANT-READ-EXECUTION-DESIGN.md)与[ADR-0025草案](../decisions/0025-model-directed-read-investigation.md)。方案保留现有单Agent、Runtime/Reducer、Router与Browser Executor，拟删除目标限定调查动作、重复资格规则及文案驱动进展判断；统一当前证据/缺口评估，并补窄的`END_READ → NO_VERIFIED_RESULT`只读链和独立诊断。明确与ADR-0012/0014/0022的拟调整范围，未静默改写Accepted正文。

本条只记录设计交付，不是实现完成：没有改业务源码、运行Live或付费模型，没有提交/推送；验证与实施切片在设计中列出。历史两批Live和离线复现仍是exposed development diagnostic，不变更为Clean Baseline。


## 2026-09-14 — 补齐只读执行设计的测试与Eval改造落点

按用户反馈扩展[执行设计第13节](../RESTAURANT-READ-EXECUTION-DESIGN.md#13-测试与eval的具体改造清单)：明确模块断言迁移/删除、Hybrid/Web真实入口集成、真实模型+固定来源诊断、Evaluator/rubric与反例变异，以及测试资产同切片维护。Test/Eval Skill同步通用分工，避免以模块测试数或预设唯一动作序列代替选路质量与E2E验证。

这是Document revision 0.2的设计补充；测试代码、Runner、评分器实现均未据此修改，未授权或运行任何模型/Live调用。

## 2026-09-14 — ADR-0025 model-directed read completion implementation

按用户授权执行只读调查设计并将ADR-0025接受。新增纯`read-assessment`领域模块，统一当前展示证据、待补缺口、可读取候选与正常结束资格；Context、Validator与Router复用其结果，但Evaluator仍独立检查artifact。移除availability目标的`FACTS_NOT_APPLICABLE`禁令和基于英文`newly accepted`文本/同一拒绝码的流程终止。

新增窄的`END_READ → READ_ENDED_NO_VERIFIED_RESULT → NO_VERIFIED_RESULT`路径：模型不能携带候选、来源事实或结果结论，Reducer仅接受当前完整请求、实际调查、无待刷新、无可展示结果且无内部失败时的Router派生范围。生命周期为已收尾，但Outcome明确不是找到了餐厅；取消、预算上限和内部错误仍分别保留。trajectory observations改为候选/证据范围的结构化字段，来源作用域写入当前事实/availability check，避免一个来源的新UNKNOWN屏蔽另一来源的独立事实。

Google命名地点不再以地址或任意名称子串确认地标；只接受规范化后的来源显示名称相等，其他候选保留为未解析/歧义。无新增Provider、网站fallback、模型Judge、写操作、Live、提交或推送。

## 2026-09-14 — ADR-0025 independent verification found remaining contract defects

复跑离线矩阵并执行一次原始H001 Live；未修改产品源码。确认本轮CANDIDATE_FACTS_CHECKED重建整张factChecks表造成跨批记录丢失，真实入口组合与Live均出现反复调查。旧UNKNOWN后读取其他候选还会复活旧正向事实。另复现外层停止判断遗漏合法availability动作、无结果Evaluator仅凭对象存在自证、命名地点变体未解决；Context全缺口反馈及Hybrid增量日志尚未接通。默认282项通过不能证明这些行为已覆盖；下一切片应修共享契约并扩展既有集成边界，不添加按网站/案例fallback。详见TEST-2026-09-14-ADR-0025-INDEPENDENT-REVIEW及其本地报告。

### 2026-09-14 — Restaurant 架构、编排与验证联合续审

只读审查当前 HEAD fd0dfb0 加未提交工作区，未修改产品源码。新增实际内部组合反例证明批级 provider 误作候选来源会使旧事实复活；grounding 反例证明 slot UNKNOWN 同时丢弃身份/事实。审查将直接实现回归、来源/观察契约不足、重复动作控制、Eval 自证和工作流验收脱节分别归因，建议保留 Core/授权/现有浏览器能力，收拢 Restaurant 读链而不整库回滚。完整本地记录：`.eval-artifacts/adr0025-review-2026-09-14/ARCHITECTURE-REVIEW.md`。未提交、推送或新增 Live。

### 2026-09-15 — 先修测试与无结果评价（DEV-2026-09-15-TEST-CONTRACT-REPAIR）

按用户要求只修验证层，业务执行维持原状。正式默认集成覆盖跨批/顺序、来源归属和其他来源可达性，Domain覆盖部分观察接纳；先在未修业务代码上失败。纠正无结果Evaluator的自证预期与逻辑，Evaluator/Rubric分别升级到@10；空或不适用记录未评估、可证实矛盾失败，仅独立记录的限定空搜索可确认，不声称一般调查充分。同步Web评价版本接线断言。最终默认套件290通过/8失败，失败对应4类尚未修复的业务契约，未隐藏或跳过。完整记录见[验证修复记录](TEST-VALIDATION-REPAIR-2026-09-15.md)。未修改Prompt/Gold或业务执行、未Live、未提交推送。


## 2026-09-16 Stagehand isolated workflow probe

Extended the approved small probe with explicit action checks, phased observations, asynchronous/new-tab fixtures and separate execution/artifact review. All runner/dependency changes remain under ignored `.eval-artifacts`; production browser, Runtime and Policy remain untouched by this slice. Seventeen live model calls did not complete the three merchant paths; a zero-model Playwright control reached the TableCheck form. Stop before production integration; retain failures and evaluate observation plus existing execution as a candidate, not a proven replacement. [Report](../brainstorming/2026-09-16-stagehand-workflow-validation.md).


## 2026-09-16 Browser observation/action/memory probe redesign

Expanded isolated diagnostic to alternative query conditions, full filters, map gestures, source-backed notes, independent-request comparison and fresh-evidence update. Runner/dependencies remain ignored artifacts; no production code or main dependency changes by this slice. Preserved adaptive harness failures; Stagehand observe candidate generation is distinguished from a task planner. Future integration must reuse the existing production loop and evidence boundaries. [Design and findings](../brainstorming/2026-09-16-browser-observation-action-memory-validation.md).


## 2026-09-16 Browser Agent implementation handoff

Created the [Terra plan](../BROWSER-AGENT-RESTAURANT-IMPLEMENTATION-PLAN.md) against current Executor, Decision, Session, source Skills and Evidence contracts. Preserves Router-bound query authority, distinguishes permitted alternatives from original requirements, sets Stagehand go/no-go criteria, and requires real Web/Harness integration plus independent review. Updated navigation and linked the prior plan as historical context. No product code, dependency, branch or task dispatch changes.


## 2026-09-16 Browser independent-review repair

User authorized direct fixes while Terra continues the main implementation. Fixed R1–R4 in the existing Registry/Executor, with regressions in the existing Chromium Harness: deny unclassified checkbox/range events; read mutable native properties and ARIA range state; recognize fixed/native/nested visible dialogs. Added a strict-wire model transport → Executor negative consent test. Production query permissions remain unset, so this does not claim real-site filter support or P0–P4 completion. No paid/Live execution, commit or push. [Review and limitations](BROWSER-AGENT-TERRA-REVIEW-2026-09-16.md).

## 2026-09-16 — Browser P1/P2 offline completion slice

TableCheck and Tabelog now explicitly grant the shared Executor only their public GET search checkbox/range operations; the permission is source code, not a model instruction or page claim. The generic executor preserves a public new-tab read in the same browser context while replacing the active-page identity, so all prior opaque references expire. No second browser loop, source fallback, login or write path was introduced.

The Restaurant intent now keeps the user’s requested time distinct from a separately explicit permitted alternative range. Router binds only that bounded range to the source query and retains the original range for evidence and display; an out-of-original-range slot is labelled alternative. Date, party and other conditions are not widened. Candidate-bound website facts can now retain explicit public course price/tax, private-room minimum, cancellation and no-show values separately after HIGH identity, including one observed safe terms disclosure. Bare amounts and unlabelled inference remain unknown. The existing Web card projects only candidate-scoped cited terms.

All additions reuse the production Router, BrowserTaskExecutor, Grounding and Web projection. The slice is offline Fixture/HTTP/model-boundary work only; no Gold/Holdout, real model, real source, booking, commit or push was used. Original-researcher re-review and an explicitly authorized bounded Live phase remain gates, not implied by this implementation.


## 2026-09-16 Second review repair: R5-R8

Current development evidence. Time-window replacement now clears old alternative permission at Intent patch application; explicitly supplied new permission is applied afterwards. The unverified public GET search policy and adapter grants were removed: production checkbox/range actions default to deny pending positive source control contracts. The synthetic fixture alone grants its known query controls; Japanese consent is refused through the real Chromium strict-wire path.

Commercial scalar prices now require an unambiguous complete labelled line; deposits mixed with prices and multiple courses remain unknown. Supported commercial requests (course price, room minimum, cancellation, no-show) are included in the reader objective and completion check. Existing type/hours no longer cause early completion when requested terms are missing. Missing requested facts return UNKNOWN / WEBSITE_REQUESTED_FACTS_UNCONFIRMED while retaining observed evidence. This is narrow explicit-keyword support, not general multi-course or natural-language understanding.

Verification: typecheck, arch:check (0 forbidden), build, full npm test 353/353 and synthetic real-Chromium 13/13 PASS. Before-fix regressions saved. An initial Compiler-level null patch failed one old shape assertion; invalidation was moved to Intent patch application and the full suite rerun successfully. Logs: `.eval-artifacts/browser-terra-review-followup-2026-09-16/before-fix.log`, `final-tests.log`, `browser.log`. Old repro.ts records the pre-fix policy and is not a current runner after its deletion.

The unsafe policy test was retired with the implementation; existing semantic/website and Chromium tests were strengthened, with ambiguity and missing-fact regressions added. No paid model, Replay, Live, external writes, commit or push. R6 is safely closed but positive real-site filter wiring remains incomplete; full P1/P2/P3 acceptance is not claimed.

## 2026-09-16 Browser 直接修复

修复 R9 Web 历史条款投影/来源错配；新增实测 TableCheck Budget/Cuisine 正向 query contract；补充结构观察并移除缺失 form 的逐控件等待。Hybrid runner 增加总调用及剩余时限保护。Tabelog 实测发现模型 COMPLETE 不能代表验收，改为 completion=false 时 MODEL_HANDOFF，补独立回归。保留其他任务既有改动，没有提交/推送。仍有 P3 未闭环，详见 [记录](BROWSER-AGENT-VALIDATION-2026-09-16.md)。

## 2026-09-16 Tabelog follow-up and TableCheck failure attribution

Added code-owned nonstandard control hints to the shared Registry and both Playwright sessions; wired Tabelog date/guest readiness and selection verification into the Adapter. Fixed unrelated external-link classification. TableCheck now recognizes disabled state, waits for guide results and binds explicit empty results to a scoped exact request; MODEL_HANDOFF still requires independent source evidence. No new dependencies, commit or push; pre-existing changes preserved. [Details](BROWSER-AGENT-VALIDATION-2026-09-16.md).

## 2026-09-17 H001/H003/H005 targeted repair — offline gate

Implemented the smallest current read-path repair: provider-listed TableCheck/Tabelog merchant URLs are candidate pointers read through their existing identity gates; TableCheck retains only per-run verified outlet pointers and re-identifies every later candidate before any result can be grounded. Complete normalized name/address evidence outweighs a phone disagreement, while a branch/address conflict remains non-HIGH. Immediate requests now carry materialization@4 provenance and a one-minute, exact discrete-slot contract; Router returns UNKNOWN before source access for stale or unrepresentable immediate time, and presentation rejects expiry. No broader GET permission, planner, provider fallback, booking or write path was added.

The H003 post-parser diagnostic used the saved baseline's current candidate and current source fact, not Gold or Holdout. The final third bounded model call emitted cited positive-HARD evidence; a local state replay moved the missing reason from HARD evidence to availability identity. The first run failed to persist its output and the second cited a superseded raw fact; both failures remain recorded and were not counted as proof. No commit, push, booking, or Live run occurred in this development entry.

## 2026-09-17 H001/H003/H005 bounded Live Read-only

Ran the original H001, H003 and H005 requests exactly once each under the user-approved 300000ms, 50-model, 50-Google and 50-browser-actions-per-candidate ceilings. H001 and H005 saved immutable result plus evaluator sidecars; neither produced a qualified result. H003 exceeded its five-minute ceiling without finalizing after its started record; it was interrupted and not retried. No code changes were made in response to the Live observations, no booking/write capability was used, and this entry hands the residual findings to the original researcher for independent review rather than asserting review success.

## 2026-09-17 H001 address-representation and runner-deadline offline repair

Replaced provider-local address string comparisons with one minimal shared outlet-identity helper. HIGH cross-script address matching requires the same normalized postal code and the complete ordered number/unit sequence; reordered complete same-script components are accepted only when their complete token sets match. Missing detail or a distinct floor/unit remains non-HIGH. TableCheck and Tabelog retain their existing candidate identity thresholds, direct Google-listed merchant pointer handling and availability-evidence isolation; this repair does not copy availability between candidates.

The Hybrid Live runner now settles its outer run at the authoritative deadline even when a coordinator does not itself observe abort. It prevents a future capped run from remaining without a terminal artifact, but does not manufacture or reinterpret the interrupted H003 result and did not cause a rerun. No new provider, permission, fallback, model call, Live source action, booking/write path, Gold/Holdout access, commit or push was added.

### Address-sufficiency follow-up

The initial helper still treated two identical abbreviated strings as a complete address. Tightened it before handoff: both sides must contain a street/unit number and either a postal code, two locality tokens, or the Japanese prefecture-plus-municipality structure. The direct abbreviated `1-1 Shinjuku` counterexample stays MEDIUM. This is a conservative identity gate, not a transliteration service or a merchant-specific exception.

### Immediate source-slot follow-up

Replaced the provisional global 15-minute slot assumption with a source-observed exact-slot contract (`restaurant-temporal-materialization@5`). During its one-minute validity window the Router forwards only the original exact local time; it never manufactures a next slot. TableCheck and Tabelog now classify visible neighbouring cards that do not include that exact time as `UNKNOWN/IMMEDIATE_SLOT_NOT_OFFERED`. A source-specific, request-bound explicit empty result remains distinct and may still establish unavailable. No Live rerun, real model/source call, provider fallback, permission widening, Gold/Holdout access, booking/write action, commit or push occurred.

The final per-case matrix, resource accounting, raw artifact links and review handoff questions are retained in [H001/H003/H005 targeted repair report](H001-H003-H005-TARGETED-REPAIR-2026-09-17.md). It records the H003 Live non-finalization as a failure, rather than converting it into a normal no-result.

### H003 deadline regression

Moved the outer run-deadline settlement to a small testable Agent-loop helper. Its two regressions prove an ignored-abort child settles `CANCELLED` and a child that finishes before the deadline preserves its value. This closes the untested implementation gap for future runs only; it does not replace the missing H003 result artifact, alter a Live record or authorize a retry.

## 2026-09-17 — H001 identity and entrance repair after independent review

Reproduced the independent review's three production counterexamples before changing code: B1F/1F was accepted as one address, a shared phone overrode a clear Shibuya/Roppongi conflict, and a postal code plus floor counted as a complete address. `outlet-identity` now reports `MATCH`, `CONFLICT`, or `INSUFFICIENT`; TableCheck and Tabelog deny HIGH whenever a complete source address explicitly conflicts, while a complete same address with a stale phone remains valid. No transliteration service, merchant exception, fallback provider, broad GET permission, or Domain-state shortcut was introduced.

TableCheck now receives a Router-run-scoped entrance ledger. It records all source-observed public merchant URLs as re-identification hints, never as availability evidence. Current candidate discovery remains mandatory when its own page is incomplete; its URL order is direct known link, current discovery, then prior run hints. Both adapters probe an identity-verified Google-listed merchant page before normal search, so a later search challenge cannot erase that valid entrance. The production Live composition regression starts from `LiveBrowserAvailability`, observes Hajime while investigating Teppen, crosses Agent batches, and validates Hajime afresh. The separate stale-entry regression proves a prior Matsue URL cannot suppress current discovery.

After the frozen dirty snapshot passed 54 targeted tests and the 391-test offline gate, performed exactly one read-only probe per user-fixed saved entrance: Sushi Teppen TableCheck, Namikibashi Sushi Hajime TableCheck, and Sushi Nasu's Google-listed Tabelog page. All three artifacts stopped at `BROWSER_RUNTIME_FAILED` before a snapshot; therefore no source conclusion, model/Google call, request selection, booking or external write occurred. Full evidence and B1–B14 classification are in [H001 identity/entrance follow-up](H001-IDENTITY-ENTRANCE-FOLLOWUP-2026-09-17.md). Original-researcher review remains pending.

A follow-up no-network runtime check opened and closed local headless Chromium successfully. The established first blocker is therefore Cloudflare Browser Run session creation, not a missing local browser. The fixed Live round was not retried through that alternate engine. A final production-composition regression proves `endReadRun` clears entrance hints before a new run; targeted coverage is 55/55 and the full offline gate is 392/392.

The existing independent Hybrid diagnostic evaluator was then checked in memory against each failed probe without writing a sidecar. Every probe has zero candidates and returns `completion` and `evidence` as `NOT_EVALUATED`, so it is not a valid independent evaluation input. The artifact record preserves that limitation and continues to require an actual shared production-composition result before evaluation.

The shared browser path's post-repair local Chromium fixture gate also passes 17/17. It remains a synthetic, read-only offline verification and does not turn the failed remote probes into a real-source outcome.

## 2026-09-17 Regression-defense generalization

Extracted the independently authored H001--H005 fixed source observations from the code-contract model test. The shared helper still drives actual Google search, fact composition, browser availability, Interpreter, Compiler, Runtime, Router, Validator and Grounding; only source transport/pages are fixed. Added a bounded real-model fixed-source Runner which creates immutable diagnostic and evaluator artifacts without accessing a Live website. No production behavior, prompt, frozen case input, booking path or external write was changed.

The real-model one-shot runs were deliberately retained even when red: H002 paused for input, H004 failed, H003 ended no-result and H005 presented; H001 exposed an evaluation-location Runner mistake and was not retried. H001/H003/H005 Live Read-only attempts each terminated `CANCELLED` under their caps on a dirty worktree. Full detail and unassessed scope are in [the regression-defense report](REGRESSION-TEST-DEFENSE-REPORT-2026-09-17.md). No commit or push.

### Controlled migration sample

Added `new-vegetarian-lunch` as a source-scenario registration and test data row, not a second Runner. It changes cuisine, negative constraint, party size, named area and lunch-time slot together, then exercises the same production composition. It is deliberately exposed controlled evidence and was not included in paid-model or Live runs.

### H001 authorized corrective model run

After the user authorized a one-time exception to the per-case limit, reran H001 through the corrected fixed-source real-model Runner. The immutable result completed `PRESENT_RESULTS`; evaluator@15 accepted authoritative conditions, evidence, investigation, final claim, completion and resources. This is a fixed-source model acceptance record, not a Live website result and did not trigger further product changes.

## 2026-09-17 Fixed-source test-mechanism remediation A–D

The fixed-source Runner now uses registered case data and a shared production-composition execution function rather than an H001--H005 whitelist. Its execution record, independent evaluator outcome, acceptance verdict and user-goal completion are separate; only a predeclared acceptance PASS gives the Runner a zero exit code. The controlled `new-vegetarian-lunch` sample now traverses execution, evaluator and acceptance, including a missing-evidence failure control.

Fixed source data now represents candidate-specific venue identity, pages and date/party inventory. Query matching is equivalent-token based rather than an exact prompt script, and unconfigured legal browser reads are surfaced through fixture coverage diagnostics. Default business time starts at the registered reference but advances with real elapsed time; an outer wall-clock deadline wraps semantic and agent work in both fixed-source and Live runners. These are offline diagnostic controls, not a restaurant business-rule change. No paid model, Live, source network or external write was run.

## 2026-09-17 Fixed-source closure after 987c77e review

Split the test source's Google and TableCheck observations into independently configurable identities, listed links and inventory. A public entrance found for one candidate is now retained only as a run-scoped navigation hint and is identity-checked again before another candidate can receive inventory. The controlled vegetarian sample changes its source type wording to a non-verbatim positive HARD fact; the explicitly marked fixture model returns a cited judgment through the production fact/read/state chain, not a manually inserted eligibility answer.

Fixed-source transport now records source/stage/request/candidate/reason coverage gaps even when a production adapter wraps the transport exception. Acceptance receives those records: necessary gaps block with nonzero status; optional gaps require an independently qualified result. The factory takes a clock rather than a fixed timestamp, records each observation time separately from sample capture time, and fixture waitFor checks the requested supported selector. Unified acceptance now declares and verifies normal result, verified no-result, needs-input, cancellation and budget/deadline records rather than treating every negative path as a successful terminal no-result. No Prompt, Gold, user request, paid model, Live source action or external write was changed. [Coverage report](FIXED-SOURCE-CLOSURE-2026-09-17.md).

## 2026-09-17 Controlled-stop artifact acceptance

The fixed-source execution helper now accepts a controlled cancellation signal
and a bounded model-call ceiling solely for offline test execution, recording
the actual admitted call count and the transport's original failure code. This
does not change restaurant action selection or any production stop policy.
The evaluator/rubric is `@16`: it recognizes a saved `CANCELLED` record and a
saved model-budget record as distinct completion kinds, while preserving
internal execution failures as failures. Acceptance now requires the matching
completion kind as well as status, phase/loop where declared, reason and
required evaluator dimensions; it derives user-goal completion from the actual
evaluation, so both approved stops remain `NOT_COMPLETE`.

The regression serializes each real controlled-composition result to a temporary
artifact, invokes the normal artifact evaluator to create its immutable sidecar,
then passes that evaluation to acceptance. It does not construct evaluator
findings or score results by hand. An abort after semantic interpretation and a
one-call budget each pass only their matching contract; evaluating the budget
artifact as cancellation fails. No Prompt, Gold, product decision rule, paid
model, provider, Live read or external write changed.

## 2026-09-18 H002 diagnostic wire-contract repair

Added an unwired, fail-closed party-size supplement diagnostic plus a focused schema/normalization test. After two recorded provider rejections (top-level union, then empty object), the wire schema now uses a non-empty object root and a local-only UNKNOWN sentinel that normalizes to the canonical result. The final 24-call run reached model output; it remains diagnostic-only because H002 was 1/3, below the frozen gate. No handler, reducer, persistent state, production prompt, Gold, H005, browser, Google, or booking path changed.

## 2026-09-18 H002 semantic-arity v2 diagnostic

Updated only the diagnostic resolver prompt to `v2` with a general lexical relational/event arity rule and explicit modifier/open-group limits. The resolver remains a one-attempt, fail-closed, non-empty object-root structured-output candidate; its public result still admits only RESOLVED with `EXPLICIT|INFERRED_CLOSED_PARTY` or UNKNOWN. The v2 gate failed on model provenance labels for two existing closed-group controls, so no handler, persistent application, Hybrid composition, server, compiler, reducer, or production prompt wiring remains. The diagnostic runner now freezes and hashes its 14-sample plan before any dispatch.

## 2026-09-18 H002/H003 semantic contract closure

Implemented the bounded H002 resolver in the actual persistent Web, Hybrid, and fixed-source compositions, with a strict two-field provider wire, code-owned inferred provenance, retry-safe per-request in-flight coalescing, and event audit status. Added ADR-0029, Semantic Prompt@v20, Agent Prompt@15, `restaurant-read-development@5`, mutable criterion strength identity, HARD-only evaluator evidence checks, and composition tests T1–T6/M1–M4. The H002 8-call real-model gate accepted; H003's pre-frozen 18 calls rejected because two primary outputs added `suitable for` to `team dinner`. Per the declared stop rule no dependent fixed-source or any Live/H005 work started. No commit/push; original researcher received an independent-review handoff.
## 2026-09-18 — H002 persistent duplicate-delivery closure

- Moved the narrow existing `(rootTaskId, requestId)` in-flight join ahead of
  `submitMessage` optimistic-version validation. This preserves the Runtime's
  normal stale-version rule for different messages while letting a duplicated
  delivery join its one logical, read-only semantic supplement.
- Added the PGlite persistent entry regression rather than a second unit-only
  abstraction: it drives the existing Web/Application Runtime, exercises
  explicit/inferred/unknown/failed party states, current-Draft preservation,
  duplicate/replay, and refresh. No provider, browser, source or booking path
  was introduced.
- Kept H003 `ASSERT` strength revision explicitly separate from existing
  collection `CORRECT`; did not add a compatibility behavior or alter Gold.

### Post-review fixed-source read closeout

- Ran the user-authorized H002/H003/H004 one-each real-model fixed-source
  reads only after independent mutation review; each used the existing exposed
  offline source scenario and 5-minute/50-step/50-call ceiling. No Live,
  H001/H005, Gold, fixture, Prompt, booking or external-write work followed.
- H002's actual supplementary call resolved the primary parser's omitted count
  to two. The strict artifact remains a failure: an independent in-memory
  label-only diagnostic shows its negative-HARD evidence problem is evaluator
  label/lineage matching, while the unresolved product-semantic difference is
  first-date SOFT→UNSPECIFIED. No artifact or Gold was edited.
- H003 is accepted only for the bounded fixed-source observation; H004 is not
  accepted because its meeting-friend preference regressed SOFT→UNSPECIFIED.
  These conclusions are owned by the original researcher's independent review.

## 2026-09-18 semantic-contract @6 offline implementation

Published the single executable exposed development manifest
`restaurant-read-development@6`. It changes only H002 first-date and H004
meeting-a-friend from the historical SOFT expectation to UNSPECIFIED; H003's
existing @5 annotations remain intact. All old @4/@5 artifacts retain their
original data/hash labels and are not rewritten. Prompt@v21 now distinguishes a
bare absence of preference from a real preference that is explicitly tradeable:
the latter is retained as SOFT rather than deleted.

Evaluator/rubric@18 now evaluates semantic fidelity and grounding on separate
anchors. Gold is compared to final authoritative intent for semantic conflict or
independent-review status; the final intent binds evidence and executed-observation
applicability. Exact same-text polarity/HARD-strength conflicts still fail, and
different text never receives an automatic fuzzy-equivalence pass. The retained
scorer-local strength control was supplemented after review by a real Hybrid
two-turn Runtime/Validator/Router/Evaluator path: an old UNSPECIFIED
presentation cannot support a later HARD requirement. No paid model, source,
browser, Live, Gold/Holdout, booking, commit or push action was performed.
Details: [@6 implementation record](SEMANTIC-CONTRACT-V6-IMPLEMENTATION-2026-09-18.md).

## 2026-09-18 — semantic-contract @6 pre-review corrections

- Corrected evaluator@18 criterion comparison from text-keyed lookup to a
  text-plus-polarity multiset, preserving both valid opposite-polarity criteria
  and rejecting an actual polarity replacement. Different wording remains
  deterministic `NOT_EVALUATED`, not fuzzy-matched.
- Replaced the claim that the scorer-only strength fixture was complete with a
  production-composition two-turn regression. A real Hybrid Runtime resets the
  previous presentation/evidence on `SEMANTIC_PROPOSAL_COMPILED`; a second HARD
  condition cannot reuse the old nonblocking card, while fresh Router/Reducer
  fact evidence enables the paired normal presentation.
- No additional production Prompt, Schema, Gold, or source-fixture change was
  made by this correction: the only current Gold migration remains the
  authorized H002/H004 @6 strength change, while historical artifacts stay
  untouched. No external model, Google, website, browser, Live action, commit,
  or push was performed. The corrected diff then passed typecheck, arch,
  build, diff check, and 455/455 authorized local-loopback offline tests before
  return to independent pre-review.

## 2026-09-18 — semantic-contract @6 authorized fixed-source diagnostics

- Original-researcher pre-review then allowed exactly one real DeepSeek fixed-source diagnostic each for H002, H003 and H004. Each reached `PRESENT_RESULTS` with independently sufficient candidate evidence, but each retained automatic `NOT_EVALUATED` semantic wording and therefore `FAIL` acceptance. The three immutable result/evaluator pairs and resource ledger are linked from the @6 implementation record; they await independent manual semantic review and were not repaired or rerun.
- The runner preserved structured proposals, actions, evidence and provider metadata, but not raw provider response text/messages (`outputText: null`). This was recorded as an unrecoverable retention gap after the one-run budgets were consumed; no reconstruction was substituted. No H005/Live/browser site, booking, commit or push followed.
- The run-time @6 YAML was then copied byte-for-byte to the independent-review audit directory before synchronizing two stale human `acceptance.review` sentences with the already-unchanged H002/H004 `UNSPECIFIED` semantic strengths. Original artifacts and their scores were not altered; no model/evaluator rerun followed.


## 2026-09-18 — Independent semantic-contract @6 acceptance

Closed only the user-authorized H002–H004 exposed fixed-source semantic slice after two pre-review corrections, 3 one-shot outputs and independent paraphrase review. Historical AUTO ratings unchanged; no H005 or Live work. See SEMANTIC-CONTRACT-V6-INDEPENDENT-ACCEPTANCE-2026-09-18.md.


## 2026-09-20 H005 locality matrix independent stop review

2026-09-20 **H005 locality Prompt@4 matrix 独立复核未通过，按停止条件结束**：L1–L8×3共24次真实模型、零重试、20,548 tokens；24份原始请求/响应及逐次落盘记录已核对。L3（Tokyo + Japanese restaurant）3/3错误SUPPORTED并进入verifiedHardCriteria；L5为CONFLICT/UNKNOWN/UNKNOWN，未误接纳，但Italian样本带地域信息，不能干净隔离location-only，预审遗漏已承认。L1/L2/L8正例9/9、L4/L7不足证据6/6、L6地区不匹配3/3均符合各自预期，仍不足以接纳Prompt@4。当前@4仅未提交候选，H005 fixed-source、Live、Prompt@5均未运行；禁止自动重跑。详见[独立矩阵复核](../../.eval-artifacts/h005-locality-independent-review-2026-09-20/MATRIX-REVIEW.md)。

独立复核未新增模型调用；前置定向检查14/14、typecheck及diff check通过，只证明预审代码边界。原始矩阵及Gold不改写。


## 2026-09-20 Local Food Semantics v2 independent stop review

2026-09-20 **Local Food Semantics v2：Prompt@5 / matrix@2 独立复核仍未通过**。用户已将普通local food定义为目的地本土料理，旧matrix@1失败记录保持原口径不回写。新12样本×3共36次、零重试、32,301 tokens；10个普通local-food样本30/30正确，窄地域冲突N2为3/3 CONFLICT；唯一失败N1（Tokyo regional food + Japanese restaurant）3/3错误SUPPORTED并生成verifiedHardCriteria。独立核对全部36份请求/原始输出及72个逐次记录，确认不是criterion漏传或评分误判。按预定gate停止，不运行H005 fixed-source/Live，不自动Prompt@6。[独立逐项结果](../../.eval-artifacts/h005-locality-independent-review-2026-09-20/matrix-v2-independent-review.json)。

## 2026-09-20 Local Food Semantics v2 Prompt@6 matrix stop

在新的明确授权下，仅将 Fact Judgment Prompt 收窄为：无修饰的 `local food` 可由目的地本土料理支持；明确的城市／地区／特色条件必须有同一窄范围的引用事实，不能从候选地址、名称或更宽国家料理推导。矩阵及评分器保持 matrix@2 的12样本×3执行形状，增加逐 attempt 的 dispatch／settled 不可变日志；没有改Gold、来源或固定来源／Live路径。

同一真实模型矩阵36次、零重试、34,383 tokens、28,604ms，N1由 Prompt@5 的3/3错误 `SUPPORTED` 变为3/3正确 `UNKNOWN`，N2继续3/3 `CONFLICT`。但普通 `local food` 的 V2-L5（Tokyo 中 Kyoto regional cuisine）3/3输出 `UNKNOWN`，而冻结期望为 `SUPPORTED`；所有36次的结构化响应和引用均合法，故不是身份、输入过滤、citation或 scorer 造成的失败。按预设停止门槛，不写 Prompt@7、不运行 H005 fixed-source/Live，也不回写历史 artifact。详见[独立 V3 状态](../../.eval-artifacts/h005-locality-independent-review-2026-09-20/TERRA-V3-PHASE-STATUS.md)。

## 2026-09-20 Local Food Semantics v2 explicit-scope matrix and first H005 fixed-source run

仅将 Prompt@6 中“不同窄地域”的禁止 `SUPPORTED` 规则改为条件化文案：用户明确要求 city/region/specialty cuisine 时才适用；generic `local food` 允许目的地本土菜系语境中的其他区域菜系。matrix@2 的代码、12样本、三次重复、scorer、来源和Gold均未变。真实模型36次、零重试全部通过：V2-L5 3/3 `SUPPORTED`，N1 3/3 `UNKNOWN`，N2 3/3 `CONFLICT`，其余无失败；总36,006 tokens、33,971ms。

按该门槛首次运行 H005 固定来源真实模型组合：一例、`SYNTHETIC_CONTROL`／离线固定来源、50 model calls／50 steps／300s上限，无真实Google、网站、浏览器或预约。执行为 `SUCCEEDED/TERMINAL/PRESENT_RESULTS`，8次模型调用、28,522 tokens、10,877ms；三家均完成 facts、HIGH identity 及4人17:00 availability 读取，且三家 `local food` 均有 verified-hard evidence。a/c 还具有 `fast food` 负条件的 verified-negative evidence；b 没有该负证据，故只展示a/c，批次目标为3但`met:false`，固定验收 `FAIL`。未把此失败改写为无位、local-food失败或来源缺口；不重跑、不改规则、不进入Live。

## 2026-09-20 H005 Phase 1 fixed-source default batch acceptance

将 fixed-source 的结果数量契约收敛为两种来源：仅用户明确的`requestedResultCount`才能注册为`USER_EXPLICIT` completion requirement；H001–H005 的`OPEN_ENDED`默认三家继续是产品调查目标，不再作为 fixed-source acceptance 的硬失败条件。`QUALIFIED_RESULT`仍必须是`SUCCEEDED/TERMINAL/PRESENT_RESULTS`、独立评估为合格、并有至少一位 distinct presented candidate；空展示不能通过。默认批次一律将`target/actual/met`输出为`defaultBatchTarget`，故完整三家为`3/3/true`，合法来源耗尽后的两家为`3/2/false`且可通过。明确数量仍要求同数 distinct result、权威 State 中的`requestedResultCount`以及已满足的 Runtime batch target。审查补充关闭一条 false-PASS：若 State 已有`requestedResultCount`、但注册遗漏`USER_EXPLICIT`，或两者数值不一致，验收直接失败且不得产生`defaultBatchTarget`；不能借由注册遗漏把用户数量降格为产品默认。

没有修改`requestedResultBatchTarget()`、`resultTargetCannotBeMetWithFurtherRead()`、Action Validator early-short-batch gate、Agent bounded investigation、H005 input/Gold/fixture、local-food Prompt或任何负条件策略。历史真实 H005 fixed-source artifact 只读离线重评：原执行及 evaluator sidecar 的SHA保持不变，新侧车结论为`PASS/COMPLETE`和`defaultBatchTarget=3/2/false`。Phase 2 `no fast food` category policy 未开始，等待独立审查与授权。
## 2026-09-20 — H005 Phase 2 category-negative eligibility (offline only)

- Added ADR-0030 and Prompt@7 schema scope. A cited `UNKNOWN/RESTAURANT_CATEGORY_TYPE` may create only `categoryUnknownNegativeCriteria`; Runtime eligibility and evaluator@19 accept that exact, current candidate-bound claim without promoting it to a verified-negative fact. Violations and all non-category unknowns remain blocked.
- Kept the prior locality prompt text unchanged and appended the scoped rule. No Gold, H001–H005 YAML, source scenario, historical artifact, provider, browser, website, Live or booking work was changed or run.
- The existing fixed Hybrid composition remains the only end-to-end runner. Paid 16-attempt matrix execution remains pending approval; no retry budget was consumed.


## 2026-09-20 H005 review continuation — bounded category eligibility and failed model gate

Completed true internal composition and explicit follow-up exclusions, independent raw-type checks and acceptance@3/product documentation. Prompt@7/schema@2 matrix ran once: 14/16; grounded McDonalds F8 was UNKNOWN twice. Phase 3 not run. This is an unaccepted development candidate, not a completed H005 slice. Frozen source/local-food/Gold preserved; no commit/push. See [independent review](H005-CATEGORY-NEGATIVE-REVIEW-2026-09-20.md) for immutable artifacts, actual behavior coverage, failure attribution and limits.


## 2026-09-20 Prompt@8 and accepted fixed-source integration

Integrated Terra's final groundedEntity/category clarification and second-turn transport assertions into the current branch after user authorization to commit and push. The successful unchanged category matrix preceded H005 and H001-H005 fixed-source runs; earlier status summaries had omitted that successful follow-up. Current STATUS and review addenda now distinguish historical Prompt@7/network failures from accepted Prompt@8 and five-case results. H001/H005 are automatic PASS; H002-H004 retain automatic FAIL plus independent manual semantic acceptance. All 138 tracked production src files match the run worktree, and locality text, Gold and fixed-source samples remain unchanged. No new paid or Live run was needed. Details: [integration review](H005-CATEGORY-NEGATIVE-REVIEW-2026-09-20.md#prompt8-follow-up-and-commit-integration).

## 2026-09-24 Test/Eval Skill structure

Reorganized the four execution skills without changing product contracts, source fixtures, Gold, ADRs or code. Test now owns contract/failed-mechanism coverage, verification method, assertion effectiveness and fault closure; Eval owns independent quality oracles, evidence, scoring units/denominators, comparability, contamination and frozen thresholds. Planning and Post-change Verify now only compose and sign off those rules. Archived the full prior Eval Skill snapshot with a migration map, and added a paper review independently accepted after corrections for multi-candidate availability, H005 clocks and future booking recovery. The review explicitly keeps rolling `right now` behavior and real provider recovery unimplemented.
## 2026-09-29 H001 native tail checkpoint and H003 scope correction

The current H001 Playbook remains stages 1/2, offline before independent review and Live. This checkpoint connects source-native ID/detail pointers to the existing TableCheck/Tabelog availability tail, requires page-owned name and complete-address continuity before HIGH, removes same-page phone as identity proof, and routes each native candidate only to its own platform. The existing Google candidate path remains intact because formal native discovery, location grounding, source facts and Router/Runtime composition are not yet implemented. No new generic entity merger or source-selection policy was added. The three required composition scenarios and planned model command are specified in [stage-2 preflight](H001-NATIVE-STAGE2-PREFLIGHT-2026-09-29.md); no fixed-source real model or H001 Live ran.

An older H003 Loop 2 request was incorrectly treated as active and produced one additional real TableCheck read before the main-task scope correction arrived. Its 77,685 ms and 11 model calls are retained in [scope deviation](H003-TABLECHECK-NATIVE-LOOP2-SCOPE-DEVIATION-2026-09-29.md), excluded from H001 acceptance. No further H003 work or Live followed.

## 2026-09-30 Native source read path checkpoint

Completed the bounded native discovery-to-read composition and its source-owned outlet continuity checks. The later H001 Google-only 10808 Live read reached a Tabelog candidate but produced no request-bound inventory or qualified result; the H003 TableCheck control retry also remained UNKNOWN. Browser Case Slice offline repairs addressed disabled-control observation and post-action budget usage without treating historical Live failures as successes. A separately authorized Teppen page read showed the September 30 calendar day closed for online selection; the Adapter now retains this precise date restriction as UNKNOWN, without asserting 19:00 stock. Current status, per-run timing, limitations and independent Eval are recorded in [STATUS](../STATUS.md) and the dated H001/H003/browser reports. No booking write occurred.


## 2026-09-30 — H001 dynamic fixed-source Stage 3 evidence-refresh closure

Three separately authorized fixed-source DeepSeek runs exercised the intercepted dynamic Tabelog detail page. Each made the page-owned date and party changes and reached `PRESENT_RESULTS`, but independent evaluation returned qualified `NO`: a later same-source fact observation had superseded the availability read’s provisional fact while presentation cited that obsolete ID again.

The read assessment now retains the current identity and availability evidence while omitting only superseded restaurant-fact IDs from the availability check’s cited set. The independent evaluator applies the same ordered-read condition when calculating required availability references; it still rejects a presentation that cites stale evidence. A local Chromium formal H001 composition recreates the legal availability-first sequence and proves qualified `YES` after the correction; its unavailable counterpart still continues to the TableCheck empty batch and ends `NO_VERIFIED_RESULT`. A follow-up review aligned native fact judgment with the controlled composition clock and narrowed evaluator replacement detection so a later same-source read must omit the old ID before it can retire it. The correction passed `npm test` 568/568, native composition 13/13, evaluator 51/51, the dynamic local Chromium availability/unavailable composition, browser fixture, typecheck, architecture check, build and diff check.

At this checkpoint, no corrected paid-model replacement, external provider request, H001 Live run, booking write, commit or push had occurred. The three original model artifacts remain immutable failure evidence; the later corrected model recheck is recorded at the top of this log. Current H001 Live delivery is still not signed off.

## 2026-10-01 — H001 A/B/C remediation and fixed-source real-model stop

Completed the H001 A/B/C review-remediation slice: retained source-owned pending detail entrances and progress across refreshes/errors; preserved the Tabelog keyword through observed region navigation; routed an observed discovery action through the existing formal Browser Executor; retained only same-source TableCheck reservation entrances; refreshed a rejected browser `COMPLETE`; and restored request-bound TableCheck DOM-only Offer parsing while rejecting wrong requests. The runner now registers the controlled `TABLECHECK_DISCOVERY_RECOVERS` source scenario for paid fixed-source verification.

Three user-authorized DeepSeek runs used only fixed source pages and a fixed Google response. TableCheck discovery recovery and dynamic local-Chromium Tabelog controls both presented a qualified result; the bounded-empty path truthfully finished with no result. No current website, H001 Live, booking write, Gold/semantic/fact-policy change, commit or push occurred. See [A/B/C record](H001-ABC-REMEDIATION-2026-10-01.md).

## 2026-10-01 TableCheck exact-query response compatibility

The TableCheck availability tail now subscribes only to a page-owned same-shop `/available` GET endpoint after HIGH identity and the observed reservation entrance are established. A source response can mark one exact time unavailable only when its URL binds the selected Tokyo date and adult count and its JSON is the provider's explicit `failure/data:null` form. Cross-shop, mismatched request, success/unknown payload, no response, and a broader requested window stay UNKNOWN. The diagnostic does not invoke a reservation form action.

One bounded no-model Chromium diagnostic of Dining&Bar LAVAROCK selected a diagnostic date, two adults and 19:00 through observed native controls. The controls read back, but the page emitted no `/available` response and retained a disabled submit control. This is recorded as a source-completion limitation, not a no-availability result or H001 result. See [inventory evidence boundary](H001-NEXT-ITERATION-INVENTORY-EVIDENCE-2026-10-01.md).

## 2026-10-01 H001 tomorrow native Live diagnostic

Ran the single user-authorized read-only H001 tomorrow variant after the native-current-batch and TableCheck response compatibility changes. Tabelog first reached a HIGH same-source Sushi Teppen and established omakase, but no safe October 2 date control existed; its wrong-date model proposal was rejected and no inventory was inferred. TableCheck then ran its own source batch, retained later entries, and recorded a public search result-anchor timeout rather than an empty provider result. The run uncovered that the explicit availability browser-operation ceiling was not propagated to native discovery: the latter recorded 31 operations under a command value of 30. No code changed in this diagnostic, no retry occurred, and no booking write was attempted. See [run record](H001-TOMORROW-VARIANT-NATIVE-LIVE-2026-10-01.md).

## 2026-10-03 H001 unified discovery/execution offline repair

Implemented the bounded A/C/D/E repair slice without a new model or real-site call. Native continuation now consumes retained source-owned detail entrances directly and preserves chunk entries until actually attempted; discovery operation ceilings propagate from the Live runner and source elapsed diagnostics are no longer clamped. TableCheck's unproven exact `failure/data:null` passive response remains captured but is diagnostic-only, never an inventory conclusion. The fixed-source runner now requires an immutable execution artifact, final independent evaluator sidecar, and scenario acceptance sidecar before its exit code can report success. The old `search_text`-href wait was removed in favor of current parser state plus the existing bounded shared browser loop. See [implementation record](H001-UNIFIED-DISCOVERY-EXECUTION-IMPLEMENTATION-2026-10-03.md). No H001 Live or booking write occurred.

## 2026-10-03 H001 tomorrow native Live transport stop

At the user's direction, ran one read-only H001 tomorrow-date variant against real sources after the offline repair. The semantic and Agent decisions succeeded, then Google named-place resolution for Shibuya failed through the configured Google-only proxy before native discovery began. The runtime retained `GOOGLE_NETWORK_FAILED` and stopped after one search decision, rather than reopening the same request. No browser source, candidate, inventory, result presentation, or booking write occurred; this is transport evidence only, not a verdict on the repaired reservation-site path. The immutable result and independent diagnostic evaluation are recorded in [the run record](H001-TOMORROW-VARIANT-NATIVE-LIVE-2026-10-03.md).

## 2026-10-03 H001 unified review-return A–D repair

Closed the review-return implementation for native pending-entry consumption, observed retrieval, TableCheck current-result grounding, and current-batch completion. Pending details now consume at Executor navigation admission, stale nonempty search results cannot complete during a current-query load, and only an enabled, request-window-consistent HTML/control result can reach availability grounding. The Hybrid Live diagnostic artifact reuses the existing redacted browser session trace so independent evaluation can inspect snapshots, controls, passive responses, and sequence order. The repair is offline-only; the fixed-source real-model and final Live gates remain pending in the main review workflow.

## 2026-10-03 H001 unified final offline regression

Closed the final stale-query, source-session-budget and hidden-slot review variants in the existing native executor and TableCheck parser. Current-query completion is shared by initial and post-action listing reads; incomplete pages keep diagnostics and cannot admit stale cards. The source deadline includes session acquisition, and hidden reservation descendants cannot ground availability. Final offline typecheck, architecture check, build, full host-loopback test suite, fixed Chromium fixture, and diff check passed. The separately authorized fixed-source model and Live gates remain outside this offline record.

## 2026-10-03 H001 post-review Live query-field correction

A read-only Live comparison found that the native Tabelog path had started sending the full Agent retrieval sentence as `sw`, producing the source's explicit no-match response where the established HARD `omakase` keyword produced public listings. Tabelog now prioritizes the structured HARD term; TableCheck keeps its existing natural-language search behavior. The fixed discovery fixture now preserves actual fill values and verifies wrong-fill rejection. Offline gates for the changed path passed; no new model or Live run was performed here.

## 2026-10-03 H001 TableCheck observed reservation-path correction

A later read-only H001 trace reached Omotesandoria's selected date, party and enabled 19:00 link, but the shared same-outlet parser accepted only the existing `/shops/<slug>/reserve` shape and omitted the observed guide-owned `/<slug>/reserve/landing` shape. The parser now admits either public path only when its slug remains the current outlet and its URL binds the exact date, adult count and time; cross-outlet, wrong-request and disabled controls remain rejected. This closes a pre-existing URL-format coverage omission, not a restaurant-specific rule or a qualification claim. Bellwood's `require_service_category` state remains a separate unresolved source-control limitation; no course/category selection path was added. No model, source request, booking action or Live rerun was made for this correction.

## 2026-10-03 H001 final independent review and current-source verification

5.6 Terra delivered the implementation and the root/independent reviewers returned incomplete packets until the affected contracts closed. Besides current-query retrieval, saved-entrance continuation, current-result grounding and artifact/evaluation/acceptance ordering, final corrections cover a generic DOM-hydration race and a passive-response navigation regression. Control enumeration obtains one current group of handles; only positively disconnected nodes are discarded, while attached read errors and stale/disabled action validation remain. Local/Cloudflare navigation restores its prior response reset without removing capture rules/listeners. The final host-local fixture passes 64/64; the preceding 62/64 failure is preserved as a real current-packet regression. Earlier fixture-green provenance could not be matched to that code and is superseded. No retry framework, store whitelist, new executor or broader permission was introduced.

Three corrected-fixture real-model runs each delivered one controlled qualified result in 12,967–13,687ms / ten model calls. The subsequent full H001 tomorrow Live reached five admitted candidates/five stock checks and eight TableCheck details, within 231,118ms / 38 calls. It still presented no qualified result, so manual acceptance against the unchanged contract is FAIL. Omotesandoria exposed an old optional-`shops` path coverage omission; Bellwood exposed a required service-category control gap. Other candidates retain precise request-unconfirmed/timeout limits, not sold-out claims.

The optional-path repair now has a hash-matched original full-HTML replay and independently rejected foreign-outlet/date/party variants. A first targeted stock Live stopped on a detached Login element; after the generic observation repair, its single same-budget repeat read actual October 4/two-person/19:00 stock in 15,975ms / one model call. Independent raw stock acceptance is PASS, while HARD omakase and Runtime presentation remain outside the slice. H001's failed complete-run verdict is unchanged. Original execution records are immutable; future trace callbacks hash full HTML/text and preserve allowlisted evaluation evidence. [Final review, code freeze and artifacts](H001-UNIFIED-REVIEW-2026-10-03.md).

## 2026-10-03 H001 provider-observation budget@45s configuration variant

The user authorized one narrow configuration adjustment after the saved `61053f42` GENTLE provider path hit its 30-second ceiling: `LIVE_READ_DEBUG_INVESTIGATION_BUDGET.maxProviderBrowserMs` is now 45,000ms for both existing Web and H001 Runner consumers. The candidate cap remains 60,000ms, so the established alternate-observation margin is 15,000ms; model, operation, and all other global ceilings are unchanged. The implementation reuses the existing executor deadline accounting and CLI override. This records a new future-run budget variant only: no model, provider network, or Live command was run, and historical artifacts keep their original outcome and budget.

## 2026-10-06 — H001 qualified-delivery A–D implementation, offline review pending

**Historical gap / independent expectation / budget.** Earlier category fixtures supplied a legend and ordinary radio input, while the real public probe observed a POST `reserveform` with `reservation[service_category]` radios and no group label. Its first read was rejected by that invented label condition; the second read permitted the control but `setChecked` waited until the parent 25,850ms cap and produced no post-selection result. The repair removes the label assumption and uses the visible associated label for a styled native radio, followed by an observed checked-state readback. It does not force a value or assert that a changed page is fresh inventory. The bounded source-fact continuation uses the current 45s candidate / 30s provider / 4 browser decisions / 24 operations limits; its outer Web model scope is 500s and 50 calls, beginning before semantic interpretation. Google remains at 100 requests and browser's 120-call figure remains a sublimit.

**Scope and evidence.** TableCheck service scope carries field/group/value/label through grounding and presentation only after every delivered slot is a visible enabled same-outlet, exact-request, scope-bound live control. A scoped no-slot result remains `UNKNOWN`. Fact judgments now emit one derived evidence item per cited source scope, so a scoped positive cannot erase a separate unscoped restaurant-category conflict. Native fact continuation can follow observed criterion-relevant menu/course or official links; an external official page receives a new identity only from its own visible name/address or structured data. These are controlled internal paths pending root review; the real source has not supplied a category-result binding.
## 2026-10-06 — qualified-delivery review-return closure candidate

- Historical failure: the real TableCheck probe observed the category radio but never received a post-selection result. Earlier fixtures treated a changed selection and whole-page menu text as sufficient scope evidence.
- Implementation: native/ARIA radio observation uses actual form ownership and group identity; styled controls use an associated visible label only when state differs, then read back checked state. Scoped inventory no longer derives HARD facts from unscoped page menu text. Native fact documents retain each observed page URL/identity and only add official origins observed on the current confirmed source page.
- Budget/evaluator: the 500-second/50-call model scope starts before semantic work and remains held through the asynchronous Web read; raw evaluation cross-checks scoped offer/evidence/control/link lineage and treats a trailing `setChecked` as stale until a new result arrives.
- Scope limit: real TableCheck category result binding remains unobserved. Synthetic public-link fixtures prove internal read-only wiring only and do not establish Live category inventory.

## 2026-10-07 — qualified-delivery native fact artifact and provider-readiness regression

The native H001 production composition now saves its execution bytes before evaluation and hashes those exact bytes, rather than hashing compact JSON while retaining a pretty-printed file. `NATIVE_FACT_FOLLOWUP_DELIVERS` follows an observed same-outlet menu page after the detail remains insufficient, preserves each page's identity/canonical chain, cites the menu's Omakase text, reads the current Tabelog date/party/19:00 slot, and reaches `PRESENT_RESULTS`. Root independently reevaluated and accepted the saved fixed-page artifact; this is a C-only controlled composition result, not a category-result, model, or Live claim.

The provider-budget regression now delays one source snapshot observation by 31 seconds while an intercepted local Chromium page performs its ordinary asynchronous DOM update. The delay is cancelled by the parent signal or session close. The retired 30-second provider cap stops before that snapshot; the authorized 45-second cap completes the same production Adapter read and grounds the current slot. It does not widen the 10-second source readiness wait or the 2.5-second model `WAIT` action. Root's host Chromium gate passes **67/67** including this comparison.

The final default gate first exposed a shared scope-fixture alias, stale deadline/schema assertions and missing raw browser trace in the source-handoff composition. Those failures were returned to Terra and corrected within their existing tests; root's host rerun passes **633/633**, with no skipped/todo tests. Typecheck, architecture and build pass; unchanged production gates are reused after fixture-only repairs. The separately authorized 30-second, zero-model source probe has now run: its three artifacts total 21,766ms and establish selection/menu/current-query fields but no positive category inventory. Full Playbook acceptance remains blocked by the real category-result binding and B delivery proof; fixed-source real-model and full Live have not run. [Root review and immutable freeze](H001-QUALIFIED-DELIVERY-REVIEW-2026-10-07.md).

## 2026-10-07 — qualified-delivery B scoped menu evidence (offline implementation in progress)

**Historical gap and red evidence.** The earlier category fixtures only proved a synthetic `service_category` slot, while `NativeSourceFactRead` retained every source document unscoped. That allowed no production path from a selected public category to a cited HARD fact. The retained TableCheck probes remain independent red evidence for inventory: the first two did not reach a current selected result, and the final bounded probe observed the request only as `failure/data:null`, which remains `UNCLASSIFIED_FAILURE`, not an empty or positive inventory result.

**Observed contract, scope, and budget.** The final zero-model read-only probe observed a visible public `reservation[service_category]` radio group, a checked category value, category-tagged `menu-item-data`, selected 2026-10-07/two/19:00 controls, and one same-page `/available` GET containing the epoch, adult-count, and category fields. The public menu text carries the selected category's omakase statement. This package will derive scoped source documents only from that observed menu element/category association and the observed radio field/group/value; unscoped venue facts and venue-wide negative conflicts remain distinct. It will not infer a positive slot protocol from a category URL parameter or convert `failure/data:null` to inventory. The existing 45s candidate / 30s provider / 4 browser-model / 24-operation fact budget and 20/30/60/45 fixed-source limits remain unchanged.

**Independent expectations.** A category A menu statement must not support category B's slot; a source page with no structural category association must remain unscoped; a same-scope cited menu statement may support only a same-scope current availability result. The controlled result fixture will identify any category-bound positive inventory response as synthetic-only until a real current positive result/DOM binding is observed. Existing ModelFactJudgment, NativeSourceFactRead, TableCheck adapter, raw evaluator and native fixed-source composition cover the path; no new execution platform or source strategy is introduced.


## 2026-10-07 — H001 qualified-delivery B scoped-menu source chain

The TableCheck native fact read now judges the source guide first and only reads one guide-observed same-outlet `/shops/<slug>/reserve` entrance when HARD facts remain unresolved. The reservation page is a cited source page, not an Agent-proposed navigation. Its `menu-item-data[data-service-categories]` association creates a document scoped to the observed visible `reservation[service_category]` radio field/group/value; recognized scoped menu blocks are removed from the page remainder so they cannot become an unscoped substitute. The remainder is retained for venue-wide facts, including negative conflicts. Comment, script and style pseudo-markup, menu-item helper classes, malformed nesting, challenge/error pages and foreign canonical pages do not grant scoped evidence or HIGH continuity.

The three root-owned zero-model source probes consumed 21,766ms in total. Their first two diagnostic input defects and final completed query-contract read remain preserved: the final read establishes radio readback, scoped menu text and a category-bearing `/available` request, but `failure/data:null` is unclassified and establishes no positive inventory. The controlled `TABLECHECK_SCOPED_MENU_DELIVERS` result is explicitly synthetic-only. No model, network, Live or booking action was run in this implementation.

## 2026-10-07 — browser fixture baseline-order repair

Root's post-B Chromium gate exposed a test race: a fixture triggered its delayed visible mutation before recording the baseline passed to `waitForChange`. The saved failure did not retain that baseline's values; the 20ms order makes an already-updated baseline the diagnosis rather than a recorded fact. The fixture now asserts its pre-action values before the click in both the selected/disabled and checked-property cases. This changes neither Browser runtime code nor the wait/operation budgets. The four LOCAL/CLOUDFLARE intercepted cases pass on the host; no external source or model was invoked.

## 2026-10-07 — scoped reserve remainder paragraph preservation

Review found that the scoped-menu parser flattened the remaining reservation-page text before `NativeSourceFactRead` applied its existing 1,600-character statement ceiling. A sufficiently long remainder could therefore lose all venue-wide facts, including an explicit negative conflict. The parser now preserves public block-text boundaries in the remainder; the current source-document ceilings, scope rules and fact budget are unchanged. The native production-path regression retains 32 independent short remainder paragraphs and its venue-wide conflict while keeping scoped Sushi text separate. This was a code-review finding followed by root's independent green challenge, not a saved pre-change red replay. No model, source request or Live run occurred.

## 2026-10-07 — fixed-source category-query decision repair

The first authorized fixed-source model gate preserved a valid `REQUEST_HUMAN_HELP` when the browser-action prompt described an unselected service category as if date and party were unconfirmed. The saved trajectory shows the two permitted current radios and no action; the response was legal, so the repair does not weaken action validation or replay the model. `TableCheckBrowserAvailability` now reports `requestSelected` and `categorySelected` independently. The shared browser prompt and TableCheck source skill state that a source-permitted category radio may be a query prerequisite before time/result controls, require relevance to the current HARD criteria, and retain the one-radio readback. The existing production composition now proves both facts-first and availability-first legal Agent orders, emits a synthetic-only artifact and evaluator sidecar, and preserves the real positive-category inventory gap. No additional provider, model, network, booking or Live call occurred.

## 2026-10-07 — qualified-delivery real-model gate accepted, full Live network block

Root's final default host suite passes640/640, build PASS and affected intercepted Chromium controls2/2. After explicit supplementary authorization, the same comprehensive fixed-source real-model scenario presents one independently qualified scoped result in13,230ms / ten successful calls. Root regenerates source bytes and verifies17 raw obligations and all six acceptance dimensions with existing Evaluator@25; the preceding failed real-model artifact remains unchanged. Only DeepSeek is real in this controlled gate.

The subsequently authorized full Oct7 19:00 Tokyo / two-diner Live fails before browser execution at Google Shibuya named-place resolution:3,365ms / two successful model calls / one Google request / zero candidates or presentation. Root acceptance FAIL, separate manual completion NOT_COMPLETE. Post-run inspection observes the configured10808 proxy with no host listener; original transport cause was discarded, so no specific low-level cause is claimed. User then explicitly authorizes one current-network run bypassing10808; it starts with a process-only Google proxy override and unchanged500s/50call ceilings. Source code/.env/Gold/semantic remain unchanged. [Review and separate immutable artifacts](H001-QUALIFIED-DELIVERY-REVIEW-2026-10-07.md).

## 2026-10-07 — direct Google Live reaches websites, delivery still unaccepted

The explicitly authorized process-only Google proxy bypass completes the same Live input in88,187ms /12 successful model calls. Google location succeeds and actual Tabelog/TableCheck pages run. One Teppen candidate passes native identity and omakase fact reading, but its observed Oct7 calendar cell is closed and Guests2 disabled; the model does not substitute a date. TableCheck discovery opens the search combobox, rejects a WAIT with invalid contract fields, then waits30seconds trying to click a Find availability button obstructed by the search-suggestion/header layer. This produces TABLECHECK_DISCOVERY_INCOMPLETE, no scoped category/inventory read, zero inventory and zero presentation.

Root independently preserves the existing evaluator and six-dimension acceptance, signs FAIL despite CLI0 and normal no-result termination, and records manual user goal NOT_COMPLETE separately from automatic UNKNOWN. The trace supplies a concrete search-interaction failure not covered by the fixed-source category-delivery model gate; Teppen's current other-day-selectable shape also bypasses the precise restricted-calendar reason. No production code, `.env`, radius, budget, dataset, semantic or Gold changes follow this diagnostic; no extra model/network/Live retry or commit/push occurs. [Independent raw evidence and final current limitation](H001-QUALIFIED-DELIVERY-REVIEW-2026-10-07.md#separately-authorized-google-proxy-bypass-live).


## 2026-10-09 — P1-A WP-A eval decision capture

- 切片：仅实施第一阶段 P1-A／WP-A；在 `run-hybrid-live-read.ts` 的模型唯一出口新增 `--record-decisions`，不修改生产代码、调用参数、Prompt、预算、执行顺序或来源规则。运行入口改为直接执行时启动，使现有离线组合测试可以导入同一捕获实现而不启动 Live。
- 捕获：逐次追加完整 messages／outputText、purpose／prompt／schema、实际 timeout／输出上限／temperature／thinking、开始时间／耗时、finishReason／outcome／errorCode／usage。失败调用同样保存；运行截止时关闭未返回调用，晚到响应不追加重复行。文件只位于 Git 忽略的 `.eval-artifacts/`，产物记录路径／SHA-256／条数／捕获错误；创建或写入失败仅记诊断，保留原模型返回或异常。
- 浏览器关联：从实际模型 user message 读取 executor observation revision 和 URL；Runner 的既有 Recording sink 独立累计 snapshot 序号，并核对 URL／标题／实际可见文本后关联。两种序号不混用，不保存 headers／Secret／Cookie／整页 HTML 到 decisions 文件。
- 验证复用：扩展现有 `native-discovery-composition.test.ts` 的真实 composition／固定来源／fixture model 路径，补捕获数量、失败调用、实际 DOM 指针、存储失败不干扰模型、运行截止晚到响应只记一次；未新增矩阵、Runner 平台或评分器。Evaluator 保持原口径，仅复用现有诊断，不声明模型质量或整单 Live 能力。
- 边界：既有 Recorder 会省略不满足当前 grammar／sanitizer 的 DOM；snapshot 序号对应其原始计数，DOM 是否保存仍以 `recording.json` 的 documents 为准。本轮不修录制规则。两份用户提供的 Playbook 原文纳入提交；生产代码、冻结变体／见证、Gold@6、P1-B以后和任何 ADR 均未修改。离线签收后停止，不运行 Live／真实模型／外部来源，不推送。


## 2026-10-09 — P1-C C0 call-budget delivery

- 切片：用户完成P1-A独立归因后授权C0；模型剩余≤4且已有合格默认首批时复用交付窗口，不修改生产Prompt、Schema、资格或50调用／500秒上限。ADR-0038只扩展ADR-0031触发；旧Decision原文保留并标部分替代。
- 实现：RunBoundedModelGateway只读报告当前Task剩余次数，失败计入，结束scope不作当前预算。Persistent Web、Hybrid Runner、bounded fixed-source三处实际调用方将当前整单计数接入共享coordinator；窗口在决策前后检查，经事件→Reducer写State，期限仍≤45秒且不超过run期限。模型仍提出展示；临界后旧调查提议被拒，下一步可展示。
- 检错：复用hybrid-read-composition的Interpreter→Compiler→Grounding→Runtime→Validator→Router→展示路径，补正常与跨阈值正例，错误人数、过期、明确数量反例。原时间策略下正例失败，新策略实际PRESENT_RESULTS；W13从HTTP→Persistent→PGlite及真实计数路径证明Web接线，现有evaluator记录PRESENTATION_RECORDED。
- 历史回放：从kf-h001真实append-only事件重建#38／#49并逐字段核对捕获Context；原样State仍拒绝短批，增加窗口后fixture模型实际展示。#38原剩余13，本轮明确设4次边界；#49原剩余2。fixture不证明真实模型选择。两份待发送输入已保存；首次真实模型请求被自动审批以未授权具体payload出境为由拒绝，未发出请求。随后用户明确授权，两次真实DeepSeek各一次均选择PRESENT_RESULTS、ALLOWED并实际展示，合计2次调用；两份输入逐字段不变。
- 边界：不新增回放平台或阶段矩阵；一次性诊断脚本及产物只在Git忽略目录。不运行C0 Live、不改基线变体／见证／Gold、P1-B或C1以后；两份用户更新的Playbook（0.2／0.3）拟随C0提交，不推送。

- 完成核验：记录`replay.final-acceptance.json`及`report.md`；完整历史来源谱系来自seed前State version 9／10的8／9条冻结真实轨迹，新增模型耗时2,228／1,783ms，零浏览器／Google／来源读取。现有诊断六维通过，明确只继承历史来源、不声明本次完整Live；最初缺谱系的诊断失败和空prefix拼装保留。C0离线与本次模型选择门槛均完成，四门禁复用最后通过结果，不再扩张测试或工作包。


## DEV-2026-10-09-C0B

- 读取内保护最后4次调用：新增共享transport read scope，仅在Router的发现／事实／空位provider工作内启用；资格来自coordinator权威State和当前clock。模型错误被来源吞掉时，scope在Router边界保留原因码，返回UNKNOWN而非成功；Agent不受read scope限制。Web、Hybrid、固定来源三处统一接线；无合格或在读取期间过期不保留。Accepted ADR正文未改；两份独立复核Playbook原样纳入。
- 产物：`.eval-artifacts/p1-c-night-20261009/C0b/`；无新增站点代码，无来源／Google／真实模型调用；本地提交后继续E1，不推送。


## DEV-2026-10-09-E1

Evaluator@26将TableCheck原始证据绑定至同一候选AVAILABILITY阶段、observedAt之前最近快照；不采纳后续事实页或未来查位。rubric@21未改。固定来源及真实composition夹具补既有executor诊断sink；合成快照时钟由错误的10/3改为原证据9/8之前，未改成功断言。11份新评价写入今晚E1目录，旧评价不覆盖；只有kf-h005四维从NOT_EVALUATED到SATISFIED。


## DEV-2026-10-09-C6A

即时请求物化改为30分钟窗口及EARLIEST_IN_WINDOW，策略@6、Agent prompt@20/context@9；Router按时刻排序，资格排除已过去的时段。窗口整体过期后拒绝发现/事实/查位，复用END_READ事件记录窗口过期及最近可订时间的用户选择；内部失败保持失败。显式时间未改。新增Gold@7草稿，默认@6不变；Proposed ADR0039记录跨午夜单日期合同缺口。旧EXACT_ONLY执行合同全部退役，不加兼容分支。


## DEV-2026-10-09-P1B

新增run-decision-replay，原样messages复用真实gateway和Strict Schema，静态DOM加载禁用脚本/服务worker/WebSocket/所有外网，复用ControlRegistry和Executor runSkill捕获输入；前序记录重建动作及已有progress。冻结seeds@1不改；每种子每轮≤1次，失败计入共享night/phase预算，存储每次动作/token/耗时和标签汇总。旧Runner不存在，不增加新平台或替代生产执行。


## DEV-2026-10-09-C5a

C5a exposes enabled options clipped by the currently expanded list with outsideViewport, and CHOOSE_OPTION scrolls that list and revalidates node/label/owner/visibility before the existing click. Browser Prompt@13/Schema@9. No site knowledge or extra model calls. Existing disabled/foreign option tests previously required exposure before rejection, contrary to the explicit C5a exclusion contract; now they assert exclusion and forged-ref rejection. Dynamic guest Fixtures replace mandatory model SCROLL with four actions selecting exactly ten, preserving all date/party/evidence/DOM readback assertions. No source-site code deleted.


## DEV-2026-10-09-Q8

Q8 analyzes all 11 existing runs only. discovery/queries.json and discovery/report.md retain 42 listing navigation/continuation observations, provider, actual URL and query parameters when captured, parsed versus admitted counts, recorded Agent retrievalHint, and witness appearance against existing frozen prequalification/rechecks. Repeated real navigations remain distinct; snapshots do not fabricate queries; native cursor continuation and missing Google transport are marked separately. No new source access, recheck, code, or model call. Agent-owned next retrievalHint or existing category after sparse parsed/admitted outcomes is a minimal C7 proposal; any P1-D orchestration expansion remains subject to ADR approval.


## DEV-2026-10-09-G1

G1 Proposed ADR-0036 supplement and narrow generated reserve GET document grammar implemented ONLY on codex/g1-tablecheck-reserve-read-draft. Exact origin/path, required unique start_date+pax, no other fields, GET document only. Generic Guard enforces source-owned anchored pathname grammar and prevents prepared GET from admitting HEAD/POST. No real pages, writes, model calls, or current-branch Guard changes.


## DEV-2026-10-09-G1-INTEGRATE

User approved G1 integration on 2026-10-09. Merge isolated branch with accepted ADR-0036 supplement, preserving original accepted ADR body and frozen inputs. Production Guard remains exact GET document with unique start_date+pax. Two existing reserve-menu compositions now call the production Guard with actual source-owned policy; each checks fixed-query delivery and bare-link rejection/no qualified result. The positive fixture source link has the admitted query, rather than bypassing policy. No Adapter inference or Guard expansion.


## DEV-2026-10-09-GOLD7-DEFAULT

User approved ADR-0039 and default restaurant-read-development@7 on 2026-10-09 after independent night review. Promote the separate Gold7 file (no draft executable duplicate); default loader/registry use it, Gold6 bytes retained unchanged. Materializer resolves both immediate window bounds from the original live reference; existing H001-H004 and literal user messages retained. Frozen variants still validate their declared retained parent dataset and exact SHA, rather than incorrectly requiring the new default parent. No variant, semantic prompt, qualification, evaluator or rubric change.


## DEV-2026-10-10-G1b

G1b reviewed static assets implemented; ADR-0036 supplement appended under user approval 10/10. Narrow source-owned CDN path/type admission, no runtime write expansion. Playbook 0.5 independent-review changes retained.


## DEV-2026-10-10-TableCheck-empty

TableCheck ready widget reports selected date/party/mealtime EMPTY. Exact-time requests return UNAVAILABLE; wider windows return SELECTED_MEALTIME_EMPTY UNKNOWN without expanding the negative claim. Source message visibility and selected request stay required.


## DEV-2026-10-10-C1

Recent six browser execution steps implemented with action/target/field/outcome/reason/url-change; browser prompt15/schema10. All current callers updated; replay history mode reuses frozen messages without CSS. v3 adds 22 implementer-proposed pending-independent-label seeds, v2 unchanged.


## DEV-2026-10-10-C3

Unified browser post-action settlement (requests complete, DOM quiet 300ms, no visible busy marker, bound 4s). PENDING snapshots cannot complete or yield inventory. Retired Tabelog member-loader and TableCheck skeleton waits. Synchronous fixtures use readiness semantics; settled restricted calendar still remains a supported query surface.


## DEV-2026-10-10-Recorder

Recorder schema browser-read-recording@3 saves actually received reviewed public stylesheets as standalone CSS files with URL/SHA256/byte count, and preserves admitted CSS URLs and public asset references in HAR. Runtime and Guard behavior unchanged.


## DEV-2026-10-10-C0c

C0c preserves four shared model calls for honest END_READ when no candidate is eligible. System READ_END_WINDOW_OPENED persists the bounded reserve; qualified results retain C0 delivery. Router and Web report actually checked shops, per-shop unknown/unread causes and remaining scope. State@13/TaskDefinition@12/Agent Prompt@21; current callers updated, no compatibility path or data reset.


## DEV-2026-10-10-C6a

页面营业事实支持的零偏移现在窗口提前结束：已查公共来源全部明确关闭/无重叠营业区间时允许END_READ与最近可订时间选项；未知、API-only、部分重叠、跨夜与明确钟点不触发。Agent prompt@22，资格与原窗口保持。


## DEV-2026-10-10-P1-D

新增ADR-0040 Proposed窄草稿：待批准后删除地区表、Agent选择观察入口、权威LOCATION、详情坐标半径与一次换入口；五新地点仅列发现探测计划，代码未实施。


## DEV-2026-10-10-P1PRE-C3

共享页面等待补可见文字/交互状态稳定300ms路径，保留DOM静默路径与4秒上限；导出PENDING次数和等待总毫秒，轮播不再阻断已渲染结果。


## DEV-2026-10-10-P1PRE-reserve-results

Router对事实与查位采用同一门店完成检查点：保留量/交付时间触发时保留完整返回店的证据和结果，未完成店UNKNOWN/RESERVE_REACHED；已返回执行事件不再被continue丢弃，元数据记录触发原因及已完成店。


## DEV-2026-10-10-P1PRE-C6a

IMMEDIATE_SOURCES_CLOSED限制为至少三家已查门店全部明确不营业且无已查营业/未知；一家休息仍可继续查店。按用户要求恢复ADR-0039原句，范围调整仅追加补充。Agent Prompt@23。


## DEV-2026-10-10-P1PRE-progress-wording

执行器无变化反馈明确选择当前观察目标，只有确实加载时等待；不改变动作资格。


## DEV-2026-10-10-P1PRE-C4

通用同状态同动作同目标拦截写入 history/progress，连续两次返回 NO_SAFE_ACTION；冻结回放未达门槛，生产思考保持关闭，Prompt 不变。


## DEV-2026-10-10-P1PRE-Live

冻结14c1112的kf-h001/kf-h002/kf-h005三例已完成；@26 qualified分别YES/UNKNOWN/NO，h005结束范围评价NOT_SUPPORTED；只记录，待独立复核。


## DEV-2026-10-10-P1C3B-C3b

共享稳定判定只计短 document/xhr/fetch；导航短采样后按同一完成谓词在至少500ms间隔核验绑定结果。来源结果 busy 与整页图片/其他组件区分；加载中的库存不接纳。诊断保留真实URL、全部未完成类型、最久年龄、busy和文字变化。无站点分支，原 C3 正反例保留。


## DEV-2026-10-10-P1C3B-E2

evaluator@27按C0c区分已查、已发现和未解决集合；核验实际读取轨迹、逐店未知/未查说明及结束观察一致性。资格和来源证据规则不变。


## DEV-2026-10-10-P1C3B-C2a

通用可见日历按caption月份/年份与真实格子日期暴露不可操作观察，DATE_NOT_SELECTABLE不建立无位；查位普通CLICK不得切到非请求日期。请求人数已确认且日期不可选时一次决策后以UNKNOWN原因结束；请求日期可选路径不变。


## DEV-2026-10-10-P1C3B-C8

C8 已向 Agent 上下文加入来源类别观察（Google 类型与来源列表类别），Prompt@24 / Context@10；仅影响选店优先级，不改变资格、HARD 或候选合法动作。新增 seeds.v5 两条目标种子待独立标注。


## DEV-2026-10-10-P1C3B-Recorder

Recorder 保存所有 Guard 放行且通过现有安全检查的实际 stylesheet 响应，包括通用 GET；录制回调补 resourceType，Runtime/Guard 准入行为不变。保留 CSS UTF-8 BOM，保存快照中的已加载 CSS URL。


## DEV-2026-10-10-P1D-review-artifacts

原样保存 Playbook@0.9、独立复核及 seeds.v6；追加提交此前未跟踪的四份历史 witness 与 seeds.v1–v3，原文和 SHA 不变。用户批准 ADR-0040、检索词提前、退出条件5及一次 kf-h005 复测，按切片继续。


## DEV-2026-10-10-P1D-C3b-completion

Require every completed browser predicate to declare its bound result key and busy state; source-owned list/query regions replace page-wide busy fallback. Keep newest PENDING observation when keys differ; hidden Sen time templates cannot count as slots. Source packs and facts/Fixture callers updated. No Guard or qualification relaxation.


## DEV-2026-10-10-P1D-kf-h005-retest

冻结 920bad9 在干净宿主机工作树完成一次 kf-h005 复测；首次 preflight 503，恢复后使用一次环境重跑。305451ms、47 模型、Google 0；evaluator@27 合格交付 YES，展示 Sushi Ito Akasaka。见证原始 GET 响应结束后 2 秒内保存，不作归因。


## DEV-2026-10-10-P1D-replay-matching

Replay Runner 支持 seeds.v6 的排除集合和精确候选集合匹配；未知字段在任何模型调用前硬失败。用保存的 C8 输出和原 Live 动作离线计分，不新增模型调用。


## DEV-2026-10-10-P1D-P1-D

用户批准 ADR-0040 已实施：删除所有目录地区表/锚点选择，由 Agent 选择观察引用；LOCATION 精确填同次解析名称并传已有地址组成部分。首五详情四个越界才可换一次，预算和截止时间不重置。Browser schema@11/prompt@16，State@14/TaskDefinition@13。


## DEV-2026-10-10-P1D-final-report

P1-D 批次0–4本地提交完成；kf-h005冻结920bad9复测SUCCEEDED/evaluator@27六项SATISFIED，305451ms/47模型/0Google；P1-D八次发现探测10模型、新地点4/5，Ebisu失败保留。检索词实验76213a4只在隔离分支，ADR-0041 Proposed，不合入。完整事实与原始路径见 p1-d-batch-20261010/report.md，停止等待独立复核。


## DEV-2026-10-11-P1F-review-artifacts

原样保存独立复核与 Playbook@1.1；本轮六项按批准范围实施，保留上轮报告提交及未跟踪演示稿。


## DEV-2026-10-11-P1F-radius

默认附近半径共享为1000m，显式半径保持；ADR0037追加收紧依据。资格精确圆不变，历史交付另表重算。


## DEV-2026-10-11-P1F-distance

Context@11与Prompt@25投影已接纳来源距离及圆心类型，展示带米数；近距离只作条件相同时的偏好，HARD/资格/顺序不改。


## DEV-2026-10-11-P1F-location-resolver

命名地区解析带已知位置bias、精确匹配优先地理类型；仅商户或超过100km均歧义并保留来源候选，不替换中心。无城市/国家/地名白名单。


## DEV-2026-10-11-P1F-coordinate-address

坐标附近请求每运行至多一次Google公共反向地址观察；失败也缓存，源/时间/原因进入浏览器，精确圆心/入口名称规则不变，计入40次上限。


## DEV-2026-10-11-P1F-audit

退出条件 6 只读审计：共享生产层保留 Asia/Tokyo 与 Cloudflare Runtime 端点，严格字面清单非零；餐厅域名/站点样式/评测坐标常量未见。Phase 1 站点等待已删除。全部已授权非模型工作与报告完成，距离/检索真实回放仍受具体 DeepSeek 外发授权阻断；两次发现探测未达标，不追加。


## DEV-2026-10-11-P1FF-review-artifacts

原样保存复核者 Playbook 1.2（含 §2 第17条）及 P1-F准备批独立复核，范围冻结按用户 followup 第0–4项；DeepSeek 原已准备载荷明确授权，P1-D仅补第11次发现。


## DEV-2026-10-11-P1FF-navigation

整页 OPEN_LINK 与 NAVIGATE 共用剩余预算约束的默认20秒 navigationOptions；Guard公开GET表单提交同样用导航时限，普通控件保留5秒。Playwright导航TimeoutError归为BROWSER_TIMEOUT，模型导航失败不再被NO_SAFE_ACTION吞掉；地区已有观察但结果不完整为EXTRACTION_FAILED。无站点分支，关闭边界保持。


## DEV-2026-10-11-P1FF-discovery

第 11 次东银座补探测冻结 b301091，nearby、1 km 输入保持原样；78,977 ms、1 模型、1 Google，打开已选地区并读取 10 家详情，9 家半径内。P1-D 11/11 用完，判定留给独立复核。


## DEV-2026-10-11-P1FF-replay

完成授权固定回放：距离原样与注入各 4 条，共 8 模型；检索词在实验分支 a51a59c 各请求一次，共 16 模型。没有生成额外消息或网站访问，Google 0；实验代码不合入主分支。


## DEV-2026-10-11-P1FF-timezone

营业时间 grounding 的当日及前日 weekday 读取请求时区；Google 发现/详情、官网事实和 diagnostic evaluator 传递已有 intent 时区，不新增字面量、不改变产品时区合同或资格。完成本批报告后停止待独立复核。


## DEV-2026-10-11-P1F-A-loading

原样提交独立复核文件 2f10a27；新增评测侧 parentless novel dataset 载入支持，仅 src/eval 改动。8 个批准变体解析及 semantic/content 一致，5 个父数据集哈希验证，3 个独立 NOVEL_LOCATION_DIAGNOSTIC cohort。


## DEV-2026-10-11-P1F-A-signoff-stopped

P1-F A 冻结 73bfca5 后启动 5 次，只完成 3 份正式结果；h003 被外层观察误停已审核 read POST，h005 在 G1 公共 reserve 入口按本轮保守 URL 停止边界中断，三个新地点未启动。模型累计521/1500，整单Live22/33；0环境重跑，不推送，等待独立复核。


## DEV-2026-10-11-P1F-h005-retry-env

用户再次执行授权后，最小范围尝试h005，原冻结73bfca5/CLEAN不变。外层监测复用既有ADR-0036日历read POST与G1公共文档许可，不改变生产权限；两次CLI preflight TableCheck均503，间隔恢复检查206，按唯一环境重试规则停止。新增模型/Google业务/整单Live为0，累计521/1500、22/33；环境预留使用1、剩2。未推送，报告 .eval-artifacts/p1-f-20261011/rerun-20261011/report.md。


## DEV-2026-10-11-P1F-A-continuation-part1

按用户批准仅执行第一段，冻结73bfca5、同一干净宿主机工作树与配置，Kagurazaka→Nakameguro各正式一次；Kichijoji首次preflight TableCheck503未启动，按规则本段停止、并入第二段。无产品/Prompt/Schema/配置变更。新增81模型、4Google、2整单Live，累计602/1500、24/33；本段环境预留0消耗，剩2。不归因、不推送，原part-a-report末尾追加续跑记录，第二段与B未启动。


## DEV-2026-10-12-P1F-rev2-loader

仅评测侧加载器：当前可执行用例拒绝任何null和未知键，旧flow变体被拒绝，不再静默丢掉无效文档。批准rev2八例原文与完整semantic独立字面量oracle一致，Gold6/7未改；已退役annotation档案以原始YAML读取作历史内容对照，不作为可执行契约。生产签收仍冻结73bfca5，主树评测修复由外层预校验调用，不移入冻结运行；不改产品/Prompt/Schema/配置。


## DEV-2026-10-12-P1F-run-preparation

评测载入提交526fab6后，完成五例rev2离线重评、新旧总体结果不变；续跑与B外层脚本冻结SHA并各无网络空跑，交付后公开四参数GET校验已准备。生产73bfca5/CLEAN保持，已知多跳重定向边界按授权不修。指定复核文档缺失已请求路径；真实运行尚未开始。


## DEV-2026-10-12-P1F-review-read

独立复核仓库副本与Playbook1.6已通读，949b86f原样独立提交；第20条与§10批准口径生效。仅解除已安排运行的阅读前置，不改生产/Prompt/Schema/配置/外层冻结脚本；东京08:30第二段、11:00 B计划不变，生产仍73bfca5。


## DEV-2026-10-12-P1F-early-window

用户要求提前运行并明确批准只改外层时窗、重新冻结SHA；execute仅open/close表达式改变，生产73bfca5及其余脚本行为不变。取消两个原心跳，原版h005独立安排东京11:30–14:00，A第二段后接B h001–h004。


## DEV-2026-10-12-P1F-input-path-block

提前启动h003在preflight成功后因外层case-source指向主树而被冻结Runner拒绝，未正式启动。实施者准备错误，0模型/Google业务/Live，环境预留不扣；已保存原始preflight及日志，输入路径唯一修正需新的SHA批准，等待用户回复。生产/输入/脚本未再变动。


## DEV-2026-10-12-P1F-input-path-resolution

用户批准后，仅修正外层A输入路径至冻结工作树忽略目录并重记共享SHA；rev2原样复制SHA一致，其他脚本行为、生产73bfca5不变。此前路径失败保留，间隔超过15分钟后h003第2次已启动。


## DEV-2026-10-12-P1F-A-part2

第二段h003/h005/Kichijoji各一次正式运行，冻结73bfca5/CLEAN。h003展示3家TableCheck/evaluator UNKNOWN，h005零交付NO_VERIFIED_RESULT，Kichijoji AGENT_LOOP_NO_PROGRESS/FAILED。只记录、不归因修复。原外层null交付计数漏触发见证，按授权单独补存5份四参数GET原始响应，全部结束后1分钟内。A报告已追加，随后B h001开始。


## DEV-2026-10-12-P1F-B-h001-h004

提前完成B h001–h004正式运行，生产73bfca5/CLEAN及冻结SHA不变。h001失败；h002展示Ginza Sushi Sendou、390米，立即公开四参数GET确认selection含展示18:30，自动UNKNOWN留待独立复核。h003/h004模型分别在Agent/语义阶段返回402 Insufficient Balance，不重跑。记录外层h004日志误匹配与末尾打印错误，不改冻结执行脚本；真实preflight另存恢复文件。原版h005未启动，仍东京11:30–14:00且须人类确认余额恢复；不充值、不推送。


## DEV-2026-10-12-P1F-balance-restored

用户确认DeepSeek已充值，按原消息解除余额前置并保留402历史证据；东京07:04尚未到原版h005窗口，现有11:30心跳已更新，不新增API探测或重跑。


## DEV-2026-10-12-P1F-h005-preflight-1

按批准窗口东京11:30发起原版h005第1次preflight，TableCheck503，正式运行未启动。现有心跳改至东京11:46继续第2次，遵守至少15分钟间隔，不修代码或连续重试。


## DEV-2026-10-12-P1F-h005-final

原版h005在批准东京窗口内第2次preflight206通过，唯一正式运行完成SUCCEEDED/NO_VERIFIED_RESULT、零交付，自动NO留待独立复核。第1次503不计Live，两次间隔超过15分钟；不重跑、不归因修复。生产73bfca5/CLEAN与冻结SHA不变，完成心跳暂停，B报告追加后停止，不推送。


## DEV-2026-10-12-P1G-A-location

名称采用 NFKD、去变音符号及原有大小写／分隔符规范化，地理类型追加 colloquial_area；保留 locationBias、100 km 歧义阈值和商户拒绝。生产无新增地名。真实 Kichijōji 反例先红后绿；历史四地点使用已保存坐标与地址组件投影，顶层类型为重建，非原始 Google 响应 Replay。


## DEV-2026-10-12-P1G-B-honest-end

Non-system REJECTION_LIMIT, NO_PROGRESS and STEP_LIMIT reuse the existing Validator, Router and events: eligible candidates use the delivery window; otherwise NO_VERIFIED_RESULT lists the reason code, checked candidates/sources and unread gaps. Provider/network errors, exceptions and timeout behavior stay unchanged. No Prompt/Schema change. B h001 decision 28 already exposed 5 availabilityChecks and 33 checkableCandidateIds; optional prompt experiment omitted, no model-repetition improvement claim.


## DEV-2026-10-12-P1G-frozen-preparation

Frozen production 9b342871c514f963be5386e889c1542b1e6ce020 in new CLEAN p1-g-live worktree; P1-F 73bfca5 untouched. P1-G outer scripts add approved DeepSeek balance GET, four authorized cases, new budget/window/witness paths; existing post-delivery verifier/observer/reviewed read rules copied unchanged. Zero deliveries normalized to 0 for witness GET; preflight distinguished from formal result for accounting. No production/Prompt/Schema/config/Gold/variant changes. Heartbeat p1-g-10-13-live scheduled for 2026-10-13 Tokyo09:00, recertify witnesses before four runs. No real requests during preparation.


## DEV-2026-10-12-P1G-immediate-start

User explicitly approved immediate P1-G execution; scheduled heartbeat PAUSED. Only outer start/certification time checks amended and SHA refrozen. Production9b34287 and clean host worktree retained; budgets, post-delivery and safety rules unchanged. Start with fresh witness certification, then Kichijoji/h001/h003/h004.


## DEV-2026-10-12-P1G-live-final

四次授权正式Live已完成，生产9b34287和P1-F73bfca5工作树保持干净。吉祥寺解析Kichijōji成功但NO_VERIFIED_RESULT/自动NO；h001仍FAILED/REJECTION_LIMIT，未兑现修复B目标，只记录不现场修复；h003交付Aloft by Marriott Tokyo Ginza/TableCheck/150m/自动UNKNOWN；h004NO_VERIFIED_RESULT/自动NO。用户即时运行和十分钟后重试指令仅改变外层时窗与调度，运行配置/输入不改。7次preflight、3次503均未正式启动，原15分钟间隔保持；环境重跑0。见证认证和吉祥寺运行后六份四参数原始GET保留，唯一交付TableCheck沿用原trace。不归因或签收，心跳暂停；最终报告 .eval-artifacts/p1-g-20261012/report.md，本地提交不推送。


## DEV-2026-10-15-P1G2-honest-end

P1-G2 uses actual P1-F/G h001 event prefixes and verifies trajectory hashes before scrubbing state fixtures. The blocker is END_READ validation with a captured time earlier than persisted reserve openedAt, not state.failure (both null). Reuse AGENT_LOOP_TERMINATED for direct domain-owned NO_VERIFIED_RESULT with actual checked/unread gaps; eligible presentation keeps existing Validator/Router/Reducer and resamples time. Minimal read-phase transition in task-definition, no new event/Schema/Prompt/Evaluator/qualification change. Explicit system failures and unowned execution remain FAILED; local failures and model/step budgets give a user result. Shared summary has two real consumers. Scope/proof in .eval-artifacts/p1-g-20261012/report.md#p1-g2（2026-10-15）. Live and outer metadata pending; no push.

冻结补记：修复提交b55e91c，独立CLEAN工作树p1-g2-live，源码及Gold SHA与主树一致；复用已有本机依赖、不安装。生产冻结记录P1-G2/production-freeze.json。复核原文／外层过期批次信息待用户答复，尚无preflight、余额GET或Live；本地提交不推送。


## DEV-2026-10-15-P1G2-preflight-retry

用户“跑一次h001”后同步外层批次元数据并离线空跑；Google预检超时未启动。用户切换TUN和全局后要求即时重试，仅h001第2次获一次间隔例外，重新冻结execute SHA2fe4ab99（9文件SHA核对）。第2次UTC06:00:35.715–06:00:42.058：DeepSeek200、Google404可达、Tabelog200、TableCheck403，PREFLIGHT_PUBLIC_ENDPOINT_REJECTED；余额可用。两次均未启动正式Live，新增模型／Google业务／Live／环境重跑均0；累计970/1500、36Live、Google确认22／历史UNKNOWN。本次即时重试完成，未安排第三次；若继续须遵守剩余15分钟间隔与时窗。生产b55e91c/CLEAN、no-proxy及安全规则不变，evaluator不适用，无result／决策／录制。证据与报告见 .eval-artifacts/p1-g-20261012/P1-G2/ 及 report.md。只改外层和文档，复用修复四门禁862/862，离线空跑和冻结核验PASS；不推送、不宣称实际链路已关闭。


## DEV-2026-10-15-P1G2-preflight-final

用户要求十分钟后重试，第3次preflight于UTC06:18:57.192–06:19:04.931执行，距第2次18分15秒；balance可用、DeepSeek200/Google404可达/Tabelog200，TableCheck仍403。外层9,793ms、预检7,738ms，三次用尽记ENV_FAILURE，正式h001未启动，无evaluator/result/决策/录制／交付后GET。新增模型/Google业务/Live/启动后环境重跑均0，累计970/1500模型、36Live、Google确认22／历史UNKNOWN、预留1未扣；实际有网络预检与余额GET。冻结b55e91c/CLEAN、execute2fe4ab99、9SHA保持；复用四门禁862/862，纯文档／证据核验见P1-G2/final-preflight-verification.json。真实状态离线＋L1已绿，Live修复仍未验证，不能关闭h001签收缺口。心跳PAUSED，不第4次重试；本地提交，不推送。报告 .eval-artifacts/p1-g-20261012/report.md 的P1-G2节。


## DEV-2026-10-15-P1G2-403-diagnostic

用户要求查明403，限定两次公开GET（原Range／无Range）和一次无HTTP的DNS＋TLS握手：两GET均相同146字节nginx403，TableCheck证书校验成功。排除Range作为唯一原因及本次DNS/TLS连接失败；拒绝位于远端HTTP层，具体IP／地区／客户端策略未确定，不称反机器人或限流已证实。应用no-proxy不证明TUN未接管；未测试Chromium，未改请求身份／预检规则／生产。证据P1-G2/tablecheck-403-diagnostic/，报告P1-G2节追加；0模型／Google业务／正式Live，账本970/1500、36Live保持。纯文档及证据核对通过，复用四门禁862/862，三次preflight耗尽／心跳暂停保持。不推送。


## DEV-2026-10-15-P1G2-live-final

用户确认网络恢复并要求h001 Live，保留三次失败记录，为h001额外一次preflight设置专用门控，重新冻结execute ec4aa86b；9原SHA／生产b55e91c-CLEAN核对、门控正反核对及离线空跑PASS。第4次预检TableCheck206后唯一正式Live完成：SUCCEEDED/NO_VERIFIED_RESULT，终止REJECTION_LIMIT，最后轨迹READ_ENDED，缺口保留终止及局部浏览器预算原因。零交付；Sushi Teppen查位UNKNOWN/DATE_NOT_SELECTABLE，未声称全体无位。362.347秒、44模型/1Google、等待87.458秒/24.14%、未观察浏览器超时；44决策=44调用。evaluator@27 qualified NO、COMPLETION_OUTCOME NOT_EVALUATED（要求current-request END_READ观察），不改评价器或自判签收；录制NOT_REPLAYABLE/UNSAFE_DOCUMENT。原result/eval/decisions/recording路径和SHA见报告P1-G2节、live/h001/attempt-4/verification.json。无交付后GET／B见证GET，无启动后环境重跑；累计1014/1500模型、37Live、Google确认23/历史UNKNOWN、P1-G2预留1。只改授权外层门控与证据文档，复用四门禁862/862；真实状态离线＋L1和本次Live证明分列，停止待独立复核，不推送。前三次ENV_FAILURE作为历史保留、心跳PAUSED。


## DEV-2026-10-15-P20-guard

快进921aa76后，按第一阶段签收后的四项加固指令首先修P0重定向。普通route首跳＋预先安装CDP Fetch逐跳核对，原准入集合不变；原生URL／相对链接／Cookie保留，14/14真实Chromium覆盖多跳、XHR/fetch/静态资源、循环、popup/iframe/worker和CDN权限不晋升。原版真实接收端越界红灯已保存，修正CORS/LNA遮蔽后隔离原Guard复验；旧假route手动二次调用证明删除。四门禁绿862/862，完整浏览器97/99的两项旧动态发现失败在b55e91c也复现，报告明确保留，不篡改断言或越范围修复。真实远程引擎／当前外部来源未验证。ADR-0036只追加、Capability Matrix同步，证据 .eval-artifacts/p2-0-hardening-20261015/guard/，报告根report.md。0真实模型／Google业务／Live；其余三项继续，不推送。用户并行INDEX／Booking草稿／演示文件保留。


## DEV-2026-10-15-P20-limits

BrowserTaskExecutor模型／操作三限额必填且构造校验；Live Runner／Web／固定来源／探测／回放及Adapter调用方显式接线，原生找店20/120/80、事实4/120/24、查位20/120/80（独立探测按其入口显式配置）；每条执行器诊断记录实际生效上限，整单50模型不变。生产组合＋同一Guard/网络策略、真实脚本查位调用累计>12后再次找店，旧码BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED有效红灯，修复绿；不是手填预算，固定传输不证明实时网站。四门禁通过864/864，证据limits/red.log、green.log及四门禁日志；0付费模型/Google业务/Live。后两项与Live继续，不推送。


## DEV-2026-10-15-P20-termination

真实P1-G2 h001第6步后状态按事件前缀精确重建并核对轨迹hash，再脱敏为结构/码Fixture；旧码12次新搜索提议、TIMEOUT为FAILED红灯，修复后0次新增提议即NO_VERIFIED_RESULT。实际共享浏览器额度/整单额度耗尽在系统预判及动作校验拒绝；连续3次执行失败不再清零无进展计数。整单TIMEOUT按业务终止并返回TERMINAL，Web/Harness断言同步；服务商拒绝、异常、授权及副作用不确定仍FAILED，取消原样。15项终止回归及生产Guard L1旧组合保持绿，四门禁870/870。证据termination/，0真实模型/Google业务/Live；结构化原因与evaluator28继续，不推送。


## DEV-2026-10-15-P20-failure-types

State@15/TaskDefinition@14，noVerifiedResult.termination记录type/reasonCode/isSystemReason/initiator，区分系统发起与系统错误。State/Event/Router/读取metadata失败码显式typed集合，Model/Policy穷尽分类及Browser/Google类型覆盖；缺分类编译红灯与未知持久化码fail-closed。Evaluator@28/rubric@22核对系统事件、终态版本、READ_ENDED及已查/未查范围，只证明有范围的无结果。原P1-G2产物不改写，@27与@28原始重评完成均NOT_EVALUATED（原缺结构化字段）；第6步真实状态新终止离线回放SATISFIED、qualified仍NO，0新增外部调用。四门禁879/879，证据failure-types/；不更改资格/Prompt/Gold/变体/见证，不推送。


## DEV-2026-10-15-P20-live-h002

四项实现提交976baaa/60e78b9/f759c34/35b6bf0；生产35b6bf0在新宿主机树CLEAN，外层9SHA与双用例离线空跑通过。唯一h002正式SUCCEEDED/PRESENT_RESULTS，展示Ginza Sushi Sendou/TABELOG/390m；evaluator28 qualified UNKNOWN（条件措辞待独立确认）、证据SATISFIED，207.540秒/25模型/1Google，等待12.41%，无浏览器超时。立即四参数GET为200且18:30在selection，未触发停止；25决策=25模型，产物SHA核验，录制NOT_REPLAYABLE/UNSAFE_DOCUMENT。累计1039/1500、38Live、Google确认24/历史UNKNOWN，本批1/2、环境预留1。h001时窗已过未启动；每日及单次排程均遭自动审批拒绝，明确自动化未创建，需人类排程授权，不绕过。报告p2-0-hardening-20261015/report.md，纯文档核验复用四门禁879/879；不推送，P2-0未全部完成。


## DEV-2026-10-15-P20-live-h001-tomorrow

用户最新授权立即运行h001、date换明天；仅新建development-variant将tonight改tomorrow并同步semantic日期2026-10-16，其他条件与Gold逐项相等，原Gold/变体/见证不动。生产35b6bf0/CLEAN不变，外层重冻12SHA与离线空跑PASS。首次preflight后唯一Live SUCCEEDED/NO_VERIFIED_RESULT，Agent第11步END_READ，零展示；47模型/3Google、473.822秒、等待25.57%，有局部浏览器超时，未触发安全停止。evaluator28 qualified NO/完成维度NOT_EVALUATED，保留独立审计限制不改判；47决策=47调用、产物SHA通过，录制NOT_REPLAYABLE。浏览器共享调用达到36且>12仍有找店决策。累计1086/1500模型、39Live、Google确认27/历史UNKNOWN，本批2/2、0环境重跑/预留1。复用四门禁879/879与Guard14/14，完整浏览器2项既有失败保留。报告p2-0-hardening-20261015/report.md，不推送、不再运行，停止待独立复核；不建立自动化。

## DEV-2026-10-15-docs-eval-skill-2-and-phase1-signoff

独立复核者提交。第一阶段于2026-10-15签收（Playbook 1.8，`.eval-artifacts/p1-g-20261012/phase-1-signoff-20261015.md`）：条件1、3、4、5、6满足，条件2适用"能力目标转入第二阶段"；新发现找店阶段浏览器模型上限漏传（落到默认12/6）与预算耗尽后的死循环，连同`b55e91c`复核的三项后续并入P2-0加固批（`.eval-artifacts/p2-0-hardening-20261015/codex-instruction.md`）。另合入2026-10-12已批准的文档整理包：Eval Skill 2.0四层结构自第二阶段起适用，Test Skill 1.3补"外部运行时语义须真实验证、评测输入独立校验、等待有界"，INDEX 1.7标注当前阶段计划与已取代的旧计划，Browser Read Diagnostics 0.16把多跳重定向改记为已知边界缺口。无代码改动。

## DEV-2026-10-15-docs-merge-before-push

合并远端b36ec7f及其文档前序提交与本地P2-0六个提交，保留双方原提交和冻结SHA；冲突仅涉及STATUS、历史日志和月度索引，历史记录两侧原文均保留。复核材料、校准标签草稿和T1说明原样纳入，不执行新工作包；P2-0仍待独立复核。用户未提交的INDEX／Booking草稿和三个演示文件不纳入本次提交。

## DEV-2026-10-15-P20-h001-witness-after

按用户本轮授权，对h001的2026-10-16 19:00／2人向指定四店各发一次四参数Tabelog公开GET，4/4 HTTP200；原始字节、UTC时间、参数和SHA保存在`.eval-artifacts/p2-0-hardening-20261015/prep/live/h001/witness-after/`。复用既有captureVacancy，不改产品、Prompt、Schema、配置、Gold、变体、见证或冻结树；无模型／Google／正式整单Live增量，无重试或表单操作。不将较晚库存回写成此前Live事实，不重评或自行签收；本地提交，不推送。

## 2026-10-15 T1-2 浏览器门禁与动态 Tabelog Fixture

ADR-0040 后两条动态 Chromium 组合仍使用只会操作日期/人数的旧模型替身，且区域列表缺地区标题。先红后绿补齐观察地区入口选择与当前列表标题；资格和源请求绑定断言保持。Test Skill 1.4 明确 Browser 执行器/Guard/Source Pack/Adapter/读取组装触发真实本地 Chromium 门禁，与其余四条并列。离线证据见 `.eval-artifacts/t1-assembly-20261015/02-browser/`；未运行 Live、付费模型或见证 GET。

## DEV-2026-10-15-T1-1-ASSEMBLY


新增生产读取组装根并迁移Runner／Web／主要固定来源和Chromium组合；实际runCeilings、整单共享browserBudget、Router和loop只由一次组装返回。移除剩余隐藏数字默认，显式配置事实链并修复其忽略传入限额的接线。临时工作树恢复旧12次阈值得到目标红灯，恢复后通过。旧Hybrid手工组合在T1-5继续迁移／退役，未把本项视为全批完成。详见T1 report与01-assembly日志；仅离线，本地不推送。

## DEV-2026-10-15-T1-3-WEB-OWNER

在持久化会话发布前登记进程内准备阶段归属，并覆盖语义applyMessage至activeReads接手，引用计数与finally保护嵌套／重复调用。只解决当前进程被误判；无持久队列、重启后仍显式中断。统一读取组装经实际HTTP/PGlite验证；保留W07反例。T1 report／03-web-owner保存目标红绿和四条离线门禁，无Live、不推送。

## DEV-2026-10-15-T1-4-BOUNDED-WAITS

复用withinTestTimeout为Web测试外部同步信号加目标标签与期限，包括四处started、checking、finished、SSE整条消息、HTTP启停和重复投递settle。无数据流先红后绿，已resolve信号及正常Web链路对照通过；测试关闭连接清理残留SSE keep-alive。详见T1 report／04-bounded-waits；无业务策略或Live变化。

## DEV-2026-10-15-T1-5-RETIREMENT

删除Hybrid手工读取组装，完整来源测试由production factory产生所有读取组件／共享额度；两处真实使用者共用外部样本helper。删除一条旧adapter-only接线细节测试，七组有价值的部分端口契约迁至既有Router harness，明确不证明完整Adapter链路。迁移抓到SourceAware丢额度状态元数据，先红后绿补透传；策略／资格不变。清单与门禁见T1 report／05-retirement，仅离线。


## DEV-2026-10-15-T1-6-CDP

CDP每个Request暂停均执行既有策略，未知redirect标记不再直接放行；按networkId使用Network权威类型，维持Playwright脚本语义，不新增Other放行。八种规范化未复现原生跳转漏检，按指令允许分支交付；真实CDP隔离route后三类禁用receiver先红后绿，正常worker实际执行而跨源fetch仍被拦。T1 report／06-cdp保存范围与五门禁；全离线、不推送。


## DEV-2026-10-15-T1-HANDOFF

T1六项实现分别提交c256cc2／dcc1ad3／7b048bd／7626b89／4baf329／77c4580；最终源码77c4580不再修改。报告补齐按项提交号、目标红绿、五门禁、七组迁层及一条退役、宿主差异和未复现边界；临时破坏工作树清理，原证据及用户未提交设计材料保留。仅文档收尾，不重复代码门禁；最后默认881/881与Chromium112/112通过。待独立复核，不推送、不新增Live。

## DEV-2026-10-16-E1-0-INPUTS

按E1指令和用户SIGKILL补充封装22条已暴露输入：20原result及2份含started／decisions／外层中断／finish／trace的原始包。manifest逐文件保存来源路径、双SHA和字节数，未伪造result；两条排除能力分母，S0仅允许trace证明。输入提交后冻结，开发集不是新用例准确率。证据e1-evaluator-20261016/report.md；T1复核通过，E1其它项继续，仅离线。

## DEV-2026-10-16-E1-1

类型化读取。真实h002删除两端criteria时旧评测仍SATISFIED（01-reader/red.log），类型投影后NOT_EVALUATED并带完整路径；正常产物、非法类型和缺轨迹控制通过。所有判定已移除asRecord动态取字段，仅边界读取已消费字段；evaluator@29/rubric@23，不补造旧记录。输入冻结提交3389131。 详见.eval-artifacts/e1-evaluator-20261016/report.md，仅离线，不修改生产资格或历史输入。

## DEV-2026-10-16-E1-2

版本化措辞等价表。7793db8后以测试专用SAME表作反例，旧实现NOT_EVALUATED红；接入严格YAML加载和SHA后SAME通过，polarity反转与HARD降级拒绝；DIFFERENT冲突，未登记对保留UNKNOWN并输出待审列表。生产表初始为空，不填写真实8组人工判断，无传递等价推断。 详见.eval-artifacts/e1-evaluator-20261016/report.md，仅离线，不修改生产资格或历史输入。

## DEV-2026-10-16-E1-3

独立来源核验。真实h002仅改两份原始Tabelog响应日期，生产claims不变，旧版SATISFIED红，新版NOT_SATISFIED；优先已保存GET双SHA核验，其次录制响应，最后受限快照控件，全部缺失未评价。营业时间为评测器自己的窄语法，未知不冒充冲突，旧周二测试误配周一资料已修样本。生产合格函数值导入有隔离arch反例，类型导入正常。 详见.eval-artifacts/e1-evaluator-20261016/report.md，仅离线，不修改生产资格或历史输入。

## DEV-2026-10-16-E1-4

结果分类与真实中断包。基线d621d1b对实际SIGKILL包没有类型的目标红灯，现统一入口验证manifest、每份gzip与原始双SHA，真实Evaluator保存不可覆盖sidecar。两条均ORCHESTRATION_INTERRUPTED、能力分母EXCLUDED、用户目标NO；缺result的六维全部未评价，S0只用trace且两条均因中断/脱敏未评价。实际表单POST篡改为S0，BLOCKED对照不冒充已越界；正常交付、明确冲突、HTTP402及缺因果配对通过，人工标签不被读取。 详见.eval-artifacts/e1-evaluator-20261016/report.md，仅离线，不修改生产资格或历史输入。

## DEV-2026-10-16-E1-5

见证逐候选漏斗。5ca7972对真实运行后四店见证没有漏斗的目标红灯已转绿；共享CLI读取原库存及既有登记HARD/范围Gold，按artifact原始SHA绑定，h001自动CAPABILITY_MISS/S2，不读取独立复核结论或人工标签。四店逐项输出发现、实际身份/事实原始链、系统查位原因与独立库存、实际展示及HYPOTHESIS卡点。无位不误标交付卡点，缺独立地址不伪造跨源匹配。 详见.eval-artifacts/e1-evaluator-20261016/report.md，仅离线，不修改生产资格或历史输入。

## DEV-2026-10-16-E1-6

无进展行为诊断。0b1e2c2仍把P1-G2真实循环判SATISFIED的目标红灯已修；按实际拒绝、无新候选/证据/首次读范围、同类失败及完整URL次数判定。P1-G2超阈值为NOT_SATISFIED；P20同词4/5/6/7步实际输出，换来源不直接判错。上限与语义仅在Eval Skill及代码常量维护。 详见.eval-artifacts/e1-evaluator-20261016/report.md，仅离线，不修改生产资格或历史输入。

## DEV-2026-10-16-E1-7

按执行器实际限额核验资源。f2fc135对真实h002把actual全局模型限额改为1仍按声明120判SATISFIED，目标反例红；现在逐来源／阶段／候选比较effectiveLimits与实际计数，单列声明差异，单候选模型／操作超额均拦截，删除actual限额保持未评价。原始h002实际用量正常通过并报告FACTS 4/24与声明20/80差异，旧时间限额未记录单列未评价，不冒充deadline证明。Google-only及定位前停止的旧合成artifact缺actual限额，仍检查真实结果／原因／零浏览器调用，资源及依赖它的完成维度如实未评价，未手填限额或修改产品。 详见.eval-artifacts/e1-evaluator-20261016/report.md，仅离线，不修改生产资格或历史输入。

## DEV-2026-10-16-E1-8

零交付补登记见证的外层链路。cf5d5be中现有外层复查函数对真实吉祥寺零交付和既有三店登记表发出0次请求，目标业务断言红；现按未变的materialized请求与登记范围绑定，零交付各店一次四参数Tabelog GET、禁止跳转／扩张候选／重试，原始响应双文件及manifest可被真实Evaluator见证漏斗读取。非零交付、原版未登记和缺result不触发补见证，错请求／外域登记阻断。已接入现有execute结束路径，不复制Runner；现有h001/h002仍无登记，保持跳过；安全停止后不新增复查。 详见.eval-artifacts/e1-evaluator-20261016/report.md，仅离线，不修改生产资格或历史输入。

## DEV-2026-10-16-E1-9

保留h001两个真实Agent决策种子。f5fde99后的版本7空增量对照有132个旧种子、0个本批决策，目标断言红；现seeds.v7追加0133/0134，原capture #4/#28对应Agent第2/8步，完整原始消息和输出两行95,021字节保留，原capture SHA、逐行SHA、打包SHA及result SHA齐全。旧132条标注逐项不变；38候选=原1家+Google新增37家，不把候选集合缩为37。条件式可接受动作仅提议支持来源路径与保持请求，未写死店名；PROPOSED／待独立标注，评分动作数组留空、两条不计任何通过率，本轮不执行回放。 详见.eval-artifacts/e1-evaluator-20261016/report.md，仅离线，不修改生产资格或历史输入。

## DEV-2026-10-16-E1-4f

修正公共读取被误报为预约越界。22条输入包纯离线诊断暴露第4项S0路径分类器缺陷：includes(/reserve)把ADR-0035明确记录的Tabelog公共reserve_date_status_list GET在12次运行中误报为TableCheck reserve页面；真实h002目标断言先红，现只匹配完整reserve路径段，公共读取不判越界，改成POST或真实预约页非法参数仍S0，合法入口但参数值脱敏仍未评价。不读取人工标签、不改Guard或生产准入策略，保留首次错误sidecar并标superseded exploratory。 详见.eval-artifacts/e1-evaluator-20261016/report.md，仅离线，不修改生产资格或历史输入。

## DEV-2026-10-16-E1-5f

登记见证不随复查行丢失而缩水。在原始h001见证的独立副本中仅删除Sen一行，保留其他三行及独立登记表，旧漏斗3行而应有4行的业务断言红；现按登记集合补出缺观察的店，库存／可行性／卡点NE、观察时间null，不借旧slot文本或候选池补值。其他门店原始库存不丢失；缺HARD Gold也只让可行性NE，不把已有席位或生产判断当HARD支持。历史源文件逐字不变。 详见.eval-artifacts/e1-evaluator-20261016/report.md，仅离线，不修改生产资格或历史输入。

## DEV-2026-10-16-E1-4g

缺result中断的目标完成状态不猜NO。复核用户补充的NE边界：两份真实SIGKILL包缺result时，旧outcome仅因中断类型把userGoalComplete写NO，真实包断言先红；现在外层只决定ORCHESTRATION_INTERRUPTED，用户目标保持NOT_EVALUATED并注明缺result，两个包仍排除能力分母、六维NE、S0仅trace。反事实配对把真实支持交付记录与TEST_ONLY保存后中断组合，已支持的用户目标YES不被信号抹掉；删除实际结果则NE，不手填评分，不影响既有受控取消／预算artifact链。 详见.eval-artifacts/e1-evaluator-20261016/report.md，仅离线，不修改生产资格或历史输入。

## DEV-2026-10-16-E1-HANDOFF

E1输入3389131及1–9项独立提交已完成，补充9eb59e8／f0dc35b／a94d91b分别关闭公共读取误报、登记集随复查缺行缩水和缺result误判用户目标NO。源码冻结a94d91b；最终22份诊断与逐次PENDING对照在`.eval-artifacts/e1-evaluator-20261016/report.md`。人工labels、八组等价结论、五条口径及正式校准未完成，不声明E1整体签收；当前开发集不是Clean Baseline。只补交付记录、不继续源码／Live或后台任务，按用户授权推送后等待复核；原用户INDEX／预约草案／演示文件未纳入。

## DEV-2026-10-16-E1-PUSH-BLOCKED

本地64038dd交付后，敏感原始评测包的远端推送被自动审批在进程创建前拒绝，未执行、未换通道重试。只读核对origin为GitHub的wzhgogogo/Praxis、指定分支不变；需用户明确确认私有及20 result＋2中断trace包／评测产物至该目的地的授权。报告与STATUS如实记录阻断，源码和评测输入不变，等待回复，不宣称已推送。

## DEV-2026-10-16-E1-SUPPLEMENT-EQUIVALENCES

按用户新输入先pull，分叉后rebase至308f895（含b5bed22），唯一等价表冲突完整保留复核者表；单独stash并恢复用户INDEX，其他设计文件未动。旧加载器unknown schema反例先红，改按schema/revision/id/gold/system/verdict/decidedOn实际字段，内部归一化但不兼容旧空表格式，未知键/null/重复仍拒绝。两h003真实展示及capture第47行无预算/包间满足声称，报告逐字引用并注明未存UI边界。后续仅实现R2/R5/R6及最终校准；labels未读取，生产和冻结Gold未改。

## DEV-2026-10-16-E1-SUPPLEMENT-R2

两次h003在真实等价表接入后仍被旧规则判QUALIFIED的反例先红。共享冻结输入加载器绑定原始SHA与run；Evaluator按每展示候选保留全部HARD/SOFT/UNSPECIFIED criteria状态和依据，接独立soft-preference-observations Gold；明确不符预算转DELIVERED_UNQUALIFIED/S1，真实空位claim仍独立成立。无Gold、错SHA/候选、缺来源自由语义为NOT_CHECKED，不推断数值容差，不读labels。rubric递增24，Eval Skill集中更新。默认门禁揭露普通artifact误加载校准Gold导致隔离控制ENOENT，已限定仅显式冻结上下文加载，不把环境错误当变异捕获；无生产行为变化。

## DEV-2026-10-16-E1-SUPPLEMENT-RULES

R1/R5/R6真实运行先红后绿。区分合格交付与目标漂移、额外非阻塞偏好的过程缺陷，保留语义环节NS但不伪造用户未得到推荐；所有原条件、HARD与原始支持仍必要。R5用同任务/配置外层失败预检与Gold明确resolvedTokyoDate时间窗推导，不能用referenceTime的+08显示偏移。R6用终态记录系统码＋真实EXECUTION_FAILURE等相应attempt互证，包含审核明确的共享浏览器额度缺陷；不读run ID或标签。扩展既有冻结补评入口接显式SHA引用的外层/post-GET记录，不新建Runner；校准上下文只含路径与SHA，无评分。后续接历史见证及最终校准，未改生产行为。

## DEV-2026-10-16-E1-SUPPLEMENT-HISTORICAL-WITNESS

真实神乐坂外层记录witness字段被旧rows专用加载器拒绝，现读取实际保留的rows/witnessRaw/witness三种记录，明确rawDirectory，不动原文件。10条结果SHA绑定的见证引用覆盖可用登记Gold；有位仍需同请求raw、HARD及明确范围。正向Gold的criterion→quote映射不要求逐字复述；明确人工认证的负向条件只有完全匹配认证请求才可用，不从缺关键词推断。半径来自登记或冻结acceptance唯一明文数值，缺少不补1000。现有prepare helper改为只生成新目录自动输出、冻结输入哈希，仍不读labels；随后才最终比较。

## DEV-2026-10-16-E1-CALIBRATION-CORRECTIONS

355de64冻结22自动输出并校验SHA后首次读labels，真实比较退出1：类型17/22、交付7/8、正常S0 7/20。4个评测器遗漏按实际记录修复：内部NO_PROGRESS/REJECTION_LIMIT须失败/被拒动作、终止trajectory、SYSTEM event互证，独立S2不被原因抹除；如实有界无结果与调查充分性/资源合规分开，后者未评不删。所有规则不按ID分支。另明确检测Gold条件意外字段而不修复原始数据；KF-H002 around10损坏已请求独立更正。新增比较/证据清单helper只读保存输出和原记录，不调用Evaluator或把labels传入，原结果未覆盖。

## DEV-2026-10-16-E1-CALIBRATION-BLOCKED

源码8bdf88c冻结后重新生成22输出，校验SHA再比较：类型21/22，交付7/8，正常S0 7/20，两中断NE例外2/2，误判合格0，剩余已识别评测器错误0。比较仍退出1/BLOCKED，不把Gold损坏或trace脱敏改通过。最终报告逐项列11个S0证据缺失、2个独立许可规则缺口与KF-H002坏Gold，旧输出保留superseded。此后仅交付文档/证据，无判定源码变化，不重跑相同门禁；停止等待独立输入/复核。未推送，既有敏感载荷具体目的地确认仍缺；用户文件不纳入。

## DEV-2026-10-16-E1-REVIEW-CLOSURE

快进44e6aab后按用户确认收尾。34a195a以三SHA修正记录统一绑定全部5份rev1 result＋2份started，内存Gold视图用独立rev2，原产物/两版Gold不改。94d9a3d修正测试直接读取旧机路径及loader丢相对子目录；355e937将S0声明、越界独立输出，评测侧实现ADR-0035/0036读取规则并绑定各批reviewed-reads SHA，禁止导入生产Guard/政策；Eval Skill 2.7仅§7.1定义新规则。4ecc3b0仅外层按实际POST字节独立核对bodyFields，记录hash/字段类型/结果及每请求ID，真实本地receiver对照不以Guard准入自证，原值不落盘。7dd2645冻结37项后重评22条，保存全部自动输出才独立比较标签，类型22/22、8交付8/8、正常声明20/20、误判合格0，退出0；越界9已评、13明确历史缺证、规则缺口0。两个实际Evaluator→comparison挑战分别因缺规则／缺必要Gold退出1，无手填分数或删必要检查。

业务验证全离线，未改生产行为、原始数据、标签或Prompt；无模型/Google/Cloudflare/餐厅请求、Live或见证GET。已发现并列明历史Replay绝对工作树路径依赖，不迁移冻结种子、不追加回放。报告保存首次浏览器慢导航失败、定向通过和最终113/113，原因未定，不声明稳定性已关闭。当前成果等待独立签收，用户已授权推送同一私有分支；推送实际结果另报，随后停止。用户INDEX/预约草案/演示文件保持未纳入。

## DEV-2026-10-16-P21-prerequisites

E1已独立签收；P2-1第一段第0项完成。观察器迁入src/eval，全部调用方更新，浏览器测试不再依赖.eval-artifacts；3250ms本地响应下旧3秒请求失败红灯，新15秒测试时限在持续两CPU进程负载下连续5次通过。五门禁typecheck/arch/build通过、npm test926/926、真实Chromium113/113；迁移首轮遗漏调用方的失败日志保留。外层POST观察器、0交付补见证GET及reviewed-reads复制并冻结SHA，未新增规则；旧P2-0冻结清单保留作历史，本段不执行整单Live。0真实模型/Google/餐厅请求。证据p2-1-discovery-20261016/00-prerequisites与outer，继续发现探测工具；不推送。

## DEV-2026-10-16-P21-probe-tool

P2-1第1项发现探测工具完成：使用同一生产createLiveReadAssembly，每计划来源仅一次首批，不查位/交付；15模型/180秒上限含失败调用，来源未到达及指标下界显式保留。6份最近Live实际语义/位置按原SHA提取，仅按10fd06f批准variants.yaml换date，非date字段与独立criteria字面量核对。新增arch拒绝生产依赖本项探测/见证，实际import红灯有效；定向4/4、默认930/930、真实Chromium113/113及typecheck/arch/build全绿，6份CLI空跑0网络。输入/配置/认证脚本已冻结SHA；E1口径未改，Pack净变化0行。0真实模型/Google/餐厅请求，接下来认证并基线10次，做完ADR草案停下，不推送。

## DEV-2026-10-16-P21-witnesses

P2-1第2项运行前见证认证完成：6例均有当前可行见证，16原登记店全部保留，13家通过，32次公开只读GET；原始库存SHA及base_date/members独立校验全过，细节和未通过原因留证。不调用模型，不打开表单/点击时段；0 Google/整单Live。冻结认证集合、语义、工具及外层文件SHA后才能开始10次基线探测。工具260522e与五门禁930/930、Chromium113/113复用；只本地提交，不推送。

## DEV-2026-10-16-P21-preflight-wiring

首次探测在0ms预检配置失败，0HTTP/模型/Google/来源读取；原因是eval Runner预检参数位置错误。保留原日志，CLI改为有类型初始化，离线传输有效红绿证据通过；默认931/931、typecheck/arch/build绿，浏览器相关路径未改复用113/113。自动审批拒绝移除源码冻结检查且未执行，最终两层冻结边界均保留。首次模型前重新冻结@2，原清单与失败尝试保留；生产检索与6份语义/见证/预算不变，补一次未启动的编排失败，不推送。

## DEV-2026-10-16-P21-baseline-adr

第一段10次发现探测完成，86模型（含2失败）/15Google/0整单Live，四TARGET见证来源ID均未进入列表；CONTROL结果与超时/未到达如实保留。冻结0a25cae与active清单未变，931/931及Chromium113/113证据复用；ADR-0042为Proposed，0037只追加。报告见.eval-artifacts/p2-1-discovery-20261016/report.md；停在第3项，不推送，不实施第4–7项。

## DEV-2026-10-17-P21-readiness

ADR-0042已批准Accepted，探测40/模型450；新来源非空预检先于模型和正式运行，空/超时记ENV_FAILURE。十次旧基线TableCheck按复核改环境问题，Google精确官网ID分来源重算，原始产物不改；四门禁933/933绿，真实模型/业务网络/探测/Live均0。下一提交前记录P2-1a基线点，不推送。

## DEV-2026-10-17-P21-baseline-stop

Corrected the eval-only baseline stop predicate to use native source witness metrics; already-known exact Google website matches no longer trigger a false changed-bottleneck stop. Effective offline predicate red/green saved in followup/03b/baseline-stop-*.log. No production changes in this commit; 0 model, website, probe or Live calls. Prior readiness gates retained; current typecheck/arch/test/build also pass.

## DEV-2026-10-19-P21-tablecheck-get-draft

Authorized commits35c5dc2/4315ab8/3094193 pushed. Zero-model real TableCheck comparison proves catalog metadata GET and actual search GET at the new tablecheck.net origin; current Guard blocks catalog. Narrow GET declarations, API-document readiness count and frozen external GET audit added with effective red/green evidence. Actual search still requires browser CORS OPTIONS (requested GET, header name x-api-key); GET-only constraint preserved while clarification is pending. This is a partial transport fix, not a completed baseline. No witness recertification/probe/checkpoint/Live started; model budget remains86/450. Isolated fix worktree only; do not replace baseline point until transport is complete.

Final GET-only offline gates: typecheck/arch/build PASS, default935/935, real local Chromium114/114. Actual CORS blocker remains; no formal probes or witness requests.


## DEV-2026-10-19-P21-tablecheck-cors

用户于2026-10-19批准最窄CORS例外：Pack的/search/ GET规则附带页面Origin与已观察头名；Guard在CDP核对真实browser-preflight initiator、请求GET、无body及同一GET查询语法。没有独立OPTIONS规则，不发起OPTIONS或注入API key。外层、Recorder、Live脱敏trace和独立S0按同一冻结审核接线；原始头值不落盘。ADR-0036补充仅追加。真实Chromium原合法GET阻断红灯已保存，修复后六种正反例通过；Playwright既有route会本地应答预检，测试核对CDP握手与独立GET接收端，不声称上游OPTIONS返回。含握手但缺忠实HAR的录制仍为NOT_REPLAYABLE。无Prompt、Gold或交付资格变更；实际网站对照和新基线尚未运行。

CORS补齐：实际对照两种模式均20家；地图查询的合法预检被Chromium记为xhr，按同一协议规则识别Other/Fetch/XHR，范围不扩到其他请求。原始误拒及独立S0反例留证；XHR本地样本仍为Other，明确不将其称为红灯。

最终协议依据：独立CDP观察证明四次均为浏览器预检，其中一次在Guard暂停事件缺关联Network标记；仅放开XHR类型不足。删除额外Network标记依赖，按实际请求的浏览器保留Origin/ACR*/Sec-Fetch-Mode=cors及已审核GET形状核验。真实本地“Guard无Network诊断流”先红后绿，独立CDP与GET接收端不受替换；手工OPTIONS尝试伪造预检头仍拒绝。无其他许可扩大。


## DEV-2026-10-19-P21-restored-baseline-ready

共同网络修复a60d27b（基于cac4b4f）已在真实来源验证：有/无Guard均20个解析门店，四条搜索GET200、四次合法浏览器预检放行，独立冻结S0边界审计ABSENT。见证重新认证32次公开GET，16原登记保留、13家合格，六例各至少一家，原始SHA/日期/人数/时段链接绑定独立校验通过；不打开链接、不调用模型。六份原输入SHA不变且Runner离线计划0网络/模型；共同配置/脚本/当前见证冻结后，十次基线在同一干净、未含P2-1a的工作树执行。原preparation/旧基线清单是历史材料；当前以network-restored-20261019/baseline-freeze.json为准。准备阶段0新增模型/Google/正式探测/整单Live，下一步是新基线；P2-1a还需变基到共同准备点，检查点A/Live不运行。

验证复用最终协议版五门禁936/936与真实Chromium115/115（源码不变），新认证校验/六份空跑/JSON与脚本语法检查通过，模式为0模型来源观察与离线准备；不是完整Live或资格交付验收。

## DEV-2026-10-17-P21-agent-retrieval

P2-1a implemented under Accepted ADR-0042: Agent-planned positive retrieval, visible same-region categories, at most two pre-detail rewrites, retained candidates and separate page budgets. Shared initial text proposal across TableCheck/Google; old post-batch expansion retired. State@16 has no compatibility path; no database touched. Baseline-before-P2-1a is 4315ab88fbab14424968ccbf0833f980c597de51. Effective planner/refinement and resumed-page-budget red/green evidence in followup/p2-1a; final five gates typecheck/arch/build PASS, npm test937/937, real local Chromium114/114. Fixed transports and local browser only; 0 real model/Google/restaurant requests, probes or Live. Checkpoint A and P2-1b not run; no push, await independent review.


## DEV-2026-10-19-P21-outer-preflight-resume

用户批准仅重冻外层并续跑剩余7项：每项仅对0模型、未正式启动的预检ENV允许补1次，所有旧失败保留；拒绝S0、已开始/完成的正式探测和第二次预检重试。外部恢复脚本独立冻结并从主树执行，cwd为干净acfaaffa基线树；源代码、输入、原外层及15模型/180秒预算不变。当前正式3次/13模型，另1次TableCheck空结果预检不计正式；累计99/450模型、13/40探测，0整单Live。

实际脚本语法与当前账本恢复正例、S0/已启动/已完成/第二次预检反例均通过，0网络/模型；证据network-restored-20261019/recovery/outer-resume-dry-run.json及freeze。源码未变，复用共同基线五门禁936/936、Chromium115/115及最终变基组合940/940、Chromium116/116；本提交先冻结外层，执行结果后续追加，不运行检查点A或完整Live。


## DEV-2026-10-19-P21-restored-baseline-complete

新的10次发现基线均在干净acfaaffa完成，新增55模型/55决策（全成功）、19正式Google＋11非空预检Google，0整单Live。仅神乐坂第2轮预检空结果停批，在用户明确批准的外层1b610a8下补1次预检后正式执行；旧失败和正式产物保留，0正式重跑。Tabelog见证列表1/10（H002 CONTROL）、TableCheck0/10、Google精确官网ID5/10；首批详情0/10。SOURCE失败码和指标观察范围限制原样报告，未把探测当交付或进行归因修复。累计20/40探测、141/450模型、45Google。

CORS共同修复a60d27b和新认证准备先于基线/P2-1a，P2-1a变基为39fc15e、直接父acfaaffa；源码增删补丁与原3094193一致。推送前发现远端复核0f7d43f，六份文档/日志原样保留为bdafd2e；其Google-only与可读性非阻断意见留到后续授权切片，本轮不改。报告network-restored-20261019/report.md及baseline-audit.json为当前开发基线，原10次与失败原样保留。检查点A等待新基线复核，不进入P2-1b或完整Live。


## DEV-2026-10-19-P21-checkpoint-a-freeze

用户批准进行检查点A。复用刚完成的0模型有/无Guard各20家对照、有效至10/20东京12:12后的同一见证认证、acfaaffa的10次基线；S0为0、基线预检ENV1次、4 TARGET原生来源命中0例，未触发新停止条件。A仅在干净39fc15e工作树执行，输入/见证/预检/指标与基线同字节；每次15模型/180秒/40Google，外层与计划先提交冻结，6份离线空跑0网络/模型。累计起点20/40探测、141/450模型、45Google；预检失败与基线合计超过2即停。A之后才单独修Google-only nearby，P2-1b/完整Live不启动。

外层状态正反例、语法、六份空跑通过；冻结sha与证据见checkpoint-a-20261019。A源代码与已通过的组合五门禁39fc15e相同，复用typecheck/arch/build绿、940/940和真实Chromium116/116；本准备0新增真实网络/模型/探测。


## DEV-2026-10-19-P21-checkpoint-a-stopped

检查点A按用户停止规则停批：仅H001第1轮正式完成，H001第2轮两次TableCheck非空预检EMPTY_RESULT，均0模型/未正式启动；连同恢复基线1次累计3＞2，剩余9次A不再启动。A新增4模型/4决策（全成功）、2正式＋3预检Google=5；累计21/40探测、145/450模型、50Google，0完整Live。

A冻结39fc15e、外层先提交e7e6913；输入/见证/规则SHA与干净工作树核验通过，用户草稿未动。复用五门禁940/940、Chromium116/116和typecheck/arch/build；1份A summary/trace/录制、4行capture SHA及两次预检原始文件保存。录制NOT_REPLAYABLE，不作Replay或完整业务验收。对照及全部未运行项见checkpoint-a-20261019/report.md、comparison.json与audit.json。

单个A的Tabelog见证true来自东京/涩谷通用导航列表；最终omakase3家、KEEP和首批详情与基线相同，不能把该命中解释为改写有效。3次规划5940ms/0超时，Tabelog3652ms=90秒预算4.058%，共享文本2288ms只计一次。网络形状S0_BOUNDARY为ABSENT，声明/其他严重度和9次未运行仍NE；环境根因未归因。只推送部分证据后停止，Google-only nearby修复因A未完成且命中停批规则而未开始，P2-1b不动。


## DEV-2026-10-19-P21-preflight-diagnosis

用户要求查清TableCheck预检原因；新增3次0模型公开只读页面诊断，带回调/去回调/实际生产预检均HTTP200、122条document hits，真实预检5308ms，未复现历史失败或403。确认程序缺陷：source preflight只设page.goto30秒，未prepareNavigation，Guard仍默认5秒；本地真实Chromium6.5秒响应在默认路径READ_TIMEOUT、显式10秒预算则200。确认无响应与明确空结果都归EMPTY_RESULT且不存HTTP/Guard详情。历史两次根因因缺证仍未确认，不把5秒机制或VPN追认成事实。

证据preflight-diagnosis-20261019/report.md/findings.json与三模式响应、本地timeout-fixture.json/log。首轮本地fixture缺根document审核配置导致启动失败，非目标红灯，已保留并只修fixture；真实超时对照两GET接收均验证通过。脚本语法/诊断断言通过，生产无改动，复用940/940、Chromium116/116及typecheck/arch/build，不新称完整门禁或产品修复通过。0新增模型/Google/正式探测，累计145/450、50Google、21/40，A停批账本不动；nearby/P2-1b未开始。诊断仅本地提交，不据查因请求推断新推送授权。


## DEV-2026-10-19-P21-preflight-fix

预检先调用 prepareNavigation，再以正式首批相同的35秒导航／单请求预算读取；不再把未收到搜索响应记为空结果，artifact@2分别保存 EMPTY_RESULT 与 NO_RESPONSE、HTTP状态、超时与Guard诊断。只有带状态或超时证据的失败进入停止计数；其余缺证失败仍阻止启动，留作预检诊断。

真实Chromium的6.5秒响应在旧代码下 EMPTY_RESULT/count0（red.log），修后返回1家/HTTP200（green.log）；既有空200、503无响应、无状态缺证及超时反例通过。五门禁typecheck/arch/build通过、默认941/941、完整真实Chromium117/117，日志见 checkpoint-a-corrected-20261019/preflight/gates/。

按aaeb088复核及用户指令，旧3次失败追加标注为“预检缺陷，原因未完全确认”，停止计数归0；旧A #1标为“P2-1a缺陷版本”并排除比较，原始字节与旧账本不改，4模型/1正式探测仍计费。探测上限42、模型450，累计145模型/21探测/50Google；本项0模型/真实网络/探测/完整Live。基线acfaaffa不变，接下来只修首页类别与规划提示，再重冻A；nearby留A后，P2-1b不开始。


## DEV-2026-10-19-P21-homepage-retrieval-fix

补齐Pack已识别的同地区首页类别：Pack从实际锚点提取本地区类别，执行器通过Pack地区绑定与当前可见LINK核对，继续拒绝隐藏、异地区与全国入口。未增加网络权限或资格放宽。Planner Prompt@2明确改写保留候选、少于5家优先相关类别、KEEP只用于列表足够；Schema@1不变。

A1原样7个类别锚点（snapshot5）旧Pack为0、新版大于0；生产组装的真实Chromium组合先红后绿，先改写再读取5家详情，原隐藏／异地区拒绝与候选保留覆盖仍通过。片段没有CSS，不当作原网站Replay；可见性由本地控件与新A来源另验。红灯red-pack.log/red-unit.log/red-composition.log，绿灯green-unit.log/green-composition.log；五门禁typecheck/arch/build通过、默认942/942、真实Chromium117/117，日志checkpoint-a-corrected-20261019/retrieval/gates/。

本项0真实模型/Google/网站/探测/完整Live；累计145/450模型、21/42探测、50Google。基线acfaaffa不变，旧A1不计比较但用量保留。下一步新干净工作树从头A10；Google-only nearby留A后单独提交，P2-1b不开始。


## DEV-2026-10-19-P21-corrected-a-freeze

修正后的检查点A冻结为209ac4200a1330e0ed8e1bdcbd03dd30faac0a23，使用新的干净管理工作树p21-checkpoint-a-corrected。基线acfaaffa、10项顺序和6份输入／见证／独立审核规则同字节；仅评测预检时限与诊断按用户批准修正。已核验未过期见证（最早10/20东京12:12）和基线TARGET原生见证命中0/4，未触发基线停止条件。

外层及315份源码／配置SHA冻结于checkpoint-a-corrected-20261019/freeze.json；真实模型前先提交。来源预检每次先行，只有具状态或超时证据的NO_RESPONSE／EMPTY_RESULT计停止，历史3次按复核排除；缺证仍阻止启动。每项最多1次预检专用补试，正式探测不重跑，S0即时停止。语法／停止及补试正反例、六例Runner离线空跑均通过，0网络/模型；复用修正源码五门禁942/942、Chromium117/117。

累计起点145/450模型、21/42探测、50Google；本轮A10每次15模型/180秒，仅发现、不查位、不交付。Google-only nearby在A后单独提交，P2-1b及完整Live不启动。


## DEV-2026-10-19-P21-corrected-a-complete

修正A10在干净209ac42全部完成，外层ee6ebd0／315冻结SHA通过；10次来源非空预检READY，0补试／0正式重跑／0计数失败，正式trace独立S0_BOUNDARY全ABSENT（不推断未知GET无副作用）。新增53模型／53成功决策、19正式Google＋10预检Google；累计198/450模型、31/42探测、79Google、0整单Live。

与acfaaffa同序输入的10次基线比较：Tabelog列表见证1→8／首批0→3；TableCheck列表与首批均0→0；Google精确官网ID5→3（名称线索不计）。列表含宽地区导航，不能当最终改写成功；页面内14次规划类别仍全0，本地提取7个原始锚点与Chromium机制绿灯不能证明真实页面类别扩展有效。总模型55→53，总时长788353→1062253ms；24规划调用52395ms、0超时。两项READ_BUDGET_EXCEEDED及CONTROL候选减少按原记录报告，不归因为某项修复。

逐例比较、来源序列、实际接受历史、页数、半径、规划时间、capture／trace／recording SHA及四层评价限制见checkpoint-a-corrected-20261019/report.md、comparison.json、audit.json。807份历史文件字节不变，旧A1缺陷版本不参与比较且用量保留；录制状态不冒称Replay。源码不变复用五门禁942/942、真实Chromium117/117，另验纯文档链接、JSON、diff与预算。A后只做独立Google-only nearby局部修复，不开始P2-1b／完整Live。


## DEV-2026-10-19-P21-google-only-nearby

A10完成并提交52ff459之后才实施Google-only nearby局部修正：地点规划输入不把nearby当成地点名，已规划Google Text Search复用现有去除nearby的area值。命名地点、权威坐标／半径、HARD和交付规则均不变；未修改P2-1a冻结工作树、Prompt、Schema或Gold。

生产createLiveReadAssembly入口＋脚本模型＋受控Google传输先红后绿：带来源／观察时间的有效坐标Fixture中，旧版location=nearby／local food nearby，新版空地点／local food；命名地点对照和坐标约束、intent不变通过，意外浏览器访问被测试拒绝。最终有效红灯nearby/red-typed-fixture.log，绿灯green-typed-fixture.log。原始缺失类型标注及两个依赖nearby字面量的旧组合失败日志保留；仅将h003/h005 SYNTHETIC_CONTROL检索匹配元数据改为通用restaurant，不改任何来源事实或Gold，既有五案组合恢复通过。

最终五门禁typecheck/arch/build通过、默认943/943、真实Chromium117/117，日志nearby/gates/。本项0真实模型／Google／来源／探测／整单Live；总量保持198/450模型、31/42探测、79Google。证明仅L0/L1受控组合，真实A仍用209ac42，效果和限制见A报告；不开始P2-1b或完整Live。按用户授权推送后停止待独立复核，推送以Git回执为准。


## DEV-2026-10-19-P21A-DOM-CORRECTION

切片：当前DOM中的同地区Pack合法类别进入检索规划，取消CSS门槛；地区与语法不变。Prompt@3传递实际已试表达式，明确空且无类别时选择GENERAL或实质不同词；执行器记录REPEATED_RETRIEVAL_EXPRESSION并在原改写额度内转通用列表或结束，不加模型重试。所有调用方同步，Schema@1、资格、网络规则及P2-1b不变。Accepted ADR-0042仅追加用户口径修订。

有效红灯：categories/red-css.log（真实本地Chromium的CSS隐藏类别）；retrieval/red.log（重复已用表达式）。绿灯：categories/green-css.log、retrieval/green-final.log。Google三来源实际请求回归当前源码本就通过；受控移除既有关键词接线的google/controlled-disconnection-red.log只证明测试检错，不能称旧版红灯。旧A10原始trace均为GOOGLE_TEXT_SEARCH且含共享词，review的nearby回归假设未复现。

五门禁全绿，typecheck/arch/build通过、默认943/943、Chromium117/117；冻结源码SHA与日志见p21a-dom-replay-20261019/gates/。旧A10离线DOM按现有语法实为5/9/9/0，多出的数字类别合法且逐条保留，与复核预期5/7/5/0差异明示。原14条页面规划categories均0；录制只有6条对应DOM，另7条可使用后续同地区DOM作反事实，1条无同地区DOM，不冒称原样浏览器Replay。本提交0真实模型/Google/网站/探测/完整Live，累计198/450模型、31/42探测、79Google。证明范围L0/L1，后续14条单步L3真实模型回放门槛至少两个指定用例选择相关类别，通过后才允许新A10。详见[批次报告](../../.eval-artifacts/p2-1-discovery-20261016/p21a-dom-replay-20261019/report.md)。


## DEV-2026-10-19-P21A-DOM-REPLAY-GATE

14条原始页面规划输入按已提交4017981的请求/审计/脚本冻结执行；只发往现有DeepSeek结构化输出端点，0网站/Google访问，14/14成功，新增14真实模型，累计212/450。6条有原规划DOM，7条用后续同地区DOM反事实注入，1条DOM缺证保留空类别；不称原样浏览器Replay。h001选sushi、吉祥寺选tempura、中目黑选yakiniku，3个不同用例达到预先固定的至少2例门槛。KF-H005仍选local cuisine/regional cuisine/regional dishes，不宣称近义词行为已改善。逐条原/新选择和理由、usage见p21a-dom-replay-20261019/report.md及replay/summary.json。

新A10冻结生产ba20b8a7e0ae5d00d93838f7f19b0ae01364e2be，干净管理工作树p21-checkpoint-a-dom；基线acfaaffa、6份输入和见证字节不变。现有见证最早10/20东京12:12过期，仍有效，0重新认证请求。318份SHA、外层与10项计划在checkpoint-a-dom-20261019/freeze.json；六例Runner空跑、预检失败计数及仅预检一次补试/拒绝S0/已完成/二次补试离线对照通过。冻结脚本仅改批次目录与账本起点，停止规则不变。复用源码五门禁943/943、真实Chromium117/117；本阶段除上述14模型无其他真实调用，探测仍31/42、Google79。接下来仅A10发现阶段，每次15模型/180秒、先非空来源预检；不查位、不交付、不开始P2-1b或完整Live。


## DEV-2026-10-19-P21A-DOM-A-PARTIAL

新A冻结ba20b8a/外层0195189，干净p21-checkpoint-a-dom工作树完成5/10正式发现：h001两次、神乐坂两次、KF-H005一次。新增29真实模型/29成功捕获，10正式Google+5来源预检Google，0正式重跑。两次h001均观察5类别后选Sushi，原生见证进入首批；神乐坂均READ_BUDGET_EXCEEDED；KF-H005实际首页57类别选Washoku，见证未进首批。仅为部分发现事实，不宣称整批改进或交付。

第6例KF-H005第2轮在早期LIVE_NETWORK_PREFLIGHT失败：TableCheck首页公开GET HTTP503/TLS建立，其他端点可达；0模型、未正式启动。其原始result具有状态码，但被冻结外层只读后续source-data-preflight，误作PREFLIGHT_EVIDENCE_GAP并停批；不是缺失HTTP证据，不推定VPN根因。剩余5例NOT_STARTED。最小外层恢复补丁已准备，严格只识别此公开TableCheck503、原0模型/未启动、一次补试；13个离线对照拒绝S0/已完成/模型已用/二次补试/缺状态/其他路径。补丁未应用或执行，已按Eval Skill §5请求重冻批准。

部分对照、检索序列/规划耗时/页数/半径/分来源见证和所有summary/decisions/trace/recording SHA见checkpoint-a-dom-20261019/report.md、comparison.json、audit.json；29捕获等于模型数、318冻结SHA/工作树clean、1400份历史字节一致。五份独立S0_BOUNDARY为ABSENT，仅指冻结规则可核验范围，不证明任意GET无副作用。源码无新增改动，复用五门禁943/943、真实Chromium117/117，并验证本轮纯文档/JSON/链接/预算。总量含14条离线回放为241/450模型、36/42探测、94Google、0完整Live。原冻结账本预检计数仍0，拟将已有503作为1次NO_RESPONSE的重分类另存提案，不静默改账。P2-1b不开始。


## DEV-2026-10-19-P21A-DOM-OUTER-RESUME

用户批准recovery/outer-network-preflight-resume.proposed.patch，仅外层把已有TableCheck公开首页GET503/TLS已建立、0模型/未正式启动的原始网络预检，记为1次NO_RESPONSE，并使用原有1次预检补试。用patch实际应用后逐字核对与批准稿一致。13个既有离线对照重跑全通过，0模型/网络；缺状态、其他地址、非503、模型已用、S0、已完成、正式已启动、第二次重试、超出2次停止计数均拒绝。原脚本/原失败/账本快照与原提案保留。

新外层SHA256为60546a05fbba4d5c4434f129730a5011666025e64cbbd8acb6158ef68b11775c，新recovery/freeze.json SHA256为5444b8d68333bbf41e252aad81ae2ea08ac0e6221140882f20e0ed6657c4b933，冻结595个文件，含已完成5例262份原始文件。生产ba20b8a、干净p21-checkpoint-a-dom、计划/6份输入/见证/预算/只读网络规则不变；见证仍有效至最早10/20东京12:12，无需再次认证。只有index5首条恢复带--recover-network-preflight和--resume-preflight-only，后续6–9正常执行；原已完成0–4禁止重跑。

源码无改动，复用五门禁943/943、真实Chromium117/117，并复核原318SHA、空闲进程、budget和工作树clean；外层单独13离线对照/AST检查。累计仍241/450模型、36/42探测、94Google，恢复首条会追加计数/审批/原始SHA记录，不覆盖旧失败。先本地提交本冻结再续跑剩余KF-H005#2、吉祥寺×2、H002、中目黑。S0、来源预检及每例补试/全批>2停止边界不变；完成后按授权推送并停止，不开始P2-1b。


## DEV-2026-10-19-P21A-DOM-A-COMPLETE

按用户最新批准，b0d15d3先提交外层恢复及595份SHA，再续跑唯一剩余KF-H005#2、吉祥寺×2、H002、中目黑，均正式完成且各只跑1次。批准前已完成0–4五例262份原始文件逐字不变；原失败及6条旧attempt记录完整保留，原503只追加为1次NO_RESPONSE并使用原1次预检补试。13/13离线对照通过，实际恢复链通过且无新增预检失败/正式重跑，stop=null。

恢复新增20模型/14Google/5发现探测；整轮新A共49模型/49成功捕获、19正式+10来源预检Google、10发现探测。累计261/450模型、41/42探测、108Google、0完整Live。每例15模型/180秒边界不变，生产ba20b8a、原6份输入/见证/模型配置/Guard及停止条件均未改；见证未过期，0新认证请求。完整summary/decisions/trace/recording路径和SHA、外层逐attempt绑定、分类证据见checkpoint-a-dom-20261019/report.md、audit.json、comparison.json、recovery/execution-bindings.json。

事实比较Baseline→上一轮A→本轮A：Tabelog列表见证1→8→8/10、首批0→3→5/10；TableCheck列表/首批均0；Google精确官网ID5→3→5。模型55→53→49，正式耗时788353→1062253→942173ms（不含预检与等待批准）；本轮22规划调用/56097ms/0规划超时。KF-H005首批仍0、神乐坂两次仍READ_BUDGET_EXCEEDED，H002半径内解析家数30→10；不足和CONTROL下降不隐去。类别机制在本轮实际页面生效，但不把开发发现计数当资格/交付或因果结论。

原318/恢复595冻结SHA、干净冻结工作树、1400历史文件、首五例262文件、49捕获计数、JSON/链接/diff/预算均核验通过。十份正式trace按独立冻结规则均S0_BOUNDARY ABSENT，仅限已记录规则证据，不证明任意GET副作用；端到端交付及S0声明未评价。源码未变，复用五门禁943/943、真实Chromium117/117；本轮只新增外层13对照与真实发现恢复证据。已按授权准备推送，Git回执为准，推送后停止待独立复核；P2-1b及完整Live未开始。


## DEV-2026-10-19-P21-HARD-RETRIEVAL

用户按 38b058e 复核批准 ADR-0042 追加：关键词仅绑定正向 HARD；SOFT/UNSPECIFIED 只可选择观察类别。共享无正向 HARD 的规划直接 GENERAL，0 模型，Google 附近搜索保留圆心。Prompt@4/Schema@1；原 ADR 原文保留。实际生产组合 H002 旧 textQuery=first date/1规划红灯，新 Nearby/0共享规划绿灯，HARD 关键词正向及页面类别对照通过。离线 Fixture 补齐已切换的 Nearby 响应与独立地点观察，不改原始 Gold/变体。证据 `.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-20261019/hard-only/`；五门禁全绿（默认946/946，Chromium117/117），仅 L0/L1，不宣称网站/模型质量。检查点 B 与 P2-1b 待后续实施，本项0付费模型/网站/探测。


## DEV-2026-10-19-P21B-SEARCH-HINTS

按 Accepted ADR-0042 第5项接入两个真实来源的 Pack URL 筛选：仅 AVAILABILITY/权威日期人数/可完整表达的单一时刻，核对页面实际选中值；缺值、冲突、忙或空结果最多一次未筛选回退，预留回退页数，原七/三页及90秒不提高。卡片时段不建 AVAILABILITY/Offer，资格不变。真实 Chromium 生产组合正反例与额外参数拒绝先红后绿；strictQueryKeys 避免带筛选的请求经通用公开 GET 绕过完整审核语法，Guard 无站点分支。独立网络审计、冻结用新 reviewed-reads.json、Recorder vac_net 同步。五门禁全绿：typecheck/arch/build，npm test948/948，Chromium119/119。红绿/中途 Fixture 计数迁移失败均保留在 `.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-20261019/search-hints/`。证明范围 L0/L1；0网站/真实模型。来源包生产代码净增54行，未以无关删除抵消，不认证阶段通用性退出条件。检查点B随后冻结运行，无完整Live。


## DEV-2026-10-19-P21B-FREEZE

生产冻结4975f9f，HARD修正884c56b，对照A为ba20b8a；新干净宿主机树p21-checkpoint-b。B外层复用批准的503分类/每项一次预检恢复，退役一次性A恢复入口；13/13离线对照、六个输入plan-only均0模型/网络。315文件SHA与A输入逐字节一致；新reviewed-reads SHA86c2203c…，outer SHAf833a007…，见证最早10/20 03:12:46UTC到期，仍有效故不额外认证。预算起点261/450模型、41/52探测、108Google；已计预检失败1沿用，超过2停止。运行前冻结配置，禁止中途变更。复用本次P2-1b五门禁948/119，冻结项只做离线配置矩阵。仅十次发现，不查位、不交付、不启动完整Live；完成后推送待复核。


## DEV-2026-10-19-P21B-PARTIAL-STOP

生产4975f9f/外层冻结c20001a不变。B完成3/10发现（h001×2、神乐坂#1），17条决策=17模型，3/3独立网络审计ABSENT；h001首批见证1/2，对照A2/2，不宣称提升。神乐坂#1仍READ_BUDGET_EXCEEDED。神乐坂#2两次网络预检均TableCheck首页HTTP503/NO_RESPONSE，0模型/0正式探测；本批2次+沿用A1次=3，触发PREFLIGHT_FAILURE_LIMIT，余7项未启动，H002/Nakameguro对照NOT_REACHED。新增17模型/3探测/9Google，累计278/450、44/52、117Google，完整Live新增0。见证未过期，0额外认证；315冻结/2660历史SHA、干净树核验通过。产物/逐例A-B/停止证据见 `.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-20261019/report.md`。代码五门禁948/119复用，收尾仅按纯文档/报告矩阵检查。按授权提交并推送后停止待独立复核，不修网络、不追加请求或重跑。


## DEV-2026-10-19-P21-B-CORRECTIONS-SOURCE

current executable。按4592a1e复核及用户批准，仅修同地区首页筛选、稀疏有类别时禁止KEEP，以及TableCheck搜索筛选限制。Schema restaurant_discovery_retrieval@2、Prompt restaurant-discovery-retrieval-prompt@5；Pack显式SKIPPED/FILTER_TRANSPORT_NOT_REVIEWED，删除停用的构造／选中值路径，不扩网络权限或资格。三个旧筛选快照实际为Search is unavailable，含open_from/open_until的OPTIONS被既有Guard拒绝，不是正常0结果；诊断0网络/模型。旧B三次标为B第一版并排除比较；原报告h001 #2跳过原因更正为QUERY_NOT_REPRESENTABLE（原始文件不改）。有效红灯fixes/red.log、tablecheck-red.log，最终五门禁typecheck/arch/test951/951/build/browser119/119全绿，原厂factory/Guard Chromium 302首页组合通过。证明范围L0/L1＋已有录制离线诊断；新B与完整Live未启动，模型仍278/450、探测44/55。报告及日志：.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/report.md；fixes/verification.json。


## DEV-2026-10-19-P21-B-CORRECTED-FREEZE

current executable。生产a37e152b4283d8f407c9650d19200708314e3362，干净宿主机p21-checkpoint-b-corrected工作树；复用已验证生产五门禁951/119。仅按批准更新外层：预检失败归零按本检查点计、TableCheck503至少600秒后一次重试、最多1800秒恢复，持续503停止。17离线对照、六个原冻结输入plan-only通过，均0模型/网络；见证仍有效至2026-10-20T03:12:46.141Z，复用不新增认证请求。SHA清单322项；execute.py SHA-256 c4e0b8fbe51496888bb6f87776919dac586f1c90da864f9e5130ef5e1098dd40。模型起点278/450、探测44/55、Google117，最多新十次×15模型≤428/450及54/55；不跑完整Live。旧B第一版3次/17模型保留且计预算、排除比较。冻结路径.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/freeze.json；计划plan.json；外层offline-controls.json。源码门禁未变不重复，编排按纯外层离线矩阵核验。


## DEV-2026-10-19-P21-B-SETUP-RESTORE-PENDING

current executable。三项修正a37e152五门禁951/119通过；外层冻结3c4d241。首个外层尝试因新工作树漏部署冻结reviewed-reads.json，在Runner读取文件处ENOENT，未创建started、预检或决策目录，新增正式探测0／网络0／模型0；不是来源环境失败。原日志、ledger备份、0调用proof保留。已补齐原SHA审核文件，生产工作树仍CLEAN，冻结脚本未改、stop未清除。按Eval Skill§5发出最小外层恢复补丁批准请求，10项离线准入正反例通过（包括已完成／已正式启动／模型及Google计费／其他stop／不同HEAD拒绝），未擅自重跑。新B0/10，比较A全部NOT_REACHED；模型278/450、探测44/55、Google117、完整Live0。报告.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/report.md及recovery/，源门禁复用，文档／证据按纯文档矩阵检查；尚未推送。


## DEV-2026-10-19-P21-B-SETUP-RESTORE-APPROVED

current executable。用户明确批准恢复补丁。按原提案逐字应用，只允许已留证据的首次0网络／0模型／未创建运行目录的准备失败恢复，输出改用setup-2，原日志和原ledger备份保留；正式探测不可重跑。17外层对照及10恢复准入对照全部通过，0新模型/网络。缺失审核文件已按同SHA部署且新增宿主机文件SHA绑定。生产a37e152／六输入／预算／预检十分钟及三十分钟规则不变；复用五门禁951/119。重冻329项，execute.py SHA 649f752e8b90f343d3f8b8a7f6a67fc8355c286f0cb597985336bf5c5345eacd。此前源冻结和脚本保存到recovery/，按Eval§5记录影响仅首个尚未进入预检的启动失败。继续B10，仅发现；旧B第一版排除，新起点278模型/44探测/117Google。报告.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/report.md。


## DEV-2026-10-19-P21-B-CORRECTED-ENV-STOP

current executable / 本次外站效果未测。修正a37e152五门禁951/119全绿；初始3c4d241及首次0调用部署失败fc671b5保留。用户批准的精确恢复补丁在ae9288e重冻，17＋10离线对照通过，329冻结SHA包含实际审核文件部署；生产／输入／预算不变。北京20:49:03预检TableCheck503，首次结束627.529秒后在20:59:43使用唯一一次预检重试，仍503；TLS建立，其他就绪目标DeepSeek200、Tabelog200、公共Google404（非Places），根因未定。外层TABLECHECK_503_PERSISTED_AFTER_RETRY，检查点内失败2、起点0，按规则停止全部剩余。新B正式0/10，模型0、Google正式/数据预检0，累计278/450模型、44/55探测、117Google、0完整Live；全部B行NOT_REACHED，缺正式result/decisions/recording，诊断评价器不适用而非通过。A十行逐项对照保留，H002归HARD修正组，其余P2-1b；旧B第一版3次排除比较但保留用量和字节。329冻结及2893历史SHA、JSON/链接/diff核验，复用未变a37e152源五门禁；无源或配置继续修改，未额外探测／模型／重试。报告.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/report.md，原始两次网络result和timeline/raw SHA保留。远端新增标注／未来变体通过普通merge4f57841保留，不用于当前B输入。用户授权推送，Git回执为准，之后停下待独立复核。


## DEV-2026-10-19-P21-B-20M-RECHECK-FREEZE

用户最新指令“你等20分钟再测一下”，以收到后UTC13:09:14为保守起点，不早于UTC13:29:14（北京时间21:29:14）补一次网络可达性预检。复用冻结a37e152生产函数与no-proxy，不改产品、模型、输入、原execute.py或已停止账本；两次503仍保留，不伪装为原30分钟恢复窗口内的重试。外层独立environment-recheck-20m/recheck.mjs与plan/approval已冻结，329项旧冻结验证、plan-only、提前调用拒绝均通过（0网络/模型），一次性原子目录防重复。只核对NETWORK_READINESS，不运行来源数据预检、模型或正式探测；返回结果再记录原始产物。复用a37e152五门禁951/951与Chromium119/119，来源能力和B比较仍未验证。累计278/450模型、44/55探测、117 Google、0完整Live不变。原始证据：[独立预检计划](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/environment-recheck-20m/plan.json)。


## DEV-2026-10-19-P21-B-20M-RECHECK-RESULT

按用户“你等20分钟再测一下”，冻结e691ca0后在UTC13:30:16.007–13:30:27.363执行一次runDiscoveryProbePreflight；晚于13:29:14，不提前访问。TableCheck范围GET206、Tabelog200、DeepSeek模型目录GET200、Google公开根路径404，NETWORK_READINESS PASSED，生产预检11219ms。原始HTTP元数据及摘要/SHA保存于checkpoint-b-corrected-20261019/environment-recheck-20m/attempt-1。仅4次既有预检GET，0模型生成、0Google搜索、0正式探测；没有来源非空预检、浏览器或Agent评价。原停止账本SHA不变，两次503和计数2保留；该通过不代表列表非空或B产品效果，不自动恢复B。新B仍0/10、模型278/450、探测44/55、Google117、完整Live0。复用a37e152五门禁951/951、Chromium119/119；此次冻结/历史/链接/diff与raw完整性另核。推送本批后停止待复核。报告：[追加预检结果](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/report.md)。


## DEV-2026-10-19-P21-B-USER-CONTINUE

用户“你赶紧的”要求继续来源非空预检和修正B。独立outer user-resume-20261019已提交2f088b8：仅接纳两次503且0模型/0正式启动的停批状态，核对已成功补检与原账本SHA。原stop及完整账本另存，历史尝试不改，只追加恢复记录；保留计数2，任何新计数失败停批。生产a37e152、冻结输入和预算不变，无产品/Prompt/Schema修改。复用原Runner网络及来源非空预检，通过才开始模型，不另加重复来源请求。17项旧对照及7项恢复准入对照共24/24通过（0网络/模型）；复用源代码五门禁951与Chromium119。起点278模型/44探测/117Google，待原计划B10。报告：[续跑说明](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/report.md)。


## DEV-2026-10-19-P21-B-USER-CONTINUE-ENV-STOP

用户要求立即继续，外层2f088b8已在执行前提交；宿主机a37e152/CLEAN于UTC14:40:31.516–14:40:45.366尝试首例。TableCheck首页GET再返回503（TLS成功），DeepSeek200、Tabelog200、Google公开根路径404；NETWORK_READINESS失败，尚未进入来源搜索非空检查、浏览器或模型。21:30曾206、22:40再503仅为观测事实，不据此归因VPN、限流或网站。旧三条attempt和stopHistory前缀保持，旧账本原字节另存；本次新增1次失败，累计3触发PREFLIGHT_FAILURE_LIMIT，未自动重试、未启动其他例。0新增模型/搜索/正式探测，修正B仍0/10，累计278/450模型、44/55探测、117Google、0完整Live。复用原生产五门禁951/119及24项外层离线对照，329原冻结与2893历史SHA通过。来源非空、模型效果及B比较保持NOT_REACHED。原始result、日志与账本同步证明：[续跑结果](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/report.md)。保存提交推送后停止待复核。


## DEV-2026-10-19-P21-B-USER-RETRY4-ENV-STOP

按用户“再试一次，如果通过直接跑”，外层63a8136在运行前冻结，仅接纳当前0模型/0正式启动、历史3次失败的状态；保留旧attempt/stopHistory与userResume历史，允许这一次额外尝试，不放宽网络或来源非空检查。24项离线对照通过。UTC14:54:30.244–14:54:40.128再次尝试，TableCheck首页范围GET503（TLS成功），DeepSeek200、Tabelog200、Google公开根路径404。NETWORK_READINESS失败，来源非空和正式B均未到达，未增加自动重试。累计失败4、PREFLIGHT_FAILURE_LIMIT；本次0模型/Google搜索/正式探测，B仍0/10，累计278/450模型、44/55探测、117Google、0完整Live。复用a37e152五门禁951/119，原始HTTP元数据、账本前缀证明、冻结和历史SHA完整性均保存。报告：[本次结果](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/report.md)。提交推送后停下。


## DEV-2026-10-20-P21-B-RETRY5-SOURCE-PREFLIGHT-STOP

按用户“你再试一次，如果没问题就跑b”，外层76137e8已在运行前冻结，24项离线对照通过；生产a37e152、输入/见证/资格与预算不变。UTC02:07:09.619–02:07:55.426首例尝试中网络预检通过（TC206、Tabelog/DeepSeek200、Google根路径404）。来源非空检查：Tabelog20家/HTTP200/7581ms；TableCheck count=null、无HTTP状态、NO_RESPONSE/NO_VALID_SEARCH_RESPONSE/22178ms；Google文本搜索count=null、无状态、READ_FAILED/8001ms。不得记作搜索结果为0或擅自归因。来源失败缺少HTTP状态或TIMEOUT证据，不计入阈值，历史计数4保留，PREFLIGHT_EVIDENCE_GAP停批。未开始正式B、模型、决策或录制；本次0模型/0正式探测，Google搜索尝试1次，累计278/450模型、44/55探测、118Google、0完整Live，B0/10。旧attempt/stopHistory/recovery记录前缀均保留，证据和报告保存。复用源五门禁951/119，冻结和历史SHA核验；[原始路径与报告](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/report.md)。提交推送后停止，无额外重试或规则放宽。


## DEV-2026-10-20-P21-TABLECHECK-DIAGNOSTIC-CONTRAST

用户要求进一步核查网页正常而预检失败。冻结4552b06后，仅对同一Ginza预检URL做3次只读诊断，生产仍a37e152，Guard规则未改，0模型/0自有Google API/0正式发现探测。原生产runSourceDataPreflight在4149ms接纳HTTP200、122条接口文档命中；其关闭前页面尚未渲染卡片，不等于来源没有数据。手动原Guard与普通Chromium分别在3880/3610ms首次收到阳性API响应，随后页面都显示20张卡片及Showing1–20of652。请求分组口径不同，122不是页面总家数。全部响应早于20秒，未复现提前关闭、监听漏记或持续Guard阻断；此前geolocation拦截也出现于成功记录，不能作单独归因。历史NO_RESPONSE原因仍NOT_CONFIRMED，旧失败、stop账本和2893历史文件保持原样，不能用当前成功回写旧结果或再笼统认定VPN/网站故障。三组均无点击/填写，未观察到POST响应；不作全链路S0认证。B未启动，Google之前READ_FAILED未复测，累计仍278/450模型、44/55正式探测、118Google。复用原生产五门禁951/119，新增诊断仅脚本语法/plan-only及raw/冻结/链接/diff核验。[三组对照报告](../../.eval-artifacts/p2-1-discovery-20261016/preflight-diagnosis-20261020/report.md)。


## DEV-2026-10-20-P21-B-START-AND-RETRY10M-FREEZE

当前切片仅为已批准的 P2-1 修正B发现探测，不做完整Live。生产 a37e152 与原十项输入不变，16个注册见证原集合经32次公开GET更新认证，支持ID集合均未改变，0模型/Google；认证冻结0e4eed2、运行冻结8f39756。h001首例正式完成：84990ms、4模型、2正式Google+1数据预检Google，4条决策=4次调用，Tabelog/Google精确见证命中、TableCheck列表20卡片但无见证，录制网络独立审计ABSENT仅限该trace。第二例首页Range GET返回HTTP403，尚未进入来源数据/模型阶段；外层只识别503，记PREFLIGHT_EVIDENCE_GAP且历史计数4保留，缺口如实记录，不在运行中修代码。累计282/450模型、45/55探测、121Google、0完整Live。

用户随后批准“你可以十分钟之后再试一次”。只冻结新的外层准入：UTC2026-10-20 03:05:44后对未正式启动的index1补一次，来源预检通过后继续剩余顺序；已完成index0绝不重跑，既有attempt/stop/counter保留。24项0网络离线对照通过，原源五门禁951/951与119/119以源码和日志SHA复用。冻结输入/见证/指标/Guard不改；后续任何stop即停止，不自动追加重试。当前尚未执行本次补试，结果另记。[运行报告](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/report.md)、[新准入和时限](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/user-retry-10m-20261020/approval.json)。L0/L1门禁、0模型认证和真实模型发现证据分开，不宣称B全批或完整交付通过。


## DEV-2026-10-20-P21-B-RETRY10M-HTTP403-FINAL

按用户“十分钟之后再试一次”的批准，冻结03944f4/400项SHA/outer df8f94a...；宿主机生产a37e152/CLEAN与所有输入、原见证集合、Guard和指标不变。UTC03:07:10启动（晚于03:05:44），03:07:17结束：TableCheck首页Range GET再次403，TLS已建立；网络预检6339ms，TC1850ms。DeepSeek200、Tabelog200、Google公开根404仅为连通性结果。尚未进入来源数据、模型或正式发现阶段，未创建决策/录制/完整任务评价；本次新增模型/Google搜索/探测均0。外层仅识别503，因此保留PREFLIGHT_EVIDENCE_GAP和历史计数4，不能把诊断缺口改成额外重试。原始result SHA43be1d97...已保存。

修正B仍1/10正式完成、余9项NOT_REACHED，首例4条决策=4模型，未重跑。累计282/450模型、45/55正式探测、121Google、0完整Live。旧attempt/stop/recovery前缀核对后同步账本，原329冻结/2893历史文件不变；源262及门禁日志SHA复用五门禁（951/951默认、119/119本地Chromium、typecheck/arch/build PASS），24外层离线控制PASS。新运行仅为只读预检，不构成B改善或完整交付验证，H002组未到达。

用户最新要求不再重试并正常推送已完成工作；心跳已暂停，不启动其余运行。只同步本批证据与文档，用户INDEX和未跟踪稿件不暂存。[部分B报告](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/report.md)、[补试事实与raw SHA](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/user-retry-10m-20261020/attempt-summary.json)、[最终核验](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/user-retry-10m-20261020/post-change-verification.json)。推送结果以Git回执为准，完成后停下待复核。


## DEV-2026-10-20-P21-B-NETWORK-FIXED-RESUME-FREEZE

用户确认网页恢复并要求“现在应该行了。你再跑下b试试”，本次授权覆盖先前停止重试的指令，仅续跑未完成的B计划indices1–9，已正式完成的index0绝不重跑。生产a37e152、原十项计划/六输入、Prompt/Schema/指标/Guard/预算均不变；沿用8f39756冻结的同集合见证，最早有效至UTC2026-10-21 02:47:04。用户在宿主机添加en0作用域默认路由，独立物理出口公开GET获得TableCheck301/Tabelog200；当前实际直连规则覆盖TableCheck com/net及Tabelog。这些只作为宿主机环境观察，不替代Runner每例的网络和来源非空预检，未认证完整搜索或B改善。

新外层仅精确准入index1的两次0调用HTTP403预检之后的这一次恢复；账本与上次已提交SHA及回执一致，completed[0]、历史失败计数4、formalGoogle2/preflightGoogle2均保留，旧attempt/stop/recovery历史不清零。28项0网络离线对照PASS；408项文件SHA冻结，原329/历史2893/源码262和五门禁日志核对后复用951/951默认、119/119本地Chromium、typecheck/arch/build PASS。任一新stop结束本轮，无自动额外重试；源预检通过才正式发现，每次15模型/180秒/40Google，0完整Live。

本次准备新增模型/正式探测/Google均0，累计仍282/450模型、45/55探测、121Google；余9次最坏54/55探测、417/450模型。已批准正常推送将在结果汇总后执行，随后待复核；其他聊天P2-2/P2-3不动。[恢复授权与精确范围](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/network-fixed-resume-20261020/approval.json)、[离线对照](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/network-fixed-resume-20261020/offline-controls.json)、[冻结](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/network-fixed-resume-20261020/freeze.json)。


## DEV-2026-10-20-P21-B-NETWORK-FIXED-PARTIAL-503

- 范围：按用户“现在应该行了。你再跑下b试试”继续仅发现的修正检查点B；保留已完成index0，源生产`a37e152b4283d8f407c9650d19200708314e3362`及输入不变。当前恢复冻结提交`9b1e5f17fd604c98bca5d302a26f8cd82203f989`、408项SHA，外层SHA`180d48674c1d923840685fd8494d6f2d8a23d3adafeebcf3815482628b27ec6c`；28项0网络离线对照复用。用户在运行前修复宿主机路由，此环境变化限制A/B的单变量归因。
- 真实只读发现：本次indices1–4完成（h001第2次、神乐坂两次、KF-H005第1次），新增23模型、8正式Google＋4预检Google。每次三来源数据预检均通过，TableCheck返回122条命中；新产物决策数逐次等于模型调用数。B共5/10、27模型、10正式Google＋6预检Google；两次神乐坂来源含`READ_BUDGET_EXCEEDED`，不能把运行完成记为全部能力通过。
- 停止：index5于UTC2026-10-20T04:19:41.398进行NETWORK_READINESS，TableCheck首页GET返回503，未进入来源数据检查、模型或正式探测；保留原始响应与旧账本前缀，历史失败4→5，冻结外层触发`PREFLIGHT_FAILURE_LIMIT`。剩余KF-H005第2次、吉祥寺两次、H002、中目黑均NOT_REACHED，不额外重试、不继续P2-2/P2-3。
- 评价：按Eval四层分列；五条轨迹的独立网络审计ABSENT仅证明其记录内未见越界。十行A/B保留、只比较同例已到达的5行；H002的HARD修正组未到达。Tabelog见证进入列表3/5、首批2/5；TableCheck0/5；Google精确ID1/5。检索规划耗时、页数、检索序列、半径内家数和源级失败详见报告；仅发现不运行完整Task诊断评价，不证明实时库存或交付。
- 验证：生产源码未改，复用262源码SHA与五门禁（typecheck、arch、build；默认951/951、真实本地Chromium119/119）；核对408当前冻结、329原冻结、2893历史SHA、见证原认证、五条决策/模型计数及产物引用。按纯文档矩阵检查链接、账本、索引、diff和权威一致性；原网页录制字节保留，不清洗空白。未改用户INDEX、演示文稿与产品草稿。
- 用量：累计305/450模型、49/55正式发现探测、133 Google、0完整Live。停止后本地提交并按既有授权正常推送，等待独立复核，无后续自动运行。
- 证据：[B逐例报告](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/report.md)、[续跑汇总](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/network-fixed-resume-20261020/attempt-summary.json)、[预检时间线](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/network-fixed-resume-20261020/preflight-timeline.json)、[后验核验](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/network-fixed-resume-20261020/post-change-verification.json)。


## DEV-2026-10-20-P21-B-BROWSER-READINESS-FREEZE

current executable / 外层编排冻结；外站结果待运行。

用户最新明确授权：移除TableCheck首页Range GET网络预检，TableCheck就绪仅依据原有真实Chromium来源数据预检返回非空；DeepSeek、Google、Tabelog网络预检照旧。外层入口从冻结的原Runner机械生成，只替换网络预检调用、模块定位与被动环境信号观察；生产组装、Guard、来源数据读取、模型捕获、资格与探测指标保持原样，生产仍`a37e152b4283d8f407c9650d19200708314e3362`，干净工作树不改。

离线44项对照（18项实际预检传输/观察＋26项外层时序/重试）及5项冻结输入Runner解析空跑全部PASS，0网络/模型。原逻辑遇模拟TableCheck首页403/503失败，新外层只发其他三项网络检查；真实浏览器来源预检的非空/空/超时语义仍复用原函数。Google无密钥根端点只证明HTTPS可达，任意HTTP状态与其原行为一致；传输失败仍阻断。被动观察保留原Guard策略和回调存在性，不新增响应体读取。

新顺序indices8、9、6、7、5，既有completed[0..4]保留且禁止重跑。正常从上一次尝试结束起至少300秒；确切403/503或来源繁忙页从失败结束起至少900秒，仅同项重试一次，持续失败停批。旧累计失败5原样保留，旧stop按此次明确授权归档；新策略不沿用旧累计阈值自动拒绝本次准入。任何正式环境重跑都计探测/模型预算；总上限55探测、450模型、60MB压缩artifact不增加。S0和旧安全停止规则继续最高优先级。

源262SHA及原五门禁复用（默认951/951，真实本地Chromium119/119；typecheck、arch、build通过）；现有16个注册见证认证未过期，不新增认证。准备阶段仍305/450模型、49/55正式发现、133 Google、0完整Live。先提交新外层、SHA和离线证据，再在同一干净宿主机工作树执行，结果完成或停批后按授权推送，等待复核。

[本轮授权](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/browser-ready-resume-20261020/approval.json)、[顺序/预算](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/browser-ready-resume-20261020/plan.json)、[传输对照](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/browser-ready-resume-20261020/offline-network-contrasts.json)、[时序对照](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/browser-ready-resume-20261020/offline-policy-controls.json)、[冻结](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/browser-ready-resume-20261020/freeze.json)。


## DEV-2026-10-20-P21-B-BROWSER-READINESS-H002-429-STOP

current executable / 修正B部分真实发现证据，未整体验收。

- 改动及冻结：本轮只改外层，冻结提交`31866be3fbe104ccf696361e8f4a50edc14aaf3f`，738项SHA，生产仍`a37e152b4283d8f407c9650d19200708314e3362`。TableCheck去掉首页网络GET，原真实Chromium非空来源数据预检保留；DeepSeek、Google、Tabelog网络预检保留。18项传输/观察＋26项时序/重试离线对照、5项Runner解析空跑通过，0网络/模型；生产五门禁复用262源码SHA和日志SHA（951/951、119/119、typecheck/arch/build PASS）。
- 本轮完成：按批准顺序先跑H002，三来源预检非空，TableCheck200/122条；正式发现85,872ms、4模型、1正式Google＋1来源预检Google。Tabelog见证进入列表与首批，半径内解析候选30个；共享文本规划0次，页面类别规划1次，Google上下文nearby:restaurant。H002作为HARD修正组单列，不把这一个结果推广为P2-1b效果。
- 本轮停止：H002记录结束04:58:00.506Z，中目黑05:03:46.223Z启动，间隔345.717秒，满足至少5分钟。三项网络预检通过；来源数据预检Tabelog列表HTTP429/NO_RESPONSE/HTTP_STATUS，TableCheck200/122条，Google1条。该次0模型、0正式探测，1次来源预检Google。未记录403、503或冻结忙碌原文匹配信号，外层未触发15分钟单次重试，按来源就绪失败停批。字面停止码PREFLIGHT_EVIDENCE_GAP是未匹配失败分支；本次已有429状态证据，不能解释为无HTTP响应。历史失败5→6保留，但不是触发旧累计阈值；不归因VPN或网站防护。
- 完成/剩余：原H001两次、神乐坂两次、KF-H005第1次全部未重跑且SHA保留，本轮新增H002，修正B共6/10。余中目黑、吉祥寺#1、吉祥寺#2、KF-H005#2未正式启动，中目黑仅预检，其他3项NOT_REACHED。真实15分钟重试未触发，其规则仅由本轮离线对照覆盖。
- 评价与限制：原两次READ_BUDGET_EXCEEDED保留；完整十行A/B表只对已到达6行比较，H002/HARD与其余P2-1b分组。六条正式轨迹的独立网络审计ABSENT仅限这些轨迹，来源预检非空不证明查位/交付。录制均保存原SHA，NOT_REPLAYABLE/UNSAFE_DOCUMENT标记如实保留，不声称静态回放通过。完整Task evaluator不适用于本次仅发现探测。
- 用量：本轮新增1正式探测、4模型、3 Google（1正式＋2来源预检）；累计309/450模型、50/55正式发现、136 Google、0完整Live。原329冻结、历史2893、当前738与已完成314文件SHA核验；源码、Prompt、Schema、Guard、输入、见证及已有录制未改。纯文档矩阵检查账本前缀、产物、链接、索引和diff，原网页字节保留。完成证据提交推送，停止等待独立复核，自动化保持暂停。
- 证据：[逐例报告](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/report.md)、[新冻结回执](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/browser-ready-resume-20261020/freeze-commit.json)、[续跑汇总](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/browser-ready-resume-20261020/attempt-summary.json)、[429停止事实](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/browser-ready-resume-20261020/stop-facts.json)、[间隔核验](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/browser-ready-resume-20261020/pacing-verification.json)、[后验验证](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/browser-ready-resume-20261020/post-change-verification.json)。


## DEV-2026-10-20-P21-B-SEVENTH-RECOVERY-FREEZE

current executable / 本次仅外层恢复准入，外站结果待运行。

用户最新明确要求“继续第七次”。第七次为中目黑index9，前次仅来源预检Tabelog429，0模型、未正式启动；上次结束UTC05:03:56.504，现在已超过900秒。新恢复只接受这份原始429产物、原账本SHA、completed[0,1,2,3,4,8]、31个B模型调用和历史失败6；错误用例、已完成、正式启动、已消耗模型、安全停止、不同产物或提前时钟均拒绝。旧stop/attempt/recovery历史原样保留并追加本次人类授权，不清零。

新准入20项0网络/模型离线对照PASS，复用原44项预检/观察/节奏对照和5输入解析空跑。原冻结浏览器入口SHA47db4b10…完全复用；生产仍a37e152，262源码SHA、原五门禁951/951、119/119与typecheck/arch/build日志核验通过。826项SHA冻结，379份已存运行文件保护，用户INDEX、演示文稿、产品草稿不动。

准入后仍先做其他三项网络预检与三来源非空数据预检，TableCheck仅浏览器搜索就绪；正常间隔至少5分钟，明确403/503或已观察繁忙页才允许15分钟后单次自动重试，429未新增为自动条件。中目黑通过后，按此前已批准的剩余顺序吉祥寺#1、吉祥寺#2、KF-H005#2继续；任一冻结stop即结束。总上限仍450模型/55正式发现，当前309/50/136 Google、0完整Live，无额外认证或网站诊断。

[本次授权](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/user-resume-seventh-20261020/approval.json)、[20项离线对照](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/user-resume-seventh-20261020/offline-controls.json)、[新冻结](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/user-resume-seventh-20261020/freeze.json)、[运行前核验](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/user-resume-seventh-20261020/pre-launch-verification.json)。


## DEV-2026-10-20-P21-B-SEVENTH-RECOVERY-B10-COMPLETE

current executable / 完成十次真实只读发现探测，不代表完整用户交付或阶段签收。

- 冻结与准入：用户“继续第七次”后，外层恢复冻结`7103f0f24cd78febaaa8cacd1b42078e3292fbb5`、826项SHA。新20项0网络/模型精确准入对照通过，复用原44项外层对照、5输入解析和262源码/五门禁（默认951/951、真实本地Chromium119/119、typecheck/arch/build PASS）。原生产仍a37e152，原浏览器入口SHA47db4b10…完全复用；不新增自动429重试，旧失败计数6和全部历史保留。
- 第七至十次依序完成：中目黑66,740ms/9模型，Tabelog READ_BUDGET_EXCEEDED、Google精确命中；吉祥寺#1为74,501ms/3模型，#2为71,563ms/3模型，均Tabelog见证进入列表/首批且Google精确命中，无来源失败码；KF-H005#2为79,170ms/3模型，Tabelog见证进入列表未进首批，无来源失败码。所有原六项不重跑，四次预检均Tabelog20/TableCheck122/Google1，TableCheck200；Google来源预检状态未保留，不补造。
- 调度与边界：其他三项网络预检保留，TableCheck不做首页GET，只用原真实浏览器搜索非空。首个手动恢复距前429失败超过15分钟，后续间隔均至少5分钟；实际时间与原始响应SHA保存。无新403/503/繁忙页信号，无自动重试，无任何完整Live。十条正式轨迹的独立网络审计ABSENT仅限记录内，不能当作通用只读安全证明；录制NOT_REPLAYABLE/UNSAFE_DOCUMENT标记保留，不声称可执行静态回放。
- A/B十行对照：整体Tabelog列表8→7、首批5→5，Google精确5→4，TableCheck0→0；H002/HARD组首批0→1，其余9例/P2-1b组首批5→4。模型A/B均49，正式耗时942,173→806,489ms；规划22→18次、56,097→40,607ms，规划超时均0。READ_BUDGET_EXCEEDED为A2/B3（B神乐坂两次、中目黑一次）。不以耗时减少代替能力改善，不作单变量归因；宿主路由、来源数据、模型和外层节奏差异均披露。完整Task诊断Evaluator不适用于本批发现切片，用户交付/查位仍NOT_EVALUATED。
- 用量与验证：本次新增4探测、18模型、8正式Google＋4来源预检Google；修正B共49模型、19正式Google＋12来源预检Google。累计327/450模型、54/55正式探测、148 Google；artifact压缩估算54,638,987/60,000,000 bytes。49条决策逐次等于模型调用；原379运行文件、历史2893、原329/当前826及源码/门禁SHA核验，见证仍有效且未重新认证。按纯文档矩阵核对链接、索引、账本前缀和diff，原网页字节不清洗，用户INDEX、演示文稿和产品草稿不动。
- 完成后正常提交推送，自动化保持暂停，不启动完整Live或其他工作包，停止等待独立复核。
- 证据：[完整A/B报告](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/report.md)、[四次续跑汇总](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/user-resume-seventh-20261020/attempt-summary.json)、[新冻结回执](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/user-resume-seventh-20261020/freeze-commit.json)、[实际间隔](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/user-resume-seventh-20261020/pacing-verification.json)、[预检原始记录与SHA](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/user-resume-seventh-20261020/actual-readiness-verification.json)、[后验核验](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/user-resume-seventh-20261020/post-change-verification.json)。

## DEV-2026-10-19-P22-SELECTION-TIMING

- Evidence status: current executable isolated feature / exposed regression；分支codex/feat-p2-2-selection，主/P2-1树不变。
- 两个现有Pack推导availabilityPath，生产组装附到DISCOVERY，Context@13/Prompt@26仅给选择线索，资格/排序/预算不变；最新已观察值不借旧或未来提示。旧组合路径断言有效红灯，现有正常受控组合交付3家。
- Eval计时自动接Hybrid/来源探针成功失败产物；52份旧产物离线复算，明确未归因/缺时间；30次地区路径仅诊断，native-restaurant-search.ts未改。独立条件评分补充到原回放入口，无新平台。
- 复核e96a493 revision2经用户批准，冻结290658f后五颗各一次；首轮外层在格式错停于2/5，按用户已授权的仅外层修正6283843续跑未运行3颗，不重跑/清洗旧输出。5/30模型，门槛FAIL，未开始Live/第5项。证据与限制见[批次报告](../../.eval-artifacts/p2-2-selection-20261019/report.md)。

## DEV-2026-10-19-P22-STRUCTURAL-SCOPE

- P2-2首次查位结构约束离线通过：Context@14/Prompt@27与Validator同一scope，>=3未查且半径内直达时暂不提供名称解析候选；事实/显式刷新/资格不变。有效旧scope红灯、默认953/953及Chromium119/119全绿，0真实调用；本轮五种子回放留第3段。
- 证据：[后续报告](../../.eval-artifacts/p2-2-selection-20261019/followup/report.md)。旧实验/Gold/预算不变，原始失败不覆盖。

## DEV-2026-10-19-P22-TABELOG-SOURCE-BUSY

- P2-2 Tabelog繁忙页离线修复完成：Pack识别固定访问集中提示，原预算内等1秒后最多重试1次，仍繁忙为UNKNOWN/SOURCE_BUSY（ENVIRONMENT），不再冒充身份不确定；Google门店链接规范同ID英文页。保存的3次运行6份同形HTML红绿、恢复/真实冲突/期限控制通过；五门禁957/957与Chromium120/120。0真实调用，当前网站未验。
- 证据：[后续报告](../../.eval-artifacts/p2-2-selection-20261019/followup/report.md)。原始模型回放/Gold/预算和身份规则不变。

## DEV-2026-10-19-P22-STRUCTURAL-REPLAY

- P2-2结构约束真实模型回放达到门槛：冻结1646667，五颗各一次均可接受；神乐坂1/1、涩谷3/3、0133不退步，0134旧严格对照亦通过。新增5调用、累计10/30，0网站/Google/动作/Live；不额外重跑，历史见证未选中，非库存或端到端验收，继续已批准地区/测量工作。
- 五门禁957/957与Chromium120/120；原请求/Gold/旧产物不变，单步理由/独立判定/冻结SHA及四层限制见[后续报告](../../.eval-artifacts/p2-2-selection-20261019/followup/report.md)。


<a id="dev-2026-10-20-p22-region"></a>
## DEV-2026-10-20-P22-REGION

- Exposed development：集成主线8b70084/a37e152；仅地区阶段屏蔽已访问其他入口（Pack首页/列表别名），拒绝模型绕过，保留当前地区列表恢复。LOCATION清旧绑定，观察权威值且结果更新才重新绑定。ADR-0040、坐标/4/5/预算不变。历史旧覆盖遗漏与片段/合成控制分列[本轮报告](../../.eval-artifacts/p2-2-selection-20261019/followup/report.md#4-地区选择主线集成与离线机制修复)。0外站/新增模型；真实正确神乐坂路径未覆盖。

<a id="dev-2026-10-20-p22-timing-plan"></a>
## DEV-2026-10-20-P22-TIMING-PLAN

- 沿用52份旧产物（50可计时/2未评），汇总前三段为VENUE_SEARCH详情、Browser模型、查位解析；保留校准与仅发现分组，给出三个未实测节省区间/风险及同来源最小请求间隔方案。只写方案，0外站/模型、未实施、不变预算或门槛。报告：.eval-artifacts/p2-2-selection-20261019/followup/performance-proposals.md；纯文档核对原始汇总/算术/链接，复用第4段门禁。

<a id="dev-2026-10-20-p22-website-measurement"></a>
## DEV-2026-10-20-P22-WEBSITE-MEASUREMENT

- 脚本冻结cf11c54后仅读取52份旧产物及30份trace并核SHA；32份有Google候选，20份无观察不计成功空结果。每run首见去重共1191次候选出现：158直达、927网站字段待查（77.8%）、106无网站；跨run253个ID中198待查（78.3%）。不等于已证实官网或预约出链率，检查点C未评。字面计数/去重/冲突/脏URL/SHA控制通过；0外站/模型，不接线抓取器，复用第4段生产门禁。

<a id="dev-2026-10-20-p22-name-resolution-prep"></a>
## DEV-2026-10-20-P22-NAME-RESOLUTION-PREP

- 按主分支指令完成待审样本42条（30 Tabelog/2 TableCheck/10无Gold对照），来源66份原产物SHA可追溯，TableCheck少8家明示。样本SHA89ce49a49e428e84c5a4caed8831bf8ca98d1c06566d384879f8ce42992d0f87。src/eval接生产名称/身份前缀、独立ID指标/S0停批及去官网/Gold边界，生产代码和既有Gold不变；方法B条件未满足不启用。默认967/967及离线控制通过；Chromium门禁完成后另记。0真实模型/网站/预检，新增预算A150/B条件100未使用。报告：.eval-artifacts/name-resolution-benchmark-20261019/report.md；推送后等待样本独立批准，不跑第4项。

<a id="dev-2026-10-20-p22-name-resolution-frozen"></a>
## DEV-2026-10-20-P22-NAME-RESOLUTION-FROZEN

- 样本/离线接线冻结1624aa3，SHA89ce49a49e428e84c5a4caed8831bf8ca98d1c06566d384879f8ce42992d0f87；30TL/2TC/10对照，TC缺口保留。五门禁type/arch/build PASS、默认967/967、本地Chromium121/121（283348ms），5项指标/泄漏/禁止日期控制通过，66份原输入及配置SHA不变。真实模型/网站/预检均0，方法B未启用；推送后停下等样本批准，第4项仍须批准与网络就绪。见基准report.md。

## DEV-2026-10-19-P2-3-PRICE-CONDITIONS

- Current baseline on isolated `codex/feat-p2-3-conditions`, exposed development evidence. Source Packs retain quoted dinner/lunch ranges and course values, tax/meal/add-on scope and source URL from already opened pages. Guide menu facts survive a separate UNKNOWN availability page; no extra production reads.
- User-approved `condition-policy.json` stores around-price ±20%. State@17/context@12 add prices and persisted code-derived condition states. HARD price evidence is checked before presentation; SOFT/UNSPECIFIED remain disclosed without blocking. Listed menus never assert plan inventory. No legacy state compatibility path; old development tasks use the existing explicit reset protocol.
- Evaluator@30/rubric@26 independently parses retained raw price regions and separately reads the approved data. False displayed MET is S0 only with contradictory independent evidence; missing independent support is S1. Original22 inputs, Gold, ADRs and budgets unchanged. [Report](../../.eval-artifacts/p2-3-conditions-20261019/report.md).

## DEV-2026-10-20-CHECKPOINT-C-INTEGRATION

Checkpoint C offline integration starts from origin13c93a3, sequentially merges P2-2 7dfeb69 and P2-3 89e0dfb (41d677c/5309545). All13 conflicted paths preserve both behaviors/history/tests; combined Context@15, Prompt@27, State@17, Evaluator@30/rubric@26. Five gates PASS: typecheck/arch/build, default972/972 and local Chromium121/121. Original22 calibration retains22/22 outcome types,20/20 normal S0 declarations,8/8 delivery subtypes,0 false qualified; boundary9 ABSENT/13 historical gaps remain distinct. All354 frozen hashes and both branch test inventories verified. No websites/models/Google/probes/Live or name-resolution item4; primary user drafts/INDEX untouched. Independent integration branch only, pushed under explicit user authorization; no source/main merge. [Report](../../.eval-artifacts/checkpoint-c-integration-20261020/report.md).

Concurrent remote review305d1e0 was synchronized verbatim after the feature merges (38 review-only lines,0 conflicts). src/package and all354 frozen hashes remain unchanged from5309545; the same five gates and22 calibration apply. No P2-1c implementation or new calls.

## DEV-2026-10-20-CHECKPOINT-C-SELECTION-NAME-BENCHMARK

Integrated branch8ecfcfc review read. Freeze1c08f4c and explicit specific-payload human approval precede5 actual DeepSeek selection replays: all ACCEPTABLE, Kagurazaka1/1, Shibuya3/3,0133control1/1, direct13/13. Context15/current Prompt27; original event prefixes supply commercial facts, but none of these historical turns has a price fact (no invented prices).0 websites/Google/actions/Live during replay. Tabelog benchmark now prepared:30Gold+5controls, TableCheck7 deferred; frozen sample89ce49a4 retained. Eval-only source admission removes cross-source readiness dependency,403/429 are ENV, both valid red/green. Final four code gates PASS (972/972), local browser121/121 reused because production browser/prefix unchanged. Outer11 offline controls and321 input/source/config hashes. Gold once/30s; source block10m and3/day stop; methodA<=150 and3/subject; methodB disabled. [Selection report](../../.eval-artifacts/checkpoint-c-integration-20261020/selection-recheck/report.md), [benchmark phase](../../.eval-artifacts/name-resolution-benchmark-20261019/live-20261020/report.md). Real source work starts only after this freeze commit; final results follow in the same entry.


Gold phase2260cc8 subsequently completed30 once-onlyHTTP200 reads (0 models), min gap30.032s; original28/2 automatic certificate preserved, manual full-address comparison before A yields29VERIFIED/1DROPPED. User-approved eval identity-stop patch closes swallowed-diagnostic continuation: strengthened existing default test red(select)→green(no controls), local Chromium identity prefix green, production unchanged. Fresh five gates PASS972/972 +121/121 (279333ms). MethodA-only390 SHA freeze and13 offline controls retain30 prior reads/5 replay calls; public-payload authorization recorded,34 subjects planned/≤150 models. No MethodA call yet. Parallel remote changes deferred until this frozen execution ends.


Final execution:30Gold once(allHTTP200),29VERIFIED/1DROPPED fixed before A;34/34 methodA subjects complete at1b4cfda. Gold12/29 CORRECT,15NOT_FOUND,2UNCERTAIN,0WRONG_ACCEPTED; controls2REVIEW_REQUIRED/3UNCERTAIN unscored.35 actual deepseek-flash calls(≤3/subject),5 selection calls,total40; Google/fullLive/B0. Median32530.5ms,max61442ms;63 logical gaps minimum30.025s,0source blocks.390 current/321 historical SHA,66 original input SHA,35 normalized paid-request SHA and unchanged30Gold ledger prefix verified. Independent response audit0 recorded violations but64 session/request gaps remain NOT_EVALUATED.14 list-request final URLs leave rstLst; record observation without attributing language/phone-rule cause. Root and phase reports include all result/artifact/raw/model paths and area/name-shape groups. Source execution finished before any parallel remote integration; no rerun or new call.

Publication-only remote merge after source completion preservesfe9b3fc and State18/P2-1c, with5 document conflicts resolved retaining both complete bodies/indices; all236 raw benchmark files and18 replay files unchanged. Fresh merged five gates978/978 +122/122 PASS.11 independent evaluator files unchanged; remote22/22 types and20/20 S0 calibration reused. Current State18/Task16/BrowserPrompt17; original name run remains frozen1b4cfda/State17. No extra model/source calls or source/main merge; publication-retention.json and report document scope.

<a id="dev-2026-10-20-p21c-region-entrance"></a>
## DEV-2026-10-20-P21C-REGION-ENTRANCE

- Exposed development，基线7dfeb69，复核305d1e0。缺同名入口时提前复用原计划Google批次，以原半径内同源门店URL约束观察引用；失败也缓存到原阶段消费，不重复读取。无地点/代码表，Pack净增0；4/5、身份、HARD与预算不变。
- State17/TaskDefinition15、Browser Prompt17/action schema11；当前Fixture同步，无兼容路径或数据重置。54条源文件可追溯SHA；仅A上线，B的新模型推理未评。见[报告](../../.eval-artifacts/p2-1c-region-20261020/report.md)。

## DEV-2026-10-20-P21C-CHECKPOINT-C-INTEGRATION

- 以8ecfcfc为基线合入已复核ddfdedd，源码/配置冻结d6d989b；State@18／TaskDefinition@16，保留价格/条件状态与地区提前读取，Browser Prompt@17。五门禁PASS：默认978/978、本地Chromium122/122，type/arch/build通过；原22份校准结果类型22/22、S0声明20/20。真实网站/模型/探测/Live均0。
- 两边测试/原日志/旧产物保留；仅当前State调用方同步18，既有持久化覆盖同时核验价格及提前读取批次；无兼容层、reset、ADR或Gold变更。独立临时工作树普通推送到指定集成分支，其他检出不动。
- [报告](../../.eval-artifacts/checkpoint-c-p21c-integration-20261020/report.md)。离线 acceptance 通过；实际地区/来源预算和h001非退步等后续5探测等待用户通知，最早见证到期即停、不续期。

## DEV-2026-10-20-P21C-LIVE-PROBES

- 产品源码3998076保持，外层机械重绑当前集成，冻结cfcf73f。原输入/见证不变；先完成3例，再按用户明确批准存储60→65MB，96f4bf6重冻余2例，旧配置保留。模型/探测/时间/半径不扩大，未修改ADR或Gold。
- 五例均无失败码/READ_BUDGET_EXCEEDED，模型20/20成功，Google正式18+预检5；累计347模型/59探测/171Google。全部间隔≥300秒、0环境重试；原见证截止前完成未续期。录制NOT_REPLAYABLE/UNSAFE_DOCUMENT为当前限制，非库存/完整Live验收。
- [报告](../../.eval-artifacts/p2-1c-region-20261020/live-probes/report.md)与执行/评价/调用账本分列；普通推送集成分支后停下等复核，不追加探测。


## DEV-2026-10-20-CHECKPOINT-C-OFFLINE-PREP

- Evidence status: current executable preparation；演练为frozen regression，非Clean Baseline。
- 完成检查点 C 离线编排、批准元数据投影／父SHA适配、见证认证脚本、不可变冻结、授权一次消费、8项外层控制及四层报告。复用完整 Runner 和 B 来源预检（TableCheck只做来源数据预检），无生产变更／Gold变更／留出集读取。起始3998076；并发fe9b3fc仅证据同步到准备分支；所有新交付在指定批目录。停止于推送后等待独立复核，不执行认证或Live。
- [本批报告](../../.eval-artifacts/checkpoint-c-live-20261020/report.md)／[验证记录](../../.eval-artifacts/checkpoint-c-live-20261020/verification.json)。


## DEV-2026-10-20-CHECKPOINT-C-REVIEW-PREP

- Evidence status: current executable preparation；脚本化frozen regression，非Clean Baseline。
- 合入a3f6b84；五份冲突保留双方正文及全部历史标题。TableCheck outer按冻结已审核请求原样独立复查，独立parser不导入生产parser；库存原始响应经Route.fetch及Guard回调保存路径/SHA，未评价继续，S0 PRESENT立即停批。累计账本含所有真实回放并对源SHA冻结：P2-0起第二阶段2Live/469模型/0正式环境重跑，历史carry1014，保守总1483。生产代码相对集成不变。
- 未评价不等于安全通过；当前库存、真实模型表现均未验证。认证预计30–60分钟，18次预计3–4小时，满预算预留4–4.5小时；环境冷却另加。推送准备分支后停下等批准。
- [报告](../../.eval-artifacts/checkpoint-c-live-20261020/review-followup/report.md)／[验证](../../.eval-artifacts/checkpoint-c-live-20261020/review-followup/verification.json)。


## DEV-2026-10-20-CHECKPOINT-C-WITNESS-INTERRUPTED

- Evidence status: current partial Live Read-only witness evidence；非Clean Baseline。
- 捕获代码c00baa0／冻结c0eb42cd，原始JSON-LD业务片段和四参数响应保留；三条完整支持、一个HARD未评、一个传输失败、11条未到达。0模型／Google／Live，实际最小间隔30.001秒。
- 用户批准认证，未批准Live；H002第三家fetch failed且无HTTP状态，停止后没有重试或自动恢复。最终认证未完成，无最终Live冻结SHA；只封存中断证据。
- [报告](../../.eval-artifacts/checkpoint-c-live-20261020/witness-certification-20261020/report.md)、[未完成登记](../../.eval-artifacts/checkpoint-c-live-20261020/witness-certification-20261020/registry.pending.json)。


## DEV-2026-10-20-CHECKPOINT-C-WITNESS-RESUME-STOP

- Evidence status: current partial Live Read-only witness evidence；已暴露开发集，非Clean Baseline。
- 用户批准恢复及2分钟传输重试，运行前提交08bf841、冻结fe22db6a；3家保留、Matsumoto只补HARD。H003第二家按2分钟仅重试1次仍无状态失败，停止后不再访问网站。原捕获和输入不变；当前6条完整来源支持、1条门店页、9条未到达；无最终Live冻结SHA。
- 0模型／Google／整单Live／正式Live环境重跑；最早见证2026-10-20 20:26:41.866北京，24h截止次日同刻，认证完成时间为空。未自行改日期、未打开表单或点击时段。
- [报告](../../.eval-artifacts/checkpoint-c-live-20261020/witness-resume-20261020/report.md)、[未完成登记](../../.eval-artifacts/checkpoint-c-live-20261020/witness-resume-20261020/registry.pending.json)。


## DEV-2026-10-20-CHECKPOINT-C-WITNESS-COMPLETION

- Evidence status: current executable preparation；已暴露开发证据，非Clean Baseline。
- 网络恢复后按用户批准准备精确续采：六家完整证据原样保留，Meibutsuya与H005 Iwai仅查库存，余八家完整读取。跨轮原始引用与SHA检查补齐，旧HARD刷新执行分支和历史专用测试退役；先提交冻结再认证。生产／批准输入不改，不开始Live。
- [计划](../../.eval-artifacts/checkpoint-c-live-20261020/witness-completion-20261020/plan.md) · [离线核验](../../.eval-artifacts/checkpoint-c-live-20261020/witness-completion-20261020/pre-capture-verification.json)。


## DEV-2026-10-20-CHECKPOINT-C-WITNESS-CERTIFIED

- Evidence status: current Live Read-only witness certification；已暴露开发集，非Clean Baseline，不是正式Live。
- 精确续采18GET全200、最小间隔30.000秒、0重试／模型／Google／完整Live；保留原6家不重采。6例15/16登记认证，计数2/3/3/2/2/3；Komuro指定库存未匹配，Fukumimi当前菜系证据与原句变化及人工判断单列。
- 460项冻结运行输入结束后不变；原始SHA／请求字面量审计、六例500秒时效门禁与阶段剩余额度通过。认证控制8、外层14、本地边界1，typecheck／arch／build通过；生产未变复用978/122门禁。
- 最早见证2026-10-20 20:26:41.866北京，Live须在次日同一时刻前完成；生成最终Live冻结后推送准备分支，等待复核者和用户批准SHA，不开始Live。
- [报告](../../.eval-artifacts/checkpoint-c-live-20261020/witness-completion-20261020/report.md) · [核验](../../.eval-artifacts/checkpoint-c-live-20261020/witness-completion-20261020/verification.json)。

## DEV-2026-10-21-CALENDAR-NEXT-MONTH

- Evidence status: draft / not integrated；已暴露开发证据。
- 用户批准采用第0步复核6d92882的V3，在远端集成a3f6b84独立分支实现；通用web-skills、thinking、生产Gateway不变。Registry提取唯一附近控件组与实际calendar caption、链接公开替代文本；绑定不明仍Unlabelled group。Executor翻月后核对年月，未变化反馈NO_CHANGE并拒绝把无关DOM变化当进展。Browser Prompt17→18，首次给此前无版本的Browser context标@1，action wire11与Restaurant Context15/Prompt27不变。
- TableCheck来源策略永久禁止reserve路径段及子路径，在prepared/observed、普通路由、CDP、preflight和redirect优先拒绝；移除旧G1 start_date/pax文档例外，合并读取策略携带source-owned撤销，不影响其他来源已审核公开query。两条旧reserve菜单成功测试合并退役为两种顺序都UNKNOWN/无交付合同；历史记录不改。
- 69点用原保存HTML/CSS通过生产Registry/Executor重建，精确节点独立绑定，未注入实验V3标签。历史HTML脱敏器删去的两个日历href末尾#仅按原始观察恢复，保留SHA/明细；请求里不含oracle。5选店payload与当前生产system prompt逐字核对。原22校准、Gold和种子不改，冻结后才跑评测和最多74次真实模型离线回放，不自动重试。
- 仅保存材料核查发现Tabelog历史门店URL svd=20261021&svps=4可在无交互下初始化日期/人数，独立DOM有is-current日期及4人active/hidden值；未实现快捷导航，不推广至所有门店或11月。
- 计划与证据：[`calendar-next-month-20261021`](../../.eval-artifacts/checkpoint-c-live-20261020/calendar-next-month-20261021/plan.md)；五门禁已通过，模型与22校准待冻结。无新网站、Google、Live、预约表单或时段操作；不推集成分支。

- 本轮冻结后结果（同一切片）：b7f56b660c9a1fc017b792a01eb405ff83349383 / freeze SHA256 d065beef6675bdb0bc403a32326a956b83422e4632b93089ade434ba37b9709d，625项运行后无变。原22校准22/22（S0声明20/20、8交付子类8/8、0误判合格；越界9无/13缺口），P2-2五选店5/5、直接页13/13；翻月仅54/69，15点为PARTY_SIZE，未达≥68/69，整体NOT_ACCEPTED。全部74请求成功、无重试，984912输入/9975输出token、0 reasoning；模型请求墙钟翻月均1.890s、选店2.132s，批次141.296s。阶段账本2069/4000、完整Live7/100、环境重跑0/10；0新网站/Google/Live。
- 偏离与限制：真实静态生产重建的69份target集合、64份visibleText与第0步不同，history/progress/skills未变；不能把原68/69与新54/69当作严格单变量比较，门槛仍失败，不改标签/不付费补跑。独立Fixture证明字段与月份后置条件，不能代替真实任务或下游反事实。Guard旧S0不撤销。
- 浏览器门禁原有测试会覆盖旧region-composition-results.json，已将本轮产物另存本批次并恢复旧文件逐字原样；受保护Gold/变体/种子与所有冻结代码/输入/脚本均未变化。机器输出[result.json](../../.eval-artifacts/checkpoint-c-live-20261020/calendar-next-month-20261021/result.json)、[四层报告](../../.eval-artifacts/checkpoint-c-live-20261020/calendar-next-month-20261021/four-layer-report.md)、[逐点表](../../.eval-artifacts/checkpoint-c-live-20261020/calendar-next-month-20261021/decision-matrix.json)与[运行后校验](../../.eval-artifacts/checkpoint-c-live-20261020/calendar-next-month-20261021/post-verification.json)。推送独立修复分支后停止，等待复核，不合入集成、不跑Live。

## DEV-2026-10-21-CALENDAR-SELECTED-STATE

- Evidence status: draft / not integrated；已暴露开发回归，不是Clean Baseline。基线54ac940，上一轮54/69及原始证据不改。
- 只实现复核要求：通用ARIA/精确状态class产生selected，DOM实际owner绑定组与当前选中值，未知不推定；保留已选控件证据，阻止重复人数及等价日期动作。人数点击后必须回读同组唯一值等于请求，未确认则NO_CHANGE/PARTY_SIZE_NOT_CONFIRMED，源页面只改成功文案也不能完成。组身份按owner层级路径，而非易受其他内容增减影响的整页元素序号；同名不同组不合并。
- Browser Prompt18→19、Browser Context1→2；wire11、Restaurant Context15/Prompt27、web-skills/thinking、TableCheck reserve永久禁止不变。URL参数仍仅历史核查，不实现。
- 当前69点从原HTML/CSS走生产Registry/Executor重建，参考原观察与历史最大编号生成更晚的fresh revision；目标、ownerRef及groupRef一起更新。每点保存original/registry/replay revision；原history/progress逐字保留，没有显式历史targetRef需重绑。原15未命中点现在均有正确已选人数；34点当前人数等于请求，3点不等，32点无可见正选中，全部保留不补造。
- 针对性四项有效红→绿；完整回归修复旧Fixture的隐藏已选控件假设和只有成功文案的假确认，不修改原69种子、Gold、变体或库存标签。最终五门禁与冻结后原22校准、69+5单次模型回放待记；最多74请求含失败，0自动重试，阶段账本2069/4000。无新网站/Google/Live，不推集成。
- [计划](../../.eval-artifacts/checkpoint-c-live-20261020/calendar-selected-state-20261021/plan.md)；结果与四层报告待冻结后记录。

- 冻结后最终结果：运行提交8e47ddfd70be692e5d43dd70474e7e1a78b22d88，SHA256 040dbdac7477e64b643aa6550c43a57b650473dae51365b143d90f1f3954876b，628项复验一致；同69点69/69，原15未命中点15/15且重复已确认人数提议0；选店5/5、直接页13/13；原22校准22/22（正常S0声明20/20，交付子类8/8，0误判合格，越界9份无/13份缺口保持）。五门禁type/arch/build、默认977/977、真实Chromium129/129全绿。
- 全部74次API成功、0重试；翻月平均1.877s、961320输入/8535输出token，选店平均2.053s、95435输入/1361输出；reasoning0，批次墙钟140.104s。阶段账本2069→2143/4000、剩1857，完整Live7/100、环境重跑0/10不变。0网站/Google/Live，不实现URL路径。
- 37点正选中（34与请求一致、3不同），32点未观察到；独立来源核查69/69一致，未知不编造。69点历史/观察编号逐点一致，history/progress无改、显式历史targetRef0。选中状态/组投影/引用修正共同变化，非严格单字段因果试验，也不代表完整交付或泛化；历史H003 S0与上一轮54/69保持。
- [四层报告](../../.eval-artifacts/checkpoint-c-live-20261020/calendar-selected-state-20261021/four-layer-report.md)、[result.json](../../.eval-artifacts/checkpoint-c-live-20261020/calendar-selected-state-20261021/result.json)、[逐点表](../../.eval-artifacts/checkpoint-c-live-20261020/calendar-selected-state-20261021/decision-matrix.json)、[引用审计](../../.eval-artifacts/checkpoint-c-live-20261020/calendar-selected-state-20261021/reference-audit.json)和[冻结复验](../../.eval-artifacts/checkpoint-c-live-20261020/calendar-selected-state-20261021/post-verification.json)。既有门禁生成的区域输出另存本批次后原文件恢复，代码/输入/外层运行中无改。离线门槛通过、待复核，推本修复分支后停止。


## DEV-2026-10-21-CHECKPOINT-C-CONTINUOUS-STEP-1

- Evidence status: frozen regression, exposed development. Accepted review481b893 and 628 frozen-file SHAs independently rechecked; production/skills unchanged since8e47ddf. Calendar69/69, selection5/5, calibration22/22, all five gates PASS (977 default/129 Chromium). Reused existing unchanged evidence; new model/network/Live0.
- Freeze040dbdac7477e64b643aa6550c43a57b650473dae51365b143d90f1f3954876b; cumulative models2143/4000, fullLive7/100, environment reruns0/10. Historical H003 S0 retained. [Four-layer report](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-validation-20261021/step-1-report.md).


## DEV-2026-10-21-CHECKPOINT-C-CONTINUOUS-STEP-2

- Evidence status: current executable, exposed development. Accepted fix8589b3b merged/pushed integration; prep merge92beed0 preserves both histories. No production/skills/dependency delta from accepted gates,628 frozen inputs match. Existing outer, plan18, Runner, inputs, evaluator30/rubric26 unchanged.
- Cumulative ledger2143 models,7 Live,0 env reruns; source evidence now includes277+74+74 already-counted replay calls, totals unchanged. Existing global budget check PASS,1200 models reserved for18+6 possible retries. No new models/websites/Live. [Four-layer report](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-validation-20261021/step-2-report.md).


## DEV-2026-10-21-CHECKPOINT-C-QUICK-LIVE-ENTRY

- Evidence status: current executable plus frozen regression, exposed development. Steps1/2 PASS; original outer complete0-network/0-model rehearsal succeeds and553 freeze files reverified. SHA b1175e307a68e021e0e7744eda750b488d36f72f84038cbfb3ed04224c8b2273. No original outer/plan modification.
- Quick3 cannot be selected by current CLI (only18 or historical fixed-c03 resume); clarification requested before relaxing explicit immutable-outer constraint. No authorization consumed or Live started; steps3–5 NOT_REACHED. Cumulative2143 models,7 fullLive,0 env reruns unchanged; old H003 S0 retained. [Report](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-validation-20261021/four-layer-report.md).


## DEV-2026-10-21-CHECKPOINT-C-RUN-SELECTION

- Evidence status: current executable preparation, exposed development. User explicitly approved minimal --run-ids entry for c-01/c-02/c-05 only. Select original run objects in plan order; reject unknown/duplicate/empty IDs and resume combination. Default18 Live/default1 rehearsal/historical resume unchanged; no changes to Runner, plan, policies, evaluator or run budgets.
- Twenty offline controls PASS; full original outer scripted three-run/default verification follows committed freeze. New models/sites/Live0; cumulative2143/7/0 unchanged. Scope label and separate results keep quick samples outside checkpointC18. [Authorization](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-validation-20261021/run-selection-approval.md).

- Quick entry final verification PASS: original outer executed exactly c-01/c-02/c-05 in0-network/0-model mode, default rehearsal retained1 run and defaultLive18 unchanged;20 controls PASS. Final quick freeze5c4dd01e4d21afcc8a687066dbb1e2bd2cd8e8cfd683e404b26e9d292fbdd8f4,558 files verified. Cumulative2143 models/7 Live/0 env reruns;1857 model calls remain. Old witness window sufficient for quick3 before2026-10-21T12:26Z; user preapproval permits launch after push.

- Quick launch pre-run freeze check rejected changed documentation before authorization consumption, output directory or Runner start;0 models/sites/formalLive/env reruns. Rejection retained; refreeze final committed snapshot and verify all files before launch. Freeze record lives in continuous-validation-20261021/quick-final-freeze-receipt.json; do not mutate frozen documentation during quick batch.


## DEV-2026-10-21-CHECKPOINT-C-QUICK-VALIDATION-STOP

- Evidence status: exposed development Live Read-only, one diagnostic per case; not Clean Baseline. 快速验证未通过，按门槛停止：H001/神乐坂 CAPABILITY_MISS，H002 HONEST_NO_RESULT；QUALIFIED_DELIVERY 0/3（要求≥2/3），交付均为0，两项S0各3/3 ABSENT。三次47模型共141，Google含预检12，累计2284/4000模型、10/100完整Live、0/10正式环境重跑。快速三次不计检查点C18，原五次及H003 S0保留；第4步认证与新18次均NOT_REACHED。
- Original production/skills/plan/Runner/evaluator30/rubric26 unchanged; user-approved run selection20 controls and actual offline3+default1 passed. Existing production acceptance69/69,5/5,22/22 and five gates977/129 reused unchanged. Freeze225ca8b994308b999ab0a7156b0cbf3ff1b57466cb707a0c2e7d1669b8faac0d/559 files verified before and after runs, before documentation updates.
- Runner times278.382/280.614/482.445s; outer wall298.662/307.277/504.686s. c05 retains OUTER_DEADLINE plus exit0 and full result; @30 CAPABILITY_MISS not reclassified/retried. Independent post-reads8/8 HTTP200; gaps306.422/307.224s. Source-observed selection versus query-acceptance mismatch is a hypothesis, no new fix or extra calls.
- [Four-layer report](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-validation-20261021/quick-four-layer-report.md), [raw result index](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-validation-20261021/quick-result-manifest.json), [ledger](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-validation-20261021/phase2-ledger-after-quick.json). Stop after push pending independent review.


## DEV-2026-10-22-GROUP-WINDOW-FIX

- Evidence status: draft / not integrated; exposed offline repair. Base17415d1c, review b180f30d. Partial source batches rotate behind other scheduled sources, retaining active/suspended cursors, pending entrances and candidates. Prohibited workflows return SOURCE_UNSUPPORTED before navigation and are not reopened for FACTS. Point-empty queries advance through at most four observed legal times; uncovered scope remains unknown. Disabled exact party ends UNKNOWN only after the requested date is selected.
- restaurant-state@20 / task definition18; Prompt, Browser action/context, Evaluator33/rubric29 and qualification unchanged. Valid before-fix scheduling assertions, installed-policy restriction red, and three real Chromium baseline failures are retained. Initial restriction Mock failure lacking INSTALLED is explicitly excluded as detection evidence.
- Five gates PASS: typecheck, arch:check, default1013/1013, build, Chromium136/136. Initial default failure was the old persisted-schema expectation19; updated to current20, original failure log retained. Browser-generated tracked fixture metrics are saved separately and historical bytes restored.
- 69 calendar and five selection inputs prepared: calendar differs only by the previously approved base timeoutMs10000 to30000; model messages/schema/observation/oracle identical. Selection requests byte-identical. Commit-freeze before cached response regression,22 calibration and six saved-run component replays; these final replays are not yet executed at this entry. New real models/websites/Google/Live0.
- [Plan](../../.eval-artifacts/group-window-fix-20261022/plan.md), [gates](../../.eval-artifacts/group-window-fix-20261022/gates/results.json).

- Frozen replay follow-up: code22fef57b passed five gates; cached69/69+5/5 and calibration22/22 (normal declarations20/20) passed with zero external calls. Six-run component driver stopped at c18 because it mixed recorder and global trace sequences. Original failure retained; only the eval-side mapping is corrected and newly frozen. Product/source inputs and scoring unchanged. No original snapshot/decision rewritten.

- Final source follow-up: retained even ended/capped source checkpoints (valid red-ended-checkpoint), and classified a completed point-empty observation UNKNOWN rather than provider failure (valid red-partial-observation). Chromium time-window controls now enter the same createLiveReadAssembly/Resolver/Guard as Live, with original80-operation/provider/run limits; positive and four-empty paths need no model transport, wrong-party negative uses one scripted help response. Final gates1013/136 PASS. Product code and all historical inputs remain frozen for a final zero-network component/cache/calibration replay.

- Delivery follow-up within prohibited-entry scope: even an initial candidate URL already prohibited by current policy now stops before acquiring a browser; identity remains unverified. Native FACTS checks the same initial boundary. Valid red-initial-entrance retained; final full five-gate rerun1014/136 PASS. Freeze the final unchanged-input offline replay before execution, then stop after report/push.

- Completed on frozen bd268ee0bf45e838f70235be6e34d4ae76b72d17: all five gates1014/136 PASS; final cached calendar69/69, selection5/5; current evaluator33 calibration22/22 and normal declaration20/20. Six saved-component rows complete: Tabelog first at scheduling boundary,24 prohibited paths early unsupported, five recorded bound-empty points retain unknown remainder, c18 disabled10 stops with zero new decision/action. Original219 model calls are historical reuse, new real model/site/Google/Live0. Missing Tabelog/Google response branches remain NOT_EVALUATED; no new full-task success, S0 clearance or efficiency claim. [Final report](../../.eval-artifacts/group-window-fix-20261022/report.md).


## DEV-2026-10-23-PHASE3A-PRIME-MAIN-CHECK

- Evidence status: draft / not integrated；已暴露离线工程基线，不是 Clean Baseline。原文指令SHA-256 `451b40ef26b917812a949f3649a91e616e72709c7067f890eb9085ce8ae6cfe1`，首个独立提交8601233c；主工作树指定位置另有原样副本，既有9份用户文件和HEAD保持。
- 仅批次0只读核对与报告。新分支从main/ac571ca8建立，fetch后main=origin/main；两个指定修复均为祖先，旧开发分支本地及远端均无独有提交。不合并、不推送，不修改产品代码、测试、fixture、Prompt、Schema、Evaluator或权限。
- 历史目录口径3591→3863在原提交复现，当前3864；按本指令增加source-packs.ts后起点3991、当前4337，不能同时沿用历史数字。按停止点0等待复核统一后续≤3591的范围，F1/F5未启动。
- 本批完整Live0/8，真实模型0/400，环境重跑0/2，账本entries为空。 [批次报告](../../.eval-artifacts/phase3a-prime/main-check/report.md)。


## DEV-2026-10-24-PHASE3A-PRIME-STOP0-APPROVED

- Evidence status: current reviewed baseline；已暴露工程证据，不是Clean Baseline。用户转述00:20北京复核通过；报告追加第7节，保留此前停止记录和原始指令。3591/3864仅两个适配器目录非测试TypeScript物理行，目标≤3591；包单列473且站点相关行数不得增加，不接受转移代码抵扣；站点Skill排除。
- F1批准基线1029/23.3秒与138/307.6秒；批次1A清理测试、B只读F5，停止点1仍有效。本次仅报告/状态/索引补充，复用已完成五门禁与三次计时，检查链接、统计字段和diff；没有新运行、Live或模型。
- [报告补充](../../.eval-artifacts/phase3a-prime/main-check/report.md#7-停止点-0-复核补充2026-10-24-0020-北京)。


## DEV-2026-10-24-PHASE3A-PRIME-F1-COMPLETE

- Evidence status: frozen regression / draft not integrated；已暴露离线候选，等待独立复核，不是Clean Baseline。F1基于已复核本地main/2ada8a69；准备7fbee277、整理e0914016、运行冻结48232999；产品代码194份路径/字节不变，源目录3864/包473不增。
- 清单1175行=默认1029+Chromium138+8非默认探针；删除4个源码字面自检及父项，保留其4个真实组合控制与正常/破坏证据；编译空文件移至嵌套fixture，typecheck保留3条编译断言；同HTML的错误身份反例合入既有契约，原始DOM点击不冒充Takeover链路。保留当前45秒配置的31秒Chromium观察，删除退役30秒对照。Test Skill增加阶段审查和页面日期两句，15份保存页/控件加来源及版本说明，未刷新页面。
- 新真实模型/Google/来源网站/见证GET/完整Live/环境重跑0；不执行预约或表单。当前停止点1，B/F5状态由另一对话报告，F2/F5实现未启动。仅独立工作分支供复核，远端main不动。 [报告与日志](../../.eval-artifacts/phase3a-prime/f1/report.md)。

## DEV-2026-10-24-PHASE3A-PRIME-F1B-COMPLETE

执行记录时间 2026-10-24T00:24:08.831212+02:00（Europe/Vienna）。F1复核为安全但审查未完成，按用户要求补做F1b：C18历史绝对路径重定位、产品输入迁入模块fixtures、P21c改用临时输出、运行时文件读取检查及11文件/并发4拆分。三项红绿齐全；默认1024/1024、Chromium137/137，三次中位20.469752/85.078675秒（目标≤150），九次门禁后Git状态均空且恢复0。独立克隆在OS拒绝/Users及旧工作树数据读取的条件下默认1024/1024，宿主存在性元数据仍可见；本地浏览器安装资源复制进克隆后通过。137运行名/483断言调用保留，94输入含87精确内容及7路径索引，194原非测试TS不变；69/5/22及正常声明20/20通过，目录3864/包473不增，新模型/Live0。原1175清单仅作索引，报告统一Europe/Vienna。继续F1候选分支，未合main，停于停止点1待复核。 [报告](../../.eval-artifacts/phase3a-prime/f1b/report.md)。

## DEV-2026-10-24-PHASE3A-PRIME-F1B-REVIEWED-MAIN

Evidence status: current reviewed baseline，开发证据已暴露。用户明确批准F1b/F1完成及推送main；仅将f42715c2快进至main，五门禁在合入后的该精确提交重跑一次，每项后工作树干净，再推送并核验远端。新main为f42715c2cb34a18764b664bd175576dfe2eaabe3；随后从该main开F2a。没有改写旧开发分支或用户9份文件，没有删除分支，真实模型/Live0。 [合入记录](../../.eval-artifacts/phase3a-prime/f2a/main-integration.json)。

## DEV-2026-10-24-PHASE3A-PRIME-F2A-STOP2

Evidence status: frozen regression / draft not integrated；报告时间Europe/Vienna，不是Clean Baseline。仅对话A/F2①②④a：Live CLI与离线来源共用正式执行函数，受控退出刷盘已有快照、trace、decision和recording；Evaluator34/rubric30识别中断、按已达环节报告并继续独立S0，修复额外UNSPECIFIED误判；Recorder4按页资格、1MB UTF-8上限、去除未审核form action且保留安全脱敏与缺依赖拒绝。

从f42715c2建立工作分支，b0d2b900冻结输入，ef89c72d实施，c3311b61/db25bbdb冻结首轮控制，dce958f4修复默认回归捕获的缺快照未知语义并使Node子进程继承读取检查，44252311冻结最终验证。三个历史运行只重判已保存字节，不恢复缺失DOM/脚本；新增测试用最小合成来源，未向产品测试复制整份历史运行。产品Core/Domain/Adapter/Server与web-skills相对main无差异，目录3864/pack473不变。未开始F5、Live、F2③/④b或私有留出集；停止点2待复核。 [报告](../../.eval-artifacts/phase3a-prime/f2a/report.md)。

## DEV-2026-10-24-PHASE3A-PRIME-DIAGNOSTIC-DOM

2026-10-24T11:51:00.063345+02:00 Europe/Vienna。诊断DOM补丁完成：安全缺脚本/OPTIONS页独立留档，危险/挑战/超大页只记原因；回放字节不变，五门禁1028/141全绿且每项后净工作树，0新增调用。仅本项获准合入main，后续F2③/④b分支待复核。 录制器复用已有脱敏结果，只加明确要求的诊断元数据；未触碰产品或共享Browser。 [报告](../../.eval-artifacts/phase3a-prime/f2a-diagnostic-dom/report.md)。

## DEV-2026-10-24-PHASE3A-PRIME-F2C-PACING

2026-10-24 Europe/Vienna。F2③默认1000ms同源并发间隔，响应结束后计时，原预算和产品行为不变。正式批量入口复用单运行CLI权限和预检，所有接线在eval层，不改共享Browser。工作分支待复核。 [报告](../../.eval-artifacts/phase3a-prime/f2c-pacing/report.md)。

## DEV-2026-10-24-PHASE3A-PRIME-F2D-REPLAY

2026-10-24 Europe/Vienna。回放入口使用原始决策或REAL工厂接线，后者仅fixture验证；runtime clock平移但elapsed正常，Guard、原预算和产品Schema不变。pages诊断DOM不参与回放，原始Google响应缺失不从State补造。 [报告](../../.eval-artifacts/phase3a-prime/f2d-replay/report.md)。

## DEV-2026-10-24-PHASE3A-PRIME-ROUND-ESTIMATE

2026-10-24 Europe/Vienna。冻结算术脚本、15例规模、同源等待及回放成本假设；采用两个固定worker队列，区分额度内未来F5组合与15次全新Live参照，不改变预算或执行授权。 [报告](../../.eval-artifacts/phase3a-prime/round-estimate/report.md)。

## DEV-2026-10-24-PHASE3A-PRIME-LONG-TURN-A

2026-10-24 Europe/Vienna。F2①②按用户复核通过；补诊断DOM后第一项main快进e0e1037e127bd0264d85c6ab27708179c3f7766f并推送核验。随后完成跨进程2运行节奏与严格离线回放，均只推分支；未改产品/Prompt/产品Schema/Guard或对话B共享文件，原9份用户文件保持。四项后停止。 [报告](../../.eval-artifacts/phase3a-prime/long-turn-a/report.md)。

## DEV-2026-10-25-PHASE3A-PRIME-STOP2-PACING-FIX

2026-10-25复核任务，CET UTC+01:00。eval层按资源类型区分租约和计数，原统计字段、默认1000ms、两运行及预算不变；不改产品、共享Browser/restaurant-search、Prompt、Schema、Guard。估算在显式类型拆分假设下重算：6次未来F5 Live加15回放约22分钟，15次全新Live参照约51.3分钟，均非实测。 [报告](../../.eval-artifacts/phase3a-prime/stop2-review-fixes-20261025/pacing/report.md)。

## DEV-2026-10-25-PHASE3A-PRIME-STOP2-GOOGLE-CAPTURE

2026-10-25 CET UTC+01:00。保留旧623d与新main/1a736c历史并在合并后源码上重放验收。正式Runner自动捕获Google URL/方法/原始JSON body与响应，去请求头及key类query；HAR pending回读扫描后发布，命中记录安全原因，迟到响应隔离。录制/评分/产品Schema与Guard不改。整份HAR对公开地图key模式也严格拒绝，真实F5覆盖仍待验证。 [报告](../../.eval-artifacts/phase3a-prime/stop2-review-fixes-20261025/report.md)。

## DEV-2026-10-25-PHASE3A-PRIME-STOP3-HEALTH

保留固定10秒观察、五分钟重试和三次上限，修复最后快照与截止竞争导致已就绪误拒绝；未完成快照结束时刻null，迟到结果不覆写。最小输入摘自F5已保存公开页，原SHA与采集日登记；产品/Guard/站点不改。 [报告](../../.eval-artifacts/phase3a-prime/stop3-infrastructure-fixes-20261025/health/report.md)。

## DEV-2026-10-25-PHASE3A-PRIME-STOP3-RECORDING

录制/诊断共用第三方URL固定占位脱敏，原扫描表达式不变；实际CLI预登记Google/模型自有凭据，原始输入先检查，任何自有命中只留安全拒绝记录。普通模式按页/响应/条目隔离，Google原始安全JSON字节不改；保留写前与落盘后扫描，退役无Google时绕过扫描的旧分支。槽1第6页只提取必要img元素，来源/日期/SHA可追溯，原key改为合成marker。 [报告](../../.eval-artifacts/phase3a-prime/stop3-infrastructure-fixes-20261025/recording/report.md)。

交付开发补充：5cb751e3冻结“第三方响应命中且请求体含自有凭据”反例，旧路径REPLAYABLE红灯；请求体与响应独立扫描后7/7局部绿灯。首轮5de17530五门禁产物保留，最终候选将完整复跑五门禁后才合入。

最终复跑完成（2026-10-25T03:31:14.348284+01:00 CET）：精确候选05991efd39903d2fae094e209c9bf973381223c5五门禁全绿，默认1037、真实Chromium154，单次22.949792/93.159010秒，每项后status空、恢复0；原5de17530五门禁完整保留，新增真实调用仍0。最终输入/编排与当前实现SHA一致，按授权合入推送后停。

## DEV-2026-10-25-PHASE3A-PRIME-REPLAY-PORTABILITY

仅修回放子进程的OS隔离选择及错误诊断，macOS保留原策略，Linux用unshare -rn --，原30秒上限与4项断言不变。CI因既有PAT缺workflow权限未启动，转临时Lima/VZ Ubuntu22 ARM64，冻结源归档/脚本，禁宿主挂载与凭据转发，证据取回后清理VM与缓存。并发进入main的4份robots证据保留，实际基线7165f8a2；无产品/Schema/Prompt/Guard/站点改动。 [报告](../../.eval-artifacts/phase3a-prime/stop3-replay-portability-20261025/report.md)。

## DEV-2026-10-25-PHASE3A-PRIME-HEALTH-FIXTURE-STABILITY

只改健康Harness测试普通模式窗口1500→10000ms，slow1000/800/220与生产实现不变。冻结源1d8c7c96、604项输入与外层脚本；macOS三轮154/154，Linux第三轮独立E1失败。只读固定八次原断言诊断两次fetch/xhr差异BLOCKED_METHOD；没有改Guard或E1文件，草案未应用未测试。触发用户长回合§2.6停止，分支留复核、main保持0a254f05。Linux真实VM、依赖路径映射/时钟/失败记录透明保留，资源清理完成，0新增真实调用。 [报告](../../.eval-artifacts/phase3a-prime/stop3-health-fixture-stability-20261025/report.md)。

## DEV-2026-10-25-PHASE3A-PRIME-E1-KNOWN-F3

按用户复核继续现有健康分支，4个普通模式10000→4000ms，精确slow1000/800/220与生产10秒不变；不改E1、Guard或站点。后续按独立分支修回放URL映射、决策快照绑定和逐槽退出即评价，均0真实调用。 [报告](../../.eval-artifacts/phase3a-prime/health-fixture-4s-20261025/report.md)。

## DEV-2026-10-25-PHASE3A-PRIME-HEALTH-4S

仅将四种普通健康fixture观察窗10000→4000ms；真实生产10秒不动，精确slow和原契约不减少。E1已知偶发按用户复核登记并交对话B/F3，源/Guard和历史草案不实施。冻结2e184c2f后双平台六轮全绿，中位回到≤150秒；独立后续分支从合入的新main开始。 [报告](../../.eval-artifacts/phase3a-prime/health-fixture-4s-20261025/report.md)。

## DEV-2026-10-25-PHASE3A-PRIME-HEALTH-F5-INTEGRATION-PREP

合入前预检阻止在过时main上合并，保留a519f514与原六轮证据。同步已批准F5主线e096ba35，五个文档冲突逐项保留上游全文与三条健康记录；不将上游已批准产品改变算成本分支修改。重新冻结完整源码/输入，再在新组合上双平台验收。 [报告](../../.eval-artifacts/phase3a-prime/health-fixture-4s-20261025/post-f5-main/report.md)。

## DEV-2026-10-25-PHASE3A-PRIME-HEALTH-4S-F5-VERIFIED

合入前发现F5主线e096ba35，保留旧六轮为pre-integration frozen regression，零源码冲突整合并保存双方历史/预算。相对新main仍仅健康测试源变化，四普通模式4秒、slow精确/生产10秒不变。新组合两平台完整三次满足≤150秒，批准E1例外原始计数不改；后续回放、决策关联和退出即评价各自新main分支实施。 [报告](../../.eval-artifacts/phase3a-prime/health-fixture-4s-20261025/post-f5-main/report.md)。

## DEV-2026-10-25-PHASE3A-PRIME-REPLAY-URL-RED-PREP

从新main70db9152创建独立回放修复分支。仅准备所属行为测试和ORIGINAL系统断网脚本，loader尚未修。原录制逐字核对，仅提取HAR、清单及19个合格文档；原39条模型决策重放，不补造页面。原HTML空白和字节保留，diff检查只排除该原始inputs目录。 [报告](../../.eval-artifacts/phase3a-prime/replay-url-qualification-20261025/report.md)。

## DEV-2026-10-25-PHASE3A-REPLAY-REDIRECT-COMPLETE

仅 eval 回放器和最小 Chromium 回归：完整 HAR 重定向链映射到合格最终文档；缺失检查置于真实 Guard 准入后；可选媒体缺失拒绝并记录，关键响应缺失仍停止。产品、Guard、Prompt、产品 Schema、站点代码未改。验证源码278302bf，原始 F5 输入及脚本 SHA 冻结，后续快照不完整不冒充完整回放。 [报告](../../.eval-artifacts/phase3a-prime/replay-url-qualification-20261025/report.md)。

## DEV-2026-10-25-PHASE3A-DECISION-FLOW-BINDING-COMPLETE

在独立分支从main5aa9394c修复eval capture的来源flow关联，验证源码5e073ae6。复用完整F5c产品流程测试，保留全部产品断言；只增加录制关联验证，不改模型输入、产品Schema、Guard、Prompt、站点。原三槽单行最小证据及来源SHA冻结，不复制整份历史运行。 [报告](../../.eval-artifacts/phase3a-prime/decision-snapshot-binding-20261025/report.md)。

## DEV-2026-10-25-PHASE3A-POST-EXIT-EVALUATION-COMPLETE

验证源码ce82a545，新增eval父进程监督器；journal提前IPC关联产物，父进程在各槽exit事件重读原产物及冻结独立reviewed-reads，不等整批或stdio关闭。既有授权、预检、节奏上限2、来源90秒/整单500秒预算不改；原F5冻结脚本保留。父进程不改写运行产物，SHA前后核对；评价失败及没有产物明确NOT_EVALUATED。 [报告](../../.eval-artifacts/phase3a-prime/post-exit-evaluation-20261025/report.md)。

## DEV-2026-10-26-PHASE3A-F3-TIMING-HYGIENE

源码d83ff50c；不改生产预算与对话B四文件，E1块原字节保持。40/15/10ms候选与1ms来源余额改为逻辑时钟；非期限目标观察留余量，父就绪30s与外层45s配套。健康slow精确时序、真实31s来源观察和各类真实尺度机制控制保留；行数项独立继续，未冒称达成3591。 [报告](../../.eval-artifacts/phase3a-prime/f3-implementation-20261026/timing-hygiene/report.md)。

## DEV-2026-10-26-PHASE3A-F3-TIMING-MAIN-REBASE-PREP

在卫生分支合并已批准并行main，原红绿SHA历史保留；取main文档全量再恢复本轮历史条目，不把旧main门禁用于新源码组合。站点解析文件未改；接下来冻结新组合并重跑五门禁。 [报告](../../.eval-artifacts/phase3a-prime/f3-implementation-20261026/timing-hygiene/rebased-main/report.md)。

## DEV-2026-10-26-PHASE3A-F3-TIMING-MAIN-REBASE-VERIFIED

继承B已批准Guard/预检、Evaluator36及显式通用列表修改，不由A编辑对方文件。卫生源码差异仅9个测试文件；解析/控件与Pack原样。当前快照新增网络类型事实不补齐行数计划所需的日期状态/结果scope观察，后续仍须逐条核验。 [报告](../../.eval-artifacts/phase3a-prime/f3-implementation-20261026/timing-hygiene/rebased-main/report.md)。

## DEV-2026-10-26-F3-L7

日期/人数字段共用扫描，保留同一表单归属、唯一启用 live 控件、精确值与 selected option 一致性；仅原地去重，净减2行，不采用压行或迁移。九个计划项的证据缺口逐项列出，七组最小对照冻结后通过。 [报告](../../.eval-artifacts/phase3a-prime/f3-implementation-20261026/l7/report.md)。

## DEV-2026-10-26-F3-L10

删除 completed 中间集合及第二遍菜单处理，保留完整外层容器、观察到的RADIO scope、去重、畸形闭合及scoped/unscoped文本隔离，未迁移代码。 [报告](../../.eval-artifacts/phase3a-prime/f3-implementation-20261026/l10/report.md)。

## DEV-2026-10-26-F3-A-STOP

保持原合同与核验，按批准的证据不足延期条款处理九项，未把估算306记作已实现。仅原TableCheck parser合并重复计算；全量时序清单逐条处理，保留检错。另记录范围外post-exit catalog路径静态接线问题，未修改或运行Live。 [报告](../../.eval-artifacts/phase3a-prime/f3-implementation-20261026/report.md)。

## DEV-2026-10-26-F3-REVIEW-SMALL-FIXES

与批准main70a7eb1f集成无冲突，A仅修改两个eval基础设施实现及三份所属测试；目录引用不再允许任意artifact路径，读取固定HEAD catalog blob并核对SHA。W12保留20/55ms逻辑截止，真实DB/HTTP条件等待有界；健康普通状态以独立时钟推进，slow精确真实时序保留。用户复核通过L7/L10/前轮时序卫生，行数目标不再本批继续；退出条件6 NOT_MET，3847/3591、Pack473，L1/L4/L5转3b，其他六项延期保留。 [报告](../../.eval-artifacts/phase3a-prime/f3-small-fixes-20261026/report.md)。


<a id="dev-2026-10-28-g1-real-preparation"></a>

## 2026-10-28 CET: G1 saved-page real-model preparation

2026-10-28 CET: A prepares authorized G1 real-model evaluation on B-integrated main6fa60cda. Frozen34 reviewed questions ×3, saved pages only; ≤120 real calls, no schema retries; one-slot execution/independent scoring/stop before next. Five mismatch questions bypass provider (normally87 calls). Fixture transport chain completed; canned NOT_STATED fails Q01 quality as expected, not a real-model result. Wrapper initially rejected missing short-id file before calls; corrected G1-Q prefix, evidence retained. Product/Prompt/reference/scorer unchanged. Test review inventory waits C integration/B G3; no deletions. Report: .eval-artifacts/phase3b/g1-real-model/plan.md.


<a id="dev-2026-10-28-g1-real-evaluation"></a>

## 2026-10-28 CET: G1 real-model fixed saved-page evaluation

**2026-10-28 CET: A G1 saved-page real-model evaluation completed, pending review.** Frozen b9ee3d3e on B-integrated main6fa60cda:34×3=102 trials,87/120 provider attempts (85 responses/2TIMEOUT),15 local mismatch refusals; website/Google/Live0. Unchanged scorer18PASS/24FAIL/60NOT_EVALUATED;76 claim counts unknown, automatic detections0/provisional agent triage0, no final S0=0 or G1 acceptance. Explicit absence23/24; sensitive category/confirmation9/9; all classified category/flag76/79 (vegan false positives3). UNVERIFIED15NO_BOUND_PAGE/6INVALID_MODEL_OUTPUT/2MODEL_FAILED. No prompt/reference/scorer repair. Five gates1168/175 PASS/per-gate clean; frozen59 inputs unchanged. Test-review NOT_STARTED until B G3 begins; no test edits or reduction claim. [Report](../.eval-artifacts/phase3b/g1-real-model/report.md).

Five gates ran on frozen b9ee3d3e before paid calls; source unchanged afterward. Credential access only by explicitly authorized Node --env-file process. Original102 execution/evaluation records immutable, separate provisional triage. Q20-r2/Q33-r2 transport errors are failed trials; no schema retries, no extra paid trials. Delivery only to work branch for independent review, no main merge. Test review list remains pending G3 start and requires review before deletion.


<a id="dev-2026-10-28-g1-review-confirmation"></a>

## 2026-10-28 CET: G1 exhaustive independent review and approved expression extension

2026-10-28 CET: G1 independent reviewer confirms102 trials:84correct/18qualityFAIL/**falseclaims0**, absence23/24. User authorizes evaluation branch main integration. Append39 exact approved PASS expressions (dataset@3), preserve original automatic results and scoring rules. Offline rescore73PASS/24FAIL/5unknown;11 human-PASS cases remain blocked by existing quote/regex requirements, separately reported. New real calls0; six-question≤20-call rerun waits B fixes;2-core timing repairs next independent branch, test review waits G3. [Review](../.eval-artifacts/phase3b/g1-real-model/reviewer-followup.md).

Original102 execution/core/automatic-evaluation records verified byte-identical. Question, required quote, forbidden fragment, expected-kind, production and scorer sources unchanged; only approved expression lists/data provenance change. Main ledger union retains all id rows, sole zero-counter C completion metadata conflict documented with both originals. No.env read, no model/source call.


<a id="dev-2026-10-28-browser-fixture-clocks"></a>

## 2026-10-28 CET: Browser fixture lifetime and deterministic late-read clocks

2026-10-28 CET: A timing fixtures verified, review branch only. G2 owns one existing180s test lifetime; health late-read uses source-specific logical clocks and real DOM snapshots, all assertions retained/strengthened. Effective original reds at33.603/34.899s under2CPU quota pressure; ordinary2CPU/one-CPU full controls passed, auxiliary240s cancellation separately retained.61138c94/665 frozen inputs: macOS/Linux five gates1186/175 PASS; Linux three consecutive full4-worker suites175/175 in121.539/121.433/119.103s, each clean. Product/Guard/site/Prompt/Schema/State unchanged; new real calls0. VM removed. G1 review material already maincab27890; six-question real run waits B merge, broad audit waits G3. [Report](../.eval-artifacts/phase3b/browser-fixture-clocks/report.md).

Same target failures precede pressure cutoff; preserve2passing full controls and1cancelled auxiliary case. No timeout values/assertions relaxed, no new tests. G2 lifecycle t.signal replaces30s per-page timer, unchanged180s outer bound. Health retains actual Guard/Chromium/busy300ms and late1000+220ms read behavior with explicit complete/pending evidence checks. Only4A-owned eval/harness source files. Full offline receipts report exact isolation and current model/site call increment0.


<a id="dev-2026-10-28-clock-main-preparation"></a>

## 2026-10-28 CET: Approved timing repair main integration

2026-10-28 CET: User independently reviews2CPU clock repairs and approves173840b7 main integration. Current maincab27890 already ancestor; approved executable source and665 frozen inputs identical. Rerun five gates with per-item clean state, then publish main. Six-question≤20-call real rerun waits B G1 Prompt/Schema3 main merge; Q26 sourceConflict/confirmation, English Q07/Q33, full-sentence Q31, comment-free NOT_STATED Q27, NONE Q14 recorded as explicit checks. Broad audit waits B G3. New real calls0.


<a id="dev-2026-10-28-clock-main-verified"></a>

## 2026-10-28 CET: Approved clock repair main verification

2026-10-28 CET: Approved clock source173840b7 is verified for main publication. Latest maincab27890 already ancestor, executable diff0; frozen4e45e37a five gates1186/175 PASS and each before/after clean.665 inputs unchanged; independent2CPU review and prior three full Linux greens retained. No new real calls. B G1 fix not yet main: six-question repeat remains conditional; broad audit waits B G3. [Integration](../.eval-artifacts/phase3b/browser-fixture-clocks/main-integration/report.md).
