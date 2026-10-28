# G4 详情优先级与严格店名片段

Evidence: exposed frozen regression; draft / not integrated. Vienna CET UTC+1.

切片承诺：只用观察到的候选店名、可用地址区/町和可用坐标决定详情读取先后；每来源最多两次检索、五个详情总额不重置，身份接纳函数保持原字节。片段必须是原Google名称的逐字真子串；全名、编造、空片段直接放弃，不追加纠错模型调用。每个生产任务每店仍最多一次片段调用，避免重复花费且保留明确失败结果。检索Prompt3与检索Schema3（仅name字段）独立于B Agent/State。

先合已复核证据main并推送，ls-remote为fae69b48e541bef258b0c463d8d131ea46012b49；从该最新main开codex/fix-phase3b-detail-priority-and-fragments。本轮不宣布G4整体签收，仍等用户确认。

改动前范围：tabelog-browser-availability.ts mergeOutlets约103–105、两处列表合并约411/427行；tabelog-entity-resolver.ts只新增读取优先级辅助函数，inspect/resolve和地址/电话比较原字节不动；named-source-query.ts 5–27与propose的Prompt/Schema约47–58；扩展所属现有测试。不改两站page-parser、日历/查位、B浏览器观察/事实/Agent共享版本。

地址辅助范围补记（修改前）：restaurant-availability/outlet-identity.ts localityFields约120–129行后仅导出其既有区/町值，供排序复用；不改localityFields或compareCompleteOutletAddress的函数体。

红灯：URL驱动六结果Fixture，第六条最接近Google名，旧逻辑先截前五而漏读；全名模型响应Fixture验证真子串提示和一次后放弃。保存本次基准所有查询/详情、模型响应和输入SHA；Gold隔离仅供事后核对。绿灯：生产组合的离线回放、37家已有确定结论保留、前四复跑另列、现有身份反例、五门禁以及额外G2。各次运行前提交并记录冻结SHA。

证据边界：当前37家列表parser产出的真实保存结果没有地址或坐标，排序在这组只使用可观察店名；地址/坐标排序用独立Fixture覆盖。nr010/022/026认证详情与Sen详情没有在本次基准保存，因此只能验证升入前五/片段规则，不能凭空报告完整身份通过；缺页必须显式UNKNOWN，不合成成功页、不访问网站、不改变评分口径。旧nr020邮编冲突继续拒绝。历史12/29、新首屏7/8与此次离线前缀不是同一分母。

额度：真实模型至多10；计划nr020和Sen各3次独立一次调用任务，共6次，无失败重试。目的只验证新片段提议；GET/Google/Live均0，模型凭据仅Node --env-file加载。基础设施失败或S0停下；门禁两次修复仍红停下；完成推工作分支供复核，本改进不合main。

实现与定向验证：原红灯3/3均为目标断言失败（完整log保留）；实现后相关56/56通过。首次定向绿日志中一次把后续同店库存重开算成第六个身份候选，已按distinct outlet的原合同修正断言，身份冲突控制保留；并非放宽详情上限。排序只移动读取次序，所有旧身份函数将由source-span逐字核对。冻结后执行回放和6次片段提议，再在净树上跑五门禁与G2。

## 冻结执行与当前结果

红灯提交f89c2932；实现、输入与编排冻结提交ca15b75f（1125项SHA）。纯离线41份生产前缀回放、独立原评分函数/认证ID核对完成，完整路径无错认。模型实测6次：nr020各轮kazumasa、Sen各轮Sen，独立Python原文/长度核对6/6通过，一致率分别3/3；不重试、不检索，不宣称新查询能找到店。

|对象|保存首屏认证店原位置→新位置|本批可确认的结果|
|---|---|---|
|nr-010|13→1|认证店进入五详情计划；该店详情未保存，身份UNKNOWN|
|nr-022|11→1|认证店进入五详情计划；该店详情未保存，身份UNKNOWN|
|nr-026|10→1|认证店进入五详情计划；该店详情未保存，身份UNKNOWN|
|nr-020|1→1|原保存详情身份仍拒绝；邮编冲突未放宽；新片段kazumasa 3/3，查询效果未评|
|Sen|原名无候选|新片段Sen 3/3；本次G4没有对应查询及详情，身份UNKNOWN|

### 不退化验收的证据缺口

23份既有正确接纳（37主视图19＋前四复跑4）中，23/23认证店仍在新逻辑的五详情计划内，且原身份比较/接纳函数逐字不变。16份完成了当前生产路径回放且仍正确，7份因为重排后需要未保存的其他详情而中断，不能把它们判为完整回归通过。缺证名单：
main-nr-005、main-nr-006、main-nr-017、main-nr-030、main-G4-ND-001、main-G4-ND-007、rerun-nr-003。

41份回放结果为：{"OLD29": {"planned": 29, "verdicts": {"ENVIRONMENT_FAILURE": 16, "NOT_ACCEPTED": 4, "CORRECT_ACCEPTED": 9}, "evidenceStatus": {"RECORDED_ENVIRONMENT_FAILURE": 5, "NOT_EVALUATED_MISSING_SOURCE": 11, "COMPLETE_SAVED_SOURCE_PREFIX": 13}}, "NEW8": {"planned": 8, "verdicts": {"ENVIRONMENT_FAILURE": 3, "CORRECT_ACCEPTED": 4, "NOT_ACCEPTED": 1}, "evidenceStatus": {"NOT_EVALUATED_MISSING_SOURCE": 3, "COMPLETE_SAVED_SOURCE_PREFIX": 5}}, "RERUN4": {"planned": 4, "verdicts": {"CORRECT_ACCEPTED": 3, "ENVIRONMENT_FAILURE": 1}, "evidenceStatus": {"COMPLETE_SAVED_SOURCE_PREFIX": 3, "NOT_EVALUATED_MISSING_SOURCE": 1}}}。ENVIRONMENT_FAILURE在这里是回放状态：其中15份因缺少保存页而未评价、5份保留原网络失败，不能把它们当作新网络实测失败或产品退步率。旧37家与复跑4的真实结论原样保留，未重写旧evaluation。

因此完整的“旧29＋新8不退化”本批仍为NOT_EVALUATED_MISSING_SAVED_DETAILS；这不是已达标。没有用部分排序测试替代真实路径验收，也没有绕过GET0补采页面。当前切片交复核者决定后续如何补足证据，代码不合main。

### 资源与验证模式

模型实测6/10（只测提议）；GET/Google/Live0；共享账本原条目保留，原GET218/257不变。Mock：六结果URL驱动正常/冲突＋地址/距离/缺失项控制通过；Replay：生产Tabelog入口＋本地JS禁用DOM＋冻结旧Prompt2响应，仅证明保存集；新Prompt3质量只用6次实测报告；真实来源或整单Live未运行。身份规则与page-parser/日历/Agent/State原字节保护通过。五门禁与额外G2随后在干净提交运行，各步前后status均须空。
