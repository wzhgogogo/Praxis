# E1 校准对照（开发集，非 Clean Baseline）

状态：BLOCKED_NOT_ACCEPTED；退出码 1；自动源码 8bdf88ccda4b0cbedea3a0c51b7b7aa92d332ceb。

结果类型 21/22；8次实际交付 7/8；正常S0 7/20；两中断S0允许未评价 2/2；误判合格 0。

| 运行 | 自动类型 | 人工类型 | 自动S0／人工 | 已确认自动严重程度／人工 | 类型一致 | 分歧 |
| --- | --- | --- | --- | --- | --- | --- |
| [p1fA-kf-h001-a1](../evaluations/p1fA-kf-h001-a1.evaluation.29.8dfba0bf-d5b7-4ce6-8abb-dc9cb532ff3b.json) | QUALIFIED_DELIVERY | QUALIFIED_DELIVERY | ABSENT / NO | 无PRESENT（非全维无错） / NONE | 是 | — |
| [p1fA-kf-h002-a1](../evaluations/p1fA-kf-h002-a1.evaluation.29.6f923925-393f-47f5-8540-66d930a355b0.json) | NOT_EVALUATED | QUALIFIED_DELIVERY | ABSENT / NO | 无PRESENT（非全维无错） / NONE | 否 | OUTCOME:GOLD_MISSING |
| [p1fA-kf-h003-a1](../evaluations/p1fA-kf-h003-a1.evaluation.29.b4e441fe-71bf-4d6e-8dde-ac6256308ed0.json) | ORCHESTRATION_INTERRUPTED | ORCHESTRATION_INTERRUPTED | NOT_EVALUATED / NO | 无PRESENT（非全维无错） / NONE | 是 | 两中断例外：缺result且trace不足 |
| [p1fA-kf-h004-a1](../evaluations/p1fA-kf-h004-a1.evaluation.29.b242cea7-d866-4fae-8a0f-ee6721c2e1d8.json) | QUALIFIED_DELIVERY | QUALIFIED_DELIVERY | ABSENT / NO | S3 / S3 | 是 | — |
| [p1fA-kf-h005-a1](../evaluations/p1fA-kf-h005-a1.evaluation.29.868bf5a6-7be6-4a6a-a6f6-92fe13f18c98.json) | ORCHESTRATION_INTERRUPTED | ORCHESTRATION_INTERRUPTED | NOT_EVALUATED / NO | 无PRESENT（非全维无错） / NONE | 是 | 两中断例外：缺result且trace不足 |
| [p1fA-kagurazaka-a1](../evaluations/p1fA-kagurazaka-a1.evaluation.29.3e5820dc-e44f-410b-bec3-0dc6156c7837.json) | CAPABILITY_MISS | CAPABILITY_MISS | NOT_EVALUATED / NO | S2 / S2 | 是 | S0:GOLD_MISSING |
| [p1fA-nakameguro-a1](../evaluations/p1fA-nakameguro-a1.evaluation.29.b011578f-8e4d-4db6-930f-e8854ce7bd30.json) | QUALIFIED_DELIVERY | QUALIFIED_DELIVERY | NOT_EVALUATED / NO | 无PRESENT（非全维无错） / NONE | 是 | S0:GOLD_MISSING |
| [p1fA-kf-h003-a2](../evaluations/p1fA-kf-h003-a2.evaluation.29.f7c62eb5-cb88-46e3-b994-65ee7d48013c.json) | DELIVERED_UNQUALIFIED | DELIVERED_UNQUALIFIED | NOT_EVALUATED / NO | S1 / S1 | 是 | S0:GOLD_MISSING |
| [p1fA-kf-h005-a1r](../evaluations/p1fA-kf-h005-a1r.evaluation.29.be4bd2af-0b6d-4efd-9c93-6e1fb9f7bc97.json) | CAPABILITY_MISS | CAPABILITY_MISS | NOT_EVALUATED / NO | S2 / S2 | 是 | S0:GOLD_MISSING |
| [p1fA-kichijoji-a2](../evaluations/p1fA-kichijoji-a2.evaluation.29.0407e0e2-060e-416f-8cb4-9e17af2cd8e0.json) | INTERNAL_FAILURE | INTERNAL_FAILURE | NOT_EVALUATED / NO | S2 / S2 | 是 | S0:GOLD_MISSING |
| [p1fB-h001-a1](../evaluations/p1fB-h001-a1.evaluation.29.aee67ac7-9a8f-4366-b964-eb0cce12b003.json) | INTERNAL_FAILURE | INTERNAL_FAILURE | NOT_EVALUATED / NO | 无PRESENT（非全维无错） / NONE | 是 | S0:GOLD_MISSING |
| [p1fB-h002-a1](../evaluations/p1fB-h002-a1.evaluation.29.33d28293-1876-4a72-9343-1fc074407a61.json) | QUALIFIED_DELIVERY | QUALIFIED_DELIVERY | ABSENT / NO | 无PRESENT（非全维无错） / NONE | 是 | — |
| [p1fB-h003-a1](../evaluations/p1fB-h003-a1.evaluation.29.b0830f79-49ef-4a06-9d56-7e56bbe204ab.json) | ENV_FAILURE | ENV_FAILURE | NOT_EVALUATED / NO | 无PRESENT（非全维无错） / NONE | 是 | S0:GOLD_MISSING |
| [p1fB-h004-a1](../evaluations/p1fB-h004-a1.evaluation.29.779c4e51-1619-4ce3-aeef-225dabe5a942.json) | ENV_FAILURE | ENV_FAILURE | NOT_EVALUATED / NO | 无PRESENT（非全维无错） / NONE | 是 | S0:GOLD_MISSING |
| [p1fB-h005-a2](../evaluations/p1fB-h005-a2.evaluation.29.9d65021d-ff17-4cd9-a0a6-b6617a75019a.json) | HONEST_NO_RESULT | HONEST_NO_RESULT | NOT_EVALUATED / NO | 无PRESENT（非全维无错） / NONE | 是 | S0:GOLD_MISSING |
| [p1g-kichijoji-a2](../evaluations/p1g-kichijoji-a2.evaluation.29.88246994-7446-4f7e-8701-7bddbb58cc6f.json) | CAPABILITY_MISS | CAPABILITY_MISS | ABSENT / NO | S2 / S2 | 是 | — |
| [p1g-h001-a1](../evaluations/p1g-h001-a1.evaluation.29.d98cf10d-76be-45dd-a230-3fa7d721ce1d.json) | INTERNAL_FAILURE | INTERNAL_FAILURE | NOT_EVALUATED / NO | 无PRESENT（非全维无错） / NONE | 是 | S0:GOLD_MISSING |
| [p1g-h003-a2](../evaluations/p1g-h003-a2.evaluation.29.96e50fd4-2b64-40ad-95c0-600f6a83c50f.json) | DELIVERED_UNQUALIFIED | DELIVERED_UNQUALIFIED | NOT_EVALUATED / NO | S1 / S1 | 是 | S0:GOLD_MISSING |
| [p1g-h004-a2](../evaluations/p1g-h004-a2.evaluation.29.e9f70c1a-1cdc-42f1-9227-532bbe076ea1.json) | ENV_FAILURE | ENV_FAILURE | ABSENT / NO | 无PRESENT（非全维无错） / NONE | 是 | — |
| [p1g2-h001-a4](../evaluations/p1g2-h001-a4.evaluation.29.81640330-7e2a-400e-81fe-9ce09aaa130b.json) | INTERNAL_FAILURE | INTERNAL_FAILURE | NOT_EVALUATED / NO | 无PRESENT（非全维无错） / NONE | 是 | S0:RULE_GAP |
| [p20-h002-a1](../evaluations/p20-h002-a1.evaluation.29.b6a531b7-5590-45da-bbdf-d83e4f846282.json) | QUALIFIED_DELIVERY | QUALIFIED_DELIVERY | ABSENT / NO | 无PRESENT（非全维无错） / NONE | 是 | — |
| [p20-h001-a1](../evaluations/p20-h001-a1.evaluation.29.16aa67df-db99-46cc-b306-d235d40d9e18.json) | CAPABILITY_MISS | CAPABILITY_MISS | NOT_EVALUATED / NO | S2 / S2 | 是 | S0:RULE_GAP |
