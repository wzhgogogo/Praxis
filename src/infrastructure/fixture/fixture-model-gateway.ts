import type { ModelGateway, ModelRequest, ModelResponse } from "../../core/model/contracts.js";
import type { RestaurantIntentDraft } from "../../domains/restaurant/contracts.js";

const REFERENCE_DATE = "2026-08-05";

function fixtureDraftFor(message: string): RestaurantIntentDraft {
  const normalized = message.toLowerCase();
  const hasArea = normalized.includes("shinjuku");
  const hasTime = normalized.includes("7pm") || normalized.includes("7 pm") || normalized.includes("19:00");
  const hasParty = /\b(two|2)\b/.test(normalized);
  const hasCuisine = normalized.includes("yakiniku");
  const missingRequiredFields: RestaurantIntentDraft["missingRequiredFields"] = [
    ...(hasTime ? [] : ["date", "timeWindow"] as const),
    ...(hasParty ? [] : ["partySize"] as const),
    ...(hasArea ? [] : ["area"] as const),
  ];

  return {
    schemaVersion: "1",
    timezone: "Asia/Tokyo",
    ...(hasTime ? { date: REFERENCE_DATE, timeWindow: { earliest: "19:00", latest: "19:30" } } : {}),
    ...(hasParty ? { partySize: 2 } : {}),
    ...(hasArea ? { area: { query: "Shinjuku", radiusMeters: 2_000 } } : {}),
    cuisines: hasCuisine ? ["yakiniku"] : [],
    ...(normalized.includes("5000") || normalized.includes("5,000")
      ? { budgetPerPerson: { max: 5_000, currency: "JPY" as const } }
      : {}),
    hardConstraints: [],
    softPreferences: [],
    missingRequiredFields,
  };
}

function userMessage(request: ModelRequest): string {
  const content = request.messages.find((message) => message.role === "user")?.content;
  const prefix = "User restaurant request as JSON string: ";
  if (!content?.startsWith(prefix)) {
    throw new Error("Fixture model gateway received an unexpected restaurant parser request");
  }
  const value: unknown = JSON.parse(content.slice(prefix.length));
  if (typeof value !== "string") {
    throw new Error("Fixture model gateway expected a string user message");
  }
  return value;
}

/**
 * Local-only deterministic model double. It exercises the real RestaurantIntentParser
 * without sending user text or credentials to a model provider.
 */
export class FixtureModelGateway implements ModelGateway {
  private sequence = 0;

  async complete(request: ModelRequest): Promise<ModelResponse> {
    const message = userMessage(request);
    this.sequence += 1;
    return {
      invocationId: `fixture-model-${this.sequence}`,
      provider: "FIXTURE",
      model: "fixture-restaurant-intent-v1",
      outputText: JSON.stringify(fixtureDraftFor(message)),
      finishReason: "STOP",
      latencyMs: 0,
    };
  }
}
