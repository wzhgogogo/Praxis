# D02-V 单次 Live 诊断：人数进度 / 分类下钻

- 时间：2026-11-13 08:52–08:57 CET（来源到访日期/时间按 JST，不换算）。已暴露开发用例，单次诊断，不外推同 SHA 2/2 稳定率。
- 被测 HEAD `8b7afec86d0830376a01945c5b6561a46d38447e`，源码 `ea93f6c4b0d140769ea381a413b9c23708db6b47`；编排运行前提交 `74396057679ecf40afc93e0af4a3abb7cd8c93b9`。配置/脚本哈希运行后保持一致；源树不落盘，不合 main、不跑 Held-out。

## 1. 结果层

**CAPABILITY_MISS / EVALUATED / qualified=false / S0=0；0 家交付，无 B1。** 计划/启动/完成均1；见证和无交付后验都确认12-10 20:30 /8人有位。产品批次265.938秒、首回合265.076秒；含见证/体检的外层总耗时292.339秒。实际45模型（33浏览器、5Agent、3事实判断、2来源提取、1语义、1检索规划），5 Google请求；6评估GET=1见证+4体检+1无交付后验，无重跑。完整资源/配对操作时间见run-audit.json，重叠操作时长不相加为墙钟时间。自动评价原文件保留，不重写或追加模型验证；本次无交付资格注释需补评。

## 2. 来源轨迹

| 环节 | 真实记录结论 |
|---|---|
| 发现 | decisions#4 LOCATION采用权威label；#6到东京中野目录；#7开菜单，#8沿观察到的父分类进入`https://tabelog.com/en/tokyo/A1319/A131902/rstLst/japanese/`，#9重开菜单：这部分新objective有遵循。#10转额外筛选，#11重复分类动作被REPEATED_FROM_SAME_STATE拒绝，#12再点筛选；诊断#149以NO_PROGRESS结束。未取得robatayaki精确范围列表，原生0候选，后续3候选来自Google。|
| 弹层退出 | snapshot7–9及#11观察没有可选关闭目标，本次没有出现可核验的“点击弹窗自身关闭按钮”动作；不能报告该子项验证通过，也不能把本次直接等同旧录制的ACTION_OBSTRUCTED。|
| 来源直达 / 名称搜索 | 未从精确目录产出Sumika直达URI；#14–16先名称搜索，随后才读Sumika `/13309182/`（snapshot13）；另两家也有名称搜索（#21–23、#27–29）。盲搜未消除。|
| 日期 / 人数 / 时间 | Sumika #17推进12月、#18点12-10；snapshot16–18、HAR index34（member_by_date）与35（find_vacancy）200确认日期，但后者svps=2/members=2。#19两次原生推进后发现8（诊断#271）。#20于provider42.3秒开始模型决定，5.044秒后才返回“点8”；provider45.018秒已关闭（诊断#275），**没有执行该点击，也没有8人响应**。因此本次PARTY_SIZE独立确认未触发，未出现重复PARTY_SIZE_NOT_CONFIRMED循环也不足以证明修复通过；未确认请求人数20:30，无B1。|

三店provider分别在Sumika45.018秒/7调用、Okajoki45.051秒/6调用、中野製作所まんてん別館45.022秒/5调用结束。阶段为同一provider内名称核对→查位；不能笼统称发现失败或DNS失败。Okajoki #25–26才展开日历；第三家#30推进日历、#32日期提议同样晚于关闭。provider时限与所有完成门槛未改。

## 3. 独立安全与证据边界

独立evaluation.input.json中的Node转发/浏览器CDP来源请求观察，经冻结独立合同评价，**REQUEST_BOUNDARY 263/263 PASS，S0=0**；不是复用Guard verdict自证。45/45模型返回，providerRejected=0；DEADLINE/TURN_BUDGET/F6_RESERVE/BOUNDED_NO_RESULT均PASS，唯一非PASS为见证仍有位而未交付。4体检全200、2.54–4.08秒。

三录制开启；41快照中31可回放，5 UNSAFE_DOCUMENT、5 UNCAPTURED_DYNAMIC_RESPONSE（TableCheck），HAR有65条，原始脱敏产物完整保留，不冒充完整Replay。凭据逐值扫描0命中，请求头/Cookie0保存；HAR仅保留既有回放响应元数据content-type/location。初始credential-scan.json将65处**响应**headers也计入禁止项而标false；header-credential-audit.json按用户“禁止请求头”的实际口径单独复核，原扫描不覆盖。provider原始错误正文未保存。

protected-before/after完全一致：主工作区HEAD/diff/status、6旧账本、被测sourceRoot全文件树及三处相关历史运行目录；旧录制/评价与源分支均未修改。新账本实际1/6/45/0，余 **0 Live /2 GET /10模型/0环境重跑**，不追加使用。

## 4. 首个偏离与停止

首个可证实的错误动作是**#11**：在同一父分类状态重复已做过的菜单动作（diagnostics#130 REPEATED_FROM_SAME_STATE）；#10已偏离继续细分类的路径，#12无进展，snapshot7–9是直接观察依据。精确列表未产生使后续仍走Google候选名称核对。独立下游卡点是Sumika直到42.3秒才请求选择人数的下一次模型决定，在45秒上限前未返回；HAR仅有2人响应，不能把模型提议当已执行/8人确认。上述为本次轨迹归因，未做新反事实或模型调用，不推断更深原因。按授权结束并推送证据分支，等待复核，不修代码、不重跑。
