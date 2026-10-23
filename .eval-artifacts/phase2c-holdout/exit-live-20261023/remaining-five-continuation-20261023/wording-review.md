# 第二阶段 c 留出集条件措辞：复核者判定（评价前，未看结果）

对象：`pending-wordings.json`（SHA `7c7b9ec0…`，7 份产物、8 条候选配对），`2710e159`。复核时间：2026-10-23 18:10 北京。复核者只看了措辞包，以及例 03 两次运行的解析意图中的 budgetPerPerson 字段；没有读取任何结果、价格、条件状态或交付字段。每项判定只对所列产物有效，按产物 SHA 和条件编号登记，不作为通用同义词规则。

| 产物 | Gold | 产品措辞 | 判定 |
| --- | --- | --- | --- |
| h-02 (b6faa853)、h-08 (897ee0cd)（例 02） | [0] Korean（P HARD） | [0] Korean food | **等价** |
| h-03 (077afcc5)、h-09 (72dc7f78)（例 03） | [0] fugu（P HARD） | [0] fugu restaurant | **等价** |
| h-03、h-09（例 03） | [2] no more than 10,000 yen per person（P HARD） | 条件列表中没有 | **按结构字段对应**：两次运行解析意图均为 `budgetPerPerson {"max": 10000, "currency": "JPY"}`，与原文数值、方向和"每人"一致。写入 structured-budget-bindings.json，走预算条件路径（超出或价格未知 → 未满足）。注意：例 03 已按见证规则排除出能力分母，仍照常评价并报告。 |
| h-05 (b125f0c6)、h-11 (d914a5cc)（例 05） | [0] steak（P HARD） | [0] steak restaurant | **等价** |
| h-12 (25fc4252)（例 06） | — | [1] suitable for an office group（P UNSPECIFIED） | **产品额外条件，没有 Gold 对应。** 来自用户原话 "a group of 8 from the office"，强度为 UNSPECIFIED，不构成偏差，也不得阻挡交付。单列报告，不使该次运行变为未评价。 |
| 交叉配对（h-03/h-09 "no more than 10,000" 对 "fugu restaurant"） | — | — | **不成立** |
