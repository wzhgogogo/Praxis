---
name: praxis-eval
description: Praxis质量评估；衡量当前语义链、Agent动作、搜索、Outcome准确性、成本和安全回归。
---

# Praxis Eval

Eval评估模型与端到端质量，不替代功能测试。当前产品架构由ADR-0010、ADR-0011、ADR-0012及ADR-0013控制定义：语义Eval只评估保留的 Interpreter → Compiler → Reducer 边界；Agent动作由独立Action Validator、最小Restaurant Agent Context、Router deadline与Harness验证。已经退出产品主链的Decision Harness、单轮Intent Parser和分类Criteria Contract只在历史文档与Git中保留。

## 当前目录

```text
src/eval/
├── restaurant/
│   ├── semantic/       当前语义Evaluator；drafts/不进入Runner
│   ├── agent-loop/     有界只读诊断与Hybrid Runner；完整Rubric/Scorer尚未集成
│   └── search-fixture/ 本地Fixture产品搜索纵向检查
└── shared/             真实模型付费门禁、成本与调用汇总
```

不得把已暴露Regression、Fixture Search、Mock、Replay、Live Read-only或Controlled Live-write互相替代或混报。

Eval材料按`current executable`、`frozen regression`、`superseded retrospective`和`draft / not integrated`管理。历史Plan、Golden/Regression Set、Manifest、评分口径和运行证据保留；退出当前主链的可执行实现不因此长期保留。执行、评分、污染/基线资格分别记录。当前Hybrid Runner实际读取agent-loop/drafts/e2e-cases.yaml，但完整Scorer未集成；这是路径与命名约定的不一致，因本轮排除标注数据而保留，不移动或修改输入。可运行诊断不等于可评分Baseline。

## Stage 2C冻结口径

- 产品职责固定为`Semantic Interpreter → Proposal Contract → Compiler → Runtime/Reducer → Agent Decision → Action Validator → Execution Router`；语义Eval只在Interpreter/Compiler/Reducer边界归因，不把ADR-0007的历史next-step标注当作产品Runtime。
- 当前标识为`restaurant-semantic-prompt@7`与`restaurant-semantic-proposal@3`。稳定槽位外只允许开放`CRITERION{text, polarity, strength}`，strength固定为`HARD` / `SOFT` / `UNSPECIFIED`；不得为单个Eval Case新增taxonomy、Provider mapping或重新分配职责。已运行的Prompt `@4` Baseline保持`RESULT_EXPOSED`，不能用来验证Prompt `@7`。
- 历史Decision Harness的7个Episode / 17个Turn及旧单轮Intent Eval已经完成架构探针使命；其可执行代码、命令和默认测试已删除。需要追溯时读历史文档或Git，不恢复兼容路径。
- Prompt `@7`的下一份独立Baseline必须使用新的私有`CLEAN_HOLDOUT`；它是parser/semantic质量工作，不阻塞Hybrid E2E preparation。

## 已暴露语义 Regression

本地Fixture管线：

```bash
npm run eval:restaurant:semantic:fixture
```

它用已暴露Turn和开发阶段Proposal/Patch Oracle验证Evaluator是否按`Proposal → Contract → Compiler → Runtime/Reducer`执行，固定报告`attributionLevel: DEVELOPMENT_STAGE_ORACLES`及`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。它证明语义管线和分层归因，不证明模型泛化、Agent规划或真实餐厅质量。

受控真实模型Regression：

```bash
PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 \
PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=7 \
npm run eval:restaurant:semantic:deepseek
```

该命令只使用已暴露静态文本、内存Runtime和Fixture Search，不创建产品Task，不访问真实Discovery/Availability，不执行预约。付费实验需用户授权；授权可明确案例、最大调用数或费用，已授权范围内可继续，超出范围再确认。开关不代替授权，结果仍不能成为Baseline。

当strict Schema、Gateway transport或Provider模型配置在首次Clean Holdout前发生变化时，必须先运行一次这个已暴露Regression，确认没有Schema/API transport失败；它只验证已暴露样本的连接和结构化传输，不能替代Clean Holdout。

## 语义 Clean Holdout

标注规范、固定格式和污染边界见[Restaurant Semantic Holdout](../../harness/RESTAURANT-SEMANTIC-HOLDOUT.md)。实际数据标识为`restaurant-semantic-holdout@2`，位于Git忽略的`.eval-private/restaurant-semantic-holdout-v2.json`；Prompt、Regression、聊天诊断和开发日志不得复制其内容。

标注中结构检查：

```bash
npm run eval:restaurant:semantic:holdout:preflight
```

全部标注完成后的严格门禁：

```bash
npm run eval:restaurant:semantic:holdout:preflight:complete
```

只有`READY_FOR_BASELINE`才允许真实Runner继续。v4历史Baseline固定：

- `DEEPSEEK:deepseek-v4-flash`；
- `restaurant-semantic-prompt@4`、`restaurant-semantic-proposal@3`与`restaurant-semantic-scorer@3`；
- 温度0、Thinking关闭、最多2次Schema尝试、0次Provider重试；
- 固定Tokyo参考时间与Dataset顺序；
- 完整Turn数量、Dataset SHA-256与一次性运行记录。

它要求`PRAXIS_ALLOW_LIVE_MODEL_EVAL=1`和`PRAXIS_CONFIRM_CLEAN_HOLDOUT=1`。第一条模型请求前创建不可覆盖的运行记录，持久化`datasetStatus: EXPOSED`和`exposedAt`；无论成功或中断，该Dataset都不能再次称为Clean Holdout。任何`restaurant-semantic-prompt@7` Baseline必须冻结新的数据集版本与运行清单，不能复用`restaurant-semantic-prompt@4` artifact或当前已暴露数据集。

已暴露v2数据如果用于诊断Prompt变化，始终不得作为Baseline。Dataset仍与v4 artifact SHA一致时，使用`EXPOSED_HOLDOUT_REGRESSION / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`：

```bash
PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 \
PRAXIS_CONFIRM_EXPOSED_HOLDOUT_REGRESSION=1 \
PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=25 \
DEEPSEEK_MODEL=deepseek-v4-flash \
npm run eval:restaurant:semantic:holdout:exposed-regression
```

该入口严格核对当前Dataset SHA与不可变v4 artifact，启动即写入独立的Git忽略JSON运行记录。它保留完整逐turn诊断、与v4实际模型可达的同一turn集合的field-level delta、此前`BLOCKED_BY_UPSTREAM`的续跑结果、调用指标和运行前代码快照；不得覆盖Baseline或把全25 turn与v4的15个实际调用混作同口径改善。

如果已暴露Dataset经过明确的canonical Gold更新，Runner必须显式确认该版本，并引用当前Prompt直接前一版本的已暴露Regression artifact；两份artifact的Dataset SHA不一致时，Runner在模型调用前拒绝运行。此时分类固定为`EXPOSED_GOLD_ACCEPTANCE_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`，绝不生成或宣称Clean Baseline，也绝不与v4全量比较：

```bash
PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 \
PRAXIS_CONFIRM_EXPOSED_HOLDOUT_REGRESSION=1 \
PRAXIS_CONFIRM_CURRENT_EXPOSED_GOLD_VERSION=1 \
PRAXIS_PREVIOUS_EXPOSED_REGRESSION_ARTIFACT=<previous-exposed-regression-artifact> \
PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=25 \
DEEPSEEK_MODEL=deepseek-v4-flash \
npm run eval:restaurant:semantic:holdout:exposed-regression
```

它只对比`COMMON_UNCHANGED_TURNS`：以当前和前一artifact的Gold Draft相同的turn为集合，排除全部annotation-changed或无前序快照的turn；历史Decision标注不参与当前语义比较。报告必须清楚标注该限定，不能把它外推成whole-dataset或Clean Baseline结论。

## 评分与首错

开发Regression的固定顺序：

```text
INPUT / MODEL_GATEWAY
→ SEMANTIC_PROPOSAL_CONTRACT
→ SEMANTIC_INTERPRETER
→ COMPILER
→ REDUCER
→ RUNTIME
```

- Contract通过只代表结构合法，不代表语义正确。
- Regression开发Oracle可区分Proposal语义、Compiler Patch和Reducer累计状态。
- Clean Holdout不标内部Proposal/Patch，只能证明最终`SEMANTIC_RESULT` Draft，必须报告`PRODUCT_SEMANTIC_ONLY`，不得伪造深层精度。
- Proposal facts、Patch集合与Draft的`criteria`按去重排序后的集合语义比较；Criterion文本只按trim/case等价，polarity和strength与singleton精确比较。
- Scorer先判Draft；上游错误不会在下游重复扣分。历史`expectedDecision`仅供旧artifact审计。
- 多轮Session上游失败后，后续Turn标记`BLOCKED_BY_UPSTREAM`，不伪造分数。
- Evaluator不得调用LLM Judge来替代确定性Gold、P0或首错门禁。

## 防泄漏规则

- Regression可以用于开发和调试；一旦文本、Gold、错误或结果被查看，就只能是`DEVELOPMENT_DIAGNOSTIC`。
- 人工创建和标注本身不污染被测模型；Holdout内容、Gold、输出或失败一旦用于优化Prompt、Contract、实现或Scorer，立即成为`RESULT_EXPOSED`或`PROMPT_EXPOSED`，不得靠重跑恢复。
- Prompt示例只能解释抽象Schema和通用规则，不能包含Regression或Holdout事实。
- 真实报告必须输出`cohort`、`contaminationStatus`、`baselineEligible`、版本清单、调用数、延迟、Token、成本状态、Dataset哈希、git commit SHA、scorer版本和prompt/schema hash。

## Search与外部执行

```bash
npm run eval:restaurant:search:fixture
```

该命令只证明本地Fixture Web链的完整输入、缺字段澄清和候选选择停在授权前。真实Discovery、Availability、预约和外部写入必须分别进入Live Read-only或Controlled Live-write阶段，不能由语义Holdout代替。

## 诊断运行与证据

实际实验开始前写入独占的开始记录，成功、失败或取消保存独立结果；未正常收尾的开始记录表示运行未完成。阶段区分执行、失败、未到达，早期模型失败不能伪造下游故障。只保存脱敏原因、已有调用指标和必要环境摘要；日志不记录Cookie、挑战token、接管输入或原始Provider错误。

Browser检测、尝试、生效验证分别报告；静态禁止写入声明不作为实测副作用计数。网络路径和profile来源说明用户声明与实际观察的区别。新的诊断记录不得覆盖任何既有artifact。具体功能检查引用[Test](../test/SKILL.md)。
