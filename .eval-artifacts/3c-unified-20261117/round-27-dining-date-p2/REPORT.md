# Round27 用餐日期 P1/P2 离线收口

Status: **功能回归通过；最终保护核验失败，整体签收 BLOCKED_BY_MISSING_HISTORICAL_ORIGINALS**。frozen offline regression / draft, not integrated；不是 Clean Baseline。

## 1. 版本与边界

工作树 `/private/tmp/praxis-3c-unified`，分支 `codex/feat-web-photos-unified`。基线 `eafb8dad5c84749a163ea0771a315496f1965985`；唯一当前功能验收冻结 SHA **`98b35466bd0f37f662eabb5750b2f9c43e95fd04`**，src tree **`a2e7df8b08e6bae1031e8dcba6f37ea7afa8764c`**。最终归档 HEAD 以包含本报告的 Git 提交及交付回执为准。

本机 local-main check 通过，sparse 保留。源码仅六文件：日期绑定器及单测、compiler 传入已有可信时间上下文、实际消息回归、Agent Loop 语义冲突等待条件、Round27 浏览器测试。`src/web/` 产品源码、Reducer、来源 Adapter、Prompt/Gold/评分、搜索指纹、missingBlockingFields、依赖/CSP 未改。[source-freeze-receipt.json](source-freeze-receipt.json) / [frozen-inputs.json](frozen-inputs.json) 记录白名单和42份输入。

**工作树并非干净树**：各阶段前后始终仅652条已核对HEAD原文哈希的受跟踪历史删除。获准只在此状态下验功能；源码与输入干净，完整status摘要均为 `d7ee88d53f8f698459beced4d45c15802b798441652df2893a19918172b11752`。见 [frozen-worktree-status.json](frozen-worktree-status.json)、[functional-worktree-policy.json](functional-worktree-policy.json)。未暂存历史删除、未忽略其他状态或恢复文件制造净树。

## 2. 修复、证据更正与链路

日期组按原文实际位置绑定，排除否定日期；仅显式相连备选共组。结构化 `Change <label> to <ISO>` 目标和明确用餐改期优先，避免old label、重复raw、背景到离时间或“预算/餐厅未定”劫持。明确相对日修正模型错值或漏DATE；明确ISO/带年份中文日历/星期不接受虚构raw或不一致值。真正日期备选、矛盾CONFIRM、结构化改期漏DATE走既有澄清，不查旧日期。this/next/本/下周限定用已有物化器和可信东京时间核验，保留正确H002/H003及下周五绝对日期，不剥去限定后滚到另一周；没有扩成通用日历解析器。

**更正旧证据推断**：此前P1报告首次NEEDS_INPUT时0查位，不足以证明最终0查位。实际Chromium诊断发现旧Loop仍继续决策并查询旧日期（[browser-date-diagnostic.log](browser-date-diagnostic.log)、[development-checkpoints/before-read-idle-guard/](development-checkpoints/before-read-idle-guard/)）。本轮将semanticConflict纳入NEEDS_INPUT等待条件；普通缺地点仍ASK_USER。旧报告不改写，此处撤回其将首帧观察等同于最终零调用的推断。

所有消息与独立探针等待读句柄真正退出；正式消息另等待对应assistant落盘。原脚本和仅等待谓词差异见 [original-probe-inputs/](original-probe-inputs/) / [probe-idle-boundary-adaptation.json](probe-idle-boundary-adaptation.json)，预期和数据不变。

[actual-message-observations.json](actual-message-observations.json)：**65组真实持久消息**=44组查位、17组语义澄清（decision/search/availability均0）、2组推荐搜索无查位、1组日期不变no-op、1组普通缺地点ASK_USER无来源调用；全部readHandleIdle=true。测试固定东京11月24日：改后天的正确、错明天、错日历、漏DATE四回包均查11月26日19:00；只改时间沿用11月25日；歧义0查位。背景到离、排除后重复日期、ISO/星期/raw伪造、周限定与继承对照保留。

新增实际胶囊浏览器 **8/8**=CONFIRM/EMPTY/RAW_MISMATCH/CORRECT ×390/1440：等值编辑不提交；目标28日的矛盾/空DATE澄清且真正停读，0决策/搜索/查位；错raw/正确回包均实际查28日18:00。JSON与PNG在 [visual/](visual/)，调用计数在 [gates/browser-fixture.log](gates/browser-fixture.log)。

## 3. 正式离线验证

全部在上述SHA运行；原始日志、退出码、耗时、前后状态在 [gates/manifest.json](gates/manifest.json) / [acceptance.log](acceptance.log)。不加载.env；适用步骤OS禁止非回环外连；BrowserFixture不套外层sandbox，Replay子进程保留自身OS隔离。Build在distC1之前。**最终执行器exit1，不能称全套验收PASS。**

| 阶段 | 实测 | 退出码 | 外层秒 |
|---|---|---:|---:|
| typecheck | PASS | 0 | 0.734315 |
| arch-check | PASS | 0 | 0.244444 |
| build | PASS | 0 | 0.629203 |
| test | 2013/2013 | 0 | 80.662081 |
| browser-fixture | G2 5/5 + Chromium601/601 + G6 159/159 | 0 | 485.077842 |
| c1-built | 4/4（同冻结SHA新dist） | 0 | 12.138631 |
| reviewer-probe | 49/49 | 0 | 39.423399 |
| assets | 19/19 JS + HTML/CSS | 0 | 0.311477 |
| graph | strict=true /18模块/0环 | 0 | 0.108741 |
| protection | FAIL：额外2872未跟踪历史缺件 | 1 | 2.992048 |

Browser内部耗时：G2 24374.840416ms；Chromium422113.825375ms；合计606/606、446542.054ms（合计不是额外测试）；G6 38191.759708ms。Round27文件23条=原UI15+日期8，已含在601内。默认2013含65条消息与6条纯测试；开发定向71/71、原H001–H005定向6/6不另加进正式分母。

C1源码4条已在Chromium内；[c1-built/test.log](c1-built/test.log) 构建版4/4、11883.944542ms，加载同SHA新dist，通过PGlite、回环HTTP/CDP驱动生产会话路径，无真实PG。独立49条/10组全部通过，见 [reviewer-probe-results.json](reviewer-probe-results.json) / [reviewer-probe.log](reviewer-probe.log)；这是暴露开发探针，不是私有Holdout。

[build-assets.json](build-assets.json)、[html-build-comparison.json](html-build-comparison.json)、[original-ui-parity.json](original-ui-parity.json)：tsx/dist的19JS及HTML/CSS相同，且与原Round27逐字节相同。[browser-dependencies.json](browser-dependencies.json) / [.dot](browser-dependencies.dot)：strict=true、18模块、SCC均单元素、0循环/any/抑制，无反向entry导入。

## 4. UI结果与目检

[visual-inventory.json](visual-inventory.json)：42 PNG+42 JSON均为当前SHA。逐张核对5联系表，另目检8张日期原图和4张关键UI原图，见 [visual-inspection.json](visual-inspection.json) / [contacts/](contacts/)。原UI15条在390×844和1440×900复跑，0应用pageerror。合成无照片Fixture占位是预期，不是真实图片验收。

UI-4历史summary.top与弹层summary.top-sheet.top四组差值均0，弹层仍随内容增高；UI-5覆盖sending=false的胶囊保存/删除，延迟响应隐藏旧空卡、失败恢复；UI-6先扣住确定活动读轮，同handle停止且stopped:true，模拟键盘Stop底262.375在composer顶282之上，草稿保留。[visual-metrics.json](visual-metrics.json) 记录坐标。首次一次性后处理错选历史summary索引，失败后按原JSON正确索引复核；原图/JSON/浏览器断言不变。

日期跟进未另跑正式16/Style1六项独立矩阵，不冒充三尺寸重验；P3 Source横向移动、错误滚动只登记未修；真机软键盘NOT_EVALUATED。

## 5. 失败保留

初始独立23观测13通过/10失败（首帧边界较弱，仅作原定位）；[targeted-red.log](targeted-red.log) 56中45通过/11失败。日期组、raw优先级、ASK_USER对照与读闲置修正的中间材料在 [development-checkpoints/](development-checkpoints/) / [development-failures/](development-failures/)，不混入最终分母。

前冻结e1c4ec63ca874949a52cb7d2eecad1a7b4ec596c默认2011中2007通过/4失败（H002/H003及父项、独立Tabelog SCRIPT），第一失败即停，后续未跑；见 [failures/e1c4ec63c-week-scope-and-source-script/](failures/e1c4ec63c-week-scope-and-source-script/)。周限定一刀澄清确为本次回归，已修，固定案例/Gold/评分未改。SCRIPT在原e1同源码单独严格1/1、5候选、内部3903.210125ms，未改Adapter/断言/预算；首次根因仍未确认，隔离运行不替代门禁；最终完整2013已包含并通过它。

当前冻结的 [protection.log](protection.log) / [first-failure-state.json](first-failure-state.json) 保留；不改冻结保护脚本、基线清单或断言转绿，不为历史缺件再跑功能门禁。

## 6. 历史阻塞、保护和停止点

[post-failure-protection-audit.json](post-failure-protection-audit.json)：开工物化历史14370，现存**10846匹配、现存变更0**；缺3524=已登记652受跟踪+另发现2872未跟踪。加上早已登记137缺件，总缺3661。中间“13718现存匹配”仅是按已知652推算；本次最终以实际全清单扫描为准。Git状态无法体现未跟踪原件丢失。

[additional-historical-gap.json](additional-historical-gap.json) 含2872路径及baselineSHA256（当前索引中0条）；[protection-failure-diagnostic.json](protection-failure-diagnostic.json) 保存全部差异。含旧复核目录、restaurant-web-read历史；删除时间/机制本次未确定，不把缺件归因于功能测试。此前授权14条恢复的原收据/清单不改写；本轮未新恢复。652精确HEAD恢复仍待例外确认，2872不在其范围，已请求备份位置。

复现：`python3 .eval-artifacts/3c-unified-20261117/round-27-dining-date-p2/verify-protection.py` 在缺失集合断言exit1。影响是历史保护与签收阻塞，不是五门禁或49探针失败。不得报告全验收通过或净树交付。

其余保护实测不变：主目录HEAD/status/index/diff、主.env哈希、稀疏、八根配置、closeout950材料、原Round27清单；六文件外源码无变化。489/489默认材料完整且与652缺件零交集，见 [test-input-preservation.json](test-input-preservation.json)。[cleanup-verification.json](cleanup-verification.json) 最终无Fixture/探针/Chromium残留，未误关他人进程。

四层边界：①离线Mock/Fixture/PGlite执行接线通过；②暴露开发反例及独立49/49；③真实模型/来源质量/S0未评，不能以假模型证明真实S0=0；④历史与产品整体签收BLOCKED，真机与真实完整Replay未评。0Live/真实PG/凭据探针，不用4312、不推送、不合main，停止等待历史缺口确认。
