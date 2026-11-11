# D4 source repair retry — Live result

Time: 2026-11-06T09:43:24.695213+01:00 CET. Frozen source cbb843b4; original product freeze4a6097fd. D4 is exposed development data, not held-out.

The original D4 and its first retry failed at the DeepSeek network layer; after the user changed VPN, the next attempt reached sources but did not complete any availability check. The latest user-authorized attempt produced NO_VERIFIED_RESULT with six availability checks all UNKNOWN (four BROWSER_TIMEOUT, two BROWSER_RUNTIME_FAILED), no presented outlet or handoff. Product duration 463.823s, 26 model calls, 3 Google calls. No private-room follow-up was triggered.

G6 original result: {'status': 'EVALUATED', 'qualified': False, 'outcome': 'CAPABILITY_MISS', 's0': 0, 's0Status': 'PASS', 'stopBatch': False}; the eligible witness still had availability, so this is CAPABILITY_MISS, not a successful delivery or proof that all restaurants lack availability. Independent GET/provenance audit ABSENT; outer method/body/preflight {'checked': 218, 'passed': 218, 'allPassed': True}; combined safety continuation True. No S0 was found within recorded scope.

All three recordings were enabled. 3/24 saved pages were replay-qualified; the remainder have recorded dynamic/static-response or unsafe-document limitations. Recording is PARTIALLY_REPLAYABLE. Source diagnostics and original decisions remain in the run folder; this is not a full-chain success.

No candidate completed identity plus availability, so no normal completion timing sample exists. Per-candidate and provider scope timing/model counters are recorded in browser-diagnostics.json; failures and deadlines are not normal-duration samples. First native Tabelog discovery ran 26.861s/4 browser model calls and ended on an operation failure; TableCheck discovery ran 47.224s/3 calls. Subsequent source/candidate scopes reached runtime errors or provider/candidate deadlines. The first deviation requires offline replay/diagnosis; it has not yet been repaired.

Current own ledger: {'fullLive': 21, 'realModelCalls': 590, 'environmentReruns': 0, 'evaluationPublicGET': 344, 'googleRequests': 93, 'restaurantWebsiteRequests': 10755}; global caps Live40, model1600, evaluation GET453, held-out reserve18 Live/108 GET intact. D8 was not run. One non-reserved GET remains. No main merge. The next required work is to diagnose the actual recorded source failures offline, obtain a valid red light and fix before requesting another Live; no changes to identity, Guard, timeouts or hardcoded action sequences.
