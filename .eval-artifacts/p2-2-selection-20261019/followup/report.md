# P2-2 批准的后续工作

Evidence status: current executable / exposed development evidence；原13a3b36回放与Gold保持不变。本轮用户明确批准1–7顺序、分段推送；无网站/探测/Live，模型仅第3段五颗各一次，累计上限30。

## 1 选店结构约束：离线完成

- 历史：001/003在路径已正确展示时仍选名称解析候选，0134无关字段非空。复核c816e74及用户批准提供预期；原软提示实验FAIL不覆盖。
- Domain共享scope：当前合法首次读取池有至少3家未查过、圆心半径已确认的DIRECT时，仅保留这些ID，原顺序不变。阈值不足时保留既有合法池；不新增资格或越界权限。Context@14与Validator一致；事实读取不变。显式用户刷新保留既有定向重查合同，不属于首次查位分配。
- Prompt@27明确非本动作字段必须为空，解释只入decisionSummary；校验不放宽。当前观察投影移至Domain candidate-read-observations供已有Context/Assessment/Web投影复用，没有第二套来源URL规则。
- 有效红灯selection-typed-red.log：恢复原assess时可查位池错误包含name-near/outside，目标断言失败；修后selection-typed-green.log通过。复用现有正常H001生产组合在原预算交付，以及事实/刷新、已查不计阈值、原顺序、未知半径等控制。
- 五门禁：typecheck-corrected/arch/build PASS，默认953/953，真实本地Chromium119/119（275830ms），原日志step1-gates/。初始Fixture类型遗漏已修，原日志保留。0真实调用；本地绿灯不是模型选择或网站效果验收。
- Evaluator复用既有revision2完整条件/旧严格对照；本段不修改标签或评分阈值，模型回放留第3段。

## 2 Tabelog来源繁忙与英文入口：离线完成

- 原始输入：p20-h001、p1fB-h001、p1g-h001各取回2份完全相同的保存HTML，共6份、同一SHA25d8467e…；不是6个独立页面或忠实HAR Replay。busy-inputs/保留原字节、原路径和result SHA。标题/正文有来源固定访问集中提示。旧代码目标红灯busy-red.log为ENTITY_MATCH_UNCERTAIN，修后sourceBusy在身份提取前处理。
- Pack拥有固定页面识别、1秒重试间隔和Google Tabelog门店URL的/en/规范化；同一地区路径/数字门店ID保持，去掉query/hash和子页。没有新增站点映射，未放宽名称+地址/电话，也未更改原生身份连续性。
- Adapter每候选/来源最多一次繁忙重试；等待和再次导航均消耗原Executor操作/墙钟预算。再次繁忙保留UNKNOWN/SOURCE_BUSY和原始标题诊断，失败分类ENVIRONMENT；Grounding在身份比较前保留来源原因。截止时间先到则不发第二次请求，保留超时原因。CAPTCHA/用户接管规则不变。
- 原Adapter/Pack所属覆盖43/43；同店恢复可AVAILABLE，真实地址冲突仍UNKNOWN；250ms来源期限对照只有一次导航，无预算重置。真实本地Chromium在15秒/24操作控制预算内恢复精确2人/19:00结果，1次等待、0模型，见busy-browser-green.log。旧mock仍声称日文落页的Fixture已同步为实际请求的英文URL；调试失败保留，不作为产品红灯。
- 尚无当前真实网站/翻译页身份兼容性或速度收益结论；本轮禁止外站/探测/Live。

第2段最终五门禁：typecheck/arch/build PASS；默认957/957；真实本地Chromium120/120（277450ms），见step2-gates/。0网站/Google/真实模型/探测/Live。
