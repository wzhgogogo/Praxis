# G6 fixed-context decision replay: every physical call

2026-11-02 Vienna CET. Draft, pending independent review. Inputs committed before transmission in d043aef7, SHA256 6062a3a7fca5f36c2d02c059a531db5463fc7ed5103835f38fcd7610c150d900.

57 physical calls, no retry. 52 within frozen action/field expectations; 5 deviations. No Live, restaurant GET or Google transmission. Each original request/response is retained.

Original automatic scores are unreliable: A confused Agent type/action, party supplement/source selections, and absent cancel/card policy with the unrelated private-room sentence. Original report.json and score-correction.json remain unchanged; contract-audit.json records the correction based only on pre-paid committed fixture contracts/pages. It does not relax required schemaVersion or the four failed SELECT expectations. No paid replay was repeated.

Each subsequent context is the scripted successful trajectory, not a consequence of the real previous response. This proves choices on fixed observations, not autonomous end-to-end success. G1 paraphrase meaning remains for independent reviewer.

| Call | Turn / purpose | Frozen expectation | Actual choice / status | Contract check |
|---|---|---|---|---|
| P1-0-1 | INITIAL / restaurant_semantic_interpret | SEMANTIC | SEMANTIC_OR_FACT_SELECTION | PASS |
| P1-0-2 | INITIAL / restaurant_agent_decide | SEARCH_RESTAURANTS | SEARCH_RESTAURANTS | PASS |
| P1-0-3 | INITIAL / restaurant_agent_decide | CHECK_AVAILABILITY | CHECK_AVAILABILITY | PASS |
| P1-0-4 | INITIAL / restaurant_agent_decide | PRESENT_RESULTS | PRESENT_RESULTS | PASS |
| P1-0-5 | BOOK_DISPLAYED / restaurant_semantic_interpret | SEMANTIC | SEMANTIC_OR_FACT_SELECTION | PASS |
| P1-0-6 | BOOK_DISPLAYED / restaurant_agent_decide | SEARCH_RESTAURANTS | SEARCH_RESTAURANTS | PASS |
| P1-0-7 | BOOK_DISPLAYED / restaurant_agent_decide | CHECK_AVAILABILITY | CHECK_AVAILABILITY | PASS |
| P1-0-8 | BOOK_DISPLAYED / restaurant_agent_decide | SELECT_CANDIDATE | PRESENT_RESULTS | FAIL |
| P1-0-9 | BOOK_DISPLAYED / restaurant_agent_decide | PRESENT_RESULTS | PRESENT_RESULTS | PASS |
| P1-0-10 | BOOK_DISPLAYED / restaurant_page_question | NOT_STATED | NOT_STATED | PASS |
| P1-0-11 | BOOK_DISPLAYED / restaurant_page_question | NOT_STATED | NOT_STATED | PASS |
| P1-1-1 | INITIAL / restaurant_semantic_interpret | SEMANTIC | SEMANTIC_OR_FACT_SELECTION | PASS |
| P1-1-2 | INITIAL / restaurant_agent_decide | SEARCH_RESTAURANTS | SEARCH_RESTAURANTS | PASS |
| P1-1-3 | INITIAL / restaurant_agent_decide | CHECK_AVAILABILITY | CHECK_AVAILABILITY | PASS |
| P1-1-4 | INITIAL / restaurant_agent_decide | PRESENT_RESULTS | PRESENT_RESULTS | PASS |
| P1-1-5 | BOOK_DISPLAYED / restaurant_semantic_interpret | SEMANTIC | SEMANTIC_OR_FACT_SELECTION | PASS |
| P1-1-6 | BOOK_DISPLAYED / restaurant_agent_decide | SEARCH_RESTAURANTS | SEARCH_RESTAURANTS | PASS |
| P1-1-7 | BOOK_DISPLAYED / restaurant_agent_decide | CHECK_AVAILABILITY | CHECK_AVAILABILITY | PASS |
| P1-1-8 | BOOK_DISPLAYED / restaurant_agent_decide | SELECT_CANDIDATE | PRESENT_RESULTS | FAIL |
| P1-1-9 | BOOK_DISPLAYED / restaurant_agent_decide | PRESENT_RESULTS | PRESENT_RESULTS | PASS |
| P1-1-10 | BOOK_DISPLAYED / restaurant_page_question | NOT_STATED | NOT_STATED | PASS |
| P1-1-11 | BOOK_DISPLAYED / restaurant_page_question | NOT_STATED | NOT_STATED | PASS |
| P1-2-1 | INITIAL / restaurant_semantic_interpret | SEMANTIC | SEMANTIC_OR_FACT_SELECTION | PASS |
| P1-2-2 | INITIAL / restaurant_agent_decide | SEARCH_RESTAURANTS | SEARCH_RESTAURANTS | PASS |
| P1-2-3 | INITIAL / restaurant_agent_decide | CHECK_AVAILABILITY | CHECK_AVAILABILITY | PASS |
| P1-2-4 | INITIAL / restaurant_agent_decide | PRESENT_RESULTS | PRESENT_RESULTS | PASS |
| P1-2-5 | BOOK_DISPLAYED / restaurant_semantic_interpret | SEMANTIC | SEMANTIC_OR_FACT_SELECTION | PASS |
| P1-2-6 | BOOK_DISPLAYED / restaurant_agent_decide | SEARCH_RESTAURANTS | SEARCH_RESTAURANTS | PASS |
| P1-2-7 | BOOK_DISPLAYED / restaurant_agent_decide | CHECK_AVAILABILITY | CHECK_AVAILABILITY | PASS |
| P1-2-8 | BOOK_DISPLAYED / restaurant_agent_decide | SELECT_CANDIDATE | PRESENT_RESULTS | FAIL |
| P1-2-9 | BOOK_DISPLAYED / restaurant_agent_decide | PRESENT_RESULTS | PRESENT_RESULTS | PASS |
| P1-2-10 | BOOK_DISPLAYED / restaurant_page_question | NOT_STATED | NOT_STATED | PASS |
| P1-2-11 | BOOK_DISPLAYED / restaurant_page_question | NOT_STATED | NOT_STATED | PASS |
| P2-0-1 | INITIAL / restaurant_semantic_interpret | SEMANTIC | SEMANTIC_OR_FACT_SELECTION | PASS |
| P2-0-2 | INITIAL / restaurant_agent_decide | SEARCH_RESTAURANTS | SEARCH_RESTAURANTS | PASS |
| P2-0-3 | INITIAL / restaurant_agent_decide | PRESENT_RESULTS | PRESENT_RESULTS | PASS |
| P2-0-4 | BOOK_DISPLAYED / restaurant_semantic_interpret | SEMANTIC | SEMANTIC_OR_FACT_SELECTION | FAIL |
| P2-0-5 | BOOK_DISPLAYED / restaurant_party_size_supplement | UNKNOWN/0 | UNKNOWN | PASS |
| P2-0-6 | BOOK_DISPLAYED / restaurant_agent_decide | ASK_USER | ASK_USER | PASS |
| P2-0-7 | ADD_PARTY / restaurant_semantic_interpret | SEMANTIC | SEMANTIC_OR_FACT_SELECTION | PASS |
| P2-0-8 | ADD_PARTY / restaurant_agent_decide | SEARCH_RESTAURANTS | SEARCH_RESTAURANTS | PASS |
| P2-0-9 | ADD_PARTY / restaurant_agent_decide | CHECK_AVAILABILITY | CHECK_AVAILABILITY | PASS |
| P2-0-10 | ADD_PARTY / restaurant_agent_decide | SELECT_CANDIDATE | PRESENT_RESULTS | FAIL |
| P2-0-11 | ADD_PARTY / restaurant_agent_decide | PRESENT_RESULTS | PRESENT_RESULTS | PASS |
| P2-0-12 | ADD_PARTY / restaurant_page_question | NOT_STATED | NOT_STATED | PASS |
| P2-0-13 | ADD_PARTY / restaurant_page_question | NOT_STATED | NOT_STATED | PASS |
| P3-0-1 | INITIAL / restaurant_semantic_interpret | SEMANTIC | SEMANTIC_OR_FACT_SELECTION | PASS |
| P3-0-2 | INITIAL / restaurant_agent_decide | ASK_USER | ASK_USER | PASS |
| P3-0-3 | ADD_DATE / restaurant_semantic_interpret | SEMANTIC | SEMANTIC_OR_FACT_SELECTION | PASS |
| P3-0-4 | ADD_DATE / restaurant_agent_decide | SEARCH_RESTAURANTS | SEARCH_RESTAURANTS | PASS |
| P3-0-5 | ADD_DATE / restaurant_agent_decide | CHECK_AVAILABILITY | CHECK_AVAILABILITY | PASS |
| P3-0-6 | ADD_DATE / restaurant_agent_decide | PRESENT_RESULTS | PRESENT_RESULTS | PASS |
| P4-0-1 | INITIAL / restaurant_semantic_interpret | SEMANTIC | SEMANTIC_OR_FACT_SELECTION | PASS |
| P4-0-2 | INITIAL / restaurant_agent_decide | SEARCH_RESTAURANTS | SEARCH_RESTAURANTS | PASS |
| P4-0-3 | INITIAL / restaurant_agent_decide | CHECK_AVAILABILITY | CHECK_AVAILABILITY | PASS |
| P4-0-4 | INITIAL / restaurant_agent_decide | PRESENT_RESULTS | PRESENT_RESULTS | PASS |
| P4-0-5 | G1_QUESTION / restaurant_page_question | ANSWERED | ANSWERED | PASS |

No path skipped: all scripted compositions passed before paid capture. Five deviations remain unmodified for review: P1-0-8, P1-1-8, P1-2-8, P2-0-10 choose PRESENT_RESULTS instead of SELECT_CANDIDATE; P2-0-4 omits required schemaVersion. No schema or transport retry. No Live claim or paid quality signoff.
