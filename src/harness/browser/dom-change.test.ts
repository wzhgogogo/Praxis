import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runDomChange } from "../../eval/restaurant/dom-change/run.js";
import { classifyDomChange, type DomChangeVerdict } from "../../eval/restaurant/dom-change/classification.js";

test("G2 saved pages preserve the frozen reference capability and reject new false claims", { timeout: 180_000 }, async t => {
  const baseline = JSON.parse(await readFile(new URL("./fixtures/dom-change/baseline.json", import.meta.url), "utf8")) as {
    mutationRule: string; manifestSha256: string; cases: Array<{ id: string; verdict: DomChangeVerdict; referenceFacts: Record<string, unknown> }>;
  };
  const actual = await runDomChange();
  assert.equal(actual.rule, baseline.mutationRule);
  assert.equal(actual.manifestSha256, baseline.manifestSha256);
  assert.equal(actual.sourceTransportCalls, 0);
  assert.equal(actual.cases.length, baseline.cases.length);
  for (const reference of baseline.cases) {
    const row = actual.cases.find(current => current.id === reference.id)!;
    assert.ok(row);
    assert.equal(row.mutation.integrity.valid, true, JSON.stringify(row.mutation.integrity));
    const retained = classifyDomChange(reference.referenceFacts, row.before.facts, true);
    assert.deepEqual(retained.lost, [], reference.id + " cannot erase previously known source facts on both sides");
    assert.deepEqual(retained.contradictions, [], reference.id + " original source interpretation changed and needs review");
    assert.notEqual(row.classification.verdict, "FAIL", JSON.stringify(row.classification));
    assert.ok(row.classification.verdict === "PASS" || process.env.PRAXIS_G2_REQUIRE_PASS !== "1" && row.classification.verdict === reference.verdict,
      reference.id + ": G3 requires PASS; current baseline only admits the same honest loss");
    t.diagnostic(JSON.stringify({ id: row.id, classification: row.classification.verdict, referenceFacts: Object.keys(row.before.facts).length, lost: row.classification.lost, sourceTransportCalls: 0 }));
  }
});
