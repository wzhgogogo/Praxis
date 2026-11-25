# 3C 第2步授权执行计划

Status: draft / not integrated；公开单次前后端冒烟，非Holdout或发布签收。

用户明确批准：只用本机系统账户，对127.0.0.1:5432盘点并选定/新建专库；父环境覆盖DATABASE_URL/PRAXIS_TEST_DATABASE_URL，不修改主.env、不连接其非本机https目标、不复用远端凭据。只读盘点praxis_smoke业务表全空（仅9迁移），选此库；praxis_web有历史数据，保留不写。迁移前通过Node --env-file的实际子进程二次校验protocol/host/port/database。

2A先执行原npm run test:postgres:live，再原local-web-server.ts FIXTURE，系统时钟、兼容Shinjuku/tonight/7pm输入，实际浏览器HTTP/SSE与SQL持久化；已知固定过期日期/LOW身份/无restaurantQuestions，不要求卡/B1/G1。2A仅回环通信、0生产凭据/外部调用。

2B仅2A通过+DeepSeek/Google配置非空+已配Google回环代理监听就绪才启动。原CLI --env-file主.env，父环境固定本机专库、LOCAL_CHROMIUM、PORT4312、两Live开关；不改核心组装/预算。浏览器来源走原本机引擎，未配置本机浏览器代理时原默认直连；Google继续主.env已有代理。不做凭据有效性探针或额外真实调用。

冻结公开输入：Table for 2 in Ginza on 2026-11-19 at 20:00 for sushi。最多1条完整需求；找店原CLI Google≤100/模型≤50/自动浏览器≤500s。交付才最多1次G1：Do they have private rooms?；独立≤3模型/≤2新页/≤60s。0补问/刷新/续查/重跑/真实预约写入。UI context仅允许本地必要POST，对refresh/another-batch/messages等额外读取请求fail closed；外站导航从context创建后拦截，覆盖popup。B1仅G1后currentHandoff实际存在且未过期才点出发，过期直接记录，不点击；还核对201/url/拦截URL/SQL行。

若出现未经授权外部业务写入、来源越界、超限、疑似错误声明或必需环境/启动错误，立即停并保留；普通NEEDS_INPUT/NO_VERIFIED_RESULT/G1 UNVERIFIED/B1过期自然收口，不重跑。现有Guard已审核的只读POST不误判为副作用；不宣称已独立观测全部后端网站派发。

白名单HTTP/SSE只保留path/method/status和必要业务字段；不记录session请求体、headers/Authorization/Cookie/Set-Cookie，凭据仅父进程内存。.env/代理/连接串/登录口令不写日志，已登录后才截图。找店结束CLI产物另归档；再取最终GET/SQL涵盖G1/出发。原临时新增文件归档后移除，不碰原件。最终统计agentDecisions/modelCallsStarted/googleRequests/elapsedMs，未测外部副作用NOT_MEASURED、后端网站请求数未测得、S0未独立评价。服务/SSE/DB干净关闭。只本地提交证据与追加文档，不改产品/测试、不合main/推送。
