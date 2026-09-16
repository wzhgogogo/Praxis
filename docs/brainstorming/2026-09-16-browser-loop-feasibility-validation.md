# 现有 Browser Loop 的两站实测

- Status: Draft
- Document revision: 0.1
- Last updated: 2026-09-16
- Classification: draft / not integrated；exposed development Live component diagnostic，不是 Clean Baseline
- Related documents: [前次 CUA 走查](2026-09-15-tablecheck-tabelog-browser-walkthrough.md)、[STATUS](../STATUS.md)、[Test](../skills/test/SKILL.md)

## 实验问题与边界

用户授权执行验证：如果观察、决策、执行、复核的方法有效，是否可以不用 Stagehand/browser-use/Midscene？本次先测未修改的生产组件 `LocalPlaywrightChromium → BrowserTaskExecutor → ModelBrowserReadActionDecision → DeepSeekModelGateway`。没有接入第三方仓库，没有由当前助手替项目模型选动作。

直接从已观察的 141 和八芳公开商户 URL 开始，目标均为 2026-09-19、19:00、2 人，没有预填查询参数。跳过 Google Discovery、Semantic、Restaurant Runtime、HIGH identity 和 Offer 接纳。因此这是浏览器组件诊断，不是完整产品测试，也不是增强观察方案实现后的验证。

每站一次，最多 8 次模型决策、60 次底层操作、180 秒，父级 Abort 收束会话。使用独立临时 headless Chromium，不读取个人 Chrome Cookie。不登录、不接受条款、不提交预约；网络副作用计数未测量。无 Google 调用，模型沿用项目配置 `deepseek-flash`。

## 实际结果

| 来源 | 结果 | 模型调用 / tokens | 耗时 |
|---|---|---|---|
| TableCheck / 141 | 模型选择目标日期，重新观察后页面显示 2 guests 和 19:00 reservation link，返回 COMPLETE；未进入套餐页 | 2 / 11,703 | 19.2 秒 |
| Tabelog / 八芳 | 8 次动作均因 `CLICK_AUTHORITATIVE requires DATE or PARTY_SIZE` 被解码器拒绝；无模型动作实际执行，最终 BUDGET_EXCEEDED | 8 / 72,362 | 81.9 秒 |

合计 10 次调用、84,065 tokens；未配置价格表，费用未知。两站没有重跑。诊断 result 的 `status=SUCCEEDED`只代表记录流程完成，必须结合 `executorStatus` 和独立复核看业务结果。COMPLETE 是交给确定性业务代码检查页面，不是可订或预约成功声明；本次没有产生 Offer。

## 复核发现

1. **已有通用能力确实工作。** 141 日期目标具有 `value=2026-9-19`，操作后 `selected=true`，19:00 时段作为真实 LINK 出现；并非全部依靠固定站点脚本。
2. **观察能力未达到 CUA 走查水平。** 模型正文固定取前 4,000 字，长页面的预约区未完整进入正文片段。Tabelog 每轮暴露 122 个目标，包含大量链接和图片切换，却没有可操作日期目标；此前 CUA 能读取的日历 table/text 没有进入当前四类控件集合。这里描述本次输入，不推断所有日期控件都无法操作。
3. **错误反馈不准确。** Tabelog 的真实校验错误涉及 authoritativeField，但下一轮统一反馈“未引用当前目标”。模型连续重复同类错误。没有保存无效 wire 原文，不能断言它具体填了什么字段或主观原因。
4. **完整流程仍未验证。** 本次没走到跨标签页、套餐限制或确认页。booking/reserve 的代码级拦截仍存在，但不是本次实际触发的首错，不能混报。
5. **不是受控 A/B。** 与前次 CUA 相比，模型、浏览器、观察接口、起点路径均不同，不能把差异仅归因于模型强弱、网站或某个框架。

## 选型判断

可以不引入三个仓库，它们是候选实现，不是必要前提。现有循环已完成局部查询，但尚未复现完整走查能力；本次既不能宣布完全够用，也不能据一次失败决定引入框架。

下一实现切片应按完整预约前调查验收，组合处理活动区域与页面结构、条件值与结果关系、动作反馈、导航和停止边界；不把本次错误收缩为又一个单点补丁。如果少量清晰代码能跨两站工作，继续使用 Playwright；如果通用观察与执行的维护量持续膨胀，再比较上游组件。没有自动扩大预算、改变权限或修复后重跑。

## 证据与验证

本地忽略目录：[实验入口](../../.eval-artifacts/browser-loop-feasibility-2026-09-16/run.ts)。只是此次包装器，不是新增长期生产路径。

- [TableCheck execution](../../.eval-artifacts/browser-loop-feasibility-2026-09-16/2026-09-16T01-11-05-659Z-ef62844c-f9c3-4fff-bd21-fe664e44a0f1.result.json) / [独立复核](../../.eval-artifacts/browser-loop-feasibility-2026-09-16/2026-09-16T01-11-05-659Z-ef62844c-f9c3-4fff-bd21-fe664e44a0f1.evaluation.json)
- [Tabelog execution](../../.eval-artifacts/browser-loop-feasibility-2026-09-16/2026-09-16T01-11-24-853Z-d871e23e-5f55-4eef-a14d-d00b62033eb2.result.json) / [独立复核](../../.eval-artifacts/browser-loop-feasibility-2026-09-16/2026-09-16T01-11-24-853Z-d871e23e-5f55-4eef-a14d-d00b62033eb2.evaluation.json)

记录保留有限公开页面文本、脱敏 URL、模型可见目标、有效动作和用量；无 HTML、截图、Cookie、凭证或无效模型原文。独立复核由助手审阅 artifact 完成，不是既有完整 Restaurant Evaluator 自动评分。两个会话已在 finally 关闭。

Mock：executor / action decision 14/14 通过。真实 Chromium + 合成 Fixture：首次沙箱 MachPort Permission denied 导致 7 项无法启动；获得沙箱外执行许可后 7/7 通过，没有修改源码。文档链接与 diff 检查通过。未运行全量 npm test/typecheck/build，因为生产代码无改动；未运行 Replay、Cloudflare Live、Controlled Live-write、完整业务 Live 或三框架对照。
