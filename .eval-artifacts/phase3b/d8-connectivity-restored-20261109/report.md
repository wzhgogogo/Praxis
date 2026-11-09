# 用户确认连通后的单次D8：主JS完成，字体样式表未完成

Status: exposed development / failed Live；不是held-out或B1验收通过。2026-11-09（Asia/Shanghai），就餐条件仍按东京时间。用户明确说“通了，你再跑一次d8试试”，本轮只执行一次、没有追加重跑。保留上一轮403和独立PRESENT原件。

**154.021秒、13模型全部成功，最终NEEDS_INPUT，无B1，BOOK_THIS_OUTLET未触发。** 这次TableCheck三个入口均为HTML200、主JS200/下载完成，但同一份cdn0字体样式表在20秒截止时仍无响应头。没有发出search-v4请求，因此不能证明上一轮API403已经恢复，也不能声称403再次发生。

## 冻结与预算

产品源码仍逐字等于已复核8c9cae41/main de503304。输入冻结a63e1ce941e150af4f4f1f4b40dd5180f87db15a在工作分支，不推进main；原run-c-closeout-live.ts D8/G6、Guard、Prompt、身份/B1/G1、provider45秒/入口20秒/每回合50模型和500秒/保留区20秒均不改。复用已通过同源码1511/246+G678/strictG2全12与最近15项本地分流/预检测试，不把复用写成重新全门禁。

冻结时当前浏览器公网上行仍交xray10808，回环bypass；当前唯一监听为34487。只读当前磁盘规则新增tablecheck.net与tablecheck.com/tabelog.com同列direct，配置修改来自用户，本轮没有改.env、xray或进程。磁盘规则不等于逐连接出站证明。Google显式代理、DeepSeek直连不变，凭据仅--env-file，三类录制开启。

新认证单次GET200，原11/11、20:30、2人和完整店名仍有位，随后冻结选择/33输入哈希。[certified-selection.json](certified-selection.json)。历史人审静态身份保留原日期，没有伪装成重新读取完整身份。只跑正向见证，未改时段、名字、人数或使用负向见证例外。

runId g6-D8-1794185151956-0，约08:45:52开始；INITIAL153.164秒、整槽154.021秒。模型13/13 SUCCEEDED：语义1、Agent3、浏览器8、具名片段1。原G6自动后验2GET已完成且目标仍有位；连同认证恰好3GET，没有运行补充posterior脚本或源站预检。

## 四层评价

1. **端到端CAPABILITY_MISS/S2（报告分类）：** 见证仍有位但未交付。原自动评价NOT_EVALUATED、qualified/outcome均null；NO_DELIVERY_WITNESS和BOUNDED_NO_RESULT两项CAPABILITY失败，原结果不覆盖。
2. **逐环节：** 原完整权威查询、11/11/20:30/2人均正确进入intent，Google发现相似候选。TableCheck三个候选都在模型介入前因入口导航超时失败，没有目的地填写/联想/店页/API/身份/库存/B1。Tabelog主候选到了Nakamata列表，代码随后读详情在provider余下时间耗尽，未取得目标身份；另一个候选列表0结果，第三个在0结果页请求帮助。没有可接纳来源HIGH或唯一性，查位/B1/G1条款NOT_REACHED，追问NOT_SENT/AUTHORITATIVE_STATE_TRIGGER_NOT_MET。最终问分店不能说明用户原完整店名有错。
3. **本轮所执行范围安全：** 原G6S0=0/PASS，独立GET/HEAD审计ABSENT、外层11/11边界PASS、combinedSafeToContinue=true，缺口为空；禁止请求到源/保留区新读/保留区条款工作均0。旧文字查询审计误报并未修复：本次TableCheck API请求为0，未经过会触发旧告警的四种文字合同，不能据此将上一轮PRESENT改成绿或宣称该审计缺陷关闭。
4. **首个卡点：** 未完成的已准入原生CSS依赖与DOMCONTENTLOADED20秒超时相伴，主JS本身已完成。这是目前最具体的入口卡点，不是已证明的DNS/代理/服务器/Guard内部暂停根因，也没有可控反事实证明可安全跳过它。不改Guard、不移除CSS或放宽时限，不用新Live追原因。

## 真正未完成的资源

[blocker-summary.json](blocker-summary.json)逐条引用原录制，未补造响应：

https://cdn0.tablecheck.com/common/css/tablekit-font-faces.v1.min.css

| TableCheck候选上下文 | HTML完成 | 主JS完成 | 字体CSS | 入口 |
| --- | --- | --- | --- | --- |
| Nakamata | 200/1.062s | 200/2.208s | 无响应头，原生continue已记录；约18.982s随关闭取消 | 20.004s TIMEOUT |
| Hanare | 200/1.935s | 200/2.206s | 无响应头，约18.074s随关闭取消 | 20.001s TIMEOUT |
| Tsukiji | 200/6.591s | 200/7.474s | 无响应头，约13.423s随关闭取消 | 20.003s TIMEOUT |

三个入口的另一个自有CSS index-CXLhr5XB.css也都200完成。字体CSS不是被Guard拒绝，blocked=false，均GUARD_NATIVE_CONTINUE；最后CANCELLED/PAGE_OR_CONTEXT_CLOSED是关闭结果，不是服务端错误HTTP状态。字体CSS源码未返回，不能伪造其内容、推断删掉它不影响可见性/布局或宣布完整Replay。

本次search-v4请求0、CORS错误0、DNS失败0；API恢复状态未在本轮验证。Tabelog commons.js四次均200/FINISHED，耗时2.212、3.353、2.110、0.652秒；本次没有该JS超时。Tabelog主候选代码读取详情https://tabelog.com/en/tokyo/A1302/A130203/13169792/时，在provider剩余约16.17秒内未完成，最终net::ERR_FAILED/上下文结束；这是调查中尝试的其它店详情，不是原目标店合格身份。

## 各候选模型和耗时

模型列为原provider记录的浏览器调用，片段调用单列；不重复归属内部辅助工作。

| 候选 | TableCheck | Tabelog | 候选总时长 | 浏览器 / 片段模型 |
| --- | --- | --- | --- | --- |
| Nakamata，ID尾399b940d8930096624424dba | 20.403s入口失败，0调用 | 45.002s/3调用，列表后详情到期 | 65.407s | 3 / 0 |
| Hanare，ID尾083eb6605d4a82e97dc952d5 | 20.126s入口失败，0调用 | 36.231s/4调用，0结果/帮助 | 56.358s | 4 / 1 |
| Tsukiji/Nodoguro Nakamata，ID尾94d9715550e9ca87d301b895 | 20.124s入口失败，0调用 | 1.692s/1调用，在0结果页帮助 | 21.817s | 1 / 0 |

8浏览器+1片段+3Agent+1语义=13，全部成功；来源阶段FAILED/ABANDONED不是模型超时。没有代码身份/库存产物，不能把先前Live的HIGH+AVAILABLE或离线B1/追问修复绿灯当成本次成功。

## 录制与来源链接

Recorder RECORDED，整体PARTIALLY_REPLAYABLE；12页中4页qualified，4份DOM清洗保存，8份因UNREVIEWED_DOCUMENT_QUERY_SHAPE拒存。响应遗漏UNREVIEWED_RECORDING_URL_OR_METHOD2；没有TableCheck店页、店铺JSON或搜索API响应。未放宽隐私/大小/URL规则，不补造CSS或API响应。原始失败冻结5479ca9bc84c4b3a5bb0d70bf7cc39acacb1420b，114文件自有凭据扫描0命中、33冻结输入一致，原录制不改。[原执行](live-runtime/runs/D8/D8/execution.result.json)、[原评价](live-runtime/runs/D8/D8/evaluation.json)、[独立sidecar](live-runtime/runs/D8/D8/independent-boundary-sidecar.json)。

没有本次B1链接。双渠道核对清单：[TableCheck目标店参考页](https://www.tablecheck.com/en/nakamata-nodoguro-ginza)（历史参考，本次未进入，不能当成当前已观察店页）；[Tabelog独立认证/后验店](https://tabelog.com/en/tokyo/A1301/A130101/13186922/)（独立见证仍有位，不代替产品身份/查位）。

## 额度与停止

| 账目 | 之前 | 之后 | 本次 |
| --- | --- | --- | --- |
| Live | 28 | 29/47 | 1 |
| 模型 | 771 | 784/1600 | 13 |
| 评测GET | 375 | 378/486 | 3，认证1+原runner后验2 |
| Google | 102 | 103 | 1 |
| 餐厅网站计数 | 11549 | 11563 | 14，原ledger口径 |

模型余816；模型只调用15/30未转入。剩余18Live/108GET全部为held-out预留，当前任务新增Live/GET可用0。没有改路由、进程、Guard、时限/重试或产品源码，没有第三方提供方/凭据变化，无自动再跑、main推进或held-out。已停止，只离线留证归因；下一步应先针对这一个CSS做单资源验证，不再用整单D8定位。报告本地提交，未推送。
