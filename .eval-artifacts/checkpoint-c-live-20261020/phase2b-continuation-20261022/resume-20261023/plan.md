# Phase2b 见证认证恢复与退出检查

Status: current execution preparation; witnessed source evidence, not product capability results. 前两步已通过；第三步认证与已批准的无见证排除完成；第四步即将按原18槽位执行，第五步仅抽未对应措辞。

用户已指定跳过川上庵13004546。仅登记用户提供的官方预约链接，不打开；不重采已有完整支持的见证。全部HTTP400原始响应和可选诊断JP403保留；该JP诊断按用户收敛指示停止，未发第二次请求，之后Tabelog完整等待15分钟。

六例认证数3、0、1、3、1、1。第02例原地点三家HTTP200但无请求空位，按已承诺fallback胜哄核对六家：两家在800米内但无18:30，四家超出800米。该例按用户批准记无见证/不计能力分母，仍执行其三个槽位，不把网络失败当无见证。排除记录、输入、原始证据按SHA绑定。

最早见证2026-10-22T17:14:00.086Z，总截止2026-10-23T17:14:00.086Z（北京时间10月24日01:14:00.086）。保留原始观察，不以新查询续期。

冻结并推送后运行`holdout-inputs-fallback/plan.json`全部18槽位，不带`--run-ids`。30秒决策、500秒总时限、50模型/40Google、相邻完成到启动>=5分钟；网络和重试、S0立即停批、只读禁/reserve及不点时段均保持。运行后只独立安全检查，能力评价和退出判断等待独立措辞判定。只有ENV_FAILURE/ORCHESTRATION_INTERRUPTED可重跑，每例最多一次，本批最多4次，累计不超过10。

新增仅评测侧缺见证准入：复用原见证门禁；显式排除时重新核验主地点HTTP200无库存、fallback原始商家地理/库存证据和SHA，所有已认证例的最早24小时截止仍约束整批。19项适用离线控制通过；未修改src/web-skills/scripts，原五门禁及69/69、5/5、22/22、预算5行的生产基线仍适用，未新增模型质量测量。

资源累计3340/5000模型、54/100完整Live、3/10环境重跑；本批预留22次/1100模型，余额足够。见证与诊断累计80来源请求、0模型/0Live/0环境重跑。

证据：[第三步四层记录](witness-four-layer-report.md)、[认证登记](registry-final.json)、[预算门禁](budget-before-exit.json)、[本批前账本](ledger-before-exit.json)、[外层19项控制](admission-controls.log)。最终冻结见`live-freeze.json`；运行产物预定`exit-live/`，不覆盖历史运行或评价。
