# Test and Verification Log

- Status: Accepted
- Version: 3.0
- Last updated: 2026-08-10
- Source of truth for: 每次验证结果、模式、未覆盖项和外部副作用
- Related ADRs: [ADR Index](decisions/README.md)
- Related documents: [Test Skill](skills/test/SKILL.md), [Harness Design](harness/HARNESS-DESIGN.md)

## 2026-08-10 — Progressive Decision Model Contract verification

### Scope

Harness-only Progressive Decision Model Proposal Contract：版本化服务端Gateway请求、严格JSON/嵌套Schema、一次无效输出重试、禁止模型伪造Candidate Retrieval、Provider失败和输入边界。没有发起真实Provider请求。

### Checks

- `node --import tsx --test src/eval/restaurant-decision-eval-model-contract.test.ts`：6/6通过。请求为`JSON_OBJECT`、10秒、900 Token、`temperature: 0`、Thinking关闭、`FAIL_CLOSED`；无效输出只重试一次，Provider失败不重试，`retrievedCandidateIds`被Schema拒绝。
- `npm run typecheck`、`npm run build`、`npm run eval:decision:fixture`：通过。
- `npm test`：115 tests / 5 suites / 0 failed；本机`127.0.0.1`监听的Web/SSE回归在允许本机监听后通过。

### Modes

- Eval Model Contract / Fixture Gateway：通过。
- Progressive Decision Real Model、Replay、Live Read-only和Controlled Live-write：未运行。

### Safety

- Proposal不会写Task State、Authorization、Attempt或Outcome；Candidate Retrieval只能由独立只读Fixture/Search阶段产生。
- 未加载或输出任何DeepSeek Key、Prompt正文或真实用户数据。

### External side effects

0。只执行本地Fixture Gateway与类型检查。

## 2026-08-10 — Progressive Decision Evaluator Verification Set

### Scope

18个S0–S8单点Mutation和S7 Fixture多样性可满足性检查。没有调用DeepSeek、真实Discovery/Availability、Authorization、Adapter或外部写入。

### Checks

- `node --import tsx --test src/eval/restaurant-decision-eval-mutation.test.ts`：18/18通过。M01–M02在Preflight拒绝无效Dataset/过敏证据；M03–M18分别命中预期S1–S8首错阶段与错误码，包括`P0_HARD_CONSTRAINT_VIOLATION`和`FIXTURE_COVERAGE_GAP`。
- `npm run eval:decision:fixture`：通过，Strict Preflight为`READY_FOR_EVALUATOR`，7个Fixture Journey全部Pass。
- `npm run typecheck`、`npm run build`：通过。
- `npm test`：109 tests / 5 suites / 0 failed；本机`127.0.0.1`监听的Web/SSE回归在允许本机监听后通过。

### Modes

- Dataset Annotation、Strict Complete、Fixture Oracle、Evaluator Verification、Core/Contract、PGlite Integration和本机HTTP/SSE：通过。
- Progressive Decision Real Model、Replay、Live Read-only和Controlled Live-write：未运行。

### Safety

- 当Fixture本身不能提供Gold要求的多样性时，Scorer给出`FIXTURE_COVERAGE_GAP`，不把该问题计为模型选择失败。
- 真实模型、Web、Task Runtime、Authorization、Adapter和外部写路径未被调用或修改。

### External side effects

0。只执行本地Fixture、类型检查、构建、PGlite和本机HTTP/SSE测试。

## 2026-08-10 — Progressive Decision S6–S8 Fixture Oracle verification

### Scope

Golden Seed v0.7、S6 Candidate Retrieval、S7 Selection/Diversity、S8 Response Grounding和过敏候选卡“仍需餐厅确认”披露。全部为Harness-only：没有调用DeepSeek、真实Discovery、Availability、Authorization、Adapter或外部写入。

### Checks

- `npm run eval:decision:preflight:complete`：通过，`READY_FOR_EVALUATOR`；7个Pool、29个Candidate、417个Fact、7个Episode、17个Turn、17个Labeled、0个Pending、0个Issue。
- `npm run eval:decision:fixture`：通过。7个Journey均Pass；S1–S4各17个Pass，S5为5个Pass/12个`NOT_APPLICABLE`，S6为11个Pass/6个`NOT_APPLICABLE`，S7为10个Pass/7个`NOT_APPLICABLE`，S8为17个Pass。
- 定向Eval测试：23/23通过。覆盖Preflight的过敏披露Fact边界、Perfect Oracle，以及S1/S3/S5/S6/S7/S8的单点Mutation和首错归因。
- `npm run typecheck`、`npm run build`：通过。
- `npm test`：91 tests / 5 suites / 0 failed；本机`127.0.0.1`监听的Web/SSE回归在允许本机监听后通过。

### Modes

- Dataset Annotation、Strict Complete、Fixture Oracle、Core/Contract、PGlite Integration和本机HTTP/SSE：通过。
- Progressive Decision Real Model、Replay、Live Read-only和Controlled Live-write：未运行。

### Safety

- 明确不支持严重花生过敏的Fixture Candidate进入检索或选择时得到`P0_HARD_CONSTRAINT_VIOLATION`；不得用多样性掩盖。
- DGS06每个可展示候选均必须携带引用`attributes` Fact的确认披露；遗漏时在S8得到`RESULT_GROUNDING_REQUIRED_DISCLOSURE_MISSING`。
- Fixture Oracle通过只证明Dataset、Scorer与归因自洽，不代表DeepSeek或产品已经具备渐进决策能力。

### External side effects

0。只执行本地Fixture、类型检查、构建、PGlite和本机HTTP/SSE测试。

## 2026-08-10 — Eval-only Reducer and S1–S5 Fixture Oracle verification

### Scope

Eval-only State Reducer、S1–S5确定性Scorer、首错/Blocked归因、Fixture Oracle CLI和首批Mutation。新增结构化Prediction只在评测进程使用；不连接DeepSeek，不修改生产Task State、Authorization、Command、Web、Adapter或外部执行。

### Checks

- `npm run eval:decision:fixture`：通过。Strict Preflight为`READY_FOR_EVALUATOR`；Fixture Oracle对7个Episode全部Pass，S1–S4各17个Pass，S5为5个Pass、12个`NOT_APPLICABLE`。
- 定向Eval测试：19/19通过；包括Reducer修正/清除/不变性、Perfect Oracle、S1/S3/S5单点Mutation首错归因和缺失Prediction fail closed。
- `npm run typecheck`、`npm run build`：通过。
- `npm test`：87 tests / 5 suites / 0 failed；本机`127.0.0.1`监听的Web/SSE用例在允许本机监听后通过。
- Markdown相对链接检查：通过。

### Modes

- Dataset Annotation、Strict Complete、Fixture Oracle、Core/Contract、PGlite Integration和本机HTTP/SSE：通过。
- Progressive Decision Real Model、Replay、Live Read-only和Controlled Live-write：未运行。

### Safety

- 任何缺失Prediction被fail closed；评分器仅计算报告，不能写Task State、Authorization、Attempt或Outcome。
- `BLOCKED_BY_UPSTREAM`不被重复计为下游根因；Fixture Oracle通过不报告为真实模型分数。

### External side effects

0。只执行本地Fixture、类型检查、构建、PGlite和本机HTTP/SSE测试。

## 2026-08-10 — DGS06 completion and strict Golden Seed verification

### Scope

Golden Seed v0.6及DGS06四个Turn：无日期宽泛Dinner保留、无地理锚点Flexible追问、人数范围修正、严重花生过敏候选呈现与敏感信息披露Consent边界。Preflight Contract调整为允许无日期`DAYPART`，其他已知时间精度仍要求日期。没有修改生产Parser、Web、Runtime、Adapter或外部写路径。

### Checks

- 定向`restaurant-decision-eval-preflight.test.ts`：15/15通过；新增覆盖无日期`DAYPART`保留与Exact仍需日期、无锚点Flexible追问、过敏请求备选、明确不支持排除及敏感披露未同意前不得提交。
- `npm run eval:decision:preflight`与`npm run eval:decision:preflight:complete`：均通过，`READY_FOR_EVALUATOR`；7个Pool、29个Candidate、417个Fact、7个Episode、17个Turn、17个Labeled、0个Pending、0个Issue。
- `npm run typecheck`与`npm run build`：通过。
- `npm test`：83 tests / 5 suites / 0 failed；本机`127.0.0.1`监听的7个Web/SSE用例在权限允许后通过。未授权沙箱首次运行的7项`EPERM`仅为监听限制，不是代码失败。
- Markdown相对链接检查：通过。

### Modes

- Dataset Annotation Draft、Strict Complete / Fixture Preflight、Core/Contract、PGlite Integration和本机HTTP/SSE：通过。
- Progressive Decision Real Model、Replay、Live Read-only和Controlled Live-write：未运行。

### Safety

- Fixture中“可接受过敏请求”不被表述为可安全接待；来源有处理流程也仍须餐厅确认；明确不支持严重花生过敏的候选被排除。
- Consent Card目前只作为Golden/Eval和设计门禁：未获用户对外披露过敏信息的确认，不得提交预约或过敏请求。

### External side effects

0。只执行本地类型检查、构建、Fixture Preflight、PGlite和本机HTTP/SSE测试。

## 2026-08-10 — DGS05 core-ready recommendation verification

### Scope

Golden Seed v0.5及DGS05四个Turn的Gold：开放约会需求、最小澄清、核心字段闭合即推荐、不得虚构口味排除、宽泛Dinner下的候选/Slot陈述，以及反馈后收敛为非套餐的亲密用餐选项。没有修改Contract、Schema、Preflight、Reducer、Scorer或生产代码。

### Checks

- 定向`restaurant-decision-eval-preflight.test.ts`：13/13通过；新增覆盖不从约会推断人数、只补地点、无“不吃辣”反馈时辣味候选仍合格、以及后续非套餐反馈的收敛结果。
- `npm run eval:decision:preflight`：通过，`READY_FOR_ANNOTATION`；7个Pool、29个Candidate、417个Fact、7个Episode、17个Turn、13个Labeled、4个Pending，0个Issue。
- Markdown相对链接检查：通过。
- `npm test`与`eval:decision:preflight:complete`：按Golden Seed分级验证规则未运行；本轮没有触发全量回归条件，且4个Pending为已知状态。

### Modes

- Dataset Annotation Draft / Fixture Preflight：通过。
- Strict Complete、Real Model、Replay、Live Read-only和Controlled Live-write：未运行。

### Safety

- 未表达的“不吃辣”不进入State或候选排除条件；Fixture Slot不被描述为用户确切时间匹配、真实有位或已可订。
- 候选、偏好、容量、属性和Slot均来自虚构Fixture，没有模型调用或外部执行。

### External side effects

0。只执行本地定向测试、Fixture Preflight和Markdown检查。

## 2026-08-10 — DGS04 Gold targeted verification

### Scope

Golden Seed v0.4及DGS04三个Turn的Gold：最小核心追问、8人容量过滤、宽泛Dinner推荐、安静排序偏好、全面禁烟硬约束和反馈后候选收敛。没有修改Contract、Schema、Preflight、Reducer、Scorer或生产代码。

### Checks

- 定向`restaurant-decision-eval-preflight.test.ts`：12/12通过；新增覆盖T01不提前检索、T02排除容量不足候选、T03排除吸烟区并禁止把Hachi声称为已证实安静。
- `npm run eval:decision:preflight`：通过，`READY_FOR_ANNOTATION`；7个Pool、29个Candidate、417个Fact、7个Episode、17个Turn、9个Labeled、8个Pending，0个Issue。
- Markdown相对链接检查：通过。
- `npm test`与`eval:decision:preflight:complete`：按Golden Seed分级验证规则未运行；本轮没有触发全量回归条件，且8个Pending为已知状态。

### Modes

- Dataset Annotation Draft / Fixture Preflight：通过。
- Strict Complete、Real Model、Replay、Live Read-only和Controlled Live-write：未运行。

### Safety

- 候选、容量、氛围、禁烟属性和Slot均来自虚构Fixture；没有模型调用、真实Availability或外部执行。
- 不把软偏好伪装成候选硬事实，也不为推荐数量放宽用户明确的禁烟约束。

### External side effects

0。只执行本地定向测试、Fixture Preflight和Markdown检查。

## 2026-08-10 — DGS03 outlet discovery and approximate-time verification

### Scope

Golden Seed v0.3、DGS03两Turn Gold、Outlet Discovery Oracle、Approximate Time、Outlet Name Fact、Sora干扰候选和Golden Seed分级验证流程。没有修改生产Parser、Prompt、Web、Task Runtime、Restaurant State、数据库Schema或Provider Adapter。

### Checks

- `npm run typecheck`：通过。
- `npm run build`：通过。
- 定向`restaurant-decision-eval-preflight.test.ts`：11/11通过；新增覆盖检索后才可见的Outlet集合、Discovery/Eligibility分离、Approximate 19:30、禁止发明Window和非目标餐厅过滤。
- `npm test`：79 tests / 5 suites / 0 failed；既有HTTP/SSE测试使用本机`127.0.0.1`临时监听，其余为本地Fixture/PGlite路径。
- `npm run eval:decision:preflight`：通过，`READY_FOR_ANNOTATION`；7个Pool、29个Candidate、417个Fact、7个Episode、17个Turn、6个Labeled、11个Pending，0个Issue。
- `npm run eval:decision:preflight:complete`：本轮不重复运行；根据新分级规则，只在全部Gold完成或进入Evaluator/Baseline门禁时运行。

### Modes

- Dataset Annotation Draft / Fixture Preflight：通过。
- Strict Complete Preflight：未运行，原因是11个Pending为已知状态。
- Fixture Oracle、Real Model Mock World、Replay、Live Read-only、Controlled Live-write：未运行。

### Safety

- Approximate Time不会被Schema静默转换为Exact或有界Window；检索前Candidate事实不进入允许Grounding集合。
- 所有Outlet和Slot均为虚构Fixture，没有模型调用、真实Availability、Authorization或外部执行。

### External side effects

0。只执行TypeScript编译、Fixture Preflight、PGlite和本地HTTP/SSE测试。

## 2026-08-10 — Domain Knowledge and Memory staging documentation verification

### Scope

Data/Context、Search和Roadmap文档中的Domain Entity Observation、Interaction Event、Aggregate Insight、Private User Memory与Freshness-aware复用边界。本轮没有修改代码、数据库Schema、Prompt、配置、Provider Adapter或产品行为。

### Checks

- 文档分层检查：Conversation、Task State、外部实体Observation、群体Aggregate和个人Memory职责互不替代。
- Stage检查：2C只新增Restaurant Domain-owned的最小Observation/Event Contract，并明确只采集、不参与在线排序；通用Knowledge Platform、Trending和个性化仍有真实数据与评审门槛。
- Grounding检查：缓存事实保留Source、`observedAt`和Freshness；Availability、价格、条款及现实执行前仍要求按用途刷新或重新验证。
- Markdown相对链接检查：通过；README、AGENTS和`docs/`内Markdown链接无缺失目标。

### Modes

- Design / documentation verification：通过。
- Mock、Replay、Real Model、Live Read-only和Controlled Live-write：未运行；本轮没有可执行实现。

### Safety

- 未引入跨用户Memory读取、自动在线学习、群体数据回写个人偏好或过期缓存支持现实声明的路径。
- Provider内容继续受来源缓存、展示、署名和删除政策约束。

### External side effects

0。只修改和读取本地Markdown文档。

## 2026-08-10 — DGS02 and constraint-relaxation pair verification

### Scope

Golden Seed v0.2、DGS02/DGS07 Gold、单约束Fallback Oracle、Preflight同意门禁、干扰Candidate以及Episode批量标注流程。没有修改生产Parser、Prompt、Web、Task Runtime、Restaurant State、数据库Schema或Provider Adapter。

### Checks

- `npm run typecheck`：通过。
- `npm run build`：通过。
- 定向`restaurant-decision-eval-preflight.test.ts`：9/9通过；覆盖DGS01、DGS02严格品牌结果、DGS07零结果双Fallback、用户选择后的单字段更新、缺失同意、严格结果非空时禁止Fallback、悬空引用和运行时结构防护。
- `npm test`：77 tests / 5 suites / 0 failed；既有HTTP/SSE测试使用本机`127.0.0.1`临时监听，其余为本地Fixture/PGlite路径。
- `npm run eval:decision:preflight`：通过，`READY_FOR_ANNOTATION`；7个Pool、28个Candidate、374个Fact、7个Episode、17个Turn、4个Labeled、13个Pending，0个Issue。
- `npm run eval:decision:preflight:complete`：按设计非零退出，`BLOCKED_PENDING_HUMAN_LABELS`并准确列出剩余13个Pending Turn。

### Modes

- Dataset Annotation Draft / Fixture Preflight：通过。
- Strict Complete Preflight：仅因剩余人工Gold按设计阻断。
- Fixture Oracle、Real Model Mock World、Replay、Live Read-only、Controlled Live-write：未运行；Reducer、阶段Scorer和Model Contract尚未实现。

### Safety

- Mutation验证`requiresUserChoice: false`和严格Eligible非空时触发Fallback均被Preflight拒绝。
- Fallback只使用虚构Fixture；没有真实Availability、模型调用、状态写入、Authorization或外部执行。

### External side effects

0。只执行TypeScript编译、Fixture Preflight、PGlite和本地HTTP/SSE测试。

## 2026-08-10 — DGS01 Gold verification

### Scope

DGS01人工Gold、宽泛Daypart下的Slot Grounding语义、Golden Seed统计和相关Eval/Roadmap文档。没有修改生产Parser、Prompt、Web、Task Runtime、Restaurant State、数据库Schema或Provider Adapter。

### Checks

- `npm run typecheck`：通过。
- `npm run build`：通过。
- 定向`restaurant-decision-eval-preflight.test.ts`：6/6通过；新增断言验证东京日期、`DAYPART/DINNER`、Ginza `AREA`、直接推荐、价格/子类型多样性，以及允许展示Slot但禁止声称精确时间匹配。
- `npm test`：74 tests / 5 suites / 0 failed；既有HTTP/SSE测试使用本机`127.0.0.1`临时监听，其余全部为本地Fixture/PGlite路径。
- `npm run eval:decision:preflight`：通过，`READY_FOR_ANNOTATION`；6个Candidate Pool、22个Candidate、291个Fact、6个Episode、1个Labeled Turn、14个Pending Turn，0个Issue。
- `npm run eval:decision:preflight:complete`：按设计非零退出，`BLOCKED_PENDING_HUMAN_LABELS`并准确列出剩余14个待人工标注Turn。

### Modes

- Dataset Annotation Draft / Fixture Preflight：通过。
- Strict Complete Preflight：仅因剩余Pending Gold按设计阻断。
- Fixture Oracle、Real Model Mock World、Replay、Live Read-only、Controlled Live-write：未运行；Reducer、阶段Scorer和Model Contract尚未实现。

### Safety

- Slot只作为虚构Fixture Fact接受Grounding，不表示符合用户的确切时间、真实Availability或可订承诺。
- 命令不加载`.env`、不读取DeepSeek Key、不产生模型请求、Task Event、数据库写入、Authorization或外部副作用。

### External side effects

0。只执行TypeScript编译、Fixture Preflight、PGlite和本地HTTP/SSE测试。

## 2026-08-09 — Progressive Decision Golden Seed and S0 Preflight verification

### Scope

Eval v2 Dataset/Fixture/Annotation Contract、6个Golden Seed Episode、Candidate Fixture、S0 Dataset Preflight、CLI和5个Contract测试。没有修改生产Parser、Prompt、Web、Task Runtime、Restaurant State、数据库Schema或Provider Adapter。

### Checks

- `npm run typecheck`：通过。
- `npm run build`：通过。
- 定向`restaurant-decision-eval-preflight.test.ts`：5/5通过，覆盖Draft可标注状态、Pending严格阻断、悬空Candidate引用、重复Fact ID、完整Gold样例和不可信运行时结构。
- `npm test`：73 tests / 5 suites / 0 failed。首次沙箱运行66/73通过，7个既有Stage 2B HTTP/SSE场景因`listen EPERM 127.0.0.1`失败；允许本机回环监听后同一命令完整通过，不是产品或本次Eval代码失败。
- `npm run eval:decision:preflight`：通过，`READY_FOR_ANNOTATION`；6个Candidate Pool、21个Candidate、278个Fact、6个Episode、15个Pending Turn，0个Issue。
- `npm run eval:decision:preflight:complete`：按设计非零退出，`BLOCKED_PENDING_HUMAN_LABELS`并准确列出15个待人工标注Turn；证明未完成Gold不能进入Evaluator阶段。

### Modes

- Dataset Annotation Draft / Fixture Preflight：通过。
- Strict Complete Preflight：按设计阻断Pending Gold。
- Fixture Oracle、Real Model Mock World、Replay、Live Read-only、Controlled Live-write：未运行；Reducer、阶段Scorer和Model Contract尚未实现。

### Safety

- 所有Candidate、Availability和Fact均为虚构Fixture；输出不代表真实餐厅或空位。
- 命令不加载`.env`、不读取DeepSeek Key、不产生模型请求、Task Event、数据库写入、Authorization或外部副作用。
- Gold保持人工所有权，当前代码未自动填充语义Label。

### External side effects

0。只运行TypeScript编译、Fixture Preflight、PGlite/本地既有测试；没有真实模型、餐厅平台、外部数据库或预约写入。

## 2026-08-09 — Restaurant Progressive Decision Eval v2 plan verification

### Scope

Eval v2计划、数据覆盖、评分规则、错误等级、候选门槛和Roadmap/架构/工程文档同步。本轮没有修改TypeScript、Prompt、数据集、Evaluator、Web、Task Runtime、Restaurant State或Provider Adapter。

### Checks

- Markdown相对链接：通过，检查README、AGENTS和`docs/`共41个Markdown文件，0个缺失目标。
- 状态扫描：通过；当前Source of Truth不再把真实DeepSeek标记为“尚未运行”，并明确2026-08-08的1条结果只是Connectivity Smoke，不是质量Baseline。
- 范围扫描：通过；Eval v2统一标记为`Draft / HARNESS_ONLY`，Roadmap和Harness文档均未声称产品已支持渐进决策。
- `npm run typecheck`、`npm test`、`npm run build`：未运行；本轮没有修改代码、配置、Schema或构建输入。

### Modes

文档静态验证：通过。Fixture Eval、Real Model Eval、Replay、Live Read-only和Controlled Live-write：本轮均未运行。

### Safety

计划保留模型无Task/Authorization/Attempt/Outcome写权限、真实模型显式付费门禁、Prompt/Response脱敏以及Mock/Real/Live结果分离。

### External side effects

0。没有模型、数据库、餐厅平台或其他外部网络调用。

## 2026-08-08 — Local configuration and Eval command boundary verification

### Scope

Git忽略的本地`.env`、可提交模板，以及`dev`、真实模型Eval和真实PostgreSQL smoke的原生配置加载。没有提供或读取真实Key、数据库凭据、Provider网络、预约平台或外部数据库。

### Checks

- Node.js 24.4.1支持`--env-file-if-exists`；命令在`.env`不存在时不因加载器失败。
- `npm test`、`npm run build`、`npm run eval:intent:fixture`和`npm run eval:search:fixture`脚本不含`.env`加载；它们不能隐式读取本地DeepSeek或数据库凭据。
- `npm run eval:intent:deepseek`继续保留`PRAXIS_ALLOW_LIVE_MODEL_EVAL=1`的既有fail-closed门禁；本轮未设置开关或Key，未发起网络请求。
- `npm run typecheck`、`npm run build`：通过。
- `npm run eval:intent:fixture`：8/8 Fixture样例通过，`p0Errors: 0`。
- `npm run eval:search:fixture`：3/3断言通过。
- `npm test`：通过，68 tests / 5 suites / 0 failed。沙箱内首次运行的7个本地HTTP/SSE用例因禁止监听`127.0.0.1`报`EPERM`；允许本机回环监听后同一命令完整通过，不是产品失败。

### Modes

配置/命令静态验证：通过。真实Model Eval、真实PostgreSQL smoke、Replay、Live Read-only和Controlled Live-write：未运行。

### Safety

`.env`和`.env.*`被Git忽略，只有`.env.example`可提交；Web不读取任何本地配置变量。真实模型与真实PostgreSQL命令仍需各自既有的显式门禁。

### External side effects

0。没有读取真实凭据、没有网络调用、数据库连接或外部写入。

## 2026-08-08 — First controlled DeepSeek Intent Eval

### Scope

使用本地服务端配置和显式付费门禁运行`restaurant-intent-eval-v1`的1条真实模型样本`I01-complete-tonight-yakiniku`。只验证Intent Parser与固定数据集，不创建Task、不写数据库、不调用餐厅平台。

### Checks

- `npm run eval:intent:deepseek`：通过，`mode: REAL_MODEL`。
- 样本：1/1有效输出，1/1精确匹配；所有字段准确率均为1；阻塞字段漏检率为0；不必要追问率为0；`p0Errors: 0`。
- Provider：DeepSeek；模型：`deepseek-v4-flash`。
- 模型调用：1次成功、0次失败、0次重试；总延迟约3950ms。
- Token：输入325、输出96、合计421；成本状态为`NOT_CONFIGURED`，因为本次未配置价格变量，未猜测费用。

### Modes

Real Model Eval：通过（仅1条样本）。Fixture、Mock、Replay、Live Read-only和Controlled Live-write：本条未运行。

### Safety

真实模型输出仍只经过Parser和Domain Schema Validator；本次Eval没有进入Task Runtime或任何外部副作用路径。运行完成后`PRAXIS_ALLOW_LIVE_MODEL_EVAL`已恢复为`0`。

### External side effects

1次DeepSeek API请求，可能产生供应商费用；没有数据库、餐厅平台或预约写入。

## 2026-08-08 — Stage 2B Persistent Agent Shell验证

### Scope

PostgreSQL Workspace Migration、Pilot Session、持久Conversation、Case/Activity/Artifact Projection、Persistent Restaurant Agent、Responsive Web、HTTP API与SSE重连。仍使用Fixture Model/Search；没有生产身份、通知、真实Provider、Authorization、外部写入或预约。

### Checks

- `npm run typecheck`：通过。
- Stage 2B定向HTTP/SSE测试：7/7通过；覆盖Responsive页面Contract、W01–W05、缺失信息续聊和陈旧版本409。
- `npm test`：通过，68 tests / 5 suites / 0 failed。沙箱内首次定向HTTP测试因禁止监听`127.0.0.1`报`EPERM`，允许本机回环监听后通过；不是产品失败。
- `npm run build`：通过。
- `npm run eval:intent:fixture`：8/8 Fixture样例通过，`p0Errors: 0`。
- `npm run eval:search:fixture`：3/3 Fixture断言通过。
- In-app Browser QA：通过；1280×800 Desktop与390×844 Mobile完成登录、创建Case、候选选择和Activity检查。Mobile切为单列、Case列表横向滚动、Composer按钮占满容器且无页面横向溢出；页面Console无Error/Warning。QA中发现并修复Desktop `Sign out`按钮窄屏换行。

### Modes

- Unit/Contract、Mock Harness、Embedded-postgres Integration、Local Fixture HTTP/SSE：通过。
- Local Browser视觉/交互：手动通过；Real PostgreSQL、Real Model Eval、Browser Adapter Fixture、Replay、Live Read-only、Controlled Live-write：未运行。

### Safety

- 跨用户Case和SSE均返回404；业务API只使用服务端Session解析的`userId`。
- W05证明Conversation中的“预约成功”文本不会改变Task Version、Phase、Event Activity或Outcome Artifact。
- Candidate Selection只到`AWAITING_AUTHORIZATION`；测试路径中Authorization、Attempt和`EXTERNAL_WRITE`均不存在。

### External side effects

0。测试只使用本机进程、PGlite和Fixture Model/Search；没有真实模型、平台、预约或外部数据库调用。

### Limitations

- PGlite只证明Embedded-postgres Integration，不能替代真实PostgreSQL测试；本轮未获得专用测试数据库写入配置，因此没有运行`npm run test:postgres:live`。
- 已完成单一In-app Browser的两个Viewport QA，但尚未覆盖Chrome/Safari差异、真实移动设备触控、可访问性审计或自动化视觉回归。

## 2026-08-08 — Web-first Agent Workspace文档验证

### Scope

ADR-0006、Agent Gateway/Workspace架构、MVP/User Flow、Stage 2B–2D Roadmap、Interfaces、Data/Context/Security、Arch Guard、Harness和工程记录同步。没有修改代码、数据库Schema、模型、Provider、Adapter或现实副作用行为。

### Checks

- Markdown相对链接：通过，检查README和`docs/`共38个Markdown文件，0个缺失目标。
- 阶段与术语扫描：通过；当前Source of Truth中没有残留“Stage 2B直接接Live Discovery”“Stage 2C为Availability”或“Task Runtime是所有交互顶层总指挥”的旧描述。Dev Log中的旧文字保留为历史记录，并由2026-08-08条目明确改变。
- `npm test`：首次沙箱运行61/63通过，2个Local Web/API测试因禁止监听`127.0.0.1`报`EPERM`；允许本机测试监听后重跑，63 tests / 5 suites / 0 failed。
- `npm run typecheck`、`npm run build`：未运行；本轮没有TypeScript或构建输入改动。

### Modes

- Unit/Contract、Mock Harness、Embedded-postgres Integration、Local Fixture HTTP：完整稳定基线通过。
- Real PostgreSQL、Real Model Eval、Replay、Live Read-only、Controlled Live-write：未运行；本轮没有对应实现或平台改动。

### Safety

- Conversation、Activity和Artifact被定义为非权威Projection，不能改变Task、Authorization、Attempt或Outcome。
- Stage 2B继续使用Fixture Model/Search，不新增外部网络、通知渠道或写操作。
- 用户隔离、跨设备恢复和Conversation非权威性新增为Golden `W01–W05`场景规格，尚未实现，不能报告为产品能力。

### External side effects

0。测试只使用本机进程、PGlite和Local Fixture HTTP，没有真实模型、平台、预约或外部数据库调用。

## 2026-08-07 — Stage 2A Local Fixture Search Web验证

### Scope

Restaurant `UNDERSTANDING / NEEDS_INPUT / SEARCHING / AWAITING_SELECTION`状态、必填Trace、Local-only Fixture ModelGateway/Search、HTTP/HTML本地入口、候选选择和Fixture Search Eval。没有真实DeepSeek、真实Provider、Authorization、预约、外部写入或真实PostgreSQL Smoke。

### Checks

- `npm run typecheck`：通过。
- `npm test`：通过，63 tests / 5 suites / 0 failed；包括2个Local Web/API HTTP端到端场景和1个Fixture Search Eval Contract。
- `npm run eval:search:fixture`：通过，`mode: FIXTURE`、3/3断言通过：完整请求返回3候选、缺字段只请求日期/时间/人数、选择停在授权前。
- `npm run build`：通过。
- `npm run eval:intent:fixture`：通过，8条Fixture Intent样例全部通过；仅证明Fixture Oracle、Schema与计分器，不能作为DeepSeek质量分数。

### Modes

- Fixture Model / Fixture Search / Local HTTP API：通过。
- Mock Restaurant Booking Harness、Embedded-postgres Integration：完整基线维持通过。
- Real PostgreSQL：本轮未重跑。
- Real Model Eval、Replay、Live Read-only、Controlled Live-write：未运行。

### Safety

- Model输出经既有Parser和Schema Validator后才成为`INTENT_PARSED` Event；不直接写Task State。
- 所有Event必须携带Trace并匹配Task Run；不再为旧Fixture补默认值。
- 选择候选只到`AWAITING_AUTHORIZATION`；本阶段没有Authorization、Policy Commit或`EXTERNAL_WRITE`。

### External side effects

0。Fixture Model/Search和HTTP测试均在本机进程内；没有网络Provider、真实餐厅或预约调用。

### Limitations

- 本轮未完成浏览器视觉手测；本地HTTP端到端测试已经覆盖页面入口和JSON路径。开发者可通过`npm run dev`在`127.0.0.1:3000`手动检查Fixture页面。
- Fixture Search只覆盖三条演示路径；不验证真实Discovery、实体合并、Availability、30秒预算或模型质量。

## 2026-08-07 — Roadmap and Stage 1 review verification

### Scope

Roadmap阶段重划、扩展投资门槛、Agent实现原则、测试投入原则和文档状态修正。业务代码、Schema、Provider Adapter和外部执行均未修改；本次重新运行Stage 1基线以核实完成状态。

### Checks

- `npm run typecheck`：通过。
- `npm test`：通过，61 tests / 5 suites / 0 failed；其中20个PGlite集成场景。
- `npm run build`：通过。
- Markdown相对链接：通过，共检查64个Markdown文件。
- Secret模式扫描：通过，排除`node_modules/`、`dist/`与`.git/`后未发现API Key、数据库凭据或私钥。

### Modes

- Unit/Contract、Mock Harness、Embedded-postgres Integration：通过。
- Real PostgreSQL：本次未重跑；此前隔离本机Smoke结果仍单独记录。
- Real Model Eval、Replay、Live Read-only、Controlled Live-write：未运行。

### Review conclusion

- Stage 1测试足以支持Runtime、Policy、Verifier、Outbox、恢复和Provider Contract完成结论。
- 这些结果不证明Web可用、DeepSeek质量、Search质量、真实Availability或预约成功率。
- Stage 2测试应优先覆盖同一条Web/API/Search纵向路径；不再用未来Runtime测试数量延后产品闭环。
- Goal Graph、Scheduler和合成Domain属于已验证架构探针；只有Roadmap中的真实触发条件出现后才恢复扩建。

### External side effects

0。没有真实模型、平台、预约或外部数据库调用。

## 2026-08-07 — Stage 1I Synthetic Runtime Domains验证

### Scope

Harness-only Recurring Shopping、Long-running Case及其与持久化Task Runtime/Trigger的集成；不含真实Shopping、支付、外部Case系统、模型、Browser或数据库外部副作用。

### Checks

- `npm run typecheck`：通过。
- `src/infrastructure/postgres/postgres-runtime.test.ts`：通过，20 tests / 1 suite / 0 failed。
- `npm test`：通过，61 tests / 5 suites / 0 failed。
- `npm run eval:intent:fixture`：通过，8个Fixture样本全部通过；`mode: FIXTURE`、`exactMatchRate: 1`、`p0Errors: 0`，不作为模型分数。
- `npm run build`：通过。
- Markdown相对链接：通过，共检查README、AGENTS和`docs/`内37个文件。
- Secret模式扫描：通过，排除`node_modules/`与`dist/`后未发现API Key、数据库凭据或私钥。
- `G01-recurring-shopping`：持久化Trigger/Fake Clock在到期后只进入`WAITING_USER`；确认后仅有`PREPARE`命令；下一周期再次等待确认，`EXTERNAL_WRITE`为0。
- `G02-long-running-case`：外部材料请求进入`WAITING_USER`，材料补齐后才再次准备，外部解决进入`SUCCEEDED`；`EXTERNAL_WRITE`为0。

### Modes

- Harness/Embedded-postgres Integration：通过，PGlite与Fake Clock。
- Mock Restaurant Harness、Fixture Eval：维持通过，未在本条重复运行。
- Real PostgreSQL、Real Model Eval、Live Read-only、Controlled Live-write：未运行。

### Safety

- 合成Shopping不存在自动购买或外部写命令；每周期必须由`CONFIRM_PURCHASE` Event重新开启。
- 合成Case的外部事件只能经Event状态机推进，不直接写Task State；无材料时不产生再准备命令。

### External side effects

0。仅PGlite内存数据库写入；没有网络、真实购买、真实Case提交或真实预约。

### Limitations

- 这两个Harness Domain不代表产品功能、第二个真实Domain或生产Scheduler桥接。
- Coordination仍只有Goal Graph聚合场景，独立状态机未实现；跨Domain Child Task/自动激活继续保持proposed。

## 2026-08-07 — Stage 1H Restaurant Intent Parser and Controlled Real Model Eval验证

### Scope

Restaurant Prompt/Parser、强化Intent Schema Validator、真实模型Eval Adapter、Token/成本计分与付费网络门禁；没有真实Key、Provider网络、Task State、数据库或预约平台。

### Checks

- `npm run typecheck`：通过。
- Restaurant Domain、Eval与DeepSeek Connector定向测试：通过，20 tests / 1 suite / 0 failed。
- `npm test`：通过，59 tests / 5 suites / 0 failed。
- `npm run eval:intent:fixture`：通过，8个Fixture样本全部通过；`mode: FIXTURE`、`exactMatchRate: 1`、`p0Errors: 0`，不作为模型分数。
- `npm run build`：通过。
- Markdown相对链接：通过，共检查README、AGENTS和`docs/`内37个文件。
- Secret模式扫描：通过，排除`node_modules/`与`dist/`后未发现API Key、数据库凭据或私钥。
- Parser Contract：验证版本化JSON Prompt、用户文本以JSON字符串传递、一次无效输出重试、两次无效后结构化表单降级、Provider失败不改变Task State。
- Real Model Eval Contract：验证付费开关、样本数和价格配置门禁、Golden数据集复用、Provider/模型/Token/成本聚合和Retry计数。
- `npm run eval:intent:deepseek`（未设置开关）：按预期退出，提示需要`PRAXIS_ALLOW_LIVE_MODEL_EVAL=1`；执行在构造Gateway前停止，0次网络调用。

### Modes

- Parser/Real Eval Connector Contract：通过，Fake ModelGateway/Fake Fetch；没有网络。
- Fixture Eval：维持通过，但仍是Fixture Oracle。
- Real Model Eval、Replay、Live Read-only、Controlled Live-write：未运行或未实现。

### Safety

- 未通过JSON、`finish_reason`和Domain Schema三层校验的模型结果不会以`PARSED`返回。
- JSON/Schema错误最多触发一次只读模型重试；Provider失败不重试，直接降级。
- 真实Eval必须同时具备服务端Key、模型名和显式付费网络开关；Token价格缺失时不生成虚构成本。

### External side effects

0。没有模型网络调用、Provider调用、数据库写入或真实预约副作用。

### Limitations

- 本轮证明Parser/评测的Contract和门禁，不证明DeepSeek的实际意图理解、JSON可靠性、速度、配额或成本。
- 当前Golden数据集只有8条；首次真实结果必须单独归档，之后再扩充错例集。

## 2026-08-07 — Stage 1G DeepSeek Model Gateway Provider Contract验证

### Scope

Core `ModelGateway` Contract、DeepSeek非流式Chat Completion HTTP Adapter、配置门禁、超时、错误归类和无内容Telemetry；不包含Restaurant Intent Parser、真实Key、真实网络或任何Task状态变更。

### Checks

- `npm run typecheck`：通过。
- `npm test`：通过，52 tests / 5 suites / 0 failed。
- DeepSeek Connector Contract：5个场景通过。验证固定Endpoint、Bearer Header、`JSON_OBJECT`请求格式、内部Task ID不出站、Prompt/Completion不进入Telemetry、未配置模型fail-closed、429归类、请求超时和畸形响应拒绝。
- `npm run build`：通过。
- Markdown相对链接：通过，共检查README、AGENTS和`docs/`内37个文件。
- Secret模式扫描：通过，排除`node_modules/`与`dist/`后未发现API Key、数据库凭据或私钥。

### Modes

- Connector Contract：通过，Fake Fetch；不含网络。
- Fixture Eval：维持通过，但仍是Fixture Oracle。
- Replay、Real Model Eval、Live Read-only、Controlled Live-write：未实现或未运行。

### Safety

- Adapter没有Tool Call、Task Runtime、Policy或平台Adapter依赖，不能产生Task State或现实副作用。
- 真实Key及Provider正文未读取、未打印、未写入测试工件；Telemetry只保存脱敏调用元数据。

### External side effects

0。没有模型网络调用、Provider调用、数据库写入或真实预约副作用。

### Limitations

- 尚未验证真实DeepSeek凭证、账号权限、配额、模型可用性、延迟或价格。
- 后续真实Intent Eval必须显式启用并单独报告，不得与本条Connector Contract混报。

## 2026-08-07 — Stage 1F Intent Eval Harness验证

### Scope

Restaurant Intent Draft Schema Validator、8条固定Intent数据集、Fixture Eval Runner和字段级指标；没有DeepSeek API、网络、Browser、Provider或真实预约。

### Checks

- `npm run typecheck`：通过。
- `npm run eval:intent:fixture`：通过，8个Fixture样本全部通过Schema与Golden比对；报告`mode: FIXTURE`、`exactMatchRate: 1`、`p0Errors: 0`。
- `npm test`：通过，47 tests / 5 suites / 0 failed。
- Eval Contract：Fixture基线、阻塞字段漏检为P0、畸形模型输出被Schema Validator拒绝。
- `npm run build`：通过；编译产物Smoke可加载Intent Evaluator和Schema Validator。
- 相对链接：通过，共检查README、AGENTS和`docs/`内37个Markdown文件。
- Secret模式扫描：通过，排除`node_modules/`与`dist/`后未发现API Key、数据库凭据或私钥。

### Modes

- Fixture Eval：通过，8个样本。
- Replay Eval：框架支持、当前未运行真实Replay。
- Real Model Eval：未实现，未运行；DeepSeek Gateway和Key尚未接入。
- Live Read-only、Controlled Live-write：未实现或未运行。

### Safety

- Eval的模型输出只进入Schema Validator，不能直接写Task State或触发搜索/预约。
- Fixture Oracle分数不作为模型质量或发布依据。

### External side effects

0。没有模型网络调用、Provider调用、数据库写入或真实预约。

### Limitations

- 当前样本数为8，仅用于建立评测契约，不足以代表真实用户分布。
- 真实模型、Prompt版本、token/成本/延迟与重试统计将在DeepSeek Gateway接入后记录。

## 2026-08-07 — Stage 1E Trigger/Scheduler验证

### Scope

持久化定时Trigger、到期Claim、租约恢复、确定性Event、陈旧版本淘汰和有界失败；没有模型、Browser、Provider或真实预约。

### Checks

- `npm run typecheck`：通过。
- `npm test`：通过，44 tests / 5 suites / 0 failed。
- Embedded-postgres Integration：18个PGlite场景通过；新增Trigger未到期不投递、到期单次投递、租约过期重领、期望版本陈旧转`OBSOLETE`及失败上限转`FAILED`。
- `npm run build`：通过。
- 编译产物导入Smoke：通过，`TriggerScheduler`与`PostgresTriggerStore`可从`dist/`加载。
- Real PostgreSQL smoke：通过。真实PostgreSQL 17中由Scheduler把Booking子Task推进为`SUCCEEDED`，随后验证Route就绪和Goal聚合。
- 后置只读清理检查：`praxis_schema_migrations=4`；`goals`、`tasks`、`task_events`、`task_commands`、`goal_task_memberships`、`task_dependencies`和`task_triggers`均为0行。
- 相对链接：通过，共检查README、AGENTS和`docs/`内37个Markdown文件。
- Secret模式扫描：通过，排除`node_modules/`与`dist/`后未发现API Key、数据库凭据或私钥。

### Modes

- Mock Harness：维持通过，11个Restaurant场景。
- Embedded-postgres Integration：通过，18个PGlite场景。
- Real PostgreSQL smoke：通过，隔离本机`praxis_smoke`数据库。
- Replay、Live Read-only、Controlled Live-write：未实现或未运行。

### Safety

- 过期或已完成Trigger不会重复投递Event。
- 陈旧Task版本的Trigger标为`OBSOLETE`，不会修改当前Task状态。
- Trigger的Factory或Dispatch失败仅作有界重试，不会无限循环。

### External side effects

仅本机隔离测试数据库创建Schema、临时Task、Goal与Trigger并清理；0次网络Provider或真实预约副作用。

### Limitations

- 尚无生产常驻Scheduler进程、Domain Trigger Factory、Webhook或周期计划表达。
- Real Smoke不替代生产权限、并发负载、备份恢复或跨节点故障测试。

## 2026-08-07 — Stage 1D Goal/Task Graph验证

### Scope

持久化Goal、Task成员/父子关系、依赖条件、Readiness、环检测与Goal聚合；没有模型、Browser、Provider或真实预约。

### Checks

- `npm run typecheck`：通过。
- `npm test`：通过，40 tests / 5 suites / 0 failed。
- Embedded-postgres Integration：14个PGlite场景通过；新增`G03-coordination-parent-child`和上游失败/环依赖保护。
- `npm run build`：通过。
- 编译产物导入Smoke：通过，`PostgresGoalGraph`与Goal Contract可从`dist/`加载。
- Real PostgreSQL smoke：通过。真实PostgreSQL 17中创建Goal、Root Task、两个关键子Task和依赖；确认Route先为`WAITING`，Booking完成后为`READY`，两个关键Task完成后Goal为`ACHIEVED`。
- 后置只读清理检查：`praxis_schema_migrations=3`；`goals`、`tasks`、`task_events`、`task_commands`、`goal_task_memberships`和`task_dependencies`均为0行。
- 相对链接：通过，共检查README、AGENTS和`docs/`内37个Markdown文件。
- Secret模式扫描：通过，排除`node_modules/`与`dist/`后未发现API Key、数据库凭据或私钥。

### Modes

- Mock Harness：维持通过，11个Restaurant场景。
- Embedded-postgres Integration：通过，14个PGlite场景。
- Real PostgreSQL smoke：通过，隔离本机`praxis_smoke`数据库。
- Replay、Live Read-only、Controlled Live-write：未实现或未运行。

### Safety

- Task不能加入多个Goal；依赖双方必须属于同一Goal。
- 自依赖、依赖环和同一Downstream的混合条件被拒绝。
- 依赖Graph只计算Ready/Waiting/Blocked，不直接启动Domain，也不产生外部副作用。

### External side effects

仅本机隔离测试数据库创建Schema、临时Task与Goal并清理；0次网络Provider或真实预约副作用。

### Limitations

- 尚未实现跨Domain Child Task Command/Registry、自动激活、Scheduler或三个合成Domain。
- Real Smoke不替代生产权限、并发负载、备份恢复或跨节点故障测试。

## 2026-08-07 — Real PostgreSQL Smoke

### Scope

在新建、隔离的本机`praxis_smoke`数据库上运行真实PostgreSQL 17 Smoke。没有DeepSeek、Browser或真实Provider调用。

### Checks

- 本机PostgreSQL：`17.10 (Homebrew)`，监听本机端口`55432`。
- `PRAXIS_TEST_DATABASE_URL=postgresql://wangzhour@127.0.0.1:55432/praxis_smoke PRAXIS_ALLOW_TEST_DATABASE_WRITE=1 npm run test:postgres:live`：通过，输出`real-postgres-smoke: pass`。
- 后置只读检查：`praxis_schema_migrations=2`；`tasks=0`、`task_events=0`、`task_commands=0`。

### Modes

- Real PostgreSQL smoke：通过，隔离本机数据库。
- PGlite Embedded-postgres Integration：见下一条记录，已通过。
- Replay、Live Read-only、Controlled Live-write：仍未实现或未运行。

### Safety

- 写入由`PRAXIS_ALLOW_TEST_DATABASE_WRITE=1`显式门禁。
- 目标是新建的本机测试数据库；Smoke只留下Schema，临时Task及相关Event/Command已清理。

### External side effects

仅本机测试数据库建表、写入与清理；0次网络Provider或真实预约副作用。

### Limitations

不代表生产网络、身份权限、备份恢复、并发负载或跨节点故障行为已经验证。

## 2026-08-07 — Stage 1B/1C PostgreSQL Runtime与Recovery验证

### Scope

PostgreSQL Task/Event/Command持久化、事务Outbox、Command Worker、租约恢复、Recovery Coordinator和Restaurant Domain恢复映射。没有DeepSeek、Browser、真实Provider或真实预约调用。

### Checks

- `npm run typecheck`：通过。
- `npm test`：通过，38 tests / 5 suites / 0 failed。
- Restaurant Mock Harness：11个场景通过。
- Embedded-postgres Integration：12个PGlite场景通过，包括事务回滚、Event去重、陈旧版本、租约重领、External Write禁止盲重试、结果Event Reconcile、Runtime重建，以及`RECOVERY_REQUIRED → OUTCOME_UNKNOWN → VERIFY_BOOKING`。
- Recovery安全断言：不确定External Write只有1个`COMMIT_BOOKING`和1个`VERIFY_BOOKING`；第二次Coordinator轮询为空闲。
- `npm run build`：通过。
- 编译产物导入Smoke：通过，`RecoveryCoordinator`与Restaurant Recovery Event Factory可从`dist/`加载。
- `npm audit --omit=dev`：通过，0 vulnerabilities；沙箱内首次因DNS不可用失败，经只读网络授权后完成。
- 相对链接：通过，共检查README、AGENTS和`docs/`内37个Markdown文件。
- Secret模式扫描：通过，排除`node_modules/`与`dist/`后未发现API Key、数据库凭据或私钥。

### Modes

- Mock Harness：通过，11个Bootstrap场景。
- Embedded-postgres Integration：通过，12个PGlite场景。
- Real PostgreSQL smoke：未运行；当前环境没有PostgreSQL服务或容器Runtime。
- Replay：未实现，未运行。
- Live Read-only：未实现，未运行。
- Controlled Live-write：未实现，未运行。

### Safety

- State、Event和Command Outbox在同一事务提交或回滚。
- External Write失败或租约失效且无结果Event时不会重新Lease。
- Recovery只投递Domain Event并进入验证，不重复预约提交。
- Worker Event与Recovery Event使用不同确定性ID，Reconcile不会把Recovery误判为成功结果。

### External side effects

0。PGlite只在本进程内写入测试数据库；没有网络Provider、真实PostgreSQL或现实事务副作用。

### Limitations

- `npm run test:postgres:live`需要用户提供可写测试数据库和显式写入开关，本轮未满足条件。
- 尚无生产Queue进程、Schema Migration并发部署门禁或运营恢复界面。
- 当前目录仍没有可被Git识别的`.git`元数据，无法执行`git diff`范围检查。

## 2026-08-07 — Stage 1B Trace、Proof与Run Artifact验证

### Scope

In-memory Task Runtime Causal Trace、Restaurant Booking Proof/Completion Verifier、Restaurant State Schema `1 → 2`迁移、Mock Adapter Verification模式、Harness Run Artifact和测试入口；没有数据库、模型、Browser或真实Provider调用。

### Checks

- `npm run typecheck`：通过。
- `npm test`：通过，26 tests / 4 suites / 0 failed。
- Restaurant Mock Harness：11个场景通过，包括字段冲突、错误Attempt Evidence和Run Artifact因果链。
- Restaurant Verifier Unit：4个场景通过，覆盖Strong完整匹配、Weak Evidence、错误Attempt和预约字段冲突。
- State Migration：Schema `1` Strong Evidence Fixture成功迁移为Schema `2` Proof Bundle。
- Runtime Contract：Event Trace记录、Command因果传播和无Trace旧Fixture规范化通过。
- `npm run build`：通过。
- 编译产物导入Smoke：通过，`verifyBookingCompletion`可从`dist/`加载。
- 相对链接：通过，共检查README、AGENTS和`docs/`内37个Markdown文件。
- Secret模式扫描：通过，排除`node_modules/`与`dist/`后未发现API Key或私钥。

### Modes

- Mock Harness：通过，11个Bootstrap场景。
- Replay：未实现，未运行。
- Live Read-only：未实现，未运行。
- Controlled Live-write：未实现，未运行。

### Safety

- Weak、字段冲突或错误Attempt Evidence均不能产生`BOOKED_VERIFIED`。
- Commit和Verify绑定同一个Execution Attempt；Run Artifact中的Command/Event可通过Causation ID关联。
- Existing Policy、未授权Commit、单候选失败和`OUTCOME_UNKNOWN`不重试基线继续通过。

### External side effects

0。Side Effect Ledger只记录Mock Commit，未访问网络或真实预约平台。

### Limitations

- 当前Artifact只返回内存对象，尚未实现文件持久化、Replay读取或真实数据脱敏管线。
- 当前目录仍没有可被Git识别的`.git`元数据，无法执行`git diff`范围检查。
- 本轮未改变依赖，未重复运行`npm install`或依赖审计。

## 2026-08-06 — Agent Harness调研归档验证

### Scope

Agent Harness生态调研记录、文档索引、Dev Log和本验证记录；没有业务代码、依赖、Schema、Prompt、Adapter或架构决策改动。

### Checks

- 文档相对链接：通过，共检查35个`docs/` Markdown文件；同时修复`docs/INDEX.md`原有的两处Project Positioning错误链接。
- Secret模式扫描：通过，未发现API Key、私钥或本地Secret。
- Source of Truth边界：通过；调研记录标记为`Draft`和非架构决策依据，未修改ADR或Roadmap。
- 外部项目表述：只将可明确识别的公开GitHub仓库列为已核对项目；身份不明确的项目显式标为未验证。

### Modes

- Mock Harness：未运行，本轮只修改文档。
- Replay：未运行。
- Live Read-only：未运行。
- Controlled Live-write：未运行。

### External side effects

0。只进行了公开GitHub只读调研和本地Markdown编辑。

### Limitations

当前目录没有可被Git识别的`.git`元数据，因此不能执行`git diff`或Git范围检查。`npm run typecheck`、`npm test`和`npm run build`与本次纯文档改动无关，未运行。

## 2026-08-05 — Stage 1 Mock垂直切片验证

### Scope

TypeScript Task Runtime、Policy、Restaurant状态机、Mock Adapters、Side Effect Ledger和Restaurant Harness；没有真实Provider调用。

### Checks

- `npm run typecheck`：通过。
- `npm test`：通过，16 tests / 3 suites / 0 failed，其中包括8个Restaurant Mock Harness场景以及Runtime、Policy和Ledger Contract测试。
- `npm run build`：通过，生成结果进入被忽略的`dist/`。
- 编译产物导入smoke：通过，`restaurant.booking` Task Definition可从`dist/`加载。
- 文档相对链接：通过，共检查37个Markdown文件。
- Secret模式扫描：通过。
- 安全断言：未选择Commit为0、未授权Commit为0、明确失败不自动提交第二家、弱Evidence不产生Verified Outcome、`OUTCOME_UNKNOWN`禁止换候选、相同幂等键重放外部写入为1次。
- `npm install`审计：0 vulnerabilities。

首次用`tsx --test`运行时因当前沙箱禁止本地IPC socket而失败；将入口改为`node --import tsx --test`后通过。该问题与业务逻辑无关。

### Modes

- Mock Harness：通过，8个Bootstrap场景。
- Replay：未实现。
- Live Read-only：未运行。
- Controlled Live-write：未运行。

### External side effects

0。Side Effect Ledger只记录Mock预约尝试，不访问网络或真实预约平台。

## 2026-08-05 — 文档体系验证

### Scope

只涉及Markdown、README和AGENTS规则；没有业务代码、依赖、数据库、API调用或真实预约。

### Checks

- `relative-links: pass`：全部内部相对链接目标存在。
- 文档页头检查通过：设计/记录文档使用统一页头，ADR使用固定`## Status`，skills使用YAML frontmatter。
- `doc-count: 29`：计划中的`docs` Markdown文件全部存在。
- `scenario-count: 40`：Golden Scenario编号1–40完整。
- 文件时间与清单检查通过：原有研究文档未删除；本轮只更新README、项目定位、AGENTS和新建`docs`。
- Proposed边界检查通过：代码目录、API、数据实体和测试命令未描述为已经实现。
- Capability Matrix包含官方来源、状态和`2026-08-05`最后验证日期。
- Secret模式扫描未发现API Key或生产Secret；仅存在变量名、文档链接和普通任务标识。

### Modes

- Mock Harness：未实现。
- Replay：未实现。
- Live Read-only：未运行。
- Controlled Live-write：未运行。

### Limitations

文档初始化验证当时，目录没有可被Git识别的`.git`元数据，且尚无代码、package或测试命令，因此不能报告typecheck、unit、build或smoke通过。后续实现和验证结果见本文件顶部的新记录。
