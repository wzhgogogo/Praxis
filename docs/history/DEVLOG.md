# Development Log

- Status: Accepted
- Document revision: 4.65
- Last updated: 2026-09-18
- Source of truth for: 非trivial开发与文档变更的时间记录
- Related ADRs: [ADR Index](../decisions/README.md)
- Related documents: [Current Status](../STATUS.md), [Roadmap](../roadmap.md), [Test Log](TEST-LOG.md)

> Historical record only. Current capabilities and next gate are maintained in [Current Status](../STATUS.md).

## 2026-09-18 Open-ended result target and party-boundary completion

The continuous selection slice now distinguishes semantic target scope rather than treating every recommendation as a three-card UI cap. `OPEN_ENDED` recommendations carry a default result target of three qualified distinct restaurants, an explicitly requested count replaces it, and `SPECIFIC_OUTLET` or legacy unclassified targets retain their original behavior. The Reducer carries this target into the existing Agent Context; the Validator rejects a short batch while an ordinary cursor, fact, or availability read remains legal, and only records an unmet smaller batch after all such reads are unavailable. The target survives local browse, shortlist and feedback events, but a semantic condition revision clears it with the rest of request-bound investigation state.

The Semantic Interpreter now retains existing target scope/count in its bounded context, so a later user revision cannot silently erase that classification. Its party transport contract has additional controlled cases for enumerated participants, explicit count correction, open groups, unknown extra attendees and a generic dated romantic recommendation; these tests prove the Proposal → Compiler → Draft path preserves a declared count and never adds one downstream. They do not claim that an external model will infer natural language correctly. The user-visible feedback recognizer accepts the bounded same-meaning phrase “These are too expensive” and Chinese/Japanese counterparts without converting it into a numeric budget.

The persistent Web composition also now has the exact shortfall path that was previously only covered by the Domain validator: discovery returns a–f but supplies grounded facts only for a; the controlled Agent selects the legal b/c/d fact read, then the existing Router, Reducer and HTTP projection present a/b/c. It asserts one discovery, one fact read, four model-boundary calls, no availability access, the met target, and no premature second discovery. This is a regression of composition behavior, not a new selection algorithm or a model-quality claim.

No Gold/Holdout, paid model, external source, booking or push occurred in this incremental offline change. The current loopback-enabled full suite is 433/433. Real-model scope classification, current Google results and Live continuation behavior remain separately authorized evidence gaps; original-researcher review remains pending.

## 2026-09-18 Continuous Restaurant selection session and Google pagination

Google Text Search is now a real query-bound pagination path: an initial discovery obtains at most two 20-item pages, deduplicates stable outlet IDs and retains the next cursor; page-two failure preserves accepted page-one candidates and its retry cursor. Details requests keep `nextPageToken` out of their field mask. A cursor mismatching the authoritative intent, repeating a token, or reaching exhaustion cannot be reused by a retrieval hint.

`PRESENT_RESULTS` is no longer a terminal Task lifecycle state. The durable selection session records delivery, viewing, shortlist and qualitative feedback independently of `checked`. A same-condition next batch first reuses three unshown grounded candidates without a model/source/browser read. If that queue is inadequate it enters the existing single Agent loop with a three-candidate, unshown-only target and its Router-bound cursor; no local ranker, second loop, fallback provider or direct booking path was added. “Too expensive” is recorded as feedback and never converted into a budget. Explicit semantic revisions still clear request-bound candidates and evidence while preserving shortlist IDs only as recheckable memory.

ADR-0027 supersedes ADR-0014’s terminal-result interpretation, and the Domain/Interface/Capability documentation now reflects the paused-session semantics. This is an offline implementation slice only: no Gold/Holdout changes, paid model, external source, booking, commit or push occurred. The next required evidence is a separately authorized bounded real source/model continuation run and original-researcher review.

## 2026-09-17 H001 semantic request ceiling 30 seconds and one Live retry

按用户明确要求把 `RestaurantSemanticInterpreter` 的单次请求从固定 10 秒改为导出的 30 秒契约常量；Live runner 仍以 `min(30 秒, 总截止剩余时间)`调用 Provider，未扩大五分钟总预算、模型／Google／浏览器额度、站点许可或副作用能力。现有语义 request-contract 断言覆盖该值，防止再次悄然落回 10 秒。

用户随后明确授权 H001 直接重跑一次。冻结新隔离副本后，`LOCAL_CHROMIUM` 实际走完整语义→发现→同候选身份→日期／人数控件→库存→呈现路径：一石三鸟得到 TableCheck 19:00／2人的新鲜可用证据，Inase 同条件为请求绑定无位，Jinnan 保留为控件未确认。没有把未查的其余七个候选或 Jinnan 的 UNKNOWN 说成无位，也未提交任何预约。独立 evaluator@16 对被呈现的一石三鸟给出 qualified YES；这只验证该次资料，未扩大为全站、全候选或长期库存承诺。

## 2026-09-17 H001 current-repair single Live attempt

按用户指令冻结当前脏工作树的最小 `src`／`web-skills`／运行配置副本；只在副本的 development case 将 H001 文案和语义日期表达改为 `tomorrow`，以 `h001-tomorrow` 单独运行。没有改变产品源码、Gold、Prompt、规则、权限或预约路径，也没有运行 H002–H005。运行器的当前外层 deadline 路径和既有 `LOCAL_CHROMIUM` 组合被实际调用，明确限制为 300 秒、30 模型、10 Google、每候选 50 次浏览器操作。

该次执行在 semantic 阶段停止：Interpreter 把首个 `restaurant_semantic_interpret` 请求固定为 10 秒，DeepSeek 记录 `TIMEOUT`，故尚未到达 Google、候选身份、TableCheck/Tabelog 入口、日期／人数控件或库存证据。启动时 Tokyo 已进入 9 月 18 日，正常的 `tomorrow` materialization 产生 9 月 19 日 19:00；这不是库存或用户条件被改写。原始 started/result/evaluator sidecar 均保留，未补跑；独立评价将 qualified 标为 UNKNOWN，除零次观察的谱系记账外无可评价执行结论。此记录只发现总预算与单请求 timeout 不一致的运行阻断，不能作为地址／入口修复已经在真实页面改善的声明。

## 2026-09-17 Independent identity rule regression matrix

按用户要求补强确定性匹配测试，没有继续修改 Terra 的生产规则。新增共享地址比较的三组参数化规则测试：同楼层语言/大小写/全半角/分隔符变化，楼层缺失与地址不足，明确楼层/门牌/邮编冲突；正反方向均检查，避免电话捷径掩盖地址比较结果。扩展既有 TableCheck 历史正常对照至七家，并省略来源电话、要求 `HIGH_NAME_AND_ADDRESS`；Tabelog 复用一条地址接入对照，两个平台的楼层冲突改为同电话反例。规则变体只在共享层维护，没有把矩阵复制到两个 Adapter 或新建评测框架。

使用隔离临时目录将新增矩阵分别运行在修复前 HEAD、按历史差异重建的仅大小写修复版本、当前实现：前两者均出现目标断言失败，当前通过。原始与当前结果分开保留；历史提取字段离线复核不冒充完整页面 Replay 或 Live。测试进入默认 npm test，无私有 Holdout、付费调用、外站访问、提交或推送。

## 2026-09-17 Afternoon H001 identity/entrance follow-up

Repaired the two independently reproduced H001 regressions without changing H002/H003/H005 or provider fallback strategy. Shared address comparison now removes unit text after the same case normalization used for unit extraction, so the source-observed Japanese `地下1階` and Latin `B1F` spellings do not leave a false street number. Explicit distinct floors remain a conflict and an omitted floor remains non-conflicting. Both TableCheck and Tabelog exercise the same helper through their production resolvers.

TableCheck now validates each available Google link field independently before choosing a public same-origin merchant entry. A real Maps URI or an invalid custom lead can no longer preempt a valid Google website URI pointing to TableCheck. The fixed-source transport was corrected to model Google Maps and website fields separately, rather than putting a TableCheck URL in `googleMapsUri`. No provider, global cache, retry loop, permission, model, Live source call or external write was added.

Independent follow-up caught that the initial case-only fix still left Japanese `1階`/`2階` in the street-number comparison because an ASCII word boundary after `階` did not hold. The shared unit pattern now drives both token extraction and removal, with a Unicode delimiter/end constraint for the Japanese suffix. The same historical batch confirms Inase, Hajime, Teppen and Sushi Labo as complete matches while basement-versus-ground and B1F-versus-1F remain conflicts.

## DEV-2026-09-17-H001-H005-SINGLE-ROOT-FACT-JUDGMENT

按用户明确授权，先冻结当前代码和H001–H005原始请求后，逐例各执行一次5分钟/50模型/50 Google/每候选50浏览器动作上限的Hybrid Live Read-only；原始artifact与evaluator@15 sidecar均新建而未覆盖历史。H001为`NO_VERIFIED_RESULT`，H002因缺party size补问，H003/H005到时限取消，H004展示事实型推荐。没有预约、登录、外部写、Gold/Holdout改动或第二浏览器循环。

以实际轨迹选择且只修一项根因：`ModelRestaurantFactJudgment`此前仅为NEGATIVE HARD调用，导致已有同候选、HIGH identity的具体`bar`/`lounge bar`来源类型无法成为正向`good for drinks`的可审计判断，复杂正向条件只能未证实。Fact Judgment Prompt@1→@2；同一受限模型现在可为POSITIVE HARD生成`verifiedHardCriteria`，但必须引用同候选具体来源类型事实。无引文、正向`CONFLICT`和宽泛类型一律不接纳；它不是主观排名、官网替身或状态写入，也没有改变人数推断、预算表示或HARD/SOFT策略。

局部固定资料红绿回归、相关Hybrid组合、typecheck、arch和完整本机371/371通过。单次H003后测未到达新增路径：本次语义把`good for drinks`和team dinner都判SOFT，Agent直接空位读取，TableCheck的`REQUEST_SELECTION_UNCONFIRMED`与Tabelog`BROWSER_TIMEOUT`导致`EXECUTION_FAILURE`。故不以本地测试替代真实链路、不触发五例修复后回归，也不修第二个根因；详细模式、额度、artifact和限制记于TEST-LOG。

## DEV-2026-09-16-BROWSER-READ-FINAL

按用户继续完成 P0–P4 的授权，完成 Tabelog 来源库存/分店绑定、TableCheck 非标准下拉与范围内 TIME、当前请求禁用时段核验、跨页商业事实与来源笔记、两店比较/修订和新商户验证。未新增生产框架或第二浏览器循环。真实轨迹推动修复限定商户调查扩展、Web 新任务竞态、搜索候选误入结果卡及库存过期展示；过期定时重绘不追加网络请求。导出保留由事件编译出的替代许可，独立 evaluator/rubric@15 修复地区前缀与许可窗口误判，新增未授权/扩大许可及错误地区反例；旧 execution/evaluation 保留。最终真实两轮结果、所有失败、源码快照、限制与清理见[最终复核](BROWSER-AGENT-FINAL-REVIEW-2026-09-16.md)。无 commit/push 或预约提交，未改用户原有工作区成果。

## DEV-2026-09-16-WORKFLOW-CONVERGENCE

按用户对H001–H005长期反复的复盘，将切片承诺、最小来源探针、早期审查、冻结验收和偏离主动提醒写入Planning；AGENTS只增加入口，Test维护故障定位与复验范围，Post-change要求按原承诺交付。提醒不新增例行审批，不要求正式前端提前开发，不改变产品目标或Live授权。仅工作规程变化，无业务代码、能力声明或STATUS变更。

## DEV-2026-09-16-BROWSER-AGENT-P1-P2-CURRENT-OFFLINE

- Continued the existing P1/P2 chain after the latest review repair without restoring the revoked broad GET permission. Browser controls now retain accessibility-facing slider display text separately from numeric positions; the existing production Executor fixture validates a two-ended JPY range, lower-bound-only explicit fixture permission, target modal scrolling and page-applied result feedback.
- Context moved `restaurant_agent_context@6`→`@7` and Agent prompt@12→`@13`. Current candidate commercial notes carry a fact field, display value and evidence provider only; raw URL/evidence/source-entity internals and superseded same-source facts stay outside the model. A real Agent transport regression confirms the model boundary receives only that compact projection.
- A reducer regression begins from `CANDIDATE_FACTS_REFRESH_REQUESTED` and proves a new website fact bundle supersedes only the stale same-source record: cancellation and course price update, while the old no-show and any omitted facts remain unknown. Updated trajectory persistence/harness schema assertions with the intentional Context version change.
- Commands: typecheck; affected 28/28; authorized local Chromium 13/13; arch check; build; full authorized loopback `npm test` 356/356. The first complete run identified two stale v6 test expectations, then the rerun passed. No paid model, real source, Gold/Holdout, booking/write, commit or push. P1/P2 still lack positive real-site control contracts and original-researcher independent review; P3/B13/B14 remain pending. Exact status and minimum observation scope are in the [delivery addendum](BROWSER-AGENT-RESTAURANT-P0-P4-DELIVERY-2026-09-16.md).

## DEV-2026-09-16-H004-EVALUATOR

2026-09-16 H004评分器误判已局部修复：diagnostic-evaluator/rubric@14将SOFT措辞语义复核与实际来源观察适用性分开，适用于展示和无结果调查记录；不放宽门店、日期、时间、人数、HARD或证据新鲜度检查。原始H004 artifact离线重评：REQUIRED_EVIDENCE从NOT_SATISFIED变为SATISFIED，AUTHORITATIVE_CONDITIONS仍NOT_EVALUATED，FINAL_CLAIM和整体结果由失败变为待复核（qualified UNKNOWN），不宣称自动2/5成功；原始执行和@13评价未覆盖，SHA核对一致。评分器42/42定向测试及arch通过；首次全仓检查受并发agent-decision.ts语法错误阻断，该错误随后消失；最终typecheck/build通过，npm test为354/356，剩余2项为并发Agent Context版本升至7但Harness/PGlite断言仍期望6，本轮未修改这些文件。未调用模型或来源Live。

执行观察与无结果调查不再以SOFT文本不同作为无效条件；语义待复核仍进入最终结论，不自动同义判定。复用已有测试，新增断言先复现失败再修复。

[报告](../../.eval-artifacts/h004-evaluator-fix-2026-09-16/REPORT.md)。

## DEV-2026-09-16-TIME-SEMANTICS

用户授权仅修两个时间点并重跑20条。EVENING新增为可校验daypart，显式映射取代非AFTER_WORK默认为下午；窗口由代码唯一物化、保留原文和basis。Proposal envelope/预算/人数/强弱设计不变，prompt@12、temporal-policy@3。H003时间-only预期同步dataset@4，旧Gold与历史证据保留。复用既有回归文件，保留其他工作区浏览器改动。2026-09-16 时间语义局部修订完成：prompt@12增加EVENING，evening/night由代码temporal-policy@3按同日18:00–23:00物化；after work保持17:30–22:00且不再自动生成criterion。预算、人数和HARD/SOFT规则不变。当前开发dataset@4仅移除H003重复after work条件。离线352/352、固定semantic fixture15/15及typecheck/arch/build通过。原20条真实模型复测20/20结构合法、20调用、24694ms、107909 tokens；Q03/05/06晚间、Q02/15/16时间-only验收通过，Q01/17/18原时间行为保持。范围外仍有波动：Q06本次first date补出2人，Q02team dinner仍SOFT，Q10新增target；不声称全语义正确或长期稳定。旧快照与本轮之间还有预先存在的备选时间prompt/schema变化，故非严格隔离A/B。没有餐厅来源Live或预约写操作。

## DEV-2026-09-16-BROWSER-AGENT-P0-P4 — shared observation/action offline slice

- 按 Browser Agent P0–P4 计划先保留已有脏工作树，不 reset/stash/commit/push；Stagehand 4.1.0 的小探针结论为不采用。其观察候选需要独立环境/会话，不能作为现有 Executor 的规划器或平行执行循环，未新增依赖。
- 共享 `BrowserTaskExecutor` / `ModelGateway` strict wire 升为 `browser_read_action@2`。在已有 opaque control registry、单 session、来源 allowlist、权威日期/人数、取消及预算边界内，增加 checkbox 明确设值、range 单键步进、observed region 有界滚动及 modal 背景 target 排除；动作后重新读 control state，避免 URL/文本不变时错误等待。没有给模型 selector、URL、脚本、State、证据写入或提交能力。
- Local 与 Cloudflare runtime 复用同一 registry 引用解析，Playwright observation 补 `selected` options、checked/range/scroll state。真实 Chromium fixture 覆盖语言 modal、selected≠options、checkbox/range/scroll；站点 Skill 同步为只读控制提示。P2 使用当前已存在的 Router/Domain/Evidence/Web/Harness 离线组合回归，未创建独立 demo 或旁路。
- P3 未获新的真实模型/Live授权，未运行私有Holdout、新商户或真实来源；P4 只完成交付材料，原研究者独立 Review 未执行。完整 B1–B14 状态和未覆盖范围见 [交付记录](BROWSER-AGENT-RESTAURANT-P0-P4-DELIVERY-2026-09-16.md)。

## DEV-2026-09-16-SEMANTIC-PROMPT-11 — clarity revision, quality gate incomplete

- 用户要求先看/改prompt再测；依据ADR0009/0026保留开放criteria及既有语义职责。prompt@10→@11，schema@3/5000预算不变；合并TARGET、明确封闭人数推断例外、解释必要活动能力与体验偏好、约束可选修饰范围、近似预算不得变硬上限，以及singletonNEGATE无value的现有Contract。
- 不写入已暴露案例原文、Gold或固定“特征→强度”答案；不改Compiler/Reducer、Prompt外业务规则、Adapter或Evaluator。已有请求契约测试迁移prompt版本，未新增prompt文案镜像测试。更新当前Eval文档标识，历史artifact不动。
- 实际10条语义模型诊断仍有drinks/team dinner强度、after-work独立criterion、near关系及无约束误提取偏差；当前版本是开发实现，不宣称完整语义验收。离线和逐例真实模型证据见同日TEST-LOG/STATUS及semantic-prompt-11报告。未提交/推送。

## DEV-2026-09-16-SEMANTIC-OUTPUT-BUDGET — per-call cap5000

- 按用户明确要求，将Semantic Interpreter单次maxOutputTokens由500提升到5000，解决H003与H001复杂变体已观察到的length截断。它是输出上限，不是输入或会话累计限制；不改变prompt@10、schema@3、模型、temperature、thinking、timeout或重试。
- 导出一个预算常量供实际模型请求和现有semantic Eval manifest共用，避免manifest仍记录500。复用既有Interpreter请求契约测试新增5000断言；原实现红色500!==5000，修改后完整Mock通过。未新增测试套件、兼容路径、模型调用策略或业务抽象。
- 原始H001、复杂变体输入/Gold及500-token原始结果保持不变；独立冻结副本进行单次同输入Live复验，结果与未验证范围见本日TEST-LOG及STATUS。未读取/运行私有Holdout，未提交/推送。

## DEV-2026-09-15-LIVE-OBSERVED-CONTROL-REPAIR — browser input wiring

- 用户在Mock通过后授权Live read验证。首轮原始H003已调查10候选并正常END_READ，但3个TableCheck候选的真实模型人数选择都把`dom:`引用传给CSS解析器，导致`REQUEST_SELECTION_UNCONFIRMED`。另有独立语义条件降级及官网身份支持缺口，不能把全部失败归因网站访问。
- 当前局部切片只修Local与Cloudflare session的fill/select，复用click已使用的Playwright控件注册表。真实BrowserTaskExecutor仍持有权威参数、只读动作验证及动作后观察；没有改Prompt、Gold、来源顺序、预算或外部写权限。
- 既有Chromium Harness扩展同一参数化场景覆盖两种session：模型传输和网络固定，实际DOM必须显示正确日期及人数。修复前5通过/2失败，修复后7/7；完整Mock343/343及typecheck、arch:check、build通过。Cloudflare只验证session代码在本地Chromium的行为，未调用Cloudflare服务。
- 保留首轮Live、运行前后patch/hash和独立Evaluator @13产物；同请求同预算仅追加一次修复后Live。结果与剩余限制见同日TEST-LOG。没有提交或推送。

## DEV-2026-09-15-TERRA-REVIEW-REPAIR — current offline implementation

- 用户要求修复a093764审查问题并先验证Mock。当前纵向切片为“原始请求→真实内部/来源组合→刷新或完成→独立诊断”，沿用ADR-0022/0025/0026，不新增模型、网络调用、重试、平台或执行权限。
- 复合Google→官网fact check保留各来源尝试（包括UNKNOWN）；Reducer在同请求内累计`supersededEvidenceIds`，显式刷新也废弃前次复合check中本次未重新证实的原始事实。原始readEvidence不改写。展示与Context复用`restaurantCurrentFactEvidence`，派生判断的全部原始支持引用都必须仍有效且关联HIGH身份。
- Evaluator/rubric升至@13：只从真实有序来源轨迹核验旧事实是否被后续同来源读取或显式刷新替代；已执行但来源失败的fact read可失效旧支持，不能产出正向证据。未调用生产资格函数，也未改变一般无结果调查充分性未评估的边界。
- H001–H005原文与Gold未改；替换旧测试自定义Adapter ports为实际Google客户端/搜索、官网组合和LiveBrowserAvailability/Resolver，仅Mock传输和页面。补上先前模型替身遗漏的SOFT条件，逐例调用独立Evaluator；这里是替身完整性修正，不是模型质量提升。实际来源组合揭露的空位展示缺Google fact identity引用已一并修复。
- 外部读取组合接入可注入clock以固定离线观察时刻；生产默认时钟不变。两条既有Hybrid主测试新增/参数化为官网失败、Google先失败、关门刷新反例；原H001–H005测试原地替换，未新建第二套产品执行器。
- Mock与验证结果见同日TEST-LOG。未提交、推送、Live或外部写入。


## 2026-09-15 — DEV-2026-09-15-CONCRETE-VISIT-READ-CLOSURE

- 当前切片：以 [ADR-0026](../decisions/0026-concrete-visit-goal-and-reception-semantics.md) 收敛具体到访的用户承诺、行动参数边界、库存/接待方式证据和只读调查闭环。验收是当前 H001–H005 原文经实际 Hybrid composition 走完整内部路径并接受独立诊断；模型传输、HTTP 与浏览器页面固定为离线替身，未给生产代码增加 case-ID 分支或成功回退。
- H001/H002/H003/H005 现在交付 `AVAILABILITY`，H004 为 `RECOMMENDATION`。H002记录封闭 first-date 情境的两人推断依据；H003保留 “after work” 原文并仅以代码物化 17:30–22:00 的宽查询窗。候选发现仅要求地点；缺人数的空位请求在重读取前补问，行动 Validator 不再把交付目标误当作每个 discovery 动作的必需参数。
- 接待方式与库存独立建模：仅明确来源页面证据可授予 walk-in/both；没有预约入口不能推导 walk-in；同候选、同日期、同人数的当前明确无 slot 才能形成 `UNAVAILABLE`。刷新已展示 slot 会重新读取 slot，失败不会恢复旧成功。
- Context 升至 `restaurant-agent-context@6`，为模型提供有界候选事实/缺口、来源尝试、库存/接待摘要与代码派生合法动作；Resolver、Reducer 和 Assessment 保留局部观察。通用 Browser Agent 的模型驱动回退继续是既有路径，未新增站点专用完成捷径、Provider、重试或写路径。
- 诊断器升至 `restaurant-hybrid-read-diagnostic-evaluator@12`：接受 Router 的 `TERMINAL` 已执行观察，并独立核验 END_READ lineage 与空 slot 的候选/日期/人数/负库存证据；产物评价没有复用生产端成功判断。完整离线验证、环境限制和未覆盖范围见同日的新 TEST-LOG 条目。

## 2026-09-15 — DEV-2026-09-15-READ-ACCEPTANCE-ALIGNMENT (superseded in part by the concrete-visit closure above)

- 当前切片：统一已接受ADR-0020/0024的用户承诺与H001–H005当前标注，不替换浏览器、不调整产品Prompt、不修其他harness行为。验收为原文保留、当前Runner只读新口径、真实loader/materializer/evaluator字段对照及反例通过。
- 原始五条content逐条保留；旧YAML/Rubric按字节归档。新`restaurant-read-development@2`仅保留semantic参数预期与人工验收说明，删除重复必用工具、人数/时间和空位要求；归档Rubric未伪称接入评分。H001/H003改正为推荐，H002去掉强制推定人数并收窄到原文排除，H003保留after work而不编造钟点，H005修正示例东京时间。
- Runner迁移当前cases路径并记录版本/哈希/暴露状态；materializer只更新预期，不重写用户消息里的日期/时间。产品、Domain与Eval入口同步；未把Gold、验收说明或案例排除词表注入模型。
- 旧成功Artifact不重写、不按新目标重命名为通过。END_READ评分、负向证据、resolver部分事实与Context/行动收敛仍待修复；无Live、付费调用、提交或推送。

## 2026-09-15 — Shared read-execution repair after combinatorial defense

- 用户审查指出组合oracle、Evaluator lineage和变异名称三处盲点后，先修测试：候选守恒由独立来源样本/显式Google ID判定；Evaluator `@11`只接受同候选、适用请求的`EXECUTED` observation所产出的引用证据，但允许search直接产生足够的事实推荐证据；M02恢复为真正的跨批prior-check丢失变异，M03–M05按实际破坏重新命名/构造。
- 随后只修防线捕获的共享执行缺陷：语义事件按State版本获得唯一id；Reducer累计不同事实批次；Google耗尽时停止判断同时检查合法facts和availability动作；Google→官网混合批次保留每个候选的来源范围；slot UNKNOWN保留已观察的HIGH identity/restaurant fact，仍不生成availability evidence或Offer。
- 未增加来源fallback、模型调用、重试、外部写路径、Prompt或H001–H005输入。所有红色默认回归在既有入口转绿；真实模型/网站/Live范围继续未验收。

## 2026-09-15 — Five-contract combinatorial regression defense

- 仅扩展既有Hybrid真实组合入口与diagnostic evaluator：保留Interpreter、Compiler、Runtime、Context、Validator、Router及Grounding，只替换离线模型传输、HTTP与浏览器页面。未修改业务执行、Prompt、H001–H005输入或生产来源Adapter。
- 为需求保真、状态累计、证据归属、行动可达、完成/停止分别接入独立期望：确定性边界覆盖零/一/整批/跨批、正反序、成功/冲突/UNKNOWN/失败、刷新、取消、请求更新和来源额度耗尽；固定种子`0x5eedc0de`生成八个有界场景，并把首个失败缩到两候选、逐个读取。
- 在`/tmp/praxis-contract-mutant-*`隔离副本运行源码变异，且先验证原始对照通过；Evaluator对公开合成artifact的M03–M08从`structuredClone`产生，不改写历史artifact。初始防线发现了取消后语义更新被固定event id去重及多项共享执行缺陷；其修复与最终门禁记录在本条上方的同日后续切片。

## 2026-09-12 — Web read execution completion and independent artifact wiring

- 以`fd0dfb0`冻结复现为先，修正`GENERIC_BROWSER`读取在取消/deadline时创建却未参与await的reject promise：现在浏览器分支只等待Provider收束，Router仍传递AbortSignal、清理deadline和父级listener，并保留`BROWSER_RUNTIME_FAILED`/`BROWSER_TIMEOUT`归因；没有全局吞错、重试或无限等待。
- Agent loop在每次已持久化State transition后通知拥有该读取的Application，Web SSE因此获得后台调查进度。用户编辑保留版本保护：落后于当前版本但其间只有Agent/Adapter推进时，取消旧读取后按最新权威版本应用；存在中间`USER`事件或客户端未来版本仍返回`StaleTaskVersionError`。旧读取需完成取消才会应用新语义，晚到结果不能覆盖新条件。
- 事实推荐的展示引用改为当前`factChecks`所列事实和每一来源事实匹配的HIGH identity；派生判断必须经其候选绑定的原始支持事实取identity。历史`RESTAURANT_FACT`没有删除，只不再作为当前展示依据。诊断器同步以目标而非人数判定：未指定日期/时间的推荐不要求营业或availability，指定访问时段的推荐仍需要适用营业事实，availability目标仍需要日期、人数和slot。
- 普通Web复用现有diagnostic run/evaluator格式，而非另建评分平台：读取结束后保存不含原始消息/DOM的`WEB_READ` artifact（最终snapshot、trajectory、来源尝试、展示引用、停止及可得资源）；以单独sidecar补评。缺少成本或browser-model计数标为`UNKNOWN`，Eval写入失败不会影响读取结果。没有改Provider、增加网站fallback、读取Secret、运行Live或外部写路径。

## 2026-09-05 — Repository review findings consolidated into a draft improvement plan

- 按用户要求，将AGENTS、项目Skills、文档、配置、浏览器诊断和局部源码职责的Review合并为[Repository Improvement Plan](../REPOSITORY-IMPROVEMENT-PLAN.md)，标记为`draft / not integrated`。
- 清单包含14项工作，按先修正文档与规则、随下一浏览器切片落实、按实际需要重构排序，并列出文件范围、验收和停止条件。
- 排除人工标注数据、Golden Set、私有Holdout与已有测试artifact；前轮涉及移动标注输入的建议明确留待专项范围，不在本次实施。
- 本次只整理清单、添加INDEX入口和本条记录，不实施清单中的整改，不改变Accepted ADR、代码、当前能力或现有未提交实现。

## 2026-09-04 — Eval-only Tabelog explicit human challenge resume experiment

### Why

H001的LOCAL_CHROMIUM可建立浏览器，但Tabelog在读取搜索页前显示`Just a moment...`。需要先验证“用户主动完成网站要求后，Praxis能否保持同一Browser Session/Page并继续只读Grounding”，而不是加入stealth、CAPTCHA自动化或产品接管UI。

### Changes

- `PRAXIS_LOCAL_CHROMIUM_INTERACTIVE=1`使显式`LOCAL_CHROMIUM`使用headed Playwright `launchPersistentContext`和gitignored `.eval-artifacts/local-chromium-profile`；正常结束只关闭page/context，不自动删除profile，也从不读取用户既有Chrome profile。
- `PRAXIS_EVAL_ALLOW_TABELOG_MANUAL_INTERVENTION=1`才启用Tabelog的脱敏`USER_INTERVENTION_REQUIRED` pause。它保留candidate、请求日期/时段/人数、provider、session metadata和当前安全URL/title；终端只等待用户回车，adapter随后只对同一page做一次snapshot。它不导航、不自动重试、不接收cookie/token/HTML，也不提供CAPTCHA操作能力。
- challenge仍在时保持`BOT_CHALLENGE`；challenge解除后仍走既有search/detail identity、高置信度同Outlet和slot-level availability路径。Hybrid runner仅在这两个eval门禁同时开启时移除本次Browser read deadline，并将协调器时间留给明确的人工暂停；默认Local/Cloudflare行为不变。

### Result

一次且仅一次headed persistent H001启动命令在Semantic Interpreter返回`MODEL_FAILURE`后、任何Google/Browser/Tabelog请求前退出。没有生成新live artifact，也没有进入`USER_INTERVENTION_REQUIRED`；因此真实同会话恢复尚未证明。没有Authorization、Booking、付款、取消、PII提交或其他外部写操作。

## 2026-09-04 — H001 TableCheck→Tabelog read-only availability source chain

### Why

Tabelog的反爬挑战不能成为H001唯一Availability来源；同一`CHECK_AVAILABILITY`需要在不扩大Agent权限或放宽同门店证明的前提下，确定性尝试另一个真实预约来源。

### Changes

- 新增Restaurant-only `RestaurantAvailabilityProvider`和固定`AvailabilitySourceResolver`，只接受两个当前真实使用者：TableCheck先行、Tabelog后备。Agent action、Decision Context和HARD Validator均不包含provider名称；resolver把来源尝试仅保存在execution metadata。
- 新增只读TableCheck Browser Adapter：由候选名生成受限的公开guide URL hint，以JSON-LD/DOM/tel link同Google exact phone或name+full address建立HIGH Outlet，之后仅访问带`start_date`和`pax`的公开reservation GET页，读取明确bookable slot。没有登录、个人信息、支付、确认或预约提交。
- 所有来源共用原有Grounding不变量。一个provider的challenge、403/页面不可用、runtime或解析失败会继续后备来源；所有来源均不能得出安全结论时，候选为`AVAILABILITY_SOURCES_EXHAUSTED`。新增TableCheck 403归因，避免把公共错误页解析为餐厅或`ENTITY_MATCH_UNCERTAIN`。

### Live observation

只运行一次LOCAL_CHROMIUM H001（`2026-09-04T08-32-54-786Z-h001.json`）：Google Discovery成功，三个候选的TableCheck guide URL均返回`403 Forbidden`，Tabelog三个搜索页均为`Just a moment...` challenge。resolver每个候选都先记录TableCheck provider failure、再记录Tabelog `BOT_CHALLENGE`，最终安全`AVAILABILITY_SOURCES_EXHAUSTED`；未获得HIGH identity、slot、availability或`PRESENT_RESULTS`。

### Boundary

没有新增动态registry、LLM provider选择、挑战绕过、Google Discovery变化、booking、Authorization、支付、个人信息输入或任何外部写入。

## 2026-09-04 — H001 Tabelog identity diagnostics and challenge attribution

### Why

LOCAL_CHROMIUM H001 reported `ENTITY_MATCH_UNCERTAIN`, but its artifact retained neither the selected search result/detail identity chain nor the field-by-field comparison needed to distinguish parser, normalization, wrong-branch and source-access failures.

### Changes

- Added an eval-only identity diagnostic sink around the existing Tabelog read adapter. It records sanitized search title/URL, selected result and requested/final/canonical detail URLs, extracted name/address/phone and their JSON-LD/DOM/tel-link provenance, normalized values, field comparisons and the resolver's HIGH/non-HIGH reason. It does not enter Restaurant Domain evidence or Agent decision context.
- Parser extraction retains field provenance and canonical URL without retaining raw HTML. Diagnostic URLs strip untrusted query parameters other than the search term, so transient challenge tokens are not written to subsequent artifacts.
- Recognize Tabelog's `Just a moment...` challenge at search/detail acquisition and return fail-closed `BOT_CHALLENGE` before the identity gate. Grounding now preserves that stable failure reason instead of misattributing a browser-visible challenge as `ENTITY_MATCH_UNCERTAIN`.

### Live observation

Exactly one `LOCAL_CHROMIUM` H001 run produced `2026-09-04T08-00-55-386Z-h001.json`. Google discovery returned three candidates and their national phone numbers, but every Tabelog search page was `Just a moment...`; parsed result count, inspected result count and detail-page count were all zero. Therefore no Tabelog phone, address, JSON-LD, canonical detail page, branch choice or Google↔Tabelog field comparison was available. The blocker is source anti-bot access before identity acquisition, not a reason to relax HIGH matching or expand Google fields.

### Boundary

No identity threshold, Google FieldMask, availability parsing, H001 HARD constraint, browser-provider behavior or write path was weakened or broadened. The run made only read-only Google/Tabelog requests and performed no Authorization, booking, payment, cancellation or PII submission.

## 2026-09-04 — Local Playwright Chromium H001 eval backend

### Why

Cloudflare Quick Action和独立CDP probe可用，但Hybrid H001的多次Browser Session可能遭遇瞬时429/容量失败；需要在不移除远端Runtime、也不改变Tabelog业务边界的前提下，隔离本地浏览器与页面解析问题。

### Changes

- 增加`LocalPlaywrightChromium`，以headless local Playwright Chromium实现既有`BrowserRuntime` / `BrowserSession`的navigate、snapshot、click、fill、select、wait和screenshot接口，并在close时关闭page、context和browser。它不持有或读取Cloudflare凭证。
- `browserRuntimeFromEnvironment`仅在`PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM`时选择本地Runtime；`AUTO`、`KITESURF`和`CHROMIUM`继续直接使用现有Cloudflare Runtime和AUTO fallback语义。Hybrid runner保持已有live-read gates；本地模式不再要求Cloudflare账号或token。
- 本地browser binary缺失、launch和页面操作均映射到既有fail-closed `BROWSER_RUNTIME_FAILED`；不静默回退Cloudflare。无Tabelog identity/availability、HARD constraint、步数预算或写路径变动。

### Local probe

首次probe发现browser binary缺失，安装项目现有`playwright-core`对应Chromium后暴露Local Runtime把`chromium.launch`作为裸函数调用而丢失`BrowserType`绑定的问题。修复为通过BrowserType对象调用后，isolated `example.com` probe成功。随后仅运行一次`LOCAL_CHROMIUM` H001：Google Discovery成功，本地浏览器实际读取Tabelog约6.3秒，三家候选仍真实`ENTITY_MATCH_UNCERTAIN`，未进入`PRESENT_RESULTS`。没有Cloudflare访问或任何外部写操作。

## 2026-09-04 — H001 browser failure attribution and terminal read handling

### Why

历史H001 Artifact把三个`ENTITY_MATCH_UNCERTAIN`当作Google→Tabelog身份问题；但Artifact没有任何Tabelog search/detail/JSON-LD/browser metadata，availability read约1ms完成。独立只读复现确认Cloudflare Browser Run在建立会话前失败，低置信度占位identity被Grounding优先映射，掩盖了真正的浏览器基础设施故障。

### Changes

- Grounding优先保留`EXTRACTION_FAILED + BROWSER_RUNTIME_FAILED/BROWSER_TIMEOUT`的稳定原因码；真正未能核实的门店仍保持`ENTITY_MATCH_UNCERTAIN`，没有降低HIGH门槛或接受name-only。
- Tabelog adapter在所有本次候选共享同一失败码时写入安全的read metadata；Router仅对“所有请求候选均同一浏览器启动失败”标记terminal Provider failure。Loop持久化`AGENT_LOOP_TERMINATED(EXECUTION_FAILURE)`并进入`FAILED`，不再把内部Provider故障交由Agent `ASK_USER`。
- 不修改Google FieldMask：三家原候选均已返回`nationalPhoneNumber`，阻塞在Tabelog页前，扩展字段无助于此失败。

### Live observation

按一次限制重跑H001后，Semantic和Agent决策继续成功，但Google Discovery两次在8秒deadline超时，第三次被搜索预算拒绝；没有Candidate、Browser session或Tabelog页面读取，Agent随后以`ASK_USER / WAITING_USER`停止。故本轮浏览器归因修复没有获得真实Tabelog identity/availability成功证明；当前单一阻塞是Google Discovery端到端超时。

## 2026-09-03 — H001 live-read identity, area and no-progress repair

### Why

首次真实H001已经排除DeepSeek Provider拒绝，但Google地址中的Shibuya未成为area evidence，Tabelog搜索页的相对门店链接没有被解析到可核验门店页，且Agent可重复执行同一availability read直至预算耗尽。

### Changes

- Google Text Search FieldMask增加结构化`addressComponents`；`near <area>`只在一个locality/sublocality/administrative address component精确匹配时成为`areaMatch:true`，Evidence同时保存匹配组件、类型和`GOOGLE_ADDRESS_COMPONENT`依据。格式化地址的词面命中不再作为地点证明。
- Tabelog搜索解析只接受可识别的restaurant-result anchor，并把相对链接正规化为Tabelog canonical URL；门店页从JSON-LD及地址/电话/tel/canonical markup补全identity。Resolver仍只接受exact phone或normalized name+address，电话号码冲突和歧义继续fail closed。
- `CHECK_AVAILABILITY`若包含当前权威search/schedule已有Check的候选，会在Action Validator中以`AVAILABILITY_ALREADY_CHECKED`拒绝；Prompt `restaurant-agent-decision-prompt@6`同时要求Agent仅检查未读候选或改用另一安全策略。没有提升步数或read预算，也未改变写路径。

### Live observation

本轮唯一一次H001 Live Read-only在进入候选Discovery前，两次Google Places read均被Router的8秒硬deadline终止；第三次被既有Google search预算拒绝，Agent随后`ASK_USER`并以`WAITING_USER`退出。没有获得Google候选或Tabelog页面观测，因此本轮不能声称身份、area或availability已在真实页面上成功；新的单一阻塞是Google Discovery的端到端超时。

## 2026-09-03 — H001 DeepSeek strict Agent transport repair

### Why

真实H001的Semantic调用成功，但首次`restaurant_agent_decide`被DeepSeek拒绝，且原有Artifact只保留稳定失败分类，无法诊断Provider非2xx细节。

### Changes

- 保持`restaurant_agent_action@3` canonical Schema和本地Action Validator不变；新增仅供DeepSeek Beta strict function transport使用的wire schema。其顶层关闭additional properties，且每个字段均写入`required`；不用的canonical可选字段以空字符串或空数组编码，并在Domain内严格恢复为canonical动作。
- Decision Prompt升为`restaurant-agent-decision-prompt@5`，明确wire占位字段不得承载其他动作的有效值。恢复后仍通过原有parser和Validator；字段错位或非空的无关字段继续fail closed。
- DeepSeek Gateway对非2xx安全保存HTTP status、provider request ID、error code/type与截断脱敏message；不保存API key、Authorization、原始Prompt、Completion或Response body。Hybrid artifact增加对应的安全`modelInvocations`记录。

### Evidence and boundary

DeepSeek官方Beta strict function规则要求每个object property都在`required`中且`additionalProperties:false`，并不支持string `minLength` / `maxLength`等约束；原canonical Action Schema仅`type`必填，因而最可能被Provider拒绝。Beta endpoint原已正确使用。此改动不触及Google、Cloudflare、Tabelog、HARD Grounding或`PRESENT_RESULTS`业务逻辑，也不添加任何写操作。

一次真实H001随后完成Semantic和6次`restaurant_agent_decide`（均HTTP 200），确认已越过原MODEL_FAILURE；之后Tabelog对三个Google候选均记录`ENTITY_MATCH_UNCERTAIN`，Agent重复同一availability action，最终`STEP_LIMIT / NEEDS_INPUT`。没有抵达`PRESENT_RESULTS`，也没有重跑。

## 2026-09-03 — H001 live read evidence completion

### Why

H001 needs one actual read-only terminal result, not a heuristic time extraction or a loop that merely stops after reading availability. Task-critical area, HARD criterion, exact outlet and requested availability facts must be independently grounded and fail closed.

### Changes

- Added ADR-0014 and advanced to `restaurant-state@10`, `restaurant-agent-action@3` and `restaurant-agent-decision-prompt@4`. `PRESENT_RESULTS` is a non-booking terminal action/state: the Agent may propose candidate IDs only; the Validator derives the required proof and the Runtime writes `RESULTS_PRESENTED`.
- Made Google Places Text Search use a Promise-race hard deadline across both fetch and response body parsing, including non-cooperative fetch implementations.
- Replaced broad Tabelog time scraping with explicit slot-control parsing after confirmed date and party selection. Ordinary opening-hours/prose time strings cannot create availability; bot challenges, uncertain selection, redirect, unsupported flow and extraction failures remain non-available.
- Enriched each candidate Tabelog page before resolution. A result is HIGH only for exact phone or normalized outlet name plus address; ambiguous branches fail closed. Availability grounding now records separate `ENTITY_MATCH`, `RESTAURANT_FACT` and `AVAILABILITY` evidence and only source-labelled hard-criterion text may add a candidate fact.
- Updated the H001 runner to validate Live configuration before a paid model call, persist an artifact on any executed run, and exit successfully only at terminal `PRESENT_RESULTS`.

### Boundary

No real provider, model or browser session was reached: the attempted H001 runner stopped at the required `PRAXIS_ALLOW_LIVE_RESTAURANT_READ=1` gate, and the current environment also lacks Google Places and Cloudflare credentials. No booking, payment, cancellation, PII submission or other external write path was added or run.

## 2026-08-20 — Live / Hybrid Restaurant read path implementation

### Why

The ADR-0013 Agent Loop needed its first real-read vertical slice without weakening the invariant that the Agent proposes business actions only, Grounding establishes facts, Runtime is the sole State writer, and no booking-related external write may occur.

### Changes

- Advanced the persistent Restaurant State to `restaurant-state@9`, appending immutable migration `0009-restaurant-live-read-trajectory`. The state records per-candidate availability status (`AVAILABLE` / `UNAVAILABLE` / `UNKNOWN` / `SOURCE_UNSUPPORTED`) and compact, normalized Read Evidence; an availability error can no longer be represented as unavailable.
- Advanced the Decision Context to `restaurant-agent-context@2`, Decision Prompt to `restaurant-agent-decision-prompt@3`, trajectory to `restaurant-agent-trajectory@5` and Harness artifact to `restaurant-harness-artifact@6`. Only stable business availability status/reason reaches the Agent; Provider, Browser, URL and raw source observations remain outside it. Generic-browser trajectory entries are traced as external Adapter work.
- Added a minimal Google Places API (New) Text Search client with an explicit FieldMask, authoritative-intent query construction, optional runner-supplied `NEAR_USER` location bias, bounded result count and structural Grounding. The implementation never promotes retrieval relevance into cuisine, price or availability facts.
- Added the first Browser Runtime boundary using Cloudflare Browser Run CDP with Kitesurf first and one Chromium fallback; it supports bounded navigate/snapshot/select operations, closes sessions on AbortSignal and stores only execution metadata. Added the bounded, read-only Tabelog executor with deterministic outlet resolution, no submit action, and fail-closed handling for bot challenges, uncertain entities, redirects, unsupported online flow and extraction failures.
- Added frozen-case materialization for relative Tokyo dates, an opt-in Browser compatibility probe, and an opt-in Hybrid runner. Every runner requires explicit environment gates, emits only Git-ignored local artifacts, records resolved location context when provided, has no Authorization, booking, payment, cancellation or personal-information submission path. The Hybrid runner imposes each-case limits of two Google searches, zero Place Details enrichments, three Browser/availability reads, five Tabelog matches and one runtime fallback. The repository E2E rubric remains `draft / not integrated`, so the runner explicitly records the absence of an executable agreed scorer.
- Preserved the user-added h004/h005 cases and made the source a valid multi-document YAML stream by adding document separators only. Updated current architecture, Domain, security, capability, roadmap and configuration documentation.

### Boundary

No real Provider, browser session, model call, reservation, payment, cancellation, PII submission, reset command, real PostgreSQL write or controlled external write was run. Real credentials and the two Live-read gates were absent; only source, Contract, Fixture, Mock and Embedded-postgres evidence exists.

## 2026-08-20 — ADR-0013 Agent Loop final hardening

### Why

Definitive `COMMIT_FAILED` and `BOOKING_ABSENT` already reached `SELECTION_REQUIRED`, but the completed mandatory command chain did not return control to the bounded Agent Loop. The previous Authorization also needed to be unusable for a recovery candidate. Trajectory lacked the exact sanitized context seen by the Agent, and `FIXTURE_STRUCTURED` incorrectly made execution mode part of a long-lived route taxonomy.

### Changes

- Added Accepted ADR-0013. ADR-0003 retains the single-logical-Agent boundary while its deterministic Restaurant next-action detail remains superseded by ADR-0010. ADR-0004 retains one Authorization per concrete proposal; its manual-reselection recovery detail is superseded by the Agent Loop recovery path. PRD source requirements were not rewritten.
- Added `resumeAfterMandatoryCommandChain` to the Restaurant application loop and invoked it from the current Fixture/Mock orchestrator after Policy/Commit/Verify finishes. It resumes only from `SELECTION_REQUIRED`; `OUTCOME_UNKNOWN`, terminal states and authorization checkpoints never auto-resume.
- Made each recovery `BOOK_RESERVATION` generate a fresh proposal ID and made the reducer reject an Authorization whose `proposalId` does not equal the current proposal. `COMMIT_FAILED` and `BOOKING_ABSENT` clear the prior proposal, Authorization and active attempt before recovery. The Harness proves both failure routes and old-Authorization rejection before Policy/Commit.
- Replaced `FIXTURE_STRUCTURED` with the long-lived `STRUCTURED_ADAPTER` route. Fixture/Mock/Live remain execution mode or provider metadata; `GENERIC_BROWSER` and `HUMAN_TAKEOVER` remain explicit future route boundaries only.
- Advanced trajectory to `restaurant-agent-trajectory@4` and Harness artifact to `restaurant-harness-artifact@5`. Appended immutable migration `0008-restaurant-agent-trajectory-decision-context` to store `context_schema_version` and sanitized `decision_context`; no previously published migration was changed. Each decision now records `Context → Action → Validation → Execution → Observation → State/Outcome` without raw prompt or chain-of-thought.
- Synchronized Status, Roadmap, architecture, Domain, security, interface, Harness and test sources of truth. Hybrid E2E preparation is now the next gate; a new semantic Clean Holdout remains independent parser/semantic quality work. `semantic conflict gating remains intentionally unchanged pending real Agent/E2E observation.`

### Boundary

No real provider, browser route, Human Takeover, real model call, Live Read-only, real Authorization, booking, payment, cancellation, reset command or controlled external write was run. `GENERIC_BROWSER` and `HUMAN_TAKEOVER` were documented as future taxonomy values only.

## 2026-08-20 — ADR-0012 migration integrity and Agent Loop hardening

### Why

ADR-0011曾原地改写已发布的`0006`迁移，使已有数据库的迁移历史不可复现；本机还可能残留无法由`restaurant-state@8`安全解释的`restaurant-state@7`开发Task。Agent仍收到过宽的完整State，Provider只读调用缺少强制deadline，BOOK step也不能稳定连接到后续Outcome。`hasEnough`的Discovery含义需要与Availability和Loop结束解耦。

### Changes

- 新增Accepted ADR-0012，并将工作线切换为`codex/adr-0012-migration-and-loop-hardening`。恢复`0006-restaurant-agent-trajectory`的原始`evidence_refs`定义，新增不可变的`0007-restaurant-agent-trajectory-causal-refs`：升级旧evidence引用、补充`causal_refs`与`proposal_id`，且兼容短暂存在的已因果化本机开发形态。
- 明确`restaurant-state@7`只属于开发期不兼容数据：绝不自动转换或启动时删除；仅在本机`DATABASE_URL`且显式设置`PRAXIS_ALLOW_DEV_RESTAURANT_STATE_RESET=1`时，才可用`npm run reset:dev:restaurant-state`删除对应Restaurant Task及其级联依赖。未执行任何重置；Pilot、staging和production禁止该命令。
- 新增`restaurant-agent-context@1`的Domain-owned投影，Decision Prompt升级为`restaurant-agent-decision-prompt@2`。模型只接收意图、缺失字段、显示安全的候选/Offer、选择和稳定失败码；Authorization、Proposal terms、原始Provider输出、Execution Result、Evidence与Reservation不进入模型输入。
- Execution Router为每次Provider read传递`AbortSignal`并强制8秒deadline；即使Adapter忽略中止，deadline race仍以可归因的Provider failure返回。`restaurant-agent-trajectory@3`的BOOK step持久化`proposalId`，Harness artifact升为`restaurant-harness-artifact@4`，可以显式连接Proposal、Authorization、Command、Attempt、Evidence与Outcome。
- 将`DomainSearchStrategy.hasEnough`限定为Discovery阶段的确定性检索预算阈值；它不代表Availability、Booking授权、Loop终止，也不阻止Agent在观察结果后提出下一次检索。

### Boundary

没有实现或执行真实Provider、Browser Agent、Human Takeover、真实PostgreSQL写入、真实Authorization、Booking、取消、支付、Replay、Live Read-only或Controlled Live-write。

## 2026-08-20 — ADR-0011 Restaurant Agent Loop control refinement

### Why

ADR-0010的首个Loop让不可信Agent输出重复权威Intent和预约时段字段，暴露了不可达的`COMPLETE`动作，并把Provider/Router问题混同为模型失败。其终止、`SELECTION_REQUIRED` lifecycle和trajectory的因果审计也不足以说明一次Agent step实际产生了什么。

### Changes

- 新增Accepted ADR-0011，并将当前工作线切换为`codex/adr-0011-restaurant-agent-loop-controls`。Action Contract升级为`restaurant-agent-action@2`：删除`COMPLETE`，Search只接收可选retrieval hint，Availability只接收candidate IDs；Router在执行前绑定权威Intent、日期、时段与人数。
- Restaurant State升级为`restaurant-state@8`，Agent trajectory升级为`restaurant-agent-trajectory@2`。每步保存Event、Command、Attempt和Evidence causal refs；Provider read、Router执行和模型决策失败分别记录为不同事件和trajectory outcome。
- timeout、step limit和rejection limit统一写入`AGENT_LOOP_TERMINATED`，形成明确`NEEDS_INPUT`状态及终止trajectory。`SELECTION_REQUIRED`改投影为`RUNNING`，并移除旧`SELECT_CANDIDATE` pending-user residue。
- 扩展Mock Harness：验证权威请求绑定、Provider失败不会被归因为模型、三类Loop终止、Agent恢复lifecycle与因果引用。Mock Adapter只增加受控读失败注入，不新增真实Provider或Browser路径。
- 同步Search架构中“开放式检索策略归Agent”、Execution架构中Structured Adapter / Generic Browser Agent / Human Takeover三条路线，并明确后二者仍未实现。同步README、状态、接口、Harness、命名约定和测试基线，删除README中的裸当前版本称谓。

### Boundary

没有实现Browser自动化、Live Provider、Replay、真实模型调用、Live Read-only、Authorization、Booking、支付、取消或Controlled Live-write。Generic Browser Agent和Human Takeover只更新为后续架构路线，当前实现仍是Fixture/Mock Structured Adapter。

## 2026-08-20 — Repository naming and version normalization

### Why

Branch names, architecture generations, State/Schema/Prompt versions and Eval datasets had accumulated on one global `Restaurant vN` axis. The same version number was being used as a branch archive, architecture label, directory name and file suffix, making it unclear what had actually changed and forcing ordinary work toward `v18` without a product release.

### Changes

- Added `docs/REPOSITORY-CONVENTIONS.md` as the sole naming/version Source of Truth. `AGENTS.md` now contains only the mandatory summary and reading step; Arch Guard remains limited to architecture, state authority, execution and safety boundaries.
- Renamed the local working branch from `codex/restaurant-decision-v18` to `codex/adr-0010-restaurant-agent-loop` and removed its stale upstream association. The existing remote branch was not changed or deleted.
- Reorganized Eval under `src/eval/restaurant/{semantic,agent-loop,search-fixture}` and `src/eval/shared`; moved semantic entry points into `semantic/runners`; replaced versioned directories, files with spaces and extensionless draft names; normalized npm Eval scripts to `eval:restaurant:<object>:<mode>`.
- Replaced current global version labels with object-owned identifiers such as `ADR-0010`, `restaurant-state@7`, `restaurant-semantic-proposal@3`, `restaurant-semantic-prompt@7`, `restaurant-semantic-holdout@2` and `restaurant-semantic-scorer@3`. Document headers now use `Document revision`.
- Renamed source responsibilities from Decision Kernel / orchestration terminology to Action Validator, Message Handler and Execution Router. Moved frozen Progressive Decision and categorized-Holdout documents into `docs/superseded/harness/` under responsibility-based filenames, while preserving ADRs, history and artifact identities.
- Clarified the mandatory repository lifecycle boundary in `AGENTS.md`: historical thinking, Eval plans, annotation guides, Golden/Regression sets, manifests, scoring contracts and run evidence are retained or archived with lifecycle/contamination labels; replaced executable code and duplicate paths are removed after callers and verification are updated, with Git history used for recovery.
- Added Brainstorming and Superseded archive indexes, and classified Eval paths as `current executable`, `current baseline input template`, `draft / not integrated`, `private / git-ignored` or `superseded retrospective`. Unintegrated Agent Loop and Semantic materials moved under explicit `drafts/` directories without changing their content.
- Removed three unused type imports and five ignored `.DS_Store` files. No historical Plan, Golden/Regression material, log, private Holdout source or executable Eval path was deleted.

### Boundary

This normalization does not change product behavior, Prompt text, Dataset content, provider integration or external side effects. Historical ADRs, logs, Git commits and artifact identifiers retain their original names for auditability.

## 2026-08-19 — Restaurant v18 Agent Loop

### Why

v17's deterministic next-step kernel coupled Discovery candidates to Availability offers and encoded retry/selection workflow in Runtime code. The next vertical slice needs one bounded Restaurant Agent to choose business actions while retaining deterministic State, authorization, side-effect and Outcome controls.

### Changes

- Added ADR-0010 and the `codex/restaurant-decision-v18` branch. Replaced deterministic next-step commands with a static six-action Restaurant capability catalog, ModelGateway-backed Agent Decision, deterministic Action Validator and bounded coordinator.
- Split `RestaurantCandidate` from `AvailabilityOffer`; Discovery and Availability are independent read-only routes. Agent selection of a candidate/offer creates only a deterministic booking proposal, after which the existing Policy, one-time Authorization, Commit, Verifier and `OUTCOME_UNKNOWN` protections remain authoritative.
- Added structured Agent trajectory storage (including state hashes, action, verdict, route and observation) for PostgreSQL and Mock artifacts. Removed the user candidate-selection endpoint and obsolete `AWAITING_SELECTION` path.
- Reworked Fixture/Mock Harness and local Workspace paths. New Harness scenarios prove second-search and unavailable-A-to-B availability strategy originate from Scripted Agent actions rather than deterministic fallback.

### Boundary

No Browser automation, Live Provider, Replay, real model request, Live Read-only, Authorization, booking, payment, cancellation or Controlled Live-write occurred. User-owned untracked evaluation directories were not read or modified.

## 2026-08-18 — Prompt v7 v5-slot / v6-criteria diagnostic

### Why

用户将当前Prompt定名为v7：时间、区域和人数指引保留v5文本，criteria边界保留v6文本。需要在不改变Gold、Contract、Schema、Scorer或Decision Kernel的前提下，对同一canonical exposed Gold进行一次可审计诊断。

### Changes

- 仅将当前组合Prompt版本从`v6`推进到`v7`，并将Prompt Contract断言与运行清单同步到当前正文；没有改写用户已经提供的Prompt段落。
- 已暴露Runner的前序artifact门禁改为只接受当前Prompt的直接前一版本；若其Dataset SHA不同，在任何模型请求前拒绝混合cohort。v7读取v6的`COMMON_UNCHANGED_TURNS`快照，因此继续排除没有可比快照的H007。

### Boundary

没有修改Gold、Proposal / Draft Schema、Contract、Compiler、Runtime/Reducer、Scorer、Decision Kernel或readiness policy；运行保持`EXPOSED_GOLD_ACCEPTANCE_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`，不是新的Clean Baseline。

## 2026-08-18 — Prompt v6 canonical-Gold acceptance diagnostic

### Why

用户明确将已暴露私有数据的当前Gold保留为canonical版本，并要求以Prompt v6运行一次接受诊断；此前的v4 Clean Baseline与v5 Regression使用不同的Gold版本，不能再做整集直接比较或被重新包装为Clean结果。

### Changes

- 将Restaurant Semantic Prompt更新为用户提供的v6文本；Proposal / Draft / Eval Schema `3`、Compiler、Runtime/Reducer、Decision Kernel、Scorer与readiness policy保持不变。
- 扩展已暴露Runner的最小版本谱系检查：current Gold与v4 SHA不同时，需要显式canonical确认及前一份已暴露Regression artifact；运行分类固定为`EXPOSED_GOLD_ACCEPTANCE_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。
- 比较器只保留`COMMON_UNCHANGED_TURNS`：以当前Gold和前一artifact Gold均相同的turn为集合，排除annotation-changed或无前序快照的turn；不生成v4/v5整集比较，也不覆盖任何既有artifact。

### Boundary

当前canonical Gold未被恢复或改写；没有创建或声称新的Clean Baseline。该次真实模型运行仅访问已暴露私有数据与DeepSeek结构化输出，不访问真实餐厅平台，也不产生Authorization、预约或其他业务外部写入。

## 2026-08-18 — Prompt v5 exposed-Holdout regression record

### Why

Prompt v4的唯一Clean Holdout结果已经暴露；用户要求在相同数据上做一次真实Prompt v5诊断，比较字段级变化和多轮能否越过原先首错，同时不得把该运行重新包装成Baseline。

### Changes

- 新增受控`eval:semantic:holdout:exposed-regression`：严格Preflight、核对Dataset SHA与不可变v4 artifact、固定完整25-turn调用上限，并以独立`EXPOSED_HOLDOUT_REGRESSION / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false` artifact持久化运行前代码快照、原始逐turn结果和模型指标。
- 比较器将v4的15个实际模型调用作为唯一同口径子集，另行报告v5全25 turn的覆盖，避免把上游阻断减少造成的样本变化误计为质量提升。
- 首次分析发现criteria文本不匹配会被重复计入polarity/strength的纯诊断错误；修复后新增回归测试，并由无模型调用的`field-analysis-v2` sidecar重新计算。原始模型结果和Baseline artifact均未改写。

### Boundary

未修改Gold、Prompt v5文本、Proposal / Draft Contract、Scorer、Compiler、Reducer、Decision Kernel或readiness policy。此运行只访问已暴露私有数据和DeepSeek结构化输出，不访问真实餐厅平台，也不产生Authorization、预约或其它业务外部写入。

## 2026-08-18 — Restaurant Semantic Prompt v5

### Why

The completed v4 Clean Holdout is `RESULT_EXPOSED` and cannot be rerun. The user supplied a revised general semantic-interpreter prompt that clarifies open criteria, semantic strength, time precision, closed-party inference, relative location preservation, and named-target handling without adding a Domain field or changing authority boundaries.

### Changes

- Replaced the Restaurant Semantic Interpreter system prompt with the user-supplied v5 text and advanced only the Prompt version from `v4` to `v5`.
- Kept Proposal / Draft / Eval Schema `3`, Restaurant State `6`, Scorer `3`, Compiler, Runtime/Reducer, Decision Kernel, Model transport, temperature, retries, and Provider behavior unchanged.
- Added focused prompt-contract assertions and synchronized current Status, Orchestration, Eval guidance, Holdout protocol, Eval README, and Roadmap: the v4 artifact remains historical and any v5 baseline requires a new unseen dataset.

### Boundary

No Gold, Prompt example drawn from private data, Scorer, Contract, public fixture content, real-model call, Holdout invocation, Discovery, Availability, authorization, or external write occurred.

## 2026-08-17 — v16 open Restaurant Criterion Contract

### Why

The v15 language boundary made the model classify a user expression as cuisine, hard constraint or soft preference before it could preserve it. That unstable ontology created avoidable ambiguity in Gold, prompt behavior and state accumulation, so annotation must not continue against that Contract.

### Changes

- Created ADR-0008 and the incompatible `codex/restaurant-decision-v16` line while retaining ADR-0007's Interpreter → Contract → Compiler → Runtime/Reducer → Kernel responsibility chain.
- Replaced the three classified arrays in Proposal, Patch, Draft and complete Intent with `criteria: RestaurantCriterion[]`, including explicit `text`, `polarity` and `strength`; bumped Proposal/Draft/Eval Schema to `2`, Restaurant State to `5`, Prompt to `v3` and Regression evaluator to `2`.
- Kept the Compiler deterministic: criteria add, replace or remove as a collection; state identity uses trim/case-insensitive text and exact polarity/strength. No search taxonomy, provider mapping, policy change or extra model call was introduced.
- Migrated the exposed seven-turn Regression and Fixture model double, Holdout preflight/template, deterministic scorer and annotation guide. The former v15 Holdout guide is historical; a new private v16 dataset is required.

### Boundary

No real DeepSeek, Clean Holdout, Discovery, Availability or external write ran. User-owned untracked annotation files were neither read nor changed. The earlier v15 real-model Smoke remains historical transport evidence only and cannot establish v16 quality or transport compatibility.

## 2026-08-17 — v15 strict transport and semantic-equivalence hardening

### Why

The first Clean Holdout must not be consumed by an unverified strict transport Schema. The current Proposal Schema contained unsupported string `minLength` constraints, while Eval treated unordered semantic collections and facts as ordered arrays. The Compiler also allowed a singleton clear and set in one turn to depend on model fact order.

### Changes

- Removed unsupported `minLength` constraints from the strict transport Schema. The existing local Domain validator remains the authority for non-blank strings.
- Made Eval compare Proposal facts, collection Patch values and Draft collections as deduplicated sorted semantic sets; singleton values and Decisions remain exact. Regression and Scorer share that comparison.
- Made a singleton `NEGATE` plus `ASSERT` or `CORRECT` in one Proposal a deterministic `CONTRADICTORY_PROPOSAL`, independent of facts array order.
- Removed the stale `nearby` Holdout exclusion and documented the required exposed Regression Smoke before a Clean Holdout when strict transport configuration changes.

### Boundary

No Proposal field, Prompt content/version, responsibility boundary, Kernel behavior, Holdout Gold or private annotation file changed. An explicitly authorized exposed Regression Smoke subsequently verified the repaired transport; no Clean Holdout, Discovery, Availability or external write ran.

## 2026-08-17 — v15 architecture cleanup and hardening

### Why

The frozen v15 responsibility chain was sound, but the implementation still sent only a Schema name/version to the model Provider, collapsed some Eval failure stages, persisted derivable readiness, allowed ambiguous collection operations, duplicated Fixture orchestration and mixed durable architecture rules with version-specific procedures.

### Changes

- Added a generic machine-readable Schema payload to `ModelRequest`. Restaurant owns the complete Proposal JSON Schema; DeepSeek translates it to a forced Beta strict-function transport envelope and never executes that envelope as a Tool. Local Domain validation remains mandatory and no free-text fallback was added.
- Added explicit Eval attribution levels. Exposed Regression uses Proposal/Patch development oracles to distinguish Interpreter, Compiler, Reducer and Kernel; Clean Holdout remains product-semantic and reports only final Draft/Decision precision.
- Removed stored `missingRequiredFields` from Restaurant Draft and complete Intent, fixed the regular Draft Validator to accept and validate `target`, and made Kernel/projections compute blocking fields from authoritative values.
- Defined collection operations deterministically: ASSERT adds, CORRECT replaces, NEGATE removes; collection CONFIRM is rejected. Singleton CONFIRM remains a no-state confirmation.
- Extracted Restaurant-specific message/read-command orchestration, injected Interpreter/Search/Clock into the persistent application, moved the lightweight local search driver under Eval, removed the unreachable legacy Fixture parser branch, and extracted inline Web markup from the HTTP server.
- Added `npm run arch:check` and reduced Arch Guard to durable authority and dependency boundaries.

### Boundary

ADR-0007 responsibilities, Decision Kernel authority, Semantic Proposal fields/schema version, Prompt version, Restaurant Harness and frozen Goal/Scheduler probes were retained. The private 30-query Holdout was not inspected, used for optimization, or run against DeepSeek. No live Provider, Discovery, Availability or external write was invoked.

## 2026-08-16 — Remove obsolete v14 and legacy Eval paths

### Why

The default `npm test` mixed current product guarantees with 70 historical v14 Harness tests, an obsolete single-turn Intent Parser path and eight architecture probes. The resulting 151-test count obscured which checks still protected the frozen v15 product boundary and made removed architecture look current.

### Changes

- Deleted the executable `src/eval/decision-v14/` Harness, its Golden data, evaluator, tests and `eval:decision:*` commands. Its design and past results remain available through Git and explicitly historical documents.
- Deleted `RestaurantIntentParser`, `src/eval/intent-legacy/`, the legacy real-model adapter and all `eval:intent:*` commands.
- Split eight Goal/Scheduler/Synthetic architecture probes from the default product suite behind the explicit `npm run test:probes` command; the 12 current Postgres Runtime/Recovery checks remain in `npm test`.
- Reduced the default stable product baseline from the mixed 151-test inventory to 65 current tests, and synchronized the Eval/Test guidance, architecture, interfaces, Harness, capability, roadmap and status documents.

### Boundary

The frozen v15 responsibility chain, Prompt `v2`, Proposal Schema `1`, Semantic Proposal Contract, Compiler, Reducer, Decision Kernel, Fixture Regression and private Holdout content were not changed. No real model, network integration or external write was invoked.

## 2026-08-14 — v15 Clean Holdout evaluation harness preparation

### Why

The v15 responsibility boundary, Prompt and Proposal Schema were frozen, but creating Holdout content before fixing the Dataset Contract, evaluator, preflight and run protocol would allow scoring rules or runtime variables to drift after results were seen. Annotation also needed a private location that could not be mistaken for another checked-in Regression set.

### Changes

- Added an Eval-only v15 Holdout Dataset Contract with a frozen dataset identity, Tokyo reference time and allowed Gold shape. It validates full accumulated `expectedDraft` plus `ASK_USER` or `SEARCH` without adding fields to the product Semantic Proposal Contract.
- Added Draft and strict Preflight modes. They reject manifest drift, unsupported fields, invalid or duplicate IDs, empty completed datasets, invalid Drafts and Draft/Decision inconsistencies before any model configuration or network call is read.
- Extracted the deterministic semantic scorer: the compiled authoritative Draft is scored before the Kernel Decision, so an upstream semantic error is not counted again downstream.
- Added a complete seven-Turn Fixture interpreter for the already exposed v15 Regression, a local pipeline command, a private Git-ignored annotation file and a committed empty template.
- Added a guarded real Holdout runner. It fixes DeepSeek `deepseek-v4-flash`, Prompt `v2`, Proposal Schema `1`, temperature, Thinking, retry policy, reference time and dataset order; requires both paid-network and Clean-Holdout confirmation; hashes the dataset and creates a non-overwritable run record before the first model request.
- Added the v15 annotation guide and synchronized the documentation index, Eval/Test skills, Eval README, Status and Roadmap.

### Boundary

No Holdout sample or Gold was created. Product code, Semantic Proposal fields, Prompt content/version, Compiler, Reducer, Kernel and search behavior did not change. The new Dataset metadata is Eval-only. No real model, Discovery, Availability or external write was invoked.

## 2026-08-14 — Stage 2C v15 semantic freeze and v14 Eval retirement

### Why

Stage 2C had accumulated several names and partially overlapping evaluation roles. The historical v14 Golden Harness, exposed v15 Regression, future clean Holdout and product semantic contract needed one explicit lifecycle boundary before any further annotation or model run.

### Changes

- Froze the active v15 responsibility chain as `Semantic Interpreter → Proposal Contract → Compiler → Runtime/Reducer → Decision Kernel`, with product Prompt `v2` and Proposal Schema `1` unchanged.
- Marked `src/eval/decision-v14/` as `FROZEN / HARNESS_ONLY / REGRESSION`: it remains available for local historical regression, but no longer receives Golden, Prompt, Schema, Scorer, paid-model or Holdout work.
- Reframed the next Stage 2C gate as a separate v15 `CLEAN_HOLDOUT` baseline, followed by one real Live Read-only Discovery check. Existing Fixture, v14 Golden and exposed v15 Regression results cannot substitute for that baseline.
- Synchronized the current Status, Roadmap, documentation Index, Eval Skill, Eval README and the two historical v14 annotation documents.

### Boundary

This freeze changed documentation and Eval lifecycle governance only. It did not change product code, responsibility ownership, Prompt content/version, Proposal Contract fields/schema, datasets, evaluator logic, model configuration or provider behavior. No real model or external integration was invoked.

## 2026-08-14 — Eval module organization by evaluation boundary

### Why

The flat `src/eval/` directory mixed four distinct concerns: the current v15 semantic Regression, the historical v14 multi-turn Golden Harness, the old single-turn Intent Parser checks and the Fixture Search smoke. Their separate files are useful for first-failure attribution, but the flat layout hid why they coexist.

### Changes

- Grouped existing files without changing datasets, contracts, Prompt content, scoring or command names: `semantic-v15/`, `decision-v14/`, `intent-legacy/`, `search-fixture/` and `shared/`.
- Shortened filenames within their owning directory; kept Contract, Reducer, Scorer, Runner and tests separate rather than merging unrelated responsibilities.
- Moved the existing real-model evaluation configuration, pricing and invocation summary to `shared/`, justified by its use from the v14 Decision, v15 Semantic and legacy Intent runners.
- Added `src/eval/README.md` and synchronized package entrypoints and active code references.

### Boundary

No Eval dataset, Golden/Regression contamination status, expected result, Prompt, model call, Runtime behavior or external effect changed. `decision-v14/` remains Harness-only and `semantic-v15/` remains the current product semantic boundary.

## 2026-08-13 — Documentation navigation and history consolidation

### Why

Current implementation facts, roadmap, verification evidence and chronological notes were distributed across the root README, Index and two long root-level logs. The logs are necessary for traceability but should not compete with current Source of Truth documents.

### Changes

- Added `docs/STATUS.md` as the single current-state summary: implemented scope, evidence, explicit gaps and next gate.
- Moved the append-only Dev Log and Test Log into `docs/history/` without removing their historical entries; added a history landing page and repaired references.
- Updated the Index and README to route readers by question, and corrected the Test Skill's stale automated baseline reference.

### Boundary

No Accepted ADR, product requirement, Runtime, model, Provider, Adapter or test result was changed. `brainstorming/` and `decisions/` were not moved or rewritten.

## 2026-08-13 — Version branch delivery convention

### Why

v15 的完整实现最初位于名称仍代表 v14 的工作分支上。即使提交内容正确，若继续按旧分支名交付，会混淆版本范围、评估结果和可回退历史；每次交付前也不应依赖用户重复口述分支选择。

### Changes

- 在`AGENTS.md`固定版本分支命名：新的已接受架构、主链路或不兼容 State / Schema / Eval 版本从已验证 HEAD 创建`codex/<scope>-v<major>`分支；前一版本分支保留为历史指针。
- 同一已命名版本内的修复和验收补充继续使用原版本分支，避免为普通小改动制造无意义分支。
- 在Post-change Verify增加交付检查：确认分支版本一致、暂存范围、`git diff --check`、本地提交和远端 push 的实际结果；远端推送仍需用户明确授权。
- 从已验证的`714adcb`创建本地`codex/restaurant-decision-v15`，保留`codex/restaurant-decision-v14`不变。

### Boundary

这是一项Git与文档治理变更；没有改变Runtime、Restaurant状态、模型调用、外部工具或产品行为。

## 2026-08-13 — v15 DeepSeek Semantic Proposal regression runner

### Why

产品语义路径已经改为v15，但原有真实DeepSeek回归仍调用Harness-only v14 `statePatch` Contract，无法验证新Semantic Interpreter、Proposal Contract、Compiler、Reducer和Decision Kernel的修复效果。

### Changes

- 新增`restaurant-semantic-regression-v1`：7个静态、人工标注回合覆盖完整输入、增量补全、人数/地点修正、菜系否定和命名餐厅目标。
- 新增受控`npm run eval:semantic:deepseek`。它调用真实`RestaurantSemanticInterpreter`，随后仅在内存中运行Compiler、Task Runtime/Reducer、Decision Kernel和Fixture Search；不创建产品Task、不执行真实Tool或外部写操作。
- 新Runner按`SEMANTIC_PROPOSAL_CONTRACT`、`COMPILER`、`SEMANTIC_RESULT`、`DECISION_KERNEL`和`RUNTIME`记录首错。语义比较以编译后的权威Draft及Decision为准，而非v14内部Patch。
- 第一次预调试发现Prompt缺少各`value.kind`精确形状，导致AREA、PARTY_SIZE和BUDGET_PER_PERSON Contract失败；补全通用形状说明和命名目标规则。Prompt内容升为v2。

### Boundary

10次真实运行仅使用已暴露的静态Regression文本，均标记为`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。它验证当前7回合的结构化输出、确定性编译、累积和决策稳定性，不证明开放需求、未见表达、真实餐厅事实或产品预约质量。

## 2026-08-13 — v15 Restaurant semantic/search product slice

### Why

ADR-0007 fixed the language-to-state boundary, so the existing Fixture product route could no longer let a model produce a complete internal Intent Draft or derive its own missing fields. The first vertical slice must make Proposal validation, compilation, reduction and next-step decision independently observable without enabling real DeepSeek, Tool access or automatic reinterpretation.

### Changes

- Replaced the local and persistent Stage 2A/2B product path with `RestaurantSemanticInterpreter → Semantic Proposal Contract → Restaurant Semantic Compiler → Task Runtime/Reducer → Restaurant Decision Kernel`.
- Added closed Proposal schema `1` for user-turn facts and `ASSERT` / `CORRECT` / `NEGATE` / `CONFIRM` operations. It rejects `statePatch`, Event, decision, command, tool and other non-semantic fields.
- Added a pure Restaurant Compiler that emits versioned `RestaurantIntentPatch` data. A same-turn contradiction emits `SEMANTIC_CONFLICT_RECORDED`; it cannot alter prior facts, call a model or reach a Tool.
- Reducer now derives missing blocking fields from authoritative values, accumulates corrections/negations, and writes `SEMANTIC_PROPOSAL_COMPILED` rather than model-generated `INTENT_PARSED`. Restaurant State and Task Definition advance to schema/version `4` because no Pilot data exists.
- Added `DECIDE_RESTAURANT_NEXT` and recorded `RESTAURANT_DECISION_MADE` for the implemented semantic/search decisions: `ASK_USER`、`SEARCH`、`PRESENT_CANDIDATES`、`NEED_ADJUSTMENT`、`NEED_REINTERPRETATION`。
- `NEED_REINTERPRETATION` records a structured conflict and asks the user. It has no automatic second model call and does not overwrite State. `PROPOSE_RESERVATION` and `COMPLETE` remain reserved Kernel types; existing booking execution transitions stay deterministic and are not migrated in this slice.
- Migrated Fixture ModelGateway, Harness and PGlite Runtime scenarios to the new Event/Command chain. The old `RestaurantIntentParser` remains Eval/real-connectivity-only and is no longer called from product applications.

### Boundary

No DeepSeek request, real Discovery/Availability call, Authorization, external write, replay, Live Read-only or Controlled Live-write was run. Fixture mode remains explicitly local-only. This slice does not implement LLM response/adjustment generation, Tool Call Contract, automatic re-interpretation or a generic cross-Domain compiler.

## 2026-08-13 — Accepted v15 semantic-to-execution architecture

### Why

真实DeepSeek诊断已将两种失败分开暴露：Provider Completion可能不满足结构Contract；结构合法的输出仍可能错误表达用户新增、修正、否定、确认或目标粒度。现有Harness-only v14让模型直接输出内部`statePatch`，把语义理解与系统状态协议混在一起，无法作为稳定产品主链。

### Changes

- 新增Accepted ADR-0007，固定`Semantic Interpreter → Semantic Proposal Contract → Restaurant Semantic Compiler → Runtime/Reducer → Decision Kernel → Execution → Verifier`主链。
- 明确Semantic Interpreter只输出本轮用户语义，不输出`StatePatch`、Event、Readiness、Tool Call、Authorization或Outcome；Contract通过只代表结构合法。
- Compiler与Decision Kernel固定为Restaurant-owned确定性代码；不创建通用Ontology、跨Domain Compiler或Workflow DSL。
- 固定`NEED_REINTERPRETATION`为v15预留Kernel Decision：只记录conflict并询问用户或安全降级，不自动重新解释或改变State。
- LLM Response/Adjustment只能解释或建议；建议需经用户的新消息确认后才重回正式语义链。禁止`LLM → Tool`、`LLM → State`和`Verifier → LLM → Tool`旁路。
- 同步Overview、Agent Orchestration、Restaurant Domain、Interfaces、Arch Guard、Planning、Eval、Harness和Post-change Verify，使后续实现按相同边界规划和验证。

### Boundary

本轮只固化架构Source of Truth和工程规则；未实现Semantic Interpreter、Semantic Proposal Contract、Restaurant Compiler、产品Decision Kernel或`NEED_REINTERPRETATION`。现有Fixture Intent Parser与Harness-only v14 `statePatch`路径保持其真实实现状态，不被报告为v15产品能力。没有DeepSeek、数据库、Discovery、Availability或外部写入。

## 2026-08-13 — Prompt v14 and typed Restaurant Decision Patch Contract

### Why

Prompt v13仍要求模型在自由字符串数组中同时表达语义类别、正负极性和canonical词形，导致禁烟软硬分类、`too formal`/`FORMAL`以及移动意愿误入Preference等问题互相缠绕。继续追加自然语言规则会让Prompt承担Schema、Normalizer和Policy三种职责。

### Changes

- 新增Restaurant-owned机器可读JSON Schema与共享运行时Validator；Model Contract和Golden Preflight使用同一校验边界，错误保留可观测的细分Rule Code。
- `DecisionState`迁移为Typed Preference（`facet / value / polarity`）与Typed Hard Constraint；Reducer按语义Key执行集合式add/remove，S1/S2比较不再受数组顺序、菜系批准别名或过敏原大小写影响。
- Golden迁移到dataset v0.10 / Schema 3，Proposal Output Schema升为4；旧`positivePreferences / negativePreferences`字符串结构直接删除，不增加兼容层。
- Prompt v14压缩为2917字符，只保留模型职责、互斥语义角色、关键字段语义和一个最小JSON示例；Readiness、路由、候选数量与Grounding继续由Decision Kernel负责。
- 明确停止点：未新增Semantic Proposal编译器、通用Ontology、Workflow DSL、Subagent编排、DeepSeek Beta Strict Function Calling或生产Runtime路径。只有后续证据显示“语义理解稳定正确、Patch操作表达持续失败”时，才重新评估编译层。

### Boundary

本轮只修改Harness-only Eval Contract、Golden、Prompt和相关文档。没有调用DeepSeek、真实Discovery、地图、Availability、数据库、Task Runtime或外部写操作。现有17个Regression Turn仍全部暴露，后续真实调用不能被称为Baseline或泛化验证。

## 2026-08-12 — Prompt v13 State Patch semantic roles

Prompt升为v13，Schema 3、Kernel、Gold、Reducer、Scorer和canonicalization均不变。新增通用语义角色规则：可协商餐厅属性才是Preference；地点、移动弹性等写入专用字段；明确不可妥协的饮食、过敏、无障碍、环境或安全要求写入Hard Constraint；确认式地点接受必须更新Location。Prompt不含当前Regression实体或原句。Model Contract测试8/8、typecheck和`git diff --check`通过；未调用DeepSeek。

## 2026-08-12 — Eval-only Decision Kernel probe / Prompt v12

### Why

同一已暴露Regression上持续把Readiness、路由、候选数和Grounding规则写进Prompt，会把确定性Policy与语义理解混在一起，并放大对Golden的邻近过拟合风险。10次v11诊断也表明S3、S4、S7/S8不应继续作为模型自由生成的字段。

### Changes

- 新增`src/eval/restaurant-decision-eval-decision-kernel.ts`：只在Eval中，以累计State、可信Fixture/Search结果和Candidate Fact确定Readiness、动作、核心澄清Topic、候选展示上限与Grounding。
- Prompt升为v12，Output Schema升为3；Proposal只允许语义`statePatch`和可选已知Candidate ID排序，删除模型输入中的`retrievalSummary`。
- Runner v4保存模型原始Patch/排序意图，再由Kernel生成实际的S3/S4/S7/S8预测；可信命名目标解析与相对时间仍明确记录为Harness贡献。
- 这不是产品Runtime、Workflow DSL、Tool Loop或外部调用：不改Restaurant Domain、Task State、Web、Discovery、Availability或Authorization。

### Anti-overfitting boundary

- Kernel规则只来自已有Readiness/动作/Fixture证据Contract，不含Golden实体、用户措辞、允许动作标签或评分提示。
- Fixture/Search结果只进入Kernel；模型仅看到允许的Candidate Fact与ID，不能看到检索充分性或Gold Oracle。
- 当前17个Turn已全部暴露，任何后续真实模型结果仍仅是`DEVELOPMENT_DIAGNOSTIC`；Kernel通过也不构成泛化或产品能力证据。

### Verification

`npm run typecheck`、Kernel / Model Contract / Runner定向测试15/15、Strict Preflight、Fixture Oracle、Fixture Episode Runner、完整`npm test` 133/133、`npm run build`和`git diff --check`均通过。首次受限沙箱下完整测试的7个Local Web/SSE用例均因`listen EPERM 127.0.0.1`失败，其余126个通过；以本机监听权限重跑后133/133通过，未归因为代码断言失败。本条不包含DeepSeek调用。

## 2026-08-12 — Prompt v11 action routing matrix

### Why

v8真实模型诊断中有3个独立S4首错，且S1/S2/S3均通过：模型把`BRAND`错误路由到`CHECK_TARGET_RESTAURANT`，把`RESTAURANT`错误路由到`RESOLVE_BRAND_OUTLET`，并在指定餐厅后续补充人数/时间时退化为通用`SHOW_RECOMMENDATIONS`。

### Changes

- `RESTAURANT_DECISION_EVAL_PROMPT_VERSION`升为`v11`；输出Schema保持`2`，因为没有新增结构字段。
- Prompt新增抽象Routing Matrix：`BRAND`走`RESOLVE_BRAND_OUTLET`，或在Exact/Window时间、Exact人数和具体Outlet候选已齐时走`CHECK_AVAILABILITY`；不得走`CHECK_TARGET_RESTAURANT`。
- `RESTAURANT`走`CHECK_TARGET_RESTAURANT`，即使候选上下文里有多个同名Outlet或用户刚补充人数/时间；不得走`RESOLVE_BRAND_OUTLET`或`SHOW_RECOMMENDATIONS`。
- `OPEN/CATEGORY`达到推荐条件后走`SHOW_RECOMMENDATIONS`；可见选项反馈后走`NARROW_FROM_FEEDBACK`；`APPROXIMATE`或宽泛`DAYPART`不等于Exact Availability。
- Model Contract测试新增路由矩阵断言，且继续检查静态Prompt不含已暴露Golden实体。

### Boundary

仍是Harness-only Prompt修正。没有改Gold、Reducer、Scorer、Runtime、Discovery、地图、Availability或外部写入；错误动作仍归因S4，不通过Harness改写为正确动作。

### Verification

`npm run typecheck`、Model Contract定向测试8/8、`npm run eval:decision:model:fixture`、`npm run eval:decision:fixture`、`npm run build`和`git diff --check`均通过。真实模型Mock World首次在sandbox内全部为`NETWORK`且没有语义分数；用户明确批准调用DeepSeek并接受当前Regression评测数据出境后，FULL_REGRESSION重跑成功：17个Turn全部完成、0次Schema retry、P0为0，12/17个Turn无首错。v8中3个S4路由首错均不再直接失败。随后用户要求同一v11累计运行10次用于稳定性观察：总计174次DeepSeek API请求、4次Schema retry、0次Provider failure、P0为空；DGS03-T02为10/10 `S3_READINESS`，DGS04-T03为10/10 `S1_STATE_EXTRACTION`，DGS06-T03为10/10 `S7_SELECTION_DIVERSITY`，DGS06-T04为10/10不通过但首错阶段不稳定，DGS07-T01为10/10不通过且一次从S3波动到S1。结论改为按10次矩阵的稳定失败优先处理，不能基于单次结果继续调Prompt。

## 2026-08-12 — Prompt v10 state extraction boundary tightening

### Why

v8真实模型诊断中DGS06仍有两类状态抽取错误：把“with friends”等社交语境臆测为具体人数，以及把“would be good”类软偏好提升为`target: CATEGORY`。用户确认这两类Gold口径正确，不能通过放宽Scorer或canonicalization解决。

### Changes

- `RESTAURANT_DECISION_EVAL_PROMPT_VERSION`升为`v10`；输出Schema保持`2`，因为没有新增结构字段。
- Prompt明确规定`friends/family/team/department/date/partner`等词只能支持`occasion`，除非用户给出明确数字或有界范围，否则不得设置`party`。
- Prompt明确规定`would be good/maybe/preferably/I like/nice to have/not too`等软偏好进入`positivePreferences`或`negativePreferences`，不得把`target: OPEN`提升为`CATEGORY`。
- Model Contract测试新增这些Prompt边界断言；Gold、Reducer、Scorer和地点canonicalization均不变。

### Boundary

仍是Harness-only Prompt修正。没有真实模型调用、Discovery、地图、Availability或Runtime写入；这两类错误仍归因到S1 State Extraction，不作为可接受等价。

### Verification

`npm run typecheck`、Model Contract定向测试8/8、`npm run eval:decision:model:fixture`、`npm run eval:decision:fixture`、`npm run build`和`git diff --check`均通过。完整`npm test`本轮未运行，因为没有改Runtime、Web、Reducer或Scorer；当前完整基线仍为2026-08-12的131 tests / 5 suites。

## 2026-08-12 — Prompt v9 / Golden v0.9 location strategy semantics

### Why

v8全量诊断里多个首错并不是缺真实餐厅数据，而是地点语义表示过窄：`AREA`与`NEAR_PLACE`在没有地图grounding时会对同一地名产生合理粒度差异；“从Ueno出发且愿意跑远”也不应被迫压成普通`AREA Ueno`或自由文本`FLEXIBLE.scope`。

### Changes

- Golden Seed升级为v0.9，DGS06将“从Ueno出发且愿意移动”表示为`{ kind: "FLEXIBLE", anchorQuery: "Ueno" }`；无锚点的`FLEXIBLE`仍然不是可执行Location Strategy，仍需追问。
- `DecisionLocation`允许`FLEXIBLE.anchorQuery`；Model Contract升为Prompt v9、输出Schema `2`，要求模型用`FLEXIBLE + anchorQuery`保留“出发锚点 + 出行弹性”，不要降级为`AREA`。
- S1/S2 canonicalization新增受控地点规则：同query的`AREA`/`NEAR_PLACE`等价，query只做大小写与空白归一；`ADDRESS_OR_STREET`不参与该等价；泛化travel scope被视为`FLEXIBLE`本身，`scope: "from/around X..."`可兼容为anchor。
- 诊断日志的canonical equivalent说明改为通用Eval比较规则，避免继续只写“菜系别名”。

### Boundary

仍是Harness-only。没有接真实地图或Discovery；没有让harness猜地点事实；没有放过漏地点更新。`Kameido is fine`若模型不写location仍是S1失败，`AREA Ueno`也不会等价于`FLEXIBLE anchorQuery Ueno`，因为前者丢失了愿意移动的策略。

### Verification

Typecheck、Strict Preflight、Fixture Oracle、Fixture Episode Runner、定向35个node:test、完整`npm test` 131/131和build均通过。未发起新的DeepSeek调用。

## 2026-08-11 — Prompt v8 Full Regression real-model diagnostic

### Why

相对时间的可信Harness闭环后，用户明确授权重新运行全部已暴露Regression，以确认真实模型交互、逐Turn诊断和原始/有效Patch分离在同一条受控路径上工作。该集合已参与开发，运行目的仅为定位后续问题，不是建立质量Baseline。

### Result

- 7个Episode、17个Turn全部完成，17次DeepSeek调用、0次Schema retry；7个Turn完全通过。
- 余下10个首错为7个S1状态解释与3个S4路由。S4集中在`BRAND`与`RESTAURANT`的后续检查动作混淆；S1包括把全面禁烟降为偏好、臆测朋友人数，以及`FLEXIBLE from Ueno`与`AREA Ueno`的语义分歧。
- `today/tomorrow/tonight`相关Turn的Artifact已显示可信解析与原始/有效Patch；它们不是本次首错来源。

### Boundary

本次仅调用真实模型，候选世界仍为Golden Fixture，不访问真实Discovery/Availability，也不修改产品State、Task Runtime或任何外部世界。Artifact落在Git忽略的`.eval-artifacts/restaurant-decision/`，不保存原始Prompt、Completion或密钥。

## 2026-08-11 — Prompt v8 trusted relative-time normalization

### Why

`referenceTime`此前只作为模型上下文传入，没有确定性地转换`tonight`等表达；同时`DAYPART`允许无日期，导致模型的结构合法输出仍会漏掉可由参考时钟确定的日期。用户要求将该类解析收回Harness，而非继续堆叠Prompt。

### Changes

- 新增Restaurant Decision Eval专用纯函数，只使用传入的`referenceTime`和`Asia/Tokyo`，不读取机器时钟或网络。当前最小词表为`today`、`tomorrow`、`tonight`、`now`和`right now`；`now/right now`得到参考时刻的`APPROXIMATE`时间。
- 互斥日期锚点、`tomorrow`与即时表达冲突、或多个不相容Daypart时返回未知，不使用启发式猜测。后续用户补充相对日期时保留已有Daypart，并用新的日期完成它。
- Runner v3在模型调用前把可信时间写入累计State，并在评分前将它与模型原始Patch合成为有效Patch。`RESTAURANT_DECISION_EVAL_PROMPT_VERSION`升为`v8`，只要求模型保留这类可信状态。
- 逐Turn诊断现在同时保留可信相对时间解析、原始模型Patch和有效Patch，避免将Harness贡献误报为模型输出。

### Boundary

仅限Eval Harness；不改生产Restaurant State、Task Runtime、真实时钟、Discovery、数据库、预约或外部写入。它不是通用日期库，也不覆盖任意自然语言、绝对日期或模糊日期；新增语义必须有真实需求和独立测试后才扩展。

### Verification

- 5个纯函数场景覆盖Tokyo日期、`today/tomorrow/tonight/now/right now`、时区转换、冲突拒绝、已有Daypart合并和模型漏日期修补；Runner回归确认DGS04的date-less模型Patch被可信解析补齐且日志保留两种Patch。
- Typecheck、Strict Preflight、17-turn Fixture Runner和build均通过。完整测试首轮在PGlite WebAssembly清理时发生Node/V8原生崩溃；同一命令立即重跑为130/130通过，因此未归因为代码断言失败。
- 没有发起新的DeepSeek调用；v8仍需用户明确授权的污染Regression运行才可观察真实模型交互，且不能作为Baseline。

## 2026-08-11 — Prompt v7 explicit restaurant occasion mapping

### Why

逐TurnRegression Artifact显示模型把`friends`和`department dinner`都错误写成`occasion: DATE`，并会在未提及同伴时补猜`DATE`。原因不是缺乏真实餐厅数据，而是Prompt同时把`DATE`用作日历日期Topic和浪漫约会枚举，且缺字段抽象示例错误地把`occasion: DATE`作为默认Patch。

### Changes

- `RESTAURANT_DECISION_EVAL_PROMPT_VERSION`升为`v7`。删除抽象缺字段示例里的`occasion: DATE`；`ASK_CORE_FIELD.DATE`明确仅为日历日期。
- 增加实体无关的Occasion规则：只有用户明确表达时才设置；`SOLO`对应独自、`DATE`仅对应浪漫约会/伴侣、`FRIENDS`对应朋友、`FAMILY`对应家人/亲属、`TEAM`对应工作同事/团队/部门。晚餐、日历日期、时段或缺失社会情境一律不推断`DATE`。
- 新增Prompt Contract断言，确认规则与`FAMILY`映射存在、缺字段示例不含`"occasion":"DATE"`，并继续禁止静态Prompt含Golden实体、地点、菜系、候选或反馈措辞。

### Boundary

只改Harness-only Model Contract、文档和测试；不改生产Restaurant State、Task Runtime、真实Discovery、数据库、预约路径或Model Gateway遥测。此举消除已暴露数据揭示的通用词义冲突，但不能证明模型泛化；相对时间解析仍保持独立待处理。

### Verification

- Model Contract定向测试：8/8通过，验证`FAMILY`/`FRIENDS`/`TEAM`/浪漫`DATE`的抽象规则存在，且缺字段示例不再包含`occasion: DATE`。
- Strict Preflight、17-turn Fixture Episode Runner、TypeScript typecheck与build均通过；完整自动化基线为124/124通过。
- 未发起新的DeepSeek调用；真实Regression仍须由用户明确授权，且只能报告为已污染Dataset的开发诊断。

## 2026-08-11 — Eval-only restaurant category canonicalization

### Why

逐TurnArtifact确认`Western food`/`Western`、`Japanese food`/`Japanese`和`Izakaya`的大小写不是语义差异。用户要求先消除这些评分误报，将Occasion与相对日期留作独立问题处理。

### Changes

- 新增显式、Eval-only类别别名表。它只归一`CATEGORY.target.query`与正向菜系偏好中的批准值：`western food/western`、`japanese food/japanese`和`izakaya`任意大小写。
- S1 Patch-effect和S2累计状态比较使用该规范视图；Gold、模型结构化Proposal、诊断中的原始文本、生产Restaurant State和模型输入不被改写。
- 任意未列别名、品牌/店名、地点、`FLEXIBLE.scope`、负偏好和Hard Constraint仍严格比较。避免以模糊匹配掩盖“无烟”或过敏等安全语义。

### Result

- `WESTERN`、`IZAKAYA`和`JAPANESE`分别通过对应Golden Turn的S1/S2；`Italian`替换`Western food`仍稳定首错S1。
- 没有发起新的DeepSeek请求。此前真实Artifact的原始差异保留为历史证据；下一次模型运行才使用新评分口径。

### Verification

- `npm run typecheck`、`npm run build`：通过。
- `npm run eval:decision:preflight:complete`：Golden v0.8仍为`READY_FOR_EVALUATOR`。
- `npm run eval:decision:model:fixture`：17个Turn均完成评分，S1–S8通过，P0为0。
- `npm test`：124 tests / 5 suites / 0 failed。

## 2026-08-11 — v6 full Regression with per-turn diagnostic artifact

## 2026-08-11 — v6 full Regression with per-turn diagnostic artifact

### Why

用户要求不再只报告S1/S2阶段计数，而是直接运行v6并检查每个模型Patch与Gold状态的具体差异。

### Result

- 在用户明确授权下，`FULL_REGRESSION`再次运行7个Episode、17个Turn；17次调用均完成，Runner记录0次Schema重试。日志落在本机Git忽略路径`.eval-artifacts/restaurant-decision/2026-08-11T03-59-28-429Z-full_regression.md`；没有数据库、Discovery、预约或其他外部写操作。
- 4个Turn（DGS05全部四回合）完整通过；13个Turn首错为10次`S1_STATE_EXTRACTION`、2次`S2_STATE_ACCUMULATION`和1次`S7_SELECTION_DIVERSITY / RECOMMENDATION_MISSING`，未出现P0。
- 可复查的根因不是单一“状态提取差”：模型把`friends`和`department dinner`错误枚举为`DATE`、漏掉Sora Dining的“tomorrow night”、没有把`tonight`落到日期；把“no smoking”当作普通负偏好而非Hard Constraint；把“from Ueno, can travel”误作`NEAR_PLACE`而非`FLEXIBLE`；DGS07第二回合漏写Kameido；DGS02虽已得到确定性检索结果却没有填`recommendation`。这些是下一轮Prompt/Contract待审查的问题。
- 同时，若干S1差异仅是当前Gold/State Canonicalization未定义的文字归一：`Western food`/`Western`、`Izakaya`/`izakaya`、`Japanese food`/`Japanese`，以及Gold没有保留的`FLEXIBLE.scope`。不能把它们直接当作模型语义失败；应先决定Domain canonicalization规则，再动Prompt。DGS03-T02和DGS04-T02的S2是前一轮错误的累计后果，并非这轮本身的Patch错误。

### Boundary

本次仍为`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。Artifact暴露的是已污染静态Regression的Gold与结构化Proposal，不能用于Holdout、质量趋势或生产数据。

## 2026-08-11 — Progressive Decision per-turn diagnostic artifact

## 2026-08-11 — Progressive Decision per-turn diagnostic artifact

### Why

阶段汇总只能报告“11个Turn首错S1、2个首错S2”，不能让操作者看到模型实际写了什么Patch，因而不能区分当前Turn提取错误与此前累计偏差。用户要求每次Eval都留下可审阅证据。

### Changes

- Episode Runner新增仅Eval使用的逐Turn结构化Witness：Fixture用户文本、候选上下文ID、模型输入状态、Gold前序状态、期望Patch/状态、模型Patch的同前序状态效果、模型累计状态和S1–S8评分。观察器异常被隔离，不能改变Eval的fail-closed语义结果。
- 真实DeepSeek CLI将Witness渲染为`.eval-artifacts/restaurant-decision/<timestamp>-<scope>.md`并在JSON摘要中打印路径；目录被Git忽略。Artifact刻意不含System Prompt、自然语言Completion、API Key、普通Gateway遥测或生产用户数据。
- CLI只允许当前静态`REGRESSION` Seed写出该Artifact；一旦Dataset含非Regression（例如未来Holdout）即拒绝写入，防止诊断日志本身造成测试泄漏。
- 修复通用真实Eval指标的调用分母：Progressive Decision按预期主调用Turn数而不是Episode数计算`retryCalls`。历史v6输出的10次“重试”是统计错误，实际逐TurnSchema重试始终为0。

### Result

- 新的Runner回归用一个故意错误的`target` Patch验证Artifact会显示`state.target.kind`差异并定位`S1_STATE_EXTRACTION / STATE_PATCH_MISMATCH`。
- 随后的用户授权v6 full Regression已生成真实模型Artifact；逐Turn结果与具体差异记录在上方独立条目。

### Verification

- `npm run typecheck`：通过。
- `node --import tsx --test src/eval/restaurant-decision-eval-runner.test.ts src/eval/real-model-eval.test.ts`：7/7通过。

## 2026-08-11 — v6 Fixture Tool boundary iteration

## 2026-08-11 — v6 Fixture Tool boundary iteration

### Why

v5全量Regression说明`BRAND`/`RESTAURANT`、候选不足和Grounding不应继续靠Prompt猜测。用户确认其中前三类主要是Harness/工程输入问题，第四类只有在检索系统给出“结果集是否充分”的事实后才是模型表达问题。

### Changes

- Golden Seed升级为v0.8。`BRAND`和`RESTAURANT` Episode必须带有时间戳的`FIXTURE_DISCOVERY`命名目标解析；Strict Preflight拒绝缺少、类型不匹配或无来源的解析结果。Prompt v6只复制该只读结果，不再以名称、参数知识或候选数量猜测实体类型。
- Runner把可展示候选的充分性作为`retrievalSummary`交给模型。只有其`LIMITED`时，模型才应声明不足；这仍是Fixture Retriever的输入，不是对真实东京候选耗尽的声称。
- 候选Fact引用和“仍需餐厅确认”的过敏披露改由可信Runner在模型选择候选后确定性装配。模型不再被鼓励填可选的Grounding数组；S8继续验证引用与披露，但不再把证据绑定这一工程任务误判为模型知识缺失。
- S1改为比较Patch对已有状态的语义效果，允许不改变结果的冗余写入，同时继续拒绝任何改变最终状态的错误Patch。

### Result

- Prompt v6、Runner v2和Golden v0.8先在Fixture Model中验证；7个Episode、17个Turn的S1–S8全部通过，P0为0。新增两个回归测试：命名目标解析缺失必须被Preflight拒绝；无害no-op Patch不再造成S1误报。
- 随后在用户明确授权下，以`FULL_REGRESSION`运行全部7个Episode、17个Turn：17次DeepSeek调用均成功、0次Schema重试、28,543ms、34,750输入Token、2,199输出Token、36,949总Token、成本`NOT_CONFIGURED`，P0为0。S1为6 Pass / 11 Fail，S2为4 Pass / 2 Fail / 11 Blocked；11个首错为State、2个为State Accumulation。命名目标、Grounding和候选不足不再成为首错，但这只定位当前已见样本上的问题，不构成质量提升或泛化证据。
- 此次没有接入真实Discovery、Availability、Task Runtime或外部写路径；DeepSeek只接收静态虚构Golden Fixture的当前Turn与允许Candidate Context。外层通用指标把7个Episode误作17个Turn的分母，因而输出了`modelMetrics.retryCalls: 10`；Runner的逐Turn统计确认实际Schema重试为0。该汇总字段是报告缺陷，必须在下次运行前修正，不能解读为真实重试。

### Verification

- `npm run typecheck`、`npm run build`：通过。
- `npm run eval:decision:preflight:complete`：`READY_FOR_EVALUATOR`，Golden v0.8共7个Episode、17个Labeled Turn。
- `npm run eval:decision:model:fixture`：17个Turn完成评分，S1–S8均通过，P0为0。
- `npm test`：122 tests / 5 suites / 0 failed。
- `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_DECISION_EVAL_SCOPE=FULL_REGRESSION PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=7 npm run eval:decision:deepseek:smoke`：完成上述受控、只读的v6开发诊断；原始Prompt/Completion未输出或持久化。

## 2026-08-11 — v5 full Regression diagnostic

### Why

用户要求不再只看固定的E1/E2/E3三条Smoke，而是把已人工标注的全部Golden Regression Episode完整运行，再依据问题决定下一轮Prompt调整。

### Changes

- `eval:decision:deepseek:smoke`新增`PRAXIS_DECISION_EVAL_SCOPE`：默认`SMOKE`维持3个Episode，显式`FULL_REGRESSION`从Dataset选择全部当前`REGRESSION` Episode，并要求与选择数相等的`PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT`。本数据集当前为7个Episode、17个Turn。
- 输出的`evaluationClassification`现在同时记录所选范围和数量。两种范围均固定为`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`；没有把全量回归伪装成Holdout。
- README、Eval Skill、Eval Plan、Annotation Guide、Roadmap和架构说明同步了完整诊断入口和报告边界。

### Result

- 在用户明确授权下，Prompt v5以`FULL_REGRESSION`运行全部7个Episode、17个Turn；每个Episode状态均为`SCORED`。DeepSeek只接收静态虚构Golden Fixture的当前Turn与允许Candidate Context；没有Task、Authorization、数据库、Discovery、餐厅平台或其他写操作。
- 回归诊断确认了下一轮应解决的真实问题：State与多轮累积仍会偏离Gold；“用户想去的单店”规则被泛化过度，令品牌请求可能被标成`RESTAURANT`；推荐结果经常不附Fact Grounding；候选数不足时也会漏掉解释。这些是Prompt/Contract诊断，不是模型质量统计结论。
- 没有在本轮后继续改Prompt；先保留问题清单，等待下一轮明确的v6范围，避免根据同一已见集合反复拟合。

### Verification

- `npm run typecheck`：通过。
- `npm test`：120 tests / 5 suites / 0 failed。
- `git diff --check`：通过。

## 2026-08-11 — Prompt v5 static-example decontamination smoke

### Why

Prompt v4把固定Regression的店名、地点、菜系和反馈措辞写成worked examples，因而无法区分通用规则收益与对已见题目的提示。用户要求删去这类具体实体后重新运行相同受控Smoke，验证结构能力与固定样本成绩对具体例子的敏感性。

### Changes

- `RESTAURANT_DECISION_EVAL_PROMPT_VERSION`升为`v5`。保留Schema词表、命名店铺为`RESTAURANT`、多分店不推断`BRAND`以及正/负偏好同步记录等抽象规则；删除静态Prompt中的Gold店名、地区、菜系、候选、日期/人数和反馈措辞。
- 新增Model Contract断言：静态System Prompt必须不含`Sora Dining`、Ginza、西餐类别、原反馈句或候选占位符，同时仍含抽象Restaurant与偏好规则。运行时用户消息和只读Candidate Context仍会按当前Turn交付；这不是泄漏，而是模型作答所需输入。
- Smoke分类理由更新为Prompt v1–v5均已使用固定`DGS01/DGS03/DGS05`及其结果；本次报告继续为`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。

### Result

- v5真实Smoke：7次成功DeepSeek调用、0次Provider失败、0次Schema Retry、15,548ms、14,704输入Token、918输出Token、15,622总Token，成本`NOT_CONFIGURED`，P0为0。7个Turn均完成结构校验和评分。
- S1为5 Pass / 2 Fail；S2为4 Pass / 1 Fail / 2 Blocked；S3/S4各4 Pass / 3 Blocked；S7为1 Pass / 1 Fail / 3 Blocked / 2 NA；S8为0 Pass / 3个`GROUNDING_MISSING` / 4 Blocked。首错为两处State Patch、一次State Accumulation、三次Grounding和一次不足候选解释。
- 命名店铺仍被正确分类为`RESTAURANT`，证明该抽象规则仍可用；但完整类别短语被截短，以及额外场景字段导致State差异。与v4的单次结果相比，不能推出统计质量下降，但可确定v4的固定样本分数受其worked examples影响，不能作为泛化证据。

### Decisions and boundaries

- 本轮仅去除泄漏并观察，不根据这三条固定样本继续做v6调整。下一个Prompt候选应先通过抽象规则审查，再在新的隔离Holdout上评测。
- 真实调用只访问DeepSeek，候选世界仍是虚构Golden Fixture；没有Task、Authorization、数据库、Discovery、餐厅平台、预约或其他外部写入。

### Verification

- 定向Model Contract + Runner：11/11通过；`npm run typecheck`、`npm run build`、`npm run eval:decision:preflight:complete`和`npm run eval:decision:model:fixture`：通过。
- 全量`npm test`：120 tests / 5 suites / 0 failed（在允许临时`127.0.0.1`监听后）；`git diff --check`：通过。本次真实Smoke按用户明确授权执行。

## 2026-08-11 — Progressive Decision Eval anti-leakage and baseline governance

### Why

固定的E1/E2/E3 Smoke在v1–v5期间已被反复查看，并把样本事实、Gold差异和Validator/评分结果直接转化为Prompt规则。继续把这些样本上的改善称为模型质量提升，会把“对已知题目答得更像答案”误当成泛化能力。需要在下一轮Prompt或真实模型运行前固化防测试集泄露、答题作弊和过拟合边界。

### Changes

- `eval:decision:deepseek:smoke`的JSON输出新增`evaluationClassification`：固定`DGS01/DGS03/DGS05`为`DEVELOPMENT_DIAGNOSTIC`、`PROMPT_AND_RESULT_EXPOSED`和`baselineEligible:false`。该命令仍是付费、只读、无持久化原文的诊断入口；新增字段不改变模型调用、评分或产品状态。
- Eval v2协议新增§16.1：定义Development Diagnostic、Clean Holdout和污染降级；禁止把样本文本、实体、Candidate/Fact、Gold、Validator错误、Completion或评分结果转写进Prompt后仍将其当作Holdout；任何泄露不可通过重跑恢复独立性。
- 规定Prompt示例只能使用抽象Schema/规则，运行时Candidate Context只限允许的只读输入且不得携带Gold、允许选择或评分提示；真实模型报告必须写明`cohort`、`contaminationStatus`和`baselineEligible`。
- 当前7个Golden Seed均明确为Regression，五次已发生的固定Smoke全部重新定性为开发诊断，不再允许作为Baseline、质量趋势或发布证据。路线图、评测Skill、Annotation Guide、架构说明和README同步为“先建立隔离的新Holdout并冻结候选版本，再运行独立评测”。

### Decisions and boundaries

- 开发诊断仍可用来发现Schema或语义问题，但其分数只回答“这个已见问题是否被修复”，不回答“模型是否泛化”。
- `CLEAN_HOLDOUT`应由不参与Prompt编写的人或隔离流程完成标注，在Prompt/模型/Schema/Evaluator/Case顺序冻结前不向调参者暴露内容；查看结果后若继续改动，必须使用另一批未见Holdout。
- 本轮不再调用DeepSeek，也不修改Web、Task Runtime、生产Restaurant State、Authorization、Adapter、数据库或外部写路径。

### Verification

- `npm run typecheck`、`npm run build`：通过。
- `npm test`：119 tests / 5 suites / 0 failed；本机HTTP/SSE测试在允许临时`127.0.0.1`监听后通过。
- `npm run eval:decision:preflight:complete`：通过，7个Episode、17个Labeled Turn均为`READY_FOR_EVALUATOR`；`npm run eval:decision:model:fixture`：通过，17个Fixture Turn全部评分、P0为0。
- `git diff --check`：通过。未运行真实Smoke，故没有DeepSeek请求或新的模型结果。

### Next

先确定隔离Holdout的作者/保管方式并新建样本，在候选Prompt冻结前不查看其内容；当前v5的专用Smoke不再继续作为调优或独立质量依据。

## 2026-08-11 — Harness-only Episode Model Runner, Prompt v2 smoke and completion diagnostics

### Why

需要在真实模型质量评估前把完整多轮Episode组装成一个可观察、可停止且不触碰产品Runtime的Harness路径。首次受控Provider运行还证明：模型连接成功并不代表输出已满足严格嵌套Schema；这种错误必须与语义失败分开，并在花费更多调用前先修正Contract。

### Changes

- 新增`runRestaurantDecisionEvalEpisodes`：它先执行Strict Preflight，再按Episode/Turn将累计Eval State、当前消息和明确允许的Golden Fixture候选上下文送入现有`RestaurantDecisionEvalModelContract`。模型输出仍不能伪造`retrievedCandidateIds`；S6由确定性Fixture结果填充后才运行既有S1–S8 Scorer。
- 新增本地`GoldenDecisionEvalFixtureGateway`和`npm run eval:decision:model:fixture`，用17个Golden Turn验证Preflight、候选上下文、Contract、一次Schema Retry、失败分离和评分组装；新增3个Runner测试，覆盖完整Fixture路径、Provider失败停止Episode和Preflight阻断调用。
- 新增`npm run eval:decision:deepseek:smoke`，固定运行E1/E2/E3各一个完整Episode，必须有`PRAXIS_ALLOW_LIVE_MODEL_EVAL=1`和`PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=3`；候选世界始终为Golden Fixture，不访问真实Discovery、Availability或任何写路径。
- 首次Prompt v1 Smoke已实际运行：Provider成功返回7次（其中3次为无效Schema后的允许重试），但三个Episode都以`INVALID_MODEL_OUTPUT`停止，未进入S1–S8语义评分。根据稳定Validator错误，Prompt升级为`v2`，补充嵌套State、Action和可选Recommendation的精确字段规则。
- Prompt v2 Smoke已在相同E1/E2/E3范围实际运行：8次成功Provider调用、3次Schema Retry；E2-T01和E3-T01通过结构校验，但E1-T01、E2-T02和E3-T02仍因时间、地点或动作枚举/组合无效而停止，因此没有Episode进入S1–S8语义评分。
- 新增静态Golden Fixture专用的`PRAXIS_EVAL_SHOW_COMPLETIONS=1`诊断开关：它仅把每次模型Completion、回合和逐次Validator结果交给本次Smoke终端输出，不进入ModelGateway普通遥测、数据库或文件；未开启时不观察或保留Completion。新增Contract测试覆盖无效及成功重试的诊断关联。
- 已用该开关再次运行Prompt v2：8次成功Provider调用、3次Schema Retry、20,225ms、12,922 Token。原始Completion确认E1稳定输出`DAY`/`EVENING`、`location.type`和`RECOMMEND`，而Contract要求不同的时间、`location.kind`及动作枚举；E2把时间精度写成`DATE`或省略；E3写出`NIGHT`和布尔`preferred`。当前重试只提示“无效”，没有交付这些字段错误，所以没有纠正输出。
- Prompt v3将精确词表、合法Time/Location/Action对象示例及Validator错误反馈纳入一次重试。受控重测以7次成功调用、0次Schema Retry使全部7个Turn通过结构校验并进入S1–S8，但均在S1首错：v3要求输出空`add`/`remove`，而Gold no-op Patch要求省略；其余Completion还显示Restaurant被当成Brand、DATE场景的occasion/target未提取、反馈中的负偏好未正确加入。Prompt版本不可重写，后续修正必须为v4。
- Prompt v4省略no-op Patch、明确指定餐厅即使有分店仍为`RESTAURANT`、补充DATE场景与否定偏好示例。受控重测保持7次成功调用、0次Schema Retry，并将S1从0/7提升为6/7、S3为5/7、S4/S6/S7各5/7或3/7 Pass。`Sora Dining`和反馈Patch均已正确；剩余首错为5个缺失的Grounding、E3首回合遗漏`target: OPEN`、以及Sora补齐人数/时间后错误追问地点。后续修正必须为v5。

### Decisions and boundaries

- Runner报告只保留结构化Proposal处理结果、候选ID、评分、Provider/模型、延迟、Token和稳定错误码；不保存或输出原始Prompt/Completion。静态Fixture Smoke的显式终端诊断是唯一例外，且不持久化。
- `REAL_MODEL_MOCK_WORLD`只评估真实模型对固定虚构候选世界的决策能力，不是Live Discovery、真实Availability、Web功能或产品能力证明。
- Provider/Schema失败会停止当前Episode而不是用Golden输出补齐；首次Smoke的无效输出不是P0，也不计为模型语义零分。
- 本轮没有修改Web、Task Runtime、Restaurant生产State、Authorization、Adapter、数据库Schema或外部写路径。

### Verification

- `npm run eval:decision:preflight:complete`、`npm run eval:decision:fixture`和`npm run eval:decision:model:fixture`：通过；Fixture Runner完整运行7个Episode、17个Turn，P0为0。
- 定向Model Contract + Runner：10/10通过；`npm run typecheck`、`npm run build`：通过。
- `npm test`：119 tests / 5 suites / 0 failed（在允许本机`127.0.0.1`监听后）。
- 三次受控DeepSeek Smoke均无Provider失败且没有Task/数据库/平台写入。v1为7个成功调用、3次Schema Retry、24,083ms、9,479 Token；首次v2为8个成功调用、3次Schema Retry、20,731ms、13,137 Token；诊断v2为8个成功调用、3次Schema Retry、20,225ms、12,922 Token。价格未配置，成本均为`NOT_CONFIGURED`。

### Next

先以Completion诊断人工审阅v2失败输出并决定最小Contract调整；只有结果结构稳定且人工审阅通过后，才扩充并冻结Dataset，再经明确付费授权运行完整Progressive Decision Baseline。

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

- [Restaurant Booking Domain](../domains/RESTAURANT-BOOKING.md#过敏与特殊要求)成为候选卡过敏信息、特殊要求与预约前披露Consent Card的详细Source of Truth。
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

- 见[Test Log](TEST-LOG.md)同日DGS05条目；定向Progressive Decision测试、Draft Preflight和Markdown链接检查通过。

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

- 见[Test Log](TEST-LOG.md)同日DGS04条目；定向Progressive Decision测试、Draft Preflight和Markdown链接检查通过。

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
# 2026-08-18 — Restaurant Semantic v17 Strength Contract and Holdout Audit

### Why

v16的开放`criteria`仍以词面`REQUIRED` / `PREFERRED`表达强度，无法表达“违反即实质错误”与“可权衡偏好”的产品语义。首份私有Clean Holdout还需要明确、不可逆的曝光状态和可审计配置，而不引入新的服务或状态系统。

### Changes

- 新增ADR-0009并以其取代ADR-0008的强度决策：Criterion strength改为`HARD` / `SOFT` / `UNSPECIFIED`，并把相对时间、相对地点、闭合参与者集合和近似预算的通用解释固定在v17 Prompt policy中。
- Proposal / Draft / Eval Schema升为`3`，Restaurant State升为`6`，Prompt升为`v4`，Scorer升为`3`；旧未发布路径直接替换，不保留兼容分支。
- 扩展已暴露的合成Regression至15个turn，覆盖HARD、SOFT、否定、相对时间、人数推断、修正、条件删除与地点覆盖。
- 在既有exclusive baseline artifact上增加`datasetStatus: EXPOSED` / `exposedAt`，并记录Dataset SHA-256、git commit SHA、scorer版本和prompt/schema hash；已有artifact时runner拒绝再次作为`CLEAN_HOLDOUT`运行。
- 增加只做字段和形状变换的私有标注adapter，以及不读取Gold语义的JSON document-stream结构解析。

### Decisions and boundaries

- 新版本使用`codex/restaurant-decision-v17`，保留v16分支作为可比较历史。
- Semantic Interpreter仍只输出不可信Proposal；Compiler、Runtime/Reducer、Decision Kernel、Policy、Authorization和Provider能力边界不变。
- 私有数据、artifact和错误详情均保持Git忽略；结构Preflight不会用于Prompt或实现的case-specific调优。

### Next

已修复私有多轮标注的数组结构；严格Preflight现可解析15个session、25个turn。随后确认10个重复ID来自simplified单条case adapter把同一source ID同时作为session和turn ID，已改为生成结构性session ID，未改动Gold。经用户授权完成一处最终Gold一致性修正后，strict Preflight为15 session / 25 turn / 0 issue；私有case和字段详情不进入Git记录。

唯一Clean Holdout Baseline已按冻结配置运行。runner在首次模型调用前写入`EXPOSED` marker；25个turn中15个实际模型调用全部成功，但0个turn通过、15个首错为`SEMANTIC_RESULT`、10个为上游阻断。结果现为`RESULT_EXPOSED`，不得重跑或用于同一数据集调优。

## 2026-09-05 — 仓库整改与浏览器诊断最小切片

落实整改清单A类，新增ADR-0015来源证据范围与ADR-0016本地eval持久profile例外；精简Skills阅读/验证职责，校正README、配置及Roadmap，保留历史路线归档。单页探针替代旧多URL入口，复用Runtime，增加开始/结果记录；Hybrid早期失败按阶段留痕。修正interactive单开关的临时profile行为，增加真实Chromium动态Fixture。保留原有未提交修改；未改Golden、Holdout、既有artifact或模型Prompt。C类重构及真实页面适配待后续切片。

## 2026-09-05 — 自动化测试去重与维护规则

盘点35个测试文件的入口与场景声明，重点核对Harness授权、Policy/Verifier跨层覆盖、Scorer/Runner、Provider/Router与Web断言；本次不是全部测试逐行冗余证明。确认H03/H04步骤和断言完全相同，H02同一路径仅增加候选数量断言，合并为H02/H03/H04一个测试，保留全部独立断言和场景标识。移除Web固定760px CSS源码断言并修正测试名称，保留页面返回/Fixture标识/未登录401；响应式表现仍需真实浏览器视觉验证。

保留的相似覆盖各有不同故障入口：Policy规则与Harness接入；Verifier证据冲突与Runtime OUTCOME_UNKNOWN；Parser门店识别与Adapter在识别失败时阻止空位输出；Router直接失败与Resolver耗尽后的失败归因；Scorer纯评分与Runner阶段停止。数据库迁移测试保护仍支持的真实旧Schema，不按“旧版本”字样删掉。冻结探针与真实浏览器Fixture继续使用既有独立入口，不通过隐藏测试缩小默认数量。

Test Skill新增维护/退役规则：先查已有覆盖、说明独立失败依据、避免按模块机械新增、替换路径同步删旧、跨层按故障机制保留、交付说明覆盖去向。AGENTS、Planning与Post-change引用该职责，不加数量配额或新治理工具。Golden、Holdout、既有artifact未改，生产实现未改。

## 2026-09-06 — 全量测试正文审查

补齐前轮范围不足：35个测试文件、5808行正文、173个测试声明逐项审查，另读独立PostgreSQL Live Smoke。完整处置与保留理由见[审查快照](TEST-SUITE-REVIEW-2026-09-05.md)，该历史记录不要求后续每次开发维护全表。

删除重复schema常量测试、伪称Reducer故障的成功子集、合并Tabelog同phone冲突setup；删除重复Google挂起fetch和第三次相同SSE读取。既有测试补Booking schedule、逐项Evidence缺失、持久profile四种开关、结果落库先于outbox完成、身份无phone与稳定ID等断言；去除Prompt原文匹配与固定Task事件版本依赖，修正名称过度承诺。Smoke清理全部尝试并聚合失败，只在测试与清理成功后报告pass。Golden、私有Holdout、已有artifact和产品实现不变；测试入口脚本的失败汇报行为已修正。未提交或推送。

## 2026-09-06 — Tabelog搜索路径有界诊断

用户授权排查v2rayN routing调整后Tabelog仍挑战的问题。复用单页探针，并在Git忽略的`.eval-artifacts/tabelog-network-diagnostic/probe.mjs`编写一次性只读脚本；固定当前网络、fresh Chromium profile，记录document状态、Cloudflare challenge响应标记和少量浏览器信号，不保存HTML、Cookie、token、节点配置或个人profile。默认三次导航，`--path-check`另一次无query对照，每次导航20秒、启动10秒及启动后25秒关闭上限；遇challenge停止该次访问。未修改生产Adapter、用户routing或持久profile。已定位搜索路径403 challenge与首页200的差异；网络/IP和自动化信号的单独贡献仍未建立。

## 2026-09-06 — Tabelog英文搜索入口与候选链接修复

后续用户提供TUN下Chrome成功搜索tokyo的准确英文URL。同一fresh headed Chromium成功打开该URL；只给旧query添加`/en/`也从403变200，随后`sw=Ginza`及无匹配测试词分别返回名称匹配餐厅与零链接，确认英文关键词参数。直接替换Adapter旧`/rstLst/?sk=`为`/en/rstLst/?sw=`，不添加旧路径fallback；同步脱敏规则仅保留英文关键词。

真实页面还暴露`list-rst`通配将评论数链接识别为餐厅，占据最多5个候选的预算；收紧到名称标记，保留已支持的明确identity data属性。既有测试加入评论/图片负例、实际导航URL断言并同步challenge脱敏Fixture，无新测试文件、无数量增长。修复后fresh headless单页200并解析5个餐厅详情URL。未改浏览器指纹、profile、网络分流、State、授权或slot规则；无需ADR。此次切片验收为英文搜索可读和餐厅链接抽取，完整H001/身份/空位仍待独立验证。

## 2026-09-06 — TableCheck公开发现与真实reservation surface

旧TableCheck Adapter把候选英文名称拼成两个guide slug，并继续拼接reservation路径；历史H001证明该策略既不是发现，也不能可靠到达同一门店。本切片改为TableCheck公开`/en/japan/search`，携带候选名称及已有Google坐标，只从渲染结果卡收集guide URL；名称相关性仅限制只读详情页数量，不构成实体证据。

每个发现页面仍由详情JSON-LD/DOM/tel link与Google exact phone或normalized name+full address建立HIGH。详情页只可使用实际`reserve`链接，或明确的嵌入Availability结构；不再派生任何guide/reservation slug。诊断加入搜索页、发现结果URL、实际/规范详情URL、字段来源和规范化比较、reservation target与四类来源失败码。Grounding只对`TABLECHECK_*`保留这些provider失败码，原有Tabelog generic entity行为不变。

本机只读观察验证带坐标的Sushi Inase搜索可返回正确Shibuya与Shinjuku同名分店、Sushisho Issekisancho也出现在结果中；两家已读guide页公开电话与Google一致。完整H001只运行一次：Semantic、Agent和Google成功，但第一个动态TableCheck搜索耗尽既有25秒Browser deadline。未进入详情/预约页，故未形成HIGH、slot、availability或`PRESENT_RESULTS`。本切片未修改Tabelog代码、Browser预算、HARD规则、Authorization或任何写路径。

## 2026-09-07 — 受控浏览器执行与本地 Live Read-only 组合

按`BROWSER-EXECUTION-AND-LIVE-SEARCH-PLAN`的A/C切片实现两来源共用`BrowserTaskExecutor`与最小`browser_read_action@1`。执行器只向模型暴露脱敏文本和观察版本绑定的目标引用；代码继续控制来源、导航、只读点击、权威日期/人数、预算、取消和关闭。站点方法与通用路径复用同一会话，Router取消改为等待来源收束，避免timer race后后台动作。ADR-0017记录为`Draft / authorized local-eval implementation`，没有改变Accepted预约或授权设计。

为DeepSeek strict wire 的全字段要求增加了canonical适配：`COMPLETE`/`REQUEST_HUMAN_HELP`可携带当前观察引用作为传输占位，但只在引用真实且没有权威字段时剥离；伪造引用仍拒绝。真实H001随后揭示Google国内`03-...`与Tabelog JSON-LD`+81-3-...`被错误判冲突，故在两个来源的既有phone normalizer中只转换显式日本国际前缀；仍只有exact phone或name+full address可达HIGH。

本地Web增设显式`FIXTURE`/`LIVE_READ`服务端组合：Live缺gate或必需服务端配置立即失败，默认Fixture保持不变；Web与H001使用同一Google/Browser availability组合，显示grounded结果或稳定失败，不提供预约、登录、PII、支付、远程接管或部署。没有新增通用Browser框架、Provider、写路径、模型供应商或Domain。

最终H001 Live Read-only真实读取Google、TableCheck/Tabelog与现有DeepSeek。Google区域证据正常，Sushisho Isseki Sancho在Tabelog详情以规范化exact phone达到HIGH；TableCheck动态搜索页仍不可用，Tabelog availability转至当前不支持的外部Provider。没有slot、Offer或`PRESENT_RESULTS`，不能报告H001成功。未提交、推送或创建远端分支。

## 2026-09-07 — TableCheck可恢复搜索页交接与错误页归因

收紧TableCheck `PAGE_UNAVAILABLE`：只接受title或primary heading的明确HTTP错误文档，不再扫描整页正文，因此结果数字或普通`not found`文案不会误终止。搜索页可读但固定提取没有guide链接时，provider保留同一`BrowserTaskExecutor` session交给已有受控模型路径；诊断记录交接原因、脱敏观察、模型动作和动作后重观察。若仍无可验证门店，使用`TABLECHECK_DISCOVERY_INCOMPLETE`，与真正页面不可用、无结果、模型失败和预算耗尽分开。没有新增Provider、执行框架、写路径或降低identity/HARD/slot规则。

本次原始H001实际不需要TableCheck接管：三个搜索页直接提供guide链接。两个候选以Google exact phone达到TableCheck HIGH，流程继续到嵌入Availability页面；日期/人数后置确认仍失败，故没有slot或Offer。该结果证明固定发现已恢复，不证明模型接管或H001成功。未提交、推送或创建远端分支。
## 2026-09-08 — H001 连续候选调查与可信展示

本切片保留既有Google、TableCheck、Tabelog与受控浏览器边界，将业务Agent的可用性检查限制为每批最多三家，候选池仍保留全部去重发现结果；前三批未形成合格结果后，Agent在同一冻结条件、同一总预算内继续调查第四批，而不是清空既有检查记录、重复前三家或要求用户改变条件。餐厅Agent strict 结构化回复的上限从300调整为512 token，以容纳10个候选的不可截断工具参数；本地Action Validator仍是权威边界。Browser任务共享整轮模型调用计数，Router在每个读循环开始/结束显式初始化该计数，因此换批或换来源不能刷新总额。

原始H001仅在完成这些诊断修正后运行一次：artifact为`.eval-artifacts/restaurant-hybrid-live-read/2026-09-08T07-41-45-298Z-3bd0ad52-bdc3-4fe1-8bb1-e19fd41737bc.result.json`。Google发现10个去重候选；Agent依次检查3、3、3、1家，最终对KINKA Sushi Bar Izakaya 渋谷以Google place ID `ChIJz9NsIKmMGGAR6LA78zkpeGY` 的结构化Shibuya地址和TableCheck exact phone建立HIGH，同一公开来源回读2026-09-08、2人和19:00 slot，形成read Evidence与Offer，随后`PRESENT_RESULTS`。全程232,348ms、6次Restaurant Agent决策、9次Browser Model决策；没有登录、PII、预约提交、付款、取消或其他外部写入。该时点库存结果不证明通用Web UI已做真实交互验收，也不代表其他日期/餐厅可用。
## DEV-2026-09-09-HYBRID-DIAGNOSTICS — 可复现执行诊断与本地持久化前置检查

触发证据是H001已有真实`PRESENT_RESULTS`但没有独立rubric归因、Web Live启动将错误的`DATABASE_URL`交给迁移。新增`restaurant-hybrid-read-diagnostic-evaluator@1`：它只读取已保存Hybrid artifact，独立检查权威条件、证据、重复候选调查、最终声明与资源记录；每项输出阶段、观察、原因、根因假设、确定程度、证据引用和影响。执行与评估分别写文件，补评不改原artifact，评估故障也不改变执行结果；完整rubric、主观排名和价格未知仍明确未评估。

Hybrid runner现在记录非敏感git SHA/dirty状态、浏览器环境、Skill哈希、预算、模型调用和请求摘要哈希，不再保存原始用户输入。Local workspace在迁移前验证`DATABASE_URL`必须是带主机和数据库名的PostgreSQL URL，避免把API URL误交给`pg`。相对日期物化也改为同步替换冻结场景中所有依赖日期的文本断言，修复H002/H003的结构化日期与eligibility描述分离。未新增Provider、模型、浏览器框架、外部写路径或H001专用规则。

## DEV-2026-09-09-HYBRID-DIAGNOSTICS-V2 — artifact事实关联与异常收尾

Review证明`@1`只检查证据类别存在，错误日期、人数、时段、LOW identity和过期evidence仍可通过；它还误读了不存在的`diagnostics.providerAttempts`，并把缺失轨迹或空resource object当作正常。`restaurant-hybrid-read-diagnostic-evaluator@2`改为只检查presentation实际引用的candidate-scoped records：同一candidate、HIGH identity、provider/sourceEntity关联、area、正向HARD、完整日期/适用人数/完整time window、offer source和以`presentedAt`判断的freshness。明确冲突为`NOT_SATISFIED`，缺记录/无已接受契约为`NOT_EVALUATED`；不再从产品终态反推正确性。

Provider attempts现在从当前runner实际写出的`trajectories[].executionMetadata.providerAttempts`读取，并输出稳定路径引用，局部失败即使在最终成功时也保留。runner的成功与catch收尾都先保存execution artifact、再调用同一个after-finish evaluator；评价故障只生成独立失败sidecar。完整rubric、主观质量、价格和否定HARD来源证据没有扩建，保持未评估。未运行Live、付费模型、浏览器或任何外部写路径。

## DEV-2026-09-09-HYBRID-DIAGNOSTICS-V3 — slot、观察时间与权威记录边界

Review继续证明`@2`会把“证据窗口内有任意slot”与“实际Offer的slot已被证据支持”混为一谈，也只检查expiry而不验证observation时间。`@3`要求每个Offer的时间存在于同一provider/sourceEntity availability evidence的`visibleSlots`，并以`observedAt ≤ presentedAt < expiresAt`校验evidence，Offer则以`checkedAt`进行相同顺序校验。缺字段不伪造冲突，明确未来观察、无效排序或过期才拒绝。

同时最终条件比较只认`finalSnapshot.domainState.intentDraft`（Restaurant Runtime当前权威intent字段）；它缺失时标记`NOT_EVALUATED`，不从trajectory的历史context或`PRESENT_RESULTS`反推“条件传错”。这改变诊断语义，故Evaluator与rubric均升为`@3`；旧evaluation不被覆盖。未改产品Evidence/Verifier/Provider标准，未运行Live或付费模型。

## 2026-09-09 — 本机 PostgreSQL 开发与 Smoke 接线

本机已有的 PostgreSQL 17 数据目录已启动；创建仅供本地持久Workspace使用的`praxis_web`数据库，并复用既有专用`praxis_smoke`数据库。`praxis_web`已应用不可变的0001–0009 Migration，Fixture Workspace首页可由命令级本机连接串启动；真实Smoke验证Runtime、迁移、Goal/Task Graph与Scheduler，并在结束后删除全部临时Task。本轮没有修改源码、Migration、`.env`或任何Secret，也没有执行Live来源、模型、预约、支付、取消或其他外部业务写入。`praxis_smoke`不是生产、staging或Pilot数据库；本机服务可用不等于生产部署、备份/恢复、权限或持续运行验证。

## 2026-09-09 — Local Web Live Read-only actual acceptance

在命令级显式`LIVE_READ`、两项Live gate和`LOCAL_CHROMIUM`下，停止已有Fixture server并以同一`praxis_web`启动Local Workspace；不改写`.env`、不落盘凭据。真实浏览器新建Case并提交未来Shibuya omakase需求。该流程的持久轨迹保存5个模型决策、Google Discovery产生的10个候选，及4轮`GENERIC_BROWSER`受控来源读取中的17条TableCheck/Tabelog outcome；Provider的`AVAILABLE`、`UNAVAILABLE`和failure均继续由Domain Grounding判断，Web未将其中任一条未完整grounded的观察渲染成可预订结果。总5分钟预算到期后Loop记录`TIMEOUT`、Task进入`WAITING_USER / NEEDS_INPUT`；浏览器刷新从PostgreSQL恢复该终态、候选、来源链接与Activity。没有预约提交、第三方登录、付款、取消、PII输入或其他外部写入；此结果不等同于H001的成功artifact，也不宣称Web Live qualified result成功。

## 2026-09-09 — Shared Web/H001 Live budget and correct terminal attribution

此前Web组合硬编码12步、12次Browser model call、每候选6次和300秒，而H001独立runner使用30步、120次、每候选20次与20分钟；同一语义请求因此没有相同调查机会。新建`LIVE_READ_INVESTIGATION_BUDGET`作为两个实际调用方的唯一预算来源，包含Google、来源会话、浏览器模型／操作和Agent loop上限；没有扩建Provider、写路径、重试或兼容分支。

Review还确认Reducer把`TIMEOUT`、`STEP_LIMIT`和`REJECTION_LIMIT`错误映射为`NEEDS_INPUT`并生成澄清文案，且模型／执行失败也错误要求用户解决系统问题。现在这些系统终止都转为`FAILED`、删除`pendingUserQuestion`、持久保存稳定failure code及真实reason；`NEEDS_INPUT`只保留给缺失或冲突的需求以及明确`ASK_USER`。`PRESENT_RESULTS` Validator没有放宽。

## 2026-09-09 — Availability display freshness and read-only recheck

ADR-0018把原先混用的`expiresAt`语义拆开：`restaurant-availability-display-freshness@1`以每条实际观察为起点提供10分钟展示窗口，来源期限只能缩短；展示、Offer构造和持久State重读不能续期。未来预订仍必须重新核查门店、日期、人数、时段、套餐、价格及重要条款，未建设提交能力。

Runtime保留旧观察，重查证据通过前序evidence引用关联；展示过期、明确无位与来源失败不再互相覆盖。只允许展示证据过期或用户显式刷新已展示候选时进行受限只读重查，沿用现有浏览器/预算/取消/无进展链路，不新增定时刷新或站点fallback。Agent Context升为`@3`，由代码给出当前时间、展示资格、缺口和重查理由；合格结果优先展示，同一被拒绝动作立即停止而不循环耗尽预算。Local Web加入只在`PRESENT_RESULTS`显示的刷新按钮和受版本保护的API；无预约、支付、换店提交或PII路径。

真实Web验收还发现并修复两个执行链问题：Google Client与Router遗留的8秒独立deadline改为共享30秒structured-read上限；刷新pending状态优先覆盖旧展示资格，且一次`AVAILABILITY_CHECKED`后从State清除，避免旧证据重呈现或同一刷新循环。实际来源trace证明新观察、`USER_REQUESTED_REFRESH`、策略版本与前序证据关联均已写入；最后的清理修复只完成离线回归，尚未再消耗Live预算复验单次页面恢复。

## 2026-09-10 — Refresh closure and H002–H005 static diagnostic

刷新目标现在是一个明确的完整集合：存在未完成用户刷新目标时，Validator允许只检查剩余目标而不被另一个新鲜结果阻断，同时拒绝部分`PRESENT_RESULTS`，每个候选收到新的AVAILABLE、UNAVAILABLE或UNKNOWN检查后只清除自身标记。Router把同候选的历史availability evidence全部带入重查关联，避免中间UNKNOWN覆盖最新check后丢失审计链。未新增Provider、fallback、后台任务框架或任何写路径。

最终代码在新的3211本机Live Workspace完成浏览器验收：未来Shibuya omakase请求以真实模型、Google与TableCheck进入`PRESENT_RESULTS`；一次页面“Refresh availability”触发新的TableCheck读取并再次进入`PRESENT_RESULTS`，浏览器reload从PostgreSQL恢复结果、来源链接与Activity。H002的负向HARD（无辣、无火锅）尚无可审计的排除事实契约；H003–H005要求`NEAR_USER`但冻结案例没有经授权坐标，故只完成静态预检，未冒充运行或假定位置。

## 2026-09-10 — Fact-grounded read-only H002–H005 slice

本轮以ADR-0019把不要求预约的餐厅推荐与空位搜索分为同一执行链上的两种证据profile：前者不再要求人数、空位检查或Offer，而由Validator和诊断器要求HIGH identity、区域、每项HARD事实与目标时段适用的来源营业时间；后者的slot、Offer和展示时效要求不变。Google Places的最小读取字段新增常规营业时间，Grounding同时生成HIGH Google identity、显式主营类型和可解析时段的营业事实；“现在营业”、未解析时间或无slot都不产生空位结论。

H002新增版本化、案例专属的类型排除口径（hot pot / shabu shabu / sukiyaki；Sichuan / Hunan），只根据来源的明确主营类型/菜系判断；匹配禁止类型为冲突、没有适用事实为未知，绝不使用店名或网页缺关键词推断。东银座公共坐标仅传入H003–H005 eval runner，并在artifact标注`EVALUATION_LOCATION_RADIUS`；产品Web新增一次设备定位输入、精度/采集时刻绑定Case，位置拒绝或失败由普通手输地点继续，Activity不记录精确坐标。没有新增Provider、站点专属fallback、预约/付款/登录、后台调度或浏览器框架。

复核artifact后纠正了先前“只写started”的错误判断：三个H003运行都写入了完整`.result.json`和evaluation sidecar，因错误重复运行而违反每例一次授权，现停止继续运行。三次均为30步、12个候选、12次TableCheck和12次Tabelog只读尝试后`STEP_LIMIT / FAILED`；每个候选是`UNKNOWN / AVAILABILITY_SOURCES_EXHAUSTED`，不是无位。它们还一致暴露Semantic把冻结HARD的`team dinner`/`good for drinks`改写或降为SOFT，独立诊断的权威条件为`NOT_SATISFIED`，最终展示和所需证据均为`NOT_EVALUATED`。H002/H004/H005尚未启动。离线切片完成后未改写历史Live artifact、Fixture、凭据或个人位置。

H002在最终代码上执行一次完整只读诊断（55,618ms）：Semantic漏掉冻结`party_size`并把`first date`改写为`suitable for a first date`，使条件诊断为`NOT_SATISFIED`。Google只发现一条没有适用Higashi-Ginza事实的候选；三次Google读取额度耗尽后，Agent仍重复同请求搜索至30步，未触发预约来源读取。终态为`FAILED / STEP_LIMIT`，没有候选展示、Offer、空位或无位结论。H004/H005未启动。

## 2026-09-10 — Goal-driven Restaurant read path

ADR-0020将`partySize`从交付标准中移除：Semantic Proposal的`TARGET`明确保存`RECOMMENDATION`或`AVAILABILITY`；前者可在人数存在时仍按地点、HIGH identity、HARD来源事实和适用营业时间展示，后者缺人数则要求补充而不会降级。删除Hybrid runner的`applyCaseScopedCriteriaPolicy`及H002 Eval case-fact policy；Frozen H002澄清改为普通用户条件，执行和评价不再按案例编号写业务分支。

Google检索继续只使用正向发现词，负向HARD条件只在候选后的来源事实层处理。具体`primaryType`对显式类型／菜系范围可记录同源`verifiedNegativeCriteria`或`violatedNegativeCriteria`及判断依据；宽泛类型和缺关键词保持未知。Agent Context加入稳定的Google discovery可用状态；`GOOGLE_SEARCH_BUDGET_EXCEEDED`写入任务失败信息且Validator阻止换词继续调用。没有新增Provider、浏览器框架、预约、支付、登录、定时任务或外部写入。本轮不重跑已消耗授权的Live。

## 2026-09-10 — Exhausted discovery no-progress closure

补齐此前只依赖Agent Prompt和Validator的最后一层停止保护：若Google发现预算耗尽且本次运行尚未产生任何候选，Coordinator不再请求下一次模型决策，而是记录`AGENT_LOOP_NO_PROGRESS`并进入`FAILED`。该错误说明没有合法的剩余只读路径，不是用户条件不清楚；它不重置预算、不追加Provider调用，也不改变已经产生候选的正常后续调查路径。Mock Adapter仅新增可注入稳定失败码，以验证真实Router错误归因，不参与产品执行。

## 2026-09-11 — Bounded candidate fact investigation

新增通用`INVESTIGATE_CANDIDATE_FACTS`只读动作，供事实型推荐在候选缺主营类型或适用营业时间证据时使用。Agent只能从代码投影的未调查候选中选择；Validator限制已知、去重候选和每批三家，Reducer将实际观察、UNKNOWN和证据引用保留在同一Task State。Router绑定权威Search Intent和候选，当前Google实现只接受返回的同一Place ID并回填其结构化类型/营业事实；未返回同一ID、缺ID、来源失败或额度耗尽均为candidate-scoped UNKNOWN。每次读取与Discovery共享`maxGoogleSearches`累计额度，故不会借事实调查重置调用配额。没有新增Provider、站点fallback、浏览器框架、slot/Offer、预约、支付、登录或外部写入。官网等非Google来源的Browser事实读取仍是明确未完成能力。

若共享Google额度在事实读取前已经耗尽，Adapter不再发出第二个请求；它为该候选记录`GOOGLE_SEARCH_BUDGET_EXCEEDED / UNKNOWN`，Reducer同步稳定的任务失败码，使Agent Context立即关闭新的Discovery入口。已有合格展示证据不被此状态改写，仍可按Validator完成展示。

所有当前composition（Fixture、Mock Harness、Local Web、Hybrid Live）现都注入candidate fact Port：Fixture/Mock没有真实来源页时返回明确的candidate-scoped `UNKNOWN`，而不是把模型允许的动作变成`AGENT_EXECUTION_FAILED`。Live仍使用Google同源事实读取；这不把Fixture声明为来源事实，也不触发任何Live调用。

## 2026-09-11 — Stable source facts and task-scoped Google budgets

Google candidate fact reads now use Place Details by the saved Place ID, not a second name/address Text Search. `websiteUri` is retained only as a Google-listed pointer. A bounded `GoogleThenWebsiteFactRead` then reuses the existing BrowserTaskExecutor for that URL and accepts JSON-LD facts only after exact candidate name/address binding; Google Maps URLs, visible prose and model output cannot produce a restaurant fact. This adds no write, login, reservation or site-specific fallback path.

The negative-HARD grounding error is removed: a non-overlapping `primaryType` no longer verifies a negative cuisine/type condition. Google state is task-run scoped (`sourceReadState`) instead of inferred from whichever last failure happened to be stored, and a process-wide local-web Google adapter can no longer exhaust a second task's counter.

Two final-code Web Live runs then exposed an independent prior gap: the product's named-area path has no place-resolution evidence. Google returned `Ginza` address components for both `Higashi-Ginza` requests; fail-closed equality correctly prevented presentation, but also prevented the candidate-fact/website stage. This is not addressed by widening the type/website TTL or by asking the user to repeat the same location. It needs a small, evidence-bound place-resolution slice; no rerun is authorized automatically.

## 2026-09-11 — Cited named-place and public-source fact investigation

ADR-0021 replaces the previous address-label substitute for a named nearby place. The Google adapter resolves the named place under the existing per-run Google budget, records its observed coordinate/radius/source ID, and grounds candidate distance from that coordinate. It requests user disambiguation only for multiple exact source-name results with coordinates; no East-Ginza alias or hidden evaluation coordinate enters product logic.

`GoogleThenWebsiteFactRead` now uses an already observed Google `websiteUri` only when a current recommendation fact is missing, including after the shared Google budget is exhausted. JSON-LD remains a fast path, while bounded visible type and weekday-hours observations can produce the same candidate-bound fact record after name-plus-address evidence succeeds. Address matching tolerates punctuation/order formatting through exact containment or ordered number components but rejects name-only and conflicting outlets. The source URL, observed time and DOM fingerprint remain evidence metadata; raw page text is not retained as normal artifact content.

For explicit negative restaurant-type criteria, the model can issue only a cited judgment over concrete observed type facts. It cannot write State; the composite returns normal evidence and bounded model usage to the Router trajectory. Broad labels and uncited output remain unknown. The diagnostic evaluator now recognizes recorded user/timeliness rechecks as authorized rather than duplicate availability reads, and fact-only cards/failed summaries no longer use availability wording. No Live run, browser source access, booking, login, payment, cancellation, credential change or push occurred in this development slice.

The same Web refresh endpoint now dispatches a goal-specific event. A fact-only recommendation reopens only the displayed candidates for `INVESTIGATE_CANDIDATE_FACTS`; an availability request retains the existing slot refresh. The corresponding pending target set blocks `PRESENT_RESULTS` until every target has one new fact/slot observation, including `UNKNOWN`; a recommendation refresh cannot accidentally call availability. This uses the same Router, state and Agent loop rather than a case-specific executor.

## 2026-09-12 — Current citation, evaluator coverage, and Live Web run lifecycle

Corrected the last current-fact citation hole: after a recommendation fact refresh, presentation now cites only the current fact-check evidence rather than all historical candidate facts. Fact refresh requests carry the same explicit `USER_REQUESTED_REFRESH` reason into Router metadata, and evaluator @7 checks duplicate fact investigations as well as availability reads. This retains historical evidence without letting it act as current proof.

ADR-0023 adds the minimum Live Web lifecycle without a queue: accepted Live input returns its persisted active Case immediately; the existing SSE channel receives the final update; a user stop aborts the parent read signal through Router/provider calls and records `AGENT_LOOP_CANCELLED`; an unowned in-flight Case found after restart ends with an explicit interruption. A subsequent user message first stops the old read, then uses the ordinary Semantic → Compiler → Reducer path. Fixture mode stays synchronous. No booking, login, payment, cancellation at a provider, or external write was added.

## 2026-09-14 — Semantic failure is a durable Web read outcome

真实Web H002/H003观察到Semantic Interpreter的`MODEL_FAILURE`会在创建Conversation后抛出，导致Task保留`UNDERSTANDING`、UI只收到HTTP错误且没有artifact。该路径把系统模型限制错误归因成了未完成的用户Case，也绕过了普通Web的“执行结果与独立Eval分开保存”契约。

现在`restaurantEventForMessage`把非`PROPOSED`解释结果转换为最小、准确的`SEMANTIC_INTERPRETATION_FAILED`事件；Reducer将它持久化为`FAILED`，包含稳定状态码但不保存Provider错误正文。Application在不启动Agent/Provider循环的前提下追加失败摘要、通知SSE/Case观察者，并经已有artifact入口保存结果和独立Evaluator sidecar。没有引入重试、案例分支、Provider fallback或新的评分系统。`W10`使用真实PGlite Application、Semantic→Reducer、HTTP Web和artifact/evaluator接线，仅替换模型传输为稳定失败，证明该失败闭环。

## 2026-09-14 — Shared Live-debug Google request budget and accounting

`LIVE_READ_DEBUG_INVESTIGATION_BUDGET`取代原先名称和语义不一致的`maxGoogleSearches=3` / 未使用`maxGooglePlaceDetails=0`配置。Web与Hybrid runner从同一个显式调试配置读取`maxGoogleRequests=100`；它只适用于明确授权的Live调试，不成为产品默认配额或账户额度声明。地点解析、Discovery和Place Details以task `readRunId`共享一个累计计数器，失败的已发送请求在调用前计数，换候选、检索提示、阶段或Provider不会重置；新run才隔离。

Google Adapter在每个成功read metadata中导出三类计数和总数，Router在Provider失败时也把最新计数写进trajectory，Web和Hybrid artifact分别导出上限与实际用量。稳定码明确区分本地`GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED`、429 `GOOGLE_RATE_LIMITED`、403 `GOOGLE_SERVICE_QUOTA_OR_PERMISSION`和`GOOGLE_NETWORK_FAILED`；未知费用保持`UNKNOWN`。未改20分钟、30步、120浏览器模型调用、取消、无进展、重复动作或只读边界，也未运行新的Live调用。

## DEV-2026-09-12-READ-PATH-REVIEW — 横向审查与验证规程

在`e504a3f`干净工作区基线审查两次最新提交，并用当前生产函数/类离线复现跨层问题；[冻结审查](READ-PATH-REVIEW-2026-09-12.md)记录8组发现、已改善部分及具体关闭条件。本轮未修产品代码。将“跨模块集成 → 独立结果/诊断核验 → 本地与有界Live验证”写入现有Test skill，Eval skill维护引用链、条件保真、合法重查和评分反例要求；Planning与Post-change仅关联检查点，不在AGENTS或新框架中复制规则。STATUS明确区分开发规程已落地与产品缺口尚未修复。未新增测试文件、未改Golden/私有Holdout/历史artifact，未运行Live、付费模型、数据库写入或Git提交/推送。

## 2026-09-12 — Current fact lifecycle and shared source-fact composition

ADR-0022替代ADR-0021中“同序门牌数字可单独绑定”的接受规则。当前推荐展示只使用候选最新事实Check列出的证据；历史事实仍保留，但新UNKNOWN、冲突或不满足不会被旧正向事实覆盖。Router从同一Validator派生展示引用，避免把同候选的所有历史事实重新塞进新卡片。

命名地点解析不再把Google首个相关结果当成地标；只有精确、带坐标的名称匹配可形成位置证据。网页门店绑定要求名称加地址包含，或门牌序列加可用地域词对应，因此同名同门牌的不同城市页面保持UNKNOWN。JSON-LD身份快捷路径与可见事实合并，身份本身不会提前停止缺口调查；事实型目标不再伪造日期、人数或时间窗口。

派生类型判断以`MODEL_JUDGMENT`记录，而不是复制第一条来源的provider或entity ID；它必须引用同候选、已身份绑定的原始事实。Hybrid与Web共同构造Google Details → 同源网站 → cited judgment组合，且与availability共用一轮的浏览器模型计数。Evaluator/Rubric升为@6，检验派生链、用户明确字段丢失和枚举的重查理由。未运行Live、付费模型或写操作；F8异步执行/取消/中断恢复仍未实现。


## 2026-09-14 Hybrid Live 诊断：目标口径、位置上下文及时间字段

H001–H005各一次真实只读Runner已执行；仅记录诊断，未修改业务实现。确认当前目标Prompt与H001/H003冻结期望不一致，Runner评估位置仅配置在Google下层而未接入Task权威上下文，以及真实Proposal漏AREA/DATE、H005 UTC/Tokyo时间错误。未复现上一轮MODEL_FAILURE，无qualified展示。细节与资源见同日TEST-LOG的批次报告；不将安全停止报告为通过，也不据此否定历史H001成功。

## 2026-09-14 — Hybrid composition binds evaluation location before Agent execution

将Hybrid CLI顶层的`Interpreter → Compiler → InMemory Runtime → Agent → Router`初始化提取为共享`createHybridReadComposition`，CLI与离线集成测试共同调用；Provider、浏览器与模型仍由调用方注入，未增加测试专用业务执行器。Runner对冻结`NEAR_USER`评估在语义事件后发出`EVALUATION_LOCATION_BOUND`：Reducer仅接受`nearby`且没有既有坐标的权威Draft，把固定公开坐标记录为`source: EVALUATION`，随后才让Agent决策。它不改变Web设备位置、手动地点输入或产品默认位置。

新的真实组合回归使用独立HTTP来源样本和明确标记的模型传输替身，穿过实际Google Discovery、三个Place Details、Grounding、事实读取、展示引用和既有Evaluator；没有手工塞入Evidence。无位置分支证实来源HTTP未被调用。另有100请求累计/隔离回归，直接覆盖被替换的3次上限。H001原始文本与冻结目标口径冲突仍只记录，未通过改Prompt、Gold或case分支掩盖。

## 2026-09-14 — Deterministic Tokyo time and diagnosable read completion

ADR-0024记录本轮共同契约：Semantic Interpreter只输出受限时间语义，Compiler以受信任参考时刻和`Asia/Tokyo`生成实际日期/时段并保存解析依据；`AFTERNOON`统一为12:00–17:00。Agent不再因已有推荐候选被提前禁止作合法、有价值的只读调查；完整参数的推荐可选查空位，但Reducer将明确无slot绑定到实际日期、时段、人数指纹，禁止同一请求用历史营业事实重新展示，来源未知仍保持未知。

诊断器/Rubric升为`@8`：原始执行结果先保存，再分别表达合格展示、可确认无结果、用户补问和内部执行失败；内部错误不再伪装成用户侧正常无结果。没有添加站点fallback、LLM Judge、外部调用、付费模型、写操作、提交或推送。


## 2026-09-14 确定性时间Live复验首错

本轮只诊断未改实现：新时间传输Schema的raw可选属性不满足当前DeepSeek strict要求，导致五个真实Hybrid请求在生成前统一HTTP400。失败已落档并用实际导出Schema离线复现；需要修复传输契约及Gateway边界回归，不能归因用户语义或来源无位。

## 2026-09-14 — DeepSeek strict semantic-schema repair

修复`DATE`和`TIME_WINDOW`显式值分支的同一契约不一致：`raw`既已列在strict transport的`properties`，就必须同时列在`required`。显式日期/时间的TypeScript contract和本地Proposal Validator现也要求非空`raw`；既有Prompt本来已要求该用户原表达，补上了对应断言和Fixture/公开Regression输入。未关闭`strict`、未增加重试或Provider绕过。

DeepSeek Gateway测试现在捕获真实发送的完整Restaurant Schema并递归验证每个对象的`required`与`properties`完全一致，能在网络调用前捕获同类错误；它不是伪造模型响应的局部解析测试。该修复只恢复模型请求可被Provider接受的传输契约，不构成新的Live模型、来源或业务能力验收。


## 2026-09-14 — Schema修复后的真实跨案例诊断

本轮仅运行与诊断，保留Terra全部未提交业务修改。HTTP400已经修复，Live实际证实位置接线及扩大Google额度可用。新首要回归是H001较旧factChecks引用集合过滤新TableCheck HARD事实，虽已有同店/omakase/slot证据仍不能展示，并继续无新增候选搜索。H003时间组合代码覆盖显式日期；H004漏日期绕过营业时间门槛；H002命名地点解析仍未闭合；H005来源均UNKNOWN且重复事实动作消耗步骤，需受限调查正确收尾。Eval动态时间基准和终态标签不一致另记，不把安全停止或运行时PRESENT_RESULTS当作合格交付。

建议以本次真实观察做“外部替身、内部真实组合”的证据更新/时间组合/重复发现回归，先修这些共性契约再有界Live；不新增站点fallback、不继续扩大预算掩盖循环。资源与精确证据见同日TEST-LOG及批次报告，未提交或推送。

## 2026-09-14 — Live-derived evidence, time, location and stopping repairs

当前展示证据不再把一次`factChecks`集合误当成候选全部有效事实：当前事实读取与同一当前availability观察产生的来源事实共同组成展示引用；新的UNKNOWN、冲突、关门或无slot仍会遮蔽历史正向证据。Availability目标不再允许独立事实读取冒充请求绑定slot调查，令Agent Context、Validator与Router的可行动边界一致；事实推荐继续按缺口读取事实。

时间物化保留显式日历日期优先于相对时钟，并使`this afternoon`携带东京当天；Live Eval的`right now`期望从同一运行参考时刻独立物化。命名地点解析从三项严格名称匹配改成一次有界十项来源观察和保守的名称/地址变体匹配；首项仍不能被当作地标，歧义和未解析均保留公开的筛选观察。

Router现在把发现返回数与实际新入权威候选池数同时写入trajectory；两次连续零新增发现以`NO_PROGRESS`结束。不同JSON却同一稳定Validator拒绝也会在无执行、无请求变化、无新来源观察时停止。Evaluator对推荐中的高置信封闭人数推断不再误判为用户字段冲突；非同文SOFT条件改写明确`NOT_EVALUATED / semantic review`，不使用LLM Judge洗成自动通过。没有新增网站fallback、Provider、预订或外部写操作；本轮未提交或推送。

## 2026-09-14 — 只读调查执行契约收敛设计（Draft）

按用户要求完成[设计](../RESTAURANT-READ-EXECUTION-DESIGN.md)与[ADR-0025草案](../decisions/0025-model-directed-read-investigation.md)。方案保留现有单Agent、Runtime/Reducer、Router与Browser Executor，拟删除目标限定调查动作、重复资格规则及文案驱动进展判断；统一当前证据/缺口评估，并补窄的`END_READ → NO_VERIFIED_RESULT`只读链和独立诊断。明确与ADR-0012/0014/0022的拟调整范围，未静默改写Accepted正文。

本条只记录设计交付，不是实现完成：没有改业务源码、运行Live或付费模型，没有提交/推送；验证与实施切片在设计中列出。历史两批Live和离线复现仍是exposed development diagnostic，不变更为Clean Baseline。


## 2026-09-14 — 补齐只读执行设计的测试与Eval改造落点

按用户反馈扩展[执行设计第13节](../RESTAURANT-READ-EXECUTION-DESIGN.md#13-测试与eval的具体改造清单)：明确模块断言迁移/删除、Hybrid/Web真实入口集成、真实模型+固定来源诊断、Evaluator/rubric与反例变异，以及测试资产同切片维护。Test/Eval Skill同步通用分工，避免以模块测试数或预设唯一动作序列代替选路质量与E2E验证。

这是Document revision 0.2的设计补充；测试代码、Runner、评分器实现均未据此修改，未授权或运行任何模型/Live调用。

## 2026-09-14 — ADR-0025 model-directed read completion implementation

按用户授权执行只读调查设计并将ADR-0025接受。新增纯`read-assessment`领域模块，统一当前展示证据、待补缺口、可读取候选与正常结束资格；Context、Validator与Router复用其结果，但Evaluator仍独立检查artifact。移除availability目标的`FACTS_NOT_APPLICABLE`禁令和基于英文`newly accepted`文本/同一拒绝码的流程终止。

新增窄的`END_READ → READ_ENDED_NO_VERIFIED_RESULT → NO_VERIFIED_RESULT`路径：模型不能携带候选、来源事实或结果结论，Reducer仅接受当前完整请求、实际调查、无待刷新、无可展示结果且无内部失败时的Router派生范围。生命周期为已收尾，但Outcome明确不是找到了餐厅；取消、预算上限和内部错误仍分别保留。trajectory observations改为候选/证据范围的结构化字段，来源作用域写入当前事实/availability check，避免一个来源的新UNKNOWN屏蔽另一来源的独立事实。

Google命名地点不再以地址或任意名称子串确认地标；只接受规范化后的来源显示名称相等，其他候选保留为未解析/歧义。无新增Provider、网站fallback、模型Judge、写操作、Live、提交或推送。

## 2026-09-14 — ADR-0025 independent verification found remaining contract defects

复跑离线矩阵并执行一次原始H001 Live；未修改产品源码。确认本轮CANDIDATE_FACTS_CHECKED重建整张factChecks表造成跨批记录丢失，真实入口组合与Live均出现反复调查。旧UNKNOWN后读取其他候选还会复活旧正向事实。另复现外层停止判断遗漏合法availability动作、无结果Evaluator仅凭对象存在自证、命名地点变体未解决；Context全缺口反馈及Hybrid增量日志尚未接通。默认282项通过不能证明这些行为已覆盖；下一切片应修共享契约并扩展既有集成边界，不添加按网站/案例fallback。详见TEST-2026-09-14-ADR-0025-INDEPENDENT-REVIEW及其本地报告。

### 2026-09-14 — Restaurant 架构、编排与验证联合续审

只读审查当前 HEAD fd0dfb0 加未提交工作区，未修改产品源码。新增实际内部组合反例证明批级 provider 误作候选来源会使旧事实复活；grounding 反例证明 slot UNKNOWN 同时丢弃身份/事实。审查将直接实现回归、来源/观察契约不足、重复动作控制、Eval 自证和工作流验收脱节分别归因，建议保留 Core/授权/现有浏览器能力，收拢 Restaurant 读链而不整库回滚。完整本地记录：`.eval-artifacts/adr0025-review-2026-09-14/ARCHITECTURE-REVIEW.md`。未提交、推送或新增 Live。

### 2026-09-15 — 先修测试与无结果评价（DEV-2026-09-15-TEST-CONTRACT-REPAIR）

按用户要求只修验证层，业务执行维持原状。正式默认集成覆盖跨批/顺序、来源归属和其他来源可达性，Domain覆盖部分观察接纳；先在未修业务代码上失败。纠正无结果Evaluator的自证预期与逻辑，Evaluator/Rubric分别升级到@10；空或不适用记录未评估、可证实矛盾失败，仅独立记录的限定空搜索可确认，不声称一般调查充分。同步Web评价版本接线断言。最终默认套件290通过/8失败，失败对应4类尚未修复的业务契约，未隐藏或跳过。完整记录见[验证修复记录](TEST-VALIDATION-REPAIR-2026-09-15.md)。未修改Prompt/Gold或业务执行、未Live、未提交推送。


## 2026-09-16 Stagehand isolated workflow probe

Extended the approved small probe with explicit action checks, phased observations, asynchronous/new-tab fixtures and separate execution/artifact review. All runner/dependency changes remain under ignored `.eval-artifacts`; production browser, Runtime and Policy remain untouched by this slice. Seventeen live model calls did not complete the three merchant paths; a zero-model Playwright control reached the TableCheck form. Stop before production integration; retain failures and evaluate observation plus existing execution as a candidate, not a proven replacement. [Report](../brainstorming/2026-09-16-stagehand-workflow-validation.md).


## 2026-09-16 Browser observation/action/memory probe redesign

Expanded isolated diagnostic to alternative query conditions, full filters, map gestures, source-backed notes, independent-request comparison and fresh-evidence update. Runner/dependencies remain ignored artifacts; no production code or main dependency changes by this slice. Preserved adaptive harness failures; Stagehand observe candidate generation is distinguished from a task planner. Future integration must reuse the existing production loop and evidence boundaries. [Design and findings](../brainstorming/2026-09-16-browser-observation-action-memory-validation.md).


## 2026-09-16 Browser Agent implementation handoff

Created the [Terra plan](../BROWSER-AGENT-RESTAURANT-IMPLEMENTATION-PLAN.md) against current Executor, Decision, Session, source Skills and Evidence contracts. Preserves Router-bound query authority, distinguishes permitted alternatives from original requirements, sets Stagehand go/no-go criteria, and requires real Web/Harness integration plus independent review. Updated navigation and linked the prior plan as historical context. No product code, dependency, branch or task dispatch changes.


## 2026-09-16 Browser independent-review repair

User authorized direct fixes while Terra continues the main implementation. Fixed R1–R4 in the existing Registry/Executor, with regressions in the existing Chromium Harness: deny unclassified checkbox/range events; read mutable native properties and ARIA range state; recognize fixed/native/nested visible dialogs. Added a strict-wire model transport → Executor negative consent test. Production query permissions remain unset, so this does not claim real-site filter support or P0–P4 completion. No paid/Live execution, commit or push. [Review and limitations](BROWSER-AGENT-TERRA-REVIEW-2026-09-16.md).

## 2026-09-16 — Browser P1/P2 offline completion slice

TableCheck and Tabelog now explicitly grant the shared Executor only their public GET search checkbox/range operations; the permission is source code, not a model instruction or page claim. The generic executor preserves a public new-tab read in the same browser context while replacing the active-page identity, so all prior opaque references expire. No second browser loop, source fallback, login or write path was introduced.

The Restaurant intent now keeps the user’s requested time distinct from a separately explicit permitted alternative range. Router binds only that bounded range to the source query and retains the original range for evidence and display; an out-of-original-range slot is labelled alternative. Date, party and other conditions are not widened. Candidate-bound website facts can now retain explicit public course price/tax, private-room minimum, cancellation and no-show values separately after HIGH identity, including one observed safe terms disclosure. Bare amounts and unlabelled inference remain unknown. The existing Web card projects only candidate-scoped cited terms.

All additions reuse the production Router, BrowserTaskExecutor, Grounding and Web projection. The slice is offline Fixture/HTTP/model-boundary work only; no Gold/Holdout, real model, real source, booking, commit or push was used. Original-researcher re-review and an explicitly authorized bounded Live phase remain gates, not implied by this implementation.


## 2026-09-16 Second review repair: R5-R8

Current development evidence. Time-window replacement now clears old alternative permission at Intent patch application; explicitly supplied new permission is applied afterwards. The unverified public GET search policy and adapter grants were removed: production checkbox/range actions default to deny pending positive source control contracts. The synthetic fixture alone grants its known query controls; Japanese consent is refused through the real Chromium strict-wire path.

Commercial scalar prices now require an unambiguous complete labelled line; deposits mixed with prices and multiple courses remain unknown. Supported commercial requests (course price, room minimum, cancellation, no-show) are included in the reader objective and completion check. Existing type/hours no longer cause early completion when requested terms are missing. Missing requested facts return UNKNOWN / WEBSITE_REQUESTED_FACTS_UNCONFIRMED while retaining observed evidence. This is narrow explicit-keyword support, not general multi-course or natural-language understanding.

Verification: typecheck, arch:check (0 forbidden), build, full npm test 353/353 and synthetic real-Chromium 13/13 PASS. Before-fix regressions saved. An initial Compiler-level null patch failed one old shape assertion; invalidation was moved to Intent patch application and the full suite rerun successfully. Logs: `.eval-artifacts/browser-terra-review-followup-2026-09-16/before-fix.log`, `final-tests.log`, `browser.log`. Old repro.ts records the pre-fix policy and is not a current runner after its deletion.

The unsafe policy test was retired with the implementation; existing semantic/website and Chromium tests were strengthened, with ambiguity and missing-fact regressions added. No paid model, Replay, Live, external writes, commit or push. R6 is safely closed but positive real-site filter wiring remains incomplete; full P1/P2/P3 acceptance is not claimed.

## 2026-09-16 Browser 直接修复

修复 R9 Web 历史条款投影/来源错配；新增实测 TableCheck Budget/Cuisine 正向 query contract；补充结构观察并移除缺失 form 的逐控件等待。Hybrid runner 增加总调用及剩余时限保护。Tabelog 实测发现模型 COMPLETE 不能代表验收，改为 completion=false 时 MODEL_HANDOFF，补独立回归。保留其他任务既有改动，没有提交/推送。仍有 P3 未闭环，详见 [记录](BROWSER-AGENT-VALIDATION-2026-09-16.md)。

## 2026-09-16 Tabelog follow-up and TableCheck failure attribution

Added code-owned nonstandard control hints to the shared Registry and both Playwright sessions; wired Tabelog date/guest readiness and selection verification into the Adapter. Fixed unrelated external-link classification. TableCheck now recognizes disabled state, waits for guide results and binds explicit empty results to a scoped exact request; MODEL_HANDOFF still requires independent source evidence. No new dependencies, commit or push; pre-existing changes preserved. [Details](BROWSER-AGENT-VALIDATION-2026-09-16.md).

## 2026-09-17 H001/H003/H005 targeted repair — offline gate

Implemented the smallest current read-path repair: provider-listed TableCheck/Tabelog merchant URLs are candidate pointers read through their existing identity gates; TableCheck retains only per-run verified outlet pointers and re-identifies every later candidate before any result can be grounded. Complete normalized name/address evidence outweighs a phone disagreement, while a branch/address conflict remains non-HIGH. Immediate requests now carry materialization@4 provenance and a one-minute, exact discrete-slot contract; Router returns UNKNOWN before source access for stale or unrepresentable immediate time, and presentation rejects expiry. No broader GET permission, planner, provider fallback, booking or write path was added.

The H003 post-parser diagnostic used the saved baseline's current candidate and current source fact, not Gold or Holdout. The final third bounded model call emitted cited positive-HARD evidence; a local state replay moved the missing reason from HARD evidence to availability identity. The first run failed to persist its output and the second cited a superseded raw fact; both failures remain recorded and were not counted as proof. No commit, push, booking, or Live run occurred in this development entry.

## 2026-09-17 H001/H003/H005 bounded Live Read-only

Ran the original H001, H003 and H005 requests exactly once each under the user-approved 300000ms, 50-model, 50-Google and 50-browser-actions-per-candidate ceilings. H001 and H005 saved immutable result plus evaluator sidecars; neither produced a qualified result. H003 exceeded its five-minute ceiling without finalizing after its started record; it was interrupted and not retried. No code changes were made in response to the Live observations, no booking/write capability was used, and this entry hands the residual findings to the original researcher for independent review rather than asserting review success.

## 2026-09-17 H001 address-representation and runner-deadline offline repair

Replaced provider-local address string comparisons with one minimal shared outlet-identity helper. HIGH cross-script address matching requires the same normalized postal code and the complete ordered number/unit sequence; reordered complete same-script components are accepted only when their complete token sets match. Missing detail or a distinct floor/unit remains non-HIGH. TableCheck and Tabelog retain their existing candidate identity thresholds, direct Google-listed merchant pointer handling and availability-evidence isolation; this repair does not copy availability between candidates.

The Hybrid Live runner now settles its outer run at the authoritative deadline even when a coordinator does not itself observe abort. It prevents a future capped run from remaining without a terminal artifact, but does not manufacture or reinterpret the interrupted H003 result and did not cause a rerun. No new provider, permission, fallback, model call, Live source action, booking/write path, Gold/Holdout access, commit or push was added.

### Address-sufficiency follow-up

The initial helper still treated two identical abbreviated strings as a complete address. Tightened it before handoff: both sides must contain a street/unit number and either a postal code, two locality tokens, or the Japanese prefecture-plus-municipality structure. The direct abbreviated `1-1 Shinjuku` counterexample stays MEDIUM. This is a conservative identity gate, not a transliteration service or a merchant-specific exception.

### Immediate source-slot follow-up

Replaced the provisional global 15-minute slot assumption with a source-observed exact-slot contract (`restaurant-temporal-materialization@5`). During its one-minute validity window the Router forwards only the original exact local time; it never manufactures a next slot. TableCheck and Tabelog now classify visible neighbouring cards that do not include that exact time as `UNKNOWN/IMMEDIATE_SLOT_NOT_OFFERED`. A source-specific, request-bound explicit empty result remains distinct and may still establish unavailable. No Live rerun, real model/source call, provider fallback, permission widening, Gold/Holdout access, booking/write action, commit or push occurred.

The final per-case matrix, resource accounting, raw artifact links and review handoff questions are retained in [H001/H003/H005 targeted repair report](H001-H003-H005-TARGETED-REPAIR-2026-09-17.md). It records the H003 Live non-finalization as a failure, rather than converting it into a normal no-result.

### H003 deadline regression

Moved the outer run-deadline settlement to a small testable Agent-loop helper. Its two regressions prove an ignored-abort child settles `CANCELLED` and a child that finishes before the deadline preserves its value. This closes the untested implementation gap for future runs only; it does not replace the missing H003 result artifact, alter a Live record or authorize a retry.

## 2026-09-17 — H001 identity and entrance repair after independent review

Reproduced the independent review's three production counterexamples before changing code: B1F/1F was accepted as one address, a shared phone overrode a clear Shibuya/Roppongi conflict, and a postal code plus floor counted as a complete address. `outlet-identity` now reports `MATCH`, `CONFLICT`, or `INSUFFICIENT`; TableCheck and Tabelog deny HIGH whenever a complete source address explicitly conflicts, while a complete same address with a stale phone remains valid. No transliteration service, merchant exception, fallback provider, broad GET permission, or Domain-state shortcut was introduced.

TableCheck now receives a Router-run-scoped entrance ledger. It records all source-observed public merchant URLs as re-identification hints, never as availability evidence. Current candidate discovery remains mandatory when its own page is incomplete; its URL order is direct known link, current discovery, then prior run hints. Both adapters probe an identity-verified Google-listed merchant page before normal search, so a later search challenge cannot erase that valid entrance. The production Live composition regression starts from `LiveBrowserAvailability`, observes Hajime while investigating Teppen, crosses Agent batches, and validates Hajime afresh. The separate stale-entry regression proves a prior Matsue URL cannot suppress current discovery.

After the frozen dirty snapshot passed 54 targeted tests and the 391-test offline gate, performed exactly one read-only probe per user-fixed saved entrance: Sushi Teppen TableCheck, Namikibashi Sushi Hajime TableCheck, and Sushi Nasu's Google-listed Tabelog page. All three artifacts stopped at `BROWSER_RUNTIME_FAILED` before a snapshot; therefore no source conclusion, model/Google call, request selection, booking or external write occurred. Full evidence and B1–B14 classification are in [H001 identity/entrance follow-up](H001-IDENTITY-ENTRANCE-FOLLOWUP-2026-09-17.md). Original-researcher review remains pending.

A follow-up no-network runtime check opened and closed local headless Chromium successfully. The established first blocker is therefore Cloudflare Browser Run session creation, not a missing local browser. The fixed Live round was not retried through that alternate engine. A final production-composition regression proves `endReadRun` clears entrance hints before a new run; targeted coverage is 55/55 and the full offline gate is 392/392.

The existing independent Hybrid diagnostic evaluator was then checked in memory against each failed probe without writing a sidecar. Every probe has zero candidates and returns `completion` and `evidence` as `NOT_EVALUATED`, so it is not a valid independent evaluation input. The artifact record preserves that limitation and continues to require an actual shared production-composition result before evaluation.

The shared browser path's post-repair local Chromium fixture gate also passes 17/17. It remains a synthetic, read-only offline verification and does not turn the failed remote probes into a real-source outcome.

## 2026-09-17 Regression-defense generalization

Extracted the independently authored H001--H005 fixed source observations from the code-contract model test. The shared helper still drives actual Google search, fact composition, browser availability, Interpreter, Compiler, Runtime, Router, Validator and Grounding; only source transport/pages are fixed. Added a bounded real-model fixed-source Runner which creates immutable diagnostic and evaluator artifacts without accessing a Live website. No production behavior, prompt, frozen case input, booking path or external write was changed.

The real-model one-shot runs were deliberately retained even when red: H002 paused for input, H004 failed, H003 ended no-result and H005 presented; H001 exposed an evaluation-location Runner mistake and was not retried. H001/H003/H005 Live Read-only attempts each terminated `CANCELLED` under their caps on a dirty worktree. Full detail and unassessed scope are in [the regression-defense report](REGRESSION-TEST-DEFENSE-REPORT-2026-09-17.md). No commit or push.

### Controlled migration sample

Added `new-vegetarian-lunch` as a source-scenario registration and test data row, not a second Runner. It changes cuisine, negative constraint, party size, named area and lunch-time slot together, then exercises the same production composition. It is deliberately exposed controlled evidence and was not included in paid-model or Live runs.

### H001 authorized corrective model run

After the user authorized a one-time exception to the per-case limit, reran H001 through the corrected fixed-source real-model Runner. The immutable result completed `PRESENT_RESULTS`; evaluator@15 accepted authoritative conditions, evidence, investigation, final claim, completion and resources. This is a fixed-source model acceptance record, not a Live website result and did not trigger further product changes.

## 2026-09-17 Fixed-source test-mechanism remediation A–D

The fixed-source Runner now uses registered case data and a shared production-composition execution function rather than an H001--H005 whitelist. Its execution record, independent evaluator outcome, acceptance verdict and user-goal completion are separate; only a predeclared acceptance PASS gives the Runner a zero exit code. The controlled `new-vegetarian-lunch` sample now traverses execution, evaluator and acceptance, including a missing-evidence failure control.

Fixed source data now represents candidate-specific venue identity, pages and date/party inventory. Query matching is equivalent-token based rather than an exact prompt script, and unconfigured legal browser reads are surfaced through fixture coverage diagnostics. Default business time starts at the registered reference but advances with real elapsed time; an outer wall-clock deadline wraps semantic and agent work in both fixed-source and Live runners. These are offline diagnostic controls, not a restaurant business-rule change. No paid model, Live, source network or external write was run.

## 2026-09-17 Fixed-source closure after 987c77e review

Split the test source's Google and TableCheck observations into independently configurable identities, listed links and inventory. A public entrance found for one candidate is now retained only as a run-scoped navigation hint and is identity-checked again before another candidate can receive inventory. The controlled vegetarian sample changes its source type wording to a non-verbatim positive HARD fact; the explicitly marked fixture model returns a cited judgment through the production fact/read/state chain, not a manually inserted eligibility answer.

Fixed-source transport now records source/stage/request/candidate/reason coverage gaps even when a production adapter wraps the transport exception. Acceptance receives those records: necessary gaps block with nonzero status; optional gaps require an independently qualified result. The factory takes a clock rather than a fixed timestamp, records each observation time separately from sample capture time, and fixture waitFor checks the requested supported selector. Unified acceptance now declares and verifies normal result, verified no-result, needs-input, cancellation and budget/deadline records rather than treating every negative path as a successful terminal no-result. No Prompt, Gold, user request, paid model, Live source action or external write was changed. [Coverage report](FIXED-SOURCE-CLOSURE-2026-09-17.md).

## 2026-09-17 Controlled-stop artifact acceptance

The fixed-source execution helper now accepts a controlled cancellation signal
and a bounded model-call ceiling solely for offline test execution, recording
the actual admitted call count and the transport's original failure code. This
does not change restaurant action selection or any production stop policy.
The evaluator/rubric is `@16`: it recognizes a saved `CANCELLED` record and a
saved model-budget record as distinct completion kinds, while preserving
internal execution failures as failures. Acceptance now requires the matching
completion kind as well as status, phase/loop where declared, reason and
required evaluator dimensions; it derives user-goal completion from the actual
evaluation, so both approved stops remain `NOT_COMPLETE`.

The regression serializes each real controlled-composition result to a temporary
artifact, invokes the normal artifact evaluator to create its immutable sidecar,
then passes that evaluation to acceptance. It does not construct evaluator
findings or score results by hand. An abort after semantic interpretation and a
one-call budget each pass only their matching contract; evaluating the budget
artifact as cancellation fails. No Prompt, Gold, product decision rule, paid
model, provider, Live read or external write changed.
