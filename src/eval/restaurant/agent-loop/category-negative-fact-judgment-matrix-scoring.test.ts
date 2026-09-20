import assert from "node:assert/strict";
import test from "node:test";
import { scoreCategoryNegativeMatrixRun } from "./category-negative-fact-judgment-matrix-scoring.js";

const response = (outcome: string) => ({ finishReason: "TOOL_CALLS" as const, outputText: JSON.stringify({ judgments: [{ criterion: "fast food", outcome, scope: "RESTAURANT_CATEGORY_TYPE", evidenceIds: ["raw"] }] }) });
test("category matrix scoring independently requires cited conflict or unknown-without-verified-negative", () => {
  assert.equal(scoreCategoryNegativeMatrixRun({ expected: "BLOCKED", response: response("CONFLICT"), criterion: "fast food", sourceEvidenceIds: ["raw"], verifiedNegativeCriteria: [], violatedNegativeCriteria: ["fast food"], categoryUnknownNegativeCriteria: [], supportingEvidenceIds: ["raw"] }).passed, true);
  assert.equal(scoreCategoryNegativeMatrixRun({ expected: "ELIGIBLE_UNKNOWN", response: response("UNKNOWN"), criterion: "fast food", sourceEvidenceIds: ["raw"], verifiedNegativeCriteria: [], violatedNegativeCriteria: [], categoryUnknownNegativeCriteria: ["fast food"], supportingEvidenceIds: ["raw"] }).passed, true);
  assert.equal(scoreCategoryNegativeMatrixRun({ expected: "ELIGIBLE_UNKNOWN", response: response("UNKNOWN"), criterion: "fast food", sourceEvidenceIds: ["raw"], verifiedNegativeCriteria: ["fast food"], violatedNegativeCriteria: [], categoryUnknownNegativeCriteria: ["fast food"], supportingEvidenceIds: ["raw"] }).passed, false);
  assert.equal(scoreCategoryNegativeMatrixRun({ expected: "ELIGIBLE_UNKNOWN", response: { finishReason: "TOOL_CALLS", outputText: JSON.stringify({ judgments: [{ criterion: "fast food", outcome: "UNKNOWN", scope: "OTHER", evidenceIds: ["raw"] }] }) }, criterion: "fast food", sourceEvidenceIds: ["raw"], verifiedNegativeCriteria: [], violatedNegativeCriteria: [], categoryUnknownNegativeCriteria: ["fast food"], supportingEvidenceIds: ["raw"] }).passed, false);
  assert.equal(scoreCategoryNegativeMatrixRun({ expected: "ELIGIBLE_UNKNOWN", response: response("UNKNOWN"), criterion: "fast food", sourceEvidenceIds: ["raw"], verifiedNegativeCriteria: [], violatedNegativeCriteria: [], categoryUnknownNegativeCriteria: ["fast food"], supportingEvidenceIds: ["invented"] }).passed, false);
});
