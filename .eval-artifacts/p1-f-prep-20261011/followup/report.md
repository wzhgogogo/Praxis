# P1-F preparation followup — 2026-10-11

Status: authorized implementation and evidence complete / pending independent review. Exposed development evidence, not Clean Baseline. No push, no complete-task Live. 主分支 codex/feat-live-restaurant-read-path，从 c0766ca 顺序推进；实验分支仅第 3 项执行固定检索词回放，代码未合回主分支。

## 提交与四门禁

各项均有一条 DEVLOG、一条 TEST-LOG，月度索引及 STATUS 同步。typecheck、arch:check、npm test、build 全部通过后本地提交；原始四日志和 gates.json 在下表各目录。报告作为汇总证据归档，不另增实施工作包。

|项目|本地提交|门禁|红灯 → 绿灯|
|---|---|---|---|
|0 复核文件原样提交|fd0780d|全部通过；843/843|review-artifacts/sha256.json；纯文档无适用功能红灯，不制造失败|
|1 OPEN_LINK 导航时限与失败码|b301091|全部通过；844/844|navigation/native-red.log、chromium-red.log → native-green.log、chromium-green.log、executor-green.log 和四日志|
|2 第 11 次东银座补探测|898cd8f|全部通过；844/844|复用原东银座 5 秒失败与本批导航红灯；discovery/run/ 为一次真实探测，不制造红灯或重跑|
|3 两组授权回放|55a2d11|主分支全部通过；844/844；实验分支全部通过|replay/逐条距离计分仍有有效质量反例；检索词一条 wire 解码拒绝原样保留；传输 local-validation-red 仅为本地校验，明确不是模型质量红灯|
|4 请求时区接线|86c6d45|全部通过；845/845|timezone/red.log → green-target.log（120/120）及四日志；caller-fixture-red.log 是遗漏时区的合成 Fixture，已补齐|

第 1 项有效 Chromium 红灯来自旧 5 秒实现下，6.5 秒加载目标不能完成；chromium-environment-red.log 是初始 Fixture 传输失败，不计功能检错。全量首轮的地区重定向反例见 navigation/test-first-red.log，最终仍按实际落地 URL 判定地区是否观察到，没有以已选入口充当已落地。

## 1 导航修复

OPEN_LINK 和 NAVIGATE 共用默认 20 秒、受剩余候选/来源预算约束的导航选项。另发现 Guard 绑定的公共 GET 查询提交 CLICK 也会整页导航，使用相同时限；普通控制 CLICK 保留 5 秒边界。Playwright TimeoutError 归为 BROWSER_TIMEOUT；模型导航异常向上保留 Runtime 失败码，不能吞成 NO_SAFE_ACTION 或转换为地区未落地。地区错误只在实际当前页面尚未落入已选地区入口时使用；已落地但提取未完成为 EXTRACTION_FAILED。

本地 Chromium 6.5 秒 domcontentloaded 成功；2 秒剩余预算下 5 秒页面超时，BROWSER_TIMEOUT，仍关闭原会话。原 LOCAL/CLOUDFLARE late-session 隔离反例继续通过。此项本地模型为替身，真实模型 0、Google 0。

## 2 东银座第 11 次补探测（只报事实）

冻结 b301091，与上轮同一输入：kf-h002 历史绑定圆心 (35.669700299999995, 139.7671399)，nearby、1000 m、相同 criteria；上限 6 模型 / 90 秒。原变体无坐标字段，因此复用上轮明确记录的独立坐标探测输入，不能称为原样变体整单通过。变体、见证不改。

- 入口：公开地址观察 → Tabelog /en/tokyo/ → 模型选择已观察入口 /en/tokyo/A1301/（Ginza & Shimbashi & Yurakucho）。该 OPEN_LINK 用时 **5,779 ms**，当前页面落地成功；没有导航超时。
- 状态 LIST_OBSERVED；页面显示 **6,251** 个结果，初始列表解析 **20** 家；两批实际读取 **10** 家详情，9 家半径内、1 家半径外。未读取的列表记录不计详情成功。
- 用时 **78,977 ms**；真实模型 **1/6**，决策捕获 **1/1**；Google **1/40**（反向地址），无 Google 发现请求。
- P1-D 探测 **10/11 → 11/11**，用完即止。通过与否由复核者判定。

|详情 rst_id|纬度|经度|记录距离 m|半径观察|
|---|---:|---:|---:|---|
|13294162|35.66402049872411|139.75754009421684|1074.0015463273833|OUTSIDE_RADIUS|
|13292459|35.66722032872345|139.76182924424614|554|WITHIN_RADIUS|
|13277198|35.67459895872041|139.7669918043171|545|WITHIN_RADIUS|
|13295658|35.66857859380928|139.76305499491173|390|WITHIN_RADIUS|
|13291436|35.6730269771383|139.76978023902078|441|WITHIN_RADIUS|
|13283245|35.670481678655634|139.76891153946747|182|WITHIN_RADIUS|
|13263391|35.67436693791574|139.7687324831517|539|WITHIN_RADIUS|
|13285959|35.67148433791507|139.7609012831281|598|WITHIN_RADIUS|
|13226719|35.671376737915736|139.7627760831257|437|WITHIN_RADIUS|
|13305528|35.66853785408858|139.76300768414032|395|WITHIN_RADIUS|

原产物：discovery/run/kf-h002-20261024.result.json、decisions.jsonl、diagnostics.json、snapshots.json；recording 为 discovery/run/recordings/kf-h002-20261024/recording.json。完整路径、坐标与网络核对见 discovery/analysis.json。

**原产物字段限制：** firstTen.actualDetailsRead=5、actualParsedResults=15 来自末批 metadata，不代表累计；聚合总数由两批/10 个唯一详情快照复核，只在 analysis.json 说明，不覆盖原 result。距离按原观察记录，部分值已取整，未把取整结果充作新的半径校验。Recording 标为 NOT_REPLAYABLE / UNSAFE_DOCUMENT，不能声称可静态回放。

两次自动审批拒绝都在进程启动前，模型/Google 0；用户随后明确批准此次公开载荷发往仓库 DeepSeek API，才执行一次。没有绕过审批或改用其他目的地。discovery/blocked.json 保存拒绝及授权解决事实。

## 3 授权固定回放

**发送范围核对：** 仅执行已准备/审计的 8 条距离及 16 条检索词消息；目的地仓库既有 https://api.deepseek.com。捕获元数据没有 jsonSchema，按已有 replay Runner 使用现有 Schema 5 / 实验 Schema 12 还原传输字段；24 条实际请求去掉该字段后与保存请求逐项一致，见 replay/transport-audit.json。8 次先前本地 Schema 校验拒绝未发生网络调用，不能计为模型调用或计分结果。没有新增系统提示、网站访问或请求，未重跑失败回放。

距离原样与 INJECTED_DISTANCE_ONLY 各四次，按 seeds.v6 固定集合匹配规则评分：

|种子|原样动作 / 评分|注入动作 / 评分|
|---|---|---|
|p1-seed-0129|CHECK_AVAILABILITY / 未通过|CHECK_AVAILABILITY / 未通过|
|p1-seed-0130|CHECK_AVAILABILITY / 未通过|CHECK_AVAILABILITY / 未通过|
|p1-seed-0131|PRESENT_RESULTS / 通过|PRESENT_RESULTS / 通过|
|p1-seed-0132|PRESENT_RESULTS / 通过|PRESENT_RESULTS / 通过|

真实模型 **8/8**，Google 0。注入候选距离分别 33、33、5、5 条；详细候选集合、原动作、新动作和响应在 replay/逐条 JSON 与 distance-summary.json。两种模式各 2/4，正向对照不降，但本次未证明 0129/0130 改善。没有改种子或计分口径。

检索词在实验分支冻结 **a51a59c**，已准备的 16 条各执行一次，真实模型 **16/20**，Google 0。逐条原动作、新动作、原始 reason（含模型所称无结果说明）见 [replay/retrieval-report.md](replay/retrieval-report.md)；完整响应和传输请求在 replay/retrieval/retrieval-01.json 至 retrieval-16.json。

|原始组|决策|原动作|新动作分布|
|---|---|---|---|
|kf-h001 P1-E|#24–28|CLICK 5|REPORT_NO_RESULTS 4；原始 REFINE_RETRIEVAL 1（requestedState=NONE，未提供词，解码拒绝）|
|kf-h005 P1-E|#3–8|CLICK 6|CLICK 6|
|kf-h005 复测|#3–7|CLICK 5|CLICK 5|

没有有效 REFINE_RETRIEVAL 搜索词。REPORT_NO_RESULTS 的 reason 原样保留，不能冒充已经验证的页面逐字引用；由独立复核标注，不自行计分。全部原 DOM 仍缺失，结果区/当前词绑定和双快照无法核验，executorAcceptance=null。不能只凭消息文本宣称执行器接受或实验质量已改善。实验分支没有代码修改或合并，仅临时依赖 symlink，完成后删除；其四门禁日志复制到 replay/retrieval/experiment-gates/，工作树干净。

## 4 时区接线

openingHoursForRequest 的当日及前日 weekday 使用调用方提供的时区；Google 搜索/详情和官网事实从 request.intent.timezone 传递，diagnostic evaluator 从产物 intentDraft.timezone 读取。缺时区是缺少证据，不借宿主机默认或硬编码兜底。新增加的 read-grounding.ts 原 230 行字面量已删除，同 helper 原有 weekday 字面量一并替换为同一请求值；不新增时区字面量。

helper 正例以 UTC 验证两次 formatter 的输入接线，保留跨午夜营业的 noWindow=false 正常结果；这只是局部传参验证，产品 Intent 时区合同仍未扩展。Google/官网/diagnostic 调用方全部接线，合成 Fixture 补齐已有时区；没有放宽 HARD、半径、身份、新鲜度和交付资格，不改 Accepted ADR、Gold、状态/Prompt/Dataset 或 evaluator 版本。

## 预算与保护

- 本批真实模型 **25**：补探测 1、距离 8、检索词 16。以 **391/1500** 为起点，累计 **416/1500**；本地替身及 8 次未出网的校验拒绝不计入。没有额外回放或探测。
- P1-D 探测单列：**11/11**；本次该项新增 1 模型，按上批可核验子项 12 计，累计 13 模型，不重复加入 416。
- 本批 Google **1**（只读反向地址）。上批 Google 17，本两批可核验累计 **18**；更早累计未给出，不编造全项目总数。
- 旧 278 个受保护文件、Playbook 1.2 和本轮复核原文 2 文件 SHA-256 均一致，见 protected-final-check.json。未修改 Gold@6/@7、变体、见证、种子和已有录制；三份未跟踪演示文稿未动。共享生产不新增来源/地名/坐标字面量。
- 真实探测无非 GET/HEAD 放行，无预约/支付/个人信息页面；仅模型回放外发已授权消息。没有实际写操作、非预期 Guard 放行或完整任务 Live。没有推送。

停止，等待独立复核。探测是否通过及检索词行为标签由复核者判定；不继续 P1-F Live。
