import type { RestaurantQuotedCoursePrice } from "../../domains/restaurant/price-facts.js";

export function publicPriceText(markup: string): string {
  return markup.replace(/<(?:script|style)\b[^>]*>[\s\S]*?<\/(?:script|style)>/gi, "")
    .replace(/<del\b[^>]*>[\s\S]*?<\/del>/gi, "")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&")
    .replace(/&#165;|&yen;/g, "¥").replace(/\s+/g, " ").trim();
}

/** Extract complete, nested source elements without matching a child closing tag. */
export function sourcePriceElements(html: string, accepts: (tag: string) => boolean): string[] {
  const result: string[] = []; const stack: Array<{ name: string; start: number; selected: boolean; hidden: boolean }> = [];
  for (const token of html.matchAll(/<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<\/?[a-z][^>]*>/gi)) {
    const tag = token[0]; if (/^<!--|^<script\b|^<style\b/i.test(tag)) continue;
    const close = tag.match(/^<\/([\w-]+)/);
    if (close) {
      const index = stack.map(item => item.name).lastIndexOf(close[1]!.toLowerCase());
      if (index < 0) continue;
      const item = stack[index]!;
      if (item.selected) result.push(html.slice(item.start, token.index + tag.length));
      stack.length = index; continue;
    }
    const name = tag.match(/^<([\w-]+)/)?.[1]?.toLowerCase();
    if (!name || ["input", "img", "br", "hr", "meta", "link", "source", "wbr"].includes(name) || tag.endsWith("/>")) continue;
    const hidden = Boolean(stack.at(-1)?.hidden) || /\shidden(?:\s|=|>)/i.test(tag) || /aria-hidden=["']true/i.test(tag);
    stack.push({ name, start: token.index, hidden, selected: accepts(tag) && !hidden });
  }
  return result;
}

export function quotedCoursePrice(quote: string, sourceUrl: string, amount: number): RestaurantQuotedCoursePrice | undefined {
  if (!Number.isSafeInteger(amount) || amount <= 0 || !quote) return undefined;
  return { amount, sourceUrl, quote: quote.length <= 1600 ? quote : `${quote.slice(0, 650)} … ${quote.slice(-900)}`,
    tax: /(?:tax\s*(?:excl|not included)|excluding tax|税別)/i.test(quote) ? "EXCLUDED"
      : /(?:tax|税込|税込み)/i.test(quote) && /(?:incl|including|税込)/i.test(quote) ? "INCLUDED" : "UNSPECIFIED",
    meal: /lunch|ランチ|昼食/i.test(quote) && !/dinner|ディナー|夕食/i.test(quote) ? "LUNCH"
      : /dinner|ディナー|夕食/i.test(quote) && !/lunch|ランチ|昼食/i.test(quote) ? "DINNER" : "UNSPECIFIED",
    kind: /add[ -]?on|optional menu|オプション|追加/i.test(quote) ? "ADD_ON"
      : /course|set menu|コース|套餐/i.test(quote) ? "MEAL" : "UNSPECIFIED" };
}
