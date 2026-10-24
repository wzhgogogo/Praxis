# Praxis 当前状态

- Status: Accepted
- Document revision: 4.395
- Last updated: 2026-10-25
- Source of truth for: 当前实现、证据与下一道门槛

- **2026-10-25-PHASE3A-PRIME-REPLAY-PORTABILITY:** 停止点3补充完成：回放Harness按平台使用macOS sandbox-exec/Linux非特权unshare -rn，不可用明确失败、不skip或联网回退。Ubuntu22.04 ARM64 UID501先原4项ENOENT红、后4/4绿，缺工具控制与真实netns/curl7见证通过；macOS五门禁1037/154全绿，每项后净工作树。原四项断言SHA不变，真实调用0，临时VM已清理；按授权合main后停等复核。 [报告](../.eval-artifacts/phase3a-prime/stop3-replay-portability-20261025/report.md)。

- **2026-10-25-PHASE3A-PRIME-STOP3-RECORDING:** 停止点3两项修复完成：健康检查已合main/28216ae3；录制器先替换第三方URL key/signature/client值，再保留原扫描，普通命中按页/条目拒绝，自有凭据命中整份拒绝且不提前发布DOM。槽1最小元素真实Chromium录制/回放到首个不合格页，0来源请求；五门禁1037/154全绿，各项后净工作树，真实调用0。自有请求体短路边界补充红绿后，05991efd最终五门禁1037/154全绿、净工作树；按授权合main并停止等复核。 [报告](../.eval-artifacts/phase3a-prime/stop3-infrastructure-fixes-20261025/recording/report.md)。

- **2026-10-25-PHASE3A-PRIME-STOP3-HEALTH:** 停止点3健康检查修复完成：每次完成快照立即形成就绪判定，10秒截止采用已完成观察，保留后来繁忙/403/挑战拒绝并记录快照起止。220ms原构造红绿与真实Chromium通过；五门禁1034/153全绿，每项后净工作树，真实调用0。按授权合入main。 [报告](../.eval-artifacts/phase3a-prime/stop3-infrastructure-fixes-20261025/health/report.md)。

- **2026-10-25-PHASE3A-PRIME-STOP2-GOOGLE-CAPTURE:** 停止点2复核两补丁完成：F2③静态免租约先合入main/1a736c88；F2④b在新main祖先上补正式Google原始响应HAR捕获，手工fixture追加退役，写前/落盘后扫描拒绝密钥。两项五门禁1028/148与1032/153全绿，各项后净工作树，依授权再合F2④b并推送。新增真实调用0，3864/473行不增。 [报告](../.eval-artifacts/phase3a-prime/stop2-review-fixes-20261025/report.md)。

- **2026-10-25-PHASE3A-PRIME-STOP2-PACING-FIX:** 按停止点2复核修复F2③：静态资源只计数不取租约，document/已准入动态及预检、Google API保留共享节奏。双Chromium各20个同源CSS/JS有效红绿，21次访问仍计数、租约21→1。五门禁1028/148全绿，各项后净工作树；0新增调用，按授权合入main。 [报告](../.eval-artifacts/phase3a-prime/stop2-review-fixes-20261025/pacing/report.md)。

- **2026-10-24-PHASE3A-PRIME-LONG-TURN-A:** 对话A长回合四项完成，按停止条件7等复核。诊断DOM补丁合入并推送main/e0e1037e；F2③与F2④b/估算分别留工作分支。四轮五门禁全绿、每项后净工作树；0真实模型/Google/网站/Live/环境重跑，3864/473行不增。完整录制齐备时额度内6次未来F5 Live加15回放约23.8分钟，未实测，F5录制验证延期。 [报告](../.eval-artifacts/phase3a-prime/long-turn-a/report.md)。

- **2026-10-24-PHASE3A-PRIME-ROUND-ESTIMATE:** 15例规模耗时估算完成，未运行Live。完整录制齐备时6次未来F5 Live加15回放工作假设约23.8分钟；15次全新Live加回放约56分钟，仅规模参照且超8次Live额度。deadline或健康重试情景超过1小时，当前完整录制覆盖未证实。五门禁1028/152全绿。 [报告](../.eval-artifacts/phase3a-prime/round-estimate/report.md)。

- **2026-10-24-PHASE3A-PRIME-F2D-REPLAY:** F2④b候选完成：真实Chromium/Guard使用合格文档/HAR原样重放；OS断网仍复现相同非空候选和交付，缺响应/第3页不合格明确REPLAY_INCOMPLETE，未回放部分不计pass/fail，回放排除Live分母。五门禁1028/152全绿，0新增调用，未合main；F5录制验证延期。 [报告](../.eval-artifacts/phase3a-prime/f2d-replay/report.md)。

- **2026-10-24-PHASE3A-PRIME-F2C-PACING:** F2③候选完成：共享协调进程按origin跨子进程节奏控制，固定2运行、第三FIFO排队、单运行等待0、三种中断释放；真实Chromium/Guard及fixture Google接线通过。五门禁1028/147全绿，每项后净工作树，0新增调用；未合main。 [报告](../.eval-artifacts/phase3a-prime/f2c-pacing/report.md)。

- **2026-10-24-PHASE3A-PRIME-DIAGNOSTIC-DOM:** 诊断DOM补丁完成：安全缺脚本/OPTIONS页独立留档，危险/挑战/超大页只记原因；回放字节不变，五门禁1028/141全绿且每项后净工作树，0新增调用。仅本项获准合入main，后续F2③/④b分支待复核。 [报告](../.eval-artifacts/phase3a-prime/f2a-diagnostic-dom/report.md)。

- **2026-10-24-PHASE3A-PRIME-F2A-STOP2:** 批次2对话A离线候选完成，codex/fix-phase3a-prime-f2a，停止点2待复核，不等B/F5且未合main。正式执行函数保存SIGTERM/SIGINT、AbortSignal、deadline的已有记录；真实Chromium/Guard/HAR子进程四控制与关闭处理红灯通过，声明及边界S0均ABSENT，缺最终状态保持未知。Evaluator34/rubric30修复额外UNSPECIFIED；h-12完整上下文成对与单规则干预证明其他独立判断不变、派生结论随之变化；22/22、正常声明20/20，历史两中断未知保留。Recorder4按页判定，三旧录制0/74、0/109、0/56，缺静态依赖或原DOM不补造。最终五门禁1027/141与typecheck/arch/build全绿，单次20.182264/84.761184秒，各项后Git状态空、门禁恢复0；初轮缺快照回归已修复并保留。真实模型/Google/网站/Live0，适配器3864/pack473不变，报告Europe/Vienna。 [报告](../.eval-artifacts/phase3a-prime/f2a/report.md)。

- **2026-10-24-PHASE3A-PRIME-F1B-REVIEWED-MAIN:** 用户明确批准F1b/F1完成，将f42715c2快进合入main并推送，远端核验SHA为f42715c2cb34a18764b664bd175576dfe2eaabe3。合入后该精确main五门禁一次全绿，默认1024/1024、Chromium137/137，单次20.212164/85.410666秒，每项后Git状态空。随后从该main开始F2a工作分支；原主工作区9份用户文件与HEAD保留，未删除分支。 [合入与门禁](../.eval-artifacts/phase3a-prime/f2a/main-integration.json)。
- Document revision: 4.386
- Document revision: 4.387
- Last updated: 2026-10-24
- Source of truth for: 当前实现、证据与下一道门槛

- **2026-10-24 CEST F5停止点2交付收敛：** 共享层实现、正常地区圆心／入口控制、跨readRunId集合拒绝及持久化已齐。五门禁于fd7c3c70全绿（默认1037／Chromium138），最终补强后再以gates-final核对；两个站点目录3864行及source-packs473行逐字节不变。冻结脚本后例01公开GET仅2次，当前Dengana距冻结圆心约202m、类别相符、2026-11-04 19:00两人空位见证通过；间隔5.010秒，响应／SHA与账本齐。例03 Kudanshita仅人工800m口径，环带未核对、可选GET0。模型／Google／Live新增0；推实现分支后停在2等复核，F5Live仍须F2①／F2④a合main及用户另批。[完整报告](../.eval-artifacts/phase3a-prime/f5-implementation/report.md)。

- **2026-10-24 CEST F5批次2实现／冻结：** 已在新main/f42715c2建立实现分支。仅共享层实现Accepted ADR0043，临时入口可取样并从已观察集合直接纠正一次；状态21／定义19，Browser上下文3／wire12／Prompt20。R1有效红灯与绿灯、四页零恢复真实Chromium、真实Router／Reducer和N1–N4定向通过。适用五门禁待执行；例01公开GET认证脚本及两例日期变体先冻结提交，当前新增外部调用0。停在停止点2前补齐结果，不运行Live，不合并main。[报告](../.eval-artifacts/phase3a-prime/f5-implementation/report.md)。

- **2026-10-24-PHASE3A-PRIME-F5-REBASE:** 用户通过停止点1c，授权进入批次2实现＋Live准备。分析分支已将三提交重放到main/f42715c2，冲突保留F1/F1b及F5全部记录；分析摘要和Accepted ADR0043逐字节不变，生产代码差异0。原停止点60d02686用annotated tag保留固定Git输入可达性。仅推分析分支后，从新main建立codex/fix-phase3a-prime-f5-provisional-entrance；本记录不表示实现或Live已运行。新增模型/Google/网站/Live0。[重放核验](../.eval-artifacts/phase3a-prime/f5-analysis/rebase-20261024.json)。

- **2026-10-24-PHASE3A-PRIME-F1B-COMPLETE:** F1复核为安全但审查未完成，按用户要求补做F1b：C18历史绝对路径重定位、产品输入迁入模块fixtures、P21c改用临时输出、运行时文件读取检查及11文件/并发4拆分。三项红绿齐全；默认1024/1024、Chromium137/137，三次中位20.469752/85.078675秒（目标≤150），九次门禁后Git状态均空且恢复0。独立克隆在OS拒绝/Users及旧工作树数据读取的条件下默认1024/1024，宿主存在性元数据仍可见；本地浏览器安装资源复制进克隆后通过。137运行名/483断言调用保留，94输入含87精确内容及7路径索引，194原非测试TS不变；69/5/22及正常声明20/20通过，目录3864/包473不增，新模型/Live0。原1175清单仅作索引，报告统一Europe/Vienna。继续F1候选分支，未合main，停于停止点1待复核。 [报告](../.eval-artifacts/phase3a-prime/f1b/report.md)。

- **2026-10-24-PHASE3A-PRIME-F1-COMPLETE:** 对话A/F1离线候选完成，分支codex/chore-phase3a-prime-f1，停于停止点1待与B/F5分析一起独立复核；未合入main。1175行清单覆盖1167基线执行项和8非默认探针；退役四个源码字面自检及父项5个，编译空文件迁fixture，纯身份反例合入既有probe契约且前后同破坏双红；31秒Chromium主回归保留，只去掉同例退役30秒对照。新五门禁默认1023、Chromium137，三次中位21.561452/276.823612秒，基线23.337168/307.573510；69翻月/5选店/22校准通过，正常声明20/20、历史中断未评保持。83条明确安全类清单保留、31条Live失败家族主覆盖列证据；15保存页面/控件provenance、原字节不变。194生产TypeScript逐字节无改动，目录3864/包473不增；新增模型/Live/来源调用0。 [报告](../.eval-artifacts/phase3a-prime/f1/report.md)。

- **2026-10-24-PHASE3A-PRIME-F5-STOP1C:** 用户明确批准ADR-0043，修订document revision 1.1为Accepted／尚未实施，仍按指令停1c不实现。范围仅A；LOCATION／车站改动未采纳，待F5 Live完整DOM后再议。替代入口改从同来源流程实际观察集合由模型选择、代码核对Pack及作用域后直接导航，不读恢复页；D1东京→A1322→A132201→替代共4地区页。已明确当前DOM targetRef合同不支持旧引用，需窄集合选择合同，普通OPEN_LINK不扩权；直接NAVIGATE须计页。补G3与集合外/跨来源/拼href反例，N1–N4优先复用既有fixture构造。历史拼接估算57.512秒，D2慢代理87.501秒，列表解析仍未证。48项固定SHA，新调用0，产品/测试/站点零差异，五门禁NOT_RUN；仅提交推送F5分支后停1c。F1先合main后本分支再重放，保留双方记录。[当前报告](../.eval-artifacts/phase3a-prime/f5-analysis/report.md#10-停止点-1c-修订与-adr-批准) · [已批准ADR](decisions/0043-provisional-directory-entrance-coordinate-check.md)。

- **2026-10-24-PHASE3A-PRIME-F5-STOP1B:** 用户通过停止点1、选择A拒绝B；1b设计与ADR-0043提议草稿完成，尚未实现。Q7固定D1/D2共15个地区决策、18份CONTROLS均无INPUT，错误区八站OPEN_LINK已给，D1确曾点击类别All；匹配Akabane的LOCATION／站距路径未观察，HTML仅head或缺失、截图文字遮蔽，因此范围裁定为证据不足，控件条件优先＋A后备交复核。A细化临时入口、两有效样本、代码距离／方位、与4/5共用一次换入口、UNKNOWN立即交接及预算不重置。早取样条件估算55.549秒，较深路径恢复需5地区页、超过4页，不能靠加预算完成。例03冻结Kudanshita、人工800m类别0家、环带未核对、用时只记录；历史有界无结果与零合格交付分列，不改评分。新增调用0、43项SHA、产品/测试/站点零差异、五门禁NOT_RUN；仅提交推送本分支后停1b。F1b先合main，之后重放并保留双方记录；本批不合并或推main。[当前报告](../.eval-artifacts/phase3a-prime/f5-analysis/report.md#9-停止点-1b-补充) · [ADR草稿](decisions/0043-provisional-directory-entrance-coordinate-check.md)。

- **2026-10-24-PHASE3A-PRIME-F5-ANALYSIS:** 批次1B只读分析完成，停在停止点1等独立复核选方案。固定3ec38584四份完整结果171行决策及中断29行：例01 Tabelog零详情、地区未完成；两家与同义词改写实际来自TableCheck，不能仅放宽首五家规则。例03历史输入为备用Kudanshita，五店都在半径内，后续事实约148–150秒；第三次未到达。41/95为重复OPTIONS诊断，预检只支持GET而日历规则为受限POST，缺真实配对字段，分类交F3。提出两个通用层方案，优先评审权威地名约束检索；均未实施，收益待验证。产品/Runner/测试/适配器未改，新模型/Google/网站/Live0；不合并、不推送。[分析报告](../.eval-artifacts/phase3a-prime/f5-analysis/report.md)。

- **2026-10-24-PHASE3A-PRIME-STOP0-APPROVED:** 用户转述独立复核00:20北京通过停止点0，行数错误在指令一侧。门槛仅两个站点目录非测试TypeScript物理行，3591→3864、目标≤3591；source-packs.ts单列当前473且站点行数不得增加，移动到pack/通用层不计减少，站点Skill排除。批准批次1：A做F1，B做F5只读分析；F1基线默认1029/23.3秒，Chromium138/307.6秒。批次0五门禁与原始统计不改，新模型/Live0。 [报告补充](../.eval-artifacts/phase3a-prime/main-check/report.md#7-停止点-0-复核补充2026-10-24-0020-北京)。

- **2026-10-23-PHASE3A-PRIME-MAIN-CHECK:** 用户批准的3a′指令逐字保存并先独立提交8601233c；从main/ac571ca8建立批次0分支，不向旧开发分支提交。fetch后main与origin/main一致，包含4d953731和9de09404，旧开发分支无独有提交。五门禁与默认1029/本机Chromium138的三次耗时基线见报告。行数存在口径冲突：历史3591/约3863不含source-packs.ts，当前窄口径3864；按指令含包则3991→4337。依停止点0等待复核明确≤3591适用范围；F1/F5未启动。产品代码、测试、fixture和资格不变，新增Live/真实模型/Google/来源网站0，不合并、不推送。 [报告](../.eval-artifacts/phase3a-prime/main-check/report.md)。

- **2026-10-23-MAIN-ONLY-WORKFLOW:** 用户决定保留全部远端分支，不删除任何分支，第二阶段删除提案关闭。从第三阶段起main为唯一主线：新工作分支从同步后的最新main创建，验证及复核通过后合并回main。codex/feat-live-restaurant-read-path保留在第二阶段phase2-signoff历史指针，不再提交、合入新工作或作为新分支起点。当前签收缺口和历史tag不变；本次仅文档整理，不修改产品或运行Live。 [唯一权威约定](REPOSITORY-CONVENTIONS.md#git分支与tag) · [已关闭的历史清单](reviews/PHASE-2-BRANCH-INVENTORY-20261023.md).

- **2026-10-23-PHASE2-SIGNOFF-CLOSEOUT:** 用户于2026-10-23 19:51北京带缺口签收第二阶段；原始签收文件e9de81d6逐字合入，SHA457521eb…，不改历史判定。严格退出条件2未满足、3未完整评价、6未满足，条件4仅离线修复未经Live复验；H005两种口径并列保留。near/展示修复已在c32fe31c合并验证，源码335份逐字节未变，复用五门禁1029默认/138本机Chromium及69/5/22回归。按用户确认的分支tip创建4个历史annotated tag，最终主线另打phase2-signoff；main仅允许快进，授权原子推送后核对远端。32个远端分支清单已列，未删除任何分支，删除须逐项确认。新增模型/Google/网站/Live0；签收用量4395/5000模型、91/100 Live、5/10环境重跑，余额不转第三阶段。 [签收原文](reviews/PHASE-2-SIGNOFF-20261023.md) · [分支确认清单](reviews/PHASE-2-BRANCH-INVENTORY-20261023.md) · [收尾核对](../.eval-artifacts/phase2-signoff-20261023/report.md).

- **2026-10-23-NEAR-DISPLAY-REVIEWED-MERGE:** 例01诊断已结束并停下后，将复核9de09404合入主线4d953731，合并09b5d353；5份历史文档冲突保留双方，335份源码/Runner/配置逐字节匹配两条已复核分支，生产额外改动0。新五门禁1029默认/138本机Chromium/typecheck/arch/build全绿；先提交00ff1fa5冻结后，翻月69/69、选店5/5、校准22/22（正常声明20/20）通过。原主线TableCheck修复不变；主工作区9份文件/HEAD/状态、历史生成指标恢复核对通过。新增模型/Google/餐厅网站/Live/重跑0。最终证据提交后按用户授权推送主线，核对远端SHA后停下；原Live结果不改。 [报告](../.eval-artifacts/near-and-condition-display-merge-20261023/report.md).

- **2026-10-23 TABLECHECK-GUARD-REVIEWED-MERGE:** Reviewed30494fba merged into8487a844 at46bd8ef9, conflicts0, product/eval source byte differences0. Fresh five gates1026/138 PASS; frozene925c8a0 calendar69/selection5/calibration22 with normal declarations20 PASS. Primary9 user files and HEAD preserved, historical generated metrics restored. Merge-slice model/Google/restaurant website/Live0. Authorized main push follows final evidence commit. Separately authorized case01 diagnostic remains excluded from original18; all qualification waits independent wording review. [Report](../.eval-artifacts/tablecheck-guard-merge-20261023/report.md).

- **2026-10-23 TABLECHECK-GUARD-HEALTH-COMPLETE:** TableCheck Guard/source-health candidate complete on branch codex/fix-tablecheck-guard-preflight, main8487a844 unchanged. Implementation b6ac60c5; regression freeze abcf5ad9. Five gates PASS1026/138; frozen cached calendar69/69, selection5/5 and evaluator33 calibration22/22 with normal declarations20/20 PASS. h14 old-policy Chromium red and GET-bound CORS green retained; permanent reserve deny and unchanged host/path/method audit pass. Eval-only health attempts about10s concurrent, up to3 separated300000ms, before formal task/providers; actual entry failure test has0 external calls/Live. Frozen outer timing/ledger integration remains untested and needs preflight wait allowance. No new model/Google/real restaurant websites/Live. Authorized branch push follows final evidence commit, no main merge; await independent review. [Report](../.eval-artifacts/tablecheck-guard-preflight-20261023/report.md).

- **2026-10-23 TABLECHECK-GUARD-HEALTH-CANDIDATE:** User-authorized candidate on8487a844, no main merge. h14 seven-key facet GET lacks hits; valid Chromium old-policy red retained, new GET-bound CORS green includes catalog/default GET/static fetch and rejects reserve/children, POST/manual OPTIONS, extra headers/path and absent GET. Scope audit proves unchanged origins/paths/methods/prohibited rules; only hits optional and existing TableCheck GET CORS metadata. Recorder facts and independent frozen reviewed-reads synchronized, no evaluator/Prompt/Schema/qualification change. Eval-only Hybrid health opens both known-region searches via production Guard, observes about10s, retries300000ms at most3 before formal timing/model/Google; actual Runner offline failure test confirms0 external calls/Live. Source homepage Range checks replaced only in this Runner; existing source-data checks remain. Prior CLI test assumed provider preflight before loading input; retained with new missing-input/no-preflight assertion, existing proxy unit regressions unchanged. Initial failure retained. Final five gates1026/138 PASS; source health real Chromium and unit/Runner tests pass. New models/Google/websites/Live0; freeze then69/5/22 pending. [Plan](../.eval-artifacts/tablecheck-guard-preflight-20261023/plan.md).

- **2026-10-23 NEAR-CONDITION-DISPLAY OFFLINE PASS:** 两项生产修复分别提交44724106（具名AREA不依赖near词）与53ac158c（通用food描述与真实商家类型字段相接）。有效红灯保留，h-06保存输入向观测圆心/发现交接通过；Router→Reducer回放11份，4条菜系NOT_CHECKED→MET，与冻结@33独立真值一致，其他9份展示及价格/全局引用不变，33条对照均CONSISTENT。正式回放先提交274569c9冻结4271项，SHA0cea339a…；新五门禁1025默认/137本机Chromium/typecheck/arch/build全绿，同69点/5选店缓存真实响应回归69/69、5/5，独立校准22/22与正常声明20/20。0新真实模型/网站/Google/Live/重跑；State/Schema、Prompt、评测器、站点Guard不变，历史结果不改分。原始日志/输入SHA、四层报告和测试指标字节恢复均保留。仅推私有修复分支，不合并主线，等待复核。 [四层报告](../.eval-artifacts/near-and-condition-display-20261023/report.md).

- **2026-10-23 CONDITION-DISPLAY-REPAIR:** 第二项独立修复：当前来源与引用链未丢失，generic literal cuisine key没有去除food描述词，使已接纳的Korean food判断不能与商家Korean字段相接。沿用现有restaurant/cuisine描述处理，仅补通用food描述，保留所有菜系限定、同店同来源、当前字段、否定与餐段约束，不依赖模型标签直接判满足。有效单元与真实Router→Reducer红灯保留，修复后12/12通过：h-02三家/h-08一家MET与原@33真值一致，其他9份保存产物展示及两份价格/全局引用均不变。无Prompt/Schema/评测器变更、0新模型/网站/Live；五门禁和69/5/22正式回归待完成。 [计划](../.eval-artifacts/near-and-condition-display-20261023/plan.md).

- **2026-10-23 NEAR-NAMED-LOCATION-REPAIR:** 具名AREA（除nearby）按现有地名解析，不再要求文本含near；不加地点/关系词表，观测坐标、半径、类型、歧义、预算规则不变。保存h-06原Kitasenju输入和X/near X两条目标红灯有效；修复后Google/原生发现27/27通过。旧分页/预算Fixture补充显式观测圆心，不给生产绕过；Google-only pack回放仅证明定位向发现交接，不证明当前库存/完整Live。第一项独立提交，展示修复与全套五门禁、69/5/22仍待完成；本轮0新模型/网站/Live。 [计划](../.eval-artifacts/near-and-condition-display-20261023/plan.md).

- **2026-10-23 PHASE2C-REVIEWED-MERGE:** Reviewed ae2235b6 merged onto remote-main baseline8ba0c54a in03f585a2, no conflicts.337 source/test/skill/script/build files byte-identical to16e91940, exceptions0; no product/Prompt/Schema/evaluator changes. Fresh post-merge five gates PASS:1022 default,137 Chromium, typecheck/arch/build. Frozen9ba840d7 rerun calendar69/69, selection5/5 and independent evaluator33 calibration22/22 with normal declarations20/20, all PASS; interrupted and incomplete evidence remain unknown. Main worktree HEAD/status/all9 user file hashes preserved. New model/Google/source websites/Live0, new holdout commitments/questions not searched or opened. Historical limits and exit6 unchanged. Final evidence commit and authorized normal push to codex/feat-live-restaurant-read-path follow, then stop. [Report](../.eval-artifacts/phase2c-merge-20261023/report.md).

- **2026-10-23 PHASE2C-FINAL-OFFLINE-COMPLETE:** Final Phase2c repair branch complete, pending independent review, no main merge. Promptv23 final54 replay passes exposed constraints; chain162/220, no more tuning. Goya3 saved-page replays and installed-Guard Chromium composition pass without widening query/identity/qualification rules. Five gates1022/137 PASS; frozen8ad2d118 replay69/69 calendar,5/5 selection and independent22/22 calibration/normal declarations20/20 PASS,0 new calls. Same06287b6f source count narrow3863/expanded6359 physical, this-chain delta0, shared constant candidates0; historical+272/+721 and exit6 NOT_SATISFIED retained. Google29/30 unchanged: Omotesando returned route, rejected; old Ebisu cause and40 missing ranked-response projections remain gaps. New continuation model54, Google0, websites/Live0. Initial5b2ea9bf remote verified; final authorized branch push follows evidence commit. [Report](../.eval-artifacts/phase2c-location-semantic-20261023/report.md).

- **2026-10-23 PHASE2C-BOUND-CLOCK-COLLECTION:** Goya parser repaired by retaining independently bound supported clock alternatives; no extended-hour conversion or new source branch/permission. Three saved full-HTML/projection replays complete with41 supported slots including19:00 each; missing supported-time, mismatched binding, newer contradiction, all-unsupported and PENDING negatives remain UNKNOWN. Actual createLiveReadAssembly with Guard INSTALLED returns AVAILABLE/19:00 on local HAR,0 model/Google; valid before-fix composition UNKNOWN red preserved. Initial fixture setup failures explicitly excluded. Five gates all PASS:1022 default,137 Chromium, typecheck/arch/build. Production source physical delta0; formal same-scope audit and69/5/22 offline regression pending. Raw response time was not captured, so saved projection plus independent Chromium proves the mechanism, not current stock or full-task delivery. [Scope](../.eval-artifacts/phase2c-location-semantic-20261023/goya-followup/scope.md).

- **2026-10-23 PHASE2C-SEMANTIC-FOLLOWUP-PASS:** Final one-shot promptv23 replay completed54/54 with54 new calls, no retries; chain162/220. Sit-down retained and invented with-tables removed3/3; NEGATIVE standing-counter preserved. Numeric-direction rows12/12: flexible under remains SOFT6/6, firm under/at-most existing max representation6/6. No more than/below absent from frozen18 messages, not separately sampled. Implementer read all54 paired condition lists and observed no other criterion regression; independent review pending. All30 changed full patches and original/v21/v22/v23 criteria retained, no historical inputs rewritten. No more prompt changes. [Comparison](../.eval-artifacts/phase2c-location-semantic-20261023/semantic-followup-220/comparison.md).

- **2026-10-23 PHASE2C-SEMANTIC-FOLLOWUP-FREEZE:** User raised the chain ceiling to220 (prior108 calls) and authorized one final generic prompt revision. Promptv23 requires each modifier to correspond to user words; explicit sit-down remains allowed.54 after trials reuse the frozen54 before controls with identical captured clocks/schema/model. Valid prompt-wire red and31 semantic green retained; prepare0 network. No further prompt tuning after this batch, pass or fail. Initial5b2ea9bf repair branch pushed and remote verified. Full gates and quality replay pending. [Plan](../.eval-artifacts/phase2c-location-semantic-20261023/semantic-followup-220/approval.json).

- **2026-10-23 Phase2c STOPPED / semantic not satisfied:** Stopped Phase2c after real semantic replay failed:108/108 trials executed with108 calls, no retries; v22 still adds HARD sit-down restaurant with tables in3/3 after samples. Relevant soft-upper-bound after6/6 correct but v21 controls also correct, so no sampled improvement claim. Full next after sweep needs54 calls, projected162>150; remaining42 is insufficient, no quota extension or extra sampling. Google29/30 on30 calls; Omotesando route type left unsupported. Six saved rejected-location observations now resolve,3 recorded empty lists remain unresolved,40 old selected projections lack ranked response/types and remain NOT_EVALUATED. Goya saved query/date/party and19:00 response confirmed, collection parser rejects non-clock tail; diagnosis only, no provider-specific patch. Zero-call offline five gates1021/136, cached69/69+5/5 and independent22/22 calibration/normal declarations20/20 PASS do not override semantic failure. Site-specific lines net0 this batch; historical increase retained. Mainline integrated/pushed8ba0c54a; repair branch local only, pending user decision. New source websites/completeLive0; chain model count3634+108=3742/5000, local cap150 unchanged. [Report](../.eval-artifacts/phase2c-location-semantic-20261023/progress-report.md).

- **2026-10-23 Phase2c semantic candidate:** Phase2c semantic candidate: promptv21 to v22, schema3 and compiler unchanged. Generic entailment/polarity rule rejects invented positive prerequisites/amenities; numeric relation/direction/strictness is independent of condition strength, so a flexible ceiling remains a SOFT ceiling. Valid prompt-wire red retained,31 semantic tests pass; actual saved affected-family proposals preserved as quality red evidence. Prepared18 exposed families x3 repetitions xbefore/after=108 trials, existing schema retry envelopes frozen, real-model hard cap150. Same captured clocks on both sides;54 before system messages byte-identical to original captures. Original materialized-clock inputs retained, no historical request/Gold rewrite. Real semantic replay pending; current new Google30, source websites/Live0. [Plan](../.eval-artifacts/phase2c-location-semantic-20261023/continuation-plan.md).

- **2026-10-23 Phase2c location candidate:** Phase2c location candidate: delete spelling/suffix admission and use ranked valid geographic observations; preserve100km context and leading-three separation bound, merchant-only unresolved. Same adopted center/name exposed in Web reply and artifact; original AREA retained. Valid saved Ningyocho red and actual Web-composition display red retained; google24/24, Web production-composition1/1, typecheck/arch/default1021/build pass. Five obsolete spelling-only tests retired in favor of ranked/type/distance behavior, not skipped. Existing successful-coordinate fixture still passes. Thirty Google names were committed at e04e9700 (SHA206c368b15133eea1204ca82af026c043336ae66911e83bec9f78a34605b435d). Google/saved-response checks pending frozen execution;0 new model/Google/site/Live so far. Ebisu upstream empty-list cause remains unknown due missing raw HTTP. No invented request fallback. [Plan](../.eval-artifacts/phase2c-location-semantic-20261023/continuation-plan.md).

- **2026-10-23 Phase2c prerequisite integration:** Integrated exact prep06287b6f into main06703ba1 in merge6cbf43c8, preserving both histories, main allowance5000 and Phase2b decision. No manual conflicts;331 source/test/skill/script/config files match1a715325 byte-for-byte with0 exceptions. State20/Evaluator33/rubric29. Fresh five gates1024/136 PASS, cached calendar69/69 and selection5/5, independent22/22 calibration and normal S0 declaration20/20. No new models/Google/source websites/completeLive; local user worktree unchanged. Phase2c implementation pending on the integrated base. [Report](../.eval-artifacts/phase2c-mainline-integration-20261023/report.md).

- **2026-10-23 Checkpoint C phase2b-offline-evaluation:** 仅离线评价保存的18次第二阶段b运行；对应及结构预算先登记SHA并提交冻结，固定Evaluator33/rubric29无后改。7QD/7MISS/2未合格/2未评，例01与04各3/3，仅2例达单例门槛；例02按运行前无见证批准排除。39条对照33一致、6条已审不等价价格展示未对应。S0 PRESENT为0，声明4次/越界6次未完整评价；退出2/4/6未满足、3未完整评价，5仅指标。站点窄口径3591→3863（+272），共享层新增常量候选0。0新模型/网站/Live/重跑，累计3634/5000模型、72/100 Live、3/10环境重跑。原始材料、Gold、评测器、rubric与登记不改；仅私有准备分支推送后停下等签收。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/evaluation-20261023/four-layer-report.md).

- **2026-10-23 Checkpoint C phase2b-wordings-pending:** 第二阶段b原顺序18槽位已全部保存原始产物与SHA；本批294模型、18完整Live、0环境重跑，累计3634/5000模型、72/100 Live、3/10重跑。Live冻结69209a016be68d6df97417fa7679d70b0e321212ab0c6d6400f361ba507f8448的884项未变；完成于2026-10-22T22:23:37.641Z，早于见证截止。仅抽14份产物的20条候选措辞配对；无能力评价/退出结论，等待独立措辞判定。第02例既定业务无见证排除记录保留，未修改产品/Prompt。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/exit-live/pending-wordings.md).

- **2026-10-23 Checkpoint C phase2b-witness-resumed:** 已批准恢复的评测侧见证认证完成：五例有见证，一例主地点及承诺fallback业务无见证，按用户预先批准排除能力分母并保留全部18槽位。80来源请求、0模型/Live/环境重跑；新增外层19项控制全绿，生产与Prompt字节未改，复用已验收五门禁及回放基线。累计3340/5000模型、54/100 Live、3/10重跑；最早见证截止2026-10-23T17:14:00.086Z。下一步提交最终冻结后连续执行18次，能力评价延后，仅提措辞等待复核。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/plan.md).

- **2026-10-23 Checkpoint C phase2b-step3-http400-stop:** 已批准连续任务：步骤1验收与步骤2三次暴露Live检查通过；步骤3只读认证在四参数接口HTTP400处按冻结采集器停止，原始响应与部分登记已保存，未将来源失败/未到达冒充业务无见证。新留出Live 0/18、未作能力评价；本阶段认证0模型，累计3340/5000模型、54/100完整Live、3/10环境重跑。详见停止四层报告、部分登记、源节奏审计和冻结；等待复核。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/plan.md).

- **2026-10-22 Checkpoint C phase2b-witness-inputs:** 在前两步全部通过后才打开复核者提供的da8ff090新留出：承诺eb5458b2与71d9961c及提供分支逐字一致，原文358beff8、6份用例SHA独立匹配，字符串严格校验通过。按东京10月23日物化6例日期，与复核exit-dates一致，只填日期无其他更改。原文只用于本次退出认证/执行，不复制到开发Fixture、语义Prompt或开发日志；生产代码保持三次合格检查的版本。准备冻结后0模型、30秒来源节奏查找认证。现累计3340/54/3、上限5000，剩1660/46/7；尚无新留出模型请求或Live，能力评价延后。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/plan.md).

- **2026-10-22 Checkpoint C phase2b-step2-live-pass:** 三次旧暴露完整Live检查全通过：例03两次及例01对照均Evaluator33/rubric29 QD，各交付3家，三次实际先到Tabelog。例03见证1/2进候选，两次返回18:00至20:00窗口内九时刻并集；例01见证3/3入候选，19:00。声明/越界均ABSENT；无重跑，间隔/500秒/50模型/40Google/旧见证有效期均满足。新增60模型/3Live/0重跑，累计3340/54/3，按5000剩1660/46/7；不计任何退出分母。冻结8afad494/4175项前后通过，原始/独立评价/四层报告已保存。第三步新原文仍未打开，接下来核对承诺及分支后准备新见证，最终18次只提措辞不评价。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/four-layer-report.md).

- **2026-10-22 Checkpoint C phase2b-step1-complete:** 第一步合并验收全部满足：预算/团体/流水线已按序进入准备分支，模型累计上限5000。实际五门禁1024/136、缓存真实响应69/69与选店5/5、独立校准22/22及旧例02五条预算均CONSISTENT。69与5请求经当前生产重建后逐项内容相同；无新模型/网站/Live。冻结f648d2df/4173项前后核对，当前3280/51/3、剩1720/49/7；旧原始/评价/Gold保持。新留出未打开，进入已批准三次旧暴露Live检查，必须在旧见证北京时间10月23日14:41:36前完成；不过门槛即停，不续期。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/four-layer-report.md).

- **2026-10-22 Checkpoint C phase2b-merged-inputs:** 已按顺序合入预算200e13cf、团体98cc7994、退出流水线47afd2d7，逐项保留各方行为、测试与历史正文，统一State20/Task18和文档修订；只摘取06703ba1预算批准。累计模型上限5000，当前3280剩1720；Live100与重跑10不变。实际五门禁1024/136全绿；69+5请求经当前生产重建，与批准内容完全相同（仅既有30秒传输超时差异），准备提交冻结后复用真实响应验收、独立22校准及旧例02五预算行回放。三次检查入口复用同一外层，仅三槽计划/单独授权，16项控制通过；原18槽行为保留。新留出未打开，模型/外站/Live增量0。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/plan.md).

- **2026-10-22 Phase2b退出流水线完成：** Phase2b退出流水线已完成零网站/零模型离线验收：最终d662a23b冻结3112项，旧暴露18槽位完整通过；6例见证3/3/2/3/1/2，9条目12措辞对不附结果，3份结构预算对应，缺判词评价0次、复用旧独立判词后18份评价。五门禁全绿（1005默认/131本地浏览器）。新留出仅71d9961c承诺未开原文，产品/ADR/Gold/预算及例03不改；旧500076/500080ms超限保留。此为流水线准备验收，非新留出或阶段退出；基线剩720模型不足900最低预留，未扩容。推送后停下等复核。 [报告](../.eval-artifacts/phase2b-exit-pipeline-20261022/four-layer-report.md).

- **2026-10-22 Phase2b退出流水线准备：** 在17415d1c独立分支准备Phase2b退出流水线；仅引入71d9961c承诺，未读新留出原文。增加SHA先于解析、非字符串条件拒绝、日期/后备记录、800米见证、18槽位及措辞复核门禁，复用旧Runner/独立Evaluator33。旧例05类型门禁红绿通过，后续提交冻结后演练旧已暴露18产物；模型/网站/Live均0，预算修复和例03不改。 [计划](../.eval-artifacts/phase2b-exit-pipeline-20261022/plan.md).

- **2026-10-22 Group/window offline repair:** Complete on isolated codex/fix-group-window, pending independent review. Four mechanisms, state20/task-definition18; five gates1014/136 PASS, cached calendar69/69 and selection5/5, evaluator33 calibration22/22 and normal declarations20/20. Six saved-run component replays schedule Tabelog first,24 prohibited outlet/run paths return early, c18 disabled10 stops with0 new decisions/actions. Missing responses remain recording gaps; no new full delivery or current-stock claim. New real models/websites/Google/Live0. [Report](../.eval-artifacts/group-window-fix-20261022/report.md).

- **2026-10-22 Checkpoint C budget-condition-complete:** 结构预算漏核对和漏展示已修复：生成稳定criterionRef的HARD行，资格与展示共用来源价格结果，超预算/无价拒绝；SOFT比较含义和既有价格政策保留。h-02/h-08/h-14原事件经当前Router→Reducer，5条预算及全部10条条件与Evaluator33/rubric29独立评价CONSISTENT，原产物/旧评价不覆盖。4个红灯、42项相关测试、实际五门禁（1001/1001、131/131）与校准22/22全通过。代码46d471ff；回放冻结5ff44333（2898项）、校准0452645d（808项）运行前后均一致。h11的around已在原模型Proposal，3495ms成功而非超时，仅报告比较方向修正建议，未改语义Prompt。0新模型/网站/Live，累计3280/51/3不变；仅本修复分支，未集成，推送后停下等复核。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/budget-condition-20261022/four-layer-report.md).

- **2026-10-22 Checkpoint C budget-condition-inputs:** 在请求分支修复结构预算遗漏：同一条件结果供HARD核对和展示，保留现有SOFT政策及来源约束。已复现4个红灯并通过42项相关回归；完整单测1001/1001、本地浏览器131/131通过，W11测试替身补齐来源报价事实。准备提交当前代码、三份已保存例02输入和离线脚本后冻结，再跑五家Router→Reducer的独立33展示复核与22项校准；h11只报告语义Proposal已改写比较方向，不修改Prompt。无新增模型/网站/Live，不改旧运行和评价，未集成。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/budget-condition-20261022/plan.md).

- **2026-10-22 Checkpoint C holdout-case05-reassessment:** 按19941c4e批准的可逆格式恢复补评例05三次，使用原Evaluator33/rubric29和原证据。h-05/h-17由原NE变QD，h-11格式错误消除后仍因已判不等价的SOFT措辞保留NE；旧三份NE、原始运行、Gold和承诺SHA不覆盖。全18参考结果10QD/7MISS/1NE，例05达2/3，共4/6例达标；仅数值子门槛通过，例03第一卡点仍属P2-1，完整退出2仍不满足。退出4/6不满足、3未完整评价、5仍仅指标；S0声明17ABSENT/1未评、越界15ABSENT/3未评，无新阳性，历史H003和H005两种口径保留。冻结d6315af5前后2975项、旧779/2891项、326生产/评测及483校准输入SHA均通过，复用五门禁和22/22校准。其他15评价不重跑，增量模型/网站/Live/重跑0，累计3280/51/3不变；推送后停下等签收。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/evaluation-20261022/case05-reassessment-20261022/four-layer-report.md).

- **2026-10-22 Checkpoint C holdout-case05-format-recovery:** 按19941c4e和用户批准，只对例05三份原SHA绑定的required_claims[1]单键对象逐字恢复为字符串；三份输入往返还原与唯一字段差异核对已通过。使用Evaluator33/rubric29现有批准更正接口，原始Gold/承诺/运行/旧NE不变，其他15份评价不重跑。准备提交冻结后0网络0模型补评三份，按原阈值与第一卡点条款更新退出，推送后停下。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/evaluation-20261022/case05-reassessment-20261022/plan.md).

- **2026-10-22 Checkpoint C holdout-evaluation-complete:** 已按dfdb175b完成18份保存产物的Evaluator33/rubric29离线评价；原始对应后5QD/3未合格/7MISS/3未评，结构预算对应的3份表示视图后为8QD/7MISS/3未评，原始和派生SHA并列。例02预算8000JPY保留，5条预算展示缺失；h-11 SOFT不等价未登记，另3条无等价展示。仅3/6例达2/3，退出2/4/6不满足、3未完整评价；52条件44一致、8未对应，0unsupported/missed。例05三份冻结required_claims字段object导致未评，未改Gold或排除本例。站点目录3591→3809行（+218），含混合文件5638→6279（+641）；共享层新增站点等常量候选0。有展示11次中位193.250秒/最大286.209秒仅指标；历史H005两口径和H003 S0保留。779 Live/2891评价冻结项、18原始SHA、326生产/评测文件及483校准输入均核对，复用五门禁998/131和22/22。新增模型/网站/Live0，累计3280/51/3不变；推送报告后停下等签收，不报告阶段通过。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/evaluation-20261022/four-layer-report.md).

- **2026-10-22 Checkpoint C holdout-evaluation-inputs:** 离线评价前已同步dfdb175b：9原产物9等价对应，6对拒绝（含1个SOFT偏差、5交叉配对）。例02三次的语义事实与最终意图均保留结构预算8000JPY；单独登记原SHA与字段路径，未补造价格核对或展示。为不改Evaluator33建立3个仅预算表示投影的评价视图，原始字节与原始33评价保留。阶段起点025940c5审计站点目录3591→3809行、含混合文件5638→6279行，退出6不满足；共享生产层新增常量候选0。准备提交冻结后用网络阻断器评价全部18份，不改产品、不跑模型或Live。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/evaluation-20261022/plan.md).

- **2026-10-22 Checkpoint C holdout-awaiting-wordings:** 六例见证3/3/2/3/1/2；按冻结d97eeab7完成18槽位、19次尝试（1次合规预检环境重跑），北京时间19:14:03结束，在最早见证24小时窗内。仅离线提取9原产物/15待对应措辞，逐条SHA和零基编号已核，不生成能力/条件/展示/退出评价。记录耗时最大500080ms超500000上限80ms，单列协议偏差待复核，未放宽阈值；原始与779冻结项保持。累计3280模型/51完整Live/3环境重跑，原始秘密扫描0匹配。本留出已暴露，非后续Clean基线；推送原始、账本及措辞后停下等独立判定。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/plan.md).

- **2026-10-22 Checkpoint C holdout-live-ready:** 六例见证全部有效（3/3/2/3/1/2），截止不重置为最早观察后24小时。0网络0模型完整演练已走通外层、完整Runner、独立S0安全检查、延后执行清单和措辞提取，未生成能力评价文件；13项新增/核心控制全绿，其他既有控制另留日志。326生产/Prompt/评测文件未变，五门禁按SHA复用。即将冻结18次完整留出运行，不带run-ids；完成后仅提交待复核措辞和原始记录，不报告评分。C签收H005严格原规则与用户特批30秒两口径并列。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/plan.md).

- **2026-10-22 Checkpoint C holdout-live-inputs:** 第05例按复核许可的商家地域/业态字段及四参数原始库存补证，六例3/3/2/3/1/2家均认证；其余完整来源不重采。仅Runner机械投影落实已批准备用地点。外层新增冻结留出计划与延后评分：Runner不自动评价、仅保留独立S0及环境重跑白名单；12项离线控制通过，326生产配置文件与通过基线SHA相同。准备0网络0模型接线演练再冻结18次，尚未运行留出Live。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/plan.md).

- **2026-10-22 Checkpoint C holdout-continuation:** 依据044f7de7及用户续行批准，补充第05例非川菜细分类别见证；无见证仍完整运行18次且排除该例能力分母。沿用其余有效登记，30秒决策不变，准备冻结延后评价编排；运行后仅提交未对应措辞，不生成评分。当前仅离线准备，原停止材料保持。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/plan.md).

- **2026-10-22 Checkpoint C holdout-witness-stop:** C17用户特批30秒重跑已QUALIFIED_DELIVERY（3家、29/29模型成功），C机械门槛PASS；随后按批准步骤解封并核对原文件/6例SHA，0模型认证登记为3/3/2/3/0/2家，两个唯一备用地点均留证。第05例备用地点仍缺负向HARD明文，见证门槛5/6而停；留出18次和措辞对提取均NOT_REACHED，不生成产品评分或最终Live启动冻结。生产/Prompt/评测器与C17通过时逐字节相同，复用五门禁998+131和校准22/22；累计Live33、模型2885、完整Live环境重跑2，认证传输重试单列。等待复核，不继续来源请求或Live。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/four-layer-report.md).

- **2026-10-22 Checkpoint C holdout-inputs:** 前两步通过后才解封指定留出提交b1ed9979；原5418字节与承诺SHA、6例文档SHA全部一致，commitment与父提交逐字节相同。原文不改，Runner只按exit-dates物化日期并添加运行信封，其他条件/验收一致。当前只准备0模型地点解析/见证发现，不开发或调试生产代码/Prompt；正式18次后按用户要求仅抽未对应措辞、不附结果。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/plan.md).

- **2026-10-22 Checkpoint C c17-timeout-pass:** 用户特批30秒决策补跑通过：c17 attempt3在214.037秒以29模型交付3家，@33 QD，S0声明/越界ABSENT，6条展示均CONSISTENT，3家事后GET200；一次浏览器模型响应15.692秒成功（旧限10秒）。29/29模型成功，旧CAPABILITY_MISS和全部原始未覆盖。H0052/3QD，其余TARGET各3/3；当前用户C门槛PASS。默认998/浏览器131及五门禁全绿，@33校准22/22只复用经SHA验证的不变评价输入。累计2885/4000模型、33/100Live、2/10正式重跑（用户特批额外1次保守计入），随后按原连续授权进入留出准备，当前尚未打开。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/c17-timeout-retry-20261022/four-layer-report.md).

- **2026-10-22 Checkpoint C c17-timeout-inputs:** 用户额外批准H005一次补跑：Agent及Browser决策超时10→30秒，500秒/50模型/40Google总限额不改；不增加自动重试，不改模型/消息/Prompt/Schema/@33评价。旧29调用含2次TIMEOUT和CAPABILITY_MISS保留。先红绿及五门禁，提交新freeze后只跑c17 attempt3；本次额外正式补跑保守记第2/10环境重跑。留出集仍未打开。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/c17-timeout-retry-20261022/plan.md).

- **2026-10-22 Checkpoint C c17-stopped:** 第一步双向引文修复已通过（38一致+2外部支持，0 unsupported/missed，校准22/22，五门禁全绿）。c17唯一补跑258.141秒/29模型/0交付：最后Agent调用10.004秒TIMEOUT，@33独立判CAPABILITY_MISS；本次声明/越界S0均ABSENT。H005仍1/3QD，其余TARGET各3/3，C门槛FAIL，按用户机械停止规则未打开留出集。新增1Live/1环境重跑，累计2856/4000模型、32/100Live、1/10环境重跑。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/c17-environment-retry-20261022/four-layer-report.md).

- **2026-10-22 Checkpoint C c17-retry-inputs:** 离线补修通过后按用户连续授权准备c17唯一环境重跑：resume@3验证原18份、TypeError独立复查失败、复核SHA和第一步五门禁/七条展示门槛。外层绑定@33/rubric29并按1次预留50模型，原18顺序/预算/停止规则不变；HARD仅绑定运行自身原始快照与当前已复核见证。留出集仍未打开。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/c17-environment-retry-20261022/plan.md).

- **2026-10-22 Checkpoint C bidirectional-pass:** 第一步双向字段引文补修通过：同一C18的40条展示对照38 CONSISTENT、2 PRODUCT_UNKNOWN_EXTERNAL_SUPPORT，天妇罗4/4、Utou3/3均一致，0 unsupported/missed；校准22/22，五门禁998+131全绿。网站、模型、Live均0；旧原始及评价SHA保持。连续授权下一步为c17唯一环境补跑，留出集尚未打开。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/c18-bidirectional-acceptance-20261022/four-layer-report.md).

- **2026-10-22 Checkpoint C bidirectional-inputs:** 按复核者决定修复双向字段引文：完整字段被所选段落包含时仅展示字段原文；分行文字被字段包含时展示所选文字。Utou原三条红灯已复现，修后与天妇罗四条及跨角色评论边界均通过。当前仅离线；待C18回放@33、校准和五门禁后才解锁c17补跑，留出集未读取。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/c18-bidirectional-acceptance-20261022/plan.md).

- **2026-10-22 Checkpoint C c18-acceptance-stopped:** STOPPED于离线验收：字段⊇语句修复使天妇罗4/4 CONSISTENT，Evaluator33/rubric29使Kaga2条单列PRODUCT_UNKNOWN_EXTERNAL_SUPPORT，unsupported0；但Utou标题含相邻8 items计数时丢失角色，c05/c09/c13新生3条MISSED，C18无MISSED门槛失败。未继续改口径、未消耗c17环境补跑、未读取留出集。已将同一实际判断适配器->Router->Reducer反例纳入默认：最终996/997（1失败），不是五门禁全绿；其余type/arch/build及本地Chromium131/131通过，校准22/22/声明20/20。13份展示回放/@33评价保留，5份N/A，原2299材料/18结果/18旧评价未变。新增模型/网站/Live0，累计2827模型/31Live/0正式环境重跑不变；推送准备分支后停下等复核。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/c18-acceptance-20261022/four-layer-report.md).

- **2026-10-22 Checkpoint C c18-field-role-evaluator33-prep:** 依据复核fbb200ec开始用户批准连续步骤，当前仅离线第一步：字段⊇所选完整语句继承角色并保留所选原句；不扩成未选整字段。Evaluator33/rubric29分离产品已观察支持与外部支持，Kaga未知不再误记missed，S0和unsupported不放宽。两条有效红灯保留，初步相关159/159，准备提交冻结、重做C18展示回放/校准/五门禁。留出分支未打开；H005补跑尚未开始，必须先过第一步并在20:23前完成。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/c18-acceptance-20261022/plan.md).

- **2026-10-22 Checkpoint C c18-offline-complete:** 本离线切片完成，非阶段签收：只在准备分支合入复核6d758f70的Evaluator32/rubric28及4fcf7702的展示修复，登记仅9个原SHA/12对应（旧13不变），当前认证见证原句限定清单已提交冻结。18份保存产物按原31、31+对应、32+对应+HARD并列：4QD/12NE/1MISS/1HONEST -> 12QD/4NE/1MISS/1HONEST；原始评价不覆盖。真实Router->Reducer回放13份、5份N/A，32展示unsupported4->0，H002价格遗漏3->0；仍6条MISSED（人工见证2、字段/摘录粒度4），逐条留证。退出1/3未评、4未满足、5中位224.642秒/最长341.062秒仅指标；不报告阶段通过。五门禁994/131全绿、校准22/22、正常S0声明20/20；2299原始文件、18原产物与18旧评价SHA不变。新增模型/网站/Live0，累计2827/31/0不变。提交并推送准备分支后停下等复核，不跑Live。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/c18-offline-reassessment-20261022/four-layer-report.md).

- **2026-10-22 Checkpoint C c18-display-replay-results:** 离线Router->Reducer展示回放13/13，另5份无展示明确N/A；2738输入与2757评价输入运行后核SHA通过。32评价S1_UNSUPPORTED 4->0，H002漏价格3->0；同时保留6条MISSED（Kaga人工见证2、tempura选中摘录与字段范围4），不扩大规则强行通过。默认994项首轮仅登记旧数量断言13/20失败，已按复核精确更新为22产物/32对，其中新增9/12；失败日志保留，继续最终门禁。原C18/评价不改，0新增模型/网站/Live。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/c18-offline-reassessment-20261022/plan.md).

- **2026-10-22 Checkpoint C c18-display-price-repair:** 已合入复核展示分支4fcf7702，五文档冲突保留双方历史。H002价格缺失根因为后续事实读取未保留同页结构化价格；现由原生产解析器随当前来源文档传递，模型消息不增加元数据，旧证据不复活。消费者原反例与生产者隔离红灯均为有效断言，当前相关28/28；三条C12/C16价格经Router->Reducer为MET。State19/TaskDefinition17/condition-states3，FactPrompt14/Schema4、Browser19/Context2和Evaluator32/rubric28分别统一，未变的轴不虚增。下一步提交冻结后回放13份已有展示，5份无展示不补造；0模型/网站/Live，账本2827/31/0不变，非Clean。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/c18-offline-reassessment-20261022/plan.md).

- **2026-10-22 Checkpoint C c18-reassessment-results:** C18两套离线补评18+18完成，2678冻结项运行后未变、外部调用0。原31为4QD/12NE/1MISS/1HONEST；31+对应和32+对应+当前HARD均12QD/4NE/1MISS/1HONEST，三者新文件并列，原评价不改。展示对照S1_UNSUPPORTED：原11→31对应16→32为4；MISSED_KNOWN_CONDITION仍3。剩余未知保留c02/c04/c08/c17，不补抓网络或重跑模型；下一步合入4fcf7702进行展示反事实回放。累计模型2827/正式Live31/正式环境重跑0不变，非Clean Baseline。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/c18-offline-reassessment-20261022/plan.md).

- **2026-10-22 Checkpoint C c18-reassessment-frozen:** C18离线双评输入已准备：Evaluator32/rubric28，归档31代码3aeb708b；9产物/12对应、80保存快照、17当前认证见证引用。Fukumimi旧原句本次未找到，未加入人工HARD输入。重评冻结f14117b790c18531691996af5de9a39e8fa8fccaa5678ece39ba3abeb9d3f18b，共2678项依赖与原始文件已核SHA；提交后仅本地运行两套18份评价，原评价不覆盖。0新增模型/网站/Live，账本2827/31/0保持；展示修复尚未合并，非Clean。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/c18-offline-reassessment-20261022/plan.md).

- **2026-10-22 Checkpoint C c18-evaluator32-merged:** C18离线重评已合入Evaluator32/rubric28及其独立复核6d758f70；五份并行文档冲突保留双方历史，Eval Skill同步到当前32契约。登记仍仅9个C18原始SHA/12配对，旧13条不变。下一步准备当前认证见证与保存HTML清单、提交冻结后进行31/32并列重评。尚未运行新评价或展示回放，0模型/网站/Live，账本2827/31/0不变；draft / not integrated，非Clean。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/c18-offline-reassessment-20261022/plan.md).

- **2026-10-22 Checkpoint C c18-correspondence:** C18离线重评准备：按独立复核5b470eaa登记9份原始SHA/12个条件配对，原13条登记不变，独立字面审计与加载器控制通过，H002交叉配对0。原18个result及旧评价保留；当前仍为Evaluator31，后续合入32并冻结本次见证/保存HTML输入。0新增模型、网站、Google、Live或环境重跑，累计账本2827模型/31正式Live/0正式环境重跑不变。draft / not integrated，非Clean Baseline。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/c18-offline-reassessment-20261022/plan.md).

- **2026-10-22 Checkpoint C continuation-results:** 当前C18正式18次完成（原8次保留，续跑c-09至c-18共10次）；冻结评测器@31/rubric@27：4 QUALIFIED_DELIVERY、1 CAPABILITY_MISS、1 HONEST_NO_RESULT、12 NOT_EVALUATED。退出条件1/3为NOT_EVALUATED，4为NOT_SATISFIED，5仅测量（交付中位224.642秒、最大341.062秒）；正式S0声明9 ABSENT/9未评价，越界18 ABSENT。续跑新增231模型调用/10正式Live；累计2827/4000模型、31/100正式Live、0/10正式环境重跑；原8次/178调用不重复计账。续跑冻结a6843af52023b2febdcb6fc5e5b576262c649fb82f1d686a7d59706b2c701e1e；558冻结输入、1044旧原始文件与2299总原始文件SHA核对通过。汇总审计0网络/模型，非Clean Baseline；已结束执行，提交推送后停下等独立复核。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/four-layer-report.md).

- **2026-10-21 Checkpoint C continuation-ready:** 用户要求继续剩余Live；只从c-09预检失败处额外进入1次，再原序c-10至c-18，不带--run-ids。旧8次正式样本/10条attempt原评价不动，神乐坂自动额度仍耗尽，S0继续立即停。仅替换过期c03恢复入口为当前c09证据绑定；31项离线控制通过，生产/外层主脚本/计划/评测器@31/rubric@27均未改，旧门禁与69/5/22结果复用。账本2596模型/21Live/0正式环境重跑，所有47来源SHA核对；截止仍10月22日20:23:38.769北京。先提交冻结后启动，未知条件与展示问题继续如实记录。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/plan.md).

- **2026-10-21 Checkpoint C live-stopped:** Live冻结598585fd（507文件）保持不变，评测器@31/rubric@27。见证重新认证6/6通过（15/16家有匹配库存）。C18于c-09预检失败后按同一用例重试已耗尽停批；8次完整Live：QD2、CAPABILITY_MISS1、NOT_EVALUATED5，另2次来源预检失败；c-10至c-18 NOT_REACHED。声明6 ABSENT/2未评、越界8 ABSENT（正式运行），不作零S0签收。模型178含8次TIMEOUT、Google28；累计2596/4000模型、21/100完整Live、0/10正式环境重跑，来源重试1单列。退出1/3/4未验收；四层报告与原始result/decisions保留，停止等待复核。 [Batch](../.eval-artifacts/checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/plan.md).

- **2026-10-21 Checkpoint C recertified:** Six-case recertification PASS,15/16 witnesses: H0012,H0023,H0033,H0052,Kagurazaka2,Kichijoji3.33GET all200,min gap30s,0model/Google/Live/retries. Komuro no matching19:30 retained; dates unchanged. Earliest2026-10-21T12:23:38.769Z,Live deadline2026-10-22T12:23:38.769Z. Original raw/capture freeze unchanged; completed-capture offline audit corrected whole-object equality for optional dow, preserving old failure/script and new497-file auditfreeze. Final Live freeze598585fd34b9b5877ba644cdfb5b6a20d4cf83a796de1219ae4f70a53dedeb7d (507files),evaluator31/rubric27. Budget2418models/13Live/0env; source and all18 order/rules unchanged. User preapproved original18 without --run-ids; launch next, no third quick run. [Batch](../.eval-artifacts/checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/plan.md).

- **2026-10-21 Checkpoint C merge-freeze:** Reviewed fix27b3884a fast-forwarded into prep; evaluator31/rubric27 bound with original18 order/budgets unchanged. Certification freeze a71b2e56d39ea24d939cf9b06cf21e9a5074e614da70c6ecae07034e1d5feeee (425 files), code b6d4abd3. Complete scripted outer rehearsal1/1,0network/0models; outer and certification controls green. Accepted source hashes unchanged; gates982/131,calendar69/69,selection5/5,calibration22/22 reused. Runtime ledger2418models/13Live/0env,remaining1582/87/10; reserves24 attempts/1200calls. User authorizes recertification then full18, no third quick run; old results and H003 S0 retained. [Batch](../.eval-artifacts/checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/plan.md).

- **2026-10-21 Evaluator32 offline PASS; calibration22/22, S0 declaration20/20 and quick3 reference reevaluation complete; awaiting review. Independent merchant course/category and narrowly reviewed witness HARD evidence now has separate accepted/unaccepted/unproven/missing-citation diagnostics. Five gates988/131 green; no product changes, no website/model/Live, not merged or applied to running checkpoint C.** [Report](../.eval-artifacts/evaluator-hard-course-evidence-20261021/report.md).

- **2026-10-21 Class-token review followup PASS on isolated display branch; reviewed base5110f6aa, full tokens for course cards/title/description/review/name, no JS dependency. Fixture covers reorder/extra/no-JS/prefix exclusion; related39/39, default987/987, local Chromium131/131, type/arch/build PASS. Prompt/Schema/State and qualification unchanged. Zero models/sites/Live; both accepted fixes await checkpoint-C completion before integration.** [Report](../.eval-artifacts/condition-display-evidence-20261021/class-token-followup/report.md).

- **2026-10-21 Condition display offline PASS, separate branch awaiting review. Five gates986/131; source replay3/3 retains four merchant-supported HARD MET states and makes Kaga NOT_CHECKED with actual NAME/REVIEW quotes. Lunch restrictions and requested-course-availability unknown retained. Codef097ab15, freeze740cdc8a (1352 files); State19/TaskDefinition17/condition-states3. Zero models/websites/Live; no evaluator merge or active C change.** [Report](../.eval-artifacts/condition-display-evidence-20261021/report.md).

- **2026-10-21 Offline criterion/presentation repair PASS; fix branch only, awaiting review:** Evaluator@31/rubric@27 associates conditions by explicit IDs or reviewed exact-artifact semantic indices; formatting normalization only, no executable synonym lookup. All eight existing-but-unmatched display rows now resolve (six consistent unknowns, two still independently unsupported). Kaga's later availability-read fact was filtered by an earlier same-source fact-check list; current Router/Reducer citations now retain it and reject omission. Condition-states@2 adds request-local criterionRef. Five gates green (982 default / 131 Chromium), calendar69/69 and selection5/5 from byte-identical requests and cached real responses, calibration22/22. Saved quick3 reference outcomes QD/QD/DU; original QD/NE/DU and quick gate1/3 retained. Code1bb92bca; freeze`003c8b69db188ae4d5091d88e8729905fd3d845eb664d22d7423f01ea706aca8` (1345 files). Zero new models/websites/Live; cumulative2418/13/0 environment reruns. No integration merge, recertification or fresh C18; no third quick run. [Four-layer report](../.eval-artifacts/checkpoint-c-live-20261020/criterion-presentation-20261021/four-layer-report.md), [result.json](../.eval-artifacts/checkpoint-c-live-20261020/criterion-presentation-20261021/result.json).

- **2026-10-21 Quick3 gate NOT PASSED; stopped for review:** Network-restored quick3 completed before old witness deadline: c01 QUALIFIED_DELIVERY(3 outlets,167.421s,18 calls); c02 NOT_EVALUATED(2,177.643s,16; hot pot versus hot-pot wording unresolved); c05 DELIVERED_UNQUALIFIED(2,259.302s,31; Kaga required HARD check evidence omitted from presentation citations). Gate1/3<2/3; declaration ABSENT1/NE2,boundary ABSENT3, no zero-S0 certification. Stop before recertification/fresh18.12 outlets:10 selected/captured,7 displayed inventories exactly match independent GET,5 uncovered.65 calls/12Google/3Live added; totals2418 models/13Live/0formal env reruns.587 frozen files unchanged; historical H003 S0 and old failures retained. Post-batch report supplement handles serialized URI root slash; original helper/evaluator/results unchanged. [Report](../.eval-artifacts/checkpoint-c-live-20261020/continuous-retry-20261021/four-layer-report.md), [result.json](../.eval-artifacts/checkpoint-c-live-20261020/continuous-retry-20261021/result.json).

- **2026-10-21 Network-restored c01 resume authorized:** User reports network repaired and explicitly resumes c01. Prior two source failures and consumed retry remain; one additional c01 entry is granted, then original c02/c05 and conditional recertification/C18. Code and inputs match a6fa26c;690 accepted hashes and32 ledger sources verified. Existing gates979/131,calendar69/69,selection5/5,calibration22/22 reused;0 new models/network at preparation. Cumulative2353 models/10 fullLive/0 formal env reruns. See continuous-retry-20261021/plan.md.

- **2026-10-21 已复核修复后的快速验证来源预检停批：** 快速验证在来源预检停止：c01两次TableCheck搜索GET无HTTP响应，唯一来源重试后18:41:01北京RETRY_EXHAUSTED；0正式Live/0模型，c02/c05及重新认证、新C18全部未到达。@30两次ENV_FAILURE/EXCLUDED，S0两项均未评（不写0 S0），旧H003 PRESENT保留。Google含预检4，间隔306.567秒；累计2353模型/10完整Live/0正式环境重跑，来源级重试1另列。运行前后576冻结SHA一致（9513895b…）；合并后五门禁979+131与20控制全绿，离线3例演练另报。用户要求的只读诊断确认固定CIDR漏当前DNS 52.68.109.188：TUN路径TLS失败，另一个当前DNS54.178.173.154走en0同URL返回200，应用浏览器显示653条；失败IP的en0作用域缺路由，同IP直连控制未派发，不夸大因果。生产/网络配置未改，结果、8个计划见证未到达表、四层报告和账本推送后停。 [四层报告](../.eval-artifacts/checkpoint-c-live-20261020/continuous-resume-20261021/four-layer-report.md)、[result.json](../.eval-artifacts/checkpoint-c-live-20261020/continuous-resume-20261021/result.json)。

- **2026-10-21 已批准 a6fa26c，检查点C连续验收恢复到合并冻结：** 修复快进集成a6fa26c，准备fd745b5保留双方历史；生产与复核代码完全一致，690项冻结全部核对不变。合并后五门禁979默认/131真实Chromium及type/arch/build全绿，外层20控制通过；复用已审核翻月69/69、选店5/5、校准22/22，无新增模型/网站/Live。当前累计2353模型/10完整Live/0环境重跑。按预先批准原外层选择c-01/c-02/c-05重新快速验证，逐家列查询确认/响应/时段/独立GET；门槛0S0且≥2合格。旧H003 S0和旧快速0/3保留；通过后才认证与C18。[阶段材料](../.eval-artifacts/checkpoint-c-live-20261020/continuous-resume-20261021/plan.md)。

- **历史阶段记录：2026-10-21 continuous validation step 1 PASS:** accepted review 481b893; unchanged frozen code/input verified (628 files); calendar69/69, selection5/5, calibration22/22, five gates977/129. No new model/network/Live; cumulative2143/4000 models,7/100 full Live,0/10 environment reruns. That historical merge/freeze step completed in prep; quick validation then stopped at 0/3. Current next gate is the Tabelog repair review below. Evidence: `.eval-artifacts/checkpoint-c-live-20261020/continuous-validation-20261021/step-1.json`.

- **2026-10-21 Checkpoint C step2 merged:** accepted fix8589b3b pushed to integration; prep merge92beed0 preserves both documentation histories. Production/skills/dependencies equal accepted source; frozen628 inputs unchanged. Existing outer/18-plan/Runner/evaluator30/rubric26 unchanged. Cumulative ledger2143 models/7 fullLive/0 env reruns now reconciles replay source SHAs. No new website/model/Live. Freeze receipt: `.eval-artifacts/checkpoint-c-live-20261020/continuous-validation-20261021/step-2-freeze-receipt.json`.

- **2026-10-21 Continuous checkpoint C at quick-Live entry:** step1/2 PASS and pushed; unchanged outer rehearsal complete,0 real models/network. Freeze b1175e307a68e021e0e7744eda750b488d36f72f84038cbfb3ed04224c8b2273. Existing outer cannot select H001/H002/Kagurazaka without changing outer or18-plan; user clarification requested, no Live started, steps3–5 NOT_REACHED. Ledger2143 models/7 Live/0 env reruns unchanged; historical H003 S0 remains PRESENT. [Four-layer report](../.eval-artifacts/checkpoint-c-live-20261020/continuous-validation-20261021/four-layer-report.md).

- **2026-10-21 Quick validation entry explicitly approved:** add --run-ids only for c-01/c-02/c-05, retain original plan/order/each-run behavior/spacing/stop/budget/evaluation. Twenty offline controls PASS; no production changes, existing five gates reused. Separate quick label and directory exclude these runs from checkpointC18. Commit/freeze then actual0-network three-run/default rehearsal before authorized quick Live. Model/Live ledger2143/7 unchanged.

- **2026-10-21 Quick3 frozen and ready:** Quick entry final verification PASS: original outer executed exactly c-01/c-02/c-05 in0-network/0-model mode, default rehearsal retained1 run and defaultLive18 unchanged;20 controls PASS. Final quick freeze5c4dd01e4d21afcc8a687066dbb1e2bd2cd8e8cfd683e404b26e9d292fbdd8f4,558 files verified. Cumulative2143 models/7 Live/0 env reruns;1857 model calls remain. Old witness window sufficient for quick3 before2026-10-21T12:26Z; user preapproval permits launch after push.

- **2026-10-21 Quick startup alignment:** Quick launch pre-run freeze check rejected changed documentation before authorization consumption, output directory or Runner start;0 models/sites/formalLive/env reruns. Rejection retained; refreeze final committed snapshot and verify all files before launch. Freeze record lives in continuous-validation-20261021/quick-final-freeze-receipt.json; do not mutate frozen documentation during quick batch.

- **2026-10-21 检查点C快速验证停止待复核：** 快速验证未通过，按门槛停止：H001/神乐坂 CAPABILITY_MISS，H002 HONEST_NO_RESULT；QUALIFIED_DELIVERY 0/3（要求≥2/3），交付均为0，两项S0各3/3 ABSENT。三次47模型共141，Google含预检12，累计2284/4000模型、10/100完整Live、0/10正式环境重跑。快速三次不计检查点C18，原五次及H003 S0保留；第4步认证与新18次均NOT_REACHED。 冻结225ca8b9…共559项运行前后一致，仅用户批准run-ids选择例外；原生产/计划/Runner/@30/@26不变。神乐坂Runner482.445秒、外层墙钟504.686秒及OUTER_DEADLINE标记明示，最终exit0/完整result，未改类重跑。三份原始result、决策/录制/独立复查、四层报告与账本提交推送后停下。[报告](../.eval-artifacts/checkpoint-c-live-20261020/continuous-validation-20261021/quick-four-layer-report.md)、[结果JSON](../.eval-artifacts/checkpoint-c-live-20261020/continuous-validation-20261021/quick-result.json)。

## 当前门槛

- **2026-10-21 Tabelog 改版离线补修验收通过（draft / not integrated）：** 撤去消失的js-钩子/必需隐藏字段，通用状态复用；同日期/人数/门店的最新find_vacancy与页面选择一致才接纳，补监听无尾斜杠路径。19旧失败快照选中确认0→17，2仍未确认；历史JSON全未捕获，19库存均UNKNOWN，不能重判Live。4条可比较来源时段均为事后GET的受支持子集（全集相等0/4）。同69点真实模型69/69、相同输入选店缓存重评5/5、校准22/22；五门禁979/979、Chromium131/131及type/arch/build全绿。冻结ebf1389/ca88fa6、690项SHA无变，离线冻结SHA `7f0c3026058901326a32f589fcf884d72ea6bad7c5050a1243430dbc89de5c7a`；新增69模型/0重试，累计2353/4000，0网站/Google/Live。私有class18处（7消失修复/11仍存在仅报告），URL捷径未实现、Prompt19/Context2与评测器30/rubric26不变。原快速验证0/3、H003 S0保留；后续步骤暂停等复核。[四层报告](../.eval-artifacts/checkpoint-c-live-20261020/tabelog-query-binding-20261021/four-layer-report.md)、[result.json](../.eval-artifacts/checkpoint-c-live-20261020/tabelog-query-binding-20261021/result.json)。

- **2026-10-21 检查点 C 第0步翻月决策回放完成／待选择方案：** 0网站／浏览器动作／Live，原五次69个明确Next尝试×四变体，276试次、277 API请求（含原thinking强制tool_choice的400）。原位置答案经保存DOM纠正：59个时间Next、10个人数Next，真实翻月为空标签链接；用户批准V3补全其语义。V0/V1/V2均0/69，V3为68/69；平均1.79/1.83/7.89/1.89秒，V2另有3次200无工具响应。V2 auto工具选择兼容经用户批准重冻，属于额外变量；缓存命中显著不均，不作同成本或纯thinking因果结论。原冻结434／兼容459文件及生产a3f6b84均未改，10项离线控制通过、五生产门禁复用。阶段1995/4000模型（含失败）、7完整Live、0正式环境重跑；原H003 S0与Live阻断保留。只报告并推准备分支，不采用变体、不进入后续1–5步。[四层报告](../.eval-artifacts/checkpoint-c-live-20261020/step0-calendar-replay-20261021/comparison/four-layer-report.md)、[逐点与成本JSON](../.eval-artifacts/checkpoint-c-live-20261020/step0-calendar-replay-20261021/comparison/comparison.json)。

- **2026-10-21 检查点 C 第五次后用户停止／待排查：** 神乐坂c-05完成299.901秒／47模型／5 Google，0交付、CAPABILITY_MISS；10:49:40北京按用户要求终止批次，c-06未启动。累计5/18正式、0合格、13 NOT_REACHED（3 CAPABILITY_MISS、2 HONEST_NO_RESULT），C235模型／22 Google；阶段7 Live／1718模型，正式环境重跑0。五次均在47调用的预留收尾窗口结束，43 UNKNOWN中18次请求条件未确认、5次浏览器超时，需从原始result／决策／录制离线排查，未确认唯一根因。源码及Runner／Guard／外层／评测器文件未改；本次仅运行时移除预约页GET例外，1447文件冻结停止后核对一致，83份保存HTML未检出预约表单，不是永久产品修复。原H003 S0仍PRESENT、退出3不满足；五门禁复用978/122及type／arch／build，其他退出缺分母未签收。原始5份result及SHA集中索引，只推准备分支后停止。[报告](../.eval-artifacts/checkpoint-c-live-20261020/guarded-continuation-20261021/report.md)、[原始结果索引](../.eval-artifacts/checkpoint-c-live-20261020/guarded-continuation-20261021/results-index.md)。

- **2026-10-21 检查点 C 用户补试后S0停批／待复核：** H005补试273.976秒／47模型完成，0交付、CAPABILITY_MISS；继续H003424.090秒／47模型、HONEST_NO_RESULT后，保存HTML独立确认已打开5张含客户字段与`new_reservation`的预约表单，违反用户禁令，09:51:48北京立即终止本批，c-05及以后未启动。原@30越界未评不覆盖，独立S0_BOUNDARY PRESENT单列，未记录填客户信息／点时段／提交预约；退出3明确NOT_SATISFIED。合计4/18正式完成、0合格、14 NOT_REACHED；本轮94模型，C累计188、第二阶段1671/4000，正式Live6/100。恢复冻结10202ba3…共942文件停止后核对一致，生产／输入／见证未改；本次用户显式补试不清除历史自动额度。只交付反例／四层报告并推准备分支，修复和复核前不恢复Live。[报告](../.eval-artifacts/checkpoint-c-live-20261020/resume-20261021/report.md)。

- **2026-10-21 检查点 C Live 因环境重试耗尽停批／待复核：** 批准冻结7caa315a…在523文件运行前后核对一致，生产未变。4次尝试中2次正式Live完成（H001 CAPABILITY_MISS、H002 HONEST_NO_RESULT，0合格交付）；H005两次TableCheck搜索文档GET无HTTP状态而ENV_FAILURE，间隔303.812秒，唯一重试后00:26:04北京停批。正式未到达16/18（含c-03预检失败，另15个位置未尝试）；模型94、Google含预检11、外层预检重试1／正式环境重跑0。正式S0声明／越界各2 ABSENT，排除尝试各2未评；退出1/3/4/5均未签收。累计正式Live4/100、模型1577/4000，H005重试额度已耗尽；只推送准备分支结果后停止待复核。[四层报告](../.eval-artifacts/checkpoint-c-live-20261020/execution-20261020/report.md)。此前准备／待批准条目作为历史保留。

- **2026-10-20 检查点 C 见证认证完成／待最终SHA批准：** 原6条完整证据未重采，18个新GET全200、0重试／模型／Live。六例认证2/2、3/3、3/3、2/2、2/3、3/3；Komuro指定时刻未匹配，Fukumimi原句变化及当前菜系人工依据单列。最早观察10/20 20:26:41.866北京，Live须10/21同一时刻前跑完；六例时效门禁和额度检查通过，最终冻结后仅推送准备分支，等外部复核与用户批准，不启动Live。[报告](../.eval-artifacts/checkpoint-c-live-20261020/witness-completion-20261020/report.md)。

- **2026-10-20 检查点 C 网络恢复后续采准备：** 保留已有6家完整见证，Meibutsuya与H005 Iwai只查库存，正常18个只读GET；8项认证控制、外层14控制及typecheck／arch／build通过，生产未变复用978/122门禁。先提交冻结后采集，0模型／Live；完成后需形成新登记与最终Live SHA，推送停下待批准。[计划](../.eval-artifacts/checkpoint-c-live-20261020/witness-completion-20261020/plan.md)。

- **2026-10-20 检查点 C 恢复认证再次停止：** 按用户新规则保留原3家、补齐Matsumoto HARD与H002第三家；H003第二家库存先超时，等120.002秒原样重试仍fetch failed，21:24:41北京停止。当前来源支持H001 2/2、H002 3/3、H003 1/3，其余未到达；最早见证20:26:41北京，24h截止10月21日20:26:41。8次新请求、0模型/Google/整单Live；认证未完成，无最终Live冻结SHA。仅封存中断材料后推送停下。[报告](../.eval-artifacts/checkpoint-c-live-20261020/witness-resume-20261020/report.md)。

- **2026-10-20 检查点 C 见证认证中断：** 用户批准0模型只读认证；10次请求尝试、9个200、1次H002第三家fetch failed，无HTTP状态，按冻结规则停止且未追加请求。H001完整来源支持1/2（库存2家匹配，1家HARD原始句不足）、H002支持2/3（库存2家匹配），其余4例未到达；认证未完成，无最终Live冻结SHA。停止后仅离线修正实体quote摘录，红→绿4/4；原记录不改。0模型/Google/整单Live，日期不变，推送中断材料后停下。[报告](../.eval-artifacts/checkpoint-c-live-20261020/witness-certification-20261020/report.md)。

- **2026-10-20 检查点 C 复核收尾（离线）：** 已合入a3f6b84并保留双方历史；五门禁978/978、Chromium122/122通过。TableCheck已审核请求可独立原样复查；未评价继续、S0 PRESENT立即停批，原始库存响应路径/SHA保留。阶段账本2次Live/469模型/0正式环境重跑，含1014历史模型保守扣账1483；剩余模型2517。最终冻结1d40f62、364文件，14项外层与1项真实浏览器控制绿，完整脚本化演练0外站/模型通过；认证与Live未运行，推送准备分支后等批准。[报告](../.eval-artifacts/checkpoint-c-live-20261020/review-followup/report.md)。

- **2026-10-20 检查点 C 离线运行准备：** 独立准备分支完成六例×三次交错顺序、500秒/50模型/40Google、S0停批/有限重跑、24h见证认证与四层报告脚本；完整 Runner 脚本化传输演练通过，0外站/真实模型/Live/认证。五门禁978/978、Chromium122/122及外层8/8通过；@30/rubric@26复用。同步fe9b3fc仅证据变更，生产与输入不变；推送准备分支后等复核。TableCheck独立运行后复查缺证仍停批未评。[交付报告](../.eval-artifacts/checkpoint-c-live-20261020/report.md)。

- **2026-10-21 通用选中状态与人数确认离线门槛通过（draft / not integrated）：** 54ac940复核后补ARIA/精确状态class、真实DOM组当前选中值，保留已选控件证据并禁止重复动作；人数点击必须回读同组唯一值等于请求，未确认不能完成。Browser Prompt19/Context2，wire11及Restaurant Context15/Prompt27、skills/thinking、reserve禁令不变。引用/观察编号逐点一致；同69点69/69（要求≥68），原15问题点15/15；选店5/5、直接页13/13；校准22/22（S0声明20/20、越界13份缺口保留）；五门禁默认977/977、Chromium129/129及type/arch/build全绿。冻结8e47ddf/628项SHA不变；74模型、0重试，阶段2143/4000，剩1857；0网站/Google/Live。原54/69与历史H003 S0保留，URL捷径未实现。推独立修复分支后停止等复核。[四层报告](../.eval-artifacts/checkpoint-c-live-20261020/calendar-selected-state-20261021/four-layer-report.md)、[result.json](../.eval-artifacts/checkpoint-c-live-20261020/calendar-selected-state-20261021/result.json)。

- **2026-10-21 日历V3生产修复未通过验收（draft / not integrated）：** 独立`codex/fix-calendar-next-month`基于远端a3f6b84，仅采用复核6d92882的V3；Browser Prompt18／首次Browser Context1，Restaurant Context15/Prompt27与action wire11不变。公开DOM控件组/月标题/空链接文字补齐，翻月未变反馈NO_CHANGE；TableCheck reserve及子路径永久拒绝，H003接收器零到达。五门禁默认977/977、Chromium126/126及type/arch/build全绿；22校准22/22、选店5/5（直接页13/13），但翻月54/69低于≥68，15点改选人数，**总体NOT_ACCEPTED**。静态重建69个目标集合、64份可见文本与第0步不同，不作严格单变量因果比较，不改评分。冻结b7f56b6、625项SHA运行后原样验证；74模型/0重试，阶段2069/4000，剩1931；0网站/Google/Live。Tabelog历史URL初始化日期/人数仅报告未实现；旧H003 S0保留。推独立分支后停止等复核。[四层报告](../.eval-artifacts/checkpoint-c-live-20261020/calendar-next-month-20261021/four-layer-report.md)、[result.json](../.eval-artifacts/checkpoint-c-live-20261020/calendar-next-month-20261021/result.json)。

- **2026-10-20 Context15选店回放与Tabelog方法A完成：**5条独立标注种子全ACCEPTABLE、13/13直接门店页。Gold30家各认证一次、最终29VERIFIED/1DROPPED；方法A34/34完成，Gold12/29正确、15未找到、2不确定、0找错；对照2待复核/3不确定，不计分。模型35+回放5=40，Google/完整Live/方法B新增0。评测身份停止有效红→绿，五门禁972/972+121/121；321旧/390新SHA及66历史输入不变。网络审计64组仍缺会话/完整请求证据，不作总体S0认证。冻结1b4cfda在原8ecfcfc生产基础运行，平行P2-1c合入前结束。运行后仅为发布保留远端State18/P2-1c并行提交；合并后五门禁978/978+122/122通过，未重跑模型或源站。等待独立复核。[选店报告](../.eval-artifacts/checkpoint-c-integration-20261020/selection-recheck/report.md)、[名称基准](../.eval-artifacts/name-resolution-benchmark-20261019/live-20261020/report.md)。

- **2026-10-20 P2-1c五次真实发现探测验收通过：** 神乐坂2/2进入A1309/A130905，中目黑2/2进入A1317/A131701；h001单次保持TL4/TC5及见证首批。五例均无失败码/READ_BUDGET_EXCEEDED，20模型均成功，23 Google（含5预检）；发现账本累计347/450模型、59/60探测、171 Google。仅存储额度经用户批准60→65MB，其他预算与生产源码不变；0重试/完整Live/外写，原见证未续期。录制manifest仍NOT_REPLAYABLE，非完整任务签收。[报告](../.eval-artifacts/p2-1c-region-20261020/live-probes/report.md)。推送后等复核。

- **2026-10-20 P2-1c 合入 Checkpoint C，离线验收完成：** 以8ecfcfc为基线合入已复核ddfdedd，源码/配置冻结d6d989b；State@18／TaskDefinition@16，保留价格/条件状态与地区提前读取，Browser Prompt@17。五门禁PASS：默认978/978、本地Chromium122/122，type/arch/build通过；原22份校准结果类型22/22、S0声明20/20。真实网站/模型/探测/Live均0。 后续5次探测等待用户通知；见证最早2026-10-21 10:47北京过期，不续期。[本轮报告](../.eval-artifacts/checkpoint-c-p21c-integration-20261020/report.md)。

- **2026-10-20 Checkpoint C offline integration ready for review:** `codex/integration-checkpoint-c` combines P2-2/P2-3 at5309545, Context@15/Prompt@27/State@17. Five gates972/972 and Chromium121/121 pass; original22 calibration22/22 and S0 declarations20/20 preserved. Both branches retain all tests. No website/model/probe/Live; benchmark item4 deferred. Includes concurrent review305d1e0 verbatim; product code remains5309545. Independent branch only; no source/main merge. [Integration report](../.eval-artifacts/checkpoint-c-integration-20261020/report.md).

- **2026-10-20 第七次恢复后修正B十次发现探测全部完成：** 精确恢复中目黑后，按原序完成吉祥寺两次和KF-H005第二次，保留原六项，修正B10/10。新增4正式探测、18模型、12 Google；累计327/450模型、54/55探测、148 Google、0完整Live。无新环境失败/自动重试。整体Tabelog首批A5→B5，H002为0→1、其余9例5→4；来源预算超限A2→B3，等待独立复核。

- **2026-10-20 按用户要求恢复第七次中目黑发现探测：** 用户要求“继续第七次”，精确恢复此前0模型、未正式启动的中目黑index9；已超过15分钟，保留既有6项完成结果和历史失败计数6。只重冻外层准入，20项新离线对照通过，原浏览器来源就绪与5分钟间隔/403、503、繁忙页15分钟单次重试规则不变；不新增自动429重试。仍309模型/50探测/136 Google，待执行。

- **2026-10-20 新外层H002完成，中目黑Tabelog429预检停批：** 浏览器来源就绪外层31866be续跑：H002完成，B累计6/10；中目黑预检Tabelog429，0模型/正式探测，TableCheck仍200/122条。该响应未命中冻结403/503或繁忙页原文重试条件，来源就绪失败停批；余中目黑、吉祥寺两次、KF-H005第二次未正式跑。累计309/450模型、50/55探测、136 Google、0完整Live。已完成5项原样保留，等待复核。

- **2026-10-20 修正B按浏览器来源就绪检查重冻续跑五项：** 用户批准仅改外层：TableCheck就绪只看真实浏览器搜索非空，保留其他来源网络预检。五项按H002→中目黑→吉祥寺两次→KF-H005第二次续跑；已完成5项不重跑，正常间隔至少5分钟，403/503或繁忙页暂停15分钟后仅重试1次，仍失败停批。生产a37e152、输入/见证/指标不变，仍305模型/49探测/133 Google，未启动完整Live。

- **2026-10-20 修正B续跑完成5/10，TableCheck503按冻结规则停批：** 网络修复后续跑新增4次正式发现、23模型及12 Google，修正B累计5/10；KF-H005第二次在首页预检TableCheck503，0模型/搜索/正式探测，历史计数4→5触发PREFLIGHT_FAILURE_LIMIT。累计305/450模型、49/55探测、133 Google、0完整Live。余5项及H002未到达；记录两次READ_BUDGET_EXCEEDED，不作整体通过或因果改善结论；停止后提交推送，等待复核。

- **2026-10-20 网络修复后按用户要求续跑B剩余九次：** 用户在网络修复后要求继续B；新恢复仅准入未完成index1并顺序执行剩余九项，index0不重跑，历史失败4及全部调用账本保留。408项SHA与28离线对照冻结，源五门禁复用；准备阶段仍282/450模型、45/55探测、121Google，Runner逐例预检通过才启动发现。

- **2026-10-20 修正B十分钟补试仍403，保留1/10并结束重试：** 十分钟补试UTC03:07仍为TableCheck首页403，0新增模型/Google/探测；B保留1/10，首例不重跑，余9项NOT_REACHED。累计282/450模型、45/55探测、121Google；按用户最新指令结束重试，心跳暂停，正常推送已完成证据后待复核。

- **2026-10-20 修正B完成首例，403停批后获准十分钟再试：** 修正B已完成h001首例（4模型/2正式Google），第二例TableCheck首页403停于模型前；累计282/450模型、45/55探测、121Google。用户批准十分钟后仅补试未启动的index1，预检通过继续剩余顺序；首例不重跑、历史计数4保留，外层24离线对照通过，等待UTC03:05:44。

- **2026-10-20 TableCheck三组只读对照均成功，历史失败原因未确认：** 同一TableCheck URL三组只读均成功：原生产预检HTTP200/122条命中；有Guard和普通Chromium都显示20卡片。未复现此前失败，历史根因未确认，不修改生产或旧产物；B与Google失败复测未启动。

- **2026-10-20 10月20日网络可达，来源非空预检仍阻断B：** 10/20重试网络通过，Tabelog来源20家；TC搜索无有效响应、Google文本读取失败，PREFLIGHT_EVIDENCE_GAP停批。B0/10、0新增模型、Google尝试1次；累计278模型/44探测/118Google。

- **2026-10-20 P2-1c离线地区入口：从P2-2 7dfeb69分支，依305d1e0复核选择同源门店URL证据；不加地名/代码表，站点包净增0。54条旧轨迹分层记录，神乐坂旧菜单4条缺入口观察不计成功；六例受控Chromium走通。State17/TaskDefinition15、Browser Prompt17；真实网站/模型/探测均0，五门禁与最终证据见报告，推送后等复核。** [报告](../.eval-artifacts/p2-1c-region-20261020/report.md)。

- **2026-10-20 P2-2 店名解析样本冻结待复核：** 样本/离线接线冻结1624aa3，SHA89ce49a49e428e84c5a4caed8831bf8ca98d1c06566d384879f8ce42992d0f87；30TL/2TC/10对照，TC缺口保留。五门禁type/arch/build PASS、默认967/967、本地Chromium121/121（283348ms），5项指标/泄漏/禁止日期控制通过，66份原输入及配置SHA不变。真实模型/网站/预检均0，方法B未启用；推送后停下等样本批准，第4项仍须批准与网络就绪。见基准report.md。

- **2026-10-20 P2-2 店名解析基准离线准备：** 按主分支指令完成待审样本42条（30 Tabelog/2 TableCheck/10无Gold对照），来源66份原产物SHA可追溯，TableCheck少8家明示。样本SHA89ce49a49e428e84c5a4caed8831bf8ca98d1c06566d384879f8ce42992d0f87。src/eval接生产名称/身份前缀、独立ID指标/S0停批及去官网/Gold边界，生产代码和既有Gold不变；方法B条件未满足不启用。默认967/967及离线控制通过；Chromium门禁完成后另记。0真实模型/网站/预检，新增预算A150/B条件100未使用。报告：.eval-artifacts/name-resolution-benchmark-20261019/report.md；推送后等待样本独立批准，不跑第4项。

- **2026-10-20 P2-2 网站字段离线测量：** 脚本冻结cf11c54后仅读取52份旧产物及30份trace并核SHA；32份有Google候选，20份无观察不计成功空结果。每run首见去重共1191次候选出现：158直达、927网站字段待查（77.8%）、106无网站；跨run253个ID中198待查（78.3%）。不等于已证实官网或预约出链率，检查点C未评。字面计数/去重/冲突/脏URL/SHA控制通过；0外站/模型，不接线抓取器，复用第4段生产门禁。

- **2026-10-20 P2-2 耗时与节奏方案：** 沿用52份旧产物（50可计时/2未评），汇总前三段为VENUE_SEARCH详情、Browser模型、查位解析；保留校准与仅发现分组，给出三个未实测节省区间/风险及同来源最小请求间隔方案。只写方案，0外站/模型、未实施、不变预算或门槛。报告：.eval-artifacts/p2-2-selection-20261019/followup/performance-proposals.md；纯文档核对原始汇总/算术/链接，复用第4段门禁。

- **2026-10-20 P2-2地区修复离线验证：** 独立分支已变基主线8b70084（含a37e152）且保留发布历史；阻止已访问父入口别名循环，权威LOCATION结果更新后替换旧入口绑定。真实片段负例与合成可行恢复通过；不改ADR-0040/Gold/预算，不访问网站，不增加模型。五种子回放PASS仍为独立历史证据，真实神乐坂正确路线NOT_COVERED。

- **2026-10-19 用户批准再试一次，TableCheck503仍阻断B：** 按用户再试一次的授权执行，22:54 TableCheck再503，0模型；未达到来源非空检查，B0/10仍被阻断。历史失败累计4保留，本次结束后不自动重试。

- **2026-10-19 B立即续跑再次遇TableCheck503，累计3次预检失败停批：** B首例续跑在22:40网络预检再次TC503，来源非空检查尚未到达；累计预检失败3停批。新增模型/搜索/正式探测均0，B仍0/10，278模型/44探测/117Google不变。

- **2026-10-19 按用户要求续跑修正B，保持原失败计数：** 用户要求立即继续B；独立续跑入口2f088b8及24项离线对照通过，生产和输入不变，保留两次503计数。Runner来源非空预检通过后才启动发现。

- **2026-10-19 20分钟后独立网络预检通过，保留原B停批：** 用户指定20分钟后的一次网络预检通过（TC206、Tabelog/DeepSeek200）；0模型/搜索/正式探测，原B两次503停批不变，B0/10仍待复核安排。

- **2026-10-19 修正检查点B保留停批，按用户要求20分钟后仅补一次预检：** 修正B两次TableCheck503后停批；用户批准20分钟后补一次0模型网络预检，UTC13:29:14前不访问，保留原stop与失败记录，不自动恢复正式探测。

- **2026-10-19 P2-1b 修正B按两次503停批：** P2-1b修正a37e152五门禁951/119通过，批准恢复ae9288e后两次TableCheck503（间隔627.529秒）按规则停批；新B0/10、0模型/Google搜索，十行NOT_REACHED。累计278/450模型、44/55探测、117Google；报告和原始证据提交推送后待复核。

- **2026-10-19 P2-1b 启动恢复获批重冻：** P2-1b 启动前0调用恢复获用户批准，17＋10离线对照全绿，审核文件部署及新SHA绑定完成；生产a37e152不变，重冻后继续B10仅发现。

- **2026-10-19 P2-1b 新B在预检前准备中断：** P2-1b 三项修正a37e152五门禁全绿；新B预检前因漏部署冻结文件中断，0网络/模型/正式探测。原SHA文件已补齐，10项恢复准入测试通过；按Eval§5待批准补丁重冻后继续，仍278模型/44探测。

- **2026-10-19 P2-1b 修正检查点冻结：** P2-1b 修正生产a37e152与新外层冻结；17离线对照＋6输入解析通过，检查点内预检计数、503十分钟后一次重试。待新B十次仅发现，旧B第一版排除；仍278/450模型、44/55探测。

- **2026-10-19 P2-1b 三项修正离线完成：** P2-1b 三项修正离线通过五门禁（951/119）；Schema@2/Prompt@5，TableCheck筛选跳过且不扩权限。旧B第一版排除；待新冻结后十次仅发现探测，预算278模型/44探测，完整Live未启动。

- **2026-10-19 P2-2结构约束真实模型回放达到门槛：冻结1646667，五颗各一次均可接受；神乐坂1/1、涩谷3/3、0133不退步，0134旧严格对照亦通过。新增5调用、累计10/30，0网站/Google/动作/Live；不额外重跑，历史见证未选中，非库存或端到端验收，继续已批准地区/测量工作。** [后续报告](../.eval-artifacts/p2-2-selection-20261019/followup/report.md)。

- **2026-10-19 P2-2 Tabelog繁忙页离线修复完成：Pack识别固定访问集中提示，原预算内等1秒后最多重试1次，仍繁忙为UNKNOWN/SOURCE_BUSY（ENVIRONMENT），不再冒充身份不确定；Google门店链接规范同ID英文页。保存的3次运行6份同形HTML红绿、恢复/真实冲突/期限控制通过；五门禁957/957与Chromium120/120。0真实调用，当前网站未验。** [后续报告](../.eval-artifacts/p2-2-selection-20261019/followup/report.md)。

- **2026-10-19 P2-2首次查位结构约束离线通过：Context@14/Prompt@27与Validator同一scope，>=3未查且半径内直达时暂不提供名称解析候选；事实/显式刷新/资格不变。有效旧scope红灯、默认953/953及Chromium119/119全绿，0真实调用；本轮五种子回放留第3段。** [后续报告](../.eval-artifacts/p2-2-selection-20261019/followup/report.md)。

- **2026-10-19 P2-2 独立分支：代码与诊断完成，选店验收未过。** Context@13/Prompt@26 暴露来源推导的 availabilityPath，候选顺序/资格/预算不改；52份旧产物离线计时（50有时间、2中断未评），30份地区轨迹只诊断。用户批准复核标注revision2后，五颗种子各一次DeepSeek，5/30调用、0网站/Google/动作执行；0133通过，神乐坂失败，涩谷1/3，整体门槛FAIL，0134因非法retrievalHint零执行，旧严格规则同输出对照保留。五门禁952/952与Chromium119/119通过；不把门禁绿替代模型验收，不进入Live/检查点C。见[报告](../.eval-artifacts/p2-2-selection-20261019/report.md)。

- **2026-10-19 P2-3 独立分支离线验收：** 价格事实、±20%已批准配置、代码派生逐条条件状态与英文展示已接线；Evaluator@30/rubric@26独立重读原始价格片段。22份旧产物与Gold不改，结果22/22、正常S0声明20/20一致；2份中断保留未评，边界9份已评无违规／13份缺证，不合并宣称S0=0。默认953/953通过，浏览器119/119通过。Aloft新公开介绍页及用户所给完整菜单文本已留证，3300为须搭配BBQ的附加项；生产Guard直接访问reserve页被拒，未放宽准入。仅一份介绍页只读采集＋一次网页文本读取，0模型/Google/完整Live。报告[见此](../.eval-artifacts/p2-3-conditions-20261019/report.md)。

- **2026-10-19 检查点 B 按预检阈值停批：** B按503预检阈值停批，完成3/10、17模型/9Google，累计278/450模型、44/52探测；无越界记录，余7/H002未到达，代码五门禁948/119，待复核。

- **2026-10-19 检查点 B 冻结：** B生产4975f9f/干净树，315SHA、13外层对照、6输入离线解析通过；261模型/41探测起计，上限450/52，见证有效，待执行发现B10。

- **2026-10-19 P2-1b 搜索空位线索离线完成：** P2-1b 搜索筛选及一次回退，严格查询/Recorder/独立审计同步；五门禁948/948与119/119，L0/L1，来源代码净增54行已披露，B待冻结。

- **2026-10-19 H002 HARD 检索边界修正：** H002 关键词限制正向 HARD，实际组合红绿确认 Nearby/0共享规划，五门禁946/946与117/117；ADR追加/Prompt@4，P2-1b和B待实施。

- **2026-10-19 P2-1a新A10完成／批准的外层恢复已验证：** 已批准外层b0d15d3恢复成功，原503计1次NO_RESPONSE、仅1次预检补试；原五例262文件/旧attempt不变，无正式重跑。新A10/10完成，49模型/29Google；累计261/450模型、41/42探测、108Google。Tabelog首批3→5/10，TableCheck仍0，神乐坂2次READ_BUDGET_EXCEEDED及H002候选减少如实保留。完整报告/逐源对照/原始SHA已核验，13外层对照和源五门禁通过；按授权推送后停止待复核，不开始P2-1b。

- **2026-10-19 P2-1a外层503恢复已批准并重新冻结：** 用户已批准仅外层503归类/一次预检补试；13/13离线对照通过，0新增真实调用。新外层SHA60546a05…、恢复冻结595份SHA（含原五例262文件），生产ba20b8a/输入/见证/预算不变，已完成五例禁止重跑。累计241/450模型、36/42探测、94Google；提交冻结后仅续跑剩余五次发现，停止条件不变，不开始P2-1b。

- **2026-10-19 P2-1a新A完成5例后在早期TableCheck503预检暂停：** 新A5/10正式完成，29模型/15Google；h001两次类别扩展后见证进入首批，神乐坂问题仍在。第6例正式启动前TableCheck首页GET503（0模型）使外层误记PREFLIGHT_EVIDENCE_GAP停批，剩5例未跑。原始503证据、部分比较和仅外层恢复提案已保存；按Eval Skill §5等待重冻批准，不改变原冻结或盲重试。累计241/450模型、36/42探测、94Google；源码五门禁仍绿，P2-1b/完整Live未开始。

- **2026-10-19 P2-1a离线回放达门槛／新A已冻结：** 14条真实模型单步反事实回放全部成功，h001/吉祥寺/中目黑均选相关类别，3例达到2例门槛；KF-H005词义循环效果未证明。累计212/450模型、31/42探测、79Google。新A冻结ba20b8a、干净p21-checkpoint-a-dom及318SHA；同输入/见证/基线，六例空跑与停止规则验证通过，准备10次仅发现探测，P2-1b/完整Live不启动。

- **2026-10-19 P2-1a DOM类别与重复表达式修正：** P2-1a取消检索类别的CSS门槛并拒绝重复表达式，Prompt@3/Schema@1；五门禁943/943、Chromium117/117通过。DOM实际计数5/9/9/0与复核数字差异明示；原A10 Google trace已有关键词，未伪造旧版缺陷。当前0新增真实调用，累计198/450模型、31/42探测、79Google；先冻结14条单步反事实回放，达到两个指定用例相关类别门槛才跑A10。

- **2026-10-19 P2-1 A后Google-only nearby修正：** A10完成并提交52ff459之后才实施Google-only nearby局部修正：地点规划输入不把nearby当成地点名，已规划Google Text Search复用现有去除nearby的area值。命名地点、权威坐标／半径、HARD和交付规则均不变；未修改P2-1a冻结工作树、Prompt、Schema或Gold。 生产createLiveReadAssembly入口＋脚本模型＋受控Google传输先红后绿：带来源／观察时间的有效坐标Fixture中，旧版location=nearby／local food nearby，新版空地点／local food；命名地点对照和坐标约束、intent不变通过，意外浏览器访问被测试拒绝。最终有效红灯nearby/red-typed-fixture.log，绿灯green-typed-fixture.log。原始缺失类型标注及两个依赖nearby字面量的旧组合失败日志保留；仅将h003/h005 SYNTHETIC_CONTROL检索匹配元数据改为通用restaurant，不改任何来源事实或Gold，既有五案组合恢复通过。 最终五门禁typecheck/arch/build通过、默认943/943、真实Chromium117/117，日志nearby/gates/。本项0真实模型／Google／来源／探测／整单Live；总量保持198/450模型、31/42探测、79Google。证明仅L0/L1受控组合，真实A仍用209ac42，效果和限制见A报告；不开始P2-1b或完整Live。按用户授权推送后停止待独立复核，推送以Git回执为准。

- **2026-10-19 P2-1修正A10完成／结果待复核：** 修正A10在干净209ac42全部完成，外层ee6ebd0／315冻结SHA通过；10次来源非空预检READY，0补试／0正式重跑／0计数失败，正式trace独立S0_BOUNDARY全ABSENT（不推断未知GET无副作用）。新增53模型／53成功决策、19正式Google＋10预检Google；累计198/450模型、31/42探测、79Google、0整单Live。 与acfaaffa同序输入的10次基线比较：Tabelog列表见证1→8／首批0→3；TableCheck列表与首批均0→0；Google精确官网ID5→3（名称线索不计）。列表含宽地区导航，不能当最终改写成功；页面内14次规划类别仍全0，本地提取7个原始锚点与Chromium机制绿灯不能证明真实页面类别扩展有效。总模型55→53，总时长788353→1062253ms；24规划调用52395ms、0超时。两项READ_BUDGET_EXCEEDED及CONTROL候选减少按原记录报告，不归因为某项修复。 逐例比较、来源序列、实际接受历史、页数、半径、规划时间、capture／trace／recording SHA及四层评价限制见checkpoint-a-corrected-20261019/report.md、comparison.json、audit.json。807份历史文件字节不变，旧A1缺陷版本不参与比较且用量保留；录制状态不冒称Replay。源码不变复用五门禁942/942、真实Chromium117/117，另验纯文档链接、JSON、diff与预算。A后只做独立Google-only nearby局部修复，不开始P2-1b／完整Live。

- **2026-10-19 P2-1修正A已冻结／准备执行：** 修正后的检查点A冻结为209ac4200a1330e0ed8e1bdcbd03dd30faac0a23，使用新的干净管理工作树p21-checkpoint-a-corrected。基线acfaaffa、10项顺序和6份输入／见证／独立审核规则同字节；仅评测预检时限与诊断按用户批准修正。已核验未过期见证（最早10/20东京12:12）和基线TARGET原生见证命中0/4，未触发基线停止条件。 外层及315份源码／配置SHA冻结于checkpoint-a-corrected-20261019/freeze.json；真实模型前先提交。来源预检每次先行，只有具状态或超时证据的NO_RESPONSE／EMPTY_RESULT计停止，历史3次按复核排除；缺证仍阻止启动。每项最多1次预检专用补试，正式探测不重跑，S0即时停止。语法／停止及补试正反例、六例Runner离线空跑均通过，0网络/模型；复用修正源码五门禁942/942、Chromium117/117。 累计起点145/450模型、21/42探测、50Google；本轮A10每次15模型/180秒，仅发现、不查位、不交付。Google-only nearby在A后单独提交，P2-1b及完整Live不启动。

- **2026-10-19 P2-1a首页类别与规划修正通过：** 补齐Pack已识别的同地区首页类别：Pack从实际锚点提取本地区类别，执行器通过Pack地区绑定与当前可见LINK核对，继续拒绝隐藏、异地区与全国入口。未增加网络权限或资格放宽。Planner Prompt@2明确改写保留候选、少于5家优先相关类别、KEEP只用于列表足够；Schema@1不变。 A1原样7个类别锚点（snapshot5）旧Pack为0、新版大于0；生产组装的真实Chromium组合先红后绿，先改写再读取5家详情，原隐藏／异地区拒绝与候选保留覆盖仍通过。片段没有CSS，不当作原网站Replay；可见性由本地控件与新A来源另验。红灯red-pack.log/red-unit.log/red-composition.log，绿灯green-unit.log/green-composition.log；五门禁typecheck/arch/build通过、默认942/942、真实Chromium117/117，日志checkpoint-a-corrected-20261019/retrieval/gates/。 本项0真实模型/Google/网站/探测/完整Live；累计145/450模型、21/42探测、50Google。基线acfaaffa不变，旧A1不计比较但用量保留。下一步新干净工作树从头A10；Google-only nearby留A后单独提交，P2-1b不开始。

- **2026-10-19 P2-1 预检修复通过／A待重冻：** 预检先调用 prepareNavigation，再以正式首批相同的35秒导航／单请求预算读取；不再把未收到搜索响应记为空结果，artifact@2分别保存 EMPTY_RESULT 与 NO_RESPONSE、HTTP状态、超时与Guard诊断。只有带状态或超时证据的失败进入停止计数；其余缺证失败仍阻止启动，留作预检诊断。真实Chromium的6.5秒响应在旧代码下 EMPTY_RESULT/count0（red.log），修后返回1家/HTTP200（green.log）；既有空200、503无响应、无状态缺证及超时反例通过。五门禁typecheck/arch/build通过、默认941/941、完整真实Chromium117/117，日志见 checkpoint-a-corrected-20261019/preflight/gates/。按aaeb088复核及用户指令，旧3次失败追加标注为“预检缺陷，原因未完全确认”，停止计数归0；旧A #1标为“P2-1a缺陷版本”并排除比较，原始字节与旧账本不改，4模型/1正式探测仍计费。探测上限42、模型450，累计145模型/21探测/50Google；本项0模型/真实网络/探测/完整Live。基线acfaaffa不变，接下来只修首页类别与规划提示，再重冻A；nearby留A后，P2-1b不开始。

- **2026-10-19 P2-1 预检查因／机制已复现、历史根因未定：** 用户要求查清TableCheck预检原因；新增3次0模型公开只读页面诊断，带回调/去回调/实际生产预检均HTTP200、122条document hits，真实预检5308ms，未复现历史失败或403。确认程序缺陷：source preflight只设page.goto30秒，未prepareNavigation，Guard仍默认5秒；本地真实Chromium6.5秒响应在默认路径READ_TIMEOUT、显式10秒预算则200。确认无响应与明确空结果都归EMPTY_RESULT且不存HTTP/Guard详情。历史两次根因因缺证仍未确认，不把5秒机制或VPN追认成事实。 [诊断报告](../.eval-artifacts/p2-1-discovery-20261016/preflight-diagnosis-20261019/report.md)。生产未修复，0新增模型/Google/正式探测，A仍停批，累计145/450模型、50Google、21/40探测；不自动恢复A或开始nearby/P2-1b。

- **2026-10-19 P2-1 检查点A停批／1 of10完成：** 检查点A按用户停止规则停批：仅H001第1轮正式完成，H001第2轮两次TableCheck非空预检EMPTY_RESULT，均0模型/未正式启动；连同恢复基线1次累计3＞2，剩余9次A不再启动。A新增4模型/4决策（全成功）、2正式＋3预检Google=5；累计21/40探测、145/450模型、50Google，0完整Live。 [部分对照报告](../.eval-artifacts/p2-1-discovery-20261016/checkpoint-a-20261019/report.md)逐例保留NE和预检产物。单个A的原生见证命中来自通用导航列表，最终关键词/详情未变，整体效果与CONTROL未评。冻结39fc15e/外层e7e6913，五门禁940/940、Chromium116/116已通过且源码未变；0新增产品改动。按停止条件，after-A Google-only nearby修复未开始，P2-1b/完整Live不启动；推送后等待环境恢复及独立复核。

- **2026-10-19 P2-1 检查点A已批准／冻结：** 用户批准进行检查点A。复用刚完成的0模型有/无Guard各20家对照、有效至10/20东京12:12后的同一见证认证、acfaaffa的10次基线；S0为0、基线预检ENV1次、4 TARGET原生来源命中0例，未触发新停止条件。A仅在干净39fc15e工作树执行，输入/见证/预检/指标与基线同字节；每次15模型/180秒/40Google，外层与计划先提交冻结，6份离线空跑0网络/模型。累计起点20/40探测、141/450模型、45Google；预检失败与基线合计超过2即停。A之后才单独修Google-only nearby，P2-1b/完整Live不启动。

- **2026-10-19 P2-1 网络恢复基线10次完成／待独立复核：** 新的10次发现基线均在干净acfaaffa完成，新增55模型/55决策（全成功）、19正式Google＋11非空预检Google，0整单Live。仅神乐坂第2轮预检空结果停批，在用户明确批准的外层1b610a8下补1次预检后正式执行；旧失败和正式产物保留，0正式重跑。Tabelog见证列表1/10（H002 CONTROL）、TableCheck0/10、Google精确官网ID5/10；首批详情0/10。SOURCE失败码和指标观察范围限制原样报告，未把探测当交付或进行归因修复。累计20/40探测、141/450模型、45Google。 [当前报告](../.eval-artifacts/p2-1-discovery-20261016/network-restored-20261019/report.md)与baseline-audit.json保留逐来源、检索序列、原始路径及四层限制。共同基线acfaaffa，P2-1a39fc15e仅增加原P2-1a源码补丁；最终五门禁940/940、Chromium116/116全绿。复核者0f7d43f的6份原始文档/日志已原样纳入，P2-1a代码通过；这不替代新10次基线复核。用户授权推送，Git回执为准；随后停止，不跑A/B、P2-1b或完整Live。

- **2026-10-19 P2-1 外层预检恢复已批准：** 用户批准仅重冻外层并续跑剩余7项：每项仅对0模型、未正式启动的预检ENV允许补1次，所有旧失败保留；拒绝S0、已开始/完成的正式探测和第二次预检重试。外部恢复脚本独立冻结并从主树执行，cwd为干净acfaaffa基线树；源代码、输入、原外层及15模型/180秒预算不变。当前正式3次/13模型，另1次TableCheck空结果预检不计正式；累计99/450模型、13/40探测，0整单Live。 恢复脚本SHA与离线正反例已保存；P2-1a前基线acfaaffa、变基组合39fc15e五门禁均通过。继续剩余7次仅发现探测；检查点A/完整Live等待复核。

- **2026-10-19 P2-1 restored-baseline-ready：** 共同网络修复a60d27b（基于cac4b4f）已在真实来源验证：有/无Guard均20个解析门店，四条搜索GET200、四次合法浏览器预检放行，独立冻结S0边界审计ABSENT。见证重新认证32次公开GET，16原登记保留、13家合格，六例各至少一家，原始SHA/日期/人数/时段链接绑定独立校验通过；不打开链接、不调用模型。六份原输入SHA不变且Runner离线计划0网络/模型；共同配置/脚本/当前见证冻结后，十次基线在同一干净、未含P2-1a的工作树执行。原preparation/旧基线清单是历史材料；当前以network-restored-20261019/baseline-freeze.json为准。该准备阶段0新增模型/Google/正式探测/整单Live；其后新基线10次已完成，见上条。P2-1a已变基到共同准备点，检查点A/Live不运行。

- **2026-10-19 P2-1 tablecheck-cors：** 用户于2026-10-19批准最窄CORS例外：Pack的/search/ GET规则附带页面Origin与已观察头名；Guard在Chromium Fetch暂停边界核对浏览器保留预检头（Origin、ACR*、Sec-Fetch-Mode=cors）、请求GET、无body及同一GET查询语法，不依赖可能缺失的Network标记。没有独立OPTIONS规则，不发起OPTIONS或注入API key。外层、Recorder、Live脱敏trace和独立S0按同一冻结审核接线；原始头值不落盘。ADR-0036补充仅追加。真实Chromium原合法GET阻断红灯已保存，修复后六种正反例通过，五门禁936/936与Chromium115/115全绿；Playwright既有route会本地应答预检，测试核对CDP握手与独立GET接收端，不声称上游OPTIONS返回。含握手但缺忠实HAR的录制仍为NOT_REPLAYABLE。无Prompt、Gold或交付资格变更；实际网站有/无Guard对照各20家，新基线10次已完成，当前结论见上条。

- **2026-10-19 P2-1 tablecheck-get-draft：** Authorized commits35c5dc2/4315ab8/3094193 pushed. Zero-model real TableCheck comparison proves catalog metadata GET and actual search GET at the new tablecheck.net origin; current Guard blocks catalog. Narrow GET declarations, API-document readiness count and frozen external GET audit added with effective red/green evidence. Actual search still requires browser CORS OPTIONS (requested GET, header name x-api-key); GET-only constraint preserved while clarification is pending. This is a partial transport fix, not a completed baseline. No witness recertification/probe/checkpoint/Live started; model budget remains86/450. Isolated fix worktree only; do not replace baseline point until transport is complete.

- **2026-10-17 P2-1 agent-retrieval：** P2-1a implemented under Accepted ADR-0042: Agent-planned positive retrieval, visible same-region categories, at most two pre-detail rewrites, retained candidates and separate page budgets. Shared initial text proposal across TableCheck/Google; old post-batch expansion retired. State@16 has no compatibility path; no database touched. The final clean common baseline before P2-1a is acfaaffa73db97413f6538f161c4e837ec64316e, including the reviewed search GET/CORS transport and fresh witness/configuration freeze. Effective planner/refinement and resumed-page-budget red/green evidence in followup/p2-1a; final combined five gates typecheck/arch/build PASS, npm test940/940, real local Chromium116/116. The P2-1a code review of original3094193 passed; patch equivalence is retained. The restored10 probes evaluate the preceding acfaaffa baseline only. Checkpoint A and P2-1b remain unrun pending new-baseline review; push authorization and receipt are tracked in this batch.

- **2026-10-17 P2-1 baseline-stop：** Corrected the eval-only baseline stop predicate to use native source witness metrics; already-known exact Google website matches no longer trigger a false changed-bottleneck stop. Effective offline predicate red/green saved in followup/03b/baseline-stop-*.log. No production changes in this commit; 0 model, website, probe or Live calls. Prior readiness gates retained; current typecheck/arch/test/build also pass.

- **2026-10-17 P2-1 readiness：** ADR-0042已批准Accepted，探测40/模型450；新来源非空预检先于模型和正式运行，空/超时记ENV_FAILURE。十次旧基线TableCheck按复核改环境问题，Google精确官网ID分来源重算，原始产物不改；四门禁933/933绿，真实模型/业务网络/探测/Live均0。下一提交前记录P2-1a基线点，不推送。

- **2026-10-16 P2-1 baseline-adr：** 第一段10次发现探测完成，86模型（含2失败）/15Google/0整单Live，四TARGET见证来源ID均未进入列表；CONTROL结果与超时/未到达如实保留。冻结0a25cae与active清单未变，931/931及Chromium113/113证据复用；ADR-0042为Proposed，0037只追加。报告见.eval-artifacts/p2-1-discovery-20261016/report.md；停在第3项，不推送，不实施第4–7项。

- **2026-10-16 P2-1 preflight-wiring：** 首次探测在0ms预检配置失败，0HTTP/模型/Google/来源读取；原因是eval Runner预检参数位置错误。保留原日志，CLI改为有类型初始化，离线传输有效红绿证据通过；默认931/931、typecheck/arch/build绿，浏览器相关路径未改复用113/113。自动审批拒绝移除源码冻结检查且未执行，最终两层冻结边界均保留。首次模型前重新冻结@2，原清单与失败尝试保留；生产检索与6份语义/见证/预算不变，补一次未启动的编排失败，不推送。

- **2026-10-16 P2-1 witnesses：** P2-1第2项运行前见证认证完成：6例均有当前可行见证，16原登记店全部保留，13家通过，32次公开只读GET；原始库存SHA及base_date/members独立校验全过，细节和未通过原因留证。不调用模型，不打开表单/点击时段；0 Google/整单Live。冻结认证集合、语义、工具及外层文件SHA后才能开始10次基线探测。工具260522e与五门禁930/930、Chromium113/113复用；只本地提交，不推送。

- **2026-10-16 P2-1 probe-tool：** P2-1第1项发现探测工具完成：使用同一生产createLiveReadAssembly，每计划来源仅一次首批，不查位/交付；15模型/180秒上限含失败调用，来源未到达及指标下界显式保留。6份最近Live实际语义/位置按原SHA提取，仅按10fd06f批准variants.yaml换date，非date字段与独立criteria字面量核对。新增arch拒绝生产依赖本项探测/见证，实际import红灯有效；定向4/4、默认930/930、真实Chromium113/113及typecheck/arch/build全绿，6份CLI空跑0网络。输入/配置/认证脚本已冻结SHA；E1口径未改，Pack净变化0行。0真实模型/Google/餐厅请求，接下来认证并基线10次，做完ADR草案停下，不推送。

- **2026-10-16 P2-1 prerequisites：** E1已独立签收；P2-1第一段第0项完成。观察器迁入src/eval，全部调用方更新，浏览器测试不再依赖.eval-artifacts；3250ms本地响应下旧3秒请求失败红灯，新15秒测试时限在持续两CPU进程负载下连续5次通过。五门禁typecheck/arch/build通过、npm test926/926、真实Chromium113/113；迁移首轮遗漏调用方的失败日志保留。外层POST观察器、0交付补见证GET及reviewed-reads复制并冻结SHA，未新增规则；旧P2-0冻结清单保留作历史，本段不执行整单Live。0真实模型/Google/餐厅请求。证据p2-1-discovery-20261016/00-prerequisites与outer，继续发现探测工具；不推送。

- **2026-10-16 E1独立复核收尾，校准通过／待独立签收：** 44e6aab复核输入已快进同步；用户批准rev2统一Gold修正与S0拆分后，冻结7dd2645（evaluator@29／rubric@25）重评22条：类型22/22、实际交付8/8、正常S0-声明20/20、误判合格0。越界9条已评价ABSENT，13条历史EVIDENCE_GAP逐请求列缺什么，RULE_GAP为0，不把未评当无越界。比较实际退出0；声明必要Gold或独立网络规则缺失的真实Evaluator→comparison挑战各退出1。完整[报告](../.eval-artifacts/e1-evaluator-20261016/report.md)末尾及rubric25逐次对照为当前证据；旧BLOCKED输出与复核原样保留。

- **E1边界与原始输入：** 20份result＋2份SIGKILL包（含trace）、30gzip／12,630,285字节及原始manifest SHA不变；rev1/rev2、见证、标签、Prompt和生产判断均未改写。更正记录绑定全部5份rev1 result与2份started的原始SHA及两版Gold SHA，缺result仍不造结果／用户目标。外层POST body取证只改脚本及dry run／本地Chromium验证，0真实模型／Google／Cloudflare／餐厅请求、0 Live／见证GET。用户已授权同一私有分支推送，Git回执单独报告；推送后停止，不进入下一批。

- **E1门禁与仍未证明：** typecheck／arch／npm test 926/926／build全绿，完整本地Chromium最终113/113。首轮慢OPEN_LINK一项失败、定向通过及完整复验日志均保留，原因未定，不声称稳定性已关闭。当前78测试／98评测源码输入无硬编码本机路径；冻结历史Replay的部分旧工作树绝对路径依赖已列明，不参与本22条、不擅自迁移种子。实际目标YES 6／NO 14／缺result NE 2；必要维度未评仍保留。开发校准不代表新用例／真实模型理解、当前网站、通用自由语义、实时库存或Clean Holdout通过。

- **2026-10-15 T1离线交付待复核：** 六项各自本地提交，生产源码冻结77c4580；各项红绿与门禁／退役清单／宿主差异已汇总至`.eval-artifacts/t1-assembly-20261015/report.md`。最后默认881/881、真实Chromium112/112，typecheck／arch／build全绿。八种原生规范化逃逸未复现，按指令允许分支保留；CDP独立origin／方法／类型拒绝三对照有实际receiver红绿证据。仅测试机制与明确接线修复，不证明真实模型或网站；P2-0已独立签收，T1等待复核，无Live／付费模型／见证GET／Gold修改，无推送。用户原有设计文件保留未提交。

- **2026-10-15 T1-6 CDP逐请求核对：** 所有Request暂停先按既有origin／方法／类型策略检查，不依赖跳转识别。八种规范化未复现逃逸，明确保留；真实CDP隔离route后三类禁用receiver从各1次红到0次绿，正常控制到达。Network类型与Playwright对齐，正常worker／跨源拒绝同时通过，不新增Other放行。定向26/26、四条代码门禁881/881、完整Chromium112/112全绿；证据`t1-assembly-20261015/06-cdp/`，不运行Live、不推送。

- **2026-10-15 T1-5 旧组装退役：** Hybrid完整来源组合全部改由生产factory，删除旧私有adapter位置控制，七组部分端口行为移至既有Router Harness并保留断言。真实外层暴露SourceAware丢Google额度元数据，目标先红后绿仅修透传；定向85/85、默认881/881，五门禁证据`t1-assembly-20261015/05-retirement/`。T1 Guard项继续，未运行Live、不推送。

- **2026-10-15 T1-4 有界等待：** 四处started及checking／finished／SSE／HTTP启停／重复消息等测试信号均有界且带目标标签；无数据流旧路径目标超时标签断言红，修复后Web28/28。四门禁见`t1-assembly-20261015/04-bounded-waits/`；T1其余继续，无Live、不推送。

- **2026-10-15 T1-3 Web并发：** 生产统一组装＋真实HTTP/PGlite受控延迟语义期间列表误判先红后绿；发布会话前建立进程内准备归属，语义结束由activeReads接手，finally释放。新进程仍不继承，W07重启中断反例通过。四条代码门禁见`t1-assembly-20261015/03-web-owner/`；全批继续、无Live、不推送。

- **2026-10-15 T1-1 统一读取组装：** 生产factory被Runner／Web及主要固定来源／Chromium组合共用，返回实际runCeilings和共享browserBudget；移除loop、Router、Executor及事实链隐藏限额。临时工作树恢复旧12次阈值后目标断言失败，恢复后通过；Runner／Web选项对照通过。四条代码门禁及Chromium全绿（880/880、100/100），证据`t1-assembly-20261015/01-assembly/`。旧Hybrid手工组合在第5项继续迁移／退役；未完成T1、不运行Live、不推送。

- **2026-10-15 T1-2 离线浏览器门禁：** 两条旧 dynamic Tabelog H001 Chromium 场景先红后绿；Fixture 地区入口选择对齐 ADR-0040，身份／HARD／库存／展示资格保持。Test Skill 1.4 明确浏览器执行器、Guard、Source Pack、Adapter及读取组装触发 `test:browser:fixture`，与四条代码门禁并列。T1 其余项继续，未运行付费模型、Live或见证 GET；本地提交不推送。证据 `.eval-artifacts/t1-assembly-20261015/02-browser/`。

- **2026-10-15 h001追加见证GET：** 用户授权对10/16 19:00、2人的四家指定店各发一次公开四参数GET，4/4 HTTP200，原始响应与时间戳／SHA已存`p2-0-hardening-20261015/prep/live/h001/witness-after/`。仅作为较晚来源观察，不改变此前Live／evaluator结论；0新增模型／Google／正式Live，P2-0仍待独立复核。

- **2026-10-15 文档与复核同步：** 合并远端b36ec7f及前序提交，保留P2-0原提交与冻结SHA。Eval Skill 2.0、Test Skill 1.3和第一阶段签收文档包已纳入；T1说明与校准标签表为待执行／draft材料，本次仅同步，不运行。P2-0两次Live结果和未评估边界保持下述记录，仍待独立复核。

- **2026-10-15 P2-0 h001明日日期回归完成／P2-0待独立复核：** 用户最新授权立即运行h001、date换明天；仅新建development-variant将tonight改tomorrow并同步semantic日期2026-10-16，其他条件与Gold逐项相等，原Gold/变体/见证不动。生产35b6bf0/CLEAN不变，外层重冻12SHA与离线空跑PASS。首次preflight后唯一Live SUCCEEDED/NO_VERIFIED_RESULT，Agent第11步END_READ，零展示；47模型/3Google、473.822秒、等待25.57%，有局部浏览器超时，未触发安全停止。evaluator28 qualified NO/完成维度NOT_EVALUATED，保留独立审计限制不改判；47决策=47调用、产物SHA通过，录制NOT_REPLAYABLE。浏览器共享调用达到36且>12仍有找店决策。累计1086/1500模型、39Live、Google确认27/历史UNKNOWN，本批2/2、0环境重跑/预留1。复用四门禁879/879与Guard14/14，完整浏览器2项既有失败保留。报告p2-0-hardening-20261015/report.md，不推送、不再运行，停止待独立复核；不建立自动化。

- **2026-10-15 P2-0 h002只读回归完成／h001待排程批准：** 四项实现提交976baaa/60e78b9/f759c34/35b6bf0；生产35b6bf0在新宿主机树CLEAN，外层9SHA与双用例离线空跑通过。唯一h002正式SUCCEEDED/PRESENT_RESULTS，展示Ginza Sushi Sendou/TABELOG/390m；evaluator28 qualified UNKNOWN（条件措辞待独立确认）、证据SATISFIED，207.540秒/25模型/1Google，等待12.41%，无浏览器超时。立即四参数GET为200且18:30在selection，未触发停止；25决策=25模型，产物SHA核验，录制NOT_REPLAYABLE/UNSAFE_DOCUMENT。累计1039/1500、38Live、Google确认24/历史UNKNOWN，本批1/2、环境预留1。h001时窗已过未启动；每日及单次排程均遭自动审批拒绝，明确自动化未创建，需人类排程授权，不绕过。报告p2-0-hardening-20261015/report.md，纯文档核验复用四门禁879/879；不推送，P2-0未全部完成。

- **2026-10-15 P2-0 失败码穷尽分类与结构化结束：** State@15/TaskDefinition@14，noVerifiedResult.termination记录type/reasonCode/isSystemReason/initiator，区分系统发起与系统错误。State/Event/Router/读取metadata失败码显式typed集合，Model/Policy穷尽分类及Browser/Google类型覆盖；缺分类编译红灯与未知持久化码fail-closed。Evaluator@28/rubric@22核对系统事件、终态版本、READ_ENDED及已查/未查范围，只证明有范围的无结果。原P1-G2产物不改写，@27与@28原始重评完成均NOT_EVALUATED（原缺结构化字段）；第6步真实状态新终止离线回放SATISFIED、qualified仍NO，0新增外部调用。四门禁879/879，证据failure-types/；不更改资格/Prompt/Gold/变体/见证，不推送。

- **2026-10-15 P2-0 不可执行读取与超时诚实结束：** 真实P1-G2 h001第6步后状态按事件前缀精确重建并核对轨迹hash，再脱敏为结构/码Fixture；旧码12次新搜索提议、TIMEOUT为FAILED红灯，修复后0次新增提议即NO_VERIFIED_RESULT。实际共享浏览器额度/整单额度耗尽在系统预判及动作校验拒绝；连续3次执行失败不再清零无进展计数。整单TIMEOUT按业务终止并返回TERMINAL，Web/Harness断言同步；服务商拒绝、异常、授权及副作用不确定仍FAILED，取消原样。15项终止回归及生产Guard L1旧组合保持绿，四门禁870/870。证据termination/，0真实模型/Google业务/Live；结构化原因与evaluator28继续，不推送。

- **2026-10-15 P2-0 显式浏览器额度：** BrowserTaskExecutor模型／操作三限额必填且构造校验；Live Runner／Web／固定来源／探测／回放及Adapter调用方显式接线，原生找店20/120/80、事实4/120/24、查位20/120/80（独立探测按其入口显式配置）；每条执行器诊断记录实际生效上限，整单50模型不变。生产组合＋同一Guard/网络策略、真实脚本查位调用累计>12后再次找店，旧码BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED有效红灯，修复绿；不是手填预算，固定传输不证明实时网站。四门禁通过864/864，证据limits/red.log、green.log及四门禁日志；0付费模型/Google业务/Live。后两项与Live继续，不推送。

- **2026-10-15 第一阶段已独立签收／P2-0 Guard：** 921aa76的Playbook1.8和phase-1-signoff为签收依据，新地点泛化转第二阶段。P2-0首项CDP逐跳Guard在真实Chromium14/14及四门禁862/862通过；原准入不扩大，URL／相对资源／Cookie和录制逐跳保留。完整浏览器两个既有dynamic Tabelog场景在原冻结树同样失败，单列而不称全套通过。其余三项及两次Live未执行；模型仍1014/1500，历史37Live，新预算2正式＋最多1环境重跑。证据p2-0-hardening-20261015/report.md，本地提交，不推送。

- **2026-10-15 P1-G2 h001正式Live完成：** 网络恢复后用户追加授权一次preflight，TableCheck206后运行SUCCEEDED/NO_VERIFIED_RESULT；REJECTION_LIMIT经系统终止路径得到READ_ENDED，零交付。362.347秒、44模型/1Google、44决策一致、等待24.14%、未观察浏览器超时。evaluator@27 qualified NO、COMPLETION_OUTCOME NOT_EVALUATED（未记录其要求的END_READ观察），不自行签收；录制NOT_REPLAYABLE。冻结b55e91c/CLEAN，外层ec4aa86b；累计1014/1500模型、37Live、Google确认23/历史UNKNOWN、P1-G2环境预留1。报告P1-G2节，唯一运行完成、心跳暂停，停止待独立复核，不推送。

- **2026-10-15 TableCheck403诊断：** 原Range及无Range公开GET均返回相同nginx403；DNS/TLS及证书校验成功。远端HTTP拒绝已观察，具体出口IP／地区／客户端策略未确定，未测试Chromium；不修改预检规则、不继续Live。诊断证据P1-G2/tablecheck-403-diagnostic/，0新增模型／Google业务／Live。

- **2026-10-15 P1-G2离线修复：** 两次h001真实前状态按轨迹哈希准确重建；推进时钟下旧代码2/2 FAILED，命中END_READ动作校验（旧now早于结束窗口openedAt，状态failure均空）。现由系统终止事件直接写带原因与已查／未查范围的NO_VERIFIED_RESULT；合格交付保持原规则。真实状态回归＋生产Guard L1三组合通过，四门禁862/862；Prompt/Schema/Evaluator/资格不改，服务商拒绝／未捕获异常／中断与安全失败反例保持FAILED。修复提交b55e91c，生产冻结在新的CLEAN p1-g2-live工作树，报告P1-G2节。外层元数据已依用户直接运行指令同步；前三次预检失败保留历史，网络恢复后的最新授权及Live终止观察见最上方记录；生产b55e91c/CLEAN、最新外层ec4aa86b，0环境重跑，不推送，待独立复核。

- **2026-10-12 P1-G 四次 Live 完成：** 冻结9b34287/CLEAN；吉祥寺地点解析成功但零交付NO，h001仍FAILED/REJECTION_LIMIT（诚实结束目标未兑现），h003展示Aloft by Marriott Tokyo Ginza/150m/TableCheck/自动UNKNOWN，h004零交付NO。新增171模型/6Google/4Live，累计970/1500模型、36正式Live、Google已确认22（历史完整UNKNOWN），环境重跑0/预留2。7次preflight中3次503未启动、间隔≥15分钟；吉祥寺运行后见证GET已存，唯一TableCheck交付留原trace。报告 `.eval-artifacts/p1-g-20261012/report.md`。四门禁853/853只证明L0/L1；不能关闭h001实际链路缺口，四份录制NOT_REPLAYABLE/UNSAFE_DOCUMENT，多跳重定向仍已知边界。停止等待独立复核，不推送。

- **2026-10-12 P1-G immediate start:** Latest human approval supersedes tomorrow schedule; heartbeat PAUSED. Only outer time checks changed, execute SHA01fa1610; production9b34287/CLEAN unchanged. Fresh witness certification precedes four approved runs, report updated with facts only.

- **2026-10-12 P1-G preparation:** A/B frozen at9b34287 in CLEAN new host worktree, outer script SHA aa3379b5 and offline dry checks pass. Preparation-time schedule was superseded by immediate-start approval; four runs are now complete (see latest entry). Model799/1500, Live32 + approved4, environment reserve2. P1-F remains pending independent signoff; no push.

- **2026-10-12 P1-G B:** Non-system decision-loop stops now use qualified delivery or honest NO_VERIFIED_RESULT; system errors remain failures. Production Guard fixed-transport controls 3/3 and four gates 853/853 pass (L0/L1 only; optional L3 omitted). Live verification is now complete; h001 still fails REJECTION_LIMIT. Independent signoff remains pending.

- **2026-10-12 P1-G 修复A：** 地点名称去变音符号并接纳 colloquial_area，真实 Kichijōji 固定观察已先红后绿，原地理权限和100km规则保持；四门禁通过850/850。证据仅L0固定传输／保存投影，修复B及10/13 Live待执行；P1-F仍暂不签收。

- **2026-10-12 P1F-h005-final：** 原版h005东京11:46第2次preflight206后正式完成，零交付、evaluator@27 NO/NO_VERIFIED_RESULT；276.285秒、47模型、1Google、等待29.98%、无浏览器超时。B五例正式结果均已保存，累计799/1500模型、32/33Live、Google已确认16（历史完整UNKNOWN）、环境预留2。生产73bfca5/CLEAN及冻结SHA不变，报告part-b-report.md；完成心跳暂停，停止等待独立复核，不归因修复、不推送。

- **2026-10-12 P1F-h005-preflight-1：** 原版h005东京11:30第1次preflight遇TableCheck503，正式运行未启动，0新增模型/Live/环境重跑。至少15分钟后继续，现有心跳改至东京11:46；最多剩2次preflight，启动窗口11:30–14:00不变。累计752/1500、31/33、环境预留2，生产73bfca5/CLEAN及冻结SHA一致。

- **2026-10-12 P1F-balance-restored：** 用户确认已充值，余额前置解除，证据provider-balance-restored.json；原版h005仍未运行，维持东京11:30–14:00，现有11:30心跳已更新无需再确认。当前752/1500模型、31/33Live、环境预留2；无新增API调用，生产73bfca5/CLEAN及冻结SHA不变。

- **2026-10-12 P1F-B-h001-h004：** A第二段及B h001–h004已结束；B h002展示1家/自动UNKNOWN且交付后selection含展示时段，h001失败，h003/h004 DeepSeek402余额不足，无环境重跑。累计752/1500模型、31/33Live、Google已确认15（历史完整累计UNKNOWN）、环境预留2。生产73bfca5/CLEAN、冻结SHA不变。原版h005尚未启动，须东京11:30–14:00且余额恢复后运行；停止待该前置，结果待独立复核，不推送。

- **2026-10-12 P1F-A-part2：** 第二段完成3例：h003展示3家/自动UNKNOWN，h005零交付NO_VERIFIED_RESULT，Kichijoji AGENT_LOOP_NO_PROGRESS失败；待独立签收。新增96模型/3Google/3Live，段末698/1500、27/33、环境预留2；零交付见证5份原始GET均一分钟内保存。冻结73bfca5/CLEAN，A报告已追加；B h001正在运行，原版h005仍东京11:30–14:00。

- **2026-10-12 P1F-input-path-resolution：** 用户批准外层输入路径修正，新SHA已冻结，真实冻结CLI路径校验及两个空跑PASS；路径阻塞解除，h003第2次已发起。A第二段后连续执行B h001–h004，原版h005仍东京11:30–14:00。生产73bfca5/CLEAN及其余规则不变，真实结果待记录。

- **2026-10-12 P1F-input-path-block：** 提前h003 preflight成功206，外层绝对case-source被冻结Runner拒绝，正式运行未开始。实施者编排错误、非ENV；模型仍602/1500、Live24/33、环境预留2。输入路径修正/新SHA等待用户回复，生产73bfca5/CLEAN与冻结脚本不绕过。

- **2026-10-12 P1F-early-window：** 用户要求A第二段和B h001–h004提前开始，并批准外层时窗唯一改动；新SHA冻结，两个原定时已取消。h005仅东京11:30–14:00，单独心跳已设。生产仍73bfca5/CLEAN，核验与停止规则不变，运行结果待记录。

- **2026-10-12 P1F-review-read：** 独立复核仓库副本与Playbook1.6已通读，949b86f原样独立提交；此前文档缺失前置已解除。冻结脚本及输入SHA一致、生产73bfca5/CLEAN；东京08:30第二段、11:00 B按既定心跳执行。尚未新增preflight或Live。签收归类由独立复核，Guard多跳重定向明确保留已知边界缺口。

- **2026-10-12 P1F-run-preparation：** 五例rev2离线重评完成，自动结论不变；续跑与B外层脚本已冻结并通过无网络空跑，交付后四参数GET校验已准备。模型仍602/1500、Live24/33，环境预留2。指定复核文档未找到，真实运行尚未开始；生产仍73bfca5/CLEAN。准备证据 `prep-20261012/report.md`，A追加、新B报告已建。

- **2026-10-12 P1F-rev2-loader：** 原样复核输入0791304；评测加载器拒绝null/未知键与rev1截断值，rev2八例独立字面量oracle通过，四门禁绿849/849。生产仍冻结73bfca5，不移入产品代码；外层准备与五例离线重评推进中，真实运行尚未开始。指定复核文档当前工作区未找到，已请求可读路径。

- **2026-10-11 P1F-A-continuation-part1：** 第一段完成Kagurazaka与Nakameguro两次正式只读运行，自动评价分别NO_VERIFIED_RESULT、合格交付YES（Daikanyama Yakiniku Kintan，919m）。Kichijoji首次preflight503未启动、留到第二段，段末按指令停止。冻结73bfca5/CLEAN未改，新增81模型/4Google/2整单Live，累计602/1500、24/33；环境预留仍2。报告 `.eval-artifacts/p1-f-20261011/part-a-report.md` 的续跑节；第二段与B未开始，不推送。

- **2026-10-11 P1F-h005-retry-env：** h005再次执行在TableCheck preflight503失败，确认恢复206后唯一环境重试仍503；未进入正式Live，累计仍521/1500、22/33，环境重试预留剩2。外层观察改为复用已审核只读许可，生产冻结73bfca5未改。报告：`.eval-artifacts/p1-f-20261011/rerun-20261011/report.md`；到此停止，不推送。

- **2026-10-11 P1F-A-signoff-stopped：** P1-F A 冻结 73bfca5 后启动 5 次，只完成 3 份正式结果；h003 被外层观察误停已审核 read POST，h005 在 G1 公共 reserve 入口按本轮保守 URL 停止边界中断，三个新地点未启动。模型累计521/1500，整单Live22/33；0环境重跑，不推送，等待独立复核。 报告：`.eval-artifacts/p1-f-20261011/part-a-report.md`；Google仅完整3例的3次计数可确认，中断2例缺计数。本轮未签收8例，未安排B。

- **2026-10-11 P1F-A-loading：** 原样提交独立复核文件 2f10a27；新增评测侧 parentless novel dataset 载入支持，仅 src/eval 改动。8 个批准变体解析及 semantic/content 一致，5 个父数据集哈希验证，3 个独立 NOVEL_LOCATION_DIAGNOSTIC cohort。 本批仅评测载入支持；随后冻结执行 A 部分，结果待独立复核；不推送。证据目录 `.eval-artifacts/p1-f-20261011/loading/`。

- **2026-10-11 P1FF-timezone：** 营业时间 grounding 的当日及前日 weekday 读取请求时区；Google 发现/详情、官网事实和 diagnostic evaluator 传递已有 intent 时区，不新增字面量、不改变产品时区合同或资格。完成本批报告后停止待独立复核。 本批按已批准切片推进，结果待独立复核；不推送。证据目录 `.eval-artifacts/p1-f-prep-20261011/followup/timezone/`。

- **2026-10-11 P1FF-replay：** 完成授权固定回放：距离原样与注入各 4 条，共 8 模型；检索词在实验分支 a51a59c 各请求一次，共 16 模型。没有生成额外消息或网站访问，Google 0；实验代码不合入主分支。 本批按已批准切片推进，结果待独立复核；不推送。证据目录 `.eval-artifacts/p1-f-prep-20261011/followup/replay/`。

- **2026-10-11 P1FF-discovery：** 第 11 次东银座补探测冻结 b301091，nearby、1 km 输入保持原样；78,977 ms、1 模型、1 Google，打开已选地区并读取 10 家详情，9 家半径内。P1-D 11/11 用完，判定留给独立复核。 本批按已批准切片推进，结果待独立复核；不推送。证据目录 `.eval-artifacts/p1-f-prep-20261011/followup/discovery/`。

- **2026-10-11 P1FF-navigation：** 整页 OPEN_LINK 与 NAVIGATE 共用剩余预算约束的默认20秒 navigationOptions；Guard公开GET表单提交同样用导航时限，普通控件保留5秒。Playwright导航TimeoutError归为BROWSER_TIMEOUT，模型导航失败不再被NO_SAFE_ACTION吞掉；地区已有观察但结果不完整为EXTRACTION_FAILED。无站点分支，关闭边界保持。 本批按已批准切片推进，结果待独立复核；不推送。证据目录 `.eval-artifacts/p1-f-prep-20261011/followup/navigation/`。

- **2026-10-11 P1FF-review-artifacts：** 原样保存复核者 Playbook 1.2（含 §2 第17条）及 P1-F准备批独立复核，范围冻结按用户 followup 第0–4项；DeepSeek 原已准备载荷明确授权，P1-D仅补第11次发现。 本批按已批准切片推进，结果待独立复核；不推送。证据目录 `.eval-artifacts/p1-f-prep-20261011/followup/review-artifacts/`。

- **2026-10-11 P1F-audit：** 退出条件 6 只读审计：共享生产层保留 Asia/Tokyo 与 Cloudflare Runtime 端点，严格字面清单非零；餐厅域名/站点样式/评测坐标常量未见。Phase 1 站点等待已删除。全部已授权非模型工作与报告完成，距离/检索真实回放仍受具体 DeepSeek 外发授权阻断；两次发现探测未达标，不追加。 本批按已批准切片推进，结果待独立复核；不推送。证据目录 `.eval-artifacts/p1-f-prep-20261011/audit/`。

- **2026-10-11 P1F-coordinate-address：** 坐标附近请求每运行至多一次Google公共反向地址观察；失败也缓存，源/时间/原因进入浏览器，精确圆心/入口名称规则不变，计入40次上限。 本批按已批准切片推进，结果待独立复核；不推送。证据目录 `.eval-artifacts/p1-f-prep-20261011/coordinate-address/`。

- **2026-10-11 P1F-location-resolver：** 命名地区解析带已知位置bias、精确匹配优先地理类型；仅商户或超过100km均歧义并保留来源候选，不替换中心。无城市/国家/地名白名单。 本批按已批准切片推进，结果待独立复核；不推送。证据目录 `.eval-artifacts/p1-f-prep-20261011/location-resolver/`。

- **2026-10-11 P1F-distance：** Context@11与Prompt@25投影已接纳来源距离及圆心类型，展示带米数；近距离只作条件相同时的偏好，HARD/资格/顺序不改。 本批按已批准切片推进，结果待独立复核；不推送。证据目录 `.eval-artifacts/p1-f-prep-20261011/distance/`。

- **2026-10-11 P1F-radius：** 默认附近半径共享为1000m，显式半径保持；ADR0037追加收紧依据。资格精确圆不变，历史交付另表重算。 本批按已批准切片推进，结果待独立复核；不推送。证据目录 `.eval-artifacts/p1-f-prep-20261011/radius/`。

- **2026-10-11 P1F-review-artifacts：** 原样保存独立复核与 Playbook@1.1；本轮六项按批准范围实施，保留上轮报告提交及未跟踪演示稿。 本批按已批准切片推进，结果待独立复核；不推送。证据目录 `.eval-artifacts/p1-f-prep-20261011/review-artifacts/`。

- **2026-10-10 P1D-final-report：** P1-D 批次0–4本地提交完成；kf-h005冻结920bad9复测SUCCEEDED/evaluator@27六项SATISFIED，305451ms/47模型/0Google；P1-D八次发现探测10模型、新地点4/5，Ebisu失败保留。检索词实验76213a4只在隔离分支，ADR-0041 Proposed，不合入。完整事实与原始路径见 p1-d-batch-20261010/report.md，停止等待独立复核。 本批按已批准切片推进，结果待独立复核；不推送。证据目录 `.eval-artifacts/p1-d-batch-20261010/final-report/`。

- **2026-10-10 P1D-P1-D：** 用户批准 ADR-0040 已实施：删除所有目录地区表/锚点选择，由 Agent 选择观察引用；LOCATION 精确填同次解析名称并传已有地址组成部分。首五详情四个越界才可换一次，预算和截止时间不重置。Browser schema@11/prompt@16，State@14/TaskDefinition@13。 本批按已批准切片推进，结果待独立复核；不推送。证据目录 `.eval-artifacts/p1-d-batch-20261010/P1-D/`。

- **2026-10-10 P1D-replay-matching：** Replay Runner 支持 seeds.v6 的排除集合和精确候选集合匹配；未知字段在任何模型调用前硬失败。用保存的 C8 输出和原 Live 动作离线计分，不新增模型调用。 本批按已批准切片推进，结果待独立复核；不推送。证据目录 `.eval-artifacts/p1-d-batch-20261010/replay-matching/`。

- **2026-10-10 P1D-kf-h005-retest：** 冻结 920bad9 在干净宿主机工作树完成一次 kf-h005 复测；首次 preflight 503，恢复后使用一次环境重跑。305451ms、47 模型、Google 0；evaluator@27 合格交付 YES，展示 Sushi Ito Akasaka。见证原始 GET 响应结束后 2 秒内保存，不作归因。 本批按已批准切片推进，结果待独立复核；不推送。证据目录 `.eval-artifacts/p1-d-batch-20261010/kf-h005-retest/`。

- **2026-10-10 P1D-C3b-completion：** Require every completed browser predicate to declare its bound result key and busy state; source-owned list/query regions replace page-wide busy fallback. Keep newest PENDING observation when keys differ; hidden Sen time templates cannot count as slots. Source packs and facts/Fixture callers updated. No Guard or qualification relaxation. 本批按已批准切片推进，结果待独立复核；不推送。证据目录 `.eval-artifacts/p1-d-batch-20261010/C3b-completion/`。

- **2026-10-10 P1D-review-artifacts：** 原样保存 Playbook@0.9、独立复核及 seeds.v6；追加提交此前未跟踪的四份历史 witness 与 seeds.v1–v3，原文和 SHA 不变。用户批准 ADR-0040、检索词提前、退出条件5及一次 kf-h005 复测，按切片继续。 本批按已批准切片推进，结果待独立复核；不推送。证据目录 `.eval-artifacts/p1-d-batch-20261010/review-artifacts/`。

- **2026-10-10 P1C3B-Recorder：** Recorder 保存所有 Guard 放行且通过现有安全检查的实际 stylesheet 响应，包括通用 GET；录制回调补 resourceType，Runtime/Guard 准入行为不变。保留 CSS UTF-8 BOM，保存快照中的已加载 CSS URL。 本批等待独立复核，不运行整单 Live；不推送。证据目录 `.eval-artifacts/p1-c3b-20261010/Recorder/`。

- **2026-10-10 P1C3B-C8：** C8 已向 Agent 上下文加入来源类别观察（Google 类型与来源列表类别），Prompt@24 / Context@10；仅影响选店优先级，不改变资格、HARD 或候选合法动作。新增 seeds.v5 两条目标种子待独立标注。 本批等待独立复核，不运行整单 Live；不推送。证据目录 `.eval-artifacts/p1-c3b-20261010/C8/`。

- **2026-10-10 P1C3B-C2a：** 通用可见日历按caption月份/年份与真实格子日期暴露不可操作观察，DATE_NOT_SELECTABLE不建立无位；查位普通CLICK不得切到非请求日期。请求人数已确认且日期不可选时一次决策后以UNKNOWN原因结束；请求日期可选路径不变。 本批等待独立复核，不运行整单 Live；不推送。证据目录 `.eval-artifacts/p1-c3b-20261010/C2a/`。

- **2026-10-10 P1C3B-E2：** evaluator@27按C0c区分已查、已发现和未解决集合；核验实际读取轨迹、逐店未知/未查说明及结束观察一致性。资格和来源证据规则不变。 本批等待独立复核，不运行整单 Live；不推送。证据目录 `.eval-artifacts/p1-c3b-20261010/E2/`。

- **2026-10-10 P1C3B-C3b：** 共享稳定判定只计短 document/xhr/fetch；导航短采样后按同一完成谓词在至少500ms间隔核验绑定结果。来源结果 busy 与整页图片/其他组件区分；加载中的库存不接纳。诊断保留真实URL、全部未完成类型、最久年龄、busy和文字变化。无站点分支，原 C3 正反例保留。 本批等待独立复核，不运行整单 Live；不推送。证据目录 `.eval-artifacts/p1-c3b-20261010/C3b/`。

- **2026-10-10 P1PRE-Live：** 冻结14c1112的kf-h001/kf-h002/kf-h005三例已完成；@26 qualified分别YES/UNKNOWN/NO，h005结束范围评价NOT_SUPPORTED；只记录，待独立复核。 本项宿主机真实只读验证已完成；待独立复核，不推送，不追加运行。证据目录 `.eval-artifacts/p1-prelive-20261010/Live/`。

- **2026-10-10 P1PRE-C4：** 通用同状态同动作同目标拦截写入 history/progress，连续两次返回 NO_SAFE_ACTION；冻结回放未达门槛，生产思考保持关闭，Prompt 不变。 本项离线验证，后续只按授权运行 Live；不推送。证据目录 `.eval-artifacts/p1-prelive-20261010/C4/`。

- **2026-10-10 P1PRE-progress-wording：** 执行器无变化反馈明确选择当前观察目标，只有确实加载时等待；不改变动作资格。 本项离线验证，后续只按授权运行 Live；不推送。证据目录 `.eval-artifacts/p1-prelive-20261010/progress-wording/`。

- **2026-10-10 P1PRE-C6a：** IMMEDIATE_SOURCES_CLOSED限制为至少三家已查门店全部明确不营业且无已查营业/未知；一家休息仍可继续查店。按用户要求恢复ADR-0039原句，范围调整仅追加补充。Agent Prompt@23。 本项离线验证，后续只按授权运行 Live；不推送。证据目录 `.eval-artifacts/p1-prelive-20261010/C6a/`。

- **2026-10-10 P1PRE-reserve-results：** Router对事实与查位采用同一门店完成检查点：保留量/交付时间触发时保留完整返回店的证据和结果，未完成店UNKNOWN/RESERVE_REACHED；已返回执行事件不再被continue丢弃，元数据记录触发原因及已完成店。 本项离线验证，后续只按授权运行 Live；不推送。证据目录 `.eval-artifacts/p1-prelive-20261010/reserve-results/`。

- **2026-10-10 P1PRE-C3：** 共享页面等待补可见文字/交互状态稳定300ms路径，保留DOM静默路径与4秒上限；导出PENDING次数和等待总毫秒，轮播不再阻断已渲染结果。 本项离线验证，后续只按授权运行 Live；不推送。证据目录 `.eval-artifacts/p1-prelive-20261010/C3/`。

- **2026-10-10 P1-D：** 新增ADR-0040 Proposed窄草稿：待批准后删除地区表、Agent选择观察入口、权威LOCATION、详情坐标半径与一次换入口；五新地点仅列发现探测计划，代码未实施。 本轮不推送、不跑 Live；证据目录 `.eval-artifacts/p1-c-batch-20261010/P1-D/`。

- **2026-10-10 C6a：** 页面营业事实支持的零偏移现在窗口提前结束：已查公共来源全部明确关闭/无重叠营业区间时允许END_READ与最近可订时间选项；未知、API-only、部分重叠、跨夜与明确钟点不触发。Agent prompt@22，资格与原窗口保持。 本轮不推送、不跑 Live；证据目录 `.eval-artifacts/p1-c-batch-20261010/C6a/`。

- **2026-10-10 C0c：** C0c preserves four shared model calls for honest END_READ when no candidate is eligible. System READ_END_WINDOW_OPENED persists the bounded reserve; qualified results retain C0 delivery. Router and Web report actually checked shops, per-shop unknown/unread causes and remaining scope. State@13/TaskDefinition@12/Agent Prompt@21; current callers updated, no compatibility path or data reset. 本轮不推送、不跑 Live；证据目录 `.eval-artifacts/p1-c-batch-20261010/C0c/`。

- **2026-10-10 Recorder：** Recorder schema browser-read-recording@3 saves actually received reviewed public stylesheets as standalone CSS files with URL/SHA256/byte count, and preserves admitted CSS URLs and public asset references in HAR. Runtime and Guard behavior unchanged. 本轮不推送、不跑 Live；证据目录 `.eval-artifacts/p1-c-batch-20261010/Recorder/`。

- **2026-10-10 C3：** Unified browser post-action settlement (requests complete, DOM quiet 300ms, no visible busy marker, bound 4s). PENDING snapshots cannot complete or yield inventory. Retired Tabelog member-loader and TableCheck skeleton waits. Synchronous fixtures use readiness semantics; settled restricted calendar still remains a supported query surface. 本轮不推送、不跑 Live；证据目录 `.eval-artifacts/p1-c-batch-20261010/C3/`。

- **2026-10-10 C1：** Recent six browser execution steps implemented with action/target/field/outcome/reason/url-change; browser prompt15/schema10. All current callers updated; replay history mode reuses frozen messages without CSS. v3 adds 22 implementer-proposed pending-independent-label seeds, v2 unchanged. 本轮不推送、不跑 Live；证据目录 `.eval-artifacts/p1-c-batch-20261010/C1/`。

- **2026-10-10 TableCheck-empty：** TableCheck ready widget reports selected date/party/mealtime EMPTY. Exact-time requests return UNAVAILABLE; wider windows return SELECTED_MEALTIME_EMPTY UNKNOWN without expanding the negative claim. Source message visibility and selected request stay required. 本轮不推送、不跑 Live；证据目录 `.eval-artifacts/p1-c-batch-20261010/TableCheck-empty/`。

- **2026-10-10 G1b：** G1b reviewed static assets implemented; ADR-0036 supplement appended under user approval 10/10. Narrow source-owned CDN path/type admission, no runtime write expansion. Playbook 0.5 independent-review changes retained. 本轮不推送、不跑 Live；证据目录 `.eval-artifacts/p1-c-batch-20261010/G1b/`。

- **P1-E 本轮两例已结束，停止等待独立复核。** G1 `070dad6`、Gold7/ADR-0039 `5aac484` 已本地提交，四门禁分别 778/778 与 779/779；Live 冻结 `5aac484` 的宿主机干净工作树。kf-h001 首次 preflight 503 后唯一重跑，295s/50模型/6 Google，预算耗尽无展示；kf-h003 100s/32模型/0 Google，展示1家，证据充分但条件措辞待确认，evaluator@26 两例 qualified 均 UNKNOWN。两例计入授权 P1-E 计划，ENV_FAILURE 单列，不宣称能力改善或 Clean Baseline。[报告与全部路径](../.eval-artifacts/p1-e-early-20261009/report.md)；不推送、不追加运行或修复，归因由独立复核负责。

- ADR0036 supplement and ADR0039 accepted by user 10/9; default Gold7 active, Gold6 frozen unchanged. Night review passed implementation, 21 old immediate Agent seeds superseded by contract in independent seeds.v2. Static CSS replay gap and obvious closing-hours early response remain known, C1/P1-D not in this slice. After four gates/commit, run only kf-h001 then kf-h003 as authorized P1-E 2/5, stop on false display and record evaluator26 results.

- G1 user-approved integration verified by all four gates (778/778 default tests); accepted supplement permits narrow read only. Gold7/ADR0039 promotion next, then two explicitly authorized P1-E Live cases. Earlier night stop/no-Live directions are superseded only for this authorized slice; C1/P1-D not included.

- Night work stopped for independent review: C0b and E1 complete; C6a and C5a implementation pass but specified replay acceptance PARTIAL; P1-B original reproduction passes, static reconstruction blocked by missing captured CSS/snapshots; C1 dependency BLOCKED, no implementation. G1 is an isolated Proposed draft on its named branch; Q8 analysis complete. No Live, witness recheck, push, P1-D integration, or frozen input changes.

- C5a implementation and offline composition verified; replay acceptance PARTIAL due to missing captured CSS/geometry. C1 remains BLOCKED by the prerequisite that the first five items be complete; no C1 implementation. Independent review must resolve recording completeness before further replay or separately authorized Live.

- **P1-B Runner与原样回放完成，重建验收BLOCKED。** 全部106原样调用，错误复现95.65%、正向7/7。冻结DOM不足以恢复样式：83个浏览器种子全部单列（11缺快照、72缺样式），不计通过率；Agent层独立。不能据此签收C5a质量改善。C5a仅继续可独立验证的执行器机制，C1依赖门槛尚未满足。

- **C6a代码已完成、回放验收PARTIAL，继续P1-B。** 30分钟策略@6、Agent prompt@20/context@9和过期快速结束链路已有离线证据；历史#40–50在新窗口内，6/11询问新时间、5/11继续合法查位，标签的旧1分钟过期前提须独立复核。Gold@7草稿默认不启用，跨午夜仍须明确时间澄清。

- **E1已实现，继续C6a。** evaluator@26绑定候选查位阶段与证据时刻，rubric@21不变；11次旧产物仅kf-h005变为有证据支持的确定YES，其余10次结论不变。旧文件保留；开发集重评非新Live证据。今晚产物见`.eval-artifacts/p1-c-night-20261009/E1/`。

- **今晚 C0b 已完成，转入 E1。** 读取动作中的模型调用现按当前合格默认首批保护最后4次；耗尽可读份额以`BUDGET_RESERVED_FOR_DELIVERY`的UNKNOWN交回Agent，再复用C0窗口实际展示。Web／Hybrid Runner／固定来源共用同一scope guard；每次调用重核已有证据新鲜度，无合格候选不限保留。四门禁通过（770/770），kf-h001 #38历史上下文的6次边界组合通过、零真实模型。今晚不运行Live；详细证据见`.eval-artifacts/p1-c-night-20261009/`。

- **P1-A 基线与补跑已完成，属于已暴露开发诊断。** 冻结 `2656ce9` 上保留8次主运行及3次补跑；独立归因见 `.eval-artifacts/known-feasible-baseline-20261008/review/`。kf-h004重新归为语义目标错误，非错误展示；三次补跑累计123模型／2 Google，kf-h005实际展示，kf-h003与h005模型预算耗尽未展示，自动目标评价均UNKNOWN。补跑报告保留在冻结工作树 `.eval-artifacts/p1-a-baseline-supplement-20261009/report.md`；本轮C0不改旧结果、变体或见证。
- **P1-C C0 实现与两次真实模型回放通过。** 共享整单调用剩余≤4且已有合格默认首批时，复用交付事件与资格规则，Web／Hybrid Runner／固定来源均接入真实计数；调用跨阈值会拒绝旧调查提议。合格正例实际展示，错误人数、过期证据及明确数量不获得例外；本地Web持久化入口也实际展示短批。[ADR-0038](decisions/0038-model-call-default-delivery-window.md)仅扩展ADR-0031触发条件。四门禁通过；[证据与未覆盖边界](history/TEST-LOG.md#test-2026-10-09-p1-c-c0-call-budget-delivery)。
- **当前停止点：C0 到此停止，不运行 Live。** kf-h001 #38／#49分别一次真实DeepSeek回放均主动选择`PRESENT_RESULTS`，校验ALLOWED后实际展示Sushi Suga；共2次模型，模型耗时2,228／1,783ms，零Google／浏览器／餐厅来源读取。#38是4次临界预算对照（原13次剩余），#49沿用原始2次；不宣称原第38次自然触发。沿原State version 9／10继承冻结来源轨迹的既有诊断六维均SATISFIED，资源仅计本次新增决策；产物和独立核验在`.eval-artifacts/p1-c-c0-20261009/`。已暴露单步回放不证明完整Live改善。首次审批拒绝后用户已明确授权并完成；不进入C1以后或P1-B／P1-D，P1-D ADR仍须用户批准。

- **H001→H001–H005 Playbook：Phase 0／1／2 已签收，续行 Phase 3 仍 FAIL。** Google发现10/10、Tabelog发现9/10／身份10/10；TableCheck发现3/10／返回身份4/10、官网返回资料4/10（3份独立重建）未达门槛；[本轮证据](history/TEST-LOG.md#test-2026-10-08-playbook-phase3-renewal)。
- **已知可行库存：同五家 Tabelog 从0/5到5/5。** 有条件等待人数加载后，原请求10/22／2人／17:30的页面选中值、原始200响应与五个Offer逐项绑定，59,960ms／14模型；仅签收库存绑定切片，未证明完整HARD／H001交付。
- **交付代码：当前查询／地区绑定、公开GET查询grammar、真实空控件值与共享预算已补强。** Source Pack持有来源规则；Record保留公开资源与语义动作指纹，Replay零网络执行；一次列表回放通过，真实日历失败路径仍NO_COVERAGE。
- **历史 Phase 3 停止记录（保留诊断结论）：原始6＋续行139＝145/150模型调用，余5不足以完成剩余矩阵，不自动追加预算。** Tabelog发现同问题已到3轮；当时未进入Phase4／5／6；该前置门槛现由P1-A基线计划替代。Semantic／Gold／HARD／身份／半径与整单500s／50调用不变；诊断样本4调用不作为旧2调用的同预算改善。

完整旧 STATUS 已移入 [月度历史快照](history/monthly/2026-10-status-baseline.md)；[月度摘要与逐条索引](history/README.md) 保留原始 DEVLOG／TEST-LOG。
