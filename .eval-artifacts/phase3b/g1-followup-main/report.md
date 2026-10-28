# 3b B：复核通过后的 main 整合

2026-10-28（Vienna CET，UTC+1）。Evidence status：current offline integration regression；真实模型质量由A独立评测，本批B未运行。

用户已批准将B `dc486430` 合入并推送main。合入前获取最新main `90b464d8`，它已是B分支祖先，无需修改源码或处理产品冲突。当前切片只重新验证并交付已复核实现，之后停下等待C合入身份改动。

## 复核及版本

用户转达独立复核者在Linux上对B `dc486430`、C `053e2e2e` 的五门禁与普通G2全部通过；这是用户提供的独立复核证据，不冒充本机执行日志。[前置记录](preflight.json)。

本机受测提交 `a5a3c57a`。src、scripts、web-skills、package/lock及tsconfig完整范围与已复核B逐字节相同；没有新增产品改动。继续保留每题独立60秒、3次模型、2次新页面访问，以及持久会话20题上限；重启后可追问，唯一合法动作由代码选择，仍经Validator/Router/Reducer。

ADR-0046为Accepted revision0.3；State24、TaskDefinition22、Agent Prompt29、Action Schema5、Context17和独立问答Prompt/Schema2均不变。原六项红绿、页面上限反事实和旧HARD完整44,197字节同SHA证据已获复核，本批复用，不为纯整合重复制造红灯。[已复核实现报告](../g1-question-budget/report.md)。网站适配器3,847行、Pack473行保持，目标≤3,591留G3。

## 合入前重跑结果

macOS26.6.2 arm64，Node24.4.1；Chromium文件并行4。每项前后git status为空，restorations=0，fail/skip/cancel均0。本批没有为通过门禁修改源码或降低断言。

| 检查 | 结果 | 用例／耗时 |
|---|---|---|
| typecheck | PASS | 0.624秒 |
| arch:check | PASS | 0.234秒 |
| npm test | PASS | 1168/1168，30.093秒 |
| build | PASS | 0.509秒 |
| test:browser:fixture | PASS | 175/175，108.322秒 |
| 普通 test:dom-change | PASS | 4/4，21.361秒 |

G2采用现有普通基线：12页中8 PASS、4 DEGRADED_HONEST、0 FAIL，sourceTransportCalls全部0。**这不是G3严格验收，也不表示Tabelog日历已全部PASS。** 严格 `PRAXIS_G2_REQUIRE_PASS=1` 的门槛留C合入后的G3。[逐页基线](g2-baseline.json)。

666份可执行输入和本批外层先提交再运行，运行后及发布前核对一致。冻结清单、外层与原始日志SHA见[完整门禁记录](verification/gates.json)和[核验摘要](verification.json)，[冻结输入](input-freeze/freeze.json)已保留。Chromium为单次108.322秒，不称三次中位数。main工作区也已核对净树，没有新增路径覆盖既有未跟踪文件的冲突。[工作区检查](main-worktree-preflight.json)。

## 交付与停止条件

五门禁及普通G2已通过，随后按用户授权将当前候选快进到main并推送，无强推。实际main SHA和远端核对记录随后附加。受测提交之后只同步报告、账本和历史，不改可执行输入。

共享账本按id保留原条目，仅追加本批0调用整合记录，现23个唯一id。新增真实模型、Google、餐厅网站、完整Live、环境重跑、评测公开GET均0；不读取.env或answers*.json。Mock/本地Chromium/G2回归不当作真实模型质量或Live证据。

完成B main交付后，**停下等待C同步并合入其身份改动**，B不替C合并。C完成后才从最新main开G3分支，先Tabelog，逐项先红后绿、保留核验、重写/删除对应私有逻辑测试并列清单；其余测试审查由A负责。TableCheck等待首次Live的有时段日历。本批没有开始G3、修改A/C源码或调用真实模型。A可在B main发布后按其授权开展G1真实模型评测；B不代跑或自评。
