# Round 23：九项 UI 离线验收

2026-11-23。draft / not integrated；签收范围仅为九项 UI 离线结果。非 Live、非真实 PostgreSQL、非真机、非 Clean Holdout 验收。

- 工作树 `/private/tmp/praxis-3c-unified`；分支 `codex/feat-web-photos-unified`。
- 起点 `ddd027cd4f5ccdf95c63eee8f8be738d587bbdce`。
- 唯一验收源码与输入冻结 SHA：**`98cdc3a8fb85c1001151a9261ab83094bf9d09b2`**；`src` tree **`d2651b45e18706f71e6e5e04cb6b094bfd2c00df`**。全部正式门禁、历史路径、视觉绑定此 SHA，运行前后净树。本报告及原始证据随后另做本地归档提交，最终 HEAD 见 Git 本报告所在提交及最终交付回复；源码与冻结提交一致。
- 开工精确恢复/初始输入提交 `d3bf17ebd47300240afc292c7f63eb4c0f3cb5e3`；本轮仅追加独立 round-23 材料，不改历史目录。

## 开工观察与恢复

开工观察到 737 个选入稀疏树的 H 文件工作区缺失：486 `.eval-artifacts`、250 `docs`、1 `phase3`。先保全路径、索引/HEAD/稀疏状态和 **10,558** 个现存证据 SHA-256（包含 **155** 个 restaurant-web-read 文件），再按获准的 NUL 精确路径清单从当前 HEAD 恢复。737/737 Git blob 匹配，原现存证据 10,558/10,558 不变，索引/HEAD/稀疏规则不变且恢复后净树。只报告观察与核验事实，不推断清理原因或未跟踪材料零损失。依赖 `npm ls --all --offline` 成功，无重装或依赖变更。

[预检](preflight.json) · [恢复核验](restoration-verification.json) · [保护基线](protection-baseline.json) · [本机 sparse check](worktree-check.log)。

## 九项结果

| 项 | 离线结果与控制 |
|---|---|
| R1 | About 提示跟随店名，失焦/受理问题后保留；Back/Home 移除属性；空态 Adjust 聚焦提示保留至失焦。390/1440。 |
| R2 | 原生 EventSource + 受控时钟验证持续五秒断流、重复 error 不重置、成功 open 清除、切计划清除、旧实例迟到事件隔离、CLOSED 清除待发定时器与既有胶囊、侧栏同步。另 slice2 实际 HTTP 自动重连对照通过。 |
| R3 | 被移除店名按 candidateId 隔离历史证据；拒绝 googleapis API / LOW / MEDIUM 分店链接，回退本店 Maps；无合格 URL 为纯文本。历史已验证证据、独立两店与同源高置信事实控制通过。通用原因无重复子行，预算/时段原因保留。 |
| R4 | Google 泛化类别过滤、Steak 同义去重，商家分类原文保留；A 条件原文与 B 商业条款各保留来源/读取时间。只有 coursePriceYen 时金额/来源/JST 均显示，无伪造 blockquote 或孤立空引用组。390/1440。 |
| R5 | **仅 Q&A 的 blockquote** 去除同 URL/readAt 的吸烟表头；答案正文逐字保留。支付两条、不同时间两组、About/Handoff 原文不变。390 答复弹层与 About 历史均用 Range 逐行几何检查：单行、JST 完整、边界内、无横向溢出。 |
| R6 | 360×800 / 390×844 / 1440×900 标题 Range 物理单行、相对所属主内容区居中、无水平溢出。桌面仍保留侧栏布局。 |
| R7 | Chromium visualViewport **离线模拟**覆盖卡片、Stopped、澄清、空态、About 顶部；topbar/标题/条件/输入均在实际模拟可视区内。长 About 焦点切换/收起后 scrollTop 与草稿不变，仍可纵向滚动。真实手机键盘单列待验。 |
| R8 | 390/1440 原生 CDP touch：About 与全屏分别左右翻图和核对 Maps/作者链接；About 纵向滚动、滑图后仍 About、下一轻点打开全屏；全屏滑图后仍打开、关闭返回 About。外链以 context 拦截、本地响应核对目标，无外网请求。 |
| R9 | undefined/0/>0/preview 四种进度；首页 WebGL、reduced-motion、context-lost 下半屏及左右取像素与截图。旧 radialOrb / edge / 圆度 / CONVERGED_BREATH / ORB_LOGO_SYNC 测试文本逐字保留并全通过，focus=1 公式保持。 |

新增浏览器回归 **17/17**，新增纯投影/引用单测 **2/2**，均进入正式默认/Browser Fixture 门禁。所有实际测试名、所在输入文件与 **52/52** 新 PNG 的逐项对应见 [可点击清单](UI-TESTS-AND-SCREENSHOTS.md)、[冻结截图合同](ui-screenshot-contract.json) 与 [执行/PNG 双向核验](ui-screenshot-verification.json)。states 同时传 `PRAXIS_ROUND8_VISUAL_OUTPUT` 与 `PRAXIS_WORKSPACE_VISUAL_OUTPUT`，实际加载 round6、round10、round23、restaurant-photos、web-landing-background 文件，正则包含 Round23 UI。没有用只扩正则代替文件选择。

## 五门禁与架构

| 门禁 | 实际结果 | 秒 |
|---|---|---:|
| typecheck | PASS | 0.655 |
| arch-check | PASS，0 违规 | 0.204 |
| test | 1837/1837 | 71.627 |
| browser-fixture | G2 5/5；Chromium 518/518；合计 523/523；G6 assembly 159/159 | 467.141 |
| build | PASS | 0.586 |

[原始日志与逐项 manifest](gates/manifest.json)；[总编排记录](acceptance/manifest.json)。全部不加载 `.env`；非 Browser 门禁、历史与视觉通过 OS 阻断非回环外连。Browser Fixture 无外层 sandbox-exec，Replay 子进程保持自身 OS 断网断言，G2/Chromium/G6 分列且不重复累计聚合计数。

浏览器严格 TS 保持 true，**18 模块、0 any/抑制、0 环、无反向 import entry**：[静态依赖图](browser-dependencies.json)、[DOT](browser-dependencies.dot)。tsx 与 Build **19/19** 同源脚本逐字一致：[资产核验](build-assets.json)；[HTML/CSS 核验](html-build-comparison.json)。未新增框架/打包器或依赖，CSP 同源策略保持。

## 历史顺序与视觉

历史 10 条路径 **10/10**：桌面与手机普通 HTTP 原操作顺序 2/2，另外八条双尺寸路径 8/8。历史脚本 `PRAXIS_REVIEW_EXPECT_SOURCE` 使用冻结的 **src tree SHA**。覆盖大阪改条件、涩谷澄清、跨计划草稿/问答/反馈、收藏、换批与预约交接；不是生产后端独立复核中新增反例的修复声明。[原顺序](manual-user-routes.json) · [其余八路](reported-front-end-paths.json)。

| 视觉组 | 用例 | PNG | 秒 |
|---|---:|---:|---:|
| formal | 16/16 | 41 | 32.734 |
| style1 | 6/6 | 6 | 7.994 |
| states | 103/103 | 126 | 134.817 |

正式视口 390×844 / 960×900 / 1440×900；状态回归含 360px 首页、390/1440 新增细节。三组 **173** 张截图及历史路径 **24** 张截图均经联系表逐张目检，新 R5 390 两个入口的引文/页脚另按原尺寸查看。[视觉编排](final/visual-driver.json) · [联系表索引](contact-sheet-index.json) · [目检记录](visual-inspection.json)。

## 诊断保留与验收边界

首个冻结候选 `cefb8a59dcdf09754e8b1cf748fc0936f3d7cf6a` 的 Typecheck/Arch/1837 默认测试通过，Chromium 517/518，随即停止，未执行 G6/Build/后续验收。唯一失败是 Round13 旧用例要求仅分类产生裸页脚，与本轮 R4 明确禁止分类来源组冲突。按新合同只更新此断言为“分类保留且无孤立页脚”，前一条 Q&A 精确读取时间断言原样保留，定向 5/5 后重新冻结。**产品源码未再改变**。首个原日志/manifest 保留于 [attempt-cefb8a59d](attempt-cefb8a59d/gates/manifest.json)，最终新 SHA 从头完整重跑五门禁，未用局部复跑代替。

冻结前定向命令最终 42/42，通过记录见 [targeted-final.log](targeted-final.log)；其中有一个零匹配测试文件的 Node 框架条目，不能把全部 42 条都当新增行为用例。原有 converged/preview 控制定向 8/8 与新 R2 同命令时，旧 R2 侧栏测试输入尚未完成活动计划播种，诊断非零；随后修正输入，最终及正式门禁通过。

[初始诊断](baseline-targeted.log) 为旧生产源码配初版测试输入：16 条，2 PASS、13 FAIL、1 cancelled。**R4/R5 初版 Fixture 错误地假定 currentFactEvidence 非空，另 R4 手机超时取消；这些不是产品断言红测依据**。输入改为已有 public readEvidence 后验证。早期测试时钟未暂停造成的边界漂移、侧栏缺少活动计划的输入问题均保留原日志，未放宽五秒、链接、正文、几何或手势验收断言。[诊断输入/限制](baseline-manifest.json) · [开发日志索引](development-log-index.json)。不把早期失败数当作九项产品缺陷的精确数量。

本轮 **未修复** [Round22 独立后端复核](../round-22-gemini-review-uwPIlJ/REPORT.md) 已证实的以下问题，继续登记下一轮后端专项：

- P1：待答期间编辑可用时段会丢失 selectedCandidateId 与 B1 商业条款。
- P2：待答语义分支漏计模型预算。
- P2：仅收藏与答案写入并发会将 ANSWERED 记为 CANCELLED。
- P2：三项英文并列删 beer 及日文地区“にある/周辺/付近”后缀路径残留旧 query。
- P2：甜品局部否定的句末标点翻转过滤，并吞入后续肯定需求。

**真实手机软键盘：NOT_EVALUATED（待真机复验）**。iPhone Safari / Android Chrome 真机、真实来源质量、真实模型/Google/餐厅网站、真实 PostgreSQL 和独立 S0 黄金评审均未执行，不用 Fixture 答案证明这些能力。

## 保护与归档

[最终保护核验](protection-verification.json)：338 个受保护源码文件、11,044 个旧批次证据文件（含 Round22 独立复核及 155 个 restaurant-web-read）SHA-256 零变化；开工原有 10,558 个证据文件复核不变。主工作区 HEAD/status/index/diff、主 `.env` 哈希、稀疏规则保持。closeout 残余材料与注册匹配原记录。Domain、Integration、persistent agent、依赖、搜索指纹和 missingBlockingFields 未改，历史 Mikkeller 段落保持。

[改动范围核验](source-scope-verification.json) 仅包含获准的应用投影、前端、测试、两份产品规格及 Round23 独立证据。按本轮明确文档白名单，仅同步 USER-FLOWS/VISUAL-DIRECTION，其他历史账本与证据保持原样。所有产物见 [SHA-256 清单](artifact-sha256.json)（清单自身由 Git 归档提交校验，不自引用）。仅本地提交，无 push/main merge，无 Live/真实 PostgreSQL/4312；本轮启动的浏览器、回环服务与 PGlite 连接均随测试 finally 收尾。归档后工作树净树停下。
