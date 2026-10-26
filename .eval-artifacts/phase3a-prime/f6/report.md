# F6：固定收尾预留实施

- 时间：2026-10-26T08:05:35.309933+01:00（Europe/Vienna，CET/UTC+1）。
- Evidence status：current implementation candidate；已暴露历史及本地构造控制，非Clean Baseline。
- 分支：`codex/feat-phase3a-prime-f6-bounded-conclusion`；起点main `7e2425b7878abe2ad86ef110d1fe98b926d3104d`。
- 合入前已重放到main `50b70fa60ccd44a8155952f035fc83102916ad18`，双方文档保留，账本与该main零差异；其ADR0044/Schema4/Prompt25/Gold4、退出评价器SHA绑定及注入时钟修复完整保留，详见[重放收据](rebase.json)。原7e上的红绿灯是frozen regression；最终五门禁以重放后的候选为准。
- 模型／Google／网站／Live／环境重跑新增均0；未读取.env。五门禁及发布收据在末节独立记录。

## 兑现的切片

按用户批准的ADR0045，只改共享接线。整单仍500秒；三类动作在模型前和执行前使用同一权威截止，准入为20秒+62个完成样本的中位数：搜索65154ms、事实50383.5ms、查位66453ms，等号可进入。剩100秒时查位正常进入，未保留前稿190秒常量。每类分别计算；搜索已不合算时仍可选择合算的事实读取。所有读取取消继承截止−20000ms；当剩余合法读取都不合算或进入预留时，只有结束和原资格展示。

原≤4模型调用预留及更早45秒默认短批窗口保留；它们不替代20秒全读取截止。模型思考后跌破门槛再次核验，不启动过时提议。模型慢／最后调用失败／余额0按可信状态展示合格短批或给出本轮未核实结果及缺口，不把未读说成无店。来源90秒、4地区页、10详情、一次纠正和原调用累计不重置。

实际变动对象：State23、TaskDefinition21、Restaurant Context16、Agent Prompt28。Action Schema4、retrieval Schema3/Prompt6、Browser Context3/Action12/Prompt20、Recorder5、Evaluator36/Rubric31保持。活动构造与调用方同步，未保留旧输出兼容。历史artifact不改；槽3旧State21只在标明本地构造的测试内映射当前Schema。

## 搜索取消先补齐

原缺口确实存在：Native已接纳A后B取消、Google完成页A后续页B取消，在真实来源组合→Router→Reducer链上都返回SEARCH_FAILED。冻结旧路径`556bd14c`的[有效红灯](search-red.log)在目标SEARCH_COMPLETED断言失败。`146186fc`先修交接，[两来源绿灯](search-green.log)及[126项相关回归](search-related.log)通过，再实施时间准入。

Native收集已通过原规则接纳的候选/证据及进度；Google先接纳完整第一页，再等下一页。reserve取消通过既有SEARCH_COMPLETED交出完整候选；未读完来源/续页UNKNOWN，exhausted=false。Native第二详情已计入2次尝试且会话关闭；Google2次请求、仅1页读完；计数不回零。只有发现证据，不因此获得展示资格。真实本机Chromium复用P21的本地HTML控制：首详情完整、第二详情导航取消，保留1家、详情计费2、来源UNKNOWN，[证据](chromium-search-green.log)。本地HTML不是网站回放。

Router给来源2秒响应取消并交出完整快照；这2秒包含在20秒中。1秒慢关闭仍交接；忽略取消超2秒的故障明确READ_CANCELLATION_UNSETTLED技术失败，不宣称正常结论或已保留该次未提交结果。已接纳状态不删除，迟到结果不再进入checkpoint或持久化。内存checkpoint仍不保证进程崩溃前增量持久化；没有另造部分事件协议。

## 槽3有效红灯与控制

固定Git `e169e606b41e1ef97f408efde834112810dd467d`槽3：决策39结束后剩26596ms，11/50模型调用余额、3/40 Google已用，原三家CHECK提议。历史输入与SHA见[provenance](../../../src/application/fixtures/f6-slot3-read-state.provenance.json)、[本批输入SHA](inputs-sha256.json)。旧准入`19558e09`经真实Coordinator合法动作计算仍执行3家，目标0次断言失败，见[slot3-red](slot3-red.log)。实施后同断言执行0次、只结束/原资格展示、无超时，且原continuation.exhausted不变。这里是历史检查点的本地构造，非整站回放，也不改F5原评价。

| ADR离线条目 | 输入及真实链路 | 断言／证据 |
| --- | --- | --- |
| 槽3红→绿 | 固定blob检查点，本地构造；实际Root→Validator→Router→Reducer | 3次→0次；NO_VERIFIED_RESULT，有未核实缺口，无伪展示 |
| 中位数等号/两侧 | 本地构造当前合法候选；Context+Validator | 三类阈值一致；50383.5精度保留，不凑整；100秒查位可开始 |
| 思考后侵蚀 | 本地构造：合法100秒时提CHECK，思考后剩49秒 | 执行0次，不额外模型纠正调用，有界诚实结束 |
| 完整A、半途B | 原逐店fixture扩展availability-time及facts-time；原grounder→Router→Reducer→展示 | 20秒处取消，完成店保留，未完成UNKNOWN/RESERVE_REACHED，无半途库存 |
| 原资格 | 同一取消构造，独立改变原始身份/日期/人数/slot/观测时间；HARD无证控制 | 错身份/日期/人数/时段/过期均不展示；非fugu不能满足HARD |
| 搜索子结果 | Native/Google实际来源组合+本地外部替身；P21真实Chromium本地HTML | SEARCH_COMPLETED、仅完整A，来源未知、不穷尽、计数保留 |
| 慢取消／慢模型／0余额 | 本地手动时钟及计时器，不用真实秒数等待 | 1秒关闭保留；2秒不settle技术失败；模型最晚deadline−2秒退出；有/无合格两种0余额，不多调用；迟到无覆写/重试 |
| 不退化 | 原调用预留、短批、普通取消/硬截止、H001–H005、F5 G1/G3/N/F组 | 五门禁运行完整默认及本地Chromium套件；既有断言保留 |

新控制见[controls-green](controls-green.log)28项；其中包含17项整单构造、原逐店事实/查位时间及调用预留、Native/Google搜索与槽3、阈值控制。退出分类补充[27项回归](stop-regressions-green.log)。这些分母是测试项，不是Live成功率。

## Web同一截止及持久化

检查发现Web仅继承原硬取消信号，Agent自己的时间预留从语义结束重新计时。已冻结`bab6e9b6`的W12使用HTTP→持久化应用→PGlite，语义推进100秒、读取合法开始，再推进至从语义开始第480秒；旧接线不取消，目标断言失败，见[Web有效红灯](web-deadline-red.log)。

现在配置RunBoundedModelGateway的Web入口从其既有ModelRunUsage.deadlineAt映射到Runtime时钟，把原截止传给Coordinator；实际调用方更新成同一usage合同。500秒总时限不因语义消耗或异步HTTP返回重新计算。Live Runner原本已传原始截止；两个固定来源Runner同步改为传原参考时刻+原总时限，正常控制注入语义100秒并核验首次搜索Context恰剩400秒。Web的FIXTURE/LIVE共用该规则。

PGlite还暴露一次取消既写诊断又写完成行，使用同一trajectory主键的缺陷，见[失败记录](web-persistence-failure.log)。现保留一个动作一行完成轨迹、附取消原因；只有没有返回事件的取消才单独记诊断。W12现第480秒取消、有界NO_VERIFIED_RESULT；原W11计数、W13调用预留一起3/3通过，[Web绿灯](web-green.log)。结束Reducer会清理窗口，所以截止核验读原事件日志，不依赖终态保留临时窗口。

普通行为fixture原5/10/30秒整单配置低于新的真实准入；已统一改用500秒手动/固定时钟，使原行为断言实际经过目标路径。专用0ms/硬截止/用户取消反例保留；用户取消改在充足预算下进入模型后取消。没有通过扩大生产预算或缩短用户预留让测试过关。

## 独立四层判断与边界

1. 语义／权威条件：相对新main不改Semantic Prompt25、Schema4或Gold4；原H001–H005及修正控制沿实际Interpreter/Compiler核验。F6只读取权威deadline和计时样本。
2. 证据／执行：完整子结果使用原grounder、请求关联与Reducer；独立构造原始19:00/2槽位、身份等变化，和实际展示offer比较。PGlite原子事件与真实Chromium关闭路径分别验证。
3. 交付／S0：本地正常100秒及完整A取消可合格展示；未知/HARD无证不展示。Web实际artifact经现有独立Evaluator确认NO_VERIFIED_RESULT；原完整H001组合及S0挑战保留在默认套件。本地oracle没有错误展示。没有把生产eligible=true作为唯一独立证据，也不把它当新Live S0认证。
4. 能力／验收：本批仅离线机制验收。真实模型、当前来源DOM/库存、真实连接、真实慢关闭和最终Live效果均NOT_RUN。F5例01仍0/3、已知限制；不重开F5，不声称当前站点成功率改善。3a′退出条件6未达成：站点3847行（目标3591，差256），L1/L4/L5转3b，其余延期按原清单。

## 五门禁、范围和发布

首次干净候选85f8c234的typecheck/arch通过；默认1099/1100，一项旧Search Eval fixture仍用30秒整单预算，尚未读取即进入预留，导致原成功断言无候选。已同步该实际fixture调用方至500秒，原3项业务断言保留。首次build/Chromium未运行；将在修正后的干净候选上重新依次执行五门禁，每项前后git status必须为空；最终结果以下方收据为准。

最终干净候选`bcdd5cf12f56bd4ac70a95e451a4ac140228f9d3`五门禁全部PASS，原始收据见[gates.json](gates/gates.json)。每一项前后status为空，最终仍为空；`git diff --check`通过。归档后仅追加文档和日志，source tree保持`079fc3be96ac5a1707c176909f6455c9b1a5a3d0`，不重新运行真实调用。

| 门禁 | 结果 | 秒 | 日志 |
| --- | --- | ---: | --- |
| `npm run typecheck` | PASS | 0.508 | [typecheck.log](gates/typecheck.log) |
| `npm run arch:check` | PASS | 0.2 | [arch-check.log](gates/arch-check.log) |
| `npm run test` | PASS 1100/1100 | 28.511 | [test.log](gates/test.log) |
| `npm run build` | PASS | 0.46 | [build.log](gates/build.log) |
| `npm run test:browser:fixture` | PASS 162/162 | 99.892 | [test-browser-fixture.log](gates/test-browser-fixture.log) |

首轮门禁的1099/1100失败和未运行两项在[gates-attempt1](gates-attempt1/gates.json)原样保留；不是最终结果。重放后的局部复验曾漏一个主线新ADR0044普通fixture的5秒预算，原失败保留于[rebase-focused](rebase-focused.log)，已修配置且默认完整回归全绿。两轮五门禁均未污染工作树。

[验证摘要](verification.json)。按用户授权快进合main并推送工作分支与main；最终提交SHA由发布时的ls-remote和本次回复给出。完成后停止，F6真实Live未运行。

[范围核对](protected-check.json)：相对main起点116个保护文件字节相同，包括两站点目录、page-parser/query-controls和source-packs；预算账本SHA未变。网站非测试3847行、Pack473行。`git diff --check`在提交前核对，发布后用ls-remote核对工作分支和main。按用户授权合main并推送后停止，不运行Live。
