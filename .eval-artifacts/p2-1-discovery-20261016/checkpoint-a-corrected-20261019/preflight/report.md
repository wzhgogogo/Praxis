# P2-1 来源预检修复

Evidence status: exposed development evidence；仅本地Chromium与离线，非真实来源探测。

预检先调用 prepareNavigation，再以正式首批相同的35秒导航／单请求预算读取；不再把未收到搜索响应记为空结果，artifact@2分别保存 EMPTY_RESULT 与 NO_RESPONSE、HTTP状态、超时与Guard诊断。只有带状态或超时证据的失败进入停止计数；其余缺证失败仍阻止启动，留作预检诊断。

真实Chromium的6.5秒响应在旧代码下 EMPTY_RESULT/count0（red.log），修后返回1家/HTTP200（green.log）；既有空200、503无响应、无状态缺证及超时反例通过。五门禁typecheck/arch/build通过、默认941/941、完整真实Chromium117/117，日志见 checkpoint-a-corrected-20261019/preflight/gates/。

按aaeb088复核及用户指令，旧3次失败追加标注为“预检缺陷，原因未完全确认”，停止计数归0；旧A #1标为“P2-1a缺陷版本”并排除比较，原始字节与旧账本不改，4模型/1正式探测仍计费。探测上限42、模型450，累计145模型/21探测/50Google；本项0模型/真实网络/探测/完整Live。基线acfaaffa不变，接下来只修首页类别与规划提示，再重冻A；nearby留A后，P2-1b不开始。

- 红灯：[red.log](red.log)
- 绿灯：[green.log](green.log)
- 门禁：[results.json](gates/results.json)
- 历史追加标注：[review-reclassifications.json](../review-reclassifications.json)
