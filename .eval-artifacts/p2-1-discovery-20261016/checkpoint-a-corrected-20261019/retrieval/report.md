# P2-1a homepage categories and prompt correction

Evidence status: exposed development evidence / local fixtures.

补齐Pack已识别的同地区首页类别：Pack从实际锚点提取本地区类别，执行器通过Pack地区绑定与当前可见LINK核对，继续拒绝隐藏、异地区与全国入口。未增加网络权限或资格放宽。Planner Prompt@2明确改写保留候选、少于5家优先相关类别、KEEP只用于列表足够；Schema@1不变。

A1原样7个类别锚点（snapshot5）旧Pack为0、新版大于0；生产组装的真实Chromium组合先红后绿，先改写再读取5家详情，原隐藏／异地区拒绝与候选保留覆盖仍通过。片段没有CSS，不当作原网站Replay；可见性由本地控件与新A来源另验。红灯red-pack.log/red-unit.log/red-composition.log，绿灯green-unit.log/green-composition.log；五门禁typecheck/arch/build通过、默认942/942、真实Chromium117/117，日志checkpoint-a-corrected-20261019/retrieval/gates/。

本项0真实模型/Google/网站/探测/完整Live；累计145/450模型、21/42探测、50Google。基线acfaaffa不变，旧A1不计比较但用量保留。下一步新干净工作树从头A10；Google-only nearby留A后单独提交，P2-1b不开始。

- [Original fragment provenance](fixture-provenance.json)
- [Five gates](gates/results.json)
