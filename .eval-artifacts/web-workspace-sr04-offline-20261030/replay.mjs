import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync, writeFileSync, mkdirSync} from "node:fs";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";
import {DeepSeekModelGateway} from "../../src/infrastructure/deepseek/deepseek-model-gateway.ts";
import {RestaurantSemanticInterpreter} from "../../src/domains/restaurant/semantic-interpreter.ts";

const mode = process.argv[2];
assert.ok(["guarded", "unguarded"].includes(mode));
const folder = resolve(".eval-artifacts/web-workspace-sr04-offline-20261030");
const output = resolve(folder, "execution");
const original = resolve(".eval-artifacts/web-workspace-slice1-followup-20261030");
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const load = path => JSON.parse(readFileSync(path, "utf8"));
const manifest = load(resolve(folder, "freeze.json"));
for (const file of manifest.files) assert.equal(hash(readFileSync(file.path)), file.sha256, file.path);
const source = load("src/eval/restaurant/semantic/cases/restaurant-semantic-regression.gold5.json");
assert.equal(source.sessions.length, 10);
mkdirSync(output, {recursive:true});
const rows = [], records = [];
let active, fakeFetchCalls = 0;
// No native fetch is retained or called. Both production and the original guard
// receive this same in-memory transport; credentials are a fixed dummy literal.
globalThis.fetch = async (input, init) => {
  assert.ok(active, "Unexpected fetch outside the replay turn");
  assert.equal(++active.calls, 1, "Offline replay forbids retries");
  fakeFetchCalls++;
  const url = String(input);
  assert.equal(url, active.wire.url);
  assert.equal(init.method, "POST");
  assert.deepEqual(JSON.parse(init.body), active.wire.body, "Exact saved request body");
  active.wireMatched = true;
  return new Response(active.raw, {status:200, headers:{"content-type":"application/json"}});
};
if (mode === "guarded") {
  process.env.PRAXIS_SEMANTIC_RUN_DIR = resolve(output, "guard-recording");
  // Import the immutable recording guard, including its awaited clone().text().
  await import(pathToFileURL(resolve(original, "semantic-transport-guard.mjs")).href);
}
const gateway = new DeepSeekModelGateway({
  apiKey:"offline-fixture", model:"deepseek-v4-flash", fetchImplementation:globalThis.fetch,
  observer:{observe:record => records.push(record)},
});
const interpreter = new RestaurantSemanticInterpreter(gateway);
for (const [index, session] of source.sessions.entries()) {
  const call = "call-" + String(index + 1).padStart(2, "0");
  const turn = session.turns[0];
  const wire = load(resolve(original, "execution", call + ".request.json"));
  assert.equal(wire.body.messages[1].content, "User restaurant message as JSON string: " + JSON.stringify(turn.message));
  active = {wire, raw:readFileSync(resolve(original, "execution", call + ".response.json")), calls:0, wireMatched:false};
  const interpreted = await interpreter.interpret({
    taskId:"offline:" + turn.id, message:turn.message,
    referenceTime:source.referenceTime, timezone:"Asia/Tokyo",
  });
  rows.push({call, sessionId:session.id, turnId:turn.id, responseSHA256:hash(active.raw),
    fakeFetchCalls:active.calls, exactSavedWire:active.wireMatched, interpreted});
  if (mode === "guarded") assert.equal(hash(readFileSync(resolve(output, "guard-recording", call + ".response.json"))), hash(active.raw));
  active = undefined;
}
const result = {schema:"sr04-offline-replay@1", mode, realAPIRequests:0, fakeFetchCalls,
  sourceManifestSHA256:hash(readFileSync(resolve(folder, "freeze.json"))), rows, records,
  passed:rows.every(row => row.exactSavedWire && row.fakeFetchCalls === 1 && row.interpreted.status === "PROPOSED")};
writeFileSync(resolve(output, mode + ".json"), JSON.stringify(result, null, 2) + "\n", {flag:"wx"});
assert.equal(fakeFetchCalls, 10);
assert.ok(result.passed, "Saved response failed the production gateway/interpreter parsing path");
console.log(JSON.stringify({mode, parsed:rows.length, SR04:rows[3].interpreted.status, realAPIRequests:0}));
