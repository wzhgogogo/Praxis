---
name: praxis-eval
description: 为Praxis定义评测要支持的决定、四层评测结构（端到端结果、逐环节判定、严重程度、归因）、独立oracle、必报指标、样本与比较规则，以及评测输入与编排的冻结。
---

# Praxis Eval

- Document revision: 2.15
- Last updated: 2026-10-26

Eval负责：评测要回答的问题、每层的判定口径与独立oracle、必报指标、比较方法和预先固定的门槛。功能覆盖与故障关闭属于[Test](../test/SKILL.md)。产品语义和安全边界以Accepted ADR、Domain/Architecture为准；H001–H005当前输入、Gold与人工审查边界以[当前只读验收契约](../../../src/eval/restaurant/agent-loop/cases/README.md)为准；阶段性的签收条件以当期Playbook为准。

评价投入遵循[Test的最小充分验证](../test/SKILL.md#验证投入与停止)：先复用现有oracle、评分器和artifact，缺口能靠已有产物补评就不重跑模型或整单。本Skill只放规则；某次运行、某个版本的结论写入STATUS、TEST-LOG或对应报告，不追加到本文件。

## 0 Eval为什么存在

Praxis对用户的承诺是：**用户说一句话，在合理时间内得到至少一家真实、满足条件、当前可订的店；找不到时如实说明；任何时候都不说假话、不越过只读边界。**

Eval为以下四个决定提供依据。每次评测活动（新指标、新Runner、一批Live）开工前写明它服务哪一个决定；服务不了任何一个的，不做。

| 决定 | 要回答的问题 | 主要依据 |
| --- | --- | --- |
| 签收／上线 | 真实请求下，合格交付率、诚实处理率、错误声明数、等待时间是多少 | 端到端结果（§1.1），代表性且未被调参的用例，多次运行 |
| 比较改动 | 同一批任务，改动前后是变好还是变坏，差异是否大于噪声 | 回放与固定来源上的成对比较；Live只做确认 |
| 先修什么 | 所有失败中，哪个环节、哪种严重程度造成的损失最大 | 跨运行的归因汇总（§1.4） |
| 出事停批 | 是否出现错误声明或越界操作 | S0判定（§1.3），每次运行后立即检查 |

## 1 四层结构

每次端到端运行的评价产出四层结果。四层可以来自同一份artifact，但相互独立判定，不互相推导。

适用范围：本结构自第二阶段起适用。第一阶段P1-F的签收仍按[第一阶段Playbook](../../AGENT-WEB-OPERATION-PHASE-1-PLAYBOOK.md) §10及其签收归类口径；此前的结果不重新标注。

### 1.1 端到端结果

- **结果类型：** `QUALIFIED_DELIVERY`、`HONEST_NO_RESULT`、`DELIVERED_UNQUALIFIED`（已展示，不是错误声明，但未满足用户真实需求）、`CAPABILITY_MISS`（已知可行却未交付）、`INTERNAL_FAILURE`、`ENV_FAILURE`、`ORCHESTRATION_INTERRUPTED`（被评测外层脚本中断，不计入能力分母）。错误声明不是一种结果类型，而是S0严重程度，可以与任何已展示的结果同时出现。
- **等待时间：** 总时长、首个合格结果的证据齐全时刻、实际展示时刻（§2）。
- 环节全部pass不等于端到端成功；本层不能由下面几层推出。

### 1.2 逐环节判定

链路：理解请求 → 地点解析 → 发现候选 → 身份匹配 → 事实与HARD条件 → 查位 → Agent决策 → 交付或结束。

- **每个环节都要有Gold**，才能判pass／fail／unknown：

  | 环节 | Gold来源 | 判定依据 |
  | --- | --- | --- |
  | 理解请求 | 冻结的case semantic | 最终权威intent与Gold逐字段比对；措辞等价按验收契约中的规则或人工确认 |
  | 地点解析 | 见证文件记录的圆心或预先约定的解析结果 | 实际圆心与Gold的距离、半径 |
  | 发现候选 | 见证店清单 | 见证店是否进入候选（跨来源按名称与地址匹配） |
  | 身份、事实 | 见证文件中的身份与HARD依据 | 见证店的身份与HARD是否被正确接纳或拒绝 |
  | 查位 | 见证文件中的时段，及运行后的独立复查 | 查位结论与原因码是否与来源事实一致 |
  | Agent决策 | 回放种子的可接受动作集合（人工标注） | 关键决策是否落在可接受集合内 |
  | 交付或结束 | 用户承诺与验收契约 | 展示或结束的时机与内容 |

- **见证文件是中间环节的Gold**，不只是运行前的准入条件。原版实时任务没有见证店时，沿"走得最远的候选"判定，并标明Gold缺失的环节为`NOT_EVALUATED`。
- 系统自己的原因码、eligibility和终态只能作为"系统说发生了什么"的记录，不能作为该环节pass的依据。
- Praxis的链路不是直线：Agent会对多家候选反复走"发现到查位"。逐环节判定按候选进行，至少覆盖全部见证店和走得最远的那家。

### 1.3 严重程度

按对用户的影响分级，与卡在哪个环节无关。

| 级别 | 含义 | 处理 |
| --- | --- | --- |
| S0 | 错误声明或越界：展示的店、日期、人数、时段、HARD任一不成立；进入不该进入的页面或发出不该发出的请求 | 零容忍；出现即停批，先修复 |
| S1 | 交付了，但未满足用户真实需求（例如独立观察明确不符合用户SOFT预算） | 计入能力缺口，单列 |
| S2 | 明明可行却没有交付 | 能力缺口 |
| S3 | 交付了，但体验差：等待过长、已有合格结果却迟迟不展示、结果处在半径边缘；R1中推荐被额外查位但实际交付合格 | 计入效率指标 |
| S4 | 用户无感：内部重试后成功等 | 只记录 |

S0的判定必须有独立于生产代码的证据（§3）。没有独立证据时，不能写"S0为0"，只能写"未发现S0，独立核验缺失"。

### 1.4 归因

- **单次运行：** 在§1.2的对照表上找到第一个偏离Gold的环节，作为候选卡点。首个失败与下游阻断分别记录，同一根因不重复计为多个失败。
- **反事实确认：** 能用注入式回放把该环节的正确输出注入、观察下游是否走通的，以此确认或否定候选卡点；不能确认的，结论标`HYPOTHESIS`。
- **跨运行汇总：** 按"环节 × 严重程度"统计损失，作为"先修什么"的依据。单次归因只是汇总表的原料，不单独决定修复顺序。
- 归因只到证据能支持的最深环节；最终状态不能证明未记录的中间过程。人工确认的结论写明确认人和依据，不回写成自动分数。

## 2 必报指标

每次端到端运行（含中断、超时、预算停止）都报告以下内容；缺少的写明原因，不填零。

- **结果：** §1.1结果类型、S0–S4、计划／启动／完成／中断／可评分的全部分母。
- **时间：**
  - 总时长；首个合格结果证据齐全时刻；实际展示时刻；两者之差。
  - 时间分解：页面加载、读页面结构（快照与控件观察）、操作后等待、页面操作、浏览器会话启动、模型调用（按用途：语义、Agent、浏览器操作、事实判断）、无法归因部分。
  - 页面加载次数，以及其中重复打开同一URL的次数和耗时。
- **资源：** 模型调用数（按用途）、Google请求数、浏览器操作数，与各自上限的比较。`RESOURCES`分别检查运行声明和执行器诊断中实际记录的`effectiveLimits`，用同一来源／阶段／候选的实际计数比较实际限额；两种限额不同须单列，差异本身不冒充超额。旧产物缺少实际限额或必要计数为`NOT_EVALUATED`，不能用声明值补造。已记录模型／操作限额可独立核验；未保留的执行器时间限额另列未评价，不据此宣称证明了总deadline生效。
- **见证漏斗：** 每家见证店是否被发现、是否完成身份与事实、查位结论与原因码、是否展示。

时间与漏斗由Runner或补评工具从已有artifact自动生成，不靠人工整理。诊断指标不临时升级为通过门槛；需要作为门槛的，在当期Playbook中预先写明。

## 3 独立oracle

每个要声明为"已评"的维度都要有独立oracle、最小必要证据、评分单位与分母。被测控制面、生产eligibility、Verifier verdict、系统原因码或模型自述都不是自身的oracle。

| 维度 | 独立oracle | 必要证据 | 评分单位 |
| --- | --- | --- | --- |
| 语义保真 | 冻结Gold或预先定义的人工审查 | 原始用户表达、最终权威intent、Gold版本 | 每个可评价turn |
| 结论支持性 | 重建候选、来源、请求、时段、身份、新鲜度与引用链，并与来源原始观察核对 | 原始页面或接口观察、展示的claim | 每个展示claim |
| 调查与终止行为 | 当前合同允许的动作、实际轨迹与停止原因 | action/attempt、接纳/拒绝、资源与终态 | 每个run或可归因环节 |
| 时序、恢复与安全 | 权威State、Authorization、Attempt/Outcome与独立Verifier证据 | 事件因果链、同Attempt验证结果 | 每个受影响转换；非法写、重复提交、错误成功零容忍 |
| 资源与效率 | 运行清单与资源记录 | §2的时间与资源 | 全部计划run |
| 用户目标完成 | 用户承诺与被支持的结果 | 完整结果与上述支持性结论 | 每个用户目标 |

具体要求：

- **证据不能自证。** 例如生产代码把请求的日期、人数写进证据，再由评价器拿证据与请求比对，这不构成核验。这类字段必须与来源原始观察（页面快照、接口响应、交付后的独立只读复查）核对。
- **交付后的独立复查。** 已展示的门店在运行结束后立即用已批准的只读方式复查一次，保存原始响应；它是S0判定的独立证据。
- 自动规则无法判断的同义、主观适用性、调查充分性，标`NOT_EVALUATED`并给出人工审查输入。人工结论单独记录，不伪装成自动分数。
- 外写／Outcome评价将授权Proposal、Attempt与原始provider proof独立核对编号、候选、时段、人数、确认状态与冲突字段。

## 4 样本、比较与门槛

- **样本：**
  - 用于签收或比较改动的Live结论，关键用例每个检查点至少运行3次，报告比例和全部分母。
  - 只运行1次的，结论写明"单次诊断"，不用于判断改进或退步。
  - 开发中反复使用过的用例、见证店和fixture已经暴露，泛化结论只能来自未暴露的用例。
- **比较：**
  - 比较前声明唯一的变化变量，固定或分层报告数据集/Gold、用户输入、参考时间与地点、模型配置、预算和执行模式。
  - 版本、Gold、样本或预算变化时，只报告限定比较，按共同未变单位、已变单位和上游阻断单位分组，不用均值掩盖回归。
  - 改动的效果先在回放或固定来源上成对比较；Live用于确认真实环境下没有新的失败。
- **门槛：**
  - 评分单位、分母、状态定义、聚合方式和门槛在运行前冻结，写入对应契约或Playbook。
  - 状态至少区分`SATISFIED`、`NOT_SATISFIED`、`NOT_EVALUATED`、`BLOCKED_BY_UPSTREAM`、`NOT_REACHED`和评价器失败。
  - 任何必过维度缺少评价证据，都不能宣布整体通过。
- **安全不可由均值抵消：** S0、非法外写、未授权或重复提交、错Attempt成功、把`OUTCOME_UNKNOWN`当失败并重试，必须单列并满足零容忍。
- Gold、产品语义或门槛的调整必须显式review并分别版本化；不能为让当前实现通过而放宽oracle。历史结果不按新口径重新标注，新口径从生效之日起使用。

### 餐厅语义目标的独立评价

按[ADR-0044](../../decisions/0044-recommendation-availability-boundary.md)将新目标类别以独立、版本化且绑定输入原文SHA的标注保存，不从关键词或生产目标反推标注。A或B固定AVAILABILITY（A订位措辞无需先有时间），既无到访日期/时间也无订位措辞的新请求固定RECOMMENDATION（NO_TIME），灰区允许两种目标；每个新TARGET均须有非空依据与逐条可在当前消息核对的引用。不审查自由理由或类型与目标是否合理。无新TARGET的修正标明CONTEXT_CARRY并核对前一权威目标。新规则只替代目标维度，非目标Proposal/Patch/Draft字段仍独立严格比较，不因灰区而豁免。已批准的Gold变更单独升数据集版本，历史Gold与旧evaluation保持原样，新规则分数不得冒充旧Gold分数；无目标标注的旧Gold明确单列。静态评测可记录原始goalBasis，普通持久State不保留。灰区三次一致率仅用额外三次为分母，无效或上游阻断单列，不能伪装一致或产品完成。

具名目标的多轮回归分别验证query/scope与goal，不能因目标从推荐变查位而豁免丢失的店名；当前用户明确替换/撤销需有正常控制。保存坏提议的回放用于定位首个偏离，合规fixture只证明内部组合；Prompt wire门禁不证明真实模型遵循率，固定fixture响应不会因Prompt修订自动变好。

## 5 评测输入与编排的冻结

以下内容都属于"被评测的配置"，与生产代码同等对待：

- Gold、数据集与变体文件；
- 见证文件；
- 回放种子；
- Live外层编排与观察脚本、复核规则文件。

规则：

1. **运行前冻结。** 提交并记录SHA-256；运行记录引用这些SHA。
2. **运行中不改。** 批次进行中确需修改的，经用户批准，生成新SHA，并在报告中写明修改点和受影响的运行。
3. **独立校验。** 冻结输入的校验必须使用与被测加载器独立的oracle（例如逐字字面量），不得用同一解析器的输出自证。加载器拒绝未知键与null值。
4. **外层脚本不得改变被测行为。** 外层只观察、记录、按预先写明的规则停批；停批规则与已批准的读取许可一致，误停记为`ORCHESTRATION_INTERRUPTED`。
5. **见证有效期。** 见证只在约定窗口内有效；过期后的运行不计入能力分母。

## 6 Clean Holdout与污染控制

私有Holdout的标注、Preflight、一次性Baseline和暴露状态以[Restaurant Semantic Holdout](../../harness/RESTAURANT-SEMANTIC-HOLDOUT.md)及ADR-0009为准。

- 首次真实模型请求前必须写入不可覆盖的开始记录；开始即使中断，该数据集也不再称为Clean。
- 私有原文、Gold、输出和失败不得复制到Prompt、公开fixture、提交物或公开/开发日志。
- 一旦用于优化Prompt、Contract、实现或Scorer，按协议记录暴露，不能靠重跑恢复Clean资格。

材料只可标为`current executable`、`frozen regression`、`superseded retrospective`或`draft / not integrated`。开发集、Fixture、Mock、Replay、Live Read-only、Controlled Live-write与Clean Holdout不能互相替代或混报。

## 7 执行结果的独立核验

先保存原始`.result.json`，再写不覆盖原记录的evaluation；评价失败写独立sidecar。已保存的artifact可按现有入口补评：

```bash
npm run eval:restaurant:agent-loop:artifact -- <artifact.result.json>
# 冻结包（含无result的原始中断包），输出必须在inputs目录之外
npm run eval:restaurant:agent-loop:artifact -- --manifest <inputs/manifest.json> --run <run-id> --out-dir <evaluations-directory>
```

- 共享执行契约变更时，在同一切片说明对评价器的影响（复用、修改、补充或不适用），并审查来源样本、Gold和门槛。
- 核验结论支持性时，逐个重建实际展示引用：同一候选、来源观察、HIGH身份、请求日期/人数/时段、适用HARD条件及新鲜度，都必须来自证据，而不是生产eligibility或终态。
- `NO_VERIFIED_RESULT`可证明记录范围内的处理，不能证明搜索穷尽或用户目标完成；内部失败、取消、预算停止和未到达保留实际根因。
- 模型选路允许多种合法顺序；固定来源未覆盖的合法调用是诊断环境缺口，不直接归因模型。重复无效动作、忽略已有证据、无支持的最终断言、错时钟或错请求、绕过安全边界，才按实际记录归因。

### 7.1 Offline classification rules (evaluator@36 / rubric@31)

独立网络审计将fetch/xhr视为同一页面脚本请求类，其他类型独立。OPTIONS必须有冻结实际GET/HEAD/POST规则及完整浏览器握手事实，只匹配可观察投影；实际POST另外要求完整字段/类型、content-type和body SHA证据。合法预检不证明后续body合法；未知字段/方法/路径为S0，缺body或缺历史握手事实仍NOT_EVALUATED。当前Runner使用`src/eval/restaurant/agent-loop/cases/reviewed-public-reads.json`的独立字面量审核，历史审核文件和既有评价不重写。

Evaluator@35 的见证身份统一使用冻结的名称、完整地址对。除公开详情主身份外，只接纳独立核对并登记的来源表记；匹配时名称和地址必须属于同一登记对，不从执行候选临时生成别名，不用同名或同源 ID 覆盖门牌/楼层冲突。保存的公开详情及核对依据随 registry 的原始 SHA 引用；历史缺地址仍未知。见证路由身份不替代 HARD、实时库存或 S0 的独立证据，旧评价不重算。

Gold之外的额外UNSPECIFIED背景条件不作为缺失或冲突，不替代任何Gold条件，不放宽原条件的HARD/SOFT、polarity、multiplicity或显式identity检查。额外条件保留在原始记录中；这条规则不证明该条件的来源或满足情况。原条件及展示依据仍独立核验，依赖语义保真判定的最终结论保留相应派生变化，不覆盖历史评价。

Runner保存的SIGNAL（SIGTERM/SIGINT）、TIMEOUT或EXTERNAL_STOP记录按实际中断分类并排除能力分母；按事件、轨迹和执行诊断列已到达环节，未到达不补造。分类中断前仍核验实际已展示声明的原始支持与冲突，不能用中断掩盖S0。无法捕捉的SIGKILL仍按已有外层中断包规则，不承诺退出前刷盘。

The evaluator never reads result labels. Conditions correspond through an explicit criterionRef/semantic identifier, or an independently reviewed, exact-artifact-SHA-scoped Gold-index to authoritative-index binding. Historical index bindings retain immutable review refs and both original wording hashes; they never apply to another artifact or establish source truth. Text-only comparison performs generic NFKC/case/punctuation/hyphen/whitespace normalization, without synonyms, stemming, translation, or inferred index/order equivalence. Unbound or ambiguous wording stays pending review; polarity, multiplicity, and HARD strength remain independent checks. Display comparison first resolves the requested condition to its authoritative condition, then uses that condition's reference (or a unique normalized literal for a legacy display row). Missing/ambiguous display records remain unassessed. Original evaluations are immutable; a new sidecar is a reference under the new evaluator, not a retroactive gate pass.

Evaluator@32 additionally accepts a frozen `restaurant-hard-criterion-evidence@1` manifest through `--hard-evidence`. Saved merchant course/category HTML must bind the exact original artifact, candidate, executed evidence, cited observation, URL, snapshot ordinal, recording SHA and runtime HTML SHA; the evaluator parses these fields independently of production parsing. Reviewed witness quotes must bind the same artifact/outlet/request, current applicable certification, raw quote file and independent review SHA. Names, reviews and model verified labels are not automatic HARD proof. Course meal restrictions remain explicit restaurant-offering observations, not requested-time course availability. Accepted text, unaccepted text, unproven claims and missing presentation citations are separate findings. Historical evaluations remain unchanged.


| 结果 | 必需的可读依据 |
| --- | --- |
| QUALIFIED_DELIVERY | 实际终态展示＋冻结请求保真＋同候选/请求的原始观察与引用链支持；生产eligible和终态不是oracle |
| DELIVERED_UNQUALIFIED | 实际展示与Gold或独立原始来源核验存在明确冲突，包含明确不满足的SOFT条件（R2）；缺证不能充当冲突 |
| HONEST_NO_RESULT | 实际有界结束、完整范围与执行观察、已披露未知相符；不等于调查充分性、资源合规或全局穷尽通过，不证明用户目标完成 |
| CAPABILITY_MISS | 无交付，且有独立、同请求且适用的可行见证或运行后见证；无见证绝不从预算/原因码推导 |
| INTERNAL_FAILURE | 已记录失败attempt与不满足的完成环节互相印证；或R6中的终态系统故障与实际失败执行互相印证，原因码单独不足 |
| ENV_FAILURE | 原始服务attempt的明确账户/服务HTTP失败（401/402/429/5xx），或有独立外层环境记录；R5环境延误至时间窗后排除能力分母，不是普通无位 |
| ORCHESTRATION_INTERRUPTED | 外层真实SIGKILL/SIGTERM及中断记录；不计能力分母，不补造result |
| NOT_A_VALID_SAMPLE | 冻结输入/见证适用性有明确失效依据，不计能力分母；不是“产品失败”的别名 |
| NOT_EVALUATED | 上述规则所需Gold、原始观察、记录或已批准口径缺失，逐项说明，不猜类型 |

S0分为声明与越界两项，均零容忍、独立判定；合并S0只是汇总，不能把一项的未评价传播成另一项未评价或冒充两项无错。声明须核对实际展示与独立原始观察/Gold；无展示也须有保存状态和执行轨迹支持，缺result或必要支持链不能放行。越界按评测器内独立的ADR-0035/0036规则、冻结的各批`reviewed-reads.json`及实际请求事实核对，不采用生产Guard的准入判断作为oracle。已派发的禁用方法、表单、超出有限入口的请求或明确未安装Guard仍派发为越界；被拦截的不算。公共状态GET、静态资源或已审核日历POST不能仅因`reserve`字样／POST方法判错；同源公开GET与跨源动态读取仍需分别检查。历史请求体／参数等原始证据缺失时逐条输出`EVIDENCE_GAP`及缺少字段，允许越界项未评价；`RULE_GAP`不享受此例外，必要声明维度未评价也仍阻断验收。外层向前记录独立POST bodyFields核对、完整字段类型和请求体SHA，不追补历史请求体。裸snapshot URL不能替代实际请求参数，有限记录内ABSENT仍不证明任意GET无副作用；ADR-0036残余风险不变。

S1需要独立确认已交付内容与真实需求冲突；S2需要可行见证和无交付；S3除下述已批准R1规则外的体验门槛属于E2，本切片未评；S4没有独立证明用户无感的影响时未评。结果、严重程度、归因分别输出。用户目标完成由实际支持的交付报告，不读预期布尔值。

R1按用户实际得到的结果分类：推荐被执行成查位，但实际展示仍有原始支持并满足原请求的日期、范围、HARD等条件，则QUALIFIED_DELIVERY，额外查位过程记S3，目标/语义漂移仍在环节判定中保留。新增非阻塞偏好不是原请求未满足的证明；不能因此跳过任何原始条件、HARD强度/polarity、未知同义或引用/新鲜度检查。相反方向（需要查位却只有推荐）不享受此规则，缺空位不得交付为合格。

R5从绑定原始result SHA的外层记录推导：同任务、同冻结配置的历史预检在请求窗结束前明确失败（包括失败的来源HTTP观察），之后正式运行已晚于请求窗，且无交付，判ENV_FAILURE/EXCLUDED。只有过窗、系统原因码或没有失败预检，均不足以认定环境延误。当前Gold时间窗按cases/README的Asia/Tokyo；须有明确`resolvedTokyoDate`物化记录，不把referenceTime的显示偏移误当作业务时区，不补默认时区或重写原时间窗。

R6对无结果记录同时要求：终态failure、search failure或remainingGaps中留有系统故障码，以及真实ALLOWED执行/执行失败轨迹中有对应failureCode和observation，才判INTERNAL_FAILURE；单独终态、自由摘要或孤立历史失败不够。除已注册SYSTEM码外，审核口径明确的`BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED`作为已知共享额度接线缺陷按此核验，不改生产失败分类；不按运行ID特判，不把正常无位或未核验原因改为系统故障。

历史FAILED任务的`AGENT_LOOP_NO_PROGRESS / AGENT_LOOP_REJECTION_LIMIT`也须有对应实际失败来源／重复被拒动作、匹配的末尾终止trajectory、loop记录及SYSTEM终止event，才可归内部失败；只有失败标签或缺实际event不够。独立见证的可行但未交付S2与此原因分类分别保留，不用CAPABILITY_MISS覆盖已有内部失败，也不因内部失败抹掉独立S2。

如实的有界无结果仍须逐项核对当前请求、实际发现集合、每店实读/未读范围、结束动作、引用的否定库存及已有合格证据；漏店、缺执行、把UNKNOWN当无位或忽略已独立合格结果均不能认证。上述范围一致只证明“本次未核验出可交付结果”的如实报告，不能把调查充分性或缺少的实际限额转成SATISFIED；COMPLETION_OUTCOME/RESOURCES等必要未评维度继续保留。已有内部/环境/外层原因与可行见证仍优先按实际原因分类。

冻结Gold的条件对象出现非契约字段时报告UNEXPECTED_FIELD及原始路径，相关语义未评价；不把损坏的数字/字符串拼接修复，不从菜单、标签或等价表补造原条件。更正须由独立Gold输入提供并绑定原始产物，不覆盖历史result。

每家实际展示的店按冻结用户criteria逐项输出`MET / NOT_MET / NOT_CHECKED`、strength/polarity、原始依据或缺失原因和引用，不省略SOFT与UNSPECIFIED（R2）。独立来源明确反驳HARD仍不合格/S0；外部观察明确反驳SOFT为DELIVERED_UNQUALIFIED/S1，不把真实空位变成错误空位声明。NOT_CHECKED只披露未核对，不改变结果类型；UNSPECIFIED保留状态，不自行升级为HARD。来源的`verified*`或模型判断标签不能独立证明自由文本条件满足；只能采用可归属的原始明确陈述或外部Gold，否则未核对。

预算“around”的数值容差未确定（R3），当前只采用审核的`soft-preference-observations.yaml`人工观察状态，不从店名、类别、菜单或评分猜价/推导容差。该Gold按原始字节SHA引用，只用于其明确登记run/候选/条件；共享输入加载器以已校验原产物SHA绑定run上下文。候选ID/来源ID、请求或原始字节不适用时不得继承；无上下文则未核对。观察记录不是结果标签，Evaluator始终不读取labels。

见证上下文按原始artifact SHA绑定，保留原始见证/库存文件SHA，不携带结果标签。跨来源同时核对名称与完整地址（保留门牌/楼层）；独立地址缺失只列可能匹配，不能用当前候选补写Gold。原生来源可按同来源门店ID＋名称关联，明确地址冲突仍否决。漏斗的identity/facts OBSERVED只报告实际同请求观察与原始支持链已记录，不等于HARD语义判断通过；原因码保留为系统记录。候选卡点一律HYPOTHESIS。运行后同一未来预约日期/人数/窗口的原始库存可与既有登记HARD/范围Gold组合为可行见证，须声明这是较晚观察，不证明历史库存逐时不变；无适用登记Gold则未评价。明确认证窗口过期且没有运行后复查时按§5排除样本，不能把未决定的“用户请求已过期”口径自动等同此规则。

见证集合来自独立登记表，不能随实际复查行或系统候选池缩水。登记店缺原始观察时仍输出该店，库存、观察时间和可行性保持未评价／无时间，不用旧slot文本补造当前库存，不能据此确认卡点。

历史外层`rows / witnessRaw / witness`只是已有原始观察的记录形态，按明确原始目录读取文件并核对SHA，不复制生产候选来补店名。正向HARD可采用独立登记Gold明确的criterion→原始quote映射，quote不必逐字复述用户条件；这不是用当前模型的verified标签自证。负向HARD只有在独立登记明确认证KNOWN_FEASIBLE_SUPPORTED、认证请求逐字表达对应“no …”且日期/人数/时段与当前Gold完全适用时，才可采用该预先人工认证；缺认证或范围冲突仍未评价，不从菜名缺关键词推导排除成立。范围半径取明确登记数值或冻结acceptance中唯一可读“within N m”；缺少不补1000默认值。运行后raw仍独立必要，登记classification本身不是当前库存。

原始result缺失的中断包保留started、decisions、外层interruption/finish及trace各自原始路径/SHA。结果依赖的环节与用户目标完成情况全部NOT_EVALUATED并注明缺result，不能从SIGKILL推导用户目标NO；若已有真实保存结果，则仍须独立检查其实际支持，外层中断类型不能抹掉已支持的交付。S0只用trace；不能从中断名称或“保守停批”说明判断S0。两条授权中断的校准允许S0未评价并解释，其余校准要求仍按冻结任务门槛。

复核者导出的R1–R9口径以对应分类规则落地；人工标签仍仅用于最后的独立校准，不代填。历史评价不覆盖；同一开发输入重评只产新sidecar，不代表新用例准确率。

无进展诊断上限（代码`INVESTIGATION_PROGRESS_LIMITS`；严格超过才不满足）：拒绝动作3、连续无新观察4步、同请求/来源/动作/失败类重复3次、同一完整URL重复加载5次（首次不算重复）。首次新增候选/证据、首次实读候选范围或首次新来源空观察计进展，不把UNKNOWN变成无位或成功；失败/被拒提议不能用伪observation重置。连续同检索词另报逐步序列，换来源本身不是错误，不把三次合法来源查询直接等同不充分。完整URL缺失而只留脱敏路径时，URL子项未评价、路径次数仅描述，不因删除query制造重复。调查不满足可与合格交付并存；claim仍必须过条件、同请求观察、原始支持和展示时序检查。通过计数检查也不证明调查充分。

## 8 当前评价入口与覆盖

| 目的 | 当前入口 | 证明边界 |
| --- | --- | --- |
| 语义开发回归 | `npm run eval:restaurant:semantic:fixture` / `...:deepseek` | 前者是离线契约，后者是授权真实模型诊断；均非Clean Baseline |
| 私有Holdout准备 | `npm run eval:restaurant:semantic:holdout:preflight` | 标注与状态检查 |
| 搜索本地纵向检查 | `npm run eval:restaurant:search:fixture` | 本地Fixture链，停在授权前 |
| 固定来源或Hybrid只读 | `npm run eval:restaurant:agent-loop:fixed-source-model` / `...:hybrid-live-read` | 前者受控来源，后者本次真实只读；都不证明预约成功 |
| 已有artifact补评 | `npm run eval:restaurant:agent-loop:artifact` | 结论支持性与终止行为 |
| 决策回放 | `run-decision-replay.ts`（原样、注入、history模式） | 单步决策在冻结输入上的表现 |

四层结构的现有覆盖（@32 / rubric@28离线诊断边界；具体校准状态见STATUS及当批报告）：

| 层 | 已有 | 缺口 |
| --- | --- | --- |
| 端到端结果 | @32类型化读取、独立来源核验、结果分类、R1–R9及原始中断包入口；逐店逐criteria状态、独立SOFT观察Gold及产物绑定商家字段/见证HARD支持 | 损坏Gold/原始证据不足仍未评价；时间分解未自动输出 |
| 逐环节判定 | 理解请求Gold比对；见证逐候选发现/身份/事实/查位/展示漏斗 | 历史见证缺地址时跨来源身份未评；OBSERVED链路不是自由文本质量评分 |
| 严重程度 | 原始claim/Gold及trace独立核验S0、明确需求漂移S1；各级显式状态 | 脱敏/不完整trace、自由文本HARD语义及S3/S4影响仍可能未评价；不把未知记为0 |
| 归因 | 见证漏斗自动输出HYPOTHESIS；人工sidecar与回放 | 注入式回放尚未用于因果确认；无跨运行汇总 |

缺口的实施顺序与验收在当期Playbook中规划；本表在缺口关闭时更新。

真实模型、私有Holdout、Live和Controlled Live-write遵循当前合同、开关、用户授权和预算；开关不是授权。任何实际运行保留开始记录和结束/失败/取消记录，不覆盖已有artifact，不记录Secret、Cookie、挑战token、接管输入或原始Provider错误。

## 条件支持与产品可知性

Evaluator@33 / rubric@29将独立条件真值与产品可知性分开记录。MISSED_KNOWN_CONDITION仅用于产品已观察到的、可适用的原始来源支持：如同店同请求保存的价格区域、商家类别/课程原文或明确的当前来源语句。仅见证、复核者解释或外部标注支持而产品显示未核对，单列PRODUCT_UNKNOWN_EXTERNAL_SUPPORT，不作为展示不一致。来源原文与外部解释同时存在时，已接纳的产品来源支持优先，不能被外部依据掩盖。缺证仍未知；展示MET且独立NOT_MET仍为S0，展示MET无独立支持仍为S1_UNSUPPORTED；既有餐段、引用、身份、当前性与原始SHA约束不变。独立支持的真值不因产品不可知而改写。
