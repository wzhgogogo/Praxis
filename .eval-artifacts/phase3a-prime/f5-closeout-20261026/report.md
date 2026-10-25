# F5复核收尾与main集成

- Document revision: 1.0
- Evidence status: reviewed F5 mechanism; case01 known limitation; not Clean Baseline
- 复核编号20261026；执行时间2026-10-25T20:49:53.718394+01:00（维也纳CET UTC+1，客户端10月26日凌晨对应维也纳前一日）。

用户停止点3b复核确认：F5按完成标准FAIL（例01 0/3），结束F5；**ADR-0043机制已在Live验证；例01能力未达成，转3b店名解析与F6**。这是带已知限制合入，不把纠正3/3执行写成找店能力通过。按批准重放最新main 0a254f05，双方历史记录与预算并集保留，23条账本／累计8Live、334模型、45Google、3环境重跑、7评测GET均不变；原始F5产物逐字节不变。旧e169e606留annotated checkpoint。五门禁将在本次干净候选提交运行，全绿且净树后才快进main并推送；新增真实调用0，不加载.env。时间2026-10-25T20:49:53.718394+01:00，CET。

切片承诺：把已复核机制带已知限制合入最新main，保留全部双方记录与原评价；五门禁证明组合未退化，不能替代已FAIL的Live能力验收。随后F3只审计，F6只草案，停止点4等复核。

[重放审计](rebase-audit.json)；[原Live报告](../f5-live-rerun/report.md)。门禁与远端合入收据在完成后追加。
