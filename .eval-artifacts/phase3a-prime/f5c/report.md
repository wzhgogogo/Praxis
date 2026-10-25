# F5c：同次来源调用内完成纠正

- Document revision: 1.1
- 时间：2026-10-25，维也纳 CET（UTC+1）。
- 状态：current executable（本分支）/ frozen regression（离线证据）；未合入 main，待复核，不是 Clean Baseline。
- 基线：`a691f7ddbce7a4fc32829508993a1ef49b269fd2`；分支 `codex/fix-phase3a-prime-f5-provisional-entrance`。本批不重放、不合并 main、不运行 Live。

## 1 结论与范围

纠正已移入当前 Tabelog 来源调用：第二个有效坐标越界后，立即用现有 Executor 给出距离/方位及已观察集合，由模型选择引用，代码校验后直接访问替代入口并继续详情。根 Agent 的 `NATIVE_FIRST_BATCH_PENDING` 门禁保留。来源 90 秒、4 地区页、10 详情、整单 500 秒 / 50 次模型调用均未增加。

见证冻结补齐公开完整地址与经独立核对的来源名称/地址对；历史 Live 产物和评价零差异。槽 5 超时发生在后续可用性读取，记录不支持归因于 F5 临时入口分支，也未显示 Tabelog 在空检索后回读通用列表。

所有新增真实模型、Google、网站 GET、Live、环境重跑均为 **0**，未读取 `.env`，共享预算账本字节不变。站点目录 3864 行、`source-packs.ts` 473 行，全部保护文件字节不变，见 [scope-audit.json](scope-audit.json)。健康检查、录制器、F3、店名解析产品逻辑均不在本批修改范围。

## 2 有效红灯与修复

红灯输入提交 `821c3858` 的产品 `native-restaurant-search.ts` 与基线逐字节一致，哈希见 [regression-inputs-sha256.json](regression-inputs-sha256.json)。输入是**本地构造**，数量参照槽 1，不称网站回放。真实 Interpreter → Compiler → Coordinator → 合法动作计算 → Router → Native → events/Reducer 全链路运行，只替换模型与外部传输边界。

旧代码下，真实根 Agent 已观察到 TableCheck 2 个、Google 26 个候选，`legalActions.search=false`、`searchAvailability.reason=NATIVE_FIRST_BATCH_PENDING`；同一测试随后因替代入口未访问而失败。见 [有效红灯](red-agent-loop.log)。最初输入的 Google 字段断言曾使用错误 key，修正后冻结为 `821c3858`；该设置失败及旧两调用 fixture 的失效均不计入有效红灯。

修后同一断言通过，见 [绿灯](green-agent-loop.log)。加强断言还验证：第一次 SEARCH 的 Tabelog 元数据已经包含 replacement、4 个详情尝试和 4 个地区页；替代入口导航先于 TableCheck 调用。因此纠正不依赖未来 SEARCH。

实现沿用一次来源调用中的 Executor、deadline、集合、访问和模型计数，在目录循环内继续。两样本与 4/5 规则仍共用一次替换；本次调用内已接纳候选在无替代入口、替代入口失败或预算耗尽时保留。替代入口集合仍由来源组合层按当前 source/run/flow 与 Pack 校验，模型只返回引用，普通 DOM stale-ref 限制未改。

原测试 builder 复用并改为一次调用断言。旧 4/5 fixture 的人为 24 操作上限改用既有生产预算 80，以验证同一 Executor 内完整 10 详情；产品预算配置没有改变。

## 3 离线验收与四层说明

| 覆盖 | 输入与断言 | 结果 |
| --- | --- | --- |
| Agent 循环红→绿 | 本地构造 TC 2 + Google 两页 20/6；真实 SEARCH 门禁为 false，纠正在首次 Tabelog 调用内完成 | PASS |
| R1、G1/G3 | 既有 D1 观察 href + 本地构造列表/JSON-LD；东京→A1322→A132201→替代，地区页 4，恢复页 0，样本 2+2 | PASS |
| G3 Chromium | 本地构造 HAR、真实本地 Chromium、正式 Assembly/Wire/Executor；一次来源调用，3 次地区选择，无新网站请求 | PASS |
| F1：第二入口仍越界 | 第二入口两个有效样本后 UNKNOWN，不再回菜单，不第三次选择 | PASS |
| F2：无替代入口 | 同调用立即 UNKNOWN，不调用选择模型；原有已接纳候选保留 | PASS |
| F3：来源 90 秒 | 本地时钟推进，纠正耗尽来源窗口，导航前拒绝，elapsed/详情/模型不重置 | PASS |
| F4：正确区域边缘误判 | 独立本地控制，只消耗一次换入口，已接纳候选在本次返回中保留 | PASS |
| B1：交接预算 | 四种收尾后剩余 500 秒 / 50 调用窗口保持；到整单截止不能再开始选择 | PASS |
| C1/C2 | 一内一外、缺坐标、无效坐标；未知不计入有效样本，在内即核实 | PASS |
| X3 与 stale ref | 集合外、跨来源 URL、跨 flow、拼造 href 导航前拒绝；跨 run 集合仍拒绝；普通 stale DOM 引用依原 Executor 回归 | PASS |
| N1–N4 | 复用具名涩谷、神乐坂、东银座及吉祥寺同源指针 builder；不进入临时分支，页面/详情/选择数不增加 | PASS |
| 见证身份 | 固定公开完整地址 + 成对来源表记，Google 候选 FOUND；楼层冲突、仅地址、未登记名称均拒绝 | PASS |

目标默认回归 **213/213**，见 [targeted-all.log](targeted-all.log)；目标 Chromium **1/1**，见 [targeted-chromium.log](targeted-chromium.log)。干净提交 `a9d8aeba` 的五门禁已全部通过，默认 **1048/1048**、Chromium **154/154**，详见第 6 节。

四层解释：

1. 端到端：本地全链路控制证明同次调用纠正与有界来源交接，既有正常交付控制仍通过；没有新的真实网站交付或新的 Live 成功率，原例 01 **0/3** 不变。
2. 逐环节：真实根合法动作、观察引用、坐标、模型选引用、Pack 校验、导航、取样、UNKNOWN 与保留候选均有断言。原 Live 的 DOM 只用于离线分析。
3. 严重程度：本批 Live/S0 为 NOT_RUN。原 5 个正式 Live 槽的独立 S0=0 原样保留，不通过新代码重评历史，也不把本地控制冒充新 Live 的 S0。
4. 归因：旧产品目标红灯直接检出延期纠正与根门禁的集成缺陷；修后同一断言及 G3 接线通过。真实网站可解析性、模型在当前网页上的选择质量仍需另批批准的 Live 验证。

## 4 见证 oracle 冻结

[freeze-witness.py](freeze-witness.py) 只读固定 Git blob，无网络或模型入口，输出 [frozen-witness/registry.json](frozen-witness/registry.json) 与标准 manifest。原公开详情 JSON-LD 的 `streetAddress` 为空，完整地址来自公开 `p.rstinfo-table__address`：

**東京都北区赤羽1-15-1 新仲ビル1F**（门牌/楼层：**1-15-1 新仲ビル 1F**）。

仅补地址不足以打通漏斗：公开名 `Kushi Katsu Dengana Akabane ten`，Google 历史候选名 `Dengana Akabane`；Google 地址为 `Japan, 〒115-0045 Tokyo, Kita City, Akabane, 1-chōme−15−１ 新仲ビル 1F`。离线冻结器以公开电话 `03-5249-4011`、完整门牌/建筑/楼层、Dengana/Akabane 名称部分与坐标距离 **1.251 m** 核对同店后，登记这一个来源表记对。Google 字符串来自已暴露历史来源候选，只作为已核对的路由标签；不是新的身份或库存认证。

统一 `WitnessOutlet.identities` 为必需的名称/地址对数组，更新全部当前 TypeScript 调用方与 fixture，不保留旧直接 `address` 匹配执行路径。现有历史 registry 经统一加载器转换为主身份；独立登记的来源身份进入同一匹配循环。`f5-witness-identity@2` 与 Evaluator **@35** 为受影响对象；rubric **@30**、Browser Prompt **20**、context Schema **3**、decision Schema **12** 均未改。普通店名解析和产品候选合并不变。

未来外层评价使用 `loadWitnessOracle(manifest, registry, variant, artifactSha)`；旧 `f5-live/analyze.mjs` 是基线 SHA 绑定的 superseded retrospective 冻结脚本，不能把它的旧内联对象交给当前 Evaluator。测试 `F5c frozen public full address...` 已验证真实来源表记 FOUND，并有楼层/名称反例。

本次保留原 11-04、19:00、两人 vacancy 响应，仅供冻结回归，明确 `NOT_CURRENT_CERTIFICATION`；未延长原有效期，不认证后续 Live 见证。新 Live 仍须当时日期有效、24 小时内公开 GET 复查。输入压缩/解压 SHA 均见 [witness-inputs-sha256.json](witness-inputs-sha256.json)。历史评价、Gold、日期变体、原证书和共享账本没有重写。

## 5 例 03 槽 5 超时离线分析

固定输入均来自 `a691f7dd`，见 [slot5-inputs-sha256.json](slot5-inputs-sha256.json)；原 artifact SHA `5b123c79b5fb3a1d4d167a75562ab18d23857be2e50a13af4527c2595d833c95`。脚本 [analyze-slot5.py](analyze-slot5.py) 只读取 Git blob、压缩包、诊断 DOM、决策和 trace，不重放、不评价旧结果，详细派生见 [slot5-analysis.json](slot5-analysis.json)。决策行号从 1 起，trajectory 索引从 0 起，snapshot 为录制编号。

### 5.1 时间花在哪里

运行时间 **02:25:03.549–02:33:24.045 CET，500.496 秒**。沿用已保存补测的时间分区，并以原始决策 latency、调用数、起止时间逐项核对；不能归属的时间保持缺口，不冒充网络或模型时间。

| 分区 | 秒 |
| --- | ---: |
| 页面加载 | 202.848 |
| 读页面/控件 | 31.366 |
| 等待/稳定性 | 37.707 |
| 模型合计 | 108.174 |
| 其他页面操作 | 2.180 |
| 未归属 | 118.221 |
| 总计 | 500.496 |

模型按用途：语义 1 次 / 4.228 秒；根决策 10 次 / 29.999 秒；检索规划 4 次 / 9.149 秒；浏览器决策 15 次 / 45.969 秒；事实判断 9 次 / 18.829 秒，共 **39 次**。这张表是墙钟分区，不是依赖 DAG 的关键路径证明。

| 已完成动作 | trajectory | executionMetadata.latencyMs 对应秒 |
| --- | --- | ---: |
| Tabelog 发现，0 候选 | `[0]` | 47.609 |
| TableCheck 发现，5 候选 | `[1]` | 55.695 |
| TableCheck 查位 3 家、再 2 家 | `[2]` / `[3]` | 18.641 / 11.508 |
| TableCheck 事实读取 3 家、再 2 家 | `[4]` / `[5]` | 51.325 / 26.172 |
| Google 已保存发现读交接，11 候选 | `[6]` | 0.000（复用早先 regionReferenceRead，不表示 Google 请求零耗时） |
| Google 三候选跨来源查位 | `[7]` | **143.773** |
| Google 三候选事实读取 | `[8]` | **72.653** |

单次最长已完成动作是 `[7]` 的跨来源查位（约总墙钟 28.7%），出现 TableCheck 身份不确定、Tabelog 身份/请求选择失败；有时段并不等于支持 fugu HARD。`[8]` 的三个官网事实读取保留 UNKNOWN / `WEBSITE_FACT_READ_FAILED`，没有补造 fugu 支持。

**超时时实际还有第 10 次根动作在执行。** 决策 JSONL 第 **37** 行于 **02:32:42.140 CET** 开始，3.392 秒后选择继续 CHECK_AVAILABILITY：VMG Café Kudan Kaikan Terrace、Egushi、Wa Dining 30。从模型完成到外层结束又花 **38.513 秒**。第 38 行 WAIT、第 39 行 REQUEST_HUMAN_HELP；最后 trace **1474** 是 Egushi 详情的 snapshot **113**，**1477–1478** 又发起该详情导航，尚未返回即因整单期限中断。这个未完成动作没有持久化 trajectory，所以不能仅看最后一个已完成的 CANDIDATE_FACTS 就说超时发生在事实读取。最终 `phase=SEARCHING`，没有有界无结果输出；原超时失败评价保留。

### 5.2 与 F3“空检索后通用列表”的关系

Tabelog 决策第 **6 / 7 / 8** 行分别选择 `fugu`、`fugu cuisine`、`torafugu`。对应诊断 DOM：

| query | snapshot / trace SNAPSHOT | 原始可见结论 |
| --- | --- | --- |
| fugu | **6 / 88** | No restaurants match "Jinbocho & Suidobashi fugu". |
| fugu cuisine | **7 / 100** | No restaurants match "Jinbocho & Suidobashi fugu cuisine". |
| torafugu | **8 / 112** | No restaurants match "Jinbocho & Suidobashi torafugu". |

路径均在 `slot-5-recording.tar.gz` 的 `hybrid-1792891503539/diagnostic/snapshot-0006.html` 等相应编号。trace URL 会删除 query，脚本逐 snapshot 校验 origin/path；query 及空结果由诊断 DOM、决策上下文和 retrieval.history 交叉确认。

三次规划都被接纳、`parsedCount=0`，`rewrites=2 / retrievalPages=3 / regionPages=3 / detailAttempts=0`；第一项空检索之后没有无 sw 的列表观察。因此**本槽没有执行该 Tabelog 自动通用列表分支**。初始无关键词的地区页在空检索之前，不能算空检索后的 fallback；查位阶段按店名找详情也不能混为该发现分支。

TableCheck snapshot **9 / trace 132** 为 `search_text=fugu` 的入口；其第一次已解析 20 家、取详情 5 家，`rewrites=0 / retrievalPages=1`，没有“空结果→通用列表”的转换。广泛候选与 fugu 查询的关系仍可供 F3 审计，现有记录不证明该分支导致本槽超时。本批不修改 F3 行为，也不据此承诺去掉该分支能避免超时。

### 5.3 与 F5 的关系

Tabelog 第一次入口是 Jinbocho & Suidobashi（`A1310/A131003`），`provisional=false / samples=[] / replacement` 缺省。最初保存的 Google `regionReferenceRead` 已有 **Egushi** 的同源店铺 URL `https://tabelog.com/tokyo/A1310/A131003/13154986/`，支持既有同源指针完成条件。39 条模型记录中 **regionCorrection 输入 0、SELECT_REGION_ENTRANCE 输出 0**；地区 3 页、来源耗时 **46.358 秒**，不是 90 秒纠正重试耗尽。

这些记录证明临时取样/换入口分支在本槽没有执行，未发现该 F5 分支造成额外耗时的证据。离线材料不能证明移除 F5 后该槽一定不超时，也不能承诺修复 F5c 会让例 03 变快。可观察的主要耗时来自后续查位/事实读取与尚未完成的下一批查位；例 03 仍按有界、如实无匹配、不超时、不谎称 fugu HARD 的原批准标准。

## 6 交付验证与停止

- `git diff --check`：PASS。
- 全部保护目录/Pack 字节不变；历史冻结包/评价/预算无差异，见 scope audit。
- 五门禁在干净提交 **a9d8aeba** 上顺序执行，03:27:22–03:29:20 CET 全部 PASS；每项前后 `git status --porcelain` 均为空。见 [原始门禁收据](gates/receipt.json)，原始日志以无损 gzip 保存并核对收据 SHA。

| 命令 | 结果 |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run arch:check` | PASS |
| `npm test` | **1048/1048 PASS** |
| `npm run build` | PASS |
| `npm run test:browser:fixture` | **154/154 PASS** |

门禁后只同步报告、历史索引和验证证据，产品/fixture/Prompt/Schema/评测器与该门禁提交字节相同；最终交付工作树检查见 [delivery-audit.json](delivery-audit.json)。本批没有重跑历史 Live 评价或运行新的 Live，局部和全量离线门禁不替代真实网站验收。

- 当前分支尚未合并 main；本批 Live、网络见证复查、原样回放、环境重跑均 NOT_RUN。
- 后续停止：交付离线修复后停下。新 Live 须等对话 A 健康检查与录制器修复合入 main、重放到新 main，再由用户批准额度与运行。
