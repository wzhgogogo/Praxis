# D4 / D8：真实页面探针，停止点 1

2026-11-05，项目记录采用维也纳 CET（UTC+1）。本会话 C 负责后续整条链路，当前只完成步骤1诊断和步骤2探针。**D4/D8 尚未修好，未运行最终 Live，未合 main。** 下一步产品修改等待本停止点复核。main 基线 f324f17b；探针诊断提交7bcef8a6，依据真实输入标签修正外层探针后的提交f5bdd82d。

用户直接提供的工作规则已原样保存到 `phase3/WORKING-RULES-20261105.md`。本轮没有更新 STATUS/DEVLOG/TEST-LOG，没有跑全套门禁；只运行相关测试。模型、Google、身份规则、Guard 准入、State/TaskDefinition/Prompt/Schema、导航/provider/候选/整单时限都没有改变。不读或加载.env；未读取留出原文。

## 1. 诊断改动与验证

Guard 转发异常现在保留有界、脱敏的 error.name/message/code/cause（最多3层原因，不保存 stack）。消息只保留首行；移除完整URL与查询片段，截去 Cookie/Authorization/header/body/token 等内容。CDP 转发异常及重定向超时也保留这一投影。失败记录仍是原来的 READ_REQUEST_FAILED/READ_TIMEOUT，没有改变准入或错误业务分类。

`BrowserReadNetworkObservation.error` 与 snapshot networkDiagnostics 增加可选字段；LocalPlaywrightChromium 的运行时异常附带当前 Guard 的失败事实；Executor 的来源 OPERATION_FAILED 诊断和录制/导出保留 networkFailures。这样 TABLECHECK / TABELOG 的失败即使发生在首次导航、没有可读页面，也不会再丢掉转发原因。这些是诊断，不进入权威 Task State，也不替代身份/库存证据。旧录制没有的原因无法追补。

红灯 `diagnostic-red.log`：未修 Guard 的 error.name 为 undefined。它是诊断机制的受控传输反例，不冒称旧D8的真实底层原因；真实缺口由历史D8三次早期失败及旧诊断缺失印证。26项 Guard/导出相关单测通过；83项执行器、录制、Local Chromium测试通过。新增真实回环 Chromium测试验证两来源标签的导航失败均输出脱敏原因。最初一次相关测试包含 macOS 沙箱不能启动 Chromium及一个测试误取ADMITTED行的编写问题，原日志保留为 `diagnostic-first-attempt.log`，不算产品红灯；修正为检查FAILED行并在允许的本机环境跑绿。没有调断言门槛、产品时限或安全规则。

## 2. 探针结果

三类录制均启用：浏览器录制、确定性操作决策日志、Google捕获。决策的 actor 明确为 DETERMINISTIC_READONLY_PROBE，不伪称模型；Google和模型端口没有注入，Google捕获文件明确为空/0。采用匿名独立 Chromium，无显式代理配置（沿默认 Chromium 网络路径）；**没有验证它与旧A运行的网络出口相同**。所有来源访问经过原来源规则及原生发现既有 genericPublicRead，TableCheck永久reserve禁令保留。页面导航20秒，页面请求实际起点最小间隔19.271秒。

| 记录 | 页面读取 | DCL | 实际结果 |
|---|---:|---:|---|
| A（首次） | 1 | 5.671秒 | 首页成功。外层探针的输入匹配漏了真实占位文字中的 Location，输入前断言停止；没有输入或点击。原件保留。 |
| A-OBSERVED-INPUT | 1 | 6.208秒 | 按实际可见输入标签填写Akabane，观察并点击唯一 `Akabane Sta.（Tokyo）`；href逐字为 `https://tabelog.com/en/`。 |
| B-TABLECHECK | 1 | 未到达 | 搜索首个文档在TLS建连前失败；没有站点HTTP响应。 |
| B-TABELOG | 1 | 5.355秒 | 13186922详情可读，标题 Nodoguro Senmon Ginza Nakamata Reservation。未设置日期人数，未宣称查位或HIGH。 |
| C | 1 | 7.457秒 | 13108466详情可读，完整记录Node取回与浏览器逐请求时间。未设置日期人数或点击库存。 |

### A：真实点击的结果和先前假设有区别

本次点击后**没有跳到列表页**，URL仍是 `https://tabelog.com/en/`。`recordings/A-OBSERVED-INPUT/source/diagnostic/snapshot-0003.html` 显示搜索区新增可见的 `Akabane Sta.（Tokyo）` 地点标签；页面自身把所选地点记录为站点134、A1323/A132305。后两项只作为保存的页面事实，**没有用于拼URL、选择动作或写死产品规则**。本次后续只观察到同页 GET Search 按钮、日期和人数控件，没有提交表单。

所以，原来按 href 过滤会误拒绝这一项；但简单删除过滤、或把href直接当落点导航，仍不足以完成检索。真实行为需要“实际点击 → 回读可见地点标签 → 观察同一搜索表单的GET提交控件”。选中后地点输入本身的placeholder/label可能变空；当前投影中输入和Search都没有 controlGroupKey，之前手写页的“输入值=标签且分组齐全”假设不能用来验收。

历史原件参考：A1d88ba11 的 D4 snapshot-0003.html 显示同一首页href；snapshot-0024.html 显示真实可观察的赤羽串炸列表链接。具体原路径与SHA在 `historical-references.json`。不把较晚到达门店才看到的链接倒灌为搜索起点。

### B：TableCheck 本次的真实失败原因

Guard：`route.fetch: Client network socket disconnected before secure TLS connection was established`。

浏览器：`page.goto: net::ERR_FAILED`。来源页面响应尚未取得，录制得到的是不可用文档，不能归因于查询词、店名身份或页面无店。底层没有提供独立errno/更深cause，报告没有补造。该观察定位了**本次 Node转发TLS阶段**；没有证明旧D8一定是完全同一网络原因，也没有证明网站全局故障、IP封禁、具体TLS指纹或代理配置错误。

Tabelog详情在同一探针序列中可读；这只能证明该公开页当前连接成功，不能推出完整的候选身份已绑定、11-11/20:00/2有位或B1已生成。没有输出双渠道产品交接清单，也没有用见证链接代替。

### C：转发耗时与真正“额外开销”分开

`paired-timing.json` 用**同一 Playwright Request 对象**关联Node转发和浏览器终态，不按URL/顺序猜配。A的原逐请求时间线同时保存；关闭后的取消/迟到事件保留，不视为真实响应完成。

| W1请求 | route.fetch取回 | 浏览器该请求完成 |
|---|---:|---:|
| commons.js | 4660.706 ms | 4732.184 ms |
| rstdtl_common.css | 3387.297 ms | 3411.793 ms |
| booking_common.css | 3311.841 ms | 3330.502 ms |
| inbound_restaurant_detail/top.js | 3140.866 ms | 3158.702 ms |

这些请求并行，不能把它们求和当7.457秒页面耗时。取回时间包含源站连接、传输、重试策略的库行为及缓冲，**并不是已经测出的“Node自身开销”或“改continue可省的时间”**。本次没有无Guard/continue对照，无法识别原生浏览器可能快多少。可以确认浏览器收到响应前等待Node完整取回，不能声称主要瓶颈的因果已证实。

## 3. 真实回放所需的缺口（本轮一并暴露）

录制器全部开着，但“开着”不等于完整可回放：首次首页2/2快照REPLAYABLE；A继续过程首页1/3可回放，输入/选中后2个快照报UNCAPTURED_DYNAMIC_RESPONSE；两详情均报同项；TableCheck失败没有可回放文档。原始录制资格不改，没有将诊断DOM升级为Replay或伪造成功资源。

A新增的实际公开GET为 `/en/suggest/keyword_suggest`，字段仅keyword；这是generic public读取实际放行的联想响应，现有录制资格未完整保留。两详情的动态请求包含 `/internal_api/restaurant_tel_call_available?rst_id` 和 `/en/booking/calendar/initial_vacancy`（rst_id、exclude_unavailable_time）；部分在探针截图/关闭边界仍在处理。录制报告不会区分全部缺响应的更细原因，故目前只列已观察端点和实际缺口，不能断言每项都是格式不支持或都是关闭取消。

下一步完整Replay不能偷偷填补这些缺失。应先在**不改变Guard**的前提下核对/补齐录制端的精确公开响应保存与有界收尾（限现有20秒窗口），再跑真实浏览器回放。若需要补采，用当前剩余的10次探针页面额度，必须在停止点复核确认精确清单后进行；本轮没有追加请求。

## 4. 下一步整链修改计划（等待复核）

1. **D4观察与动作一起改**：在 `native-restaurant-search.ts`、`BrowserTaskExecutor.selectLocationSuggestion` 及必要的通用控件投影中，取消“联想href必须是地区URL”的验收假设；对观察到的唯一地点项执行真正点击，重新读落点/同页地点标签，由可观察内容决定是否需要公开GET Search。若仍同页，必须确认所选地点和实际表单归属，不能依赖已变空的输入值或私有class。Guard对真实导航逐请求把关；不拼R134 URL。删除/替换以前只适用于手写链接/选项页的实现分支，保留无匹配、歧义、异地、店名项的行为覆盖。真实原件来自本轮A及历史D4，不以新手写页作主要验收。
2. **先修录制完整性，再从请求开始回放**：以原D4/D8用户原文、参考时间、决策/Google保存响应和逐次真实页面/响应为输入，沿createLiveReadAssembly驱动 Interpreter→Compiler→Reducer→发现→身份→查位→展示/B1/G1。每段来源材料保留各自时间和出处，独立见证不伪装成旧执行中已读证据；缺少的响应明确未评。D4必须越过地点选择到交付或有原文支持的无位，并触发原私人包间问题；D8必须唯一身份后查位/B1，或保留可证实的失败。Tabelog名称与用户英文名称的翻译差异不靠新增同义词解决。
3. **D8根因验证优先于身份规则**：目前证据足以把问题收敛到Node转发TLS阶段，但不足以选一个可靠代码补丁。先核对旧运行和当前运行的显式网络配置；如需比较同URL的Node转发与浏览器原生TLS，必须先通过下面Guard传输方案的安全复核。在比较前不把代理、UA或TLS选项的猜测写入产品，不禁用证书校验，不增加隐式重试，不将连接失败当身份未知来放宽匹配。

### 时限链：只给数据和待决定方案，不改数值

| 层 | 当前 | 证据与约束 |
|---|---:|---|
| 单导航 | 20秒 | 本轮成功文档DCL5.355–7.457秒；历史D4脚本完成16.817秒，D8首个Tabelog搜索在20.103秒切断。未完成样本不能算正常完成时长。 |
| provider | 45秒 | 历史D4有4次45.001–45.018秒provider耗尽；Dengana候选约50.742秒，未完成查位。 |
| candidate | 90秒 | 比provider长，但单来源在45秒先被切断；候选累计仍约束多来源。 |
| 整单 | 500秒 | 历史D4读取487.810秒，model88.791秒；20秒收尾保留不变，不在保留区开启新读。 |

**现在没有完成“身份+查位”的正常样本，因此不能声称测出了合理的新时限。** 建议先完成真实回放，记录身份前缀/查位尾段/模型等待、复用后重复导航与并行资源，再决定provider是否与候选剩余时间对齐（上限90秒，并受整单−20秒保留夹紧）。这一建议会扩大provider原45秒窗口，属于必须用户批准的变化；尚未实施。单导航20秒、候选90秒、总500秒和20秒保留均暂不改。不以加大整单或加重试掩盖路径缺陷。

### Guard传输方案：因果未证实，未实施

备选方案仅供安全复核：在保持同一endpoint/method/query/body准入、同一CDP重定向边界、禁止路径及resource policy的前提下，生产已放行GET/HEAD交给浏览器原生传输，录制保留完整响应的独立机制。先验证重定向、iframe/worker/popup、CORS预检、POST、故障关闭与录制模式的一致性，再对同页做受控对照。它可能改变连接/TLS和响应时序，是安全相关执行边界变化，不能直接把route.fetch替换成continue上线。是否批准该方案及有界对照，由用户/复核者决定；本分支没有任何continue改动。

## 5. 资源、请求与停止

所有5次页面传输在Guard实际fetch之前写入 `budget-C.json`；页面起点间隔最小19.271秒。66个底层已发起Node传输通过逐请求时间线保存，并计入restaurantWebsiteRequests；均为GET。独立探针检查未发现预约、登录、确认、支付或提交类路径的转发，实际动作日志没有表单提交。此项是有界组件探针核对，不宣称完整D4/D8的S0签收，也不以Guard的ADMITTED标签代替整单独立评价。

本会话新增：公开页面GET5/15，底层网站传输66，模型0、Google0、Live0。共享汇总321/440 GET，16/36 Live，460/1600模型；留出预留108 GET、18 Live原封不动，剩余119 GET中108预留；本轮探针余10页。旧923行账本按id/value保留在只读baseline，本会话只写自己的文件，脚本汇总，不覆盖他人条目。

**停在停止点1。** 待复核真实探针、录制缺口和整链计划；没有改地点产品逻辑、身份、Guard权限、时限或预算数值，没有运行D4/D8最终Live。全套门禁将在获准修复并准备合入时统一运行，main合入后再次停在Live前。此次只推工作分支供复核。
