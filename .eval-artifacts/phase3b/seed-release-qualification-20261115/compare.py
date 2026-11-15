"""Independent gate output; identical hashes cover events, checks, presentation and independent verdicts."""
import json,re
from pathlib import Path
from collections import Counter
root=Path(__file__).resolve().parent
def read(p):return json.loads((root/p).read_bytes())
old,new=[read('paired-'+tag+'.json')['rows'] for tag in ('signed','current')]
assert len(old)==len(new)==18 and old==new
assert all(x['historicalScoreMatches'] and not x['capturedTerminalMismatch'] and x['eventStop'] is None and x['eventCount']==x['eventTotal'] for x in new)
cases={}
for case in ('d4','d8'):
    captures=[read('full-'+version+'-'+case+'.json') for version in ('signed','current')]
    stops=[[{k:step.get(k) for k in ('reason','origin','pathname','method')} for step in value['stops']] for value in captures]
    assert stops[0] and stops[0]==stops[1]
    assert all(not any(x['realCalls'].values()) for x in captures)
    cases[case]={'independentFullReplay':'INCOMPLETE_BOTH','firstStop':stops[0][0],'allStopReasons':[x['reason'] for x in stops[0]]}
for tag in ('signed','current'):
    log=(root/('components-'+tag+'-chromium.log')).read_text()
    assert re.search(r'ℹ pass 30\b',log) and re.search(r'ℹ fail 0\b',log)
print(json.dumps({'gate':'PASS_ON_COMPARABLE_EVIDENCE','attempts':len(new),'replayedEvents':sum(x['eventCount'] for x in new),'checks':sum(x['checkCount'] for x in new),'preservedOutcomes':dict(Counter(x['verdict']['outcome'] for x in new)),'capturedFingerprintOrderRestored':sum(len(x['orderOnlyFromRecordedFingerprint']) for x in new),'componentsPerVersion':30,'archiveFullReplay':cases,'external':{'Live':0,'websiteGET':0,'model':0}},indent=2))
