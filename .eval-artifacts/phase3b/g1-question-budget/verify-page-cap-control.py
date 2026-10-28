"""One effective counterfactual for the new page ceiling, separate from formal gates."""
from pathlib import Path
import datetime, hashlib, json, os, signal, subprocess, sys

root=Path.cwd(); out=Path(sys.argv[1]); out.mkdir(parents=True,exist_ok=False)
git=lambda *a:subprocess.check_output(['git',*a],text=True)
assert not git('status','--porcelain')
source=root/'src/integrations/restaurant-facts/page-question-read-budget.ts'
before=source.read_bytes(); text=before.decode()
needle='if (visits.used >= visits.limit) {'; assert text.count(needle)==1
result={'mode':'OFFLINE_CHROMIUM_COUNTERFACTUAL','commit':git('rev-parse','HEAD').strip(),
        'atCET':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1),'CET')).isoformat(),
        'sourceSha256':hashlib.sha256(before).hexdigest(),'mutation':'bypass the question page-visit ceiling'}
command=['node','--import','tsx','--test','src/harness/browser/page-question-budget.test.ts']
try:
    source.write_text(text.replace(needle,'if (false && visits.used >= visits.limit) {',1))
    with (out/'page-cap-red.log').open('wb') as log:
        proc=subprocess.Popen(command,stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
        try: code=proc.wait(timeout=45)
        except subprocess.TimeoutExpired:
            os.killpg(proc.pid,signal.SIGTERM)
            try: proc.wait(timeout=5)
            except subprocess.TimeoutExpired: os.killpg(proc.pid,signal.SIGKILL);proc.wait()
            code=proc.returncode;result['timedOut']=True
    raw=(out/'page-cap-red.log').read_bytes()
    result.update({'command':command,'exitCode':code,'validRed':code!=0 and b'Missing expected rejection' in raw and not result.get('timedOut')})
finally:
    source.write_bytes(before)
result.update({'sourceRestoredExactly':source.read_bytes()==before,'gitStatusAfter':git('status','--porcelain')})
(out/'control.json').write_text(json.dumps(result,indent=2)+'\n')
assert result['validRed'] and result['sourceRestoredExactly'] and not result['gitStatusAfter']
print(json.dumps(result))
