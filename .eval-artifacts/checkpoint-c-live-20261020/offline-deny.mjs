// Loaded before all Runner imports. Unexpected network is an error, never a fallback.
import net from 'node:net';
import tls from 'node:tls';
import http from 'node:http';
import https from 'node:https';
import {syncBuiltinESMExports} from 'node:module';
import {appendFileSync} from 'node:fs';
const deny=()=>{appendFileSync(process.env.CHECKPOINT_C_ATTEMPT+'/network-denied.jsonl',JSON.stringify({at:new Date().toISOString(),kind:'UNEXPECTED_NETWORK_ATTEMPT'})+'\n');throw Error('OFFLINE_NETWORK_FORBIDDEN');};
net.connect=deny;net.createConnection=deny;net.Socket.prototype.connect=deny;tls.connect=deny;
http.request=deny;http.get=deny;https.request=deny;https.get=deny;globalThis.fetch=deny;
syncBuiltinESMExports();
