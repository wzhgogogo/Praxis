import { readFile, writeFile } from "node:fs/promises";
import { invokeQuestionCore, scoringResponse } from "../../../../src/eval/restaurant/fact-qa/core-adapter.js";
import { scoreQaAnswer, type QaReference } from "../../../../src/eval/restaurant/fact-qa/scorer.js";
const input = JSON.parse(await readFile(".eval-artifacts/phase3b/g1-runner/review-blocker/input.json", "utf8"));
// Local construction; status literals exercise the scorer, not human restaurant Gold.
const result = await invokeQuestionCore(input.coreInput, { complete: async () => ({ invocationId: "local-contract-probe", provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS", latencyMs: 0,
  outputText: JSON.stringify({ status: "NOT_STATED", answer: null, sensitiveCategory: "ALLERGY", citations: [] }) }) }, new AbortController().signal);
const score = scoreQaAnswer(input.reference as QaReference, input.read, scoringResponse(result.answer, input.read));
const output = { inputOrigin: "LOCAL_CONSTRUCTED_NOT_WEBSITE_REPLAY_OR_GOLD", coreGit: input.coreGit, affectedReviewedIds: ["G1-Q28", "G1-Q30"],
  rawCoreResult: result.raw, observedScorerResult: score, verdict: result.answer.status === "NOT_STATED" && score.reasons.includes("MISSING_VERBATIM_QUOTE") ? "CONFIRMED_CONTRACT_INCOMPATIBILITY" : "NOT_REPRODUCED",
  realModelCalls: 0, websiteCalls: 0, action: "Keep Gold/core unchanged; review the NOT_STATED citation contract before real-model acceptance." };
const at = process.argv.indexOf("--out"); if (at < 0 || !process.argv[at + 1]) throw new Error("Explicit --out required");
await writeFile(process.argv[at + 1]!, JSON.stringify(output, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ verdict: output.verdict, coreStatus: result.answer.status, scorerStatus: score.status, reasons: score.reasons }));
