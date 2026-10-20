# P2-1c 地区入口：离线切片

- Evidence status: exposed development; no holdout; offline only, pending independent review.
- Base: origin/codex/feat-p2-2-selection @ 7dfeb692dfb04ed5a62c767f9694fc88c493cfb2.
- Independent expectation: 用户本轮指令与 305d1e0「检查点 B 完成复核」。神乐坂属于观察入口 Iidabashi / A1309，中目黑属于 Along Tokyu Railway Line / A1317。Gold 仅在 eval 输入中，不进入产品或 Pack。
- Promise: 缺少同名标签时，用同次请求、原半径内 Google 候选的同源门店链接支持当前页面的地区入口；不猜代码、不造 URL、不改坐标或身份规则。已命名入口不改变。
- Historical fault: 基线及 A/B 的神乐坂错误进入新宿；中目黑部分轮次错误进入目黑。187dfff 只阻止重访，没有首次入口证据；原测试验证观察引用、半径、不循环，没有覆盖“名称缺席但同源链接已经带地区”的正常完成。
- Comparison: 检查全部 54 条已保存开发轨迹，保留失效环境/未到达分母。比较 (a) URL 证据覆盖、原始 Google 阶段等待；(b) 既有地点组成/模型依据能否提供可匹配的站点标签。不调用模型为 (b) 补写成功样本。
- Selected treatment: 仅实现 (a)。当已有标签直接包含请求名称时复用原流程；否则提前读取原计划中同一 Google 批次，并保留原始读取供其原阶段消费，不重复调用。等待计入原来源 90 秒、整单 500 秒和 Google 40 请求额度；不增预算、不加重试。
- Regression: 补强现有 directory-region-selection、native composition 和 browser fixture；先保留实际契约断言红灯。神乐坂/中目黑正常完成，h001、KF-H005、吉祥寺、H002 不退步；跨源、越界、缺坐标、无观察入口不能制造地区证据。原 4/5 越界、换区一次、不重访与请求绑定覆盖保留。
- Evaluator: 复用既有开发录制、Google 精确距离核对与五门禁；补充本批离线逐例入口评分/等待分解，无独立平台。历史 URL Gold 与生产 matcher 独立；脚本化模型只证明受控路径，不报告真实模型成功率。
- Budget/stop: 外部网络 0，模型 0，探测/Live 0；受控正常任务仍须在原 4 地区页/90 秒内完成。五门禁全绿、报告与分支推送后停止，等待独立复核；5 次真实探测须另行批准。
- Not covered: 当前网站可用性、真实模型的新策略选择、库存和最终交付、未暴露地点泛化。
