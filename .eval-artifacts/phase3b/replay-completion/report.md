# 3b A批次1 回放分歧修复与静态资源方案

Evidence status：current executable（窄引用绑定修复）＋draft / not integrated（静态方案）。时间2026-10-26T23:54:36.400389+01:00（Europe/Vienna CET），独立分支codex/fix-phase3b-recorded-reference-replay，起点最新main cc127320。新增真实模型/网站/Google/Live/评测GET全部0。

**停止结论：历史snapshot3的临时引用失配机制已修，并有实际Executor红绿灯；整份旧F5录制在当前main仍REPLAY_INCOMPLETE，首个语义Prompt/Schema不兼容。** 不把局部窗口代替整包回放，不改旧输出版本或加产品兼容。按用户跨版本停止边界交复核者安排后续原版本环境；本批不读取历史工作树、不新增调用、不合main。

## 历史分歧与修复

历史记录：`.eval-artifacts/phase3a-prime/replay-url-qualification-20261025/f5-qualified/replay.json`消费2页、尝试5决策，snapshot3 DECISION_SEQUENCE_DIVERGED。其execution result的browserTrace第25–29项显示第4个wire OPEN_LINK带`observation:2:target:25`，第29项先拒绝STALE_OR_UNKNOWN_TARGET_REF；录制第5行应为检索计划，重放却仍在浏览器决策阶段，因此出现后继类型分歧。原第4行上下文确实观察到“Itabashi & Along Tobu Railway Line”及A1322 href，不是模型捏造入口。

原样返回跨执行的临时ref无法绑定当前观察。A层ORIGINAL传输边界现在按现有source-stage Replay公开语义指纹做唯一绑定：同来源、阶段、目标、页面及目标公开语义/动作权限；只换targetRef，动作、href、请求权威值和理由不变。SELECT_REGION_ENTRANCE另按当前来源/flow的已观察集合与相同样本绑定。没有用位置/CSS/testid找目标，也没有向模型补造链接。匹配缺失、歧义、改目标或权限即停；生产模型/Executor/Guard保持原stale-ref限制。协议名observed-target-rebinding@1，仅属评测，不升级产品Prompt/Schema/State。

有效红灯：299f3682（typecheck已通过）用实际F5保存DOM、原第4行wire、真实Chromium＋生产ModelBrowserReadActionDecision＋Executor，目标COMPLETED断言实际NO_SAFE_ACTION，诊断明确STALE_OR_UNKNOWN_TARGET_REF，见reference-red.log.gz。修后同断言到达原已观察A1322入口，模型替身消费1个原wire；普通RAW路径仍原页NO_SAFE_ACTION并拒绝stale。构造歧义、改href/label/权限/目标、跨来源、旧flow、集合为空、URL冒充ref、Prompt不匹配等拒绝控制通过。

该窗口的传输由保存页和本地CSP构造，明确不是整站网络Replay；它只证明临时引用机制与原动作目标可复现，不证明原选区正确或例01能力通过。所有新测试输入注明历史保存数据/本地构造边界。

## 当前整份原始录制

输入、HAR和39决策保持原字节，来源及外层冻结SHA见inputs-sha256.json；run-offline.py在ORIGINAL模式、OS deny network-outbound且不继承Provider环境执行。完整原始输出见original-current-main.tar.gz，摘要见original-replay-summary.json。

结果：REPLAY_INCOMPLETE，0/94页、0个成功重放决策、尝试1/39；模型传输0、来源传输0。第1个录制语义合同Prompt@23 / Schema@3，而当前main请求Prompt@25 / Schema@4。Runner新增精确recorded/requested元数据；严格核对没有放宽，返回NOT_EVALUATED而非真实任务失败或成功。原CLI exit1因未完整执行保留。第一次输出放外部Python创建目录时，文件读取Guard拒绝了该未由Node登记的临时路径；改用批准仓库产物目录后取得完整回执。没有去掉Guard，没有实际读取历史工作树。该接线错误不算有效红灯。另一个测试文件级exit1来自预期Runner退出码，已在测试finally恢复环境，不算修复产品或有效红灯。

继续旧整包需复核者明确原执行版本的隔离方式，或后续批准新匹配录制；本批不迁移旧语义数据，不改C所有的语义合同。该限制独立于已经复验的浏览器Prompt20/Schema12引用修复。不能声称整份F5回放已完成。

## 静态资源方案与离线证据

[方案比较与完整24路径清单](static-options.md)，[逐页审计](static-audit.json)。初轮缺失清单24项，重跑槽1 HAR已有10项安全字节；当前1个ADMITTED脚本路径缺字节、2个脚本路径被Guard拒绝。75页缺静态CSS，71页另有动态响应缺项；只加脚本规则不能解决。当前合格19/94（20.21%），本批0页被提升。

94/94诊断DOM已保存；禁脚本/禁网络的六页探针读到正文6/6，但一个TC列表仅121字符。它是DOM可读性诊断，不是库存、事件或网络回放证明。提议(c)结合严格网络回放与独立DOM诊断模式；本批只给方案/验证，不改Recorder、Guard或Source Pack。

## 四层评价

1. 端到端：完整原录制NOT_EVALUATED，Live能力分母EXCLUDED；不能作为例01成功。实际消费0/94与资格19/94分别报告。
2. 环节：语义第一请求即合同不匹配，后续地点/发现/身份/HARD/查位/交付均NOT_EVALUATED。保存DOM的窄引用窗口执行完成，不据此推导整链正确。
3. 严重程度：无新真实用户交付，Live S0 NOT_EVALUATED。局部负例全部在导航前拒绝；不把构造反例计为现实S0，也不以生产前后自比认证S0=0。
4. 归因：历史第4个ref先stale导致后继决策类型分歧；当前全包第一阻断是签收main的语义合同升级，未归罪于网站。静态资格还受完整CSS/动态字节制约，未记录的数据不推断存在。

## 验证与停止

五门禁将在最终干净候选执行并归档；有效红绿、负例、严格旧合同控制及DOM方案探针分别记录。产品、站点、source-packs、Prompt/Schema/State、Recorder脱敏相对main零差异；不读取、不暂存.env。共享3b账本保留G2/G1条目并加本项零计数。工作分支推送供复核，不合main；当前完整旧录制仍未完成，等待复核者安排版本边界。
