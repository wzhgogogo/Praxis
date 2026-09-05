# Praxis v16 — Clean Semantic Holdout Baseline Plan

## Goal

Use the 15 manually annotated restaurant sessions/cases as the first **Clean Holdout Baseline** for the v16 Semantic Parser.

Core rule:

> Human annotation does not contaminate a holdout.
> The holdout becomes exposed only after its concrete cases/results are used to tune Prompt, Contract, Parser implementation, or scorer behavior.

Therefore:

- The 15 cases remain `CLEAN_HOLDOUT` before the first real evaluation.
- v16 should be aligned to the **abstract annotation specification** agreed during annotation.
- Codex must not inspect individual holdout cases and then introduce case-specific fixes before the first baseline.
- The first real DeepSeek run is one-time.
- After that run, the dataset becomes `EXPOSED` and must not be reused as a clean holdout.

---

# 1. Preserve the annotated private dataset

Locate the user's completed local annotation file.

Copy it to the v16 private holdout path:

```text
.eval-private/restaurant-semantic-holdout-v2.json
```

Requirements:

- keep the file private and gitignored;
- do not commit it;
- verify with `git status`;
- preserve the user's semantic annotations;
- do not silently rewrite Gold meaning.

Frozen metadata:

```text
referenceTime = 2026-08-20T09:00:00+09:00
timezone = Asia/Tokyo
```

---

# 2. Align v16 to the abstract semantic spec

Do this **without tuning against individual holdout examples**.

The completed annotation work established the following general semantic rules.

## Criteria contract

Use:

```text
polarity:
- POSITIVE
- NEGATIVE

strength:
- HARD
- SOFT
- UNSPECIFIED
```

Meaning:

```text
HARD
= violating this would make the result materially wrong for the user.

SOFT
= an explicit preference / approximation that can be traded off.

UNSPECIFIED
= use only when strength is genuinely not expressed or inferable.
```

The current v16 contract uses:

```text
REQUIRED / PREFERRED / UNSPECIFIED
```

Replace it consistently with:

```text
HARD / SOFT / UNSPECIFIED
```

Update:

```text
src/domains/restaurant/contracts.ts
src/domains/restaurant/semantic-proposal.ts
src/domains/restaurant/semantic-interpreter.ts
src/domains/restaurant/semantic-compiler.ts
validators
JSON schema
fixtures/regression
scorer
docs
```

If necessary, bump prompt/schema versions consistently.

Do not keep lexical-only rules such as:

```text
must/no => REQUIRED
ideally/prefer => PREFERRED
everything else => UNSPECIFIED
```

Prompt should instead ask the model to interpret user intent semantically.

---

# 3. Apply the agreed general extraction rules

These are product-level rules, not holdout-specific patches.

## Party size

Party size may be inferred when the number of diners is strongly implied by the conversation.

Examples of the abstract rule:

```text
explicit total count -> extract
clear closed participant set -> may infer
genuinely ambiguous group size -> leave unknown
```

Do not restrict extraction to explicit numeric totals only.

## Relative time

Normalize relative time against:

```text
2026-08-20T09:00:00+09:00
Asia/Tokyo
```

Support ordinary user semantics such as:

```text
today
tonight
tomorrow
this Friday
this Saturday
after work
afternoon
evening
night
right now
in about N minutes
```

Time windows represent acceptable search windows, not necessarily the final booking slot.

General normalization policy already agreed:

```text
afternoon -> 13:00-17:00
after work -> 18:00-20:00
evening -> 18:00-21:00
night -> 19:00-22:00
dinner -> 18:00-21:00
right now -> reference time
```

Do not add per-case special handling.

## Location

Preserve relative location intent:

```text
nearby
near me
near our office
near my hotel
```

Do not force Parser to ask for a literal district when a relative location is already meaningful.

Preserve multi-anchor location semantics instead of inventing a midpoint district.

## Budget

Approximate language such as:

```text
around 3,000 yen per person
around 10,000 yen per person
```

should remain a SOFT semantic preference unless the user clearly expresses a hard maximum.

Do not automatically convert every approximate budget into a hard `budgetPerPerson.max`.

## Multi-turn state

Support general state behavior:

```text
persistence
correction
overwrite
refinement
criterion addition
criterion removal
party-size update
location update
time update
```

Do not special-case specific holdout IDs.

---

# 4. Keep the holdout Gold format, adapt the evaluator if needed

The manually annotated file is the semantic source of truth.

Its simplified annotation fields include:

```text
content
criteria
date
timeWindow
partySize
area
missingRequiredFields
decision
```

and multi-turn:

```text
turns[]
```

If the existing evaluator expects:

```text
message
expectedDraft
expectedDecision
```

add a deterministic eval-side adapter.

Allowed structural normalization:

```text
content -> message
area string -> { query: string }
exact HH:mm -> { earliest: HH:mm, latest: HH:mm }
ASK -> { type: ASK_USER, missingRequiredFields: [...] }
SEARCH -> { type: SEARCH }
```

This adapter must not change semantic meaning.

Do not force the user to manually rewrite all 15 annotations into an older evaluator wrapper.

---

# 5. Update exposed development regression first

Before touching the clean holdout with a real model:

Update the existing exposed regression set to cover the new general contract.

Use new synthetic/dev examples, not the 15 holdout messages verbatim.

Regression should cover at least:

```text
HARD criterion
SOFT criterion
negative criterion
relative time
party-size inference
multi-turn correction
criterion removal
location overwrite
```

Then run:

```bash
npm run typecheck
npm test
npm run arch:check
npm run build
npm run eval:semantic:fixture
```

Fix implementation issues using regression/dev data only.

---

# 6. Run real DeepSeek regression smoke

Before the clean holdout baseline, verify v16 transport and schema against exposed regression data:

```bash
PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 \
DEEPSEEK_MODEL=deepseek-v4-flash \
npm run eval:semantic:deepseek
```

This smoke validates:

```text
Prompt
structured transport
schema
compiler
runtime
kernel
```

It must not read the private holdout.

If this smoke fails, fix the issue using exposed regression data only.

---

# 7. Preflight the private holdout

Run:

```bash
npm run eval:semantic:holdout:preflight
npm run eval:semantic:holdout:preflight:complete
```

Verify:

```text
dataset id/version
reference time
timezone
session count
turn count
unique IDs
valid criteria
valid date/time/partySize/area
ASK/SEARCH consistency
multi-turn cumulative state
```

At this point the private dataset must still be classified:

```text
CLEAN_HOLDOUT
```

Do not inspect individual expected-vs-actual model failures because the real holdout run has not happened yet.

---

# 8. Freeze implementation before baseline

Before the first holdout run:

- freeze Prompt;
- freeze Proposal schema;
- freeze criterion contract;
- freeze scorer;
- freeze DeepSeek model/config;
- confirm regression smoke passes;
- confirm complete preflight passes.

Do not change implementation based on concrete holdout cases before the first run.

---

# 9. Run the Clean Holdout Baseline exactly once

Use the existing holdout runner.

Required configuration:

```bash
PRAXIS_CONFIRM_CLEAN_HOLDOUT=1 \
DEEPSEEK_MODEL=deepseek-v4-flash \
npm run eval:semantic:holdout
```

If `PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT` is required, set it to the exact total turn count.

Important:

```text
The first started real holdout run exposes this dataset.
```

Even if the run fails after model invocation begins, do not treat the same dataset version as clean again.

Store the structured baseline artifact under:

```text
.eval-artifacts/restaurant-semantic-holdout/
```

---

# 10. Analyze the exposed baseline

After the first run, change conceptual status to:

```text
EXPOSED
not reusable as CLEAN_HOLDOUT
```

Now it is allowed to inspect individual failures.

For every failed turn record:

```text
session / turn
input
expected
actual
first meaningful mismatch
failure category
severity
notes
```

Classify first meaningful failure as:

```text
A. Model semantic error
B. Prompt policy gap
C. Contract/compiler limitation
D. Evaluator/scoring mismatch
E. Readiness/kernel mismatch
```

Score by dimension:

```text
criteria identity
polarity
strength
date
timeWindow
partySize
area
multi-turn state
ASK/SEARCH
```

Do not report only full-turn exact-match accuracy.

---

# 11. Decide whether Parser v16 can close

Return one recommendation:

```text
CLOSE_PARSER_AND_MOVE_TO_E2E
```

if most normal semantics work and failures are sparse/edge-case.

Otherwise:

```text
ONE_TARGETED_PARSER_FIX_FIRST
```

only if there is a clear systematic issue such as:

```text
relative time broadly fails
negative criteria broadly fail
HARD/SOFT broadly drift
party-size inference broadly fails
multi-turn overwrite broadly fails
```

After any fix based on this holdout:

- reruns may be useful as regression/acceptance evidence;
- they must not be called a new clean baseline.

If independent post-fix generalization evidence is required, create a new unseen holdout version.

---

# Deliverables

Report:

1. files changed;
2. abstract semantic contract changes;
3. confirmation private holdout is ignored/untracked;
4. exposed regression results;
5. real DeepSeek regression smoke result;
6. holdout preflight session/turn counts;
7. clean baseline result;
8. baseline artifact path;
9. failed-turn breakdown;
10. top systematic issues;
11. recommendation:
   - `CLOSE_PARSER_AND_MOVE_TO_E2E`
   - or `ONE_TARGETED_PARSER_FIX_FIRST`
