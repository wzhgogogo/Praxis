#!/bin/bash
set -euo pipefail
cd "$HOME/praxis-browser-timeout"
tar -xf /tmp/verification-delta.tar
git add -f .eval-artifacts/phase3b/browser-timeout-diagnostics/run-verification.py .eval-artifacts/phase3b/browser-timeout-diagnostics/inputs-sha256.json
git -c user.name='Offline fixture' -c user.email='fixture@localhost' commit -qm 'Frozen host 6c6df847 verification metadata delta'
test ! -f .env
test -z "$(git status --porcelain)"
peer=${SSH_CLIENT%% *}
[[ $peer =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]
printf 'Task SSH peer exempt from VM-only external-route block: %s\n' "$peer"
sudo ip -4 route replace blackhole default table 45000
sudo ip -6 route replace blackhole default table 45000
sudo ip -4 rule add priority 100 to "$peer/32" lookup main
sudo ip -4 rule add priority 101 lookup 45000
sudo ip -6 rule add priority 101 lookup 45000
ip -4 rule show
ip -6 rule show
if ip -4 route get 198.51.100.1; then exit 1; fi
if ip -6 route get 2001:db8::1; then exit 1; fi
exec taskset -c 0,1 python3 .eval-artifacts/phase3b/browser-timeout-diagnostics/run-verification.py /tmp/browser-timeout-verification --two-cpu --browser-repeats 5
