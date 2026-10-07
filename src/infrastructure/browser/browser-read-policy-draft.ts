import type { BrowserReadNetworkObservation, BrowserReadNetworkRequestRule } from "./browser-runtime.js";

/**
 * A value-free review aid. It never changes a BrowserReadNetworkPolicy and
 * deliberately emits no POST rule because safe body grammar needs human review.
 */
export interface BrowserReadPolicyDraft {
  status: "DRAFT_NOT_APPROVED";
  reviewedReads: BrowserReadNetworkRequestRule[];
  omitted: Array<{ origin: string; pathname: string; method: string; reason: "POST_REQUIRES_BODY_REVIEW" | "NON_READ_METHOD" | "NOT_ADMITTED" }>;
}

function resourceType(value: string): BrowserReadNetworkRequestRule["resourceTypes"][number] | undefined {
  return ["script", "stylesheet", "font", "image", "media", "xhr", "fetch"].includes(value)
    ? value as BrowserReadNetworkRequestRule["resourceTypes"][number]
    : undefined;
}

/** Builds a human-reviewable exact read grammar from an installed Guard's value-free request trace. */
export function draftReviewedReads(observations: readonly BrowserReadNetworkObservation[]): BrowserReadPolicyDraft {
  const reviewed = new Map<string, BrowserReadNetworkRequestRule>();
  const omitted: BrowserReadPolicyDraft["omitted"] = [];
  for (const observation of observations) {
    if (observation.outcome !== "ADMITTED") {
      omitted.push({ origin: observation.origin, pathname: observation.pathname, method: observation.method, reason: "NOT_ADMITTED" });
      continue;
    }
    if (observation.method === "POST") {
      omitted.push({ origin: observation.origin, pathname: observation.pathname, method: observation.method, reason: "POST_REQUIRES_BODY_REVIEW" });
      continue;
    }
    if (observation.method !== "GET" && observation.method !== "HEAD") {
      omitted.push({ origin: observation.origin, pathname: observation.pathname, method: observation.method, reason: "NON_READ_METHOD" });
      continue;
    }
    const type = resourceType(observation.resourceType);
    if (!type) continue;
    const queryKeys = [...new Set(observation.queryKeys)].sort();
    const key = JSON.stringify([observation.origin, observation.pathname, observation.method, type, queryKeys]);
    reviewed.set(key, {
      origin: observation.origin,
      pathname: observation.pathname,
      resourceTypes: [type],
      methods: [observation.method],
      queryKeys,
    });
  }
  return { status: "DRAFT_NOT_APPROVED", reviewedReads: [...reviewed.values()], omitted };
}
