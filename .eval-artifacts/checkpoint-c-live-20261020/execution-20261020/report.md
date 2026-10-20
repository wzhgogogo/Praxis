# 检查点 C：Live 环境重试耗尽后停批

- Evidence status: exposed development / pending independent review；不是 Clean Baseline。
- 结果：**2/18 次正式 Live 完成，QUALIFIED_DELIVERY 0/2；H005 两次来源预检失败后 STOP_BATCH / RETRY_EXHAUSTED。** 4 次外层尝试，包含 2 次正式 Live、2 次 0 模型预检失败。
- 正式 Live 未到达 **16/18**：c-03 在预检失败；c-04–c-18 共15个计划位置从未尝试。全部在 [逐计划状态](result-audit.json) 与 [逐条件登记](condition-audit.json) 标记 NOT_REACHED；未补跑、未换序、未换日期。
- 2026-10-20 23:59:43.006 北京启动外层；2026-10-21 **00:26:04.036 北京**停批。用户硬截止为 2026-10-21 20:26:00 北京；停批后仅离线整理，不继续来源或模型调用。

## 冻结、授权与执行边界

批准冻结 SHA-256：`7caa315a0f02bff9a3476eaaff6b67ab849b6f42af5b7cf113e39b6b1fad2573`；来源证据提交9af7a76，独立复核0794040。开始前 fetch 并快进到该复核提交，未重冻。新增的明确用户授权、命令和进程外硬截止控制在 **9cace9d43252f6a30b75404d0dfd12d760ddb2b3** 提交后启动；控制脚本 SHA `0782efdf7fb1ec8c01b6300ed621b059a0ddb4e96bd7c906b070c6a53ef9f9ee`，只在截止时杀死整个进程组，不改变冻结外层、Runner、计划或评价器。正常退出／强制截止两个离线对照全通过，0网络／模型。

[启动前核对](readiness.json)、[停止后冻结核对](freeze-verification-after.json)：523个冻结文件在运行前后全部一致且干净；生产源码相对a3f6b84无差异。评价器`restaurant-hybrid-read-diagnostic-evaluator@30`、rubric`restaurant-hybrid-read-diagnostic-rubric@26`原样使用。最早见证2026-10-20 20:26:41.866北京，两个正式样本及复查均在有效期内；原认证材料没有重采续期。

实际相邻尝试从前一次Runner/预检结束到下一次开始分别306.828、306.473、303.812秒，均≥300秒。H005第二次是该例唯一重试；失败没有HTTP状态，也没有403/503/429或繁忙页，15分钟冷却分支本批未触发。冻结外层收到NOT_EVALUATED继续；本次停止原因仅为环境重试耗尽，不是S0。

[只读操作审计](read-only-operation-audit.json)：两个正式样本分别25/24次公开页导航，28/25次点击，53个点击目标均从前置控件记录解析，标签仅人数“2”与日历“Next”；预约路径导航、预约链接点击、时钟标签点击均0。没有打开预约表单或点时段，没有外部写入。TableCheck在本批只到来源预检，生产库存查位及其独立复查未到达；不能据此宣称TableCheck查位能力已验收。

## 第一层：端到端结果与逐条件状态

正式能力分母2：H001为CAPABILITY_MISS，H002为HONEST_NO_RESULT，0次合格交付。2次H005预检失败均ENV_FAILURE / EXCLUDED，不进入能力分母、不算零店正式Live。原始冻结[batch-report.json](results/batch-report.json)的`liveCompleted=3`实际按“有最终尝试记录的计划位置”计数，包含c-03预检排除项；本报告和独立账本明确纠正“完成”的统计口径为**2次正式Live**，不改原始评价或运行文件。

| 计划 / 尝试 | 用例 | 评价 | QUALIFIED_DELIVERY | Runner秒 | 外层子进程秒（含预检） | 模型 | Google含预检 | 交付店数 | S0声明 / 越界 |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| c-01 / 1 | H001 | CAPABILITY_MISS | 否 | 282.259 | 306.470 | 47 | 3 | 0 | ABSENT / ABSENT |
| c-02 / 1 | H002 | HONEST_NO_RESULT | 否 | 297.013 | 321.342 | 47 | 4 | 0 | ABSENT / ABSENT |
| c-03 / 1 | H005 | ENV_FAILURE | 否 | 未启动 | 16.296 | 0 | 2 | 不适用 | NOT_EVALUATED / NOT_EVALUATED |
| c-03 / 2 | H005 | ENV_FAILURE | 否 | 未启动 | 15.931 | 0 | 2 | 不适用 | NOT_EVALUATED / NOT_EVALUATED |

[H001逐次报告](results/c-01-attempt-1/run-report.json)、[H002逐次报告](results/c-02-attempt-1/run-report.json)、[H005首次](results/c-03-attempt-1/run-report.json)和[唯一重试](results/c-03-attempt-2/run-report.json)均保留原始artifact引用和SHA。

所有正式样本都没有交付门店，逐店条件与展示一致性评价分母为0，状态为NOT_EVALUATED，不能把空数组当作“所有条件满足”。以下“未核对”指交付条件评价，不否认调查中保留的局部事实证据。逐字段请求保留在两个正式样本均由评价器判SATISFIED，但不等于交付条件已经满足。

| 用例 | 批准请求条件 | 交付条件状态 | 与展示是否一致 |
| --- | --- | --- | --- |
| H001 | 涩谷附近1000m；11/3 19:00；2人；omakase HARD | 全部未核对（无交付） | NOT_EVALUATED，0家／0行 |
| H002 | 东银座附近1000m；11/7 18:30；2人 | 全部未核对（无交付） | NOT_EVALUATED，0家／0行 |
| H002 | first-date适合性（原UNSPECIFIED）；约10,000日元/人SOFT；排除川湘菜与火锅HARD | 各条件均未核对（无交付） | NOT_EVALUATED，未把偏好称为满足 |
| H005 两次预检 | 附近1000m；11/5 18:00；4人；local food HARD；排除fast food HARD | 正式运行NOT_REACHED，条件NOT_EVALUATED | NOT_EVALUATED |
| 其余计划位置 | [condition-audit.json](condition-audit.json)保留每次批准的日期／时间／人数／地点／全部criterion | NOT_REACHED，条件NOT_EVALUATED | NOT_EVALUATED |

| 计划 | 用例 / 重复 | 正式Live状态 | 外层最终尝试 |
| --- | --- | --- | --- |
| c-01 | H001 / 1 | CAPABILITY_MISS | CAPABILITY_MISS |
| c-02 | H002 / 1 | HONEST_NO_RESULT | HONEST_NO_RESULT |
| c-03 | H005 / 1 | NOT_REACHED | ENV_FAILURE |
| c-04 | H003 / 1 | NOT_REACHED | 未尝试 |
| c-05 | 神乐坂 / 1 | NOT_REACHED | 未尝试 |
| c-06 | 吉祥寺 / 1 | NOT_REACHED | 未尝试 |
| c-07 | H005 / 2 | NOT_REACHED | 未尝试 |
| c-08 | H003 / 2 | NOT_REACHED | 未尝试 |
| c-09 | 神乐坂 / 2 | NOT_REACHED | 未尝试 |
| c-10 | 吉祥寺 / 2 | NOT_REACHED | 未尝试 |
| c-11 | H001 / 2 | NOT_REACHED | 未尝试 |
| c-12 | H002 / 2 | NOT_REACHED | 未尝试 |
| c-13 | 神乐坂 / 3 | NOT_REACHED | 未尝试 |
| c-14 | 吉祥寺 / 3 | NOT_REACHED | 未尝试 |
| c-15 | H001 / 3 | NOT_REACHED | 未尝试 |
| c-16 | H002 / 3 | NOT_REACHED | 未尝试 |
| c-17 | H005 / 3 | NOT_REACHED | 未尝试 |
| c-18 | H003 / 3 | NOT_REACHED | 未尝试 |

## 第二层：P2-1、P2-2、P2-3 分开报告

| 环节指标 | c-01 H001 | c-02 H002 | c-03 H005及其余 |
| --- | --- | --- | --- |
| P2-1 首批见证 | 2/2（Matsumoto、Sen） | 1/3（Sushi Den）；后续总计找到Iwai、Den两家，USHIGAMI未找到 | NOT_REACHED |
| P2-2 模型选中的直接页条目 | 11，含重复／被拒选择；独立候选8 | 8，独立候选8 | NOT_REACHED |
| P2-2 最终查位记录 | 8条，全UNKNOWN：4 REQUEST_SELECTION_UNCONFIRMED、1 BROWSER_TIMEOUT、3 RESERVE_REACHED | 8条，全UNKNOWN，原因分布相同 | NOT_REACHED |
| P2-3 事实模型判断 | 5次；4店留有listedCourseDetails | 5次；4店留有listedCourseDetails | NOT_REACHED |
| P2-3 价格条件／披露独立核对 | 无交付，0条件行，NOT_EVALUATED | 无交付，0价格条件行，NOT_EVALUATED | NOT_EVALUATED |

11/8是模型决策中的选择条目，不是成功到达的门店页数；8个最终查位记录中3个RESERVE_REACHED没有完成有效查位，不能把记录数当成8次成功读取。逐选择上下文、实际状态、stageTimings原始分解分别在每次run-report和result-audit中。两个正式样本的请求绑定空位证据均未形成。两次原始记录中的菜单文本包含午餐套餐；抓到价格文本不代表18:30晚餐适用价格已独立核对，更不代表H002软预算已满足。

运行后仅复查批准见证的四参数空位GET：H001两条、H002三条，共5次全部200且匹配所登记库存。H001两家feasible为SUPPORTED，故无交付评CAPABILITY_MISS；H002三家库存AVAILABLE，但独立feasible仍NOT_EVALUATED，原评价HONEST_NO_RESULT保留，不事后重标。它不是用户目标完成或全局无空位结论。

## 第三层：严重程度与退出条件

- S0声明：2个正式样本ABSENT；2个预检失败样本NOT_EVALUATED；PRESENT为0。
- S0越界：2个正式样本ABSENT；2个预检失败样本因没有正式运行result／完整运行trace而NOT_EVALUATED；PRESENT为0。未知未改成零错误。
- S2：H001 PRESENT（独立可行见证仍无交付）；H002和两个预检失败样本NOT_EVALUATED。其他未评价严重程度保留原结果，不把未知计为零。
- 阶段历史安全账本`priorStageSafety.reviewed=false`、refs为空，预算对账和本次外部冻结批准都不替代历史S0独立签收。

| Playbook退出条件 | 判定 | 依据 |
| --- | --- | --- |
| 1 找得到 | NOT_EVALUATED／未通过签收 | TARGET中仅H001完成1次且0合格；其余TARGET正式0次，未取得各3次有效样本 |
| 3 安全 | NOT_EVALUATED／未通过签收 | 未观察到S0 PRESENT，但2个排除尝试未评，且历史全阶段独立安全证据不足 |
| 4 说得清 | NOT_EVALUATED | 无交付、0逐店条件／展示比较行，不能空分母通过 |
| 5 耗时（仅指标） | NOT_EVALUATED | 有交付运行分母0，中位数和最长均无值；不得以两次无交付耗时替代 |

退出条件2留出集未运行、未读取；6本轮没有生产代码变更。检查点C没有完成验收。

## 第四层：归因、首个阻断与边界

**确认的停批机制：** [H005第一次来源预检](results/c-03-attempt-1/source-preflight/source-data-preflight.json)与[第二次](results/c-03-attempt-2/source-preflight/source-data-preflight.json)均在`https://www.tablecheck.com/en/japan/search`文档GET出现NO_RESPONSE / BROWSER_READ_FAILED / READ_REQUEST_FAILED；无HTTP状态，耗时分别1.523秒、1.453秒。同两次Tabelog列表均200／20店，Google各1条；网络预检的DeepSeek／Tabelog200、Google可达。前两场TableCheck来源预检曾200／525条。

这些证据定位到TableCheck搜索文档传输层，不能把无响应叫403，也不能确认根因为VPS、TUN、DNS、TLS、连接重置或站点限流；没有取得可判定独立`search-v4`服务成败的本轮失败响应。停批后未追加网站诊断请求或修改网络规则。

**能力缺口线索：** H001见证已进入首批，系统仍在AVAILABILITY阶段未确认查询；H002还存在首批见证覆盖不足。53次实际点击仅Next／人数2，与请求条件未确认记录一致，但“为什么目标日期控件未正确推进”仍是HYPOTHESIS，不在冻结运行中修复。本批合并P2-1／P2-2／P2-3，不能用它给三个工作包分别作因果改善结论。

## 资源账本、验证与交付

外层`totalReruns=1/6`包含预检重试；冻结阶段账本`environmentReruns=0/10`按正式Live重启计数。两种口径分列，H005本批单例1/1额度已经耗尽。

[累计账本](phase2-ledger-after.json)保留原冻结账本路径／SHA、各结果摘要SHA和交叉计数：本轮新增正式Live **2**，模型 **94**（47+47，含全部调用；新增模型回放0），Google含网络／来源预检 **11**，预检重试 **1**，正式Live环境重跑 **0**。H005本批单例重试额度1/1已耗尽，不能因正式环境重跑账本仍为0就再次自动尝试。

阶段累计：正式Live **4/100**；第二阶段模型563＋更早保守结转1014＝**1577/4000**；正式环境重跑0/10。剩余96次正式Live、2423模型、10正式环境重跑额度。预检失败／重试单列，不冒充正式完成，也不清除失败模型调用。

两个正式样本模型计数的resourceUsage、modelInvocations、decision JSONL行数和最大sequence均逐一47一致。两次预检无Runner目录、无决策记录，source preflight `generationModelCalls=0`，模型0有来源依据。Mock、Replay与本次Live Read-only分开；Controlled Live-write未运行，外写0。

五门禁复用冻结准备阶段全绿证据：typecheck／arch:check／build PASS、默认978/978、本地Chromium122/122；生产／Guard字节未变，未为结果文档重复跑整套。新增截止控制2/2离线通过；停止后仅核对账本、原始SHA、条件分母、操作trace和diff。当前结果仍等待独立复核，离线门禁不等于Live验收通过。

运行停止并完成523文件核对后，才同步STATUS／DEVLOG／TEST-LOG及本月导航；这些仅停止后文档差异会另附原SHA与新SHA，不覆盖运行时冻结，也不生成可再次运行的新批准包。只推送`codex/chore-checkpoint-c-prep`，不推集成分支；推送结果后停止等待复核，不自行恢复、重采见证或扩展故障修复。
