# 首次入口五秒停顿、一次重载 — 离线交付

Status: draft / not integrated；本地机制已验证，真实站点与D8未重跑。2026-11-09 Asia/Shanghai。

源码及测试冻结：`6ce1a6bc5428122530f804ab52a4ab85ba2af335`；产品实现首先冻结于fdbb13bf，6ce1a6bc仅将POST反例取证改为独立网络时间线。门禁全部在6ce1a6bc同一净树运行，门禁前后status均空。最终证据/文档提交不改src。未推送、未合main。

## 实现与限制

用户在本对话已明确接受整次入口重载一次，保留原生静态下载。Local Chromium和Browser Run共用Guard首次导航入口：只有原规则审核的原生静态GET，CDP确认收到2xx成功响应、尚未结束、连续至少5000ms没有正字节dataReceived，才具备触发资格。Fetch的networkId与同一CDP会话的Network.requestId关联，保留事件先后到达差异，不按URL或顺序配对。

已观察4xx/5xx、非GET/HEAD/OPTIONS（包括被Guard拒绝的POST）、控件交互，或独立子目标出现时不重载。没有响应头/无法证明成功连接、持续有数据的请求不重试。只处理首次显式有预算的入口；第二次仍失败就退出，后续导航不继续自动重载。Replay与显式NODE_FETCH/BROWSER_GET_HEAD对照不新增重载；原未显式给预算的调用保留原行为。

触发后先abort本页Node route.fetch并Page.stopLoading，再取消goto等待。必须收到旧CDP请求的终止事件才准备第二次同一入口；中止命令与等待也使用原剩余预算。D8原20秒总预算不增加，其他显式预算值也保留原值（例如既有预检35秒）；第二次使用共同剩余时间。全部请求重新经过原Guard，准入规则、身份、源站/路径/方法/查询/资源边界、代理和.env不变。

Recorder/canonical trace写入ENTRY_NAVIGATION：attempt、retryCount、STARTED/IDLE_ABORT/ABORTED/SUCCEEDED/FAILED、相对时间、触发状态和无数据时长。首次失败不覆盖，成功和失败时都能取到事件；重复navigate不重复抄录旧事件。主动中止只省略未完成的正文，不吞清洗器异常；已完成正文仍走原清洗、大小与自有凭据规则。

## 红绿与独立效果

旧HEAD的Local导航实现配同一修正后夹具，10秒导航超时，未能恢复，见red-old-navigation.log；这份是真正契约红灯。最早red.log/red-diagnostic.log夹具缺defer脚本，DCL未等待CSS，不能作为有效红灯，原样保留。候选首轮还暴露Fetch资格事件早于Network请求事件、取消网络后旧goto等待仍未退出，均已修复；原日志保留。边界首轮POST/Node脚本在阻塞CSS之后没有执行，已移到之前；随后POST在超时关页后取snapshot误报，改核独立NETWORK_REQUEST_END的POST和blocked=true，未删除安全断言。

冻结门禁中的恢复：HTTP200停顿5043ms触发，旧服务端响应close先于第二次请求，第二次完成；总用时5094ms，文档2次/CSS2次。录制文件重读核对恰有5个ENTRY_NAVIGATION事件，retryCount为0/1，第一attempt的IDLE_ABORT和ABORTED仍保留。

| 失效机制 | 真实本地检查 | 结果与边界 |
|---|---|---|
| 原生2xx正文停顿 | 首个恢复测试，服务端close顺序+实际页面文本+重读recording.json | 通过；旧导航同夹具超时 |
| 已有403/500仍重放 | HTTP403/HTTP500：另一个200 CSS同时停顿 | 均只1次文档和CSS，无重载 |
| 无头误认连接成功 | NO_HEADERS | 只1次，原预算失败 |
| 持续收数按总时长误重载 | STEADY：每500ms正文，共6.5秒 | 1次成功，无重载 |
| POST或控件动作被重放 | POST独立浏览器拒绝时间线；INTERACTION | 1次文档，POST到达服务端0次 |
| 无限重试或重置时限 | SECOND_STALL：第一次5秒停顿，第二次仍停 | 合计约8秒失败，共2次，非两份8秒 |
| 取消后复活 | CANCEL | 1次失败，没有重载 |
| 后续导航重试 | ENTRY_ONLY | 初次成功，后续导航失败，无新恢复事件 |
| Node传输泄漏 | NODE_ABORT：200 CSS和Node未完成读取并存 | 旧Node服务端close在第二次CSS前，重载成功 |

以上是本地组件/运行时组合结果；实际执行器、Guard、录制和Browser Run原有覆盖通过完整套件保留。未运行真实模型/真实来源/Controlled Live-write，不是D8合格交付证据。最近Live的CSS没有成功响应头，依本合同不会自动重试；DNS失败和旧403也不能因此宣称已修复。旧文字查询独立审计缺陷仍开放，本次未改变Evaluator结论。

## 门禁

- typecheck、arch:check、build：PASS。
- npm test：1511/1511。
- npm run test:browser:fixture：Chromium257/257（原246+新增11）和完整G6 78/78。
- PRAXIS_G2_REQUIRE_PASS=1 npm run test:dom-change：5/5，全部12个有效页面PASS。
- 既有scan-hardcoded.sh相对b29ee625：新增4条WORDLIST；2条只读方法排除、1条原生静态类型、1条权威值类别排除。均为通用控制合同，没有站点/候选/名称/选择器/URL分支。

原始输出、SHA与每项净树记录见frozen-gates；verification-summary.json保存独立服务端和录制检查结果。产品src/docs diff检查通过；原始失败日志不清洗或覆盖。

## 额度与停止

外部GET0、模型0、Live0，最新账本字节未变（budget-preserved.json）。累计GET378/486、Live29/47、模型784/1600；held-out18Live/108GET和模型只调用余15/30均未动。本轮仅本地回环连接，不读取个人profile。按授权完成离线实现后停止，不自动跑D8，不推送或合main。
