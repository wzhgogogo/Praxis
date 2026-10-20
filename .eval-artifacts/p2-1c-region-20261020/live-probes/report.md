# P2-1c：集成分支五次真实发现探测

- Evidence status: exposed development / Live Read-only discovery diagnostics，非Clean Baseline。
- **本轮约定的五次发现探测验收通过。** 原顺序全部完成；没有来源失败、READ_BUDGET_EXCEEDED、环境重试或S0边界违规观察。下一步停下等复核；没有启动库存查询、完整H001或H001–H005 Live。

## 结果与有效产出

| 顺序 | Tabelog 地区 | TL半径内候选 | TC半径内候选 | 正式发现耗时 | 模型调用 | 本例验收 |
| --- | --- | --- | --- | --- | --- | --- |
| 神乐坂 #1 | A1309 | 5 | 5 | 82.4s | 4 | 通过 |
| 中目黑 #1 | A1317 | 4 | 5 | 112.9s | 4 | 通过 |
| h001 对照 | A1303 | 4 | 5 | 79.4s | 4 | 通过 |
| 神乐坂 #2 | A1309 | 5 | 5 | 89.9s | 4 | 通过 |
| 中目黑 #2 | A1317 | 4 | 5 | 91.2s | 4 | 通过 |

候选数按来源分别报告，不表示跨来源去重门店数、HARD合格、库存或最终可交付结果。h001与B两次共同基准保持TL4/TC5；五例Tabelog见证均在列表与首批详情。神乐坂实际进入Iidabashi→Iidabashi & Kagurazaka（A1309/A130905）；中目黑进入Along Tokyu Railway Line→Naka-Meguro & Yutenji（A1317/A131701）。原始模型观察中的href与snapshot落点已分别核对，见[观察动作](observed-region-actions.json)。

## 执行、配置与预算

- 产品源码保持集成`39980768d90658e0c4741f87f4346338a3a56172`：State18／TaskDefinition16、Browser Prompt17。运行HEAD前3例422e648、后2例1aefa43；差异只有外层存储额度和冻结凭据，全部生产源码一致。
- 原输入、地点、半径、参考时间、模型/执行配置及原见证不变。冻结cfcf73f；用户明确批准压缩产物60MB→65MB后，在96f4bf6重冻余下index3/4，旧plan/freeze/receipt原样保留于storage-allowance-65mb。仅存储上限变化；模型450、探测60、每例180秒/15模型和源预算未扩大。
- 每例网络及来源预检正常：DeepSeek可达、Google实际搜索非空、Tabelog20家、TableCheck122条；TableCheck未做额外首页网络预检。使用`--no-proxy`。实际间隔分别为321.27s, 312.043s, 309.706s, 318.379s，均≥300秒。403/503/429或繁忙页的900秒单次重试规则未触发。
- **本轮20次模型调用全部成功；Google Places 23次（正式发现18、来源预检5）。** 发现账本累计347/450模型、59/60探测、171 Google；无额外模型回放、基准测试、完整Live或外写。
- 模型配置为DeepSeek `deepseek-v4-flash`；实际调用的purpose/prompt版本/耗时/temperature/thinking/token usage逐次保留于[调用账本](model-calls.json)。模型标识来自同一Node环境加载器，环境文件修改时间早于批次；逐次捕获本身未返回模型标识，未补造响应字段。
- 全部结束于2026-10-20 17:54:05北京，早于原见证截止2026-10-21 10:47:04北京；未续期。压缩产物最终统计另见verification.json，仍须≤65,000,000字节。

## 独立评价与四层结论

1. **端到端：NOT_EVALUATED。** 这是仅发现诊断，没有查位或用户最终展示，不能宣称完整H001通过。
2. **阶段：PASS。** 原Python独立检查字面地区、真实snapshot、轨迹返回候选的几何半径、h001固定对照、模型账目及原预算；五例均SATISFIED。每例正常控制不仅到达正确入口，也在预算内取得实际候选；原离线错误入口拒绝回归仍保留。
3. **Severity：** 独立只读边界审计5/5 ABSENT。没有最终交付claim，S0声明/HARD/身份/库存质量不适用本轮诊断，不用未评价维度宣布产品整体通过。
4. **归因：** B神乐坂2次、中目黑1次均没有Tabelog候选并发生READ_BUDGET_EXCEEDED，本轮原开发输入到达正确地区并产出候选。结合既有固定录制红绿证据，支持地区入口修复在这些案例上的效果；真实来源数据和集成版本均已变化，不声称全量泛化或单变量统计因果。两目标各2次、h001单次，只报告这五次观察。

[自动独立评价](evaluation.json) · [最终人工验收核对](verification.json) · [原始逐次账本](ledger.json)。评价与执行原始artifact分开保存，之前分批评价不覆盖。

## 保留的限制

- 现有Recorder保存了公开文档、截图、响应与模型输入/输出；五份manifest均标记NOT_REPLAYABLE/UNSAFE_DOCUMENT，见[录制核对](recordings-audit.json)。这些Live证据支持地区/预算诊断，不声称已构成可执行HAR回放语料；本轮未扩展Recorder。
- 当前DiscoveryProbe按来源重建continuation，Google次数不能单独评价产品跨阶段缓存消费。该合同沿用原离线生产/持久化覆盖，本轮没有改Runner或进一步优化缓存。
- 产品源码未改，复用上一切片五门禁（默认978/978、Chromium122/122、type/arch/build）和22份校准（22/22、S0声明20/20）；本轮新增外层15项离线核对和三份plan-only加载，无付费调用。推送证据后停止，等待独立复核。
