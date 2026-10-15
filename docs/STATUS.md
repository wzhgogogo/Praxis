# Praxis 当前状态

- Status: Accepted
- Document revision: 4.219
- Last updated: 2026-10-15
- Source of truth for: 当前实现、证据与下一道门槛

## 当前门槛

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
