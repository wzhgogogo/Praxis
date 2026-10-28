# 3b C 批次2：验证结果与停止报告

- Evidence status: exposed development diagnostic / offline implementation candidate，**待复核，未整体通过**。
- 时间：2026-10-27，固定 CET（UTC+01:00）。分支 `codex/fix-phase3b-identity-and-named-target`，不合 main。
- 基线：main `daba2ef0`，整合提交 `5208d401`；真实输入/Runner冻结 `a31ad5f1`，物化查询冻结 `10445675`。
- 本批实际额度：**真实模型40/100，Google11/35，评测公开GET18/35，Live0，环境重跑0**。GET第18次网络超时停批，没有重试或使用剩余额度补跑。

## 主要结论

1. Prompt26具名店专项24/24通过，开发集SR03也保留Sushi Dai；不用增加代码层保名兜底。
2. 新8家完整配对首屏检索：原Google全名 **3/8** 出现认证店，预先分配的一种替代 **7/8**；Sen两种查询都未在本次首屏出现。Dengana单列历史锚点：原名未命中，`Dengana`片段在第5项出现13108466。其余7家原名3/7、替代6/7。这里没有确认身份接纳、营业状态或实时查位。
3. 详情采集候选已实现：同一店联系区原号码及角色、完整地址和来源分段引用；旧nr-002从未接纳变为正确接纳。没有改身份门槛或共享State/Schema。
4. **必须复核的质量变化：** 旧29份同一保存输入接纳12→9：nr-002增加1，另4家因完整地址触发现有比较器冲突而不再接纳。错认其他店0，nr-029差一位仍拒。修这4项会涉及共享地址比较口径，本批保留UNKNOWN，不以退回粗地址掩盖冲突。

## 授权、Gold与凭据

用户转达Claude逐家认证8家，备用全部转正、全部正样本，见 [gold.certified.json](gold.certified.json)。认证者使用自己的网页查询，记本批GET **0**。这是用户转达的独立认证；没有提供原始响应，所以rawResponseSha256留空，不伪造证据或重新GET认证。Waragamo页面更新时间2023-05-13只作原记录，不声称营业状态已确认。

Gold ID/来源店名和Google检索输入分离：模型只见原Google名称/地址，Google日文请求只用原Place ID；rst_id只由事后评分程序读取，独立核对证明没有进入Prompt或查询。见 [subjects.json](subjects.json)、[search-freeze.json](search-freeze.json)、[review-findings.json](review-findings.json)。所有材料已暴露，不能叫Clean Holdout。

沿用已批准的本批凭据范围，仅受控Node进程以`--env-file`加载绝对路径；未独立读、打印、复制或暂存`.env`。只记录“已加载/未加载”，原始请求/响应写入前检查自有密钥不被记录。语义、片段和Google读取均逐次在[共享账本](../budget.json)追加id；整合main时已按id保留双方9个原条目，此后不覆盖他人记录。3a/3a′账本无变化。

## 真实模型：具名目标与开发回归

冻结参考时间为2026-08-05T09:00:00+09:00，模型配置`deepseek-v4-flash`，每个逻辑轮仅一次服务尝试，无schema重试；Provider原始模型标识/usage另保存在收据。Semantic Prompt26、Proposal4、Gold5、sidecar3、State23、TaskDefinition21均未改。24具名逻辑轮＋15开发逻辑轮，共39调用；另1次独立片段提议，合计40。

| 专项 | 重复 | 目标query/scope/goal |
| --- | ---: | --- |
| SR03先点名，再补时间、人数、地区并转查位 | 3×2轮 | 6/6 |
| 当前消息明确换为Sushi A | 3×2轮 | 6/6 |
| 当前消息撤销点名，改查Ginza其他店 | 3×2轮 | 6/6 |
| 已有查位目标后补人数/时间 | 3×2轮 | 6/6 |

开发15轮：目标规则 **15/15**；已标注请求值投影 **14/15**；原严格Scorer4 **0/15**。不得把目标或投影分数冒充严格通过。SR05仍把`smoking / NEGATIVE / HARD`改成`no smoking / NEGATIVE / HARD`，是双重否定问题；Gold和Prompt不迁就它。严格差异还包括Proposal相对/绝对表示、来源字段和Draft派生元数据，以及旧Gold未列的SPECIFIC_OUTLET；完整字段差异和原提议/编译/状态均保留，未自动宣布这些都可豁免。

外层首次打分漏把SR01-T02、SR08-T02、SR09-T02的`contextCarry=true`转换为`CONTEXT_CARRY`，产生3个假目标失败。核对原提议后承认并修正：**原始执行JSON不改**，只用现有annotation loader对相同模型记录离线补评，0新增调用。见 [semantic/execution.json](semantic/execution.json)、[semantic/posthoc-evaluation.json](semantic/posthoc-evaluation.json)。这不是Prompt修改或真实重跑，也不足以证明Prompt26不存在其他退化。

## 检索：新8家完整配对，旧15例因超时未完成

每店只用已冻结的一种替代，未按命中结果换词/换样本。日文直接取同一Google Place ID返回的displayName，不用模型翻译；片段逐字来自原Google字段。Google客户的产品接口没有改，语言参数仅在评测侧请求中附加；响应ID逐一与原ID核对。原始Google、模型片段和验证在`retrieval-inputs/`。

| 新主样本 | 原名首屏 | 一种替代首屏 | 替代来源 |
| --- | --- | --- | --- |
| Dengana Akabane（历史锚点） | 未出现 | 出现，第5项 | 原名片段Dengana |
| Ushigoro Bambina Carbone Nakameguro | 未出现 | 出现 | Google日文名 |
| 和泉鮨南口店 | 出现 | 出现 | 原名片段和泉鮨 |
| Waragamo | 出现 | 出现 | Google日文名 |
| Sen Kagurazaka | 未出现 | 未出现 | 原名片段Sen；全部仍按正样本计 |
| 吉祥じ 和こん | 出现 | 出现 | 原名片段吉祥じ |
| Washokubiyori Osaketo Kagrazaka | 未出现 | 出现 | Google日文名 |
| Godaime Hanayama Udon Ginza | 未出现 | 出现 | Google日文名 |

独立评分要求：请求词在可见正文中，认证ID同时出现在站点ItemList和有店名文字的h2/h3链接中；不依赖私有class/testid、不只在脚本里找ID。显式“No restaurants match”＋空ItemList可证明本页无结果。初版评价把缺少itemListElement的空结果保守标UNKNOWN，原[evaluation@1](search/evaluation.json)保留；[evaluation@2 sidecar](search/evaluation.v2.json)按明确的空结果原文补评，命中条件不变。评价迭代均是暴露数据上的开发诊断，不作为预注册Clean门槛。原始HTTP字节、headers、URL、时间、SHA在`search/`；取证是fetch返回的HTTP正文，不声称线缆压缩字节SHA。

旧15例只完成：nr-001的`Sushi Tatsu`首屏命中；nr-003的Google日文词GET约20秒超时；另外9条有效查询未到达，4条在运行前被offset条件跳过。**不报告旧15整体提升率**。4条（nr-007/018/022/026）的片段本身都确实在原文中，失败的是模型给出的UTF-16位置。本轮外层额外要求位置也精确，比用户仅要求“来自原文”更严；不把它称为模型编造。原运行保持不变，下批可让代码自行定位原文片段，不需为数位置增加模型调用。详见review-findings的offsetRejections。

GET第18次因TimeoutError停止：18次尝试里17次200、1次无完整响应；未重试、未跟随重定向、未带Cookie、未加载子资源，每次结束至下次开始至少30秒。完整Live0。源站访问失败保留为环境限制，不改变产品目标或扩大网络许可。

## Dengana公开GET评估

生产已有`source-packs.ts`名称URL构造与Tabelog Adapter的“先GET/读取，候选为空再观察UI”路径。本批没有新增同样的加速器或改Guard/robots；沿用已审核的`/en/tokyo/rstLst/?sw=…`。本次原全名返回明确空，短片段一次GET就包含正确店，说明**词语选择**有收益；不能把原来已有GET入口算成本批新实现。各GET耗时与来源证据见收据，不能直接拿不同时间的F5点击耗时当作配对延迟提升。生产还没有接入本批离线选择的词或Google日文名，需后续按收益决定接线；本批不抢占共享检索Prompt/Schema版本。

## 详情身份采集、红绿与29份保存页

修改前函数/行范围已先提交在 [identity-implementation-plan.md](identity-implementation-plan.md)。仅改两站详情parser及C身份resolver；新增共用小helper供两站实际使用，不改Browser层、日历/列表、两站contracts.ts、`outlet-identity.ts`、State或Prompt。没有店名词表或050→03全局对应。

联系区按可见Restaurant information/店舗情報标题、Name/Address/Phone标签归属，排除aside/footer/nav及地图操作文案；完整地址保留楼层/建筑。同页公开JSON-LD邮编可与日文地址组合，`addressQuote`与`postalQuote`分别留原文，组合字符串不冒充单条逐字引文。预约/店铺号码保留原文、角色、标签和读取URL。resolver只增加**同一店/本次读取里另一号码的精确相等证据**；既有强名字＋完整地址门槛和门牌/楼层冲突拒绝不变。临时detailIdentity不进入标准resolved outlet，Domain既有白名单也不把它写进State。

未修代码提交`3b789869`得到两站LOW≠HIGH的有效AssertionError红灯；初次实现的Set.filter启动错误和测试类型错误另留日志，不当作有效红灯。修复后定向6/6、原相关107/107通过。源码包含私有标记改名后仍取值、错店号码/跨来源借号/差一位/门牌/楼层冲突及结构歧义控制。结构矛盾显式抛出含`SOURCE_IDENTITY_STRUCTURE_CHANGED`的EXTRACTION_FAILED，沿既有失败链返回未知；不新增共享错误合同。

对与上批完全相同的29份保存输入复算：**9正确 / 20未接纳 / 0错认**，nr-002新增正确、nr-029仍未接纳。原输入与上批预冻结SHA逐项一致；只用原来实际到达的候选/详情，不把认证专用页面或未访问目标注入结果。原12/29只是故意隐藏Google来源直链的后备路径基准，不是这些店生产DIRECT_SOURCE_PAGE的成功率。

| 新增不接纳 | 原始差异与现有比较器表现 | 本批处理 |
| --- | --- | --- |
| nr-004 | Google地址重复门牌数字；完整源地址含1F/2F | 原精确电话保留，地址比较CONFLICT，未知 |
| nr-016 | 源建筑名“第85東京ビル”中的85进入数字比较，Google写Kichijoji Ex | 不猜建筑别名，不放宽，未知 |
| nr-020 | Google邮编150-0043，源邮编150-0002 | 保留真实矛盾，不覆盖，未知 |
| nr-024 | Google地下层B1，源B1F，当前单位解析不同 | 不在C越界修改共享比较器，未知 |

原observer@2沿用旧缺字段归因优先级，可能把这些不接纳写成FIELDS_MISSING；[review-findings.json](review-findings.json)独立逐候选引用当前地址/电话comparison，明确是完整字段的冲突而非电话未采集。没有用上级原因码自证归因。新增helper及现有文件的物理增量单列在最终验证材料，不声称G3≤3591目标已达成。

## 五门禁、评价边界与下一停止点

受测提交`3ec77f67ada1bcfe6f295284e98fa74d2101d1a0`冻结986项SHA。typecheck、arch:check、npm test **1117/1117**、build通过；test:browser:fixture **167/168，FAIL**，唯一失败是G2冻结原页`identity:address`与完整地址不同。全部已执行步骤前后git status为空，最终SHA仍一致。单列test:dom-change未在失败序列后继续重复；同一保存页test已在browser门禁中失败。原始[gates.json](gates.json)和[gates-review.json](gates-review.json)分开保留，不将四项通过写成五门禁绿。

四层：本批不运行端到端查位/交付，结果NOT_EVALUATED；语义目标/具名和首屏检索各自单列，身份采集保存页回归与新样本来源检索不能混为整体成功；没有真实用户交付，不宣称来源/交付S0–S4总体通过。保存页身份wrongAccepted=0只证明这29份；授权边界/State不含依据等由对应控制验证。归因同时保留网络超时、外层打分/offset限制、模型双重否定和共享比较器限制。

本批停等复核：确认具名修复真实遵循证据；逐项处理4个地址比较不接纳；决定下一有界批次是否补旧15检索和简化offset验证。**不合main，不继续真实调用，不改Gold或身份标准。**


## 最终停止原因：G2原页基线需A/复核者确认

这是实质性的冻结基线冲突，不是可豁免的偶发环境失败。`src/harness/browser/dom-change.test.ts:22`明确要求原页解释变化先review；本轮完整地址采集使：

| G2页 | 冻结原值 | 当前原页和改名页值 |
| --- | --- | --- |
| tabelog-detail-01 | 1710021 Tokyo Nishiikebukuro Toshima Tokyo | 1710021 東京都豊島区西池袋5-8-9 |
| tabelog-detail-02 | 1730014 Tokyo Oyamahigashicho Itabashi Tokyo | 1730014 東京都板橋区大山東町60-15 クルーズ大山 |

只读重取当前12份原页/改名页观察为8 PASS、4 DEGRADED_HONEST、sourceTransportCalls0，说明本轮所观察的标记改名对照没有新增事实冲突；**它不替代失败的冻结基线门禁，也不证明G3全部PASS**。完整提案在[g2-reference-change-proposal.json](g2-reference-change-proposal.json)，原始观察在[g2-current-observations/observations.json](g2-current-observations/observations.json)。

用户文件归属规则将G2源码/fixture归A，且要求“需要改动对方的文件…先停下报告，由复核者安排顺序”。因此C未修改baseline.json、G2测试或评分器，也未回退完整地址来隐藏差异。复核者需安排A核对同店原文并确认/冻结新reference，再由C重跑门禁。本分支继续停等复核；五门禁尚未全绿，不能合main。后续真实调用仍停止。
