# 观察驱动与值来源：实施中

**当前续作见 [来源网址与表单审计检查点](source-url-followup/report.md)，仍未满足合入条件。以下逐段保留为历史实施检查点，不代表最新验收。**

2026-11-05 CET（UTC+1），基线ebfc619c。**partial / not integrated**，不是最终合入候选。

用户已批准六对象版本方案（Prompt20→21、Action12→13、Context3→4、Recording5→6、Evaluator36→37、Rubric31→32）及两类具名店输入范围。当前仅Browser Context已升4，新增可见原生form关联；其他已批准版本随完整退役/录制/独立审计完成后升级。State25/TaskDefinition23、语义和Agent版本保持。

## 已实施的独立切片

删除named-outlet-resolution.ts中的kushi katsu/kushikatsu/sushi/ten/honten/串カツ/寿司/本店/店词表。多余词只以同候选、同来源店号/URL、有HIGH身份绑定的NAME/CATEGORY/GOOGLE_TYPE原文或观察到的来源名称支持；模型判断、评论、其他来源/其他店号、无HIGH记录不提供这类支持。地名仍需地址及原地区数据支持；未增加别名、翻译或相似度接纳。已有多候选精确名称规则和前三家范围不变。

红灯：probe-current.ts在基线得到“没有任何来源额外词，却因固定词表返回true”，见current-red-evidence.json。另四个反例只变实际D4搜索的值、不变十字段，旧Guard都到达本地假传输；按新合同应拒绝。没有向真实网站发送这些虚构个人值。

绿灯：名称组件10/10；D3原语义+本地固定来源组装8/8，完整来源名正例保持，未引用后缀的旧containment-only例现为NEEDS_INPUT且无B1。该例同步是用户新语义要求，不是把真实来源回放改成成功。TableCheck例首次受普通沙箱Chromium启动限制而FAILED；同一输入/断言在本地HAR受控启动后通过，原日志保留。最终typecheck通过。新的组件夹具曾缺必填字段，已补齐契约，没有使用unknown强制转换或改产品版本规避类型检查。

上述组装是LOCAL_CONSTRUCTION来源，不是D3/D5真实页面回放通过；D3/D5/D4/D8所要求的最终真实回放、全套门禁、严格G2、G6均尚未运行。既有真实录制未修改，没有读Holdout或.env，模型/网站/Google/Live调用均0，预算不变。

## 审查发现与待决定项

详见plan-and-version-review.md。清单以外还包括复用搜索的填词/Search固定捷径、boundInputField标签词表、near等剥词、上轮单路径预筛选特判、精确联想录制白名单、私有testid/class选中值解释。这些均列入拆除，不把旧代码改名后保留。

两项前提均已获用户明确答复，继续实施：

1. 仅Tabelog https://tabelog.com/en/、TableCheck https://www.tablecheck.com/en/japan/search 作为source-pack配置的会话首次导航，仍经Guard。之后无地区/店号模板、填表或点击序列。
2. 页面本有的值原样交回同源，无需内容识别；代码填入值仅来自获准权威字段，并做现有格式筛查。未知来源拒绝。无需人名识别器；sensitivity-design-review.md旧识别器提案已标superseded，未实施。

## 通用表单实现的当前进展（未集成）

已删除tabelog-public-query.ts的十字段特例及当前独立reviewed-public-reads.json对应条目。旧冻结录制/历史复核原件不改。新运行时从实际原生form、实际文档和FormData取值，CDP原生formSubmissionGet关联请求；网页/模型没有注册许可的接口。代码填入必须有获准字段来源并通过格式筛查；未经授权的fill在页面收到值前拒绝。直接在页面输入但未登记的受信输入事件会使该表单拒绝，即使脚本随后把文本改写。页面自己更新的隐藏值只返回同源，不做内容分类。源/路径禁止、POST及重定向拒绝保持；证明与取回共用原请求时限，不增加窗口，默认传输仍Node。

Browser Context4包含原生form关联和可见行，没有隐藏值。boundInputField不再按地区/搜索/人数标签词表决定语义；只留原生控件类型及敏感输入的安全拒绝。填入值仍由权威goal决定，RETRIEVAL新增code-owned来源，缺失即拒绝；原有G4搜索调用标记其来源。删除selectedDisplay中私有testid/class对选中值的解释，未换另一组私有选择器。

独立评价目前只能将生产form receipt标为EVIDENCE_GAP，绝不拿PAGE/权威来源标签自证通过。**独立外层DOM/实际请求/权威输入关联尚未接通**，因此不能声称新许可已完整验收。Recording6/Evaluator37/Rubric32完整升级仍待该接线，未覆盖旧输出。

相关验证：Guard组件20/20；已有真实Chromium网络边界64/64（两种传输、重定向、iframe、worker、popup、预检、POST、故障关闭）；本机运行时8/8；Browser wire12/12；独立评价与退役规则140/140；typecheck通过。普通沙箱启动Chromium的失败原日志保留，同输入受控本机启动通过；另外两份CDP单元夹具补齐真实getFrameTree结构，没有改业务断言。

新增表单测试初版4/4，但该结论被更严格的终态控制取代：**当前2/4**。两种传输的同源页面默认值/权威AREA正例通过；负例组停在POPUP_UNKNOWN：请求尚可能只完成本地bootstrap，未取得实际目标已拒绝的终态证据。不能因接收器暂未收到就算拒绝成功。现记录为本地验证缺口，不是已证明的外泄，也不是Live S0；下一步需闭合popup/iframe原生提交关联后重跑。当前失败与先前输出分别保留，不能对外报告4/4通过。

## 额外版本停止点

进一步审查发现Agent Prompt@29仍明确支持直达门店页；ADR-0042的P2-2及candidate-read-observations.ts还在直达候选至少三家时屏蔽其他候选。与用户最新“无直达路径、观察循环选择”冲突，不能仅删浏览器代码留下错误指引。具体新增版本方案见additional-version-review.md：Agent Prompt29→30、Agent Context17→18、TaskDefinition23→24，State25不变。用户要求版本变化先报告，已经提交确认问题；这些三项及旧门控尚未改。固定地点序列、isRegionEntrance及其他动作退役尚未完成，不把局部测试冒充整条链路通过。

D4/D3/D5/D8新合同真实回放、全套门禁、G2/G6均未运行；未合main，真实外部调用0。

当前只记录本停止点事实，不更新STATUS/DEVLOG/TEST-LOG（按工作规则留到main合入时）。未合main、未运行Live，不通知A/B接力。

## 用户复核后的收敛（2026-11-05 CET）

用户只批准TaskDefinition23→24，否决删除availabilityPath提示及Agent版本升级。现已删除availabilityCheckSelectionScope函数和read-assessment、run-decision-replay两处调用，没有双轨；原合法候选池直接交模型。来源包candidatePath、availabilityPath字段与Agent Prompt29/Context17及来源建议逐字不变。原提示文件SHA256：agent-decision.ts `1653cdb1fce186ee356463f12306176d657be6e6fc0f23028871309852ce66b8`、agent-context.ts `9e8115378216e349ea2e2b06c7fd3175de47876980a58f99a95ee2716d84a491`。State25/Agent动作/语义版本及资格/刷新边界不变。红灯两处断言明确显示旧代码缩窄候选；修复后的相关三文件49/49及typecheck通过。包含本地Chromium的测试普通沙箱启动失败，受控本地启动同输入通过，不能把环境启动失败称为产品红灯。

出处以git show/log -S为准：3d323739实际是inventory-06冻结；真正的门控及ADR段来自33a3b161（2026-10-19）。新ADR-0051明确只替代0042-agent-planned-discovery-and-search-availability-hints的“2026-10-19 P2-2 首次查位入口分配”门控，不错误引用另一份0042，也不删模型效率建议。additional-version-review.md原提案保留为历史并在顶部写入用户最终裁定。

popup追加取证证明：旧等待可能只观察到本地bootstrap，随后普通GET实际到达了**本机虚构数据接收器**（见popup-local-first-deviation.json），不是外网/Live调用，不计Live S0。根因是新窗口表单只有Page.windowOpen、没有父页frameRequestedNavigation；bootstrap重开丢失原生表单关联。现在按实际原生form action/target、文档与输入来源关联到同一opener的首次新窗口；未知来源在bootstrap前拒绝，有证据的同源GET表单可通过，许可单次消费、不能给父页/另一页面/后续非表单GET借用。不改普通popup许可与重定向边界，不改传输默认值或时限。追加真实终态与接收器、合法popup、许可不可复用控制后4/4；既有两传输网络边界64/64保持。旧2/4原日志保留，不能把先前bootstrap等待当成功证据。

这些仍是组件/本机Chromium证据。D3/D5必须在真实组装回放记录实际模型选店；尚未完成，不能声明无退化。继续观察循环与独立表单审计接线，当前不合main、不运行全套门禁或Live。


## 2026-11-05 14:15 CET：观察循环重构检查点（draft / not integrated，停止交复核）

**当前不是可合入候选。** 用户对 GO_BACK 的最新答复是“先保留缺口，交复核后再定”。本分支未添加 GO_BACK，未恢复缓存 URL 直达，不合 main，不运行 Live。此处不以局部绿灯代替真实链路验收。真实网站、Google、模型、Live 新增均为 0；没有读取或加载 `.env`，没有读取私有 Holdout。

### 已完成的最新复核决定

- `21e21566` 已推送：删除 `availabilityCheckSelectionScope` 函数及 read-assessment / run-decision-replay 的两个调用。TaskDefinition@24；State@25 不变。
- 保留 availabilityPath / candidatePath / RESTAURANT_AGENT_AVAILABILITY_PATH_INSTRUCTION。Agent Prompt@29 与 Agent Context@17 源文件 SHA 分别仍是 `1653cdb1fce186ee356463f12306176d657be6e6fc0f23028871309852ce66b8`、`9e8115378216e349ea2e2b06c7fd3175de47876980a58f99a95ee2716d84a491`。
- additional-version-review.md 已按部分批准/部分否决更新并随 21e21566 推送。ADR-0051 精确指向 33a3b161 的 0042-agent-planned-discovery-and-search-availability-hints / “2026-10-19 P2-2 首次查位入口分配”，不把另一份 ADR-0042 或 3d323739 误认为门控出处。

### 本次草稿改动

- Browser Prompt@21、Action Schema@13、Context@4；删除 SELECT_REGION_ENTRANCE 及其专用上下文、地点建议字面规则和固定填/点序列。
- 删除 source-pack directory URL 分类、地区 URL 构造、listing filter URL 构造与专用执行分支。原生发现改为当前观察 → 模型选择动作 → 来源身份/地址/坐标核对。模型不会获得任意 URL 或填入字符串的执行权。
- 仅启动导航由来源包配置提供；后续 sourceUrl 是观察循环的目标，不能直接成为传输动作。Tabelog 的人数/日期选择器加速序列已移除；TableCheck 下一时刻查询改为模型选择，原四次上限及原时段核对保留。
- 只有来源页面的已绑定名称/类别原文可支持多余店名词；固定菜系/分店词表已在 e584c010 退役。未增加翻译、别名词表或相似度接纳。
- 录制@6 保留通用同源公开 GET 表单 action，并保留提交值来源的散列回执。没有重新引入 Tabelog 十字段规则。POST/跨源/禁止路径/非表单敏感字段仍拒绝。
- 真实 Chromium 回放暴露被动 DOM 安定采样恰遇导航提交的竞态。现在仅在原安定等待窗口内等待已开始的导航后重新采样，不重发点击或网络请求、不增加时限。原失败和后续实际到达 Ageage 的证据均保留。

### 真实回放：D4

普通 `createG6Session` → `createLiveReadAssembly` → 持久应用；只替换模型传输和来源 I/O。实际来源为 stop3 的 D4 首页/检索/详情与 W1 保存 HAR，没有合成成功页，没有注入候选或合格证据。固定模型传输里的具体选择属于评测输入，不是产品动作代码，也不证明实时模型会作同样选择。

实际动作：启动首页 → 模型填 Akabane → 模型 CLICK 实际 fragment 车站联想 → 回读标签 → 模型填 kushikatsu → 模型 CLICK 同表单 Search → 实际检索列表 → 模型 OPEN_LINK 到 Ageage。

Ageage `13273370` 经生产解析取得地址 `1150045 東京都北区赤羽1-22-4 岡村ビル 1F` 和来源 JSON-LD 坐标 `(35.779992038638724,139.7206854854141)`，进入原生候选。**不是展示/空位/B1 通过**。Dengana 在真实结果列表中已观察到，但尚未在新循环中完成详情核对。

缺口分开报告：

1. 原采集没有保存选站后输入 cuisine 引发的 `keyword_suggest` 三字段响应（keyword/no_display_area_suggest_flg/station_id）。严格全依赖回放在此停止；部分回放仅 abort 该辅助请求，明确记录 fidelity gap，不补响应、不联网，才继续使用原样保存的列表及详情。不能称完整忠实回放通过。
2. Ageage 详情当前观察中没有返回原结果列表的链接；没有通用 GO_BACK。用户要求保留该缺口交复核。测试模型后来选到同店其他语言链接导致缺页，属于固定测试模型的不足，不可伪装成有位、无位或产品 S0。
3. 实际产物最终是 NEEDS_INPUT；没有完成 D4 交付或 G1 追问。不得声称达到 ebfc619c 的两家候选进度或最终验收。

`D4-fixture-fragment-action-error.json` 保留第一次测试模型把 fragment 当 OPEN_LINK 的错误，已改为使用当时真实观察所提供的 CLICK。`D4-strict-missing-auxiliary-response.json` 保留严格依赖缺失停止。`D4-current-observation-replay.json` 是最新部分回放；缺失的必需文档依旧关闭上下文。

### D3 / D5：模型实际选择与证据界限

逐字使用 `1d88ba11` 中的原始语义和 Agent 响应，只允许 Browser ref 在当前 DOM 上唯一同义重绑定。原件引用见 d3-d5-input-refs.json；重复物化的 replay-inputs 不提交。

| 回放 | 原始模型的实际请求 | 生产接纳结果 |
|---|---|---|
| D3 | #3 CHECK_AVAILABILITY、#6 PRESENT_RESULTS 都指向 `praxis:restaurant:07b0ba0daee00150d6d202e1`（Google Dengana Akabane，Tabelog 13108466） | 新规则需要的启动首页不在该次原录制中；缺页后库存未接纳，PRESENT 没有交付，后续原始输出不足，FAILED；下一轮未重放 |
| D5 | #2 先 ASK_USER 补日期；#5 CHECK_AVAILABILITY、#8 PRESENT_RESULTS 仍为同一 Dengana | 同样缺少启动页，补日期后 FAILED，未交付 |

移除门控的原始上下文相关回归 49/49 已通过；**新观察路径的 D3/D5 无退化验收未通过/未完成**，不能用原始模型仍指向 Dengana 替代整链通过。之前直接进入详情时的日期控件 hydration 缺口也保留在 D3-choice-replay-bound.json，未用旧快照伪装活页面。

D8：未在本检查点运行新的完整来源回放，未增加别名、翻译或 HIGH 身份放宽；不宣布唯一身份/库存/B1/条款已通过。

### 保留的配置与尚未完成的退役

已保留的平台初始导航只有：Tabelog `https://tabelog.com/en/`、TableCheck `https://www.tablecheck.com/en/japan/search`；配置在各自 public-query policy，source-pack 引用，TableCheck 旧函数只返回同一个配置值、不再拼检索参数。

另保留：来源 origin、来源 skill 路径、已有动态读取/静态资源/禁止路径配置（安全范围）、source ID 与响应结构解析和身份绑定、candidatePath 效率事实、ADR-0049 的交接链接校验/序列化。这些不产生未经观察的点击或导航许可。

**尚不能标为完成的部分：**

- 通用 GO_BACK 未批准、未实现；不以伪造“返回列表”链接修改真实来源材料。
- recorder 中历史 Tabelog suggestion 专用安全保留器尚未泛化；它不是本轮新增的执行分支，但按“所有同类逻辑”仍须复核其退役方案，不能默认为已批准例外。
- Evaluator@37 / Rubric@32 已升版，但表单生产回执仍只作为待审证据。缺少独立外层 DOM/原生提交/输入来源观测时明确 EVIDENCE_GAP，绝不因 Guard 给出 ADMITTED 而判绿；独立采集接线尚未完成。
- 仍有依赖旧专用地区/检索路径的 fixture 模型和普通组装回归需要迁移。当前本地回归失败是真实未完成项，不解释为无关红灯，也不删掉这些用户行为断言来过关。

### 测试退役范围与检查结果

删除的四个文件只针对退役的地区收集动作、网址型入口、地点字面规则/固定序列：directory-region-selection.test.ts、location-suggestion-executor.test.ts、browser-read-regions.test.ts、location-suggestions.ts。browser-read-discovery.test.ts 退役固定 listing filter URL 的 P21b 工作流测试；其余保留。source-packs.test.ts 删除被退役的 URL 构造/改写专用断言，保留来源解析/绑定/身份/费用/B1 合同。此退役不代表相关整链验收已替代完成。

| 检查 | 结果 | 原件 |
|---|---|---|
| typecheck | PASS | observe-checkpoint-typecheck.log |
| architecture | PASS，0 forbidden dependencies | observe-checkpoint-arch.log |
| 相关合同测试 | 113/113：执行器61、来源/完成/Browser wire/历史绑定36、录制16 | observe-checkpoint-related.log |
| 通用 GET action 红→绿 | 旧 action 被剥离的目标断言失败 → 16/16 | record-form-action-{red,green}.log |
| 既有原生发现组装回归 | **FAIL：前4个 H001 交付/事实链路断言失败，整个文件后续未完成，不能报告全组结果** | observe-native-regression-failed.log |
| 全五门禁、严格 G2、G6 | 未运行本轮最终全套；真实回放与本地组装未过，不到合入门槛 | 不沿用历史绿灯 |

下一步需先由复核者审阅真实动作缺口和当前草稿，不扩大来源访问、版本、身份或安全范围。文档 STATUS/DEVLOG/TEST-LOG 按 11-05 工作规则留到实际合入 main 时统一更新。
