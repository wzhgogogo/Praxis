import assert from "node:assert/strict";
import { test } from "node:test";

import { compareCompleteOutletAddress } from "./outlet-identity.js";
import { resolveTabelogEntity } from "../tabelog/tabelog-entity-resolver.js";
import { inspectTableCheckEntity } from "../tablecheck/tablecheck-entity-resolver.js";
import { fixtureCandidates } from "../../harness/restaurant-fixtures.js";

// Public address comparison only: no phone/name shortcut, browser or model.
// Synthetic spelling variants around the observed 3-15-5 / floor failures.
// Expected relationships come from address meaning, not the parser's tokens.
const address = (unit: string) => `〒150-0002 東京都渋谷区渋谷3-15-5 ${unit}`.trim();

test("same floor survives language, case, width and delimiter changes in either source order", () => {
  const equivalents = [
    { floor: "B1F", spellings: ["B1", "b1f", "Ｂ１Ｆ", "B 1 F", "地下1階", "地下１階", "地1階"] },
    { floor: "1F", spellings: ["1f", "１Ｆ", "1階", "１階", "1階 ", "1階、"] },
    { floor: "2F", spellings: ["2階", "２階", "Floor 2", "FL. 2", "2 F"] },
  ];
  for (const { floor, spellings } of equivalents) {
    for (const spelling of spellings) {
      for (const [left, right] of [[floor, spelling], [spelling, floor]]) {
        assert.equal(compareCompleteOutletAddress(address(left!), address(right!)), "MATCH", `${left} ≡ ${right}`);
      }
    }
  }
});

// Observed Google/source text from the 2026-10-20 saved benchmark details.
// Replayed fields only; no website requests or Gold IDs enter identity matching.
for (const example of [
  { id: "nr-004", name: "鮨処 みこし", sourceName: "Mikoshi", phone: "0422-21-0263",
    google: "9 13 1, １丁目-１３-9 吉祥寺本町 武蔵野市 東京都 180-0004, Japan",
    source: "1800004 東京都武蔵野市吉祥寺本町1-13-9 山本ビル １Ｆ・２Ｆ" },
  { id: "nr-016", name: "焼き鳥と蕎麦 灯", sourceName: "Yakitori to Soba Akari", phone: "03-4241-4563",
    google: "Japan, 〒180-0004 Tokyo, Musashino, Kichijōji Honchō, 1-chōme−8−１０ Kichijoji Ex, 4階",
    source: "1800004 東京都武蔵野市吉祥寺本町1-8-10 第85東京ビル 4F" },
  { id: "nr-024", name: "Nakameguro Yakiniku Togyumon", sourceName: "Nakameguro Yakiniku Togyu Mon", phone: "03-6451-2939",
    google: "Japan, 〒153-0051 Tokyo, Meguro City, Kamimeguro, 1-chōme−23−１ 中目黒アリーナ B1",
    source: "1530051 東京都目黒区上目黒1-23-1 中目黒アリーナ B1F" },
]) {
  test(`structured address restores ${example.id} without changing exact-phone identity`, () => {
    assert.equal(compareCompleteOutletAddress(example.google, example.source), "MATCH");
    assert.equal(compareCompleteOutletAddress(example.source, example.google), "MATCH");
    const candidate = structuredClone(fixtureCandidates[0]!);
    Object.assign(candidate.restaurant, { outletName: example.name, address: example.google });
    candidate.restaurant.sourceIds.phone = example.phone;
    const outlet = { sourceEntityId: "observed-detail", sourceUrl: "https://tabelog.com/tokyo/observed/", outletName: example.sourceName, address: example.source, phone: example.phone };
    assert.equal(resolveTabelogEntity(candidate, [outlet]).confidence, "HIGH");
    assert.equal(inspectTableCheckEntity(candidate, outlet).resolution.confidence, "HIGH");
  });
}

test("same phone and name never override explicit floor, door or nr-020 postal conflicts", () => {
  const candidate = structuredClone(fixtureCandidates[0]!);
  Object.assign(candidate.restaurant, { outletName: "Named restaurant", address: "1530051 東京都目黒区上目黒2-13-3 GEMS中目黒 7F" });
  candidate.restaurant.sourceIds.phone = "03-1111-2222";
  for (const different of ["1530051 東京都目黒区上目黒2-13-3 GEMS中目黒 8F", "1530051 東京都目黒区上目黒2-13-8 GEMS中目黒 7F", "1500002 東京都目黒区上目黒2-13-3 GEMS中目黒 7F"]) {
    const outlet = { sourceEntityId: "other", sourceUrl: "https://tabelog.com/tokyo/other/", outletName: candidate.restaurant.outletName, address: different, phone: candidate.restaurant.sourceIds.phone };
    assert.equal(compareCompleteOutletAddress(candidate.restaurant.address, different), "CONFLICT");
    assert.notEqual(resolveTabelogEntity(candidate, [outlet]).confidence, "HIGH");
    assert.notEqual(inspectTableCheckEntity(candidate, outlet).resolution.confidence, "HIGH");
  }
  assert.equal(compareCompleteOutletAddress("Japan, 〒150-0043 Tokyo, Shibuya, 2-chōme−2−２ Luke Building, 1F", "1500002 東京都渋谷区渋谷2-2-2 青山ルカビル 1F"), "CONFLICT");
  const wrongPhone = { sourceEntityId: "other", sourceUrl: "https://tabelog.com/tokyo/other/", outletName: "A different name", address: candidate.restaurant.address, phone: "03-1111-2223" };
  assert.notEqual(resolveTabelogEntity(candidate, [wrongPhone]).confidence, "HIGH");
  assert.notEqual(inspectTableCheckEntity(candidate, wrongPhone).resolution.confidence, "HIGH");
});

test("omitted floors stay neutral without losing street numbers or accepting incomplete addresses", () => {
  for (const floor of ["B1F", "地下1階", "1F", "1階", "2F", "2階"]) {
    assert.equal(compareCompleteOutletAddress(address(floor), address("")), "MATCH", `${floor} → omitted`);
    assert.equal(compareCompleteOutletAddress(address(""), address(floor)), "MATCH", `omitted → ${floor}`);
  }
  const insufficient: Array<[string | undefined, string | undefined]> = [
    [undefined, address("1F")], ["", address("1F")],
    ["〒150-0002 1F", "1500002 1階"],
    ["〒150-0002 東京都渋谷区 1階", "〒150-0002 東京都渋谷区 1F"],
    ["1-1 Shinjuku", "1-1 Shinjuku"],
  ];
  for (const [left, right] of insufficient) {
    assert.equal(compareCompleteOutletAddress(left, right), "INSUFFICIENT", `${left} / ${right}`);
    assert.equal(compareCompleteOutletAddress(right, left), "INSUFFICIENT", `${right} / ${left}`);
  }
});

test("floor normalization never erases explicit floor, street or postal conflicts", () => {
  const conflicts: Array<[string, string]> = [
    [address("地下1階"), address("1階")],
    [address("B1F"), address("1F")],
    [address("地下1階"), address("B2F")],
    [address("1階"), address("2階")],
    [address("2階"), address("3F")],
    [address("2F"), "〒150-0002 東京都渋谷区渋谷3-15-6 2階"],
    [address("2F"), "〒150-0002 東京都渋谷区渋谷3-5-15 2階"],
    [address("2F"), "〒106-0032 東京都渋谷区渋谷3-15-5 2階"],
    [address("B1F"), "〒106-0032 東京都港区六本木6-1-5 1F"],
  ];
  for (const [left, right] of conflicts) {
    assert.equal(compareCompleteOutletAddress(left, right), "CONFLICT", `${left} ≠ ${right}`);
    assert.equal(compareCompleteOutletAddress(right, left), "CONFLICT", `${right} ≠ ${left}`);
  }
});
