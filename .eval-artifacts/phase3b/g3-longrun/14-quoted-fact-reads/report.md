# G3c 通用报价与事实读取：因 A 评测 fixture 接线停止

2026-10-29T14:13:21.607399+01:00，维也纳 CET（UTC+1）。**STOPPED_A_OWNED_FIXTURE / WORK BRANCH / NOT INTEGRATED**。G3 尚未完成，不能宣称本候选五门禁或严格 G2 全绿；不合 main。

分支 `codex/feat-phase3b-tabelog-observed-availability`，源码候选 `fec90a362404243e3cd93c47be00fca40ca43c3e`。已同步用户指定的 main `50a0836148c5b026240a770de89c5d5357091355`（合并提交 `97bfff03`）。此前完成组及逐组门禁见 [组清单](../groups.json)；本组不能用早先全绿代替当前生产组合验收。

## 各组红绿与门禁（按当时冻结候选，非本组验收替代）

| 组 / 范围 | 有效红灯 → 同控制绿灯 | 五门禁及固定G2 |
|---|---|---|
| 01 响应结构与精确绑定 | c96c7436：native7 + Chromium1红 → 同8控制绿 | da0546fb：默认1210/Chromium176全绿；普通G2 4/4 |
| 02 公开列表 / busy | c330fbc3：native3 + Chromium1红 → 同4控制绿 | f6154ca3：默认1213/Chromium177全绿；普通G2 4/4 |
| 03 控件失配回到观察 | 551e6dd0真实Chromium最后AVAILABLE断言红 → 精确Offer绿，错人数响应仍UNKNOWN | 6bb5ba78：默认1213/Chromium178全绿；普通G2 4/4 |
| 05 日期 / 非英文时段只从响应 | bcc122d3：native2 + Chromium1红 → a84066c8同控制绿 | 2d29aead：默认1215/Chromium179全绿；当时Sen未决 |
| 08 OBS08/09公开选中 | 41cec356红 → 32a9d16c绿，12f5dd0d相关回归绿 | 当时仅Sen依赖红；11/12同步A基线后dc337a7b五门禁全绿、严格12页PASS |
| 09 原文套餐报价 | f5103dcc两站改名红、182cb113/cb752bea完整条件/冻结反例红 → 对应原生163/核心49/Chromium14绿 | 后遇c8ff6bf7已有HARD人数S0而停，用户规则由11修复，不冒称09完成门禁 |
| 11/12 报价适用及A同步 | 至少4人/请求2人MET红 → NOT_CHECKED绿，其他适用价格控制保留 | dc337a7b：默认1225/Chromium180全绿，严格5测试/12页面PASS |
| 13 公开事实字段 / 菜单范围 | a4006071两站改名红、2eb7bafb范围/全局文档红 → cbfdb210对应123绿 | a47b5ac6：默认1225/Chromium180全绿，严格5测试/12页面PASS |
| 14 通用原文事实读取 | 4a7f8a31六个目标红 → 27核心/141实际对应绿 | fec90a36 type/arch绿、默认1217/1230；需A来源fixture同步而停止，其余未跑 |

各组失败尝试、冻结和外层脚本SHA完整保留在组目录；不把Mock/保存页片段回归称为当前Live，也不将此前绿灯用于覆盖本轮红灯。

## 实现与边界

- Native/官网共同事实组合及两站现有可读取页使用同一 `restaurant_source_facts` **Prompt/Schema 2**。模型只选完整原文起止编号、角色和其中价格行编号；代码核对同店、URL、读时、完整原文、评论、越界/重叠，再从原文解析金额。无模型数字、URL、门店 ID 或库存结论。
- 保留整段人数/餐别/日期/附加费/税原文。公开 `del` 目录价只在同一完整可见价格行内剔除计算，不删除引用；同一报价有多个当前金额则不选择便宜项。缺证、相矛盾或超出完整引用边界时未知，不补造事实。
- Native 的 TableCheck 公开菜单分区保留；选句必须唯一属于该公开范围，范围内套餐不会复制成全店事实。同店网页快照冻结后才调用模型；调用经现有 Executor/共享预算/取消，每新快照至多一次，不新增抓取/循环。
- 删除两站旧私有价格与 HARD 快捷函数、Native 私有 Tabelog 价格读取、OWST 私有套餐字段读取。公开字段可作引用元数据；缺少时回到原文选句和既有 FactJudgment14/Schema4。原始报价不进入 Offer 库存或锁价。
- G1 页面获取增加内部 `capturePagesOnly` 用途，只获取身份绑定的原始页，不额外解释菜单/HARD，以保留每题既有独立预算。该标志不进持久 State/事件。G1 Prompt/Schema3、Agent29/Action5/Context17、State24/TaskDefinition22 不变。
- C 的五个保护文件、四个测试块/断言不变；只有先前批准的固定响应输入差异。`tabelog-vacancy-response.ts` SHA `3c31462c902faaaa3acae3a3f040583472e757ac68b15ef1b371a46b563c0afa`，输出未改。Guard/身份规则未放宽。

## 红灯、局部绿灯与当前失败

1. `4a7f8a31` 冻结有效红灯：27 项中 21 绿、6 个目标断言红（完整价格行、商家类别原文、预算错误根因、改名官网套餐、共同组合和 G1 捕获用途）。不是启动错误。[原始收据](red/receipt.json)。
2. 初次实现 `7455fc16` 有导出/类型错误，明确不作为红灯证据；`0ebb1264` 修正后核心 27/27、旧条件对照和 HARD 字节检查通过。之后对应 133 项暴露旧 fixture 未保留目录价/人数原文、未声明页面就绪；保留失败原始日志，修复后 `c47eeb82` **核心27/27、实际对应141/141**，包含 Native 连续性、页面追问、价格和 Router→Reducer 展示。[收据](corresponding-green/receipt.json)。
3. 最终源码 `fec90a36`：typecheck PASS、arch:check PASS，默认 **1217/1230，失败13**（12个叶断言加1个父测试），29.772秒。各项前后 git status 为空，无恢复、skip 或 todo。[门禁收据](gates-stopped/gates.json)、[失败逐项清单](failed-gate-inventory.json)。build、完整 Chromium 和本候选严格 G2 因跨归属停止尚未运行。上次严格 G2 是 `a47b5ac6` 的12/12页面PASS，不冒充本候选结果。
4. 失败位于 A 负责的三个评测测试文件，进一步只读定位还涉及非测试共用来源工厂 `current-development-fixed-sources.ts`。Scripted model 不处理新增 Source2 请求，部分正常流程只安排 SEARCH→CHECK→PRESENT，旧正例靠已退役的私有 HARD 解析直接产生事实。当前会诚实未知、消费错误的脚本动作或把这些未准备请求记为模型错误。`fixed-source-case-execution` 的正常控制也是 MODEL_FAILURE，不是已证明的时序竞态。
5. 按“需要改动对话 A/C 的文件，先停下报告”停止。本组没有改这些 A 文件、评分器、Gold、参考答案或旧期望，没有通过恢复私有代码、降低断言、增加生产预算来过门禁。B有改写对应测试的授权，但该共用评测来源工厂及输入证据仍归A；身份guide缺少菜单原文、预约页缺少事实读取的同店资料，不能由B放宽身份或补造页面来恢复旧正例。需由 A/复核者安排来源fixture、模型和必要的显式事实调查动作，再在同一候选上复跑；实际范围见 [交接单](fixture-handoff.md)。部分失败仍需同步后的实际链路验证，不能预先保证仅改返回字段就全部解决。

## 用户批准的 HARD 适用规则及旧结果

沿既有 Intent 的日期/人数/餐别核对报价条件，无 State/TaskDefinition 变更。旧冻结 **367组输入、481条件（370 HARD /59 SOFT /52 UNSPECIFIED）** 只有以下状态变化：

| 旧→新 | 请求 | 原文 | 原因 |
|---|---|---|---|
| MET → NOT_CHECKED | 2026-08-05 晚餐，2人，上限JPY8,000 | Seasonal dinner course: JPY 8,000, tax included; dinner only. Available only for parties of 4 or more. | 明确至少4人，已知不适用；没有其他适用报价，不能用该套餐证明 MET 或 NOT_MET。 |

其余480个状态不变。另17条来源行（8份不同报价）被排除于比较，原始事实仍保留；每条原文、SHA和原因见 [完整旧状态/来源对照](../11-price-applicability/legacy-state-and-source-changes.json) 与 [字面依据](../11-price-applicability/literal-source-dispositions.json)。完整旧事实回归 **44,197字节**、SHA `9a3298bc5e004b99e41d80713e8913b68c336cfa594f6eb60599e310ee3fb633` 不变。

这两项固定旧输入对照不能代替本轮实际执行链路；上述12个脚本叶断言仍未关闭，故不声明全链路 HARD 不退化已验收。

## 对应测试维护

- 旧两站价格片段解析测试改为保存页原文→fixture模型选编号→代码金额解析；同4份已提交最小片段、独立原金额/税/URL期望保留，并增加去除全部私有标记后相同。模型替身不读取金额 oracle。
- 所有既有 Source1 fixture 返回同步 Source2 的 `priceStatementId`；没有双版本兼容。
- C18 H002 构造 text 补其相同 SHA HTML 本就显示的 Dinner 报价，声明静态页面已就绪，接实际 Native 原文选择；三店次原价格、当前/旧证据和 Router→Reducer 断言保留。
- TableCheck 库存测试中“featured-menu 私有class 自动产生 RESTAURANT_FACT”的实现断言退役，改查该 class 不自动核实 HARD；原同店/日期/人数/时段、Offer、错误库存/无副作用断言保留。正向事实能力另经实际共同组合验证。本组A评测链路未改。
- 新增5个机制测试（旧默认1225→1230），既有失败不删。新增/重写的 assert 有明确消息；时序控制沿既有注入时钟/条件等待。

## 剩余私有依赖与证据限制

- Tabelog 日期、人数、时间的已知 CSS/data selector 只作观察/导航或加速提示；失配回到公开 label/ARIA/原生值。格子 class 不得证明满席/电话/休息；日期和时段结论只来自精确绑定的已审核数据响应。无响应 UNKNOWN。
- 详情身份字段保留 C 的规则/选择器；属于 OBS20/31 的受保护范围，未在 G3c 偷改。详情排序/片段测试及代码保留。
- TableCheck 查位、结果容器/busy 与日历私有依赖属于延期 G3b（OBS25/26/27/34），等待第一次 Live 的有时段日历保存页；本批没有伪造样本。
- 评论分区沿用公开标题/ARIA/链接；无法通用识别无标记评论的残余风险仍适用 ADR。新 Source2 的真实模型选句质量、当前网站连接和实际库存没有测量。

## 冻结、计数和交付

708个输入/脚本SHA在门禁前后相同，完整冻结清单 [input-freeze-green.json](input-freeze-green.json)，SHA `6292ead5e8be76d0858ba88d3c41a1709993045753151dcc1adc7c6a0d30a8b8`。所有失败与成功收据保留，无恢复已提交文件。

统一脚本参考行数：两站非测试TS **3,890**（main50a:3,911；上一组3,964），`source-packs.ts` **482**（main50a:478，差异为本批原有模型依赖接线），未把站点业务迁到Pack/通用层凑数；行数不是门槛。[计数](adapter-lines.json)。

账本483条，原480条值完整保留，追加本组0调用，并按id并入远端C的新条目2条；同id无冲突。新增真实模型/Google/网站/Live/公开GET/环境重跑均 **0**，未读取.env或QA参考答案。只推工作分支，G3当前状态为未完成、等复核安排 A fixture 同步；不合 main。

C后续通知与远端核对：main现为 `00519783b3f6a3e48a53a4a0a8b03c9621c8bcf7`（B1已合入），本候选冻结基准仍为main50a，未在停止后混入产品变化；恢复时先同步新main。共享账本已独立并集保留C全部条目，见 [main/账本收据](main-and-ledger-union.json)。
