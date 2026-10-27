# 3b B 批次3：停止点1完成

时间：2026-10-27T18:16:26.240910+01:00（Vienna CET，UTC+1）。Evidence status：current offline integration regression；已暴露输入，真实模型质量未评。

工作分支 `codex/feat-phase3b-g1-followup`；最终受测提交 `7de83a2975309e0b003e3cc488a87d43cfc20c9a`。本次Agent/Web接入仅推工作分支供复核，不合main。G1核心先前已按授权合入main/c98438f8；实施前核对该main无版本冲突，验证期间main推进到90b464d8，已保留其A Runner更新并重新验证组合。

## 行为和版本

用户在已展示门店卡片追问，认证HTTP入口持久化显式问题事件，Agent选择无参 `ANSWER_PAGE_QUESTION`，经Validator、Router、原G1核心核对，再由Reducer保存、Web投影。模型不能通过动作选择门店、run、URL或改写问题。

| 对象 | 批准并实施 |
|---|---|
| Agent Prompt | 28 → 29 |
| Action Schema | 4 → 5 |
| Agent Context | 16 → 17 |
| State | 23 → 24 |
| TaskDefinition | 21 → 22 |

独立 `restaurant_page_question` Prompt/Schema保持2。ADR0046保持Accepted，只修Approval为“原则与 revision 0.2 文本均已由用户 2026-10-27 批准”；Context及之后正文与main逐字节相同。

优先克隆复用同run、同店身份绑定的已读页面；缺缓存沿既有Native/官网reader读取，保留原Guard、共享模型次数、绝对截止、浏览器子预算和取消信号。取消/较新问题后旧答案不得回写；失去原进程预算上下文时UNVERIFIED，不开新额度。英文Web展示短答、原语言逐字引文、页面URL/readAt；NOT_STATED附查页，敏感类别附确认提示。

预算常量未改：当前main为事实候选45秒/provider30秒、整单500秒/50次共享模型、浏览器子上限120次。旧版本预告中的“90秒来源”是泛称，不是本次事实reader的实际配置。State24/TaskDefinition22同步所有现行调用方，无旧版兼容或自动数据迁移；未连接、重置任何个人数据库。

Semantic、身份解析、共享Browser/Guard、两站目录及source-packs.ts不改。两个A当前评测调用方仅同步State23→24字面量（native-discovery-composition.test.ts、run-d1-fact-judgment-controls.ts各一行），其数据、Runner和评分逻辑不改。main带入的A实现原样保留；没有读取或哈希其答案。

## 红绿与主要失效机制

| 机制 | 有效检错和绿灯 | 未证明范围 |
|---|---|---|
| 展示后没有追问主链 | 冻结9e9c48e2的真实HTTP/PGlite断言期望200、旧代码404；实现后同入口ANSWERED | 模型/商户浏览器I/O为fixture |
| 追问错误重置预算 | 已提交脚本把resume故意改run，2≠1断言失败；字节恢复后单元及默认门禁通过 | 真实模型未调用 |
| 伪URL、未展示店、跨用户、旧版本、请求重放 | HTTP分别400/404/409与幂等；缓存不导航，缺缓存经原reader补读 | 真实持久层/身份解析/Agent/Validator/Router/Reducer |
| 伪引用、敏感yes/no、页面未说明 | 原核心与HTTP三态/拒绝控制通过，伪引用整份丢弃 | 自由答案忠实度仍须A模型评测 |
| 取消、较新问题、准备期并发GET及迟到模型 | 条件门闩/注入时钟验证旧结果不覆盖新问题；取消保留展示结果 | 不依赖短观察窗口 |
| 浏览器子预算被外层结束清零 | 原7/8结束后只剩1次，第二次耗尽，不覆盖其他run计数 | 原reader工厂复用 |
| Web越界或丢原文/时间 | 真实Chromium表单仅四字段、日文引文、三态、敏感提示及360px无横溢 | UI测试HTTP受控；持久HTTP链另有集成测试 |

[原HTTP红灯](http-red.log)／[原输入](red-inputs/freeze.json)／[预算反事实](budget-control/control.json)／[移动截图](visual/g1-mobile.png)。开发focused green日志只作定位，最终验收以提交门禁为准。

首轮f29b4ec9默认1159/1160：一条旧测试还期望TaskDefinition21；只同步预期22后绿，生产源码未因此改变。修复1次，[首轮原始日志](gate-attempt-1/gates.json)完整保留。9d33dda2旧main组合1160/169全绿，也保留在[prior-main-gates](prior-main-gates/gates.json)，不与最终组合混称。

## 最终五门禁及冻结

macOS26.6.2 arm64、Node24.4.1，Chromium文件并行4。每项前后git status为空，restorations=0；无fail/skip/cancel。本次Chromium单次106.121秒，不宣称三次中位数或本批Linux通过。

| 门禁 | 结果 | 用例 | 秒 | status前 / 后 |
|---|---|---|---|---|
| typecheck | PASS | exit 0 | 0.426 | 空 / 空 |
| arch-check | PASS | exit 0 | 0.199 | 空 / 空 |
| npm-test | PASS | 1162/1162 | 26.845 | 空 / 空 |
| build | PASS | exit 0 | 0.417 | 空 / 空 |
| browser-fixture | PASS | 174/174 | 106.121 | 空 / 空 |

[门禁原始日志和JSON](verification/gates.json)／[核验摘要](verification.json)。输入及外层先提交后执行，671份冻结输入SHA-256 `a6a659dd8d34572da33ab04e69964776ee4aa71d6126c446b94c5337f2b03cb3`；[run-gates.py](run-gates.py) SHA-256 `6e08a59053e812d2f5101eafe46c2b53e44712ff1c080745b3e14b93b478077c`。运行后、交付前再次核对一致，报告收尾不修改冻结源码/测试。

旧HARD完整结果（documents、语句选择、模型请求、Native evidence/checks及固定时钟元数据）仍44,197字节，SHA-256 `9a3298bc5e004b99e41d80713e8913b68c336cfa594f6eb60599e310ee3fb633`，逐字节相同。[检查](hard-compatibility.json)。两站非测试TS仍3,847行；source-packs.ts单列473行，均未改，行数目标留G3。[明细](adapter-lines.json)。

## 四层证据和剩余门槛

1. **输入/归因**：显式卡片问题、代码绑定同店/同run，源码/测试/外层冻结。同步main无生产冲突，双方共享日志完整保留，账本按id保留原行并集后追加本批0条目，现21行。[同步记录](main-integration.json)。
2. **执行**：HTTP使用实际持久应用与核心，仅模型传输、商户浏览器I/O受控；真实Chromium另验Web交互。合成HTML不称Replay或Live。
3. **诊断/评价**：接线、状态、预算、引用和英文展示门禁通过；不是语义质量验收。A的Runner随main原样保留，本批未跑真实模型评测，不自行评分。
4. **独立证据/未评项**：fixture原文与身份独立于模型答案，代码核对逐字引用/身份/运行；答案忠实度、未说明正确性仍由A独立评分。ADR关于无明确语义标记评论和自由答案忠实度的残余边界保留。

新增真实模型、Google、餐厅网站、完整Live、环境重跑、评测公开GET均0；未读/复制/暂存.env，未读或哈希answers*.json。后续≤120真实模型调用额度本批未消耗，G3/TableCheck未开始。旧开发State如需复用须先明确重置安排，不静默迁移。

## 交付与停止

只提交并推送工作分支，收据随后附加；本次Agent/Web未合main。核心已在main历史中，本次带入的共享main为90b464d8。到停止点1停下等复核；真实模型原始输出交A评分属于后续停止点2。
