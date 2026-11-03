# 被 Guard 拦截的请求是否挂起：离线诊断

2026-11-03 CET（Europe/Vienna，UTC+01:00）。draft / not integrated；工作分支 `codex/fix-tabelog-page-timeout`，基于复核对象 `ad4e6484`。真实网站 / 公开GET / 模型 / Google / Live / 环境重跑新增均 **0**；未读取 .env 或 answers*.json。

**结论：在本地所测的普通 route、CDP Fetch 请求拒绝、首跳与原生第二跳重定向拒绝，以及38张图片突发中，未复现挂起。拒绝均有失败终态，且为毫秒级。数据不支持将 W1 的10.7s / 20s现象归因于这些路径的“已标 BLOCKED 但请求没处理”。这不是对真实 W1、代理/TLS/HTTP2、任意子目标或脚本行为的全面排除。没有证据支持修改产品 Guard，故本轮产品代码不变。**

## 对照与冻结

- main 对照冻结在 `22415b57740256be8dfd3614cc7f2227c2f0856b`。其 Guard SHA256 为 `fb4be39052ed48a813f35bbcea3bacbc36c7d9c251f072e063d67396589d1830`，与先前基线 a7abbc0f逐字相同。
- 资源策略使用分支的真实 Guard，图片策略和3000ms导航检查仍留在分支；不改准入/禁止范围，不加长预算，不合 main，不改 A 的三个 fixture。
- `freeze.json` 固定原 main 字节及分支 Guard/策略文件、fixture脚本与计划SHA；脚本临时加载 main，仅改运行时 policy import 的位置，原始字节先核SHA，退出清理临时文件。
- 最终 probe 提交 `84a2a393167faf31b30ca7b85b6aee53d06cab0d`；`analysis-freeze.json` 固定最终原始结果与统计脚本。最终21组：主对照9、普通route隔离2、原生重定向3、首跳重定向3、38图片3、故意挂起1；全部按预期完成。先前探索原件保留在 exploratory/及Git历史，表中只用最终冻结结果。

## 本地配置和测量口径

真实本地 Chromium，两个不同端口的127.0.0.1 receiver模拟来源A和第三方B；服务端仅响应受控fixture，代码中无外部URL。页面head同步加载B的script，再加载A所需CSS/JS；正文有文字、4张图片和一个数据XHR。B script和必需JS响应人工延迟30ms，图片60ms，**这些是构造时延，不是网站数据**。控制可到达B，两个 Guard 配置的B到达数为0。必需文字、样式、JS和XHR结果均核对。

每组使用全新临时context、禁用ServiceWorker，测量顺序执行，未与门禁并发。DCL单次观察上限2000ms，正常DCL断言<1000ms、load<1500ms；这些是本地诊断断言，不修改生产时限。事件和pending检查在context关闭**之前**采集，关闭不替挂起请求补终态。

CDP Network按session+requestID保存真实浏览器协议开始/结束时间、类型、HTTP状态、失败原因和redirect边界；Fetch暂停和处理命令按session+Fetch requestID保存。两者保留协议给出的networkId，不按URL/order连接。Playwright Request按对象身份单独记录；Guard route.fetch另记API调用开始/返回/失败，只有对象提供的Playwright Request关联，不硬连CDP。**三层不相加为唯一请求数**。缺失结束时间保持null；逐请求详表 `request-timing.csv` 与原始 `results.json` 可复算，CDP时长由协议单调时间计算，PW/API时长是观察进程单调时间。

## 三配置测量表（毫秒，仅本地）

|配置|样本|DCL三次|DCL中位|load三次|load中位|CDP浏览器请求/次|receiver请求/次|Guard拒绝/次|
|---|---:|---|---:|---|---:|---:|---:|---:|
|不拦截对照|3|45.181, 42.140, 42.416|42.416|104.769, 101.444, 101.217|101.444|9|9|0|
|仅 main Guard|3|48.609, 42.873, 42.921|42.921|110.585, 103.886, 103.130|103.886|9|8|1|
|Guard + 资源策略|3|44.268, 43.885, 43.702|43.885|44.537, 44.305, 44.124|44.305|9|4|5|

三配置每个样本均有9个浏览器请求，区别在请求是否获准到达receiver。main有8次Guard route.fetch，分支4次，对照不用route.fetch。这些是不同层的观测，不相加。两Guard配置均无遗留CDP/PW请求或未处理Fetch暂停。main被拒脚本最长1.550ms终止；分支脚本/图片最长3.409ms终止，均为 `net::ERR_BLOCKED_BY_CLIENT.Inspector`。DCL没有秒级拖延；分支load减少是构造图片60ms延迟被取消的效果，不能外推Live。

## 各条路径

|路径|配置|DCL ms|load ms|被拒请求最长ms|遗留CDP/PW/未处理pause|
|---|---|---:|---:|---:|---|
|隔离普通 route 拒绝|仅 main Guard|42.771|102.452|2.682|0/0/0|
|隔离普通 route 拒绝|Guard + 资源策略|44.365|44.718|4.248|0/0/0|
|原生第二跳响应拒绝|不拦截对照|42.195|100.047|—|0/0/0|
|原生第二跳响应拒绝|仅 main Guard|44.865|106.254|1.626|0/0/0|
|原生第二跳响应拒绝|Guard + 资源策略|42.296|42.636|2.842|0/0/0|
|首跳 route 重定向拒绝|不拦截对照|42.557|101.920|—|0/0/0|
|首跳 route 重定向拒绝|仅 main Guard|43.117|104.200|3.645|0/0/0|
|首跳 route 重定向拒绝|Guard + 资源策略|42.918|43.161|3.876|0/0/0|
|38 图片突发|不拦截对照|44.338|447.617|—|0/0/0|
|38 图片突发|仅 main Guard|47.685|128.830|2.144|0/0/0|
|38 图片突发|Guard + 资源策略|44.152|44.449|11.991|0/0/0|

1. **普通Playwright route**：测试层仅抑制Fetch.enable以隔离普通route，不改变策略。被拒第三方script调用 `route.abort("blockedbyclient")`；分支图片同样abort。该隔离配置只是路径诊断，不是生产替代路径。
2. **CDP Fetch请求阶段**：正常完整Guard中，未获准第三方script与策略抑制图片都调用 `Fetch.failRequest(errorReason="BlockedByClient")`，命令成功返回，随后有实际 `Network.loadingFailed`。这里没有仅写BLOCKED日志而不结束请求的样本。
3. **首跳重定向**：A/direct-start.js的首个302即指向被拒B；Guard在route.fetch返回后核对Location并立即route.abort。B到达0，DCL正常。
4. **原生重定向**：A/native-start.js→A/native-middle.js→B。中间hop经CDP `continueRequest(interceptResponse=true)`；其302响应指向B时，在响应阶段failRequest。原始response pause确有302，B到达0，CDP失败终态正常。
5. **38图片突发**：模拟上次新增33–38个资源抑制的量级。分支拒绝39条（第三方script1+图片38），receiver仅4次，CDP共43个浏览器请求全部有终态；仍无暂停遗留或秒级DCL延迟。

### 静态路径核对

`playwright-read-network-guard.ts`（与ad4e6484相同）：普通入口frame不可取的非导航分支abort，导航bootstrap为本地blank fulfill；尚未保护的首次loader会abort后重建受保护loader。普通handle的端点/字段/方法/资源策略拒绝均await abort；首跳Location拒绝await abort；fetch异常await abort("failed")。回放准入后await fallback委交HAR，不伪造完成；实际HAR缺失不在本轮新增放行。

CDP请求阶段的禁止、资源抑制、重放/跳数/时限拒绝均await failRequest；正常初始请求continueRequest；原生读取continueRequest并拦响应；响应拒绝failRequest，响应正常或无redirect entry时continueResponse；超时timer发failRequest(TimedOut)，process异常尝试failRequest(Failed)。本轮实际运行覆盖上表拒绝路径；bootstrap、worker/OOPIF、CDP断连、错误/超时路径的所有组合未重新穷举，静态存在处理命令不等于所有异常环境均已验证。没有将未测分支写成“已证明立即失败”。

## 反事实：诊断能否抓住真挂起

同一分支、同一fixture，在**测试传输层**故意吞掉Fetch.failRequest（只返回虚假ack，不向Chromium发送；不改产品文件）。结果DCL/load均未发生，goto在2000ms观察上限失败；关闭前CDP pending=5、未处理Fetch暂停=3，PW pending=0。撤掉故意错误的正常分支样本立即失败并完成DCL（见主表）。这证明oracle能检出用户怀疑的机制，**不是声称生产上已复现并修好该bug**。

关键发现：某些CDP暂停发生在Playwright Request暴露前；只看PW pending=0或Guard的BLOCKED日志不足以排除挂起，必须核对CDP终态。原始反事实和正常样本都保留。

## 范围与剩余未知

本轮为真实浏览器+本地Fixture机制诊断，不是完整餐厅任务、回放或Live；不评分餐厅能力或S0分母。没有重放真实Adobe脚本、W1真实依赖、HTTPS/HTTP2/代理链及全部子目标，因此不能排除只在那些组合下出现的问题，也没有证明原先真实DCL为何10.7/20s。旧六次读取及其负向结果原样保留；开发GET已用尽，本轮不追加请求。

没有产品修复，没有因未证实的挂起新增生产回归；本轮诊断脚本保留正常控制和低截止反事实。若后续获准测网站，应使用main已发布的逐请求/导航trace，区分“CDP无终态”“route.fetch未返回”“已失败但页面逻辑仍等待”；本轮不新增调用授权。

## 门禁与交付

本轮完整五门禁及严格G2待净树运行；预计保留此前3项A图片fixture合同冲突，按用户指令不修改。若仍红，分别报告，绝不称五门禁全绿。产品源码、图片策略、准入与所有预算均与ad4e6484相同；不合main。分支待推送及复核。
