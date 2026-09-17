import assert from "node:assert/strict";
import { test } from "node:test";

import { compareCompleteOutletAddress } from "./outlet-identity.js";

// Public address comparison only: no phone/name shortcut, browser or model.
// Synthetic spelling variants around the observed 3-15-5 / floor failures.
// Expected relationships come from address meaning, not the parser's tokens.
const address = (unit: string) => `〒150-0002 東京都渋谷区渋谷3-15-5 ${unit}`.trim();

test("same floor survives language, case, width and delimiter changes in either source order", () => {
  const equivalents = [
    { floor: "B1F", spellings: ["b1f", "Ｂ１Ｆ", "B 1 F", "地下1階", "地下１階", "地1階"] },
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
