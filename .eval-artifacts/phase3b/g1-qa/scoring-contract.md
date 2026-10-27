# source-quoted-qa-scorer@2

仅评测层变化；产品Prompt/Schema/State不变。入口命令：

```sh
node --import ./scripts/test-filesystem-guard.mjs --import tsx src/eval/restaurant/fact-qa/run.ts --questions questions.json --references answers.reviewed.json: all 34 references are REVIEWER_CONFIRMED by independent reviewer (Claude), 2026-10-27. Dataset phase3b-qa-reviewed@1 is exposed offline acceptance data, not Clean Holdout. The historical answers.candidate.json remains byte-identical. Unreviewed references still fail closed; confirmation alone does not mean G1 has passed.

answers.reviewed.json现有25题REVIEWER_CONFIRMED（Q01–Q20、Q26–Q30），确认人为independent reviewer (Claude), 2026-10-27；5改写和4新增仍CANDIDATE。answers.candidate.json原字节保留历史。全34题有任何未审项即NOT_READY、evaluated=0、错误数null，不读取模型响应或启动浏览器；不把混合集冒充完整验收Gold。

响应只允许核心三种结果：ANSWERED、NOT_STATED、UNVERIFIED。评测中answer.kind承载核心status，text承载简短answer，citations为pageId/pageSha256/readId/quote。Runner负责从核心URL/readAt与独立读取日志映射引用，不从答案文件取值。reads为Runner保留的questionId/pageId/pageSha256/readId/runId，不能取模型自述。题目中的displayedOutlet/readContext是目标；提供页身份和所属运行来自独立记录。

参考答案分类MISMATCH（身份或运行不符）映射期望UNVERIFIED；错误页的事实不许出现在答案或引用中。空answer的UNVERIFIED可直接比较状态；额外自由文本只接受已审表述或标为未评，明确泄漏的错误页片段拒绝。CONFLICT映射期望ANSWERED，要求双方逐字引用、明确不一致、请向餐厅确认。其余ANSWERED/NOT_STATED同名映射。Q26必须引用英文“A 10% service charge will be added to all lunch orders”和日文“ランチ利用時はコースご注文のお客様のみサービス料10％を頂戴しております”。

Q24/Q25: allowFreshRead=false. The offline evaluator has no reader, so it requires UNVERIFIED and must not reuse the old-run prices. Correctly answering after a fresh read, with its current read time, is deferred to online evaluation after Agent integration.

评分核对同店/同run、原页SHA/本次readId、引用原文存在（只折叠排版空白）、所需支持、未说明、敏感确认及答案一致性。原文由评测侧从源字节独立Chromium提取，脚本/隐藏文字排除；不导入生产Parser/Verifier。评论文本只证明评论存在，不能作为商家事实。

approvedAnswers是复核者确认的表述；未命中者一致性NOT_EVALUATED，不用字串差异判断语义错误。英文题面不把模型翻译的答案自动升级成人工认可表述；语义正确的其他英文答案仍需人工复核。falseClaimCount单位为答案：明确错店/错run事实、伪造引用、与已审未说明相反的肯定、人工拒绝表述记1；仅缺引用/确认提示可FAIL但不推定事实假。未知为null，不能汇总为错误0。

本地构造控制只证明评分合同，不代表G1核心验收或网站回放；B不得在实现期间读取任何答案文件及答案明细。
