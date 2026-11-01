# 组装门禁：组件测试迁出

- 状态：待本轮验证，未合 main。
- 基线：`975ff23a5044d2d177df4779cbc40622bd6bb34e`，远端本分支已核对一致；main 仍为 `74dd2faf`。
- 依据：用户本轮明确给出的复核第 3 节整改要求。所指 `phase3/TEST-ASSEMBLY-GATE-STOP2-REVIEW-20261101.md` 尚未在本地相关工作树或已 fetch 的远端引用中找到，已询问实际路径；本报告不声称通读了该文件。

本切片只把三条直接构造 discovery 核心的组件测试移到 `native-discovery-components.test.ts`，将两个精确组件例外一同迁移，使 `native-discovery-composition.test.ts` 不再享有任何例外。只调整必要导入、局部 retrieval 替身和白名单路径；白名单说明删去迁移后失效的“同文件 factory 场景”从句。生产代码、门禁规则、已有测试正文及断言均不改。

| 主要失败类型 | 完成证据 | 不证明范围 |
| --- | --- | --- |
| 迁移时改写、丢失或复制测试 | 三个测试正文的迁移前后 SHA 逐字一致；71 个 test 调用首行的多重集合不变 | 静态调用点数不代替实际测试数 |
| composition 文件继续享有组件豁免 | composition 无两个核心导入、无任何例外；组件文件恰好两个既有例外；真实 arch:check | 不扩大已复核核心名单 |
| 新文件未进入默认入口 | 沿原 agent-loop/*.test.ts glob，运行完整 npm test 并与基线 1308 比较 | 不新增或重跑 Live |

[逐字迁移记录](test-move-equivalence.json)列出三条原测试名称、实际原行号、正文 SHA 和两个例外。共同来源样本继续使用已有 `native-fixed-source-pages.ts`，没有新建测试辅助层，也不增加测试。

按现有 Test Skill，在干净冻结提交上运行 `npm run typecheck`、`npm run arch:check`、`npm test`、`npm run build`；重点验收用户要求的 arch 和完整默认套件。每项保存前后状态、HEAD、冻结输入及真实输出。浏览器实现和来源样本没有变化，不重复上轮已通过的 Chromium 187 项；全部真实模型、Google、网站、Live 为 0，不读取 `.env`。时间记录为维也纳 CET（UTC+1）。
