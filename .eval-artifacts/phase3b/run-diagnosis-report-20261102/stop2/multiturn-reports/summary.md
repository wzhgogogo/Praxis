# 跨运行诊断汇总

只读已有产物；不改判定，不设体验门槛。时间口径 CET。

## 分母

```json
{
  "planned": 8,
  "received": 8,
  "started": 0,
  "finished": 0,
  "completed": 0,
  "interrupted": 0,
  "classificationAvailable": 0,
  "scorable": 0,
  "capabilityIncluded": 0
}
```

## 首点 × 严重程度

| 首点 × 严重程度 | 次数 | 运行 ID |
| --- | --- | --- |
| NOT_EVALUATED × NO_CONFIRMED_SEVERITY_OR_UNASSESSED | 8 | b1-red, g1-page-red, g1-page-green, terms-red, terms-admitted, terms-proactive, tablecheck-terms, assistant-monotonic-timeline |

## 同用例多次运行

```json
[
  {
    "caseId": "UNKNOWN_CASE",
    "attempts": [
      {
        "runId": "b1-red",
        "artifactRunId": null,
        "outcome": null,
        "firstPoint": {
          "status": "NOT_EVALUATED",
          "stage": null,
          "certainty": null,
          "column": null,
          "earliestKnownOnly": true
        },
        "evaluation": null,
        "version": {
          "evaluatorVersion": null,
          "rubricVersion": null,
          "goldCorrection": null,
          "mode": "OFFLINE_LOCAL_CONSTRUCTED_SOURCES"
        }
      }
    ]
  },
  {
    "caseId": "restaurant:1c9b7f86a211ed74d0d623fa",
    "attempts": [
      {
        "runId": "g1-page-red",
        "artifactRunId": "run:restaurant:1c9b7f86a211ed74d0d623fa",
        "outcome": null,
        "firstPoint": {
          "status": "NOT_EVALUATED",
          "stage": null,
          "certainty": null,
          "column": null,
          "earliestKnownOnly": true
        },
        "evaluation": null,
        "version": {
          "evaluatorVersion": null,
          "rubricVersion": null,
          "goldCorrection": null,
          "mode": "WEB_READ"
        }
      },
      {
        "runId": "g1-page-green",
        "artifactRunId": "run:restaurant:1c9b7f86a211ed74d0d623fa",
        "outcome": null,
        "firstPoint": {
          "status": "NOT_EVALUATED",
          "stage": null,
          "certainty": null,
          "column": null,
          "earliestKnownOnly": true
        },
        "evaluation": null,
        "version": {
          "evaluatorVersion": null,
          "rubricVersion": null,
          "goldCorrection": null,
          "mode": "WEB_READ"
        }
      },
      {
        "runId": "terms-red",
        "artifactRunId": "run:restaurant:1c9b7f86a211ed74d0d623fa",
        "outcome": null,
        "firstPoint": {
          "status": "NOT_EVALUATED",
          "stage": null,
          "certainty": null,
          "column": null,
          "earliestKnownOnly": true
        },
        "evaluation": null,
        "version": {
          "evaluatorVersion": null,
          "rubricVersion": null,
          "goldCorrection": null,
          "mode": "WEB_READ"
        }
      },
      {
        "runId": "terms-admitted",
        "artifactRunId": "run:restaurant:1c9b7f86a211ed74d0d623fa",
        "outcome": null,
        "firstPoint": {
          "status": "NOT_EVALUATED",
          "stage": null,
          "certainty": null,
          "column": null,
          "earliestKnownOnly": true
        },
        "evaluation": null,
        "version": {
          "evaluatorVersion": null,
          "rubricVersion": null,
          "goldCorrection": null,
          "mode": "WEB_READ"
        }
      }
    ]
  },
  {
    "caseId": "restaurant:bd257d58a1d1321398e975da",
    "attempts": [
      {
        "runId": "terms-proactive",
        "artifactRunId": "run:restaurant:bd257d58a1d1321398e975da",
        "outcome": null,
        "firstPoint": {
          "status": "NOT_EVALUATED",
          "stage": null,
          "certainty": null,
          "column": null,
          "earliestKnownOnly": true
        },
        "evaluation": null,
        "version": {
          "evaluatorVersion": null,
          "rubricVersion": null,
          "goldCorrection": null,
          "mode": "WEB_READ"
        }
      },
      {
        "runId": "tablecheck-terms",
        "artifactRunId": "run:restaurant:bd257d58a1d1321398e975da",
        "outcome": null,
        "firstPoint": {
          "status": "NOT_EVALUATED",
          "stage": null,
          "certainty": null,
          "column": null,
          "earliestKnownOnly": true
        },
        "evaluation": null,
        "version": {
          "evaluatorVersion": null,
          "rubricVersion": null,
          "goldCorrection": null,
          "mode": "WEB_READ"
        }
      },
      {
        "runId": "assistant-monotonic-timeline",
        "artifactRunId": "run:restaurant:bd257d58a1d1321398e975da",
        "outcome": null,
        "firstPoint": {
          "status": "NOT_EVALUATED",
          "stage": null,
          "certainty": null,
          "column": null,
          "earliestKnownOnly": true
        },
        "evaluation": null,
        "version": {
          "evaluatorVersion": null,
          "rubricVersion": null,
          "goldCorrection": null,
          "mode": "WEB_READ"
        }
      }
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
