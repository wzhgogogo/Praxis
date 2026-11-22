import type { RestaurantIntentDraft, RestaurantIntentPatch } from "./contracts.js";

const fold = (value: string) => value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
const normalize = (value: string) => fold(value).trim().replace(/\s+/g, " ");
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function criterionPhrase(text: string): string {
  const literal = escape(normalize(text)).replace(/\s+/g, "\\s+");
  const served = normalize(text).match(/^(?:serves|serving|offers|offering|has|having|featuring) (.+)$/);
  if (!served) return literal;
  const object = escape(served[1]!).replace(/\s+/g, "\\s+");
  return `(?:with|that\\s+(?:serves|offers|has)|serves|serving|offers|offering|has|having|featuring)\\s+${object}`;
}

function phrase(pattern: string): string {
  return `(?<![\\p{Script=Latin}\\p{N}])(?:${pattern})(?![\\p{Script=Latin}\\p{N}])`;
}

/** Match folded text but remove only the matching span from the original spelling. */
function removePhrase(query: string, pattern: string, joiners = false): string {
  let folded = "";
  const original: Array<{ start: number; end: number }> = [];
  for (const match of query.matchAll(/\P{M}\p{M}*|\p{M}+/gu)) {
    const text = fold(match[0]);
    folded += text;
    for (let i = 0; i < text.length; i++) original.push({ start: match.index, end: match.index + match[0].length });
  }
  const matches = [...folded.matchAll(new RegExp(phrase((joiners ? "(?:and\\s+)?" : "") + pattern), "gu"))];
  for (const match of matches.reverse()) {
    const start = original[match.index]!.start;
    const end = original[match.index + match[0].length - 1]!.end;
    const tail = query.slice(end);
    const nextConjunction = joiners && !/^and\s/u.test(match[0]) && tail.match(/^\s+and\s+/iu);
    const predicate = match[0].match(/^(?:that\s+)?(?:with|has|having|serves|serving|offers|offering|featuring)\s+/u)?.[0];
    query = query.slice(0, start) + (nextConjunction && predicate ? " " + predicate : " ")
      + (nextConjunction ? tail.slice(nextConjunction[0].length) : tail);
  }
  return query;
}

/** Edit the inherited query in place, preserving wording outside the changed conditions. */
export function maintainOpenEndedTargetQuery(
  current: RestaurantIntentDraft | undefined, next: RestaurantIntentDraft, patch: RestaurantIntentPatch,
): void {
  if (Object.hasOwn(patch, "target") || !current?.target || next.target?.selectionScope !== "OPEN_ENDED") return;
  if (!["area", "removeCriteria", "replaceCriteria", "addCriteria"].some(key => Object.hasOwn(patch, key))) return;

  const key = (item: RestaurantIntentDraft["criteria"][number]) => normalize(item.text) + "\0" + item.polarity;
  const previous = new Set(current.criteria.map(key));
  const retained = new Set(next.criteria.map(key));
  if (current.area?.query === next.area?.query && previous.size === retained.size
    && [...previous].every(item => retained.has(item))) return;

  let query = current.target.query;
  const revoked = current.criteria.filter(item => !retained.has(key(item)));
  const added = next.criteria.filter(item => !previous.has(key(item)));
  for (const item of [...revoked, ...added.filter(item => item.polarity === "NEGATIVE")]) {
    const term = criterionPhrase(item.text);
    if (!term) continue;
    const prefix = item.polarity === "NEGATIVE" ? "(?:(?:no|not|without|avoid)\\s+)?" : "";
    const served = normalize(item.text).match(/^(?:serves|serving|offers|offering|has|having|featuring) (.+)$/);
    if (served) {
      const object = escape(served[1]!).replace(/\s+/g, "\\s+");
      query = removePhrase(query, prefix + "(?:" + term + "|and\\s+" + object + ")", true);
    } else if (/^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]+$/u.test(item.text)) {
      query = query.replace(new RegExp("(?<![\\p{Script=Han}])" + escape(item.text) + "(?=店|[のをがで、\\s]|$)", "gu"), "");
    } else query = removePhrase(query, prefix + term, true);
  }

  const oldArea = current.area?.query;
  const newArea = next.area?.query;
  if (oldArea && /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(oldArea)) {
    query = query.replace(new RegExp("(^|[の、\\s])" + escape(oldArea) + "(?:の|で|(?=[、\\s]|$))", "gu"), "$1");
  } else if (oldArea) query = removePhrase(query, "(?:(?:in|near|around|at)\\s+)?" + escape(normalize(oldArea)).replace(/\s+/g, "\\s+"));
  query = query.replace(/\s+/g, " ").trim().replace(/(?:\s+(?:in|near|around|at|with|and|that)|[,;:])+$/giu, "").trim();
  if (!query) query = "restaurant";
  for (const item of added) {
    if (item.polarity === "POSITIVE" && !new RegExp(phrase(criterionPhrase(item.text)), "u").test(normalize(query))) {
      query += " " + item.text.trim();
    }
  }
  if (newArea) query += " in " + newArea.trim();
  next.target = { ...next.target, query };
}
