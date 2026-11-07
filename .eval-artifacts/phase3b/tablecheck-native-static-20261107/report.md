# TableCheck 静态传输与单次读取停止报告

Status: **draft / not integrated；入口仍超时，按用户停止点收尾**。时间均CET（UTC+1）。基线015f8b0a；实现3c7c8e1e；最终门禁与真实读取冻结c3361d2c756277bc6f9e6d1af2a5a4e1b11d28b9。未合main、未执行D8或held-out。

结论：默认生产路径已按批准范围改为已准入静态资源原生下载，离线合同/隐私/重定向回归全绿；**本次唯一网站读取仍在ENTRY的20秒期限超时，不能声称入口提速已在真实来源兑现**。主脚本确实route.continue，但截止前没有status/body。未到填词、联想、选店、catalog或绑定。没有重试，也没有用第二页、D8或留出集额度。

## 1. 切片与安全合同

LocalPlaywrightChromium与Cloudflare Browser Run选择REVIEWED_STATIC_BROWSER：既有静态规则已匹配、资源策略保留、GET/HEAD、script/stylesheet/font/image，且查询字段没有EQUALS/PREFIX_OF_AUTHORITATIVE_INPUT，才route.continue。静态准入索引与实际初始传输可观察。document、Fetch/XHR、只匹配动态规则的脚本、含权威值的静态请求保留Node；预检保留原CDP路径。方法、源站、路径、查询合同、POST拒绝、CDP重定向、资源策略、所有时限/数值预算不变。原有显式NODE_FETCH/BROWSER_GET_HEAD仅供既有离线对照；没有新增宽准入路径。

浏览器response事件把原生正文送同一个Recorder。清洗/自有凭据整份拒录、遮盖等长、仅来源script12MB、其他类型原上限均未改变。原生重定向最终正文沿既有CDP采集，真实本地接收端也核验其完整正文到达。TC_SEARCH本次只选可见、可用、非POST且规范化全名精确相等的唯一BUTTON；本地CDP反例保留选店后新主文档发出前拦截、接收端0到达的断言。

## 2. 红绿与完整门禁

static-red.log：旧默认脚本实际NODE_FETCH，目标BROWSER_GET_HEAD断言失败，属于有效红灯。static-full-green.log原样保留字体夹具未请求的失败；补可见文字后保留字体/正文断言，static-green-final.log为8/8。seams-green.log为6/6，含合法重定向最终正文。

第一轮净树3c7c8e1e默认1483通过；Chromium240/242，两个既有canonical-origin夹具只在route.fetch注入录制/本地响应。为其显式选择NODE_FETCH对照，所有业务、安全、缺录及receiver断言保留。D8录制夹具仍有127.0.0.1:9死代理。新默认原生传输由独立真实本地Chromium接收端测；该处没有网站或模型调用。首轮gates目录不覆盖。

最终**c3361d2c**六项检查全部通过，各项前后净树且SHA不变：

| 检查 | 结果 |
| --- | --- |
| typecheck / arch:check / build | PASS |
| npm test | 1483/1483 |
| test:browser:fixture | Chromium242/242；G6 77/77 |
| PRAXIS_G2_REQUIRE_PASS=1 test:dom-change | 5/5；保存页12/12 PASS |

真实本地Chromium覆盖：script/CSS/font/image原生且ADMITTED/staticResources索引不变；未准入、禁止路径、非法重定向、POST均无接收端到达；document与Fetch/XHR/动态规则脚本仍Node；等值和前缀权威静态值仍Node；原生与Node的同份JS/CSS清洗哈希一致、凭据遮盖等长、字体正文哈希完整；自有凭据整份拒录；合法重定向最终正文记录。

本地10,284,255字节脚本，最终全套日志中的一组对照：

| 模式 | DCL ms | Recorder原始正文回调 ms |
| --- | ---: | ---: |
| Node | 148.913 | 24.796 |
| 原生 | 38.324 | 98.206 |

不设速度阈值。回调点不同：Node在fulfill前、原生在浏览器响应体可读时；不等同同口径的线路到达时刻。全部早期测量原样保留；单次本地数据不能推出真实网站速度或稳定性。

## 3. 唯一真实读取：仍为ENTRY超时

**2026-11-07 15:07:42.339 CET**开始，沿run-c-closeout-live.ts TC_SEARCH原browser()工厂、完整discoveryPackNetworkPolicy、默认上下文、无代理覆盖；源代码与ledger/spec哈希已在运行前提交并复核。20,003.079ms后导航TIMEOUT。进程exit0只是诊断包写完，**不是来源读取成功**。

| 原始事实 | 结果 |
| --- | --- |
| HTML | Node获取200，约783.861ms；浏览器文档终态200 |
| 主脚本 | /portal/assets/index-KCcaxOlR.js；GUARD_NATIVE_CONTINUE明确记录原生；截止无status/body |
| 两份CSS | 原生200，完整正文经Recorder清洗并保存531026/27321字节 |
| logo/font | 仍按原资源策略拒绝，未因原生传输放行 |
| catalog / q / name / destination / 联想 / 选店 | 全部NOT_REACHED，不能沿用上轮200当作本轮结果 |
| CORS | 错误记录0；没有到API，故不是API健康证明 |
| 第二主文档 | 0；入口以外页面未发送 |

与13:36:22.089 CET那次Node失败的对照：

| 主脚本 | 收到响应 | 截止取消时已挂起 |
| --- | --- | ---: |
| 上次Node代转 | status/body均未到 | 17853.446ms |
| 本次原生 | status/body均未到 | 19200.689ms |

两行都是LIFECYCLE_CANCELLATION_NOT_WIRE_FINISH，是右删失的等待，**不是下载到达时间，也不是“原生更慢”的测量**。两次均未完成，没有可比较的完整线路到达时间；当前证据不支持把阻断只归因于Node，也没有定位环境/上游根因。不改代理、证书、时限或重试。

三类记录全开：events.json网络/操作时序，recording目录原始清洗产物，decisions.json与google-responses.json明确为空（本步模型/Google0）。HTML响应确实清洗过，但未通过导航且没有合格DOM快照；录制为NOT_REPLAYABLE/NO_CAPTURED_PUBLIC_DOCUMENT，components.har仅两份已到达CSS。不能生成未到达的主脚本或结果DOM。因此本次没有可用于选店/绑定的真实红绿样本，绑定保持NOT_IMPLEMENTED，不新增没有观察依据的完成逻辑。

## 4. 独立核验与四层报告

独立检查raw CDP事件、冻结spec、字面量合同与保存文件哈希，不用生产成功标志作oracle；结果见independent-evaluation.json与source-metrics.json。

- 端到端：本步是来源契约诊断，D8/held-out NOT_RUN，不进入Live能力分母。计划1、启动1、入口完成0、查询/选店0。
- 逐环节：本地传输与隐私PASS；实际入口FAIL_TIMEOUT；catalog至选店/绑定均NOT_REACHED。
- 严重程度：无交付声明；保留事实中未发现S0。完整独立请求/声明审计NOT_EVALUATED，**不声称S0=0**。
- 归因：已知是原生脚本在入口截止前未返回；网络/上游/runtime根因UNKNOWN。不是店名、destination或身份拒绝证据。

## 5. 扫描、额度与停止

推送前scan-hardcoded.sh：相对015f8b0a新增3条WORDLIST，分别是用户批准的方法/资源类型筛选、权威值类别排除和原有显式GET/HEAD对照；没有新增餐厅名、别名、URL、选择器或门店分支。相对72b18bee为14条，相对main f324f17b为51条，包含此前已复核的安全格式、精确查询合同及通用控制代码；原始输出和分类见scan-*.log/scan-review.json。

本轮GET+1，累计353→354，共享上限465，余111=held-out108+D8见证/后验3。模型新增0（累计653/1600；只调模型验证15/30不变），Live新增0（累计23/42；D8已批准1次和留出集18次保留）。本批不继续读取。

STATUS/DEVLOG/TEST-LOG仍按此前明确要求，留到实际获批合main时更新。本轮只更新能力矩阵与审计报告。所有原始失败保留，源码/评测输入冻结不变。按本条用户第3步“入口仍然超时：停下报告”停止，等待复核；不执行D8。

Approval provenance: previous GET463→464 was the human message “新额度批准。可以直接重跑” in this chat (2026-11-07; exact message timestamp unavailable). Its run was2026-11-07 13:36:22.089 CET. Current GET464→465 comes from the user’s dated static-resource handoff; exact message timestamp unavailable. Neither time is inferred from a run timestamp.

