# H003 TableCheck native discovery and availability loops

- Status: diagnostic; Live Read-only; not integrated
- Date: 2026-09-24
- Input: H003 current development case, materialized Friday `2026-09-25`, 10 people, after-work `17:30–22:00`; soft budget about JPY 3,000/person and private-room preference; team dinner/drinks remain nonblocking preferences.
- Geography: the existing public Higashi-Ginza evaluation point `35.6697, 139.7670`, exact radius 3,000 m. This is an evaluation coordinate, not a product default.
- Scope: TableCheck alone. No Google restaurant list, Google restaurant matching, booking submission or external write.

## Loop 1: native discovery and geography

The bounded source probe used TableCheck's public `/en/japan/search` with `geo_latitude=35.6697`, `geo_longitude=139.7670`, `geo_distance=5km`, `auto_geolocate=false`, and no `search_text`. The 5 km control was only rough retrieval. The first early snapshot was an unhydrated search shell. A fresh session waited for the result links and observed `50+ venues found` after 11,732 ms; five source links and their guide pages were read by 14,374 ms. Each guide provided a TableCheck URL/ID, address, and JSON-LD `GeoCoordinates`. Great-circle distance from the fixed evaluation point supplied the final 3 km gate:

| TableCheck guide | Source ID | Source coordinates | Distance | 3 km decision |
|---|---|---|---:|---|
| [0711 GiNZA BiSTRO](https://www.tablecheck.com/en/0711-ginzabistro) | `0711-ginzabistro` | 35.6684212, 139.7611454 | 548 m | admit |
| [100 Spoons, Museum of Contemporary Art Tokyo](https://www.tablecheck.com/en/100spoons-mot) | `100spoons-mot` | 35.6798258, 139.8084276 | 3,908 m | reject |
| [100 Spoons TOYOSU](https://www.tablecheck.com/en/100spoons-toyosu) | `100spoons-toyosu` | 35.65513, 139.7946277 | 2,976 m | admit |
| [101](https://www.tablecheck.com/en/101) | `101` | 35.7089874, 139.7909189 | 4,873 m | reject |
| [141](https://www.tablecheck.com/en/141hiroo) | `141hiroo` | 35.651328, 139.722415 | 4,516 m | reject |

The two admitted guide pages had source addresses and traceable outlet entrances. This is a small geographic sample, not exhaustive coverage or suitability acceptance. The first guide displayed dinner spend about JPY 12,500, well above H003's soft target; TOYOSU displayed about JPY 3,000. No party-size or current slot conclusion was made. The current production search-page parser caps extraction at five links, so this probe cannot estimate full native coverage from the `50+` display.

## Loop 2: same candidates into existing check

The planned composition would pass the two source-discovered outlets to the existing TableCheck browser availability adapter with `2026-09-25`, 10 people and `17:30–22:00`, retaining the source guide as a navigation hint and rechecking identity before inventory. Two local attempts failed at initial native search navigation, after 2,259 ms and 2,164 ms respectively; the second exposed `page.goto: net::ERR_CONNECTION_CLOSED`. The existing remote browser route then failed while opening a CDP session (`connectOverCDP` TypeError), before any TableCheck navigation. No candidate reached the date/party controls, extraction or availability result. Both candidate checks and end-to-end elapsed time are therefore **not measured**. Summing the successful Loop 1 duration with a later URL-only read would not be a valid end-to-end timing result.

## Initial verdict and next gate (superseded by the follow-up below)

Loop 1 supports source-native discovery of a small, geographically verified, outlet-linked sample without Google restaurant matching. It does not establish broad coverage, request suitability or a 10-person slot. Loop 2 is blocked by browser/network acquisition before the behavior under test, so the effect on identity binding, controls, extraction and total cost remains unknown. The minimal next action is one bounded contiguous TableCheck native-search → 3 km gate → same-candidate availability run after browser navigation is healthy, with the original 300,000 ms and 50 model-call ceilings. Stop if the source again cannot be entered; do not widen providers, alter H003 Gold or infer inventory from this sample.

## Follow-up: one contiguous retry after browser connectivity check

The public search returned HTTP 200 in a read-only header check. A separate local Chromium source probe then repeated native search and all five guide pages in 34,025 ms, so the earlier `ERR_CONNECTION_CLOSED` was not reproducible on that path; no production browser/network code was changed. The diagnostic runner's per-candidate and per-provider caps were aligned with the existing live-read debug limits (60,000 and 30,000 ms). The following single contiguous retry is saved at `.eval-artifacts/h003-native-tablecheck-check.retry-2026-09-24.json` (gitignored).

- Total start-to-return: **76,797 ms**; native results at 13,078 ms; five details and exact 3 km gate complete at 16,687 ms; existing TableCheck adapter check took 60,089 ms. The same five source IDs were returned; the same two passed 3 km. This timing includes search, door discovery, source detail/coordinate extraction and subsequent checks, but excludes the separate connectivity probe.
- The diagnostic supplied each observed guide URL to the existing TableCheck adapter as a navigation hint. The adapter reopened each page and recorded `HIGH / EXACT_PHONE` with matching name and address; source outlet IDs and guide URLs stayed with their respective candidates. These comparison fields all originate from TableCheck, so this demonstrates same-source continuity in this probe, not an independent cross-provider identity oracle or production native-search wiring.
- The adapter reached both availability widgets for `2026-09-25`, 10 people and `17:30–22:00`. The first candidate had date and 10-person selection attempts followed by a repeated guest-control opening; the second had date/guest attempts and one blocked write-capable click. Both spent their 30-second provider caps before a complete current-request result was established. Each returned `UNKNOWN / BROWSER_TIMEOUT`, with identity-only evidence, **zero Offer**, and no claim of unavailable stock. Ten browser-model calls were used, below the 50-call outer cap. No booking action or other external write occurred.
- The contiguous retry used the production TableCheck availability adapter, but candidates were assembled in a gitignored diagnostic rather than passed through the full Router/Runtime/Evaluator. Thus it does not establish end-to-end product delivery. The current first product blocker is reliable date/party/time control completion and source result extraction within budget, not cross-Google matching. Native search coverage remains limited to the parser's first five result links.

This result supports the narrow observation that Google restaurant matching was unnecessary to reach the two same-source widgets. It does **not** establish that the native path improves total cost or coverage: 60 seconds of checks yielded no verified inventory, and the two candidates have not passed independent H003 suitability or result evaluation. H001/H002 work and a merged multi-source candidate system remain outside this slice.
