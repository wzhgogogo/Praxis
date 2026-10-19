# Google-only nearby correction after checkpoint A

Evidence status: exposed development evidence; L0/L1 controlled transports only.

A10完成并提交52ff459之后才实施Google-only nearby局部修正：地点规划输入不把nearby当成地点名，已规划Google Text Search复用现有去除nearby的area值。命名地点、权威坐标／半径、HARD和交付规则均不变；未修改P2-1a冻结工作树、Prompt、Schema或Gold。

生产createLiveReadAssembly入口＋脚本模型＋受控Google传输先红后绿：带来源／观察时间的有效坐标Fixture中，旧版location=nearby／local food nearby，新版空地点／local food；命名地点对照和坐标约束、intent不变通过，意外浏览器访问被测试拒绝。最终有效红灯nearby/red-typed-fixture.log，绿灯green-typed-fixture.log。原始缺失类型标注及两个依赖nearby字面量的旧组合失败日志保留；仅将h003/h005 SYNTHETIC_CONTROL检索匹配元数据改为通用restaurant，不改任何来源事实或Gold，既有五案组合恢复通过。

最终五门禁typecheck/arch/build通过、默认943/943、真实Chromium117/117，日志nearby/gates/。本项0真实模型／Google／来源／探测／整单Live；总量保持198/450模型、31/42探测、79Google。证明仅L0/L1受控组合，真实A仍用209ac42，效果和限制见A报告；不开始P2-1b或完整Live。按用户授权推送后停止待独立复核，推送以Git回执为准。

- [Valid typed fixture red](red-typed-fixture.log)
- [Valid typed fixture green](green-typed-fixture.log)
- [Existing five-case composition green](green-existing-composition.log)
- [Five gates](gates/results.json)
- Intermediate fixture type and stale query-matching failures retained in intermediate-* files; no factual source or Gold changes.
