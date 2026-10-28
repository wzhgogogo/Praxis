# ADR-0046：观察驱动的站点操作与同店原文问答

- Status: **Accepted**（用户于2026-10-28批准revision 0.4问答质量小修）
- Approval: **原则与 revision 0.2 文本均已由用户 2026-10-27 批准；revision 0.3独立预算及唯一动作限定修订、revision 0.4问答质量小修已由用户2026-10-28批准**
- Document revision: 0.4
- Last updated: 2026-10-28（Vienna CET，UTC+1）
- Source of truth for: 3b观察原则、G1合同与G2/G3验收提案；不是已接入产品能力
- Related ADRs: [0010](0010-restaurant-agent-loop-action-validation.md)、[0021](0021-cited-source-fact-investigation.md)、[0022](0022-current-source-fact-lifecycle-and-identity.md)、[0036](0036-generic-public-read-network-policy.md)、[0044](0044-recommendation-availability-boundary.md)、[0045](0045-bounded-read-conclusion-reserve.md)
- Evidence status: 独立预算修订已复核并合main；原Prompt2的102次问答质量由用户转达独立复核。本次Prompt3小修仅离线验证、工作分支待复核，Live未验收。下文其他批次叙述保留当时证据范围，当前实施状态以STATUS为准。

## Context

3a′在main cc127320带缺口签收，网站适配器3,847行，≤3,591目标未达，L1/L4/L5转入3b查位核对/页面结构变化告警。ADR-0044 revision1.1的推荐/查位边界保持。用户已咨询日本律师并提供当前做法没有问题的结论；本稿不改变Guard、只读或授权边界。

3b原则要求动作来自实际观察，追问答案来自同店本次读取的原文。批次1分别出现A0046、B0047和C0047重复草稿；按用户2026-10-27决定统一为本稿0046，删除B原0047当前文件。旧提案在Git 0a466bcd保留，未曾获批；A/C各自撤除重复稿，本分支不编辑它们的文件。

操作观察与问答共用“当前来源证据→模型提议→代码核对”的权威边界，因此在同一ADR中定义。批次1将所有回答缩为原文摘录，比用户计划更窄；本稿恢复**简短答案+逐字引用**，只对敏感问题限制为转述。字面核对不能证明答案语义忠实，后者必须独立评测。

## Decision（Accepted）

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

### 3. G1输入与读取

- 用户问题独立于原搜索criteria；不把追问伪装成新的HARD条件。
- 调用方从已展示结果绑定**一家**门店的Praxis内部ID和来源入口URL，不能由模型创建、改店或猜URL。同名不等于同店，Google websiteUri只是线索。
- 提供原结果的readRunId/开始时间及可用已读页面。页面带可见文本、URL、读取时间和现有同店规则产生的HIGH身份依据；优先复用本次缓存，旧run/其他分店不可挪用。模型调用前复制本次选用的快照，避免后续缓存更新错配原文与元数据。原结果的运行绑定是证据边界，不是追问预算的生命周期。
- **2026-10-28修订：每次显式追问是独立、有界的工作单元。** 不再恢复原搜索的500秒截止、50次模型余量或内存预算窗口。代码配置默认为提交起60秒、最多3次模型调用（含失败调用）、2次新页面访问；原搜索的结果和计量不改。超时取消，超额不再访问传输，结果为UNVERIFIED，不影响下一题。
- 缓存缺失时复用已有Native/官网事实reader，入口只来自已展示门店的权威身份记录，仍经过Guard、原传输的来源节奏和取消信号。两次新访问按显式文档导航/观察到的OPEN_LINK计数，跨浏览器session累计；重定向由原Guard约束，静态资源及同页快照不算新页面访问。不增加开放URL抓取、评论站追读或独立重试。服务重启后可重新读取该店，不以原进程内存丢失拒绝新问题。
- 每个conversation最多20个已接受的不同问题，包含取消或未核实的题；从既有持久事件计数，重复requestId不重复扣题。达到上限提示用户开始新的搜索；未通过身份/用户/版本检查的请求不接受、不扣题。配置见page-question-limits.ts，60秒覆盖原45秒事实候选读取及回答/收尾；3次留给回答及最多两次必要页面解释；两页限制范围，20题将会话追问成本限制在最多60次模型、40次新页面访问。复杂页面可能如实耗尽，不能暗增额度。
- 显式卡片追问的唯一合法动作ANSWER_PAGE_QUESTION可由代码直接选择，仍经过Validator、Router、Reducer并记录代码选择轨迹，不虚构modelAttempt。此例外没有开放式任务选择，不推广为普通找店Agent的固定动作序列；回答和需要的浏览器观察仍由模型完成。

### 4. G1输出与核对

| 状态 | 结构化输出 | 意义 |
|---|---|---|
| ANSWERED | 简短answer、sensitiveCategory、confirmationRequired、1–3条citations、checkedPages | 引用附代码绑定的URL、读取时间和身份依据ID；答案只能陈述所引原文支持的内容 |
| NOT_STATED | answer:null、空citations、sensitiveCategory、confirmationRequired、checkedPages | 仅表示实际查过的这些页面未说明；不推断未访问页面或现实世界不存在该事实 |
| UNVERIFIED | reason、checkedPages；没有答案 | 身份/run/来源/引用或模型输出不合格，页面未完成/超限；整份答案丢弃，不降级猜测 |

模型用提问语言写一句简短答案（上限600字符），引用保持来源原文语言，逐字返回完整来源语句。保留否定、条件、分店和服务范围；表格标签和值分开时，必要的两行一起引用。原文矛盾时如实说明并引用双方，不替用户选择结论；模型输出必填布尔sourceConflict，代码据此要求向餐厅确认。代码核对每条引文在规范化空白后出现在该店本次页面文本中，绑定HIGH身份、run、入口URL、页面URL、读取时间及来源语句ID；幻引、错店、篡改引用或代码已标为评论的语句使整份答案成为UNVERIFIED。

**敏感类别由模型标注**：ALLERGY、RELIGIOUS_DIET、ACCESSIBILITY、NONE。代码不使用问题关键词分类器。敏感答案只能归属/转述页面说法，不得给出适合/不适合、可以/不可以或安全保证。代码只做基本形式检查，例如敏感答案去掉前导空白/引号后以英文yes/no开头即INVALID_MODEL_OUTPUT；其他语义结论及标签误判（包括把敏感题标NONE）无法由该形式检查完整识别，交独立真实模型评测。

confirmationRequired由代码按敏感标签或sourceConflict生成；任一为真即true。sourceConflict只存在于独立问答模型Schema，不新增持久结果字段，Agent/State/TaskDefinition不变。对主要由拉丁字母构成的问题（字母中占比>60%），答案若主要为汉字/平假名/片假名（字母中占比>60%）即INVALID_MODEL_OUTPUT；这只是字符比例检查，不能保证语言正确。素食、纯素、无麸质偏好在不涉及过敏时标NONE，由模型判断，不建问题关键词分类器。商家信息没写、只有评论提到时返回NOT_STATED，不引用评论。核心不拼接“页面未说明”或“请向餐厅确认”等展示文案。展示层用英文呈现`Not stated on the page`及确认提醒`Please confirm with the restaurant`，并显示查过的页面。当前不改Web入口或展示层。

价格、套餐、营业时间、取消规定等时间敏感信息必须展示读取时间；核心每条引用总带readAt，后续展示不得省略。保存页面只证明离线回归，不是实时价格、营业或库存。

代码能证明字面引用和关联完整性，**不能完全证明简短答案忠实、引用足以支持结论、是否遗漏相反语句、语言/敏感类别是否正确，或NOT_STATED语义正确**。不能把fixture模型或核对通过当作这些质量指标达标。

### 5. 整页覆盖与既有事实链复用

共用createRestaurantFactSourceDocument和selectRestaurantFactStatements，通过参数选择限额。既有HARD链路不传新参数，保留原每语句≤1,600字符、总计≤6,000字符、最多50语句，以及选择核对≤1,600字符的行为和输出。没有修改旧HARD Prompt14/output4、判断或请求criteria。

G1每页允许总计60,000字符、最多1,200个非空语句、单语句≤6,000字符（与既有实现一样按JavaScript字符串长度计；空白规范化只用于完整性/引用比较）。选取这些上限是为了覆盖已保存Tabelog约10k–14k字符的可见页面及较多短行，而不沿用HARD的50行截断。完整性检查必须确认全部可见文本进入分段；PENDING、空文档或任一限额导致遗漏时，模型调用前即UNVERIFIED/INCOMPLETE_PAGE，不从截断文本推出未说明或部分通过。

NativeSourceFactRead/GoogleListedWebsiteFactRead的导航、Guard、身份、预算和取消继续复用；可选页面观察hook不接入既有工厂，原有事实行为不变。G1只是将解释目的从“绑定请求条件”泛化为“回答给定问题”，没有第二套抓取/身份/事实权威，也不把问答写成HARD满足标志。

2026-10-28 revision0.4：G1在原始行完整性检查和评论角色绑定之后，按。．！？.!?进一步分句，保留句末标点/闭引号。ASCII小数与URL内部标点不拆，表格短行完整保留；所有子句继承原行评论角色。仍须逐字引用完整句子，不能任取子串；分句后超过1200语句即INCOMPLETE_PAGE。旧HARD分段函数、上限和序列化结果不改。

本批独立对象restaurant_page_question的Prompt和输出Schema均为3；不是Agent Prompt或语义Prompt的新版本。不改State、TaskDefinition、Agent动作Schema或Guard。

### 6. 评论区段及残余风险

可由公开语义明确识别的评论区段，代码标为USER_REVIEW并拒绝引用：HTML h1–h6中的明确Review/Reviews/Customer reviews/口コミ等标题，在当前可见文本中有唯一完整行对应，且下一个同级或更高级标题也有唯一可见对应时，将两者间的语句标为评论。此处依赖文档标题层级与可见文字；不读取私有class、testid、固定元素位置或点击序列。私有标记改名后同一公开语义仍应得到同样拒绝；旁边商家信息不应被误排除。

这是**可识别区段的正向标记，非完整评论过滤器**。没有明确标题、标题重复/映射歧义、非标准标题/ARIA结构、混合或未标记的评论仍可能未分类；代码不凭私有class补猜。SOURCE_TEXT只表示未被本规则标记的来源文字，不等于已证明是商家承诺。提示仍禁止使用客户评论，但不能靠提示保证零误用。这些残余风险须由A的评论陷阱题和独立评分检验，错误声明目标为0；不能把已通过单个保存页拒绝说成所有评论均被阻断。

### 7. 范围及首个用途

接待方式（可预约、仅到店、两者都可）从页面明确说法读取并引用。不得从查位成功反推接待政策，也不得从无已核实空位反推仅到店。没写则有界NOT_STATED，不新增库存或预约资格结论。

不做开放网页搜索、第三方评论页面追读、多店比较、预约/提交/支付。既有Tabelog/TC门店页的商家内容与用户评论、邻店必须区别；读取来源身份不自动证明每段内容是商家承诺。没有Authorization不得外部写，提交不明仍OUTCOME_UNKNOWN。

## Validation

### G2观察原则

由A维护冻结种子和保存页变体。按种子可复现地改名私有class/testid及改变不承载语义的结构，在真实Chromium里运行观察和完成判定；逐页记录PASS、DEGRADED_HONEST或FAIL，任何错误声明立即停止。变异若破坏可见文字、ARIA/label、可见链接/控件、原生值等公开语义，不属于有效样本，不能混进通过或失败分母。

当前冻结的Tabelog日历样本可保留已审阅的诚实退化；G3完成后这些样本必须PASS，不能无限沿用退化豁免。任务完成与诚实性分别报告；只有不报错或不说假话，不能证明任务完成。不得通过删核验、降断言或把站点代码挪进Pack/通用层满足行数。

### G1独立问答验收

题目与答案分文件存储。**实现方只能读题目，不能读答案（包括.eval-artifacts/phase3b/g1-qa/answers*.json），也不得复制、哈希或把答案塞入Prompt/测试期望。** 逐题答案经复核者确认后才形成验收集；未确认的草稿不能作为质量门槛。

独立评分同时核对同店、本次读取、原文引文/URL/时间，以及简短答案是否被引用支持、NOT_STATED是否正确、敏感标签和转述是否合规。评论陷阱与矛盾来源必须纳入。错误声明目标为**0**；真实模型结果与fixture接线分开报告，不能用实现自己的判定自证。

### 本批离线证据与后续门槛

本批先在旧代码取得简短答案、保存页6000字符后事实、整页未说明和评论误接纳的有效红灯，再取得绿灯；保留身份/run/冻结快照、三种结果及三个反事实控制。参数化前后的旧HARD文档、选择、完整Native事实结果和模型请求，用固定时钟比较序列化字节。五门禁逐项前后净树，输入/外层脚本运行前提交SHA；不读.env，新增真实模型、Google、网站、Live均0。

文本批准后另批接Agent合法动作和Web追问，复用本次缓存，再做约30–40题×3次（≤120模型调用）的独立G1质量评测，之后开始G3。本批不提前做这些事，不合main。

## Consequences

- 用户获得简短答案+原文证据的合同，敏感提醒不再泛用于所有问题。
- 字面、身份和运行核对仍由代码控制；答案语义/敏感标签/未说明正确性留给独立真实模型验收，不虚报安全保证。
- G1整页读取不再受HARD的6000字符/50语句限制；真实超限明确无法核实。
- 原文与引用只在当前调用中处理，不新增State写入或普通日志的原始页面存储；数据脱敏与授权边界保持。
- 3a′签收时网站行数3,847/Pack473；C合入后的当前main为3,878/478，本批不增加。≤3,591仍是G3门槛，不以本稿或基础设施完成代替。

## Alternatives considered

- 所有问题只抄原文并加确认提醒：用户已否决，过度收窄且难以处理日文来源/英文提问及表格。
- 问题关键词敏感分类器：不采用，由模型标注，代码只做结构与基础形式检查，质量独立评分。
- 自由答案无可核对原文：不采用，引用失败整份丢弃；保留否定与条件。
- 增加各类问题正则或伪造HARD条件：不采用，沿用既有事实读链泛化解释目的。
- 用私有class完整隔离评论：不采用，违背观察原则，未识别内容必须披露残余风险。
- 当前即接入Agent/Web、开始G3或调用真实模型：不采用，等待用户批准ADR文本和后续批次。

## Related documents

- [Restaurant Domain](../domains/RESTAURANT-BOOKING.md)、[Capability Matrix](../integrations/CAPABILITY-MATRIX.md)
- [52组现有观察依赖](../../.eval-artifacts/phase3b/g1-core/observation-inventory.md)、[批次2切片](../../.eval-artifacts/phase3b/g1-revision/plan.md)
- [Test Skill](../skills/test/SKILL.md)、[Eval Skill](../skills/eval/SKILL.md)
