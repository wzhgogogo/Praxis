# 第二阶段退出留出集：见证门槛停批

Status: frozen retrospective / stopped before holdout Live. 仅评测侧打开批准材料用于日期物化和见证认证；生产/Prompt/评测器未据此调参。本报告的见证认证结果不是产品能力评分。

## 第一层：端到端

用户批准的 c-17 额外30秒重跑已 QUALIFIED_DELIVERY：3家、214.037秒、29模型调用全部成功、0超时；S0声明/越界均ABSENT。检查点C四个TARGET分别3/3、2/3、3/3、3/3，门槛PASS。旧17份能力判定仍引用已复核@32，本次c17用@33；C18展示回放@33的原报告保留。详见 [c17报告](../c17-timeout-retry-20261022/four-layer-report.md)。

第三步要求6/6用例至少1家认证见证，实际5/6。第05例原地点和唯一备用地点在限定来源范围内均不能认证负向HARD #2，按用户机械门槛立即停批。支持缺失是NOT_EVALUATED，不判成NOT_MET，更不是产品CAPABILITY_MISS。第四步18次全部NOT_REACHED；第五步措辞对提取未到达。没有生成留出产品评分、展示回放或最终Live冻结。

| 用例 | 已用fallback次数 | 已认证家数 | 请求库存 |
| --- | --- | --- | --- |
| p2-holdout-01 | 0 | 3 | EXACT_REQUEST_MATCH |
| p2-holdout-02 | 1 | 3 | EXACT_REQUEST_MATCH |
| p2-holdout-03 | 0 | 2 | EXACT_REQUEST_MATCH |
| p2-holdout-04 | 0 | 3 | EXACT_REQUEST_MATCH |
| p2-holdout-05 | 1 | 0 | NOT_CERTIFIED |
| p2-holdout-06 | 0 | 2 | EXACT_REQUEST_MATCH |

## 第二层：环节

P2-1首批见证、P2-2所选直接门店页、P2-3价格/条件展示等产品指标均NOT_REACHED，不用人工认证代替。以下只是0模型见证源数据核对：

| 用例 | 来源店名 | 门店ID | 距当前认证地点解析点(m) | 匹配时段 |
| --- | --- | --- | --- | --- |
| p2-holdout-01 | Torie Ueno hirokoji ten | 13128870 | 192 | 19:00 |
| p2-holdout-01 | Ueno Kuromon Torie | 13191933 | 344 | 19:00 |
| p2-holdout-01 | Tori no Ichi Ueno honten | 13290563 | 323 | 19:00 |
| p2-holdout-02 | SALVATORE CUOMO &amp; BAR Sangenjaya | 13013080 | 614 | 19:30 |
| p2-holdout-02 | ilco | 13230173 | 586 | 19:30 |
| p2-holdout-02 | The Kentarone | 13169776 | 462 | 19:30 |
| p2-holdout-03 | Shabu Gen | 13015193 | 645 | 18:00, 18:30, 19:00, 19:30, 20:00 |
| p2-holdout-03 | Kappo Kukita | 13169764 | 414 | 18:00, 18:15, 18:30, 18:45, 19:00, 19:15, 19:30, 19:45, 20:00 |
| p2-holdout-04 | Miyoshi | 13022072 | 235 | 18:30 |
| p2-holdout-04 | Utsuke | 13291679 | 705 | 18:30 |
| p2-holdout-04 | Ningyocho Umeda | 13003026 | 328 | 18:30 |
| p2-holdout-06 | Nanban Tei Shimokitazawa ten | 13037445 | 586 | 19:00 |
| p2-holdout-06 | Yaki Yasai Ginga Dan | 13289461 | 481 | 19:00 |

第02例原三家均没有匹配晚餐库存，按唯一备用地点规则认证3家；三家官方晚餐预算上界均低于不变的HARD上限。第05例原地点/备用地点分别保留6页来源；备用地点1个候选不是Chinese分类，被排除且材料保留。其余公开菜单和可见商家字段没有明确非辣支持；普通菜名、菜系缺词、降低辣度或1–5级可调均未被冒充为非辣证明。没有为未支持的备用见证再请求库存。原日期/人数/时段/条件均不改，11月3日没有改日期。

## 第三层：安全与质量

C17安全结果见原独立报告。留出产品未运行，不能声称其S0已被评估。认证直接HTTP请求64次（Tabelog 56、Places只读POST 8），另有12次公开搜索工具调用，搜索服务内部物理请求不可见。保存的实际请求均为批准的公开门店/菜单/列表或四参数GET及只读地点查询，外写/表单请求/点时段均0。

同来源最小完成后间隔均>=30秒。1次无HTTP状态的传输失败按2分钟等待原样重试1次成功；403/503/429及忙页重试0。见证源传输重试不混入完整Live环境重跑。原始库存响应SHA、最小商家原始片段、请求/响应元数据、脚本与输入冻结来源见 source-integrity.json、source-capture-provenance.json 和 registry.stopped.json。

最早已认证见证观察：2026-10-22T06:41:36.126Z；原24小时截止：2026-10-23T06:41:36.126Z。这不赋予启动权限：当前6/6见证门槛失败。

## 第四层：归因、验证与资源

前次c17最后Agent10秒TIMEOUT触发MODEL_FAILURE并未交付；用户明确批准后仅将Agent/Browser单次超时10→30秒，总500秒/50模型/40Google不变。新跑有一次Browser成功响应15.692秒超过原10秒限，但独立新Live不是同响应的配对实验，不能把所有历史miss一概归于超时。原失败产物/评价不覆盖。

本阶段没有生产修复。326个生产/Prompt/脚本文件与已通过C17冻结逐字节一致；五门禁复用该批已通过证据（默认998/998、Chromium Fixture131/131），校准22/22依据不变。补充0网络/0模型验证：可见菜单片段保留，评论/隐藏/邻店排除；既有见证门禁接受5例，拒绝第05例。

本阶段新增模型0、完整Live0、完整Live环境重跑0。累计模型2885/4000、完整Live33/100、环境重跑2/10。原阶段账本全部来源SHA复查并保留，当前ledger-after.json仅增加0调用认证记录。若见证门槛将来另获处理，现余额最多可保留18次+4次环境重跑的模型上限（1100），本报告不启动或批准它们。

原私有holdout全文件SHA cb0efa949f21fc0c19c7a6fd48e6a51c1848bb722c795b0ccd51213c43ecb98e、commitment SHA 3eecc57e2366fc5cd6e9e989f54387b7134a43b8c5dfe5aa7ccd4ee39b9bff28、6例SHA均通过；原文件不改。Runner日期物化文件保留，两个fallback只在本次认证登记记录，未生成可运行的最终留出冻结。

C17 Live冻结 SHA-256：282828a4c679af6a4de314c5a730076566714254b287a5327e3d97fdbdd76cbd。C17交付冻结：108960f33d10662ed62ccde0051ab42eb6676c5282891838b600ac31c5f29df5。本次登记输入冻结：5d08caa84ca7c41226e0dfdc7c1dda7ce9dd1bd87720a4f11b93f497b97fa2fd。最终停批材料包SHA另见delivery-freeze.json；其用途是复核停批证据，不能用作Live启动许可。

停止后不再访问来源或调用模型，仅提交、冻结、推送材料并等待复核。
