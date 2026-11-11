# D4 TableCheck recorded-decision analysis

Evidence: original711eebc7 D4 run, execution.decisions.jsonl and browser-diagnostics.json; no new source request. Detailed costs remain in time-chain-proposal.md.

| Original decisions | Actual observed state and model action | First deviation / consequence |
|---|---|---|
|7–8|Opened Destination, filled authoritative Akabane.|These two actions are coherent location setup.|
|9–11|Page explicitly says no matching area or station; model alternates cuisine retrieval and location in the same field.|Overwrites rather than selects a location; no current location confirmation.|
|12–14|Opens Cuisine, fills kushikatsu; page explicitly says no matching cuisine, still clicks submit.|The page does not expose the matching option assumed by the model; no result binding.|
|15–21|Reopens Destination, repeats location/cuisine, finally Show More.|90.004s/15 model decisions, no verified source list.|
|24–31|Kushiman: opens Destination, fills source term, submits; same no matching area/station text; repeats.|45.003s/8 calls, no identity/inventory.|
|34–41|Yamasho: same open/fill/submit/reopen pattern.|43.243s/8 calls, no accepted inventory.|
|44–46|Third candidate: same first three actions.|28.301s/4 lifecycle-counted calls (including attempt accounting); no accepted inventory.|

The unchanged results contain restaurants near Akabanebashi/Onarimon, not evidence of Akabane search. Intl word segmentation deliberately rejects Akabanebashi as Akabane. No-match area/cuisine text is a source query/option limitation, not a finding of no restaurant or no seats. HTTP200 connectivity does not prove this search widget supports the requested name. The new generic instruction stops repeated unsuccessful submissions; it does not translate names, choose nearby alternatives or relax physical identity.

Model-only32: sequences7/8 each4/4 choose Destination/location setup;9 and26 each4/4 request help.14 chooses Destination4/4 after a cuisine no-match (different observed route, no demonstrated completion).29 only1/4 requests help,3/4 repeat submit: retain this failure. After one generic instruction refinement, remaining8 calls retest29 and Tabelog4:29 requests help4/4,4 fills location4/4. These are next-step controls on fixed observations, not successful site sequences or inventory validation. All original responses are retained, no fabricated follow-on page.
