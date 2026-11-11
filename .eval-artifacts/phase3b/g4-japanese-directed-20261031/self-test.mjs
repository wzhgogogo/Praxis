import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {fetch as nativeFetch} from 'undici';
import {permittedURL,robotsDecision,timedGet} from './transport.mjs';
const google='https://places.googleapis.com/v1/places/example?languageCode=ja';
assert(permittedURL('GOOGLE',google,google));
for(const url of ['https://tabelog.com/en/booking/form_course/new','https://tabelog.com/yoyaku/tabelog_booking/','https://tabelog.com/tokyo/A1/A2/123/','https://tabelog.com/en/login/','https://evil.invalid/en/tokyo/A1/A2/123/','https://tabelog.com/en/tokyo/A1/A2/123/?x=1'])assert(!permittedURL('DETAIL',url,google));
assert(permittedURL('DETAIL','https://tabelog.com/en/tokyo/A1/A2/123/',google));
assert(permittedURL('SEARCH','https://tabelog.com/en/tokyo/rstLst/?sw=fixture',google));
assert(!permittedURL('SEARCH','https://tabelog.com/en/tokyo/rstLst/?sw=x&next=login',google));
const robots='User-agent: *\nDisallow: /en/booking/\nDisallow: /*blocked$\nAllow: /en/booking/help$\n\nUser-agent: GPTBot\nDisallow: /\n';
assert(robotsDecision(robots,'https://tabelog.com/en/tokyo/rstLst/?sw=x').allowed);
assert(!robotsDecision(robots,'https://tabelog.com/en/booking/form_course/new').allowed);
assert(robotsDecision(robots,'https://tabelog.com/en/booking/help').allowed);
assert(!robotsDecision(robots,'https://tabelog.com/en/tokyo/blocked').allowed);
let sent=0,cookieSeen=false;const sockets=new Set();
const server=createServer((req,res)=>{sent++;cookieSeen ||= !!req.headers.cookie;
 if(req.url==='/redirect'){res.writeHead(302,{Location:'/should-not-be-read'});res.end('redirect');}
 else if(req.url==='/body-stall'){res.writeHead(200,{'Content-Type':'text/plain'});res.write('partial');}
 else if(req.url==='/header-stall'){}
 else{res.end('unexpected second request');}
});
server.on('connection',socket=>{sockets.add(socket);socket.on('close',()=>sockets.delete(socket));});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
try{
 const result=await timedGet(base+'/redirect',{fetchImplementation:nativeFetch,headers:{},timeoutMs:1000});
 assert.equal(result.meta.status,302);assert.equal(sent,1);assert.equal(cookieSeen,false);assert(result.complete);
 const body=await timedGet(base+'/body-stall',{fetchImplementation:nativeFetch,headers:{},timeoutMs:150});
 assert(body.meta.headersAtCET);assert.equal(body.meta.bodyCompletedAtCET,null);assert.equal(body.meta.networkFailure.phase,'BODY');assert.equal(body.bytes.toString(),'partial');
 const header=await timedGet(base+'/header-stall',{fetchImplementation:nativeFetch,headers:{},timeoutMs:100});
 assert.equal(header.meta.headersAtCET,null);assert.equal(header.meta.networkFailure.phase,'BEFORE_HEADERS');
 assert.equal(sent,3);
 console.log(JSON.stringify({status:'PASS',mode:'LOCAL_HTTP_AND_PURE_POLICY',redirectFollowed:false,cookieSent:false,deadlineBeforeHeaders:true,deadlineDuringBody:true,sourceCalls:0,envRead:false}));
}finally{for(const s of sockets)s.destroy();await new Promise(resolve=>server.close(resolve));}
