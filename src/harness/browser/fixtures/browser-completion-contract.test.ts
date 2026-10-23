import type { BrowserSkillReadInput } from "../../../infrastructure/browser/browser-task-executor.js";

type Completion = ReturnType<BrowserSkillReadInput["completion"]>;
// A completed read without a bound result cannot participate in stability verification.
// @ts-expect-error Complete requires both resultKey and resultBusy.
const missingBoth: Completion = { complete: true, reason: "visible" };
// @ts-expect-error Complete requires an explicit resultBusy even with a result key.
const missingBusy: Completion = { complete: true, reason: "visible", resultKey: "result" };
// @ts-expect-error Complete requires a result key even with an explicit busy state.
const missingKey: Completion = { complete: true, reason: "visible", resultBusy: false };
void [missingBoth, missingBusy, missingKey];
