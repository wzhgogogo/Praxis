# G6 开发Live认证停批报告

2026-11-02，Vienna CET（UTC+1）。状态：**CERTIFICATION_BLOCKED，Live未启动，待复核**。执行依据为用户2026-11-02批准、复核cc97d02b/main f992a8ac；pack SHA84f4c1f98cf42fb323fda54537ddfc465e967718c9ba88e105186e371c9d5c8b未变。新增真实模型/Google/Live/环境重跑均0；仅执行5次已批准公开GET。

## 认证结论与首个阻断

| 用户准入条件 | 结果 | 原始依据 |
|---|---|---|
| W1同店确认且11-11 19:00两人有位 | PASS（该次公开响应） | 13108466详情名址/电话与JSON-LD一致；空位响应base_date=2026-11-11、members=2，selection含19:00 |
| W2 Tabelog 13186922与TC当前名址电话一致 | UNKNOWN，阻断 | Tabelog详情可读；TableCheck电话对照GET未取得响应，只有TypeError记录；不能完成当前跨渠道核对 |
| 冻结与完整已评审证据导入通过 | NOT_RUN，受上游阻断 | pack/脚本SHA已核对，但整批身份/库存条件未齐，execution-evidence.reviewed保持false，未调用Live入口 |

首个阻断边界是**W2跨渠道身份认证**，尚未到Agent/Guard/F6执行阶段。另一个已观察偏离是第4次GET：W2本次响应不含所需19:00。冻结导入的有效空位条件也不能据此完成。

W1公开店名Kushi Katsu Dengana Akabane ten，地址東京都北区赤羽1-15-1 新仲ビル1F，商家电话03-5249-4011；取商家Phone number和Restaurant JSON-LD，不用预约转接号。类型是Kushi-age (Deep-fried skewers)。本报告没有继续生成完整八槽HARD/地区/追问oracle或冻结成功的Live执行证据。

W2 Tabelog公开店名Nodoguro Senmon Ginza Nakamata，地址東京都中央区銀座4-10-12 銀座サマリアビルB1，商家电话03-6264-3229。本次空位响应日期与人数正确，返回17:00–18:00和20:00–21:00，均15分钟间隔；未返回19:00。它有在线预约数据和其他原form_course时段链接，**不能改为DETAIL_ONLY，也不能宣称全天无位或没有在线预约**。13219563“はなれ”没有使用，没有猜测其他路径或修改日期/时刻。

TableCheck请求仅为已批准的https://www.tablecheck.com/en/nakamata-nodoguro-ginza。冻结采集脚本只保存了异常类别TypeError，没有保存底层cause、HTTP状态或响应正文；无法据此判断TLS、限流、站点故障或身份不一致。失败尝试照常消耗1 GET，没有重试，也未打开reserve/预约表单。采集命令正常退出只表示完成采集，不表示认证通过；本次以capture.json内容和独立原始证据核对停批。

## 五次请求与原始SHA

时刻为传输前记账时刻（CET），不是伪造的精确网络完成时刻。相邻间隔5006、5008、5008、5010毫秒；冻结代码同时强制至少5秒。所有请求串行、credentials=omit，无Cookie、登录、模型或.env加载。

| # | 用途 | 传输前记账CET | HTTP结果 | 原始body SHA256 |
|---:|---|---|---|---|
| 1 | W1详情 | 2026-11-02T14:37:36.333000+01:00 | 200 | f7dfe3a1e5ae6a030f09e6a1652b54ed12f977fc6f5ca5f797f79d756b543282 |
| 2 | W1空位 | 2026-11-02T14:37:41.339000+01:00 | 200 | 80ea0fc34ffa66b65787870d1bd48c15033a2e512b041065752ec480d681245e |
| 3 | W2详情 | 2026-11-02T14:37:46.347000+01:00 | 200 | 3b8da386780aa4533a11861f72a1d433f0fb5d30db5e6f9fd53fce27d2e00a99 |
| 4 | W2空位 | 2026-11-02T14:37:51.355000+01:00 | 200 | 25a6f072777e9ffa1c6121e66f022e2ed4372700878adc217ebbb781da39cc42 |
| 5 | TableCheck公开详情电话对照 | 2026-11-02T14:37:56.365000+01:00 | 未取得可保存响应 | 无响应，SHA不可得 |

requests-audit.json绑定每次ledgerId、原始URL、body/meta路径、SHA及缺失响应事实。四份body和元数据全部原字节保留于../84f4c1f9-certification；TableCheck没有响应则不造空白body或假SHA。两个空位响应都是独立公开四参数GET：rst_id、svd、svps、svt，日期20261111/2人/1900。所有已有form_course URL仅留作原始响应证据，没有打开。

certification-review.json从保存正文/JSON-LD和base_date/members/selection独立核对，未采用产品MET、候选理由或模型自述。execution-evidence.json是采集器原始未评审草稿，未把失败证书或缺电话标成reviewed。全部原始body SHA本地复核一致。

## 八槽分母与结果

计划8、启动0、完成0、可评价0。准入不满足依用户规则直接停止；不是八次Live失败，不用运行失败、超时或S0=0替代“未运行”。

| 槽 | 状态 | 端到端结果/S0 | 交付家数 | B1/条款 | 耗时 |
|---|---|---|---|---|---|
| D1 | NOT_STARTED | 未运行 | 未运行 | 未运行 | 未运行 |
| D2 | NOT_STARTED | 未运行 | 未运行 | 未运行 | 未运行 |
| D3 | NOT_STARTED | 未运行 | 未运行 | 未运行 | 未运行 |
| D4 | NOT_STARTED | 未运行 | 未运行 | 未运行 | 未运行 |
| D5 | NOT_STARTED | 未运行 | 未运行 | 未运行 | 未运行 |
| D6 | NOT_STARTED | 未运行 | 未运行 | 未运行 | 未运行 |
| D7 | NOT_STARTED | 未运行 | 未运行 | 未运行 | 未运行 |
| D8 | NOT_STARTED | 未运行 | 未运行 | 未运行 | 未运行 |

每槽的逐页合格数/总页数/原因、语义额外schema尝试、Guard越界计数和F6时间线均NOT_RUN，数值为null，见slots.json。不能把无运行填成0错误/0超时或0/0页合格。

三类录制配置仍在冻结pack内，但没有启动Live所以没有新浏览器录制、Google结构化响应或决策录制。G2日历、G3b有时段TableCheck日历及新replay均未采到。现在保存的是两份公开Tabelog详情HTML及对应本批空位响应，仅作认证材料，不冒充已验收G2日历或Live回放。D8没有运行，未生成用户核对双渠道链接；现有模板保留为空。

## 额度账本

用户批准总公开GET290→390，开发仍硬限20。原584项逐id原值保留；追加1项零调用授权与5项传输前GET，到590项。真实模型累计241/1600不变，公开GET255→260/390，Google12不变，Live0/26、环境重跑0/4。开发本批已用5/20，剩15；任何后续获批恢复必须继承这5次，不能以新目录重置开发额度。

当前全局余130，扣除开发余15及用户已确认“每槽最多3家Tabelog”的留出集最坏108，仍余7。不读取或推测留出集原文，不调用留出集。本批没有开启真实模型/Live进程，未读取、打印、复制、暂存或加载.env。budget-proof.json保留原始条目并集与全部累计值核对。

## 验证与停止

本轮仅额度配置/文档和真实GET证据，无源码、Runner、Prompt、Schema、State、Pack请求或参数修改。authorization.json列出的脚本与pack SHA全部未变；独立body SHA、身份摘录、日期人数/时段、请求间隔、账本原条目保留检查通过。git diff --check通过。

五门禁、普通及严格G2本轮NOT_RUN；复用用户对cc97d02b的2核Linux/Node24独立复跑结论：type/arch/build通过、默认1359/1359、原Chromium188/188+G6 51/51、普通/严格G2各5/5。该离线绿灯不替代本次失败的真实认证，也不证明当前TableCheck可达。

认证发生在11-02，获批Live日期仍11-03或11-04；没有提前启动，也没有因未来日期安排自动开跑。依用户“任何一条不满足就停下报告”规则，本批到此停止。由复核者决定是否更换日期/时刻或见证、是否另行授权补证；不自动重试、不重跑环境、不变更冻结输入。完成归档后推工作分支，不合main。

原始数据保存说明：两份公开详情HTML各有69行来源尾随空白，严格保持原始SHA；本目录.gitattributes仅对这两条body精确路径声明原始数据，避免Git行尾转换。正文可直接读取，未修改或脱敏重写原始响应。
