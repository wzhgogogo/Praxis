# 跨运行诊断汇总

只读已有产物；不改判定，不设体验门槛。时间口径 CET。版本/Gold分层与原分母依据一并保留；总体分布仅描述，不代表不同版本可比。

## 分母

```json
{
  "counts": {
    "planned": 8,
    "received": 8,
    "started": 0,
    "finished": 0,
    "completed": 0,
    "interrupted": 0,
    "classificationAvailable": 0,
    "scorable": 0,
    "capabilityIncluded": 0
  },
  "definitions": {
    "planned": "Only an explicitly supplied manifest count; null without one.",
    "completed": "A recorded finish timestamp excluding orchestration interruptions; this is run completion, not user-goal completion.",
    "scorable": "Existing classified result, excluding unassessed/interrupted/invalid/environment-only samples; per-dimension gaps remain visible."
  }
}
```

## 首点 × 严重程度

| 首点 × 严重程度 | 次数 | 运行 ID |
| --- | --- | --- |
| NOT_EVALUATED × NO_CONFIRMED_SEVERITY_OR_UNASSESSED | 8 | b1-red, g1-page-red, g1-page-green, terms-red, terms-admitted, terms-proactive, tablecheck-terms, assistant-monotonic-timeline |

## 同用例多次运行

| 用例 | 第1次 | 第2次 | 第3次 | 第4次 |
| --- | --- | --- | --- | --- |
| UNKNOWN_CASE | b1-red: 未评; NOT_EVALUATED | — | — | — |
| restaurant:1c9b7f86a211ed74d0d623fa | g1-page-red: 未评; NOT_EVALUATED | g1-page-green: 未评; NOT_EVALUATED | terms-red: 未评; NOT_EVALUATED | terms-admitted: 未评; NOT_EVALUATED |
| restaurant:bd257d58a1d1321398e975da | terms-proactive: 未评; NOT_EVALUATED | tablecheck-terms: 未评; NOT_EVALUATED | assistant-monotonic-timeline: 未评; NOT_EVALUATED | — |

版本/Gold分层：

```json
[
  {
    "metadata": {
      "evaluatorVersion": null,
      "rubricVersion": null,
      "mode": "OFFLINE_LOCAL_CONSTRUCTED_SOURCES",
      "goldRevisionSha256": null
    },
    "runIds": [
      "b1-red"
    ]
  },
  {
    "metadata": {
      "evaluatorVersion": null,
      "rubricVersion": null,
      "mode": "WEB_READ",
      "goldRevisionSha256": null
    },
    "runIds": [
      "g1-page-red",
      "g1-page-green",
      "terms-red",
      "terms-admitted",
      "terms-proactive",
      "tablecheck-terms",
      "assistant-monotonic-timeline"
    ]
  }
]
```

## 体验分布

```json
{
  "elapsed": {
    "measured": 7,
    "unassessed": 1,
    "median": 52,
    "max": 2362
  },
  "firstEvidence": {
    "measured": 0,
    "unassessed": 8,
    "median": null,
    "max": null
  },
  "firstPresentation": {
    "measured": 0,
    "unassessed": 8,
    "median": null,
    "max": null
  },
  "delay": {
    "measured": 0,
    "unassessed": 8,
    "median": null,
    "max": null
  },
  "turnResponses": {
    "measured": 0,
    "unassessed": 15,
    "median": null,
    "max": null
  },
  "excessQuestions": {
    "observedTotal": null,
    "completeTotal": null,
    "unassessedRuns": 8
  },
  "missingQuestions": {
    "observedTotal": null,
    "completeTotal": null,
    "unassessedRuns": 8
  },
  "ordering": {
    "passed": 0,
    "deviated": 0,
    "notEvaluated": 0,
    "notApplicable": 8
  }
}
```
