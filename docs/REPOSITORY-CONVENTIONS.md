# Repository Naming and Version Conventions

- Status: Accepted
- Document revision: 1.5
- Last updated: 2026-09-03
- Source of truth for: Git branch/tag、版本标识、目录、文件、Eval数据和文档命名
- Related ADRs: [ADR Index](decisions/README.md)
- Related documents: [Documentation Index](INDEX.md), [Agent Instructions](../AGENTS.md)

## 职责与边界

本文件是仓库命名与版本治理的唯一Source of Truth。`AGENTS.md`只保留必须遵守的摘要和本文件入口；`arch-guard`只保护架构、安全、状态权威和执行边界，不承载Git或文件命名规则。

命名治理不改变Accepted ADR的技术决策。历史ADR、Dev Log、Test Log、Git提交和已生成Artifact保留当时使用的名称，不为追求表面一致而重写历史。

## 版本轴

禁止使用没有所属对象的裸`vN`描述“当前系统”，也不再使用`Restaurant vN`作为产品、架构、分支、State、Prompt和Eval的总版本。每个版本必须说明自己属于哪个对象。

| 对象 | 规范标识 | 何时变化 | 不用于 |
|---|---|---|---|
| 产品发布 | `praxis-v0.2.0` | 形成经过验证、可交付的产品Release | 普通开发分支、ADR迭代 |
| 架构决策 | `ADR-0013` | 接受或替代架构决策 | Schema、Prompt或Dataset版本 |
| 持久State | `restaurant-state@10` | 持久结构或语义不兼容变化 | 分支名、产品Release |
| Contract/Schema | `restaurant-semantic-proposal@3` | 机器契约不兼容变化 | Prompt实验、文档修订 |
| Prompt | `restaurant-semantic-prompt@8` | Prompt文本或行为口径变化 | State或Dataset版本 |
| Dataset | `restaurant-semantic-holdout@2` | Case集合或Gold语义变化 | Evaluator实现版本 |
| Evaluator/Scorer | `restaurant-semantic-scorer@3` | 评分语义或归因口径变化 | Dataset版本 |
| 文档 | `Document revision: 1.0` | 文档结构或说明显著变化 | 产品、架构或代码版本 |

机器字段已有更窄上下文时可以只保存数值，例如`schemaVersion: "3"`；状态摘要、PR、提交说明和文档正文必须写出所属对象。历史Artifact中的`v4`、`v5`等值保持不变，以免破坏审计链。

## Git分支与Tag

开发分支表达“正在完成的工作”，不承担版本归档职责：

```text
codex/adr-<number>-<slug>
codex/feat-<slug>
codex/fix-<slug>
codex/docs-<slug>
codex/chore-<slug>
```

示例：

```text
codex/adr-0010-restaurant-agent-loop
codex/fix-semantic-holdout-runner
codex/docs-repository-conventions
```

- 分支名使用小写ASCII kebab-case；除固定`codex/`前缀外不增加层级。
- 分支名不包含产品Release、State、Schema、Prompt、Dataset或Evaluator版本。
- 不兼容Schema或架构变化通过对应Schema常量、ADR和迁移说明表达，不为此创建`-vN`分支。
- 工作分支应在验证后进入`main`；`main`代表当前已验证集成线。只有真实并行维护的已发布Release才建立长期Release branch，Pilot前默认不建立。
- 历史检查点使用不可移动的annotated tag，例如`checkpoint/adr-0010`；产品交付使用`praxis-v<semver>`。Tag只能指向已验证提交。
- 旧`codex/restaurant-decision-v14`至`v17`分支是历史指针，不继续承载新工作，也不据此推导当前能力。

## Migration与开发数据重置

- 已进入`POSTGRES_MIGRATIONS`的Migration ID及其SQL语义不可原地修改。修复Schema必须追加新的Migration；即使当前只有本地开发库，也不得改写已经被其他开发环境应用的历史ID。
- `restaurant-state@7`、`restaurant-state@8`、`restaurant-state@9`与当前`restaurant-state@10`不兼容。它们只可能存在于Pilot前的本地开发数据中，绝不自动转换、重放或在应用启动时删除。
- 如需继续使用同一台本机开发数据库，先备份所需调试信息，再显式执行`PRAXIS_ALLOW_DEV_RESTAURANT_STATE_RESET=1 npm run reset:dev:restaurant-state`。该命令只接受localhost `DATABASE_URL`，且只删除schema version为`7`、`8`或`9`的`restaurant.booking` Task及其级联本地记录。
- 该重置命令不是迁移工具，不得用于Pilot、staging、production或任何含真实进行中Task的数据。出现这类数据时，必须先设计并接受专门的迁移/保留方案。

## 目录与文件

### 源码

- TypeScript目录和文件使用小写kebab-case；测试与实现同名并使用`.test.ts`。
- 文件名描述当前职责，不保留已被替代的架构角色；例如Action Validator不得继续命名为`decision-kernel.ts`。
- 不在源码目录名中写架构、分支、Prompt或Schema版本。
- 禁止空格、无扩展名、`final`、`new`、`latest`、`old`等相对状态词。

### Eval

Eval先按Domain，再按评测对象组织：

```text
src/eval/
├── restaurant/
│   ├── semantic/
│   │   ├── cases/
│   │   ├── drafts/
│   │   └── runners/
│   ├── agent-loop/
│   │   └── drafts/
│   └── search-fixture/
└── shared/
```

- 代码目录不带版本；Dataset与Evaluator版本写在Manifest或导出的版本常量中。
- 只有多个不可变Dataset必须同时存在时，才允许`datasets/<dataset-id>/v2/`。
- JSON必须是合法单一JSON文档，JSONL必须一行一个完整JSON值，YAML使用`.yaml`，Markdown使用`.md`。
- Case ID使用稳定的有界前缀，例如`SEM-REG-001`、`SEM-HOLD-001`、`AGENT-E2E-001`；cohort、session和turn分别存字段，不把全部语义编码进文件名。
- Eval材料必须标记为`current executable`、`frozen regression`、`superseded retrospective`或`draft / not integrated`。当前Runner输入放`cases/`；尚未接入Runner/Scorer的Plan、Case候选和Rubric放`drafts/`，不得混入默认命令。
- 历史Eval Plan、Annotation Guide、Golden/Regression Set、Manifest、评分口径和结果证据保留或归档；私有Clean Holdout原文只留在Git忽略的安全位置。已替代的可执行代码、兼容路径和重复测试由Git历史恢复，不为回顾目的与当前路径并存。

### 文档

- 根入口保留约定名：`README.md`、`AGENTS.md`、`docs/INDEX.md`、`docs/STATUS.md`、`docs/roadmap.md`。
- 当前产品、架构、Domain、Integration和Harness设计沿用大写kebab-case，例如`AGENT-ORCHESTRATION.md`。
- ADR使用四位编号加小写kebab-case，例如`0010-restaurant-agent-loop-action-validation.md`。
- Skill目录使用小写kebab-case，入口固定为`SKILL.md`。
- 文档页头使用`Document revision`，不使用容易被误解为产品版本的通用`Version`。
- Superseded文档不出现在当前阅读主链；需要高频追溯时移入Archive，否则由Git历史保留。
- `docs/brainstorming/`保留历史思考，`docs/history/`保留追加式实施与验证日志，`docs/superseded/`保留仍有Review价值但不再生效的Plan、Golden与设计；三者都不是当前能力Source of Truth。

## 命令

npm脚本按`动作:domain:对象:模式`命名：

```text
eval:restaurant:semantic:fixture
eval:restaurant:semantic:holdout:preflight
eval:restaurant:search:fixture
```

命令名不包含当前架构版本；历史命令只在历史日志中保留。

## 交付检查

创建分支、提交或交付前确认：

1. 分支名描述当前工作且不含混合版本；
2. 新文件无空格、有正确扩展名且职责与名称一致；
3. 每个版本号都能明确回答“谁的版本”；
4. 当前事实只在`STATUS.md`汇总，README和Roadmap不复制完整状态；
5. 历史ADR、日志和Artifact未被机械改写；
6. 本地commit、当前branch、tag和远端push结果分别如实报告。
