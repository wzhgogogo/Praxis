# ADR-0036 补充草案：脚本请求类型与公开读取预检

- Status: Draft（提议，待用户批准；未实施）
- Document revision: 0.1
- Last updated: 2026-10-25（Europe/Vienna CET；复核编号20261026）
- Source of truth for: F3拟议的脚本读取分类、预检准入及地理类型缺口处理条件
- Related ADRs: [ADR-0036](0036-generic-public-read-network-policy.md)、[G1窄例外](0036-tablecheck-reserve-read-supplement.md)、[ADR-0035](0035-browser-read-network-boundary.md)

## Context

用户停止点3b复核结束F5。F3只审计；本补充不修改ADR-0036或G1正文，不把任何条款标为已替代，也不授权本批改变Guard。

Linux已有有界诊断8次中2次失败：Playwright记录fetch，Guard记录BLOCKED_METHOD/xhr。当前普通route使用`request.resourceType()`；CDP路径按networkId取`Network.requestWillBeSent.type`，缺失时回退`Fetch.requestPaused.resourceType`。本地真实Chromium同时观察到Network=Fetch、Fetch=XHR；仅延迟给Guard的Network缓存回调即可让合法POST误拒、接收端0到达。双类型本地规则控制放行同一个POST，多字段和PUT仍0到达。这是本地构造机制对照；历史Linux未捕获CDP先后，不能把当次缓存缺失的具体原因标为已证。

来源声明不对称：Tabelog find_vacancy只列xhr，initial_vacancy只列fetch；TableCheck availability_calendar_v2只列POST/fetch。脚本采用fetch还是XHR、CDP如何报告它们，不构成副作用许可边界。

另有独立问题：当前OPTIONS只支持具有对应GET规则的浏览器预检；日历读取是已有四字符串规则的POST。F5 D1/D2的41/95是诊断出现次数，不能合计为136个独立误拦请求，且缺预检头/body配对。[审计与证据](../../.eval-artifacts/phase3a-prime/f3/report.md)。

## Proposed decision

1. 在共享Guard边界将fetch、xhr视为同一页面脚本请求类。保留Playwright类型、Network类型、Fetch类型及采用路径供诊断；来源声明、读取组合、Recorder与独立POST审计使用一致语义。不得将document、static、other、WebSocket等一并归入此类；不得通过伪造类型把文档或预约表单变成脚本读取。
2. 安全准入仍由**方法、origin、路径、query/body规则**及已安装的隔离边界决定。默认仅允许现行公开GET/HEAD；既有独立审核的窄只读POST保留精确端点、字段集合和primitive类型。其他POST、PUT、PATCH、DELETE及具有写入语义的请求在派发前拒绝。资源类型统一不扩大方法或字段，不让模型生成新放行规则。
   当前Tabelog同源公开日历GET还可由genericPublicRead的fetch/xhr后备放行，因此单类型声明不等于每次实际误拦。本提议不把现有一般同源GET改成精确端点白名单；严格query标记与独立审核POST的完整语法继续适用。实际影响按来源组合核对，不能把所有F5超时归到类型。
3. 永久拒绝预约提交、确认、取消、支付、账号、登录和个人信息操作；敏感操作优先于一般路径。保留已批准G1的固定公开reserve GET document例外及其参数/类型限制，只读到已有允许的日期、人数和时段观察；不得扩大到后继表单、脚本调用或提交。逐跳校验重定向，目的地不得继承许可。模型点击建议和HTTP200均不产生Authorization或库存证明。
4. “无害公开读取”是当前已接受策略下的受控准入：新隔离、未登录、不加载个人profile或既有登录状态；合法同源公开文档/GET/HEAD，或来源独立审核的跨源/POST只读查询；无敏感路径、URL凭据、个人数据或凭据字段；来源证据与请求语法匹配。**方法或字段过滤无法证明任意未知GET没有副作用。** ADR-0036已接受的未知公开GET残余风险继续明确保留；日志不能撤销已发送请求。发现写入语义立即拒绝，不能因GET名义继续放行。
5. OPTIONS仅在浏览器实际预检事实匹配**已批准实际读取规则**的投影时放行：真实Origin、Sec-Fetch-Mode=cors、Access-Control-Request-Method、已审阅header名称、无预检body、匹配的origin/path/query及对应读取方法。不得增加独立的通配OPTIONS许可，不接受模型断言的预检或未知header/方法/目标。已有GET场景及已审核的日历POST分别以其真实方法核对。
6. 预检发生时尚无未来POST body，因此“对应实际请求可放行”只能先检查规则存在及可观察投影；**不把预检通过记为实际POST已完整批准**。实际请求随后仍须在派发前独立核对完整body、字段类型、重定向和其他边界。非法body可能经历一次安全预检，但实际POST必须0到达；若审批要求先观察body才准预检，该场景保持阻断，不以假配对满足要求。日志明确区分预检准入与实际请求准入，不保存header值/秘密。
7. 准入与用户交付分开：仍核对同店身份、权威圆心/半径、日期、人数、时段、HARD和新鲜度。fetch/xhr、OPTIONS和HTTP成功本身都不是这些结论的证据。录制/回放未知输入仍失败，不联网补齐；普通DOM stale-ref和ADR-0043已观察入口归属合同保持。

### 地点类型关联项：另需复核的条件

Omotesando失败来自Google地理类型合同而非网络Guard：已保存HTTP200返回Omote-Sando Avenue/type=route，当前地理白名单不含route。不得加Omotesando拼写或城市例外，不允许以类型统一暗中改圆心。

提议复核以下有界处理：从同一已观察排名响应中选择有依据的车站/街区，或仅在可解释的地点身份、上下文距离与有效坐标都成立时，将route返回的**观察点**用于原请求的1000m圆。街道线不等于区域、车站或沿线全部范围；证据不足/排名歧义则明确未解析或请求澄清。不得为了成功改选未观察地点、扩大半径或把一次东京bias控制推广为任意城市。这是独立地理合同决定；批准Guard类型统一不自动批准route扩张。

## Consequences

- 消除脚本API选择与双CDP类型上报造成的无安全收益拒绝；不承诺恢复每次F5读取或提高例01合格率。F5已结束，例01是已知限制。
- 来源规则与外层独立审核须同片修改，防止生产已放行而录制/S0审计仍按旧fetch-only解释。未发布合同直接更新全部调用方和fixture，不留兼容旧路径；实际受影响Prompt/Schema才递增版本。
- 未知GET副作用、未记录的历史预检配对和Linux当次事件顺序仍是明确限制，不能写成已安全证明或已修复。
- 本补充批准后才分批实施；本批源码、站点目录、source-packs.ts和预算零变化。

## Offline validation required before implementation approval can become closure

- 复用本批真实Chromium的Network=Fetch/Fetch=XHR及缓存延迟反例：旧路径误拒，修后同断言合法请求1到达；真实XHR读取正例。保留原始类型，不依赖预设假CDP类型自证。
- 自动CORS预检：合法已审核POST在旧GET-only路径上失败；拟议实现后预检及合法POST分别被独立接收端观察。未知方法/header/origin/path/query、敏感路径、凭据、非法字段和body的实际请求0到达；非法body不错误要求“预检一定0到达”。
- `/reserve`越出G1、提交、确认、支付、账号、个人信息、跨源写入、多跳重定向到禁止路径均拒绝；字段伪造、document伪装成脚本、普通stale-ref仍拒绝。保留现有负向覆盖与预算，不重复制造同一输入/路径的测试。
- 若另行批准地理变更，保存route样本、正常地理结果、同名错城市、歧义/缺坐标和未观察后位结果反例；按真实地点解析链路验证，不预填权威圆心。
- 五门禁、真实本地浏览器和对应实际组合验证按Test Skill；外部不确定性另经批准才能Live。本批六个类型对照不是POST预检已修复的绿灯。

## Alternatives considered

- 只给Linux E1 fixture加xhr：可缓解一条测试，生产两站点声明仍不一致，不能关闭F3。
- 等Network事件更久或按特定事件顺序认类型：仍保留无安全价值的fetch/xhr区分，增加等待和竞态，拒绝作为主要方案。
- 允许所有POST/OPTIONS或用资源类型认定“安全”：破坏方法、来源、字段和副作用边界，拒绝。
- 硬编码Omotesando/东京或用route自动替换车站：改变地点权威与地理范围，拒绝。

## Related documents

[审计CSV](../../.eval-artifacts/phase3a-prime/f3/audit.csv) · [本地观察](../../.eval-artifacts/phase3a-prime/f3/observations/resource-types.json) · [Test Skill](../skills/test/SKILL.md)
