from pathlib import Path
import subprocess,json,os,sys,time,datetime,zoneinfo
# Explicit ORIGINAL mode, no .env loader, no inherited provider credentials.
config=Path('.eval-artifacts/phase3b/replay-completion/original-replay.json')
assert json.loads(config.read_text())['modelMode']=='ORIGINAL'
out=Path(sys.argv[1]);assert not out.exists();out.mkdir(parents=True)
node=subprocess.check_output(['which','node'],text=True).strip()
cmd=[node,'--import','./scripts/test-filesystem-guard.mjs','--import','tsx','src/eval/restaurant/agent-loop/runners/run-recorded-read.ts',str(config),str(out/'execution')]
if sys.platform=='darwin':cmd=['/usr/bin/sandbox-exec','-p','(version 1)(allow default)(deny network-outbound)']+cmd
elif sys.platform.startswith('linux'):cmd=['unshare','-rn','--']+cmd
else:raise SystemExit('Required OS network isolation unavailable')
env={k:v for k,v in os.environ.items() if k in ['PATH','HOME','TMPDIR','LANG','PLAYWRIGHT_BROWSERS_PATH']}
start=time.monotonic()
with (out/'stdout.log').open('w') as stdout,(out/'stderr.log').open('w') as stderr:
 run=subprocess.run(cmd,env=env,stdout=stdout,stderr=stderr,timeout=60)
receipt={'timeCET':datetime.datetime.now(zoneinfo.ZoneInfo('Europe/Vienna')).isoformat(),'candidate':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'mode':'ORIGINAL','networkBoundary':'OS_DENY_NETWORK_OUTBOUND','providerEnvironment':'NOT_INHERITED','exitCode':run.returncode,'elapsedSeconds':round(time.monotonic()-start,3),'realModelCalls':0,'sourceCalls':0}
(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt));raise SystemExit(run.returncode)
