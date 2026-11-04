# D8 唯一性修复与赤羽发现路径诊断

- 状态：offline implementation candidate / exposed development；未合 main，交复核。
- 时间：2026-11-04T08:42:08.227626+01:00（维也纳 CET UTC+1）。真实模型、Google、网站 GET、Live 均为0；未读取或加载 .env。
- 基于 main `be84674e`；原件来自 A `92bc1032`。输入为已暴露开发证据，不是 Clean Holdout；没有重新评分或改写原 Live 的成功/S0 结论。

## 1. 切片兑现与边界

D8 的错误阻挡已在原始权威字段回放和普通生产组装中红→绿。身份 UNKNOWN 的异名同伴不再要求补成 HIGH；UNKNOWN 同名（含同 Place ID 日文名）、两家 HIGH 同名仍阻挡。调查仍最多原顺序前三家。State@25、TaskDefinition@23、Agent/Semantic/Browser Prompt 和 Schema 均不变。

C（二）按用户“入口里根本没有赤羽，报告实际可用路径”的条件收敛：四次初始完整观察均无赤羽，不能用确定性同名优先选出不存在的目标。后续门店页才给出 Sugamo→Akabane 的实际公开层级，但没有捕获进入 Sugamo 后的菜单读取。因此没有修改地区选择、Google、Guard、预算或20秒保留，也不宣称原生发现能力已修复。新的可行地区选择仍是待验证缺口。

## 2. D8 首偏离与修复

原 `D8-resolution-probe.original.json` 显示：exactBoundNameCount=1、allPrefixHaveHighNativeIdentity=false、firstCandidateResolved=false。原始执行结果第一家 TableCheck HIGH 全名为 `Specializing in Nodoguro Ginza Nakamata`，第二家 Hanare 已 HIGH 但异名，第三家 UNKNOWN。旧代码先检查前三家全 HIGH，未进入单一全名判定。

唯一产品改动是 `src/domains/restaurant/named-outlet-resolution.ts`：先找唯一已 HIGH 绑定的规范化完整同名候选，再检查其余未知候选的 Google 显示名、同 Place ID 日文名是否同名。检查涵盖第四、五家；它们仍不能跳过前三家调查上限被选择/查位/展示。外国 Place ID 的名字不构成本店别名。

| 输入 / 控制 | 预期及结果 |
|---|---|
| D8 原始5候选字段 | 第一家可唯一解析；其他候选都不成为替代结果 |
| 未知第三家 Google 全名等于用户全名 | 不解析，反问 |
| 未知第三家同 Place ID 日文名等于用户全名 | 不解析，反问 |
| 另一 Place ID 的名称相等 | 不认作本候选名称，原唯一结果保留 |
| 未知第四家（调查前缀之外）Google 全名相等 | 不解析，反问 |
| 两家 HIGH 绑定同全名 | 不解析，反问 |
| 唯一全名候选没有原生 HIGH | 不解析，不能用名称代替身份 |

- **原件组件红灯：** `04395e6d` 保留原组件2例后共9例，7通过/2失败；D8 原件和外国 ID 正控制被旧全 HIGH 条件错误挡住。见 `red-d8-complete.log`。第一次测试补入时覆盖原组件文件，已在该提交恢复；只同步与新批准规则直接冲突的一句旧断言，其他原控制保留。
- **实际组装红灯：** 测试 `restaurant-named-unknown-peer.test.ts` 使用 createLiveReadAssembly、持久 Runtime、Router/Reducer；只替换模型和来源 I/O。复用原 D2 语义/Google开发原件，构造 D8 的“第一家HIGH同名、第二家HIGH异名、第三家UNKNOWN”机制，明确不是整份 D8 HAR 重放。隔离归档只换回 main `be84674e` 的旧 Domain 文件，得到 `NEEDS_INPUT`，目标 `PRESENT_RESULTS` 断言失败（`red-composition.log/json`）。新实现相同输入通过，仍仅查位/展示第一家。
- 组件原件和实际组装分别证明本次名称守卫与生产接线，不把组件手填中间 State 报成端到端交付。真实网站库存和真实模型表现本批未评。
- 外层隔离脚本首次因本机 Python 不支持 tar filter 参数而未启动测试；仅修正脚本后提交冻结。这个构造错误不计有效红灯，随后业务结果断言失败才是有效红灯。

## 3. 四次 Tabelog 地区选择：完整观察与首偏离

调用链：开放搜索 → 原生 Directory discovery → BrowserTaskExecutor 观察 Tokyo 地区页 → `browser_read_decide` 的 OPEN_LINK → 只允许当前观察 ref 的代码执行 → 两个详情距离核对证明地区错误 → `selectRegionEntrance` 只给已观察并保留的入口 → 模型 SELECT_REGION_ENTRANCE → 纠正后两份样本仍超出原1000米 → 来源关闭。四次首次浏览决策都是 sequence4，纠正都是 sequence6。

| 运行 | 模型完整 targets | 地区入口数 | 首选入口 | 纠正入口 | 初始/纠正中有赤羽？ |
|---|---:|---:|---|---|---|
| D1 | 266 | 31 | Itabashi & Along Tobu Railway Line | Kita-Ikebukuro & Itabashi St. Area | 均无 |
| D4-first | 266 | 31 | Itabashi & Along Tobu Railway Line | Kita-Ikebukuro & Itabashi St. Area | 均无 |
| D4-supplement | 267 | 31 | Itabashi & Along Tobu Railway Line | Kita-Ikebukuro & Itabashi St. Area | 均无 |
| D4-latest | 267 | 31 | Itabashi & Along Tobu Railway Line | Kita-Ikebukuro & Itabashi St. Area | 均无 |

首选目标 `observation:2:target:25`，URL `https://tabelog.com/en/tokyo/A1322/`。模型理由（D1/补跑/本轮）为 “Akabane is in Kita City; open Itabashi & Along Tobu Railway Line region menu to reach Akabane.” 目标中已给 Akabane、Kita City、Tokyo、坐标和1000米，没有丢地名。初始诊断 HTML 也没有 Akabane/赤羽，不存在可用 LOCATION 输入；不是模型上下文被40个目标截断（录制诊断截断与真实完整模型上下文不能混为一谈）。

纠正上下文提供35个已观察入口，同样没有 Akabane。选择了 `/en/tokyo/A1322/A132201/`，理由是“closest observed entrance to Akabane in Kita City”。地点相近的猜测没有页面证据。

四次首次两样本：13155817 距中心5547.116米、向南；13168736 距中心3911.368米、向西南。本轮纠正后13239336/13157173仍距4040.597/4035.609米，来源如实关闭。首个可证偏离是 sequence4 的错误父地区选择，sequence6 也没有修正到赤羽。

### 代码实际给模型的31个地区入口（四次相同）

| 可见 label | 实际观察 href |
|---|---|
| Akasaka & Nagata-Cho & Tameike | https://tabelog.com/en/tokyo/A1308/ |
| Akihabara & Kanda & Suidobashi | https://tabelog.com/en/tokyo/A1310/ |
| Along Keio and Odakyu Railway Line | https://tabelog.com/en/tokyo/A1318/ |
| Along Seibu Railway Line | https://tabelog.com/en/tokyo/A1321/ |
| Along Tokyu Railway Line | https://tabelog.com/en/tokyo/A1317/ |
| Chofu & Fuchu & Komae | https://tabelog.com/en/tokyo/A1326/ |
| Fussa & Ome Area | https://tabelog.com/en/tokyo/A1330/ |
| Ginza & Shimbashi & Yurakucho | https://tabelog.com/en/tokyo/A1301/ |
| Hamamatsucho & Tamachi & Shinagawa | https://tabelog.com/en/tokyo/A1314/ |
| Harajuku & Omotesando & Aoyama | https://tabelog.com/en/tokyo/A1306/ |
| Iidabashi | https://tabelog.com/en/tokyo/A1309/ |
| Ikebukuro–Takadanobaba & Waseda | https://tabelog.com/en/tokyo/A1305/ |
| Itabashi & Along Tobu Railway Line | https://tabelog.com/en/tokyo/A1322/ |
| Izu Islands & Ogasawara | https://tabelog.com/en/tokyo/A1331/ |
| Kichijoji & Mitaka & Musashi-Sakai | https://tabelog.com/en/tokyo/A1320/ |
| Koganei & Kokubunji & Kunitachi | https://tabelog.com/en/tokyo/A1325/ |
| Machida & Inagi & Tama | https://tabelog.com/en/tokyo/A1327/ |
| Meguro & Shirogane & Gotanda | https://tabelog.com/en/tokyo/A1316/ |
| Nakano–Nishi-Ogikubo | https://tabelog.com/en/tokyo/A1319/ |
| Nishi-Tokyo City Area | https://tabelog.com/en/tokyo/A1328/ |
| Oimachi & Kamata | https://tabelog.com/en/tokyo/A1315/ |
| Roppongi | https://tabelog.com/en/tokyo/A1307/ |
| Ryogoku | https://tabelog.com/en/tokyo/A1312/ |
| Senju & Ayase & Katsushika | https://tabelog.com/en/tokyo/A1324/ |
| Shibuya & Ebisu & Daikanyama | https://tabelog.com/en/tokyo/A1303/ |
| Shinjuku & Yoyogi & Okubo | https://tabelog.com/en/tokyo/A1304/ |
| Sugamo | https://tabelog.com/en/tokyo/A1323/ |
| Tachikawa & Hachioji City Area | https://tabelog.com/en/tokyo/A1329/ |
| Tokyo & Nihonbashi | https://tabelog.com/en/tokyo/A1302/ |
| Tsukiji & Wangan & Odaiba | https://tabelog.com/en/tokyo/A1313/ |
| Ueno | https://tabelog.com/en/tokyo/A1311/ |

### 实际可观察路径与限制

后续通过具名候选检索抵达的公开门店页，面包屑逐字给出：**Sugamo `/en/tokyo/A1323/` → Akabane `/en/tokyo/A1323/A132305/`**。原件位置：D1 snapshot13、D4首次 snapshot65、D4补跑 snapshot12；`breadcrumb-provenance.json` 保留 URL、Git原路径、SHA。初始菜单只有 “Sugamo” 标签，没有与 Akabane 的关联，三份后续页面不是 sequence4 当时已经读到的资料。本轮D4未走到A1323门店页。

本批不把事后面包屑倒灌成先验菜单选择，不添加 CSS/ID/固定地区 URL 路线。后续方案可在获准的独立切片中验证：利用已观察的地区层级证据选择父地区并读其子菜单，或更新经复核的站点指引；需要先捕获实际父菜单契约。这不是当前已闭合能力，也未追加请求。

## 4. Google 受限检索：第一处不同是响应

四次先做 Text Search `textQuery=Akabane,pageSize=10`，都保存到一个地名结果，圆心为35.7799638,139.723053，地址组件含 Akabane/Kita City/Tokyo/Japan/115-0045。随后第一条发现请求完全相同：

```json
{"textQuery":"kushikatsu Akabane","pageSize":20,"locationRestriction":{"rectangle":{"low":{"latitude":35.770980688250084,"longitude":139.71198007696955},"high":{"latitude":35.78894691174991,"longitude":139.73412592303043}}}}
```

- `POST https://places.googleapis.com/v1/places:searchText`，不是 Nearby；来源目标半径1000米，客户端编码为上述矩形，后续圆形核对不变。
- 四条请求都没有 includedType/includedTypes/strictTypeFiltering；不能把返回的 types 误当请求的类型过滤。
- 首次请求体的规范化SHA四次相同，详见 `analysis.json`。前三次20+5=25条原始 places；这是来源原始结果数，不等于25条已接纳候选。本轮 HTTP200 原响应正文为 `{}
`（3字节），没有 places 或 nextPageToken。
- 既有 GooglePlacesHarCapture 捕获 response.clone().text 原字节，不会把空数组变为{}；敏感字段拒绝只会丢弃整条记录，不会重写正文。这条原件不是产品按半径过滤后变为0。因此首个可证差异在保存的来源响应；为何 Google 本轮给空对象，记录无法判定，不猜测为限流、VPN、语言或地区偏移。
- Google-only HAR 条目为精确投影（`google-provenance.json` 保留完整原HAR SHA），去掉了无关网站HAR重复拷贝。未重发 API、未改查询策略、未扩大半径或类型。

## 5. 验证、A 原件与未覆盖项

冻结候选 `bebe0a412b3dbde37c06b10a261d2624198e2322`，934份源码/配置/输入 SHA（`freeze.json`）。七项依次全绿，开始结束均净树；没有跳测/改断言/扩大超时，正式门禁没有失败或重跑。

| 步骤 | 用时 | 结果 | git status 前 / 后 |
|---|---:|---|---|
| typecheck | 0.551 s | PASS | 空 / 空 |
| architecture | 0.276 s | PASS | 空 / 空 |
| default | 48.683 s | 1425/1425 | 空 / 空 |
| build | 0.547 s | PASS | 空 / 空 |
| chromium | 179.143 s | Chromium189/189 + A G6 66/66 | 空 / 空 |
| strict-g2 | 24.203 s | 5/5；12有效页PASS | 空 / 空 |
| target | 1.335 s | D8组件9/9 + 实际组装1/1 | 空 / 空 |

`gates.json` 保存每项命令、实际HEAD、CET时间和净树回执；日志原文保留。最终归档只变更报告/审计/历史，不改变已测源码。独立audit.json另核对原件、A原字节、反例、七项门禁及账本并集。

A的全部8个G6测试文件与传递依赖按 `92bc1032` 原字节带入，测试断言/Gold/评分不改；`a-g6-originals.json` 逐文件SHA。原main只有其中18例，本批要求完整能力组，因此带入其余原件。A评测辅助代码为原件导入，不是C修改评分逻辑。12份被这些测试硬编码SHA引用的公开开发历史文件原样物化，`a-g6-data.json` 记来源；原D1/D6历史S0记录保留，测试用原件检测评分器，不能据全绿声称历史Live无错。

除原件D8组件外，构造控制均是标明的LOCAL_CONSTRUCTION；没有私有Holdout访问、没有新Gold。地区与Google代码逐字保持main；既有 Kagurazaka/Nakameguro、错误入口/坏ref/半径/截止时间以及 Google查询控制保留。全量绿灯只证明回归，不证明已取得新的Akabane导航成功。

| 失败类型 | 证据入口 | 检错有效性 | 剩余边界 |
|---|---|---|---|
| 异名UNKNOWN错误阻挡唯一HIGH | D8原件组件+普通组装新测试 | 原组件红、旧source隔离组装结果断言红，新实现同输入绿 | 真实模型/库存本批未跑 |
| 未知同名或两家HIGH同名误接纳 | Domain原件反例 | 明确期待不解析；检查其他候选不成为替代 | 依赖现有来源身份核对，不放宽 |
| 选错地区 | 四次原始决策/HTML/距离 | 当时无Akabane目标，错误Itabashi可复核 | 正确父菜单进入未捕获，未宣称关闭 |
| Google受限返回0 | 原HAR请求/响应 | 相同请求返回25/25/25/0 | 服务端为何空对象未知 |

## 6. 预算与交付

按id并集合并 A92bc1032 的47条新账目，common rows逐项相等；保留main所有条目、上限和A实际消耗，新增C零调用记录。共享累计 Live14、模型432、评测GET308、Google76、网站请求9209；本批全为0，没有增加额度或请求通道。

工作分支 `codex/fix-phase3b-named-and-region-resolution`；最终推送SHA及远端核验见交付消息。**不合 main，停止交复核。**
