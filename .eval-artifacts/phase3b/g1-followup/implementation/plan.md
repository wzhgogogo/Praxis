# G1 Agent/Web纵向接入（停止点1）

用户已批准Prompt29/Action5/Context17/State24/TaskDefinition22；实施前最新origin/main=c98438f8，五份文件仍为28/4/16/23/21，无并行版本冲突。ADR0046只修Approval行，不改正文。

承诺：认证用户在已展示门店卡片追问，通过持久用户事件、Agent合法无参动作、Validator、Router、既有G1核心与Reducer完成；英文Web展示短答、原文、URL/读取时间、未说明查页与敏感确认提示。模型不选门店/run/URL，不改变HARD、库存或授权。

先红：真实HTTP/PGlite入口已能展示结果，但POST门店追问不能返回答案。然后在同一入口补齐正常及拒绝、缓存/缺缓存、预算/取消/迟到/跨用户/幂等路径。真实Chromium验证用户可见表单与来源引文。Fixture传输只证接线，语义质量留A评分器/下一停止点。

复用同一Native/官网事实reader及identity hook。缓存仅同readRunId/同店，模型调用前冻结；缓存缺失按原reader/Guard/预算读取，不开放搜索。保留原read运行的模型次数与绝对截止，追问不隐式开新额度；读取失败/重启失去预算上下文时明确未核实，禁止绕开预算。取消后旧结果不可回写。

仅B产品与测试/对应最小合成fixture；不改C身份/语义/详情页，不改A Runner/题集/评分器，不读answers*.json或.env。不运行真实模型、Google、网站、Live，新增调用0。不开始G3。

验收：先有效红再绿；输入与外层先提交冻结；typecheck/arch/npm test/build/真实Chromium五门禁逐项前后净树，归档SHA与原始日志；状态、开发、测试、月索引同步。完成停止点1并推送工作分支，未额外获批的main合并不做。门禁修两次仍红、S0、共享版本冲突或超出本范围时停下。
