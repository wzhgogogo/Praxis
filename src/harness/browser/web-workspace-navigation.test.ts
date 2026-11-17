import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium, type Page } from "playwright-core";
import { startWorkspaceFixture } from "../workspace-fixture-server.js";

async function noOverflow(page: Page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
}
async function caseHeader(page: Page) {
  assert.equal(await page.locator('.workspace-head').locator(':scope > *').count(), 1);
  assert.equal(await page.locator('.workspace-head > #case-title').count(), 1);
  assert.equal(await page.locator('.workspace-conditions > #request-conditions + #saved').count(), 1);
  if (await page.locator('#saved-panel').isVisible() || await page.locator('#handoff').isVisible()) { assert.equal(await page.locator('.workspace-conditions').isVisible(), false);assert.equal(await page.locator('#workspace-composer').isVisible(), false);await noOverflow(page);return; }
  const title = await page.locator('#case-title').boundingBox(), chips = await page.locator('#request-conditions').boundingBox(), saved = await page.locator('#saved').boundingBox();
  assert.ok(title && chips && saved);
  assert.ok(chips.y >= title.y + title.height, 'conditions and Saved belong below the title');
  assert.ok(chips.x + chips.width <= saved.x - 7, 'scrolling chips leave Saved unobstructed');
  assert.ok(saved.y < chips.y + chips.height && saved.y + saved.height > chips.y, 'Saved and conditions share a row');
  assert.equal(await page.locator('#saved').evaluate(e => getComputedStyle(e).backgroundColor), 'rgba(0, 0, 0, 0)');
  assert.equal(await page.locator('#saved').evaluate(e => getComputedStyle(e).gap), '5px');
  const row = await page.locator('.workspace-conditions').boundingBox();assert.ok(row);
  assert.ok(Math.abs(saved.x + saved.width - row.x - row.width) < 1, 'Saved ends at the shared header right edge');
  if (await page.locator('#candidate-panel').isVisible()) {
    const card = await page.locator('#candidate-card').boundingBox();assert.ok(card);
    assert.ok(Math.abs(saved.x + saved.width - card.x - card.width) < 1, 'Saved and the result card share a right edge');
  }
  assert.equal(await page.locator('#saved').evaluate(e => getComputedStyle(e).fontWeight), '500');
  assert.equal(await page.locator('#saved').evaluate(e => getComputedStyle(e).paddingRight), '0px');
  assert.equal(await page.locator('#saved-count').evaluate(e => getComputedStyle(e).marginLeft), '0px');
  assert.equal(await page.locator('#saved .saved-icon').getAttribute('viewBox'), '5 3 14 18');
  assert.equal(await page.locator('#saved .saved-icon').evaluate(e => getComputedStyle(e).width), '15px');
  if (page.viewportSize()!.width < 960) {
    assert.equal(await page.locator('#request-conditions').evaluate(e => getComputedStyle(e).flexWrap), 'nowrap');
    assert.equal(await page.locator('#request-conditions').evaluate(e => e.scrollWidth > e.clientWidth), true);
  }
  await noOverflow(page);
}
async function sidebarHeader(page: Page) {
  assert.equal(await page.locator('#plans-brand > #brand + #collapse-plans').count(), 1);
  const brand = await page.locator('#brand').boundingBox(), button = await page.locator('#collapse-plans').boundingBox(), list = await page.locator('#case-list').boundingBox();
  assert.ok(brand && button && list);
  assert.equal(brand.x, 28, 'brand shares the plan text inset');
  assert.ok(Math.abs(button.x + button.width - list.x - list.width) < 1, 'collapse control reaches the selected-row right edge');
  assert.deepEqual([button.width, button.height], [32, 32]);
  assert.equal(await page.locator('#collapse-plans').evaluate(e => getComputedStyle(e).color), 'rgb(95, 98, 117)');
  assert.equal(await page.locator('#collapse-plans svg').evaluate(e => getComputedStyle(e).width), '20px');
  await alignedBrand(page);
}
async function alignedBrand(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  const offset = await page.locator('#brand').evaluate(el => {
    const range = document.createRange();range.selectNodeContents(el.firstChild!);
    const box = range.getBoundingClientRect(), cursor = el.querySelector('.cursor')!.getBoundingClientRect();
    const ctx = document.createElement('canvas').getContext('2d')!;ctx.font = getComputedStyle(el).font;
    const metrics = ctx.measureText('Praxis');
    const baseline = box.y + metrics.fontBoundingBoxAscent;
    return {center:Math.abs(cursor.y + cursor.height / 2 - (baseline + (metrics.actualBoundingBoxDescent - metrics.actualBoundingBoxAscent) / 2)),capHeight:Math.abs(cursor.height-ctx.measureText('P').actualBoundingBoxAscent),baseline:Math.abs(cursor.bottom-baseline)};
  });
  assert.ok(offset.center < 1.2, `brand cursor is optically centered on the glyphs: ${offset.center}px`);
  assert.ok(offset.capHeight < 0.75, `brand cursor must match the capital glyph height: ${offset.capHeight}px`);
  assert.ok(offset.baseline < 0.75, `brand cursor must end on the text baseline: ${offset.baseline}px`);
}
for (const width of [390, 960, 1440]) test(`Workspace navigation ${width}: responsive single-node controls, sidebar and full-height Case`, { timeout: 45_000 }, async () => {
  const host = await startWorkspaceFixture({ multiSlot: true, questions: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce', hasTouch: width < 960 });
  const page = await context.newPage(), errors: string[] = [];
  page.setDefaultTimeout(10_000);page.on('pageerror', error => errors.push(error.message));
  try {
    await page.clock.install({ time: host.clock.now() });await page.goto(host.baseUrl);await page.locator('#login').waitFor();
    // Login is centered in the full viewport, without the hidden app's sidebar offset.
    const login = await page.locator('#login').boundingBox();assert.ok(login);
    assert.ok(Math.abs(login.x + login.width / 2 - width / 2) < 1);
    await page.getByLabel('Access token', { exact: true }).fill('workspace-fixture');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();await page.locator('#home').waitFor();
    assert.equal(await page.locator('#brand').count(), 1);assert.equal(await page.locator('#new-case').count(), 1);
    await alignedBrand(page);await noOverflow(page);
    if (width >= 960) {
      const plans = await page.locator('#plans').boundingBox();assert.ok(plans);
      assert.deepEqual([plans.x, plans.y, plans.width, plans.height], [0, 0, 224, 844]);
      assert.equal(await page.locator('#topbar').isVisible(), true);
      assert.equal(await page.locator('#topbar').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
      assert.equal(await page.locator('#plans #brand').count(), 1);assert.equal(await page.locator('#topbar #new-case').count(), 1);
      const newPlan=await page.locator('#new-case').boundingBox();assert.ok(newPlan);assert.equal(newPlan.x+newPlan.width,width-24);
      await page.evaluate(() => { (window as any).__originalBrand = document.getElementById('brand');(window as any).__originalNew = document.getElementById('new-case'); });
      await sidebarHeader(page);
      const collapse = await page.locator('#collapse-plans').boundingBox();assert.ok(collapse);
      await page.locator('#message').fill('Keep this draft');await page.locator('#collapse-plans').click();
      const expand = await page.locator('#menu').boundingBox();assert.ok(expand);
      assert.deepEqual([expand.width, expand.height], [32, 32]);assert.equal(await page.locator('#menu').evaluate(e => getComputedStyle(e).color), 'rgb(95, 98, 117)');assert.equal(await page.locator('#menu .sidebar-open-icon').evaluate(e => getComputedStyle(e).width), '20px');
      assert.ok(Math.abs(collapse.y + collapse.height / 2 - expand.y - expand.height / 2) < 1, 'sidebar switch stays on the same visual baseline');
      assert.equal(await page.locator('#plans').isVisible(), false);assert.equal(await page.locator('#plans').evaluate(e => (e as HTMLElement).inert), true);
      assert.equal(await page.locator('#topbar').evaluate(e => getComputedStyle(e).backgroundColor), 'rgba(0, 0, 0, 0)');
      assert.equal(await page.locator('body').evaluate(e => getComputedStyle(e).paddingLeft), '0px');
      assert.equal(await page.locator('#message').inputValue(), 'Keep this draft');await alignedBrand(page);
      await page.locator('#new-case').click();assert.equal(await page.locator('#message').inputValue(),'');assert.equal(await page.locator('#home').isVisible(),true);assert.equal(await page.locator('#plans').isVisible(),false,'New plan remains independently usable with the sidebar collapsed');
      await page.locator('#menu').click();assert.equal(await page.locator('#plans').isVisible(), true);
      assert.equal(await page.evaluate(() => (window as any).__originalBrand === document.getElementById('brand') && (window as any).__originalNew === document.getElementById('new-case')), true);
      assert.equal(await page.locator('#new-case').evaluate(e => getComputedStyle(e).backgroundColor), 'rgba(0, 0, 0, 0)');
      await page.locator('#new-case').click();assert.equal(await page.locator('#message').inputValue(), '');
    } else {
      assert.equal((await page.locator('#topbar').boundingBox())!.height, 64);
      assert.equal(await page.locator('#topbar').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
      assert.equal(await page.locator('#topbar').evaluate(e=>getComputedStyle(e).borderBottomWidth),'0px');
      assert.equal(await page.locator('#topbar #brand').count(), 1);assert.equal(await page.locator('#topbar #new-case').count(), 1);
      await page.locator('#message').fill('Keep my drawer draft');
      await page.evaluate(() => { (window as any).__mobileBrand = document.getElementById('brand'); });
      await page.locator('#menu').click();assert.equal(await page.locator('#plans').isVisible(), true);
      const drawer = await page.locator('#plans').boundingBox(), backdrop = await page.locator('#backdrop').boundingBox();assert.ok(drawer && backdrop);
      assert.deepEqual([drawer.x, drawer.y, drawer.width, drawer.height], [0, 0, 264, 844]);
      assert.deepEqual([backdrop.x, backdrop.y, backdrop.width, backdrop.height], [0, 0, width, 844]);
      assert.equal(await page.evaluate(() => document.elementFromPoint(innerWidth - 4, 12)?.id), 'backdrop', 'the scrim covers the topbar too');
      await sidebarHeader(page);assert.equal(await page.locator('#menu').getAttribute('aria-expanded'), 'true');
      const close = await page.locator('#collapse-plans').boundingBox();assert.ok(close);
      assert.equal(await page.evaluate(({ x, y, height }) => document.elementFromPoint(x - 5, y + height / 2)?.id, close), 'collapse-plans', '32px visual control keeps a 44px touch target');
      await page.mouse.click(close.x - 5, close.y + close.height / 2);assert.equal(await page.locator('#plans').isVisible(), false);
      assert.equal(await page.locator('#topbar #brand').count(), 1);assert.equal(await page.evaluate(() => (window as any).__mobileBrand === document.getElementById('brand')), true);
      await page.locator('#menu').click();await page.locator('#backdrop').click({ position: { x: width - 4, y: 12 } });
      assert.equal(await page.locator('#plans').isVisible(), false);assert.equal(await page.locator('#message').inputValue(), 'Keep my drawer draft');
      await page.locator('#menu').click();await page.keyboard.press('Escape');
      assert.equal(await page.locator('#plans').isVisible(), false);assert.equal(await page.locator('#backdrop').isVisible(), false);
      assert.equal(await page.locator('#menu').evaluate(e => e === document.activeElement), true);
      await page.locator('#topbar').evaluate(e => e.classList.add('scrolled'));assert.equal(await page.locator('#topbar').evaluate(e => getComputedStyle(e).boxShadow), 'none');await page.locator('#topbar').evaluate(e => e.classList.remove('scrolled'));
    }
    await page.locator('#message').fill('Dinner in ginza');await page.locator('#send').click();
    await page.waitForFunction(() => document.getElementById('card-counter')?.textContent === '1 of 3');
    // Same titles must still identify one current Case; old visited rows cannot stay active.
    const plans = [await page.locator('.case-link.active').getAttribute('data-case-id')];
    for (let i = 0; i < 2; i++) {
      await page.locator('#new-case').click();await page.locator('#home').waitFor();assert.equal(await page.locator('.case-link.active').count(), 0);
      await page.locator('#message').fill('Dinner in ginza');await page.locator('#send').click();await page.locator('#candidate-panel').waitFor();await page.waitForFunction(() => document.getElementById('card-counter')?.textContent === '1 of 3');
      plans.push(await page.locator('.case-link.active').getAttribute('data-case-id'));
    }
    assert.equal(new Set(plans).size, 3);assert.deepEqual(await page.locator('.case-link span').allTextContents(), ['Dinner in ginza', 'Dinner in ginza', 'Dinner in ginza']);
    for (const id of [plans[0], plans[1], plans[2], plans[0]]) {
      if (width < 960) await page.locator('#menu').click();
      await page.locator('.case-link[data-case-id="' + id + '"]').click();
      await page.waitForFunction(id => document.getElementById('case-workspace')?.dataset.caseId === id, id);
      assert.deepEqual(await page.locator('.case-link.active').evaluateAll(rows => rows.map(row => (row as HTMLElement).dataset.caseId)), [id], 'only the current Case is highlighted');
    }
    const scroller = await page.locator('#case-workspace').boundingBox();assert.ok(scroller);
    assert.equal(scroller.y, width >= 960 ? 76 : 86);
    if(width>=960){const saved=await page.locator('#saved').boundingBox(),create=await page.locator('#new-case').boundingBox();assert.ok(saved&&create);assert.ok(saved.y>=create.y+create.height+12,'top-right New plan cannot cover Saved');}
    await caseHeader(page);
    if(width<960)await page.locator('#menu').click();
    const heading=await page.locator('#plans-heading h2').boundingBox(),plan=await page.locator('.case-link.active span').boundingBox();assert.ok(heading&&plan);assert.ok(Math.abs(heading.x-plan.x)<1,'My plans and plan titles align');
    assert.equal(await page.locator('#plans-heading h2').evaluate(e => getComputedStyle(e).fontSize), '12px');
    assert.equal(await page.locator('#plans-heading h2').evaluate(e => getComputedStyle(e).color), 'rgb(95, 98, 117)');
    assert.equal(await page.locator('#plans-heading h2').evaluate(e => getComputedStyle(e).fontWeight), '500');assert.equal(await page.locator('#plans-heading').evaluate(e => getComputedStyle(e).marginBottom), '6px');await sidebarHeader(page);
    for (const icon of ['#collapse-plans svg', '#menu .sidebar-open-icon']) assert.equal(await page.locator(icon + ' rect').getAttribute('rx'), '4');
    assert.equal(await page.locator('#collapse-plans svg path').getAttribute('d'),'M9 3v18');assert.equal(await page.locator('#menu .sidebar-open-icon path').getAttribute('d'),'M9 3v18');
    if(width<960)await page.locator('#collapse-plans').click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollHeight), 844);await noOverflow(page);
    await page.locator('#message').fill('Preserved while navigating');
    if (width >= 960) {
      await page.locator('#collapse-plans').click();await page.locator('#menu').click();
      assert.equal(await page.locator('#message').inputValue(), 'Preserved while navigating');
      await page.locator('#collapse-plans').click();await page.reload();await page.locator('#candidate-panel').waitFor();
      assert.equal(await page.locator('#plans').isVisible(), true, 'a fresh load defaults to expanded');
      // Cross the live breakpoint; the original brand returns to the mobile topbar; New plan stays in its single node.
      await page.setViewportSize({ width: 390, height: 844 });await page.locator('#topbar #brand').waitFor();
      assert.equal(await page.locator('#topbar #new-case').count(), 1);assert.equal(await page.locator('#topbar #brand').count(), 1);
      await page.locator('#menu').click();await page.locator('.case-link.active').click();await page.locator('#plans').waitFor({ state: 'hidden' });
      assert.equal(await page.locator('#plans').isVisible(), false);await noOverflow(page);
      await page.setViewportSize({ width, height: 844 });await page.locator('#plans #brand').waitFor();assert.equal(await page.locator('#topbar #new-case').count(), 1);
    }
    await page.locator('#details-button').click();await page.locator('#details').waitFor();await caseHeader(page);
    await page.locator('#details-back').click();await page.locator('#saved').click();await page.locator('#saved-panel').waitFor();await caseHeader(page);
    await page.locator('#saved-back').click();await page.locator('#choose').click();await page.locator('#handoff').waitFor();await caseHeader(page);
    assert.equal(await page.evaluate(() => document.documentElement.scrollHeight), 844);
    await page.locator('#new-case').click();await page.locator('#home').waitFor();await noOverflow(page);assert.deepEqual(errors, []);
  } finally { await context.close();await browser.close();await host.close(); }
});

async function geometryBox(page: Page, selector: string) {
  const box = await page.locator(selector).first().boundingBox();assert.ok(box, selector + ' is visible');return box;
}
function withinPixel(actual: number, expected: number, label: string) {assert.ok(Math.abs(actual - expected) < 1, `${label}: ${actual} vs ${expected}`);}
async function sameGrid(page: Page, selectors: string[]) {
  const edge = await geometryBox(page, '.workspace-head');
  for (const selector of selectors) {const box = await geometryBox(page, selector);withinPixel(box.x, edge.x, selector + ' left');withinPixel(box.x + box.width, edge.x + edge.width, selector + ' right');}
  if (page.viewportSize()!.width === 390) {withinPixel(edge.x, 20, 'mobile grid left');withinPixel(edge.x + edge.width, 370, 'mobile grid right');}
  else withinPixel(edge.width, 612, 'desktop content grid');
  await noOverflow(page);
}
async function centered(page: Page, first: string, second: string) {
  const a = await geometryBox(page, first), b = await geometryBox(page, second);withinPixel(a.y + a.height / 2, b.y + b.height / 2, first + '/' + second + ' center');
}
async function revealControl(page: Page, selector: string) {
  await page.locator(selector).first().scrollIntoViewIfNeeded();
  await page.locator('#case-workspace').evaluate((scroller, selector) => {
    if ((scroller as HTMLElement).hidden) return;
    const control = document.querySelector(selector)!.getBoundingClientRect(), composer = document.getElementById('workspace-composer')!;
    const bottom = Math.min(scroller.getBoundingClientRect().bottom, composer.hidden ? innerHeight : composer.getBoundingClientRect().top - 12);
    if (control.bottom > bottom) scroller.scrollTop += control.bottom - bottom + 12;
  }, selector);
}
async function pointerControl(page: Page, selector: string, touch: boolean) {
  if (await page.locator('#message').isVisible()) await page.locator('#message').focus();
  await revealControl(page, selector);
  if (touch) await page.locator(selector).first().tap();else await page.locator(selector).first().click();
  assert.equal(await page.evaluate(() => document.activeElement?.matches(':focus-visible') ?? false), false, selector + ' pointer action leaves no keyboard ring');
}
async function proseTypography(page: Page) {
  for (const node of await page.locator('.muted,#recommendation,#details-content,#handoff-terms,#messages,#question-result,#asked-result,.hint,#error,#login p').all()) if(await node.isVisible()) {
    const ratio=await node.evaluate(e=>{const s=getComputedStyle(e);return parseFloat(s.lineHeight)/parseFloat(s.fontSize);});assert.ok(Math.abs(ratio-1.55)<.02,'prose leading '+await node.getAttribute('id'));
  }
  for(const node of await page.locator('h1:visible,h2:visible,h3:visible').all()) {const ratio=await node.evaluate(e=>{const s=getComputedStyle(e);return parseFloat(s.lineHeight)/parseFloat(s.fontSize);});assert.ok(ratio>=1.24&&ratio<=1.31,'heading leading');}
}
async function controlTypography(page: Page) {
  for (const selector of ['#new-case', '.view-back', '#end-saved', '#end-adjust', '#empty-adjust', '#saved', '#details-button']) {
    for (const node of await page.locator(selector).all()) if (await node.isVisible()) {
      const style = await node.evaluate(e => {const s = getComputedStyle(e);return {size:s.fontSize,weight:s.fontWeight,line:parseFloat(s.lineHeight)/parseFloat(s.fontSize)};});
      assert.equal(style.size, '13px', selector);assert.equal(style.weight, '500', selector);assert.ok(Math.abs(style.line - 1.4) < .02, selector + ' control leading');
    }
  }
  for (const node of await page.locator('.primary:visible').all()) {const id=await node.getAttribute('id');if(id)await revealControl(page,'#'+id);await node.hover();assert.equal(await node.evaluate(e => getComputedStyle(e).textDecorationLine), 'none', 'primary has no hover underline');}
  await page.locator('#brand').hover();assert.equal(await page.locator('#brand').evaluate(e => getComputedStyle(e).textDecorationLine), 'none');await proseTypography(page);
}
async function geometryCapture(page: Page, width: number, stage: string) {
  const folder = process.env.PRAXIS_WORKSPACE_VISUAL_OUTPUT;if (!folder) return;await mkdir(folder, { recursive: true });
  await page.mouse.move(page.viewportSize()!.width - 2, 2);await page.screenshot({ path: join(folder, `geometry-${width}-${stage}.png`), animations: 'disabled' });
}
async function geometrySides(page: Page, width: number, stage: 'home'|'details') {
  if(width>=960){await geometryCapture(page,width,stage+'-expanded');await pointerControl(page,'#collapse-plans',false);if(stage==='details')await sameGrid(page,['#details','#workspace-composer']);await geometryCapture(page,width,stage+'-collapsed');await pointerControl(page,'#menu',false);}
  else {await geometryCapture(page,width,stage+'-collapsed');await pointerControl(page,'#menu',true);await geometryCapture(page,width,stage+'-expanded');await pointerControl(page,'#collapse-plans',true);}
}
for (const width of [390, 960, 1440]) test(`Workspace geometry ${width}: shared grid, typography, pointer and keyboard invariants in every view`, { timeout: 60_000 }, async () => {
  const options: {multiSlot:boolean;questions:boolean;naturalRecommendation:boolean;outcome?:'empty'} = {multiSlot:true,questions:true,naturalRecommendation:true}, host = await startWorkspaceFixture(options);
  const browser = await chromium.launch({headless:true}), context = await browser.newContext({viewport:{width,height:844},hasTouch:width===390,reducedMotion:'reduce'});
  await context.tracing.start({screenshots:true,snapshots:true,sources:false});const page = await context.newPage(), errors:string[]=[];let stage='login';page.setDefaultTimeout(10_000);page.on('pageerror',e=>errors.push(e.message));
  try {
    await page.clock.install({time:host.clock.now()});await page.goto(host.baseUrl);await page.locator('#login').waitFor();
    const login = await geometryBox(page, '#login');await proseTypography(page);if(width===390){assert.ok(login.x>=20);assert.ok(width-login.x-login.width>=20);}
    await geometryCapture(page,width,stage);
    await page.getByLabel('Access token',{exact:true}).fill('workspace-fixture');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('#home').waitFor();await page.evaluate(()=>document.fonts.ready);
    stage='home';await centered(page,'#message','#send');
    if(width===390){const menu=await geometryBox(page,'#menu'),create=await geometryBox(page,'#new-case');withinPixel(menu.x,20,'mobile menu');withinPixel(create.x+create.width,370,'mobile new plan');}
    assert.equal(await page.locator('#menu .drawer-icon').count(),0);assert.equal(await page.locator('body').evaluate(e=>getComputedStyle(e).lineHeight),'22.5px');
    if(width>=960)await pointerControl(page,'#collapse-plans',false);
    await pointerControl(page,'#menu',width===390);
    const brand=await geometryBox(page,'#brand'),heading=await geometryBox(page,'#plans-heading h2'),profile=await geometryBox(page,'#profile summary');withinPixel(heading.x,brand.x,'sidebar heading');withinPixel(profile.x,brand.x,'sidebar profile');
    for(const selector of ['#menu','#collapse-plans']){const style=await page.locator(selector).evaluate(e=>{const s=getComputedStyle(e);return{width:s.width,height:s.height,color:s.color,background:s.backgroundColor};});assert.deepEqual([style.width,style.height,style.color],['32px','32px','rgb(95, 98, 117)']);if(width===390)assert.equal(style.background,'rgba(0, 0, 0, 0)','touch has no sticky hover fill');}
    await pointerControl(page,'#collapse-plans',width===390);await page.locator('#menu').focus();await page.keyboard.press('Space');assert.equal(await page.locator('#collapse-plans').evaluate(e=>e.matches(':focus-visible')),true,'keyboard opening keeps focus ring');
    if(width===390)await page.keyboard.press('Escape');else await pointerControl(page,'#collapse-plans',false);
    if(width>=960)await pointerControl(page,'#menu',false);await alignedBrand(page);await controlTypography(page);await geometryCapture(page,width,stage);await geometrySides(page,width,'home');
    await page.locator('#message').fill('Dinner in ginza');await page.locator('#send').click();await page.locator('#candidate-panel').waitFor();await page.waitForFunction(()=>document.getElementById('card-counter')?.textContent==='1 of 3');
    stage='candidates';await sameGrid(page,['.workspace-conditions','#candidate-panel','#candidate-card','#workspace-composer']);await centered(page,'#request-conditions>button','#saved');await centered(page,'#message','#send');
    if(width===390)await pointerControl(page,'#menu',true);
    for(const row of await page.locator('.case-link span').all())withinPixel((await row.boundingBox())!.x,(await geometryBox(page,'#brand')).x,'sidebar plan');
    withinPixel((await geometryBox(page,'#profile summary')).x,(await geometryBox(page,'#brand')).x,'profile baseline');if(width===390)await pointerControl(page,'#collapse-plans',true);
    await geometryCapture(page,width,stage);await controlTypography(page);
    await pointerControl(page,'.slot-time[data-offer-id]:nth-child(2)',width===390);assert.equal(await page.locator('.slot-time[aria-pressed=true]').textContent(),'19:30');
    await revealControl(page,'.slot-time:nth-child(2)');await page.locator('.slot-time:nth-child(2)').focus();await page.keyboard.press('Space');assert.equal(await page.locator('.slot-time[aria-pressed=true]').evaluate(e=>e.matches(':focus-visible')),true,'keyboard time selection restores focused option');
    await pointerControl(page,'#bookmark',width===390);await page.waitForFunction(()=>document.getElementById('saved-count')?.textContent==='1');
    stage='condition-edit';await page.locator('#case-workspace').evaluate(e=>e.scrollTop=0);await page.getByRole('button',{name:'Tokyo',exact:true}).click();
    const editor=await geometryBox(page,'.condition-editor'),strip=await geometryBox(page,'#request-conditions');if(width===390){assert.ok(editor.y>=strip.y+1);assert.ok(editor.y+editor.height<=strip.y+strip.height-1,'editor border fits the scroll clip');}
    await geometryCapture(page,width,stage);await pointerControl(page,'.editor-cancel',width===390);
    await page.getByRole('button',{name:'Tokyo',exact:true}).focus();await page.keyboard.press('Enter');await page.locator('.editor-cancel').focus();await page.keyboard.press('Space');assert.equal(await page.getByRole('button',{name:'Tokyo',exact:true}).evaluate(e=>e.matches(':focus-visible')),true,'keyboard cancel restores the condition button');
    const hot=await geometryBox(page,'#details-button');assert.ok(hot.height<44,'About has a compact visual box');
    const target=await page.evaluate(({x,y,width})=>document.elementFromPoint(x+width/2,y-8)?.closest('#details-button')?.id,hot);assert.equal(target,'details-button','About extended touch target is real');
    stage='details';await revealControl(page,'#details-button');await page.locator('#details-button').click();await page.locator('#details').waitFor();await sameGrid(page,['.workspace-conditions','#details','#workspace-composer']);await centered(page,'#message','#send');await controlTypography(page);await geometryCapture(page,width,stage);await geometrySides(page,width,'details');
    stage='answer';await page.locator('#message').fill('Is a credit card required?');await page.locator('#send').click();await page.locator('#answer-sheet').waitFor();await sameGrid(page,['#details','#workspace-composer','#answer-sheet']);assert.equal(await page.locator('#answer-place').evaluate(e=>getComputedStyle(e).fontSize),'20px');await proseTypography(page);await geometryCapture(page,width,stage);await page.keyboard.press('Escape');
    await page.locator('#details-back').click();await page.locator('#saved').click();stage='saved';await page.locator('#saved-panel').waitFor();await sameGrid(page,['#saved-panel']);assert.equal(await page.locator('.workspace-conditions').isVisible(),false);assert.equal(await page.locator('#workspace-composer').isVisible(),false);await controlTypography(page);await geometryCapture(page,width,stage);await page.locator('#saved-back').click();
    await revealControl(page,'#next');await page.locator('#next').click();await revealControl(page,'#previous');await page.locator('#previous').click();assert.equal(await page.locator('.slot-time[aria-pressed=true]').textContent(),'19:00','switching restaurants clears the previous slot choice');
    stage='handoff';await revealControl(page,'#choose');await page.locator('#choose').click();await page.locator('#handoff').waitFor();await sameGrid(page,['#handoff']);assert.equal(await page.locator('.workspace-conditions').isVisible(),false);assert.equal(await page.locator('#workspace-composer').isVisible(),false);await controlTypography(page);await geometryCapture(page,width,stage);await page.locator('#handoff-back').click();assert.equal(await page.locator('#workspace-composer').isVisible(),true);
    for(let i=0;i<3;i++){await revealControl(page,'#next');await page.locator('#next').click();}stage='batch-end';await page.locator('#batch-end').waitFor();await sameGrid(page,['#batch-end','#workspace-composer']);await controlTypography(page);await geometryCapture(page,width,stage);
    options.outcome='empty';await page.locator('#new-case').click();await page.locator('#message').fill('Dinner with no matching result');await page.locator('#send').click();stage='empty';await page.locator('#empty-state').waitFor();await sameGrid(page,['#empty-state','#workspace-composer']);await controlTypography(page);await geometryCapture(page,width,stage);assert.deepEqual(errors,[]);
  } catch(error) {
    const output=await mkdtemp(join(tmpdir(),'praxis-web-geometry-'));await page.screenshot({path:join(output,'failure.png')}).catch(()=>{});await context.tracing.stop({path:join(output,'trace.zip')}).catch(()=>{});await writeFile(join(output,'state.json'),JSON.stringify({width,stage,errors}));console.log('GEOMETRY_FAILURE '+JSON.stringify({width,stage,output}));throw error;
  } finally {await context.close();await browser.close();await host.close();}
});
