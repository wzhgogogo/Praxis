# 前端第1步复核小修（2026-10-30）

- Status: Draft
- Document revision: 0.1
- Last updated: 2026-10-30
- Source of truth for: c67c9276复核小修、受控语义单次回归及合入复核证据
- Related documents: [原交付](WEB-WORKSPACE-SLICE1-20261030.md), [切片计划](../WEB-WORKSPACE-SLICE1-PLAN.md), [Gateway](../architecture/AGENT-GATEWAY-AND-WORKSPACE.md), [视觉](../product/VISUAL-DIRECTION.md)
- Evidence status: draft / not integrated；公开开发回归已暴露，不是Clean Baseline

## 用户决定与本轮范围

c67c9276的功能、边界、十项验收已由用户2026-10-30复核通过；本轮只做指定小修并推原工作分支、不合main。

同run且只插入SHORTLIST_UPDATED时，重交一次已完成只读/展示事件的规则已签收，Gateway列出四个允许事件、完整前提和不适用情况；实现不扩大。固定输入框的实际高度、底部位置和间距通过ResizeObserver投影到内容留白与滚动安全区。两尺寸新增长双语取消条款/展开来源下的两个出发入口完整可见、点击真实本地接收器验收。

Saved零条只显示Saved；非零数字与文字用间距分开并用#5F6275。渠道名用正文色，Recommended保留群青；日期Mon, Nov 2；调查期间隐藏候选总数，进度仅显示真实已查数量；结束后再显示卡片位置/总数。冲突提醒只保留Confirm cancellation terms on the website；出发按钮第二行Date首字母大写。来源、B1链接生成/接纳、取消规定原文不变。

详情旧Ask输入框记入下一段，届时合并主输入框并按当前对象隐式指代；本轮保留原路径，不扩展单店问答。

## 提示词与已完成的离线检查

语义Prompt27→28；查看说明仅在viewingContext存在时加入。无查看上下文的提示正文和上下文投影沿用v26，固定空Draft/具名Draft×原两次Schema提示的4组字节SHA均与e3c48dbd中的v26一致。原4255fcf8/v27在相同4组上均不一致，修复后所属9项测试通过；不是仅检查一句文字消失。

两尺寸工作区及原三项UI回归开发检查9/9通过，包含新增遮挡/两个按钮实际点击；胶囊透明圆角不作为点击点，检查整个矩形在输入框上方，并对实际按钮内部做命中测试。正式五门禁与最终截图在冻结后另记。

## 真实模型运行前计划（尚未启动）

**计划15条逻辑回归，最多15次DeepSeek API请求，单次运行，API重试0。** 现有restaurant-semantic-regression@5，10个session/15个turn；模型deepseek-v4-flash。既有Schema解释器最多两次尝试不改生产配置，本轮专属传输守卫在第二次Schema请求发出前拒绝，且总API请求数封顶15，不添加任何重试。Fixture失败则不启动模型。当前真实模型调用0。

调用顺序严格为冻结代码/输入 → npm run eval:restaurant:semantic:fixture → 成功后npm run eval:restaurant:semantic:deepseek一次。模型既有入口、Gold、Scorer、用户输入和参考时间不改；外围只记录、限制调用并执行停批规则。凭据由受控Node进程从既有项目.env加载，不打印、不复制、不提交；原数据与请求/响应输出不含Authorization。

运行脚本、传输守卫、逐项对照和输入SHA清单在[本轮证据目录](../../.eval-artifacts/web-workspace-slice1-followup-20261030/freeze.json)冻结。源提交SHA在不可覆盖的execution/started.json记录，写入后才运行Fixture及真实模型；所有冻结文件在运行前后复核。传输守卫已用本地假传输验证15次上限、拒绝第二次Schema和拒绝其他来源；对照逻辑有不变v26正常控制及已知2→3人数错误检错控制，真实调用均0。

不跑Holdout，不追加具名专项/对照模型调用，不做Google、来源GET、Live或外写。遇到新增退化，保留结果、停止并报告，不调提示词追分、不补模型重跑。

## v26对照依据与预定判定

最近v26为C批次2，原代码a31ad5f127b5b032560e3066869a0e35ce09f9c8，2026-10-27。采用[已修正补评](../../.eval-artifacts/phase3b/c-batch2/semantic/posthoc-evaluation.json)及其15条DEVELOPMENT原记录；不用外层首次漏映射CONTEXT_CARRY的3个假失败。旧目标15/15、请求投影14/15（SR05双重否定）、严格0/15全部保留，不改旧分数。当前15条输入与Gold对象和参考时间与旧批逐字数据一致，SHA清单绑定；旧24条具名额外测试不纳入本轮调用。

对照逐turn列出旧/新严格状态、首个失败、模型合同、目标规则、不可评价/上游阻断。目标判定复用现有Scorer；官方严格oracle提前拒绝但保留了首轮Proposal时，仅另评该Proposal目标并明确标识，不能冒充权威Draft。旧PASS丢失、已PROPOSED变成模型/合同失败、相同初始上下文目标退化、显式数字人数从旧正确值变成与Gold冲突的新数字，均列新增退化并停下。其余不可证实的维度不填零、不推断无退化。

限定比较：旧外层遇严格失败仍继续，本轮既有官方Runner会阻断同session后续turn；State/TaskDefinition也在旧批之后更新。受影响的后续单元列BLOCKED_BY_UPSTREAM/NOT_EVALUATED，不以不同分母计算总改进率。无查看上下文的回归不证明真实this one上下文理解质量。

结果按Eval Skill四层报告：产品端到端未测；L2逐环节/字段及全部计划、开始、完成、可评分分母；L3用户影响/S0来源证据缺失明确未评价；L4首个偏离与归因证据，不能把单次噪声归因于Prompt。模型耗时/usage、实际请求、拦截重试及各项0调用边界随原件记录。
