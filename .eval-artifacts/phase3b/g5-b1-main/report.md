# B1 审定后 main 整合验证

- Status: verified integration candidate; publication receipt will be recorded on the subsequent analysis branch.
- Time: 2026-10-29，维也纳 CET（UTC+1）。
- 用户批准：`38974709`；独立复核者 Linux 2 核五门禁与 G2 通过。
- 同步的 main：`50a0836148c5b026240a770de89c5d5357091355`，已经是批准分支祖先。产品、脚本和 package 与批准提交逐字一致。
- 本次冻结提交：`0cd117e4834fb8df179fc42b1edc0a63090aba36`；706 项冻结输入，前后 SHA 全部一致。

## 验证

| 命令 | 结果 | 前后 git status |
| --- | --- | --- |
| `npm run typecheck` | PASS | 空 / 空 |
| `npm run arch:check` | PASS | 空 / 空 |
| `npm test` | 1210/1210 | 空 / 空 |
| `npm run build` | PASS | 空 / 空 |
| `npm run test:browser:fixture` | 175/175；121.446 秒 | 空 / 空 |
| `npm run test:dom-change` | 5/5 | 空 / 空 |

原始日志、时间、退出码和 SHA 在 [gates.json](gates.json)。完整性校验在首尾各通过一次，未执行 restore、自动修复或重跑。门禁后的变更仅为报告和历史索引；可执行文件不变。

## 合同和剩余边界

ADR-0049 Accepted 0.2 与迁移 0010 一起交付。手续费 checkedOn 日期仍保留在卡片出处中；日英取消冲突并列原文，不判断严格程度。反馈只记录 USER_REPORTED，每 Case 最多问一次，与 Task State、Outcome 和预约状态分开。

普通产品启动没有注入来源链接读者，G3 接线前 B1 不向真实用户生效。B 的三个文件不改；既有 Prompt/Schema/State/TaskDefinition 版本不变。真实 Postgres 多连接并发及用户浏览器 TableCheck 日期/时刻/人数带入尚未运行，见 [Live 前检查单](live-preflight.md)。同一 Case 出发 A 店后再出发 B 店不会二次提问，符合当前批准合同，3c 再评估。

本次新增模型、Google、评测公开 GET、完整 Live、环境重跑均为 0，不读取 `.env`。共享 GET 保持 244/257。测试仅 Mock/Replay/本地 HTTP/Chromium fixture，不是来源 Live。

用户已批准本次 main 合入与推送。发布后用 ls-remote 核对，再通知 B 同步 ADR-0049 和迁移 0010；然后从已发布 main 另开只含分析的检索分支。
