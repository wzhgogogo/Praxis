# 推荐与查位边界：停止点 2

Evidence status: current executable candidate / exposed development，非 Clean Baseline。全部新时间用 CET UTC+1。停止点1原报告逐字节保存在 [batch1-report.md](batch1-report.md)，旧 manifest / evaluation 不改写。

## 1. 范围与提交

- 分支 `codex/adr-0044-recommendation-availability-boundary`，main 基点 `7165f8a20fd86e105ea3219100061699c03197a1`，停止点1 `cca576ece21ace1184c95d34f8d0308534926282`。本批不合 main。
- `3ec5d9fd` 接受 ADR 与独立额度；`8b6fafb9` / `661a1b5e` 冻结检错测试；`cd443a8c` 为 schema4 有效正控制下的引用红灯基点。实现冻结提交和正式结果随后补记。
- 批次2只实施与离线验证：Prompt@24、Semantic Proposal@4、scorer/report@4；不保留旧 Proposal 兼容。新 TARGET 必须给出结构有效的 goalBasis，各引用来自当前消息；无新 TARGET 的修正沿用原目标。
- goalBasis 只在提议/静态评测结果，Compiler 显式摘取 goal/query/scope/count；持久 State@20、TaskDefinition@18、原 Gold、原始用户指令逐字节不变。SR03-T02 不改 Gold。
- 新评分配置绑定原文 SHA，仅目标维度使用已批准类别；其余 Proposal/Patch/Draft 字段与 operation 严格比较。真实模型入口保留逐阶段 oracle。输入配置先提交冻结，再运行评价。

## 2. 改动、红绿证据与未覆盖范围

所有日志在 [batch2/](batch2/)。

| 边界 | 检错证据 | 绿灯入口/预期 | 未覆盖 |
| --- | --- | --- | --- |
| 新 TARGET 依据与每条当前消息引用 | red-baseline.log 中旧合同接纳无依据；red-citation-boundary.log 在 schema4 有效正例通过时仍错误接纳伪造/历史引用 | Proposal/Interpreter、实际 message handler → Compiler → Reducer；两目标保留，空/伪造/混合引用失败；最多既有2次输出尝试，State无依据 | 不审查理由合理性，不证明真实模型判断 |
| 独立目标评价 | red-controls.log 中伪造灰区依据、A/B推荐错误PASS的断言失败 | 灰区两目标可过；A/B推荐、无时间查位、改变沿用目标、非目标字段漂移均失败 | 新口径分数不冒充旧Gold分数 |
| 相同query的相反goal不被吞掉 | red-conflicting-goals.log 中错误COMPILED | Compiler冲突键保留goal，两种事实顺序均CONFLICT | 无新增分类规则 |
| 后续环节不改目标 | 盘点未发现改写路径，无新生产修复红灯 | Agent严格输出拒绝target/statePatch；生产读取组合到展示保留goal | 不证明当前网站行为 |
| 推荐无人数/无slot可交付，可选slot可附加 | 既有能力回归，无新修复红灯 | 实际生产composition有/无日期时段均不问人数、无slot展示；受控Availability端口原始观察经Grounding产生附加slot，Router/Reducer保留推荐goal | 可选slot仅证明端口/Grounding/Router/Reducer，不证明真实Adapter/网站库存 |
| 开发15轮 | 旧Gold/阶段oracle保持原样，目标新标注独立 | 完整实际proposal、compiledPatch、draft、旧goal和新goal评价另存执行产物 | 13轮旧Gold未标TARGET，其目标单列新规则；未标query不冒充旧Gold验证 |

初次红灯的引用正例因只提供一次响应产生 MODEL_FAILURE，不能证明引用检错；修正后在 schema4 下取得有效正控制/红灯。初次迁移的陈旧 schema、遗漏 fixture 依据失败保留在 default-initial.log。red-controls.log 的 shell 包装最终退出0，不能把包装退出码伪记为1；断言失败以原日志为准。

四层边界：本批静态评价只验证理解请求与 Compiler/Reducer 合同，真实 composition 测试验证所列受控交接。真实用户端到端结果、来源声明/越界 S0、真实模型严重程度及真实故障归因均 NOT_EVALUATED。离线首个失败层按上表记录，不把下游阻断重复算失败，也不把调用0当作 S0 通过。

## 3. 五门禁结果

待在干净、已提交冻结上运行：typecheck、arch:check、npm test、build、test:browser:fixture。每项后 git status --porcelain 必须为空；原日志、退出码、时间和状态保存在 batch2/gates/。不恢复文件掩盖测试写入。离线15轮执行产物另存 semantic-fixture-execution.json，并独立核对原文 SHA、目标和非目标字段。

## 4. 模型调用与来源访问

- 真实模型 **0 / 144**，独立记 [budget.json](budget.json)，[3a′共享账本](../phase3a-prime/budget.json)记独立分配、不占其400次。Google/餐厅网站/Full Live/外部写入均0；.env、.eval-private/未读未暂存。
- 本机 Chromium Fixture 单列，不等同来源 Live。
- [未来输入选择](batch2/batch3-input-selection.json)：15＋14×3＋12＋3＝72逻辑轮，最多144次（含既有两次输出校验）。公开12例使用已物化、SHA绑定且无 {DATE} 的原输入；Wednesday原话是新开发输入而非Gold；SR08/SR09灰区双轮每次共用一次前缀。批次3尚未运行。

## 5. 偏离与实施说明

- 无外部范围或授权偏离。当前相关 Compiler 发现相同query双goal被去重，先取红灯再修；无语义后目标写路径可删除。Guard、来源、站点目录、source-packs.ts、预约实现不改。
- 评价编译传入冻结 Tokyo 参考时间，让支持的相对时间经生产 Compiler 物化；物化后的日期/时段/诊断差异仍严格记录。探索中的“忽略未标诊断”及真实模型简化归因在冻结前撤销，保留批准的非目标严格比较/逐阶段oracle。
- STATUS、Domain、Eval规则、DEVLOG、TEST-LOG、月度索引同步本批实现事实；停止点3才确认Gold变更及相应最终事实。旧报告和评价保持历史身份，不追改分数。

## 6. 待复核事项

- 正式五门禁全绿并推本分支后停 **STOP_2**，等复核再运行批次3；不合 main。
- SR03-T02：规则B要求AVAILABILITY，旧Gold为RECOMMENDATION；静态输出保留并列，停止点3逐条确认，本批不改。
- 真实模型锚点准确性、灰区三次一致率和其他语义差异尚未测量。以后观察到非目标变化或A/B推荐，保存并报告，不修Prompt/Gold抹平。
