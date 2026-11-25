# Unified Round 13 离线验收

2026-11-20。工作树 `/private/tmp/praxis-3c-unified`，分支 `codex/feat-web-photos-unified`。

- 基线 `3f1a60cff5dbf59655808561ef3f1a2a8cb2de6d`
- 唯一验收 SHA `312d53531eaac915e15d4b32437a9158d36f1e70`
- 证据提交 `23dcfd95ff09139645072dcc5239b7d3c185df7b`

## 卡片、胶囊与 About

- 条件状态紧随名称，实测间距 12 px。预约按钮间距和主要字号、颜色断言保留。时段以 72 px 等宽格展示，选择后的宽度、位置和字重保持一致，原预约链接仍绑定各自时段。
- 卡片隐藏地址及坐标匹配内部理由，保留用户可读的 Fixture 理由。分类对照按 NFKC 与大小写归一，每来源展示最多 3 个短词，过滤换行、句末标点和超过 40 字符的片段。About 可看到同一份未经裁剪的来源原文。
- 变更说明在进度下方及卡片上方，展开后仍可读，Slice 2 验证侧栏收藏更新与未发送草稿独立。
- 可选条件和预算均可通过原消息入口删除。验证已持久化的 `intentDraft` 与胶囊同步移除，四种必填胶囊编辑框没有删除按钮，底部草稿保留。
- 待答问题来自实际 HTTP/SSE Case，排在 About 问答区顶部。发送按钮禁用并显示加载，刷新按钮只有禁用状态。原有实际刷新加载态通过回归。
- 问答使用浅底圆角块，问题加粗，最新的在前。来源默认折叠，打开后可见摘录和东京时间。提问接受后清空相同输入，等待中另写的草稿和失败请求的原文均保留。

冻结前的初次预检覆盖了旧坐标理由、时段字重断言和来源折叠变化，相关回归在冻结前复跑。 [初次定向日志](preflight/focused.log) · [相邻用例诊断](preflight/neighboring.log) · [定向通过日志](preflight/pre-freeze.log) · [Slice 2 复跑](preflight/slice2-recheck.log)

## 五道离线门禁

| 门禁 | 结果 | 秒 |
|---|---|---:|
| Typecheck | 通过 | 0.638 |
| Arch Guard | 通过，0 个违规依赖 | 0.207 |
| 默认回归 | 1775/1775 | 75.884 |
| Browser Fixture | G2 5/5、Chromium 443/443、G6 assembly 159/159 | 418.895 |
| Build | 通过 | 0.546 |

五项门禁使用同一净树冻结提交，退出码均为 0。Browser Fixture 的 G2 与 Chromium 合并摘要是 448/448，新增 Round 13 Chromium 回归 5/5。非浏览器门禁和独立视觉运行通过 OS 沙箱禁止非回环出站，浏览器总门禁走回环 Fixture，Replay 子进程自行启用 OS 断网。各入口使用环境白名单。 [门禁清单及耗时](gates/manifest.json) · [验收记录](acceptance.json)



## 视觉验收与逐张检查

- 正式视觉 **16/16**，390×844 为 7/7，1440×900 为 7/7，960×900 为 2/2，41 张截图，32.402 秒。 [正式清单](formal/manifest.json)
- Style 1 **6/6**，6 张，7.759 秒。逐尺寸断言状态紧随名称，按钮间距 12 px，各尺寸未发现非预期 console 或 HTTP 异常。 [Style 1 日志](style1-driver.log)
- 状态回归 **28/28**，22 张，30.469 秒。 [状态日志](states-driver.log)

| 截图 | 目检 |
|---|---|
| [桌面条件行](style1/style1-1440x900-available.png) | Confirmed 与 Not a match 都紧随条件名称 |
| [两行时段](states/round13-two-row-slot-grid.png) | 390×844 下两行左边界对齐，第二行所选时段清晰 |
| [卡片上方变更](states/round13-revision-above-card.png) | 展开的移除说明在首张卡片上方 |
| [来源分类与推荐](states/round13-compact-source-categories.png) | 卡片仅显示简短分类和可读推荐 |
| [可选胶囊删除](states/round13-optional-chip-remove.png) | 删除控件位于行内编辑器，底部草稿还在 |
| [About 待答](states/round13-question-pending.png) | 等待提示排在已有答案之前，刷新文字保持 |
| [About Q&A](states/round13-question-history.png) | 最新问题在前，圆角浅底分块，来源默认折叠 |

1440×900 的条件截图中，固定输入栏仍贴近翻页区，与 Round 12 同尺寸截图一致。

## 保护与停点

保护面比对通过。覆盖主工作区和 closeout 的 HEAD、状态、索引与跟踪内容，主 `.env` 摘要，以及 Prompt 15、搜索指纹和必填项判断的源文件。所有 1521 份启动前的 Unified 材料和 70 份走查材料通过 SHA-256 核对。期间出现的独立复核输出单列记录，未纳入本轮提交。Domain、Agent Loop、Reducer、来源提取和评分路径均与基线一致。110 份本轮产物已核对哈希。 [保护记录](protection-check.log) · [产物哈希](artifact-sha256.json) · [报告哈希](REPORT.sha256)

本轮为本地 Chromium Fixture 验收。浏览器、回环 HTTP/SSE 和 PGlite 已退出。没有运行 Live、连接真实 PostgreSQL、使用 4312 或进行真机验收；全部提交留在当前分支本地。
