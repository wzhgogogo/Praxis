# B1 迁移0010与反馈：真实本地 PostgreSQL 验证

- Status: **verified / pending review**；本地真实数据库、合成业务数据，不是来源Live或预约写入。
- 时间：2026-10-29，维也纳 CET（UTC+1）；执行16:31:26–16:31:27。业务时钟单独注入，重启后推进20分钟以检验幂等时间戳不被重写。
- 基线：main `00519783`；冻结提交 `76c676a2ea00e4338366a5aacc55f2b418c18c49`，17项SHA首尾一致。
- 分支：`codex/chore-phase3b-b1-postgres-feedback`。产品行为、迁移源码、B三个文件、A评测文件、前端界面均未修改。模型、Google、来源GET、外部数据库、完整Live调用均0；未读/加载 `.env`，未使用PGlite。

## 实例和隔离

宿主机已有 Homebrew PostgreSQL **17.10**。未安装软件、拉镜像或连接已有业务数据库。仅在本probe新建的临时目录初始化角色/数据，两个测试数据库为 `b1_feedback_red`、`b1_feedback_green`。服务TCP禁用，只使用0700私有Unix socket。真实服务器返回 `PostgreSQL 17.10 ...`、`inet_server_addr()=null`；原服务日志记录两次Unix socket监听，没有TCP监听。[环境](cluster.json)、[原始Postgres日志](postgres.log)

报告与编排时间统一CET。Postgres原始日志按来源保留宿主原生CST时间，initdb记录其默认时区Asia/Shanghai；没有改写原件（23:31 CST对应16:31 CET）。原件中的合成时间字段仍保留数据库自己的显示格式。

## 红灯与绿灯分开

现有产品有Case行锁；**没有声称只删除索引就复现原产品的重复提问**。红绿控制只验证数据库防线：两个物理事务在屏障后并发更新同Case的两个不同出发回执。

| 控制 | 实际结果 | 断言 |
| --- | --- | --- |
| 隔离红库删除部分唯一索引 | 2个独立后端、2次提交、同Case的prompted行数2 | `2 !== 1`，真实AssertionError、退出码1，预期红灯 |
| 另一隔离绿库保留原迁移索引 | 2个独立后端，仅1次提交、prompted行数1；另一事务SQLSTATE `23505` | 同一“最多一条”断言通过 |

[红灯数据](red.json)、[红灯原始输出](red.log)、[索引绿灯](index-green.json)。只对probe拥有的红库执行DROP INDEX，生产源码和原始迁移完全未改。

## 未修改的产品代码，多连接验证

使用生产 `NodePostgresDatabase`、`PostgresAgentWorkspaceStore`、`PersistentRestaurantAgentApplication` 的反馈方法。每个worker独立pool且max=1，事务BEGIN后通过屏障一同放行，不靠sleep凑时序；没有更改SQL、去掉产品行锁或伪造数据库返回值。

测试从受信任的B1出发回执持久层开始，用生产Restaurant Task定义建立合成Case。直接种入回执仅用于存储合同，不冒称验证了该Case的查位、链接生成或完整Web路径；这些沿用此前B1离线证据。未调用任何模型/来源端口，若误调用则直接抛错。

| 项目 | 结果 |
| --- | --- |
| 原迁移1–10在空库应用 | 10条记录，最后0010；真实11列、部分唯一索引正确 |
| 再次应用迁移及重启后应用 | 迁移记录与schema指纹不变 |
| 8连接重复记录同一出发请求 | 8个后端返回同一回执ID，仅1条同请求记录；冲突载荷拒绝 |
| 8连接并发领取提示 | 8个后端事务同时就绪，只有1份提示；选择最新出发记录 |
| 8连接并发提交相同答案 | 全部返回同一原记录；改答案拒绝 |
| 领取前提交答案、非法枚举、陈旧版本 | 拒绝 |
| 同用户跨Case使用回执 | 拒绝，目标Case有自己的已领取提示，避免将拒绝归因于没有提示 |
| 跨用户领取、回答、记录出发 | 应用owner和存储owner检查均拒绝 |
| Yes / No / Skip | 三个独立Case分别保存，另一个Case保留已问但未答 |
| provenance与隐私字段 | 固定USER_REPORTED；其他provenance触发CHECK拒绝；表的11列不含个人资料字段 |
| Task State / Outcome / 事件 / 命令 | 反馈前后逐行快照完全相同 |

真实领取后端PID为 `69793–69800`（8个），同运行的重复出发与重复答案各使用8个物理连接。数据与全部期望断言见 [green.json](green.json) 和冻结的 [probe.mjs](probe.mjs)。不是单连接PGlite或内存锁模拟。

## 应用和数据库都重启

绿灯进程退出、所有pool关闭后，由 `pg_ctl restart` 重启本实例，再启动一个新Node进程执行恢复验证：

- Node PID `69788 → 69815`；Postgres启动时刻 `16:24:20.127 → 16:31:26.861 CET`。
- 3个已答Case（YES/NO/SKIP）和1个已领取但未回答Case，领取全部返回undefined，均不重问。
- 已答反馈再次相同提交仍返回原回执，时间未变；业务时钟已推进20分钟。
- 重复出发请求仍保留原ID和时间；同Case再新增一条出发，也不再次提问。
- Task/Outcome/事件/命令快照SHA仍为 `8b6832f35abbc3bec46ecb0fcf642f3944c5cc62dc9e19643edfd775a5d71ba1`，与反馈前一致。

[重启命令原始输出](restart.log)、[恢复结果](resume.json)。这是新进程、新Postgres启动代次，不只是清空前端内存或重建一个连接对象。

## 清理与验证边界

finally已停止自有Postgres，停止退出码0；核对自有runId标记后删除整个临时数据目录。没有触碰已有实例或业务数据。[清理回执](cleanup.json)

执行5个步骤前后git status均为空，红灯退出码按预先冻结的1判定；其余步骤均0，17项输入SHA首尾一致。[执行记录及日志SHA](execution.json)

本批只新增冻结验证脚本、证据与文档，没有产品代码或默认测试入口变化。复用main已审定的产品五门禁（1210/1210、Chromium175/175）及G2 5/5，不将本次真实Postgres当成重新跑过完整Web或来源门禁。新的验证是实际数据库迁移、SQL防线、产品反馈存储/应用方法、多连接和重启持久性。

历史B1冻结检查单保持当时“尚未运行”的原件，不回写旧证据；本报告为其真实Postgres多连接检查的新结果，待复核签收。TableCheck用户浏览器参数带入仍待首次Live，G4仍等待G3及单独指令。

复核原件可离线运行 `python3 -B .eval-artifacts/phase3b/b1-postgres-feedback/verify.py`。本次数据库已销毁，不能把这条完整性命令称为再次运行数据库测试；重跑真实DB必须另建同样的自有临时实例、冻结新环境与新的输出目录，不连接已有数据库或复用旧红绿原件。

推送本分支供复核，不合main。
