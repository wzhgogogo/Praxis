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
const UNIT_PATTERN = /(?:(?<!\d)b\s*(\d+)\s*(?:f\b|(?=$|[^\p{L}\p{N}]))|\b(?:floor|fl)\.?\s*(\d+)\b|(?<!\d)(\d+)\s*f\b|(?<!\d)(\d+)\s*階(?=$|[^\p{L}\p{N}])|(?:地下|地)\s*(\d+)\s*階(?=$|[^\p{L}\p{N}]))/gu;

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

interface StreetFields { chome?: number; ban?: number; go?: number; }

/** Parse the address block, never every digit (building names can contain digits). */
function streetFields(value: string): StreetFields {
  const text = withoutUnits(value).replace(/[‐‑‒–—−]/gu, "-");
  // Prefer explicitly labelled chome over an unlabelled/repeated Google prefix.
  const labelled = text.match(/(\d+)\s*(?:-\s*ch[ōo]me|丁目)\s*-?\s*(\d+)?(?:\s*(?:-|番(?:地)?)\s*(\d+))?/iu);
  const block = labelled ?? text.match(/(?<!\d)(\d+)\s*-\s*(\d+)(?:\s*-\s*(\d+))?(?!\d)/u);
  return block ? {
    chome: Number(block[1]),
    ...(block[2] ? { ban: Number(block[2]) } : {}),
    ...(block[3] ? { go: Number(block[3]) } : {}),
  } : {};
}

function tokens(value: string): string[] {
  return [...new Set([...withoutUnits(value).toLocaleLowerCase("en-US").matchAll(/[\p{L}]{2,}/gu)]
    .map((match) => match[0]!))].sort();
}

function sameSequence(left: string[], right: string[]): boolean {
  return left.length > 0 && left.length === right.length && left.every((value, index) => value === right[index]);
}

function possibleFloorPostalVariation(left: string, right: string, leftPostal: string, rightPostal: string, units: string[]): boolean {
  if (leftPostal.slice(0, 3) !== rightPostal.slice(0, 3) || units.length !== 1 || !/^\d+F$/u.test(units[0]!)) return false;
  const floor = Number(units[0]!.slice(0, -1));
  // Japan Post can assign a separate high-rise postcode whose last two digits
  // identify the floor.  Treat the mismatch as unresolved, never as proof of
  // address equality.  The caller still needs independent identity evidence.
  const floorPostal = [leftPostal, rightPostal].some((postal) => {
    const buildingBlock = Number(postal.slice(3, 5));
    return buildingBlock >= 50 && buildingBlock <= 79 && Number(postal.slice(-2)) === floor;
  });
  if (!floorPostal) return false;
  const generic = new Set(["japan", "tokyo", "city", "chuo", "minato", "shibuya", "ku", "to"]);
  const rightTokens = new Set(tokens(right));
  return tokens(left).some((token) => token.length >= 5 && !generic.has(token) && rightTokens.has(token));
}

function hasSufficientAddress(value: string): boolean {
  if (streetFields(value).ban === undefined) return false;
  const addressTokens = tokens(value);
  return addressTokens.length >= 2 || /[都道府県].*[市区町村]/u.test(withoutUnits(value));
}

function localityFields(value: string): Record<string, string> {
  const text = withoutUnits(value);
  const prefecture = text.match(/([\p{Script=Han}]{2,3}[都道府県])/u)?.[1];
  const rest = prefecture ? text.slice(text.indexOf(prefecture) + prefecture.length) : text;
  const municipalityMatch = rest.match(/([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]+?[市区町村])/u);
  const municipality = municipalityMatch?.[1];
  const town = municipality && rest.slice(municipalityMatch!.index! + municipality.length).match(/^([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]+)(?=\d)/u)?.[1];
  const city = text.match(/\b([a-z-]+)\s+(?:city|ward)\b/u)?.[1];
  return { ...(prefecture ? { prefecture } : {}), ...(municipality ? { municipality } : {}), ...(town ? { town } : {}), ...(city ? { city } : {}) };
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
  if (!left?.trim() || !right?.trim()) return "INSUFFICIENT";
  const leftUnits = unitTokens(left); const rightUnits = unitTokens(right);
  if (leftUnits.length > 0 && rightUnits.length > 0 && !sameSequence([...new Set(leftUnits)].sort(), [...new Set(rightUnits)].sort())) return "CONFLICT";
  const a = streetFields(left); const b = streetFields(right);
  for (const key of ["chome", "ban", "go"] as const) {
    if (a[key] !== undefined && b[key] !== undefined && a[key] !== b[key]) return "CONFLICT";
  }
  const localA = localityFields(left); const localB = localityFields(right);
  if (Object.keys(localA).some(key => localB[key] !== undefined && localA[key] !== localB[key])) return "CONFLICT";
  const leftPostal = postalCode(left); const rightPostal = postalCode(right);
  if (leftPostal && rightPostal && leftPostal !== rightPostal) {
    return possibleFloorPostalVariation(left, right, leftPostal, rightPostal, leftUnits) ? "INSUFFICIENT" : "CONFLICT";
  }
  if (!hasSufficientAddress(left) || !hasSufficientAddress(right)) return "INSUFFICIENT";
  // Missing street fields are neutral, but cannot prove full address equality.
  if (["chome", "ban", "go"].some(key => a[key as keyof StreetFields] !== b[key as keyof StreetFields])) return "INSUFFICIENT";
  if (leftPostal && leftPostal === rightPostal) return "MATCH";
  if (compact(left) === compact(right)) return "MATCH";
  const leftTokens = tokens(left); const rightTokens = tokens(right);
  if (leftTokens.length > 0 && leftTokens.length === rightTokens.length && leftTokens.every((value, index) => value === rightTokens[index])) return "MATCH";
  return "INSUFFICIENT";
}

/** Compatibility predicate for callers that require only positive proof. */
export function sameCompleteOutletAddress(left: string | undefined, right: string | undefined): boolean {
  return compareCompleteOutletAddress(left, right) === "MATCH";
}
