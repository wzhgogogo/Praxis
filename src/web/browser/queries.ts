import { requireView, state } from "./runtime.js";
export function ids(){const r=requireView().restaurant;return requireView().case.phase==='PRESENT_RESULTS'?(r.presentedCandidateIds||[]):r.readyCandidateIds;}
export function candidate(){return state.view&&requireView().restaurant.candidates.find(c=>c.restaurant.id===state.ui.candidateId);}
export function canRefresh(){return !!state.view&&(requireView().case.phase==='PRESENT_RESULTS'||!!requireView().restaurant.readStatus.canRetry);}
export function sourceFor(id:string){const r=requireView().restaurant, check=r.availabilityChecks[id], evidence=new Set(check&&check.evidenceIds||[]);return r.readEvidence.find(e=>e.candidateId===id&&e.sourceUrl&&evidence.has(e.evidenceId))||r.currentFactEvidence.find(e=>e.candidateId===id&&e.sourceUrl);}
export function canShortlist(){return ['SEARCHING','SELECTION_REQUIRED','PRESENT_RESULTS','NO_VERIFIED_RESULT'].includes(state.view?.case.phase??'');}
export function questionPending(){const q=state.view?.restaurant.pageQuestion;return !!q&&!q.result;}
