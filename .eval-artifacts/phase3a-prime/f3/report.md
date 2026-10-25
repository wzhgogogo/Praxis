# F3僵硬代码审计与F6草案：停止点4

- Document revision: 1.0
- Evidence status: draft / not integrated；已暴露开发诊断，不是Clean Baseline。
- 复核编号20261026；执行时间2026-10-25T21:18:52.344054+01:00（维也纳CET UTC+1；客户端10月26日凌晨对应维也纳10月25日）。
- 分支：`codex/chore-phase3a-prime-f3-audit`，从已合入并推送的main `e096ba35dbc77d6852fa4875dbeadaae92835ffe`建立。仅本地提交，不推送或合入此审计分支。

## 1. 切片与完成情况

**F5已按用户批准结束并合入main；例01是已知限制。F3交付清单与草案，停在停止点4，不开始实现。**

F5先重放最新main `0a254f05`，保留双方文档与预算并集，再在`34c8b4f2`重跑五门禁：typecheck／arch:check／默认1053／build／本地Chromium155全绿，每项前后git status为空。之后只归档和同步文档，源码不变；快进main并原子推送main、带精确旧SHA租约的F5分支及checkpoint。远端两分支核对一致为`e096ba35`。[合入收据](main-integration.json)／[重放与门禁](../f5-closeout-20261026/report.md)。

STATUS明确：**ADR-0043机制已在Live验证；例01能力未达成，转3b店名解析与F6**。原例01 0/3、原样回放INCOMPLETE和槽后评价延迟不改写为通过。F5历史原始产物和评价逐字节保留，旧`e169e606`留annotated tag `checkpoint/phase3a-prime-f5-stop3b-20261026`。

本批从[原指令§6](../CODEX-3A-PRIME.md)执行：两站点、Pack、Guard、地点/语义、条件展示均进入审计。29份生产/共享范围文件含12份站点非测试TS，见[source-inventory.json](source-inventory.json)。[audit.csv](audit.csv)逐项给出文件行号、精确匹配、控制方、分类、处理和测试，共38项：保护用户和金钱11项、其他27项。“其他”不等于全部立即放宽；已有退役项、证据缺口和延期明确单列。新增真实模型／Google／来源网站／Live／环境重跑均0。

用户提供的停止点3b复核要点是本批授权。项目所指review原文未在本Git工作树找到，未冒称读取全文；原§6、代码和下列历史证据均固定Git blob读取，SHA留档。

## 2. 首项：Guard fetch/xhr一致性

### 已证取值链与本地对照

- 普通Playwright route：`playwright-read-network-guard.ts:348`直接取`request.resourceType()`。
- CDP：`:163`监听`Network.requestWillBeSent`，按requestId保存type；loadingFinished/Failed删缓存；`:191–194`处理`Fetch.requestPaused`时按networkId查缓存，否则取Fetch事件resourceType并小写。后续准入`:24–27`与`:57–60`要求规则resourceTypes精确包含该值。
- 对话A的固定`2e184c2f`已有Linux8次有界E1诊断，2/8失败；同一失败记录Playwright fetch、Guard BLOCKED_METHOD/xhr。日志没有CDP先后或networkId缓存状态。[原始SHA清单](historical-inputs.json)、[摘要](historical-linux/summary.json)、[红灯2](historical-linux/probe-2.log)、[红灯7](historical-linux/probe-7.log)。这是原诊断子集，不是本批新Linux门禁。

本批真实本地Chromium对同一个**本地构造**POST捕获：Network事件type=Fetch、Fetch拦截事件resourceType=XHR。自然回调顺序下缓存命中，合法POST到达1次；仅将给Guard的Network回调延迟80ms，Fetch先被处理，缓存缺失，合法POST误拒且到达0次。双类型本地规则数据控制恢复1次到达；真实XHR配fetch-only规则也被拒。多字段和PUT两个控制即使双类型仍0到达。[完整事件序号](observations/resource-types.json)。

| 本地构造场景 | 接收端到达 | 结果 |
|---|---:|---|
| fetch，自然Network回调，fetch-only | 1 | 允许 |
| fetch，延迟Network回调，fetch-only | 0 | BLOCKED_METHOD/xhr |
| fetch，延迟回调，双类型本地规则数据控制 | 1 | 允许 |
| 实际XHR，fetch-only | 0 | BLOCKED_METHOD/xhr |
| 双类型，多一个body字段 | 0 | 拒绝 |
| 双类型，PUT | 0 | 拒绝 |

这证明“不同CDP域报告不同类型＋缓存回退＋单类型规则”足以制造误拒。**延迟的是本地给Guard的回调，不是声称真实Linux CDP事件必然乱序。** 历史当次是Network晚到、networkId缺失、缓存已删除或其他关联问题，记录不足，仍未确定。已证机制与历史具体触发原因分开；不把本地数据控制称为产品修复绿灯。

### 对Live的影响及边界

TableCheck日历POST来源声明`:69–74`只列fetch，POST无一般GET后备，类型误分会直接阻断已审核读取，是Live能力风险；本批未逐条证明F5实际POST是否因此被拒。CDP的BLOCKED_METHOD是较粗诊断，字段或类型不匹配也可能出现，不能仅凭该码认定方法本身不合法。

Tabelog find_vacancy声明只列xhr、initial_vacancy只列fetch，合同同样不一致；但**同源、非敏感公开日历GET在genericPublicRead已准入origin时，可经现有fetch/xhr通用GET路径放行**（`:284–292`及`:359–364`、`:421–435`）。所以不能仅凭xhr-only声明就归因Tabelog查位失败；没有通用后备、敏感/严格query范围或不同组合时才需逐案核对。来源规则里的每个GET字段清单也不一定是当前通用GET路径的强制门禁；已批准的未知GET风险保持明确。

拟议方向：fetch/xhr是同类脚本请求；共享层一致分类，安全准入继续看方法、origin、路径、query/body及副作用语义。不是把所有类型、POST或OPTIONS一起放开。来源声明、录制与独立POST审核必须同片更新；普通DOM stale-ref、观察集合、身份/HARD/请求绑定继续严格。详见[ADR-0036补充草案](../../../docs/decisions/0036-script-request-types-and-preflight-draft.md)。本批没有修改上述任一生产文件。

## 3. OPTIONS 41/95及隐式通用列表回退

固定F5分类复现D1 41次（other40、xhr1）、D2 95次（other95），均是calendar_v2 OPTIONS，query为空，首次位于D1 trace347／D2 trace263。它们是快照反复带出的诊断出现次数，136不能当独立请求数，也不能把networkRequests重复再加一遍。[原分类](../f5-analysis/options-classification.json)。

当前`admitsPreflight:271–283`已经接受other/fetch/xhr三种类型，但仅接受requestedMethod=GET和对应GET cors规则。日历是已审核POST且未声明相应预检。因此它与脚本单类型是**两个独立机制**，不能把41/95归到fetch/xhr不一致。旧记录缺Access-Control-Request-Method/headerNames、实际body和请求配对，不能认证每条OPTIONS误拒或未来POST完全合法。

补充草案提出只给已审核实际读取规则的浏览器预检投影准入，实际POST仍另核完整body；预检时没有未来body，不能编造“已完整批准”。本批没有执行新的CORS构造或修改规则；实施批红绿与危险路径反例在草案中列明，NOT_RUN。既有GET预检门禁通过不等于POST预检方案已通过。

隐式回退确实存在：`native-restaurant-search.ts:545–562`把稀疏KEEP拒绝转成没有keyword的selection，apply随后去掉表达式；`:631–646`在非忙碌、稀疏/显式空列表下重写。`discovery-retrieval-planner.test.ts`也把非法词提议回通用列表写成当前行为。拟改为模型明确选择已观察的通用列表、代码核对，或有界未知；不隐式扩查。类别扩查、显式空、无效提议和重复提议需分开。

F5c既有槽5分析表明三次空检索后**未发生**该通用列表回读；其超时不能改归本项。当前提议属于F3，店名解析属于3b，不在本批修复。

## 4. 私有class改名观察与完成判定

脚本/输入/SHA先在`13fe44ad`冻结；执行前`260e0cd0`只把变换改成SVG兼容setAttribute并更新SHA，然后运行一次固定6类型＋4保存页面观察。[冻结](probe-freeze.json)／[脚本](observe-local.ts)／[核验](observations/checks.json)。无模型，无个人profile。页面由已有fixture映射履行，缺失请求一律abort；类型实验只访问loopback，不访问来源网站。

在真实浏览器中重命名class，并同步内联CSS选择器，保留可见文字SHA；然后重新取生产snapshot/控件观察，调用生产名称/库存完成谓词及选中请求/日期状态判断。未修改原fixture；不是更新后网站回放。导出只保留业务观察与可见文字SHA，不在新报告重复整页文本。[结果](observations/classes.public.json)。

| 原保存页（采集日） | 改名token数 | 观察变化 | 完成/绑定判定 |
|---|---:|---|---|
| Tabelog Teppen（09-29） | 83 | 38个控件总数相同但字段不同；09-28 FULL、09-29 PHONE_ONLY、09-30 CLOSED都变UNOBSERVED | 库存完成布尔原本/改名后均false；未制造成功 |
| Tabelog Sen（10-10） | 507 | 138个控件总数相同但字段不同；10-01 FULL变UNOBSERVED | 10-22两人selected真→假；库存完成布尔均false |
| TableCheck搜索控件（09-29） | 见结果映射 | 不变 | 名称/库存判定均不变 |
| TableCheck Ginza卡片（09-29） | 见结果映射 | 不变 | 名称/库存判定均不变 |

两份Tabelog的私有class耦合是有效故障证据；保守UNKNOWN避免误报成功，却可能使合法观察无法完成。未来不能为了改名后“相同”而把缺证当选中/可预约。两份TableCheck仅是正常控制，不证明未覆盖的菜单、testid、busy或全部站点抗改名。此实验只测观察和完成谓词，不测改名后的完整站点JS交互；外部CSS/脚本缺失在两版都同样被fixture边界阻止。class改名后全功能/全站通过没有被证明。

原指令提到的固定翻月图标与jQuery私有钩子，当前生产扫描未再命中；现行月年/caption与观察链接路径保留，旧项不给本批删行信用。仍有class-selected、React singleValue/label尾缀及loading词等静态风险，逐项列入CSV，不把“此次未触发”写成没有风险。

## 5. 地理、语义与小缺口

**Omotesando route：** 固定30名控制中29/30解析成功；HTTP200返回Omote-Sando Avenue、route、坐标35.667355/139.707743，因`google-places-restaurant-search.ts:87`附近的地理类型合同没有route而拒绝。这是地理语义门槛，不是Guard/网络拒绝。旧独立复核认可它为明确失败；是否用后位车站/街区或可解释route观察点，要独立批准且有同名/上下文/坐标证据，不做拼写例外、猜URL、改圆心或扩大1000m。[旧结果](../../phase2c-location-semantic-20261023/location/google-30-read.json)。

**Ebisu旧0结果：** h03/h09/h15各记录一次namedPlaceResolution、0发现/详情/浏览器，错误no returned places。保存状态与当时代码可重建textQuery=Ebisu、pageSize10、无bias/region/language，但不是原始HTTP。客户端传播普通网络/HTTP/JSON错误；合法响应中places缺字段与[]都会归为空。原始status/body未捕获，原因仍UNKNOWN，不能归到VPN、拼写、配额或无东京bias。后续有东京context控制成功不构成反事实确认。[旧诊断](../../phase2c-location-semantic-20261023/ebisu-diagnosis.md)。

另一个较早P1-D Ebisu 0/10是**错误圆心：返回Jupiter, Florida同名日本料理店**，不是同一“0结果”问题；当前地理结果排序/类型/上下文边界已有后续修复，不能把这两个历史机制合并。旧40份成功投影缺完整排名类型的覆盖缺口仍在，不补造回放输入。

**Tabelog首次10秒：** 以F5重跑槽3保存的首次健康尝试为可核实样本：HTTP200、Guard INSTALLED、10001ms、snapshots=[]；第二次等待300秒后HEALTHY，不能由后来成功倒推第一次原因。[固定tar抽取](health-history.json)。这可以定位到“10秒内没有完成snapshot”，不能确认底层是renderer、网络、Guard、事件循环还是页面结构。已修的“已有完成快照却未被截止采用”是另一机制，此样本没有完成快照，不应重开那项已关闭缺陷。更早未保存充分诊断的首次超时也不能补出根因；交A的现有健康工作补时间戳/CDP证据，本批不增阈值/重试或声称Tabelog不可访问。

**条件展示：** 当前`condition-states.ts:82`是restaurant/cuisine/food三个通用尾词，并非完整菜系词表；引用必须来自当前商户类别/课程等字段，保留限定词、午晚餐、否定和HARD核验。拟议抽取可用模型找证据，但代码仍核对引用/同店/请求，不能靠扩词表或店名/评论补资格。价格、税/餐期、身份分店/门牌/楼层和库存绑定均属继续严格项。

## 6. ≤3591行计划（未实施）

本轮物理行数：两个站点目录非测试TS **3864**，Pack **473**单列。原停止点0口径不包括Pack/Skill，不把迁移到Pack/通用层计为减行。

[line-plan.json](line-plan.json)给出11个不重叠删除/替代范围：私有日期状态38、第二套queryElements52、提示/文案8、Tabelog class-slot23、TableCheck widget55、重复隐藏DOM24、表单字段13、宽slot兜底15、两站重复字段14＋10、菜单容器扫描54，**预计净减306→3558，较目标余33行**。这些是纸面估算，当前实际删行0、仍3864，目标尚未达成。

所有提案先复用已有控件/可见性/作用域观察，替代前必须保留同店、query、HARD/价格/餐期与正反例；不能删除核验或把同段代码搬到其他目录充数。没有足够公开语义/作用域证据的条目延期，再交复核调整计划，不以降低断言硬凑3591。私有钩子已退役、共享层隐式回退删除和3b店名解析的潜在行数都不计这306行。按批准的纵向切片分批取得红绿和五门禁，不在本批实施。

## 7. F6窄ADR草案与数据依据

[ADR-0045草案](../../../docs/decisions/0045-bounded-read-conclusion-reserve.md)建议整单500秒内固定预留**20秒**，不足一次读取动作估时加预留时，只保留结束/已有合格结果展示；执行前重核、读取截止不晚于deadline−20秒，预算/已接纳候选不重置。模型COMPLETE不成为证据，不把未查完说成附近无合格店。

固定8份原Live blob中，已记录完成读取动作62项（23搜索/16事实/23查位），包含失败和快速拒绝；74次有延迟记录的根模型决策最大12.212秒。两个END_READ分别3.785/3.400秒，模型后至产物结束0.346/0.364秒；重跑截止收尾代理最大0.696秒。合计13.272秒向上取整到10秒粒度建议20秒，留6.728秒。只有两份结束样本，没有完整展示成本，取消时长也不是独立实测，故仅提议初值，不能说已保证。

动作估时取已记录执行最大值加根模型最大值、向上到5秒：搜索105秒、事实105秒、查位170秒；含预留的准入阈值125/125/190秒。它保守且可能提前放弃实际很快的动作，明确交复核取舍，不承诺新交付率。三个未持久化查位尾段只记删失/到产物结束时间，不能当完成耗时混入分位数。[逐动作与SHA](timing-evidence.json)。

离线有效红灯设计直接取重跑槽3行39、余26.596秒和原候选/余额，经真实合法动作计算断言CHECK_AVAILABILITY不可选、来源执行0次；未修路径应失败。修后同断言、有足够时间的正常合格交付、短批保留、慢取消/最后模型失败、迟到结果、原调用预留和预算累计均须覆盖。此处只是设计，**F6红绿灯NOT_RUN**，不新增产品测试、Prompt或Schema版本。

## 8. 验证、预算与停止

- 固定Git输入：[inputs-sha256.json](inputs-sha256.json)、[历史Linux输入](historical-inputs.json)、[探针冻结](probe-freeze.json)；执行前提交/SHA与当前一致。
- 本批离线真实浏览器：固定6个资源类型本地构造对照、4份保存页面class变换；接收端到达与生产观察/谓词直接核验；结果不称产品修复或网站回放。无新增默认测试。
- Mock/替身：仅HTTP/页面边界与CDP缓存回调时序控制；没有生成餐厅资格或模型输出。新Replay／Live Read-only／Controlled Live-write全部NOT_RUN；历史8份Live/评价只读，S0不重判，不把本批0调用写成新Live S0=0。
- 五门禁：F5在最新main组合已全绿1053/155，各项前后净树。F3是审计/草案/离线观察产物，按Test纯文档矩阵做引用/SHA/差异检查，**五门禁复跑NOT_RUN**；生产/测试/Runner/Prompt/Schema/Guard/站点/Pack相对已验证main零差异，复用门禁不冒称新运行。
- 共享budget.json原字节不变：23条，累计8Live、334真实模型、45Google、3环境重跑、7评测GET；本批新增全0，不读.env。没有申请或使用新的Live额度。
- 最终[verification.json](verification.json)记录源码/预算/历史产物/用户文件/SHA/链接/CSV/行数与git diff --check核验。主工作区9份用户设计材料及HEAD保持，当前审计工作区提交后干净。

**停止点4：F3清单和两份ADR均待复核；只本地提交，未合入或推送本审计分支。** F5已经单独合入并推送main。不会自行实施Guard、route、隐式列表回退、F6或3b店名解析，不新增任何真实调用。
