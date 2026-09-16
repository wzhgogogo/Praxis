# Stagehand 小探针：结构化观察与受控动作

- Status: Draft
- Document revision: 0.1
- Last updated: 2026-09-16
- Classification: draft / not integrated；development component diagnostic，非 Clean Baseline
- Related documents: [前次现有执行器实测](2026-09-16-browser-loop-feasibility-validation.md)、[Stagehand 源码研究](2026-09-15-stagehand-browser-use-and-praxis-browser-agent.md)、[Test](../skills/test/SKILL.md)

## 范围

用户授权 Stagehand 小测试。使用 npm 发布包 `@browserbasehq/stagehand@4.1.0`，安装在本地忽略目录，不改项目 package.json/lockfile、不改生产代码。版本及 integrity 固定于实验目录 package-lock.json，不声称发布包与此前源码 SHA 完全相同。

接口为 `localBrowser.launch → Stagehand.create → page.snapshot / stagehand.observe → 独立目标检查 → locator.click → snapshot`。关闭 cache/selfHeal；不使用自动 act 或完整 agent。遥测显式配置本机接收器，不使用个人 profile、Browserbase 服务或新模型供应商。模型通过自定义 generate 回调接现有 DeepSeekModelGateway，使用配置的 deepseek-flash，未改 Gateway 或结构化生成 Schema。现有源码的 snapshot/模型回调入口见[官方仓库](https://github.com/browserbase/stagehand)。

三个阶段：真实本地浏览器+合成网页（0模型）；同一 Fixture+真实模型（1调用）；两家公开商户页的 Live Read-only（各1调用）。全探针累计上限6次模型调用，每次运行180秒；实际共3次调用、23,001 tokens，未配置价格表，费用未知。没有实站重跑，没有登录、接受商户条款、填写个人信息或提交预约。没有网络副作用审计，实际计数仍 NOT_MEASURED。

## 结果

| 阶段 | 实际结果 | 证明范围 |
|---|---|---|
| 无模型 Fixture | PASS。Stagehand 暴露可点击日历 td、展开后的 role=option；操作后独立 DOM 断言为 `Date: 2026-09-19; 4 guests; 19:00 available` | 真实扩展启动、结构化观察、定位、控件和异步结果可运行；动作选择由测试代码完成 |
| DeepSeek + Fixture | observe 返回正确 td selector 和 click；检查 data-date 后执行；独立复核 after snapshot 确认目标日期 | 自定义模型回调、现有 strict Gateway、动作提议与执行分离可以接通 |
| TableCheck / 141 | snapshot 与 observe 成功；建议点击显示 Sep16th 的日期选择器入口，探针因它不是已核验的目标日期而停止 | 公开页面结构和建议可取得；没有实站点击、日期应用或空位结论 |
| Tabelog / 八芳 | snapshot 与 observe 成功；模型把无标签按钮描述为日期选择器入口，独立检查没有日期/标签依据，停止 | 没有重现前次动作字段解码失败，但不能证明建议目标正确；没有实站点击或查位成功 |

实站探针的守卫只允许已观察 `data-date=2026-09-19` 的非提交控件。它刻意没有实现通用日期选择器展开与多阶段流程，因此两个 STOP 是探针范围限制/未核验提议，不应笼统报告为 Stagehand 执行失败。尤其 TableCheck 提议本身可能合理，只是未被此次执行检查允许。

## 观察质量与局限

- **补上真实缺口。** 同一 Fixture 中现有 Registry 没有日期单元格，而 Stagehand 保留 main/region/table/row/cell 关系并提供映射；role=option 也可被观察和定位。
- **一次性能样本。** 同一浏览器/页面，Stagehand snapshot 34ms，现有逐控件 Registry 10,368ms。输出分别是14,730字符/395映射节点，与184个控件；返回结构不同、执行顺序固定、仅一次测量，不能宣传稳定倍数或生产SLA。
- **没有自动解决页面噪声。** Fixture 的180条无关导航链接仍保留在树中；完整树更有结构但不等于更少tokens。TableCheck树17,710字符/769映射节点，Tabelog树46,114字符/1,803节点。
- **实站初始状态仍重要。** Tabelog树出现简体中文语言建议层，预约区域的日期/人数内容尚未完整就绪，模型建议的按钮无标签。这与之前 CUA/项目运行并非同一状态。只等待 body 不足以定义业务页面就绪；Stagehand 不会自动替我们解决阶段判断和有效操作范围。
- **观察提议仍不可信。** selector 可定位，不等于含义正确或已授权；本次独立检查拒绝了无法确认的目标，没有为了通过测试放宽权限。

## 对接入的判断

本次支持继续把 Stagehand 作为**观察和定位组件**评估：本机扩展与 DeepSeek 接口两个未知点已跑通，并看到当前 Registry 没有的结构信息。还不足以选择它为正式浏览器底层，或承诺两站完整流程成功。

下一步应在同一浏览器状态下比较有范围的观察、就绪条件、逐步动作校验和结果回读，验收一条完整预约前调查流程；不再围绕单个日期或人数控件单独优化。Praxis 的请求权威、Policy、证据接纳与 Runtime 不交给 Stagehand。Cloudflare部署、iframe/shadow、跨标签页、取消/超时、完整套餐和费用条件、受控写入均未验证。

## 证据与验证边界

[入口](../../.eval-artifacts/stagehand-probe-2026-09-16/probe.ts)与独立依赖保存在本地忽略目录；属于一次性实验包装器，不增加产品执行路径。

- [无模型 Fixture](../../.eval-artifacts/stagehand-probe-2026-09-16/2026-09-16T01-53-08-744Z-102d91a4-344b-47e2-81d9-94f5b958c595.result.json)
- [真实模型 + Fixture](../../.eval-artifacts/stagehand-probe-2026-09-16/2026-09-16T01-54-02-932Z-825315b6-d89c-400b-9503-f38dc2297844.result.json)
- [实站观察](../../.eval-artifacts/stagehand-probe-2026-09-16/2026-09-16T01-54-33-639Z-94a35961-b589-4ab1-b751-591757c9d4c8.result.json)

每份 execution 有独立 `.evaluation.json`，由助手根据动作、DOM断言和snapshot复核，不冒充 Restaurant Evaluator 自动业务评分。保留公开页面的结构化树与 XPath，不保存HTML、Cookie或凭证；这些已暴露记录不是 Clean Holdout，也不是业务Replay。

环境问题：npm首次沙箱DNS失败，获准访问后安装成功；首次脚本因实验目录 package.json 缺少 type=module 在启动前失败，修正隔离配置后继续，无模型或来源调用。三个正式探针正常结束并调用关闭浏览器/本地接收器；无生产代码变更，因此只检查文档链接、diff和实验结果，不重复全量项目测试。未提交、未推送。
