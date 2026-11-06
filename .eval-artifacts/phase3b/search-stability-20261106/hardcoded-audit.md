# Hardcoded scan audit

Candidate4a6097fd. Run the user-provided scan from f8c99318 (seven hits) and this slice's base c54808e5 (one hit); raw outputs preserved beside this report.

| Hit from f8c99318 | Allowed category / reason |
|---|---|
| core/text-key.ts:3 | Identity/result normalization: existing generic NFKC and whitespace, no word list. Previously reviewed. |
| browser-task-executor.ts:1132 | Action legality: native HTML INPUT/TEXTAREA and readonly, no page-specific selector or label. Previously reviewed. |
| native-restaurant-search.ts:94 | Result verification: requested generic NFKD combining-mark removal and Intl.Segmenter. The Unicode property M is not a station/name/cuisine vocabulary. **Only new hit in this slice.** |
| tabelog-browser-availability.ts:443 | Existing allowedOrigins security range; no generated URL or navigation choice. Previously reviewed. |
| tablecheck-browser-availability.ts:448 | Existing result diagnostic for a policy-prohibited target. Previously reviewed. |
| tablecheck-browser-availability.ts:491 | Existing incomplete search result diagnostic. Previously reviewed. |
| tablecheck-browser-availability.ts:664 | Existing result diagnostic for a policy-prohibited target. Previously reviewed. |

The only product file changed since c54808e5 is native-restaurant-search.ts. It adds source-name normalization and progress/result verification. No website-specific branches, label regex, word lists, URL templates, private selectors, or fixed action sequences. The new full query URL is only in the explicitly constructed evaluation fixture, not product code. Read-rule literals are evaluation-owned approved-contract evidence, never production admission generation.

No unexplained exception requested. Original log whitespace is retained verbatim as audit evidence; source diff whitespace check excludes raw .log files.
