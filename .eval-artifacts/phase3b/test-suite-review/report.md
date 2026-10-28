# 3b A 测试集逐项审查：先交清单

Status: **PROPOSED / 待复核，未删改测试**。2026-10-28，Europe/Vienna CET（UTC+1）。当前输入为已暴露开发证据；不是 Clean Baseline 或独立复核结论。

## 本批交付与边界

从最新 main `ba466eb3eff89cc3f934bafc2134a39c4b6d84ed` 开 `codex/chore-phase3b-test-suite-review`。B 已开始 G3；这里只审清单，不实施删测，不修改 B/C 的产品、站点、Prompt/Schema/State 或测试。先前获批的时序修复已经合入 main `54b3dd2b`；六题真实模型重跑另在 `codex/chore-phase3b-g1-six-repeat` @ `f80dacb0db1ed2ab3773522e4daaec8e68876e71`，不混入此分支代码。

**审查入口：** [完整逐文件/逐项清单](review-list.md)、[逐次运行 CSV](runtime-review.csv)、[逐次 JSON](runtime-review.json)、[源码声明 JSON](declaration-review.json)、[5 项具体提案](proposals.json)。每项关联原文件行号、原文输入/调用、精确断言、耗时、归属和判断；128 个文件各有单独审阅意见。脚本只提取语法、原断言和运行身份；不是用统一一句“现有覆盖有用”批量判保留。每个完整理由均包含该项条件及可证伪观察，完整理由重复 0；这也不声称已为每个测试独立重做变异或证明其永不可合并。

## 冻结与当前基线

`f8f8ccec` 是成功采集时的冻结提交；原输入清单保留在 [runtime-input-freeze.json](runtime-input-freeze.json)。之后只补元数据提取：识别 `currentTest` / `probeTest`，不改测试行为。当前 [input-freeze.json](input-freeze.json) 与 [source-sha256.json](source-sha256.json) 冻结 672 个 source/script/package 输入以及采集/审查工具；原始测试与产品相对 main 零差异。

| 套件 | 实测结果 | 墙钟 | 运行前/后 |
| --- | --- | --- | --- |
| 默认 | 1,203 / 1,203 PASS | 28.480 s | clean / clean |
| Chromium（原 4 路并发） | 175 / 175 PASS | 105.995 s | clean / clean |

实际 `package.json` Node argv 原样展开，仅增加 JSON 事件 reporter，未变文件、断言、并发或测试开关；完整 argv、逐项时间和事件见 [runtime-baseline.json](runtime-baseline.json)、`default-runtime.jsonl`、`chromium-runtime.jsonl`。不能把并发测试时长求和当套件墙钟。最终标准五门禁另有独立收据（见末节）。

静态 129 份 `.test.ts` 文件：128 份有声明，另 1 份是被导入 helper；共 1,203 个声明，其中 5 个 suite、8 个仅冻结 probe。实际运行是 **1,378 个 test（1,203 + 175）和 5 个 suite**，[运行映射](runtime-map.json) 逐项绑定，未绑定 0。8 个 PostgreSQL `probeTest` 是 NOT_RUN，不计默认缩减收益。初始估计 1,202 由实测 1,203 更正。

两个采集准备失败原样保留：`collector-setup-failure/` 是 reporter 相对 module path 缺 `./`，在测试启动前失败；`missing-dependency-baseline/` 是本地尚未安装 C 已合入锁文件的新依赖 `entities`，只运行出 699 个结果，不能当完整基线。用现有 lock 执行离线 `npm ci --offline --ignore-scripts` 后重取成功基线；没有产品修复，没有加载个人 npm 配置或 `.env`。不把这些安装/工具故障称为测试检错红灯。

## 逐项初审

1,378 个运行 test 的处理分布：独立合同保留 927；明确保护 307；G3 调用方协调保留 32；B 所属站点测试暂保留 107；拟删/合 4；保留断言仅改测试计时 1。source 卡保留完整 body/断言，便于复核区别“同输入、同路径、同后果”和仅同名/相同终态。

Guard 的负向及必要正常控制、授权/幂等/错误成功、独立 S0 评分与历史 Live 红灯不删。重点逐项保护 F5c 根 Agent 的 2+26 排队纠正、D1 4 页无恢复页、F3-034 显式通用列表、F6 槽3与取消已完成子结果、W12、退出后独立评价及两核时序修复。保护字段可跨分类存在；统计分类不是解除其他项目的保护。

两套真实 Session（LOCAL/CLOUDFLARE_SESSION）走不同生产实现，保留双后端的 dom-ref / owner / 后置条件检查。视口内外 covered-link 曾有不同命中/scroll 缺陷，offset 0 与 1400 都保留。仅看到相同状态 `UNKNOWN`、相同断言或 case 名，不足以判重复。`recording-keys.test.ts` 外层无 assert，但 helper 内实际扫描凭据、检查部分回放和接收器零请求，不能按外层零断言删掉。

两站 107 项留给 B 的 G3 文件归属；32 项调用方涉及私有解析/scope 的跟进需协调。不把它们算作 A 已完成缩减。`native-outlet-continuity.test.ts:130` 的无 Guard mock 仍可读 reserve，只证明作用域文本隔离，**不证明生产允许预约路径**；记录该含义，保持 Guard 禁止路径负例，交 B 判断私有逻辑删除后是否退役，不在 A 擅改。

## 提请复核的最小改动集合

| ID | 提案 | 接替覆盖（基线行号） | 数量变化估计 |
| --- | --- | --- | --- |
| A-D01 | 删除只正则匹配 6 句 Prompt 的测试 | browser-action-decision:121/139；Executor:127/153/206；Chromium page-controls:177 的实际动作/权限 | 默认 −1 |
| A-D02 | 稳定 Google ID 的单一 URL 断言并入同次搜索→Details 正常控制 | google-places-restaurant-search:383，加原 :419 的 URL/GET/runId 断言；:372 仍查 Run 隔离 | 默认 −1 |
| A-D03 | transport 错误脱敏断言并入同路径失败计账控制 | google-places-restaurant-search:463，保留原 :451 的不可见 payload 断言及计账/预算拒绝 | 默认 −1 |
| A-C01 | 退役手工 Snapshot 的静态录制正常控制 | browser-read-replay:100 的真实 Guard/Recorder 动态录制回放，显式补原 :56 的日期/人数/19:00；tablecheck:111 保留静态 guide 解析 | Chromium −1 |
| A-T01 | fakeRoute 的真实 6 秒等待改为测试注入计时 | Guard:50 的全部正负断言留存；真实 Chromium read-network-redirect:52 和 stability:122 不动 | 数量不变 |

逐项输入同一性、差异、权限检查、存活断言、实现前检错和不能替代时撤回条件见 [proposals.json](proposals.json)。例如 A-D02 不是删去 ID 核验，而是在更完整控制中保留该核验；A-C01 若仍有未被更强控制覆盖的静态请求绑定分支，就不得删除。

如均获批并有效实施，预计默认 1,203→1,200，Chromium 175→174；**本批没有实现这些下降**。A-C01 单项基线 0.797 s；A-T01 fake 等待约 6.107 s，可消除其人工等待的大部分，但不是并发套件提速承诺。实现后仍须在相同环境比较默认/Chromium数量和整套墙钟，都下降才达到用户完成标准。不能以挪出默认入口、合并不同失败机制或 B 的未交付改动冒充达到目标。

## 六题重跑交接（结果原样保留）

受测产品 main `eb1518f1`，执行冻结 `a019d8a3`；已推工作分支 `codex/chore-phase3b-g1-six-repeat` @ `f80dacb0`，原报告用 `git show f80dacb0:.eval-artifacts/phase3b/g1-six-repeat/report.md` 读取（该文件在另一分支，当前分支未复制）。18 个计划 trial，共 19 次真实模型调用，17 响应、2 TIMEOUT；Q31-r2 允许的单次传输重试仍超时，未补造第三个有效样本。题目、参考和评分规则未改。

明确追加检查是 11/18 满足：Q07/Q33英文各3/3，Q26两标志3/3，Q31完整句2/3；Q14仍ALLERGY 0/3，Q27仍UNVERIFIED/INVALID_MODEL_OUTPUT 0/3。Q27原响应引用未观察到的旧statement ID，原文本存在也不能把不存在ID接纳；不猜测原因。冻结独立自动评分按19 attempts原样是 0 PASS / 11 FAIL / 8 NOT_EVALUATED，追加检查不替代评分或用户签收。未观察到错误声明的初审仍待独立复核，14 个自动声明计数为null，不能在此改成全批S0=0。

这里只并集导入该分支19条已花模型记账，保留main全部条目；462条账本目前171模型、242GET、11Google、0Live/环境重跑，A本次审查新增全为0。原始模型输出、参考答案或六题产物未复制/重评分。

## 验证与停止

此为清单切片，无产品/测试修复，因此不伪造本批红绿。标准五门禁在提交输入、干净树后执行，收据写入 `verification/summary.json`；原始日志留存。`git diff --check`、672项源输入SHA、逐项映射/提案引用/分类和账本并集检查必须通过。G2额外检查本批 NOT_RUN（没有修改其代码/保存页，当前main的独立4/4证据未冒充新运行）。

工作分支推送供复核，不合入main；复核通过前不删测试，不改B/C所属文件，不调用真实模型、Google、网站或Live，不读/暂存`.env`。下一步只等待清单与六题结果复核。
