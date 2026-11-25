import {readFile,writeFile,mkdir,readdir,unlink} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
const source='.eval-artifacts/restaurant-web-read',destination='.eval-artifacts/3c-unified-20261117/user-live-20261118';
// This dictionary is used only to remove secret literals, never injected into process/child configuration.
const dictionary=parseEnv(await readFile('/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.env','utf8'));
const secrets=Object.entries(dictionary).filter(([k,v])=>v&&/KEY|TOKEN|SECRET|PASSWORD|DATABASE_URL|PILOT_ACCESS_JSON|PROXY/.test(k)).map(([,v])=>v).sort((a,b)=>b.length-a.length);
const hash=b=>createHash('sha256').update(b).digest('hex');
function redact(text){for(const value of secrets)text=text.split(value).join('[REDACTED]');return text.replace(/\bsk-[A-Za-z0-9_-]{12,}/g,'[REDACTED_KEY]').replace(/([?&](?:key|api_key|access_token|session_token)=)[^\s&#"<>]+/gi,'$1[REDACTED]').replace(/\bBearer\s+[A-Za-z0-9._~-]+/gi,'Bearer [REDACTED]').replace(/postgres(?:ql)?:\/\/[^\s"'<>]+/g,'[REDACTED_DATABASE_URL]');}
function scrub(value){if(typeof value==='string')return redact(value);if(Array.isArray(value))return value.map(scrub);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([key])=>!/^(?:headers|authorization|cookie|set-cookie|accessToken|sessionToken|apiKey|password|secret|credential)$/i.test(key)).map(([k,v])=>[k,scrub(v)]));return value;}
const files=(await readdir(source)).sort();if(files.length!==20)throw Error('EXPECTED_20_USER_ARTIFACTS');
const starts=[];for(const name of files.filter(n=>n.endsWith('.started.json'))){const value=JSON.parse(await readFile(join(source,name),'utf8'));starts.push({prefix:name.slice(0,-'.started.json'.length),caseId:value.caseId,runId:value.runId});}
if(starts.length!==4)throw Error('EXPECTED_FOUR_RUNS');await mkdir(destination,{recursive:false});
const rows=[];
for(const item of starts){const runFiles=files.filter(n=>n.startsWith(item.prefix));if(runFiles.length!==5)throw Error('EXPECTED_FIVE_FILES_PER_RUN');const dir=join(destination,item.caseId.replace(/[^A-Za-z0-9_-]/g,'-'),item.prefix);await mkdir(dir,{recursive:true});for(const name of runFiles){const raw=await readFile(join(source,name));const clean=name.endsWith('.json')?JSON.stringify(scrub(JSON.parse(raw.toString())),null,2)+'\n':redact(raw.toString());for(const value of secrets)if(clean.includes(value))throw Error('SECRET_REDACTION_FAILED');const target=join(dir,name);await writeFile(target,clean);const saved=await readFile(target);if(hash(saved)!==hash(Buffer.from(clean)))throw Error('ARCHIVE_HASH_MISMATCH');rows.push({caseId:item.caseId,runId:item.runId,source:join(source,name),path:target,rawBytes:raw.length,rawSHA256:hash(raw),sanitizedBytes:saved.length,sanitizedSHA256:hash(saved)});}}
await writeFile(join(destination,'manifest.json'),JSON.stringify({status:'ARCHIVED_REDACTED_HASH_VERIFIED',runs:4,files:20,cases:[...new Set(starts.map(r=>r.caseId))],configurationLoadedIntoEnvironment:false,credentialDictionaryUsedOnlyForRedaction:true,records:rows},null,2)+'\n');
for(const row of rows){const current=await readFile(row.source);if(hash(current)!==row.rawSHA256)throw Error('SOURCE_CHANGED_DURING_ARCHIVE');await unlink(row.source);}
if((await readdir(source)).length)throw Error('TEMP_NOT_EMPTY');console.log(JSON.stringify({runs:4,files:20,cases:2,hashVerified:true,temporaryDirectoryEmpty:true}));
