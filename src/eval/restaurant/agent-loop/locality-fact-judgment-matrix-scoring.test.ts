import assert from "node:assert/strict";
import test from "node:test";

import { canonicalizeLocalityMatrixResponse, localityMatrixRunPassesExpected } from "./locality-fact-judgment-matrix-scoring.js";

function canonical(outputText: string, accepted: string[] = [], targetCriterion = "local food") {
  return canonicalizeLocalityMatrixResponse({
    response: { finishReason: "TOOL_CALLS", outputText },
    targetCriterion,
    sourceEvidenceIds: ["source-a"], acceptedVerifiedHardCriteria: accepted, supportingEvidenceIds: accepted.length ? ["source-a"] : [],
  });
}

test("NOT_SUPPORTED rejects a raw SUPPORTED result even when production code declines its uncited assertion", () => {
  const result = canonical(JSON.stringify({ judgments: [{ criterion: "local food", outcome: "SUPPORTED", evidenceIds: [] }] }));
  assert.equal(result.citationStatus, "NONE");
  assert.equal(localityMatrixRunPassesExpected({ expected: "NOT_SUPPORTED", inputStatus: "INVOKED", canonical: result }), false);
});

test("UNKNOWN permits an empty citation list but rejects an invented nonempty citation", () => {
  const unknown = canonical(JSON.stringify({ judgments: [{ criterion: "local food", outcome: "UNKNOWN", evidenceIds: [] }] }));
  assert.equal(unknown.citationStatus, "NONE");
  assert.equal(localityMatrixRunPassesExpected({ expected: "UNKNOWN", inputStatus: "INVOKED", canonical: unknown }), true);
  const invented = canonical(JSON.stringify({ judgments: [{ criterion: "local food", outcome: "UNKNOWN", evidenceIds: ["invented"] }] }));
  assert.equal(invented.citationStatus, "UNGROUNDED");
  assert.equal(localityMatrixRunPassesExpected({ expected: "UNKNOWN", inputStatus: "INVOKED", canonical: invented }), false);
});

test("SUPPORTED requires one legal, cited target judgment and actual production acceptance", () => {
  const supported = canonical(JSON.stringify({ judgments: [{ criterion: "local food", outcome: "SUPPORTED", evidenceIds: ["source-a"] }] }), ["local food"]);
  assert.equal(localityMatrixRunPassesExpected({ expected: "SUPPORTED", inputStatus: "INVOKED", canonical: supported }), true);
  const duplicate = canonical(JSON.stringify({ judgments: [
    { criterion: "local food", outcome: "SUPPORTED", evidenceIds: ["source-a"] },
    { criterion: "local food", outcome: "UNKNOWN", evidenceIds: [] },
  ] }), ["local food"]);
  assert.equal(duplicate.responseStatus, "DUPLICATE_TARGET_JUDGMENT");
  assert.equal(localityMatrixRunPassesExpected({ expected: "SUPPORTED", inputStatus: "INVOKED", canonical: duplicate }), false);
});

test("the scorer parameterizes the actual narrow criterion instead of retaining local food", () => {
  const narrow = canonical(JSON.stringify({ judgments: [{ criterion: "Tokyo regional food", outcome: "UNKNOWN", evidenceIds: [] }] }), [], "Tokyo regional food");
  assert.equal(narrow.targetCriterion, "Tokyo regional food");
  assert.equal(localityMatrixRunPassesExpected({ expected: "UNKNOWN", inputStatus: "INVOKED", canonical: narrow }), true);
  const wrongLabel = canonical(JSON.stringify({ judgments: [{ criterion: "local food", outcome: "UNKNOWN", evidenceIds: [] }] }), [], "Tokyo regional food");
  assert.equal(wrongLabel.responseStatus, "MISSING_TARGET_JUDGMENT");
  assert.equal(localityMatrixRunPassesExpected({ expected: "UNKNOWN", inputStatus: "INVOKED", canonical: wrongLabel }), false);
});

test("no response or a filtered zero-call input cannot pass a matrix expectation", () => {
  const noResponse = canonicalizeLocalityMatrixResponse({
    targetCriterion: "local food", sourceEvidenceIds: ["source-a"], acceptedVerifiedHardCriteria: [], supportingEvidenceIds: [],
  });
  assert.equal(noResponse.responseStatus, "NO_SUCCESSFUL_RESPONSE");
  assert.equal(localityMatrixRunPassesExpected({ expected: "UNKNOWN", inputStatus: "INVOKED", canonical: noResponse }), false);
  const otherwiseValid = canonical(JSON.stringify({ judgments: [{ criterion: "local food", outcome: "UNKNOWN", evidenceIds: [] }] }));
  assert.equal(localityMatrixRunPassesExpected({ expected: "UNKNOWN", inputStatus: "FILTERED_NOT_INVOKED", canonical: otherwiseValid }), false);
});
