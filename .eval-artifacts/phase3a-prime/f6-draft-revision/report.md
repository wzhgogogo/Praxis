# ADR0045停止点4修订（只设计）

Evidence status: draft / not integrated；当前产品不因本修订改变。独立分支codex/docs-adr-0045-median-read-reserve，从已验收main afd9c4e1开始。全部维也纳CET，真实调用新增0，不读.env。

62个完成动作由先冻结的脚本重算：搜索23样本中位45.154s、事实16样本30.3835s、查位23样本46.453s；加20s后为65.154／50.3835／66.453s。三个删失尾段排除，不加根模型最大值、不取5秒整。各组中间行与原Git/SHA见thresholds.json。前稿190s门槛撤回，新增100s准入控制。

现有事件可以表达部分结果，Router事实/查位已有完整逐店checkpoint及reserve恢复；SEARCH还缺父取消后的完成快照交接，当前不能保证内部完成候选都持久化。草案给出具体位置、限制与最小接线代价，保留所有资格门控；新增取消时保留A、B未知和搜索交接控制，F6控制本批NOT_RUN。

只改ADR与证据文档，src/scripts/package相对afd9c4e1零差异，budget原字节不变。按用户要求本纯文档切片仍跑五门禁，收据另附；这些门禁只证明现有基线不退化，不是F6设计已实施。

五门禁收据：be57660f，typecheck、arch:check、默认1054、build、Chromium161全绿；每项前后净树。F6本批不实施，红绿设计NOT_RUN；此后只归档门禁日志，源码仍零差异。按用户批准将文档分支合main并推送，待用户批准设计后才能实施F6。
