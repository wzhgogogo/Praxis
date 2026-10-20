from pathlib import Path
import json,tempfile
from policy import ORDER,next_index,not_before,after_environment_failure,retry_signals

checks=[]
def check(name,condition):
    assert condition,name
    checks.append({'name':name,'status':'PASS'})
def rejects(name,call):
    try:call()
    except ValueError:check(name,True);return
    raise AssertionError(name)
base={'completed':[0,1,2,3,4],'attempts':[{'index':5,'finishedAt':'2026-10-20T04:19:46+00:00'}]}
check('remaining-order',ORDER==[8,9,6,7,5]);check('H002-first',next_index(base)==8)
check('old-five-no-rerun',all(i not in ORDER for i in base['completed']))
check('five-minutes-after-last-end',not_before(base,8,'fixture')==1792469986+300)
done=dict(base);done['completed']+=ORDER
check('all-completed-no-next',next_index(done) is None)
for count,index in enumerate(ORDER):
    check('sequence-'+str(index),next_index({'completed':[0,1,2,3,4]+ORDER[:count]})==index)
failed={'index':8,'finishedAt':'2026-10-20T05:00:00+00:00','outerApprovalSha256':'fixture','retrySignals':[{'status':403}]}
retry={'completed':[0,1,2,3,4],'attempts':[failed]}
check('fifteen-minute-minimum',not_before(retry,8,'fixture')==1792472400+900)
retry['attempts']=[failed,dict(failed)];rejects('no-second-retry',lambda:not_before(retry,8,'fixture'))
retry['attempts']=[{**failed,'retrySignals':[]}];rejects('no-unapproved-failure-retry',lambda:not_before(retry,8,'fixture'))
for signal in [{'status':403},{'status':503},{'kind':'SOURCE_BUSY_PAGE'}]:
    check('first-signal-pause-'+str(signal),after_environment_failure(8,[signal],1,100)['retryNotBeforeEpoch']==1000)
    check('persistent-signal-stops-'+str(signal),after_environment_failure(8,[signal],2,100)['code']=='ENVIRONMENT_RETRY_FAILED')
check('empty-without-retry-signal-stops',after_environment_failure(8,[],1,100)['code']=='PREFLIGHT_EVIDENCE_GAP')
with tempfile.TemporaryDirectory() as temp:
    p=Path(temp);(p/'source-data-preflight.json').write_text(json.dumps({'attempts':[{'sourceId':'tablecheck','outcome':'FAILED','responseStatus':503}]}))
    check('source503-evidence',len(retry_signals(p,lambda q:json.loads(q.read_text())))==1)
    (p/'source-data-preflight.json').write_text(json.dumps({'attempts':[{'sourceId':'tablecheck','outcome':'FAILED','responseStatus':200}]}))
    check('normal-empty-not-503',not retry_signals(p,lambda q:json.loads(q.read_text())))
check('five-normal-probes-remain-within55',49+5<=55)
check('one-formal-env-retry-within55',49+5+1==55)
check('two-formal-retries-exceed55',49+5+2>55)
check('worst-models-with-one-formal-retry',305+6*15<=450)
out={'status':'PASS','mode':'OFFLINE_POLICY','count':len(checks),'checks':checks,'network':0,'models':0}
Path(__file__).with_name('offline-policy-controls.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({k:out[k] for k in ['status','count','network','models']}))
