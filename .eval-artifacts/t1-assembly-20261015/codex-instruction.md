# T1：统一组装、浏览器门禁与 Web 入口修复

状态：已写好，**等 P2-0 复核通过后再开始**。复核者 2026-10-15 写于 P2-0 执行期间；开始前先 `git pull --ff-only`，并按第 0 步核对 P2-0 改动后的代码。

依据：`.eval-artifacts/review-eval-test-20261015/independent-review.md` 第二节（测试体系）。本批全部离线，**不跑 Live，不调用付费模型**。不改 Gold、变体、见证，不放宽交付资格，只读边界不变，本地提交，不推送。

## 为什么先做这一批

- 现在有三套各自组装的读取链路，参数已经漂移。找店额度 12 次的缺陷在离线测试中永远出现不了，原因就是组合测试不共享额度计数。
- 在组装统一之前，离线测试全绿不能说明 Live 或 Web 会正常。之后的评测器改造（E1）要离线重评第一阶段的运行，也依赖这一点。

## 0 开始前：核对 P2-0 之后的现状

P2-0 第 2 项已要求"所有组装入口显式传入限额、删除隐藏默认值、Runner 与 Web 生效限额相同"。先读 P2-0 的提交和报告，在汇报开头用一张表写明下面三处现在各自如何组装、生效限额是多少：

| 组装位置 | 当前做法（复核时） |
| --- | --- |
| Live Runner `run-hybrid-live-read.ts`（约第 395–455 行） | `composeNativeRestaurantRead` + `LiveBrowserAvailability` + `createHybridReadComposition`（后者在 `src/eval/` 下，内存 Runtime） |
| Web `local-web-server.ts`（约第 380–445 行） | `composeNativeRestaurantRead` + `LiveBrowserAvailability` + `PersistentRestaurantAgentApplication`（Postgres） |
| 组合测试 | `native-discovery-composition.test.ts`、`hybrid-read-composition` 相关测试、`current-development-offline.test.ts`、`browser-read-fixture.test.ts` 第 546 行、`run-native-fixed-source-model.ts` 各自手工传参 |

如果 P2-0 已经把其中一部分统一，本批只做剩下的部分，并在报告中说明。

## 1 一个生产组装函数，三处共用

**要求：**

- 在生产代码中（`src/application/` 或 `src/integrations/`，按 Arch Guard 判断；**不能放在 `src/eval/` 下**，因为 Web 不应依赖评测代码）提供一个组装函数，例如 `createLiveReadAssembly(config, transports)`：
  - `config`：唯一的限额来源，即现在的 `LIVE_READ_DEBUG_INVESTIGATION_BUDGET`（可改名，不新增第二份）；
  - `transports`：只包含外部边界，即模型、Google 客户端、浏览器运行时（或页面来源）、时钟、诊断回调；
  - 返回找店、事实读取、查位、Router 选项、循环选项和整单浏览器额度对象。这些是 Runner 和 Web 目前各自拼的部分。
- Live Runner、`local-web-server.ts` 和所有组合测试都改为调用它，**删除三处手工组装**。
- 任务宿主（Runner 用内存 Runtime，Web 用 Postgres 的 `PersistentRestaurantAgentApplication`）可以保持不同，但两者接收的读取组件和限额必须来自同一次组装调用。在报告中写明两种宿主仍然不同的地方。
- 测试需要改限额时，必须显式覆盖配置，并在用例名中写明覆盖了什么，例如 `maxAgentSteps=6`。不允许再出现"测试不传、落到默认值"的情况。
- 运行记录中的 `runCeilings` 直接来自这次组装实际使用的配置，不再单独抄写。

**先红后绿：**

- 用统一组装重写"查位等已累计超过 12 次浏览器调用后再找店"的组合测试。浏览器和模型用 Fixture，**额度对象必须与 Live 相同，整单共享**。
- 在本地临时回退 P2-0 第 2 项的修复，该测试必须失败。保存红灯日志后恢复修复，测试通过。回退只在临时工作树中做，不提交。
- 另写一条：Runner 组装和 Web 组装拿到的生效限额逐项相等（从组装结果读取，不是比较两份配置常量）。

## 2 涉及浏览器的改动必跑真实浏览器测试

- `npm test` 不包含 `src/harness/browser/`。真实 Chromium 测试只在 `test:browser:fixture` 中。
- **要求：** 改动涉及浏览器执行器、Guard、Source Pack、浏览器 Adapter 或本批的组装函数时，`test:browser:fixture` 是必跑门禁，结果在报告中单独写明。
- Test Skill 矩阵的"Provider/Browser Adapter"行（第 26 行）已经要求"操作 DOM 时加真实浏览器本地 Fixture"，但实际执行中一直被"四门禁"替代。仓库文档里没有"四门禁"的定义，所以要在 Test Skill 中写明：哪些路径的改动触发 `test:browser:fixture`，以及它与 typecheck、arch:check、npm test、build 并列汇报。不改成每次都跑，不另建第二份门禁清单。
- 本批改了组装，所以本批必须跑 `test:browser:fixture`。

## 3 Web 入口的并发问题（真实用户试用之前必须修好）

**问题**（复核者读代码确认，10/9 曾复现）：

- `persistent-restaurant-agent.ts` 的 `finishInterruptedLiveRead`（约第 1023 行）在每次 `project()` 时，把"不在 `activeReads` 中、阶段为 UNDERSTANDING / SEARCHING / SELECTION_REQUIRED"的任务判为 `EXECUTION_FAILURE`。
- 新任务先执行 `applyMessage`（约第 395 行），其中有一次语义解析的模型调用，耗时数秒；读取直到约第 833 行才登记到 `activeReads`。
- 在这段时间里，任何列表或查询请求都会把刚创建的任务判为"进程中断"。

**要求：**

- 只有在**上一个进程**中开始、当前进程没有接手的读取，才算中断。实现方式由你决定，例如在调用模型之前就登记，或者给每个读取记录进程标识。说明你的选择和理由。
- **先红后绿**（统一组装后的 Web 组合测试，模型用可控延迟的 Fixture）：
  - 语义解析尚未返回时发出列表请求：修复前任务被判为 `EXECUTION_FAILURE`（红），修复后任务继续并正常结束（绿）；
  - 反例：模拟进程重启后存在的未完成读取，仍然被判为中断。

## 4 测试中的无界等待

- `local-web-server.test.ts` 第 956、995、1164、1228 行的 `await restaurant.started` 没有超时。前置条件不满足时，测试会一直挂着，而不是失败。
- **要求：** 改为有界等待，超时时以明确信息失败。顺带检查同类写法（对 Promise 的裸 `await`，等待外部信号），一并修改，并在报告中列出。

## 5 测试退役

按 AGENTS.md 和 Test Skill 1.3 的标准：

- 删除统一组装后变得重复的手工组装测试；
- 只验证旧组装细节的测试同样删除。

报告中逐条列出删除或合并的测试、原因，以及哪条新测试覆盖了它的行为。不以测试数量增减作为目标。

## 门禁与汇报

- 每项单独提交。每项门禁：typecheck、arch:check、npm test、build；第 1、2 项另加 `test:browser:fixture`。
- DEVLOG、TEST-LOG、STATUS 同步。
- 汇报写入 `.eval-artifacts/t1-assembly-20261015/report.md`，内容包括：
  - 第 0 步的现状表；
  - 各提交号；
  - 各项红灯与绿灯日志（第 1 项含临时回退的说明）；
  - 门禁结果，`test:browser:fixture` 单列；
  - 删除测试的清单；
  - 两种任务宿主仍然不同之处。
- 本地提交，不推送，停下等待复核。

## 不在本批范围

下面几项留到后续批次，本批不做：

- 录制按页判定（L2）；
- 决策回放进入每批必跑（L3）；
- 评测器改造（E1）。

另有一个已知缺口：Live 评测只走 Runner，从不经过 Web 和 Postgres 宿主。真实用户试用之前是否要通过 Web 入口跑一次 Live，由用户届时决定；本批只需在报告中确认这一缺口仍然存在。
