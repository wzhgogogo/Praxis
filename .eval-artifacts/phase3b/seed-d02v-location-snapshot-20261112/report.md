# D02-V 权威地点与名称搜索快照：离线简报

2026-11-12 CET；draft / not integrated。分支 `codex/fix-seed-d02v-location-and-search-snapshot`；源码冻结 `5a2ec0742e78e4c7e3c0ae6b24e692999d1779cf`，未合main。

| 项目 | 修前红灯 → 修后 |
| --- | --- |
| 权威地点 | goal.name为短查询词 → 恢复label；queryLabel仍在目标/目录绑定中。真实20卡片Nakano列表组件优先取得Sumika的观察URI，保留5/10详情上限 |
| 行政区提示 | Prompt24缺少父区一致/回退指导 → Prompt25通用说明已进入模型请求；不含具体地名、URL或动作覆盖。未做真实模型决策验证 |
| 名称搜索快照 | SEARCH之后额外SNAPSHOT → 直接复用searched.snapshot；非busy结果无冗余DISCOVERY采样，busy/challenge现有检查不变 |

定向66项：修前3个目标断言失败，修后66通过。默认1598、Chromium281、G6 159、typecheck/arch/build全PASS，每项后净树；D4/D8回归通过。仓库无verify/test:chromium别名，使用Test矩阵的实际命令（见summary.json及原始日志）。

双基线完整SHA：`ead289450092ccc30798b754d1e0771462bf08bd`、`ca4deca1d67bd6ce795f31d55757583f7bb09258`，新增产品写死扫描均 **0**；原ec839926按用户更正不再作为门槛。

**证据边界：** 目录/rstLst/路径变体是LOCAL_CONSTRUCTION，原DOM/provenance不改；真实录制原路径仍单独验证。D02-V满天别馆8人/12-10/20:30组件44.508s <45s，5次扫描/5快照/5个原动作；末次取消扫描以同店前一541ms投影，不是完整网站JS回放。Sumika真实空位响应仅2人，8人保持不完整，不能声称Sumika8人离线或Live验收。Prompt遵循度与当前网站状态未运行；未新增端到端交付/独立S0结论。

改动文件：产品 `native-restaurant-search.ts`、`browser-action-decision.ts`、`tabelog-browser-availability.ts`；对应 `seed-discovery-recorded.test.ts`、`browser-action-decision.test.ts`、`tabelog-browser-availability.test.ts`；STATUS、DEVLOG、TEST-LOG、月度索引、Capability Matrix。

真实模型 **0** / 网站GET **0** / Live **0**；三份旧种子账本与主工作区HEAD/草稿哈希未变（protected-audit.json）。不加载.env、不合main，分支推送核对后停止。
