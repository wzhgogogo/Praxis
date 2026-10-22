# Context@15 selection recheck

- Evidence: real model / frozen historical source inputs; exposed development set, not end-to-end or website verification.
- Freeze:1c08f4c;5 calls,0 websites/Google/actions/Live. Existing DeepSeek API, each seed once, no reruns. All305 frozen hashes passed before/after the paid run.
- Automatic approval initially rejected the specific transfer; public payload audit committed before calls and the human then explicitly approved exactly these5 requests to https://api.deepseek.com.

| Seed | Action | Selected restaurants | Direct / selected | Independent verdict |
| --- | --- | --- | --- | --- |
| p1-seed-0133 | CHECK_AVAILABILITY | Sushi Teppen | 1/1 | ACCEPTABLE |
| p1-seed-0134 | CHECK_AVAILABILITY | Sumi Sushi Shibuya / Shibuya Sushi Jinnan / Sushi kazumasa | 3/3 | ACCEPTABLE |
| p22-selection-001 | CHECK_AVAILABILITY | Kagurazaka Jin / Sugata / 日本料理 ほそ川 神楽坂 | 3/3 | ACCEPTABLE |
| p22-selection-002 | CHECK_AVAILABILITY | Sumi Sushi Shibuya / Sushi kazumasa / Shibuya Sushi Jinnan | 3/3 | ACCEPTABLE |
| p22-selection-003 | CHECK_AVAILABILITY | Sumi Sushi Shibuya / Shibuya Sushi Jinnan / Sushi kazumasa | 3/3 | ACCEPTABLE |

**Gate PASS:** Kagurazaka1/1; Shibuya3/3 (required2);0133 ACCEPTABLE. Direct selections13/13. The three Shibuya seeds are near-duplicates of one scenario.

Current production Prompt@27 and Context@15 were used. Historical event prefixes are replayed to stateVersionBefore to project source-attributed observedFacts. Dates, party, area, candidate order and previous legal scope remain captured; the existing shared DIRECT scope is applied. No future observations or reviewer labels enter a model request.

**Price limit:** all five historical turns precede any retained price fact/commercial note. No prices were invented. This proves compatibility of the combined schema and current prompt for these decisions; it does not prove selection under nonempty price notes.

Four-layer: outcome NOT_EVALUATED (no task execution); selection stage ACCEPTABLE under original independent revision2 labels; no displayed claims/actions, full-task S0–S4 NOT_EVALUATED; no inventory/delivery or generalization claim. Raw requests/results, SHA freeze, payload audit and usage ledger are retained here.

The later benchmark-specific eval admission/status changes do not alter production selection; old request hashes are interpreted at1c08f4c, not rewritten.
