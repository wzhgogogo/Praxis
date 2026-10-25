# 历史准备与中途进度记录

Evidence status: superseded progress, not final outcome. 下方原文保留；当前结论见report.md。

# F5 Live：重放与执行前冻结

- 日期：2026-10-25；按用户指定固定CET（UTC+01:00），原始UTC证据保留。
- 当前状态：凭据读取例外已获用户直接批准。slot1已结束并完成安全复核；slot2正在来源预检等待，slot3–6未启动。尚未到停止点3。
- 依据：用户自包含停止点2复核与F5 Live批准；不补造项目中不在Git的复核原文。

## 基线、合并与门禁

最新main为4d9279583299e798f43cace277b84700617635ce，包含F2①、诊断DOM、静态资源节奏豁免、F2④b及Google原始JSON捕获。F5原tip763a2262用annotated tag checkpoint/phase3a-prime-f5-stop2保存后重放；源码无冲突，5份历史文档按并集保留双方记录。账本原A7条＋F5旧GET2条均保留，见rebase-audit.json；本次复查后为11条，没有覆盖双方历史记账。

重放受测355a5547：typecheck、arch:check、默认1046/1046、build、Chromium154/154全部通过，5项statusBefore/statusAfter均空。原始日志gzip及SHA在gates/results.json。后续只新增评测编排／配置与报告，不改产品、Prompt、Schema、Guard或站点；实际Loader、子进程及分析器离线导入检查通过。

## 冻结配置与新鲜见证

执行包8b39bd76及freeze.json固定348项SHA；使用官方单案例Runner入口，每次独立进程，绝不调用并行批量入口。500秒／50模型／40Google，Google计数包含该slot预检；默认生产100上限由显式40参数收紧。整批最多6Live／300模型，3a′总8Live／400模型／2环境重跑。观察器只计数、保留原错误，不改变模型、Guard、状态或来源选择；健康重试仍保持原5分钟等待，并保守计入环境额度。

11-04、11-07正文与已批准的停止点2字节完全一致；本次CET运行日10-25分别+10天、+13天。参考时间只更新运行信封，criteria不变。未来日期窗口越界须重新冻结及认证。例03保留Kudanshita／人工800m／800–1000m环带未知口径，无见证。

采集脚本先提交冻结，再执行公开详情＋四参数find_vacancy共2GET，均200，间隔5.010182秒，无Cookie、登录、表单或模型。Dengana身份、201.545m、Kushi-age及2026-11-04 19:00两人槽位再次通过，WITNESS_EXISTS。原响应与SHA在certification-prelive/，Git采用无损gzip。此轮新增GET2，连同停止点2旧GET共享累计4；模型／Google／Live新增0。见证只可在本次观察后24h内使用。

## 每slot执行与安全门

control.py slot只启动一个官方单案例CLI子进程。第2–6个slot必须有前一个结果SHA绑定的独立四层评价及声明／边界S0均ABSENT gate；存在STOP-S0文件即阻断。不可覆盖slot目录、不自动重试，模型／Google传输在请求前计数，所有attempt及失败入共享账本。500秒正式截止由既有Runner管理，外层仅保留清理余量；外层中断不冒充正常产品超时。

每个slot结束后，control.py post-get立即对所有已展示Tabelog门店做同样四参数公开GET，保存原字节/SHA，核对所有展示时段及日期／人数。缺失时段直接S0停批；无可读响应保持NOT_EVALUATED，不能放行。TableCheck展示另核对实际原始trace，不拿生产eligibility自证。analyze.mjs复用当前独立Evaluator34/rubric30，加入原始post-delivery观察和原始见证oracle，形成四层评价、时间分解、用途模型耗时、见证漏斗、呈现与首次合格证据时刻。时间指标缺字段会明确留空，不编造；首合格定义为独立支持的实际交付证明集首次齐备，不声称覆盖未展示候选。

录制开启诊断DOM与Google原始响应。统计按页可回放比例、失败原因分布及未捕获script的origin+path（无query）。实际模型观察中合法LOCATION绑定Akabane或Akabane Sta.控件若从未被提议使用，单列并附诊断DOM路径；只记录DOM线索的情况仍需人工核验，不猜控件可用性。

每份录制由F2④b run-recorded-read.ts ORIGINAL原样回放，独立进程加OS禁止网络出站；回放清单先提交，缺输入明确REPLAY_INCOMPLETE，不补造、不算Live、不调用模型，不改原始结果。

## 执行前凭据阻断（已由用户授权解除）

终端没有导出的DeepSeek／Google密钥。尝试仅输出配置布尔值的主工作树.env加载检查被自动审批拒绝，命令未执行；没有读取或输出任何密钥。原因是此前“不读取.env”的用户限制仍有效，凭据读取副作用未获具体授权。已向用户请求仅这6个已批准Live受控Runner的显式例外，或改由运行进程环境提供密钥。此前不使用替代路径绕过拒绝。

本次不合并／推送main。已授权的准备、门禁、见证均完成；收到凭据方式确认后继续六slot，完成后才停在停止点3。

## 执行进度（2026-10-25 01:46 CET）

用户直接答复“允许这 6 次受控 Runner 加载该 .env”，授权记录见credential-authorization.json；仅各受控子进程加载，不展示、复制或暂存。slot1正式500.338秒截止，无交付；43模型、5Google、0环境重跑。独立S0声明／边界均ABSENT，四层审查及人工见证漏斗补充已保存，gate仅准许继续，不代表产品验收通过。F2④b原样回放REPLAY_INCOMPLETE，在首个Google结构化响应停止；记录器KEY_PATTERN_BEFORE_WRITE拒绝生成HAR，未作网络／模型回退。slot2首次Tabelog健康检查CHECK_TIMEOUT，进入既定300秒等待，计环境重跑1；未正式运行。
