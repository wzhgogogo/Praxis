# Tokyo Restaurant Agent MVP PRD

- Status: Accepted
- Document revision: 0.3
- Last updated: 2026-09-05
- Source of truth for: 第一版产品范围、用户承诺和验收标准
- Related ADRs: [ADR-0004](../decisions/0004-single-candidate-authorization.md), [ADR-0006](../decisions/0006-web-first-agent-workspace.md)
- Related documents: [User Flows](USER-FLOWS.md), [Restaurant Domain](../domains/RESTAURANT-BOOKING.md), [Data, Context & Security](../architecture/DATA-CONTEXT-SECURITY.md)

## 产品定义

Praxis第一版是一个Responsive English Web Agent，同时支持Desktop与Mobile浏览器。用户用自然语言描述东京餐厅需求，Praxis建立可跨会话恢复的Case并寻找真实可订候选；用户从候选中选择并授权一家后，Praxis通过API、Browser Agent或Human Takeover推进预约，验证结果并准备路线。

核心价值不是“比 Google Maps 更会推荐”，而是继续完成 Google Maps、Hot Pepper、TableCheck 和餐厅官网之间断裂的执行链路。

## 目标用户

- 使用英文 Web 交互。
- 可以在Desktop或Mobile浏览器开始、继续和接管同一Case。
- 希望预订东京餐厅。
- 不按国籍、居民或游客细分。
- 能提供真实联系方式，并在登录、验证码、银行卡或条款确认时接管。

本阶段验证 Agent 能力和用户价值，不据此宣称某一用户细分已达到 PMF。

## 核心闭环

```text
自然语言需求
→ 建立可恢复的Conversation与Restaurant Case
→ 补齐阻塞信息
→ 跨来源搜索与实体合并
→ 检查指定时间、人数的真实空位
→ 约 30 秒内返回最多 3 家可执行候选
→ 用户选择并授权一家
→ 提交前重新验证
→ API / Browser / Human Takeover
→ 读取并验证回执
→ 保存预约、取消入口、路线与出发时间
→ 在Case与Activity Timeline中持续显示状态和下一步
```

## P0 功能

1. 提取日期、时间窗口、人数、区域、菜系、预算和用户明确提出的特殊要求；特殊要求不阻塞普通初步推荐，但一经声明的安全关键要求不得静默放宽。
2. 只追问会阻塞搜索或预约的信息。
3. 并行搜索多个来源，合并同店与不同分店。
4. 最终候选必须标记空位查询时间、价格依据、条款和执行方式；来源提供过敏处理信息时，候选卡须清晰展示处理状态、来源和确认要求。
5. 只展示已验证空位且存在预约路径的可执行候选；不足 3 家时透明返回实际数量。
6. 用户只选择并授权一家，不授权自动换店。
7. 提交前重新验证空位和条款；发生实质变化时重新确认。
8. 无API网站的浏览与受控操作是核心建设方向；有API可优先使用，无API时使用支持的Browser Adapter；登录、验证码、银行卡、3DS、CAPTCHA 和新增高风险条款触发 Human Takeover。
9. 只有强完成信号存在时进入 `BOOKED_VERIFIED`。
10. 预约失败或空位消失时刷新候选并让用户重新选择。
11. 支持取消；修改统一为“创建并验证新预约，再取消旧预约”。
12. 预约验证后提供 Google Maps 路线、交通时间和建议出发时间。
13. 用户可以关闭页面后恢复同一Case，并看到最新候选、状态、下一步和关键Activity。
14. Web提供`Active / Needs You / Waiting / Completed`视图；选择、授权、条款变化和Human Takeover可在Mobile Web完成。
15. Conversation、解释文本和模型Working Plan不作为权威预约状态；Case视图必须从服务端Task、Authorization、Attempt、Evidence和Outcome投影。

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
