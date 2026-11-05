# 停止点 3：精确搜索合同已应用，D4 到达真实候选；整体验收仍未通过

2026-11-05，维也纳 CET（UTC+1）。复核输入 e30c0812；本次按用户停止点2决定继续。当前为 **draft / not integrated，已暴露开发来源 Replay**，不是新 Live，也不是 Clean Holdout。

**停止原因：获批剩余4页已全部使用，本会话页面读取15/15；D8的首个检索缺页按用户要求须先申请新读取。D4/D8整体均未报通过，不合main，不跑Live。** 十字段合同保持，未放行任何十四字段请求；生产默认Node不变。

## 本次已完成

1. `tabelog-public-query.ts` 新增用户批准的 `https://tabelog.com/en/rstLst/`，仅GET/document，精确十字段：LstAre、LstPrf、area_datatype、area_id、genre_name、pal、search_mode、station_id、sw、utf8。缺、增、重复字段均拒绝。全局name规则、禁止路径、CDP、其它来源原规则不改。
2. 此端点 `strictQueryKeys: []` 表示所有请求必须符合已审核语法，避免缺掉genre_name甚至全部query后经generic GET旁路放行。既有非空strictQueryKeys行为不变。独立评测清单以单独JSON列出同一合同，其审计不导入Guard/policy结论；独立审计也拒绝缺、增字段。
3. Recorder只为已批准、同源GET、无query的精确form action保留目标；POST、别的源站、未登记路径、带陌生query仍剥掉。旧源件已经丢失action，未补写；新采首页的实际action完整保存。
4. 地点选择取消联想href的地区URL前提。现有OPEN_LINK或安全fragment CLICK处理实际联想；回读可见地点标签和原生form归属后，使用同表单唯一可见GET Search。不依赖输入值、私有class、按钮type或固定站号URL。原仅服务构造OPTION页的分支已删除，补充fixture改为脚本LINK+可见标签；无匹配、歧义、异地、店名项反例保留。
5. 新列表入口由实际地点观察绑定。已有sw检索变化保留同一地点范围，其余query字段/源站/路径必须相同；未拼车站URL。新form观察字段只用于代码，已从两处模型target投影排除，未改Prompt/Schema/State/TaskDefinition。

## 四页真实补采

均为默认Node、匿名上下文、Guard、先记账、间隔≥5秒、20秒窗口；未操作日期确认、预约、登录或POST，失败无重试。四页均HTTP200、源件REPLAYABLE。

| 实际读取 | 来源与记录 | 结果 |
|---|---|---|
| 首页 /en/ | `recordings/D4-CAPTURE-APPROVED` | 实际输入Akabane、点车站、回读可见标签 |
| 同表单脚本Search结果 | 同上，源脚本发出的精确十字段GET | `Best Restaurants near Akabane Sta.`，实际station_id=134，未手工拼URL |
| sw=kushikatsu结果 | `recordings/D4-RETRIEVAL-OBSERVED` | URL逐字取自普通组装生产回放的实际navigate，独立核对十字段；不是认证ID直达 |
| 第一家详情13273370 | `recordings/D4-FIRST-DETAIL` | 生产从实际列表选择的 Kushi Katsu Ageage Akabane honten；不是按Gold挑店 |

三种捕获流和逐请求时间线保留；本轮模型/Google/Live调用均0。每个result、HTML、HAR、网络终态和读取前账本均可核查。source capture里的REPLAYABLE是材料资格，不直接代表完整业务验收。

## D4：真实组件红绿与整组装进展

原 `stop2/d4-real-red.log` 是旧生产地点筛选在真实来源上的NO_MATCH红灯。新 `location-real-fragment.log` 以真实首页脚本、联想JSON、form action与结果HAR重放：SELECTED，落点标题 `Best Restaurants near Akabane Sta. | Tabelog`，页面有 `Akabane Sta.800m`，stops=[]，真实调用0。中间旧版假设/诊断失败日志保留。

整组装使用 `createG6Session → createLiveReadAssembly → PersistentRestaurantAgentApplication`，从D4原用户请求开始，语义响应及其TOOL_CALLS标记保留原字节。只替换外部模型传输与来源I/O；不注入候选、合格证据、空位或B1缓存。浏览器代理锁为127.0.0.1:9，只有已有合格HAR响应可读，缺项关闭且导出原因，不能联网补洞。允许多次观察同一合格文档，不用旧快照次数要求强行替换新执行顺序。

**同时发现并修正一个下游可选项：** 新入口查询被旧列表预筛选构造器误识别为地区列表，添加vac_net、svd、svt、svps成为十四字段，Guard在prepareNavigation拒绝。有效红灯见 `D4-whole-replay-prepare-diagnostic.log` 与 `prefilter-red.log`。未添加第二条Guard例外、未删genre_name。来源capability现在对这个不支持日期筛选的入口返回undefined，沿用原有 `QUERY_NOT_REPRESENTABLE` / SKIPPED，继续逐店身份与真实查位。列表预筛选本来不是最终库存证据；最终查位仍必需。旧地区入口筛选控制全部保持。最终回放核对新入口的prepareNavigation仅十字段，没有十四字段请求。

实际串炸列表三家依次是：

1. Kushi Katsu Ageage Akabane honten：13273370（新采）
2. Kushi Katsu Dengana Akabane ten：13108466（已有W1合格录制）
3. Kushi Katsu Tanaka Akabane ten：13149916（缺合格详情）

当前整组装确实读到并接纳前两家原生候选，地址/坐标仍走既有接纳。第三家触发 DOCUMENT_NOT_QUALIFIED；没有合成成功页面。见 `D4-whole-replay.json`、`evaluation.json`。

**尚未达到验收：** 两家查位为UNKNOWN / REQUEST_SELECTION_UNCONFIRMED，没有绑定11-11、19:00、2人的当前库存。模型替身只选真实Categories原文、同页可见View more和执行器已准入动作；回放中未获得可选择且确认的请求日期/人数目标，未造出日历或默认席位。最终NEEDS_INPUT不是“来源证明无位”，不能算如实无位通过；没有展示当前库存、没有G1包间追问答案。对模型替身的人工引用选择只说明源文/接纳链，不声称真实模型做过同样判断。

## D8：Tabelog路径仍有缺口

只启用已有Google原件和Tabelog Pack；没有TableCheck请求。原D8语义全名仍是 `Specializing in Nodoguro Ginza Nakamata`，未翻译或换成认证ID。普通组装首次试图读取：

`https://tabelog.com/en/tokyo/rstLst/?sw=Nakamata`

当前实际D8 HAR没有此响应，导出 DOCUMENT_NOT_QUALIFIED；之后其它已有候选响应不能代替这份缺页。最终仍NEEDS_INPUT，没有原生HIGH绑定后的唯一性、查位、B1或条款。见 `D8-whole-replay.json`。本轮13186922的早期读取是HTTP成功但该录制当时NOT_REPLAYABLE；不会因请求200就强行升级。旧D8中已有合格13186922页继续作为合法来源，未用诊断DOM补齐不合格录制。

还应提示复核：已有W2英文页标题为 `Nodoguro Senmon Ginza Nakamata`，不等于原用户全名；不能据认证店号直接绕过名称守卫，也不能加跨语言别名来凑唯一性。缺页补齐后仍须由当前身份/唯一性规则给结论，不能预先承诺会通过。

TableCheck B1和双渠道清单：**未验证（运行环境不可达）**，按用户决定放到3b之后，不换代理、证书、身份规则或重试策略。

## 验证与预算

- 搜索合同红灯及form action合同红灯有效；最初误拿已脱敏旧快照寻找action的失败保留，不能当真实原件action尚在。
- 相关Guard/执行器/录制/地点回归150/150；随后地点+合同+录制24/24、预筛选来源合同13/13；最终相关37/37、typecheck-last通过。
- 最终全套五门禁、严格G2、G6尚未运行：按用户工作规则，真实Replay整体通过后、合入main前才跑一次。本轮局部绿灯不替代整体验收。
- 本次新增4页；本会话累计15/15页、194个底层准入传输。共享评测公开GET331/440，余109，其中108留出预留未动；Live16/36、模型460/1600。本次模型/Google/Live均0，不读.env或留出原文。
- 未取得“身份+当前查位”正常完成样本，不能给出正常用时或provider窗口建议。20秒导航、45秒provider、90秒候选、500秒整单及20秒保留均未改。
- main未更新，实验传输仍只在工作分支，生产默认Node。STATUS/DEVLOG/TEST-LOG按工作规则在实际合入时才更新。

## 需要决定的下一小步（未发请求）

`next-read-review.json`列出确切已观察URL及依据：D4缺少的Tanaka详情、D4已有两店的请求日期/人数日历观察、D8的Nakamata首屏。不要单补Tanaka就承诺D4全绿：目前还缺日期选择及其真实响应；同理补Nakamata也不承诺原全名可唯一匹配。

建议先批准有界D4日历取证与D8首屏，而不是放宽十四字段、身份或时限。当前本会话15页已用尽，共享非留出只剩1页；任何新页面分配必须由用户决定，不能挪用108留出GET。仍未知的后续来源链接，只能在实际观察后另列，不预拼find_vacancy参数或认证ID直达。当前先停下交复核，不合main、不运行Live。

复现前提：本停止点整体验收仍未通过；以下命令复现的是同一个带缺页/UNKNOWN的结果，不是成功验收。先 `python3 .eval-artifacts/phase3b/d4-d8-real-pages-20261105/stop3/materialize-replay-inputs.py`，再分别运行同目录 `replay-location.ts`、`replay-whole.ts D4`、`replay-whole.ts D8`。依赖用户给定的本地Git对象1d88ba11；脚本只git show并核对原文SHA，不fetch。旧A原件以69个Git路径/SHA引用保留，避免再提交两套大录制；本次新采原件直接随停止点提交。
