# G4 基线复算与Dengana原因分析

Status: frozen regression / exposed development retrospective；离线保存页复算，无新增真实调用。

## 29家逐项复算

历史执行12 CORRECT、15 NOT_FOUND、2 UNCERTAIN、0错认；当前parser/resolver仅对原执行实际观察到的候选/详情复算，仍为12 CORRECT、17 NOT_ACCEPTED、0错认。**这不是当前Agent整链重跑**：当前模型搜索策略、未保存的替代检索与当前网络行为均未评价。认证页没有被喂进原搜索命中分子，Gold ID仅用于事后独立比对。

| 分布 | 失败样本数 | 说明 |
| --- | ---: | --- |
| 检索词 | 因果未定 | 29家均有原全名查询；14家明确空，不能用全名与空响应的相关性证明删词有效 |
| 检索结果为空 | 14 | 原检索页明确写无结果；后续进入通用页后看到别店不等于找到请求的店 |
| 候选太多 | 1观察到，0证实为截断原因 | nr-019有20个结果，保存结果中仍无Gold；不能声称增加详情上限即可找到 |
| 身份字段缺失/遗漏 | 1 | nr-002正确详情已到；主联系区050未被当前JSON-LD优先提取使用 |
| 身份字段冲突 | 1 | nr-029：号码差一位，粗地址不足，英日名称也不直接匹配；完整地址另有人工认证 |
| 超时 | 0 | 此29家保存基准均完成；F5时限问题单列下表 |
| 未决检索失败 | 1 | nr-019，不强行归因给模型词或候选上限 |

互斥失败阶段14+1+1+1=17；“检索词”和“候选太多”是交叉观察维度，不重复计入失败总数。

| ID | Google名称 | 历史结论 | 当前保存页复算 | 失败阶段 | 正确详情已读 |
| --- | --- | --- | --- | --- | --- |
| nr-001 | Sushi Tatsu Shibuya | NOT_FOUND | NOT_ACCEPTED | 搜索明确为空 | 否 |
| nr-002 | 焼肉おおにし 祐天寺店 | UNCERTAIN | NOT_ACCEPTED | 身份字段遗漏/不足 | 是 |
| nr-003 | Washoku Dining Hana Kagura | NOT_FOUND | NOT_ACCEPTED | 搜索明确为空 | 否 |
| nr-004 | 鮨処 みこし | CORRECT | CORRECT | 通过 | 是 |
| nr-005 | Ginhachi | CORRECT | CORRECT | 通过 | 是 |
| nr-006 | Sugata | CORRECT | CORRECT | 通过 | 是 |
| nr-007 | Wagyu beef Yakiniku Beef Kitchen Nakameguro | NOT_FOUND | NOT_ACCEPTED | 搜索明确为空 | 否 |
| nr-008 | Shibuya Kappo Sancho | NOT_FOUND | NOT_ACCEPTED | 搜索明确为空 | 否 |
| nr-009 | Naminoue shibuya | NOT_FOUND | NOT_ACCEPTED | 搜索明确为空 | 否 |
| nr-010 | Yakitori & Obanzai SAKAMOTO | NOT_FOUND | NOT_ACCEPTED | 搜索明确为空 | 否 |
| nr-011 | 日本料理 ほそ川 神楽坂 | NOT_FOUND | NOT_ACCEPTED | 搜索明确为空 | 否 |
| nr-012 | Sushi Rizaki | CORRECT | CORRECT | 通过 | 是 |
| nr-013 | Horumon Matsuda HANARE Yakiniku Nakameguro | NOT_FOUND | NOT_ACCEPTED | 搜索明确为空 | 否 |
| nr-014 | 炭火焼肉ホルモンまんてん高架下 | CORRECT | CORRECT | 通过 | 是 |
| nr-015 | Sushi Yamashiro Kichijoji | NOT_FOUND | NOT_ACCEPTED | 搜索明确为空 | 否 |
| nr-016 | 焼き鳥と蕎麦 灯 | CORRECT | CORRECT | 通过 | 是 |
| nr-017 | Sushi Matsumoto Shibuya | NOT_FOUND | NOT_ACCEPTED | 搜索明确为空 | 否 |
| nr-018 | Yakiniku Ushicoco Nakameguro | NOT_FOUND | NOT_ACCEPTED | 搜索明确为空 | 否 |
| nr-019 | T nakameguro | NOT_FOUND | NOT_ACCEPTED | 检索未到目标，根因未定 | 否 |
| nr-020 | Sushi kazumasa | CORRECT | CORRECT | 通过 | 是 |
| nr-021 | 焼肉 牛目黒 | CORRECT | CORRECT | 通过 | 是 |
| nr-022 | Sushi and Tempura Iwai Kichijoji | NOT_FOUND | NOT_ACCEPTED | 搜索明确为空 | 否 |
| nr-024 | Nakameguro Yakiniku Togyumon | CORRECT | CORRECT | 通过 | 是 |
| nr-025 | Sumi Sushi Shibuya | NOT_FOUND | NOT_ACCEPTED | 搜索明确为空 | 否 |
| nr-026 | Kushiyaki Bistro Fukumimi Ginza 6 | NOT_FOUND | NOT_ACCEPTED | 搜索明确为空 | 否 |
| nr-027 | Shibuya Sushi Jinnan | CORRECT | CORRECT | 通过 | 是 |
| nr-028 | Ginza Bokujin | CORRECT | CORRECT | 通过 | 是 |
| nr-029 | 焼肉 うし幸 | UNCERTAIN | NOT_ACCEPTED | 已提取字段冲突 | 是 |
| nr-030 | Sushi Nasu | CORRECT | CORRECT | 通过 | 是 |

原文、每次提取/比较、缺少的snapshot和独立Gold认证引用均在 [recomputed.json](recomputed.json)。零错认在本子集有独立URL-ID核对；不把旧网络链缺证补写为来源S0已评。

## Dengana：八份原Live逐一纳入，六份适用

F5原槽1–3与重跑槽1–3为Akabane/Dengana；原槽4–5是另一个请求，无该候选，标不适用。六次Google都发现Dengana Akabane，地址/坐标对应用户给出的13108466见证；**没有一次取得该见证门店的Tabelog HIGH身份**。下面是旧原始时间，不是新增Live。所有时间使用记录时间换算，阶段按事件边界分配，不把模型与操作时间重复相加；含关闭/清理的删失尾段不冒充已完成调用耗时。

| 运行 | 整单ms | Dengana首次trace前已耗ms | TableCheck发现ms | Tabelog发现ms | Tabelog身份ms | 结果 |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 原1 | 500042 | 269854 | 4195 | 45008 | 0 | 搜索模型操作/点击遮挡恢复，最后MODEL_DECISION达到provider截止；未到身份 |
| 原2 | 500022 | 287658 | 7104 | 20811 | 16290 | 检索漂移至通用推荐列表，五个非Dengana门店被身份核对正确拒绝；ENTITY_MATCH_UNCERTAIN |
| 原3 | 399405 | 222007 | 3979 | 45003 | 0 | 搜索中点击遮挡与公开查询提交未完成，SUBMIT_PUBLIC_QUERY达到provider截止；未到身份 |
| 原4 | 439161 | — | — | — | — | 其他请求，不适用 |
| 原5 | 500018 | — | — | — | — | 其他请求，不适用 |
| 重跑1 | 500023 | 467071 | 11882 | 21054 | 0 | Dengana读取在整单末段开始；Tabelog导航17.612秒，随后模型TIMEOUT；外层截断，最终providerAttempt未持久化 |
| 重跑2 | 500025 | 315703 | 17686 | 34792 | 7520 | 搜索后进入身份阶段，详情NAVIGATE达到candidate截止；不是已读到Dengana后电话不匹配 |
| 重跑3 | 500013 | 310795 | 4561 | 20004 | 0 | 初始搜索导航20.003秒达到有界导航超时；未取得可用搜索页/身份 |

### 六次具体操作与证据

- **原1：** 搜索模型操作/点击遮挡恢复，最后MODEL_DECISION达到provider截止；未到身份。NAVIGATE 1次/8169ms（失败0）；SNAPSHOT 7次/424ms（失败0）；OBSERVE_CONTROLS 7次/1903ms（失败0）；CLICK 5次/10975ms（失败2）；WAIT_FOR_SETTLED 3次/1864ms（失败0）；DISMISS_TRANSIENT_OBSTRUCTION 2次/27ms（失败0）。已记录模型决策6次，合计21315ms；原始错误与每步时间见dengana.json。
- **原2：** 检索漂移至通用推荐列表，五个非Dengana门店被身份核对正确拒绝；ENTITY_MATCH_UNCERTAIN。NAVIGATE 4次/17306ms（失败0）；SNAPSHOT 7次/489ms（失败0）；OBSERVE_CONTROLS 4次/1438ms（失败0）；CLICK 1次/50ms（失败0）；WAIT_FOR_SETTLED 2次/2258ms（失败0）；OPEN_LINK 1次/6048ms（失败0）。已记录模型决策3次，合计7035ms；原始错误与每步时间见dengana.json。
- **原3：** 搜索中点击遮挡与公开查询提交未完成，SUBMIT_PUBLIC_QUERY达到provider截止；未到身份。NAVIGATE 1次/1886ms（失败0）；SNAPSHOT 7次/392ms（失败0）；OBSERVE_CONTROLS 7次/1898ms（失败0）；CLICK 5次/10978ms（失败2）；WAIT_FOR_SETTLED 3次/1716ms（失败0）；DISMISS_TRANSIENT_OBSTRUCTION 2次/30ms（失败0）；SUBMIT_PUBLIC_QUERY 1次/6999ms（失败1）。已记录模型决策6次，合计20776ms；原始错误与每步时间见dengana.json。
- **重跑1：** Dengana读取在整单末段开始；Tabelog导航17.612秒，随后模型TIMEOUT；外层截断，最终providerAttempt未持久化。NAVIGATE 1次/17612ms（失败0）；SNAPSHOT 2次/133ms（失败0）；OBSERVE_CONTROLS 1次/239ms（失败0）。已记录模型决策1次，合计2744ms；原始错误与每步时间见dengana.json。
- **重跑2：** 搜索后进入身份阶段，详情NAVIGATE达到candidate截止；不是已读到Dengana后电话不匹配。NAVIGATE 3次/16253ms（失败1）；SNAPSHOT 5次/321ms（失败0）；OBSERVE_CONTROLS 4次/1798ms（失败0）；CLICK 1次/41ms（失败0）；WAIT_FOR_SETTLED 2次/2328ms（失败0）；OPEN_LINK 1次/12441ms（失败0）。已记录模型决策3次，合计8093ms；原始错误与每步时间见dengana.json。
- **重跑3：** 初始搜索导航20.003秒达到有界导航超时；未取得可用搜索页/身份。NAVIGATE 1次/20003ms（失败1）。已记录模型决策0次，合计0ms；原始错误与每步时间见dengana.json。

TableCheck六次都没有取得同店身份：有的只读区域推荐列表，有的网络/模型失败，所见其他门店不能作为Dengana身份。Tabelog原槽2的ENTITY_MATCH_UNCERTAIN比较对象是Shiodome/Omotesando等推荐门店，不包含13108466，拒绝是正确的；此时不能通过放宽身份条件来“修好”召回。其余超时分别发生在搜索模型、提交或导航阶段；重跑槽2在身份导航时超时，也不等于正确详情字段不足。

观察器@1曾把没有PROVIDER_STARTED/FINISHED的WEBSITE辅助活动误列为未完成provider；@2改为仅报告其首末活动区间，原v1文件保留。该辅助来源不是额外provider，操作和模型时间也不与阶段总耗时相加。原数据、原运行和所有调用数未改。[dengana.json](dengana.json)保留八份输入SHA、阶段、每步操作、拒绝原因及删失说明。

## 下一步方案与限制

详见 [proposal.md](proposal.md)：片段约束检索、同店号码对应、完整地址/名称证据及坐标辅助逐项列受益对象、误认风险和反例。身份或网络规则未实施或放宽，未编辑B的parser。恢复nr-002/nr-029仅为有原文支持的待验证潜力，不能把12/29写成14/29；替代搜索的实际新增命中未测。未来真实模型、网站和时限验证需另批授权。
