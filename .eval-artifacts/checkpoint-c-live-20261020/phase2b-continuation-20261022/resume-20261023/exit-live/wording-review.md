# 第二阶段 b 留出集条件措辞：复核者判定（评价前，未看结果）

对象：`pending-words.json`／`pending-wordings.json`（14 份产物、20 条候选配对），`a55e2999`。复核时间：2026-10-23 06:55 北京（Vienna 00:55）。复核者只看了措辞包；复核者核对过，包中不含 QUALIFIED、CAPABILITY、DELIVER、MET 等结果字样。依据为 holdout.yaml 的用户原文、Gold 和 acceptance。每项判定只对所列产物有效，按产物 SHA 和条件编号登记，不作为通用同义词规则。

| 产物 | Gold | 产品措辞 | 判定 |
| --- | --- | --- | --- |
| h-01、h-07、h-13（例 01） | [0] sukiyaki（P HARD） | [0] sukiyaki restaurant | **等价** |
| h-03、h-09、h-15（例 03） | [0] French（P HARD） | [0] French cuisine | **等价** |
| h-04、h-10、h-16（例 04） | [0] Thai（P HARD） | [0] Thai restaurant | **等价** |
| h-05、h-11、h-17（例 05） | [0] soba（P HARD） | [0] soba restaurant | **等价** |
| h-03、h-09、h-15（例 03） | [1] at most 15,000 yen per person（P HARD） | （条件列表中没有） | **不是措辞问题。** 按已批准的流水线规则，核对 `intent.budgetPerPerson` 是否保存了 max=15000 JPY；若保存，按结构对应并引用字段，若没有则判为丢失 HARD 条件 |
| h-05、h-11、h-17（例 05） | — | [1] sit-down restaurant with tables（P HARD） | **没有 Gold 对应，是产品多出的一个条件。** 用户原文是 "a sit-down soba restaurant … Not a standing soba counter"，Gold 用负向条件 "standing soba counter" 加 acceptance 表达同一意思。产品另加了正向 "sit-down"，可以理解；但 "with tables" 比用户要求窄（坐着吃的吧台店也符合用户要求）。处理：不作为 Gold 条件的对应，也不让它使整次运行变为未评价；在报告中单列为"产品额外条件"，并检查它是否导致排除了坐席吧台店（如有，记为过度约束的发现） |
| h-02（例 02） | [1] under 4,000 yen per person（P SOFT） | [1] around 4,000 yen per person or less | **不等价。** 与上一留出集 h-11 相同的已知偏差（"ideally under" 被解释为 "around"），已列入第三阶段。本例 acceptance 明确要求"保持 under 4,000，而不是 around 4,000"，按评测器既有规则评价，作为发现项报告 |
| h-08（例 02） | [1] under 4,000 yen per person（P SOFT） | [1] around 4,000 yen per person | **不等价**，比 h-02 更宽（没有 "or less"）。处理同上 |
| 所有交叉配对（如 "at most 15,000" 对 "French cuisine"，"soba" 对 "sit-down restaurant with tables"） | — | — | **不成立** |

另：川上庵登记为跳过，未打开官方预约链接。这符合只读边界，记录在案。
