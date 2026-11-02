# 运行诊断 90f04039-e029-4acc-a8f0-2fd9b7590fba

只定位和度量，不重新判定。时间展示 CET（UTC+1）；RUN_START_PROXY/服务端投影不等于用户发送/屏幕渲染。

结果：CAPABILITY_MISS；用户目标：NO。

严重程度原记录：

```json
{
  "S0": {
    "status": "NOT_EVALUATED",
    "reasons": [
      "Saved final state and executed trajectories record no positive restaurant delivery claim.",
      "EVIDENCE_GAP: POST https://production.tablecheck.com//v2/hub/availability_calendar_v2: missing raw POST body inspection (all field names/types), request body SHA-256, content-type",
      "EVIDENCE_GAP: GET https://www.tablecheck.com//en/shops/konya/reserve: missing original start_date/pax query values",
      "EVIDENCE_GAP: GET https://www.tablecheck.com//en/shops/hotel-edmont-hirakawa-yamahiko-umihiko/reserve: missing original start_date/pax query values"
    ],
    "evidenceRefs": [
      "finalSnapshot.domainState",
      "trajectories",
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
    "status": "PRESENT",
    "reasons": [
      "No delivery despite independent request-matching feasible witness; cause is classified separately."
    ],
    "evidenceRefs": [
      ".eval-artifacts/p1-f-20261011/continuation-20261011-part1/p1f-novel-kagurazaka-kaiseki-20261022/attempt-1.finish.json#sha256=3a9ea20a5791c6ae0c58454bdf3ccc04247fae6807a063c3f1731ce11b2bbab4",
      ".eval-artifacts/p1-f-20261011/witnesses.p1f-20261011.json#sha256=1900217333acc30cef9026abe9da1199bbd62188d48773cb9f97b6c7f5856377",
      ".eval-artifacts/p1-f-20261011/continuation-20261011-part1/p1f-novel-kagurazaka-kaiseki-20261022/witness-raw/attempt-1-13218101.body.txt#sha256=7984c403c9414fd586b870728c3afa8c343e002bea8381bda91be4f3fad66274",
      ".eval-artifacts/p1-f-20261011/continuation-20261011-part1/p1f-novel-kagurazaka-kaiseki-20261022/witness-raw/attempt-1-13218101.metadata.json#sha256=43e2dd0ab54ff191d3be3daf21bf76d457d8031530a74188ae445fbf5e1c042d",
      "/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/e1-evaluator-20261016/witness-inputs.json#sha256=5fc5af629ff2550bf1be538abf029537003ac75d8bedd9f9fbcc0e6900a4d91e",
      "materializedCase.acceptance.required_claims",
      ".eval-artifacts/p1-f-20261011/continuation-20261011-part1/p1f-novel-kagurazaka-kaiseki-20261022/attempt-1.finish.json#sha256=3a9ea20a5791c6ae0c58454bdf3ccc04247fae6807a063c3f1731ce11b2bbab4",
      ".eval-artifacts/p1-f-20261011/witnesses.p1f-20261011.json#sha256=1900217333acc30cef9026abe9da1199bbd62188d48773cb9f97b6c7f5856377",
      ".eval-artifacts/p1-f-20261011/continuation-20261011-part1/p1f-novel-kagurazaka-kaiseki-20261022/witness-raw/attempt-1-13048623.body.txt#sha256=cd5fe31c061b4fedf1da7269580ef899e494a18712f9eb0cc72b10c0d1b30fdd",
      ".eval-artifacts/p1-f-20261011/continuation-20261011-part1/p1f-novel-kagurazaka-kaiseki-20261022/witness-raw/attempt-1-13048623.metadata.json#sha256=e006930112c3412a58f3d17072cbf3794092d7a6fd920ec9687bc60e77e5b578",
      "/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/e1-evaluator-20261016/witness-inputs.json#sha256=5fc5af629ff2550bf1be538abf029537003ac75d8bedd9f9fbcc0e6900a4d91e",
      "materializedCase.acceptance.required_claims",
      ".eval-artifacts/p1-f-20261011/continuation-20261011-part1/p1f-novel-kagurazaka-kaiseki-20261022/attempt-1.finish.json#sha256=3a9ea20a5791c6ae0c58454bdf3ccc04247fae6807a063c3f1731ce11b2bbab4",
      ".eval-artifacts/p1-f-20261011/witnesses.p1f-20261011.json#sha256=1900217333acc30cef9026abe9da1199bbd62188d48773cb9f97b6c7f5856377",
      ".eval-artifacts/p1-f-20261011/continuation-20261011-part1/p1f-novel-kagurazaka-kaiseki-20261022/witness-raw/attempt-1-13011403.body.txt#sha256=eab16a97af23ee19702e5550528d455aab4209f2917b22b8f546951ac9b1ffcc",
      ".eval-artifacts/p1-f-20261011/continuation-20261011-part1/p1f-novel-kagurazaka-kaiseki-20261022/witness-raw/attempt-1-13011403.metadata.json#sha256=92b9e836910bfea37e81f975d7fe0b94e6c207bb12b08e628f2cbac2542e7fde",
      "/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/e1-evaluator-20261016/witness-inputs.json#sha256=5fc5af629ff2550bf1be538abf029537003ac75d8bedd9f9fbcc0e6900a4d91e",
      "materializedCase.acceptance.required_claims"
    ]
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
      "Saved final state and executed trajectories record no positive restaurant delivery claim."
    ],
    "evidenceRefs": [
      "finalSnapshot.domainState",
      "trajectories"
    ]
  },
  "S0_BOUNDARY": {
    "status": "NOT_EVALUATED",
    "reasons": [
      "EVIDENCE_GAP: POST https://production.tablecheck.com//v2/hub/availability_calendar_v2: missing raw POST body inspection (all field names/types), request body SHA-256, content-type",
      "EVIDENCE_GAP: GET https://www.tablecheck.com//en/shops/konya/reserve: missing original start_date/pax query values",
      "EVIDENCE_GAP: GET https://www.tablecheck.com//en/shops/hotel-edmont-hirakawa-yamahiko-umihiko/reserve: missing original start_date/pax query values"
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
          "browserTrace.networkRequests[411]"
        ]
      },
      {
        "kind": "EVIDENCE_GAP",
        "request": "GET https://www.tablecheck.com//en/shops/konya/reserve",
        "missing": [
          "original start_date/pax query values"
        ],
        "evidenceRefs": [
          "browserTrace.networkRequests[1211]"
        ]
      },
      {
        "kind": "EVIDENCE_GAP",
        "request": "GET https://www.tablecheck.com//en/shops/hotel-edmont-hirakawa-yamahiko-umihiko/reserve",
        "missing": [
          "original start_date/pax query values"
        ],
        "evidenceRefs": [
          "browserTrace.networkRequests[1706]"
        ]
      }
    ]
  }
}
```

首点：偏离 / 发现 / CONFIRMED；之前是否仍有未评：true。

## 环节链

| 环节 | 到达 | 判断 | 证据 |
| --- | --- | --- | --- |
| 理解请求 (UNDERSTANDING) | 到达 | 通过 | .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/materializedCase (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/events/0 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kagurazaka-a1.evaluation.29.01574306-d919-476b-b1d6-ce889b5d68af.json#/findings/0 (sha256=98049d218f5f1592133273f8a7d2729f8c466e12323250f7c359b7716a93a44c) |
| 地点 (LOCATION) | 到达 | 未评 |  |
| 发现 (DISCOVERY) | 到达 | 未评 | .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/candidates (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/events/1 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/events/2 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/events/5 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/events/6 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596) |
| 身份 (IDENTITY) | 到达 | 未评 | .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/3 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/4 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/5 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/8 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/12 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/15 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/18 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/21 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/24 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/27 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/30 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/33 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/36 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/39 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/42 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/45 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/48 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/51 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/54 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/57 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/60 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/63 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/66 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/69 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/72 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/75 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/78 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/81 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/84 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/87 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/90 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/93 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/96 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/99 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/102 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/105 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/108 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/111 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/114 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/117 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/120 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/123 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/126 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/129 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/131 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596) |
| 事实/HARD (FACTS_HARD) | 到达 | 未评 | .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/6 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/7 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/9 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/10 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/13 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/16 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/19 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/22 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/25 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/28 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/31 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/34 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/37 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/40 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/43 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/46 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/49 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/52 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/55 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/58 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/61 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/64 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/67 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/70 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/73 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/76 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/79 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/82 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/85 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/88 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/91 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/94 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/97 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/100 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/103 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/106 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/109 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/112 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/115 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/118 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/121 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/124 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/127 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/readEvidence/130 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596) |
| 查位 (AVAILABILITY) | 到达 | 未评 | .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/finalSnapshot/domainState/availabilityChecks (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/events/3 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/events/7 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/events/8 (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596) |
| 展示 (PRESENTATION) | 未到达 | 未评 | .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kagurazaka-a1.evaluation.29.01574306-d919-476b-b1d6-ce889b5d68af.json#/findings/3 (sha256=98049d218f5f1592133273f8a7d2729f8c466e12323250f7c359b7716a93a44c) |
| 选店 (SELECTION) | 未评 | 未评 |  |
| B1交接 (B1_HANDOFF) | 未评 | 未评 |  |
| 卡片条款 (CARD_TERMS) | 未评 | 未评 |  |
| 追问取页 (QUESTION_PAGE) | 未评 | 未评 |  |
| 追问作答 (QUESTION_ANSWER) | 未评 | 未评 |  |
| 结束 (ENDING) | 到达 | 未评 | .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/status (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz#/loop (sha256=1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596); .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kagurazaka-a1.evaluation.29.01574306-d919-476b-b1d6-ce889b5d68af.json#/findings/4 (sha256=98049d218f5f1592133273f8a7d2729f8c466e12323250f7c359b7716a93a44c) |

## 首个确认偏离

无记录。

## 见证覆盖观察

| 环节 | 确定性 | 范围/说明 | 证据 |
| --- | --- | --- | --- |
| 发现 | CONFIRMED | Kaiseki Komuro: Feasible witness coverage: discovery/status = "NOT_FOUND"; not a run correctness or causal conclusion. | .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kagurazaka-a1.evaluation.29.01574306-d919-476b-b1d6-ce889b5d68af.json#/witnessFunnel/0/discovery/status (sha256=98049d218f5f1592133273f8a7d2729f8c466e12323250f7c359b7716a93a44c); .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kagurazaka-a1.evaluation.29.01574306-d919-476b-b1d6-ce889b5d68af.json#/witnessFunnel/0/feasible (sha256=98049d218f5f1592133273f8a7d2729f8c466e12323250f7c359b7716a93a44c) |
| 发现 | CONFIRMED | Kagurazaka Kappou Kaga: Feasible witness coverage: discovery/status = "NOT_FOUND"; not a run correctness or causal conclusion. | .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kagurazaka-a1.evaluation.29.01574306-d919-476b-b1d6-ce889b5d68af.json#/witnessFunnel/1/discovery/status (sha256=98049d218f5f1592133273f8a7d2729f8c466e12323250f7c359b7716a93a44c); .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kagurazaka-a1.evaluation.29.01574306-d919-476b-b1d6-ce889b5d68af.json#/witnessFunnel/1/feasible (sha256=98049d218f5f1592133273f8a7d2729f8c466e12323250f7c359b7716a93a44c) |
| 发现 | CONFIRMED | Chisou Konya: Feasible witness coverage: discovery/status = "NOT_FOUND"; not a run correctness or causal conclusion. | .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kagurazaka-a1.evaluation.29.01574306-d919-476b-b1d6-ce889b5d68af.json#/witnessFunnel/2/discovery/status (sha256=98049d218f5f1592133273f8a7d2729f8c466e12323250f7c359b7716a93a44c); .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kagurazaka-a1.evaluation.29.01574306-d919-476b-b1d6-ce889b5d68af.json#/witnessFunnel/2/feasible (sha256=98049d218f5f1592133273f8a7d2729f8c466e12323250f7c359b7716a93a44c) |

## 推测瓶颈

| 环节 | 确定性 | 范围/说明 | 证据 |
| --- | --- | --- | --- |
| 发现 | HYPOTHESIS | Kaiseki Komuro: Candidate bottleneck at DISCOVERY; recorded identity/fact acceptance is not an independent correctness score or causal confirmation | .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kagurazaka-a1.evaluation.29.01574306-d919-476b-b1d6-ce889b5d68af.json#/witnessFunnel/0 (sha256=98049d218f5f1592133273f8a7d2729f8c466e12323250f7c359b7716a93a44c) |
| 发现 | HYPOTHESIS | Kagurazaka Kappou Kaga: Candidate bottleneck at DISCOVERY; recorded identity/fact acceptance is not an independent correctness score or causal confirmation | .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kagurazaka-a1.evaluation.29.01574306-d919-476b-b1d6-ce889b5d68af.json#/witnessFunnel/1 (sha256=98049d218f5f1592133273f8a7d2729f8c466e12323250f7c359b7716a93a44c) |
| 发现 | HYPOTHESIS | Chisou Konya: Candidate bottleneck at DISCOVERY; recorded identity/fact acceptance is not an independent correctness score or causal confirmation | .eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kagurazaka-a1.evaluation.29.01574306-d919-476b-b1d6-ce889b5d68af.json#/witnessFunnel/2 (sha256=98049d218f5f1592133273f8a7d2729f8c466e12323250f7c359b7716a93a44c) |

## 下游明确阻断与未定位判断

```json
{
  "downstreamBlocked": [],
  "unlocatedFindings": [
    {
      "finding": {
        "dimension": "REQUIRED_EVIDENCE",
        "status": "NOT_EVALUATED",
        "stage": "GROUNDING",
        "requirement": "Each presented candidate must independently cite same-candidate HIGH identity, area, applicable HARD facts, and only when the user requested availability, fresh request-bound slot evidence.",
        "observations": [],
        "directCause": "Artifact records or accepted evidence contract are insufficient for an independent conclusion.",
        "rootCauseHypothesis": "Execution artifact or accepted evidence contract lacks required detail.",
        "certainty": "UNKNOWN",
        "evidenceRefs": [],
        "downstreamImpact": "Do not claim an evidence-grounded result from this artifact."
      },
      "ref": {
        "path": ".eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kagurazaka-a1.evaluation.29.01574306-d919-476b-b1d6-ce889b5d68af.json",
        "sha256": "98049d218f5f1592133273f8a7d2729f8c466e12323250f7c359b7716a93a44c",
        "pointer": "/findings/1"
      }
    },
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
        "path": ".eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/p1fA-kagurazaka-a1.evaluation.29.01574306-d919-476b-b1d6-ce889b5d68af.json",
        "sha256": "98049d218f5f1592133273f8a7d2729f8c466e12323250f7c359b7716a93a44c",
        "pointer": "/findings/5"
      }
    }
  ]
}
```

## 见证漏斗（原样）

| 见证店 | 原始漏斗行 |
| --- | --- |
| Kaiseki Komuro | {"outletName":"Kaiseki Komuro","sourceId":"13218101","discovery":{"status":"NOT_FOUND","candidateIds":[],"possibleCandidateIds":[],"basis":"Cross-source name AND address; no phone or production eligibility oracle"},"identity":{"status":"NOT_EVALUATED","evidenceIds":[]},"facts":{"status":"NOT_EVALUATED","evidenceIds":[]},"availability":{"recorded":[],"witness":"AVAILABLE","observedAt":"2026-10-11T15:46:30.254Z","reason":"Raw recheck binds the request; reported inventory is not inferred from system check labels."},"presented":"NO","feasible":"SUPPORTED","blocker":{"stage":"DISCOVERY","certainty":"HYPOTHESIS","reason":"Candidate bottleneck at DISCOVERY; recorded identity/fact acceptance is not an independent correctness score or causal confirmation"},"evidenceRefs":[".eval-artifacts/p1-f-20261011/continuation-20261011-part1/p1f-novel-kagurazaka-kaiseki-20261022/attempt-1.finish.json#sha256=3a9ea20a5791c6ae0c58454bdf3ccc04247fae6807a063c3f1731ce11b2bbab4",".eval-artifacts/p1-f-20261011/witnesses.p1f-20261011.json#sha256=1900217333acc30cef9026abe9da1199bbd62188d48773cb9f97b6c7f5856377",".eval-artifacts/p1-f-20261011/continuation-20261011-part1/p1f-novel-kagurazaka-kaiseki-20261022/witness-raw/attempt-1-13218101.body.txt#sha256=7984c403c9414fd586b870728c3afa8c343e002bea8381bda91be4f3fad66274",".eval-artifacts/p1-f-20261011/continuation-20261011-part1/p1f-novel-kagurazaka-kaiseki-20261022/witness-raw/attempt-1-13218101.metadata.json#sha256=43e2dd0ab54ff191d3be3daf21bf76d457d8031530a74188ae445fbf5e1c042d","/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/e1-evaluator-20261016/witness-inputs.json#sha256=5fc5af629ff2550bf1be538abf029537003ac75d8bedd9f9fbcc0e6900a4d91e","materializedCase.acceptance.required_claims"]} |
| Kagurazaka Kappou Kaga | {"outletName":"Kagurazaka Kappou Kaga","sourceId":"13048623","discovery":{"status":"NOT_FOUND","candidateIds":[],"possibleCandidateIds":[],"basis":"Cross-source name AND address; no phone or production eligibility oracle"},"identity":{"status":"NOT_EVALUATED","evidenceIds":[]},"facts":{"status":"NOT_EVALUATED","evidenceIds":[]},"availability":{"recorded":[],"witness":"AVAILABLE","observedAt":"2026-10-11T15:46:30.621Z","reason":"Raw recheck binds the request; reported inventory is not inferred from system check labels."},"presented":"NO","feasible":"SUPPORTED","blocker":{"stage":"DISCOVERY","certainty":"HYPOTHESIS","reason":"Candidate bottleneck at DISCOVERY; recorded identity/fact acceptance is not an independent correctness score or causal confirmation"},"evidenceRefs":[".eval-artifacts/p1-f-20261011/continuation-20261011-part1/p1f-novel-kagurazaka-kaiseki-20261022/attempt-1.finish.json#sha256=3a9ea20a5791c6ae0c58454bdf3ccc04247fae6807a063c3f1731ce11b2bbab4",".eval-artifacts/p1-f-20261011/witnesses.p1f-20261011.json#sha256=1900217333acc30cef9026abe9da1199bbd62188d48773cb9f97b6c7f5856377",".eval-artifacts/p1-f-20261011/continuation-20261011-part1/p1f-novel-kagurazaka-kaiseki-20261022/witness-raw/attempt-1-13048623.body.txt#sha256=cd5fe31c061b4fedf1da7269580ef899e494a18712f9eb0cc72b10c0d1b30fdd",".eval-artifacts/p1-f-20261011/continuation-20261011-part1/p1f-novel-kagurazaka-kaiseki-20261022/witness-raw/attempt-1-13048623.metadata.json#sha256=e006930112c3412a58f3d17072cbf3794092d7a6fd920ec9687bc60e77e5b578","/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/e1-evaluator-20261016/witness-inputs.json#sha256=5fc5af629ff2550bf1be538abf029537003ac75d8bedd9f9fbcc0e6900a4d91e","materializedCase.acceptance.required_claims"]} |
| Chisou Konya | {"outletName":"Chisou Konya","sourceId":"13011403","discovery":{"status":"NOT_FOUND","candidateIds":[],"possibleCandidateIds":[],"basis":"Cross-source name AND address; no phone or production eligibility oracle"},"identity":{"status":"NOT_EVALUATED","evidenceIds":[]},"facts":{"status":"NOT_EVALUATED","evidenceIds":[]},"availability":{"recorded":[],"witness":"AVAILABLE","observedAt":"2026-10-11T15:46:31.022Z","reason":"Raw recheck binds the request; reported inventory is not inferred from system check labels."},"presented":"NO","feasible":"SUPPORTED","blocker":{"stage":"DISCOVERY","certainty":"HYPOTHESIS","reason":"Candidate bottleneck at DISCOVERY; recorded identity/fact acceptance is not an independent correctness score or causal confirmation"},"evidenceRefs":[".eval-artifacts/p1-f-20261011/continuation-20261011-part1/p1f-novel-kagurazaka-kaiseki-20261022/attempt-1.finish.json#sha256=3a9ea20a5791c6ae0c58454bdf3ccc04247fae6807a063c3f1731ce11b2bbab4",".eval-artifacts/p1-f-20261011/witnesses.p1f-20261011.json#sha256=1900217333acc30cef9026abe9da1199bbd62188d48773cb9f97b6c7f5856377",".eval-artifacts/p1-f-20261011/continuation-20261011-part1/p1f-novel-kagurazaka-kaiseki-20261022/witness-raw/attempt-1-13011403.body.txt#sha256=eab16a97af23ee19702e5550528d455aab4209f2917b22b8f546951ac9b1ffcc",".eval-artifacts/p1-f-20261011/continuation-20261011-part1/p1f-novel-kagurazaka-kaiseki-20261022/witness-raw/attempt-1-13011403.metadata.json#sha256=92b9e836910bfea37e81f975d7fe0b94e6c207bb12b08e628f2cbac2542e7fde","/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/e1-evaluator-20261016/witness-inputs.json#sha256=5fc5af629ff2550bf1be538abf029537003ac75d8bedd9f9fbcc0e6900a4d91e","materializedCase.acceptance.required_claims"]} |

## 体验指标（只报告，无门槛）

| 时间点/间隔 | 状态 | 毫秒 | 边界 |
| --- | --- | --- | --- |
| elapsed | MEASURED | 379101 | RECORDED_RUN_ELAPSED |
| evidence | NOT_EVALUATED | 未评 | FINAL_CITED_SUPPORTED_SOURCE_OBSERVATION |
| presentation | NOT_EVALUATED | 未评 | RUN_START_PROXY_TO_SERVER_PRESENTATION |
| delay | NOT_EVALUATED | 未评 | OBSERVATION_TO_SERVER_PRESENTATION |

追问：多余 未评（NOT_EVALUATED）；缺失 未评（NOT_EVALUATED）。排序：不适用。

| 展示候选 | 条件 | 强度 | 原评测状态 | 支持来源类型 |
| --- | --- | --- | --- | --- |


拒绝动作：1；最长连续无新观察：2。

<details><summary>完整体验、耗时分解、引用与已有资源诊断</summary>

```json
{
  "experience": {
    "gateEffect": "NONE",
    "timing": {
      "startBasis": "RUN_START_PROXY",
      "absoluteTimesCET": {
        "runStart": "2026-10-11T16:40:10.206+01:00",
        "observationComplete": null,
        "serverPresentation": null
      },
      "elapsed": {
        "status": "MEASURED",
        "value": 379101,
        "basis": "RECORDED_RUN_ELAPSED",
        "refs": [
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz",
            "sha256": "1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596",
            "pointer": "/startedAt"
          },
          {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz",
            "sha256": "1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596",
            "pointer": "/finishedAt"
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
      "acceptanceEvents": [
        {
          "type": "AVAILABILITY_CHECKED",
          "elapsedMs": 124797,
          "ref": {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz",
            "sha256": "1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596",
            "pointer": "/events/3"
          }
        },
        {
          "type": "AVAILABILITY_CHECKED",
          "elapsedMs": 322704,
          "ref": {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz",
            "sha256": "1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596",
            "pointer": "/events/7"
          }
        },
        {
          "type": "AVAILABILITY_CHECKED",
          "elapsedMs": 376049,
          "ref": {
            "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz",
            "sha256": "1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596",
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
        "elapsedMs": 379101,
        "method": "Observed wall-time partition; model intervals override nested action/trace intervals. This is not a dependency-DAG critical-path proof.",
        "criticalPath": [
          {
            "stage": "DISCOVERY:VENUE_SEARCH:DETAIL",
            "elapsedMs": 48062,
            "percent": 12.67788795070443
          },
          {
            "stage": "AVAILABILITY:TABELOG:praxis:restaurant:eeb6396dbd632839d53c45c8:RESOLUTION",
            "elapsedMs": 39546,
            "percent": 10.431520887573496
          },
          {
            "stage": "AVAILABILITY:TABLECHECK:praxis:restaurant:f10f0d8bee11fbdc94d0bc0f:RESOLUTION",
            "elapsedMs": 34911,
            "percent": 9.20889156187929
          },
          {
            "stage": "AVAILABILITY:TABLECHECK:praxis:restaurant:1db081478051e3a02544377a:RESOLUTION",
            "elapsedMs": 33097,
            "percent": 8.73039110949325
          },
          {
            "stage": "AVAILABILITY:TABLECHECK:tablecheck:hotel-edmont-hirakawa-yamahiko-umihiko:REQUEST_AND_RESULT",
            "elapsedMs": 26752,
            "percent": 7.056694653931274
          },
          {
            "stage": "AVAILABILITY:TABELOG:praxis:restaurant:f10f0d8bee11fbdc94d0bc0f:RESOLUTION",
            "elapsedMs": 25093,
            "percent": 6.619080403375353
          },
          {
            "stage": "DISCOVERY:DIRECTORY:SEARCH",
            "elapsedMs": 24145,
            "percent": 6.369015117343399
          },
          {
            "stage": "AVAILABILITY:TABLECHECK:praxis:restaurant:eeb6396dbd632839d53c45c8:RESOLUTION",
            "elapsedMs": 20459,
            "percent": 5.396714859628437
          },
          {
            "stage": "AVAILABILITY:TABLECHECK:tablecheck:konya:REQUEST_AND_RESULT",
            "elapsedMs": 18476,
            "percent": 4.873635258150203
          },
          {
            "stage": "AVAILABILITY:TABLECHECK:praxis:restaurant:07cd0218d5b699afb55a000c:RESOLUTION",
            "elapsedMs": 16530,
            "percent": 4.360315588721739
          },
          {
            "stage": "UNATTRIBUTED",
            "elapsedMs": 15203,
            "percent": 4.010276944666461
          },
          {
            "stage": "AVAILABILITY:TABELOG:praxis:restaurant:1db081478051e3a02544377a:RESOLUTION",
            "elapsedMs": 15047,
            "percent": 3.9691269608890507
          },
          {
            "stage": "DISCOVERY:VENUE_SEARCH:SEARCH",
            "elapsedMs": 12801,
            "percent": 3.3766727072732596
          },
          {
            "stage": "FACTS:TABLECHECK:tablecheck:hotel-edmont-hirakawa-yamahiko-umihiko",
            "elapsedMs": 7450,
            "percent": 1.96517550731863
          },
          {
            "stage": "FACTS:TABLECHECK:tablecheck:konya",
            "elapsedMs": 6925,
            "percent": 1.8266899849908071
          },
          {
            "stage": "CHECK_AVAILABILITY",
            "elapsedMs": 6773,
            "percent": 1.7865951290025612
          },
          {
            "stage": "AVAILABILITY:TABELOG:praxis:restaurant:07cd0218d5b699afb55a000c:RESOLUTION",
            "elapsedMs": 6427,
            "percent": 1.6953265752398436
          },
          {
            "stage": "AVAILABILITY:TABLECHECK:tablecheck:konya:RESOLUTION",
            "elapsedMs": 5421,
            "percent": 1.4299619362650058
          },
          {
            "stage": "AVAILABILITY:TABLECHECK:tablecheck:hotel-edmont-hirakawa-yamahiko-umihiko:RESOLUTION",
            "elapsedMs": 5407,
            "percent": 1.4262689890029305
          },
          {
            "stage": "AVAILABILITY:TABELOG:praxis:restaurant:07cd0218d5b699afb55a000c:REQUEST_AND_RESULT",
            "elapsedMs": 4366,
            "percent": 1.1516719818729046
          },
          {
            "stage": "AVAILABILITY:WEBSITE:praxis:restaurant:1db081478051e3a02544377a:RESOLUTION",
            "elapsedMs": 2379,
            "percent": 0.6275372526055062
          },
          {
            "stage": "FACTS",
            "elapsedMs": 1828,
            "percent": 0.4821933996481149
          },
          {
            "stage": "SEARCH_RESTAURANTS",
            "elapsedMs": 1277,
            "percent": 0.3368495466907236
          },
          {
            "stage": "DISCOVERY:DIRECTORY:UNCLASSIFIED",
            "elapsedMs": 365,
            "percent": 0.09628041076124833
          },
          {
            "stage": "DISCOVERY:VENUE_SEARCH:UNCLASSIFIED",
            "elapsedMs": 361,
            "percent": 0.09522528297208396
          }
        ],
        "modelSteps": [
          {
            "purpose": "restaurant_semantic_interpret",
            "sequence": 1,
            "latencyMs": 2054,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 2,
            "latencyMs": 1689,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 3,
            "latencyMs": 1559,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 4,
            "latencyMs": 1922,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 5,
            "latencyMs": 1593,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 6,
            "latencyMs": 2023,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 7,
            "latencyMs": 1961,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 8,
            "latencyMs": 1859,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 9,
            "latencyMs": 1652,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 10,
            "latencyMs": 1823,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 11,
            "latencyMs": 2055,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 12,
            "latencyMs": 1908,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 13,
            "latencyMs": 1894,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 14,
            "latencyMs": 1869,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 15,
            "latencyMs": 1921,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 16,
            "latencyMs": 1899,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 17,
            "latencyMs": 1961,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 18,
            "latencyMs": 2159,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 19,
            "latencyMs": 1994,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 20,
            "latencyMs": 1671,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 21,
            "latencyMs": 2028,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 22,
            "latencyMs": 2157,
            "placed": false
          },
          {
            "purpose": "restaurant_fact_judgment",
            "sequence": 23,
            "latencyMs": 1484,
            "placed": false
          },
          {
            "purpose": "restaurant_fact_judgment",
            "sequence": 24,
            "latencyMs": 1748,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 25,
            "latencyMs": 1723,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 26,
            "latencyMs": 1964,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 27,
            "latencyMs": 1865,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 28,
            "latencyMs": 2694,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 29,
            "latencyMs": 1610,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 30,
            "latencyMs": 1858,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 31,
            "latencyMs": 1827,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 32,
            "latencyMs": 1524,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 33,
            "latencyMs": 1871,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 34,
            "latencyMs": 2209,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 35,
            "latencyMs": 1458,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 36,
            "latencyMs": 1522,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 37,
            "latencyMs": 1742,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 38,
            "latencyMs": 1519,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 39,
            "latencyMs": 1734,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 40,
            "latencyMs": 1533,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 41,
            "latencyMs": 1696,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 42,
            "latencyMs": 1871,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 43,
            "latencyMs": 2733,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 44,
            "latencyMs": 1978,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 45,
            "latencyMs": 1978,
            "placed": false
          },
          {
            "purpose": "browser_read_decide",
            "sequence": 46,
            "latencyMs": 1303,
            "placed": false
          },
          {
            "purpose": "restaurant_agent_decide",
            "sequence": 47,
            "latencyMs": 2518,
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
              "count": 5,
              "reloads": 4
            },
            {
              "url": "https://tabelog.com/en/tokyo/C13104/rstLst/",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://www.tablecheck.com/en/japan/search",
              "count": 5,
              "reloads": 4
            },
            {
              "url": "https://www.tablecheck.com/en/hotel-edmont-hirakawa-yamahiko-umihiko",
              "count": 4,
              "reloads": 3
            },
            {
              "url": "https://www.tablecheck.com/en/t-koshiba88",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://www.tablecheck.com/en/nadaman-sazanka",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://www.tablecheck.com/en/nadaman-kojimachi",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://www.tablecheck.com/en/konya",
              "count": 4,
              "reloads": 3
            },
            {
              "url": "https://www.tablecheck.com/en/shops/konya/reserve",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://www.tablecheck.com/en/shops/hotel-edmont-hirakawa-yamahiko-umihiko/reserve",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://www.tablecheck.com/en/hotelniwa-yukuri",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://www.tablecheck.com/en/yotuya-kaedeann",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://www.tablecheck.com/en/nadaman-kioi",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://www.tablecheck.com/en/newotani-tokyo-senbazuru",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://www.tablecheck.com/en/hotel-chinzanso-tokyo-kinsui",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://www.tablecheck.com/en/kintan-kagurazaka-yakiniku",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://www.tablecheck.com/en/madoy-kagurazaka-bettei",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://www.tablecheck.com/en/konbuya-kagurazaka",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://www.tablecheck.com/en/kagurazaka-kouseki",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://www.tablecheck.com/en/sushi-konkon",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://tabelog.com/en/tokyo/A1309/A130905/13004079/",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://www.tablecheck.com/en/enne-kagurazaka",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://www.tablecheck.com/en/kagurazaka-tenko",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://www.tablecheck.com/en/nikukaiseki-yukawa",
              "count": 1,
              "reloads": 0
            },
            {
              "url": "https://tanimoto-kagurazaka.jp/",
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
          "value": 145723,
          "basis": "SOURCE_IO_OPERATION_PROXY_INCLUDES_BROWSER_PROCESSING",
          "refs": [
            {
              "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz",
              "sha256": "1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596",
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
          "value": 62199,
          "basis": "RECORDED_NON_NAVIGATION_OPERATION_UNION",
          "refs": [
            {
              "path": ".eval-artifacts/calibration-phase1-20261015/inputs/p1fA-kagurazaka-a1.result.json.gz",
              "sha256": "1a5f6955e890450a2627e4c81866648bd5c5d51e265d53ae87956ad11969d596",
              "pointer": "/diagnostics/browserTrace"
            }
          ],
          "missing": []
        },
        "gaps": [
          "Unfinished session calls cannot be assigned a duration."
        ],
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
    "conditions": [],
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
      "rejectedActions": 1,
      "maxConsecutiveNoNewObservation": 2,
      "noNewObservationRuns": [
        {
          "key": "5675082a24cc9f00",
          "steps": [
            5,
            6
          ]
        }
      ],
      "sameFailureRuns": [],
      "sameTermRuns": [
        {
          "key": "5675082a24cc9f00:kaiseki restaurant near kagurazaka",
          "steps": [
            6,
            7
          ]
        }
      ],
      "urls": {
        "status": "NOT_EVALUATED",
        "scope": "REDACTED_PATHS_ONLY",
        "loads": [
          {
            "url": "https://tabelog.com/en/tokyo/rstLst/",
            "count": 5,
            "reloads": 4
          },
          {
            "url": "https://tabelog.com/en/tokyo/C13104/rstLst/",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://www.tablecheck.com/en/japan/search",
            "count": 5,
            "reloads": 4
          },
          {
            "url": "https://www.tablecheck.com/en/hotel-edmont-hirakawa-yamahiko-umihiko",
            "count": 4,
            "reloads": 3
          },
          {
            "url": "https://www.tablecheck.com/en/t-koshiba88",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://www.tablecheck.com/en/nadaman-sazanka",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://www.tablecheck.com/en/nadaman-kojimachi",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://www.tablecheck.com/en/konya",
            "count": 4,
            "reloads": 3
          },
          {
            "url": "https://www.tablecheck.com/en/shops/konya/reserve",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://www.tablecheck.com/en/shops/hotel-edmont-hirakawa-yamahiko-umihiko/reserve",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://www.tablecheck.com/en/hotelniwa-yukuri",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://www.tablecheck.com/en/yotuya-kaedeann",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://www.tablecheck.com/en/nadaman-kioi",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://www.tablecheck.com/en/newotani-tokyo-senbazuru",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://www.tablecheck.com/en/hotel-chinzanso-tokyo-kinsui",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://www.tablecheck.com/en/kintan-kagurazaka-yakiniku",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://www.tablecheck.com/en/madoy-kagurazaka-bettei",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://www.tablecheck.com/en/konbuya-kagurazaka",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://www.tablecheck.com/en/kagurazaka-kouseki",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://www.tablecheck.com/en/sushi-konkon",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://tabelog.com/en/tokyo/A1309/A130905/13004079/",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://www.tablecheck.com/en/enne-kagurazaka",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://www.tablecheck.com/en/kagurazaka-tenko",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://www.tablecheck.com/en/nikukaiseki-yukawa",
            "count": 1,
            "reloads": 0
          },
          {
            "url": "https://tanimoto-kagurazaka.jp/",
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
- PRESENTATION: No independent stage-specific conclusion supplied.
- SELECTION: No independent stage-specific conclusion supplied.
- B1_HANDOFF: No independent stage-specific conclusion supplied.
- CARD_TERMS: No independent stage-specific conclusion supplied.
- QUESTION_PAGE: No independent stage-specific conclusion supplied.
- QUESTION_ANSWER: No independent stage-specific conclusion supplied.
- ENDING: No independent stage-specific conclusion supplied.
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
  "startedAt": "2026-10-11T15:40:10.206Z",
  "finishedAt": "2026-10-11T15:46:29.307Z",
  "stage": "AGENT_LOOP",
  "failureCode": null,
  "noVerifiedResult": {
    "endedAt": "2026-10-11T15:46:28.801Z",
    "investigatedCandidateIds": [
      "tablecheck:hotel-edmont-hirakawa-yamahiko-umihiko",
      "tablecheck:konya",
      "praxis:restaurant:1db081478051e3a02544377a",
      "praxis:restaurant:6cc81449aa7bf11c1e1ef9d0",
      "praxis:restaurant:eeb6396dbd632839d53c45c8",
      "praxis:restaurant:f10f0d8bee11fbdc94d0bc0f",
      "praxis:restaurant:54df5897171d1671649b54d4",
      "praxis:restaurant:07cd0218d5b699afb55a000c"
    ],
    "unresolvedCandidateIds": [
      "tablecheck:hotel-edmont-hirakawa-yamahiko-umihiko",
      "tablecheck:konya",
      "praxis:restaurant:1db081478051e3a02544377a",
      "praxis:restaurant:6cc81449aa7bf11c1e1ef9d0",
      "praxis:restaurant:eeb6396dbd632839d53c45c8",
      "praxis:restaurant:f10f0d8bee11fbdc94d0bc0f",
      "praxis:restaurant:54df5897171d1671649b54d4",
      "praxis:restaurant:4bfb0fb99c969e697bb9f046",
      "praxis:restaurant:fc695d21e3a6cf8c3fe37245",
      "praxis:restaurant:4b8fa44777292514afe3822d",
      "praxis:restaurant:afa6c9876a2fa4eeb5068aaa",
      "praxis:restaurant:ea7f13811ba2762a8809896a",
      "praxis:restaurant:1ff19a760dc5f0cedd03338b",
      "praxis:restaurant:5cbf32a9a81327191670b2d9",
      "praxis:restaurant:da21ccfe2c593bbc494eff89",
      "praxis:restaurant:e4098185c3942818fd2976b5",
      "praxis:restaurant:20e6c0abc60eaf2f530a0cea",
      "praxis:restaurant:f7be11a2d29a00afc46d46e4",
      "praxis:restaurant:ad8f17edf4d994fb38dd43ef",
      "praxis:restaurant:aacf6301e28ce7435fe35a8d",
      "praxis:restaurant:195cacc5840eb8004aa72c76",
      "praxis:restaurant:b9d5d2c249167c39ca293cf9",
      "praxis:restaurant:dc12f40e4adf529d0dc7cef3",
      "praxis:restaurant:0a6a8d63d6b42988d770c742",
      "praxis:restaurant:06867d6cb1fb6f12a1e21f6a",
      "praxis:restaurant:07cd0218d5b699afb55a000c",
      "praxis:restaurant:d133d4883e732c003f576cb7",
      "praxis:restaurant:e5547653fb94283970069c18",
      "praxis:restaurant:dd50ce5355cb20b7667c519f",
      "praxis:restaurant:ef4803adce7969d0beda10fd",
      "praxis:restaurant:b9704ed0f034bb8579b0011a",
      "praxis:restaurant:359e4485b73417043bd3a76a",
      "praxis:restaurant:47b0d8ea73a39e2d09d7074c",
      "praxis:restaurant:87c21f343a861551cc74a5ad",
      "praxis:restaurant:b9fff419ba64781a45c88def",
      "praxis:restaurant:459dfe281a5cfef4cccacaf1",
      "praxis:restaurant:53acda19b0d83a3ec068407c",
      "praxis:restaurant:32ac5ab341f1cd24c615679f",
      "praxis:restaurant:28b82b90db6e6104bc534f75",
      "praxis:restaurant:458888085452a19dd495d82a",
      "praxis:restaurant:78322026d87b9722cf25eadf",
      "praxis:restaurant:4a3da70a476944ea2aacbfbc"
    ],
    "remainingGaps": [
      "Japanese Restaurant HIRAKAWA / Teppanyaki YAMAHIKO / Sushi UMIHIKO: availability UNKNOWN (AVAILABILITY_RESULT_UNOBSERVED); facts COMPLETED",
      "Chiso Konya: availability UNKNOWN (AVAILABILITY_RESULT_UNOBSERVED); facts COMPLETED",
      "Tanimoto Kagurazaka: availability UNKNOWN (RESERVE_REACHED); facts NOT_CHECKED",
      "Kagurazaka Marutomi: availability UNKNOWN (RESERVE_REACHED); facts NOT_CHECKED",
      "Kaiseki Japanese cuisine Utou: availability UNKNOWN (BROWSER_TIMEOUT); facts NOT_CHECKED",
      "Washoku Kagurazaka KUROSU: availability UNKNOWN (BROWSER_TIMEOUT); facts NOT_CHECKED",
      "Fushikino: availability UNKNOWN (RESERVE_REACHED); facts NOT_CHECKED",
      "Yumeji: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "Tonami: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "Sen Kagurazaka: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "Ichirin: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "Kagurazaka Jin: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "神楽坂 料亭牧: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "Kaga: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "Kohaku: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "Kaga Namafu Kappo Kagurazaka MAEDA: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "Kisouan Sasaki: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "Sugata: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "Chisô Kon'ya: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "Washokubiyori Osaketo Kagrazaka: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "Kagurazaka Yukimoto: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "Washoku Kouseki Kagurazaka: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "Sushi Tempura Yokota Kagurazaka: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "Yukawa: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "Shun Bunke: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "Kagurazaka Ishikawa: availability UNKNOWN (REQUEST_SELECTION_UNCONFIRMED); facts NOT_CHECKED",
      "Iwakura: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "Waraku: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "Sakanohana Kagurazaka: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "Sushi Ōya: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "和食 おの寺 神楽坂: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "日本料理 ほそ川 神楽坂: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "鮨 輝らく: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "Byakuya: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "SHIGEtei（シゲ テイ）和食 神楽坂: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "Ebihara: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "Kaiseki Ichimonji: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "Madoy Kagurazaka Annex: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "葉歩花庭: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "縁楽: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "Menosou: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "Kagurazaka Shimakin: availability NOT_CHECKED (no request-bound slot established); facts NOT_CHECKED",
      "Candidate tablecheck:hotel-edmont-hirakawa-yamahiko-umihiko lacks fresh evidenced availability for the authoritative request",
      "Candidate tablecheck:konya lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:1db081478051e3a02544377a lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:6cc81449aa7bf11c1e1ef9d0 lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:eeb6396dbd632839d53c45c8 lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:f10f0d8bee11fbdc94d0bc0f lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:54df5897171d1671649b54d4 lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:4bfb0fb99c969e697bb9f046 lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:fc695d21e3a6cf8c3fe37245 lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:4b8fa44777292514afe3822d lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:afa6c9876a2fa4eeb5068aaa lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:ea7f13811ba2762a8809896a lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:1ff19a760dc5f0cedd03338b lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:5cbf32a9a81327191670b2d9 lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:da21ccfe2c593bbc494eff89 lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:e4098185c3942818fd2976b5 lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:20e6c0abc60eaf2f530a0cea lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:f7be11a2d29a00afc46d46e4 lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:ad8f17edf4d994fb38dd43ef lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:aacf6301e28ce7435fe35a8d lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:195cacc5840eb8004aa72c76 lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:b9d5d2c249167c39ca293cf9 lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:dc12f40e4adf529d0dc7cef3 lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:0a6a8d63d6b42988d770c742 lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:06867d6cb1fb6f12a1e21f6a lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:07cd0218d5b699afb55a000c lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:d133d4883e732c003f576cb7 lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:e5547653fb94283970069c18 lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:dd50ce5355cb20b7667c519f lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:ef4803adce7969d0beda10fd lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:b9704ed0f034bb8579b0011a lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:359e4485b73417043bd3a76a lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:47b0d8ea73a39e2d09d7074c lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:87c21f343a861551cc74a5ad lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:b9fff419ba64781a45c88def lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:459dfe281a5cfef4cccacaf1 lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:53acda19b0d83a3ec068407c lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:32ac5ab341f1cd24c615679f lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:28b82b90db6e6104bc534f75 lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:458888085452a19dd495d82a lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:78322026d87b9722cf25eadf lacks fresh evidenced availability for the authoritative request",
      "Candidate praxis:restaurant:4a3da70a476944ea2aacbfbc lacks fresh evidenced availability for the authoritative request",
      "MODEL_CALL_RESERVE: This bounded investigation is ending before its call budget is exhausted, with no qualified candidate. Checked candidates and their unknown reasons are listed separately; unread sources, candidates and evidence remain gaps. This does not establish that every restaurant has no seats."
    ]
  },
  "availabilityChecks": {
    "tablecheck:konya": {
      "status": "UNKNOWN",
      "checkedAt": "2026-10-11T15:41:18.878Z",
      "evidenceIds": [
        "evidence:restaurant:tablecheck-entity-match:848b54f4b2fe6109366f6882"
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
      "requestFingerprint": "{\"date\":\"2026-10-22\",\"timeWindow\":{\"earliest\":\"19:30\",\"latest\":\"19:30\"},\"partySize\":3}"
    },
    "tablecheck:hotel-edmont-hirakawa-yamahiko-umihiko": {
      "status": "UNKNOWN",
      "checkedAt": "2026-10-11T15:41:42.809Z",
      "evidenceIds": [
        "evidence:restaurant:tablecheck-entity-match:178bdef63b2ccb0e3bfcdabb"
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
      "requestFingerprint": "{\"date\":\"2026-10-22\",\"timeWindow\":{\"earliest\":\"19:30\",\"latest\":\"19:30\"},\"partySize\":3}"
    },
    "praxis:restaurant:eeb6396dbd632839d53c45c8": {
      "status": "UNKNOWN",
      "checkedAt": "2026-10-11T15:44:05.525Z",
      "evidenceIds": [],
      "reasonCode": "BROWSER_TIMEOUT",
      "sourceAttempts": [
        {
          "source": "TABLECHECK",
          "outcome": "FAILED",
          "reasonCode": "TABLECHECK_ENTITY_MATCH_UNCERTAIN"
        },
        {
          "source": "TABELOG",
          "outcome": "FAILED",
          "reasonCode": "BROWSER_TIMEOUT"
        }
      ],
      "sourceProvider": "AVAILABILITY_SOURCE_RESOLVER",
      "requestFingerprint": "{\"date\":\"2026-10-22\",\"timeWindow\":{\"earliest\":\"19:30\",\"latest\":\"19:30\"},\"partySize\":3}"
    },
    "praxis:restaurant:f10f0d8bee11fbdc94d0bc0f": {
      "status": "UNKNOWN",
      "checkedAt": "2026-10-11T15:45:05.536Z",
      "evidenceIds": [],
      "reasonCode": "BROWSER_TIMEOUT",
      "sourceAttempts": [
        {
          "source": "TABLECHECK",
          "outcome": "FAILED",
          "reasonCode": "TABLECHECK_ENTITY_MATCH_UNCERTAIN"
        },
        {
          "source": "TABELOG",
          "outcome": "FAILED",
          "reasonCode": "BROWSER_TIMEOUT"
        }
      ],
      "sourceProvider": "AVAILABILITY_SOURCE_RESOLVER",
      "requestFingerprint": "{\"date\":\"2026-10-22\",\"timeWindow\":{\"earliest\":\"19:30\",\"latest\":\"19:30\"},\"partySize\":3}"
    },
    "praxis:restaurant:07cd0218d5b699afb55a000c": {
      "status": "UNKNOWN",
      "checkedAt": "2026-10-11T15:45:32.860Z",
      "evidenceIds": [
        "evidence:restaurant:tabelog-entity-match:bf3c4ec102564a43bfdee30e"
      ],
      "reasonCode": "REQUEST_SELECTION_UNCONFIRMED",
      "sourceAttempts": [
        {
          "source": "TABLECHECK",
          "outcome": "FAILED",
          "reasonCode": "TABLECHECK_ENTITY_MATCH_UNCERTAIN"
        },
        {
          "source": "TABELOG",
          "outcome": "FAILED",
          "reasonCode": "REQUEST_SELECTION_UNCONFIRMED"
        }
      ],
      "sourceProvider": "AVAILABILITY_SOURCE_RESOLVER",
      "requestFingerprint": "{\"date\":\"2026-10-22\",\"timeWindow\":{\"earliest\":\"19:30\",\"latest\":\"19:30\"},\"partySize\":3}"
    },
    "praxis:restaurant:1db081478051e3a02544377a": {
      "status": "UNKNOWN",
      "checkedAt": "2026-10-11T15:45:35.662Z",
      "evidenceIds": [],
      "reasonCode": "RESERVE_REACHED",
      "sourceProvider": "AVAILABILITY_SOURCE_RESOLVER",
      "requestFingerprint": "{\"date\":\"2026-10-22\",\"timeWindow\":{\"earliest\":\"19:30\",\"latest\":\"19:30\"},\"partySize\":3}"
    },
    "praxis:restaurant:6cc81449aa7bf11c1e1ef9d0": {
      "status": "UNKNOWN",
      "checkedAt": "2026-10-11T15:45:35.662Z",
      "evidenceIds": [],
      "reasonCode": "RESERVE_REACHED",
      "sourceProvider": "AVAILABILITY_SOURCE_RESOLVER",
      "requestFingerprint": "{\"date\":\"2026-10-22\",\"timeWindow\":{\"earliest\":\"19:30\",\"latest\":\"19:30\"},\"partySize\":3}"
    },
    "praxis:restaurant:54df5897171d1671649b54d4": {
      "status": "UNKNOWN",
      "checkedAt": "2026-10-11T15:45:35.662Z",
      "evidenceIds": [],
      "reasonCode": "RESERVE_REACHED",
      "sourceProvider": "AVAILABILITY_SOURCE_RESOLVER",
      "requestFingerprint": "{\"date\":\"2026-10-22\",\"timeWindow\":{\"earliest\":\"19:30\",\"latest\":\"19:30\"},\"partySize\":3}"
    }
  },
  "selectedCandidateId": null,
  "bookingHandoffs": null,
  "pageQuestion": null
}
```
