# 2026-11-09 CET 01-r3补评与续跑后的停批报告

运行SHA4256303de2cf8cf1921420e3318db5ce443d3c6d，v3/同账本不变。原工作区保持净树，不改代码/输入、不读私有原文、不干预浏览器；本报告仅写入独立evidence-02副本，旧报告与原始文件原样保留。

**当前原始stopReason：NETWORK_HEALTH_FAILED。** 03-r1、03-r1-retry1均CANCELLED_BEFORE_LIVE，TableCheck第一轮分别10.000/10.003秒未完成，无HTTP/响应状态证据，不推断DNS、CORS或Guard原因。上一轮已用1次体检恢复；本轮等待45秒后按用户剩余额度执行最后1次，仍未通过。累计2/2已用完，没有第3次恢复，也没有03的产品Live。04a/04b/05尚未进入。

01-r3按复核者文件df3f0bd3…重新独立评测，另存evaluation.supplement.json，EVALUATED_BY_REVIEW / qualified=true / QUALIFIED_DELIVERY / s0=0 / stopBatch=false；原evaluation.json SHA508c1420…完全未变。01-r1/r2未补评或重跑。02体检两来源两轮HTTP200且<10秒，随后顺序完成02三次并立即独立评测。

| receipt | status | qualified | outcome | s0 / status | 秒 | 模型 |
|---|---|---|---|---|---|---|
| p3b-holdout-01-r1 | CANCELLED_BEFORE_LIVE | — | — | — | — | 0 |
| p3b-holdout-01-r1-retry1 | EVALUATED | false | CAPABILITY_MISS | 0 / PASS | 235.962 | 47 |
| p3b-holdout-01-r2 | EVALUATED | false | CAPABILITY_MISS | 0 / PASS | 212.053 | 47 |
| p3b-holdout-01-r3 | EVALUATED_BY_REVIEW | true | QUALIFIED_DELIVERY | 0 / PASS | 252.487 | 56 |
| p3b-holdout-02-r1 | EVALUATED | false | CAPABILITY_MISS | 0 / PASS | 233.695 | 47 |
| p3b-holdout-02-r2 | EVALUATED | false | CAPABILITY_MISS | 0 / PASS | 188.131 | 47 |
| p3b-holdout-02-r3 | EVALUATED | false | CAPABILITY_MISS | 0 / PASS | 210.655 | 47 |
| p3b-holdout-03-r1 | CANCELLED_BEFORE_LIVE | — | — | — | — | 0 |
| p3b-holdout-03-r1-retry1 | CANCELLED_BEFORE_LIVE | — | — | — | — | 0 |

01-r3的56模型为既有两个回合47+9；本轮补评不调用模型、不给该槽位重复扣Live。02各47模型，原单回合50上限不变。只列逐次结论，不汇总通过率，不诊断/修复覆盖率或成本。

本次续跑新增Live3/模型141/计费GET12（02体检4、03两次失败体检2、三次认证及后验6）。cumulative={"fullLive": 6, "evaluationPublicGET": 33, "realModelCalls": 1140, "environmentReruns": 0, "googleRequests": 15, "restaurantWebsiteRequests": 1460}；上限Live22/GET126/模型2500/环境重跑4。原batch SHA：a46deed4aa8e9f50d3b8e61ce4c405aec2ab6b88bc10aeab1303c059a47a2573。

全部停批输出逐字节复制到独立worktree，另加账本当前快照及本报告；外部私有原文、清单和补评文件本身未复制。原4256303d工作区不提交/不切换/不改文件，后续等待复核者决定，不自动补评或续跑。证据分支codex/heldout-run-evidence-02，发布SHA以交付回执/ls-remote为准。
