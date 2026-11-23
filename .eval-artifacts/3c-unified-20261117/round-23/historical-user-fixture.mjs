import { once } from "node:events";
import { PGlite } from "@electric-sql/pglite";
import { PersistentRestaurantAgentApplication, PilotSessionService } from "../../../src/application/persistent-restaurant-agent.ts";
import { LIVE_READ_DEBUG_INVESTIGATION_BUDGET as limits } from "../../../src/application/live-read-investigation-budget.ts";
import { RestaurantAgentDecision } from "../../../src/domains/restaurant/agent-decision.ts";
import { restaurantSearchIntentFingerprint } from "../../../src/domains/restaurant/contracts.ts";
import { RestaurantSemanticInterpreter } from "../../../src/domains/restaurant/semantic-interpreter.ts";
import { FakeClock } from "../../../src/harness/fake-clock.ts";
import { response, strictAction } from "../../../src/harness/restaurant-read-test-fixtures.ts";
import { applyPostgresMigrations } from "../../../src/infrastructure/postgres/migrations.ts";
import { createLocalWebServer } from "../../../src/server/local-web-server.ts";

export const dinnerRequest = "Recommend sushi restaurants in Tokyo for six on November 20, between 18:00 and 23:00.";
export const beerRequest = "Find me a restaurant that serves beer";

function fact(field, value, operation = "ASSERT") {
  return { field, operation, value: { kind: field, ...value } };
}

function semantic(message) {
  if (message === dinnerRequest || message === beerRequest) {
    const beer = message === beerRequest;
    const target = fact("TARGET", {
      goal: "RECOMMENDATION", query: beer ? "Restaurants with beer" : "sushi restaurants in Tokyo", selectionScope: "OPEN_ENDED",
      goalBasis: { type: "JUDGMENT", reason: "The user asks for a recommendation.", quotes: [message] },
    });
    const criterion = fact("CRITERION", { text: beer ? "serves beer" : "sushi", polarity: "POSITIVE", strength: "HARD" });
    const dinnerFields = [
      fact("AREA", { query: "Tokyo" }),
      fact("DATE", { value: "2026-11-20", raw: "November 20" }),
      fact("TIME_WINDOW", { earliest: "18:00", latest: "23:00", raw: "18:00 and 23:00" }),
      fact("PARTY_SIZE", { value: 6, source: "EXPLICIT" }),
    ];
    return beer ? [target, criterion] : [target, criterion, ...dinnerFields];
  }
  if (message === "Shibuya") return [fact("AREA", { query: message })];
  if (message === "Change 6 guests to 7" || message === "Keep the same dinner conditions") return [fact("PARTY_SIZE", { value: 7, source: "EXPLICIT" }, "CORRECT")];
  if (message === "Change Tokyo to Osaka") return [fact("AREA", { query: "Osaka" }, "CORRECT")];
  if (message === "Change Fri, Nov 20 to 2026-12-09") return [fact("DATE", { value: "2026-12-09", raw: "2026-12-09" }, "CORRECT")];
  return [];
}

export async function startHistoricalUserFixture() {
  const pg = await PGlite.create();
  const sql = (conn) => ({
    async query(query, params = []) {
      const result = await conn.query(query, [...params]);
      return { rows: result.rows, affectedRows: result.affectedRows ?? 0 };
    },
  });
  const database = { ...sql(pg), transaction: (callback) => pg.transaction(tx => callback(sql(tx))) };
  await applyPostgresMigrations(database);
  const clock = new FakeClock("2026-11-18T07:45:23Z");
  const observedAt = clock.now().toISOString();
  let modelId = 0;
  const model = {
    async complete(request) {
      const text = request.messages.find(m => m.role === "user").content;
      let output;
      if (request.purpose === "restaurant_semantic_interpret") {
        const message = JSON.parse(text.slice("User restaurant message as JSON string: ".length));
        output = { schemaVersion: "4", facts: semantic(message) };
      } else if (request.purpose === "restaurant_agent_decide") {
        const { context } = JSON.parse(text);
        const actions = context.legalActions;
        if (context.missingBlockingFields?.length) {
          output = { ...strictAction("ASK_USER"), question: "Which area would you like me to search?", relatedFields: ["area"] };
        } else if (actions.investigateCandidateFacts.length) {
          output = strictAction("INVESTIGATE_CANDIDATE_FACTS", actions.investigateCandidateFacts.slice(0, 3));
        } else if (actions.presentResults.length) {
          output = strictAction("PRESENT_RESULTS", actions.presentResults.slice(0, 3));
        } else if (actions.search) {
          output = strictAction("SEARCH_RESTAURANTS");
        } else {
          output = strictAction("END_READ");
        }
      } else {
        throw new Error("No fixture response for model purpose " + request.purpose);
      }
      return response(JSON.stringify(output), "historical-walk-" + ++modelId);
    },
  };
  const observed = { searches: [], factReads: [], availabilityReads: [] };
  const metadata = { provider: "GOOGLE_PLACES", route: "STRUCTURED_ADAPTER", latencyMs: 0 };
  const sourceKey = (id) => "fixed:" + id;
  const port = {
    executionRoute: "STRUCTURED_ADAPTER",
    async search(request) {
      const intent = request.intent;
      const area = intent.area.query;
      const slug = area.toLowerCase();
      const hasBeer = intent.criteria.some(c => c.polarity === "POSITIVE" && c.text === "serves beer");
      observed.searches.push({ area, date: intent.date ?? null, partySize: intent.partySize ?? null, goal: intent.target.goal });
      const ids = [slug + "-kitchen-1", slug + "-kitchen-2", slug + "-kitchen-3"];
      if (hasBeer) ids.unshift("shibuya-generic-lounge");
      const candidates = ids.map((id, index) => ({
        restaurant: {
          id, outletName: id.endsWith("lounge") ? "Fixture Lounge" : "Fixture " + area + (hasBeer ? " Kitchen " : " Sushi ") + (index + 1),
          address: (index + 1) + "-1 " + area + " (synthetic)", sourceIds: { googlePlaces: sourceKey(id) },
          provenance: { outletName: "fixture", address: "fixture" },
        },
        matchReasons: ["Fixture match for the requested area"], warnings: [], executionConfidence: "HIGH",
      }));
      const fingerprint = restaurantSearchIntentFingerprint(intent);
      return {
        candidates, evidence: ids.map(id => ({
          evidenceId: "discovery:" + observed.searches.length + ":" + id, candidateId: id, kind: "DISCOVERY", provider: "GOOGLE_PLACES",
          sourceEntityId: sourceKey(id), observedAt, requestFingerprint: fingerprint, claims: { areaMatch: true, areaQuery: area },
        })),
        continuation: { intentFingerprint: fingerprint, usedPageTokens: [], pagesRead: 1, exhausted: true }, metadata,
      };
    },
    async inspectFacts(request) {
      observed.factReads.push({ ids: request.candidateIds.slice(), area: request.intent.area?.query, date: request.intent.date, recheck: request.recheck?.reason ?? null });
      const index = observed.factReads.length;
      const beer = request.intent.criteria.some(c => c.polarity === "POSITIVE" && c.text === "serves beer");
      const factChecks = {};
      const evidence = request.candidateIds.flatMap(id => {
        const generic = id.endsWith("lounge");
        const quote = generic ? "bar, liquor store" : beer ? "This restaurant serves beer with its meals." : "Sushi restaurant";
        const sourceUrl = "https://source.example.org/" + id + "/menu";
        const common = {
          candidateId: id, provider: "GOOGLE_PLACES", sourceEntityId: sourceKey(id), sourceUrl,
          observedAt, requestFingerprint: restaurantSearchIntentFingerprint(request.intent),
        };
        const identity = "entity:" + index + ":" + id;
        const factId = "fact:" + index + ":" + id;
        factChecks[id] = { status: "COMPLETED", checkedAt: observedAt, evidenceIds: [identity, factId], sourceProvider: "GOOGLE_PLACES" };
        return [
          { ...common, evidenceId: identity, kind: "ENTITY_MATCH", claims: {}, entityMatch: { confidence: "HIGH", matchedBy: ["SYNTHETIC_SAME_OUTLET"] } },
          { ...common, evidenceId: factId, kind: "RESTAURANT_FACT",
            claims: { verifiedHardCriteria: [beer ? "serves beer" : "sushi"], restaurantTypeFacts: generic ? ["bar", "liquor store"] : [],
              ...(!beer ? { openingHoursMatch: true, openingHoursWindow: ["18:00", "23:00"] } : {}) },
            sourceFieldQuotes: [{ field: generic ? "GOOGLE_TYPE" : "SOURCE_TEXT", quote, sourceUrl }] },
        ];
      });
      return { evidence, factChecks, metadata };
    },
    async check(request) {
      observed.availabilityReads.push(...request.candidateIds);
      throw new Error("Historical user reconstruction only supplies recommendation facts");
    },
  };
  const application = new PersistentRestaurantAgentApplication({
    database, clock, semanticInterpreter: new RestaurantSemanticInterpreter(model), agentDecision: new RestaurantAgentDecision(model),
    restaurantSearch: port, restaurantAvailability: port, restaurantFacts: port, workspaceMode: "LIVE_READ",
    executionRouterOptions: { structuredReadTimeoutMs: limits.maxStructuredReadMs, browserReadTimeoutMs: limits.maxAutomaticBrowserMs },
    agentLoopOptions: { maxSteps: limits.maxAgentSteps, maxRejectedActions: limits.maxRejectedActions, timeoutMs: limits.maxAutomaticBrowserMs },
  });
  const sessions = new PilotSessionService(application.store, [{ accessToken: "workspace-fixture", id: "workspace-user", displayName: "Fixture account" }], clock);
  const server = createLocalWebServer({ application, sessions });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return {
    baseUrl: "http://127.0.0.1:" + server.address().port, clock, observed,
    async close() {
      await application.stopActiveReads();
      const closed = once(server, "close");
      server.close();
      server.closeAllConnections();
      await closed;
      await pg.close();
    },
  };
}
