# 3C 第2步：数据库目标预检停止

- Status: draft / not integrated；2A/2B 均未启动。
- Date: 2026-11-17（Asia/Shanghai）。
- 工作树 `/private/tmp/praxis-3c-closeout`，分支 `codex/feat-web-workspace-3c-closeout`。
- 开始提交 `b2d216d1ba38e244a33cbc25164066bc965f56d4`；已验源码 `bd9fa5c8cda3787b3928eafc2d86f137c390f08b` 不变。

## 已完成的只读预检

在任何连接前，用Node内置parseEnv只读解析主目录.env。只保存变量名/是否存在、脱敏数据库目标与代理元数据；未打印或保存密钥、Token、密码、Cookie、代理凭据或完整连接串。`.env`未写入、复制或加载到服务进程。

DATABASE_URL解析为 **https:、非本机目标**，不是PostgreSQL URL。host记为NON_LOCAL_REDACTED，database不记录，未显式写port，HTTPS协议默认端口443。首次终端只读摘要对未写port错误套用了PostgreSQL默认5432；正式元数据按协议纠正为443。没有基于错误端口做任何连接。

DEEPSEEK_API_KEY/DEEPSEEK_MODEL、GOOGLE_MAPS_API_KEY、CLOUDFLARE_ACCOUNT_ID/API_TOKEN均存在，仅确认非空；不证明有效性。PRAXIS_BROWSER_ENGINE缺失，原factory将默认Cloudflare；PRAXIS_PILOT_ACCESS_JSON缺失，若以后获准启动原CLI，默认登录配置仍为praxis-fixture-a。本轮未登录，也没有口令截图或HTTP认证记录。

PRAXIS_GOOGLE_API_PROXY_SERVER存在、URL可解析，为无凭据的回环HTTP代理配置；仅解析，没有连接或探针。其余本机浏览器/模型代理变量未配置。完整的字段白名单摘要见 [sanitized-environment.json](sanitized-environment.json)。

## 停止依据与未运行项

用户附件要求：**“只有在 DATABASE_URL 目标确认为本机 127.0.0.1:5432（localhost）时，才对本地 PostgreSQL 做只读盘点。”** 当前不满足，因此未自行改目标、使用远端凭据连接本机，或绕过前置条件。

- PostgreSQL/代理/模型/Google/网站连接尝试均0。
- 未盘点praxis_smoke/其他数据库，未建库、迁移或写入。
- `npm run test:postgres:live` 未运行。
- 原local-web-server FIXTURE与LIVE_READ CLI均未启动；没有监听/登录/Case/SSE/数据库运行证据。
- 2B单次需求、G1和B1出发均未执行，授权预算未消耗，没有重跑。
- agentDecisions/modelCallsStarted/googleRequests/elapsedMs/availability/B1/G1运行指标均NOT_RUN；externalSideEffectCount保持NOT_MEASURED，后端网站请求计数NOT_MEASURED，S0未独立评价。未借“没有启动”宣称完成现实边界评价。

上轮五门禁/双尺寸Fixture/D01-D02 Replay结论保留，不冒充本轮2A/2B证据。未修改产品、核心组装、测试断言或既有账本；未推送/合main。

## 继续所需的具体确认

当前仅可交付预检停止。需要用户二选一：

1. 明确授权本轮绕过.env目标前置条件，**只用本机系统账户**对127.0.0.1:5432做只读盘点，并按原规则选定/新建专库；仅对子进程显式覆盖本地PostgreSQL URL，不修改主.env，不把远端URL中的任何凭据移用于本机。实际最终host/port/database仍须在迁移前二次核对。
2. 用户先修正主.env的DATABASE_URL为本地PostgreSQL目标，再通知本任务继续。任务自身不修改主.env。

在该确认之前不建立任何连接，不启动2A/2B。
