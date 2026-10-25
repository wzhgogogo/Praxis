#!/usr/bin/env python3
"""Run only local gates, sequentially, on a committed clean tree. No env file."""
import datetime as dt
import gzip
import hashlib
import json
import pathlib
import subprocess
import time

ROOT = pathlib.Path(__file__).resolve().parents[3]
HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE/'gates'
def git(*args): return subprocess.check_output(['git',*args],cwd=ROOT).decode().strip()
def stamp(): return dt.datetime.now(dt.timezone(dt.timedelta(hours=1))).isoformat()
def main():
    OUT.mkdir(exist_ok=True)
    receipt={'mode':'OFFLINE_ONLY','commit':git('rev-parse','HEAD'),'startedAtCET':stamp(),
        'scriptSha256':hashlib.sha256(pathlib.Path(__file__).read_bytes()).hexdigest(),'gates':[]}
    for name,command in [('typecheck',['npm','run','typecheck']),('arch',['npm','run','arch:check']),('test',['npm','test']),('build',['npm','run','build']),('chromium',['npm','run','test:browser:fixture'])]:
        before=git('status','--porcelain')
        assert not before,'DIRTY_BEFORE_'+name+':'+before
        started=stamp();tick=time.monotonic()
        path=OUT/(name+'.log')
        with path.open('wb') as log: result=subprocess.run(command,cwd=ROOT,stdout=log,stderr=subprocess.STDOUT)
        after=git('status','--porcelain')
        raw=path.read_bytes()
        (OUT/(name+'.log.gz')).write_bytes(gzip.compress(raw,mtime=0))
        row={'name':name,'command':command,'startedAtCET':started,'finishedAtCET':stamp(),
             'elapsedSeconds':round(time.monotonic()-tick,3),'exitCode':result.returncode,
             'statusBefore':before,'statusAfter':after,'logSha256':hashlib.sha256(raw).hexdigest()}
        receipt['gates'].append(row)
        (OUT/'receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
        print(json.dumps(row),flush=True)
        assert result.returncode==0 and not after,'FAILED_OR_DIRTY_'+name
    receipt['finishedAtCET']=stamp();receipt['allPass']=True
    (OUT/'receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
if __name__=='__main__':main()
