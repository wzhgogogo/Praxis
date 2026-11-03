# HARD 投影改正方向：c05 前置核查触发停止

2026-11-03，维也纳 CET（UTC+1）。**停止，未实施投影、未改 c05 断言、未合 main。** 命中用户第3条：“如果只是店名或评论，那是资格判断本身的问题：停下报告，不要改断言。”

## 资格恢复为 main 原样

上轮错误分支 `codex/fix-phase3b-hard-condition-projection` @ `3bb7d7c2` 原样保留作失败审计；本轮从最新 main **`533f1bc5cb42fa7a68a5696b201df46575cf1228`** 干净建立 `codex/fix-phase3b-hard-projection-authority`，不携带该失败分支的任何产品或测试改动。

read-assessment.ts 与 main 逐字一致，SHA-256 `9a9562304e00c98eacd8012b4f8d2d866d14bd0a8eb2438665134167c4e5e42e`；全部 src/scripts/web-skills 与 main 的 diff 为空。多余的评估时钟签名、调用方变动及错误新增测试也没有带入。保留 main 已合入的 State25 / TaskDefinition23，未自行升版本。见 [保全记录](preservation.json)。

## c05 实际被接纳的证据

使用原仓库 c05 保存结果，压缩件 SHA-256 `307abb15376b020ea65af8e5aaf7c5e58b57c0d9a84e53a0658f8cae45bd60e1`。运行前在 `1e67ab80` 提交原件与11项输入 SHA及只读重放脚本。没有改原运行或重新调用模型。

当前 main 的 Domain create/transition 重放原事件到 RESULTS_PRESENTED 之前，再执行真实 Router → Reducer 的 PRESENT 路径。输出 [c05-main-replay.json](c05-main-replay.json)：

- 门店：Kagurazaka Kappou Kaga，Tabelog `13048623`。
- 条件：非价格正向 HARD **kaiseki restaurant**。
- 资格：eligible=true；Router 产生 RESULTS_PRESENTED，Reducer 保留旧 NOT_CHECKED 卡片。
- **匹配该 HARD 的当前证据只有一条 MODEL_JUDGMENT**：`fact-judgment:tabelog:en/tokyo/A1309/A130905/13048623:2026-10-21T11:19:50.896Z:tabelog:en/tokyo/A1309/A130905/13048623:document:f04acd335ed41dab`。
- 它唯一支持的来源文档是 `tabelog:en/tokyo/A1309/A130905/13048623:document:f04acd335ed41dab`。对应 sourceStatementIds 为 `statement:1`、`statement:11`、`statement:46`（完整编号见 JSON）。

原文与角色：

| 原文 | 角色核对 |
| --- | --- |
| Kagurazaka Kappou Kaga Private rooms to Kaiseki Settai no Enkai Dokoro（カッポウ カガ） - Ushigome Kagurazaka(Japanese Cuisine) | 门店名称 H1 / 页面头部；末尾 Japanese Cuisine 是通用类别，没有明确陈述会席菜单 |
| Kagurazaka Kappou Kaga Private rooms to Kaiseki Settai no Enkai Dokoro (神楽坂 割烹 加賀 個室と会席接待の宴会処) | 门店名称与日文别名 |
| A Flaw in the Spring Kaiseki Experience | 客户评论标题：保存页可见 H3“Review？”下的 H4 |

同次、同 URL 保存页 snapshot-0008 和 snapshot-0034 均可核对这些文字及公开 HTML 语义标签；两个原件 SHA、名称区及 Review/H4 证据见 [source-roles.json](source-roles.json)。没有用私有 class 来建立业务结论，也没有为文档补造 snapshot 序号绑定。

**没有同候选 Google 类别证据。** 后续 Tabelog 查位产生的 `evidence:restaurant:tabelog-hard-criteria:90f76d3a50b0f0b768e8fa1f` 的 verifiedHardCriteria 为 []，不能提供另一项 HARD 支持。

对照只移除那条 MODEL_JUDGMENT，保留全部原始文档、身份和日期/人数/时段、空位记录不变，main 的展示资格立即消失。由此确认该店名/评论判断正是接纳该 HARD 的依据，不是另有 Google 或菜单证据在支撑。

## 结论与边界

命中用户要求的停止分支。旧 c05 “可展示但 HARD 未核实”的断言不能在本批直接改成 MET + 合法依据类型；目前保存的接纳依据不足以这样同步。**这不是对餐厅现实是否提供会席的否定**，也不把未引用的其它页面内容补成原有判断的依据。

问题位于被接纳的事实/判断来源及资格前置证据链；主线资格接受了此记录标签，但原文中的相关词落在店名和评论。需要另行复核该来源判断的接纳，不能只改变卡片去掩盖问题。本轮严格保留 main 资格，不修这个资格问题、不改 Prompt/Schema，不改原断言、Gold、评分器或原结果。

投影“跟随资格；有原文附原文、无原文标依据类型”的正确方向保留为后续目标，但因第3条前置核查失败，本轮未进入实现。D4 新一轮红绿、五门禁、严格 G2 与 main 合入均未执行，不能引用上轮其它候选的通过结果作为本轮交付。

这是历史保存事件在当前 main 的组件证据归因，不是浏览器 Replay、完整组装或新的端到端质量评价；不迁移持久化历史状态，不断言当前模型必然再次产生同一判断，不新增 S0/S1 评分。

## 保全与停止点交付

产品源码和 c05 测试与 main 逐字一致；原数据11项 SHA 不变。仅增加诊断附件、状态/历史和零调用账目。账本保留 main 的全部 696 条并按 id 合入旧 B 零调用行，再追加本次零调用行，共 698 条；额度和累计不变，见 [账本保全](ledger-preservation.json)。

**本次真实模型/Google/网站/Live/公开 GET/环境重跑全部0**；源端口调用0，没有读取 .env、answers 或私有留出集。工作分支提交/推送供复核，通知 A“未合 main，c05 触发停止”，不要求 A 改 fixture 或重跑评测。等待复核。
