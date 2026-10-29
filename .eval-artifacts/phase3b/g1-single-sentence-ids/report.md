# G1 single-sentence IDs: offline repair

2026-10-29T03:38:46.653755+01:00, Vienna CET (UTC+1). Base main `795d35d3660cb8d3bb3b0579f85d6d6bc42926ab`; work branch `codex/fix-phase3b-g1-single-sentence-ids`. User approves main integration after five green gates, separate from unfinished G3.

## Change and scope

Only lines that actually split into multiple sentences receive `:sentence:N`. A single sentence or intact table line retains its original statement ID. This fixes the Q27 refusal mechanism without accepting aliases or adding a compatibility path. The model still must quote the entire statement verbatim after whitespace normalization; multi-sentence paragraphs cannot be cited through the parent ID.

The executable change is confined to `src/integrations/restaurant-facts/model-page-question.ts`, plus its existing test file. Prompt/Schema remain 3; Agent Prompt, Action Schema, Context, State and TaskDefinition are unchanged. Shared HARD segmentation/selection, identity, review exclusion, Guard, A/C files and private answer data are unchanged.

## Effective red and green

Frozen old-product commit `8d568072` gives a target assertion failure: a fixture response quoting a complete statement with the literal parent ID returns UNVERIFIED instead of ANSWERED. This uses an independent literal ID, rather than selecting whatever ID production emits. Red fixture run: 0/1; no environment or startup failure. [Red evidence](red/receipt.json).

Repair `e8e1bb29` turns the same assertion green. The complete G1 file passes 45/45. English sentences, a Japanese table line and a decimal-containing line retain parent IDs. A partial quotation is rejected; a split paragraph's parent ID is rejected; its complete sentence with the proper suffix is accepted. Existing identity, cancellation, comment exclusion and other G1 controls stay active. [Green evidence](green/receipt.json).

This is a fixture mechanism repair, not a rerun or self-scoring of the real-model QA set. No real-model quality improvement is claimed here.

The old full HARD result was recorded before the source change and compared byte-for-byte afterward: 44,197 bytes, SHA-256 `9a3298bc5e004b99e41d80713e8913b68c336cfa594f6eb60599e310ee3fb633`. Comparison includes documents, model input, evidence, checks and deterministic metadata. [Preservation proof](preservation.json).

## Five gates and ordinary G2

Frozen tested commit `e8e1bb2936a186402f7fc3bbe8931862eb87756b`; 684 input paths, green manifest SHA-256 `ab08135c90c485cb35aa887357542055d4cd08445ea9d9c8c73c15a6ba2074d9`. Source and outer scripts were committed before execution.

| Gate | Result | Seconds |
|---|---|---:|
| typecheck | PASS | 0.504 |
| arch-check | PASS | 0.232 |
| npm-test | PASS (1201/1201) | 29.319 |
| build | PASS | 0.558 |
| browser-fixture | PASS (174/174) | 109.000 |
| dom-change | PASS (4/4) | 21.999 |

All six commands started and ended with clean git status; frozen inputs unchanged, file restorations 0, failed gate repairs 0. The Chromium suite uses four-way concurrency and local fixtures. [Gate receipt](verification/gates.json).

Ordinary G2 passing is separate from G3 strict acceptance. G3 remains on its work branch with the Sen query-confirmation evidence issue; this G1 repair does not change that baseline.

## Cost and integration

All 465 pre-existing ledger entries are retained by id; one zero-call entry is appended (466 total). Cumulative spend is unchanged. New real model, Google, website, Live, public GET and environment calls: 0. No `.env` or `answers*.json` read. Validation here is macOS, not an independent Linux rerun.

Publish this work branch and the user-approved main integration, verify with `ls-remote`, then return to the G3 branch. Main integration SHA is reported after publication. No G3 changes are included in this fix branch.
