# 3b A批次1：G2切片

从签收main cc127320开分支，只改A的评测/Harness、测试fixture、必要脚本配置和文档。不改产品、Guard、Recorder、站点parser、Prompt/Schema/State，不读.env，全部真实调用0。

G2：真实本地Chromium读Tabelog/TableCheck列表、详情、日历，每站每类至少2份。种子确定性改名class token、id、data-testid及其他data-*，同步内联CSS选择器；保留可见文字、ARIA、href、表单name/value。记录原始SHA、变异SHA、映射和逐页结果。相同PASS；只退为未知DEGRADED_HONEST；矛盾或未知变已知FAIL即停。Tabelog日历冻结诚实退化，G3须转PASS。

先用F3仅改class的旧操作取得id/data覆盖目标红灯，再补完整变异、公开语义完整性核对及分类器反例；另复用真实Chromium通用控件行为，模型替身只按当前可见label/ARIA引用选动作。新增test:dom-change固定检查及五门禁，输入脚本先提交冻结、门禁前后净树。

ADR0046记录用户两原则。G1另分支只交questions.json与answers.candidate.json；用户已确认无既有人工Gold，全部答案CANDIDATE，复核前不作为验收集。回放另分支先复现F5槽1原分歧；静态资源只给方案/离线验证，不放宽脱敏或Guard。

停止条件：任何FAIL/S0；门禁修两次仍红；需要真实调用；需跨B/C文件或共享版本；验收改变。每项从最新main独立分支，推工作分支、不合main，三项完成后停。
