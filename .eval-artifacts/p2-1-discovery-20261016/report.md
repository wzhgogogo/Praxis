# P2-1 第一段（第0–3项）

- Evidence status: exposed development diagnosis；非 Clean Baseline。
- 范围：前置收尾 → 发现探测工具 → 当前策略基线10次 → Proposed ADR-0042。第3项后停止，等用户批准ADR和变体；不执行第4–7项，不推送。
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

待执行。

## 2 基线探测

待执行。草稿日期只用于本段探测，不作为用户已批准Live输入。

## 3 ADR-0042

待执行；必须保持Proposed。

## 用量与边界

本段整单Live上限0；基线探测上限10次（TARGET各2、CONTROL各1），单次15模型／180秒，基线模型上限150；全批30探测／450模型上限不扩大。源页面与四参数GET见证认证不调用模型。不打开预订表单、不点时段、不支付或填个人信息；S0立即停止，产物压缩超过60MB停止报告。
