# TableCheck B1 普通生产组装修复

- Status: current executable / offline local construction；非网站 Replay、非 Live。
- 时间：2026-11-01，维也纳 CET（UTC+1）。
- 基于已发布 B 取页修复 main `fceecaad717eea21f7642f1b0b1cf35b0aea218e` 新建 `codex/fix-phase3b-tablecheck-b1-composition`。
- 用户批准本修复、工作分支推送与完成后通知 A；不合 main。真实模型/Google/网站GET/Live0，不读取或加载.env。

## 当前承诺

普通 `createLiveReadAssembly` 在 TableCheck 已核实同店精确时段并已观察到同店 reserve 入口时，提供 ADR-0049 的 B1 链接及 filled-in 文案。链接只来自现有读取，模型/客户端不提供 URL；生成和展示校验保持。缺乏明确依据时不显示按钮。

先把 A `02d01196` 的 `g6-booking-composition.test.ts` 及其最小 helper/构造页面闭包共5个文件原样导入，逐字 SHA 记录于 `a-imports.json`；原 test、helper、输入与断言均不改。该测试先提交冻结，在原 main 产品上运行，必须得到 `Initial ordinary source cache must produce B1`，且真实持久应用已 PRESENT_RESULTS、EXACT_PHONE、AVAILABLE、2人/2026-11-11/19:00；不是模块/启动错误红灯。

## 最小实现

并列 TableCheck 与原 Tabelog 读取器，而不重构 Tabelog：两种来源的凭据不同，Tabelog 只消费已绑定原响应链接，TableCheck 使用观察到的入口和确定参数。组合仅串接 capture 和聚合 readPrepared，保留原 Tabelog 字节/原行为，避免改变其响应解析与缓存语义。

TableCheck 只旁听已有 snapshot 和 observeControls 返回；收集可见、启用的 LINK href，不另行调用页面读取、导航或动作，不解析私有class/testid。由同次已核实 AVAILABILITY/HIGH 证据、源页URL、日期/人数/精确offer与根任务绑定临时缓存。已带条件的入口有矛盾即拒绝；无条件的同店入口可由已有确定性serializer补入已核实的精确时段。请求宽窗不能充当精确时刻。缓存读取、失效和展示均不增加 I/O，过期/重启/缺范围故障关闭。

不修改 B 的 G3 浏览器/Parser/响应文件，不改 A 其他 eval/harness 文件、领域链接合同、State/TaskDefinition/Prompt、前端。若需要越界改动或版本递增先停报。

## 验证与停止

1. 原 A 整组装测试因果红→绿，断言/输入SHA一致；独立保留实际红输出与绿持久应用产物。只替换模型/来源I/O，PGlite和真实本地Chromium是明确的本地环境，不注入candidate/offer/evidence/prepared handoff制造整组装绿。
2. 新 TableCheck 读取器组件反例：错店、错日期、错人数、错精确时段、宽窗无精确时刻、域名/路径不对、缺/隐藏/禁用链接不显示；保留二次校验、根任务隔离、更新/过期/重启与零新增I/O断言。这些是组件控制，不能冒充真实来源或整组装阴性回归。
3. 旧 Tabelog 普通 HTTP 组装/原链接/缺链错配/隔离等既有覆盖原样运行。
4. 冻结最终输入，五门禁和严格 G2 全绿，每项前后净树；不读取私有Holdout。门禁修复达到既定停止规则、S0、需要真实调用或需动归属外文件时停止，不放宽验收。
5. 同步 STATUS/DEVLOG/TEST-LOG 和11月摘要/索引、Capability Matrix/Domain及报告；共享账本按ID并集不覆盖。推工作分支、ls-remote核对、通知 A 后停复核，不合 main。
