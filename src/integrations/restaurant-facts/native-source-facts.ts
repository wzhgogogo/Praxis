import { createHash } from "node:crypto";

import type { RestaurantCandidateFactPort } from "../../application/restaurant-execution-router.js";
import type { RestaurantCandidateFactRead, RestaurantCandidateFactRequest, RestaurantReadEvidence, RestaurantFactSourceDocument } from "../../domains/restaurant/contracts.js";
import type { BrowserRuntime } from "../../infrastructure/browser/browser-runtime.js";
import { inspectNativeOutletContinuity } from "../restaurant-availability/native-outlet-continuity.js";
import { parseTabelogOutletIdentityWithEvidence } from "../tabelog/tabelog-page-parser.js";
import { parseTableCheckOutletIdentityWithEvidence } from "../tablecheck/tablecheck-page-parser.js";
import type { RestaurantFactJudgmentPort } from "./model-fact-judgment.js";

function key(value: string): string | undefined {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname.replace(/\/$/, "")}`;
  } catch { return undefined; }
}

function sourceDocument(candidateId: string, identityEvidenceId: string, text: string): RestaurantFactSourceDocument {
  const statements: RestaurantFactSourceDocument["statements"] = [];
  let total = 0;
  for (const line of text.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)) {
    if (line.length > 1_600 || total + line.length > 6_000 || statements.length >= 50) continue;
    total += line.length;
    statements.push({ id: `${candidateId}:statement:${statements.length}`, text: line });
  }
  return { id: `${candidateId}:document:${createHash("sha256").update(text).digest("hex").slice(0, 16)}`, candidateId, identityEvidenceId, statements };
}

/** Reopens the same source detail and cites its own text; Google details are never required. */
export class NativeSourceFactRead implements RestaurantCandidateFactPort {
  readonly executionRoute = "GENERIC_BROWSER" as const;

  constructor(
    private readonly runtime: BrowserRuntime,
    private readonly judgment: RestaurantFactJudgmentPort,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async inspectFacts(request: RestaurantCandidateFactRequest, signal: AbortSignal): Promise<RestaurantCandidateFactRead> {
    const startedAt = Date.now();
    const evidence: RestaurantReadEvidence[] = [];
    const sourceDocuments: RestaurantFactSourceDocument[] = [];
    const factChecks: RestaurantCandidateFactRead["factChecks"] = {};
    const nativeContinuity: NonNullable<RestaurantCandidateFactRead["metadata"]["nativeContinuity"]> = [];
    let modelCalls = 0;
    for (const candidate of request.candidates) {
      const ids = candidate.restaurant.sourceIds;
      const provider = ids.tabelogNativeDetailUri && ids.tabelog ? "TABELOG" as const
        : ids.tablecheckNativeGuideUri && ids.tablecheck ? "TABLECHECK" as const : undefined;
      const sourceUrl = provider === "TABELOG" ? ids.tabelogNativeDetailUri : provider === "TABLECHECK" ? ids.tablecheckNativeGuideUri : undefined;
      const sourceEntityId = provider === "TABELOG" ? ids.tabelog : provider === "TABLECHECK" ? ids.tablecheck : undefined;
      const checkedAt = this.now();
      if (!provider || !sourceUrl || !sourceEntityId || !key(sourceUrl)) {
        factChecks[candidate.restaurant.id] = { status: "UNKNOWN", checkedAt, evidenceIds: [], reasonCode: "NATIVE_SOURCE_ID_MISSING" };
        continue;
      }
      const session = await this.runtime.openSession({ signal });
      try {
        await session.navigate(sourceUrl, { timeoutMs: 30_000 });
        const page = await session.snapshot();
        const extraction = provider === "TABELOG"
          ? parseTabelogOutletIdentityWithEvidence(page, { sourceEntityId, sourceUrl, outletName: candidate.restaurant.outletName })
          : parseTableCheckOutletIdentityWithEvidence(page, sourceUrl);
        const continuity = extraction && inspectNativeOutletContinuity({ provider, sourceEntityId, sourceUrl }, page, {
          sourceEntityId: extraction.outlet.sourceEntityId, sourceUrl: extraction.outlet.sourceUrl,
          canonicalUrl: extraction.canonicalUrl,
          pageOwnedName: extraction.fields.outletName.source !== "ABSENT" && extraction.fields.outletName.source !== "SEARCH_RESULT",
          pageOwnedAddress: extraction.fields.address.source !== "ABSENT" && extraction.fields.address.source !== "SEARCH_RESULT",
        });
        nativeContinuity.push({ candidateId: candidate.restaurant.id, provider, expectedSourceEntityId: sourceEntityId,
          ...(continuity?.observedSourceEntityId ? { observedSourceEntityId: continuity.observedSourceEntityId } : {}),
          confirmed: continuity?.confirmed ?? false, reason: continuity?.reason ?? "PAGE_IDENTITY_ABSENT" });
        if (!extraction || !continuity?.confirmed) {
          factChecks[candidate.restaurant.id] = { status: "UNKNOWN", checkedAt, evidenceIds: [], reasonCode: "NATIVE_SOURCE_IDENTITY_UNCONFIRMED" };
          continue;
        }
        const identityEvidenceId = `evidence:restaurant:native-fact-identity:${createHash("sha256").update(`${candidate.restaurant.id}:${checkedAt}`).digest("hex").slice(0, 24)}`;
        const identity: RestaurantReadEvidence = {
          evidenceId: identityEvidenceId, kind: "ENTITY_MATCH", provider,
          candidateId: candidate.restaurant.id, sourceEntityId, sourceUrl: extraction.outlet.sourceUrl,
          observedAt: checkedAt, requestFingerprint: JSON.stringify({ candidateId: candidate.restaurant.id, intent: request.intent }),
          claims: { outletName: extraction.outlet.outletName, address: extraction.outlet.address ?? "" },
          entityMatch: { confidence: "HIGH", matchedBy: ["NATIVE_SOURCE_ID_AND_DETAIL"] },
        };
        const document = sourceDocument(candidate.restaurant.id, identityEvidenceId, page.text);
        const judged = await this.judgment.judge({ candidate, intent: request.intent, evidence: [identity], sourceDocuments: [document] });
        modelCalls += judged.modelUsage?.calls ?? 0;
        evidence.push(identity, ...judged.evidence);
        sourceDocuments.push(document);
        factChecks[candidate.restaurant.id] = { status: "COMPLETED", checkedAt,
          evidenceIds: [identityEvidenceId, ...judged.evidence.map((item) => item.evidenceId)], sourceProvider: provider };
      } catch (error) {
        if (signal.aborted || (error && typeof error === "object" && "code" in error && (
          error.code === "MODEL_CALL_BUDGET_EXHAUSTED" || error.code === "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED"
          || error.code === "BROWSER_RUNTIME_UNAVAILABLE" || error.code === "BROWSER_ABORTED"
        ))) throw error;
        factChecks[candidate.restaurant.id] = { status: "UNKNOWN", checkedAt, evidenceIds: [],
          reasonCode: error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : "NATIVE_FACT_READ_FAILED" };
      } finally {
        await session.close();
      }
    }
    const providers = new Set(request.candidates.map((candidate) => candidate.restaurant.sourceIds.tabelogNativeDetailUri ? "TABELOG" : "TABLECHECK"));
    return { evidence, factChecks, sourceDocuments,
      metadata: { provider: providers.size === 1 ? [...providers][0]! : "RESTAURANT_WEBSITE",
        route: this.executionRoute, latencyMs: Date.now() - startedAt,
        ...(nativeContinuity.length ? { nativeContinuity } : {}),
        ...(modelCalls ? { modelUsage: { calls: modelCalls } } : {}) },
    };
  }
}

/** One fact port for a mixed candidate pool; each candidate keeps its source. */
export class SourceAwareFactRead implements RestaurantCandidateFactPort {
  readonly executionRoute = "GENERIC_BROWSER" as const;
  constructor(private readonly native: RestaurantCandidateFactPort, private readonly google: RestaurantCandidateFactPort) {}
  googleRequestUsage(readRunId: string | undefined) { return this.google.googleRequestUsage?.(readRunId) ?? { limit: 0, total: 0, namedPlaceResolution: 0, discovery: 0, placeDetails: 0 }; }
  async inspectFacts(request: RestaurantCandidateFactRequest, signal: AbortSignal): Promise<RestaurantCandidateFactRead> {
    const nativeCandidates = request.candidates.filter((item) => item.restaurant.sourceIds.tabelogNativeDetailUri || item.restaurant.sourceIds.tablecheckNativeGuideUri);
    const googleCandidates = request.candidates.filter((item) => !nativeCandidates.includes(item));
    const startedAt = Date.now();
    const reads: RestaurantCandidateFactRead[] = [];
    if (nativeCandidates.length) reads.push(await this.native.inspectFacts({ ...request, candidates: nativeCandidates, candidateIds: nativeCandidates.map((item) => item.restaurant.id) }, signal));
    if (googleCandidates.length) reads.push(await this.google.inspectFacts({ ...request, candidates: googleCandidates, candidateIds: googleCandidates.map((item) => item.restaurant.id) }, signal));
    return { evidence: reads.flatMap((read) => read.evidence),
      factChecks: Object.assign({}, ...reads.map((read) => read.factChecks)),
      sourceDocuments: reads.flatMap((read) => read.sourceDocuments ?? []),
      metadata: { provider: reads.length === 1 ? reads[0]!.metadata.provider : "RESTAURANT_WEBSITE", route: this.executionRoute,
        latencyMs: Date.now() - startedAt,
        ...(reads.some((read) => read.metadata.nativeContinuity?.length) ? { nativeContinuity: reads.flatMap((read) => read.metadata.nativeContinuity ?? []) } : {}),
        ...(reads.some((read) => read.metadata.modelUsage?.calls) ? { modelUsage: { calls: reads.reduce((sum, read) => sum + (read.metadata.modelUsage?.calls ?? 0), 0) } } : {}) },
    };
  }
}
