import { createHash } from "node:crypto";
import type { Page } from "playwright-core";

export interface MarkerMap {
  classes: Record<string, string>;
  ids: Record<string, string>;
  dataAttributes: Record<string, string>;
  testIds: Record<string, string>;
}
export const DOM_MUTATION_RULE = "dom-marker-mutation@2";
export function opaqueMarker(seed: string, kind: string, value: string): string {
  return `g2-${createHash("sha256").update(seed + "\0" + kind + "\0" + value).digest("hex").slice(0, 16)}`;
}

/** Initial red control: F3's class-only transformation, before extending G2. */
export async function renamePrivateMarkers(page: Page, seed: string) {
  const tokens = await page.evaluate(() => [...new Set([...document.querySelectorAll("[class]")].flatMap(node => [...node.classList]))].sort());
  const mapping: MarkerMap = { classes: Object.fromEntries(tokens.map(value => [value, opaqueMarker(seed, "class", value)])), ids: {}, dataAttributes: {}, testIds: {} };
  await page.evaluate(mapping => {
    for (const node of document.querySelectorAll("[class]")) node.setAttribute("class", [...node.classList].map(value => mapping.classes[value]!).join(" "));
  }, mapping);
  return { rule: DOM_MUTATION_RULE, seed, mapping };
}
