# Local test network split

Status: draft / not integrated. User2026-11-07 explicitly requested this current test-environment routing change. Baseline57f292e5. TableCheck/Tabelog + their observed first-party API/CDN hosts direct; remaining browser destinations and Google/DeepSeek APIs via configured local proxy. All provider/Guard/authorization/identity/time/budget boundaries unchanged. No external website, API or model called in this slice.

The private current-worktree.env reuses existing local credentials without logging them; mode0600, ignored, no primary checkout/system proxy/VPN changes. Newly created config keeps real-call gates0. Exact nonsecret activation settings are inactivation.json. Normal Node invocation must load.env as documented; plainnode without.env continues using its provided process environment. Prior exact57f292e5 push approval does not authorize a new push.

Evidence: red.log has the intended old-code failure: proxy receiver sees both supposedly direct hosts. First implementation retained fixture failures: localhost native/redirect requests hit Chromium LocalNetworkAccessPermissionDenied; Node direct requests arrived. DNS/dualstack attempts did not fix it, original outputs retained. As in existing read-network-redirect.test.ts, the local fixture alone now grants loopback-network permission scoped to its source origin. Production permissions untouched; green-verified.log passes actual direct/proxy script/data and both redirect directions. provider-contracts.log41/41, including existing Google and new DeepSeek local CONNECT502 receivers: only local proxy contacted, never remote provider. Full gates follow on a clean frozen commit.

STATUS/DEVLOG/TEST-LOG main-publication updates remain deferred to approved main integration under the earlier user instruction; configuration docs/capability matrix and this branch report are updated now.

First frozen gatee8d55c60: type/architecture PASS; default1485/1486 retained Node24.4.1 V8 native fatal `Check failed: end > addr` in PGlite/Wasm disposal, not an assertion failure. Original D2 ONE/NONE/TWO test bytes unchanged; isolated-recheck.log7/7 includes all three original modes and Google recording contracts, no timeout/assertion/concurrency policy changes. No build/Chromium/strict success claimed for this first gate.

Wiring review found the original D8 custom Google constructor supplied hooks.googleFetch(fetch), which overrides the client's proxy transport. It now reuses existing createEvalGooglePlacesClient(options, hooks.googleFetch), so budget/recording decorate the actual scoped proxy transport. Existing Google factory test now also checks local CONNECT502 under its decorator; no remote provider reached. This is necessary for requested test routing, not a website or Guard contract change.

## Final frozen verification and delivery

Final code and actual actor freeze89edce0f80af3e7ac07199837e528d8a58042a85. All six gate invocations begin/end clean and keep that SHA: typecheck/arch/build PASS, default1486/1486, Chromium243/243 plusG6 77/77, strictG2 5/5 and saved pages12/12 PASS. All raw logs ingates-final; first gate and all fixture/runtime failures retained. No change to test concurrency, timeouts or assertions. Source Guard/TableCheck/Tabelog admission files byte-identical to baseline57f292e5. Generic static-vs-Node transport profile remains as previously reviewed.

The original V8 fatal did not reproduce in the unmodified isolated file or full final matrix; it is retained as an observed runtime crash, not erased or counted as a pass. No assertion failure was used to relax behavior.

Active current-worktree private.env loaded via --env-file-if-exists: Local Chromium, direct DNS suffixes tablecheck.com/tablecheck.net/tabelog.com/tblg.k-img.com and local loopback; other browser destinations usehttp://127.0.0.1:10808; Google and DeepSeek APIs each use the same explicit proxy. Existing private credentials reused unchanged, never committed or printed. Primary checkout/system proxy/VPN untouched; new local real-call gates0 until a separately authorized run explicitly enables them. Existing standard diagnostic --no-proxy clears all three proxies and direct list in its effective environment. Custom frozen D8 actors consume their provided Node environment; no undocumented CLI behavior is claimed.

Scope/evaluation: this is test-environment implementation with real local Chromium and fake API CONNECT receivers. End-to-end website/D8/held-out NOT_RUN, step-level routing/config/decorator PASS locally, no restaurant/stock/user-target claims or S0=0 claim, old TableCheck timeout root cause remains unresolved. This slice adds sourceGET0, realModel0, Live0, so all prior balances/reserves unchanged. No network bypass of site restrictions, permissions, certificate checks, method rules or budgets.

Scan57f292e5..HEAD has3 generic config/protocol hits; no source/restaurant-specific routing branch, alias table, selector or fabricated output. Host routing is explicit administrator configuration and never grants source admission.

Current test workspace is ready to use; new code remains a local review candidate, not main. Exact prior57f292e5 push approval is not reused for this new payload; no new push attempted. STATUS/DEVLOG/TEST-LOG publication remains deferred per previous main-integration instruction.
