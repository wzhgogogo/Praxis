# E1 校准对照（开发集，非 Clean Baseline）

状态：BLOCKED_NOT_ACCEPTED；退出码 1；自动源码 355de64f2e5833d2c4f740a59a5d31e06cf9aef2。

结果类型 17/22；8次实际交付 7/8；正常S0 7/20；两中断S0允许未评价 2/2；误判合格 0。

| 运行 | 自动类型 | 人工类型 | 自动S0／人工 | 已确认自动严重程度／人工 | 类型一致 | 分歧 |
| --- | --- | --- | --- | --- | --- | --- |
| [p1fA-kf-h001-a1](../evaluations/p1fA-kf-h001-a1.evaluation.29.ceeff785-3291-44b4-aa8d-9787c80c7d50.json) | QUALIFIED_DELIVERY | QUALIFIED_DELIVERY | ABSENT / NO | 无PRESENT（非全维无错） / NONE | 是 | — |
| [p1fA-kf-h002-a1](../evaluations/p1fA-kf-h002-a1.evaluation.29.9d6bb7ec-3671-44c1-9c33-e5668bf5dfe6.json) | NOT_EVALUATED | QUALIFIED_DELIVERY | ABSENT / NO | 无PRESENT（非全维无错） / NONE | 否 | OUTCOME:GOLD_MISSING |
| [p1fA-kf-h003-a1](../evaluations/p1fA-kf-h003-a1.evaluation.29.339595fe-e3aa-410d-81ca-0200dcd78fa0.json) | ORCHESTRATION_INTERRUPTED | ORCHESTRATION_INTERRUPTED | NOT_EVALUATED / NO | 无PRESENT（非全维无错） / NONE | 是 | 两中断例外：缺result且trace不足 |
| [p1fA-kf-h004-a1](../evaluations/p1fA-kf-h004-a1.evaluation.29.8754bafc-5fce-4ba6-9143-70ff1c620c1d.json) | QUALIFIED_DELIVERY | QUALIFIED_DELIVERY | ABSENT / NO | S3 / S3 | 是 | — |
| [p1fA-kf-h005-a1](../evaluations/p1fA-kf-h005-a1.evaluation.29.08465973-4734-4d46-8740-a7d41c000a7a.json) | ORCHESTRATION_INTERRUPTED | ORCHESTRATION_INTERRUPTED | NOT_EVALUATED / NO | 无PRESENT（非全维无错） / NONE | 是 | 两中断例外：缺result且trace不足 |
| [p1fA-kagurazaka-a1](../evaluations/p1fA-kagurazaka-a1.evaluation.29.fae1d675-ab4d-4b29-b444-7d78d7f9e47a.json) | CAPABILITY_MISS | CAPABILITY_MISS | NOT_EVALUATED / NO | S2 / S2 | 是 | S0:GOLD_MISSING |
| [p1fA-nakameguro-a1](../evaluations/p1fA-nakameguro-a1.evaluation.29.0ad64998-c918-4913-8903-31de37a04e82.json) | QUALIFIED_DELIVERY | QUALIFIED_DELIVERY | NOT_EVALUATED / NO | 无PRESENT（非全维无错） / NONE | 是 | S0:GOLD_MISSING |
| [p1fA-kf-h003-a2](../evaluations/p1fA-kf-h003-a2.evaluation.29.151718d6-742e-4985-800c-60b8b6373cc8.json) | DELIVERED_UNQUALIFIED | DELIVERED_UNQUALIFIED | NOT_EVALUATED / NO | S1 / S1 | 是 | S0:GOLD_MISSING |
| [p1fA-kf-h005-a1r](../evaluations/p1fA-kf-h005-a1r.evaluation.29.c96d2792-1dc8-4af2-9142-6a67c24407d9.json) | CAPABILITY_MISS | CAPABILITY_MISS | NOT_EVALUATED / NO | S2 / S2 | 是 | S0:GOLD_MISSING |
| [p1fA-kichijoji-a2](../evaluations/p1fA-kichijoji-a2.evaluation.29.565fc025-35d5-49e2-981a-3ad2e7f066cd.json) | CAPABILITY_MISS | INTERNAL_FAILURE | NOT_EVALUATED / NO | S2 / S2 | 否 | OUTCOME:EVALUATOR_ERROR; S0:GOLD_MISSING |
| [p1fB-h001-a1](../evaluations/p1fB-h001-a1.evaluation.29.97848308-2f31-4824-9952-bb88d8577cd1.json) | NOT_EVALUATED | INTERNAL_FAILURE | NOT_EVALUATED / NO | 无PRESENT（非全维无错） / NONE | 否 | OUTCOME:EVALUATOR_ERROR; S0:GOLD_MISSING |
| [p1fB-h002-a1](../evaluations/p1fB-h002-a1.evaluation.29.b743b838-bba9-4ef9-8130-cf064bf6bafc.json) | QUALIFIED_DELIVERY | QUALIFIED_DELIVERY | ABSENT / NO | 无PRESENT（非全维无错） / NONE | 是 | — |
| [p1fB-h003-a1](../evaluations/p1fB-h003-a1.evaluation.29.8fbf237b-232b-4360-8e66-2df5dea6e9d4.json) | ENV_FAILURE | ENV_FAILURE | NOT_EVALUATED / NO | 无PRESENT（非全维无错） / NONE | 是 | S0:GOLD_MISSING |
| [p1fB-h004-a1](../evaluations/p1fB-h004-a1.evaluation.29.09fd74da-8559-4915-9a93-47947a6c0551.json) | ENV_FAILURE | ENV_FAILURE | NOT_EVALUATED / NO | 无PRESENT（非全维无错） / NONE | 是 | S0:GOLD_MISSING |
| [p1fB-h005-a2](../evaluations/p1fB-h005-a2.evaluation.29.7a17bad7-7d5f-4266-8a8f-307eb16a7ac7.json) | NOT_EVALUATED | HONEST_NO_RESULT | NOT_EVALUATED / NO | 无PRESENT（非全维无错） / NONE | 否 | OUTCOME:EVALUATOR_ERROR; S0:GOLD_MISSING |
| [p1g-kichijoji-a2](../evaluations/p1g-kichijoji-a2.evaluation.29.6a624770-9b5e-4554-9e22-e09fcafac7a8.json) | CAPABILITY_MISS | CAPABILITY_MISS | ABSENT / NO | S2 / S2 | 是 | — |
| [p1g-h001-a1](../evaluations/p1g-h001-a1.evaluation.29.d17071c2-a558-4194-a62f-452b4ed9a5fb.json) | NOT_EVALUATED | INTERNAL_FAILURE | NOT_EVALUATED / NO | 无PRESENT（非全维无错） / NONE | 否 | OUTCOME:EVALUATOR_ERROR; S0:GOLD_MISSING |
| [p1g-h003-a2](../evaluations/p1g-h003-a2.evaluation.29.4d5c148f-6a33-480d-99ee-b4b678593d4e.json) | DELIVERED_UNQUALIFIED | DELIVERED_UNQUALIFIED | NOT_EVALUATED / NO | S1 / S1 | 是 | S0:GOLD_MISSING |
| [p1g-h004-a2](../evaluations/p1g-h004-a2.evaluation.29.971856ee-898b-4081-8683-23376b23fadb.json) | ENV_FAILURE | ENV_FAILURE | ABSENT / NO | 无PRESENT（非全维无错） / NONE | 是 | — |
| [p1g2-h001-a4](../evaluations/p1g2-h001-a4.evaluation.29.60ff98da-16e1-4152-a71a-d5ea2eb27748.json) | INTERNAL_FAILURE | INTERNAL_FAILURE | NOT_EVALUATED / NO | 无PRESENT（非全维无错） / NONE | 是 | S0:RULE_GAP |
| [p20-h002-a1](../evaluations/p20-h002-a1.evaluation.29.33340c12-159f-436d-8029-1efc6c1454c0.json) | QUALIFIED_DELIVERY | QUALIFIED_DELIVERY | ABSENT / NO | 无PRESENT（非全维无错） / NONE | 是 | — |
| [p20-h001-a1](../evaluations/p20-h001-a1.evaluation.29.2c2f704e-1012-4e58-abfe-b0b146f3c55e.json) | CAPABILITY_MISS | CAPABILITY_MISS | NOT_EVALUATED / NO | S2 / S2 | 是 | S0:RULE_GAP |
