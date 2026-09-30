# Shared Browser Read：独立审查

- Status: Draft
- Document revision: 0.1
- Last updated: 2026-09-29
- Evidence status: exposed development / offline review; not Clean Baseline
- Scope: 2026-09-29用户授权Sol四切片，主chat独立review；不声明H001或来源Live通过。

## 第一次交回：未签收

基线 `/private/tmp/praxis-browser-shared-start-20260929-175608/`。主chat由HEAD与开工diff重建改前文件，并逐个SHA256匹配开工hash后生成增量 `/private/tmp/praxis-browser-shared-review/delta.patch`，未把旧dirty计入本轮。未发现semantic/Gold/fact/identity源文件本轮变化。

已核对实施者原始日志：默认558/558、独立Chromium50/50。主chat另运行6项本轮定向测试（wrapper、covered public、saved Tabelog、loading-to-restricted），6/6通过，日志 `/private/tmp/praxis-browser-shared-review/independent-focused.log`。此前提出的Tabelog加载→受限遗漏，已接入等待后的新快照与真实Adapter Fixture；不把限制误报为无位。

独立挑战确认两项仍需修复：

1. **列表后续卡片仍点击超时**。`observedLinkCovered`遇中心在viewport外直接false；后续Playwright滚动后，仍在被卡片内容遮挡的中心重试。完全相同本地卡片offset0成功导航，offset1400仍pointer-events超时。应处理滚动后的命中检测，不加force或重试层。
2. **新label优先级覆盖可见动作文字**。`<button name="action" value="slot-20">20:00</button>`被观察为label action，而不是20:00；placeholder/name仅应合理补足缺失输入标签，不覆盖按钮/链接可见文字，避免同时影响动作安全标签检查。

挑战脚本 `/private/tmp/praxis-shared-review-probe.mts` 与结果 `/private/tmp/praxis-browser-shared-review/probe-results.json`。全部请求本地route.fulfill；超时缩为1200ms节省复验，原默认30秒。首次脚本语法错误未运行浏览器，修正后的exit0结果才为证据。两问题已发回同一Sol chat继续修复，禁止新网络/模型/Live；最终验收仍待修后复审。

搜索框目前只有生产原生fill能力和类型投影，模型wire没有自由搜索文本动作。实施者已明确报告，本轮不扩展该动作，也不把这项局部改动称为模型搜索整链通过。


## 二次修复独立反例复验

主chat重新运行 `/private/tmp/praxis-shared-review-independent-green.mts`，与原挑战相同的本地请求拦截及1200ms超时。offset0与1400均进入同一已观察href，buttonLabel均为20:00，exit0。新文件 `/private/tmp/praxis-browser-shared-review/probe-results-independent-green.json` 为主chat修后证据。原 `probe-results.json` 已被实施者重跑覆盖为绿，不再是修前红文件；原失败事实保留在本审查首段与主chat工具输出，不能以覆盖后的文件冒充原始红产物。已提醒后续产物使用新文件。

新增用户验收范围：H001、H002、H003、H005仅浏览器执行切片，不跑完整Live。已要求Sol在最终门禁后交权威输入、已有覆盖与缺口、去重后实际入口/命令/预算给主chat审核。当前尚未执行该新增跨Case验收；上述两反例转绿不等于全部任务签收。

## 四 Case 浏览器切片运行前复核

主chat发现初版runner只保留计数/summary，无法核查再次UNKNOWN的控件观察与动作，已要求改为保存完整模型投影、按序诊断、Adapter请求/结果及脱敏snapshot/controls。复核时另移除诊断包装额外调用snapshot的动作，避免改变实际时序。复用已有startDiagnosticRun保留独立started/result，不建设新框架。

2026-09-29 14:01 UTC主chat独立执行四个plan及typecheck通过；运行目录尚无外部artifact。H002=Oct3 18:30/2，H003=Oct2 17:30–22:00/10，H005执行开始Tokyo分钟/4、EXACT_ONLY。用户明确允许H001改明晚，故显式--h001-tomorrow固定Sep30 19:00/2，保留原请求并标为诊断变体。此时已放行Sol按H005→H002→H003→H001各一次，单次45s/5模型调用/provider30s，合计最多180s/20调用，不自动重试。来源入口和适用限制见BROWSER-CASE-SLICE-PLAN；本段仅为运行前复核，不是结果签收。

## 四次真实浏览器执行：独立初审，尚未签收

主chat逐项读取 `.eval-artifacts/browser-case-slices/` 中的result与trace，总耗时77,048ms、9次模型调用，四次均无可接纳Offer。不是四个完整Case/Live通过。

| 切片/runId | 实测 | 独立证据结论 |
|---|---|---|
| H005 e0b29fff-32ad-48ca-8a28-9565afa861e0 | 20,117ms / 0 calls | 首次0711详情goto等待domcontentloaded20s超时，尚未进入控件，不能只凭此判网络根因。 |
| H002 6c7e6767-8ef2-477b-9e8e-9a89531fd007 | 24,037ms / 5 calls | 翻十月成功；controls seq55/59的Oct3 disabled=false，seq78/89/100变true。初次正确动作因新鲜度拒绝，之后禁用按钮从模型目标投影消失，模型继续提出其他日期的错误动作并被拒，最后耗尽模型调用。不能把日期不可选等同精确无位，也无证据称旧nth绑定错误复发。 |
| H003 291345cf-306a-4238-9da7-ded2c1f9aa83 | 28,838ms / 4 calls | 日期Oct2动作成功、10人CHOOSE_OPTION返回；WAIT_FOR_CHANGE占第24操作，未进行新snapshot/controls回读便结束。静态核查operation()达到24后在try前抛BROWSER_TIMEOUT，故当前结果不是导航超时，也不足确认人数/库存。 |
| H001 Sep30变体 28ad4446-3628-4bd4-a340-912af9593bd6 | 4,056ms / 0 calls | 正确Teppen页面title/正文到达，但ENTITY_MATCH_UNCERTAIN，未进控件；本轮runner未接identity diagnostic且不保留完整HTML，不能反推失败的具体解析字段。 |

已续派Sol按现有trace/旧合法样本离线定位共享禁用观察与操作预算/停止归因，不能扩24操作/时间或另跑模型。H001保持identity接纳冻结，只核查缺证和诊断接线。诊断包装曾把waitForChange参数中的rawHTML写入H002本地产物，实施者清理时须注明脱敏修改与hash，保留失败语义；不将清理后的文件冒充未修改原始文件。

## 14:22 UTC后离线续审

主chat独立重跑 `browser-task-executor.test.ts` 中disabled只读/拒绝点击及post-action观察复用两项，2/2通过。H001新runner的`en/tokyo/A1303/A130301/13308491`已对照生产parser `sourceEntityId(sourceUrl)`（去域名和末斜杠）一致；原bare数字输入会无条件SOURCE_REF_INVALID，属于测试接线错误，不应改生产identity规则。已独立复现bare失败与完整路径正常对照。

未签收新增H003四动作Chromium测试：直接navigate→runSkill绕过生产Adapter初始身份/读取开销，旧实现预计也能在24操作内完成，不能捕获原故障。已要求替换这条测试为实际TableCheckBrowserAvailability组合，保留正常后置状态oracle，并用隔离修前逻辑证明目标断言为红。不手工空耗操作制造失败，不新增重复矩阵。当前无新外部/模型运行。

## 14:30 UTC 实际 Adapter 组合独立复验

主chat独立运行现有Chromium测试 `four-action date and guest|selects Tabelog paragraph`，3/3通过（13.10秒）。四动作测试现经 `TableCheckBrowserAvailability.check` 完整入口，同源确认、查询、最终接纳结果均在原24操作上限内；独立页面读回确认日期与10人。两个既有Tabelog对照仍保留正常请求操作及不伪造库存断言。此为本地合成Fixture＋脚本模型决策，不是原Live DOM回放或真实模型复跑。

主chat比较隔离目录 `/private/tmp/praxis-browser-red.fK1C4r/` 的executor与工作树：唯一差异为禁用动作后观察复用。核对 `/private/tmp/praxis-browser-four-action-red2.log`，相同实际Adapter场景四次决策、24次操作后为UNKNOWN/BROWSER_TIMEOUT，诊断明确 `BUDGET_EXHAUSTED / OPERATION_BUDGET_EXHAUSTED`；目标AVAILABLE断言失败。故该反例能捕获重复观察消耗预算，非额外空耗或构建失败凑红。准确预算诊断仍保留在隔离副本，因此这不是完整旧版本回归，而是旧重复观察行为的检错对照。

实施者最终日志已核对：Chromium54/54、默认561/561。最新typecheck/arch/build与交付同步待实施者交回核验。当前仅签收上述定向离线复验，不改四次真实来源失败记录；H005导航根因、H002真实禁用日期后的模型收尾、H003真实请求/库存闭环、H001修正runner后的真实执行仍未验证，不自动重跑。

## 本轮离线签收与外部边界

Sol交回后，主chat再次独立执行typecheck、arch:check、build、git diff --check，全部通过；核查STATUS、DEVLOG、TEST-LOG及四Case报告已同步。结合本轮增量审查、独立2项单元与3项实际Chromium组合、前述遮挡/标签反例，签收本轮共享浏览器离线修复及runner接线修正。禁用控件仍不可执行；旧引用仍经运行时新鲜度检查；请求与库存接纳未放宽，24操作及超时均未扩大。

失败与未覆盖不撤销：四次真实网站切片均未产出Offer；H005导航失败根因未证实，其余三项修复尚未外部复验，自由搜索模型wire未覆盖，H001/完整Playbook不宣称通过。当前授权内离线工作已完成，下一道验证需要新的有界真实浏览器/模型授权；暂停监控以免自动消费或空转，不自动重复四Case或完整Live。无commit/push。

## 2026-09-30 真实复验后的续修审查

本轮新基线 `/private/tmp/praxis-loop2-baseline.kOBT7A/`；旧dirty不计新成果。独立读取9月30日H003 `c171c1f4`：前置7操作，第一次人数展开的模型投影只有1–8，滚动区域文本含9/10/10+；此后改日期、重新打开人数和选择10，最后选择占第24操作。不能将此简单归咎于模型无意义绕路。H001 `a28db7af` 同源HIGH已通过，但可见人数禁用，正文2人无位缺少选中日期与时间绑定，本轮不改UNAVAILABLE接纳。

续修共享executor先执行动作后新snapshot/controls，只有未见变化或选项未确认才再等待并回读。仍由原completion/owner/value/来源请求绑定判断成功；不改变预算计数或24上限。精确人数拒绝10+，避免把范围选项当10人。既有主Chromium场景改为起始同时有日期/人数入口的五动作，人数列表前后可见差异为按已有观察构造的合成条件，不证明真实DOM变化因果，不是实时模型或真实响应Replay。

主chat独立五动作actual TableCheckBrowserAvailability测试1/1通过（约1.04秒）；另跑现有异步选项、未确认时间及三种引用变化5/5通过（约9.87秒），证明必要异步确认与旧引用拒绝未因按需等待被删除。独立typecheck/arch/build/diffcheck通过。已核隔离强制等待对照为4决策/24操作、UNKNOWN/REQUEST_SELECTION_UNCONFIRMED，AVAILABLE目标断言红；它不是原Live“第五次点击后停”的逐字重现，不这样汇报。最终完整门禁及实施交回仍待核对。

## 2026-09-30 H001 诊断记录续审（未签收）

Sol前轮仅完成归因文档，没有修复H001操作或库存读取。当前实际新增 `browser-case-slice-evidence.ts` 并接入browser-case-slice Runner，尝试保存脱敏预约区域结构；只视为诊断能力修复，不是H001查位通过。

主chat在当前增量发现两处再次丢证据：Runner按CSS类名筛选Tabelog controls，可能丢掉合法预约入口与无约定class的控件；区域markup过滤移除hidden/aria-hidden/显示状态，且没有祖先可见性，不能据此区分当前区域和隐藏未来日历。已退回同Sol要求保留完整脱敏controls及安全可见性事实，不能用类名过滤代替字段脱敏。现测试直接调用snapshotRecord后写journal，未覆盖实际Runner的SNAPSHOT/CONTROLS包装；要求复用真实记录包装路径增强现主测试，不增加测试矩阵。旧artifact缺字段的红只证明记录不足，不证明生产库存实现修前失败。

实施者仍active。当前不新跑网络/模型，不修改旧artifact或库存接纳；等待这些具体反馈修复后独立复验，再判断定向采证所需的明确缺口。

02:57 UTC后独立复核：Runner已调用提取后的 `traceBrowserSession`，控件记录不再按CSS类别删除，snapshot与controls以序号关联。区域增加ancestorMarkupHidden，静态DOM不能证实的computedVisibility明确UNKNOWN。主chat独立运行 `node --import tsx --test src/eval/restaurant/agent-loop/browser-case-slice-evidence.test.ts`，2/2通过；主测试经该实际trace包装及journal写出，保留旧Teppen查询区域与完整控件集合。测试BrowserSession/被动响应是合成输入，DOM来自保存样本；此为记录路径离线验证，不是真实Chromium或新来源回放，不证明当前无位或操作修复。实施者仍在最终门禁与定向采证计划准备中，尚未签收本轮。

03:02 UTC后主chat独立复验recorder/probe现有6项测试6/6通过；另执行本地真实Chromium既有saved Tabelog calendar主场景1/1通过（约941ms），确认实际浏览器snapshot/controls经同一trace包装保留查询区域、全部观察控件和关联序号，隐藏未来日期与禁用人数仍未获得操作权限。没有访问新来源或模型。已静态核对新增probe只导航一次、被动订阅既有vacancy响应、初始/等待后观察，30秒上限，不点击/填写；准备命令见H001-TEPPEN-QUERY-CAPTURE-2026-09-30.md。该命令尚未执行，需当前来源授权；本轮记录修复不等于H001库存或控制修复，Sol最终交回及门禁记录仍待核。

## H001诊断切片最终独立结论

Sol最终交回后，主chat独立typecheck、arch:check、build、diffcheck均通过，核对最终默认套件日志564/564通过。结合前述独立6项记录/probe测试及本地Chromium1项，只签收“诊断记录缺口修复”：真实观察到的查询区域、控件及允许的被动库存绑定字段可留存。没有签收H001真实查位修复，旧Teppen样本不足确定当前日期/人数/19点结果范围。

已审单次30秒零模型的现有read-probe命令：默认LOCAL_CHROMIUM、原Teppen详情入口、仅导航及被动观察，不操作预约、不重新跑H001。现有授权限定离线，因此等待用户明确许可该次新来源读取，暂停自动监控防止空转；收到许可再恢复。不将等待许可记录为任务完成。无commit/push。

03:17 UTC后目标日期归因增量初审：新tabelogRequestedDateState按预约calendar年月caption与日格读取CLOSED/FULL/PHONE_ONLY，排除标记隐藏的月份；Adapter仅在既有受限判定分支返回具体UNKNOWN reason，不提升库存结论或给予日期点击权限。主chat独立保存DOM及既有正常Tabelog日期/人数Chromium对照3/3通过；另独立实际Adapter loading→restricted测试通过，结果UNKNOWN/TABELOG_REQUEST_DATE_CLOSED_ON_CALENDAR、零Offer且不调用模型。此为保存DOM+合成身份/加载条件的本地组合，不是真实模型或新来源复跑。Sol仍active，最终门禁/交回待核。

03:22 UTC后：主chat独立typecheck/arch/build/diffcheck通过，核对Sol最终Chromium54/54与默认564/564日志。当前仅可签收目标日期受限原因的离线接线和既有正常查询不退化；它不新增可订结果，不等于完整找位任务闭环。实际Adapter在旧保存DOM组合中返回具体UNKNOWN原因，当前真实源只有此前单页probe，修后来源Adapter/真实模型未复跑。Sol尚active收尾，等待最终交回后记录范围完成与未覆盖。

随后已收到Sol最终交回（turn 01a0f04b-a567-7f03-849b-0d2293546198 completed），上述代码与门禁未再变化。本次目标日期受限归因离线切片签收；H001真实查位及实际交付未签收。现有新来源次数已用完，暂停自动监控防止无授权重跑；后续应验证正常可操作门店的模型查询，而非反复尝试Teppen关闭日期。
