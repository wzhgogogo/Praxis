# Integration Capability Matrix

- Status: Accepted
- Version: 0.4
- Last updated: 2026-08-13
- Source of truth for: 外部平台可用能力、证据和限制
- Related ADRs: [ADR-0002](../decisions/0002-deepseek-model-runtime.md)
- Related documents: [Restaurant Domain](../domains/RESTAURANT-BOOKING.md), [Data & Security](../architecture/DATA-CONTEXT-SECURITY.md)

状态：`verified`表示官方文档确认；`assumed`表示设计假设待实测；`requires partnership`表示存在能力但访问条件未取得；`unsupported`表示当前不纳入。

| Provider | Discovery | Availability | Execute | Cancel | Verify | Takeover | Status / 限制 |
|---|---|---|---|---|---|---|---|
| DeepSeek API | — | — | Tool Call提议 | — | 仅辅助抽取 | — | `verified`连接；v16以Beta strict function承载完整Proposal Schema。Schema只使用DeepSeek strict支持的子集，non-blank等其余规则由本地Validator保证；语义Eval仍必需。历史v15 Regression不能作为v16 Baseline；模型不直接执行工具或写状态 |
| Google Places | 地点与基础信息 | 否 | 否 | 否 | 否 | 否 | `verified`；保存和展示受政策限制，Place ID可保存 |
| Google Routes | — | 交通路线 | 否 | 否 | Route响应 | 否 | `verified`；支持Transit到达/出发时间 |
| Hot Pepper Web Service | 餐厅、区域、预算等 | 未见公开库存API | 未见公开Consumer Booking API | 否 | 否 | 否 | `verified` Discovery；预约需网页或合作能力 |
| Hot Pepper Web | 餐厅页 | 网页可查 | Browser | Browser/管理链接 | 成功页、邮件、订单状态 | 登录/验证/支付 | `assumed`，需逐流程Adapter验证；Request Booking不是即时成功 |
| TableCheck API | 有集成能力 | 可能 | 可能 | 可能 | 可能 | 取决于流程 | `requires partnership`；不作为MVP无条件依赖 |
| TableCheck Web | 预约页 | 网页可查 | Browser | Browser/管理入口 | 成功页、邮件 | 登录/卡/3DS | `assumed`，需受控实测与Adapter健康检查 |
| Restaurant Website | 链接/页面 | 视网站 | Verified Browser Adapter | 视网站 | 视网站 | 常见 | `assumed`；未知网站降级为Takeover或Deep Link |
| Phone-only Restaurant | 可能 | 电话 | 否 | 否 | 用户/餐厅确认 | 用户 | `unsupported`于MVP |

## 官方来源

### DeepSeek

- [Chat Completion API](https://api-docs.deepseek.com/api/create-chat-completion)
- [Tool Calls](https://api-docs.deepseek.com/guides/tool_calls)
- [Models and Pricing](https://api-docs.deepseek.com/quick_start/pricing/)

DeepSeek标准JSON Output只保证生成合法JSON，不接收完整`json_schema`。官方Beta strict function calling可校验Function JSON Schema；v16因此用一个强制、不可执行的function envelope传输Restaurant Proposal，并要求唯一匹配的`tool_calls`。Schema不得使用strict不支持的约束（例如string的`minLength`/`maxLength`）；本地Proposal Validator仍处理这些无法在传输层表达的语义和不可信输出，语义正确性由Eval单独判断。这不是`LLM → Tool`执行路径：Gateway只提取arguments。模型名和能力可能变化，运行时必须固定并记录版本。

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

每个Adapter上线前记录：能力范围、测试餐厅、页面/接口版本、最后实测、验证信号、接管点、失败率、Kill Switch和负责人。能力变化必须更新本文和相关Harness场景。
