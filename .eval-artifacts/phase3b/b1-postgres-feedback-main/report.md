# 审定 B1 PostgreSQL 证据合入

- Evidence status: reviewed frozen regression; user-approved main integration.
- 日期：2026-10-30，维也纳 CET（UTC+1）。
- 复核对象：`d50f3e77e2b1ce6ea82ea0d0dbf16a0d4c04d3c2`。
- 同步的 main：`00519783b3f6a3e48a53a4a0a8b03c9621c8bcf7`，已在本分支祖先中。
- 门禁冻结提交：`fdd4aba5481a786c41f54bc9b5dd58dbf3069b9b`；718 份输入 SHA 在运行前后相同。

用户已确认原 PostgreSQL 17.10 证据并批准发布。此次只合入证据和文档，`src`、迁移、脚本、包配置、站点 Skill、A 评测和前端源码均与同步的 main 相同。原始 PostgreSQL 实验目录下所有已提交文件与复核提交逐字节一致；没有重新运行、替换或重写实验。

## 本次实际验证

| 命令 | 结果 |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run arch:check` | PASS |
| `npm test` | 1210/1210，失败/取消/跳过均 0 |
| `npm run build` | PASS |
| `npm run test:browser:fixture` | 175/175；内含独立 G2 5/5；120.379 秒 |

五门禁及前后两次完整性检查共 7 步，每步前后 `git status --porcelain` 都为空，没有用恢复文件掩盖写入。命令、时间、日志 SHA 与原始输出见 `gates.json` 和 `gates/`。本次未重复运行额外的 `test:dom-change` 命令；普通 G2 已由 Chromium 标准门禁运行。不声称任何 G3 或当前来源 Live 验收。

## 复用的真实数据库结论

[原实验报告](../b1-postgres-feedback/report.md)和原始结果保持冻结：索引隔离控制无索引 2 条、原部分唯一索引 1 条且另一事务 23505；这不是原产品重复提问的重现。未修改的产品 8 个物理连接并发只有 1 份提示，重复出发/回答幂等，跨用户/Case 拒绝，应用与数据库重启后 3 个已回答和 1 个未回答 Case 不重问。原私有 Unix socket 临时实例已停止并删除。本次不启动数据库，不用 PGlite 代替原证据。

## 发布边界

此次模型、Google、网站 GET、Live 和新数据库实验均为 0；不读取 `.env`。共享账本原条目原样保留。本批不消耗方案一预算；用户已批准的未来网站 GET ≤14、共享总额 260 和 Google ≤1，仍须 G3 合入及后续执行指令。

按用户授权把审定证据分支合入 main 并推送；实际合入 SHA 及远端核对以 Git 合并记录、push 与 `ls-remote` 回执为准。合入后待命：Tabelog B1 链接读取接线、日文名检索产品接线与实测都没有开始。
