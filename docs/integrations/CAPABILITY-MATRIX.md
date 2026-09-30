# Integration Capability Matrix

- Status: Accepted
- Document revision: 1.31
- Last updated: 2026-09-30
- Source of truth for: 外部平台可用能力、证据和限制
- Related ADRs: [ADR-0002](../decisions/0002-deepseek-model-runtime.md)
- Related documents: [Restaurant Domain](../domains/RESTAURANT-BOOKING.md), [Data & Security](../architecture/DATA-CONTEXT-SECURITY.md)

状态：`verified`表示官方文档确认；`assumed`表示设计假设待实测；`requires partnership`表示存在能力但访问条件未取得；`unsupported`表示当前不纳入。

| Provider | Discovery | Availability | Execute | Cancel | Verify | Takeover | Status / 限制 |
|---|---|---|---|---|---|---|---|
| DeepSeek API | — | — | Tool Call提议 | — | 仅辅助抽取 | — | `verified`连接；Semantic与Agent使用Beta strict function。strict wire object的所有字段均为required并关闭additional properties，Domain再恢复canonical可选字段；non-blank等其余规则由本地Validator保证。安全诊断保留status/request ID/code/type/脱敏message；传输错误仅保留已知cause code（不保留原始异常文本），正文读取失败与JSON格式失败分开，模型不直接执行工具或写状态 |
| Google Places API (New) | Live Text Search Discovery；已知Place ID的Place Details事实重读（代码实现；尚待本切片Live实测） | 无库存；可返回常规营业时段及网站指针 | 否 | 否 | 否 | 否 | `verified`官方HTTP/FieldMask契约；Praxis只请求最小字段、结构化address components、电话、类型、`regularOpeningHours`及Place Details的`websiteUri`。命名“附近”地点先在同一run额度内解析坐标，再以记录的半径距离判断；只有多个同名坐标结果才请求消歧。事实重读只用已保存Place ID，不以名称再次搜索；命名地点解析、Discovery和Details在同一持久task run累计请求且按三类导出，失败的已发送请求也计数，不同task run隔离。调试用本地请求上限不等于Google账户配额：本地耗尽、429限流、403配额或权限拒绝及网络失败以不同稳定码保存。`websiteUri`只是Google列出的网站指针，不是Google Maps URL、更不是官方事实或页面内容。UNKNOWN不会变成无位；常规营业时段不能表示当前营业、特殊日期营业或有桌；内容保存和展示仍受Google政策限制 |
| Cloudflare Browser Run | 浏览器基础设施（代码实现；一次live会话建立失败已记录） | 通过受限Browser Executor读取 | 否 | 否 | 否 | 否 | CDP远程浏览器；Kitesurf为首选Beta引擎，发生一次兼容/运行时失败才回退Chromium；不绕过bot challenge。会话未建立的稳定失败为`BROWSER_RUNTIME_FAILED`/`BROWSER_TIMEOUT`，不得伪报为目标网页或门店identity事实 |
| Local Playwright Chromium | 仅开发/eval浏览器基础设施 | 通过同一受限Browser Executor读取 | 否 | 否 | 否 | 否 | 仅当`PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM`显式选择；不访问Cloudflare、不读取其凭证、不改变Cloudflare AUTO。要求本机已安装Playwright Chromium binary；缺失时稳定`BROWSER_RUNTIME_UNAVAILABLE`，不回退远端Provider。两个eval-only interactive gate同时开启时，headed `launchPersistentContext`固定使用gitignored `.eval-artifacts/local-chromium-profile`，人手验证期间保留同一page/context/browser；正常结束只关闭session，不自动删除profile。共享`browser_read_action@4`可在同一会话回读观察到的 checkbox、range、region scroll和已观察选项；modal 背景目标不可执行；已观察`target=_blank`公开链接在同一context切换active page后必须重新观察。选项及导航故障隔离目前只经真实本地Chromium Fixture覆盖，不代表真实来源identity、slot或availability已验证 |
| Tabelog Web | 来源页 | 只读开发期Availability Executor（代码实现；页面兼容性部分实测） | 否 | 否 | 否 | Eval-only terminal pause | 仅限Tabelog域名；结果页只接受可识别的restaurant-result链接，relative/canonical outlet URL在门店页补全身份，只有exact phone或name+address可HIGH匹配，已知电话号码冲突直接拒绝；日本显式`+81`号码与国内格式规范后才比较。只接受明确标记available的slot控件。实体非HIGH、CAPTCHA/`Just a moment...` challenge、页面异常、未确认的日期/人数、超时或外部跳转均不是`UNAVAILABLE`；challenge先于identity归类为`BOT_CHALLENGE`。2026-09-07 H001已读到真实详情，Sushisho Isseki Sancho以exact phone达HIGH，但其availability转至当前不支持的外部预约Provider，因此没有slot或Offer。仅在显式local interactive eval中，adapter发送脱敏`USER_INTERVENTION_REQUIRED`、终端等待用户手动完成站点验证并仅snapshot同一页面；没有CAPTCHA自动化、stealth、自动retry或cookie/token记录。历史eval identity artifact不保存整页HTML；当前受控浏览器诊断仅保存脱敏预约区域结构、完整脱敏控件和被动库存响应允许字段，不保存整页评论/个人资料。Browser会话建立失败不构成实体不确定。生产适用性须经兼容性、可靠性和法律约束单独验证 |
| Google Routes | — | 交通路线 | 否 | 否 | Route响应 | 否 | `verified`；支持Transit到达/出发时间 |
| Hot Pepper Web Service | 餐厅、区域、预算等 | 未见公开库存API | 未见公开Consumer Booking API | 否 | 否 | 否 | `verified` Discovery；预约需网页或合作能力 |
| Hot Pepper Web | 餐厅页 | 网页可查 | Browser | Browser/管理链接 | 成功页、邮件、订单状态 | 登录/验证/支付 | `assumed`，需逐流程Adapter验证；Request Booking不是即时成功 |
| TableCheck API | 有集成能力 | 可能 | 可能 | 可能 | 可能 | 取决于流程 | `requires partnership`；不作为MVP无条件依赖 |
| TableCheck Web | 公开的`/en/japan/search`按候选名称和Google坐标发现渲染出的guide页链接 | H001只读Browser Adapter（已在原始 H001 得到一个完整 grounded slot） | 否 | 否 | 否 | 受控模型接管仅限同一会话中已观察到的只读目标 | 固定优先于Tabelog。搜索排序只限制待读取页面，不构成identity；详情页必须以JSON-LD/DOM/tel link的Google exact phone或name+full address达到HIGH。预约页只接受详情页实际链接或其嵌入的公开Availability结构，绝不派生slug；仅设置只读日期/人数参数并读取明确bookable slot。公开`/en/japan/search`上的已观察 checkbox/range 仅在GET form且通过来源代码持有的查询控制许可时可调整；同意条款、营销、登录、支付、预订和未知作用控件一律拒绝，模型理由或页面文案不能授权。`TABLECHECK_DISCOVERY_NO_RESULT`、`TABLECHECK_DISCOVERY_INCOMPLETE`、`TABLECHECK_ENTITY_MATCH_UNCERTAIN`、`TABLECHECK_PAGE_UNAVAILABLE`和`TABLECHECK_PARSE_FAILED`分开保留；`PAGE_UNAVAILABLE`仅可由错误页title/primary heading证明，不能由正文数字或任意`not found`字样触发。搜索页未抽取链接时同一session交给受限模型，artifact记录交接原因、观察、动作和动作后验证；耗尽后才退出该来源。2026-09-08冻结 H001 在 KINKA Sushi Bar Izakaya 渋谷通过Google exact phone达到HIGH，回读`2026-09-08`、2 人、`19:00`的公开可订slot，并进入`PRESENT_RESULTS`；这只证明该次来源/库存，不保证其他门店、日期或Web UI已验收。没有登录、个人资料、支付、点击确认或提交。identity、日期/人数或slot不确定时fail closed。TableCheck API仍`requires partnership` |
| Google-listed Restaurant Website | 仅已发现候选的Google `websiteUri` | 有界只读的JSON-LD、可见字段及引用式原文事实交接 | 否 | 否 | 否 | 否 | 代码实现、尚待本切片Live实测。仅复用受控只读Browser Executor打开HTTP(S)同源网址，移除query/fragment并拒绝凭据、跨源跳转及不安全控件。候选名称加地址包含、同序门牌加可用地域词对应，或唯一公开电话（可见数字/tel链接）精确对应，才可建立HIGH identity；门牌数字本身、同名、缺地址或明确不同城市/街区均为UNKNOWN。JSON-LD是快捷路径，不会遮住同页可见事实；身份确认后才接纳明确标注的公开套餐价/税费、包间低消、取消和no-show字段，裸金额不推断；字段彼此不派生。候选身份确认后可把每候选最多6,000字符的原文按片段ID临时交给既有事实模型；模型每页最多选择3条原文，代码仅按观察到的ID保存短引用及同来源身份，不保存整页原文到Task State。派生`MODEL_JUDGMENT`只保存到原始来源事实的引用链，不伪装为页面来源。交接不证明条件或库存；Agent仍负责后续调查。536项默认测试与生产组合通过，Matsue两页Replay可绑定；不同电话/跨语言地址及共享菜单归属未解决，一次固定来源真实模型已证明Matsue阅读交接，但fact judgment11有引用格式失败；当前12/schema4以当前来源ID枚举约束引用，仅离线门禁通过，尚无修正后的模型或新整单Live验收。Google Maps URL、Google列出的网址或模型结论都不单独证明官网/门店事实；失败为candidate-scoped UNKNOWN，绝不构成无位 |
| Phone-only Restaurant | 可能 | 电话 | 否 | 否 | 用户/餐厅确认 | 用户 | `unsupported`于MVP |

## 2026-09-30 Tabelog requested-date restriction

One authorized Teppen single-page read observed the Sep 30 calendar day marked `closed`, no selected date, selected-but-disabled Guests 2, and no captured request-bound vacancy response. The Adapter now binds a restricted target day to its own visible month table and reports `UNKNOWN / TABELOG_REQUEST_DATE_CLOSED_ON_CALENDAR`; `full` and telephone-only day states have distinct UNKNOWN reasons. Hidden future-month tables and ambiguous/missing month or day structure retain the generic restricted/unknown result. These are online-query state descriptions, not an exact-time no-slot conclusion or an Offer. Saved-DOM real Chromium and the single current sanitized probe support this narrow source fact; current full Adapter Live after this code change has not run. [Evidence and limits](../history/H001-TEPPEN-TARGET-DATE-2026-09-30.md).

## 2026-09-29 H001 bounded native discovery (offline integrated, Live results below)

Shared Browser Read repair, offline only: TableCheck's observed search wrapper `DIV role=combobox` is now a click control while its nested `input[name=search_text]` retains its own placeholder label and native fill capability; the model still has no new free-text search action. A covered public result anchor may navigate once to its exact currently observed same-origin href after the executor rejects sensitive paths; the destination is re-observed. Tabelog readiness now requires a visible selectable date and enabled visible guest button, or a visible source restriction. The saved Teppen calendar's hidden future dates and disabled current guests fail the actionable gate; after either immediate or delayed render, the matching visible “No available seats for 2 guests” message is classified as a source query-control restriction, not request-bound zero inventory. These are local Chromium Replay/Fixture results, not new Live source compatibility or availability claims.

Independent review added two negative controls: a result card below the viewport is scrolled into view before exact href/pointer-hit validation, and native input name fallback cannot override visible button text such as `20:00` or `Reserve`. Both local and Cloudflare-session Chromium Fixture paths now pass; the no-write safety label remains enforced.

The opt-in native read path uses Tabelog one bounded batch, then TableCheck one bounded batch only if no qualified result can be delivered and the shared budget remains. Tabelog accepts observed outlet links; TableCheck's public search may use its 5 km geo parameter only for coarse recall. Each detail page must supply its own source ID, name, full address and matching JSON-LD coordinates before the existing exact requested radius admits a candidate. Native facts and availability reopen only that candidate's source detail; provider, stable outlet ID, actual page URL/canonical and page-owned identity signal must remain continuous before HIGH identity or a slot is cited. Native address formatting, missing phone or translated name do not trigger cross-source matching. A wrong outlet, challenge, unavailable page or unbound booking target fails closed. Google may resolve a named locality but performs no restaurant discovery or cross-platform restaurant matching on this path. The original Google candidate route remains available separately under ADR-0015. `nativeDiscoveryFunnel` exposes raw links, parsed/admitted/rejected outlets, pages and batch reason; dual-source cursor `exhausted=false` is not evidence that another Tabelog page was read. A completed native source batch may deliver a supported default short batch under ADR-0033, with `met:false`; explicit counts retain the ordinary rule.

2026-09-29 transport and Live addendum: optional server-side `PRAXIS_GOOGLE_API_PROXY_SERVER` applies only to Google Places requests through a scoped `ProxyAgent`; the local H001 run set it to `http://127.0.0.1:10808`. Browser sources and DeepSeek did not receive this proxy setting. A localhost CONNECT contract and one real Google Places read verified the transport. The user-authorized full H001 Live resolved Shibuya once, admitted one in-radius Tabelog outlet with same-source identity and cited omakase fact, but its date/party selection stayed UNKNOWN; TableCheck parsed five of 21 raw links, all outside radius, and source exhaustion remained UNKNOWN. No request-bound inventory or qualified result was produced. Google network failure before any candidate now stops the Agent after one failed search with `GOOGLE_NETWORK_FAILED`; this guard was verified offline and was not exercised in that Live. [Live record](../history/H001-NATIVE-GOOGLE10808-LIVE-2026-09-29.md).

Harness scenarios in `src/eval/restaurant/agent-loop/native-discovery-composition.test.ts` start from raw H001 content through the production Hybrid composition: Tabelog delivers without TableCheck; Tabelog cannot deliver and TableCheck supplies new candidates; both bounded batches end empty; both lists show outside-radius outlets; a poisoned detail session is replaced for the next observed candidate without retrying the failed outlet; an attempted early END_READ after Tabelog is rejected until TableCheck is read. The downstream extension also covers first-outlet unavailable/unknown then same-source success, second-source continuation, one-result default delivery, and two investigated batches with no qualified result. Native ID mismatch does not reopen source-wide name search, and unresolved cross-source same-outlet signals cannot count twice. New execution and separate independent evaluation artifacts are saved under gitignored `.eval-artifacts/h001-native-downstream-20260929-review-final/`. These are fixed offline source pages and scripted model transport, not current site compatibility or stock. Source failure remains UNKNOWN; no false no-slot or full-site exhaustion. The earlier 2026-09-29 Live remained a failure; the later Google-only-proxy Live is recorded above.

Web workspace lifecycle: `LIVE_READ` uses one visible, in-process bounded run per Case. The user may stop that read; cancellation is relayed to source calls and is recorded as a local read outcome, not a provider cancellation. A server restart does not resume an orphaned run. This is an application lifecycle boundary, not an external reservation capability.

P0 challenge-recovery update (offline contract only): after a TableCheck or Tabelog page has independently established a candidate's HIGH outlet identity, one source-observed canonical or alternate-language HTTPS outlet URL may be read on a challenge. The alternate is never synthesized and must independently re-establish HIGH identity; a branch mismatch, absent alternate or a second challenge returns provider-scoped `BOT_CHALLENGE` while retaining the earlier identity as identity-only evidence. When its corresponding eval handler is explicitly configured, an adapter may emit at most one `USER_INTERVENTION_REQUIRED` pause per candidate/provider. Source failures still permit the resolver's next provider; parent abort, global model-budget exhaustion and `BROWSER_RUNTIME_UNAVAILABLE` propagate as task-level failures. This change has no Live verification and adds no CAPTCHA automation, booking, or external write capability.

Google discovery/grounding update (offline controls and bounded Live samples): discovery sends a strict rectangle restriction, while grounding applies the exact requested radius; rejected out-of-radius or missing-coordinate observations remain diagnostic-only. A named-place suffix can contribute only with a compatible provider type and independent geographic context; address text, rank or administrative-area labels cannot substitute. The single-pass clean-code Live gate at `325880d` supports actual wiring: H002 resolves the source-observed Higashi-ginza Sta. and reaches discovery; H003 admits 28 candidates within 3 km with no US outlet. All three H001–H003 executions remain FAILED/CANCELLED overall, so neither source availability nor normal completion is accepted. Negative admission branches remain covered offline because these responses returned no out-of-radius or missing-coordinate observations. See [independent review](../history/LIVE-READ-P0-REVIEW-2026-09-21.md).


Mock contract update (2026-09-15): the Google→website fact composition retains both source attempts even when the website returns no evidence. Failed refreshes invalidate prior compound-read facts; source history stays auditable. The actual Google/website/TableCheck/resolver composition is covered by H001–H005 synthetic HTTP/page fixtures and independent artifact diagnostics. This is offline contract coverage and makes no new Live capability claim.

Live/control update (2026-09-15): the first current H003 read performed one Google discovery and ten Place Details requests. All ten website attempts remained unknown (nine identity-unverified, one read failure); all ten availability checks remained UNKNOWN, not confirmed unavailable. Three HIGH-identity TableCheck candidates reached model-directed party selection but exposed a local runtime bug: opaque observed DOM references were parsed as CSS selectors. Local and Cloudflare session fill/select now resolve those references through the existing control registry. Actual executor plus local Chromium fixtures pass for both session implementations; Cloudflare remote service has not been retested. The follow-up H003 eliminated DOM-reference CSS errors but five custom comboboxes still failed because they were operated as native selects; all ten website identities and all ten inventories remained unverified. Both runs ended NO_VERIFIED_RESULT with no independently qualified result. Live execution and outstanding source/model gaps are recorded separately in [STATUS](../STATUS.md) and [TEST-LOG](../history/TEST-LOG.md). This does not establish general website identity, ten-person inventory or successful reservations.

## 官方来源

2026-09-24离线契约补充：TableCheck当前run内已读的门店身份页可供后续候选独立重比，进入查位前仍须回到选中门店并重新确认HIGH身份；预约页须保持详情页实际观察到的目标路径。搜索页有多个结果链接时等待任一可见链接，但只接纳与本次`search_text`一致的页面和结果链接。真实Chromium本地Fixture已验证多链接正常结果，旧查询、错页与重复入口由离线回归覆盖；尚未取得本轮新Live证据。Google发现的完整`types`与`primaryType`可提供明确负向HARD类型冲突，缺少该类型仍是UNKNOWN，不能由店名或缺项推断满足排除条件。

2026-09-26离线候选：共享Browser Executor在runtime导航失败后退役旧session，下一次合法读取重开，不增加调用预算或备用Provider；慢close和旧abort不能污染新候选。本地真实Chromium模拟Local与Cloudflare session两种实现，验证底层`page.goto`超时与迟到响应后的页面隔离；未连接Cloudflare远端。`browser_read_action@4`／Prompt@5按当前观察的父控件选择native select或custom combobox选项，标签约束日期／人数／时间，回读未确认时不能宣布完成。TableCheck适配器合成页面组合通过，真实Tokyo Ten与其他来源的可操作性、库存和整体交付尚待有界只读验收。

同日后续边界：Tokyo Ten受控只读探针已观察到custom Time打开与19:00 `CHOOSE_OPTION`，但未确认选中，不能据此认定库存。独立本地红例证明readonly INPUT combobox的DOM `value`更新而`aria-label`不变时，旧Registry漏读当前值；共享Registry现读取该已支持结构的input property。TableCheck合成控件回归在两个本地Chromium runtime验证值回读；真实来源该机制、库存和整单交付仍需复验。

### DeepSeek

- [Chat Completion API](https://api-docs.deepseek.com/api/create-chat-completion)
- [Tool Calls](https://api-docs.deepseek.com/guides/tool_calls)
- [Models and Pricing](https://api-docs.deepseek.com/quick_start/pricing/)

DeepSeek标准JSON Output只保证生成合法JSON，不接收完整`json_schema`。官方Beta strict function calling可校验Function JSON Schema；Semantic与Agent都使用强制、不可执行的function envelope并要求唯一匹配的`tool_calls`。严格模式只支持其文档列出的子集，所有object properties必须写进`required`并设`additionalProperties:false`；Domain canonical schema有可选字段时，使用全字段required的provider wire schema并在本地恢复。Schema不得使用strict不支持的约束（例如string的`minLength`/`maxLength`）；本地Validator仍处理这些无法在传输层表达的语义和不可信输出，语义正确性由Eval单独判断。这不是`LLM → Tool`执行路径：Gateway只提取arguments。模型名和能力可能变化，运行时必须固定并记录版本。

### Google

- [Places API Policies](https://developers.google.com/maps/documentation/places/web-service/policies)
- [Place IDs](https://developers.google.com/maps/documentation/places/web-service/place-id)
- [Routes Transit](https://developers.google.com/maps/documentation/routes/transit-route)

长期保存Google Places内容前必须逐字段确认政策；Praxis长期资产不依赖受限原始内容。

### Hot Pepper

- [Web Service API Reference](https://webservice.recruit.co.jp/doc/hotpepper/reference.html)
- [API Guideline and Attribution](https://webservice.recruit.co.jp/doc/hotpepper/guideline.html)
- [Request Booking Guide](https://www.hotpepper.jp/yoyaku/guide/request/)

公开API文档主要覆盖Discovery和Master数据，不能据此声称可查实时空位或直接预约。

### TableCheck

2026-09-24独立审查补充：已接纳的英文、日文及无语言前缀预约表单统一核对实时日期/人数；控件更新本身不证明库存更新。表单库存仅复用既有同店且绑定日期、人数、时段的来源链接/控件证据，不以合成结果容器属性声明真实站点能力。旧请求、加载中、仅范围外时段或无法证明完整时段的空结果保持UNKNOWN。Adapter回归和真实Chromium本地异步Fixture通过；真实库存及整单仍未证明。[审查](../history/LIVE-PLAYBOOK-INDEPENDENT-REVIEW-2026-09-24.md)。

- [System Integration](https://www.tablecheck.com/en/join/features/integrate-your-systems/)

官方说明存在API集成，但MVP在获得实际访问条款和凭证前按`requires partnership`处理。

## 更新规则

2026-09-06 Live Read-only补充：用户成功URL与项目旧入口有语言路径差异。fresh headed Chromium下旧`/rstLst/`有无query均Cloudflare 403 challenge，英文`/en/rstLst/`200；只改路径保留`sk`也200，但关键词实测有效参数为`sw`。Adapter现使用英文`/en/rstLst/?sw=<encoded outlet name>`；同时依据真实页面观察排除评论数量链接误识别。修复后fresh headless搜索200并抽取5个餐厅详情链接。两个对照词分别有结果和零结果，均不建立HIGH identity/availability。TableCheck只验证首页200；H001仍待重验。未调整routing、Cookie或挑战处理；不能根据路径差异反推站点内部WAF规则。脚本与脱敏结果在Git忽略的`.eval-artifacts/tabelog-network-diagnostic/`，没有保存原始HTML或新增Replay。

每个Adapter上线前记录：能力范围、测试餐厅、页面/接口版本、最后实测、验证信号、接管点、失败率、Kill Switch和负责人。能力变化必须更新本文和相关Harness场景。

## 单页浏览器诊断

[Browser Read Diagnostics](../harness/BROWSER-READ-DIAGNOSTICS.md)维护独立入口、证据字段与测试映射。LOCAL_CHROMIUM单独interactive使用临时profile；interactive与manual-intervention同时开启才使用ADR-0016专用持久eval profile。真实Chromium本地Fixture不等于真实来源验证；单页观察不写Task State、不产出Offer。


## 2026-09-16 Browser control permission clarification

Checkbox/range runtime support is not permission to operate arbitrary controls. The shared Executor requires a source-owned `permitQueryControl` classification for SET_CHECKED / ADJUST_RANGE; unknown effects are denied. The reviewed page-wide GET policy was removed: TableCheck/Tabelog grant no checkbox/range permission until positive source control contracts are verified. Positive coverage is still Synthetic real-Chromium only; this wiring does not establish current Live website compatibility, map support, booking or consent authority. [Harness scope](../harness/BROWSER-READ-DIAGNOSTICS.md).

## 2026-09-16 Verified TableCheck query contract

替代上述“TableCheck 全部拒绝”的当前结论：英文 `/en/japan/search` 的 Budget/Cuisine 特定 dialog/form 结构已实测，允许 cuisines checkbox、0–15 双 slider 和对应 Update。代码固定当前 form class，变化时拒绝，不泛化到 GET 或预约页。真实勾选/反选和预算效果通过，3-call 模型筛选通过；H001 有一个核验 offer。Tabelog 日期普通段落未进入通用观察、人数数字含义不足，模型场景未通过；仍不开放其 checkbox/range。详见 [本轮验证](../history/BROWSER-AGENT-VALIDATION-2026-09-16.md)。

## 2026-09-16 Tabelog controls / TableCheck empty results

Tabelog English outlet calendars have source-owned nonstandard date/guest hints and readiness checks through the shared Registry. Happo Live selection of 2026-09-20 / 4 guests passes; inventory is not established. Ordinary external links are not external booking evidence.

TableCheck guide parsing binds one ready Venue Availability widget's selected full date, pax and time to its explicit empty message. Loading, duplicate regions, wrong requests and wider time-window inferences fail closed. Sushi Inase Live: NO_MATCHING_SLOT for 2026-09-16 / 2 guests / 19:00 only. data-state=disabled targets are excluded. [Evidence](../history/BROWSER-AGENT-VALIDATION-2026-09-16.md).

## 2026-09-16 inventory and cross-page facts follow-up

Tabelog now separates query controls from stock: live-selected date/party and passive allowlisted GET JSON must agree, with merchant/date/party/time checked on every returned booking URL. No booking URL is opened; empty unbound responses remain UNKNOWN. Traversing other outlet results cannot leave actions on the wrong branch. Phone-bound Google-listed website headings may supply a search alias, never identity evidence. Happo 9/20 / 4 guests has a verified five-slot Live result; the first Maru result was invalidated for a cross-branch error, and subsequent evidence is kept separately.

The shared Registry supports read-only ARIA comboboxes and options. Disabled selected dates remain state evidence; equivalent already-selected triggers are removed from the model's next-step choices. Native POST submission remains rejected. This is browser-read UI support, not permission for arbitrary website writes.

Google-listed website reads can bind multilingual pages by one exact visible public phone. Cancellation definition lists and complete named Tabelog/OWST course cards retain scope and source; cross-page observations are grounded separately. Live Happo root cancellation rules and `/courses` prices were both retained. Listed course prices do not establish query-qualified plan availability or a locked booking price. New-merchant identity/discovery failures remain UNKNOWN; see [final review](../history/BROWSER-AGENT-FINAL-REVIEW-2026-09-16.md) for the current run outcomes and limitations.

Final control contract: browser action wire@3 / prompt@4 supports selecting an observed time option only inside the Router-bound window; generic CLICK cannot bypass this check. TableCheck slot links must belong to the current outlet, date and party; nearby-time links alone do not complete a different requested window. Actual Budget Reset now clears URL budget parameters and reopens at 0–15, separately verified without a model.

TableCheck current empty-window evidence also accepts a complete half-hour card sequence explicitly disabled inside the one ready, request-bound guide widget. Missing cards, loading, duplicate widgets, different date/party and a selected time outside the allowed window remain unknown. Actual model Live on Happo 9/19 / 4 guests now finishes with NO_MATCHING_SLOT for 18:30-19:30 while preserving the fact that later slots exist. Earlier dated progress sections are historical checkpoints; the [final review](../history/BROWSER-AGENT-FINAL-REVIEW-2026-09-16.md) supersedes their unfinished control/inventory descriptions.

2026-09-26独立真实验证补充：四个真实DeepSeek/本地受控DOM场景通过，但三个真实来源时间控件探针均未完成目标。Tokyo guide的readonly input为值为空的焦点proxy，选择19:00后页面显示17:30；OpenTable在导航阶段HTTP/2失败，控件兼容性未评。独立本地Chromium证实观察后DOM插入会使Registry的nth引用指向错误选项；最终ElementHandle绑定、变化拒绝和原循环重新观察已通过本地复核（完整41/41），最终修复后未新增外部模型/Live。当前不能声明通用跨网站Live通过或H001完成。[独立验收与限制](../history/BROWSER-GENERIC-INDEPENDENT-REVIEW-2026-09-26.md)。
