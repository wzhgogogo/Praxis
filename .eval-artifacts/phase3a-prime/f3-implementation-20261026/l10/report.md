# L10：原遍历内完成菜单 scope 收集

状态：implemented / frozen regression；2026-10-26T00:42:48.513764+01:00，维也纳 CET（UTC+1）。分支 codex/chore-phase3a-prime-f3-l10，基于 main f1879040daaa5c8832f2da0dde5bbdf1ff8abe96，五门禁源码 dbabf096d6b92508101e51e16ea25039b864e6db。

保留原 HTML 标记遍历，在菜单闭合时直接产生 scope 摘录与排除区间，删除 completed 集合及第二遍处理；用 Map 统一重复指纹与稳定顺序。findLast 避免反向数组复制，容器仍要求完整 menu-item class token。数据留在原 parser，没有迁往 Pack/通用层。

category 仍属于最近的外层菜单；只有可见、启用、字段/组/value/label 齐备的已观察 RADIO scope 可产生摘录。评论、script、style 不变成菜单；畸形闭合仍丢弃后代，避免跨兄弟泄漏。scoped 区间继续从 unscoped 文本剔除，午晚餐和价格不能混用。

## 红绿与门禁

1f3f881d 冻结新增最小反例：把 article 的 menu-item 改成 menu-item-title，必须没有 scoped 摘录。隔离变异把完整 class 等价判断改成 startsWith，原地源码不动；断言失败为有效红灯。相关测试修后 2/2 绿，原所有断言保留。输入、脚本与生成源 SHA 在 red/、red-inputs/freeze.json、green-inputs/freeze.json。

| 门禁 | 结果 |
| --- | --- |
| typecheck | PASS，0.394 秒 |
| arch-check | PASS，0.190 秒 |
| npm-test | PASS，19.736 秒，1060/1060 |
| build | PASS，0.402 秒 |
| browser-fixture | PASS，106.473 秒，161/161 |

完整原始日志在 gates/。默认1060/1060，真实本地Chromium161/161、4路并行；所有门禁前后 git status 为空，冻结输入前后相同。无跳过、无已知失败豁免；Linux 本批 NOT_RUN。核心 same outlet/query/HARD/价格/餐期/日期人数绑定回归在全套保留并通过；仅向原测试增加一个负例断言，没有按模块数增加重复套件。

## 实际行数及延期

统一计数器的逐字副本 SHA 与源相同，输出放到独立临时目录后原样归入 adapter-lines.json，避免覆盖历史计数文件。统计公式未变：两个站点目录非测试 TS，排除 fixtures，物理 splitlines。3862 → **3847（L10净减15）**，source-packs.ts **473 → 473**；站点 Skill 不计。合计3864→3847净减17，距3591仍高256。原L10净减54估算未达；不通过压行、删核验或搬迁凑数。前一 commentary 的16行口误已以统一计数更正为15。

L8、L9a、L9b 保留原代码、减行0，与 L1–L6 一样按替代观察不足延期。原因见 ../line-eligibility/；L5 的既有 REGION 能力与完整请求绑定的区别补充于 deferral-clarifications.json。延期不记作红绿通过。原 H0 历史计数文件已保留原字节，新的 L7/L10 数字各自保存，不替换历史证据。

新增真实模型、Google、网站、Live、环境重跑调用均0。产品/Prompt/Schema/Guard与对话B四文件不改，protected SHA 见 boundaries.json。五门禁完成后合main推送，集成 SHA 与 ls-remote 在总报告记录。
