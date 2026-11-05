# 观察驱动与值来源：名称切片完成，安全设计待决定

2026-11-05 CET（UTC+1），基线ebfc619c。**partial / not integrated**，不是最终合入候选。

用户已批准六对象版本方案（Prompt20→21、Action12→13、Context3→4、Recording5→6、Evaluator36→37、Rubric31→32）及两类具名店输入范围；本轮尚未修改这些版本常量或通用Guard合同。State25/TaskDefinition23、语义和Agent版本保持。

## 已实施的独立切片

删除named-outlet-resolution.ts中的kushi katsu/kushikatsu/sushi/ten/honten/串カツ/寿司/本店/店词表。多余词只以同候选、同来源店号/URL、有HIGH身份绑定的NAME/CATEGORY/GOOGLE_TYPE原文或观察到的来源名称支持；模型判断、评论、其他来源/其他店号、无HIGH记录不提供这类支持。地名仍需地址及原地区数据支持；未增加别名、翻译或相似度接纳。已有多候选精确名称规则和前三家范围不变。

红灯：probe-current.ts在基线得到“没有任何来源额外词，却因固定词表返回true”，见current-red-evidence.json。另四个反例只变实际D4搜索的值、不变十字段，旧Guard都到达本地假传输；按新合同应拒绝。没有向真实网站发送这些虚构个人值。

绿灯：名称组件10/10；D3原语义+本地固定来源组装8/8，完整来源名正例保持，未引用后缀的旧containment-only例现为NEEDS_INPUT且无B1。该例同步是用户新语义要求，不是把真实来源回放改成成功。TableCheck例首次受普通沙箱Chromium启动限制而FAILED；同一输入/断言在本地HAR受控启动后通过，原日志保留。最终typecheck通过。新的组件夹具曾缺必填字段，已补齐契约，没有使用unknown强制转换或改产品版本规避类型检查。

上述组装是LOCAL_CONSTRUCTION来源，不是D3/D5真实页面回放通过；D3/D5/D4/D8所要求的最终真实回放、全套门禁、严格G2、G6均尚未运行。既有真实录制未修改，没有读Holdout或.env，模型/网站/Google/Live调用均0，预算不变。

## 审查发现与待决定项

详见plan-and-version-review.md。清单以外还包括复用搜索的填词/Search固定捷径、boundInputField标签词表、near等剥词、上轮单路径预筛选特判、精确联想录制白名单、私有testid/class选中值解释。这些均列入拆除，不把旧代码改名后保留。

两个问题已向用户提出，答案到达前不实施依赖它们的许可或启动路径：

1. 空白浏览器的两个公开起点是否作为唯一初始导航例外（Tabelog /en/、TableCheck /en/japan/search）。后续无地区/店号网址模板、固定填写和点击序列。
2. 通用人名/敏感性判定采用哪种依据。来源(a)不能证明默认串非个人；已有系统无通用人名识别器。sensitivity-design-review.md给出先确定识别机制与模型语义标签两条路线及局限，未添加词表、库、模型或放行未知值。

Guard的十字段分支仍是旧实现，**不能宣称通用值来源规则已经实现**；此分支未合main、没有真实执行。删除固定地点序列、isRegionEntrance导航分类和通用Guard的工作要在上述前提明确后接续；六版本升级已经获批，不重复询问。

当前只记录本停止点事实，不更新STATUS/DEVLOG/TEST-LOG（按工作规则留到main合入时）。未合main、未运行Live，不通知A/B接力。
