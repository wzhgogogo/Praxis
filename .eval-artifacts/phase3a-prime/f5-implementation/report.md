# F5 实现与 Live 准备：停止点 2

- 日期：2026-10-24 Europe/Vienna（CEST，UTC+2）。
- 证据状态：draft / not integrated；已暴露开发控制，非 Clean Baseline。
- 基线：main/f42715c2；分支：codex/fix-phase3a-prime-f5-provisional-entrance。

分析三提交已重放并推送至分析分支 51ff66b3，原 60d02686 保留 annotated tag `checkpoint/phase3a-prime-f5-stop1c`。冲突保留 F1、F1b 与 F5 的 STATUS、DEVLOG、TEST-LOG、月度记录。实现分支从新 main 创建，再带入已批准 ADR 及分析输入。

## 实现范围

仅实现 Accepted ADR-0043 第 1–7、9、10 项。无具名标签或同源指针的已观察地区入口可先取样；前两个有效同店 JSON-LD 坐标均越界时允许一次更换，任一在内即核实，缺失或未知不计有效。与原 4/5 规则共用一次上限，保留已接纳候选。

代码提供原圆心距离、方位、样本引用、已观察集合及剩余预算；模型只能输出 `SELECT_REGION_ENTRANCE` 的集合 ref。来源组合核对成员、来源、流程、Pack、不同入口、Guard 和原预算后直接导航，不读取恢复菜单。失败 UNKNOWN 并附原因，移交下一既有来源，计数与截止时间不重置。普通 DOM 引用仍受当前观察约束。LOCATION、车站和类别控件不改。

合同变化：restaurant-state@20 → @21、TaskDefinition@18 → @19；browser-read-context@2 → @3、browser-read-action@11 → @12、browser-read-prompt@19 → @20。活动调用方及 fixture 同步；旧 firstFive 进度移除，历史 JSON 不重写。无生产数据迁移或数据库操作。两个站点目录、source-packs.ts、Guard 和历史评价不改。

## 验证与证据边界

R1 在未修产品 c870dc4a 取得有效红灯：详情为 0，目标断言要求进入取样；缺依赖的启动失败另存，不算红灯。修复后相同断言通过。D1 链接来自固定 3ec38584；列表、详情和坐标明确为本地构造，不是网站 Replay。

真实 Chromium G3 验证东京 → A1322 → A132201 → 已观察替代入口，共四个地区页、一次替代、恢复页访问 0。生产组合保留 Interpreter、Compiler、Router、Event/Reducer 与持久化，只替换模型和来源传输；三个场景产出 execution artifact，现有独立 evaluator 检查合格交付或有界无结果。当前网站解析、真实模型选区和现实库存仍未由离线验证证明。

适用五门禁将在冻结提交后的干净工作区运行；当前 PENDING，不以定向通过替代。后续追加每条清单、门禁、SHA 和工作区结果。

## Live 准备

公开历史原文固定于 Git blob；例 03 先采用已批准的 Kudanshita 模板，再仅替换 `{DATE}`。计划运行日 2026-10-24：例 01 Wednesday, November 4（+11 天），例 03 Saturday, November 7（+14 天），其余正文逐字节不改。若实际 Live 日变化，须重新做日期冻结。

例 03 按“附近无合格店”定义，无见证；人工核对 800 m，800–1000 m 环带 UNKNOWN，不能声称已认证全部 1000 m 无店。通过条件为如实有界无结果、不超时、不把非 fugu 店说成满足 HARD，用时只记录。历史 C03-2/C09 原评价不改。

采集脚本先冻结提交：例 01 取历史 Dengana 一个候选，历史坐标和类别预筛在 1000 m 内；公开详情须重新核对身份、坐标和 Categories 后才请求一次四参数 find_vacancy。至多 2 GET，仍受本批 ≤10 GET、≤5 候选总额约束；串行间隔 ≥5 秒，无 Cookie、登录、预约表单或模型。每次原始响应及 SHA 落盘并逐次写预算账本。例 03 没有用户观察到的 ≥1000 m 筛选 URL，跳过可选 GET，0/1。当前尚未发请求，最终计数随后追加。

已冻结 Live 外层脚本和计划，默认只离线检查。六次正式 Live 均 NOT_RUN。正式运行要求 F2①、F2④a 合入 main 并由本分支继承、未来用户批准、运行日日期有效及 Live 前 24 小时内重新认证。逐 slot 做独立四层评价和 S0 核查，再批准下一 slot；不自动重试。

停止点 2 认证不代替 Live 前复查。F5 Live 标准：例 01 至少 2/3 合格交付且不超时；例 03 如上有界无结果；全部 S0=0，原始响应独立核对，生产成功标志不作为自证。

## 离线验收清单

以下输入均为本地构造，D1 引用和正常地区坐标取自已保存的公开历史观察；没有把构造页面称为网站 Replay。主要入口为 `directory-region-selection.test.ts`、`native-discovery-composition.test.ts`、`browser-task-executor.test.ts` 和真实 Chromium 的 `browser-read-discovery.test.ts`。

| 清单 | 断言与证据 |
| --- | --- |
| R1 | 未修产品 c870dc4a 的目标断言失败，详情为 0；修后同断言通过。见 r1-red.json、r1-red.log、r1-green.log。 |
| G1 | 生产观察形成集合；临时入口恰取两有效越界详情；代码生成 SW 方位和距离；一次集合选择后，替代列表及关键词检索产出范围内候选。完整生产组合继续取得独立支持的交付。 |
| G2、F4 | 独立本地 oracle 指定正确区域及圆心边缘，首二外仍会触发纠正；不增加运行时误判识别。来源控制及 Router/Reducer 控制覆盖第二入口仍外、没有替代，已接纳的附近候选保留。HARD 未被支持的候选仍不能变成合格交付。 |
| G3 | D1 第二层路线由生产观察形成集合，四地区页直接换一次、恢复 0；真实 Chromium 经实际 strict wire、Executor 和 Guard 通过。 |
| X3、Q7-X | 集合外引用、其他来源、其他 flow、自由 href／拼造站码路径均在导航前拒绝。整个集合另与 readRunId 绑定；同 intent 跨 Task/run 复制也在任何导航／模型调用前拒绝。普通 stale DOM ref 仍拒绝。 |
| F1 | 第二入口两有效坐标仍外：REPLACEMENT_SAMPLES_OUTSIDE_RADIUS、UNKNOWN、没有第三入口或恢复页。 |
| F2 | 无预算内已观察替代：NO_OBSERVED_REPLACEMENT_ENTRANCE、UNKNOWN，不再调用模型找菜单。 |
| F3 | 取样后累计来源达到 90 秒：SOURCE_BUDGET_EXHAUSTED，详情数与已用调用保留，没有后续导航或模型调用。 |
| B1 | 四种收尾分别从整单已用 200 秒／20 calls 起步；实际源读取继续计时计数，下一来源的 Executor 仍见 500−累计毫秒、50−累计调用；到原 500 秒拒绝新调用。与真实组合的来源交接、原四页／十详情和全局 50 调用反例合并验证。 |
| C1 | 内→外、外→内均核实入口，仅地理合格店接纳，不触发临时两外规则。 |
| C2 | 缺 geo、非法纬度、null／空字符串、未知→外→缺→外：未知不占有效样本，开始的详情仍计数，第二个有效外才触发。保留 null 被 Number 转成 0 后提前两详情换区的有效红灯；修后四详情才取得两有效样本。 |
| C3 | 原 4/5 与临时两外共用 replacement；后续批次不可再换，误判不获得补偿次数。 |
| C4 | 复用既有 COMPLETE 的未满足谓词、无进展和异步加载行为回归；模型完成请求不能代替代码谓词。strict wire 拒绝额外 distanceMeters、radiusMeters、href 和权威 LOCATION 字段。 |
| N1、N2、N4 | 涩谷、神乐坂、东银座分别使用各自历史圆心，本地具名入口和同店详情；不进入临时分支。旧／新均 2 地区页＋5 详情＝7 次页面访问，换入口 0。 |
| N3 | 吉祥寺使用其历史圆心、实际观察到的吉祥寺父入口及本地构造同源店铺指针；标签故意不匹配地名。旧／新均 2 地区页＋1 详情＝3 次页面访问，换入口 0。 |

N1–N4 复用现有行为构造并在固定 f42715c2 的旧 Native 模块上实际比较，见 normal-baseline-comparison.json／log；临时旧执行文件已删除，不留兼容路径。这些是发现阶段控制，不冒充完整四例 Live；原请求、Gold 和后续 HARD／身份／库存资格门槛不改。

PGlite 恢复测试还验证集合原观察引用、样本、累计计数在 Event/Reducer 后持久化并恢复。首次默认门禁 1035/1036 的旧 State20 断言失败保留为无损 gzip，更新为 State21 后通过，没有排除测试。

收尾反例另验证：非法整集合且详情队列未空时，明确 stopReason 优先于通用队列保留，UNKNOWN 不被重新标成可继续；scope-stop-red.log.gz 保留修前目标断言失败。一般的未完成详情继续路径不受影响。

## 四层评价与未证明范围

完整本地生产组合产物经现有独立 evaluator：正常替代和无替代后由下一来源交付各为 QUALIFIED_DELIVERY；第二入口仍外、两种误判控制为 HONEST_NO_RESULT。后两种控制保留之前已接纳的附近候选，缺失 HARD 不能伪装合格。结果来自实际最终 State、执行轨迹和原始构造来源观察，未预填合格 Evidence。

逐环节：Interpreter／Compiler、地区发现、候选接纳、Router／Reducer、HARD、查位、交付或无结果均经过真实接线；真实模型选择、当前网站结构和连接能力未运行。严重程度：本地组合 S0_DECLARATION=ABSENT；其脚本来源没有网络边界记录，S0_BOUNDARY=NOT_EVALUATED，因此不声称综合 S0=0。真实 Chromium Guard 验证只证明本地控件与边界接线。归因：R1 关闭的是完成谓词阻断取样及有界纠正的本地机制，不能由此关闭 F5 Live 的用户验收。

## GET 认证结果与计数

冻结提交 778f37ff 在请求前已包含采集脚本、SHA、外层脚本和日期变体；执行时为 fd7c3c70，冻结文件逐字节一致。两次请求均 200，前一次完成至后一次开始间隔 5.010193 秒。

例 01：Kushi Katsu Dengana Akabane ten，rst_id 13108466。当前详情 JSON-LD 身份及坐标重核通过，距冻结 Akabane Station 圆心 201.545 m；Categories 为 Kushi-age (Deep-fried skewers)，符合既有 kushikatsu/kushiage 口径。四参数响应的日期 2026-11-04、人数 2、时刻 19:00 与请求及 slot URL 一致，见证 WITNESS_EXISTS。没有打开或跟随响应里的预约表单链接。

新增网站 GET：例 01 为 2/10（1 候选，详情 1＋空位 1），例 03 为 0/1；其他网站调用 0、模型 0、Google 0、Live 0、环境重跑 0。共享 budget.json 已逐次记账。原响应字节留在本地，Git 中用无损 gzip 保存，原始 SHA 与归档映射在 live-prep/certification-stop2/audit.json；certificate.json、requests.json 和逐请求 metadata 一并保留。仅用于停止点 2；Live 前 24 小时仍须重新认证。

## 门禁与交付

fd7c3c70 已通过五门禁：typecheck、arch:check、默认 1037/1037、build、真实 Chromium 138/138；每项前后 git status 均为空。原始日志无损归档于 gates/。最终又加强了正常地区输入和跨 run 集合拒绝，将在新提交的干净树上重跑五门禁，最终结果以 gates-final/results.json 为准。

两个站点目录相对 f42715c2 全部字节相同：生产 TypeScript 3864→3864 行，source-packs.ts 473→473 行；完整文件 SHA 见 adapter-audit.json。没有 `.env` 读取或暂存，没有 main 合并或 main 推送。最终提交推送实现分支后停在停止点 2，等待复核。

Live preparation envelope check: the real strict Runner loader rejected historical weekday/fallback_place metadata. The final envelope removes only those metadata keys; user content, dates and semantic criteria are byte-preserved. live-outer.mjs now invokes the production loader/cohort/materializer in its offline preflight. The executed collector freeze is retained separately as collector-executed-freeze.json; the GET witness inputs and collector bytes are unchanged. No request was repeated.

## 停止点2最终签出（2026-10-24 CEST）

最终源码／测试冻结提交：d771aa5191669093149b310ae978e5a1e8b2ec0e。五门禁全绿：typecheck、arch:check、默认1038/1038、build、Chromium138/138。gates-final/results.json逐项保存退出码、时间、原日志SHA和前后空git status；日志无损gzip可还原。验证后只新增报告、历史记录与证据归档，源码／测试／脚本输入保持冻结。

最终完整组合五个产物位于composition-stop2，独立四层汇总为independent-stop2-review.json：2个QUALIFIED_DELIVERY、3个HONEST_NO_RESULT；5个S0_DECLARATION均ABSENT，脚本来源边界NOT_EVALUATED的限制保留。验证总收据为verification.json，文件SHA索引为delivery-sha256.json。

最终Runner准备包已重新冻结：实际严格Loader／Cohort／Materializer离线通过；这次只修运行信封元字段，正文与选定日期、见证输入和采集脚本不改。GET执行时的原freeze另存collector-executed-freeze.json，并由原执行提交fd7c3c70逐字节校验；不伪称后改信封已在请求前冻结，也没有再次请求网站。

新增调用保持：例01公开GET2、例03可选GET0、其他网站0、模型0、Google0、Live0、环境重跑0。原始响应SHA、串行间隔及逐次预算一致；两个站点目录与source-packs仍对f42715c2零差异。git diff --check通过。ADR0043实现切片和Live准备结束，停在停止点2；不合并main，不启动Live。F5Live仍需F2①／F2④a合入main、继承／重放并冻结最终代码、有效日期及24h内GET复查、用户另行批准。
