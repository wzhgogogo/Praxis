# TableCheck B1 普通组装接线修复

- Status: offline verified candidate / not integrated；推工作分支交复核，不合 main。
- 时间：2026-11-01，维也纳 CET（UTC+1）。
- 分支：`codex/fix-phase3b-tablecheck-b1-composition`。
- 基线：B 已发布取页修复 main `fceecaad717eea21f7642f1b0b1cf35b0aea218e`；没有先在旧 main 实施。
- 模式：构造模型/来源 I/O + 真实本地 Chromium + 持久 PGlite/应用，不是网站 Replay、真实模型、外部 Live 或真实 PostgreSQL 验收。

## 闭合的产品链路

普通 `createLiveReadAssembly` 现在同时提供 Tabelog 和 TableCheck 来源读取器。TableCheck 实际核实同店可用时段后，首次展示即有同店 B1 交接；用户选定该店后仍有交接。读取器不导航、不新开额外会话/取页、不进行动作，只旁听原有 snapshot 和 observeControls 的返回。红绿初始来源 I/O 都是 5 次，逐项相同，未增加请求或模型调用。

选择**并列两个来源读取器**：Tabelog 依据已绑定的响应原链接，TableCheck 依据可见启用的 LINK 入口及确定性参数，两者证据生产方式不同。此选择保持原 Tabelog 读取器原字节，不为接入另一渠道重构其响应/缓存逻辑；组装仅嵌套 capture、串接既有 runtime、聚合 readPrepared。

TableCheck 缓存以根任务隔离，只保留本次 AVAILABLE、HIGH 身份、同源页和证据 ID 绑定的入口，带请求指纹与到期时间。入口已带日期/人数/时刻时，矛盾即拒绝；普通同店入口可以复用原确定性 serializer 补入实际 offer 的精确时刻，绝不从宽窗推测。生成时 `prepareBookingHandoff` 与展示前 `withBookingHandoffs` 的原双校验均保留。条款/费用没有新证据就不添加。

## A 原测试的因果红绿

A `02d01196` 原测试 `G6 B1 TableCheck whole read composition emits a same-shop filled-in handoff after real availability` 连同最小 helper/页面/JSON 闭包共5文件原样引入。主线原本没有 helper，若只拷测试会变成模块错误；因此导入完整最小依赖，但不修改任何 A 字节。`a-imports.json` 保存五份 SHA，测试 SHA 为 `532f861f3848d2f7e438ab07221ca10cdbbf0b8ca1a62a55915752973a6fb89b`。

| 阶段 | 输入冻结/实现提交 | 实际结果 | 原件 |
|---|---|---|---|
| 红 | `e2de4d99`，729项；产品保持 main 原字节 | exit1；PRESENT_RESULTS、同店 EXACT_PHONE、AVAILABLE，但 handoffs=[]；原断言 Initial ordinary source cache must produce B1 失败 | `red/test.log`、`red/preflight.json`、`red/result.json` |
| 修复 | `ce6f02a6` | 新 TableCheck 读取器与普通组装接线；原 Tabelog/B G3/领域/A 断言不改 | 产品与测试 Git 差异 |
| 绿 | `ce6f02a6`，732项 | A 原测试 exit0，输入/断言 SHA 不变 | `green/test.log`、`green/result.json` |
| 实际绿产物 | 同一未改 A helper 独立驱动，未注入 prepared 对象 | 初始展示及选店后均有一个 TableCheck 交接；实际 Router/Reducer、证据和持久应用投影 | `green-composition/preflight.json` |

实际交接：

```text
https://www.tablecheck.com/en/shops/g6-development-sushi/reserve?start_date=2026-11-11&num_people=2&start_time=19%3A00
Continue on TableCheck — date, time, 2 guests filled in
Check date and guests
```

日期 2026-11-11、2 人、19:00 与冻结构造输入、同店 EXACT_PHONE 证据和实际 offer 一致；选店前后 candidateId/offerId 绑定不变。`sourceSelection=UNKNOWN`，没有 selected/booked 声明。URL只由原观察入口与已核实参数生成，没有模型/客户端 URL，也没有前往 reserve 入口“验证”链接的额外请求。

`verify.py` 独立按字面预期、实际投影、offer 和 evidence 核对这两阶段；不调用生产链接生成器进行自证。原来源 I/O 只有本地注入 Google transport 与本地拦截浏览器响应；绿产物保留9个脚本化模型请求/响应，真实模型调用0。

## 反例及保留范围

新增组件套件 17/17：错店、错日期、错人数、错精确时段、域名错误、review/payment/account路径、重复参数、redirect参数、缺链接、隐藏/禁用链接均拒绝交接；宽窗缺精确可用时刻也拒绝。根任务隔离、当前读取失去入口后的失效、过期、无根范围和二次展示校验继续故障关闭，投影没有 I/O。

这些反例是组件控制，故意保持合成 AVAILABLE 上下文以隔离来源缓存/链接边界，**不冒充完整组装阴性或 Live 证据**。完整组装阳性由 A 原测试及实际持久应用产物证明。正常组件输入本身有19:00–19:30请求窗及19:00精确 offer，证明宽请求有精确证据时仍可交接。

源码差异仅：新 TableCheck 读取器、其 C 自有测试、`live-read-assembly.ts`，以及 A 五个原样导入文件。八个保护文件（B 的三份 Tabelog G3、两份 TableCheck G3、原 Tabelog 读取器、领域与应用双校验）逐字等于 main；A 其余 eval/harness、前端、State/TaskDefinition/Prompt/Schema不变。现有 Tabelog 普通 HTTP 组装的原 URL/拒绝/隔离回归随默认套件原样通过。

## 门禁与首轮失败

首轮 `23e12948` 的 typecheck 发现 C 组件测试把 readonly evidence 数组直接赋给 mutable 字段（TS4104）。原失败/日志/冻结清单保留于 `gates.json`、`gates/`、`attempt1-freeze.json`；不是 A/产品故障。仅把 C fixture 改成数组复制，值和断言不变，未改产品实现，再以 `34c2b4bc` 冻结740项。不是原样重跑碰绿。

最终完整门禁见 `attempt-2/gates.json`，8步（含前后完整性）每项前后 git status 为空：

| 门禁 | 结果 |
|---|---|
| typecheck / arch:check / build | PASS |
| 默认 npm test | **1306/1306**（含 A 原测试与 C 组件） |
| 完整 Chromium fixture | **187/187**，130.107秒 |
| 标准 G2（fixture 首组独占） | **5/5** |
| 严格 G2 | **5/5 测试、12/12 页面 PASS** |
| 输入/原件/原保护文件/独立产物核对 | PASS |

无 skip/todo/cancelled。原始日志按字节保留；最终追加仅报告/状态/产物摘要，不改变已测产品或输入。

## 四层评价与资源

1. 用户目标：本地普通组装从 TableCheck 已核实空位接到可见 B1，首次展示即有，不等待选店/比较。真实站点兼容、实际预填和预约成功未评。
2. 逐环节：构造 Google/页面 → 生产身份/查位 → 持久应用/Router/Reducer → 来源缓存 → 第一次校验 → 投影第二次校验 → filled-in 文案均有实际产物。没有直接构造 candidate/offer/evidence/prepared 对象制造整组装绿。
3. 严重程度/边界：本地输出同店、日期/人数/精确时段和原入口有支持；拒绝边界分项覆盖。无真实外部写入口、无 review/确认/支付/账户访问、无虚构 selected/booked；不将此称作 Live S0=0 或全 Guard/F6 认证。
4. 归因与资源：缺口是生产组装只安装 Tabelog 缓存。新实现不增加原初始I/O；首次门禁失败属于 C 测试类型构造，已与产品因果红分开。真实模型/Google/网站GET/Live/真实Postgres均0，不读取或加载.env、不读私有Holdout/QA答案。

共享账本按ID合并main 505条与A 505条（共同504条），再加本轮C零调用记录，共507条；既有记录逐值保留。累计仍为真实模型171/1600、评测GET255/290、Google12、Live0/26、环境0/4。构造I/O和fixture模型不冒充真实额度使用。证据见 `budget-preservation.json`。

完成后按授权推送工作分支、ls-remote核对并通知 A；保持未合main，停下等复核。
