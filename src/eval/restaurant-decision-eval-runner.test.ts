import assert from "node:assert/strict";
import { test } from "node:test";

import type { ModelGateway, ModelRequest, ModelResponse } from "../core/model/contracts.js";
import { ModelGatewayError } from "../core/model/errors.js";
import { RestaurantDecisionEvalModelContract } from "./restaurant-decision-eval-model-contract.js";
import {
  GoldenDecisionEvalFixtureGateway,
  runRestaurantDecisionEvalEpisodes,
  type DecisionEvalTurnDiagnostic,
} from "./restaurant-decision-eval-runner.js";
import { renderRestaurantDecisionEvalDiagnosticLog } from "./restaurant-decision-eval-diagnostic-log.js";
import { restaurantDecisionGoldenSeedV010 } from "./restaurant-decision-eval-seed.js";

class RecordingGoldenGateway implements ModelGateway {
  readonly requests: ModelRequest[] = [];

  constructor(private readonly delegate: GoldenDecisionEvalFixtureGateway) {}

  async complete(request: ModelRequest): Promise<ModelResponse> {
    this.requests.push(request);
    return this.delegate.complete(request);
  }
}

test("Episode Runner drives every Golden Fixture Episode through Model Contract and S1–S8", async () => {
  const gateway = new RecordingGoldenGateway(
    new GoldenDecisionEvalFixtureGateway(restaurantDecisionGoldenSeedV010),
  );
  const report = await runRestaurantDecisionEvalEpisodes(restaurantDecisionGoldenSeedV010, {
    mode: "FIXTURE_MODEL",
    modelContract: new RestaurantDecisionEvalModelContract(gateway),
  });

  assert.equal(report.status, "COMPLETED");
  if (report.status !== "COMPLETED") return;
  assert.equal(report.candidateWorld, "GOLDEN_FIXTURE");
  assert.equal(report.preflight.status, "READY_FOR_EVALUATOR");
  assert.equal(report.episodes.length, 7);
  assert.equal(report.episodes.every((episode) => episode.status === "SCORED"), true);
  assert.equal(report.episodes.every((episode) => episode.score?.rawJourneyPass === true), true);
  assert.equal(report.summary.modelCalls, 17);
  assert.equal(report.summary.schemaRetryCalls, 0);
  assert.deepEqual(report.summary.p0ErrorCodes, []);
  assert.equal(report.summary.stages.S1_STATE_EXTRACTION.PASS, 17);
  assert.equal(report.summary.stages.S8_RESPONSE_GROUNDING.PASS, 17);

  const coreReadyRequest = gateway.requests.find((request) =>
    request.taskId.endsWith(":DGS01-T01"),
  );
  assert.ok(coreReadyRequest);
  assert.equal(coreReadyRequest.messages[1]?.content.includes("ginza-western-bistro-lune"), true);

  const earlyClarificationRequest = gateway.requests.find((request) =>
    request.taskId.endsWith(":DGS04-T01"),
  );
  assert.ok(earlyClarificationRequest);
  assert.equal(earlyClarificationRequest.messages[1]?.content.includes("shimbashi-izakaya-kado"), false);

  const brandResolutionRequest = gateway.requests.find((request) =>
    request.taskId.endsWith(":DGS02-T01"),
  );
  assert.ok(brandResolutionRequest);
  assert.equal(brandResolutionRequest.messages[1]?.content.includes('"namedTargetResolution":{"query":"Mori Burger","target":{"kind":"BRAND"'), true);

  const limitedResultRequest = gateway.requests.find((request) =>
    request.taskId.endsWith(":DGS04-T03"),
  );
  assert.ok(limitedResultRequest);
  assert.equal(limitedResultRequest.messages[1]?.content.includes('"retrievalSummary"'), false);
});

test("Episode Runner applies trusted relative time before scoring and keeps the raw model Patch visible", async () => {
  const fixtureGateway = new GoldenDecisionEvalFixtureGateway(restaurantDecisionGoldenSeedV010);
  const requests: ModelRequest[] = [];
  const gateway: ModelGateway = {
    async complete(request): Promise<ModelResponse> {
      requests.push(request);
      const response = await fixtureGateway.complete(request);
      if (!request.taskId.endsWith(":DGS04-T01")) return response;
      const proposal = JSON.parse(response.outputText) as {
        statePatch: { set: Record<string, unknown> };
      };
      proposal.statePatch.set.time = { precision: "DAYPART", daypart: "DINNER" };
      return { ...response, outputText: JSON.stringify(proposal) };
    },
  };
  const diagnostics: DecisionEvalTurnDiagnostic[] = [];
  const report = await runRestaurantDecisionEvalEpisodes(restaurantDecisionGoldenSeedV010, {
    mode: "FIXTURE_MODEL",
    modelContract: new RestaurantDecisionEvalModelContract(gateway),
    episodeIds: ["DGS04-e2-team-izakaya"],
    onTurnDiagnostic(diagnostic) {
      diagnostics.push(diagnostic);
    },
  });

  assert.equal(report.status, "COMPLETED");
  if (report.status !== "COMPLETED") return;
  assert.equal(report.episodes[0]?.score?.turns[0]?.stages[0]?.status, "PASS");
  assert.equal(
    requests[0]?.messages[1]?.content.includes('"time":{"date":"2026-08-10","precision":"DAYPART","daypart":"DINNER"}'),
    true,
  );
  const diagnostic = diagnostics[0];
  assert.ok(diagnostic);
  assert.deepEqual(diagnostic.relativeTimeResolution, {
    source: "TONIGHT",
    time: { date: "2026-08-10", precision: "DAYPART", daypart: "DINNER" },
  });
  assert.deepEqual(diagnostic.actual?.modelStatePatch.set?.time, { precision: "DAYPART", daypart: "DINNER" });
  assert.deepEqual(diagnostic.actual?.statePatch.set?.time, {
    date: "2026-08-10",
    precision: "DAYPART",
    daypart: "DINNER",
  });
  const log = renderRestaurantDecisionEvalDiagnosticLog(report, diagnostics, {
    generatedAt: "2026-08-11T00:00:00.000Z",
    classification: {
      scope: "SMOKE",
      cohort: "DEVELOPMENT_DIAGNOSTIC",
      contaminationStatus: "PROMPT_AND_RESULT_EXPOSED",
      baselineEligible: false,
    },
  });
  assert.match(log, /Trusted relative-time resolution/);
  assert.match(log, /effectiveStatePatch/);
});

test("Episode Runner records a provider failure separately and stops that Episode fail closed", async () => {
  let calls = 0;
  const gateway: ModelGateway = {
    async complete(): Promise<ModelResponse> {
      calls += 1;
      throw new ModelGatewayError("provider unavailable", "NETWORK", true);
    },
  };

  const report = await runRestaurantDecisionEvalEpisodes(restaurantDecisionGoldenSeedV010, {
    mode: "REAL_MODEL_MOCK_WORLD",
    modelContract: new RestaurantDecisionEvalModelContract(gateway),
    episodeIds: ["DGS03-e2-restaurant-sora-dining"],
  });

  assert.equal(report.status, "COMPLETED");
  if (report.status !== "COMPLETED") return;
  assert.equal(calls, 1);
  assert.equal(report.episodes.length, 1);
  const episode = report.episodes[0];
  assert.ok(episode);
  assert.equal(episode.status, "MODEL_FAILURE");
  assert.equal(episode.turns.length, 1);
  assert.equal(episode.turns[0]?.errorCode, "NETWORK");
  assert.equal(episode.score, undefined);
});

test("Episode Runner blocks an invalid Golden Dataset before it invokes a model", async () => {
  const dataset = structuredClone(restaurantDecisionGoldenSeedV010);
  const pool = dataset.candidatePools[0];
  assert.ok(pool);
  pool.id = "";
  let calls = 0;
  const gateway: ModelGateway = {
    async complete(): Promise<ModelResponse> {
      calls += 1;
      throw new Error("must not be called");
    },
  };

  const report = await runRestaurantDecisionEvalEpisodes(dataset, {
    mode: "FIXTURE_MODEL",
    modelContract: new RestaurantDecisionEvalModelContract(gateway),
  });

  assert.equal(report.status, "BLOCKED_PREFLIGHT");
  assert.equal(calls, 0);
  assert.equal(report.preflight.status, "INVALID");
});

test("Episode Runner emits a structured per-turn witness that explains an S1 Patch mismatch", async () => {
  const fixtureGateway = new GoldenDecisionEvalFixtureGateway(restaurantDecisionGoldenSeedV010);
  const gateway: ModelGateway = {
    async complete(request): Promise<ModelResponse> {
      const response = await fixtureGateway.complete(request);
      if (!request.taskId.endsWith(":DGS01-T01")) return response;
      const proposal = JSON.parse(response.outputText) as Record<string, unknown>;
      proposal.statePatch = { set: { target: { kind: "OPEN" } } };
      return { ...response, outputText: JSON.stringify(proposal) };
    },
  };
  const diagnostics: DecisionEvalTurnDiagnostic[] = [];
  const report = await runRestaurantDecisionEvalEpisodes(restaurantDecisionGoldenSeedV010, {
    mode: "FIXTURE_MODEL",
    modelContract: new RestaurantDecisionEvalModelContract(gateway),
    episodeIds: ["DGS01-e1-category-ginza-western"],
    onTurnDiagnostic(diagnostic) {
      diagnostics.push(diagnostic);
    },
  });

  assert.equal(report.status, "COMPLETED");
  if (report.status !== "COMPLETED") return;
  assert.equal(diagnostics.length, 1);
  const diagnostic = diagnostics[0];
  assert.ok(diagnostic);
  assert.equal(diagnostic.score?.firstFailureStage, "S1_STATE_EXTRACTION");
  assert.deepEqual(diagnostic.actual?.modelStatePatch, { set: { target: { kind: "OPEN" } } });
  assert.deepEqual(diagnostic.actual?.statePatch, {
    set: {
      target: { kind: "OPEN" },
      time: { date: "2026-08-11", precision: "DAYPART", daypart: "DINNER" },
    },
  });
  const log = renderRestaurantDecisionEvalDiagnosticLog(report, diagnostics, {
    generatedAt: "2026-08-11T00:00:00.000Z",
    classification: {
      scope: "SMOKE",
      cohort: "DEVELOPMENT_DIAGNOSTIC",
      contaminationStatus: "PROMPT_AND_RESULT_EXPOSED",
      baselineEligible: false,
    },
  });
  assert.match(log, /S1 Patch-effect difference/);
  assert.match(log, /state\.target\.kind/);
  assert.match(log, /S1_STATE_EXTRACTION \(STATE_PATCH_MISMATCH\)/);
});
