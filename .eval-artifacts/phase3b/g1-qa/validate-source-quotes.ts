// Conversation A / reviewer only. Conversation B must not read candidate answers.
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { independentPageText } from "../../../src/eval/restaurant/fact-qa/independent-text.js";
const root = ".eval-artifacts/phase3b/g1-qa/";
const questions = JSON.parse(await readFile(root + "questions.json", "utf8")) as { pages: Array<{ id: string; pagePath: string; pageSha256: string; storageEncoding: string }> };
const answers = JSON.parse(await readFile(root + "answers.candidate.json", "utf8")) as { answers: Array<{ questionId: string; pageId: string; status: string; evidence: Array<{ quote: string }> }> };
const rows = [];
for (const page of questions.pages) {
  const stored = await readFile(page.pagePath), raw = page.storageEncoding === "gzip" ? gunzipSync(stored) : stored;
  if (createHash("sha256").update(raw).digest("hex") !== page.pageSha256) throw new Error("SHA mismatch");
  const text = (await independentPageText(raw.toString())).replace(/\s+/g, " ");
  const citations = answers.answers.filter(answer => answer.pageId === page.id).flatMap(answer => answer.evidence.map(evidence => ({ questionId: answer.questionId, quote: evidence.quote, present: text.includes(evidence.quote.replace(/\s+/g, " ")) })));
  rows.push({ pageId: page.id, pageSha256: page.pageSha256, citations });
}
const result = { mode: "LOCAL_CHROMIUM_SAVED_DOM_ONLY", pageScripts: "DISABLED", sourceTransportCalls: 0, pages: rows, status: rows.every(row => row.citations.every(citation => citation.present)) ? "PASS" : "FAIL", humanAnswerStatus: "CANDIDATE_NOT_CONFIRMED" };
const at = process.argv.indexOf("--out"); if (at < 0 || !process.argv[at + 1]) throw new Error("Explicit --out required");
await writeFile(process.argv[at + 1]!, JSON.stringify(result, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ status: result.status, pages: rows.length, sourceTransportCalls: 0 }));
if (result.status !== "PASS") process.exitCode = 1;
