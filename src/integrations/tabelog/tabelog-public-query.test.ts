import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { PlaywrightReadNetworkGuard } from "../../infrastructure/browser/playwright-read-network-guard.js";
import { tabelogPublicReadNetworkPolicy } from "./tabelog-public-query.js";
import { auditReadOnlyTrace, parseReviewedReads } from "../../eval/restaurant/agent-loop/diagnostic-evaluator-network.js";

// Historical D4 shape: it is no longer a request permission.
const keys = ["LstAre", "LstPrf", "area_datatype", "area_id", "genre_name", "pal", "search_mode", "station_id", "sw", "utf8"];
const query = () => new URLSearchParams(keys.map(key => [key, "public"]));
async function dispatched(url: string, method = "GET", resourceType = "document") {
  const guard = new PlaywrightReadNetworkGuard({ ...tabelogPublicReadNetworkPolicy, genericPublicRead: true });
  // Prepare the origin first, as native discovery does, to challenge generic admission too.
  guard.prepareNavigation(new URL("/en/", url).toString());
  let sent = false;
  const request = { url: () => url, method: () => method, resourceType: () => resourceType, postData: () => null, headerValue: async () => null };
  await (guard as any).handle({ request: () => request, abort: async () => {}, fulfill: async () => {}, fetch: async () => {
    sent = true; return { status: () => 200, headers: () => ({}), body: async () => Buffer.from("Public") };
  } }, false);
  return sent;
}
test("the retired ten-field shape alone grants no form permission", async () => {
  const base = "https://tabelog.com/en/rstLst/";
  assert.equal(await dispatched(base + "?" + query()), false);
  for (const value of ["Contact Person", "phone@example.test", "+81 03-1234-5678", "not-observed"]) {
    const fields = query(); fields.set("sw", value);
    assert.equal(await dispatched(base + "?" + fields), false);
  }
  for (const method of ["POST", "HEAD"]) assert.equal(await dispatched(base + "?" + query(), method), false);
});
test("independent review never accepts the old shape or a production receipt as its own oracle", async () => {
  const path = "src/eval/restaurant/agent-loop/cases/reviewed-public-reads.json";
  const review = parseReviewedReads(await readFile(path), path);
  const trace = [{ kind: "SESSION_OPENED", detail: { readNetworkBoundary: "INSTALLED" } }];
  const request = { outcome: "ADMITTED", origin: "https://tabelog.com", pathname: "/en/rstLst/", method: "GET", resourceType: "document", queryKeys: keys };
  assert.equal(auditReadOnlyTrace(trace, [request], false, review).status, "PRESENT");
  const claimed = { ...request, formSubmission: { documentOrigin: request.origin, actionOrigin: request.origin,
    actionPathname: request.pathname, fields: keys.map(key => ({ key, valueSha256: "a".repeat(64), source: "PAGE" })) } };
  const audit = auditReadOnlyTrace(trace, [claimed], false, review);
  assert.equal(audit.status, "NOT_EVALUATED");
  assert.match(audit.gaps[0]!.missing.join(), /independent native form/);
  for (const patch of [{ method: "POST" }, { formSubmission: { ...claimed.formSubmission, actionOrigin: "https://other.example" } }]) {
    assert.equal(auditReadOnlyTrace(trace, [{ ...claimed, ...patch }], false, review).status, "PRESENT");
  }
});
