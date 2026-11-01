import assert from "node:assert/strict";
import test from "node:test";
import { ASSEMBLY_CAPABILITY_CORES, assemblyCoreValueImport, evaluatorImportViolation, parseAssemblyBypassAllowlist } from "./evaluator-import-rule.js";

const file = "src/eval/restaurant/fact-qa/core-adapter.ts";
const core = "src/integrations/restaurant-facts/model-page-question.ts";
const entry = { file, core, category: "组件评测", proves: "Fixed saved-page answer core.", cannotSignOff: "Production page acquisition and full Web follow-up." };
const config = () => ({ revision: 1, entries: [{ ...entry }] });

test("assembly gate freezes the reviewed core boundary without banning transports or pure parsers", () => {
  // Literal oracle transcribed from the reviewer-confirmed list, independent of rule generation.
  assert.deepEqual([...ASSEMBLY_CAPABILITY_CORES].sort(), [
    "integrations/restaurant-facts/model-page-question.ts", "integrations/restaurant-facts/page-question-reader.ts",
    "integrations/restaurant-facts/page-question-read-budget.ts", "integrations/restaurant-facts/fact-page-binding.ts",
    "integrations/restaurant-facts/live-restaurant-facts.ts", "integrations/restaurant-facts/google-then-website-facts.ts",
    "integrations/restaurant-facts/google-listed-website-facts.ts", "integrations/restaurant-facts/native-source-facts.ts",
    "integrations/restaurant-facts/model-fact-judgment.ts", "integrations/restaurant-facts/model-source-facts.ts",
    "integrations/google/google-places-restaurant-search.ts", "integrations/restaurant-search/native-restaurant-search.ts",
    "integrations/restaurant-search/native-read-composition.ts", "integrations/restaurant-search/discovery-retrieval-planner.ts",
    "integrations/restaurant-search/named-source-query.ts", "integrations/restaurant-availability/live-browser-availability.ts",
    "integrations/restaurant-availability/availability-source-resolver.ts", "integrations/restaurant-availability/native-outlet-continuity.ts",
    "integrations/tabelog/tabelog-browser-availability.ts", "integrations/tablecheck/tablecheck-browser-availability.ts",
    "integrations/restaurant-availability/outlet-identity.ts", "integrations/restaurant-identity/detail-identity-fields.ts",
    "integrations/tabelog/tabelog-entity-resolver.ts", "integrations/tablecheck/tablecheck-entity-resolver.ts",
    "integrations/tabelog/tabelog-booking-handoff-reader.ts",
  ].sort());
  for (const target of ["integrations/google/google-places-client.ts", "integrations/tabelog/tabelog-page-parser.ts",
    "integrations/tablecheck/tablecheck-availability-response.ts", "integrations/restaurant-search/live-read-assembly.ts",
    "domains/restaurant/semantic-interpreter.ts", "infrastructure/browser/browser-task-executor.ts"]) {
    assert.equal(evaluatorImportViolation("eval/new-runner.ts", target, 'import { value } from "x"'), undefined, target);
  }
});

test("TS and MJS value imports require the exact component pair while type-only imports stay legal", () => {
  const types = ['import type { Evidence } from "x"', 'import type Default from "x"',
    'export type { Evidence } from "x"', 'import { type Evidence, type Other as Renamed } from "x"', 'export { type Evidence } from "x"'];
  const values = ['import { Core } from "x"', 'import Unused from "x"', 'import * as Core from "x"',
    'import { type Evidence, Core } from "x"', 'import type from "x"', 'import { type as Value } from "x"',
    'import {} from "x"', 'import "x"', 'export * from "x"', 'import("x")', 'require("x")'];
  const target = core.slice(4), allowances = parseAssemblyBypassAllowlist(config());
  for (const statement of types) assert.equal(assemblyCoreValueImport(file.slice(4), target, statement), false, statement);
  for (const importer of ["eval/restaurant/fact-qa/core-adapter.ts", "eval/new-runner.mjs"]) {
    for (const statement of values) assert.match(evaluatorImportViolation(importer, target, statement)!, /eval assembly gate/, statement);
  }
  assert.equal(evaluatorImportViolation(file.slice(4), target, values[0]!, allowances), undefined);
  assert.match(evaluatorImportViolation("eval/new-runner.ts", target, values[0]!, allowances)!, /eval assembly gate/);
  assert.match(evaluatorImportViolation(file.slice(4), "integrations/restaurant-facts/page-question-reader.ts", values[0]!, allowances)!, /eval assembly gate/);
  assert.equal(evaluatorImportViolation("server/host.ts", target, values[0]!, allowances), undefined);
});

test("assembly component configuration rejects unknown keys, broad exceptions and incomplete proof boundaries", () => {
  assert.deepEqual(parseAssemblyBypassAllowlist(config()), [entry]);
  const invalid: Array<[unknown, RegExp]> = [
    [null, /expected object/], [{ ...config(), unknown: true }, /unknown keys/],
    [{ revision: 1 }, /missing required/], [{ revision: 2, entries: [] }, /revision 1/],
    [{ revision: 1, entries: null }, /entries array/], [{ revision: 1, entries: [null] }, /expected object/],
    [{ revision: 1, entries: [{ ...entry, unknown: true }] }, /unknown keys/],
    [{ revision: 1, entries: [{ ...entry, category: "其他：已走组装" }] }, /category/],
    [{ revision: 1, entries: [{ ...entry, file: "src/eval/**" }] }, /canonical/],
    [{ revision: 1, entries: [{ ...entry, file: "src/eval/../server/a.ts" }] }, /canonical/],
    [{ revision: 1, entries: [{ ...entry, core: "src/integrations/tabelog/tabelog-page-parser.ts" }] }, /reviewer-confirmed/],
    [{ revision: 1, entries: [{ ...entry, proves: " " }] }, /nonempty/],
    [{ revision: 1, entries: [{ ...entry, cannotSignOff: null }] }, /nonempty/],
    [{ revision: 1, entries: [entry, entry] }, /duplicate file\/core/],
  ];
  for (const [value, reason] of invalid) assert.throws(() => parseAssemblyBypassAllowlist(value), reason);
});
