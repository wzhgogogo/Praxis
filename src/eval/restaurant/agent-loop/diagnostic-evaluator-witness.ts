import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { loadPostDeliveryTabelogObservation } from "./diagnostic-evaluator-grounding.js";
import type { PostDeliveryTabelogObservation } from "./diagnostic-evaluator-grounding.js";
import type { RunRecord } from "./diagnostic-evaluator-record.js";

export interface WitnessOutlet {
  outletName: string; sourceId: string; address?: string; distanceMeters?: number;
  hardEvidence: Array<{ criterion: string; quote: string }>;
  observation?: PostDeliveryTabelogObservation;
  certifiedRequest?: { date: string; time: string; partySize: number; text: string };
  refs: string[];
}
export interface WitnessOracle {
  applicableArtifactSha256: string;
  radiusMeters?: number;
  validUntil?: string;
  rows: WitnessOutlet[];
  sourceRef: string;
}
export interface WitnessFunnel {
  outletName: string; sourceId: string;
  discovery: { status: "FOUND" | "NOT_FOUND" | "NOT_EVALUATED"; candidateIds: string[]; possibleCandidateIds: string[]; basis: string };
  identity: { status: "OBSERVED" | "NOT_READ" | "NOT_EVALUATED"; evidenceIds: string[] };
  facts: { status: "OBSERVED" | "NOT_READ" | "NOT_EVALUATED"; evidenceIds: string[] };
  availability: { recorded: Array<{ candidateId: string; status: string; reasonCode?: string }>; witness: "AVAILABLE" | "NO_MATCHING_SLOT" | "NOT_EVALUATED"; observedAt: string | null; reason: string };
  presented: "YES" | "NO" | "NOT_EVALUATED";
  feasible: "SUPPORTED" | "NOT_SUPPORTED" | "NOT_EVALUATED";
  blocker: { stage: string; certainty: "HYPOTHESIS"; reason: string };
  evidenceRefs: string[];
}
const record = (value: unknown): Record<string, unknown> => { if (!value || typeof value !== "object" || Array.isArray(value)) throw Error("Invalid witness source object"); return value as Record<string, unknown>; };
const text = (value: unknown): string => { if (typeof value !== "string" || !value.trim()) throw Error("Invalid witness source string"); return value; };
const array = (value: unknown): unknown[] => { if (!Array.isArray(value)) throw Error("Invalid witness source array"); return value; };
const hash = (value: Uint8Array) => createHash("sha256").update(value).digest("hex");
const tokens = (value: string) => value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(/\s+/).filter(Boolean);
const name = (value: string) => tokens(value).sort().join(" ");
const address = (value: string) => tokens(value).join(" "); // keep house/floor numbers and ordering
const id = (value: string) => value.split("/").filter(Boolean).at(-1);

/** Existing independently registered roster + original raw recheck, no labels. */
export function loadWitnessOracle(input: { manifestPath: string; registryPath: string; variantId: string; artifactSha256: string; rawDirectory?: string }): WitnessOracle {
  const manifestBytes = readFileSync(input.manifestPath), registryBytes = readFileSync(input.registryPath);
  const manifest = record(JSON.parse(manifestBytes.toString())), registry = record(JSON.parse(registryBytes.toString()));
  const variant = array(registry.variants).map(record).find(entry => entry.variantId === input.variantId);
  if (!variant) throw Error("Witness roster variant not registered");
  const registered = [...array(variant.witnesses), ...(Array.isArray(variant.backupWitnesses) ? variant.backupWitnesses : [])].map(record);
  const center = variant.center === undefined ? undefined : record(variant.center);
  const manifestRef = `${resolve(input.manifestPath)}#sha256=${hash(manifestBytes)}`;
  const registryRef = `${resolve(input.registryPath)}#sha256=${hash(registryBytes)}`;
  const request = typeof variant.request === "string" ? variant.request : undefined;
  const parameters = request?.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}) x(\d+)\b/);
  const certifiedRequest = variant.classification === "KNOWN_FEASIBLE_SUPPORTED" && parameters
    ? { date: parameters[1]!, time: parameters[2]!, partySize: Number(parameters[3]), text: request! } : undefined;
  // These are retained historical recording fields, not alternative live
  // runners. Missing observations still leave every registered outlet below.
  const rawRows = manifest.rows ?? manifest.witnessRaw ?? manifest.witness;
  const rows: WitnessOutlet[] = array(rawRows).map(value => {
    const row = record(value), params = record(row.parameters), sourceId = text(params.rst_id);
    const original = registered.find(entry => id(text(entry.sourceUrl)) === sourceId);
    // Original absolute paths are provenance; portable reads stay beside manifest.
    const rawDirectory = input.rawDirectory ?? dirname(input.manifestPath);
    const bodyPath = resolve(rawDirectory, basename(text(row.bodyPath)));
    const metadataPath = resolve(rawDirectory, basename(typeof row.metadataPath === "string" ? row.metadataPath : text(row.bodyPath).replace(/\.body\.txt$/, ".metadata.json")));
    const observation = loadPostDeliveryTabelogObservation(metadataPath, bodyPath);
    if (observation.sha256 !== row.sha256) throw Error("Witness manifest/raw response SHA mismatch");
    const hardEvidence = original && Array.isArray(original.hardEvidence) ? original.hardEvidence.map(value => {
      const entry = record(value); return { criterion: text(entry.criterion), quote: text(entry.quote) };
    }) : [];
    return { outletName: text(row.name ?? original?.outletName), sourceId, ...(typeof original?.address === "string" ? { address: original.address } : {}),
      ...(typeof original?.distanceMeters === "number" ? { distanceMeters: original.distanceMeters } : {}), hardEvidence, observation,
      ...(original && certifiedRequest ? { certifiedRequest } : {}),
      refs: [manifestRef, registryRef, `${bodyPath}#sha256=${observation.sha256}`, `${metadataPath}#sha256=${hash(readFileSync(metadataPath))}`] };
  });
  // The independent roster defines the required witness set. A missing raw
  // observation must not shrink that set or borrow the old roster's slot text.
  for (const original of registered) {
    const sourceId = text(id(text(original.sourceUrl)));
    if (rows.some(row => row.sourceId === sourceId)) continue;
    const hardEvidence = Array.isArray(original.hardEvidence) ? original.hardEvidence.map(value => {
      const entry = record(value); return { criterion: text(entry.criterion), quote: text(entry.quote) };
    }) : [];
    rows.push({ outletName: text(original.outletName), sourceId,
      ...(typeof original.address === "string" ? { address: original.address } : {}),
      ...(typeof original.distanceMeters === "number" ? { distanceMeters: original.distanceMeters } : {}),
      ...(certifiedRequest ? { certifiedRequest } : {}), hardEvidence, refs: [manifestRef, registryRef] });
  }
  return { applicableArtifactSha256: input.artifactSha256, ...(typeof center?.radiusMeters === "number" ? { radiusMeters: center.radiusMeters } : {}),
    ...(typeof registry.validUntil === "string" ? { validUntil: registry.validUntil } : {}), rows, sourceRef: manifestRef };
}

/** Context is routing/provenance only, never outcome labels or new Gold. */
export function loadWitnessContext(contextPath: string, runId: string): WitnessOracle | undefined {
  const bytes = readFileSync(contextPath), source = record(JSON.parse(bytes.toString()));
  if (Object.keys(source).some(key => !["schemaVersion", "entries"].includes(key)) || source.schemaVersion !== "1") throw Error("Invalid witness context schema/unknown key");
  const entries = array(source.entries).map(record);
  const keys = ["runId", "artifactSha256", "manifestPath", "registryPath", "variantId"], optional = ["rawDirectory"];
  for (const entry of entries) {
    if (Object.keys(entry).some(key => ![...keys, ...optional].includes(key)) || keys.some(key => typeof entry[key] !== "string" || !entry[key])
      || entry.rawDirectory !== undefined && (typeof entry.rawDirectory !== "string" || !entry.rawDirectory)) throw Error("Invalid witness context key/null");
    if (!/^[a-f0-9]{64}$/.test(text(entry.artifactSha256))) throw Error("Invalid witness artifact SHA");
  }
  if (new Set(entries.map(entry => entry.runId)).size !== entries.length) throw Error("Duplicate witness run context");
  const entry = entries.find(entry => entry.runId === runId);
  if (!entry) return undefined;
  const oracle = loadWitnessOracle({ manifestPath: text(entry.manifestPath), registryPath: text(entry.registryPath), variantId: text(entry.variantId), artifactSha256: text(entry.artifactSha256), ...(entry.rawDirectory ? { rawDirectory: text(entry.rawDirectory) } : {}) });
  oracle.rows.forEach(row => row.refs.push(`${resolve(contextPath)}#sha256=${hash(bytes)}`));
  return oracle;
}

export function buildWitnessFunnel(root: RunRecord, sourceSha256: string, oracle: WitnessOracle,
  reads: Array<{ candidateIds: string[]; evidenceIds: string[]; applicableRequest: boolean; ref: string }> | undefined): WitnessFunnel[] {
  const domain = root.finalSnapshot?.domainState, candidates = domain?.candidates ?? [], evidence = domain?.readEvidence ?? [];
  const gold = root.materializedCase?.semantic, party = typeof gold?.party_size === "number" ? gold.party_size : gold?.party_size?.value;
  const earliest = gold?.permittedAlternativeTimeWindow?.earliest ?? gold?.time?.value ?? gold?.time?.start;
  const latest = gold?.permittedAlternativeTimeWindow?.latest ?? gold?.time?.value ?? gold?.time?.end;
  const applicable = sourceSha256 === oracle.applicableArtifactSha256;
  const declaredRadii = [...new Set((root.materializedCase?.acceptance?.required_claims ?? []).flatMap(claim => {
    const match = claim.match(/\bwithin ([\d,]+) m\b/); return match ? [Number(match[1]!.replaceAll(",", ""))] : [];
  }))];
  const radiusMeters = oracle.radiusMeters ?? (declaredRadii.length === 1 && declaredRadii[0]! > 0 ? declaredRadii[0] : undefined);
  const discovered = new Set((root.trajectories ?? []).filter(step => ["EXECUTED", "TERMINAL"].includes(step.stepOutcome ?? "") && step.observation?.type === "DISCOVERY")
    .flatMap(step => step.observation?.candidateIds ?? []));
  const knownScope = domain?.candidates !== undefined && reads !== undefined
    && candidates.every(candidate => candidate.restaurant?.id && discovered.has(candidate.restaurant.id))
    && [...discovered].every(candidateId => candidates.some(candidate => candidate.restaurant?.id === candidateId));
  return oracle.rows.map(witness => {
    const names = candidates.filter(candidate => name(candidate.restaurant?.outletName ?? "") === name(witness.outletName));
    const direct = names.filter(candidate => candidate.restaurant?.id?.startsWith("tabelog:") && id(candidate.restaurant.sourceIds?.tabelog ?? candidate.restaurant.id.slice(8)) === witness.sourceId);
    const matched = names.filter(candidate => witness.address && candidate.restaurant?.address && address(witness.address) === address(candidate.restaurant.address));
    const exact = [...new Set([...direct, ...matched])];
    // A same-source ID cannot override an explicit address/floor conflict.
    const accepted = exact.filter(candidate => !witness.address || !candidate.restaurant?.address || address(witness.address) === address(candidate.restaurant.address));
    const candidateIds = accepted.flatMap(candidate => candidate.restaurant?.id ?? []);
    const possibleCandidateIds = names.flatMap(candidate => candidate.restaurant?.id ?? []).filter(candidateId => !candidateIds.includes(candidateId));
    const unknownAddress = names.length > 0 && !accepted.length && (!witness.address || names.some(candidate => !candidate.restaurant?.address));
    const status = !applicable || !knownScope || unknownAddress ? "NOT_EVALUATED" : accepted.length ? "FOUND" : "NOT_FOUND";
    const observed = new Set((reads ?? []).filter(read => read.applicableRequest && read.candidateIds.some(candidateId => candidateIds.includes(candidateId))).flatMap(read => read.evidenceIds));
    const associated = evidence.filter(entry => candidateIds.includes(entry.candidateId ?? "") && observed.has(entry.evidenceId ?? ""));
    const identities = associated.filter(entry => entry.kind === "ENTITY_MATCH" && entry.sourceEntityId
      && (entry.provider !== "TABELOG" || id(entry.sourceEntityId) === witness.sourceId));
    const factIds = new Set(candidateIds.flatMap(candidateId => domain?.factChecks?.[candidateId]?.evidenceIds ?? []));
    const facts = associated.filter(entry => entry.kind === "RESTAURANT_FACT" && entry.provider !== "MODEL_JUDGMENT" && factIds.has(entry.evidenceId ?? "")
      && identities.some(identity => identity.provider === entry.provider && identity.sourceEntityId === entry.sourceEntityId));
    const recorded = candidateIds.flatMap(candidateId => {
      const check = domain?.availabilityChecks?.[candidateId];
      return check?.status ? [{ candidateId, status: check.status, ...(check.reasonCode ? { reasonCode: check.reasonCode } : {}) }] : [];
    });
    const raw = witness.observation;
    const matching = applicable && raw && raw.status === 200 && raw.complete && gold?.date?.value && party !== undefined && earliest && latest
      && raw.date === gold.date.value && raw.party === party && new URL(raw.url).searchParams.get("rst_id") === witness.sourceId
      && raw.slots.every(slot => slot.outlet === witness.sourceId && slot.date === raw.date && slot.party === raw.party && slot.time === slot.linkedTime);
    const slots = (raw?.slots ?? []).filter(slot => slot.outlet === witness.sourceId && slot.date === gold?.date?.value && slot.party === party && slot.time === slot.linkedTime && slot.time && earliest && latest && slot.time >= earliest && slot.time <= latest);
    const available = !matching ? "NOT_EVALUATED" : slots.length ? "AVAILABLE" : "NO_MATCHING_SLOT";
    const hard = gold?.criteria?.filter(criterion => criterion.strength === "HARD") ?? [];
    const certification = witness.certifiedRequest;
    const certifiedScope = certification && certification.date === gold?.date?.value && certification.partySize === party && earliest && latest
      && certification.time >= earliest && certification.time <= latest;
    const hardGold = gold?.criteria !== undefined && gold.criteria.every(criterion => criterion.value && criterion.strength && criterion.polarity)
      && hard.every(criterion => criterion.polarity === "POSITIVE"
        // This mapping is independent reviewer Gold, not source text generated
        // from user requirements. Its supporting quote need not repeat them.
        ? witness.hardEvidence.some(entry => name(entry.criterion) === name(criterion.value ?? "") && entry.quote.trim())
        : criterion.polarity === "NEGATIVE" && certification && certifiedScope
          && (` ${tokens(certification.text).join(" ")} `).includes(` no ${tokens(criterion.value ?? "").join(" ")} `));
    const withinArea = radiusMeters !== undefined && witness.distanceMeters !== undefined && witness.distanceMeters <= radiusMeters;
    const feasible = available === "NO_MATCHING_SLOT" ? "NOT_SUPPORTED" : available === "AVAILABLE" && hardGold && withinArea ? "SUPPORTED" : "NOT_EVALUATED";
    const claimed = candidateIds.some(candidateId => domain?.presentedResults?.candidateIds?.includes(candidateId));
    const actualPresentation = root.trajectories?.some(step => ["EXECUTED", "TERMINAL"].includes(step.stepOutcome ?? "")
      && step.agentAction?.type === "PRESENT_RESULTS" && step.observation?.type === "RESULTS_PRESENTED"
      && step.agentAction.candidateIds?.some(candidateId => candidateIds.includes(candidateId)));
    const presented = !applicable || domain?.presentedResults === undefined && domain?.phase === "PRESENT_RESULTS" || claimed && !actualPresentation ? "NOT_EVALUATED" : claimed ? "YES" : "NO";
    const stage = status === "NOT_EVALUATED" || available === "NOT_EVALUATED" ? "NOT_EVALUATED" : feasible === "NOT_SUPPORTED" ? "NONE" : status !== "FOUND" ? "DISCOVERY"
      : !identities.length ? "IDENTITY" : !facts.length ? "FACTS" : !recorded.length || recorded.every(check => check.status !== "AVAILABLE") ? "AVAILABILITY" : presented !== "YES" ? "PRESENTATION" : "NONE";
    return { outletName: witness.outletName, sourceId: witness.sourceId,
      discovery: { status, candidateIds, possibleCandidateIds, basis: !applicable ? "Witness context belongs to a different artifact SHA" : unknownAddress ? "Cross-source name matches, but independent witness/candidate address is missing" : direct.length ? "Registered same-source outlet ID and name; explicit address conflicts still veto" : "Cross-source name AND address; no phone or production eligibility oracle" },
      identity: { status: status !== "FOUND" || !reads ? "NOT_EVALUATED" : identities.length ? "OBSERVED" : "NOT_READ", evidenceIds: identities.flatMap(entry => entry.evidenceId ?? []) },
      facts: { status: status !== "FOUND" || !reads ? "NOT_EVALUATED" : facts.length ? "OBSERVED" : "NOT_READ", evidenceIds: facts.flatMap(entry => entry.evidenceId ?? []) },
      availability: { recorded, witness: available, observedAt: raw?.observedAt ?? null,
        reason: !raw ? "Registered witness has no raw recheck observation; old roster slot text is not current inventory."
          : available === "NOT_EVALUATED" ? "Raw recheck does not independently bind this artifact/request/source scope."
        : "Raw recheck binds the request; reported inventory is not inferred from system check labels." }, presented, feasible,
      blocker: { stage, certainty: "HYPOTHESIS", reason: stage === "NONE" ? "No supported slot/presentation obligation or no missing stage; no counterfactual causal claim"
        : stage === "NOT_EVALUATED" ? "Independent discovery/identity/availability Gold is incomplete; do not label an unknown stage as a confirmed bottleneck"
        : `Candidate bottleneck at ${stage}; recorded identity/fact acceptance is not an independent correctness score or causal confirmation` }, evidenceRefs: [...witness.refs, ...(oracle.radiusMeters === undefined && radiusMeters !== undefined ? ["materializedCase.acceptance.required_claims"] : [])] };
  });
}
