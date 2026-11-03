# 同品牌身份调查与 B1 条款首个偏离

Status: draft / not integrated；已暴露开发证据，非 Clean Holdout。真实调用0，不读.env，时间CET UTC+1。

基于已发布main db1f44a2，分支codex/fix-phase3b-named-identity-and-terms；第一项已获批连续性合入另有证据，不归并成此次缺陷已关闭。

切片承诺：用户点名的同品牌门店在批准的候选调查边界内，可先只读取得同店来源名；恰好一个全名匹配才展示，零/多匹配反问，身份规则不放宽。条款沿现有G1绑定、引文、预算/20秒保留读取；提前退出有可导出的原因诊断，不写State。

数量口径待用户澄清：正文“总数>3直接反问”与测试“D2五家仍查前三”相冲突；D2原件确有五家。该依赖未答复前不实现命名数量分支，继续条款取证。

先冻结A ae7fd072的D2/D3语义、执行、录制和相关原DOM/HAR，逐字SHA核对。D3最后英文取页前700ms waitForSettled=false，日文页面为访问集中错误；这只是源记录事实，需离线确认第一条阻断，不将空terms推断成NOT_STATED。

离线材料准备：用本地Chromium在关闭外网/脚本的路由中渲染原DOM和保存CSS，核对重新取得的可见文字SHA与录制SHA。这个探针只说明文本复原与原记录，不是产品整组装成功。随后在createLiveReadAssembly整组装中冻结I/O和时序，先取得目标断言红灯，再做最小修复和独立核验；复原不一致需如实披露。

沿原默认/Chromium/G2测试复用断言，不改A评测和B三个G3文件；如需State或TaskDefinition版本变化先报告。五门禁和严格G2全绿、每项前后净树后推工作分支，不合main，通知A。真实模型、Google、网站、Live均0，预算不新增通道；先冻结Runner及输入SHA再运行，不在运行中修改。
