# 单实例xray后的Tabelog preflight

2026-11-09（Asia/Shanghai）；源采样2026-11-09 00:13:52–00:13:55。Status: network preflight only，不是D8或整页/主脚本验收。

用户要求先清理重复xray再重跑一次preflight，若仍超时才考虑Tabelog15–20秒；TableCheck不动。执行前发现旧孤儿PID50585已经不存在，只有v2rayN管理的PID54155（父54093）监听10808，运行前再次验证归属，结束后仍仅一个监听。本轮没有停止/重启任何进程，不把此前进程消失记成自己的清理动作。

输入冻结3a02fb291d722e338d7d726f0e777337164d429f。使用原runLivePreflight和当前xray配置，仅TABELOG、原10000ms、Range bytes=0-0、一次GET。返回HTTP200，目标耗时3069ms，预检总3076ms，TLS建立，PASS。保留raw started/result/账本和日志。模型0、Live0、TableCheck请求0，没有自动重试。

因此用户的“若仍超时”条件未发生：没有将Tabelog预算改成15–20秒；原浏览器入口20秒和Guard/重试策略不变，TableCheck不动。10秒是连接预检，仅请求一个首页RangeGET，不加载多个页面资源；不能以资源数量作为这次预检慢的已证实原因。此样本通过不单独证明重复实例就是旧超时唯一原因，也不代表大脚本或D8已经稳定/通过。

预算本次GET+1，共372/480；Live27/45、模型748/1600余852均不变。18Live/108GET留出预留未动。没有改.env/xray规则/系统代理/证书/产品源码；相关现有15项本地测试复用，来源源码与已复核8c9cae41逐字相同，不重跑全套产品门禁。未推送，未追加Live或更多来源请求。
