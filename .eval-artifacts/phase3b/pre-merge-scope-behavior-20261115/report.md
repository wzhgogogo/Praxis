# Tabelog 已限定范围的列表与分类下钻

2026-11-15 CET。冻结工作提交 `72fbb84d03c63c9af07d805101a53c25c92e4553`。真实 DeepSeek 在七个独立录制帧上选对动作，Schema 16 全部通过。唯一的产品差异是 Tabelog Skill 第 11 行。Prompt 27、执行器和原生发现的完成条件沿用冻结源码。

| 来源和录制序号 | 实际动作 | 判定 |
|---|---|---|
| D01 #8，高田马场＋Spanish，明确 0 个结果 | COMPLETE，引用 Spanish | PASS |
| D02-V #7，中野分类入口折叠 | CLICK All | PASS |
| D02-V #9，父分类入口折叠 | CLICK Washoku (Japanese cuisine) | PASS |
| D02-V #10，父分类已展开 | OPEN_LINK Other，该链接只提供此动作 | PASS |
| 07 开发 r1 #4，地区搜索首页 | FILL_AUTHORITATIVE LOCATION | PASS |
| D02-V #13，Best Robatayaki in Nakano，结果区 1～2／2 | COMPLETE，引用 Robatayaki | PASS |
| D8 #28，店页日期控件 | CLICK_AUTHORITATIVE DATE，2026-11-11 | PASS |

**结果与归因。** D01 同一输入此前点 All，本轮结束。三个仍需下钻的帧保留了原有行为。D01 的零结果与 D02-V 的非空结果分别通过当前来源完成谓词。D02-V #13 的同次 DOM 和原观察均含 Sumika 与 Oka Joki 的店页链接。全页解析得到 12 个链接，列表数量取来源排序区的 1～2／2。

**证据范围。** 经用户确认，D02-V #13 替代 07 的非空正例。07 原始 #12 只显示地点与四个结果，菜系范围缺证。07 #4 使用真实 DOM 和原控件投影出的组件输入，其余六帧是原模型观察。D8 的 PARTY_SIZE、TIME 为 `UNCOVERED_BY_RETAINED_RECORDINGS`，原生及自定义人数和时间选态留在确定性与 Chromium 覆盖中。此抽检没有执行模型动作，不能推断整单稳定率或新的 S0 结论。

**成本与边界。** 本批 7 个模型 POST 全部 HTTP 200，合计 15.289 秒，输入 161,679 token、输出 1,026 token。累计 9/10 次，剩 1 次。网站 GET 0，Live 0。主工作区 HEAD、草稿及十份既有账本哈希一致，凭据扫描 0 命中。首次冻结时，外层 JSON 对比在发送前退出，计费为零；改为比较已冻结的序列化字节后，七帧原样执行。前批 FAIL 和 D02-V 的九帧记录保留。

[逐帧实测](model-run/results.json) · [独立输入核对](preflight.json) · [累计账本](active-budget.json) · [保护核对](protected-after.json)
