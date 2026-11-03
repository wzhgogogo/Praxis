# 具名店跨回合连续性合入 main

Status: approved integration candidate；已暴露开发回归，非 Clean Baseline。时间 CET UTC+1。

用户已复核a1cd798e并批准：同步最新main，五门禁及严格G2全绿后合入推送。最新origin/main仍533f1bc5，是已复核分支祖先；合入分支codex/chore-phase3b-named-continuity-main从该main创建，merge c49d2aa2，所有产品/测试源码与a1cd798e逐字相同。未改其他工作树main或产品规则。

按Planning局部切片：本轮只验证并发布已复核连续性修复；D2多候选与D3条款问题另开分支。门禁或净树失败即停，不以局部测试替代完整门禁。本轮真实模型/Google/网站/Live调用0，不读或加载.env。

账本并入A ae7fd072的42个新ID，无冲突且原行逐条不变；加C零调用一行，共740条。main限额26 Live/1600模型/290评测GET/4环境重跑保留，A390限额只存快照，不作为新增C授权。累计8 Live/347模型/277评测GET/36 Google/5843网站请求；本轮C新增均0。核对见ledger-union.json与A原始快照。

运行前冻结源码、输入、Runner及账本SHA，执行run-gates.py，输出至gates/。完整默认、Chromium、严格G2、原无地区9帧/来源名7帧/D6 13帧独立核验一并运行。每项前后status须为空，600秒外层保护，无自动重试。通过后仅归档证据/文档，再推main、ls-remote核对、通知A。

用户转达复核者Linux默认测试曾遇PGlite WASM JIT释放崩溃，单文件两次15/15；这是独立复核记录，不是本机已发生的失败。若本轮再次出现，保存原始输出并通知A统计，不修改产品或断言来掩盖。

最终结果待gates.json；尚未推main。

## 合入前验证完成

源码0d2fff0ea7af77545176704b8d4155d1e24a30b1，786项冻结，净树11步全通过。typecheck/arch/build通过；默认1382/1382（46.860秒）、Chromium188/188（130.715秒）、严格G2 5/5且12页PASS（24.121秒）；独立原9+名称7+D6 13帧及组件控制通过。每项前后status为空，无自动重试或超时；本机未见PGlite运行时崩溃。原始命令、时间、输出SHA见gates.json，汇总verification.json。

其后仅文档和证据归档，产品/测试/Runner源码仍与a1cd798e逐字一致。按用户批准推送main并用ls-remote核对，最终发布SHA见Git回执；随后通知A。第二项另开分支，不把这次发布说成已修D2/D3新问题。
