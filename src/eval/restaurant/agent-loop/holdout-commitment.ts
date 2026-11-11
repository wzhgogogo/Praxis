import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export interface HoldoutCommitment {
  fileSha256: string;
  cases: ReadonlyArray<{ id: string; sha256: string }>;
}
const digest = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");

/** Does not parse, print, copy, or persist private YAML content. Order is committed. */
export function verifyHoldoutCommitment(original: Uint8Array, commitment: HoldoutCommitment) {
  const reject = (code: string): never => { throw Object.assign(new Error(code), { code }); };
  if (!/^[a-f0-9]{64}$/.test(commitment.fileSha256) || !commitment.cases.length
    || new Set(commitment.cases.map(c => c.id)).size !== commitment.cases.length
    || commitment.cases.some(c => !c.id || !/^[a-f0-9]{64}$/.test(c.sha256))) reject("INVALID_COMMITMENT");
  const fileSha256 = digest(original);
  if (fileSha256 !== commitment.fileSha256) reject("HOLDOUT_FILE_SHA_MISMATCH");
  const text = new TextDecoder("utf-8", { fatal: true }).decode(original);
  // Reviewer verified 2026-11-09: segment zero is a comment-only preamble.
  // Whole-file hashing above includes its original bytes; case hashes do not.
  const parts=text.split(/^---\r?$/mu),preamble=parts.shift()!;
  if(preamble.split(/\r?\n/u).some(line=>line.trim()!==""&&!line.startsWith("#")))reject("HOLDOUT_PREAMBLE_INVALID");
  // Content whitespace is untouched: trim only boundary newlines, then one LF.
  const documents = parts.map(part => part.replace(/^(?:\r?\n)+|(?:\r?\n)+$/gu, ""));
  if (documents.length !== commitment.cases.length || documents.some(doc => !doc.length)) reject("HOLDOUT_CASE_COUNT_MISMATCH");
  const cases = documents.map((doc, index) => {
    const item = commitment.cases[index]!;
    const sha256 = digest(doc + "\n");
    if (sha256 !== item.sha256) reject(`HOLDOUT_CASE_SHA_MISMATCH:${item.id}`);
    return { id: item.id, sha256 };
  });
  return { status: "VERIFIED" as const, fileSha256, cases };
}


/** Ephemeral execution-only access after the exact original commitment succeeds.
 * The caller must never serialize or log these private sections. */
export function readCommittedHoldoutDocuments(original:Uint8Array,commitment:HoldoutCommitment):readonly string[]{
  verifyHoldoutCommitment(original,commitment);
  return new TextDecoder("utf-8",{fatal:true}).decode(original).split(/^---\r?$/mu).slice(1)
    .map(part=>part.replace(/^(?:\r?\n)+|(?:\r?\n)+$/gu,""));
}

/** Mandatory preflight only; verification grants no Live/model authorization. */
export async function checkPrivateHoldoutFile(originalPath: string) {
  const commitment = JSON.parse(await readFile(new URL("../../../../.eval-artifacts/phase3b-holdout/commitment.json", import.meta.url), "utf8")) as HoldoutCommitment;
  return verifyHoldoutCommitment(await readFile(originalPath), commitment);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== "--file") throw new Error("Usage: holdout-commitment.ts --file <user-provided-private-YAML>");
  try { process.stdout.write(JSON.stringify(await checkPrivateHoldoutFile(args[1]!)) + "\n"); }
  catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "HOLDOUT_CHECK_FAILED";
    process.stderr.write(JSON.stringify({ status: "REFUSED", code }) + "\n");
    process.exitCode = 1;
  }
}
