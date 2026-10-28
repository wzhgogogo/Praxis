import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { inspectTabelogEntity, normalizeTabelogPhone } from "../../../src/integrations/tabelog/tabelog-entity-resolver.ts";
import { parseTabelogSearchOutlets, parseTabelogOutletIdentityWithEvidence } from "../../../src/integrations/tabelog/tabelog-page-parser.ts";

const base = ".eval-artifacts/name-resolution-benchmark-20261019", live = `${base}/live-20261020`, out = process.argv[2] ?? ".eval-artifacts/phase3b/c-batch3/identity";
const inputs = new Map();
function read(path) {
  const bytes = readFileSync(path); inputs.set(path, { path, sha256: createHash("sha256").update(bytes).digest("hex") });
  return JSON.parse(path.endsWith(".gz") ? gunzipSync(bytes).toString("utf8") : bytes.toString("utf8"));
}
const id = url => { try { return new URL(url).pathname.match(/\/A\d+\/A\d+\/(\d+)(?:\/|$)/)?.[1]; } catch { return undefined; } };
const sourceKey = url => { try { const u = new URL(url); return u.hostname + u.pathname.replace(/^\/en\//, "/").replace(/\/$/, ""); } catch { return url; } };
const samples = read(`${base}/samples.json`).samples;
const certificates = read(`${live}/verify/certified-summary.json`).rows;
const rows = [], structureAlerts = [];
for (const cert of certificates.filter(c => c.status === "VERIFIED")) {
  const sample = samples.find(s => s.id === cert.sampleId); assert(sample?.role === "GOLD" && sample.platform === "TABELOG");
  const artifact = read(`${live}/method-a/${sample.id}/artifact.json.gz`);
  const historical = read(`${live}/method-a/${sample.id}/result.json`);
  const verified = read(`${live}/verify/${sample.id}/observations.json.gz`);
  // Only the original whitelist subject crosses into production comparison. No Gold URL/id/labels.
  const candidate = { restaurant: { id: `offline:${sample.id}`, outletName: sample.subject.name, address: sample.subject.address, sourceIds: { phone: sample.subject.phone } } };
  const attempts = [];
  for (const diagnostic of artifact.diagnostics) {
    const recorded = diagnostic.comparedOutlets.map(o => ({ sourceEntityId: o.sourceEntityId, sourceUrl: o.sourceUrl,
      outletName: o.outletName.value ?? "", ...(o.address.value ? { address: o.address.value } : {}), ...(o.phone.value ? { phone: o.phone.value } : {}) }));
    const reparsed = [], extractions = [], missingSnapshots = [];
    for (const outlet of recorded) {
      const page = artifact.pages.findLast(p => sourceKey(p.url) === sourceKey(outlet.sourceUrl));
      if (!page) { missingSnapshots.push(outlet.sourceUrl); continue; }
      let extraction;
      try { extraction = parseTabelogOutletIdentityWithEvidence(page, outlet); } catch (error) { structureAlerts.push({sampleId:sample.id,url:page.url,code:error?.code??"UNKNOWN"}); continue; }
      reparsed.push(extraction.outlet); extractions.push(extraction);
    }
    attempts.push({ recordedFields: inspectTabelogEntity(candidate, recorded), reparsedPages: inspectTabelogEntity(candidate, reparsed), extractions, missingSnapshots });
  }
  const searches = artifact.pages.filter(p => /\/rstLst\//.test(p.url)).map(p => {
    const u = new URL(p.url), outlets = parseTabelogSearchOutlets(p);
    return { url: p.url, query: u.searchParams.get("sw"), title: p.title, parsedCount: outlets.length,
      explicitEmpty: /No restaurants were found that match your search criteria|該当する店舗はありません/.test(`${p.text} ${p.html}`),
      observedIds: outlets.map(o => id(o.sourceUrl)).filter(Boolean) };
  });
  const match = attempts.find(a => a.reparsedPages.resolution.confidence === "HIGH");
  const returnedId = match ? id(match.reparsedPages.resolution.outlet.sourceUrl) : undefined;
  const verdict = returnedId ? returnedId === sample.expected.outletId ? "CORRECT" : "WRONG_ACCEPTED" : "NOT_ACCEPTED";
  const correctDetailReached = artifact.pages.some(p => id(p.url) === sample.expected.outletId);
  const verification = certificates.find(c => c.sampleId === sample.id);
  const publicMatchingPhones = (verification.observed?.phones ?? []).filter(p => normalizeTabelogPhone(p) === normalizeTabelogPhone(sample.subject.phone));
  const maxParsed = Math.max(0, ...searches.map(s => s.parsedCount));
  const latestDiagnostic = attempts.at(-1)?.reparsedPages.diagnostic;
  const reason = latestDiagnostic?.resolution.reason ?? historical.observation.failure ?? "UNKNOWN";
  let failureStage = "UNRESOLVED";
  if (verdict === "CORRECT") failureStage = "NONE";
  else if (/TIMEOUT/.test(historical.observation.failure ?? "")) failureStage = "TIMEOUT";
  else if (correctDetailReached && (publicMatchingPhones.length || verification.addressMatch || verification.manualAddressVerification)) failureStage = "IDENTITY_FIELDS_MISSING";
  else if (searches.some(s => s.explicitEmpty)) failureStage = "EMPTY_SEARCH_RESULTS";
  else if (maxParsed > 5 && searches.some(s => s.observedIds.indexOf(sample.expected.outletId) >= 5)) failureStage = "CANDIDATE_TRUNCATION";
  else if (correctDetailReached && /CONFLICT/.test(reason)) failureStage = "IDENTITY_FIELD_CONFLICT";
  else if (correctDetailReached) failureStage = "IDENTITY_FIELDS_MISSING";
  // A full-name query and empty response support a query hypothesis, not a proven alternate-query benefit.
  rows.push({ sampleId: sample.id, name: sample.subject.name, google: sample.subject, expectedOutletId: sample.expected.outletId,
    historicalVerdict: historical.evaluation.verdict, historicalFailure: historical.observation.failure ?? null,
    snapshotRecomputeVerdict: verdict, returnedId: returnedId ?? null, failureStage, correctDetailReached,
    fullNameQueryUsed: searches.some(s => s.query === sample.subject.name), maxParsedResults: maxParsed,
    publicMatchingPhones, verifiedAddresses: verification.observed?.addresses ?? [], verificationReason: verification.reason,
    verificationPageCount: verified.snapshots?.length ?? 0, searches, attempts,
    limits: "Current parser/resolver only on originally observed candidates/details. Current model search/actions and unobserved alternate queries NOT_EVALUATED; certification-only pages never enter this verdict." });
}
assert.equal(rows.length, 29);
assert.notEqual(rows.find(r=>r.sampleId==="nr-029").snapshotRecomputeVerdict,"CORRECT","One-digit phone conflict must remain unaccepted");
assert(!rows.some(r => r.snapshotRecomputeVerdict === "WRONG_ACCEPTED"), "S0: another outlet accepted; stop before further work");
const count = key => Object.fromEntries([...new Set(rows.map(r => r[key]))].map(v => [v, rows.filter(r => r[key] === v).length]));
const result = { sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], {encoding: "utf8"}).trim(), schema: "phase3b-name-resolution-recompute@3", structureAlerts, mode: "OFFLINE_SAVED_PAGE_PARSER_RESOLVER", newRealCalls: 0,
  historicalVerdicts: count("historicalVerdict"), snapshotVerdicts: count("snapshotRecomputeVerdict"), primaryFailureStages: count("failureStage"),
  requestedCategories: { queryText: { status: "HYPOTHESIS_ONLY", exposedFullNameQueries: rows.filter(r => r.fullNameQueryUsed).length },
    emptySearchResults: rows.filter(r => r.failureStage === "EMPTY_SEARCH_RESULTS").length,
    candidateTruncation: rows.filter(r => r.failureStage === "CANDIDATE_TRUNCATION").length,
    missingIdentityFields: rows.filter(r => r.failureStage === "IDENTITY_FIELDS_MISSING").length,
    identityFieldConflict: rows.filter(r => r.failureStage === "IDENTITY_FIELD_CONFLICT").length,
    timeout: rows.filter(r => r.failureStage === "TIMEOUT").length }, rows, inputs: [...inputs.values()] };
writeFileSync(`${out}/recomputed.json`, JSON.stringify(result, null, 2) + "\n", {flag: "wx"});
console.log(JSON.stringify({ historical: result.historicalVerdicts, currentSnapshot: result.snapshotVerdicts, failures: result.primaryFailureStages, requested: result.requestedCategories }));
