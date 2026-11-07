# DeepSeek直连与TableCheck单次重跑

Status: **draft / not integrated；入口与联想已通，详情仍被现有Guard阻断**。时间均CET（UTC+1）。基线f057e79c；完整门禁、来源读取与配置冻结4fe5c039c4a001d577d37788ac143e31de54bdf4。本地候选，未合main；没有D8/held-out Live。

用户本条要求DeepSeek也直连，并在改完后重跑此前一直超时的测试。已将当前工作区私有.env的PRAXIS_DEEPSEEK_API_PROXY_SERVER清空，Google及其他浏览器目标保留现有10808代理，TableCheck/Tabelog及相关API/CDN名单直连。有效配置断言见effective-config.log，未调用模型。不改系统代理、VPN、证书、凭据、Guard、身份、时限或既有额度语义。该“重跑一下”的直接人类指令作为本轮唯一新增入口的授权：GET465→466，原话及范围在plan/ledger；聊天未提供精确消息时间，不编造。

## 本次真实结果

原TC_SEARCH运行器，Node --env-file-if-exists=.env加载当前配置；不是另起curl或替代浏览器。开始于**2026-11-07 16:17:34.742 CET**（started.json为准），结束16:17:52.581 CET。浏览器headless、匿名隔离上下文、serviceWorkers block、UA/locale/timezone默认，网络策略discoveryPackNetworkPolicy unchanged。唯一入口、原20秒DCL期限、120秒总上限、5000ms间隔。

| 环节 | 原始证据/结论 |
| --- | --- |
| 搜索页入口 | DCL4168.239ms，COMPLETED；本次没有重现20秒入口超时 |
| 主脚本index-KCcaxOlR.js | 原生route.continue；HTTP200、浏览器终态FINISHED约2778.209ms；10284255字节全部到达；清洗后仍10284255字节 |
| 后续懒加载脚本 | HTTP200；419492字节已录 |
| catalog.json | GET200 |
| search-v4查询 | 8个GET200，包含全文q与name；二者实际规范化值哈希等于冻结查询词 |
| 名称联想 | 只有一个可见可用BUTTON与完整店名精确相等；Kiwami/Hanare后缀未选 |
| CORS | 错误0 |
| 选店后 | SPA路由；没有第二个文档请求；最终URL /en/not-found |

HTTP/实际DOM证明本次入口和具名联想连通，不能用单次前后运行证明旧网络根因被永久关闭。旧17.85/19.20秒等待都是截止取消、无status/body；本次有完整200正文。正常脚本/入口测量只描述这次环境，不修改期限或性能门槛。

## 新的首个阻断：店铺资料请求没有审核合同

选中唯一全名BUTTON后，网页自身请求：

- origin=https://production.tablecheck.com；GET `/v2/shops/nakamata-nodoguro-ginza`；queryKeys=[locale]、locale=SHORT_TOKEN；CDP类型Fetch，Guard观察保留fetch/xhr两种表示。
- 现有tablecheck-public-query.ts声明了catalog/search、geolocation/autocomplete/搜索等路径，**没有这条店铺资料读取**。实际Guard记录BLOCKED；四个浏览器请求终态status=null、FAILED/inspector，没有该路径的Node传输响应。因此不能称服务器返回404，不能据此认定餐厅不存在。
- 页面同一Document内转到`/en/not-found`，可见文字“This page is off the menu”。未增加GET文档，店页没有取得。还观察到被拒的辅助gallery GET与menu_items POST/预检；没有为了取得结果而放行。
- raw actor返回SELECTED_RESULT_OBSERVED只表示它完成选项点击并观察了后态，**不等于店铺结果成功**。receipt原样保留，独立诊断明确ENTRY_AND_AUTOCOMPLETE_PASS / SHOP_DETAIL_GUARD_BLOCKED。没有HIGH身份、空位、B1或用户交付声明。

本轮不加新接口合同，不把新观察当授权，不造详情响应，也不把not-found作为正向绑定。后续应先复核真实资料GET及依赖的精确读取合同，再决定可授权范围；当前没有完整店页可供身份/绑定签收。

## 录制与回放边界

网络/操作events、4份脱敏DOM、清洗后的脚本/CSS组件、decisions[]和google-responses[]全部保存。4个snapshot不是4次页面额度，本次只有一个Document、GET1。两份脚本均完整录入，正文清洗/12MB仅script/自有凭据整份拒录规则未变。

完整Replay仍NOT_REPLAYABLE/UNCAPTURED_DYNAMIC_RESPONSE。原因逐项在recording RESPONSE_OMITTED：JSON_SENSITIVE_KEY4、JSON_SIZE_LIMIT4、OPTIONS原GET/HEAD录制合同之外8、二进制PNG INVALID_UTF81。没有放宽隐私或大小限制；components.har和真实DOM可作后续组件回归，不能补造缺失动态正文或合格详情正向样本。

## 离线门禁与独立评价

冻结4fe5c039六项净树门禁全绿，每项前后SHA一致且工作树为空：typecheck、arch:check、build PASS；默认1486/1486；Chromium243/243 + G6 77/77；严格G2 5/5、保存页12/12 PASS。前一切片的首轮V8原生崩溃仍保留在原目录，本轮没有删测、改断言、加时限或放宽并发策略。

独立核验使用原始CDP、冻结文字哈希、录制DOM、原始Guard拒绝和当前合同字面量：

- 端到端：本步是来源诊断，D8/held-out NOT_RUN；计划1、启动1、入口完成1、联想完成1、店铺完成0，不计入完整Live能力分母。
- 逐环节：配置/入口/脚本/catalog/全文联想PASS；资料取得FAIL_GUARD_BLOCKED；身份、空位、B1、正向绑定NOT_EVALUATED/NOT_IMPLEMENTED。
- 严重程度：无用户交付或店铺存在性结论；保留事实未发现S0，完整独立E1请求/声明审计未运行，不声称S0=0。
- 归因：本次已越过先前网络入口阻断；当前可证实的是未审核资料读取被本地拦截。旧间歇网络根因没有被单次后测独立隔离。应用not-found不冒充上游404。

详见independent-evaluation.json、source-metrics.json。相对f057e79c写死扫描新增0；相对57f292e5保留此前3条通用URL主机名解析/格式和HTTP(S)代理协议检查，原输出及分类保留。没有新增餐厅写死分支或Guard合同。

## 额度与停止

本条用户指令支持唯一一次入口重跑，累计公开GET354→355，上限465→466，余额111=held-out108+D8见证/后验3。模型新增0（累计653/1600），Live新增0（累计23/42）；D8已批1次和held-out18次未动。sourceRead ledger所有旧行保留，新的charge note采用冻结授权原文，避免沿用旧464→465说明。此前失败记录不覆盖；没有代理失败回退或源站重试。

DeepSeek直连配置已生效，但本步没有发模型请求，不能宣称其当前服务实测成功。当前源码及配置文档本地冻结，不合main、不跑D8、不新增源站读取。新payload未获推送授权，没有推送；STATUS/DEVLOG/TEST-LOG仍按此前明确要求留到实际main整合时更新。
