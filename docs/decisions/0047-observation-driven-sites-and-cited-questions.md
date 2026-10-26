# ADR-0047：观察驱动的站点操作与同店原文问答

- Status: **Proposed — 等用户批准；不得当作 Accepted 决策或现有产品能力**
- Document revision: 0.1
- Last updated: 2026-10-26（Vienna CET，UTC+1）
- Source of truth for: 3b 原则、G1 合同与 G2/G3 验收的提案
- Related ADRs: [0010](0010-restaurant-agent-loop-action-validation.md)、[0021](0021-cited-source-fact-investigation.md)、[0022](0022-current-source-fact-lifecycle-and-identity.md)、[0036](0036-generic-public-read-network-policy.md)、[0044](0044-recommendation-availability-boundary.md)、[0045](0045-bounded-read-conclusion-reserve.md)
- Evidence status: draft / not integrated；本批仅未接入口核心和离线契约，不是 Live 验收

## Context

3a′已带缺口签收（`phase3a-prime-signoff`，main `cc127320`）；网站适配器3,847行，目标≤3,591尚未达成。L1/L4/L5转入3b的基于证据查位核对及结构变化告警。3a推荐/查位边界按ADR-0044 revision1.1执行。用户已经咨询日本律师并提供“当前做法没有问题”的结论；本提案不重新解释法律结论，也不改变Guard或授权边界。

用户2026-10-26提出两条3b验收原则：操作来自实际观察；对已展示门店的追问来自该店本次读取的原文。现有 Browser 已有观察/ref/模型决策，事实链已有来源读取、同店身份、完整原文选择和代码核对，但部分控件、日历和商家字段仍以私有class/testid/层级为权威，HARD条件判断也不能回答请求条件之外的问题。

采用**同一份ADR**：操作观察与问答共同依赖“当前可观察证据→模型提议→代码核对”的边界。分开会重复定义来源、身份与引用权威。这里只共用合同，不新增通用业务框架，不改变既有State、Agent动作或权限。G4具名店/身份解析由C负责，G2规格由A负责。

编号说明：并行A工作树已有未合main的0046草稿，本B提案使用0047避免同路径覆盖。0046草稿中的状态不构成本提案的批准；两稿由复核统一，本分支不编辑A文件、不标记任何新决定Accepted。

## Decision（提议，待批准）

### 1. 不依赖硬编码动作

- 站点专用知识可以保留，作为站点Skill、提示和Guard中的指引。动作必须来自Agent本次实际观察到的内容：可见文字、label、ARIA、可见链接与控件。不能把私有CSS class、testid、元素位置或固定点击序列作为业务动作权威。
- 已知selector可以是加速路径。失配时回到现有“读页面→观察→选择ref”的机制继续；不可仅因私有selector消失就结束任务。预算/Guard确实不允许继续或页面无可核证内容时，如实报告无法核实。
- 核对基于可观察语义或站点自身已审核数据响应，不以私有class存在与否证明空位、日期、人数、时段、价格或HARD条件。
- 来源响应（例如Tabelog find_vacancy）可绑定证据。端点、对象/字段/类型或含义不符合已审核格式时，必须产生可观察的“结构已变化”告警（拟议诊断名`SOURCE_STRUCTURE_CHANGED`，附来源、页面、读取时间、预期/实际字段形状；不记录密钥/PII）。结论保持UNKNOWN，不能静默当作空、无位、0条或通过。Guard拒绝与结构变化分开归因。
- 身份、预约/提交/支付、源与请求绑定、日期人数时段、价格税费餐期、原文范围/新鲜度仍由代码核对。Observation不授予写权限。没有有效Authorization仍不得有外部写；提交后不明仍`OUTCOME_UNKNOWN`。

### 2. 现有依赖及处置

[完整52组清单](../../.eval-artifacts/phase3b/g1-core/observation-inventory.md)与[CSV及文件SHA](../../.eval-artifacts/phase3b/g1-core/observation-inventory.csv)是本提案的逐处索引。[F3原38项映射](../../.eval-artifacts/phase3b/g1-core/f3-disposition.csv)保留已修和非布局项，避免把旧行号当当前缺陷。

| 类型 | 代表位置／清单索引 | 处置 |
|---|---|---|
| Agent接手：动作/读值 | Browser原始CSS入口；React Value Container/singleValue；caption父级/位置；两站query控件（OBS-01–10、13–15、33–34） | 站点提示+语义观察，selector可加速且必须有失配回读；动作来自当前ref |
| Agent接手：事实/查位判读 | Tabelog day/full/tel、slot/course/price；TC Venue Availability/Timeslot/Menu Item Card；busy region（OBS-18–31、35–39） | 观察+完整原文/响应+核对；不混评论、邻店、午晚餐或套餐范围 |
| 保留安全核对 | 当前ref/可见性、写权限、同店、同次请求、日期人数、时段、价格/餐期（OBS-04、11–12、16、28、32、37、40、44–49） | 保留全部不变量；改提取手段不能减核验或降低断言 |
| 保留数据响应绑定 | find_vacancy、TC search/calendar/available（OBS-17、41–43） | 保留精确绑定；格式漂移告警，未知不得升格库存结论 |

标准DOM/ARIA枚举、DOM节点句柄和Praxis自有UI CSS不是站点私有业务动作。清单对它们显式分类，不能把grep命中数当违规数。身份解析及语义文件不属B本批改动；需要跨归属的实施先停下安排顺序。

### 3. G2为观察原则的验收方法

由对话A起草G2规格并维护评测/fixture。冻结原页面及变体SHA；改名私有class/testid、改变无语义wrapper或位置，但保留可见文字、label、ARIA、href、原生值、同店身份内容及已记录响应。Agent仍应完成任务，或如实报告无法核实；不得产生错误声明。

需区分：selector加速是否失配、Agent是否实际回到观察、证据核对是否保留、任务是否完成。只停在“不报错”或把可行原页变为无证据未知，不等于能力通过；诚实性与任务完成分别报告。不得通过删除核验、降低断言、把站点代码移进Pack/通用层来满足行数目标。有效红灯、独立S0证据、原始响应及分母由A规格冻结；B不改其Gold或评分。

### 4. G1输入合同

1. 用户问题（原文，独立于原搜索请求条件）。
2. 已展示的**一家**门店：Praxis内部candidate ID和其来源入口URL，由调用方从权威已展示结果绑定，不能由模型新建或改写。
3. 本次run ID与开始时间、已读取的页面快照：页面URL、可见文本、读取时间、既有读链产生的HIGH身份依据及其来源入口。优先复用同run缓存；旧run或其他分店快照不可挪用。
4. 没有可复用快照时，通过既有Native/官网事实reader获取页面，继续使用现有Guard、来源/整单/共享模型预算与取消信号。不能把G1变成开放URL fetch器或建立独立重试预算。

本批核心接收上述已绑定页面，允许注入现有reader进行一次有界读。没有Agent/Web接线；未来接线须将选店、run及允许页面从权威上下文绑定，并实际复用本次运行缓存。当前提供的是收集hook，不声称主链已经保存G1缓存。

### 5. G1输出与核对合同

| 结果 | 输出 | 约束 |
|---|---|---|
| `ANSWERED` | 答案、1–3条逐字引用；每条URL、读取时间、身份依据ID | 每条引用规范化空白后出现在本次同店页面文本中；保留否定、条件、分店与服务范围 |
| `NOT_STATED` | `页面未说明`、空引用、查过的页面URL及读取时间 | 仅限实际完整读取的已绑定页面；不推断全网站、未访问子页或现实世界不存在该事实 |
| `UNVERIFIED` | 原因及实际查过的页面列表；没有答案 | 身份/本次run/来源/引用不合格、页面未完成、没有完整可引用段落或用截断内容推未说明、模型输出不可用；不降级猜测，不伪装“页面未说明” |

代码是身份、run、URL、读取时间和引用归属的权威。HIGH身份必须来自现有同店规则；同名不等于同店，Google `websiteUri`只是线索。核对失败时整份答案丢弃，不保留其中的模型结论。

**当前核心采用抽取式答案**：模型只选择已有文档/完整原文段落ID并逐字返回quote，不接收其自由答案、URL或时间；代码输出选中的原文及“请向餐厅确认”。完整段落选择/空白规范化检查复用事实链，以保留否定和限定。选择相关原文仍是模型任务，字面核对不是语义相关性或无遗漏的质量证明；本批没有真实模型质量结论。

**敏感类别**：过敏、宗教饮食、无障碍只转述页面原文，附“请向餐厅确认”，不给出是/否或适用性结论。为避免另造敏感词分类器，本核心对所有问题都采用同样的原文转述和确认提醒；额外yes/no自由文本视为非法输出。原文自身有肯定/否定时仍只能归属为来源说法，不能变成系统保证。

**时间敏感信息**：价格、套餐、营业时间、取消规定必须标明读取时间。本核心每条引用总带读取时间；后续展示必须呈现该元数据。历史保存页面仅用于离线回归，不是当前价格/营业/库存事实。

**不做**：开放网页搜索、第三方评论页面追读、读用户评论作为商家承诺、多店比较、库存推断、预约/提交/支付。既有Tabelog/TC同店来源的商家详情/套餐内容与用户评论必须区别，页面引用不得把评论或邻店内容升格为商家事实。核心不产生新URL；新页面选择边界在接线时由现有reader/Guard落实。

### 6. 接待方式：G1首个用途

询问“可预约、仅到店、两者都可”时读取页面原文并引用。例如`Walk-ins only. Reservations are not accepted.`只能报告该来源的这段话；有空位不能反推接待政策，查不到空位不能反推仅到店。未写则`页面未说明`；不新增库存状态、不改原有Offer或预约资格。

### 7. 复用与本批实现边界

| 现有部分 | 复用方式 | 本批变化 |
|---|---|---|
| `NativeSourceFactRead` / `GoogleListedWebsiteFactRead` | 原导航/Guard/预算/取消、同店身份核对与已读页面 | 最后一个可选页面观察hook；未安装时原调用方不变；暂存数据不进State/普通日志 |
| `native-source-facts.ts`原文分段 | 原有每段1600、50段/6000字符上限、完整句段 | 原样提取到`fact-source-document.ts`，不改旧结果；G1保留完整段落可引用，但发现截断不能认定未说明 |
| `model-fact-judgment.ts` | 已有完整statement选择验证 | 复用同一个选择函数；旧HARD判读、Prompt14/output4不改 |
| `ModelRestaurantPageQuestion` | 原文→模型选择→代码引用核对 | 问题独立于criteria，产生瞬时问答结果，不写事实满足标志、不改请求条件 |
| 既有ModelGateway | 共享额度/取消由未来调用方接入 | 新独立`restaurant_page_question`提示与输出对象初始版本1；仅fixture测试，不递增共享Prompt/Schema/State |

“绑定请求条件”泛化的是**问题输入与原文选择的解释目的**；既有HARD判断不改为问答，也不伪造HARD条件或构建另一套身份/抓取器。未批准前：不新增Agent合法动作、不改Agent Prompt28/语义Prompt25、不接Web入口、不改State23/TaskDefinition21、不改Guard，不执行G3。

## Consequences

- 核心离线可证明信用卡等非请求条件追问可返回同店本次原文；不等于Agent已有此能力。
- 快照只在当前调用中暂存，包含原文的问答不进入普通模型调用日志；来源脱敏和数据保留规则不放宽。
- 原文/身份不足会明确无法核实，原文未说明与无法核实分开。
- 语义相关性、跨段限制/矛盾、真实模型表现及完整Web体验待ADR批准后的接线和独立评测；本批不以fixture替代这些证据。
- G3行数目标≤3,591仍是后续实施验收，当前3,847/Pack473保持；不为本提案删站点代码。

## Alternatives considered

- 继续给每种追问新增字段/正则：拒绝，违背任意问题的观察读取原则。
- 把追问伪装成HARD条件：拒绝，会修改原请求语义，且无法表达“页面未说明”的局部问答范围。
- 模型自由答案附一个可能相关quote：本核心不采用，字面引用存在不能证明自由答案成立，尤其敏感问题有错误是非风险。
- 另建页面抓取器/身份匹配/独立预算：拒绝，重复事实链并可能绕过Guard。
- 立即接入Agent/Web或实施G3：拒绝，本批只授权ADR批准前未接入口核心。

## Related documents

- [Restaurant Domain](../domains/RESTAURANT-BOOKING.md)、[Capability Matrix](../integrations/CAPABILITY-MATRIX.md)
- [3b B切片](../../.eval-artifacts/phase3b/g1-core/plan.md)、[52组观察依赖](../../.eval-artifacts/phase3b/g1-core/observation-inventory.md)
- [Test Skill](../skills/test/SKILL.md)、[Eval Skill](../skills/eval/SKILL.md)
