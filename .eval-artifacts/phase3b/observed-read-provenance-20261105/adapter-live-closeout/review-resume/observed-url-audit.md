# Exact URL caller audit

Status: draft / not integrated. Audited current product calls, not test calls. All 17 current `navigate(...observed:true)` sites are listed (the review counted 16; native-facts linked translation is the additional site). All still enter the Executor/Guard boundary. No new URL is constructed for inventory.

| File / current line | Value | Origin |
|---|---|---|
| google-listed-website-facts.ts:403 | listed | Google candidate websiteUri, parsed as a URL; no path/query construction |
| native-source-facts.ts:115 | sourceUrl | Candidate's bound tabelogNativeDetailUri/tablecheckNativeGuideUri |
| native-source-facts.ts:334 | translation.href | Actual observed translation LINK chosen by the model, after same-outlet/page checks |
| native-source-facts.ts:359 | observedReservationTarget.url | Exact page JSON-LD/anchor target; policy prohibits forbidden linked pages before navigate |
| native-restaurant-search.ts:278 | nextListing.sourceUrl | Actual listing continuation href retained from source-page observation |
| native-restaurant-search.ts:312 | entry.sourceUrl | Parsed actual source listing href, not an ID-derived detail template |
| tabelog-browser-availability.ts:182 | page.url | Existing admitted page reload under the unchanged one-busy-retry contract |
| tabelog-browser-availability.ts:243 | alternate | Exact page-observed canonical/alternate URL retained with identity-bound source URLs |
| tabelog-browser-availability.ts:332 | listedOutlet.sourceUrl | Google/source-bound exact URI, with only existing listedTabelogOutlet identity normalization |
| tabelog-browser-availability.ts:393 | outlet.sourceUrl | Actual observed search result href, including source's own query if present |
| tabelog-browser-availability.ts:627 | sourceOutlet.sourceUrl | The same identity-inspected result/bound URI for the selected outlet |
| tablecheck-browser-availability.ts:291 | alternate | Exact observed canonical/alternate URL for the inspected outlet |
| tablecheck-browser-availability.ts:309 | reservation.url | Exact selected page's observed target; embedded target is that page itself; no serializer |
| tablecheck-browser-availability.ts:405 | listedOutletUrl | Exact Google/source-bound guide URI or same-run observed entrance ledger; prohibited targets rejected |
| tablecheck-browser-availability.ts:573 | outletUrl | Actual observed search result or retained entrance href; identity still inspected |
| tablecheck-browser-availability.ts:710 | selected.page.url | Previously read and identity-inspected page URL, restored after reading other candidate pages |
| tablecheck-browser-availability.ts:767 | requestedReservationUrl | Now activeSelected.reservation.url exactly; former buildRequestUrl/embedded parameter construction deleted |

Separately, Executor `start` opens only one of the two already approved source-pack startup documents on first use. Model OPEN_LINK uses the current observed target href. Neither is an `observed:true` caller nor a new exception. Serializer references are now B1 handoff reader/tests only; no inventory navigate consumes serialized B1 URLs.

Residual limitation: callers still attest with a boolean; typed SourceObservedUrl generation/validation remains deferred post-3b as requested. This audit does not claim that boolean is a runtime proof.
