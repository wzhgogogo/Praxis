# Round 22：问答结算与搜索过滤离线收口

2026-11-22。draft / not integrated；本地离线开发证据，非 Clean Holdout、非实机或 Live 验收。

- 工作树：`/private/tmp/praxis-3c-unified`；分支：`codex/feat-web-photos-unified`。
- 起点：`bca587fc2c7d2bf5c01f65be828d6a7da838281d`。唯一最终验收源码与输入冻结 SHA：**`a3d8412bade34c7018fcdfeb8768fdc974395515`**。
- 输入初次冻结：`6e6116b8f7f1c4541b996148aaffbf536d434003`，其 `src` tree 与起点同为 `cc7e22ce8065698cfcca6ede2a95acb1f781349d`。新增正式回归输入提交 `ac87108976c03b4a347e673d53985ff2582f6e68`；最终输入以唯一验收 SHA 中的脚本与测试为准。原 15 行 Google 输入及预期保持，新增 6 行另计。
- 最终 HEAD 为**包含本报告与证据的本地归档提交**，完整值在交付回复中记录；可用 `git log -1 --format=%H -- .eval-artifacts/3c-unified-20261117/round-22/REPORT.md` 定位，避免报告自包含其提交哈希的不可能循环。归档前冻结验收树干净；归档后复核生产源码零差异、分支与净树状态。

## 逐项结果与证据

| 问题 | 基线实际结果 | 修复版实际结果 | 证据 |
|---|---|---|---|
| P1：受理问答被等价编辑/换区覆盖 | 原双尺寸准备期等价编辑均在重载后遗留无工作者的待答状态；原 4 路脚本 2 通过、2 失败，其中原换区表面通过但 history 为空，旧问答历史丢失 | 准备/执行 × 等价/换区 × 两尺寸 8/8，全部最终 PRESENT_RESULTS；两请求 200；原身份唯一 CANCELLED 先于后继事件；重载不挂起 | [基线 UI](baseline-question.json)、[最终 UI 8 路](f1-ui-overlap.json)、[事件与集成回归](final/gates/test.log) |
| P2：共享谓词删 beer | 原 standalone 6 路只有 supported 对照 2 路通过，coordinated/has 四路失败 | 同 6 路 6/6；正式双尺寸用例各经过 8 条正常编辑旅程，检查下一笔实际搜店请求；纯测试覆盖 11 种谓词及 beer 首尾 | [旧请求](baseline-query.json)、[新请求](f2-clean-inputs.json)、[正式浏览器](final/gates/browser-fixture.log)、`open-ended-target.test.ts` |
| P2：连续日文地区/条件残留 | `銀座の寿司店` 换区或删寿司均残留撤销词，补充探针 0/2 | 两尺寸真实请求及 Google 本地假传输 textQuery 包含渋谷/寿司店、移除独立銀座；删除寿司保留銀座；東銀座駅复合名保留 | [旧日文结果](baseline-japanese.json)、正式 Round22 UI 与 query 单测 |
| P2：否定甜度误作正向店型 | 原 `negative-also-in-query` 普通搜索及详情错误保留 Age.3 | 原行通过：普通晚餐排除；点名与明确甜品对照保留；允许结果均有事实证据且无虚构负向违规 | [原矩阵](baseline-google.json)、[最终矩阵](f3-adapter-extended.json) |
| P2：HARD 整类排除别名遗漏 | places/stores/sandwiches/cafés 等原 5 行失败；原矩阵共 9/15 | 原矩阵 **15/15**；新增缺主类型、coffee shops、bakeries、tea houses、先否定再明确甜品、HARD 程度共 **6/6**；拒绝详情核对 GOOGLE_PLACE_TYPE_UNUSABLE | [Google 日志](final/acceptance/f3-adapter-extended.log)、最终 21 行 JSON |

新增同生命周期交错回归逐项独立于原矩阵：

1. **解释失败 / 冲突**：FAILED 或 NEEDS_INPUT 前原问答唯一取消终态；Case 可重读。正式 PGlite 集成测试覆盖两者；模型失败同时有双标签 390/1440 浏览器结果。
2. **第二问**：另一已登录标签通过公开 `/questions` 发起合法第二问（保持待答时原 UI 禁用规则），原问题先唯一结算，第二问 ANSWERED，历史两问；原 requestId 旧版本重试不增加事件。双标签刷新后都无待答/Stop 残留。
3. **收藏赢过编辑**：暂停到编辑 dispatch 边界，再经公开 HTTP 收藏落库；收藏 200、编辑 409，原问答 ANSWERED，完成 1 / 取消 0。反向顺序由正常取代用例证明。非法后继在同事务内回滚取消，原问题仍能回答。
4. **系统答案先提交**：仅 SYSTEM 完成推进版本，编辑使用实际受理版本仍 200，原答案不被改写。第二问先正常完成和先取消的原 HTTP 对照继续通过。

**精确受理补验**：已落库、未登记句柄的旧请求，以及不取代问答的空编辑，在候选 `01b6553ce` 源码上均复现不当启动（0/2）；独立输入提交 `b81f116e3`，原 [红测](admission-ownership-red.log) 与 [元数据](admission-ownership-red.json) 保留。限定应用层修复后，两者均不启动旧工作，来源调用为 0，只有真正后继/原问题在解除暂停后运行一次；原问题保持唯一终态、两问历史/单问对照正确。连同原 8 生命周期、3 G1/B1 对照及下面的接替准备期回归，定向 **14/14**。[13 项前序绿测](admission-ownership-green.log) · [最终 14 项绿测](successor-preparation-green-final.log)。新测试的类型引用路径在预检时更正，`admission-typecheck-fixed.log` 通过。

[新增双标签 8 路原始记录](f1-interleavings.json) · [逐项事件身份/次数/顺序核验](event-order-audit.json) · [正式生命周期 8 用例](final/gates/test.log) · [首次基线新回归](baseline-new-manifest.json)。基线新增生命周期 8 项为 2 通过 / 6 失败，两个原本通过的答案先提交/非法后继对照保留；query 与双尺寸浏览器也保留原始红测。基线记录中的手写 productionSHA 后缀有误，原件未覆写；[溯源更正](baseline-provenance-correction.json) 记录实际短引用解析出的完整 Git SHA 与一致的源码 tree，错误字符串不是可执行 Git 对象。

## 实现与边界

只改四个获准生产文件。应用层对已受理问答的结算与后继事件使用同一个 task 行锁事务：最终版本/用户事件检查、原问题取消及后继写入一同提交，非法后继全部回滚。事务提交后只中止绑定原 task/requestId/readRunId 的问答句柄；不以共享 readRunId 误停新的编辑。问答句柄登记也在同一 task 行锁下重新核对原问题仍未结算且身份一致，防止已提交受理、尚未登记的旧请求在恢复后夺取后继准备槽位；空编辑仅记录消息，不启动或接管待答工作。合法语义接替全程沿用准备期登记，避免旧问答退出、新句柄尚未登记时被并发读取误判进程中断。Reducer 拒绝直接覆盖未结算问题。系统进度允许范围保持入口原有准入/版本检查；真正过期用户操作仍 409，幂等请求先返回原结果。

查询维护只修 OPEN_ENDED 继承查询，显式 target（包括清空）、SPECIFIC_OUTLET 及目标属性对照保留。Unicode 折叠只用于匹配，输出保留 café 原拼写。Google 类别过滤只将结构化 HARD 整类排除用于硬拒；局部否定不产生虚假正向店型，SOFT/UNSPECIFIED 与程度描述不作硬拒证据。

## 冻结后五门禁

| 门禁 | 实际结果 | 秒 |
|---|---|---:|
| typecheck | PASS | 0.624 |
| arch-check | PASS，0 违规 | 0.200 |
| test | 1835/1835 | 67.885 |
| browser-fixture | G2 5/5；Chromium 501/501；合计 506/506；G6 159/159 | 456.183 |
| build | PASS | 0.570 |

[最终门禁 manifest](final/gates/manifest.json)。全部同一 SHA、执行前后净树、不加载 `.env`。非 Browser 门禁及独立回放/视觉用 OS 阻断非回环外连；Browser Fixture 按离线注入边界运行，不外套 sandbox-exec，Replay 子进程沿用自身 OS 断网隔离。G2、Chromium、G6 分列；聚合 506 不是新增独立用例。Round19 **10/10**、Round20 **8/8**、Round21 **6/6** 均纳入正式 browser gate，覆盖四个恢复入口及 resolved-old-lock 对照。

首次冻结 `1ff1d1fec4ccb7c061e140dc1985af258c174a03` 的默认测试 **1829/1832**，按门禁顺序停止，原 [失败日志](gates/test.log) 与 manifest 保留。两个旧用例在等待已退役私有取消边界，已迁到实际提交边界且结果断言不变；另一个暴露 B1 语义准备句柄被旧问答 runId 自取消，已用明确问答身份修正。定向 11/11 后重新冻结。

中间 `6a42bfbfd1c4ad30245ce9094cbcfa1ccd5e40df` 的五门禁已全部通过，保留于 gates-final；补充双标签脚本预检另暴露清理句柄命名冲突和缺少必填 viewContext 的 400，修正的是验收配置，没有改产品断言/源码。原日志与 f1-interleavings-fixture-failure.json 保留。补充输入提交后，`01b6553ce` 全套门禁、回放和视觉均通过，保留原件。最终收尾补验进一步发现指令要求的精确受理/非取代边界，上述两条红转绿后重新冻结为本报告唯一验收 SHA，完整结果当时独立写入 closure/。

目检还发现执行期换区两路实际落为 FAILED：接替分支缺少准备期登记，GET 将提交后、句柄登记前的空窗误判进程中断。具体原因由 [只读诊断](closure/overlap-failure-reason.log) 确认，严密暂停点在未修复源码上复现 FAILED 而非合法 UNDERSTANDING（[同输入红测](successor-preparation-baseline.log)、[代码与输入 SHA](successor-preparation-baseline.json)；最初诊断测试将合法阶段写成 SEARCHING，后改为精确的 UNDERSTANDING，仍在旧生产代码上失败）。限定应用层接替分支沿用 withPreparingRead，双尺寸输入也收严为最终 PRESENT_RESULTS；定向14/14 后最终重新冻结，五门禁和全部回放/视觉完整写入 final/。旧 gates、gates-final、gates-acceptance、closure/ 及原正式/Style1/状态输出全部保留。本次不把首次门禁失败隐去。

## 历史顺序与视觉

按独立报告原入口与顺序，桌面、手机普通 HTTP 的完整历史顺序 **2/2**，另八路双尺寸路径 **8/8**，合计 **10/10**。[完整顺序](manual-user-routes.json) · [其余八路](reported-front-end-paths.json)。范围含大阪条件修改、涩谷啤酒澄清与来源、跨计划草稿/问答/反馈、收藏、换批、About 保持与侧栏活动顺序。所有为离线本地 Chromium 回放，未声称用户真机验收。

| 视觉组 | 用例 | PNG | 秒 |
|---|---:|---:|---:|
| formal | 16/16 | 41 | 32.512 |
| style1 | 6/6 | 6 | 7.919 |
| states | 86/86 | 74 | 129.135 |

正式尺寸 390×844 / 960×900 / 1440×900。121 张正式/Style1/状态截图及 54 张问答、删条件和历史路径关键图，共 175 张，已通过 21 张联系表目检；新增路径索引见 [关键图清单](final/journey-image-index.json)。390px 同次/不同次读取的脚注单行 DOM 几何断言通过，来源、日期、JST 时间在边界内且无水平溢出，两张截图另外单独查看。[视觉 manifest](final/visual-driver.json) · [目检记录](visual-inspection.json) · [同次](final/states/round20-390-same-reading.png) · [不同次](final/states/round20-390-different-reading.png)。

严格 TS 保持 true，浏览器 **18 模块、0 环、0 any/抑制、无反向 import entry**。[依赖图](browser-dependencies.json)。tsx 与 Build **19/19** 同源脚本一致，[产物比对](build-assets.json)；[HTML 与内联 CSS 逐字相等](html-build-comparison.json)，前端生产文件相对基线未变。

## 保护与未测项

[保护核验](protection-check.log) 覆盖主工作区 HEAD/status/index/diff、主 `.env` 哈希、closeout 残余与注册、**10,165** 个旧批次材料及 **110** 个 restaurant-web-read 材料。`intent-state.ts` 整文件哈希保持 `7d14bd2fb2a7d576893d51a2bb9fe7a38e37448c4ba02c84b58edd15f7ed51ab`；missingBlockingFields、搜索指纹来源、事实判断来源、Prompt 15 和历史 Mikkeller 文档/代码保护保持。未新增依赖。[源码范围核验](scope-verification.json) · [本机 sparse check](worktree-check.json) · [所有产物 SHA256](artifact-sha256.json)。

一次用于清理诊断 Node 进程的宽泛匹配命令被自动审批拒绝，未执行；之后精确只读进程检查确认没有残留目标进程，没有扩大终止范围。未阻塞最终验收。Fixture 的 MODE 字段与 fake URL 不代表实际 Live 调用：全程 0 真实模型 / Google / 网站调用，0 真实 PostgreSQL / 4312，未 push、未合 main。真实来源质量、真机浏览器及独立 S0 黄金评审 **NOT_EVALUATED**；历史旧批次不改写为当前能力。完成本轮本地归档后停下。
