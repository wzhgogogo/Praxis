# G4 详情优先级与严格店名片段

Evidence: exposed frozen regression; draft / not integrated. Vienna CET UTC+1.

切片承诺：只用观察到的候选店名、可用地址区/町和可用坐标决定详情读取先后；每来源最多两次检索、五个详情总额不重置，身份接纳函数保持原字节。片段必须是原Google名称的逐字真子串；全名、编造、空片段直接放弃，不追加纠错模型调用。每个生产任务每店仍最多一次片段调用，避免重复花费且保留明确失败结果。检索Prompt3与检索Schema3（仅name字段）独立于B Agent/State。

先合已复核证据main并推送，ls-remote为fae69b48e541bef258b0c463d8d131ea46012b49；从该最新main开codex/fix-phase3b-detail-priority-and-fragments。本轮不宣布G4整体签收，仍等用户确认。

改动前范围：tabelog-browser-availability.ts mergeOutlets约103–105、两处列表合并约411/427行；tabelog-entity-resolver.ts只新增读取优先级辅助函数，inspect/resolve和地址/电话比较原字节不动；named-source-query.ts 5–27与propose的Prompt/Schema约47–58；扩展所属现有测试。不改两站page-parser、日历/查位、B浏览器观察/事实/Agent共享版本。

红灯：URL驱动六结果Fixture，第六条最接近Google名，旧逻辑先截前五而漏读；全名模型响应Fixture验证真子串提示和一次后放弃。保存本次基准所有查询/详情、模型响应和输入SHA；Gold隔离仅供事后核对。绿灯：生产组合的离线回放、37家已有确定结论保留、前四复跑另列、现有身份反例、五门禁以及额外G2。各次运行前提交并记录冻结SHA。

证据边界：当前37家列表parser产出的真实保存结果没有地址或坐标，排序在这组只使用可观察店名；地址/坐标排序用独立Fixture覆盖。nr010/022/026认证详情与Sen详情没有在本次基准保存，因此只能验证升入前五/片段规则，不能凭空报告完整身份通过；缺页必须显式UNKNOWN，不合成成功页、不访问网站、不改变评分口径。旧nr020邮编冲突继续拒绝。历史12/29、新首屏7/8与此次离线前缀不是同一分母。

额度：真实模型至多10；计划nr020和Sen各3次独立一次调用任务，共6次，无失败重试。目的只验证新片段提议；GET/Google/Live均0，模型凭据仅Node --env-file加载。基础设施失败或S0停下；门禁两次修复仍红停下；完成推工作分支供复核，本改进不合main。
