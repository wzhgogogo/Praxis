# 停止点 2：传输对照与 D4 公开 GET 搜索阻断

2026-11-05，维也纳 CET（UTC+1）。复核基线 ae67b61c；本会话继续负责。**现在因用户明确的“Guard 准入不变”底线停止：D4 实际 GET Search 发往 `/en/rstLst/`，携带公开字段 `genre_name`，现有通用敏感字段规则匹配 name，将请求拦在发出之前。未新增例外，没有改字段或改URL绕过。** 第2项补采到此未完成；第3项产品地点逻辑尚未修复，不能宣称 D4 打通。

四次对照均已按批准执行，无自动重试；D4两次补采各读一次首页。当前本轮新增6次页面读取（对照4、D4首页2），原探针累计11/15，余4。模型、Google、Live均0，不读.env。main未动，生产默认仍NODE_FETCH。

## 一、Guard 对照实现与离线结果

新增显式实验构造参数 `admittedGetTransport: BROWSER_GET_HEAD`，只在诊断/测试调用方启用。普通启动不读取新环境开关，也没有注入这个配置。Node仍是默认；已审核POST仍走原Node路径。准入判定、禁止路径、CORS/POST字段和资源策略保持原逻辑，CDP仍检查每次真实跳转。

浏览器原生GET/HEAD通过现有判断后continue；完整响应由独立的Playwright response事件取得，录制调用方等响应落盘再导出。事件只取已准入请求/受检查重定向的响应，不存请求/响应头、Cookie或POST正文。未改变内容许可。

**必须告知的实验差异：** 原生continue之后没有单请求Route.abort能力。为了不扩大原请求时限，原生请求超时时，本实验保守地关闭该上下文；旧Node转发通常只中止失败请求。这更严格，但业务可恢复性并非完全等价。因此不能仅凭本轮结果直接切换生产；这是后续切换审查必须考虑的取舍。独立录制失败也不能悄悄变成成功。

离线以同一组原接收器断言分别执行Node/浏览器：正常/敏感/跨域重定向、fetch/xhr/script/stylesheet/image、iframe、worker、popup、8种URL规范化、独立CDP拒绝、真实CORS预检、合法四字段只读POST和非法方法/字段/类型拒绝、录制。worker控制实际执行允许脚本并进入受控重定向后再拒绝；未放行禁用接收器。断言未降低，仅录制调用方增加必要的完成等待；P21原6.5秒控制也在两种配置中运行。另加原生模式GET/HEAD不调用Node.fetch、完整正文及同请求时限的故障关闭控制。

`native-red.log` 在旧实现中明确为3次Node.fetch而非0。第一轮一致性两红是异步响应导出/实际close事件未等待，原日志保留；修正等待后：`transport-and-recording.log` **79/79**；相关诊断回归33/33；随后通用表单/录制相关23/23。全套五门禁/严格G2/G6按新工作规则留到合入前，本轮未运行，不引用旧全绿来冒充本次全绿。

## 二、四次真实传输对照

每种配置每页一次，新匿名上下文，无显式代理；没有额外查询出口IP或TLS抓包，不能承诺两种库的底层出口配置完全相同。相同原Guard策略、20秒页面窗口、先记账、间隔≥5秒。Node转发与浏览器原生是本次唯一主动切换的传输配置。

| 页面 | Node | 浏览器原生 | 录制与结论 |
|---|---|---|---|
| TableCheck `/en/japan/search` | 无HTTP响应；`Client network socket disconnected before secure TLS connection was established`；本次窗口约1.365秒结束 | 无HTTP响应；`ERR_CONNECTION_CLOSED`；本次窗口约2.123秒结束 | 两者均失败，未产生可回放文档。**“只拒绝Node连接”不是本轮得到支持的解释。** 不能推定全站故障、具体IP封禁或TLS指纹策略。 |
| W1 13108466公开详情 | HTTP200，DCL **10.457秒**；响应收尾约12.628秒 | HTTP200，DCL **7.736秒**；响应收尾约9.086秒 | 两者pending=0、均在20秒内收尾，页面和动态依赖均获REPLAYABLE。 |

W1这个单次配对观察原生DCL少2.720秒（约26%）；没有重复采样、随机顺序或同出口证明，不能作为稳定收益率或因果结论，更不能据此声称D8已解决。逐请求CDP/Playwright终态、Node fetch和原生continue的起点记录均保留；continue返回耗时不是完整下载耗时，不能与Node.fetch正文完成时间直接相减。

原件目录：`recordings/TC-NODE`、`TC-BROWSER`、`W1-NODE`、`W1-BROWSER`。每个目录保留result、三种捕获流和逐请求时间线，完整数据见analysis.json。

## 三、录制完整性改进

精确的公开联想GET `/en/suggest/keyword_suggest?keyword=Akabane` 现在可保留响应中的公开来源名和地点字段。许可仅限这个源站/路径/字段及有界公开schema；陌生字段、credential、个人联系形式、未知敏感值仍拒绝，不向Guard添加规则。录制测试包含session_id拒绝反例。原JSON-LD和静态代码安全规则未放松。

修正有界响应收尾后，本次W1两种传输都完整保存了 `restaurant_tel_call_available`、`initial_vacancy` 等真实读取，而不再在DCL后立即关闭丢失响应。Node和原生同样经过原录制资格判断。

D4第一次补采 `D4-CAPTURE`：首页→输入Akabane→实际点车站→回读同表单地点标签，**4/4快照获REPLAYABLE**，联想JSON完整保留。探针在GET提交前因旧假设“Search必须type=submit”停止。真实Search是type=button，归属method=GET的表单，由页面脚本提交。此为外层探针假设失误，耗费1次首页读取；不算产品修复红灯。原件保留。

第二次 `D4-CAPTURE-GET`：按当前可见信息接受该脚本按钮，没有改其类型/方法，已实际点击。页面发起：

```
GET https://tabelog.com/en/rstLst/
query keys = LstAre, LstPrf, area_datatype, area_id, genre_name,
             pal, search_mode, station_id, sw, utf8
```

此请求被CDP准入层拒绝，没有进入Node.fetch，未到网站，故不另记一笔已发出公开GET。页面随后为chrome-error；外层的 `Execution context was destroyed` 是导航失败期间的次级现象，首个阻断是Guard拒绝，不能归因来源无店或HTTP连接失败。前三个首页/联想/选择快照可回放，第四个错误页不可回放；**没有结果列表录制**。

`genre_name` 来自同一公开搜索表单的菜系字段；当前Guard的 `sensitiveGenericRead` 按字段名匹配 `name`，且没有这一路径/完整字段集的来源专用规则。切换Node/原生传输不会解决这个准入阻断。禁止用删genre_name、猜R134路径、修改全局name过滤或跳过CDP来补救。

## 四、真实回放：实际进展与剩余偏离

`replay-d4.ts old-production` 用本次真实首页/脚本/联想JSON的严格HAR运行原生产筛选，得到 **NO_MATCH而非SELECTED**，形成真实录制红灯（`d4-real-red.log`）。其操作轨迹确实进行了填入和两次联想观察，页面包含真实Akabane项，无缺HAR停止，不能归为启动/Fixture失败。没有用手写HTML代替原件。

随后严格回放同一个真实脚本Search时，发现另一个**行为保真缺口**：录制中的form action已被既有 `sanitizeReplayForm` 未登记目标规则剥掉。实际运行发往 `/en/rstLst/`；回放则发往默认首页 `/en/`，携带相同10字段后同样被Guard拒绝。`d4-real-get-block.log` 和补充诊断的第二次日志均保持红灯；`d4-real-get-observation.json`保存真实回放请求/拒绝，无脚本错误或缺响应回退。它**不是对真实Search落点的忠实复现**，不能报绿。

因此REPLAYABLE的资源资格只说明安全材料/依赖已保存，不等于所有表单语义已保真。下一步须在来源请求合同经用户/复核者批准后，按合同保留真实GET form action，再重放。没有人工补action、替URL、生成缺失响应或把诊断快照强制升级。

以上是**来源组件诊断Replay**，不是createLiveReadAssembly整条Case交付验收。D4尚未到认店、查位、G1；D8未到唯一身份、查位或B1。第3项地点生产修改（取消地区href过滤、移除手写OPTION分支、每一步以回读状态推进）因本次Guard停止条件尚未实施。只补了浏览器原生表单owner和可见文本观察，未依赖私有class、固定位置或隐藏字段来选动作。不改变原反例和验收口径。

## 五、待决定的具体合同（未应用）

附 `public-search-rule-proposed.patch`，**仅草案，未应用**：

- 只给 `https://tabelog.com/en/rstLst/`，GET、document；
- 只允许本次实际10个query key，精确集合，不含任意额外字段、POST或其他路径；
- `genre_name`仅在这个来源请求形状中作为公开菜系字段；全局PII/name规则、禁止路径、CDP边界和其它源的规则不变；
- 独立评测读取清单也须由复核者按同一个实际合同核对；不是拿生产Guard自己的允许结果作oracle。

这仍然会让当前被拒绝的请求变为允许，**属于用户规定必须停下决定的Guard准入变化**。补采授权不能被我推断成可以自行改这条底线。

若批准精确来源合同，随后按真实观察到的表单action保真保存，再用余下4次补采额度完成公开结果页，并用真实Replay实施/验证地点动作修复。未批准前不继续来源请求。TableCheck两路均连接失败，需要另定下一步有界网络排查；本轮不改身份、不加别名、不换IP/证书策略/代理或重试。

生产传输是否切换仍单独等待决定。本轮数据不支持“切原生即可修好TableCheck”，且原生超时时会更保守地退休上下文；不能直接合入。provider45秒、candidate90秒、导航20秒、整单500秒和20秒保留均未改，也未形成“身份+查位”正常样本来推荐新数值。

## 六、预算与交付状态

本次新增页面读取6（四对照+两个D4首页），底层准入传输68；原会话累计11/15页面、134底层传输。共享公开GET **327/440**，Live **16/36**，模型 **460/1600**；本次模型/Google/Live全0。余113 GET中108为留出预留，留出18次Live预留亦未动。剩余探针4页；未擅自追加调用。旧账不覆盖，会话账本逐次追加，脚本汇总。

来源调用都在开始前记账；被Guard拦截的Search只保存拒绝证据，不冒称实际网站读取。原始Node/原生失败与回放失败均保留，不覆盖旧报告或重评分。全套门禁未运行，STATUS/DEVLOG/TEST-LOG不在本停止点重复更新。

**停在Guard边界交复核。** 工作分支继续保留，不合main、不跑最终Live、不通知其它会话接力。
