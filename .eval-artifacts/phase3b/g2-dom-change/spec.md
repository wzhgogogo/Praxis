# G2规格：dom-marker-mutation@2

规则1为最初“ARIA/href字面不变”的提议。用户明确改为规则2：所有id均改名，不保留被引用id的例外；同一映射同步改ARIA的labelledby/describedby/controls/owns/activedescendant/flowto/details/errormessage（多值逐个）、label[for]、页面内href片段、CSS #id、SVG url(#id)及xlink:href/href片段。只更改确实绑定原页面id的引用；悬空引用不改，按位置列出。内联脚本不执行、不改，逐处列已知原id出现位置。

class token、所有id、data-*属性名、data-testid值由种子+类型+原值的SHA256确定；其他data值不变。内联CSS选择器同步改名，并更新SVG URL引用。可见文字、非ID引用ARIA值、公开链接（页内绑定片段除外）、表单name/value不变。每个ARIA/label引用按元素路径比较原/变异目标，含悬空目标；同时校验公开属性、链接、可见文字、脚本原文。未通过为INVALID_MUTATION，不计业务分类。

输入每站LIST/DETAIL/CALENDAR至少两份，固定Git cc127320提取。G2用保存DOM、禁用页面脚本、拒绝外部传输；不代表历史网络回放合格。F5 TableCheck诊断DOM仅作G2测试fixture，绝不提升为Recorder合格页。沿用F3已声明的.is-hidden可见性shim，不能据此认证原始CSS遮挡/布局。sourceUrl/原始SHA/来源类型/捕获日期均随fixture provenance。

分类单位为页的来源业务事实。无证字段为未知（null/缺失），完成判定/忙碌标志本身不是资格或库存事实。LIST比对逐门店来源记录；DETAIL比对实际页面抽取身份字段，不用fallback伪造；CALENDAR比对实际日期状态、请求确认及已绑定库存。相同PASS；只损失已知事实而如实未知DEGRADED_HONEST；矛盾或未知变已知FAIL，立即停止。原/变异完成判定、控件观察完整保留作诊断，不把COMPLETE直接当合格。

当前逐页结果及原始业务事实冻结为暴露开发基线。G3不能靠两边都返回未知绕过：保留原页基线可知事实，再要求变异页PASS。若G3退役当前产品导出接口，需复核者安排A/B同步更新测试调用方，不保留旧产品兼容路径。

有效红灯：b089717f把F3仅改class操作放入同一真实Chromium控制，旧id仍存在（1!=0），在目标断言失败；不把启动/类型错误当红灯。规则2随后通过ID/data覆盖、ARIA多值/label路径、CSS/SVG、悬空引用、脚本不执行及种子重现控制。分类器独立构造矛盾/未知变已知反例，必须返回FAIL；这些本地反例不是实际来源S0事件。
