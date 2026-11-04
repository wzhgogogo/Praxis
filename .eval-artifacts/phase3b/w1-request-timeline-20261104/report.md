# W1 逐请求真实测量（最多8次）

2026-11-04 CET（UTC+01:00），工作分支 `codex/fix-tabelog-page-timeout`。current exposed diagnostic，非任务/模型能力评测，不计合格交付或S0分母。**本批8/8次全部完成、均HTTP200，未复现旧的资源策略3/3导航20秒超时；旧故障根因仍未知。本批没有产品修复，不合main。**

## 已执行配置

固定W1 `https://tabelog.com/en/tokyo/A1323/A132305/13108466/`。HTTP单GET2次、main Guard3次、资源策略3次，均不重试/点击/提交表单；浏览器每次全新临时context/profile。两客户端均显式使用同一代理127.0.0.1:10808，TLS校验不放宽，无.env/模型/Google调用。curl禁用个人curlrc，不跟随重定向；HTTP组为HTTP/2，浏览器151.0.7922.34，User-Agent与curl不同。相邻读取完成至下次启动最小间隔10.005秒，所有实际读取未与门禁并发。

A的 `traceBrowserRuntime` 及直接依赖按main22415b57原样临时加载，两组使用同一入口；main Guard/LocalRuntime仅重定位imports，主体字节核SHA，资源组使用17b1cdc6产品源码。A/C源码未改。脚本和main源码依赖见freeze.json；真实读取均在75d118f3冻结版本执行，之后统计脚本单独冻结，不改采集原件。先完成本地fixture的HTTP/main/资源三种接线，确认文档headers/end、DCL/load、A请求和Guard传输字段、导航结果及标题都进入实际文件。

导航时限维持20000ms；先观察DCL，再在同一20s窗口内观察load，然后最多500ms本地页面检查并关闭。原始trace分为关闭前和包含关闭生命周期的完整版本。DCL/load的被动Page CDP事件与Network协议时钟一致；逐请求按A requestId关联，不按URL/order拼接。Guard route.fetch是独立API传输层，不与CDP相加成唯一源站请求数。原始A时间字段保留协议输出；报告时间显示CET。

## 文档与页面时间（秒）

|组/次|开始CET|真实首字节|CDP headers观察|文档结束*|DCL|load|文档状态 / 导航结果|
|---|---|---:|---:|---:|---:|---:|---|
|HTTP 1|2026-11-04T02:28:38+01:00|1.799|未知|2.558|不适用|不适用|200 / COMPLETED|
|HTTP 2|2026-11-04T02:28:51+01:00|1.453|未知|2.040|不适用|不适用|200 / COMPLETED|
|main Guard 1|2026-11-04T02:30:32+01:00|未知|1.631|1.629|3.663|6.997|200 / COMPLETED|
|main Guard 2|2026-11-04T02:30:50+01:00|未知|1.678|1.676|5.823|9.490|200 / COMPLETED|
|main Guard 3|2026-11-04T02:31:09+01:00|未知|1.623|1.621|4.064|7.191|200 / COMPLETED|
|资源策略 1|2026-11-04T02:32:26+01:00|未知|1.663|1.661|3.866|3.909|200 / COMPLETED|
|资源策略 2|2026-11-04T02:32:40+01:00|未知|1.496|1.493|3.621|3.621|200 / COMPLETED|
|资源策略 3|2026-11-04T02:32:54+01:00|未知|1.647|1.645|3.943|3.944|200 / COMPLETED|

*HTTP结束为curl time_total；浏览器结束为CDP Network.loadingFinished。两层并非同一物理观察点。HTTP两份正文均141493字节且SHA相同；浏览器未保存HTML正文，不能声称跨客户端HTML逐字相同。

**浏览器物理首字节未知。** A的NETWORK_RESPONSE_HEADERS使用CDP responseReceived观察时间，不是源站线上首字节；本批6个文档中它比loadingFinished晚约2–3ms，原始字段如实保留，不能当成物理收包顺序，更不能用min()/改时戳凑顺序。要补真实首字节需Net response timing或Guard传输头部/字节观察，目前未采到；不改A文件。curl time_starttransfer是HTTP组的首字节指标，包含代理连接/TLS等开销，不是纯服务器处理耗时。

main DCL中位 **4.064s**，load中位 **7.191s**；资源策略分别 **3.866s / 3.909s**。3+3顺序小样本，DCL差约0.20s，不能据此宣称稳定提速或解释前批20s超时。

全部标题一致：`Kushi Katsu Dengana Akabane ten Reservation - Akabane/Kushi-age (Deep-fried skewers) | Tabelog`。同既有来源规则的可见标题/文本检测busy=false、challenge=false；这些是本次检测结果，不是反自动化处理不存在的证明。HTTP两次不是浏览器，DCL/load不适用。

## DCL之前最后结束的请求

以下严格按浏览器协议时间排序。左列包含失败的图片/字体；右列额外列出同主frame最后成功完成的Script/Stylesheet，供判断候选等待。**“最后结束”不等于造成阻塞。** 原始完整URL仅SHA，明文去query；每条的requestId、开始/headers/结束、状态、失败/取消原因及script async/defer/head标志见analysis.json和browser-requests.csv。

|组/次|最后请求类型/结果|去query路径|该请求时长s|结束距DCL|最后成功Script/Stylesheet / 时长|结束距DCL|
|---|---|---|---:|---:|---|---:|
|main Guard 1|Image / FAILED|`stat-ssl.tabelog.com/b/ss/kakakucomtabelogcom/1/JS-2.1.0/s89557972954897`|0.005|2.396 ms|Script `/javascripts/assets/pepper/restaurant-pc/commons.js` / 1.916s|107.315 ms|
|main Guard 2|Image / FAILED|`/user/images/Profile/2346/70x70_2346353.jpg`|4.134|0.243 ms|Stylesheet `/stylesheets/lib/colorbox.css` / 4.077s|60.405 ms|
|main Guard 3|Font / FAILED|`/images/shared/webfonts/tabelog_glyphs/tabelog_glyphs.ttf`|0.004|2.125 ms|Script `/javascripts/assets/pepper/restaurant-pc/commons.js` / 2.329s|104.365 ms|
|资源策略 1|Image / FAILED|`/restaurant/images/Rvw/5230/320x320_square_5230458.jpg`|0.004|0.243 ms|Script `/javascripts/assets/sentry_initializer.js` / 2.154s|41.769 ms|
|资源策略 2|Font / FAILED|`/images/shared/webfonts/tabelog_glyphs/tabelog_glyphs.ttf`|0.004|2.086 ms|Script `/javascripts/assets/pepper/restaurant-pc/commons.js` / 2.015s|103.607 ms|
|资源策略 3|Font / FAILED|`/images/shared/webfonts/tabelog_glyphs/tabelog_glyphs.ttf`|0.004|2.114 ms|Script `/javascripts/assets/pepper/restaurant-pc/commons.js` / 2.186s|102.630 ms|

成功脚本的DOM观察多为head内async=false、defer=false；这是候选阻塞特征，不是JS执行依赖的证明。main2的colorbox.css传输约4.08秒，在DCL前约60ms结束；其他样本末个成功完成脚本/样式多为commons.js或sentry_initializer.js。HTML文档CDP终态约1.49–1.68秒，DCL仍需约3.62–5.82秒，差额发生在文档终态之后，不能全算HTML到达时间。

main2有一条最终被拒的头像图片，其浏览器逻辑生命周期约4.13秒。这个跨度**不等于Guard处理耗时**：A当前时间线没有Fetch.requestPaused/abort命令的逐条时刻，不能判断等待发生在浏览器调度、暂停之前还是Guard处理之内。离线终态证明不被改写为本次线上每条拒绝都已证明毫秒级。

## 子请求与观察窗口

main每次Guard admitted=56；资源组18/17/17。账本沿用Guard admitted口径，不与CDP条目或Guard transport次数相加。浏览器层main每页85条、资源组每页90条逻辑请求（含被拒绝），不等于源站到达次数。资源组多出5条图片逻辑请求（同一CDP层去query路径的描述性计数对照，未跨层硬连），不能只看admitted减少就说页面行为完全相同；本批未记录JS initiator/回退调用栈，不能据此解释旧超时。guard-transports.csv独立保留API调用起止/状态；没有源站线上首字节就保持未知。

**资源组3次都有initial_vacancy的物理终态未知**：它们在DCL/load之后启动，测量检查后关闭context，A记为CANCELLED且物理结束null。main组因图片load更晚，数据请求已在窗口内完成。两组观察窗口长短不同，本批不能证明资源策略下完整查位/事实/G1数据读取正常，也不能将load较短直接当作业务完成提速。读取窗口已在plan/脚本中冻结，没有为补数据额外访问；不把取消算通过或网站失败。

## 能归因和不能归因的部分

- 本批HTTP文档TTFB约1.45–1.80秒、接收完成约2.04–2.56秒；main和资源组全6次成功。没有本批20s失败样本，不能把旧失败归因为HTML、某个子资源、限流、挑战或策略行为。
- 本批可观察到子资源耗时及DCL相邻完成，CSS/脚本候选如表；不靠文件名认定它可删，也不以删除CSS/必要脚本制造“修复”。
- 没有观察到忙碌/挑战信号，但普通HTTP与浏览器UA/协议和时段不同，旧测量未带完整时间线，不能排除客户端差异、代理/站点波动或监测接线差异。
- 缺少：真实失败时的同类完整时间线；浏览器文档物理TTFB/源传输阶段；线上每条Fetch暂停/处置时刻；资源组取消后的数据读取完成证据。新增这些属于后续获批采集，A层需改动时按归属先安排。本批8已用完，不再请求。

因此未实施任何产品修复，也没有声称已有故障关闭。只有发现可复现、B归属的明确缺陷才应做离线红→绿；不能对本次未复现的故障编造红灯。

## 额度与账本

main821条原记录逐值保留，追加8条，现829条；逐条在发起前记账，失败也占额度，批次剩余0。evaluationPublicGET290→298；restaurantWebsiteRequests8210→8432（浏览器Guard admitted220+HTTP2），模型/Google/完整Live/环境重跑新增0。开发GET35→43对应用户本批批准8；总GET上限400未擅自上调，holdoutReservation108未改。

总额剩余102，低于表内预留108，存在6次的后续预算缺口。本批8次已获批且总实支仍≤400；不自行扩大全局总额或减少留出集预留，后续额度安排交复核，不能据此继续调用。ledger-receipt.json记录完整并集、间隔和计数。

## 门禁状态（按来源说明）

本批产品源码、package和测试脚本与17b1cdc6逐字相同，source-proof.json保留src tree SHA。新测量脚本真实本地fixture三组通过；typecheck、arch、build静态预检通过（preflight日志）。未将这三项说成新的净树全套门禁。

复用最近完整净树候选8e1ff388（2026-11-03 CET）的门禁，源码相同，原始回执位于 `../blocked-request-terminal-20261103/gates/`：type/arch/build PASS，默认1410/1410，Chromium185/188（用户继续暂缓的3项图片fixture），严格G2 5/5且12页PASS，每项前后status为空。未重跑整套，未改/跳过/降断言；A三项不作为本次诊断阻断。A新时间线代码本次只读快照加载，并经本地接线和实际6次读取验证，未修改A/C文件。

只推本工作分支、不合main；资源策略仍暂缓。测量完成，交复核。
