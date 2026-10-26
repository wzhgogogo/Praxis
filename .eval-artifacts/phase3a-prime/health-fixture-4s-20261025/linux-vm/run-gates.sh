#!/bin/bash
set -euo pipefail
cd "$HOME/praxis-followup"
python3 scripts/replay-network-check.py --output /tmp/praxis-followup-isolation.json
python3 .eval-artifacts/phase3a-prime/review-followup-a-20261025/run-gates.py --worktree "$HOME/praxis-followup" --freeze .eval-artifacts/phase3a-prime/health-fixture-4s-20261025/freeze.json --output /tmp/praxis-followup-linux-gates --browser-samples 3 --median-limit 150
