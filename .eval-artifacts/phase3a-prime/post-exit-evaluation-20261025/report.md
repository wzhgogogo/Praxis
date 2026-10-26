# 退出后独立评价

状态：completed / frozen regression；2026-10-25 CET（UTC+1）。基线 main `f4d0c719`，分支 `codex/fix-phase3a-prime-post-exit-evaluation`，验证源码 `ce82a545047369c740f4e2f8b9074d41e4e8f846`。

当前 paced batch 曾只在所有子进程 close 后汇总，独立评价依赖后来手工执行。现在每槽 journal 创建后、模型执行前，子进程通过本地 IPC 通知确定的产物路径；父进程在该槽 exit 事件立即启动独立核查，不等 stdio close 或其他槽。单槽正式 Live CLI 同样由父进程监督，既有 Live 授权、预检、90秒来源/500秒整单预算与最多两运行的节奏协调不变。历史 F5 冻结外层脚本未重写。

父进程调用独立评测器@35，重读已保存产物，按预检登记的独立 reviewed-reads 路径核 SHA 并解析，再核查 S0_DECLARATION/S0_BOUNDARY；不用子进程已写的评价或 Guard 准入结论作为答案。每槽写独立 evaluation 和 post-exit receipt，记录原退出码/信号、源产物 SHA、CET 起止与 exit→核查启动耗时。评价前后核验原产物 SHA，不改写执行文件。没有产物、冲突引用、独立规则 SHA 不符或评价失败一律明确 NOT_EVALUATED，CLI 返回失败，不冒充 S0 ABSENT。

- 有效红灯：`0839e430` 下两个真实 Chromium/HAR 子进程执行完整 Interpreter→Compiler→Agent→Router→Reducer 路径；第一槽退出后第二槽等20秒仍无独立 receipt，FIRST_SLOT_NOT_EVALUATED_BEFORE_SECOND_EXIT 断言失败。配置与脚本在运行前提交并冻结。
- 绿灯：第二槽在自身退出前读到第一槽完整 receipt，证明不等整批结束；第一槽退出码7仍被评价且原码保留；无产物退出码9明确 NOT_EVALUATED。第二槽在子评价之后受控改错已展示人数，父评价独立检出 S0_DECLARATION PRESENT，而子评价原为 ABSENT。此为有意构造的离线反例，不是实际用户运行 S0 事故。单槽 CLI 监督器遇独立规则 SHA 错误也明确 NOT_EVALUATED。全部模型/来源均为最小本地 fixture，无历史运行整包复制。
- 首次绿灯尝试因测试 fixture 把既有数组契约误写为 `{rules:[]}` 而未评价；已改为 `[]`，生产解析器及所有验收断言保持不变。失败和修正后的原始证据分别保留，未覆盖失败日志。
- 最终五门禁两平台全绿：默认1054/1054，Chromium161/161，typecheck、arch:check、build通过；macOS Chromium104.495244秒，Linux104.986921秒，4路文件并发、健康用例全过，无跳过或取消，各门禁后 git status 为空。612个冻结输入/脚本 SHA 核对通过。
- 完整套件里的退出事件→独立核查启动：macOS first/second/missing约0.0352/0.0209/0.0656毫秒，Linux约0.0178/0.0218/0.0462毫秒；核心证据是前述跨进程因果顺序，未用脆弱的毫秒门槛替代链路验证。真实 Live 时延未新增测量，留待下一次获准 Live。
- 站点非测试 TypeScript3864、source-packs473，不增加；产品层、Prompt、产品 Schema、Guard、站点未改。新增真实模型、Google、网站、Live、环境重跑调用全部0。独立评测读取现有证据，不自动发起新的见证或交付后网站请求；不足之处仍由评测器明确标为未评价。

输入与外层脚本 SHA 见 final-inputs/freeze.json；red-run、first-green-run、final-green-run 保留各次生成的最小运行证据与来源 SHA；门禁见 mac-gates/linux-gates；总哈希见 evidence-manifest.json。专用 Linux VM 已停止并删除，任务运行时、镜像与临时源归档已清理，凭据见 ../review-followup-a-20261025/cleanup.json。按授权提交并合入、推送 main，最终 SHA 由 ls-remote 和最终消息核对。
