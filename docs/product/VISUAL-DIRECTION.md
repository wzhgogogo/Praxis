# Praxis 视觉方向

- Status: Draft
- Document revision: 0.9
- Last updated: 2026-10-30
- Source of truth for: Web 界面的视觉规则；不覆盖 Accepted PRD、ADR 或当前实现状态
- Related ADRs: [ADR-0049](../decisions/0049-source-bound-b1-booking-handoff.md), [ADR-0050](../decisions/0050-two-line-handoff-presentation.md)
- Related documents: [MVP PRD](MVP-PRD.md), [User Flows](USER-FLOWS.md), [Agent Gateway and Workspace](../architecture/AGENT-GATEWAY-AND-WORKSPACE.md), [Booking Design Draft](BOOKING-DESIGN-DRAFT.md)
- Evidence status: 第1段已复核并快进合main4cbc521b；第2段工作分支局部Fixture实现，空结果续查待决定，不是Live能力证据；状态见[第2段计划](../WEB-WORKSPACE-SLICE2-PLAN.md)

用户 2026-10-29 选定“合并版”：白底，柔和阴影分层，实心群青胶囊按钮。[画布](https://claude.ai/artifact/VniECP5jzidQmknLSFyryM)是虚构示例，早于视觉规则0.2的收紧；冲突时以本文视觉规则为准。参考“合并版3候选 / 4订法”；开始、查找中及侧栏参考“群青 · Wabi式”和“A2安排列表”，不能据画布推断真实照片、进度数字、条款或预约能力。

来源为`codex/docs-frontend-design-inputs`提交`947e741b093eecd0035ebbe9401195db029920eb`的视觉原稿0.2，原`design/VISUAL-DIRECTION-20261029.md`已归到本文件。本文0.5在第1步开工时将范围和验收移至独立切片计划，0.6仅同步离线实现状态；第0步复核小修继续有效，颜色、字体与分层规则沿用0.2，出发提示与证据文案按本轮决定及ADR-0050更新。用户在本轮明确确认：等宽字体只用于logo，信息用间距分隔；任务指令中数字/来源/进度使用Mono及文案中的中圆点不沿用。

界面语言：英文（第一版）。

## 原则

- 页面文字只留做决定必须的。能用位置、结构表达的，不写说明。
- 每屏只有一个群青实心块，就是主动作。
- 颜色来自照片；界面本身只有白、蓝黑字和群青。
- 科技感来自 Praxis 工作时的动效和精确的数字，不来自装饰。
- 细节宁少勿多：一个元素只用一种分层手段。

## 颜色

| 用途 | 值 |
|---|---|
| 底色 | `#FFFFFF` |
| 文字 | `#15172B` |
| 次要文字 | `#5F6275` |
| 页内浅底 | `#F5F6F9` |
| 群青：主按钮、logo 光标、进行中、推荐 | `#3D5AFE` |

已排除：暖白陶土与杏色（像 Claude）、朱红与珊瑚红（撞 Airbnb）、明黄（撞美团）、天青（冷）、紫和紫色渐变（AI 通用）、淡金暗金（按钮弱、像酒店）。

## 字体与字号

- 字体：Geist；中文回退 Noto Sans SC。
- 等宽字体只用于 logo。价格、时间等数字用 Geist 的等宽数字（`font-variant-numeric: tabular-nums`）。
- 字号只用四种，最小 13：

| 字号 | 用途 |
|---|---|
| 24 | 页面标题、店名、首页问题 |
| 17 | 方案名等卡片内标题 |
| 15 | 正文、按钮、输入框 |
| 13 | 次要信息、来源与时间 |

- 字重只用 400 和 600。
- 不用斜体，不用全大写，不用 Emoji。

## 分层、线条与圆角

- 卡片、输入框、照片用单层柔和阴影；不同时加边框。主按钮不加阴影。

| 对象 | 阴影 |
|---|---|
| 卡片 | `0 8px 24px rgba(21,23,43,.08)` |
| 输入框 | `0 6px 20px rgba(21,23,43,.08)` |
| 照片 | `0 8px 24px rgba(21,23,43,.10)` |
| 小胶囊 | `0 2px 8px rgba(21,23,43,.08)` |

- 需要分隔线时统一 0.5px `#E3E5EC`；能用间距分开的不加线。
- 不用半透明叠色、毛玻璃、背景渐变。
- 圆角：照片 20，卡片 24，按钮、输入框、小胶囊为胶囊。嵌套时用同心圆角：内层圆角 = 外层圆角 − 内边距（卡片 24、内边距 16 时，内部块为 8）。
- 图标统一 1.5px 线宽。

## 组件

- Logo：`praxis`（Geist Mono 600）+ 群青方块光标；Praxis 工作时光标闪动，其余时间静止。
- 主按钮：群青实心胶囊，白字，高 52。
- 发送按钮：深色圆形。
- 备选：照片右上角白色圆形书签图标。
- 证据：已查实用实心小方块，后面是来源与查看时间；未查用空心小方块；进行中用群青竖块。只在有证据时显示。
- 条件：按用户2026-10-30第2段决定，持续显示为可点的小胶囊，覆盖原“确认后收成文字”条款。只有Draft明确标记的推测条件加问号；当前INFERRED_CLOSED_PARTY人数显示4 guests?，不能自行判断Evening等推测。
- 无照片：浅底 + 店名首字 + “No photo”。
- 并列信息用间距分开，不用中圆点或竖线当分隔符。

## 文案

- 平实、短，用常用词，不造词，不拟人化，不写营销口吻。
- 不加眉标、章节编号、面包屑、解释性副标题。
- 按钮写动作本身：“Choose this”“Continue on TableCheck”。
- 遵守预约草案的措辞：只写 “filled in”，不写 “selected”“booked”。

## 动效

- 只在状态变化时出现：进度逐条出现、数字更新、结果卡片出现、光标闪动。
- 时长 150–250ms，ease-out；不做页面滚动触发的动效，不做弹跳。

## 不做

- 斜体、全大写小标题、眉标、章节编号、代码面包屑
- Instrument Serif、Space Grotesk、Bricolage Grotesque
- 等宽字体用于 logo 以外
- 多层阴影、边框加阴影、半透明叠色、毛玻璃
- 紫色渐变
- 卡片左边缘的彩色竖线
- 中圆点分隔符
- 下拉小箭头
- Emoji
- 超过四种字号、小于 13 的字
- 首页超大标题
- 堆砌说明文字、详细过头的图表

## 待验证

- 真实来源照片（偏暗、杂乱、缺图）下的效果；画布上有模拟的压力测试。
- 英文文案下的排版。
- 夜间模式、桌面布局。
- 回答浮层、备选列表、比较页。



## 英文文案

以下保留用户指定的英文语义。信息间用布局间距分开，表内`/`只区分阶段或可选回答，不作为实际界面分隔符；不用中圆点、竖线或斜体。店名、时间、数量、来源、价格及方案均是条件化示例，必须替换为真实状态或Fixture明确提供的值。

| 位置 | 文案 |
| --- | --- |
| 首页标题 | What do you want to plan? |
| 首页占位 | A quiet dinner with friends in Shibuya on Saturday |
| 工作区输入框 | Adjust anything? |
| 抽屉标题 / 新建 | My plans / New plan |
| 推测的条件 | Evening? |
| 进度 | Finding places / Places found / Checking availability 1 checked；查找中不显示候选总数，结束后卡片显示1 of 3 |
| 停止 | Stop |
| 备选 | Saved；有备选时显示Saved加间距和数字，数字为#5F6275；0不显示数字。书签aria-label：Save for later |
| 主按钮 | Choose this |
| 证据 / 未查状态 | 第一行：Available Mon, Nov 2 19:00；第二行：TableCheck, checked 14:32；未查：Not checked |
| 推荐 | Recommended（群青）加间距加TableCheck（正文色#15172B） |
| 出发按钮 | Continue on TableCheck ↗ / Date, time, 3 guests filled in |
| 提示 | Pick Omakase Nigiri ¥9,800 and Counter |
| 返回 | Did you get the booking? — Yes / Not yet |
| 无照片 | No photo |

## 第2段组件与文案（2026-10-30）

详情只保留主输入框，placeholder为Ask about this place，其他需求视图为Adjust anything?。回答使用纯白底部面板与单层柔和阴影，顶部一行店名，再放原答案、来源及G1确认提醒；外点或下滑收起。You asked按店展示已有问答，最新在上，无第二输入框。

修改条件后的计数用两个文字块加间距：2 removed、1 added；明细只列店名和结构化原因Over budget / Doesn't match the new time / No longer matches。备选保留，不合格条目下方显示同一原因。批末卡Any of these work?，Saved加次要色数字、Adjust为文字动作，Find more是唯一群青主动作。

错误/空结果文案沿用用户指令：Nothing matched yet.；Some sources couldn't be checked.；Couldn't reach the sources. Try again?；Couldn't read that. Try rephrasing?；Reconnecting…；Check availability again。每项必须有确定信号与真实下一步，无后端准入的动作不假装实现。当前实现与停止点见[第2段计划](../WEB-WORKSPACE-SLICE2-PLAN.md)。

来源与查看时间只有在对应证据存在时才出现。`Not checked`是诚实的未查状态，不附虚构来源或时间；不能伪装为已查实证据。来源原始引文可保留原语言，其标签和解释使用英文。

出发按钮的第二行描述同一按钮已带入的字段，不是另一个操作；只有通过ADR-0049校验的字段才可出现。不能用URL参数推断来源页面实际已选中方案/座位，出发按钮和提示不使用`selected`或`booked`。

表内`Pick ... and Counter`仅在对应同店同渠道原文支持时显示，独占选择项一行；TableCheck的`Check date and guests`独占核对项一行。两行均按适用证据显示，不填空白占位；出发提示不使用`selected`或`booked`。日英取消冲突的`Confirm cancellation terms on the website`移到推荐卡片的取消规定旁，与两种原文和英文转述一起显示，不再占出发提示行。此呈现变更见ADR-0050，来源、证据和不裁决严格程度的边界仍按ADR-0049。

2026-10-30用户复核小修：日期统一`Mon, Nov 2`格式；取消冲突仅保留确认提醒，去掉`Cancellation terms differ…`展示行，原双语条款/原文保留。工作区底部按固定输入框的实际高度及底部间距留白，滚动安全区同样避开输入框，长条款下两个出发入口必须完整可见、可点。

详情中的旧`Ask about this restaurant`输入框暂留；下一段并入主输入框，以当前查看对象隐式指代。本段不改这条单店问答路径。

## 实施计划

<a id="第一段验收与停止点"></a>

第一段范围、验收与停止条件已移至[Web Workspace Slice 1 Plan](../WEB-WORKSPACE-SLICE1-PLAN.md)。本文只维护视觉规则和英文文案；保留本锚点供历史复核链接定位。
