# F2④b 回放 Runner

- 状态：frozen regression / draft not integrated；待复核，未合 main。
- 日期：2026-10-24（Europe/Vienna）；精确时间见 validation/summary.json。
- 分支：`codex/feat-phase3a-prime-f2d-replay`，基于F2③分支3422241a；受测提交 `a5c0535a2c894c1467d02fe604aa8c3c8d0f2146`。

## 行为与实际入口

`node --import tsx src/eval/restaurant/agent-loop/runners/run-recorded-read.ts manifest.json output-directory`。清单提供recordingDirectory、decisionsPath、原始input（冻结case、startedAt、limits、evaluationLocation、packIds）和明确的modelMode：ORIGINAL或REAL。输入及清单应在运行前提交。回放clock平移到原始时刻并按真实elapsed推进，保留相同日期、证据新鲜度和原预算；需每次运行使用独立进程。

真实Chromium、真实Guard、Interpreter/Compiler/Reducer/Runtime/Router/来源组装均保留。只读取pages中REPLAYABLE文档和HAR，不读取诊断DOM；HTML HAR入口按合格文档集合过滤，文件引用不得逃出录制目录。缺失页面、响应、结构化来源响应或决策序列立即停止，报告 `REPLAY_INCOMPLETE`、snapshot/origin/path/reason及已消费数量。剩余部分不算通过或失败。

HAR未命中沿现有 `notFound: abort` 路径，无网络回落；额外关闭发生缺失请求的context并设置无出口代理。Google客户端只使用HAR中匹配URL、方法、请求body的原始响应，不用投影State或决策内容补造响应。

ORIGINAL逐条返回保存的原始模型输出，检查purpose、Prompt revision和输出契约；不调用模型。REAL通过既有DeepSeek工厂接线，仍需原模型授权开关并消耗原模型预算；本回合只用fixture工厂验证该接线，没有运行真实模型模式的外部传输。

执行artifact的mode明确为REPLAY。独立评价仍用Evaluator@34/rubric@30，回放侧输出executionSource、录制/HAR/决策SHA，capabilityDenominator固定EXCLUDED。部分回放的结果为NOT_EVALUATED、各维度不作pass/fail，另记录REPLAY_INCOMPLETE；已观察到的声明仍保留独立S0核验。没有修改通用Evaluator评分规则、产品Schema或Guard规则。

## 红绿与冻结验收

[有效红灯](red.log)：删除一个CSS响应后，旧网络回落确实向本机来源发出1次请求，零请求断言失败。[绿灯](green-missing.log)：同一最小HTML/CSS控制下，来源0请求，记录首个缺失响应位置。只访问本机fixture，没有外网红灯。

完整fixture由正式Runner实际运行并开启录制，合成Google传输实际返回的原始JSON由fixture另存入同一HAR；内容完全合成，未放宽生产脱敏器或新增生产采集路径。完整种子及独立预期先提交，再执行四条正式回放，见 [输入摘要](replay-input-freeze.json)、[581项冻结](freeze.json)、[正式汇总](validation/summary.json)。没有复制历史运行到产品测试。

| 控制 | 结果 | 页面/决策 | 墙钟秒 |
| --- | --- | --- | ---: |
| 原样重放 | COMPLETED；非空候选、交付及offer与原运行逐字段相同 | 5/5页，4/4决策 | 1.572885 |
| 删除Google结构化响应 | REPLAY_INCOMPLETE；MISSING_STRUCTURED_RESPONSE | 0/5页，2/4决策 | 0.386061 |
| 第3页不合格 | REPLAY_INCOMPLETE；snapshot3，缺静态依赖 | 2/5页，3/4决策 | 1.236417 |
| REAL模式fixture接线 | COMPLETED；候选与交付相同 | 5/5页，4次fixture模型传输 | 1.597941 |

四条子进程继承macOS OS级 `deny network-outbound`，Chromium也继承该策略；仍完成正控制。Node网络传输尝试均0；原样重放模型调用0，真实模型/Google/餐厅网站/Live均0。完整两控制的独立声明S0、边界S0均ABSENT。部分控制所有质量维度NOT_EVALUATED，不将未回放部分混入Live分母。

首次集成预检的子进程stdout在退出前截断到64KB，已修复为等待write回调后退出；断言未删，前后日志保留。OS网络阻断证明限于本机macOS，不声称已验证其他OS的隔离配置。

## 五门禁

| 门禁 | 通过数 | 单次秒 |
| --- | ---: | ---: |
| typecheck | PASS | 0.385699 |
| arch:check | PASS | 0.202081 |
| npm test | 1028/1028 | 19.636363 |
| build | PASS | 0.372256 |
| Chromium fixture | 152/152 | 91.946196 |

[原始日志](gates/gates.json)：每项前后Git status为空，恢复0；冻结前后匹配。无端口或浏览器资源冲突，单次结果。

## 限制与延期

旧浏览器录制可能没有Google原始响应，缺失时只能停止。完整合成fixture额外保留了自身实际响应，不代表历史数据已经恢复。现有HAR按URL保留响应，真实动态页面同URL多次变化、原始决策调查路径变化等兼容性仍需F5录制验证。

按用户指令，**用F5 Live录制回放**留到F5之后，本回合不运行。产品层、共享Browser/restaurant-search非测试文件、Prompt和产品Schema未改；站点3864行、pack473行不增加。新增真实模型、Google、网站、Live、环境重跑全部0。本项只推工作分支，不合main，直接进入一轮测试耗时估算。
