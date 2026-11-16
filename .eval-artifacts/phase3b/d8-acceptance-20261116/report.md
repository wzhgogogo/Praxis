# 2026-11-16 单次 D8 验收
时间CET，餐厅日期时段JST。被测源码a66a2edcb2ffe8e3eaa42f4c0e79680382539c9d，运行配置冻结e422488f0bad55370aa64d0a52e0eccaca3e1557。用户批准保持源码、分流不变的唯一一次D8，独立1Live/8评估GET/55模型/0环境重跑。

**结果：未通过本次验收。网络已恢复，但未完成唯一店铺身份，未交付B1，两个条件追问未触发。**

| 四层 | 本次事实 |
|---|---|
| 结果 | 最终NEEDS_INPUT、无交付；原自动NOT_EVALUATED保留。BOUNDED_NO_RESULT与NO_DELIVERY_WITNESS仍为FAIL |
| 来源轨迹 | 填入正确全名后，观察没有暴露可点击的精确联想，随后提交Search进入日本泛列表，反复重填；未到达目标店的查位 |
| 独立安全 | S0=0、S0证据PASS；320/320到达来源的请求边界PASS，未错误展示分店 |
| 首个偏离 | decisions #6 / diagnostic snapshot-0004.html / observation:3；网络200时发生控件暴露与动作选择偏离 |

## 首个阻点
#4打开Destination，#5填写权威全名。#6的真实决策输入只有：
- 可点击的Search（observation:3:target:182）。
- “Are you looking for…”与三家店的聚合文本（target:263，availableActions为空）。
- 没有可点击的单店精确匹配目标。

同时原始snapshot-0004.html确实保留了三项联想。它们为div role=option、tabindex=0、aria-selected=false，aria-label包含店名及地区/类别。模型#6点Search，#7看到只带默认日期/人数的日本泛列表，之后#8–10等重复重填。不能把此次未交付再归因于403，也不能只把责任归为模型忽略了一个已提供的精确按钮。确定的缺口位于原DOM控件到模型可用目标之间；具体过滤机制尚需离线验证。[原始偏离摘录](first-deviation.json)。

## 网络与实际成本
catalog 5次200、search 37次200、geolocation 2次200；本次已完成的Guard Node传输88次全部200。静态体检4项通过。目标shop API没有因精确选店而触发，查位、目标B1和G1本轮未验证。前后独立Tabelog见证均确认原店2026-11-18 20:30 / 2人仍有位。

首回合284.333秒，总产品运行285.053秒，45次模型调用、3次Google请求。实际1Live/6评估GET/45模型/0环境重跑。新账本剩0Live/2GET/10模型，停止后未追加运行。原判定与失败保留，没有改评价器或补造模型结果。本次单样本不统计稳定率。

## 完整性
源码净树保持a66a2edc，全部冻结输入哈希不变；当前xray配置前后SHA相同。主工作区HEAD、diff/status哈希与18份既有账本的保护记录前后一致。三类录制全开，18/54页面获回放资格，隐私与未捕获响应缺口保留。凭据扫描163文件、59,024,326字节，两项已配置凭据无命中。

[原评价](d8/live/runtime/dev-d8-acceptance-20261116/evaluation.json) · [完整决策](d8/live/runtime/dev-d8-acceptance-20261116/execution.decisions.jsonl) · [运行与网络分析](run-analysis.json) · [分流保护](routing-after.json) · [其他保护](protected-after.json)。

本轮仅运行和离线取证，未修改源码或分流，没有合main、没有启动盲测。
