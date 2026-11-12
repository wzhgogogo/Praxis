#!/usr/bin/env bash
set -euo pipefail
cd /private/tmp/praxis-r2-scope-fix
export PRAXIS_RUN_SEED_REMAINING=1
node --env-file=/Users/wangzhour/.codex/worktrees/d8-recorded-model-validation/Praxis-Zhixing/.env --import tsx /private/tmp/praxis-r2-acceptance-evidence/.eval-artifacts/phase3b/r2-acceptance-20261112/run-d02v.ts /private/tmp/praxis-r2-acceptance-evidence/.eval-artifacts/phase3b/r2-acceptance-20261112/config.json
