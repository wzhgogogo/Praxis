# 3C 第2步：真实 PostgreSQL 入口与单次受控 LIVE_READ 冒烟

- Status: local / not integrated；2A入口与2B单次前后端链路已执行；不是Holdout、发布签收或独立合格交付认证。
- Date: 2026-11-17（Asia/Shanghai）。
- 工作树 `/private/tmp/praxis-3c-closeout`，分支 `codex/feat-web-workspace-3c-closeout`。
- 初始预检提交 `ee760c35883604e6cb8150a8e26e68717af4e829`；初次编排冻结 `19607b8ce01bb8894bd5e4bda2bcc89d49d96fbb`；**最终2A与唯一2B实际执行SHA：`9201d40bf5eb2e895041a25f6d15628dd6791415`**。
- 产品源码沿用已验 `bd9fa5c8cda3787b3928eafc2d86f137c390f08b`，src/scripts/package/lock/web-skills diff为0；核心组装与既有测试断言未改。

## 授权、专库与脱敏

最初只读.env发现DATABASE_URL为非本机https目标，按前置条件停止，零连接；原预检报告保留。用户随后明确批准使用**本机系统账户、本机127.0.0.1:5432**盘点与专库覆盖，不改主.env，不连接/复用远端URL或凭据。

强制只读盘点：praxis_smoke业务表全空，仅有9条既有迁移；praxis_web有14任务/97事件/32消息/114轨迹及State10/Definition10历史记录，保持只读。选定 `praxis_smoke`，没有新建数据库或清空既有库。原烟测应用追加的0010迁移后，该库共10条迁移；本轮新任务为State25/Definition24。迁移前，父进程覆盖DATABASE_URL和PRAXIS_TEST_DATABASE_URL；实际Node子进程二次输出protocol=postgresql:、host=127.0.0.1、port=5432、database=praxis_smoke。2B使用--env-file后仍是该目标，见各阶段 `effective-target.log`。

2A不把Live凭据注入CLI；2B原CLI使用主.env其余配置，父环境显式固定LOCAL_CHROMIUM/PORT4312及两个Live开关。Google沿用已配回环代理，启动前只检查代理端口监听；DeepSeek与本机来源浏览器按原默认直接连接，没有另加备用Provider、重试或凭据探针。PRAXIS_PILOT_ACCESS_JSON缺失，按原CLI默认配置登录；session请求体与所有Authorization/Cookie/Set-Cookie均未保存，截图均在登录后。

HTTP/SSE按字段白名单记录path/method/status、必要公开业务参数和case/progress/question字段，不记录认证headers。服务stdout/stderr、导出JSON与Markdown经过敏感值替换；扫描本轮目录未发现实际.env密钥/Token/远端完整连接串。不得据此将所有PII治理视作已全面审计。

## 2A：真实 PostgreSQL + 原版 FIXTURE CLI

在OS禁止非回环网络的环境中，显式本机专库与PRAXIS_ALLOW_TEST_DATABASE_WRITE=1运行原 `npm run test:postgres:live`，退出0，日志为 **real-postgres-smoke: pass**；原烟测自有临时Goal/Task清理完成。

再运行原 `node --import tsx src/server/local-web-server.ts`，FIXTURE模式、127.0.0.1:4312。公开兼容输入：

`Need a table tonight at 7pm near Shinjuku for two, yakiniku, around 5000 yen`

登录成功、POST /api/cases 201、收到真实SSE、最终GET与PostgreSQL task/event/conversation/message相符。实际阶段为 **AWAITING_AUTHORIZATION**，没有点击授权或提交任何现实动作。Fixture模型固定解析旧日期、Fixture来源固定旧库存/LOW身份，与系统当前2026-11-17不构成当前可订证据；此结果不能被报告为真实预约、可用B1或G1验收。

最终成功轮：总墙钟1.637s，search resource elapsedMs=44，agentDecisions=4。FIXTURE CLI未记录modelCallsStarted/Google实发计数，明确记NOT_RECORDED；其真实模型/Google/网站调用均为0（Fixture边界+OS隔离）。SSE **1条终态快照**，因同步执行很快，没有观察到单独的中间active进展；不冒称2A覆盖了Live持续进展，后者见2B的12条SSE。

**保留的首轮收尾错误：** 首轮相同FIXTURE链路和PostgreSQL烟测已通过，但外层归档器误把诊断Markdown当作JSON，退出1且未保存HTTP/SSE内存记录。已保留 `2A-attempt1/`、恢复并脱敏归档所有该轮文件；只修外层归档，重新冻结后重做零外调2A。首轮不充当最终成功日志。2A因此共有两条测试Case，2B从未因该错误启动或重跑。

## 2B：唯一一次原版 LIVE_READ CLI

2A通过、必需变量存在、Google代理端口就绪后启动。Node参数为主.env + 原local-web-server.ts；父环境覆盖本机专库、LOCAL_CHROMIUM、PORT4312，原核心/组装/预算不变。

冻结的一条完整需求：

`Table for 2 in Ginza on 2026-11-19 at 20:00 for sushi`

| 指标 | 本次实测 |
| --- | --- |
| 完整需求 / 显式G1 / 本地departure | **1 / 1 / 1** |
| 补问 / refresh / another-batch / 重跑 | **0 / 0 / 0 / 0** |
| 找店实际终态 | **PRESENT_RESULTS，1家展示** |
| agentDecisions | **7** |
| modelCallsStarted（找店） | **47** |
| googleRequests（找店） | **5 / 100**：discovery2、Details2、named resolution1 |
| elapsedMs（找店首产物） | **266828** |
| 总墙钟（含启动、G1、出发、收尾） | **272042ms** |
| SSE消息 | **12条，包含中间active进展** |
| G1回答状态 | **ANSWERED** |
| G1回答报告的模型调用 | **1**；这是回答中的modelUsage，不伪装为独立抓取的全部G1内部调用 |
| G1请求到完成快照的观察间隔 | **2339ms** |
| G1新页总数 | **未独立测得**；原配置上限2，checkedPages列一份当前店页面 |
| 本地booking-departures | **201，PostgreSQL新增1行** |

原找店上限为模型50、Google100、自动浏览器500000ms；以上可读计数低于对应声明上限。原G1每次上限3模型/2新页/60000ms，外层另限一次。CLI原始产物没有完整执行器effectiveLimits/逐网站派发轨迹，不能据这些计数补写“所有细分预算已独立证明”。CLI在G1后还保存一份资源elapsedMs=266869、找店modelCallsStarted仍47的产物；G1的modelUsage单独记录，不把47直接当整个会话所有调用总和。

### 展示、G1与B1

展示店名 **Sushi Tempura iwai in Ginza**，candidateId `praxis:restaurant:fc747ae09de4b8ce5f0f69d3`。服务端offer为2026-11-19T20:00:00+09:00、2人、TABELOG，页面显示一致。

在详情唯一底部输入框只问一次：`Do they have private rooms?`。/questions返回200，ANSWERED；回答引用同店 `/en/tokyo/A1301/A130101/13305528/`，保存的三个引用片段为“Private rooms”“Available”以及“If you are bringing children, please make a reservation for a private room.”，identityEvidenceId均绑定当前候选。这里只报告实际回答与引用，不冒充对原始网页全文的独立认证。

G1后读取浏览器实际currentHandoff()，非空；B1 displayExpiresAt为2026-11-17T03:24:00.114Z，出发记录时间03:14:10.895Z（均UTC），当时未过期。因此点击出发，没有触发过期自动refresh路径。offerId：

`offer:tabelog:praxis:restaurant:fc747ae09de4b8ce5f0f69d3:2026-11-19:20:00:2`

以下三个URL完全一致：页面当前B1、201响应url、新标签页context拦截URL：

`https://tabelog.com/en/booking/form_course/new?member=2&rcd=13305528&visit_date=20261119&visit_time=2000`

该新标签页GET在UI context路由中被abort，未打开真实预约入口，未执行预约提交。这里只证明该一次出发导航被拦截；**不把它当作后端浏览器所有网站请求计数**。

独立SQL验证restaurant_booking_departures新增行绑定：

- conversation_id `conversation:44d9e0479bf52c24a27915d1`
- candidate_id / offer_id 与上述一致，provider `TABELOG`
- 表本身没有url列；URL关系来自页面/HTTP/拦截记录，见 `2B/departure-verification.json`。

原通用JSON脱敏器把pg的Date对象变为{}，因此原SQL快照的departed_at没有有效字符串；随后只读SELECT departed_at::text补存正确时间，没有改数据库行，也没有重跑Live。

## 原始诊断与四层评价

CLI的查找完成产物与自动evaluation/diagnosis原样保留为脱敏副本；另外保存最终GET和SQL，因此G1与出发结果不依赖早期artifact是否包含。实际发现本版CLI在G1结束后也写入第二份read artifact，仍额外采集最终快照，未用它代替SQL出发证据。

- **端到端结果：** 技术链路从真实页面输入到PRESENT_RESULTS、G1、有效B1本地出发记录已走通；自动评价的结果为 **NOT_EVALUATED**，不报告QUALIFIED_DELIVERY。
- **逐环节：** 自动诊断认为请求保真、已执行观察归属可读；REQUIRED_EVIDENCE/FINAL_CLAIM因缺原始Tabelog响应和日期/人数选态快照未评价。来源身份/空位/菜系的完整独立资格核验未完成。
- **严重程度：** 自动诊断 **S0 NOT_EVALUATED；S1 PRESENT**，原因是展示MET条件缺独立来源支持。它不是已经证实来源反驳，但必须保留，不改成0或PASS。此sidecar在找店结束时已写出，外层在G1前未实时读取，直到整轮服务关闭后的证据复核才检查到该标记；本轮不宣称实时S1诊断停闸已验收，不再追加任何真实调用。
- **归因：** 当前直接证据支持“CLI产物缺独立原始来源/网络边界记录”的评价缺口；不能据此确定实际网页读错、S0为零或现实预约成功。没有做额外来源回访来补证，避免突破一次预算。

**externalSideEffectCount = NOT_MEASURED；后端全部网站请求数 = 未测得；S0 = 未独立评价。** 记录了本地合法登录/Case/questions/departures POST；不能因HTTP方法为POST把它们或Guard审核的只读查询POST误报为外部业务写入。本轮没有执行用户层面的真实预约提交操作，也不把这一事实升级为“所有外部副作用均测得为零”。

## 关闭、产物与保护

2A、2B服务均SIGTERM正常退出0，UI context/browser关闭；专库无剩余连接，4312无监听。主库praxis_web的迁移、State/Definition版本与所有盘点业务计数均保持；praxis_smoke保留本轮2条Fixture Case和1条Live Case及审计记录，未清空库。

`.eval-artifacts/restaurant-web-read/` 本轮新增JSON/Markdown均脱敏归档，并记录原始/归档SHA；临时新增文件已移除，目录为空。未动原先材料。2A/2B各有run.json、白名单HTTP/SSE/console记录、初始/终态/最终GET、SQL记录、服务日志与截图；见[summary.json](summary.json)、[2A原记录](2A/run.json)、[2B原记录](2B/run.json)。

关键截图：[Live找店开始](2B/02-request-started.png)、[Live结果卡](2B/03-search-finished.png)、[G1答案](2B/04-g1-answer.png)、[有效B1](2B/05-handoff.png)。每阶段有1次预期登录前GET /api/session 401及对应资源console error；非预期HTTP错误0、pageerror0。登录截图没有填入口令。

主目录HEAD/status/index哈希不变，主.env未写入；产品/核心/测试断言未改。只本地提交，不合main/推送。不把127.0.0.1工作区称为手机只读复查页：它仍带刷新/续查控件，真机Safari/Android Chrome验证待单独安排。当前停止，等待本轮结果复核，不追加Live、G1、刷新或重跑。
