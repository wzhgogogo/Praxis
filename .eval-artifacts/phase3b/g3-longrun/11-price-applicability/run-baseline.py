from pathlib import Path
import hashlib,json,subprocess,os,sys,time,gzip
root=Path.cwd();item=Path(__file__).resolve().parent;out=Path(sys.argv[1]).resolve()
assert not out.is_relative_to(root);out.mkdir(exist_ok=False)
git=lambda *a:subprocess.check_output(['git',*a],text=True)
freeze=json.loads((item/'input-freeze-baseline.json').read_text())
for name,sha in freeze['files'].items():assert hashlib.sha256((root/name).read_bytes()).hexdigest()==sha,name
assert not git('status','--porcelain')
env=os.environ.copy();env['PRAXIS_HARD_CAPTURE']=str(out/'actual-condition-calls.jsonl')
env['NODE_OPTIONS']='--import '+str(item/'capture-conditions.mjs')
t=time.monotonic();r=subprocess.run(['npm','test'],env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=240)
(out/'default.log').write_bytes(r.stdout);assert not git('status','--porcelain')
rows=[json.loads(line) for line in (out/'actual-condition-calls.jsonl').read_text().splitlines()]
assert rows and any(row['intent'].get('partySize')==2 and any('4 or more' in q.get('quote','') for f in row['facts'] for q in f.get('priceFacts',{}).get('listedCoursePricesYen',[])) for row in rows)
unique={json.dumps(row,sort_keys=True,ensure_ascii=False):row for row in rows}
blob=(json.dumps(list(unique.values()),ensure_ascii=False,separators=(',',':'))+'\n').encode();(out/'old-condition-calls.json.gz').write_bytes(gzip.compress(blob,mtime=0))
receipt={'mode':'DEFAULT_TEST_ACTUAL_CALL_CAPTURE_NO_RETURNED_VALUE_CHANGE','commit':git('rev-parse','HEAD').strip(),'exitCode':r.returncode,'seconds':time.monotonic()-t,'calls':len(rows),'uniqueCalls':len(unique),'states':sum(len(row['conditions']) for row in unique.values()),'sha256':hashlib.sha256(blob).hexdigest(),'gitStatusBefore':'','gitStatusAfter':'','realCalls':0}
(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt))
