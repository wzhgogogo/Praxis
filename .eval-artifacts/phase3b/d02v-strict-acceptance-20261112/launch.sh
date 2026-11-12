#!/usr/bin/env bash
set -euo pipefail
cd /private/tmp/praxis-browser-strict-fix
export PRAXIS_RUN_SEED_REMAINING=1
node --env-file=/Users/wangzhour/.codex/worktrees/d8-recorded-model-validation/Praxis-Zhixing/.env --import tsx /private/tmp/praxis-browser-strict-live-evidence/.eval-artifacts/phase3b/d02v-strict-acceptance-20261112/run-d02v.ts /private/tmp/praxis-browser-strict-live-evidence/.eval-artifacts/phase3b/d02v-strict-acceptance-20261112/config.json
