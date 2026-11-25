# Round 28 — 3C 终稿离线验收

在 `/private/tmp/praxis-3c-unified` 的 `codex/feat-web-photos-unified` 上实施。基线 `83978838cb514a29d06c69dbafa4235503ded746`（上一轮冻结源码 `98b35466bd0f37f662eabb5750b2f9c43e95fd04`）。唯一最终验收 SHA **`5f8d4344018b9acae8352cd3fa0757f6dad10d2d`**，源码树 **`8e119ea69672583714a46cd0493dc1559a68df5b`**。功能门禁通过，历史原件完整性仍为 **BLOCKED_BY_MISSING_HISTORICAL_ORIGINALS**。本批是冻结离线回归，尚未合入主线。

## 日期护栏与首页

[ADR-0053](../../../docs/decisions/0053-structured-date-edit-and-raw-consistency-guard.md) 取代 ADR-0052 的自由文本补日期和句子级启发式。自由文本的日期选择与是否提议 DATE 由模型负责。已提出的 DATE 必须引用当前消息中的完整词形。相对偏移按可信东京自然日物化，日历日期和无年份月日以完整公历日期核对，错误年份进入 CONFLICT。普通星期同样复用东京日期物化并比较完整日期。以东京 11 月 24 日为参考，周五是 11 月 27 日，传回同为周五的 12 月 4 日也进入 CONFLICT。词边界、限定周及月年跨界均有单测与实际消息证据。

日期胶囊把用户选定的合法目标交给现有编译链。错 raw 或错值按目标更新。漏 DATE 或 CONFIRM/NEGATE 行为进入澄清，现有执行守卫停止读轮。封闭句法只用于胶囊生成的固定命令。相对偏移协议、物化器、Prompt、评分和执行停止守卫保持原版本。

37 组 [实际消息观察](actual-message-observations.json) 等待读句柄退出：20 组实际查位，14 组语义澄清且模型决策/搜索/查位均为 0，一组普通缺地点调用 ASK_USER，一组推荐搜索和一组无操作。8 组 [日期胶囊 Chromium 记录](browser-date-observations.json) 覆盖 CONFIRM、EMPTY、RAW_MISMATCH、CORRECT × 390/1440，等值编辑 0 提交，前两种澄清 0 查位，后两种实际查询 11 月 28 日。测试固定时钟与真实环境日期无关。

GET / 返回 `Cache-Control: no-store`，由使用真实回环 HTTP 的既有服务端测试验证。真机升级缓存行为未验证。

## 七项前端终稿

| 项目 | 离线结果 |
|---|---|
| 中性色 | Confirmed 与 Not checked 为 #5F6275，About 文字为 #15172B，来源链接为 #5F6275。主题蓝用于主操作与指定视觉标记。 |
| 单渠道 B1 | 顶部渠道行隐藏，Tabelog／TableCheck 的主 CTA、正确来源链接和预填提示继续通过既有浏览器测试。 |
| 反馈卡 | 390/1440 的反馈标题和右上 × 共行且有 44px 热区，Yes / Not yet 在下方居中，回到页面仍能提交真实 Fixture 反馈。 |
| 展开与滚动 | 390/1440 的 About、历史 Source 的 left/top 差为 0，底部答复弹层的 left 及 summary.top − sheet.top 差为 0。MODEL_FAILURE 先显示失败再滚到提示，草稿保留。 |
| 时段 | 紧凑网格、等宽且选中不挪位。浅蓝底、墨色字与 1px inset 描边通过浏览器断言，两时段交接仍对应各自链接。 |
| About | 叠合可见 Izakaya 后保留 Sushi、Seafood。展开恢复完整引文及 Tabelog 时间页脚。全部匹配省略类别行。无匹配条件的紧凑页脚仍显示 Categories: Steak。 |
| 触控 | 390 Chromium 从已打开的日期编辑器分别一次 tap 到 Shibuya、18:00、2 guests 和 quiet。实际验证取消、保存后落盘及删除。编辑器排在按钮下方，无 snap 或残留横向位置。 |

[关键截图及逐项对应测试](visual-inspection.json)，包括 [移动交接反馈](handoff-visual/mobile-feedback.png)、[桌面 Tabelog](handoff-visual/desktop-cancellation-actions.png)、[移动 About 折叠](visual/round28-390-about-collapsed.png)、[展开](visual/round28-390-about-expanded.png)、[紧凑页脚](visual/round28-390-about-footer-only.png) 和 [单次触控](visual/round28-390-tap-shibuya.png)。逐项核对了 35 张关键帧的测试名、文件与视口。完整批次共有 70 张 390×844 与 1440×900 Chromium Fixture 图片。

## 同一 SHA 的正式运行

| 步骤 | 实测 | 退出码 | 耗时 |
|---|---|---:|---:|
| typecheck | 通过 | 0 | 0.749 s |
| arch-check | 通过 | 0 | 0.215 s |
| build | 通过 | 0 | 0.596 s |
| test | 1984/1984 | 0 | 102.140 s |
| browser-fixture | G2 5/5、Chromium 603/603、G6 159/159 | 0 | 575.204 s |
| c1-built | 4/4 | 0 | 17.731 s |
| build-assets | 19/19 JavaScript，HTML/CSS 一致 | 0 | 0.202 s |
| browser-graph | 18 模块，0 环，strict=true | 0 | 0.056 s |
| protection | 保护范围无新增差异，旧缺件仍阻塞历史签收 | 0 | 2.767 s |

浏览器内部分母：G2 5/5 与 Chromium 603/603 合计 608/608。G6 159/159 单列。G2/Chromium/G6 分别用时 24645.423、508524.598、41701.251 ms。dist C1 按要求在 Build 后跑，使用同 SHA 编译模块、PGlite 与回环 HTTP/CDP。[门禁清单](gates/manifest.json) 记录逐项命令、输出、状态摘要和耗时。[冻结输入](freeze.json)、[浏览器资产](build-assets.json)、[HTML/CSS](html-build-comparison.json) 和 [模块依赖图](browser-dependencies.json) 均引用同一 SHA。

浏览器门禁由 Fixture 和既有 Replay 组成，Replay 子进程持有原 OS 断网隔离。C1、默认测试及构建后检查按适用阶段运行在仅允许回环的环境中。开发阶段 C1 直连用例暴露共享默认 Chromium 页，改为生产回环服务所用的独立页面配置，保留原故障及健康同伴断言。Round28 延用来源录制字节，修正为合成输入实际包含所引用日期。

两个中间候选的诊断独立归档：`b07d3e1e0` 在发现另外六条需要更新的 Slice 2 断言后中断，`ae5fb9453` 的默认 1984/1984、G2 5/5、Chromium 590/603，因共享合成日期引用和旧 About 可见性断言停在浏览器门禁。三处测试修正后定向 18/18 与 2/2，通过后冻结并从头复跑。最终 SHA 的首次运行另遇 Node 24.4.1 V8 原生 WebAssembly 回收崩溃，`Check failed: end > addr`。当时报告 1931/1932，Web worker 未完成。原始堆栈保留，源码、断言、工具链及环境原样复跑全套。[中间候选和首次原生崩溃](failures/) 不计入最终分母。

## 保护面和未测边界

本轮起始的 14636 条历史基线路径中，11112 份当前文件匹配，现存变更与新增缺件均为 0。Git 仍报告既有 652 条受跟踪删除，另有上一轮记录的 2872 和更早的 137 条未跟踪缺件。每步只允许原有删除集合，源码及冻结输入干净。整树不是净树。保护脚本确认主工作区、主 .env、稀疏规则和 closeout 950 项不变。未还原也未暂存任何历史删除。[保护核验](protection-verification.json)

未加载 .env。Live、真实 DeepSeek 语义、真实 PostgreSQL、远端 CDP、4312、真机手感及真机升级缓存行为均为 NOT_EVALUATED。自由文本日期遗漏、真正的日期竞争及误选合法背景日期需由真实语义评测测量。实时库存和真实来源准确性未评。本轮使用了开发回归和固定 Fixture，不能报告私有 Holdout 或真实来源 S0。仅提交本地分支。

归档后核对 [产物 SHA256](artifact-sha256.json)。验收退出后确认无残留批次或浏览器 Fixture 进程。[进程检查](cleanup-verification.json)
