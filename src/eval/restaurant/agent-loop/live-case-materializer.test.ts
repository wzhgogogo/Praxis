import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseAllDocuments } from "yaml";
import { test } from "node:test";

import { evaluateRestaurantHybridLiveArtifact } from "./diagnostic-evaluator.js";
import { loadFrozenLiveCases, materializeLiveCase, customLiveCaseCohort, validDevelopmentVariantParent, RESTAURANT_READ_DEVELOPMENT_CASE_PATH, RESTAURANT_READ_DEVELOPMENT_DATASET_VERSION } from "./live-case-materializer.js";

test("live materialization resolves tonight and updates every dependent date without mutating source", () => {
  const source = {
    id: "h001", reference_time: "2026-08-19T16:20:00+08:00", content: "tonight at 7 PM",
    semantic: { date: { expression: "tonight", value: "2026-08-19" } },
    tool_requirements: { task_critical_arguments: { date: "2026-08-19" } },
    recommendation_requirements: { task_critical_eligibility: ["available on 2026-08-19 at 19:00"] },
  };
  const result = materializeLiveCase(source, "2026-08-20T16:20:00+09:00");
  assert.equal(result.semantic?.date?.value, "2026-08-20");
  assert.deepEqual((result.tool_requirements as { task_critical_arguments: { date: string } }).task_critical_arguments.date, "2026-08-20");
  assert.deepEqual((result.recommendation_requirements as { task_critical_eligibility: string[] }).task_critical_eligibility, ["available on 2026-08-20 at 19:00"]);
  assert.equal(source.semantic.date.value, "2026-08-19");
});

test("live materialization handles this Friday and this afternoon in Asia/Tokyo", () => {
  const friday = materializeLiveCase({ id: "h003", reference_time: "", semantic: { date: { expression: "this Friday", value: "2026-08-21" } } }, "2026-08-20T12:00:00+09:00");
  const afternoon = materializeLiveCase({ id: "h004", reference_time: "", semantic: { date: { expression: "this afternoon", value: "2026-08-19" } } }, "2026-08-20T12:00:00+09:00");
  assert.equal(friday.semantic?.date?.value, "2026-08-21");
  assert.equal(afternoon.semantic?.date?.value, "2026-08-20");
});

test("live materialization independently resolves a right-now clock in Tokyo instead of retaining frozen case time", () => {
  const source = {
    id: "h005", reference_time: "2026-08-19T16:00:00+08:00", content: "open tables right now",
    semantic: { date: { expression: "right now", value: "2026-08-19" }, time: { expression: "right now", value: "16:00" } },
    tool_requirements: { task_critical_arguments: { date: "2026-08-19", time: "16:00" } },
  };
  const result = materializeLiveCase(source, "2026-09-14T09:27:30+09:00");
  assert.equal(result.semantic?.date?.value, "2026-09-14");
  assert.equal(result.semantic?.time?.value, "09:27");
  assert.equal((result.tool_requirements as { task_critical_arguments: { time: string } }).task_critical_arguments.time, "09:27");
  assert.equal(result.materialization.resolvedTokyoTime, "09:27");
  assert.equal(source.semantic.time.value, "16:00");
});

test("current development inputs preserve the archived user messages and have one parameter oracle", async () => {
  const archivePath = "docs/superseded/eval/restaurant-read-pre-alignment-2026-09-15/e2e-cases.yaml";
  const current = await loadFrozenLiveCases(RESTAURANT_READ_DEVELOPMENT_CASE_PATH);
  // The archived annotation shape is evidence, not a current executable case contract.
  const historical = parseAllDocuments(await readFile(archivePath, "utf8")).map(document => document.toJSON());
  assert.equal(createHash("sha256").update(await readFile(archivePath)).digest("hex"), "2e32c2c3642a9d480f81c6ba06641925be98981b16d6f8235e461b4d9adac98b");
  assert.deepEqual(current.map(item => item.id), ["h001", "h002", "h003", "h004", "h005"]);
  assert.deepEqual(current.map(({ id, content }) => ({ id, content })), historical.map(({ id, content }) => ({ id, content })));
  for (const item of current) {
    assert.equal(item.dataset, RESTAURANT_READ_DEVELOPMENT_DATASET_VERSION);
    assert.deepEqual(Object.keys(item).sort(), ["acceptance", "content", "dataset", "id", "reference_time", "semantic"]);
  }
});

test("real case loader through materialization and evaluator agrees with independent current request expectations", async () => {
  // Contract test boundary: actual dataset loader → materializer → evaluator.
  // No semantic model, source execution or final-result qualification is simulated here.
  const criterion = (text: string, polarity = "POSITIVE", strength = "HARD") => ({ text, polarity, strength });
  const point = (time: string) => ({ earliest: time, latest: time });
  const expected = [
    { goal: "AVAILABILITY", date: "2026-09-16", partySize: 2, timeWindow: point("19:00"), area: { query: "near Shibuya" }, criteria: [criterion("omakase")] },
    { goal: "AVAILABILITY", date: "2026-09-19", partySize: 2, area: { query: "near Higashi-Ginza" }, timeWindow: point("18:30"), criteria: [criterion("good for a first date", "POSITIVE", "UNSPECIFIED"), criterion("around 10,000 yen per person", "POSITIVE", "SOFT"), criterion("Sichuan/Hunan cuisine", "NEGATIVE"), criterion("hot pot restaurant", "NEGATIVE")] },
    { goal: "AVAILABILITY", date: "2026-09-18", partySize: 10, area: { query: "nearby" }, timeWindow: { earliest: "17:30", latest: "22:00" }, criteria: [criterion("team dinner", "POSITIVE", "UNSPECIFIED"), criterion("around 3,000 yen per person", "POSITIVE", "SOFT"), criterion("good for drinks", "POSITIVE", "UNSPECIFIED"), criterion("private room", "POSITIVE", "SOFT")] },
    { goal: "RECOMMENDATION", date: "2026-09-16", area: { query: "nearby" }, timeWindow: { earliest: "12:00", latest: "17:00" }, criteria: [criterion("cafe"), criterion("good for meeting a friend", "POSITIVE", "UNSPECIFIED")] },
    { goal: "AVAILABILITY", date: "2026-09-16", partySize: 4, area: { query: "nearby" }, timeWindow: { earliest: "12:00", latest: "12:30" }, criteria: [criterion("local food"), criterion("fast food", "NEGATIVE")] },
  ];
  const cases = await loadFrozenLiveCases(RESTAURANT_READ_DEVELOPMENT_CASE_PATH);
  for (const [index, item] of cases.entries()) {
    const { goal, ...request } = expected[index]!;
    const materializedCase = materializeLiveCase(item, "2026-09-16T03:00:00.000Z");
    const artifact = { materializedCase, finalSnapshot: { domainState: { intentDraft: { ...request, target: { goal } } } } };
    const evaluate = () => evaluateRestaurantHybridLiveArtifact(artifact, { path: "contract-test", sha256: "a".repeat(64) }).findings.find(f => f.dimension === "AUTHORITATIVE_CONDITIONS")!;
    assert.equal(evaluate().status, "SATISFIED", `${item.id}: ${JSON.stringify(evaluate())}`);
    if (item.id === "h002") assert.equal((materializedCase.semantic as Record<string, unknown>).party_size, 2);
    if (item.id === "h003") assert.deepEqual((materializedCase.semantic as Record<string, any>).time, { expression: "after work", type: "TIME_WINDOW", start: "17:30", end: "22:00" });
    artifact.finalSnapshot.domainState.intentDraft.target.goal = goal === "RECOMMENDATION" ? "AVAILABILITY" : "RECOMMENDATION";
    // Keep the mutated availability request complete to isolate the wrong-goal
    // assertion; incomplete records are separately classified NOT_EVALUATED.
    artifact.finalSnapshot.domainState.intentDraft.timeWindow ??= point("19:00");
    assert.equal(evaluate().status, "NOT_SATISFIED", `${item.id}: changing delivery goal must conflict`);
  }
});

test("relative expectation updates never rewrite literal dates or times in the actual user message", () => {
  const content = "Find tables right now; my note from 2026-08-19 at 16:00 is historical.";
  const result = materializeLiveCase({ id: "input-preservation", reference_time: "2026-08-19T16:00:00+09:00", content,
    semantic: { date: { expression: "right now", value: "2026-08-19" }, time: { expression: "right now", value: "16:00" } },
  }, "2026-09-16T03:00:00.000Z");
  assert.equal(result.semantic?.date?.value, "2026-09-16");
  assert.equal(result.semantic?.time?.value, "12:00");
  assert.equal(result.content, content);
});


test("approved Gold7 is the default and right-now window materializes both bounds without changing Gold6", async () => {
  const frozen = await loadFrozenLiveCases(RESTAURANT_READ_DEVELOPMENT_CASE_PATH);
  assert.equal(RESTAURANT_READ_DEVELOPMENT_DATASET_VERSION, "restaurant-read-development@7");
  assert.ok(frozen.every(item => item.dataset === "restaurant-read-development@7"));
  const original = frozen.find(item => item.id === "h005")!;
  const result = materializeLiveCase(original, "2026-10-09T16:47:09+09:00");
  assert.deepEqual(result.semantic?.time, { expression: "right now", type: "TIME_WINDOW", start: "16:47", end: "17:17" });
  assert.deepEqual(original.semantic?.time, { expression: "right now", type: "TIME_WINDOW", start: "17:00", end: "17:30" });
  assert.equal(result.content, original.content);
  const historical = await loadFrozenLiveCases("src/eval/restaurant/agent-loop/cases/e2e-cases.yaml");
  assert.ok(historical.every(item => item.dataset === "restaurant-read-development@6"));
  const frozenParent = { dataset: "restaurant-read-development@6", sha256: "00b69476e6d07eec5dcd9a657555c4e3766629fce5f8e630512710252886ffb6" };
  assert.equal(await validDevelopmentVariantParent(frozenParent), true, "approved frozen variants retain their actual Gold6 parent after switching the default");
  assert.equal(await validDevelopmentVariantParent({ ...frozenParent, sha256: "0".repeat(64) }), false);
  assert.equal(await validDevelopmentVariantParent({ ...frozenParent, dataset: "unknown-dataset" }), false);
  for (const item of frozen.filter(item => item.id !== "h005")) {
    const previous = historical.find(entry => entry.id === item.id)!;
    assert.deepEqual({ ...item, dataset: previous.dataset }, previous, "H001-H004 keep their independent expectations");
  }
});


test("custom live case loading keeps novel inputs parentless and in their own cohort", async () => {
  const source = { id: "novel-eval-example", reference_time: "2026-10-11T18:00:00+09:00", dataset: "restaurant-read-novel-variant@1", content: "Frozen novel request", semantic: { date: { value: "2026-10-20" } } };
  const before = structuredClone(source);
  assert.equal(await customLiveCaseCohort(source), "NOVEL_LOCATION_DIAGNOSTIC");
  assert.deepEqual(source, before);
  const parent = { dataset: "restaurant-read-development@6", sha256: "00b69476e6d07eec5dcd9a657555c4e3766629fce5f8e630512710252886ffb6" };
  assert.equal(await customLiveCaseCohort({ ...source, dataset: "restaurant-read-development-variant@1", parent }), "DEVELOPMENT_DIAGNOSTIC");
  await assert.rejects(customLiveCaseCohort({ ...source, parent }), /Custom case source/);
  await assert.rejects(customLiveCaseCohort({ ...source, dataset: "unrecognized-dataset" }), /Custom case source/);
  await assert.rejects(customLiveCaseCohort({ ...source, dataset: "restaurant-read-development-variant@1" }), /Custom case source/);
  await assert.rejects(customLiveCaseCohort({ ...source, dataset: "restaurant-read-development-variant@1", parent: { ...parent, sha256: "0".repeat(64) } }), /Custom case source/);
});


test("approved P1-F rev2 loads all eight independent literal request expectations", async () => {
  const cases = await loadFrozenLiveCases(".eval-artifacts/p1-f-20261011/variants.rev2.yaml");
  // Literal oracle transcribed from the approved file, independent of YAML parsing.
  const expected = [
    ["p1f-kf-h001-20261020", "Tuesday, October 20", "2026-10-20", "19:00", 2, "Shibuya", ["omakase"],
      "Looking for an omakase spot near Shibuya for 2 people on Tuesday, October 20 at 7 PM."],
    ["p1f-kf-h002-20261024", "Saturday, October 24", "2026-10-24", "18:30", 2, "Higashi-Ginza", ["good for a first date", "around 10,000 yen per person", "Sichuan/Hunan cuisine", "hot pot restaurant"],
      "Recommend a first-date restaurant near Higashi-Ginza for Saturday, October 24 at 6:30 PM. Around 10,000 yen per person. No hot-pot restaurants and no Sichuan/Hunan-style cuisine where spicy food is the main focus."],
    ["p1f-kf-h003-20261023", "Friday, October 23", "2026-10-23", ["17:30", "22:00"], 10, "nearby", ["team dinner", "around 3,000 yen per person", "good for drinks", "private room"],
      "Need a place for a team dinner nearby on Friday, October 23 after work. 10 people, around 3,000 yen per person, good for drinks, ideally with a private room."],
    ["p1f-kf-h004-20261019", "Monday, October 19", "2026-10-19", ["12:00", "17:00"], undefined, "nearby", ["cafe", "good for meeting a friend"],
      "Good cafes nearby to meet up with a friend on the afternoon of Monday, October 19."],
    ["p1f-kf-h005-20261022", "Thursday, October 22", "2026-10-22", "18:00", 4, "nearby", ["local food", "fast food"],
      "Any spots nearby with open tables on Thursday, October 22 at 6 PM for 4 people? Local food only, no fast food."],
    ["p1f-novel-kagurazaka-kaiseki-20261022", "Thursday, October 22", "2026-10-22", "19:30", 3, "Kagurazaka", ["kaiseki"],
      "Looking for a kaiseki restaurant near Kagurazaka for 3 people on Thursday, October 22 at 7:30 PM."],
    ["p1f-novel-nakameguro-yakiniku-20261023", "Friday, October 23", "2026-10-23", "19:00", 4, "Nakameguro", ["yakiniku"],
      "Find a yakiniku place near Nakameguro for 4 people on Friday, October 23 at 7 PM."],
    ["p1f-novel-kichijoji-tempura-20261020", "Tuesday, October 20", "2026-10-20", "18:00", 2, "Kichijoji", ["tempura"],
      "Any tempura restaurants near Kichijoji with a table for 2 on Tuesday, October 20 at 6 PM?"],
  ] as const;
  assert.equal(cases.length, 8);
  for (const [id, expression, date, time, party, location, criteria, content] of expected) {
    const item = cases.find(item => item.id === id)!;
    const semantic = item.semantic as Record<string, any>;
    assert.equal(item.content, content + "\n", id);
    assert.equal(semantic.date.expression, expression, id);
    assert.equal(semantic.date.value, date, id);
    assert.deepEqual(typeof time === "string" ? semantic.time.value : [semantic.time.start, semantic.time.end], time, id);
    assert.equal(semantic.party_size, party, id);
    assert.equal(semantic.location.value, location, id);
    assert.deepEqual(semantic.criteria.map((criterion: { value: string }) => criterion.value), criteria, id);
    assert.equal(semantic.target.goal, id === "p1f-kf-h004-20261019" ? "RECOMMENDATION" : "AVAILABILITY", id);
    const criterionModes: Record<string, ReadonlyArray<readonly [string, string]>> = {
      "p1f-kf-h001-20261020": [["POSITIVE", "HARD"]],
      "p1f-kf-h002-20261024": [["POSITIVE", "UNSPECIFIED"], ["POSITIVE", "SOFT"], ["NEGATIVE", "HARD"], ["NEGATIVE", "HARD"]],
      "p1f-kf-h003-20261023": [["POSITIVE", "UNSPECIFIED"], ["POSITIVE", "SOFT"], ["POSITIVE", "UNSPECIFIED"], ["POSITIVE", "SOFT"]],
      "p1f-kf-h004-20261019": [["POSITIVE", "HARD"], ["POSITIVE", "UNSPECIFIED"]],
      "p1f-kf-h005-20261022": [["POSITIVE", "HARD"], ["NEGATIVE", "HARD"]],
      "p1f-novel-kagurazaka-kaiseki-20261022": [["POSITIVE", "HARD"]],
      "p1f-novel-nakameguro-yakiniku-20261023": [["POSITIVE", "HARD"]],
      "p1f-novel-kichijoji-tempura-20261020": [["POSITIVE", "HARD"]],
    };
    assert.deepEqual(semantic, {
      target: { goal: id === "p1f-kf-h004-20261019" ? "RECOMMENDATION" : "AVAILABILITY" },
      location: { value: location, relation: location === "nearby" ? "NEAR_USER" : "NEAR" },
      date: { expression, value: date },
      time: typeof time === "string" ? { value: time } : { expression: id === "p1f-kf-h003-20261023" ? "after work" : "afternoon", type: "TIME_WINDOW", start: time[0], end: time[1] },
      ...(party !== undefined ? { party_size: party } : {}),
      criteria: criteria.map((value, index) => ({ value, polarity: criterionModes[id]![index]![0], strength: criterionModes[id]![index]![1] })),
    }, id);
  }
});

test("case loader rejects the original comma-truncated P1-F revision", async () => {
  await assert.rejects(loadFrozenLiveCases(".eval-artifacts/p1-f-20261011/variants.yaml"), /Frozen E2E case source is invalid/);
});

test("case loader rejects null values and unknown keys instead of silently accepting them", async () => {
  const directory = await mkdtemp(join(tmpdir(), "restaurant-case-validation-"));
  const source = await readFile(RESTAURANT_READ_DEVELOPMENT_CASE_PATH, "utf8");
  try {
    for (const [name, invalid] of [
      ["null", source.replace("goal: AVAILABILITY", "goal: null")],
      ["unknown", source.replace("goal: AVAILABILITY", "goal: AVAILABILITY\n    unrecognized_goal: AVAILABILITY")],
    ]) {
      const path = join(directory, `${name}.yaml`);
      await writeFile(path, invalid!);
      await assert.rejects(loadFrozenLiveCases(path), /Frozen E2E case source is invalid/, name);
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});
