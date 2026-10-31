# G4方案一：产品检索接线，离线切片

- Status: draft / not integrated，真实调用0；时间使用维也纳CET UTC+1。
- 起点main74afd956（B1已发布并ls-remote核对），合并已复核准备86e1dd9d，源码冲突0，六文档双方保留。
- 用户可观察改善：原Google名与合法片段不能确认同店后，用同Place ID Google返回日文全文再搜；旧详情总额5不重置，前两词共4、日文1，不用的余量退回已观察候选。
- 不改身份、排序、查位、响应绑定、链接规则、State/TaskDefinition、任何Prompt/Schema版本；不改B的query-controls/vacancy-response、A既有评测/harness或前端。
- 修改前函数/范围：TabelogBrowserAvailability options155–171及checkCandidate检索循环377–478；SourcePackAvailabilityProviderContext及Tabelog createProvider19–35/300–310；LiveBrowserAvailabilityOptions/check（39/84–118）；GooglePlacesRestaurantSearch已有请求计数184–223旁增加日文名入口；createLiveReadAssembly来源组合。Router只把既有readRunId作为可选内部port参数传入availability，不改持久请求/状态，确保新增Google详情请求和既有预算/产物同run，不引入新计数Schema。
- 名称原文/实际语言只为检索，不替换Google候选或成为身份接纳。共享Google客户端适配器按run+PlaceID缓存成功/失败Promise，发送前沿既有placeDetails计数检查并记账；每个未确认店每运行至多1额外Google请求，无新模型调用、自动重试或日文翻译。
- 有效红灯入口：现有普通HTTP B1生产组合增加无直链fixture，前两词明确空、Google ja名称已由传输fixture独立给出；旧代码停无结果，期望PRESENT_RESULTS/原源链接不成立。只替换模型/Google/BrowserSession I/O，Interpreter/Compiler/Reducer/Router/生产解析和身份保持真实。
- 正常/反例：三词顺序、逐字片段、同ID日文、NFKC去重；累计5详情、日文占第5/重复无候选退还、原已HIGH不额外请求、异店仍拒。Google预算耗尽/失败缓存、不同run隔离及HTTP导出计数。
- 复用86e1dd9d的37主视图+4复跑和独立Gold事后评分；在新目录重跑同一模拟，不覆盖旧输出。目标原23/23和focus3/3、错认0；缺页/未捕获输入仍未评。补充生产路径离线来源回放用于防模拟与生产循环漂移。
- 冻结后五门禁+严格G2，各项前后净树，所有脚本运行前提交；两次修门禁仍红则停。结果只推工作分支交复核，不合main。
- 清单：优先只物化已观察URL。Beef无已保存同ID日文名，不能从Gold或认证页倒灌；搜索和新详情存在因果依赖。完全不发请求，缺口明确交复核，不能把未知槽位冒充最终精确清单。
- 网站GET未来≤14/共享260、Google≤1、模型0、Live0；现在全部0，不读取/加载.env。清单复核批准前任何真实请求均禁止。
