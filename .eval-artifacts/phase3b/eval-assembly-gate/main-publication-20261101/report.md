# 组装门禁：获批合入 main

- 用户已复核通过并批准 `0e24d9ab348d2c585148d549217d6bbbbf3a24ea` 合入。
- 远端 main 已核对仍为 `74dd2faf6ac8ef99492c86eaf3d57d7244b1745c`，它已是获批候选的祖先，无需重新同步。
- 以该 main 为第一父、获批候选为第二父创建普通合并；未补记录前的合并树与获批候选完整树完全一致。仅在本工作树操作，不改其他对话检出的 main。

本次不修改生产、门禁、白名单、测试、来源样本或任何执行输入，只补获批合入的状态与历史记录。复用 [五门禁复验](../main-sync-74dd2faf/report.md) 和 [三条组件迁移验收](../component-split-20261101/report.md)：默认 1308/1308、Chromium 187/187；组件迁移后 arch、默认 1308、type/build 均绿，测试数量和断言不变。原组装门禁 9 项隔离检错、旧默认红灯和干净 main 反例保留。本轮不重复未变化代码的测试。

[发布前核验](publication-verification.json)记录 730 项冻结输入、获批完整树、原产物及合入新增差异的检查。精确发布提交号以本报告所在的 Git 合并提交和发布后 `git ls-remote --heads origin main` 的回执为准；不强推、不覆盖并行提交。

发布并核对后，按用户明确授权通知 A、B、C 新 main 提交号及生效规则：`src/eval` 下评测和测试不得直接值导入已确认能力核心，应通过 `createLiveReadAssembly` 取得；纯类型导入豁免。组件评测只在 `src/eval/assembly-bypass-allowlist.json` 逐条登记“文件 + 核心”，说明证明范围及不能签收什么；严格解析且拒绝陈旧项。三条 native 组件已独立成文件，composition 无例外。

本轮真实模型、Google、餐厅网站、Live 和见证请求均为 0，不读取或加载 `.env`。记录时间为维也纳 CET（UTC+1）。完成发布和通知后待命，不启动新的开发或评测。
