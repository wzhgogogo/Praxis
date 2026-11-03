# 动态点名评价与四槽续跑

状态：draft / not integrated；已暴露开发输入，非留出集。时间为维也纳 CET（UTC+1），不合 main。

## D6 独立复核

用户复核 5912dd11：**S0 一次**，同一次结果展示用五家其他店替代 Ito，没有说明。`D6-reviewer-judgment.json` 单独记录，原 `d6-turn-budgets/runs/D6/evaluation.json` 及录制 SHA 不变。D6 不重跑；55/55 页准入和 Kyo no Rikyu 日历材料保留。账本只追加零调用复核旁注，由 693 为 694，历史行不改。

## 评价接线

`phase3b-g6-evaluation@3` 从 `namedReferences` 的真实用户选择事件及对应 State 身份绑定目标，写入槽的 `request.named`：候选 ID、Google Place ID、已经观察到的 Tabelog/TableCheck 店号、电话、地址、选择事件 ID。候选 ID 用来定位用户引用，实体一致性以强来源 ID、电话或完整地址判断；冲突强 ID 不由弱匹配放行，缺失店号不拼造。

Runner 每次实际用户读取结束直接保存 Runtime `exportReadArtifact.finalSnapshot.domainState` 的最小身份投影和新增权威事件，人数补充不会释放约束。历史 D6 只有已保存权威 View 投影，重核时与原已接纳 SEARCH_COMPLETED 的身份字段逐项交叉核对；不重建产品 State，不伪称网站回放。

`namedReferences.initial` 保留槽开始时的冻结具名期望（未具名时为 null），`turns[]` 保留选择/展示顺序，因此重新读取已保存的最终 `request.named` 不会反过来限制先前的开放推荐。明确同意其他店须有冻结 `allowOtherOutlets` 用户意图注记、该回合实际原文及 USER 的 OPEN_ENDED 事件/State，模型自行改范围不算同意。后来的同意不消除早先错误展示。每次错误具名展示批次计一次 S0，五店明细仍列为证据。

## 红绿与验证

- `red-named-binding.log`：原入口对 D6 的选择/State 引用没有接线，S0=0，预期 1；对明确同意其他店的正例仍被旧静态 named 拒绝。
- `green-named-binding.log`：D6 自动 S0=1、FAIL、停批，明确同意正例不判 S0。
- `green-focused.log` 及最终门禁：含保存 D6、授权/未授权范围变化、晚到同意、冲突 ID 和真实 Runtime/Live 组装正控制。
- Runner 组装正控制从实际源/模型 I/O 经解释器、Runtime、来源读取取得候选和选择事件，并将身份序列化给评价器；保存输入重放同一评分。早期 scripted 输出误带 SPECIFIC_OUTLET 不允许的 requestedResultCount，被 schema 重试后回到 OPEN_ENDED；这些诊断未作有效产品红灯。修正传输 fixture 的合同和原文引用后通过，未注入 State/事件或改产品。
- `D6-recheck.input.json` / `D6-recheck.evaluation.json` 是新规则离线重核：S0=1；原评价没有改。D6 其他身份投影未评项目仍保留，本批不借机放宽或修补它们。

## 续跑门槛与顺序

C（一）通知 main 533f1bc5；以远端核对与同步结果为准。同步后保留双方文档和预算条目，冻结四个独立单槽包与脚本，净树五门禁及严格 G2 全绿，才串行运行 D3 新运行、D5、W2 20:00 新认证、D2、D8；每槽后独立检查再启动下一槽。D6 不重跑。

请求原文/11-11 日期及 D2/D8 的 20:00 不改；具名四槽同时冻结已认证 W1/W2 身份作为初始 named 期望。W1 到 11-03 14:37 CET 后才两 GET 再认证；开发 GET 15/25 继承，耗尽即停；访问日最晚 11-04 运行。每回合 500 秒/50 模型/40 Google、槽三回合/150/120，开发模型 400、Live 8 不重置。S0、安全缺证或额度/日期条件不满足即停，不自动环境重跑。

目前没有新增模型、Google、网站或 Live 调用；最终运行结果与额度待执行后逐项填写，未运行不填零。
