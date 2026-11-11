# TableCheck B1 普通组装：批准后的 main 合入验证

- Status: user-approved main publication / offline evidence。
- 时间：2026-11-01T13:51:02.818795+01:00，维也纳 CET（UTC+1）。
- 用户复核的源码：`ffe8fc8ea0088ac7fe72c506de0b99bb972b52e1`。
- 同步后的 main 基线：`fceecaad717eea21f7642f1b0b1cf35b0aea218e`，已经是 C 分支祖先，无源码冲突。
- 冻结并实际执行的候选：`dfc3bc2b9a2b47a64022aef16988a53912a46f0b`；`freeze.json` 共 735 项 SHA，旧修复包 36 个文件逐字保留。

本轮只复核并发布已经获批的修复。产品、脚本、依赖和编译配置与 `ffe8fc8e` 完全一致；没有重写读取器、校验器、评测或断言。普通组装并列 TableCheck 与 Tabelog 读取器；TableCheck 只旁听现有页面观察，不自行导航。入口来自同店实际可见 reserve 链接，日期、人数、精确时刻沿用已有确定性序列化器，两次服务端校验不变。没有 State、TaskDefinition、Prompt 或 Schema 版本变化。

## 这次新跑的完整门禁

| 检查 | 结果 | 耗时（秒） |
| --- | --- | ---: |
| 冻结完整性（前） | PASS | 0.114 |
| typecheck | PASS | 0.451 |
| arch:check | PASS | 0.213 |
| npm test（1306/1306） | PASS | 31.736 |
| build | PASS | 0.525 |
| test:browser:fixture（187/187） | PASS | 131.777 |
| 严格 G2（5/5；12/12 页面 PASS） | PASS | 24.645 |
| 冻结完整性（后） | PASS | 0.176 |

每项前后 `git status --porcelain` 为空。标准 G2 由 Chromium 首组独占执行，严格 G2 另以 `PRAXIS_G2_REQUIRE_PASS=1` 运行；无失败、跳过、豁免或重复尝试。原始输出、开始/结束 CET、退出码和日志 SHA 见 `gates.json` / `gates/*.log`。

## 证据与边界

A 的原整组装测试、helper 和三个构造输入共 5 文件保持 `02d01196` 原字节。原红灯、绿灯、首轮类型失败及其单行测试修正保留在 [原修复报告](../b1-tablecheck-composition-20261101/report.md)，本轮没有覆盖历史证据。原报告的初始与选店后同店精确交接、红绿初始来源 I/O 同为 5 次、17 项组件反例仍由相同源码与测试覆盖；不能把组件反例称为全部反例均跑过整组装。

本轮是离线构造来源 I/O、本地真实 Chromium、持久 PGlite 的组合验证。没有新增真实模型、Google、网站 GET、Live 或真实 PostgreSQL 调用；没有读取或加载 `.env`，没有读取私有 Holdout。未运行用户浏览器的网站实际预填或预约，链接带入不等于网站已选中或订位成功。

共享账本与复核提交逐字相同：507 条，累计评测 GET 255/290、真实模型 171；本轮新增均为 0，不覆盖他人条目。原 Tabelog 读取器、B 的三个 G3 文件、TableCheck 页解析/查位及领域和应用两次链接校验文件不变。

## 发布与停止点

门禁后仅追加本报告、原始门禁输出、摘要和历史文档；735 项冻结输入继续不变。发布前再核对远端 main；使用 main 为第一父的普通合并，要求发布树等于已验证 C 源码及交付记录的完整树，不强推，不改其他工作树。确切 main SHA 以 Git 发布合并提交和远端 `ls-remote` 核对为准。

按用户明确授权，在远端核对成功后告知对话 A 与“2026-09-15｜测试和eval优化”新的 main 提交号，然后待命；不自动继续后续任务。
