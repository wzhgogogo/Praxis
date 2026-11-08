import assert from 'node:assert/strict';
import{connect}from'node:net';
import{execFileSync}from'node:child_process';
import{createServer,request as send}from'node:http';import{once}from'node:events';
import{readFile,writeFile}from'node:fs/promises';
import{chromium}from'playwright-core';
import{LocalPlaywrightChromium}from'../../../src/infrastructure/browser/local-playwright-chromium.ts';
const root='.eval-artifacts/phase3b/network-path-diagnosis-20261108';
const settings=JSON.parse(await readFile(root+'/effective-routing.json','utf8')).settings;
const hosts=['tablecheck.com','www.tablecheck.com','cdn0.tablecheck.com','search-v4.production.ap-northeast-1.aws.tablecheck.net','tabelog.com','tblg.k-img.com','sub.tblg.k-img.com','proxied.fixture.invalid','tablecheck.com.evil.invalid','nottabelog.com'];
async function exercise(omitCDN){
 const seen=[],proxied=[],launchMetadata={};let origin='',port;
 const receiver=createServer((req,res)=>{const url=new URL(req.url,'http://127.0.0.1');seen.push({host:req.headers.host,path:url.pathname,viaProxy:req.headers['x-fixture-proxy']==='1'});res.setHeader('access-control-allow-origin','*');
  if(url.pathname==='/'){res.setHeader('content-type','text/html');res.end('<body><output>Pending</output><button onclick="Promise.all([fetch(\''+origin+'/data\'),fetch(\'http://proxied.fixture.invalid:'+port+'/data\')]).then(()=>document.querySelector(\'output\').textContent=\'Done\')">Read</button>'+hosts.map((h,i)=>'<script src="http://'+h+':'+port+'/assets/'+i+'.js"></script>').join('')+'</body>');}
  else if(url.pathname.startsWith('/assets/')){res.setHeader('content-type','application/javascript');res.end('window.fixtureLoads=(window.fixtureLoads||0)+1;');}
  else{res.setHeader('content-type','application/json');res.end('{}');}});
 receiver.listen(0,'127.0.0.1');await once(receiver,'listening');port=receiver.address().port;origin='http://127.0.0.1:'+port;
 const proxy=createServer((req,res)=>{const u=new URL(req.url);proxied.push({host:u.hostname,path:u.pathname});const upstream=send({host:'127.0.0.1',port,path:u.pathname,method:req.method,headers:{host:u.host,'x-fixture-proxy':'1'}},incoming=>{res.writeHead(incoming.statusCode,incoming.headers);incoming.pipe(res);});upstream.on('error',()=>res.destroy());req.pipe(upstream);});
 const sockets=new Set();proxy.on('connect',(req,socket,head)=>{proxied.push({host:req.url.split(':')[0],path:'/CONNECT'});const upstream=connect(port,'127.0.0.1',()=>{socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');if(head.length)upstream.write(head);socket.pipe(upstream);upstream.pipe(socket);});sockets.add(socket);sockets.add(upstream);socket.on('close',()=>sockets.delete(socket));upstream.on('close',()=>sockets.delete(upstream));socket.on('error',()=>upstream.destroy());upstream.on('error',()=>socket.destroy());});
 proxy.listen(0,'127.0.0.1');await once(proxy,'listening');const proxyServer='http://127.0.0.1:'+proxy.address().port;
 const staticResources=hosts.map(h=>({origin:'http://'+h+':'+port,pathnamePrefix:'/assets/',methods:['GET'],resourceTypes:['script'],queryKeys:[]}));
 const directHosts=settings.directHosts.filter(h=>!omitCDN||h!=='tblg.k-img.com');
 const runtime=new LocalPlaywrightChromium({proxyServer,directHosts,browserType:{async launch(options){
  const browser=await chromium.launch({...options,args:['--host-resolver-rules='+hosts.map(h=>'MAP '+h+' 127.0.0.1').join(',')]});
  const cdp=await browser.newBrowserCDPSession();const info=await cdp.send('SystemInfo.getProcessInfo');const pid=info.processInfo.find(p=>p.type==='browser').id;const args=execFileSync('ps',['-p',String(pid),'-o','command='],{encoding:'utf8'});launchMetadata.proxyArguments=args.match(/--proxy-[^ ]+/g);launchMetadata.resolverOverride='Fixture-only map of all tested names to loopback';await cdp.detach();
  const create=browser.newContext.bind(browser);browser.newContext=async options=>{const context=await create(options);await context.grantPermissions(['local-network-access'],{origin});return context;};return browser;
 }}});
 let session;try{
  session=await runtime.openSession({signal:AbortSignal.timeout(15000),networkPolicy:{documentOrigins:[origin],staticResources,dynamicReads:[origin,'http://proxied.fixture.invalid:'+port].map(origin=>({origin,pathname:'/data',methods:['GET'],resourceTypes:['fetch','xhr'],queryKeys:[]}))}});
  await session.prepareNavigation(origin+'/',{timeoutMs:5000});await session.navigate(origin+'/',{timeoutMs:5000});
  const controls=await session.observeControls();await session.click(controls.find(c=>c.label==='Read').id);await session.waitForSettled({url:origin+'/',title:'',text:'Pending'},5000);
  const snapshot=await session.snapshot();await writeFile(root+'/local-host-route-partial.json',JSON.stringify({omitCDN,seen,proxied,launchMetadata,requests:snapshot.networkRequests,diagnostics:snapshot.networkDiagnostics,text:snapshot.text},null,2)+'\n');assert.match(snapshot.text,/Done/);
  const proxyScriptHosts=proxied.filter(x=>x.path.startsWith('/assets/')).map(x=>x.host).sort();
  const expected=hosts.filter(h=>['proxied.fixture.invalid','tablecheck.com.evil.invalid','nottabelog.com'].includes(h)||omitCDN&&h.endsWith('tblg.k-img.com')).sort();assert.deepEqual(proxyScriptHosts,expected);
  for(const h of hosts)assert.ok(seen.some(x=>x.host===h+':'+port&&x.path.startsWith('/assets/')),h);
  const scripts=snapshot.networkRequests.filter(r=>r.outcome==='ADMITTED'&&r.resourceType==='script');assert.equal(scripts.length,hosts.length);assert.ok(scripts.every(r=>r.transport==='BROWSER_GET_HEAD'));
  const docsData=snapshot.networkRequests.filter(r=>r.outcome==='ADMITTED'&&['document','fetch','xhr'].includes(r.resourceType));assert.ok(docsData.length>=3);assert.ok(docsData.every(r=>r.transport==='NODE_FETCH'));
  return{mode:omitCDN?'INTENTIONAL_CDN_BYPASS_OMISSION':'CURRENT_SUFFIX_CONFIGURATION',launchMetadata,proxyScriptHosts,expectedProxyHosts:expected,scripts:scripts.length,scriptTransport:'BROWSER_GET_HEAD',documentDataTransport:'NODE_FETCH',seen,passed:true};
 }finally{await session?.close();for(const socket of sockets)socket.destroy();proxy.closeAllConnections();receiver.closeAllConnections();await Promise.all([new Promise(r=>proxy.close(r)),new Promise(r=>receiver.close(r))]);}
}
const result={scope:'Local mapped DNS hosts only; all receivers on loopback. NO source HTTP, model or Live; mappings/permissions fixture-only, no production change.',controls:[]};
for(const omit of[true,false])result.controls.push(await exercise(omit));
await writeFile(root+'/local-host-route.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
