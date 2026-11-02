# 运行诊断 未评

只定位和度量，不重新判定。时间展示 CET（UTC+1）；RUN_START_PROXY/服务端投影不等于用户发送/屏幕渲染。

结果：未评；用户目标：未评。

严重程度原记录：

```json
null
```

首点：未评 / — / —；之前是否仍有未评：true。

## 环节链

| 环节 | 到达 | 判断 | 证据 |
| --- | --- | --- | --- |
| 理解请求 (UNDERSTANDING) | 未评 | 未评 |  |
| 地点 (LOCATION) | 到达 | 未评 | .eval-artifacts/phase3b/b1-tablecheck-composition-20261101/red/preflight.json#/initial/restaurant/searchLocation (sha256=eb08a94f8edb6b2b47b60a94f075a05ce5478b8fd6f8828b4c959d8c2d47c2e2) |
| 发现 (DISCOVERY) | 未评 | 未评 |  |
| 身份 (IDENTITY) | 未评 | 未评 |  |
| 事实/HARD (FACTS_HARD) | 未评 | 未评 |  |
| 查位 (AVAILABILITY) | 未评 | 未评 |  |
| 展示 (PRESENTATION) | 未评 | 未评 |  |
| 选店 (SELECTION) | 未评 | 未评 |  |
| B1交接 (B1_HANDOFF) | 到达 | 未评 | .eval-artifacts/phase3b/b1-tablecheck-composition-20261101/red/preflight.json#/initial/restaurant/bookingHandoffs (sha256=eb08a94f8edb6b2b47b60a94f075a05ce5478b8fd6f8828b4c959d8c2d47c2e2) |
| 卡片条款 (CARD_TERMS) | 未评 | 未评 |  |
| 追问取页 (QUESTION_PAGE) | 未评 | 未评 |  |
| 追问作答 (QUESTION_ANSWER) | 未评 | 未评 |  |
| 结束 (ENDING) | 到达 | 未评 | .eval-artifacts/phase3b/b1-tablecheck-composition-20261101/red/preflight.json#/status (sha256=eb08a94f8edb6b2b47b60a94f075a05ce5478b8fd6f8828b4c959d8c2d47c2e2) |

## 首个确认偏离

无记录。

## 见证覆盖观察

无记录。

## 推测瓶颈

无记录。

## 下游明确阻断与未定位判断

```json
{
  "downstreamBlocked": [],
  "unlocatedFindings": []
}
```

## 见证漏斗（原样）

| 见证店 | 原始漏斗行 |
| --- | --- |


## 体验指标（只报告，无门槛）

| 时间点/间隔 | 状态 | 毫秒 | 边界 |
| --- | --- | --- | --- |
| elapsed | NOT_EVALUATED | 未评 | RUN_ELAPSED |
| evidence | NOT_EVALUATED | 未评 | FINAL_CITED_SUPPORTED_SOURCE_OBSERVATION |
| presentation | NOT_EVALUATED | 未评 | RUN_START_PROXY_TO_SERVER_PRESENTATION |
| delay | NOT_EVALUATED | 未评 | OBSERVATION_TO_SERVER_PRESENTATION |

追问：多余 未评（NOT_EVALUATED）；缺失 未评（NOT_EVALUATED）。排序：不适用。

| 展示候选 | 条件 | 强度 | 原评测状态 | 支持来源类型 |
| --- | --- | --- | --- | --- |


拒绝动作：未评；最长连续无新观察：未评。

<details><summary>完整体验、耗时分解、引用与已有资源诊断</summary>

```json
{
  "experience": {
    "gateEffect": "NONE",
    "timing": {
      "startBasis": "NOT_EVALUATED",
      "absoluteTimesCET": {
        "runStart": null,
        "observationComplete": null,
        "serverPresentation": null
      },
      "elapsed": {
        "status": "NOT_EVALUATED",
        "value": null,
        "basis": "RUN_ELAPSED",
        "refs": [],
        "missing": [
          "Missing valid elapsed/start/end."
        ]
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

</details>

## 已有独立核验（只限原范围）

```json
[]
```

## 未评与未完成

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

系统说发生了什么（不作偏离证据）：

```json
{
  "status": "FAILED",
  "startedAt": null,
  "finishedAt": null,
  "stage": null,
  "failureCode": null,
  "noVerifiedResult": null,
  "availabilityChecks": null,
  "selectedCandidateId": null,
  "bookingHandoffs": [],
  "pageQuestion": null
}
```
