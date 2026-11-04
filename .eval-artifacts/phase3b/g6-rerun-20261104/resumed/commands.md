# Frozen commands: only this approved three-slot batch

Public certification uses no env file; run only after final clean gates. Credentials enter only the approved Live process.

Before D4, fresh W1 public certification (2 GET; no retry):
```sh
node --import tsx .eval-artifacts/phase3b/g6-rerun-20261104/resumed/certify.ts W1 dbd514923ad7ec3c655608be7c991793e6534b6b5200af93bcf316d46f9eb800
```
Manually inspect saved raw identity/online booking block and availability, then bind evidence offline:
```sh
python3 .eval-artifacts/phase3b/g6-rerun-20261104/resumed/prepare-evidence.py D4
node --import tsx .eval-artifacts/phase3b/g6-rerun-20261104/resumed/preflight.ts D4
```
For the Live command, obtain the evidence hash from preflight output; do not edit frozen input:
```sh
node --env-file=/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.env --import tsx src/eval/restaurant/agent-loop/g6/run-g6.ts --pack .eval-artifacts/phase3b/g6-rerun-20261104/D4.pack.json --sha256 dbd514923ad7ec3c655608be7c991793e6534b6b5200af93bcf316d46f9eb800 --evidence .eval-artifacts/phase3b/g6-rerun-20261104/resumed/D4.evidence.json --evidence-sha256 <preflight evidenceSHA256> --output .eval-artifacts/phase3b/g6-rerun-20261104/resumed/runs/D4 --record-browser --record-decisions
```
Immediately inspect saved evaluation.json (stopBatch/S0/safety), not just command exit status; no retry.

D6: reuse fresh W1 receipt only while age <24h; bind current ledger attempt count before invoking.
```sh
python3 .eval-artifacts/phase3b/g6-rerun-20261104/resumed/prepare-evidence.py D6
node --import tsx .eval-artifacts/phase3b/g6-rerun-20261104/resumed/preflight.ts D6
```
For the Live command, obtain the evidence hash from preflight output; do not edit frozen input:
```sh
node --env-file=/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.env --import tsx src/eval/restaurant/agent-loop/g6/run-g6.ts --pack .eval-artifacts/phase3b/g6-rerun-20261104/D6.pack.json --sha256 3b87864809934a649f6661d50406afee5eff068499582375a9345edcb3ee2457 --evidence .eval-artifacts/phase3b/g6-rerun-20261104/resumed/D6.evidence.json --evidence-sha256 <preflight evidenceSHA256> --output .eval-artifacts/phase3b/g6-rerun-20261104/resumed/runs/D6 --record-browser --record-decisions
```
Immediately inspect saved evaluation.json (stopBatch/S0/safety), not just command exit status; no retry.

Before D8, fresh W2 public certification (2 GET; no retry):
```sh
node --import tsx .eval-artifacts/phase3b/g6-rerun-20261104/resumed/certify.ts W2 2935bc4c239f1321b0937aa8d297be18190b79c03b441ffafead293ba13f6be6
```
Manually inspect saved raw identity/online booking block and availability, then bind evidence offline:
```sh
python3 .eval-artifacts/phase3b/g6-rerun-20261104/resumed/prepare-evidence.py D8
node --import tsx .eval-artifacts/phase3b/g6-rerun-20261104/resumed/preflight.ts D8
```
For the Live command, obtain the evidence hash from preflight output; do not edit frozen input:
```sh
node --env-file=/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.env --import tsx src/eval/restaurant/agent-loop/g6/run-g6.ts --pack .eval-artifacts/phase3b/g6-rerun-20261104/D8.pack.json --sha256 2935bc4c239f1321b0937aa8d297be18190b79c03b441ffafead293ba13f6be6 --evidence .eval-artifacts/phase3b/g6-rerun-20261104/resumed/D8.evidence.json --evidence-sha256 <preflight evidenceSHA256> --output .eval-artifacts/phase3b/g6-rerun-20261104/resumed/runs/D8 --record-browser --record-decisions
```
Immediately inspect saved evaluation.json (stopBatch/S0/safety), not just command exit status; no retry.

After each slot, offline metrics only:
```sh
python3 .eval-artifacts/phase3b/g6-rerun-20261104/resumed/audit-runs.py
```
D4 must begin before 19:00 JST; D6 planned in [19:00,23:00) JST; D8 after D6 safety PASS and its own fresh W2 certification. If any S0/safety evidence failure occurs, never start a remaining slot.
