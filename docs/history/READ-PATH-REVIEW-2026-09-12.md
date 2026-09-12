# Restaurant 只读执行链横向审查

- Status: frozen review snapshot / development diagnostic
- Document revision: 1.0
- Date: 2026-09-12
- 基线：`e504a3f`，含 `1b929fa`；审查开始工作区干净。结论不覆盖后续实现。
- 方法：对比 `5dfa3e0..e504a3f`，横向审查真实调用方，并用公开合成输入调用当前生产类/函数构造离线反例。未读取私有Holdout、未修改Golden或历史Live artifact。
- 本次只修改开发规程与审查记录，没有修产品代码，也没有Live、真实模型、数据库写入、commit或push。

## 总体结论

已有改进应保留：取消隐藏12家截断、推荐日期/时间可选、修复09:30分钟丢失和关门点、支持PRESENT_RESULTS后的语义事件、事实刷新独立事件、命名地点坐标路径、带引用的模型类型判断。不能继续使用上轮“完全没有负向满足生产者”的结论。

但新能力没有跨调用方闭环，且出现错误成功与错误失败。下面的问题应按共同契约修复，不能逐个网站增加fallback。相关既有53项测试全部通过，仍不能捕获下述反例，证明缺的是跨层行为覆盖与Evaluator契约接线，而非单纯缺smoke或更多日志。

## F1 — P1：资源耗尽提前拦截已可展示的结果

位置：`src/application/restaurant-agent-loop.ts:79`、`:167`；`src/domains/restaurant/agent-context.ts:120`。

`noExecutableDiscoveryPath`对推荐只检查Google耗尽及所有候选是否已有factCheck；在生成Context和模型决策之前直接终止，未检查已经满足的展示或待执行的显式事实刷新。factCheck表示一次读取记录，不等于所有业务动作耗尽。

离线复现：同一生产Validator的readiness为`eligible:true`，Google状态EXHAUSTED且候选有COMPLETED factCheck；Coordinator返回`NO_PROGRESS / steps:0`，模型调用0次。已有网站入口、显式刷新集合也可能被同一条件拦截。

修复验收：从适用的完成状态与剩余可执行动作判断是否无进展；有合格结果时允许Agent展示，待刷新可执行时允许读，真正没有结果且没有合法动作才准确结束。不要硬编码“Google耗尽后自动展示”或新来源fallback。

## F2 — P1：事实刷新后旧正向结论仍可重新展示

位置：`src/domains/restaurant/task-definition.ts:331`、`:381`；`src/domains/restaurant/action-validator.ts:63`；`src/application/restaurant-execution-router.ts:309`。

刷新只清理pending target，所有旧facts仍由mergeEvidence保留。Validator在整个历史集合中寻找任意`openingHoursMatch:true`；没有按本次check引用选择当前有效证据。Router展示时又引用候选全部历史记录。相反，旧负向冲突会永久阻止以后有效的正向更新。

离线复现：真实Reducer执行“曾可展示 → 请求事实刷新 → 新读UNKNOWN/新读Monday: Closed”；两种情况下PRESENT_RESULTS均仍为ALLOWED。

修复验收：区分历史保存与当前适用证据；刷新产物与请求/候选关联，UNKNOWN不能冒充重新确认，新的明确冲突不能被旧成功盖过。若保留旧结果供用户参考，必须按明确产品语义区分，不能作为已刷新成功。多候选、部分完成、冲突后恢复都走同一规则。不能删除所有历史来掩盖关联缺口。

## F3 — P1：地理与门店身份关联被宽松替代规则误判

位置：`src/integrations/google/google-places-restaurant-search.ts:145`；`src/integrations/restaurant-facts/google-listed-website-facts.ts:24`。

- 地点无精确匹配时直接用`places[0]`，没有证明其对应用户命名地点。离线输入请求Higashi-Ginza Station、来源首项Osaka Station，最终大阪候选仍获`areaMatch:true / NAMED_PLACE_RADIUS`。
- 地址仅要求名称相同、数字序列相同，忽略文字地域冲突。离线候选`Cafe A, 1 Ginza, Tokyo`与JSON-LD `Cafe A, 1 Namba, Osaka`仍获HIGH/COMPLETED。

修复验收：搜索相关性不等于地点确认；名称翻译/格式差异可以被适用证据解释，但来源明显不符必须拒绝。门牌数字不独自替代完整地域身份。覆盖真实等价表示与明确不同城市/分店两种情况，不恢复纯全字符串相等，也不加东银座别名。ADR-0021明确允许同序数字，修正这一接受规则需新增替代决策并保留原ADR历史。

## F4 — P1：模型事实产物、Validator和Evaluator的证据形状不一致

位置：`src/integrations/restaurant-facts/model-fact-judgment.ts:89`；`src/eval/restaurant/agent-loop/diagnostic-evaluator.ts:156`、`:223`、`:234`、`:295`。

已增加真实负向满足产物，但它是派生判断：使用第一条支持证据的provider，没有sourceEntityId，支持IDs放在claims。Evaluator却要求每条RESTAURANT_FACT直接与同provider/sourceEntityId的identity对应，不沿支持链验证。

离线结果：

1. 将真实`ModelRestaurantFactJudgment`产物放入完整来源关联的合成artifact，Evaluator因派生记录没有identity source关联判NOT_SATISFIED。
2. 对现有合成来源fact只写`verifiedNegativeCriteria`并引用不存在的supportingEvidenceId，Evaluator反而判YES/SUPPORTED_BY_EVIDENCE。
3. 推荐请求原有日期时间，最终intentDraft删除这两项；保持其余来源记录时AUTHORITATIVE_CONDITIONS仍SATISFIED、结果YES。
4. 重复执行填任意非空`recheckReason=NOT_A_REAL_REASON`，INVESTIGATION_BEHAVIOR仍SATISFIED。没有核对实际触发，也未评价重复事实调查。

修复验收：定义本轮所需的最小来源观察/派生判断契约；支持链要验证存在、候选、来源、适用版本和冲突，不把多来源判断伪装成单个来源原文。保留逐条件判断与支持的对应关系。用户已给字段不得因Schema允许可选而消失；合法重查需有可核验原因/事件。评分不能靠补一个虚构sourceEntityId或关闭检查来通过。日期、party、地域、反例和缺记录应分别处理。评分语义变化需更新Evaluator/Rubric版本；当前代码改变评分但仍用@5，不利于追溯。

## F5 — P1：Web与Hybrid实际能力分叉

位置：`src/server/local-web-server.ts:345`；`src/eval/restaurant/agent-loop/runners/run-hybrid-live-read.ts:219`。

Web注入GoogleThenWebsiteFactRead + Browser model + ModelRestaurantFactJudgment；Hybrid facts参数仍为`search`（Google-only）。H002/H004在Hybrid不能检验新官网和引用判断能力。可读接口同名不证明实际组成相同。

修复验收：现有两个真实使用者复用一个小型Live只读组合，保持模式/预算/来源配置的显式差异；Fixture不偷偷启用Live。增加入口等价的集成覆盖，并让Web执行记录能进入同一诊断入口。无需动态Registry或新框架。

## F6 — P2：浏览器“完成”仍由不相关固定解析决定

位置：`src/integrations/restaurant-facts/google-listed-website-facts.ts:126`、`:197`、`:202`；`google-then-website-facts.ts:39`。

JSON-LD即使只有identity也返回observation，completion立刻为true；`structured ?? visible`让不完整JSON-LD遮蔽同页可见事实。离线复现：JSON-LD只有正确名称地址，可见文本有类型及营业时间，结果COMPLETED但仅有ENTITY_MATCH，浏览器模型调用0次。

可见文本仍靠固定英语/菜系行正则，Browser仅导航不能解释实际事实；goal把全部criteria压成无polarity/strength的字符串，同时填入假partySize=1/unscheduled日期。缺口判断无日期仍要求openingHoursMatch，类型判断放在网站读取之后也会造成可避免的访问。

修复验收：以真实未满足条件决定继续与完成，身份确认不等于事实齐备；结构化字段和实际可见内容互补，模型可对观察提出带引用解释，代码核验来源和接纳条件。保留开放criterion方向/强度，未要求人数日期就不伪造权威值。足够即停，不要求所有页面都经模型，也不把每种页面写成专属fallback。

## F7 — P2：统一预算、取消与诊断仍有遗漏

位置：`src/integrations/restaurant-availability/live-browser-availability.ts:33`；`google-listed-website-facts.ts:181`、`:228`、`:237`；`model-fact-judgment.ts:37`、`:71`；`google-then-website-facts.ts:106`。

Google已有investigationRevision隔离，但availability浏览器预算仍是共享实例成员，在每个loop begin/end清零。官网另建每候选2调用/4操作/12秒预算，不返回模型动作诊断或调用量；复合metadata只汇总类型判断。判断接口没有父AbortSignal；JSON解析失败即使调用已成功也在catch丢弃usage。网站错误统一WEBSITE_FACT_READ_FAILED，无法定位操作/身份/提取/超时阶段；DOM_EXCERPT只存hash且无可取回内容，不能复核身份摘录。Google地点解析也每次搜索重做，消耗同一小额度，未按已有解析复用。

修复验收：同次调查累计、跨任务隔离、刷新/新需求生命周期明确；动作取消传递，已发生调用即使输出无效也记录。补最小来源摘录/结构化观察及稳定引用，记录阶段/失败/耗时和各类模型调用，不落整页敏感内容或隐藏思维。hash可用于完整性，但不能冒称可读取的摘录。先量化再调整预算，不用放大预算代替修正确计数。

## F8 — P2：Web后续体验仍有已声明但未交付范围

位置：`src/application/persistent-restaurant-agent.ts:318`、`:374`、`:402`、`:545`；`src/web/local-workspace-page.ts:87`；`src/domains/restaurant/task-definition.ts:34`。

createCase仍等待整个loop再返回，SSE/定位入口在返回后打开；nearby无坐标无先行收集门槛。FAILED仍不能正常处理语义更新，页面仍允许发送；missingRequiredFields仍无条件用booking字段。没有用户可操作的取消/服务中断执行闭环。最新STATUS已诚实将异步执行/取消/恢复列为后续，不能把它当本轮已完成，也不能把数据库恢复展示称为后台执行可靠。

修复验收：当前先行位置收集、目标适用字段、展示/失败后继续与刷新纳入同Web集成。后台接收/任务状态/取消/服务中断行为做紧接的最小纵向交付，复用已有设施，不开独立基础框架项目。实现前明确中断恢复或准确结束的承诺。

## 已执行验证与范围

- 5个现有文件的定向测试：action-validator、read-grounding、google-listed-website-facts、model-fact-judgment、diagnostic-evaluator，53/53通过。
- 单独离线调用当前生产函数/类得到9个命名反例结果：错误城市身份、仅身份提前结束、刷新UNKNOWN、刷新CLOSED、可展示被耗尽终止、错误命名地点、真实派生判断被Eval拒绝、缺引用被Eval接受、任意重查理由被接受；另验证推荐明确日期/时间被删仍通过。共10项观察。它们是开发诊断，不是新增Golden或真实模型质量结论。
- 未运行全量测试/typecheck/build/真实Chromium或Live：本次产品代码未改，文档按Test矩阵做链接、规程一致性与diff检查。实际检查结果见同日TEST-LOG。

## 收敛顺序

先复现F1–F5涉及的错误成功/错误失败和入口分叉，再修共同契约；F6/F7随同事实调查路径接通。沿同一Web验收当前修改/刷新/必要位置，F8后台生命周期作为紧接的纵向结果。每轮按Test三步验证执行，不以局部53项通过或安全失败代替交付。旧审查是历史诊断，本清单关闭情况应由后续实际验证更新STATUS，不改写本冻结记录。
