# Choryumon negative-category D1 bounded experiment

- Status: current diagnostic / exposed development data
- Document revision: 0.3
- Baseline: `69af3ce`
- Scope: one candidate's cited type facts and the existing Fact Judgment path; no Semantic, search or availability change

## Frozen evidence, independent expectation and stop rule

The saved H002 result has a HIGH-associated Google-listed website fact for 家寶 跳龍門: its first two source excerpts say Cantonese cuisine and explicitly say the main offering is Cantonese. The Google type is generic Chinese restaurant. The derived `MODEL_JUDGMENT` claims that the venue violates the HARD exclusion “Sichuan/Hunan-style cuisine where spicy food is the main focus,” citing those facts. The cited facts do not say Sichuan/Hunan is its focus; the independent expected label for this criterion is at least **not CONFLICT**. A Cantonese label alone need not prove that it serves no Sichuan/Hunan dishes, so `UNKNOWN` is an acceptable conservative result. A source that actually states a Sichuan/Hunan spicy focus must still be rejected. The existing category contract, not candidate name, determines these labels.

The original `modelInvocations` entry records Prompt@8, schema@2 and success, but not raw model response. The historical derived evidence cannot distinguish a bad model judgment from a conversion bug. First reconstruct the exact saved candidate, intent and source facts from the immutable H002 event, run one new fixed-source Prompt@8 judgment, and preserve both exact model request and raw output in a new diagnostic artifact. Budget: one DeepSeek provider attempt, zero retries, zero browser/Google calls, no external write. The run is **new fixed-source model diagnosis**, not original-output replay. If credentials or provider are unavailable, stop and mark uncovered. Do not alter Prompt, conversion or evaluator until the first failure layer is clear.

Evaluator reuse: independently compare the raw criterion outcome/citation with the cited source text and the emitted `violatedNegativeCriteria`; existing category-evaluation rules remain unchanged. This small judgment cannot establish overall H002 delivery or real-site freshness.

## First diagnostic result

The one-attempt [new fixed-source result](../../.eval-artifacts/restaurant-fact-targeted/choryumon-2026-09-24T08-05-25-800Z.result.json) used the H002 event's exact candidate, intent and four source evidence records under Prompt@8/schema@2. Raw output returned `UNKNOWN` for hot-pot but `CONFLICT` for the Sichuan/Hunan spicy-focus exclusion, citing only the Cantonese website fact. The current conversion then emitted the same `violatedNegativeCriteria`. This reproduces the unsupported exclusion with a new model call. It establishes the first failure at model interpretation, not a field-mapping bug. The historical invocation does not retain raw output, so the new response cannot be called its replay.

## Next local correction budget and acceptance

Only the Fact Judgment instruction for negative category conflict may change: `CONFLICT` requires cited source facts positively identifying the excluded type or cuisine; a broad parent or a different regional cuisine is insufficient. Keep schema, criteria, evidence association, thresholds, Semantic Interpreter and Domain eligibility unchanged. Predeclared controls: saved Cantonese fact must not produce `CONFLICT`; a synthetic explicit Sichuan/Hunan spicy-focus fact must produce `CONFLICT`; a broad `chinese restaurant` fact must remain `UNKNOWN`. Allow one provider attempt per control, at most three new attempts and no retry, browser or Google. Reuse the existing model judgment path and independently inspect raw outputs and emitted claims. If target remains wrong or either safety control regresses, stop this prompt candidate and do not claim D1 fixed. Even three passing calls would establish only this bounded judgment mechanism, not H002 completion or broad prompt acceptance.

## Prompt candidate result and rollback

A temporary Prompt@9 candidate strengthened only the generic `CONFLICT` instruction. The [three-attempt control artifact](../../.eval-artifacts/restaurant-fact-targeted/choryumon-controls-2026-09-24T08-07-57-020Z.result.json) records raw model responses and converted claims. The saved Cantonese case changed from `CONFLICT` to `SUPPORTED` and produced `verifiedNegativeCriteria`; the explicit synthetic Sichuan/Hunan spicy-focus control remained `CONFLICT`, and the broad Chinese control returned `UNKNOWN`. Although the narrow “no false conflict” check improved, a different regional main cuisine is insufficient by the current overlap-aware category contract to certify the negative exclusion. The model has shifted to an unsupported positive exclusion conclusion. The Prompt@9 candidate was rolled back under the predeclared stop rule. The production Prompt remains @8; no test threshold or historic artifact was rewritten.

**D1 verdict: the source-to-model judgment failure is reproduced and localized, but not repaired.** The next D1 design must distinguish explicit conflict, explicit source exclusion and insufficient different-category evidence without treating a cuisine difference as either automatic violation or proof of absence. Model raw outputs, conversion and final candidate eligibility are separate checks; D2 and D3 should not inherit this unaccepted Prompt candidate.
