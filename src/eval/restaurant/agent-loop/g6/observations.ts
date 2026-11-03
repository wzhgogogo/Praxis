import type { BrowserReadRecordingResult } from "../runners/browser-read-recording.js";

/** Requested raw counts only; no diagnostic attribution or production verdict. */
export function recordingQualification(recording:BrowserReadRecordingResult|undefined){
  const pages=recording?.pages??[],qualified=pages.filter(p=>p.status==="REPLAYABLE").length;
  return {schemaVersion:"phase3b-g6-recording-observation@1",status:recording?"RECORDED":"NOT_RECORDED",qualifiedPages:qualified,totalPages:pages.length,ratio:pages.length?qualified/pages.length:null,
    pages:pages.map(p=>({snapshot:p.snapshot,...(p.url?{url:p.url}:{}),qualified:p.status==="REPLAYABLE",reason:p.reason,diagnostic:p.diagnostic})),
    recordingPath:recording?.path??null,replayStatus:recording?.replay.status??null};
}

export interface ReadStartObservation {atMs:number;kind:"READ"|"TERMS_READ"|"TERMS_MODEL"|"CONCLUSION_MODEL";purpose:string;deadlineAtMs:number;turnId?:string;}
export function reserveObservations(startedAtMs:number,finishedAtMs:number,starts:readonly ReadStartObservation[],requests:readonly {reachedSource:boolean;forbidden:boolean}[]){
  const late=starts.filter(s=>s.kind!=="CONCLUSION_MODEL"&&s.atMs>=s.deadlineAtMs-20_000);
  return {schemaVersion:"phase3b-g6-boundary-observation@1",elapsedMs:finishedAtMs-startedAtMs,exceeded500Seconds:finishedAtMs-startedAtMs>500_000,
    sourceReadsStartedInReserve:late.filter(s=>s.kind==="READ").length,termsWorkStartedInReserve:late.filter(s=>s.kind==="TERMS_READ"||s.kind==="TERMS_MODEL").length,
    forbiddenRequestsReachedSource:requests.filter(r=>r.reachedSource&&r.forbidden).length,readStarts:[...starts]};
}
