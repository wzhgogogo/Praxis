# 检查点 C：恢复认证后按新规则停止

- Evidence status: current partial Live Read-only witness evidence；已暴露开发集，非Clean Baseline。不是完整Live或产品交付验收。
- **认证尚未完成；无最终Live冻结SHA。** 本轮只提交新材料、来源复核与未完成登记，推送准备分支后停止。
- 用户已批准本轮精确恢复和无HTTP状态120秒单次重试；未批准Live。保留的三条完整来源支持记录未重采，Matsumoto只补读HARD门店页，原库存及历史材料不改。0模型／Google／整单Live，不打开表单、不点时段、日期不变。

## 实际停止

H003第二家Meibutsuya Yurakucho（13281962）的四参数库存GET：

- 首次2026-10-20 21:22:11.037 +08:00发起，21:22:31.040以TimeoutError结束，无HTTP状态；
- 等待120.002秒后，于21:24:31.042对完全相同URL／方法发起唯一重试；
- 21:24:41.548仍为TypeError: fetch failed，无HTTP状态；
- **整批停止时间21:24:41.550 +08:00（13:24:41.550Z）。** 此后没有网站请求。未将传输错误解释成403/503/429、无库存或用例能力失败。

## 六例目前的来源认证

“完整支持”包括身份／半径、原HARD及日期／人数／时段库存绑定；仍待外部复核者签收。整批登记统一为BATCH_CERTIFICATION_INCOMPLETE，不能启动Live。

| 用例 | 完整支持／登记 | 库存匹配／未到达 |
| --- | --- | --- |
| H001，11月3日19:00×2 | 2/2 | 两家均匹配19:00；Matsumoto HARD原始实体编码句已补齐 |
| H002，11月7日18:30×2 | 3/3 | 三家均匹配18:30；第三家本次成功 |
| H003，11月6日17:30–22:00×10 | 1/3 | 首家匹配时间窗内19个时段；第二家只有门店页、库存两次传输错误；第三家未到达 |
| H005，11月5日18:00×4 | 0/2 | 未到达 |
| 神乐坂，11月5日19:30×3 | 0/3 | 未到达 |
| 吉祥寺，11月3日18:00×2 | 0/3 | 未到达 |

- 原三家Shibuya Sushi Sen、H002的Ginza Sushi Tempura Iwai与USHIGAMI的库存对象和HARD观察与原捕获逐字一致，原始SHA不变，未发重复请求。H005尚未到达，未读取其Iwai不同日期库存。
- Matsumoto当前原始句保留为 `We offer only the &quot;Omakase Course.&quot;`，见捕获目录H001的source.json；仍沿用原19:00×2库存字节。
- H003首家原登记名为Private rooms Izakaya Ginraku Yurakucho，当前JSON-LD展示名扩写为Private rooms Izakaya Ginraku Chiyoda yuuraku chou ekimae ten。原捕获精确名称匹配false／距离null保持不变；独立来源复核用同一登记canonical @id、Ginraku/Yurakucho身份和原始坐标核对半径，单列SUPPORTED及依据，不将捕获器布尔值当作Gold。
- 停止后仅补齐离线finalize的来源身份复核接纳：原始JSON-LD SHA、登记canonical URL、当前名称和坐标都需匹配；异店canonical拒绝。当前7项认证控制PASS，原始执行记录未改，未恢复捕获。原生产parser与生产代码不变。
- H002两个负向HARD仍逐项以明确主菜系分类判断，不以缺关键词为证明；SOFT／UNSPECIFIED条件未升级为门槛，也未把认证当作P2-3价格核对。

## 资源、冻结与证据

- 本轮8次HTTP尝试：6个200、2次无状态传输错误；只发生1次获准的2分钟重试，未触发15分钟HTTP／繁忙页规则。前次完成→下次开始最小30.002秒；请求序列为冻结24次计划的前7个不同请求，最后一个仅原样重试一次。
- 捕获实际代码提交：`08bf8415c5ddb143a0c533924fe4be520c427aa5`；[capture-freeze.json](capture-freeze.json) SHA-256：`fe22db6af1cd46989944604ba995be30ebd1896c2080770d18d2d518b657bc8f`。停止后离线复核代码与捕获时版本分别记录；其他冻结输入字节全未变。
- [恢复计划](resume-plan.json)、[本轮授权](user-approval.json)、[原始捕获](capture/capture.json)、[逐请求](capture/requests.jsonl)、[来源复核](source-review.json)、[未完成登记表](registry.pending.json)、[机器核验](verification.json)。门店仅保留必要原始业务片段、正文SHA及观察，原始库存响应保留完整字节；不保存Cookie或客户评论PII。
- 最终Live冻结包未生成。提交后生成 `interrupted-evidence-freeze.json` 只封存中断证据，明确NOT_LIVE_READY；不是可批准启动的Live SHA。
- 本轮不增加Phase2模型／完整Live／正式整单环境重跑计数：仍为阶段469模型、保守总1483模型、2次整单Live、0次正式整单环境重跑。认证的传输尝试与重试单列，不混成Live重跑。

## 四层结论与时效

1. **端到端：** 六例16条见证中6条完整支持、1条只有门店页、9条未到达；整批认证未完成。Live启动0/18，无产品交付率。
2. **逐环节：** 原始JSON-LD、HARD片段、库存日期人数店号时段和SHA由独立离线解析核对；不依赖生产parser／eligibility。P2-1首批见证发现、P2-2选店直接页和P2-3价格核对均未执行。
3. **严重程度：** 请求范围审核PASS，仅登记页和四参数GET；未打开表单或库存链接。不作完整Live S0为0或阶段安全签收结论。无状态错误仍为未知来源连接结果，不伪装成无位。
4. **归因：** 明确阻断是第二次无状态传输失败，底层网络原因未知。H003名称表述变化另列评测侧身份复核，既不归因为无库存，也不篡改自动匹配记录。

**当前登记中最早见证观察：2026-10-20 20:26:41.866 +08:00（Matsumoto沿用的库存）。24h截止：2026-10-21 20:26:41.866 +08:00。** 时钟不因恢复／补HARD／提交而重置。认证完成时间仍为空；这份未完成登记不提供Live许可。

离线控制：新两分钟规则红→绿、认证控制6/6，停止后身份复核控制7/7；外层14/14、JS语法与外层typecheck通过。既有五门禁复用未变生产基线978/978和Chromium122/122。未完成finalize已拒绝，六例Live见证门禁均拒绝此登记，见 [拒绝控制](incomplete-registry-gate.txt)。不进行第三次重试或自动恢复。
