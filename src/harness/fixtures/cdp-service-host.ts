import {chromium} from 'playwright-core';
import {CloudflareBrowserRun} from '../../infrastructure/browser/cloudflare-browser-run.js';
import {startWorkspaceFixture} from '../workspace-fixture-server.js';
const endpoint=process.env.PRAXIS_CDP_FIXTURE_ENDPOINT!,pageUrl=process.env.PRAXIS_CDP_FIXTURE_PAGE!;
const config={accountId:'offline',apiToken:'fixture',engineMode:process.env.PRAXIS_CDP_FIXTURE_AUTO==='1'?'AUTO' as const:'CHROMIUM_ONLY' as const,connectTimeoutMs:3000,cdpEndpoint:endpoint,...(process.env.PRAXIS_CDP_BASELINE==='1'?{connectOverCdp:async()=>chromium.connectOverCDP(endpoint,{timeout:3000})}:{})};
const runtime=new CloudflareBrowserRun(config);const reports:unknown[]=[];
const host=await startWorkspaceFixture({beforeSearch:async signal=>{let session:Awaited<ReturnType<typeof runtime.openSession>>|undefined;try{session=await runtime.openSession({signal,networkPolicy:{documentOrigins:[new URL(pageUrl).origin],startupDocuments:[pageUrl],staticResources:[],dynamicReads:[]}});await session.navigate(pageUrl,{timeoutMs:3000});const snapshot=await session.snapshot();if(!snapshot.text.includes('Controlled read succeeded'))throw Error('Actual page missing');reports.push({status:'READ',engine:session.metadata.engine,title:snapshot.title});}catch(error){reports.push({status:'FAILED',code:error&&typeof error==='object'&&'code'in error?error.code:null});throw error;}finally{await session?.close();process.send?.({kind:'reports',reports});}}});
process.send?.({kind:'ready',url:host.baseUrl,uncaughtListeners:process.listenerCount('uncaughtException')});
process.on('message',message=>{if(message==='close')void host.close().then(()=>process.exit(0));if(message==='unrelated')setImmediate(()=>{throw Error('UNRELATED_HOST_ERROR_SENTINEL');});});
