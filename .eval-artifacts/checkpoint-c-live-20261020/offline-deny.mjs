// Loaded before Runner imports. No socket is opened, including tsx's optional parent IPC.
import net from 'node:net';
import tls from 'node:tls';
import http from 'node:http';
import https from 'node:https';
import {EventEmitter} from 'node:events';
import {syncBuiltinESMExports} from 'node:module';
import {appendFileSync} from 'node:fs';
const deny=()=>{appendFileSync(process.env.CHECKPOINT_C_ATTEMPT+'/network-denied.jsonl',JSON.stringify({at:new Date().toISOString(),kind:'UNEXPECTED_NETWORK_ATTEMPT',stack:new Error().stack})+'\n');throw Error('OFFLINE_NETWORK_FORBIDDEN');};
const socket=(...args)=>{
 // tsx opportunistically probes a Unix-domain parent pipe even without its CLI.
 // Synthesize ENOENT; do not connect to that pipe or any network address.
 if(typeof args[0]==='string'&&/\/tsx-\d+\/\d+\.pipe$/.test(args[0])){
  const e=new EventEmitter();e.unref=()=>e;queueMicrotask(()=>e.emit('error',Object.assign(new Error('Offline IPC disabled'),{code:'ENOENT'})));return e;
 }
 return deny();
};
net.connect=socket;net.createConnection=socket;net.Socket.prototype.connect=deny;tls.connect=deny;
http.request=deny;http.get=deny;https.request=deny;https.get=deny;globalThis.fetch=deny;
syncBuiltinESMExports();
