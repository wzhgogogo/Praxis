# 回放文档重定向资格映射

- 基线main70db9152，独立分支codex/fix-phase3a-prime-replay-document-redirects；新增真实调用0。
- 已核实F5三槽HAR有rstLst/→en/tokyo/301，最终初始页REPLAYABLE；当前loader的HTML过滤和document检查只认最终URL，原301被过滤、初始请求被提前拦。
- 只修改eval loader：录制完整、无歧义的GET重定向链可继承合格最终文档资格；保留原HAR301，不生成200或页面；未知终点、缺hop、环仍不合格。产品/Guard/Schema/Prompt/站点不改。
- 先提交最小生成fixture的真实Chromium/Guard正例及三种资格负例；当前生产loader取得目标红灯。F5槽1原录制ORIGINAL在系统断网下也先证明不能越过snapshot1。
- 绿灯：同输入同断言通过，原录制至少消费前两个真实合格snapshot；后续不可回放仍INCOMPLETE，不能宣称完整F5回放。
- 两平台五门禁/净树（E1已登记例外单列）、冻结输入/脚本SHA、站点3864/pack473不增加；按授权合main后进入决策快照关联。
