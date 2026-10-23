# 第二阶段 c：11 次保存产物离线评价

- Evidence status: exposed holdout / frozen evaluation / pending independent review。Live 继续暂停；本轮0模型、0网站、0Google、0Live、0环境重跑。
- 范围仅 h-02…h-12 的11份完整 result.json；h-03采用已保存的第2次完整产物。h-01/h-13共6次仅做逐次追踪裁决，不伪造缺失 result.json；h-14部分产物不纳入11次，h-15…h-18仍NOT_REACHED。

## 评价前登记与冻结

复核8a39273e；原文 SHA `1e18415027dc3f386397bf172511d9c877e2731fc59fde395083b6a171eee4c5`。登记时间 `2026-10-23T10:02:11.064Z`，早于评价 `2026-10-23T10:03:29.626Z`；先提交登记 `9773778b`，再提交冻结 `e54ee607`，才评价。

- artifact-criterion-correspondence@1：`4d37b2d135985dd647bf77500f0b2f37fdb4477e6cd433e63ba9c2da6d9667ad`
- 结构预算绑定：`9f6567c21c0462f5ac6f90a7254666169c3e4548532a1dfdf5fe1ed217da063f`
- 评价冻结：`0cb3e94ac49bc984a7887ea4f9e586d1cf1437185c242c4fb9de9947800db032`（2594项）

仅6条等价、2条无效交叉及1条额外UNSPECIFIED记录，均按产物SHA/编号约束。例03的max=10000JPY绑定Gold[2]；沿用第二阶段b可逆预算视图进入现有条件路径。原Gold、展示、价格、动作、资源、原产物字节不变，超出/未知不视为满足。未新增通用同义词。

## 第一层：端到端

固定@33/rubric@29原样结果：`{'QUALIFIED_DELIVERY': 6, 'NOT_EVALUATED': 2, 'INTERNAL_FAILURE': 1, 'CAPABILITY_MISS': 1, 'DELIVERED_UNQUALIFIED': 1}`。6/11次为QUALIFIED_DELIVERY；11份中例03两份预批准无见证排除，其他9份为能力口径记录。另有失败重试审计独立报告，不能混入这11份，不能用缺少result来删除已发生的能力超时。

| 运行 | 评价 | 用时秒 | 模型 | 交付店 | S0声明 | S0越界 |
|---|---|---:|---:|---:|---|---|
| h-02 | QUALIFIED_DELIVERY | 267.836 | 27 | 3 | ABSENT | ABSENT |
| h-03 | NOT_EVALUATED | 457.907 | 47 | 0 | ABSENT | ABSENT |
| h-04 | QUALIFIED_DELIVERY | 259.762 | 22 | 3 | ABSENT | ABSENT |
| h-05 | QUALIFIED_DELIVERY | 226.133 | 22 | 2 | ABSENT | ABSENT |
| h-06 | INTERNAL_FAILURE | 21.680 | 6 | 0 | ABSENT | NOT_EVALUATED |
| h-07 | CAPABILITY_MISS | 429.178 | 47 | 0 | ABSENT | ABSENT |
| h-08 | QUALIFIED_DELIVERY | 262.844 | 26 | 1 | ABSENT | ABSENT |
| h-09 | NOT_EVALUATED | 457.674 | 47 | 0 | ABSENT | ABSENT |
| h-10 | QUALIFIED_DELIVERY | 250.421 | 25 | 3 | ABSENT | ABSENT |
| h-11 | QUALIFIED_DELIVERY | 176.092 | 21 | 3 | ABSENT | ABSENT |
| h-12 | DELIVERED_UNQUALIFIED | 327.837 | 36 | 3 | NOT_EVALUATED | ABSENT |

7次有展示，共18家（合格交付运行共15家）；11份已保存模型调用合计326，此前已计费，本轮不重复加账。Runner耗时不混入外层间隔和运行后GET；有展示中位数259.762秒、最长327.837秒，仅指标。

| 用例 | 已评价完整结果/计划 | QD | 分母/限制 |
|---|---:|---:|---|
| p2c-holdout-01 | 1/3 | 0 | 计入；3次未全部完成 |
| p2c-holdout-02 | 2/3 | 2 | 计入；3次未全部完成 |
| p2c-holdout-03 | 2/3 | 0 | 预批准无见证排除，仍评价 |
| p2c-holdout-04 | 2/3 | 2 | 计入；3次未全部完成 |
| p2c-holdout-05 | 2/3 | 2 | 计入；3次未全部完成 |
| p2c-holdout-06 | 2/3 | 0 | 计入；3次未全部完成 |

例02/04/05各已积累2次QD，例01/06为0。只报告当前部分结果，不据此签收18次或完整第二阶段c退出。

**h-12 评分限制单列：** 复核认定 suitable for an office group 是来自用户原话的UNSPECIFIED额外信息，不对应Gold、不构成偏差、不得阻挡产品交付；实际产品确实交付3家。固定@33的compareCriteria仍把额外条件计为AUTHORITATIVE_CONDITIONS冲突，得出DELIVERED_UNQUALIFIED。本轮严格保留原判，不删条件、不改Gold或评测器。该评分限制不能归为产品新增HARD缺陷；另有两家菜系支持独立未核对，详见条件明细。

## 第二层：环节指标与条件展示

P2-1首批见证（每家每次观察）`{'NOT_FOUND': 3, 'FOUND': 5, 'NOT_REACHED': 1}`；例03无见证不进入此计数。h-06没有首批候选，保持NOT_REACHED。首批和全程发现不同，不能混计。

P2-2选中的直接来源页事件52次；同店重选重复计数，并非独立门店数。h-06未到达选择；逐次选择、路径、时段与阶段耗时在run-reports/。

P2-3共33条Gold展示对照：`{'MISSED_KNOWN_CONDITION': 4, 'CONSISTENT': 29}`；独立条件状态`{'MET': 20, 'NOT_CHECKED': 13}`。S1_UNSUPPORTED为0，MISSED_KNOWN_CONDITION为4。h-02三家和h-08一家菜系均为产品已观察的支持，但展示NOT_CHECKED，独立为MET；按@33保留4条MISSED。

价格独立条件4条：`{'MET': 4}`；实际价格原文、来源、支持范围和展示状态见condition-details.md与evaluations/。例03绑定成功但0展示，不能宣称其预算卡片或价格核对已通过。

| 运行 | 首批见证 | 直接页选择事件 | Gold展示行 | 价格核对行 |
|---|---|---:|---:|---:|
| h-02 | [('Yakiniku Yansando Ueno hirokoji ten', False)] | 5 | 6 | 3 |
| h-03 | [] | 10 | 0 | 0 |
| h-04 | [('Chanko Kirishima Ryougoku edo NOREN ten', True)] | 4 | 6 | 0 |
| h-05 | [('Niku Kitchen BOICHI Hacchobori irifune ten', True)] | 3 | 4 | 0 |
| h-06 | [('Hakata Motsu-nabe Yamaya Kitasenju ten', None)] | 未到达 | 0 | 0 |
| h-07 | [('Kushi Katsu Dengana Akabane ten', False)] | 2 | 0 | 0 |
| h-08 | [('Yakiniku Yansando Ueno hirokoji ten', False)] | 5 | 2 | 1 |
| h-09 | [] | 10 | 0 | 0 |
| h-10 | [('Chanko Kirishima Ryougoku edo NOREN ten', True)] | 5 | 6 | 0 |
| h-11 | [('Niku Kitchen BOICHI Hacchobori irifune ten', True)] | 3 | 6 | 0 |
| h-12 | [('Hakata Motsu-nabe Yamaya Kitasenju ten', True)] | 5 | 3 | 0 |

## 第三层：严重程度与只读边界

11份完整结果固定@33：S0 `{'ABSENT': 9, 'NOT_EVALUATED': 2}`；声明 `{'ABSENT': 10, 'NOT_EVALUATED': 1}`；越界 `{'ABSENT': 10, 'NOT_EVALUATED': 1}`。S0 PRESENT=0不等于全部确认ABSENT；h-12声明及h-06越界仍未评价。S2 PRESENT为2（h-06内部失败、h-07能力miss）；其他严重程度未评价不得当0。

保存的完整浏览器追踪补充审计：未发现已放行预约表单路径、/reserve或时段点击；所有已记录click均可解析。/reserve实际拦截事件0，未触发不能称为真实拦截验证。h-06没有浏览器会话，固定评分边界仍NOT_EVALUATED。部分强制终止运行无完整结果/浏览器网络追踪，不把缺失记录升格为安全确认。原始安全输出保留，独立S0依据限已保存来源和运行后GET。

## 第四层：归因、六次追踪裁决与限制

| 运行/尝试 | 正式Live | 忙页 | 本轮最终裁决 | 原始外层分类 |
|---|---|---|---|---|
| h-01 / 1 | False | False | CAPABILITY_FAILURE_TIMEOUT_PREFLIGHT | ENV_FAILURE |
| h-01 / 2 | True | False | CAPABILITY_FAILURE_TIMEOUT | ORCHESTRATION_INTERRUPTED |
| h-13 / 1 | True | False | CAPABILITY_FAILURE_TIMEOUT | ORCHESTRATION_INTERRUPTED |
| h-01 / 3 | True | False | CAPABILITY_FAILURE_TIMEOUT | ORCHESTRATION_INTERRUPTED |
| h-13 / 2 | False | False | CONFIGURATION_STARTUP_REJECTED | DEFERRED |
| h-13 / 3 | True | True | ENV_FAILURE | ENV_FAILURE |

h-13第3次唯一实际页面原句：“Search is unavailable right now. Please try again.”，记录于2026-10-23T08:23:19.904Z（北京时间16:23:19.904），原URL、观察、SHA和JSONL行见six-attempt-audit.json。按本轮用户指令记ENV（Guard误拒）；事件泛称SOURCE_HTTP_403_503_429不证明实际HTTP403，不借后来诊断伪造这次状态码。

h-01第2/3次、h-13第1次：扫描全部留存决策/外层/文本未发现该页，正式整单触及外层时限，按能力失败计，原ORCHESTRATION_INTERRUPTED仅并列保留，不能借后来的忙页排除。h-01第1次实际为Tabelog来源预检35秒无响应，尚未开始正式Runner；保留源故障事实，并按用户“无忙页超时不改ENV”的严格口径列CAPABILITY_FAILURE_TIMEOUT_PREFLIGHT，不借此新增正式Live分母或退还历史重跑费用。h-13第2次是600000参数被Runner的500000上限拒绝，不是超时；0模型/0正式Live，单列CONFIGURATION_STARTUP_REJECTED。

six-attempt-audit.json保存55个原文件SHA、检索覆盖与原始分析；six-attempt-user-adjudication.json是本轮最终用户口径，优先于其中的历史/技术原因标签。未发现仅指全部已保存追踪无匹配，不能断言强制退出后未保存的页面从未出现。

完整结果的首个可见卡点：h-06连续DISCOVERY_FAILED（缺观测坐标上下文）后AGENT_LOOP_NO_PROGRESS，有实际轨迹支持；h-07未发现已知可行见证，起始来源批为空而后来候选多属TableCheck；见证库存支持能力miss但不证明模型或Guard为唯一根因。h-03/h-09无见证，无交付且TableCheck快照缺稳定请求绑定结果，保持NOT_EVALUATED，不推断能力失败。h-12的额外UNSPECIFIED评分限制与真实支持缺口分别报告。P2-1/2/3联合执行不能单独作因果效果归因。

| 退出项 | 本次能支持的判断 |
|---|---|
| 2 | 未完成全18次，仅11份完整评价；3个有见证例已有2次QD，不签收退出。 |
| 3 | 未完整评价；0次S0 PRESENT，仍有NOT_EVALUATED。 |
| 4 | 保存展示中4条MISSED_KNOWN_CONDITION；h12评分与复核限制单列。 |
| 5 | 逐次耗时、调用数与中位数已报告，仅指标。 |
| 6 | 本次产品字节未改；不重新审计/洗去既有站点代码净增加结论。 |

额度：模型4318/5000（余682），完整Live89/100（余11），环境重跑5/10（余5）。本轮增量全0；保存的模型失败、回放与重试已在旧账本内。Google累计可证下限78（认证11+执行至少67），部分无结果运行缺完整计数，精确总数UNKNOWN，不补0。

验证与模式：登记先SHA/提交/冻结，冻结2594项和原始结果保持不变；6条改字拒绝、错产物绑定拒绝、两份预算视图逆补丁深相等、11份覆盖和6次逐一审计。离线进程预加载网络拒绝器，未出现网络尝试日志；不加载.env。生产/评测器字节与8487a844一致，复用其已验收五门禁、69/69、选店5/5及校准22/22，本次未重跑这些测试，不把旧测试当新Live结果。

原始结果/追踪、Gold、对应、评测器、rubric均未在看到结果后修改。全部新增材料仅提交私有分支codex/holdout-phase2c-exit；推送后停下，等复核。
