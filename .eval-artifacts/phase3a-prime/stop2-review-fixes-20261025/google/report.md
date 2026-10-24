# F2④b补充：正式Google响应捕获

- 状态：frozen regression；原F2④b依用户复核通过，本补充按授权五门禁后合入main。
- 日期：2026-10-25；报告时间使用用户指定CET（UTC+01:00）。
- 分支：`codex/feat-phase3a-prime-f2d-replay`；受测 `564ded2ed4a052b5005cedfb2c09f2f307929ba4`。
- 新基线main：`1a736c880513f106631e3ba1e30db75d1d1c7ab2`。通过合并保持它及原623d5587均为祖先，在合并后代码上重放验收，不改写原受测提交。

## 正式接线与记录格式

`runHybridReadDiagnostic`在开启现有`--record-browser`时，将Google客户端的实际传输装饰后接入Recorder。CLI、fixture和Replay三个调用方均已更新，不保留旧接线。既有proxy、timeout、原始请求与响应消费保持；每次请求只有一次原传输调用，响应clone用于录制。

Google Places及同一客户端使用的逆地址API保存标准HAR1.2行：URL、方法、原始JSON请求body、HTTP状态、MIME和原始JSON响应text。请求头全部不写入，key/token/secret等query移除；未改写JSON内容、Unicode或body空白。HTTP GET无body仍按原样处理。

浏览器文档和Google行写入同一个replay.har，recording@4和既有JSON字段不变。即使没有合格浏览器页，安全的Google响应也可留在规范文件名的HAR，Replay读取后仍在首个不合格页停止；诊断DOM不参与回放。

fixture中手工拼接Google HAR行的路径已删除；测试现在依赖正式Runner自动捕获。产品层、共享Browser/restaurant-search非测试文件、Prompt、Schema、Guard和通用Evaluator@34/rubric@30未改。

## 写入前后扫描

先检查响应/请求body，再扫描整份待发布HAR。扫描覆盖本次请求所用密钥值、常见Google/sk/Bearer等模式及JSON凭据字段，解码嵌套JSON和Unicode转义。命中只记安全原因和origin/path，不回显密钥或原文。

通过写前扫描后，HAR写入pending文件并回读扫描；通过后以不覆盖已有文件的方式发布同一份字节。写后命中会删除pending，最终HAR不发布。Recorder记录`GOOGLE_CAPTURE_REJECTED`原因，失败不冒充可回放。运行结束后关闭捕获，迟到响应不再追加。

[19项相关控制](green-security-final.log)与[API契约控制](green-api-contracts.log)通过：原始JSON/body/Unicode保真、请求头/query剔除、无合格DOM仍留原始响应、Places与逆地址接线、proxy配置校验、转义密钥拒绝、写前拒绝、实际落盘后污染拒绝、迟到响应隔离。无新的真实服务调用。

## 有效红绿与真实链路

[红灯](red-capture-disabled.log)：先删fixture手工HAR追加，未补捕获的正式录制在原样Replay首个Google步骤停为MISSING_STRUCTURED_RESPONSE，完整完成断言失败。不是导入、类型或启动错误。

之后正式Runner产出自动捕获种子，先提交再回放；[捕获证明](automatic-capture-proof.json)确认Google行存在，fixture API key和API-key请求头均不存在。原始请求body保真另由独立字面量unit断言核对。[输入摘要](replay-input-freeze.json)、[585项冻结](freeze.json)保留。

| 同一冻结种子控制 | 结果 | 页／决策 | 墙钟秒 |
| --- | --- | --- | ---: |
| 原样完整回放 | COMPLETED，同候选、交付和offer | 5/5页、4/4决策 | 1.617051 |
| 删除Google响应 | REPLAY_INCOMPLETE，MISSING_STRUCTURED_RESPONSE | 0/5页、2/4决策 | 0.396542 |
| 第3页不合格 | REPLAY_INCOMPLETE，缺静态依赖 | 2/5页、3/4决策 | 1.213144 |
| REAL模式fixture接线 | COMPLETED，同候选和交付；真实模型0 | 5/5页、4次fixture传输 | 1.591131 |

[正式汇总](validation/summary.json)。回放子进程及Chromium继承OS deny network-outbound；Node网络尝试0。完整两个控制的独立声明S0及边界S0均ABSENT。部分回放质量维度NOT_EVALUATED，全部Replay排除Live能力分母。

## 五门禁

| 门禁 | 结果 | 单次秒 |
| --- | --- | ---: |
| typecheck | PASS | 0.398501 |
| arch:check | PASS | 0.186750 |
| npm test | 1032/1032 | 20.454177 |
| build | PASS | 0.397269 |
| Chromium fixture | 153/153 | 92.368286 |

[日志](gates/gates.json)：每项前后Git status为空、恢复0，冻结前后相同；无端口/浏览器资源冲突。单次结果，不称中位数。

## 严格扫描的限制

整份HAR命中key模式即拒绝，包括符合模式的第三方公开地图参数。旧h-12录制缓存有同一已知公开Static Maps参数的50处模式命中，只有指纹被记录，未复制或打印其值，见[限制证据](../strict-scan-limitation.json)。未新增公开key白名单，也未放宽扫描。

这意味着当前页面若仍包含同类模式，安全扫描会拒绝该HAR；本轮没有Live测量当前页面。F5真实录制覆盖及一轮耗时仍需后续验证，不能因fixture完整通过就宣称所有网站录制已可回放。

新增真实模型、Google、餐厅网站、Live、环境重跑全部0。依授权合入并推送后停止，精确最终main SHA以总报告的交付回执和对话报告为准。
