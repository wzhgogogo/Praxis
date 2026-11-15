# 合入前跨场景真实模型抽检：首失败停止

2026-11-15 CET · 用户确认改用实际D01（Takadanobaba/Spanish）、07（Koenji/yakiniku）及D8。冻结编排/输入提交 `04947d51c347dbc9742899d023a7dd97105b9044`，产品源码仍为 `4b4b56d2`，实际Prompt27 / Wire Schema16。7帧计划，只执行2帧后按预设规则停止。

| 已执行帧 | 原录制位置 | 真实DeepSeek动作 | 独立预期 / 结果 |
|---|---|---|---|
| D01首页 | category-discovery-cost-20261110/runtime/D01/D01/execution.decisions.jsonl #4 | FILL_AUTHORITATIVE LOCATION，target178 | 当前可用权威输入；PASS |
| D01已限定范围的空结果列表 | 同文件 #8 / observation:5 | CLICK All，target16；理由是改用分类检索代替返回0结果的自由文本检索 | URL已含sw=Spanish，来源原文明确Takadanobaba及0结果；冻结预期COMPLETE，FAIL |

**结果层：** 单步录制模型抽检 `STOPPED_FIRST_FAILURE`，1PASS/1FAIL/5未运行；不是整单交付或稳定率验收。**逐环节：** 两次严格wire序列化/反序列化均PASS，6个必填字段含valueGroupRef都有；来源实际query+text经当前source pack与`sourceListingCompletion`返回complete=true。该页HTML被原Recorder拒录，模型原观察仍完整保留；完成组件使用原URL/标题/文本及实际显式空列表检测，没有制造HTML、店铺或库存。**安全：** 未执行模型动作，无网站/Google/Live传输，模型专用传输仅允许DeepSeek POST；凭据扫描0命中、不保存请求头。此处不冒称整单S0已验收。**归因：** 模型主动把已限定查询的0结果视为还需分类检索，偏离本批预设完成目标；这是一个额外下钻动作，不能声称已经形成死循环，也不能在未做基线真实模型对照时断言是Prompt27造成的因果回归。

实际消耗 **0 Live / 0 网站 GET / 2 真实模型调用**（上限10、余8）；模型耗时合计5480ms，输入37358token、输出291token。无重试、无补跑；07与D8五帧未执行，D8原本仅有DATE决策帧，独立人数/时间选择覆盖仍不宣称。此前D02-V九帧PASS为独立旧记录，不能抵消本次FAIL。

主工作区HEAD/diff/NUL-status和9份历史账本哈希一致；新账本只记录2次实际调用。产品、Prompt、Skill、Guard、评价器均未改。按用户首失败停止规则，**第二步Test Skill1.9更新及第三步main整合/净树门禁/推送均未执行**。冻结脚本和预期不在看到输出后改写；模型响应、wire、用量、独立scope组件和失败均原样保留。旧全量树管理check失败单独保留，未重配。

数据：[model-pass-01/results.json](model-pass-01/results.json)、[独立账本](active-budget.json)、[保护哈希](protected-after-model.json)、[当前scope预检](continued-preflight.json)。下面保留前序输入盘点，已被用户确认的实际场景选择接续，未删除历史。

---

# 合入前跨场景抽检：输入资格停点

2026-11-15 CET，基线 `e4ccf8d092077028d4c54edf1ccf46b52f4e431b`，产品源码 `4b4b56d2541a3039cecdce468d11e2072cf08429`。本批为输入盘点，不是模型验收；状态 `BLOCKED_INPUT_QUALIFICATION / NOT_EVALUATED`。

| 核对 | 实际证据 | 结论 |
|---|---|---|
| 版本 | 直接读取Git blob：32b97ed8为Prompt25/Schema14；候选为Prompt27/Schema16且valueGroupRef required | 与指令24→28/15→16的描述不同。保持冻结代码，不改号、不冒称Prompt28已验证 |
| D01/07 | 当前HEAD中保留的D01真实发现请求为Takadanobaba/Spanish；07事实回归数据为Koenji/yakiniku。标题检索找到了checkpoint-c的Ginza/Izakaya旧实页，但不能称为07；未找到对应Shibuya/Spanish已限定范围列表 | 需要确切录制路径或确认使用实际已有场景，不改写请求来制造指定场景 |
| TableCheck | 当前HEAD保留3个AVAILABILITY模型决策：D8 positive-slot #25、direct-outlet #28、entry-idle-retry #33，均选择DATE；真实观察含已显示的人数/时间，但没有对应模型选择帧 | 不能以3次日期抽检声称日期/人数/时间都覆盖。缺已展开人数/时间控件及对应权威请求上下文 |

具体文件、sequence、URL、原动作和SHA见 `recording-inventory.json`；实际HTML标题及SHA见 `title-coverage-audit.json`；版本字面量见 `version-audit.json`。此前D02-V九帧证据原样保留于 `category-guidance-recorded-20261113/model-pass-01/`，本批未重跑、未改写。

为避免消耗在未满足覆盖要求的输入上，尚未加载凭据或创建/修改模型账本，实际 **0 Live / 0 网站 GET / 0 真实模型调用**，10次授权均未使用。主工作区HEAD/diff/NUL-status及9份历史账本哈希前后一致。Prompt、源码、Skill、历史评价均未改；第二步Test Skill1.9及第三步main整合/门禁/推送均未执行。仅将本批输入审计提交工作分支，停下等待录制路径确认，不把输入缺口写成模型FAIL或产品回归。

旧全量树管理check继续报告需要单独保全审计，日志保留；不重配、不建树、不展开其他档案。
