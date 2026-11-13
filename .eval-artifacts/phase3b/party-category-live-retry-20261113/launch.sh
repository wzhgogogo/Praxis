#!/usr/bin/env bash
set -euo pipefail
cd /private/tmp/praxis-party-category-retry-evidence
export PRAXIS_RUN_SEED_REMAINING=1
node --env-file=/Users/wangzhour/.codex/worktrees/d8-recorded-model-validation/Praxis-Zhixing/.env --import tsx /private/tmp/praxis-party-category-retry-evidence/.eval-artifacts/phase3b/party-category-live-retry-20261113/run-d02v.ts /private/tmp/praxis-party-category-retry-evidence/.eval-artifacts/phase3b/party-category-live-retry-20261113/config.json
