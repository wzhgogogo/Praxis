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
| 1 | 组装漂移、累计>12后误拒绝、记录不等于实际限额 | 待补 | 进行中 |
| 2 | 过时 Fixture 隐藏完整浏览器链路红项 | `02-browser/red.log` 两项目标资格断言失败；`green-targeted.log` 2/2 | 完成：默认879/879、Chromium100/100，typecheck/arch/build通过 |
| 3 | 当前进程语义调用被查询误判成上个进程中断 | 待补 | 未开始 |
| 4 | 外部信号永不达到时测试挂起 | 待补 | 未开始 |
| 5 | 旧手工组装重复覆盖／不再验证当前链路 | 待补 | 未开始 |
| 6 | CDP 无法识别跳转时未核对策略便放行 | 待补 | 未开始 |

## 2 浏览器必跑门禁与动态 Fixture

修复前两个真实 Chromium 场景均返回零候选，目标 availability 断言失败。原因是 ADR-0040 后必须由模型选择已观察地区入口；旧替身只选日期／人数，列表也缺地区标题。补充观察入口选择和来源地区标题，原身份、HARD、请求绑定、事实替代、库存和展示断言保留。未删除用例或放宽资格。

Test Skill 1.4 将执行器、Guard、Source Pack、浏览器 Adapter 和读取组装列为 `test:browser:fixture` 的触发范围，并要求与四条代码门禁并列、全绿。

## 两种宿主与外部边界

内存 Hybrid 与 Postgres Web 的任务持久化／HTTP-SSE生命周期仍不同。T1 统一读取组件和额度；不会把 Runner Live 视为 Web/Postgres Live 证据。本批只用固定外部模型传输、HTTP和页面、真实本地 Chromium；用户试用前是否补 Web Live 由用户后续决定。
