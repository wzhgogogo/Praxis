"""Audit saved observations only. No HTTP or model; never rewrite old labels."""
import json, pathlib, hashlib, re
ROOT=pathlib.Path('.eval-artifacts/phase2c-holdout/exit-live-20261023'); R=ROOT/'remaining-five-continuation-20261023'; D=ROOT/'evaluation-20261023'
def get(p):return json.loads(p.read_text())
def ref(p):return {'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
rows=[]
for a in get(R/'attempt-record-index.json')['attempts']:
 if a['runId'] not in ('h-01','h-13'):continue
 p=pathlib.Path(a['directory']); scanned=[];hits=[];observations=[];coverage={}
 # Every retained JSON/JSONL, raw text/HTML within this attempt. No later diagnostics borrowed.
 for f in sorted(p.rglob('*')):
  if not f.is_file() or f.suffix.lower() not in ('.json','.jsonl','.txt','.html'):continue
  text=f.read_text();scanned.append(ref(f));literal=[]
  for ln,line in enumerate(text.splitlines(),1):
   if 'search is unavailable' in line.lower():literal.append(ln)
  if literal:hits.append({**ref(f),'lines':literal,'kind':'RAW_LITERAL_MATCH'})
  if f.name.endswith('.decisions.jsonl'):
   for ln,line in enumerate(text.splitlines(),1):
    dec=json.loads(line);purpose=dec.get('purpose');coverage[purpose]=coverage.get(purpose,0)+1
    if purpose!='browser_read_decide':continue
    for m in dec.get('messages',[]):
     if m.get('role')!='user':continue
     try:ctx=json.loads(m['content'])
     except (ValueError,KeyError):continue
     obs=ctx.get('observation');serialized=json.dumps(obs,ensure_ascii=False)
     if 'search is unavailable' in serialized.lower():
      observations.append({**ref(f),'line':ln,'sequence':dec.get('sequence'),'at':dec.get('startedAt'),'observation':obs})
  if f.name=='outer-observations.jsonl':
   for ln,line in enumerate(text.splitlines(),1):
    o=json.loads(line)
    if 'search is unavailable' in str(o.get('quote','')).lower() and 'tablecheck.com' in o.get('url',''):
     observations.append({**ref(f),'line':ln,'at':o.get('at'), 'observation':o})
 finish=get(p/'finish.json');busy=bool(observations);formal=a['formalRunStarted'];killed=finish.get('killed');stderr=(p/'stderr.txt').read_text()
 if busy:classification='ENV_FAILURE';reason='Actual saved TableCheck Search is unavailable page; user adjudicates Guard false rejection. Generic event reason does not prove HTTP403.'
 elif formal and killed=='OUTER_DEADLINE':classification='CAPABILITY_FAILURE_TIMEOUT';reason='Formal full-run deadline reached with no retained Search is unavailable page. User rule: capability failure; original orchestration label preserved separately.'
 elif not formal and '--timeout-ms must be between 1 and 500000' in stderr:classification='CONFIGURATION_STARTUP_REJECTED';reason='Runner CLI rejected600000 above500000 before formal run; not a timeout or Guard ENV,0model/0Live.'
 elif not formal and 'SourceDataPreflightError' in stderr:classification='ENV_FAILURE_SOURCE_PREFLIGHT';reason='Tabelog source-data35s transport timeout before formal Runner; no TableCheck unavailable page, not a product/model full-run timeout. Existing source failure remains, not recast as Guard ENV.'
 else:raise RuntimeError('Unclassified attempt')
 rows.append({**{k:a[k] for k in ['runId','attempt','directory','startedAt','finishedAt','formalRunStarted','modelCallsCharged','originalOperationalClassification']},'adjudicatedClassification':classification,'reason':reason,'busyPageObserved':busy,'pageObservations':observations,'literalMatches':hits,'coverage':coverage,'scannedFiles':scanned,'finish':finish,'limits':'No result or saved full HTML after forced termination; absence means no match in all retained evidence, not proof about unsaved states. No inference from later diagnosis.', 'capabilityDenominator':'INCLUDED_FAILURE' if classification=='CAPABILITY_FAILURE_TIMEOUT' else 'NOT_A_CAPABILITY_TRIAL' if not formal else 'EXCLUDED_ENV'})
assert len(rows)==6
assert sum(r['busyPageObserved'] for r in rows)==1
assert sum(r['adjudicatedClassification']=='CAPABILITY_FAILURE_TIMEOUT' for r in rows)==3
result={'schema':'phase2c-six-attempt-trace-adjudication@1','authority':'Current user instruction: busy=>ENV Guard false rejection; no-busy full-run timeouts=>capability failure','attempts':rows,'counts':{k:sum(r['adjudicatedClassification']==k for r in rows) for k in sorted(set(r['adjudicatedClassification'] for r in rows))},'originalRecordsUnchanged':True,'newModels':0,'newNetwork':0,'newLive':0,'newEnvironmentReruns':0}
(D/'six-attempt-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'counts':result['counts'],'scannedFiles':sum(len(r['scannedFiles']) for r in rows),'busyPageAttempts':[(r['runId'],r['attempt']) for r in rows if r['busyPageObserved']]}))
