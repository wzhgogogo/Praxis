import { chromium } from "playwright-core";

/** Independent eval reader: source HTML only; page scripts and transport disabled. */
export async function independentPageText(html: string): Promise<string> {
  const browser = await chromium.launch({ headless: true, proxy: { server: "http://127.0.0.1:9" } });
  try {
    const context = await browser.newContext({ javaScriptEnabled: false, serviceWorkers: "block" });
    await context.route("**/*", route => route.abort());
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 10_000 });
    return await page.locator("body").innerText({ timeout: 10_000 });
  } finally { await browser.close(); }
}
