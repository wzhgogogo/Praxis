import type { BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { publicPriceText } from "../restaurant-availability/source-price-facts.js";

function headingKey(text: string): string {
  return text.replace(/\s+/gu, " ").trim().replace(/\s+([?？])/gu, "$1");
}

/**
 * Positive identification only: visible review heading to the next same/higher
 * heading. Duplicate/missing boundaries remain unclassified, never guessed from
 * private class/testid or a fixed element position. This is NOT a universal
 * review detector; the unmarked-content risk belongs in the ADR/evaluation.
 */
export function reviewStatementIndices(snapshot: Pick<BrowserSnapshot, "html" | "text">): Set<number> {
  const headings = [...snapshot.html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1\s*>/giu)]
    .map(match => ({ level: Number(match[1]), key: headingKey(publicPriceText(match[2]!)) }));
  // Same nonblank line sequence as createRestaurantFactSourceDocument. The G1
  // caller checks complete coverage before using these statement indices.
  const lines = snapshot.text.split(/\r?\n/u).map(line => line.trim()).filter(Boolean).map(headingKey);
  const uniqueLine = (key: string): number | undefined => {
    const matches = lines.flatMap((line, index) => line === key ? [index] : []);
    return matches.length === 1 ? matches[0] : undefined;
  };
  const indices = new Set<number>();
  for (let index = 0; index < headings.length; index++) {
    const heading = headings[index]!;
    if (!/^(?:reviews?|customer reviews?|user reviews?|口コミ|クチコミ|お客様の声)[?？]?$/iu.test(heading.key)) continue;
    const next = headings.slice(index + 1).find(other => other.level <= heading.level);
    if (!next) continue;
    const start = uniqueLine(heading.key), end = uniqueLine(next.key);
    if (start === undefined || end === undefined || end <= start) continue;
    for (let line = start; line < end; line++) indices.add(line);
  }
  return indices;
}
