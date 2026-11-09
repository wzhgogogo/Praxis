# 首次入口一次重载 — 实施切片

Status: draft / not integrated，已暴露开发诊断；2026-11-09 Asia/Shanghai。

用户在本对话明确批准：保留原生静态下载，成功HTTP响应连续5秒无正文进度时，中止整次入口并确认旧请求终止，最多重载一次；不重试4xx/5xx、POST或交互后的页面，D8原20秒总预算不增加。原生Route.continue后不能单请求abort的实证保留在report.md，不覆盖。

切片：Local Chromium与Browser Run的同一Guard导航入口接入首次加载恢复；仅显式给出导航预算、REVIEWED_STATIC_BROWSER的非Replay路径。原始未显式预算的调用、NODE_FETCH对照和BROWSER_GET_HEAD实验不加入自动恢复。显式预算保留原值（D8为20秒，来源预检的既有35秒不改），第二次只用剩余预算。只为原Guard审核静态GET、2xx已响应且未完成的CDP networkId触发；按实际dataReceived正字节重置5秒时钟。无响应头/未知连接、4xx/5xx、非GET/HEAD/OPTIONS、模型控件交互或独立子目标出现时不恢复。所有重载请求重新通过原Guard，准入合同不变。

先Page.stopLoading终止浏览器加载，并abort属于此页的Node route.fetch；只有旧CDP请求都收到终止事件后才再次准备同一入口。goto等待另行AbortSignal取消，不把取消等待当作取消下载。新入口不增加模型调用、不更改State或身份结论。Recorder和canonical trace添加ENTRY_NAVIGATION：attempt/retryCount/event/elapsedMs/触发状态与空闲时长，不记录URL值、正文或头。原生响应仍经过原清洗，主动取消只允许不录未完成正文，不吞掉清洗器异常。

验收：真实本地Chromium原Guard+trace+Recorder链路，服务端旧连接close在第二请求之前、Node连接也先关闭；4xx/5xx、无头、持续数据、POST拒绝、交互、外部取消、二次卡住、非首次导航。完整默认/浏览器/G6/严格G2及type/arch/build，扫描新增写死逻辑。旧导航同夹具10秒超时红灯已保存，首轮错误夹具与候选失败也保留。

不接触外部网站、模型或Live，额度不变；没有新源站读取权限。真实站点效果和既有无响应头CSS/DNS/403问题未验证，不由本地恢复推断关闭。旧独立文字查询审计缺陷不在此切片，保持开放。全套离线门禁后停止，不推送、不合main、不追加D8。
