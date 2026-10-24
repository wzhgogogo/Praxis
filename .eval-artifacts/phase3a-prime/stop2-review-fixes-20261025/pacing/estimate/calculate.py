from pathlib import Path
import json
root=Path(__file__).resolve().parent;d=json.loads((root/'inputs.json').read_text())
def span(n,seconds):
 workers=[0.,0.]
 for _ in range(n):workers[workers.index(min(workers))]+=seconds
 return max(workers)
assert span(15,500)==4000
rows=[]
for s in d['scenarios']:
 old={o:sum(r.values())*(2*d['intervalSeconds']+d['assumedPeerResponseSeconds']) for o,r in s['requests'].items()}
 new={o:sum(v for k,v in r.items() if k!='static')*(2*d['intervalSeconds']+d['assumedPeerResponseSeconds']) for o,r in s['requests'].items()}
 def minutes(waits,n):return (span(n,min(500,s['baseLiveSeconds']+sum(waits.values()))+s['preflightSeconds'])+span(15,s['replaySeconds'])+d['fixedSeconds'])/60
 rows.append({'id':s['id'],'oldWaitSecondsByOrigin':old,'newWaitSecondsByOrigin':new,'savedWaitSecondsPerRun':sum(old.values())-sum(new.values()),'old15FreshMinutes':minutes(old,15),'new15FreshMinutes':minutes(new,15),'old6Live15ReplayMinutes':minutes(old,6),'new6Live15ReplayMinutes':minutes(new,6)})
(root/'estimate.json').write_text(json.dumps({'status':'ESTIMATE_ONLY_NOT_MEASURED','rows':rows,'calls':{'realModel':0,'google':0,'websites':0,'live':0}},indent=2)+'\n')
print(json.dumps(rows,indent=2))
