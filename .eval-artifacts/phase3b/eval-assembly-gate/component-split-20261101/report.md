# 组装门禁：组件测试迁出

- 状态：本轮验证通过，待独立复核；未合 main。
- 基线：`975ff23a5044d2d177df4779cbc40622bd6bb34e`，远端本分支已核对一致；main 仍为 `74dd2faf`。
- 依据：用户确认复核记录位于 Claude 项目、不在仓库，消息中的几条要求即第 3 节全部要求，无需取得外部原件。

本切片只把三条直接构造 discovery 核心的组件测试移到 `native-discovery-components.test.ts`，将两个精确组件例外一同迁移，使 `native-discovery-composition.test.ts` 不再享有任何例外。只调整必要导入、局部 retrieval 替身和白名单路径；白名单说明删去迁移后失效的“同文件 factory 场景”从句。生产代码、门禁规则、已有测试正文及断言均不改。

| 主要失败类型 | 完成证据 | 不证明范围 |
| --- | --- | --- |
| 迁移时改写、丢失或复制测试 | 三个测试正文的迁移前后 SHA 逐字一致；71 个 test 调用首行的多重集合不变 | 静态调用点数不代替实际测试数 |
| composition 文件继续享有组件豁免 | composition 无两个核心导入、无任何例外；组件文件恰好两个既有例外；真实 arch:check | 不扩大已复核核心名单 |
| 新文件未进入默认入口 | 沿原 agent-loop/*.test.ts glob，运行完整 npm test 并与基线 1308 比较 | 不新增或重跑 Live |

[逐字迁移记录](test-move-equivalence.json)列出三条原测试名称、实际原行号、正文 SHA 和两个例外。共同来源样本继续使用已有 `native-fixed-source-pages.ts`，没有新建测试辅助层，也不增加测试。

按现有 Test Skill，在干净冻结提交上运行 `npm run typecheck`、`npm run arch:check`、`npm test`、`npm run build`；重点验收用户要求的 arch 和完整默认套件。每项保存前后状态、HEAD、冻结输入及真实输出。浏览器实现和来源样本没有变化，不重复上轮已通过的 Chromium 187 项；全部真实模型、Google、网站、Live 为 0，不读取 `.env`。时间记录为维也纳 CET（UTC+1）。

## 实际验证

冻结提交 `9cd4c8e4123b743fe335c3ab3d5324239040d6fb`，730 项输入。四项各执行一次，前后工作树为空、HEAD 和输入 SHA 不变。完整机器记录见 [gates.json](gates.json)，输入见 [source-inputs-sha256.json](source-inputs-sha256.json)。

| 命令 | 结果 | 外层耗时 | 完整原始输出 |
| --- | --- | --- | --- |
| npm run typecheck | PASS，exit 0 | 0.459s | [typecheck](verification/typecheck.log.gz) |
| npm run arch:check | PASS，exit 0 | 0.239s | [arch-check](verification/arch-check.log.gz) |
| npm test | 1308/1308，exit 0 | 31.529s | [test](verification/test.log.gz) |
| npm run build | PASS，exit 0 | 0.507s | [build](verification/build.log.gz) |

默认套件失败、取消、跳过、todo 均为 0；三条迁出的测试在完整入口中各实际执行一次，总数与基线 1308 完全一致，package.json 原字节不变。没有过滤、重试或新增测试。

## 交付核对

- 三条测试正文及其断言逐字 SHA 相同；静态 test 调用多重集合为原 71、新文件 3、余下文件 68。所有其它测试正文和公共来源样本不改。
- 24 条例外数量不变，仅两条指向组件文件；composition 文件例外为 0，无核心值导入。门禁实现和 Skill 不改。
- [最终核对](final-verification.json)记录实际正文、默认执行次数、白名单、源码范围和全部旧证据的哈希核验；[交付 SHA](evidence-sha256.json)覆盖报告与本轮原始输出。
- 仅归档后补当前状态与追加历史，不再改执行输入；推送原工作分支后停止，交独立复核，不合 main。
