# Eval Modules

`src/eval/`只放当前评测、Fixture与运行器，不是产品Runtime的依赖方向。

```text
src/eval/
├── semantic-v15/    v17产品语义链、已暴露Regression与私有Holdout入口（目录名为历史路径）
├── search-fixture/  本地Fixture Search产品纵向检查
└── shared/          真实模型付费门禁、成本和调用汇总
```

历史v14 Decision Harness和旧单轮Intent Parser已经退出产品主链，其可执行代码与命令已删除。7个v14 Episode / 17个Turn、旧Parser连通性结果和设计取舍仍可从Git历史、`docs/harness/`历史文档及`docs/history/`日志追溯；不得为重放历史而恢复产品兼容路径。

## 当前v17命令

```bash
npm run eval:semantic:fixture
npm run eval:semantic:holdout:preflight
npm run eval:semantic:holdout:preflight:complete
npm run eval:search:fixture
```

- `eval:semantic:fixture`只用7个已暴露v17 Regression Turn与开发Oracle验证Evaluator管线和深层首错，固定为`attributionLevel: DEVELOPMENT_STAGE_ORACLES`及`baselineEligible:false`。
- 标注中Preflight允许空集合并返回`READY_FOR_ANNOTATION`。
- 严格Preflight要求完整Gold并返回`READY_FOR_BASELINE`。
- `eval:search:fixture`只证明本地Fixture产品路径，不证明真实平台质量。

受控真实命令`eval:semantic:deepseek`和`eval:semantic:holdout`都需要显式付费门禁；后者还要求Clean确认、固定模型和一次性运行记录。v2 Holdout已在Prompt v4下运行并标记为`RESULT_EXPOSED`；Prompt v7不得重跑该数据集作为Clean Holdout。

如需在这份已暴露数据上诊断Prompt变化，只能运行独立的、不可作为Baseline的回归入口：

```bash
PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 \
PRAXIS_CONFIRM_EXPOSED_HOLDOUT_REGRESSION=1 \
PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=25 \
DEEPSEEK_MODEL=deepseek-v4-flash \
npm run eval:semantic:holdout:exposed-regression
```

当当前Dataset SHA仍与v4 artifact一致时，它会先严格Preflight并核对Dataset SHA，再在`.eval-artifacts/restaurant-semantic-exposed-regression/`写一份Git忽略的JSON运行记录。记录保留逐turn的Gold/实际Draft/Decision、字段差异、v4同15个可比turn的delta、此前被阻断turn的续跑状态、模型指标和运行前代码快照；绝不覆盖原始Baseline artifact。若分析维度修正，可用`eval:semantic:holdout:exposed-regression:analyze <artifact>`生成只追加的版本化analysis sidecar，永不重跑模型或改写原始结果。

如果当前Gold已被明确保留为canonical的新版本，必须额外给出确认和当前Prompt直接前一版本的已暴露Regression artifact；两份artifact的Dataset SHA不同会在模型调用前被拒绝：

```bash
PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 \
PRAXIS_CONFIRM_EXPOSED_HOLDOUT_REGRESSION=1 \
PRAXIS_CONFIRM_CURRENT_EXPOSED_GOLD_VERSION=1 \
PRAXIS_PREVIOUS_EXPOSED_REGRESSION_ARTIFACT=<previous-exposed-regression-artifact> \
PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=25 \
DEEPSEEK_MODEL=deepseek-v4-flash \
npm run eval:semantic:holdout:exposed-regression
```

该路径分类为`EXPOSED_GOLD_ACCEPTANCE_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。它不能创建Clean Baseline、不能把v7与v4/v5/v6整集直接对比；只会输出`COMMON_UNCHANGED_TURNS`，排除所有Gold annotation-changed或没有前一快照的turn。

首次Clean Holdout前，如strict Schema、Gateway transport或Provider模型配置有改动，必须先运行一次已暴露的`eval:semantic:deepseek`，确认真实Schema/API transport可用；该Smoke不能替代Holdout。

## v17 Holdout文件

- `holdout.template.json`：可提交的空模板，不含样本。
- `.eval-private/restaurant-semantic-holdout-v2.json`：实际标注文件，Git忽略。
- `holdout.ts`：Eval-only Dataset Contract、冻结清单和Preflight；产品Draft用开放`criteria`，不增加Provider分类或搜索字段。
- `scorer.ts`：Regression可比较Proposal、Patch、Draft、Decision；`criteria`仅按trim/case/order等价化，polarity和strength精确比较；Holdout只比较产品语义Draft与Decision并报告`PRODUCT_SEMANTIC_ONLY`。
- `run-holdout.ts`：受控的一次性真实Baseline入口。

完整规则见[Eval Skill](../../docs/skills/eval/SKILL.md)和[v17 Holdout Guide](../../docs/harness/RESTAURANT-SEMANTIC-HOLDOUT-V2.md)。
