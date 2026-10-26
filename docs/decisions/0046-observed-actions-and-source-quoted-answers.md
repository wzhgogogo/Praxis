# ADR-0046：3b观察动作与原文问答验收依据

- Status: Accepted（用户于3b批次1要求写入的原则；不代表实现完成）
- Document revision: 1.0
- Last updated: 2026-10-26（Europe/Vienna CET，用户决定日期）
- Source of truth for: 3b观察驱动动作、语义核对及同店本次读取原文问答的验收原则
- Related ADRs: [ADR-0025](0025-model-directed-read-investigation.md)、[ADR-0043](0043-provisional-directory-entrance-coordinate-check.md)、[ADR-0045](0045-bounded-read-conclusion-reserve.md)

## Context

3a′带缺口签收；3b继续建设无API网站的受控读取。用户要求私有标记变化不导致错误声明，并支持用户追问已展示门店的信息。本ADR记录用户的两条原则，不增加外部写入或网络权限。

## Decision

1. **不依赖硬编码动作。** 站点专用处理可以作为站点Skill、提示和Guard规则的指引。动作必须来自Agent实际观察的可见文字、label、ARIA、链接和控件，不能写死CSS class、testid、位置或固定点击序列。已知选择器可作加速路径，失配后必须回到读页面继续，不能因此直接使任务失败。核对基于可观察语义或站点自身的数据响应，不以私有class是否存在判业务结论。Tabelog find_vacancy等响应可绑定证据，但格式变化必须明确告警结构已变化，不能静默失败。
2. **通用读页面并回答。** 对已展示门店的追问，模型读取该店页面，逐字引用所依据原文；未写则答“页面未说明”，不能猜。代码核对引用出现在同一家店、本次读取的页面。过敏、清真、无障碍等敏感事实转述原文，并请用户向餐厅确认。

## Validation

G2按种子可复现地变异保存页的私有标记，运行真实Chromium观察及完成判定，逐页分PASS、DEGRADED_HONEST、FAIL；任何错误声明立即停。当前Tabelog日历允许冻结诚实退化，G3后须PASS。变异必须保留约定公开语义；变异本身损坏公开语义不算有效业务样本。

G1问题与待审答案分文件，答案全部CANDIDATE；复核者逐题确认、修改或删除后，最终状态以复核记录为准，复核前不作为验收集。对话B实现时只读题目。评分独立核对同店/本次页面引用、答案与未说明判断，错误声明目标0。G3依同一原则改造查位；G4身份和具名店、后续预约分别验收。

## Consequences

A只交评测、Harness、fixture、脚本与文档；B负责G1及随后G3，C负责G4。跨归属文件或同一Prompt/Schema/State升版须停下由复核者安排顺序。3b账本逐次唯一条目并集合并；本批真实调用0，离线结果不代表Live通过。

## Alternatives

私有选择器作为唯一依据、模型补全未写事实、以其他分店或过期菜单冒充本店当前事实均不采纳。来源响应的确定性解析可保留，但必须有结构变化告警及完整证据绑定。
