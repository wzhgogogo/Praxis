# B：中野目录原生表单与菜系路径探查完成

2026-11-12 09:25–09:33 CET。**Live Read-only 探查，不是D02-V验收，不产生交付、B1或预订结论。A仍停止，产品代码零改动。**

冻结：初始 `49587800`；本地回调修正后 `b0dccffc`；分类继续阶段 `ab45e4e`。各阶段先结束、保留产物，再提交冻结下一阶段；运行中未改源码/脚本/config，四旧账本不动。

| 问题 | 实际结论 | 关键证据 |
| --- | --- | --- |
| 1. 原生空位表单 | **能提交，仍保持中野范围。** 日期用可见日历原生点击；现有执行器 `CHOOSE_OPTION` 对原生人数select和时段select各1次脚本化决定完成，真实模型0。最终表单值12-10 / 8 / 2030，GET响应200；标题仍是Best Restaurants in Nakano，地点面包屑仍为Tokyo→Nakano。 | runtime-02/stages.json 的native-form-submitted；scripted-decisions.json两条CHOOSE_OPTION；最终保留列表有明确的 `Reservations available(December 10, 2026 (Thu) 8 people 8:30 PM)` 筛选摘要，并有逐店时间控件。 |
| 2. 菜系路径 | **能到精确Robatayaki，不必用宽分类替代。** 实际观察到的有效分类层级为 `Washoku → Other → Robatayaki`；中途还查看了Japanese Cuisine，但没有把它当作满足。全程只点源页已有链接，没有拼网址。 | runtime-03/snapshot4的Other分类面板第220行已存在精确Robatayaki链接；snapshot5标题/主标题为Best Robatayaki in Nakano，分类面包屑含Other→Robatayaki。 |
| 3. 两者叠加 | **能同时显示。** 精确菜系页保留svd=20261210、svps=8、svt=2030、vac_net=1；标题、地点面包屑、筛选摘要共同对应中野/Robatayaki/日期人数时间。最终列表1家sumika（13309182），显示当日8人时间控件，其中20:30存在。 | runtime-03/directory-probe/snapshot-0005.html：标题第2/31行，地点面包屑第70/133行、分类面包屑第185行，表单字段第241/683/984行，筛选摘要第1036行，卡片第1078行，20:30控件第1175行。 |

**实际URL：**

- 原生提交：`https://tabelog.com/en/tokyo/A1319/A131902/rstLst/?utf8=%E2%9C%93&lid=yoyaku-search_leftcolumn&svd=20261210&vac_net=1&svps=8&svt=2030&commit=Search`
- 最终叠加：[Robatayaki in Nakano，12-10 / 8 / 20:30](https://tabelog.com/en/tokyo/A1319/A131902/rstLst/RC019903/?svd=20261210&vac_net=1&svps=8&svt=2030)。URL来自Other面板的真实链接，不由脚本构造。

**列表显示边界：** 保存的Washoku筛选页20张卡片均有日期人数及逐店时间显示；最终Robatayaki只有1张。最终卡片显示20:00、20:15、20:30、20:45、21:00（JST）；20:15/20:45为禁用span，不能把五个显示值都说成可预约。未点击任何时间或预约控件，未做逐店库存API/身份验收。已有原生select支持得到这次脚本化探查证据，不能据此声称完整Agent会自行找到该表单；菜系完成条件和A均未实现。

**消耗与保护：** 新账本实际 **0Full-Live / 8文档GET / 0真实模型 / 0环境重跑**，GET已用完，立即停止。8次文档响应均200，间隔至少5.002秒；资源子请求另记，不混入文档预算。四旧账本及主工作区哈希前后一致；新账本仅实际计费，余0GET/20模型。没有登录、进入预约表单或提交写请求。

**录制与异常：** 首次GET后摘要脚本的tsx `__name` 错误使阶段停止，已关闭浏览器并原样保留runtime；修正后先过本地Chromium回调检查再冻结继续，不算环境重跑。runtime-02的原生提交页两份DOM因额外utf8/lid/commit查询键未声明而拒录（详细原因为UNREVIEWED_DOCUMENT_QUERY_SHAPE，不是正文敏感），响应元数据/URL/标题/面包屑保留；Recorder规则未改。其余DOM/网络HAR/layout-only截图及脚本轨迹保留；最终精确菜系页完整可回放。见 [证据索引](evidence-index.md)、[离线核验](evidence-audit.json)、[保护/冻结审计](final-audit.json)。

仅推工作分支，不合main，不跑完整Live，不根据B结果修改产品，停下待复核。
