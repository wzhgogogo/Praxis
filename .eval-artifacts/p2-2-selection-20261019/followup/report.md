# P2-2 批准的后续工作

Evidence status: current executable / exposed development evidence；原13a3b36回放与Gold保持不变。本轮用户明确批准1–7顺序、分段推送；无网站/探测/Live，模型仅第3段五颗各一次，累计上限30。

## 1 选店结构约束：离线完成

- 历史：001/003在路径已正确展示时仍选名称解析候选，0134无关字段非空。复核c816e74及用户批准提供预期；原软提示实验FAIL不覆盖。
- Domain共享scope：当前合法首次读取池有至少3家未查过、圆心半径已确认的DIRECT时，仅保留这些ID，原顺序不变。阈值不足时保留既有合法池；不新增资格或越界权限。Context@14与Validator一致；事实读取不变。显式用户刷新保留既有定向重查合同，不属于首次查位分配。
- Prompt@27明确非本动作字段必须为空，解释只入decisionSummary；校验不放宽。当前观察投影移至Domain candidate-read-observations供已有Context/Assessment/Web投影复用，没有第二套来源URL规则。
- 有效红灯selection-typed-red.log：恢复原assess时可查位池错误包含name-near/outside，目标断言失败；修后selection-typed-green.log通过。复用现有正常H001生产组合在原预算交付，以及事实/刷新、已查不计阈值、原顺序、未知半径等控制。
- 五门禁：typecheck-corrected/arch/build PASS，默认953/953，真实本地Chromium119/119（275830ms），原日志step1-gates/。初始Fixture类型遗漏已修，原日志保留。0真实调用；本地绿灯不是模型选择或网站效果验收。
- Evaluator复用既有revision2完整条件/旧严格对照；本段不修改标签或评分阈值，模型回放留第3段。
