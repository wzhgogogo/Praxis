# Integration Capability Matrix

- Status: Accepted
- Document revision: 1.19
- Last updated: 2026-09-21
- Source of truth for: 外部平台可用能力、证据和限制
- Related ADRs: [ADR-0002](../decisions/0002-deepseek-model-runtime.md)
- Related documents: [Restaurant Domain](../domains/RESTAURANT-BOOKING.md), [Data & Security](../architecture/DATA-CONTEXT-SECURITY.md)

状态：`verified`表示官方文档确认；`assumed`表示设计假设待实测；`requires partnership`表示存在能力但访问条件未取得；`unsupported`表示当前不纳入。

| Provider | Discovery | Availability | Execute | Cancel | Verify | Takeover | Status / 限制 |
|---|---|---|---|---|---|---|---|
| DeepSeek API | — | — | Tool Call提议 | — | 仅辅助抽取 | — | `verified`连接；Semantic与Agent使用Beta strict function。strict wire object的所有字段均为required并关闭additional properties，Domain再恢复canonical可选字段；non-blank等其余规则由本地Validator保证。安全诊断保留status/request ID/code/type/脱敏message，模型不直接执行工具或写状态 |
| Google Places API (New) | Live Text Search Discovery；已知Place ID的Place Details事实重读（代码实现；尚待本切片Live实测） | 无库存；可返回常规营业时段及网站指针 | 否 | 否 | 否 | 否 | `verified`官方HTTP/FieldMask契约；Praxis只请求最小字段、结构化address components、电话、类型、`regularOpeningHours`及Place Details的`websiteUri`。命名“附近”地点先在同一run额度内解析坐标，再以记录的半径距离判断；只有多个同名坐标结果才请求消歧。事实重读只用已保存Place ID，不以名称再次搜索；命名地点解析、Discovery和Details在同一持久task run累计请求且按三类导出，失败的已发送请求也计数，不同task run隔离。调试用本地请求上限不等于Google账户配额：本地耗尽、429限流、403配额或权限拒绝及网络失败以不同稳定码保存。`websiteUri`只是Google列出的网站指针，不是Google Maps URL、更不是官方事实或页面内容。UNKNOWN不会变成无位；常规营业时段不能表示当前营业、特殊日期营业或有桌；内容保存和展示仍受Google政策限制 |
| Cloudflare Browser Run | 浏览器基础设施（代码实现；一次live会话建立失败已记录） | 通过受限Browser Executor读取 | 否 | 否 | 否 | 否 | CDP远程浏览器；Kitesurf为首选Beta引擎，发生一次兼容/运行时失败才回退Chromium；不绕过bot challenge。会话未建立的稳定失败为`BROWSER_RUNTIME_FAILED`/`BROWSER_TIMEOUT`，不得伪报为目标网页或门店identity事实 |
| Local Playwright Chromium | 仅开发/eval浏览器基础设施 | 通过同一受限Browser Executor读取 | 否 | 否 | 否 | 否 | 仅当`PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM`显式选择；不访问Cloudflare、不读取其凭证、不改变Cloudflare AUTO。要求本机已安装Playwright Chromium binary；缺失时稳定`BROWSER_RUNTIME_UNAVAILABLE`，不回退远端Provider。两个eval-only interactive gate同时开启时，headed `launchPersistentContext`固定使用gitignored `.eval-artifacts/local-chromium-profile`，人手验证期间保留同一page/context/browser；正常结束只关闭session，不自动删除profile。共享`browser_read_action@3`可在同一会话回读观察到的 checkbox、range 与 region scroll，modal 背景目标不可执行；已观察`target=_blank`公开链接在同一context切换active page后必须重新观察。2026-09-16仅真实本地 Fixture 验证这些契约，不代表来源identity、slot或availability已验证 |
| Tabelog Web | 来源页 | 只读开发期Availability Executor（代码实现；页面兼容性部分实测） | 否 | 否 | 否 | Eval-only terminal pause | 仅限Tabelog域名；结果页只接受可识别的restaurant-result链接，relative/canonical outlet URL在门店页补全身份，只有exact phone或name+address可HIGH匹配，已知电话号码冲突直接拒绝；日本显式`+81`号码与国内格式规范后才比较。只接受明确标记available的slot控件。实体非HIGH、CAPTCHA/`Just a moment...` challenge、页面异常、未确认的日期/人数、超时或外部跳转均不是`UNAVAILABLE`；challenge先于identity归类为`BOT_CHALLENGE`。2026-09-07 H001已读到真实详情，Sushisho Isseki Sancho以exact phone达HIGH，但其availability转至当前不支持的外部预约Provider，因此没有slot或Offer。仅在显式local interactive eval中，adapter发送脱敏`USER_INTERVENTION_REQUIRED`、终端等待用户手动完成站点验证并仅snapshot同一页面；没有CAPTCHA自动化、stealth、自动retry或cookie/token记录。eval artifact仅保存脱敏identity diagnostics，不保存HTML。Browser会话建立失败不构成实体不确定。生产适用性须经兼容性、可靠性和法律约束单独验证 |
| Google Routes | — | 交通路线 | 否 | 否 | Route响应 | 否 | `verified`；支持Transit到达/出发时间 |
| Hot Pepper Web Service | 餐厅、区域、预算等 | 未见公开库存API | 未见公开Consumer Booking API | 否 | 否 | 否 | `verified` Discovery；预约需网页或合作能力 |
| Hot Pepper Web | 餐厅页 | 网页可查 | Browser | Browser/管理链接 | 成功页、邮件、订单状态 | 登录/验证/支付 | `assumed`，需逐流程Adapter验证；Request Booking不是即时成功 |
| TableCheck API | 有集成能力 | 可能 | 可能 | 可能 | 可能 | 取决于流程 | `requires partnership`；不作为MVP无条件依赖 |
| TableCheck Web | 公开的`/en/japan/search`按候选名称和Google坐标发现渲染出的guide页链接 | H001只读Browser Adapter（已在原始 H001 得到一个完整 grounded slot） | 否 | 否 | 否 | 受控模型接管仅限同一会话中已观察到的只读目标 | 固定优先于Tabelog。搜索排序只限制待读取页面，不构成identity；详情页必须以JSON-LD/DOM/tel link的Google exact phone或name+full address达到HIGH。预约页只接受详情页实际链接或其嵌入的公开Availability结构，绝不派生slug；仅设置只读日期/人数参数并读取明确bookable slot。公开`/en/japan/search`上的已观察 checkbox/range 仅在GET form且通过来源代码持有的查询控制许可时可调整；同意条款、营销、登录、支付、预订和未知作用控件一律拒绝，模型理由或页面文案不能授权。`TABLECHECK_DISCOVERY_NO_RESULT`、`TABLECHECK_DISCOVERY_INCOMPLETE`、`TABLECHECK_ENTITY_MATCH_UNCERTAIN`、`TABLECHECK_PAGE_UNAVAILABLE`和`TABLECHECK_PARSE_FAILED`分开保留；`PAGE_UNAVAILABLE`仅可由错误页title/primary heading证明，不能由正文数字或任意`not found`字样触发。搜索页未抽取链接时同一session交给受限模型，artifact记录交接原因、观察、动作和动作后验证；耗尽后才退出该来源。2026-09-08冻结 H001 在 KINKA Sushi Bar Izakaya 渋谷通过Google exact phone达到HIGH，回读`2026-09-08`、2 人、`19:00`的公开可订slot，并进入`PRESENT_RESULTS`；这只证明该次来源/库存，不保证其他门店、日期或Web UI已验收。没有登录、个人资料、支付、点击确认或提交。identity、日期/人数或slot不确定时fail closed。TableCheck API仍`requires partnership` |
| Google-listed Restaurant Website | 仅已发现候选的Google `websiteUri` | 有界只读的JSON-LD或窄范围可见主营/营业字段 | 否 | 否 | 否 | 否 | 代码实现、尚待本切片Live实测。仅复用受控只读Browser Executor打开HTTP(S)同源网址，移除query/fragment并拒绝凭据、跨源跳转及不安全控件。候选名称加地址包含，或同序门牌加可用地域词对应，才可建立HIGH identity；门牌数字本身、同名、缺地址或明确不同城市/街区均为UNKNOWN。JSON-LD是快捷路径，不会遮住同页可见事实；身份确认后才接纳明确标注的公开套餐价/税费、包间低消、取消和no-show字段，裸金额不推断；字段彼此不派生。只保存URL、观察时间、候选关联与DOM摘要指纹，不保存原始页面文本。派生`MODEL_JUDGMENT`只保存到原始来源事实的引用链，不伪装为页面来源。Google Maps URL、Google列出的网址或模型结论都不单独证明官网/门店事实；失败为candidate-scoped UNKNOWN，绝不构成无位 |
| Phone-only Restaurant | 可能 | 电话 | 否 | 否 | 用户/餐厅确认 | 用户 | `unsupported`于MVP |

Web workspace lifecycle: `LIVE_READ` uses one visible, in-process bounded run per Case. The user may stop that read; cancellation is relayed to source calls and is recorded as a local read outcome, not a provider cancellation. A server restart does not resume an orphaned run. This is an application lifecycle boundary, not an external reservation capability.

P0 challenge-recovery update (offline contract only): after a TableCheck or Tabelog page has independently established a candidate's HIGH outlet identity, one source-observed canonical or alternate-language HTTPS outlet URL may be read on a challenge. The alternate is never synthesized and must independently re-establish HIGH identity; a branch mismatch, absent alternate or a second challenge returns provider-scoped `BOT_CHALLENGE` while retaining the earlier identity as identity-only evidence. When its corresponding eval handler is explicitly configured, an adapter may emit at most one `USER_INTERVENTION_REQUIRED` pause per candidate/provider. Source failures still permit the resolver's next provider; parent abort, global model-budget exhaustion and `BROWSER_RUNTIME_UNAVAILABLE` propagate as task-level failures. This change has no Live verification and adds no CAPTCHA automation, booking, or external write capability.

Google discovery/grounding update (offline contract only): discovery sends a strict rectangle restriction, while grounding applies the exact requested radius; rejected out-of-radius or missing-coordinate observations remain diagnostic-only. A named-place suffix can contribute only with a compatible provider type and independent geographic context; address text, rank or administrative-area labels cannot substitute. This evidence is synthetic/offline and makes no Live Google claim.


Mock contract update (2026-09-15): the Google→website fact composition retains both source attempts even when the website returns no evidence. Failed refreshes invalidate prior compound-read facts; source history stays auditable. The actual Google/website/TableCheck/resolver composition is covered by H001–H005 synthetic HTTP/page fixtures and independent artifact diagnostics. This is offline contract coverage and makes no new Live capability claim.

Live/control update (2026-09-15): the first current H003 read performed one Google discovery and ten Place Details requests. All ten website attempts remained unknown (nine identity-unverified, one read failure); all ten availability checks remained UNKNOWN, not confirmed unavailable. Three HIGH-identity TableCheck candidates reached model-directed party selection but exposed a local runtime bug: opaque observed DOM references were parsed as CSS selectors. Local and Cloudflare session fill/select now resolve those references through the existing control registry. Actual executor plus local Chromium fixtures pass for both session implementations; Cloudflare remote service has not been retested. The follow-up H003 eliminated DOM-reference CSS errors but five custom comboboxes still failed because they were operated as native selects; all ten website identities and all ten inventories remained unverified. Both runs ended NO_VERIFIED_RESULT with no independently qualified result. Live execution and outstanding source/model gaps are recorded separately in [STATUS](../STATUS.md) and [TEST-LOG](../history/TEST-LOG.md). This does not establish general website identity, ten-person inventory or successful reservations.

## 官方来源

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
