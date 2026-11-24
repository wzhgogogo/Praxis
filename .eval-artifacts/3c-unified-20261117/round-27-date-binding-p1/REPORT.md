# Round 27 日期选择 P1：最小修复与最终离线验收

- 状态：**frozen offline regression / draft, not integrated**。关闭本次独立复核列出的日期选择P1及其weekday、漏DATE、反序兄弟路径；不冒充真实模型/来源验收。
- 工作树 `/private/tmp/praxis-3c-unified`，分支 `codex/feat-web-photos-unified`；复用原稀疏树，官方check通过。
- 起点 `0b7e9384439efad773a917d65ad7e229cd6188bf`；原Round27冻结 `937d44be67fb8f5b735743bc1666040cc6c551b7`，其报告/全部295份证据原样保护。
- **唯一最终验收SHA：`5d6d683f13ee1247910f08651ec1e1ec35b58a9c`**；`src` tree **`2e6d4725953ba1107a2437dda269ecd891c6b4d0`**。以下完整门禁、11条独立探针、资产、截图和保护结果均来自此SHA的同一干净树。归档提交只追加本目录证据及四份账本，冻结后不再改src；最终归档HEAD见交付回执/Git日志。

## 修复范围与选择边界

源码只改三份：[绑定器](../../../src/domains/restaurant/relative-date-binding.ts)、[纯编译回归](../../../src/domains/restaurant/relative-date-binding.test.ts)、[真实持久消息回归](../../../src/application/restaurant-relative-date.test.ts)。[scope-verification.json](scope-verification.json) 记录前后SHA256及零web差异。UI、State/Reducer、Agent Loop、来源提取、Prompt、scorer/evaluator、搜索指纹、missingBlockingFields及依赖/CSP配置均未修改。

原问题是把一个相对日期的出现等同于用户选定该日，覆盖了正确模型日历DATE；并把“两三”末位当成三。修复保持为有限的确定性边界：

1. 中文整数按明确形式处理；范围/相邻近似数及近似限定不再折成单值，通过既有CONFLICT/NEEDS_INPUT承接，无额外模型重试。
2. `dateSelectionIsUncertain()` 在**一处**从本轮原文日期片段检查未定及选择关系，覆盖既有中英文weekday与相对日/日历日的前后顺序，**不依赖模型给出DATE**。它只识别选择关系，不计算日历/weekday值，不引入通用日期解析器。
3. 原文可核对、非相对表达的既有DATE literal/weekday指令共用同一优先级；不让其他被提及的相对词推翻已明确选择的日期。没有为“我没空”增加专用字面分支。
4. 只有明确、单一的相对日仍按信任东京自然日纠偏/补漏DATE；保留原四种“后天”回包、歧义与只改时间继承对照。weekday/date计算仍全部交给既有物化器，Schema/Prompt版本未再升级。

## 真实持久消息与独立探针

环境为本地假模型 + 生产解释/消息/编译/持久化链路 + PGlite + 本地查位端口。参考东京2026-11-24；绝对/weekday复核先建11/26 18:00计划。实际query参数取自provider端口记录，不从draft或阶段反推。

[semantic-message-observations.json](semantic-message-observations.json) 来自最终 [gates/test.log](gates/test.log)：17组真实消息，10组明确日期实际查位，7组澄清且查位0；有查位的组均通过19:00时段断言。

|冻结消息场景|终态|实际查位日期|查位端口次数|
|---|---|---|---:|
|correct offset|PRESENT_RESULTS|2026-11-26|3|
|wrong tomorrow|PRESENT_RESULTS|2026-11-26|3|
|wrong calendar|PRESENT_RESULTS|2026-11-26|3|
|omitted DATE|PRESENT_RESULTS|2026-11-26|3|
|ambiguous dates|NEEDS_INPUT|无|0|
|time only carries date|PRESENT_RESULTS|2026-11-25|3|
|explicit calendar correction control|PRESENT_RESULTS|2026-11-28|3|
|excluded relative day preserves calendar correction|PRESENT_RESULTS|2026-11-28|3|
|approximate day range with omitted DATE|NEEDS_INPUT|无|0|
|incidental relative mention preserves selected calendar DATE|PRESENT_RESULTS|2026-11-28|3|
|undecided relative and calendar dates with omitted DATE|NEEDS_INPUT|无|0|
|competing relative and calendar dates despite modeled DATE|NEEDS_INPUT|无|0|
|weekday correction control|PRESENT_RESULTS|2026-11-28|3|
|incidental relative mention preserves selected weekday DATE|PRESENT_RESULTS|2026-11-28|3|
|competing relative and weekday dates despite modeled DATE|NEEDS_INPUT|无|0|
|competing relative and weekday dates with omitted DATE|NEEDS_INPUT|无|0|
|competing weekday then relative date with omitted DATE|NEEDS_INPUT|无|0|

独立原探针的冻结副本：[reviewer-date-probe.mjs](reviewer-date-probe.mjs)（6条，`--p1-only`）、[reviewer-weekday-probe.mjs](reviewer-weekday-probe.mjs)（5条）。最终 [reviewer-probe-results.json](reviewer-probe-results.json) / [原始输出](reviewer-probe.log) **11/11**：

- 「后天不行，改成11月28日晚上七点」「后天我没空，改成11月28日晚上七点」实际查11/28 19:00，与单独明确日历更正对照一致。
- 「大概两三天后晚上七点」「后天还是11月28日我还没定，晚上七点」进入NEEDS_INPUT、0查位；即使模型给出竞争日历DATE也不能绕过。
- 单独「改成周六晚上七点」及「后天我没空，改成周六晚上七点」实际查11/28 19:00；「后天还是周六」无论模型给weekday还是漏DATE、以及反序「周六还是后天」均澄清且0查位。
- 原“后天”正确+2、错TOMORROW、错日历、完全漏DATE均实际查11/26；时间单改沿用11/25。原同轮+2/+3冲突、数值界限、跨月/年也保留。

定向回归最终 **21/21**（17消息+4纯单测），见 [date-relation-green.log](date-relation-green.log)；开发期独立11条全绿见 [independent11-targeted.json](independent11-targeted.json)。这些计数不叠加到默认门禁分母；最终独立探针重新在冻结SHA运行。probe中原有CONFIRM条目不属于此次P1，按用户`--p1-only`范围排除，不声称关闭其余未验语义。

## 同一净树完整离线验收

顺序Typecheck→Arch→Build→默认测试→Browser Fixture；Build后运行dist C1及冻结独立探针。全程最小父进程环境，未加载.env；Browser Fixture不套外层sandbox-exec，Replay子进程保留自身OS断网隔离；其余门禁/dist/探针使用OS仅回环网络隔离。

|阶段|实际结果|退出码|外层秒数|
|---|---|---:|---:|
|typecheck|PASS|0|0.679259|
|arch-check|PASS，0 forbidden dependencies|0|0.195640|
|build|PASS|0|0.562913|
|test|1963/1963|0|76.236037|
|browser-fixture|G2 5/5 + Chromium593/593 + G6 159/159|0|483.101108|
|c1-built|4/4，同SHA Build后dist|0|12.959828|
|reviewer-probe|11/11（6条日历/相对日 +5条weekday）|0|7.436231|
|assets|19/19 JS + HTML/CSS一致，且与原Round27 UI字节相同|0|0.198559|
|graph|strict=true，18模块、0环/any/抑制指令|0|0.045016|
|protection|13635现存原件匹配、0新增偏离；137既有缺件仍阻塞整体签收|0|3.287112|

完整命令、源码tree、计数和各阶段前后净树回执：[gates/manifest.json](gates/manifest.json)。Browser分列G2 5/5（25563.805041ms）、Chromium593/593（419206.814625ms），合计598/598（444825.093ms），G6 159/159（37992.848084ms）；合计不是额外分母。C1源码4条包含在Chromium；[dist C1](c1-built/test.log) 4/4，12833.69525ms，使用同SHA新编译模块和实际回环CDP，非真实Cloudflare服务。

[build-assets.json](build-assets.json)、[html-build-comparison.json](html-build-comparison.json)、[browser-dependencies.json](browser-dependencies.json) 证明19JS及HTML/CSS源码/构建一致，strict=true、18个单元素SCC、0环/any/抑制、无反向entry导入。[ui-retention-verification.json](ui-retention-verification.json) 另核对19JS及HTML/CSS与原Round27逐字节相同，源web diff为空。

未改的15条Round27 UI在完整套件通过，新生成34PNG/34JSON均绑定最终SHA，4联系表覆盖全部图并打开6张关键原图；[visual-inventory.json](visual-inventory.json)、[目检与坐标](visual-inspection.json)、[联系表](contacts/index.json)。Source历史绝对top/弹层内部相对top四组差仍0，手机Stop高于composer、流式编辑保持；四次注入500为预期恢复对照。没有另跑独立16场景或历史十路径脚本，也不沿用旧批次计数作当前结果。

## 失败、补强与安全检查点

历史输出均未改写：

- 原0b7起点独立4条探针2通过2失败，实际错查日见 [baseline-review-probe.json](baseline-review-probe.json)；新增13条回归10通过3失败见 [regression-red.log](regression-red.log)。
- `5969f8a59e8730ca4b8dd4d5900bb98babf1f6b1` 对原两条例句已绿、完整五门禁也通过（默认1955、G2 5、Chromium593、G6 159），但独立补强6条仅4/6；普通主语及未定竞争日仍错查11/26。此候选**不签收P1**，全套原件与未改输入移至 [failures/5969f8a59-incomplete-selection-boundary/](failures/5969f8a59-incomplete-selection-boundary/)。选择边界新增回归修复前12/16，随后16/16转绿。
- `6ba08830bf13a87656ccf563d4c4485bccfe749a` 的weekday独立3条仅1/3。只终止外层调度，已启动默认测试未收信号、自然完成1958/1958；因外层未采集其退出码，不冒充完整门禁。type/arch/build各exit0；Browser/G6/dist等NOT_RUN。原中断回执、子进程自然结束核对与输入见 [failures/6ba08830b-weekday-sibling/](failures/6ba08830b-weekday-sibling/)。源码在所有当前子进程结束前保持不变。
- 同源漏weekday/反序补强保留 [weekday-regression-red.log](weekday-regression-red.log)、[weekday-omission-red.log](weekday-omission-red.log)，再统一关系检查获得最终21/21与11/11。最终SHA重新跑完上表，没有用中断或旧候选通过替代本次验收。

111份先前候选证据与其冻结Git blob一致，见 [superseded-evidence-verification.json](superseded-evidence-verification.json)。历史原件中的运行期路径按其冻结SHA/归档位置解释，不把原文改写成新结果。当前只有一条绑定器实现，无新旧生产路径并存。

## 保护、归档与未测项

[protection-verification.json](protection-verification.json)：13635现存历史文件匹配、新增缺失/既有改动0，包含原Round27全部295份证据；主目录HEAD/索引/未提交状态、主.env、稀疏规则、8份根配置及closeout950现存材料不变。源改动白名单只有上述三文件。**137份既有早期未跟踪原件缺失仍为BLOCKED_BY_MISSING_HISTORICAL_ORIGINALS**；本轮增量保护PASS不代表整体历史签收PASS，没有新增恢复或伪造。原总表另核对为12501/12638匹配、137缺失、现存变更0，见 [original-history-verification.json](original-history-verification.json)；原Round27的294产物加清单自身295文件核对见 [original-round27-verification.json](original-round27-verification.json)。

[cleanup-verification.json](cleanup-verification.json) 确认最终driver exit0、无遗留Fixture Chromium/HTTP/CDP测试进程，PGlite均按finally关闭。原既有closeout缺.git状态未修复。[frozen-inputs.json](frozen-inputs.json) 的14份输入/源码哈希冻结后保持；[artifact-sha256.json](artifact-sha256.json) 覆盖本批全部证据，排除其自身；[source-freeze-verification.json](source-freeze-verification.json) 记录冻结后src差异为空及四份追加账本哈希。只本地归档，不推送、不合main。

四层结论：①签收的是上述17组消息和11条独立探针的离线合同，不推导真实合格交付率；②原文选择边界、持久draft、实际查位参数及0调用有独立期望对照，真实来源身份/事实/库存Gold未评；③未发现本轮固定对照错查日，不声明真实S0=0，真实来源S0–S4为NOT_EVALUATED；④初始错位源于把相对词出现当选择，部分修补遗漏weekday/模型漏字段/顺序，现集中为一次原文关系判断和一次非相对DATE优先级，失败原件保留。

**NOT_EVALUATED / 未执行**：Live模型/Google/餐厅服务、真实PostgreSQL、远端Cloudflare CDP、4312、真机iPhone/Android键盘/手势/缩放及独立整单真实来源Replay。没有新增真实调用或外部副作用；本轮结束停在本地提交，等待独立复核。
