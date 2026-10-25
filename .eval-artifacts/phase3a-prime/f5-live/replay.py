#!/usr/bin/env python3
"""F2d ORIGINAL replay in a separate OS-network-denied process; zero model keys."""
import argparse,pathlib,subprocess,json,hashlib
HERE=pathlib.Path(__file__).resolve().parent;ROOT=HERE.parents[2]
p=argparse.ArgumentParser();p.add_argument('--slot',type=int,required=True);a=p.parse_args();assert 1<=a.slot<=6
freeze=json.loads((HERE/'freeze.json').read_text())
for name,digest in freeze['files'].items():assert hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==digest
folder=HERE/'slots'/str(a.slot);manifest=folder/'replay-config.json';assert manifest.exists();assert json.loads(manifest.read_text())['modelMode']=='ORIGINAL'
relative=str(manifest.relative_to(ROOT));assert subprocess.check_output(['git','show','HEAD:'+relative],cwd=ROOT)==manifest.read_bytes(),'REPLAY_CONFIG_NOT_COMMITTED'
output=folder/'replay';assert not output.exists()
cmd=['sandbox-exec','-p','(version 1)(allow default)(deny network-outbound)','node','--import','tsx','src/eval/restaurant/agent-loop/runners/run-recorded-read.ts',str(manifest),str(output)]
with (folder/'replay-stdout.txt').open('w') as out,(folder/'replay-stderr.txt').open('w') as err:r=subprocess.run(cmd,cwd=ROOT,stdout=out,stderr=err,timeout=550)
summary={'exitCode':r.returncode,'mode':'ORIGINAL','modelCalls':0,'networkPolicy':'OS deny network-outbound; F2d abort on missing input; no fallback','output':str(output)}
(folder/'replay-outer.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary))
