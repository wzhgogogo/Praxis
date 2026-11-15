# Tabelog 当前分流检查
2026-11-15 CET。只读检查，冻结源码a66a2edc，脚本冻结bbd98d9511264be860ca3dcdcebeeb2fc9977c53。

当前运行规则将domain:tabelog.com与domain:tblg.k-img.com都送direct，cdn0.tablecheck.com单独proxy，tablecheck.com/net则为domain级direct。

沿原createG6LiveBrowser、Guard和发现准入读取https://tabelog.com/en/一次。20,003ms窗口到期，没有捕获到主文档或commons.js的完整响应。结果为SCRIPT_NOT_COMPLETE_WITHIN_20S，不能签收Tabelog连通，也没有本次HTTP403的证据。此探查只保存完整响应状态；缺少响应头和导航错误细节，不能凭本次定位为DNS、连接、正文下载或CDN中的哪一段。

当前CDN也在直连规则中。若保持此前用户期望的“主站直连、tblg.k-img.com代理”，需要将CDN从direct规则移到proxy规则；当前配置未实现这项分流。因为此次尚未捕获主文档，不能据此认定本次超时由CDN引起。

实际消耗0Live/1评估页面GET/0模型，未重试。产品、原账本和代理规则未由本次检查改动。
