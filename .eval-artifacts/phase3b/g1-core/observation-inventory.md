# 观察依赖清单（draft / not integrated）

基线 cc127320；52 组现有位置，F3 原38项逐项映射见 [f3-disposition.csv](f3-disposition.csv)。原始代码搜索见 [layout-search.json](layout-search.json)，文件SHA在CSV。位置指向函数或其关键锚点，同行业务不变量分别列项。

分类：AGENT＝由 Agent 接手（观察+引用+核对）；SAFETY＝保留安全/证据核对（其中标准DOM枚举、内部UI明确无违规）；DATA＝保留数据响应绑定且必须增加“结构已变化”告警。分类针对职责，不表示所有命中都是缺陷。一个函数中的私有提取要改，不表示其身份/日期人数/价格/餐期核验可删。

| ID | 当前代码位置 | 分类 | 依赖与拟议处理 |
|---|---|---|---|
| OBS-01 | `src/infrastructure/browser/browser-task-executor.ts:457` | AGENT | select/fill 接受调用方 CSS；权威值比较不提供观察回退；已知控件作加速；失配进入现有 runSkill 观察；authoritativeValue 精确核对保留 |
| OBS-02 | `src/infrastructure/browser/local-playwright-chromium.ts:202` | AGENT | click/fill/select/press/check/scroll/wait 支持原始 selector；仅保留底层驱动；业务动作必须来自本次可见控件 ref，CSS 失配回观察 |
| OBS-03 | `src/infrastructure/browser/cloudflare-browser-run.ts:236` | AGENT | 远程 Browser 同类原始 CSS 执行入口；与本地同一观察合同；不能以固定 selector 串联步骤 |
| OBS-04 | `src/infrastructure/browser/playwright-browser-controls.ts:7` | SAFETY | 标准标签、role、label、可见性和 ElementHandle 枚举；保留语义观察与当前 ref 校验；这些 CSS 是平台观察工具，不代表站点私有业务结论 |
| OBS-05 | `src/infrastructure/browser/playwright-browser-controls.ts:76` | AGENT | Value Container + 两级父节点 + singleValue class 推 selected display；回到可见选项/label/ARIA；不能让私有层级失配终止任务 |
| OBS-06 | `src/infrastructure/browser/playwright-browser-controls.ts:169` | AGENT | 向上六层查 label/title class；控件归组与 owner 路径位置有关；保留可观察 legend/ARIA/caption；弱布局提示不作为动作或业务绑定权威 |
| OBS-07 | `src/infrastructure/browser/playwright-browser-controls.ts:148` | AGENT | ownerKey、form/group index、calendarIndex/day index 是位置衍生键；本次 ref 身份校验仍保留；不得用这些位置来决定站点动作或同一业务字段 |
| OBS-08 | `src/infrastructure/browser/playwright-browser-controls.ts:459` | AGENT | 日历 day 使用 :scope > p，字段投影 data-year/month/day；读取可见日期与 caption/ARIA，结构失配重新观察；日期完整性校验不删 |
| OBS-09 | `src/infrastructure/browser/control-selected-state.ts:2` | AGENT | active/selected/current/checked 与 hintClass 可将 class 判为选中；class 仅提示，改用本次可观察选择状态与响应核对；ARIA/原生 selected 部分保留 |
| OBS-10 | `src/infrastructure/browser/playwright-browser-controls.ts:585` | AGENT | spinner/loader/skeleton class 影响等待；ARIA/progressbar 与可见结果优先；私有 class 不能成为唯一完成/超时依据 |
| OBS-11 | `src/infrastructure/browser/browser-task-executor.ts:1300` | SAFETY | 按钮类型、form method/action、提交与导航风险判定；保留失败关闭及授权边界；布局变化不能成为放宽副作用检查的理由 |
| OBS-12 | `src/infrastructure/browser/browser-task-executor.ts:1005` | SAFETY | radio 归属、可见/disabled、精确权威值和观察后变化检查；保留同控件当前性、日期人数等绑定；不允许仅同文案跨组替代 |
| OBS-13 | `src/integrations/tabelog/tabelog-query-controls.ts:13` | AGENT | p-booking-calendar / people-button / time-button class；迁到站点指引与可选加速；失配回读页面，G3 后实施 |
| OBS-14 | `src/integrations/tabelog/tabelog-query-controls.ts:32` | AGENT | calendar/caption/em/day-num/closed/full/tel/is-hidden 布局判断日期状态；Agent 观察并引用当前日期状态；无可核证语义时 UNKNOWN，不用缺 class 推无位 |
| OBS-15 | `src/integrations/tabelog/tabelog-query-controls.ts:121` | AGENT | 私有 people/select 容器、父子关系、hidden input 值确认字段；以可观察分组与标签找控件；隐藏值只可辅证，不能代替用户可见字段 |
| OBS-16 | `src/integrations/tabelog/tabelog-query-controls.ts:134` | SAFETY | 必须同次、同日期人数；选中冲突/隐藏人数冲突不得混用；保留绑定不变量；布局提取换成观察+引用，不能删除核验换行数 |
| OBS-17 | `src/integrations/tabelog/tabelog-query-controls.ts:162` | DATA | find_vacancy URL、base_date/members/selection、同店且同请求；保留精确响应绑定；对象/字段/类型变化显式 SOURCE_STRUCTURE_CHANGED，未知不当无位 |
| OBS-18 | `src/integrations/tabelog/tabelog-page-parser.ts:208` | AGENT | time/slot/vacancy class、data-time、available/unavailable 标记；由可见时段/状态引用及已审核响应核对；不靠 class 是否存在证明空位 |
| OBS-19 | `src/integrations/tabelog/tabelog-page-parser.ts:74` | AGENT | rst-name/restaurant-name、data-address/phone 列表布局；观察店名链接与页内身份；G4 身份/检索归 C，本批只登记 |
| OBS-20 | `src/integrations/tabelog/tabelog-page-parser.ts:120` | AGENT | display-name/address 等私有身份字段与 JSON-LD 回退；提取可泛化，身份核对仍严格；G4 归 C，不能自行改其文件 |
| OBS-21 | `src/integrations/tabelog/tabelog-page-parser.ts:5` | AGENT | list-rst/calendar/vacancy 私有 result-region 描述决定 busy；由可观察结果区域与完成状态核对；现有负载/挑战失败关闭保留 |
| OBS-22 | `src/integrations/tabelog/tabelog-page-parser.ts:249` | AGENT | rstdtl-course-list/title/desc/price/rule 固定 class 和嵌套；观察完整套餐原文，保留限制、否定、餐期和价格，不以拼接的半句替代原文 |
| OBS-23 | `src/integrations/tabelog/tabelog-page-parser.ts:267` | AGENT | rdheader-budget/course title/price class 选价格容器；改为语义原文+核对；午晚餐、税费、金额、加项与同店同页边界均保留 |
| OBS-24 | `src/integrations/tabelog/tabelog-page-parser.ts:291` | AGENT | display-name/review/course/rstinfo-table 标签及父级归属；字段角色改由观察支持；商家与用户评论/邻店必须继续区分，不可把评论引成商家事实 |
| OBS-25 | `src/integrations/tablecheck/tablecheck-page-parser.ts:480` | AGENT | Venue Availability testid + div 深度作为唯一当前组件；Agent 观察语义结果区域及同次请求；未知/多个冲突组件仍拒绝库存结论 |
| OBS-26 | `src/integrations/tablecheck/tablecheck-page-parser.ts:509` | AGENT | day/Venue Pax Select/Venue Time Select testid 与 pax/time id；可见日期/人数/餐期语义选择与复核；格式变化回读，不能静默失败 |
| OBS-27 | `src/integrations/tablecheck/tablecheck-page-parser.ts:649` | AGENT | Timeslot Btn/Unavailable Msg、slot 状态与 CalendarSkeleton 私有结构；由可观察时段及原文核对；保留单餐期空与整窗空的区别，未知不算无位 |
| OBS-28 | `src/integrations/tablecheck/tablecheck-page-parser.ts:811` | SAFETY | 可见控件、disabled、日期/人数/时段、完整请求归属；保留语义核对和冲突拒绝；不以选项列表代替实际库存 |
| OBS-29 | `src/integrations/tablecheck/tablecheck-page-parser.ts:174` | AGENT | 菜单类别 radio/name 及容器 class 构建服务范围分区；观察 label 与可见套餐范围，保留互斥服务范围核对；结构失配不混成全店事实 |
| OBS-30 | `src/integrations/tablecheck/tablecheck-page-parser.ts:875` | AGENT | Menu Item Card testid/data-price 选价格与可见原文；原文语义读取；金额、税、餐期、可见性、同套餐绑定保留 |
| OBS-31 | `src/integrations/tablecheck/tablecheck-page-parser.ts:357` | AGENT | 身份 DOM marker/JSON-LD、固定 title/address 层次；DOM 提取泛化；同名不等同店的身份规则归 C，保留拒绝冲突 |
| OBS-32 | `src/integrations/tablecheck/tablecheck-page-parser.ts:553` | SAFETY | reservation[start_date]/num_people_adult 精确字段与 form 归属；请求字段绑定保留；定位可用观察回退，不能扩大 reservation 页或提交权限 |
| OBS-33 | `src/integrations/tabelog/tabelog-browser-availability.ts:586` | AGENT | 已知 party/date select 的固定代码路径；加速失配回 runSkill；日期人数确认仍必需，不允许删失败核对 |
| OBS-34 | `src/integrations/tablecheck/tablecheck-browser-availability.ts:888` | AGENT | party/date 旧 select 路径与 service_category name 分组；同上；服务范围必须可见 label/本次选择支持，不增加固定点击序列 |
| OBS-35 | `src/integrations/restaurant-facts/native-source-facts.ts:133` | AGENT | 事实读取复用 TC 私有菜单分区与两站私有身份/价格字段；复用来源读/身份/预算；G1 不把已知 selector 或库存成功当接待方式证据 |
| OBS-36 | `src/integrations/restaurant-facts/google-listed-website-facts.ts:183` | AGENT | courseName/coursePrice class 组合商家条款；固定商事实字段请求；泛化问题→完整原文选择→同店/本次引用核对；旧 HARD 判断保持本批原行为 |
| OBS-37 | `src/integrations/restaurant-availability/source-price-facts.ts:11` | SAFETY | 通用 HTML 嵌套、hidden/aria-hidden；价格税餐期解析；这些是完整证据/可见性边界，保留；调用方私有容器选择另列，不能搬到通用层充数 |
| OBS-38 | `src/integrations/restaurant-search/result-region-busy.ts:2` | AGENT | class/id/testid 匹配 busy region 与 loader；语义区域观察为主，私有布局只指引；不把无匹配等同完成 |
| OBS-39 | `src/integrations/restaurant-search/source-packs.ts:320` | AGENT | js-list-sidebar-cal-date / is-current 推目录当前日期；站点 Skill/提示可指引；已知 selector 失配回读；Pack 非本批归属，不实施 |
| OBS-40 | `src/integrations/restaurant-search/source-packs.ts:285` | SAFETY | 来源地区入口同源路径、观察集合归属与请求范围；保留观察入口/同来源/范围身份，不能以布局改名放宽来源边界 |
| OBS-41 | `src/integrations/tabelog/tabelog-public-query.ts:4` | DATA | find_vacancy 等精确方法/URL/字段投影；保留审阅的只读请求形状；响应漂移告警，不把 transport 放行当作库存 |
| OBS-42 | `src/integrations/tablecheck/tablecheck-public-query.ts:14` | DATA | catalog/search root.children 文档字段计数、calendar_v2 四字段；保留请求投影与商店/请求绑定；结构变更告警，不把缺字段吞为0或无位 |
| OBS-43 | `src/integrations/tablecheck/tablecheck-availability-response.ts:57` | DATA | 同shop available 响应、epoch/人数/单时段与 failure/data:null；保留 UNCLASSIFIED_FAILURE，不能推无位；新格式显式告警，不伪成功 |
| OBS-44 | `src/infrastructure/browser/playwright-read-network-guard.ts:80` | SAFETY | 提交/账号/支付/PII、逐跳、隔离、WebSocket、非GET准入；保留全部安全约束；已接受 fetch/xhr 统一与预检修复不重开，不以 CSS/布局放宽权限 |
| OBS-45 | `src/integrations/restaurant-availability/native-outlet-continuity.ts:45` | SAFETY | 来源实体ID/canonical/店名地址/当前页面连续性；严格同店规则保留；提取入口可观察化，不同店/不同分店不得因同名合并 |
| OBS-46 | `src/integrations/tabelog/tabelog-entity-resolver.ts:11` | SAFETY | 名称/地址/电话规范化、楼层门牌分店冲突；保留身份约束；实现归 C，当前仅审计，不改 |
| OBS-47 | `src/domains/restaurant/condition-states.ts:20` | SAFETY | HARD、来源字段类型、否定、价格/餐期及同店证据展示；保留语义不变量；类别别名/固定字段限制作为 G3 泛化待办，不删断言 |
| OBS-48 | `src/infrastructure/browser/browser-action-decision.ts:8` | SAFETY | 模型只能提出本次观察 ref、动作无 State/执行权；保留；站点指引不是固定 selector 动作权限，不改现有 Agent Prompt |
| OBS-49 | `src/infrastructure/browser/local-playwright-chromium.ts:91` | SAFETY | body.innerText 获取可见文本，不作站点业务判断；保留通用页面观察；同类远程 body 文本读取也覆盖，不属于私有布局耦合 |
| OBS-50 | `src/web/local-workspace-page.ts:1` | SAFETY | Praxis 自己 UI 的 class/querySelector；已检查；内部 UI 渲染不是外站动作或事实核对，不在此原则改造范围 |
| OBS-51 | `src/infrastructure/browser/browser-runtime.ts:125` | SAFETY | BrowserControlHint 底层选择器描述不决定业务动作；接口本身保留；调用方私有提示必须是可失配加速，不是唯一操作路径 |
| OBS-52 | `src/integrations/restaurant-search/native-restaurant-search.ts:111` | AGENT | 搜索框由可见 label 与 input name 辅助识别；保留可见搜索语义；字段名只加速，改名仍能观察或诚实未核实；非本批归属，不实施 |

## 覆盖方法与边界

从F3-001–038出发，对全部跟踪src非测试TypeScript搜索selector/locator/querySelector/classList/className/testid/父节点/位置索引，排除fixture、eval与harness；逐函数审阅站点page-parser/query-controls/browser-availability、通用Browser控件投影/执行/选中/settlement、facts、source-price-facts和region busy。另人工覆盖正则HTML解析和结构化响应（单靠grep会漏control-selected-state和response字段）。`layout-search.json`每个命中文件均在本清单出现；web内部UI也显式排除。未改任何A/C归属文件。

未来变更顺序：ADR批准→A的G2语义保留DOM变体验收→B的G1接入口及G3；身份/具名店由C处理。G3之前本分支不改两站parser、query-controls、Guard、Pack、Prompt、共享State/Schema。数据格式漂移告警本批仅写规范，不声称已实现。

G2必须冻结原页与变体SHA，保留可见文本、ARIA、href、原生值与站点响应。class/testid改名及无语义wrapper/位置变化后可完成或如实无法核实；不能声称空位/无位/日期人数/价格/身份等未经支持结论。单有测试名/保护的契约不是覆盖证据；有效红灯与独立来源核对由A规格给出。
