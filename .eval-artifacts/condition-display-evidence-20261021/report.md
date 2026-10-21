# HARD 条件展示证据修复

状态：离线实现与三次来源回放通过，`draft / not integrated`，推送独立分支后等待复核。分支 `codex/fix-condition-display-evidence`，基于 `27b3884aad4f6dfff1b8d139d164b1c6fdf94352`。本分支未合入评测器 @32，也未修改正在运行的检查点 C。

## 版本、提交与冻结

- 实现及五门禁：`f097ab15aeca1ed10426bc67eccb7042b3a9105a`。
- 运行前冻结提交：`740cdc8a80b52fd46a23ec3d5fd612f83048ae09`；[freeze.json](freeze.json) 共 1,352 项，SHA-256 `4e8fd7684a4b6c2a6779735d634aebfc055c695f9ae45dbc12ae8694fb8d305b`；运行前后全部一致。
- 展示 Contract `restaurant-condition-states@3`，Restaurant State `19`，TaskDefinition `17`。这是未发布接口的直接替换，当前调用方和 Fixture 一并更新；没有兼容分支、数据库迁移或重置。已有现实持久化任务须在未来集成时先明确备份与重置/迁移方案，本批没有操作它们。
- Fact judgment Prompt `14`、响应 Schema `4` 及发送给模型的文档内容形状均保持；新增字段角色是解析器私有元数据，不发送给模型。

## 行为与来源接线

Tabelog 现有查位和原生事实读取都从同一门店 HTML 记录课程标题、课程描述、类别及餐段，随已有来源事实传入 Grounding。模型引用来源文档时，只保留其已选择原句中实际出现的字段引文。来源事实、模型支持引用、候选与 URL 仍须对应；当前事实、身份、新鲜度、资格及交付规则不变。

展示使用这些真实原文及字段名，不再把用户条件文字充作 quote。店名、顾客评论及未分类文字不能独立支持 HARD 的 MET；缺少商家字段证明时显示 `NOT_CHECKED` 并说明原因。午餐课程保留 `LUNCH`，不得证明晚餐套餐，解释明确未核实请求时刻的套餐可用性。已有价格字段沿用原规则并标为 `PRICE`。

此切片没有新增 TableCheck/官网的商家字段解析器；缺少可信字段角色的此类非价格事实会保守显示未核对。没有新增来源访问、模型调用或资格接纳路径。

## 红灯、绿灯与五门禁

| 失效机制 | 有效红灯 | 最终证明 |
| --- | --- | --- |
| Kaga 店名及评论被展示为 MET | [原代码 Router→Reducer 红灯](red-router-reducer.log)：实际 MET，合同要求 NOT_CHECKED | 既有 Kaga 引用测试及 c-05 回放转为 NOT_CHECKED；后来来源事实仍正确引用 |
| 条件文字被当 quote、餐段丢失、弱字段误接纳 | [原代码三条红灯](red-quotes-scope.log) | [57/57 相关绿灯](focused-green.log)；字段、午餐限定、同来源、嵌套评论/邻店和原模型载荷边界均覆盖 |
| 页面没有展示真实字段 | 既有 Web Fixture 扩展 | 真实本地 Chromium 显示 `Observed price` 与原始来源链接 |

| 门禁 | 结果 | 日志 |
| --- | --- | --- |
| typecheck | PASS | [日志](typecheck.log) |
| arch:check | PASS | [日志](architecture.log) |
| npm test | 986/986 | [日志](test.log) |
| build | PASS | [日志](build.log) |
| test:browser:fixture | 131/131 | [日志](browser-fixture.log) |

[gates.json](gates.json) 保留各日志 SHA。原始日志空白按字节保留；手写代码、文档、JSON 独立通过 diff 检查。既有浏览器套件在本隔离工作树生成的历史路径报告，已先后备份、核验只包含测试运行值变化后恢复原字节；[出处与 SHA](test-output-provenance.json)。没有覆盖其他工作树的产物。

## 三次 Router → Reducer 回放

使用 [冻结输入](replay-inputs.json) 与 [Runner](run-replay.mjs)，保留原 Live、`27b3884a` 基线及修复后三种视图。源 HTML、快照序号/URL/runtime HTML SHA、录制清单及 result SHA 均核对。仅从保存 HTML 重建本次新增字段元数据，附回原事件副本；原模型标签、引用 ID、候选及时间不变，然后执行真实 Router 的 `PRESENT_RESULTS` 与 Reducer。来源读取一旦发生即报错。

| 运行 / 门店 | 原 Live / 当前基线 | 修复后 | 真实字段与限定 |
| --- | --- | --- | --- |
| c-01 / Shibuya Sushi Sen | MET / MET | MET | `Lunch Omakase Course`，COURSE_TITLE，LUNCH；未验证晚餐套餐 |
| c-01 / Shibuya Sushi Matsumoto | MET / MET | MET | `Omakase Nigiri Course` 及对应课程描述；餐段未指定 |
| c-01 / Sushi Issekisanchou | MET / MET | MET | 午餐 omakase 课程标题与描述，LUNCH；未验证晚餐套餐 |
| c-02 / 两家门店 | 条件均未核对 | 不变 | 没有为不相关条件补造来源 |
| c-05 / Utou | MET / MET | MET | `Seasonal Omakase Course "Katsura" ◆ Kaiseki with Exquisite Ingredients of the Day`，COURSE_TITLE |
| c-05 / Kagurazaka Kappou Kaga | MET / MET | NOT_CHECKED | 分别展示 NAME 和 CUSTOMER_REVIEW 的真实原句，说明二者不足以独立证明 HARD |

完整前后差异：[comparison.json](comparison.json)，逐次产物：[c-01](replays/c-01.json)、[c-02](replays/c-02.json)、[c-05](replays/c-05.json)。[运行日志](replay.log)，[独立复核记录](replay-verification.json)：三次全部通过、候选集合相同、17 条引文独立匹配保存 HTML，状态变化仅 Kaga 一条。

Kaga 的人工见证例外属于评测器输入，未接入产品显示；因此 @32 可以在受限人工认证下判为独立支持，而本分支产品仍显示未核对。`27b3884a` 已修复 Kaga 后来事实的展示漏引，本轮不重复记作新改善。

## 证明范围与停止点

- 离线逻辑/组合：验证当前来源字段接线、展示规则与真实 Router→Reducer 状态转换。三次回放是明确补入新字段元数据的反事实回放，不是完整 Adapter/模型重跑，原录制和 result 均未修改。
- 本地 Chromium：验证本机 Fixture 和 Web 展示；不证明当前网站或现实库存。
- 独立核验：原文匹配、SHA 与候选/来源绑定；不把生产解析器输出自行当作当前网站真值。
- 新增真实模型、网站、Google、Live 和环境重跑全部为 0。没有重新评价正在运行的 C，也没有合并本分支或执行任何预约操作。

推送本独立分支后停止，等待复核决定是否集成；外部表现和整单签收仍需各自证据。
