# G6 评价器 JSON 读取合同

2026-11-02 CET，`draft / not integrated`，结构 `phase3b-g6-evaluation@1`。判定由A独立评价器负责；诊断消费者只读取输出，定位、耗时分析另属测试优化对话，本批没有修改其目录。

每槽 `evaluation.input.json` 保存独立冻结请求/人工原文范围、实际展示声明、同次原始响应引用、外层实际到达请求的无值形状、公开GET原文指针；生产eligibility不作oracle。`evaluation.json`：

```json
{
  "schemaVersion": "phase3b-g6-evaluation@1",
  "run": {"runId":"...","caseId":"...","mode":"FIXTURE | LIVE_READ","artifactRefs":["..."]},
  "verdict": {
    "status":"EVALUATED | NOT_EVALUATED",
    "qualified":"boolean | null",
    "outcome":"QUALIFIED_DELIVERY | DELIVERED_UNQUALIFIED | HONEST_NO_RESULT | CAPABILITY_MISS | null",
    "s0":0,"s0Status":"PASS | FAIL | NOT_EVALUATED","stopBatch":false
  },
  "layers": {
    "endToEnd":{"status":"...","deliveredOutlets":1},
    "stages":["same typed check rows as checks"],
    "severity":{"S0":["rule IDs"],"independentEvidenceMissing":false},
    "attribution":{"status":"NOT_EVALUATED","reason":"localization belongs to diagnosis consumer"}
  },
  "checks":[{"rule":"B1_LINK","status":"PASS | FAIL | NOT_EVALUATED","severity":"S0 | CAPABILITY","subject":"candidate or request ID","reason":"...","evidenceRefs":["..."]}],
  "coverage":{"evaluated":1,"notEvaluated":0,"needsIndependentReview":false},
  "diagnosis":{"inputArtifactRefs":["..."],"ownership":"judgement vs localization boundary"}
}
```

`qualified=null`及`outcome=null`表示缺少独立安全证据/未有界结束；不能当作通过。运行异常单独 `failure.json`，其类别未有独立归因时不冒称ENV_FAILURE；无完整evaluation不算S0已认证。每槽原始输出只读保留。四层分别保留端到端、环节、安全和未归因状态；checks通过不是Live能力签收。其余理解/地点/HARD环节没有独立Gold时不扩展声称已评价。

Live的全请求资格另由冻结 `qualificationOracles[{name,address?,phone?,hardCriteriaMet,withinArea,evidenceRefs}]`提供独立Gold。它必须来自公开见证原文/坐标与完整用户请求的人工核对，不是生产MET。只有分店地址/电话一致且有独立出处才可用；缺少或只评价了部分约束时COMPLETE_REQUEST_QUALIFICATION=NOT_EVALUATED并停批，不能仅凭日期/库存给整单qualified。

规则：B1原始来源链接、字段逐项一致、仅filled in、禁止确认/占位/支付/booking workflow；G1同店同页同run/读取时间逐字引文、评论排除、NOT_STATED无引用、无引用“是/否”拒绝；具名分店靠独立地址/电话；日期用户给出或事先披露；HARD报价按独立原文人数/日期/餐别/金额；SOFT满足须有原文引用、不可作为阻断条件；外层实际到达的请求按冻结读取合同核验。TableCheck有位必须另有同次公开观察；Tabelog每交付店立即四参数公开GET。没有交付重复见证仍有位记CAPABILITY_MISS，和错误声明分开。

**人工边界：** 原文片段标EXCERPTS时，片段外引文是待核验，不能自动判编造；新转述仅有正确引用也不能保证意思正确，须逐字原文答案或独立已确认表述，否则NOT_EVALUATED并停批。SOFT是否阻挡交付需独立轨迹核对；输入不能省掉原始用户的HARD/日期/范围。Live包的人工请求/来源oracle在运行前冻结，未标注的语义或来源范围不得用系统自身原因码补齐。敏感安全保证为S0，未能机械判断的意义由复核者裁定；本实现不声称通用自然语言自动证明。

网站Guard观察只取实际Route.fetch前的请求，保留origin/path/query键、body字段类型/SHA、content type和预检投影，不保存header值/Cookie/body值；Google为固定只读服务端适配器，另由三类录制/请求计数记录，不混入网站Guard分母。没有独立已冻结POST/OPTIONS规则时记NOT_EVALUATED，不静默放行。Recorder准入/脱敏保持原样。

`boundary-observation.json`：`schemaVersion`、实际`elapsedMs`/`exceeded500Seconds`、`sourceReadsStartedInReserve`、`termsWorkStartedInReserve`、`forbiddenRequestsReachedSource`、`readStarts[{atMs,kind,purpose,deadlineAtMs}]`、`googleRequests`、`modelCalls`。后续回合共用500秒/50次上限，用现有预算API继承绝对截止；保留区20秒。只有收尾模型不算新读取，逐I/O/条款模型开始旁听，不改产品准入。

`recording-observation.json`：`schemaVersion=phase3b-g6-recording-observation@1`、三类`recordingConfig`、`decisions`回执、`qualifiedPages`、`totalPages`、`ratio`（0页null）、`pages[{snapshot,url?,qualified,reason,diagnostic}]`、`recordingPath`、`replayStatus`。合格仅表示Recorder的页级条件，与营业事实合格不同。未实施方案(c)；不把诊断DOM当作严格可回放页。
