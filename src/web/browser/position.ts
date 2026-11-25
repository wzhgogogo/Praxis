import type { WorkspaceUi } from './runtime.js';
import { requireUser, requireView, state } from "./runtime.js";
export function key(caseId:string){return 'praxis:workspace:'+requireUser().id+':'+caseId;}
export function savePosition(){if(!state.view)return;sessionStorage.setItem(key(requireView().case.caseId),JSON.stringify({revision:requireView().restaurant.requirementRevision,view:state.ui.view,candidateId:state.ui.candidateId,atEnd:state.ui.atEnd}));localStorage.setItem('praxis:active:'+requireUser().id,requireView().case.caseId);}
export function restorePosition(caseId:string):WorkspaceUi{
 const defaults:WorkspaceUi={view:'CANDIDATES',candidateId:null,reselectSlot:false};
 try{
  const value:unknown=JSON.parse(sessionStorage.getItem(key(caseId))??'null');
  if(!value||typeof value!=='object')return defaults;
  const view='view' in value?value.view:undefined,candidateId='candidateId' in value?value.candidateId:undefined,revision='revision' in value?value.revision:undefined;
  if(typeof revision!=='number'||!Number.isSafeInteger(revision)||revision<0)return defaults;
  if(view!=='CANDIDATES'&&view!=='DETAILS'&&view!=='SAVED'&&view!=='HANDOFF')return defaults;
  return {...defaults,revision,view,candidateId:typeof candidateId==='string'?candidateId:null,atEnd:'atEnd' in value&&value.atEnd===true};
 }catch{return defaults;}
}
