# P2-1 离线收尾与 P2-1a

- 日期：2026-10-17（用户本地时间）；exposed development diagnosis，非 Clean Baseline。
- 起点：git pull --ff-only 至 50a79d9，复核正文与 VPN 补充已通读。用户批准 ADR-0042 Accepted；探测 40 次、模型 450 次上限。
- 本轮不访问真实网站、不调用真实模型，不做网络恢复对照、见证认证、基线重跑、检查点 A、P2-1b 或 Live。仅固定传输及本地 Chromium Fixture；Git 拉取不计业务网络请求。

## 3b 基线准备修正

- 新增 source-data-preflight@1：本批发现探测和 hybrid-live-read 入口在创建模型、正式启动之前，对计划来源的已知区域各读一次。浏览器经现有 Guard 打开列表，不点击；Google 使用既有 Text Search 一次。非空且非忙碌才通过；空结果、超时或读取失败记 ENV_FAILURE 并列来源，单独保存预检产物。不新增重试、代理变更或放宽准入。Google 预检请求单列。
- 发现探测外层识别 preflight-failure.json，0 模型且未启动探测；hybrid 在正式 started 之前失败。下次运行冻结须包含新 Runner、预检代码和已知区域配置的 SHA；本轮不改历史 freeze。
- 指标按发现来源分列：Google 官网 origin 和完整门店路径与见证一致（仅忽略 en/ja 语言前缀）才计入。恶意域名、不同 ID、相似名称不计入。名称启发式和独立复核提出的未确认线索另列，不建立身份。
- 十次旧产物离线重算：原始 summary/trace/decisions/recording 不改；TableCheck 十次失败改记环境问题。h001 #1、吉祥寺 #1 的 Google 未到达记同一环境影响。原始终止码保留，不作为 TableCheck 能力缺失证据。
- Google 三次出现精确见证链接，共四个精确 ID 匹配：h001 #2、吉祥寺 #2、中目黑 #1。中目黑还发现另一 Google 候选指向 13241250；复核所列 Instagram 名称线索仍不计身份。详见 baseline-recomputed.json。
- 有效红绿：03b/metrics-red.log → metrics-green.log；03b/preflight-red.log（空结果误接纳）→ targeted-green.log（成功、空、超时，失败不启动）。初始化路径错误不是有效红灯，普通失败日志保留。
- 四门禁：03b/gates.json；npm test 933/933，typecheck/arch/build PASS。P2-1a 后完整跑五门禁。
- 新增真实模型、业务网络、探测、Live 均为 0。既有 86 模型、10 次探测仍计入 450 模型/40 次探测额度，不因环境归类退款。

## P2-1a

待实施。网络恢复后的基线须使用本节实现前记录的提交；检查点 A 使用 P2-1a 提交，二者共享修正后的预检和指标。

### 基线外层停止谓词修正

指标重算后，已知的 Google 精确官网匹配会令旧聚合停止条件误停。外层改用原生来源分项判断卡点变化；Google 精确匹配仍记录，不再当作原生来源已改善。有效红灯直接执行 35c5dc2 的实际谓词，绿灯执行当前谓词；同时验证原生见证出现仍停止。没有运行外层 CLI 或任何探测。

此评测侧修正单独提交，随后记录的基线点将取代早先暂记的 35c5dc2。历史 baseline-freeze 保持原样，网络恢复后必须重新冻结，不可直接运行旧清单。

## 2026-10-17 corrected source metrics (offline)

TableCheck: ENV_FAILURE in all ten probes (independent-review.md supplement). Google not reached in h001 #1 and Kichijoji #1 is the same environmental effect. Original JSON/trace/decisions remain unchanged. Google exact witness website IDs are credited separately; names are unconfirmed. The old aggregate 0/8 TARGET conclusion is superseded by this source-specific table, not a normal-network capability baseline.

| Probe | Tabelog witness | TableCheck | Google exact website ID | Unconfirmed names |
| --- | --- | --- | --- | --- |
| p2-kf-h001-20261027 #1 | false | ENV_FAILURE | NOT_REACHED (ENV) | 0 |
| p2-kf-h001-20261027 #2 | false | ENV_FAILURE | true | 35 |
| p2-kagurazaka-kaiseki-20261029 #1 | false | ENV_FAILURE | false | 13 |
| p2-kagurazaka-kaiseki-20261029 #2 | false | ENV_FAILURE | false | 13 |
| p2-kf-h005-20261029 #1 | false | ENV_FAILURE | false | 8 |
| p2-kf-h005-20261029 #2 | false | ENV_FAILURE | false | 8 |
| p2-kichijoji-tempura-20261027 #1 | false | ENV_FAILURE | NOT_REACHED (ENV) | 0 |
| p2-kichijoji-tempura-20261027 #2 | false | ENV_FAILURE | true | 9 |
| p2-kf-h002-20261031 #1 | true | ENV_FAILURE | false | 17 |
| p2-nakameguro-yakiniku-20261030 #1 | false | ENV_FAILURE | true | 13 |

Evidence: followup/baseline-recomputed.json; models=0, business network requests=0.
