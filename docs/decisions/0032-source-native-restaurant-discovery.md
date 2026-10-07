# ADR-0032: Source-native restaurant discovery for bounded read-only results

- Status: Accepted; fixed order and mutually exclusive discovery superseded in part by ADR-0037
- Document revision: 1.1
- Last updated: 2026-10-07
- Source of truth for: 原生候选的身份入口与本轮固定来源顺序
- Related documents: [ADR-0015](0015-supported-source-search-evidence.md), [H001 native Playbook](../H001-NATIVE-DISCOVERY-PLAYBOOK.md), [Capability Matrix](../integrations/CAPABILITY-MATRIX.md)

## Context

ADR-0015以Google餐厅候选、跨来源HIGH身份和TableCheck→Tabelog为只读来源链。H001的实际运行表明跨来源候选匹配消耗时间与模型预算；用户要求先验证来源原生发现能否交付同等证据，不建设Google、TableCheck、Tabelog合并候选系统。

## Decision

只读Restaurant搜索可从预约来源自身的公开搜索页取得候选。每个候选须保留来源门店ID、实际观察到的详情入口、详情页自身的名称及完整地址或坐标，并按权威地点范围做精确核验。来源搜索的粗范围不能替代该核验。原生候选只能进入其所属平台的事实与查位读取；详情及预约入口必须再次确认同一门店，不能仅靠原生标记获得HIGH身份。库存仍必须绑定权威日期、人数、时间窗和新鲜度；来源失败仍为UNKNOWN，不代表无门店或无位。

当前H001原生路径固定Tabelog一批，尚未满足既有结果交付条件且全局预算允许时才读TableCheck一批。第二站寻找自己的原生候选，不跨站反查第一站的候选；两个来源不构成通用实体合并。Google仍可解析命名地点，但不负责原生路径的餐厅发现或跨平台餐厅匹配。既有Google候选路径仍按其跨源HIGH规则运行。

本决策仅替代ADR-0015中“必须以Google餐厅候选起步”及其固定TableCheck→Tabelog顺序在此原生路径上的适用性；ADR-0015的HIGH身份、地点、HARD条件、请求绑定、库存和失败不冒充无位的门槛继续有效。Runtime保留结果解释权，浏览器读取无预约写操作。

## Consequences

Router/Runtime/Agent使用现有事件、证据与展示链；来源原生发现只增加有界进度，不新增模型择源动作或全平台候选融合。离线Fixture和独立Eval仅证明组合行为；真实来源结构、速度、覆盖和实时库存需要另行Live Read-only验证。Google匹配调用减少但总耗时或覆盖可能不改善，这种结果不自动扩大范围。

## Alternatives considered

- 同时合并Google及两个预约来源的候选：当前没有证据证明需要该系统，延后。
- 仅凭来源列表或5km搜索范围接纳：无法证明门店身份与权威地理范围，拒绝。
- 在原ADR中静默改写固定来源链：破坏决策历史，拒绝。
