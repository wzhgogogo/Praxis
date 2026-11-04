# 资源策略与导航预算下限：main合入

2026-11-04 CET（UTC+01:00）。用户已批准A44973e83合入、同步最新main、全门禁通过后发布；并明确补充“按189/189全绿验收，沿原授权合入并推送main”。本次新增真实模型/Google/网站/公开GET/完整Live/环境重跑均0；不读.env或answers/private holdout。

## 最终变化

共享Guard在原有准入检查后，默认抑制image/media/font；文档、stylesheet、脚本和XHR/fetch仍按原规则。保留例外为声明式字段，不授予原本不允许的访问；生产站点未加例外。录制保留RESOURCE_POLICY_BLOCKED及policyBlock标记，不作为未捕获资源。

导航剩余run/candidate/provider浏览器窗口小于3000ms时，不准备/发起导航，返回BROWSER_BUDGET_EXHAUSTED并透传到结果；实际在途超时保留BROWSER_TIMEOUT。所有生产时限/预算不增加，取消优先，短显式操作timeout不等于整个浏览器预算不足。

A三个fixture仅声明精确本地图片路径retainedResources：/image、图片重定向的/asset与/asset-hop、回放/not-recorded。与A44973e83逐字一致，原assert行全部保留，无生产站点放行。已发布A逐请求时间线/Runner接线与main22415b57逐字一致。State/TaskDefinition/Prompt/Schema不变。

## 集成与数量口径

先快进合入44973e83，再合并最新main22415b57，merge e50f935d无源码冲突。四份文档冲突保留双方；月度摘要自动合并；账本按ID并集，原829条全部原值保留。最新main新增request-timeline.test.ts的1个测试，所以原188项+1=189；用户明确批准这一口径（count-approval.json），没有删除/跳过任何测试来凑188。

## 同一净树候选验证

冻结候选 `68a9a175a1bd2cf6c0c03163c832ff1203f64e98`。所有六步前后git status均为空，未重试、跳过、todo或取消；门禁后仅归档报告/原始日志，不改已测源码、测试、fixture或输入。

|门禁|结果|秒|
|---|---|---:|
|typecheck|PASS|0.597|
|arch|PASS|0.272|
|default|1410/1410 PASS|49.600|
|build|PASS|0.595|
|chromium|189/189 PASS|131.639|
|strict-g2|5/5，12页PASS|24.081|

原始输出无损gzip保存于gates/；解压后SHA与gates.json一致，archives.json同时记压缩SHA。verification.json记录源树及入口完整性。A原红→绿和assert SHA仍在../retained-image-fixtures-20261104/，不改历史证据。

## 账本

公开GET总上限已按用户批准写为410；累计298、剩余112，108留出预留原样保留，先前6次缺口已消除。开发GET43及其他上限不变，网站计数8432、模型401等累计不变；本轮0实支、无新实际调用条目，所有A/B原行均保留。ledger-union.json可复核。

## 发布边界

按用户授权快进发布main与工作分支，远端SHA以ls-remote交付回执为准；发布前再次核对main基线以避免覆盖并行工作。源码与上述已测源树一致。发布后通知A、C。

这次签收的是共享资源策略、导航预算下限及fixture合同同步；不是Tabelog真实超时根因关闭。W1前批8次测量没有复现旧20秒超时，浏览器wire TTFB和晚发initial_vacancy完整结束仍未知，原始报告保留在../w1-request-timeline-20261104/。不将本地门禁当作新的Live结果或稳定提速证据。
