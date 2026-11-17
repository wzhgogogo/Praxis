import {readFileSync,writeFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
import {userInfo} from 'node:os';
import {spawn} from 'node:child_process';
import pg from 'pg';
export const envPath='/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.env';
export const parsed=parseEnv(readFileSync(envPath,'utf8'));
export const target={protocol:'postgresql:',host:'127.0.0.1',port:5432,database:'praxis_smoke',accountSource:'local system account'};
export const connection=`postgresql://${encodeURIComponent(userInfo().username)}@127.0.0.1:5432/praxis_smoke`;
export const foundation=Object.fromEntries(['PATH','HOME','TMPDIR'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
const sensitive=Object.entries(parsed).filter(([k,v])=>v&&/KEY|TOKEN|SECRET|PASSWORD|DATABASE_URL|PILOT_ACCESS_JSON|PROXY/.test(k)).map(([,v])=>v);
sensitive.push(connection);
for(const v of [...sensitive]){try{const u=new URL(v);if(u.username)sensitive.push(decodeURIComponent(u.username));if(u.password)sensitive.push(decodeURIComponent(u.password));}catch{}}
export const login=parsed.PRAXIS_PILOT_ACCESS_JSON?JSON.parse(parsed.PRAXIS_PILOT_ACCESS_JSON)[0].accessToken:'praxis-fixture-a';sensitive.push(login);
export function redact(s){let r=String(s);for(const v of sensitive.filter(Boolean).sort((a,b)=>b.length-a.length))r=r.split(v).join('[REDACTED]');return r.replace(/postgres(?:ql)?:\/\/[^\s"']+/g,'[REDACTED_DATABASE_URL]');}
export function scrub(v){if(v instanceof Date)return v.toISOString();if(typeof v==='string')return redact(v);if(Array.isArray(v))return v.map(scrub);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).filter(([k])=>!/^(authorization|cookie|set-cookie|accesstoken|sessiontoken|apikey|password|secret|credential|headers)$/i.test(k)).map(([k,x])=>[k,scrub(x)]));return v;}
export function save(path,value){writeFileSync(path,JSON.stringify(scrub(value),null,2)+'\n');}
export const client=(database=target.database,readOnly=true)=>new pg.Client({host:target.host,port:target.port,user:userInfo().username,database,ssl:false,application_name:'praxis_3c_controller',connectionTimeoutMillis:5000,...(readOnly?{options:'-c default_transaction_read_only=on'}:{})});
export async function child(command,args,env,logPath){let text='';const p=spawn(command,args,{env,stdio:['ignore','pipe','pipe']});for(const s of [p.stdout,p.stderr])s.on('data',b=>{text+=b.toString();});const code=await new Promise(resolve=>p.on('close',resolve));writeFileSync(logPath,redact(text));return {exitCode:code};}
export function localEnv(){return {...foundation,DATABASE_URL:connection,PRAXIS_TEST_DATABASE_URL:connection,PRAXIS_RESTAURANT_PROVIDER_MODE:'LIVE_READ',PRAXIS_BROWSER_ENGINE:'LOCAL_CHROMIUM',PRAXIS_ALLOW_LIVE_RESTAURANT_READ:'1',PRAXIS_ALLOW_BROWSER_RUN:'1',PORT:'4312',PGAPPNAME:'praxis_3c_unified_live'};}
export async function verifyEffective(dir){const probe=`const u=new URL(process.env.DATABASE_URL);if(u.protocol!=='postgresql:'||u.hostname!=='127.0.0.1'||u.port!=='5432'||u.pathname!=='/praxis_smoke')throw Error('LOCAL_DATABASE_TARGET_MISMATCH');console.log(JSON.stringify({protocol:u.protocol,host:u.hostname,port:u.port,database:u.pathname.slice(1),testDatabaseSame:process.env.PRAXIS_TEST_DATABASE_URL===process.env.DATABASE_URL,mode:process.env.PRAXIS_RESTAURANT_PROVIDER_MODE,engine:process.env.PRAXIS_BROWSER_ENGINE}));`;
 return child(process.execPath,['--env-file='+envPath,'--input-type=module','-e',probe],localEnv(),dir+'/effective-target.log');}
