# Restaurant Progressive Decision Eval v2

- Status: Draft
- Version: 3.0
- Last updated: 2026-08-13
- Source of truth for: Restaurant低确定性需求、多轮偏好形成、推荐收敛的Eval计划、数据规则、评分与发布门槛
- Related ADRs: [ADR-0002](../decisions/0002-deepseek-model-runtime.md), [ADR-0006](../decisions/0006-web-first-agent-workspace.md), [ADR-0007](../decisions/0007-semantic-proposal-compiler-and-decision-kernel.md)
- Related documents: [MVP PRD](../product/MVP-PRD.md), [Restaurant Domain](../domains/RESTAURANT-BOOKING.md), [Eval Skill](../skills/eval/SKILL.md), [Harness Design](HARNESS-DESIGN.md), [Golden Seed Annotation](RESTAURANT-DECISION-GOLDEN-SEED-ANNOTATION.md), [Roadmap](../roadmap.md)

## 1. 结论与边界

Restaurant需求不是一次性完成的Slot Filling。用户通常先确定“要吃饭”以及部分时间、人数或场景，再通过少量追问和有差异的推荐形成菜系、地点、氛围、预算与排除项，最后才收敛到可查空位和可预约条件。

Eval v2评估的是这一渐进决策能力，不把“第一句话是否包含全部字段”当作主要质量标准。评估单元不是一个不可解释的端到端总分，而是`输入理解 → 状态累积 → Readiness → 下一步路由 → 澄清 → 候选检索 → 选择与多样性 → Grounding → Journey`的因果链；每个失败必须定位到首个可控环节。

本计划只定义Harness、数据和评分，不修改当前Web、Task Runtime、Restaurant State、生产Parser、Search或预约路径。Eval v2实现结果必须标记为`HARNESS_ONLY`；通过不能报告为产品已具备多轮决策能力。

当前8条`restaurant-intent-eval-v1`保留并改称`Single-turn Extraction Contract Set`，只验证结构、明确字段、Tokyo相对日期和当前Parser回归。2026-08-08运行的1条真实样本只算`REAL_MODEL CONNECTIVITY SMOKE`，不算Eval v2基线。

Implementation status（2026-08-11）：Dataset/Fixture/Annotation Contract、7个Golden Seed Episode、7个Candidate Pool、S0 Dataset Preflight和CLI已实现；17个Turn均已完成人工Gold，Draft与严格Preflight均为`READY_FOR_EVALUATOR`。Eval-only Decision State Reducer及S1–S8确定性Scorer、首错/Blocked归因、Fixture Oracle CLI和18个S0–S8单点Mutation已实现并通过；当前Fixture含29个候选和417个Fact Ref。S6按固定Eligible集合检查检索，S7检查只能从已检索集合选择、数量和所需差异并识别Fixture多样性缺口，S8检查State/Candidate Fact引用、禁止声明及严重过敏卡片的“仍需餐厅确认”结构化披露。Harness-only Model Contract已提供版本化Prompt、严格JSON验证、一次Schema重试和Provider失败分离；完整Episode Runner现已实现，逐Turn将明确的Golden Fixture候选上下文、Proposal、S6 Fixture结果和S1–S8 Scorer组装，且不保存原始Prompt/Completion。仅在显式诊断开关下，这组静态虚构Golden Fixture的Completion可随本次终端输出供人工审阅，绝不进入普通遥测、数据库或文件。Runner的Golden Fixture路径已通过；前三次DeepSeek Smoke（Prompt v1和两次v2）均因`INVALID_MODEL_OUTPUT`停止；Prompt v3已使7个Turn全部进入评分、没有Schema Retry，但均首错于S1；Prompt v4将S1提升为6/7通过，仍有5个Turn首错于缺Grounding；Prompt v5移除静态Prompt中的Gold实体、地点、菜系与反馈示例，7个Turn仍全部结构合规且无Schema Retry，但S1为5/7通过，首错为两处State、一次State Accumulation、三次Grounding与一次不足候选解释。固定Smoke的`DGS01/DGS03/DGS05`及其结果已用于迭代Prompt v1–v5，当前CLI会标记为`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`；所有既有Smoke仅是开发诊断，不可报告为语义基线或版本趋势。Scorecard聚合和真实模型Baseline尚未实现。

2026-08-11首次`FULL_REGRESSION`真实模型诊断通过显式范围运行了当前全部7个Episode、17个Turn，全部达到`SCORED`。它暴露的可调问题包括State/State Accumulation、品牌与单店目标区分、Grounding和不足候选解释；当前所有Seed和结果均已暴露，故运行仍严格属于`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`，不能报告为Baseline或版本趋势。

Golden v0.8 / Prompt v6在Harness内把三类事实从模型输出移走：命名目标的`BRAND`/`RESTAURANT`只能来自带时间戳的`FIXTURE_DISCOVERY`解析结果；候选不足只能来自确定性的`retrievalSummary`；候选Fact引用与过敏确认披露由Runner在模型选择候选后装配。S1也改为比较Patch的状态效果，允许无害的重复写入但仍拒绝改变最终状态的提取错误。这个最小切片不接真实Discovery或Task Runtime；其Fixture验收是Preflight、Fixture Runner和Mutation保持可运行，而不是声称解决了真实搜索质量。

2026-08-11的Prompt v6 `FULL_REGRESSION`真实模型诊断在显式付费开关下覆盖7个Episode、17个Turn：17次调用均成功，Runner记录0次Schema重试，P0为0；S1为6 Pass / 11 Fail，S2为4 Pass / 2 Fail / 11 Blocked，首错仅为11次State与2次State Accumulation。命名目标、Grounding和候选充分性不再是首错，说明Fixture Tool输入边界按预期抵消了相应的工程归因；它不证明真实Discovery质量或模型泛化。通用`modelMetrics.retryCalls: 10`来自将7个Episode作为17个Turn的分母，属于报告缺陷而非真实重试，必须在下一次运行前修正。

为使首错可审阅而不仅是一个阶段计数，真实Eval CLI现在对当前静态、已暴露的Regression Seed在本机Git忽略的`.eval-artifacts/restaurant-decision/`落一个Markdown Artifact。每个Turn记录Fixture用户文本、候选上下文ID、期望/实际结构化Proposal、在同一Gold前序状态上的Patch效果差异、Gold/模型累计状态差异和全部S1–S8结果；它不记录System Prompt、自然语言Completion、Secret或生产用户数据。若Dataset含非`REGRESSION` Episode，CLI拒绝写出该Artifact，避免Holdout在调优前泄漏。`retryCalls`现按预期主调用数（本评测为Turn数）计数，历史v6的10只是已修正的报告错误。

v6 `FULL_REGRESSION` Artifact记录4个完整通过Turn（DGS05全部四回合）与13个首错：10个S1、2个S2、1个S7。它将DGS03-T02和DGS04-T02证明为上游S1后的累计状态偏差，而不是本Turn的Patch错误；DGS02则在State通过后独立暴露`RECOMMENDATION_MISSING`。随后已确认的餐厅类别Canonicalization只接受`western food`/`western`、`japanese food`/`japanese`与`izakaya`的大小写；v9又单独加入有限地点Canonicalization。二者都只作用于S1/S2语义比较，店名、安全约束和其他自由文本仍严格。其余差异仍是待处理的真实语义错误，不得用模糊匹配掩盖。

Prompt v7单独处理已暴露的Occasion错误：保留现有`SOLO | DATE | FRIENDS | FAMILY | TEAM | OTHER` Schema，不扩展生产状态；删除抽象缺字段示例中的`occasion: DATE`，并规定`DATE`只表示明确的浪漫约会/伴侣，`FRIENDS`、`FAMILY`和`TEAM`只表示用户明确的朋友、家人/亲属和工作同事/团队/部门。`ASK_CORE_FIELD.DATE`仍只表示日历日期；晚餐、日历日期、时段或未知社交情境均不得补猜`occasion`。静态规则没有加入任何Golden实体、地点、菜系、候选或话术。它尚未在真实模型上运行，且必须继续作为污染Regression的开发诊断，不能作为Baseline或泛化证据。

Prompt v8 / Runner v3将固定参考时钟可确定的相对时间转为Eval可信输入，而非模型状态提取任务。当前仅识别英文`today`、`tomorrow`、`tonight`、`now`和`right now`，并使用每个Episode的`referenceTime`在`Asia/Tokyo`中得到日期；`tonight`和显式`evening/night/dinner`得到`DAYPART/DINNER`，`now/right now`得到该参考时刻的`APPROXIMATE`时间。若同句存在互斥日锚点或互斥Daypart，解析器不产出事实。Runner在调用前把可信时间写入模型累计State，并把它与模型Patch组合后再评分；诊断保留原始模型Patch、可信解析和有效Patch三者。此机制不读取真实时钟、不修改Golden、生产State或Runtime，也不证明模型泛化。

Prompt v9 / Golden v0.9处理地点策略表示和有限比较：`FLEXIBLE`现在可带`anchorQuery`，用于表达“以某地为出发锚点且愿意移动”；无`anchorQuery`的`FLEXIBLE`仍只表示愿意出行，不满足推荐所需的可执行Location Strategy。S1/S2只把同一query的`AREA`与`NEAR_PLACE`视为等价，并做大小写/空白归一；`ADDRESS_OR_STREET`、不同query、`AREA`与`FLEXIBLE anchorQuery`仍严格区分。泛化`willing to travel`类scope由`FLEXIBLE`本身表达；`scope: "from/around X..."`仅作为旧结构兼容归入`anchorQuery`。该规则不调用地图、不判断真实行政区/车站/地标，也不掩盖漏写地点更新。

Prompt v10不改变Golden、Schema或Scorer，只修正两类已暴露的状态抽取边界：社交用餐词只表示`occasion`，除非用户给出明确数字或范围，否则不得设置`party`；“would be good / maybe / preferably / I like / nice to have / not too”等软偏好只进入偏好数组，不能把开放目标提升成`CATEGORY`。这两类错误继续归因到S1 State Extraction，不通过canonicalization放宽。

Prompt v11不改变Golden、Schema或Scorer，只修正S4动作路由边界：`BRAND`目标先走品牌分店解析，或在Exact/Window时间、Exact人数和具体Outlet候选已齐时查Availability，不走`CHECK_TARGET_RESTAURANT`；`RESTAURANT`目标继续走目标餐厅检查，不走品牌解析或通用推荐，即使候选上下文中已有多个Outlet；`OPEN/CATEGORY`才使用通用推荐流；可见选项反馈后使用`NARROW_FROM_FEEDBACK`。`APPROXIMATE`时间与宽泛`DAYPART`不得被当成Exact Availability。

Prompt v14 / Proposal Schema 4 / Golden Schema 3把State Patch约束拆成清晰的Contract边界，而不增加新的编排层。模型仍直接输出不可信的Restaurant-owned typed `statePatch`；共享Contract模块提供机器可读JSON Schema、运行时Validator与语义Key，Reducer只有在校验通过后才合并。偏好不再是两个自由字符串数组，而是`facet + value + polarity`；禁烟和严重过敏采用封闭的Typed Hard Constraint。这样，`no smoking`是否属于硬约束、`nothing too formal`的canonical值以及移动意愿不能进入Preference，主要由输出类型和Validator约束，不再继续堆进Prompt。Prompt v14仅保留语义职责、关键边界和一个最小JSON示例；Kernel继续独立负责Readiness、路由、候选上限与Grounding。这仍是Harness-only v14实现。ADR-0007随后接受Restaurant-owned Semantic Proposal与Semantic Compiler作为v15产品主链；本Eval不实现该产品路径，也不引入通用Ontology、跨Domain Compiler、Workflow DSL或DeepSeek Beta Strict Function Calling。

## 2. 评测目标

Eval v2回答以下问题：

1. 模型能否准确提取用户明确表达的事实，而不补猜未知信息？
2. 模型能否在多轮中保留已知事实，并正确应用新增、否定与修正？
3. 模型能否根据当前确定性选择合适的下一步：直接推进、最小追问、给探索性推荐或收敛搜索？
4. 推荐集合能否在满足核心条件的前提下提供有意义的差异，而不是同质列表？
5. 用户对推荐作出反馈后，下一轮能否吸收偏好和排除项并缩小范围？
6. 模型能否避免过早声称“可订”、过早进入预约，或把Conversation变成权威Task State？
7. Prompt、模型或Eval逻辑变化时，质量、延迟、Token与成本如何变化？
8. 失败首先发生在哪个环节，属于Dataset、Harness、Provider、模型、状态合并、检索还是推荐表达？
9. 在提供Gold上游输入的诊断运行中，下游环节本身是否仍然失败？

## 3. 非目标

- 不评估真实Google Places、Availability或Booking Adapter质量；
- 不证明当前Web已支持渐进决策；
- 不用第二个LLM作为主评分器；
- 不用单一端到端总分替代分阶段结果和根因归属；
- 不按话术Exact Match评分；
- 不要求用户先确定菜系、预算或氛围才允许推荐；
- 不产生Task Event、Authorization、Attempt、外部写入或预约；
- 不以更多数据量替代人工标注质量和覆盖矩阵。

## 4. 初始确定性等级

三类场景使用同一Runner、Schema和评分器，只按初始信息量分组报告。

### E1 — Core-ready

用户已给出足以开始推荐的核心信息。示例：

- “Tomorrow evening, four people, Western food near Ginza.”
- “Tomorrow at 7, six people, McDonald's around Kinshicho.”
- “Dinner for two at Restaurant A in Marunouchi tomorrow.”

正确行为：不重复追问已知信息；按目标粒度直接推荐、定位分店或检查目标餐厅。若只达到推荐门槛而未达到空位门槛，不得声称已验证空位。

### E2 — Partial

用户给出部分核心信息，其余为空。示例：“今晚部门聚餐，找个居酒屋。”

正确行为：保留已知的日期/时段、场景和菜系；优先补人数和地点策略等核心缺口；达到推荐门槛后停止表单式盘问，给3–5个有差异的合格选项；根据反馈收敛。

### E3 — Open-ended

用户只表达宽泛目标或场景。示例：“帮我找家餐厅”“约会吃饭”“明天和朋友聚会”。

正确行为：按信息价值逐步补核心信息，不在没有最小搜索上下文时随机报餐厅；达到推荐门槛后进入与E2相同的推荐和反馈收敛流程。E3是E2缺失信息更多的同一流程，不是独立产品模式。

## 5. 目标粒度

每个Episode标记`targetKind`，不能用同一推荐规则处理：

| targetKind | 示例 | 合理下一步 |
|---|---|---|
| `OPEN` | “找家餐厅” | 核心信息完整后给多样化推荐 |
| `CATEGORY` | 西餐、中餐、居酒屋 | 在类别内按价格、氛围、位置或风格形成差异 |
| `BRAND` | 麦当劳、鼎泰丰 | 确定合适分店；严格结果非空时不推荐其他品牌；严格结果为0时只在用户同意后单独放宽距离或品牌 |
| `RESTAURANT` | 明确餐厅A | 消除同名店/分店歧义并检查目标；不为凑数量推荐其他餐厅 |

## 6. 核心决策状态

Eval Oracle使用语义状态，不要求生产代码采用相同Schema。

```ts
type DecisionState = {
  occasion?: "SOLO" | "DATE" | "FRIENDS" | "FAMILY" | "TEAM" | "OTHER";
  time?: {
    date?: string;
    precision: "UNKNOWN" | "DAY" | "DAYPART" | "APPROXIMATE" | "WINDOW" | "EXACT";
    daypart?: "BREAKFAST" | "LUNCH" | "AFTERNOON" | "DINNER" | "LATE_NIGHT";
    preferred?: string;
    earliest?: string;
    latest?: string;
  };
  party?: {
    min: number;
    max: number;
    precision: "EXACT" | "RANGE";
  };
  location?:
    | { kind: "AREA"; query: string }
    | { kind: "NEAR_PLACE"; query: string }
    | { kind: "ADDRESS_OR_STREET"; query: string }
    | { kind: "FLEXIBLE"; anchorQuery?: string; scope?: string }
    | { kind: "UNKNOWN" };
  target:
    | { kind: "OPEN" }
    | { kind: "CATEGORY"; query: string }
    | { kind: "BRAND"; query: string }
    | { kind: "RESTAURANT"; query: string; outletQuery?: string };
  preferences: Array<
    | { facet: "CUISINE"; value: string; polarity: "PREFER" | "AVOID" }
    | { facet: "VIBE"; value: "QUIET" | "INTIMATE"; polarity: "PREFER" | "AVOID" }
    | { facet: "MENU_FORMAT"; value: "TASTING_MENU"; polarity: "PREFER" | "AVOID" }
    | { facet: "FORMALITY"; value: "FORMAL"; polarity: "PREFER" | "AVOID" }
  >;
  hardConstraints: Array<
    | { kind: "SMOKING_POLICY"; value: "FULLY_NON_SMOKING" }
    | { kind: "ALLERGY"; allergen: string; severity: "SEVERE" }
  >;
};
```

标注原则：

- 未表达的信息保持未知，不从常识、场景或候选文本补猜；
- “明天晚上”保存为日期 + `DAYPART/DINNER`，不伪造19:00；
- “和朋友吃晚饭”可保存为无日期的`DAYPART/DINNER`，日期仍保持未知并应被追问；`DAY / APPROXIMATE / WINDOW / EXACT`仍必须带日期；
- “around 7:30pm”保存为`APPROXIMATE`和Preferred Time 19:30，不静默编译为Exact，也不发明19:00–20:00等有界Window；
- “6–8人”保存Range，推荐筛选可用8人作为容量上限，但不能伪造最终预约人数；
- “餐厅好就愿意过去”记录为`FLEXIBLE`意向，但若没有出发点、区域或其他地理锚点，仍是缺少可执行Location Strategy，必须追问；“从Ueno出发，也可以跑远”记录为`FLEXIBLE`并带`anchorQuery: "Ueno"`，不降级成普通`AREA`；
- 可协商餐厅属性进入Typed Preference；不受支持的Facet不能以自由字符串混入State；
- “不想吃辣”若未来进入本Contract，应作为负向偏好/推荐排除，不自动升级为过敏；当前最小Facet词表尚未纳入辣度，不允许模型临时发明类型；
- “严重花生过敏”是条件触发的安全核心字段：未表达时不应阻塞初步推荐，一经表达即为Hard Constraint，不可被推荐多样性覆盖；
- 对已声明过敏，S6–S8必须区分“未提供信息”“可接受请求”“来源说明有处理流程”和“明确不支持”；只有明确不支持才直接排除，其他状态必须在卡片中如实说明仍需餐厅确认，不得给出安全保证。详细产品规则以[Restaurant Booking Domain](../domains/RESTAURANT-BOOKING.md#过敏与特殊要求)为准；预约前Consent Card不属于当前Harness-only Eval v2的外部执行范围；
- 用户明确修正时覆盖旧值；普通新增信息不删除未被否定的旧事实。

## 7. Readiness规则

Readiness由确定性规则评分，不由模型自由定义。

### Eval-only Decision Kernel probe

2026-08-12的最小探针把已归一的累计State、可信的Fixture/Search结果和候选Fact交给确定性Decision Kernel。它负责Readiness、下一步动作、核心澄清Topic、候选展示上限和结构化Grounding；模型只提出语义`statePatch`，并可在已提供的Candidate ID中给出排序意图。该探针不调用工具、不创建Task Event，也不是产品Task Runtime或可配置Workflow。Fixture/Search结果只进入Kernel，不能作为Gold标签、允许动作或评分提示交给模型。

### `RECOMMENDATION_READY`

同时满足：

- 已知日期或明确的用餐日；
- 已知Daypart、时间窗口或精确时间；
- Party为Exact或有界Range；
- Location为明确的区域、地点/地址，或带地理锚点的`FLEXIBLE`策略；只有“愿意出行”而没有出发点/区域仍不满足本条件；
- 对明确`BRAND`或`RESTAURANT`，已解析出的有限Outlet集合可以替代用户预先给出Location；
- 不要求Cuisine、Budget或Vibe已知。

### `AVAILABILITY_READY`

同时满足：

- 具体日期；
- 有界时间窗口或精确时间；
- 确切Party Size；
- 有可查询的地理范围，或已有明确Restaurant/Outlet集合；
- 所有已表达Hard Constraint可传入下游筛选。

### `BOOKING_READY`

同时满足：

- 用户已选择具体Outlet和Offer；
- 日期、时间、人数、价格和关键条款已明确；
- Offer仍有效；
- 已有与该Offer严格绑定的有效Authorization。

Eval v2主要覆盖到推荐和偏好收敛。任何Harness-only模型输出都不能创建Authorization或进入外部执行。

## 8. 下一步动作集合

每Turn的Gold不是一句固定回复，而是允许动作集合：

```ts
type ProposedNextAction =
  | { type: "ASK_CORE_FIELD"; topics: Array<"DATE" | "TIME" | "PARTY" | "LOCATION_STRATEGY"> }
  | { type: "SHOW_RECOMMENDATIONS" }
  | { type: "RESOLVE_BRAND_OUTLET" }
  | { type: "CHECK_TARGET_RESTAURANT" }
  | { type: "NARROW_FROM_FEEDBACK" }
  | { type: "CHECK_AVAILABILITY" }
  | { type: "PROPOSE_CONSTRAINT_RELAXATION" }
  | { type: "REQUEST_FINAL_BOOKING_DETAIL" }
  | { type: "STOP_OR_SAVE" };
```

规则：

- `acceptableNextActions`可以包含多个同样合理的动作；
- E2/E3每轮最多询问2个紧密相关的核心Topic；
- 已明确字段不得重复追问，除非用户给出冲突或值不足以进入下一Readiness；
- 达到`RECOMMENDATION_READY`后，不得为了补Cuisine/Budget/Vibe继续表单式追问；
- 当`FLEXIBLE`只表达愿意出行、没有地理锚点时，仍应追问一次Location Strategy；这不是在核心字段已充分后继续表单式追问；
- 未达到`RECOMMENDATION_READY`时，不得随机输出具体餐厅；
- `BRAND`和`RESTAURANT`场景不应用通用3–5家多样性要求；
- 用户给出明确Brand或Restaurant时，可以先执行Outlet Discovery，再基于实际发现的位置询问人数和时间；不得要求用户在检索前知道分店，也不得把Candidate Pool的Oracle事实提前泄漏给模型；
- Outlet Discovery只证明目标解析到了哪些分店，不证明这些分店满足人数、时间或Availability；Availability Eligibility必须在相关条件到齐后单独评分；
- `DAYPART`只表示宽泛用餐时段。推荐卡可以展示Fixture或来源实际返回的Slot，帮助用户选择时间，但不得声称某个Slot“符合用户的确切用餐时间”；
- `CHECK_AVAILABILITY`动作保留给用户已给出Exact或有界Window、达到`AVAILABILITY_READY`后的精确匹配检查。宽泛Daypart下展示已有Slot仍属于`SHOW_RECOMMENDATIONS`；
- 只有原始时间、人数、地点和Target全部严格匹配的Eligible集合为0时，才允许`PROPOSE_CONSTRAINT_RELAXATION`；
- Fallback每个选项只能放宽一个条件：扩大地点时保持时间、人数和品牌；改为同类型餐厅时保持时间、人数和地点。不得同时放宽地点和品牌，也不得默认放宽时间或人数；
- Fallback必须先展示实际找到的候选并要求用户明确选择；选择前不得修改Decision State，也不得把Fallback候选计入严格Eligible集合；
- 严格候选非空时触发Fallback属于动作路由错误；Fallback候选不存在、容量或Exact Time不匹配时不得虚构选项；
- 未达到`AVAILABILITY_READY`时，不得声称已查到对应人数/时段的真实空位；
- 无论何时都不得提议未经用户选择和授权的Booking Commit。

## 9. 分阶段因果链与故障归因

四张产品Scorecard是汇总视图，不是最小评估单元。每个Turn按以下阶段产生独立结果：

| Stage | 独立问题 | 主要评分方式 | 默认故障归属 |
|---|---|---|---|
| `S0 PREFLIGHT` | Dataset、版本、配置、Fixture和Scorer是否可运行 | 静态断言 | Dataset / Harness / Config |
| `S1 STATE_EXTRACTION` | 本轮明确事实、否定和修正是否提取正确 | 结构化Precision / Recall / F1 | Model / Prompt / Parser Contract |
| `S2 STATE_ACCUMULATION` | Patch是否按规则保留、覆盖和解决冲突 | 确定性Reducer测试 | Eval-only State Reducer |
| `S3 READINESS` | 当前应为NOT、RECOMMENDATION还是AVAILABILITY READY | 确定性Gold比较 | Eval-only Decision Kernel |
| `S4 ACTION_ROUTING` | 应追问、推荐、定位分店、查目标还是查空位 | Trigger Precision / Recall / F1 | Eval-only Decision Kernel |
| `S5 CLARIFICATION` | 问哪些Topic、是否重复、是否一次问太多 | 结构化规则 | Dialogue Policy |
| `S6 CANDIDATE_RETRIEVAL` | 固定池中是否找到满足硬约束的候选 | Candidate Precision / Recall | Fixture Retriever / Search Contract |
| `S7 SELECTION_DIVERSITY` | 是否从合格池选出适量、有差异且吸收反馈的集合 | Oracle规则 | Model ranking intent / Decision Kernel |
| `S8 RESPONSE_GROUNDING` | 决策过程和候选陈述是否有状态及Fixture依据 | 结构化引用 + 人工抽检 | Eval-only Decision Kernel |
| `S9 JOURNEY_OUTCOME` | 多轮是否正确收敛且没有过度追问或过早行动 | Episode规则 | Integrated Journey |
| `S10 OPERATIONS` | 调用、延迟、Token、成本、重试和Provider错误 | Telemetry | Provider / Runtime |

### 归因规则

- 每个Turn记录`firstFailureStage`、`rootCauseCode`、`blockedBy`和全部阶段观察值；
- 首个失败后的结果可以继续采集为`DOWNSTREAM_OBSERVATION`，但不能再次计为独立根因；
- Dataset、配置或Harness Preflight失败时，该Case标为`INVALID_EVAL_CASE`并退出语义指标分母；
- Provider失败和结构无效分别报告，不以零分伪装成模型语义错误；
- `ASK_CORE_FIELD`在Gold要求追问时是`APPROPRIATE_INTERMEDIATE_SUCCESS`，不是Journey未完成；
- Gold确认固定候选池确实无合格项时，透明返回不足不是Retrieval失败；Fixture未提供本应存在的合格候选则是`FIXTURE_COVERAGE_GAP`；
- 默认Baseline每Turn只调用一次模型。需要定位下游能力时，可在失败样本上启用`DIAGNOSTIC_GOLD_UPSTREAM`，用Gold状态或Gold候选池重跑目标阶段；诊断结果必须与Baseline分开报告，不得替换原始失败。

标准错误码至少包括：

```text
DATASET_INVALID
CONFIG_DISABLED
HARNESS_ERROR
PROVIDER_FAILURE
INVALID_OUTPUT
STATE_EXTRACTION_ERROR
STATE_MERGE_ERROR
READINESS_ERROR
ACTION_ROUTING_ERROR
CLARIFICATION_ERROR
FIXTURE_COVERAGE_GAP
CANDIDATE_RETRIEVAL_ERROR
SELECTION_DIVERSITY_ERROR
PROCESS_GROUNDING_ERROR
RESULT_GROUNDING_ERROR
JOURNEY_CONVERGENCE_ERROR
```

### Mock、Real Model与Live边界

- `FIXTURE_ORACLE`：固定模型输出和候选池，验证Dataset、Reducer、Scorer与错误归因；
- `REAL_MODEL_MOCK_WORLD`：真实DeepSeek生成State Patch、Action与推荐选择，候选及Availability仍为Fixture；只评估模型决策，不评估真实平台；
- `LIVE_READONLY_SOURCE`：真实Discovery或Availability的连接、覆盖、时效与数据质量；不与模型决策分数混报；
- `CONTROLLED_LIVE_WRITE`：不属于Eval v2，且没有有效Authorization时禁止运行。

## 10. Episode数据格式

实现时使用版本化、可静态校验的数据结构：

```ts
type DecisionEvalEpisode = {
  schemaVersion: "3";
  datasetVersion: string;
  id: string;
  split: "REGRESSION" | "HOLDOUT";
  initialClarity: "E1" | "E2" | "E3";
  targetKind: "OPEN" | "CATEGORY" | "BRAND" | "RESTAURANT";
  referenceTime: string;
  timezone: "Asia/Tokyo";
  tags: string[];
  candidatePoolRef?: string;
  initialState: DecisionState;
  turns: Array<{
    id: string;
    userMessage: string;
    // 引用本轮前用户已经看到的Fixture候选；不是本轮检索Gold。
    visibleOptionIds?: string[];
    expected:
      | {
          annotationStatus: "PENDING_HUMAN_LABEL";
          annotationFocus: string[];
        }
      | {
          annotationStatus: "LABELED";
          statePatch: unknown;
          accumulatedState: DecisionState;
          readiness: "NOT_READY" | "RECOMMENDATION_READY" | "AVAILABILITY_READY";
          acceptableNextActions: ProposedNextAction[];
          forbiddenActionTypes: string[];
          clarification?: {
            allowedTopics: string[];
            maxTopics: 1 | 2;
            mustNotAsk: string[];
          };
          retrieval?: {
            eligibleCandidateIds: string[];
            allowEmpty: boolean;
            minimumExpected: number;
          };
          recommendation?: RecommendationOracle;
          outletDiscovery?: {
            candidateIds: string[];
          };
          constraintRelaxation?: {
            options: Array<{
              type: "EXPAND_LOCATION" | "RELAX_BRAND_TO_CATEGORY";
              candidateIds: string[];
            }>;
            requiresUserChoice: true;
          };
          grounding?: {
            allowedStateFactRefs: string[];
            allowedCandidateFactRefs: string[];
            forbiddenClaims: string[];
            requiredCandidateDisclosures?: Array<{
              candidateId: string;
              type: "ALLERGY_CONFIRMATION_REQUIRED";
              factRef: string;
            }>;
          };
        };
  }>;
};
```

`visibleOptionIds`引用Candidate Fixture中的脱敏事实。`outletDiscovery`记录目标解析后的分店集合，不等于Availability Eligible集合；只有工具检索完成后，这些Outlet事实才可进入模型Context。S6从`candidatePoolRef`指向的固定池检索，S7只能从S6返回的候选中选择；模型看不到Gold Oracle。模型若在检索前引用Candidate Pool事实，或引用未提供的空位、价格、地点或评价，按Process Grounding错误计分。`requiredCandidateDisclosures`只用于已经人工确认的用户卡片安全提示：当前`ALLERGY_CONFIRMATION_REQUIRED`必须引用同一候选的`attributes` Fact，并要求卡片说明餐厅仍需确认；它不是生产Consent Card或外部披露命令。Seed阶段允许Pending分支；进入Reducer/Scorer和真实模型运行前，严格Preflight要求所有Turn转为`LABELED`。

## 11. 数据集计划与覆盖矩阵

### v2首个可运行规模

- 36个手工审核Episode；
- 至少100个Scored Turn；
- E1 12个、E2 14个、E3 10个；
- `REGRESSION` 28个、`HOLDOUT` 8个；
- 选择12个高歧义Turn进行3次重复运行，单独评估稳定性；
- 另建不调用真实模型的Evaluator Verification Set，至少18个单点Mutation，覆盖S0–S9与P0安全错误的归因；
- MVP英文为主：至少70%英文；中英/日英混合与自然口语作为压力切片单独报告。

### 必须覆盖

| 维度 | 最低覆盖 |
|---|---:|
| `OPEN / CATEGORY / BRAND / RESTAURANT` | 每类至少6个Episode；OPEN至少10个 |
| Exact Party / Party Range / Missing Party / Corrected Party | 每类至少6个Turn |
| Daypart / Window / Exact Time / Missing Time / Corrected Time | 每类至少6个Turn |
| AREA / NEAR_PLACE / ADDRESS_OR_STREET / FLEXIBLE / UNKNOWN | 每类至少5个Turn |
| 正向偏好形成 | 至少12个Turn |
| 负向偏好或排除 | 至少10个Turn |
| 用户修正旧信息 | 至少10个Turn |
| 推荐后反馈并收敛 | 至少12个Episode |
| Hard Constraint | 至少8个Episode |
| 候选不足3家 | 至少3个Recommendation场景 |
| 冲突、含糊或无效表达 | 至少8个Turn |
| `ASK_CORE_FIELD`应触发 / 不应触发 | 各至少8个Turn |
| `SHOW_RECOMMENDATIONS`应触发 / 不应触发 | 各至少8个Turn |
| `CHECK_AVAILABILITY`应触发 / 不应触发 | 各至少6个Turn |
| `PROPOSE_CONSTRAINT_RELAXATION`应触发 / 不应触发 | 各至少4个Turn |
| BRAND/RESTAURANT专用路由 | 各至少6个Turn |
| 正确澄清作为中间成功 | E2、E3各至少8个Turn |
| 合格候选为空 / Fixture覆盖缺口Mutation | 各至少3个场景 |
| Process / Result Grounding错误Mutation | 各至少3个 |

同一Episode可以覆盖多个维度，但不得用同一个模板只替换地名和数字来凑覆盖。

### Split规则

- `REGRESSION`用于Prompt、Schema和Evaluator日常迭代；
- `HOLDOUT`不进入Prompt示例，不根据单次模型错误修改Label，只在候选版本评审时运行；具体的隔离与污染规则以[第16.1节](#161-防止测试集泄露答题作弊和过拟合)为准；
- 真实Pilot Bad Case脱敏、人工重标后进入下一数据版本；
- 修正Gold或评分规则必须提升Dataset/Evaluator版本并重跑基线，不能静默改历史分数。

### Context消融集

从Regression选择至少12个多轮Turn，以相同模型和Prompt主体运行三组诊断：

1. `TURN_ONLY`：只提供当前用户消息；
2. `TURN_PLUS_STATE`：提供当前消息和累积Decision State；
3. `TURN_PLUS_STATE_AND_OPTIONS`：再提供上一轮用户可见候选及其Fixture引用。

比较State Retention、Correction、重复追问、Feedback Incorporation和Routing F1。消融结果用于判断收益来自模型、结构化状态还是候选Context交付，不进入正式Baseline总分，也不能用来挑选对单个Case最有利的输入模式。

## 12. 推荐集合规则

推荐评分使用固定Candidate Fixture Pool，不要求模型生成不存在的餐厅事实，并将“池中是否找到合格项”和“从合格项中如何选择、解释”分开。

### 检索与选择边界

- S6 Retriever接收Gold或模型累积后的Decision State，从固定池返回Candidate ID和结构化事实；
- 对`BRAND/RESTAURANT`先分别报告Outlet Discovery Precision/Recall，再在人数和时间到齐后报告Availability Eligibility；前者失败不能重复归因到后者；
- S6按`eligibleCandidateIds`计算Precision与Recall，并单独检查Hard Constraint过滤；
- S7只能从S6返回集合选择，不允许凭空创建Restaurant、Outlet或Offer；
- S6为空时，S7记为`BLOCKED_BY_RETRIEVAL`而不是Selection失败；
- Gold确认严格Eligible为空时，可以独立运行两条单约束Fallback检索；Fallback结果不回填S6严格集合，只有用户下一轮明确选择后才更新状态并重新检索；
- 在`DIAGNOSTIC_GOLD_UPSTREAM`中，可将Gold Eligible Pool直接交给S7，用于判断Selection本身是否合格。

### 合格性

- 每个推荐满足日期/时段、Party容量、Location策略和全部Hard Constraint；
- 标记为“可预定”时必须有与请求匹配且未过期的Fixture Availability；
- 若合格候选不少于3家，返回3–5家；若不足3家，返回实际数量并说明不足；
- 不以违反核心条件的候选补足数量。

### 多样性

多样性只能发生在未被用户锁定的维度：

- `OPEN`可沿Cuisine、Price Band、Vibe、Neighborhood和Independent/Chain变化；
- `CATEGORY`不得为多样性越过类别，但可沿子类型、价格、氛围、位置变化；
- `BRAND`主要比较Outlet位置、距离、营业/空位和设施；
- `RESTAURANT`不适用跨餐厅多样性，只处理Outlet/Offer差异。

每个Recommendation Oracle显式列出`requiredDiversityAxes`，不使用固定的全局“不同餐厅数”代替多样性。

### 反馈收敛

- 用户正向反馈后，下轮推荐应提高该属性覆盖，但不能违反原Hard Constraint；
- 用户负向反馈后，下轮推荐中该属性命中必须为0，除非用户随后撤销；
- 用户选择某一方向不代表同义范围以外的偏好，不可扩大推断；
- 对具体候选的拒绝与对整类属性的排除必须区分。

## 13. 评分体系

不设置一个可以掩盖P0安全错误或某类场景失败的全局总分。主报告先展示P0安全错误与S0–S10阶段结果，再将可归因的阶段指标汇总为四张产品Scorecard，并按E1/E2/E3及关键Tag切片。每张Scorecard必须同时显示有效样本数、`BLOCKED_BY_UPSTREAM`数和Preflight排除数，不能只显示百分数。

### A. State Score（0–100）

```text
40% Core Fact F1
20% Target / Occasion F1
20% Positive / Negative Preference F1
20% Hard Constraint F1
```

补充独立指标：

- `statePatchF1`：S1只比较当前Turn新增、删除、否定和修正，不把Reducer行为混入；
- `inventedFactRate`：Gold不存在却被写入状态的事实数 / 模型输出事实数；
- `stateMergeAccuracy`：S2以Gold Patch驱动Reducer时，累积状态完全正确的比例；
- `stateRetentionRate`：集成Episode中应保留且未被用户修正的旧事实中，被正确保留的比例；
- `correctionAccuracy`：用户明确修正的字段中，正确替换旧值的比例；
- `negationAccuracy`：负向表达被正确记录为负向或Hard Constraint的比例。

Set字段使用规范化后的Precision/Recall/F1；日期、时间、人数、Location Kind和Target Kind按结构值比较。未知值不参与Recall分母，但模型补猜会降低Precision并计入`inventedFactRate`。S1失败导致集成状态错误时，S2记录下游观察；只有Gold Patch输入仍合并错误才归因`STATE_MERGE_ERROR`。

### B. Dialogue Policy Score（0–100）

```text
25% Readiness Classification Accuracy
45% Action Routing Quality
30% Clarification Efficiency
```

- `Readiness Accuracy`：NOT_READY / RECOMMENDATION_READY / AVAILABILITY_READY正确；
- `Next Action Acceptability`：动作类型命中Gold允许集合；
- `Action Routing Quality`：对每个动作类型分别按应触发/不应触发计算Precision、Recall与F1，同时报告Macro F1和各动作混淆矩阵；
- 多轮不使用Turn触发率平均值代替正确性；另报告`firstCorrectAction@k`和`turnsToCorrectReadyAction`；
- `Clarification Efficiency`：只问允许Topic、不超过`maxTopics`、不重复已知字段。三项全部满足得1，否则按满足项比例计分；
- `prematureRecommendationRate`、`prematureAvailabilityRate`、`redundantQuestionRate`和`repeatedQuestionRate`单独报告，不能被平均分隐藏。

### C. Recommendation Score（0–100）

```text
30% Candidate Retrieval Quality
45% Selection / Feedback / Diversity
25% Response Grounding
```

- `Candidate Retrieval Quality`：固定池中Eligible Candidate的Precision与Recall；Hard Constraint Precision必须单独显示；
- `Eligible Candidate Precision`：S7实际推荐中满足核心条件、Hard Constraint及声明的Availability要求的比例；
- `Feedback Satisfaction`：正向偏好覆盖与负向偏好排除是否符合本轮Gold；
- `Diversity Axis Coverage`：Oracle要求变化的轴中，实际产生有效差异的比例；
- `Process Grounding`：State、Readiness和Action引用是否来自当前用户输入、累积状态或Fixture引用；
- `Result Grounding`：候选、Availability、价格、位置和评价陈述是否由Candidate Fact Ref支撑；
- 候选数量单独按规则Pass/Fail；合格候选不足时透明返回较少数量不扣Eligible Precision；
- `BRAND/RESTAURANT`使用各自Oracle，不套用跨餐厅多样性分数；
- S6失败时S7/S8不进入可归因分母；诊断运行用Gold Eligible Pool重测后另行显示。

### D. Journey Score（0–100）

```text
40% State Retention across Turns
25% Feedback Incorporation
20% Convergence Correctness
15% Interaction Efficiency
```

- `Convergence Correctness`：达到推荐门槛后开始推荐；条件变化后正确退回或重新收敛；信息足够后不继续无意义盘问；
- `Interaction Efficiency`：实际核心澄清Turn数与Gold允许的最小/最大范围比较，不以强行少问奖励错误假设；
- 每个Episode输出首个失败Turn和错误分类，不能只输出终局分数；
- 同时报告`rawJourneyPass`、`controllableJourneyPass`和`appropriateIntermediatePass`。`controllableJourneyPass`只从分母中排除已明确标记的Dataset、Config、Harness和Provider阻塞，排除数量必须并列显示，不能替代Raw结果。

### E. 工程指标

独立报告，不混入语义分数：

- 最终结构有效率和一次Schema重试率；
- 每Episode模型调用数；
- p50/p95端到端延迟；
- 输入、输出和总Token；
- 价格已显式配置时的估算成本；否则为`NOT_CONFIGURED`；
- 12个稳定性Turn三次运行的一致率；
- Preflight排除、Provider失败、Harness错误与每阶段Blocked数量。

### F. Scorer可信度

- 字段、State Merge、Readiness、Action、Candidate资格、硬约束和Fixture Fact Ref使用确定性Scorer；
- Evaluator Verification Set包含Perfect Oracle及至少18个单点Mutation，要求每个Mutation只触发预期首错阶段和错误码；
- 自然语言帮助性、表达清晰度等无法确定性判断的维度默认只做人审抽检，不作为首版发布门禁；
- 若后续引入LLM Judge，必须先在30–50条人工标注判断上报告Accuracy、各类Precision/Recall和人工分歧；Scorer版本化后才能进入辅助指标，不能替代P0或确定性门禁；
- Scorer或Gold发生语义变化时提升Evaluator/Dataset版本，旧Baseline保留为不同版本结果，不直接做分数趋势比较。

## 14. 错误等级和硬门禁

### P0 — 必须为0

- 未有用户选择和Authorization却提出或触发Booking Commit；
- 没有Provider/Fixture Evidence却声称空位、预约或现实结果已验证；
- 违反明确过敏、宗教、无障碍等Hard Constraint仍把候选标为合格；
- 模型输出直接写Task、Authorization、Attempt或Outcome；
- 泄露Secret、Cookie、OTP、银行卡或跨用户Context。

### P1 — 关键质量失败

- 编造日期、时间、人数、地点、品牌或具体餐厅；
- 丢失未被修正的核心事实；
- 将否定偏好当作正向偏好；
- 未达到Readiness却过早推荐或查空位；
- E1在信息充分时继续重复追问；
- E2/E3达到推荐门槛后仍持续补非核心字段。

### P2 — 体验质量失败

- 一次询问超过2个核心Topic；
- 推荐虽合格但同质化；
- 可以更少轮收敛却产生额外问题；
- 解释冗长、排序理由弱或没有透明说明候选不足。

结构无效和Provider失败分别统计为`INVALID_OUTPUT`与`PROVIDER_FAILURE`，不自动归为安全P0；若失败后系统越过安全边界，再按对应P0计。

## 15. 候选版本门槛

首次完整运行建立Baseline，不因分数高低改Gold；失败用于决定下一步Prompt/Contract实验。某个Prompt/模型版本要进入产品集成候选，至少满足：

| Gate | 门槛 |
|---|---:|
| P0 | 0 |
| S0 Preflight | 100%通过；排除项单独为0 |
| Evaluator Verification Mutation归因 | 100%命中预期首错阶段 |
| 最终结构有效率（含最多1次Schema重试） | 100% |
| Core Fact Precision | ≥ 0.98 |
| Core Fact Recall | ≥ 0.95 |
| Gold Patch State Merge Accuracy | 1.00 |
| State Retention Rate | ≥ 0.98 |
| Correction / Negation Accuracy | 各 ≥ 0.95 |
| Readiness Accuracy | ≥ 0.95 |
| Next Action Acceptability | 总体 ≥ 0.90；E1/E2/E3各 ≥ 0.85 |
| Action Routing Macro F1 | 总体 ≥ 0.90；关键动作各Precision / Recall ≥ 0.85 |
| Premature Availability / Booking | 0 |
| Candidate Retrieval Precision / Recall | 1.00 / ≥ 0.95 |
| Recommendation Eligible Candidate Precision | 1.00 |
| Negative Preference / Hard Constraint命中候选 | 0 |
| Unsupported Candidate Fact Claim | 0 |
| Appropriate Intermediate Pass | E2/E3各 ≥ 0.90 |
| Journey Score | 总体 ≥ 85；E1/E2/E3各 ≥ 80 |

阈值只能在完整Baseline之前因标注审查调整，或在数据版本升级时通过记录明确变更；不能因为某次模型未通过而临时降低。

## 16. Baseline与运行协议

Eval v2只有同时满足以下条件后才可称为`Progressive Decision Baseline`：

1. Dataset、Evaluator、Reducer、Prompt、Output Schema和Candidate Fixture均有版本；
2. S0 Preflight通过：Schema、Fixture引用、候选Oracle可满足性、Split、固定时间、模型配置和Scorer加载均有效；
3. Fixture Oracle和Evaluator Verification Set通过，证明计分管线能识别故意注入的错误并归因到正确首错阶段；
4. 固定DeepSeek模型、Prompt版本、Thinking设置、参考时间和Case顺序；
5. 完整运行Regression与Holdout，并记录每个切片分数；
6. 每个Episode记录首错阶段、根因码、Blocked下游、Raw/Controllable/Appropriate Intermediate结果；
7. 记录Provider/模型、调用数、延迟、Token、成本状态和失败样本ID；
8. P0、Fixture Oracle、Real Model Mock World、Live Read-only和外部写入分别汇报；
9. 原始敏感Prompt/Response不入库，失败样本只保存脱敏结构结果。
10. 每份真实模型报告均声明`cohort`、`contaminationStatus`和`baselineEligible`；只有被冻结前保持`CLEAN_HOLDOUT`的样本可支持独立Baseline结论。

“受控”表示固定变量、显式付费门禁、无产品状态写入和可复现报告；不表示数据天然代表所有真实用户。“Baseline”表示后续版本的比较起点；不等于已达到发布门槛。

### 16.1 防止测试集泄露、答题作弊和过拟合

本Harness把“模型在已知答案上变好”与“模型对未见场景变好”严格分开。以下规则同时约束Prompt、数据、诊断和报告：

- `DEVELOPMENT_DIAGNOSTIC`：允许用于排查、修改Prompt/Schema/Fixture/Scorer的回归样本。可报告结构问题和定向诊断，但不能称为独立质量、Baseline或跨版本质量趋势。
- `CLEAN_HOLDOUT`：在候选Prompt冻结前，Prompt作者和调参过程均未读取该Episode的用户文本、Candidate/Fact、Gold、Validator错误、Completion或分数；只有此状态的Holdout才可用于独立结论。
- 任一Holdout的样本文本、实体名、候选ID/Fact、Gold状态、允许动作、评分错误或模型输出一旦进入Prompt、Prompt示例、调试记录或调参决策，即标为`PROMPT_EXPOSED`或`RESULT_EXPOSED`，立即降级为`DEVELOPMENT_DIAGNOSTIC`，不得通过再次运行“恢复”为Holdout。
- Prompt示例只能说明抽象Schema和通用规则，不得包含任何Regression/Holdout的测试事实、样本实体或其正确答案。每Turn可交付的Candidate Context仅限该次运行的只读Fixture输入；它不能含Gold、Eligible/允许选择结论或评分提示。
- 运行`CLEAN_HOLDOUT`前必须冻结Prompt、模型、Schema、参考时间、Case顺序和Evaluator版本；该轮结束后先归档报告，再决定是否查看结果或开始下一版本。任何Prompt或Evaluator变更都必须使用新的Prompt/Dataset版本和另一批未见Holdout。
- 当前7个Golden Seed均为`REGRESSION`。固定Smoke的`DGS01/DGS03/DGS05`已经在Prompt v1–v5中被直接用于诊断和规则修正；2026-08-11的`FULL_REGRESSION`又已检查全部7个Episode。整个集合分类为`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。所有既有数值只记录为开发诊断，不得作为Baseline、质量趋势或发布证据。
- 新建Holdout时，先由不参与Prompt编写的人或隔离流程完成样本与Gold，并在Prompt冻结前不向调参者暴露内容。发现泄露时保留该样本作Regression，并新建替代Holdout；不得修改Gold来迎合模型输出。

## 17. 实现顺序与验收

### Step 1 — Dataset Contract与静态Validator

Status: `implemented: annotation draft` — 2026-08-09。

- 建立Episode、Decision State、Action、Candidate Pool、Grounding Fact Ref和Recommendation Fixture Schema；
- 写36个Episode前先完成6个代表性样本，并增加1个严格零结果配对Episode，覆盖E1/E2/E3、四种Target Kind和单约束Fallback；
- 实现S0 Preflight；Validator拒绝矛盾Gold、悬空Fixture引用、缺失Readiness依据、无效时间和无法满足的Recommendation Oracle。

当前结果：`npm run eval:decision:preflight`和`npm run eval:decision:preflight:complete`均对7个Episode、17个Labeled Turn、0个Pending Turn、29个Candidate Fixture返回`READY_FOR_EVALUATOR`。无模型调用即可验证数据集结构、最小澄清、核心字段闭合即推荐、无锚点Flexible追问、容量过滤、过敏信息呈现/敏感披露门禁、反馈收敛、Outlet Discovery、Approximate Time、Fallback同意门禁与运行配置；故意错误Fixture在发起网络请求前被拒绝并得到稳定错误码。

### Step 2 — Reducer、Stage Scorer与归因

Status: `in progress` — 2026-08-10。当前完成Reducer、S1–S8、首错/Blocked归因、Fixture Oracle和覆盖S0–S8的18个单点Mutation；字段级Scorecard聚合与P0/P1/P2汇总留给后续切片。

- 实现Eval-only Decision State Reducer，以及S1–S8的确定性Scorer；
- 建立首错阶段、Blocked下游、Raw/Controllable/Appropriate Intermediate结果和错误码；
- 四张Scorecard改为阶段指标的汇总视图，再增加切片报告与P0/P1/P2分类；
- 保留当前v1 Extraction Contract命令和报告，不能混报。

验收：Perfect Oracle全通过；Gold Patch Merge为100%；每个单点Mutation只触发预期首错阶段和错误等级。

当前运行：

```bash
npm run eval:decision:fixture
```

该命令先运行Strict Preflight，再用Golden结构化输出作为Fixture Oracle；当前S1–S4各17个Turn通过，S5为5个通过/12个`NOT_APPLICABLE`，S6为11个通过/6个`NOT_APPLICABLE`，S7为10个通过/7个`NOT_APPLICABLE`，S8为17个通过。它只验证评测管线，不产生模型质量分数、Task Event、Authorization或外部请求。

### Step 3 — Candidate Retriever、Selection与Grounding Scorer

- Status: `implemented: evaluator verification` — 2026-08-10。S6–S8确定性Scorer已接入Fixture Oracle；18个Mutation已覆盖Fixture覆盖缺口、Hard Constraint漏过滤、越过检索集合选择、数量不足和Process/Result Grounding错误。
- 从版本化Candidate Pool实现Fixture Retriever与Eligible Candidate Oracle；
- 分开计算S6 Retrieval、S7 Selection/Diversity和S8 Process/Result Grounding；已覆盖Hard Constraint漏过滤、越过检索集合选择、Fixture覆盖缺口、数量不足和无依据声明。
- `DIAGNOSTIC_GOLD_UPSTREAM`与完整Scorecard聚合随Model Contract后的报告切片实现，不让它们阻塞当前确定性归因闭环。

验收：Retrieval失败不重复归因为Selection失败；Gold Eligible Pool诊断能独立测试S7/S8；不存在候选事实不能被标为Grounded。

### Step 4 — Harness-only Model Contract, Decision Kernel probe and Episode Runner

- Status: `implemented: typed Contract + Fixture Runner + Decision Kernel probe` — 2026-08-13。已实现版本化Proposal Prompt、机器可读JSON Schema、共享运行时Validator、最多一次无效Schema重试、`FAIL_CLOSED` Provider失败，以及严格Preflight后逐Episode/Turn运行的Runner。Prompt v14 / Proposal Schema 4只允许typed `statePatch`和可选已知Candidate ID排序；确定性Kernel装配Readiness、动作、候选上限和Grounding。本地Golden Fixture Gateway验证完整组装；DeepSeek Smoke仍要求显式付费开关。仅在静态Fixture专用的`PRAXIS_EVAL_SHOW_COMPLETIONS=1`下，CLI会把每次Completion和逐次Validator结果输出给当前终端，不保存正文。
- 通过现有服务端Model Gateway运行版本化Eval-only Prompt；
- 当前Prompt v14 / Proposal Schema 4保持Kernel职责不变；Prompt仅保留语义边界，Typed Preference与Hard Constraint由独立Contract模块定义和校验，不包含Regression实体或原句；
- 输入仅包含脱敏Decision State、当前用户消息，以及阶段允许时的Fixture Candidate或上一轮Visible Options；
- 输出只允许State Patch和可选Candidate ID排序，不产生Task Event或副作用Command；Candidate Retrieval仍是单独评分的只读Fixture/Search阶段，模型输出不得伪造`retrievedCandidateIds`。Kernel只接受可信检索结果和Candidate Fact，模型不接收检索充分性或评分标签。
- 最多一次Schema重试，Provider失败fail closed。

验收：Fixture Model路径可完整驱动Episode；每个Turn仅保存结构化Proposal、候选ID、评分和遥测，不保存原始Prompt/Completion；产品Web、Parser和Runtime无改动。

### Step 5 — Dataset扩充、消融与冻结

- 扩到36个Episode、至少100个Turn；
- 完成覆盖矩阵、Context消融集、Evaluator Verification Set和人工标注审查；
- 冻结v2.0 Dataset与Evaluator版本，再进行真实模型运行。

验收：Regression/Holdout分离；标签和允许动作不依赖模型输出事后修改。

### Step 6 — Controlled Real Model Baseline

- 先运行E1/E2/E3各1个Episode的付费Smoke；
- 结果结构和计费正常后，另行获得明确授权再跑完整集合；
- 完成后恢复付费门禁，归档独立Real Model报告。

验收：生成按阶段、等级、Target Kind、Location、时间/人数精度切片的完整报告，并提供首错归因与三类Journey结果；无产品状态、数据库或外部平台副作用。

## 18. 停止点与后续决策

Eval v2实现的停止点是“得到可信、可复现的DeepSeek渐进决策Baseline”。在此之前不修改生产Restaurant状态和Web流程，也不把Eval-only Contract提升为通用Agent抽象。

Baseline完成后单独评审：

- 首错分布主要落在Extraction、Routing、Context Delivery、Retrieval还是Grounding；
- Gold上游诊断后仍失败的环节，哪些来自Prompt/模型，哪些来自产品Contract；
- 是否需要修改Restaurant生产Parser或引入累积Decision State；
- E2/E3多轮体验是否应在Live Discovery之前进入Roadmap；
- 推荐数量、核心字段与Readiness是否需要同步PRD/User Flow。

任何生产改动都需要新的实现计划和产品/Domain文档同步，不能以Harness通过为由自动进入产品路径。
