/** Inspect only a source-owned result region, with inherited hidden/irrelevant subtrees excluded. */
export function resultRegionBusy(html: string, region: RegExp, irrelevant: RegExp): boolean {
  const stack: Array<{ name: string; bound: boolean; ignored: boolean; hidden: boolean }> = [];
  const rendered = html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>|<!--[\s\S]*?-->/gi, "");
  for (const match of rendered.matchAll(/<\/?([a-z][\w-]*)\b[^>]*>/gi)) {
    const tag = match[0], name = match[1]!.toLowerCase();
    if (tag.startsWith("</")) { const index = stack.findLastIndex(node => node.name === name); if (index >= 0) stack.splice(index); continue; }
    const parent = stack.at(-1);
    const attributes = tag.replace(/^<\w+|>$/g, "");
    const descriptor = [...attributes.matchAll(/(?:class|id|data-testid|data-result-region)=["']([^"']*)["']/gi)].map(value => value[1]).join(" ");
    const hidden = !!parent?.hidden || /\bhidden(?:\s|=|$)|aria-hidden=["']true["']|display\s*:\s*none|visibility\s*:\s*hidden|\bis-hidden\b/i.test(attributes);
    const ignored = !!parent?.ignored || irrelevant.test(descriptor);
    const bound = !!parent?.bound || region.test(descriptor);
    if (bound && !hidden && !ignored && /aria-busy=["']true["']|data-(?:query|search|result)-(?:state|status)=["']loading["']|(?:class|id)=["'][^"']*(?:skeleton|(?:^|[\s_-])loader|(?:^|[\s_-])loading)[^"']*["']/i.test(attributes)) return true;
    if (!/^(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(name) && !/\/\s*>$/.test(tag)) stack.push({ name, bound, ignored, hidden });
  }
  return false;
}
