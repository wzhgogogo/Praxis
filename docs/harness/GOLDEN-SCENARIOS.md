2026-11-12 CET — draft / not integrated：请求菜系发现必须有整个结果范围的query/title/visible h1证据；仅地点、单卡分类或展开菜单不再完成。B真实精确目录→NativeSearch→原身份核对→直达URI/零名称检索组件通过，跨录制/构造导航边界明确，不作Live验收。推进能力沿用前一候选，原生目录空位表单接线未扩展；待全门禁复核。

2026-11-12 CET — draft / not integrated：通用推进动作允许模型指定独立值域组，复用既有权威动作匹配，中间无模型、无自动选择/完成。真实D02V人数与日历组件验证；事件监听器缺失处仅加载原动作对应的下一原始DOM，不造响应，未证明当前网站稳定性。Guard/身份/库存/G1不变，0Live/0GET/0真实模型。源码b18a6343净树type/arch/build及默认1621、Chromium284/G6 159全绿，双基线扫描0。D02V原DOM/HAR计时5→4模型、44.508→41.870秒仅组件投影，真实模型/新Live待验证。记录索引：[manifest](../../src/harness/browser/fixtures/advance-control/manifest.json)，[简报](../../.eval-artifacts/phase3b/advance-control-20261112/report.md)。

# Golden Scenarios

- Status: Accepted
- Document revision: 0.18
- Last updated: 2026-10-19
- Source of truth for: 首批Harness场景目录和核心断言
- Related ADRs: [ADR-0004](../decisions/0004-single-candidate-authorization.md), [ADR-0006](../decisions/0006-web-first-agent-workspace.md)
- Related documents: [Harness Design](HARNESS-DESIGN.md), [MVP PRD](../product/MVP-PRD.md)

> 这是45个Golden场景的目录；实现状态在下方单独标记，不能用部分通过代表全部完成。

## 当前自动化基线

当前Mock切片已实现13个Bootstrap Harness场景，覆盖：授权成功预约、最多3个候选、未授权禁止提交、明确失败返回选择、弱Evidence进入`OUTCOME_UNKNOWN`、Unknown禁止换候选、Command重放不重复副作用、预约字段冲突、错误Attempt Evidence、Run Artifact因果链完整性，以及Agent发起的第二次搜索与A→B Availability策略。测试位于 [`restaurant-harness.test.ts`](../../src/harness/restaurant-harness.test.ts)。

`G03-coordination-parent-child`已作为PGlite Runtime Graph场景实现：两个关键子任务成功后Goal才进入`ACHIEVED`；未满足依赖为`WAITING`、失败上游为`BLOCKED`、环依赖被拒绝。它不代表跨Domain Child Task Command或自动启动已经实现。

`G01-recurring-shopping`已实现为合成Harness：持久化Trigger/Fake Clock唤醒后进入`WAITING_USER`，确认后仅产生`PREPARE`模拟订单命令，完成后以`WAIT`命令安排下一周期；第二周期再次等待确认，绝不自动购买。`G02-long-running-case`也已实现：准备、等待外部、请求材料、材料补齐、再次准备和解决均由明确Event推进，不产生外部写入。G03仍是Graph聚合场景，尚未拥有独立Coordination状态机。

这些Bootstrap场景覆盖下方部分Golden要求和通用安全不变量，但不表示45个目录项已经全部实现；目录项仍需按原ID逐步补齐。

Stage 2A/2B的ADR-0011 Fixture基线：一条完整英文请求经HTTP API由Agent依次完成Discovery、Availability、Candidate/Offer选择并进入`AWAITING_AUTHORIZATION`；一条缺日期/时间/人数请求进入`NEEDS_INPUT`且仅列出这三个字段。该路径不创建Authorization或外部写操作，是`FIXTURE`纵向路径，不可报告为R12真实可执行候选或真实模型质量。

Stage 2B的`W01–W05`已作为Local HTTP/SSE + PGlite集成场景实现并通过；另有Responsive页面Contract和陈旧版本场景。它们证明Fixture Workspace的持久恢复、用户隔离和非权威Projection，不证明真实PostgreSQL部署、真实浏览器视觉、生产身份或真实Provider。

## A. Happy Path（6）

1. `R01-api-instant-success`：API预约并取得匹配编号。
2. `R02-tablecheck-browser-success`：Browser填表、提交一次、验证成功页。
3. `R03-hotpepper-instant-success`：即时预约成功并解析回执。
4. `R04-request-booking-pending`：请求预约只进入Pending，外部确认后才成功。
5. `R05-route-after-booking`：预约成功后生成路线和出发时间。
6. `R06-no-location-permission`：拒绝位置权限不影响预约，路线等待出发地。

## B. Intent与对话（5）

7. `R07-missing-date`：只追问日期。
8. `R08-missing-party-size`：只追问人数。
9. `R09-relative-time-tokyo`：Tonight按Tokyo时区解析。
10. `R10-ambiguous-area`：多个同名区域时要求澄清。
11. `R11-model-invalid-json`：解析重试一次后降级结构化表单。

## C. Search与实体（7）

12. `R12-three-executable-candidates`：30秒预算内返回3家可执行候选。
13. `R13-only-two-candidates`：Deadline只找到2家时透明返回2家。
14. `R14-no-availability`：建议调整条件，不返回未验证餐厅。
15. `R15-duplicate-sources-one-outlet`：多来源同店正确合并。
16. `R16-same-brand-different-outlets`：不同分店不得合并。
17. `R17-source-timeout-partial-result`：单来源超时不阻塞其他来源。
18. `R18-budget-hard-filter`：超预算候选不能进入Top 3。

## D. 选择与授权（5）

19. `R19-select-one-candidate`：只为用户选择的候选创建Authorization。
20. `R20-offer-expires-before-commit`：Offer过期后重新验证。
21. `R21-price-change-invalidates-auth`：价格增加要求重新确认。
22. `R22-new-cancellation-term-invalidates-auth`：更严格条款使授权失效。
23. `R23-selected-candidate-fails`：明确失败后返回选择，不提交第二家。

## E. Browser与Takeover（5）

24. `R24-login-takeover`：登录后从Checkpoint恢复。
25. `R25-otp-takeover`：OTP不进入模型或日志。
26. `R26-card-3ds-takeover`：支付信息不被Agent读取。
27. `R27-captcha-takeover`：CAPTCHA交给用户。
28. `R28-dom-change-before-submit`：Invariant失败后降级，不猜测提交按钮。

## F. 不确定结果与恢复（5）

29. `R29-network-loss-before-submit`：安全重新准备。
30. `R30-network-loss-after-submit-success`：先Verify，发现成功，不重复提交。
31. `R31-network-loss-after-submit-failure`：确认未产生预约后才返回选择。
32. `R32-outcome-remains-unknown`：进入OUTCOME_UNKNOWN并禁止新预约。
33. `R33-restaurant-cancels-later`：已成功任务被外部取消后重新进入需处理。

## G. 取消与变更（4）

34. `R34-cancel-success`：确认费用后取消并验证。
35. `R35-cancel-outcome-unknown`：不重复取消，进入Needs Attention。
36. `R36-change-rebook-then-cancel`：新单成功后取消旧单。
37. `R37-old-cancel-fails`：保留两张订单并提示双重预约风险。

## H. Runtime通用性（3）

38. `G01-recurring-shopping`：Fake Clock唤醒、等待确认、模拟下单、进入下一周期。
39. `G02-long-running-case`：提交后等待外部Event，再请求补材料并完成。
40. `G03-coordination-parent-child`：两个关键子任务成功后父Goal才完成。

## I. Web Agent Workspace（5）

41. `W01-case-restores-after-server-restart`：Conversation和Root Task持久化后，服务重启仍恢复同一Case、候选、状态和下一步。
42. `W02-mobile-resumes-desktop-case`：Desktop创建的Case在Mobile尺寸重新认证后继续，不能创建重复Task或Authorization。
43. `W03-cross-user-case-denied`：其他用户即使知道Case、Conversation或Activity ID也不能读取或写入。
44. `W04-sse-reconnect-is-idempotent`：SSE断线重连不丢失已提交Activity，也不把重复投递显示成重复现实动作。
45. `W05-conversation-is-not-authority`：聊天文本或模型声称“预约成功”不能修改Task、Authorization、Attempt或Outcome；Case视图仍以权威状态为准。

## 通用禁止断言

每个相关场景都必须检查：未经授权Commit为0、重复写Attempt为0、弱Evidence不能产生Verified Outcome、跨用户数据访问为0、Conversation或Projection不能成为第二套权威状态。

## P2-1 发现探测（eval-only）

`src/eval/restaurant/agent-loop/runners/run-discovery-probe.ts` 使用生产 `createLiveReadAssembly`，每来源只读首批列表和详情身份，不查位、不交付。`discovery-probe.test.ts` 与既有 `native-discovery-composition.test.ts` 覆盖冻结输入、共享15调用/180秒上限、失败调用计数、未到达来源、eval见证隔离及source-funnel绑定指标；预检接线另有离线传输反例。真实 Chromium 门禁单列，不将受控来源组合称为外站验证。

真实公开来源的逐次基线与限制见 [P2-1第一段报告](../../.eval-artifacts/p2-1-discovery-20261016/report.md)。这是已暴露开发诊断，不代表Golden目录中的预约或交付场景通过；十次 TableCheck 失败已按复核改记环境问题，旧产物保留。

P2-1a 对应 [Accepted ADR-0042](../decisions/0042-agent-planned-discovery-and-search-availability-hints.md)：`discovery-planner.test.ts` 和 `discovery-retrieval.test.ts` 检查正向条件传递及非法检索拒绝；`native-discovery-composition.test.ts` 从生产 factory 驱动稀疏转类别、保留候选、空结果两次改写、分页/预算与初始文本规划复用。`browser-read-fixture.test.ts` 使用真实本地 Chromium，动态展示加载/明确空状态，验证类别在详情前生效、隐藏或越地区类别不可选。旧首批之后的类别扩展路径及对应假设已退役；原有资格、推荐和交付回归保持。来源预检成功/空/超时、Google 精确官网 ID 指标另在 eval 测试覆盖。

本轮仅离线组合和本地浏览器，不运行检查点 A 或真实模型；搜索级空位筛选尚未实施。红绿、五门禁与未覆盖范围见[离线报告](../../.eval-artifacts/p2-1-discovery-20261016/followup/report.md)。

## TableCheck public JSON transport controls (2026-10-19)

The real local Chromium receiver in read-network-redirect.test.ts proves exact reviewed catalog/search GETs reach the receiver and POST/HEAD, unknown query fields and other paths do not. Recorder retains safe fixture JSON via the same frozen review grammar. Source preflight tests reject metadata/facets as venue hits; external audit independently checks the frozen GET grammar. These controls do not prove the real search path restored: its CORS OPTIONS handshake is still blocked pending clarification.


## 2026-10-19 authorized CORS follow-up

read-network-redirect.test.ts additionally covers genuine browser GET preflight plus refused POST preflight, extra header, wrong path, missing GET rule and manual OPTIONS. CDP protocol facts, independent GET receiver, Live sanitization, Recorder and external observer are checked. Independent S0 covers normal, missing and contradictory facts. This local fixture is not current website or baseline evidence.

2026-10-19补齐同地区首页：复用P21动态改写Chromium组合，加入A1原样类别锚点（无CSS）＋可控列表／加载过程；旧版类别0导致组合失败，新版能先改写再读5家详情。隐藏、跨地区类别与原拒绝路径仍验证。Pack单测另核对真实片段及全国入口反例；不是原网站静态Replay，外站效果另由新检查点A报告。

Google-only nearby反例从生产createLiveReadAssembly入口驱动，旧版地点nearby／检索local food nearby，新版地点空值／检索local food；命名地区对照保留，实际传输仍有坐标约束，intent及HARD不变，禁止意外浏览器访问。Fixture使用带来源和观察时间的权威坐标；真实模型／API用量为0。


2026-10-19 P2-1a DOM category correction (offline): same-region Pack-valid category links in the current DOM are supplied even when CSS hides them; foreign-region links remain rejected. The local Chromium fixture now includes CSS-hidden links. Retrieval Prompt@3 supplies actual attempted expressions and requests GENERAL or a materially different word after an explicit empty result without categories. The executor records REPEATED_RETRIEVAL_EXPRESSION within the existing rewrite budget. The three-source assembly regression verifies the actual Google text-search request; saved A10 trace already contains the shared keyword, so the proposed Google regression was not reproduced. Five gates pass (943 unit tests, 117 local Chromium tests). Raw DOM counts, original-input counterfactual provenance and later model/website results are reported separately in [the batch report](../../.eval-artifacts/p2-1-discovery-20261016/p21a-dom-replay-20261019/report.md). No qualification, network permission, or P2-1b change. This supersedes the earlier CSS-visibility claim for retrieval categories only.


2026-10-19 P2-1b：复用生产 factory/Guard 的真实本地 Chromium/HAR，双来源各覆盖应用、人数不符、筛选为空、推荐、宽窗、缺人数；核对过滤列表独立、一次回退及原列表/时间预算、无 AVAILABILITY 证据/预约路径、Recorder 参数忠实。另有生产 generic-read 下额外参数拒绝红绿，独立网络审核正反例与权威值覆盖源链接旧值的合同测试。既有 H001 当前批与保留队列测试按新增筛选/回退更新精确导航数，交付和资格断言保留。H002 真实条件的离线生产组合证明不调用共享规划且 Google Nearby；HARD 关键词与页面类别仍有正向对照。全部为 L0/L1，非真实模型回放或外站验收。


2026-10-19 检查点 B 修正（离线）：Tabelog 已确认同地区首页可用此前观察到的列表根应用权威筛选，缺观察／跨地区仍拒绝；真实本地 Chromium 的 302 首页落点验证实际生产 factory、Guard、筛选与详情链。稀疏且有类别且改写未耗尽时，Schema@2、Domain 和执行器拒绝 KEEP；Prompt@5 配套，无类别／额度耗尽仍允许。原三次 TableCheck 录制实际显示搜索错误，筛选预检含未审核 open_from/open_until；停用该筛选并记 SKIPPED/FILTER_TRANSPORT_NOT_REVIEWED，使用普通列表，不扩大网络权限或生成空位证据。旧双来源筛选 Fixture 中 TableCheck 的应用／回退覆盖已退役为明确跳过；既有交付、半径和 HARD 断言保留，精确导航次数移回普通搜索。离线诊断与新十次仅发现探测分列于[修正报告](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/report.md)。不证明查位或完整 Live。
