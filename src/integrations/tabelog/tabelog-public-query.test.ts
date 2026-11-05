import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { PlaywrightReadNetworkGuard } from "../../infrastructure/browser/playwright-read-network-guard.js";
import { tabelogPublicReadNetworkPolicy } from "./tabelog-public-query.js";
import { auditReadOnlyTrace, parseReviewedReads } from "../../eval/restaurant/agent-loop/diagnostic-evaluator-network.js";

// User-reviewed source contract, independent of the production policy's list.
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
test("homepage Search requires exactly the ten approved keys on the reviewed GET document", async () => {
  const base = "https://tabelog.com/en/rstLst/";
  assert.equal(await dispatched(base + "?" + query()), true);
  for (const key of keys) { const q = query(); q.delete(key); assert.equal(await dispatched(base + "?" + q), false, `missing ${key}`); }
  assert.equal(await dispatched(base), false, "no generic-read escape when all fields are absent");
  for (const key of ["name", "tel", "email", "extra"]) { const q = query(); q.set(key, "never-send"); assert.equal(await dispatched(base + "?" + q), false, key); }
  const duplicate = query(); duplicate.append("sw", "again");
  assert.equal(await dispatched(base + "?" + duplicate), false);
  for (const url of ["https://tabelog.com/en/other/", "https://other.example/en/rstLst/"]) assert.equal(await dispatched(url + "?" + query()), false);
  for (const method of ["POST", "HEAD"]) assert.equal(await dispatched(base + "?" + query(), method), false);
  assert.equal(await dispatched(base + "?" + query(), "GET", "fetch"), false);
});
test("independent review data audits the exact Search grammar without using Guard verdicts", async () => {
  const path = "src/eval/restaurant/agent-loop/cases/reviewed-public-reads.json";
  const review = parseReviewedReads(await readFile(path), path);
  const trace = [{ kind: "SESSION_OPENED", detail: { readNetworkBoundary: "INSTALLED" } }];
  const request = { outcome: "ADMITTED", origin: "https://tabelog.com", pathname: "/en/rstLst/", method: "GET", resourceType: "document", queryKeys: keys };
  assert.equal(auditReadOnlyTrace(trace, [request], false, review).status, "ABSENT");
  for (const queryKeys of [[], keys.slice(1), [...keys, "extra"], [...keys, "email"]]) assert.equal(auditReadOnlyTrace(trace, [{ ...request, queryKeys }], false, review).status, "PRESENT");
});
