# 分类入口与权威值组：真实模型离线验证

2026-11-13 CET；工作分支 `codex/fix-category-guidance-recorded-decisions`，基线 `5f8e01f1` / 源码 `67a949d7`。已暴露开发录制，不涉及私有 Held-out。

**结果层：真实 DeepSeek（deepseek-flash）9/9 固定帧命中。** 实际9模型、0网站GET、0Live、0环境重跑；独立上限16，余额7不使用。输入175,284 / 输出1,309 tokens，9次合计37.015秒；这是诊断成本，不是端到端成本或稳定率。原失败、原评价及旧账本不改。

**逐环节：**

| 真实来源 | 录制中的动作 | 新模型动作 / 判定 |
|---|---|---|
| 9cb426f7 #7，分类折叠 | More filters | CLICK All；PASS |
| 9856dc67 #9/#10，父类折叠→展开 | 重开后误点额外筛选 | 重开当前分类→OPEN_LINK Other；2/2 PASS |
| 9cb426f7 #21/#22，无日历/人数组 | 漏valueGroupRef，随后误推详情栏 | 两帧均REQUEST_HUMAN_HELP，不造组；2/2 PASS |
| 9cb426f7 #26/#28，推进控件 | 日历／人数推进 | ADVANCE带实际日期group:1／人数group:2；2/2 PASS |
| 9cb426f7 #27、9856dc67 #33，精确值 | 日期／人数直选 | CLICK_AUTHORITATIVE保持；2/2 PASS |

逐帧原始输出、目标与组、严格wire、tokens见 `frame-comparison.md`、`model-pass-01/`。九份原始上下文逐字保存并绑定原文件哈希；只加载当前生产Skill及67a原生objective（旧9856的objective文本原样保留，但调用使用当前生产值）。观察、目标、history未修补。旧输出按同一oracle有4个失败，均被本次固定帧覆盖；不是新增旧版模型A/B实验，也不是完整网页流程回放。

**范围与门禁：** 产品只修改 `web-skills/tabelog/SKILL.md`，恢复观察到的分类入口、禁止额外筛选替代分类树、恢复Date/Guests标签说明并要求准确valueGroupRef。另同步1条已有Skill措辞断言，未删断言。`native-restaurant-search.ts` objective与sourceListingCompletion、执行器、completionUsesControls:false/终端优化、Guard/G1/评价器/45/90秒均与67a一致。验证SHA `463f9aeb0016e46f699ce6f63d8131c41275cd6e`：typecheck、arch:check、build PASS；默认1644/1644、本地Chromium287/287、G6 159/159，0 skip，全部同SHA净树。两历史基线和5f8增量扫描0。 原始日志见 `gates-final/results.json`；初次默认测试的旧措辞断言失败日志留在 `gates/`。两历史基线及5f8增量写死扫描均0；明确的UI标签说明由本轮用户批准，无菜系/地点/URL/CSS或可执行动作覆盖新增。

**首个偏离与证据边界：** 本次固定帧修正了错误入口和无关区域推进，未证明实时网页下的全部下钻与45秒交付。日历推进控件group:13与实际日期选项group:1不同，valueGroupRef必须指后者；这不是漏参时借用任意组。通用availableActions对无关安全链接仍较宽，本轮没有扩大范围改权限逻辑。

已有真实DOM的Other页解析出3家、精确分类页解析出1家（Sumika），都含观察到的直达店页URL；`directory-evidence.json`绑定DOM和采集提交哈希。现有source pack在原生详情核对成功后会保留tabelogNativeDetailUri，读取器有跳过名称搜索的现有路径。所以入口确有依据，但本轮未执行该完整链路，不能保证必达或声称实测节省21.5–26.5秒。snapshot-0032终端快路径由原组件回归保护；无本轮Live交付结论。

主工作区、旧账本、9856/9cb证据及原源码树的保护前后核对见 `protected-before.json` / `protected-after.json`。凭据扫描0，模型请求只存messages哈希，不存请求头。仅提交推送本工作分支，**不合main、不跑Live、不跑Held-out，停止待复核。**
