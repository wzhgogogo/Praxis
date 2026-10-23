# 第二阶段 c：见证认证

- Status: current certified source evidence / private holdout / no product Live
- 分支：`codex/holdout-phase2c-exit`；发布基点 `941ca9c1`，原承诺提交 `398d2e12`。
- **结果：5/6例已认证，每例1家；例03是唯一无见证排除，已记录使用批准的fallback九段下。** 未触发“两例以上无见证停下”条件。
- 本轮止于见证认证与推送；未运行模型/产品/18次Live，不修改主线。后续任务仍须按其授权绑定主线产品、Runner和评测配置，本文件不是Live批准或产品验收。

## 第一层：认证结果

以下日期和时段均为东京当地时间，Google列包含本轮该例全部Google请求。距离由Google解析圆心与同店Tabelog原始business JSON-LD坐标独立计算。原始请求/响应的每次开始、完成时间都在requests.jsonl与resource-and-cadence-audit.json。

| 例 | 使用地点 | 认证见证店 | 距离 | 请求日期 / 人数 | 匹配开始时刻 | Google |
|---|---|---|---:|---|---|---:|
| p2c-holdout-01 | Akabane | [Kushi Katsu Dengana Akabane ten](https://tabelog.com/en/tokyo/A1323/A132305/13108466/) | 201.5m | 2026-11-04 / 2人 | 19:00 | 1 |
| p2c-holdout-02 | Okachimachi | [Yakiniku Yansando Ueno hirokoji ten](https://tabelog.com/en/tokyo/A1311/A131101/13016759/) | 149.5m | 2026-10-30 / 4人 | 18:30 | 1 |
| p2c-holdout-03 | Kudanshita（由Ichigaya切换） | 无见证，排除能力分母 | — | 2026-10-31 / 2人 | 无认证的19:30 | 6 |
| p2c-holdout-04 | Ryogoku | [Chanko Kirishima Ryougoku edo NOREN ten](https://tabelog.com/en/tokyo/A1312/A131201/13202196/) | 29.1m | 2026-11-05 / 6人 | 18:00, 18:15, 18:30, 18:45, 19:00, 19:15, 19:30, 19:45, 20:00 | 1 |
| p2c-holdout-05 | Hatchobori | [Niku Kitchen BOICHI Hacchobori irifune ten](https://tabelog.com/en/tokyo/A1302/A130203/13181311/) | 225.8m | 2026-11-03 / 3人 | 19:00 | 1 |
| p2c-holdout-06 | Kitasenju | [Hakata Motsu-nabe Yamaya Kitasenju ten](https://tabelog.com/en/tokyo/A1324/A132402/13280146/) | 157.5m | 2026-10-30 / 8人 | 17:30, 17:45, 18:00, 19:30, 19:45, 20:00, 20:15, 20:30 | 1 |

| 例 | 店页完成观察（北京时间） | 库存完成观察（北京时间） |
|---|---|---|
| p2c-holdout-01 | 2026-10-23T12:22:36.685+08:00 | 2026-10-23T12:27:21.927+08:00 |
| p2c-holdout-02 | 2026-10-23T12:23:08.634+08:00 | 2026-10-23T12:27:54.315+08:00 |
| p2c-holdout-04 | 2026-10-23T12:24:12.829+08:00 | 2026-10-23T12:28:25.436+08:00 |
| p2c-holdout-05 | 2026-10-23T12:29:33.155+08:00 | 2026-10-23T12:31:55.100+08:00 |
| p2c-holdout-06 | 2026-10-23T12:25:15.888+08:00 | 2026-10-23T12:29:01.071+08:00 |

认证核验完成：**2026-10-23T12:43:57.087+08:00**。
最早见证关联观察请求开始：**2026-10-23T12:15:40.465+08:00**；采取保守计时，包含该见证的Google圆心观察，以及商家/库存/HARD观察。
18次Live必须全部完成于：**2026-10-24T12:15:40.465+08:00（北京时间）之前**。每次观察的实际完成时间亦保存，未用后来观察覆盖较早时间；没有为延长窗口重采已认证门店。

## 第二层：承诺、事实、库存与fallback

1. holdout.yaml整文件SHA为 `1602ca7a5ff860130b81235553db8e77d7d9c25d261801c38330db0a97171a1e`；6个用例逐字节SHA全部符合承诺。commitment.json与398d2e12逐字节相同，且该提交在原文发布提交941ca9c1之前。YAML前导注释段不算用例；最初段数检查计入前导段的问题已在无外部请求时修正，无任何SHA不一致。日期始终按exit-dates.json，三份原文件未改。
2. HARD仅以同店、同来源、可归属的商家字段为依据。例01Kushi-age的对应由冻结acceptance明确许可；02的Korean、04的Chanko-nabe、06的Motsu-nabe均为商家分类原文。每条HARD记录原条件编号、polarity/strength、字段角色、原句和source SHA。
3. 例05分类原文为 **Categories Bistro, Steak, Niku baru (Meat bar)**。按用户已批准的分类标准支持Steak与排除Hamburger steak；不从店名、评论、菜品缺关键词推导。11月3日假日日期未更改，原始响应确实返回3人19:00。
4. 已认证库存逐项核对原始base_date、members、时段URL中的同店rcd、visit_date、member、visit_time，且在原精确时刻或包含端点的请求窗口内；响应里的表单URL只作为字符串数据解析，从未请求。
5. SOFT/UNSPECIFIED未参与准入：例02保留商家Dinner JPY6000–7999（Lunch JPY2000–2999），高于5000偏好仍可认证；例04Private rooms Unavailable不阻断；例03anniversary不作为淘汰依据。

**例03查找与排除记录：**

- 原地点市谷：根本分类明确Fugu，周六营业17:30–21:00，含税每人5500/6600日元的Omakase Kaiseki方案及周六晚间营业有原文；方案在请求时刻是否可订不由这些文字单独证明；但同日期2人库存只有17:30/18:00/18:30，没有19:30。未改时刻、未重复刷新业务无位。另一家Shiose在1000m外且没有来源暴露的公开查位接口；Google原地点河豚结果也在圈外。
- 只换承诺所列fallback **Kudanshita**，日期10月31日、2人、19:30、每人≤10000与全部其他条件不改。fallback-03.json绑定换地点依据及原地点材料。后续地区/行政区目录和英文、日文、圆心覆盖东侧邻域检索均保留；神保町只是检索词，解析圆心始终是九段下。
- 邻域检索找到Obu约422m，但商家分类为Japanese Cuisine/Teppanyaki/Steak，未取得明确fugu支持；平均价格10000–14999不能单独证明有≤10000的晚餐方案，且没有来源暴露的公开库存接口。它未被认证，未合成接口、未打开预约表单或电话联系。
- 因此记录 **NO_CERTIFIED_WITNESS_FOUND_IN_BOUNDED_APPROVED_SOURCE_SEARCH**，例03按批准的唯一无见证排除处理；这不是“当地所有餐厅均无位”、不是预算已明确超出，也不是产品CAPABILITY_MISS。source-search-audit.json列出每次Google候选距离、原始来源SHA及未认证原因。

发现方法说明：根目录sk参数未实际缩小目录，随后只从公开地区/菜系导航与Google中心继续；中间重复目录、无匹配库存、圈外与不支持的候选都包含在资源计数，不仅统计最后五家。商家保存最小业务JSON-LD、原始字段片段、整次响应SHA；不保存整页顾客评论/用户数据。库存保留完整原始JSON。

## 第三层：只读边界与资源

总请求 **42**：Google **11**、Tabelog **31**；全部HTTP200，传输/HTTP重试 **0**。本轮模型 **0**、完整产品Live **0**、环境重跑 **0**。
同来源“上次完成→下次开始”最小间隔：Google **30001ms**，Tabelog **30000ms**。未触发120秒传输重试或900秒403/503/429/繁忙页冷却；规则本身经模拟传输控制验证。

没有浏览器会话、表单请求、时段点击、/reserve请求或个人信息提交；TableCheck本轮未访问。Google的POST仅为已批准的Places只读searchText，不是外部写入。未调用src产品代码或模型，来源观察和认证均由独立脚本完成。生产Guard未被本轮调用，不能把“没有请求”写成一次真实/reserve拦截；16项离线白名单/节奏/重试/库存错配红绿控制通过，真实42请求日志另作独立边界审计。

## 第四层：核验、冻结与交付

认证前输入冻结（140项）：`e5bafce01a89714dc2aff34e3368c6e9deb136239fe77f5d04eaf96eac8b2d9f`。
独立认证登记：registry.json，SHA-256 `b0988a7785766ad98e1392d1d9d3b23df3fc4e003624c740c2c3cdd74e0995e6`。
认证判定登记：certification-review.json，SHA-256 `6b6d74167abaab0d2962dccd8a35065d97e456be2f1b06e43e464a7e2b646cc4`。

全部12个请求任务分别在请求前提交并记录SHA；后续任务只绑定已保存的新来源，未修改任何正在执行任务。offline认证前再提交140项输入冻结，执行时阻断全部网络；没有网络尝试。独立Python审计另行重算字节SHA、距离、实际日期/人数/同店时段和全部来源间隔。第一次独立审计未解析源相对URL，已修正为标准同源解析后通过；原始响应、认证输入及判定未更改。

可重复执行零网络复算：`python3 .eval-artifacts/phase2c-holdout/witness-certification-20261023/audit-saved.py --verify-only`。交付核验见delivery-verification.json；42次观察的UTC时间、source metadata和响应SHA见resource-and-cadence-audit.json，字段与业务支持见certification-review.json/registry.json。最终certification-package.json只冻结这次认证材料，**不是绑定主线产品/Runner的Live冻结包**。

与941ca9c1比较，src/web-skills/scripts/package和三份原始Gold/日期/承诺文件字节均未改。未运行产品五门禁或校准：本轮未改产品/浏览器/评测器，仅复用独立来源摘录方法；实际运行的是16项零网络控制、42次真实只读来源观察、一次零网络认证及独立复算，不把它们报告成18次Live或产品验收。

仅推送私有codex/holdout-phase2c-exit；不推主线/集成分支，不创建公开PR、Page或分享。按本轮原任务在认证后停下，不开始Live。
