import { restaurantFailureCode, type RestaurantFailureCode } from "../../domains/restaurant/failure-codes.js";
import assert from "node:assert/strict";
import { test } from "node:test";

import { fixtureCandidates, fixtureIntent } from "../../harness/restaurant-fixtures.js";
import type { RestaurantAvailabilityRead, RestaurantAvailabilityRequest } from "../../domains/restaurant/contracts.js";
import type { RestaurantAvailabilityProvider } from "./contracts.js";
import { AvailabilitySourceResolver } from "./availability-source-resolver.js";
import { tableCheckDiscoveryPack, tabelogDiscoveryPack } from "../restaurant-search/source-packs.js";

const candidate = fixtureCandidates[0]!;
const request: RestaurantAvailabilityRequest = {
  selectionScope:"SPECIFIC_OUTLET",candidateIds: [candidate.restaurant.id], candidates: [candidate], date: fixtureIntent.date,
  timeWindow: fixtureIntent.timeWindow, partySize: fixtureIntent.partySize, hardCriteria: ["yakiniku"],
};

function provider(
  name: RestaurantAvailabilityProvider["provider"],
  result: { status: "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN" | "SOURCE_UNSUPPORTED"; reasonCode?: string },
  calls: string[],
): RestaurantAvailabilityProvider {
  return {
    provider: name,
    executionRoute: "GENERIC_BROWSER",
    async check(input) {
      calls.push(name);
      const checkedAt = "2026-08-05T09:00:00.000Z";
      const read: RestaurantAvailabilityRead = {
        offers: result.status === "AVAILABLE" ? [{
          id: `offer:${name}`, restaurantId: input.candidateIds[0]!, source: name, dateTime: "2026-08-05T19:00:00+09:00", timezone: "Asia/Tokyo", partySize: 2,
          bookingMode: "REQUEST", executionMode: "BROWSER", checkedAt, expiresAt: "2026-08-05T09:02:00.000Z",
        }] : [],
        availabilityChecks: { [input.candidateIds[0]!]: { status: result.status, checkedAt, evidenceIds: [], ...(result.reasonCode ? { reasonCode: result.reasonCode } : {}) } },
        evidence: [],
        metadata: { provider: name, route: "GENERIC_BROWSER", latencyMs: 1, ...(result.reasonCode ? { failureCode: restaurantFailureCode(result.reasonCode, "AVAILABILITY_FAILED") } : {}) },
      };
      return read;
    },
  };
}

function resolver(tableCheck: RestaurantAvailabilityProvider, tabelog: RestaurantAvailabilityProvider) {
  return new AvailabilitySourceResolver([{ pack: tableCheckDiscoveryPack, provider: tableCheck }, { pack: tabelogDiscoveryPack, provider: tabelog }]);
}

test("named-source resolver prefers TableCheck and does not call Tabelog after a conclusive read", async () => {
  const calls: string[] = [];
  const result = await resolver(
    provider("TABLECHECK", { status: "AVAILABLE" }, calls),
    provider("TABELOG", { status: "AVAILABLE" }, calls),
  ).check(request, new AbortController().signal);
  assert.deepEqual(calls, ["TABLECHECK"]);
  assert.equal(result.metadata.provider, "TABLECHECK");
  assert.deepEqual(result.metadata.providerAttempts, [{ candidateId: candidate.restaurant.id, provider: "TABLECHECK", outcome: "AVAILABLE" }]);
});

test("a legal Tabelog same-store entrance changes only source order and still stops after its grounded no-slot observation", async () => {
  const calls: string[] = [];
  const hinted = {
    ...candidate,
    restaurant: {
      ...candidate.restaurant,
      sourceIds: { ...candidate.restaurant.sourceIds, googleWebsiteUri: "https://tabelog.com/tokyo/A1301/example/" },
    },
  };
  const result = await resolver(
    provider("TABLECHECK", { status: "AVAILABLE" }, calls),
    provider("TABELOG", { status: "UNAVAILABLE" }, calls),
  ).check({ ...request, candidates: [hinted] }, new AbortController().signal);
  assert.deepEqual(calls, ["TABELOG"]);
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNAVAILABLE");
  assert.deepEqual(result.availabilityChecks[candidate.restaurant.id]?.sourceAttempts, [{ source: "TABELOG", outcome: "UNAVAILABLE" }]);
});

test("a source-native outlet is checked only on its own platform even when the read is unknown", async () => {
  for (const native of [
    { tablecheck: "restaurant1", tablecheckNativeGuideUri: "https://www.tablecheck.com/en/restaurant1" },
    { tabelog: "tokyo/A1301/123", tabelogNativeDetailUri: "https://tabelog.com/tokyo/A1301/123/" },
  ]) {
    const calls: string[] = [];
    const nativeCandidate = { ...candidate, restaurant: { ...candidate.restaurant, sourceIds: native } };
    const result = await resolver(
      provider("TABLECHECK", { status: "UNKNOWN", reasonCode: "REQUEST_UNCONFIRMED" }, calls),
      provider("TABELOG", { status: "AVAILABLE" }, calls),
    ).check({ ...request, candidates: [nativeCandidate] }, new AbortController().signal);
    const expected = "tablecheck" in native ? "TABLECHECK" : "TABELOG";
    assert.deepEqual(calls, [expected]);
    assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, expected === "TABLECHECK" ? "UNKNOWN" : "AVAILABLE");
  }
});

test("an unrelated or malformed URL cannot reorder the default TableCheck-first source path", async () => {
  for (const googleWebsiteUri of ["https://evil.example/tabelog.com/restaurant", "not a URL"]) {
    const calls: string[] = [];
    const hinted = { ...candidate, restaurant: { ...candidate.restaurant, sourceIds: { ...candidate.restaurant.sourceIds, googleWebsiteUri } } };
    await resolver(
      provider("TABLECHECK", { status: "UNAVAILABLE" }, calls),
      provider("TABELOG", { status: "AVAILABLE" }, calls),
    ).check({ ...request, candidates: [hinted] }, new AbortController().signal);
    assert.deepEqual(calls, ["TABLECHECK"], googleWebsiteUri);
  }
});

test("source resolver falls back from a TableCheck provider failure to Tabelog", async () => {
  const calls: string[] = [];
  const result = await resolver(
    provider("TABLECHECK", { status: "UNKNOWN", reasonCode: "EXTRACTION_FAILED" }, calls),
    provider("TABELOG", { status: "UNAVAILABLE" }, calls),
  ).check(request, new AbortController().signal);
  assert.deepEqual(calls, ["TABLECHECK", "TABELOG"]);
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNAVAILABLE");
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.sourceProvider, "TABELOG");
  assert.deepEqual(result.metadata.providerAttempts, [
    { candidateId: candidate.restaurant.id, provider: "TABLECHECK", outcome: "PROVIDER_FAILURE", failureCode: "EXTRACTION_FAILED" },
    { candidateId: candidate.restaurant.id, provider: "TABELOG", outcome: "UNAVAILABLE" },
  ]);
});

test("successful source attribution changes no conclusion or attempt across fallback and direct reads", async t => {
  t.mock.timers.enable({apis:["Date"],now:Date.parse("2026-08-05T09:00:00.000Z")});
  try {
    const hinted={...candidate,restaurant:{...candidate.restaurant,sourceIds:{...candidate.restaurant.sourceIds,googleWebsiteUri:"https://tabelog.com/tokyo/A1301/example/"}}};
    const cases=[
      {id:"tablecheck-fails-tabelog-succeeds",preferred:false,tc:{status:"UNKNOWN" as const,reasonCode:"EXTRACTION_FAILED"},tl:{status:"AVAILABLE" as const},source:"TABELOG",calls:["TABLECHECK","TABELOG"]},
      {id:"tabelog-fails-tablecheck-succeeds",preferred:true,tc:{status:"AVAILABLE" as const},tl:{status:"UNKNOWN" as const,reasonCode:"BOT_CHALLENGE"},source:"TABLECHECK",calls:["TABELOG","TABLECHECK"]},
      {id:"tablecheck-direct",preferred:false,tc:{status:"AVAILABLE" as const},tl:{status:"AVAILABLE" as const},source:"TABLECHECK",calls:["TABLECHECK"]},
      {id:"tabelog-direct",preferred:true,tc:{status:"AVAILABLE" as const},tl:{status:"AVAILABLE" as const},source:"TABELOG",calls:["TABELOG"]},
      {id:"both-fail",preferred:false,tc:{status:"UNKNOWN" as const,reasonCode:"EXTRACTION_FAILED"},tl:{status:"UNKNOWN" as const,reasonCode:"BOT_CHALLENGE"},source:undefined,calls:["TABLECHECK","TABELOG"]},
    ];
    for(const row of cases)await t.test(row.id,async()=>{
      const calls:string[]=[];
      const result=await resolver(provider("TABLECHECK",row.tc,calls),provider("TABELOG",row.tl,calls))
        .check({...request,candidates:[row.preferred?hinted:candidate]},new AbortController().signal);
      const check=result.availabilityChecks[candidate.restaurant.id]!;
      if(process.env.PRAXIS_SOURCE_PROVIDER_TRACE==="1")console.log("SOURCE_PROVIDER_TRACE "+Buffer.from(JSON.stringify({id:row.id,result})).toString("base64"));
      assert.deepEqual(calls,row.calls);
      assert.equal(check.sourceProvider,row.source);
      assert.equal(check.status,row.source?"AVAILABLE":"UNKNOWN");
      const failed=row.source?row.calls.slice(0,-1):row.calls;
      assert.deepEqual(check.sourceAttempts,[...failed.map(source=>({source,outcome:"FAILED",reasonCode:source==="TABLECHECK"?"EXTRACTION_FAILED":"BOT_CHALLENGE"})),
        ...(row.source?[{source:row.source,outcome:"AVAILABLE"}]:[])]);
      assert.equal(result.offers.length,row.source?1:0);
      if(row.source)assert.equal(result.offers[0]!.source,row.source);
      else assert.equal(result.metadata.failureCode,"AVAILABILITY_SOURCES_EXHAUSTED");
    });
  } finally {t.mock.timers.reset();}
});

test("Tabelog bot challenge remains provider-scoped and all providers exhausted fail closed", async () => {
  const calls: string[] = [];
  const result = await resolver(
    provider("TABLECHECK", { status: "UNKNOWN", reasonCode: "TABLECHECK_DISCOVERY_NO_RESULT" }, calls),
    provider("TABELOG", { status: "UNKNOWN", reasonCode: "BOT_CHALLENGE" }, calls),
  ).check(request, new AbortController().signal);
  assert.deepEqual(calls, ["TABLECHECK", "TABELOG"]);
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN");
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "BOT_CHALLENGE");
  assert.deepEqual(result.availabilityChecks[candidate.restaurant.id]?.sourceAttempts, [
    { source: "TABLECHECK", outcome: "FAILED", reasonCode: "TABLECHECK_DISCOVERY_NO_RESULT" },
    { source: "TABELOG", outcome: "FAILED", reasonCode: "BOT_CHALLENGE" },
  ]);
  assert.equal(result.metadata.failureCode, "AVAILABILITY_SOURCES_EXHAUSTED");
  assert.equal(result.metadata.providerAttempts?.[1]?.failureCode, "BOT_CHALLENGE");
});

test("group-window: disabled requested party moves to next candidate rather than another query",async()=>{
 const calls:string[]=[];
 const result=await resolver(provider("TABLECHECK",{status:"UNKNOWN",reasonCode:"PARTY_SIZE_NOT_SELECTABLE"},calls),provider("TABELOG",{status:"AVAILABLE"},calls)).check(request,new AbortController().signal);
 assert.deepEqual(calls,["TABLECHECK"]);assert.equal(result.availabilityChecks[candidate.restaurant.id]!.status,"UNKNOWN");assert.equal(result.offers.length,0);assert.equal(result.metadata.failureCode,undefined);
});
test("group-window: one unsupported source does not erase another source's UNKNOWN",async()=>{
 const calls:string[]=[];
 const result=await resolver(provider("TABLECHECK",{status:"UNKNOWN",reasonCode:"REQUEST_UNCONFIRMED"},calls),provider("TABELOG",{status:"SOURCE_UNSUPPORTED",reasonCode:"SOURCE_UNSUPPORTED"},calls)).check(request,new AbortController().signal);
 assert.deepEqual(calls,["TABLECHECK","TABELOG"]);assert.equal(result.availabilityChecks[candidate.restaurant.id]!.status,"UNKNOWN");assert.equal(result.offers.length,0);
});

for(const mode of ['NONE','GOOGLE_LINK','SOURCE_LINK','OLD','OTHER_CANDIDATE','LOW','SEARCH_URL','WRONG_HOST','NAMED'] as const)test(`area TableCheck evidence gate: ${mode}`,async()=>{
 const calls:string[]=[],copy=structuredClone(candidate),at='2030-01-01T00:00:01Z',url='https://www.tablecheck.com/en/observed-venue';
 copy.restaurant.sourceIds={googlePlaces:'actual-place'};copy.restaurant.provenance.sourceIds='current-google-discovery';
 if(mode==='GOOGLE_LINK')copy.restaurant.sourceIds.googleWebsiteUri=url;
 const sourceEvidence:NonNullable<RestaurantAvailabilityRequest['sourceEvidence']>=[{evidenceId:'current-google-discovery',kind:mode==='GOOGLE_LINK'?'DISCOVERY':'ENTITY_MATCH',provider:mode==='GOOGLE_LINK'?'GOOGLE_PLACES':'RESTAURANT_WEBSITE',candidateId:mode==='OTHER_CANDIDATE'?'other':copy.restaurant.id,sourceEntityId:'actual-place',sourceUrl:'https://merchant.example/',observedAt:mode==='OLD'?'2029-12-31T00:00:00Z':at,requestFingerprint:'fixture',entityMatch:{confidence:mode==='LOW'?'LOW':'HIGH',matchedBy:['fixture']},claims:{observedSourceLinks:mode==='NONE'?[]:[mode==='WRONG_HOST'?'https://www.tablecheck.com.evil.example/en/observed-venue':mode==='SEARCH_URL'?'https://www.tablecheck.com/en/japan/search':url]}}];
 const tc=provider('TABLECHECK',{status:'AVAILABLE'},calls),tl=provider('TABELOG',{status:'AVAILABLE'},calls);
 const read=await new AvailabilitySourceResolver([{pack:tableCheckDiscoveryPack,provider:tc},{pack:tabelogDiscoveryPack,provider:tl}],{observedAfter:'2030-01-01T00:00:00Z'}).check({...request,candidates:[copy],selectionScope:mode==='NAMED'?'SPECIFIC_OUTLET':'OPEN_ENDED',sourceEvidence},new AbortController().signal);
 const enters=['GOOGLE_LINK','SOURCE_LINK','NAMED'].includes(mode);assert.deepEqual(calls,[enters?'TABLECHECK':'TABELOG']);
 assert.equal(read.metadata.providerAttempts?.some(a=>a.outcome==='NOT_EVIDENCED'),!enters);
 assert.ok(!read.metadata.providerAttempts?.some(a=>a.provider==='TABLECHECK'&&a.outcome==='PROVIDER_FAILURE'));
});
