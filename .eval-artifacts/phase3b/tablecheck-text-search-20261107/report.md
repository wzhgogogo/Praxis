# TableCheck 文字搜索：精确合同已实现，真实探查按 OTHER 停止

Status: draft / not integrated；已暴露开发诊断，不是 Clean Baseline。2026-11-07T10:44:42.888174+01:00 CET（UTC+1）。工作分支 `codex/fix-tablecheck-text-search`，未合 main、未启动 D8 Live。

## 结论与停止点

第1–3步的值记录、精确 Guard 合同、Recorder 公开 SPA 路由修复及诊断已实现并完成离线门禁。第4步真实探查在 `destination=OTHER` 命中用户停止条件，拒绝后不再操作来源。没有可用联想/结果交接，因此第5步动态收据/联想直达绑定及其真实录制红绿**未到达**。不能宣布“TableCheck 文字搜索已修好”。

探查前冻结82ac67fb，实际模型0、Google0、Live0，只扣剩余入口页1次；没有选中结果、没有新文档导航，备用GET0。CORS、身份、45秒provider、90秒候选、整读预算、模型与留出集额度均未扩大。全套离线门禁通过不替代实际来源完成。

## 基线与冻结

先以Git ls-remote核对原修复分支72b18bee、模型产物分支4511476a，fetch后从72b18bee建立本工作分支，fast-forward合入4511476a。模型验证434d445b及旧探查原件都在祖先中。第1步独立提交1c32a45f：来源准入文件字节未变；第2–3步7a95ee7d；第二次探查82ac67fb及probe-input-sha256.json运行前冻结、运行中未改。独立 reviewed-read-rules.json手抄用户四种形状/值合同，不从生产策略生成，当前SHA仍与探查冻结一致。最终产品候选d32c604e，全门禁在此SHA运行。

## 值类别与 Guard

权威来自实际成功的当前读取FILL_AUTHORITATIVE（Local/Cloudflare均接线），新读取beginReadScope清除旧值，迟到旧填写不跨作用域。请求查询日志只有queryKey/valueClass，不保存请求原值；既有公开路由URL与用户已授权输入的DOM录制不因此被描述为已清空。电话/邮箱/token沿用现有格式检查优先拒绝。受控接收端证明分类元数据本身不改变旧准入：现有20项Guard合同及2项分类/真实Chromium测试22/22；源策略SHA留在step1-checks.json。

在既有search-v4源站 `/search/` 上新增且仅新增用户指定的4个精确键集合：country/hits/queryProfile；country/hits/kind/queryProfile；country/hits/q/queryProfile；destination/hits/name/queryProfile。不是把五个键并进原可选集合。q/name仅EQUALS_AUTHORITATIVE_INPUT；country/kind/destination仅SHORT_TOKEN或NUMERIC；hits仅NUMERIC；queryProfile不增加固定词表，所有字段仍拒绝敏感格式。GET与浏览器保留字段证明的预检使用相同值/形状合同；预检不依赖resourceType标签，实际非预检仍只有Fetch/XHR。源站/路径/GET方法/x-api-key预检头/禁止路径/CDP边界保持。

旧规则四个合规正例均红，新规则正例及多键、缺键、换路径/源站、POST、非预检Other、非权威人名/电话/邮箱/token、前缀、旧读取、非数字hits、不合规标量均通过拒绝断言。真实本地跨源接收端确认合法GET实际到达，前缀/旧值被拒且浏览器预检可用；不是假对象预设浏览器语义。

| 真实观察 | 类别/结果 |
|---|---|
| country、kind | SHORT_TOKEN；合法形状预检和GET获准 |
| hits | NUMERIC |
| queryProfile | SHORT_TOKEN，无新固定值限制 |
| q | 预检和实际GET均EQUALS_AUTHORITATIVE_INPUT，获准后遇CORS失败 |
| name | 预检记录EQUALS_AUTHORITATIVE_INPUT；同请求的destination不合规，因此预检拒绝 |
| destination | OTHER；按用户规则拒绝并停止，不解释为无此店或错误店名 |

### 保留的诊断更正

82ac67fb原receipt还列有一个失败侧q=OTHER。检查发现原生失败回调用新URL重新分类时丢失当前填写上下文，不能据此认定实际q不同。原始记录不覆盖；probe-classification-correction.md及独立evaluation另记更正。真实本地缺少CORS允许头的接收端复现红灯，修后按真实Request保留请求开始时的类别，并将传输失败标为FAILED而非策略BLOCKED；无准入变化、无新网站重跑。确凿停止依据始终是destination=OTHER。

## 两个录制缺口

**Catalog：** 旧录制只留net::ERR_FAILED（约4059/701ms），没有状态、头或corsErrorStatus，历史确切原因未评。第二次探查新增不存头值的CDP分类，直接按CDP requestId关联到catalog及搜索GET的 `MissingAllowOriginHeader`。这是当前浏览器的CORS失败事实；没有足够证据认定缺失来自源站、中间网络或其他上游。未改头、源站、方法、预检合同、浏览器安全设置或传输，没有用Node转发绕过CORS。

**DOM：** 旧三页manifest均无URL，旧 `safeReplayUrl` 因部分公开SPA路由没有完整网络必填参数而拒绝，UNSAFE_DOCUMENT混合了URL和内容原因。没有证据证明旧页某类敏感内容实际命中；不补造原文。现在Recorder仅对已声明公开document字段的安全部分路由保留确切URL，不授予任何网络准入；API-key等敏感载体局部去除，邮箱/电话等仍遮盖。敏感/未知源URL仍整页拒录，原隐私及字节回归未放宽。

第二次真实探查把每一份原始内存snapshot/response同时交给4511476a原Recorder和新Recorder。旧版0/3 DOM保存，原因UNSAFE_DOCUMENT；新版3/3清洗DOM保存，原始输入只留SHA、未落盘。新旧原件都在probe-runtime/。这是实际DOM保留层的红绿，不是完整Replay通过。

完整Replay仍为UNCAPTURED_STATIC_DEPENDENCY：已观测主脚本10,284,255字节，超过既有2,500,000字节安全录制上限；另有失败的动态响应。未提高上限、伪造/改写脚本或补造响应，所以**没有可回放HAR**。三类机制均开启，三个布局遮盖截图和三份清洗DOM已保存。当前DOM无原始邮箱/已知凭据模式；不把有限检查称为普遍无泄露证明。

## 绑定与地区发现

没有成功的本次查询结果/联想目的地，因此按用户停止条件不实现动态收据或联想直达店页分支，不以请求启动或时间相邻假装绑定。绑定真实录制红绿、身份接纳及地区发现同路径动态验证全部NOT_REACHED。先前静态核对仍成立：地区发现比较完整href，查询串变化可能已满足离开起始文档，但同URL纯Fetch及当前地区绑定仍无新证明。身份门槛、详情上限和旧D4/D8评价不变。

## 门禁与检错证据

首轮cd935f5a：type/arch通过，默认1452/1456，4红；其余未运行，原日志保留。新增日志在暂停的文档导航中求值页面JS造成两项既有Tabelog真实组合失败；现在只读取运行时拥有的本次读取内存，不在准入点执行页面JS。另修无Frame端口不给填写权威，以及恢复敏感URL整页拒录。原业务/隐私断言未删、未反转、无skip；定向14/14通过后冻结d32c604e。

第二轮全绿，每项前后git status为空：

| 检查 | 结果 |
|---|---|
| typecheck / architecture | PASS / PASS |
| npm test | 1456/1456 |
| build | PASS |
| 真实本地Chromium | 232/232 |
| 完整G6 | 75/75 |
| 严格G2 | 5/5，12页配对全部PASS |

原始命令、环境、CET时间、耗时、SHA和日志在gates-2/；Mock、真实本地Chromium/Replay和本次真实来源探查分别陈述，均不是D8完整Live。生产/框架版本、Prompt/State、模型配置没有变更。

| 主要失败机制 | 主覆盖/红绿 | 未覆盖 |
|---|---|---|
| 未授权文本或错误形状外发 | 源合同表驱动红绿 +真实跨源接收端 | 当前目标的可用结果 |
| 旧读取/前缀误接纳 | 当前scope真实Chromium拒绝，旧值不到接收端 | 无新Live泛化声明 |
| 日志改变导航行为 | 原组合LINK/SCRIPT首轮红→原断言绿 | 当前TableCheck结果路径 |
| 失败侧丢失值类别 | 本地缺CORS头定向红→绿，保留旧错误记录 | 不补改82ac67fb原输出 |
| 整页误拒录/敏感内容保留 | 受控反例 +同输入真实新旧Recorder对照；原隐私/字节断言 | 10MB脚本导致完整Replay仍失败 |

## 写死扫描与预算

scan-hardcoded.sh基于72b18bee到d32c604e有8项：2条通用数值/短token格式正则，6条用户明确批准的精确查询键/类型/类别合同。无餐厅名/别名表、私有UI selector、站点动作序列或特殊候选分支。源/文档diff检查通过；raw测试日志保留原始空白，不为通过diff清洗审计输出。提交前再核对源码与d32c604e字节一致。

本步模型0、Google0、Live0、探查页面额度1；累计GET349/461、模型653/1600、Live23/42。余1备用GET及D8原3次见证/后验GET未用，18Live/108GET留出集预留不动；模型余额947、只调模型验证仍15/30。没有环境重跑或新provider/凭据/调度。

四层结论：端到端NOT_EVALUATED；环节只证实打开Destination/权威填全名/值合同处理，未到结果；完整D8声明S0 NOT_EVALUATED，无身份或库存成功声明；归因限定为destination OTHER、实际CORS失败及录制静态依赖缺口。按用户停止条件交复核，D8 Live、main合入、动态绑定均不启动。
