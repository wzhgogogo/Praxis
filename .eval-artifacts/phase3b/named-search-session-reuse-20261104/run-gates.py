import datetime, hashlib, json, pathlib, subprocess, time

root = pathlib.Path.cwd()
out = root / '.eval-artifacts/phase3b/named-search-session-reuse-20261104'
zone = datetime.timezone(datetime.timedelta(hours=1))
def stamp(): return datetime.datetime.now(zone).isoformat()
def status(): return subprocess.check_output(['git','status','--porcelain'], text=True)
freeze = json.loads((out/'freeze.json').read_text())
def verify():
    for row in freeze['files']:
        assert hashlib.sha256((root/row['path']).read_bytes()).hexdigest() == row['sha256'], row['path']
steps = [
 ('typecheck',['npm','run','typecheck']),
 ('architecture',['npm','run','arch:check']),
 ('default',['npm','test']),
 ('build',['npm','run','build']),
 ('chromium',['npm','run','test:browser:fixture']),
 ('strict-g2',['env','PRAXIS_G2_REQUIRE_PASS=1','npm','run','test:dom-change']),
 ('target',['env','PRAXIS_SESSION_REUSE_CAPTURE=1','node','--import','tsx','--test',
    'src/integrations/restaurant-availability/named-search-session-reuse.test.ts',
    'src/integrations/restaurant-availability/live-browser-availability.test.ts',
    'src/application/restaurant-named-identity-prefix.test.ts',
    'src/application/restaurant-booking-terms-reserve.test.ts']),
]
receipts=[]
for name,cmd in steps:
    verify()
    before=status();assert before == '', before
    record={'name':name,'command':cmd,'beforeStatus':before,'startedAtCET':stamp(),
            'head':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()}
    start=time.monotonic()
    with (out/(name+'.log')).open('wb') as log:
        try: code=subprocess.run(cmd,stdout=log,stderr=subprocess.STDOUT,timeout=900).returncode
        except subprocess.TimeoutExpired: code=124
    record.update(returnCode=code,elapsedSeconds=round(time.monotonic()-start,3),finishedAtCET=stamp(),afterStatus=status())
    verify()
    receipts.append(record)
    (out/'gates.json').write_text(json.dumps(receipts,indent=2)+'\n')
    print(name,code,record['elapsedSeconds'],'clean='+str(record['afterStatus']==''),flush=True)
    if code != 0 or record['afterStatus'] != '': raise SystemExit(1)
