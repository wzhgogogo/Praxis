from pathlib import Path
import json,re,hashlib,statistics
out=Path(__file__).resolve().parent
raw=json.loads((out/'gates.json').read_text())
rows=[]
for r in raw['runs']:
 log=out/r['log'];text=log.read_text()
 assert hashlib.sha256(log.read_bytes()).hexdigest()==r['logSha256']
 summary={k:int(v) for k,v in re.findall(r'^(?:#|ℹ)\s+(tests|suites|pass|fail|cancelled|skipped|todo)\s+(\d+)\s*$',text,re.M)}
 rows.append({**r,'summary':summary})
medians={gate:statistics.median([r['elapsedSeconds'] for r in rows if r['gate']==gate]) if len([r for r in rows if r['gate']==gate])==3 else None for gate in ['npm-test','browser-fixture']}
result={'source':'gates.json + byte-verified raw command logs','runs':rows,'medians':medians,'completed':len(rows)==9 and all(r['exitCode']==0 for r in rows)}
(out/'gate-summary.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'completed':result['completed'],'runs':[{k:r[k] for k in ['gate','sample','exitCode','elapsedSeconds','summary']} for r in rows],'medians':medians},indent=2))
