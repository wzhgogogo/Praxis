# Frozen two-slot command sequence

Only after C1/C2 and B are published on main, synchronized, source hashes frozen and clean five gates/strictG2 pass. No scheduling or automatic retry. No real calls before prerequisites.

```sh
python3 .eval-artifacts/phase3b/g6-rerun-20261104/next-two/readiness.py
python3 .eval-artifacts/phase3b/g6-rerun-20261104/next-two/verify-inputs.py
```

## D4

Fresh identity/detail + four-parameter vacancy certification (no env, no cookie/form/model/retry; serial starts>=5s):
```sh
node --import tsx .eval-artifacts/phase3b/g6-rerun-20261104/next-two/certify.ts W1 6080c5000c0f1660c177c3f955957a9c384d7ef1146e00f40062bcbb211511d2
```
Review raw name/full address/phone/online reservation block and requested slot; if any mismatch, stop. Bind evidence offline and commit it before the Live process:
```sh
python3 .eval-artifacts/phase3b/g6-rerun-20261104/next-two/prepare-evidence.py D4
node --import tsx .eval-artifacts/phase3b/g6-rerun-20261104/next-two/preflight.ts D4
```
Use the exact evidenceSHA256 from preflight, then run once:
```sh
node --env-file=/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.env --import tsx src/eval/restaurant/agent-loop/g6/run-g6.ts --pack .eval-artifacts/phase3b/g6-rerun-20261104/next-two/D4.pack.json --sha256 6080c5000c0f1660c177c3f955957a9c384d7ef1146e00f40062bcbb211511d2 --evidence .eval-artifacts/phase3b/g6-rerun-20261104/next-two/D4.evidence.json --evidence-sha256 <preflight-evidenceSHA256> --output .eval-artifacts/phase3b/g6-rerun-20261104/next-two/runs/D4 --record-browser --record-decisions
```
Immediately inspect original evaluation.json, safety items, S0 and stopBatch. D8 must never start if D4 stops for safety/S0/quota. No batch parallelism or environment rerun.

## D8

Fresh identity/detail + four-parameter vacancy certification (no env, no cookie/form/model/retry; serial starts>=5s):
```sh
node --import tsx .eval-artifacts/phase3b/g6-rerun-20261104/next-two/certify.ts W2 c11c229ad99fcb73fd75205c66505e3ee71396a235308bc7a19d8f66189708f9
```
Review raw name/full address/phone/online reservation block and requested slot; if any mismatch, stop. Bind evidence offline and commit it before the Live process:
```sh
python3 .eval-artifacts/phase3b/g6-rerun-20261104/next-two/prepare-evidence.py D8
node --import tsx .eval-artifacts/phase3b/g6-rerun-20261104/next-two/preflight.ts D8
```
Use the exact evidenceSHA256 from preflight, then run once:
```sh
node --env-file=/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.env --import tsx src/eval/restaurant/agent-loop/g6/run-g6.ts --pack .eval-artifacts/phase3b/g6-rerun-20261104/next-two/D8.pack.json --sha256 c11c229ad99fcb73fd75205c66505e3ee71396a235308bc7a19d8f66189708f9 --evidence .eval-artifacts/phase3b/g6-rerun-20261104/next-two/D8.evidence.json --evidence-sha256 <preflight-evidenceSHA256> --output .eval-artifacts/phase3b/g6-rerun-20261104/next-two/runs/D8 --record-browser --record-decisions
```
Immediately inspect original evaluation.json, safety items, S0 and stopBatch. D8 must never start if D4 stops for safety/S0/quota. No batch parallelism or environment rerun.

After each slot, offline observations only:
```sh
PYTHONDONTWRITEBYTECODE=1 python3 .eval-artifacts/phase3b/g6-rerun-20261104/next-two/audit-runs.py
```
