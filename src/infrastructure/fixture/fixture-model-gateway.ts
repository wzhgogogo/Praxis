import type { ModelGateway, ModelRequest, ModelResponse } from "../../core/model/contracts.js";
import type { RestaurantSemanticProposal } from "../../domains/restaurant/semantic-proposal.js";

const REFERENCE_DATE = "2026-08-05";

function userMessage(request: ModelRequest, prefix: string): string {
  const content = request.messages.find((message) => message.role === "user")?.content;
  if (!content?.startsWith(prefix)) {
    throw new Error("Fixture model gateway received an unexpected restaurant request");
  }
  const value: unknown = JSON.parse(content.slice(prefix.length));
  if (typeof value !== "string") {
    throw new Error("Fixture model gateway expected a string user message");
  }
  return value;
}

function fixtureSemanticProposalFor(message: string): RestaurantSemanticProposal {
  const normalized = message.toLowerCase();
  const operation =
    normalized.includes("make it") ||
    normalized.includes("change") ||
    normalized.includes("instead") ||
    normalized.includes("rather")
      ? "CORRECT"
      : "ASSERT";
  const facts: RestaurantSemanticProposal["facts"] = [];
  const add = (fact: RestaurantSemanticProposal["facts"][number]) => facts.push(fact);

  if (normalized.includes("tonight") || normalized.includes("2026-08-05")) {
    add({ field: "DATE", operation, value: { kind: "DATE", value: REFERENCE_DATE } });
  }
  if (normalized.includes("tomorrow") || normalized.includes("2026-08-06")) {
    add({ field: "DATE", operation, value: { kind: "DATE", value: "2026-08-06" } });
  }
  if (normalized.includes("7pm") || normalized.includes("7 pm") || normalized.includes("19:00")) {
    add({
      field: "TIME_WINDOW",
      operation,
      value: { kind: "TIME_WINDOW", earliest: "19:00", latest: "19:30" },
    });
  }
  if (/\b(three|3)\b/.test(normalized)) {
    add({ field: "PARTY_SIZE", operation, value: { kind: "PARTY_SIZE", value: 3 } });
  } else if (/\b(two|2)\b/.test(normalized)) {
    add({ field: "PARTY_SIZE", operation, value: { kind: "PARTY_SIZE", value: 2 } });
  }
  if (normalized.includes("shinjuku")) {
    add({ field: "AREA", operation, value: { kind: "AREA", query: "Shinjuku" } });
  }
  if (normalized.includes("shibuya")) {
    add({ field: "AREA", operation, value: { kind: "AREA", query: "Shibuya" } });
  }
  if (normalized.includes("remove yakiniku")) {
    add({
      field: "CRITERION",
      operation: "NEGATE",
      value: { kind: "CRITERION", text: "yakiniku", polarity: "POSITIVE", strength: "UNSPECIFIED" },
    });
  } else if (normalized.includes("no yakiniku") || normalized.includes("not yakiniku")) {
    add({
      field: "CRITERION",
      operation: "ASSERT",
      value: { kind: "CRITERION", text: "yakiniku", polarity: "NEGATIVE", strength: "REQUIRED" },
    });
  } else if (normalized.includes("yakiniku")) {
    add({
      field: "CRITERION",
      operation,
      value: { kind: "CRITERION", text: "yakiniku", polarity: "POSITIVE", strength: "UNSPECIFIED" },
    });
  }
  if (normalized.includes("5000") || normalized.includes("5,000")) {
    add({
      field: "BUDGET_PER_PERSON",
      operation,
      value: { kind: "BUDGET_PER_PERSON", max: 5_000, currency: "JPY" },
    });
  }
  return { schemaVersion: "2", facts };
}

/**
 * Local-only deterministic model double for the current v16 semantic path.
 */
export class FixtureModelGateway implements ModelGateway {
  private sequence = 0;

  async complete(request: ModelRequest): Promise<ModelResponse> {
    const output = (() => {
      if (request.purpose === "restaurant_semantic_interpret") {
        const message = userMessage(request, "User restaurant message as JSON string: ");
        return fixtureSemanticProposalFor(message);
      }
      throw new Error(`Fixture model gateway does not support ${request.purpose}`);
    })();
    this.sequence += 1;
    return {
      invocationId: `fixture-model-${this.sequence}`,
      provider: "FIXTURE",
      model: "fixture-restaurant-semantic-v2",
      outputText: JSON.stringify(output),
      finishReason: request.responseFormat === "JSON_SCHEMA" ? "TOOL_CALLS" : "STOP",
      latencyMs: 0,
    };
  }
}
