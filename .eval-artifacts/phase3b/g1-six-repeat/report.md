# G1 six-question schema3 repeat

Status: executed, awaiting independent reviewer; not an acceptance claim. Vienna CET2026-10-28. Base maineb1518f1 (B quality fix); frozen executiona019d8a3. Product G1 core/Prompt/Schema3 unchanged, original questions/reference/scorer bytes frozen and unchanged.

## Results

18 planned question/repetition trials completed as19 real provider attempts/20 cap:17 responses,2TIMEOUT attempts (Q31-r2-a1/a2). One transport retry, no schema/quality retry. Both attempts retained; Q31-r2 has no valid answer. No website/Google/publicGET/Live/environment rerun. Credentials only by authorized Node --env-file process, no printing/copy/staging.

| Question | Required extra check | Pass / planned3 | Observation |
|---|---|---|---|
| Q07 | English answer |3/3|All cancellation amounts and per-person scope grounded; r2/r3 additionally mention truthful day-before2000 not included in selected quotes: coverage gap retained|
| Q14 | NONE |0/3|All three are bounded NOT_STATED but still classified ALLERGY/confirmationRequired=true|
| Q26 | sourceConflict=true AND confirmationRequired=true |3/3|Both contradicting English/Japanese clauses attributed, no side selected; flags from raw model and accepted core respectively|
| Q27 | NOT_STATED, no review citations |0/3|All three UNVERIFIED/INVALID_MODEL_OUTPUT, no accepted citations; required absence answer not delivered|
| Q31 | Complete original sentence |2/3|Two accepted complete43-character Japanese sentences; r2 initial and one retry TIMEOUT|
| Q33 | English answer |3/3|English prose, Japanese lunch title retained,3300 including service/tax|

Supplementary checks:11PASS/7FAIL across18 planned trials (11/8 across19 attempts). These implement the user's explicit checks separately from the unchanged original scoring contract; they do not override it. Automatic scorer@4 results:0PASS/11FAIL/8NOT_EVALUATED across19 attempts. Q26 fails frozen NONE-based confirmation and inline-confirmation wording checks even though the newly required flags pass. Unknown English paraphrases remain pending; no approved wording was added.

Automatic detected false claims0, but complete automatic count is NOT_EVALUATED (14unknown). Sequential Codex original-source triage found0 false claims, provisional pending independent reviewer. Do not label this new batch final S0=0 or G1 passed. Original102-trial human judgment remains separate84PASS/18FAIL/0false claims and is not overwritten.

[Every attempt and original answers](per-attempt.md), [full citations/flags/diagnostics](per-attempt.json), [summary](summary.json), [raw records](results), [result SHAs](results-sha256.json).

## Attribution

Q14's actual wrong category is directly recorded despite updated prompt; no dietary suitability assertion was emitted. No prompt or product repair was attempted during evaluation.

Q27 raw proposals still answer rather than NOT_STATED. A direct request/response comparison finds selected statement ids such as sen:statement:87/93/97 absent from the observed schema3 sentence ids (which include :sentence:0); corresponding source quote text is present, but ids are invalid. Core rejects before delivery. Per-attempt citation diagnostics preserve id-existence/full-unit/source-role facts; this is an observed contract failure, not an unsupported claim of a provider cache cause. Required comment-free absence answer remains unachieved.

Q31 accepted sentence matches original page text and both independent preceding/ending sentence boundaries. No shared production splitter is used by the supplementary sentence check. Source id role and claim truth remain separate checks. Its second planned repetition has transport failures rather than semantic rejection, and is not counted as a successful sample.

## Four layers / scope

End result:18 planned trials/19attempts,11explicit-check passes with6quality failures and1unresolved transport trial; independent semantic acceptance pending. Steps: saved-page binding and original-byte validation retained, core status/citations, raw model flags, category/language/sentence/absence checks reported per attempt. Severity: no detected false claim; unknown automated claim counts and provisional triage remain explicit. Attribution: category3, invalid citation-id/refusal3, transport2attempts; successful English/complete-sentence/conflict cases require final reviewer judgment. No Agent/Web rendering or fresh-site capability is claimed: read clock and outlet binding are explicitly locally constructed saved-page metadata.

## Freeze and verification

42 input/script/source files SHA-verified before every trial and afterward, including original34-question file, reviewed reference and scorer. Six one-question files preserve original question/page metadata, no wording change. Execution preload denies answer files; independent scorer runs in a separate process after execution. Budget uses a unique namespace, records each provider attempt before dispatch and leaves every original entry intact.

Frozena019d8a3 five gates all PASS: typecheck/arch/build, default1196/1196, Chromium175/175, every gate before/after clean. [Gate receipts](verification). Fixture preflight proves schema3/absence/category/checker wiring; initial relative-import failure fixed before real calls and retained as fixture evidence. New paid entry requires the current manifest (no old-batch fallback); old paid scripts are frozen historical evidence tied to their original Git code, not current executable guidance.

This branch is pushed for review, not merged main. No test deletions here. Broad test-suite audit is now allowed because B G3 started; it is a separate list-first branch and makes no claim of achieved count/time reduction before review and implementation.
