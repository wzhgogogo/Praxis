# 浏览器交给现有xray后的验证

Status: exposed network preflight / static-resource diagnostic；不是D8或整站Live。报告日期2026-11-09（Asia/Shanghai）；原始采样UTC在JSON中保留。用户要求只改本地浏览器代理、跑preflight、看commons.js是否5秒内完成。本轮未执行TableCheck入口重试，也未将20秒时限改成45秒。

## 配置已修改

当前工作区私有.env原本已经有PRAXIS_LOCAL_CHROMIUM_PROXY_SERVER=http://127.0.0.1:10808。问题是PRAXIS_LOCAL_CHROMIUM_DIRECT_HOSTS仍包含站点和CDN，导致它们在应用层绕过xray。因此保持proxy行，只把DIRECT_HOSTS设为localhost,127.0.0.1；所有公网站点、CDN与API进入现有10808，由xray原规则分流。

修改前四个测试公网域名均DIRECT，修改后均送10808；只保留本地回环bypass。Google显式代理和DeepSeek直连不变。私有.env保持0600、ignored、未提交，也没有修改主工作区的.env、系统代理、VPN、证书或xray规则。生产代码/Guard/准入合同/静态原生传输和时限完全不变。见config-before.json/config-after.json。相关纯本地proxy/preflight测试15/15通过；本轮无源码变化，不重复全产品门禁。

## 实测结果：未完全通过

| 检查 | 真实结果 | 判定 |
| --- | --- | --- |
| 本地xray10808 TCP端口 | 可连接 | PASS，仅端口可达 |
| Tabelog标准preflight，https://tabelog.com/，Range bytes=0-0 | 10,004ms，PREFLIGHT_TIMEOUT | FAIL |
| TableCheck标准preflight，https://www.tablecheck.com/en/，Range bytes=0-0 | HTTP206，1,850ms | PASS，连接预检，不是主脚本/整页验收 |
| 单次commons.js，真实Chromium+原Guard+静态原生下载，经10808 | HTTP200，完整2,044,071字节；墙钟5,063.777ms，浏览器时钟5,056.185ms | 完整下载成功；严格5,000ms条件FAIL |

commons.js为已观察的精确URL https://tblg.k-img.com/javascripts/assets/pepper/restaurant-pc/commons.js。以回环诊断文档只引用这一个真实远程脚本，沿用既有准入语法并进一步限定该路径；没有打开实际餐厅页面，其他动态依赖和额外请求均不放行，也不允许重定向或再次请求。记录有GUARD_NATIVE_CONTINUE、HTTP200、NETWORK_REQUEST_END/FINISHED和RESPONSE_CAPTURED，敏感清洗后长度仍2,044,071。不能把5.064秒舍入为小于5秒，也不能用一个样本宣称12倍提速或网络稳定。

标准preflight第一项失败时原脚本停止，原失败结果保留。为完成用户原先指定的独立检查，在同一最多3GET内单独执行此前未尝试的TableCheck预检和CDN下载；没有重新访问已失败Tabelog。原输入冻结c9fb597b，剩余检查冻结e5e8c70e，原runtime与runtime-remaining分别保存，见verification-summary.json。

采集完成后的诊断汇总曾误把录制目录当文件，报EISDIR，原result.json错误保留。路径读取已修正，但没有再请求网站；summarize-result.mjs从已保存的原始请求/响应/结束事件和正文采集事件离线重算时间及判定。原录制SHA256为89c20854f3935cb9efe3eb94702e1a3c95d3e7173abd1471b507ea333ee1b6e3；不改原始结果、不补造响应。回环文档+单脚本组件录制REPLAYABLE，不等于Tabelog整站可回放或D8通过。

## 发现两个xray监听进程

只读lsof发现PID50585和54155同时监听127.0.0.1:10808。50585父PID为1，启动于更早时间；54155仍有父进程。两者参数均指向当前磁盘同一config.json；文件当前有tabelog.com/tablecheck.com直连规则、proxy/direct/block出口。早进程的启动早于配置文件的修改，不能证明它内存中的规则与当前文件相同，也不能断言这是本次超时原因。

没有停止、重启进程或改xray配置。保存的是白名单路由/进程元数据，不含服务器端点、账号、UUID、密码或私钥；首次含空格/相对路径识别失败与修正后的结果均保留。没有逐连接xray access日志，因而只证明浏览器按冻结配置进入10808，不能独立证明这次每个连接最终选择了哪个出站节点。CDN实际下载成功与前述端口/HTTP证据应分开理解。

## 额度和停止

按用户明确要求的验证记<=3GET：两站标准preflight各1、commons.js1；实际恰好3。累计GET371/479、Live27/45、模型748/1600（余852）；本轮Live0、模型0、Google0、餐厅请求3。剩余18Live/108GET仍全部为held-out预留。没有入口自动重试、没有扩大时限、没有重跑D8，没有额外GET或重复静态下载。

当前保留用户要求的xray接管配置；验证结论是TableCheck预检通过、Tabelog预检失败、CDN完整下载5.064秒未达到5秒。接下来需要先由用户确认重复xray监听进程的管理方式，再决定是否另行验证；本轮不自行停进程或继续整单Live。证据本地保存，未推送。
