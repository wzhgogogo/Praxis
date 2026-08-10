# Policy, Execution and Verification

- Status: Accepted
- Version: 0.2
- Last updated: 2026-08-07
- Source of truth for: 授权、副作用控制、执行路由、验证和恢复
- Related ADRs: [ADR-0004](../decisions/0004-single-candidate-authorization.md)
- Related documents: [Task Runtime](TASK-RUNTIME.md), [Restaurant Domain](../domains/RESTAURANT-BOOKING.md)

## Action与授权

```ts
type ActionProposal = {
  id: string;
  taskId: string;
  actionType: "BOOK" | "CANCEL" | "PURCHASE" | "RETURN" | "SEND" | "SUBMIT_APPLICATION";
  target: { type: string; id: string; counterparty?: string };
  amount?: { value: number; currency: string };
  termsHash: string;
  risk: "LOW" | "MEDIUM" | "HIGH";
  reversible: boolean;
};

type Authorization = {
  id: string;
  proposalId: string;
  scope: "ONE_TIME" | "STANDING";
  constraints?: Record<string, unknown>;
  approvedAt: string;
  expiresAt: string;
  revokedAt?: string;
};
```

Runtime从Schema层预留`STANDING`，Restaurant MVP只允许`ONE_TIME`。

## Policy Engine

Policy完全由代码执行。至少检查：

- 当前Task State是否允许Action；
- Authorization是否存在、有效、未撤销；
- Target、金额、条款和资料版本是否匹配；
- Offer和Capability是否仍健康；
- 是否存在冲突的Active Attempt或`OUTCOME_UNKNOWN`；
- Action风险是否要求Human Takeover或再次确认。

Prompt中的安全要求不是Policy。

## Execution Router

按Capability选择：

```text
Partner API
→ Verified Browser Adapter
→ Human Takeover
→ Deep Link
```

API和Browser Adapter实现统一的prepare/commit/verify/cancel边界。`prepare`可自动执行，`commit`必须持有有效Authorization。

## Browser与Takeover

- 每个Attempt使用隔离浏览器Profile。
- Verified Adapter优先使用语义选择器和页面Invariant。
- 未知页面模型只能提出单步Action。
- 登录、验证码、银行卡、3DS、CAPTCHA和新增高风险条款触发接管。
- 接管期间停止敏感DOM、截图和按键日志采集。
- 用户结束接管后Adapter重新验证Checkpoint。
- Profile在终态后销毁。

## Retry矩阵

| 阶段 | 自动重试 |
|---|---|
| Discovery/只读API | 有界重试 |
| Availability读取 | 有界重试 |
| 提交前页面准备 | 从安全Checkpoint恢复 |
| 点击提交前失败 | 可以重新准备 |
| 点击提交后超时/断网 | 禁止再次提交，只能Verify |
| 取消后结果不明 | 禁止再次取消，只能Verify |

## Evidence与Outcome

Restaurant Mock切片已实现Domain-owned `BookingProofBundle`和确定性Completion Verifier。Core Execution不解释餐厅字段；Adapter/页面解析只产生Observation和Claims，Verifier重新计算匹配、缺失与冲突字段后才能产生Outcome。

强Evidence：

- 成功页包含匹配预约编号、餐厅、时间、人数；
- 平台订单页显示已确认；
- 确认邮件包含匹配信息。

弱Evidence：

- 表单已提交；
- 请求已发送；
- 无匹配字段的感谢页。

弱Evidence只能进入`PENDING_PROVIDER_CONFIRMATION`或`OUTCOME_UNKNOWN`。DeepSeek可以提取字段，Verifier根据Domain规则判定。

`BOOKED_VERIFIED`当前必须同时满足：

- Evidence为`STRONG`；
- Evidence的`attemptId`匹配活动Execution Attempt；
- 预约编号或等价Provider Reference存在；
- Restaurant Outlet、日期时间和人数与已授权Candidate一致；
- Claims状态为`CONFIRMED`；
- `missingFields`和`conflictingFields`均为空。

Verifier不信任Adapter预填的匹配结果，会根据Candidate和Execution Result重新计算。任何Attempt、分店、时间、人数或Provider Reference冲突都进入`OUTCOME_UNKNOWN`，不能宣布成功。

## 取消与变更Saga

取消前展示费用并获得单独Authorization。修改按以下Saga：

```text
搜索新方案
→ 用户授权
→ 创建并验证新预约
→ 取消旧预约
→ 验证旧单取消
```

新单成功但旧单取消失败时，不补偿性取消新单；保留两个预约，进入`NEEDS_ATTENTION`并明确提示双重预约风险。
