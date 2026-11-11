# D8 有位时段 Live 与离线收尾

Status: draft / not integrated for post-Live fixes；已暴露开发用例，不是 held-out。日志时间为 CET (UTC+1)；来源预约条件仍按原请求的 Asia/Tokyo 就餐时区。旧20:00诊断/原评价全部保留。

## main 合入与实际冻结

用户已接受8ac9067f/source2e4e2fcb。同步 main f324f17b 后确认其为当前分支祖先，无冲突；生产源码原字节保持。增加真实录制组件：D4实际DOM/JSON/原状态→原B1链接与异店异时反例；既有TableCheck精确联想/请求/路由组件；D8真实snapshot5–17逐份哈希。缺动态响应的部分均标 COMPONENT_REPLAY，不补造响应，不改原NOT_EVALUATED。进入既有默认/Chromium门禁，无新重复Runner。

冻结8b14d8d6：默认1497、Chromium246+G6 78、严格G2全部12页、typecheck/arch/build全通过，六项前后净树同SHA。STATUS/DEVLOG/TEST-LOG、能力矩阵及月度入口同步。2af982d4快进发布 main 和工作分支，ls-remote逐一一致；本地主main引用只在远端确认后快进。全部20条已批准动态读取合同与独立21条字面量清单核对PASS，包含4文字形状、店铺GET及日历POST；原已审核Tabelog形状显式抄录，未从生产策略生成批准。

预先选2026-11-11 20:30、2人，店名不变，只把原请求8 PM改为8:30 PM。main合入后仅1次认证GET返回200并确认20:30有位。实际选择/日期/请求/结果/hash在最终冻结前写入plan及certified-selection.json，正向证书exists=true，未使用无见证诊断开关。最终 main 冻结ca0bd139095cc7899f4a96e04a2378f191548878已推送并ls-remote确认，在该SHA运行唯一一次D8。

## 实际结果

Run g6-D8-1794120568023-0；07:49:28 CET开始，INITIAL187.239s/26模型，BOOK_THIS_OUTLET47.811s/4模型，业务总235.813s；后验另计。30模型全部SUCCEEDED（语义2、Agent7、浏览器19、来源查询计划2），Google2，每回合均低于50调用/500s，无储备窗口内新来源工作。

初回合：TableCheck完整店名→唯一精确联想→同页店页→HIGH（名称+完整地址）→唯一性通过→内嵌组件按模型选择日期，代码核对2026-11-11/2人/20:30 AVAILABLE→PRESENT_RESULTS。**这次已真实走通唯一性及查位；但B1为空，条款未交付。**

更早的路径绕行：查位阶段#19–#24又以Google短名Nakamata从搜索入口检索，遇暂不可用后WAIT/请求帮助，才回到已知店页选日期；本阶段共43.987s。这是期望直接在已识别店页查位之前的路径偏离，未阻止本次查位，保留为后续减少重复检索的诊断，不在本轮扩大修复。

首个交付阻断：可见可用的本店`/reserve/landing`入口已在控件记录2198/2211中出现，标签20:30、21:00。2185的最后一次waitForSettled=false，且运行时snapshot依据此状态标PENDING；仍有search-v4公共Fetch未结算。B1被动收集器只在整页SETTLED时保留入口，因此丢失了这两个实际入口。精确库存已由来源组件独立核对，这不等于整份G1文档完整；原实现拒绝交接，没有伪造入口。

原定追问触发后，实际编译补丁只有与现有目标**逐字段相同**的TARGET，日期/时间/人数未变；Reducer却无条件清空搜索/库存/证据。随后重新Google检索、TableCheck及Tabelog入口分别约20秒超时，最终NO_VERIFIED_RESULT、handoffs=[]，不是有来源证据的无位结论。没有成功交付、没有执行预约。

| 候选 | 阶段/来源 | 浏览器模型 | 用时 | 实际到达 |
|---|---|---:|---:|---|
| Nakamata | INITIAL身份/TableCheck |4|24.545s|HIGH；真实来源全名进入唯一性|
| Nodoguro, Ginza Nakamata Hanare | 身份/TableCheck |7|45.018s|provider期限停止|
| 同上 | 身份/Tabelog |0|20.115s|入口运行时失败；该候选累计65.150s|
| Nodoguro Nakamata | 身份/TableCheck |0|20.115s|入口失败|
| 同上 | 身份/Tabelog |2|22.734s|仅搜索观察；未核对到目标库存；累计42.850s|
| Nakamata | INITIAL查位/TableCheck |6|43.987s|11/11、2人、20:30 AVAILABLE；B1入口收集失败|
| Nakamata | 追问重查/TableCheck |0|20.119s|入口超时|
| Nakamata | 追问重查/Tabelog |0|20.117s|入口超时；追问候选累计40.237s|

来源查询计划模型另有Nakamata1、Hanare1；故候选级来源调用合计分别11、8、2，另9次语义/Agent=30。其余2候选未调查。初次Agent一次提交前三候选批次，所以在第一家已HIGH后仍先完成该批次；不是唯一性修复未生效。Tabelog产品路径没有完成本店身份/查位，不能把独立见证冒充产品渠道成功。

## 独立评价四层

1. 端到端：最终未交付。正向见证仍有20:30，NO_DELIVERY_WITNESS为CAPABILITY FAIL；BOUNDED_NO_RESULT文案也FAIL。自动总状态NOT_EVALUATED，qualified/outcome=null，不将首回合部分进展当整单验收。
2. 逐环节：精确联想/店页/HIGH/唯一性/初次查位已发生；B1和条款未达；追问状态连续性失败。后验Tabelog详情+vacancy2GET均200，原时段仍有位。B1控件有证据，但整页待结算；完整Replay仍不可用。
3. 严重程度：原评价S0=0、stopBatch=false；独立外层实际请求边界88/88 PASS，GET/HEAD审计ABSENT/无gap。33条解码问题全部为重复NETWORK_RESOURCE_TYPES清单，明确归类后请求证据排除0、边界解码无问题。无真实预约、写入或越界工作流请求，forbiddenRequestsReachedSource=0。评价输入和原结果不改写。
4. 归因：两个确定性产品接线/状态问题；模型和API调用本身30/30返回。后续入口超时是真实来源操作失败，不归咎模型连接。不因为正向见证而宣称TableCheck库存独立验收完成，也不宣称进入held-out。

## 离线修复（工作分支，未自动合 main）

- B1：只被动记录本次已观察到的可见可用同店入口；新snapshot使前次控件采集失效，发布仍须原HIGH身份、精确AVAILABLE、请求/证据/时效匹配和两次服务端URL校验。整页PENDING本身既不生成库存也不变成SETTLED。G1仍拒绝PENDING文档，不提供条款答案。ADR0049原有B1条件与G1完整性澄清均保持，追加实现说明。
- 相同目标：应用补丁后做结构相等判断，**仅当当前PRESENT_RESULTS仍可交付**才保留现有结果；为新用户回合递增investigationRevision，强制新的G1文档/条款作用域，不复用旧答案；不改任何checkedAt/expiry。过期同请求、不同日期/时间/人数/店名仍清空以重新核对。
- 实际控件+初始状态B1红→绿，UNKNOWN/LOW/隐藏/异店/过期/错时仍无链接；实际状态投影+真实追问补丁红→绿，变化和过期反例仍重置。原始整段事件重播因持久化JSON字段顺序与历史搜索指纹不一致而失败，该日志保留；没有改写cursor或录制来绕过。这个部件不宣称整单Replay。
- 当前生产组合使用LOCAL_CONSTRUCTION来源库存/条款及模型替身：旧实现同名追问再次SEARCH有效红；修后不再检索/查位，保留原B1及原时效。它证明接线，不证明真实模型会做同样选择或Live条款成功。所有原业务/安全反例保留。

首轮6bd75c29默认门禁1510/1511，抓出上一轮条款缓存复用，旧断言原样保留；已修正为新G1作用域，定向33项全绿。第一轮完整输出在offline-repair/gates，最终源码冻结8c9cae41ab7125098ea3480b5c05f501e88283f3，同SHA净树六项全部PASS：默认1511、Chromium246+完整G6 78、严格G2全部12页，typecheck/arch/build通过；回执在offline-repair/gates-verified。写死扫描相对main ca0bd139新增0条。此次门禁后未再改产品/测试，原Live目录与7c8732c4逐字不变。未跑第二次Live；原失败仍为失败，main停在ca0bd139等待复核。

## 录制准入与链接清单

三类全开；33次页面，29份DOM经清洗保存，4份因UNREVIEWED_DOCUMENT_QUERY_SHAPE拒录。2/33具完整Replay资格，PARTIALLY_REPLAYABLE。店铺JSON GET200、11152字节，正常进入清洗后仍以JSON_VALUE_PRIVACY_OR_SHAPE_LIMIT拒录；未放宽隐私。其它响应遗漏：JSON敏感键14、录制方法/URL未审核32、JSON大小11、非UTF8 7、值隐私/形状3。真实动态正文缺失不能补造，详见recording.json/live-summary.json。

以下供复核者区分核对，**不是本轮Live已交付的B1清单**（实际handoffs始终空）：

- [TableCheck真实店页](https://www.tablecheck.com/en/nakamata-nodoguro-ginza)，Live身份/唯一/首轮查位来源。
- [TableCheck真实观察到的预约入口](https://www.tablecheck.com/en/nakamata-nodoguro-ginza/reserve/landing)，仅观察，未打开。
- [离线修复由实际入口及原有位证据生成的20:30交接链接](https://www.tablecheck.com/en/nakamata-nodoguro-ginza/reserve/landing?start_date=2026-11-11&num_people=2&start_time=20%3A30)，仅组件回归输出，未访问、未Live交付，不含已验证条款。
- [Tabelog独立认证/后验详情](https://tabelog.com/en/tokyo/A1301/A130101/13186922/)，非产品渠道本次身份成功；实际vacancy回执中的20:30源链接保存在原body，不打开预约表单。

## 额度与停止

新增Live1、GET3（认证1+后验2）、真实模型30、Google2、站内传输观测92（另3个独立GET），总网站计数+95。累计：Live24→25/43、GET359→362/470、模型672→702/1600、Google96→98、网站11289→11384。剩18Live/108GET全部留出预留，本轮可用0；没有动用预留。模型余额898，原模型只调用验证15/30不变；没有自行提高任何总额或时限。进入held-out前仍由复核者决定计划与额度。

当前停止：不追加来源读取、模型或Live；先交工作分支离线修复/门禁/原录制给复核，新的产品修复未合main。
