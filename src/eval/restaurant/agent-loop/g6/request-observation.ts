// Independent outer transport evidence. No Guard decision or production policy
// is consulted, and raw bodies / headers never leave this function.
import {createHash} from 'node:crypto';
import type {G6EvaluationInput} from './evaluator.js';
export type OuterRequestObservation=G6EvaluationInput['requests'][number];
export async function observeOutgoingRequest(ref:string,request:{url():string;method():string;postDataBuffer():Buffer|null;headerValue(name:string):Promise<string|null>}):Promise<OuterRequestObservation>{
 const url=new URL(request.url()),method=request.method(),body=request.postDataBuffer();
 const row:OuterRequestObservation={ref,url:url.origin+url.pathname,method,reachedSource:true,queryKeys:[...url.searchParams.keys()]};
 if(method==='POST'){
  row.contentType=(await request.headerValue('content-type'))??'';
  if(body){row.bodySHA256=createHash('sha256').update(body).digest('hex');
   try{const value:unknown=JSON.parse(body.toString('utf8'));if(value&&typeof value==='object'&&!Array.isArray(value))row.bodyFields=Object.fromEntries(Object.entries(value).map(([key,value])=>[key,value===null?'null':Array.isArray(value)?'array':typeof value]));}catch{/* Missing schema remains nonconforming. */}
  }
 }
 // Called immediately before the outer transport is dispatched. A failed
 // connection cannot prove the receiver saw nothing: conservatively audit it.
 return row;
}
