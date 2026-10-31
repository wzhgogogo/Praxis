# 经用户批准的范围外修正：记录实际结论来源

- Evidence status: **draft / not integrated — OFFLINE PASS, ready for review**；仅工作分支，不合main。
- 分支：`codex/feat-phase3b-g4-japanese-name-wiring`；修正基线`20e3588cf360ae647fc619f006ea0c7121debf6d`。
- 独立生产修复提交：**`e4b0e27e731b9a0e3a1556c37b51057b7a2bf535`**，只有availability-source-resolver.ts的**1行新增**。测试/计划先在743dca0d冻结；完整门禁冻结90c90a50。
- 时间：2026-10-31，维也纳CET（UTC+1）；正式检查05:17:25–05:20:33。

## 已批准范围与实际diff

用户已明确批准作为原“只改检索词和名额”范围之外的修正：仅在AvailabilitySourceResolver.check成功接纳check的分支补 `sourceProvider: provider.provider`。本次完全按该行执行；独立提交不含任何测试、文档或功能混杂。

准确位置为原第101行spread之后、新第102行；红灯计划中的预估104行相差3行，以Git实际diff和唯一成功分支为准。其它生产代码与20e3588c逐字一致。身份、时段、响应解析、两次链接校验、sourceAttempts及聚合metadata.provider均未改；没有新Schema、Prompt、State、TaskDefinition或迁移。

这一字段本来就表示“当前结论的来源”。多个站点参与时metadata.provider仍可为AVAILABILITY_SOURCE_RESOLVER；check现在显式记录实际给出AVAILABLE/UNAVAILABLE结论的站点。旧的原始报告、事件、请求提案、37家执行与评分原件全部保留，没有把上次红灯改写为绿灯。

## 先红后绿与不变性

743dca0d的未修代码下，新增来源断言确实失败：正向/反向回退及两个direct raw check均缺少字段；普通HTTP为PRESENT_RESULTS但错误聚合来源使按钮0。[原始红灯](red.log)。e4b0e27e修复后，同一批19项全绿；没有改/skip/反转原按钮或来源断言。[原始绿灯](green.log)。

| 路径 | 修后sourceProvider | 对比结论 |
| --- | --- | --- |
| TableCheck失败→Tabelog成功 | TABELOG | 实际HTTP原B1交接从0变1，URL逐字等于既有独立原链接字面量 |
| Tabelog失败→TableCheck成功 | TABLECHECK | 来源正向标记，其它字段与attempts相同 |
| 只有TableCheck直接成功 | TABLECHECK | 唯一metadata原本已给出同一有效来源，其它结果不变 |
| 只有Tabelog直接成功 | TABELOG | 有效来源和其它结果不变 |
| 两者都失败 | 不新增字段 | 完整返回对象及编码原文严格一致，包括原因和sourceAttempts |

固定Date的五份红绿原始结果作独立逐字段比较：四个成功路径**只新增sourceProvider**，去掉这一字段后其余序列化内容与红灯相同；全部sourceAttempts逐项相同。双失败的原始base64载荷也相同。单源raw对象由缺字段变成显式字段，因此不声称raw对象完全不变；其有效来源/结果一直正确，修正只是提前显式记录。

普通HTTP沿真实初始化、Interpreter/Compiler/Router/Reducer/生产解析/PGlite运行，只有模型/Google/BrowserSession传输为构造fixture。红绿导航、来源evidence、其它check字段和模型/Google调用计数相同；sourceProvider从聚合resolver变成TABELOG，既有两次严格校验随后产生原URL交接。原11个HTTP子例及所有日期/人数/时段/店号/域名/路径反例保持。[正式独立对照](gates/delta-verification.json)。反向/direct/双失败为Adapter控制，不能冒称现实站点验证。

## 五门禁与严格G2

| 检查 | 结果 |
| --- | --- |
| npm run typecheck | PASS |
| npm run arch:check | PASS |
| npm test | **1271/1271**，失败/跳过/取消0 |
| npm run build | PASS |
| npm run test:browser:fixture | **186/186**，130.136秒 |
| PRAXIS_G2_REQUIRE_PASS=1 npm run test:dom-change | **5/5测试、12/12页PASS** |
| 红绿快照独立对照 | 5路径+实际HTTP PASS |
| 冻结与边界 | 1585输入SHA首尾相同、生产只1行、142份旧artifact原样保留 |

[gates.json](gates.json)记录9步命令、CET时间和日志SHA；**每项前后git status为空**，没有restore或绿灯例外。旧默认1263/1265失败记录仍在父目录，新绿灯单独保存。身份/检索/原模拟器与独立Gold/原页面未变，所以复用已经通过的37+4身份回放原23/23、focus3/3和错认0证据，不另跑无新问题的整批评测。

## 新调用和下一停止点

本轮真实模型、Google、评测网站GET、Live和真实PostgreSQL均0；没有读取/加载.env。使用本地HTTP、构造来源传输及PGlite；Chromium仅本地fixture。共享账本字节与20e3588c相同，累计仍模型171/Google11/GET244/Live0，上限260。

本修正已经关闭B1来源标记阻断，候选五门禁和严格G2已全绿。**Beef的完整精确GET清单仍未就绪**：同ID日文原名和首屏尚无原件。已有8个详情URL和精确单次Google提案保持原样、未执行；本次窄授权没有批准Google或网站请求，方案一实测继续停在清单复核前。[清单依赖](../request-review.md)、[精确Google提案](../google-request-for-review.json)。

按原授权推送工作分支并ls-remote核对，不合main；交用户/复核者审查这一独立范围外修正与候选。

# sourceProvider 全部读取方与影响

本表核对当前候选e4b0e27e。两份完整code grep为source-provider-all-code-grep.before.txt/after.txt，命令与每处原文、行号见reader-inventory.*.json；source-provider-full-src-grep.txt另保留src/scripts/web-skills含JSON数据的全部命中。只搜索Git跟踪公开开发材料，没有读取.env或私有留出集。

运行时读取/使用逐处如下。没有修改任何读取方；生产diff只有resolver成功分支的一行。

| 位置 | 读取内容 | 本修正是否改变行为；仅限实际来源 |
| --- | --- | --- |
| src/application/restaurant-execution-router.ts:112 | mergedFacts读取fact check来源是否缺失 | 不变；本修正只写availabilityChecks，不写factChecks。 |
| src/application/restaurant-execution-router.ts:124 | mergedAvailability优先check来源，否则metadata聚合来源 | 有意改变；复合成功结果保留实际提供结论的站点，单源有效值不变。其它check字段、offers/evidence/attempts不变。 |
| src/application/restaurant-execution-router.ts:353 | factSourceAttempts的fact check来源回退 | 不变；事实链路。 |
| src/domains/restaurant/read-assessment.ts:54 | restaurantCurrentFactEvidence读取factChecks来源确定事实范围 | 不变；未修改factChecks或facts/evidence，因此不改变HARD/事实接纳。 |
| src/domains/restaurant/task-definition.ts:383 | AGENT_LOOP_TERMINATED收集checks来源作为诊断文案 | 仅来源标签可改变：不再因成功check回退而多列聚合resolver这个非实际站点。原sourceAttempts与evidence提供的实际来源仍完整保留；不改终态判定。 |
| src/domains/restaurant/task-definition.ts:516 | CANDIDATE_FACTS_CHECKED读取fact check来源 | 不变；事实事件分支未触及。 |
| src/domains/restaurant/task-definition.ts:520 | 同一事实分支使用局部sourceProvider计算attemptedProviders | 不变；事实刷新与superseded逻辑不变。 |
| src/domains/restaurant/task-definition.ts:530 | 同一事实分支把局部sourceProvider写入storedCheck | 不变；该局部值只来自factChecks及facts evidence。 |
| src/domains/restaurant/task-definition.ts:585 | AVAILABILITY_CHECKED优先保存check来源，否则用批次metadata | 有意改变；持久check保存实际提供结论的TABELOG/TABLECHECK。已有可选字段，版本不升；requestFingerprint、来源尝试、库存/证据和其它状态保持。 |
| src/domains/restaurant/booking-handoff.ts:147 | check来源必须与handoff来源严格相等 | 有意改变；原本合格却被聚合标签误拒的交接现在可通过**同一条**严格相等检查。仍要求同店/同日期/人数/时段/HIGH证据、时效、来源原链接和两次原校验，不放宽规则。 |
| src/domains/restaurant/agent-context.ts:165 | factCheck缺少attempts时的来源回退 | 不变；事实check未变。 |
| src/domains/restaurant/agent-context.ts:167 | availability缺少attempts时的来源回退 | 实际resolver输出不变：成功分支始终同时提供非空sourceAttempts，本分支因此不回退。Agent看到的实际attempts和结果不变。 |

这些是5个产品文件的12处运行时读取/局部值使用。其余product/tool命中均为类型或写入：

- contracts.ts:187/468：availability/fact check已有可选字段声明；未修改。
- task-definition.ts:514：仅TypeScript NonNullable类型引用；没有运行时行为。
- google-then-website-facts.ts:120、native-source-facts.ts:308/386：事实来源写入；不读本次availability字段，不变。
- harness/workspace-fixture-server.ts:102：已有fixture来源写入；未修改。
- availability-source-resolver.ts:102：本次新增写入；不读取旧sourceProvider，由实际被调用且给出结论的provider赋值。

测试命中为既有事实/交接fixture写入、原B1错来源拒绝断言，以及本次新增来源断言；它们是验证，不是另一条产品读取路径。没有修改A的harness或eval文件。

7处冻结外层代码命中也全部保留：P1-G2/extract-terminal-states.mjs和p2-0/termination/extract-state.mjs仅把sourceProvider列为保留的枚举字段名；若对新快照提取，它们会原样保留修正后的实际来源，不改变业务。3份phase3a-prime timing challenge源码以及g5-b1、g5-b1-followup的2份verify-web脚本仅构造fixture来源写入；本轮不运行、不修改。JSON/录制/文档中的字段定义不是运行时读取者，完整原始命中仍单列。

单源“保持不变”的精确定义：修复前raw resolver check未显式写字段，Router/Reducer已经用唯一metadata.provider补出正确来源；修复后提前显式写入同一来源。四个成功控制仅增加此字段，**有效来源和所有其它返回字段不变**。双失败的完整对象（包括sourceAttempts、原因、metadata和offers）严格相同。固定Date的红绿原件和delta-verification.json提供独立比较；不把“原来undefined，现在有值”误说成raw字节完全相同。

本轮新增compare-traces.py仅为当前验证工具，读取冻结红绿结果中的来源字段以检查上述不变性；verify.py/run-gates.py检查源码、日志和SHA，不参与产品决策。完整after grep的快照提交e4b0e27e早于这些验证工具，但晚于全部产品/测试改动；此后产品读取方没有变化。
