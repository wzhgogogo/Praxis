# TableCheck 最后一轮离线对比：转 B，等待合入复核

Status: **draft / not integrated**。时间 CET（UTC+1）。复核基线`cfe3aa87`，产品候选`5afe1d4a`。本轮新增来源 GET0、模型0、Live0，未使用任何条件 GET，不运行 D8 或 held-out。

结论：找到真实旧成功记录，但**没有找到明确、可本地复现并修复的回归差异**。不把未知原因认定为网站拦截，不模仿浏览器或绕过限制；按用户决定转 B。当前文字搜索和 TableCheck B1 的真实能力未验证，放到3b之后。

## 旧成功证据和近期录制

[提取器](compare-recordings.py)只读取原文件，输出键形状、方法、类型、状态、头名称/类别；不复制查询值、请求头值或正文。[逐项对比](recording-comparison.json)、[输入SHA](comparison-input-sha256.json)、[汇总](extraction-summary.json)。HTTP计数按同一个 dataset 的浏览器终态统计；Node回调/Guard快照另列，不能累加为额外请求。

| 录制 | 传输 | 查询和类型 | 已录响应事实 |
| --- | --- | --- | --- |
| 10-20 production，a37e152 | 现有 Guard `route.fetch` | catalog无查询；地区search；GET Fetch，OPTIONS Other | catalog200、search200；Guard录到OPTIONS204，来源预检NONEMPTY |
| 10-20 guarded | 同上 | 同地区输入；页面等待真实API与DOM | catalog200、4份search200；显示20张卡片 |
| 10-20 plain | 独立只读route过滤+`route.continue` | 没有生产Guard，仍启用Playwright拦截 | catalog200、4份search200；显示20张卡片；不是没有任何route的原生控制 |
| 10-23 h14 guarded/counterfactual | 当时Guard `route.fetch`，另有只读Node直读 | 原问题是facet形状没有hits；其他主搜索能返回 | 两组catalog200；原Guard主搜索2份200；受控合同对照5份search200。事件没有方法时保留METHOD_NOT_RECORDED，不把204冒充GET响应 |
| 11-06 D8 Live，冻结9482ef61 | `GUARD_ROUTE_FETCH`，时间线直接证明 | 地区/原有id等形状；GET Fetch | **5次catalog GET200、16次search GET200，共21个不同requestId**；还有被拒/失败条目，未过滤掉。不能说search-v4自10月以来一直无响应 |
| 第一次探查，11-06 | 显式`BROWSER_GET_HEAD` | catalog无查询；文字形状当时未审核 | catalog两次无status；文字预检拒绝，不能称无匹配 |
| 第二次探查，11-07，82ac67fb | 显式`BROWSER_GET_HEAD` | 新文字精确形状；q获准；destination OTHER拒绝 | catalog4个GET终态均无status；search4个GET终态无status，其中有被Guard拒绝者；7条MissingAllowOriginHeader。3个OPTIONS204，另1个拒绝。失败有约300ms，也有首次catalog约1524ms |
| 第三次探查，11-07，4b68893f | 生产默认`NODE_FETCH` | 没有发到search-v4 | 入口200，主脚本未返回，20秒导航超时；不能据此判断API已恢复或仍CORS失败 |

10-20成功形状包括：`cuisine,hits,lat,lng,offset,party_size,queryProfile,radius_km,scope,sort`；无offset的同组；`cuisine,hits,id,open_day,party_size,queryProfile,service_mode`；`hits,id,queryProfile`。10-23另观察缺hits的facet。近期文字形状来自新联想动作，完整集合逐条保存在对比JSON；catalog始终没有查询键。新增文字键不能单独解释catalog的失败。

`inventory-06`实际是12份Tabelog `/en/booking/calendar/find_vacancy/` 见证读取，不能当search-v4成功录制。`3d323739`只提交该批冻结清单，其树中规则注释是早期来源记录的说明，并非那次成功HTTP响应。已用10-20和10-23实际成功记录替代这一推断。原inventory产物未改。

## 请求头、响应头与预检的证据边界

- 所选旧录制和新来源trace**没有完整请求头名称集合**；Guard可见的`requestedHeaderNames`只证明预检请求了`x-api-key`等已存名称，不代表完整头集合。字段为null表示“未记录”，不是空集合。
- **完整响应头名称集合也未记录**。近期trace只保留CORS类别；预检的EXPECTED_ORIGIN/credentials事实最多证明已知的头名称子集。GET的MissingAllowOriginHeader是浏览器处理失败事实，无法恢复上游status、完整响应头或正文。
- WAF/CDN相关头名称未保存，不能据此断定存在或不存在WAF/CDN拦截。清洗HAR中的content-type是回放构造字段，未拿来冒充真实wire header。
- 10-20锁文件和当前锁文件都固定Playwright1.62.1，integrity相同。安装包`lib/coreBundle.js:36015–36032`在浏览器preflight被拦截时会本地`Fetch.fulfillRequest`204。Guard做CDP准入与继续，不是它生成响应。约4ms的204不能证明真实服务器收到预检。

上一轮报告把本地预检代答归到Guard，层次不准确；[另附更正](correction-to-cfe3aa87.md)，原报告/原录制不覆盖。这个依赖机制在旧成功运行已存在，不能当作近期新回归。前次本地三模式条件Origin/CORS均通过的接收端事实仍成立。

## Git定位与判断

[历史对比](history-comparison.json)记录完整SHA、CET时间和作用：a60d27b7（来源绑定预检）；b6ac60c5（catalog预检、hits可选）；28963ca8（fetch/xhr和读合同投影）；dd98b783（显式原生实验，默认仍Node）；0244450a（表单收据）；1c32a45f/7a95ee7d（观察和获批精确合同）；d32c604e（暂停导航时不执行页面JS）；c48ef60c/5afe1d4a（PAGE和仅script的录制上限/遮盖）。Recorder历史变更也由本轮`git-history.log`保留。

已知差异是：近期原生实验与D8/旧Guard的传输方式不同、查询动作不同、运行时间不同；缺少完整头与egress资料。默认Node在D8能拿到200，第三探查却在更早的文档准备阶段超时。现有三模式本地测试也没有产生CORS失败。没有一项差异构成可测试、可修复的本地因果证据；不猜测更改预检、头、方法、源站、路径、凭据、限制或预算。**条件新增GET的前提未满足，直接转B。**

## B合入候选与能力边界

候选分支`codex/chore-tablecheck-safety-integration`从本轮刷新并经ls-remote核对的main`f324f17b89aec0cb2599b1a8a88e599b5d0cdb61`建立，FF纳入已复核`cfe3aa87`。不是main发布。全部已复核源码和失败/评测历史保留；不做历史压平或覆盖。

包括72b18bee系列：Tabelog同次读GET表单收据/完整字段多重集绑定、结果列表完成与详情拒绝、TableCheck接受的用户全名优先/已计划换词、PENDING重新读取且完整性门槛不变、D4独立身份补证与旧NOT_EVALUATED、模型验证产物。包括当前安全改进：读范围值类别、四种精确合同和权威值限制、公开SPA路由局部清洗、来源公开script12MB等长凭据遮盖、PAGE仅观察。最终生产代码/配置与5afe1d4a逐字相同；本轮没有产品修补。

能力矩阵显式标记：TableCheck文字搜索和TableCheck B1 **未验证（search-v4在最近原生探查环境无可用响应，根因未定；D8旧Node成功不认证当前文字查找）**。两项列为3b之后待办。其他来源/旧Fixture不被改写为失败，旧离线B1通过也不冒充当前TableCheck真实签收。

按本轮用户指令，STATUS/DEVLOG/TEST-LOG的main发布更新留到复核通过后的那次合入；本候选只更新能力矩阵和独立报告，并准备[合入时文档更新清单](main-integration-checklist.md)。当前分支不是已发布current baseline。

## 验证、冻结与停止

GATE_RESULT_PENDING

完整门禁按Test唯一矩阵：typecheck、arch:check、npm test、build、test:browser:fixture（含完整G6）、严格G2。每项前后必须净树且SHA相同。不新增行为测试：本轮没有产品逻辑改动，既有有效红绿与安全断言全部复用；新提取器另核对原输入SHA、D8独立21个ID及反例分类。

四层：整单/用户交付NOT_EVALUATED（D8与held-out未跑）；步骤仅离线历史metadata比较/现有机制回归；无新来源观察、无S0成功宣称；归因停在证据不足。门禁全绿不关闭TableCheck当前真实能力缺口。

本轮GET0/model0/Live0。累计350次公开GET、653模型、23Live；批准GET上限463中的新增入口1仍有“明确可测修复”条件，原条件文档1只限选店后新文档。D8 Live1及见证/后验GET3、留出18Live/108GET全部未动。详见[预算与决定](decision-budget.json)。

停下等复核：不合main，不运行D8，不消耗条件GET；等待复核者确认进入held-out，不自行启动。
