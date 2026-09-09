# Integration Capability Matrix

- Status: Accepted
- Document revision: 1.7
- Last updated: 2026-09-08
- Source of truth for: 外部平台可用能力、证据和限制
- Related ADRs: [ADR-0002](../decisions/0002-deepseek-model-runtime.md)
- Related documents: [Restaurant Domain](../domains/RESTAURANT-BOOKING.md), [Data & Security](../architecture/DATA-CONTEXT-SECURITY.md)

状态：`verified`表示官方文档确认；`assumed`表示设计假设待实测；`requires partnership`表示存在能力但访问条件未取得；`unsupported`表示当前不纳入。

| Provider | Discovery | Availability | Execute | Cancel | Verify | Takeover | Status / 限制 |
|---|---|---|---|---|---|---|---|
| DeepSeek API | — | — | Tool Call提议 | — | 仅辅助抽取 | — | `verified`连接；Semantic与Agent使用Beta strict function。strict wire object的所有字段均为required并关闭additional properties，Domain再恢复canonical可选字段；non-blank等其余规则由本地Validator保证。安全诊断保留status/request ID/code/type/脱敏message，模型不直接执行工具或写状态 |
| Google Places API (New) | Live Text Search Discovery（代码实现；尚待完整H001证据链实测） | 否 | 否 | 否 | 否 | 否 | `verified`官方HTTP/FieldMask契约；Praxis只请求最小字段、结构化address components和电话作门店核验；整个fetch/body路径有hard deadline，area HARD evidence必须由匹配的结构化address component建立，Place ID可保存，内容保存和展示仍受Google政策限制 |
| Cloudflare Browser Run | 浏览器基础设施（代码实现；一次live会话建立失败已记录） | 通过受限Browser Executor读取 | 否 | 否 | 否 | 否 | CDP远程浏览器；Kitesurf为首选Beta引擎，发生一次兼容/运行时失败才回退Chromium；不绕过bot challenge。会话未建立的稳定失败为`BROWSER_RUNTIME_FAILED`/`BROWSER_TIMEOUT`，不得伪报为目标网页或门店identity事实 |
| Local Playwright Chromium | 仅开发/eval浏览器基础设施 | 通过同一受限Browser Executor读取 | 否 | 否 | 否 | 否 | 仅当`PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM`显式选择；不访问Cloudflare、不读取其凭证、不改变Cloudflare AUTO。要求本机已安装Playwright Chromium binary；缺失时稳定`BROWSER_RUNTIME_FAILED`，不回退远端Provider。两个eval-only interactive gate同时开启时，headed `launchPersistentContext`固定使用gitignored `.eval-artifacts/local-chromium-profile`，人手验证期间保留同一page/context/browser；正常结束只关闭session，不自动删除profile。2026-09-07真实TableCheck单页探针和H001均启动成功；不代表来源identity、slot或availability已验证 |
| Tabelog Web | 来源页 | 只读开发期Availability Executor（代码实现；页面兼容性部分实测） | 否 | 否 | 否 | Eval-only terminal pause | 仅限Tabelog域名；结果页只接受可识别的restaurant-result链接，relative/canonical outlet URL在门店页补全身份，只有exact phone或name+address可HIGH匹配，已知电话号码冲突直接拒绝；日本显式`+81`号码与国内格式规范后才比较。只接受明确标记available的slot控件。实体非HIGH、CAPTCHA/`Just a moment...` challenge、页面异常、未确认的日期/人数、超时或外部跳转均不是`UNAVAILABLE`；challenge先于identity归类为`BOT_CHALLENGE`。2026-09-07 H001已读到真实详情，Sushisho Isseki Sancho以exact phone达HIGH，但其availability转至当前不支持的外部预约Provider，因此没有slot或Offer。仅在显式local interactive eval中，adapter发送脱敏`USER_INTERVENTION_REQUIRED`、终端等待用户手动完成站点验证并仅snapshot同一页面；没有CAPTCHA自动化、stealth、自动retry或cookie/token记录。eval artifact仅保存脱敏identity diagnostics，不保存HTML。Browser会话建立失败不构成实体不确定。生产适用性须经兼容性、可靠性和法律约束单独验证 |
| Google Routes | — | 交通路线 | 否 | 否 | Route响应 | 否 | `verified`；支持Transit到达/出发时间 |
| Hot Pepper Web Service | 餐厅、区域、预算等 | 未见公开库存API | 未见公开Consumer Booking API | 否 | 否 | 否 | `verified` Discovery；预约需网页或合作能力 |
| Hot Pepper Web | 餐厅页 | 网页可查 | Browser | Browser/管理链接 | 成功页、邮件、订单状态 | 登录/验证/支付 | `assumed`，需逐流程Adapter验证；Request Booking不是即时成功 |
| TableCheck API | 有集成能力 | 可能 | 可能 | 可能 | 可能 | 取决于流程 | `requires partnership`；不作为MVP无条件依赖 |
| TableCheck Web | 公开的`/en/japan/search`按候选名称和Google坐标发现渲染出的guide页链接 | H001只读Browser Adapter（已在原始 H001 得到一个完整 grounded slot） | 否 | 否 | 否 | 受控模型接管仅限同一会话中已观察到的只读目标 | 固定优先于Tabelog。搜索排序只限制待读取页面，不构成identity；详情页必须以JSON-LD/DOM/tel link的Google exact phone或name+full address达到HIGH。预约页只接受详情页实际链接或其嵌入的公开Availability结构，绝不派生slug；仅设置只读日期/人数参数并读取明确bookable slot。`TABLECHECK_DISCOVERY_NO_RESULT`、`TABLECHECK_DISCOVERY_INCOMPLETE`、`TABLECHECK_ENTITY_MATCH_UNCERTAIN`、`TABLECHECK_PAGE_UNAVAILABLE`和`TABLECHECK_PARSE_FAILED`分开保留；`PAGE_UNAVAILABLE`仅可由错误页title/primary heading证明，不能由正文数字或任意`not found`字样触发。搜索页未抽取链接时同一session交给受限模型，artifact记录交接原因、观察、动作和动作后验证；耗尽后才退出该来源。2026-09-08冻结 H001 在 KINKA Sushi Bar Izakaya 渋谷通过Google exact phone达到HIGH，回读`2026-09-08`、2 人、`19:00`的公开可订slot，并进入`PRESENT_RESULTS`；这只证明该次来源/库存，不保证其他门店、日期或Web UI已验收。没有登录、个人资料、支付、点击确认或提交。identity、日期/人数或slot不确定时fail closed。TableCheck API仍`requires partnership` |
| Restaurant Website | 链接/页面 | 视网站 | Verified Browser Adapter | 视网站 | 视网站 | 常见 | `assumed`；未知网站降级为Takeover或Deep Link |
| Phone-only Restaurant | 可能 | 电话 | 否 | 否 | 用户/餐厅确认 | 用户 | `unsupported`于MVP |

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
