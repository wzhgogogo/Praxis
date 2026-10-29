# G3c 评测 fixture 同步：按产品缺陷停止

2026-10-29 CET（UTC+1）。**STOPPED_PRODUCT_EVIDENCE_HANDOFF / draft / not integrated**。
基础 `51b0d3deaae837e4b8063f1a10a159675a6fc9e7`；工作分支 `codex/chore-phase3b-g3c-eval-fixtures`。本分支包含 B 尚未合 main 的代码，不是可合入的绿灯补丁。

用户第 6 条要求：“如果某项失败的原因在 B 的产品代码……停下报告，不在 fixture 里绕过。”合法 Source2 选句暴露了来源事实与展示引用的交接缺陷，故在完成来源页面改造、显式调查序列和最终六项检查之前停止。13 项没有全部转绿。

## 未修红灯与诊断过程

1. `c74845c5` 提交未修输入清单和计划，四个执行文件与 `51b0d3de` 原字节相同。完整 `npm test`：**1217/1230，13 失败，29.147 秒**；12 叶断言与一个父测试，与 B 交接一致。[原始完整日志](red-npm-test.log.gz)、[输入 SHA](red-inputs-sha256.json)。不是启动/类型错误。
2. 仅在四个获准文件添加 Source2 purpose 分流，Agent 动作序列、来源页面、所有原断言及预算均未修改。三个文件的探索诊断：**58/77，19 失败**（18 叶加一个父测试）。原 WP-A 故意超时控制通过；原另外 11 个叶失败仍在，新增 7 个 Tabelog 独立证据评价失败。[完整日志](purpose-only.log.gz)、[逐项差异](failure-summary.json)。这是不完整接线的探索结果，不是正式门禁。
3. 通过既有 `PRAXIS_WRITE_NATIVE_STAGE2_ARTIFACTS` 开关保存实际 composition 执行及独立 evaluation；没有手填 State、证据或评价。`TABELOG_DELIVERS` 能展示三家，但三家同样漏引查位所得原文事实。`TABLECHECK_RECOVERS` 仍未知；该旧 fixture 的 HTML 与 text/事实页材料未完成同步，不能将它另行归因为产品缺陷。
4. 探索选择器原先也匹配裸 `omakase`/`menu`，交付前收窄为明确课程/套餐文字，避免把带该词的店名或菜单导航误选成套餐。该收窄没有改变阻断用例中完整 `Omakase course` 的选择。最终冻结后的单用例复现和检查收据另存；不把前面的脏树探索说成净树正式验收。

## 确认的首个阻断

实际路径：`SEARCH_RESTAURANTS → INVESTIGATE_CANDIDATE_FACTS → CHECK_AVAILABILITY → PRESENT_RESULTS`。已有脚本本来就走这个路径，本批没有增加、重排或省略 Agent 动作。

以 `tabelog:tokyo/A1304/A130401/100` 为例：

- 当前同店来源文档包含完整语句 `Omakase course`。Source2 返回仅 `firstStatementId`、`lastStatementId`、`role: COURSE`、空 `priceStatementId`，代码接纳为 `COURSE_DESCRIPTION`，来源 URL 保持该店详情页。没有模型金额、身份、URL 或库存输出。
- 先前事实读取已有同店原文和引用判断；查位期间又通过 G3c 新路径取得同店原文事实 `evidence:restaurant:tabelog-hard-criteria:29e52317e9b0164eed3ea061`。它确实位于 `readEvidence` 与本次 `availabilityChecks[candidateId].evidenceIds` 中。
- 最终 `presentedResults.evidenceIds` 没有这个 ID；101、102 两家同样缺失。独立评价的 `REQUIRED_EVIDENCE=NOT_SATISFIED`，原有 `taskProducedQualifiedResult === YES` 断言失败。实际原始时段响应仍支持该日期、两人和 19:00；不能把引用失败混称为空位失败。
- 定位到产品 `src/domains/restaurant/read-assessment.ts`：`restaurantCurrentFactEvidence` 第 62–65 行只在 `evidence.observedAt > check.checkedAt` 时保留后来的查位事实。该受控时钟中两者同为 `2026-08-19T07:20:00.000Z`；事件顺序在后，但时间相等。第 198–203 行随后将不在 current facts 内的查位事实引用滤掉。
- Tabelog G3c 第 591–597 行产生并合并原文事实；独立评价 `diagnostic-evaluator.ts` 第 706–727 行只豁免**后续事实调查**明确替代的旧查位事实。本例调查在查位之前，不满足豁免。评价器与应然断言没有修改。

因此确认的是**等时戳的后续查位原文事实被产品 current-facts/展示引用过滤**。它不依赖新增页面内容、私有 class 或伪造原文，也不是 Source2 Schema 拒绝。当前证据不能声称现实 Live 必然发生同样时间戳；这是已有固定时钟与合法模型输出下的真实产品组合缺陷。不能用跳过 Tabelog 合法选句、改变冻结时钟、删除 check 引用或降低评价要求来绿灯。

最小交接：B 在其产品归属范围修复同次/等时戳证据顺序与展示引用，保留后续事实调查确实替代旧事实的负向约束；然后 A 才继续本批剩余页面和脚本同步。此处不实现产品修复、不变更合同。

## 四个文件的当前草稿与脚本序列

| 文件/模型 | 原 Agent 序列 | 当前 Agent 序列 | 当前改动与未完成部分 |
|---|---|---|---|
| native-discovery-composition / H001NativeModel | 按已有合法动作 Context 选择；阻断例为 SEARCH→INVESTIGATE→CHECK→PRESENT | 相同 | Source2 分流到同页完整语句选择；仍累计真实 fixture 模型请求总数，不消费根 Agent 动作。所有旧断言保留。 |
| current-development-offline / FixedCurrentCaseModel | PLANS、EXPLICIT_TWO_OMAKASE_PLAN 中原有动作数组 | 相同 | Source2 不 shift remainingActions；H001 与显式两家正例的必要事实调查尚未改写，不声称已完成。 |
| current-development-offline / TwoTurnStrengthUpgradeModel | 原有两轮正常/缺证动作数组 | 相同 | Source2 不 shift actions；原有条件强度、重置和缺证控制不变。 |
| fixed-source-case-execution / 正常截止控制 | SEARCH→CHECK→PRESENT | 相同 | Source2 在 shift actions 前分流；事实判断和显式调查的进一步同步未执行。迟到、取消、预算反例原字节不变。 |
| current-development-fixed-sources | 原来源工厂页面/导航 | 相同 | 只新增四文件复用的 fixture 模型响应 helper；不改工厂页面、身份 guide、计数或来源行为。 |

Source2 helper 是本地构造的 scripted transport，不是网站回放、语义模型质量或事实 oracle。它只选择请求中已有的完整 `SOURCE_TEXT` 语句；有价格时只返回该原文行 ID，从不返回数字金额。Gold、独立参考和业务断言都没有改。

### 来源材料边界

本批停止前**没有修改任何来源页面**，因此没有为正例在身份 guide 上补证、没有复制其他分店或菜单的事实。已只读核对两个已保存页面的公开呈现方式，作为之后 fixture 同步的参考，不能用作本次合成店事实或实时见证：

| 已保存材料 | 文件 SHA-256 | 本次只读观察 |
|---|---|---|
| `src/harness/browser/fixtures/dom-change/tablecheck-detail-nakamata.html.gz` | 压缩 `b4da6b830ee448fc5130034c4834d4e1ad8d66309448d160902c3df47d845f30`；解压 `6b7e758fb3135f057a3aec19cf844971b24fc8cb65a7b34cd72decf70dc7eba0` | 公开 H1、Address/Phone 和课程文字；采集日期 2026-10-21 UTC，来源与定位见旁 provenance。 |
| `src/harness/browser/fixtures/restaurant-prices/tablecheck-recorded-menu.html` | `2a625d0641b5b2824170a4a263c9ac68aac3017057b14afac84cdefd327f1f68` | 公开日文课程/价格片段；2026-10-12 UTC 的 Alaska 摘录，**不是完整身份页**，不能靠它证明新增 H1/地址。 |

## 验证状态和独立评价

本批模式是本地构造来源 + fixture 模型 + 真实生产组合，未运行 Replay、真实模型或 Live。四层结论：

- 端到端：原 13 失败未关闭；阻断诊断实际展示三家，但独立评价不接受合格交付；不声明本批通过或能力改进。
- 环节：合法 Source2 选句/接纳及原始请求时段可追溯；首个已确认偏离为产品当前事实到展示引用交接。其他未同步正例保留 UNKNOWN/失败，不更名为 PASS。
- 严重程度：引用完整性失败已证实；合成来源没有完整独立真实网络证据，S0 保持评价原来的 NOT_EVALUATED，**不写 S0=0**。
- 归因：等时戳过滤与实际缺失 ID 对应，产品代码未改；未通过改变时钟或只选空数组作反事实绕过。

最终五门禁/严格 G2 全绿的前提（13 项转绿）尚未达到。最终冻结后的 typecheck/arch/build 与单用例净树诊断详见 `stop-checks.json`；完整默认套件、Chromium、严格 G2 的最终验收均为 **NOT_RUN（按第 6 条停止）**。原始默认完整红灯和探索诊断如上保留，不能用局部检查替代。

生产文件、来源 pack、Prompt/Schema/State、Gold、评分器、独立期望、预算账本、截止规则、来源页面和所有旧 assert 调用相对 `51b0d3de` 零差异；见 `preservation.json`。没有新增/删除测试或改写迟到/取消/预算反例。新真实模型、Google、网站、评测 GET、Live 均 **0**；没有读取、复制或暂存 `.env` 或问答参考答案。

仅推工作分支供复核及通知 B，不合 main。完整来源 fixture 同步及最终验收仍未完成；需先由 B/复核者处理上述产品证据交接阻断。
