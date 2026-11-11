# 2026-11-09 CET 部分见证认证选择

Status: verified integration candidate，源码d8d413a2；按本轮授权快进main并推送/ls-remote后执行条件流程。原文件/私有清单没有人工打开或复制。

- --cases只能搭配--certify-only；整份私有清单仍先过承诺、ID顺序、日期回填、逐字及SHA校验。只认证选中ID，保持原清单顺序；未知/重复/空ID拒绝，正式命令不允许--cases。
- 仍按同一账本累计认证12GET/总126，5秒间隔、单次GET、无自动换店或重试。整份清单哈希审计与全部私有回合遮盖保留，另记selectedCaseIds。
- 虚构六例选三准确3GET，坏ID零额外GET/扣费；原有认证隐私/计数/模式互斥回归通过，针对性5项。源码只改src/eval三文件，产品/Guard/G1/时限无改。
- d8d413a2同SHA净树门禁全绿：type/arch、默认1544、build、Chromium260+G6 83、strictG2全12，写死扫描新增0。实现阶段真实调用0。
- 用户纠正来源空位时间为JST原值，后续不换算；旧CET展示保留为历史。下一步仅用v2 SHA0967a9dc…补认证01/03/05三GET到heldout-certification-second；任一非true就停止。全部true才以同一净树mainSHA/v2/同账本运行heldout-run-20261109。停批不干预、环境/证据/S0等待复核；仅体检失败恢复允许resume最多2次。逐次报告，不汇总通过率。

完整门禁见gates.json，虚构控制见targeted.log，操作边界见runner-guide.md。真实执行结果另存对应运行目录，本报告不预断结果。
