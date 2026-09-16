import assert from "node:assert/strict";
import test from "node:test";

import type { ModelGateway, ModelRequest, ModelResponse } from "../../../core/model/contracts.js";
import type { BrowserRuntime, BrowserSnapshot } from "../../../infrastructure/browser/browser-runtime.js";
import { GooglePlacesClient } from "../../../integrations/google/google-places-client.js";
import { GooglePlacesRestaurantSearch } from "../../../integrations/google/google-places-restaurant-search.js";
import { composeLiveRestaurantFactRead } from "../../../integrations/restaurant-facts/live-restaurant-facts.js";
import { LiveBrowserAvailability } from "../../../integrations/restaurant-availability/live-browser-availability.js";
import { evaluateRestaurantHybridLiveArtifact } from "./diagnostic-evaluator.js";
import { createHybridReadComposition } from "./hybrid-read-composition.js";
import { HIGASHI_GINZA_EVALUATION_LOCATION } from "./live-evaluation-location.js";
import {
  loadFrozenLiveCases,
  RESTAURANT_READ_DEVELOPMENT_CASE_PATH,
} from "./live-case-materializer.js";

type PlannedAction = "SEARCH_RESTAURANTS" | "INVESTIGATE_CANDIDATE_FACTS" | "CHECK_AVAILABILITY" | "PRESENT_RESULTS" | "END_READ";
type Plan = {
  id: "h001" | "h002" | "h003" | "h004" | "h005";
  content: string;
  referenceTime: string;
  goal: "RECOMMENDATION" | "AVAILABILITY";
  area: string;
  date: string;
  timeWindow: { earliest: string; latest: string };
  partySize?: number;
  facts: Array<Record<string, unknown>>;
  actions: PlannedAction[];
  source: {
    placeId: string;
    displayName: string;
    addressComponent?: string;
    websiteFacts?: { types: string[]; hours: string[] };
    availability?: { status: "AVAILABLE" | "UNAVAILABLE"; date: string; partySize: number; visibleSlots: string[]; menuText: string };
  };
};

// These explicit model/source rows are deliberately separate from the YAML
// semantic oracle. They are keyed by raw user text in this test only; neither
// production code nor the model boundary receives a case identifier.
const PLANS: readonly Plan[] = [
  {
    id: "h001", content: "Looking for an omakase spot near Shibuya for 2 people tonight at 7 PM.", referenceTime: "2026-08-19T16:20:00+08:00",
    goal: "AVAILABILITY", area: "near Shibuya", date: "2026-08-19", timeWindow: { earliest: "19:00", latest: "19:00" }, partySize: 2,
    facts: [
      { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "AVAILABILITY", query: "omakase near Shibuya" } },
      { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: "2026-08-19", raw: "tonight" } },
      { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "19:00", latest: "19:00", raw: "7 PM" } },
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "near Shibuya" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "omakase", polarity: "POSITIVE", strength: "HARD" } },
    ],
    actions: ["SEARCH_RESTAURANTS", "CHECK_AVAILABILITY", "PRESENT_RESULTS"],
    source: { placeId: "offline-h001", displayName: "Source Omakase Shibuya", addressComponent: "Shibuya", availability: { status: "AVAILABLE", date: "2026-08-19", partySize: 2, visibleSlots: ["19:00"], menuText: "Omakase course" } },
  },
  {
    id: "h002", content: "Recommend a first-date restaurant near Higashi-Ginza for this Saturday at 6:30 PM. Around 10,000 yen per person. No hot-pot restaurants and no Sichuan/Hunan-style cuisine where spicy food is the main focus.", referenceTime: "2026-08-19T16:22:00+08:00",
    goal: "AVAILABILITY", area: "near Higashi-Ginza", date: "2026-08-22", timeWindow: { earliest: "18:30", latest: "18:30" }, partySize: 2,
    facts: [
      { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "AVAILABILITY", query: "first date restaurant near Higashi-Ginza" } },
      { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: "2026-08-22", raw: "this Saturday" } },
      { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "18:30", latest: "18:30", raw: "6:30 PM" } },
      // Closed first-date-party inference, not a rewrite of the source message.
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "near Higashi-Ginza" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "good for a first date", polarity: "POSITIVE", strength: "SOFT" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "around 10,000 yen per person", polarity: "POSITIVE", strength: "SOFT" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "hot pot restaurant", polarity: "NEGATIVE", strength: "HARD" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "Sichuan/Hunan cuisine", polarity: "NEGATIVE", strength: "HARD" } },
    ],
    actions: ["SEARCH_RESTAURANTS", "CHECK_AVAILABILITY", "END_READ"],
    source: { placeId: "offline-h002", displayName: "Source Higashi-Ginza", addressComponent: "Higashi-Ginza", availability: { status: "UNAVAILABLE", date: "2026-08-22", partySize: 2, visibleSlots: [], menuText: "Seasonal dinner course" } },
  },
  {
    id: "h003", content: "Need a place for a team dinner nearby this Friday after work. 10 people, around 3,000 yen per person, good for drinks, ideally with a private room.", referenceTime: "2026-08-19T16:38:00+08:00",
    goal: "AVAILABILITY", area: "nearby", date: "2026-08-21", timeWindow: { earliest: "17:30", latest: "22:00" }, partySize: 10,
    facts: [
      { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "AVAILABILITY", query: "team dinner nearby" } },
      { field: "DATE", operation: "ASSERT", value: { kind: "DATE", weekday: "FRIDAY", raw: "this Friday" } },
      { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", daypart: "AFTER_WORK", raw: "after work" } },
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 10 } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "nearby" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "around 3,000 yen per person", polarity: "POSITIVE", strength: "SOFT" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "private room", polarity: "POSITIVE", strength: "SOFT" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "team dinner", polarity: "POSITIVE", strength: "HARD" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "good for drinks", polarity: "POSITIVE", strength: "HARD" } },
    ],
    actions: ["SEARCH_RESTAURANTS", "CHECK_AVAILABILITY", "PRESENT_RESULTS"],
    source: { placeId: "offline-h003", displayName: "Source Team Dinner", availability: { status: "AVAILABLE", date: "2026-08-21", partySize: 10, visibleSlots: ["19:00"], menuText: "After work team dinner course, good for drinks with our shared beverage selection." } },
  },
  {
    id: "h004", content: "Good cafes nearby to meet up with a friend this afternoon.", referenceTime: "2026-08-19T12:00:00+08:00",
    goal: "RECOMMENDATION", area: "nearby", date: "2026-08-19", timeWindow: { earliest: "12:00", latest: "17:00" },
    facts: [
      { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "RECOMMENDATION", query: "cafes nearby" } },
      { field: "DATE", operation: "ASSERT", value: { kind: "DATE", relativeDay: "TODAY", raw: "this afternoon" } },
      { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", daypart: "AFTERNOON", relativeDay: "TODAY", raw: "this afternoon" } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "nearby" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "good for meeting a friend", polarity: "POSITIVE", strength: "SOFT" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "cafe", polarity: "POSITIVE", strength: "HARD" } },
    ],
    actions: ["SEARCH_RESTAURANTS", "INVESTIGATE_CANDIDATE_FACTS", "PRESENT_RESULTS"],
    source: { placeId: "offline-h004", displayName: "Source Afternoon Cafe", websiteFacts: { types: ["cafe"], hours: ["Wednesday: 10:00 AM – 6:00 PM"] } },
  },
  {
    id: "h005", content: "Any spots nearby with open tables right now for 4 people? Local food only, no fast food.", referenceTime: "2026-08-19T16:00:00+08:00",
    goal: "AVAILABILITY", area: "nearby", date: "2026-08-19", timeWindow: { earliest: "17:00", latest: "17:00" }, partySize: 4,
    facts: [
      { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "AVAILABILITY", query: "open tables nearby" } },
      { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", relativeOffsetMinutes: 0, raw: "right now" } },
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 4 } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "nearby" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "local food", polarity: "POSITIVE", strength: "HARD" } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "fast food", polarity: "NEGATIVE", strength: "HARD" } },
    ],
    actions: ["SEARCH_RESTAURANTS", "CHECK_AVAILABILITY", "END_READ"],
    source: { placeId: "offline-h005", displayName: "Source Local Food", availability: { status: "AVAILABLE", date: "2026-08-19", partySize: 4, visibleSlots: ["17:00"], menuText: "Local food tasting menu" } },
  },
];

function modelResponse(outputText: string, invocationId: string): ModelResponse {
  return { invocationId, provider: "FIXTURE", model: "fixed-independent-boundary", outputText, finishReason: "TOOL_CALLS", latencyMs: 0 };
}

function action(type: PlannedAction, candidateIds: string[] = []): Record<string, unknown> {
  return { type, question: "", relatedFields: [], retrievalHint: "", candidateIds, candidateId: "", offerId: "", decisionSummary: "explicit offline action plan" };
}

class FixedCurrentCaseModel implements ModelGateway {
  readonly requests: ModelRequest[] = [];
  private readonly remainingActions: PlannedAction[];

  constructor(private readonly plan: Plan) { this.remainingActions = [...plan.actions]; }

  async complete(request: ModelRequest): Promise<ModelResponse> {
    this.requests.push(request);
    if (request.purpose === "restaurant_semantic_interpret") {
      assert.ok(request.messages.some((message) => message.content.includes(this.plan.content)), "semantic model must receive the exact frozen user message");
      return modelResponse(JSON.stringify({ schemaVersion: "3", facts: this.plan.facts }), `semantic:${this.plan.id}`);
    }
    if (request.purpose !== "restaurant_agent_decide") throw new Error(`Unprepared model purpose: ${request.purpose}`);
    const next = this.remainingActions.shift();
    if (!next) throw new Error(`Unprepared agent decision after the fixed ${this.plan.id} sequence`);
    const payload = JSON.parse(request.messages.find((message) => message.role === "user")!.content) as { context: { candidates?: Array<{ id: string }> } };
    const candidateIds = payload.context.candidates?.map((candidate) => candidate.id) ?? [];
    if (["CHECK_AVAILABILITY", "INVESTIGATE_CANDIDATE_FACTS", "PRESENT_RESULTS"].includes(next)) {
      if (candidateIds.length !== 1) throw new Error(`${next} requires exactly one independently grounded candidate, got ${candidateIds.length}`);
      return modelResponse(JSON.stringify(action(next, candidateIds)), `agent:${this.plan.id}:${next}`);
    }
    return modelResponse(JSON.stringify(action(next)), `agent:${this.plan.id}:${next}`);
  }

  assertConsumed(): void { assert.deepEqual(this.remainingActions, [], `all fixed ${this.plan.id} actions must execute`); }
}

/** Actual production adapters; only HTTP and page observations are synthetic. */
function sourcesFor(plan: Plan, observedAt: string, model: ModelGateway) {
  const calls = { search: 0, facts: 0, availability: 0, namedPlace: 0, website: 0 };
  const address = "1 Ginza, Chuo City, Tokyo";
  const location = { latitude: HIGASHI_GINZA_EVALUATION_LOCATION.latitude, longitude: HIGASHI_GINZA_EVALUATION_LOCATION.longitude };
  const place = { id: plan.source.placeId, displayName: { text: plan.source.displayName }, formattedAddress: address,
    location, types: ["restaurant"], internationalPhoneNumber: "+81 3-1111-2222", websiteUri: "https://offline.example/cafe" };
  const client = new GooglePlacesClient({ apiKey: "mock-key", fetchImplementation: async (url, init) => {
    if (init?.method === "POST") {
      const body = JSON.parse(String(init.body));
      if (plan.source.addressComponent && body.textQuery === plan.source.addressComponent) {
        calls.namedPlace++;
        return new Response(JSON.stringify({ places: [{ id: "source-landmark", displayName: { text: plan.source.addressComponent }, location, types: ["train_station"] }] }), { status: 200 });
      }
      calls.search++;
      return new Response(JSON.stringify({ places: [place] }), { status: 200 });
    }
    assert.equal(String(url).split("/").at(-1), place.id, "Details must use the source ID from discovery");
    calls.facts++;
    if (!plan.source.websiteFacts) throw new Error(`Unplanned Details call for ${plan.id}`);
    return new Response(JSON.stringify(place), { status: 200 });
  } });
  const search = new GooglePlacesRestaurantSearch(client, () => observedAt, 10, { maxRequests: 10 });
  const browser: BrowserRuntime = { openSession: async () => {
    let page: BrowserSnapshot | undefined;
    return {
      metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM", engine: "CHROMIUM", startedAt: observedAt },
      navigate: async (target: string) => {
        const url = new URL(target);
        const inventory = plan.source.availability;
        if (target === place.websiteUri && plan.source.websiteFacts) {
          calls.website++;
          page = { url: target, title: place.displayName.text, text: place.displayName.text,
            html: `<script type="application/ld+json">${JSON.stringify({ "@type": "CafeOrCoffeeShop", name: place.displayName.text, address, servesCuisine: "cafe", openingHoursSpecification: { dayOfWeek: "Wednesday", opens: "10:00", closes: "18:00" } })}</script>` };
        } else if (url.hostname === "www.tablecheck.com" && inventory) {
          if (url.pathname === "/en/japan/search") {
            page = { url: target, title: "Map search", text: place.displayName.text, html: `<a href="/en/source-venue">${place.displayName.text}</a>` };
          } else if (url.pathname === "/en/source-venue") {
            page = { url: target, title: place.displayName.text, text: `${place.displayName.text} ${address} 03-1111-2222`,
              html: `<h1>${place.displayName.text}</h1><p class="address">${address}</p><a href="tel:03-1111-2222">03-1111-2222</a><a href="/en/source-venue/reserve/landing">Book a table</a>` };
          } else if (url.pathname === "/en/source-venue/reserve/landing") {
            assert.equal(url.searchParams.get("start_date"), inventory.date);
            assert.equal(url.searchParams.get("pax"), String(inventory.partySize));
            calls.availability++;
            page = { url: target, title: place.displayName.text, text: `${inventory.menuText} ${inventory.visibleSlots.join(" ")}`,
              html: `<div data-selected-date="${inventory.date}" data-pax="${inventory.partySize}"></div><section class="featured-menu">${inventory.menuText}</section>` +
                (inventory.status === "UNAVAILABLE" ? '<section data-availability-state="empty"></section>' : `<section data-availability-state="complete">${inventory.visibleSlots.map(slot => `<button class="time-slot is-available" data-time="${slot}">${slot}</button>`).join("")}</section>`) };
          } else throw new Error(`Unplanned TableCheck navigation: ${target}`);
        } else throw new Error(`Unplanned source navigation: ${target}`);
      },
      snapshot: async () => { if (!page) throw new Error("No planned page"); return page; },
      click: async () => { throw new Error("Unplanned source click"); }, fill: async () => { throw new Error("Unplanned source fill"); }, select: async () => { throw new Error("Unplanned source select"); },
      waitFor: async () => {}, screenshot: async () => new Uint8Array(), close: async () => {},
    };
  } };
  return { search, facts: composeLiveRestaurantFactRead(search, browser, model, undefined, () => observedAt),
    availability: new LiveBrowserAvailability(browser, model, { now: () => observedAt }), calls };
}

test("current H001-H005 raw requests complete through the real offline Hybrid composition without prepared fallbacks", async (t) => {
  const frozen = await loadFrozenLiveCases(RESTAURANT_READ_DEVELOPMENT_CASE_PATH);
  assert.deepEqual(frozen.map((item) => item.id), PLANS.map((plan) => plan.id));
  for (const plan of PLANS) await t.test(plan.id, async () => {
    const sourceCase = frozen.find((item) => item.id === plan.id)!;
    assert.equal(String(sourceCase.content).trimEnd(), plan.content, "the frozen user message is immutable test input");
    const observedAt = new Date(plan.referenceTime).toISOString();
    const model = new FixedCurrentCaseModel(plan);
    const sources = sourcesFor(plan, observedAt, model);
    const taskId = `offline-current:${plan.id}`;
    const composition = createHybridReadComposition({
      taskId, runId: `run:${taskId}`, clock: { now: () => new Date(observedAt) }, model,
      search: sources.search, facts: sources.facts, availability: sources.availability,
      loop: { maxSteps: 6, timeoutMs: 5_000 },
    });
    const semantic = await composition.interpretAndDispatch({ taskId, message: String(sourceCase.content), referenceTime: plan.referenceTime, timezone: "Asia/Tokyo" }, plan.area === "nearby" ? HIGASHI_GINZA_EVALUATION_LOCATION : undefined);
    assert.equal(semantic.status, "PROPOSED");
    const loop = await composition.coordinator.run(taskId);
    const state = composition.runtime.snapshot(taskId).domainState;
    const artifact = {
      status: "SUCCEEDED", stage: "AGENT_LOOP", caseId: plan.id, runId: taskId, materializedCase: sourceCase,
      finalSnapshot: composition.runtime.snapshot(taskId), trajectories: composition.trajectories.steps, loop,
      resourceUsage: { elapsedMs: 0, agentDecisions: composition.trajectories.steps.length, browserModelCalls: 0,
        googleRequests: sources.search.googleRequestUsage(`run:${taskId}:investigation:${state.investigationRevision}`) },
    };
    const evaluation = evaluateRestaurantHybridLiveArtifact(artifact, { path: `${plan.id}.mock.result.json`, sha256: "mock" });
    assert.equal(evaluation.findings.find(finding => finding.dimension === "AUTHORITATIVE_CONDITIONS")?.status, "SATISFIED", JSON.stringify(evaluation));
    assert.equal(evaluation.execution.taskProducedQualifiedResult, ["h001", "h003", "h004"].includes(plan.id) ? "YES" : "NO", JSON.stringify(evaluation));
    // The current evaluator verifies empty discovery but deliberately does not
    // certify general nonempty investigation sufficiency, including this no-slot result.
    assert.equal(evaluation.findings.find(finding => finding.dimension === "COMPLETION_OUTCOME")?.status, ["h002", "h005"].includes(plan.id) ? "NOT_EVALUATED" : "SATISFIED", JSON.stringify(evaluation));
    t.diagnostic(JSON.stringify({ caseId: plan.id, phase: state.phase, qualified: evaluation.execution.taskProducedQualifiedResult,
      completionDiagnostic: evaluation.findings.find(finding => finding.dimension === "COMPLETION_OUTCOME")?.status,
      sourceCalls: sources.calls }));
    model.assertConsumed();
    assert.equal(sources.calls.search, 1);
    assert.equal(state.intentDraft?.target?.goal, plan.goal);
    assert.equal(state.intentDraft?.date, plan.date);
    assert.deepEqual(state.intentDraft?.timeWindow, plan.timeWindow);
    assert.equal(state.intentDraft?.partySize, plan.partySize);
    if (plan.id === "h003") assert.equal(state.intentDraft?.temporalResolution?.timeWindow?.basis, "DAYPART:AFTER_WORK_BROAD_WINDOW");
    if (plan.id === "h004") {
      assert.equal(sources.calls.facts, 1); assert.equal(sources.calls.availability, 0);
      assert.equal(loop.status, "TERMINAL"); assert.equal(state.phase, "PRESENT_RESULTS");
    } else {
      assert.equal(sources.calls.facts, 0); assert.equal(sources.calls.availability, 1);
    }
    if (plan.id === "h001" || plan.id === "h003") {
      assert.equal(state.phase, "PRESENT_RESULTS");
      const candidateId = state.presentedResults?.candidateIds[0]!;
      assert.equal(state.availabilityChecks[candidateId]?.status, "AVAILABLE");
      assert.equal(state.availabilityChecks[candidateId]?.receptionMode, "RESERVATION_SUPPORTED");
      assert.equal(state.availability[candidateId]?.length, 1);
    }
    if (plan.id === "h002") {
      assert.equal(state.phase, "NO_VERIFIED_RESULT");
      const check = Object.values(state.availabilityChecks)[0]!;
      assert.equal(check.status, "UNAVAILABLE");
      assert.ok(state.readEvidence.some((evidence) => evidence.kind === "AVAILABILITY" && evidence.claims.inventoryStatus === "UNAVAILABLE"));
    }
    if (plan.id === "h005") {
      assert.equal(state.phase, "NO_VERIFIED_RESULT", "an observed slot cannot bypass the separately unverified negative HARD condition");
      assert.equal(Object.values(state.availabilityChecks)[0]?.status, "AVAILABLE");
    }
  });
});
