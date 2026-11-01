# 组装门禁停止点 1 复核与停止点 2 指令

- 复核时间：2026-11-01 CET（维也纳，UTC+1）
- 对象：`codex/chore-eval-assembly-gate` @ `8743f56b`，报告 `.eval-artifacts/phase3b/eval-assembly-gate/stop1-report.md`，基线 main `6db445ea`
- 复核方法：读完整报告，并对照代码抽查。抽查了以下几处：
  - G1 评测的直接导入点；
  - Web 的 G1 追问测试夹具；
  - A 的 G6 离线预检；
  - `.eval-artifacts` 下脚本的导入情况。
- 本次未运行任何门禁，也未调用模型或访问网络。

## 结论：停止点 1 通过，停止点 2 按下面修正后的范围进行

报告逐入口盘点，分类克制，边界写得清楚。抽查的结论全部属实。

| 抽查项 | 结果 |
| --- | --- |
| G1 评测直接构造核心（`fact-qa/core-adapter.ts`） | 属实。手造 HIGH 身份（`LOCAL_CONSTRUCTED_REVIEWED_PAGE_BINDING`），直接 `new ModelRestaurantPageQuestion`，没有 `readPages` |
| Web 的 G1 追问夹具自称完整组装（`local-web-server.test.ts` 第 1524 行起） | 属实，**这是本次最重要的发现**，见下文 |
| A 的 G6 离线预检走生产组装 | 属实。`g6-development-preflight.ts:147` 调用 `createLiveReadAssembly`（A 分支 `02d01196`） |

### G1 缺口其实有两层没拦住

- **第一层：** 评测 Runner 直接绑定页面，复核时已经知道。
- **第二层：** `questionSessionFixture` 的注释写着“Full persistent HTTP composition; only model transport and merchant browser I/O are fixtures”。实际上它自己 `new GoogleListedWebsiteFactRead`，跳过了生产中的 `GoogleThenWebsiteFactRead`，并且在 search 里主动调用 `inspectFacts` 预热页面缓存。
  - `capturePagesOnly` 缺口恰好藏在被跳过的那一层，所以 G1 的 Web 测试全绿。
  - 测试自称的范围与实际范围不符。这比“没有测试”更危险，因为它让人以为已经覆盖了。

B1 的 HTTP 组合测试（第 1794 行）属于同一类：手工构造业务 Port，自己生成 evidence 和缓存。好在第 1900 行另有一条真正走组装的正常控制。

## 原指令范围的三个漏洞（复核者的疏漏，停止点 2 一并修正）

1. **`.eval-artifacts` 下的评测脚本完全不在门禁内。**
   - 仓库跟踪了 403 个 `.eval-artifacts` 脚本，其中 169 个导入生产模块。
   - 3b 的能力评测几乎都在这里，例如：
     - `phase3b/g4-japanese-wiring/run-product-replay.mjs`（名字叫 product replay）；
     - `phase3b/g4-japanese-directed-20261031/evaluate-case.mjs`；
     - `phase3b/g1-revision/verify-saved-page.ts`。
   - 抽查的这些脚本**没有一个调用 `createLiveReadAssembly`**，都直接构造 Tabelog availability、named query、page question 等核心。
   - `arch:check` 只扫描 `src/**/*.ts`。按原指令只管 `src/eval`，门禁上线后这类脚本照样能写、照样能拿来签收。
2. **非 eval 目录中自称组合的测试不在门禁内。** 即上面的 Web G1 夹具和 B1 HTTP 组合测试。导入规则拦不住它们，因为它们本来就在 `src/server` 下，导入生产模块是正常的。
3. **`.mjs` 文件不在扫描内。**

不打算用代码门禁去管 403 个历史脚本：大部分是一次性诊断，逐个登记白名单没有意义。改为两条规则配合：

- **代码门禁：** 管 `src/eval/**`，`.ts` 和 `.mjs` 都管。
- **签收规则：** 写进 3b 的两级签收条款。**能力签收的证据只能来自 `src/eval` 下通过组装门禁的入口；`.eval-artifacts` 下的脚本只能作为组件证据或诊断证据。** 这样，在 `.eval-artifacts` 里绕过组装不会被代码拦住，但它的结果不能用来签收能力。

## 能力核心名单（复核者确认）

**纳入禁入集合**（报告第 197 节前六行）：

- **G1 问答与取页：** `model-page-question`、`page-question-reader`、`page-question-read-budget`、`fact-page-binding`
- **来源事实与 HARD：** `live-restaurant-facts`、`google-then-website-facts`、`google-listed-website-facts`、`native-source-facts`、`model-fact-judgment`、`model-source-facts`
- **候选发现与查询：** `google-places-restaurant-search`、`native-restaurant-search`、`native-read-composition`、`discovery-retrieval-planner`、`named-source-query`
- **查位与来源链：** `live-browser-availability`、`availability-source-resolver`、`native-outlet-continuity`、`tabelog-browser-availability`、`tablecheck-browser-availability`
- **身份解析：** `outlet-identity`、`detail-identity-fields`、`tabelog-entity-resolver`、`tablecheck-entity-resolver`
- **预约链接：** `tabelog-booking-handoff-reader`

**不纳入：**

- 页面解析和完成条件，即 `*-page-parser`、`tabelog-query-controls`、`*-vacancy-response`、`*-availability-response`。它们是纯函数，DOM 改版测试正当地直接使用。纳入只会让白名单膨胀，不会多拦住一次绕过。
- Domain 和执行核心：`semantic-interpreter`、`agent-decision`、`browser-action-decision`、`browser-task-executor`。语义评测和决策回放本来就是各自层级的组件评测，有独立的签收口径。

**其他口径：**

- **`import type` 不受禁**，因为它不产生运行时调用。值导入一律受禁，包括未使用的值导入。
  - `run-hybrid-live-read.ts:22` 和 `run-native-fixed-source-model.ts:10–11` 改为 `import type`，或删除未使用的导入。
  - 这是机械清理，不改行为，本批可以做。
- 白名单按“文件 + 核心模块”逐条登记，不按目录或整个文件放行。G1 的条目写的是 `fact-qa/core-adapter.ts`，不是 `run-bound-questions.ts`。

## 三个“应走组装但没走”的处理

| 入口 | 处理 | 负责 |
| --- | --- | --- |
| `SF/`（搜索 fixture 纵向 Runner 和 application） | 先查清：当前有没有任何签收、门禁或文档依赖它？没有依赖就按 AGENTS.md 删除（已被替代的 Runner 不保留）；有依赖就停下报告 | 测试优化对话，作为停止点 2 的一部分 |
| Web G1 夹具（`local-web-server.test.ts:1524` 起） | 注释改为如实描述实际范围，注明“不经过生产组装，不证明取页”。G1 的整组装覆盖由 A 的覆盖清单补一条走 `createLiveReadAssembly` 的 Web 测试，B 的修复会使它转绿 | 改注释：测试优化对话；补测试：A |
| B1 HTTP 组合（`local-web-server.test.ts:1794`） | 同上：注释如实描述实际范围。B1 的整组装覆盖认第 1900 行那条 | 测试优化对话 |

## 停止点 2 指令（给测试优化对话）

在 `8743f56b` 的基础上同步最新 main，继续使用同一分支。

1. **门禁规则：**
   - 在 `scripts/arch-check.ts` 的现有扫描流程中，扫描范围扩展到 `src/eval/**/*.mjs`，包括相应的路径规范化。
   - 新增规则：`src/eval/**` 不得值导入上面确认的核心模块；`import type` 除外。
2. **白名单：** `src/eval/assembly-bypass-allowlist.json`，严格解析，拒绝未知键，拒绝陈旧条目（被登记的文件不再导入被登记的核心时，判为失败）。每条写明：
   - 文件；
   - 核心模块；
   - 类别：只能是“组件评测”；
   - 它证明什么；
   - 它不能用于哪项能力签收。

   按报告的“组件评测”项逐条登记，“其他：已走组装”的项不进白名单。
3. **机械清理：** 两处未使用或仅作类型的值导入，改为 `import type` 或删除。
4. **SF：** 按上表处理。
5. **注释：** Web G1 夹具和 B1 HTTP 组合测试的注释改为如实描述，不改断言。
6. **红灯**（原指令的三条，再加一条）：
   - 新增一个直接导入核心的 `.ts` 评测文件，`arch:check` 失败；
   - 新增一个同样的 `.mjs` 文件，`arch:check` 失败；
   - 加入白名单后，`arch:check` 通过；
   - 从白名单删去 `core-adapter.ts` 那一条，`arch:check` 失败；
   - 白名单留一条陈旧条目，`arch:check` 失败。
7. **Test Skill：** 只加一条：说明组装门禁和白名单的含义，并写明“能力签收证据只能来自 `src/eval` 下通过门禁的入口；`.eval-artifacts` 脚本只算组件或诊断证据”。
8. 五门禁全绿，每项前后 `git status` 为空。推送分支，不合 main，交复核。真实调用 0。

## 给对话 A 的补充（并入下一次给 A 的指令）

- 覆盖清单中，G1 一项不能认 `local-web-server.test.ts` 的 `questionSessionFixture` 测试。它不经过生产组装，要补一条走 `createLiveReadAssembly` 的 Web 追问测试。
- B1 一项认第 1900 行的组装控制，不认第 1794 行。
- G4 一项：3b 的 G4 基准和日文名评测都在 `.eval-artifacts`，直接构造核心，只能算组件证据。覆盖清单中 G4 的整组装测试按缺口处理。
- G6 Runner 和独立评测器合入前，要通过组装门禁。
