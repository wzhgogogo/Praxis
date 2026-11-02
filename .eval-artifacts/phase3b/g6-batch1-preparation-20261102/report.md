# G6 批次1准备交付

2026-11-02，维也纳 CET（UTC+1）。状态：`draft / not integrated`，只交工作分支复核，不合main。

已同步复核main `efeab25483cf58011b7505c32d6da857e41c2533`（集成提交a1b42310），没有修改产品/站点/source-packs/Prompt/Schema/State或诊断报告目录。原 `g6-booking-terms-composition.test.ts`已在真实普通组装转绿；条款来自本次G1原文证据，没有注入fixture卡片。

## 本批结果与边界

- 整组装覆盖见 [逐项能力签收清单及缺口表](assembly-coverage.md)。新增能力测试实际使用createLiveReadAssembly；模型和来源I/O替换，生产取得页面/身份/事实/查位/交接接线保持。多回合原六个正例/受控坏输出检查和TableCheck B1沿用；新增改名、失配恢复、价格范围、Web追问、日文名、费用/反馈、Guard和F6。没有新增组件例外或把评分器反例当成能力签收。
- 真实模型决策回放57/80次，串行、无schema或传输重试。按运行前冻结合同校正我方评分器后52符合、5偏离；逐次原文、旧分数和校正分开保留，[每次动作与预期](decision-replay-results/per-call-report.md)。这是固定上下文回放，没有执行这些真实决定来生成下一个State，不能称作57次端到端成功或推算Live成功率。
- 五个真实偏离：P1三措辞和P2最终共4次应该SELECT却PRESENT；P2语义一次缺必需schemaVersion。没有为了结果放宽这些要求；交复核安排C/共享Prompt归属，不修产品、不付费重跑。没有跳过路径（scripted均绿）。G1实际追问原文引用成功；其ANSWER_PAGE_QUESTION由代码绑定显式问题，真实模型输出答案，不冒称模型自主选了该业务动作。新转述语义仍待独立复核。
- 串行Live Runner准备完成，仅fixture运行。State触发回合与未发送理由；同Case、整槽500秒/50模型/40Google，后续轮继承绝对截止和剩余额度；每槽见证/立即独立评价/S0停批。公网动作只在未来显式调用CLI后发生。
- 三类录制固定开启：浏览器、决策、Google结构化响应。每槽按页合格/总页数及逐页原因；保留原Recorder准入/脱敏，未实施静态方案(c)。[输出JSON合同/边界](evaluator-contract.md)供诊断消费者只读。
- [8槽开发Live计划](development-live-plan.md)已列请求原文、见证、额度、录制位置与采集事项。尚未认证当前日期库存；D2/D8尚缺同店Tabelog公开见证指针，不能拼造。本批未执行该计划。

## 浏览器偶发挂起

在独立Lima/VZ Debian12 ARM64、2 vCPU/6GiB、Node24.4.1、Chromium151环境复测。无个人profile、挂载、agent forwarding或.env；依赖安装后来宾外部路由封禁。环境下载单列为运行时/依赖准备，不伪称无任何互联网流量；餐厅/Google/公开评测GET为0。

旧目标测试自然重复30/30通过，单次0.928–1.002秒，中位0.946秒，**没有自然复现复核者的510秒卡住**。代码排查发现fixture的finished只在请求路由finally结束；会话已退休、路由从未进入时，等待该Promise无截止。受控晚调度保留原30ms导航与原业务断言，证实真实旧会话已关闭后卡在fixture.finished，8秒诊断保护退出124。最初控制错误地也挡住了导航时限起算，标记未出现，不算有效红灯，原件另保留。

只修A的`browser-read-test-fixtures.ts`：实际context.close同样完成finished，已进入的延迟等待与会话退休竞争，完成幂等。没有改B产品。修后同控制和原LOCAL/CLOUDFLARE三场景全绿；2核连续30组×3=90/90，组耗时1.947–2.079秒，中位2.0035秒。源SHA/机器/每次日志见 [browser-hang/results](browser-hang/results/)，独立hash见results-sha256.json。该机制关闭不等于历史510秒根因已证明。原G2 180秒、外层600秒、原行为断言保留；增加一个晚调度常设回归。任务VM已停止、删除，未动其他VM。

## 回放评分器编写错误的审计说明

输入及脚本在d043aef7之前提交，输入SHA `6062a3a7fca5f36c2d02c059a531db5463fc7ed5103835f38fcd7610c150d900`。Node获准以`--env-file`注入既有凭据，未用工具查看、显示、复制或暂存.env及密钥。每次物理fetch前记账。

首次评分把Agent动作字段错读为action（实际type）；人数补充错当Source2；取消/卡问题错误套用无关的包间句。原 `report.json`、第一次 `score-correction.json`未重写。`contract-audit.json` Document revision2只依据**运行前已提交的fixture原输出、请求schema和原页**修正这三类我方错误，另保留校正原因，不冒称独立复核，也没有增加付费调用。语义缺schemaVersion仍FAIL、四个未选择仍FAIL，不因看到结果调整它们的门槛。

## Runner、独立评价与真实调用

入口：`src/eval/restaurant/agent-loop/g6/run-g6.ts`；导入无调用，未来必须显式给冻结pack路径/SHA和`--record-browser --record-decisions`，Google录制固定开启。只接收模型/来源传输，能力来自session的createLiveReadAssembly，不存在预约执行端口；旧BOOK_RESERVATION仍只是产品proposal记录，fixture没有提交网络传输，真实Guard拒绝workflow POST。

网站前后见证统一 `https://tabelog.com/en/...`、详情和四参数GET，禁止Cookie/表单/重试，所有起始间隔≥5秒（跨槽同样共享限速）。24h内只复用同店同日期人数时段认证；每槽后时段核验不复用。无交付立即重复见证。有位独立证据缺失时NOT_EVALUATED，不能称S0已认证0。

fixture Runner：串行两槽，首槽取得本页回答/三录制、权威条件未满足的回合不发送；第二槽独立后验时段不存在→S0→第三槽未开始。见证GET全部本地构造响应，账本为测试临时账本，不是新增公开GET。独立评价器另有错店/错run/评论/无引用是或否/保证/日期/链接/越界/价格/无结果见证反例；规则、JSON及不能自动判断的转述意义边界见evaluator-contract.md。

新增真实Live0、公开GET0、Google0、环境重跑0；真实模型57。总账原510项逐id原值保留，新增57次请求和1条不重复计数的结项记录=568项；累计Live0/26、真实模型228/1600、公开GET255/290、环境重跑0/4。原Google12/网站255累计不变。[并集证明](budget-union-proof.json)。新留出集只保存既有承诺及校验脚本，原文没有读取、定位、推测或提交。

## 验证

同步main后基线原条款1/1、默认1335/1335、Chromium187/187、严格G2 5/5及12页PASS；五项前后净树，见baseline-verification。首次A类型修正之前的失败与沙箱不准本机监听的失败原件均保留，不称产品红灯。

最终候选 `56ecf553` 完整五门禁全绿：typecheck、arch（含组装门禁）、默认1335/1335（45.246秒）、build、浏览器入口成功（159.069秒）。浏览器原Chromium188/188，随后串行G6能力/评价器组46/46，合计234项；不把全部234称为Chromium用例。严格G2 5/5、12/12页PASS（24.232秒）；原取消条款1/1。七步每项前后git status为空、751份SHA不变。原Controller摘要仅取最后组46，原始日志另有Chromium combined188，分段计数在final-verification/verified-summary.json明确保留。新增G6组串行进入浏览器固定门禁，复用600秒/生命周期诊断；不会与G2或其他Chromium文件并发。先前38项组全绿，补充两个数据权威控制在合法事实调查补齐后2/2通过；最终回执见final-verification；不累加局部运行次数冒充全套。

首轮最终候选f2f88a9a：原条款1/1、typecheck、arch、默认1335/1335通过；build因A session导出匿名子类无法生成声明类型失败，浏览器/严格G2未开始，原日志见final-gates-initial。仅加显式RunBoundedModelGateway基类类型后build通过，运行行为不变。另补Runner当前pendingUserQuestion.relatedFields核对：旧f2f88a9a缺日期但问人数仍误发日期，隔离旧blob红灯SENT≠NOT_SENT；修后真问日期发送、问人数不发送2/2。该修复属于A外层编排，不动产品；两个回归加入固定组，总46项。

## 停止点

本批仅准备与获准的决策回放，不运行Live、不合main。交复核者逐项核对整组装能力测试、五个模型偏离、评分校正、独立评价边界与开发Live计划；G6 Live及留出集验收仍待后续批准和实际执行。

最后复核：两槽Runner本地fixture各4/4页合格，逐页原因为SANITIZED_NETWORK_AND_DOM_CAPTURE；这是简单构造页面的录制结果，不代表真实脚本页面的合格率已改善。真实页级比例须G6 Live实测。所有产品/站点/诊断源码相对efeab254零差异，只有A评测/harness/固定门禁与文档。五个模型偏离、旧失败原文、并集账本完整保留；本批授权范围内无剩余调用或代码修改待办。本分支完成准备停止点，等复核批准后才进入Live。
