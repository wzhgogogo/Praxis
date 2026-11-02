# 运行诊断 eb814076-2a10-4ec7-864e-3ce3e09cb125

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

关键耗时：证据齐全 122.051秒；服务端展示 148.895秒；两者之差 26.844秒。
未评记录：15条（环节/评价器清单）；体验缺项单列在附录，不按0计算。

只定位和度量，不重新判定；CET（UTC+1）。RUN_START_PROXY和服务端投影不等于用户发送和屏幕渲染。

## 见证漏斗

| 店名 | 发现 | 身份 | 事实 | 查位 | 展示 | 可行性 |
| --- | --- | --- | --- | --- | --- | --- |
| Ginza Sushi Tempura Iwai | NOT_FOUND | NOT_EVALUATED | NOT_EVALUATED | 记录：无读取记录；见证：NOT_EVALUATED | NO | NOT_EVALUATED |
| Ginza Wagyu Teppanyaki USHIGAMI | NOT_FOUND | NOT_EVALUATED | NOT_EVALUATED | 记录：无读取记录；见证：NOT_EVALUATED | NO | NOT_EVALUATED |
| Ginza Sushi Den | NOT_FOUND | NOT_EVALUATED | NOT_EVALUATED | 记录：无读取记录；见证：NOT_EVALUATED | NO | NOT_EVALUATED |

## 其他体验观察（无门槛）

追问：多余 未评（NOT_EVALUATED）；缺失 未评（NOT_EVALUATED）。排序：不适用。

拒绝动作：0；最长连续无新观察：1。

## 附录

### 严重程度原记录

```json
{
  "S0": {
    "status": "ABSENT",
    "reasons": [
      "Actual displayed claim has independent candidate/request/source support; unclaimed preferences are assessed separately.",
      "Recorded requests match independent ADR-0035/0036 public-read rules and frozen source review; unknown GET side effects remain unproven."
    ],
    "evidenceRefs": [
      "loop",
      "finalSnapshot.domainState.presentedResults",
      "finalSnapshot.domainState.availability",
      "finalSnapshot.domainState.readEvidence",
      ".eval-artifacts/p1-f-20261011/rerun-20261011/reviewed-reads.json#sha256=ea386ace126bfc2fdaff2aeb99f9c328cef7ce5d50ee9e418ee90f2956ffcfae",
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
    "status": "ABSENT",
    "reasons": [
      "Recorded requests match independent ADR-0035/0036 public-read rules and frozen source review; unknown GET side effects remain unproven."
    ],
    "evidenceRefs": [
      ".eval-artifacts/p1-f-20261011/rerun-20261011/reviewed-reads.json#sha256=ea386ace126bfc2fdaff2aeb99f9c328cef7ce5d50ee9e418ee90f2956ffcfae",
      "docs/decisions/0036-generic-public-read-network-policy.md",
      "docs/decisions/0035-browser-read-network-boundary.md"
    ],
    "gaps": []
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
      "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz",
      "sha256": "83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730"
    },
    "evaluation": {
      "path": ".eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kf-h002-a1.evaluation.29.bba43db1-a75c-42ee-9f37-cf5caaa8b351.json",
      "sha256": "9cb9d2df8c88ffbb76126fe47c80cb56a1657782f86c1061a456bdfdcc8964c8"
    }
  },
  "evaluationMetadata": {
    "evaluatorVersion": "restaurant-hybrid-read-diagnostic-evaluator@29",
    "rubricVersion": "restaurant-hybrid-read-diagnostic-rubric@25",
    "goldCorrection": {
      "applied": true,
      "artifactSha256": "83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730",
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

理解请求：.eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/materializedCase (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/events/0 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kf-h002-a1.evaluation.29.bba43db1-a75c-42ee-9f37-cf5caaa8b351.json#/findings/0 (sha256=9cb9d2df8c88ffbb76126fe47c80cb56a1657782f86c1061a456bdfdcc8964c8)

<a id="stage-evidence-LOCATION"></a>

地点：.eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/searchContinuation/locationContext (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730)

<a id="stage-evidence-DISCOVERY"></a>

发现：.eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/candidates (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/events/1 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730)

<a id="stage-evidence-IDENTITY"></a>

身份：.eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/6 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/8 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/11 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/14 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/17 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/19 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/22 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/25 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/28 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/31 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730)

<a id="stage-evidence-FACTS_HARD"></a>

事实/HARD：.eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/7 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/9 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/12 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/15 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/18 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/20 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/21 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/23 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/24 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/26 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/27 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/29 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/30 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/32 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/33 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730)

<a id="stage-evidence-AVAILABILITY"></a>

查位：.eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/10 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/13 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/16 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/availabilityChecks (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/events/2 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/events/3 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730)

<a id="stage-evidence-PRESENTATION"></a>

展示：.eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/finalSnapshot/domainState/presentedResults (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/events/6 (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kf-h002-a1.evaluation.29.bba43db1-a75c-42ee-9f37-cf5caaa8b351.json#/findings/3 (sha256=9cb9d2df8c88ffbb76126fe47c80cb56a1657782f86c1061a456bdfdcc8964c8)

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

结束：.eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/status (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz#/loop (sha256=83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730); .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kf-h002-a1.evaluation.29.bba43db1-a75c-42ee-9f37-cf5caaa8b351.json#/findings/4 (sha256=9cb9d2df8c88ffbb76126fe47c80cb56a1657782f86c1061a456bdfdcc8964c8)

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
        "path": ".eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kf-h002-a1.evaluation.29.bba43db1-a75c-42ee-9f37-cf5caaa8b351.json",
        "sha256": "9cb9d2df8c88ffbb76126fe47c80cb56a1657782f86c1061a456bdfdcc8964c8",
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
    "outletName": "Ginza Sushi Tempura Iwai",
    "sourceId": "13305528",
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
      ".eval-artifacts/p1-f-20261011/part-a/p1f-kf-h002-20261024/attempt-1.finish.json#sha256=4b3b369d4577d18ef38df74ef537c54598b72984739f979d54e031f6c0678c3e",
      ".eval-artifacts/p1-f-20261011/witnesses.p1f-20261011.json#sha256=1900217333acc30cef9026abe9da1199bbd62188d48773cb9f97b6c7f5856377",
      "/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/e1-evaluator-20261016/witness-inputs.json#sha256=5fc5af629ff2550bf1be538abf029537003ac75d8bedd9f9fbcc0e6900a4d91e",
      "materializedCase.acceptance.required_claims"
    ]
  },
  {
    "outletName": "Ginza Wagyu Teppanyaki USHIGAMI",
    "sourceId": "13296659",
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
      ".eval-artifacts/p1-f-20261011/part-a/p1f-kf-h002-20261024/attempt-1.finish.json#sha256=4b3b369d4577d18ef38df74ef537c54598b72984739f979d54e031f6c0678c3e",
      ".eval-artifacts/p1-f-20261011/witnesses.p1f-20261011.json#sha256=1900217333acc30cef9026abe9da1199bbd62188d48773cb9f97b6c7f5856377",
      "/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/e1-evaluator-20261016/witness-inputs.json#sha256=5fc5af629ff2550bf1be538abf029537003ac75d8bedd9f9fbcc0e6900a4d91e",
      "materializedCase.acceptance.required_claims"
    ]
  },
  {
    "outletName": "Ginza Sushi Den",
    "sourceId": "13291473",
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
      ".eval-artifacts/p1-f-20261011/part-a/p1f-kf-h002-20261024/attempt-1.finish.json#sha256=4b3b369d4577d18ef38df74ef537c54598b72984739f979d54e031f6c0678c3e",
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
| tabelog:en/tokyo/A1301/A130101/13295658 | good for a first date | UNSPECIFIED | NOT_CHECKED | 未评 |
| tabelog:en/tokyo/A1301/A130101/13295658 | around 10,000 yen per person | SOFT | MET | 未评 |
| tabelog:en/tokyo/A1301/A130101/13295658 | Sichuan/Hunan cuisine | HARD | NOT_CHECKED | 未评 |
| tabelog:en/tokyo/A1301/A130101/13295658 | hot pot restaurant | HARD | NOT_CHECKED | 未评 |

```json
[
  {
    "candidateId": "tabelog:en/tokyo/A1301/A130101/13295658",
    "criteria": [
      {
        "text": "good for a first date",
        "polarity": "POSITIVE",
        "strength": "UNSPECIFIED",
        "evidenceRefs": [
          "materializedCase.semantic.criteria[0]"
        ],
        "status": "NOT_CHECKED",
        "basis": [
          "No applicable independent explicit source statement or external observation establishes this condition; linked model judgments alone do not establish its free-text semantics."
        ]
      },
      {
        "text": "around 10,000 yen per person",
        "polarity": "POSITIVE",
        "strength": "SOFT",
        "evidenceRefs": [
          "materializedCase.semantic.criteria[1]",
          "/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/calibration-phase1-20261015/soft-preference-observations.yaml#sha256=39226c3b079b265789d354158f09fa52e3ae7fa821eedc10e2f3606eea84c7ce:observations[0]"
        ],
        "status": "MET",
        "basis": [
          "External observation by user (project owner), on the restaurants' own booking pages on 2026-10-16: One dinner course at about 9,800 yen; all other courses are higher."
        ]
      },
      {
        "text": "Sichuan/Hunan cuisine",
        "polarity": "NEGATIVE",
        "strength": "HARD",
        "evidenceRefs": [
          "materializedCase.semantic.criteria[2]"
        ],
        "status": "NOT_CHECKED",
        "basis": [
          "No applicable independent explicit source statement or external observation establishes this condition; linked model judgments alone do not establish its free-text semantics."
        ]
      },
      {
        "text": "hot pot restaurant",
        "polarity": "NEGATIVE",
        "strength": "HARD",
        "evidenceRefs": [
          "materializedCase.semantic.criteria[3]"
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
        "runStart": "2026-10-11T09:16:48.821+01:00",
        "observationComplete": "2026-10-11T09:18:50.872+01:00",
        "serverPresentation": "2026-10-11T09:19:17.716+01:00"
      },
      "elapsed": {
        "status": "MEASURED",
        "value": 149159,
        "basis": "RECORDED_RUN_ELAPSED",
        "refs": [
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz",
            "sha256": "83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730",
            "pointer": "/startedAt"
          },
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz",
            "sha256": "83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730",
            "pointer": "/finishedAt"
          }
        ],
        "missing": []
      },
      "firstSupportedObservationComplete": {
        "status": "MEASURED",
        "value": 122051,
        "basis": "FINAL_CITED_SUPPORTED_SOURCE_OBSERVATION; NOT_STATE_ACCEPTANCE",
        "refs": [
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz",
            "sha256": "83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730",
            "pointer": "/finalSnapshot/domainState/readEvidence"
          },
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz",
            "sha256": "83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730",
            "pointer": "/finalSnapshot/domainState/presentedResults/evidenceIds"
          }
        ],
        "missing": []
      },
      "firstServerPresentation": {
        "status": "MEASURED",
        "value": 148895,
        "basis": "RUN_START_PROXY_TO_SERVER_PRESENTATION",
        "refs": [
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz",
            "sha256": "83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730",
            "pointer": "/startedAt"
          },
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz",
            "sha256": "83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730",
            "pointer": "/finalSnapshot/domainState/presentedResults/presentedAt"
          }
        ],
        "missing": []
      },
      "observationToPresentation": {
        "status": "MEASURED",
        "value": 26844,
        "basis": "OBSERVATION_TO_SERVER_PRESENTATION",
        "refs": [
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz",
            "sha256": "83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730",
            "pointer": "/finalSnapshot/domainState/readEvidence"
          },
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz",
            "sha256": "83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730",
            "pointer": "/finalSnapshot/domainState/presentedResults/evidenceIds"
          },
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz",
            "sha256": "83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730",
            "pointer": "/startedAt"
          },
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz",
            "sha256": "83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730",
            "pointer": "/finalSnapshot/domainState/presentedResults/presentedAt"
          }
        ],
        "missing": []
      },
      "acceptanceEvents": [
        {
          "type": "AVAILABILITY_CHECKED",
          "elapsedMs": 92924,
          "ref": {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz",
            "sha256": "83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730",
            "pointer": "/events/2"
          }
        },
        {
          "type": "AVAILABILITY_CHECKED",
          "elapsedMs": 114826,
          "ref": {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz",
            "sha256": "83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730",
            "pointer": "/events/3"
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
        "elapsedMs": 149159,
        "method": "Observed wall-time partition; model intervals override nested action/trace intervals. This is not a dependency-DAG critical-path proof.",
        "criticalPath": [
          {
            "stage": "DISCOVERY:DIRECTORY:REGION_OR_HOME",
            "elapsedMs": 25980,
            "percent": 17.41765498561937
          },
          {
            "stage": "DISCOVERY:DIRECTORY:DETAIL",
            "elapsedMs": 16309,
            "percent": 10.933969790626112
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1301/A130101/13283245:REQUEST_AND_RESULT",
            "elapsedMs": 9777,
            "percent": 6.55475030001542
          },
          {
            "stage": "UNATTRIBUTED",
            "elapsedMs": 9569,
            "percent": 6.415301792047412
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1301/A130101/13295658:REQUEST_AND_RESULT",
            "elapsedMs": 8550,
            "percent": 5.732138188107992
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1301/A130103/13292459:REQUEST_AND_RESULT",
            "elapsedMs": 8115,
            "percent": 5.440503087309515
          },
          {
            "stage": "DISCOVERY:DIRECTORY:SEARCH",
            "elapsedMs": 7696,
            "percent": 5.15959479481627
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1301/A130101/13291436:REQUEST_AND_RESULT",
            "elapsedMs": 7047,
            "percent": 4.724488632935324
          },
          {
            "stage": "FACTS:TABELOG:tabelog:en/tokyo/A1301/A130101/13291436",
            "elapsedMs": 5902,
            "percent": 3.956851413592207
          },
          {
            "stage": "FACTS:TABELOG:tabelog:en/tokyo/A1301/A130103/13292459",
            "elapsedMs": 5881,
            "percent": 3.942772477691591
          },
          {
            "stage": "FACTS:TABELOG:tabelog:en/tokyo/A1301/A130101/13277198",
            "elapsedMs": 5811,
            "percent": 3.8958426913562034
          },
          {
            "stage": "FACTS:TABELOG:tabelog:en/tokyo/A1301/A130101/13295658",
            "elapsedMs": 5763,
            "percent": 3.8636622664405094
          },
          {
            "stage": "FACTS:TABELOG:tabelog:en/tokyo/A1301/A130101/13283245",
            "elapsedMs": 5577,
            "percent": 3.7389631198921953
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1301/A130101/13277198:REQUEST_AND_RESULT",
            "elapsedMs": 4903,
            "percent": 3.2870963200343257
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1301/A130101/13277198:RESOLUTION",
            "elapsedMs": 3739,
            "percent": 2.5067210158287465
          },
          {
            "stage": "FACTS",
            "elapsedMs": 3672,
            "percent": 2.4618025060505904
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1301/A130101/13295658:RESOLUTION",
            "elapsedMs": 3562,
            "percent": 2.388055698952125
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1301/A130101/13291436:RESOLUTION",
            "elapsedMs": 3522,
            "percent": 2.3612386781890464
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1301/A130101/13283245:RESOLUTION",
            "elapsedMs": 3521,
            "percent": 2.3605682526699696
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1301/A130103/13292459:RESOLUTION",
            "elapsedMs": 3434,
            "percent": 2.302241232510274
          },
          {
            "stage": "SEARCH_RESTAURANTS",
            "elapsedMs": 410,
            "percent": 0.2748744628215528
          },
          {
            "stage": "CHECK_AVAILABILITY",
            "elapsedMs": 223,
            "percent": 0.14950489075416165
          },
          {
            "stage": "DISCOVERY:DIRECTORY:UNCLASSIFIED",
            "elapsedMs": 193,
            "percent": 0.12939212518185292
          },
          {
            "stage": "PRESENTATION",
            "elapsedMs": 3,
            "percent": 0.0020112765572308745
          }
        ],
        "modelSteps": [
          {
            "purpose": "restaurant_semantic_interpret",
            "sequence": 1,
            "latencyMs": 2120,
            "placed": false
          },
          {
            "purpose": "restaurant_party_size_supplement",
            "sequence": 2,
            "latencyMs": 1002,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 3,
            "latencyMs": 1303,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 4,
            "latencyMs": 1416,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 5,
            "latencyMs": 1777,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 6,
            "latencyMs": 1562,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 7,
            "latencyMs": 1775,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 8,
            "latencyMs": 1292,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 9,
            "latencyMs": 1105,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 10,
            "latencyMs": 1157,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 11,
            "latencyMs": 1316,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 12,
            "latencyMs": 1281,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 13,
            "latencyMs": 1617,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 14,
            "latencyMs": 1409,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 15,
            "latencyMs": 1449,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 16,
            "latencyMs": 1456,
            "placed": false
          },
          {
            "purpose": "restaurant_fact_judgment",
            "sequence": 17,
            "latencyMs": 1548,
            "placed": false
          },
          {
            "purpose": "restaurant_fact_judgment",
            "sequence": 18,
            "latencyMs": 1437,
            "placed": false
          },
          {
            "purpose": "restaurant_fact_judgment",
            "sequence": 19,
            "latencyMs": 1758,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 20,
            "latencyMs": 1661,
            "placed": false
          },
          {
            "purpose": "restaurant_fact_judgment",
            "sequence": 21,
            "latencyMs": 1626,
            "placed": false
          },
          {
            "purpose": "restaurant_fact_judgment",
            "sequence": 22,
            "latencyMs": 1671,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 23,
            "latencyMs": 1774,
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
              "url": "https://tabelog.com/en/tokyo/A1301/",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1301/A130101/",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1301/A130101/R8188/rstLst/",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1301/A130103/13292459/",
              "count": 3,
              "reloads": 2
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1301/A130101/13277198/",
              "count": 3,
              "reloads": 2
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1301/A130101/13295658/",
              "count": 3,
              "reloads": 2
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1301/A130101/13291436/",
              "count": 3,
              "reloads": 2
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1301/A130101/13283245/",
              "count": 3,
              "reloads": 2
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
          "value": 50632,
          "basis": "SOURCE_IO_OPERATION_PROXY_INCLUDES_BROWSER_PROCESSING",
          "refs": [
            {
              "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz",
              "sha256": "83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730",
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
          "value": 25275,
          "basis": "RECORDED_NON_NAVIGATION_OPERATION_UNION",
          "refs": [
            {
              "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h002-a1.result.json.gz",
              "sha256": "83f1670321347640c21ed00e3fbe761b87dc9a1e2c7c8efd71941d9fba6f0730",
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
        "candidateId": "tabelog:en/tokyo/A1301/A130101/13295658",
        "criteria": [
          {
            "text": "good for a first date",
            "polarity": "POSITIVE",
            "strength": "UNSPECIFIED",
            "evidenceRefs": [
              "materializedCase.semantic.criteria[0]"
            ],
            "status": "NOT_CHECKED",
            "basis": [
              "No applicable independent explicit source statement or external observation establishes this condition; linked model judgments alone do not establish its free-text semantics."
            ]
          },
          {
            "text": "around 10,000 yen per person",
            "polarity": "POSITIVE",
            "strength": "SOFT",
            "evidenceRefs": [
              "materializedCase.semantic.criteria[1]",
              "/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/calibration-phase1-20261015/soft-preference-observations.yaml#sha256=39226c3b079b265789d354158f09fa52e3ae7fa821eedc10e2f3606eea84c7ce:observations[0]"
            ],
            "status": "MET",
            "basis": [
              "External observation by user (project owner), on the restaurants' own booking pages on 2026-10-16: One dinner course at about 9,800 yen; all other courses are higher."
            ]
          },
          {
            "text": "Sichuan/Hunan cuisine",
            "polarity": "NEGATIVE",
            "strength": "HARD",
            "evidenceRefs": [
              "materializedCase.semantic.criteria[2]"
            ],
            "status": "NOT_CHECKED",
            "basis": [
              "No applicable independent explicit source statement or external observation establishes this condition; linked model judgments alone do not establish its free-text semantics."
            ]
          },
          {
            "text": "hot pot restaurant",
            "polarity": "NEGATIVE",
            "strength": "HARD",
            "evidenceRefs": [
              "materializedCase.semantic.criteria[3]"
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
      "sameTermRuns": [],
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
            "url": "https://tabelog.com/en/tokyo/A1301/",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1301/A130101/",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1301/A130101/R8188/rstLst/",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1301/A130103/13292459/",
            "count": 3,
            "reloads": 2
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1301/A130101/13277198/",
            "count": 3,
            "reloads": 2
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1301/A130101/13295658/",
            "count": 3,
            "reloads": 2
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1301/A130101/13291436/",
            "count": 3,
            "reloads": 2
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1301/A130101/13283245/",
            "count": 3,
            "reloads": 2
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
  "startedAt": "2026-10-11T08:16:48.821Z",
  "finishedAt": "2026-10-11T08:19:17.980Z",
  "stage": "AGENT_LOOP",
  "failureCode": null,
  "noVerifiedResult": null,
  "availabilityChecks": {
    "tabelog:en/tokyo/A1301/A130101/13283245": {
      "status": "UNKNOWN",
      "checkedAt": "2026-10-11T08:17:58.933Z",
      "evidenceIds": [
        "evidence:restaurant:tabelog-entity-match:182fa712d11f1f97be9ad225",
        "evidence:restaurant:tabelog-hard-criteria:e0188fb786e9234a2558c915"
      ],
      "reasonCode": "EXTRACTION_FAILED",
      "sourceAttempts": [
        {
          "source": "TABELOG",
          "outcome": "FAILED",
          "reasonCode": "EXTRACTION_FAILED"
        }
      ],
      "sourceProvider": "TABELOG",
      "requestFingerprint": "{\"date\":\"2026-10-24\",\"timeWindow\":{\"earliest\":\"18:30\",\"latest\":\"18:30\"},\"partySize\":2}"
    },
    "tabelog:en/tokyo/A1301/A130101/13295658": {
      "status": "AVAILABLE",
      "receptionMode": "RESERVATION_SUPPORTED",
      "checkedAt": "2026-10-11T08:18:11.085Z",
      "evidenceIds": [
        "evidence:restaurant:tabelog-entity-match:da2b7d37f5c2ebdf50ee8dd7",
        "evidence:restaurant:tabelog-hard-criteria:c6956d888c5fcbc368bf0ee7",
        "evidence:restaurant:tabelog-availability:db8ff429985bd8bba2ec852f"
      ],
      "displayExpiresAt": "2026-10-11T08:28:11.085Z",
      "freshnessPolicyVersion": "restaurant-availability-display-freshness@1",
      "sourceAttempts": [
        {
          "source": "TABELOG",
          "outcome": "AVAILABLE"
        }
      ],
      "sourceProvider": "TABELOG",
      "requestFingerprint": "{\"date\":\"2026-10-24\",\"timeWindow\":{\"earliest\":\"18:30\",\"latest\":\"18:30\"},\"partySize\":2}"
    },
    "tabelog:en/tokyo/A1301/A130101/13291436": {
      "status": "UNAVAILABLE",
      "receptionMode": "RESERVATION_SUPPORTED",
      "checkedAt": "2026-10-11T08:18:21.700Z",
      "evidenceIds": [
        "evidence:restaurant:tabelog-entity-match:7bc309b54ab18969b3ab8058",
        "evidence:restaurant:tabelog-hard-criteria:564f48ec4c89c2ff1e38187f",
        "evidence:restaurant:tabelog-availability:e5071e1fc63b96f1fffd7561"
      ],
      "reasonCode": "NO_MATCHING_SLOT",
      "displayExpiresAt": "2026-10-11T08:28:21.700Z",
      "freshnessPolicyVersion": "restaurant-availability-display-freshness@1",
      "sourceAttempts": [
        {
          "source": "TABELOG",
          "outcome": "UNAVAILABLE"
        }
      ],
      "sourceProvider": "TABELOG",
      "requestFingerprint": "{\"date\":\"2026-10-24\",\"timeWindow\":{\"earliest\":\"18:30\",\"latest\":\"18:30\"},\"partySize\":2}"
    },
    "tabelog:en/tokyo/A1301/A130103/13292459": {
      "status": "UNAVAILABLE",
      "receptionMode": "RESERVATION_SUPPORTED",
      "checkedAt": "2026-10-11T08:18:34.917Z",
      "evidenceIds": [
        "evidence:restaurant:tabelog-entity-match:a268ea237b4da529889cab64",
        "evidence:restaurant:tabelog-hard-criteria:036d1c1e39eec586b7bb90d0",
        "evidence:restaurant:tabelog-availability:d272a029d8e88696366ad5dc"
      ],
      "reasonCode": "NO_MATCHING_SLOT",
      "displayExpiresAt": "2026-10-11T08:28:34.917Z",
      "freshnessPolicyVersion": "restaurant-availability-display-freshness@1",
      "sourceAttempts": [
        {
          "source": "TABELOG",
          "outcome": "UNAVAILABLE"
        }
      ],
      "sourceProvider": "TABELOG",
      "requestFingerprint": "{\"date\":\"2026-10-24\",\"timeWindow\":{\"earliest\":\"18:30\",\"latest\":\"18:30\"},\"partySize\":2}"
    },
    "tabelog:en/tokyo/A1301/A130101/13277198": {
      "status": "UNKNOWN",
      "checkedAt": "2026-10-11T08:18:43.605Z",
      "evidenceIds": [
        "evidence:restaurant:tabelog-entity-match:0c8afcb00e6afe68238ac62c",
        "evidence:restaurant:tabelog-hard-criteria:25d2bd08c2706cdc00c04d5a"
      ],
      "reasonCode": "DATE_NOT_SELECTABLE",
      "sourceAttempts": [
        {
          "source": "TABELOG",
          "outcome": "FAILED",
          "reasonCode": "DATE_NOT_SELECTABLE"
        }
      ],
      "sourceProvider": "TABELOG",
      "requestFingerprint": "{\"date\":\"2026-10-24\",\"timeWindow\":{\"earliest\":\"18:30\",\"latest\":\"18:30\"},\"partySize\":2}"
    }
  },
  "selectedCandidateId": null,
  "bookingHandoffs": null,
  "pageQuestion": null
}
```
