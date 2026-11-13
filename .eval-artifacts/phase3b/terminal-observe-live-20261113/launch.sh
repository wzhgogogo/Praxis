#!/usr/bin/env bash
set -euo pipefail
cd /private/tmp/praxis-terminal-observe-live-evidence
export PRAXIS_RUN_SEED_REMAINING=1
node --env-file=/Users/wangzhour/.codex/worktrees/d8-recorded-model-validation/Praxis-Zhixing/.env --import tsx /private/tmp/praxis-terminal-observe-live-evidence/.eval-artifacts/phase3b/terminal-observe-live-20261113/run-d02v.ts /private/tmp/praxis-terminal-observe-live-evidence/.eval-artifacts/phase3b/terminal-observe-live-20261113/config.json
