# 停止点 3：健康检查截止竞态修复

- 完成时间：2026-10-25T03:12:14.148159+01:00（CET UTC+1）。状态：current executable / 已暴露离线回归。
- 分支：codex/fix-phase3a-prime-health-deadline。基线 main：4d9279583299e798f43cace277b84700617635ce。
- 冻结反例提交：e46a4158；实现/实际 Chromium 控制：3d50f385；五门禁精确提交：5e0692f8c2fb114aefeca835e53cb861086f28d8。

## 结果与机制

已完成快照立即判定内容就绪并保存，持续观察到固定 10,000ms 截止以保留后来繁忙/403/挑战拒绝。截止采用最后完成的快照及最新 HTTP 失败事实；末次快照在途不再把已观察就绪误记 CHECK_TIMEOUT。未取得快照仍 CHECK_TIMEOUT，完成但未见结果仍 RESULT_NOT_OBSERVED。未延长截止，未改变五分钟重试、三次上限或产品预算。

产物 observations.snapshots 每次记录 startedAt/finishedAt（ISO UTC 原始时刻）；截止尚未完成的快照 finishedAt=null，不冒充已完成。报告使用 CET。迟到快照不能改变已冻结观察结果。

## 红绿与实际入口

- [红灯](red.log)：冻结的最小来源 fixture + F5 原构造（1000ms fixture 窗口，800ms 后快照延迟220ms），未修入口抛 ENV_FAILURE/tabelog，不能得到要求的 READY。此为行为失败，非启动/类型错误。
- [单元绿灯](green-unit.log)：5/5；同反例 READY，3 次无快照及空快照均按窗口有界结束并保持拒绝。
- [真实 Chromium/Guard 绿灯](green-chromium.log)：同源 localhost，两来源真实 DOM，末段220ms控制 READY；晚到繁忙、403、挑战均拒绝，预检不启动正式 Live。
- [外层控制](validation/control.json)：快/慢两组均 READY，慢组实际触发延迟；完整起止原始产物在 validation/，网络传输计数0。
- 输入为 F5 保存公开地区页的首个列表链接；[来源/采集日/原文SHA](source-provenance.json)。原构造与归档 SHA 保留，未复制整份历史运行。

## 五门禁

单次样本；不是中位数。编排 [run-gates.py](../run-gates.py)；输入/脚本 [freeze.json](freeze.json)；原始 [gates.json](gates/gates.json)。

| 门禁 | 结果 | 通过项 | 秒 | 每项后 Git status |
| --- | --- | --- | --- | --- |
| typecheck | PASS | — | 0.400278 | 空 |
| arch-check | PASS | — | 0.181955 | 空 |
| npm-test | PASS | 1034 | 20.426752 | 空 |
| build | PASS | — | 0.388933 | 空 |
| browser-fixture | PASS | 153 | 92.906001 | 空 |

冻结文件前后 SHA 一致，门禁恢复次数0；最终提交仅报告、证据与导航，不改变测试过的实现/输入。

## 范围与评价边界

模型/Google/网站/Live/环境重跑新增均0；全部为离线构造、localhost、真实本机 Chromium。产品层、Prompt、产品 Schema、Guard、两个站点及 source-packs.ts 未改。3864/473行不增。

端到端结果为健康检查 READY/拒绝的机制验证；逐环节覆盖快照、截止、晚失败及 Runner 预检停止；原故障归因是测试基础设施误拒绝。无餐厅交付，S0 交付声明不适用；原有拒绝规则仍由实际 Guard 测试验证。本控制没有重跑或改判历史 F5 Live，也不证明历史每次 CHECK_TIMEOUT 的精确根因。真实站点时序、库存、F5 产品能力仍待后续授权验证。

按用户授权合入并推送 main；合入回执写 main-integration.json，推送精确SHA写本地回执及本批总报告。
