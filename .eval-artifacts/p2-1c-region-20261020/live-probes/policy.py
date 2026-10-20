"""Five approved discovery diagnostics; scheduling never changes production decisions."""
from datetime import datetime

def epoch(value):return datetime.fromisoformat(value.replace('Z','+00:00')).timestamp()
def next_index(ledger):return next((i for i in range(5) if i not in ledger['completed']),None)
def not_before(ledger,index):
 prior=[a for a in ledger['attempts'] if a['index']==index]
 if len(prior)>=2:raise ValueError('RETRY_EXHAUSTED')
 if prior:
  if not prior[0].get('retrySignals'):raise ValueError('NO_ENVIRONMENT_RETRY_SIGNAL')
  return epoch(prior[0]['finishedAt'])+900
 return max((epoch(a['finishedAt']) for a in ledger['attempts']),default=0)+300

def retry_signals(directory,load):
 signals=[]
 for path in directory.glob('*.result.json'):
  data=load(path)
  if data.get('stage')=='NETWORK_READINESS':
   signals.extend({'kind':'NETWORK_HTTP','target':a.get('target'),'status':a['status'],'path':str(path)} for a in data.get('attempts',[]) if a.get('outcome')=='FAILED' and a.get('status') in [403,503,429])
 path=directory/'source-data-preflight.json'
 if path.exists():signals.extend({'kind':'SOURCE_DATA_HTTP','sourceId':a['sourceId'],'status':a['responseStatus'],'path':str(path)} for a in load(path).get('attempts',[]) if a.get('outcome')=='FAILED' and a.get('responseStatus') in [403,503,429])
 path=directory/'outer-environment-observations.jsonl'
 if path.exists():
  import json
  signals.extend(json.loads(line) for line in path.read_text().splitlines() if line.strip())
 return signals
