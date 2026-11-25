// Manual mobile interaction fixture only; not recorded-source Replay or Live.
import {createServer,request} from 'node:http';
import {networkInterfaces} from 'node:os';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const {startWorkspaceFixture}=await import(pathToFileURL(resolve('src/harness/workspace-fixture-server.ts')).href);
const host=await startWorkspaceFixture({multiSlot:true,questions:true});
const epoch=host.clock.now().valueOf();
const shim=`<script>const demoStart=performance.now();Date.now=()=>${epoch}+performance.now()-demoStart;if(!crypto.randomUUID)crypto.randomUUID=()=>{const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=bytes[6]&15|64;bytes[8]=bytes[8]&63|128;const s=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');return s.slice(0,8)+'-'+s.slice(8,12)+'-'+s.slice(12,16)+'-'+s.slice(16,20)+'-'+s.slice(20);};</script>`;
const server=createServer((incoming,outgoing)=>{
 const target=new URL(incoming.url||'/',host.baseUrl);
 if(target.origin!==host.baseUrl){outgoing.writeHead(400);outgoing.end();return;}
 const upstream=request(target,{method:incoming.method,headers:incoming.headers},response=>{
  const headers={...response.headers};delete headers['content-length'];
  if(String(headers['content-type']).includes('text/html')){
   const chunks=[];response.on('data',d=>chunks.push(d));response.on('end',()=>{
    const html=Buffer.concat(chunks).toString().replace('<head>','<head>'+shim).replace('<body>','<body><p style="margin:8px 20px;font:13px sans-serif;color:#5F6275">Offline fixture · 2 Nov 2026 · No real availability</p>');
    outgoing.writeHead(response.statusCode||200,headers);outgoing.end(html);
   });
  }else{outgoing.writeHead(response.statusCode||200,headers);response.pipe(outgoing);}
 });
 upstream.on('error',()=>{outgoing.writeHead(502);outgoing.end('Local fixture unavailable');});incoming.pipe(upstream);
});
server.listen(4311,'0.0.0.0',()=>{
 console.log(JSON.stringify({mode:'MANUAL_INTERACTION_FIXTURE',port:4311,addresses:Object.values(networkInterfaces()).flat().filter(x=>x&&x.family==='IPv4'&&!x.internal).map(x=>'http://'+x.address+':4311'),accessToken:'workspace-fixture',realCalls:0}));
});
async function close(){server.close();server.closeAllConnections();await host.close();process.exit(0);}
process.on('SIGINT',()=>void close());process.on('SIGTERM',()=>void close());
