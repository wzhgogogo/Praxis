# 运行诊断报告：停止点 1 盘点与设计

- 状态：`draft / not integrated`；仅盘点/设计，尚未实现、生成运行报告或执行校准。
- 指令：2026-11-02 修订版；报告时刻统一展示为维也纳 CET（UTC+1），原始输入的时间字符串不改写。
- 分支：`codex/chore-run-diagnosis-report`；最新 main 基线 `efeab25483cf58011b7505c32d6da857e41c2533`，包含已合入组装门禁 `1d65b8e8` 和 C 的 B1 条款/20 秒保留修复。
- 切片承诺：让复核者能够逐项确认字段是否存在、判断属于谁、哪些指标能计算以及缺什么，然后才实施。服务 Eval Skill 的“先修什么”和等待时间度量，不产生新的签收判断。
- 本轮真实模型/Google/网站/Live/见证请求、历史运行重执行均为 0；仅 Git 同步与推送使用网络，不读取或暂存 `.env`。不读取人工标签内容，不碰 A 未合入分支。

交付索引：[来源字段核对](source-survey.json)、[报告 JSON 草案](report-shape.draft.json)、[校准输入路径/SHA](calibration-inputs.draft.json)、[人工对照出处](calibration-reference.md)、[本轮静态检查](static-checks.json)。

## 1. 必须保留的边界

现有 `outcome`、完整 `severity`（包括 S0_DECLARATION/S0_BOUNDARY）、`execution`、`conditionStates` 和 `witnessFunnel` 原样引用；报告不重新判定合格、S0–S4、身份、HARD、库存、B1 或 G1。系统状态、原因码和模型自述只放 observations，不能作为通过或偏离的独立 oracle。

新增追问/排序检查是体验观察，结果放 `experience`，`gateEffect=NONE`；不写回既有 findings/severity/outcome，不自行定等待时间门槛。没有排序要求时整体 NOT_APPLICABLE，不做推荐质量评分。Gold 或证据缺失是未评，不填 0、未发现错误或正常无结果。

## 2. 实际数据来源：逐环节

下表的 R 指原始 result；E 指绑定同一原始 JSON SHA 的既有 evaluation；V 指同次持久应用的已保存 CaseView；T 指带 SHA 的 trace/decisions。到达证据与判定证据分栏；所有自动结论必须保留原文件 SHA、JSON Pointer/trace sequence/event 或 activity ID。

| 环节 | 到达/原始观察字段 | 现有判定/Gold来源 | 当前能证明什么、缺什么 |
| --- | --- | --- | --- |
| 理解请求 | R.semantic；events[].event.type=SEMANTIC_PROPOSAL_COMPILED 的 patch；finalSnapshot.domainState.intentDraft | E.findings[AUTHORITATIVE_CONDITIONS]；冻结 semantic Gold、goldCorrection/criterionCorrespondence | 可直接引用综合条件判定；不要把综合失败自动拆成所有字段都失败。历史 rev1 必须按已批准修正记录绑定 rev2。 |
| 地点 | R.resolvedEvalLocation、domain.searchContinuation.locationContext、DISCOVERY evidence 的 area/coordinates；EVALUATION_LOCATION_BOUND 事件 | 已有 findings 的明确地点结论/证据指针；见证圆心/范围 | 原坐标可展示；若 E 没有独立地点结论，仅到达且未评，不能自行调用生产距离/资格函数补判。 |
| 发现 | R.candidates、SEARCH_COMPLETED、trajectories[].observation.candidateIds、原始 listing/trace | E.witnessFunnel[].discovery，冻结见证名单 | FOUND/NOT_FOUND 可原样显示为见证覆盖；只有适用 Gold 明确要求的覆盖缺口才是该范围的偏离，不宣称未发现某见证就整体任务失败。 |
| 身份 | readEvidence 的 ENTITY_MATCH、实际读取记录及 source/candidate/request 范围 | E.witnessFunnel[].identity 和 REQUIRED_EVIDENCE 的相应独立结论 | OBSERVED/NOT_READ 是记录状态，不等于独立匹配通过/失败。粗粒度 GROUNDING 无法定位身份时保持未评。 |
| 事实/HARD | factChecks、readEvidence、已引用 source documents | E.conditionStates[].criteria（HARD）、conditionEvidenceFindings、REQUIRED_EVIDENCE、witnessFunnel[].facts | 直接使用 MET/NOT_MET/NOT_CHECKED；不能用生产 verifiedHardCriteria 或宽泛的 SATISFIED 给每个子环节补分。 |
| 查位 | availabilityChecks、availability、AVAILABILITY_CHECKED、trace 控件/响应 | E.witnessFunnel[].availability；已有 REQUIRED_EVIDENCE/FINAL_CLAIM 独立结论 | UNKNOWN 是 UNKNOWN，不是无位或失败判定；8 家 UNKNOWN 可计观察数量，不能仅据原因码确认能力卡点。 |
| 展示 | presentedResults、RESULTS_PRESENTED、真实 PRESENT_RESULTS trajectory | E.FINAL_CLAIM、outcome、execution | 可区分已展示与合格交付；producedQualifiedResult 只引用 E，不读生产 eligible。服务端已投影不等于用户屏幕真的渲染。 |
| 选店 | R.domain.selectedCandidateId；V.restaurant.selectedCandidateId；对应事件及用户发言 | A 的既有逐环节独立输出（若提供且 SHA/turn/run 适用） | 状态可读；Agent 自行 SELECT_CANDIDATE 不自动等于用户选择。没有独立结论时未评。 |
| B1 交接 | V.restaurant.bookingHandoffs[] 的 candidateId/offerId/provider/url/checkedAt；prepared[] 原始观察 | A 的逐环节结论；现有已保存独立核验仅按其实际覆盖范围引用 | exportReadArtifact 不含 bookingHandoffs，必须同时提供同版本 V；缺投影是证据缺失，空数组不自动失败。 |
| 卡片条款 | V.bookingHandoffs[].terms[].citations；sourcePages[]；requests[] 的问答响应 | A 独立条款环节结论或明确绑定的已有独立核验 | 当前主线已有正常与错误绑定/预算省略原产物。条款本可因预算/取消等省略；不能把空条款普遍判错。 |
| 追问取页 | PAGE_QUESTION_REQUESTED；requests[].request[purpose=restaurant_page_question].messages 用户 JSON 的 sourceDocuments；sourcePages[].page/observedAt | A 取页环节结论，保留原页/identity/run 绑定 | 请求到达可确认；NO_BOUND_PAGE 是系统观察，不能仅凭该字符串新判偏离。缺独立结论标未评。 |
| 追问作答 | PAGE_QUESTION_COMPLETED；domain.pageQuestion.result；V.pageQuestion.result.citations | A 作答/引用环节结论 | ANSWERED 不自动等于正确作答；没有 oracle 就只展示原文与引用并未评。 |
| 结束 | R.loop、status、interruption、noVerifiedResult、外层 finish/interruption | E.COMPLETION_OUTCOME、outcome.capabilityDenominator | 保留取消/预算/环境/编排中断；原因码不替代支持记录。缺 result 中断仍保留已评边界与其它未评项。 |

接口依据：`diagnostic-evaluator.ts:62`、`diagnostic-evaluator-witness.ts:24`、`diagnostic-evaluator-progress.ts:7`、`diagnostic-evaluator-preferences.ts`、`persistent-restaurant-agent.ts:800`、`g6-development-preflight.ts:171`。完整来源文件 SHA 随盘点清单保存，不复制生产判断代码。

### 多回合字段的真实边界

已合 main 的 `g6-development-preflight.ts` 保存 initial/after 视图和 initialArtifact/afterArtifact；CaseView 有 conversation.messages[].{id,role,content,createdAt}、activities[].{activityId,type,occurredAt,sourceRef}。执行 artifact 有 events、trajectories、finalSnapshot，但没有 conversation/messages，也没有投影 bookingHandoffs。

C 保存的组合观察含 view、execution、sourcePages、requests、sourceCalls、prepared，可同时看到交接、条款和页面问答。拼接必须核对 caseId、runId、taskVersion/快照版本、请求轮次，不能仅凭文件同目录配对。`materializedCase.semantic` 在 WEB_READ 是由运行事件汇总的输入，不能自行当作独立语义 Gold。

业务时钟在这些 fixture 中冻结为 `2026-11-01T06:00:00.000Z`：多条消息和事件时间相同，不能据此报告“回复耗时 0”。C 新保存的 timeline 有实际 elapsedMs、ASSISTANT_APPENDED/RESULTS_VISIBLE，可量测其明确覆盖的局部间隔；不含 USER_SUBMITTED 的不能虚构从用户发言开始的整轮时间。

## 3. 体验指标数据表

| 指标 | 输入/计算边界 | 缺失处理 |
| --- | --- | --- |
| 请求起点 | 若有独立消息接收时间用该值；旧单轮仅有 R.startedAt 或 materialization.resolvedReferenceTime | 明标 RUN_START_PROXY，不称为用户点击/发送时刻；没有起点未评。 |
| 首个合格结果的证据观察齐全 | E 已确认的展示候选范围 + presentedResults.evidenceIds 中属于该候选的引用 + readEvidence[].observedAt；每候选取所需引用最大时刻，再取首家 | 这是“该次最终引用的来源观察时间”，不是生产 eligibility 重算，也不是全局最早可行候选。只有综合失败且无法逐候选确认时未评。缺任一必要引用/时间、已 supersede/错误 request 或未独立支持时不算。 |
| 权威接纳与展示时间 | 对应证据实际写入事件 occurredAt；RESULTS_PRESENTED 与 presentedResults.presentedAt 交叉列 | observation、接纳、服务端展示三个时刻分别保存；无 UI 渲染记录，不宣称实际屏幕可见。 |
| 证据→展示延迟 | 同一候选、同轮、同时间域的展示时刻减证据齐全时刻 | 不减裁负数；字段冲突/逆序未评。当前原始时间差只是指标，不触发 S3。 |
| 每个后续回合 | messages USER→对应 ASSISTANT，结合 requestId/事件/轮次；有真实 wall/monotonic 时间才算 | 只有顺序/业务时间时只列顺序，缺轮次关联不拿最近一条消息硬配。 |
| 耗时分解 | 优先 R.stageTimings；旧产物可由已有 restaurantRunStageTimings 与固定 T 做离线度量 | 现有算法是有缺口的 wall-time partition，不是严格因果关键路径；保留 gaps，不能从 latency 总数补造时间轴。 |
| 重复加载占比 | 直接使用 E.investigationMetrics.urls 的计数；有完整 URL 与成对 navigate/openLink 起止时，取重复加载时间区间并集/有效总时长 | 只有计数无起止时：计数可报、时长及比例未评。脱敏路径或缺 query 不冒充完整 URL 相同。 |
| 外部等待/系统耗时 | T 中带边界的页面/Google I/O、模型调用、操作后等待；同一时间域并集并保留嵌套关系 | navigate 总耗时是来源 I/O 操作代理，含浏览器内部处理，不等于纯网络等待。Google 只有计数无时间时未评；无法区分的列 MIXED/UNATTRIBUTED，不把剩余总时长全称为系统耗时。 |
| 多余追问 | 完整用户历史/冻结 semantic Gold 已提供字段，实际 ASK_USER 的结构化 relatedFields/问题文本与同一字段明确关联 | 不因模型说“缺日期”就认为缺日期；无问题字段映射、只有自由文本歧义、Gold 不定义或之后已撤销时未评。每次实际提问一条，可关联多个 Gold 字段但不重复计次。 |
| 缺失追问 | Gold 明确本轮必要且缺失的字段 + 完整前后状态/patch + 未问却新增值 + 没有已记录合法来源 | Gold 没定义“必要”或原始用户/上下文/来源不完整时未评。推荐请求不强加日期/人数；referenceTime 的合法解析和跨轮继承不能误报为假定。 |
| 硬条件/软偏好 | 原样 E.conditionStates、conditionStateComparisons、conditionEvidenceFindings；softPreferenceObservations 为 path/SHA 指针 | 后者不是整份观察列表。可列出已被 E 采纳的 EXTERNAL_ONLY/PRODUCT_OBSERVED 及原引用，不另读标注来改成已满足。 |
| 明确排序 | Gold 明确目标，或原话确切“最近/最便宜/最早有位”等；不是“near/nearby”。只比较既有、同请求/餐段/币种/时间及来源可核对的值 | 无排序要求整项 NOT_APPLICABLE；无法识别原话、缺比较值/来源、比较范围或资格不清时 NOT_EVALUATED。不得用生产 eligible 排除落后的候选。 |

排序只核对用户明确目标，在已观察且可比较的集合内检查：最值并列都可，不额外评价未观察到的餐厅或推荐主观质量。若任一可能更优候选没有必要比较证据，不能只在剩下几家中判通过。nearest/earliest 等具体受控正反例使用独立来源样本，体验核对不会改变原结果类型。

## 4. 报告结构与定位规则草案

独立 JSON 草案见 [report-shape.draft.json](report-shape.draft.json)。每个环节同时存 `reach` 和 `assessment`：REACHED 不是 PASSED；没有到达证据也不直接断言 NOT_REACHED，须有完整轨迹范围才能断言。UI 的“到达/未到达/通过/偏离/未评”由这两个已有观察/结论维度显示。

判定优先级按范围处理，不用字符串原因码猜测：

1. 保留 E 的完整结论及 artifact/evaluation SHA 绑定；缺字段或不匹配单独报告数据缺口，不重评。
2. 在候选/见证/轮次范围内使用已有的明确环节判断。综合 GROUNDING 未细分时，记录涉及身份/事实/查位的未定位判断，不硬选某一环。
3. 见证漏斗逐行原样展示；NOT_FOUND 是已观察的见证覆盖状态。blocker 永远保留 HYPOTHESIS，不自动升级为事实错误或因果根因。
4. 确认偏离的定位与推测卡点分别存放。链上第一个受支持的偏离为首点；若更早环节未评，标 `earliestKnownOnly=true`，不能宣称已证明之前全对。找不到偏离且存在必要未评项，不输出“无卡点”，而输出“首点未评”。
5. 同一条原始 finding 用稳定 evidence/dimension/scope 标识去重；下游只有已有 blockedBy 因果关系才记 BLOCKED_BY_UPSTREAM。其它未执行阶段保留 NOT_REACHED/NOT_EVALUATED，不能凭链顺序说它们都被同一根因阻断。secondary 独立问题另列，不在“首点”分母重复计数。
6. certainty 区分“偏离被确认”和“原因的因果确认”。仅 E 的 CONFIRMED 或可适用的独立 Gold 支持，才标 CONFIRMED；LIKELY/UNKNOWN 只能保留为 HYPOTHESIS 或未评，不通过当前规则包装成确认。

### 跨运行

聚合须带输入 cohort/manifest、Gold/评测器版本和 attempt ID。计划、启动、结束、保存 result、中断、可评分分别计数；缺计划 manifest 时 planned 未评，不能把收到几份报告当计划数。中断不进能力分母；capabilityDenominator 与 userGoalComplete 从 E 原样继承。

“首点×严重程度”每格附运行 ID，每 run 只选一个首点；严重程度保留原向量，汇总主列取已评 PRESENT 中最严重一级，否则单列“无已确认严重程度/未评”，不默认 S4，也不把未评 S0 当 0。下游阻断表另列。已合格交付但存在过程覆盖偏离的运行仍显示原 QUALIFIED_DELIVERY，不叫能力交付失败。

同例重复运行按 attempt 横排，版本/Gold/模式变化分层；P1-F 五例是 22 条 E1 集合的子集，不能加成 27。中位数/最大值只对各指标的已测子集计算，同时列已测/未评/不适用个数；未知追问次数不填 0，排序 pass/deviated/not-evaluated/not-applicable 分列，不设置门槛。

## 5. 校准材料、已知分歧和未评

[calibration-inputs.draft.json](calibration-inputs.draft.json)包含仓库相对路径、压缩 SHA、原 JSON SHA、既有 evaluation SHA/版本及多回合正反产物清单；[calibration-reference.md](calibration-reference.md)保存本轮用户给出的人工首点和时间对照，仅比对步骤读取。没有复制或改写历史 result。

| 主校准运行 | 原始 result（inputs 下） | 现有带见证上下文的 E1 输出 | 人工首点来源 |
| --- | --- | --- | --- |
| p1fA-kf-h001-a1 | p1fA-kf-h001-a1.result.json.gz | calibration-20261016-rubric25-review；evaluator@29 | 本轮指令 §4.1：无卡点 |
| p1fA-kf-h002-a1 | p1fA-kf-h002-a1.result.json.gz | 同上，3 家见证 NOT_FOUND | 同节：发现 |
| p1fA-kf-h004-a1 | p1fA-kf-h004-a1.result.json.gz | 同上，条件保真 NOT_SATISFIED，R1 后仍 QUALIFIED_DELIVERY | 同节：语义 |
| p1fA-kagurazaka-a1 | p1fA-kagurazaka-a1.result.json.gz | 同上，3 家见证 NOT_FOUND，blocker=DISCOVERY | 同节：查位读取 |
| p1fA-nakameguro-a1 | p1fA-nakameguro-a1.result.json.gz | 同上，见证 NOT_FOUND，1 家非见证已交付 | 同节：发现，其次查位 |

输入统一前缀 `.eval-artifacts/calibration-phase1-20261015/inputs/`。E1 主输出前缀 `.eval-artifacts/e1-evaluator-20261016/calibration-20261016-rubric25-review/evaluations/`。完整 SHA 在 manifest，不采用后来那组缺见证上下文的 `offline-diagnostics-final` 来冒充相同输入评价。main 的 evaluator@36 与历史@29/rubric@25必须分层；本轮不重新调用任何 evaluator。

### 时间字段可用性核对（不是实现或校准通过）

仅检查最终已引用来源观察的时间与服务端展示字段，可读出下列数值；未来仍须用独立评价限定可称“合格”的候选和必要引用范围。

| 用例 | 首家最终引用观察齐全（相对 startedAt 秒） | presentedAt 秒 | 用户提供秒数 | 初步字段差异 |
| --- | ---: | ---: | --- | --- |
| h001 | 99.285 | 127.987 | 99→128 | 均≤2秒；批次 AVAILABILITY_CHECKED 实际接纳到126.681，不能把接纳与观察混为同一时刻 |
| h002 | 122.051 | 148.895 | 122→149 | 均≤2秒 |
| h004 | 292.402 | 304.149 | 292→304 | 均≤2秒；所选历史 E 保留 R1 的合格结果与语义过程偏离 |
| Nakameguro | 208.105 | 247.079 | 208→247 | 均≤2秒 |

不能用这张静态字段核对表宣称自动诊断或时间校准已通过。旧 artifact 没有真实用户发送时间、UI 可见确认；结果时长、外层 wallMs 与 startedAt/finishedAt 也不是同一边界。

### 当前必须交复核的缺口

1. **首点口径有实际分歧。** 神乐坂有42候选、8条UNKNOWN查位；既有见证漏斗却先报3家未发现。人工期待“查位读取”无法由“取链上最早漏斗卡点”直接得到。h001已有合格交付，但旧漏斗的两个见证 blocker=FACTS/HYPOTHESIS；不能机械选它替代“无卡点”。h002/Nakameguro 见证 NOT_FOUND 但 blocker=NOT_EVALUATED，因为独立库存 Gold 不全。保留原字段与分歧，复核需确认“见证覆盖偏离、已确认偏离、推测性能瓶颈”在首点表的选择规则；不能改结果判定或按 ID 特判。
2. **多回合存在观察，缺统一逐环节独立结论。** 主线 E 只有单轮六维 findings。C 的独立核验覆盖原文与绑定等特定项目，但不是可普遍推广的 A 逐环节判定接口。取到现有明确结论才用；拿不到标未评。仅以空交接/空条款/NO_BOUND_PAGE 自行实现失败规则，会违反本任务边界。
3. **因此多回合红灯不是当前已满足。** 可用已保存真实正反产物及测试内生成产物证明报告到达对应节点；“红灯首点必须落在B1/条款/取页”还须有该 scope 的实际独立判定输入。不得手填评分、把 failed assertion 的文案当 grader，或用测试专用手写 pass/fail 宣称整链验证。待 A 已合入接口可用，或复核指定现有可复用独立输出后再关闭。
4. **追问 Gold 和每轮时间记录不齐。** 大多单轮 result 没有原始消息、实际 ASK_USER 内容、完整来源字段；WEB_READ 导出也不带 conversation。只有 finalSnapshot 无法证明没有问或没有用户给过。现有多回合 fixture 冻钟不能证明用户等待。无需本轮改产品字段；先明确未评范围。如必须新增 evaluator 输出字段，按用户要求先停下报告。
5. **现有门禁覆盖范围有差异。** ASSEMBLY_CAPABILITY_CORES 禁入覆盖整个 eval；productionJudgment 禁入却只匹配 `eval/restaurant/agent-loop/diagnostic-evaluator*.ts`，不自动覆盖新 diagnosis 目录。停止点2建议只扩展既有规则的 importer 范围并做受控反例，需复核确认，不新建框架；新诊断代码本身无论如何不导入生产判断函数。
6. **默认 glob 缺新目录。** 停止点2需要仅给原 npm test 追加 `src/eval/restaurant/diagnosis/*.test.ts`；本轮不改 package。历史输入/标签只在独立 compare 入口读取，诊断模块的 imports 和输入契约不接受人工标签。

上述是设计盘点发现，不是要求现在扩大产品修复。停止点1交付完整，但不能因此宣称主要校准、多回合红灯或自动写出已完成。

## 6. 停止点 2 的最小实现方案（尚未执行）

新代码仅放 `src/eval/restaurant/diagnosis/`：一个纯报告构建/Markdown 渲染模块、一个只读文件输出/离线批次入口、对应行为测试；确有第二使用者再拆公共 helper。仅使用 Node I/O、existing timing 度量及 type-only 的 evaluation contract，不导入能力核心/生产判定，不创建第二评测器。

自动接线只在 `evaluateArtifactAfterFinish` 成功保存评价之后加调用，原 evaluate/判定不动。该入口覆盖 hybrid 成功/错误退出、current-development 成功/错误退出、native finalization 已有调用。离线补评 CLI 有直接调用 evaluateArtifactFile 的路径，不能冒称都经该钩子；新离线诊断入口只读取已保存评价，不重跑运行或评价。A G6 Runner 和 A 独立评价文件完全不改。

report 绑定 result SHA、evaluation SHA、上下文与 Gold SHA。自动钩子拿不到冻结 Gold、规划清单、CaseView 或 A 输出时照样产未评报告，不能从最新 repo Gold 反推历史。批量离线入口可显式提供冻结上下文 manifest；不得任意扫描目录挑“最新评价”或读取机器上的旧绝对路径。

输出采用与已有 evaluation 对应的不可覆盖 JSON+Markdown sidecar；失败只写独立 diagnosis failure，不覆盖 result/evaluation，不落入原 catch 伪装为 evaluator 失败。评价失败时可输出结论未评的最小记录，缺评价绝不补判。自动产出步骤不调用 A/模型/网站。

后续验证以 Test Skill 为唯一矩阵：保持 E 结果/severity 深相等；旧正反产物/真实测试产物→读取→报告→聚合；按复核确认的标准做五例逐次校准、明确分歧和未评；体验四项正反对照，外加无排序 NOT_APPLICABLE；默认测试接线、架构禁入受控对照；冻结后五门禁各项前后净树。当前阶段只检查文档、JSON、路径、SHA、引用和改动范围，不运行五门禁。

## 7. 当前交付与停止

本批只新增设计/来源清单/结构草案并同步状态和追加历史。原始材料不复制、不改写，产品/Prompt/Schema/State/Gold/variants/witness/Runner/判定/Skill 均不修改。新目录尚未建立实现。推送本分支后交复核，停止点2需明确复核确认后再开始；不合 main，不自行消除上述分歧或补新的模型/Live。

本轮检查仅为 JSON 语法、全部输入路径/SHA（含 gzip 解压后 SHA）、既有 evaluation→artifact 绑定、Markdown 链接、diff/改动范围。计划 22 条中的 20 份 result 与 2 份中断包均已验证原文件哈希；标签文件未读取。没有把静态盘点结果包装成自动报告、校准一致率或五门禁通过。
