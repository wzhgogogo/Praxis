# B1卡片条款：ADR0045保留区修复与main合入

- Status: user-approved main integration / offline evidence。
- 时间：2026-11-01T17:07:25.260439+01:00，维也纳CET（UTC+1）。
- 原复核候选：5cda89b7ee05a371a015db0f36a919f3fc4703fe。
- 同步main：1d65b8e80df161284157602713be19562c0ff79b；同步提交96494220。
- 最终受测候选：fff001f28fc2f886a0b059079d4d190d4a2d506b；764项SHA冻结，15个受保护文件与154份历史产物原字节。
- 本次真实模型、Google、网站GET、Live均0；不读取/加载.env、私有Holdout或独立QA答案。

## 修复结果

条款deadline现在是原整轮deadline减RESTAURANT_READ_CONCLUSION_RESERVE_MS（复用原20000常量）。只有严格早于此边界才允许新取页、内部语言页导航或任何模型传输；恰剩20000毫秒即拒绝。控制器在此边界发出DELIVERY_RESERVE_REACHED取消信号，完成后也核对期限；未完成条款整组省略，已核实B1链接不受影响。

单次外层检查不足以限制captureBookingPages中的多次操作。本次在既有G1事实factory传入B1专用beforeRead：会话打开、读取/动作方法执行前重核，模型传输也在真正调用网关前重核。close始终允许关闭清理。短deadline只由已有整轮deadline计算，没有新额度、fresh run、重置计数或新URL。显式G1追问不传此检查，仍用原独立3次/60秒及2页计数；非B1/HARD链路不变。

原有选店时机、同店/渠道/页面/run/身份/引用检查、日英冲突、三种卡标签、手续费与两次链接校验保留；Agent/G1 Prompt、Schema、State/TaskDefinition未变。A31ba2a84三个原文件与B G3三个文件未改，两个原交接链接读取器未改。

## 5cda89b7产品上的红灯和同断言绿灯

620aab98只增加C测试及旁听数据，产品保持5cda89b7原字节。六个实际createLiveReadAssembly→持久应用→Router/Reducer控制中，四个目标断言有效红（原始压缩日志/输出在red/）：

| 控制 | 未修复 | 修复后 |
| --- | --- | --- |
| 剩20001ms | 可开始，正常控制通过 | 可开始；实际起始均大于20000 |
| 剩20000ms | 开始1次来源会话 | 来源/模型开始均0，条款空，链接在 |
| 取消答案返回时进入保留区 | 仍开始第二次卡模型 | 只开始首模型，整组省略 |
| 首页面控制读完时进入保留区 | 仍开始第二次语言导航 | 仅原页1次，不导航、不调用问答模型 |
| 获准读取在边界暂停 | 未在1000ms有界等待内收到提前取消 | 收到DELIVERY_RESERVE_REACHED；不调用模型，链接在 |

红灯保存于41f6a6fc，677334e5修复后同六项6/6绿。计时器控制暂停的是已经实际开始的固定来源读取，等待真正AbortSignal后才释放；不是让fake预设取消结果。最终完整矩阵再跑同控制，七个观察帧的原始开始时刻经独立evaluate.py核对，保留区内开始0；它不调用生产资格函数。原条款功能14份可见B1 DTO与已复核5cda89b7逐项相等。

这些是实际生产组装的本地集成回归，外部模型/来源固定、时钟受控，不是新的Live/G6能力签收。A原src/eval整组装测试/helper保持原字节，通过最新组装门禁和完整默认测试；没有增加组件白名单例外。

## 最终观察

| 控制 | 页面开始 | 问答开始 | 起始最小剩余ms | 条款数 | B1 |
| --- | ---: | ---: | ---: | ---: | --- |
| boundary-20001 | 1 | 2 | 20001 | 2 | 保留 |
| boundary-20000 | 0 | 0 | 无读取 | 0 | 保留 |
| between-models | 1 | 1 | 30000 | 0 | 保留 |
| before-language-navigation | 1 | 0 | 30000 | 0 | 保留 |
| early-abort | 1 | 0 | 20001 | 0 | 保留 |
| assistant-wait-0 | 1 | 2 | 499991 | 2 | 保留 |
| assistant-wait-40 | 1 | 2 | 499994 | 2 | 保留 |

## G1改动范围

完整文件、原始与当前行段、SHA在[g1-change-scope.md](g1-change-scope.md)及JSON。

- page-question-reader.ts：本分支原条款接线增加当前G1页缓存和已接纳答案复用，捕获实际usedPages，不改显式问答返回。此次把原browserBudget/model送入同一事实factory，给B1捕获/模型传输添加已缩短deadline的执行前检查；不用显式追问额度替主动条款付费。
- native-source-facts.ts：本分支先前只在inspectFacts的capturePagesOnly分支新增captureLinkedTranslation，从实际可见、可操作且同店的语言链接最多再读1页，复用原Executor/Guard/身份提取，不新写解析器。与已审5cda89b7逐字相同，本次没有再改它。未设置该参数的HARD/显式G1行为保留。
- page-question-read-budget.ts与native-read-composition.ts：仅传递可选beforeRead并包装现有runtime，保证G1内部语言导航/读取也受B1期限限制；关闭清理不受门槛拦截。原访页计数、shared browser budget和模型网关仍是同一份。

## 助手消息实际多等多久

旁听原readBookingTerms入口/返回、结果可展示通知、read-finished，以及原数据库appendMessage成功返回；原SQL仍真实执行，未替换存储。始终观察到TERMS_END ≤ READ_FINISHED ≤ ASSISTANT_APPENDED，Book on可展示先于条款结束。下表为单调时钟实测，单位毫秒：

| 运行 | 注入传输等待 | 条款阻塞区间 | 结果可展示→助手持久追加 | 条款结束→持久追加 |
| --- | ---: | ---: | ---: | ---: |
| 单文件控制 assistant-wait-0 | 0 | 2.921 | 5.305 | 0.852 |
| 单文件控制 assistant-wait-40 | 80 | 85.393 | 88.073 | 1.357 |
| 完整默认并发门禁 assistant-wait-0 | 0 | 80.763 | 84.537 | 1.569 |
| 完整默认并发门禁 assistant-wait-40 | 80 | 100.251 | 103.539 | 1.680 |
| 完整默认并发门禁 boundary-20000 | 0（省略） | 5.597 | 64.281 | 47.357 |

因此助手消息确实被条款工作阻塞：单文件正常区间2.921ms，注入两次40ms后85.393ms，连同通知/持久化分别5.305/88.073ms。完整默认套件中的CPU/SQL调度会增加等待，已单列实际值，不拿不同并发运行作延迟收益或模型性能结论。恰20秒省略时读取/模型0；其余通知/数据库排队仍存在。没有真实模型/网络延迟实测，不能由这些fixture数字推算Live等待。

## 合并候选门禁

| 检查 | 结果 | 秒 |
| --- | --- | ---: |
| 冻结完整性（前） | PASS | 0.130 |
| typecheck | PASS | 0.456 |
| arch（含组装门禁） | PASS | 0.224 |
| 默认1327/1327 | PASS | 36.269 |
| 独立7帧+旧14帧核验 | PASS | 0.218 |
| build | PASS | 0.475 |
| Chromium187/187 | PASS | 130.452 |
| 严格5/5，12/12页PASS | PASS | 24.025 |
| 冻结完整性（后） | PASS | 0.157 |

标准G2首组独占5/5；严格G2单独运行。九步各项前后git status为空，输入SHA不变；本次完整门禁一次全绿，未过滤、跳过或豁免。新的main组装规则与24项精确例外、组件迁移/退休16个源码配置路径原字节保留，四处文档冲突保留双方记录；旧C/门禁154份产物未覆盖。账本510条，原main507及5cda89b7的509条全部保留，新增本批零调用一条；累计仍171模型、255/290评测GET、Google12、Live0。

按用户本次明确批准发布main。发布前核对main仍1d65b8e8；交付提交只补报告/状态/原始证据，源码和配置必须等于fff001f2。以最新main为第一父正常合并，树必须等于已测交付树，普通原子推送C分支与main，不force、不修改其他工作树。确切合入SHA以Git与ls-remote回执为准，核对后通知A并待命。
