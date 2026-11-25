import type { Page } from "playwright-core";
import type { BrowserSnapshot } from "./browser-runtime.js";

/** Passive DOM observation. Reading image attributes never triggers a load. */
export async function observePageImages(page: Page): Promise<NonNullable<BrowserSnapshot["images"]>> {
  return page.locator('img').evaluateAll(nodes=>nodes.filter((node):node is HTMLImageElement=>node instanceof HTMLImageElement).slice(0,150).map(image=>({
    src:(image.getAttribute('src')??'').slice(0,4096),srcset:(image.getAttribute('srcset')??'').slice(0,8192),
    lazySrc:(image.getAttribute('data-src')??image.getAttribute('data-lazy-src')??image.getAttribute('data-original')??'').slice(0,4096),
    currentSrc:image.currentSrc.slice(0,4096),width:image.naturalWidth,height:image.naturalHeight,
  })));
}

/** Passive visible DOM serializer; excludes hidden subtrees without cloning nodes. */
export async function observeVisibleHtml(page: Page, timeoutMs = 5_000): Promise<string> {
  return page.locator("body").evaluate(body => {
    // Cloning an img can trigger a second request even while detached.
    // Serialize the existing tree without constructing any DOM nodes.
    const source = {
      escape(text: string) { return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); },
      read(node: Node): string {
        if (node.nodeType === Node.TEXT_NODE) return this.escape(node.textContent ?? "");
        if (!(node instanceof Element)) return "";
        const style = getComputedStyle(node);
        if (node.matches('script,style,template,noscript,[hidden],[aria-hidden="true"]')
          || style.display === "none" || style.visibility === "hidden") return "";
        const name = node.tagName.toLowerCase();
        const attributes = new Map([...node.attributes].map(attribute => [attribute.name, attribute.value]));
        if (node instanceof HTMLInputElement) {
          attributes.set("value", node.value);
          if (node.checked) attributes.set("checked", ""); else attributes.delete("checked");
        }
        if (node instanceof HTMLOptionElement) {
          if (node.selected) attributes.set("selected", ""); else attributes.delete("selected");
        }
        const tag = `<${name}${[...attributes].map(([key, value]) => ` ${key}="${this.escape(value)}"`).join("")}>`;
        return tag + (/^(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(name)
          ? "" : [...node.childNodes].map(child => this.read(child)).join("") + `</${name}>`);
      },
    };
    return source.read(body);
  }, undefined, { timeout: timeoutMs });
}
