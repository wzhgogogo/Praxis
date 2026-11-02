# 运行诊断 run:restaurant:1c9b7f86a211ed74d0d623fa

结果：未评；是否交付：未评（结果类型未确认交付）；用户目标：未评。
首点：未评 / — / —；之前仍有未评：true。

- 首个确认偏离：无已确认记录／未评不代表通过
- 见证覆盖观察：无已确认记录／未评不代表通过
- 推测瓶颈：无记录；确定性始终HYPOTHESIS

| 环节 | 到达 | 判断 | 证据 |
| --- | --- | --- | --- |
| 理解请求 (UNDERSTANDING) | 到达 | 未评 | [引用](#stage-evidence-UNDERSTANDING) |
| 地点 (LOCATION) | 到达 | 未评 | [引用](#stage-evidence-LOCATION) |
| 发现 (DISCOVERY) | 到达 | 未评 | [引用](#stage-evidence-DISCOVERY) |
| 身份 (IDENTITY) | 到达 | 未评 | [引用](#stage-evidence-IDENTITY) |
| 事实/HARD (FACTS_HARD) | 到达 | 未评 | [引用](#stage-evidence-FACTS_HARD) |
| 查位 (AVAILABILITY) | 到达 | 未评 | [引用](#stage-evidence-AVAILABILITY) |
| 展示 (PRESENTATION) | 到达 | 未评 | [引用](#stage-evidence-PRESENTATION) |
| 选店 (SELECTION) | 未评 | 未评 | 无记录 |
| B1交接 (B1_HANDOFF) | 到达 | 未评 | [引用](#stage-evidence-B1_HANDOFF) |
| 卡片条款 (CARD_TERMS) | 到达 | 未评 | [引用](#stage-evidence-CARD_TERMS) |
| 追问取页 (QUESTION_PAGE) | 到达 | 未评 | [引用](#stage-evidence-QUESTION_PAGE) |
| 追问作答 (QUESTION_ANSWER) | 到达 | 未评 | [引用](#stage-evidence-QUESTION_ANSWER) |
| 结束 (ENDING) | 到达 | 未评 | [引用](#stage-evidence-ENDING) |

关键耗时：证据齐全 未评；服务端展示 未评；两者之差 未评。
未评记录：13条（环节/评价器清单）；体验缺项单列在附录，不按0计算。

只定位和度量，不重新判定；CET（UTC+1）。RUN_START_PROXY和服务端投影不等于用户发送和屏幕渲染。

## 见证漏斗

| 店名 | 发现 | 身份 | 事实 | 查位 | 展示 | 可行性 |
| --- | --- | --- | --- | --- | --- | --- |
| 无见证记录 | 未评 | 未评 | 未评 | 未评 | 未评 | 未评 |

## 其他体验观察（无门槛）

追问：多余 未评（NOT_EVALUATED）；缺失 未评（NOT_EVALUATED）。排序：不适用。

拒绝动作：未评；最长连续无新观察：未评。

## 附录

### 严重程度原记录

```json
null
```

### 结果、执行与输入原记录

```json
{
  "outcome": null,
  "execution": null,
  "evaluationFailure": null,
  "inputs": {
    "artifact": {
      "path": ".eval-artifacts/phase3b/g1-page-capture/red/execution/preflight.json",
      "sha256": "2bf07edb39410a1d7b040f8d4f985107c0ad64ef45ba1d85fb5a8702d9ca7f1b"
    },
    "evaluation": null
  },
  "evaluationMetadata": {
    "evaluatorVersion": null,
    "rubricVersion": null,
    "goldCorrection": null,
    "mode": "WEB_READ"
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

理解请求：.eval-artifacts/phase3b/g1-page-capture/red/execution/preflight.json#/afterArtifact/materializedCase (sha256=2bf07edb39410a1d7b040f8d4f985107c0ad64ef45ba1d85fb5a8702d9ca7f1b); .eval-artifacts/phase3b/g1-page-capture/red/execution/preflight.json#/afterArtifact/events/0 (sha256=2bf07edb39410a1d7b040f8d4f985107c0ad64ef45ba1d85fb5a8702d9ca7f1b)

<a id="stage-evidence-LOCATION"></a>

地点：.eval-artifacts/phase3b/g1-page-capture/red/execution/preflight.json#/afterArtifact/finalSnapshot/domainState/searchContinuation/locationContext (sha256=2bf07edb39410a1d7b040f8d4f985107c0ad64ef45ba1d85fb5a8702d9ca7f1b); .eval-artifacts/phase3b/g1-page-capture/red/execution/preflight.json#/after/restaurant/searchLocation (sha256=2bf07edb39410a1d7b040f8d4f985107c0ad64ef45ba1d85fb5a8702d9ca7f1b)

<a id="stage-evidence-DISCOVERY"></a>

发现：.eval-artifacts/phase3b/g1-page-capture/red/execution/preflight.json#/afterArtifact/finalSnapshot/domainState/candidates (sha256=2bf07edb39410a1d7b040f8d4f985107c0ad64ef45ba1d85fb5a8702d9ca7f1b); .eval-artifacts/phase3b/g1-page-capture/red/execution/preflight.json#/afterArtifact/events/1 (sha256=2bf07edb39410a1d7b040f8d4f985107c0ad64ef45ba1d85fb5a8702d9ca7f1b)

<a id="stage-evidence-IDENTITY"></a>

身份：.eval-artifacts/phase3b/g1-page-capture/red/execution/preflight.json#/afterArtifact/finalSnapshot/domainState/readEvidence/2 (sha256=2bf07edb39410a1d7b040f8d4f985107c0ad64ef45ba1d85fb5a8702d9ca7f1b); .eval-artifacts/phase3b/g1-page-capture/red/execution/preflight.json#/afterArtifact/finalSnapshot/domainState/readEvidence/4 (sha256=2bf07edb39410a1d7b040f8d4f985107c0ad64ef45ba1d85fb5a8702d9ca7f1b)

<a id="stage-evidence-FACTS_HARD"></a>

事实/HARD：.eval-artifacts/phase3b/g1-page-capture/red/execution/preflight.json#/afterArtifact/finalSnapshot/domainState/readEvidence/3 (sha256=2bf07edb39410a1d7b040f8d4f985107c0ad64ef45ba1d85fb5a8702d9ca7f1b)

<a id="stage-evidence-AVAILABILITY"></a>

查位：.eval-artifacts/phase3b/g1-page-capture/red/execution/preflight.json#/afterArtifact/finalSnapshot/domainState/readEvidence/5 (sha256=2bf07edb39410a1d7b040f8d4f985107c0ad64ef45ba1d85fb5a8702d9ca7f1b); .eval-artifacts/phase3b/g1-page-capture/red/execution/preflight.json#/afterArtifact/finalSnapshot/domainState/availabilityChecks (sha256=2bf07edb39410a1d7b040f8d4f985107c0ad64ef45ba1d85fb5a8702d9ca7f1b); .eval-artifacts/phase3b/g1-page-capture/red/execution/preflight.json#/afterArtifact/events/2 (sha256=2bf07edb39410a1d7b040f8d4f985107c0ad64ef45ba1d85fb5a8702d9ca7f1b)

<a id="stage-evidence-PRESENTATION"></a>

展示：.eval-artifacts/phase3b/g1-page-capture/red/execution/preflight.json#/afterArtifact/finalSnapshot/domainState/presentedResults (sha256=2bf07edb39410a1d7b040f8d4f985107c0ad64ef45ba1d85fb5a8702d9ca7f1b); .eval-artifacts/phase3b/g1-page-capture/red/execution/preflight.json#/afterArtifact/events/3 (sha256=2bf07edb39410a1d7b040f8d4f985107c0ad64ef45ba1d85fb5a8702d9ca7f1b)

<a id="stage-evidence-SELECTION"></a>

选店：无记录

<a id="stage-evidence-B1_HANDOFF"></a>

B1交接：.eval-artifacts/phase3b/g1-page-capture/red/execution/preflight.json#/after/restaurant/bookingHandoffs (sha256=2bf07edb39410a1d7b040f8d4f985107c0ad64ef45ba1d85fb5a8702d9ca7f1b)

<a id="stage-evidence-CARD_TERMS"></a>

卡片条款：.eval-artifacts/phase3b/g1-page-capture/red/execution/preflight.json#/after/restaurant/bookingHandoffs (sha256=2bf07edb39410a1d7b040f8d4f985107c0ad64ef45ba1d85fb5a8702d9ca7f1b)

<a id="stage-evidence-QUESTION_PAGE"></a>

追问取页：.eval-artifacts/phase3b/g1-page-capture/red/execution/preflight.json#/afterArtifact/finalSnapshot/domainState/pageQuestion (sha256=2bf07edb39410a1d7b040f8d4f985107c0ad64ef45ba1d85fb5a8702d9ca7f1b); .eval-artifacts/phase3b/g1-page-capture/red/execution/preflight.json#/afterArtifact/events/4 (sha256=2bf07edb39410a1d7b040f8d4f985107c0ad64ef45ba1d85fb5a8702d9ca7f1b)

<a id="stage-evidence-QUESTION_ANSWER"></a>

追问作答：.eval-artifacts/phase3b/g1-page-capture/red/execution/preflight.json#/afterArtifact/finalSnapshot/domainState/pageQuestion/result (sha256=2bf07edb39410a1d7b040f8d4f985107c0ad64ef45ba1d85fb5a8702d9ca7f1b); .eval-artifacts/phase3b/g1-page-capture/red/execution/preflight.json#/after/restaurant/pageQuestion/result (sha256=2bf07edb39410a1d7b040f8d4f985107c0ad64ef45ba1d85fb5a8702d9ca7f1b); .eval-artifacts/phase3b/g1-page-capture/red/execution/preflight.json#/afterArtifact/events/5 (sha256=2bf07edb39410a1d7b040f8d4f985107c0ad64ef45ba1d85fb5a8702d9ca7f1b)

<a id="stage-evidence-ENDING"></a>

结束：.eval-artifacts/phase3b/g1-page-capture/red/execution/preflight.json#/afterArtifact/status (sha256=2bf07edb39410a1d7b040f8d4f985107c0ad64ef45ba1d85fb5a8702d9ca7f1b); .eval-artifacts/phase3b/g1-page-capture/red/execution/preflight.json#/afterArtifact/loop (sha256=2bf07edb39410a1d7b040f8d4f985107c0ad64ef45ba1d85fb5a8702d9ca7f1b)

### 下游明确阻断与未定位判断

```json
{
  "downstreamBlocked": [],
  "unlocatedFindings": []
}
```

### 见证漏斗原始JSON

```json
[]
```

### 条件明细

| 展示候选 | 条件 | 强度 | 原评测状态 | 支持来源类型 |
| --- | --- | --- | --- | --- |


```json
null
```

### 完整体验、耗时分解、引用与已有资源诊断

```json
{
  "experience": {
    "gateEffect": "NONE",
    "timing": {
      "startBasis": "NOT_EVALUATED",
      "absoluteTimesCET": {
        "runStart": null,
        "observationComplete": null,
        "serverPresentation": "2026-11-01T07:00:00.000+01:00"
      },
      "elapsed": {
        "status": "MEASURED",
        "value": 51,
        "basis": "RECORDED_RUN_ELAPSED",
        "refs": [
          {
            "path": ".eval-artifacts/phase3b/g1-page-capture/red/execution/preflight.json",
            "sha256": "2bf07edb39410a1d7b040f8d4f985107c0ad64ef45ba1d85fb5a8702d9ca7f1b",
            "pointer": "/afterArtifact/resourceUsage/elapsedMs"
          }
        ],
        "missing": []
      },
      "firstSupportedObservationComplete": {
        "status": "NOT_EVALUATED",
        "value": null,
        "basis": "FINAL_CITED_SUPPORTED_SOURCE_OBSERVATION",
        "refs": [],
        "missing": [
          "No independently qualified presentation with complete timestamped citations."
        ]
      },
      "firstServerPresentation": {
        "status": "NOT_EVALUATED",
        "value": null,
        "basis": "RUN_START_PROXY_TO_SERVER_PRESENTATION",
        "refs": [],
        "missing": [
          "Valid run start/presentation timestamps missing or reversed; no UI render evidence."
        ]
      },
      "observationToPresentation": {
        "status": "NOT_EVALUATED",
        "value": null,
        "basis": "OBSERVATION_TO_SERVER_PRESENTATION",
        "refs": [],
        "missing": [
          "A supported observation-complete instant and server presentation in one clock are required."
        ]
      },
      "acceptanceEvents": [],
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
          "userMessageId": "message:0:24ebc15f7687396928707063",
          "metric": {
            "status": "NOT_EVALUATED",
            "value": null,
            "basis": "USER_TO_ASSOCIATED_ASSISTANT_WALL_TIME",
            "refs": [],
            "missing": [
              "Clock provenance and request/response association are not retained; equal fixture business times are not zero latency."
            ]
          }
        },
        {
          "userMessageId": "message:0:9f6fdef0f48c7d480dbeea87",
          "metric": {
            "status": "NOT_EVALUATED",
            "value": null,
            "basis": "USER_TO_ASSOCIATED_ASSISTANT_WALL_TIME",
            "refs": [],
            "missing": [
              "Clock provenance and request/response association are not retained; equal fixture business times are not zero latency."
            ]
          }
        }
      ],
      "stageBreakdown": {
        "schemaVersion": "restaurant-stage-timings@1",
        "status": "NOT_EVALUATED",
        "elapsedMs": null,
        "criticalPath": [],
        "modelSteps": [],
        "gaps": [
          "Missing valid run start/end timestamps.",
          "CALENDAR_CONTROL measures only timestamped date/calendar operations with observed target metadata; missing target metadata remains REQUEST_AND_RESULT. Timing never establishes control or inventory success."
        ]
      },
      "repeatedLoads": {
        "counts": null,
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
          "status": "NOT_EVALUATED",
          "value": null,
          "basis": "SOURCE_IO_OPERATION_PROXY",
          "refs": [],
          "missing": [
            "Timestamped matched navigation boundaries missing."
          ]
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
          "status": "NOT_EVALUATED",
          "value": null,
          "basis": "SYSTEM_OPERATION_WALL_TIME",
          "refs": [],
          "missing": [
            "Timestamped operation pairs missing."
          ]
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
    "conditions": null,
    "softPreferenceObservations": null,
    "explicitOrdering": {
      "status": "NOT_APPLICABLE",
      "requirement": null,
      "gateEffect": "NONE",
      "refs": []
    }
  },
  "existingDiagnostics": {
    "investigationMetrics": null,
    "effectiveResources": null,
    "reachedStages": null,
    "recordReadIssues": null,
    "unassessedDimensions": null
  }
}
```

### 已有独立核验（只限原范围）

```json
[]
```

### 未评与未完成

- UNDERSTANDING: No independent stage-specific conclusion supplied.
- LOCATION: No independent stage-specific conclusion supplied.
- DISCOVERY: No independent stage-specific conclusion supplied.
- IDENTITY: No independent stage-specific conclusion supplied.
- FACTS_HARD: No independent stage-specific conclusion supplied.
- AVAILABILITY: No independent stage-specific conclusion supplied.
- PRESENTATION: No independent stage-specific conclusion supplied.
- SELECTION: No independent stage-specific conclusion supplied.
- B1_HANDOFF: No independent stage-specific conclusion supplied.
- CARD_TERMS: No independent stage-specific conclusion supplied.
- QUESTION_PAGE: No independent stage-specific conclusion supplied.
- QUESTION_ANSWER: No independent stage-specific conclusion supplied.
- ENDING: No independent stage-specific conclusion supplied.
- A G6 independent evaluator integration and B1/terms/page red-light first-point acceptance remain incomplete until that evaluator is merged.

### 系统说发生了什么（不作偏离证据）

```json
{
  "status": "SUCCEEDED",
  "startedAt": null,
  "finishedAt": null,
  "stage": "AGENT_LOOP",
  "failureCode": null,
  "noVerifiedResult": null,
  "availabilityChecks": {
    "praxis:restaurant:bd287442c716ac7439273cc9": {
      "status": "AVAILABLE",
      "checkedAt": "2026-11-01T06:00:00.000Z",
      "evidenceIds": [
        "evidence:restaurant:tabelog-entity-match:7996501e4fb5faca2aef624c",
        "evidence:restaurant:tabelog-availability:f056bcd68ea445907b62a196"
      ],
      "receptionMode": "RESERVATION_SUPPORTED",
      "sourceAttempts": [
        {
          "source": "TABELOG",
          "outcome": "AVAILABLE"
        }
      ],
      "sourceProvider": "TABELOG",
      "displayExpiresAt": "2026-11-01T06:10:00.000Z",
      "requestFingerprint": "{\"date\":\"2026-11-11\",\"timeWindow\":{\"latest\":\"19:00\",\"earliest\":\"19:00\"},\"partySize\":2}",
      "freshnessPolicyVersion": "restaurant-availability-display-freshness@1"
    }
  },
  "selectedCandidateId": null,
  "bookingHandoffs": [
    {
      "candidateId": "praxis:restaurant:bd287442c716ac7439273cc9",
      "offerId": "offer:tabelog:praxis:restaurant:bd287442c716ac7439273cc9:2026-11-11:19:00:2",
      "provider": "TABELOG",
      "url": "https://tabelog.com/en/booking/form_course/new?visit_time=1900&member=2&rcd=13123456&visit_date=20261111",
      "directLabel": "Book on Tabelog",
      "continueLabel": "Continue on Tabelog — date, time, 2 guests filled in",
      "checkedAt": "2026-11-01T06:00:00.000Z",
      "displayExpiresAt": "2026-11-01T06:10:00.000Z",
      "platformFee": {
        "provider": "TABELOG",
        "channel": "ENGLISH_BOOKING",
        "amountPerPersonJPY": 440,
        "userCancellationRefund": false,
        "restaurantCancellationRefund": true,
        "label": "System usage fee: ¥440 per guest; not refunded if you cancel. Refunded if the restaurant cancels.",
        "sourceUrl": "https://tabelog.com/en/help",
        "checkedOn": "2026-10-29",
        "documentSHA256": "f8d3583945fb819636854582432a10109a0d782cc2314b7088ccfa9cc2fc4b51",
        "quotes": [
          "Tabelog charges a system usage fee of JPY 440 per person* at the time of reservation.",
          "Please note that no refunds will be issued for cancellations made for customer reasons.",
          "However, if a restaurant initiates a cancellation, the system usage fee for that reservation will be refunded."
        ]
      },
      "knowledge": "SOURCE_OBSERVED_AVAILABILITY",
      "linkCarries": [
        "DATE",
        "TIME",
        "PARTY_SIZE"
      ],
      "sourceSelection": "UNKNOWN",
      "terms": []
    }
  ],
  "pageQuestion": {
    "result": {
      "reason": "NO_BOUND_PAGE",
      "status": "UNVERIFIED",
      "candidateId": "praxis:restaurant:bd287442c716ac7439273cc9",
      "checkedPages": []
    },
    "question": "Does the first restaurant have a private room?",
    "readRunId": "run:restaurant:1c9b7f86a211ed74d0d623fa:investigation:1",
    "requestId": "g6-question",
    "deadlineAt": "2026-11-01T06:01:00.000Z",
    "candidateId": "praxis:restaurant:bd287442c716ac7439273cc9",
    "requestedAt": "2026-11-01T06:00:00.000Z",
    "readStartedAt": "2026-11-01T06:00:00.000Z"
  }
}
```
