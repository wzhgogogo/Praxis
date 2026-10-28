# G4端到端身份前缀基准

Evidence: frozen exposed regression / not clean holdout. Vienna CET UTC+1.

Production main b250bb17, after approved B then C integration. 29 original Google inputs +8 new, all Google Tabelog/website direct links hidden; original PlaceID/name/address/phone/coordinates only. Certified IDs isolated in gold.json and posthoc scorer child, never query/Prompt.

Use current TabelogBrowserAvailability→ModelNamedSourceQuery→details→existing identity. Public HTTP GET runtime renders captured HTML offline with JS disabled, all renderer network aborted; no actual source browser requests, Google0/Live0. Stop immediately at HIGH identity; never fetch booking/forms or query inventory. Static source HTML limitation is reported, not a full-browser Agent/availability benchmark. Five-detail cap/two queries unchanged. No adaptive strategies/Gold/identity edits after results.

Caps: GET115, model40 (at most1 per candidate), shared GET150 (previous30). Every GET incl failures charged before request, >=30s after previous completion,20s fetch timeout, manual redirects/no cookies, no retry after failure. Failed request aborts this candidate as ENVIRONMENT_FAILURE, excluded from identity misses;3 consecutive network errors stop entire batch. Wrong acceptance stops immediately after independent posthoc score. Budget exhaustion stops, unrun entries explicit. Model infrastructure failure stops. Worst-case37×7 GET exceeds115, so no promise to complete all37 within cap; never truncate detail cap to improve coverage.

Report old29 and new8 separately: searches/first-page certified presence/detail URLs/production identity/verdict/causes. Do not combine old12/29 saved-page replay or old first-page probes into this new denominator. Model credential only authorized Node --env-file process, never independently read/copy/print/stage.
