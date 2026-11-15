# 合入前的分类范围回归抽检

2026-11-15 CET。沿用 8e07fb04 工作树和前批次的十次 DeepSeek 授权，延续账本继承原来的两笔账。本批冻结七个独立单步，一帧一次，不重试。执行器、原生发现的 objective、Prompt 27 和 Wire Schema 16 均保持冻结。产品文件改动为 Tabelog Skill 第 11 行。

| 实际录制 | 预先登记的行为 |
|---|---|
| D01 #8，高田马场与 Spanish，来源明确零结果 | COMPLETE |
| D02-V #7，中野分类入口折叠 | CLICK 已观察的 All |
| D02-V #9，父分类页面入口折叠 | CLICK 已观察的 Washoku |
| D02-V #10，父分类菜单已展开 | OPEN_LINK 到 Other。该链接的可用动作只有 OPEN_LINK |
| 07 开发 r1 #4，首页 | FILL_AUTHORITATIVE LOCATION 到当前地点输入框 |
| D02-V #13，中野 Robatayaki 已应用，来源列表位置 1～2／2 | COMPLETE |
| D8 #28，TableCheck 的已显示目标日期 | CLICK_AUTHORITATIVE DATE 到 2026-11-11 |

用户同意替换不适用的 07 列表帧。R2 07-r1 #12 来自 ac980ef2，查询为 sw=Koenjikita；旧模型报告四家并说明没有看到 yakiniku 分类。第九张 HTML 为 UNSAFE_DOCUMENT，不能独立证明整列表已应用菜系。替换正例来自 0065675a 的公开开发录制，复用 #13 的原模型观察及 snapshot-0010.html。核对标题、列表范围标记及两家实际店铺的链接。全页解析还包含列表外链接，站点显示数量单独以范围标记为准。07 首页使用已冻结的录制 DOM 和控件在当前执行器中投影出的组件输入。原回合文本未纳入。

将真实生产决策类、当前 provider Skill 和原生 objective 应用于冻结上下文。每次发送前向本轮延续账本扣一笔。模型接口仅允许向 DeepSeek 发一个 POST；没有读取网站的客户端。单帧语义或模型输出错误保留 FAIL 并继续其余独立帧，任一 FAIL 即阻止合入。全局 Schema 契约破坏、模型 API 或传输错误中止批次。请求消息只保留哈希。七帧的单步诊断不产生整单或稳定率结论。

TableCheck 的 PARTY_SIZE、TIME 记为 UNCOVERED_BY_RETAINED_RECORDINGS。相关确定性控件和 Chromium 证据沿用 browser-read-tablecheck.test.ts。前批 D01 原 FAIL 和历史账本不覆盖。
