# TableCheck destination 合同与收尾停止报告

Status: **draft / not integrated；绑定未完成，停止新增外部读取**。时间一律CET（UTC+1）。基线b5de6678，最终验证源码664f8ad2。未合main、未执行D8或held-out。

结论：用户批准的destination格式已实现并在真实请求中放行；同页catalog、q、name均200，真实目标全名联想存在。首轮诊断脚本误把分店和父容器计入候选，已用真实组件反例修好。用户另批1次入口重跑后，遇到既有20秒入口导航超时，未到选店。因此**没有获得选店后的真实路由，动态/联想交接绑定尚未实现**。没有把组件选择绿灯冒充绑定、身份或D8成功。

## 1. 获批合同：先红后绿

仅destination字段分配新类别NAMESPACED_TOKEN：ASCII字母/数字段、单个冒号分隔，新增类别长度≤32，使用用户给定正则。敏感格式检查优先，其后是规范化权威相等、权威前缀；这些类别均不会被新格式覆盖。既有SHORT_TOKEN/NUMERIC定义及其他字段不变。

仅`destination,hits,name,queryProfile`这一精确形状的destination增加NAMESPACED_TOKEN；name仍只接受EQUALS_AUTHORITATIVE_INPUT。其他三形状、字段规则、方法/源站/路径/请求头、预检与CDP准入边界不变。新类别不分配给country/kind/hits/q/name/queryProfile。

有效红灯：[guard-red.log](guard-red.log)中命名空间阳性被旧规则拒绝；绿灯：[pre-read-unit.log](pre-read-unit.log)。覆盖32字符边界及超过32的命名空间、空白/其他标点、连续/首尾冒号、非ASCII、电话/邮箱/token、权威相等/前缀，以及借给其他受限字段的拒绝。真实本地Chromium预检也使用同一新destination值，原四形状、旧读取和CORS失败断言保留。[独立字面审核合同](reviewed-read-rules.json)没有从生产策略生成。

## 2. 第一次真实读取93965f14：合同通过，脚本误停

同原D8的`run-c-closeout-live.ts TC_SEARCH` → browser() → 默认NODE_FETCH → discoveryPackNetworkPolicy，使用已冻结全名，未修改代理、证书、UA/locale/时区、网络重试或时限。先记账再导航。

**2026-11-07 13:11:16.902 CET**回执：catalog GET200；q/name预检和GET放行，两份文字GET均200；destination=NAMESPACED_TOKEN，q/name=EQUALS_AUTHORITATIVE_INPUT；CORS错误0。同页总计catalog200×1、search200×8；这不是9次页面额度，网站脚本自身的已审核请求属于同一页。

真实观察到三个按钮和一个父REGION：

| 可见控件 | 类型 | 与用户全名关系 |
| --- | --- | --- |
| Specializing in Nodoguro Ginza Nakamata | BUTTON，role=option | 精确相等，唯一 |
| Specializing in Nodoguro Ginza Nakamata Kiwami | BUTTON | 多了分店后缀 |
| Specializing in Nodoguro Ginza Nakamata Hanare | BUTTON | 多了分店后缀 |
| 包含整个联想菜单的listbox | REGION | 父容器文字包含全名 |

这是我的诊断脚本判断错误：当时使用substring而非精确可操作匹配，返回STOP_NO_UNIQUE_SUGGESTION/options4并关闭会话；**不是网站没有结果或有四家同名目标**。原[回执](runtime/source-read/receipt.json)、[时间线](runtime/source-read/events.json)、[独立核验](independent-source-evaluation.json)和所有产物原样保留，没有补造点击。

修复只用于诊断选择：当前可见、可用、非POST的LINK/BUTTON，规范化标签与配置全名精确相等，而且必须唯一；不加别名、不推断HIGH。真实DOM/原CONTROLS反例[4≠1红灯](selection-real-red.log) → [唯一精确按钮绿灯](selection-real-green.log)。同时保留真实CDP本地控制：第二主文档在服务器收到前阻断。该组件测试不执行来源点击，不证明其后的路由或产品绑定。

## 3. 用户追加1次入口后：92e985bc重跑入口超时

用户明确批准新额度并要求直接重跑，按额外入口1记账：总GET463→464。输入、原账本、唯一尝试ID和修复源码在92e985bc冻结；首轮93965f14保持不动。[批准与冻结计划](exact-rerun/approval-and-plan.md)。

**2026-11-07 13:36:22.089 CET**：ENTRY阶段`page.goto: Timeout 20000ms exceeded`。入口HTML200约2.129秒，两份CSS200；主脚本`/portal/assets/index-KCcaxOlR.js`的route.fetch在截止前没有返回status/body。上下文关闭在约17.853秒取消该fetch，记录明确是LIFECYCLE_CANCELLATION_NOT_WIRE_FINISH；不是已知上游HTTP失败，也不是CORS错误证据。网络/源站/传输原因未证实，没有猜改、重试、换代理或增加时限。

这次没到Destination，没有点击；没有新的选店/路由事实。[原回执](exact-rerun/runtime/source-read/receipt.json)、[原时间线](exact-rerun/runtime/source-read/events.json)、[独立诊断](exact-rerun/independent-evaluation.json)。第二主文档预算始终0，未挪用D8GET3。源站可见HTML/CSS不等于入口UI准备完成。

## 4. 完整Replay缺口已定位；组件录制不降低隐私

第一次真实读取保存3份清洗诊断DOM、遮盖截图和[components.har](runtime/source-read/recording/components.har)，后者约11.80MB、仅含已通过原清洗与最终凭据扫描的非document响应。诊断保留来源请求的字段名、规范化值哈希、阶段/时间、状态、头名称，不保存请求头值或新的原始字段值。

完整Replay仍为`NOT_REPLAYABLE / UNCAPTURED_DYNAMIC_RESPONSE`。新增Recorder诊断按响应URL哈希关联具体响应，给出固定拒录类别，不记录被拒正文或私密字段。实际缺口见[逐响应清单](replay-gap-evaluation.json)：

| 响应类别 | 数量 | 原因与处理 |
| --- | --- | --- |
| catalog与部分search（含q/name）GET | 4 | JSON_SENSITIVE_KEY；按原敏感键检查拒录，无字段/值补写 |
| 较大的旧地区/id search GET | 4 | JSON_SIZE_LIMIT；原200000字符上限不变，日志另保留字节数 |
| OPTIONS预检 | 8 | 原GET/HEAD-only录制合同不接受OPTIONS；不冒充失败GET或源站真实204 |

JSON大小限制和敏感键检查未放宽，没有补造被拒的响应。已通过清洗的脚本/CSS等允许作为明确不完整的组件保留，未升级fullReplay资格。原缺失动态响应回归保留，另补“敏感JSON不存、已清洗组件可存、完整Replay仍拒绝”的隐私回归。

组件级真实录制红绿证明了“选择唯一精确控件”和实际HTTP/字段合同；**生产查询绑定的正向红绿尚不存在**。首轮未选择，重跑未到页面，无法据实决定“前端路由+Fetch”或“联想直达店页”的绑定路线。没有根据静态脚本推断实际导航，没有伪造动态收据、响应或渲染因果。

## 5. 全套门禁、冻结与扫描

Final complete offline matrix PASS: typecheck / arch:check / build; default **1483/1483**; local Chromium **239/239** plus complete G6 **77/77**; strict G2 **5/5** and all12 page pairs PASS. Final failed/cancelled/skipped/todo0. [Clean status/SHA receipts](gates/results.json), raw logs in gates/.

最终门禁源码664f8ad28c76c82ad476c10b329ef16a6a3bdba5。原始运行固定93965f14/92e985bc，最终门禁不回写原运行版本。后续交付只有报告/证据；每项门禁前后净树、同一SHA。业务身份、Guard其他合同及所有预算/时限不变；额外文档诊断边界收紧到单页，不能借D8额度。

Pre-push scan: **2 new hits since b5de6678**, both exactly user-approved (destination namespace regex, destination allowed-class row). Since72b18bee:11; full main f324f17b scope:49, retained in scan logs and not claimed zero. Earlier hits remain within the reviewed scope. Eval is excluded by the scanner; manual review confirms the selector uses only configured full-name equality plus actual actionable controls, and component retention keeps existing privacy filters.

能力矩阵区分destination合同已通过、诊断选择已修复、绑定/身份/查位/B1未验证。STATUS/DEVLOG/TEST-LOG继续按用户先前要求留到获准合入main时更新；当前不是发布能力或Clean Baseline。三类录制接线开启，decision/Google空数组表示0调用，不是补造输出。

四层：整单/交付NOT_EVALUATED（D8/held-out没跑）；步骤为真实合同阳性、首轮诊断选择失败及独立红绿、重跑入口超时；无HIGH、交付或S0成功宣称；归因分别关闭诊断匹配错误、保留入口超时未知原因。全套离线绿灯不关闭真实选店后路径缺口。

## 6. 用量与停止

本轮新增页面GET **2**：原条件额度转入口1，加用户明确追加入口1；模型 **0**、Google **0**、完整Live **0**。累计GET353/464、模型653/1600、Live23/42。剩余111GET全部对应held-out108与D8见证/后验3；D8 Live1及held-out18Live保留。没有可自行挪用的入口额度。

已停止新的外部操作。要获得实际选店后路径，需网络/来源读取条件恢复后另行批准入口GET；若点击产生新的document，还须按用户规则在发出前申请该页。未擅自运行D8、held-out或合入main。
