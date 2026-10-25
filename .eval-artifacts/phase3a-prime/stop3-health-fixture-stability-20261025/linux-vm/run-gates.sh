#!/bin/bash
set -euo pipefail
cd "$HOME/praxis-health"
python3 scripts/replay-network-check.py --output /tmp/praxis-health-network.json
python3 .eval-artifacts/phase3a-prime/stop3-health-fixture-stability-20261025/run-gates.py --worktree "$HOME/praxis-health" --freeze .eval-artifacts/phase3a-prime/stop3-health-fixture-stability-20261025/freeze.json --output /tmp/praxis-health-linux-gates
