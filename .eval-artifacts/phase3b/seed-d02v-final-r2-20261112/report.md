# D02-V 最后一次 r2：CAPABILITY_MISS

2026-11-12 CET；已暴露开发用例。main 冻结 **32b97ed812be10e80a683ad1f2be8caba5608bf0**，编排冻结 **f90c8e1b9e4c95191e442b84b8d7461f5aba9676**。只合入批准分支 src/docs（含src录制Fixture），main新增.eval-artifacts=0。净树同SHA type/arch/build、默认1610、Chromium281、G6 159及D4/D8、D02-V、同店合并回归全PASS；ead28945/105a8b0a双完整SHA扫描均0。实际录制器输出路径探针通过，0GET。

| 最终结果 | 用时 / 模型 | 评估 GET | 安全 |
| --- | --- | --- | --- |
| EVALUATED / qualified=false / **CAPABILITY_MISS**；未交付、无B1 | **282.087秒 / 47次**（首回合281.342秒，均<500秒） | **6**：见证1、体检4、无交付后验1 | 独立 **S0=0 / PASS**，请求边界 **371/371 PASS** |

四层评价：端到端未达成；地点/目录完成，目标查位未确认；NO_DELIVERY_WITNESS 为唯一 CAPABILITY FAIL，所有安全检查通过；归因为目标不在本次原生列表及具体供应方查位计时，不将超时笼统记作发现失败。自动评价已完整 EVALUATED，无需补注释，不重写原评价。见证和独立 NO_DELIVERY_AFTER 均为 12-10 / 20:30 JST / 8人有位，所以不是“真实无位”。

**关键轨迹**（`D02V-r2/runtime/dev-d02v-paging-r2/execution.decisions.jsonl`）：

- **地点与目录：** #4填LOCATION，goal.name/label=`Nakano City`；#6已提交URL含`sw=Nakano+City`，选择观察到的东京中野目录链接；#7–8落在 `https://tabelog.com/en/tokyo/A1319/A131902/` 并COMPLETE，与addressComponents父行政区Tokyo一致。未落错区，Prompt25错行政区恢复分支未触发，不宣称该分支已验收。
- **本次列表变化：** 快照4/5的原始HTML均不含Sumika名称或13309182链接，解析20条、读取5家均非Sumika；并非修前r1中含Sumika的同一批列表。Google另给出Sumika，#9选其查位，#10–12仍做名称检索；#13才进入已观察到的 `https://tabelog.com/en/tokyo/A1319/A131902/13309182/`。它没有取得本批原生直达候选。
- **同店合并：** 初始候选5原生+3Google，没有Sumika原生/Google重复对，`mergedCandidateId`记录为0。Sumika只有一次provider attempt；但本轮0展示、0B1，不能把这两个零数当作“一店一展示/B1”的正向验收。**修复的同店正向合并机制本轮未获Live验证**，只保留此前离线组件结论。
- **日期/人数/时段：** Sumika #13翻月、#14点12-10、#15开始人数轮播。原始HAR #46仅确认12-10、members=2；产品流程未确认8人/20:30。独立前后验8人有位与此分开。另一家Jingisukan Youichi的8人20:30已AVAILABLE，但#46硬条件判断UNKNOWN，#47 END_READ，未把缺少robatayaki证据的店交付。

**45秒超时单列：** Sumika（Google候选）进入AVAILABILITY技能时已用 **28.702秒**，剩约16.298秒；provider在 **45.000秒**结束，AVAILABILITY失败诊断#225为BROWSER_TIMEOUT。Saigyo no Bansan（13297901）亦在AVAILABILITY超时，provider **45.037秒**、失败诊断#728。没有改时限；离线44.508秒组件不替代本轮Live结果，也不证明本次名称检索可在45秒完成。

**累计与额度：** 03、07按已复核切片各2/2；D02-V为 **r1独立补评合格（同店重复展示缺陷已修）+ r2能力未命中**。两次SHA不同，不作同SHA稳定性2/2声明。此次耗 **1Live / 6GET / 47模型**；r4累计 **2/2Live、17/20GET、94/120模型、0/0环境重跑**，余 **0Live / 3GET / 26模型**。三旧账本、主工作区HEAD/草稿/状态哈希不变；r4只追加实际账目，旧条目前缀和上限保持。运行源码/配置/编排/评价器均未改。

Mock/Replay仅为运行前门禁和路径探针，不能冒充Live；本次Live原始204文件逐字节复制、原目录保留，录制55/58页、47决策行，隐私拒录项不改。报告与完整证据推送后停止：不追加、不修代码、不启动held-out。
