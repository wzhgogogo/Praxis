# 具名检索会话和入口重复：离线诊断与方案

Status: draft / not integrated，已暴露开发记录；2026-11-03，维也纳CET UTC+1。产品、A评测、Guard、身份、预算、版本均未改。真实模型/Google/网站/Live/GET新增0，不读.env。

## 结论

存在可改进的生命周期边界，但不是“片段模型每调用一次就开一个浏览器”。restaurant_named_source_query只调用模型提议片段，按候选缓存到run结束；没有openSession或navigate。真正的创建链是Router按候选checkpoint调用来源读者，每次LiveBrowserAvailability.read创建一个Executor，resolver结束时finally关闭；下一候选重新创建。Executor.acquire本身已有复用能力。

同一候选的TableCheck→Tabelog可以共享现有会话，D8三家已全部如此。D4还有导航运行时失败导致旧会话被退休、同一候选fallback时重建的情况；不能把这些失败上下文强行复用。重复入口有不同检索词和合法替代查询，不能把同一路径次数当作完全相同请求或可直接删除数，也未证明它是预算耗尽的最大原因。

## 输入、逐次调用链

原始补跑冻结在ce6f94af82840806983669c67e834121d13820d0。inputs.json固定两轮recording、canonical trace、execution.result、原模型决策及相关实现源码的Git SHA。运行前提交288f7e13，分析器预检发现canonical trace不保留args，bc1d4375冻结修正后按导航次数/顺序关联时间；旧预检保留，不假装逐请求ID已存在。

**全部38次入口导航**见[entrances.md](entrances.md)；每次的来源、录制序号、会话、候选ID/名称、Agent step、完整静态调用链、新建原因、同会话第几次入口、观察到的结果页URL和导航期限都在[analysis.json](analysis.json)。绑定是本次记录专用：候选checkpoint顺序、providerAttempts、完整公开search_text快照与模型goal交叉核对；不宣称是通用自动归因。D4最后一家缺完整终止attempt，保留已观察到的导航，不补造完成结论。

| 补跑 | 物理会话总数 | Tabelog rstLst入口/所处会话 | TableCheck search入口/所处会话 | 片段模型次数 |
|---|---:|---:|---:|---:|
| D4 | 16 | 16 / 10 | 10 / 10 | 6 |
| D8 | 3 | 7 / 3 | 5 / 3 | 3 |

来源会话数不能相加：D4有4个会话同时去过两站；D8全部3个会话都去过两站。D4开头两个是原生发现，尚无具名候选，不是片段检索。之后9家候选是CHECK_AVAILABILITY（Agent step4–6）；前五家TableCheck导航ERR_FAILED，Executor按RUNTIME_FAILURE退休会话，Tabelog再acquire，形成五个额外物理会话；后四家两来源共享各自候选的会话。D8是单一INVESTIGATE_CANDIDATE_FACTS（step2）下的前三家identityOnly调查，不读库存；每个single-candidate read结束关闭，三家各一会话。

普通路径：Agent动作 → RestaurantExecutionRouter.candidateCheckpoints(single) → assembly.availability.check（或identityOnly facts→sourceAvailability.identify）→ LiveBrowserAvailability.read/new BrowserTaskExecutor → AvailabilitySourceResolver → provider.check → executor.acquire → provider的DISCOVERY navigate。read在resolver.afterRead关闭Executor，native discovery有自己生命周期。对应源码位置：router约83/344/424行，live-browser-availability约102–132行，executor约341及1368行；以冻结源码为准。

同一会话的重复入口另有不同原因，例如D4 Dengana原名→Dengana片段、D8 Hanare原名→Nodoguro。快照有些保留完整公开查询，可确认这些不同；SESSION_CALL普遍已去query，失败导航无后续快照时无法复原请求全文。analysis分别保存requestedFullQuery未知和observedPages，后者不是请求全文。HAR未提供可信waterfall，不计算节省秒数或提升百分比。

## D8 TableCheck两个出口

新增**离线sidecar诊断字段**tablecheckD8Branch（不写State、不改产品）：三家均为NO_OUTLET_URLS_AFTER_EXPLORATION，分类为SOURCE_AND_DECISION_PATH_INFERENCE，非历史运行自带的新字段。

| 候选 | 会话 | 最后TC入口录制序号 | generic discovery模型原决策序号 | 后续Tabelog入口序号 |
|---|---:|---:|---|---:|
| Nakamata | 1 | 4 | 4 | 65 |
| Nodoguro, Ginza Nakamata Hanare | 2 | 176 | 6、8 | 237 |
| Nodoguro Nakamata | 3 | 333 | 9、11 | 394 |

相对B仅看终端码的诊断，这里补读了原始execution.decisions.jsonl。五次TABLECHECK/DISCOVERY模型调用都明确是“Reveal public TableCheck restaurant search results without submitting a reservation.”，该调用点在初始matchesDiscoveryQuery门槛（约541）之后、无入口的探索路径中（约555）。每家最后一次显式TC导航之后仍有该调用，之后没有新的显式TC导航，直接进入Tabelog；providerAttempts最终为TABLECHECK_DISCOVERY_INCOMPLETE。结合冻结实现，终止return应为后面的空outletUrls分支（约589–613），不是初始query不匹配直接return。

**这不证明探索之后query仍匹配，也不证明纯解析器错误。** generic后再次核对query可能失败，或未观察到可提取门店链接，两者都可造成空入口；保存终端诊断不能再分。更不能据此证明网站限流、资源拥塞或模型动作错误。

第3项要求加诊断字段，末尾又要求不改产品；已异步询问窄授权。本停止点遵从不改产品：diagnostic-only-proposal.patch未应用，拟在现有discovery诊断添加incompleteStage（INITIAL_QUERY_MISMATCH / NO_OUTLET_URLS_AFTER_EXPLORATION）和queryMatchesAtExit，仅在两个原return处记录；业务条件、failureCode、状态和查询行为不变。若将来应用，应先用固定两出口红/绿验证；A还需保存现有onTableCheckIdentityDiagnostic回调，否则新增运行时字段仍不会进入其导出。此次只在sidecar增加原因区分，不能回填或伪造历史运行日志。

## 一项建议方案：run内来源会话、搜索页按观察复用

1. 将现有Executor/来源读者的所有权从每个single-candidate call上移到同一rootTask/readRun的有界生命周期。同来源复用一个匿名会话；两来源可各用一会话，避免互相覆盖搜索页。只在run结束、取消、deadline/保留区或真实运行时失效时关闭；不建跨用户或跨run池。现有checkpoint事件仍逐候选提交，不把候选批处理取消。
2. 保留每候选/每来源/整轮的既有计数和deadline；beginCandidate/Provider仍重新建立正确作用域，消耗不能因借用会话清零。特别区分provider尝试数和真正openSession次数，现有session额度不能被顺手放宽。原名→合法片段→同ID日文名、去重、候选详情名额及共享片段缓存全部照旧。
3. 搜索页确实仍在、且当前观察到公开输入和提交控件时，按可见label/ARIA执行改输入与公开查询提交，重新观察并核对本候选查询和结果已更新。没有可观察控件或当前在详情页时，使用已有合法导航路径回搜索；不写死CSS、位置或点击序列，不推断页面仍保持旧状态。需要证明各站可用控件/Guard动作，尚未实测，不能承诺完全不再navigate。
4. 每次换候选丢弃旧DOM引用、请求回显、菜单/身份证据和查询结果绑定；重新确认电话/完整地址/来源店号，不能用会话复用当作身份接纳或库存证明。B1两次校验、同店同run的条款引用保持。错误导航已退休的会话不复用，也不追加失败重试。
5. 所有新取页、提交公开查询、模型前仍检查同一20秒保留和取消信号。D8的declared限额含每候选60000ms、每provider45000ms、整轮500000ms；1494/41/1447ms是实际失败导航给出的短期限。会话复用可能省初始化，但不能承诺消除来源顺序耗尽共享候选期限的问题；本方案不调整期限、来源顺序或额度。

### 未来实施验收，不在本批执行

复用已冻结D4/D8的来源素材，固定两个同来源不同候选，先以当前代码证明两个checkpoint会新开；再验证健康run只开一个来源会话，第二次查询回显/结果新鲜且身份不串店。补持续BUSY、fatal retire、取消/20秒、不同user/run、旧元素引用和旧条款不可复用的反例。搜索输入操作缺素材时标未评，不合成成功；同店门槛与名额保持，资源计数不重置。五门禁/严格G2在产品实现阶段重新运行。之后若批准真实对照，再分别记录会话/导航/模型/时间和失败，不用静态入口差值当提速。

## 本批验证与边界

冻结后离线分析成功：D4 26行、D8 12行，共38入口；三个D8分支均有原模型调用的正向见证。初次分析器trace字段预检失败保留为preflight-288.json，未运行产品或改口径。4f262950上verify-diagnosis.py完成PASS：冻结文件SHA、38个唯一导航键、三个分支见证、815条账本原值/限额、源码/脚本/依赖完全等于main a7abbc0f；在临时目录用原字节脚本/输入再跑，analysis.json与entrances.md输出逐字相同，原执行输出没有被覆盖。结果在verification.json。纯诊断文档按Test矩阵不重跑未变化的产品门禁，不把B旧绿灯报告为本轮修复成功。

账本按ID并入B保存的68条已有A/B记录（同ID无冲突）并新增C零调用条目，共815行；限额仍用main原值，累计增加仅是导入历史真实用量。本批没有模型/Google/网站/Live或环境重跑消耗。仅推工作分支停下复核，不合main；原因分析和复用方案都尚未转为产品优化。
