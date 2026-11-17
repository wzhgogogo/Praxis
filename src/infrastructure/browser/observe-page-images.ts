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
