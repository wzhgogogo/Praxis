# Eval Modules

`src/eval/`只包含评测Case、Scorer和Runner，不是产品Runtime的依赖方向。完整评测协议以[Eval Skill](../../docs/skills/eval/SKILL.md)为准，当前能力与证据以[STATUS](../../docs/STATUS.md)为准。

```text
src/eval/
├── restaurant/
│   ├── semantic/       Proposal → Compiler → Runtime/Reducer语义评测
│   │   ├── cases/      当前可提交模板
│   │   ├── drafts/     未接入的Regression草稿与来源记录
│   │   └── runners/    Fixture、真实模型、Holdout与分析入口
│   ├── agent-loop/     只读Hybrid/Web artifact诊断与Runner
│   │   ├── cases/      当前H001–H005开发诊断输入与验收契约
│   │   └── runners/    Hybrid Live与已有artifact补评入口
│   └── search-fixture/ 本地Fixture搜索纵向检查
└── shared/             真实模型付费门禁、成本与调用汇总
```

## 生命周期

| 路径 / 对象 | 生命周期 | 是否进入默认门禁 | 保留目的 |
|---|---|---|---|
| `restaurant/semantic/`中的实现、测试与Runner | `current executable` | 是；真实模型命令仍需显式门禁 | 当前语义Regression、Holdout和Scorer |
| `restaurant/semantic/cases/holdout-template.json` | `current baseline input template` | 只进入Preflight | 新私有Holdout的空模板 |
| `restaurant/semantic/drafts/` | `draft / not integrated` | 否 | 保留Regression候选与来源思考，供Review后再决定是否晋升 |
| `restaurant/agent-loop/cases/` | `current executable development diagnostic` | 离线验证契约；Live单独授权 | 当前H001–H005输入；已暴露，不是Clean Baseline |
| `restaurant/search-fixture/` | `current executable fixture` | 是 | 当前本地搜索纵向检查 |
| `.eval-private/` | `private / git-ignored` | 仅显式Preflight或受控Runner | 保存不得提交或暴露的Holdout原文 |
| `docs/superseded/`中的Eval材料 | `superseded retrospective` | 否 | 解释历史Plan、Golden和标注口径 |

历史Eval证据不因退出当前门禁而删除；已被替代的可执行Runner、兼容代码和重复测试不为回顾目的保留，由Git历史恢复。材料从`draft`晋升为当前Eval时，必须补齐稳定ID、机器格式、Runner/Scorer、验收条件和对应文档，不能只改生命周期标签。

源码目录不携带架构、Prompt或Schema版本。当前机器身份分别由代码或Manifest记录：

- `restaurant-semantic-proposal@3`；
- `restaurant-semantic-prompt@12`，历史Artifact仍保存原始`promptVersion`格式；
- `restaurant-semantic-regression@3`；
- `restaurant-semantic-holdout@2`；
- `restaurant-semantic-scorer@3`。

## 当前命令

```bash
npm run eval:restaurant:semantic:fixture
npm run eval:restaurant:semantic:holdout:preflight
npm run eval:restaurant:semantic:holdout:preflight:complete
npm run eval:restaurant:search:fixture
```

真实模型命令需要各自的显式付费或数据暴露门禁：

```bash
npm run eval:restaurant:semantic:deepseek
npm run eval:restaurant:semantic:holdout:baseline
npm run eval:restaurant:semantic:holdout:exposed-regression
```

`semantic/cases/holdout-template.json`是不含样本的可提交模板；实际私有数据仍位于Git忽略的`.eval-private/restaurant-semantic-holdout-v2.json`。完整标注和一次性运行规则见[Restaurant Semantic Holdout](../../docs/harness/RESTAURANT-SEMANTIC-HOLDOUT.md)。

`agent-loop`的Hybrid Runner读取[当前验收契约](restaurant/agent-loop/cases/README.md)对应的`cases/e2e-cases.yaml`（`restaurant-read-development@4`），记录版本和文件哈希。确定性诊断只消费物化后的semantic预期与实际artifact；人工验收说明不注入模型，完整Rubric/语义Judge仍未集成。旧Gold与Rubric已原样归档。执行状态、评分状态和污染/基线资格分别记录；semantic/drafts/仍为设计证据。

历史Decision Harness、旧Intent Parser和分类Criteria Contract只从Git、ADR与历史日志追溯，不恢复旧源码目录、兼容命令或并行Evaluator。
