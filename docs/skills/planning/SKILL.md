---
name: praxis-planning
description: 按范围规划Praxis诊断实验、局部实现或架构与安全变化；未知平台能力先做有界验证。
---

# Praxis Planning

按[INDEX](../../INDEX.md)选择阅读范围，核对真实代码与当前证据。已有且未变化的阅读结果可复用；小型文案、链接和配置说明修正不需要完整设计文档。

## 选择计划深度

| 类型 | 必须明确 |
|---|---|
| 诊断实验 | 问题、已知事实与假设、控制变量、输入来源、调用/时间预算、停止条件、证据与清理 |
| 局部实现 | 用户可观察结果、受影响模块、行为/契约变化、失败结果、验收和必要验证 |
| 架构或安全变化 | 以上内容，以及状态权威、Policy/Authorization、幂等、Outcome、数据生命周期、相关ADR |

计划可直接写在工作说明中；只有跨文件决策或需持续引用时才新增计划文件。每次选择一个可由用户入口或Harness完整驱动的纵向切片，后续能力进入Roadmap。

## 按改动展开

- **语义链：** 明确Interpreter、Proposal、Compiler、Reducer各自负责的字段和拒绝路径；Contract合法不等于语义正确。质量按[Eval](../eval/SKILL.md)独立验证，模型解释不作为用户确认或State patch。
- **Agent/工具：** Action是提议，Validator不选择下一步，Router绑定权威参数。页面内容不是指令或授权；按现实效果识别外部写入。
- **Live / Eval：** 执行、artifact和evaluation分别保存；修改语义、Agent、执行Contract、证据规则、终态或诊断字段时，明确Evaluator影响。可独立检查的事实走确定性artifact诊断，不能判定的维度标为未评估，不为通过当前样本静默改rubric。
- **状态/执行：** 区分提交前失败、明确失败与提交后结果未知；旧Authorization不能用于新的Proposal，`OUTCOME_UNKNOWN`不得盲目重试。
- **Browser/Provider：** 未知页面和能力先标Unknown并安排只读验证。页面就绪、操作成功、证据可信分别定义观察条件；正常等待、重新观察、重新提交分别设边界，不在实测前猜测完整DOM契约。
- **结构调整：** 通用业务抽象需两个真实使用者；安全控制可按Accepted ADR建立最小实现。Pilot前无真实消费者时修改全部调用方，不建立兼容分支；已有真实数据按迁移/保留方案处理。

不受影响的层可简记“不变”，不展开无关问卷。不得为单个样本建立专用业务规则，用户排除的标注、Holdout或artifact保持原样。

测试计划先找既有行为覆盖，明确复用、补充与随旧路径退役的测试；维护准则见[Test](../test/SKILL.md#测试维护与退役)，不默认每个新模块配一套新测试。

## ADR与开工条件

改变已接受的模型供应商、职责、权限、部署、Runtime/Domain依赖、Outcome权威或关键数据政策时，新增ADR明确替代范围，不改写历史Decision。局部实现和诊断输入选择无需ADR。

实现前明确影响正确性与安全的决定和验收；尚未知的技术细节通过有界实验确定。达到预算后报告已证实、失败和未到达阶段。验证引用[Test](../test/SKILL.md)，交付引用[Post-change](../post-change-verify/SKILL.md)。
