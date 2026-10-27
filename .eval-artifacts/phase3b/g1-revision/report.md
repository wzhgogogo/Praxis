# 3b 对话B批次2：G1核心修订与ADR统一

报告时间：2026-10-27T03:39:16.309410+01:00（Vienna CET，UTC+1）。
状态：**实现与验证完成；用户已重新批准Git收尾与工作分支推送。源码验证提交bb967901；实际交付SHA以Git回执核对。ADR文本仍待用户批准；不合main、不接入口、不开始G3。**
分支`codex/feat-phase3b-g1-core`，按用户指定从`0a466bcd`继续。最终代码/五门禁测试提交：`bb96790104909449445ef46057cc6d97a762ae28`。后续提交仅报告、账本和状态/历史，不改已测源码。

## 逐项交付

| 用户项 | 完成情况 |
|---|---|
| ADR统一 | 当前唯一[ADR-0046](../../../../docs/decisions/0046-observed-actions-and-source-quoted-answers.md)，删除B原0047；保留Proposed，明确“原则已由用户2026-10-27批准；文本待用户批准”。A的Validation按用户给出的内容整合为自己的文字；A/C自行删除重复稿，本分支没有改其文件。全文在本报告末尾。 |
| 简短答案+引文 | restaurant_page_question Prompt2/Schema2；模型用提问语言给一句≤600字符答案、敏感类别、1–3条原文引文。表格标签/值可分开引用；要求保留否定/条件/分店/服务范围，冲突时说明并引用双方。代码仍核对同店、当前run、来源/时间、逐字引文，失败整份丢弃。 |
| 敏感规则 | 模型标注ALLERGY/RELIGIOUS_DIET/ACCESSIBILITY/NONE，不新增问题关键词分类器。代码拒绝敏感答案去掉前导空白/引号后的yes/no；不声称该形式检查能证明转述忠实或敏感标签正确。 |
| 整页覆盖 | 共用分段/选择函数参数化：G1每页60,000字符、1,200非空语句、单语句6,000；旧HARD1,600/6,000/50及选择1,600默认不变。按完整文本核对，超限/未完成在模型前INCOMPLETE_PAGE，不从截断内容推出未说明。 |
| 评论 | 识别可见Review/口コミ等标题及下一个同级/更高级标题的唯一行边界，标USER_REVIEW、拒绝引用；不读私有class/testid。明确标题缺失、重复/歧义或非标准结构仍有未识别评论风险，ADR明示并留独立评论陷阱题。 |
| 展示文案 | 核心返回answer/状态/引用/敏感类别/confirmationRequired等结构化字段；NOT_STATED为answer:null，普通问题confirmationRequired=false，敏感true。没有拼接中文或统一确认提示。英文显示文案规定在ADR；实际展示层随下一批Web接线，当前不改Web。 |

## 有效红灯、绿灯与边界

| 检查 | 红灯 | 绿灯／证明范围 |
|---|---|---|
| 回答方式 | e6bcf443旧核心把“日文表格引文+英文简短答案”拒为UNVERIFIED；[日志](red-answer.log) | 同一字面答案/两条日文引用断言通过，Prompt/Schema2；只证明fixture接线，不证明真实模型翻译质量。 |
| 保存页后半事实 | 18b2e805旧核心在真实Chromium保存页上看不到字符7,515后的固定原文；[红灯](results/prior-code-red/coverage.log) | [完整保存页绿灯](results/coverage-green/result.json)：9,681字符、373非空行，后半原文进入模型并ANSWERED，引用和URL核对通过。 |
| 整页未说明 | 相同完整保存页旧限额得到UNVERIFIED/INCOMPLETE_PAGE；[红灯](results/prior-code-red/not-stated.log) | [绿灯](results/not-stated-green/result.json)为NOT_STATED、answer:null。问题固定为页面关于热气球到店的说明，仅作fixture未说明通道检查，不是实际模型准确率。 |
| 评论误接纳 | 旧核心接受实际保存页Review区的“Incredible sushi lunch for this price!”；[红灯](results/prior-code-red/review.log)。另有[模块红灯](red-review-unit.log)。 | [绿灯](results/review-green/result.json)拒为UNVERIFIED/INVALID_MODEL_OUTPUT，代码role为USER_REVIEW；私有标记改名及旁边商家语句正例均通过。 |
| 敏感基础形式 | f6339803给yes/no添加前导空白/引号可绕过初版形式检查；[红灯](results/sensitive-prefix-red.log) | 相同负例修复后通过，保留源转述正例；不扩成语义/关键词分类器。 |
| 原有三反事实 | [最终控制](results/mutations/controls.json)：分别移除引用、HIGH身份、敏感形式检查，全部目标AssertionError/exit1 | 最终源码原字节恢复后，所有对应反例仍拒绝、正常对照通过。 |

保存页来自仓库既存`tabelog-sen-no-slots-20261010.html`，采集2026-10-10；原始SHA：`65110e43e4f80255cad45acb3f92fe872b9990fa4200f75e124ef67ccdfe68f7`。没有修改fixture或向仓库新增fixture副本；旧源码临时快照用于版本对照，已清理。Chromium禁用JavaScript、每个请求均abort；外部请求发送0。来源缺外部CSS的既有provenance保留，不把这个保存页当作当前Live页面或实时库存。
评论控制为避免旧50语句限额先隐藏评论，使用同一真实body中从Review到Restaurant information的754字符未改写原文片段（不是补造内容）；全文覆盖/未说明控制用完整9,681字符。报告区分两者，不将片段控制当整页身份验证。身份envelope在该外层控制中明确为合成；既有身份链的正反例保持，不宣称新增Adapter身份能力。
最终红绿使用**同一冻结外层脚本、页面和问题**：[旧Git源码红灯记录](results/prior-code-red/red.json)。旧源码在临时Git archive中运行后已清理，fixture输出按旧schema1编码，当前产品没有兼容分支。准备期协议探针另放[preliminary](results/preliminary/)，不计最终证据或质量分母。

## 旧HARD事实逐字节一致

修订前在e6bcf443记录，修订后用同一已提交脚本、相同输入和固定CET时钟比较序列化字节。比较包含三组默认文档（单行上限、累计6000边界、50行边界、CRLF/空白）、语句选择结果、完整Native事实evidence/factChecks/sourceDocuments/metadata，以及原HARD模型请求（Prompt14/output4）。
- 字节数：**44,197**；修订前后SHA-256均为`9a3298bc5e004b99e41d80713e8913b68c336cfa594f6eb60599e310ee3fb633`。
- [冻结修订前字节](facts-before.json)、[比较脚本](check-fact-compatibility.ts)、[比较通过记录](results/fact-bytes.log)。固定Date.now用于去除时长非确定性，没有删除事实字段再比较。
- 模块旧事实/G1相关测试合计**76/76**；[日志](results/related.log)。所有默认/HARD调用者不传新限额；新语义角色仅在G1文档副本增加，不进入旧事实输出。

## 五门禁

最终提交`bb96790104909449445ef46057cc6d97a762ae28`，macOS-26.6.2-arm64-arm-64bit，Node v24.4.1；Chromium文件并发4。每项前后`git status --porcelain`均为空，restore0、fail/skip/cancel0，无例外放行。[机器记录](results/gates/gates.json)。

| 门禁 | 结果 | 耗时／日志 |
|---|---|---|
| typecheck | PASS | 0.453秒；[typecheck-1.log](results/gates/typecheck-1.log) |
| arch:check | PASS | 0.185秒；[arch-check-1.log](results/gates/arch-check-1.log) |
| npm test | PASS 1142/1142 | 28.255秒；[npm-test-1.log](results/gates/npm-test-1.log) |
| build | PASS | 0.452秒；[build-1.log](results/gates/build-1.log) |
| test:browser:fixture | PASS 162/162 | 97.632秒；[browser-fixture-1.log](results/gates/browser-fixture-1.log) |

Chromium本批单次97.632秒；不冒充三次耗时评测。用户已报告批次1在Linux复跑五门禁通过；本批Linux未运行，不将其算作修订后证据。

## 冻结、归属与调用账本

- [最终冻结清单](gates-inputs/freeze.json)：614文件；SHA-256 `7eff249f30f12200fe26dd790049fa265c751489d1b7c1cc5bb1ef74fe54d82d`。运行前提交，门禁后及反事实恢复后逐文件核对未变。
- [五门禁脚本](run-gates.py)SHA-256 `6e08a59053e812d2f5101eafe46c2b53e44712ff1c080745b3e14b93b478077c`；[保存页外层脚本](verify-saved-page.ts)SHA-256 `7d40ad02dde767752e92f6f302fef71f49b1b5fcfb335f31483e332c10064094`；[旧事实对照脚本](check-fact-compatibility.ts)SHA-256 `b56cc6bd58834453ed9ac302c757671bfc4bcfa66814157dcda71ceee78c3502`。
- 源码相对0a466bcd仅四个B文件：fact-source-document.ts、model-page-question.ts及其测试、新page-review-sections.ts。A/C评测、fixture、Runner、语义、身份文件未改；没有Agent合法动作/Web/State/TaskDefinition/Guard/共享Prompt变动。
- **未读取或哈希G1 QA答案文件；未读取或暂存.env。** 冻结脚本拒绝QA答案/.env路径；只使用用户指定的保存页和最小内联测试，没有读取问答集题目或答案。
- 新增真实模型、Google、餐厅网站、Live、评测公开GET、环境重跑全部**0**。fixture模型/本地保存页不计真实调用。
- [共享账本](../budget.json)保留0a466bcd全部原有行，仅追加本批B两个0增量id，不覆盖A/C或旧B记录；A publicGET与evaluationPublicGET仍同一40额度。后续分支合并按id并集，异内容同id停下，不覆盖。
- [统一行数统计](adapter-lines.json)：两站非测试TS仍**3,847**，Pack单列**473**，增量0。没有把站点代码搬入通用层充数；≤3,591留G3。

## 评价边界、评论结论与停止

| 层 | 结论 |
|---|---|
| 端到端 | 离线G1核心合同与保存页输入通过；完整Agent/Web未接线、真实模型/Live未运行，不报告产品交付率。 |
| 逐环节 | 原文、身份/run/冻结快照、关联URL/时间核对保持；简短答案/敏感标签/表格/冲突均fixture接线，语义质量待独立问答集。 |
| 严重程度 | 已构造误引/错店/敏感yes-no/已识别评论负例拒绝；没有实际外部执行或用户展示，不据此宣称Live S0=0。未来G1错误声明目标0。 |
| 归因 | 原HARD上限导致G1内容缺失、原抽取式合同拒绝答案、无评论区段校验均有旧实现目标红灯；参数化/新合同/可见语义角色取得绿灯。 |
评论处理结论：明确语义标题区段**已实施拒绝**；缺标题、重复/歧义及未标记评论**仍有残余风险**，SOURCE_TEXT不等于商家认证。该风险与答案忠实、敏感标签正确、未说明语义都必须由A维护、复核者逐题确认的独立答案集及真实模型评测检验；实现方不读答案。
本批完成后停止。等待用户批准下附ADR文本，再按下一批接Agent合法动作及Web追问/缓存，跑约30–40题×3（≤120调用），之后G3；当前全部未做。分支只推`codex/feat-phase3b-g1-core`，不合main。

## Git交付审批记录

收尾暂存六份状态/历史文档时，自动权限审批审查两次未能在期限内完成（含工具允许的一次重试），Git进程未启动。返回说明不表示动作被判不安全。用户随后已明确批准并要求重试，本次据此继续暂存、提交和推送工作分支；此前五门禁、冻结SHA和本地代码提交不受影响。最终提交、净树和推送结果在交付时以Git回执核对。该批准仅用于Git交付，ADR仍为Proposed。

## ADR-0046最终文本全文（Proposed，供用户批准）

以下逐字来自[当前ADR文件](../../../../docs/decisions/0046-observed-actions-and-source-quoted-answers.md)，SHA-256 `96b0f371fbc2479fc80d86f51873884ebbf3e597efcc86806bf4cb8887af8e7c`。

<!-- BEGIN ADR0046 FULL TEXT -->
# ADR-0046：观察驱动的站点操作与同店原文问答

- Status: **Proposed**
- Approval: **原则已由用户 2026-10-27 批准；文本待用户批准**。文本获批后才改为Accepted。
- Document revision: 0.2
- Last updated: 2026-10-27（Vienna CET，UTC+1）
- Source of truth for: 3b观察原则、G1合同与G2/G3验收提案；不是已接入产品能力
- Related ADRs: [0010](0010-restaurant-agent-loop-action-validation.md)、[0021](0021-cited-source-fact-investigation.md)、[0022](0022-current-source-fact-lifecycle-and-identity.md)、[0036](0036-generic-public-read-network-policy.md)、[0044](0044-recommendation-availability-boundary.md)、[0045](0045-bounded-read-conclusion-reserve.md)
- Evidence status: draft / not integrated。仅离线核心和本地保存页验证，未运行真实模型或Live。

## Context

3a′在main cc127320带缺口签收，网站适配器3,847行，≤3,591目标未达，L1/L4/L5转入3b查位核对/页面结构变化告警。ADR-0044 revision1.1的推荐/查位边界保持。用户已咨询日本律师并提供当前做法没有问题的结论；本稿不改变Guard、只读或授权边界。

3b原则要求动作来自实际观察，追问答案来自同店本次读取的原文。批次1分别出现A0046、B0047和C0047重复草稿；按用户2026-10-27决定统一为本稿0046，删除B原0047当前文件。旧提案在Git 0a466bcd保留，未曾获批；A/C各自撤除重复稿，本分支不编辑它们的文件。

操作观察与问答共用“当前来源证据→模型提议→代码核对”的权威边界，因此在同一ADR中定义。批次1将所有回答缩为原文摘录，比用户计划更窄；本稿恢复**简短答案+逐字引用**，只对敏感问题限制为转述。字面核对不能证明答案语义忠实，后者必须独立评测。

## Decision（原则已批准，具体文本Proposed）

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
- 提供当前run ID/开始时间及可用已读页面。页面带可见文本、URL、读取时间和现有同店规则产生的HIGH身份依据；优先复用本次缓存，旧run/其他分店不可挪用。模型调用前复制本次选用的快照，避免后续缓存更新错配原文与元数据。
- 需要新访问时复用Native/官网事实reader，继续受原有Guard、来源/整单/共享模型预算与取消信号约束；没有开放URL抓取器、独立重试或新预算。当前只提供可注入的reader及页面hook，尚未安装到Agent/Web生产工厂。

### 4. G1输出与核对

| 状态 | 结构化输出 | 意义 |
|---|---|---|
| ANSWERED | 简短answer、sensitiveCategory、confirmationRequired、1–3条citations、checkedPages | 引用附代码绑定的URL、读取时间和身份依据ID；答案只能陈述所引原文支持的内容 |
| NOT_STATED | answer:null、空citations、sensitiveCategory、confirmationRequired、checkedPages | 仅表示实际查过的这些页面未说明；不推断未访问页面或现实世界不存在该事实 |
| UNVERIFIED | reason、checkedPages；没有答案 | 身份/run/来源/引用或模型输出不合格，页面未完成/超限；整份答案丢弃，不降级猜测 |

模型用提问语言写一句简短答案（上限600字符），引用保持来源原文语言，逐字返回完整来源语句。保留否定、条件、分店和服务范围；表格标签和值分开时，必要的两行一起引用。原文矛盾时如实说明并引用双方。代码核对每条引文在规范化空白后出现在该店本次页面文本中，绑定HIGH身份、run、入口URL、页面URL、读取时间及来源语句ID；幻引、错店、篡改引用或代码已标为评论的语句使整份答案成为UNVERIFIED。

**敏感类别由模型标注**：ALLERGY、RELIGIOUS_DIET、ACCESSIBILITY、NONE。代码不使用问题关键词分类器。敏感答案只能归属/转述页面说法，不得给出适合/不适合、可以/不可以或安全保证。代码只做基本形式检查，例如敏感答案去掉前导空白/引号后以英文yes/no开头即INVALID_MODEL_OUTPUT；其他语义结论及标签误判（包括把敏感题标NONE）无法由该形式检查完整识别，交独立真实模型评测。

confirmationRequired由代码按敏感标签生成；普通问题为false，敏感问题为true。核心不拼接“页面未说明”或“请向餐厅确认”等展示文案。展示层以后用英文呈现`Not stated on the page`及敏感提醒`Please confirm with the restaurant`，并显示查过的页面。当前不改Web入口或展示层。

价格、套餐、营业时间、取消规定等时间敏感信息必须展示读取时间；核心每条引用总带readAt，后续展示不得省略。保存页面只证明离线回归，不是实时价格、营业或库存。

代码能证明字面引用和关联完整性，**不能完全证明简短答案忠实、引用足以支持结论、是否遗漏相反语句、语言/敏感类别是否正确，或NOT_STATED语义正确**。不能把fixture模型或核对通过当作这些质量指标达标。

### 5. 整页覆盖与既有事实链复用

共用createRestaurantFactSourceDocument和selectRestaurantFactStatements，通过参数选择限额。既有HARD链路不传新参数，保留原每语句≤1,600字符、总计≤6,000字符、最多50语句，以及选择核对≤1,600字符的行为和输出。没有修改旧HARD Prompt14/output4、判断或请求criteria。

G1每页允许总计60,000字符、最多1,200个非空语句、单语句≤6,000字符（与既有实现一样按JavaScript字符串长度计；空白规范化只用于完整性/引用比较）。选取这些上限是为了覆盖已保存Tabelog约10k–14k字符的可见页面及较多短行，而不沿用HARD的50行截断。完整性检查必须确认全部可见文本进入分段；PENDING、空文档或任一限额导致遗漏时，模型调用前即UNVERIFIED/INCOMPLETE_PAGE，不从截断文本推出未说明或部分通过。

NativeSourceFactRead/GoogleListedWebsiteFactRead的导航、Guard、身份、预算和取消继续复用；可选页面观察hook不接入既有工厂，原有事实行为不变。G1只是将解释目的从“绑定请求条件”泛化为“回答给定问题”，没有第二套抓取/身份/事实权威，也不把问答写成HARD满足标志。

本批独立对象restaurant_page_question的Prompt和输出Schema均为2；不是Agent Prompt或语义Prompt的新版本。不改State、TaskDefinition、Agent动作Schema或Guard。

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
- 网站行数3,847/Pack473不变，≤3,591仍是G3门槛，不以本稿或基础设施完成代替。

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
<!-- END ADR0046 FULL TEXT -->
