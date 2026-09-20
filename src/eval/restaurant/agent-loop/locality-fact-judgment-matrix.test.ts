import assert from "node:assert/strict";
import test from "node:test";

import type { ModelGateway, ModelRequest } from "../../../core/model/contracts.js";
import { ModelRestaurantFactJudgment, RESTAURANT_FACT_JUDGMENT_PROMPT_VERSION } from "../../../integrations/restaurant-facts/model-fact-judgment.js";
import {
  LOCALITY_FACT_JUDGMENT_MATRIX,
  RESTAURANT_LOCALITY_FACT_JUDGMENT_MATRIX_REPETITIONS,
  localityFactJudgmentInput,
} from "./locality-fact-judgment-matrix.js";

test("the locality matrix is frozen to V2-L1 through V2-L10 plus N1/N2 and uses the actual fact-judgment boundary", async () => {
  assert.deepEqual(LOCALITY_FACT_JUDGMENT_MATRIX.map((item) => item.id), ["V2-L1", "V2-L2", "V2-L3", "V2-L4", "V2-L5", "V2-L6", "V2-L7", "V2-L8", "V2-L9", "V2-L10", "N1", "N2"]);
  assert.equal(RESTAURANT_LOCALITY_FACT_JUDGMENT_MATRIX_REPETITIONS, 3);
  const requests: ModelRequest[] = [];
  const gateway: ModelGateway = {
    async complete(request) {
      requests.push(request);
      const payload = JSON.parse(request.messages[1]!.content) as { criteria: Array<{ text: string }>; observations: Array<{ evidenceId: string }> };
      return {
        invocationId: `fixture:${requests.length}`, provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS", latencyMs: 0,
        outputText: JSON.stringify({ judgments: [{ criterion: payload.criteria[0]!.text, outcome: "UNKNOWN", scope: "UNKNOWN_SCOPE", evidenceIds: [payload.observations[0]!.evidenceId] }] }),
      };
    },
  };
  for (const matrixCase of LOCALITY_FACT_JUDGMENT_MATRIX) {
    const input = localityFactJudgmentInput(matrixCase, 1);
    const result = await new ModelRestaurantFactJudgment(gateway).judge(input);
    assert.deepEqual(result.evidence, [], `${matrixCase.id} fixture UNKNOWN must remain unverified`);
  }
  assert.equal(requests.length, 12, "every V2-L1–V2-L10/N1/N2 input must reach the production fact-judgment transport boundary");
  assert.ok(requests.every((request) => request.promptVersion === RESTAURANT_FACT_JUDGMENT_PROMPT_VERSION));
  const l9Input = JSON.parse(requests[8]!.messages[1]!.content) as { candidate: { address: string }; requestContext: { area: string } };
  assert.match(l9Input.candidate.address, /Kyoto/);
  assert.equal(l9Input.requestContext.area, "Kyoto");
  const narrowInput = JSON.parse(requests[10]!.messages[1]!.content) as { criteria: Array<{ text: string }> };
  assert.equal(narrowInput.criteria[0]?.text, "Tokyo regional food", "N1 must traverse the actual Fact Judgment boundary with its narrower criterion");
});

test("the locality matrix does not let a fixture answer bypass cited evidence", async () => {
  const input = localityFactJudgmentInput(LOCALITY_FACT_JUDGMENT_MATRIX[0]!, 1);
  const gateway: ModelGateway = {
    async complete() {
      return {
        invocationId: "fixture:uncited", provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS", latencyMs: 0,
        outputText: JSON.stringify({ judgments: [{ criterion: input.intent.criteria[0]!.text, outcome: "SUPPORTED", scope: "UNKNOWN_SCOPE", evidenceIds: ["not-a-source"] }] }),
      };
    },
  };
  const result = await new ModelRestaurantFactJudgment(gateway).judge(input);
  assert.deepEqual(result.evidence, []);
});
