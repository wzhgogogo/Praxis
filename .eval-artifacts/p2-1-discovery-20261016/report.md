# P2-1 第一段（第0–3项）

- Evidence status: exposed development diagnosis；非 Clean Baseline。
- 范围：前置收尾 → 发现探测工具 → 当前策略基线10次 → Proposed ADR-0042。第3项后停止，等用户批准ADR（变体已批准）；不执行第4–7项，不推送。
- 起点：按用户要求 `git pull --ff-only` 从3f7027d快进到025940c；复核E1收尾通过（evaluator@29/rubric@25），其13条历史越界证据缺口不回填。
- 比较决定：收集当前发现卡点的可重复基线，供ADR取舍；不是改进后交付验收。未改生产检索策略、Prompt、Schema、Gold、资格、半径或语义目标。
- 用户未提交的INDEX、两份产品设计草稿和三个演示文件不纳入。

## 0 前置收尾

- 正式观察器迁至 `src/eval/restaurant/agent-loop/post-body-audit.mjs`，原文件退役；Chromium与Evaluator测试及当前外层调用方更新，无兼容副本。记录仅类型与请求体SHA，原始值不入日志，准入不变。
- Chromium测试不再读取产物脚本或reviewed-reads文件，使用显式独立fixture语法；增加首个本地响应3250ms延迟重现旧3秒上限。有效红灯 `00-prerequisites/red-receiver-latency.log`：Failed to fetch；修复仅测试请求/导航上限15秒。
- 迁移首轮默认测试暴露另一导入调用方遗漏，日志 `parallel-npm-test.log` 已保留，修复后完整复验。
- 持续两个本地CPU负载进程并行、同时运行npm test，目标用例连续5次绿：`parallel-load-green-1.log` 至 `5.log`。资源均在finally回收。
- 本批外层配置 `outer/`，以P2-0已审核只读规则与E1的0交付补见证逻辑原样复制，未新增任何放行形状；观察器、见证GET逻辑、审核清单、配置SHA记录于 `outer/freeze.json`。执行时另记实际提交SHA；本段不启动整单Live，后半段按其批准的变体/见证完成整单外层配置。
- 五门禁全绿：typecheck、arch:check、build；npm test926/926；test:browser:fixture113/113（221.794秒）。日志与连续负载结果见 `00-prerequisites/gates.json`。提交号由第1项冻结记录引用，避免提交自引用。

## 1 发现探测工具

- Runner：`src/eval/restaurant/agent-loop/runners/run-discovery-probe.ts`；指标与第一批驱动：`discovery-probe.ts`。只调用生产`createLiveReadAssembly`及每个计划来源的一次`search`，不构造查位/事实/交付动作，不恢复第二批详情。原生产检索策略未修改，Pack代码净变更0行。
- 精确输入：最近Live的actual intent/proposal与实际Google地点上下文，从已暴露22条校准包中按原始/gzip SHA校验提取；只将权威date移到批准变体日期。所有非date字段保留，包括原target query中的旧日期文字，不拿Gold替换`kaiseki restaurant`或`tempura restaurant`。日期值以结构字段为准；本段检索尚不使用日期筛选。
- 6份输入与10次计划见`inputs/index.json`、`baseline-plan.json`；独立字面量核对全部criteria，非date字段逐字段相等。正式变体SHA `94d1383d71e6b1e4f589a7ceaab99826ec7a2a0aaa8bf38de8dd52d84d4ad4e7`。本段地点解析不再调用模型，固定最近实际中心/1000m；不把历史估计中心替换成新的锚点。
- 指标由eval计算：source-funnel绑定列表URL中的来源ID、实际进入首批详情的ID、独立坐标距离；全国/启动页不记发现成功，跨来源同ID不合并身份。后续预算中断不能抹去已观察列表，未知坐标不能算半径内；部分失败的半径内计数注明下界。检索无完成列表时解析数/显示总数为null，不填0。
- 第一批、失败调用计入共享15次上限、未到达来源、无查位/事实调用/预约页导航均有同一生产组装+Guard受控来源测试。真实浏览器语义复用完整Chromium门禁，不把受控来源测试称为真实站点证明。
- `arch:check`新增生产→本项探测/见证模块与产物见证文件的依赖拒绝（含type/dynamic import）；保留现有Web产物端口，不扩大到所有eval引用。实际临时生产import挑战触发arch红灯并删除挑战，修复后绿；不会把新见证给生产或模型。
- 六个CLI离线空跑设置fetch禁止，全部PASS/0模型/0网络。有效红灯：`red-production-eval-boundary.log`、`red-arch-command.log`；定向4/4。五门禁：typecheck、arch、npm test930/930、build、Chromium113/113（222.107秒）。之后仅补eval指标保留，最终四条门禁复验930/930；一次沙箱localhost EPERM日志保留，改宿主权限后通过，无产品修复。
- 冻结配置及输入/工具/认证脚本SHA见`probe-freeze.json`，执行记录另留实际提交SHA；第0项提交`6924e0b`，审批合并`218e28d`。第1项提交将由基线开始记录引用。


## 2 基线探测

- 第1项工具提交 `260522e`，冻结见 `execution-freeze.json` / `baseline-freeze.json`。
- 认证UTC 2026-10-16T15:05:55.833Z—2026-10-16T15:06:42.990Z：32次公开GET（16详情＋16四参数库存），模型/Google/整单Live均0。每例认证后有效24小时。全部16原登记店保留，13家合格：h001 2、神乐坂2、KF-H005 1、吉祥寺3、H002 3、中目黑2。未通过的具体原因见登记文件，不把它们当无位。
- 原始库存、最小化店铺JSON-LD/原登记quote当前匹配与源字节SHA、逐店日期/人数回声校验见`witness-certification/`和`witnesses.certified.json`；全部原始库存的base_date与members独立符合请求，不以请求参数自证。未保留整页review/profile，不能静态重建完整页面。
- 尚未开始基线模型请求。10fd06f已同步：用户2026-10-16 22:44批准variants.yaml；除头注外逐字相同。六份输入未提交/未执行时仅更新批准来源与SHA，不改实际语义字段或日期。ff-only因本地第0项提交分叉而失败，正常合并保留6924e0b。

## 3 ADR-0042

待执行；必须保持Proposed。

## 用量与边界

本段整单Live上限0；基线探测上限10次（TARGET各2、CONTROL各1），单次15模型／180秒，基线模型上限150；全批30探测／450模型上限不扩大。源页面与四参数GET见证认证不调用模型。不打开预订表单、不点时段、不支付或填个人信息；S0立即停止，产物压缩超过60MB停止报告。
