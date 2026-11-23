import {createServer} from 'node:http';
import type {Duplex} from 'node:stream';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {chromium} from 'playwright-core';
type Mode='HEALTHY'|'INIT'|'READ';
function latch(){let resolve!:()=>void;const promise=new Promise<void>(r=>{resolve=r;});return{promise,resolve};}
/** Minimal test-only RFC6455 endpoint. Every CDP reply comes from real installed Chromium. */
class Wire {
 private buffer=Buffer.alloc(0);private fragments:Buffer[]=[];
 constructor(private socket:Duplex,private receive:(text:string)=>void){socket.on('data',(b:Buffer)=>this.feed(b));socket.on('error',()=>{});}
 feed(b:Buffer){this.buffer=Buffer.concat([this.buffer,b]);while(this.buffer.length>=2){const first=this.buffer[0]!,second=this.buffer[1]!;let n=second&127,offset=2;if(n===126){if(this.buffer.length<4)return;n=this.buffer.readUInt16BE(2);offset=4;}else if(n===127){if(this.buffer.length<10)return;n=Number(this.buffer.readBigUInt64BE(2));offset=10;}if(n>16_000_000){this.socket.destroy();return;}const masked=!!(second&128);if(this.buffer.length<offset+(masked?4:0)+n)return;const mask=this.buffer.subarray(offset,offset+4);if(masked)offset+=4;const body=Buffer.from(this.buffer.subarray(offset,offset+n));this.buffer=this.buffer.subarray(offset+n);if(masked)for(let i=0;i<body.length;i++)body[i]=body[i]!^mask[i%4]!;const op=first&15;if(op===8){this.socket.end();return;}if(op===9){this.send(body,10);continue;}if(op===1||op===0){this.fragments.push(body);if(first&128){this.receive(Buffer.concat(this.fragments).toString());this.fragments=[];}}}}
 send(text:string|Buffer,op=1){const b=Buffer.isBuffer(text)?text:Buffer.from(text);const h=Buffer.alloc(b.length<126?2:b.length<65536?4:10);h[0]=128|op;if(h.length===2)h[1]=b.length;else if(h.length===4){h[1]=126;h.writeUInt16BE(b.length,2);}else{h[1]=127;h.writeBigUInt64BE(BigInt(b.length),2);}if(!this.socket.destroyed)this.socket.write(Buffer.concat([h,b]));}
}
export async function loopbackCdp(){
 const folder=await mkdtemp(join(tmpdir(),'praxis-cdp-fault-')),child=spawn(chromium.executablePath(),['--headless','--no-sandbox','--no-proxy-server','--disable-background-networking','--disable-component-update','--remote-debugging-port=0','--remote-debugging-address=127.0.0.1','--user-data-dir='+folder,'about:blank'],{stdio:['ignore','ignore','pipe']});
 let stderr='';const endpoint=await new Promise<string>((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Local Chromium CDP startup timed out')),10000);child.once('exit',()=>{clearTimeout(timer);reject(Error('Local Chromium exited'));});child.stderr.on('data',b=>{stderr+=String(b);const match=stderr.match(/DevTools listening on (ws:\/\/127\.0\.0\.1:[^\s]+)/);if(match){clearTimeout(timer);resolve(match[1]!);}});});
 const queue:Mode[]=[],sockets=new Set<Duplex>(),upstreams=new Set<WebSocket>(),events:Array<{connection:number;mode:Mode;event:string}>=[];let count=0,held:(()=>void)|undefined,waiting=latch();
 const server=createServer((_q,r)=>{r.setHeader('content-type','text/html');r.end('<title>Healthy CDP source</title><h1>Controlled read succeeded</h1>');});
 server.on('upgrade',(request,socket,head)=>{
  sockets.add(socket);socket.on('close',()=>sockets.delete(socket));const key=request.headers['sec-websocket-key']!;socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64')+'\r\n\r\n');
  const connection=++count,mode=queue.shift()??'HEALTHY';events.push({connection,mode,event:'CONNECTED'});const upstream=new WebSocket(endpoint);upstreams.add(upstream);let attachment:string|undefined,faulted=false,navigated=false;const pending:string[]=[];
  const forward=(text:string)=>{if(upstream.readyState===WebSocket.OPEN)upstream.send(text);else pending.push(text);};
  const wire=new Wire(socket,text=>{const message=JSON.parse(text) as {method?:string};if(message.method==='Page.navigate')navigated=true;if(mode==='READ'&&navigated&&!faulted&&attachment&&message.method==='Runtime.callFunctionOn'){faulted=true;held=()=>{events.push({connection,mode,event:'DUPLICATE_DURING_READ'});wire.send(attachment!);forward(text);};waiting.resolve();return;}forward(text);});if(head.length)wire.feed(head);
  upstream.addEventListener('open',()=>{for(const text of pending.splice(0))upstream.send(text);});
  upstream.addEventListener('message',event=>{const text=String(event.data),message=JSON.parse(text) as {method?:string;params?:{targetInfo?:{type?:string}}};wire.send(text);if(message.method==='Target.attachedToTarget'&&message.params?.targetInfo?.type==='page'){attachment=text;if(mode==='INIT'&&!faulted){faulted=true;events.push({connection,mode,event:'DUPLICATE_DURING_INIT'});wire.send(text);}}});
  upstream.addEventListener('close',()=>{upstreams.delete(upstream);socket.end();});upstream.addEventListener('error',()=>socket.destroy());socket.on('close',()=>upstream.close());
 });server.listen(0,'127.0.0.1');await once(server,'listening');const origin='http://127.0.0.1:'+(server.address() as import('node:net').AddressInfo).port;
 return {endpoint:origin.replace('http:','ws:')+'/devtools',page:origin+'/page',events,plan(...modes:Mode[]){queue.push(...modes);},waitForRead(){return Promise.race([waiting.promise,new Promise<never>((_,reject)=>{const timer=setTimeout(()=>reject(Error('No held CDP read')),10000);timer.unref();})]);},releaseRead(){held?.();held=undefined;waiting=latch();},async close(){held?.();for(const u of upstreams)u.close();for(const s of sockets)s.destroy();server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));child.kill('SIGTERM');if(child.exitCode===null&&child.signalCode===null)await once(child,'exit');await rm(folder,{recursive:true,force:true});}};
}
