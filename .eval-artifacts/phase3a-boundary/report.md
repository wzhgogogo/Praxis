# 推荐与查位边界：停止点 3 修订与收尾

- Evidence status: current semantic baseline / exposed development，非 Clean Baseline；历史 Gold@3、sidecar@1、上一批全部原始结果与分数保留。
- 用户完整复核消息已批准 ADR-0044 revision1.1、Prompt@25、sidecar@2 和 Gold@4。订位措辞无时间仍为 AVAILABILITY，补时间沿用目标；无时间且无订位措辞才为 RECOMMENDATION。
- 指定重跑 **9/9 逻辑轮完成**：目标/引用/CONTEXT_CARRY **9/9**，独立非目标请求值 **9/9**。**原严格 Scorer@4 仍为 0/9 PASS、9/9 FAIL**，所有 Proposal/Patch/Draft 差异另存，不宣称全字段语义通过。
- 五门禁全绿：typecheck、arch、默认 **1075/1075**、build、本机 Chromium **161/161**；每项后净工作树。新模型 **9**，累计 **93/144**，剩 **51**，3a′400 扣 **0**。Google/来源/完整 Live 均 **0**。

## 1. 已批准变更与冻结

无时间规则修正解决原复核文字与向用户说明的冲突。A 无需前置到访时间；B 仍为具体钟点/数字时段、已知或可推断人数的坐下正餐；其余灰区由模型判断，不增加代码关键词判断、人数阈值或店型词表。缺日期/时间不虚构，按 ADR-0026 后续补问，可先找店。SR02-T01 标 A，SR02-T02 标 CONTEXT_CARRY。

Gold@4 唯一标签变化是 SR03-T02 `target.goal` 从 RECOMMENDATION 改 AVAILABILITY；query Sushi Dai、其他字段、15 条原话与冻结东京参考时间全部不变。Gold@3 fixtures.ts SHA256 `fa4a8e52a82806af6d507a06f4ba16426e6c28376936363c777c4e981cf3ca72` 原字节保留；sidecar@1 另存冻结版本。三项非目标修复只列 [3b前置清单](review-correction/3b-prerequisites.md)，本批未处理。

真实执行源提交 **aa64c0b32109277c2e841a8a0577af8fd3646af3**；[611项当前冻结](review-correction/freeze.json) SHA256 `37f212cc5d2ce47326cecc0724664c2ad58507c43e6ccc9424974527dd2da13f`。源码、输入、Runner、独立核验脚本与凭据窄授权在请求前提交。较早 de8b4f08 冻结及沙箱失败均保留：一处旧 State20/TaskDefinition18 测试断言同步到已整合主线22/20，其余27条失败为沙箱本机监听/Chromium权限；未改变产品版本或业务合同。新冻结之后五门禁通过，再执行真实请求。主线7e2425b7先整合，主线State22/TaskDefinition20与source-packs字节保持；双方历史记录及3a′累计保留，见 [整合核对](review-correction/merge-audit.json)。

## 2. 指定重跑及差异

原 NO_TIME 为 SR02-T01、SR03-T01；与 SR02 完整两轮会话去重后，SR02会话×3=6轮，SR03-T01×3=3轮，合计9轮、6个隔离会话、3种冻结消息。未重新跑灰区、SR03-T02 或其他轮，不新增v23对照。

| 输入 | 次数 | 新规则结果 | 当前消息依据/沿用 | 非目标请求值 |
| --- | --- | --- | --- | --- |
| SR02-T01 无时间订位 | 3 | AVAILABILITY 3/3 | A 引用有效 3/3 | 3/3 |
| SR02-T02 补充日期时间 | 3 | AVAILABILITY 3/3 | 无新TARGET，沿用 3/3 | 3/3 |
| SR03-T01 无时间、无订位措辞 | 3 | RECOMMENDATION 3/3 | 当前消息引用有效 3/3 | 3/3 |

合法提议即使诊断不同也经过当前生产 Compiler（可信冻结参考时间）→ Task Runtime/Reducer；当前实际 Draft 成为下一轮上下文，未用 Gold 填充。没有无效输出或schema重试，9次Provider全部成功。[执行原文](review-correction/execution.json) · [独立核验](review-correction/independent-review.json) · [全部严格比较](review-correction/strict-comparison.json)。

严格差异没有删除或放宽：SR02-T01 的显式 party source 及旧 Gold 未标注 TARGET；SR02-T02 的相对日期表达、原始时段文本与 temporalResolution、继承的 party source/TARGET；SR03-T01 额外 SPECIFIC_OUTLET selectionScope。每种均3次。Scorer@4仍严格失败；独立请求值观察仅核对冻结 date/window/party/area/criteria/budget 及有标注的 target 非目标字段，9/9不替代严格分数。

上一批72轮目标69/72与11份v23对照仍按原规则记录，**不按修正规则回写，也不与这9轮合成通过率**。灰区15组各3次均推荐的结果获接受，保留灰区而非固定Gold。新主线还带有既有版本和物化政策，有限重跑不是严格单变量因果证明或泛化证据。

## 3. 四层评价与边界

1. **端到端结果：NOT_EVALUATED。** 本轮只评价语义，没有候选发现、网站、实时空位、结果展示或现实预约，不能声明合格交付。
2. **逐环节：** 9/9模型提议有效、Compiler/Reducer到达；目标/引用/沿用9/9满足，独立非目标请求值9/9；严格Scorer0/9通过，差异完整保留。发现/身份/事实/查位/交付未到达。
3. **严重程度：** 来源/交付S0及S1–S4未评价；保存的9份转移独立核对无commands、无goalBasis入State、无下游目标改写，局部权威不变量满足，不冒充产品S0全量结论。
4. **归因：** 原SR02目标问题属于已由用户确认的规则/标注冲突，修订后所选输入三次均符合新规则。非目标旧Gold、具名query丢失和CONFIRM拒绝仍在3b前置清单；本批不修、不降级、不追加样本。

## 4. 资源、时间与凭据

执行 **2026-10-26T02:17:45.528+01:00 — 2026-10-26T02:18:04.958+01:00**，CET UTC+1；总 **19430ms**，Provider latency合计 **19107ms**。逻辑9、启动/完成9、失败/未知/重试0；调用总数从84到93，硬上限144，剩51。本批全部是语义用途。新input/output/total tokens **62076/1579/63655**；价格/费用未评价，不推测。

命令显式配置 `deepseek-v4-flash`，9份原始响应与Provider记录的model字段均为 `deepseek-flash`，两个字面值同时保留，不推断其后端版本。此前窄授权只沿用于这一次受控Node Runner内置env-file加载；未独立读取、打印、复制或暂存.env，密钥未输出或记录。授权文件为运行前记录，实际加载状态见started.json；日志凭据状态只含“已加载/未加载”。私有Holdout未读取，灰区/Wed均非Clean。

## 5. 验证与交付

源提交上的[门禁收据](review-correction/offline-verification.json)全部PASS，各项git status为空；真实执行后611项仍逐字匹配。定向12/12、固定开发Fixture15/15、外层4×9正常/错人数/错目标/无效输出控制与硬额度检错通过。原先沙箱失败日志及错误版本断言均保留，不覆盖为成功。

代码门禁、语义目标评价、完整字段严格分数、灰区观察和端到端能力分开汇报。按用户授权，提交本次证据后推送复核分支，再将该验证后代快进合main并推送；最终远端main SHA由交付Git回执与ls-remote核对。用户主检出目录的既有未提交文件不参与整合。

上一批冻结报告：[72轮与11对照原文](batch3/continuation/report.md)。
