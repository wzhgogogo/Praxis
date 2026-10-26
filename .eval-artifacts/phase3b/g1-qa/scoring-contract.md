# source-quoted-qa-scorer@1

只属于评测，不修改产品Prompt/Schema/State。CLI：

```sh
node --import ./scripts/test-filesystem-guard.mjs --import tsx src/eval/restaurant/fact-qa/run.ts --questions questions.json --references answers.reviewed.json --responses responses.json --reads reads.json --out evaluation.json
```

answers.reviewed.json是未来复核后的文件名示意，本批未创建。引用文件根为answers数组，每项questionId/status/answerKind/candidateAnswer/evidence；status必须REVIEWER_CONFIRMED。人工可增加approvedAnswers（确认的等价表述）和rejectedAnswers（已核对的错误表述）；否则人工确认的candidateAnswer本身作为确认表述。只有CANDIDATE时NOT_READY，evaluated=0、错误数null，不读取responses或启动浏览器。

responses数组每项questionId/answer；answer包含kind（ANSWERED/NOT_STATED/MISMATCH/CONFLICT）、text、citations。citation包含pageId/pageSha256/readId/quote。reads为Runner独立保留的本次读取日志（questionId/pageId/pageSha256/readId），不能取模型自述字段。pageSha绑定questions中保存原页，评测者从原始字节另用真实Chromium生成正文；页面脚本、服务工作线程及外部传输全部禁用，不导入生产Parser或Verifier。

按答案逐项判：同店、本次读取与SHA绑定；quote逐字出现（只折叠排版空白，不改词、数字或汉字）；已确认的支持片段被引用；未说明判断与明确口径；敏感类别包含请向餐厅确认；答案与人工确认表述一致。候选不作Gold。未命中人工确认表述时一致性NOT_EVALUATED，不用字串差异断言语义错误，须人工核对、补确认表述后重评。

falseClaimCount的单位为答案，不估算句内事实数。存在明确跨店肯定/非本次或伪造引用/与已确认无说明或冲突结论相反的肯定/人工已拒表述，记该答案1。缺少引用或确认提示使FAIL，但不因此推定事实本身为假。无法核验或未确认返回null，不能汇总为错误0；只有全部可评且PASS才能宣称本离线集通过。该评分器不自动解决自由文本全部语义；S0仍按独立证据与人工复核，不能以内部原因码自证。

本地构造控制不是人工餐厅Gold或网站回放，不能作为G1产品实现已经验收的证据。B不得在实现期间读取references或由其生成的细节输出。
