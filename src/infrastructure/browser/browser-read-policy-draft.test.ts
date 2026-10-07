import assert from "node:assert/strict";
import test from "node:test";

import { draftReviewedReads } from "./browser-read-policy-draft.js";

test("policy draft records only admitted value-free GET shapes and never activates a POST", () => {
  const draft = draftReviewedReads([
    { outcome: "ADMITTED", origin: "https://official.example", pathname: "/menu", method: "GET", resourceType: "fetch", queryKeys: ["locale"] },
    { outcome: "ADMITTED", origin: "https://official.example", pathname: "/menu", method: "GET", resourceType: "fetch", queryKeys: ["locale"] },
    { outcome: "ADMITTED", origin: "https://official.example", pathname: "/calendar", method: "POST", resourceType: "fetch", queryKeys: [] },
    { outcome: "BLOCKED", origin: "https://official.example", pathname: "/account", method: "GET", resourceType: "fetch", queryKeys: [] },
  ]);
  assert.equal(draft.status, "DRAFT_NOT_APPROVED");
  assert.deepEqual(draft.reviewedReads, [{
    origin: "https://official.example", pathname: "/menu", resourceTypes: ["fetch"], methods: ["GET"], queryKeys: ["locale"],
  }]);
  assert.deepEqual(draft.omitted.map(item => item.reason), ["POST_REQUIRES_BODY_REVIEW", "NOT_ADMITTED"]);
});
