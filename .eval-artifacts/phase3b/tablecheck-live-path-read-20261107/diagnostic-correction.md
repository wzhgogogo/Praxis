# Diagnostic scope correction after the preserved source run

The original1c57b13e receipt lists legacy geography/id/service-mode observations alongside the real destination rejection. Those legacy rules have no new queryValueClasses contract, and their observation categories did not reject their admitted requests. They must not be presented as text-contract violations or PII disclosure.

A local Chromium counterexample adds an already permitted legacy shape while preserving the punctuated destination denial. The original diagnostic falsely lists lat/service_mode in the violation list (legacy-diagnostic-red.log); the corrected diagnostic only evaluates the exact queryValueClasses contract matched by origin/path/full key set (legacy-diagnostic-green.log). Guard itself is unchanged. Source raw receipt/log and all response artifacts are untouched; no source rerun. The independently observed destination OTHER still determines the same stop.
