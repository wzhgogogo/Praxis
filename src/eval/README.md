# Eval Modules

`src/eval/`只放当前评测、Fixture与运行器，不是产品Runtime的依赖方向。

```text
src/eval/
├── semantic-v15/    当前产品语义链、已暴露Regression与私有Holdout入口
├── search-fixture/  本地Fixture Search产品纵向检查
└── shared/          真实模型付费门禁、成本和调用汇总
```

历史v14 Decision Harness和旧单轮Intent Parser已经退出产品主链，其可执行代码与命令已删除。7个v14 Episode / 17个Turn、旧Parser连通性结果和设计取舍仍可从Git历史、`docs/harness/`历史文档及`docs/history/`日志追溯；不得为重放历史而恢复产品兼容路径。

## 当前v15命令

```bash
npm run eval:semantic:fixture
npm run eval:semantic:holdout:preflight
npm run eval:semantic:holdout:preflight:complete
npm run eval:search:fixture
```

- `eval:semantic:fixture`只用7个已暴露Regression Turn与开发Oracle验证Evaluator管线和深层首错，固定为`attributionLevel: DEVELOPMENT_STAGE_ORACLES`及`baselineEligible:false`。
- 标注中Preflight允许空集合并返回`READY_FOR_ANNOTATION`。
- 严格Preflight要求完整Gold并返回`READY_FOR_BASELINE`。
- `eval:search:fixture`只证明本地Fixture产品路径，不证明真实平台质量。

受控真实命令`eval:semantic:deepseek`和`eval:semantic:holdout`都需要显式付费门禁；后者还要求Clean确认、固定模型和一次性运行记录。标注阶段不得运行真实Holdout。

## v15 Holdout文件

- `holdout.template.json`：可提交的空模板，不含样本。
- `.eval-private/restaurant-semantic-holdout-v1.json`：实际标注文件，Git忽略。
- `holdout.ts`：Eval-only Dataset Contract、冻结清单和Preflight；不增加产品Proposal字段。
- `scorer.ts`：Regression可比较Proposal、Patch、Draft、Decision；Holdout只比较产品语义Draft与Decision并报告`PRODUCT_SEMANTIC_ONLY`。
- `run-holdout.ts`：受控的一次性真实Baseline入口。

完整规则见[Eval Skill](../../docs/skills/eval/SKILL.md)和[v15 Holdout Guide](../../docs/harness/RESTAURANT-SEMANTIC-HOLDOUT-V1.md)。
