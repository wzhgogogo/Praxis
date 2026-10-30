import { RestaurantPageQuestionReader } from "../restaurant-facts/page-question-reader.js";
import { pageQuestionRuntime } from "../restaurant-facts/page-question-read-budget.js";
import {ModelDiscoveryRetrievalPlanner} from "./discovery-retrieval-planner.js";
import type { BrowserTaskExecutorOptions } from "../../infrastructure/browser/browser-task-executor.js";
import type { ModelGateway } from "../../core/model/contracts.js";
import type { BrowserExecutionBudget, BrowserExecutionDiagnostic } from "../../infrastructure/browser/browser-task-executor.js";
import type { BrowserRuntime } from "../../infrastructure/browser/browser-runtime.js";
import { ModelBrowserReadActionDecision } from "../../infrastructure/browser/browser-action-decision.js";
import { GooglePlacesRestaurantSearch } from "../google/google-places-restaurant-search.js";
import { composeLiveRestaurantFactRead } from "../restaurant-facts/live-restaurant-facts.js";
import { ModelRestaurantFactJudgment } from "../restaurant-facts/model-fact-judgment.js";
import { NativeSourceFactRead, SourceAwareFactRead } from "../restaurant-facts/native-source-facts.js";
import { NativeRestaurantSearch } from "./native-restaurant-search.js";
import { discoveryPackNetworkPolicy, restaurantDiscoveryPacks, type DiscoverySourcePack } from "./source-packs.js";

/** Shared Web/Hybrid composition; every production discovery read follows the injected pack cursor. */
export function composeNativeRestaurantRead(
  google: GooglePlacesRestaurantSearch,
  runtime: BrowserRuntime,
  model: ModelGateway,
  browserBudget: BrowserExecutionBudget | undefined,
  onBrowserDiagnostic: ((diagnostic: BrowserExecutionDiagnostic) => void) | undefined,
  evaluationLocation: { latitude: number; longitude: number; radiusMeters: number; label: string } | undefined,
  now: (() => string) | undefined,
  nativeDiscoveryLimits: BrowserTaskExecutorOptions,
  factLimits: BrowserTaskExecutorOptions,
  packs?: readonly DiscoverySourcePack[],
) {
  const selectedPacks = packs ?? restaurantDiscoveryPacks;
  const networkPolicy = runtime.readNetworkBoundaryCapability === "ISOLATED_CONTEXT" ? discoveryPackNetworkPolicy(selectedPacks) : undefined;
  const questions = new RestaurantPageQuestionReader(model, (observe, scopedBudget, scopedModel = model, visits) => {
    const browser = visits ? pageQuestionRuntime(runtime, visits) : runtime;
    return new SourceAwareFactRead(
      new NativeSourceFactRead(factLimits, browser, new ModelRestaurantFactJudgment(scopedModel, now), now, new ModelBrowserReadActionDecision(scopedModel), scopedBudget, onBrowserDiagnostic, networkPolicy, observe, scopedModel),
      composeLiveRestaurantFactRead(factLimits, google, browser, scopedModel, scopedBudget, now, onBrowserDiagnostic, observe),
    );
  }, now, nativeDiscoveryLimits.maxAutomaticElapsedMs ?? 500_000, browserBudget);
  return {
    questions,
    search: new NativeRestaurantSearch(runtime, google, new ModelDiscoveryRetrievalPlanner(model,browserBudget), now, evaluationLocation, new ModelBrowserReadActionDecision(model), browserBudget, onBrowserDiagnostic, nativeDiscoveryLimits, networkPolicy, selectedPacks),
    facts: questions.facts,
  };
}
