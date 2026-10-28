# 3b C：Gold5 与非直链样本认证准备

- Evidence status: current executable（Gold5/离线门禁）；draft / not integrated（收益测试计划、身份采集方案）
- 时间：2026-10-27，固定 CET（UTC+01:00）
- 分支：`codex/fix-phase3b-identity-and-named-target`；本停止点不合 main
- 已整合 main：`5f621be3185ef784a7b5bfc142465ccd9d725023`；整合提交 `d1415814`
- 复核原文：[review-original.md](review-original.md)，SHA-256 `9dcd5995ecd95e8b6a9d08c170c9d27b0b5cb5ede38f9a6c9e5ad1bf24de17a3`

## 本切片承诺与停止条件

用户已批准复核第9节的额度和详情页文件交接，并明确要求“新样本清单准备好后先停下，等复核者认证 Gold，再做替代检索对照”。本切片交付：已确认的15项开发标注升 Gold5，删除重复 ADR0047，提交可逐家认证的非直链样本、受限调用计划和未来详情页改动范围；五门禁后推工作分支，停在 Gold 认证前。真实模型验证、替代检索、详情页身份采集实施均尚未开始。

审批全文和凭据边界见 [authorization.json](authorization.json)。本切片真实模型、Google Places、评测网站 GET、完整 Live、环境重跑均为 **0**；没有加载、独立读取、打印、复制、暂存 `.env`，未读私有 Holdout。查询官方 Google API 文档不属于 Google Places API 调用或评测网站 GET。

## 已完成：Gold5，历史不回写

`restaurant-semantic-regression@5` 只修改以下15个批准标注（8项强度、7项窗口），另更新数据集 id/version。用户消息、参考时间和其他 Gold 字段原样保留。

| 项目 | 新标注 |
| --- | --- |
| SR01-T01 yakiniku；SR04-T01 Japanese food；SR07-T01 Korean food | HARD |
| SR08-T01 sushi、omakase（NEGATIVE）；SR08-T02 sushi | HARD |
| SR09-T01、SR09-T02 Italian food | HARD |
| SR05-T01、SR08-T01/T02、SR09-T01/T02 | 18:00–23:00 |
| SR06-T01 afternoon | 12:00–17:00 |
| SR10-T01 after work | 17:30–22:00 |

依据仍是复核确认的 ADR0029 核心菜系语义和现行时段政策；没有为迁就模型修改 SR03 的 Sushi Dai、SR05 的 smoking/NEGATIVE/HARD 或 SR08-T02 的预期移除状态。Fixture 提议同步强度和时间，操作类型未变，仍禁止条件 CONFIRM。该 Fixture 是确定性下游检验，不能证明 Prompt26 的真实遵循率。

- Gold3 原 `fixtures.ts` SHA：`fa4a8e52a82806af6d507a06f4ba16426e6c28376936363c777c4e981cf3ca72`。
- Gold4 原文 SHA：`96a3dbd7c406805e31586a0a6fb472b5bb2dd7458bd3187a3413c6ed2e5f8b66`。
- Gold5 SHA：`b58c6a1f3ee3833cfa135c4e7a8e3a130d74673f9db6ba51306a582b13e06206`。
- sidecar@2 原字节保存在 `goal-boundary-annotations.v2.json`；当前 sidecar@3 只重绑 Gold5 的 SHA 和修订说明，15轮的 category、contextCarry、messageSha256 未改。
- 默认 loader、DeepSeek 开发 Runner 的数据集标签/产物名转 Gold5；Scorer、Semantic Prompt26、Proposal Schema4、State23、TaskDefinition21 不递增。旧评分不重新计算或覆盖。
- [gold5-red.log](gold5-red.log)：旧 Gold4 loader 在独立15项预期断言处产生 AssertionError；[gold5-green.log](gold5-green.log)：迁移后的既有5项回归通过，日志保留当时旧测试标题。最终门禁已执行已改名的完整断言；[semantic-fixture.log](semantic-fixture.log) 为静态15/15。

## 已完成：ADR 去重

按复核删除 C 的 `0047-phase3b-observed-actions-and-cited-answers.md`，不改写旧提交和冻结报告。两项3b原则统一由 B 的 `docs/decisions/0046-observed-actions-and-source-quoted-answers.md` 维护。检查时该文仍在 B 工作区未提交，状态 Proposed、revision0.2；本 main 尚无该文件。本切片没有复制 B 草案或宣称 ADR 已 Accepted，只在 ADR 索引/Domain 标明维护归属与待整合状态。历史 C 报告中的0047保留为当时证据，由本条取代当前引用。

## 已完成：非直链新样本，等待认证

可读清单：[samples.proposed.md](samples.proposed.md)；完整 Google 原文、Place ID、地址/电话/坐标、保存文件 SHA 与记录位置：[samples.proposed.json](samples.proposed.json)。5个主样本：Dengana Akabane、Ushigoro Bambina Carbone Nakameguro、和泉鮨南口店、Waragamo、Sen Kagurazaka；3个备用样本预先列明。没有猜测或填写来源门店 Gold ID/URL。

从已暴露的旧公开运行和 F5 原始记录中抽取，不访问网站。先冻结 `prepare-pool.py` 与原始 SHA，再生成候选池；随后冻结 `select-samples.py` 和池 SHA，生成清单。提交分别为 `bd9592ab`、`704f5abb`，原始清单校验见 [sample-source-sha256.json](sample-source-sha256.json)、[selection-input-sha256.json](selection-input-sha256.json)。按 Google Place ID 去重并要求完整身份字段后，有自有站候选202、社交28、直链Tabelog33、TableCheck2、其他门户6、无官网29；这些统计单位和来源范围不同于复核的298个不同 URL，不能据此重估生产比例。

所有新主/备均不在旧店名基准样本中，Google websiteUri 也不是 Tabelog/TableCheck 直链。“自有站候选”仅按域名分类，没有验证所有权或重定向。Sen 的原始 websiteUri 包含拼接的两个地址，原样保留，认证时必须单列处理，不将其当作有效官网或偷偷清洗。Dengana 是已暴露历史锚点，其余4个主样本是新选对象；全部是公开开发诊断材料，不能冒充 Clean Holdout。既有基准12/29只衡量故意隐藏 Google 来源直链后的后备检索能力，不是这些店在生产 DIRECT_SOURCE_PAGE 路径的成功率。

复核者逐家认证：同一 Google 店的来源 URL/ID、公开 GET 原文与 SHA/时间、电话或完整日文地址（门牌、建筑、楼层）、矛盾/失效说明。名称相同不构成 Gold。备用只有复核者明确指定才能替换，最终5主 ID、主/锚点分层和 Gold 必须在检索前冻结；不能根据检索成绩换样本。若预算内无法认证，标为未认证并停止依赖它的收益对照。

## 认证后才执行的调用计划

本批批准上限：真实模型100、评测公开GET35、Google35、Live0，仍受共享3b限额（模型1000、评测GET40、Live18、环境重跑4）约束。批准不是已用额度；[共享账本](../budget.json) 按 id 并集，原 A/B 条目保留。

| 计划 | 最大请求数 | 控制 |
| --- | ---: | --- |
| 新5主＋3备的 Gold 公开认证 | 8 GET | 未认证不能启动收益对照；认证失败不反复请求 |
| 新5主：原 Google 全名＋一种替代 | 10 GET | 每店2次，新样本为主要同期配对组，Dengana另列 |
| 旧15例：一种替代 | 15 GET | 历史原名结果作次级诊断；14明确空＋1宽泛未决 nr-019，不称全部空 |
| 评测 GET 总计 | **33≤35** | 其中检索25；剩余2不自动使用，认证请求也逐次记共享账本 |
| Google 日文 Place Details | ≤20 | 原5主＋旧15的相同 Place ID；不 text-search 更换身份，且≤35 |
| 真实模型语义 | ≤78 | 4种两轮会话×3次＝24逻辑turn＋开发全集15＝39；既有最多2次schema尝试，不新增重试 |
| 检索片段提议 | ≤1 | 最多20对象的一次有界批提议，不合规片段跳过 |
| 模型总计划 | **≤79≤100** | 每次服务尝试都记账，不能只计最终有效输出；Live0 |

语义的四种两轮场景：SR03推荐转查位仍保名、明确换店、撤销点名、已有查位目标补时/人数。先冻结消息与参考时间及每场景 Gold，再运行；不是本停止点已执行的评测。非目标差异保留，模型仍丢名时按复核再决定是否需要合同核对，不预先增加产品兜底。

替代方案预先分配为 `MODEL_FRAGMENT` 或 `GOOGLE_JA`。片段必须逐字出自原 Google 名称/地址；来源日文名也保留 Place ID、响应 SHA 与原文。相同日文名、无有效片段、无差别检索分别记 SKIPPED，不重复请求、不算命中、不挪给额外样本。旧15的替代分配在认证后正式冻结；不把历史比较和同期新5组成总体提升率。收益只看独立认证的目标是否出现在结果中；身份接纳仍用现有规则，不能用生产 confidence 或候选排序自证。

Google 官方 [Place Details 文档](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places/get) 支持 `languageCode=ja`（可用时优先该语言，并不保证日文名或与 Tabelog 同名）。本仓 `google-places-client.ts` 的 `textSearchPage`、`placeDetails` 及请求合同目前没有语言参数；`placeDetails` 已按稳定 Place ID 读取。后续最小评测入口需显式传日文参数并保留原 Place ID；产品客户端不在本准备切片提前改造。已批准的凭据只允许受控 Node Runner 的 `--env-file` 加载，记录“已加载/未加载”，不能记录密钥；本切片未加载。

## 公开 GET 加速路径与许可核对

现有生产代码**已经**有公开 GET 名称搜索：`source-packs.ts:247–250` 构造 `/en/tokyo/rstLst/?sw=<Google原名>`（东京），`tabelog-browser-availability.ts:370–420` 先 navigate/snapshot，未解析到候选时才 `runSkill` 观察/操作。旧 Dengana 轨迹也先走了这个地址。因此不能把“新增直接 GET”当成本批已实现收益；待测的是更合适的来源检索片段/日文名与当前页面是否兼容。失败时保持既有可观察流程；挑战、限流、基础设施失败依原停止规则处理。

现有独立 reviewed-public-reads catalog 的 Tabelog 规则（81–106）允许 `https://tabelog.com` 的 `/en/tokyo/…`、GET document 及 `sw`；对照只用 `sw`。不增加 origin、路径、query key、资源类型或 HTTP 方法权限，不触碰预约端点，不借泛规则绕过严格参数。保存 robots 原文 `.eval-artifacts/source-robots-20261024/tabelog-robots.txt` SHA `126cafe6a1c8758c1d015f1a63921702074f922eadb2586cec34e69b0677947f`：该历史文本的 `User-agent:*` 未禁搜索路径；但 GPTBot 等专用组为全站 Disallow，必须按实际 Runner UA/用途适用组遵守，不得换 UA 绕过，也不由通配组推导普遍许可。这只是10/24缓存核对，没有重新请求 robots 或取得新的网络许可。

未来测量沿用已审核入口与节奏（逻辑 GET 完成到下次开始至少30秒）、不带 Cookie、不绕登录/验证码、不跟随未审核重定向、不重试；遇403/429/5xx、繁忙/挑战或网络失败停止相应批次，不用私有浏览器操作补请求。本切片未实现或运行这个 Runner。

## 未来详情页身份采集：修改前范围清单

当前 parser 与整合 main 字节相同，以下行号基于 `5f621be3` / C `704f5abb`，**本次未修改**。认证与收益测量后，若实施前文件已变化须重新列范围。仅限详情页身份字段，不碰 B 的日历/列表/查位核对。

| 文件 | 函数/拟增加区域 | 当前行范围 |
| --- | --- | --- |
| tabelog-page-parser.ts | `firstPhone`；新增详情联系区/完整地址 helper（紧邻详情入口） | 61–65；113–119附近 |
| 同上 | `parseTabelogOutletIdentityWithEvidence`；转发 `parseTabelogOutletIdentity` | 120–159；161–162 |
| tablecheck-page-parser.ts | `addressFromJsonLd`；`textAfterLabel`（仅详情调用需要时）；`phoneFromPage` | 273–281；283–287；289–295 |
| 同上 | `parseTableCheckOutletIdentityWithEvidence` | 357–389 |

Tabelog 文件 SHA：`1e18b516fa4ec9c0c3211dfee414e92fa643bef497d9e044c8f6632237aacc0e`；TableCheck SHA：`a1b8f5066a4670f713da7d4f6452b3e7405c86ff73dbac23397fafc22c4bc9e6`。

计划收集同店主联系区全部原号码、角色和本次页面引用，分别保留050预约号与03店铺号；不做模糊号码匹配或全局050→03映射。完整地址保留门牌/建筑/楼层/单元与原始依据，不能静默覆盖冲突。坐标只辅助佐证/排序，不单独接纳；分店、楼层、门牌冲突仍拒绝。`nr-029` 差一位仍不接纳。身份规则任何放宽仍须另停并获用户批准。若需要改共享身份DTO/Schema、列表函数或其他B文件，先报告，不把“详情页授权”外推。C完成后经复核合main，B再开始G3。

## 验证、四层边界与后续

复用现有回归，独立字面量检查恰好15个 Gold 标注、历史 SHA、sidecar消息/类别、原 Google 来源与新样本身份字段；脚本和输入在运行前提交并冻结。最终离线门禁收据写入 [gates.json](gates.json)，每项前后检查净工作树。当前未执行 G4 检索或真实模型，不借离线门禁宣称身份改进有效。

四层报告：端到端真实结果 NOT_EVALUATED；逐环节仅 Gold 迁移、固定Fixture/本地测试已评，真实语义遵循/检索收益/来源身份接纳 NOT_EVALUATED；来源与交付 S0–S4 未作总体评价，不把0请求说成真实链路S0已过；归因仍沿用批次1冻结诊断，收益尚无新证据。最终停在新样本 Gold 认证，工作分支可读取，main不变。


## 最终离线验证回执

受测提交 `7f3d87705548661ed4c1d42ea3c6fbbf835e27ee`，冻结722项 SHA 前后匹配；全部七步前后 `git status --porcelain` 为空，未恢复/清理测试产物来伪造净树。独立材料审计 PASS；固定语义Fixture15/15，默认测试1102/1102，真实本机Chromium fixture 166/166，无失败/skip/豁免。不是来源 Live 或真实模型验证。

| 步骤 | 结果 | 秒 |
| --- | --- | ---: |
| independent-audit | PASS / exit 0 | 2.368 |
| semantic-fixture | PASS / exit 0 | 0.216 |
| typecheck | PASS / exit 0 | 0.475 |
| arch-check | PASS / exit 0 | 0.199 |
| test | PASS / exit 0 | 27.536 |
| build | PASS / exit 0 | 0.446 |
| browser-fixture | PASS / exit 0 | 108.055 |

原始 stdout/stderr 在 `gates/`；[gates.json](gates.json) 逐项记录命令、时间、日志 SHA 和净树，[audit.json](audit.json) 独立核对历史/新 Gold、来源身份与预算。本机 CET 2026-10-27T03:15:48.540+01:00 完成，全部新增真实服务调用仍0。最终提交仅补验证文档与原始证据，受测源码/Gold/输入不再改动。等待复核者认证新样本 Gold 后才推进下一切片；本停止点不合 main。
