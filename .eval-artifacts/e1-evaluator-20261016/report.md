# E1 评测器第一切片

- 日期：2026-10-16（Asia/Shanghai）。状态：执行中，第0项已校验待提交；第1–9项尚未签收。
- 证据：已暴露开发回归，不是 Clean Baseline，不证明新用例准确率。
- 开工同步：git pull --ff-only，36ab029 → 78fcc13；保留复核者文件，T1独立复核已通过。
- 用户原有 INDEX、预约设计草案和三个演示文件保留，不纳入提交。
- 除开工授权Git同步，没有网络、Live、模型或见证GET；Gold、变体、见证和生产资格不改。
- 最新直接指令授权最终推送，优先于指令文件末尾旧“不推送”文字。

## 0 输入冻结

原始预检发现两次外层SIGKILL从未生成result，未伪造或重建result。用户随后明确批准20份原始result＋2份中断包，保留22条运行；两条不计能力分母。

- 目录：../calibration-phase1-20261015/inputs/；manifest schema 1，dataset restaurant-evaluator-calibration-phase1@1。
- 22条／30个gzip／12,630,285字节，小于60,000,000字节。
- manifest SHA-256：68125e710ee1ffee5f101fd390ba4e769e2e1d67e5fa3b5f1bc3035ecbd6d1f2。
- 每文件原始绝对路径、原始及gzip SHA-256、原始及gzip字节数在manifest。
- 独立列出22个预期run-id核对全集；逐文件gunzip、双SHA、长度及与原始字节逐字比较通过。命令与结果：00-inputs/verify-inputs.mjs、00-inputs/green.log。
- p1fA-kf-h003-a1、p1fA-kf-h005-a1为 RESULT_NOT_GENERATED / OUTER_SIGKILL_INTERRUPTION，各含started、decisions、interruption、finish、trace五个原始文件。
- 两条读取规则：外层记录判断 ORCHESTRATION_INTERRUPTED；依赖result的维度未评价并注明缺失；S0只看trace网络观察，不足则NOT_EVALUATED，不写“无S0”。校准这两条允许S0未评价但须解释，其余20条须与人工S0一致。
- 包装器：package-inputs.mjs（拒绝覆盖，先计算总体积再写入）；冻结后不修改输入字节。

## 当前切片／行为覆盖表

每项以独立反例先红后绿、单独提交并通过四门禁。待人工导出的labels和等价结论只阻断最终校准，不阻断其它实现。

| 项／主要失败类型 | 测试与检错证据 | 未覆盖／当前状态 |
| --- | --- | --- |
| 1 旧字段缺失被猜测 | 待实施 | 未开始 |
| 2 未审核措辞误接受、polarity/strength漂移 | 待实施，生产表保持空 | 等待复核者结论 |
| 3 复制请求自证库存、共用营业时间规则 | 待实施，优先真实输入反例 | 未开始 |
| 4 错误结果分类／S0把未知当无错 | 待实施，外部证据而非人工标签 | 五条人工口径待导出 |
| 5 见证跨店／漏斗漏接 | 待实施，卡点只能HYPOTHESIS | 未开始 |
| 6 死循环误判调查充分 | 待实施，真实24步及三次同词 | 未开始 |
| 7 声明限额掩盖实际限额 | 待实施，effectiveLimits独立比对 | 未开始 |
| 8 补见证越界／无交付触发漏接 | 待实施，仅dry run | 不运行Live |
| 9 种子写死店名／缺真实上下文 | 待实施，两个真实决策点 | 待独立标注，不计通过率 |

## 提交、门禁、校准

第0项仅输入完整性校验，无代码变化，不用全仓门禁替代数据校验。第1–9项尚未执行，不宣称代码完成或门禁通过。

校准待复核者提交 labels.yaml 与 criterion-equivalences.yaml，不自行填写。评测器不得读取人工标签。四层结果、未评价原因和逐次对照将在后续逐项补齐。

## 1 类型化读取

真实h002删除两端criteria时旧评测仍SATISFIED（01-reader/red.log），类型投影后NOT_EVALUATED并带完整路径；正常产物、非法类型和缺轨迹控制通过。所有判定已移除asRecord动态取字段，仅边界读取已消费字段；evaluator@29/rubric@23，不补造旧记录。输入冻结提交3389131。

定向85/85；typecheck、arch:check、npm test 883/883、build全绿，命令及日志01-reader/{red,green,typecheck,arch-check,test,build}.log。首次正常产物null失败码格式误报已在读取层区分；重叠日志已以单次干净门禁重跑替代。未覆盖的历史字段继续未评价。

## 2 版本化措辞等价表

7793db8后以测试专用SAME表作反例，旧实现NOT_EVALUATED红；接入严格YAML加载和SHA后SAME通过，polarity反转与HARD降级拒绝；DIFFERENT冲突，未登记对保留UNKNOWN并输出待审列表。生产表初始为空，不填写真实8组人工判断，无传递等价推断。

定向87/87；四门禁typecheck、arch:check、npm test 885/885、build全绿，02-equivalences/{red,green,typecheck,arch-check,test,build}.log。未知键、null、重复键及重复对拒绝；正常字面相同和旧回归保留。校准仍等复核者表。

## 3 独立来源核验

真实h002仅改两份原始Tabelog响应日期，生产claims不变，旧版SATISFIED红，新版NOT_SATISFIED；优先已保存GET双SHA核验，其次录制响应，最后受限快照控件，全部缺失未评价。营业时间为评测器自己的窄语法，未知不冒充冲突，旧周二测试误配周一资料已修样本。生产合格函数值导入有隔离arch反例，类型导入正常。

定向178/178、四门禁typecheck／arch:check／npm test 888/888／build全绿；共享来源Fixture与Chromium组合原来漏原始响应及trace引用已补录，不降低YES断言，本地Chromium最终112/112（browser.log），动态2/2。03-grounding保存red、green、arch-counterexample/control及门禁原日志。首轮浏览器红灯另存browser-before-trace-capture.log。不证明未知网站格式或真实模型；窄语法不推断跨日营业。

## 4 结果分类与真实中断包

基线d621d1b对实际SIGKILL包没有类型的目标红灯，现统一入口验证manifest、每份gzip与原始双SHA，真实Evaluator保存不可覆盖sidecar。两条均ORCHESTRATION_INTERRUPTED、能力分母EXCLUDED、用户目标NO；缺result的六维全部未评价，S0只用trace且两条均因中断/脱敏未评价。实际表单POST篡改为S0，BLOCKED对照不冒充已越界；正常交付、明确冲突、HTTP402及缺因果配对通过，人工标签不被读取。

定向95/95，四门禁typecheck／arch:check／npm test 893/893／build全绿，04-outcomes原始日志；实际共享CLI两条输出及SHA在evaluations/，没有手填评分。Eval Skill 2.1只维护一次分类规则并通过skill-creator校验。五条Your-call口径及最终校准尚未完成，等待复核者独立导出，不宣称分类已获人工校准；跨来源语义HARD与脱敏网络grammar仍可能未评价。

## 5 见证逐候选漏斗

5ca7972对真实运行后四店见证没有漏斗的目标红灯已转绿；共享CLI读取原库存及既有登记HARD/范围Gold，按artifact原始SHA绑定，h001自动CAPABILITY_MISS/S2，不读取独立复核结论或人工标签。四店逐项输出发现、实际身份/事实原始链、系统查位原因与独立库存、实际展示及HYPOTHESIS卡点。无位不误标交付卡点，缺独立地址不伪造跨源匹配。

定向98/98、四门禁typecheck／arch:check／npm test 896/896／build全绿，05-witness原始日志与最终h001-with-witness-final.log指向sidecar；地址/楼层、缺读取/展示、错请求/错SHA、认证窗口过期成对控制通过。复查发现第3项后GET日期仍读URL，red-source-date.log证实，已改为响应base_date/members并绿；源文件及Gold未改。历史Matsumoto缺独立地址只能可能匹配，Sen/原生Teppen可定位；自由文本语义与较晚库存的历史推断边界保留。

## 6 无进展行为诊断

0b1e2c2仍把P1-G2真实循环判SATISFIED的目标红灯已修；按实际拒绝、无新候选/证据/首次读范围、同类失败及完整URL次数判定。P1-G2超阈值为NOT_SATISFIED；P20同词4/5/6/7步实际输出，换来源不直接判错。上限与语义仅在Eval Skill及代码常量维护。

定向101/101，四门禁typecheck／arch:check／npm test 899/899／build全绿；06-progress保存red、red-layer-separation、green、两个真实sidecar与门禁。3/4次失败、5/6次URL重载及不同query配对通过。调查差与真实合格交付分开，条件/原始证据/同请求执行检查仍必需。历史完整URL丢query则该子项NOT_EVALUATED，路径次数只描述；计数通过不代表调查充分，五条人工口径仍待输入。
