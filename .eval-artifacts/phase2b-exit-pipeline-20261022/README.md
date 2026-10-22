# Phase2b 退出流水线

Status: **准备代码；新留出未打开、未运行**。入口基线 `17415d1c`。新承诺文件逐字来自主线 `71d9961c`，只复制该文件。

## 组件与运行边界

| 入口（均使用 `node --import tsx`） | 行为 |
|---|---|
| `cli.mjs prepare --source FILE --commitment COMMITMENT --exit-start ISO --output NEW_DIR [--fallbacks JSON]` | 先文件与6个用例SHA，后YAML解析和严格字段校验。未知键/null/非字符串条件停止；日期按东京起始日后7–14天第一个指定星期填入，输出原始/派生SHA、Runner格式、18次计划、见证查找计划。 |
| `cli.mjs discover --input SEARCH_PLAN --output NEW_DIR --freeze FREEZE --approval APPROVAL` | **未来授权后**仅调用Google公开地点查询，保存中心与候选观察；不自动把第一名认作中心。无模型。 |
| `cli.mjs capture --input JOBS --output NEW_DIR --freeze FREEZE --approval APPROVAL` | **未来授权后**读取已列明Tabelog商家页或同请求日历GET；商家页仅保留原始商家JSON-LD/片段，不保留客户评论整页。 |
| `cli.mjs certify --input REVIEWED_WITNESS_PLAN --inventory INDEX --output REGISTRY` | 零网络认证：商家身份原始JSON-LD、800米、每条HARD明文、负向HARD独立复核文件、同店/日期/人数/时段原始库存。任一例无见证，停止。 |
| `cli.mjs run --plan PLAN --registry REGISTRY --ledger LEDGER --runner-input YAML --freeze FREEZE --approval APPROVAL --output NEW_DIR [--budgets BINDINGS]` | **未来授权且预算足额后**使用现有 `child-entry.ts`/Runner、Guard、独立安全检查、事后读取。每例3次，共18槽位，不相邻。自动延后能力评价，仅另存未对应措辞和结构预算字段。 |
| `cli.mjs extract --manifest MANIFEST --output FILE [--budgets BINDINGS]` | 仅未对应条件文字/编号/原始artifactSHA/文字SHA；无运行结果、展示、条件状态、见证结论。结构预算另存，不做同义判断。 |
| `cli.mjs review-gate --pending WORDINGS --review REVIEW --output FILE` | 要求独立复核状态、整包SHA、复核原文SHA、逐artifact/索引/文字SHA的完整判词；未完成不调用Evaluator。 |
| `cli.mjs evaluate --pending WORDINGS --review REVIEW --manifest MANIFEST --freeze FREEZE --output NEW_DIR [--evaluation-options JSON]` | 复核后调用现有Evaluator@33/rubric29；评价单独保存。冻结的可选逐原始SHA options 提供独立来源/见证支持；缺证保留未评，不能宣布通过。 |

以上文件均在当前目录。未来认证配置必须包含明示USER授权、冻结SHA、输入SHA、截止时间和来源请求额度；Live配置必须再绑定计划/见证SHA、有效全局账本及原始Runner输入。授权回执只消费一次，不自行续期。`freeze.mjs`复用既有冻结引擎。执行与评价分别冻结；评价开始前，原始运行、待判词、独立判词和options也须纳入新的冻结。

## 日期、见证和预算

- 日期来源为带时区的退出开始时间，按东京日期计算；content 使用星期/月/日，结构date.value和acceptance用ISO日期。只允许承诺中的日期填充及已有后备地点。后备需原地点业务见证认证失败的已保存审核，不因网络错误切换地点；记录原地点/后备/审核SHA。
- 中心必须由独立复核者根据保存的Google地理候选选定；不是按对餐厅最有利的距离挑选。见证800米，生产命名地点1000米合同未改。
- HARD须绑定同商家的原始商家片段。负向HARD按复核者明确的“商家地域/业态等正面明文支持”的本周口径，须有对应独立审核SHA；缺词、店名、评论和可调口味均不自动成立。
- 每来源最小间隔30秒；403/429/503/繁忙页等15分钟重试1次；纯传输失败等2分钟重试1次；仍失败停下。读取无表单/登录/预约/支付，不跟随重定向。
- 完整运行间隔5分钟；决策30秒为现有Agent/Browser实现，Runner总限时500秒/50模型，预检及正式Google合计40（正式Runner38，保留既有预检预留）；500秒发终止信号，2秒仅为强制清理，不增加验收预算。重跑上限每例1、总4，并进一步受全局账本实际预留约束。
- 结构预算绑定由独立复核配置给出 `caseId/goldIndex/goldTextSha256/polarity/strength/expected/reviewPath/reviewSha256`。通过比较 `budgetPerPerson` 数字与币种，不因文案变化当作同义问题。缺失/不同如实记录字段失败；匹配**只表示对应**，不证明商家价格、HARD满足或条件披露。旧例02的8000JPY绑定复用已批准独立审核。
- 运行结束只生成措辞包，Evaluator仅在独立判词后调用。单独保留结构预算核验、资源账本、原始引用和评价，结果不得附在发给措辞复核者的包内。

## 本轮离线演练

`prepare-rehearsal.mjs` **只**读取旧已暴露留出集与19941c4e批准的逐字格式恢复；旧原文/承诺均不改。原始例05非字符串先作为拒绝对照，成功路径使用明确标为旧暴露派生副本的recovered文件。复用已保存18个原始产物、旧见证、旧独立措辞判词。没有新留出样本、没有模型替代的产品成功声明。

冻结配置提交后运行：

```sh
node --import tsx .eval-artifacts/phase2b-exit-pipeline-20261022/freeze.mjs .eval-artifacts/phase2b-exit-pipeline-20261022/rehearsal-freeze.json
CHECKPOINT_C_ATTEMPT="$PWD/.eval-artifacts/phase2b-exit-pipeline-20261022" node --import ./.eval-artifacts/checkpoint-c-live-20261020/offline-deny.mjs --import tsx .eval-artifacts/phase2b-exit-pipeline-20261022/rehearse.mjs .eval-artifacts/phase2b-exit-pipeline-20261022/rehearsal-freeze.json
```

输出 `offline-rehearsal/verification.json`。来源发现传输缝隙使用保存的Google公开响应，仅证明接线，不把重用同一响应认证为六个不同地点。18槽位用替身时钟及原始产物引用；不重跑浏览器、不重放模型、不伪造原始响应；Live分母0。旧的资源超限记录保留，不截断为合规。

## 尚待正式运行前满足

新原文尚未提供；字段不兼容应停下报告，不猜测修补。新HARD/结构预算/负向规则依实际输入由复核者冻结。当前已完成旧批次的全局账本为3280/4000模型，剩720，低于18×50的900（不含重试），不能按当前额度正式开跑；本轮不改额度或正在修复的预算产品行为。正式运行仍需有效认证、完整冻结及对应授权，本轮到离线准备、演练和推送为止。
