# 检查点 C 复核收尾：离线切片

- Evidence status: current executable preparation；已暴露开发集，非 Clean Baseline。
- 依据：用户本轮指令、4ac68fa 的 independent-review.md、Phase 2 Playbook §6/§7；Planning/Test/Eval/Post-change 规程复用未变化版本。
- 起点：准备分支 4ac68fa；合入集成 a3f6b84，五份治理文档冲突保留双方正文，修订号取较新并递增、索引计数重算。生产源代码相对 a3f6b84 不变。
- 切片承诺：关闭 TableCheck 未评就停批的问题；提交并冻结可溯源阶段账本；最终冻结后一次 0 外站／0 真实模型的完整 Runner 演练；五门禁全绿后只推送准备分支并停下。

## 运行与评价规则

18 次顺序、500 秒／50 模型／40 Google、相邻尝试至少 5 分钟、403/503/429 或繁忙页 15 分钟后最多一次环境重跑，以及 S0 PRESENT 立即停批均不变。只有 ENV_FAILURE / ORCHESTRATION_INTERRUPTED 可重跑，每例跨三次重复最多一次。NOT_EVALUATED 继续后续运行，保留安全未知，不计为零错误或安全验收通过。

TableCheck：外层在真实 Guard 已派发的 Route.fetch 边界保留库存响应原始字节和 SHA，并独立核对冻结审核规则。Guard 原始响应回调补录 CDP/native 路径；无可复用请求时仍保留原始响应路径／SHA。两种捕获可对应同一个请求，不能按文件数当网络请求数。只保留库存端点，不额外采集 Guide 的其他内容；不保存 Cookie 或认证头。被 Guard 拦截的调用不产生可重放的请求。

只有同候选上下文、同 URL／方法／请求体，且字段形状同时通过 Guard 和冻结已审核规则的库存请求才会独立复查。外层不添加模型、菜单操作或新权限；重放禁用重定向，不转发凭据。HTTP 失败、缺失请求绑定、未知传输或未知解析语法一律 NOT_EVALUATED，并继续后续样本。S0 PRESENT 始终优先。

评测侧独立解析器只接纳原始响应里明确、启用、同店／同日期／同人数且对应展示时间的库存链接；不调用生产 parser。不把 calendar 的日期标志、status=success、failure/data:null 或缺少链接推成库存真值。API 具体结构尚未支持时，即使复查 HTTP 成功也保留 NOT_EVALUATED。SUPPORTED 只补充复查支持，不自动替代 @30 对其他 HARD／身份／展示的评价。原始 evaluator@30/rubric@26 输出单独保存，外层补充标记 checkpoint-c-tablecheck-review@1；不覆盖原 result，不抹掉任何已有 S0 PRESENT。

## 阶段账本

phase2-ledger.json：P2-0 两次整单 Live／72 模型；P2-1 347 模型（已包含 14 次真实模型决策回放）；P2-2 及名称基准 50 模型（15 次选店回放＋35 次基准调用），P2-3 为 0。第二阶段合计 2 次整单 Live、469 模型、0 次正式整单环境重跑。

为遵守 Playbook 的共享 4000 总模型额度，再带入 P2-0 前 1014 模型，预算扣账总计 1483，剩余 2517。历史 1086 已含 P2-0 的 72，不能重复加。第二阶段 Live 剩余 98、环境重跑剩余 10；历史第一阶段 37 次 Live 单列，不重复冲入第二阶段 100 次预算。

失败的付费调用也计数，重叠累计快照不重复累计。source-only 预检失败计数另列，既不当作正式整单 Live，也不冒充正式整单环境重跑。reconcile-ledger.mjs 从逐批已提交 ledger／回放 progress 对账；冻结包同时绑定全部来源 SHA。外层在每批启动前验证源 SHA 和预算，预留 18+最多6次重跑、最多1200模型。对历史 S0 的独立签收仍未评价，不用预算对账替代安全评价。

## 验证与停止

- 红灯：旧 nextAction 对 unknownSafety 返回 STOP_BATCH，违反已批准的继续规则；保存原断言失败。
- 绿灯：旧八项外层行为复用；补充已审核请求原样重放、独立 parser 正负样本、未审核零调用且保存原始 SHA、S0 不被未知抹掉、账本漏回放／余额不足拒绝。
- L2：真实 Chromium／真实 Guard／本地 HTTP 接收端验证请求不变、响应原始字节 SHA 与不保存 Cookie 头，不以假 Route.fetch 自证运行时语义。
- 五门禁：typecheck、arch:check、npm test、build、本地 Chromium Fixture；独立外层 typecheck。
- 运行前先提交编排、输入和账本，再生成新的 review-followup/live-freeze.json。冻结后只跑一次脚本化完整链路，输出到 review-followup/rehearsal/；过程中不改配置。
- 不执行见证认证或 Live。本包是待批准的 Live 配置冻结；当前库存见证仍需在 Live 前 24h 内由用户批准认证，并在启动 Live 前追加绑定认证 registry／原始证据 SHA。

## 预计用时（不含环境停批）

认证：16 家登记见证，约 32 个基础 GET，额外登记 party 页最多 1 个；按每 GET 20 秒预算，纯传输上限约 11 分钟，另含逐项 HARD 与身份独立人工复核，建议预留 30–60 分钟，0 模型。

18 次：沿用历史 130–430 秒范围，通常约 3–4 小时（含 17 个至少5分钟间隔及运行后复查）。满额500秒 ×18＋17×300秒＝235分钟（3小时55分钟），另最多约18分钟的逐店独立复查，建议安排4–4.5小时窗口。403/503/429 的15分钟冷却和环境重跑另加，不纳入上述常态估算；认证与 Live 同一24小时窗口内安排。
