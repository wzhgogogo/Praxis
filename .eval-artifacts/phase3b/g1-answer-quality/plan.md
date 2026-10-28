# G1 answer quality: offline repair slice

2026-10-28, Vienna CET (UTC+1). Evidence: exposed development regressions, not a clean evaluation.

Base: latest origin/main fae69b48e541bef258b0c463d8d131ea46012b49, containing C b250bb17. Branch: codex/fix-phase3b-g1-answer-quality.

Promise: English questions no longer accept predominantly Japanese answers; complete sentences inside long source paragraphs can be quoted; review-only information is treated as NOT_STATED; source conflicts require restaurant confirmation; dietary preferences are distinguished from allergies in the independent question prompt.

Only restaurant_page_question Prompt/Schema advance 2→3. Agent29/Action5/Context17/State24/TaskDefinition22 remain unchanged. The model-only sourceConflict flag derives the existing confirmationRequired field; no new persistent result shape. HARD segmentation and outputs remain unchanged. No site, Guard, identity, semantic or product action changes.

Red/green: reuse source pages referenced by the six public questions, extracting minimal exact text nodes with URL/date/SHA provenance into module fixtures. Fixture transmissions test the two deterministic fixes, conflict derivation and prompt contracts. They cannot establish improved real-model quality. A independently reruns the six affected questions after review/merge. No answers or answer-bearing generators are read.

Freeze tests, inputs and orchestration before red and final gates. Five gates require clean git before/after each; add ordinary G2 and full serialized HARD byte comparison. Retain raw logs outside the checkout during execution, then commit receipts. No silent skip, checkout restoration or assertion reduction.

Cross-owner dependency: Schema3 requires A's core-adapter fixture transmission to emit sourceConflict:false. User explicitly approved synchronizing only that field and the adapter version in src/eval/restaurant/fact-qa/core-adapter.ts. Include its entire diff in the report, labelled “经用户授权，跨归属同步 A 的 fixture”. Scorer, Gold, QA answers and A's other files stay untouched.

Stop for review after pushing this G1 branch. G3 has its own latest-main branch and evidence; it cannot be claimed complete through this repair. No model/Google/site/Live calls; no .env reads. Preserve all existing shared ledger ids and add this batch's zero row.
