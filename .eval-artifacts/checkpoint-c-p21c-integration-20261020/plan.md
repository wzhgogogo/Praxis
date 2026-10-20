# Checkpoint C + P2-1c：离线集成切片

- Evidence status: exposed development / current integration work; no holdout.
- 用户当前授权：仅合并、五门禁、22份旧产物重新评价与推送；真实网站/模型/探测/Live均0。后续5次探测只在用户另行通知后启动，不创建定时任务、不续期见证。
- 基线先 pull --ff-only：origin/codex/integration-checkpoint-c @8ecfcfc；合入 origin/codex/fix-p2-1c-region-entrance @ddfdedd。已有检出目录不变，使用自己的临时工作树；最终普通推送到集成分支，不改来源分支。
- 失效依据/预期：ddfdedd复核发现两个不同State都叫17，不能以自动合并等同契约兼容。独立预期来自用户：State18/TaskDefinition16，P2-3价格与条件、P2-1c提前读取字段同时存在；Browser Prompt17保持，Context15/Agent Prompt27保持。
- 复用回归：既有PGlite恢复合同先将独立版本预期改18保留红灯，然后统一当前源码与Fixture；保留两边所有行为测试，实际factory+Chromium继续覆盖地区、价格、条件展示、身份/半径/权限。必要差异以合并冲突与版本/字段记录核对，不新增测试平台。
- Evaluator复用：Evaluator30/rubric26与8ecfcfc的同一22条Manifest、证据、Gold、独立Comparator；新目录保存自动输出，冻结后再比较标签。结果类型22/22、S0-声明20/20为本轮门槛；2条原中断样本仍不计S0分母。全流程禁用fetch，无付费模型。
- 完成/停止：五门禁全绿、校准达到原门槛、文档/原始证据保持且普通推送成功后停下；不将校准当作22次产品成功或新Live。
- 后续待通知约束原样记录：探测总预算55→60，神乐坂1→中目黑1→h001→神乐坂2→中目黑2；同B来源数据预检/间隔≥5分钟/403、503、429或繁忙页暂停15分钟单次重试/仍失败停止；见证最早2026-10-21 10:47北京过期，未跑完则停，不自行续期。本轮不执行。
