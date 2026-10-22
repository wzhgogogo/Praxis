"""Post-batch source comparison only; does not alter frozen helper or evaluator.

The recorder serializes URL origins with a root slash. The frozen helper's
literal origin comparison leaves those rows NOT_COMPARABLE. This sidecar uses
URI authority plus root-path validation and retains that original output.
"""
import copy
import hashlib
import json
import pathlib
import re
from urllib.parse import urlparse, parse_qs, urljoin

batch=pathlib.Path(__file__).resolve().parent
read=lambda p:json.loads(pathlib.Path(p).read_text())
sha=lambda p:hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
original=batch/'original-frozen-helper-audit.json'
data=read(original)
artifacts={}
for directory in (batch/'quick-live-results').glob('c-*-attempt-*'):
    files=list((directory/'runner').glob('*.result.json'))
    if files: artifacts[directory.name]=(files[0],read(files[0]))

def slots(body,row,sanitized):
    date=row['requestedDate'];party=row['requestedParty'];outlet=row['outletId']
    parts=body.get('base_date') or {}
    if [parts.get(k) for k in ['year','month','day']]!=list(map(int,date.split('-'))) or body.get('members')!=party:return None
    selection=body.get('selection')
    if not isinstance(selection,(dict,list)):return None
    entries=list(selection.values()) if isinstance(selection,dict) else selection
    if not entries:return None
    times=[]
    for item in entries:
        time=item.get('time')
        if not re.fullmatch(r'([01]\d|2[0-3]):[0-5]\d',time or ''):return None
        if sanitized:
            link=item.get('link') or {};origin=urlparse(link.get('origin',''))
            if origin.scheme!='https' or origin.netloc!='tabelog.com' or origin.path not in ['', '/'] or origin.query or origin.fragment:return None
            path=link.get('pathname');q=link
        else:
            u=urlparse(urljoin('https://tabelog.com',item.get('url','')))
            if u.scheme!='https' or u.netloc!='tabelog.com':return None
            path=u.path;q={k:v[0] if len(v)==1 else None for k,v in parse_qs(u.query).items()}
        expected=dict(rcd=outlet,member=str(party),visit_date=date.replace('-',''),visit_time=time.replace(':',''))
        if path!='/en/booking/form_course/new' or any(q.get(k)!=v for k,v in expected.items()):return None
        times.append(time)
    return sorted(set(times))

rows=[]
for source in data['rows']:
    row=copy.deepcopy(source);artifact_path,artifact=artifacts[row['runId']]
    semantic=artifact['materializedCase']['semantic'];state=artifact['finalSnapshot']['domainState']
    candidate=next((c['restaurant']['id'] for c in state['candidates'] if c['restaurant']['id'].endswith('/'+row['outletId'])),None)
    valid=[]
    for observation in row['observations']:
        response=observation.get('response') or {}
        parsed=slots(response.get('body',{}),row,True) if observation['selection']['confirmed'] and response.get('status')==200 else None
        if parsed is not None:valid.append((observation,parsed))
    representative,parsed=valid[-1] if valid else (row.get('latest'),None)
    post=row.get('postGet');post_slots=None;post_valid=False
    if post:
        raw=pathlib.Path(post['bodyPath']);q=parse_qs(urlparse(post['url']).query)
        expected=dict(rst_id=[row['outletId']],svd=[row['requestedDate'].replace('-','')],svps=[str(row['requestedParty'])],svt=[semantic['time']['value'].replace(':','')])
        post_valid=sha(raw)==post['sha256'] and post['method']=='GET' and post['status']==200 and q==expected
        if post_valid:post_slots=slots(read(raw),row,False)
    comparison='NOT_COVERED' if not post else 'NOT_COMPARABLE' if parsed is None or post_slots is None else 'EXACT_MATCH' if parsed==post_slots else 'SUPPORTED_SUBSET' if set(parsed)<=set(post_slots) else 'MISMATCH'
    offers=state.get('availability',{}).get(candidate,[]) if candidate else []
    row.update(artifactPath=str(artifact_path),artifactSha256=sha(artifact_path),candidateId=candidate,
        selectedQueryConfirmedAtInventoryRead=representative['selection']['confirmed'] if representative else None,
        representativeObservation=representative,runtimeResponseParsedTimes=parsed,postGetSlots=post_slots,
        postGetValidated=post_valid,comparison=comparison,originalFrozenHelperComparison=source['comparison'],
        productionReportedOffers=[{k:o.get(k) for k in ['id','dateTime','partySize','checkedAt']} for o in offers],
        productionAvailabilityCheck=state.get('availabilityChecks',{}).get(candidate),
        displayed=candidate in state.get('presentedResults',{}).get('candidateIds',[]),
        fullTimelineRetained=True)
    rows.append(row)

counts={s:sum(r['comparison']==s for r in rows) for s in ['EXACT_MATCH','SUPPORTED_SUBSET','MISMATCH','NOT_COVERED','NOT_COMPARABLE']}
output={'mode':'POST_BATCH_INDEPENDENT_SOURCE_COMPARISON_SUPPLEMENT','sourceRequests':0,'modelCalls':0,
 'frozenHelperChanged':False,'evaluatorChanged':False,'outcomesRescored':False,'inputPath':str(original),'inputSha256':sha(original),
 'method':'Parse serialized origin URI; allow HTTPS tabelog.com with empty/root path and no query/fragment. All merchant/date/party/time fields remain exact. Empty selection remains unbound.',
 'limits':'Representative is latest valid inventory-read observation, not a claim about later fact-page defaults; complete later timeline retained. Later independent GET does not reconstruct runtime data. Missing GET coverage remains NOT_COVERED.',
 'outlets':len(rows),'selected':sum(r['selectedQueryConfirmedAtInventoryRead'] is True for r in rows),'captured':sum(r['capturedFindVacancy'] for r in rows),'comparisons':counts,'rows':rows}
(batch/'quick-outlet-comparison.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
lines=['# Per-outlet runtime response and independent GET comparison','','Post-batch supplement; original frozen helper/evaluator and outcomes unchanged. Full response slots and timelines are in JSON.','','| Run | Outlet | Selected at read | Captured | base_date / members | Parsed response times | Production offers | Independent GET |','| --- | --- | --- | --- | --- | --- | --- | --- |']
for r in rows:
    x=r['representativeObservation'] or {};offers=[o['dateTime'] for o in r['productionReportedOffers']]
    values=[r['runId'],r['outletName'],r['selectedQueryConfirmedAtInventoryRead'],r['capturedFindVacancy'],str(x.get('base_date'))+' / '+str(x.get('members')),r['runtimeResponseParsedTimes'],offers,r['comparison']]
    lines.append('| '+' | '.join(str(v) for v in values)+' |')
(batch/'quick-outlet-comparison.md').write_text('\n'.join(lines)+'\n')
print(json.dumps({'outlets':len(rows),'selected':output['selected'],'captured':output['captured'],'comparisons':counts}))
