# P2-0 加固批报告（四项实现与2次Live执行完成；待独立复核）

Evidence status: exposed development evidence，不是Clean Baseline。基线921aa76已通过git pull --ff-only取得；通读codex-instruction、P1-G复核、phase-1-signoff及Playbook1.8。第一阶段已独立签收，P2-0只处理四项获批通用缺陷；不改Gold／变体／见证，不扩大交付资格或只读准入。用户已有未提交INDEX、Booking草稿和演示文件保留，不纳入本批。

切片顺序：Guard逐跳安全 → 显式模型限额接线 → 无可执行路径／TIMEOUT诚实结束 → typed失败分类／结构化原因／evaluator@28。每项独立红绿、四门禁、本地提交；最后冻结新生产提交；执行h002原版与用户最新授权的h001明日日期回归。起点1014/1500模型、37累计Live，新预算正式2次／启动后环境重跑最多1次；当前新增72模型／4Google业务／2正式Live；累计1086/1500模型、39Live。h001已按用户最新授权立即执行，目标日期改为东京10/16；未建立自动任务，结果见末节。

## 1 Guard逐跳重定向

提交976baaa。实现采用CDP Fetch补充拦截：普通context.route负责第一请求，首个请求之前安装CDP，Location响应和后续原生请求均按原策略核对；10跳内有界。允许URL、方法、资源类型、query/body grammar均来自原ADR-0036与现有来源规则，无新增放行规则。Chromium原生跟随合法跳转，保留最终页面URL、相对链接、重定向Cookie与状态码方法转换。不会把最终响应体作为起始URL的页面交付。

显式Runtime页面在暴露前preparePage；popup首请求可能尚无Frame，先提交无外部请求／不记录为来源响应的空忙碌引导页，建立CDP后才请求原始GET。iframe子目标在恢复前安装同一保护；dedicated worker请求经owner-frame Fetch拦截，真实Fixture验证。Local与CloudflareSession共用安装；未验证真实远程Cloudflare引擎兼容性，安装失败仍关闭边界。HAR无法本地履行而试图原生跳转的请求拒绝，不能退回Live网络。静态CDN被来源规则放行不会晋升为通用文档来源。

红灯：guard/red.log为改动前真实Chromium，9项失败；其中fetch/XHR原Fixture受Chromium Local Network Access遮蔽，未把它们算作Guard实际接收端红证据。修正Fixture允许CORS并仅授予本地源LNA权限，再用921aa76原版Guard隔离副本复验：guard/red-corrected-receiver.log，13执行／1通过／12失败；有效机制依据是B／敏感路径接收端实到、录制遗漏后续跳、循环超过Guard上限，popup等待失败不单独充当receiver证明。源SHA／Fixture SHA见red-source-verification.json，诊断执行副本已删除。没有用假的第二次handler调用作为多跳证明。

绿灯：guard/chromium-green.log，14/14真实Chromium：文档多跳越源、经公开路径进入敏感路径、合法多跳最终URL＋相对链接＋Cookie＋每跳录制、fetch/XHR/script/stylesheet/image、循环上限、popup／iframe／worker、正常popup、已审核CSS的相对导入与CDN权限不扩张。错误的假route第二跳测试已移除；Unit只证明初始请求策略匹配，CDP测试端口不冒充真实浏览器证明。

门禁：guard/{typecheck,arch-check,npm-test,build}-green.log全过，默认862/862。较早npm-test.log的6例失败来自固定来源BrowserContext端口缺新接口，更新端口后恢复；unit-initial.log中一例Chromium被sandbox拒绝，最终门禁在宿主机离线运行。完整浏览器套件browser-fixture.log是97/99，两个旧native dynamic Tabelog场景失败；同样2例在未改的b55e91c冻结树也失败（baseline-browser-native.log）。不改断言或顺带扩写旧发现Fixture，将其列为既有失败；本次受影响Guard的14/14及默认四门禁绿灯分开报告。browser-native-green.log保留当前树同样失败的复跑，不称全套浏览器测试通过。

证明范围：真实本地Chromium请求前边界与正常跳转语义＋默认L0/L1；当前外部来源／远程引擎要由后续两次Live及独立复核判断。到此真实模型／Google业务／Live新增均0。

## 2 显式浏览器限额接线

已完成；详细红绿、门禁和提交见下方对应章节。

## 3 无可执行路径与读取时限

已完成；详细红绿、门禁和提交见下方对应章节。

## 4 typed失败分类与evaluator@28

已完成；详细红绿、门禁和提交见下方对应章节。

## 冻结及Live

已冻结35b6bf0；h002与h001明日日期回归均已执行，详见末节，停止待独立复核。不推送。

## 2 显式模型额度接线

- Guard提交：`976baaa`。本项模型/操作三限额在Executor类型中必填，构造缺失、非正整数立即拒绝，移除隐藏12/6/24。所有调用入口显式提供；Live/Web原生找店20/120/80，事实4/120/24，查位20/120/80；独立探测/固定源保留各入口明确配置。每条执行器诊断的 `effectiveLimits` 给出阶段实际生效值（共享总额取最小值）。整单模型50不变。
- `limits/red.log`：同Live的`createHybridReadComposition`、Native读组合、查位组合和生产Guard/来源网络策略，固定网页上实际13步查位后再调用原生找店，未手填计数。旧码第一次请求前报BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED。为隔离本项接线，查位端口返回前触发后续找店探针；这不证明Agent会自主选择该顺序。
- `limits/green.log` 同用例通过；构造缺限额有类型反例和运行时反例。四门禁 `limits/{typecheck,arch-check,npm-test,build}-green.log`，864/864。最初沙箱默认测试被Chromium/HTTP权限拒绝，宿主机重跑完成，原日志保留；不计产品红灯。
- 证明范围：L1固定来源/脚本模型，真实调用与共享计数；CDP逐跳边界沿用第1项真实Chromium证明。0真实模型、Google业务、Live。本项提交号见最终索引。

## 3 不可执行读取／无进展／TIMEOUT

- 第2项提交 `60e78b9`。`termination/extract-state.mjs` 读取原冻结树P1-G2 h001，按事件前缀重建第6步之后/第7步之前的version7状态，与原轨迹stateHashBefore精确相等；`state-proof.json` 保留原产物SHA/路径，结构和码保留在 `src/application/fixtures/p2-0-h001-exhausted-state.json`，页面原文不保留。
- `termination/red.log`：原码12次新Agent提议；TIMEOUT为FAILED。`green.log`：真实状态0次新提议直接NO_VERIFIED_RESULT；终止/系统反例15/15。额外3个动作分别验证已知浏览器／整单额度在校验拒绝；连续执行失败3步停止，旧Guard生产组合回归保持通过。
- `readBudgetStatus` 从实际共享查位预算提供，循环在模型提议前预判；先前记录的预算失败也阻断新读取。执行失败不再重置无进展计数；TIMEOUT任务和循环结果都成为面向用户的完成。服务商拒绝、异常、授权失败、取消未改成普通业务成功。资格规则不变。
- 四门禁 `termination/{typecheck,arch-check,npm-test,build}-green.log`：870/870。Web整单时限与Harness旧TIMEOUT断言改为新明确合同，最初旧断言红灯保留于npm-test-initial.log。
- 证明范围：真实状态离线复现＋L1/持久化Web离线；不是当前网站Live。0真实模型/Google业务/Live。本项提交号见最终索引。

## 4 typed失败码与结构化结束／evaluator@28

- 第3项提交 `f759c34`。失败码注册表与分类表显式穷尽，State/Event/Router及读取metadata/continuation使用typed集合；Model/Policy新增码会使分类表编译失败，Browser/Google码由类型合同覆盖。未知外部码规范为AGENT_EXECUTION_FAILED，未知持久化码fail closed，不使用“列表以外业务”的默认。
- `failure-types/red.log`：结构化结束缺失、@27不能审计系统READ_ENDED，两项有效红灯。`unclassified-code-rejected.log`：在新类型联合临时加入未分类码时typecheck失败，源文件已逐字恢复。`green.log` 终止与evaluator相关100+项；最终四门禁 `*-green.log` 879/879。
- State@15 / TaskDefinition@14；`noVerifiedResult.termination={type,reasonCode,isSystemReason,initiator}`。SYSTEM是结束发起方，预算/时限等仍isSystemReason=false。Accepted接口文档只追加当前Schema说明；不重置数据库，不改写历史State@14产物，也不建旧执行兼容路径。原脱敏历史Fixture仍带其来源Schema；新终止派生回放在副本上绑定15。
- evaluator@28 / rubric@22核对系统事件、终态版本、结构化观察和已查/未查范围。反例含系统原因、伪装服务商拒绝、观察不一致、缺事件、虚构已查。不会把有范围的无结果认作来源穷尽／全部无位；资格规则未变。

| 离线评价对象 | 评价版本 | 合格交付 | COMPLETION_OUTCOME |
| --- | --- | --- | --- |
| P1-G2原始产物、原评价原样保留 | @27 | NO | NOT_EVALUATED |
| 同一原始字节、单独新评价 | @28 | NO | NOT_EVALUATED |
| 原第6步真实状态经新终止路径的派生离线回放 | @28 | NO | SATISFIED |

原产物SHA `70182d7548231fc6723823429dfcbabfe6b8d0af91f117d2b587b1cc4feec6fb`；原产物没有结构化字段，不给它补字段后宣称旧Live通过。新旧对照 `failure-types/reevaluation-summary.json`、`original.evaluator28.json`；派生回放 `derived-step6.execution.json` / `derived-step6.evaluator28.json`，明确OFFLINE_STATE_REPLAY，历史前缀是继承证据而非重新执行。派生回放资源字段只计本次离线终止0外部调用，不表示原Live消耗0。`reevaluate.mjs`保留原事件前缀/hash核验及禁止外部调用的边界。

### 本地实现提交索引／Live准备

1. Guard：`976baaa`。
2. 显式额度：`60e78b9`。
3. 不可执行路径／TIMEOUT：`f759c34`。
4. typed原因／evaluator28：`35b6bf0`。

截至四项离线工作，新增模型0、Google业务0、Live0；累计仍1014/1500模型、37历史Live，P2-0预算2正式＋最多1启动后环境重跑。东京10/15已过17:30，h001不得当日启动；留至下个有效窗口。此处为离线完成时检查点；h002后续正式结果与最新累计见末节。用户并行INDEX/Booking草稿/三份演示文件不纳入提交。


## 冻结与Live回归（两次已完成；h001为日期调整回归）

生产冻结 `35b6bf0e6ef69f2b30542d66c75d1badff2a144a`，宿主机干净树 `/Users/wangzhour/.codex/worktrees/p2-0-live/Praxis-Zhixing`。旧P1-F/P1-G/P1-G2/实验树未动。外层基于P1-G2：只适配本批用例/预算/路径/时窗和evaluator28，G1允许项、停止规则、余额预检和交付后GET核验保持；差异 `prep/outer-adaptation.diff`。冻结9个文件的SHA见 `prep/scripts/freeze.json`，execute SHA-256 `3231ef9cc3cf208c3fb3e05208bea587b3a73398dba97266acc7d51c556e1c29`。h001/h002均已离线空跑，`prep/dry-h001.json`、`prep/dry-h002.json`，0网络；最初依赖整目录symlink被git当作未跟踪，改为ignored目录内包symlink后确认CLEAN，未改冻结提交。运行前后9SHA均匹配。

| 用例 | 预检／正式状态 | 展示 | evaluator@28 | 耗时 | 模型／Google | 等待 | 浏览器超时 | 交付后核验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| h002 | 首次preflight通过，SUCCEEDED / PRESENT_RESULTS | Ginza Sushi Sendou，TABELOG，390 m（1家） | Qualified UNKNOWN；Required evidence SATISFIED；Completion PRESENTATION_RECORDED / NOT_EVALUATED | 207.540秒 | 25 / 1 | 25.750秒 / 12.41% | 未观察到 | 200，展示18:30在selection中 |
| h001（用户批准改明日） | 首次preflight通过，SUCCEEDED / NO_VERIFIED_RESULT | 0家 | Qualified NO；Completion NO_VERIFIED_RESULT / NOT_EVALUATED | 473.822秒 | 47 / 3 | 121.165秒 / 25.57% | 有，诊断见summary | 无交付，不适用 |

h002首检UTC2026-10-15T10:36:40.170–10:36:45.253，TableCheck206，余额可用；正式10:36:45.322–10:40:12.937（以原result的finishedAt为准）。指名地点由Google解析为Higashi-ginza Sta.，35.669700299999995,139.7671399，半径1000m；顶层Google类型未由当前Runner持久化，不推断，addressComponents.types见summary。展示门店坐标35.66857859380928,139.76305499491173。UNKNOWN的自动依据见原评价逐维记录（条件措辞需独立确认），不自判等价或签收。发现/事实/查位真实浏览正常返回展示；并不把本次表现推广为所有来源可靠。找店实际限额由执行器诊断记录20/120/80；此次浏览器模型12次，不声称本次Live独立证明了>12后再找店。

交付后立即四参数公开GET：rst_id=13295658、svd=20261017、svps=2、svt=1830，UTC10:40:13.069–10:40:14.206；`prep/live/h002/attempt-1/post-delivery-raw/13295658.body.txt` / `.metadata.json`，SHA `524a157b71b51a31e5796e383e4957246b2d7fb6ed58fb0add56f222cb65b5db`。DISPLAYED_TIMES_PRESENT，未触发停止；未触发已批准的停止规则；正常G1入口GET及审核日历POST不计为外部写操作。

### h002原始产物

- result: `/Users/wangzhour/.codex/worktrees/p2-0-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-15T10-36-45-322Z-4f068525-83ce-49f6-8a63-b51138baa05f.result.json`
- evaluation@28: `/Users/wangzhour/.codex/worktrees/p2-0-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-15T10-36-45-322Z-4f068525-83ce-49f6-8a63-b51138baa05f.result.evaluation.28-1792060814302.json`
- decisions: `/Users/wangzhour/.codex/worktrees/p2-0-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-15T10-36-45-322Z-4f068525-83ce-49f6-8a63-b51138baa05f.decisions.jsonl`
- recording: `/Users/wangzhour/.codex/worktrees/p2-0-live/Praxis-Zhixing/.eval-artifacts/recordings/hybrid-1792060605272`

本批本地摘要／核验：`prep/live/h002/attempt-1/summary.json`、`verification.json`、`finish.json`、`trace.jsonl`、`evaluation-copy.json`。25决策=25模型调用且SHA匹配；result/eval/decisions和录制目录全部存在、文件SHA已记录。录制明确 **NOT_REPLAYABLE / UNSAFE_DOCUMENT**，不声称静态回放可用。没有模型回放或额外余额/网络探测。

### h002结束时的检查点（后被下方即时运行授权更新）

- 实际新增：模型25、Google业务1、正式Live1、环境重跑0。累计 **1039/1500模型、38历史正式Live、Google已确认24／历史完整UNKNOWN**；本批1/2正式，环境预留1未使用。余额与preflight GET为授权网络预检，不记模型调用。
- 当时h001因四项修复完成时东京已过17:30而未启动，未消耗preflight/模型/Google/Live。下一个可用窗口10/16东京09:00–17:30（按原外层要求保留500秒完成时间）。
- 自动审批先拒绝每日续跑、再拒绝COUNT=1单次续跑；第二次理由是未来自动启动外部h001 Live需要人类明确排程授权。**自动化未创建**，证据`prep/scheduling-block.json`。不会绕过或伪造时间，待用户批准排程或在有效时窗直接指示续跑。h002已完成，绝不重跑。
- 此处为h002结束时状态，彼时h001尚未执行。下方最新授权与h001运行记录更新该检查点；不得把执行完成称为两次合格交付或自行签收。


## h001立即运行：用户授权改为明日（2026-10-15）

最新人类指令“可以直接重跑001，date换成明天”覆盖原h001启动时窗。本次未安排自动任务，也没有模拟时钟；在真实东京10/15晚间立即运行，目标 **2026-10-16 19:00，2人，Shibuya附近，omakase HARD**。此结果是日期调整回归，不能标成未变的Gold@7原版结果。

只用既有development-variant机制创建独立文件 `prep/h001-tomorrow-20261016.yaml`（id仍h001），原content只有tonight→tomorrow、semantic.date同步；dataset/parent/reference元数据显式记录。其他semantic、HARD、acceptance逐项断言与父Gold一致，原Gold与既有变体/见证不改。输入SHA `52c29ed3d2edf740c984f05b7ca32891c5d53b308196e0f9abc79e170a50e39f`；运行目标日期与final intent均为10/16。授权及检查 `prep/h001-date-authorization.json`、`h001-input-check.json`，离线空跑 `dry-h001-tomorrow.json`（0网络/模型）。

生产仍 `35b6bf0e6ef69f2b30542d66c75d1badff2a144a` / CLEAN。外层只适配h001输入路径及这次即时日期授权的时窗，其他预算、停止和交付后核验逻辑不变；差异 `prep/h001-date-outer.diff`。h002所用冻结原样备份为 `prep/freeze.h002-used.json`；当前 `scripts/freeze.json` 12SHA均核对通过，execute SHA `cd99bc44b35a69adc18ba6f3825f8e0c89f8ee288e8bbe970f879b366d47757f`。

首检UTC11:41:41.938–11:41:49.638通过，TableCheck206，余额可用；正式UTC11:41:49.707–11:49:43.593。SUCCEEDED / NO_VERIFIED_RESULT，Agent第11步END_READ正常结束，零展示，未以FAILED终止。结构化原因 `{type:END_READ,reasonCode:AGENT_END_READ,isSystemReason:false,initiator:AGENT}`；remainingGaps记录MODEL_CALL_RESERVE及已查/未查范围，不把未知或未查门店说成全体无位。

47模型、3Google（本次新增），473.822秒；等待121.165秒/25.57%，观察到候选/来源范围浏览器超时，细节在summary的timeoutReferences。实际共享浏览器模型调用最大36，DISCOVERY在>12后仍有实际模型决策/动作；这补充第2项Live额度接线观察，不等于来源可靠性或合格交付已验证。未触发外层停止条件，能力结果不重跑；零交付，不执行交付后GET，也不抓原版见证。

Evaluator@28：Qualified NO；AUTHORITATIVE_CONDITIONS、INVESTIGATION_BEHAVIOR、RESOURCES为SATISFIED；COMPLETION_OUTCOME为NOT_EVALUATED（正常Agent END_READ的范围/文字缺口不足以独立证明调查充分），保留原评价不改判。它不是本次系统强制READ_ENDED路径的Live证明；该路径的证明仍是第3、4项真实状态离线回放/L1。地点解析Shibuya，35.6619707,139.70379499999999，半径1000m；顶层Google类型未保留，addressComponents.types见summary。

### h001原始产物

- result: `/Users/wangzhour/.codex/worktrees/p2-0-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-15T11-41-49-707Z-27149611-9570-4967-9909-0e8148dfac1c.result.json`
- evaluator@28: `/Users/wangzhour/.codex/worktrees/p2-0-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-15T11-41-49-707Z-27149611-9570-4967-9909-0e8148dfac1c.result.evaluation.28-1792064983772.json`
- decisions: `/Users/wangzhour/.codex/worktrees/p2-0-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-15T11-41-49-707Z-27149611-9570-4967-9909-0e8148dfac1c.decisions.jsonl`
- recording: `/Users/wangzhour/.codex/worktrees/p2-0-live/Praxis-Zhixing/.eval-artifacts/recordings/hybrid-1792064509652`

本批本地事实与核验 `prep/live/h001/attempt-1/{finish,summary,verification,evaluation-copy}.json`，主摘要 `prep/h001-final-facts.json`。47条决策=47次模型调用，SHA匹配，原result/eval/decisions与录制文件均存在并保存SHA。录制NOT_REPLAYABLE/UNSAFE_DOCUMENT，不宣称可静态回放。

### 最终用量与停止点

- 本批正式2/2（h002原版、h001用户授权改明日日期），新增72模型、4Google业务、2Live，环境重跑0，预留1未使用。
- 累计 **1086/1500模型、39正式Live、Google已确认27／历史总量UNKNOWN**。余额与端点预检不计模型/正式Live，已另留原响应。
- 四项代码提交976baaa、60e78b9、f759c34、35b6bf0；冻结生产35b6bf0、四门禁879/879、Guard真实Chromium14/14复用。既有完整浏览器套件2项失败限制保留。
- 本轮仅修改授权评测输入、外层与证据文档，没有生产/Prompt/Schema/配置/资格/Gold修改。纯文档与离线输入/SHA验证完成，不为本次Live记录重复跑四门禁。无自动化创建、无未来续跑；本地提交不推送，停止等待独立复核，不自行签收。

## h001追加见证GET（用户本轮授权，2026-10-15）

针对2026-10-16 19:00（Asia/Tokyo）、2人，Shibuya Sushi Sen/13275802、Shibuya Sushi Matsumoto/13261619、Sushi Tokyo Ten/13225919、Sushi Teppen/13308491各一次四参数公开GET。UTC2026-10-15T13:05:57.668Z—2026-10-15T13:06:01.862Z，4/4 HTTP200。原始响应、参数、时间戳和SHA见 [witness-after](prep/live/h001/witness-after/README.md)，离线JSON／SHA／四参数校验PASS。仅较晚来源观察，不证明此前Live时库存、不覆盖原评价、不归因。新增4公开GET、0模型／Google／正式Live，累计用量不变；本地提交，不推送。
