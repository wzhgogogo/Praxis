#!/bin/bash
set -euo pipefail
# Repository Release metadata follows NTP time; align test clock only after installation.
sudo timedatectl set-ntp true
cd "$HOME/praxis-health"
npx playwright-core install --with-deps --only-shell chromium
node --version
uname -a
id
