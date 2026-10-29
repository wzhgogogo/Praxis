# Tokyo Restaurant Agent MVP PRD

- Status: Accepted
- Document revision: 0.19
- Last updated: 2026-10-29
- Source of truth for: 第一版产品范围、用户承诺和验收标准
- Related ADRs: [ADR-0004](../decisions/0004-single-candidate-authorization.md), [ADR-0006](../decisions/0006-web-first-agent-workspace.md)
- Related documents: [User Flows](USER-FLOWS.md), [Restaurant Domain](../domains/RESTAURANT-BOOKING.md), [Data, Context & Security](../architecture/DATA-CONTEXT-SECURITY.md)

## 产品定义

Praxis第一版是一个Responsive English Web Agent，同时支持Desktop与Mobile浏览器。用户用自然语言描述东京餐厅需求，Praxis建立可跨会话恢复的Case，并按请求提供有来源支持的推荐或真实可订候选；用户从候选中选择并授权一家后，Praxis通过API、Browser Agent或Human Takeover推进预约，验证结果并准备路线。

核心价值不是“比 Google Maps 更会推荐”，而是继续完成 Google Maps、Hot Pepper、TableCheck 和餐厅官网之间断裂的执行链路。

## 目标用户

- 使用英文 Web 交互。
- 可以在Desktop或Mobile浏览器开始、继续和接管同一Case。
- 希望预订东京餐厅。
- 不按国籍、居民或游客细分。
- 能提供真实联系方式，并在登录、验证码、银行卡或条款确认时接管。

本阶段验证 Agent 能力和用户价值，不据此宣称某一用户细分已达到 PMF。

## 只读目标与预约闭环

按[ADR-0044](../decisions/0044-recommendation-availability-boundary.md)，明确订位/空位措辞（A）或具体钟点/数字钟点时段、已知或可推断人数的坐下正餐（B）为AVAILABILITY。A即使无日期/时间仍为查位目标，可先找店，按ADR-0026在查位前补问缺失时间；补充时间沿用原目标。既无到访日期/时间也无订位措辞的新请求为RECOMMENDATION，其余由语义模型判断，不凭人数或店型硬分类。推荐须满足地点、HARD条件和适用营业时间；参数充分时可有界补查空位，但不将未知、无预约入口或访问失败解释为无位或walk-in。当前请求下明确无位会排除该候选。空位目标必须取得对应门店、日期、人数和时段的当前slot；缺人数时补问，缺精确时间可先发现候选，不能降为普通推荐。接待方式与库存独立：明确walk-in不替代可订slot，缺少预约入口不产生walk-in结论。

以下闭环描述明确空位/预约目标；普通推荐可在有依据的结果展示处完成，不强制进入授权与预约。当前开发验收映射见[H001–H005契约](../../src/eval/restaurant/agent-loop/cases/README.md)。

```text
自然语言需求
→ 建立可恢复的Conversation与Restaurant Case
→ 补齐阻塞信息
→ 跨来源搜索与实体合并
→ 检查指定时间、人数的真实空位
→ 有界调查后返回首批目标为 3 家不同、证据充分的候选
→ 用户选择并授权一家
→ 提交前重新验证
→ API / Browser / Human Takeover
→ 读取并验证回执
→ 保存预约、取消入口、路线与出发时间
→ 在Case与Activity Timeline中持续显示状态和下一步
```

按[ADR-0030](../decisions/0030-restaurant-category-negative-eligibility.md)，`no fast food`等餐厅类别排除禁止已知违规；有来源类别事实但判断未知的边界类型可以保留，不能宣称“已确认不是快餐”。连锁、便宜或出餐快本身不等于快餐。正向HARD仍须证据支持，过敏、污染、安全及无障碍等排除不适用此放宽。用户明确追加“不要拉面／回转寿司”通过普通需求更新收紧当前Task，不建立长期偏好。

合法调查耗尽后的1–2家完全合格结果可以完成未指定数量的请求，同时明确默认三家目标未满足；通常仍有合法读取时继续调查。默认首批的长时只读任务进入预留交付窗口时，若已有1–2家当前合格结果，先展示并记录未达到三家，再让用户续接；明确指定数量、证据过期或取消不使用该例外。用户明确指定数量时，数量不足不能算完整完成。

## P0 功能

1. 提取日期、时间窗口、人数、区域、菜系、预算和用户明确提出的特殊要求；特殊要求不阻塞普通初步推荐，但一经声明的安全关键要求不得静默放宽。
2. 只追问会阻塞搜索或预约的信息。
3. 并行搜索多个来源，合并同店与不同分店。
4. 空位/预约候选在后台记录空位查询时间，并提供价格依据、条款和执行方式；来源提供过敏处理信息时，候选卡须清晰展示处理状态、来源和确认要求。
5. 开放式找店的首批目标是3家不同、证据充分的候选；用户明确的数量取代默认目标，指定门店不机械扩展。空位目标中每家仍须有已验证对应slot；进入预约时还须有可执行预约路径。普通推荐按事实要求展示，不声称已有座位；不足目标时返回实际数量和受限原因，不以安全停止冒充用户目标完成。
6. 结果批次是可恢复的只读选店会话：用户可查看、加入/移除备选、要求同条件另一批或提交明确反馈。已有合格未展示候选优先返回；池内不足才由现有有界调查续接，且不自动预约或形成长期偏好。
7. 用户只选择并授权一家，不授权自动换店。
8. 提交前重新验证空位和条款；发生实质变化时重新确认。
9. 无API网站的浏览与受控操作是核心建设方向；有API可优先使用，无API时使用支持的Browser Adapter；登录、验证码、银行卡、3DS、CAPTCHA 和新增高风险条款触发 Human Takeover。
10. 只有强完成信号存在时进入 `BOOKED_VERIFIED`。
11. 预约失败或空位消失时刷新候选并让用户重新选择。
12. 支持取消；修改统一为“创建并验证新预约，再取消旧预约”。
13. 预约验证后提供 Google Maps 路线、交通时间和建议出发时间。
14. 用户可以关闭页面后恢复同一Case，并看到最新候选、状态、下一步和关键Activity。
15. Web提供`Active / Needs You / Waiting / Completed`视图；选择、授权、条款变化和Human Takeover可在Mobile Web完成。
16. Conversation、解释文本和模型Working Plan不作为权威预约状态；Case视图必须从服务端Task、Authorization、Attempt、Evidence和Outcome投影。

预算作为候选条件展示：明确每人上限属于 HARD，须有适用餐期的当前价格依据才可交付；超出或价格未知的门店不能作为合格结果。around/ideally 等 SOFT 预算保留其强度和比较含义，核对不满足或未核对时透明展示。条件行提供真实价格原文及来源，不把已列出的课程价格宣称为该课程已有空位。

## 授权规则

候选卡中的 `Book this` 在完整展示餐厅、分店、日期时间、人数、套餐/座位、价格和取消条款时，同时代表选择与一次性授权。若当前Case有已声明的过敏Hard Constraint，则先展示Restaurant Domain定义的过敏披露Consent Card；只有用户确认本次披露内容后，才创建该一次性Authorization。

以下情况使授权失效：

- 餐厅或分店变化；
- 时间超出已展示范围；
- 价格或最低消费增加；
- 新增强制套餐、预付、不可退款或更严格取消条款；
- 用户资料版本发生影响预约的变化；
- Offer 已过期且重新验证结果不一致。

## 结果定义

- `BOOKED_VERIFIED`：成功页、平台订单状态或确认邮件包含匹配的预约编号、餐厅、时间和人数。
- `PENDING_PROVIDER_CONFIRMATION`：预约请求已提交，但仍等待餐厅接受。
- `OUTCOME_UNKNOWN`：无法证明成功或失败；禁止再次提交或改订其他餐厅。
- `FAILED`：已明确失败且没有产生预约。
- `CANCELLED_VERIFIED`：取消回执明确匹配原预约。

## 关键边界

- 相对时间按 `Asia/Tokyo` 解析。
- 只有吧台、吸烟区、强制套餐或不同时间可用时，不得当作原条件完全匹配。
- 过敏、儿童、无障碍等备注未获餐厅明确接受时，只能标记“已提交请求”；过敏的候选卡信息和预约前披露同意以[Restaurant Booking Domain的详细规则](../domains/RESTAURANT-BOOKING.md#过敏与特殊要求)为准。
- 日本手机号、片假名、本地地址或支付方式为必填但用户不具备时，不伪造信息。
- 提交后断网或超时先验证，不盲目重试。
- 餐厅稍后主动取消时，任务重新进入需处理状态。
- 未在 Capability Registry 验证的网站必须降级为接管或 Deep Link。

## Non-goals

- 东京以外城市和非餐厅 Local 服务。
- 原生移动 App 或控制原生 App。
- Slack、微信、Discord等多消息渠道和通用Agent App Store。
- 电话预约、候补排队和线下登记。
- 完整日语产品体验。
- 自动保存或输入密码、验证码和银行卡。
- 未经确认的付费、取消或候选替换。
- 对任意餐厅官网承诺自动化。
- 跨任务 Memory、个性化排序和 Standing Authorization。

## Pilot 指标

- 支持路径端到端验证预约成功率 ≥ 70%。
- 真实 Pilot 中具有预约意图的任务完成率 ≥ 50%。
- 错误宣称成功、未经授权预约和重复提交均为 0。
- 已验证预约的路线生成率 ≥ 95%。
- 除最终确认外，单任务 Human Takeover 中位数不超过 1 次。
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

Current-run identity-bound pages are reused first. Each question now has an independent 60-second deadline from submission, at most three model calls and two new document visits across sessions, configured in page-question-limits.ts. A cache miss uses the same bound-outlet reader, Guard and supplied source pacing; a process restart may reread the bound outlet without a completed search budget. Twenty distinct accepted questions per conversation are counted from persistent events, including cancelled/unverified work; duplicate delivery does not count twice, and the next question asks the user to start a new search. Search results and search accounting remain unchanged. Cancellation, expiry or a newer question discards late output. State24/TaskDefinition22 are unchanged; old State23 tasks are not silently migrated or reset.

Independent review of the original 102 model answers was reported by the user: zero false claims, 84 correct answers and 23/24 correct absence judgments. The subsequent question Prompt/Schema3 repair has offline evidence only; A must independently rerun the six affected questions. It adds question-language enforcement, complete-sentence quotations, explicit review-only absence and dietary-preference guidance, and confirmation for source contradictions. No Live quality claim is made. See [ADR-0046](../decisions/0046-observed-actions-and-source-quoted-answers.md).

## G5 B1 approved follow-up

B1 hands a current, server-checked source URL to the user. Each explicit departure is recorded separately from Task State. On return, an authenticated durable claim asks “Did you get the booking?” at most once per Case; Yes/No/Skip is USER_REPORTED, never BOOKED_VERIFIED. Japanese/English cancellation conflicts show both original quotations and one English paraphrase per page, the explicit conflict notice, and website-confirmation hint; neither model nor code ranks strictness. A fixed Tabelog English system-fee rule is supported by the2026-10-29 public help GET and date/SHA; TableCheck gets no inferred fee. Ordinary G3 source-link activation remains deferred. No real booking/model/Live is run. See [ADR-0049](../decisions/0049-source-bound-b1-booking-handoff.md).
