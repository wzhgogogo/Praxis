# 第三阶段 3a′ 批次 2：对话 A

- 状态：**draft / not integrated，停止点 2 待复核**。已暴露开发与冻结回归证据，不是 Clean Baseline。
- 报告时间：2026-10-24 04:20:19 CEST（Europe/Vienna）；原始历史产物保留原时区与字节。
- 分支：`codex/fix-phase3a-prime-f2a`；五门禁受测提交：`442523111bb85297494af30054c3dc18a8ef56c2`。之后只归档证据与同步文档。

## 1. 范围与提交

用户批准 F1b 后，将 `codex/chore-phase3a-prime-f1/f42715c2` 快进合入 main。合入后在该精确 main 上顺序重跑五门禁一次，每项后 Git status 为空，再推送并用 `ls-remote` 核验。

**新 main SHA：`f42715c2cb34a18764b664bd175576dfe2eaabe3`**。交付前再次确认远端 main 相同。见 [合入记录](main-integration.json)、[main 门禁](main-gates/gates.json)。F2a 从该 main 开始，未合入 main；不等待或实施 B/F5。

| 提交 | 内容 |
| --- | --- |
| b0d2b900 | 原始 h-12、三份录制及 main 门禁冻结 |
| be08ed57 | 修正比较脚本导入路径，尚未开始评价 |
| ef89c72d | 中断留档、评测器@34、按页录制与最小回归 |
| c3311b61 | Guard/HAR 子进程、完整 h-12 上下文与离线控制冻结 |
| db25bbdb | 第一轮输入与代码摘要冻结 |
| a9bd951b | 第一轮离线产物、校准与门禁编排 |
| 43a04b94 | 隔离行数统计输出，门禁前置纠正 |
| dce958f4 | 修复缺最终快照时的未知语义，子进程继承文件读取检查 |
| 44252311 | 修正后的正式验证冻结；本报告五门禁受测提交 |

受测配置：[576 项摘要](validation-freeze-corrected.json)，SHA-256 `40f9fc00bea0bb163534647bafab403044288e1ff1c6c19a22ba81bbb5d3b3a9`；[1039 项校准摘要](regressions-corrected/calibration-freeze.json)，SHA-256 `0e6625257768e29fcdf6fad1ccf61e06a0bf1ce7f1dce8244d4756440cfaf8de`。运行前提交，运行后摘要核验通过。旧输入、旧评价和第一轮失败记录保留。

## 2. 各项改动与证据

### F2① 中断保存记录

Live CLI 与离线来源共用正式执行函数；SIGTERM/SIGINT、外层 AbortSignal、整单 deadline 先保存已有 Runtime 快照、事件、轨迹、浏览器 trace、决策及录制，再退出。中断原因独立记录，Evaluator 分类 `ORCHESTRATION_INTERRUPTED`、排除能力分母，并按实际执行诊断列已达环节。没有最终状态或最终状态为空时，用户目标仍为未评价。

检错主证据是隔离副本只移除本次拥有的中断处理：同一真实子进程在生产执行诊断已进入 AVAILABILITY 后接收 SIGTERM，未及时刷盘，被 10 秒后备终止和持久化断言检出。见 [红灯断言](validation-corrected/interruption-red/assertion.json)、[进程记录](validation-corrected/interruption-red/process.json)。早期在身份阶段暂停的预检保留于 `red-sigterm.log`，不作为这一验收的主红灯。

正常与中断控制均使用真实 Chromium、生产 Guard、本地 HAR、真实 Interpreter/Compiler/Reducer/Runtime/Agent/Router/来源组装；只替换模型与来源传输，HAR miss 不联网。Node 子进程预载既有文件读取检查，并自行创建登记的临时输入目录。

| 控制 | 结果 | 声明 S0 | 边界 S0 |
| --- | --- | --- | --- |
| 正常完整流程 | QUALIFIED_DELIVERY | ABSENT | ABSENT |
| 查位途中真实 SIGTERM | ORCHESTRATION_INTERRUPTED | ABSENT | ABSENT |
| 500 秒限时处模拟超时 | ORCHESTRATION_INTERRUPTED | ABSENT | ABSENT |
| 外层 AbortSignal | ORCHESTRATION_INTERRUPTED | ABSENT | ABSENT |

三条中断都保存并报告 SEMANTIC、LOCATION、AGENT_DECISION、DISCOVERY、IDENTITY、AVAILABILITY。500 秒测试保留真实配置 `500000ms`，在真实子进程中截获该生产定时器并触发其回调；未实际等待 500 秒，也未把 wall time 冒充 500 秒。四条原始执行与独立评价见 [正式汇总](validation-corrected/summary.json)。

真实成功产物另做受控错误注入：保留来源的 2 人观察，将已展示 offer 改成 9 人并附中断记录，Evaluator 仍报告声明 S0 PRESENT。此为检错控制，不是真实网站错误声明。沿用并补强默认 SIGKILL 回归，缺 result／快照／有效 phase 不补造用户目标结论。SIGKILL 无法保证退出前刷盘；未验证当前网站或真实模型在信号下的行为。

### F2② 评测器@34 / rubric@30

最小合成输入先红后绿：[初始红灯](red-semantics-recording.log)、[绿灯](green-recorder-security.log)。额外 UNSPECIFIED 背景不作为 Gold 冲突或替代条件；HARD/SOFT 额外条件、原条件缺失、强度和 polarity 反例仍拒绝，既有 multiplicity／identity 覆盖保留。其他来源核验规则不变。

目标 h-12 为 `p2c-holdout-06`，原产物 SHA-256 `25fc42526184c848e8805ae482e667ae48078737b28bf216575862f155255e87`。成对评价复用同一原产物、三份原始交付后 GET 与同一审核规则，@33 直接从 main/f42715c2 的源码在隔离目录加载，旧文件不覆盖。

| 独立判断 | @33 → @34 |
| --- | --- |
| AUTHORITATIVE_CONDITIONS | NOT_SATISFIED → SATISFIED；移除额外 “suitable for an office group” 误判 |
| REQUIRED_EVIDENCE、INVESTIGATION_BEHAVIOR、RESOURCES | **逐字段不变** |
| 条件状态、HARD/SOFT 支持、资源、见证、记录问题 | **逐字段不变** |
| 依赖语义保真的派生结论 | FINAL_CLAIM／COMPLETION 与声明 S0 随之更新；DELIVERED_UNQUALIFIED → QUALIFIED_DELIVERY |

“唯一差异”按唯一规则解释，**不是仅一个 JSON 字段改变**。只向旧@33注入这一条 UNSPECIFIED 规则，规范化版本标识后与完整@34输出逐字段相等，证明全部派生变化来自这一条规则；完整差异见 [成对与因果比较](validation-corrected/h-12.comparison.json)。这是对已暴露原产物的新口径补评，不追改历史签收。

[22 例校准](regressions-corrected/calibration/comparison.json)结果 22/22，正常声明 20/20；两份历史中断的声明仍未评价，历史边界证据不足不补零。早期未附交付后上下文的直接比较保留在 `evaluations/`，其过严字段差异断言失败不作为最终成对评价。

### F2④a 按页录制

Recorder schema@4 为每个 snapshot 单独保存资格与原因，只有合格页进入可回放文档/HAR；部分合格标为 PARTIALLY_REPLAYABLE。公共页面上限为 **1,000,000 UTF-8 bytes**。未审核 form action（含未加引号写法）删除，方法与结构保留；只有明确审核的公共 GET action 保留。Token、Cookie、PII、JSON/脚本/CSS、未捕获依赖等规则不放宽，复用现有来源包检测并拒绝挑战页；Runtime/Guard 准入规则不变。见 [Schema 说明](recording-schema.md)。

最小混合控制中，坏 URL、缺动态响应、挑战页不再拖累两个合格页；430KB、743KB 页通过，超过一百万 UTF-8 bytes 的页拒绝；未审核表单删除目的地且不改 POST 为 GET。既有 Secret/JSON-LD/CSS/缺脚本反例保留。红绿见上列日志。

三份第二阶段 c 录制只离线重判。**分母是原始 SNAPSHOT 次数，包含旧版未保存 DOM 的项，不是唯一 URL 数。**

| 运行 | 可回放／全部 | 缺静态依赖 | 原始 DOM 未保留 |
| --- | --- | --- | --- |
| h-01 diagnostic attempt 1 | 0/74（0%） | 31 | 43 |
| h-03 attempt 2 | 0/109（0%） | 100 | 9 |
| h-12 attempt 1 | 0/56（0%） | 52 | 4 |

逐页明细在 [重判目录](validation-corrected/recordings/)。原录制整次不可回放时没有留下所需脚本响应，部分 DOM 也被丢弃；新规则不能恢复这些字节。没有重新访问网站、伪造响应或把未知标成合格。此项不宣称三次运行已能完整回放；F2④b Runner 未开始。

## 3. 五门禁

受测 `44252311`；每项一次，不称三次中位数。所有 fail／skip／cancel／todo 为 0。每项前后 Git status 为空，正式门禁恢复次数 **0**，冻结摘要前后相同。

| 门禁 | 结果 | 用例 | 秒 |
| --- | --- | ---: | ---: |
| typecheck | PASS | — | 0.365380 |
| arch:check | PASS | — | 0.183701 |
| npm test | PASS | 1027/1027 | 20.182264 |
| build | PASS | — | 0.421374 |
| 真实 Chromium fixture | PASS | 141/141 | 84.761184 |

[原始日志与摘要](gates/gates.json)。未出现端口或浏览器资源冲突。首次默认门禁发现缺最终快照的旧 SIGKILL 控制回归（1026/1027），修复并重新冻结后通过；[失败记录](gates-initial-failed/gates.json)保留。

## 4. 额度与保存

本批真实模型、Google、餐厅网站、完整 Live、环境 Live 重跑均 **0**；3a′累计 Live **0/8**、真实模型 **0/400**、环境重跑 **0/2**。Fixture 模型传输与本地 HAR 不计真实调用。Git 推送单列为仓库操作。见 [账本](../budget.json)。

应用、Core、Domain、Adapter、Server 与 web-skills 相对 main 的差异为空；两个站点非测试 TypeScript 仍 3864 行，source-packs.ts 473 行，未移动代码抵扣。F3 的 ≤3591 目标未在本批处理。原主工作区 HEAD 与 9 份既有文件的状态和 SHA 保持，F1/F1b 历史文件不变，见 [保存核对](preservation.json)。交付文件及受测源码一致性见 [交付摘要](delivery-manifest.json)。新增测试使用最小 fixture；只有完整输出对比所需 h-12 和录制重判所需原文件进入评测输入，没有复制整份历史运行到产品测试。

## 5. 偏离与纠正

- 临时目录消失后从已提交 be08ed57 恢复到持久工作树；未提交的测试重建并重新取得红绿，原 main 门禁已在 Git 保留。
- 比较入口和外置门禁默认路径的预检错误均发生在相应正式运行前，见 `preflight-failures.json`。本地缺所指 F1b 复核原文件，依用户本条明确批准执行，未补造复核文字。
- 旧统计脚本意外写到历史统计文件，新内容另存、历史原字节在正式门禁前恢复，见 [前置纠正](gate-preflight-correction.json)。不以此掩盖门禁写入；之后每项 status 均空。
- h-12 的独立规则只有一处变化，派生结论会变化，完整因果差异公开；三次旧录制仍 0% 回放资格，不将规则修复描述成历史数据恢复。
- 初轮默认回归失败已修复；最终证据使用 `validation-corrected/` 与 `regressions-corrected/`，首轮结果仅作原 SHA 的历史证据。

## 6. 停止点 2

对话 A 范围已完成，提交工作分支供复核。请复核中断留档、h-12 唯一规则及其派生变化、三份旧录制缺口。未申请追加模型或 Live 额度；不启动 F5 实现/Live、F2③/④b 或私有留出集，也不等待对话 B。
