# User scanner audit

Status: draft / not integrated. Range f8c99318..b54e629d; no product changes after this scan. Exact user script is ../scan-hardcoded.sh; raw output is hardcoded-scan.txt. Five hits, all manually reviewed:

| Hit | Allowed category and reason |
|---|---|
| core/text-key.ts:3 REGEX | Result/identity comparison: existing whitespace normalization moved unchanged from outletNameKey so browser query binding uses the same NFKC, space and case rule. No words or labels. |
| tabelog-browser-availability.ts:443 URL/PATH | Existing source security range passed to the ordinary observation loop after explicit human verification. This is allowedOrigins; it constructs no destination, input or next action. |
| tablecheck-browser-availability.ts:448 SITE-BRANCH | Policy/result diagnostic distinguishes a prohibited exact observed target from parse failure, without navigating to it. |
| tablecheck-browser-availability.ts:491 SITE-BRANCH | Existing reviewed search failure diagnostic. Records non-COMPLETED outcome; does not select controls or claim inventory. |
| tablecheck-browser-availability.ts:664 SITE-BRANCH | Same prohibited-target result classification for the search path; Guard denial remains unchanged. |

No new product vocabulary, literal-label matching, selector, private marker, URL template or fixed action sequence. Source startup exception remains the two previously approved pack entries. Existing source ID parsing/normalization and B1 serializer are unchanged except deletion of the embedded inventory serializer. Scanner findings are not by themselves a proof of safety; behavior/Guard and source provenance tests remain separate.
