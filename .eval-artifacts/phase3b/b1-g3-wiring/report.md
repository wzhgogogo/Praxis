# B1 G3接线：按跨归属规则停止

- Evidence status: draft / not integrated；接线未实施。
- 日期：2026-10-30，维也纳 CET（UTC+1）。
- 工作分支：`codex/feat-phase3b-b1-g3-wiring`。
- 起点：B 当前本地 HEAD 和抓取的远端 HEAD 均为 `8c66921aa09f4c020732e3bea3d3241383e25689`。
- 探针冻结提交：`0ad7282d31751a8ff60952bed1fb79a204b581fd`，8 份输入 SHA 不变。
- 当前 main：`404a766e300668230d23c75ee7486bb3dc7a1d43`；未合入、未改动 main。

## 阻断事实

`src/integrations/tabelog/tabelog-vacancy-response.ts:13–16` 的 `OBSERVED` 类型仅有 `status`、`availableSlots`、`hasExplicitSlotUi`。该函数在 56–67 行检查原链接的店号、日期、人数和时刻，但在 71 行仅返回时段，原 `form_course` URL 没有进入输出。`tabelog-browser-availability.ts:675` 继续传递的也是 `visibleSlots`。这里没有可供 B1 直接读取的已核对原链接记录。

按照已批准 main 中 ADR-0049 §2，链接必须来自 G3 已接纳的来源原链接；当前用户同时明确禁止修改 B 的三个文件和另写解析器。仅靠这些输出无法恢复原链接。继续实施就需要跨入受保护文件，或在其他文件再次解析响应/拼接链接，因而按用户第 4 项立即停止产品修改。

B 当前分支还没有包含 main 上已批准的 B1 基础和 ADR-0049（共同祖先为 `50a08361`）。本次没有把旧 main 强行复制进 B 的分支或改动 B 工作树；后续按用户安排，在 G3 合入 main 后 rebase 到同时包含两者的新 main。

## 实际红灯证据

`input.json` 是明确标注的构造协议样本，不是网站采集、Gold 或真实模型结果。`probe.mjs` 只调用当前真正的 `inspectTabelogVacancyResponse`，不实例化浏览器/Google/模型/数据库，`fetch` 被禁止。

两份响应提供店号、日期、人数、时段完全相同而 query 顺序不同的两个原 URL；G3 均返回 `OBSERVED`、`availableSlots=["19:00"]`。输出对象完全相同，两个原 URL 都不在输出中。有效断言 `B1_EXACT_SOURCE_LINK_OUTPUT_MISSING` 失败，Node 退出码 1；不是 import、环境或无关异常。见 `red.json` 和原始 `red.log`。

这只证明原链接在接口输出中丢失。**未完成普通启动的按钮红灯、绿色实现及缺链接/日期人数时段/白名单反例，也没有声称这些通过。**

## 所需最小协作接口（建议，不实施）

请 B 在既有 `OBSERVED` 输出中保留其已核对的每个时段对应的来源原链接，并提供其对应来源响应的身份/时刻引用（如响应 URL、sequence、observedAt）。相对链接如需解析为绝对链接，应由同一既有解析器一并返回，保留原文，不由 C 重新解析或拼接。具体字段和变更由 B/复核者安排。

取得该输出后，C 才可完成来源缓存到 B1 的代码接线、普通启动注入和既有两次服务端校验；无需改变身份规则或赋予模型 URL 生成权限。

## 范围与后续门槛

本次仅新增诊断证据和文档，`src`、脚本、包配置、站点 Skill、共享账本以及 B 三文件、A 评测、前端界面源码均与起点相同。真实网站/模型/Google/Live/数据库调用均 0，不读取 `.env`，未访问任何预约流程页。探针前后工作区干净，无文件恢复。

按用户第 4 项停止后未运行五门禁和严格 G2；当前产品没有修改，不使用 B 已知的历史门禁结果作为本次接线通过证据。等待接口依赖解决；G3 合入 main 后按指令 rebase、冻结新输入、运行五门禁和严格 G2，再交复核。此次只推工作分支并停报，不合 main。
