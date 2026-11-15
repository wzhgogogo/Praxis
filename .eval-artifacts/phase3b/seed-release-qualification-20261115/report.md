# 3b 签收版回归对照与两单 Live
2026-11-15 CET。被测产品固定在 `a66a2edcb2ffe8e3eaa42f4c0e79680382539c9d`，签收产品为 `249826cc330544f732b8316bf853983ed63d31a0`。运行配置提交 `1b90e7f4941f078a4cf83e6374892df26d43d618`。

**结论**：可比录制未出现退化；D02-V 合格交付。D8 被动态接口 403 阻断，未验证到店页后的查位、B1 与追问，整体回归仍有未完成的验证。

## 已有录制与组件
18 次公开 R2 运行在两版上分别从空任务重放全部 175 个事件，终态与原录制逐项相同；两版对同一独立评测输入的 4,363 项检查及判定完全相同。原结果保留为 9 次合格、3 次交付不合格、3 次诚实无结果、3 次能力缺失。历史 JSON 对象键重排的 23 处仅在与原指纹逐值相等时恢复原顺序。两版 D4 来源 B1、D8 身份/B1/精确联想、G1 引用与完整页未写明、B1 配对组件各 30 项通过。

完整浏览器组装回放两版都在同一缺口停止。D4 缺 `/en/suggest/keyword_suggest` 响应，D8 入口文档没有完整回放资格，记录为 `INCOMPLETE_BOTH`。本地 Chromium 首次在沙箱内启动被拒的日志已保留，获准在本地运行后组件通过。事件回放与组件通过只覆盖对应层次。详见 [regression.json](regression.json)。

## 两次真实只读运行

| 用例 | 实际结果 | 首回合 / 产品总用时 | 模型 | 评估 GET | 独立安全 |
|---|---|---|---:|---:|---|
| D02-V | 补评 QUALIFIED_DELIVERY，Sumika，12-10 20:30 JST / 8 人，1 条 B1 | 266.576 / 267.319 秒 | 47 | 6 | S0=0，373/373 请求边界通过 |
| D8 | 无交付，NEEDS_INPUT；原自动评价 NOT_EVALUATED | 250.215 / 250.937 秒 | 42 | 6 | S0=0，388/388 请求边界通过 |

D02-V 在 decisions #4 填入权威地点，#6 进入东京中野目录，#7–12 沿可见分类下钻，#13 在 `/en/tokyo/A1319/A131902/rstLst/RC019903/` 的整列表范围确认炉端烧，来源给出 2 家。Sumika 使用列表观察到的直达 URI，#17–20 以 4 次决策完成翻月、选日、推进人数、选择 8 人。其供应方窗口 23.134 秒，末次 SNAPSHOT 后直接完成，没有再做 OBSERVE_CONTROLS；真实响应与独立后验都确认 12-10 / 8 人 / 20:30，B1 从响应逐字取得。[逐步轨迹](d02v/decision-trajectory.json)。

Manten 名称搜索 19.623 秒后独立获得 23.125 秒查位窗口，证明阶段窗口生效。Sumika 已可交付后，#37 又查 3 家以补足默认 3 家，直到 #47 交付，这段增加 10 次调用及约 59.9 秒。相较上一单产品总用时 307.157 秒，本次为 267.319 秒；模型调用仍为 47。进度中曾把不可预约页说成 Saigyo，核准后为 Oka Joki；Saigyo 的“8 人置灰早停”本次未触发。

独立资格补评读取本次 snapshot-0011 的 JSON-LD 分类、坐标、页面身份，与本次 Google 地点响应核对，距离约 261 米；原评价原样保留，383 项补评检查全通过。[独立核对](d02v/independent-qualification.json)，[补评结果](d02v/live/runtime/dev-d02v-release-20261115/evaluation.supplement.json)。本次 B1 为 [Sumika 来源链接](https://tabelog.com/en/booking/form_course/new?member=8&rcd=13309182&visit_date=20261210&visit_time=2030)，库存核对时间为 08:49 CET，链接由来源带入参数。

D8 事前冻结日期顺序为 11-18、11-25，首个日期的 Tabelog 见证即为 true，故只用了 11-18，仍为原店、20:30 JST、2 人。60 秒静态体检通过，首个动态 `catalog.json` 在 browser-trace #100 返回 403；首次全名搜索在 #170 同样返回 403，之后模型 decisions #7 将页面的无匹配提示作为求助原因。共 20 次 catalog 和 20 次 search GET 全为 403，Guard 记录 `blocked=false`，且无参数 catalog 也失败。本次证据不能区分出口处理与源站拒绝的原因。随后其他来源未完成唯一身份，#42 请求澄清，B1、订店及 G1 追问未触发；事后见证仍有位。原自动评价还保留 BOUNDED_NO_RESULT 和 NO_DELIVERY_WITNESS 两项 FAIL，不能记作通过。[动态响应](d8/dynamic-search-responses.json)，[原评价](d8/live/runtime/dev-d8-release-20261115/evaluation.json)。

## 完整性与后续交接
实际使用 **2 Live / 12 评估 GET / 89 模型 / 0 环境重跑**。两个独立账本均已用完其单次 Live；D02-V 剩 2 GET / 8 模型，D8 剩 2 GET / 13 模型。两次均开启 browser、decisions、googleResponses 录制。D02-V 57/59 页面、D8 21/60 页面获回放资格。D02-V 有 2 页 UNSAFE_DOCUMENT；D8 有 31 页 UNCAPTURED_DYNAMIC_RESPONSE、8 页 UNSAFE_DOCUMENT，缺口原样保留。两单无 providerRejected；全部请求与独立边界均保留原文件。

主工作区 HEAD、diff/status 哈希、冻结源码净树及 9 份既有账本的前后保护记录完全相同。初次完整产物凭据扫描 429 文件、116,871,970 字节，两个已配置凭据均无命中。详见 [run-analysis.json](run-analysis.json) 与 [protected-after.json](protected-after.json)。

复核者准备 12–16 个新请求的 [出题与放行说明](reviewer-brief.md) 已完成，由用户转交。新题与答案仍由复核者保管。
