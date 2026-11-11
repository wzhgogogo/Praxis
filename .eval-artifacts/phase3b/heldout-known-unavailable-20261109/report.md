# 2026-11-09 CET 显式已知无位见证准入

Status: verified integration candidate；源码a002b037，按用户授权发布main并核对远端后执行v3条件流程。本报告只覆盖实现阶段，未人工读取私有原文/清单。

- 清单仅接受allowKnownUnavailableCertificate:true或缺省，detail-only仍拒绝。未标记false认证仍拒开跑，null仍不满足空位认证；实际false且有标记才能进入既有诊断流程，其他读取、配额、时限不改。
- 实际false标NO_POSITIVE_WITNESS_DIAGNOSTIC；即使标记true，只要实际认证true就标STANDARD_G6并走原正向见证处理。负见证不加入正向witnesses。独立身份/完整条件/查位/诚实无结果评分未修改，不因标记获得合格。
- outer batch.witnessPolicies标全清单声明策略，尝试保留实际mode/exists（含恢复）；inner batch slots和execution/failure同样标明。无实际认证时不伪造结果或模式。计划运行仍6x3，不增减用例或自动补评。
- 虚构承诺/清单与实际G6夹具验证严格true、缺省、非法值/详情拒绝、无标记无位停、标记无位诊断/标记有位标准、外层三次分别记录模式；针对性29项。测试元组类型初错原日志保留，修复后typecheck通过。
- a002b037同SHA净树全门禁PASS：type/arch/default1546/build/Chromium260+G6 83/strictG2全12，写死扫描新增0。源码仅src/eval，产品0变化，实现阶段真实调用0。

发布后仅03一次GET到heldout-certification-third，v3 SHA2a91aef4…；true即同一干净mainSHA/完整v3/同账本运行heldout-run-20261109。运行期间不改代码/不读取私有文件/不干预；除体检失败恢复最多2次外，停批原样报告等待。来源时段逐字JST，操作时间CET，不汇总通过率。真实执行另存目录，不预断结果。详见runner-guide.md/gates.json/source-audit.json。
