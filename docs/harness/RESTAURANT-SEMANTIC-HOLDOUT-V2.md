# Restaurant v17 Semantic Holdout v2

- Status: Accepted
- Version: 3.0
- Last updated: 2026-08-18
- Source of truth for: v17 Clean Holdout 的私有标注格式、冻结清单、Preflight和单次Baseline运行协议
- Related ADRs: [ADR-0007](../decisions/0007-semantic-proposal-compiler-and-decision-kernel.md), [ADR-0009](../decisions/0009-semantic-strength-and-clean-holdout-baseline.md)
- Related documents: [Current Status](../STATUS.md), [Eval Skill](../skills/eval/SKILL.md), [Eval Directory](../../src/eval/README.md)

## 当前状态

首份v17 Clean Holdout已在Prompt `v4`与strict Preflight的15 session / 25 turn / 0 issue后按冻结配置运行一次；其Git忽略artifact现为`EXPOSED / RESULT_EXPOSED`，不得再次作为Clean Holdout运行。当前Prompt为`v5`，任何后续Baseline必须使用另一份Git忽略的未见标注文件和新的冻结运行清单。实际文件不得提交、复制进Prompt、Regression、聊天诊断或开发日志。

本数据只评估已冻结的职责链：

```text
User message → Semantic Interpreter → Proposal Contract → Restaurant Compiler → Runtime / Reducer → Decision Kernel
```

它不评估真实餐厅搜索、Availability、推荐排序或预约，也不引入Provider taxonomy或搜索过滤器。

## 标注目标

一个`session`是一段独立会话；一个`turn`是一条用户消息。每个Turn只标：

1. `message`：英文用户原话；
2. `expectedDraft`：本轮后的完整累计权威Draft；
3. `expectedDecision`：阻塞槽位缺失时`ASK_USER`，齐全时`SEARCH`。

不标内部Semantic Proposal、Patch、`ambiguities`、评分解释或Prompt提示。Gold描述用户表达在产品State中的结果，不能反向规定模型内部步骤。

## 固定格式

```json
{
  "schemaVersion": "3",
  "id": "restaurant-semantic-holdout-v2",
  "version": "2",
  "cohort": "HOLDOUT",
  "contaminationStatus": "CLEAN_HOLDOUT",
  "referenceTime": "2026-08-20T09:00:00+09:00",
  "timezone": "Asia/Tokyo",
  "sessions": []
}
```

每个Turn的完整Draft形状如下：

```json
{
  "id": "SH01-T01",
  "message": "<your unseen user message>",
  "expectedDraft": {
    "schemaVersion": "3",
    "timezone": "Asia/Tokyo",
    "criteria": [
      { "text": "quiet", "polarity": "POSITIVE", "strength": "SOFT" }
    ]
  },
  "expectedDecision": {
    "type": "ASK_USER",
    "missingRequiredFields": ["date", "timeWindow", "partySize", "area"]
  }
}
```

可选稳定字段只有`target`、`date`、`timeWindow`、`partySize`、`area`、`budgetPerPerson`。`criteria`必须始终存在，即使为空。它是开放用户表达：不再写`cuisines`、`hardConstraints`或`softPreferences`，也不增加其它分类字段。`missingRequiredFields`不存Draft，由四个阻塞槽位即时计算。

`criteria`的规则：文本简洁保留用户表达；明确排除是`NEGATIVE`，否则`POSITIVE`；违反会使结果实质错误为`HARD`，明确可权衡的偏好或近似为`SOFT`，只有无法表达或推断强度时为`UNSPECIFIED`。不要建立taxonomy或用词面触发词取代语义判断。

已完成的简化标注可使用`content`、`criteria`、`date`、`timeWindow`、`partySize`、`area`、`missingRequiredFields`、`decision`及多轮`turns[]`。Preflight只做确定性结构映射：`content → message`、area字符串→`{query}`、精确`HH:mm`→相同起止时间、`ASK → ASK_USER`；不会重写Gold语义。

## 多轮、污染与运行

- `expectedDraft`保留此前事实；稳定槽位的修正替换旧值。Criterion的添加、整体替换或删除必须反映在最终累计数组中。
- 不要用已暴露Regression、旧v15标注、文档示例或用来修改Prompt/Contract/实现/Scorer的表达作为Clean Holdout。人工创建Query和Gold本身不污染；用于优化后才污染。
- 标注时运行`npm run eval:semantic:holdout:preflight`；完成后运行`npm run eval:semantic:holdout:preflight:complete`。只有`READY_FOR_BASELINE`允许下一步。
- 任何Prompt、Proposal Schema、Gateway strict transport或Provider配置改动后，首次Clean Baseline前必须先运行已暴露v17 Regression的真实DeepSeek Smoke。它不读取Holdout、不能替代Baseline，并仍需要显式付费网络授权。
- 第一次真实Baseline开始前，runner以独占方式写入Git忽略artifact的`datasetStatus: EXPOSED`与`exposedAt`；其中包含Dataset SHA、git commit SHA、scorer版本和prompt/schema hash。无论成功或中断，该Dataset都不得再次作为Clean Holdout使用。
- 已暴露数据上的Prompt诊断必须使用`eval:semantic:holdout:exposed-regression`，并显式设定`PRAXIS_CONFIRM_EXPOSED_HOLDOUT_REGRESSION=1`。该入口只写新的Git忽略JSON记录，逐turn保存Gold、实际结果和field-level诊断，并与v4实际可达的同一turn集合比较；原Baseline artifact不可修改，输出固定为`baselineEligible:false`。

## 评分边界

Holdout只比较最终Draft和Decision，报告`PRODUCT_SEMANTIC_ONLY`。`criteria`文本只按trim、case和集合顺序做等价化；polarity和strength精确比较；不使用模型Judge。带内部Proposal/Patch Oracle的开发Regression才允许更深层首错归因。
