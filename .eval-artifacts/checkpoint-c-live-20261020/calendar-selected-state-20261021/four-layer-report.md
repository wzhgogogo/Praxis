# 通用选中状态与人数确认：离线四层报告

Evidence status: **draft / not integrated；已暴露开发回归，非 Clean Baseline**。

**离线验收通过，等待独立复核。** 同一69点翻月69/69（门槛≥68），原15个未命中点15/15选对；选店5/5、校准22/22、五门禁全绿。没有付费补跑、网站访问或Live；推送本修复分支后停止。

- 基线复核：`54ac940`，原文在`inputs/independent-review.md`；上一轮54/69与全部原始材料保持不变。
- 运行冻结提交：`8e47ddfd70be692e5d43dd70474e7e1a78b22d88`。
- 冻结SHA-256：`040dbdac7477e64b643aa6550c43a57b650473dae51365b143d90f1f3954876b`；运行后628项全部复验一致。
- Browser Prompt18→19、Browser Context1→2；wire11、Restaurant Context15/Prompt27、web-skills、thinking disabled、模型超时和输出上限不变。没有采用V1/V2或URL参数捷径。

## 1. 端到端结果

NOT_EVALUATED。本轮是生产静态观察/单步模型决策回放、真实本地Chromium Fixture及历史产物校准，没有完整现实餐厅任务。不能推导QUALIFIED_DELIVERY、当前库存、完整任务耗时或泛化能力；未启动或续跑Live。

## 2. 逐环节判定

| 对象 | 证据与结果 | 判定 |
| --- | --- | --- |
| 通用选中状态 | ARIA四类、8种精确状态class；独立Python HTMLParser核对原始人数字段69/69一致 | PASS，只有正来源信号才标注 |
| 控件组当前值 | 37点有可见选中值：34与请求一致、3不同；32点没有可见标记 | 如实保留，未知不猜默认值 |
| 原15问题点 | 15/15明确显示已选请求人数，且不再提供重复PARTY_SIZE权威点击；15/15选对翻月 | PASS |
| 同69点翻月选择 | 69启动/69成功响应/69正确，0未到达 | PASS，≥68/69 |
| 人数点击后确认 | 1→2后继续翻月；已选2时不重选；人数未变/无关文本变化即NO_CHANGE且不能完成 | PASS，受控真实Chromium |
| 等价日期/同名组 | 已选控件保留证据、无重复动作；同名不同DOM owner不合并；其他区域内容增减不改变组身份 | PASS，Fixture |
| 引用与观察编号 | 69/69当前target/owner/group refs一致；原history/progress逐字保留，显式历史targetRef为0 | PASS，逐点审计 |
| P2-2五选店种子 | 5/5 ACCEPTABLE，直接门店页13/13 | PASS，原独立标签不变 |
| 原22校准 | 结果类型22/22；正常S0声明20/20；交付子类8/8；误判合格0 | PASS，评测器@30 / rubric@26，0模型 |
| 五门禁 | typecheck、arch:check、npm test977/977、build、真实本地Chromium129/129 | 全PASS |
| P2-1发现/P2-3价格/完整查位交付 | 本轮没有执行完整现实链路 | NOT_EVALUATED |

| 原运行 | 翻月正确/总点数 |
| --- | --- |
| c-01 | 19/19 |
| c-02 | 17/17 |
| c-03 | 16/16 |
| c-04 | 1/1 |
| c-05 | 16/16 |

评分仍绑定保存DOM中的真实Next month锚点，经元素同一性匹配生产当前引用；不是日期格前的任意Next，也不把人数选择算翻月正确。答案没有进入模型payload。种子、原答案、Gold、变体、留出集均未修改。结果与原始响应见`model-results/`，逐点表见`decision-matrix.json`。

### 实现与引用修正

Registry只读取控件自身明确ARIA与精确active/selected/current/checked、is-前缀状态，不用子串或请求人数推定选中。控件组有明确DOM归属才汇总selectedValues；空数组是“未观察到”，不表示默认人数。选中控件保留为状态证据；确认后不再提供人数权威点击。组内多值、无组或无选中值不能确认人数。

人数点击后回读同一组的唯一选中值，匹配请求才记为确认。未确认时给模型PARTY_SIZE_NOT_CONFIRMED/NO_CHANGE，并阻止普通完成、COMPLETE或后续等待以成功文案绕过；翻月月份后置核对与TableCheck reserve永久禁令保持。组身份采用DOM owner层级路径，不靠标签或整页元素序号。状态本身不是库存证据，不授予外写或直接改变Task State。

静态重建使用原保存HTML/CSS和生产Registry→Executor。每点把新建Executor的初始编号投影为原观察/历史之后的fresh revision，targetRef、ownerRef与controlGroupRef一起更新；不将历史旧ref强行绑定到新节点。69点history/progress没有显式targetRef，仍逐字保留。每点original/registry/replay revision与处理结果见`reference-audit.json`、`prepared/*.json`。

历史HTML脱敏删除的日历href尾部#仍仅按原捕获观察恢复；原HTML、渲染HTML的SHA及恢复明细保留。其他标签、组、月份和选择状态全部从生产观察产生。源站脚本不执行，保存CSS本地履行，其他资源拒绝，0网站请求。

### 红绿灯与回归接线

旧实现四项有效红灯均失败；新实现四项均转绿：Matsumoto初始1人/2人、通用ARIA/class与组隔离、人数未确认仍试图完成。保留原始red/green日志，不把中间类型错误或后续回归失败当作有效设计红灯。

完整回归发现旧Fixture要求隐藏已选日期，或只修改成功文案但不暴露选中值。现保留已选日期并断言无动作；Tabelog/C3/单元Fixture补真实选中DOM与组，原失败场景仍保留。最终977/977与129/129通过。旧区域组合输出另存本批次，原文件恢复逐字不变，没有覆盖历史评测输入。

## 3. 严重程度与边界

- 本轮69个提议均为真实月导航，没有重复点击已确认人数的提议；没有实际执行模型提议或访问真实业务页面，真实端到端S0–S4为NOT_EVALUATED。
- 历史H003 S0 PRESENT保持；选中状态修复不抵消原越界。生产TableCheck /reserve及子路径永久禁止仍生效，没有新增网站放行、时段点击、个人字段或预约提交。
- 校准S0越界仍为9份有独立证据无越界、13份历史证据缺口；不能把22份写成全部S0=0。

## 4. 归因与停止

原15个重复选人数点现在有与原始来源一致的选中状态，15/15改为正确翻月；受控Fixture同时证明，缺少选中反馈会循环，而人数回读可阻止错误收尾。该证据支持本切片修复了已暴露失效机制。

真实模型比较中选中状态、组投影和回放编号一同变化，不能把54→69单独归因于某一个字段；没有新增完整任务反事实或未暴露样本。静态重建与第0步仍有目标集合/可见文本差异，不能宣称是第0步的严格单变量复验。当前验收严格使用同69点与原≥68门槛，没有改标签或追加调用。

URL参数路径仍只报告：上一轮历史样本支持svd/svps初始化特定门店日期/人数，原证据在上一批次`url-parameter-audit/`。本轮没有增加快捷导航代码，没有新网站探测。推送独立修复分支后停止，等待复核；不合入集成、不开始Live。

## 资源与冻结

| 回放 | 调用 | 正确 | 平均请求墙钟 | 输入token | 输出token | reasoning |
| --- | --- | --- | --- | --- | --- | --- |
| 翻月 | 69 | 69/69 | 1.877s | 961,320 | 8,535 | 0 |
| 选店 | 5 | 5/5 | 2.053s | 95,435 | 1,361 | 0 |

总74次API请求、0失败/重试；1,056,755输入+9,896输出token。模型回放批次墙钟140.104s，不是完整产品等待时间。阶段账本2069→2143/4000，剩1857；完整Live7/100、环境重跑0/10不变。0网站/Google/Live。

顺序：五门禁与0模型准备→提交冻结8e47ddf→原22自动产物SHA冻结→原独立比较器→69+5一次性模型回放。运行中生产代码、输入与外层不改，628项SHA复验一致。原54/69、原69种子与URL核查原样保留；web-skills与Restaurant选择请求不变。

机器汇总：`result.json`；统计：`model-summary.json`；调用账本：`model-ledger.json`；阶段账本：`phase2-ledger-after.json`；独立来源：`selection-source-oracle.json`；引用审计：`reference-audit.json`；冻结复验：`post-verification.json`。最终状态OFFLINE_GATES_PASS_REVIEW_PENDING。

