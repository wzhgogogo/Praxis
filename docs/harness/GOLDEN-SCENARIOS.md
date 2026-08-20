# Golden Scenarios

- Status: Accepted
- Document revision: 0.9
- Last updated: 2026-08-19
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
