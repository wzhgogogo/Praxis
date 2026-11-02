# 运行诊断 0626c034-d867-47bd-bf82-b6cda149cce8

结果：QUALIFIED_DELIVERY；是否交付：YES（原结果类型）；用户目标：YES。
首点：无确认偏离 / — / —；之前仍有未评：true。

- 首个确认偏离：无已确认记录／未评不代表通过
- 见证覆盖观察：无已确认记录／未评不代表通过
- 推测瓶颈：无记录；确定性始终HYPOTHESIS

| 环节 | 到达 | 判断 | 证据 |
| --- | --- | --- | --- |
| 理解请求 (UNDERSTANDING) | 到达 | 通过 | [引用](#stage-evidence-UNDERSTANDING) |
| 地点 (LOCATION) | 到达 | 未评 | [引用](#stage-evidence-LOCATION) |
| 发现 (DISCOVERY) | 到达 | 未评 | [引用](#stage-evidence-DISCOVERY) |
| 身份 (IDENTITY) | 到达 | 未评 | [引用](#stage-evidence-IDENTITY) |
| 事实/HARD (FACTS_HARD) | 到达 | 未评 | [引用](#stage-evidence-FACTS_HARD) |
| 查位 (AVAILABILITY) | 到达 | 未评 | [引用](#stage-evidence-AVAILABILITY) |
| 展示 (PRESENTATION) | 到达 | 通过 | [引用](#stage-evidence-PRESENTATION) |
| 选店 (SELECTION) | 未评 | 未评 | 无记录 |
| B1交接 (B1_HANDOFF) | 未评 | 未评 | 无记录 |
| 卡片条款 (CARD_TERMS) | 未评 | 未评 | 无记录 |
| 追问取页 (QUESTION_PAGE) | 未评 | 未评 | 无记录 |
| 追问作答 (QUESTION_ANSWER) | 未评 | 未评 | 无记录 |
| 结束 (ENDING) | 到达 | 通过 | [引用](#stage-evidence-ENDING) |

关键耗时：证据齐全 208.105秒；服务端展示 247.079秒；两者之差 38.974秒。
未评记录：15条（环节/评价器清单）；体验缺项单列在附录，不按0计算。

只定位和度量，不重新判定；CET（UTC+1）。RUN_START_PROXY和服务端投影不等于用户发送和屏幕渲染。

## 见证漏斗

| 店名 | 发现 | 身份 | 事实 | 查位 | 展示 | 可行性 |
| --- | --- | --- | --- | --- | --- | --- |
| Nakameguro Yakiniku Togyu Mon | NOT_FOUND | NOT_EVALUATED | NOT_EVALUATED | 记录：无读取记录；见证：NOT_EVALUATED | NO | NOT_EVALUATED |
| Nakameguro Sumibiyaki Horumon Manten Koukashita | NOT_FOUND | NOT_EVALUATED | NOT_EVALUATED | 记录：无读取记录；见证：NOT_EVALUATED | NO | NOT_EVALUATED |
| Nakameguro Nakasei | NOT_FOUND | NOT_EVALUATED | NOT_EVALUATED | 记录：无读取记录；见证：NOT_EVALUATED | NO | NOT_EVALUATED |

## 其他体验观察（无门槛）

追问：多余 未评（NOT_EVALUATED）；缺失 未评（NOT_EVALUATED）。排序：不适用。

拒绝动作：0；最长连续无新观察：1。

## 附录

### 严重程度原记录

```json
{
  "S0": {
    "status": "NOT_EVALUATED",
    "reasons": [
      "Actual displayed claim has independent candidate/request/source support; unclaimed preferences are assessed separately.",
      "EVIDENCE_GAP: POST https://production.tablecheck.com//v2/hub/availability_calendar_v2: missing raw POST body inspection (all field names/types), request body SHA-256, content-type",
      "EVIDENCE_GAP: GET https://www.tablecheck.com//en/shops/yakiniku-champion-nat/reserve: missing original start_date/pax query values",
      "EVIDENCE_GAP: GET https://www.tablecheck.com//en/shops/ebisu-ushimitsu/reserve: missing original start_date/pax query values",
      "EVIDENCE_GAP: GET https://www.tablecheck.com//en/shops/ushimitsu-ebisuhonten/reserve: missing original start_date/pax query values",
      "EVIDENCE_GAP: GET https://www.tablecheck.com//en/shops/yakiniku-champion-honten/reserve: missing original start_date/pax query values"
    ],
    "evidenceRefs": [
      "loop",
      "finalSnapshot.domainState.presentedResults",
      "finalSnapshot.domainState.availability",
      "finalSnapshot.domainState.readEvidence",
      ".eval-artifacts/p1-f-20261011/continuation-20261011-part1/reviewed-reads.json#sha256=ea386ace126bfc2fdaff2aeb99f9c328cef7ce5d50ee9e418ee90f2956ffcfae",
      "docs/decisions/0036-generic-public-read-network-policy.md",
      "docs/decisions/0035-browser-read-network-boundary.md"
    ]
  },
  "S1": {
    "status": "NOT_EVALUATED",
    "reasons": [
      "No independently established unmet user-need conclusion."
    ],
    "evidenceRefs": []
  },
  "S2": {
    "status": "NOT_EVALUATED",
    "reasons": [
      "No valid independent feasible witness supplied."
    ],
    "evidenceRefs": []
  },
  "S3": {
    "status": "NOT_EVALUATED",
    "reasons": [
      "Experience/latency thresholds belong to E2; not scored here."
    ],
    "evidenceRefs": []
  },
  "S4": {
    "status": "NOT_EVALUATED",
    "reasons": [
      "User-invisible retry effects are not independently established."
    ],
    "evidenceRefs": []
  },
  "S0_DECLARATION": {
    "status": "ABSENT",
    "reasons": [
      "Actual displayed claim has independent candidate/request/source support; unclaimed preferences are assessed separately."
    ],
    "evidenceRefs": [
      "loop",
      "finalSnapshot.domainState.presentedResults",
      "finalSnapshot.domainState.availability",
      "finalSnapshot.domainState.readEvidence"
    ]
  },
  "S0_BOUNDARY": {
    "status": "NOT_EVALUATED",
    "reasons": [
      "EVIDENCE_GAP: POST https://production.tablecheck.com//v2/hub/availability_calendar_v2: missing raw POST body inspection (all field names/types), request body SHA-256, content-type",
      "EVIDENCE_GAP: GET https://www.tablecheck.com//en/shops/yakiniku-champion-nat/reserve: missing original start_date/pax query values",
      "EVIDENCE_GAP: GET https://www.tablecheck.com//en/shops/ebisu-ushimitsu/reserve: missing original start_date/pax query values",
      "EVIDENCE_GAP: GET https://www.tablecheck.com//en/shops/ushimitsu-ebisuhonten/reserve: missing original start_date/pax query values",
      "EVIDENCE_GAP: GET https://www.tablecheck.com//en/shops/yakiniku-champion-honten/reserve: missing original start_date/pax query values"
    ],
    "evidenceRefs": [
      ".eval-artifacts/p1-f-20261011/continuation-20261011-part1/reviewed-reads.json#sha256=ea386ace126bfc2fdaff2aeb99f9c328cef7ce5d50ee9e418ee90f2956ffcfae",
      "docs/decisions/0036-generic-public-read-network-policy.md",
      "docs/decisions/0035-browser-read-network-boundary.md"
    ],
    "gaps": [
      {
        "kind": "EVIDENCE_GAP",
        "request": "POST https://production.tablecheck.com//v2/hub/availability_calendar_v2",
        "missing": [
          "raw POST body inspection (all field names/types)",
          "request body SHA-256",
          "content-type"
        ],
        "evidenceRefs": [
          "browserTrace.networkRequests[1384]"
        ]
      },
      {
        "kind": "EVIDENCE_GAP",
        "request": "GET https://www.tablecheck.com//en/shops/yakiniku-champion-nat/reserve",
        "missing": [
          "original start_date/pax query values"
        ],
        "evidenceRefs": [
          "browserTrace.networkRequests[2106]"
        ]
      },
      {
        "kind": "EVIDENCE_GAP",
        "request": "GET https://www.tablecheck.com//en/shops/ebisu-ushimitsu/reserve",
        "missing": [
          "original start_date/pax query values"
        ],
        "evidenceRefs": [
          "browserTrace.networkRequests[2570]"
        ]
      },
      {
        "kind": "EVIDENCE_GAP",
        "request": "GET https://www.tablecheck.com//en/shops/ushimitsu-ebisuhonten/reserve",
        "missing": [
          "original start_date/pax query values"
        ],
        "evidenceRefs": [
          "browserTrace.networkRequests[3567]"
        ]
      },
      {
        "kind": "EVIDENCE_GAP",
        "request": "GET https://www.tablecheck.com//en/shops/yakiniku-champion-honten/reserve",
        "missing": [
          "original start_date/pax query values"
        ],
        "evidenceRefs": [
          "browserTrace.networkRequests[3842]"
        ]
      }
    ]
  }
}
```

### 结果、执行与输入原记录

```json
{
  "outcome": {
    "type": "QUALIFIED_DELIVERY",
    "reasons": [
      "Actual terminal presentation is supported by frozen request and candidate-bound original observations."
    ],
    "evidenceRefs": [
      "loop",
      "finalSnapshot.domainState.presentedResults",
      "finalSnapshot.domainState.availability",
      "finalSnapshot.domainState.readEvidence"
    ],
    "capabilityDenominator": "INCLUDED",
    "userGoalComplete": "YES"
  },
  "execution": {
    "status": "SUCCEEDED",
    "stage": "AGENT_LOOP",
    "taskProducedQualifiedResult": "YES",
    "systemBehavior": "NOT_EVALUATED",
    "externalConditions": "OBSERVED",
    "evidenceSufficiency": "SUFFICIENT_FOR_PRESENTED_RESULT",
    "completion": "PRESENTATION_RECORDED"
  },
  "evaluationFailure": null,
  "inputs": {
    "artifact": {
      "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz",
      "sha256": "777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5"
    },
    "evaluation": {
      "path": ".eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-nakameguro-a1.evaluation.29.f940f777-2864-4c1e-956f-028f89f4f8d6.json",
      "sha256": "f25b3668cc2e9a7ed3c5437a791b57a9662015bf07416f4ded7cacfa96ff1fac"
    }
  },
  "evaluationMetadata": {
    "evaluatorVersion": "restaurant-hybrid-read-diagnostic-evaluator@29",
    "rubricVersion": "restaurant-hybrid-read-diagnostic-rubric@25",
    "goldCorrection": {
      "applied": true,
      "artifactSha256": "777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5",
      "rev1Sha256": "447aaf3992014be8bb29736c179cb511aff31d0a69fad022f1c659ac5760ff27",
      "rev2Sha256": "1879c3189f90134f2ddb4cc78b12fcc31a0cd68e7b806a2baec43270e6f9f753",
      "refs": [
        ".eval-artifacts/e1-evaluator-20261016/gold-corrections.json#sha256=5a755634a5337a95705185c0d413dc061554871ba0ec3b552cb270dbab4e1f9f",
        ".eval-artifacts/p1-f-20261011/variants.yaml#sha256=447aaf3992014be8bb29736c179cb511aff31d0a69fad022f1c659ac5760ff27",
        ".eval-artifacts/p1-f-20261011/variants.rev2.yaml#sha256=1879c3189f90134f2ddb4cc78b12fcc31a0cd68e7b806a2baec43270e6f9f753"
      ]
    },
    "mode": "HYBRID_LIVE_READ"
  }
}
```

### 首个确认偏离

无记录。

### 见证覆盖观察

无记录。

### 推测瓶颈

无记录。

### 环节证据

<a id="stage-evidence-UNDERSTANDING"></a>

理解请求：.eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/materializedCase (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/events/0 (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5); .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-nakameguro-a1.evaluation.29.f940f777-2864-4c1e-956f-028f89f4f8d6.json#/findings/0 (sha256=f25b3668cc2e9a7ed3c5437a791b57a9662015bf07416f4ded7cacfa96ff1fac)

<a id="stage-evidence-LOCATION"></a>

地点：.eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/finalSnapshot/domainState/searchContinuation/locationContext (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5)

<a id="stage-evidence-DISCOVERY"></a>

发现：.eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/finalSnapshot/domainState/candidates (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/events/1 (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/events/2 (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5)

<a id="stage-evidence-IDENTITY"></a>

身份：.eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/6 (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/7 (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/8 (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/10 (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/11 (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/12 (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/15 (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/18 (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/21 (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/24 (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5)

<a id="stage-evidence-FACTS_HARD"></a>

事实/HARD：.eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/13 (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/14 (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/16 (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/17 (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/19 (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/20 (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/22 (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/23 (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/25 (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/26 (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5)

<a id="stage-evidence-AVAILABILITY"></a>

查位：.eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/9 (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/finalSnapshot/domainState/availabilityChecks (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/events/3 (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/events/4 (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5)

<a id="stage-evidence-PRESENTATION"></a>

展示：.eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/finalSnapshot/domainState/presentedResults (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/events/7 (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5); .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-nakameguro-a1.evaluation.29.f940f777-2864-4c1e-956f-028f89f4f8d6.json#/findings/3 (sha256=f25b3668cc2e9a7ed3c5437a791b57a9662015bf07416f4ded7cacfa96ff1fac)

<a id="stage-evidence-SELECTION"></a>

选店：无记录

<a id="stage-evidence-B1_HANDOFF"></a>

B1交接：无记录

<a id="stage-evidence-CARD_TERMS"></a>

卡片条款：无记录

<a id="stage-evidence-QUESTION_PAGE"></a>

追问取页：无记录

<a id="stage-evidence-QUESTION_ANSWER"></a>

追问作答：无记录

<a id="stage-evidence-ENDING"></a>

结束：.eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/status (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz#/loop (sha256=777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5); .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-nakameguro-a1.evaluation.29.f940f777-2864-4c1e-956f-028f89f4f8d6.json#/findings/4 (sha256=f25b3668cc2e9a7ed3c5437a791b57a9662015bf07416f4ded7cacfa96ff1fac)

### 下游明确阻断与未定位判断

```json
{
  "downstreamBlocked": [],
  "unlocatedFindings": [
    {
      "finding": {
        "dimension": "RESOURCES",
        "status": "NOT_EVALUATED",
        "stage": "RUN_ACCOUNTING",
        "requirement": "Compare readable usage to recorded effective executor limits and declared run ceilings separately. Missing effectiveLimits is not budget compliance.",
        "observations": [
          "NOT_EVALUATED=diagnostics.browserExecution[*].effectiveLimits / browserTrace.EXECUTOR_DIAGNOSTIC.effectiveLimits missing; no actual limit compliance inferred from runCeilings."
        ],
        "directCause": "Actual executor limits or required accounting is missing; declarations alone cannot prove enforcement.",
        "rootCauseHypothesis": "Historical artifact or interrupted execution lacks complete accounting.",
        "certainty": "UNKNOWN",
        "evidenceRefs": [
          "resourceUsage",
          "runCeilings",
          "modelInvocations"
        ],
        "downstreamImpact": "Do not infer limit compliance or a stopping cause."
      },
      "ref": {
        "path": ".eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-nakameguro-a1.evaluation.29.f940f777-2864-4c1e-956f-028f89f4f8d6.json",
        "sha256": "f25b3668cc2e9a7ed3c5437a791b57a9662015bf07416f4ded7cacfa96ff1fac",
        "pointer": "/findings/5"
      }
    }
  ]
}
```

### 见证漏斗原始JSON

```json
[
  {
    "outletName": "Nakameguro Yakiniku Togyu Mon",
    "sourceId": "13290371",
    "discovery": {
      "status": "NOT_FOUND",
      "candidateIds": [],
      "possibleCandidateIds": [],
      "basis": "Cross-source name AND address; no phone or production eligibility oracle"
    },
    "identity": {
      "status": "NOT_EVALUATED",
      "evidenceIds": []
    },
    "facts": {
      "status": "NOT_EVALUATED",
      "evidenceIds": []
    },
    "availability": {
      "recorded": [],
      "witness": "NOT_EVALUATED",
      "observedAt": null,
      "reason": "Registered witness has no raw recheck observation; old roster slot text is not current inventory."
    },
    "presented": "NO",
    "feasible": "NOT_EVALUATED",
    "blocker": {
      "stage": "NOT_EVALUATED",
      "certainty": "HYPOTHESIS",
      "reason": "Independent discovery/identity/availability Gold is incomplete; do not label an unknown stage as a confirmed bottleneck"
    },
    "evidenceRefs": [
      ".eval-artifacts/p1-f-20261011/continuation-20261011-part1/p1f-novel-nakameguro-yakiniku-20261023/attempt-1.finish.json#sha256=43a612a48d9aa5fc5bb49f0126b00526aabc707991355f55e442040d0d5003e6",
      ".eval-artifacts/p1-f-20261011/witnesses.p1f-20261011.json#sha256=1900217333acc30cef9026abe9da1199bbd62188d48773cb9f97b6c7f5856377",
      "/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/e1-evaluator-20261016/witness-inputs.json#sha256=5fc5af629ff2550bf1be538abf029537003ac75d8bedd9f9fbcc0e6900a4d91e",
      "materializedCase.acceptance.required_claims"
    ]
  },
  {
    "outletName": "Nakameguro Sumibiyaki Horumon Manten Koukashita",
    "sourceId": "13241250",
    "discovery": {
      "status": "NOT_FOUND",
      "candidateIds": [],
      "possibleCandidateIds": [],
      "basis": "Cross-source name AND address; no phone or production eligibility oracle"
    },
    "identity": {
      "status": "NOT_EVALUATED",
      "evidenceIds": []
    },
    "facts": {
      "status": "NOT_EVALUATED",
      "evidenceIds": []
    },
    "availability": {
      "recorded": [],
      "witness": "NOT_EVALUATED",
      "observedAt": null,
      "reason": "Registered witness has no raw recheck observation; old roster slot text is not current inventory."
    },
    "presented": "NO",
    "feasible": "NOT_EVALUATED",
    "blocker": {
      "stage": "NOT_EVALUATED",
      "certainty": "HYPOTHESIS",
      "reason": "Independent discovery/identity/availability Gold is incomplete; do not label an unknown stage as a confirmed bottleneck"
    },
    "evidenceRefs": [
      ".eval-artifacts/p1-f-20261011/continuation-20261011-part1/p1f-novel-nakameguro-yakiniku-20261023/attempt-1.finish.json#sha256=43a612a48d9aa5fc5bb49f0126b00526aabc707991355f55e442040d0d5003e6",
      ".eval-artifacts/p1-f-20261011/witnesses.p1f-20261011.json#sha256=1900217333acc30cef9026abe9da1199bbd62188d48773cb9f97b6c7f5856377",
      "/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/e1-evaluator-20261016/witness-inputs.json#sha256=5fc5af629ff2550bf1be538abf029537003ac75d8bedd9f9fbcc0e6900a4d91e",
      "materializedCase.acceptance.required_claims"
    ]
  },
  {
    "outletName": "Nakameguro Nakasei",
    "sourceId": "13305906",
    "discovery": {
      "status": "NOT_FOUND",
      "candidateIds": [],
      "possibleCandidateIds": [],
      "basis": "Cross-source name AND address; no phone or production eligibility oracle"
    },
    "identity": {
      "status": "NOT_EVALUATED",
      "evidenceIds": []
    },
    "facts": {
      "status": "NOT_EVALUATED",
      "evidenceIds": []
    },
    "availability": {
      "recorded": [],
      "witness": "NOT_EVALUATED",
      "observedAt": null,
      "reason": "Registered witness has no raw recheck observation; old roster slot text is not current inventory."
    },
    "presented": "NO",
    "feasible": "NOT_EVALUATED",
    "blocker": {
      "stage": "NOT_EVALUATED",
      "certainty": "HYPOTHESIS",
      "reason": "Independent discovery/identity/availability Gold is incomplete; do not label an unknown stage as a confirmed bottleneck"
    },
    "evidenceRefs": [
      ".eval-artifacts/p1-f-20261011/continuation-20261011-part1/p1f-novel-nakameguro-yakiniku-20261023/attempt-1.finish.json#sha256=43a612a48d9aa5fc5bb49f0126b00526aabc707991355f55e442040d0d5003e6",
      ".eval-artifacts/p1-f-20261011/witnesses.p1f-20261011.json#sha256=1900217333acc30cef9026abe9da1199bbd62188d48773cb9f97b6c7f5856377",
      "/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/e1-evaluator-20261016/witness-inputs.json#sha256=5fc5af629ff2550bf1be538abf029537003ac75d8bedd9f9fbcc0e6900a4d91e",
      "materializedCase.acceptance.required_claims"
    ]
  }
]
```

### 条件明细

| 展示候选 | 条件 | 强度 | 原评测状态 | 支持来源类型 |
| --- | --- | --- | --- | --- |
| tablecheck:kintan-daikanyama-yakiniku | yakiniku | HARD | NOT_CHECKED | 未评 |

```json
[
  {
    "candidateId": "tablecheck:kintan-daikanyama-yakiniku",
    "criteria": [
      {
        "text": "yakiniku",
        "polarity": "POSITIVE",
        "strength": "HARD",
        "evidenceRefs": [
          "materializedCase.semantic.criteria[0]"
        ],
        "status": "NOT_CHECKED",
        "basis": [
          "No applicable independent explicit source statement or external observation establishes this condition; linked model judgments alone do not establish its free-text semantics."
        ]
      }
    ]
  }
]
```

### 完整体验、耗时分解、引用与已有资源诊断

```json
{
  "experience": {
    "gateEffect": "NONE",
    "timing": {
      "startBasis": "RUN_START_PROXY",
      "absoluteTimesCET": {
        "runStart": "2026-10-11T16:46:51.997+01:00",
        "observationComplete": "2026-10-11T16:50:20.102+01:00",
        "serverPresentation": "2026-10-11T16:50:59.076+01:00"
      },
      "elapsed": {
        "status": "MEASURED",
        "value": 247394,
        "basis": "RECORDED_RUN_ELAPSED",
        "refs": [
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz",
            "sha256": "777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5",
            "pointer": "/startedAt"
          },
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz",
            "sha256": "777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5",
            "pointer": "/finishedAt"
          }
        ],
        "missing": []
      },
      "firstSupportedObservationComplete": {
        "status": "MEASURED",
        "value": 208105,
        "basis": "FINAL_CITED_SUPPORTED_SOURCE_OBSERVATION; NOT_STATE_ACCEPTANCE",
        "refs": [
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz",
            "sha256": "777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5",
            "pointer": "/finalSnapshot/domainState/readEvidence"
          },
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz",
            "sha256": "777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5",
            "pointer": "/finalSnapshot/domainState/presentedResults/evidenceIds"
          }
        ],
        "missing": []
      },
      "firstServerPresentation": {
        "status": "MEASURED",
        "value": 247079,
        "basis": "RUN_START_PROXY_TO_SERVER_PRESENTATION",
        "refs": [
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz",
            "sha256": "777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5",
            "pointer": "/startedAt"
          },
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz",
            "sha256": "777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5",
            "pointer": "/finalSnapshot/domainState/presentedResults/presentedAt"
          }
        ],
        "missing": []
      },
      "observationToPresentation": {
        "status": "MEASURED",
        "value": 38974,
        "basis": "OBSERVATION_TO_SERVER_PRESENTATION",
        "refs": [
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz",
            "sha256": "777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5",
            "pointer": "/finalSnapshot/domainState/readEvidence"
          },
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz",
            "sha256": "777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5",
            "pointer": "/finalSnapshot/domainState/presentedResults/evidenceIds"
          },
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz",
            "sha256": "777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5",
            "pointer": "/startedAt"
          },
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz",
            "sha256": "777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5",
            "pointer": "/finalSnapshot/domainState/presentedResults/presentedAt"
          }
        ],
        "missing": []
      },
      "acceptanceEvents": [
        {
          "type": "AVAILABILITY_CHECKED",
          "elapsedMs": 164296,
          "ref": {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz",
            "sha256": "777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5",
            "pointer": "/events/3"
          }
        },
        {
          "type": "AVAILABILITY_CHECKED",
          "elapsedMs": 196856,
          "ref": {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz",
            "sha256": "777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5",
            "pointer": "/events/4"
          }
        }
      ],
      "uiVisible": {
        "status": "NOT_EVALUATED",
        "value": null,
        "basis": "UI_VISIBLE",
        "refs": [],
        "missing": [
          "No client render acknowledgement."
        ]
      },
      "turnResponses": [
        {
          "userMessageId": null,
          "metric": {
            "status": "NOT_EVALUATED",
            "value": null,
            "basis": "USER_TO_ASSOCIATED_ASSISTANT_WALL_TIME",
            "refs": [],
            "missing": [
              "Conversation messages are not present in this artifact."
            ]
          }
        }
      ],
      "stageBreakdown": {
        "schemaVersion": "restaurant-stage-timings@1",
        "status": "MEASURED_WITH_EXPLICIT_GAPS",
        "elapsedMs": 247394,
        "method": "Observed wall-time partition; model intervals override nested action/trace intervals. This is not a dependency-DAG critical-path proof.",
        "criticalPath": [
          {
            "stage": "DISCOVERY:DIRECTORY:SEARCH",
            "elapsedMs": 41885,
            "percent": 16.93048335852931
          },
          {
            "stage": "DISCOVERY:VENUE_SEARCH:DETAIL",
            "elapsedMs": 23262,
            "percent": 9.402814942965472
          },
          {
            "stage": "AVAILABILITY:TABLECHECK:tablecheck:ebisu-ushimitsu:REQUEST_AND_RESULT",
            "elapsedMs": 21802,
            "percent": 8.812663201209407
          },
          {
            "stage": "AVAILABILITY:TABLECHECK:tablecheck:yakiniku-champion-nat:REQUEST_AND_RESULT",
            "elapsedMs": 16447,
            "percent": 6.648099792234249
          },
          {
            "stage": "AVAILABILITY:TABLECHECK:tablecheck:yakiniku-champion-honten:REQUEST_AND_RESULT",
            "elapsedMs": 12612,
            "percent": 5.097940936320202
          },
          {
            "stage": "DISCOVERY:VENUE_SEARCH:SEARCH",
            "elapsedMs": 12544,
            "percent": 5.0704544168411525
          },
          {
            "stage": "DISCOVERY:DIRECTORY:REGION_OR_HOME",
            "elapsedMs": 12522,
            "percent": 5.061561719362636
          },
          {
            "stage": "UNATTRIBUTED",
            "elapsedMs": 12095,
            "percent": 4.888962545575075
          },
          {
            "stage": "AVAILABILITY:TABLECHECK:tablecheck:kintan-daikanyama-yakiniku:REQUEST_AND_RESULT",
            "elapsedMs": 11236,
            "percent": 4.541743130391198
          },
          {
            "stage": "FACTS:TABLECHECK:tablecheck:yakiniku-champion-nat",
            "elapsedMs": 9866,
            "percent": 3.9879706055926984
          },
          {
            "stage": "FACTS:TABLECHECK:tablecheck:kintan-daikanyama-yakiniku",
            "elapsedMs": 9362,
            "percent": 3.7842469906303307
          },
          {
            "stage": "FACTS:TABLECHECK:tablecheck:ebisu-ushimitsu",
            "elapsedMs": 9070,
            "percent": 3.6662166422791174
          },
          {
            "stage": "FACTS:TABLECHECK:tablecheck:ushimitsu-ebisuhonten",
            "elapsedMs": 8303,
            "percent": 3.356184871096308
          },
          {
            "stage": "AVAILABILITY:TABLECHECK:tablecheck:ushimitsu-ebisuhonten:REQUEST_AND_RESULT",
            "elapsedMs": 8115,
            "percent": 3.2801927290071706
          },
          {
            "stage": "FACTS:TABLECHECK:tablecheck:yakiniku-champion-honten",
            "elapsedMs": 7733,
            "percent": 3.1257831636983924
          },
          {
            "stage": "AVAILABILITY:TABLECHECK:tablecheck:kintan-daikanyama-yakiniku:RESOLUTION",
            "elapsedMs": 5366,
            "percent": 2.169009757714415
          },
          {
            "stage": "AVAILABILITY:TABLECHECK:tablecheck:yakiniku-champion-nat:RESOLUTION",
            "elapsedMs": 5248,
            "percent": 2.121312562147829
          },
          {
            "stage": "AVAILABILITY:TABLECHECK:tablecheck:ebisu-ushimitsu:RESOLUTION",
            "elapsedMs": 5184,
            "percent": 2.0954428967557823
          },
          {
            "stage": "AVAILABILITY:TABLECHECK:tablecheck:ushimitsu-ebisuhonten:RESOLUTION",
            "elapsedMs": 4898,
            "percent": 1.9798378295350736
          },
          {
            "stage": "AVAILABILITY:TABLECHECK:tablecheck:yakiniku-champion-honten:RESOLUTION",
            "elapsedMs": 4814,
            "percent": 1.9458838937080125
          },
          {
            "stage": "FACTS",
            "elapsedMs": 4002,
            "percent": 1.61766251404642
          },
          {
            "stage": "SEARCH_RESTAURANTS",
            "elapsedMs": 472,
            "percent": 0.19078878226634438
          },
          {
            "stage": "CHECK_AVAILABILITY",
            "elapsedMs": 189,
            "percent": 0.0763963556108879
          },
          {
            "stage": "DISCOVERY:VENUE_SEARCH:UNCLASSIFIED",
            "elapsedMs": 184,
            "percent": 0.07437528800213425
          },
          {
            "stage": "DISCOVERY:DIRECTORY:UNCLASSIFIED",
            "elapsedMs": 181,
            "percent": 0.07316264743688206
          },
          {
            "stage": "PRESENTATION",
            "elapsedMs": 2,
            "percent": 0.0008084270435014593
          }
        ],
        "modelSteps": [
          {
            "purpose": "restaurant_semantic_interpret",
            "sequence": 1,
            "latencyMs": 2320,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 2,
            "latencyMs": 1669,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 3,
            "latencyMs": 2013,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 4,
            "latencyMs": 1957,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 5,
            "latencyMs": 1891,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 6,
            "latencyMs": 2172,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 7,
            "latencyMs": 1851,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 8,
            "latencyMs": 2126,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 9,
            "latencyMs": 1879,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 10,
            "latencyMs": 1951,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 11,
            "latencyMs": 2010,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 12,
            "latencyMs": 1880,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 13,
            "latencyMs": 2074,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 14,
            "latencyMs": 1942,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 15,
            "latencyMs": 2056,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 16,
            "latencyMs": 2240,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 17,
            "latencyMs": 1990,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 18,
            "latencyMs": 2110,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 19,
            "latencyMs": 1982,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 20,
            "latencyMs": 1895,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 21,
            "latencyMs": 2041,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 22,
            "latencyMs": 2145,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 23,
            "latencyMs": 1931,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 24,
            "latencyMs": 1580,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 25,
            "latencyMs": 2120,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 26,
            "latencyMs": 2069,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 27,
            "latencyMs": 1883,
            "placed": false
          },
          {
            "purpose": "restaurant_fact_judgment",
            "sequence": 28,
            "latencyMs": 1666,
            "placed": false
          },
          {
            "purpose": "restaurant_fact_judgment",
            "sequence": 29,
            "latencyMs": 1512,
            "placed": false
          },
          {
            "purpose": "restaurant_fact_judgment",
            "sequence": 30,
            "latencyMs": 1526,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 31,
            "latencyMs": 1843,
            "placed": false
          },
          {
            "purpose": "restaurant_fact_judgment",
            "sequence": 32,
            "latencyMs": 1598,
            "placed": false
          },
          {
            "purpose": "restaurant_fact_judgment",
            "sequence": 33,
            "latencyMs": 1720,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 34,
            "latencyMs": 1883,
            "placed": false
          }
        ],
        "gaps": [
          "Some model latency counters lack start/settlement timestamps; reported separately, not assigned wall time.",
          "CALENDAR_CONTROL measures only timestamped date/calendar operations with observed target metadata; missing target metadata remains REQUEST_AND_RESULT. Timing never establishes control or inventory success."
        ]
      },
      "repeatedLoads": {
        "counts": {
          "status": "NOT_EVALUATED",
          "scope": "REDACTED_PATHS_ONLY",
          "loads": [
            {
              "url": "https://tabelog.com/en/tokyo/rstLst/",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1316/rstLst/",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1316/A131601/rstLst/",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1316/A131601/R9966/rstLst/",
              "count": 2,
              "reloads": 1
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1316/A131601/",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://www.tablecheck.com/en/japan/search",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://www.tablecheck.com/en/kintan-daikanyama-yakiniku",
              "count": 4,
              "reloads": 3
            },
            {
              "url": "https://www.tablecheck.com/en/ushimitsu-ebisuhonten",
              "count": 3,
              "reloads": 2
            },
            {
              "url": "https://www.tablecheck.com/en/yakiniku-champion-honten",
              "count": 3,
              "reloads": 2
            },
            {
              "url": "https://www.tablecheck.com/en/yakiniku-champion-nat",
              "count": 3,
              "reloads": 2
            },
            {
              "url": "https://www.tablecheck.com/en/ebisu-ushimitsu",
              "count": 3,
              "reloads": 2
            },
            {
              "url": "https://www.tablecheck.com/en/shops/yakiniku-champion-nat/reserve",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://www.tablecheck.com/en/shops/ebisu-ushimitsu/reserve",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://www.tablecheck.com/en/shops/ushimitsu-ebisuhonten/reserve",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://www.tablecheck.com/en/shops/yakiniku-champion-honten/reserve",
              "count": 1,
              "reloads": 0
            }
          ]
        },
        "durationRatio": {
          "status": "NOT_EVALUATED",
          "value": null,
          "basis": "RELOAD_DURATION_RATIO",
          "refs": [],
          "missing": [
            "Counts alone or incomplete/redacted trace do not establish exact reload duration."
          ]
        }
      },
      "externalVsSystem": {
        "navigationOperation": {
          "status": "MEASURED",
          "value": 99246,
          "basis": "SOURCE_IO_OPERATION_PROXY_INCLUDES_BROWSER_PROCESSING",
          "refs": [
            {
              "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz",
              "sha256": "777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5",
              "pointer": "/diagnostics/browserTrace"
            }
          ],
          "missing": []
        },
        "googleWait": {
          "status": "NOT_EVALUATED",
          "value": null,
          "basis": "GOOGLE_WAIT",
          "refs": [],
          "missing": [
            "No independently timestamped Google response boundary supplied."
          ]
        },
        "modelWallMs": {
          "status": "NOT_EVALUATED",
          "value": null,
          "basis": "MODEL_WALL_TIME",
          "refs": [],
          "missing": [
            "Counters alone cannot place model intervals."
          ]
        },
        "systemOperationMs": {
          "status": "MEASURED",
          "value": 35053,
          "basis": "RECORDED_NON_NAVIGATION_OPERATION_UNION",
          "refs": [
            {
              "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-nakameguro-a1.result.json.gz",
              "sha256": "777fc1b1aedb4f0fae321b11aae89c00015150dba1977599268ddb046a03dcf5",
              "pointer": "/diagnostics/browserTrace"
            }
          ],
          "missing": []
        },
        "gaps": [],
        "additive": false
      }
    },
    "clarifications": {
      "excess": {
        "status": "NOT_EVALUATED",
        "value": null,
        "basis": "FROZEN_GOLD_AND_ACTUAL_QUESTION",
        "refs": [],
        "missing": [
          "Frozen clarification Gold with a complete turn history was not supplied."
        ]
      },
      "missing": {
        "status": "NOT_EVALUATED",
        "value": null,
        "basis": "REQUIRED_MISSING_FIELD_AND_UNSOURCED_NEW_VALUE",
        "refs": [],
        "missing": [
          "Frozen required/missing fields and complete before/after history were not supplied."
        ]
      },
      "excessQuestions": [],
      "missingQuestions": []
    },
    "conditions": [
      {
        "candidateId": "tablecheck:kintan-daikanyama-yakiniku",
        "criteria": [
          {
            "text": "yakiniku",
            "polarity": "POSITIVE",
            "strength": "HARD",
            "evidenceRefs": [
              "materializedCase.semantic.criteria[0]"
            ],
            "status": "NOT_CHECKED",
            "basis": [
              "No applicable independent explicit source statement or external observation establishes this condition; linked model judgments alone do not establish its free-text semantics."
            ]
          }
        ]
      }
    ],
    "softPreferenceObservations": {
      "path": "/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/calibration-phase1-20261015/soft-preference-observations.yaml",
      "sha256": "39226c3b079b265789d354158f09fa52e3ae7fa821eedc10e2f3606eea84c7ce"
    },
    "explicitOrdering": {
      "status": "NOT_APPLICABLE",
      "requirement": null,
      "gateEffect": "NONE",
      "refs": []
    }
  },
  "existingDiagnostics": {
    "investigationMetrics": {
      "status": "OBSERVED",
      "rejectedActions": 0,
      "maxConsecutiveNoNewObservation": 1,
      "noNewObservationRuns": [],
      "sameFailureRuns": [],
      "sameTermRuns": [
        {
          "key": "15b4ac0ecd7c3459:yakiniku restaurants near nakameguro, tokyo",
          "steps": [
            1,
            2
          ]
        }
      ],
      "urls": {
        "status": "NOT_EVALUATED",
        "scope": "REDACTED_PATHS_ONLY",
        "loads": [
          {
            "url": "https://tabelog.com/en/tokyo/rstLst/",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1316/rstLst/",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1316/A131601/rstLst/",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1316/A131601/R9966/rstLst/",
            "count": 2,
            "reloads": 1
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1316/A131601/",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://www.tablecheck.com/en/japan/search",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://www.tablecheck.com/en/kintan-daikanyama-yakiniku",
            "count": 4,
            "reloads": 3
          },
          {
            "url": "https://www.tablecheck.com/en/ushimitsu-ebisuhonten",
            "count": 3,
            "reloads": 2
          },
          {
            "url": "https://www.tablecheck.com/en/yakiniku-champion-honten",
            "count": 3,
            "reloads": 2
          },
          {
            "url": "https://www.tablecheck.com/en/yakiniku-champion-nat",
            "count": 3,
            "reloads": 2
          },
          {
            "url": "https://www.tablecheck.com/en/ebisu-ushimitsu",
            "count": 3,
            "reloads": 2
          },
          {
            "url": "https://www.tablecheck.com/en/shops/yakiniku-champion-nat/reserve",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://www.tablecheck.com/en/shops/ebisu-ushimitsu/reserve",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://www.tablecheck.com/en/shops/ushimitsu-ebisuhonten/reserve",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://www.tablecheck.com/en/shops/yakiniku-champion-honten/reserve",
            "count": 1,
            "reloads": 0
          }
        ]
      },
      "violations": [],
      "unassessed": [
        "Full navigation query values were not retained; sanitized-path reloads are descriptive only, not exact-URL failures."
      ]
    },
    "effectiveResources": {
      "status": "NOT_EVALUATED",
      "scope": "RECORDED_EXECUTOR_LIMITS",
      "scopes": [],
      "declarationDifferences": [],
      "violations": [],
      "unassessed": [
        "diagnostics.browserExecution[*].effectiveLimits / browserTrace.EXECUTOR_DIAGNOSTIC.effectiveLimits missing; no actual limit compliance inferred from runCeilings."
      ]
    },
    "reachedStages": null,
    "recordReadIssues": [],
    "unassessedDimensions": [
      "diagnostics.browserExecution[*].effectiveLimits / browserTrace.EXECUTOR_DIAGNOSTIC.effectiveLimits missing; no actual limit compliance inferred from runCeilings.",
      "Full navigation query values were not retained; sanitized-path reloads are descriptive only, not exact-URL failures.",
      "No subjective ranking, provider reliability, long-term inventory freshness, or model-quality score is produced.",
      "Cost is not inferred without explicit configured price inputs.",
      "Investigation sufficiency and search exhaustiveness are not inferred from terminal labels, call counts or remainingGaps prose."
    ]
  }
}
```

### 已有独立核验（只限原范围）

```json
[]
```

### 未评与未完成

- LOCATION: No independent stage-specific conclusion supplied.
- DISCOVERY: No independent stage-specific conclusion supplied.
- IDENTITY: No independent stage-specific conclusion supplied.
- FACTS_HARD: No independent stage-specific conclusion supplied.
- AVAILABILITY: No independent stage-specific conclusion supplied.
- SELECTION: No independent stage-specific conclusion supplied.
- B1_HANDOFF: No independent stage-specific conclusion supplied.
- CARD_TERMS: No independent stage-specific conclusion supplied.
- QUESTION_PAGE: No independent stage-specific conclusion supplied.
- QUESTION_ANSWER: No independent stage-specific conclusion supplied.
- EVALUATOR_UNASSESSED: diagnostics.browserExecution[*].effectiveLimits / browserTrace.EXECUTOR_DIAGNOSTIC.effectiveLimits missing; no actual limit compliance inferred from runCeilings.
- EVALUATOR_UNASSESSED: Full navigation query values were not retained; sanitized-path reloads are descriptive only, not exact-URL failures.
- EVALUATOR_UNASSESSED: No subjective ranking, provider reliability, long-term inventory freshness, or model-quality score is produced.
- EVALUATOR_UNASSESSED: Cost is not inferred without explicit configured price inputs.
- EVALUATOR_UNASSESSED: Investigation sufficiency and search exhaustiveness are not inferred from terminal labels, call counts or remainingGaps prose.
- A G6 independent evaluator integration and B1/terms/page red-light first-point acceptance remain incomplete until that evaluator is merged.

### 系统说发生了什么（不作偏离证据）

```json
{
  "status": "SUCCEEDED",
  "startedAt": "2026-10-11T15:46:51.997Z",
  "finishedAt": "2026-10-11T15:50:59.391Z",
  "stage": "AGENT_LOOP",
  "failureCode": null,
  "noVerifiedResult": null,
  "availabilityChecks": {
    "tablecheck:yakiniku-champion-nat": {
      "status": "UNKNOWN",
      "checkedAt": "2026-10-11T15:48:30.899Z",
      "evidenceIds": [
        "evidence:restaurant:tablecheck-entity-match:f5faf623e96abaf81ac08c1d"
      ],
      "reasonCode": "AVAILABILITY_RESULT_UNOBSERVED",
      "sourceAttempts": [
        {
          "source": "TABLECHECK",
          "outcome": "FAILED",
          "reasonCode": "AVAILABILITY_RESULT_UNOBSERVED"
        }
      ],
      "sourceProvider": "TABLECHECK",
      "requestFingerprint": "{\"date\":\"2026-10-23\",\"timeWindow\":{\"earliest\":\"19:00\",\"latest\":\"19:00\"},\"partySize\":4}"
    },
    "tablecheck:ebisu-ushimitsu": {
      "status": "UNKNOWN",
      "checkedAt": "2026-10-11T15:48:52.626Z",
      "evidenceIds": [
        "evidence:restaurant:tablecheck-entity-match:a4cf9906b0b5247252c46003"
      ],
      "reasonCode": "AVAILABILITY_RESULT_UNOBSERVED",
      "sourceAttempts": [
        {
          "source": "TABLECHECK",
          "outcome": "FAILED",
          "reasonCode": "AVAILABILITY_RESULT_UNOBSERVED"
        }
      ],
      "sourceProvider": "TABLECHECK",
      "requestFingerprint": "{\"date\":\"2026-10-23\",\"timeWindow\":{\"earliest\":\"19:00\",\"latest\":\"19:00\"},\"partySize\":4}"
    },
    "tablecheck:kintan-daikanyama-yakiniku": {
      "status": "AVAILABLE",
      "receptionMode": "RESERVATION_SUPPORTED",
      "checkedAt": "2026-10-11T15:49:36.244Z",
      "evidenceIds": [
        "evidence:restaurant:tablecheck-entity-match:864bb793b0c231be36232c55",
        "evidence:restaurant:tablecheck-availability:cfa1a9e8a6a962c5700dd29f"
      ],
      "displayExpiresAt": "2026-10-11T15:59:36.244Z",
      "freshnessPolicyVersion": "restaurant-availability-display-freshness@1",
      "sourceAttempts": [
        {
          "source": "TABLECHECK",
          "outcome": "AVAILABLE"
        }
      ],
      "sourceProvider": "TABLECHECK",
      "requestFingerprint": "{\"date\":\"2026-10-23\",\"timeWindow\":{\"earliest\":\"19:00\",\"latest\":\"19:00\"},\"partySize\":4}"
    },
    "tablecheck:ushimitsu-ebisuhonten": {
      "status": "UNKNOWN",
      "checkedAt": "2026-10-11T15:49:38.345Z",
      "evidenceIds": [
        "evidence:restaurant:tablecheck-entity-match:052c48ec09fcde28e699378c"
      ],
      "reasonCode": "AVAILABILITY_RESULT_UNOBSERVED",
      "sourceAttempts": [
        {
          "source": "TABLECHECK",
          "outcome": "FAILED",
          "reasonCode": "AVAILABILITY_RESULT_UNOBSERVED"
        }
      ],
      "sourceProvider": "TABLECHECK",
      "requestFingerprint": "{\"date\":\"2026-10-23\",\"timeWindow\":{\"earliest\":\"19:00\",\"latest\":\"19:00\"},\"partySize\":4}"
    },
    "tablecheck:yakiniku-champion-honten": {
      "status": "UNKNOWN",
      "checkedAt": "2026-10-11T15:49:51.394Z",
      "evidenceIds": [
        "evidence:restaurant:tablecheck-entity-match:81c7f8200927e2a504a65024"
      ],
      "reasonCode": "AVAILABILITY_RESULT_UNOBSERVED",
      "sourceAttempts": [
        {
          "source": "TABLECHECK",
          "outcome": "FAILED",
          "reasonCode": "AVAILABILITY_RESULT_UNOBSERVED"
        }
      ],
      "sourceProvider": "TABLECHECK",
      "requestFingerprint": "{\"date\":\"2026-10-23\",\"timeWindow\":{\"earliest\":\"19:00\",\"latest\":\"19:00\"},\"partySize\":4}"
    }
  },
  "selectedCandidateId": null,
  "bookingHandoffs": null,
  "pageQuestion": null
}
```
