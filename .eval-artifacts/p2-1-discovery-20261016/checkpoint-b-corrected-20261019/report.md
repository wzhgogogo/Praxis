# P2-1 检查点 B 修正与重测

Status: current executable — 离线修正及五门禁已完成；新检查点尚未启动。

范围仅为用户 2026-10-19 按复核4592a1e批准的三项修正，以及预检外层的检查点计数／503等待。旧B三次另列[B 第一版](superseded-b-first.json)，不进入新比较，原产物不改。

- 地区首页筛选回到此前观察到的同地区列表根；缺观察、跨地区仍拒绝。
- 稀疏且有类别、改写未耗尽时，Schema@2及Domain／执行器拒绝KEEP；Prompt@5；其余允许KEEP的情况不变。
- [TableCheck离线诊断](fixes/tablecheck-diagnosis.json)：三次均是搜索错误页，新增open_from/open_until预检被现有规则拒绝。停用搜索筛选，SKIPPED/FILTER_TRANSPORT_NOT_REVIEWED，不拓宽网络权限，不把错误当无位。

修正前有效红灯：[首页与KEEP](fixes/red.log)、[停用TableCheck筛选](fixes/tablecheck-red.log)。[局部绿灯](fixes/unit-green.log)、[生产factory/Guard真实Chromium首页组合](fixes/browser-focused-green.log)。五门禁全绿：typecheck、arch:check、npm test 951/951、build、test:browser:fixture 119/119；[日志和SHA](fixes/verification.json)。

待五门禁全绿、提交、干净宿主机worktree冻结后，按原十个输入从头探测；模型起点278/450、探测44/55、Google117。本批不跑完整Live。
