import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { parseAllDocuments } from "yaml";
import { restaurantSemanticRegressionV3 as development } from "../../../src/eval/restaurant/semantic/fixtures.ts";

const base = ".eval-artifacts/phase3a-boundary";
const hash = value => createHash("sha256").update(value).digest("hex");
const read = path => {
  assert(!path.includes(".eval-private/") && !path.split("/").some(part => part.startsWith(".env")), "forbidden input path");
  return readFileSync(path);
};
const json = path => JSON.parse(read(path));
const selectionPath = `${base}/batch2/batch3-input-selection.json`;
const selection = json(selectionPath);
const inventory = json(`${base}/case-inventory.json`);
const frozenPaths = new Map(inventory.sources.map(item => [item.path, item.sha256]));
const oldFreeze = json(`${base}/batch2/input-sha256-r2.json`);
for (const item of oldFreeze.files) assert.equal(hash(read(item.path)), item.sha256, item.path);
assert.equal(hash(read(selection.development.path)), selection.development.sha256);
assert.equal(development.sessions.flatMap(session => session.turns).length, 15);

const annotations = json("src/eval/restaurant/semantic/cases/goal-boundary-annotations.json");
const byTurn = new Map(annotations.turns.map(item => [item.turnId, item]));
const sourceCache = new Map();
function original(row) {
  assert.equal(hash(row.message), row.messageSha256);
  assert(!row.message.includes("{DATE}"));
  assert.equal(hash(read(row.source)), frozenPaths.get(row.source), row.source);
  if (row.source === selection.development.path) {
    const session = development.sessions.find(session => session.turns.some(turn => turn.id === row.caseId));
    const turn = session.turns.find(turn => turn.id === row.caseId);
    assert.equal(turn.message, row.message);
    return { message: turn.message, referenceTime: development.referenceTime, originalExpectedDraft: turn.expectedDraft,
      source: { path: row.source, sha256: frozenPaths.get(row.source), pointer: row.pointer } };
  }
  if (!sourceCache.has(row.source)) {
    const documents = parseAllDocuments(read(row.source).toString("utf8"), { uniqueKeys: true });
    assert(documents.every(document => !document.errors.length), row.source);
    sourceCache.set(row.source, documents.map(document => document.toJSON()));
  }
  const index = Number(row.pointer.match(/^document\/(\d+)$/)?.[1]);
  assert(Number.isSafeInteger(index));
  const document = sourceCache.get(row.source)[index];
  assert.equal(document.id, row.caseId);
  assert.equal(document.content, row.message);
  assert.equal(typeof document.reference_time, "string");
  return { message: document.content, referenceTime: document.reference_time, originalSemantic: document.semantic,
    source: { path: row.source, sha256: frozenPaths.get(row.source), pointer: row.pointer } };
}

const sessions = development.sessions.map(session => ({
  cohort: "DEVELOPMENT", id: session.id, repetition: 1,
  referenceTime: development.referenceTime,
  turns: session.turns.map(turn => ({ id: turn.id, message: turn.message,
    originalExpectedDraft: turn.expectedDraft, annotation: byTurn.get(turn.id),
    source: { path: selection.development.path, sha256: selection.development.sha256 } })),
}));
const grayById = new Map(selection.gray.cases.map(row => [row.caseId, row]));
for (let repetition = 1; repetition <= 3; repetition++) {
  for (const row of selection.gray.cases) {
    if (["SR08-T02", "SR09-T02"].includes(row.caseId)) continue;
    const rows = [row];
    if (["SR08-T01", "SR09-T01"].includes(row.caseId)) rows.push(grayById.get(row.caseId.replace("T01", "T02")));
    sessions.push({ cohort: "GRAY_EXTRA", id: `${row.group}-repeat-${repetition}`, repetition,
      turns: rows.map(row => ({ id: row.caseId, group: row.group, category: "GRAY", contextCarry: row.contextCarry,
        originalGoal: row.currentGoal, ...original(row) })) });
  }
}
for (const row of selection.publicExposedHoldouts.cases) sessions.push({ cohort: "EXPOSED_HOLDOUT", id: row.caseId, repetition: 1,
  turns: [{ id: row.caseId, category: row.category, originalGoal: row.currentGoal, contextCarry: row.contextCarry, ...original(row) }] });
for (const source of selection.publicExposedHoldouts.sources) {
  assert.equal(hash(read(source.path)), source.sha256);
  assert(!read(source.path).toString("utf8").includes("{DATE}"));
}
assert.equal(selection.newDevelopmentInput.message, "Good cafes nearby to meet up with a friend on the afternoon of Wednesday");
for (let repetition = 1; repetition <= 3; repetition++) sessions.push({ cohort: "NEW_DEVELOPMENT", id: `wednesday-cafes-${repetition}`, repetition,
  turns: [{ id: "wednesday-cafes", message: selection.newDevelopmentInput.message,
    category: "GRAY", gold: false, referenceTime: "2026-10-26T04:41:48+09:00",
    referenceTimeSource: "Frozen clock tool 2026-10-25 19:41:48 UTC = 2026-10-25 20:41:48 CET; new development input only, no Gold" }] });
const counts = Object.fromEntries(["DEVELOPMENT", "GRAY_EXTRA", "EXPOSED_HOLDOUT", "NEW_DEVELOPMENT"].map(cohort => [cohort, sessions.filter(session => session.cohort === cohort).reduce((sum, session) => sum + session.turns.length, 0)]));
assert.deepEqual(counts, { DEVELOPMENT: 15, GRAY_EXTRA: 42, EXPOSED_HOLDOUT: 12, NEW_DEVELOPMENT: 3 });
assert.equal(sessions.reduce((sum, session) => sum + session.turns.length, 0), 72);

writeFileSync(`${base}/batch3/selected-inputs.json`, JSON.stringify({
  schema: "phase3a-boundary-selected-inputs@1", status: "frozen regression inputs / NOT_RUN / runtime configuration incomplete",
  contamination: "exposed development and exposed former holdouts / not Clean Baseline",
  selectionSha256: hash(read(selectionPath)), sourceFileBindingsVerified: true,
  stop2FrozenFilesVerified: oldFreeze.files.length, counts, logicalTurns: 72,
  hardCallCeiling: 144, actualCalls: 0, sessions,
}, null, 2) + "\n");
console.log(JSON.stringify({ stop2FrozenFilesVerified: oldFreeze.files.length, counts, logicalTurns: 72, realModelCalls: 0 }));
