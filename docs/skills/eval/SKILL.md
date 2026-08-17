---
name: praxis-eval
description: Praxis质量评估；衡量当前v15语义链、搜索、Outcome准确性、成本和安全回归。
---

# Praxis Eval

Eval评估模型与端到端质量，不替代功能测试。当前唯一产品语义评测对象是Restaurant v15；已经退出产品主链的v14 Decision Harness和单轮Intent Parser可执行代码已删除，历史设计与结果只在Git历史、Harness历史文档和Test Log中保留。

## 当前目录

```text
src/eval/
├── semantic-v15/    当前Proposal → Compiler → Runtime/Reducer → Kernel评测
├── search-fixture/  本地Fixture产品搜索纵向检查
└── shared/          真实模型付费门禁、成本与调用汇总
```

不得把已暴露Regression、Fixture Search、Mock、Replay、Live Read-only或Controlled Live-write互相替代或混报。

## Stage 2C冻结口径

- 产品职责固定为`Semantic Interpreter → Proposal Contract → Compiler → Runtime/Reducer → Decision Kernel`。
- Prompt固定为`v2`，Proposal Schema固定为`1`。不得为单个Eval Case新增产品Contract字段或重新分配职责。
- v14的7个Episode / 17个Turn及旧单轮Intent Eval已经完成架构探针使命；其可执行代码、命令和默认测试已删除。需要追溯时读历史文档或Git，不恢复兼容路径。
- 下一份独立Baseline只评估v15，并使用私有`CLEAN_HOLDOUT`。

## 已暴露v15 Regression

本地Fixture管线：

```bash
npm run eval:semantic:fixture
```

它用7个已暴露Turn验证Evaluator是否按`Proposal → Contract → Compiler → Runtime/Reducer → Kernel → Fixture Search`执行，固定报告为`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。它证明管线连通，不证明模型泛化或真实餐厅质量。

受控真实模型Regression：

```bash
PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 \
PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=7 \
npm run eval:semantic:deepseek
```

该命令只使用已暴露静态文本、内存Runtime和Fixture Search，不创建产品Task，不访问真实Discovery/Availability，不执行预约。任何再次运行都需要单独付费授权，结果仍不能成为Baseline。

## v15 Clean Holdout

标注规范、固定格式和污染边界见[Restaurant v15 Semantic Holdout v1](../../harness/RESTAURANT-SEMANTIC-HOLDOUT-V1.md)。实际数据位于Git忽略的`.eval-private/restaurant-semantic-holdout-v1.json`；Prompt、Regression、聊天诊断和开发日志不得复制其内容。

标注中结构检查：

```bash
npm run eval:semantic:holdout:preflight
```

全部标注完成后的严格门禁：

```bash
npm run eval:semantic:holdout:preflight:complete
```

只有`READY_FOR_BASELINE`才允许真实Runner继续。真实`eval:semantic:holdout`固定：

- `DEEPSEEK:deepseek-v4-flash`；
- Prompt`v2`、Proposal Schema`1`、Evaluator`1`；
- 温度0、Thinking关闭、最多2次Schema尝试、0次Provider重试；
- 固定Tokyo参考时间与Dataset顺序；
- 完整Turn数量、Dataset SHA-256与一次性运行记录。

它要求`PRAXIS_ALLOW_LIVE_MODEL_EVAL=1`和`PRAXIS_CONFIRM_CLEAN_HOLDOUT=1`。第一条模型请求前创建不可覆盖的运行记录；无论成功或中断，该Dataset都不能再次称为Clean Holdout。

## 评分与首错

固定顺序：

```text
INPUT / MODEL_GATEWAY
→ SEMANTIC_PROPOSAL_CONTRACT
→ COMPILER
→ SEMANTIC_RESULT
→ RUNTIME
→ DECISION_KERNEL
```

- Contract通过只代表结构合法，不代表语义正确。
- `SEMANTIC_RESULT`比较编译并累计后的完整权威Draft，不要求Gold复述模型Proposal或内部Patch。
- Scorer先判Draft，再判Kernel；上游错误不会在下游重复扣分。
- 多轮Session上游失败后，后续Turn标记`BLOCKED_BY_UPSTREAM`，不伪造分数。
- Evaluator不得调用LLM Judge来替代确定性Gold、P0或首错门禁。

## 防泄漏规则

- Regression可以用于开发和调试；一旦文本、Gold、错误或结果被查看，就只能是`DEVELOPMENT_DIAGNOSTIC`。
- Holdout内容或结果一旦进入Prompt、示例、调参或诊断，立即成为`RESULT_EXPOSED`或`PROMPT_EXPOSED`，不得靠重跑恢复。
- Prompt示例只能解释抽象Schema和通用规则，不能包含Regression或Holdout事实。
- 真实报告必须输出`cohort`、`contaminationStatus`、`baselineEligible`、版本清单、调用数、延迟、Token、成本状态和Dataset哈希。

## Search与外部执行

```bash
npm run eval:search:fixture
```

该命令只证明本地Fixture Web链的完整输入、缺字段澄清和候选选择停在授权前。真实Discovery、Availability、预约和外部写入必须分别进入Live Read-only或Controlled Live-write阶段，不能由语义Holdout代替。
