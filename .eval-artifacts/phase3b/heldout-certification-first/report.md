# 2026-11-09 首轮见证预认证（无 Live）

冻结运行SHA：4fdf866ed69b1a43a37a589d1f604f85fcb44772，执行前净树。三份用户私有文件均位于仓库外，初始SHA逐一与用户提供值相等；原文和清单只交给既有运行器，未人工打开、打印或复制。--validate-only承诺/逐字校验通过，另存仅哈希审计。只执行一次--certify-only，未运行正式held-out，未追加认证、重试、代码修改或模型调用。

时段按要求换算为维也纳CET（来源响应原值JST减8小时），无筛选/补造；来源原值另存time-lists.json。exists只判断清单指定时段，false不等于当天所有时段无位。null/未知不冒充无位。

| id | exists | HTTP | 全部列出时段（CET） |
|---|---|---|---|
| p3b-holdout-01 | none | 400 | 未知（清洗拒录） |
| p3b-holdout-02 | true | 200 | 09:00, 09:15, 09:30, 09:45, 10:00, 10:15, 10:30, 10:45, 11:00, 11:15, 11:30, 11:45, 12:00, 12:15, 12:30, 12:45, 13:00, 13:15, 13:30, 13:45, 14:00 |
| p3b-holdout-03 | false | 200 | 09:00, 09:15, 09:30, 09:45, 10:00, 10:15, 10:30, 10:45, 11:00, 11:15, 11:30, 11:45, 12:00, 12:15, 12:30 |
| p3b-holdout-04a | true | 200 | 10:00, 12:30 |
| p3b-holdout-04b | false | 200 | 12:30 |
| p3b-holdout-05 | false | 200 | 03:30, 03:45, 04:00, 04:15, 04:30, 04:45, 05:00, 05:15, 05:30 |

结果：2 true、3 false、1 null。01为HTTP400，响应SHA已保留、正文按既有清洗规则OMITTED；未查看未清洗响应，原因未进一步推断。其余5份正文SAVED。

账本认证GET6，cumulative={"fullLive": 0, "evaluationPublicGET": 6, "realModelCalls": 849, "environmentReruns": 0, "googleRequests": 0, "restaurantWebsiteRequests": 6}。5个记账间隔均>=5秒，无正式目录绑定。初始/运行后账本SHA、间隔与CET时间见ledger-summary.json；原响应SHA与记录状态见certificates.json。只提交运行器产物及派生摘要，不提交私有原文件、清单、凭据或完整私有账本。等待复核者决定最终清单；不自动再认证或启动Live。
