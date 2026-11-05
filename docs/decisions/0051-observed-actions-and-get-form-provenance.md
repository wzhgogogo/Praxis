# ADR-0051：观察循环、原生 GET 表单值来源与候选选择权

- Status: Accepted（用户2026-11-05逐项决定；实现尚未完成）
- Document revision: 1.1
- Last updated: 2026-11-05（Vienna CET，UTC+1）
- Evidence status: draft implementation / not integrated；exposed development regression，非 Clean Baseline
- Related ADRs: [0046](0046-observed-actions-and-source-quoted-answers.md)、[0036](0036-generic-public-read-network-policy.md)、[0045](0045-bounded-read-conclusion-reserve.md)

## 决定与替代范围

1. 后续页面动作均由现有观察模型根据当前可见文字、label、ARIA、链接和控件逐步提出，代码负责权限、当前引用、权威输入及结果核对。删除地点选择、填表与点击的固定序列和站名/组名/图标分类词表；导航选择不以地区网址或店号网址模板决定。安全范围、来源协议、身份与响应绑定的格式核对仍然保留。
2. 空白会话首次导航的唯一平台配置例外是Tabelog `https://tabelog.com/en/` 和TableCheck `https://www.tablecheck.com/en/japan/search`，仍经过Guard。只用一次，之后没有模板直达路径；保留的全部平台配置在实现报告逐项列出。
3. 取消单个Tabelog `/en/rstLst/` 十字段例外，改为已观察页面的同源原生GET表单值来源合同：页面原有option、隐藏默认值、脚本自己填入值原样交回同源，不做内容识别；代码填入只来自权威地区、菜系、日期、时间、人数、已接纳SPECIFIC_OUTLET目标名或G4来源绑定检索词，并通过已有电话/邮箱/token格式拒绝。用户联系或身份字段、任意自由文本、模型自由改写及未知来源拒绝。不实现人名词表或人名识别器。POST、跨源、禁止路径、CDP与非表单name读取限制不变。
4. 店名包含关系的额外词必须由该店已HIGH绑定来源的名称、别名、类别或菜系原文支持，地名由地址支持；没有支持时不判唯一。不新增别名/翻译/相似度接纳，不降低HIGH身份证据。
5. **候选选择权：** 删除`availabilityCheckSelectionScope`的“至少三家未查过的范围内DIRECT_SOURCE_PAGE时，屏蔽其他合法候选”门控。生产`read-assessment.ts`和`run-decision-replay.ts`一起删除调用并删除函数，不保留另一条旧路径。合法候选仍须满足原有目标、身份、HARD、请求、刷新及时间等规则。
6. **保留来源事实和建议：** 保留Agent候选的`availabilityPath`、`RESTAURANT_AGENT_AVAILABILITY_PATH_INSTRUCTION`及来源包`candidatePath`。它们给模型来源事实与效率建议，不是代码替模型选候选；不因退役门控而删除。Agent Prompt@29、Agent Context@17不变。TaskDefinition@23→24；State@25、Agent Action、语义版本不变，无数据迁移或重置。

第5条精确替代[0042-agent-planned-discovery-and-search-availability-hints](0042-agent-planned-discovery-and-search-availability-hints.md)的“2026-10-19 P2-2 首次查位入口分配（用户批准，追加）”段中确定性门控，保留其无关字段、身份/HARD/库存、预算等条款。门控及该段由`33a3b161aea53418a64cbbcc812ef3546ecbdb41`引入。用户转达的`3d323739`在当前仓库只冻结inventory-06见证，未引入门控；另一份[0042-explicit-observed-general-list-supplement](0042-explicit-observed-general-list-supplement.md)没有该门控，不将其错误列为替代出处。

第1条的当前观察循环替代ADR-0040/0043中专用地区集合动作、网址分类导航与固定纠正动作的实现机制；它们的同店、坐标半径和预算不变量不变。ADR-0046允许selector加速的历史决定原文保留，本轮按用户更严格的“无固定序列、每步观察”决定实施。既有URL安全、库存响应解析及B1链接双重核对不是导航决策捷径，继续生效。

## 验收与边界

真实录制供红灯及离线回放；手写页面仅补充边界。D4至少到真实Ageage/Dengana候选，D3/D5无退化并报告实际模型选店，D8如实报告来源支持下的唯一性。表单许可的独立评价必须取独立的DOM/实际请求/权威输入证据，不以Guard许可或生产receipt自证；缺证NOT_EVALUATED。

Browser Prompt20→21、Action12→13、Context3→4、Recording5→6、Evaluator36→37、Rubric31→32已获批准，按受影响对象实施。生产默认Node转发不变；实验浏览器传输不启用。20秒保留、导航/provider/候选/整单时限、共享预算及私有留出集预留均不变；本轮离线真实调用0。

相关真实回放及全套门禁完成前不合main；合入后停在Live之前，待复核再运行另行授权的D4/D8 Live。


## 2026-11-05 晚：用户复核澄清来源确切网址

前两条实施时曾被过度解释为“来源网址也必须从首页逐个点击才能到达”，用户明确否决这一限制。来自 Google websiteUri、来源绑定 native detail URI，或本次读取实际观察页面 href 的**确切网址**可以由代码直接打开，继续经过原 Guard 与后续身份/坐标/响应核对。只允许既有 listedTabelogOutlet 身份规范化，不新增网址格式模板、构造、拼接或按网址形状决定下一步。两个启动页仅是在尚无来源确切入口时的来源配置，不排除已有来源链接。保留 availabilityPath / DIRECT_SOURCE_PAGE 的提示和行为一致性。GO_BACK 本轮不添加；未发布的 Browser Prompt@21 内澄清措辞，不再升版。

D3/D5 原录制实际经过当时构造的搜索 URL，再打开 Dengana；Google websiteUri 是 stores.dengana.jp。用户接受仅在评测运行器注入原录制的确切搜索结果页作为定向回放起点，范围为身份→查位→交付，不声称覆盖新首页检索入口。原件缺失的响应/模型输出保留缺口，不合成，不以产品回放分支或固定动作序列补齐。
