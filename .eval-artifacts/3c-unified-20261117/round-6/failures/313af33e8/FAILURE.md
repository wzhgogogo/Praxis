# First frozen gate failure

Frozen SHA: 313af33e8d0a164fcb0492db636d320ce35dc9f8.
Typecheck and architecture pass; npm test1749/1750, first failure at local-web-server.test.ts723.
No browser fixture gate, build or formal visuals ran after this failure.

The added assertion incorrectly equated fact-refresh routing with a mandatory new fact transport call. The existing six-candidate fixture can present the other three already-qualified candidates after refreshing/invalidation of the displayed batch. Correct contract: persistent CANDIDATE_FACTS_REFRESH_REQUESTED event and zero availability calls; no assertion on extra source work. Only this new test oracle changes; product implementation and prior assertions remain unchanged. Full original logs/exit/duration/manifest and immutable Git source SHA retained. A new clean freeze must rerun all five gates.
