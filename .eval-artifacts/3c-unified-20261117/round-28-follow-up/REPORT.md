# Round 28 定向复核补丁

基线 `934c5810f2ad1e75e155656fc80ddd7654996914`。验收提交 `d2ec1b51971deac6f269e07e9d289ff8cd1cb2cc`，源码树 `a0455cd4a4580f6fb3597f48096afb322be6cf4f`。变更仅覆盖 DATE.raw 日期词重叠校验和 About 摘要投影，沿用既有词表、东京物化、结构化命令、模型合同和评分。

## DATE.raw

按重叠区间收集唯一有效校验词，同词重复计为一个。完整覆盖日期词的长引文启用既有校验，局部星期后缀沿用既有周限定规则。多种校验词或只切到日期词一部分时澄清。零重叠沿用词表外原表达路径。纠正偏移后保留模型返回的原始 `DATE.raw` 供审计。

以下使用实际消息入口、PGlite 和本地假模型。东京时间固定为 2026-11-24，等待读轮退出后记录结果。

| 模型引用 | 模型日期 | 修复后 |
|---|---|---|
| 后天晚上7点 | TOMORROW | 2026-11-26 19:00，3 次 Fixture 查位 |
| 下周五晚上7点 | 2026-11-27 | 澄清，0 次查位 |
| 2026-11-28 19:00 | 2026-11-25 | 澄清，0 次查位 |
| 11月28日晚上7点 | 2026-11-25 | 澄清，0 次查位 |
| 明天或后天 | TOMORROW | 澄清，0 次查位 |
| 后天晚上7点（截自大后天晚上7点） | 偏移 2 天 | 澄清，0 次查位 |

单测还覆盖同词重复、词表外放行以及日期与时间同引时的合法回包。[冻结消息观察](date-observations.json) · [基线红灯](preflight/red-date-loopback.log)

## About

390×844 Chromium 断言 `Chef's omakase` 在独立的 `.about-term` 可见，逐字相同的原文只在展开 Source 后可见。归档菜单与两个价格快照仍按各自来源时间分组，摘要和引文各一份。[基线红灯](preflight/red-about-loopback.log) · [默认折叠](visual/round28-follow-up-390-course-source-collapsed.png) · [展开原文](visual/round28-follow-up-390-course-source-expanded.png)

## 冻结验收

| 步骤 | 结果 | 退出码 | 耗时 |
|---|---|---:|---:|
| typecheck | 通过 | 0 | 0.720 s |
| arch-check | 通过 | 0 | 0.198 s |
| build | 通过 | 0 | 0.580 s |
| test | 1992/1992 | 0 | 81.763 s |
| browser-fixture | G2 5/5，Chromium 604/604，G6 159/159 | 0 | 494.568 s |
| c1-built | 4/4 | 0 | 16.083 s |
| build-assets | 19 个 JS 资产及 HTML/CSS 一致 | 0 | 0.200 s |
| browser-graph | strict，18 模块，0 环 | 0 | 0.051 s |
| protection | 现存历史与基线匹配，无新增缺件 | 0 | 2.894 s |

G2 与 Chromium 汇总 609/609，G6 单列。验收使用离线 Fixture 与自带断网保护的 Replay，适用步骤限制为本机回环。定向测试首次启动遇到宿主禁止嵌套 sandbox-exec，随后以非嵌套的本机回环限制完成红绿验证。[门禁清单](gates/manifest.json) · [冻结输入](freeze.json) · [产物 SHA256](artifact-sha256.json)

历史保护覆盖 15067 个路径，11543 份现存文件哈希一致。既有 652 项受跟踪删除与 2,872 + 137 份未跟踪缺件维持原状。历史原件完整性为 `BLOCKED_BY_MISSING_HISTORICAL_ORIGINALS`。主工作区、主 .env、稀疏规则及 closeout 950 项维持基线。工作树状态摘要与冻结验收一致，源码及冻结输入干净。[保护核验](protection-verification.json)

未加载 .env。真实模型、Live、真实 PostgreSQL、远端 CDP 和真机交互为 NOT_EVALUATED。只提交到当前本地分支。
