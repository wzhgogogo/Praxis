# 3C 第一步：主线同步与双尺寸离线联调

Status: draft / not integrated；**按首个门禁失败停止，第一步未完成**。2026-11-16（Asia/Shanghai）。本轮只在独立分支本地提交，无 push / main 合入 / Live / 真实模型、Google 或网站请求；未加载或修改 .env，未读取私有 Holdout 或改变评分。

## 工作树与版本

- 工作树 `/private/tmp/praxis-3c-closeout`，分支 `codex/feat-web-workspace-3c-closeout`；指定入口创建并通过绝对路径 check，始终保留非 cone 稀疏检出。
- slice2：`738c2c1ea582c8d535a9cd2d67f6e00e29c2c707`。
- 本轮 origin/main：`dbc2d9c55bb9dd759a17551cbe9c11af6b1073b0`；本地引用精确吻合，不另 fetch / 改 main。
- 合并：`162b64e0f55f626191c2323ebf600c8d1b0c8e85`。
- 最终待验 / 实际五门禁提交：`4ff189db2c3ebab938508d5b3e0c93b47d103f8e`；下述运行都绑定这个 SHA。收尾提交只追加报告与原始证据，不改变产品/测试/编排字节。
- 输入冻结：`8dd1d4de31fa05742d1e3b55b71ca3c50b208afe`；原清单已保存为 `original-replay-input-freeze.json`。

主工作区 HEAD 仍 `13c93a325a80a97eb2c663613c4360776b5afe5d`，原未提交文件/索引/账本/.env/分流配置未写入。实际操作都在独立树；scope-protection.json 保留末态与保护范围 diff。

## 合并与契约核对

4 份冲突：STATUS、DEVLOG、TEST-LOG、2026-11-index；main 正文优先，slice2 原始记录追加并标历史。2026-11 月摘要自动合并。五份文档相对 main 正文缺行 **0**，页头 revision/date 自动合并差异单列在 document-preservation.json；没有重写历史证据。

`read-assessment.ts` 自动合并仍人工复核：

1. `AVAILABILITY` 且完整意图、UNKNOWN/PARTY_SIZE_NOT_SELECTABLE、请求指纹等于当前日期/人数/时间窗指纹时，过滤徒劳 FACTS；改变请求或推荐目标仍可读取。主线现有 CURRENT / CHANGED_REQUEST / RECOMMENDATION 测试随默认门禁通过。
2. 有 pendingResultBatchTarget 时，excludedFromPendingBatch 同时包含 selectionSession.deliveredCandidateIds 与 noVerifiedResult.investigatedCandidateIds；避免显式续查重复已交付/已调查对象。

相对 origin/main，core / infrastructure / integrations / eval / local-web-server 产品入口 diff 为 0。保留主线后端、Guard、身份、搜索、G1、B1 校验；前端与当前 State/CaseView 的静态类型和默认行为覆盖通过，未发现需要新增最小适配的契约差异。HTTP/SSE 新组合验收尚未完成，不能据此宣称完整兼容性已签收。

## 五门禁（同一净树提交）

运行入口：`python3 .eval-artifacts/3c-closeout-20261116/run-gates.py`。每项仅继承 PATH/HOME/TMPDIR，不读 .env，OS 禁止非回环外连。逐项前后 Git 都干净。实际 gate 退出码以 gates/manifest.json 为准；外层 Python 记录失败后 break，本身返回 0，不代表门禁通过。

| 门禁 | 退出码 | 实际计数 | 墙钟秒 | 结果 |
| --- | --- | --- | --- | --- |
| npm run typecheck | 0 | 非测试计数 | 4.918 | PASS |
| npm run arch:check | 0 | 非测试计数 | 0.802 | PASS |
| npm test | 0 | 1663/1663，0 skip | 59.834 | PASS |
| npm run test:browser:fixture | 1 | 合计340通过/351，11失败，0 skip | 306.096 | FAIL / STOP |
| npm run build | 未运行 | — | — | 前项失败停止 |

浏览器门禁分组：G2 **5/5**，25.036s，12份保存页均 PASS；其余 Chromium **335/346**，280.880s；G6 assembly 因 `&&` 前项失败，**未运行**。此处不是额外 strict G2，也不是独立双尺寸 HTTP/SSE 冒烟。

### 首个失败与影响

首失败 `src/harness/browser/browser-read-named-query.test.ts:19`，`loadReplayRecording` realpath：

`.eval-artifacts/phase3b/d4-d8-live-20261106/D8-runtime/runs/D8/D8/recordings/g6-D8-1793957744540-0`

原始 ENOENT 见 `gates/browser-fixture.log:681`。7 个失败为 6 类缺材料：D8 命名查询录制、D4 snapshot 录制、busy HTML、公开 G1 QA 文件、TableCheck preflight（两种传输共2项）、TableCheck shop 合同录制。

另4项 runner-replay 失败是本轮外层 sandbox-exec 与测试自身 sandbox-exec 嵌套，内层 sandbox_apply: Operation not permitted / code71；不是产品结果断言失败，也不是缺响应。该编排选择由本轮引入，原脚本和原失败保留，未关闭测试的 OS 隔离断言或改测试以通过。

运行结束后，按用户已授权的精确恢复规则，从本树当前 HEAD 补齐实际直接读取和 qualified-document loader 闭包 **33文件**，33/33 SHA256 与 HEAD 一致，来源缺口0。无整目录恢复、不改白名单/断言/稀疏开关、不复制其他 chat 材料。见 browser-material-closure.json、browser-material-restore.log/result.json。**未重跑**，原失败结论不变；没有把材料恢复当作门禁通过。

待确认的下一步：在原树与原代码 SHA 上采用支持测试自带 OS 隔离的非嵌套离线编排，再重新冻结/执行失败门禁及后续验收。不能用删除隔离断言、跳过失败或现有 Web 测试通过替代。

## PostgreSQL 服务入口

**未运行**，迁移、监听、登录与基础工作区请求均未验收。停止前只检查到：本机客户端存在；经本地监听权限核实 127.0.0.1:5432 accepting connections；只读 psql 连接 postgres 并查询目录成功，见 praxis_smoke/praxis_web 名称。没有建立这些库的专用性和写入授权归属，因此没有迁移或写入其中任何一个库，也没有新建数据库。

继承进程 DATABASE_URL 未配置；`.env` 未读取，其配置无法核实。**本地 PostgreSQL 目录实连成功**与**服务入口/独立测试库可写未验证**分开记录。普通 CLI FIXTURE 不注入 restaurantQuestions，不能用它签收完整 G1。

## 本地 Chromium 双尺寸 Fixture 联调

**390×844：未运行；1280×900：未运行。无本轮关键截图、HTTP/SSE 或 console 联调日志。**

已冻结 `smoke.mjs`，但因门禁停止未执行；属于 draft / not integrated 编排，不是验收结果。预定使用 startWorkspaceFixture({multiSlot:true,questions:true})、PGlite/createLocalWebServer、host.clock 对齐、context 从创建后第一时间拦截全部非本地请求（覆盖 popup），逐步核对 messages/questions、第二 offer/B1 刷新恢复、departure 的 SQL 行与 URL；无真实预约站点 GET。其脚本尚未经运行验证。

门禁中的 web-workspace 和 slice2 文件通过，只证明原测试覆盖，**不能代替这次独立完整联调**。iPhone Safari / Android Chrome 真机均未验收。

## D01 / D02 Replay

本次两例 **NOT_RUN_AFTER_GATE_FAILURE**，没有本轮终态或首个未匹配请求；不能沿用历史 FAILED 伪装当前执行结果。

8dd1d4de3 原冻结清单271文件的 SHA256 已逐 Git blob 核对，本树 HEAD **271/271一致**，没有来源缺口。根据原回放器的实际读取，从当前 HEAD 精确恢复 decisions/turns/recording/HAR 及 qualified documents 闭包83文件；原始首个缺失、恢复日志与 hash 列表在 replay-first-missing.json、replay-restore.log、replay-hash-check.json。未展开完整历史、未改原输入。

历史 `REPLAY_INCOMPLETE` 仅作待复核问题：D01 原 HAR 有同路径 keyword_suggest 200 JSON，须比对实际 URL/参数/方法/body；不能说没有响应体。D02 须核对结果页资格以及两份 Google 详情的逐请求匹配。本轮未执行，故无法判断同步代码下这些缺口是否仍存在。没有回源、伪造响应或用 Fixture 冒充 Replay。

四层报告：端到端结果未评价；逐环节仅输入完整性可证明，执行链未运行；严重程度无新独立证据，不声称 S0=0；归因中当前门禁 ENOENT 与嵌套 sandbox 有直接日志，旧 Replay 覆盖/匹配仍待验证。既有 Fixture 证据不被历史 Replay 缺口改写。

## Live 前静态环境

按实际 `local-web-server.ts`、计划 LOCAL_CHROMIUM 引擎：DATABASE_URL、PRAXIS_RESTAURANT_PROVIDER_MODE、PRAXIS_BROWSER_ENGINE、PRAXIS_ALLOW_LIVE_RESTAURANT_READ、PRAXIS_ALLOW_BROWSER_RUN、DEEPSEEK_API_KEY、DEEPSEEK_MODEL、GOOGLE_MAPS_API_KEY 在**继承进程均缺失**。未读 .env，不能推断用户持久配置缺失；值均未输出，无有效性探针，无 Live 开关。

LOCAL_CHROMIUM 使用 Playwright 安装的浏览器，不要求 Cloudflare；若选其他引擎则另需 CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN，两者继承进程也缺失。代理、交互浏览器、手动介入、Pilot/PORT 属可选项，状态仅列名称见 environment-static.json。PRAXIS_CHROMIUM_EXECUTABLE_PATH 不被当前入口读取，不列为必需变量。

## 交付边界

只本地提交，未合 main / 推送，未新增实际外部服务调用；没有真实外写。当前是**主线组合已提交、三项门禁通过、第四项失败停止**，不是“五门禁全绿 / 双尺寸联调完成”。真实 Live、两尺寸独立冒烟、D01/D02 原样 Replay、独立 PostgreSQL 服务入口与真机签收均保持未完成，等待下一步确认。
