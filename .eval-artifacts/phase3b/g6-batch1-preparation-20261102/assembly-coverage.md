# 3b 整组装能力签收覆盖清单

2026-11-02，Vienna CET。`draft / not integrated`。每行至少一条src/eval测试，实际通过 `createLiveReadAssembly` 取得能力。新测试共用 `g6/session.ts`：生产Interpreter/Compiler、持久PGlite、Reducer、Validator、Router、来源解析/事实/问答/查位与B1保持；只替换模型传输、来源HTTP/浏览器I/O。Web行还经过真实HTTP/PilotSession。Guard行保留实际Runtime/Guard/Route，只把其最终HTTP传输改到loopback接收器。没有新增组装门禁例外。

文件均相对 `src/eval/restaurant/agent-loop/`；名称含变量的列为具名参数化展开。本地构造页面均明确 `LOCAL_CONSTRUCTION_NOT_WEBSITE_REPLAY`，不是站点回放。只有G2固定保存页继续沿其原始provenance/SHA使用。

| 能力 | 能力签收测试：文件 / 测试名 | 替换项与证明 | 不证明 |
|---|---|---|---|
| G1追问/取得页面 | `g6/capabilities.test.ts` / `G6 capability G1 Web: authenticated question acquires a page through the production read assembly` | 模型与来源I/O；真实已展示店→认证HTTP questions→同店网页读取→G1模型→原文URL/时间；没有questionSessionFixture | 真实模型答案质量、当前网站全文 |
| G2改名后观察 | `g6/capabilities.test.ts` / `G6 capability RENAMED: observed controls reach current response-bound presentation` | 实际本地Chromium、规则@2同步改名/ARIA映射自检，公开Date/Guests动作→同次数据→实际卡片 | 全部当前站点改版。TableCheck有时段真实日历仍依原决定留第一次Live采集，不能把旧两张未知日历说成已验其有位 |
| G3控件失配→观察交付 | 同文件 / `G6 capability CONTROL_FALLBACK: observed controls reach current response-bound presentation` | 固定来源保留失配旧select；新公开label控件被模型选取，改请求值后来源才返回绑定响应 | 当前网站控件结构/网络 |
| G3日期/时段数据权威 | 同文件 / `G6 capability RESPONSE_MISSING: visible date/guests never replace missing or changed vacancy data`、`RESPONSE_CHANGED`同后缀 | 文字/已选控件仍有日期人数，只有响应缺失/结构变化；不得展示，UNKNOWN、完成合法事实调查后有界结束；后者来源attempt可见SOURCE_STRUCTURE_CHANGED | 不把相同可见文字作为有位、满席、电话或休息证据；不承诺恢复未知格式 |
| G3c原文报价/HARD适用 | 同文件 / `G6 capability PRICE_MATCH: only applicable original quotation supports HARD budget MET`，以及PRICE_PARTY/PRICE_DATE/PRICE_MEAL | Source2实际选全段编号/角色，5000日元和限制都被接纳；匹配样本HARD MET/展示，其他人数、日期、餐别不得MET或展示 | 真实菜单当前价格/套餐可订 |
| G3c原文事实→HARD | `native-discovery-composition.test.ts` / `H001 native cited-menu follow-up carries source-bound HARD evidence to a current Tabelog result`（既有复用） | native来源I/O+模型，实际factory→Router→同源menu原文→判断→Reducer→展示；保留默认门禁 | 模型任意菜系判断质量。其runScenario产物是构造来源，不冒称当前网页 |
| G4同店与日文检索 | `g6/capabilities.test.ts` / `G6 capability G4: same-ID Japanese lookup drives the third source query to the same outlet` | 实际Google适配器固定HTTP；英文和合法substring无结果→原Google ID查日文→第三次同源检索→地址/时段绑定后展示 | 任意店名覆盖率/当前Google结果；旧F5 Dengana能力未因该构造例变为成功 |
| B1两个渠道链接 | `g6-development-preflight.test.ts` / `G6 full read composition P1 variant0: real State transitions and controlled bad-output rejection`（Tabelog）；`g6-booking-composition.test.ts` / `G6 B1 TableCheck whole read composition emits a same-shop filled-in handoff after real availability` | 持久应用、实际来源缓存；前者固定浏览器I/O，后者真实本地Chromium的公开链接/控件；同店/日期/时间/人数原链接且filled in，无提交请求 | 用户自己的浏览器是否实际带入，留Live用户核对；不会执行预约 |
| B1条款 | `g6-booking-terms-composition.test.ts` / `G6 B1 ordinary composition carries its admitted G1 cancellation quote onto the same-channel handoff`（A原断言不改）；`g6/guard-reserve.test.ts` / `G6 capability F6 selected-outlet terms: C production assembly preserves B1 at the strict twenty-second boundary` | 原取消追问实际接纳→卡片；后者只复用C已复核的factory fixture，不改其文件；20001可读、20000零条款读取/模型且交接保留 | 当前真实条款、浏览器端手续费变动。缺证/冲突/取消等C已有回归不重复实现 |
| B1手续费/反馈 | `g6/capabilities.test.ts` / `G6 capability B1 fee and feedback: source-acquired handoff survives authenticated departure and user report` | 真实来源交接含已审核440JPY/原出处SHA；真实HTTP departure→反馈claim→YES，不新增来源请求，无已验证OUTCOME | 反馈不是已确认订位；费用仅当前冻结配置 |
| 多回合：要求预订/3种措辞 | `g6-development-preflight.test.ts` / P1 variant0、1、2完整测试名同上 | 同Case/权威State、真实语义/决策路径+I/O替身；选同店、原B1；受控错店检查失败 | 真模型是否真的选择SELECT；本批回放发现4个相关偏离，见总表 |
| 多回合：未查位/缺人数 | 同文件 / `G6 full read composition P2 variant0: real State transitions and controlled bad-output rejection` | 推荐无库存/B1→预订→问人数→用户补充→查位；提前handoff反例被拒 | 真模型能否持续完成整个轨迹 |
| 多回合：缺日期 | 同文件 / `G6 full read composition P3 variant0: real State transitions and controlled bad-output rejection` | 初始date未赋值且未读来源、ASK_USER→给日期再读；编造日期反例失败 | 私有留出集的具体时间措辞 |
| 多回合：追问 | 同文件 / P4 variant0完整测试名同上；另有上述G1 Web | 用户指定第一家、真实取页/ANSWER_PAGE_QUESTION→字面引用，伪造引用反例失败 | 免费fixture不代表102道/真实答题质量重测 |
| Guard | `g6/guard-reserve.test.ts` / `G6 capability Guard: actual production assembly admits current public data and blocks workflow before source transport` | 真Chromium/Guard，正常vacancy到loopback，POST workflow永不到接收器且Guard实报BLOCKED | 当前网站脚本、代理环境、所有真实端点；Live仍报实际到达计数 |
| F6根循环/选店轮 | 同文件 / `G6 capability F6: source time crossing leaves only bounded honest ending in the actual root composition`，及selected-outlet terms完整名见上 | 模型/来源I/O与受控时钟；保留区内没有新I/O，正常NO_VERIFIED_RESULT；条款20001/20000对照 | 真实外部慢取消/真实模型耗时。本批无Live，不签收F6 Live |
| G6 Runner组装 | `g6/runner.test.ts` / `G6 serial Runner obtains G1 pages through Live assembly, records all channels, checks each slot and stops before the next slot on independent S0` | 实际session/factory；State触发追问/未发送原因；24h证书复用+每槽新GET fixture/间隔/账；三录制；第二槽独立缺时段→S0停第三槽 | GET为本地响应，不是当前认证；没有调用真实模型或站点 |

所有“无”均已给出上述能力级测试或明确继承的复核边界；TableCheck G3b真实有位日历仍是既定Live采集依赖，不因准备批擅自改成已验收。本次capability fixture不把组件评分器测试当作端到端通过。上述旧测试继续在默认门禁；新增G6组成为浏览器门禁后的串行常设组，保持既有600秒保护/生命周期诊断，不与重型Chromium文件并发。

## 缺口总表（首个可见偏离，不以猜测代替根因）

| 能力/模式 | 测试/请求 | 首个偏离点（文件/函数/字段） | 建议归属 | 同根因关系/状态 |
|---|---|---|---|---|
| 前次G1→取消卡片桥接 | A原 `g6-booking-terms-composition.test.ts` | 曾为terms=[]；efeab254同步后原断言通过 | C | 旧缺口关闭，未注入条款 |
| 预订同店：真实模型 | replay P1-0-8、P1-1-8、P1-2-8、P2-0-10 | `src/domains/restaurant/agent-decision.ts` / `RestaurantAgentDecision.decide` 的原始 `type=PRESENT_RESULTS`，冻结预期SELECT_CANDIDATE；同店candidateId未选定 | C（选店/预订接线与语义上下文；若需Agent Prompt版本由复核协调） | 4次同一可见表现；**根因未证**，固定上下文回放没有执行这个错误决定，不能说已造成真实Live失败 |
| P2转具体预订：真实模型 | replay P2-0-4 | `RestaurantSemanticInterpreter` 传输返回根对象缺Schema4必需 `schemaVersion`；facts的店名/日期/人数未凭空改动 | C | 与未SELECT是否同因未证；实际输出原样交复核，不加schema重试 |
| 保存页G3b | 首次Live采集检查单 | 当前没有真实、可绑定日期/人数/时段的TableCheck新录制 | B（取得材料后G3b）/A采集 | 已知外部输入缺口，不是本批新增代码红灯 |
| 非自然复现的浏览器挂起 | delayed failed navigation旧fixture受控晚调度 | `src/harness/browser/browser-read-test-fixtures.ts` 的finished原仅在路由finally完成，会话先关闭且未进路由时永久pending | A已修 | 自然30次未复现；受控旧红/同输入修后绿/90次固定重复通过；历史510秒事件是否同因未证 |

新增整组装产品正例没有剩余活跃红灯。额外数据控制首轮失败属于fixture漏合法事实读取；原日志单独保留，补脚本后同一有界结束检查通过。独立评价器的故意坏输出反例应判FAIL，这些不是产品红灯。真实模型5个偏离仍待复核，不以fixture全绿或五门禁关闭。

Runner附加State触发回归：`g6/runner.test.ts` / `G6 Runner authoritative pending question controls date reply: asked date` 与 `asked partySize`；旧f2f88a9a隔离原码在后者误发送日期，修后两条绿。只替换模型传输/来源I/O，当前pendingUserQuestion来自实际Runtime导出，未手填中间State。
