# 额外版本方案：用户复核决定

**当前决定（2026-11-05 CET，用户已批准）：** 仅TaskDefinition@23→24，删除生产read-assessment与run-decision-replay两处availabilityCheckSelectionScope调用并删除函数，不保留双轨。保留availabilityPath事实字段、来源包candidatePath、RESTAURANT_AGENT_AVAILABILITY_PATH_INSTRUCTION；Agent Prompt@29和Agent Context@17不变，State@25不变。下文原方案中删除提示/上下文的建议已被用户否决，作为superseded retrospective保留，不能据此实施。

出处已独立核对：本仓库3d323739是inventory-06见证冻结，未引入门控。git log -S与源码diff证明门控来自33a3b161aea53418a64cbbcc812ef3546ecbdb41（2026-10-19）；同提交追加docs/decisions/0042-agent-planned-discovery-and-search-availability-hints.md的“2026-10-19 P2-2 首次查位入口分配”段（当前159行）。另一份0042-explicit-observed-general-list-supplement.md没有该门控。新增ADR-0051精确替代前者这一段的门控，保留来源提示与其他安全/证据条款。

验收追加：D3/D5真实回放逐轮记录实际模型选择的候选；未完成前不得声称无退化。此文件前一版已随8d508f44推送，现次更新随实现一起推送。

---

以下为原始提案（已部分否决）：

2026-11-05 CET（UTC+1）；**draft / not integrated，实施前报告**。不新增真实调用。

## 新发现

- `src/domains/restaurant/agent-decision.ts:23` 的Agent Prompt@29明说DIRECT_SOURCE_PAGE可以跳过具名搜索直接打开，并建议优先选择。
- `src/domains/restaurant/candidate-read-observations.ts:29` / `read-assessment.ts:302` 在至少三家DIRECT_SOURCE_PAGE时缩窄首次查位的合法候选池。
- `src/integrations/restaurant-search/source-packs.ts` 按网址形状生成这个提示，`live-read-assembly.ts:160` 把提示注入DISCOVERY证据。
- 原规则是Accepted ADR-0042的2026-10-19 P2-2补充，不能不说明就静默改变，也不能保留错误的“可以直达”提示。

用户最新“只允许两个启动页用于第一次导航、之后全部由观察循环选择、不保留任何直达路径”与上述提示及固定候选屏蔽有直接冲突。仅删浏览器快捷代码无法闭合合同。

## 建议（待确认后实施）

1. Agent Prompt@29→30：删除直达速度/可靠性建议及DIRECT_SOURCE_PAGE指引；保留同店/HARD/库存证据、权威目标与合法动作边界。
2. Agent Context Schema@17→18：删除候选availabilityPath字段及全部生产投影；不改Agent Action Schema或语义Schema。
3. TaskDefinition@23→24：退役“至少三家直达候选就屏蔽其他候选”的确定性门控；原本合法的候选都交Agent选择，不影响身份、地理、HARD、空位或刷新约束。
4. Restaurant State@25保持：持久结构无新增/删除必填项，原DISCOVERY evidence.claims是开放来源声明，历史availabilityPath字串只作为历史原件保留，不再读取，不建兼容路径、不重写或迁移旧State。
5. 新增ADR-0051（Proposed）列明用户2026-11-05决定对ADR-0040/0042/0043中动作捷径与直达入口分配的替代范围；旧ADR原文保留并链接替代决策。

已获批的Browser Prompt21 / Action13 / Context4、Recording6 / Evaluator37 / Rubric32方案不变。身份阈值、Guard拒绝、预算、时限不变；没有申请新增调用或Live。

## 当前实施与证据

尚未改上述Agent Prompt、Agent Context、TaskDefinition或直达候选门控。可独立进行的表单运行时切片已有本机真实Chromium/CDP正反例4/4、旧Guard组件20/20、已有网络边界Chromium64/64；这不是D4/D3/D5/D8链路验收。仅已有部分表单实现，独立外层来源审计、观察循环退役和真实回放仍待完成，不能合main。

未知或未经授权的填入在页面接收前拒绝；页面原有值（包括脚本更新值）只交回同源，按用户最新决定无需人名识别。旧“所有页面默认值也做内容分类”提案已明确superseded。额外版本获批前不做依赖它们的退役；继续可以独立完成的表单测试与审计设计。
