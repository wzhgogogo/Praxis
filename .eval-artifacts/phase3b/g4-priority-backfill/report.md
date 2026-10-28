# G4 补页与生产路径验证

补页验证结果：既有接纳7/7正确，排序样本2/3正确，错认0。状态：NO_REGRESSION_PASS_IMPROVEMENT_RESULTS_MIXED。实际GET24/25、来源失败0，模型/Google/Live0；共享GET 242/257。

Evidence: frozen exposed regression, not clean holdout. Vienna CET UTC+1.

切片承诺：保持375aec6d的生产身份/排序和原评分函数，仅补充用户批准的公开详情原文。先7份既有接纳所需16页，再3份认证详情，再补用户异步明确批准的5页，使三份排序样本能完成同一生产路径。其余样本缺页不补。顺序24页预先冻结，GET<=25且共享<=257；失败也记账，>=30秒间隔（前一请求完成后起算），20秒超时，无Cookie，无跳转跟随，失败不重试。连续3次网络失败沿用停批保护。

补页不是真实整单Live。原文逐份保存并记录响应状态/类型/编码/Last-Modified/Location和SHA；补完后另行冻结实际采集数据，再离线运行原TabelogBrowserAvailability→片段响应Replay→详情→原身份核对。只把新增页并入冻结回放语料，不改检索、排序、身份和评分；Gold仅独立评分子进程读取。补页时间与原保存页时间分别记录，不伪装同一实时观察。

目标：7份既有接纳7/7正确；nr010/022/026完整路径是否正确，错认零容忍。来源失败如实保留并阻断通过，不计成退化；其他37家/前四复跑原结果不覆盖。新一轮完整41回放用于观察关联影响，但不补其余缺页。真实模型/Google/Live0，不加载.env。本轮不改产品源码，复用上一轮已复核的五门禁1190/175及G2 4/4；必要验证是新增响应SHA、完整回放、独立评分与账本/节奏核对。

完成后只推当前工作分支供复核；验证通过后申请与B的G3协调再合main，本轮不直接合入。

## 冻结与完整路径结果（2026-10-28T14:53:49.049647+01:00）

采集提交 `ca6bae802eb0dfd96e3920a03b8ebda27c896f6b`；原文及回放输入先冻结，再以提交 `67661956df80aa63adc84bf30ed1532bb450d620` 离线执行。生产源码与375aec6d逐字相同，排序与身份规则、原独立评分函数均未改；每案例原名→必要时旧模型响应Replay的一种替代→最多五个详情→原身份核对。模型0，不加载凭据。补页前的UNKNOWN与旧评测均保留，本次结果另存。

|组|案例|完整路径结论|已接纳来源|原因|执行/评分|
|---|---|---|---|---|---|
|priorSeven|main-nr-005|CORRECT_ACCEPTED|https://tabelog.com/en/tokyo/A1301/A130101/13131872/|HIGH_EXACT_PHONE|[执行](replay-execution/main-nr-005.json) / [评分](replay-evaluation/main-nr-005.json)|
|priorSeven|main-nr-006|CORRECT_ACCEPTED|https://tabelog.com/en/tokyo/A1309/A130905/13053749/|HIGH_EXACT_PHONE|[执行](replay-execution/main-nr-006.json) / [评分](replay-evaluation/main-nr-006.json)|
|priorSeven|main-nr-017|CORRECT_ACCEPTED|https://tabelog.com/en/tokyo/A1303/A130301/13261619/|HIGH_EXACT_PHONE|[执行](replay-execution/main-nr-017.json) / [评分](replay-evaluation/main-nr-017.json)|
|priorSeven|main-nr-030|CORRECT_ACCEPTED|https://tabelog.com/en/tokyo/A1303/A130301/13316574/|HIGH_EXACT_PHONE|[执行](replay-execution/main-nr-030.json) / [评分](replay-evaluation/main-nr-030.json)|
|priorSeven|main-G4-ND-001|CORRECT_ACCEPTED|https://tabelog.com/en/tokyo/A1323/A132305/13108466/|HIGH_EXACT_PHONE|[执行](replay-execution/main-G4-ND-001.json) / [评分](replay-evaluation/main-G4-ND-001.json)|
|priorSeven|main-G4-ND-007|CORRECT_ACCEPTED|https://tabelog.com/en/tokyo/A1309/A130905/13235582/|HIGH_EXACT_PHONE|[执行](replay-execution/main-G4-ND-007.json) / [评分](replay-evaluation/main-G4-ND-007.json)|
|priorSeven|rerun-nr-003|CORRECT_ACCEPTED|https://tabelog.com/en/tokyo/A1309/A130905/13021574/|HIGH_EXACT_PHONE|[执行](replay-execution/rerun-nr-003.json) / [评分](replay-evaluation/rerun-nr-003.json)|
|threeImproved|main-nr-010|NOT_ACCEPTED|—|ENTITY_MATCH_UNCERTAIN|[执行](replay-execution/main-nr-010.json) / [评分](replay-evaluation/main-nr-010.json)|
|threeImproved|main-nr-022|CORRECT_ACCEPTED|https://tabelog.com/en/tokyo/A1320/A132001/13282321/|HIGH_EXACT_PHONE|[执行](replay-execution/main-nr-022.json) / [评分](replay-evaluation/main-nr-022.json)|
|threeImproved|main-nr-026|CORRECT_ACCEPTED|https://tabelog.com/en/tokyo/A1301/A130101/13307478/|HIGH_EXACT_PHONE|[执行](replay-execution/main-nr-026.json) / [评分](replay-evaluation/main-nr-026.json)|

其余已确定接纳：{"planned": 23, "retainedInFiveDetailPlan": 23, "completeReplayCorrect": 23, "blockedByMissingSource": 0}。完整41案例分组回放见evaluation-summary.json；未在批准范围内的缺页继续如实保留，没有额外补采。网络/HTTP失败原件与Location只记录，不重试、不跟随；任何相关路径被阻断均不算通过，也不算身份退化。

nr-010：排序后已先读认证店详情，但原解析器在同店名称一致性检查处拒绝。JSON-LD原文名称为`Yakitori &amp; Obanzai SAKAMOTO`，可见店名为`Yakitori & Obanzai SAKAMOTO`；当前ownerKey没有统一此HTML实体表示，抛出`EXTRACTION_FAILED / SOURCE_IDENTITY_STRUCTURE_CHANGED`（堆栈定位readDetailIdentityFields第69行）。同一冻结原文的只读复现见nr010-diagnosis.json，未改输入、代码、规则或评分。这个未接纳不是网络失败，不报通过；本批不修复。

## 四层评价与边界

端到端只到Tabelog身份前缀：本轮7＋3为明确验收分母；不是Google实时检索、完整浏览器Agent或预约/库存任务。环节证据包含固定输入、原名/片段查询、全部候选详情顺序、实际读取原文、身份比较和终止。独立评分仍按先前认证rst_id与来源原文核对，非生产reason码自证。归因区分补页数据缺口、源网络失败和真实身份拒绝；不因结果调整代码或评分。

产品代码未改，复用上一已复核源码对应的五门禁1190/175及G2 4/4；本次不冒称重新跑产品门禁。必要检查是原文/输入SHA、逐次账本、间隔≥30秒、HTTP参数、产品原字节与完整生产前缀独立回放。只读复核：`python3 -B .eval-artifacts/phase3b/g4-priority-backfill/verify.py`。

当前仅推工作分支并停下复核；不退化验证已通过；三家排序样本为2正确、1未接纳。申请复核者依据这些结果确认是否可与B G3协调合main，以及nr010是否另开解析器修复切片；本轮不直接合入。
