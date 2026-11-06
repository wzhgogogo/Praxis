# Offline component stability diagnostic, not end-to-end acceptance. No retries.
import subprocess,pathlib,json,time,os,datetime
root=pathlib.Path('.eval-artifacts/phase3b/search-stability-20261106')
source='.eval-artifacts/phase3b/observed-read-provenance-20261105/budget-approved-continuation/live/runs/D4/D4/recordings/g6-D4-1793928719238-0'
rows=[]
resume=int(os.environ.get('STABILITY_RESUME_SNAPSHOT','0'))
sha=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
for variant in (['SNAPSHOT'] if resume else ['NONE','SNAPSHOT']):
 for n in range(resume or 1,21):
  name=f'{variant.lower()}-{n:02d}';output=root/(name+'.json');assert not output.exists();start=time.monotonic();error=None
  stamp=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).isoformat()
  try:
   with (root/(name+'.log')).open('w') as log:
    process=subprocess.run(['node','--import','tsx','src/eval/restaurant/agent-loop/runners/run-d4-search-stall-replay.ts',source,str(output),'RECORDED_FETCH',variant],env={**os.environ,'D4_REPLAY_DOCUMENT':'snapshot-0001.html'},stdout=log,stderr=subprocess.STDOUT,timeout=70)
   if process.returncode: error={'outerExitCode':process.returncode}
  except subprocess.TimeoutExpired: error={'outer':'70s diagnostic watchdog'}
  data=json.loads(output.read_text()) if output.exists() else {}
  receipts=[e['detail']['receipt'] for e in data.get('trace',[]) if e['kind']=='FORM_EVIDENCE' and e['detail'].get('stage')=='SUBMISSION_RECEIPT' and e['detail'].get('receipt')]
  forwarded=any(f['url']==r['actionOrigin']+r['actionPathname'] and f['method']=='GET' for f in data.get('fetches',[]) for r in receipts)
  click=[e['detail'] for e in data.get('trace',[]) if e['kind']=='FORM_EVIDENCE' and e['detail'].get('stage')=='CLICK' and e['detail'].get('phase') in ['END','ERROR']]
  passed=not error and not data.get('error') and len(receipts)==1 and forwarded and bool(click) and click[-1]['phase']=='END' and (variant=='NONE' or data.get('competitionResult',{}).get('startedAt') is not None and data.get('competitionResult',{}).get('finishedAt') is not None)
  row={'name':name,'sourceSHA':sha,'startedAtCET':stamp,'elapsedMs':(time.monotonic()-start)*1000,'clickMs':click[-1]['elapsedMs'] if click else None,'clickTerminal':click[-1]['phase'] if click else None,'formReceiptCount':len(receipts),'forwardedToArchive':forwarded,'missingResponse':data.get('misses',[]),'concurrentSnapshot':data.get('competitionResult'),'error':error or data.get('error'),'passed':passed}
  rows.append(row);(root/('continuation-results.json' if resume else 'results.json')).write_text(json.dumps({'plannedOriginal':20,'plannedSnapshotCompetition':20,'stopOnFirstFailure':True,'websiteGET':0,'Google':0,'model':0,'Live':0,'rows':rows,'stopped':not passed},ensure_ascii=False,indent=2)+'\n');print(json.dumps(row,ensure_ascii=False),flush=True)
  if not passed: raise SystemExit(2)
