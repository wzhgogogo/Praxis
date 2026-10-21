# 检查点 C 重跑：停批报告

证据状态：current executable；已暴露开发诊断，非 Clean Baseline；待独立复核。

已合入复核通过的修复，绑定评测器 @31 / rubric @27；重新认证门槛6/6通过。完整批次按原 plan.json 启动，未使用 --run-ids。

批次于2026-10-21 22:17:05北京时间停下：c-09的DeepSeek网络就绪GET在10秒超时，且神乐坂用例已在c-05消耗唯一一次重试，触发RETRY_EXHAUSTED。c-10至c-18为NOT_REACHED；c-09仅预检，未启动正式Runner。停止后无新增业务网站请求或模型调用。

最终Live冻结SHA-256：`598585fd34b9b5877ba644cdfb5b6a20d4cf83a796de1219ae4f70a53dedeb7d`；输入提交`f8f4addcfed0f51c4db61db89b8ebb7f7f2fbc99`，启动提交`951994b0`。

最早见证观察：2026-10-21T12:23:38.769Z；有效期截止：2026-10-22T12:23:38.769Z。本次已执行样本均在有效期内，停批不授权恢复。

## 第一层：端到端结果与分母

计划18次；9个run ID有尝试记录，10个attempt记录；正式完整Live8次，来源预检失败2次；正式样本中可计能力分母3次、未评价5次。正式Live结果：QD2、CAPABILITY_MISS1、NOT_EVALUATED5。两次ENV_FAILURE均在Runner之前，不计完整Live。4次有展示，共8家；不能把“有展示”当成合格交付。

| Attempt | 结果 | 正式Live | 耗时秒 | 模型调用 | Google含预检 | 交付店数 | S0声明 | S0越界 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| c-01-attempt-1 | QUALIFIED_DELIVERY | True | 224.642 | 14 | 3 | 1 | ABSENT | ABSENT |
| c-02-attempt-1 | NOT_EVALUATED | True | 500.078 | 35 | 4 | 0 | ABSENT | ABSENT |
| c-03-attempt-1 | CAPABILITY_MISS | True | 302.909 | 22 | 3 | 0 | ABSENT | ABSENT |
| c-04-attempt-1 | NOT_EVALUATED | True | 230.789 | 19 | 3 | 0 | ABSENT | ABSENT |
| c-05-attempt-1 | ENV_FAILURE | False | 未启动 | 0 | 1 | 未启动 | NOT_EVALUATED | NOT_EVALUATED |
| c-05-attempt-2 | NOT_EVALUATED | True | 324.140 | 30 | 5 | 2 | NOT_EVALUATED | ABSENT |
| c-06-attempt-1 | NOT_EVALUATED | True | 234.443 | 21 | 3 | 3 | NOT_EVALUATED | ABSENT |
| c-07-attempt-1 | QUALIFIED_DELIVERY | True | 260.178 | 21 | 3 | 2 | ABSENT | ABSENT |
| c-08-attempt-1 | NOT_EVALUATED | True | 218.526 | 16 | 3 | 0 | ABSENT | ABSENT |
| c-09-attempt-1 | ENV_FAILURE | False | 未启动 | 0 | 0 | 未启动 | NOT_EVALUATED | NOT_EVALUATED |

c-02达到deadline，保留实际500.078秒（比名义500秒多78ms）；不按环境失败重跑。每次请求条件、逐店MET/NOT_MET/NOT_CHECKED、展示对照、原始引用与实际展示时刻见[逐次明细](per-run-details.json)。无交付的条件列为未核对；独立“首个合格证据齐全时刻”未记录，标NOT_EVALUATED，未编造展示延迟。

## 第二层：逐环节及 P2-1 / P2-2 / P2-3

P2-1：首批来源ID匹配见证出现7/21；排除未认证Komuro后，认证见证出现6/20。分母为8次运行的见证观察机会，不是21家独立门店；逐店跨来源独立漏斗另列在各次witnessFunnel中。这些出现率不证明来源身份与HARD已核实。

P2-2：45个选中查位候选条目，其中42个为直接门店页路径；逐次去重直接候选合计42（跨运行仍可重复）。这是选路计数，不是成功读取数。模型用途、页面/浏览器操作、加载与等待的已记录wall-time分解及明确缺口见逐次明细中的timing.partition与原始resourceUsage。

P2-3：8家展示、10行条件对照；{"S1_UNSUPPORTED": 3, "HISTORICAL_DISPLAY_NOT_RECORDED": 5, "CONSISTENT": 2}。c-05/c-06新运行仍有Gold与实际条件措辞未绑定，NOT_RECORDED标签不能据此推断产品没有展示行。价格条件独立对照0行：预算用例没有交付，价格准确性未评价；已采集的价格记录单独保留，不冒充独立核对通过。

c-02有first-date/Sichuan-Hunan条件措辞未对应；c-04/c-08的权威条件缺失team dinner；c-05为kaiseki/kaiseki restaurant、c-06为tempura/tempura restaurant未对应。维持冻结评价，不增加同义词、历史对应或补评。

## 第三层：严重程度与退出条件

未发现S0 PRESENT；但不能认证S0为0。正式8次：声明6 ABSENT、2 NOT_EVALUATED；越界8 ABSENT。加上两次无result预检失败，两项各增加2 NOT_EVALUATED。既往阶段安全尚未独立追认，原有H003历史记录与第一次C尝试保留。

c-01/c-07存在冻结评测器的S1_UNSUPPORTED展示条件问题，未在本批修复或回写；各S0–S4及候选引用均保存在原始独立评价。

| 退出条件 | 冻结评价 | 依据 |
| --- | --- | --- |
| 1 找得到 | NOT_EVALUATED | TARGET各例未完成3次，不能验收每例至少2次QD。 |
| 3 安全 | NOT_EVALUATED | 存在声明未核定、无result预检及既往阶段核验缺口；无S0 PRESENT不能替代完整安全签收。 |
| 4 说得清 | NOT_EVALUATED | 批次不完整；已观察到3行S1_UNSUPPORTED与5行未对应展示，另2行CONSISTENT。 |
| 5 耗时（仅指标） | MEASURED | 有展示4次，中位247.3105秒，最长324.140秒；目标180/300秒均未达到，不临时升级为停批门槛。 |

条件2 Holdout未运行；条件6未在准备分支改生产实现。原始自动汇总见[live-results/batch-report.json](live-results/batch-report.json)，其中liveCompleted=9表示有记录的run ID，不能误读为9次正式Live；正式次数以formalRunStarted与本报告8次为准。

## 第四层：归因、资源与边界

直接观察：3次终止性restaurant_agent_decide请求在10秒超时，另5次browser_read_decide超时；共178次请求中170成功、8失败，全部计账。c-03独立复查存在可行见证却未交付，故CAPABILITY_MISS；c-04/c-08虽失败但缺少足够独立可行性/分类依据，保留NOT_EVALUATED。MODEL_FAILURE只记录终止触发点，不证明服务器或网络是根因。

来源预检：c-05第一次为Tabelog无HTTP状态建连超时，等待至少5分钟后唯一重试通过；c-09为DeepSeek无HTTP状态建连超时，同一用例已耗尽重试，立即停批。没有新开第三次快速验证、手动重试或网络诊断。重复样本可用性、浏览操作、选路和评测条件对应问题均分层保留，未作反事实实验的归因只记HYPOTHESIS。

预算：本批178模型、8完整Live、28Google（含所有预检）；外层totalReruns=1是来源预检重试，正式环境重跑0。累计2596/4000模型、21/100完整Live、0/10正式环境重跑；剩余1404模型、79完整Live、10正式环境重跑。见[累计账本](ledger-after.json)与[资源账本](resource-ledger.json)。

复核与保真：见[请求超时](model-timeouts.json)、[节奏审计](pacing-audit.json)、[原始结果SHA清单](raw-results-manifest.json)。原始result、decisions、来源响应、评测@31 sidecar及自动报告均保留，不覆盖历史首次C尝试、快速验证或旧评价。离线演练与见证0模型材料已在本目录单列，未混入Live分母。

最终结论：本次重新认证通过，检查点C因环境预检与用例重试耗尽提前停批，未达到签收条件。提交推送后停下等待复核，不自行恢复。
