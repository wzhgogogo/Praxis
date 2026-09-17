/** An incomplete address is neither a match nor a demonstrated conflict. */
export type CompleteOutletAddressComparison = "MATCH" | "CONFLICT" | "INSUFFICIENT";

function compact(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]+/gu, "");
}

function postalCode(value: string): string | undefined {
  const matched = value.normalize("NFKC").match(/(?:〒\s*)?(\d{3})\s*-?\s*(\d{4})/u);
  return matched ? `${matched[1]}${matched[2]}` : undefined;
}

function withoutPostal(value: string): string {
  return value.normalize("NFKC").replace(/(?:〒\s*)?\d{3}\s*-?\s*\d{4}/gu, " ");
}

/**
 * One source of truth for public floor/unit spelling.  Japanese 階 is not an
 * ASCII word character, so its suffix must not use `\b`; require instead that
 * it is followed by end-of-string or a non-letter/non-number delimiter.
 */
const UNIT_PATTERN = /(?:\bb\s*(\d+)\s*f\b|\b(?:floor|fl)\.?\s*(\d+)\b|\b(\d+)\s*f\b|\b(\d+)\s*階(?=$|[^\p{L}\p{N}])|(?:地下|地)\s*(\d+)\s*階(?=$|[^\p{L}\p{N}]))/gu;

function normalizedAddressForUnits(value: string): string {
  return withoutPostal(value).toLocaleLowerCase("en-US");
}

/** Explicit floor/basement markers, rather than any number in a street address. */
function unitTokens(value: string): string[] {
  return [...normalizedAddressForUnits(value).matchAll(UNIT_PATTERN)]
    .map((match) => {
      const basement = match[1] ?? match[5];
      const floor = match[2] ?? match[3] ?? match[4];
      return basement ? `B${basement}F` : floor ? `${floor}F` : undefined;
    })
    .filter((value): value is string => value !== undefined);
}

function withoutUnits(value: string): string {
  // Keep removal precisely aligned with unitTokens: a source may write the
  // same level as 地下1階, B1F, b1f, 2階, or 2F.  Removing only one spelling
  // would leave a false street-number conflict.
  return normalizedAddressForUnits(value).replace(UNIT_PATTERN, " ");
}

function streetNumbers(value: string): string[] {
  return withoutUnits(value).match(/\d+/gu) ?? [];
}

function tokens(value: string): string[] {
  return [...new Set([...withoutUnits(value).toLocaleLowerCase("en-US").matchAll(/[\p{L}]{2,}/gu)]
    .map((match) => match[0]!))].sort();
}

function sameSequence(left: string[], right: string[]): boolean {
  return left.length > 0 && left.length === right.length && left.every((value, index) => value === right[index]);
}

function hasSufficientAddress(value: string): boolean {
  if (streetNumbers(value).length === 0) return false;
  const addressTokens = tokens(value);
  return addressTokens.length >= 2 || /[都道府県].*[市区町村]/u.test(withoutUnits(value));
}

/**
 * Does not transliterate or fill missing fields.  A stated unit conflict is a
 * hard conflict; an omitted unit is evaluated only from the remaining public
 * address, never invented into a conflict.
 */
export function compareCompleteOutletAddress(
  left: string | undefined,
  right: string | undefined,
): CompleteOutletAddressComparison {
  if (!left?.trim() || !right?.trim() || !hasSufficientAddress(left) || !hasSufficientAddress(right)) return "INSUFFICIENT";
  const leftUnits = unitTokens(left); const rightUnits = unitTokens(right);
  if (leftUnits.length > 0 && rightUnits.length > 0 && !sameSequence(leftUnits, rightUnits)) return "CONFLICT";
  if (compact(left) === compact(right)) return "MATCH";
  const leftNumbers = streetNumbers(left); const rightNumbers = streetNumbers(right);
  if (!sameSequence(leftNumbers, rightNumbers)) return "CONFLICT";
  const leftPostal = postalCode(left); const rightPostal = postalCode(right);
  if (leftPostal && rightPostal) return leftPostal === rightPostal ? "MATCH" : "CONFLICT";
  const leftTokens = tokens(left); const rightTokens = tokens(right);
  if (leftTokens.length > 0 && leftTokens.length === rightTokens.length && leftTokens.every((value, index) => value === rightTokens[index])) return "MATCH";
  return "CONFLICT";
}

/** Compatibility predicate for callers that require only positive proof. */
export function sameCompleteOutletAddress(left: string | undefined, right: string | undefined): boolean {
  return compareCompleteOutletAddress(left, right) === "MATCH";
}
