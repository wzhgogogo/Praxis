# 健康4秒：F5 main同步后最终验收

- 时间：2026-10-25T21:28:45.970735+01:00，维也纳CET UTC+1。已暴露离线fixture，不是Live/Clean Baseline。
- 分支：codex/fix-phase3a-prime-health-fixture-window；上游main `e096ba35dbc77d6852fa4875dbeadaae92835ffe`。整合冻结候选 `10c6ecc0678814e58ca755ad1201d60fed891220`；最终合入SHA另见总报告及integration.local.json。
- **满足本次复核完成标准，含明确批准的E1例外**。E1仍开放给F3，不把原始红灯改为绿色退出码。

## 基线同步与源范围

原[六轮](../report.md)是0a254f05基线上的frozen regression；合入前发现对话B已将F5带已知限制合入main。保留这些证据，合入e096ba35后重跑全部要求，不以旧1037/154口径替代新main的1053/155。[同步记录](integration-rebaseline.json)保留零源码冲突和五份文档合并，完整上游历史/预算与三条健康记录均保留。

相对新main，src/scripts/web-skills/package范围**仅健康fixture测试改动**：四个普通模式4000ms，slow1000/800/220不变；生产健康10秒、E1原fixture/断言、Guard、Prompt、产品Schema和站点源均不改。F5产品改变来自已批准上游，不是本切片新增。旧fetch+xhr草案[已拒绝](../e1-review-disposition.json)。

## 当前组合实际结果

| 样本 | macOS完整四路Chromium | Linux完整四路Chromium |
| --- | --- | --- |
| 1 | 155/155 PASS；101.996769s | 154/155；KNOWN_E1_DEFERRED_TO_F3；105.128263s |
| 2 | 155/155 PASS；103.289713s | 155/155；PASS；102.399538s |
| 3 | 155/155 PASS；103.933828s | 155/155；PASS；102.677879s |

中位数：macOS **103.289713s**、Linux **102.677879s**，均≤150秒；包含全部三次样本，没有剔除E1耗时。健康目标6/6通过，其他失败0，无skip/todo或用例过滤。

macOS五门禁全部原始PASS；Linux typecheck、arch:check、默认**1053/1053**、build全部PASS，Chromium为已登记E1一次（原始退出1、154/155）及两次原始PASS155/155。Linux E1的错误仍为原用例`page.evaluate: TypeError: Failed to fetch`；外层仅按用户新复核记录KNOWN_E1_DEFERRED_TO_F3，并继续固定三次，未改测试或隐去失败。[macOS全记录](mac-gates/gates.json)、[Linux全记录](linux-gates/gates.json)、[E1原始日志](linux-gates/browser-fixture-1.log)。历史停止报告仍保留其当时NOT_SATISFIED结论，不追改历史。

新基线前后609项[冻结SHA](freeze.json)一致；每门禁前后git status --porcelain为空、恢复0。Linux复用任务VM，将2e184c2f快照的588个已提交增量逐字校验到10c6ecc0，再核对完整609项与净树，[源映射](linux-input-update.json)。依赖锁未改、无重复安装；真实Linux4核/UID501、Node24.4.1、Chromium151，与此前[环境](../linux-vm/environment.json)相同。Guest NTP在测试期间关闭。

## 红绿、四层结论与后续

红灯复用用户已确认的10秒窗口中位162.502505s；4秒两平台当前组合三次中位约103s，性能目标关闭。slow[原正/反事实红绿](../../stop3-health-fixture-stability-20261025/slow-control/summary.json)获用户确认，精确时序和生产文件未变，未重复额外采样。

端到端：当前组合按已批准例外满足六轮要求。逐环节：正常、繁忙、403、挑战及精确slow原契约保留；E1未修复。严重度：没有真实任务或用户空位/日期/人数/时段结论，不把离线通过称Live能力。归因：修fixture窗口和耗时；E1潜在生产误拒绝交F3，F5原例01能力限制仍保留。

[统一统计](adapter-lines.json)：站点非测试TS3864、source-packs.ts473不增加。新增真实模型/Google/餐厅网站/Live/环境重跑均0，334等既有F5账本计数原样保留；VM本回合继续复用，全部切片完成后清理。按授权合main推送，然后从新main进入回放URL映射分支。
