# 每槽退出后立即独立评价

- 独立分支 codex/fix-phase3a-prime-post-exit-evaluation，从决策关联合入的新 main 开始。历史 F5 冻结外层脚本不重写。
- 当前 paced batch 父进程只等全部 child close 后汇总，独立评价曾依赖后来手工调用。新增父进程每槽 exit 事件即启动独立 evaluator 与 S0_DECLARATION/S0_BOUNDARY 核查，不等其他槽结束。单槽正式 Live CLI 同样由父进程监督。
- 正式 journal 创建后通过本地 IPC 通知已确定的 artifact 路径，先于模型执行；沿用原 Live 授权、预检、来源90秒/整单500秒预算、两路并行及退出控制。异常退出也评价已保存结果；没有结果或评价失败必须明确 NOT_EVALUATED，不冒充 S0 ABSENT。
- 独立父进程读取保存产物及预检冻结的独立 reviewed-reads（核 SHA），不以 Guard 的准入列表或子进程自报结论代替核查。原产物不改写；记录 exit→评价启动耗时及带 CET 时间的 per-slot receipt。
- 红绿：两真实 Chromium/HAR 子进程跑原完整产品链路；第二槽退出前必须看到第一槽独立 receipt，证明不等整批；非零退出仍评价；受控改错已展示人数后父评价必须发现 S0（不相信子评价）；无产物明确失败。仅最小 fixture，不复制历史运行。
- 五门禁、逐门禁净树、冻结输入/外层 SHA、文档同步后合 main 推送并结束本回合。产品/Prompt/Schema/Guard/站点不改，真实模型/Google/网站/Live新增0。
