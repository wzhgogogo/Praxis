# 3b A批次1 回放分歧与静态资源方案

从最新main cc127320独立分支，只改A的eval/Harness/fixture/脚本及文档。新真实模型、网站、Google、Live、评测GET均0；不读取.env，不改产品、Guard、Recorder脱敏、Source Pack或共享Prompt/Schema/State。

原F5槽1固定输入先提交并记录SHA。历史f5-qualified trace已显示：第4个模型wire携带observation:2:target:25，被STALE_OR_UNKNOWN_TARGET_REF拒绝，接着在第5个请求发生决策类型分歧；初始两快照不是根因。按现有source-stage Replay的公开语义指纹模式，只在离线ORIGINAL模型传输边界重绑定临时引用：同source/stage/goal/页面、原观察中确有目标、当前观察中唯一同语义且合法动作不变；不改action、href、权威值或理由，普通生产stale-ref限制不改。SELECT_REGION_ENTRANCE只重绑定同来源/本次flow中等价已观察集合项；歧义/改页面/改地点或伪造href立即失败。

先在真实Chromium+实际ModelBrowserReadActionDecision+Executor中，用历史保存页和原wire取得旧引用失败的有效红灯，再取得绿灯及普通stale/歧义/跨来源反例。完整原样录制在OS禁网、ORIGINAL模式复跑；保留严格Prompt/Schema核对，老录制与新main合同不兼容时如实记录首个阻断，绝不伪造升级旧输出或加产品兼容。

静态脚本按manifest/HAR/诊断HTML清单，只列origin+path，不含query。评估审核静态规则、DOM快照不执行脚本及组合三方案；离线验证字节是否已存在、影响页数，未捕获字节不能靠新增allowlist补回。DOM诊断不能提升为现有Recorder合格页。只给方案，不放宽脱敏。

五门禁、净树、同步记录、推工作分支，不合main。若完整回放需要跨B/C文件、版本或历史运行时的新授权，则在该边界停止报告，不以构造窗口代替整份原始录制。
