# 运行诊断 5bd68be2-d5fc-4a84-b460-e3fe2dcb40c2

只定位和度量，不重新判定。时间展示 CET（UTC+1）；RUN_START_PROXY/服务端投影不等于用户发送/屏幕渲染。

结果：QUALIFIED_DELIVERY；用户目标：YES。

严重程度原记录：

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

首点：无确认偏离 / — / —；之前是否仍有未评：true。

## 环节链

| 环节 | 到达 | 判断 | 证据 |
| --- | --- | --- | --- |
| 理解请求 (UNDERSTANDING) | 到达 | 通过 | .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz#/materializedCase (sha256=239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz#/events/0 (sha256=239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9); .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kf-h001-a1.evaluation.29.21a3efaa-ef2f-4831-beef-865ca33f7eaf.json#/findings/0 (sha256=2d47111f9454f640ba08e1c3df4985cfc2db46a75ede5a1cf72305ac4d8d3e3c) |
| 地点 (LOCATION) | 到达 | 未评 |  |
| 发现 (DISCOVERY) | 到达 | 未评 | .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz#/finalSnapshot/domainState/candidates (sha256=239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz#/events/1 (sha256=239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz#/events/4 (sha256=239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9) |
| 身份 (IDENTITY) | 到达 | 未评 | .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/2 (sha256=239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/4 (sha256=239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/10 (sha256=239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/13 (sha256=239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/16 (sha256=239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9) |
| 事实/HARD (FACTS_HARD) | 到达 | 未评 | .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/3 (sha256=239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/5 (sha256=239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/6 (sha256=239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/11 (sha256=239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/14 (sha256=239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/17 (sha256=239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9) |
| 查位 (AVAILABILITY) | 到达 | 未评 | .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/12 (sha256=239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/15 (sha256=239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/18 (sha256=239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz#/finalSnapshot/domainState/availabilityChecks (sha256=239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz#/events/2 (sha256=239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz#/events/5 (sha256=239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9) |
| 展示 (PRESENTATION) | 到达 | 通过 | .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz#/finalSnapshot/domainState/presentedResults (sha256=239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz#/events/6 (sha256=239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9); .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kf-h001-a1.evaluation.29.21a3efaa-ef2f-4831-beef-865ca33f7eaf.json#/findings/3 (sha256=2d47111f9454f640ba08e1c3df4985cfc2db46a75ede5a1cf72305ac4d8d3e3c) |
| 选店 (SELECTION) | 未评 | 未评 |  |
| B1交接 (B1_HANDOFF) | 未评 | 未评 |  |
| 卡片条款 (CARD_TERMS) | 未评 | 未评 |  |
| 追问取页 (QUESTION_PAGE) | 未评 | 未评 |  |
| 追问作答 (QUESTION_ANSWER) | 未评 | 未评 |  |
| 结束 (ENDING) | 到达 | 通过 | .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz#/status (sha256=239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz#/loop (sha256=239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9); .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kf-h001-a1.evaluation.29.21a3efaa-ef2f-4831-beef-865ca33f7eaf.json#/findings/4 (sha256=2d47111f9454f640ba08e1c3df4985cfc2db46a75ede5a1cf72305ac4d8d3e3c) |

## 首个确认偏离

无记录。

## 见证覆盖观察

| 环节 | 确定性 | 范围/说明 | 证据 |
| --- | --- | --- | --- |
| 事实/HARD | CONFIRMED | Shibuya Sushi Matsumoto: Feasible witness coverage: facts/status = "NOT_READ"; not a run correctness or causal conclusion. | .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kf-h001-a1.evaluation.29.21a3efaa-ef2f-4831-beef-865ca33f7eaf.json#/witnessFunnel/0/facts/status (sha256=2d47111f9454f640ba08e1c3df4985cfc2db46a75ede5a1cf72305ac4d8d3e3c); .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kf-h001-a1.evaluation.29.21a3efaa-ef2f-4831-beef-865ca33f7eaf.json#/witnessFunnel/0/feasible (sha256=2d47111f9454f640ba08e1c3df4985cfc2db46a75ede5a1cf72305ac4d8d3e3c) |
| 事实/HARD | CONFIRMED | Shibuya Sushi Sen: Feasible witness coverage: facts/status = "NOT_READ"; not a run correctness or causal conclusion. | .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kf-h001-a1.evaluation.29.21a3efaa-ef2f-4831-beef-865ca33f7eaf.json#/witnessFunnel/1/facts/status (sha256=2d47111f9454f640ba08e1c3df4985cfc2db46a75ede5a1cf72305ac4d8d3e3c); .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kf-h001-a1.evaluation.29.21a3efaa-ef2f-4831-beef-865ca33f7eaf.json#/witnessFunnel/1/feasible (sha256=2d47111f9454f640ba08e1c3df4985cfc2db46a75ede5a1cf72305ac4d8d3e3c) |

## 推测瓶颈

| 环节 | 确定性 | 范围/说明 | 证据 |
| --- | --- | --- | --- |
| 事实/HARD | HYPOTHESIS | Shibuya Sushi Matsumoto: Candidate bottleneck at FACTS; recorded identity/fact acceptance is not an independent correctness score or causal confirmation | .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kf-h001-a1.evaluation.29.21a3efaa-ef2f-4831-beef-865ca33f7eaf.json#/witnessFunnel/0 (sha256=2d47111f9454f640ba08e1c3df4985cfc2db46a75ede5a1cf72305ac4d8d3e3c) |
| 事实/HARD | HYPOTHESIS | Shibuya Sushi Sen: Candidate bottleneck at FACTS; recorded identity/fact acceptance is not an independent correctness score or causal confirmation | .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kf-h001-a1.evaluation.29.21a3efaa-ef2f-4831-beef-865ca33f7eaf.json#/witnessFunnel/1 (sha256=2d47111f9454f640ba08e1c3df4985cfc2db46a75ede5a1cf72305ac4d8d3e3c) |

## 下游明确阻断与未定位判断

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
        "path": ".eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kf-h001-a1.evaluation.29.21a3efaa-ef2f-4831-beef-865ca33f7eaf.json",
        "sha256": "2d47111f9454f640ba08e1c3df4985cfc2db46a75ede5a1cf72305ac4d8d3e3c",
        "pointer": "/findings/5"
      }
    }
  ]
}
```

## 见证漏斗（原样）

| 见证店 | 原始漏斗行 |
| --- | --- |
| Shibuya Sushi Matsumoto | {"outletName":"Shibuya Sushi Matsumoto","sourceId":"13261619","discovery":{"status":"FOUND","candidateIds":["tabelog:en/tokyo/A1303/A130301/13261619"],"possibleCandidateIds":[],"basis":"Registered same-source outlet ID and name; explicit address conflicts still veto"},"identity":{"status":"OBSERVED","evidenceIds":["evidence:restaurant:tabelog-entity-match:775d5d0bcae8b6ce845de308"]},"facts":{"status":"NOT_READ","evidenceIds":[]},"availability":{"recorded":[{"candidateId":"tabelog:en/tokyo/A1303/A130301/13261619","status":"AVAILABLE"}],"witness":"AVAILABLE","observedAt":"2026-10-11T08:16:21.215Z","reason":"Raw recheck binds the request; reported inventory is not inferred from system check labels."},"presented":"YES","feasible":"SUPPORTED","blocker":{"stage":"FACTS","certainty":"HYPOTHESIS","reason":"Candidate bottleneck at FACTS; recorded identity/fact acceptance is not an independent correctness score or causal confirmation"},"evidenceRefs":[".eval-artifacts/p1-f-20261011/part-a/p1f-kf-h001-20261020/attempt-1.finish.json#sha256=660080f057897d10406d169b5558502912fdb281800539a1deb1d4860dbd4257",".eval-artifacts/p1-f-20261011/witnesses.p1f-20261011.json#sha256=1900217333acc30cef9026abe9da1199bbd62188d48773cb9f97b6c7f5856377",".eval-artifacts/p1-f-20261011/part-a/p1f-kf-h001-20261020/witness-raw/attempt-1-13261619.body.txt#sha256=0aade29efbe805dd741f78be1441a6c3bdff61443bf13ee70864b249ad301bfa",".eval-artifacts/p1-f-20261011/part-a/p1f-kf-h001-20261020/witness-raw/attempt-1-13261619.metadata.json#sha256=2fd961b5f1b6d6ee55dfdf293daeefd8b7f54f2784cc659c9fe82aa44db48f38","/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/e1-evaluator-20261016/witness-inputs.json#sha256=5fc5af629ff2550bf1be538abf029537003ac75d8bedd9f9fbcc0e6900a4d91e","materializedCase.acceptance.required_claims"]} |
| Shibuya Sushi Sen | {"outletName":"Shibuya Sushi Sen","sourceId":"13275802","discovery":{"status":"FOUND","candidateIds":["tabelog:en/tokyo/A1303/A130301/13275802"],"possibleCandidateIds":[],"basis":"Registered same-source outlet ID and name; explicit address conflicts still veto"},"identity":{"status":"OBSERVED","evidenceIds":["evidence:restaurant:tabelog-entity-match:4cec43c128772e161450bdee"]},"facts":{"status":"NOT_READ","evidenceIds":[]},"availability":{"recorded":[{"candidateId":"tabelog:en/tokyo/A1303/A130301/13275802","status":"AVAILABLE"}],"witness":"AVAILABLE","observedAt":"2026-10-11T08:16:21.577Z","reason":"Raw recheck binds the request; reported inventory is not inferred from system check labels."},"presented":"YES","feasible":"SUPPORTED","blocker":{"stage":"FACTS","certainty":"HYPOTHESIS","reason":"Candidate bottleneck at FACTS; recorded identity/fact acceptance is not an independent correctness score or causal confirmation"},"evidenceRefs":[".eval-artifacts/p1-f-20261011/part-a/p1f-kf-h001-20261020/attempt-1.finish.json#sha256=660080f057897d10406d169b5558502912fdb281800539a1deb1d4860dbd4257",".eval-artifacts/p1-f-20261011/witnesses.p1f-20261011.json#sha256=1900217333acc30cef9026abe9da1199bbd62188d48773cb9f97b6c7f5856377",".eval-artifacts/p1-f-20261011/part-a/p1f-kf-h001-20261020/witness-raw/attempt-1-13275802.body.txt#sha256=182a4d5b9f42187f86b07c5b28e15fcdd9af802b397aa1091997d77977ec99ea",".eval-artifacts/p1-f-20261011/part-a/p1f-kf-h001-20261020/witness-raw/attempt-1-13275802.metadata.json#sha256=72e1cd20cd47326065ce8d2760c0533a87af9c99e581daefe5327e6a7b3b3326","/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/e1-evaluator-20261016/witness-inputs.json#sha256=5fc5af629ff2550bf1be538abf029537003ac75d8bedd9f9fbcc0e6900a4d91e","materializedCase.acceptance.required_claims"]} |

## 体验指标（只报告，无门槛）

| 时间点/间隔 | 状态 | 毫秒 | 边界 |
| --- | --- | --- | --- |
| elapsed | MEASURED | 128253 | RECORDED_RUN_ELAPSED |
| evidence | MEASURED | 99285 | FINAL_CITED_SUPPORTED_SOURCE_OBSERVATION; NOT_STATE_ACCEPTANCE |
| presentation | MEASURED | 127987 | RUN_START_PROXY_TO_SERVER_PRESENTATION |
| delay | MEASURED | 28702 | OBSERVATION_TO_SERVER_PRESENTATION |

追问：多余 未评（NOT_EVALUATED）；缺失 未评（NOT_EVALUATED）。排序：不适用。

| 展示候选 | 条件 | 强度 | 原评测状态 | 支持来源类型 |
| --- | --- | --- | --- | --- |
| tabelog:en/tokyo/A1303/A130301/13275802 | omakase | HARD | NOT_CHECKED | 未评 |
| tabelog:en/tokyo/A1303/A130301/13261619 | omakase | HARD | NOT_CHECKED | 未评 |
| tabelog:en/tokyo/A1303/A130301/13225919 | omakase | HARD | NOT_CHECKED | 未评 |

拒绝动作：0；最长连续无新观察：1。

<details><summary>完整体验、耗时分解、引用与已有资源诊断</summary>

```json
{
  "experience": {
    "gateEffect": "NONE",
    "timing": {
      "startBasis": "RUN_START_PROXY",
      "absoluteTimesCET": {
        "runStart": "2026-10-11T09:14:12.197+01:00",
        "observationComplete": "2026-10-11T09:15:51.482+01:00",
        "serverPresentation": "2026-10-11T09:16:20.184+01:00"
      },
      "elapsed": {
        "status": "MEASURED",
        "value": 128253,
        "basis": "RECORDED_RUN_ELAPSED",
        "refs": [
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz",
            "sha256": "239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9",
            "pointer": "/startedAt"
          },
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz",
            "sha256": "239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9",
            "pointer": "/finishedAt"
          }
        ],
        "missing": []
      },
      "firstSupportedObservationComplete": {
        "status": "MEASURED",
        "value": 99285,
        "basis": "FINAL_CITED_SUPPORTED_SOURCE_OBSERVATION; NOT_STATE_ACCEPTANCE",
        "refs": [
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz",
            "sha256": "239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9",
            "pointer": "/finalSnapshot/domainState/readEvidence"
          },
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz",
            "sha256": "239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9",
            "pointer": "/finalSnapshot/domainState/presentedResults/evidenceIds"
          }
        ],
        "missing": []
      },
      "firstServerPresentation": {
        "status": "MEASURED",
        "value": 127987,
        "basis": "RUN_START_PROXY_TO_SERVER_PRESENTATION",
        "refs": [
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz",
            "sha256": "239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9",
            "pointer": "/startedAt"
          },
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz",
            "sha256": "239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9",
            "pointer": "/finalSnapshot/domainState/presentedResults/presentedAt"
          }
        ],
        "missing": []
      },
      "observationToPresentation": {
        "status": "MEASURED",
        "value": 28702,
        "basis": "OBSERVATION_TO_SERVER_PRESENTATION",
        "refs": [
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz",
            "sha256": "239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9",
            "pointer": "/finalSnapshot/domainState/readEvidence"
          },
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz",
            "sha256": "239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9",
            "pointer": "/finalSnapshot/domainState/presentedResults/evidenceIds"
          },
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz",
            "sha256": "239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9",
            "pointer": "/startedAt"
          },
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz",
            "sha256": "239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9",
            "pointer": "/finalSnapshot/domainState/presentedResults/presentedAt"
          }
        ],
        "missing": []
      },
      "acceptanceEvents": [
        {
          "type": "AVAILABILITY_CHECKED",
          "elapsedMs": 38813,
          "ref": {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz",
            "sha256": "239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9",
            "pointer": "/events/2"
          }
        },
        {
          "type": "AVAILABILITY_CHECKED",
          "elapsedMs": 126681,
          "ref": {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz",
            "sha256": "239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9",
            "pointer": "/events/5"
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
        "elapsedMs": 128253,
        "method": "Observed wall-time partition; model intervals override nested action/trace intervals. This is not a dependency-DAG critical-path proof.",
        "criticalPath": [
          {
            "stage": "DISCOVERY:DIRECTORY:SEARCH",
            "elapsedMs": 35149,
            "percent": 27.40598660460184
          },
          {
            "stage": "DISCOVERY:DIRECTORY:DETAIL",
            "elapsedMs": 26529,
            "percent": 20.684896259736615
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1303/A130301/13225919:REQUEST_AND_RESULT",
            "elapsedMs": 11496,
            "percent": 8.963533016771537
          },
          {
            "stage": "UNATTRIBUTED",
            "elapsedMs": 11180,
            "percent": 8.71714501805026
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1303/A130301/13261619:REQUEST_AND_RESULT",
            "elapsedMs": 8775,
            "percent": 6.841945217655727
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1303/A130301/13275802:REQUEST_AND_RESULT",
            "elapsedMs": 7794,
            "percent": 6.0770508292203695
          },
          {
            "stage": "FACTS:TABELOG:tabelog:en/tokyo/A1303/A130301/13308491",
            "elapsedMs": 5609,
            "percent": 4.373386977302675
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1303/A130301/13308491:REQUEST_AND_RESULT",
            "elapsedMs": 4745,
            "percent": 3.6997185251027265
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1303/A130301/13275802:RESOLUTION",
            "elapsedMs": 3949,
            "percent": 3.0790702751592556
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1303/A130301/13261619:RESOLUTION",
            "elapsedMs": 3496,
            "percent": 2.72586216306831
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1303/A130301/13225919:RESOLUTION",
            "elapsedMs": 3492,
            "percent": 2.7227433276414588
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1303/A130301/13308491:RESOLUTION",
            "elapsedMs": 3374,
            "percent": 2.630737682549336
          },
          {
            "stage": "FACTS",
            "elapsedMs": 1422,
            "percent": 1.1087459942457487
          },
          {
            "stage": "DISCOVERY:DIRECTORY:UNCLASSIFIED",
            "elapsedMs": 540,
            "percent": 0.4210427826249678
          },
          {
            "stage": "SEARCH_RESTAURANTS",
            "elapsedMs": 517,
            "percent": 0.40310947892057103
          },
          {
            "stage": "CHECK_AVAILABILITY",
            "elapsedMs": 185,
            "percent": 0.1442461384918871
          },
          {
            "stage": "PRESENTATION",
            "elapsedMs": 1,
            "percent": 0.0007797088567129034
          }
        ],
        "modelSteps": [
          {
            "purpose": "restaurant_semantic_interpret",
            "sequence": 1,
            "latencyMs": 1437,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 2,
            "latencyMs": 1410,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 3,
            "latencyMs": 1707,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 4,
            "latencyMs": 2087,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 5,
            "latencyMs": 1297,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 6,
            "latencyMs": 1851,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 7,
            "latencyMs": 1259,
            "placed": false
          },
          {
            "purpose": "restaurant_fact_judgment",
            "sequence": 8,
            "latencyMs": 1426,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 9,
            "latencyMs": 1370,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 10,
            "latencyMs": 1499,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 11,
            "latencyMs": 1458,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 12,
            "latencyMs": 1882,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 13,
            "latencyMs": 1298,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 14,
            "latencyMs": 1534,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 15,
            "latencyMs": 1158,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 16,
            "latencyMs": 2019,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 17,
            "latencyMs": 1482,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 18,
            "latencyMs": 1408,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 19,
            "latencyMs": 1300,
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
              "url": "https://tabelog.com/en/tokyo/A1303/rstLst/",
              "count": 2,
              "reloads": 1
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1303/A130301/13203305/",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1303/A130301/13308491/",
              "count": 3,
              "reloads": 2
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1303/A130302/13244783/",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1303/rstLst/sushi/",
              "count": 2,
              "reloads": 1
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1303/A130301/13275802/",
              "count": 2,
              "reloads": 1
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1303/A130302/13293501/",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1303/A130301/13261619/",
              "count": 2,
              "reloads": 1
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1303/A130302/13295650/",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1303/A130301/13225919/",
              "count": 2,
              "reloads": 1
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
          "value": 45209,
          "basis": "SOURCE_IO_OPERATION_PROXY_INCLUDES_BROWSER_PROCESSING",
          "refs": [
            {
              "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz",
              "sha256": "239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9",
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
          "value": 21208,
          "basis": "RECORDED_NON_NAVIGATION_OPERATION_UNION",
          "refs": [
            {
              "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h001-a1.result.json.gz",
              "sha256": "239782eb48608b3891a5c1743456dd81209dceadd8f873193c7422d5ea242bb9",
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
        "candidateId": "tabelog:en/tokyo/A1303/A130301/13275802",
        "criteria": [
          {
            "text": "omakase",
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
      },
      {
        "candidateId": "tabelog:en/tokyo/A1303/A130301/13261619",
        "criteria": [
          {
            "text": "omakase",
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
      },
      {
        "candidateId": "tabelog:en/tokyo/A1303/A130301/13225919",
        "criteria": [
          {
            "text": "omakase",
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
            "url": "https://tabelog.com/en/tokyo/A1303/rstLst/",
            "count": 2,
            "reloads": 1
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1303/A130301/13203305/",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1303/A130301/13308491/",
            "count": 3,
            "reloads": 2
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1303/A130302/13244783/",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1303/rstLst/sushi/",
            "count": 2,
            "reloads": 1
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1303/A130301/13275802/",
            "count": 2,
            "reloads": 1
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1303/A130302/13293501/",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1303/A130301/13261619/",
            "count": 2,
            "reloads": 1
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1303/A130302/13295650/",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1303/A130301/13225919/",
            "count": 2,
            "reloads": 1
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

</details>

## 已有独立核验（只限原范围）

```json
[]
```

## 未评与未完成

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

系统说发生了什么（不作偏离证据）：

```json
{
  "status": "SUCCEEDED",
  "startedAt": "2026-10-11T08:14:12.197Z",
  "finishedAt": "2026-10-11T08:16:20.450Z",
  "stage": "AGENT_LOOP",
  "failureCode": null,
  "noVerifiedResult": null,
  "availabilityChecks": {
    "tabelog:en/tokyo/A1303/A130301/13308491": {
      "status": "UNKNOWN",
      "checkedAt": "2026-10-11T08:14:50.963Z",
      "evidenceIds": [
        "evidence:restaurant:tabelog-entity-match:3de9acc2fa91216b44645c56",
        "evidence:restaurant:tabelog-hard-criteria:69e641e9c185f5c31774abe7"
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
      "requestFingerprint": "{\"date\":\"2026-10-20\",\"timeWindow\":{\"earliest\":\"19:00\",\"latest\":\"19:00\"},\"partySize\":2}"
    },
    "tabelog:en/tokyo/A1303/A130301/13275802": {
      "status": "AVAILABLE",
      "receptionMode": "RESERVATION_SUPPORTED",
      "checkedAt": "2026-10-11T08:15:51.482Z",
      "evidenceIds": [
        "evidence:restaurant:tabelog-entity-match:4cec43c128772e161450bdee",
        "evidence:restaurant:tabelog-hard-criteria:1a97b4e60e95653894dc17aa",
        "evidence:restaurant:tabelog-availability:a8fa98fd0c8a44d20b87d4a0"
      ],
      "displayExpiresAt": "2026-10-11T08:25:51.482Z",
      "freshnessPolicyVersion": "restaurant-availability-display-freshness@1",
      "sourceAttempts": [
        {
          "source": "TABELOG",
          "outcome": "AVAILABLE"
        }
      ],
      "sourceProvider": "TABELOG",
      "requestFingerprint": "{\"date\":\"2026-10-20\",\"timeWindow\":{\"earliest\":\"19:00\",\"latest\":\"19:00\"},\"partySize\":2}"
    },
    "tabelog:en/tokyo/A1303/A130301/13261619": {
      "status": "AVAILABLE",
      "receptionMode": "RESERVATION_SUPPORTED",
      "checkedAt": "2026-10-11T08:16:03.799Z",
      "evidenceIds": [
        "evidence:restaurant:tabelog-entity-match:775d5d0bcae8b6ce845de308",
        "evidence:restaurant:tabelog-hard-criteria:3491aab20725839c2f73866b",
        "evidence:restaurant:tabelog-availability:e44e6150131021ac9d121806"
      ],
      "displayExpiresAt": "2026-10-11T08:26:03.799Z",
      "freshnessPolicyVersion": "restaurant-availability-display-freshness@1",
      "sourceAttempts": [
        {
          "source": "TABELOG",
          "outcome": "AVAILABLE"
        }
      ],
      "sourceProvider": "TABELOG",
      "requestFingerprint": "{\"date\":\"2026-10-20\",\"timeWindow\":{\"earliest\":\"19:00\",\"latest\":\"19:00\"},\"partySize\":2}"
    },
    "tabelog:en/tokyo/A1303/A130301/13225919": {
      "status": "AVAILABLE",
      "receptionMode": "RESERVATION_SUPPORTED",
      "checkedAt": "2026-10-11T08:16:18.832Z",
      "evidenceIds": [
        "evidence:restaurant:tabelog-entity-match:b73cac25c165333368cd50f9",
        "evidence:restaurant:tabelog-hard-criteria:8487cf1e94ad3a3ac47feffc",
        "evidence:restaurant:tabelog-availability:d4221523fc75f3fb332bf2eb"
      ],
      "displayExpiresAt": "2026-10-11T08:26:18.832Z",
      "freshnessPolicyVersion": "restaurant-availability-display-freshness@1",
      "sourceAttempts": [
        {
          "source": "TABELOG",
          "outcome": "AVAILABLE"
        }
      ],
      "sourceProvider": "TABELOG",
      "requestFingerprint": "{\"date\":\"2026-10-20\",\"timeWindow\":{\"earliest\":\"19:00\",\"latest\":\"19:00\"},\"partySize\":2}"
    }
  },
  "selectedCandidateId": null,
  "bookingHandoffs": null,
  "pageQuestion": null
}
```
