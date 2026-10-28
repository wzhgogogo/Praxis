# 无Tabelog/TableCheck直链的新样本清单（待Gold认证）

状态：draft / not integrated，不能运行收益对照。5个主样本、3个预先列明的备用样本；全部Google官网字段为自有站候选或社交页面，均未进入旧店名基准样本。Dengana是已暴露失败锚点，单列；其余4个主样本为新选对象，不冒充Clean Holdout。本文未填写或猜测Gold门店ID。

| ID | 角色 | Google原名 | 官网类别/地址 | 选择理由 | 第二次检索提案 |
| --- | --- | --- | --- | --- | --- |
| G4-ND-001 | PRIMARY | Dengana Akabane | OWN_WEBSITE_CANDIDATE / https://stores.dengana.jp/detail/3808/ | Historical exposed failure anchor; own chain website, no source-platform direct link | MODEL_FRAGMENT |
| G4-ND-002 | PRIMARY | Ushigoro Bambina Carbone Nakameguro | OWN_WEBSITE_CANDIDATE / https://ushigoro.com/hormone/ | Long Latin name with branch/place descriptors; own chain website | GOOGLE_JA |
| G4-ND-003 | PRIMARY | 和泉鮨南口店 | OWN_WEBSITE_CANDIDATE / http://izumizushi.com/izumi_minami.html | Japanese name with branch marker; own website; Shibuya | MODEL_FRAGMENT |
| G4-ND-004 | PRIMARY | Waragamo | OWN_WEBSITE_CANDIDATE / https://waragamo.jp/ | Short Latin name and own website; Kichijoji area | GOOGLE_JA |
| G4-ND-005 | PRIMARY | Sen Kagurazaka | SOCIAL / https://www.instagram.com/kagurazaka_washoku_sen%20%20%20%20%20%20https://washoku-sen.jp/layout.html | Social-only listed website and area-qualified Latin name | MODEL_FRAGMENT |
| G4-ND-006 | RESERVE | 吉祥じ 和こん | SOCIAL / https://www.instagram.com/kichijoji.wakon | Japanese social-only candidate; reserve, not automatically substituted | MODEL_FRAGMENT |
| G4-ND-007 | RESERVE | Washokubiyori Osaketo Kagrazaka | OWN_WEBSITE_CANDIDATE / https://www.osaketo-washoku.jp/shop/kagurazaka/ | Latin multiword own-website candidate; reserve | GOOGLE_JA |
| G4-ND-008 | RESERVE | Godaime Hanayama Udon Ginza | OWN_WEBSITE_CANDIDATE / http://www.hanayamaudon.co.jp/ginza/ | Latin cuisine/branch-name own-website candidate; reserve | GOOGLE_JA |

## 认证前停止

请复核者逐家认证原Google候选与来源门店：提供Tabelog（或明确另列的TableCheck）门店URL/ID、公开GET原文与SHA/时间、电话或完整地址（含门牌/建筑/楼层）证据、冲突和失效说明。Dengana历史见证仍需认证适用性；历史ID没有被注入检索输入。备用样本只有复核者明确指定后才能替换，最终五个主ID先冻结；不得因搜索结果不好临时换样本。

没有Tabelog直链仅指已保存Google.websiteUri不是来源平台直链，不证明自有站是否重定向、官网所有权或Tabelog是否收录。名单是有偏差的公开开发诊断，未来主要分母使用认证后的非直链主组；旧15例只作次级后备路径诊断，Dengana锚点单列。

## 预算内对照提案

复核认证最多8次公开GET（5主+3备），计入共享账本及本批35次上限；两次余量不自动使用。认证后：五主样本每家原Google全名1次＋一种替代1次，共10次；旧15例各1次替代，共15次，所有检索GET共25、每家最多2次检索。认证＋检索最多33≤35，仍受共享40限制。Google日文详情最多20（五主+旧15），按原Place ID读取，不重搜换店。真实模型计划上界79（24多轮逻辑turn+15开发turn各最多2次既有尝试，再1次有界检索片段批提议），硬上限100；Live0。

新五主有同一时间段的原名/替代配对，旧15没有新原名重采，只作历史对照，不能与主组混算提升率。若日文来源名与原名相同或片段无有效差别，按预先规则跳过重复GET，不把跳过算命中、不重新分配到新样本。正式冻结执行配置由认证后再完成；此处没有发起任何真实调用。

完整原文、电话、坐标、Google Place ID及来源文件SHA/记录位置见samples.proposed.json。候选池按Google ID且要求完整字段、另加入F5，与复核中298个不同URL的统计单位不同，不据此重新估计网站类型比例。
