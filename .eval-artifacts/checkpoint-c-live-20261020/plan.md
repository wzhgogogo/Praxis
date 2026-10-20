# 检查点 C：离线运行准备

- Evidence status: current executable preparation；已暴露开发集，非 Clean Baseline。Live 未授权、未运行。
- Base: origin/codex/integration-checkpoint-c `3998076`（开始前 fetch）；分支 `codex/chore-checkpoint-c-prep`。
- 切片承诺：准备可审查的 18 次整单编排、认证及四层报告；以一次 0 网络／0 真实模型的完整 Runner 演练和五门禁验收，随后只推送本分支并停止。
- 不修改生产代码、集成分支、批准变体、Gold 或留出集。已有用户工作区不动。
- Evaluator 复用 @30／rubric @26，既有校准结论复用集成报告。本轮不修改评价器。

## 顺序、预算与停批

唯一机器计划 `plan.json`。每轮六例交错，第三轮继续轮换；每例三次，不相邻。一次只运行一个 Runner。

| 序号 | 用例 | 角色／重复 |
| --- | --- | --- |
| 1 | KF-H001 | TARGET 1 |
| 2 | KF-H002 | BUDGET 1 |
| 3 | KF-H005 | TARGET 1 |
| 4 | KF-H003 | BUDGET 1 |
| 5 | 神乐坂 | TARGET 1 |
| 6 | 吉祥寺 | TARGET 1 |
| 7 | KF-H005 | TARGET 2 |
| 8 | KF-H003 | BUDGET 2 |
| 9 | 神乐坂 | TARGET 2 |
| 10 | 吉祥寺 | TARGET 2 |
| 11 | KF-H001 | TARGET 2 |
| 12 | KF-H002 | BUDGET 2 |
| 13 | 神乐坂 | TARGET 3 |
| 14 | 吉祥寺 | TARGET 3 |
| 15 | KF-H001 | TARGET 3 |
| 16 | KF-H002 | BUDGET 3 |
| 17 | KF-H005 | TARGET 3 |
| 18 | KF-H003 | BUDGET 3 |

每次 ≤500 秒、≤50 模型、≤40 Google 请求；Runner 预留最多 38 Google 请求，网络连通 GET 和来源数据预检各占 1（总上限 40）。原 Runner 的其他更紧上限照用。540/180 秒等历史额度不沿用。外层计时从进程开始算，500 秒看门狗 SIGTERM，独立记录中断。

上一尝试结束到下一尝试开始至少 5 分钟。403/503/429 或明确繁忙页记录后中断当前尝试，暂停至少 15 分钟，只允许一次重试；第二次失败停批。只允许 ENV_FAILURE / ORCHESTRATION_INTERRUPTED 重跑；每例跨三次重复累计最多一次，整批 ≤10，六例实际最多六次。S0 声明或越界立即停整批；S0 未评价不能算零，除上述可重跑环境／外层中断外停批等独立复核。正常产品失败无自动重跑。

Live 前独立复核累计预算账本（所有检查点 Live ≤100、模型含回放 ≤4000、环境重跑 ≤10）。脚本要求账本已提交并冻结，按剩余环境重跑额度（最多六例各一次）为 18+剩余额度 次、每次 50 模型保留额度，不从历史摘要猜本期剩余额度。认证／运行后复查 0 模型，单列来源 GET 数及耗时，不冒充产品运行速度。

## 完整 Runner 与冻结

`prepare.mjs` 机械移植完整 `src/eval/restaurant/agent-loop/runners/run-hybrid-live-read.ts`，保留解释、Compiler、Reducer、Grounding、Validator、Router、组合与持久化／诊断流程。修改清单及两个 Runner SHA 在 `runner-relocation.json`。新代码仅为 eval 外层，生产文件无变化。

外层沿用 B 的网络预检目标 DEEPSEEK / GOOGLE / TABELOG；TableCheck 只经生产 `runSourceDataPreflight` 的真实来源非空数据预检。离线时仅用该预检既有依赖注入点给脚本化来源响应；正式 Live 不跳过来源预检。两种模式输出目录隔离。

批准变体 SHA：`910ba0fdf755392ab1d2a1b0c2da5f9fa8d66a32217c109e8eb5f3b3ee24e8b6`。严格加载器不接受 role / derived_from 元数据；`runner-input.yaml` 是仅删除这两个顶层元数据的机械投影。独立断言逐对象深比较其余字段（含正文、Gold、日期、所有条件和验收）；原文件不改。另在 eval 边界为已批准的 development-variant@3 接纳相同的旧父数据 SHA 校验；原生产加载器只识别 @1，不变更它。

独立 reviewed-reads 直接复用 B 已冻结文件（SHA `86c2203cba578ec604d5b87745325ad0b4e4d2b65ea08e7d53e8cb746d275f62`），不从生产 Guard 导出 oracle。外层按生产 post-body-audit 的独立规则保存请求体字段类型／SHA；不保存 Cookie、Secret 或请求体值。

先提交代码／输入／编排，然后 `freeze.mjs` 记录 Git SHA 和每个文件的 SHA-256。每次尝试前重核；运行中不改文件。冻结包不包含新增的结果文件，避免自引用；结果引用冻结包 SHA。见证完成后须提交见证原始材料、独立审核及认证 registry，再生成新的 Live 冻结包，用户批准对应 SHA 后才允许执行。历史演练和失败产物不可覆盖。

## 见证认证：只准备，不执行

`witness-plan.json` 从原登记表保留六例全部见证店（含 H003），只绑定批准的新日期／人数／时间；历史库存不继承为当前认证。`certify-witnesses.mjs` 的 capture 需要用户批准文件和冻结包、预计 Live 时间（未来 24 小时内），才 GET 公开门店页／登记 party 页与严格四参数库存接口；不打开预订表单、不点击库存链接、不调用模型。

capture 保存独立 JSON-LD 身份／坐标、登记 HARD quote、响应 SHA 和原始库存。finalize 离线核对原始库存字节 SHA、日期／人数及匹配时段链接，不打开链接。独立复核者要给每个原始 HARD（尤其负向 HARD）逐项认证；缺关键词不是排除条件成立的证明。SOFT 和 UNSPECIFIED 保留原强度，不升级为资格门槛。必须至少有一家已认证且库存匹配的登记店；完整登记集合保留，不随系统候选缩水。

认证时钟按实际观察开始计，每次 Live 前检查认证未过期且足以覆盖该次运行；超过 24 小时需重新批准认证。11 月 3 日为假日；H001／吉祥寺任一认证失败时停下，由复核者按 variants.yaml 提议将该例移到 11 月 10 日，用户再批准后生成新输入 SHA／新冻结包，原变体和历史结果不能原地覆盖。本任务不做日期变更。

认证捕获遇 403/503/429／繁忙页立即退出并留下记录。认证恢复必须有新的用户授权，至少等待 15 分钟，一次重试仍失败就停；不会在该准备任务执行。

## 评价、报告与验收边界

每次先保存原始 result，再调用 @30／rubric @26 产独立 sidecar，再生成 run-report。必须保存 QUALIFIED_DELIVERY 判定、逐店逐条件 MET／NOT_MET／NOT_CHECKED（满足／不满足／未核对）、与展示一致性、S0_DECLARATION／S0_BOUNDARY、耗时、真实／脚本模型调用数、Google 计数、交付店数。原始中断保留无 result 状态，不补造用户结果。

运行后：零交付立即对全部登记见证做四参数 GET（H003 按窗口起点请求、完整解析窗口内 slot）；交付店做独立四参数库存复查。TableCheck 交付缺独立运行后事实时显式 NOT_EVALUATED 并停下复核，不把原始运行 trace 当作运行后复查；当前脚本不擅自增加预订表单读取权限。

汇总按四层输出：端到端结果；逐环节；严重程度；归因（HYPOTHESIS，不以合并 Live 宣称因果）。退出条件 1 对四 TARGET 各 3 次至少 2 次合格，明确有效分母及排除样本；3 全阶段累计安全另需历史材料且所有新尝试 S0 声明／越界可评且零；4 每次交付所有条件有状态且展示一致；5 交付运行中位数／最长耗时仅指标，不作为退出门槛。留出集退出条件 2 本任务不跑。

逐包指标分开列：P2-1 首批见证与 native funnel；P2-2 CHECK_AVAILABILITY 选店的 DIRECT_SOURCE_PAGE 数、原始决策 context 与耗时分解；P2-3 逐店价格状态、依据及展示一致性、交付数量。缺失记录不能算零次成功，需明确 NOT_EVALUATED。退出条件 3 同时分开报告本批 S0 与全阶段历史 S0：账本未附已冻结并独立复核的 priorStageSafety 及 refs（path/SHA）时，全阶段条件保持 NOT_EVALUATED，不能用本批零错误代替。P2-1 的 Live 单独贡献不可从 C 推断，沿用探测／离线证据。

离线演练使用批准 H001 投影和脚本化语义／选路／空来源；替换边界是模型、Google、浏览器和两类预检传输，主调用链保留。`offline-deny.mjs` 在所有 imports 前禁止 fetch／http／https／net／tls，意外网络尝试留文件且判失败。它证明外层 → 完整 Runner → @30 评价 → 四层报告接线，不证明实时库存、模型质量、合格交付或当前网站能力。Mock、Replay、Live Read-only、Controlled Live-write 分开报告；本轮仅 Scripted Offline，后三者均未运行。

## 入口（本次仅运行控制检查、冻结及离线演练）

```bash
node --import tsx .eval-artifacts/checkpoint-c-live-20261020/prepare.mjs
node --import tsx --test .eval-artifacts/checkpoint-c-live-20261020/controls.test.ts
# 提交所有编排和输入后：
node .eval-artifacts/checkpoint-c-live-20261020/freeze.mjs .eval-artifacts/checkpoint-c-live-20261020/offline-freeze-handoff.json
node --import tsx .eval-artifacts/checkpoint-c-live-20261020/outer.ts --mode OFFLINE_REHEARSAL --freeze .eval-artifacts/checkpoint-c-live-20261020/offline-freeze-handoff.json --output .eval-artifacts/checkpoint-c-live-20261020/rehearsal-handoff
# 以下仅供未来授权后使用；本任务不运行：
node .eval-artifacts/checkpoint-c-live-20261020/certify-witnesses.mjs --action capture --freeze FREEZE --approval USER_APPROVAL --output BATCH_CERTIFICATION_DIRECTORY
node .eval-artifacts/checkpoint-c-live-20261020/certify-witnesses.mjs --action finalize --capture CAPTURE_JSON --review INDEPENDENT_HARD_REVIEW_JSON --output BATCH_CERTIFIED_REGISTRY
node --import tsx .eval-artifacts/checkpoint-c-live-20261020/outer.ts --mode LIVE_READ_ONLY --freeze LIVE_FREEZE --output NEW_BATCH_DIRECTORY --approval USER_LIVE_APPROVAL --registry COMMITTED_REGISTRY --ledger COMMITTED_GLOBAL_LEDGER
```

授权文件字段见相应脚本的严格 action／SHA／时间检查；USER_APPROVAL action 为 CERTIFY_CHECKPOINT_C_WITNESSES，USER_LIVE_APPROVAL action 为 CHECKPOINT_C_LIVE_18。两者都须 approvedBy=USER，绑定 freezeSha256／有效期；认证另含 witnessPlanSha256／plannedLiveAt，Live 另含 registrySha256。审核文件含 captureSha256、reviewedBy=INDEPENDENT_REVIEWER、witnesses[].caseId/rst_id/hardCriteria[]（value/polarity/status/evidenceRefs）。不能以准备脚本本身代替真实授权。

五门禁按 Test Skill：typecheck、arch:check、npm test、build、本地 Chromium Fixture。外层另行 TypeScript 检查（含 allowJs 的 JS 边界）与控制检查；外层控制覆盖已有真实失败（输入元数据／oracle 格式）、冻结拒改、S0 停批、唯一重跑额度、间隔、认证有效期、独立 POST 审查；不新建生产通用抽象。

授权文件的 SHA 消费回执在本批目录保存，同一授权不能通过重启或换输出目录重启整批。认证和 Live 授权分开消费。运行后复查传输／原始字节校验失败只留下独立 evidence-gap sidecar 和未评价状态，保留原始 result，停批复核，不补造见证或自动换类型。
