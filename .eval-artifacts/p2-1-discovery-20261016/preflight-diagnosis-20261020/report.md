# TableCheck preflight diagnostic - 2026-10-20

Evidence status: current read-only diagnostic; exposed public control; not an end-to-end or capability acceptance.

The current source is working in all three observations. The actual unchanged production preflight reports NONEMPTY. Same-URL guarded and plain Chromium both render20 cards. The earlier NO_RESPONSE is not reproduced. Do not assign its cause to VPN, site failure, Guard or the20s polling window from these current passes.

| Mode | Whole diagnostic ms | First positive API ms | First API document count | Visible cards before closure |
| --- | --- | --- | --- | --- |
| production | 4641 | 4420 | 122 | 0 |
| guarded | 4598 | 3880 | 122 | 20 |
| plain | 4382 | 3610 | 122 | 20 |

The production source check accepts the public API result and closes before cards finish rendering (0 DOM cards at its final snapshot); that is distinct from manual guarded/plain observations, which wait until API and DOM results are both present. API document counts are per response and need not equal the final UI total. The manual pages show20 cards and retain the actual listing counter in summary.json.

## Controls and interpretation

- Exact public URL, productiona37e152, unchanged Guard, fresh headless isolated contexts and no explicit browser proxy. Guarded/plain block ServiceWorkers. Plain disables production Guard but retains a method filter preventing writes and allowing only matching browser GET CORS preflight.
- Actual production runSourceDataPreflight, passive response hooks and a closure snapshot; no alternative production function or injected result. Manual guarded/plain use35s observation allowance, stopping early once API and DOM results are present.
- All current responses arrived before20s, so the suspected20s-vs35s mismatch was not exercised. No production fix is justified by this experiment alone.
- A geolocation XHR denial was also present in an older successful diagnostic; it is not sufficient evidence for the earlier failure.
- Three sequential page visits are a diagnostic, not a randomized causal comparison. Ordinary user Chrome cookies/extensions/profile are not reproduced.
- No clicks, fills or model calls. No non-GET/HEAD/OPTIONS responses observed. This limited observation does not certify the entire production read boundary.

## Evidence and budgets

- production: [result](production/result.json), SHA256 `701847cadfeb81814b8187c992822722c402b0b6b78cc70536500197dade32db`.
- guarded: [result](guarded/result.json), SHA256 `b0c0fe3575174a7d10fc2dc37ebbde044ee6d20124a28ec3e479059c6fa10f6b`.
  [page screenshot](guarded/page.png).
- plain: [result](plain/result.json), SHA256 `dae2f6d27bc1dbfbf8f43fa995936d40cea90d8e05a8f97449f5d7423e072fbb`.
  [page screenshot](plain/page.png).

[Summary](summary.json), [frozen plan](plan.json), [freeze receipt](freeze-commit.json). Production source and stopped B ledger remain unchanged. No B or full Live started. New diagnostic navigations3; new models0, own Google API0, formal discovery probes0. P2-1 cumulative usage remains278/450 models,44/55 formal probes,118Google. Earlier Google READ_FAILED is not retested. Stop after saving and pushing the diagnostic evidence.
