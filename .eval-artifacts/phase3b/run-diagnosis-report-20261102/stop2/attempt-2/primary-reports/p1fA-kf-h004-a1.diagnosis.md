# 运行诊断 97767eac-8aa0-463b-aec0-1a69c25cdc7a

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
    "status": "PRESENT",
    "reasons": [
      "R1: supported recommendation delivered through unnecessary availability investigation; goal-process drift remains a recorded defect, not an unmet result."
    ],
    "evidenceRefs": [
      "materializedCase.semantic.target",
      "finalSnapshot.domainState.intentDraft.target",
      "trajectories"
    ]
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

首点：偏离 / 理解请求 / CONFIRMED；之前是否仍有未评：false。

## 环节链

| 环节 | 到达 | 判断 | 证据 |
| --- | --- | --- | --- |
| 理解请求 (UNDERSTANDING) | 到达 | 偏离 | .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/materializedCase (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/events/0 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kf-h004-a1.evaluation.29.010f91ff-4f69-40f5-8f03-e28c5799b944.json#/findings/0 (sha256=78cb532392e7f7905c5dcfd2320c18a0932ba66685e6bf33eca5058146ea3b5a) |
| 地点 (LOCATION) | 到达 | 未评 | .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/resolvedEvalLocation (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/events/1 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda) |
| 发现 (DISCOVERY) | 到达 | 未评 | .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/candidates (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/events/2 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/events/7 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda) |
| 身份 (IDENTITY) | 到达 | 未评 | .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/5 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/6 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/7 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/8 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/9 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/10 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/13 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/16 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/19 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/22 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/30 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/31 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/33 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/34 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/37 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/40 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda) |
| 事实/HARD (FACTS_HARD) | 到达 | 未评 | .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/11 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/12 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/14 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/15 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/17 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/18 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/20 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/21 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/23 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/24 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/35 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/36 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/38 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/39 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/41 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/42 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda) |
| 查位 (AVAILABILITY) | 到达 | 未评 | .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/32 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/availabilityChecks (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/events/3 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/events/4 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/events/8 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda) |
| 展示 (PRESENTATION) | 到达 | 通过 | .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/finalSnapshot/domainState/presentedResults (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/events/11 (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kf-h004-a1.evaluation.29.010f91ff-4f69-40f5-8f03-e28c5799b944.json#/findings/3 (sha256=78cb532392e7f7905c5dcfd2320c18a0932ba66685e6bf33eca5058146ea3b5a) |
| 选店 (SELECTION) | 未评 | 未评 |  |
| B1交接 (B1_HANDOFF) | 未评 | 未评 |  |
| 卡片条款 (CARD_TERMS) | 未评 | 未评 |  |
| 追问取页 (QUESTION_PAGE) | 未评 | 未评 |  |
| 追问作答 (QUESTION_ANSWER) | 未评 | 未评 |  |
| 结束 (ENDING) | 到达 | 通过 | .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/status (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz#/loop (sha256=9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda); .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kf-h004-a1.evaluation.29.010f91ff-4f69-40f5-8f03-e28c5799b944.json#/findings/4 (sha256=78cb532392e7f7905c5dcfd2320c18a0932ba66685e6bf33eca5058146ea3b5a) |

## 首个确认偏离

| 环节 | 确定性 | 范围/说明 | 证据 |
| --- | --- | --- | --- |
| 理解请求 | CONFIRMED | RUN: The recorded authoritative request conflicts with the materialized request. | .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kf-h004-a1.evaluation.29.010f91ff-4f69-40f5-8f03-e28c5799b944.json#/findings/0 (sha256=78cb532392e7f7905c5dcfd2320c18a0932ba66685e6bf33eca5058146ea3b5a) |

## 见证覆盖观察

无记录。

## 推测瓶颈

无记录。

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
        "path": ".eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kf-h004-a1.evaluation.29.010f91ff-4f69-40f5-8f03-e28c5799b944.json",
        "sha256": "78cb532392e7f7905c5dcfd2320c18a0932ba66685e6bf33eca5058146ea3b5a",
        "pointer": "/findings/5"
      }
    }
  ]
}
```

## 见证漏斗（原样）

| 见证店 | 原始漏斗行 |
| --- | --- |
| Bunmeidou Cafe Higashi-ginza | {"outletName":"Bunmeidou Cafe Higashi-ginza","sourceId":"13002369","discovery":{"status":"NOT_FOUND","candidateIds":[],"possibleCandidateIds":[],"basis":"Cross-source name AND address; no phone or production eligibility oracle"},"identity":{"status":"NOT_EVALUATED","evidenceIds":[]},"facts":{"status":"NOT_EVALUATED","evidenceIds":[]},"availability":{"recorded":[],"witness":"NOT_EVALUATED","observedAt":null,"reason":"Registered witness has no raw recheck observation; old roster slot text is not current inventory."},"presented":"NO","feasible":"NOT_EVALUATED","blocker":{"stage":"NOT_EVALUATED","certainty":"HYPOTHESIS","reason":"Independent discovery/identity/availability Gold is incomplete; do not label an unknown stage as a confirmed bottleneck"},"evidenceRefs":[".eval-artifacts/p1-f-20261011/part-a/p1f-kf-h004-20261019/attempt-1.finish.json#sha256=007057b14eabe45d78967c8fd777c785ab6ba1a88f7a1334b14c3cadc61000c7",".eval-artifacts/p1-f-20261011/witnesses.p1f-20261011.json#sha256=1900217333acc30cef9026abe9da1199bbd62188d48773cb9f97b6c7f5856377","/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/e1-evaluator-20261016/witness-inputs.json#sha256=5fc5af629ff2550bf1be538abf029537003ac75d8bedd9f9fbcc0e6900a4d91e","materializedCase.acceptance.required_claims"]} |
| Tiffany Blue Box Cafe | {"outletName":"Tiffany Blue Box Cafe","sourceId":"13310761","discovery":{"status":"FOUND","candidateIds":["tabelog:en/tokyo/A1301/A130101/13310761"],"possibleCandidateIds":[],"basis":"Registered same-source outlet ID and name; explicit address conflicts still veto"},"identity":{"status":"OBSERVED","evidenceIds":["evidence:restaurant:tabelog-entity-match:1e014480dd0a7b625e0d746b","evidence:restaurant:native-fact-identity:5e554ba49cd8cd9cbdad3470"]},"facts":{"status":"OBSERVED","evidenceIds":["tabelog:en/tokyo/A1301/A130101/13310761:document:1749f735cda6adc0"]},"availability":{"recorded":[{"candidateId":"tabelog:en/tokyo/A1301/A130101/13310761","status":"UNKNOWN","reasonCode":"REQUEST_SELECTION_UNCONFIRMED"}],"witness":"NOT_EVALUATED","observedAt":null,"reason":"Registered witness has no raw recheck observation; old roster slot text is not current inventory."},"presented":"NO","feasible":"NOT_EVALUATED","blocker":{"stage":"NOT_EVALUATED","certainty":"HYPOTHESIS","reason":"Independent discovery/identity/availability Gold is incomplete; do not label an unknown stage as a confirmed bottleneck"},"evidenceRefs":[".eval-artifacts/p1-f-20261011/part-a/p1f-kf-h004-20261019/attempt-1.finish.json#sha256=007057b14eabe45d78967c8fd777c785ab6ba1a88f7a1334b14c3cadc61000c7",".eval-artifacts/p1-f-20261011/witnesses.p1f-20261011.json#sha256=1900217333acc30cef9026abe9da1199bbd62188d48773cb9f97b6c7f5856377","/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/e1-evaluator-20261016/witness-inputs.json#sha256=5fc5af629ff2550bf1be538abf029537003ac75d8bedd9f9fbcc0e6900a4d91e","materializedCase.acceptance.required_claims"]} |
| LE CAFE V | {"outletName":"LE CAFE V","sourceId":"13257245","discovery":{"status":"FOUND","candidateIds":["tabelog:en/tokyo/A1301/A130101/13257245"],"possibleCandidateIds":[],"basis":"Registered same-source outlet ID and name; explicit address conflicts still veto"},"identity":{"status":"OBSERVED","evidenceIds":["evidence:restaurant:native-fact-identity:95c971a7362ec36b60010d69"]},"facts":{"status":"OBSERVED","evidenceIds":["tabelog:en/tokyo/A1301/A130101/13257245:document:21b9af4c39366bc9"]},"availability":{"recorded":[],"witness":"NOT_EVALUATED","observedAt":null,"reason":"Registered witness has no raw recheck observation; old roster slot text is not current inventory."},"presented":"NO","feasible":"NOT_EVALUATED","blocker":{"stage":"NOT_EVALUATED","certainty":"HYPOTHESIS","reason":"Independent discovery/identity/availability Gold is incomplete; do not label an unknown stage as a confirmed bottleneck"},"evidenceRefs":[".eval-artifacts/p1-f-20261011/part-a/p1f-kf-h004-20261019/attempt-1.finish.json#sha256=007057b14eabe45d78967c8fd777c785ab6ba1a88f7a1334b14c3cadc61000c7",".eval-artifacts/p1-f-20261011/witnesses.p1f-20261011.json#sha256=1900217333acc30cef9026abe9da1199bbd62188d48773cb9f97b6c7f5856377","/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/e1-evaluator-20261016/witness-inputs.json#sha256=5fc5af629ff2550bf1be538abf029537003ac75d8bedd9f9fbcc0e6900a4d91e","materializedCase.acceptance.required_claims"]} |

## 体验指标（只报告，无门槛）

| 时间点/间隔 | 状态 | 毫秒 | 边界 |
| --- | --- | --- | --- |
| elapsed | MEASURED | 304406 | RECORDED_RUN_ELAPSED |
| evidence | MEASURED | 292402 | FINAL_CITED_SUPPORTED_SOURCE_OBSERVATION; NOT_STATE_ACCEPTANCE |
| presentation | MEASURED | 304149 | RUN_START_PROXY_TO_SERVER_PRESENTATION |
| delay | MEASURED | 11747 | OBSERVATION_TO_SERVER_PRESENTATION |

追问：多余 未评（NOT_EVALUATED）；缺失 未评（NOT_EVALUATED）。排序：不适用。

| 展示候选 | 条件 | 强度 | 原评测状态 | 支持来源类型 |
| --- | --- | --- | --- | --- |
| tabelog:en/tokyo/A1301/A130101/13002704 | cafe | HARD | MET | 未评 |
| tabelog:en/tokyo/A1301/A130101/13002704 | good for meeting a friend | UNSPECIFIED | NOT_CHECKED | 未评 |

拒绝动作：3；最长连续无新观察：3。

<details><summary>完整体验、耗时分解、引用与已有资源诊断</summary>

```json
{
  "experience": {
    "gateEffect": "NONE",
    "timing": {
      "startBasis": "RUN_START_PROXY",
      "absoluteTimesCET": {
        "runStart": "2026-10-11T09:22:34.575+01:00",
        "observationComplete": "2026-10-11T09:27:26.977+01:00",
        "serverPresentation": "2026-10-11T09:27:38.724+01:00"
      },
      "elapsed": {
        "status": "MEASURED",
        "value": 304406,
        "basis": "RECORDED_RUN_ELAPSED",
        "refs": [
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz",
            "sha256": "9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda",
            "pointer": "/startedAt"
          },
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz",
            "sha256": "9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda",
            "pointer": "/finishedAt"
          }
        ],
        "missing": []
      },
      "firstSupportedObservationComplete": {
        "status": "MEASURED",
        "value": 292402,
        "basis": "FINAL_CITED_SUPPORTED_SOURCE_OBSERVATION; NOT_STATE_ACCEPTANCE",
        "refs": [
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz",
            "sha256": "9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda",
            "pointer": "/finalSnapshot/domainState/readEvidence"
          },
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz",
            "sha256": "9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda",
            "pointer": "/finalSnapshot/domainState/presentedResults/evidenceIds"
          }
        ],
        "missing": []
      },
      "firstServerPresentation": {
        "status": "MEASURED",
        "value": 304149,
        "basis": "RUN_START_PROXY_TO_SERVER_PRESENTATION",
        "refs": [
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz",
            "sha256": "9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda",
            "pointer": "/startedAt"
          },
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz",
            "sha256": "9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda",
            "pointer": "/finalSnapshot/domainState/presentedResults/presentedAt"
          }
        ],
        "missing": []
      },
      "observationToPresentation": {
        "status": "MEASURED",
        "value": 11747,
        "basis": "OBSERVATION_TO_SERVER_PRESENTATION",
        "refs": [
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz",
            "sha256": "9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda",
            "pointer": "/finalSnapshot/domainState/readEvidence"
          },
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz",
            "sha256": "9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda",
            "pointer": "/finalSnapshot/domainState/presentedResults/evidenceIds"
          },
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz",
            "sha256": "9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda",
            "pointer": "/startedAt"
          },
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz",
            "sha256": "9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda",
            "pointer": "/finalSnapshot/domainState/presentedResults/presentedAt"
          }
        ],
        "missing": []
      },
      "acceptanceEvents": [
        {
          "type": "AVAILABILITY_CHECKED",
          "elapsedMs": 113098,
          "ref": {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz",
            "sha256": "9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda",
            "pointer": "/events/3"
          }
        },
        {
          "type": "AVAILABILITY_CHECKED",
          "elapsedMs": 149031,
          "ref": {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz",
            "sha256": "9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda",
            "pointer": "/events/4"
          }
        },
        {
          "type": "AVAILABILITY_CHECKED",
          "elapsedMs": 284876,
          "ref": {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz",
            "sha256": "9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda",
            "pointer": "/events/8"
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
        "elapsedMs": 304406,
        "method": "Observed wall-time partition; model intervals override nested action/trace intervals. This is not a dependency-DAG critical-path proof.",
        "criticalPath": [
          {
            "stage": "DISCOVERY:DIRECTORY:DETAIL",
            "elapsedMs": 62950,
            "percent": 20.679618667174758
          },
          {
            "stage": "DISCOVERY:DIRECTORY:SEARCH",
            "elapsedMs": 18452,
            "percent": 6.061641360551369
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1301/A130102/13043019:REQUEST_AND_RESULT",
            "elapsedMs": 16308,
            "percent": 5.357318843912406
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1301/A130101/13310761:REQUEST_AND_RESULT",
            "elapsedMs": 15648,
            "percent": 5.140503143827651
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1301/A130101/13002369:REQUEST_AND_RESULT",
            "elapsedMs": 13955,
            "percent": 4.584338022246605
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1301/A130103/13002648:REQUEST_AND_RESULT",
            "elapsedMs": 12015,
            "percent": 3.947031267452021
          },
          {
            "stage": "UNATTRIBUTED",
            "elapsedMs": 10582,
            "percent": 3.4762783913589086
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1301/A130103/13002648:RESOLUTION",
            "elapsedMs": 10088,
            "percent": 3.3139951249318345
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1301/A130101/13002704:RESOLUTION",
            "elapsedMs": 9376,
            "percent": 3.0800969757494925
          },
          {
            "stage": "FACTS:TABELOG:tabelog:en/tokyo/A1301/A130102/13043019",
            "elapsedMs": 8921,
            "percent": 2.9306255461456083
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1301/A130101/13002369:RESOLUTION",
            "elapsedMs": 8506,
            "percent": 2.7942944620014063
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1301/A130102/13043019:RESOLUTION",
            "elapsedMs": 8439,
            "percent": 2.7722843833564386
          },
          {
            "stage": "FACTS:TABELOG:tabelog:en/tokyo/A1301/A130101/13310761",
            "elapsedMs": 8275,
            "percent": 2.718408966971742
          },
          {
            "stage": "FACTS:TABELOG:tabelog:en/tokyo/A1301/A130102/13262740",
            "elapsedMs": 7755,
            "percent": 2.547584475995874
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1301/A130101/13002704:REQUEST_AND_RESULT",
            "elapsedMs": 7699,
            "percent": 2.529187992352319
          },
          {
            "stage": "FACTS:TABELOG:tabelog:en/tokyo/A1301/A130103/13002564",
            "elapsedMs": 7602,
            "percent": 2.49732265461259
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1301/A130103/13002564:RESOLUTION",
            "elapsedMs": 7453,
            "percent": 2.4483748677752737
          },
          {
            "stage": "FACTS:TABELOG:tabelog:en/tokyo/A1301/A130103/13002648",
            "elapsedMs": 7435,
            "percent": 2.4424617123184165
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1301/A130102/13262740:RESOLUTION",
            "elapsedMs": 7386,
            "percent": 2.4263647891303064
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1301/A130101/13310761:RESOLUTION",
            "elapsedMs": 7155,
            "percent": 2.350479294100642
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1301/A130101/13186583:REQUEST_AND_RESULT",
            "elapsedMs": 6237,
            "percent": 2.0489083658009366
          },
          {
            "stage": "FACTS:TABELOG:tabelog:en/tokyo/A1301/A130101/13002704",
            "elapsedMs": 6007,
            "percent": 1.9733513794077644
          },
          {
            "stage": "CHECK_AVAILABILITY",
            "elapsedMs": 5297,
            "percent": 1.7401102474984067
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1301/A130101/13186583:RESOLUTION",
            "elapsedMs": 5077,
            "percent": 1.667838347470155
          },
          {
            "stage": "FACTS",
            "elapsedMs": 5068,
            "percent": 1.6648817697417266
          },
          {
            "stage": "FACTS:TABELOG:tabelog:en/tokyo/A1301/A130101/13257245",
            "elapsedMs": 5030,
            "percent": 1.6523984415550284
          },
          {
            "stage": "FACTS:TABELOG:tabelog:en/tokyo/A1301/A130101/13227099",
            "elapsedMs": 4925,
            "percent": 1.6179050347233628
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1301/A130102/13262740:REQUEST_AND_RESULT",
            "elapsedMs": 4635,
            "percent": 1.5226375301406674
          },
          {
            "stage": "AVAILABILITY:TABELOG:tabelog:en/tokyo/A1301/A130103/13002564:REQUEST_AND_RESULT",
            "elapsedMs": 3665,
            "percent": 1.2039841527433754
          },
          {
            "stage": "END_READ",
            "elapsedMs": 1660,
            "percent": 0.5453243365768086
          },
          {
            "stage": "SEARCH_RESTAURANTS",
            "elapsedMs": 435,
            "percent": 0.14290125687404323
          },
          {
            "stage": "DISCOVERY:DIRECTORY:UNCLASSIFIED",
            "elapsedMs": 367,
            "percent": 0.12056266959258359
          },
          {
            "stage": "PRESENTATION",
            "elapsedMs": 3,
            "percent": 0.00098552590947616
          }
        ],
        "modelSteps": [
          {
            "purpose": "restaurant_semantic_interpret",
            "sequence": 1,
            "latencyMs": 2055,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 2,
            "latencyMs": 1340,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 3,
            "latencyMs": 1405,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 4,
            "latencyMs": 1920,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 5,
            "latencyMs": 997,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 6,
            "latencyMs": 1052,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 7,
            "latencyMs": 1154,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 8,
            "latencyMs": 1462,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 9,
            "latencyMs": 1047,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 10,
            "latencyMs": 1232,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 11,
            "latencyMs": 1455,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 12,
            "latencyMs": 1508,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 13,
            "latencyMs": 1737,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 14,
            "latencyMs": 1453,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 15,
            "latencyMs": 1673,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 16,
            "latencyMs": 1626,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 17,
            "latencyMs": 1700,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 18,
            "latencyMs": 1363,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 19,
            "latencyMs": 1402,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 20,
            "latencyMs": 1464,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 21,
            "latencyMs": 1490,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 22,
            "latencyMs": 2250,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 23,
            "latencyMs": 1755,
            "placed": false
          },
          {
            "purpose": "restaurant_fact_judgment",
            "sequence": 24,
            "latencyMs": 1567,
            "placed": false
          },
          {
            "purpose": "restaurant_fact_judgment",
            "sequence": 25,
            "latencyMs": 1405,
            "placed": false
          },
          {
            "purpose": "restaurant_fact_judgment",
            "sequence": 26,
            "latencyMs": 1592,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 27,
            "latencyMs": 1222,
            "placed": false
          },
          {
            "purpose": "restaurant_fact_judgment",
            "sequence": 28,
            "latencyMs": 1464,
            "placed": false
          },
          {
            "purpose": "restaurant_fact_judgment",
            "sequence": 29,
            "latencyMs": 1409,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 30,
            "latencyMs": 1791,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 31,
            "latencyMs": 1482,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 32,
            "latencyMs": 1675,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 33,
            "latencyMs": 1653,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 34,
            "latencyMs": 1707,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 35,
            "latencyMs": 1503,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 36,
            "latencyMs": 1122,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 37,
            "latencyMs": 1147,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 38,
            "latencyMs": 1203,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 39,
            "latencyMs": 1149,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 40,
            "latencyMs": 1973,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 41,
            "latencyMs": 1331,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 42,
            "latencyMs": 1054,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 43,
            "latencyMs": 1509,
            "placed": false
          },
          {
            "purpose": "restaurant_fact_judgment",
            "sequence": 44,
            "latencyMs": 1405,
            "placed": false
          },
          {
            "purpose": "restaurant_fact_judgment",
            "sequence": 45,
            "latencyMs": 1275,
            "placed": false
          },
          {
            "purpose": "restaurant_fact_judgment",
            "sequence": 46,
            "latencyMs": 1281,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 47,
            "latencyMs": 1643,
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
              "url": "https://tabelog.com/en/tokyo/A1301/rstLst/",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1301/A130101/13310761/",
              "count": 3,
              "reloads": 2
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1301/A130102/13043019/",
              "count": 3,
              "reloads": 2
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1301/A130103/13002564/",
              "count": 3,
              "reloads": 2
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1301/A130103/13002648/",
              "count": 3,
              "reloads": 2
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1301/A130102/13262740/",
              "count": 3,
              "reloads": 2
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1301/A130101/13002369/",
              "count": 2,
              "reloads": 1
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1301/A130101/13257245/",
              "count": 2,
              "reloads": 1
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1301/A130101/13002704/",
              "count": 3,
              "reloads": 2
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1301/A130101/13186583/",
              "count": 2,
              "reloads": 1
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1301/A130101/13227099/",
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
          "value": 154755,
          "basis": "SOURCE_IO_OPERATION_PROXY_INCLUDES_BROWSER_PROCESSING",
          "refs": [
            {
              "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz",
              "sha256": "9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda",
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
          "value": 33382,
          "basis": "RECORDED_NON_NAVIGATION_OPERATION_UNION",
          "refs": [
            {
              "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kf-h004-a1.result.json.gz",
              "sha256": "9d4aa78310895ccee7c28a24e76cc32a1874a82c0ce5ac36194717eadbd18eda",
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
        "candidateId": "tabelog:en/tokyo/A1301/A130101/13002704",
        "criteria": [
          {
            "text": "cafe",
            "polarity": "POSITIVE",
            "strength": "HARD",
            "evidenceRefs": [
              "materializedCase.semantic.criteria[0]",
              "finalSnapshot.domainState.readEvidence[evidenceId=tabelog:en/tokyo/A1301/A130101/13002704:document:c77b44b228da970d]"
            ],
            "status": "MET",
            "basis": [
              "Recorded source statement: Noa Cafe Ginza（NOA CAFE） - Ginza(Cafe)",
              "Recorded source statement: Cafe",
              "Recorded source statement: Kissa (Japanese coffee shop)"
            ]
          },
          {
            "text": "good for meeting a friend",
            "polarity": "POSITIVE",
            "strength": "UNSPECIFIED",
            "evidenceRefs": [
              "materializedCase.semantic.criteria[1]"
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
      "rejectedActions": 3,
      "maxConsecutiveNoNewObservation": 3,
      "noNewObservationRuns": [
        {
          "key": "80b2401a77fb6d5a",
          "steps": [
            6,
            7,
            8
          ]
        }
      ],
      "sameFailureRuns": [
        {
          "key": "80b2401a77fb6d5a:CHECK_AVAILABILITY:TABELOG:AVAILABILITY_SOURCES_EXHAUSTED",
          "steps": [
            2,
            3,
            10
          ]
        },
        {
          "key": "80b2401a77fb6d5a:CHECK_AVAILABILITY:UNRECORDED_SOURCE:REJECTED",
          "steps": [
            6,
            7
          ]
        }
      ],
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
            "url": "https://tabelog.com/en/tokyo/A1301/rstLst/",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1301/A130101/13310761/",
            "count": 3,
            "reloads": 2
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1301/A130102/13043019/",
            "count": 3,
            "reloads": 2
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1301/A130103/13002564/",
            "count": 3,
            "reloads": 2
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1301/A130103/13002648/",
            "count": 3,
            "reloads": 2
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1301/A130102/13262740/",
            "count": 3,
            "reloads": 2
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1301/A130101/13002369/",
            "count": 2,
            "reloads": 1
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1301/A130101/13257245/",
            "count": 2,
            "reloads": 1
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1301/A130101/13002704/",
            "count": 3,
            "reloads": 2
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1301/A130101/13186583/",
            "count": 2,
            "reloads": 1
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1301/A130101/13227099/",
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
  "startedAt": "2026-10-11T08:22:34.575Z",
  "finishedAt": "2026-10-11T08:27:38.981Z",
  "stage": "AGENT_LOOP",
  "failureCode": null,
  "noVerifiedResult": null,
  "availabilityChecks": {
    "tabelog:en/tokyo/A1301/A130101/13310761": {
      "status": "UNKNOWN",
      "checkedAt": "2026-10-11T08:23:51.639Z",
      "evidenceIds": [
        "evidence:restaurant:tabelog-entity-match:1e014480dd0a7b625e0d746b"
      ],
      "reasonCode": "REQUEST_SELECTION_UNCONFIRMED",
      "sourceAttempts": [
        {
          "source": "TABELOG",
          "outcome": "FAILED",
          "reasonCode": "REQUEST_SELECTION_UNCONFIRMED"
        }
      ],
      "sourceProvider": "TABELOG",
      "requestFingerprint": "{\"date\":\"2026-10-19\",\"timeWindow\":{\"earliest\":\"12:00\",\"latest\":\"17:00\"},\"partySize\":2}"
    },
    "tabelog:en/tokyo/A1301/A130102/13043019": {
      "status": "UNKNOWN",
      "checkedAt": "2026-10-11T08:24:16.446Z",
      "evidenceIds": [
        "evidence:restaurant:tabelog-entity-match:5ee44fd0dbd2a54d224cceb1"
      ],
      "reasonCode": "REQUEST_SELECTION_UNCONFIRMED",
      "sourceAttempts": [
        {
          "source": "TABELOG",
          "outcome": "FAILED",
          "reasonCode": "REQUEST_SELECTION_UNCONFIRMED"
        }
      ],
      "sourceProvider": "TABELOG",
      "requestFingerprint": "{\"date\":\"2026-10-19\",\"timeWindow\":{\"earliest\":\"12:00\",\"latest\":\"17:00\"},\"partySize\":2}"
    },
    "tabelog:en/tokyo/A1301/A130103/13002564": {
      "status": "UNKNOWN",
      "checkedAt": "2026-10-11T08:24:27.621Z",
      "evidenceIds": [
        "evidence:restaurant:tabelog-entity-match:7f5166bbb2e6c609528fe264"
      ],
      "reasonCode": "REQUEST_SELECTION_UNCONFIRMED",
      "sourceAttempts": [
        {
          "source": "TABELOG",
          "outcome": "FAILED",
          "reasonCode": "REQUEST_SELECTION_UNCONFIRMED"
        }
      ],
      "sourceProvider": "TABELOG",
      "requestFingerprint": "{\"date\":\"2026-10-19\",\"timeWindow\":{\"earliest\":\"12:00\",\"latest\":\"17:00\"},\"partySize\":2}"
    },
    "tabelog:en/tokyo/A1301/A130103/13002648": {
      "status": "UNKNOWN",
      "checkedAt": "2026-10-11T08:24:51.486Z",
      "evidenceIds": [
        "evidence:restaurant:tabelog-entity-match:5cfe8377383c89bf411162ff"
      ],
      "reasonCode": "REQUEST_SELECTION_UNCONFIRMED",
      "sourceAttempts": [
        {
          "source": "TABELOG",
          "outcome": "FAILED",
          "reasonCode": "REQUEST_SELECTION_UNCONFIRMED"
        }
      ],
      "sourceProvider": "TABELOG",
      "requestFingerprint": "{\"date\":\"2026-10-19\",\"timeWindow\":{\"earliest\":\"12:00\",\"latest\":\"17:00\"},\"partySize\":2}"
    },
    "tabelog:en/tokyo/A1301/A130102/13262740": {
      "status": "UNKNOWN",
      "checkedAt": "2026-10-11T08:25:03.557Z",
      "evidenceIds": [
        "evidence:restaurant:tabelog-entity-match:676d94137311daeee21811d1"
      ],
      "reasonCode": "REQUEST_SELECTION_UNCONFIRMED",
      "sourceAttempts": [
        {
          "source": "TABELOG",
          "outcome": "FAILED",
          "reasonCode": "REQUEST_SELECTION_UNCONFIRMED"
        }
      ],
      "sourceProvider": "TABELOG",
      "requestFingerprint": "{\"date\":\"2026-10-19\",\"timeWindow\":{\"earliest\":\"12:00\",\"latest\":\"17:00\"},\"partySize\":2}"
    },
    "tabelog:en/tokyo/A1301/A130101/13002369": {
      "status": "UNKNOWN",
      "checkedAt": "2026-10-11T08:26:50.928Z",
      "evidenceIds": [
        "evidence:restaurant:tabelog-entity-match:af57621dc6f6275f07fe3774"
      ],
      "reasonCode": "REQUEST_SELECTION_UNCONFIRMED",
      "sourceAttempts": [
        {
          "source": "TABELOG",
          "outcome": "FAILED",
          "reasonCode": "REQUEST_SELECTION_UNCONFIRMED"
        }
      ],
      "sourceProvider": "TABELOG",
      "requestFingerprint": "{\"date\":\"2026-10-19\",\"timeWindow\":{\"earliest\":\"12:00\",\"latest\":\"17:00\"},\"partySize\":2}"
    },
    "tabelog:en/tokyo/A1301/A130101/13002704": {
      "status": "AVAILABLE",
      "receptionMode": "RESERVATION_SUPPORTED",
      "checkedAt": "2026-10-11T08:27:08.054Z",
      "evidenceIds": [
        "evidence:restaurant:tabelog-entity-match:de27282b7cf9b9a4ed1671ea",
        "evidence:restaurant:tabelog-availability:20f7ac77886f7148e48998c1"
      ],
      "displayExpiresAt": "2026-10-11T08:37:08.054Z",
      "freshnessPolicyVersion": "restaurant-availability-display-freshness@1",
      "sourceAttempts": [
        {
          "source": "TABELOG",
          "outcome": "AVAILABLE"
        }
      ],
      "sourceProvider": "TABELOG",
      "requestFingerprint": "{\"date\":\"2026-10-19\",\"timeWindow\":{\"earliest\":\"12:00\",\"latest\":\"17:00\"},\"partySize\":2}"
    },
    "tabelog:en/tokyo/A1301/A130101/13186583": {
      "status": "UNKNOWN",
      "checkedAt": "2026-10-11T08:27:19.410Z",
      "evidenceIds": [
        "evidence:restaurant:tabelog-entity-match:95c19773c857a74d6fd64962"
      ],
      "reasonCode": "REQUEST_SELECTION_UNCONFIRMED",
      "sourceAttempts": [
        {
          "source": "TABELOG",
          "outcome": "FAILED",
          "reasonCode": "REQUEST_SELECTION_UNCONFIRMED"
        }
      ],
      "sourceProvider": "TABELOG",
      "requestFingerprint": "{\"date\":\"2026-10-19\",\"timeWindow\":{\"earliest\":\"12:00\",\"latest\":\"17:00\"},\"partySize\":2}"
    }
  },
  "selectedCandidateId": null,
  "bookingHandoffs": null,
  "pageQuestion": null
}
```
