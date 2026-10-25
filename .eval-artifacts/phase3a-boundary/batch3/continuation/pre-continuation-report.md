# 推荐与查位边界：停止点3

- Evidence status: draft / not integrated into main；已暴露开发诊断，非Clean Baseline。
- **按规定提前停批：真实调用1/144，剩余143。SR01-T01的yakiniku强度由旧Gold的UNSPECIFIED变为HARD。没有继续调用后续71轮，没有修Prompt或Gold。**
- 本次真实运行：2026-10-25 **20:57:51.316–20:57:55.580 CET（UTC+1）**。所有报告/账本新时间使用CET；原输入业务参考时间及原生测试日志时间保留原字节。

## 1. 范围与提交

分支 `codex/adr-0044-recommendation-availability-boundary`，不合main。停止点2复核通过基点c014d481；零调用准备9695a732；本次真实执行冻结提交 **f0cc436a6633909b2fb8444e9f2e142390cef428**。受控Runner、模型配置、授权和602项输入/源码SHA先提交，再运行离线门禁和真实调用。[执行冻结](batch3/execution-freeze.json) SHA-256：b04d93212fe22bf15787221684533b244ba15ab96fed64bd51e870e0853d46ad。

计划72逻辑轮：开发15、额外灰区42、公开已暴露留出集12、新Wednesday开发输入3。后者仍非Gold，私有Holdout未读取。原生产源码、Prompt@24、Proposal@4、scorer/report@4、State@20、TaskDefinition@18和旧Gold保持原样。后续交付提交仅保存结果/文档，与受测源码逐字节一致。

[停止点2原报告](batch2/report.md)、[此前零调用预检原文](batch3/preflight-report.md)与历史manifest/evaluation均保留；本报告不回填旧结果。

## 2. 结果、检错证据与未覆盖范围

### 首个真实输出

SR01-T01：`Tomorrow between 19:00 and 19:30 in Shinjuku for two people, yakiniku under 5000 JPY per person.`

- 类别B；模型提议AVAILABILITY。旧开发Gold此轮未标target，明确记UNANNOTATED，不补造“旧目标”。
- goalBasis.type=`SPECIFIC_TIME_MEAL`；reason=`Explicit clock range for a sit-down meal with a known party size`；quotes=`between 19:00 and 19:30`、`for two people`。独立核对两条引用均来自当前消息，目标规则在Proposal层满足。
- 非目标语义差异：`yakiniku`的文字/POSITIVE保持，但强度从**UNSPECIFIED→HARD**。独立读取未变的Gold与实际原始模型输出确认，触发停批。

| 字段 | 原Gold/阶段oracle | 实际提议 | 结论边界 |
| --- | --- | --- | --- |
| yakiniku.strength | UNSPECIFIED | HARD | 确认的非目标差异，停批 |
| DATE | 显式2026-08-06/raw=2026-08-06 | relativeDay=TOMORROW/raw=Tomorrow | 表示不同；最终物化日期未评价 |
| TIME_WINDOW | 19:00–19:30/raw=19:00-19:30 | 19:00–19:30/raw=between 19:00 and 19:30 | 钟点未变，raw不同 |
| PARTY_SIZE | 2，无source标注 | 2/source=EXPLICIT | 人数未变，新增诊断 |
| AREA | Shinjuku | Shinjuku | 未变 |
| BUDGET_PER_PERSON | JPY5000上限 | JPY5000上限 | 未变 |
| TARGET.query/scope | 此轮旧Gold未标TARGET | 实际完整提议已保存 | 不冒充有旧Gold可比 |

首偏离为开发阶段的SEMANTIC_INTERPRETER oracle比对。**Compiler/Reducer及权威Draft未到达**，不能将上述表示差异说成最终日期或时段错误，也不把Proposal的正确目标冒充权威State结果。

原始静态[调用记录](batch3/calls/001.started.json)、[模型响应/用量](batch3/calls/001.response.json)、[会话执行](batch3/sessions/SR01-complete-then-correct.execution.json)先保存；随后写[逐会话评价](batch3/sessions/SR01-complete-then-correct.evaluation.json)及[独立复核](batch3/independent-review.json)。独立复核未调用生产Scorer或模型Judge。全72轮旧/新目标、类别、basis及未到达状态见[对照表](batch3/comparison.md) / [JSON](batch3/comparison.json)。

| 队列 | 计划轮次 | 实际模型触达 | 上游阻断 | 未到达 |
| --- | --- | --- | --- | --- |
| 开发语义回归 | 15 | 1（非目标差异） | 1 | 13 |
| 14灰区额外各3次 | 42 | 0 | 0 | 42 |
| 两份公开已暴露留出集 | 12 | 0 | 0 | 12 |
| Wednesday新开发输入 | 3 | 0 | 0 | 3 |
| 合计 | 72 | 1 | 1 | 70 |

其余71轮均没有模型请求：SR01-T02为上游阻断，其他70轮未到达。所有额外灰区重复未运行，**一致率不可计算**，不将缺测当一致；[分组计数](batch3/gray-consistency.json)保留14组×3与新候选×3的分母及NOT_EVALUATED。

| 本批变化/边界 | 检错与正控制 | 实际结果 | 未覆盖 |
| --- | --- | --- | --- |
| 按原会话串行，失败后不调用下一会话 | 外层自检：开发fixture15轮正控制；注入party=99或B推荐均只解释1轮即停 | 真实SR01-T01后停，调用文件只有001，无002 | 未运行完整72轮，不能推断泛化 |
| 灰区目标变化不单独停批 | 同一灰区fixture两种合法目标均继续 | 本次未到灰区 | 三次一致率未评价 |
| 预算及逐请求落盘 | 143→144允许，144后拒绝；真实请求先记账再派发，原响应另存 | 1 started / 1 response / 1 provider成功 / 0失败 / 0重试 / 0不确定 | 不推断模型长期可靠性或价格 |
| 公开非目标比较 | 原语义Gold经仅目标叠加的评价投影，沿用hybrid evaluator@34语义字段核对；正常与人数错误对照通过 | 未运行到公开额外输入；原Gold结构原样保留 | G030历史Gold异常不能自动修成通过 |

四层报告：端到端用户交付NOT_EVALUATED；逐环节为Proposal目标/引用通过、条件强度不同，后续NOT_REACHED；真实S0/来源声明/越界及用户S1–S4未评价；首偏离环节可确认，但仅本次对旧Gold，不足以区分Prompt影响与模型波动等根因。离线检错或零网站调用不替代S0独立现实证据。

## 3. 五门禁结果

受测提交f0cc436a；2026-10-25 **20:55:30–20:57:27 CET**。离线阶段没有加载凭据文件、没有真实模型调用。

| 命令 | 结果 | 结束后git status |
| --- | --- | --- |
| 外层离线自检 | 15轮正控制、2个早停控制、双灰区目标、预算与公开字段控制通过 | 空 |
| npm run typecheck | PASS | 空 |
| npm run arch:check | PASS | 空 |
| npm test | 1051/1051 | 空 |
| npm run build | PASS | 空 |
| npm run test:browser:fixture | 154/154，本机Chromium | 空 |

每项退出0；[逐项命令/时间/原日志SHA](batch3/offline-verification.json)和[原日志目录](batch3/offline-gates/)保留。未恢复文件掩盖测试写入。真实调用发生于门禁通过之后；账本写入属于预先声明的运行结果，不是修改评测配置。运行后602项冻结仍全部匹配，交付文档不会改变受测代码。

## 4. 模型、凭据与来源访问

- `deepseek-v4-flash`，真实调用**1/144**，余额143；provider成功1，额外尝试/重试0。输入6860、输出458、共7318 tokens；记录latencyMs=4241。未配置价格，不估算费用。
- 独立[账本](budget.json)累计1；[3a′共享账本](../phase3a-prime/budget.json)记externalActualRealModelCalls=1，chargedToThis400CallBudget=0，不扣其400次。
- 凭据仅由受控Node Runner通过用户指定绝对路径的--env-file加载；模型名命令行显式指定。[credential-authorization.json](batch3/credential-authorization.json)在调用前已提交，记录路径、窄范围及**“未独立读取文件”**；未cat/grep/打印/复制/暂存文件，未输出或记录密钥值。凭据日志仅“已加载”；加载授权不扩展到其他进程/批次。
- 模式分开：本机fixture/离线控制0真实调用；本次REAL_MODEL_MOCK_WORLD语义诊断1；本批Replay、来源Live Read-only、Google/餐厅网站、Full Live、Controlled Live-write均0；私有Holdout未读取。

## 5. 偏离与实施说明

未越出授权范围。72轮未跑满，是首轮即命中用户规定的非目标差异停止条件；余额未继续消耗。没有调Prompt、改Gold或补跑填分母。

标准npm真实回归入口会在一会话失败后继续其他会话，故以已提交薄外层逐原会话调用同一现有函数、保持原时间与阶段oracle，再在会话返回后停批；同一会话失败后的后续轮本来即BLOCKED，不增加请求。额外公开输入的接线与原始Gold/目标叠加说明已在调用前冻结，但本次未到达，不能报告它们真实通过。

另有预选G030历史Gold日期对象含`October 27: null`异常键，原样保存并在配置中标出；未执行到该例，未修复或算作本批模型失败。

## 6. 停止点3待逐条确认

已停在**STOP_3，等待用户/复核者决定**。不合main、不继续调用、不修改Gold。

- [Gold待确认清单](batch3/pending-gold-review.md) / [逐条JSON](batch3/pending-gold-review.json)：保留SR03-T02旧RECOMMENDATION→新规则B AVAILABILITY；本次未到该例，不冒充新实测。
- 14个灰区输入（对应22份历史来源记录）的后继标注规则，以及13轮旧开发Gold未标TARGET的补齐候选，逐条列出。来源文件和旧evaluation保持冻结，批准后的后继数据集另行升版。
- SR01-T01强度漂移只记录，不提议把旧Gold改为HARD迁就输出。Wednesday仍只是新开发输入，不提议转Gold。灰区无本次额外重复数据，不能据此选择固定目标。
- 完成结果/文档提交后按授权推本分支，并以ls-remote核对。后续动作等待停止点3复核。
