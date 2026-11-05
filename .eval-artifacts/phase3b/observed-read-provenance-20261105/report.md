# 观察驱动与值来源：实施中

2026-11-05 CET（UTC+1），基线ebfc619c。**partial / not integrated**，不是最终合入候选。

用户已批准六对象版本方案（Prompt20→21、Action12→13、Context3→4、Recording5→6、Evaluator36→37、Rubric31→32）及两类具名店输入范围。当前仅Browser Context已升4，新增可见原生form关联；其他已批准版本随完整退役/录制/独立审计完成后升级。State25/TaskDefinition23、语义和Agent版本保持。

## 已实施的独立切片

删除named-outlet-resolution.ts中的kushi katsu/kushikatsu/sushi/ten/honten/串カツ/寿司/本店/店词表。多余词只以同候选、同来源店号/URL、有HIGH身份绑定的NAME/CATEGORY/GOOGLE_TYPE原文或观察到的来源名称支持；模型判断、评论、其他来源/其他店号、无HIGH记录不提供这类支持。地名仍需地址及原地区数据支持；未增加别名、翻译或相似度接纳。已有多候选精确名称规则和前三家范围不变。

红灯：probe-current.ts在基线得到“没有任何来源额外词，却因固定词表返回true”，见current-red-evidence.json。另四个反例只变实际D4搜索的值、不变十字段，旧Guard都到达本地假传输；按新合同应拒绝。没有向真实网站发送这些虚构个人值。

绿灯：名称组件10/10；D3原语义+本地固定来源组装8/8，完整来源名正例保持，未引用后缀的旧containment-only例现为NEEDS_INPUT且无B1。该例同步是用户新语义要求，不是把真实来源回放改成成功。TableCheck例首次受普通沙箱Chromium启动限制而FAILED；同一输入/断言在本地HAR受控启动后通过，原日志保留。最终typecheck通过。新的组件夹具曾缺必填字段，已补齐契约，没有使用unknown强制转换或改产品版本规避类型检查。

上述组装是LOCAL_CONSTRUCTION来源，不是D3/D5真实页面回放通过；D3/D5/D4/D8所要求的最终真实回放、全套门禁、严格G2、G6均尚未运行。既有真实录制未修改，没有读Holdout或.env，模型/网站/Google/Live调用均0，预算不变。

## 审查发现与待决定项

详见plan-and-version-review.md。清单以外还包括复用搜索的填词/Search固定捷径、boundInputField标签词表、near等剥词、上轮单路径预筛选特判、精确联想录制白名单、私有testid/class选中值解释。这些均列入拆除，不把旧代码改名后保留。

两项前提均已获用户明确答复，继续实施：

1. 仅Tabelog https://tabelog.com/en/、TableCheck https://www.tablecheck.com/en/japan/search 作为source-pack配置的会话首次导航，仍经Guard。之后无地区/店号模板、填表或点击序列。
2. 页面本有的值原样交回同源，无需内容识别；代码填入值仅来自获准权威字段，并做现有格式筛查。未知来源拒绝。无需人名识别器；sensitivity-design-review.md旧识别器提案已标superseded，未实施。

## 通用表单实现的当前进展（未集成）

已删除tabelog-public-query.ts的十字段特例及当前独立reviewed-public-reads.json对应条目。旧冻结录制/历史复核原件不改。新运行时从实际原生form、实际文档和FormData取值，CDP原生formSubmissionGet关联请求；网页/模型没有注册许可的接口。代码填入必须有获准字段来源并通过格式筛查；未经授权的fill在页面收到值前拒绝。直接在页面输入但未登记的受信输入事件会使该表单拒绝，即使脚本随后把文本改写。页面自己更新的隐藏值只返回同源，不做内容分类。源/路径禁止、POST及重定向拒绝保持；证明与取回共用原请求时限，不增加窗口，默认传输仍Node。

Browser Context4包含原生form关联和可见行，没有隐藏值。boundInputField不再按地区/搜索/人数标签词表决定语义；只留原生控件类型及敏感输入的安全拒绝。填入值仍由权威goal决定，RETRIEVAL新增code-owned来源，缺失即拒绝；原有G4搜索调用标记其来源。删除selectedDisplay中私有testid/class对选中值的解释，未换另一组私有选择器。

独立评价目前只能将生产form receipt标为EVIDENCE_GAP，绝不拿PAGE/权威来源标签自证通过。**独立外层DOM/实际请求/权威输入关联尚未接通**，因此不能声称新许可已完整验收。Recording6/Evaluator37/Rubric32完整升级仍待该接线，未覆盖旧输出。

相关验证：Guard组件20/20；已有真实Chromium网络边界64/64（两种传输、重定向、iframe、worker、popup、预检、POST、故障关闭）；本机运行时8/8；Browser wire12/12；独立评价与退役规则140/140；typecheck通过。普通沙箱启动Chromium的失败原日志保留，同输入受控本机启动通过；另外两份CDP单元夹具补齐真实getFrameTree结构，没有改业务断言。

新增表单测试初版4/4，但该结论被更严格的终态控制取代：**当前2/4**。两种传输的同源页面默认值/权威AREA正例通过；负例组停在POPUP_UNKNOWN：请求尚可能只完成本地bootstrap，未取得实际目标已拒绝的终态证据。不能因接收器暂未收到就算拒绝成功。现记录为本地验证缺口，不是已证明的外泄，也不是Live S0；下一步需闭合popup/iframe原生提交关联后重跑。当前失败与先前输出分别保留，不能对外报告4/4通过。

## 额外版本停止点

进一步审查发现Agent Prompt@29仍明确支持直达门店页；ADR-0042的P2-2及candidate-read-observations.ts还在直达候选至少三家时屏蔽其他候选。与用户最新“无直达路径、观察循环选择”冲突，不能仅删浏览器代码留下错误指引。具体新增版本方案见additional-version-review.md：Agent Prompt29→30、Agent Context17→18、TaskDefinition23→24，State25不变。用户要求版本变化先报告，已经提交确认问题；这些三项及旧门控尚未改。固定地点序列、isRegionEntrance及其他动作退役尚未完成，不把局部测试冒充整条链路通过。

D4/D3/D5/D8新合同真实回放、全套门禁、G2/G6均未运行；未合main，真实外部调用0。

当前只记录本停止点事实，不更新STATUS/DEVLOG/TEST-LOG（按工作规则留到main合入时）。未合main、未运行Live，不通知A/B接力。
