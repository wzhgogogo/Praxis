# Hardcoded scan audit

Command: `bash scan-hardcoded.sh f8c99318 HEAD`. Current product candidate88ca2ded. Six hits; no unexplained exception.

| Hit | Classification / justification |
|---|---|
| core/text-key.ts:3 | Existing shared NFKC/whitespace identity/result comparison, no vocabulary. |
| browser-task-executor.ts:1132 | Native HTML element-type check (INPUT/TEXTAREA) plus readonly rejection: action legality and prevention of writing to noneditable controls. This is the existing DOM tag universe, not restaurant/region/button words. The added readonly check narrows writing; it chooses no target or action. |
| tabelog-browser-availability.ts:443 | Existing source allowedOrigins security range in public search. No URL generation or navigation choice. |
| tablecheck-browser-availability.ts:448 | Result/failure diagnostic for a policy-prohibited target. |
| tablecheck-browser-availability.ts:491 | Result/failure diagnostic for uncompleted source search. |
| tablecheck-browser-availability.ts:664 | Result/failure diagnostic for a policy-prohibited target. |

Only the readonly line is additional to the prior711eebc7 scanner output. Remaining hits are the previously reviewed changes. New form proof uses native DOM/FormData/ownership and exact value multiset checks. Native location text uses Intl.Segmenter with the actual requested name, no station suffixes/aliases/literal name regex. Browser guidance is a model instruction; no fixed click/fill controller is introduced. Eval-only receiver rules are independent frozen read contracts, never imported into production Guard. Model endpoint whitelist is eval-only provider confinement, not a source navigation path.
