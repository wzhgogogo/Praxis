# D02-V r4 最后两次受控Live

2026-11-12 CET；已暴露开发用例，不是Clean Holdout。main冻结105a8b0a825f4dd729674ffb26847d4b13f60771；仅修复分支src/docs整合，main无新增.eval-artifacts。完整门禁及双基线ead28945/ca4deca1通过后才能启动。

运行配置两份与外层脚本、独立新账本先提交。复用原d02vSpec、runG6Batch/createLiveReadAssembly、frozenHoldoutReadRules、WitnessReader和60s体检；新ledger限2Live/20GET/120模型/0环境重跑。旧CLI只接受累计43/235，故本临时外层只接新独立额度，不改src或业务决策。保留原日期/人数/时间、45s provider、500s/50模型。凭据只通过旧--env-file；记录配置/编排/原env文件SHA，不存凭据。

r1→r2串行，随机120–240秒；见证1GET→4体检GET（>=5秒）→runG6Batch（后验<=2GET）。r1有S0/环境失败/未知异常/缺安全证据即停止；仅缺资格注释PENDING_REVIEW可继续。正常能力失败不改代码，保留两次真实表现。不追加运行或外层重试。产品原已批准入口重试机制不变。

四层评价：最终结果与耗时/调用/GET；各阶段序号轨迹；独立boundary/evaluation错误声明S0；LOCATION、父行政区、可见回退、目录完成/Sumika前5及native URI/是否盲搜、8人日期时段。provider45s超时按具体店/阶段单列，不笼统归发现失败。回放44.508s不作为Live结论。03/07汇总按用户给定已复核切片口径2/2，各历史运行仍保留。

完成或触发停止边界后完整产物/账本快照/前后保护哈希/一页报告推送本证据分支，停止等复核；不修代码，不再跑。
