# Repository Improvement Plan

- Status: In progress
- Document revision: 0.2
- Last updated: 2026-09-05
- Source of truth for: 2026-09-05仓库Review发现的合并整改清单、实施顺序和验收建议；不定义当前产品能力或替代Accepted ADR
- Related ADRs: [ADR Index](decisions/README.md)、[ADR-0014](decisions/0014-search-only-results-completion.md)
- Related documents: [Index](INDEX.md)、[Status](STATUS.md)、[Repository Conventions](REPOSITORY-CONVENTIONS.md)

## 范围与使用方式

材料状态：整改执行记录；逐项状态见下表。本清单来自当前工作树的静态Review，包括已有未提交改动；它不是测试通过报告，也不是全部项目同时开工的实施计划。保留原Review发现用于核对验收。

Review覆盖AGENTS、项目Skills、产品与架构文档、运行入口、配置、源码职责及测试组织。合并了前几轮重复发现；历史事实错误、规则改进和可延后重构分别安排优先级。

排除人工标注数据、Golden Set、私有Holdout原文、已有测试artifact及其内容。不得为落实本清单移动、改写、重新标注、重新评分或删除这些材料。涉及场景时只引用既有稳定ID和测试入口；若后续确需调整被排除材料，另行明确范围。

用户已授权执行；此次实施A类与浏览器诊断最小切片，C类重构依原定触发条件延后。模型Prompt及排除数据保持。

## 需要保留的原则

- Runtime仍是权威Task State唯一写入者；模型只产生不可信提议。
- 外部写操作仍受Policy、具体Authorization、幂等和结果验证约束；提交后不明确仍为`OUTCOME_UNKNOWN`，禁止盲目重试。
- 网页是不可信输入；Secret、PII、Cookie、挑战token和人工接管输入遵守既有保护规则。
- 保留`core / domains / application / infrastructure / integrations`总体分层。
- 保留Accepted ADR、历史日志、研究记录和已归档设计；历史正文不按当前实现机械改写。
- 不因文件行数、相似名称或同属Fixture而机械拆分/删除文件；不为本次整理建立新的通用框架。
- Mock、Replay、Live Read-only、Controlled Live-write和真实模型评测的结论分别记录。

## 排序总览

| 顺序 | ID | 工作项 | 实施时机 |
|---|---|---|---|
| A | A01 | 明确浏览器产品目标与控制边界 | 先完成文档一致性整理 |
| A | A02 | 解决ADR-0014与TableCheck证据范围冲突 | TableCheck完成H001之前 |
| A | A03 | 明确本地eval持久profile的安全例外 | 继续持久会话实验前落实适用范围 |
| A | A04 | 精简AGENTS阅读路径与分级Planning | 后续实施开始前 |
| A | A05 | 收敛Test/Post-change职责与实验授权规则 | 与A04一起整理 |
| A | A06 | 校正Eval执行、评分和污染状态说明 | 与A05一起整理 |
| A | A07 | 修正配置示例和README运行入口 | 优先处理的低成本修复 |
| A | A08 | 清理Roadmap的历史混杂与阶段重叠 | 与A01、A02对齐 |
| B | B01 | 收敛浏览器诊断入口 | 下一浏览器纵向切片 |
| B | B02 | 使实验结论、失败记录与实际证据一致 | 与B01一起实现 |
| B | B03 | 增加真实浏览器行为验证和覆盖映射 | 按当前浏览器风险选择最小场景 |
| C | C01 | 分离轨迹契约、Postgres与内存实现 | 修改相关调用链时进行 |
| C | C02 | 拆开Workspace职责并检查前端脚本 | 接入Live Web/授权/接管时进行 |
| C | C03 | 明确构建产物与架构检查范围 | 构建/部署或依赖检查专项改动时进行 |

## A：先修正文档与规则

### A01 — 明确浏览器产品目标与控制边界

**发现：** 产品定位支持API、Browser和Human Takeover，但通用守卫只强调模型不能直接执行Tool；对“模型提议受控操作、执行层执行、用户临时接管后继续”的职责解释不够明确，容易把一次来源访问失败扩大为产品方向变化。

**范围：** [Project Positioning](PROJECT-POSITIONING.md)、[MVP PRD](product/MVP-PRD.md)、[User Flows](product/USER-FLOWS.md)、[Arch Guard](skills/arch-guard/SKILL.md)、[Agent Orchestration](architecture/AGENT-ORCHESTRATION.md)。

**调整：** 明确无API网站的浏览与受控操作是持续建设的核心能力；API是可用渠道之一。区分页面等待、重新观察、失败重试和重复提交。人工接管不扩大授权，恢复后重新核验页面、任务参数与必要证据。按现实效果识别副作用，不以GET/POST或按钮名称代替判断。Browser Agent具体观察/动作契约放架构文档，不扩写到所有Skill。

**验收：** 文档能回答模型可提出什么、谁可执行、何时接管和何时恢复；不把任意网站自动化承诺为已具备。若改变既有职责、部署或权限边界，先新增ADR；本项不直接启用新执行路径。

### A02 — 解决ADR-0014与TableCheck证据范围冲突

**发现：** [ADR-0014](decisions/0014-search-only-results-completion.md)限定HIGH-confidence Google-to-Tabelog身份；[Restaurant Domain](domains/RESTAURANT-BOOKING.md)、Grounding和Source Resolver已支持TableCheck。

**调整：** 新增范围有限的ADR，明确只读结果可以依据Google候选与受支持预约来源之间的HIGH同门店身份，并继续要求地点、HARD约束、正确日期/人数/时段与新鲜空位证据。具体平台及验证范围由Capability Matrix维护。

**验收：** 原Accepted Decision不被静默改写；新的替代关系明确；Domain、Validator、Grounding和测试口径一致。TableCheck通过并不免除其他任务条件，也不代表真实Booking成功。

### A03 — 明确eval持久profile的安全例外

**发现：** [Data/Security](architecture/DATA-CONTEXT-SECURITY.md)要求每Task/Attempt隔离并在终态销毁profile；[Capability Matrix](integrations/CAPABILITY-MATRIX.md)的本地eval使用固定持久目录并在正常退出后保留。

**调整：** 分别定义产品会话与专用本地eval profile的归属、隔离、启用方式、保留期和显式清理方式。产品接管与eval终端暂停分别表述；不读取日常Chrome个人profile，不自动删除用户需要保留的会话。涉及关键数据政策变更时通过ADR明确。

**验收：** 高优先级安全文档覆盖例外及其边界；持久profile不能因gitignored而被视为没有敏感数据；规则不把开发环境行为无条件扩展到生产。此次整理不清理任何现有profile。

### A04 — 精简阅读路径与分级Planning

**发现：** [AGENTS](../AGENTS.md)、[INDEX](INDEX.md)、[Planning](skills/planning/SKILL.md)重复维护阅读要求；Planning把大量Semantic/Compiler/Gold问题作为通用强制问题，并要求未知平台实现细节在实验前全部确定。

**调整：** AGENTS保留简短入口、关键边界与工作方式；INDEX唯一维护按改动范围的阅读路径。Planning区分三类：诊断实验（假设、控制变量、预算、停止条件、产物）、局部实现（行为、模块、验收、验证）、架构/安全变化（追加状态、权限、幂等、数据政策和ADR）。专项问题按实际改动展开，不受影响项可简记。

**验收：** 浏览器启动或解析修改不要求重复回答完整语义评测问卷；未知能力先安排有界验证，不作为事实编码。同一会话已读且未变化的文档无需机械重读。计划仍只包含一个可运行的当前切片。

### A05 — 收敛验证职责与实验授权规则

**发现：** [Test](skills/test/SKILL.md)与[Post-change Verify](skills/post-change-verify/SKILL.md)重复定义检查矩阵；后者列四条命令却写“以上三项”，还对首次Adapter接入一律要求Replay。Test仍记录过时的当前测试数量。文档同步列表容易被执行为无条件修改所有文档。

**调整：** Test唯一维护“改动范围→必要验证→能证明什么”；Post-change引用矩阵并负责交付检查与结果汇报。将当前通过数量移交STATUS、详细运行记录交TEST-LOG。无真实Replay样本时明确标为未验证，先只读观察再建立脱敏回归；Fixture不得冒充Replay。文档只在职责、行为、契约或验证口径确实变化时同步。

**授权补充：** Eval中“每次再次运行必须单独付费授权”改为支持用户明确限定案例、调用数或费用的实验授权；已授权范围内继续，超出后再确认。环境开关不是用户授权的替代。真实业务写入仍绑定具体Proposal与Authorization，不能套用开发实验授权。

**验收：** 检查矩阵无冲突；文档整理不机械触发完整运行时测试；安全和状态变更仍跑对应严格验证。报告区分通过、失败、未运行、不适用，以及已知覆盖限制。

### A06 — 校正Eval状态说明，分开执行、评分和污染

**发现：** [Eval Skill](skills/eval/SKILL.md)、[Eval README](../src/eval/README.md)仍称Agent Loop没有Runner、drafts未接入；实际Hybrid Runner已读取其中输入，同时正确报告Scorer未集成。[Harness Design](harness/HARNESS-DESIGN.md)的部分Live状态说明也落后于代码。

**调整：** 分别说明执行状态、评分状态、数据污染/基线资格。允许“可运行、未评分的诊断”有明确位置，不把它等同于完整质量Baseline。实现职责、协议、当前事实和历史结果各归其负责文档。

**排除边界：** 先修正文档和非数据元信息中的事实说明。前轮建议的“把已运行输入从drafts移动到cases”涉及此次排除材料，不纳入本次实施范围；将该路径与命名规则的不一致列为待后续专项处理，不能报告为已经完全解决。

**验收：** 文档能分别回答是否可执行、是否评分、是否可作独立质量评价；已有标注、内容、哈希、评分结果和artifact全部保持。历史证据不被抬升为当前Baseline。

### A07 — 修正配置与README入口

**发现：** [.env.example](../.env.example)引用已删除的Intent/Decision Eval命令和旧开关说明，缺少LOCAL_CHROMIUM及人工恢复配置介绍；[README](../README.md)加载.env的命令列表未覆盖现有浏览器入口，并混有旧研究仓库描述和大段当前实现/评测摘要。

**调整：** 配置按本地Web、模型Eval、浏览器只读实验、数据库维护分组；只说明当前实际使用的变量和默认安全值。README保留安装、启动、默认离线验证和权威文档入口；冻结探针、Live与付费命令分别标记。研究历史引用现有归档，不复制维护能力状态。

**验收：** 示例中的命令均存在于package scripts，变量与实际读取一致；普通测试不因示例而默认启用Live；个人.env不被读取、修改或提交。文档与命令一致性可用简单静态检查完成。

### A08 — 清理Roadmap历史混杂和阶段重叠

**发现：** [Roadmap](roadmap.md)的Stage 2C混入历史Prompt演进，并把occasion等旧结构写成当前能力；Stage 2C完成条件已含Live Availability，Stage 2D又要求第一条Live Availability路径。

**调整：** 每Stage只保留产品结果、进入条件、交付范围和退出条件。历史内容保留在已有历史目录或移入明确标记的回顾文档，移除当前路线中的重复正文。区分单路径技术诊断、完整搜索产品验收、真实Booking验证的阶段责任。

**验收：** 每个退出条件只有一个主归属；H001诊断通过与整个Stage完成分别表述；当前能力链接STATUS。历史材料得到保留，不为文档清理重写历史决策或标注。

## B：随下一浏览器切片落实

### B01 — 收敛来源诊断入口

**发现：** 旧Tabelog Probe（已由[单页入口](../src/eval/restaurant/agent-loop/runners/run-browser-read-probe.ts)替代）直接构造Cloudflare、要求多个URL并跑两种引擎，未复用[Runtime Factory](../src/infrastructure/browser/browser-runtime-factory.ts)，难以驱动当前单URL本地实验。TableCheck仍使用店名URL hint，导航后立即snapshot，真实页面加载/控件兼容性未验证。

**调整：** 复用Runtime选择与现有Adapter，实现单来源、单候选、单URL、有明确deadline和会话预算的只读诊断；引擎对照显式启用。记录URL来源与网络/profile条件，把有效入口、页面就绪、身份、日期人数、空位分别验证。正常DOM等待有界，不以盲目刷新或无限重试处理challenge。

**验收：** 诊断不依赖每次重跑Semantic/Agent/Google；直接提供的URL只是实验输入，仍核验身份，不能作为自动Discovery事实。人工对照结果标为用户报告；直连与无痕同时变化不被过度归因。实测后才确定必要的页面修复，不预建通用爬虫或多个新Runtime。

### B02 — 使结论和失败记录对应实际证据

**发现：** 当前probe将snapshot成功直接写成pageLoadSuccess/jsExecution，通过关键词推断控件usable；Hybrid Runner的sideEffects为固定零。Semantic早期失败在artifact生成之前抛错，导致实际实验无完整运行记录。

**调整：** 区分检测到、已尝试、已验证、未测量；控件是否可用以实际操作后页面状态证明。区分静态只读路径约束与执行层实际观察计数。实际实验启动后，成功、失败、取消和异常都保留最小脱敏记录，区分已执行、失败、未到达阶段；保留已有调用统计与清理结果。

**验收：** challenge不算业务页面成功，DOM关键词不算控件已工作，常量不冒充测量；正常异常出口均有记录，进程被强杀等不能保证完整收尾的情况保留开始记录并可识别未完成。新增记录不覆盖已有artifact，不保存凭证或完整页面敏感内容。

### B03 — 补足真实浏览器行为验证

**发现：** 当前TableCheck和本地Chromium测试主要通过Fake BrowserSession/Browser对象验证Contract；select回传输入、waitFor为空，无法证明异步页面正确刷新。Golden目录与实际测试的对应主要由摘要文字说明。

**调整：** 明确区分Adapter Mock、真实浏览器+本地Fixture页面、Replay和Live Read-only。按当前风险选取少量动态场景：请求条件变更后加载未完成、旧slot残留、challenge解除但业务页尚未就绪、接管返回错误门店或请求条件。检查失败时不产生错误可用/成功结论。

**验收：** 浏览器交互测试实际操作本地页面并核验状态；Fixture/Replay不被称为真实来源验证。覆盖映射在Harness说明中引用既有场景ID、测试入口和模式，不改人工Golden文件；暂未实现的未来目录项不自动变成本Stage必过项。Live写入验证仍待明确的具体授权。

## C：按真实修改需要进行局部重构

### C01 — 轨迹契约归位

**发现：** [Trajectory Store](../src/infrastructure/postgres/restaurant-agent-trajectory-store.ts)同时包含轨迹契约、Store接口、Postgres与内存实现，Agent Loop、Harness和内存Eval均从postgres目录导入。

**调整与验收：** 应用层持有Restaurant轨迹契约，Postgres与内存实现各归基础设施职责；修改所有调用方，不建立重复契约或兼容导出。轨迹序列化语义不因文件移动变化；typecheck、architecture check和相关持久化/内存行为测试通过。无需泛化为跨Domain平台。

### C02 — Workspace与前端职责整理

**发现：** [Persistent Restaurant Agent](../src/application/persistent-restaurant-agent.ts)同时处理Pilot Session认证、Case编排、Activity投影和摘要，部分文案固定Fixture；[Workspace Page](../src/web/local-workspace-page.ts)将浏览器JS嵌入HTML字符串，服务端TypeScript无法检查其内部脚本。

**调整与验收：** 在Live Web/授权/接管开发中按需要分离认证、编排和展示投影；将需要扩展的客户端脚本提取为可检查模块，补关键交互验证。Fixture与Live显示准确，投影不成为权威State，认证和用户隔离行为保持。当前不为整理强制迁移前端框架。

### C03 — 构建与架构检查范围

**发现：** [Build Config](../tsconfig.build.json)仅排除.test.ts，开发Runner/Harness等也会进入dist；[Arch Check](../scripts/arch-check.ts)只用正则覆盖部分静态import，不等于完整依赖验证。

**调整与验收：** 先明确build是全仓编译验证还是产品产物；建立部署入口时再收窄产物范围，注意exclude不能阻止被产品入口实际导入的开发模块。文档准确描述架构检查覆盖；专项扩展时可使用已有TypeScript AST，明确静态/动态导入和组合入口边界，并以少量违规样例验证。当前不宣称存在已发布产物泄露，也不建设大型治理框架。

## 建议实施批次与停止条件

1. **文档与规则批次：** 完成A类；对ADR/安全政策变化明确Decision状态，未接受的建议不得当作生效规则。排除材料相关的不一致保留为显式待办，不借此扩大整理范围。
2. **浏览器批次：** 在A02/A03等前置边界明确后，选择B类中完成一条TableCheck只读链路所必需的最小改动。先验证真实入口、页面就绪、HIGH身份和请求对应空位，再回到原始H001；不得注入手工结果或放宽HARD条件使H001通过。
3. **局部重构：** C类随实际修改执行。无当前调用或验收需要时留在清单，不阻塞浏览器切片。

原H001、固定候选诊断、Fixture/Replay与人工对照各自报告。未知来源能力达到实验预算后保留明确阻塞证据和下一决策，不追加无上限重试；只读通过后再单独设计真实授权、提交和结果核验切片。

## 验证与交付

- 文档批次：检查相对链接、命令/配置引用、权威一致性和diff；不因纯文档修改运行付费Eval或Live请求。
- 代码批次：按更新后的Test矩阵运行必要typecheck、arch:check、相关测试与build；状态、Policy和P0变化按其严格门禁验证。
- 每批只记录实际修改和实际检查，分别说明失败、未运行及原因；未执行的Live或Replay不能写为通过。
- 当前能力/证据变化才更新STATUS；历史过程和验证结果分别追加DEVLOG、TEST-LOG。
- 暂存、提交或推送时隔离已有未提交改动；远端推送仍需用户明确授权。

## 本清单整理时的证据

静态核对的43份当前文档/入口文件无失效相对链接；现有测试文件均被npm test路径规则匹配。该结论只证明链接与文件发现完整，不证明测试、浏览器交互或产品功能通过。此次没有执行测试、Live读写、付费模型请求或任何数据集操作。

## 2026-09-05执行进度

| 项目 | 状态与剩余范围 |
|---|---|
| A01–A05、A07–A08 | 已实施；ADR-0015/0016明确范围，Skills、README/env与Roadmap已同步；旧Roadmap保留在Superseded Archive |
| A06 | 非数据说明已校正；drafts输入目录命名不一致因数据排除范围保留待办 |
| B01 | 单页有界诊断入口已实现；真实URL和来源页面就绪/控件兼容性仍待Live观察 |
| B02 | 单页与Hybrid追加独立start/result记录，失败阶段与未测量字段已区分；未重跑付费Hybrid |
| B03 | 真实Chromium本地动态Fixture已实现并独立验证；真实响应Replay、来源Live与原始H001仍未通过本次验证 |
| C01、C02 | 按计划延后至相关调用链/Live Web开发，不为整理扩大重构 |
| C03 | 已明确全仓编译与正则架构检查范围；部署产物收窄/AST检查留待专项 |

验证结果见[TEST-LOG](history/TEST-LOG.md)。下一步使用已确认可访问的准确公开URL进行单变量只读实验，再决定Adapter修改和原始H001重验。
