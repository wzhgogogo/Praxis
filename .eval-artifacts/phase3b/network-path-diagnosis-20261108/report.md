# 网络分流及静态资源路径复核

Status: exposed diagnostic / offline and local fixtures；不是新 Live 或当前网站成功验收。2026-11-08 CET（UTC+1），基线33c324b0。用户要求继续查网络路径、不要重跑 Live。本轮未改产品、.env、代理、VPN、DNS、证书、Guard、时限、重试或预算。

**结论：没有发现分流回退或静态脚本改走 Node。之前“直连都正常”只能表示当次成功，不能解释为已稳定关闭故障。** 旧成功 Live 里其实已有相同主脚本间歇超时；新失败 Live 的 Tabelog CDN DNS 失败则是相对旧成功响应的新现象。当前本地分流对照通过，解析服务有波动线索，故障当时的逐连接原因仍缺少证据。

## 配置与实际路径

当前白名单配置见 [effective-routing.json](effective-routing.json)：浏览器代理为 HTTP 127.0.0.1:10808，tablecheck.com、tablecheck.net、tabelog.com、tblg.k-img.com 及子域直连；其他目标走代理，Google API 显式代理，DeepSeek 显式代理为空。当前 NODE_USE_ENV_PROXY 未设置；不能称作已显式设成 false。没有改系统网络配置。

| 请求 | Guard 通过后的传输 | 直连判断及解析路径 |
| --- | --- | --- |
| document / Fetch / XHR | route.fetch → Playwright APIRequestContext 的 Node 请求，再 fulfill | Playwright 按目标 URL 使用同一 bypass 后缀集；直连由 Node/系统名称解析与 socket 发出 |
| 已审核 script / stylesheet / font / image，且不含权威输入值 | route.continue → Chromium 原生下载 | Chromium 的 --proxy-bypass-list 命中本域/子域；由浏览器网络服务处理解析、连接、缓存与下载 |
| 未准入、禁止路径等 | 原 Guard 拒绝 | 本轮没有改变准入；直连配置不能授予准入 |

Live 工厂在 run-c-closeout-live.ts 中读取同一份环境设置；LocalPlaywrightChromium 把代理传给 launch，context 未设置另一套代理。Guard 的静态分支仍要求原静态规则匹配；不是把所有 GET 改为原生。

读取了实际安装的 Playwright 代码：HTTP 代理分支不添加 SOCKS 的 `MAP * ~NOTFOUND` 规则；`.domain` 被转成 Chromium 的 `*.domain`。Node 请求的 bypass 按目标 hostname 后缀比较。对原生资源，Guard 继续请求后由浏览器联网；它不会在 DNS 失败时自动退回代理。配置上的直连绕过的是应用 HTTP 代理，**不等于绕过系统 DNS、系统路由或 VPN/TUN**。

当前 .env 修改时间11-07 16:09:10.612 CET，早于前后两次 Live；两次冻结 ca0bd139→de503304 的四个分流/Guard/Live工厂文件逐字相同。旧 Live 没有保存有效进程环境、浏览器启动参数或每个 socket 的代理/DNS记录，所以无法事后绝对证明旧进程没有环境覆盖，或反推出其实际出口IP。当前配置、相同代码和新本地参数检查支持“未发现应用分流回退”，不是历史逐连接证据。

## 本地真实 Chromium 验证

[local-host-route.mjs](local-host-route.mjs) 只使用本机 HTTP 接收端/假代理，测试进程把十个精确测试域名映射到 loopback；这些映射与 local-network-access 权限只存在于夹具，未进入产品。没有请求实际餐厅服务器。通过 SystemInfo/本进程 ps 只取 `--proxy-*` 参数，没有保存完整进程参数、请求头或凭据。

- 当前后缀配置：tablecheck.com、本域子域、tablecheck.net 的 search-v4 子域、tabelog.com、tblg.k-img.com 及子域的脚本全部直接到本地接收端；代理只见到未列入名单的控制域和两个后缀伪装域。
- 故意删除 CDN 直连项：假代理立即见到 tblg.k-img.com 及其子域，说明 oracle 能区分分流错误；生产配置没有删除。
- 两组各10个脚本均实际抵达，Guard 仍记录 ADMITTED / BROWSER_GET_HEAD；document/Fetch 仍记录 NODE_FETCH，代理型 Node 数据请求也通过本地 CONNECT 接收端验证。
- 实际 Chromium 参数含本域和 `*.domain` 的 bypass 列表，使用 HTTP 代理，没有 SOCKS 的强制 NOTFOUND 参数。详见 [local-host-route.json](local-host-route.json)。
- 既有 proxy configuration、Local factory、local proxy routing、native static transport 四个文件共13/13测试通过，见 [existing-path-tests.log](existing-path-tests.log)。没有以这些夹具证明当前网站已恢复。

诊断工具的早期失败原件保留：getBrowserCommandLine 因默认没有 enable-automation 而不支持，改用只读进程信息，未增加生产/测试浏览器 automation 标志。HTTP 假代理起初缺少 Node 客户端实际使用的 CONNECT，补齐后通过；这是本轮诊断夹具缺陷，不是产品代理缺陷。曾尝试换掉 Google 控制域的猜测未解决失败，不能据此宣称是 Google HSTS 导致；有效失败证据为 Proxy connection ended before receiving CONNECT response。

## 真实录制前后对比

见 [saved-path-comparison.json](saved-path-comparison.json)，包含四份原录制路径和 SHA256；原数据未改。

| 真实观察 | TableCheck 同一主脚本 |
| --- | --- |
| 11-07 直连单次读取 | 200 / 2.778s |
| 11-08 店铺读取 | 200 / 5.174s |
| 上一次 D8 正向时段 Live | 6次：4次200（0.843–3.605s），2次入口关闭前无响应头 |
| 本次 D8 收尾 Live | 3次：第1/3次入口关闭前无响应头，第2次200 / 1.841s |

上一次 D8 的 Tabelog CDN 脚本有15次200、2次因上下文关闭未完成；本次4个 JS 则均 `net::ERR_NAME_NOT_RESOLVED`。因此不是“此前每次都成功，这次代码把脚本换了路径”。在同一运行中也能同时出现同 URL 成功/未完成，说明单次直连成功不足以证明稳定。

本次 TableCheck 首个 HTML 由 Node 在1.027s返回200，但主脚本已原生继续，20秒入口前无响应头。HTML 与脚本并非同一个网络客户端或同一条连接；HTML200不能证明脚本的浏览器解析/连接也成功。取消发生在关闭页面时，不能写成来源返回了超时或HTTP错误。Tabelog 的脚本报错是浏览器 DNS 失败，Search 点击正常结束却没有产生新 document 请求，没有搜索提交被 Guard 拒绝的记录。

## 当前 DNS 与系统状态

15:49:40 CET 的只读采样见 [current-dns.json](current-dns.json)。系统 DNS 为223.5.5.5；系统 HTTP/HTTPS/SOCKS代理都指向127.0.0.1:10808。应用在本地受控对照中正确覆盖为所需 bypass；系统代理存在不等于这些资源实际走了代理。系统 VPN/TUN 是否影响更低层路由没有本次历史证据，不猜测。

系统 OS_LOOKUP 当前对三个域名均有IPv4结果，tblg.k-img.com 返回103.70.240.213，TableCheck返回三个IPv4；独立 DNS A 查询对 CDN/Tabelog成功，但对TableCheck在本次诊断的2秒单次期限内ETIMEOUT。此前同轮初次未限制为2秒的查询能成功。这里的2秒只是诊断 DNS 查询参数，产品20秒等时限完全未变。

这表明当前“系统名称查询有结果”和“新DNS查询及时返回”并非总相同。系统缓存、解析客户端、请求时刻及超时设置都可能产生差异；不能将 Node.lookup 成功升级成故障时 Chromium DNS 也成功。该采样支持进一步关注解析延迟/波动，但没有复现上次CDN的失败，也不能把旧 TableCheck 无响应头确定归因到DNS、某个IP、VPN、CDN或服务器。

## 停止与未关闭事项

本轮确认了应用分流与静态原生路径的本地行为，未发现应当更改的产品实现；不猜改DNS/代理、不新增回退/重试、不放宽Guard。网络故障没有被宣布修复。要继续缩小旧主脚本无响应头的原因，缺的是故障当时的浏览器 resolver/连接/握手/选中代理和目标IP证据；旧录制无法补出。下一次另行批准的来源验证应随同一次读取采集这些最少的非秘密网络元数据，不能再用单次入口成功就宣布网络稳定。当前不开展该验证。

本轮来源HTTP/评测GET0、Live0、模型0，只有公开DNS查询和真实本地接收端。累计保持 Live26/44、评测GET365/473、模型727/1600（余873）；18Live/108GET留出预留不动。所有真实失败与旧自动评价保留。当前源码无变化，不重跑全套产品门禁；本地13项及新诊断两组通过仅证明上述路径。
