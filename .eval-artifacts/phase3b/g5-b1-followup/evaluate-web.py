from pathlib import Path
import json
from urllib.parse import urlsplit,parse_qs
root=Path('.eval-artifacts/phase3b/g5-b1-followup');x=json.loads((root/'web.execution.json').read_text())
assert x['realSourceRequests']==0 and x['realModelCalls']==0 and not x['unexpectedExternalRequests'] and not x['pageErrors'] and len(x['records'])==2
for r in x['records']:
    assert r['sourceSelection']=='UNKNOWN' and r['claimQuestions']==1 and len(r['answers'])==1 and len(r['sourceNavigations'])==1 and not r['overflow']
    u=urlsplit(r['url']);q=parse_qs(u.query)
    if r['provider']=='TABELOG':
        assert u.netloc=='tabelog.com' and u.path=='/en/booking/form_course/new' and q=={'rcd':['13123456'],'member':['2'],'visit_date':['20261102'],'visit_time':['1900']}
        for text in ['Cancellation terms differ between the Japanese and English pages','前日キャンセルは50％、当日は100％です。','Japanese page: Cancellation costs 50%','English page: Same-day cancellation costs 100%','Confirm cancellation terms on the website','¥440 per guest']:assert text in r['text'],text
        assert r['answers'][0]['answer']=='YES'
    else:
        assert u.netloc=='www.tablecheck.com' and q=={'start_date':['2026-11-02'],'start_time':['19:00'],'num_people':['2']} and 'start_time=19%3A00' in r['url']
        assert '440' not in r['text'] and 'Check date and guests' in r['text'] and r['answers'][0]['answer']=='SKIP'
y={'status':'PASS','mode':x['mode'],'providers':2,'network':'All browser requests fulfilled/aborted locally. One user-gesture source navigation per provider is intercepted, never a website request.','oracle':'Independent literal URLs, parameters, bilingual quotations, notice and feedback enums. Persistent once-only guarantee is verified separately by actual HTTP/PGlite tests, not by the UI stub.','notEvaluated':['current source preselection (Live checklist only)','booking outcome','G1 model translation/conflict detection quality'],'newRealCalls':0}
(root/'web.evaluation.json').write_text(json.dumps(y,indent=2)+'\n');print(json.dumps(y))
