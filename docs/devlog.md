# Development Log

- Status: Accepted
- Version: 3.3
- Last updated: 2026-08-10
- Source of truth for: 非trivial开发与文档变更的时间记录
- Related ADRs: [ADR Index](decisions/README.md)
- Related documents: [Roadmap](roadmap.md), [Test Log](test-log.md)

## 2026-08-10 — Harness-only Progressive Decision Model Contract

### Why

在首次付费Baseline前，模型需要一个与生产Runtime隔离、可版本化且会拒绝不可信输出的Proposal Contract。没有它，模型可能把检索结果伪装成自身事实，或在JSON无效、Provider失败时让评测器把基础设施错误当成语义失败。

### Changes

- 新增`RestaurantDecisionEvalModelContract`：经现有服务端`ModelGateway`发送`restaurant_progressive_decision_eval/v1`的非流式JSON请求，固定10秒超时、900输出Token、`temperature: 0`、关闭Thinking与`FAIL_CLOSED`回退。
- 输入为脱敏的累计Decision State、当前用户消息和调用方明确交付的只读Candidate Context。输出只接受State Patch、Readiness、Next Action、Candidate ID选择和Grounding；未知字段与嵌套字段一律拒绝。
- Candidate Retrieval继续是单独的Fixture/Search阶段；Contract明确禁止模型输出`retrievedCandidateIds`，避免模型把未执行的只读检索伪装成结果。
- 无效JSON、非`STOP`完成或Schema无效最多重试一次；Provider失败不重试并与`INVALID_MODEL_OUTPUT`分开报告。新增6个Connector/Schema测试。

### Decisions and boundaries

- 这是Eval Proposal，不是Task Event、Task State、Authorization、Tool Command或生产Web API。它不会调用DeepSeek，除非未来完整Episode Runner经过现有付费门禁显式创建真实Gateway。
- 当前只完成Contract本身；还没有完整Episode Model Runner，因而没有运行新的Progressive Decision真实模型Smoke或Baseline。

### Verification

- 定向Model Contract测试：6/6通过，覆盖受限请求、一次Schema重试、禁止伪造检索、嵌套未知字段、Provider失败和调用前输入校验。
- `npm run typecheck`、`npm run build`、`npm run eval:decision:fixture`：通过。
- `npm test`：115 tests / 5 suites / 0 failed。

### Next

实现完整Episode Model Runner：只读Fixture候选交付、模型Proposal与S1–S8 Scorer组装、Provider/Schema失败分离和受控3-Episode Smoke输出；之后才请求/使用真实DeepSeek付费运行。

## 2026-08-10 — Progressive Decision Evaluator Verification Set

### Why

Perfect Oracle只证明评分器与Gold自洽，不能证明它会把故意错误归到正确环节。真实模型Baseline前需要一组独立、单点的反例，特别是让Fixture自身无法提供Gold所要求差异时，不能反过来怪罪模型选择。

### Changes

- 新增18个`M01–M18`单点Mutation，覆盖S0–S8：无效Fixture/过敏证据、State提取、Gold Reducer不一致、Readiness、Action、重复澄清、漏检/多检候选、严重过敏P0、候选数量、越过检索集合选择、Fixture多样性缺口、Process/Result Grounding、禁止Availability声明和候选卡确认披露缺失。
- S7新增小规模固定组合的Oracle可满足性检查：若Candidate Pool本身无法让任意允许集合满足Gold规定的数量与多样性，报告`FIXTURE_COVERAGE_GAP`，而非把Perfect Prediction记为模型选择失败。

### Decisions and boundaries

- 组合检查只在每Turn最多4个左右的Golden Fixture候选上执行，不引入通用检索/排序框架或运行时开销。
- Verification Set只验证Preflight和Harness Scorer；不增加模型调用、生产数据、Task状态写入、Authorization或外部副作用。

### Verification

- `node --import tsx --test src/eval/restaurant-decision-eval-mutation.test.ts`：18/18通过，每个Mutation命中预期首错阶段与稳定错误码。
- `npm run eval:decision:fixture`：Strict Preflight和全部7个Fixture Journey通过。
- `npm run typecheck`、`npm run build`、`npm test`：通过；全量为109 tests / 5 suites / 0 failed。

### Next

实现Harness-only Model Contract：版本化Prompt/Schema、Fixture Context交付、输出校验、一次Schema重试和Provider失败分离；随后先跑3个Episode的受控DeepSeek Smoke。

## 2026-08-10 — Progressive Decision S6–S8 scoring and allergy-card grounding

### Why

在接入真实模型前，Evaluator不仅要知道“是否理解并追问正确”，还必须能定位“检索了错误候选”“候选正确但选择不当”以及“候选卡无事实依据”。严重花生过敏尤其不能因候选数量或表达方便而绕过Hard Constraint，或把“餐厅仍需确认”遗漏为安全保证。

### Changes

- Golden Seed升级到v0.7。DGS06 T03/T04把三张可展示候选卡的`ALLERGY_CONFIRMATION_REQUIRED`写为结构化Gold：每项绑定Candidate ID和同一候选的`attributes` Fact；它要求显示“仍需餐厅确认”，不实现生产Consent或外部披露。
- 扩展Eval-only Prediction Contract：模型评测输出可表达`retrievedCandidateIds`、推荐Candidate ID与不足说明、State/Candidate Fact Ref、禁止声明标签和必要的候选卡披露；它仍不是Runtime Event、Task State、Authorization、Command或生产API。
- Preflight验证上述披露的Candidate、Fact、去重、可用Grounding及`attributes`证据边界。
- Fixture Scorer扩至S1–S8：S6比较固定Eligible集合并对明确Hard Constraint漏过滤给出`P0_HARD_CONSTRAINT_VIOLATION`；S7要求只从已检索集合选取、满足数量与所需多样性；S8分别检查Process/Result Grounding、禁止声明和必需披露。上游失败继续明确标记下游`BLOCKED_BY_UPSTREAM`。
- 扩展Mutation：错误Readiness、重复澄清、编造状态、过敏Hard Constraint漏过滤、越过检索集合选择及过敏确认披露缺失均稳定落到预期首错阶段。

### Decisions and boundaries

- `ALLERGY_CONFIRMATION_REQUIRED`只表达当前候选卡应告知用户“仍需餐厅确认”；它不等同于安全、预约、餐厅接受或用户同意对外披露。
- 当前S6严格比较固定Fixture Eligible集合，S7从同一轮模型声明的检索集合取候选；没有提前新增独立Search Runtime或Ranker抽象。
- S6–S8仍是`HARNESS_ONLY`。未改动Web、Task Runtime、Restaurant生产State、Parser、Model Gateway调用、Authorization、Adapter或外部写路径。

### Verification

- Strict Complete Preflight：Golden v0.7为`READY_FOR_EVALUATOR`，7个Episode、17个Labeled Turn、29个Candidate、417个Fact、0个Issue。
- `npm run eval:decision:fixture`：全7个Journey通过；S1–S4各17个Pass，S5为5个Pass/12个Not Applicable，S6为11个Pass/6个Not Applicable，S7为10个Pass/7个Not Applicable，S8为17个Pass。
- `npm run typecheck`、`npm run build`：通过；定向Eval测试23/23通过。
- `npm test`：91 tests / 5 suites / 0 failed。

### Next

补齐Evaluator Verification Set（Fixture覆盖缺口、同质选择、无依据声明等）和Harness-only Model Contract；两者完成后才运行受控DeepSeek Progressive Decision Baseline。

## 2026-08-10 — Eval-only Reducer and S1–S5 scoring slice

### Why

Golden Set通过Strict Preflight后，下一步不是立即调用DeepSeek，而是先证明评测器会正确合并多轮状态、定位首错并拒绝不完整输入。否则真实模型失败无法区分是模型、数据还是评分器问题。

### Changes

- 新增Harness-only `applyDecisionStatePatch`：应用Set、修正、清除、正/负偏好与Hard Constraint增删，且不修改输入对象；它不依赖Task Runtime或Restaurant生产State。
- 新增Eval-only Prediction Contract与S1–S5 Scorer：比较当前Patch、累计State、Readiness、动作类型和澄清Topic；上游失败后将下游明确标为`BLOCKED_BY_UPSTREAM`，每Turn输出首错阶段和稳定错误码。
- 新增Fixture Oracle命令`npm run eval:decision:fixture`。它先运行Strict Preflight，再用Golden结构化输出驱动全7个Episode；当前S1–S4各17个Pass，S5为5个Pass和12个Not Applicable，7个Journey全部Pass。
- 新增4个测试：Reducer修正/清除/保留、Perfect Oracle、三类单点Mutation的首错归因，以及缺失Prediction fail closed。

### Decisions and boundaries

- Prediction Contract仅是Eval输入，不是模型可直接写入的Task Event、Authorization、Command或生产API。
- 当前S1采用精确Patch比较，先保证确定性归因；字段级F1、S6–S8候选/选择/Grounding、完整Mutation Set和Model Contract仍在后续切片实现。
- Fixture Oracle的100%只证明评分管线与Golden自洽，不是DeepSeek或产品多轮能力得分。

### Verification

- `npm run eval:decision:fixture`：Strict Preflight通过，Fixture Oracle全7个Episode通过。
- `npm run typecheck`、`npm run build`：通过。
- `npm test`：87 tests / 5 suites / 0 failed。

### Next

实现S6–S8 Candidate Retrieval、Selection/Diversity与Grounding Scorer，并扩展Mutation Set；仍不连接真实模型或外部平台。

## 2026-08-10 — DGS06 completion and date-less Daypart Contract

### Why

最后一个Golden Episode确认了两个现有Contract未完整表达的需求：仅“晚饭”仍是应保留的时间事实，即使日期未知；“愿意远一点”只说明出行意向，不能替代出发点或地区。严重花生过敏也不能被“可提交请求”简单排除或承诺安全，而应以真实卡片提示保留为待确认备选，并在预约前获得敏感信息披露同意。

### Changes

- Golden Seed提升至v0.6，DGS06四个Turn写入Gold；首批7个Episode、17个Turn现已全部标注。
- DGS06先追问日期与人数，再对没有地理锚点的`FLEXIBLE`意向只追问Location Strategy；以Ueno为出发点后进入推荐。
- 6–8人范围被5人修正覆盖。明确不支持严重花生过敏的Yakitori Matsu被排除；Kappo Haru、Garden Room和可提交请求的Sakana Table可展示，但分别按Fixture事实提示餐厅确认，禁止安全保证。
- 在后续日料/不正式偏好下保留三种真实取舍，不伪造完美候选，也不向用户暴露内部证据分级。
- Preflight允许无日期的`DAYPART`保存已知用餐时段；`DAY`、`APPROXIMATE`、`WINDOW`和`EXACT`仍强制日期。新增正反向Contract测试。
- Golden Grounding标记：选择含严重过敏要求的候选后，预约前必须出现包含餐厅、日期、时间、人数、待披露过敏信息与“仍待餐厅确认”说明的Consent Card；本轮仅记录门禁，不实现产品交互或外部请求。

### Decisions and boundaries

- `FLEXIBLE`无`scope`不满足Recommendation Readiness；它保留“愿意出行”的用户事实，但必须补地理锚点。
- “可接受过敏请求”可作为明确标注待确认的备选，不能等同于安全可用；“来源说明有流程”也不构成安全保证。明确不支持才直接排除。
- 本轮的日期语义改动触及Preflight Contract，因此按验证规则运行Typecheck、Build和全量稳定回归。
- 仍为Harness-only：没有生产State、Web、Adapter、Authorization或外部写路径变更；真实模型Baseline尚未开始。

### Verification

- Draft与Strict Complete Preflight均返回`READY_FOR_EVALUATOR`：7个Episode、17个Labeled、0个Pending、29个Candidate、417个Fact、0个Issue。
- `npm run typecheck`、`npm run build`通过；定向Preflight测试15/15通过；`npm test`为83 tests / 5 suites / 0 failed。

### Next

实现Eval-only Decision State Reducer、S1–S9 Scorer和Mutation Set；完成后再执行受控DeepSeek Progressive Decision Baseline，仍不接真实Discovery或Booking。

## 2026-08-10 — Restaurant allergen information and disclosure-consent boundary

### Why

过敏不应成为所有餐厅搜索的默认问卷项，但一经用户明确提出就会同时影响候选真实性、对外披露和预约安全。日本外食的过敏信息并非统一强制标示，且厨房混入与菜单变动使“可接受请求”不能等同于餐厅可安全接待。因此需要在DGS06之外建立可复用的Restaurant产品规则。

### Decisions

- [Restaurant Booking Domain](domains/RESTAURANT-BOOKING.md#过敏与特殊要求)成为候选卡过敏信息、特殊要求与预约前披露Consent Card的详细Source of Truth。
- 特殊要求是条件触发的安全字段：初步推荐不默认阻塞；用户声明严重过敏后成为Hard Constraint，明确不支持的候选直接排除。
- 候选卡按来源事实明确展示“未提供信息 / 可接受请求 / 来源说明有处理流程 / 明确不支持”，并附来源、查询时间和“仍需餐厅确认”的含义；不向用户暴露内部证据分级，也不承诺安全。
- 选择带已声明过敏限制的候选后，`Book this`必须先显示Consent Card，确认最小对外披露内容、可选补充说明、餐厅/时间/人数和本次预约或请求；用户拒绝披露时不得隐去Hard Constraint继续提交。
- 只有餐厅明确接受时，特殊要求才能标记满足；预约或备注提交本身仍只是`已提交请求`。

### Scope and boundaries

- 本轮只更新Domain、PRD、User Flow、Data/Security与Eval设计；不修改生产State、Schema、Web、Adapter、Authorization实现或外部写路径。
- 过敏原原始说明按敏感健康信息处理：仅当前Case使用，默认不进入模型日志、长期Memory或群体学习；真实实现前需完成隐私评审。
- 该决定细化现有单候选授权与特殊要求未确认规则，未改变Accepted ADR；不新增ADR。

### Verification

- Markdown相对链接检查通过；Restaurant Domain、PRD、User Flow、Data/Security和Eval均指向同一详细规则。
- 未运行代码测试：本轮没有改动代码、Schema、Prompt、Provider、构建输入或外部执行路径。

## 2026-08-10 — DGS05 core-ready recommendation without preconditioned taste feedback

### Why

人工审阅确认：当日期、时段、人数、地点和场景已足以开始搜索时，Agent不应等待用户先给出“不吃辣”“想安静”等额外偏好。推荐本身是帮助用户形成偏好的交互；未表达的口味不能被伪造成过滤条件。Availability也不应阻塞宽泛时段下的探索性推荐，只有确切时间或有界Window才进入匹配查询。

### Changes

- Golden Seed提升到v0.5，DGS05四个Turn一次性写入Gold；当前共13个Labeled Turn、4个Pending Turn。
- T01只保存DATE场景，最小追问日期与人数；T02保存`2026-08-11 / DINNER / Party 2`后只追问地点；T03保存Ebisu区域即进入`RECOMMENDATION_READY`。
- T03的四个Ebisu Fixture全部Eligible，包括辣味川菜；初次展示3–4家，以菜系、氛围和价格形成差异，并显式禁止声称用户已要求非辣。
- T04把`intimate`作为正向偏好、`tasting menu`作为明确排除项，收敛为Lantern Room；Atelier因仅套餐排除，另两家不满足新增亲密氛围偏好，并解释结果只有一家。

### Decisions and boundaries

- `RECOMMENDATION_READY`只需要可用的搜索上下文，不要求所有偏好已知，也不等于已验证Availability。
- 宽泛`DINNER`下可以展示来源实际返回的候选/Slot信息，但不能声称与确切时间匹配、真实有位或可订；Exact或有界Window才应驱动Availability过滤。
- 本轮复用现有Contract，只修改Harness Golden数据、定向测试和文档；未修改生产Parser、Prompt、Web、Runtime或Provider。
- 按分级验证规则，本轮不运行全量回归和Strict Complete；最近一次全量基线仍为DGS03后的79 tests / 5 suites。

### Verification

- 见[Test Log](test-log.md)同日DGS05条目；定向Progressive Decision测试、Draft Preflight和Markdown链接检查通过。

### Next

继续批量预标注DGS06。其4个Turn完成后，首批17个Turn全部有Gold，可运行Strict Complete并进入Reducer/Scorer开发。

## 2026-08-10 — DGS04 minimum clarification and feedback-convergence Gold

### Why

DGS04人工审阅确认：部分明确的聚餐需求不应立即推荐。Agent先保留已知的今晚、部门聚餐和居酒屋，只补人数与地点；核心字段齐备后再给容量合格且有差异的候选。后续“安静一点”和“不要吸烟”也不能被压成同一种偏好：前者用于排序，后者排除存在吸烟区的候选。

### Changes

- Golden Seed提升到v0.4，DGS04三个Turn一次性写入Gold；当前共9个Labeled Turn、8个Pending Turn。
- T01为`NOT_READY`，只允许追问Party和Location Strategy，不提前检索候选；T02保存8人及Shimbashi区域后进入`RECOMMENDATION_READY`。
- T02按容量保留Kado、Nagi和Hachi，排除最多6人的Roji；三家需体现价格、子类型、氛围、连锁属性及相对位置差异。
- T03把`quiet`写入正向排序偏好，把`fully non-smoking`写入硬约束；结果收敛为Nagi和Hachi，并要求解释严格条件下不足3家。
- Grounding明确区分候选事实：Nagi可称为安静；Hachi只能根据`relaxed / semi-private`和半包间事实描述私密性，不能声称已证实安静。

### Decisions and boundaries

- 宽泛Dinner仍只达到Recommendation Readiness；Fixture Slot可展示，但不等于确切时间匹配或真实可订。
- 严格条件后只有两家时不为凑3–5家重新加入容量不足或违反禁烟要求的候选。
- 本轮复用现有Contract，只改Harness Golden数据、定向测试和文档；未修改生产Parser、Prompt、Web、Runtime或Provider。
- 按分级验证规则，本轮不运行全量回归和Strict Complete；最近一次全量基线仍为DGS03后的79 tests / 5 suites。

### Verification

- 见[Test Log](test-log.md)同日DGS04条目；定向Progressive Decision测试、Draft Preflight和Markdown链接检查通过。

### Next

继续按Episode批量预标注DGS05，再处理DGS06；全部17个Turn完成后运行Strict Complete并进入Reducer/Scorer开发。

## 2026-08-10 — DGS03 outlet discovery and approximate-time Gold

### Why

DGS03人工审阅确认：用户明确给出Brand或Restaurant后，Agent可以先搜索分店位置，再基于实际发现询问人数和时间；不能要求用户预先知道分店，也不能在工具检索前泄漏Candidate Pool事实。同时“around 7:30pm”不是Exact，也没有人工给出的Window边界。

### Changes

- Golden Seed提升到v0.3，DGS03两个Turn一次性写入Gold。T01先执行Sora Dining Outlet Discovery，搜索后才展示Ginza/Shinjuku并询问Party与Time；T02保留Restaurant和日期，新增Exact Party 3及`APPROXIMATE / preferred 19:30`。
- 新增Harness-only `outletDiscovery` Oracle，把目标分店发现与Availability Eligibility分开；Preflight要求它绑定`RESOLVE_BRAND_OUTLET`或`CHECK_TARGET_RESTAURANT`动作。
- Decision Time新增`APPROXIMATE`和`preferred`。Preflight拒绝把Approximate静默编译成Exact或发明`earliest/latest` Window。
- Candidate Fact增加`outlet-name`，使分店名称展示也有明确Fact Ref；Sora Pool增加相似名称但非目标餐厅的干扰候选。
- DGS03 T02为`RECOMMENDATION_READY`：两个Sora Outlet均可展示Fixture Slot，但`CHECK_AVAILABILITY`仍保留给Exact或有界Window，禁止声称Slot匹配用户的确切时间。
- 当前Seed为7个Episode、17个Turn、29个Candidate、417个Fact Ref；6个Turn已标注、11个Pending。
- 标注验证改为分级：纯Gold数据/文案只跑定向Eval Contract与Draft Preflight；Contract、Schema、Preflight、Reducer或Scorer变化才跑Typecheck、Build和全量基线；Strict Complete只在全部Gold完成或进入Evaluator/Baseline前运行。

### Decisions and boundaries

- Candidate Pool是Oracle世界，不是模型在工具调用前可见的Context；提前引用分店属于Process Grounding错误。
- Outlet Discovery不证明人数、时间或Availability合格，两个阶段的失败必须独立归因。
- 已解析的有限Outlet集合可以替代用户预先给出Location；这只适用于明确Brand/Restaurant目标，不放宽OPEN/CATEGORY的Location要求。
- 本轮仍为Harness-only，没有修改生产Parser、Prompt、Web、Runtime、Restaurant Domain或Provider Adapter，不新增ADR。

### Verification

- `npm run typecheck`、`npm run build`：通过。
- 定向Progressive Decision Preflight测试：11/11通过。
- `npm test`：79 tests / 5 suites / 0 failed。
- Draft Preflight：`READY_FOR_ANNOTATION`，7个Episode、17个Turn、6个Labeled、11个Pending、29个Candidate、417个Fact、0个Issue。

### Next

按批量流程预标注DGS04。若现有Contract足够，DGS04确认后只运行快速定向检查和Draft Preflight，不重复全量回归或Strict Complete。

## 2026-08-10 — Domain Knowledge, Entity Freshness and Memory staging

### Why

Restaurant Progressive Decision Eval讨论暴露了一个MVP后补会丢失历史的问题：Praxis未来的差异化不只来自公共餐厅目录，而来自“真实问法、结构化需求、解决方法、候选曝光、用户反馈与Verified Outcome”的完整Domain闭环。与此同时，品牌分店、营业状态和Availability等外部事实会变化；每次完全重搜浪费请求、延迟和模型Context，长期缓存又不能自动作为Ground Truth。

### Decisions

- 将长期数据分为Domain Entity Observation、Domain Interaction Event、Aggregate Insight和Private User Memory四层；Conversation与Task State不充当跨任务Memory。
- 外部实体保存带Source、Source Entity ID、`observedAt`、Freshness和使用限制的Observation，而不是无来源的永久真值；稳定标识、品牌分店、营业信息、Availability和条款按风险使用不同TTL。
- Stage 2C在Golden Set、Evaluator、Mutation验证和DeepSeek Baseline之后、真实Discovery之前，增加Restaurant内部的最小Entity Observation与Interaction Event Contract。
- Interaction Event覆盖结构化需求、Agent动作、检索、曝光位置、反馈、选择和Verified Outcome引用；Learning层不默认复制完整Conversation原文。
- Stage 2C只采集并用于Trace、回放和离线分析。没有足量真实数据、曝光分母、隐私评审、偏差分析和离线Eval前，不启用群体Trending、个性化排序或自动在线学习。

### Boundaries

- 本轮只更新架构与Roadmap，不实现数据库表、事件生产代码、缓存、推荐排序、用户Memory或Provider Adapter。
- 首个实现保持Restaurant Domain-owned；不创建跨Domain Knowledge Graph、通用Memory Runtime、Feature Store或向量数据库。第二个真实Domain或测量结果出现前不抽象。
- Provider缓存、展示、署名和删除继续服从Source条款；缓存Observation不能支持过期的“当前营业”“当前有位”“保证可订”等声明。
- 该调整细化现有数据归属和Stage顺序，没有改变Accepted ADR、Outcome权威、授权边界或外部副作用路径，因此不新增ADR。

### Follow-up plan

1. 完成Golden Seed人工标注、严格Preflight、Reducer、阶段Scorer和Mutation验证。
2. 运行受控DeepSeek Progressive Decision Baseline，先根据证据决定生产对话逻辑是否需要修改。
3. 在真实Discovery接入前设计最小Restaurant Entity Observation和Interaction Event Schema、保留策略及Harness断言。
4. 接一个真实Discovery Source，以Freshness-aware复用和按用途刷新完成Live Read-only验证。
5. Pilot期间只积累经治理的数据；达到样本、隐私和偏差门槛后，再分别立项Aggregate Insight、Trending和Private User Memory。

### Verification

- 文档边界检查：Stage 2C仍只增加首个Restaurant纵向切片需要、且后补会丢失Provenance和交互轨迹的最小数据基础。
- 未运行代码测试：本轮没有修改代码、Schema、Prompt、配置、Provider或构建输入。

## 2026-08-10 — DGS02 batch Gold and strict-zero-result fallback pair

### Why

逐Turn把人工产品判断转换成Contract并立即跑检查，会让标注者等待机械工作，也会割裂多轮累计状态。标注流程因此改为完整Episode预标注、人工只审语义、确认后一次性编译。DGS02同时暴露了一个关键零结果分支：严格品牌、地点、时间和人数没有共同匹配时，Agent不能静默放宽要求，也不能只返回死路。

### Changes

- Golden Seed提升到v0.2。DGS02写入人工Gold：`2026-08-11 19:00`、6人、Kinshicho `AREA`、Mori Burger `BRAND`和`AVAILABILITY_READY`；两个满足品牌、Exact Time和容量的门店为Eligible，容量不足和其他品牌候选为Forbidden。
- 增加DGS07两Turn配对Episode及独立Candidate Pool：T01固定严格Eligible为空，提供“扩大地点但保留品牌”和“保留地点但改为Burger类别”两条单约束Fallback；T02由用户明确选择保留品牌并接受Kameido，只更新Location后重新检索。
- 增加Harness-only `PROPOSE_CONSTRAINT_RELAXATION`动作和`constraintRelaxation` Oracle；Preflight要求严格Eligible为空、1–2种不重复的单约束选项、候选不重叠且`requiresUserChoice`必须为`true`。
- 增加其他汉堡品牌、容量不足、时间不匹配和非Burger干扰候选，使品牌、地点、时间、人数和类别过滤都可实际评分。
- Seed现为7个Episode、17个Turn、7个Pool、28个Candidate和374个Fact Ref；4个Turn已标注，13个Pending。
- Annotation Guide改为Episode批量预标注流程：人工只审核需求、Readiness、动作、候选和推荐差异；代码结构、禁止动作、Fact Ref、ID映射和Preflight由实现者机械完成。36个以上Episode时才触发本地标注页面建设。

### Decisions and boundaries

- 严格Eligible非空时不得触发Fallback；零结果时每个Fallback只放宽地点或品牌之一，时间和人数保持不变。
- Fallback候选在用户选择前不进入严格Eligible集合，也不修改Decision State；用户选择后只更新其明确同意放宽的字段。
- `AVAILABILITY_READY`表示信息足以查询，不代表Fixture Slot是真实空位、保证可订或已完成预约。
- 本轮只改变Harness Dataset、Preflight和评测文档；没有修改生产Prompt、Web、Task Runtime、Restaurant Domain、Provider Adapter或外部执行，因此不新增ADR。

### Verification

- `npm run typecheck`、`npm run build`：通过。
- 定向Progressive Decision Preflight测试：9/9通过，包括DGS02、DGS07、缺失同意和严格结果非空时的fail-closed Mutation。
- `npm test`：77 tests / 5 suites / 0 failed。
- Draft Preflight：`READY_FOR_ANNOTATION`，7个Episode、17个Turn、4个Labeled、13个Pending、0个Issue；严格Preflight按设计只因13个Pending Gold返回`BLOCKED_PENDING_HUMAN_LABELS`。

### Next

按新的批量流程一次性预标注DGS03的两个Turn，等待整Episode人工确认后再写回。剩余Gold未完成前不实现真实模型Baseline。

## 2026-08-10 — DGS01 Gold and broad-daypart Slot semantics

### Why

DGS01的人工标注明确了一个容易混淆的产品边界：“明天晚上”足以进入推荐，但仍不是精确用餐时间。Agent可以在推荐卡展示候选来源已经提供的Slot，帮助用户下一步选择；如果把这一步标成精确Availability检查，Evaluator会错误奖励Agent声称Slot与用户尚未给出的确切时间匹配。

### Changes

- 将`DGS01-T01`从Pending改为人工`LABELED` Gold：东京日期`2026-08-11`、`DAYPART/DINNER`、Exact Party 4、Ginza `AREA`、Western food `CATEGORY`，Readiness为`RECOMMENDATION_READY`。
- 将Ginza、Yurakucho near Ginza和Marunouchi的4个Western Fixture列为Eligible；Gold要求展示3–4个候选，并优先形成`PRICE_BAND`和`CUISINE`子类型差异。
- 增加1个同区域、同日期且有晚餐Slot的非Western干扰候选，并列入`forbiddenCandidateIds`；避免类别过滤因Candidate Pool没有负例而无法评分。Seed总量更新为22个Candidate和291个Fact Ref。
- 将本轮唯一允许动作定义为`SHOW_RECOMMENDATIONS`；重复追问核心字段和`CHECK_AVAILABILITY`等动作列入禁止项。
- Slot窗口保留为允许引用的Fixture Fact，同时增加禁止声明：不得声称Slot符合用户的确切用餐时间、已验证真实世界Availability、保证可订或已经完成预约。
- 同步Eval Plan v0.4、Annotation Guide、Harness Design、Eval Skill和Roadmap；Golden Seed进度变为1个Labeled Turn、14个Pending Turn。
- 增加DGS01语义回归测试，固定Daypart、Area、动作路由、多样性轴和Slot Grounding边界。

### Decisions and boundaries

- `DAYPART`下展示已有Slot仍属于推荐表达，不等于执行精确Availability查询；只有Exact或有界Window满足`AVAILABILITY_READY`后，主动检查对应时段才使用`CHECK_AVAILABILITY`。
- 4个Eligible候选和1个非Western干扰候选均来自虚构Fixture；“展示Slot”不代表Live Read-only查询，更不代表真实空位或预约能力。
- 本轮只修改Harness-only Gold、测试和规划文档；没有修改生产Parser、Prompt、Web、Task Runtime、Domain State、Provider Adapter或外部写路径，因此不新增ADR。

### Verification

- `npm run typecheck`、`npm run build`：通过。
- 定向Progressive Decision Preflight测试：6/6通过。
- `npm test`：74 tests / 5 suites / 0 failed。
- Draft Preflight返回`READY_FOR_ANNOTATION`、22个Candidate、291个Fact、1个Labeled Turn、14个Pending Turn和0个Issue；严格Preflight按设计只因剩余14个Pending Gold返回`BLOCKED_PENDING_HUMAN_LABELS`。

### Next

继续由人工标注DGS02。剩余14个Turn全部完成并通过严格Preflight后，再实现Eval-only Reducer和阶段Scorer；当前不运行真实模型Baseline。

## 2026-08-09 — Stage 2C Golden Seed Contract and S0 Preflight

### Why

Eval v2已经确定分阶段因果链，但在真实模型运行前仍缺少机器可验证的数据Contract、人工标注入口和Seed Candidate事实。直接编写36个完整Case会让未稳定的字段和Scorer造成大规模返工；先建立6个Seed，才能让人工Gold、Reducer和Evaluator围绕同一结构迭代。

### Changes

- 新增Harness-only `DecisionEvalDataset` Contract，覆盖Decision State/Patch、Readiness、Action、Clarification、Candidate Pool、Recommendation Oracle、Grounding Fact Ref，以及Pending/Labeled两阶段标注状态。
- 新增Golden Seed v0.1：6个Episode、15个Turn，E1/E2/E3各2个，并覆盖`OPEN / CATEGORY / BRAND / RESTAURANT`；所有Gold保留为`PENDING_HUMAN_LABEL`。
- 新增6个Candidate Pool、21个虚构Restaurant/Outlet和278个结构化Fact Ref，用于后续S6–S8评分；没有真实餐厅、地图、Availability或Provider数据。
- 新增S0 Dataset Preflight，校验版本、ID唯一性、Tokyo时间、Decision State、Candidate/Fact引用、Pending门禁、Action冲突、Retrieval/Selection边界和Grounding引用。
- 新增`npm run eval:decision:preflight`供标注阶段运行；新增`npm run eval:decision:preflight:complete`作为进入Reducer/Scorer前的严格门禁。
- 新增Golden Seed Annotation Guide，明确人工决定语义和允许动作，代码只负责结构检查；同步Eval Plan v0.3、Harness Design、Eval/Test Skill、README和文档索引。

### Decisions and boundaries

- 标注者拥有Gold语义判断；实现代码不根据模型输出生成或修改Gold。当前`annotationFocus`只提示覆盖点，不是答案。
- Seed全部进入`REGRESSION`；Holdout在Evaluator稳定并扩充36个Episode时再独立创建，避免Seed开发过程污染Holdout。
- Preflight只做确定性静态校验，不调用DeepSeek、不读取`.env`、不写Task/数据库，也不接真实Discovery或预约平台。
- Candidate均为明确的Fixture世界事实；即使包含Availability字段，也不能报告成真实空位。

### Verification

- `npm run typecheck`、`npm run build`：通过。
- 定向Progressive Decision Preflight：5/5通过。
- `npm test`：73 tests / 5 suites / 0 failed；首次沙箱运行仅7个既有HTTP/SSE测试因禁止监听`127.0.0.1`失败，允许本机回环监听后完整通过。
- Draft Preflight返回`READY_FOR_ANNOTATION`且0个结构Issue；严格Preflight按设计返回`BLOCKED_PENDING_HUMAN_LABELS`和15个待标注Turn。

### Next

由人工按Episode标注15个Turn；每完成一个Episode运行Draft Preflight。全部Gold通过严格Preflight后，实现Eval-only Decision State Reducer、S1–S5 Scorer和首批单点Mutation，不提前调用真实模型。

## 2026-08-09 — Progressive Decision Eval v2 causal-stage iteration

### Why

Eval v2最初已经从单轮Slot Extraction升级为E1/E2/E3多轮决策，但四张Scorecard仍然是横向结果汇总。一次Journey失败时，无法稳定判断首因究竟是当前消息提取、历史状态合并、Readiness、动作路由、候选检索、选择排序、Grounding，还是Dataset、Provider和Harness本身。

对Connector、Browser和Memory Eval方法的复盘表明，端到端质量必须拆成可独立验证的生命周期：Connector区分是否触发、结果使用和Grounding；Browser区分正确接管、环境阻塞、工具失败与Agent失败；Memory区分读取、检索内容、应用、写入和增量收益。Praxis采用这一故障定位原则，但不照搬以LLM Judge为主的评分方式。

### Changes

- `Restaurant Progressive Decision Eval v2`提升到v0.2，建立`S0 PREFLIGHT`及`S1–S10`因果链，覆盖State Extraction、State Accumulation、Readiness、Action Routing、Clarification、Candidate Retrieval、Selection/Diversity、Response Grounding、Journey和Operations。
- 四张State、Dialogue Policy、Recommendation、Journey Scorecard改为阶段指标的汇总视图；每张分数必须并列显示有效样本、Preflight排除和`BLOCKED_BY_UPSTREAM`数量。
- 每Turn增加首错阶段、根因码、Blocked下游和`DOWNSTREAM_OBSERVATION`；允许失败样本用Gold状态或Gold候选池做诊断重跑，但诊断结果不得覆盖Baseline。
- 动作路由增加应触发/不应触发覆盖及Precision、Recall、F1；正确澄清被定义为`APPROPRIATE_INTERMEDIATE_SUCCESS`，不再按“没有完成推荐”计失败。
- 推荐链路拆为固定池检索、合格性过滤、集合选择/多样性和Grounding；上游检索失败不重复归因给Selection。
- 增加至少18个单点Mutation的Evaluator Verification Set、Context消融集和Scorer可信度规则；自然语言主观质量首版只做人审抽检，LLM Judge未经人工标签校准不得成为发布门禁。
- 同步Harness Design、Eval Skill和Roadmap Stage 2C的实现与完成标准。

### Decisions and boundaries

- Eval Plan继续是评测规范的Source of Truth；Dev Log记录关键迭代的时间、原因和取舍。两者职责不同且足以还原决策，不新增第三份Eval日志，避免重复维护和口径漂移。
- 本次仍是Harness-only设计，不修改Web、生产Parser、Restaurant State、Task Runtime、真实Discovery或预约路径，不需要新增ADR。
- Fixture Oracle、Real Model Mock World与Live Read-only分别报告；Provider、配置、Dataset或Harness问题不能伪装成模型质量零分。
- 确定性字段、状态、路由、候选和Fact Ref使用确定性Scorer。未来引入LLM Judge时必须先验证Scorer本身，而不是用另一个模型总分替代根因分析。

### Next

按新顺序实现Dataset/Preflight、Eval-only State Reducer、阶段Scorer和Mutation归因，再实现Fixture Retriever、Model Contract与6个代表性Episode。确定Fixture Oracle能识别单点故障后，才扩充36个Episode并发起受控真实DeepSeek Smoke。

## 2026-08-09 — Restaurant Progressive Decision Eval v2 initial plan (v0.1)

### Why

真实餐厅需求通常从“今晚吃饭”“明天和朋友聚餐”等低确定性表达开始。用户先明确时间、人数或场景，再通过少量追问和有差异的推荐形成菜系、地点、预算、氛围与排除项。当前8条单轮Intent数据和Exact Match评分主要验证Slot Extraction，不能评估这一渐进决策过程。

### Changes

- 新增Draft `Restaurant Progressive Decision Eval v2`，定义E1核心已明确、E2部分明确、E3高度开放三种初始确定性，以及`OPEN / CATEGORY / BRAND / RESTAURANT`目标粒度。
- 定义Recommendation、Availability和Booking三层Readiness，明确“明天晚上”“6–8人”和`FLEXIBLE`地点策略的标注语义。
- 定义36个Episode/至少100个Turn的首版覆盖矩阵、Regression/Holdout、稳定性重复运行、推荐Fixture和人工标注规则。
- 建立State、Dialogue Policy、Recommendation和Journey四张Scorecard、P0/P1/P2错误等级、分组报告和产品集成候选门槛。
- 现有8条数据降级为Single-turn Extraction Contract；2026-08-08的1条真实DeepSeek结果只作为Connectivity Smoke。
- Roadmap Stage 2C改为先实现Harness-only Eval v2并建立真实模型Baseline，再接一个Live Discovery来源；Baseline之后才单独决定生产对话状态是否修改。

### Boundaries

- 本次只修改Eval/Harness计划和工程文档，不修改Web、Task Runtime、Restaurant State、Parser、Prompt、数据集或Evaluator代码。
- Eval v2通过不能报告为产品已支持多轮偏好形成；所有Model输出仍不得创建Task Event、Authorization、Attempt或外部副作用。

### Next

评审并接受Eval v2规则后，从6个代表性Episode、静态Validator和Deterministic Scorer开始实现；Fixture管线通过后再扩充到完整数据集，真实模型调用继续使用显式付费门禁。

## 2026-08-08 — Persistent local configuration for repeated Eval

### Why

真实DeepSeek Eval会持续运行；仅依赖每次终端临时注入变量既容易遗漏，也不利于稳定复现。配置必须同时保持服务端边界和付费网络门禁，不能因此让普通测试隐式读取Key或连接真实数据库。

### Changes

- 新增可提交的`.env.example`，列出开发数据库、可选Pilot身份覆盖、DeepSeek Eval、成本估算及真实PostgreSQL smoke所需变量；新增的本地`.env`及其他`.env.*`一律Git忽略。
- `npm run dev`、`npm run eval:intent:deepseek`和`npm run test:postgres:live`使用Node原生`--env-file-if-exists=.env`加载本地配置；没有`.env`时命令仍可启动并在各自既有的必填配置/付费门禁处fail-closed。
- `npm test`、`npm run build`和Fixture Eval没有加载`.env`，以避免本地Secret改变普通测试或引入意外付费网络。
- README、Data/Security、Eval与Test Skill同步配置位置、边界和付费开关的恢复要求。

### Next

用户在本机复制模板并填写真实DeepSeek凭据后，先将样本限制为1条运行首个受控真实Intent Eval；结果应单独写入Test Log，不能与Fixture分数混报。

## 2026-08-08 — Stage 2B Persistent Agent Shell

### Why

Stage 2A只能在单进程内完成一次Fixture搜索，浏览器刷新、服务重启或换设备都会失去Task，也没有用户级Case、Conversation和Activity体验。Stage 2B需要先证明Personal Agent能够安全地“记住并继续”，再投入真实模型和Discovery Provider。

### Changes

- 新增`0005-agent-workspace` Migration，持久化Pilot用户、Session Token Hash、Conversation和Conversation Message；原始Access Token和Session Token不写数据库。
- 新增`PersistentRestaurantAgentApplication`与`PostgresAgentWorkspaceStore`，将`Conversation → Restaurant Case → Root Task`映射到现有`PostgresTaskRuntime`；Fixture Search/Revalidation Command经Durable Outbox Worker执行。
- Local Web/API替换为Pilot Session、Case列表/详情、Conversation Message、Candidate Selection和SSE Snapshot路由；删除未发布的Stage 2A进程内Task API，不保留兼容分支。
- 新增响应式Desktop/Mobile Web Workspace，展示Conversation、Restaurant Artifact、Case Status、Pending User Action和权威Event Activity。
- 实现Stage 2B Golden `W01–W05`，并增加页面Contract、缺失信息续聊和乐观并发场景。

### Decisions and boundaries

- Case、Activity和Artifact均为可重建Projection；Conversation中的Agent文本即使声称“已预约”也不能生成Task Event、Authorization、Attempt或Outcome。
- SSE采用建立连接时发送最新完整Case Snapshot的最小协议；Event Activity ID从持久化Event ID确定生成，不引入消息总线或独立Projection数据库。
- 当前身份仅是本地Pilot Access Registry，不是生产SSO；所有业务查询仍从HttpOnly Session解析可信`userId`，客户端不能自报用户。
- 仍为Fixture Model/Search，没有通知、真实Provider、Authorization入口、`EXTERNAL_WRITE`或预约副作用。

### Next

进入Stage 2C：先以固定数据集运行受控DeepSeek Intent Eval，再接一个经能力核验的Live Read-only Discovery来源；不在此之前扩展通用Workspace DSL或多Agent结构。

## 2026-08-08 — Web-first Personal Agent architecture reset

### Why

从Praxis的长期产品需求重新评审后，现有Task Runtime、Policy和Verifier被确认是现实事务的必要安全内核，但不足以构成完整Personal Agent产品架构。Desktop/Mobile Web第一阶段还需要跨会话恢复、用户可见Case、Activity、结构化Domain Workspace和前后台Context边界；继续直接进入Live Provider会验证搜索连接，却不能验证“Agent会记住并持续推进”的核心价值。

### Changes

- 新增ADR-0006，建立Agent Workspace、Durable Case Runtime和Action Control Plane三层边界；ADR-0001、0003和0005继续有效。
- 新增Agent Gateway and Workspace架构文档，区分Conversation、Interaction Session、Case、Activity、Artifact和Pending User Action。
- 明确MVP中Restaurant Case映射一个Root Task，Case是可重建Projection，不新增第二套Domain State或提前扩展通用Case Graph。
- MVP PRD和User Flows增加Responsive Desktop/Mobile Web、跨会话恢复、`Needs You`和Activity体验。
- Roadmap插入Stage 2B Persistent Agent Shell；原Live Discovery和Live Availability顺延为Stage 2C/2D。
- Interfaces、Data/Context/Security、Agent Orchestration、Task Runtime、Arch Guard、Harness和README同步新边界与阶段编号。

### Decisions and boundaries

- 本次只修改文档，不修改代码、Schema、Provider、模型调用或现实副作用行为。
- Agent Gateway仍位于TypeScript模块化单体中，不拆微服务，不采用KiroCrew、本地Agent Runtime或通用App Platform作为生产基座。
- Stage 2B继续使用Fixture Model/Search，先证明用户隔离、持久恢复、SSE和权威状态投影；真实DeepSeek和Provider从Stage 2C开始。
- Conversation、模型解释和Working Plan不是Task或Outcome权威；后台Run从结构化Case/Task State和最小Context重建。
- 通知渠道、第三方消息Surface、通用Artifact DSL和跨任务Memory不进入Stage 2B。

### Next

按Stage 2B单独编写实现计划，明确用户身份、Conversation持久化、Case Projection、Activity映射、SSE重连、Responsive Web和Harness验收；在该纵向切片完成前不继续扩展冻结的Runtime能力。

## 2026-08-07 — Stage 2A Local Fixture Search Web

### Why

Stage 1已能验证Runtime安全，但没有用户可操作的产品入口。Stage 2A需要用最小Web纵向切片证明“英文请求 → Intent → 候选 → 选择”能够穿过服务端、Domain和Runtime，同时不能假装已接入DeepSeek或真实本地平台。

### Changes

- 删除Restaurant `schema 1 → 2` State迁移、测试与缺失Trace默认补全；Restaurant State升级为Schema `3`，所有Event Trace现在必填且必须匹配Task Run。
- Restaurant状态机以`UNDERSTANDING`创建；`INTENT_PARSED` Event只在Parser验证后进入，缺阻塞字段进入`NEEDS_INPUT`，完整Intent进入`SEARCHING`。
- 新增Local-only Fixture ModelGateway和Fixture Restaurant Search，驱动现有`RestaurantIntentParser`与Task Runtime；没有Secret、网络调用、Authorization或`EXTERNAL_WRITE`。
- 新增`LocalRestaurantSearchApplication`、本地HTTP/HTML Server与`npm run dev`，支持创建Task、补充消息、查询Task和选择候选；选择后只到`AWAITING_AUTHORIZATION`。
- 新增`npm run eval:search:fixture`与本地HTTP API测试，覆盖完整输入、最小澄清和选择停在授权前。

### Decisions and boundaries

- Fixture ModelGateway是本地测试替身，明确返回`provider: FIXTURE`；不替代或模拟真实DeepSeek质量。
- Fixture Search候选的来源、价格、空位和条款全部标记为演示数据，不能用于预约或对外展示。
- Stage 2A直接使用Restaurant内的Fixture Search实现，不提取通用Search Runtime；实体合并、来源并发、预算、缓存和真实Availability等由Stage 2B/2C真实需求驱动。
- 删除旧路径遵循Pilot前无真实数据时不保留兼容层的项目规则；PostgreSQL建表迁移仍保留，因其服务于本地数据库初始化而非旧业务State兼容。

### Next

Stage 2B先以固定Intent Eval接通DeepSeek，再核验并接入一个真实只读Discovery来源。

## 2026-08-07 — Roadmap, implementation simplicity and expansion balance review

### Why

Stage 1已经建立了安全Runtime和较深的基础设施测试，Goal Graph、Scheduler与未来Domain Harness也为后续扩展提供了实证。问题不是提前考虑扩展本身，而是缺少投入上限和重新启动条件；继续按横向基础设施清单开发会增加不可见的代码和验证成本。需要同时保留扩展地基与最小端到端交付，并明确Pilot前不保留无消费者兼容路径。

### Changes

- 将Stage 1收口为已完成的Minimal Control Plane and Harness；跨Domain Registry、自动激活、生产Trigger Factory与Coordination状态机不再作为退出条件。
- 将Stage 2拆成Local Mock E2E、单一Live Discovery来源和单一Live Availability路径；Stage 3先连通Mock Booking，再只接一个Controlled Live-write Adapter；Stage 4按路线、取消、变更与Pilot逐层增加。
- 在`AGENTS.md`、Arch Guard、Planning和Test Skill中增加简洁实现、删除旧路径、纵向交付、避免推测抽象与适度测试规则。
- 区分普通fallback与安全不变量：不建立备用Provider、多级重试或兼容链；Authorization、幂等、`OUTCOME_UNKNOWN`和False Success保护继续保留。
- 明确Pilot前Schema默认直接更新代码与Fixture；只有存在生产数据、进行中现实任务或外部消费者时才建立迁移。
- 修正文档中PGlite场景数量与两个已实现合成Domain的状态。
- 增加三类扩展处理方式：难以后补的安全地基现在实现，未来能力现在只预留Design边界，第二个真实使用者或当前路径阻塞后再扩建。
- 为Goal Graph/Scheduler、Child Task Registry、生产Trigger、Coordination、Search Runtime与Multi-Agent记录明确的冻结状态和重新启动条件。

### Review findings

- 当前61个测试对Runtime、Policy、Verifier、PostgreSQL事务与Provider Contract的覆盖是合理的，但不能证明Web、DeepSeek质量、Search质量或真实Provider能力。
- Goal Graph、Scheduler和G01/G02被认定为已完成且有价值的有界架构探针；进一步扩展现在冻结，后续测试预算优先用于Web/API/Search同一纵向路径。
- Restaurant旧State迁移和缺失Trace兼容没有真实数据消费者，列入Stage 2A开始时的直接删除项；本次治理审查不修改业务代码。

### Next

开始Stage 2A：先删除两条Pilot前兼容路径，再建立英文Web到Fixture候选选择的最小本地端到端产品。

## 2026-08-07 — Stage 1I Synthetic Runtime Domains: Recurring Shopping and Long-running Case

### Why

Task Runtime的价值不只在Restaurant单次预约，还在跨时间等待、外部事件与用户再次介入。需要用合成Domain检验已有Task Definition、Trigger、Trace、Outbox和Lifecycle是否可复用，但不能把合成测试误称为第二个真实产品Domain，也不能据此继续抽象业务模型。

### Changes

- 新增Harness-only Recurring Shopping状态机：`MONITORING → AWAITING_CONFIRMATION → PREPARING_ORDER → MONITORING`。
- 新增该Domain的Trigger Event Factory，将持久化`RECURRENCE_DUE`映射为`CYCLE_DUE`；每个周期均回到`WAITING_USER`。
- Shopping确认只产生`PREPARE_SIMULATED_PURCHASE`，模拟完成后产生`SCHEDULE_NEXT_CYCLE`等待命令；没有`EXTERNAL_WRITE`或真实购买。
- 新增Harness-only Long-running Case状态机：准备、等待外部、请求材料、材料补齐、再次准备、解决。
- 通过PGlite持久化Runtime测试G01/G02，包括Trigger、版本、Trace、状态转换、Outbox Command及禁止外部写入断言。

### Decisions and boundaries

- 两个状态机位于`src/harness/synthetic/`，不属于产品Domain、不接真实API、没有Web/API入口，也不计为第二个真实使用者。
- 不以合成Domain为理由实现跨Domain Registry、万能实体或Workflow DSL；`CREATE_CHILD_TASK`和自动激活仍保留为proposed。
- Scheduler只投递Domain Event；当前Harness手动将`SCHEDULE_NEXT_CYCLE`映射为持久化Trigger，生产WAIT Command到Trigger桥接仍未实现。

### Next

在有第二个真实Domain前不扩大通用Runtime抽象；可先运行首轮受控DeepSeek Eval，或开始Stage 2的Search Runtime与只读Discovery纵向切片。

## 2026-08-07 — Stage 1H Restaurant Intent Parser and Controlled Real Model Eval

### Why

Gateway只证明请求可被受控发出，不能证明模型结果可被安全使用或被统一评测。需要让Restaurant Domain拥有Prompt和不可信输出校验，并让真实模型Eval复用Fixture数据集，而不是用手工演示替代质量基线。

### Changes

- 新增`RestaurantIntentParser`：输入包含Task ID、用户文本、Tokyo参考时间；输出仅为已验证Draft或结构化表单降级，不写Task State。
- 固定`restaurant_intent_parse` purpose、`v1` Prompt、`restaurant-intent-draft@1` Schema引用、10秒请求预算、500输出Token、`temperature: 0`和关闭Thinking。
- Prompt明确JSON格式、样例、Tokyo相对时间、阻塞字段、无事实不臆测，以及将用户文本视为不可信数据。
- JSON解析、`finish_reason=STOP`和Domain Validator三层校验；JSON/Schema不合格最多重试一次，Provider失败不盲重试。
- 收紧`RestaurantIntentDraft` Validator：拒绝未知根/嵌套字段、无效日历日期、空数组项、非整数JPY预算及“字段已填却声明缺失”的矛盾结果。
- 新增`npm run eval:intent:deepseek`。它复用8条Golden样例，强制`PRAXIS_ALLOW_LIVE_MODEL_EVAL=1`，可限制样本数，并记录模型调用、重试、延迟、Token和透明成本状态。

### Decisions and boundaries

- Parser是Domain语义，不提升为通用Workflow或Core抽象；它经注入的`ModelGateway`调用模型，保持Domain → Core的依赖方向。
- 模型输出即使通过JSON模式仍不可信；只有Domain Schema通过才能返回`PARSED`。后续应用层仍须决定是否创建Task和进入Search。
- 真实Eval是付费网络请求，默认拒绝执行；没有显式开关时在读取Key或构造Gateway前退出。价格未配置时报告`NOT_CONFIGURED`，不硬编码或猜测当前价格。
- 本轮未读取真实Key、未运行DeepSeek、未产生数据库、平台或预约副作用。

### Next

在用户显式配置后，先以1条样例运行真实DeepSeek Eval并归档独立结果；同时继续Stage 1的跨Domain Child Task、自动激活、Domain Trigger Factory和合成Domain验证。

## 2026-08-07 — Stage 1G DeepSeek Model Gateway Provider Contract

### Why

Intent Eval已经有数据集、Validator和计分器，但仍缺少一个不让模型跨越Runtime/Policy边界的服务端入口。先实现Provider Contract，才能在下一步把同一数据集接到真实DeepSeek，而不把Key、Prompt、重试或Provider错误散落进Domain或Web。

### Changes

- 新增Core `ModelGateway` Port：强制`taskId`、purpose、promptVersion、输出Schema引用、timeout、fallback和响应格式。
- 新增DeepSeek非流式Chat Completion Adapter；固定Provider URL，不向Provider发送Praxis内部Task ID。
- Key与模型名仅从服务端`DEEPSEEK_API_KEY`、`DEEPSEEK_MODEL`读取；缺失时fail-closed，不提供默认模型或前端配置通道。
- 将429、非2xx、网络失败、超时和畸形响应映射为稳定`ModelGatewayError`；不记录Provider响应正文。
- 新增不含Prompt/Completion正文的`ModelInvocationRecord`，记录Provider、模型、版本、Schema引用、延迟、Token、状态码和错误码。
- 增加Fake Fetch Connector Contract测试，覆盖请求序列化、配置缺失、限流、超时、畸形响应和脱敏Telemetry。

### Decisions and boundaries

- Gateway只负责传输、超时、错误分类和最小Telemetry；它不解析Restaurant Intent，不写Task State，不执行Tool或外部业务动作。
- `JSON_OBJECT`只约束Provider输出格式，仍是不可信输入；后续Restaurant Parser必须用现有Domain Validator重新校验。
- 本轮没有读取真实Key、没有网络DeepSeek调用，也没有宣称Provider连通或模型质量已验证。

### Next

实现Restaurant Intent Parser：构造版本化Prompt、调用Gateway、解析JSON、交给`RestaurantIntentDraft` Validator，再以受控开关运行真实模型Eval。

## 2026-08-07 — Stage 1F Restaurant Intent Eval Harness

### Why

自然语言理解是Restaurant Agent的入口质量门，但功能测试无法衡量模型是否漏掉日期、人数、区域或错误追问。应在接入DeepSeek前先固定数据集、Schema和计分器，避免模型接入后才临时定义“好”的标准。

### Changes

- 定义`RestaurantIntentDraft`：允许缺少阻塞字段，但限制时区、字段形状和缺失字段枚举。
- 实现不可信模型输出的Schema Validator；未通过时不能进入Runtime。
- 新增8条英文/中英混合Intent样本，覆盖Tokyo相对时间、预算、约束和四类阻塞字段缺失。
- 新增字段准确率、阻塞字段漏检、不必要追问、无效输出和P0错误计分器。
- 增加`npm run eval:intent:fixture`及三条Eval Contract测试。

### Decisions and boundaries

- `FIXTURE`结果只证明Eval管线和Golden数据集正确，不代表DeepSeek效果。
- 真实模型Eval必须经服务端Gateway、显式Key、固定Prompt版本和同一数据集运行；不在本轮伪造真实分数。
- Eval不产生Task State、搜索或任何外部副作用。

### Next

实现DeepSeek Model Gateway与显式受控的真实Intent Eval；没有Key时继续保留Fixture/Replay路径。

## 2026-08-07 — Stage 1E Persistent Trigger/Scheduler

### Why

长期事务和日常用品复购需要在未来时间被安全唤醒。不能由常驻模型Loop记忆时间；Trigger必须持久化、可重领、可去重，并能阻止陈旧状态被错误唤醒。

### Changes

- 增加通用Scheduled Trigger、Lease、Event Factory和Scheduler Contract。
- 增加Migration `0004-task-triggers`和PostgreSQL Trigger Store。
- Scheduler使用到期Claim、确定性`event:trigger:{triggerId}`、Trace传播、租约恢复和有界失败。
- 期望Task版本陈旧时Trigger进入`OBSOLETE`，不向已变化的Domain状态投递Event。
- 扩展真实PostgreSQL Smoke，使Booking子Task由Scheduler完成，再推进Goal聚合。

### Decisions and boundaries

- Scheduler只投递Domain Event；Domain决定Trigger何时创建、到期时表达哪种业务语义。
- Scheduler失败不会创造外部写入；真实定时进程、Webhook、周期计算和Shopping业务不在本轮范围。
- Accepted ADR不变，未引入模型Loop或跨Domain业务依赖。

### Next

实现三个合成Domain中的Recurring Shopping最小状态机，复用Scheduler验证周期唤醒和用户确认边界。

## 2026-08-07 — Stage 1D Goal/Task Graph

### Why

Recurring Shopping、Travel和协调类事务需要多个Task在同一用户目标下独立推进。Restaurant不能因此依赖未来Domain；Runtime需要先持久化关系、依赖和聚合规则。

### Changes

- 增加通用Goal、成员关系、依赖条件和Readiness Contract。
- 增加Migration `0003-goal-task-graph`，创建`goals`、`goal_task_memberships`和`task_dependencies`。
- 实现`PostgresGoalGraph`：Task只能属于一个Goal；支持父子指针、关键Task、同Goal依赖、环检测、Readiness和Goal聚合。
- 实现`G03-coordination-parent-child`：两个关键子任务均成功后Goal才达成；失败上游使依赖Task进入`BLOCKED`。
- 扩展真实PostgreSQL Smoke，实际创建Task Tree、依赖和Goal，再验证清理。

### Decisions and boundaries

- Goal关系存于独立Graph，不写入Restaurant Domain State，Runtime不依赖具体Domain。
- 当前只连接已创建的Task；`CREATE_CHILD_TASK` Command、Definition Registry和依赖满足后的自动启动仍未实现。
- 该切片不新增模型、用户授权或外部副作用。

### Next

实现Trigger/Scheduler的最小持久化与Fake Clock恢复路径，再用Recurring Shopping和Long-running Case合成Domain验证通用性。

## 2026-08-07 — Real PostgreSQL Smoke环境建立与验证

### Why

PGlite可以验证嵌入式SQL与事务语义，但不能替代真实PostgreSQL进程、`pg`连接池和本机网络连接验证。

### Changes

- 安装PostgreSQL 17并仅启动本机临时实例，监听`55432`端口；未注册开机自启服务。
- 创建隔离的`praxis_smoke`数据库，使用显式写入开关运行`npm run test:postgres:live`。
- Smoke通过后只读确认两项迁移已应用，`tasks`、`task_events`和`task_commands`均为0行，临时Task已清理。

### Decisions and boundaries

- 本机`praxis_smoke`是开发验证数据库，不含生产数据、真实用户信息或Provider凭据。
- 本次只证明本机真实PostgreSQL连通和Smoke路径；不代表生产高可用、权限模型、备份或负载测试完成。

### Next

继续实现Stage 1剩余的Goal/父子任务与Trigger/Scheduler，不把数据库环境建设扩展成生产部署工作。

## 2026-08-07 — Stage 1C Recovery Coordinator

### Why

`RECOVERY_REQUIRED`只能阻止External Write盲重试，但如果它不进入Domain状态机，Restaurant Task会永久停在`EXECUTING`。恢复层必须保守地把“可能已经提交”的情况转入验证，同时保持Runtime与具体Domain解耦。

### Changes

- 实现通用`RecoveryCoordinator`和Recovery Queue Contract，使用租约Claim待恢复Command。
- Recovery Event固定使用`event:recovery:{commandId}`，先持久化Event，再把Command标为`RECOVERY_DISPATCHED`。
- 增加Restaurant Recovery Event Factory，把不确定的`COMMIT_BOOKING`映射为`COMMIT_UNCERTAIN`。
- Restaurant Task随后进入`OUTCOME_UNKNOWN`并生成一个`VERIFY_BOOKING`；不会生成第二个`COMMIT_BOOKING`。
- Outbox Reconcile改为匹配确定性的`event:command:{commandId}`，避免把System Recovery Event误认为Adapter结果Event。
- 增加Schema Migration `0002-recovery-coordinator`和PGlite端到端恢复场景。

### Decisions and boundaries

- Core Coordinator只负责Claim、Dispatch、去重和完成标记；Domain决定恢复Event含义。
- Recovery失败只重试Event投递，不重试外部预约写入。
- 真实PostgreSQL、生产Queue进程和运营侧人工调查仍未验证或实现。

### Next

继续Stage 1的Goal/父子任务与Trigger/Scheduler最小实现，再用合成Domain验证Runtime通用性。

## 2026-08-07 — Stage 1B PostgreSQL、Outbox与Worker恢复保护

### Why

内存Runtime无法证明服务重启、重复投递和Worker崩溃时不会丢状态或重复预约。需要把Task State、Event和Command放进同一PostgreSQL事务，并为External Write建立比普通重试更保守的恢复路径。

### Changes

- 增加参数化SQL数据库Port与基于`pg`连接池的生产Adapter；事务使用同一Checked-out Client。
- 增加版本化PostgreSQL迁移，创建`tasks`、`task_events`、`task_commands`和迁移记录表。
- 实现通用`PostgresTaskRuntime`，原子写入State、Event和Outbox Commands，支持乐观锁、重复Event和Definition版本检查。
- 实现Outbox Lease、完成、失败、租约过期恢复和Causation Reconcile。
- 实现`DurableCommandWorker`：确定性结果Event先持久化，再完成Command。
- 无副作用Command失败或租约过期后可有界重试；External Write没有结果Event时进入`RECOVERY_REQUIRED`，禁止重新Lease。
- 增加PGlite数据库集成套件，覆盖事务回滚、Outbox插入失败、重复Event、陈旧版本、读Command重领、External Write恢复保护、Worker失败和Restaurant Runtime实例重建。
- 增加默认关闭的`npm run test:postgres:live`，要求显式测试数据库URL和写入确认，并清理临时Task。

### Decisions and boundaries

- PGlite只验证同一套Postgres SQL和事务行为，不作为真实PostgreSQL、备份、权限或网络故障验证。
- 当前环境没有PostgreSQL服务或容器Runtime，因此真实PostgreSQL smoke未运行。
- `RECOVERY_REQUIRED`现在是持久化Command状态；自动驱动Restaurant进入Verify仍需Recovery Coordinator。
- 本轮没有模型、Browser、真实预约平台或现实事务副作用；Accepted ADR不变。

### Next

实现Recovery Coordinator，将External Write的`RECOVERY_REQUIRED`安全映射为Domain恢复Event和Verify Command；随后补Goal/父子任务、Scheduler与合成Domain，完成Stage 1剩余退出条件。

## 2026-08-07 — Stage 1B Trace、Proof与Run Artifact

### Why

在PostgreSQL Event Store和Outbox落地前，先固定一次运行、Execution Attempt、Evidence和Outcome之间的因果关系，避免把无法追溯或无法迁移的数据结构写入生产持久化。预约成功必须由确定性Domain Verifier证明，不能信任Adapter或模型自行宣布。

### Changes

- 为Task Snapshot、Event和Command增加Schema `1` Causal Trace，覆盖`runId`、`attemptId`、`correlationId`、`causationId`和`actor`。
- Runtime为旧Mock Event补充稳定Trace默认值，并把Event的Correlation/Causation传播到Command。
- Policy通过后、Commit前创建Execution Attempt；Commit和Verify Command绑定同一Attempt。
- 将Booking Evidence语义从Core移回Restaurant Domain，实现`BookingProofBundle`和确定性Completion Verifier。
- Restaurant State升级为Schema `2`，增加Schema `1 → 2` Evidence Fixture迁移。
- Mock Verification增加字段冲突和错误Attempt模式；两者均只能进入`OUTCOME_UNKNOWN`。
- Restaurant Harness可导出包含Fixture、Trace、Policy、Authorization、Evidence、Side Effect和Outcome的Run Artifact。
- 扩展测试入口以收集Domain测试；当前基线为26 tests / 4 suites，其中11个为Restaurant Mock Harness场景。

### Decisions and boundaries

- Causal Trace属于通用Runtime Contract；Restaurant完成字段和Proof语义留在Domain，不建立万能Evidence模型。
- Event Trace为兼容旧Fixture暂时允许缺失；生产持久化Event必须完整保存。
- Run Artifact当前只返回Mock内存对象，不写文件、不包含真实PII，也不代表Replay或Live能力已实现。
- 本轮没有DeepSeek、数据库、Browser、网络请求或真实外部写操作；Accepted ADR不变。

### Next

设计并实现PostgreSQL Event Store、事务Outbox和Command Worker，使当前Trace、Attempt、Proof与Side Effect边界可以在进程崩溃后恢复。

## 2026-08-06 — Agent Harness生态调研归档

### Why

外部Agent项目开始集中建设Runtime、权限、沙箱、Evidence、Verifier和长任务恢复。需要记录其中对Praxis有价值的工程机制，同时避免把Coding Agent的Multi-Agent和工作台复杂度未经验证地带入Restaurant Booking MVP。

### Changes

- 新增Agent Harness生态项目调研记录，整理可明确识别的公开GitHub项目和对Praxis的映射。
- 记录Completion Conditions、Booking Proof Bundle、Causal Run Journal、fail-closed Capability和Harness Run Artifact等设计候选。
- 明确Multi-Agent、通用工作台、自进化Harness和任意Shell Sandbox当前不进入MVP。
- 在文档索引增加Research与讨论记录入口。

### Decisions and boundaries

- 本次只归档研究结论，不修改Accepted ADR、Roadmap或生产接口。
- 外部项目作为模式参考，不作为已选依赖或经过生产验证的能力。
- 后续采用任何设计候选前，仍需更新对应Architecture文档并按Planning Skill定义验收。

### Next

在Stage 1生产持久化设计时评估Event/Command因果元数据、Restaurant完成条件和可回放Harness Run Artifact。

## 2026-08-05 — Stage 1首个Mock垂直切片

### Why

先用Restaurant这一真实Domain验证通用Runtime、授权、执行与Outcome边界，避免在DeepSeek、真实平台和数据库接入前形成不可回放的Agent Loop或过早的万能抽象。

### Changes

- 建立Node.js 24 + TypeScript模块化单体脚手架和可重复的typecheck/test/build命令。
- 实现通用`TaskDefinition`、内存Task Runtime、Lifecycle、Event去重、乐观版本与Command Log。
- 实现MVP一次性Authorization Policy、Side Effect Ledger与并发/重放幂等保护。
- 实现Restaurant结构化Intent之后的选择、Revalidation、授权、Commit、Verify和Unknown状态机。
- 实现Mock Search、Availability、Booking Executor、Verifier、Fake Clock和Restaurant Harness。
- 自动化8个Bootstrap场景；没有真实API、Browser或外部写操作。

### Decisions and boundaries

- 本切片采用内存存储，只验证行为，不替代PostgreSQL、事务Outbox和Queue。
- UI的一次`Book this`后续可以组合选择与授权；Runtime仍把选择、Revalidation、Authorization和Policy保留为独立Event/Command边界。
- 明确失败会清除活动Attempt并返回选择；不明确结果保留Attempt并禁止换候选。

### Next

设计并实现生产持久化、事务Outbox与Worker恢复边界；之后进入DeepSeek Intent Parser和Search纵向闭环。

## 2026-08-05 — 开发前文档体系初始化

### Why

Praxis 已从方向讨论进入产品定义和原型实施前阶段，需要在coding前固定MVP范围、通用Task Runtime、Search、模型边界、授权、执行、验证和Harness依据，避免后续Agent根据零散对话自由发挥。

### Changes

- 建立`docs/INDEX.md`和产品、架构、Domain、Integration、Harness文档。
- 建立5个Accepted ADR。
- 建立`AGENTS.md`以及arch-guard、planning、test、eval、post-change-verify skills。
- 建立Roadmap、Dev Log和Test Log。
- README增加开发文档入口。
- 保留全部根目录日期讨论文档。

### Decisions captured

- Tokyo英文Web餐厅预约为MVP。
- 30秒目标内返回最多3家真实可订候选。
- 用户只选择并授权一家，不自动换店。
- DeepSeek为首个模型后端，但无状态和副作用权。
- 通用Task Runtime + Domain Packages；单Agent；模块化单体。

### Next

按Roadmap进入Stage 1：先建立Runtime和Harness，再接真实搜索与预约平台。
