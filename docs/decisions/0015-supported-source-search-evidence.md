# ADR-0015: Supported-source search evidence

- Status: Accepted
- Document revision: 1.0
- Last updated: 2026-09-05
- Source of truth for: 只读结果的跨来源门店身份与空位证据范围
- Related documents: [ADR-0014](0014-search-only-results-completion.md)、[Restaurant Domain](../domains/RESTAURANT-BOOKING.md)、[Capability Matrix](../integrations/CAPABILITY-MATRIX.md)

## Context

ADR-0014将身份写为Google-to-Tabelog，当前来源链已有TableCheck与Tabelog。用户要求执行仓库整改，保留无API网站的浏览与受控操作目标并解决证据范围冲突。

## Decision

仅替代ADR-0014中限定Tabelog的身份要求。`PRESENT_RESULTS`可依据Google候选与受支持预约来源之间的HIGH同Outlet身份；仍要求权威请求对应的地点、每个positive HARD criterion、日期/人数/时段和新鲜可订slot。具体平台和验证范围见Capability Matrix，支持接口不等于已验证Live能力。

每个Offer绑定同一候选和来源门店；来源失败不伪报没有空位。不得以不同门店、过期请求或无来源的事实拼成成功。TableCheck→Tabelog是Restaurant Router内部固定只读来源链，不是模型动态选择Provider或通用注册平台。

Runtime仍写入结果终态；模型和Adapter不拥有State或成功解释权。不改变Booking、授权、Policy、Outcome、HARD条件，不增加外部写入或修改标注集。

## Consequences

下层设计与已有双来源实现有一致权威依据。H001仍需完整真实证据链；固定URL诊断、人工报告、Mock、Replay不能替代它。

## Alternatives considered

- 强制只用Tabelog：不符合已有第二来源与产品目标。
- 降低身份或空位证明：会产生错误成功，拒绝。
- 原地改写ADR-0014：破坏历史Decision，拒绝。
