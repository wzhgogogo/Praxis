# F5 实现与 Live 准备：停止点 2

- 日期：2026-10-24 Europe/Vienna（CEST，UTC+2）。
- 证据状态：draft / not integrated；已暴露开发控制，非 Clean Baseline。
- 基线：main/f42715c2；分支：codex/fix-phase3a-prime-f5-provisional-entrance。

分析三提交已重放并推送至分析分支 51ff66b3，原 60d02686 保留 annotated tag `checkpoint/phase3a-prime-f5-stop1c`。冲突保留 F1、F1b 与 F5 的 STATUS、DEVLOG、TEST-LOG、月度记录。实现分支从新 main 创建，再带入已批准 ADR 及分析输入。

## 实现范围

仅实现 Accepted ADR-0043 第 1–7、9、10 项。无具名标签或同源指针的已观察地区入口可先取样；前两个有效同店 JSON-LD 坐标均越界时允许一次更换，任一在内即核实，缺失或未知不计有效。与原 4/5 规则共用一次上限，保留已接纳候选。

代码提供原圆心距离、方位、样本引用、已观察集合及剩余预算；模型只能输出 `SELECT_REGION_ENTRANCE` 的集合 ref。来源组合核对成员、来源、流程、Pack、不同入口、Guard 和原预算后直接导航，不读取恢复菜单。失败 UNKNOWN 并附原因，移交下一既有来源，计数与截止时间不重置。普通 DOM 引用仍受当前观察约束。LOCATION、车站和类别控件不改。

合同变化：restaurant-state@20 → @21、TaskDefinition@18 → @19；browser-read-context@2 → @3、browser-read-action@11 → @12、browser-read-prompt@19 → @20。活动调用方及 fixture 同步；旧 firstFive 进度移除，历史 JSON 不重写。无生产数据迁移或数据库操作。两个站点目录、source-packs.ts、Guard 和历史评价不改。

## 验证与证据边界

R1 在未修产品 c870dc4a 取得有效红灯：详情为 0，目标断言要求进入取样；缺依赖的启动失败另存，不算红灯。修复后相同断言通过。D1 链接来自固定 3ec38584；列表、详情和坐标明确为本地构造，不是网站 Replay。

真实 Chromium G3 验证东京 → A1322 → A132201 → 已观察替代入口，共四个地区页、一次替代、恢复页访问 0。生产组合保留 Interpreter、Compiler、Router、Event/Reducer 与持久化，只替换模型和来源传输；三个场景产出 execution artifact，现有独立 evaluator 检查合格交付或有界无结果。当前网站解析、真实模型选区和现实库存仍未由离线验证证明。

适用五门禁将在冻结提交后的干净工作区运行；当前 PENDING，不以定向通过替代。后续追加每条清单、门禁、SHA 和工作区结果。

## Live 准备

公开历史原文固定于 Git blob；例 03 先采用已批准的 Kudanshita 模板，再仅替换 `{DATE}`。计划运行日 2026-10-24：例 01 Wednesday, November 4（+11 天），例 03 Saturday, November 7（+14 天），其余正文逐字节不改。若实际 Live 日变化，须重新做日期冻结。

例 03 按“附近无合格店”定义，无见证；人工核对 800 m，800–1000 m 环带 UNKNOWN，不能声称已认证全部 1000 m 无店。通过条件为如实有界无结果、不超时、不把非 fugu 店说成满足 HARD，用时只记录。历史 C03-2/C09 原评价不改。

采集脚本先冻结提交：例 01 取历史 Dengana 一个候选，历史坐标和类别预筛在 1000 m 内；公开详情须重新核对身份、坐标和 Categories 后才请求一次四参数 find_vacancy。至多 2 GET，仍受本批 ≤10 GET、≤5 候选总额约束；串行间隔 ≥5 秒，无 Cookie、登录、预约表单或模型。每次原始响应及 SHA 落盘并逐次写预算账本。例 03 没有用户观察到的 ≥1000 m 筛选 URL，跳过可选 GET，0/1。当前尚未发请求，最终计数随后追加。

已冻结 Live 外层脚本和计划，默认只离线检查。六次正式 Live 均 NOT_RUN。正式运行要求 F2①、F2④a 合入 main 并由本分支继承、未来用户批准、运行日日期有效及 Live 前 24 小时内重新认证。逐 slot 做独立四层评价和 S0 核查，再批准下一 slot；不自动重试。

停止点 2 认证不代替 Live 前复查。F5 Live 标准：例 01 至少 2/3 合格交付且不超时；例 03 如上有界无结果；全部 S0=0，原始响应独立核对，生产成功标志不作为自证。
