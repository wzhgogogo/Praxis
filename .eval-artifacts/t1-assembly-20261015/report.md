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
| 1 | 组装漂移、累计>12后误拒绝、记录不等于实际限额 | `01-assembly/red-retired-cap.log` 预算断言红；`green-restored.log` 2/2 | 生产入口已统一；旧Hybrid迁移／退役随第5项核对 |
| 2 | 过时 Fixture 隐藏完整浏览器链路红项 | `02-browser/red.log` 两项目标资格断言失败；`green-targeted.log` 2/2 | 完成：默认879/879、Chromium100/100，typecheck/arch/build通过 |
| 3 | 当前进程语义调用被查询误判成上个进程中断 | 待补 | 未开始 |
| 4 | 外部信号永不达到时测试挂起 | 待补 | 未开始 |
| 5 | 旧手工组装重复覆盖／不再验证当前链路 | 待补 | 未开始 |
| 6 | CDP 无法识别跳转时未核对策略便放行 | 待补 | 未开始 |

## 2 浏览器必跑门禁与动态 Fixture

修复前两个真实 Chromium 场景均返回零候选，目标 availability 断言失败。原因是 ADR-0040 后必须由模型选择已观察地区入口；旧替身只选日期／人数，列表也缺地区标题。补充观察入口选择和来源地区标题，原身份、HARD、请求绑定、事实替代、库存和展示断言保留。未删除用例或放宽资格。

Test Skill 1.4 将执行器、Guard、Source Pack、浏览器 Adapter 和读取组装列为 `test:browser:fixture` 的触发范围，并要求与四条代码门禁并列、全绿。

## 1 生产读取组装与显式限额

`src/integrations/restaurant-search/live-read-assembly.ts`为唯一生产组装根。Live Runner、Web、native固定来源Runner、native组合、动态Chromium H001和current-development固定来源均使用它；同一调用创建找店／事实／查位、一个browserBudget、Router和loop选项。运行结果runCeilings直接取返回值。Google-only控制显式选已有Google Pack，不是第二套组装。旧Hybrid组合迁移在第5项完成核对。

P2-0遗留loop三默认、Router两默认、Executor 300000ms默认及native facts 4/24全部移除；直接低层调用者显式给限额。事实链原先忽略配置并重写6/12/24也已接通。独立Mock Harness和底层单元测试保留显式12步／3拒绝／30秒等控制值，不是Live默认。共享基线增加总模型50、找店10候选及事实4/24/45000/30000，仍只维护一份预算。

检错：在`/private/tmp/praxis-t1-red-QdUozy`临时detached工作树应用当前源码，**仅把传给native发现的全局模型上限恢复为旧12**（旧签名不能直接checkout）；实际查位Fixture产生>12次调用后再找店，目标业务断言以BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED失败。恢复配置后同测试及Runner/Web返回值逐项对照通过。没有在主工作树回退、手填计数或提交破坏。

命令：`node --import tsx --test --test-name-pattern='T1 production assembly shares|T1 Runner and Web' src/eval/restaurant/agent-loop/native-discovery-composition.test.ts`。`01-assembly/`保存隔离红／绿、受控执行17/17和门禁日志：typecheck、arch:check、npm test（880/880）、build及Chromium（100/100）全绿。对照比较实际factory返回的限额、Router／loop和独立整单预算；两宿主源码均从同一次返回接线，不是比较两份常量。

## 两种宿主与外部边界

内存 Hybrid 与 Postgres Web 的任务持久化／HTTP-SSE生命周期仍不同。T1 统一读取组件和额度；不会把 Runner Live 视为 Web/Postgres Live 证据。本批只用固定外部模型传输、HTTP和页面、真实本地 Chromium；用户试用前是否补 Web Live 由用户后续决定。
