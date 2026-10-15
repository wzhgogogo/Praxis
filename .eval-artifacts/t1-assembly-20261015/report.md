# T1 统一组装、浏览器门禁与 Web 入口修复

- Evidence status: exposed offline development regression; not a Clean Baseline.
- 起点：`git pull --ff-only` 从 `1a2eabd` 快进至 `1cd7bc5`；已通读 T1 指令与 P2-0 独立复核（含 h001 见证后改判）。
- 范围：六项本地独立提交；无 Live、付费模型、见证 GET、Gold／变体／见证修改。
- 并行检查：预约任务停在设计草案，当前共享源码无未提交改动。已有 INDEX、预约草案和演示稿保留在原处，不纳入 T1。
- 顺序：先关闭第 2 项已知浏览器 Fixture 红项，使第 1 项及后续必跑浏览器门禁可以全绿；其余按项推进。

## 0 P2-0 后的实际现状

| 入口 | 组装与宿主 | 实际参数与漂移 |
| --- | --- | --- |
| Live Runner | Google client/search → composeNativeRestaurantRead → LiveBrowserAvailability → eval Hybrid 内存 Runtime | 找店/查位20/120/80；事实4/24仍写死且网站事实另有6/12/24；Agent30/拒绝5/500000ms，Router30000/500000ms；共享 browserBudget 已接入 |
| Web LIVE_READ | 同样手拼读取组件 → PersistentRestaurantAgentApplication/Postgres | 找店/查位20/120/80；事实仍写死；Agent30/5/500000ms、Router30000/500000ms；总模型50；另一个手拼共享 browserBudget |
| native-discovery-composition | 自行组 Google／native／availability → Hybrid | 找店20/120/80、共享对象；Agent20/默认拒绝3/60000ms，Router30000/60000ms；产物另抄 browser total50，与实际120不一致 |
| dynamic Chromium H001 | 自行组 native 和 availability → Hybrid | 找店6/12/24且未共享；查位6/50/24；Agent30/默认拒绝3/300000ms；两条用例因旧地区选择 Fixture 失败 |
| current-development-offline／Hybrid 受控组合 | Google 独立来源＋fact/availability各自组装 → Hybrid | 来源6/12/30、事实4/12/24，多个独立预算；loop/router部分默认 |
| native-fixed-source model Runner | 自行组 Google／native／availability → Hybrid | 限额局部从参数抄写，无统一 browserBudget，Router时限独立；未执行此付费入口 |

## 失败机制与证据入口

| 项 | 主要失败机制 | 红／绿证据 | 状态 |
| --- | --- | --- | --- |
| 1 | 组装漂移、累计>12后误拒绝、记录不等于实际限额 | `01-assembly/red-retired-cap.log` 预算断言红；`green-restored.log` 2/2 | 完成；旧Hybrid迁移与第5项一起验收 |
| 2 | 过时 Fixture 隐藏完整浏览器链路红项 | `02-browser/red.log` 两项目标资格断言失败；`green-targeted.log` 2/2 | 完成：默认879/879、Chromium100/100，typecheck/arch/build通过 |
| 3 | 当前进程语义调用被查询误判成上个进程中断 | `03-web-owner/red-confirmed.log` FAILED≠UNDERSTANDING；`green.log` 并发＋重启2/2 | 完成；四条代码门禁见同目录 |
| 4 | 外部信号永不达到时测试挂起 | `04-bounded-waits/red.log` 超时标签断言红；`green.log` Web28/28 | 完成；四门禁见同目录 |
| 5 | 旧手工组装重复覆盖／不再验证当前链路 | `05-retirement/red-metadata.log` 额度状态断言红；`green-targeted.log` 全组合＋Router绿 | 完成；四门禁与额外Chromium见同目录 |
| 6 | CDP 无法识别跳转时未核对策略便放行 | `06-cdp/red-confirmed.log` 三类真实receiver断言红；`green-targeted.log` 26/26 | 完成；原生规范化未复现按允许分支交付，Chromium112/112 |

## 2 浏览器必跑门禁与动态 Fixture

修复前两个真实 Chromium 场景均返回零候选，目标 availability 断言失败。原因是 ADR-0040 后必须由模型选择已观察地区入口；旧替身只选日期／人数，列表也缺地区标题。补充观察入口选择和来源地区标题，原身份、HARD、请求绑定、事实替代、库存和展示断言保留。未删除用例或放宽资格。

Test Skill 1.4 将执行器、Guard、Source Pack、浏览器 Adapter 和读取组装列为 `test:browser:fixture` 的触发范围，并要求与四条代码门禁并列、全绿。

## 1 生产读取组装与显式限额

`src/integrations/restaurant-search/live-read-assembly.ts`为唯一生产组装根。Live Runner、Web、native固定来源Runner、native组合、动态Chromium H001和current-development固定来源均使用它；同一调用创建找店／事实／查位、一个browserBudget、Router和loop选项。运行结果runCeilings直接取返回值。Google-only控制显式选已有Google Pack，不是第二套组装。旧Hybrid组合迁移在第5项完成核对。

P2-0遗留loop三默认、Router两默认、Executor 300000ms默认及native facts 4/24全部移除；直接低层调用者显式给限额。事实链原先忽略配置并重写6/12/24也已接通。独立Mock Harness和底层单元测试保留显式12步／3拒绝／30秒等控制值，不是Live默认。共享基线增加总模型50、找店10候选及事实4/24/45000/30000，仍只维护一份预算。

检错：在`/private/tmp/praxis-t1-red-QdUozy`临时detached工作树应用当前源码，**仅把传给native发现的全局模型上限恢复为旧12**（旧签名不能直接checkout）；实际查位Fixture产生>12次调用后再找店，目标业务断言以BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED失败。恢复配置后同测试及Runner/Web返回值逐项对照通过。没有在主工作树回退、手填计数或提交破坏。

命令：`node --import tsx --test --test-name-pattern='T1 production assembly shares|T1 Runner and Web' src/eval/restaurant/agent-loop/native-discovery-composition.test.ts`。`01-assembly/`保存隔离红／绿、受控执行17/17和门禁日志：typecheck、arch:check、npm test（880/880）、build及Chromium（100/100）全绿。对照比较实际factory返回的限额、Router／loop和独立整单预算；两宿主源码均从同一次返回接线，不是比较两份常量。

## 3 Web 当前进程归属

在会话发布前登记进程内准备阶段，引用计数覆盖createCase／applyMessage的嵌套和重复投递，直到activeReads接手；finally释放，未新增长期状态或自动恢复。当前进程的语义解析不再被列表误判；新Application实例没有此归属，因此原W07重启孤儿仍终止为中断。

真实HTTP→PGlite持久化宿主，读取组件来自生产factory（显式Google Pack）；固定模型卡在语义传输时GET列表，释放后实际Google Adapter读一次独立空样本并正常NO_VERIFIED_RESULT。首个红灯FAILED≠UNDERSTANDING；另在隔离副本取消准备归属检查、用修正严格传输标签后的相同样本再次确认红灯（red-confirmed.log）。初轮后续样本用错STOP标签／误以为Google-only先做地名解析及误取原因字段，是样本错误，green-debug.log保留，不算产品红证据。并发正常完成和W07重启反例green.log 2/2。

命令：`node --import tsx --test --test-name-pattern='T1 Web shared assembly|W07' src/server/local-web-server.test.ts`；四条代码门禁typecheck／arch:check／npm test／build日志在`03-web-owner/`。仅HTTP本地循环与PGlite、无真实模型或外网。

## 4 有界测试等待

`local-web-server.test.ts`统一使用已有withinTestTimeout（1秒，控制用例显式20ms）。改动清单：W06/W08/W12/W07四处restaurant.started、W09 checking、W11 finished、重复消息allSettled、HTTP listening/close、SearchThenBlock.searchGate、可控semanticGate；首个及后续SSE消息共用有界nextCaseEvent，整条消息只有一个期限，部分字节不能反复延长期限。清理时server.closeAllConnections关闭测试自有SSE残留socket，不等待Node keep-alive。

先红：无数据ReadableStream旧等待直到外层200ms期限，目标断言要求内层“next SSE event”超时标签，实际outer test control，明确失败；修复后20ms内层超时与已resolve信号正常控制均通过。`node --import tsx --test src/server/local-web-server.test.ts` 28/28；typecheck／arch:check／npm test／build保存于`04-bounded-waits/`。不以测试runner超时或异常启动算拦截成功；有意等待abort的来源替身仍由finally stopActiveReads释放。

## 5 迁移与测试退役清单

`hybrid-read-composition.test.ts`不再new Google search／facts／availability或直接手拼Hybrid读取组件。Google-only受控组合使用生产factory；两个真实使用者（此文件和Router harness）才提取共享外部样本／模型替身到`src/harness/restaurant-read-test-fixtures.ts`，不新增Runner／平台。完整组合入口类型不接受unit端口覆盖；部分端口仅由明确命名的Router helper接收，不作为Adapter链路证据。显式限额覆盖已进入对应完整测试名，产物runCeilings改取组装返回值；取消中的Google计量控制也从旧无限上限更新为实际100。

| 原测试／重复组装 | 处置与原因 | 当前行为覆盖 |
| --- | --- | --- |
| `an adapter-only evaluation coordinate reproduces the old wiring failure...` | 删除；仅为已退役私有Google配置重建接线，不再保留该选项 | 同文件无位置不调用来源＋显式位置进入State的成对真实组装测试；Web设备位置测试继续 |
| Google search＋composeLiveRestaurantFactRead＋LiveBrowserAvailability手工组装 | 全部删除，合并到共享production factory调用；不复制旧6/12/24预算 | 同名保留的独立样本、分批、顺序、刷新、取消、来源失败、真实读取→Evaluator及产物捕获测试 |
| permitted alternate time | 移入既有`restaurant-execution-router.test.ts`，不删行为断言 | `Router partial-port contract: an explicitly permitted alternate time...`；只证明请求绑定／状态 |
| fresh inventory before facts | 同上，原先用部分端口，不应称完整生产来源组合 | `Router partial-port contract: fresh request-bound inventory...` |
| time delivery reserve | 同上 | `Router partial-port contract: default delivery...` |
| model-call delivery reserve | 同上 | `Router partial-port contract: model-call delivery reserve...` |
| C0b provider-read reserve | 同上 | `Router partial-port contract: C0b reserves...` |
| C6a source-hours completion | 同上；保留实际Google/website观察，库存端口只做可达性哨兵 | `Router partial-port contract: C6a observed public hours...` |
| completed-outlet reserve checkpoints | 同上；保留partial接受/UNKNOWN断言 | `Router partial-port contract: reserve checkpoints...` |

新增检错不是数量增长：迁入真实生产外层后，原Google quota控制发现SourceAwareFactRead丢失googleRequests／failureCode，State未记录EXHAUSTED（red-metadata.log）。只透传已有元数据，不改策略；同一100正常／1耗尽控制修复后通过，仍实际到达独立浏览器。原有限变异四项的正常／错误目标断言继续运行通过，不接受任意运行异常。`01-assembly`旧12阈值隔离红绿也作为退役后的预算接线覆盖，不另造一份实现形状断言。

命令：`node --import tsx --test src/eval/restaurant/agent-loop/hybrid-read-composition.test.ts src/harness/restaurant-execution-router.test.ts`（85/85）。四条门禁与因fact Adapter接线变化追加的完整Chromium门禁日志在`05-retirement/`；默认881/881。删除一条旧实现控制，七组行为迁层保留，未用测试数增减验收。

## 6 CDP所有暂停请求按策略准入

Request阶段任何continueRequest前，独立于redirectedRequestId／expectedRedirectTargets，检查原有origin、method、resource type、URL及字段规则；失败立即Fetch.failRequest。跳转标记只用于链计数；原10跳／时间／Replay限制不变。不新增来源、Other类别、公共POST或敏感GET例外。

原生规范化尝试：在隔离旧Guard上用真实Chromium A→A/normalize-hop→禁用B，尝试fragment、字面dot-segment、编码dot-segment、percent-escaped字母、escaped query、反斜杠、UTF-8路径编码、protocol-relative。八种写法第一跳均实际到达A/normalize-hop，B零到达，均被已有后续检查拒绝；**未复现“缺失redirect标记的原生跳转逃逸”**。按指令允许的未复现分支交付，不制造CDP事件冒充复现。red-confirmed.log／green-targeted.log逐项记录。

额外有限检错：只在测试context移除普通route，不手工调用handler或注入CDP事件。先让允许的A/page真实到达，再分别发出未准入origin的document、同源普通POST、对仅允许stylesheet路径的document。旧CDP把无跳转标记的请求直接continue，三个禁用接收端各实际收到1次（目标断言红）；修后各0且有BLOCKED诊断。正常A/page必须到达，不是全拦。原CSS正确类型、公开跳转URL／相对路径／cookie／逐跳录制、iframe／popup／worker继续通过。

新增检查初次误拒worker入口：Fetch.resourceType=Other，而Playwright使用同一请求的Network.requestWillBeSent类型Script。改为按networkId使用相同权威类型；缺证据仍拒绝Other，未按后缀／来源／任意header猜类型。worker-diagnostic.log保存误拒，worker-network-type.log保存正常worker与跨源fetch拒绝对照；正常控制须实际读取worker脚本，等待增加错误及2秒有界出口。首次Unicode未编码HTTP头是Node样本错误，red-cdp-and-attempts.log保留且排除检错；修正后red-confirmed.log只剩三个目标断言失败。

命令：`node --import tsx --test --test-name-pattern='T1 native redirect|T1 CDP' src/harness/browser/read-network-redirect.test.ts`（隔离旧Guard红）；完整文件绿26/26。`06-cdp/`保存typecheck、arch:check、npm test（881/881）、build和最终独立browser.log（112/112，221792ms），全部全绿。仅本地两个HTTP receiver／真实Chromium，无外部见证GET、Google、付费模型或Live。

## 门禁与提交索引

| 项 | 本地提交 | 红／绿日志目录 | typecheck | arch:check | npm test | build | test:browser:fixture |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 共享组装 | dcc1ad3（Hybrid续由第5项完成） | `01-assembly/` | PASS | PASS | 880/880 | PASS | 100/100 |
| 2 浏览器门禁／Fixture | c256cc2 | `02-browser/` | PASS | PASS | 879/879 | PASS | 100/100 |
| 3 Web并发 | 7b048bd | `03-web-owner/` | PASS | PASS | 881/881 | PASS | 不触发；浏览器机制未变 |
| 4 有界等待 | 7626b89 | `04-bounded-waits/` | PASS | PASS | 882/882 | PASS | 不触发；仅Web测试同步 |
| 5 退役／迁移 | 4baf329 | `05-retirement/` | PASS | PASS | 881/881 | PASS | 100/100 |
| 6 CDP | 提交后补号 | `06-cdp/` | PASS | PASS | 881/881 | PASS | 112/112 |

各项实际四条命令为`npm run typecheck`、`npm run arch:check`、`npm test`、`npm run build`，对应目录同名log；第1/2/6项及因fact Adapter接线变化的第5项额外运行`npm run test:browser:fixture`。不以默认测试替代Chromium。无skip/todo隐藏。原始日志保留测试框架空白字节，源码／文档另做diff格式检查。各项红灯均核对目标行为断言，样本错误单列。

## 两种宿主与外部边界

内存 Hybrid 与 Postgres Web 的任务持久化／HTTP-SSE生命周期仍不同。T1 统一读取组件和额度；不会把 Runner Live 视为 Web/Postgres Live 证据。本批只用固定外部模型传输、HTTP和页面、真实本地 Chromium；用户试用前是否补 Web Live 由用户后续决定。
