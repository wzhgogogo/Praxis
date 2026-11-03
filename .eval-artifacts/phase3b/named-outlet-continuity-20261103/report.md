# D6 具名店跨回合连续性修复

- Status: offline verified candidate / not integrated；已暴露开发回归，非 Clean Baseline。
- Vienna CET UTC+1，2026-11-03；分支 codex/fix-phase3b-named-outlet-continuity，从 main533f1bc5 开出。只推工作分支交复核，不合main。
- 本轮真实模型/Google/网站/Live调用均0，未读取或加载.env。所有Google、页面、库存和新增合法动作均为明确的离线I/O；未创建任何预约。

## 当前交付

用户批准的两文件合同同步单独提交 **beff503b**，与原冻结提案逐字一致。冻结源码 **0147ed6a** 已通过五门禁和严格G2：默认 **1382/1382**，Chromium **188/188**，G2 **5/5且12页PASS**，独立原9+名称7+D6 13帧及组件控制PASS。11步各前后净树，无超时、跳过或自动重试；真实调用0，不读.env。最终记录见gates-approved.json和final-verification.json；下方早期红灯和等待授权段落为历史记录。本第二项只推工作分支交复核，不合main。

## 第一项已经完成

已复核 ca18d02b 与最新main d4d8ea33 同步，源码相同。abaf8266 新鲜净树十步：type/arch/build、默认1372/1372、Chromium188/188、严格G2 5/5和12页PASS、独立16帧全部通过；已合入并推送 main **533f1bc5cb42fa7a68a5696b201df46575cf1228**，ls-remote核对，已通知A。证据在 ../named-outlet-main-20261103/。本分支是第二项，不能把第一项合入当作D6已修。

## 历史裁定与本次红灯

历史D6（A5912dd11）按用户确认是 **S0=1，单位是一次展示，包含5张错误店卡**；adjudication.json单列。A原自动NOT_EVALUATED/s0=0与复核材料逐字节保留，不回写。旧D6用户指向INITIAL第一家Ito，Google Place ID `ChIJwUnGVR2TGGARNAEaZNumYhQ`，电话03-3598-2992；后续五店均不是它。

当前main已带ca18d02b：固定来源整组装会拒绝D6原五店PRESENT_RESULTS，不能把旧Live说成当前再次错误展示。有效红灯分别是：

- `6057accc`：直接使用D6实际Native五店/AREA/证据字段时，无名称记录的守卫仍返回true；普通三回合已先推荐真实三个Google IDs、问Ito人数，补人数后因丢失已选Place ID而把Ito与附近Denny's当歧义，EXACT和同ID改名控制均NEEDS_INPUT。不是启动/类型错误。
- `001abf4b`：普通组装生成真实可用的来源缓存后，只把DTO的目标改为另一家Ito，B1仍投影1个其他店链接。纯投影恶意DTO控制另标，不冒充真实三回合。

## 原始回放与构造部分

frozen-input.json、模块manifest保存A原Git SHA、4份原件SHA以及14条outputText UTF-8字节SHA。三回合语义#1/#9/#12、初始SEARCH/PRESENT、问人数、后续SEARCH和原五店PRESENT响应逐字使用。原#5/#6/#16/#20等保留但不强行执行已不存在的原候选；原五店展示被拒后，用显式FIXTURE动作执行新合法查位/展示。不是23次响应与原HAR逐步完全相同的重放。

Google首轮三个店的ID、名字、地址、电话、坐标来自D6原视图；类型/区域响应和浏览器页、预约库存为构造。RENAMED只把同ID当前显示名改为Chuka Soba Ito Akabane，来源页使用相同构造名；不是新增Gold或模型翻译。Ito的构造Tabelog库存不代表这家真实店可预约。

## 实现与版本

1. 所有SPECIFIC_OUTLET都走命名检索，不再按AREA进入普通店池。AREA保留用户原文，只帮助核对地点；未绑定记录不再默认放行。唯一的身份支持全名或已批准的包含规则继续有效，Sen/Senga、别名、分店/地址/号码冲突不放宽。
2. 从现有SEARCH_COMPLETED、HIGH来源身份证据及USER选择事件重建公开来源身份；USER的原始语义事件与causation保持。补人数/日期等无新TARGET的回合继续使用该引用；新OPEN_ENDED目标撤销旧引用。仅Google Place ID或Tabelog/TableCheck店号构成身份锚点；同名、电话和旧candidateId单独均不是新锚点。
3. Google按选定Place ID重读，在发送前计入原请求上限；返回ID必须相同。404返回无候选，不以附近店替代。AREA存在时，沿用已观察的地理解析核对，来源名变化不丢掉同ID用户引用。冷的未锚定具名请求仍遵守名称唯一性规则。
4. 只有原生来源ID而无Google ID时，重用带原观察时间的DISCOVERY作为查找种子（USER_SELECTION_REFERENCE），随后仍由G4读新身份/事实/空位。不会复制旧ENTITY_MATCH、FACT或AVAILABLE。新AREA不继承旧距离；无法核实时保持未知。本分支对这一路提供组件验证，D6完整三回合验证的是Google身份路径。
5. 展示IDs、对外B1投影和条款入口/上下文使用同一名称守卫。准备缓存仍保留；两次链接验证、来源原链接、取消/卡要求、引用核对、复用、模型预算和20秒保留规则不变。booking-terms.ts仅新增import及两个名称资格条件，完整差异可审阅。
6. 找不到/没有合格空位时，助手点名Ito和日期/时刻/人数，请用户决定是否看其他店。明确用户新OPEN请求后，才展示其他店。

**State25 / TaskDefinition23 / Draft3 / Semantic Proposal4 / Semantic Prompt26 / Agent Context及Action Schema版本不变。** NamedOutletReference是从既有权威事件重建的瞬时端口参数，不进入State或SEARCH_COMPLETED.request；不新增事件字段/迁移或第二套持久状态，也没有新增数据库读取。普通Web启动直接使用assembly.search，引用传递链为Persistent→AgentLoop→Router→assembly→Google/原生引用种子。

## 红绿中保留的偏差

- preflight/与red保留原件：核心5红1绿；无旧五店当前交付。
- 首次green4/6：缺店/无位终态已正确，三回合注入时钟相同导致SQL消息按ID排序，测试取到旧助手消息；每回合推进注入时钟并按实际消息写入等待后6/6，未用sleep或放宽断言。
- regression57/58：新增替代控制只提供2家但未指定数量，默认目标5，PRESENT被正确拒绝。控制改为用户明确要两个其他选项，requestedResultCount=2；产品交付门槛与原断言不改，原失败保留，随后58/58。
- 新B1缓存名称控制红→外投影已拒绝，但条款入口仍多2次模型调用（62/63）。复用名称守卫补入口/上下文后63/63。原五门禁尚未在这之前运行，局部结果不冒充完整门禁。
- 新增原生来源缓存组件验证只证实种子与缓存边界，不称为原生Live端到端成功。

## 四层证据与最终验证

1. 输入/权限：D6真实字节、公开来源字段、历史S0裁定；明确构造变体，真实调用0，无.env。
2. 执行：createLiveReadAssembly→持久Runtime/SQL→Compiler/Reducer/Validator/Router→投影；保留模型请求、页面、事件、轨迹、消息与最终视图。
3. 独立核验：evaluate.py不导入生产名称/身份/评分函数；核对原ID/电话/URL参数/源码原链接/逐字引文、USER因果链、拒绝原五店、失败回复和OPEN同意后新店；原名7帧及无地区原9帧也重跑独立核验。
4. 结论：离线产品契约与安全边界验证，不重算历史Live，也不建立新的Live成功率或S0率。真实模型是否选择新合法动作、实时页面结构/库存/连接不在本轮验证。

最终五门禁、严格G2和冻结完整性：待gates.json。每项前后净树，超时/失败不跳过、不自动重试。全部通过后推分支、ls-remote核对并通知A，等待复核。

## 归属与账本

A的src/eval、src/harness，B三个G3文件，身份比较器、Domain State/TaskDefinition、语义与Agent版本源码、前端和server均不改。条款文件只加名称资格条件，不改其取页/问题/预算/取消/复用/冲突规则。ADR0049只追加用户11-03决定；STATUS、DEVLOG、TEST-LOG和11月索引同步。

原696条账本逐条保留，只加C零调用一条，现697条；限额与累计不变。first-deviation与review-input原件保留，历史S0单列每展示计1，不按5家重复计数。归档后的文档/日志提交不改变已测源码。

## 首次完整门禁与修正

054af4d2 净树完整默认测试1381/1382；唯一旧B1 HTTP控制在身份检查前被名称守卫挡住，随后固定动作耗尽进入FAILED。其端口返回唯一全名相等候选和DISCOVERY，没有Google命名检索的附加metadata；旧规则无record即允许任何AREA候选，新修复又使其连只读身份调查也不可达。现仅允许“有AREA、唯一全名相等候选、存在该候选DISCOVERY”的只读调查；未核验身份前仍不能选择或展示，其他五家仍不匹配。保持原测试输入、断言及生产身份规则不变。首次完整红灯及净树状态保留在gates/，修正后完整门禁另存gates-repair1/。

## Chromium 合同阻断（尚未应用提案）

fafd8edc 默认1382/1382、原9帧/名称7帧/D6独立13帧及组件控制、type/arch/build通过；Chromium186/188，两个旧工作区尺寸均在web-workspace.test.ts:144等待ready(page)超时。该函数固定等1 of 3；请求语义是当前第二店SPECIFIC_OUTLET/JUDGMENT，而workspace-fixture-server无论TARGET总返回三家。旧测试实际要求查看点名店后仍展示三家，与本次明确合同冲突。产品不能为通过此测试恢复其他店展示。

最小两文件提案a-owned-specific-scope-proposal.patch已物化但未应用：夹具为SPECIFIC目标仅返回该全名候选，保留全catalog用于原索引和来源店号；ready默认仍3，仅该次请求等待1 of 1。语义、JUDGMENT、不记用户选择、其他原断言保持。因用户明令不改A文件和原断言，待这两处窄授权；不能声称五门禁全绿。本轮尚未合main。

## 当前停止点（五门禁未全绿）

- 已测产品源码 **fafd8edc87fef876a26c8cec70cef879a3d3c10f**，其后只有文档/证据变动，完整源码SHA核对不变。
- typecheck、arch、build通过；默认 **1382/1382**，独立原无地区9帧、名称7帧、D6 13帧及守卫/原生种子/投影组件PASS。
- Chromium **186/188**；两个尺寸均因上述旧工作区三家合同超时，非环境限时。没有把失败标成通过，也没有自动重试。
- 严格G2独立补跑 **5/5，全部12页PASS**（23.899秒）；冻结完整性PASS。每项前后status为空。原始输出、命令、持续时间和SHA见gates-repair1.json、remaining.json及stopping-point.json。
- 两处A归属最小补丁尚未应用，等待用户窄授权；期间不继续依赖此授权的改动。当前只推工作分支停止点，第二项不合main。第一项main533f1bc5已完成且已通知A。

## 用户窄授权后的合同同步

用户回复“批准这两处合同同步，单独提交并记录”。已原样应用停止点冻结的a-owned-specific-scope-proposal.patch（SHA-256 `a9f42e232cddccad9bff419b0287631bece46d92b001f1b6a32404cecb311f9d`），单独提交 **beff503bc12576528e071342778c957257f2db42**，只含两个A归属文件。

- workspace-fixture-server.ts：SPECIFIC_OUTLET仅返回全名相等候选和对应DISCOVERY；内部原catalog保留，因此索引、来源店号、库存I/O均不变。OPEN仍返回原三家。
- web-workspace.test.ts：ready默认仍等1 of 3，只在Check this one回合等1 of 1；原视图引用、目标、JUDGMENT、不记选店、身份和安全断言不改。
- 原始D6模型响应、全部产品源码、B三个G3文件、前端/server和版本不再变动。逐字补丁与仅两文件变更由verify-approved.py独立核对；原verify.py、freeze.json和全部红灯原件保留不改。

新冻结清单freeze-approved.json，授权记录contract-authorization.json，净树完整门禁run-gates-approved.py→gates-approved/。真实调用0、不加载.env；尚未运行完，不提前称全绿，完成后只推本分支交复核。

## 批准补丁后的最终验证

- 验证源码：**0147ed6acc14aa4ae975f0e7e11ddc9855d167c3**。冻结782项后，2026-11-03 06:34:21–06:37:43 CET（UTC+1）执行净树11步，全部通过；其后仅归档文档和证据。
- typecheck、arch:check、build通过；npm test **1382/1382**（44.993秒），test:browser:fixture **188/188**（130.293秒），严格G2 **5/5及12页PASS**（24.086秒）。失败、取消、跳过、todo和外层超时均0，每项前后status为空。
- 独立核验：原无地区9帧、来源名7帧、D6整组装13帧；原五店守卫、原生引用种子及恶意DTO投影各一组件控制通过。先补人数的EXACT/RENAMED仅展示原Place ID；缺店、无位不交其他店卡，用户明确OPEN后才展示替代。
- A受保护文件仅有已批准、单独提交的两个合同同步例外，其余A/B文件原样；全部产品代码与fafd8edc相同，State25/TaskDefinition23/Prompt/Schema不变。未放宽身份、名称、空位、链接验证或其他安全断言。
- 原始1381/1382及186/188失败证据保留；旧stopping-point.json仍为当时未授权状态。当前结果以final-verification.json和gates-approved.json为准，不覆盖历史记录。
- 账本697条、限额和累计不变，本轮真实模型/Google/网站/Live调用均0，不加载.env。没有运行新的Live或建立新成功率，历史D6 S0=1仍按一次展示保留。
- 用户选择的原生来源ID路径仅有组件验证；完整三回合证明的是Google身份路径。固定来源库存、纠正后的Fixture动作不证明真实Ito空位或模型在新上下文中一定选择这些动作。
- 第一项名称匹配main533f1bc5已发布；本第二项推送工作分支、通知A后停下交复核，不合main。
