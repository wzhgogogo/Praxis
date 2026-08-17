# Historical Restaurant v15 Semantic Holdout v1

- Status: Superseded by [Restaurant v16 Semantic Holdout v2](RESTAURANT-SEMANTIC-HOLDOUT-V2.md)
- Version: 1.1
- Last updated: 2026-08-17
- Source of truth for: 已废弃v15标注格式的历史记录；不得用于当前标注或Baseline
- Related ADRs: [ADR-0008](../decisions/0008-open-restaurant-criteria-contract.md)
- Related documents: [Current Status](../STATUS.md), [Eval Skill](../skills/eval/SKILL.md), [Eval Directory](../../src/eval/README.md)

> v16以开放`criteria`替换了本文件的三种分类数组。保留本文只用于解释旧标注为何不能进入新的Clean Holdout；当前格式和协议只以[v2](RESTAURANT-SEMANTIC-HOLDOUT-V2.md)为准。

## 历史状态

评测工程已准备完成，私有30-query Holdout正在人工标注，尚未运行真实模型Baseline。模板位于[`src/eval/semantic-v15/holdout.template.json`](../../src/eval/semantic-v15/holdout.template.json)，实际标注文件位于Git忽略的`.eval-private/restaurant-semantic-holdout-v1.json`。实际文件不得提交、复制进Prompt、Regression、聊天诊断或开发日志。

这份数据只评估已冻结的v15链路：

```text
User message
→ Semantic Interpreter
→ Proposal Contract
→ Restaurant Compiler
→ Runtime / Reducer
→ Decision Kernel
```

它不评估真实餐厅搜索、Availability、推荐排序或预约，也不新增任何产品Contract字段。

## 你需要标注什么

一个`session`是一段独立会话；一个`turn`是一条用户消息。每个Turn只标三项：

1. `message`：英文用户原话；
2. `expectedDraft`：处理完本轮后的**完整累计权威Draft**，不是本轮Patch；
3. `expectedDecision`：核心字段缺失时为`ASK_USER`，全部齐全时为`SEARCH`。

不标注模型应该输出的Semantic Proposal，不标注`ambiguities`，不写评分解释、错误码或Prompt提示。这样Gold描述产品应理解出的结果，不反向教模型如何生成内部结构。

## 固定格式

数据集顶层字段已经冻结，不要修改：

```json
{
  "schemaVersion": "1",
  "id": "restaurant-semantic-holdout-v1",
  "version": "1",
  "cohort": "HOLDOUT",
  "contaminationStatus": "CLEAN_HOLDOUT",
  "referenceTime": "2026-08-20T09:00:00+09:00",
  "timezone": "Asia/Tokyo",
  "sessions": []
}
```

Turn结构如下。这里只展示字段形状；不要复制示例文字或值作为Holdout题目：

```json
{
  "id": "SH01-T01",
  "message": "<your unseen user message>",
  "expectedDraft": {
    "schemaVersion": "1",
    "timezone": "Asia/Tokyo",
    "cuisines": [],
    "hardConstraints": [],
    "softPreferences": []
  },
  "expectedDecision": {
    "type": "ASK_USER",
    "missingRequiredFields": ["date", "timeWindow", "partySize", "area"]
  }
}
```

`expectedDraft`允许的可选字段只有：`target`、`date`、`timeWindow`、`partySize`、`area`、`budgetPerPerson`。三个数组`cuisines`、`hardConstraints`、`softPreferences`必须始终存在，即使为空。Draft不存储`missingRequiredFields`；它由四个阻塞值即时计算。

`expectedDecision.missingRequiredFields`只允许`date`、`timeWindow`、`partySize`、`area`，并按这个固定顺序填写；Preflight会从`expectedDraft`重新计算并核对。

## 多轮标注

- 每个Turn的`expectedDraft`包含此前Turn保留的事实和本轮新增、修正或删除后的最终结果。
- 修正后的值替换旧值；否定集合项后从相应数组中删除。
- `expectedDecision.missingRequiredFields`必须与同一Turn的Draft完全一致。
- 不要为保持“题目难度”而故意留下自相矛盾的Gold。

## Clean Holdout边界

- 只写你尚未拿来调Prompt、改Contract或诊断模型的新表达。
- 现有`semantic-v15/fixtures.ts`的7个Turn、v14 Golden和文档示例都不能进入这份Clean Holdout；它们只能作为Regression。
- 可以覆盖完整请求、逐步补全、修正、否定、命名目标和欠明确请求等能力类别，但不要从现有样本改几个词制造“新题”。
- 人工创建Query和Gold本身不会污染被测模型。污染发生在用Query、Gold、模型输出或失败结果优化被测Prompt、Contract、实现或Scorer时；为保持盲测，标注内容仍只留在私有文件，不提供给负责上述优化的人或模型。
- Preflight只检查结构与Gold内部一致性，不读取模型输出，也不会判断你的语义标注是否合理。
- 第一次真实Baseline开始后，该Dataset立即不能再次作为Clean Holdout使用；无论运行成功还是中途失败，CLI都会保留一次性运行记录。

## 标注与检查

标注过程中运行：

```bash
npm run eval:semantic:holdout:preflight
```

它允许空Session集合，并返回`READY_FOR_ANNOTATION`。完成全部标注后运行：

```bash
npm run eval:semantic:holdout:preflight:complete
```

只有`READY_FOR_BASELINE`才允许真实Baseline入口继续。若strict Schema、Gateway transport或Provider模型配置在此次Baseline前发生变更，必须先对已暴露的7-turn Regression运行一次真实DeepSeek Smoke，确认Schema/API transport可用；这不读取Holdout，也不能替代Baseline。该入口还会在联网前核验固定模型`deepseek-v4-flash`、Prompt`v2`、Proposal Schema`1`、Evaluator`1`、参考时间、Case顺序和完整Turn数量；真实运行必须另行获得付费网络授权，不能在标注阶段执行。

## 已冻结的评分顺序

1. 输入与Model Gateway；
2. Semantic Proposal Contract；
3. 编译并累计后的权威Draft（Holdout可证明的`SEMANTIC_RESULT`）；
4. Runtime命令；
5. Decision Kernel；
7. 本地Fixture Search后的Runtime闭环。

Holdout不标内部Proposal或Patch，因此不会伪造Interpreter/Compiler/Reducer精确归因；这些深层首错只由带开发Oracle的Regression证明。Scorer仍按首错归因：Draft错误时不再把由它造成的Decision错误重复计分。报告必须写明`PRODUCT_SEMANTIC_ONLY`归因级别，并保留`cohort`、`contaminationStatus`、`baselineEligible`、Dataset哈希、模型调用、延迟、Token、成本状态和一次性运行记录；Fixture与真实模型结果不能混报。
