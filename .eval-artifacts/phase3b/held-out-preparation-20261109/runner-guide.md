# 私有清单运行入口（draft / not integrated）

当前只完成离线准备。复核通过后才由用户提供原文件和复核者填日期的 JSON，均放在仓库之外。不要把文件内容粘贴到命令、Prompt、仓库或日志。本目录 budget-template.json 为未激活的作用域账本草稿，继承真实849模型累计及来源账本SHA；执行前经复核激活，不重置模型计数。

审计中的 cases.sha256 是承诺原段哈希，cases.runSHA256 是填写后用例 JSON.stringify 的 UTF-8 哈希；manifestSHA256 始终覆盖清单原始字节。

清单 schema `phase3b-private-run-manifest@1`，`cases` 顺序严格按 commitment.json；每例含 `id, fillings, request, followups, witness, oracle`。`fillings` 是占位符→填写值；`followups` 含 `id,kind,text,condition`，kind 为 MESSAGE/PAGE_QUESTION。condition.type 仅 PRESENTED_ANY、PRESENTED_WITH_SLOT、TARGET_PRESENTED_WITH_SLOT、ASKED_FOR_DATE；TARGET 需 `target:{provider,sourceEntityId}`，可选 `time`，均按结构化当前结果判断。可带 reviewer 私有 fallback.location/outlet，只记录其哈希，不自动插入新文本。

oracle 沿用 G6 独立 Gold；完整请求 HARD/范围语义必须由独立复核者提供，不从产品状态生成。原生来源的机械身份/时段/入口注释由录制提取。历史资格来源 `evidenceRefs` 指向公开冻结原文；未经独立绑定的语义仍明确未评价，不能假装合格。`oracle.reviewedReadRules` 必须逐字抄录本轮采用的21条独立字面量清单；覆盖20条已批准动态合同，包括文字与店铺读取。没有新增 Guard 权限。

只有实际开跑时才使用（下面均为路径占位，不含私有题目）：

```sh
node --import tsx src/eval/restaurant/agent-loop/g6/run-holdout.ts --validate-only --original /private/location/original.txt --manifest /private/location/run.json --manifest-sha256 MANIFEST_SHA256
PRAXIS_RUN_HOLDOUT_LIVE=1 node --env-file=/private/location/credentials.env --import tsx src/eval/restaurant/agent-loop/g6/run-holdout.ts --original /private/location/original.txt --manifest /private/location/run.json --manifest-sha256 MANIFEST_SHA256 --source-sha FROZEN_CLEAN_SHA --budget /private/location/active-budget.json --output .eval-artifacts/phase3b/authorized-heldout-run
```

验证命令不构造客户端、不访问网站。Live 必须净树/固定源码SHA、manifest原始字节SHA、全部合同、env-file及激活账本一致；本轮不执行。网络使用与现用测试环境相同的浏览器分流变量；Google保留其代理、DeepSeek使用其当前服务器配置。不修改代理规则、证书或重试策略。每次认证与后验按现有 G6，体检另先记账，≥5秒间隔。

公开录制保留原有隐私清洗。私有请求正文在模型决策 messages 中整体以哈希替代；产品会话保留 ASSISTANT 回答和交付文案，USER 正文以哈希替换，其他产物中完整回合文本以哈希遮盖；Google请求体若包含完整私有回合也遮盖并记录原请求SHA，公开响应仍清洗保留；源站响应仍按原规则清洗。单独从公开录制重算涉及用户权威引用时，需要用户提供同一私有清单还原哈希文本；不在仓库保留原文副本。源码/历史录制未覆盖的来源结构仍会明确缺证停下，离线演练不证明真实 held-out 能力。
