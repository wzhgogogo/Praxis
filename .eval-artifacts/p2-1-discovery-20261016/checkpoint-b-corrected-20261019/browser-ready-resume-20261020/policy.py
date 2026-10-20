"""Approved outer scheduling only; production discovery, inputs and scoring stay frozen."""
from datetime import datetime
ORDER=[8,9,6,7,5]
SPACING_SECONDS=300
RETRY_SECONDS=900

def epoch(value): return datetime.fromisoformat(value.replace('Z','+00:00')).timestamp()

def next_index(ledger):
    return next((i for i in ORDER if i not in ledger['completed']),None)

def not_before(ledger,index,approval_sha):
    own=[a for a in ledger['attempts'] if a.get('outerApprovalSha256')==approval_sha]
    prior=[a for a in own if a['index']==index]
    if len(prior)>=2: raise ValueError('RETRY_EXHAUSTED')
    if prior:
        if not prior[0].get('retrySignals'): raise ValueError('NO_APPROVED_RETRY_SIGNAL')
        return epoch(prior[0]['finishedAt'])+RETRY_SECONDS
    ended=[epoch(a['finishedAt']) for a in ledger['attempts'] if a.get('finishedAt')]
    return max(ended,default=0)+SPACING_SECONDS

def retry_signals(directory,load):
    signals=[]
    for path in directory.glob('*.result.json'):
        data=load(path)
        if data.get('stage')=='NETWORK_READINESS':
            signals.extend({'kind':'NETWORK_HTTP','target':a.get('target'),'status':a['status'],'path':str(path)}
                for a in data.get('attempts',[]) if a.get('outcome')=='FAILED' and a.get('status') in [403,503])
    path=directory/'source-data-preflight.json'
    if path.exists():
        signals.extend({'kind':'SOURCE_DATA_HTTP','sourceId':a['sourceId'],'status':a['responseStatus'],'path':str(path)}
            for a in load(path).get('attempts',[]) if a.get('outcome')=='FAILED' and a.get('responseStatus') in [403,503])
    path=directory/'outer-environment-observations.jsonl'
    if path.exists():
        import json
        signals.extend(json.loads(line) for line in path.read_text().splitlines() if line.strip())
    # Duplicated observations do not grant additional retries.
    return signals

def after_environment_failure(index,signals,attempt_number,finished_epoch):
    if signals and attempt_number==1:
        return {'code':'OUTER_ENV_RETRY_PENDING','index':index,'retryNotBeforeEpoch':finished_epoch+RETRY_SECONDS,'maxRetries':1}
    return {'code':'ENVIRONMENT_RETRY_FAILED' if signals else 'PREFLIGHT_EVIDENCE_GAP','index':index}
