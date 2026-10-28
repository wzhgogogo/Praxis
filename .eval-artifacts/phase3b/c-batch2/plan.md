# 3b C 批次2：认证后验证与详情身份提取

- Evidence status: draft / not integrated；真实结果运行后另存，不覆盖准备包或历史结果。
- 2026-10-27，固定 CET UTC+01:00。基线：最新 main `daba2ef0`，整合提交 `5208d401`。
- 切片承诺：验证 Prompt26 具名目标保留；以已认证8家为主要对象测一种替代查询收益；修复已知详情电话/地址采集缺口，保留同店冲突拒绝；最终五门禁后推 C 分支停下报告，不合 main。

## 授权、输入与评价隔离

用户确认：原5主+3备全部升主，全部正样本；认证由复核者自己的网页查询完成，未用本批评测 GET。逐家地址/电话/店名/ID按用户消息记录在 `gold.certified.json`；复核原始响应没有提供，不捏造原文SHA，也不声称已独立GET复验。Waragamo只认证身份，不认证当前营业状态。Sen为用户找到后复核者核验的正样本。Dengana单列已暴露历史锚点，其余7家亦为公开开发样本，不是Clean Holdout。

`subjects.json`只含Google白名单字段（原名、地址、电话、坐标、Place ID）及固定策略；Gold ID/名称/来源URL不进入查询或 Prompt。身份比对与事后评分分开；不得按坏结果换样本或试到命中。旧15例是14个明确空＋nr-019宽泛未决，保持次级历史诊断，不冒充同期对照或生产直接链接路径表现。

批次真实模型≤100、评测GET≤35、Google≤35、Live0；仍受共享模型1000/评测GET40限制。每次服务尝试发出前追加独立账本id，原A/B/C条目不改写。认证网页消耗记0，不能算成本批GET。Node仅通过用户批准的绝对路径`--env-file`加载，密钥不打印/复制/暂存，日志只写“已加载/未加载”；不读取私有Holdout。

## 固定顺序与调用预算

1. 语义：39逻辑轮＝SR03两轮×3、明确换店两轮×3、撤销点名两轮×3、已有查位目标补人数/时间两轮×3，加Gold5开发全集15；同模型`deepseek-v4-flash`、Prompt26、Proposal4、冻结参考时间。不修改Gold或Prompt。既有schema最多2次尝试，最多78调用；非目标差异记录并继续。所有逻辑轮都走 Interpreter→Compiler→Runtime；不因旧严格评分不通过跳过下一轮。
2. 评测侧片段提议：最多1次受控模型调用；新的评测配置对象`phase3b-fragment-proposal@1`，不改产品Semantic Prompt/Schema。仅对预先分配MODEL_FRAGMENT的原始Google名称/地址提出连续片段，代码核对UTF-16切片与原文逐字一致；无效提议跳过、不重试、不查Gold。
3. 日文名：仅对预先分配GOOGLE_JA的对象，按原Place ID读Google Details并加`languageCode=ja`，最多23次（实际按策略子集）。`prepare-retrieval.mjs`在评测侧传输上附加语言参数，保留既有Google客户超时/错误分类、配置代理；不提前改造生产Google客户端，不重搜身份。响应ID必须与原ID一致。
4. 生成并提交物化查询与SHA后才运行公开GET：新8家原名1＋一种替代1，旧15各1替代，最多31。相同/无效/缺失替代记SKIPPED，不补另一策略，不挪额度。只请求已审核`https://tabelog.com/en/tokyo/rstLst/?sw=…`，不带Cookie、不自动跟随重定向、不重试、不加载子资源；每次完成到下次开始至少30秒。Node默认UA不覆写；沿用保存robots适用组和现有Guard许可，不新增网络规则。当前生产已先GET再观察UI，本批测检索表达，不把已有加速路径算成新实现。
5. 独立事后比对：只在此步骤读取Gold ID；从原始HTML实际观察的门店链接与ID比对，保留上下文。源文档/列表资格不明确时UNKNOWN，不以生产confidence或字符串出现在脚本中自证命中。新8家逐家成对，Dengana锚点分层；旧15只与历史原名结果做限定比较。这里不证明身份接纳、实时查位或营业状态。
6. 根据已保存详情页及收益证据实施电话/地址提取；先冻结有效反例红灯，再绿灯。没有模型/新来源调用藏在离线验证中。所有实现完成后新冻结受测源码，五门禁；解析/浏览器读取变动另跑固定G2（当前G3全部PASS标准不在本批宣称）。

## 修改前详情页范围（尚未动代码）

原范围与SHA已经在准备包报告列明；整合main没有改变两站parser：

- `tabelog-page-parser.ts` SHA `1e18b516fa4ec9c0c3211dfee414e92fa643bef497d9e044c8f6632237aacc0e`：`firstPhone`61–65，详情helper拟位于113–119附近，`parseTabelogOutletIdentityWithEvidence`120–159，转发入口161–162。
- `tablecheck-page-parser.ts` SHA `a1b8f5066a4670f713da7d4f6452b3e7405c86ff73dbac23397fafc22c4bc9e6`：`addressFromJsonLd`273–281、详情标签`textAfterLabel`283–287、`phoneFromPage`289–295、`parseTableCheckOutletIdentityWithEvidence`357–389。

只做详情主身份：采集联系区全部原号码及预约/店铺角色，保留号码引用；完整日文地址含门牌/建筑/楼层。不能从整页页脚/其他店卡片取电话，不能模糊比较、全局映射050→03、按同名接纳或覆盖冲突。选择来源明确标注的店铺号码供既有单号码resolver比较；全部号码另留在详情提取的局部证据中，不改持久State。需要共享合同/Schema或列表/日历文件变更则先报告范围，不静默扩张。B的G3仍等C经复核合main之后。

## 停止与证明边界

基础设施/凭据失败、额度耗尽、S0立即停止对应真实调用阶段；原始收据和消耗保留，不重试。不把Schema或非目标语义差异当基础设施失败；只有模型网关调用失败才触发基础设施停批。五门禁修两次仍红、需要未授权文件/共享版本或验收变化时停并报告。完整批次完成后停等复核。

四层：真实端到端查位/交付NOT_EVALUATED（Live0）；语义与检索逐环节各按独立Gold评分；本批没有用户交付，来源/交付S0–S4不作总体零错误声明；归因由原提议、编译、状态、原始HTTP和独立事后评价分别支撑。Fixture、保存页Replay、真实模型静态世界、评测公开GET分别汇报。
