# MVP User Flows

- Status: Accepted
- Version: 0.3
- Last updated: 2026-08-10
- Source of truth for: 用户可见流程、确认点和终态
- Related ADRs: [ADR-0004](../decisions/0004-single-candidate-authorization.md), [ADR-0006](../decisions/0006-web-first-agent-workspace.md)
- Related documents: [MVP PRD](MVP-PRD.md), [Restaurant Domain](../domains/RESTAURANT-BOOKING.md)

## 搜索与预约

```mermaid
flowchart TD
    A["用户提出东京餐厅目标"] --> B["解析并结构化约束"]
    B --> C{"缺少阻塞信息？"}
    C -- "是" --> D["只追问必要问题"]
    D --> B
    C -- "否" --> E["跨来源搜索与实体合并"]
    E --> F["分批检查真实空位与预约能力"]
    F --> G{"找到可执行候选？"}
    G -- "否" --> H["建议调整时间、区域或预算"]
    H --> I{"用户调整？"}
    I -- "是" --> E
    I -- "否" --> X1["终态：保存但未预约"]
    G -- "是" --> J["展示最多 3 家候选"]
    J --> K{"用户选择一家？"}
    K -- "修改需求" --> B
    K -- "暂不预约" --> X2["终态：保存但未预约"]
    K -- "Book this" --> K1{"存在已声明的过敏Hard Constraint？"}
    K1 -- "是" --> K2["展示过敏披露 Consent Card"]
    K2 --> K3{"用户确认本次披露与预约？"}
    K3 -- "否" --> J
    K3 -- "是" --> L["创建一次性 Authorization"]
    K1 -- "否" --> L
    L --> M["重新验证空位和条款"]
    M --> N{"发生实质变化？"}
    N -- "是" --> O["展示变化并重新确认"]
    O -- "拒绝" --> J
    O -- "接受" --> P["准备预约"]
    N -- "否" --> P
    P --> Q{"需要用户接管？"}
    Q -- "是" --> R["Human Takeover"]
    R --> S["恢复并校验 Checkpoint"]
    Q -- "否" --> T["提交一次"]
    S --> T
    T --> U{"平台结果"}
    U -- "明确成功" --> V["验证回执"]
    U -- "等待餐厅确认" --> W["PENDING_PROVIDER_CONFIRMATION"]
    U -- "明确失败" --> J
    U -- "结果不明" --> Y["OUTCOME_UNKNOWN：停止重试"]
    W --> Z{"最终结果"}
    Z -- "接受" --> V
    Z -- "拒绝" --> J
    Z -- "仍等待" --> W
    V --> AA["BOOKED_VERIFIED"]
    AA --> AB["保存预约、取消入口和路线"]
    AB --> X3["终态：Outcome 完成"]
```

## 跨会话与Mobile Web恢复

```mermaid
flowchart TD
    A["用户在Desktop或Mobile Web开始"] --> B["创建Conversation与Restaurant Case"]
    B --> C["Case关联权威Root Task"]
    C --> D["显示Conversation、Artifact与Activity"]
    D --> E{"页面关闭、断线或换设备？"}
    E -- "否" --> F["继续当前流程"]
    E -- "是" --> G["重新认证并打开Case Deep Link或Case列表"]
    G --> H["从服务端读取最新Task、Authorization与Attempt"]
    H --> I["重建Case、Artifact与Activity；不依赖旧前台Session"]
    I --> J{"需要用户行动？"}
    J -- "是" --> K["进入Needs You并展示具体Action"]
    J -- "否" --> F
    K --> L["用户在Mobile Web选择、补充、授权或接管"]
    L --> F
```

恢复页面不得只重放聊天文本来推断当前状态。陈旧Case版本、已使用Authorization或已结束Attempt必须显示服务端最新结果，不能再次提交。

## 取消

```mermaid
flowchart TD
    A["已有已验证预约"] --> B["读取取消入口、费用和截止时间"]
    B --> C{"用户确认取消？"}
    C -- "否" --> A
    C -- "是" --> D["执行一次取消"]
    D --> E{"取消结果"}
    E -- "明确成功" --> F["CANCELLED_VERIFIED"]
    E -- "明确失败" --> G["保留原预约并提示失败"]
    E -- "不明确" --> H["停止重试并进入 NEEDS_ATTENTION"]
```

## 修改

```mermaid
flowchart TD
    A["已有已验证预约"] --> B["搜索新的可订方案"]
    B --> C{"找到新方案？"}
    C -- "否" --> A
    C -- "是" --> D["展示新方案与旧单取消风险"]
    D --> E{"用户确认？"}
    E -- "否" --> A
    E -- "是" --> F["创建并验证新预约"]
    F --> G{"新预约成功？"}
    G -- "否" --> A
    G -- "是" --> H["取消旧预约"]
    H --> I{"旧预约取消成功？"}
    I -- "是" --> J["变更完成"]
    I -- "否或不明" --> K["保留两个预约状态并提示双重预约风险"]
```

## 用户确认点

1. 候选卡 `Book this`：选择并授权一家；若已声明过敏Hard Constraint，先进入过敏披露Consent Card。
2. 过敏披露Consent Card：确认对外发送的最小过敏信息，可补充说明；未确认不得提交该候选的预约或请求。
3. 条款实质变化：重新授权。
4. 登录、验证码、银行卡、3DS、CAPTCHA：用户接管，不扩大授权。
5. 取消：单独确认取消费用和影响。
6. 修改：确认新预约与旧单取消风险。
7. 跨设备恢复：重新认证只恢复访问权，不自动批准Pending Action。
