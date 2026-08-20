# Agent Instructions

在本仓库规划、编写或修改代码前，必须按以下顺序执行：

1. 阅读 `docs/INDEX.md`，确认当前 Source of Truth 和阅读路径。
2. 阅读 `docs/REPOSITORY-CONVENTIONS.md`，确认branch、版本、目录和文件命名。
3. 阅读 `docs/skills/arch-guard/SKILL.md`。
4. 根据改动范围阅读对应的产品、架构、Domain、Integration 和 ADR 文档。
5. 开始编码前按 `docs/skills/planning/SKILL.md` 明确范围、受影响层和验收条件。
6. 完成改动后按 `docs/skills/post-change-verify/SKILL.md` 验证并同步文档。

## Git、版本与命名

- 完整规则以 `docs/REPOSITORY-CONVENTIONS.md` 为唯一Source of Truth；Arch Guard不重复Git或文件命名。
- 分支表达工作内容，使用`codex/adr-<number>-<slug>`、`codex/feat-<slug>`、`codex/fix-<slug>`、`codex/docs-<slug>`或`codex/chore-<slug>`，不得再用`-vN`承担版本归档。
- 产品Release、ADR、State/Schema、Prompt、Dataset、Evaluator和Document revision分别版本化；禁止使用没有所属对象的裸`vN`描述当前系统。
- 不兼容架构或Schema变化通过ADR、Schema常量和迁移说明表达；历史检查点使用已验证提交上的annotated tag，不新建版本分支。
- 创建分支或推送前，确认工作区无非预期改动，并按范围同步`docs/STATUS.md`、`docs/history/DEVLOG.md`、`docs/history/TEST-LOG.md`和required verification。远端推送仍须用户明确授权；被拒绝、失败或未尝试时不得报告为已推送。

## 强制边界

- Web 前端不得持有或调用 DeepSeek、Google Maps、预约平台及其他生产 Secret。
- 模型输出不得直接改变 Task State，不得直接执行预约、购买、取消、支付或其他副作用动作。
- 没有通过 Policy Engine 且没有有效 Authorization，不得执行外部写操作。
- Task Runtime 不得依赖具体 Domain；Domain 之间不得直接依赖。
- 提交后结果不明确时进入 `OUTCOME_UNKNOWN`，禁止盲目重试。
- 新增或修改外部平台 Adapter，必须补充 Capability Matrix 和 Harness 场景。
- 新增通用业务抽象前必须证明至少有两个真实使用者；合成测试 Domain 不算。授权、幂等、Outcome和PII等难以后补的通用控制边界，可按Accepted ADR建立当前闭环所需的最小实现。
- Mock、Replay、Live Read-only 和 Controlled Live-write 的结果必须分开汇报。

## 实现原则

- 选择能够完整满足**当前明确需求**的最简单实现；不为假设中的未来需求增加抽象、配置、策略层、兼容层或间接调用。
- 按可运行的纵向切片逐层建设：每增加一层能力，现有产品仍应能端到端运行和验证；避免连续建设多个没有用户入口的基础设施阶段。
- 保持模块化和单一职责，但模块化不等于增加接口数量。通用业务抽象通常需要第二个真实使用者；授权、幂等、Outcome、PII等难以后补的控制边界，可在首个真实使用者时建立最小实现。
- 对大概率存在但尚无真实使用者的未来能力，优先在Design中预留职责和依赖方向，不创建完整代码路径。小型架构探针必须有Harness、明确停止点，并且不能延迟当前纵向Stage。
- 当前项目尚未进入生产 Pilot。未发布的接口、Schema 和代码路径默认**不保留向后兼容**：修改所有调用方和 Fixture，删除旧路径；不得增加兼容分支、双写、旧版 Adapter 或无真实数据需要的迁移层。
- 一旦存在需要保留的生产数据、进行中现实任务或外部消费者，不得直接破坏；先明确数据重置或迁移方案。该例外用于保护真实状态，不作为长期保留旧代码的理由。
- 不为极低概率且低影响的情况堆叠兜底逻辑。普通依赖失败采用一个明确、可观察的失败结果；不默认加入备用 Provider、多级重试或隐式降级。
- 低概率但会造成重复预约、重复支付、错误取消、隐私泄露或错误成功判定的情况属于安全不变量，仍必须 fail closed；`OUTCOME_UNKNOWN`、Authorization 和幂等保护不属于可省略的产品兜底。
- 历史思考、ADR、Eval Plan与Annotation Guide、Golden/Regression Set、Manifest与评分口径、运行结果摘要、`DEVLOG`和`TEST-LOG`属于可审计开发证据，应保留或移入Superseded Archive；必须标明`current baseline`、`frozen regression`、`superseded retrospective`或`draft / not integrated`及污染状态，不得把历史材料报告为当前能力或Clean Baseline。私有Clean Holdout原文不得提交、复制进Prompt或公开日志。
- 已被替代的可执行代码、Runner、Adapter、兼容路径、重复配置和只验证旧实现细节的测试不为保留历史而长期留在当前工作树；修改全部调用方并通过对应typecheck、architecture check、测试和build后删除，由Git历史负责恢复。禁止以“以后可能用到”或“方便回顾”为理由让新旧执行路径并存。
- 优先使用成熟、维护活跃的库，但只有在它能降低总代码量、维护成本或安全风险时引入；能用少量清晰代码完成的稳定逻辑不额外引入框架。
- 不增加未被当前验收条件要求的模型调用、网络请求、数据库往返、重试或循环；性能优化以实际关键路径和测量结果为依据。

## 测试原则

- 每个 Stage 必须交付一个可运行、可验证的纵向结果；测试证明该 Stage 的产品承诺和安全边界，不用测试数量替代产品进展。
- 优先测试外部行为、状态转换、授权和副作用不变量；避免为私有实现细节、等价分支或纯粹为了覆盖率重复编写测试。
- Mock 用于快速验证逻辑，Replay 用于真实响应回归，Live Read-only 用于连接和数据质量，Controlled Live-write 用于最终现实副作用；各自只证明对应范围。

如果用户请求与 Accepted ADR 或上述边界冲突，先说明冲突并给出合规方案；如需改变既有决策，新增 ADR，不得静默修改历史决策。
