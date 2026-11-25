# Round 28 周限定星期接线验收

基线 `ca9c4bc38fb1d74beb3a51cc7312c90ef841e7bd` 与 `7b976505a` 源码一致。本批验收 SHA `f681133e8bb648bb6be7709161ef42a90bb537ec`，源码树 `23f616cff7939703568c63563ea4ab4edd12120c`。变更仅包含合格 weekday 指令的东京日期绑定、回归与 ADR-0053 单句补充。Prompt v29、Schema v4 和既有评分沿用原版。

## D04 与对照

同一份已归档真实 DeepSeek 回包，基线复算 9/10，修复后离线回放 **10/10**。D04 的 `weekday: FRIDAY, raw: "下周五"` 在东京 2026-11-24 的基准下，从冲突变为 **2026-12-04 19:00**，绑定 `RELATIVE_OFFSET_DAYS:10`，审计原文保持「下周五」。原始回包逐字节哈希为 `0b09c902c195e6948443b755caf0456ae7c059e06b74c4820d3d8138276e20a5`。[原始观察](../round-28-deepseek-date-spotcheck/observations.jsonl) · [基线回放](preflight/red-replay.log) · [冻结十句回放](gates/date-replay.log)

中文完整词和带时间的引文、英语 next Friday 均通过。错星期、错误绝对日期、仅引用「周五」而漏「下」，以及周六说 this Friday 继续报冲突。实际消息入口以 PGlite 与本地假模型验证 12 月 4 日 19:00 的 3 次 Fixture 查位，等待错误绝对日期、错星期与引文缺限定词的读轮退出后，各 **0 次查位**。[消息入口观察](availability-observations.json)

## 冻结门禁

| 步骤 | 结果 | 退出码 | 耗时 |
|---|---|---:|---:|
| typecheck | 通过 | 0 | 0.703 s |
| arch-check | 通过 | 0 | 0.205 s |
| build | 通过 | 0 | 0.595 s |
| test | 1995/1995 | 0 | 95.355 s |
| browser-fixture | G2 5/5、Chromium 604/604、G6 159/159 | 0 | 518.483 s |
| c1-built | 4/4 | 0 | 18.186 s |
| build-assets | 19 个 JS 资产与 HTML/CSS 一致 | 0 | 0.200 s |
| browser-graph | 18 个严格 TS 模块，0 环 | 0 | 0.058 s |
| protection | 无新增历史差异或缺件 | 0 | 2.920 s |
| date-replay | 10/10 | 0 | 0.120 s |

G2 和 Chromium 合计 609/609，G6 单列。首个候选 `dd6b28419` 的 Typecheck 因新对象字面量宽化失败。按已有提议类型标注事实数组后重新冻结，从头跑全套。原始失败日志独立保留。[门禁清单](gates/manifest.json) · [首次 Typecheck](failures/dd6b28419-typecheck/gates/typecheck.log)

历史保护覆盖 15171 个路径，11647 份现存文件哈希匹配。本轮工作树仅保留原有 652 项受跟踪缺件，另有既有的 2,872 + 137 份未跟踪缺件。历史完整性仍为 `BLOCKED_BY_MISSING_HISTORICAL_ORIGINALS`。主工作区、主 .env、稀疏规则与 closeout 基线保持一致。[保护核验](protection-verification.json)

本轮 0 次新增真实 DeepSeek 请求，10/10 指归档真实回包的离线回放。未加载 .env，真实查位、Live、远端 CDP 与真机未评。仅本地提交。[产物哈希](artifact-sha256.json)
