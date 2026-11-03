# HARD 条件投影修复：门禁停止报告

2026-11-03，维也纳 CET（UTC+1）。**draft / not integrated；默认门禁未通过，不能合入 main。** 本次不是完成或签收报告。已触发 3b 通用规则“门禁修两次仍红”停止点，交复核；未把失败归为无关问题，也未修改 A/C fixture 或旧断言来转绿。

## 当前结果与范围

基于 main `d4d8ea33a4cf32b01601474f02ad89c538bf3f69`，分支 `codex/fix-phase3b-hard-condition-projection`。产品候选 **`46ed4a52df10f80cf7df7b1c9b0f700cecf34931`**；本报告后只归档、同步文档和零调用记账。main 未合入、未推送，本地工作分支供复核。

D4 原输入已在 `bd122db5` 冻结：A `769766455c38c369fa61bad56112de45230dfc68` 的 `d4-d6-safety-only/runs/D4/execution.result.json`，SHA-256 `d74f901dfa54b5a42e9bfd8823da291b23ecb16c08dd132602e9a11f229eaa18`。旧代码目标断言红：期望 MET，实际 NOT_CHECKED；资格及同一引用的前置断言通过，见 [红灯](verification/red/d4-red.json)。

最终候选 D4 绿：kushikatsu 从 NOT_CHECKED 变为 MET，eligible 保持 true，逐字保留“揚げ物メニュー：串カツ、アジフライなど”、原 URL 和来源角色；不称为专门店。[最终原输入重算](verification/final/d4-result.json)。没有改写 D4 原结果或评分。

新增最小领域构造检查了实际 Reducer 持久化与投影：无接纳判断、异店、异 URL、缺支持、过期来源/判断、显式替代、店名和评论不能建立 MET；价格、负向冲突/类别 UNKNOWN 及服务范围控制通过。旧价格分支、负向资格分支逐字不变；旧测试只补 33 处显式固定时钟参数，五个文件去掉新增时钟参数后原字节相同，原断言均保留，见 [保全记录](preservation.json)。State24 / TaskDefinition22 / Prompt / Schema 不变。

## 同一最终候选的完整结果

| 检查 | 结果 | 秒 |
| --- | --- | ---: |
| typecheck | PASS | 0.481 |
| arch:check | PASS | 0.185 |
| npm test | **FAIL：1316/1358，42 fail，0 skip/todo/cancelled** | 43.120 |
| build | PASS | 0.484 |
| Chromium fixture | 188/188 PASS | 130.998 |
| 严格 G2 | 5/5 测试、12/12 页面 PASS | 24.447 |
| D4 原结果投影 | PASS，MET + 同一原文 | 0.133 |
| 旧 HARD | 44,197 字节逐字节一致 | 0.143 |

[完整逐项退出码与净树记录](verification/final/gates.json)、[默认失败全部原始断言](default-failures.json)、[严格逐页结果](strict-g2-pages.json)。42 是 Node 摘要的失败数，包含嵌套测试/父套件统计；日志中 36 个独立失败块另列，不混称为 42 个已完成根因分类。

八项前后 git status 均为空；753 份冻结输入不变，SHA-256 `d2f36e237aee737ca634a99bf76ac496426c9da795a2773ed1735c64ab437500`。本轮最初默认运行另有沙箱 listen EPERM，已原样保存；允许本地监听后 EPERM 为 0，仍有以上产品/契约回归，不能说“只是环境问题”。所有尝试见 verification，未删除红灯、排除文件或跳过断言。最后外层继续执行已批准的其余命令以给出完整矩阵，但总验收仍 NOT_SATISFIED，不豁免 npm test。

## 已确认的偏离与未解决问题

**偏离由本实现引入：read-assessment.ts 将非价格正向 HARD 也改为要求 assessRestaurantConditions.status=MET，把旧投影的全部字段要求提升成了资格门槛。** 这不能仅作为 D4 修复已完成来发布。需要收敛回“共用已接纳的证据结果”，并明确现有代码证明和已引原文在共用结果中的表达，而不是笼统地要求所有旧路径先通过旧 UI 字段限制。

已确认的三个实例：

1. `src/domains/restaurant/action-validator.test.ts:178` 的 cafe 控制仅构造 current/high-identity 的 verifiedHardCriteria=[cafe] 和营业证据，没有原文/URL。旧契约要求 ALLOWED，新候选改为 REJECTED。不能从请求里的 cafe 编造来源原文来补绿。
2. `src/application/restaurant-presentation-evidence.test.ts:49` 的 c05 Kaga 控制明确要求可执行 PRESENT，同时第 74 行要求 HARD 仍 NOT_CHECKED（店名/评论不能显示 MET）。这暴露了历史“资格接纳但显示未核实”的合同；统一口径后需要明确如何处置该控制，不能直接删断言或宣称与本次改动无关。
3. C18 split tempura 的只读跟踪证明：当前、同店的 MODEL_JUDGMENT 已验证 tempura restaurant，支持文档的 restaurantTypeFacts 有原文 Tempura、菜单说明，但没有 sourceFieldQuotes。新候选将这些记录仅当作弱 SOURCE_TEXT，因此拒绝资格。该实例并非没有原始证据；缺的是额外字段角色。跟踪仅追加诊断日志、返回值原样，见 [原始诊断](verification/red/c18-trace.log)及其临时 loader；不算新的整组装验收。

36 个失败块分布：application/restaurant-presentation-evidence 4、domains/restaurant/action-validator 8、eval/agent-loop/current-development-offline 4、eval/agent-loop/hybrid-read-composition 16、harness/restaurant-execution-router 4。除上述实例外，其余未逐个确认根因，不能统称为“旧 fixture 错误”或要求 A 全部改期望。

已做两次收敛：优先保留旧字面引用，避免给已通过的卡片额外附整页字段；保留原本可用的字面来源支持。默认门禁仍 42 fail，故停止继续改规则或输入。

## 复核建议与边界

下一步应先复核共用接纳结果：保留已有、同店当前且完整引用闭合的 MODEL_JUDGMENT 结论，对已记录的原文按实际来源表达引用，不因缺少旧 UI 字段标签再次否决；名字/评论、串店、失效/替代、价格与负向及服务范围的边界保持。raw provider 的历史 verifiedHardCriteria 测试和合法 Google 类型判断应分别盘点，不能混作模型结论或为了全绿新增兼容分支。

c05 的历史双口径和只构造标签的单元控制如何对齐，需要复核明确。涉及 A 的 eval/harness 文件时按用户 3b 文件归属规则先安排；本次没有改这些文件、评分器、Gold、独立期望，也没有要求 A 补造证据。原产品回归应先厘清，再决定相关测试同步。

**本批新增真实模型/Google/餐厅网站/Live/公开 GET/环境重跑全部 0。** 不读 .env、answers 或私有留出集。账本保留原 619 条，追加一条零调用至 620，累计与额度不变。没有新的质量评分分母，不改变 D4 独立资格核查的未评状态。

按停止点规则推送工作分支供审查并通知 A“未合 main”；main 发布条件未满足，不能声称完成。等待复核，不继续修改合同、A/C 输入或执行真实调用。
