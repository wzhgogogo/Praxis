# v23单次对照（不计新规则通过率）

同模型deepseek-v4-flash、同一条消息、相同参考时间/时区和pre-turn currentDraft。保留原v23+Schema3，与v24+Schema4存在契约包差别；定向选择11轮，不能据此估计旧Prompt全量成功率或严格因果。

| 开发轮次 | 控制结果 | 与v24对照 |
| --- | --- | --- |
| SR01-T01 | CONTROL_ONLY_NOT_IN_PRIMARY_RATE | 与v24非目标请求值相同，旧Prompt也复现差异 |
| SR03-T02 | CONTROL_ONLY_NOT_IN_PRIMARY_RATE | 措辞/值不同；两者均偏离旧Gold，逐字段看原始记录 |
| SR04-T01 | CONTROL_ONLY_NOT_IN_PRIMARY_RATE | 与v24非目标请求值相同，旧Prompt也复现差异 |
| SR05-T01 | CONTROL_ONLY_NOT_IN_PRIMARY_RATE | 与v24非目标请求值相同，旧Prompt也复现差异 |
| SR06-T01 | CONTROL_ONLY_NOT_IN_PRIMARY_RATE | 与v24非目标请求值相同，旧Prompt也复现差异 |
| SR07-T01 | CONTROL_ONLY_NOT_IN_PRIMARY_RATE | 与v24非目标请求值相同，旧Prompt也复现差异 |
| SR08-T01 | CONTROL_ONLY_NOT_IN_PRIMARY_RATE | 与v24非目标请求值相同，旧Prompt也复现差异 |
| SR08-T02 | INVALID_CONTROL_CONTRACT | 旧Prompt同样产生CRITERION CONFIRM，合同拒绝；无有效控制Draft |
| SR09-T01 | CONTROL_ONLY_NOT_IN_PRIMARY_RATE | 与v24非目标请求值相同，旧Prompt也复现差异 |
| SR09-T02 | CONTROL_ONLY_NOT_IN_PRIMARY_RATE | 与v24非目标请求值相同，旧Prompt也复现差异 |
| SR10-T01 | CONTROL_ONLY_NOT_IN_PRIMARY_RATE | 与v24非目标请求值相同，旧Prompt也复现差异 |

## 观察与限制

- 10份有效控制仍偏离旧Gold，其中9份非目标请求值与v24相同。
- SR03-T02两者都丢失具名Sushi Dai，只是泛化query措辞不同。
- SR08-T02旧Prompt也输出集合CRITERION CONFIRM，单次即合同失败，没有追加重试。
- SR01-T01的yakiniku HARD在旧Prompt也出现；不能称为v24独有。
- 这些控制与既有模型/Gold/时间物化口径差异相容；单对照、继承上下文及Schema3/4差别不足以单独隔离新Prompt影响或模型波动。全部对照和原始输出单列，不修Prompt/Gold。
