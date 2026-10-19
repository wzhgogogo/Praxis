# P2-2 批准的后续工作

Evidence status: current executable / exposed development evidence；原13a3b36回放与Gold保持不变。本轮用户明确批准1–7顺序、分段推送；无网站/探测/Live，模型仅第3段五颗各一次，累计上限30。

## 1 选店结构约束：离线完成

- 历史：001/003在路径已正确展示时仍选名称解析候选，0134无关字段非空。复核c816e74及用户批准提供预期；原软提示实验FAIL不覆盖。
- Domain共享scope：当前合法首次读取池有至少3家未查过、圆心半径已确认的DIRECT时，仅保留这些ID，原顺序不变。阈值不足时保留既有合法池；不新增资格或越界权限。Context@14与Validator一致；事实读取不变。显式用户刷新保留既有定向重查合同，不属于首次查位分配。
- Prompt@27明确非本动作字段必须为空，解释只入decisionSummary；校验不放宽。当前观察投影移至Domain candidate-read-observations供已有Context/Assessment/Web投影复用，没有第二套来源URL规则。
- 有效红灯selection-typed-red.log：恢复原assess时可查位池错误包含name-near/outside，目标断言失败；修后selection-typed-green.log通过。复用现有正常H001生产组合在原预算交付，以及事实/刷新、已查不计阈值、原顺序、未知半径等控制。
- 五门禁：typecheck-corrected/arch/build PASS，默认953/953，真实本地Chromium119/119（275830ms），原日志step1-gates/。初始Fixture类型遗漏已修，原日志保留。0真实调用；本地绿灯不是模型选择或网站效果验收。
- Evaluator复用既有revision2完整条件/旧严格对照；本段不修改标签或评分阈值，模型回放留第3段。

## 2 Tabelog来源繁忙与英文入口：离线完成

- 原始输入：p20-h001、p1fB-h001、p1g-h001各取回2份完全相同的保存HTML，共6份、同一SHA25d8467e…；不是6个独立页面或忠实HAR Replay。busy-inputs/保留原字节、原路径和result SHA。标题/正文有来源固定访问集中提示。旧代码目标红灯busy-red.log为ENTITY_MATCH_UNCERTAIN，修后sourceBusy在身份提取前处理。
- Pack拥有固定页面识别、1秒重试间隔和Google Tabelog门店URL的/en/规范化；同一地区路径/数字门店ID保持，去掉query/hash和子页。没有新增站点映射，未放宽名称+地址/电话，也未更改原生身份连续性。
- Adapter每候选/来源最多一次繁忙重试；等待和再次导航均消耗原Executor操作/墙钟预算。再次繁忙保留UNKNOWN/SOURCE_BUSY和原始标题诊断，失败分类ENVIRONMENT；Grounding在身份比较前保留来源原因。截止时间先到则不发第二次请求，保留超时原因。CAPTCHA/用户接管规则不变。
- 原Adapter/Pack所属覆盖43/43；同店恢复可AVAILABLE，真实地址冲突仍UNKNOWN；250ms来源期限对照只有一次导航，无预算重置。真实本地Chromium在15秒/24操作控制预算内恢复精确2人/19:00结果，1次等待、0模型，见busy-browser-green.log。旧mock仍声称日文落页的Fixture已同步为实际请求的英文URL；调试失败保留，不作为产品红灯。
- 尚无当前真实网站/翻译页身份兼容性或速度收益结论；本轮禁止外站/探测/Live。

第2段最终五门禁：typecheck/arch/build PASS；默认957/957；真实本地Chromium120/120（277450ms），见step2-gates/。0网站/Google/真实模型/探测/Live。

## 3 五颗单步回放：达到批准门槛

- 冻结1646667及320份源码/独立标签/原输入/旧账本/外层SHA，运行前后核对全部不变。注入生产availabilityCheckSelectionScope，以原始时刻前的来源ID和圆心半径证据收敛checkable/同义legal scope；事实读取、候选顺序、请求/日期/人数和标签不变。无标签/见证文本进入模型。当前源码四门禁957/957与type/arch/build绿，第2段未变浏览器路径的120/120复用。
- 新调用恰好5，累计10/30；每颗一次，无截断/解析拒绝/重试。均CHECK_AVAILABILITY，均仅含合法字段。0网站/Google/动作执行/Live。逐请求、wire、候选名称/路径/距离、输出理由、独立revision2判定与旧严格对照见structural-replay/，逐次成本见model-ledger.json。

| 种子 | 选择 | 输出理由摘要 | 独立判定 |
|---|---|---|---|
|0133|Sushi Teppen|唯一候选有直达页，查精确请求并补事实|ACCEPTABLE，1/1直达|
|0134|Sumi Sushi / Sushi Jinnan / Sushi kazumasa|半径内直达寿司候选，读取请求库存和omakase事实|ACCEPTABLE，3/3；旧严格规则亦通过|
|001|Kagurazaka Jin / Sugata / 日本料理ほそ川神楽坂|三家合法直达候选，查3人19:30和来源事实|ACCEPTABLE，3/3|
|002|Sumi Sushi / Sushi kazumasa / Sushi Jinnan|此前来源未知，继续查近处直达候选|ACCEPTABLE，3/3|
|003|Sumi Sushi / Sushi Jinnan / Sushi kazumasa|查当前可查位的近处寿司候选|ACCEPTABLE，3/3|

神乐坂1/1、涩谷3/3、对照1/1，门槛PASS；涩谷三颗仍是同场景近重复，不视作三个独立场景。有效直达选择13/13；相比原已记录动作4/13，但未另重跑旧配置，不能排除模型随机性或证明长期提升。历史登记见证仍0/5被选中，未当前认证或执行这些读取；本次支持结构约束，不证明见证交付。

四层：端到端NOT_EVALUATED；Agent决策环节按独立when可接受；无展示/动作，S0–S4全任务影响未评，不宣称S0=0；归因仅支持合法池结构约束及字段提示在这五个反事实输入上有效，速度/库存/整体交付留后续。按授权不追加回放，继续4–6。

本轮五次模型实际耗时合计22682ms，token合计96816；单次原10000ms/原输出cap不提高。

## 4 地区选择：主线集成与离线机制修复

- 先fetch，变基到主线8b70084（含a37e152），保留其首页/筛选/稀疏KEEP修正。已推送136fc47接为额外父提交，使普通推送保持快进，不force-push；原冻结1646667及历史结果仍可审计。原模型输入、Gold和账本未改。
- 历史关联：30次地区诊断中的神乐坂父/子/父循环；既有主回归覆盖单向父子入口、重定向与4/5越界替换，缺少同地区首页/列表query别名回访、旧链接绑定后再LOCATION恢复。属于旧覆盖遗漏，不能称为当前网站已修好。
- 真实输入：region-inputs/从原神乐坂DOM-A决策观察投影出可见链接，保存原路径/SHA/sequence。仅链接片段，不是完整HTML/HAR Replay。新红灯region-red.log：旧路径仍提供访问过的父入口；合法LOCATION搜索虽执行却被旧入口绑定挡住。初始Fixture缺结构的失败另留region-fixture-debug.log，不当作产品红灯。
- 改动：地区选择阶段由Pack现有同地区首页/列表关系识别已访问的其他入口，移除其OPEN_LINK并在返回动作处同样拒绝绕过；当前地区首页恢复列表仍允许，CLICK/WAIT/LOCATION不受影响。LOCATION开始后清掉旧链接绑定，只有权威值被实际观察，且URL或结果集合确有变化后才绑定新结果。换成另一观察链接时清掉LOCATION授权状态。
- 受控正例明确为合成：在真实菜单片段上增加公开LOCATION输入/提交和精确结果，三次脚本决策在原6调用/24操作/90秒来源预算内产出1家有坐标候选；填入后旧宽泛卡片不进入详情。真实片段循环对照零详情；强行选已禁父入口也零该导航。相关7项与生产组合回归通过，原4/5、半径、缺坐标、超时、同地区首页恢复行为保持。
- Evaluator复用原来源坐标接纳和链路评价；补充独立链接/导航/旧卡片断言。未改ADR-0040：仍由Agent选择观察入口或权威LOCATION，坐标与一次替换门槛、预算不变。没有地名/地区代码表，没有更改Gold。
- 神乐坂真实正确最短路线未在已有录制中出现，本轮禁止外站和额外模型，标为NOT_COVERED；不以合成正例宣布当前神乐坂/全部地区可用。

第4段五门禁：typecheck-corrected、arch、build-corrected PASS；默认962/962，真实本地Chromium120/120（278349ms）。同地区列表恢复的收敛修正另由最终region-composition-green覆盖，之后增强旧卡片断言的region-green为7/7；未改变浏览器运行时/网络协议。初次沙箱EPERM与类型错误原日志保留。

## 5 耗时与请求节奏方案：完成，未实施

见[分解与方案](performance-proposals.md)。50份可计时产物总计8,511,515ms；描述性汇总前三为VENUE_SEARCH详情1,212,762ms、Browser模型1,109,031ms、查位解析1,069,263ms。22次校准与三组各10次仅发现分别保留，2次中断NOT_EVALUATED。每段方案列假设减少比例、对应累计/每历史运行的秒数与正确性风险；未声称实际节省、未相加为整单承诺。未归因615,066ms不硬分配。

同来源文档2秒/已审核查询1秒、Google1秒作为未来待测起点，等待计入原期限，Retry-After超过余量则停止该来源；未证明503因果、未实施节流或增加重试。纯文档核对原summary、总和、比例与路径；复用第4段门禁，0网络/模型。Evaluator不新增：这些是诊断/设计指标，不改变通过门槛。

## 6 官网链接离线测量：完成；真实出链率未评

统计入口与控制预先提交cf11c54，输入仍用已冻结timing-inputs SHA514803416bfe…；52份artifact＋30份trace均核原SHA，0外站/模型、未读.env。原始首见候选来自SEARCH_COMPLETED或SOURCE_FIRST_BATCH，后续状态富化不改写输入。脚本/复现命令/未来方案见[测量方案](website-measurement-plan.md)，输出[详细统计](website-link-statistics.json)。没有实现官网抓取器。

|组|有Google候选/产物|每run去重候选出现|直达|网站字段待查|无网站|
|---|---:|---:|---:|---:|---:|
|校准22|4/22|149|29|108|12|
|P21 baseline|10/10|360|39|288|33|
|P21 corrected A|9/10|340|43|268|29|
|P21 DOM A|9/10|342|47|263|32|
|合计|32/52|1191|158|927|106|

“网站字段待查”=Google网站字段为合法公开URL、现有Pack未识别具体支持入口；927/1191=77.8%。它可能是官网、社交页、未支持平台或总店，不是经验证的“纯官网”。跨run按Google ID再去重为253家：31直达、198待查（78.3%）、24无网站，当前观察无分类变化；重复请求/同场景不算独立证据。20份没观察到Google候选记NO_GOOGLE_CANDIDATE_OBSERVED，不能算Google成功空结果。分母是系统产物中的Google候选，不是Google API全量结果，也不是全部符合HARD/半径的选择池。C不在冻结材料中，C及真实官网归属/预约出链命中率NOT_EVALUATED。

控制：7个字面独立ID的预期计数、首见去重不被后续直达富化改写、跨run冲突保留variant、缺分母null、含凭据/无效URL不输出、SHA错误拒绝全部通过。生产五门禁复用第4段，本段未改生产/Prompt/Gold/预算/评分门槛；诊断脚本语法和本地控制通过。Evaluator仅补计数，不评价网站能力或S0。

## 7 交付范围与停止

已按1→6完成并分段推送；第3段仅新增5次真实模型，历史5次合计10/30，无追加回放。其余工作为离线/真实本地Chromium，无真实网站/Google/探测/Live。未修改ADR-0040/Gold/预算，没有地名表，没有实施第5段性能/节流方案或第6段官网抓取。

四层结论：完整任务交付NOT_EVALUATED；五颗单步Agent决策按revision2 PASS，地区机制在真实片段负例和合成可行任务离线通过；全任务影响/S0–S4未评，不宣称S0=0；因果限于本次受控反例/对照，历史耗时与网站字段比例是诊断，不能归因为当前整单改善。真实神乐坂正确路线、当前网站身份/库存兼容性、官网实际预约出链率仍未覆盖。推送后按用户要求停下，等独立复核。
