# F5 Live结果：停止点3材料（批次未完成）

- 时间：2026-10-25T02:41:15.046407+01:00；固定CET（UTC+1），原始UTC记录保留。
- Evidence status: exposed development evidence / draft, not integrated；不是Clean Baseline。
- 分支：codex/fix-phase3a-prime-f5-provisional-entrance。未合并、未推送main。

## 1 结论与分母

计划6槽，6个受控Runner均已调用，只有5个进入正式Live。槽6预检Tabelog返回HTTP200，但CHECK_TIMEOUT；因环境重跑余额0而以F5_ENV_RETRY_LIMIT结束，未开始语义、Google或正式任务，也没有录制。不能写成6次Live完成。停止点3所需的完整6次及验收尚未达成，现按额度停止，等待复核。

- 例01：合格交付0/3，失败。槽1外层TIMEOUT，槽2轨迹AGENT_LOOP_TIMEOUT，槽3有界结束但没有交付。
- 例03：槽4经独立输出复核符合有界负例口径（439.498秒）；槽5TIMEOUT；槽6正式NOT_RUN。整批“不超时”未满足，用时只记录，不套用降低要求。
- 5次正式Live的S0声明、边界均独立评为ABSENT，PRESENT=0。预检槽6无声明输出，但缺完整请求派发证据，边界NOT_EVALUATED，不能补成第6次S0=0。
- 5份实际录制均用F2④b ORIGINAL尝试回放，全部REPLAY_INCOMPLETE；真实模型0，无网络回退。

自动Evaluator34/rubric30产物不改分。它将槽1、5外层TIMEOUT排除通用能力分母；本批仍保留全部计划槽位及超时失败，不以排除缩小用户验收分母。槽4自动NOT_EVALUATED保留，另附Codex原始语义／输出复核，不冒充自动通过。机器汇总见[aggregate.json](aggregate.json)。

## 2 基线、冻结、日期与授权

旧763a2262以stop2 annotated tag保留，随后重放到最新main/4d9279583299e798f43cace277b84700617635ce。双方账本原7＋2条及双方历史记录均保留，见[重放审计](rebase-audit.json)。355a5547五门禁全绿（默认1046、Chromium154），各项前后净树。此后产品、Runner、测试、Prompt、Schema、Guard、站点和package相对该门禁提交零新增差异。

执行包8b39bd76固定348项，freeze SHA-256为 0201de495ab4b5ad994bb9ce6c321a36a7044387f8b4a258dfbc6d0b3308269a，6个Runner均引用此SHA。严格Loader与逐字DATE替换校验通过：例01为11月4日周三19:00两人；例03为11月7日周六19:30两人、每人最多JPY10000。10月25日分别+10、+13天，均在7–14天窗口，正文保持已批字节，未改Gold。

每次500000ms、50实际模型、40Google；LOCAL_CHROMIUM、临时profile、no-proxy、录制及决策捕获开启，无人工介入。单案例进程串行，前槽独立安全门通过才启动下一槽；Google计数含预检。两次300秒环境等待未缩短，也未重置正式预算。六个子进程的.env加载来自用户直接窄授权，见[授权记录](credential-authorization.json)；未独立读取、展示、复制或暂存运行凭据，6/6授权调用已用完。

Live前24小时内Dengana公开详情＋四参数find_vacancy共2GET均200，间隔5.010182秒，身份、201.545m、Kushi-age及11-04 19:00两人WITNESS_EXISTS，见[原始认证](certification-prelive/certificate.json)。本批没有实际交付门店，故交付后GET为0，五份post-check均为空计划，没有跳过已有交付的核验。

## 3 每槽结果与实际资源

|槽|例|正式开始CET|正式秒|含预检墙钟秒|模型|Google|环境重试|实际结果／验收|
|---|---|---|---:|---:|---:|---:|---:|---|
|1|01|01:31:48|500.338|530.169|43|5|0|外层TIMEOUT，无交付／FAIL|
|2|01|01:54:26|500.333|1150.099|42|8|2|AGENT_LOOP_TIMEOUT（外层SUCCEEDED），无交付／FAIL|
|3|01|02:05:27|399.728|430.677|47|6|0|有界无合格交付／FAIL|
|4|03|02:14:35|439.498|472.557|47|4|0|有界无结果／独立负例复核PASS|
|5|03|02:25:03|500.496|525.280|39|7|0|外层TIMEOUT／FAIL|
|6|03|—|NOT_RUN|10.611|0|0|0|预检ENV_FAILURE，正式NOT_RUN|

槽2不能仅凭外层SUCCEEDED判断不超时：trajectories[9].observation明确AGENT_LOOP_TIMEOUT。槽6预检10.611秒与正式500秒不是同一段，没有正式任务可补评。逐槽评价、人工复核、安全门在slots/N/；槽6gate=false，预检证据缺口另列。

## 4 独立四层评价与见证漏斗

结果层如上表；环节层逐次保留语义、地点、发现、身份／事实、查位、决策与结束。严重程度层：5正式槽S0两项ABSENT，例01三次有独立可行见证而未交付，S2均PRESENT；其他未评维度不补0。归因层区分可证的调度阻断、实际失败码与未经反事实的假说。完整材料：[槽1](slots/1/manual-review.json)、[槽2](slots/2/manual-review.json)、[槽3](slots/3/manual-review.json)、[槽4](slots/4/manual-review.json)、[槽5](slots/5/manual-review.json)、[槽6预检](slots/6/independent-evaluation.json)。

|例01槽|Tabelog原生发现|Dengana跨来源发现|身份／事实|查位原因|展示|
|---|---|---|---|---|---|
|1|2个有效坐标样本越界，0接纳|独立店名＋地址对照Google候选FOUND|Tabelog同店／HARD未建立|BROWSER_TIMEOUT|NO|
|2|2个有效坐标样本越界，0接纳|独立店名＋地址对照Google候选FOUND|Tabelog同店／HARD未建立|ENTITY_MATCH_UNCERTAIN|NO|
|3|2个有效坐标样本越界，0接纳|独立店名＋地址对照Google候选FOUND|Tabelog同店／HARD未建立|BROWSER_TIMEOUT|NO|

自动见证漏斗NOT_FOUND原样保留：冻结oracle缺完整地址，严格店名＋地址匹配无法对上。人工另用原始详情1-15-1 新仲ビル1F与Google候选Akabane 1-chome15-1 Shinnaka1F及坐标核对同店；电话只作旁证。见证原圆心Akabane Station与运行采用的Google Akabane地名圆心分别保留，Dengana在两圆1000m内，没有改用户地点。

例01三次均取得两样本：约5.547km向南、3.911km向西南。来源累计49.616／52.966／33.204秒，地区页2、详情2，已观察入口集合39项；但没有regionCorrection模型上下文或SELECT_REGION_ENTRANCE动作。计划把Tabelog纠正排在Google之后，Google批次进入后，根Agent真实合法动作search=false，原因NATIVE_FIRST_BATCH_PENDING，因而未回到纠正阶段。该直接阻断有[逐步上下文证据](correction-access-audit.json)，不是模型收到方位反馈后拒绝纠正。解除阻断能否交付尚无反事实证明，也不能从两样本断言整区全越界。离线G3四页机制通过，不能替代本批尚未到达的Live纠正链路。

|槽|最远记录候选（示例）|独立支持性结果|HARD／完成边界|
|---|---|---|---|
|1|Kawaei|UNAVAILABLE|当前事实记录UNKNOWN；非独立HARD成立证明，均未展示|
|2|やきとん大王 赤羽店|OFFER_GROUNDED|当前事实记录COMPLETED；非独立HARD成立证明，均未展示|
|3|やきとん大王 赤羽店|OFFER_GROUNDED|当前事实记录UNKNOWN；非独立HARD成立证明，均未展示|
|4|Yakiniku Story Suidoubashi ten|OFFER_GROUNDED|当前事实记录UNKNOWN；非独立HARD成立证明，均未展示|
|5|Jidai Sushi|OFFER_GROUNDED|当前事实记录COMPLETED；非独立HARD成立证明，均未展示|

所有候选原始引用链及逐项结果在各槽independent-evaluation/candidateSummaries中；上表只定位最远记录，不用生产check标签自证事实。没有独立Gold的环节保留NOT_EVALUATED。

例03保留Kudanshita／人工核对800m；800–1000m环带未知，没有已认证全球无见证。槽4另行语义对照确认fugu restaurant HARD、原文纪念日晚餐UNSPECIFIED、日期人数时段和JPY10000上限保真；输出列明未读／未知和fugu缺证，仅称本次未得到足以呈现的结果，并明确不代表每家都无座。持久Agent的NO_VERIFIED_RESULT摘要采用相同有界句式（persistent-restaurant-agent.ts:196），本批复核保存的Runner输出，未新增WebUI实验。故仅按用户负例口径通过，调查充分性、全局穷尽和用餐目标完成仍未证明。槽5没有完成这种输出，不能把超时算作正确无匹配；槽6未运行。

## 5 时间分解、首次合格与展示

单位秒。按实际OPERATION_STARTED/FINISHED/FAILED、同来源／候选／阶段配对；模型区间优先覆盖嵌套操作，墙钟分段不叠加。无法归因及未配对操作保留，不是关键路径DAG证明。补充测量不覆盖原冻结analyze结果：槽1见supplemental-metrics，槽2–5见observation-supplement。

|槽|加载|读页面／控件|等待|页面操作|模型墙钟贡献|未归因|未配对项|
|---|---:|---:|---:|---:|---:|---:|---:|
|1|164.711|30.181|48.754|5.845|174.620|76.227|11|
|2|240.728|28.748|50.574|4.150|124.456|51.677|8|
|3|103.729|30.178|39.880|5.210|142.086|78.645|10|
|4|144.786|76.188|24.861|2.794|149.579|41.290|10|
|5|202.848|31.366|37.707|2.180|108.174|118.221|11|

会话启动未单独测量，包含于未归因，不填0。navigate次数／记录URL字符串重复次数：槽1 42/24；槽2 49/26；槽3 41/23；槽4 35/22；槽5 65/32。部分查询值未完整保留，重复只描述日志字符串；重复加载独占耗时缺稳定会话／调用关联，NOT_EVALUATED，不以总加载时长补造。预检另计：槽1 29.368秒；槽2 648.858秒；槽3 30.189秒；槽4 32.416秒；槽5 24.231秒。槽2含两次300秒等待。

模型用途为次数／记录延迟秒；延迟可能与嵌套墙钟区间重叠，不能再与上表相加。

|槽|浏览器决策|Agent|检索表达|事实判断|语义|
|---|---:|---:|---:|---:|---:|
|1|23 / 108.129|9 / 31.466|4 / 18.551|6 / 16.095|1 / 3.474|
|2|19 / 56.581|10 / 30.591|4 / 15.721|8 / 17.078|1 / 4.485|
|3|27 / 81.725|11 / 40.503|4 / 9.190|4 / 10.369|1 / 3.172|
|4|25 / 81.386|10 / 37.444|4 / 10.071|7 / 16.044|1 / 4.634|
|5|15 / 45.969|10 / 29.999|4 / 9.149|9 / 18.829|1 / 4.228|

五次没有已独立核实且实际交付的合格证明集，首合格时刻未建立、positive展示均无；不据此推断所有未展示真实门店都不合格。记录的有界结束时刻：槽3 02:12:06、槽4 02:21:54 CET。槽2虽有NO_VERIFIED_RESULT，其termination=TIMEOUT，不算正常负例输出。槽6正式时间指标NOT_RUN。

## 6 录制与F2④b原样回放

按页资格与实际回放分开；按页合格不保证完整HAR存在。

|槽|按页合格／总页|缺静态依赖|不安全页|诊断DOM保存／总页|实际ORIGINAL|
|---|---:|---:|---:|---:|---|
|1|7/101（6.93%）|92|2|99/101|[REPLAY_INCOMPLETE](slots/1/replay/replay.json)，0/101页|
|2|7/107（6.54%）|98|2|105/107|[REPLAY_INCOMPLETE](slots/2/replay/replay.json)，0/107页|
|3|7/103（6.80%）|96|0|103/103|[REPLAY_INCOMPLETE](slots/3/replay/replay.json)，0/103页|
|4|72/105（68.57%）|33|0|105/105|[REPLAY_INCOMPLETE](slots/4/replay/replay.json)，0/105页|
|5|9/113（7.96%）|104|0|113/113|[REPLAY_INCOMPLETE](slots/5/replay/replay.json)，0/113页|

五次均在首个Google places.googleapis.com/v1/places:searchText处MISSING_STRUCTURED_RESPONSE，消费2条录制决策后停止；真实模型0，OS禁止出站，无网络回退。槽6无录制，回放NOT_RUN。

录制开关已开启，实际HAR因KEY_PATTERN_BEFORE_WRITE未落盘。前三份按页合格的Tabelog详情Replay HTML在img[data-lazy-src]保留来源地图图片URL中的Google-key形态字面量，整包合并Google响应后被扫描拒绝。这是可证的充分拒绝原因，见[HAR审计](har-capture-audit.json)，报告不显示字面量，未与.env比对，不表示运行凭据泄漏。即使解决整包丢失，尚有未审核静态依赖，不能据按页数字声称完整回放通过。未重造丢失响应、未改录制器或扫描规则。

每槽metrics.json的uncapturedScriptOriginPaths保存完整列表，均仅origin+path、无query。合并清单24项：

- `https://assets.adobedtm.com/3687940b53f7a560587a33c8bb748b9253ff5ea9/satelliteLib-15b13f3fd03e00e11fcd40b9f97c8b58a9ca6e66.js`
- `https://browser.sentry-cdn.com/6.18.2/bundle.min.js`
- `https://static.parastorage.com/services/pro-gallery-tpa/1.1535.0/WixProGalleryViewerWidget.bundle.min.js`
- `https://static.parastorage.com/services/tag-manager-client/1.1075.0/siteTags.bundle.min.js`
- `https://static.parastorage.com/services/wix-thunderbolt/dist/main.693e1c6a.bundle.min.js`
- `https://static.parastorage.com/services/wix-thunderbolt/dist/main.renderer.b325a058.bundle.min.js`
- `https://static.parastorage.com/services/wix-thunderbolt/dist/thunderbolt-commons.edd84710.bundle.min.js`
- `https://static.parastorage.com/unpkg/lodash@4.18.1/lodash.min.js`
- `https://static.parastorage.com/unpkg/react-dom@18.3.1/umd/react-dom.production.min.js`
- `https://static.parastorage.com/unpkg/react@18.3.1/umd/react.production.min.js`
- `https://tblg.k-img.com/javascripts/assets/pepper/restaurant-pc/commons.js`
- `https://tblg.k-img.com/javascripts/assets/pepper/restaurant-pc/rst/inbound/inbound_restaurant_detail/index.js`
- `https://tblg.k-img.com/javascripts/assets/pepper/restaurant-pc/rst/inbound/inbound_restaurant_detail/menu.js`
- `https://tblg.k-img.com/javascripts/assets/pepper/restaurant-pc/rst/inbound/inbound_restaurant_detail/top.js`
- `https://tblg.k-img.com/javascripts/assets/pepper/restaurant-pc/rst/inbound/inbound_restaurant_list/index.js`
- `https://tblg.k-img.com/javascripts/assets/pepper/restaurant-pc/rst/inbound_restaurant_list.js`
- `https://tblg.k-img.com/javascripts/assets/sentry_initializer.js`
- `https://tblg.k-img.com/javascripts/lib/jquery-3.4.1.min.js`
- `https://tblg.k-img.com/javascripts/lib/jquery_ujs-3.4.1.js`
- `https://tblg.k-img.com/javascripts/s_code.js`
- `https://umami-next.post.tablecheck.com/script.js`
- `https://www.1bangai.org/_partials/wix-thunderbolt/dist/clientWorker.1634c378.bundle.min.js`
- `https://www.tablecheck.com/portal/assets/index-DUt7bgp8.js`
- `https://www.tablecheck.com/portal/assets/index-m1GDPVCL.js`

列表来自实际已观察脚本；未到达、危险省略页或未捕获流量不推定为空。

## 7 未使用的Akabane控件

捕获的浏览器决策上下文中未观察到合法LOCATION绑定目标；不能据此声称所有页面不存在：槽1、2各有2份危险文档诊断省略，属于证据缺口。槽2、3各观察到Akabane Sta.（Nearest station组）和Akabane Sta. Izakaya两类真实链接，在两次决策中各可见，共4次出现。均列OPEN_LINK，模型改做Next month／DATE，未使用这些链接。它们出现在AVAILABILITY详情页，不证明初始DISCOVERY共享层漏控件，也未观察到800m／1000m筛选选项。href取自实际控件，未拼造站码、类别码、URL。

精确targetRef、revision、控件href、实际动作和DOM SHA：[槽2审计](slots/2/unused-control-audit.json)、[槽3审计](slots/3/unused-control-audit.json)。

|槽|决策／revision|阶段|精确诊断DOM|
|---|---|---|---|
|2|31 / 5|AVAILABILITY|[snapshot-84](../../recordings/hybrid-1792889665999/diagnostic/snapshot-0084.html)|
|2|32 / 6|AVAILABILITY|[snapshot-85](../../recordings/hybrid-1792889665999/diagnostic/snapshot-0085.html)|
|3|38 / 4|AVAILABILITY|[snapshot-85](../../recordings/hybrid-1792890327478/diagnostic/snapshot-0085.html)|
|3|39 / 5|AVAILABILITY|[snapshot-86](../../recordings/hybrid-1792890327478/diagnostic/snapshot-0086.html)|

## 8 直连排查与停止原因

项目从开始即使用--no-proxy，健康检查也接收清空项目代理后的环境。用户随后明确要求尝试直连，因此另冻结采集器后执行1次公开GET：HTTP200、3.658948秒、286733字节，无Cookie、代理、重定向或模型。原响应、SHA和授权单独入账，见[直连报告](direct-diagnostic/report.md)。这只证明本次HTTP文档连通，不冒充浏览器JS或查位成功。

本地构造（不是网站回放）复用实际健康函数及既有fixture timeout override=1000ms：相同保存页面，快快照3次HEALTHY，末段snapshot多220ms后3次CHECK_TIMEOUT，0网络／模型／Live。生产保持10000ms；剩约100ms才判就绪与总计时器竞争的机制得到演示。现场缺snapshot起止记录，因此具体两次及最后一次根因仍为HYPOTHESIS。槽2两次HTTP200／CHECK_TIMEOUT后不改配置第三次通过；槽6首次HTTP200仍CHECK_TIMEOUT，重试余额0，按限额停止。没有第7次Runner、额外.env加载、追加Live或产品目标变更。

## 9 预算、验证与待复核项

共享账本原9条逐条保留。实际累计：正式Live5/8（F5计划≤6）、真实模型218/400（F5≤300）、Google30、环境重跑2/2。每槽模型最高47≤50，Google最高8≤40。评测侧公开GET累计5＝stop2旧2＋本批预认证2＋用户另批直连1；交付后GET0，例03可选GET0。Live浏览器响应另在transport和原trace保存，不能把GET账本5当作全部网站流量。

已核验348项冻结文件与HEAD、5份录制tar内全部文件SHA、25份原始gzip内容SHA、五门禁日志、逐槽结束／安全复核后的串行启动。两个站点目录生产3864行、source-packs.ts473行，逐文件与新main字节相同。产品、测试、Runner等源码相对门禁355a5547无新增差异，故按Test矩阵不为纯输出再跑门禁；不把离线绿灯冒称Live成功。提交前diff检查、最终净树和远端SHA另存交付核验。

本批只提交本分支，等待复核，不实施后续修复。最小待复核切片：健康检查末端观察／截止合同；F5纠正与NATIVE_FIRST_BATCH_PENDING交接；录制器局部资产拒绝与Google响应保留。完整Live纠正、例03最后一槽与完整回放仍未完成。OPTIONS分类、通用列表自动回退只记F3候选，店名／门店匹配保留3b，不在本批修。

[冻结与中途记录（历史）](preparation-and-progress-report.md) · [完整汇总](aggregate.json) · [预检停止记录](STOP-ENV-BUDGET.json)
