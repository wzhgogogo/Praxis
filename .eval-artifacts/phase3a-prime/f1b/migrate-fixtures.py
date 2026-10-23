"""One-time F1b relocation from the observed reads, not a runtime dependency."""
from pathlib import Path
import datetime,gzip,hashlib,json,re,subprocess
from zoneinfo import ZoneInfo
root=Path(__file__).resolve().parents[3]
observed=Path('/private/tmp/praxis-f1b-product-reads.jsonl')
module_by_test={
 'restaurant-presentation-evidence.test.ts':'src/application/fixtures/restaurant-presentation-evidence',
 'tabelog-browser-availability.test.ts':'src/integrations/tabelog/fixtures/availability',
 'directory-region-selection.test.ts':'src/integrations/restaurant-search/fixtures',
 'native-restaurant-search.test.ts':'src/integrations/restaurant-search/fixtures',
}
reads={}
for line in observed.read_text().splitlines():
 row=json.loads(line);test=Path(row['test']).name;p=Path(row['path']);p=p if p.is_absolute() else root/p
 reads.setdefault(module_by_test[test],set()).add(p.relative_to(root).as_posix())
overrides={}
busy=json.loads((root/'.eval-artifacts/p2-2-selection-20261019/followup/busy-inputs/manifest.json').read_text())
for row in busy['inputs']:
 for snapshot in row['snapshots']:
  epoch=re.search(r'hybrid-(\d{13})',snapshot['originalPath'])
  original=json.loads(gzip.decompress((root/row['result']).read_bytes()))
  sequence=int(re.search(r'snapshot-(\d+)',snapshot['originalPath'])[1])
  snapshots=[t for t in original['diagnostics']['browserTrace'] if t['kind']=='SNAPSHOT']
  trace=snapshots[sequence-1]
  overrides[snapshot['html']]={'sourceUrls':[trace['detail']['url']], 'capturedDate':datetime.datetime.fromtimestamp(int(epoch[1])/1000,datetime.timezone.utc).date().isoformat(), 'captureDateBasis':'original recording run-id epoch UTC; original path retained as provenance only', 'originalCapturedPath':snapshot['originalPath']}
for row in json.loads((root/'.eval-artifacts/p2-2-selection-20261019/followup/region-inputs/manifest.json').read_text()):
 overrides[row['fragment']]={'sourceUrls':[row['url']], 'capturedDate':'2026-10-19','captureDateBasis':'original checkpoint-a-dom-20261019 capture/decision log', 'sourceProjection':row['projection'], 'originalCapturedPath':row['source']}
base=root/'.eval-artifacts/checkpoint-c-live-20261020/c18-offline-reassessment-20261022'
for row in json.loads((base/'hard-evidence.json').read_text())['runs']:
 for snap in row.get('snapshots',[]):
  path=(base/snap['path']).resolve()
  overrides[path.relative_to(root).as_posix()]={'sourceUrls':[snap['sourceUrl']],'capturedDate':snap['observedAt'][:10],'captureDateBasis':'hard-evidence observedAt binding to original snapshot SHA'}
ledger=[]
for module,paths in sorted(reads.items()):
 mapping={p:p.removeprefix('.eval-artifacts/')+('.gz' if module.startswith('src/application/') and p.endswith('.json') and (root/p).stat().st_size>2_000_000 else '') for p in paths}
 def relocate(value):
  if isinstance(value,str):
   if value in mapping:return mapping[value]
   if value.startswith('.eval-artifacts/'):return value.removeprefix('.eval-artifacts/')
   return value
  if isinstance(value,list):return [relocate(v) for v in value]
  if isinstance(value,dict):return {k:relocate(v) for k,v in value.items()}
  return value
 for source in sorted(paths):
  raw=(root/source).read_bytes();target=root/module/mapping[source];target.parent.mkdir(parents=True,exist_ok=True)
  projected=Path(source).name in ['manifest.json','inputs.json','c18-inputs.json','hard-evidence.json']
  content=(json.dumps(relocate(json.loads(raw)),ensure_ascii=False,indent=2)+'\n').encode() if projected else raw
  target.write_bytes(gzip.compress(content,mtime=0) if target.suffix=='.gz' and not source.endswith('.gz') else content)
  # Prefer timestamps actually stored in the source; a directory date is only
  # a documented fallback, not an invented exact capture time.
  text=raw.decode(errors='replace')
  times=re.findall(r'"(?:startedAt|observedAt|capturedAt|occurredAt)"\s*:\s*"(2026-\d\d-\d\dT[^" ]+)"',text)
  epoch=re.search(r'hybrid-(\d{13})',source)
  dates=re.findall(r'(?<!\d)(2026\d{4})(?!\d)',source)
  date=times[0][:10] if times else datetime.datetime.fromtimestamp(int(epoch[1])/1000,datetime.timezone.utc).date().isoformat() if epoch else f'{dates[-1][:4]}-{dates[-1][4:6]}-{dates[-1][6:]}'
  urls=sorted(set(re.findall(r'https://(?:tabelog\.com|www\.tablecheck\.com)/[^\s<>"\\]+',text)))
  record={'status':'frozen regression / exposed development evidence, not current website or clean holdout','sourceArtifact':source,'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root).decode().strip(),'sourceSha256':hashlib.sha256(raw).hexdigest(),'sourceUrls':urls[:20], 'capturedDate':date,'captureDateBasis':'first source timestamp; see raw artifact' if times else 'recording run-id epoch UTC' if epoch else 'source artifact directory date; exact capture time not retained','fixtureVersion':'F1b path-only index projection' if projected else 'F1b byte-preserving gzip' if target.suffix=='.gz' and not source.endswith('.gz') else 'exact committed source bytes','contentSha256':hashlib.sha256(content).hexdigest(),'storedSha256':hashlib.sha256(target.read_bytes()).hexdigest(),'fixture':target.relative_to(root).as_posix()}
  record.update(overrides.get(source,{}))
  if not record['sourceUrls']:record['sourceUrlNote']='See source artifact/index lineage; this is a record/index or Google response, not a standalone current merchant page.'
  target.with_name(target.name+'.provenance.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
  ledger.append(record)
 (root/module/'README.md').write_text('# Saved test inputs\n\nFrozen regression; exposed development evidence. Copied for offline product tests on 2026-10-24. Each input has an adjacent provenance file with original artifact, SHA and capture-date basis. Index files only relocate paths; other inputs retain exact source content (large JSON is gzip-compressed, with its uncompressed SHA retained). No runtime read of the eval archive is needed. These inputs do not demonstrate current website availability.\n')
(root/'.eval-artifacts/phase3a-prime/f1b/fixture-relocation.json').write_text(json.dumps({'at':datetime.datetime.now(ZoneInfo('Europe/Vienna')).isoformat(),'files':ledger},ensure_ascii=False,indent=2)+'\n')
print('relocated',len(ledger),'files; stored bytes',sum((root/x['fixture']).stat().st_size for x in ledger))
