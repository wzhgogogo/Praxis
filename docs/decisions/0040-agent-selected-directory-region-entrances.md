# ADR-0040: Agent-selected directory region entrances

- Status: Proposed
- Document revision: 1.0
- Last updated: 2026-10-10
- Evidence status: draft / not integrated; exposed development plan, no probe executed
- Proposed supersession: only ADR-0037 Decision 4's source-specific region mappings as Pack data
- Related documents: [Phase 1 Playbook §8](../AGENT-WEB-OPERATION-PHASE-1-PLAYBOOK.md#8-p1-d-地区入口改由-agent-选择), [ADR-0037](0037-request-driven-discovery-source-packs.md), [ADR-0036](0036-generic-public-read-network-policy.md)

## Context

当前 `source-packs.ts` 的 `tabelogRegions` 仅三项，其中东银座入口通过与评测坐标相距100m的锚点选择。其他地点会产生 `DISCOVERY_SOURCE_LOCATION_UNGROUNDED`。这些入口不能证明来源通用地区发现能力，也不能替代实际候选坐标校验。

用户要求按Playbook §8先提交窄ADR草稿，批准后才实施。本文件不修改任何代码、Schema、来源能力声明、变体或见证文件，不运行Live。ADR-0037当前仍有效；不得在批准前把其对应条款标成已替代。

## Decision（提议，待用户批准）

1. 批准实施后删除 `tabelogRegions`、`tabelogRegion()` 及仅支撑此表的类型/辅助代码，更新全部调用方和Fixture，不保留旧表兜底或双路径。仅替代ADR-0037 Decision 4中的地区映射方式；请求驱动opaque来源计划、Pack职责、Google地点解析及最终半径/身份/资格规则保持。
2. 对 `flow: DIRECTORY`，可复用当前观察到且请求绑定的入口；没有可直接使用的入口时，Agent从来源公共页面选择已观察地区/车站链接逐级进入，或填入已观察的地区/车站搜索框。地区代码、URL、slug和未观察控件不得由模型或代码猜造。Pack仍拥有来源入口边界、查询grammar、Skill、列表/翻页/身份解析和网络规则，共享Planner/Browser不增加站点名称分支。
3. 增加权威动作字段 `LOCATION`。字段值只来自当前请求已解析的权威地点名称；Executor逐字填入，模型不得提供替换文本、同义词、邻近地点或地址拼接。目标必须是当前观察且支持该字段的公开地区/车站搜索控件。Prompt/Schema在实施时按各自所属对象递增，修改所有调用方/Fixture，不增加兼容旧动作的分支。坐标附近请求没有可用权威地点名称时，不能凭空填LOCATION，可依当前已解析位置上下文选择观察链接，或如实保留缺口。
4. 模型地点上下文包含权威名称及同次Google地点解析已有的地址组成部分（区、町名，以及来源实际提供的车站信息）。不以地址猜最近车站，不新增无验收需求的API调用，不提供站点地区代码。客户端/eval坐标或命名地点解析坐标仍为唯一中心；Agent不能改中心、半径或用户地点。
5. 每个候选仍依据该详情页观察到的坐标执行既有精确半径接纳。缺坐标、越界或身份不明的候选不得接纳；地址文本、地区名称、列表排序和正确入口都不能代替坐标或HIGH身份。新地点探测使用1000m；普通请求沿用自己的权威半径，不统一扩大或缩小。HARD、日期/人数/餐段绑定、新鲜度和只读规则保持。
6. 一次地区选择流程内，读取首批五个去重详情后，如至少四个由有效详情坐标证明在原半径之外，代码判该入口错误，并允许Agent从当前观察入口中换一次。未知坐标不算越界也不算合格；未读满五个时不推断4/5比例。记录首次入口URL、对应观察引用、首五个详情及坐标/距离/判定、换入口原因和第二入口的观察引用。换入口共限一次，沿用原来源和整单预算，不重置计数/截止时间；第二次仍错或没有观察到替代入口时如实失败/保留UNKNOWN，不再自动重试。原入口已接纳且身份/请求有效的候选按既有去重与资格规则处理。
7. 继续使用已有Browser Guard与Policy边界。允许的动作只限公共来源发现/地区查询；不登录、不提交预约/支付/个人信息，也不打开预约表单后的下一步。当前500秒/50模型调用及Google请求预算保持，不引入来源兜底层、地区词典或测试平台。

## Consequences

本提议把地区选择交给Agent，代码仍负责权威字段、精确坐标、换入口上限和预算。错误入口是可观察、有限的来源发现失败，不会被描述为整片地区无餐厅或无位。地区目录页面失败仍是能力限制；不能换用户地点或降低资格来制造成功。

批准后按一个可运行纵向切片更新Pack、动作合同、Executor、调用方及Fixture，同步Capability Matrix、版本说明与DEVLOG/TEST-LOG。原有三地点行为和以下新地点发现证据共同验收；本草稿本身不证明实现或来源兼容性。ADR-0037仅在批准实施时标明对应Decision 4被本ADR部分替代，其他Decision不动。

## Probe plan（未执行，须批准实施后另行安排）

复用既有Discovery-only Runner及record-decisions/record-browser诊断，不新增矩阵或平台。每次冻结请求、当前权威Google地点解析结果和1000m半径，只读发现阶段；不读空位、不进入预订表单。每例最多6次模型调用、90秒，计入Playbook P1-D最多10次发现探测预算。本轮探测数0。

| 地点 | 次数 | 中心与半径 | 观察与计分 |
|---|---:|---|---|
| Ebisu | 1 | 同次权威地点解析；1000m | 已观察地区入口、列表与前十详情坐标 |
| Roppongi | 1 | 同次权威地点解析；1000m | 同上 |
| Nihonbashi | 1 | 同次权威地点解析；1000m | 同上 |
| Ikebukuro | 1 | 同次权威地点解析；1000m | 同上 |
| Asakusa | 1 | 同次权威地点解析；1000m | 同上 |

五例共最多30模型调用/450秒（逐例上限分别约束）。至少4/5到达请求对应的来源列表，且通过例首十个去重详情候选中至少五个由实际坐标证明在1000m内；缺坐标、未读取、入口失败不能计入半径内，不缩小十个候选的分母制造通过。记录未完成分母、所有失败和入口替换，无位、HARD或展示不作为发现成功结论。

Shibuya、东银座、Shinjuku用既有Fixture验证不退化，并按Playbook另安排一次真实发现探测确认。离线正反例至少包含观察链接/LOCATION成功、非权威文本拒绝、越界/缺坐标不接纳、4/5越界仅换一次、未知不能误判越界和预算不重置。上述Live均在本轮结束后安排；不会在本任务执行。

## Alternatives considered

- 扩充硬编码地区表：不能解决新地点发现，也继续把评测锚点混入入口选择，拒绝。
- 让Agent猜地区代码/URL或改写地点：破坏权威字段和观察绑定，拒绝。
- 只凭地区名称接纳候选或扩大半径：破坏现有地理资格门槛，拒绝。
- 多次换入口或新建地区路由策略层：超出当前有限恢复需求，拒绝。

## Related documents

- [ADR-0037](0037-request-driven-discovery-source-packs.md)：当前Accepted职责与地理约束；本提议仅修改一项地区入口选择方式。
- [Restaurant Domain](../domains/RESTAURANT-BOOKING.md)：当前候选与交付资格。
- [Capability Matrix](../integrations/CAPABILITY-MATRIX.md)：当前证据状态；批准实施后才同步新能力。
- [本轮报告](../../.eval-artifacts/p1-c-batch-20261010/report.md)：文档检查与门禁，不是探测证据。
