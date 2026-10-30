import json
from pathlib import Path
from urllib.parse import urlsplit,parse_qs
root=Path('.eval-artifacts/phase3b/g5-b1')
x=json.loads((root/'web.execution.json').read_text());assert x['mode']=='SYNTHETIC_LOCAL_CHROMIUM' and not x['baseline']
assert len(x['records'])==2 and x['unexpectedExternalRequests']==[] and x['pageErrors']==[]
for record in x['records']:
    assert not record['comparisonComplete'] and record['sourceSelection']=='UNKNOWN'
    assert not record['desktopOverflow'] and not record['mobileOverflow']
    link=record['links'][0];url=urlsplit(link['url']);query=parse_qs(url.query)
    if record['provider']=='TABELOG':
        assert link['text']=='Book on Tabelog' and url.netloc=='tabelog.com' and url.path=='/en/booking/form_course/new'
        assert query=={'rcd':['13123456'],'member':['2'],'visit_date':['20261102'],'visit_time':['1900']}
        assert 'Cancellations on the day cost 100%.' in record['text'] and 'Card required' in record['text']
    else:
        assert link['text']=='Book on TableCheck' and url.netloc=='www.tablecheck.com' and url.path=='/en/shops/fixture-sushi/reserve'
        assert query=={'start_date':['2026-11-02'],'start_time':['19:00'],'num_people':['2']}
        assert 'Check date and guests' in record['text'] and len(record['links'])==2
    assert 'date, time, 2 guests filled in' in record['text']
result={'status':'PASS','mode':'SYNTHETIC_LOCAL_CHROMIUM_CONTRACT_ONLY','providers':2,'sourceAndQueryOracle':'literal independent HTTPS origins, paths and parameter values; synthetic source text','notEvaluated':['current website behavior','live inventory','G1 translation/card semantic correctness','actual source selection','booking outcome','durable return feedback'],'newRealCalls':0}
(root/'web.evaluation.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
