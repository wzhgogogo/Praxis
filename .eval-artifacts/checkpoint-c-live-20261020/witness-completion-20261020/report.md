# 检查点 C：网络恢复后见证认证完成

- Evidence status: current Live Read-only witness certification；已暴露开发集，非 Clean Baseline。不是正式整单 Live 或产品交付验收。
- 六例各有至少一家完整支持；16条跨用例登记中15条认证通过。已有6条完整记录未发重复请求；Meibutsuya只补库存、H005 Iwai复用旧业务页只采新日期人数库存；原始材料和历史失败保持原样。
- 本轮捕获提交 `079ae49e07abc2988cd747a0c33e7e334afbb33d`；捕获冻结 SHA-256 `2378186b2fbd83e28cd9df3c26e3a1221348e7e03ccf8d104fb23e1680fcb0f9`，460项运行前SHA在结束后核对不变。最终Live冻结包与SHA见 [handoff.json](handoff.json) 和 [live-freeze.json](live-freeze.json)。最终包等待复核者及用户批准，不开始Live。

## 登记与库存

| 用例 | 已认证／登记 | 同请求库存 |
| --- | --- | --- |
| H001，11月3日19:00×2 | 2/2 | 两家均匹配19:00；完整旧证据保留 |
| H002，11月7日18:30×2 | 3/3 | 三家均匹配18:30；完整旧证据保留 |
| H003，11月6日17:30–22:00×10 | 3/3 | 三家各匹配窗口内19个时段；Meibutsuya只重采库存 |
| H005，11月5日18:00×4 | 2/2 | 两家均匹配18:00；Iwai仅采新日期／人数库存 |
| 神乐坂，11月5日19:30×3 | 2/3 | Kaga、Chisou Konya匹配；Komuro在登记时刻没有匹配，不推断其他时段 |
| 吉祥寺，11月3日18:00×2 | 3/3 | 三家均匹配18:00；未变更日期 |

认证核对登记canonical门店、当前名称／地址／坐标与半径、原HARD、来源原始日期／人数和slot URL绑定。SOFT预算、private room和UNSPECIFIED适用性未升级为认证门槛；本次不替代价格核对或完整QUALIFIED_DELIVERY评价。跨例Iwai登记分开计数，不把15条当全局去重店数。

## 来源复核与内容变化

- [source-review.json](source-review.json)明确记录评测侧复核人CODEX_EVALUATION_SIDE，独立于生产parser；外部复核仍PENDING。原六条复核原样复用。
- Meibutsuya、Uotami、Fukumimi和Kaga当前名称含不同罗马字或扩展分店／说明后缀。以同一登记canonical @id、原始业务信息与坐标独立核验；原自动名称匹配布尔值保持原样，不据此修改Gold或降低身份要求。
- Fukumimi原登记英文原句本次未逐字出现，原found=false／rawQuotes=[]保留。当前原始JSON-LD明确为日本居酒屋、烧鸟／鸡肉料理，评测侧用这些正向业务事实判断local food；fast food负向条件以当前居酒屋／正式寿司天妇罗业态与价格范围作人工来源解释，明确不是“没搜到关键词”或来源直接否定句。判断依据及外部复核待定逐项保存，条件原文不改。
- Komuro身份及会席HARD原句完整，但指定请求无匹配库存，登记NOT_CERTIFIED；未把传输成功当作见证认证成功。

## 读取、时效与预算

- 18次新GET全部200：8个门店页、10个四参数库存请求；总捕获546.610秒。最小前次结束→下次开始间隔30.000秒。0传输／冷却重试，0模型／Google／完整Live／正式Live环境重跑。
- 只读允许集、字面量请求顺序、原6条引用不变、原始响应SHA、JSON-LD片段SHA、同店／日期／人数／时段与半径均由 [audit-completion.py](audit-completion.py) 离线核对，[capture-audit.json](capture-audit.json)为PASS；不调用生产parser，不打开响应中的预约表单URL、不点时段。
- 认证完成：`2026-10-20T15:44:39.995Z`。最早见证观察：**2026-10-20 20:26:41.866 北京时间（12:26:41.866Z）**。**整批Live必须在2026-10-21 20:26:41.866 北京时间前跑完**；后续认证没有给保留证据续期。
- 阶段账本仍为2次完整Live、阶段469模型、此前阶段保守携入1014模型，合计1483／4000，正式Live环境重跑0／10。剩余98次完整Live、2517模型、10次环境重跑；冻结18次计划和6次预留重跑、最多1200模型通过额度检查。认证请求另列，不混入模型或完整Live重跑。

## 四层评价与未运行部分

1. **端到端：** 见证认证六例完成，15/16登记受支持；正式Live启动0/18，没有产品交付率或QUALIFIED_DELIVERY结论。
2. **环节：** 原始身份／半径、原HARD与同请求库存按登记逐项复核，见登记和source-review。P2-1首批见证、P2-2选中的直接门店页、P2-3条件／价格核对均NOT_EVALUATED（本轮未运行正式Runner）。
3. **严重程度：** 18/18新读取符合预登记GET形态，未发出表单或时段请求；不把这当作正式Live的S0通过。正式Live的S0声明／边界、S1–S4及退出条件1、3、4、5仍待实际运行与独立评价。
4. **归因：** 本次18个请求成功，只证明记录时刻的来源可读。旧中断与网络诊断保持原结论，不用当前成功回写历史因果；Komuro仅是指定请求库存未匹配。来源措辞变化与原始脚本观测、离线人工判断分别记录。

## 验证与交付

- 认证控制8/8、外层14/14、真实本地Chromium录制边界1/1、typecheck／arch／build通过。原首次错误测试路径与localhost沙箱EPERM日志留存，不计为有效行为红灯；有效Meibutsuya重采反例红灯和绿灯另存。
- 生产与a3f6b84逐字一致，按Test Skill复用五门禁中的默认978/978、真实Chromium122/122；没有新增生产Adapter、Prompt、Scorer或网络权限。
- [原始捕获](capture/capture.json) · [请求记录](capture/requests.jsonl) · [认证登记表](registry.certified.json) · [门禁与阶段预算](live-readiness-offline.json) · [核验汇总](verification.json)。当前认证脚本及原始证据将全部进入最终冻结包。
- 推送仅codex/chore-checkpoint-c-prep；不推送集成分支，不开始Live。最终SHA仍须外部复核者与用户批准。
