# Round 6：读取隔离、证据准入与风格 1 离线收口

证据状态：draft / not integrated；exposed development inputs，非 Clean Baseline。仅本地提交，未合 main、未推送。

- 工作树：`/private/tmp/praxis-3c-unified`；分支：`codex/feat-web-photos-unified`。
- 起点：`5269dc37f63fc11ff188a9b6ad696af956df8c10`。
- **最终唯一待验 / 实际通过 SHA：`ddd9eda8d04b304f09b3629bb0d64828645c5789`**。五门禁、正式视觉与补图均在该净树提交上执行；后续提交仅同步文档与保存证据，产品/测试/编排代码不变。
- 实现提交：`313af33e8d0a164fcb0492db636d320ce35dc9f8`；其后两次只修正本轮新增测试的错误预期，过程如下。所有原有断言保留，用户明确要求更新的展示文案断言除外。

## 完成行为与覆盖

1. 同一生产 `createLiveReadAssembly` 的并发 Case 使用 ALS 隔离 browserBudget、executor、entry ledger、named queries；搜索/检索/事实/查位及 Agent loop 返回后的自动 B1 在本轮作用域内累计预算。实际组合回归挂起 A、启动 B、先结束 A，断言 B 非零计数和活跃会话保留，两边均 PRESENT_RESULTS。独立工厂实例与 begin/end 既有合同保留。显式 G1 仍独立预算。
2. 同 Case 的 refresh/batch/location 先查幂等、G1、版本与业务前提，再在 preparing 保护内取消本 Case、重读 snapshot、复核、派发及启动。三个入口和启动路径覆盖准备期，投影在该间隙仍为 active，getCase 不误标孤儿；过期版本不会取消活跃读取。B1 专项用真实 Fixture planner 调用消耗预算，证明 loop 返回后条款入口保留该计数；其确定性查位 Fixture 本身可以零次浏览器模型决策。
3. 实际 HTTP/SSE 相册刷新两尺寸合同通过：读取活跃期保留 Details、当前图库/照片位置/草稿，refresh 禁用或在非 PRESENT 隐藏并给出局部忙碌提示。新增受控公开投影/SSE 回归覆盖 FAILED、NO_VERIFIED_RESULT、当前候选离开时退出 Details/Handoff、关闭照片弹窗；整批混合/纯事实/有位/重试/AVAILABILITY 文案与路由条件一致。后端纯事实刷新核对持久化 CANDIDATE_FACTS_REFRESH_REQUESTED 与0查位，允许复用其他已合格候选，不强加来源调用。
4. `serves beer` 的裸类型和 CATEGORY/GOOGLE_TYPE 引文均经证据接纳层检查：bar/pub/izakaya、restaurant/通用元数据、liquor store/beer store 不可凭类别接纳；brewpub/明确 beer bar/hall/garden/restaurant 与明确商家啤酒原文仍可接纳。矩阵同时核对新模型判定和已有 MODEL_JUDGMENT 输入的新评估准入；SOURCE_TEXT/course/name 原规则保留，lounge bar→good for drinks、Japanese restaurant→local food 既有回归通过。**Prompt 15 版本及完整原文未变。**
5. Availability not checked/expired 使用13px500次灰、无圆点；Available 保留15px600与8px时段。空 slots/recommendation 收起；条件区按风格1左名称右 Confirmed/Not a match/Unverified，About 同词。六个尺寸/状态组合断言字号、颜色、间距与对齐，截图已目检；长卡片仍在工作区纵向滚动。
6. 不改变 `const previous = groups.findLast(...)`。首次 NEEDS_INPUT 后交付无 revisionDiff；此前真实交付后的 added-only diff 保留，真实空结果版本不跳过，Saved NEW_TIME_MISMATCH 基线保留。浏览器隐藏零项、显示静态3 new；检查 aria-disabled/tabindex 和实际点击不展开空列表。

**历史 Mikkeller Case 仍按持久化的 `presentedResults.conditionStates` 投影为 Confirmed。本轮不连接数据库、不重写历史数据；新门禁约束新运行与新评估准入。**

## 五门禁（同一 SHA、净树、未加载 .env）

| 门禁 | 结果 / 精确计数 | 退出码 | 耗时（秒） |
|---|---|---:|---:|
| npm run typecheck | PASS | 0 | 0.532 |
| npm run arch:check | PASS，0 forbidden source dependencies | 0 | 0.197 |
| npm test | 1750/1750 PASS，0 fail/skip/cancel | 0 | 61.772 |
| npm run test:browser:fixture | G2 5/5；Chromium415/415；G6 assembly159/159 | 0 | 397.843 |
| npm run build | PASS | 0 | 0.536 |

浏览器子组 Node 原始耗时：G2 24.562s、Chromium335.513s、G6 37.448s。420/420 是 G2+Chromium 合并摘要，不另加一次。全部71个浏览器测试文件完成；完整入口实际执行 G6 后才进入 Build。

原始日志、命令、SHA、退出码、耗时、计数及每门前后净树检查见 [gates/manifest.json](gates/manifest.json)、`gates/*.log`、[gates-driver.log](gates-driver.log)。环境只保留 PATH/HOME/TMPDIR。非浏览器门禁使用 OS 禁止非回环外连；浏览器入口没有外套 sandbox-exec，runner-replay 自身的 OS 断网隔离断言正常通过。未修改其测试或隔离边界。

## 正式视觉及六张补图

模式：**本地 Chromium HTTP/SSE/PGlite Fixture 联调**，不是 Live 或真机验收。

- 原有16场景全部保留：390×844七项、1440×900七项、960×900两项，**16/16 PASS**，32.14s，41张关键截图。
- 每例均核对实际登录、/messages 编辑与草稿、实际 SSE、/questions 与候选/引用、第二时段 B1、刷新恢复、PGlite SQL restaurant_booking_departures、全 context 外站导航拦截及无非预期 HTTP/应用 console error。目标预约 URL 只做本地核对，无真实网站 GET。
- 初始匿名 GET /api/session 的401、partial-gallery 的预期410及被拦截外站导航分别保留在每例记录；不当作应用异常，也不隐藏真实异常。
- 风格1六组合 **6/6 PASS**，7.46s，6张截图与6份指标JSON。它们在真实本地登录/读取后控制公开投影，仅证明渲染，不冒充真实来源准入或历史 Case 数据重算。初始匿名 session401为预期；其余 console/page/HTTP 异常为0。
- 正式结果：[visual/manifest.json](visual/manifest.json)，各例 JSON 内含 SHA、HTTP/SSE、断言、B1与持久化记录；日志 [visual-driver.log](visual-driver.log)。补图日志 [style-driver.log](style-driver.log)，指标/汇总 [acceptance.json](acceptance.json)。

| 尺寸 | 有空位 + 风格1 | 未查空位 + 风格1 |
|---|---|---|
| 390×844 | [截图](style/style1-390x844-available.png) | [截图](style/style1-390x844-not-checked.png) |
| 768×1024 | [截图](style/style1-768x1024-available.png) | [截图](style/style1-768x1024-not-checked.png) |
| 1440×900 | [截图](style/style1-1440x900-available.png) | [截图](style/style1-1440x900-not-checked.png) |

## 今日走查归档

已有7组35文件经脱敏与原始/脱敏 SHA256 核对后迁入按 Case 分组的 [user-live archive](../user-live-20261118/README.md)，临时目录现为0文件。合并索引 [MANIFEST.json](../user-live-20261118/MANIFEST.json) 为11组55文件、4 Cases，55/55哈希通过；第一批20文件正文未变。由于本机文件系统大小写不敏感，原小写索引原文以 [manifest.batch-1.json](../user-live-20261118/manifest.batch-1.json) 保留，新的大写 MANIFEST.json 承担总索引。

这批是用户此前实际走查的暴露开发证据，**不是本轮新增 Live**。原失败/澄清/成功及诊断结论均保留，未改成 Fixture 结果、未伪造 Replay。脱敏字典只用于本地去密，不注入验证进程环境、不打印值。

## 先前失败与修正

| 冻结 | 首个失败 / 停止 | 处理 |
|---|---|---|
| 313af33e8… | 默认1749/1750；新增纯事实刷新测试错误要求必有来源调用 | 改为持久化事实刷新事件+0查位；其他已合格候选可以直接交付。原日志见 [首轮](failures/313af33e8/FAILURE.md)。后续门禁未运行。 |
| 39a26bb9d… | G2 5/5，Chromium413/415；新增 summary isEnabled 断言不适用于原生summary | 检查ARIA、焦点顺序及实际点击不展开；产品代码未变。原日志见 [次轮](failures/39a26bb9d/FAILURE.md)。G6/Build/正式视觉未运行。 |
| ddd9eda8d… | 全部五门禁、16视觉、6补图通过 | 最终唯一验收基线。 |

开发期权限 EPERM 与测试编排诊断也保留在本目录开发日志中，未计作最终通过。两次冻结失败均来自本轮新增测试预期选择不准；纠正后重跑完整五门禁，不用局部通过替代正式验收。

## 四层结论与边界

- 端到端：离线实际 HTTP/SSE/PGlite Fixture16/16；不推断真实餐厅合格交付率。
- 逐环节：预算/会话隔离、前置版本与准备期、证据准入、视图/照片/文案、差异条、B1本地持久化均有独立输入或时序反例；UI受控投影只证明呈现。未修改Gold/评分器/私有Holdout。
- 严重程度：本轮无新 Live；独立 Live S0/S0_DECLARATION/S0_BOUNDARY **NOT_EVALUATED**，不宣称新增 Live S0=0。既有走查评价原文保留。
- 归因：修复共享可变 run 状态跨 Case 污染、准备期被误判中断、泛类别过度接纳与空基线/零项展示；本轮门禁误报归因于新增测试 oracle，原始失败未覆盖。

## 保护、清理与未测

[protection-check.json](protection-check.json) 核对旧 gates/failures、round2/3/4/5、focus-feedback 全部文件哈希未变；主工作区 HEAD/status（含全部未跟踪路径）/已跟踪diff 与主.env哈希未变；closeout HEAD/status/diff未变；Prompt15文本与版本未变。未在主目录写入。

[resources.json](resources.json)：原4312监听 PID62439/62461保持，不停止、不重启、不访问其HTTP入口。本轮 Chromium/浏览器测试工作进程残留0，所有本轮Fixture服务和PGlite close完成。旧预览进程没有重新加载本轮修复，后续由协调者统一重启。

未连接、盘点或修改真实 PostgreSQL/praxis_smoke；不为证明未写入而额外连接做库内容比较。未运行任何新 DeepSeek/Google/真实餐厅请求。未重跑 Live、D01/D02整单 Replay、iPhone Safari/Android Chrome真机或历史Case重评。下一步仍需用户/协调者确认，本轮到此停止。
