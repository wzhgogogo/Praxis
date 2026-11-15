# Main 发布门禁

维也纳时间 2026-11-15 05:44 CET。远端 `main` 从 `32b97ed812be10e80a683ad1f2be8caba5608bf0` 快进至 `a66a2edcb2ffe8e3eaa42f4c0e79680382539c9d`，已核对 Git 远端引用。验证与发布使用同一净树提交。

| 门禁 | 结果 |
|---|---|
| TypeScript / 架构 / 构建 | 全部通过 |
| 默认测试 | 1652/1652 |
| Chromium | 289/289，含 G2 5 和其余 284 |
| G6 assembly | 159/159 |
| 相对原 main 的新增产品写死命中 | 0 |
| main 的 `.eval-artifacts` 变更 | 0 个文件，Git 树仍为 `e46d46ce230ec2e0649174e09c7125bc9d4c8782` |

首次运行时 G6 两项报 `ENOENT`。隔离树从本提交补齐 D4 的快照、HAR 和执行结果，以及 TableCheck 的组件 HAR。首次重启联合门禁时，esbuild 在加载一个测试文件时退出。该文件独立运行通过。两次中断日志均已保留，随后通过原命令 `npm run test:browser:fixture` 复验，测试断言和候选提交均未修改。

本次整合包含 75 个 `src/` 文件、1 个 `web-skills/` 文件和 9 个 `docs/` 文件。Test Skill 为 Revision 1.9。主工作区 HEAD、草稿差异和状态哈希一致，10 份既有账本哈希一致。模型抽检和七帧依据见[逐帧报告](../report.md)，门禁新增模型调用 0、网站 GET 0、Live 0。

[门禁汇总](release.json) · [最终联合门禁日志](browser-g6-final.log) · [本地转译中断](browser-g6-after-restore.log) · [首次缺样本日志](browser-g6.log) · [保护核对](protected-release.json) · [远端核对](origin-main.txt)
