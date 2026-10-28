# 3b A批次1 G1问答候选集与评分器

Evidence status：以下批次1正文为 frozen historical candidate evidence @8bd6bb8c，原评价保留；当前状态见末章。批次1当时为**非人工确认Gold、非验收集**。时间2026-10-26T23:29:45.366380+01:00（Europe/Vienna CET），分支codex/feat-phase3b-qa-candidates，起点最新main cc127320。用户确认没有既有人工答案，由复核者逐题确认/修改/删除；最终状态以复核记录为准。

## 交付与隔离

30题来自8份保存公开页面：Tabelog4、TableCheck4；其中2份只是菜单片段。questions.json含门店/来源路径/SHA/问题/题型，B可读；answers.candidate.json含逐字摘录及原页位置、待审答案、未说明题检查范围、陷阱说明，全部CANDIDATE。完整性检查验证8页存储/原始双SHA、49处摘录及Unicode字符行列位置。原页或来源归档取固定Git cc127320，提取脚本ae319df7先提交再执行；原始HTML不删空白，新增提取页以gzip保留字节。

[B输入白名单](B-INPUTS.md)同时排除内含答案的生成脚本和引用验证明细，避免从其他材料泄漏期望答案。候选字节提交并记SHA只是供复核复现，**复核前不冻结为验收Gold**。没有运行B产品问答实现，没有模型答案冒充人工。

## 覆盖

12题有答案、8题页面未说明、7陷阱、3敏感。敏感为过敏/无障碍/清真，待审口径均转述有限原文并请向餐厅确认。未说明题列检查过的商家部分；不把菜单片段的缺证扩大到完整网站。

陷阱含同连锁其他分店2、名字相近1、历史菜单时效2、日英实质范围冲突1、历史评论冒充商家菜单1。历史菜单两题只证明“当前/未来有效性未证”；**没有明确过期日的材料，不伪造已过期事实**。因此明确到期菜单这一更窄子类仍未覆盖，交复核者决定补充或接受现有候选。没有保存独立店铺官网材料被纳入本集。

| 题号 | 类型 | 保存页ID | 状态 |
| --- | --- | --- | --- |
| G1-Q01 | 有答案 | sen | CANDIDATE |
| G1-Q02 | 有答案 | sen | CANDIDATE |
| G1-Q03 | 有答案 | sen | CANDIDATE |
| G1-Q04 | 有答案 | sen | CANDIDATE |
| G1-Q05 | 有答案 | sen | CANDIDATE |
| G1-Q06 | 有答案 | sen | CANDIDATE |
| G1-Q07 | 有答案 | nishi | CANDIDATE |
| G1-Q08 | 有答案 | nishi | CANDIDATE |
| G1-Q09 | 有答案 | ooyama | CANDIDATE |
| G1-Q10 | 有答案 | takahashiya | CANDIDATE |
| G1-Q11 | 有答案 | takahashiya | CANDIDATE |
| G1-Q12 | 有答案 | aloft | CANDIDATE |
| G1-Q13 | 页面未说明 | sen | CANDIDATE |
| G1-Q14 | 页面未说明 | sen | CANDIDATE |
| G1-Q15 | 页面未说明 | sen | CANDIDATE |
| G1-Q16 | 页面未说明 | nakamata | CANDIDATE |
| G1-Q17 | 页面未说明 | nakamata | CANDIDATE |
| G1-Q18 | 页面未说明 | takahashiya | CANDIDATE |
| G1-Q19 | 页面未说明 | aloft | CANDIDATE |
| G1-Q20 | 页面未说明 | alaska | CANDIDATE |
| G1-Q21 | 陷阱 | nishi | CANDIDATE |
| G1-Q22 | 陷阱 | ooyama | CANDIDATE |
| G1-Q23 | 陷阱 | matsumoto | CANDIDATE |
| G1-Q24 | 陷阱 | aloft | CANDIDATE |
| G1-Q25 | 陷阱 | alaska | CANDIDATE |
| G1-Q26 | 陷阱 | matsumoto | CANDIDATE |
| G1-Q27 | 陷阱 | sen | CANDIDATE |
| G1-Q28 | 敏感类别 | nishi | CANDIDATE |
| G1-Q29 | 敏感类别 | ooyama | CANDIDATE |
| G1-Q30 | 敏感类别 | aloft | CANDIDATE |

## 评分与检错

新增独立source-quoted-qa-scorer@1，引用同店/同页SHA/本次readId、原文存在、未说明、敏感确认和人工答案一致性分开判，详见[合同](scoring-contract.md)。来源原文从固定字节用独立Chromium读，脚本/隐藏内容不作引用依据；不导入产品Parser/Verifier。

有效局部红灯ae319df7：仅检查相同原文是否出现的比较器将其他页/其他读取误判PASS，同一目标断言要求FAIL，在断言处失败。它检验新评分器绑定条件，**不是现有产品已存在跨店S0的证据**。修后同一断言绿，正常控制、旧读取/旧SHA/跨店、假引用、未说明误报、日英冲突强行肯定、敏感确认、无人工Gold、未知同义改写均保持各自三值结论。本地构造输入均明确标注，不称网站回放。

自动一致性对已人工确认表述判定；自由同义改写未被人工确认时NOT_EVALUATED，错误数null，不能把未评混入0。真实候选本轮应由评价器给NOT_READY（0题已评）。没有人类Gold就不声称问答能力通过。

## 四层记录

1. 端到端：G1产品/真实模型/Live NOT_EVALUATED；本切片只交可审候选和评测工具。
2. 环节：来源SHA/摘录位置预检通过，答案语义、无说明充分性与Gold均等待人工复核。构造评分正常/拒绝控制只证评测合同。
3. 严重程度：未对用户展示餐厅结论，真实S0 NOT_EVALUATED；构造反例不是现实错误声明。源码不触及产品执行。
4. 归因：候选缺人审是当前首个门槛；明确过期子类缺原始材料单列，不能改写成已覆盖。

成本：新增真实模型/Google/网站/Live/评测GET全部0；3b共享账本并集保留G2零调用条目并加本项零条目。不读、不暂存.env。

## 验证与下一门槛

冻结fc5146b9五门禁全绿，收据在[verification](verification/)：typecheck0.452s、arch0.202s、默认1104/1104 28.195s、build0.405s、Chromium163/163 98.559s；逐项前后净树。额外独立Chromium核对8页49摘录全部出现、位置及双SHA预检通过；真实候选评分入口正确NOT_READY、evaluated=0、错误数null。输入SHA再次复核通过。产品/Prompt/Schema/State相对main零差异。工作分支提交推送供复核，不合main。下一门槛是复核者逐题决定，不能把本批候选直接交B作正式Gold。

2026-10-27 CET批次2：按用户决定删除A的重复0046及Accepted说法，统一为“ADR（对话 B 起草，待批准）”。QA本批将改为英文题面与自然错页/错运行控制；当前尚未修改候选数据、尚不合main。用户列出的确认题号25个/改写题号5个，与24/6数量冲突已异步核对。

## 批次2：复核落盘与自然错页用例

Evidence status：exposed offline development / mixed review state；25确认＋9候选，34题整体NOT_READY，非完整验收Gold。时间2026-10-27 CET。已基于main/f465ada0重放，双方文档和预算id并集保留。A重复ADR删除，B起草Proposed待批。

用户更正计数：Q01–Q20、Q26–Q30共25题写入answers.reviewed.json，状态REVIEWER_CONFIRMED，确认人为independent reviewer (Claude), 2026-10-27。answers.candidate.json保持8bd6bb8c原字节，SHA 7635f27e760b66190c74ddd3cf6fba0bc60a02263116a621a330b44fdf0d8466。Q26题意保持，只英译正式题面；期望双方英日原文、不一致及餐厅确认，不把冲突判成确定收费。

Q21–25五题改为自然问题，已展示店/提供页/页所属runId由独立元数据表达。Q21大山店问席位、给西池袋页；Q22西池袋问无障碍、给大山页；Q23 Sushi Sen问午餐服务费、给Matsumoto页；Q24 Aloft晚餐、Q25 Alaska午餐给旧run页面。错店/错run事实不进入答案，期望UNVERIFIED；本离线包不重读。场景绑定元数据为本地构造，HTML仍历史原字节，不能称新网站回放。五题仍CANDIDATE。

全部34题正式题面为英文，原中文保留questionZh。新增Q31 Nakamata日文包间、Q32 Matsumoto日文地址、Q33 Alaska日文午餐、Q34 Sen评论价格陷阱；4题全为CANDIDATE。原文位置和源SHA见batch2/changed-question-locations.json；证据明细与答案不向B开放。Q34评论不能升级商家事实，片段未写不扩大成全网站未写。

评分合同source-quoted-qa-scorer@2：MISMATCH→UNVERIFIED且禁止错误页事实；CONFLICT→ANSWERED＋双引用＋不一致提示/餐厅确认；其他同名。d0933928旧评分器两条映射本地构造断言均实际FAIL、预期PASS，类型检查通过，是有效红灯。修后六控制通过；新增错run与错误页事实泄漏、冲突缺一引用/缺提示拒绝，原同店/本次引用/敏感/未审阻断保留。

原prepare-candidates执行生成器退役，Git历史保留；新修订脚本固定读取8bd6bb8c。旧inputs-sha256与验证只属原提交历史，不证明当前文件；本批单独冻结22份SHA。全34题正式评分应NOT_READY/evaluated=0/错误数null，不能报告产品G1通过。英文同义答案需复核，不命中已审表述为NOT_EVALUATED，不推断S0。

0d26174d五门禁全绿：typecheck 0.433s、arch 0.203s、默认1110/1110 28.540s、build 0.482s、Chromium168/168 108.005s，逐项前后净树。正式源页核对8页/56摘录PASS，22份当前冻结SHA一致；整体正式评分NOT_READY，9项未审、错误数null，未读响应文件。收据及压缩原始日志见batch2/verification。真实模型/Google/网站/Live全部0，不读.env。Runner按用户批准另基于B/0a466bcd建立集成分支，B产品原字节、单适配文件，不随QA合main。

## Final review confirmation (2026-10-27 CET)

All 34 references are REVIEWER_CONFIRMED by independent reviewer (Claude), 2026-10-27, dataset phase3b-qa-reviewed@1. Q24/Q25 now set allowFreshRead=false and require UNVERIFIED. No reader exists in this offline evaluator. Fresh-read successful answers are reserved for later Agent online evaluation. Questions, page bytes, and historical candidate answers are unchanged. Prior 25/9 and NOT_READY results remain historical and are not relabelled.

749dc119 produced the expected preflight red at Q24 allowFreshRead=true; the identical control passes after the data correction. The complete preflight verifies 34 confirmed references, 8 source-page SHAs and 56 quotation locations. Product code is unchanged. c10fdeed five gates PASS (1110 default /168 Chromium), each starts and ends clean. Frozen SHAs match; all 56 quotation evidence entries are unchanged, so independent source-quote checks are reused. Raw logs/receipts are in review-confirmation/verification. No real calls.

The user moved the missing TableCheck positive calendar to the first 3b Live recording, also used for new replay. Add that calendar to G2 before accepting the TableCheck G3 slice; G3 starts with Tabelog. The earlier stop is superseded by this explicit sequencing decision. Runner proceeds on its separately approved B/0a466bcd integration branch.

## Reviewed Q28/Q30 outcomes, current dataset@2

User decision keeps ADR0046 and B core unchanged. Q28/Q30 accept either NOT_STATED with no citations, or ANSWERED quoting the related original text and explicitly limiting it (not a safety guarantee / not halal certification). Both require the correct category and actual confirmationRequired=true. Q30 is RELIGIOUS_DIET. Related evidence retains its original source position but is not required for NOT_STATED. Known unsafe affirmative fragments reject; unreviewed additional claims/paraphrases remain ungraded. Reviewer: independent reviewer (Claude), 2026-10-27.

Current versions: source-quoted-qa-scorer@4, phase3b-qa-reviewed@2, public questions@3. Other32 references and historical candidate bytes are unchanged. Five gates on main/c98438f8 combination pass1154/173, every gate starts/ends clean. The two topics/two outcomes through actual core/saved pages and independent references pass4/4. Current receipts: ../g1-runner/dual-outcome-review/verification. Prior incompatible-reference scores remain historical and are not relabelled.

Offline Runner implementation and verification are complete; main integration is authorized. Real-model evaluation remains NOT_RUN until B Agent integration completes. No real model, Google, restaurant, GET or Live calls; no .env.


## 2026-10-28 CET: Confirmed expression extension

Dataset phase3b-qa-reviewed@3 preserves original question/expected-result/evidence/scoring contracts. User supplies exhaustive real-model102 review:84PASS/18qualityFAIL/0falseclaims. Add39 unique exact frozen PASS expressions, with no FAIL text accepted. [Provenance](../g1-real-model/confirmed-expression-additions.json). Unchanged scorer offline check73PASS/24FAIL/5ungraded;11 human-PASS outcomes still blocked by old quote/regex checks. No silent rubric change. Six affected questions rerun only after B fixes merge; new real calls0.
