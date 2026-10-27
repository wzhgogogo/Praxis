import { createHash } from "node:crypto";
import { readFile, realpath } from "node:fs/promises";
import { relative, resolve, isAbsolute } from "node:path";

export interface BoundQuestion {
  id: string; question: string; pageId: string; sensitiveCategory: string | null;
  displayedOutlet: { candidateId: string; name: string; sourceUrl: string };
  readContext: { runId: string; startedAt: string };
  providedPage: { pageId: string; candidateId: string; sourceUrl: string; pageSha256: string; readRunId: string;
    readId: string; observedAt: string; identityObservedAt: string; metadataOrigin: string };
}
export interface SavedQuestionPage {
  id: string; site: "TABELOG" | "TABLECHECK" | "RESTAURANT_WEBSITE";
  outlet: { id: string; name: string; sourceUrl: string };
  pagePath: string; pageSha256: string; storageSha256: string; storageEncoding: "utf8" | "gzip";
}
export interface BoundQuestionSet { schema: "phase3b-qa-questions@2"; pages: SavedQuestionPage[]; questions: BoundQuestion[]; }
export const sha256 = (bytes: string | Uint8Array) => createHash("sha256").update(bytes).digest("hex");

export async function repositoryFile(path: string): Promise<string> {
  const file = await realpath(resolve(path)), local = relative(await realpath(process.cwd()), file);
  if (!local || local === ".." || local.startsWith("../") || isAbsolute(local)) throw new Error("QA_INPUT_OUTSIDE_REPOSITORY");
  return file;
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("INVALID_QA_INPUT_OBJECT");
  return value as Record<string, unknown>;
}
function keys(value: unknown, allowed: string[]) {
  if (Object.keys(object(value)).some(key => !allowed.includes(key))) throw new Error("UNKNOWN_QA_INPUT_KEY");
}
function text(value: unknown): asserts value is string {
  if (typeof value !== "string" || !value.trim()) throw new Error("INVALID_QA_INPUT_TEXT");
}
function url(value: unknown) { text(value); const parsed = new URL(value); if (!/^https?:$/.test(parsed.protocol) || parsed.username || parsed.password) throw new Error("INVALID_QA_SOURCE_URL"); }

/** The only file accepted here is the public question set, never reference answers. */
export async function loadBoundQuestions(path: string) {
  const bytes = await readFile(await repositoryFile(path));
  const value = JSON.parse(bytes.toString()) as BoundQuestionSet;
  keys(value, ["schema", "evidenceStatus", "sourceGit", "newRealCalls", "preparedAtCET", "visibility", "pages", "questions"]);
  if (value.schema !== "phase3b-qa-questions@2" || !Array.isArray(value.pages) || !Array.isArray(value.questions)) throw new Error("INVALID_PUBLIC_QUESTION_SET");
  const pages = new Map<string, SavedQuestionPage>(), ids = new Set<string>();
  for (const page of value.pages) {
    keys(page, ["id", "site", "outlet", "pagePath", "pageSha256", "storageSha256", "storageEncoding", "capturedOn", "dateTimezone", "scope", "sourceGit", "source", "evidenceStatus"]);
    keys(page.outlet, ["id", "name", "sourceUrl"]);
    for (const item of [page.id, page.pagePath, page.outlet.id, page.outlet.name]) text(item);
    url(page.outlet.sourceUrl);
    if (pages.has(page.id) || !["TABELOG", "TABLECHECK", "RESTAURANT_WEBSITE"].includes(page.site)
      || !["utf8", "gzip"].includes(page.storageEncoding) || ![page.pageSha256, page.storageSha256].every(hash => /^[a-f0-9]{64}$/.test(hash))) throw new Error("INVALID_SAVED_QA_PAGE");
    pages.set(page.id, page);
  }
  for (const question of value.questions) {
    keys(question, ["id", "question", "questionZh", "pageId", "type", "sensitiveCategory", "context", "questionRevision", "displayedOutlet", "readContext", "providedPage", "language"]);
    keys(question.displayedOutlet, ["candidateId", "name", "sourceUrl"]); keys(question.readContext, ["runId", "startedAt"]);
    keys(question.providedPage, ["pageId", "candidateId", "sourceUrl", "pageSha256", "readRunId", "readId", "observedAt", "identityObservedAt", "metadataOrigin"]);
    const given = question.providedPage, page = pages.get(question.pageId);
    for (const item of [question.id, question.question, question.displayedOutlet.candidateId, question.displayedOutlet.name, question.readContext.runId, given.readRunId, given.readId, given.metadataOrigin]) text(item);
    url(question.displayedOutlet.sourceUrl); url(given.sourceUrl);
    if (ids.has(question.id) || !page || given.pageId !== page.id || given.pageSha256 !== page.pageSha256 || given.candidateId !== page.outlet.id || given.sourceUrl !== page.outlet.sourceUrl
      || ![null, "ALLERGY", "HALAL", "RELIGIOUS_DIET", "ACCESSIBILITY"].includes(question.sensitiveCategory)
      || ![question.readContext.startedAt, given.observedAt, given.identityObservedAt].every(time => typeof time === "string" && Number.isFinite(Date.parse(time)))) throw new Error("INVALID_BOUND_QUESTION_METADATA");
    ids.add(question.id);
  }
  return { value, sha256: sha256(bytes) };
}
