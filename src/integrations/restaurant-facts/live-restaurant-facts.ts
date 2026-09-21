import type { ModelGateway } from "../../core/model/contracts.js";
import { ModelBrowserReadActionDecision } from "../../infrastructure/browser/browser-action-decision.js";
import type { BrowserExecutionBudget, BrowserExecutionDiagnostic } from "../../infrastructure/browser/browser-task-executor.js";
import type { BrowserRuntime } from "../../infrastructure/browser/browser-runtime.js";
import type { RestaurantCandidateFactPort } from "../../application/restaurant-execution-router.js";
import { GoogleListedWebsiteFactRead } from "./google-listed-website-facts.js";
import { GoogleThenWebsiteFactRead } from "./google-then-website-facts.js";
import { ModelRestaurantFactJudgment } from "./model-fact-judgment.js";

/**
 * The sole real browser-backed fact composition.  Web and Hybrid diagnostics
 * receive exactly this chain; fixtures explicitly use their fixture port.
 */
export function composeLiveRestaurantFactRead(
  google: RestaurantCandidateFactPort,
  runtime: BrowserRuntime,
  model: ModelGateway,
  browserBudget?: BrowserExecutionBudget,
  now?: () => string,
  onBrowserDiagnostic?: (diagnostic: BrowserExecutionDiagnostic) => void,
): RestaurantCandidateFactPort {
  return new GoogleThenWebsiteFactRead(
    google,
    new GoogleListedWebsiteFactRead(runtime, now, new ModelBrowserReadActionDecision(model), browserBudget, onBrowserDiagnostic),
    new ModelRestaurantFactJudgment(model, now),
  );
}
