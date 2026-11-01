from pathlib import Path
import datetime, gzip, hashlib, json, os, re, shutil, subprocess, sys, tempfile, time
from zoneinfo import ZoneInfo

root=Path.cwd(); item=Path(__file__).resolve().parent
mode=sys.argv[1]; out=Path(sys.argv[2]).resolve()
assert mode in ('old','fixed') and not out.exists() and not out.is_relative_to(root)
out.mkdir(parents=True)
git=lambda *a:subprocess.check_output(['git',*a])
old='a7860924b8630a34318811b477af54e0f007d0b6'
files=['src/harness/browser-fixture-scheduling.test.ts','scripts/run-browser-fixtures.mjs','scripts/browser-fixture-worker.mjs','scripts/test-filesystem-guard.mjs','package.json','package-lock.json','tsconfig.json','tsconfig.build.json','.gitignore']
def sha(raw):return hashlib.sha256(raw).hexdigest()
source=git('show',old+':'+files[0]) if mode=='old' else (root/files[0]).read_bytes()
original=git('show',old+':'+files[0])
assert [s for s in source.decode().splitlines() if 'assert.' in s]==[s for s in original.decode().splitlines() if 'assert.' in s], 'Original assertions must stay byte-identical'
receipt={'mode':mode,'kind':'CONTROLLED_REAL_LIFECYCLE_DELIVERY_ORDER_NOT_NATURAL_ENV_REPRODUCTION','baseGit':old,'sourceSha256':sha(source),'originalAssertionLinesIdentical':True,'runs':[],'startedAtCET':datetime.datetime.now(datetime.timezone.utc).astimezone(ZoneInfo('Europe/Vienna')).isoformat()}
for controlled in [True]+([False]*3 if mode=='fixed' else []):
    work=Path(tempfile.mkdtemp(prefix='praxis-fixture-event-'))
    try:
        for name in files:
            raw=source if name==files[0] else git('show',old+':'+name)
            p=work/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(raw)
        os.symlink(str(root/'node_modules'),work/'node_modules',target_is_directory=True)
        changes={}
        if controlled:
            testfile=work/files[0];text=testfile.read_text()
            needle="      import {runBrowserFixturePhase} from './scripts/run-browser-fixtures.mjs';"
            assert text.count(needle)==1
            text=text.replace(needle,"      import {writeFileSync} from 'node:fs';\n"+needle)
            assert text.count('const check=()=>{')==1
            text=text.replace('const check=()=>{',"const check=()=>{if(output&&finished&&nextStarted)writeFileSync(new URL('./lifecycle-ready',import.meta.url),'ready');")
            assert [s for s in text.splitlines() if 'assert.' in s]==[s for s in source.decode().splitlines() if 'assert.' in s]
            testfile.write_text(text)
            worker=work/files[2];text=worker.read_text().replace('import { writeSync }','import { writeSync, existsSync, watch }')
            start=text.index('  writeSync(3, JSON.stringify(');end=text.index('}) + "\\n");',start)+len('}) + "\\n");')
            expression=text[start:end].replace('  writeSync(3, ','  const message = ',1).removesuffix(');')+';'
            delivery='''
  if (!file && start && data.name === 'a-held lifecycle step') {
    let watcher;
    const release = () => { if (existsSync('lifecycle-ready')) { watcher?.close(); writeSync(3, message); } };
    watcher = watch(process.cwd(), release);
    release();
  } else writeSync(3, message);'''
            text=text[:start]+expression+delivery+text[end:];worker.write_text(text)
            changes={name:sha((work/name).read_bytes()) for name in (files[0],files[2])}
            (out/'controlled-test.ts').write_bytes(testfile.read_bytes());(out/'controlled-worker.mjs').write_bytes(worker.read_bytes())
        number=len(receipt['runs'])+1;label='controlled' if controlled else 'ordinary-'+str(number-1)
        env=dict(os.environ);env.pop('NODE_TEST_CONTEXT',None)
        cmd=[str(Path(subprocess.check_output(['which','node'],text=True).strip())),'--import','./scripts/test-filesystem-guard.mjs','--import','tsx','--test','--test-reporter=spec',files[0]]
        started=time.monotonic()
        with (out/(label+'.log')).open('wb') as stream:
            result=subprocess.run(cmd,cwd=work,env=env,stdout=stream,stderr=subprocess.STDOUT,timeout=90)
        raw=(out/(label+'.log')).read_bytes();(out/(label+'.log.gz')).write_bytes(gzip.compress(raw,mtime=0))
        row={'label':label,'controlledDelivery':controlled,'command':cmd,'exitCode':result.returncode,'seconds':round(time.monotonic()-started,3),'rawLogSha256':sha(raw),'probeOnlyChangedCopies':changes}
        receipt['runs'].append(row);(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
        print(mode,label,result.returncode,row['seconds'],flush=True)
        if mode=='old':
            assert result.returncode==1 and b'lastObservedTests' in raw and b'a-held lifecycle step' in raw,raw[-3000:]
        else:assert result.returncode==0,raw[-3000:]
    finally:shutil.rmtree(work)
receipt['status']='EXPECTED_RED_REPRODUCED' if mode=='old' else 'PASS'
(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
