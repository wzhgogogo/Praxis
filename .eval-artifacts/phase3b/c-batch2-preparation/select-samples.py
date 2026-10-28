"""Freeze a proposed list for reviewer certification; no Gold or queries are executed."""
from pathlib import Path
import hashlib,json

root=Path('.eval-artifacts/phase3b/c-batch2-preparation')
pool=json.loads((root/'candidate-pool.json').read_text());byid={r['googlePlaceId']:r for r in pool['candidates']}
selection=[
 ('PRIMARY','ChIJS6d3Oh2TGGARLB5lQglBM1w','Dengana Akabane','MODEL_FRAGMENT','Historical exposed failure anchor; own chain website, no source-platform direct link'),
 ('PRIMARY','ChIJ0UKuqUmLGGAROsX4_lo24us','Ushigoro Bambina Carbone Nakameguro','GOOGLE_JA','Long Latin name with branch/place descriptors; own chain website'),
 ('PRIMARY','ChIJ7TXbt1eLGGAR-Q4sYu55H0w','和泉鮨南口店','MODEL_FRAGMENT','Japanese name with branch marker; own website; Shibuya'),
 ('PRIMARY','ChIJ1WEJ8DjuGGARNSztZh-1Bmo','Waragamo','GOOGLE_JA','Short Latin name and own website; Kichijoji area'),
 ('PRIMARY','ChIJjdT5wlqMGGARJtJeEFb-pqg','Sen Kagurazaka','MODEL_FRAGMENT','Social-only listed website and area-qualified Latin name'),
 ('RESERVE','ChIJDXuo9d_vGGARwSHi6ABWYEY','吉祥じ 和こん','MODEL_FRAGMENT','Japanese social-only candidate; reserve, not automatically substituted'),
 ('RESERVE','ChIJ1wRBvtKNGGARP47nK0oldpA','Washokubiyori Osaketo Kagrazaka','GOOGLE_JA','Latin multiword own-website candidate; reserve'),
 ('RESERVE','ChIJ3Q5zleCLGGARnuvHr-FOgMM','Godaime Hanayama Udon Ginza','GOOGLE_JA','Latin cuisine/branch-name own-website candidate; reserve'),
]
samples=[]
for index,(role,pid,name,method,reason) in enumerate(selection,1):
    row=byid[pid];assert row['subject']['name']==name and not row['inOldNameResolutionSamples']
    assert row['websiteCategory'] in ['OWN_WEBSITE_CANDIDATE','SOCIAL']
    assert not any(p.startswith('.eval-private/') for p in [r['path'] for r in row['provenance']])
    samples.append({'id':f'G4-ND-{index:03}','role':role,'goldStatus':'AWAITING_REVIEWER_CERTIFICATION',
                    'historicalDenganaAnchor':index==1,'plannedSecondSearchVariant':method,'selectionReason':reason,
                    'googlePlaceId':pid,'subject':row['subject'],'googleWebsiteUri':row['googleWebsiteUri'],
                    'websiteCategory':row['websiteCategory'],'nameScript':row['nameScript'],'provenance':row['provenance']})
assert len(samples)==8 and sum(s['role']=='PRIMARY' for s in samples)==5
result={'schema':'phase3b-g4-no-direct-sample-proposal@1','status':'DRAFT_NOT_EXECUTABLE_PENDING_REVIEWER_GOLD',
        'evidenceStatus':'Exposed saved Google inputs; newly selected benchmark objects, not Clean Holdout',
        'primary':5,'reserves':3,'knownHistoricalAnchor':1,'novelPrimaryObjects':4,
        'selection':'Manual stratification independent of unknown source-search outcomes; stable Google IDs, own/social links, five areas, English/Japanese/branch names',
        'poolSha256':hashlib.sha256((root/'candidate-pool.json').read_bytes()).hexdigest(),
        'certification':'Reviewer must provide same-outlet source URL/id, raw public response SHA/time and phone/full-address evidence; no name-only Gold. No substitutions or comparison until final IDs are certified/frozen.',
        'budgetPlan':{'certificationPublicGETMaximum':8,'searchComparisonGETMaximum':25,'combinedMaximum':33,'approvedBatchGETMaximum':35,'approvedSharedGETMaximum':40,'googleDetailsMaximum':20,'approvedBatchGoogleMaximum':35,'realModelMaximum':100,'fullLive':0},
        'samples':samples}
(root/'samples.proposed.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
text='''# 无Tabelog/TableCheck直链的新样本清单（待Gold认证）

状态：draft / not integrated，不能运行收益对照。5个主样本、3个预先列明的备用样本；全部Google官网字段为自有站候选或社交页面，均未进入旧店名基准样本。Dengana是已暴露失败锚点，单列；其余4个主样本为新选对象，不冒充Clean Holdout。本文未填写或猜测Gold门店ID。

| ID | 角色 | Google原名 | 官网类别/地址 | 选择理由 | 第二次检索提案 |
| --- | --- | --- | --- | --- | --- |
'''
for s in samples:text+=f"| {s['id']} | {s['role']} | {s['subject']['name']} | {s['websiteCategory']} / {s['googleWebsiteUri']} | {s['selectionReason']} | {s['plannedSecondSearchVariant']} |\n"
text+='''
## 认证前停止

请复核者逐家认证原Google候选与来源门店：提供Tabelog（或明确另列的TableCheck）门店URL/ID、公开GET原文与SHA/时间、电话或完整地址（含门牌/建筑/楼层）证据、冲突和失效说明。Dengana历史见证仍需认证适用性；历史ID没有被注入检索输入。备用样本只有复核者明确指定后才能替换，最终五个主ID先冻结；不得因搜索结果不好临时换样本。

没有Tabelog直链仅指已保存Google.websiteUri不是来源平台直链，不证明自有站是否重定向、官网所有权或Tabelog是否收录。名单是有偏差的公开开发诊断，未来主要分母使用认证后的非直链主组；旧15例只作次级后备路径诊断，Dengana锚点单列。

## 预算内对照提案

复核认证最多8次公开GET（5主+3备），计入共享账本及本批35次上限；两次余量不自动使用。认证后：五主样本每家原Google全名1次＋一种替代1次，共10次；旧15例各1次替代，共15次，所有检索GET共25、每家最多2次检索。认证＋检索最多33≤35，仍受共享40限制。Google日文详情最多20（五主+旧15），按原Place ID读取，不重搜换店。真实模型计划上界79（24多轮逻辑turn+15开发turn各最多2次既有尝试，再1次有界检索片段批提议），硬上限100；Live0。

新五主有同一时间段的原名/替代配对，旧15没有新原名重采，只作历史对照，不能与主组混算提升率。若日文来源名与原名相同或片段无有效差别，按预先规则跳过重复GET，不把跳过算命中、不重新分配到新样本。正式冻结执行配置由认证后再完成；此处没有发起任何真实调用。

完整原文、电话、坐标、Google Place ID及来源文件SHA/记录位置见samples.proposed.json。候选池按Google ID且要求完整字段、另加入F5，与复核中298个不同URL的统计单位不同，不据此重新估计网站类型比例。
'''
(root/'samples.proposed.md').write_text(text)
print('Proposed5 primary +3 reserves; stopped before reviewer Gold certification and any real calls.')
