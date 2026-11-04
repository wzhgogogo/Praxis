"""Offline observations only, never scores or production decisions."""
import collections,json,math
from datetime import datetime
from zoneinfo import ZoneInfo
from urllib.parse import urlsplit

def summarize(events, diagnostics):
    failures=[e for e in diagnostics if e.get('event') in ['OPERATION_FAILED','SESSION_OPEN_FAILED','MODEL_DECISION_FAILED'] and e.get('lifecycle',{}).get('failureCode')]
    codes=collections.Counter(e['lifecycle']['failureCode'] for e in failures)
    navs=[e['detail'] for e in events if e['kind']=='NAVIGATION_START' and e['detail'].get('method')=='GOTO']
    paths=collections.Counter(d.get('url','UNKNOWN') for d in navs)
    def entrance(url):
        u=urlsplit(url)
        return (u.hostname=='tabelog.com' and (u.path.endswith('/rstLst/') or u.path in ['/en/tokyo/','/en/'])) or (u.hostname=='www.tablecheck.com' and u.path.rstrip('/')=='/en/japan/search')
    ended=[e['detail'] for e in events if e['kind']=='NETWORK_REQUEST_END']
    timed=[d for d in ended if d.get('endObservation')=='CDP_NETWORK_TERMINAL' and isinstance(d.get('browserElapsedMs'),(int,float)) and math.isfinite(d['browserElapsedMs'])]
    transports=[e['detail'] for e in events if e['kind']=='GUARD_TRANSPORT_END' and e['detail'].get('outcome') in ['RESPONSE_AVAILABLE','FAILED'] and isinstance(e['detail'].get('elapsedMs'),(int,float))]
    keys=['requestId','navigationId','url','urlSha256','resourceType','status','outcome','endReason','browserElapsedMs','endObservation']
    def top(rows,field,keys):return [{k:d[k] for k in keys if k in d} for d in sorted(rows,key=lambda d:d[field],reverse=True)[:5]]
    return {'failureCodes':{'BROWSER_TIMEOUT':codes['BROWSER_TIMEOUT'],'BROWSER_BUDGET_EXHAUSTED':codes['BROWSER_BUDGET_EXHAUSTED']},'failureCountBasis':'one executor failure diagnostic, excluding provider/close repetitions; not distinct physical network errors',
      'failureEvents':failures,'sourceSearchEntryNavigationCount':sum(entrance(d.get('url','')) for d in navs),
      'searchEntryDefinition':'Explicit GOTO to observed Tabelog rstLst or /en/tokyo/ or /en/; TableCheck /en/japan/search. Region OPEN_LINK and document redirects are separate, never counted twice.',
      'explicitNavigationCount':len(navs),'navigationsByOriginPath':dict(paths),'discoveryNavigateOperations':sum(e.get('stage')=='DISCOVERY' and e.get('event')=='OPERATION_STARTED' and e.get('operation')=='NAVIGATE' for e in diagnostics),
      'slowestBrowserRequests':top(timed,'browserElapsedMs',keys),'browserRequestsWithoutWireEnd':sum(d.get('browserEndedAt') is None for d in ended),
      'slowestGuardTransports':top(transports,'elapsedMs',['transportId','navigationId','url','urlSha256','resourceType','status','outcome','elapsedMs']),
      'timingCaution':'CDP browser elapsed and Guard API duration are independent observation points, not added as requests or called physical TTFB; cancelled requests with unknown wire end excluded from slowest completed list.'}

def request_summary(slot,events):
    diagnostics=json.loads((slot/'browser-diagnostics.json').read_text())['events']
    result=summarize(events,diagnostics)
    budgets=json.loads((slot/'boundary-observation.json').read_text())['turnBudgets']
    at=budgets[0]['startedAtMs']/1000
    jst=datetime.fromtimestamp(at,ZoneInfo('Asia/Tokyo'))
    result.update({'initialTurnJST':jst.isoformat(),'initialTurnCET':datetime.fromtimestamp(at,ZoneInfo('Europe/Vienna')).isoformat(),'peak19to23JST':19<=jst.hour<23})
    return result

if __name__=='__main__':
    # LOCAL_CONSTRUCTION, no browser/site replay or network call.
    diagnostics=[{'event':'OPERATION_FAILED','lifecycle':{'failureCode':'BROWSER_TIMEOUT'}},{'event':'PROVIDER_FINISHED','lifecycle':{'failureCode':'BROWSER_TIMEOUT'}},{'event':'OPERATION_FAILED','lifecycle':{'failureCode':'BROWSER_BUDGET_EXHAUSTED'}}]
    events=[{'kind':'NETWORK_REQUEST_END','detail':{'requestId':'cancelled','browserElapsedMs':99999,'browserEndedAt':None,'endObservation':'LIFECYCLE_CANCELLATION_NOT_WIRE_FINISH'}},{'kind':'NETWORK_REQUEST_END','detail':{'requestId':'finished','browserElapsedMs':42,'browserEndedAt':'known','endObservation':'CDP_NETWORK_TERMINAL'}},{'kind':'NAVIGATION_START','detail':{'method':'GOTO','url':'https://tabelog.com/en/tokyo/rstLst/'}},{'kind':'NAVIGATION_START','detail':{'method':'IMPLICIT_DOCUMENT','url':'https://tabelog.com/en/tokyo/rstLst/'}}]
    result=summarize(events,diagnostics)
    assert result['failureCodes']=={'BROWSER_TIMEOUT':1,'BROWSER_BUDGET_EXHAUSTED':1}
    assert result['sourceSearchEntryNavigationCount']==1 and result['explicitNavigationCount']==1
    assert result['slowestBrowserRequests'][0]['requestId']=='finished' and result['browserRequestsWithoutWireEnd']==1
    assert not result['slowestGuardTransports']
    print('LOCAL_CONSTRUCTION metrics controls PASS: counts, no duplicate provider failure, no implicit redirect double-count, no cancelled wire finish invented')
