# 种子发现与 settle 复用：离线修复简报（2026-11-11 CET）

工作分支 `codex/fix-seed-discovery-and-settle-reuse`，基线main `dafc2278`；仅候选，未合入main。源码7b3d2e7f（门禁冻结含证据85a72f2d），浏览器Prompt24/Agent32不变，45/90秒、入口和操作/模型额度均不变。

**07-r1补评正式收口。** 按既有reviewHoldoutAttempt，在原产物的逐字节副本独立解析同店来源分类“Yakiniku (Japanese BBQ)”、完整地址4-45-2/2F与来源坐标，距录下的Koenji解析圆心502.068m（≤1000m）；不读取产品HIGH/SUPPORTED作oracle。结果 EVALUATED / qualified=true / QUALIFIED_DELIVERY / s0=0 / stopBatch=false；9时段+B1的其他检查保持PASS。原evaluation.json SHA `c73b9832…`不变，补评另存07-r1-review/.../evaluation.supplement.json，复制批次EVALUATED_BY_REVIEW；注释SHA `2473c5e9…`。完整资格oracle取代原“等待语义”的路径，评测器正常不再重复输出旧9条QUALIFICATION_QUOTE，旧9PASS仍保存在原评价；其他检查rule/subject/status一致，未改评测规则。

| 修复 | 反例 → 修后证据 |
|---|---|
| PENDING初始化 | 原执行器在settle之前扫描，旧路径会丢弃initialObservation再扫；通用settledSnapshot先有界结算再取新快照，适配器与runSkill复用同一观察。导航遗留pending/首次快照pending两种红→绿；生产Tabelog适配器组件至首个查位模型决定仅1次扫描。必要settle和PENDING拒绝/结果稳定性规则保留；未把原3.2–3.7秒全部当作净节省。 |
| 地名与直达 | 两份真实D02-V Nakano列表对Nakano City原判false，queryLabel=原始解析查询Nakano后true；goal也用同一权威查询地名，无同义词表。真实列表Sumika第12，单改地名仍超过详情10家上限：按已观察分类与权威检索词字面相关度优先读取（仅导航顺序，不证明HARD），原5/10上限不变；组件取得真实tabelogNativeDetailUri，后续查位只打开该确切URL，没有名称盲搜。 |
| 泛地点文本查询 | 复用来源包既有retrievalExpression解析；有文本查询时，当前查询或可见结果文本须体现权威检索词。纯地点查询true→false；当前词已体现true；无文本查询的目录浏览保持true。不改Agent动作、不构造搜索网址。 |

**07-r2 Google原因已确认。** supplementaryDiscovery确实执行且COMPLETED；请求`yakiniku Koenjikita`与r1首请求的参数及地理矩形相同。r1首响应20家（两页原始共40家、区域核对后37）；r2录制HTTP200正文`{}`，GooglePlacesClient.textSearchPage按既有契约读成places=[]，因此0家。不是4家原生候选导致跳过；未加重试/备用源。原始索引、响应SHA及参数对照见google-comparison.json。

**证据限制。** 07-r2 sw=Koenjikita列表snapshot3原来OMITTED/UNSAFE_DOCUMENT，HAR也无正文；这一条用真实URL/4家分类元数据+明确LOCAL_CONSTRUCTION列表组件，不能称真实DOM回放。D02两份列表及Sumika详情DOM保持原SHA；入口跳转为本地导航替身，非原网页JS整页回放。没有新的Live成功/性能结论。

**门禁与保全。** typecheck、arch:check、build、默认1596/1596、Chromium281/281、G6 159/159全部通过；新增相关99项、D02-V recorded-progress、D4/D8回归通过。scan-hardcoded相对ead28945与dafc2278新增产品命中均0，无豁免。用户给的pnpm别名在仓库不存在，使用权威package scripts对应npm命令及原scan-hardcoded.sh，未新建重复配置。最初夹具必填字段/启动策略遗漏及补评外层比较器误将正常资格引用行移除当漂移，失败日志均保留；修正夹具/比较器，没有删除业务或安全断言，h06只新增queryLabel预期。

本轮0模型 /0Live /0网站GET；两个账本SHA均未变，主工作区草稿哈希与原证据评价不变。提交并推送上述分支、ls-remote核对后停止，不合入main。
