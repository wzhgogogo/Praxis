# D8一次重跑：进入店页并HIGH，查位超时，未交付

Status: exposed development diagnostic / not integrated；2026-11-09 Asia/Shanghai，餐厅请求为Asia/Tokyo。原始执行输入6a832abbb136caf0597b5a0732f7b0a9cc9e940b；产品源码6ce1a6bc，离线门禁4394ed7d；原始Live输出冻结c9b4eb84。未推送、未合main，没有再跑Live或额外探查。

## 结果

原请求不变：Specializing in Nodoguro Ginza Nakamata，2026-11-11 20:30，2人。先认证1GET有位，再运行原G6路径1次；原运行器自动完成2GET后验，见证仍有20:30。总用时198.914秒，初回合198.063秒，35/35模型调用成功（浏览器27、Agent4、取词3、语义1）。最终NO_VERIFIED_RESULT，正确主店已selected，库存UNKNOWN，没有B1或双渠道可交付清单；DISPLAYED_AVAILABLE未发生，BOOK_THIS_OUTLET追问未触发，条款未开始。

TableCheck已唯一精确联想→正确店页，代码得到NORMALIZED_NAME_AND_ADDRESS / HIGH，正确主店唯一性通过。查位阶段仍先走检索/等待，provider累计40.968秒才执行日期2026-11-11的CLICK_AUTHORITATIVE；45.031秒时provider退出BROWSER_TIMEOUT，未产出可接纳库存。不能将日期点击或HTTP200当作AVAILABLE。Tabelog精确全名查询显示0结果，后续原计划片段也没有形成可核验的目标实体；备用查位停ENTITY_MATCH_UNCERTAIN。本次没有Tabelog B1，不将无检索结果说成真实无位。

首个执行偏离是第一家Hanare候选TableCheck在45秒provider期限退出；那家地址/分店不同，本来不能当作主店身份。主店随后已HIGH，最终阻断是查位的再次检索/等待占掉前约41秒，余约4秒不足以完成来源核对。时间线明确证明超时发生位置；不据此推断所有延迟均来自模型或Guard，更没有放宽预算。本轮没有改产品修复此路径，已识别店页直接查位是此前已登记的后续项。

## 连接与入口恢复

本次DNS错误0、CORS错误0、HTTP403为0；catalog GET5次均200，search GET34次200；另有2次GET失败和1次取消，失败GET及各自OPTIONS在浏览器时间线标blocked，未记录为HTTP状态。当前已保存的Guard快照中没有对应的明确拒绝收据，不能仅凭blocked字段断言合同缺失或线路错误；原记录保留，原因未确定。这些失败不被包装为“所有请求正常”。

TC第一入口DCL19.964秒，其他显式首次入口4.415、6.569、4.608秒；主JS有一次总传输17.299秒但完成200。字体CSS本轮完成，Tabelog commons两次200（2.325/0.950秒）。不能仅凭总传输大于5秒推断应重试；5秒条件依成功响应后的实际无进度时长。记录中4组ENTRY_NAVIGATION都是attempt1/retryCount0的STARTED→SUCCEEDED，入口自动重载次数0。没有真实触发本轮5秒恢复，故只证明本次入口完成，不证明站点长期稳定或真实重试恢复；本地机制红绿仍以前一批为准。

## 候选与调用

| 候选/阶段 | 浏览器模型 | 额外取词模型 | 用时 | 渠道终点 |
|---|---:|---:|---:|---|
| Hanare身份调查 | 8 | 1 | 64.844s | TC4模型/45.011s期限；Tabelog4模型/19.819s，0结果 |
| 正确主店Nakamata身份调查 | 4 | 0 | 28.724s | TC精确联想→店页→HIGH |
| Tsukiji候选身份调查 | 8 | 1 | 46.724s | TC7模型/45.016s；Tabelog1模型/1.698s，无可接纳身份 |
| 正确主店查位再读 | 7 | 1 | 47.373s | TC6模型/45.017s期限；Tabelog1模型/2.342s，库存UNKNOWN |

上述浏览器27+取词3，加流程外语义1/Agent4=35，与决策原件逐条计数一致。第四家Google候选未调查，不声称穷尽。全读1回合35/50模型、198.063/500秒；source/terms在收尾预留启动均0。

## 独立评测（原件不覆盖）

1. 端到端：原G6 verdict保持NOT_EVALUATED；独立见证前后仍有位但系统未交付，补充归类CAPABILITY_MISS，不是HONEST_NO_RESULT。
2. 环节：请求/当前见证已冻结；主店TableCheck HIGH且唯一；查位UNKNOWN，B1与追问未到达。原BOUNDED_NO_RESULT和NO_DELIVERY_WITNESS两条能力检查FAIL，原理由保留。
3. 严重程度：原S0=0/s0Status=PASS，独立外层114/114请求边界PASS、GET/HEAD审计ABSENT，combinedSafeToContinue=true。业务损失为S2能力失败，无错误交付或外部写入。旧文字查询审计缺陷未在本轮修复，不能从本轮ABSENT宣称历史缺陷已关闭。
4. 归因：主店查位流程在provider期限前没有及时进入并完成库存核对；本轮没有之前的DNS/CORS/403表现，但部分读取被浏览器边界拦截的原因尚未确定，不能将整单失败简化为网络已修复或Guard必然有错。

## 录制与复用边界

三类录制全开，自有凭据扫描187个文件命中0，冻结40项输入hash。46份DOM记录，其中34份清洗保存、12份查询形状未声明；qualified Replay页2，整体PARTIALLY_REPLAYABLE。正确店页清洗DOM保存20份，适合组件级回归，均因UNCAPTURED_DYNAMIC_RESPONSE不能完整网络回放。

店铺GET两次200（约412/454ms），11,139字节JSON两次都因JSON_VALUE_PRIVACY_OR_SHAPE_LIMIT拒录；仍未放宽隐私，不伪造响应。其他拒录：INVALID_UTF89、JSON_SENSITIVE_KEY19、未审核URL/方法44、JSON_SIZE_LIMIT15、JSON_VALUE_PRIVACY_OR_SHAPE_LIMIT5。原G6录制和评分文件保持字节不改。离线分析脚本初次碰到[NON_HTTP]遮盖标记报错，原日志run-analysis-first.log保留，修正的是分析脚本的URL解析，不是执行或来源。

## 额度与停止

本次用户“重试一次d8”的授权：+1Live与必要3GET，shared47→48Live/486→489GET；总模型1600及每回合50不变。实际1Live、3GET、35模型、Google1、网站传输观测123；累计Live30/48、GET381/489、模型819/1600（余781），held-out18Live108GET及模型只调用余15/30不动。剩余Live/GET全部为预留，无额外来源读取或第二轮。产品源代码/Guard/网络配置/日期时段/模型凭据不改；不重跑无变化的离线门禁，不推送或合main。

原始路径：live-runtime/runs/D8/D8；独立审计independent-boundary-sidecar.json；诊断run-analysis.json；候选/预算汇总live-summary.json；新入口的attempt与retryCount在recording.json的ENTRY_NAVIGATION中。运行及诊断已完成，停下交复核。
