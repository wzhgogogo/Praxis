# 留出集条件措辞：复核者判定（评价前，未看结果）

对象：`pending-criterion-wordings.json`（9 份产物、15 对），`fed47d8c`。复核时间：2026-10-22 20:20 北京（Vienna 14:20）。复核者只看了措辞文件，文件中不含任何运行结果。判定依据为 holdout.yaml 中的用户原文和 Gold。每项判定只对所列产物有效，按产物 SHA 和条件编号写入 artifact-criterion-correspondence@1，不作为通用同义词规则。

| 产物 | Gold | 产品措辞 | 判定 |
| --- | --- | --- | --- |
| h-02、h-08、h-14（例 02） | Italian（POSITIVE HARD） | Italian restaurant / Italian cuisine | **等价** |
| h-04、h-10、h-16（例 04） | unagi（POSITIVE HARD） | unagi restaurant | **等价** |
| h-05、h-11、h-17（例 05） | Chinese（POSITIVE HARD） | Chinese restaurant | **等价** |
| h-11（例 05） | under 6,000 yen per person（POSITIVE SOFT） | around 6,000 yen per person or less | **不等价。** 用户原文是 "Ideally under 6,000 yen"。产品改成 "around … or less"，按条件政策 "around" 允许 ±20%，会把约 7,200 日元以内也当作满足，比用户要求宽。记为 SOFT 条件的语义偏差（发现项），按评测器既有规则处理，不得视为等价 |
| h-02、h-08、h-14（例 02） | under 8,000 yen per person（POSITIVE HARD） | （无对应措辞） | **不是措辞问题。** 三次运行中，产品的条件列表里都没有这一 HARD 预算条件。评价前请先查明：产品是否以结构化字段（如每人价格上限）保留了它。若保留，按该结构对应并引用证据；若没有，属于**丢失 HARD 条件**，按评测器规则判定，并作为留出集的主要发现报告 |
| 全部交叉配对（如 "under 8,000 yen" 对 "Italian restaurant"） | — | — | **不成立** |

另：2 条耗时记录超出 500 秒不到 80 毫秒，按测量抖动记录，不改变结果分类；如实写入报告。
