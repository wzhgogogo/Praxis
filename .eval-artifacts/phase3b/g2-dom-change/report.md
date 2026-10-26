# 3b A批次1：G2 DOM改版测试

Evidence status：current executable / exposed development baseline，非Clean Baseline；仅保存DOM与本地构造传输，不是完整网站网络回放。时间：2026-10-26T23:11:24.545847+01:00（Europe/Vienna CET）。分支codex/feat-phase3b-dom-change，起点main cc127320。

## 切片与规则

新增测试与评测代码，产品目录零修改。ADR0046记录用户两原则，Accepted不代表G1/G3实现完成。规则`dom-marker-mutation@2`：所有id、class、data属性名及testid值确定性改名；页面内ARIA八种IDREF、label、href、SVG与CSS同步；悬空引用保持，内联脚本/事件处理器不改。规则、映射和完整性控制见[spec](spec.md)。ARIA/label按元素路径逐项核对；任何不一致INVALID_MUTATION，不计业务结果。

输入由已提交`prepare-inputs.py`（2037bb1c）从固定Git cc127320提取，每站LIST/DETAIL/CALENDAR各2份，共12份；原始页面、日期、URL、来源类型及SHA见fixture manifest和旁置provenance。TableCheck诊断DOM仅供G2，未提升为Recorder合格页。全部用真实Chromium、生产snapshot/observeControls及两站解析/完成判定；来源传输是明确本地构造HAR，Guard与拒绝外部网络开启，脚本禁用；沿用F3的`.is-hidden` shim，未认证原始外部CSS布局。

## 当前逐页基线

初次完整采集冻结代码bddee4ff；最终完整映射采集与门禁收据在verification中记录。

| 保存页 | 判定 | 原页已知事实数 | 变异后损失 |
| --- | --- | ---: | ---: |
| tabelog-list-nerima | DEGRADED_HONEST | 20 | 20 |
| tabelog-list-akabane | DEGRADED_HONEST | 1 | 1 |
| tabelog-detail-01 | PASS | 3 | 0 |
| tabelog-detail-02 | PASS | 3 | 0 |
| tabelog-calendar-teppen | DEGRADED_HONEST | 3 | 3 |
| tabelog-calendar-sen | DEGRADED_HONEST | 3 | 3 |
| tablecheck-list-ginza | PASS | 1 | 0 |
| tablecheck-list-akabane | PASS | 0 | 0 |
| tablecheck-detail-nakamata | PASS | 2 | 0 |
| tablecheck-detail-takahashiya | PASS | 2 | 0 |
| tablecheck-calendar-nakamata | PASS | 0 | 0 |
| tablecheck-calendar-kinri | PASS | 0 | 0 |

12份变异均有效。8 PASS、4 DEGRADED_HONEST、0 FAIL。列表两份损失20/1个店名；日历teppen的FULL/PHONE_ONLY/CLOSED、sen的两日期及请求确认变为未知。没有相反声明或未知变已知。TableCheck Akabane列表及两份日历原页本就没有可绑定业务事实，PASS只说明未知保持未知，**不证明原页查位或找店成功**。

`test:dom-change`固定检查冻结原页可知事实，防止G3把原/变异都降为未知。G3额外`PRAXIS_G2_REQUIRE_PASS=1 npm run test:dom-change`要求所有有效页PASS。原页解释如需改变须复核，不改历史基线冒充改善。当前诚实退化为产品G3待修，A没有修产品。

## 红绿灯与检错

有效红灯b089717f复用F3 class-only操作，在真实Chromium里旧id仍存在（1 != 0），目标覆盖断言失败；`marker-red.log`保留。完整变异后ID/data覆盖、全ARIA多值/label目标路径、CSS/SVG、悬空引用、脚本保留、确定种子控制通过。分类器的本地构造矛盾/未知变已知反例必须FAIL；这些反例不是来源S0事件。

正常动作控制为本地构造公开链接；模型替身只从当前观察label选择OPEN_LINK，实际Executor导航与完成，原/改名两版均完成。它证明动作引用能跨私有标记变化，不能代替真实模型或网站的端到端验收。初稿使用未获合法动作许可的构造输入/按钮，正确返回NO_SAFE_ACTION，已改为现有合法观察链接；未修改产品放行按钮。

采集接线曾先后因Guard导航准备、HAR/route组合、禁脚本下addStyleTag等待失败；最终复用既有fixture HAR并同步注入可见性shim。启动/类型/接线错误均不算有效红灯或来源FAIL，原日志摘要归档。正式五门禁与额外固定检查均在干净冻结f671d950执行，通过；首次全套门禁无失败。

## 私有标记依赖位置（main cc127320，产品只读）

- `src/integrations/tabelog/tabelog-page-parser.ts:82`：列表名称/地址/电话依赖class或data；本批两列表退化对应此处。
- `src/integrations/tabelog/tabelog-query-controls.ts:49`、`:73`、`:76`：日期cell、data年/月/日及full/tel/closed class；`:114`、`:137`：booking/people私有class与选中data值；两日历退化对应这些路径。
- `src/integrations/tabelog/tabelog-page-parser.ts:217`：通用slot私有class/data；本批不证明该库存分支正常。
- `src/integrations/tablecheck/tablecheck-page-parser.ts:481`、`:514`、`:517`：Venue Availability/day/Pax/Time testid；`:645`、`:673`、`:689`：available class/data、Unavailable Msg与Timeslot Btn testid。当前保存页未产出绑定库存，因此没有触发相应能力退化。

## 四层评价与边界

1. 端到端结果：未执行Live/真实模型，用户找店、查位与问答交付NOT_EVALUATED；只完成本地G2验收链，不记真实任务成功。
2. 逐环节：固定历史公开页面12，变异完整性12/12；观察/解析/完成判定8相同、4如实未知。实际Executor的本地正常控制完成。没有将未知当穷尽或合格库存。
3. 严重程度：G2定义的矛盾/未知变已知FAIL=0，4份能力退化单列；没有实际用户交付，S0 NOT_EVALUATED（不以生产前后自比认证S0）。构造矛盾反例用于分类器检错，不记真实运行事件。
4. 归因：四份退化对应Tabelog私有class/data依赖；TC原未知属输入/既有读取覆盖限制，不归功于改造。采集失败属于Harness接线，未改变来源能力结论。

成本：模型/Google/网站/Live/评测GET新增全部0，账本本项零计数；环境只本地Chromium。未取得当前网站连接、库存或完整网络回放证据。

## 验证与交付

五门禁、额外固定检查与净树回执已在[verification](verification/)归档：typecheck 0.437s、arch 0.202s、默认1101/1101 27.862s、build 0.422s、Chromium166/166 105.774s；每项前后净树。固定G2 4/4 21.294s、最终12页留证15.737s，同样前后净树。所有输入SHA再次核对通过，源码冻结f671d950；完整最终映射/悬空及脚本位置见[capture](capture/)。产品、站点、source-packs、Prompt/Schema/State相对基线零差异。`.env`未读取、未暂存。工作分支推送供复核，不合main。G1候选与回放另从最新main独立分支开展；本报告不能作为其通过记录。
