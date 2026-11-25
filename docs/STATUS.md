# Praxis 当前状态

- Status: Accepted
- Last updated: 2026-11-25
- 当前基线：Phase 3c 收尾完成，检查点 `checkpoint/phase3c-closeout-20261125`。
- 阅读入口：[文档索引](INDEX.md) · [路线图](roadmap.md) · [用户流程](product/USER-FLOWS.md)

## 交付范围

英文响应式餐厅工作区已合入主线，覆盖可恢复的计划、条件编辑、候选与收藏、About 与相册、来源问答、取消读取和来源交接。用户在服务端核验的来源网站自行提交预约，返回后可选自报。

`Let's book` 打开交接准备页，过期先刷新。点击 `Continue on TableCheck` 或 `Continue on Tabelog` 才记录离开并打开二次核验的来源入口。交接凭证与用户自报各有独立含义。[PRD](product/MVP-PRD.md) · [B1 合同](decisions/0049-source-bound-b1-booking-handoff.md)

## 验收证据

| 口径 | 实际结果 |
| --- | --- |
| Offline / Fixture / 录制回归 | 代码验收 `fb9c307a9f1d6f99598fa62ef98dddf3daf4d506`。稀疏检查、Typecheck、Arch 和 Build 通过。工作树合同 2/2、默认 1,995/1,995、G2 5/5、Chromium 609/609、G6 159/159、dist C1 4/4。[全量门禁](history/TEST-LOG.md#phase-3c-closeout-20261125) |
| Round 28 真实 DeepSeek 日期抽测 | 10/10 有效提议，9/10 编译通过，暴露 D04「下周五」绑定缺口。[真实抽测](../.eval-artifacts/3c-unified-20261117/round-28-deepseek-date-spotcheck/REPORT.md) |
| D04 修复后离线回放 | 同一批归档回包 10/10，新增真实 API 请求 0 次。[回放验收](../.eval-artifacts/3c-unified-20261117/round-28-qualified-weekday/REPORT.md) |
| 用户手工走查 | 2026-11-25 用户在本地局域网 `4312` 确认真机与桌面交互，范围 `d40697f0a` → `2cc4a062b`。此项为用户手工确认，单列于自动化归档证据之外。 |

## 下一阶段

Phase 3d 聚焦 Auth、部署和限流。规模化 Live Read-only 与 Controlled Live-write 尚待独立验收。[路线图](roadmap.md)

## 历史

- [旧 STATUS 全文](superseded/STATUS-ARCHIVE-PHASE1-TO-3B.md)
- [2026 年 8–11 月 DEVLOG](history/DEVLOG-2026-08-to-11.md)
- [2026 年 8–11 月 TEST-LOG](history/TEST-LOG-2026-08-to-11.md)
- [历史计划与 Playbook](superseded/plans/) · [历史索引](history/README.md)
