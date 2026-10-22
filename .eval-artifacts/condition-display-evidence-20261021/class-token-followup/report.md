# class 词元匹配复核收尾

状态：离线修复完成；展示修复分支 `codex/fix-condition-display-evidence`，基于已复核提交 `5110f6aa08c46c3e223f440bae0ec397fb91746d`。本次仅修改 `parseTabelogSourceFieldQuotes` 及相应 Fixture。两项修复均等待检查点 C 结束后再合入，本批没有进行合并或修改检查点 C。

课程卡片按完整 class 词元 `rstdtl-course-list` 匹配，不依赖 `js-rstdtl-course-list`。课程标题、课程描述、顾客评论标题和 `display-name` 同样按完整词元匹配，允许 class 重排和额外 class，拒绝 `display-name-suffix` 这类不同词元。其余解析路径、来源身份、餐段、HARD 与交付资格规则，以及 Prompt/Schema/State 版本保持。

## 红绿与门禁

新增 Fixture 使用固定期望原句，覆盖 class 顺序变化、额外 class、缺少 JS 钩子和名称词元前缀误匹配。旧实现漏掉课程/评论字段且误采名称前缀：[有效红灯](red.log)。修复后相关测试 [39/39](focused-green.log)。已有原始 HTML、午餐、评论/邻店隔离等回归仍保留。

| 门禁 | 结果 | 日志 |
| --- | --- | --- |
| typecheck | PASS | [日志](typecheck.log) |
| arch:check | PASS | [日志](architecture.log) |
| npm test | 987/987 | [日志](test.log) |
| build | PASS | [日志](build.log) |
| test:browser:fixture | 131/131 | [日志](browser-fixture.log) |

[verification.json](verification.json) 记录源码/Fixture、门禁日志 SHA，以及本隔离工作树内既有 Chromium 测试报告的前后备份与恢复核验。原始日志按字节保存；手写代码、文档和 JSON 通过 diff 检查。

本次没有修改评测器分支，未重跑原三次快速回放或 22 次校准；这些历史结论仍属于原冻结代码及其报告，本次小修由新增 Fixture、相关回归与五门禁验证。真实网站、模型、Google 和 Live 调用均为 0，本地 Chromium 仅使用本机 Fixture。

推送本分支后停止，不合入主分支或检查点 C。
