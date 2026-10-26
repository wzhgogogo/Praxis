# 行数计划可实施性证据

状态：exposed development evidence / frozen regression；维也纳 CET（UTC+1）。未运行 Live，不是 Clean Baseline。原批准输入来自 `codex/chore-phase3a-prime-f3-audit` 的 d3c8e496，逐字副本及哈希见 inputs/provenance.json。

原 JSON 有 11 条：L1–L8、L9a、L9b、L10，没有 L11；这里保留原 ID。原估算 306 行，并非已实现承诺；3864→3591 需实际减少 273 行。

最小对照输入在 8f20a219 冻结，再于当前 parser 上运行。probe.log 为 PASS（7 对），observations.json 保存全部文字输入与字面预期。对照只删除拟退役的区分信号后，其余 URL、text、interactiveState 和 HTML 均相同，而当前合同要求不同输出。它们证明当前信息依赖，不能证明任意未来替代实现不可能。

| 条目 | 实际处理 | 不可直接删除的契约 |
| --- | --- | --- |
| L1 | 延期，减行 0 | 关闭/满席/电话预约不同终态 |
| L2 | 延期，减行 0 | 人数组归属、选中状态与隐藏人数一致性 |
| L3 | 延期，减行 0 | 源控件提示及受限状态必须联合取证，保持 UNKNOWN 边界 |
| L4 | 延期，减行 0 | 现有明确可用/不可用 slot 正反例 |
| L5 | 延期，减行 0 | 当前 widget 的日期、人数、时段归属，不能用页面共现替代 |
| L6 | 延期，减行 0 | 隐藏祖先内的链接不能证明当前库存 |
| L7 | 单独实施 | 只合并重复计算，保留表单/日期/人数/option 核验 |
| L8 | 延期，减行 0 | 无捕获响应或同请求链接时，原 slot 正反例仍有用途 |
| L9a | 延期，减行 0 | 原生 SELECT 确定性选择及实际返回值核验仍有调用 |
| L9b | 延期，减行 0 | shortcut 没有等价控件入参；不改共享 Browser 接口补造它 |
| L10 | 单独实施 | 保留真实外层菜单、逐 scope、午晚餐/价格隔离，只简化重复遍历 |

L9a/b 的静态依据：两个 selectedDateField/selectedPartyField 均有真实调用；BrowserPageControl.structure 没有 DOM id，id 是不透明引用。SELECT 的默认可见标签不保证表示字段名，不能把 id-only 原生字段当成已有语义观察。TableCheck shortcut.run 目前只收到 snapshot。重建这些观察或改共享执行器不是零成本的已有观察复用。没有删除快路、增加模型调用或迁移到 Pack/通用层。

细分原因及下一步见 deferrals.json。正反例均保留；延期不记红绿通过，也不把历史 fixture 或未知观察当成替代证据。L7/L10 的相关红灯、完整链路五门禁和实际行数分别在同级报告中。

新增真实模型、Google、来源网站、Live、环境重跑调用均为 0。无密钥或 .env 读取。输入和外层脚本 SHA 见 freeze.json、各批次 freeze.json；时间、SHA 与最终 main 见总报告。
