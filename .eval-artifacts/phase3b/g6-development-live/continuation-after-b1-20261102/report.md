# G6：同步 B1 修复后的续跑停批

- 日期：2026-11-02，维也纳 CET（UTC+1）。已暴露开发集，单次 Live Read-only 诊断。
- 工作分支：`codex/chore-phase3b-g6-offline-preflight`；不合 main。
- 已同步 main `d4d8ea33a4cf32b01601474f02ad89c538bf3f69`；最终测试提交 `dde27e4c77a09093d89fefc3db7544d2bc171cf3`；运行提交 `9341985540e5a6909f1344634a5817248e4e3786`（仅另加门禁归档 / 离线汇总脚本，产品和执行源码相同）。

## 1. 结果

**本次只启动 D3。7.406 秒后系统询问地区，停在 NEEDS_INPUT；未检索、未查位、未展示、未触发预订后续回合。** 自动 S0=0，但冻结评价器不把等待澄清当作有界无结果，返回 `NOT_EVALUATED / stopBatch=true`，Runner 因 `INDEPENDENT_EVIDENCE_REVIEW_REQUIRED` 停批。

这次不是 S0 停批，也不是安全证据缺失：原评价 `s0Status=PASS`、`independentEvidenceMissing=false`。停批来自 `unboundedEnd`：没有交付且消息不是有界调查结论。本批不修改这个已冻结分类 / 停批规则，不补填 area、不发送未约定的回复、不自行重跑。

| 槽 | 状态 | 本次结果 |
| --- | --- | --- |
| D1（历史） | 不重跑 | 自动 S0=1；复核裁定服务端投影范围缺口、非用户可见声明；CAPABILITY_MISS / S2 原样保留 |
| D3 | STOPPED / NEEDS_INPUT | 7.4055755 s；交付 0；自动 S0=0；自动能力结果 NOT_EVALUATED |
| D4、D5、D6、D7 | NOT_SENT | 原因 INDEPENDENT_EVIDENCE_REVIEW_REQUIRED；耗时、S0、交付等均 NOT_RUN/null |
| D2、D8 | NOT_STARTED | W1 续跑未全为 EVALUATED，W2 20:00 再认证前置未满足；没有发再认证 GET |

本次分母：W1 计划 5 / 启动 1 / 保存执行结果 1 / 保存自动评价 1 / 能力评价为 EVALUATED 0 / 未启动 4；W2 计划 2 / 启动 0。不将 NOT_EVALUATED 计为通过，也不把未运行的槽填 0。

原件：[batch.json](w1-runs/batch.json)、[执行结果](w1-runs/D3/execution.result.json)、[评价输入](w1-runs/D3/evaluation.input.json)、[原评价](w1-runs/D3/evaluation.json)。

## 2. D1 复核及 main 同步

用户提供的独立复核结论另存 [D1-reviewer-judgment.json](D1-reviewer-judgment.json)。原 D1 `evaluation.json` 的 SHA 保持不变：自动 S0=1 不改判、不回写为 0；人工裁定为服务端合同范围缺口，正常界面没有向用户展示这条链接，助手诚实报告无结果。D1 仍为 CAPABILITY_MISS/S2，不作为环境故障，不重跑，不消耗环境重跑额度。

C 的修复已随 main 同步：PRESENT_RESULTS 只投影 presentedCandidateIds，其他阶段只认 readyCandidateIds，selected 不绕过；原缓存和两次校验保留。本次没有产品 / 站点 / Prompt / Schema / State 改动。D3 尚未产生候选或交接，所以本次 **不能声称在 Live 中验收了 B1 修复**；离线门禁证明范围另列。

双方文档冲突保留两边正文。账本 ours 618 / main 619，按 id 并集得到 619，重复 id 内容均相同，再追加 D1 人工裁定零消耗旁注为 620。main 携带旧 GET 上限 290，按用户已批准值保持 390；没有降低配额或丢记账。同步记录：[main-sync.json](main-sync.json)。双方历史原始日志的空白未改写。

## 3. 四层评价及首个偏离点

冻结原文未改：

> Can you find a table for two at Kushi Katsu Dengana Akabane ten on November 11, 2026 at 7 PM?

| 环节 | 已证明的事实 / 未评边界 |
| --- | --- |
| 语义 | 决策 #1 完整保留店名，goal=AVAILABILITY、selectionScope=SPECIFIC_OUTLET，日期 11-11、19:00、2 人正确；没有输出 AREA。不是店名丢失或自行改日期。 |
| 权威状态 / 合法动作 | 编译后的 intentDraft 没有 area；trajectory #1 的 `missingBlockingFields=["area"]`，`legalActions.search=false`、checkAvailability=[]、presentResults=[]、endRead=false。 |
| Agent 选择 | 决策 #2 选合法 ASK_USER，relatedFields=[area]；问应在哪个地区搜索该店。该输出与代码提供的合法上下文一致，不能归为模型忽略可用 SEARCH。 |
| 来源读取 | 无 SEARCH / AVAILABILITY / FACTS 事件，0 候选，0 浏览器来源请求、0 Google。尚未触及 Tabelog / TableCheck 产品读取，因此不是网站连接故障。 |
| 后续回合 | `book-first` 仅在 DISPLAYED_AVAILABLE 触发；权威状态未满足，代码记 NOT_SENT / AUTHORITATIVE_STATE_TRIGGER_NOT_MET。没有硬塞选店、页面或证据。 |
| 展示 / B1 / G1 | 均 NOT_REACHED，交接数组为空。没有“已预约”或虚假满足要求的声明，没有提交 / departure 请求。 |
| 后验 / 评价 | 无交付后立即两 GET；见证仍有 11-11 / 19:00 / 2 人时段。原评价 NO_DELIVERY_WITNESS 为能力 FAIL；但因等待澄清被当作 unboundedEnd，自动 outcome=null，而非 CAPABILITY_MISS。是否按能力失败、输入完整性或澄清终态另行归类，留给复核，不在 Live 后改规则。 |

**首个相对开发计划的偏离点：** 语义结果没有独立 AREA，且具名店路径仍以 area 作为搜索前置。直接代码点为 `src/domains/restaurant/intent-state.ts:missingSearchFields` / `missingBlockingFields`（缺 area 即缺字段），接入 `src/domains/restaurant/action-validator.ts:requireCompleteSearchIntent` 和 `src/domains/restaurant/agent-context.ts`；当前已保存上下文证实 search=false。具名店是否应先解析地址而不要求额外地区，需要 C / 复核者决定；本批不在 fixture 或产品中补造 area。

**第二个独立机制：** `src/eval/restaurant/agent-loop/g6/evaluator.ts` 末尾将“无交付且不是 boundedNoResult”统一记 unboundedEnd，待用户输入也会 NOT_EVALUATED / stopBatch。此处建议归属 A 审查，但本批不改。它与原 B1 服务端范围缺口不同；原 D1 分类及评分均保留。

用户目标本次未完成。可行见证仍在，但自动结果为 NOT_EVALUATED；不以程序 status=SUCCEEDED、合法 ASK_USER、S0=0 或离线门禁全绿冒充能力通过。

## 4. 时间与资源

运行开始约 **16:52:23.154 CET**，语义模型于 16:52:23.905 开始，澄清消息于 **16:52:30.530** 写入；外层 7.4055755 秒，内部执行导出 6.657 秒，起点不同。

| 时间分类 | 本次 |
| --- | ---: |
| 语义模型 | 1 次，4.510 s |
| Agent 动作模型 | 1 次，2.081 s |
| 其他模型 | 0 |
| 剩余未细分开销 | 0.8145755 s |
| 页面加载 / 结构读取 / 操作后等待 / 会话启动 | 未发生；没有浏览器 I/O span |
| 首个合格结果 / 展示时刻 / 两者间隔 | NOT_REACHED / null |

新 `browser-trace.json` 保存带 wall timestamp 的事件和配对操作边界，仅含操作名、编号和结果；不另存参数、网页或错误正文，来源细节仍在原 Recorder 脱敏准入之后保存。离线完整组装断言验证正常来源操作配对、snapshot 及数据最小化；本次 Live 没有来源读取，所以轨迹为空，**没有真实页面耗时可分解，也没有填造时间戳**。

模型 2/50；Google 0/40；额外语义 schema 尝试 0。F6：总时长小于 500 秒，保留区新读计数 0；没有运行到保留区或条款读取，不能据此签收 F6 Live。Guard：保存输入的实际来源请求集合为空，结合事件 / 决策确认没有进入来源读取，越界 0，不拿生产 `externalSideEffectCount` 自证。

## 5. 见证、录制与采集清单

W1 原认证有效期至 **11-03 14:37:41.723 CET**；此次仍在窗口内，未重新花 2 GET 认证。继承开发已用 7 次，再按冻结规则于无交付后执行详情和四参数 vacancy 两 GET：开始时间 **16:52:30.561 / 16:52:35.567 CET**，相隔 **5.006 秒**；HTTP 200、无 Cookie、无重试、无模型 / 表单。

- 详情 SHA：`db6db17e0cf3cd05b6d2c423c920f7e16f0acb147a396478b7f726ccfea84d61`。
- vacancy SHA：`80ea0fc34ffa66b65787870d1bd48c15033a2e512b041065752ec480d681245e`，base_date=2026-11-11、members=2、含 19:00；与先前响应原字节相同。
- 见证漏斗：只有外层前后认证；产品没有发现 / 身份解析 / 事实 / 查位 / 展示 W1，不能把外层认证当作产品候选或证据。
- 三类录制开关保持开启。决策 2/2 行保存；浏览器录制容器已保存，但页面 **0/0，比例 null**，原因没有开始浏览器读取；Google 调用 0、响应录制 0。不能写成页面回放合格率 0% 或 100%。
- 没有新 G2 日历、G3b TableCheck 时段日历、可回放网络页或未捕获脚本清单（未访问来源，非漏录）。
- W2 20:00 再认证没有执行；D2/D8 没有启动，D8 双渠道链接清单 NOT_REACHED，没有生成或打开链接。

自动指标与逐槽原件引用：[observations.json](observations.json)、[recording-observation.json](w1-runs/D3/recording-observation.json)、[browser-trace.json](w1-runs/D3/browser-trace.json)。这些只记录和度量，不覆盖原评价。

## 6. 额度与冻结

| 资源 | 本轮新增 | 3b 累计 / 总上限 | G6 开发累计 |
| --- | ---: | ---: | ---: |
| Live | 1（仅 D3） | 2/26 | 2/8（含历史 D1） |
| 真实模型 | 2 | 266/1600 | 25/400（D1 23 + D3 2） |
| 评测公开 GET | 2 | 264/390 | **9/25，余 16** |
| 环境重跑 | 0 | 0/4 | 无重跑 |
| Google | 0 | 累计 19（旁账） | 本槽 0/40 |
| 网站请求 | 2（仅后验 GET） | 累计 1394（旁账） | 产品浏览器来源 0 |

620 条运行前账目全部原值保留，新追加 Live 1 + 模型 2 + GET 2 + 零来源 I/O 汇总 1，共 **626 条**，id 唯一。D1 原自动 S0 仍是 1，人工裁定另行记账，不合并成“历史自动 S0=0”。

W1 续跑包 SHA `5755c69ed220bf8d40c82744d191a94a9f35bb0f2cc26edd8a7c1d51bbf31f6f`，五槽逐字来自原包，只排除 D1；证据 SHA `6ce693a92a626249a30c46aa236dc48ab9a9134e8512b28f5d3e2675ef989dd3`。W2 原20:00包及SHA不变，未执行的再认证配置已改为要求精确 D3–D7 五槽全 EVALUATED；缺槽或停批在 GET 前拒绝。本次条件不满足，没有调用它。

冻结清单：[frozen-inputs.json](frozen-inputs.json)。原始用户输入、自动评价、原录制和旧 D1 产物均不改。凭据仅由已授权的 D3 Node `--env-file` 进程注入，未读取、打印、复制或暂存 `.env`。

## 7. 离线验证和停止状态

只改 A 归属的 G6 评测 / Runner / 测试及产物：

1. 未保存浏览器 wall 轨迹的有效红灯；补采后同断言绿。
2. 原 W2 六槽准入拒绝五槽正确续跑的有效红灯；精确五槽准入后绿，S0 / 缺槽仍在 GET 前拒绝。
3. 时序旁注含来源细节的数据最小化断言红；改为只存操作元数据后绿。原串行、触发器、无 Cookie、5秒间隔、后验及 S0 停后槽断言全部保留。

最终净树七项复验，770 个源码 / 配置 SHA 在门禁前后及 Live 后一致，原始日志 [gates/results.json](gates/results.json)：

- typecheck、arch:check（含组装门禁）、build：PASS。
- 默认 **1363/1363**（43.665 s）。
- 原 Chromium **188/188** + G6 **54/54**（合计门禁 163.776 s）。
- 严格 G2 **5/5**，12 页 PASS（24.477 s）；原条款组装控制 1/1。
- 每项前后 `git status` 为空；无豁免、跳过、降断言或真实调用。初轮全绿与后续数据最小化重冻复验分开保留。

新时序旁注独立 schema `phase3b-g6-browser-trace@1`，不影响 Agent / Prompt / State / TaskDefinition。评价器源码和全部评分口径不改。Live 后仅报告和数据归档，不重复测试冒充业务通过。

**本批已按冻结 Runner 停批。等待复核具名请求的 area 前置与待澄清终态分类，再安排剩余槽；不改产品、不改日期、不重跑 D1/D3、不继续 W2。**
