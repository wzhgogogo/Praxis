from pathlib import Path
import json,hashlib,re,datetime
root=Path.cwd();catalog=[];primary=Path('/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def run_day(path):
 m=re.search(r'hybrid-(\d{13})',str(path))
 if m:return datetime.datetime.fromtimestamp(int(m[1])/1000,datetime.timezone.utc).date().isoformat()
 m=re.search(r'(20\d\d-\d\d-\d\d)T',str(path))
 if m:return m[1]
 p=Path(path)
 for parent in list(p.parents)[:5]:
  if not parent.exists():continue
  files=sorted(parent.glob('20*.started.json'))
  if files:return files[0].name[:10]
 raise ValueError('Capture day not found: '+str(path))
def add(fixture,url,day,basis,source,version,sourceHash=None):
 p=Path(fixture);sourcePath=Path(source);sourceExists=sourcePath.is_file();data={'schema':'saved-page-provenance@1','evidenceStatus':'frozen regression; exposed development source, not Clean Baseline','fixture':str(p),'fixtureSha256':sha(p),'sourceUrl':url,'capturedOn':day,'captureDateTimezone':'UTC' if 'run' in basis.lower() else 'Asia/Tokyo (capture directory date; exact time not retained)','captureDateBasis':basis,'sourceArtifact':source,'sourceArtifactSha256':sha(sourcePath) if sourceExists else sourceHash,'sourceArtifactAvailableInThisCheckout':sourceExists,'siteVersion':version,'retrievedAgain':False,'ageOn20261024Days':(datetime.date(2026,10,24)-datetime.date.fromisoformat(day)).days,'over30Days':(datetime.date(2026,10,24)-datetime.date.fromisoformat(day)).days>30}
 side=p.with_name(p.name+'.provenance.json');assert not side.exists();side.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');catalog.append({**data,'provenance':str(side)})
base='src/harness/browser/fixtures/'
old=[('tablecheck-search-control-20260929.html','tablecheck-lead-path-20260929/01.json','TableCheck 2026-09-29 public search combobox. Reduced DOM transcription; outer document, scripts and exact extraction offsets are not retained.'),('tablecheck-ginza-card-20260929.html','tablecheck-lead-path-20260929/06.json','TableCheck 2026-09-29 Ginza Iwa result card. Reduced DOM plus fixture layout CSS; not a byte-faithful full-page replay.'),('tabelog-teppen-calendar-20260929.html','tabelog-lead-teppen-20260929/02-teppen-production-ready.json','Tabelog Teppen 2026-09-29 calendar transcription; source-owned date/guest markup retained, scripts/layout supplied by individual tests.')]
for fixture,origin,version in old:
 source=primary/'.eval-artifacts'/origin;raw=json.loads(source.read_text());add(base+fixture,raw['url'],'2026-09-29','Date encoded in existing fixture and corroborating capture directory; git introduction 8d027f5d on 2026-09-30.',str(source),version)
for rec in json.loads(Path(base+'calendar-20261010.provenance.json').read_text()):
 add(rec['fixture'],rec['url'],run_day(rec['snapshot']),'Historical recording run-id epoch; capture-day precision only (not the requested booking date).',rec['snapshot'],rec['visibilityLimitation'],rec['snapshotSha256'])
sen=json.loads(Path(base+'tabelog-sen-no-slots-20261010.provenance.json').read_text());url='https://tabelog.com/en/tokyo/A1303/A130301/13275802/'
for fixture in ['tabelog-sen-no-slots-20261010.html','tabelog-sen-no-slots-20261010.snapshot.json']:
 add(base+fixture,url,run_day(sen['origin']),'Historical recording run-id epoch; capture-day precision only (not requested date 2026-10-22).',sen['origin'],'Original recorded no-slot page/projection; missing source CSS limits visibility conclusions.',sen['sha256'])
for rec in json.loads(Path('.eval-artifacts/p2-3-conditions-20261019/source-fixtures.json').read_text()):
 add(rec['fixturePath'],rec['sourceUrl'],run_day(rec['originalPath']),'Historical recording run-id epoch; capture-day precision, extracted on 2026-10-19.',rec['originalPath'],'Extracted merchant price/course regions from recorded HTML; not full page, not current menu/inventory.',rec['originalSha256'])
aloft=Path('.eval-artifacts/p2-3-conditions-20261019/aloft-public-capture/summary.json');raw=json.loads(aloft.read_text());add(base+'restaurant-prices/aloft-public-20261019.html',raw['result']['finalUrl'],raw['startedAt'][:10],'Existing public capture run startedAt (UTC).',str(aloft),'Public guide menu fragment, October 19; this source is not a reservation form or current inventory validation.')
recording=Path('.eval-artifacts/p2-1-discovery-20261016/baseline/p2-kagurazaka-kaiseki-20261029/attempt-2/recording/p2-kagurazaka-kaiseki-20261029/recording.json');raw=json.loads(recording.read_text());rec=next(r for r in raw['documents'] if r['snapshot']==2);source=recording.parent/rec['file'];add('src/integrations/tabelog/fixtures/empty-kaiseki.html',rec['url'],run_day(source),'Existing source-stage run started filename (UTC); snapshot2.',str(source),'Recorded zero-result region fragment; no reviews retained. Quoted search prose is not geographic evidence.')
cat=Path('.eval-artifacts/p2-1-discovery-20261016/p21a-dom-replay-20261019/categories/production-inventory.json');rec=json.loads(cat.read_text())['rows'][0]['extracted'][0];source=Path(rec['file']);add('src/integrations/tabelog/fixtures/p21-region-homepage-categories.html',rec['url'],run_day(source),'Existing corrected source-stage run started filename (UTC); category inventory snapshot5.',str(source),'Observed Shibuya homepage category links, extracted/wrapped as a bounded DOM fixture; dedup and foreign links are test additions.',rec['sha256'])
p=Path('src/integrations/tablecheck/fixtures/ginza-bistro-empty.json');rec=json.loads(p.read_text());add(str(p),rec['snapshot']['url'],run_day(rec['origin']['decisionPath']),'Historical run decision filename (UTC); decision13/snapshot21.',rec['origin']['decisionPath'],'Recorded TableCheck selected-query widget projection. A no-slot service category does not establish outlet-wide unavailability.',rec['origin']['htmlSha256'])
Path('.eval-artifacts/phase3a-prime/f1/page-catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
lines=['# 已保存站点页面 fixture 索引','','- Evidence status: frozen regression；已暴露开发页面，不是Clean Baseline。','- 检查日期：2026-10-24。只补来源，不更新页面、不访问网站。物理HTML/保存JSON原字节保持。','- `capturedOn` 是采集日；旧provenance中的请求日期不作为采集日期。精确时间未保留的标明日期精度与依据。','- 本表含13份HTML和2份保存的页面/控件JSON；其余合成内联HTML不是站点采集页，编译fixture不是页面。','- 每份页面旁的 `*.provenance.json` 记录URL、采集日、来源版本/投影限制及SHA。历史eval录制由原始recording/started/输入manifest按snapshot序号追溯，不复制原文或改写冻结清单。','','| fixture | 采集日 | 来源URL | provenance |','| --- | --- | --- | --- |']
index=Path('src/harness/browser/fixtures/PAGES.md')
import os
for r in catalog:
 target=os.path.relpath(r['fixture'],index.parent);prov=os.path.relpath(r['provenance'],index.parent);lines.append(f"| [{Path(r['fixture']).name}]({target}) | {r['capturedOn']} | {r['sourceUrl']} | [来源与版本]({prov}) |")
lines+=['','## 超过30天的页面','','无。最早采集日2026-09-29，至检查日25天；日期来自现有fixture/捕获目录及登记证据，没有重新采集。','','## 证明范围','','片段/DOM转录会明确标明裁剪、测试脚本和布局注入；不把合成控件补丁称为原始录制。不以旧页面证明当前网站结构、库存或可预约。']
index.write_text('\n'.join(lines)+'\n');print(json.dumps({'pages':len(catalog),'html':sum(r['fixture'].endswith('.html') for r in catalog),'olderThan30Days':sum(r['over30Days'] for r in catalog),'missingURLorDate':sum(not r['sourceUrl'] or not r['capturedOn'] for r in catalog)},indent=2))
