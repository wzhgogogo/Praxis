# 第五文件：Source2 可读，保留断言所需的产品投影缺失

2026-10-30，维也纳 CET（UTC+1）。**STOPPED_PRODUCT_PROJECTION_REQUIRED / draft / not integrated**。

已在 B 的实际 userMessage 中核对第五文件授权（turn `01a18af8-cc45-7a33-a938-915fc1742cf7`），继续分支 `codex/chore-phase3b-g3c-eval-fixtures`，基础为复核通过的 `e743ef65`。本次只修改 `src/harness/browser/browser-read-request-binding.test.ts`；四个已批准文件及全部产品、站点、Guard、Pack、Schema、Gold、评分器、预算和截止原字节不变。

**两个用例仍为 0/2，不能报告完成或五门禁全绿。** 原因已经区别清楚：Source2 与引用判断能读到同店原文，当前产品却没有把它投影成要求保留的 `Verified HARD criterion from source: omakase`。按“根因如果在产品代码，照旧停下报告”，不改产品、不注入候选字段、不绕过原断言。

## 红灯与合法分流后的结果

| 候选/检查 | 结果 | 证据 |
|---|---|---|
| `92ee9097` 冻结未修改第五文件 | **0/2 FAIL**，两条均在原文案断言失败，Node 10.672 s | [原始红灯](red.log.gz)、[未修 SHA](red-inputs-sha256.json) |
| `12d25eaa` 加 Source2 分流 | **0/2 FAIL**，同一保留断言仍失败；整个命令 12.334 s | [完整输出](source2-reproduction.log.gz)、[净树收据](receipt.json) |
| 同一 `12d25eaa` typecheck | PASS，0.560 s | [日志](typecheck.log.gz) |
| 完整五门禁 / 180 项 Chromium / 严格 G2 | **NOT_RUN：两个转绿的前提未达到，按产品停止条件收敛** | 不以 `e743ef65` 的旧结果充当新候选验收 |

每个 Source2 检查前后 git status 均为空，14 个冻结输入 SHA 不变。没有恢复已提交文件、重试、skip、todo 或放宽断言。

Source2 输出只有当前页完整原文编号、角色与价格行编号；复用前四文件已批准的 scripted helper，Prompt/Schema 均为 2。两次读取各选择同一个完整 `Omakase course` 语句，角色 `COURSE`，无价格所以 `priceStatementId` 为空。模型没有输出数字、URL、身份、库存或 `verifiedHardCriteria`；全流程每次调用仍计入原 50 次模型上限。

从实际生产组合读取的诊断如下；这些是执行状态，不冒充独立质量评价：

| 观察项 | AVAILABLE 控制 | UNAVAILABLE 控制 |
|---|---|---|
| fixture 模型总调用 | 14，含 2 次合法 Source2 | 18，含 2 次合法 Source2 |
| 查位状态 | AVAILABLE | UNAVAILABLE |
| 事实检查 | COMPLETED | COMPLETED |
| MODEL_JUDGMENT evidence | `verifiedHardCriteria: ["omakase"]` | `verifiedHardCriteria: ["omakase"]` |
| 最终 phase | PRESENT_RESULTS，代码 conditionStates 为 MET | NO_VERIFIED_RESULT |
| 候选 matchReasons | 只有 `Source coordinates within 1000 m of Shibuya` | 相同 |
| 必需旧文案 | **不存在，断言 FAIL** | **不存在，断言 FAIL** |

完整选句、实际 Agent 轨迹及字段值见 [observed-outcomes.json](observed-outcomes.json)。未手填 State、Evidence、HARD 标记或 matchReasons；只读诊断位于原断言之前。

## 产品接线定位

全仓非测试生产代码中，该文案只有一个生成点：

1. `src/domains/restaurant/read-grounding.ts:559–562`：`candidateFactUpdate.matchReasons` 仅由 **`observation.verifiedHardCriteria`** 生成。
2. `src/integrations/tabelog/tabelog-browser-availability.ts:591–597`：G3c Source2 读完后传入的是 `priceFacts`、`listedCourseDetails`、`sourceFieldQuotes`，不传入裸的 `verifiedHardCriteria`。原文事实本身不能伪装为核验结论。
3. `src/integrations/restaurant-availability/quoted-source-fact-merge.ts:9–12`：合并原文证据只保留已有 matchReasons，否则为 `[]`，不会生成该文案。
4. `src/integrations/restaurant-facts/model-fact-judgment.ts:211`：后续引用判断确实产生 **MODEL_JUDGMENT evidence 的 `claims.verifiedHardCriteria`**。但这是证据字段，不是上述 provider observation 参数。
5. `src/domains/restaurant/task-definition.ts` 的 `CANDIDATE_FACTS_CHECKED` 接纳证据/检查，不改候选 matchReasons；`AVAILABILITY_CHECKED` 只追加 provider 返回的 candidateFactUpdates。

因此当前合法 Source2/FactJudgment 路径没有从“已接纳的引用判断”到该候选理由文案的投影。更换页面 class、增加公开原文或重复事实调查，都不能补上这个产品字段交接；在 fixture 里设置 matchReasons、恢复私有菜单自动 verified 捷径或给 Source2 增加未授权字段，都会绕过当前要求，本批没有这样做。[唯一生产者与接线记录](producer-analysis.json)。

保留这条断言的前提下，下一步需由用户/复核者安排 B 侧的产品理由投影职责和修复；本报告不修改合同，也不擅自替换断言。

## 页面、模型与脚本改动边界

- 当前真实 Chromium 构造页在 `native-fixed-source-pages.ts` 本来就用 `<div class="course menu">Omakase course</div>` 渲染文字，实际 Source2 输入也证明该句为 `SOURCE_TEXT`。它不是只存在于私有属性的隐含值；本次**无需改 HTML，更没有新增价格或身份 guide 证据**。
- 公开课程结构参考仍为 `src/harness/browser/fixtures/restaurant-prices/ginza-sushi-sendou.html`，SHA-256 `34e82a5f3a2e882f261bf6e42cb54e5e75d0318e6a02b32c8d6047e76074057d`，对应真实保存页路径/采集信息见其 provenance。本地构造页不称为网站回放，不把参考真实店的事实移给构造店。
- 新增 purpose 分流在 Agent 分支之前直接返回，**不消耗 Agent 动作**；只读诊断不会修改状态。原 50 次上限、请求日期/人数、19:00/21:00 响应和预算都不变。

| 脚本 | 原规则 | 当前规则/实际轨迹 |
|---|---|---|
| AVAILABLE | S→C→I→P，故意先查位后调查，以检验替代关系 | **规则不变**；实际仍 S→C→I→P |
| UNAVAILABLE | S→I→C→继续来源搜索→END | **规则不变**；本次实际 S→I→C→S→S→END |

S/I/C/P 分别为 SEARCH_RESTAURANTS / INVESTIGATE_CANDIDATE_FACTS / CHECK_AVAILABILITY / PRESENT_RESULTS。原脚本已经显式调查，不需要再加一次 I；没有重排任何 Agent 决策规则。

原要求的文案断言及它后面的**全部源码后缀原字节不变**，目前位于该文件 396–397 行；从新文件撤去新增 purpose/只读 observer 和 test context 参数后，整个文件与 `e743ef65` 相同。[保留证明](preservation.json)。没有删改 AVAILABLE、UNAVAILABLE、原文案、后续 DOM/query/库存/独立评价断言。

原文案断言后面的检查本次均 **NOT_REACHED**，包括 AVAILABLE 的独立 evaluation，不得因为诊断显示期望 phase 就把这些检查报告为通过。端到端验收仍 FAIL；引用/事实处理到达，产品理由投影未到达规定输出；S0 没有独立完成评价，不宣称 0。

新增真实模型、Google、网站、评测 GET、Live 均 **0**；fixture 的 14/18 次调用不是实际服务调用，未加载 `.env`。仅提交/推送工作分支并通知 B，不合 main，等待复核安排。
