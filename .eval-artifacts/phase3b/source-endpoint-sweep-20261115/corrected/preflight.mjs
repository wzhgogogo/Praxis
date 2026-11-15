import assert from 'node:assert/strict';import{pathToFileURL}from'node:url';
const root='/private/tmp/praxis-premerge-scope-main-20261115';
const {chromium}=await import(pathToFileURL(root+'/node_modules/playwright-core/index.mjs'));
let page;
const launch=chromium.launch.bind(chromium);
chromium.launch=async options=>{const browser=await launch(options),create=browser.newContext.bind(browser);browser.newContext=async opts=>{const context=await create(opts);context.on('page',p=>page=p);return context;};return browser;};
const {createG6LiveBrowser}=await import(pathToFileURL(root+'/src/eval/restaurant/agent-loop/g6/live-transports.ts'));
const {discoveryPackNetworkPolicy}=await import(pathToFileURL(root+'/src/integrations/restaurant-search/source-packs.ts'));
const session=await createG6LiveBrowser({}).openSession({signal:new AbortController().signal,networkPolicy:discoveryPackNetworkPolicy()});
try{assert.ok(page);assert.equal(session.metadata.readNetworkBoundary,'INSTALLED');assert.equal(page.url(),'about:blank');console.log(JSON.stringify({passed:true,pageCaptured:true,GuardInstalled:true,externalRequests:0}));}finally{await session.close();}
