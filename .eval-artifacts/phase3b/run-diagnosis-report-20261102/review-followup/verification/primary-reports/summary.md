# 跨运行诊断汇总

只读已有产物；不改判定，不设体验门槛。时间口径 CET。版本/Gold分层与原分母依据一并保留；总体分布仅描述，不代表不同版本可比。

## 分母

```json
{
  "counts": {
    "planned": 5,
    "received": 5,
    "started": 5,
    "finished": 5,
    "completed": 5,
    "interrupted": 0,
    "classificationAvailable": 5,
    "scorable": 5,
    "capabilityIncluded": 5
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
| NO_CONFIRMED_DEVIATION × NO_CONFIRMED_SEVERITY_OR_UNASSESSED | 3 | p1fA-kf-h001-a1, p1fA-kf-h002-a1, p1fA-nakameguro-a1 |
| UNDERSTANDING × S3 | 1 | p1fA-kf-h004-a1 |
| DISCOVERY × S2 | 1 | p1fA-kagurazaka-a1 |

## 见证覆盖观察（独立于首点）

| 环节 | 可行性 | 独立门店数 | 运行×门店次数 | 涉及运行 |
| --- | --- | --- | --- | --- |
| DISCOVERY | NOT_EVALUATED | 7 | 7 | p1fA-kf-h002-a1, p1fA-kf-h004-a1, p1fA-nakameguro-a1 |
| DISCOVERY | SUPPORTED | 3 | 3 | p1fA-kagurazaka-a1 |
| FACTS_HARD | SUPPORTED | 2 | 2 | p1fA-kf-h001-a1 |

已交付运行也纳入。SUPPORTED计已确认可行见证的缺口；NOT_EVALUATED仅为原始覆盖观察，不能计作可行缺口或确认偏离。门店数按sourceId去重，次数按运行×门店计，原漏斗指针在JSON中；不合并进首点或能力失败分母。

## 同用例多次运行

| 用例 | 第1次 |
| --- | --- |
| p1f-kf-h001-20261020 | p1fA-kf-h001-a1: QUALIFIED_DELIVERY; NO_CONFIRMED_DEVIATION |
| p1f-kf-h002-20261024 | p1fA-kf-h002-a1: QUALIFIED_DELIVERY; NO_CONFIRMED_DEVIATION |
| p1f-kf-h004-20261019 | p1fA-kf-h004-a1: QUALIFIED_DELIVERY; UNDERSTANDING |
| p1f-novel-kagurazaka-kaiseki-20261022 | p1fA-kagurazaka-a1: CAPABILITY_MISS; DISCOVERY |
| p1f-novel-nakameguro-yakiniku-20261023 | p1fA-nakameguro-a1: QUALIFIED_DELIVERY; NO_CONFIRMED_DEVIATION |

版本/Gold分层：

```json
[
  {
    "metadata": {
      "evaluatorVersion": "restaurant-hybrid-read-diagnostic-evaluator@29",
      "rubricVersion": "restaurant-hybrid-read-diagnostic-rubric@25",
      "mode": "HYBRID_LIVE_READ",
      "goldRevisionSha256": "1879c3189f90134f2ddb4cc78b12fcc31a0cd68e7b806a2baec43270e6f9f753"
    },
    "runIds": [
      "p1fA-kf-h001-a1",
      "p1fA-kf-h002-a1",
      "p1fA-kf-h004-a1",
      "p1fA-kagurazaka-a1",
      "p1fA-nakameguro-a1"
    ]
  }
]
```

## 体验分布

```json
{
  "elapsed": {
    "measured": 5,
    "unassessed": 0,
    "median": 247394,
    "max": 379101
  },
  "firstEvidence": {
    "measured": 4,
    "unassessed": 1,
    "median": 165078,
    "max": 292402
  },
  "firstPresentation": {
    "measured": 4,
    "unassessed": 1,
    "median": 197987,
    "max": 304149
  },
  "delay": {
    "measured": 4,
    "unassessed": 1,
    "median": 27773,
    "max": 38974
  },
  "turnResponses": {
    "measured": 0,
    "unassessed": 5,
    "median": null,
    "max": null
  },
  "excessQuestions": {
    "observedTotal": null,
    "completeTotal": null,
    "unassessedRuns": 5
  },
  "missingQuestions": {
    "observedTotal": null,
    "completeTotal": null,
    "unassessedRuns": 5
  },
  "ordering": {
    "passed": 0,
    "deviated": 0,
    "notEvaluated": 0,
    "notApplicable": 5
  }
}
```
