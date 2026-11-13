# D02-V 单次 Live 诊断

**2026-11-13 11:35:47–11:40:30 CET**。被测HEAD `5f8e01f1`，源码/Skill `67a949d7`，运行前编排提交 `29872ba4`；完整SHA及输入哈希见config.json、run-audit.json。已暴露开发用例，计划/启动/完成各1，不外推稳定率。

## 1. 端到端结果

**EVALUATED / CAPABILITY_MISS / qualified=false；未交付，无B1。** 产品257.164秒、首回合256.439秒；含见证/体检总283.293秒。见证与无交付后验均确认12-10 20:30 /8人有位。自动评价唯一能力FAIL为NO_DELIVERY_WITNESS，原评价保留，无交付资格项需要补评。

实际 **1Live /6评估GET /44模型 /0环境重跑**；GET=见证1+体检4+后验1，另5次Google。新账本余 **0Live /2GET /11模型 /0重跑**，不追加使用。冻结runner仍50模型/500秒回合、45秒provider/90秒candidate，账本55不提高产品上限。

## 2. 三个重点

| 核对 | 实录结果 |
|---|---|
| **库存齐全后跳过终端扫描→COMPLETED** | **NOT_REACHED**。Sumika #14翻月、#15选12-10，HAR index32/33仅2人；#16人数推进时45.021秒截止，未选8。Manten #26翻月、#27选日、#28人数推进，HAR index42/43也仅2人；诊断#419于43.763秒才开始下一次决定，#29选8的2.178秒响应晚于#421的45.015秒关闭，点击未执行。本轮无8人整组响应、无终端快路径完成事件，不能据此判定快路径Live通过或失效；此前离线结论保持。 |
| **首轮步进动作** | 对两家有日历/人数轮播的店，这一子项满足：Sumika #14/#16、Manten #26/#28均直接ADVANCE_TO_AUTHORITATIVE；步进控件上错误CLICK_AUTHORITATIVE提议0。#15/#27是合法精确日期直选，#29是精确人数但迟到。Okajoki另有问题：#21缺valueGroupRef被浏览器wire校验拒绝；#22推进“Restaurant information(detail)”后ADVANCE_NO_PROGRESS。传输成功不代表动作正确。 |
| **分类继续下钻** | **整体FAIL，下钻子项NOT_REACHED**。#4填权威label，#6进入`https://tabelog.com/en/tokyo/A1319/A131902/`；#7–9始终点More filters，#8/#9被遮挡（诊断#84/#100 ACTION_OBSTRUCTED），未打开分类面板，也未下钻父类/兜底类。旧有界Escape/blur恢复不能冒充可见关闭按钮动作。原生0候选，3家来自Google；仍有名称搜索#11–13、#17–19、#23–25。不能声称分类Skill已在真实模型上通过。 |

HAR索引从0计。Sumika快照10–13，Manten25–30；完整目标/availableActions/URL/时间见decision-trajectory.json。Tabelog provider分别：Sumika45.021秒/6调用、Okajoki44.072秒/6调用、Manten45.015秒/7调用。前后两家为具体provider截止，不能统称发现失败或断网。

## 3. 独立安全与保护

**S0=0，REQUEST_BOUNDARY 252/252 PASS。** 证据来自外层Node转发/CDP来源接收观察和冻结独立合同，非Guard verdict自证。DEADLINE、TURN_BUDGET、F6_RESERVE、BOUNDED_NO_RESULT均PASS。模型44/44传输成功，providerRejected0；#21浏览器wire拒绝另列。四体检200、1.87–4.18秒。

三录制开启，28/39页可回放；4 UNSAFE_DOCUMENT、7 UNCAPTURED_DYNAMIC_RESPONSE保留，是部分Replay。凭据逐值扫描0命中，请求头/Cookie字段0保存（credential-scan.json）。主工作区HEAD/diff/status、三旧种子账本+9856账本、9856证据目录473文件、被测源码/Skill/文档/脚本及既有验证证据before/after哈希一致；编排配置哈希一致。

## 4. 首个偏离与停止

#7先选额外筛选而未进类别入口，#8/#9遮挡后仍未纠正，是首个与本轮预期不符的发现动作；随后继续支付名称核对和日历成本。Manten到43.763秒才决策选8，本轮未到终端扫描优化的生效点。这些是实录归因，未追加反事实/模型或网站验证。

完成后仅推送独立证据分支；**不改产品、不合main、不跑Held-out、不自动重试**。旧录制/原评价不改。模型用途、操作耗时与原始哈希见run-audit.json。
