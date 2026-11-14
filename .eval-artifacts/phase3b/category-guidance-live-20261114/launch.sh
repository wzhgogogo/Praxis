#!/usr/bin/env bash
set -euo pipefail
cd /private/tmp/praxis-category-guidance-live-evidence
export PRAXIS_RUN_SEED_REMAINING=1
node --env-file=/Users/wangzhour/.codex/worktrees/d8-recorded-model-validation/Praxis-Zhixing/.env --import tsx /private/tmp/praxis-category-guidance-live-evidence/.eval-artifacts/phase3b/category-guidance-live-20261114/run-d02v.ts /private/tmp/praxis-category-guidance-live-evidence/.eval-artifacts/phase3b/category-guidance-live-20261114/config.json
