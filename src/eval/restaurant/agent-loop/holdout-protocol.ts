import {createHash} from 'node:crypto';
import type {RestaurantCaseView} from '../../../application/agent-workspace.js';
import {readCommittedHoldoutDocuments,type HoldoutCommitment} from './holdout-commitment.js';
import type {G6Case} from './g6/runner.js';
import {canonicalOutletId} from './g6/named-outlet-binding.js';
export const holdoutHash=(v:string|Uint8Array)=>createHash('sha256').update(v).digest('hex');
export type HoldoutCondition={type:'PRESENTED_ANY'|'PRESENTED_WITH_SLOT'|'ASKED_FOR_DATE'}|{type:'TARGET_PRESENTED_WITH_SLOT';target:{provider:'TABELOG'|'TABLECHECK';sourceEntityId:string};time?:string};
export interface PrivateHoldoutCase {
 id:string;fillings:Record<string,string>;request:string;
 followups:Array<{id:string;kind:'MESSAGE'|'PAGE_QUESTION';text:string;condition:HoldoutCondition;allowOtherOutlets?:true}>;
 witness:NonNullable<G6Case['witness']>;oracle:Omit<G6Case['oracle'],'reviewedReadRules'>;
 /** Reviewer-provided backup information stays private and is never auto-sent. */
 fallback?:{location?:string;outlet?:string};
}
export interface PrivateHoldoutManifest {schema:'phase3b-private-run-manifest@1';cases:PrivateHoldoutCase[];}
const refuse=(code:string):never=>{throw Object.assign(new Error(code),{code});};
export function validatePrivateManifest(original:Uint8Array,commitment:HoldoutCommitment,manifestBytes:Uint8Array){
 const documents=readCommittedHoldoutDocuments(original,commitment);
 let manifest:PrivateHoldoutManifest;try{manifest=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(manifestBytes));}catch{return refuse('HOLDOUT_MANIFEST_INVALID');}
 if(manifest.schema!=='phase3b-private-run-manifest@1'||!Array.isArray(manifest.cases)||manifest.cases.length!==commitment.cases.length)refuse('HOLDOUT_MANIFEST_CASES_MISMATCH');
 const cases=manifest.cases.map((c,i)=>{
  if(c.id!==commitment.cases[i]!.id)refuse('HOLDOUT_MANIFEST_ORDER_MISMATCH');
  if(!c.fillings||typeof c.fillings!=='object'||Array.isArray(c.fillings)||!Array.isArray(c.followups)||c.followups.length>2||!c.oracle||!c.witness||c.witness.allowKnownUnavailableCertificate||c.witness.allowDetailOnlyCertificate)refuse('HOLDOUT_MANIFEST_INVALID');
  if(Object.hasOwn(c.oracle,'reviewedReadRules'))refuse('HOLDOUT_MANIFEST_READ_RULES_FORBIDDEN');
  const substitutions=Object.entries(c.fillings);
  if(substitutions.some(([key,value])=>!/^\{[A-Z][A-Z0-9_]*\}$/u.test(key)||typeof value!=='string'||!value.length||!documents[i]!.includes(key))||new Set(substitutions.map(([,v])=>v)).size!==substitutions.length)refuse('HOLDOUT_FILLINGS_INVALID');
  const restored=(message:string)=>{
   if(typeof message!=='string'||!message.trim())refuse('HOLDOUT_TURN_INVALID');
   let result=message;for(const [key,value]of [...substitutions].sort((a,b)=>b[1].length-a[1].length))result=result.replaceAll(value,key);
   if(/\{[A-Z][A-Z0-9_]*\}/u.test(message)||!documents[i]!.includes(result))refuse('HOLDOUT_TURN_NOT_COMMITTED');
  };
  restored(c.request);
  if(new Set(c.followups.map(f=>f.id)).size!==c.followups.length)refuse('HOLDOUT_FOLLOWUP_INVALID');
  for(const f of c.followups){
   if(!f.id||!['MESSAGE','PAGE_QUESTION'].includes(f.kind)||f.allowOtherOutlets!==undefined&&f.allowOtherOutlets!==true)refuse('HOLDOUT_FOLLOWUP_INVALID');
   restored(f.text);validateHoldoutCondition(f.condition);
  }
  if(!Array.isArray(c.oracle.request?.dates)||!c.oracle.request.dates.every(d=>/^\d{4}-\d{2}-\d{2}$/u.test(d))||!Array.isArray(c.oracle.pages))refuse('HOLDOUT_ORACLE_INVALID');
  // A positive independent public witness is supplied by the reviewer, never
  // selected from a product result or silently changed after the run.
  if(c.witness.provider!=='TABELOG'||!/^https:\/\/tabelog\.com\/en\//u.test(c.witness.detailUrl)||!c.witness.identityText?.length)refuse('HOLDOUT_WITNESS_INVALID');
  return {id:c.id,sha256:commitment.cases[i]!.sha256,runSHA256:holdoutHash(JSON.stringify(c)),fillings:{...c.fillings}};
 });
 return {manifest,audit:{schema:'phase3b-holdout-input-hashes@1',manifestSHA256:holdoutHash(manifestBytes),originalSHA256:holdoutHash(original),cases}};
}
export function validateHoldoutCondition(c:HoldoutCondition){
 if(!c||!['PRESENTED_ANY','PRESENTED_WITH_SLOT','TARGET_PRESENTED_WITH_SLOT','ASKED_FOR_DATE'].includes(c.type))refuse('HOLDOUT_CONDITION_INVALID');
 if(c.type==='TARGET_PRESENTED_WITH_SLOT'&&(!c.target||!['TABLECHECK','TABELOG'].includes(c.target.provider)||!c.target.sourceEntityId||c.time!==undefined&&!/^([01]\d|2[0-3]):[0-5]\d$/u.test(c.time)))refuse('HOLDOUT_CONDITION_INVALID');
}
/** Uses structured current presentation and offers, never assistant prose. */
export function holdoutConditionMet(view:RestaurantCaseView,c:HoldoutCondition,at=Date.now()){
 validateHoldoutCondition(c);const ids=view.restaurant.presentedCandidateIds??[];
 if(c.type==='PRESENTED_ANY')return ids.length>0;
 if(c.type==='ASKED_FOR_DATE')return view.case.phase==='NEEDS_INPUT'&&view.restaurant.missingRequiredFields.includes('date');
 return ids.some(id=>{
  const check=view.restaurant.availabilityChecks[id];if(check?.status!=='AVAILABLE')return false;
  const expiry=check.displayExpiresAt??check.expiresAt;if(expiry&&(!Number.isFinite(Date.parse(expiry))||Date.parse(expiry)<=at))return false;
  const offers=view.restaurant.availability[id]??[];
  if(c.type==='PRESENTED_WITH_SLOT')return offers.length>0;
  if(c.type!=='TARGET_PRESENTED_WITH_SLOT')return false;
  const row=view.restaurant.candidates.find(v=>v.restaurant.id===id)?.restaurant;
  const source=row?.sourceIds[c.target.provider.toLowerCase()];
  return Boolean(source&&canonicalOutletId(c.target.provider,source)===canonicalOutletId(c.target.provider,c.target.sourceEntityId)
   &&offers.some(o=>o.source===c.target.provider&&(!c.time||o.dateTime.slice(11,16)===c.time)));
 });
}
/** Full private turns stay in RAM. Verification logs expose hashes only; model
 * request messages are replaced wholesale, while public source observations and
 * decision output retain the existing sanitized recording path. */
export function privateInputRedactor(texts:readonly string[]){
 const variants=[...new Set(texts.flatMap(t=>[t,JSON.stringify(t).slice(1,-1),encodeURIComponent(t)]))].filter(Boolean).sort((a,b)=>b.length-a.length);
 const visit=(value:unknown,key=''):unknown=>{
  if(key==='messages'&&Array.isArray(value)&&value.length>0&&value.every(m=>m&&typeof m==='object'&&['system','user','assistant'].includes(m.role)))return {privateMessagesSHA256:holdoutHash(JSON.stringify(value))};
  if(typeof value==='string'){let s=value;for(const raw of variants)s=s.replaceAll(raw,'[PRIVATE_TURN_SHA256:'+holdoutHash(raw)+']');return s;}
  if(Array.isArray(value))return value.map(v=>visit(v));
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,visit(v,k)]));
  return value;
 };return (value:unknown)=>visit(value);
}
