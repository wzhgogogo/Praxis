import assert from "node:assert/strict";
import { test } from "node:test";
import { fixtureCandidates } from "../../harness/restaurant-fixtures.js";
import { checkedNamedSourceQuery, locateNamedSourceFragment, ModelNamedSourceQuery, NAMED_SOURCE_QUERY_PROMPT, NAMED_SOURCE_QUERY_SCHEMA } from "./named-source-query.js";

function candidate(name: string) {
  const value = structuredClone(fixtureCandidates[0]!);
  value.restaurant.outletName = name;
  value.restaurant.sourceIds.googlePlaces = "original-place-id";
  return value;
}

test("code locates the four valid batch2 fragments, independent of model offsets", () => {
  for (const [name, fragment] of [
    ["Wagyu beef Yakiniku Beef Kitchen Nakameguro", "Beef Kitchen"], ["Yakiniku Ushicoco Nakameguro", "Ushicoco"],
    ["Sushi and Tempura Iwai Kichijoji", "Iwai"], ["Kushiyaki Bistro Fukumimi Ginza 6", "Fukumimi"],
  ]) {
    const original = candidate(name!);
    const located = locateNamedSourceFragment(original, { field: "name", fragment });
    assert.ok(located);
    assert.equal(original.restaurant.outletName.slice(located.start, located.end), fragment);
  }
  const unicode = candidate("🍣鮨 Sushi Dai Tokyo");
  assert.deepEqual(locateNamedSourceFragment(unicode, { field: "name", fragment: "Sushi Dai" }), { field: "name", query: "Sushi Dai", start: 4, end: 13 });
});

test("invented, translated, wrong-field, repeated and old-offset proposals fail closed", () => {
  const original = candidate("Dengana Akabane");
  for (const proposal of [null, {}, { field: "name", fragment: "でんがな" }, { field: "name", fragment: "Dengana", start: 0, end: 7 },
    { field: "address", fragment: "Dengana" }, { field: "name", fragment: "Dengana Akabane" }, { field: "name", fragment: " Akabane" }]) {
    assert.equal(locateNamedSourceFragment(original, proposal), undefined);
  }
  assert.equal(checkedNamedSourceQuery(original, "invented"), undefined);
});

test("one cached proposal is shared across both sources, spends the existing run budget and excludes IDs", async () => {
  const budget = { totalModelCalls: 0, maxModelCalls: 1 };
  let calls = 0;
  const planner = new ModelNamedSourceQuery({ async complete(request) {
    calls++;
    assert.equal(request.promptVersion, NAMED_SOURCE_QUERY_PROMPT);
    assert.equal(request.outputSchema.name, NAMED_SOURCE_QUERY_SCHEMA.name);
    assert.equal(request.outputSchema.version, NAMED_SOURCE_QUERY_SCHEMA.version);
    assert.deepEqual(JSON.parse(request.messages[1]!.content), { name: "Dengana Akabane", address: fixtureCandidates[0]!.restaurant.address });
    assert.doesNotMatch(request.messages.map(m => m.content).join(""), /original-place-id|rst_id|13108466/);
    return { invocationId: "fixture", provider: "FIXTURE", model: "fixture", outputText: '{"field":"name","fragment":"Dengana"}', finishReason: "STOP", latencyMs: 0 };
  } }, budget);
  const subject = candidate("Dengana Akabane"), signal = new AbortController().signal;
  assert.deepEqual(await Promise.all([planner.alternative(subject, signal), planner.alternative(subject, signal)]), ["Dengana", "Dengana"]);
  assert.equal(calls, 1); assert.equal(budget.totalModelCalls, 1);
  await assert.rejects(planner.alternative(candidate("Other Tokyo"), signal), { code: "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED" });
  assert.equal(calls, 1);
  planner.clear();
  await assert.rejects(planner.alternative(subject, signal), { code: "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED" });
});
