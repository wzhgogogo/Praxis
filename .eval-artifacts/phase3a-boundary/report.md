# 推荐与查位边界：完整主回归与v23对照，停止点3

- Evidence status: **frozen regression / exposed development，未合main，非Clean Baseline**。
- 用户修正规则后，已完成原计划 **72轮主回归＋11个v23单次对照**。累计模型请求 **84/144，余额60**：包含此前1次、剩余71主轮中的1次Schema校验重试；没有额外重跑。
- 主轮目标/依据口径 **69/72满足**，3项待复核；这不代表其他语义字段或产品任务通过。14个灰区各额外3次及Wednesday3次均RECOMMENDATION，15组均3/3；对照完全排除在新规则通过率外。

## 1. 范围、授权与冻结提交

分支 `codex/adr-0044-recommendation-availability-boundary`；本次执行冻结提交 **09bf72149e94bab3c321cf3814a1ca7a2fae1dc6**。新停止规则、72轮原输入、控制选择规则、同输入/时间/上下文约束、历史v23参考、凭据范围及618项SHA均先提交，之后才执行。[授权原文](batch3/continuation/approval.md) · [配置](batch3/continuation/config.json) · [冻结清单](batch3/continuation/freeze.json)，SHA-256 `b811adfe7a11d2eb74decf1dc9241d841db408f01e1f6f1f3e04ea75a907805a`。

继续执行于 **2026-10-25 23:38:56.599–23:43:07.827 CET（UTC+1）**。SR01-T01保留20:57的已确认真实输出，离线重放到Compiler/Runtime作为SR01-T02的实际上下文，没有再次调用该轮。原先提前停止的执行和评价不改写；[此前报告原文](batch3/continuation/pre-continuation-report.md)和原始001响应仍保留。

生产Prompt@24、Proposal@4、Scorer@4、State@20、TaskDefinition@18及所有Gold均未改。v23对照使用cca576ec的原Prompt渲染函数及配套Schema3/原验证器，仅在隔离的评测reference目录使用；当前生产契约仍拒绝Schema3，不增加兼容路径。所有源码和618项运行配置在结束后仍匹配。

## 2. 结果、差异、检错与限制

### 主轮结果

| 队列 | 完成 | 目标/依据满足 | 非目标值匹配 | 非目标差异 | 未评价 |
| --- | --- | --- | --- | --- | --- |
| 开发语义回归 | 15 | 12 | 4 | 11 | 0 |
| 灰区额外重复 | 42 | 42 | 2 | 40 | 0 |
| 已暴露留出集 | 12 | 12 | 5 | 0 | 7 |
| Wednesday新开发输入 | 3 | 3 | 无Gold | — | 3 |
| 合计 | 72 | **69** | 11 | 51 | 10 |

主轮71份合法提议、1轮最终输出无效；69/72是冻结目标规则与引用/沿用判定，不是全语义通过率。新目标判断61/63，CONTEXT_CARRY 8/9；旧严格Scorer诊断仍有38项FAIL，保留在每轮记录，未被新指标覆盖。非目标值比较不把raw或未标注诊断当作请求值，但这些差异全部另列。公开留出7例条件措辞/结构未建立完整对应，未自动判语义保真；新Wednesday没有语义Gold。

三项目标/合同未通过：

1. **SR02-T01**：没有到访时间，模型仍因“I need a table”给AVAILABILITY；冻结NO_TIME期望RECOMMENDATION。
2. **SR02-T02**：沿用的目标值是AVAILABILITY，但没有新TARGET/依据；按冻结B类新目标标注未满足。不能误报为模型选了RECOMMENDATION。
3. **SR08-T02**：两次均输出集合`CRITERION CONFIRM`并带value，现有合同拒绝，保留旧Draft。按修正规则继续后续轮次，没有把无效提议写入State。

开发非目标差异覆盖条件强度/文字、时段和具名目标query，逐字段保留；包括：SR01-T01 yakiniku UNSPECIFIED→HARD、SR03-T02丢失Sushi Dai、SR05 smoking→no smoking及EVENING窗口、SR06下午13:00→12:00、SR08禁止项移除失败/旧上下文保留、SR09窗口19:00–22:00→18:00–23:00、SR10 after-work 18:00–20:00→17:30–22:00。字面差异、时间物化口径与旧Gold不匹配不自动等于同一种语义错误；继承上下文的差异也单列，不全归于当前轮。

[全部72轮对照](batch3/continuation/comparison.md) / [原文、basis、旧新字段JSON](batch3/continuation/comparison.json) · [逐轮原始记录](batch3/continuation/rows/) · [独立复核](batch3/continuation/independent-review.json)。13轮旧开发Gold未标TARGET，实际query/scope等字段保持未标注身份，不补造旧值。G030异常日期键原样保留，日期对象完整性未评价，已观察的条件差异仍记录。

### 灰区额外三次

14组各3次共42次，加Wednesday3次，共45次均为RECOMMENDATION且目标/引用有效；每组多数计数 **3/3**，无效0、缺测0。只用额外3次，不混入开发回归第一次。G067/G069是上下文沿用，其一致性不能当独立目标决策。[分组结果](batch3/continuation/gray-consistency.md) / [JSON](batch3/continuation/gray-consistency.json)。一致率只报告，未将GRAY改成固定推荐，Wednesday仍非Gold。

### v23定向单次控制

72轮完成后按预先提交规则选择11个有非目标值差异的开发轮次，每轮恰好1次。消息、参考时间、时区和该轮pre-turn currentDraft与v24完全相同；不重新跑前缀、不改变上下文。控制使用原v23+Schema3，主轮为v24+Schema4，这个契约包差别及定向采样限制明确保留。

- 10份控制合同有效，全部仍偏离旧Gold；其中9份非目标请求值与v24相同。
- SR03-T02的泛化query措辞不同，但两者都丢失具名Sushi Dai。
- SR08-T02旧Prompt也给集合CONFIRM，单次即合同无效；未追加重试。
- SR01-T01的yakiniku HARD在旧Prompt控制也出现。没有有效配对呈现“v23完整贴合旧Gold、仅v24出现非目标差异”。

因此这些观察**不是v24独有**，与既有模型行为、旧Gold/当前时间物化口径等差异相容；一次配对、继承上下文和Schema3/4差别仍不足以严格区分新Prompt影响与模型波动等根因。不能拿定向11例估算v23全量成功率。控制完全不计入69/72。[控制对照表](batch3/continuation/controls-comparison.md) / [逐字段JSON](batch3/continuation/controls-comparison.json)。

### 检错与四层边界

外层离线4×15轮控制分别覆盖正常、非目标差异、错误目标和无效输出，均继续全部15轮；网络失败停止，144额度和State/basis边界检查通过；历史Schema3只在控制中接受。实际运行完成72＋11，未触发基础设施/额度/S0停止记录。

四层：端到端产品交付NOT_EVALUATED；逐环节为69目标规则满足、全部字段差异与未评项如上，主轮合法提议经原Compiler/Runtime/Reducer继续，1无效提议走原失败事件；独立核对所有实际Draft没有goalBasis，显式编译目标未被后续改写。来源声明/外写与真实用户S0–S4效果仍未评价，未用零网站调用或生产guard标签冒充现实S0证明。归因只到已观察环节和上述配对证据，不宣布唯一根因。

## 3. 离线验证与五门禁

受测提交09bf7214；**2026-10-25 23:35:43–23:37:40 CET**，各项退出0且结束后git status为空，没有恢复文件掩盖测试写入：

| 检查 | 结果 |
| --- | --- |
| 新外层离线自检 | 4×15继续、网络停批、首轮重放、额度/S0、同输入旧Prompt及旧Schema隔离通过 |
| typecheck / arch:check / build | PASS |
| npm test | 1051/1051 |
| test:browser:fixture | 154/154，本机Chromium |

[逐项命令/时间/原日志SHA](batch3/continuation/offline-verification.json) · [原日志](batch3/continuation/offline-gates/)。离线阶段未加载凭据、无真实模型调用。门禁之后才运行受控Node；运行结果及两账本允许按预先声明写入，输入/配置未改。后续提交仅结果/文档，受测生产源码不变。

## 4. 调用、模型标识与凭据

- 主轮逻辑72（复用旧1＋新71），控制逻辑11，合计83≤87；主轮Schema校验多1次，所以累计实际请求 **84/144，余60**。其中先前1、本次新83；主轮物理请求73、控制11。84份provider成功响应，0网络失败、0不确定派发；每个控制恰好1次。
- 请求模型命令行始终`deepseek-v4-flash`；84份响应（含旧001、全部主轮和控制）均报告`deepseek-flash`。两种标识原样记录，不独立推断后台发布版本或别名等价关系。
初次独立核对将请求名与响应名误当同一字段，断言失败边车保存在independent-review-initial-failure.json；复核已分别记录两种名称并确认84份响应一致，未改原始执行数据或语义评分。

- 累计inputTokens570105、outputTokens31059、totalTokens601164；provider latency合计252003ms（包含旧001）。没有价格配置，不估价。
- [本批独立账本](budget.json)累计84；[3a′共享账本](../phase3a-prime/budget.json) externalActual=84，chargeTo400=0，未占其400。
- 仅受控Node以指定主检出绝对路径`--env-file`加载凭据；[沿用窄授权记录](batch3/continuation/credential-authorization.json)声明**未独立读取文件**。没有cat/grep/打印/复制/暂存凭据文件或输出密钥值；凭据日志只有“已加载”。独立复核进程没有加载该文件。
- 模式分列：离线fixture/门禁0真实调用；真实模型静态语义主轮＋控制84请求；本批来源Replay、Google、餐厅网站、Full Live、Controlled Live-write均0；私有Holdout未读。

## 5. 修正规则与偏离说明

本次是用户明确修订停止规则后的新冻结，旧提前停批记录完整保留。语义不一致或合同无效不再停整批，仅基础设施、额度或S0停；没有新增重试，继续使用主Interpreter既有最多2次输出尝试，控制只有1次。

原开发Harness把Gold比较作为Compiler之前的门，故仅取消外层停批仍会阻断后续上下文。新外层将比较保留为观测，合法提议仍经未变的Compiler（使用可信冻结参考时间）与Runtime/Reducer形成后续真实上下文；无效提议按原失败事件保留旧Draft，后续照常解释。这是外层接线/评价配置变化，不是修改生产Prompt、Gold或Scorer，也没有用预期Gold给模型补上下文。

非目标请求值与raw/provenance/未标字段分开记录，原严格评分保留。控制选择按冻结的请求值差异，包含SR08-T02因无效输出保留旧状态的差异；所有控制均使用主轮实际pre-turn上下文，因此继承问题不能全归当前Prompt。历史v23仅是当前批准控制的隔离参考，不是产品兼容层。

## 6. 停止点3逐条确认

已完成并停 **STOP_3**，等复核，不再调用，不改Prompt/Gold，不合main。

[全部差异及未评项逐条清单](batch3/continuation/pending-confirmations.md) / [详细JSON](batch3/continuation/pending-confirmations.json)含72行观察；其中未标字段/诊断/未知不等于72个语义错误。SR01-T01强度、三项目标/合同未通过、11个开发非目标差异、42灰区复测中的字段差异、公开7例未评及G030日期异常均保留。

SR03-T02旧Gold目标RECOMMENDATION→新规则B AVAILABILITY继续单独待确认；具名Sushi Dai丢失是另一个问题，不能通过把Gold改成泛化query消除。原14灰区/22份来源及13未标TARGET的后继标注候选仍保留原指针，确认后另行升版，历史输入/evaluation不覆盖。Wednesday不转Gold，灰区不因3次推荐擅自固定目标。所有差异只记录，下一步由用户逐条决定。

完成结果提交后按授权推送本分支，并以ls-remote核对完整SHA。主线未合并。
