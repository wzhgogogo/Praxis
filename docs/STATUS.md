# Praxis 当前状态

- Status: Accepted
- Document revision: 4.49
- Last updated: 2026-09-18
- Source of truth for: 已实现能力、已验证范围、明确未验证项与下一道门槛
- Related ADRs: [ADR Index](decisions/README.md)
- Related documents: [Documentation Index](INDEX.md), [Roadmap](roadmap.md), [Verification History](history/TEST-LOG.md)

## 最新审查与当前门槛

2026-09-18 当前修正（ADR-0028）：`OPEN_ENDED`的首批三家目标现在同样适用于具体到访的`AVAILABILITY`，不再只限事实型`RECOMMENDATION`；显式数量对两种目标均有效，`SPECIFIC_OUTLET`与旧未分类目标仍不扩展。每家查位结果仍单独要求当前门店、日期、时间与人数的slot证据，不能用同店多时段或跨店证据补足数量。H001–H005固定来源环境各有三家独立候选；离线生产组合与独立验收会拒绝“只展示一家”的假成功。固定来源真实模型Runner可显式登记每例5分钟、50步、50模型调用的上限，尚未消费该额度。该证据只证明受控来源组合，不替代真实模型选择、实时Google/网页或库存。下一门槛是冻结代码后的五例真实模型＋固定来源诊断，再交原研究者Review，才进入一条有界多轮Live。

2026-09-18 continuous-selection offline slice: Google Text Search discovery now reads at most two initial 20-result pages and retains a query-bound cursor; later same-condition replenishment consumes that cursor rather than rewording/restarting the query. `PRESENT_RESULTS` is now a paused selection session: persistent Web can browse a current result, shortlist it, show three already grounded unseen candidates without I/O, or, when insufficient, resume the existing Agent/Router path. A semantically explicit `OPEN_ENDED` target has a default first-batch target of three qualified distinct restaurants; a user-requested count replaces that target, while specific-outlet and legacy unclassified targets are not mechanically expanded. An early shortfall is rejected while any bounded discovery/fact/availability read remains legal; once all are unavailable, the returned smaller batch records `met: false`. Qualitative feedback such as “These are too expensive” remains verbatim feedback, not an invented budget. The offline PGlite/Web composition now also forces a one-qualified-candidate first pass, reads facts for b/c/d through the Agent/Router, and presents a/b/c with one discovery (rather than prematurely presenting or restarting discovery). `PARTY_SIZE` now records whether a count was explicit or inferred from a closed participant set, with an event reference to the already-persisted user message; this diagnostic cannot affect read authority or provider inputs. The new Prompt@17 contract has local transport, Compiler/Reducer and Web-artifact coverage only, not real-model quality evidence. No new Live or paid-model authorization was consumed. Current code gates: typecheck, arch check, build and **436/436** default tests have passed; the remaining next gate is a separately authorized bounded real-model/source observation of the new continuation behavior, followed by original-researcher review.

2026-09-17 用户授权的 H001 单次 30 秒语义上限重跑完成实际调查：语义请求从固定 10 秒升为 30 秒，但 Live wrapper 仍取五分钟总截止的剩余时间；本次 `LOCAL_CHROMIUM` 103378ms／4 步，Google 5/10、模型 13/30（语义1、Agent4、浏览器8）、三家实际查位且每家低于 50 浏览器操作。东京 `tomorrow` 在跨午夜后物化为 **2026-09-19 19:00、2 人**。Sushisho Isseki Sancho 经 TableCheck HIGH 身份及同请求 DOM 证据确认 `AVAILABLE`（visible `19:00`）；Sushi Inase 通过 Google 直列 TableCheck 入口、B1F／地下1階同店匹配后明确 `UNAVAILABLE/NO_MATCHING_SLOT`；Shibuya Sushi Jinnan 经 TableCheck 拒绝不相干分店、Tabelog HIGH 身份后仍为 `UNKNOWN/REQUEST_SELECTION_UNCONFIRMED`，不被写成无位。七家其余发现候选未查，不据此宣称搜索穷尽。独立 evaluator@16 给呈现结果 `taskProducedQualifiedResult=YES`、条件／证据／终态／资源均 `SATISFIED`；这是一次开发诊断，不是长期可靠性、全城库存或独立研究者 Review 通过。[result](../.eval-artifacts/h001-live-tomorrow-30s-2026-09-17/workspace/.eval-artifacts/restaurant-hybrid-live-read/2026-09-17T15-08-25-556Z-fb613f8b-c6c5-4241-a98a-a056063b0af5.result.json)／[evaluation](../.eval-artifacts/h001-live-tomorrow-30s-2026-09-17/workspace/.eval-artifacts/restaurant-hybrid-live-read/2026-09-17T15-08-25-556Z-fb613f8b-c6c5-4241-a98a-a056063b0af5.result.evaluation.16-1789657808914.json)。

2026-09-17 用户授权的当前修复快照 H001 单次 Live Read-only 已保留，但**未完成有效调查**：隔离副本只将输入改为 `h001-tomorrow`（涩谷／omakase HARD／2 人／19:00），`LOCAL_CHROMIUM`、30 模型、10 Google、每候选 50 浏览器操作和 300 秒总上限均写入原始 started artifact。运行在东京已跨入 9 月 18 日零时，`tomorrow` 因此物化为 **2026-09-19 19:00**，不是可回写的“9 月 18 日”假设。首个语义模型请求仍在 Interpreter 内部固定 10 秒超时，10.039 秒即 `MODEL_FAILURE/TIMEOUT`；未进入 Google、TableCheck/Tabelog、身份、日期／人数控件或任何库存观察，不能归类为无位、来源失败或安全停止。原始 result 与独立 evaluator@16 sidecar 均已保留；评价只给 `taskProducedQualifiedResult=UNKNOWN`，除零次观察的谱系记账外其余关键维度为 `NOT_EVALUATED`，不能替代实际验收。[started](../.eval-artifacts/h001-live-tomorrow-2026-09-17/workspace/.eval-artifacts/restaurant-hybrid-live-read/2026-09-17T15-00-39-422Z-1d711993-99fb-48a9-b02d-5f13c5613829.started.json)／[result](../.eval-artifacts/h001-live-tomorrow-2026-09-17/workspace/.eval-artifacts/restaurant-hybrid-live-read/2026-09-17T15-00-39-422Z-1d711993-99fb-48a9-b02d-5f13c5613829.result.json)／[sidecar](../.eval-artifacts/h001-live-tomorrow-2026-09-17/workspace/.eval-artifacts/restaurant-hybrid-live-read/2026-09-17T15-00-39-422Z-1d711993-99fb-48a9-b02d-5f13c5613829.result.evaluation.16-1789657249430.json)。该次失败按“一次”边界没有自动补跑；后续用户已明确授权独立的 30 秒语义上限重跑，结果见上方当前记录。

2026-09-17 原研究者复核确认楼层/入口反例已关闭，并补强默认离线测试：共享地址规则直接覆盖等价写法、缺失楼层、地址不足及楼层/门牌/邮编冲突，两个平台保留真实 resolver 接入检查。同批七家历史同店地址作为正常对照，来源电话省略后仍须由姓名与地址形成 HIGH；明确地址冲突即使电话相同也不得 HIGH。新增矩阵在修复前 HEAD 和重建的“仅修大小写”中间版本均按预期失败，最终实现通过；最终全量 **417/417**、typecheck、arch、build 通过。此轮仅改测试/证据文档，未追加生产规则或 Live；来源读取与实时库存仍待单独验收。[验证证据](../.eval-artifacts/identity-matrix-review-2026-09-17/REPORT.md)

2026-09-17 下午独立审查（565b08f）后的有限修复：共享楼层模式现在统一提取与移除 `地下1階`/`B1F`、`1階`/`1F`、`2階`/`2F`，并用 Unicode 后继约束避免日文单位残留为门牌数字。历史 Inase、涩谷Hajime、Teppen、Sushi Labo 均为 `MATCH/HIGH`；缺失楼层不再虚构冲突，明确不同楼层/分店仍拒绝 HIGH。TableCheck 对 `googleListedTableCheckUri`、`googleWebsiteUri`、`googleMapsUri` 分别按受控同源规则校验，正常 Maps 或错域前置值不再遮蔽合法 TableCheck website 直链；fixed-source fixture 已改为真实 Google Maps/website 字段语义。定向 Adapter/真实组合 **66/66**、typecheck、arch、build、授权 loopback 全量 **414/414** 通过；原审查 reproduction 从两条 `CONFLICT/MEDIUM` 和 Maps 遮蔽直链翻为直链首导航，后续同批正常门店回归也已修复。没有新 Live、模型、Google、来源访问或外部写入，故这只是离线修复，不是来源或库存验收。原反例和报告保留于[下午独立审查](../.eval-artifacts/afternoon-review-2026-09-17/REPORT.md)。

2026-09-17 以 987c77e 为基线的 fixed-source 测试机制补修完成离线门槛：来源观察已按 Google／TableCheck 独立配置；未配置来源的结构化 coverage gap 进入统一验收并对必要路径返回 BLOCKED/nonzero；等待只接受实际配置目标；受控业务时钟在每次来源观察时读取并保留独立样本采集时间；统一验收现在区分合格结果、已核实无结果、补问、取消及预算/deadline 停止。定向23/23、typecheck、arch、build和授权本地默认410/410通过。沙箱浏览器启动受 Mach-port 限制，授权本地 Chromium 只使用合成页面；不构成外站验证。详见[补修覆盖报告](history/FIXED-SOURCE-CLOSURE-2026-09-17.md)。真实模型理解、自由文本语义、网站兼容性/库存、反爬与搜索完备性仍未由本轮证明。

2026-09-17 H001 身份与入口复核的最小修复已完成离线门槛：B1F/1F、同电话异址和“邮编+楼层”三个原反例均已不再产生 HIGH/同址；TableCheck 运行级入口账本会复用 Teppen 观察到的 Hajime 入口但逐候选重新验身，无关缓存不会跳过当前 discovery，read run 结束也不会残留入口；两个 Adapter 的已列 merchant URL 先经身份门槛再搜索。定向55/55、typecheck、arch、build、diff check及授权全量392/392均通过。随后三条固定 saved-entrance Live Read-only probe（Teppen、Hajime、Nasu）均在默认 Cloudflare Browser Run 的 session 创建阶段 `BROWSER_RUNTIME_FAILED`，未产生 snapshot、模型/Google 调用或外部写；本机 headless Chromium 可单独启动，未访问外站。按“一次固定 Live、不自动重跑”边界未切换引擎复试；不构成来源、库存或产品验收。详见[定向后续记录](history/H001-IDENTITY-ENTRANCE-FOLLOWUP-2026-09-17.md)，交回原研究者 Review，不能自称独立 Review 已通过。

2026-09-17 原研究者独立审查定向修复：现有定向56/56通过，但额外生产函数反例确认地址比较把B1F与1F判为相同，两平台给HIGH；电话相同仍可绕过明确地址冲突。H001新Live仍在Teppen调查见到涩谷Hajime入口后未用于Hajime；缓存非空还会跳过当前候选无结果时的发现分支。已知直链仍依赖搜索页先成功。H003固定来源正向HARD诊断有效；H005只证明过期拦截，当前一分钟/精确分钟契约尚未形成可完成的即时查位闭环。当前匹配修复不应签收为完成。无新Live或生产代码修改，详见[独立审查及反例](../.eval-artifacts/targeted-repair-independent-review-2026-09-17/REPORT.md)。

2026-09-16 Browser Agent 当前日本餐厅只读切片完成真实闭环：复用既有观察器、LLM 决策、受控 Playwright 和来源核验，未接入 Stagehand/browser-use/Midscene 生产依赖。Tabelog 被动库存响应与店铺/日期/人数绑定，修复跨分店查询；TableCheck 非标准下拉、已选状态、TIME 范围及完整禁用时段识别已验证。复杂套餐/取消规则跨页留源，条件修订废弃旧库存。实际 Web 两店比较及修改日期/人数均 PRESENT_RESULTS、刷新恢复；首次八芳 3 时段、Maru 未确认，修订后 Maru 5 时段、八芳许可窗口内无位。限定商户不再扩展调查其他店；Web 新任务隔离、仅展示实际调查商户、过期库存提示已补齐。详见[最终复核与明确限制](history/BROWSER-AGENT-FINAL-REVIEW-2026-09-16.md)。

当前版本：Browser action Prompt@4 / wire@3，Semantic Prompt@17，Restaurant Agent Decision Prompt@14，Restaurant Fact Judgment Prompt@2，独立 diagnostic evaluator/rubric@16。当前工作树完整本地套件 436/436、类型/架构/构建通过；历史真实 Chromium 验证仍仅证明其各自记录的范围。原始 Web 执行不改写，修复导出后从相同事件重新形成独立复核输入；Web 浏览器调用总数仍缺失，RESOURCES 为 NOT_EVALUATED。跨语言地址识别现有离线反例，但尚无其修复后的真实来源复验；既有 semantic regression@3 未通过，不能宣称语义或任意网站全面完成。完整地图语义、其他类别网站和真实预约写入仍属 P5；本轮无预约提交或外部写入，当前切片尚未提交或推送。

2026-09-17 H001–H005 各一次 Hybrid Live Read-only 的新基线保存在`.eval-artifacts/restaurant-hybrid-live-read/`，每例的原始执行和 evaluator@15 sidecar 分离保存。H001在218288ms内调查10家后`NO_VERIFIED_RESULT`；H002正确因缺人数`WAITING_USER`；H003、H005分别在300009ms/300018ms到达预算并取消；H004为事实型推荐，7.4秒展示7家。它们不是5/5用户目标完成，也没有发现共享`INFRA_BLOCKER`。诊断确认正向HARD的派生判断此前只处理NEGATIVE：已将可引用、同候选具体类型事实的正向判断补入`MODEL_JUDGMENT`（Prompt@2），资料不足、宽泛类型、无引文或正向`CONFLICT`仍为UNKNOWN。固定来源反例、完整本地371/371、typecheck、arch和build通过；但唯一H003修复后Live因本次Semantic将所有条件都判SOFT而直接走availability，随后TableCheck`REQUEST_SELECTION_UNCONFIRMED`/Tabelog`BROWSER_TIMEOUT`而`EXECUTION_FAILURE`，没有实际到达新增的正向判断路径。因此不进入五例修复后回归、不宣称Live改善；人数推断/HARD-SOFT以及预约来源故障留待下一小循环。无预约、外部写、Gold/Holdout修改、commit或push。

2026-09-17按用户授权追加 H001 两条日期变体，涩谷/omakase HARD/2人/精确19:00保持：9月18日找到鮨匠一石三鳥和Matsue涩谷店，9月19日找到Matsue涩谷店；两条完整Hybrid Live Read-only均PRESENT_RESULTS，独立diagnostic evaluator@15 qualified=YES。分别186.9秒/179.6秒，共35模型调用、215720 tokens、7次Google。早上9月17日基线为6 UNAVAILABLE、4 UNKNOWN；四个UNKNOWN属于来源发现或门店身份未确认，不能算无位。共同候选Matsue的跨日期结果支持库存日期差异，但候选与模型路径变化，非严格因果A/B。Jinnan在两变体仍REQUEST_SELECTION_UNCONFIRMED，不能宣称浏览器普遍可靠或五例通过。无产品源码/Prompt/原Gold修改，无预约或外部写入。[日期诊断报告](../.eval-artifacts/h001-date-variants-2026-09-17/REPORT.md)。

2026-09-17 H001/H003/H005 修复前离线门槛：TableCheck/Tabelog的 Google 列出商户链接仅作为受控同源读取入口，仍逐候选做 HIGH 身份匹配；同轮已验证入口可辅助第二候选定位，但不复制其空位证据。姓名+完整地址可在电话冲突时保持 HIGH，分店地址冲突仍拒绝。`right now` 升为 temporal materialization@4：记录 Tokyo 参考时刻、1 分钟即时有效期和 15 分钟离散时段可查询性；过期或不可表示的精确即时请求在 Router 查询前变为 UNKNOWN，不替换为更晚 slot，展示也拒绝过期即时证据。H003固定基线的当前 Google `bar and grill/loung bar` 事实经一次可审计真实 `restaurant_fact_judgment@2` 支持 `good for drinks` HARD（846 tokens）；回放显示该判断将缺口从 HARD 事实改为缺空位/来源身份，未伪称可展示。此前一次保存路径失败和一次已 supersede 事实诊断均保留为失败记录；没有浏览器/Google 请求。定向 98/98、typecheck、arch、build、diff check及授权 loopback `npm test` 376/376 通过。此时尚未运行这三条修复后 Live，不宣称 Live 改善。

2026-09-17 用户授权后的单次 Live Read-only：H001原始请求在181499ms/7步结束为`NO_VERIFIED_RESULT`，10候选、Google 5/50、浏览器模型12/50；5家有请求绑定的`NO_MATCHING_SLOT`，其余为门店身份/提取不确定，独立 evaluator@15 为`taskProducedQualifiedResult=NO`、`completion=NO_VERIFIED_RESULT`，不报告无位或通过。H005在138627ms/7步为`NO_VERIFIED_RESULT`，Google 4/50、浏览器运行调用0、浏览器模型10；run reference 为东京13:57，立即合约在事实调查后过期，10家空位均明确`UNKNOWN/IMMEDIATE_REQUEST_EXPIRED`，没有把13:57换成更晚 slot，独立 evaluator sidecar 已保存但没有合格结果。H003单次启动于04:52:35，超过5分钟自动预算仍未退出、未落盘result/evaluation；为遵守用户每条5分钟上限已中止，只保留`started` artifact，不能计为完整Live验收，且不重跑。三条均无预约或外部写；这些是开发诊断（dirty worktree、exposed development dataset），不是Clean Baseline或独立Review通过。下一门槛是原研究者对H003清理超时、H001身份/提取缺口及H005即时调查顺序进行独立Review。

2026-09-17 后续离线修补：TableCheck 与 Tabelog 共用的门店地址比较现要求完整地址表示在邮编和门牌/单元序列上相符，接受脚本/全半角与成分排序差异；地址缺失或楼层/门牌不符仍只给非 HIGH。H001 的 Google 商户入口、逐候选复核与空位证据隔离边界不变。Hybrid Live runner 增加外层 deadline 结算，避免协调器忽略 abort 时没有终态 artifact；该修补不追溯生成 H003 的遗失结果，也不触发重跑。新增定向反例 51/51，随后 `npm test` 378/378、typecheck、arch:check、build、diff check 均通过。此处只增加离线证据：H001 的新地址规则尚未 Live 复验，H003 仍缺完整 Live 终态，H005 仍缺在有效即时窗口内与平台实际 slot 的来源验证。完整 B1–B14 当前分类与原研究者 Review 问题见[P0–P4 交付记录](history/BROWSER-AGENT-RESTAURANT-P0-P4-DELIVERY-2026-09-16.md#2026-09-17-current-repair-addendum--review-handoff-pending)。

2026-09-17 地址充分性补强：不再因为两个同样的短地址字符串相等就形成同店证明；无邮编时至少需要门牌和两个地址成分，或日本都道府县加市/区/町/村结构。新增“同样的`1-1 Shinjuku`仍为MEDIUM”反例。TableCheck/Tabelog/Hybrid 定向 75/75、授权 loopback `npm test` 379/379、typecheck、arch:check、build 通过。该补强未产生新的来源/模型调用或 Live；H001/H003/H005 的前述未验证项不变。

2026-09-17 H005 即时 slot 合约补强：temporal materialization 升为`@5`，不再以固定 15 分钟假定预先拒绝或接纳平台时隙。Router 在一分种有效期内只把用户的原始精确东京时刻交给来源，并以`sourceSlotPolicy: EXACT_ONLY`标记；来源只有观察到该精确 slot 才能 AVAILABLE。TableCheck/Tabelog 都将页面上仅有邻近 12:00/12:30、请求为12:08的情形记录为`UNKNOWN/IMMEDIATE_SLOT_NOT_OFFERED`，不改成12:30也不报告无位；若来源明确针对精确请求为空，既有无位链仍可表达。固定时间 Compiler/Router/两 Adapter 回归均通过。此为离线来源边界证据，不是有效即时窗口的真实来源 Live；H005 Live 历史过期结果和 H003 无终态记录均不被改写。

展示前门槛也已单独回归：即使源 slot、身份与展示有效期仍然新鲜，只要即时一分种有效窗口过去，`PRESENT_RESULTS`被拒绝；不会借较长的普通 display TTL 显示过期即时结果。H005 固定时间、来源 slot 与展示边界定向 95/95，授权 loopback `npm test` 385/385 通过。

本批逐案例最终矩阵（含实际Live资源、evaluator、失败与原研究者复核问题）见[H001/H003/H005 定向修复报告](history/H001-H003-H005-TARGETED-REPAIR-2026-09-17.md)。该报告明确保留 H003 无终态、H001 post-fix Live 缺口与 H005 有效窗口 Live 缺口，未把离线通过升级为产品通过。

H003 deadline 收束另有独立回归：即使子任务忽略 abort，外层也会`CANCELLED`结算，以便 runner 写出失败 artifact；正常先完成的结果保持不变。其 2/2 定向与最终385→387/387全量通过，仍不追溯补写历史 H003 artifact 或触发重跑。

### 此前审查记录（历史检查点，当前 Browser 结论以上文为准）

2026-09-16 H004评分器误判已局部修复：diagnostic-evaluator/rubric@14将SOFT措辞语义复核与实际来源观察适用性分开，适用于展示和无结果调查记录；不放宽门店、日期、时间、人数、HARD或证据新鲜度检查。原始H004 artifact离线重评：REQUIRED_EVIDENCE从NOT_SATISFIED变为SATISFIED，AUTHORITATIVE_CONDITIONS仍NOT_EVALUATED，FINAL_CLAIM和整体结果由失败变为待复核（qualified UNKNOWN），不宣称自动2/5成功；原始执行和@13评价未覆盖，SHA核对一致。评分器42/42定向测试及arch通过；首次全仓检查受并发agent-decision.ts语法错误阻断，该错误随后消失；最终typecheck/build通过，npm test为354/356，剩余2项为并发Agent Context版本升至7但Harness/PGlite断言仍期望6，本轮未修改这些文件。未调用模型或来源Live。 [重评报告](../.eval-artifacts/h004-evaluator-fix-2026-09-16/REPORT.md)。

2026-09-16 时间语义局部修订完成：prompt@12增加EVENING，evening/night由代码temporal-policy@3按同日18:00–23:00物化；after work保持17:30–22:00且不再自动生成criterion。预算、人数和HARD/SOFT规则不变。当前开发dataset@4仅移除H003重复after work条件。离线352/352、固定semantic fixture15/15及typecheck/arch/build通过。原20条真实模型复测20/20结构合法、20调用、24694ms、107909 tokens；Q03/05/06晚间、Q02/15/16时间-only验收通过，Q01/17/18原时间行为保持。范围外仍有波动：Q06本次first date补出2人，Q02team dinner仍SOFT，Q10新增target；不声称全语义正确或长期稳定。旧快照与本轮之间还有预先存在的备选时间prompt/schema变化，故非严格隔离A/B。没有餐厅来源Live或预约写操作。 [逐条结果](../.eval-artifacts/time-semantics-20-2026-09-16/RESULTS.md)，[报告](../.eval-artifacts/time-semantics-20-2026-09-16/REPORT.md)。

2026-09-16按用户新提供的20条query，在当前prompt@11/5000预算完全不变的冻结快照上完成一次语义-only诊断；Q19/20分别使用用户指定初始上下文，经真实Compiler/Runtime建立和更新。20/20结构合法且均进入Reducer，无截断/重试；20调用/24564ms/98564 tokens。上下文人数修改与包间删除正确。明确问题：Q06把tomorrow night编码为AFTER_WORK，错误套用下班后17:30–22:00；Q14的NEGATIVE文本仍含no；Q04摘要额外加入dinner。其余需区分语义政策/表示缺口：Q02喝酒SOFT而Q16为HARD、night在Q03/05仅保留于query、近似预算只保存文本、部分片段无TARGET。未把有争议的场景强度预设为错误，也未给总语义通过率；没有Prompt/产品修改、Agent/Google/Browser或写链路运行。逐条输出见[20条结果](../.eval-artifacts/user-20-semantic-2026-09-16/RESULTS.md)，分析见[报告](../.eval-artifacts/user-20-semantic-2026-09-16/REPORT.md)。

2026-09-16 Browser Agent P0–P4 的离线切片完成一项共享观察/动作收敛：`browser_read_action@2`在既有 BrowserTaskExecutor/ModelGateway/Local 与 Cloudflare session 契约中增加明确 checkbox 状态、单步 range 调整和有界 region scroll；active modal 外的背景控件不能成为模型目标。真实 Chromium 本地 fixture 9/9、浏览器定向测试15/15、完整Mock344/344、typecheck/arch/build及semantic fixture15/15通过。Stagehand 4.1.0 小探针结论为不采用：需要第二环境/会话而收益不足，不引入依赖或第二循环。当前 Router/Domain/Evidence/Web 离线组合保持可测，但两店用户比较、完整替代查询、长页条款、地图语义和新商户迁移尚无本轮完整端到端证据；没有新增真实模型/Live授权或运行。详见[P0–P4交付记录](history/BROWSER-AGENT-RESTAURANT-P0-P4-DELIVERY-2026-09-16.md)。原研究者独立 Review 待完成，不能将本条作为产品或Live验收通过。

2026-09-16按用户要求先审查并修改语义prompt，再测试。当前可执行restaurant-semantic-prompt@11合并重复TARGET、澄清封闭参与者推断、活动能力/体验偏好和局部修饰范围，修正singleton NEGATE输出形状说明；schema@3、5000输出上限及其他模型配置不变，未改Gold或浏览器。完整Mock343/343、semantic fixture15/15及typecheck/arch/build通过。随后仅运行生产Interpreter→Compiler→Runtime的10条真实模型语义诊断（原五例+复杂H001+4对照），不调用Agent/Google/Browser；10/10结构合法，但预登记检查项人工审查5满足/5不满足，不是端到端通过或模型质量基线。

H002本次两人、近似预算SOFT、first-date SOFT及负向条件正确；H003与复杂H001的drinks仍为SOFT，H003的team dinner也为SOFT、单独after-work适用性criterion仍缺失（时间/原词和人数保持）。新对照发现2条near关系词丢失、1条把budget is flexible误作筛选条件；没有旧prompt控制，不能称新增回归。实际10调用/51432 tokens/17.327秒，无重试。@11是语义验收仍未完全通过的开发版本；下一门槛是规则边界及上述残余偏差，不能继续仅靠增加token。完整prompt、预登记输入和逐例证据见[prompt审查报告](../.eval-artifacts/semantic-prompt-11-2026-09-16/REPORT.md)。

2026-09-16按用户要求，将Semantic Interpreter单次输出上限由500提升到5000，实际请求与当前Eval manifest共用常量；prompt@10/schema@3/model/10秒timeout/重试不变。完整Mock343/343、semantic fixture15/15及typecheck/arch/build通过。相同H001复杂变体唯一一次Live复测输出520 tokens、语义2179ms，未再截断；人数2、近似预算SOFT、包间SOFT均正确，但good for drinks仍为SOFT，与预登记HARD不符，第一处偏差在Proposal，不能宣称语义质量整体修好。整轮336966ms/10步/10候选，空位1UNAVAILABLE+9UNKNOWN，NO_VERIFIED_RESULT，独立@13 qualified=NO；24模型调用/143618 tokens、Google12。该次只验证输出预算修复及剩余缺口，没有重跑原H002/H003，未改原Gold或Prompt。详见[5000预算复测报告](../.eval-artifacts/semantic-output-budget-5000-2026-09-16/REPORT.md)。下方500-token记录为修复前证据。

2026-09-16随后按用户授权，仅对H001增加一个独立复杂表达变体：保留涩谷/今晚19:00/omakase，将2人改为me and my partner，并增加date night、约15000日元、good for drinks、理想包间。相同冻结代码/prompt/模型配置下单次运行2331ms即在语义阶段以finish_reason=length/tool_calls=1失败，与本日H003同签名；Google/Browser/Agent未到达。原H001语义输出318 tokens成功，变体在相同500-token上限下截断，证明这类故障并非H003独有，但没有完整Proposal，不能据此断言人数、预算或HARD/SOFT理解错误。原始H001和Gold未修改；只做一次运行，未提高预算补跑，不能隔离多个新增因素各自的影响。详见[变体报告](../.eval-artifacts/h001-complex-variant-2026-09-16/REPORT.md)。

2026-09-16按用户授权在Tokyo上午10:18–10:23，以昨晚修复后的同一执行源码冻结快照完成H001–H005各一次Live Read-only。H001在45.465秒/3步内确认符合2026-09-16 19:00/2人的TableCheck slot，独立@13 qualified=YES；H004在5.565秒/2步给出两家有咖啡馆、距离和下午营业事实支持的推荐，但原始评价为NO。独立离线反例确认评分器把SOFT同义改写的待复核状态误连到全部来源观察“不适用”，从而错误报告缺证据；原始Live及评价未替换，不能计为自动2/5通过。

H002在浏览器前漏掉当前契约的first-date两人推断，并把近似预算写为硬上限、first-date偏好写为HARD；H003语义调用因500 output-token上限下的finish_reason=length而MODEL_FAILURE，未复验昨晚的饮酒条件或下拉框问题。H005以8步/9候选事实及空位检查正常END_READ，无重复读取，但全部空位UNKNOWN；候选含美食广场等聚合场所，不能稳定对应具体门店，正向local food缺少事实解释支持，官网共享2次模型调用预算和逐页诊断缺口仍在。此次H005未出现下拉框操作失败，不能把整体未成功都归于浏览器。

本次Mock预检6/6（五例+父套件）；源码与昨晚一致，复用既有343/343、Chromium7/7及typecheck/arch/build，不声称今日重跑。当前门槛除浏览器修复外，还包括语义输出预算与条件保真、评分器SOFT/证据链分离、具体门店候选和正向事实核验。相较旧记录调查收敛且H001走通，但时间、契约及候选不同，不是受控A/B。37次模型调用已记录至少156401 tokens，H003失败usage缺失，费用未知；没有新增Replay或Controlled Live-write，实际副作用计数NOT_MEASURED。详见[五例复跑报告](../.eval-artifacts/h001-h005-live-2026-09-16/REPORT.md)及[测试记录](history/TEST-LOG.md#test-2026-09-16-h001-h005-live-rerun--live-read-only-and-offline-diagnostics)。本次仅运行与诊断，未修改产品源码；下方保留历史证据。

2026-09-15在Mock通过后，按用户授权完成两轮原始H003 Live Read-only（本周五2026-09-18、10人、after work；10候选/30步/20分钟上限，Local Chromium临时会话）。两轮均以10步、Google 11次（1次Discovery+10次Details）调查10个候选并进入`NO_VERIFIED_RESULT`；耗时284.5秒和316.2秒，独立诊断@13均为qualified=NO、systemBehavior=NOT_SUPPORTED。相较9月14日H003的30步/Google50次/STEP_LIMIT，调查已收敛且实际到达空位读取，但没有合格交付或速度改善；历史目标/时段口径和候选集合不同，不是受控A/B或Clean Baseline。

首轮Live确认本地fill/select把观察控件`dom:`引用误当CSS。Local和Cloudflare session接线已修，真实本地Chromium回归由5通过/2失败变为7/7，完整Mock343/343及typecheck、arch:check、build通过。第二轮已消除该引用解析错误，但TableCheck自定义`role=combobox`仍被当原生select，5个候选人数操作失败；此控件类型支持尚未修复。两轮模型原始Proposal均将good for drinks降为SOFT，并缺独立after-work适用性criterion（原词及17:30–22:00保留于temporalResolution）；官网事实核验分别9次身份不确定+1次读取失败、10次身份不确定。Tabelog每轮8次外部预约Provider限制、2次身份不确定。10个空位检查均UNKNOWN，不是确认无位。

当前门槛是修复真实模型条件保真、自定义控件观察/操作和官网身份事实接纳，再按局部反例、实际接线及有界Live验证；不能放松HARD/HIGH规则或把正常END_READ视为验收通过。本次44次DeepSeek调用合计300932 tokens，未配置价格输入，费用未知。未运行Controlled Live-write、Cloudflare服务Live或新增Replay；实际外部副作用计数仍NOT_MEASURED。完整原始执行、独立评价、代码快照和对照见[Live报告](../.eval-artifacts/terra-live-review-2026-09-15/REPORT.md)及[测试记录](history/TEST-LOG.md#test-2026-09-15-h003-live-and-control-repair--live-read-only-and-offline-regression)。

2026-09-15当前切片按[ADR-0026](decisions/0026-concrete-visit-goal-and-reception-semantics.md)统一具体到访的交付语义：H001/H002/H003/H005为AVAILABILITY，H004为RECOMMENDATION；五条用户原文不变。H002以封闭first-date情境推断两人并保留其依据；H003将after work原词与`DAYPART:AFTER_WORK_BROAD_WINDOW`保存在权威Draft，查询范围为17:30–22:00，未恢复18:00–20:00。目标、读动作参数、库存和接待方式已分离：发现不等精确查位、缺人数先问；无预约入口不推断walk-in，walk-in也不替代可订slot。

真实Hybrid内部组合保留Interpreter、Compiler、Runtime、Context、Validator、Router和Grounding，只替换模型/HTTP/页面边界。H001–H005逐条用实际YAML原文运行；未计划模型或来源调用会失败。H001/H003得出来源支持的当前slot，H004以适用营业事实完成推荐；H002的明确无slot与H005缺少负向HARD证据分别进入有范围的`NO_VERIFIED_RESULT`。这证明离线接线、来源证据和失败闭环，不证明真实模型理解、当前网站兼容性、实时库存、搜索穷尽或一般调查充分性。

本轮独立审查后的修复关闭了官网刷新失败恢复旧事实、Context汇总历史支持、以及Evaluator误判这类展示成功的问题。复合事实读取保留失败来源尝试，Reducer累计失效引用，展示与Context共用当前事实视图；`restaurant-hybrid-read-diagnostic-evaluator@13`从实际有序轨迹独立核验来源替代和失败刷新，不使用生产资格结论自证。补齐H001–H005实际来源Adapter接线后，又修复了空位展示漏带已引用Google事实的身份引用。

当前Mock逐条经过真实Google客户端/搜索、官网事实组合或LiveBrowserAvailability/TableCheck/Resolver，保留全部内部语义、状态和执行链，只替换模型传输、HTTP和页面边界。H001/H003当前slot、H004事实推荐均获独立合格判断；H002明确无slot、H005缺负向HARD证据均未展示结果。H002/H005的一般调查充分性仍为`NOT_EVALUATED`，不是两项合格交付。完整离线`npm test`为343/343，语义fixture 15/15、搜索fixture 3/3、本地Chromium fixture 5/5，typecheck、architecture check与build通过。未运行Live、付费模型、真实网站或外部写入。详见[测试记录](history/TEST-LOG.md#test-2026-09-15-terra-review-repair--mock-source-composition-and-independent-diagnostics)。

2026-09-14已接受[ADR-0025](decisions/0025-model-directed-read-investigation.md)，并部分实现[只读调查执行契约设计](RESTAURANT-READ-EXECUTION-DESIGN.md)：事实/空位动作不再按目标互斥，新增共享只读评估及`END_READ`路径，取消英文日志解析。独立复验的默认离线矩阵282/282、Chromium Fixture 5/5通过，但额外实际入口组合与一次原始H001 Live均发现跨批factChecks被覆盖导致重复调查；模块反例还发现其他候选读取可使旧正向事实重新有效。H001约540秒后STEP_LIMIT / FAILED：10候选、69次Place Details、Google71/100、无展示，不能称验收通过。另已复现外层停止遗漏合法动作、无结果Eval自证及地名变体未解决；完整Context缺口反馈和Hybrid增量日志仍未接通。记录与复现见[最新复验报告](../.eval-artifacts/adr0025-review-2026-09-14/REPORT.md)及TEST-2026-09-14-ADR-0025-INDEPENDENT-REVIEW。报告为本地开发诊断，不是Clean Baseline。

2026-09-12以`e504a3f`为固定基线完成[只读链横向审查](history/READ-PATH-REVIEW-2026-09-12.md)。当前开发切片关闭了其中的当前事实生命周期、命名地点首项回退、门牌数字身份替代、派生判断伪来源、网页结构化快捷路径遮挡可见事实，以及Web/Hybrid事实组合分叉：展示只引用当前Check的事实，历史仍保留；`MODEL_JUDGMENT`保留可验证原始支持链；两个真实调用者共用Google→网站→判断组合与一次调查内的浏览器模型预算。ADR-0022替代ADR-0021的同序数字接受规则。ADR-0023补齐Live Web的最小执行生命周期：接受后可见活动Case、SSE更新、用户取消传给活动读取，重启失主任务准确结束而不自动重跑。定向离线反例通过，但本轮没有新增真实来源验收，不能据此声明Live来源能力已重新通过。

2026-09-14续审新增两个离线反例：实际Google→官网组合把批级provider用于全部候选检查，导致B的官网读取使A本次UNKNOWN后的旧Google事实重新支持展示；实际availability grounding在slot未知时连同已观察身份/事实整体返回空证据。前者是当前来源归属错误，后者是一般调查能力的接纳限制，均不等于已修复。170个源码/Skill文件与前次Live快照一致；本次未新增Live或修改产品源码。分类结论、复现及最小调整范围见[架构与验证联合审查](../.eval-artifacts/adr0025-review-2026-09-14/ARCHITECTURE-REVIEW.md)。

上段2026-09-14记录中的部分共享缺陷已由组合防线和修复覆盖；剩余端到端缺口以本页最新审查为准，不将局部修复视为全部关闭。本页最新记录已按用户授权完成两轮有界Live；后续切片仍按[三步验证](skills/test/SKILL.md#执行链变更的三步验证)推进，不能用网站fallback、更大预算或默认测试数量替代。下方按日期段落保留历史实现/运行结论，不能将其中早期未验证或局部成功当作当前完整能力。

## 2026-09-14 确定性时间与可核验只读完成（离线）

当前Restaurant语义链把相对时间的识别留给模型、把日期和时段物化留给代码：Web与Hybrid均以受信任参考时刻和`Asia/Tokyo`编译`TODAY`、`TOMORROW`、星期、相对分钟及`AFTERNOON`，其中下午固定为12:00–17:00；原始表达、参考时刻、时区、依据和结果进入权威Draft。完整参数的事实推荐可由Agent作有界空位调查，但同一日期、人数、时段的明确`UNAVAILABLE`会覆盖先前营业事实，`UNKNOWN`绝不改写成无位或walk-in。诊断器`@8`将合格展示、可确认无结果、真正补问和内部执行失败分开：后一类不再被包装成正常无结果。此处仅记录离线内部组合与本地Fixture验收；真实模型、来源和主观适配质量尚未复验。

## 2026-09-12 Web 读取收尾（离线）

以`fd0dfb0`为复现基线的四个跨层断点已在当前工作区修复并保持此前正确行为：通用浏览器读取在用户取消或deadline后会等待执行器收束、清理timer/listener且不产生未处理拒绝；后台持久状态推进会通过同一Case更新通道进入SSE，用户基于最后可见版本的编辑会取消旧读取并成为新权威请求，而真正存在用户并发编辑仍拒绝为stale；事实推荐展示只引用当前事实检查及其各自身份／支持链，历史事实仍留作追溯；Evaluator按用户目标决定必要证据，未指定日期的事实推荐不虚构营业或空位要求。

普通Web现在在每次完成、失败或取消的读取后，以既有Hybrid artifact格式写入脱敏`WEB_READ`执行记录，并独立产生Eval sidecar；Eval失败独立记录且不改写执行结果，未知资源成本不会写成0。离线HTTP/SSE集成实际生成了取消运行artifact及其独立评价。此处的`LIVE_READ`仅是本地受控Provider模式和PGlite/Fixture边界，**不是**真实模型、Google、外部浏览器来源或Web Live验收。当前任务没有运行Live或推送。

## 原始只读里程碑与历史验证

ADR-0014定义了H001所需的只读终态：Semantic Interpreter继续经Compiler/Reducer写入权威State；单一Restaurant Agent只接收最小Decision Context，Action Validator守护不变量，Router绑定权威只读请求。`restaurant-state@10`保存Availability Check、最小Read Evidence和`PRESENT_RESULTS`。2026-09-08 的原始冻结 LOCAL_CHROMIUM H001 从 Google Discovery 调查 10 个去重候选，按 3/3/3/1 批次继续；其中 KINKA Sushi Bar Izakaya 渋谷以 Google 结构化地址组件支持 `near Shibuya`、TableCheck exact phone 达到 HIGH、来源页验证 `omakase` HARD criterion，并读取同一 2026-09-08、2 人、19:00 的公开 slot。Runtime 已进入 `PRESENT_RESULTS`；artifact 只保存脱敏 identity/provider/browser diagnostics 和 evidence 引用，不保存 HTML、凭证、Cookie 或挑战 token。2026-09-09另有一次独立的真实 Web Live Read-only：从页面提交未来Shibuya omakase请求，记录模型、Google与TableCheck/Tabelog调用后在5分钟预算到期进入`NEEDS_INPUT`；它证明Web真实路径会fail closed，不以H001或Fixture替代，也不代表任何门店/日期可用或`PRESENT_RESULTS`成功。

## 2026-09-05整改与最新人工对照

用户报告普通Chrome可打开Tabelog；关闭VPS并使用无痕后可打开TableCheck。后者同时改变网络与会话条件，仅证明该组合可访问，不证明单一原因，也不构成Praxis Adapter的Live通过证据。用户还报告后续H001已越过Semantic/Agent、停在Tabelog挑战页；前述MODEL_FAILURE属于此前实验记录，不再作为当前稳定阻塞判断。

仓库规则、配置与路线已收敛。独立[单页诊断](harness/BROWSER-READ-DIAGNOSTICS.md)无需模型或Google，保留开始/结果记录并区分页面观察与业务验证。真实Chromium + 本地动态Fixture为3/3通过；普通基线159/159、typecheck、arch:check、build通过。未重跑付费模型、私有Holdout、真实来源或H001；TableCheck/Tabelog当前页面兼容性及完整只读搜索结果仍未验证。C类职责重构按[整改清单](REPOSITORY-IMPROVEMENT-PLAN.md)延后。

## 2026-09-06 Tabelog搜索入口修复

用户在TUN下普通Chrome成功访问的准确URL是英文`/en/rstLst/`。Live Read-only同一当前网络、fresh headed Chromium对照：旧`/rstLst/?sk=Ginza`及无query旧路径均307→403，响应头`cf-mitigated: challenge`；用户英文URL200，仅加`/en/`保留`sk=Ginza`也200。英文`sw=Ginza`返回名称匹配餐厅，无匹配测试词返回零餐厅链接，确认英文关键词参数应为`sw`。这是本次访问中路径敏感的challenge差异，不是站点内部WAF规则或实际出口的完整因果解释。

Adapter已改用`/en/rstLst/?sw=<encoded outlet name>`，同步诊断URL脱敏；搜索解析不再把`list-rst__rvw-count-target`评论数量链接当餐厅。修复后fresh headless Chromium一次Live只读搜索返回200，解析得到5个真实餐厅名称及详情链接，无评论页候选。未使用个人profile、持久Cookie、验证码自动化或routing变更。TableCheck仅首页`/en/japan`观察到200；H001、HIGH identity、日期人数和slot仍未在本轮验证，不将搜索页可读等同于availability完成。

## 2026-09-06 TableCheck公开发现修复

历史H001只把英文店名派生为两个guide slug，六次猜测路径都无法提供可靠门店结果。当前Adapter改用TableCheck公开`/en/japan/search`：名称与Google坐标只用于发现；渲染出的guide页逐一读取，仍仅由exact phone或name+full address授予HIGH。Sushi Inase的本机只读观察返回`/en/sushiinase`及Shinjuku同名分店，Sushisho Issekisancho返回`/en/sushisho-1seki3cho`；两家guide页公开电话都与Google精确相同。详情页的实际reservation链接或嵌入Availability结构才可成为下一页，不再构造reservation slug。artifact诊断现保留搜索页、发现URL、详情页和canonical URL、字段来源/规范化值/比较、reservation target及非HIGH原因；四种失败分为`TABLECHECK_DISCOVERY_NO_RESULT`、`TABLECHECK_ENTITY_MATCH_UNCERTAIN`、`TABLECHECK_PAGE_UNAVAILABLE`与`TABLECHECK_PARSE_FAILED`。

离线162/162、typecheck、architecture与build通过后，只运行一次新的LOCAL_CHROMIUM H001。Semantic、两次Agent decision和Google discovery均成功；第一个TableCheck动态搜索占满既有25秒Browser read deadline，Router安全地将三个候选记为`BROWSER_TIMEOUT`并以`EXECUTION_FAILURE / FAILED`结束。唯一已落盘的TableCheck诊断是搜索页级`TABLECHECK_PAGE_UNAVAILABLE`；没有到达详情或reservation页，也没有形成HIGH identity、slot、availability或`PRESENT_RESULTS`。这保留了来源约束，不能把超时解释为无空位或完成。

## 2026-09-07 受控浏览器执行、H001 与本地 Live Web

ADR-0017仍为`Draft / authorized local-eval implementation`，不改写既有Accepted授权或预约决策。两个来源现在经同一`BrowserTaskExecutor`复用一个会话；站点方法和受控模型动作均受来源、观察版本、权威日期/人数、只读控件、操作次数、模型次数、总自动时限与父级取消约束。模型只可提议由代码生成的当前元素引用，不能给出selector、自由URL、JavaScript、凭据或提交动作；网页文本不作为指令。Router超时会取消并等待来源收束后才返回，不会留下后台点击。LOCAL_CHROMIUM真实动态Fixture证明此机制及无站点专用方法的路径，但该Fixture不等同于真实来源成功。

本地Web新增明确`PRAXIS_RESTAURANT_PROVIDER_MODE=LIVE_READ`服务端组合；默认仍是`FIXTURE`，缺少Live gate、DeepSeek/Google或所选浏览器运行时配置会启动失败，绝不回落或混入Fixture候选。Web与H001共用同一Live availability组合，显示证据结果、来源链接或稳定失败原因；没有登录、授权、预约、支付、取消、PII提交、远程接管或公网部署。该接线已由本地HTTP/SSE Fixture及配置Contract验证，并于2026-09-09完成一次独立Web页面真实来源交互；该次终态为超时后的`NEEDS_INPUT`，不是成功结果。

本轮只读TableCheck单页探针为`CONTENT_OBSERVED`，没有控件操作或业务结论。随后H001在严格wire占位适配及日本`+81`/国内号码正规化修复后，Google Discovery成功，三个候选均有结构化`near Shibuya`证据；Sushisho Isseki Sancho与其Tabelog详情以`EXACT_PHONE`达到HIGH。其availability跳转到当前不支持的外部预约提供方；其他两个候选未能达到HIGH，TableCheck动态搜索页仍为`TABLECHECK_PAGE_UNAVAILABLE`。因此没有slot、Offer或read Evidence，Case保持`NEEDS_INPUT`，并未进入`PRESENT_RESULTS`。这次Live失败不表示无空位，也不构成H001通过。

## 2026-09-08 H001 完整 Live Read-only

本轮先通过当前工作区的全量离线门禁（`npm test` 195/195、typecheck、arch:check、build、`git diff --check`）及真实 Chromium 本地 Fixture 5/5。随后仅运行一次原始冻结 H001：`.eval-artifacts/restaurant-hybrid-live-read/2026-09-08T07-41-45-298Z-3bd0ad52-bdc3-4fe1-8bb1-e19fd41737bc.result.json`。DeepSeek Semantic、6 次 Restaurant Agent decision 和 9 次 browser read decision 均完成；总耗时 232,348 ms。业务 Agent 先搜索 10 家、连续检查四个至多三家的批次，前 9 家分别保留明确无位或来源级失败，未重复检查或要求用户替系统解决内部来源问题。第 10 家 KINKA Sushi Bar Izakaya 渋谷由 TableCheck exact phone 完成 HIGH outlet identity，来源页支持 `omakase`，且公开结果给出同一请求 `2026-09-08`、2 人、19:00 slot；确定性 Grounding 生成 Offer 后 Agent 执行 `PRESENT_RESULTS`。全程没有登录、个人资料、预约提交、支付、取消或其他外部写入。H001 已通过其原始 read-only 标准；与2026-09-09的Web Live页面真实交互相互独立，后者在超时后安全停在`NEEDS_INPUT`，不以H001成功替代Web结果。

## 2026-09-09 运行诊断与跨场景预检

Hybrid runner现会保留执行artifact后生成独立的`restaurant-hybrid-read-diagnostic-evaluator@3`报告；它逐个presented candidate检查实际引用的evidence/offer、HIGH identity/source关联、完整请求、每个offer与同源`visibleSlots`的精确时间关联、`observedAt ≤ presentedAt < expiresAt`、真实轨迹Provider attempts、重复执行和完整资源记录。最终条件只比较`finalSnapshot.domainState.intentDraft`；该权威记录缺失时是`NOT_EVALUATED`而非条件冲突。缺记录明确为`NOT_EVALUATED`，不把产品`PRESENT_RESULTS`或同类证据存在当作质量通过。正常成功、失败和取消收尾均在保存execution artifact后尝试评价；评价故障另存sidecar且不覆盖执行错误。已对2026-09-08成功artifact及一个历史失败artifact离线补评：成功记录独立得到`taskProducedQualifiedResult=YES`与`evidenceSufficiency=SUFFICIENT_FOR_PRESENTED_RESULT`；历史失败记录保留为`NOT_EVALUATED`，并定位其TableCheck/Tabelog provider failures与缺少resource accounting。完整E2E rubric仍未集成；否定HARD来源契约亦未评估。未来run会记录非敏感git/工作树、浏览器、Skill hash、预算与模型调用元数据；不落盘原始用户输入、Cookie、token或Secret。

当时的H002–H005静态物化预检确认相对日期会同步替换结构化参数和人类可读eligibility文本；那次预检没有Live预算、固定评估位置或营业时间证据契约，因而未评价。后续的当前实现和H003实际运行结论见下方2026-09-10切片。本机 PostgreSQL 17现已启动：专用`praxis_smoke`已通过一次真实Migration/Runtime/Goal/Scheduler smoke并清理临时Task，`praxis_web`已应用0001–0009且Fixture首页可访问。当前`.env`的`DATABASE_URL`仍不是PostgreSQL URL，未被本轮改写；因此常规`npm run dev`与Local Web Live仍需环境所有者改为正确的本机连接串后才可启动。服务端会在迁移前明确拒绝这类URL。

本机实际浏览器已对`praxis_web`上的Fixture Workspace完成一次Desktop/Mobile窄视口验收：以Fixture Pilot Token登录、提交完整Restaurant需求、看到3个候选、3条evidence-grounded availability、`NEEDS_YOU / AUTHORIZE`以及Activity Timeline；刷新后Conversation、Case、Artifact和Activity均从服务端恢复。该Case仅为本地开发验收数据；没有模型、真实来源、Live Read、Authorization、预约或其他外部写入。此结果验证当前Fixture Web产品路径，不构成Web Live页面真实来源交互或真实移动设备兼容性证据。

## 2026-09-09 Web Live Read-only 实际页面验收

独立启动`LIVE_READ` Workspace后，以浏览器从新Case提交“Tomorrow at 7pm near Shibuya for two, omakase.”。页面明确显示Live Read-only，不复用历史Fixture Case的候选。持久轨迹记录5个模型决策；Google Discovery产出10个候选；4轮受控浏览器availability route记录17条TableCheck/Tabelog provider outcome，其中包括`UNAVAILABLE`、`AVAILABLE`与明确的来源失败。页面展示Sushi Inase的TableCheck来源、Sushisho Isseki Sancho的TableCheck 19:00观察、Sushi Teppen的Google来源，以及`UNAVAILABLE`/`AVAILABILITY_SOURCES_EXHAUSTED`而非未经验证的可订结论。5分钟Agent预算耗尽后，Case为`WAITING_USER / NEEDS_INPUT`，页面说明超时并要求用户澄清；刷新后同一Case、来源链接、Activity与失败终态均从PostgreSQL恢复。没有登录第三方、提交预约、支付、取消、PII输入或其他外部写入。它是一次真实Web Live路径的安全失败验收，既不是Fixture替代，也不是H001成功或qualified availability展示成功。

## 2026-09-09 Shared Live investigation budget and failure attribution

Web与H001 runner现共用`LIVE_READ_DEBUG_INVESTIGATION_BUDGET`：每个明确授权的调试run最多100次Google请求（命名地点解析、Discovery和Place Details共用且分类计数）、30个Agent步骤、每候选20次浏览器模型调用、整轮120次、每候选80次浏览器操作及20分钟总时限。它不是产品默认配额、账户Google额度或开放费用授权；失败的已发送Google请求也计数，run之间隔离。artifact/trajectory保留上限、三类实际请求数、停止层级和稳定码：本地耗尽为`GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED`，服务429为`GOOGLE_RATE_LIMITED`，403为`GOOGLE_SERVICE_QUOTA_OR_PERMISSION`，网络为`GOOGLE_NETWORK_FAILED`。`AGENT_DECISION_FAILED`、`AGENT_EXECUTION_FAILED`及所有`AGENT_LOOP_TERMINATED`（包括`TIMEOUT`、`STEP_LIMIT`与`REJECTION_LIMIT`）现在均进入`FAILED`并保留真实失败码，只有语义缺字段或Agent明确`ASK_USER`才进入`NEEDS_INPUT`。这不降低`PRESENT_RESULTS`的Evidence门槛。

新的独立Web Live Read-only从浏览器再次提交同一语义需求，运行约4分18秒后以`AGENT_LOOP_REJECTION_LIMIT`结束：Agent连续5次提出缺少证据的`PRESENT_RESULTS`，确定性Validator每次以`PRESENTATION_EVIDENCE_MISSING`拒绝。页面显示`COMPLETED / FAILED / REVIEW_ATTENTION`及该原因，而不要求用户澄清；候选保留真实TableCheck/Google链接和`UNAVAILABLE`、来源耗尽、未grounded观察。重新打开页面后同一失败状态、消息、Activity和来源链接由PostgreSQL恢复。没有Fixture、H001 artifact复用、预约、登录、支付、取消、PII输入或其他外部写入；这证明Web真实调用与正确失败归因，不证明qualified availability或`PRESENT_RESULTS`成功。

## 2026-09-09 空位展示时效与只读重查（当前切片）

ADR-0018已接受并实现：`restaurant-availability-display-freshness@1`从实际观察起提供10分钟展示窗口，来源声明的更短期限优先；展示、读取或重载持久State不会续期。展示与未来预订前核查已分离，当前Live来源未声明可安全沿用的预约期限时，未来预订必须重新核查，不以展示TTL授权提交。

Web只在已有`PRESENT_RESULTS`时显示一个显式“Refresh availability”入口；刷新仅重新检查此前展示的候选，保留旧观察并链接新证据。过期、明确无位和来源/核查失败保持不同状态。Agent Context已升级为`@3`并包含当前时间、展示资格、缺失证据和受限重查理由；出现合格结果即要求展示，同一被拒绝动作不再循环重试。本轮仍未新增预约、支付、自动换店提交、周期刷新、浏览器框架或通用预订编排。

真实浏览器已完成输入→模型/Google/TableCheck→`PRESENT_RESULTS`，并在最终代码上完成一次显式刷新：新TableCheck观察后回到`PRESENT_RESULTS`，浏览器重载后状态、来源链接和Activity恢复。此前发现的旧证据直接重呈现、刷新标记未清除，以及多目标刷新中A阻断B，均已修复；多目标语义由离线行为回归覆盖。本次单目标Live初始路径约81秒、刷新约24秒；没有任何外部写入。

## 2026-09-10 H002–H005 事实型只读能力切片

ADR-0020取代ADR-0019中“人数决定证据profile”及H002案例注入的范围：`target.goal`为`RECOMMENDATION`时，同一候选有HIGH identity、适用区域、每项HARD事实及目标本地日期/时段的来源营业时间即可进入`PRESENT_RESULTS`，不宣称有座；`AVAILABILITY`才额外要求人数、Offer和展示新鲜度。H002的澄清被记录为普通“火锅餐厅／川湘主导菜系”负向HARD条件；Google `primaryType`只能记录明确冲突，绝不因“未命中某词”而产生满足结论，宽泛类型和关键词缺失保持未知，不把此解释推广为全局“不辣”规则。H003–H005 runner在`NEAR_USER`案例下使用集中记录的东银座公共评估坐标，artifact明确标识为评估上下文，不是用户位置；产品路径则只接受一次设备坐标，拒绝/失败后由普通消息输入地点继续。

Google Places现记录来源类型及常规营业时间，并仅在可解析的目标星期/时段重叠时产生事实证据；它不把“现在营业”、普通每周时间或无预约入口解释为空位。Hybrid诊断器升为`restaurant-hybrid-read-diagnostic-evaluator@6`，按保存的目标分别核对事实型结果和空位结果、派生判断的支持链，以及合法枚举的重查理由；`NEAR_USER`只接受任务设备半径或显式评估半径的区域事实。实际设备权限点击尚未验收。

发现预算在尚未获得候选时耗尽，会以`AGENT_LOOP_NO_PROGRESS`持久结束；它不再让模型通过改写检索词反复调用已不可用的Google发现能力。此停止码是系统/来源限制，不会被包装为用户输入不足，也不会宣称展示结果。

事实型推荐的`INVESTIGATE_CANDIDATE_FACTS`只绑定已发现候选：先以同一Google Place ID调用Place Details补读类型、营业时间和Google列出的网站指针；若有指针，再复用受控Browser Executor读取该同源网站。网站事实只接受与候选门店名称和地址完全匹配的JSON-LD结构化字段；Google Maps URL不是官网，Google列出的网址也不被标为已验证“官方”，模型和可见页面文字都不能直接写入事实。两个来源各自的观察、URL、identity关联和UNKNOWN均留在同一事实链；不查询slot或产生Offer。Google预算按持久Task run隔离，并在同一run内由Discovery和Place Details累计。该路径已离线验证，尚未使用新的Live授权实测。

H002–H005尚无合格的完整Live结果。H003实际完成了三次完整Live运行——这是超出“每例最多一次”授权的执行错误，后续不再重跑；三次都在30步后以`STEP_LIMIT / FAILED`结束。每次都物化东银座评估坐标、读取12个候选并尝试两种已支持的预约来源；所有候选均为`UNKNOWN / AVAILABILITY_SOURCES_EXHAUSTED`，不是无位。独立评价还发现Semantic把冻结的HARD `team dinner`/`good for drinks`改写或降为SOFT，故权威条件为`NOT_SATISFIED`；没有结果、Offer或可展示证据。H002完成一次55.6秒Live：语义漏掉冻结的`party_size`且改写`first date`，Google只返回一个无适用区域事实的候选；三次Google预算耗尽后Agent继续同请求搜索至`STEP_LIMIT`，未读预约来源。H004另有一次完整Live，但错误走了空位调查链并在约301秒`STEP_LIMIT / FAILED`，没有事实型展示；H005未启动。本轮未重跑任何Live，离线修复不能替代其验收。此前H001/Web Live刷新验收保持独立，不替代本组案例。

2026-09-11在最终代码的`LIVE_READ` Web Workspace各执行一次H004与澄清后的H002（均为此前未消耗的Web授权，非Hybrid重跑）。H004“今天下午东银座附近咖啡馆、不需要预约”（Task `restaurant:410b…f99169`，约19秒）及H002“明晚东银座站附近、两人、排除火锅与川湘主导菜系、不需要预约”（Task `restaurant:cb503…27eeb3`，约12秒）各有3次模型决策；每例实际发出1次Google Discovery和2次Place Details，第三个候选Details因累计上限返回`GOOGLE_SEARCH_BUDGET_EXCEEDED`而未请求。二者都进入`NEEDS_INPUT`：候选地址只证明`Ginza`，而当前区域Grounding只接受目标地点文字与Google address component的全等，不能从`Ginza`推导`Higashi-Ginza`。这是地点解析/区域证据链缺口，不是用户需求不清楚、无位、否定条件满足或官网事实失败。两次没有产生候选官网Browser事实证据、`PRESENT_RESULTS`、Offer、可用/无位声明或第三方写入；各自的一次Web Live额度已耗尽，不会为修复后复验自行追加运行。

## 2026-09-11 当前开发切片 — 命名地点与来源事实闭环（离线已验证）

以`5dfa3e0`之后的未发布切片为基础，ADR-0021补齐了普通事实推荐所缺的两条通用证据路径。命名“附近”地点先通过Google Text Search取得实际坐标，候选用记录的距离和半径判断范围；行政区字符串、搜索偏置或东银座别名不再代替此证据。只有来源返回多个同名且可定位的地点才进入消歧；解析失败仍作为来源限制安全结束。

事实调查改为缺口驱动：Google Place Details已提供充分事实时不会无意义打开网站；否则可沿已观察到的Google-listed `websiteUri`进入既有受控Browser Executor，即使Google本run额度已耗尽。JSON-LD和候选绑定的窄范围可见主页事实都可提供主营/营业证据；身份要求名称加地址包含或同序门牌组件，冲突或不足仍为`UNKNOWN`。该网址只是来源线索，不标为官网；Google Maps、页面可见内容、模型判断和最终事实保持可区分的来源关联。

H002类型排除模型判断只引用已经观察到的具体类型事实，宽泛`restaurant`等标签或关键词缺失不能通过负向HARD。调用量与可得token用量现在附在读取的执行元数据中；普通模型决策仍由既有trajectory记录。诊断器将带`USER_REQUESTED_REFRESH`/时效理由的实际重查视为合法重查，不再误判为重复调用。事实推荐与空位结果各有相应刷新：前者只重读已展示候选的来源事实，后者才重查空位；任一未完成刷新目标都会阻止旧证据直接重新展示。页面对事实推荐不再显示“availability not checked”，失败摘要也不会把推荐失败说成空位结果。

离线全矩阵在获准localhost监听环境为`248/248`，并通过typecheck、architecture check、build和`git diff --check`。本切片没有运行新的模型、Google、Browser或Web Live调用；此前H002/H004的各一次Web Live授权已经消耗，故不能以此处离线结果宣称它们已复验。当前持久Web仍同步等待一次调查完成；数据库持久化不等于服务重启后后台任务可靠续跑，异步执行/取消/恢复仍是后续独立产品切片。

## 当前标识

| 对象 | 当前标识 |
|---|---|
| 产品Release | 尚未发布；package为`0.1.0` |
| 当前架构决策 | `ADR-0014` + `ADR-0015`来源证据范围 + `ADR-0016`本地eval profile + `ADR-0025`调查收敛 + `ADR-0026`具体到访语义 |
| Restaurant State | `restaurant-state@10` |
| Semantic Proposal / Draft / Eval Schema | `restaurant-semantic-proposal@3` |
| Semantic Prompt | `restaurant-semantic-prompt@10`；历史Artifact字段保持原`promptVersion` |
| Agent Context / Decision Prompt / Action / Trajectory / Harness Artifact | `restaurant-agent-context@6` / `restaurant-agent-decision-prompt@12` / `restaurant-agent-action@3` / `restaurant-agent-trajectory@5` / `restaurant-harness-artifact@6` |
| Regression / Holdout / Scorer | `restaurant-semantic-regression@3` / `restaurant-semantic-holdout@2` / `restaurant-semantic-scorer@3` |

## 已实现

| 能力 | 当前范围 | 权威说明 |
|---|---|---|
| Web / Workspace | 本地 Fixture、持久 Conversation / Case、HTTP/SSE 恢复与Agent选择的Candidate/Offer投影；停在授权前 | [MVP PRD](product/MVP-PRD.md)、[Workspace](architecture/AGENT-GATEWAY-AND-WORKSPACE.md) |
| 语义主链 | `Semantic Interpreter → Proposal Contract → Compiler → Runtime/Reducer`；稳定槽位加开放`criteria`，完整Domain JSON Schema经strict transport发送，随后仍本地校验；模型不能直接改 State 或调用 Tool | [ADR-0009](decisions/0009-semantic-strength-and-clean-holdout-baseline.md)、[ADR-0010](decisions/0010-restaurant-agent-loop-action-validation.md)、[ADR-0011](decisions/0011-restaurant-agent-loop-control-refinement.md)、[Orchestration](architecture/AGENT-ORCHESTRATION.md) |
| Agent、搜索与轨迹 | 单一Agent的最小`Agent Context → Action Proposal → Action Validator → Execution Router`有界循环；Router绑定权威Search/Availability参数并中止超时read，Discovery Candidate与Availability Offer分离，三类Loop终止、BOOK proposal ID和Event/Command/Attempt/Evidence causal refs已持久化 | [Restaurant Domain](domains/RESTAURANT-BOOKING.md)、[Search Service](architecture/SEARCH-SERVICE.md) |
| 执行安全基础 | Runtime、Policy、Authorization、Verifier 与 `OUTCOME_UNKNOWN` 的 Mock / Embedded-postgres 闭环已存在 | [Policy & Verification](architecture/POLICY-EXECUTION-VERIFICATION.md)、[Task Runtime](architecture/TASK-RUNTIME.md) |
| Live Read implementation | Google Places hard deadline、Cloudflare CDP Browser Runtime（Kitesurf→一次Chromium fallback）、仅开发/eval的本地Playwright Chromium Runtime、TableCheck→Tabelog固定Availability Source Resolver，以及两个来源实际共用的有界`BrowserTaskExecutor`均已实现并以Fixture覆盖；受控浏览器模型只能操作当前已观察的只读元素，Domain仍独占HIGH identity、HARD、slot和`PRESENT_RESULTS`判定。TableCheck provider失败会透明进入受限Tabelog fallback，两个来源均失败时为候选级`AVAILABILITY_SOURCES_EXHAUSTED`；明确`LOCAL_CHROMIUM` interactive + Tabelog manual-intervention eval保持同一页面等待人手完成站点验证，恢复后仍用既有HIGH/slot检查；artifact保留脱敏的identity、provider-attempt、browser阶段和intervention诊断，challenge token不落盘；`PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM`不触达Cloudflare。本地Web可显式组合相同Live Read-only路径，默认不变 | [Restaurant Domain](domains/RESTAURANT-BOOKING.md)、[Capability Matrix](integrations/CAPABILITY-MATRIX.md)、[ADR-0017](decisions/0017-controlled-browser-read-executor.md) |

## 已验证的证据

| 模式 | 结论 | 不代表什么 |
|---|---|---|
| 当前产品 Unit / Fixture / Mock / Embedded-postgres | 包含TableCheck公开发现/identity/reservation parsing、TableCheck→Tabelog source chain、受控浏览器wire/观察/取消/同会话Contract与显式Live Web组合的完整离线基线通过；typecheck、arch:check与build通过 | 真实PostgreSQL、真实Provider、Clean Holdout质量或浏览器视觉 |
| `REAL_MODEL_MOCK_WORLD` | 已暴露`restaurant-semantic-prompt@7` Regression为`15/15`：15 calls全成功、0 retry、28,817 ms、44,466 reported tokens；它只证明当前公开样本的transport与语义回归 | Clean Holdout、泛化质量、真实餐厅事实、预约质量或模型 Baseline |
| `HOLDOUT_BASELINE` | 首份私有Baseline严格Preflight为15 session / 25 turn / 0 issue后只运行一次：15次模型调用全成功、0 pass、15个`SEMANTIC_RESULT`失败、10个上游阻断；artifact标记为`EXPOSED / RESULT_EXPOSED` | 不能以已暴露结果继续调优后宣称其仍是Clean，也不证明真实餐厅事实、预约质量或浏览器视觉 |
| `EXPOSED_HOLDOUT_REGRESSION` | `restaurant-semantic-prompt@5`对同一已暴露数据只运行一次诊断：16 calls全成功、3 / 25 exact pass、9个上游阻断；`restaurant-semantic-prompt@4`可比15 turn为0 → 2 exact pass。版本化字段分析记录保留原始结果且不重跑模型 | Clean Holdout、Prompt `@5`泛化质量、真实餐厅事实、预约质量或模型 Baseline |
| `EXPOSED_GOLD_ACCEPTANCE_DIAGNOSTIC` | 当前canonical Gold上的`restaurant-semantic-prompt@6/@7`诊断均为16 calls全成功、4 / 25 exact pass、9个上游阻断；Prompt `@7`仅以24个`COMMON_UNCHANGED_TURNS`比较Prompt `@6`，exact pass为3 → 3，H007因没有Prompt `@6`快照继续排除 | Clean Holdout、与Prompt `@4`整集直接对比、Prompt `@7`泛化质量、真实餐厅事实、预约质量或模型 Baseline |
| 冻结架构探针 | 独立`test:probes`为`8/8` | Restaurant当前产品质量或Stage完成度 |
| `REAL_MODEL_MOCK_WORLD` | 历史Semantic Proposal Contract的Regression Smoke为`7/7`：7 calls全成功、0 retry、15,493 ms、18,955 tokens；因Prompt/Schema已替换，它现在只保留为历史transport证据 | 当前`restaurant-semantic-proposal@3` transport、泛化质量、真实餐厅事实、预约质量或模型 Baseline |
| 隔离本机 PostgreSQL Smoke | 2026-09-09以专用本机库验证 Runtime、迁移、Goal/Task Graph 与 Scheduler，并确认临时Task清理 | 生产数据库部署、备份、恢复、权限或持续运行可靠性 |

真实模型 Regression 样本及结果已暴露，统一标记为 `DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。完整命令、失败口径和历史结果只在 [Test Log](history/TEST-LOG.md) 维护。

## ADR-0013 Agent Loop口径

- 当前产品主链为 `Semantic Interpreter → Proposal Contract → Compiler → Runtime/Reducer → Agent Decision → Action Validator → Execution Router`。Agent只产生不可信Action；Validator不选择下一步；Runtime仍是唯一State writer。
- 没有任何确定性代码决定“无Candidate则再搜”或“A不可用则查B”；Harness以Scripted Agent分别证明第二次搜索策略和A→B availability trajectory。
- `SEARCH_RESTAURANTS`不重复Intent，`CHECK_AVAILABILITY`不重复日期、时段和人数；Execution Router从权威State绑定这些参数。Provider read失败、Router执行失败与模型决策失败使用不同Event和trajectory outcome。
- Agent只得到`restaurant-agent-context@6`，没有Authorization、Proposal terms、Execution Result、Evidence Artifact、Provider/Browser/URL细节或Reservation；它只含有界候选事实、来源尝试、库存/接待方式和合法动作。`DomainSearchStrategy.hasEnough`只表示Discovery检索预算已满足，不表示Availability、Loop终止或Booking授权。
- `BOOK_RESERVATION`只创建确定性Action Proposal并等待Authorization；Commit后的Verify与`OUTCOME_UNKNOWN`保护仍由确定性Runtime负责。`COMMIT_FAILED`或`BOOKING_ABSENT`完成其mandatory chain后，Orchestrator只在`SELECTION_REQUIRED`重新进入Agent Loop；旧proposal/authorization/attempt已清除，新proposal必须配新Authorization，Reducer拒绝proposalId不匹配的旧Authorization。
- `SELECTION_REQUIRED`投影为`RUNNING`，供Agent恢复；它不再残留`SELECT_CANDIDATE` pending-user action。timeout、step limit和rejection limit都写入明确终止状态和trajectory。
- 每个Agent decision step保存state版本/hash、capability、模型实际收到的脱敏`restaurant-agent-context@6`与`contextSchemaVersion`、action、verdict、route、observation、执行metadata、after-state链接、BOOK `proposalId`及Event/Command/Attempt/Evidence causal refs；不保存raw prompt或Chain-of-Thought。完整链为`Context → Action → Validation → Execution → Observation → State/Outcome`。
- 长期Execution Route仅为`STRUCTURED_ADAPTER`、未来`GENERIC_BROWSER`或未来`HUMAN_TAKEOVER`；Fixture/Mock/Live是运行模式或Provider metadata，Runtime/Policy checkpoint不是外部execution route。
- Migration `0006`保持原始evidence refs形态，`0007`追加因果引用与Proposal ID，`0008`追加Decision Context字段，`0009`追加read execution metadata；不会再改写Migration。`restaurant-state@7`和`@8`开发Task不能被当前Runtime解释，必须先备份后用双重开关的本机重置命令删除，绝不自动迁移或用于真实数据。
- 当前标识固定为`restaurant-semantic-prompt@10`、`restaurant-semantic-proposal@3`与`restaurant-state@10`。`CRITERION{text, polarity, strength}`是唯一开放集合，strength固定为`HARD` / `SOFT` / `UNSPECIFIED`；具体到访的`TARGET.goal=AVAILABILITY`决定slot展示标准。Agent Context为`@6`、Decision Prompt为`@12`、Action为`@3`、Trajectory为`@5`；不建taxonomy、Provider mapping或动态Tool Registry。
- ADR-0007的`DECIDE_RESTAURANT_NEXT` / `RESTAURANT_DECISION_MADE`以及耦合Offer的`ExecutableCandidate`可执行路径已删除；历史next-step标注只保留为语义评测审计输入，不再代表产品Runtime。
- `restaurant-semantic-prompt@4` Baseline的结果不得用于改动后重跑；Prompt `@7`的任何质量结论均需要另一份未见Holdout。当前Gold更新后的诊断只能标记为`EXPOSED_GOLD_ACCEPTANCE_DIAGNOSTIC`，Prompt `@7`与`@6`只比较`COMMON_UNCHANGED_TURNS`。
- 旧分类Criteria Contract下未运行的私有标注不兼容`restaurant-semantic-proposal@3`，不能迁入或报告为当前Holdout。当前空模板、私有入口、结构适配Preflight、确定性Scorer和一次性真实Runner已实现；runner在首个模型请求前写入Git忽略的`EXPOSED` artifact，并记录Dataset SHA、git SHA、scorer与prompt/schema hash。

## 明确未验证 / 未实现

- `restaurant-semantic-prompt@7`已完成本地、已暴露Fixture和当前canonical Gold诊断；需要另建未见 `CLEAN_HOLDOUT` 才能形成新的质量评价；
- H001 已有一次完整 Live Read-only成功，Web页面也已有一次独立真实来源交互，但二者均为时间敏感的单次观察；Web页面该次以`TIMEOUT / NEEDS_INPUT`结束，仍未证明qualified `PRESENT_RESULTS`、任意未来运行、门店或日期可用，且真实移动设备兼容性仍未验证；
- eval-only Tabelog人工验证恢复路径已通过Fixture；一次headed persistent LOCAL_CHROMIUM H001实验已在Semantic Interpreter `MODEL_FAILURE`处停止，未建立浏览器/页面，故尚未证明真实站点同一Session解除challenge后可继续读取；
- 真实 Authorization、Booking、取消、支付或 Controlled Live-write；
- 真实浏览器兼容性、真实移动设备、生产身份与生产 PostgreSQL 部署；
- `NEED_REINTERPRETATION` 的自动重解释。当前只记录冲突并询问用户或安全降级。
- semantic conflict gating remains intentionally unchanged pending real Agent/E2E observation.

## 2026-09-14 当前 H001–H005 Web Live 观察

本轮每个输入只运行一次普通`LIVE_READ` Web Case；没有使用Fixture、Hybrid runner、预置坐标、预约、第三方登录或任何外部写入。H001与H005分别完成真实Google发现和受控浏览器来源读取后进入`NEEDS_INPUT`，没有展示未核实slot；H004在真实Google不能把命名地点`Higashi-Ginza`解析为坐标时以`NO_PROGRESS`失败，未把检索偏置冒充附近证据。H002与H003在Semantic Interpreter真实模型调用处返回`MODEL_FAILURE`，尚未进入来源读取；这不是用户输入不清楚或来源无结果。

本轮Live暴露并已在当前未提交代码中补齐一个Web生命周期缺口：此前Semantic Interpreter失败会留下`UNDERSTANDING`任务而没有执行artifact。现在以显式`SEMANTIC_INTERPRETATION_FAILED`事件进入`FAILED`、产生用户可见失败和既有独立Evaluator sidecar；该修复已在完整离线内部组合验证，尚未以额外Live调用重跑。五个本轮Live均未获得qualified `PRESENT_RESULTS`，也不应据此宣称H001–H005验收通过。

## 2026-09-14 Hybrid 位置与真实组合离线接线

Hybrid Runner已改为复用可测试的实际组合入口：`Semantic Interpreter → Compiler → Runtime/Reducer → Agent Context → Validator → Router → Google Grounding`。对明确`NEAR_USER`的冻结评估，Runner在语义编译后、Agent决策前记录受限的`EVALUATION_LOCATION_BOUND`权威事件；它只接受`nearby`请求、绝不覆盖已有位置，并在`intentDraft`保留`source: EVALUATION`，不冒充设备定位或产品默认地点。没有位置时仍在来源调用前请求输入。

离线集成使用独立的合成模型传输与Google HTTP样本，实际穿过三个Place Details读取（超过旧3次总上限）并产出`PRESENT_RESULTS`及独立诊断；新100次Google调试上限的累计、停止前拒绝及跨run隔离另有Adapter回归。它证明内部接线和脱敏样本契约，**不证明**真实模型理解、当前Google数据或Web Live。H001原始输入的`RECOMMENDATION`/冻结`AVAILABILITY`目标口径冲突仍待产品与评估契约确认，未改Prompt、原始输入或Gold。

## 下一道门槛

```text
Agent Loop architecture freeze
↓
Browser compatibility probe
↓
Google Discovery smoke
↓
single candidate Google → Tabelog availability probe
↓
materialized h001 Hybrid diagnostic（已通过）
↓
Web Live qualified-result / failure taxonomy cross-scenario verification
↓
h002–h005 diagnostic
```

`restaurant-semantic-prompt@7`的新`CLEAN_HOLDOUT`保留为独立的parser/semantic质量工作，不能以已暴露数据冒充Baseline；它不再是启动Hybrid E2E preparation的blocking dependency。Hybrid E2E仍不触及真实Booking；Live runner强制`PRAXIS_ALLOW_LIVE_RESTAURANT_READ=1`、`PRAXIS_ALLOW_BROWSER_RUN=1`与真实模型付费门禁，且没有Authorization、提交、支付、取消或个人信息输入路径。现有E2E rubric仍是`draft / not integrated`，runner明确记录该Scorer缺口，未将其伪装为已评分结果。

## 按问题阅读

| 要回答的问题 | 先读 |
|---|---|
| 现在真正有什么、还缺什么？ | 本页 |
| 产品承诺与用户流程是什么？ | [MVP PRD](product/MVP-PRD.md)、[User Flows](product/USER-FLOWS.md) |
| 状态、模型、执行如何分层？ | [Architecture Overview](architecture/OVERVIEW.md)、[ADR Index](decisions/README.md) |
| Restaurant 的语义、状态与决策细节？ | [Restaurant Domain](domains/RESTAURANT-BOOKING.md)、[Interfaces](architecture/INTERFACES-AND-SCHEMAS.md) |
| 如何测试或跑 Eval？ | [Test Skill](skills/test/SKILL.md)、[Eval Skill](skills/eval/SKILL.md)、[Harness Design](harness/HARNESS-DESIGN.md) |
| 外部能力是否真实可用？ | [Capability Matrix](integrations/CAPABILITY-MATRIX.md) |
| 历史上为什么这么改、跑过什么？ | [Dev Log](history/DEVLOG.md)、[Test Log](history/TEST-LOG.md) |

## 测试维护

2026-09-05测试Review合并H02/H03/H04相同初始化流程，保留全部独立断言和场景ID；移除Web测试对固定CSS断点的源码匹配。默认离线基线162/162通过，不以数量下降宣称覆盖提升。测试增删与退役规则统一见[Test Skill](skills/test/SKILL.md#测试维护与退役)。

## 2026-09-06全量测试审查收尾

已全文审查35个测试文件的173项声明（当时默认162、冻结8、浏览器3）及独立PostgreSQL Live Smoke。默认当前159/159、冻结8/8、真实浏览器本地Fixture 3/3通过；typecheck、arch:check、build通过。删除或合并3项确定重复，并在既有测试补准独立安全断言；未新增独立测试。逐项结论见[全量审查快照](history/TEST-SUITE-REVIEW-2026-09-05.md)。Live Smoke清理失败不再吞掉或提前报告pass；以隔离VM假数据库进行3种故障注入通过，未运行真实PostgreSQL。未调用Live来源、付费模型或私有Holdout。


## 2026-09-14 Hybrid Live Runner 最新单次诊断

本次独立于前述Web运行：H001–H005各执行一次真实只读Runner，五例Semantic均PROPOSED，无MODEL_FAILURE，但全部未PRESENT_RESULTS。H001走RECOMMENDATION事实调查，与冻结AVAILABILITY期望冲突；H002命名地点解析失败；H003漏AREA、H004漏DATE且评估坐标未进入权威State、H005漏DATE并采用UTC时刻，后三例均在补问处停止。没有案例实际执行CHECK_AVAILABILITY，不能据此评价TableCheck/Tabelog实时空位能力。下一步先对齐目标口径、修复Runner位置接线及语义时间/字段回归，详见同日TEST-LOG。历史H001/Web成功仍仅代表当时版本与来源条件，本次失败不抹除历史事实。


## 2026-09-14 确定性时间改动后最新Hybrid复验

最新未提交工作区H001–H005各一次真实Hybrid均被DeepSeek HTTP400拒绝，原因为新DATE/TIME_WINDOW Schema中的raw属性未列入required，与strict传输约束冲突。此次无模型生成、Google或Browser来源调用，不能验证下游修复。执行artifact与独立evaluation完整保存，未重跑；具体位置与离线复现见同日TEST-LOG。


## 2026-09-14 strict Schema修复后最新Hybrid Live诊断

本批取代上条HTTP400复验作为最新观察（历史结果保留）：H001–H005各一次真实只读Runner，五例Semantic均PROPOSED；Schema修复、100次Google调试额度、NEAR_USER评估位置接线均已实际生效。H003/H004虽进入PRESENT_RESULTS，仍不合格：H003正确周五日期被相对时间覆盖为今天；H004漏日期后跳过营业时间门槛。H001已取得TableCheck HIGH、omakase与19:00/2人可用slot，但较旧factChecks引用集合过滤了新omakase事实，随后无新增候选重复搜索并STEP_LIMIT；该过滤已用原artifact内存副本复现。H002命名地点解析仍失败。H005正确物化东京“现在”，调查26家均UNKNOWN，七次重复事实动作被拒绝，最终STEP_LIMIT，不能声称来源全部无位。

本批没有qualified验收通过。Eval仍有口径缺口：H005动态参考时刻未同步到冻结time期望；PRESENT_RESULTS被先标QUALIFIED_RESULT、STEP_LIMIT被标NO_CONFIRMABLE_RESULT，均需结合独立证据与执行归因审查，不可直接作alpha通过标签。完整artifact索引、资源、因果探针见[本批报告](../.eval-artifacts/hybrid-schema-fixed-2026-09-14/1789373476/REPORT.md)（本地忽略目录）。本轮仅诊断与记录，未修改业务实现，未运行Web Live或外部写入，未提交/推送。

## 2026-09-14 当前跨案例Hybrid Read-only状态

本轮H001–H005已各执行一次真实Hybrid，只读且未重跑。H004完成有来源支持的事实推荐，但SOFT条件改写仍需人工语义审查，不能称自动qualified；H001/H002/H003/H005均因模型动作或候选扩张在真实调查后未达成结果，不能归类为来源无位。新代码已把当前事实/availability证据选择、东京相对时间、命名地点观察、availability动作边界、零新增搜索停止和Eval分类修正为通用规则，并由完整离线矩阵和本地Chromium Fixture验证。

剩余首个产品阻断是：候选池仍可在每次带来少量新候选时持续扩张，直到Agent步数上限，而没有一个可核验的“已调查充分但无可确认结果”结束动作；本轮不会用增大预算或站点fallback掩盖。由于授权不允许自动重跑，H001–H003早于最后修复的真实结果保留为历史诊断，需新增明确Live授权才可验证最终代码。未提交、未推送、未运行普通Web Live或外部写操作。


## 2026-09-16 浏览器组件可行性诊断

复用当前 DeepSeek + Local Chromium + BrowserTaskExecutor，从已知商户公开页各执行一次：TableCheck 141 在 19.2 秒、2 次模型调用后完成目标日期选择，页面显示 2 人与 19:00 时段入口；未读取后续套餐或生成 Offer。Tabelog 八芳在 81.9 秒、8 次模型调用后因持续动作字段解码错误达到预算上限，没有实际执行模型动作。两者均不是完整产品验收；无 Google、Semantic、Runtime 或独立身份接纳链，不替代此前 H001–H005。发现的观察范围与错误反馈缺口尚未修复，未引入第三方框架。详见[诊断报告](brainstorming/2026-09-16-browser-loop-feasibility-validation.md)。


## 2026-09-16 Stagehand isolated component probe

Pinned Stagehand 4.1.0 passed a real local Chromium fixture (calendar cell, custom option, asynchronous result) and one DeepSeek-backed observe/validated-click fixture. TableCheck and Tabelog each produced a live snapshot and action proposal, but neither proposal passed the probe's exact-date guard; no live click or business result was established. Total: 3 model calls / 23,001 tokens. Production dependencies, executor and permissions are unchanged. Full workflow and deployment remain unverified. See [probe report](brainstorming/2026-09-16-stagehand-small-probe.md).


## 2026-09-16 Stagehand workflow probe follow-up

Two isolated live batches used 17 DeepSeek calls / 186,337 tokens across TableCheck 141 and Tabelog Happo/Sendou. None completed the model-driven public-options workflow. A separate zero-model sequential control opened the TableCheck form with Playwright after Stagehand click produced no observed navigation; destination date/party were read, selected time and availability remain unverified. Local asynchronous/new-tab fixture passed. This supports investigating observation plus existing Playwright execution, not adopting a replacement or claiming product capability. See [workflow report](brainstorming/2026-09-16-stagehand-workflow-validation.md).


## 2026-09-16 Browser observation/action/memory diagnostic

Isolated Stagehand snapshot/observe + Playwright probe: 20 DeepSeek calls / 228,988 tokens. Scripted live Filters check/uncheck, modal scroll, apply/reset and alternative Happo Sep 20 19:15 party 4 options were verified. Model-selected 141 reached its public form; Tabelog model workflows remained incomplete. Notes-only comparison retained venue rules and refused stale availability, but independent review found unsupported inferences and confusion between options and selected values. Map marker click failed; geographic changes unverified. These are development component results, not production capability or a baseline. Recommendation: validate richer observation, explicit next-action planning, execution verification and cited context in the existing loop before selecting a framework. [Report](brainstorming/2026-09-16-browser-observation-action-memory-validation.md).


## 2026-09-16 Browser Agent execution handoff plan

User endorsed improving the existing restaurant read-only chain before booking submission. The [Terra execution and review plan](BROWSER-AGENT-RESTAURANT-IMPLEMENTATION-PLAN.md) defines P0–P4, observation/planning/execution/evidence responsibilities, Stagehand adoption criteria, B1–B14 acceptance and independent review artifacts. Planning only: no product implementation or new Live run in this handoff turn; proposed future budgets are not additional paid-run authorization.


## 2026-09-16 Browser Terra independent review — changes requested

Independent review reproduced four synthetic real-Chromium defects in the browser increment: consent checkbox accepted without query-effect validation, stale native slider value, missing ARIA slider range/value, and fixed-position modal background targets not blocked. Typecheck and 15 decision/executor tests pass but do not cover these failures. P0–P4 remains incomplete; no new Live or paid calls. See [review and repair requirements](history/BROWSER-AGENT-TERRA-REVIEW-2026-09-16.md).


## 2026-09-16 Browser review fixes

R1–R4 repaired in the working tree: source-owned query-control permission defaults to deny, live native/ARIA values, and visible active-dialog filtering. Typecheck, arch check, build and full tests 344/344 passed. Synthetic Chromium regression is recorded in TEST-LOG. Production source permission wiring and complete P1/P2 acceptance remain pending; no new Live or paid run. See [follow-up](history/BROWSER-AGENT-TERRA-REVIEW-2026-09-16.md).

## 2026-09-16 Browser P1/P2 offline evidence completion

TableCheck and Tabelog now wire the source-owned query-control permission for their public GET search paths only; unknown, consent, account, payment and reservation controls remain denied. The shared Executor’s local Chromium Fixture covers checked/unchecked filter state, range/region feedback, Update/reopen/Reset and an observed public new-tab transition in one session. This is synthetic local-browser evidence, not a statement that either current source page is compatible.

An explicit user-authorized alternative time range is kept separately from the original requested time. The Router queries only that bounded range and source Grounding labels an out-of-original-range slot as an alternative; date, party and other conditions remain authoritative and unchanged. Candidate-bound Google-listed website facts now admit separately labelled public course price/tax, private-room minimum, cancellation and no-show data after HIGH identity; a bare amount or missing field stays unknown. The local Web projection keeps terms within the candidate’s cited evidence. Offline composition and localhost Web tests pass; real-model/source compatibility, B13 new-merchant evidence, B14 map semantics, original-researcher re-review and any further Live remain pending. See [P0–P4 delivery record](history/BROWSER-AGENT-RESTAURANT-P0-P4-DELIVERY-2026-09-16.md).


## 2026-09-16 Browser P1/P2 second independent review — changes requested

The added wiring is present, but P1/P2 acceptance remains blocked by four independently reproduced defects: old alternative-time permission survives an exact-time correction; public GET search policy permits an unclassified Japanese consent checkbox; the commercial parser promotes a deposit to course price; and the fact reader stops before revealing requested cancellation terms when type/hours already exist. Typecheck and 24 targeted existing tests pass, but do not cover these counterexamples. No new Live/paid calls. See [R5–R8 review](history/BROWSER-AGENT-TERRA-REVIEW-2026-09-16.md).


## 2026-09-16 Browser second review fixes - current status

R5-R8 counterexamples repaired: time replacement invalidates old alternative permission, ambiguous commercial amounts stay unknown, requested terms participate in completion and missing facts remain UNKNOWN. The unsafe GET policy was removed: production checkbox/range permission remains denied pending positive source contracts. Typecheck, arch check, build, full tests 353/353 and Chromium 13/13 PASS. No new paid/Live run. Full browser acceptance remains incomplete. See [repair scope](history/BROWSER-AGENT-TERRA-REVIEW-2026-09-16.md).

## 2026-09-16 Browser P1/P2 current offline addendum — original-researcher review pending

The current browser slice adds an accessibility-facing slider display value (`aria-valuetext`) while retaining the separation between a control's numeric position and an applied monetary filter. The production Executor's local Chromium fixture now proves two distinct budget endpoints, one permitted lower-bound step, target modal scrolling, and a visible filter application. Fixture permission is explicit and local; production checkbox/range actions remain default-deny because the revoked broad GET policy was not restored.

Restaurant Agent Context is now `@7`: it projects only current candidate-bound commercial notes with their matching provider, and excludes URLs, evidence/source-entity IDs, raw page data and superseded same-source facts. Agent prompt@13 treats missing commercial notes as UNKNOWN. A Reducer regression proves a user-requested website refresh replaces the current same-source price/no-show record with only the newly observed course-price/cancellation facts, without inferring omitted fields. `typecheck`, targeted 28/28, local Chromium 13/13, architecture check, build and full offline `npm test` 356/356 pass. The first full run surfaced two stale v6 persistence/harness assertions; they were corrected with the Context schema migration and the second run passed.

This is offline-only and not full P1/P2 acceptance: positive contracts for real source query controls, real complex-page compatibility, a separately authorized bounded model/source Live read, new-merchant B13 evidence, and map semantics in B14 remain pending. The current diff and exact review questions are handed to the original researcher in the [P0–P4 delivery addendum](history/BROWSER-AGENT-RESTAURANT-P0-P4-DELIVERY-2026-09-16.md); no independent Review pass or Live authorization is claimed.


## 2026-09-16 Browser third independent review

The offline addendum's 28 targeted tests, 13 local Chromium tests and typecheck independently pass. P1/P2 remain partial: R9 shows the Web commercial card still selects superseded facts even though Agent Context excludes them. Positive source query contracts and bounded model/source Live remain pending. Map semantics stay P5 and are not a new blocker. See [third review](history/BROWSER-AGENT-TERRA-REVIEW-2026-09-16.md).

## 2026-09-16 Browser 直接修复与有界 Live — 当前结论

R9 Web 当前条款及独立来源链接已修；TableCheck 英文搜索 Budget/Cuisine 正向结构契约已接线并真实验证，其他 query controls 默认拒绝。H001 正式 Hybrid 得到 1 个 offer，独立评估通过。Tabelog 模型提前结束但未确认日期/人数，暴露了日期元素漏观察和数字按钮语义不足；Executor 已将未经 completion 核验的模型停止改为 MODEL_HANDOFF。完整 P0–P4 **仍未完成**，首个门槛是 Tabelog 观察归一化及重验，随后两店比较/修订、新商户、真实 Web Live。地图仍 P5。本批 Live 达到预设 40 分钟上限后停止，17 model calls / 5 Google；[事实、产物与未完成项](history/BROWSER-AGENT-VALIDATION-2026-09-16.md)。

## 2026-09-16 Browser follow-up - latest verified status

Tabelog source-owned date/guest observation and readiness are connected to the production Adapter and both Playwright sessions. Real model: 2 calls select 2026-09-20 / 4 guests; inventory still unverified. Ordinary external links no longer imply an external booking provider. TableCheck disabled-date handling and scoped empty-result parsing repaired: Sushi Inase Live returns UNAVAILABLE / NO_MATCHING_SLOT for 2026-09-16 / 2 guests / 19:00 in about 9 seconds, zero model calls. Shibuya Sushi Jinnan's prior TableCheck search did not identify the target; absence from the platform is not established. Final offline 361/361, Chromium 18/18, typecheck/architecture/build pass. Batch used 5 model calls / 39116 tokens / zero Google, no booking submission. Full P0-P4 remains incomplete. [Follow-up evidence](history/BROWSER-AGENT-VALIDATION-2026-09-16.md#follow-up-tabelog-controls-and-the-two-tablecheck-candidates).

## 2026-09-17 Regression-defense generalization

H001--H005 now share independently declared `SYNTHETIC_CONTROL` source environments across the existing real composition's scripted code-contract test and its bounded real-model runner. Independent composition/evaluator mutations cover request fidelity, batch retention, discovery truncation, evidence lineage, UNKNOWN/no-result, expiry, execution records and premature end. The local code-contract gate passes all five; the default suite passes 392/392 when loopback is permitted. One-shot real-model results are mixed (H002/H004 red, H003 no-result, H005 presented; H001 runner setup failure) and one-shot Live H001/H003/H005 all cancelled under their caps on a dirty worktree, so none is a clean product acceptance. [Coverage and limits](history/REGRESSION-TEST-DEFENSE-REPORT-2026-09-17.md).

The follow-up `new-vegetarian-lunch` controlled migration sample varies cuisine, exclusion, lunch time, party size and named area rather than merely changing an outlet name. It uses the same source factory and Hybrid composition with no copied Runner, completes a qualified controlled path, and raises the authorized default suite result to 394/394. It is exposed controlled evidence, not a Live/model run or Holdout.

The user explicitly authorized one H001 corrective real-model fixed-source rerun after the Runner coordinate-selection regression. It reached `PRESENT_RESULTS`; independent evaluator@15 marked all six dimensions `SATISFIED` and the qualified result YES (5 model calls, 3 fixed Google requests, 10.7s). This closes fixed-source H001 coverage only; its historical Live run remains cancelled and does not establish current website behavior.

## 2026-09-17 Fixed-source test-mechanism remediation — offline current status

The fixed-source diagnostic now separates execution, acceptance and user-goal
completion, and accepts only independently evaluated predeclared expectations.
Its registered-case loader supports H001--H005 and `new-vegetarian-lunch`
without a Runner case whitelist; both the CLI and deterministic controls reuse
the same production composition execution chain. Source samples are now
candidate/page/request scoped, with an explicit fixture-coverage diagnostic for
unconfigured legal reads. Business time advances from the reference time while
the real outer deadline stays independent.

Current offline evidence: focused 62/62, authorized local `npm test` 404/404,
and local Chromium fixture 17/17 pass; sandbox loopback failure is recorded as
environment-only. No paid model or Live run was made for this slice. This closes
the A–D testing mechanism gaps only; real-model interpretation, free-text
quality, current source compatibility/inventory, anti-bot behavior and search
exhaustiveness remain unproven. Full evidence is in
[the regression-defense report](history/REGRESSION-TEST-DEFENSE-REPORT-2026-09-17.md).

Evaluator/rubric@16 additionally reads the saved execution record for a
controlled cancellation or model-budget stop. The actual stop artifact, rather
than a hand-filled evaluation, can now pass its matching acceptance contract
while reporting `userGoalCompletion: NOT_COMPLETE`; a mismatched stop reason
fails. This remains offline fixed-transport evidence, not a real-model cost or
Live outcome.
