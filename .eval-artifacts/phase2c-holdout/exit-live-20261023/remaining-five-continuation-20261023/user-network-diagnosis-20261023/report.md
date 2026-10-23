# TableCheck search diagnosis (read-only, user requested)

Status: diagnostic evidence, no production repair; user paused for independent review.

The public search document returned HTTP200 in1.269s. Both www.tablecheck.com and the legacy search API host lost4/4 ICMP packets; that does not establish HTTPS unreachability. The CURRENT frontend uses search-v4.production.ap-northeast-1.aws.tablecheck.net. Its catalog returned200 in0.994s; a real search GET returned200, valid JSON and no root errors in7.831s. The exact cuisine facet GET rejected in the browser also returned200 in0.594s without hits.

## Reproduced cause

The current production Guard already allows the V4 hostname. An earlier missing-host hypothesis was explicitly corrected; frozen source SHA is unchanged. Its search rule requires BOTH queryProfile and hits. The current frontend's venue-facet-cuisine query omits hits. In an actual Chromium session using the unchanged production Guard, the genuine OPTIONS preflight was rejected as BLOCKED_METHOD before the facet GET, while the main search and map GETs returned200. The page visibly displayed "Search is unavailable right now. Please try again."

A separate diagnostic-only browser instance added only the exact observed seven-query-key GET shape, retaining the source origin/path and browser-generated x-api-key preflight binding. It made the facet GET succeed, removed the busy error, and displayed "Showing 1-20 of654" plus restaurant cards. There were no form openings, clicks, slot actions, user credential submission, models or Google API calls. This temporary in-memory policy was NEVER applied to product files or the frozen Live Runner. It is a causal diagnostic comparison, not a product acceptance result. Locally fulfilled OPTIONS204 entries are not claimed as remote HTTP responses.

- Red: guarded-search.result.json, guarded-search-visible.txt, guarded-search.png.
- Green counterfactual: counterfactual-search.result.json, counterfactual-search-visible.txt, counterfactual-search.png.
- Direct endpoint facts: public-search.result.json, search-v4-catalog.result.json, search-v4-query.result.json, facet-direct.result.json.
- Full raw public responses, source JS, request metadata, scripts and SHAs are preserved here. Public frontend client-key header values were used in memory, never written as request-header logs; no user/production secret was copied.

Only the exact h14 URL was compared. Earlier busy-page runs retain their original outer classifications; independent reviewers decide any retrospective attribution. No repair or additional Live ran after the user requested pause. The proposed offline repair was cancelled before any production edit. No capability scores were generated.
