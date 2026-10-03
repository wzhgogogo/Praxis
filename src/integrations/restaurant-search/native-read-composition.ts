import type { ModelGateway } from "../../core/model/contracts.js";
import type { BrowserExecutionBudget, BrowserExecutionDiagnostic } from "../../infrastructure/browser/browser-task-executor.js";
import type { BrowserRuntime } from "../../infrastructure/browser/browser-runtime.js";
import { ModelBrowserReadActionDecision } from "../../infrastructure/browser/browser-action-decision.js";
import { GooglePlacesRestaurantSearch } from "../google/google-places-restaurant-search.js";
import { composeLiveRestaurantFactRead } from "../restaurant-facts/live-restaurant-facts.js";
import { ModelRestaurantFactJudgment } from "../restaurant-facts/model-fact-judgment.js";
import { NativeSourceFactRead, SourceAwareFactRead } from "../restaurant-facts/native-source-facts.js";
import { NativeRestaurantSearch } from "./native-restaurant-search.js";

/** Shared Web/Hybrid composition; flag selection belongs at the outer entry. */
export function composeNativeRestaurantRead(
  google: GooglePlacesRestaurantSearch,
  runtime: BrowserRuntime,
  model: ModelGateway,
  browserBudget?: BrowserExecutionBudget,
  onBrowserDiagnostic?: (diagnostic: BrowserExecutionDiagnostic) => void,
  evaluationLocation?: { latitude: number; longitude: number; radiusMeters: number; label: string },
  now?: () => string,
  nativeDiscoveryLimits?: { maxOperationsPerCandidate?: number },
) {
  return {
    search: new NativeRestaurantSearch(runtime, google, now, evaluationLocation, new ModelBrowserReadActionDecision(model), browserBudget, onBrowserDiagnostic, nativeDiscoveryLimits),
    facts: new SourceAwareFactRead(
      new NativeSourceFactRead(runtime, new ModelRestaurantFactJudgment(model, now), now),
      composeLiveRestaurantFactRead(google, runtime, model, browserBudget, undefined, onBrowserDiagnostic),
    ),
  };
}
