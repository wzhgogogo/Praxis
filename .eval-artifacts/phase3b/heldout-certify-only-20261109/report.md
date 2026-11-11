# 2026-11-09 只做见证认证

Status: verified integration candidate；源码冻结 `7d6880d2`。按用户本轮授权合入/推送 main 后停止，发布 SHA/ls-remote 见交付回执。本轮没有真实调用或私有原文。

- 新增 `run-holdout.ts --certify-only … --certify-output <新目录>`，沿用原文件承诺、清单SHA/逐字校验、净树固定SHA、--env-file和激活账本。分支在模型/Google客户端创建前返回，不打开浏览器或产品会话，不计模型/Live。
- 每例复用 `witness.read(..., false)` 只做1次空位GET；公开来源合同、20秒、8MB、无重试不变，先记账、至少间隔5秒。有位true、无位false、网络/HTTP/结构未知null均保存，源失败不阻断后续用例。
- 每例记录checkedAt、原响应SHA、HTTP状态、清洗副本路径；私有回合遮盖，凭据及JSON清洗沿用原规则，任何原响应都先清洗才写盘。无法安全保存时明确OMITTED；没有可记录响应时SHA为空，不补造响应。
- 认证输出单独记清单/用例/源码哈希，不调用正式目录绑定、不写正式input-hashes、不设置ledgerId/heldoutOutputRoot。清单变更后可另开认证目录，认证次数仍按同一规范账本累计，上限12，均从126中扣；不重置账本，不复用预认证结果替代正式逐次认证。
- 虚构清单19项针对性通过：有位/无位/失败后继续、GET精确计数与5秒间隔、503不重试、未知JSON、隐私/凭据拒录、清单变更不绑定、跨目录12次封顶、CLI模式互斥。没有接触留出题目。
- 7d6880d2同SHA净树全门禁PASS：typecheck、arch、默认1543、build、Chromium260 + G6 83、strict G2全12。写死扫描新增0，源码全在src/eval，产品源码0改动。

本轮真实GET/模型/Live均0，预算上限不变。已停止；复核者下一步执行预认证、确定最终清单，之后才正式开跑。命令与输出说明见[使用说明](runner-guide.md)，完整证据见[门禁](gates.json)、[虚构演练](targeted.log)、[范围审计](source-audit.json)。
