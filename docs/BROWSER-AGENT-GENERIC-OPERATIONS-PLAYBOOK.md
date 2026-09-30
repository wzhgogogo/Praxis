# Browser Agent 通用操作与会话可靠性 Playbook

- Status: Draft — authorized implementation plan; not capability acceptance
- Document revision: 1.0
- Last updated: 2026-09-26
- Source of truth for: 本轮浏览器执行改造的切片、冻结范围、预算与交接门槛
- Related documents: [INDEX](INDEX.md), [既有 Browser Agent 计划](BROWSER-AGENT-RESTAURANT-IMPLEMENTATION-PLAN.md), [本次失败证据](history/AUTHORIZED-MODEL-VALIDATION-2026-09-26.md)
- Execution: 原 `2026-09-24｜修复第二轮live： 6 sol 改造` 任务，GPT-6-sol / medium；主任务负责独立 review。

## 目标与冻结范围

让现有模型驱动的 Browser Agent 在不同网页结构上可靠操作：模型根据当前观察选择下一步，代码解析控件、执行合法动作、验证结果并隔离失效会话。按控件和执行机制复用，不增加门店名、网站名称或已知成功 URL 分支。TableCheck/Tabelog 是现有使用者和反例来源，不是通用能力的适用范围。

本轮交付两个可运行纵向切片：A 失败导航不污染下一次合法读取；B 模型用同一套已观察选项选择能力操作原生 select 和自定义 combobox，并在页面回读确认后继续。每个切片从现有入口走完，不连续建设没有接线的基础层。

**上游冻结：** Restaurant Semantic Interpreter/Prompt/Schema、Compiler、Intent 与时序解释、用户原文、Dataset/Gold 不改；业务 Agent Prompt@18、fact judgment Prompt@10、门店 identity、库存证据接纳与默认交付窗口也不在本轮改动范围。执行器继续接收现有权威日期、人数、时间窗，模型不得自行改写。Browser action Prompt/Schema 可以按实际契约改版，与上游 semantic 分开版本化。

允许范围以 `src/infrastructure/browser/`、`web-skills/` 及其既有测试为中心；现有 Adapter/Router/Web/Harness 调用方只做新浏览器契约所需的最小接线。能力声明同步 Capability Matrix。若发现必须改变冻结层，先报告阻断和不改变该层的替代办法，不自行扩大范围。

这是现有职责内的局部修复，不预设新增 ADR 或重建框架；若真的改变 Accepted ADR 的权限/职责边界，再按既有流程处理。

## 已知基线与证据

HEAD `f4bf46a`，工作树包含前轮已审变更和独立 H003 记录。开工保存 status、HEAD、当前 diff，并给冻结源文件建立开工 hash 清单；验收比较的是开工工作树，不是把既有 dirty diff 当本轮改动。不得 reset/stash、覆盖别的任务内容、自动 commit/push。

已确认：

- Local Playwright 将自身 `page.goto` 超时包装为 `BROWSER_RUNTIME_FAILED`；Executor 仅在自己的 deadline 或 parent abort 时关闭会话。零网络控制已证明 runtime 导航失败后旧会话被下一候选复用。Live 第一批随后出现 interrupted-navigation，但真实因果需以可复现控制验证，不能把所有 UNKNOWN 归入它。
- Hanaoka/Tokyo Ten 的时间控件是原生 `SELECT`，不是自定义按钮。Tokyo Ten 有可见 7:00 PM 选项，底层 value 为时间戳。当前 SELECT_AUTHORITATIVE 仅支持 DATE/PARTY_SIZE；TIME 仅出现在 CLICK_AUTHORITATIVE，Skill 又指导点击 combobox，三者不一致。
- `safeGenericClick` 对非 BUTTON 也返回笼统的 write-capable 错误；这不证明原生 SELECT 本身会提交预约。不能以此放开真正 submit。
- 已有观察 revision、控件 registry、selected/options、模态层、动作后观察、预算、无进展限制和两个 runtime，优先复用。既有本地浏览器 Fixture 与默认 528 个测试通过并不覆盖上述缺口。

## A：失败导航与会话隔离

切片承诺：一次导航失败后，下一候选/来源的合法读取不受旧页面异步活动影响；原始失败仍可归因，预算不重置。

1. 在既有 executor/runtime 测试中保存当前红例：底层导航自行抛错，早于 Executor deadline；随后继续合法读取。检查旧页是否仍被复用。保留既有 executor deadline、parent abort、正常复用对照。
2. 在现有生命周期内标记/退役不可安全复用的导航会话，选择最简单的关闭/重开方式。区分导航失效与普通动作拒绝；不能每一次合法性拒绝都重启浏览器。
3. 清理和后续 acquire 必须有明确顺序，迟到的旧操作不能影响新页面；失败资源不留悬挂。沿用当前调用次数、候选/来源/整单预算，不加重试、备用浏览器或会话池。
4. 两个 runtime 遵守同一隔离契约；优先共享 Executor 修复，仅在底层差异确实需要时改 runtime。

验收：现有失败路径红→绿；真实 Chromium 本地受控页面覆盖延迟导航/失败之后新页面读取；正常会话仍可复用；取消和预算停止保持准确。不要用一个简单抛错 Mock 宣称真实迟到导航已被验证。失败记录归因区分 runtime navigation failure 和 executor deadline。

A 完成即向主任务发 diff、反例和验证结果，可以继续 B，不需等待用户逐步批准。

## B：统一已观察选项的选择与动作反馈

切片承诺：模型选择当前页面的合法选项，执行器处理原生 select 与自定义控件的差异，值生效后回读；无需模型猜 selector、底层 option value 或站点操作序列。

### 最小契约

- 复用现有 targetRef/revision，增加必要的选项绑定：选项属于哪个控件、当前观察、可见标签、实际 value、是否禁用/选中。模型引用已观察选项；不得自行构造时间戳或把他控件选项移过来。
- 收敛为一个表达“选择已观察选项”的语义动作。名称按现有风格定，不要求额外类/层。原生 select 用现有 `select()`；已展开的自定义选项用受控点击。尚未出现选项时，模型先选择打开该控件，重新观察后再选，不在代码里偷偷规划多步业务流程。
- 权威条件仍由现有 goal 校验。显示标签可与不可读 value 不同；例如 7:00 PM 的已观察 option value 是时间戳，执行该 value 前必须证明标签匹配权威时间窗。日期/人数同理；歧义或缺项明确失败，不猜格式、不换请求。
- 只补当前两个真实使用者证明需要的选项形式和现有控件能力。保留 Restaurant goal 输入，不借“通用”重建跨业务约束语言。
- 提供必要且精简的可用动作/拒绝原因：wrong control kind、stale reference、constraint mismatch、disabled/blocked、write prohibited 要能区分。可用动作由执行器已有判断产生，避免另写一套容易漂移的许可规则。
- 选择后回读实际值；异步结果仍需当前请求与完成条件确认。控件变更不等于库存成功。复用现有等待/完成机制，不另造通用工作流系统。

### Skill 与调用方

Browser Decision Prompt、动作 Schema、解码、Executor、通用 web-skill 必须一起对齐；站点 skill 保留来源知识，移走本应属于通用控件操作的重复规则。升级受影响 Browser Prompt/Schema 版本，更新所有调用方，删除被替代动作/测试；本项目未发布接口不建双协议兼容层。

安全判断依据已观察结构和现有只读许可，不凭模型“这是查询”的自述授权 submit。真实提交/登录/付款权限不变。不要让所有“选择”动作都被过度判危险，也不要把真正写操作混成查询。

### 覆盖与验收

复用既有行为测试，必要的新覆盖各有独立失败依据：

- 原生 select：可见时间标签 + 不透明 value，目标选项真正选中；custom combobox：打开→新观察→选择→回读，同一语义选择契约。
- 请求内正常值；缺失/超窗/禁用选项；错父控件或旧 revision；操作后值未变化/异步尚未完成；真实 submit 与安全选择的区别。不要为每种排列重复测试。
- 真实 Chromium 本地 Fixture 用不同 DOM 结构、布局、标签和无网站域名分支驱动现有 Browser Decision/Executor。至少一个结构变体在实现完成后由主任务选作独立控制，不把它写进站点规则。证明通用控件能力，不能称任意网站通过。
- 至少一个现有 production composition 从权威请求经共享 Adapter/Executor产出可核验的结果/失败；核对 Web 和 Harness 仍走同一路径。结构化参数不是新一轮 semantic 解释。

B 完成提交主任务独立 review；不要只用 scripted model 合法路径宣称模型动作质量修复。

## 验证顺序、预算和评价

执行覆盖只引用 [Test](skills/test/SKILL.md)，质量与证据只引用 [Eval](skills/eval/SKILL.md)，交付按 [Post-change](skills/post-change-verify/SKILL.md)，不改写这些总纲。

1. 各切片先红例/相关测试；变更稳定后一次 typecheck、arch:check、npm test、build，加真实 Chromium 本地 Fixture。无新改动/失败不重复全套。
2. 比较冻结层开工 hash。共享浏览器动作发生变化可调整所属测试；不动语义或Gold迎合结果。
3. 主任务审查离线证据后，在已有用户测试授权内做有界外部验证。预先登记：真实模型+受控网页最多4个run，各最多4模型调用/30秒；目标是模型能选合法操作并产生正确后置状态。可分别覆盖native/custom及失败后的后续页面，按失效机制选最小组合，不用光跑5个业务例替代动作验证。
4. 当前真实来源只读最多3个探针，各60秒/最多6模型调用：Tokyo Ten作为已有正向选项反例；其他来源/不同域名选一个真实公开控件作为迁移观察（运行前主任务审查确切页面与目标）；余下一次仅用于不同机制的必要控制。访问失败记录能力限制，不为凑数量消耗额度；没有合适第三来源不能伪称跨网站Live已评。零外写，不自动重试。
5. 上述机制得到有效证据后，主任务决定是否启动一次 H001 300秒/50调用的整单只读验收；未满足条件就记录具体缺口，不盲跑整单。已授权范围内无需用户再次确认，但实施任务不得自行追加实验/预算。

优先复用现有artifact和diagnostic evaluator。新增字段仅为上述失败可归因所需。Browser动作质量按独立控件/页面前后状态评价，核心指标是有效动作与请求确认、失败隔离及实际调用/耗时；只给已核验范围结论。成功选择不是有库存；安全拒绝不是用户目标完成。保留Mock/真实浏览器Fixture/真实模型固定源/Live不同模式。

固定来源资源schema不匹配、H002–H004同义措辞评价、identity匹配与来源搜索准确率是已记录的其他问题，本轮不顺手修改；必要时限制结论，不借此重建Evaluator或扩改semantic。

## 收敛与交接

禁止新增：多Provider兜底、多级重试、插件注册框架、动作类层级、跨业务DSL、兼容双写、站点名称分支、完整DOM无差别喂模型、全局预算增加。不要为了覆盖低概率低影响情况堆叠防御；已知重复提交/错请求成功等安全不变量继续fail closed。

预估15–25文件只是包括测试/文档的影响范围，不是要完成的文件数；能少改就少改。扩大公共接口前先证明是当前闭环必需。

交回：开工/完成diff边界、冻结层hash对照、每个反例红绿证据、默认与真实浏览器验证、实际模型/Live artifact、仍未覆盖问题及首个原因。同步STATUS/DEVLOG/TEST-LOG和必要Capability Matrix，不复制第二套规则。主任务review不合格继续修；未经用户明确要求不commit/push。
