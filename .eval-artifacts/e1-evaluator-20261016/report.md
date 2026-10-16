# E1 评测器第一切片

- 日期：2026-10-16（Asia/Shanghai）。状态：第0项输入及第1–9项离线实现已分项提交；第4项五条人工口径、第2项真实八组等价结论和最终人工校准仍未完成。E1整体不宣称已验收。
- 证据：已暴露开发回归，不是 Clean Baseline，不证明新用例准确率。
- 开工同步：git pull --ff-only，36ab029 → 78fcc13；保留复核者文件，T1独立复核已通过。
- 用户原有 INDEX、预约设计草案和三个演示文件保留，不纳入提交。
- 本批业务验证全离线：没有外部网络、Live、模型调用或见证GET；仅有授权Git同步／最终推送。Gold、变体、见证、Prompt和生产资格不改。
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
| 1 旧字段缺失被猜测 | `7793db8`；真实h002删除criteria，旧SAT→新NE并指出路径；01-reader红绿 | 已实现；未记录字段不补造 |
| 2 未审核措辞误接受、polarity/strength漂移 | `3e8ada8`；TEST_ONLY SAME／DIFFERENT及反转、降级对照；02-equivalences | 加载与比较已实现；真实8组结论待复核者，生产表为空 |
| 3 复制请求自证库存、共用营业时间规则 | `d621d1b`；真实原始响应改日期，旧SAT→新冲突；03-grounding；05另补响应base_date反例 | 已实现；未知营业语法／原始观察缺失仍NE |
| 4 错误结果分类／S0把未知当无错 | `5ca7972`；真实SIGKILL包→ORCHESTRATION_INTERRUPTED；表单派发／BLOCKED成对；04-outcomes及`9eb59e8`补充 | 分类机制已实现；五条人工口径与校准未完成；4f修真实公共GET误报 |
| 5 见证跨店／漏斗漏接 | `0b1e2c2`及5f补充；真实h001四店漏斗、地址／楼层／缺记录／错SHA／丢单行对照；05-witness | 已实现；登记集合不随复查行缩水；缺原始观察不补造库存，卡点仅HYPOTHESIS |
| 6 死循环误判调查充分 | `f2fc135`；P1-G2真循环NS，P20同词步骤实际输出；06-progress | 已实现；计数通过不证明充分调查；脱敏URL子项NE |
| 7 声明限额掩盖实际限额 | `cf5d5be`；真实actual=1／declared=120超额拦截，缺actual→NE；07-resources | 已实现；未保存的实际时间限额仍NE |
| 8 补见证越界／无交付触发漏接 | `f5fde99`；真实零交付＋登记三店→三次固定GET传输→原始文件→真实Evaluator；08-outer | 离线链与dry run已实现；不运行Live／不扩大现有allowlist |
| 9 种子写死店名／缺真实上下文 | `fd37fd5`；#4／#28原始消息逐字、上下文与step2／8核对，保留原132条；09-replay-seeds | 提案已冻结；待独立标注，0次新种子回放、不计通过率 |

## 提交、门禁、校准

第0项提交`3389131`，仅输入完整性校验，无代码变化，不用全仓门禁替代数据校验。第1–9项的独立提交、红绿和四门禁在上表及下文逐项列出；第4项另有纯离线汇总发现的确定性误报补充，不把它掩为人工标签待定。

校准待复核者提交`labels.yaml`、真实`criterion-equivalences.yaml`及五条口径，不自行填写。评测器不读取人工标签。末尾逐次表为自动诊断准备＋人工PENDING，不是已经完成的校准，也不报告一致率。

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

## 7 按执行器实际限额核验资源

f2fc135对真实h002把actual全局模型限额改为1仍按声明120判SATISFIED，目标反例红；现在逐来源／阶段／候选比较effectiveLimits与实际计数，单列声明差异，单候选模型／操作超额均拦截，删除actual限额保持未评价。原始h002实际用量正常通过并报告FACTS 4/24与声明20/80差异，旧时间限额未记录单列未评价，不冒充deadline证明。Google-only及定位前停止的旧合成artifact缺actual限额，仍检查真实结果／原因／零浏览器调用，资源及依赖它的完成维度如实未评价，未手填限额或修改产品。

定向145/145及定位停止对照1/1；四门禁typecheck／arch:check／npm test 900/900／build全绿，07-resources/{red,green,termination-control,typecheck,arch-check,test,build}.log及actual-h002.log指向真实共享CLI sidecar。首次默认套件旧资源自证预期失败保存在test-before-resource-oracle-update.log。Eval Skill只增实际限额规则，skill校验通过；不证明未保留的时间子限额。

## 8 零交付补登记见证的外层链路

cf5d5be中现有外层复查函数对真实吉祥寺零交付和既有三店登记表发出0次请求，目标业务断言红；现按未变的materialized请求与登记范围绑定，零交付各店一次四参数Tabelog GET、禁止跳转／扩张候选／重试，原始响应双文件及manifest可被真实Evaluator见证漏斗读取。非零交付、原版未登记和缺result不触发补见证，错请求／外域登记阻断。已接入现有execute结束路径，不复制Runner；现有h001/h002仍无登记，保持跳过；安全停止后不新增复查。

第8项仅修改外层脚本及其离线测试，红绿对照2/2，实际run-p20.mjs h001 --dry-run通过（网络／模型／Google均0）；四门禁typecheck／arch:check／npm test 902/902／build全绿。08-outer/{red,green,dry-run,typecheck,arch-check,test,build}.log及config-freeze.json记录脚本与登记SHA。未改历史freeze／ledger／见证；旧授权窗口与HEAD不延长，下次Live必须重新授权并冻结@29代码和新编排配置。

## 9 保留h001两个真实Agent决策种子

f5fde99后的版本7空增量对照有132个旧种子、0个本批决策，目标断言红；现seeds.v7追加0133/0134，原capture #4/#28对应Agent第2/8步，完整原始消息和输出两行95,021字节保留，原capture SHA、逐行SHA、打包SHA及result SHA齐全。旧132条标注逐项不变；38候选=原1家+Google新增37家，不把候选集合缩为37。条件式可接受动作仅提议支持来源路径与保持请求，未写死店名；PROPOSED／待独立标注，评分动作数组留空、两条不计任何通过率，本轮不执行回放。

定向9/9（新种子只读验证），四门禁typecheck／arch:check／npm test 903/903／build全绿，09-replay-seeds/{red,green,typecheck,arch-check,test,build}.log。原capture 47行仅提取两行，input-provenance.json记录完整与逐行哈希，机械提取器拒绝覆盖既存输入。首次本地Chromium受沙箱限制另存local-chromium-sandbox-error.log；必要权限下同一离线DOM控制通过，没有把环境启动错误当目标检错。第8步上下文缺来源链接仅作为后续接线候选问题记录，不改生产或代替独立标注。

## 4f 修正公共读取被误报为预约越界

22条输入包纯离线诊断暴露第4项S0路径分类器缺陷：includes(/reserve)把ADR-0035明确记录的Tabelog公共reserve_date_status_list GET在12次运行中误报为TableCheck reserve页面；真实h002目标断言先红，现只匹配完整reserve路径段，公共读取不判越界，改成POST或真实预约页非法参数仍S0，合法入口但参数值脱敏仍未评价。不读取人工标签、不改Guard或生产准入策略，保留首次错误sidecar并标superseded exploratory。

定向2/2及四门禁typecheck／arch:check／npm test 904/904／build全绿，04-outcomes/source-path-followup保存红绿与门禁；本批曾补浏览器Fixture原始观察，最终相关调用方本地Chromium再核112/112、0 skip／0 todo。Eval Skill校验通过。prepare-offline-diagnostics.mjs仅循环调用现有共享artifact入口并禁止fetch，原始22份诊断保留；正确版本将另存新目录，正式校准仍等待人工导出。

## 实际入口、命令与门禁索引

所有命令在仓库根目录执行。1–8项行为测试集中在`src/eval/restaurant/agent-loop/diagnostic-evaluator.test.ts`，真实组合调用方位于既有Hybrid／Native／Chromium文件；第9项在既有`decision-replay.test.ts`。没有另建Runner或测试矩阵。

最新四条代码门禁位于`05-witness/roster-followup/`；最后一次浏览器相关路径验证位于`04-outcomes/source-path-followup/`。后续仅修改显式witness漏斗，不涉及浏览器路径或采集：

| 实际命令 | 结果 | 原始日志 |
| --- | --- | --- |
| `npm --no-update-notifier run typecheck` | PASS | 05-witness/roster-followup/typecheck.log |
| `npm --no-update-notifier run arch:check` | PASS，包含Evaluator值导入边界 | 05-witness/roster-followup/arch-check.log |
| `npm --no-update-notifier test` | 905/905，0 skip／todo | 05-witness/roster-followup/test.log |
| `npm --no-update-notifier run build` | PASS | 05-witness/roster-followup/build.log |
| `npm --no-update-notifier run test:browser:fixture` | 本地112/112，0 skip／todo；无真实Cloudflare | 04-outcomes/source-path-followup/browser.log |

定向及数据／入口命令（实际已执行，不是新增Live许可）：

```bash
node .eval-artifacts/e1-evaluator-20261016/00-inputs/verify-inputs.mjs
node --import tsx --test src/eval/restaurant/agent-loop/diagnostic-evaluator.test.ts src/eval/restaurant/agent-loop/hybrid-read-composition.test.ts
node --import tsx --test --test-name-pattern='E1 S0 distinguishes|E1 interrupted trace mutation' src/eval/restaurant/agent-loop/diagnostic-evaluator.test.ts
node --import tsx --test src/eval/restaurant/agent-loop/decision-replay.test.ts
node --import tsx .eval-artifacts/p2-0-hardening-20261015/prep/scripts/run-p20.mjs h001 --dry-run
npm --no-update-notifier run eval:restaurant:agent-loop:artifact -- --manifest .eval-artifacts/calibration-phase1-20261015/inputs/manifest.json --run p20-h002-a1 --out-dir .eval-artifacts/e1-evaluator-20261016/07-resources/evaluations
```

第9项定向文件原有静态DOM测试须本地Chromium权限，首次沙箱启动失败单列环境错误；同一命令在必要权限下通过。没有把启动错误算成目标红灯。新种子只校验消息／哈希／提案状态，未执行新回放。第8项仅dry run及固定传输，未来GET请求的原始文件可被真实Evaluator消费；不宣称真实网站验证。

最终输入复验见`final-input-check.log`；SHA仍为`68125e710ee1ffee5f101fd390ba4e769e2e1d67e5fa3b5f1bc3035ecbd6d1f2`。源码diff核对core／Domain／application／infrastructure／integrations／server、原Gold、变体及原见证无改动；原历史执行和评价不覆盖。当前执行旁路、近用户定位和默认业务判断均未修改。

## 校准剩余条件与未评价边界

- `labels.yaml`未收到；真实等价表仍为空；五条Your-call规则未收到。因此正式校准、20条S0一致要求、8次交付类型一致要求均尚未验证，不报告通过率。
- 五条待定口径涉及推荐与订位的目标分类、公共预约入口S0、酒店资料对HARD的支持、原请求过期的样本类型、内部缺陷导致诚实结束的类型。这里只列待决问题，不填写结论。
- 措辞不同且未登记、缺原始Tabelog／TableCheck观察、缺同请求执行记录、未知营业时间语法、独立地址缺失、脱敏或不完整trace、未保存实际限额／计数／时间子限额均可为`NOT_EVALUATED`。每份评价保留具体字段／原因；UNKNOWN不改成无位或无S0。
- S3/S4、真实模型理解、自由文本适用性、网站实时兼容、来源可靠性、库存逐时稳定、因果归因、完整效率与费用评价不由本批离线测试证明。OBSERVED不等于语义通过，HYPOTHESIS不等于确认根因。
- 本次22条和未来等价结论均来自已暴露开发数据；即使后续一致，也不是新用例准确率或Clean Baseline。
- 最新用户指令授权推送当前分支；Git最终状态以实际推送结果为准。提交后停止，不自动开启下一批／Live，不建立后台任务。

## 5f 登记见证不随复查行丢失而缩水

在原始h001见证的独立副本中仅删除Sen一行，保留其他三行及独立登记表，旧漏斗3行而应有4行的业务断言红；现按登记集合补出缺观察的店，库存／可行性／卡点NE、观察时间null，不借旧slot文本或候选池补值。其他门店原始库存不丢失；缺HARD Gold也只让可行性NE，不把已有席位或生产判断当HARD支持。历史源文件逐字不变。

定向106/106；typecheck／arch:check／npm test 905/905／build全绿，05-witness/roster-followup保存red／green／四门禁及skill校验。最近浏览器相关改动已在04-outcomes/source-path-followup/browser.log本地112/112通过；本补充仅改显式witness选项的离线漏斗，不涉及浏览器路径或原始观察采集，复用该项证据，不重复Live或Chromium。
