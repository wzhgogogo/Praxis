#!/usr/bin/env bash
set -euo pipefail
cd /private/tmp/praxis-seed-final-r2-main
export PRAXIS_RUN_SEED_REMAINING=1
node --env-file=/Users/wangzhour/.codex/worktrees/d8-recorded-model-validation/Praxis-Zhixing/.env --import tsx /private/tmp/praxis-seed-post-fix-evidence-04/.eval-artifacts/phase3b/seed-d02v-final-r2-20261112/run-d02v.ts /private/tmp/praxis-seed-post-fix-evidence-04/.eval-artifacts/phase3b/seed-d02v-final-r2-20261112/config-r2.json
