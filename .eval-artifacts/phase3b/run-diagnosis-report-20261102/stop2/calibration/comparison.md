# 首点与时间校准

环节一致率：2/5。保留所有分歧，不把已归因分歧从分母删除。确定性差异另列。

| 运行 | 人工环节 | 报告首点 | 比对 | 说明 |
| --- | --- | --- | --- | --- |
| p1fA-kf-h001-a1 | 无 | 无确认偏离 | STAGE_MATCH | 一致 |
| p1fA-kf-h002-a1 | DISCOVERY | 无确认偏离 | HISTORICAL_SCOPE_DIFFERS_FROM_REVIEWED_FIRST_POINT_RULE | The approved rule explicitly selects no confirmed deviation for a qualified delivery without a confirmed deviation. The historical manual category describes discovery coverage, not that newly defined primary first point. Both values are retained; no label or evaluator result is changed. |
| p1fA-kf-h004-a1 | UNDERSTANDING | UNDERSTANDING | STAGE_MATCH | 一致 |
| p1fA-kagurazaka-a1 | AVAILABILITY | DISCOVERY | DISAGREEMENT_ATTRIBUTED_TO_EVALUATOR | Reviewer independently confirmed Chiso Konya is an existing TableCheck candidate with UNKNOWN availability; the old witness records Chisou Konya and its @29 cross-source identity matching misses the spelling. Disagreement belongs to evaluator witness matching, not a run-ID diagnosis rule. No roster or matching rule changed. |
| p1fA-nakameguro-a1 | DISCOVERY | 无确认偏离 | HISTORICAL_SCOPE_DIFFERS_FROM_REVIEWED_FIRST_POINT_RULE | The approved rule explicitly selects no confirmed deviation for a qualified delivery without a confirmed deviation. The historical manual category describes discovery coverage, not that newly defined primary first point. Both values are retained; no label or evaluator result is changed. |

## 时间逐项比对

```json
[
  {
    "runId": "p1fA-kf-h001-a1",
    "timings": [
      {
        "name": "observationComplete",
        "expected": 99,
        "observed": 99.285,
        "status": "WITHIN_TWO_SECONDS",
        "absoluteDifferenceSeconds": 0.2849999999999966
      },
      {
        "name": "presentation",
        "expected": 128,
        "observed": 127.987,
        "status": "WITHIN_TWO_SECONDS",
        "absoluteDifferenceSeconds": 0.01300000000000523
      }
    ]
  },
  {
    "runId": "p1fA-kf-h002-a1",
    "timings": [
      {
        "name": "observationComplete",
        "expected": 122,
        "observed": 122.051,
        "status": "WITHIN_TWO_SECONDS",
        "absoluteDifferenceSeconds": 0.05100000000000193
      },
      {
        "name": "presentation",
        "expected": 149,
        "observed": 148.895,
        "status": "WITHIN_TWO_SECONDS",
        "absoluteDifferenceSeconds": 0.10499999999998977
      }
    ]
  },
  {
    "runId": "p1fA-kf-h004-a1",
    "timings": [
      {
        "name": "observationComplete",
        "expected": 292,
        "observed": 292.402,
        "status": "WITHIN_TWO_SECONDS",
        "absoluteDifferenceSeconds": 0.4019999999999868
      },
      {
        "name": "presentation",
        "expected": 304,
        "observed": 304.149,
        "status": "WITHIN_TWO_SECONDS",
        "absoluteDifferenceSeconds": 0.1490000000000009
      }
    ]
  },
  {
    "runId": "p1fA-kagurazaka-a1",
    "timings": [
      {
        "name": "observationComplete",
        "observed": null,
        "status": "NOT_APPLICABLE",
        "absoluteDifferenceSeconds": null
      },
      {
        "name": "presentation",
        "observed": null,
        "status": "NOT_APPLICABLE",
        "absoluteDifferenceSeconds": null
      }
    ]
  },
  {
    "runId": "p1fA-nakameguro-a1",
    "timings": [
      {
        "name": "observationComplete",
        "expected": 208,
        "observed": 208.105,
        "status": "WITHIN_TWO_SECONDS",
        "absoluteDifferenceSeconds": 0.10499999999998977
      },
      {
        "name": "presentation",
        "expected": 247,
        "observed": 247.079,
        "status": "WITHIN_TWO_SECONDS",
        "absoluteDifferenceSeconds": 0.07900000000000773
      }
    ]
  }
]
```

不会修改结果类型、严重程度、Gold、人工标签或评测器。真实 A G6 多回合红灯对接仍未完成。
