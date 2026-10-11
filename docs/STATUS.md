# Praxis 当前状态

- Status: Accepted
- Document revision: 4.181
- Last updated: 2026-10-11
- Source of truth for: 当前实现、证据与下一道门槛

## 当前门槛

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
