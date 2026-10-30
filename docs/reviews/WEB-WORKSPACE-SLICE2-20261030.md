# 前端第2段实现与停止点

- Status: Draft
- Document revision: 0.1
- Last updated: 2026-10-30
- Source of truth for: 本段实现范围、真实Fixture验收、未完成项与复核依据
- Evidence status: draft / not integrated；局部Fixture实现，不是整段验收通过或Live能力
- Related documents: [计划](../WEB-WORKSPACE-SLICE2-PLAN.md), [视觉](../product/VISUAL-DIRECTION.md)

## 结论与停止点

第1段已按用户批准快进合main：404a766e → 4cbc521bb9e4fb177e247266561bd90eb5d34e3f，推送后核对远端一致。无新合并提交或附加内容，按指令没有为这次快进重跑门禁；[回执](../../.eval-artifacts/web-workspace-slice2-20261030/main-fast-forward.json)。第2段分支从该main创建，STATUS的合入记录只在第2段分支更新。

主输入框、回答面板/完整问答历史、条件胶囊、服务端版本差异与备选原因、正常批末续批、模型理解失败、部分来源失败、真实SSE重连、过期refresh已接通，开发两尺寸21条通过，包含第1段十一项所在脚本。**整段尚未完成**：空结果Find more及同一终态全部来源失败后的Try again需要另开NO_VERIFIED_RESULT的真实只读续查准入；当前接口拒绝，已向用户询问，未获批准前不修改Domain/Runtime，也不通过聊天让模型绕过。

## 实现与依据

- DETAILS的主输入框调用原questions并绑定当前展示candidateId；其他需求视图走messages，删除第二输入框/Ask链接。回答面板只放店名、原答案、来源和原确认提醒，外点/下滑收起，保留卡片、输入与定位。
- 问答的原State/CaseView仅最近一条，但持久PAGE_QUESTION事件保存完整请求/结果。因此本段从已有事件按requestId/readRunId/candidateId恢复全部按店历史，完成事件逆序，不新增问答存储，不改G1执行、引文、敏感规则或20问限制；未采用“只能显示最后一条”的退让方案。
- 条件始终为胶囊，只有INFERRED_CLOSED_PARTY人数带问号。没有通用无模型条件端点，本段仅聚焦/预填Change <condition> to并回到需求视图；结构化修改方案见计划，不新增事件。
- 差异和历史备选来自服务端已读的同Case事件及当前状态，无新增数据库往返。searchRevision取代原误名requestRevision，仍是搜索计数；requirementRevision独立表示条件版本。removed/added比较两个条件版本内接纳的展示ID集合，查找中不发布差异；前端不比较缓存列表。
- 原因只来自当前HARD价格判定或明确新时段NO_MATCHING_SLOT，未知为No longer matches。备选保留原ID/店名，不把旧库存当作当前可用性；重申已保存状态不会抹除原版本关联。
- 一批最后一张之后为Any of these work?，可返回最后一张；Saved/Adjust为文字按钮，Find more唯一群青主动作，调用既有another-batch。原生EventSource error/open控制Reconnecting；明确过期时间触发Check availability again并走原refresh，不改B1链接/证据规则。
- readStatus仅使用类型化状态，模型理解失败保留原文、正常无结果不说没店/没座。全部来源失败须有显式失败尝试、候选均已检查且没有成功检查；UNKNOWN、正常无位、未读候选或缺少attempt明细的成功检查不能被说成全失败。

## 诊断与已有开发证据

旧UI的主输入框在DETAILS仍为Adjust anything?，目标断言实际红；现有G1 UI测试改接单输入框后通过。新增两尺寸真实HTTP/SSE/Application/Runtime/PGlite脚本验证路由、问答隔离与最新顺序、条件来源、续批、断线恢复、过期刷新、版本差异/备选持久化、模型失败与部分来源失败；旧第1段及三项UI回归保留，共21/21开发通过。它们是本地Fixture，不是实时网站或模型质量评价。

Fixture修正均未改生产规则：续批的固定模型遵守代码提供的已展示排除集；刷新观察/引文更新时间；变更20:00后来源链接使用实际观察slot，原错误19:00被B1门禁正确拒绝；首次请求three不误当已有草稿的修正。过期正常控制用来源明确给出的60秒有效期，仍在原500秒自动读取预算内。原10分钟显示期限超过500秒run预算的试验不能证明刷新后必然有新结果，本段没有扩大产品预算或绕过它。

来源分类独立混合反例曾把“一个失败attempt，另一个AVAILABLE成功检查但无attempt细节”误说成全部失败；同一断言红→绿，现禁止这类误归因。真实来源质量、泛化、私有Holdout均未评价。

首次冻结4a4b762c的本地HTTP探针把既有登录接口成功201误写成200，在业务检查前失败，五门禁未运行；原件保留于gates目录。仅修正探针登录合同，生产代码/Fixture不变，重新冻结后再执行，不把此次脚本错误归为业务拒绝或验收通过。

## 空结果续查的最小方案（待用户决定，未实现）

1. 保留another-batch URL、版本/requestId幂等、归属、预算、取消与只读边界；新增NO_VERIFIED_RESULT准入，不扩大到预约/支付/取消或不明确结果。
2. 不能只改phase检查：旧检查和耗尽游标会使它立即再结束。明确以原条件发起一次新的有界读取，失效当前读证据/游标、保留用户条件和备选，沿用原用户触发入口；不造语义提案，不让模型决定路由，不增加后台自动重试。
3. 若能复用现有NEXT_BATCH_REPLENISHMENT_REQUESTED则不增加第二条执行链；按行为修订TaskDefinition，State仅在持久形状改变时升版，现有Schema/Prompt/Gold不为此调分。成功后用“原空结果/失败 → 显式点击 → 当前条件重查 → 可交付结果”的固定来源控制验收，不以按钮收到400冒充功能通过。
4. 未获批准前，只报告该缺口。其余已授权功能继续验证，整段验收第8项的这两个动作保留未完成，不把五门禁或局部测试等同整段通过。

## 最终门禁与截图

待代码冻结后按五门禁逐项净树运行，附完整原件、两尺寸结果及主要新画面390×844截图，逐项对照视觉“不做”。未运行的检查不能写PASS；当前还不是最终交付结果。真实模型/Google/来源GET/Live/外部写入/Holdout为0，不加载生产凭据。
