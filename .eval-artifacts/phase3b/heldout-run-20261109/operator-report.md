# 2026-11-09 CET held-out 停批原样报告

冻结main/SHA：4256303de2cf8cf1921420e3318db5ce443d3c6d。完整v3 SHA2a91aef4ba68520f0b66b56c288ada0751b3f4180d30b20977b0446e40e794cf，原文件/清单只以路径交运行器，没有人工读取或复制。运行期间未改代码/输入/账本规则，未操作浏览器或手动干预。

**原始stopReason：INDEPENDENT_EVIDENCE_REVIEW_REQUIRED。** 01-r3的独立判定NOT_EVALUATED、qualified=null、outcome=null、s0=0、s0Status=NOT_EVALUATED、stopBatch=true；不能把S0计数0当作安全证据齐全。未进入02或后续用例，不补评、不继续运行、不汇总通过率。

| receipt key | status | qualified | outcome | s0 / s0Status | 秒 | 模型 |
|---|---|---|---|---|---|---|
| p3b-holdout-01-r1 | CANCELLED_BEFORE_LIVE | — | — | — | — | 0 |
| p3b-holdout-01-r1-retry1 | EVALUATED | false | CAPABILITY_MISS | 0 / PASS | 235.962 | 47 |
| p3b-holdout-01-r2 | EVALUATED | false | CAPABILITY_MISS | 0 / PASS | 212.053 | 47 |
| p3b-holdout-01-r3 | STOPPED | none | — | 0 / NOT_EVALUATED | 252.487 | 56 |

01-r3模型56为两个用户回合47+9，各回合均未超过50；相应回合用时211.134/40.835秒。未变化的独立缺证项：COMPLETE_REQUEST_QUALIFICATION / NOT_EVALUATED / S0，reason原文："Need independent same-outlet evidence for all HARD/area requirements from the complete frozen request; partial mechanical checks cannot certify delivery"，evidenceRefs=[]。只报告缺证，不判定是产品错误还是标注缺口，不自行补齐。

首轮体检TableCheck第一轮10.002秒未完成，CANCELLED_BEFORE_LIVE，无Live/模型消耗。等待45秒后按用户例外执行唯一一次--resume；恢复体检两来源两轮均HTTP200且<10秒，原目录保留，继续完成上述槽位。健康续跑已用1/2，环境重跑0；本次是证据停批，不适用体检例外，不继续resume。

batch.witnessPolicies已标05为ALLOW_KNOWN_UNAVAILABLE；05尚未运行，没有实际认证模式/成绩。已经运行的三个槽位均STANDARD_G6、witnessExists=true。

正式运行新增Live3、模型150、计费GET11（体检5 + 每次认证/后验共6）；本轮预认证另1GET。账本cumulative={"fullLive": 3, "evaluationPublicGET": 21, "realModelCalls": 999, "environmentReruns": 0, "googleRequests": 9, "restaurantWebsiteRequests": 789}；上限Live22/GET126/模型2500/环境重跑4。认证累计10/12。数据均见operator-report.json，不生成通过率。

原batch.json及原评价/录制不覆盖，batch SHA256：eb90b2b221c8c9ce33683530d9dbc483cc2d74d30e3f98725018e3072a89e906。本次原始/清洗运行输出保留在本地忽略目录；不提交或切换SHA，以便复核后按同一冻结SHA续跑。按“其他任何停下原样报告等待、全部跑完后提交推送输出”的指示，当前main保持4256303d净树；未改STATUS或历史源码文档。等待复核者提供决定/补充注释，不再发起任何来源或模型调用。
