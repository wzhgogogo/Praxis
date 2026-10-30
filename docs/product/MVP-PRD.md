# Tokyo Restaurant Agent MVP PRD

- Status: Accepted
- Document revision: 0.25
- Last updated: 2026-10-30
- Source of truth for: 第一版产品范围、用户承诺和验收标准
- Related ADRs: [ADR-0004](../decisions/0004-single-candidate-authorization.md), [ADR-0006](../decisions/0006-web-first-agent-workspace.md), [ADR-0049](../decisions/0049-source-bound-b1-booking-handoff.md), [ADR-0050](../decisions/0050-two-line-handoff-presentation.md)
- Related documents: [User Flows](USER-FLOWS.md), [Visual Direction](VISUAL-DIRECTION.md), [Restaurant Domain](../domains/RESTAURANT-BOOKING.md), [Data, Context & Security](../architecture/DATA-CONTEXT-SECURITY.md)

## 产品定义

Praxis第一版是一个面向在日外国人的Responsive English Web Agent，同时支持Desktop与Mobile浏览器。用户用自然语言描述东京餐厅需求，Praxis建立可跨会话恢复的Case，提供有来源支持的推荐或当前空位，帮助用户决定并准备好预约；用户自己在来源网站完成登录、资料填写、条款确认和最终提交。

第一版的承诺是把选店、可信信息和来源交接接起来。按[ADR-0049](../decisions/0049-source-bound-b1-booking-handoff.md)，选定、准备交接、打开来源链接和返回自报均不构成Praxis代订、外部写授权或已验证预约。通用Policy、Authorization、幂等和Outcome边界继续有效，历史ADR不在本次文档同步中改写。

## 目标用户

- 在日本的外国人，包括游客、留学生及在日工作生活的人；餐厅范围仍为东京。
- 使用英文Web界面，可以在Desktop或Mobile浏览器开始和继续同一Case。
- 希望减少选店、核对空位、识别方案与条款、进入来源网站的操作负担。
- 平台账户、日本手机号、语言或支付条件只在影响所选渠道时说明，不凭国籍、居民身份或界面语言推断资格。
- 需要的真实联系方式、登录信息和信用卡由用户在来源网站自行提供，Praxis不接收或代填。

界面语言由用户于2026-10-29确定为英文；原始店名和来源引文保留原文，不因此成为多语言界面承诺。

本阶段验证 Agent 能力和用户价值，不据此宣称某一用户细分已达到 PMF。

## 只读目标与来源交接

按[ADR-0044](../decisions/0044-recommendation-availability-boundary.md)，明确订位/空位措辞（A）或具体钟点/数字钟点时段、已知或可推断人数的坐下正餐（B）为AVAILABILITY。A即使无日期/时间仍为查位目标，可先找店，按ADR-0026在查位前补问缺失时间；补充时间沿用原目标。既无到访日期/时间也无订位措辞的新请求为RECOMMENDATION，其余由语义模型判断，不凭人数或店型硬分类。推荐须满足地点、HARD条件和适用营业时间；参数充分时可有界补查空位，但不将未知、无预约入口或访问失败解释为无位或walk-in。当前请求下明确无位会排除该候选。空位目标必须取得对应门店、日期、人数和时段的当前slot；缺人数时补问，缺精确时间可先发现候选，不能降为普通推荐。接待方式与库存独立：明确walk-in不替代可订slot，缺少预约入口不产生walk-in结论。

以下流程描述明确空位/预约目标；普通推荐可在有依据的结果展示处完成。渠道与方案比较属于产品设计，不是B1前置条件，也不在前端第一段实现范围内。当前只读开发验收映射见[H001–H005契约](../../src/eval/restaurant/agent-loop/cases/README.md)。

```text
自然语言需求
→ 建立可恢复的Conversation与Restaurant Case
→ 补齐阻塞信息
→ 跨来源搜索与实体合并
→ 检查指定时间、人数的真实空位
→ 有界调查后返回首批目标为 3 家不同、证据充分的候选
→ 用户明确选定一家
→ 直接去来源网站，或先比较渠道与方案后出发
→ 服务端按ADR-0049核对来源、当前请求、证据和交接链接
→ 用户自行在来源网站确认并提交
→ 返回后可选自报一次结果
→ 在同一安排工作区继续查看候选、准备信息和自报记录
```

按[ADR-0030](../decisions/0030-restaurant-category-negative-eligibility.md)，`no fast food`等餐厅类别排除禁止已知违规；有来源类别事实但判断未知的边界类型可以保留，不能宣称“已确认不是快餐”。连锁、便宜或出餐快本身不等于快餐。正向HARD仍须证据支持，过敏、污染、安全及无障碍等排除不适用此放宽。用户明确追加“不要拉面／回转寿司”通过普通需求更新收紧当前Task，不建立长期偏好。

合法调查耗尽后的1–2家完全合格结果可以完成未指定数量的请求，同时明确默认三家目标未满足；通常仍有合法读取时继续调查。默认首批的长时只读任务进入预留交付窗口时，若已有1–2家当前合格结果，先展示并记录未达到三家，再让用户续接；明确指定数量、证据过期或取消不使用该例外。用户明确指定数量时，数量不足不能算完整完成。

## P0 功能

1. 提取日期、时间窗口、人数、区域、菜系、预算和用户明确提出的特殊要求；特殊要求不阻塞普通初步推荐，但一经声明的安全关键要求不得静默放宽。
2. 只追问会阻塞搜索或预约的信息。
3. 并行搜索多个来源，合并同店与不同分店。
4. 空位候选保留来源和查询时间；价格、条款、信用卡及手续费只展示有当前同店、同渠道证据支持的内容。过敏等安全关键要求须展示来源和确认要求，不能由交接代替餐厅接受。
5. 开放式找店的首批目标是3家不同、证据充分的候选；用户明确的数量取代默认目标，指定门店不机械扩展。空位目标中每家仍须有已验证对应slot；进入预约时还须有可执行预约路径。普通推荐按事实要求展示，不声称已有座位；不足目标时返回实际数量和受限原因，不以安全停止冒充用户目标完成。
6. 结果批次是可恢复的只读选店会话：用户可查看、加入/移除备选、要求同条件另一批或提交明确反馈。已有合格未展示候选优先返回；池内不足才由现有有界调查续接，且不自动预约或形成长期偏好。
7. 用户通过`Choose this`明确选定一家；查看、备选和指代上下文不等于选定，选定也不授权任何外部提交或自动换店。
8. 有合格来源交接时即可直接出发，不必等待渠道比较；出发前复用ADR-0049的服务端二次校验，条件变化或证据失效时旧交接失效，不拼造链接。
9. 无API网站的受控读取继续建设；来源网站的登录、验证码、银行卡、支付和最终预约提交由用户独立完成，第一版不提供远程代订或接管后代提交。
10. 返回后至多一次非阻断自报，只记`USER_REPORTED`，不转为`BOOKED_VERIFIED`；不回答也不追问。
11. 用户修改需求或停止当前查找后，旧请求的迟到进度、卡片和交接不得重新出现；查找中提供`Stop`并使用服务端已有取消路径。
12. 用户可以关闭页面后恢复同一Case；候选、备选按Case隔离，恢复原来的工作区视图和当前候选。
13. 前端有首页、`My plans`抽屉（桌面常驻侧栏）和安排工作区三个位置；对话、候选、详情、备选、比较及预约准备在同一工作区内切换。
14. 首家合格候选就绪后自动显示，其余逐家出现；只展示流程实际知道的进度数值，不编造百分比。前端第一段已复核并快进合main4cbc521b，本地Fixture及视觉证据见[切片计划](../WEB-WORKSPACE-SLICE1-PLAN.md)；不代表Live或Pilot验收。
15. SSE按ID局部更新，保留当前卡片、未发送输入和展开状态；消息携带服务端校验后的当前查看上下文，用于理解`this one`等指代。
16. Conversation、解释文本、模型Working Plan和前端查看状态不作为权威预约状态；事实和业务动作仍从服务端Domain/Application及Runtime投影。
17. 前端第2段由视图确定唯一输入框的路由：详情问当前店，候选/对话调整需求；已问记录按店展示。可点条件只预填需求输入；候选变化及不匹配备选原因来自服务端投影，未知不编；新增和移除均0时不显示变化行。空结果只在服务端证明仍有未查工作时提供Find more；已失败/不合格对象不再调查。全部来源失败的Try again走显式刷新，不能伪装为续查。工作分支实现与短状态验收见[第2段计划](../WEB-WORKSPACE-SLICE2-PLAN.md)，不代表Live或Pilot。

预算作为候选条件展示：明确每人上限属于 HARD，须有适用餐期的当前价格依据才可交付；超出或价格未知的门店不能作为合格结果。around/ideally 等 SOFT 预算保留其强度和比较含义，核对不满足或未核对时透明展示。条件行提供真实价格原文及来源，不把已列出的课程价格宣称为该课程已有空位。

## 选择与交接边界

`Choose this`仅表示明确选店；书签仅表示留作备选。来源出发按钮由用户主动点击，只打开服务端核验过的来源入口，不创建预约Authorization或提交Attempt。参数只可描述为`filled in`，不能从URL推断来源网站实际选中了条件、方案或座位。

当前请求、门店、渠道、Offer或证据新鲜度不再匹配时，旧交接不得显示或沿用。合法同店来源入口与带参交接的可用范围均沿用ADR-0049；“直接去来源网站”的路径不得被渠道比较完成与否阻断，也不得绕过来源或证据校验。

通用一次性授权、过敏披露同意、提交幂等和结果不明禁止重试等规则仍约束任何未来外部写入路径；这些路径不属于第一版交接承诺。

## 结果定义

第一版区分有依据的推荐、当前空位、准备好的来源交接与可选的`USER_REPORTED`反馈。没有证据或读取受限应如实显示未知及本轮范围；未找到当前合格结果不等于附近无店或整窗无位。查找停止只终止本轮读取，不表示取消任何现实预约。

`BOOKED_VERIFIED`及`PENDING_PROVIDER_CONFIRMATION`、`OUTCOME_UNKNOWN`、`CANCELLED_VERIFIED`等预约写入Outcome在第一版**不适用**，本次不删除或修改通用State/Schema。未来如启用写入，`BOOKED_VERIFIED`仍须独立强回执，`OUTCOME_UNKNOWN`仍禁止盲目重试；用户回答Yes不满足该证据标准。

## 关键边界

- 相对时间按 `Asia/Tokyo` 解析。
- 只有吧台、吸烟区、强制套餐或不同时间可用时，不得当作原条件完全匹配。
- 过敏、儿童、无障碍等要求未获餐厅明确接受时，不得宣称已接受、已披露或已提交；候选事实与确认要求仍以[Restaurant Booking Domain的详细规则](../domains/RESTAURANT-BOOKING.md#过敏与特殊要求)为准。
- 日本手机号、片假名、本地地址或支付方式为必填但用户不具备时，不伪造信息。
- 交接后来源网站的实际选中状态和提交结果对Praxis仍未知，不自动读取该外部会话或重试预约。
- 取消条款的日英页面冲突按ADR-0049并列展示原文和各自英文转述，不由模型或代码判断哪个更严格。
- 不支持的来源如实说明限制；不扩大Guard权限、不以接管或未经核验的链接绕过边界。

## Non-goals

- 东京以外城市和非餐厅 Local 服务。
- 原生移动 App 或控制原生 App。
- Slack、微信、Discord等多消息渠道和通用Agent App Store。
- 电话预约、候补排队和线下登记。
- 完整日语产品体验。
- 代订、预约提交、付款、取消和“先订新单再取消旧单”。
- 平台登录接管、自动保存或输入密码、验证码、银行卡和其他个人资料。
- 对任意餐厅官网承诺自动化，或把来源交接当作提交/成功保证。
- 跨任务 Memory、个性化排序和 Standing Authorization。

## Pilot 指标

- **第一版不适用：**“支持路径端到端验证预约成功率 ≥ 70%”；交接、自报与已验证预约分别统计，不能以点击或Yes代替此历史指标。
- 原“具有预约意图的任务完成率 ≥ 50%”和“已验证预约的路线生成率 ≥ 95%”不作为第一版交接验收门槛；后续Pilot定义交接任务完成口径后再单列目标，不能沿用旧分母声称达标。
- 错误宣称已选中/预约成功、Praxis未经授权外写和重复提交均为0；第一版不启用现实预约写入。
- 第一段的工作区、取消、恢复、指代及B1交接以重复浏览器链路和视觉复核验收；设计已定不表示已经实现或通过Pilot。
- **第一版不适用：**除最终确认外，单任务 Human Takeover 中位数不超过 1 次。
- 支持流程中刷新、重连和跨设备恢复后的Case状态一致率为100%，跨用户Case访问为0。


## 2026-10-09 即时查位窗口

用户已决定“现在/right now”查询原参考时刻起30分钟内的最早可订时段，展示具体时刻。窗口结束后停止来源读取，正常结束或询问是否查询最近可订时间；须由用户批准新窗口，不能自动顺延。身份、HARD、人数、请求与证据新鲜度保持原规则。当前单日期合同跨东京午夜无法表达完整窗口，须明确时间澄清，不缩短窗口。C6a实现与复核限制见[Accepted ADR-0039](../decisions/0039-immediate-thirty-minute-window.md)；用户于2026-10-09复核后批准Gold@7为默认，@6原文件保留不改。

## 2026-10-22 时间窗与人数的未知范围

公开页面只证实一个时刻无位时，在原时间窗内按页面实际给出的合法时刻有界续查，并保留已查点和未查范围；不能将局部无位说明成整窗无位。请求日期已确认而精确人数不可选时，如实保留该店人数未核验的 UNKNOWN 并换候选，不强选或改人数。受限工作流不反复打开，也不把受限当作无位。此规则的本轮证据为离线测试与保存产物回放，完整实时交付另验。

## Source-resolved search area

For a named nearby request, show the actual source-adopted geographic label and keep the original user location wording unchanged. The Web conversation and candidate area heading read the same source-bound continuation center that is retained in exported read artifacts. Geographic type, coordinate context and ambiguity bounds remain enforced; a different spelling alone does not fail a location. Source access or an empty lookup is not proof of a replacement location.

## Faithful condition relations

Semantic interpretation preserves comparison direction and strictness independently of HARD/SOFT strength. A tradeable numeric ceiling remains a SOFT ceiling; it is not a centered approximation or an invented hard cap. Conditions must follow the expressed user requirement: a negative exclusion cannot become an unstated positive prerequisite, and a requested capability cannot gain associated amenities or implementation details. No keyword-to-condition mapping is added. Semantic promptv22, proposal schema3; compiler/state/qualification and evaluator versions remain unchanged.

## 只读调查的时间收尾（ADR0045）

按ADR0045，在原整单时限内预留20秒收尾；读取按已完成耗时中位数判断能否开始。已有完整合格结果可给短批；否则如实说明本轮未核实符合全部条件的门店及未查缺口。未完成读取与未读来源不等于附近无店或无位，部分结果仍需通过全部原资格与新鲜度核对。

## G1 displayed-restaurant follow-up (offline implementation)

After results are displayed, ask through the question field on one restaurant card. The authenticated server binds the displayed outlet, original user question, allowed source reader and current read run; code selects the sole legal `ANSWER_PAGE_QUESTION` without an Agent model call, still through Validator, Router and Reducer. The normal conversation composer continues to edit the restaurant request.

The answer panel shows one short answer, verbatim source quotations in their original language, source URLs and read times. `NOT_STATED` shows “Not stated on the page” and the pages actually checked. Sensitive categories or model-reported source contradictions add “Please confirm with the restaurant”; unverified answers are discarded. This does not establish HARD satisfaction, reception policy or availability.

Current-run identity-bound pages are reused first. Each question now has an independent 60-second deadline from submission, at most three model calls and two new document visits across sessions, configured in page-question-limits.ts. A cache miss uses the same bound-outlet reader, Guard and supplied source pacing; a process restart may reread the bound outlet without a completed search budget. Twenty distinct accepted questions per conversation are counted from persistent events, including cancelled/unverified work; duplicate delivery does not count twice, and the next question asks the user to start a new search. Search results and search accounting remain unchanged. Cancellation, expiry or a newer question discards late output. At G1 integration, State24/TaskDefinition22 were unchanged; old State23 tasks are not silently migrated or reset.

Independent review of the original 102 model answers was reported by the user: zero false claims, 84 correct answers and 23/24 correct absence judgments. The subsequent question Prompt/Schema3 repair has offline evidence only; A must independently rerun the six affected questions. It adds question-language enforcement, complete-sentence quotations, explicit review-only absence and dietary-preference guidance, and confirmation for source contradictions. No Live quality claim is made. See [ADR-0046](../decisions/0046-observed-actions-and-source-quoted-answers.md).

## G5 B1 approved follow-up

B1 hands a current, server-checked source URL to the user. Each explicit departure is recorded separately from Task State. On return, an authenticated durable claim asks “Did you get the booking?” at most once per Case; Yes/No/Skip is USER_REPORTED, never BOOKED_VERIFIED. Japanese/English cancellation conflicts show both original quotations and one English paraphrase per page, the explicit conflict notice, and website-confirmation hint; neither model nor code ranks strictness. A fixed Tabelog English system-fee rule is supported by the2026-10-29 public help GET and date/SHA; TableCheck gets no inferred fee. Ordinary G3 source-link activation remains deferred. No real booking/model/Live is run. See [ADR-0049](../decisions/0049-source-bound-b1-booking-handoff.md).
