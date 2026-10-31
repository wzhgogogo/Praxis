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
