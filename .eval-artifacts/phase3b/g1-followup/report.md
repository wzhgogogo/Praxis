# 3b B 批次3：接入版本预告（尚未实施）

时间：2026-10-27T16:09:46.270632+01:00（Vienna CET，UTC+1）。Evidence status: draft / not integrated。

按用户批次3第1节“Agent Prompt、State、TaskDefinition如需递增……先停下报告将要递增的版本，再改”，现在停在实施之前。**这不是停止点1完成报告**：G1核心本地合入完成；Agent/Web尚未接入，主链路追问红灯/绿灯尚未运行，真实模型评测与G3尚未开始。

## 已完成：ADR与核心整合

[核心整合报告](../g1-integration/report.md)附完整冻结、红绿复用、五门禁和未覆盖边界。ADR0046 revision0.2原SHA96b0f371已匹配，仅Status行改Accepted并注明2026-10-27批准；正文不改。核心7份事实源码与e4829a58逐字节相同，重放到daba2ef0并保留并行main/319cb9a5；预算原条目按id并集，A的答案未读。五门禁测试7be3b33a：typecheck/arch/build通过，默认1152/1152、真实本地Chromium168/168（107.236秒）通过，逐门前后净树。旧HARD完整44,197字节同SHA。核心本地main为`c98438f89beaf16f7067b8385a747a137f5bec7c`；原核心分支e4829a58保留。

## 拟递增版本

| 对象 | 当前 → 拟用 | 原因 |
|---|---|---|
| restaurant-agent-decision Prompt | 28 → 29 | 增加追问合法动作的选择和约束；问题/门店/run/页面由权威上下文绑定 |
| restaurant_agent_action Schema | 4 → 5 | 新增ANSWER_PAGE_QUESTION无参动作；模型不能提交candidateId、URL或另写问题 |
| restaurant_agent_context | 16 → 17 | 只投影代码绑定的当前追问及可执行性/预算；不暴露任意页面列表给模型选择 |
| restaurant-state | 23 → 24 | 记录用户明确选中的已展示门店追问、同run绑定及结构化核对结果，避免Web持有第二套权威状态 |
| restaurant.booking TaskDefinition | 21 → 22 | 增加追问请求/完成事件与Reducer处理，取消/迟到结果不得覆盖新的追问或别的run |

版本值和各文件当前SHA见[version-preflight.json](version-preflight.json)。独立restaurant_page_question Prompt/Schema均保持2；Semantic Prompt/Schema不改。没有兼容分支或双写；实施时同步现行调用方/fixture，不自动重置任何数据库。

为什么必须改State/TaskDefinition：当前Coordinator把PRESENT_RESULTS当作本轮停止条件，普通消息路径会进入语义修改；如果仅在Web直接调用问答核心，无法形成受校验Agent合法动作，也会绕过持久事件、原运行绑定和预算/取消。应由显式用户追问事件开启受限动作，核对结果经Reducer保存，再投影到Web。

## 拟实施的纵向范围

1. 在已展示门店卡片提供英文追问入口；服务端按认证用户、case、task版本确认门店确实展示过。模型只可选择ANSWER_PAGE_QUESTION，不携带门店/URL；门店身份、来源、run、问题原文由服务端事件和上下文绑定。
2. 通过现有事实reader的已绑定页面观察hook建立同run缓存；先克隆并复用该缓存，缺少页面时才走原Native/官网reader。Guard、90秒来源/500秒整单/共享模型预算和取消照旧，问答不隐式重置原run预算。超时/耗尽/取消显式未核实；跨run、异店、旧请求结果拒绝。
3. 结果沿用ANSWERED/NOT_STATED/UNVERIFIED契约，不改HARD满足、库存或授权。Web显示简短答案、原语言引文、URL和readAt；NOT_STATED显示Not stated on the page及查页；敏感显示Please confirm with the restaurant。
4. 先在真实HTTP/持久应用组合上取得“展示结果后追问信用卡无法回答”的目标断言红灯，随后贯通Agent→Validator→Router→核心→Reducer→Web。正常缓存、缺缓存读取、同名异店/跨run/伪URL、引用失败、敏感、取消/迟到、预算与跨用户隔离按现有测试矩阵覆盖；真实Chromium验证可见交互。依赖时间用注入时钟/条件等待。
5. 新输入/外层脚本先提交冻结，每个门禁前后净树；五门禁通过后才交停止点1。A负责Runner和独立评分，不改其评测/fixture文件，不读answers或含答案脚本。

预期修改Domain Agent/State/TaskDefinition/Validator、Application Router与持久应用、事实reader工厂接线、Server/Web展示及相应测试。身份/详情解析、Semantic、Guard和G3列表/日历暂不改。C快照`1044567565daaf16a384dc24ff8260a11b89759c`在上述五份共享版本文件无差异；实施前再核对最新main，避免占用并行新版本。G3前仍需C详情页身份改动正式合入。

## Git交付及当前阻断

本地main已快进`c98438f89beaf16f7067b8385a747a137f5bec7c`，工作区无源码变更。首次工作分支push遇到Empty reply；HTTP/1.1重试遇GitHub443连接超时。尚未确认工作分支推送成功，后续实际回执另记。

自动审批拒绝了同时推送main与整合分支的动作，明确理由：本批授权合入main，没有明确授权本次推送main；以往main推送授权属于其他批次。被拒操作没有启动，未绕过。风险是推进共享远端main，影响其他协作者。需用户明确授权将远端main由最后核对的319cb9a5推进到c98438f8；不强推、如远端前移则先同步。[交付记录](git-delivery.json)。

真实模型/Google/餐厅网站/Live/公开GET/环境重跑新增均0；不加载、不复制、不暂存.env；不读/哈希答案。G1真实模型评测（≤120调用，Live0）在A Runner就绪后的停止点2进行，原始输出交A评分。G3与TableCheck按本批顺序等待。

## 最终推送回执

2026-10-27T16:15:46.540491+01:00：仅推送两个工作分支的最后一次原子push也因GitHub443连接75,002 ms超时退出128。两个分支本批均未确认推送成功；当前停在版本预告，生产源码与654冻结输入不变。远端main推送未启动，仍待本批明确授权；最后已确认远端main为319cb9a5。GitHub连接器无法访问该仓库，未作为替代写入通道。
