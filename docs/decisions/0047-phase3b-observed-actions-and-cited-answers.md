# ADR-0047: 3b observed actions and cited page answers

- Status: Accepted — the two principles directly approved by the user on 2026-10-26; implementation status is separate below
- Document revision: 1.0
- Last updated: 2026-10-26
- Source of truth for: 3b动作来源、页面问答引用核验与具名目标保留的验收依据
- Related ADRs: [ADR-0021](0021-cited-source-fact-investigation.md)、[ADR-0022](0022-current-source-fact-lifecycle-and-identity.md)、[ADR-0036](0036-generic-public-read-network-policy.md)、[ADR-0044](0044-recommendation-availability-boundary.md)
- Related evidence: [对话C批次1](../../.eval-artifacts/phase3b/c-batch1/plan.md)

## Context

3a′按用户决定带缺口签收，3b从main/cc127320开始。用户给出的日本律师咨询结论关闭3a使用条款事项；既有网络、robots、限流、授权与只读边界继续有效。本ADR记录用户明确提出的两个3b原则，不把尚未实现的设计写成当前能力，不授权本批新增真实调用。

## Decision: two user-approved acceptance principles

1. **不依赖硬编码动作。** 站点专用处理只作为站点Skill、提示和Guard规则中的指引。Agent的动作必须来自本次实际观察到的可见文字、label、ARIA、链接或控件，不能由私有CSS class、testid、元素位置或固定点击顺序决定。已知选择器可以加速；失配后应回到读页面继续有界调查，不能仅因加速路径失配就让任务失败。核对依据为可观察语义、逐字原文或站点自身的数据响应，不是私有class存在。站点数据响应可用于证据绑定，但格式变化必须显式告警“结构已变化”，保留无法核实状态，不静默失败或生成成功结论。恢复仍受原预算和Guard约束，不产生额外重试许可。
2. **通用的读页面并回答。** 用户可追问已展示门店的包间、素食、刷卡、最后点单、取消规定等信息。模型只依据该店本次读取的页面回答，逐字引用原文；页面未写时回答“页面未说明”，不得猜测。代码核对引用确实出现在同一家店、本次读取的页面上；旧页、其他门店、模型自述或没有引用的推断不能接纳为该回答的证据。

### G4 named-outlet consequence

既有SPECIFIC_OUTLET在后续补充日期、时段、人数、地区、预算或条件时仍指向同一家店。仅因交付目标从推荐变为查位，不得将具名query和范围改成泛化推荐。用户明确换店、撤销点名或要求其他店时，仍可通过正常语义链替换目标。新goalBasis引用只来自当前消息；保留店名来自权威上下文，不伪造当前消息引用。代码不增加订位关键词或店型分类规则。

身份证据仍与检索指引分离。同名不能证明同店；分店、门牌、楼层冲突不得接纳。G4本批只分析检索词、电话对应关系、完整地址和坐标的方案，不放宽当前身份规则。050与固定电话不能只因出现在网页某处就互认；必须有可追溯的同店联系区证据与对应关系。距离只作佐证，不抵消明确门牌或楼层冲突。任何身份规则放宽须先停止，经复核者和用户批准。

## Implementation and verification boundary

| 范围 | 本批状态 |
| --- | --- |
| G4具名目标指令 | 对话C仅将Semantic Prompt25→26，Proposal4、State23、TaskDefinition21不变；无Compiler/Reducer改动 |
| 模型真实遵循率 | 未运行；本批新增真实调用必须为0。Fixture/保存提议回放只证明指令接线与内部状态链，不证明真实模型已经修好 |
| G4身份规则及检索改进 | 仅方案，未实施；不以验证页作为原检索已命中的证据 |
| G1通用问答 | 对话B负责；本ADR不宣称实现 |
| G2改版测试、G3查位改造 | 由A/B负责；本批不编辑其浏览器、parser、query-controls、src/eval或src/harness文件 |
| G5/G7预约 | 后续批次；本批没有预填链接、预约、支付或其他外部写入 |

3b共享总额度为18完整Live、1000真实模型、4环境重跑、40评测公开GET，各对话账本按唯一条目并集合并。批次1所有新增真实调用均为0。门禁、语义模型、真实来源与端到端交付结果分别报告，历史分数不回写，私有Holdout不读取。
