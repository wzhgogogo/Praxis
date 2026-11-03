# 同品牌前三家身份调查与 B1 条款首个偏离

Status: offline implementation candidate / not integrated；已暴露开发材料，非 Clean Baseline。时间 CET（UTC+1）；模型、Google、网站、Live 真实调用均0，不读取或注入.env。

已完成上一项：获批a1cd798e同步、净树五门禁/严格G2及独立核验后，main发布为db1f44a2238b44fa92cff58dae4e17e8903875a5，ls-remote已核对并通知A。本分支codex/fix-phase3b-named-identity-and-terms从该main开出，只推分支待复核，不合main。

## D2：原顺序前三家，先身份再查位

用户已明确五家输入也调查前三家。原Google响应有7家，现有possibleNamedOutlet过滤后5家；按该原顺序调查前三家，不调查后两家。全部前三家完成现有HIGH身份核对后，恰好一家的已绑定来源全名规范化后等于用户全名才继续；零家、多家或身份未确认均不选店、不查位、不展示。没有按相似度直接接纳，旧身份比较、20秒保留与原预算不放宽。

原真实语义和Google字段保留，详情页/库存为明确的构造来源I/O，不能当作实际中俣门店的Gold。bf787c1c三个整组装红（身份调查0，NEEDS_INPUT）；965516ad两组件红（未读完就唯一、无前三家读取权限）。5ec63ea9同五项绿：ONE仅正确首家查位/展示；NONE/TWO反问且无库存、选择和B1。

经用户窄授权的两站改动单独提交9008f7bbde3e819f84931294b5667526e605a551，恰13行插入，与两份事前冻结补丁逐字一致：

| 文件 | 位置与范围 | 行为 |
|---|---|---|
| tabelog-browser-availability.ts | 构造器157–172；readMatchedOutlet608–625 | 内部identityOnly开关，现有HIGH门槛之后返回，尚未读请求控件/库存 |
| tablecheck-browser-availability.ts | 构造器242–254；readMatchedOutlet738–754 | 同样的HIGH后提前返回；默认查位尾部原样 |

C组装通过既有G4取得ENTITY_MATCH，剥离临时UNKNOWN库存检查；不把仅身份COMPLETED当成HARD已核实，后续仍正常查HARD、库存、选择和条款。内部参数不进入State/动作Schema。已有G4接口需要实际日期、时段、人数；缺这些字段时沿既有事实读者，不制造到访条件。本轮D2字段完整。其他两份B的G3文件、A eval/harness、server/web均未改。

## D3：首因是未稳定页面在模型前被拒

A ae7fd072的17份原始执行、决策、录制、HTML/HAR按inputs.json逐字冻结。原英文导航700ms后waitForSettled=false（录制356），snapshot359仍PENDING。日文是“現在アクセスが集中しています”，不是可用门店页。完整DOM第一次本地渲染英文少8字符的失败保留；改用录制323的原visibleHtml后，两页文字SHA精确匹配原录制（英文6471字元72c6e47e…；日文216字元8bd752b5…），没有补写原文。脚本关闭，仅保存CSS本地应答，其余请求拦截。

4e14562f有效整组装红：正确店/空位/USER选择/PRESENT/B1都成立，问答为0而非2。0f7131e7只加诊断后仍红：QUESTION_UNVERIFIED / INCOMPLETE_PAGE，pageCount=1、boundPageCount=1。因此首因不是缺页、过滤、阶段、预算或保留区；是G1完整页守卫正确地在模型前拒绝PENDING。

修复仅在NativeSourceFactRead.inspectFacts的capturePagesOnly模式，约104–112及298–336行：复用既有Executor有界稳定性观察，文本稳定且无实际busy才接纳。普通事实读取、G1完整页/同店/同渠道/逐字引用检查不改；不让浏览器模型断言就绪，不新增网络重试、预算或解析器。日文错误页仍被身份核对拒绝。持续BUSY零问答，条款省略，B1照常。

D3原语义/展示响应原字节保留；来源查位前缀、Google Details为固定I/O，原CLICK引用不强塞给构造控件，不能称完整原HAR重放。修复后选店轮两次G1问答到达；原页只有Credit card accepted付款接受，没有取消或预约要卡原文，固定回答NOT_STATED，卡片条款仍[]。这证明读取阻断修复，不证明真实Live条款已成功填卡。

## 原因诊断与边界

每个提前退出、未核实回答及完成记录原因，导出bookingTermsDiagnostics，按根任务/运行/门店绑定；QUESTION_UNVERIFIED另含answerReason及页数。NOT_SELECTED、PHASE、NO_HANDOFF、NO_PAGES/PAGE_FILTERED、BUDGET、RESERVE、CANCELLED等不再以空terms混淆。诊断没有用户/网页全文、URL或凭据；使用现有瞬时读取缓存寿命，服务重启及过期不保证保留，非持久审计表。COMPLETED只表示尝试结束，不表示条款存在或预订完成。

State25、TaskDefinition23及语义/Agent Prompt/Schema均与main相同，SQL不变。历史D6错误展示S0=1保留；构造来源的PASS不是新37家通过率或Live能力签收。

## 冻结与最终验证

freeze.json固定814项源码、17原件、fixture、outer runner及独立oracle。五门禁与严格G2每项前后要求git status为空；最终执行待运行。

已有局部回归terms-regression为66/66，包含原条款/G1/20秒保留、两渠道、复用、冲突、错店/渠道、预算、取消与BUSY。最终独立oracle评3个D2、2个D3、14个旧条款和7个旧保留区输出，直接核原始文字、电话/地址、来源链接、请求、事件顺序与诊断，不导入生产匹配/投影判断；实际结果另存gates/independent.log。原红灯与渲染不一致原件均保留，不覆盖。

账本保留main740条并追加一条零调用记录，741行，限额与累计不变。只在本分支推送交复核；没有真实模型、Google、网站、Live或预约动作。
