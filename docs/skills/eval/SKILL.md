---
name: praxis-eval
description: Praxis质量评估；衡量Intent、搜索、Agent轨迹、Outcome准确性、成本和安全回归。
---

# Praxis Eval

Eval评估模型和端到端质量，不替代功能测试。

Restaurant渐进决策的新一代评测计划见[Restaurant Progressive Decision Eval v2](../../harness/RESTAURANT-DECISION-EVAL-V2.md)。它以E1核心已明确、E2部分明确、E3高度开放三种初始确定性驱动同一多轮流程；底层按Preflight、状态提取、状态累积、Readiness、动作路由、澄清、候选检索、选择/多样性、Grounding、Journey和Operations分阶段归因，四张Scorecard只作为汇总。当前Dataset Contract、7个Golden Seed和S0 Preflight已实现，17个Turn均已标注并通过Strict Preflight；Eval-only Reducer与S1–S8 Scorer及18个S0–S8单点Mutation已可运行。版本化Model Contract已严格校验Proposal、限制一次Schema重试并对Provider失败fail closed；Episode Runner现已完成Fixture组装与受控DeepSeek Smoke入口，仍不得与现有单轮Intent分数混报。

## Current implementation

Restaurant Progressive Decision Golden Seed结构检查：

```bash
npm run eval:decision:preflight
npm run eval:decision:preflight:complete
npm run eval:decision:fixture
npm run eval:decision:model:fixture
```

第一个命令验证Seed结构与Fixture引用，当前返回`READY_FOR_EVALUATOR`。第二个命令是进入Reducer/Scorer前的严格门禁，当前也已通过；任一Turn仍为`PENDING_HUMAN_LABEL`时必须非零退出，不能用Pending数据运行真实模型。两个命令通过只允许开发Eval-only Reducer/Scorer，不是Progressive Decision真实模型质量Baseline。

第三个命令以Golden结构化输出驱动Eval-only Reducer和S1–S8 Scorer，输出首错/Blocked归因与阶段计数。S6检查固定Eligible集合，S7检查只能从检索结果选择、数量和多样性，S8检查State/Candidate Fact引用、禁止声明和已标注的过敏确认披露。第四个命令用本地Golden Fixture Gateway完整驱动Runner；它证明Preflight、候选上下文交付、Model Contract、S6组装、评分和失败隔离的连通，不产生DeepSeek质量分数、Task Event或外部副作用。

Progressive Decision真实模型Smoke必须使用明确的付费开关，固定运行E1、E2、E3各一个完整Episode：

```bash
PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 npm run eval:decision:deepseek:smoke
```

如需一次性诊断当前全部Regression，应显式选择完整范围并将Case Limit固定为7：

```bash
PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_DECISION_EVAL_SCOPE=FULL_REGRESSION PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=7 npm run eval:decision:deepseek:smoke
```

Prompt v6 / Golden v0.8先修正Harness输入边界：命名目标的`BRAND`/`RESTAURANT`必须来自带时间戳的只读`FIXTURE_DISCOVERY`结果，候选不足必须来自`retrievalSummary`，Fact引用和过敏确认披露由可信Runner装配。Prompt v7保留这些边界，并修复`occasion: DATE`默认锚点：`DATE`仅限用户明确的浪漫约会/伴侣，`FRIENDS`、`FAMILY`和`TEAM`分别只对应朋友、家人/亲属和工作同事/团队/部门；`ASK_CORE_FIELD.DATE`只指日历日期。静态Prompt不再有缺失字段时的`occasion: DATE`示例，且没有加入Golden实体或样例答案。它们只模拟未来真实Discovery/Search的输入合同，不增加网络请求、不使用真实数据，也不使Fixture分数变成真实模型结果。2026-08-11的两次显式`FULL_REGRESSION`均使用v6覆盖7个Episode、17个Turn并记录0次Schema重试；最新一次由逐TurnArtifact定位4个完整通过Turn、10次S1、2次S2和1次S7首错。其具体差异显示命名目标、Grounding与候选充分性不再首错，但仍可能在上游状态错误后被Blocked；不得把Blocked误写成“已解决”。v7尚未发起付费模型运行；任何后续运行仍须明确授权，并继续按污染规则报告。

Prompt v8将可由固定参考时钟确定的相对时间收回Eval可信侧：`today`、`tomorrow`、`tonight`、`now`和`right now`只根据每个Episode的`referenceTime`与`Asia/Tokyo`归一，不读取机器当前时间、不访问网络。解析结果先进入模型输入State，再合并到评分用的有效Patch；诊断Artifact同时列出原始模型Patch、可信解析和有效Patch。`now/right now`保存为参考时刻的`APPROXIMATE`时间；相互冲突的相对表达或冲突Daypart保持未知，不猜测。这个严格小词表是当前Restaurant Eval切片，不是通用日期解析框架。2026-08-11经用户明确授权的v8 `FULL_REGRESSION`覆盖7个Episode、17个Turn，17次调用均完成且没有Schema retry；7个Turn无首错，剩余首错为7个S1与3个S4。它仍是`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`，不能被解读为质量提升或泛化证据。

Prompt v9 / Golden v0.9只处理地点策略表达和受控比较：`FLEXIBLE`可带`anchorQuery`表示“以某地为出发锚点且愿意移动”；无锚点`FLEXIBLE`仍然需要追问Location Strategy。S1/S2把同一query的`AREA`/`NEAR_PLACE`视为等价，并忽略泛化travel scope；`ADDRESS_OR_STREET`、不同query、`AREA`与`FLEXIBLE anchorQuery`仍严格区分。该规则不调用真实地图、不判断地名类型、不修改生产状态，也不放过漏写地点更新。v9已通过Typecheck、Strict Preflight、Fixture Oracle、Fixture Episode Runner、定向测试、完整`npm test`和build；尚未运行真实模型。

Prompt v10只收紧已暴露Regression上的状态抽取边界，不改变Golden、Schema或Scorer：`friends/family/team/department/date/partner`等社交语境只能设置`occasion`，不能推出`party`；`would be good/maybe/preferably/I like/nice to have/not too`等软偏好只能进入`positivePreferences`或`negativePreferences`，不得把`target: OPEN`提升成`CATEGORY`。这是Prompt规则修正，不是canonicalization放宽；v10尚未运行真实模型，任何后续付费运行仍属`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。

Prompt v11只收紧S4动作路由，不改变Golden、Schema或Scorer：`BRAND`目标不得走`CHECK_TARGET_RESTAURANT`，应走`RESOLVE_BRAND_OUTLET`或在Exact/Window时间、Exact人数和具体Outlet候选已齐时走`CHECK_AVAILABILITY`；`RESTAURANT`目标不得走`RESOLVE_BRAND_OUTLET`或`SHOW_RECOMMENDATIONS`，应继续`CHECK_TARGET_RESTAURANT`，即使候选上下文中有多个同名Outlet；`OPEN/CATEGORY`达到推荐条件时才走通用`SHOW_RECOMMENDATIONS`，可见选项反馈后走`NARROW_FROM_FEEDBACK`。`APPROXIMATE`时间或宽泛`DAYPART`不等于Exact Availability。v11本地Fixture已通过；2026-08-12经用户明确批准的真实模型Mock World FULL_REGRESSION累计运行10次，合计174次DeepSeek API请求、4次Schema retry、0次Provider failure、P0为空。10次矩阵显示DGS03-T02为10/10 `S3_READINESS`、DGS04-T03为10/10 `S1_STATE_EXTRACTION`、DGS06-T03为10/10 `S7_SELECTION_DIVERSITY`、DGS06-T04为10/10不通过但首错阶段不稳定（2次`S1`、7次`S7`、1次`S4`）、DGS07-T01为10/10不通过（9次`S3`、1次`S1`）；DGS05-T04、DGS06-T02和DGS07-T02各只有一次一次性问题，其中DGS07-T02是同Episode上游时间状态污染。因此v11的单次分数和“直接S4为0”不得作为稳定质量结论，只能作为已暴露Regression开发诊断，不是Baseline。

Prompt v12 / Schema 3不再要求模型决定Readiness、动作、候选数量或Grounding。模型只提交语义`statePatch`和可选的、已提供Candidate ID排序；Eval-only Decision Kernel probe从可信Fixture/Search结果、累计State和Candidate Fact确定这些稳定Policy输出。该探针是对Runtime边界的最小验证，不是新Workflow、Tool Loop或产品状态机；检索充分性与评分标签不进入模型Context。它减少了为修复S3/S4/S8而继续向Prompt注入Gold邻近规则的风险，但不改变“当前Regression已暴露、不能当Baseline”的污染状态。任何真实模型重跑仍须获得单独、明确的付费授权。

Prompt v13保持Schema 3不变，只修改State Patch语义Contract：可协商的餐厅属性才进入Preference；时间、人数、地点、移动意愿和Target进入各自字段；明确不可妥协的饮食、过敏、无障碍、环境或安全要求进入Hard Constraint；用户接受一个会话中提出的地点时必须更新Location。静态Prompt不得包含当前Regression实体或原句。v13尚未运行真实模型。

Prompt v14 / Proposal Schema 4 / Golden Schema 3将结构约束移入Restaurant-owned typed Contract：模型直接提出不可信`statePatch`，共享JSON Schema/Validator通过后Reducer才合并；Preference为`facet + value + polarity`，禁烟和严重过敏为判别联合类型。Kernel职责不变。不要为了新错误继续扩写Prompt，也不要无证据增加Semantic Proposal编译器、通用Ontology或Workflow层；先判断问题属于语义理解、Contract表达、确定性Policy还是Fixture/Search输入。Golden v0.10已完成破坏性迁移，不保留旧字符串数组兼容路径。v14尚未调用真实模型；任何真实运行仍需单独明确授权并只能作为已暴露Regression诊断。

当前S1/S2对显式批准的餐厅类别别名作语义等价：`western food`/`western`、`japanese food`/`japanese`以及`izakaya`的任意大小写。该规则只用于`CATEGORY`目标和`CUISINE`偏好比较；不改写Gold、模型原文、生产状态或模型输入。别名表以外的值继续严格失败，不能用模糊匹配掩盖语义错误。地点比较只限v9列出的结构化规则；店名与安全约束仍严格。

两个范围都只运行`REAL_MODEL_MOCK_WORLD`：候选仍为Golden Fixture，不访问真实Discovery或Availability。默认不输出或入库原始Prompt/Completion；但每次运行都会把仅限当前静态Regression Fixture的逐Turn诊断写入Git忽略的`.eval-artifacts/restaurant-decision/<timestamp>-<scope>.md`，并在标准输出给出路径。该文件只含Fixture用户文本、结构化Proposal、期望/实际Patch、两种状态差异、阶段结果和错误码；不含系统Prompt、自然语言Completion、API Key、普通Gateway遥测或生产用户数据。若数据集含非`REGRESSION` Episode，CLI会拒绝写该Artifact，防止泄露Holdout。仅为人工审阅原始Completion时，可以在同一条显式付费命令上加`PRAXIS_EVAL_SHOW_COMPLETIONS=1`；它只把每次Completion、回合、校验状态和错误打印到本次终端，绝不可用于真实用户输入。当前全部Golden Seed都是已暴露的Regression，因而任一范围都会标记`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`，所有数值只能用于开发诊断。2026-08-11的Prompt v5首次`FULL_REGRESSION`运行使7个Episode、17个Turn均完成评分；它暴露State/State Accumulation、品牌与单店目标区分、Grounding和不足候选解释问题。随后v6以相同完整范围运行，17次调用均成功、Runner记录0次Schema重试、P0为0，首错收敛到11次State与2次State Accumulation；这不能证明质量提升，因为同一集合已被查看和迭代。该次历史输出的`modelMetrics.retryCalls: 10`是将7个Episode误作17个Turn分母的报告缺陷；现已按预期主调用数修正，后续日志不应再显示这一伪重试。v1和两次v2 Smoke均成功连接Provider但各三个Episode都因`INVALID_MODEL_OUTPUT`停止；v3 Smoke的7个Turn均结构合规且无需重试，却全部首错于S1 State Patch；v4保持7个Turn结构合规且将S1提升至6/7通过，剩余首错为Grounding、Readiness和一个State Patch；v5删除静态Prompt中的Gold实体与样本事实后保持7个Turn结构合规，但S1为5/7通过，仍有Grounding、State与不足候选解释首错。该变化只说明固定样本对worked examples敏感，不能据此声称质量下降或泛化结论。任何再次付费运行须单独明确授权。真实模型Baseline、Live Read-only和Controlled Live-write必须分开报告。

当前已实现Restaurant单轮Intent离线Eval Harness：

```bash
npm run eval:intent:fixture
```

数据集位于`src/eval/restaurant-intent-eval-fixtures.ts`，输出包含字段准确率、阻塞字段漏检、不必要追问、无效输出和P0错误。该集合现在定义为`Single-turn Extraction Contract Set`；命令使用`FIXTURE` Oracle，仅验证数据集、Schema Validator和计分器连通，不评估低确定性需求、多轮偏好形成或推荐策略，也不得报告为DeepSeek或真实模型质量基线。

服务端DeepSeek Gateway、Provider Contract、Restaurant Intent Parser和受控真实模型Eval入口现已实现。2026-08-08已完成1条真实DeepSeek连通Smoke；它只证明Key、Gateway、Parser和Schema链路可用，不是质量Baseline。后续真实运行必须记录provider、model、promptVersion、输入快照版本、延迟、token、成本、Validator结果和P0错误。未配置Key时不得使用伪造模型输出来替代真实Eval。

现已实现`RestaurantIntentParser`和受控入口。先复制`.env.example`为Git忽略的`.env`，填写`DEEPSEEK_API_KEY`与`DEEPSEEK_MODEL`，再在明确的评估会话内将`PRAXIS_ALLOW_LIVE_MODEL_EVAL`改为`1`：

```bash
npm run eval:intent:deepseek
```

建议付费Smoke把`PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT`设为`1`，完成后将付费开关恢复为`0`。它复用同一单轮数据集并输出Provider/模型、Prompt/Schema版本、模型调用与重试数、延迟、Token、成本状态、Validator结果和P0错误。没有显式开关时必须在发起网络调用前退出；缺少价格配置时成本写为`NOT_CONFIGURED`，不得补猜。

Stage 2A新增本地Search Fixture Eval：

```bash
npm run eval:search:fixture
```

它通过同一Web应用编排检查完整英文Fixture请求、仅缺少阻塞字段的澄清，以及候选选择停在授权前。输出`mode: FIXTURE`；它不衡量DeepSeek、真实Discovery、实体合并、真实Availability或预约成功率。

## Progressive Decision v2协议

- 运行前先做S0 Preflight；Dataset、Fixture、配置或Scorer无效的Case退出语义分母，不能算成模型零分；
- 每Turn记录首错阶段、稳定错误码和Blocked下游；继续采集的下游结果只作为观察，不重复归因；
- 状态Patch与状态合并、候选检索与候选选择、过程Grounding与结果Grounding必须分开评分；
- 动作路由必须同时包含应触发和不应触发样本，报告Precision、Recall、F1与混淆矩阵，不用平均触发率代替正确性；
- 宽泛Daypart下可以展示来源返回的Slot，但不能宣称匹配用户未给出的确切用餐时间；此时属于`SHOW_RECOMMENDATIONS`，精确或有界时间窗口下的主动查询才标为`CHECK_AVAILABILITY`；
- 明确Brand/Restaurant允许先做Outlet Discovery，再询问人数和时间；Outlet Discovery与Availability Eligibility分开评分，检索前引用Fixture Outlet属于Process Grounding错误；
- “around HH:mm”保存为`APPROXIMATE` Preferred Time，不自动改成Exact或发明Window；
- 严格Eligible非空时不得放宽条件；严格结果为0时，Fallback每个选项只能放宽地点或品牌之一，保持时间与人数，并在用户明确选择前禁止修改Gold State；
- Fixture Oracle、Real Model Mock World和Live Read-only结果分开；Gold上游诊断重跑不得覆盖原Baseline；
- Scorer优先使用确定性规则，并以Perfect Oracle和单点Mutation验证。LLM Judge只有经人工标签校准后才能成为辅助指标，不能替代P0和确定性门禁。

## 数据集

- Intent Set：英文及混合表达的日期、时间、人数、区域、菜系、预算和限制。
- Search Set：带时间戳的来源与Availability快照。
- Agent Trace Set：用户Event、Tool Fixture、期望State和Forbidden Action。
- Browser Replay Set：脱敏DOM、截图、动作和Outcome。
- Bad-case Set：真实Pilot失败轨迹经审核后加入。

## 指标

### Intent

- 字段Exact/Normalized Accuracy；
- 阻塞字段漏检率；
- 不必要追问率；
- 相对时间和Tokyo时区准确率。

### Search

- Entity Resolution Precision/Recall；
- Top 3硬约束满足率；
- Executable Candidate Precision；
- Availability Freshness；
- Time to First/Three Candidate；
- Source失败下的Recall。

### Agent与执行

- 任务完成率；
- 用户额外交互次数；
- Tool/Model步数、延迟和成本；
- Takeover触发与恢复率；
- Outcome Unknown率；
- Forbidden Action和重复提交次数。

### Outcome

- Verified Precision优先于Recall；
- False Success必须为0；
- Pending/Unknown分类准确率；
- 外部状态与数据库状态一致性。

## Prompt/模型变更

任何promptVersion、模型名、Thinking模式、Tool Schema、Context交付或解析逻辑变化必须回放同一版本的固定数据集与Evaluator，并按阶段、首错分布和Scorecard比较。不得只凭几个手工例子上线，也不得把不同Dataset/Evaluator版本的分数直接视为趋势。

### 防泄漏规则

- Regression可用于定位失败和日常Prompt迭代；一旦样本、Gold、验证错误、Completion或分数被用于调优，它只能作为`DEVELOPMENT_DIAGNOSTIC`报告。
- Holdout在Prompt冻结前不得向调参者暴露用户文本、实体/候选Fact、Gold、错误或结果；任何暴露立即标记`PROMPT_EXPOSED`或`RESULT_EXPOSED`并降级为Regression，不能靠重跑恢复独立性。
- Prompt示例只用抽象、非测试集的规则和Schema示例；运行时Candidate Context只给允许的只读输入，不得携带Gold、允许选择或评分提示。
- 真实模型报告必须输出`cohort`、`contaminationStatus`和`baselineEligible`。只有`CLEAN_HOLDOUT`支持独立Baseline结论；完整协议见[Eval v2 §16.1](../../harness/RESTAURANT-DECISION-EVAL-V2.md#161-防止测试集泄露答题作弊和过拟合)。

## 评估输出

记录Dataset/Evaluator/Reducer/Prompt/Schema/Fixture版本、样本数、运行模式、Preflight排除、首错分布、Blocked下游、Raw/Controllable/Appropriate Intermediate结果、指标变化、P0安全错误、代表性坏Case和是否允许发布。原始敏感Prompt/Response默认不入库。
