# ADR-0042 补充：显式选择已观察的通用列表

- Status: Accepted（用户停止点4／批次4批准F3-034实施；2026-10-26 CET）
- Document revision: 1.0
- Last updated: 2026-10-26
- Source of truth for: 拒绝检索提议后的有界停止、通用列表观察引用与未发布合同更新
- Related ADRs: [ADR-0042](0042-agent-planned-discovery-and-search-availability-hints.md)、[ADR-0043](0043-provisional-directory-entrance-coordinate-check.md)

## Context

F3-034审计及用户停止点4批准关闭隐式通用列表回退。原实现把非法关键词、稀疏KEEP及重复检索转换为空关键词，并由代码访问通用列表；本地生产组合的三个有效红灯已保存。原ADR正文和历史实施/评价保留，当前拒绝后行为以本补充为准。

## Decision

1. 检索为空不授权代码换成通用列表。非法JSON、关键词、未观察类别、稀疏KEEP或重复表达式，有界结束本来源为UNKNOWN／DISCOVERY_SOURCE_INCOMPLETE，不清关键词、不修提议、不隐式重试、不增加模型调用。已有已接纳候选保留；错误/空列表不构成来源穷尽或附近无店。
2. 浏览器GENERAL只允许模型选择代码提供的`generalRef`。集合仅收当前来源/地区流程**实际观察的页面或链接**，包含原观察URL；Tabelog复用Pack的isRegionEntrance、listingRoot/同地区首页关系和无检索词约束，只收通用根列表，排除异源、异地区、类别、分页和查询拼造。其他浏览器来源仅收当前页面/已观察链接中符合Pack原有通用查询的精确URL，代码验证不能自己补出未观察URL。
3. 代码在导航前再次从该流程集合解析引用；模型不提供GENERAL href。空集合不提供GENERAL选项；集合外/跨来源/URL冒充引用均拒绝。换地区后不沿用旧地区引用，重新观察/选择；普通DOM ref仍受当前页stale-ref限制。
4. 合法KEYWORD/CATEGORY/COMBINED仍由原规则验证；合法类别选择可去掉类别入口上原关键词，这是模型明确的类别决策。KEEP保留当前观察、不改变检索。没有正向检索条件时保留当前列表，不为清词加模型调用；共享文本检索无页面观察时沿用ADR-0042的明确通用文本策略，绝不将被拒绝的提议改成空Google查询。Native和Google-only实际组装入口同片拒绝这种隐式查询。
5. 保留原HARD、身份、坐标半径、库存/日期/人数/时段/新鲜度及候选接纳规则。来源90秒、10详情、4地区页、检索3页/2改写及整单500秒/50次调用不增加、不重置。通用列表读取不是资格证据。
6. 不兼容机器输出更新为`restaurant_discovery_retrieval@3`、`restaurant-discovery-retrieval-prompt@6`；所有wire字段要求generalRef，非GENERAL填空，旧五字段输出拒绝，不留兼容回退。持久选择可含观察引用且旧隐式GENERAL语义退役，State为`restaurant-state@22`、TaskDefinition@20；更新全部活动调用方和fixture。当前无需保留的生产Task数据，不自动迁移/重置数据库，不改冻结历史artifact或为其添加运行兼容层。

## Consequences

错误提议会更早结束来源，来源能力限制保留UNKNOWN；模型仍可在原预算内明确选择可观察策略。已有交付控制保留：旧fixture依赖非法KEEP自动清词的行为已退役，改为两个明确合法改写，先前观察的合格候选仍保留。当前只证明离线机制，不重写F5 FAIL、历史评价或宣称当前网站/模型质量通过。page-parser、query-controls及source-packs.ts保持原字节；F6与route/Omotesando不在此补充范围。

## Alternatives considered

- 校验失败即去掉关键词或自动换通用列表：把代码拒绝变成检索策略，用户已否定。
- 允许模型拼通用URL或复用其他来源/地区引用：缺观察权威，拒绝。
- 无限修提议或增加改写/页面预算：违反有界调查，拒绝。

## Related documents

[本批红绿与验证](../../.eval-artifacts/phase3a-prime/f3-034/report.md) · [Test Skill](../skills/test/SKILL.md)
