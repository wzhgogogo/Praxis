import type { ModelGateway, ModelRequest, ModelResponse } from "../core/model/contracts.js";
import type { RestaurantGoalBasis } from "../domains/restaurant/semantic-proposal.js";
import type { BrowserRuntime } from "../infrastructure/browser/browser-runtime.js";
import { GooglePlacesClient } from "../integrations/google/google-places-client.js";
import { createLiveReadAssembly, type LiveReadAssemblyConfig, type LiveReadTransports } from "../integrations/restaurant-search/live-read-assembly.js";
import { googlePlacesDiscoveryPack } from "../integrations/restaurant-search/source-packs.js";
import { LIVE_READ_DEBUG_INVESTIGATION_BUDGET as readLimits } from "../application/live-read-investigation-budget.js";
import { createHybridReadComposition, type HybridReadCompositionOptions } from "../eval/restaurant/agent-loop/hybrid-read-composition.js";

export const now = new Date("2026-09-16T03:00:00.000Z");
export const clock = { now: () => new Date(now) };

/** Current-schema model-double evidence; does not classify the supplied fixture goal. */
export function fixtureGoalBasis(request: ModelRequest): RestaurantGoalBasis {
  const content = request.messages.find((message) => message.role === "user")!.content;
  const message: string = JSON.parse(content.slice("User restaurant message as JSON string: ".length));
  return { type: "JUDGMENT", reason: "Controlled fixture target for the supplied request.", quotes: [message] };
}

type GoogleFixture = GooglePlacesClient | { client: GooglePlacesClient; maxGoogleRequests: number };
interface GoogleReadFixtureOptions extends Pick<HybridReadCompositionOptions, "taskId" | "runId" | "clock" | "model"> {
  google: GoogleFixture;
  browser?: BrowserRuntime;
  config: Partial<LiveReadAssemblyConfig>;
  onBrowserDiagnostic?: LiveReadTransports["onBrowserDiagnostic"];
  remainingModelCalls?: LiveReadTransports["remainingModelCalls"];
  /** Only the Router harness uses partial ports; production composition tests never do. */
  unitAvailability?: HybridReadCompositionOptions["availability"];
  unitFacts?: HybridReadCompositionOptions["facts"];
  unitFactsOnly?: boolean;
}

/** Shared external fixture boundary; all real read components and limits come from production. */
export function createGoogleReadComposition(options: Omit<GoogleReadFixtureOptions, "unitAvailability" | "unitFacts" | "unitFactsOnly">) {
  return composeGoogleReadFixture(options);
}

/** Partial-port Router contracts are deliberately not evidence of Adapter integration. */
export function createRouterFixtureComposition(options: GoogleReadFixtureOptions) {
  return composeGoogleReadFixture(options);
}

function composeGoogleReadFixture(options: GoogleReadFixtureOptions) {
  const googleFixture = options.google instanceof GooglePlacesClient ? { client: options.google } : options.google;
  const assembly = createLiveReadAssembly({
    ...readLimits,
    ...("maxGoogleRequests" in googleFixture ? { maxGoogleRequests: googleFixture.maxGoogleRequests } : {}),
    ...options.config,
    packs: [googlePlacesDiscoveryPack],
  }, {
    google: googleFixture.client, model: options.model, clock: options.clock,
    browser: options.browser ?? { async openSession() { throw new Error("This fixed Google sample must not need browser transport"); } },
    ...(options.onBrowserDiagnostic ? { onBrowserDiagnostic: options.onBrowserDiagnostic } : {}),
    ...(options.remainingModelCalls ? { remainingModelCalls: options.remainingModelCalls } : {}),
  });
  const composition = createHybridReadComposition({
    taskId: options.taskId, runId: options.runId, clock: options.clock, model: options.model, ...assembly,
    ...(options.unitAvailability ? { availability: options.unitAvailability } : {}),
    ...(options.unitFacts ? { facts: options.unitFacts } : options.unitFactsOnly ? { facts: assembly.google } : {}),
  });
  return { ...composition, google: assembly.google, runCeilings: assembly.runCeilings, browserBudget: assembly.browserBudget };
}

export function response(outputText: string, invocationId: string): ModelResponse {
  return { invocationId, provider: "FIXTURE", model: "external-boundary-stub", outputText, finishReason: "TOOL_CALLS", latencyMs: 0 };
}

export function strictAction(type: string, candidateIds: string[] = []): Record<string, unknown> {
  return { type, question: "", relatedFields: [], retrievalHint: "", candidateIds, candidateId: "", offerId: "", decisionSummary: "synthetic boundary action" };
}

export class ScriptedExternalModel implements ModelGateway {
  readonly requests: ModelRequest[] = [];

  constructor(private readonly batchSize = 3, private readonly reverse = false, private readonly useAvailability = false) {}

  async complete(request: ModelRequest): Promise<ModelResponse> {
    this.requests.push(request);
    if(request.purpose==='restaurant_discovery_retrieval')return scriptedRetrieval(request)!;
    if (request.purpose === "restaurant_semantic_interpret") {
      return response(JSON.stringify({
        schemaVersion: "4",
        facts: [
          { field: "TARGET", operation: "ASSERT", value: { goalBasis: fixtureGoalBasis(request), kind: "TARGET", goal: "RECOMMENDATION", query: "afternoon cafes" } },
          { field: "DATE", operation: "ASSERT", value: { kind: "DATE", relativeDay: "TOMORROW", raw: "tomorrow" } },
          { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", daypart: "AFTERNOON", raw: "tomorrow afternoon" } },
          { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
          { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "nearby" } },
          { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "cafe", polarity: "POSITIVE", strength: "HARD" } },
        ],
      }), "semantic");
    }
    if (request.purpose === "restaurant_agent_decide") {
      const payload = JSON.parse(request.messages.find((message) => message.role === "user")!.content) as {
        context: { candidates?: Array<{ id: string }>; factInvestigableCandidateIds?: string[]; presentation?: Array<{ candidateId: string; eligible: boolean }>; missingBlockingFields?: string[]; checkableCandidateIds?: string[] };
      };
      const context = payload.context;
      if ((context.missingBlockingFields?.length ?? 0) > 0) return response(JSON.stringify({ ...strictAction("ASK_USER"), question: "Please share your location.", relatedFields: ["area"] }), "agent-missing");
      if (!context.candidates?.length) return response(JSON.stringify(strictAction("SEARCH_RESTAURANTS")), "agent-search");
      if (context.factInvestigableCandidateIds?.length) {
        const ids = [...context.factInvestigableCandidateIds];
        if (this.reverse) ids.reverse();
        return response(JSON.stringify(strictAction("INVESTIGATE_CANDIDATE_FACTS", ids.slice(0, this.batchSize))), "agent-facts");
      }
      if (this.useAvailability && context.checkableCandidateIds?.length) return response(JSON.stringify(strictAction("CHECK_AVAILABILITY", context.checkableCandidateIds.slice(0, 3))), "agent-availability");
      if (this.useAvailability) return response(JSON.stringify(strictAction("END_READ")), "agent-end");
      const eligible = context.presentation?.filter((candidate) => candidate.eligible).map((candidate) => candidate.candidateId) ?? [];
      return response(JSON.stringify(strictAction("PRESENT_RESULTS", eligible)), "agent-present");
    }
    throw new Error(`Unexpected model purpose ${request.purpose}`);
  }
}

export class PermittedAlternativeTimeModel extends ScriptedExternalModel {
  override async complete(request: ModelRequest): Promise<ModelResponse> {
    if (request.purpose === "restaurant_agent_decide") {
      const { context } = JSON.parse(request.messages.find((message) => message.role === "user")!.content) as { context: { presentation?: Array<{ candidateId: string; eligible: boolean }> } };
      const presentable = context.presentation?.filter((item) => item.eligible).map((item) => item.candidateId) ?? [];
      if (presentable.length) return response(JSON.stringify(strictAction("PRESENT_RESULTS", presentable)), "agent-present-permitted-alternative");
      return super.complete(request);
    }
    if (request.purpose !== "restaurant_semantic_interpret") return super.complete(request);
    return response(JSON.stringify({
      schemaVersion: "4",
      facts: [
        { field: "TARGET", operation: "ASSERT", value: { goalBasis: fixtureGoalBasis(request), kind: "TARGET", goal: "AVAILABILITY", query: "find a table" } },
        { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: "2026-09-17", raw: "tomorrow" } },
        { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "19:00", latest: "19:00", raw: "7 PM", alternativeEarliest: "18:30", alternativeLatest: "19:30", alternativeRaw: "30 minutes either side is fine" } },
        { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
        { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "nearby" } },
      ],
    }), "semantic-permitted-alternative");
  }
}

export function googleFixture(
  recordedBodies: Record<string, unknown>[],
  options: { maxRequests: number } = { maxRequests: readLimits.maxGoogleRequests },
  names = ["one", "two", "three"],
  detailIds: string[] = [],
) {
  const places = names.map((id, index) => ({
    id: `cafe-${id}`,
    displayName: { text: `Cafe ${id}` },
    formattedAddress: `Ginza ${index + 1}, Chuo City, Tokyo`,
    location: { latitude: 35.6697 + index * 0.0001, longitude: 139.7670 },
    types: ["restaurant"],
  }));
  const client = new GooglePlacesClient({
    apiKey: "test-key",
    fetchImplementation: async (url, init) => {
      if (init?.method === "POST") {
        recordedBodies.push(JSON.parse(String(init.body)) as Record<string, unknown>);
        return new Response(JSON.stringify({ places }), { status: 200 });
      }
      const id = String(url).split("/").at(-1)!;
      detailIds.push(id);
      return new Response(JSON.stringify({
        id,
        displayName: { text: `Cafe ${id.replace("cafe-", "")}` },
        formattedAddress: "Ginza, Chuo City, Tokyo",
        location: { latitude: 35.6698, longitude: 139.7670 },
        types: ["cafe", "restaurant"],
        primaryType: "cafe",
        regularOpeningHours: { weekdayDescriptions: ["Wednesday: 10:00 AM – 6:00 PM", "Thursday: 10:00 AM – 6:00 PM"] },
      }), { status: 200 });
    },
  });
  return { client, maxGoogleRequests: options.maxRequests };
}

/** Scripted external response, not a retrieval-quality oracle or production fallback. */
export function scriptedRetrieval(request:ModelRequest):ModelResponse|undefined {
 if(request.purpose!=='restaurant_discovery_retrieval')return undefined;
 const body=JSON.parse(request.messages.find(m=>m.role==='user')!.content);
 const eligible=body.positiveCriteria?.filter((c:{text:string})=>!/[0-9]/.test(c.text))??[];
 const criterion=eligible.find((c:{strength:string})=>c.strength==='HARD')??eligible[0];
 const keyword=criterion?.text.trim().split(/\s+/).slice(-3).join(' ')??'';
 return response(JSON.stringify({choice:keyword?'KEYWORD':'GENERAL',keyword,criterionRef:keyword?criterion.criterionRef:'',categoryUrl:'',reason:'Scripted positive retrieval for controlled source contract'}),'fixture-retrieval');
}
